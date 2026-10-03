function readInteger(
  name: string,
  fallback: number,
  minimum: number,
  maximum: number,
): number {
  const rawValue = process.env[name];
  if (rawValue === undefined || rawValue.trim() === "") {
    return fallback;
  }

  const value = Number(rawValue);
  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    throw new Error(
      `${name} must be an integer between ${minimum} and ${maximum}.`,
    );
  }

  return value;
}

// Keep operational settings in one place. They can be supplied as environment
// variables; the RSS sources themselves are public and need no credentials.
export const config = {
  news: {
    feedTimeoutMs: readInteger("NEWS_FEED_TIMEOUT_MS", 10_000, 1_000, 60_000),
    cacheTtlMs: readInteger("NEWS_CACHE_TTL_MS", 180_000, 5_000, 3_600_000),
    maxItemsPerFeed: readInteger("NEWS_MAX_ITEMS_PER_FEED", 30, 1, 100),
    maxXmlBytes: readInteger("NEWS_MAX_XML_BYTES", 2_000_000, 100_000, 5_000_000),
  },
} as const;