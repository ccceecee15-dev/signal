import type { NewsCategory, NewsPerspective } from "@workspace/api-zod";

export type NewsFeed = {
  id: string;
  name: string;
  url: string;
  sourceUrl: string;
  category: NewsCategory;
  // Add a perspective only when Signal explicitly configures one. All current
  // publishers intentionally remain unclassified.
  perspective?: NewsPerspective;
};

// Add an RSS source here with its publisher name, feed URL, homepage, and
// category. The server normalizes each entry before the browser sees it.
export const NEWS_FEEDS: readonly NewsFeed[] = [
  {
    id: "bbc-world",
    name: "BBC News",
    url: "https://feeds.bbci.co.uk/news/world/rss.xml",
    sourceUrl: "https://www.bbc.com/news",
    category: "international",
  },
  {
    id: "npr-world",
    name: "NPR",
    url: "https://feeds.npr.org/1004/rss.xml",
    sourceUrl: "https://www.npr.org/sections/world",
    category: "international",
  },
  {
    id: "bbc-india",
    name: "BBC News",
    url: "https://feeds.bbci.co.uk/news/world/asia/india/rss.xml",
    sourceUrl: "https://www.bbc.com/news/world/asia/india",
    category: "india",
  },
  {
    id: "the-hindu-india",
    name: "The Hindu",
    url: "https://www.thehindu.com/news/national/feeder/default.rss",
    sourceUrl: "https://www.thehindu.com",
    category: "india",
  },
  {
    id: "bbc-us-canada",
    name: "BBC News",
    url: "https://feeds.bbci.co.uk/news/world/us_and_canada/rss.xml",
    sourceUrl: "https://www.bbc.com/news/world/us_and_canada",
    category: "united-states",
  },
  {
    id: "npr-national",
    name: "NPR",
    url: "https://feeds.npr.org/1003/rss.xml",
    sourceUrl: "https://www.npr.org/sections/national",
    category: "united-states",
  },
  {
    id: "bbc-technology",
    name: "BBC News",
    url: "https://feeds.bbci.co.uk/news/technology/rss.xml",
    sourceUrl: "https://www.bbc.com/news/technology",
    category: "technology",
  },
  {
    id: "npr-technology",
    name: "NPR",
    url: "https://feeds.npr.org/1019/rss.xml",
    sourceUrl: "https://www.npr.org/sections/technology",
    category: "technology",
  },
];