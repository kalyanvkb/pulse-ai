// backend/fetcher.js — Fetches and normalizes RSS feeds + fallback scraping

const Parser = require("rss-parser");
const axios = require("axios");
const cheerio = require("cheerio");
const crypto = require("crypto");

const parser = new Parser({
  timeout: 10000,
  headers: {
    "User-Agent": "Mozilla/5.0 (compatible; PulseAI-NewsBot/1.0)",
    Accept: "application/rss+xml, application/xml, text/xml, */*",
  },
  customFields: {
    item: [
      ["media:thumbnail", "mediaThumbnail"],
      ["media:content", "mediaContent"],
      ["enclosure", "enclosure"],
    ],
  },
});

const RATE_LIMIT_MS = 1000; // 1 req/sec per domain
const MAX_ARTICLES_PER_SOURCE = 8;

/**
 * Generate a stable ID from a URL or title string
 * @param {string} str
 * @returns {string}
 */
function makeId(str) {
  return crypto.createHash("md5").update(str).digest("hex").slice(0, 16);
}

/**
 * Strip HTML tags and decode basic entities
 * @param {string} html
 * @returns {string}
 */
function stripHtml(html = "") {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/**
 * Extract thumbnail URL from an RSS item
 * @param {object} item
 * @returns {string}
 */
function extractImage(item) {
  if (item.mediaThumbnail?.["$"]?.url) return item.mediaThumbnail["$"].url;
  if (item.mediaContent?.["$"]?.url) return item.mediaContent["$"].url;
  if (item.enclosure?.url) return item.enclosure.url;
  const imgMatch = (item.content || item["content:encoded"] || "").match(
    /<img[^>]+src=["']([^"']+)["']/i
  );
  if (imgMatch) return imgMatch[1];
  return "";
}

/**
 * Normalize a raw RSS item into our unified article schema
 * @param {object} item - rss-parser item
 * @param {object} source - source config
 * @returns {object}
 */
function normalizeItem(item, source) {
  const url = item.link || item.guid || "";
  const title = stripHtml(item.title || "").slice(0, 200);
  const rawContent = stripHtml(
    item["content:encoded"] || item.content || item.contentSnippet || item.summary || ""
  ).slice(0, 800);
  const fetchedAt = new Date().toISOString();

  return {
    id: makeId(url || title),
    title,
    url,
    publishedAt: item.pubDate || item.isoDate || new Date().toISOString(),
    fetchedAt,
    source: source.name,
    group: source.group,
    color: source.color,
    logoUrl: source.logoUrl,
    rawContent,
    imageUrl: extractImage(item),
    summary: null, // filled in by summarizer
  };
}

/**
 * Fetch and parse a single RSS source
 * @param {object} source - source config from sources.config.js
 * @returns {Promise<object[]>} - array of normalized articles
 */
async function fetchRSS(source) {
  try {
    const feed = await parser.parseURL(source.rssUrl);
    const articles = (feed.items || [])
      .slice(0, MAX_ARTICLES_PER_SOURCE)
      .map((item) => normalizeItem(item, source))
      .filter((a) => a.title && a.url);
    console.log(`  ✓ ${source.name}: ${articles.length} articles (RSS)`);
    return articles;
  } catch (err) {
    console.warn(`  ✗ ${source.name} RSS failed: ${err.message}`);
    return null; // signal to try scraper
  }
}

/**
 * Fallback scraper using Cheerio for sources without working RSS
 * @param {object} source
 * @returns {Promise<object[]>}
 */
async function scrapeFallback(source) {
  try {
    await new Promise((r) => setTimeout(r, RATE_LIMIT_MS));
    const { data } = await axios.get(source.fallbackScrapeUrl, {
      timeout: 10000,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; PulseAI-NewsBot/1.0)",
        Accept: "text/html",
      },
    });

    const $ = cheerio.load(data);
    const articles = [];

    // Generic selectors that work on most blog/news listing pages
    const selectors = [
      "article",
      '[class*="post"]',
      '[class*="card"]',
      '[class*="story"]',
      '[class*="item"]',
    ];

    for (const sel of selectors) {
      $(sel).each((i, el) => {
        if (i >= MAX_ARTICLES_PER_SOURCE || articles.length >= MAX_ARTICLES_PER_SOURCE) return;
        const titleEl = $(el).find("h1, h2, h3, h4").first();
        const linkEl = $(el).find("a").first();
        const title = titleEl.text().trim();
        let url = linkEl.attr("href") || "";
        if (url && !url.startsWith("http")) {
          const base = new URL(source.fallbackScrapeUrl);
          url = base.origin + (url.startsWith("/") ? url : "/" + url);
        }
        const excerpt = $(el).find("p").first().text().trim().slice(0, 400);
        const img = $(el).find("img").first().attr("src") || "";

        if (title && url && title.length > 10) {
          const fetchedAt = new Date().toISOString();
          articles.push({
            id: makeId(url || title),
            title: title.slice(0, 200),
            url,
            publishedAt: new Date().toISOString(),
            fetchedAt,
            source: source.name,
            group: source.group,
            color: source.color,
            logoUrl: source.logoUrl,
            rawContent: excerpt,
            imageUrl: img,
            summary: null,
          });
        }
      });
      if (articles.length > 0) break;
    }

    console.log(`  ✓ ${source.name}: ${articles.length} articles (scrape)`);
    return articles;
  } catch (err) {
    console.warn(`  ✗ ${source.name} scrape also failed: ${err.message}`);
    return [];
  }
}

/**
 * Fetch one source — tries RSS first, falls back to scraper
 * @param {object} source
 * @returns {Promise<object[]>}
 */
async function fetchSource(source) {
  const rssResult = await fetchRSS(source);
  if (rssResult !== null) return rssResult;
  return scrapeFallback(source);
}

/**
 * Fetch all sources in parallel (with concurrency cap)
 * @param {object[]} sources
 * @param {number} concurrency
 * @returns {Promise<object[]>} - flat array of all articles
 */
async function fetchAllSources(sources, concurrency = 6) {
  const results = [];
  for (let i = 0; i < sources.length; i += concurrency) {
    const batch = sources.slice(i, i + concurrency);
    const batchResults = await Promise.allSettled(batch.map((s) => fetchSource(s)));
    batchResults.forEach((r) => {
      if (r.status === "fulfilled") results.push(...r.value);
    });
  }
  return results;
}

module.exports = { fetchSource, fetchAllSources };
