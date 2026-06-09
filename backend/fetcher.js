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
const MAX_ARTICLES_PER_SOURCE = 10;
const MAX_ARTICLE_AGE_DAYS = 7; // ignore articles older than this

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

function parsePublishedDate(text, fallback) {
  const dateMatch = text.match(/\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2},\s+\d{4}\b/);
  if (dateMatch) {
    const d = new Date(dateMatch[0]);
    if (!isNaN(d.getTime())) return d.toISOString();
  }
  return fallback;
}

function parseProxyMarkdown(source, rawText) {
  const fetchedAt = new Date().toISOString();
  const articles = [];
  const seenUrls = new Set();
  const datePattern = /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}\b/;

  const pushArticle = (titleRaw, url) => {
    const title = titleRaw
      .replace(/^\s*(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}\s+[A-Za-z]+\s+/, "")
      .replace(/\s{2,}/g, " ")
      .trim();

    if (!title || !url || seenUrls.has(url)) return;
    if (title.length < 15) return;
    if (!url.startsWith("http")) return;

    articles.push({
      id: makeId(url || title),
      title: title.slice(0, 200),
      url,
      publishedAt: parsePublishedDate(titleRaw, fetchedAt),
      fetchedAt,
      source: source.name,
      group: source.group,
      color: source.color,
      logoUrl: source.logoUrl,
      rawContent: title,
      imageUrl: "",
      summary: null,
    });
    seenUrls.add(url);
  };

  const heroRegex = /##\s*\[([^\]]+?)\]\((https?:\/\/[^)]+)\)/gi;
  let heroMatch;
  while ((heroMatch = heroRegex.exec(rawText))) {
    pushArticle(heroMatch[1].trim(), heroMatch[2].trim());
  }

  const listRegex = /\*\s*\[([^\]]+?)\]\((https?:\/\/[^)]+)\)/gi;
  let listMatch;
  while ((listMatch = listRegex.exec(rawText))) {
    const titleRaw = listMatch[1].trim();
    if (datePattern.test(titleRaw)) {
      pushArticle(titleRaw, listMatch[2].trim());
    }
  }

  const cardRegex = /\[[^\]]*?######\s*([^\]]+?)\]\((https?:\/\/[^)]+)\)/gi;
  let cardMatch;
  while ((cardMatch = cardRegex.exec(rawText))) {
    pushArticle(cardMatch[1].trim().replace(/\s+$/g, ""), cardMatch[2].trim());
  }

  return articles;
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

  // Normalize publishedAt to ISO string when available; fall back to fetchedAt
  const pubRaw = item.isoDate || item.pubDate;
  const pubDate = pubRaw ? new Date(pubRaw) : null;
  const publishedAt = pubDate && !isNaN(pubDate.getTime()) ? pubDate.toISOString() : fetchedAt;

  return {
    id: makeId(url || title),
    title,
    url,
    publishedAt,
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

    const rssUrls = source.rssUrls
      || (source.rssUrl
          ? [source.rssUrl]
          : []);

    if (rssUrls.length === 0) {

      console.log(
        `  - ${source.name}: no RSS URLs configured`
      );

      return null;
    }

    const allItems = [];

    for (const rssUrl of rssUrls) {

      if (
        !rssUrl ||
        typeof rssUrl !== "string"
      ) {
        continue;
      }

      if (
        !rssUrl.startsWith("http://") &&
        !rssUrl.startsWith("https://")
      ) {

        console.log(
          `  - ${source.name}: invalid RSS URL ${rssUrl}`
        );

        continue;
      }

      try {

        const feed =
          await parser.parseURL(
            rssUrl
          );

        allItems.push(
          ...(feed.items || [])
        );

      } catch (err) {

        console.warn(
          `  ✗ ${source.name} RSS failed (${rssUrl}): ${err.message}`
        );
      }
    }

    if (
      allItems.length === 0
    ) {

      return null;
    }

    allItems.sort((a, b) => {

      const da =
        new Date(
          a.isoDate ||
          a.pubDate ||
          0
        ).getTime() || 0;

      const db =
        new Date(
          b.isoDate ||
          b.pubDate ||
          0
        ).getTime() || 0;

      return db - da;
    });

    const seenUrls =
      new Set();

    const cutoff =
      Date.now()
      - (
          MAX_ARTICLE_AGE_DAYS
          * 24
          * 60
          * 60
          * 1000
        );

    const articles =
      allItems

        .map(
          item =>
            normalizeItem(
              item,
              source
            )
        )

        .filter(article => {

          if (
            !article.title ||
            !article.url
          ) {
            return false;
          }

          if (
            seenUrls.has(
              article.url
            )
          ) {
            return false;
          }

          seenUrls.add(
            article.url
          );

          return (
            new Date(
              article.publishedAt
            ).getTime()
            >= cutoff
          );
        })

        .slice(
          0,
          MAX_ARTICLES_PER_SOURCE
        );

    console.log(
      `  ✓ ${source.name}: ${articles.length} articles (${rssUrls.length} feeds)`
    );

    return articles;

  } catch (err) {

    console.warn(
      `  ✗ ${source.name} RSS failed: ${err.message}`
    );

    return null;
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
    const response = await axios.get(source.fallbackScrapeUrl, {
      timeout: 10000,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; PulseAI-NewsBot/1.0)",
        Accept: "text/html, text/plain",
      },
    });

    const contentType = (response.headers["content-type"] || "").toLowerCase();
    const data = response.data;

    if (
      typeof data === "string" &&
      (contentType.includes("text/plain") || data.includes("Markdown Content:"))
    ) {
      const proxyArticles = parseProxyMarkdown(source, data);
      const cutoff = Date.now() - MAX_ARTICLE_AGE_DAYS * 24 * 60 * 60 * 1000;
      const filtered = proxyArticles
        .filter((a) => a.title && a.url && new Date(a.publishedAt).getTime() >= cutoff)
        .slice(0, MAX_ARTICLES_PER_SOURCE);
      console.log(`  ✓ ${source.name}: ${filtered.length} articles (proxy scrape)`);
      return filtered;
    }

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

          // Try to extract a published date from common locations
          let pubRaw = null;
          // time[datetime] or time text
          const timeEl = $(el).find("time").first();
          if (timeEl && timeEl.attr("datetime")) pubRaw = timeEl.attr("datetime");
          if (!pubRaw && timeEl) pubRaw = timeEl.text();

          // meta tags (page-level)
          if (!pubRaw) pubRaw = $(el).find('meta[property="article:published_time"]').attr('content');
          if (!pubRaw) pubRaw = $('meta[property="article:published_time"]').attr('content');
          if (!pubRaw) pubRaw = $('meta[itemprop="datePublished"]').attr('content');
          if (!pubRaw) pubRaw = $('meta[name="pubdate"]').attr('content') || $('meta[name="date"]').attr('content');

          // inline date text (class heuristics)
          if (!pubRaw) {
            const dateText = $(el).find('[class*="date"], .published, .post-date, .pubdate, .published-time').first().text();
            if (dateText) pubRaw = dateText;
          }

          // Parse to ISO if possible
          let publishedAt = fetchedAt;
          if (pubRaw) {
            const d = new Date(pubRaw.trim());
            if (!isNaN(d.getTime())) publishedAt = d.toISOString();
          }

          articles.push({
            id: makeId(url || title),
            title: title.slice(0, 200),
            url,
            publishedAt,
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

    // Filter out older-than-cutoff and limit to newest N
    const cutoff = Date.now() - MAX_ARTICLE_AGE_DAYS * 24 * 60 * 60 * 1000;
    const filtered = articles
      .filter((a) => a.title && a.url && new Date(a.publishedAt).getTime() >= cutoff)
      .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
      .slice(0, MAX_ARTICLES_PER_SOURCE);

    console.log(`  ✓ ${source.name}: ${filtered.length} articles (scrape)`);
    return filtered;
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
