import { Router, type IRouter } from "express";
import {
  GetNewsByIdParams,
  GetNewsByIdResponse,
  GetNewsQueryParams,
  GetNewsResponse,
} from "@workspace/api-zod";
import { NEWS_FEEDS } from "../feeds/news-sources";
import { getNewsArticle, getNewsFeedData } from "../services/news-service";

const router: IRouter = Router();

// These endpoints are the browser's only interface to news feeds: feed URLs,
// failures, and source-specific XML formats stay on the server.
router.get("/news", async (req, res): Promise<void> => {
  const forceRefresh = req
    .get("cache-control")
    ?.split(",")
    .some((directive) => directive.trim().toLowerCase() === "no-cache") ?? false;
  req.log.info({ forceRefresh }, "[RSS] API request: GET /api/news");
  const params = GetNewsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: "Category must be a supported news category." });
    return;
  }

  const result = await getNewsFeedData(forceRefresh);
  const category = params.data.category;
  const articles = category
    ? result.articles.filter((article) => article.category === category)
    : result.articles;

  const failedFeedIds = new Set(result.failures.map((failure) => failure.feedId));
  const relevantFeeds = category
    ? NEWS_FEEDS.filter((feed) => feed.category === category)
    : NEWS_FEEDS;
  const failedSourceCount = relevantFeeds.filter((feed) =>
    failedFeedIds.has(feed.id),
  ).length;

  if (result.failures.length > 0) {
    req.log.warn(
      { failures: result.failures },
      "Some RSS sources could not be refreshed",
    );
  }

  res.json(GetNewsResponse.parse({ articles, failedSourceCount }));
});

router.get("/news/:id", async (req, res): Promise<void> => {
  const params = GetNewsByIdParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Article ID is invalid." });
    return;
  }

  const article = await getNewsArticle(params.data.id);
  if (!article) {
    res.status(404).json({ error: "Article not found." });
    return;
  }

  res.json(GetNewsByIdResponse.parse(article));
});

export default router;