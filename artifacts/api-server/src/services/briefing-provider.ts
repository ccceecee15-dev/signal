import { z } from "zod";

export type BriefingCandidate = {
  id: string;
  category: string;
  signalScore: number;
  sourceCount: number;
  categories: string[];
  sources: Array<{
    title: string;
    source: string;
    description: string;
    publishedAt: string | null;
  }>;
};

export type GeneratedStory = {
  candidateId: string;
  title: string;
  summary: string;
  whyItMatters: string;
  relevanceScore: number;
};

const ModelResponse = z.object({
  stories: z.array(
    z.object({
      candidateId: z.string(),
      title: z.string().trim().min(1).max(180),
      summary: z.string().trim().min(1).max(700),
      whyItMatters: z.string().trim().min(1).max(260),
      relevanceScore: z.number().min(0).max(100),
    }),
  ).max(12),
});

export class BriefingConfigurationError extends Error {
  readonly statusCode = 503;

  constructor(message: string) {
    super(message);
    this.name = "BriefingConfigurationError";
  }
}

export class BriefingProviderError extends Error {
  readonly statusCode = 502;

  constructor(message: string) {
    super(message);
    this.name = "BriefingProviderError";
  }
}

export interface BriefingProvider {
  summarize(candidates: BriefingCandidate[]): Promise<GeneratedStory[]>;
}

export class OpenAICompatibleBriefingProvider implements BriefingProvider {
  async summarize(candidates: BriefingCandidate[]): Promise<GeneratedStory[]> {
    const apiKey = process.env.AI_API_KEY;
    if (!apiKey) {
      throw new BriefingConfigurationError(
        "Briefing generation is not configured. Set AI_API_KEY on the server.",
      );
    }

    const endpoint = process.env.AI_API_URL ?? "https://api.openai.com/v1/chat/completions";
    const model = process.env.AI_MODEL ?? "gpt-4o-mini";
    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: "POST",
        headers: {
          authorization: `Bearer ${apiKey}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model,
          temperature: 0.2,
          max_tokens: 5_000,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content:
                "You are Signal's neutral news editor. You receive pre-clustered RSS headlines and short publisher-provided snippets, not full articles. Return JSON only, shaped as {stories:[{candidateId,title,summary,whyItMatters,relevanceScore}]}. Select at most 12 well-supported distinct stories and omit any cluster whose evidence is too thin. Never add facts, statistics, motives, or political judgments not supported by the supplied titles and snippets. Summary must be 2 or 3 concise factual sentences. whyItMatters must be one cautious sentence explaining plausible public relevance, not asserting an outcome. relevanceScore is a relative editorial signal from 0 to 100, not objective importance. Keep candidateId exactly as supplied.",
            },
            {
              role: "user",
              content: JSON.stringify({
                candidates: candidates.map((candidate) => ({
                  id: candidate.id,
                  category: candidate.category,
                  sourceCount: candidate.sourceCount,
                  categories: candidate.categories,
                  signalScore: candidate.signalScore,
                  sources: candidate.sources.slice(0, 3).map((source) => ({
                    title: source.title,
                    publication: source.source,
                    snippet: source.description.slice(0, 220),
                    publishedAt: source.publishedAt,
                  })),
                })),
              }),
            },
          ],
        }),
        signal: AbortSignal.timeout(45_000),
      });
    } catch (error) {
      throw new BriefingProviderError(
        error instanceof Error ? error.message : "AI provider request failed.",
      );
    }

    if (!response.ok) {
      throw new BriefingProviderError(
        `AI provider returned HTTP ${response.status}.`,
      );
    }

    let payload: unknown;
    try {
      payload = await response.json();
      const content = (payload as {
        choices?: Array<{ message?: { content?: unknown } }>;
      }).choices?.[0]?.message?.content;
      if (typeof content !== "string") {
        throw new Error("AI provider returned no text content.");
      }
      const parsed: unknown = JSON.parse(content);
      return ModelResponse.parse(parsed).stories;
    } catch (error) {
      throw new BriefingProviderError(
        error instanceof Error
          ? `Could not validate AI response: ${error.message}`
          : "Could not validate AI response.",
      );
    }
  }
}