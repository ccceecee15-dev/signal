import { createHash } from "node:crypto";
import { XMLParser, XMLValidator } from "fast-xml-parser";
import type { NewsArticle } from "@workspace/api-zod";
import { config } from "../lib/config";
import type { NewsFeed } from "../feeds/news-sources";

type XmlRecord = Record<string, unknown>;

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  parseTagValue: false,
  parseAttributeValue: false,
  trimValues: true,
});

function asRecord(value: unknown): XmlRecord | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as XmlRecord)
    : undefined;
}

function asArray(value: unknown): unknown[] {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

function nodeText(value: unknown): string {
  if (typeof value === "string" || typeof value === "number") {
    return String(value).trim();
  }
  if (Array.isArray(value)) {
    return value.map(nodeText).filter(Boolean).join(" ");
  }

  const record = asRecord(value);
  if (!record) return "";
  for (const key of ["#text", "__cdata", "#cdata"]) {
    const text = record[key];
    if (typeof text === "string" || typeof text === "number") {
      return String(text).trim();
    }
  }
  return "";
}

function decodeHtmlEntities(value: string): string {
  const namedEntities: Record<string, string> = {
    amp: "&",
    apos: "'",
    copy: "©",
    gt: ">",
    hellip: "…",
    ldquo: "“",
    lsquo: "‘",
    lt: "<",
    mdash: "—",
    nbsp: " ",
    ndash: "–",
    quot: '"',
    rdquo: "”",
    reg: "®",
    rsquo: "’",
    trade: "™",
  };

  return value
    .replace(/&#(\d+);/g, (_match, decimal: string) =>
      String.fromCodePoint(Number(decimal)),
    )
    .replace(/&#x([0-9a-f]+);/gi, (_match, hexadecimal: string) =>
      String.fromCodePoint(Number.parseInt(hexadecimal, 16)),
    )
    .replace(/&([a-z]+);/gi, (match, name: string) =>
      namedEntities[name.toLowerCase()] ?? match,
    );
}

function plainText(value: unknown): string {
  const raw = nodeText(value);
  return decodeHtmlEntities(
    raw
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<\/(p|div|li|h[1-6])\s*>/gi, " ")
      .replace(/<[^>]*>/g, " "),
  ).replace(/\s+/g, " ").trim();
}

function normalizeUrl(value: unknown, baseUrl: string): string | undefined {
  const raw = nodeText(value);
  if (!raw) return undefined;

  try {
    const url = new URL(raw, baseUrl);
    if (
      (url.protocol !== "https:" && url.protocol !== "http:") ||
      url.username ||
      url.password
    ) {
      return undefined;
    }

    for (const key of [...url.searchParams.keys()]) {
      if (/^utm_/i.test(key) || /^at_(campaign|medium)$/i.test(key)) {
        url.searchParams.delete(key);
      }
    }
    url.hash = "";
    url.pathname = url.pathname.replace(/\/+$/, "") || "/";
    return url.toString();
  } catch {
    return undefined;
  }
}

function atomOrRssLink(value: unknown): string {
  for (const candidate of asArray(value)) {
    const record = asRecord(candidate);
    if (!record) {
      const text = nodeText(candidate);
      if (text) return text;
      continue;
    }

    const rel = nodeText(record["@_rel"]);
    const href = nodeText(record["@_href"]);
    if (href && (!rel || rel === "alternate")) return href;
  }
  return "";
}

function imageUrlFor(item: XmlRecord, baseUrl: string): string | undefined {
  for (const key of ["media:thumbnail", "media:content", "enclosure"]) {
    for (const node of asArray(item[key])) {
      const record = asRecord(node);
      if (!record) continue;

      const mediaType = nodeText(record["@_type"]);
      const medium = nodeText(record["@_medium"]);
      if (mediaType && !mediaType.startsWith("image/") && medium !== "image") {
        continue;
      }

      const url = normalizeUrl(record["@_url"], baseUrl);
      if (url) return url;
    }
  }

  const html = nodeText(item["content:encoded"]) || nodeText(item.description);
  const imageMatch = html.match(/<img\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/i);
  return imageMatch ? normalizeUrl(imageMatch[1], baseUrl) : undefined;
}

function publishedAtFor(item: XmlRecord, isAtom: boolean): string | null {
  const rawDate = nodeText(
    isAtom
      ? item.published || item.updated
      : item.pubDate || item["dc:date"] || item.date,
  );
  if (!rawDate) return null;

  const timestamp = Date.parse(rawDate);
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null;
}

function stableArticleId(source: string, title: string, url: string): string {
  const normalizedTitle = title
    .normalize("NFKC")
    .toLocaleLowerCase("en")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
  const normalizedSource = source.normalize("NFKC").toLocaleLowerCase("en").trim();
  const normalizedUrl = new URL(url);
  normalizedUrl.hostname = normalizedUrl.hostname.toLocaleLowerCase("en");
  const duplicateKey = [
    normalizedTitle,
    normalizedSource,
    normalizedUrl.toString(),
  ].join("\u001f");

  return createHash("sha256").update(duplicateKey).digest("hex").slice(0, 24);
}

function normalizeItem(
  rawItem: unknown,
  feed: NewsFeed,
  isAtom: boolean,
): NewsArticle | undefined {
  const item = asRecord(rawItem);
  if (!item) return undefined;

  const title = plainText(item.title).slice(0, 300);
  const rawLink = isAtom
    ? atomOrRssLink(item.link)
    : nodeText(item.link) || atomOrRssLink(item.link);
  const url = normalizeUrl(rawLink, feed.sourceUrl);
  if (!title || !url) return undefined;

  const rawDescription =
    item["content:encoded"] ||
    item.description ||
    item.summary ||
    item.content;

  return {
    id: stableArticleId(feed.name, title, url),
    title,
    description: plainText(rawDescription).slice(0, 800),
    url,
    source: feed.name,
    sourceUrl: feed.sourceUrl,
    publishedAt: publishedAtFor(item, isAtom),
    category: feed.category,
    ...(imageUrlFor(item, feed.sourceUrl)
      ? { imageUrl: imageUrlFor(item, feed.sourceUrl) }
      : {}),
    // Do not infer a publisher's political perspective from its feed content.
    perspective: feed.perspective ?? "unknown",
  };
}

// The API accepts RSS 2.x and Atom XML, but both are converted to the same
// NewsArticle shape before they leave the server.
export function normalizeFeedXml(xml: string, feed: NewsFeed): NewsArticle[] {
  if (Buffer.byteLength(xml, "utf8") > config.news.maxXmlBytes) {
    throw new Error("RSS response exceeded the configured size limit.");
  }

  const validation = XMLValidator.validate(xml);
  if (validation !== true) {
    throw new Error("RSS response was not valid XML.");
  }

  const document = asRecord(parser.parse(xml));
  if (!document) {
    throw new Error("RSS response did not contain an XML document.");
  }

  const rss = asRecord(document.rss);
  if (rss) {
    const channel = asRecord(rss.channel);
    if (!channel) throw new Error("RSS document did not contain a channel.");
    return asArray(channel.item)
      .map((item) => normalizeItem(item, feed, false))
      .filter((item): item is NewsArticle => Boolean(item));
  }

  const atom = asRecord(document.feed);
  if (atom) {
    return asArray(atom.entry)
      .map((entry) => normalizeItem(entry, feed, true))
      .filter((item): item is NewsArticle => Boolean(item));
  }

  throw new Error("RSS response used an unsupported feed format.");
}