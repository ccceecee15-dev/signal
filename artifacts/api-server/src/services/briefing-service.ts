import { createHash } from "node:crypto";
import type {
  BriefingResponse,
  BriefingStory,
  NewsArticle,
  NewsCategory,
} from "@workspace/api-zod";
import { RefreshBriefingResponse } from "@workspace/api-zod";
import {
  BriefingConfigurationError,
  OpenAICompatibleBriefingProvider,
  type BriefingCandidate,
  type BriefingProvider,
} from "./briefing-provider";

type ArticleCluster = {
  id: string;
  articles: NewsArticle[];
  category: NewsCategory;
  categories: Set<NewsCategory>;
  sourceCount: number;
  latestPublishedAt: Date | null;
  firstPublishedAt: Date | null;
  signalScore: number;
};

const ignoredTitleWords = new Set([
  "after", "amid", "among", "around", "before", "could", "from", "have",
  "into", "more", "over", "says", "that", "their", "there", "these", "this",
  "those", "today", "with", "would", "will", "what", "when", "where", "which",
  "while", "about", "report", "reports", "live", "latest", "update", "updates",
]);

const maxCandidateCount = 18;
const maxBriefedStoryCount = 12;
const topStoryCount = 6;
const recentArticleWindowMs = 72 * 60 * 60 * 1000;

function articleDate(article: NewsArticle): Date | null {
  if (!article.publishedAt) return null;
  const date = new Date(String(article.publishedAt));
  return Number.isFinite(date.getTime()) ? date : null;
}

function titleTokens(title: string): Set<string> {
  return new Set(
    title
      .normalize("NFKC")
      .toLocaleLowerCase("en")
      .replace(/[^\p{L}\p{N}]+/gu, " ")
      .split(/\s+/)
      .map((token) => {
        if (token.length > 5 && token.endsWith("ing")) return token.slice(0, -3);
        if (token.length > 4 && token.endsWith("ed")) return token.slice(0, -2);
        if (token.length > 4 && token.endsWith("es")) return token.slice(0, -2);
        if (token.length > 3 && token.endsWith("s")) return token.slice(0, -1);
        return token;
      })
      .filter((token) => token.length > 2 && !ignoredTitleWords.has(token)),
  );
}

function titlesDescribeSameStory(left: string, right: string): boolean {
  const leftTokens = titleTokens(left);
  const rightTokens = titleTokens(right);
  const sharedCount = [...leftTokens].filter((token) => rightTokens.has(token)).length;
  const smallerTitleTokenCount = Math.min(leftTokens.size, rightTokens.size);
  if (sharedCount < 2 || smallerTitleTokenCount === 0) return false;

  const containment = sharedCount / smallerTitleTokenCount;
  const unionCount = new Set([...leftTokens, ...rightTokens]).size;
  const overlap = sharedCount / unionCount;
  return containment >= 0.67 && overlap >= 0.4;
}

function stableClusterId(articles: NewsArticle[]): string {
  const articleIds = articles.map((article) => article.id).sort();
  return createHash("sha256").update(articleIds.join("\u001f")).digest("hex").slice(0, 24);
}

function deduplicateArticles(articles: NewsArticle[]): NewsArticle[] {
  const byId = new Map<string, NewsArticle>();
  for (const article of articles) {
    if (article.title.trim() && article.url.trim()) byId.set(article.id, article);
  }
  return [...byId.values()];
}

