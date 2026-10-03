import type { NewsArticle } from "@workspace/api-zod";
import { config } from "../lib/config";
import { NEWS_FEEDS, type NewsFeed } from "../feeds/news-sources";
import { normalizeFeedXml } from "../utils/rss-normalizer";

export type NewsFeedFailure = {
  feedId: string;
  source: string;
  message: string;
};

export type NewsFeedData = {
  articles: NewsArticle[];
  failures: NewsFeedFailure[];
};

type CachedNews = {
  expiresAt: number;
  data: NewsFeedData;
};

let cachedNews: CachedNews | undefined;
let pendingRefresh: Promise<NewsFeedData> | undefined;

async function readFeed(feed: NewsFeed): Promise<NewsArticle[]> {
  const response = await fetch(feed.url, {
    headers: {
      accept: "application/rss+xml, application/atom+xml, application/xml, text/xml",
      "user-agent": "SignalNews/1.0 (+RSS reader)",
    },
    signal: AbortSignal.timeout(config.news.feedTimeoutMs),
  });

  if (!response.ok) {
    throw new Error(`Feed returned HTTP ${response.status}.`);
  }

  const xml = await response.text();
  return normalizeFeedXml(xml, feed).slice(0, config.news.maxItemsPerFeed);
}

async function refreshFeeds(): Promise<NewsFeedData> {
  const results = await Promise.all(
    NEWS_FEEDS.map(async (feed) => {
      try {
        return { feed, articles: await readFeed(feed) };
      } catch (error) {
        return {
          feed,
          articles: [],
          failure: {
            feedId: feed.id,
            source: feed.name,
            message:
              error instanceof Error ? error.message : "Unknown feed error.",
          },
        };
      }
    }),
  );

  const articlesById = new Map<string, NewsArticle>();
  const failures: NewsFeedFailure[] = [];
  for (const result of results) {
    if ("failure" in result) {
      failures.push(result.failure);
      continue;
    }
    for (const article of result.articles) {
      // The article ID is derived from normalized title, source, and URL. This
      // removes exact duplicates without clustering separate reports.
      articlesById.set(article.id, article);
    }
  }

  const articles = [...articlesById.values()].sort((a, b) => {
    const aTime = a.publishedAt ? Date.parse(a.publishedAt) : 0;
    const bTime = b.publishedAt ? Date.parse(b.publishedAt) : 0;
    return bTime - aTime;
  });

  return { articles, failures };
}

// Requests share a short server-side cache and one in-flight refresh. A
// partially failed refresh is retried sooner; one unavailable publisher never
// blocks results from the rest.
export async function getNewsFeedData(): Promise<NewsFeedData> {
  if (cachedNews && cachedNews.expiresAt > Date.now()) {
    return cachedNews.data;
  }
  if (pendingRefresh) return pendingRefresh;

  const refresh = refreshFeeds();
  pendingRefresh = refresh;
  try {
    const data = await refresh;
    cachedNews = {
      data,
      expiresAt:
        Date.now() +
        (data.failures.length
          ? Math.min(config.news.cacheTtlMs, 30_000)
          : config.news.cacheTtlMs),
    };
    return data;
  } finally {
    pendingRefresh = undefined;
  }
}

export async function getNewsArticle(id: string): Promise<NewsArticle | undefined> {
  const data = await getNewsFeedData();
  return data.articles.find((article) => article.id === id);
}