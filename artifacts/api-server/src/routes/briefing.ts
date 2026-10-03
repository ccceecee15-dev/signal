import { Router, type IRouter } from "express";
import {
  GetBriefingResponse,
  RefreshBriefingResponse,
} from "@workspace/api-zod";
import { getNewsFeedData } from "../services/news-service";
import {
  BriefingConfigurationError,
  BriefingProviderError,
} from "../services/briefing-provider";
import { briefingService } from "../services/briefing-service";

const router: IRouter = Router();

let latestBriefing = GetBriefingResponse.parse({
  generatedAt: null,
  topStories: [],
  alsoHappening: [],
});
let refreshInFlight: Promise<typeof latestBriefing> | undefined;

router.get("/briefing", (_req, res): void => {
  res.json(GetBriefingResponse.parse(latestBriefing));
});

router.post("/briefing/refresh", async (req, res): Promise<void> => {
  req.log.info("[Briefing] Manual refresh requested");
  if (!refreshInFlight) {
    refreshInFlight = getNewsFeedData(true)
      .then(({ articles }) => briefingService.generate(articles))
      .then((briefing) => {
        latestBriefing = briefing;
        return briefing;
      });
  }

  try {
    res.json(RefreshBriefingResponse.parse(await refreshInFlight));
  } catch (error) {
    req.log.error({ err: error }, "[Briefing] Refresh failed");
    const statusCode =
      error instanceof BriefingConfigurationError ||
      error instanceof BriefingProviderError
        ? error.statusCode
        : 502;
    res.status(statusCode).json({
      error:
        error instanceof Error
          ? error.message
          : "Briefing refresh failed. Please try again.",
    });
  } finally {
    refreshInFlight = undefined;
  }
});

export default router;