function makeClusters(articles: NewsArticle[], now: Date): ArticleCluster[] {
  const eligibleArticles = deduplicateArticles(articles).filter((article) => {
    const publishedAt = articleDate(article);
    return !publishedAt || now.getTime() - publishedAt.getTime() <= recentArticleWindowMs;
  });
  eligibleArticles.sort(
    (left, right) =>
      (articleDate(right)?.getTime() ?? 0) - (articleDate(left)?.getTime() ?? 0),
  );

  const groups: NewsArticle[][] = [];
  for (const article of eligibleArticles) {
    const matchingGroup = groups.find((group) =>
      titlesDescribeSameStory(article.title, group[0].title),
    );
    if (matchingGroup) matchingGroup.push(article);
    else groups.push([article]);
  }

  return groups.map((group) => {
    const datedArticles = group
      .map((article) => ({ article, date: articleDate(article) }))
      .filter((entry): entry is { article: NewsArticle; date: Date } => Boolean(entry.date));
    const latestPublishedAt = datedArticles[0]?.date ?? null;
    const firstPublishedAt = datedArticles.at(-1)?.date ?? null;
    const uniqueSources = new Set(group.map((article) => article.source));
    const categories = new Set(group.map((article) => article.category));
    const recentSourceCount = new Set(
      datedArticles
        .filter(({ date }) => now.getTime() - date.getTime() <= 12 * 60 * 60 * 1000)
        .map(({ article }) => article.source),
    ).size;
    const ageHours = latestPublishedAt
      ? Math.max(0, (now.getTime() - latestPublishedAt.getTime()) / (60 * 60 * 1000))
      : 72;
    const sourceSignal = Math.min(28, 8 + Math.max(0, uniqueSources.size - 1) * 10);
    const recencySignal = Math.max(0, 28 * (1 - ageHours / 72));
    const categorySignal = Math.min(14, Math.max(0, categories.size - 1) * 7);
    const developmentSignal = Math.min(8, recentSourceCount * 2);
    const reportSignal = Math.min(8, Math.max(0, group.length - uniqueSources.size) * 2);
    const representative = datedArticles[0]?.article ?? group[0];

    return {
      id: stableClusterId(group),
      articles: group,
      category: representative.category,
      categories,
      sourceCount: uniqueSources.size,
      latestPublishedAt,
      firstPublishedAt,
      signalScore: Math.round(
        sourceSignal + recencySignal + categorySignal + developmentSignal + reportSignal,
      ),
    };
  });
}

function candidateFor(cluster: ArticleCluster): BriefingCandidate {
  return {
    id: cluster.id,
    category: cluster.category,
    signalScore: cluster.signalScore,
    sourceCount: cluster.sourceCount,
    categories: [...cluster.categories],
    sources: cluster.articles.map((article) => ({
      title: article.title,
      source: article.source,
      description: article.description.slice(0, 260),
      publishedAt: articleDate(article)?.toISOString() ?? null,
    })),
  };
}

export class BriefingService {
  constructor(
    private readonly provider: BriefingProvider = new OpenAICompatibleBriefingProvider(),
  ) {}

  async generate(articles: NewsArticle[]): Promise<BriefingResponse> {
    const generatedAt = new Date();
    const clusters = makeClusters(articles, generatedAt)
      .sort((left, right) => right.signalScore - left.signalScore)
      .slice(0, maxCandidateCount);

    if (clusters.length === 0) {
      throw new BriefingConfigurationError(
        "There are no recent RSS articles available to build a briefing.",
      );
    }

    const candidates = clusters.map(candidateFor);
    const generatedStories = await this.provider.summarize(candidates);
    const clustersById = new Map(clusters.map((cluster) => [cluster.id, cluster]));
    const stories: BriefingStory[] = generatedStories
      .filter((generated) => clustersById.has(generated.candidateId))
      .map((generated) => {
        const cluster = clustersById.get(generated.candidateId)!;
        const story = {
          id: cluster.id,
          title: generated.title,
          summary: generated.summary,
          whyItMatters: generated.whyItMatters,
          category: cluster.category,
          signalScore: Math.round(
            cluster.signalScore * 0.75 + generated.relevanceScore * 0.25,
          ),
          articleIds: cluster.articles.map((article) => article.id),
          sourceCount: cluster.sourceCount,
          sources: cluster.articles.map((article) => ({
            id: article.id,
            title: article.title,
            source: article.source,
            url: article.url,
            publishedAt: articleDate(article),
          })),
          firstPublishedAt: cluster.firstPublishedAt,
          updatedAt: cluster.latestPublishedAt ?? generatedAt,
        } satisfies BriefingStory;
        return story;
      })
      .sort((left, right) => right.signalScore - left.signalScore)
      .slice(0, maxBriefedStoryCount);

    const response: BriefingResponse = {
      generatedAt,
      topStories: stories.slice(0, topStoryCount),
      alsoHappening: stories.slice(topStoryCount),
    };
    return RefreshBriefingResponse.parse(response);
  }
}

export const briefingService = new BriefingService();