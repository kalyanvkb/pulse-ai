// backend/server.js — Express API server for pulse.ai

require("dotenv").config({ path: require("path").join(__dirname, ".env") });

const express = require("express");
const cors = require("cors");
const cron = require("node-cron");
const path = require("path");
const authRoutes = require("./routes/auth");

const SOURCES = require("../sources.config");
const { fetchAllSources } = require("./fetcher");
const { summarizeBatch } = require("./summarizer");
const { getCache, setCache, flushFeedCache, getCacheStats, FEED_TTL } = require("./cache");

const { connect, getTodaysArticles, getArticlesByDate } = require("./db");
const { startScheduler, runDailyFetch, warmCacheFromDB } = require("./scheduler");

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3001;

// Parse CORS origins from environment variable
const corsOrigins = (process.env.CORS_ORIGINS || "http://localhost:5173,https://pulse-ai.in").split(",").map(origin => origin.trim());

// ─── Middleware ─────────────────────────────────────────────────────────────
app.use(cors({
  origin: corsOrigins,
  credentials: true
}));

app.use("/api/auth", authRoutes);

app.use(express.json());

// ─── Serve React Frontend ───────────────────────────────────────────────────
const frontendPath = path.join(__dirname, "../frontend/dist");
app.use(express.static(frontendPath));

// ─── State ───────────────────────────────────────────────────────────────────
let lastRefreshed = null;
let isRefreshing = false;
let sourceStatuses = {}; // { sourceName: "ok" | "error" }

// ─── Core refresh logic ──────────────────────────────────────────────────────
async function refreshAllNews(force = false) {
  if (isRefreshing) {
    console.log("Refresh already in progress, skipping...");
    return;
  }

  const cached = getCache("all_articles");
  if (!force && cached) {
    console.log("Serving from cache");
    return;
  }

  isRefreshing = true;
  console.log("Refreshing news..");

  try {
    const articles = await fetchAllSources(SOURCES);

    // Track source statuses
    sourceStatuses = {};
    SOURCES.forEach((s) => {
      const found = articles.some((a) => a.source === s.name);
      sourceStatuses[s.name] = found ? "ok" : "error";
    });

    // Sort newest first
    articles.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

    console.log("Fetched articles");

    const fetchedAt = new Date().toISOString();
    articles.forEach((article) => {
      article.fetchedAt = fetchedAt;
    });

    // Summarize articles
    await summarizeBatch(articles);

    // Cache the final result
    setCache("all_articles", { articles, refreshedAt: fetchedAt }, FEED_TTL);
    lastRefreshed = fetchedAt;
  } catch (err) {
    console.error("❌ Refresh failed:", err.message);
  } finally {
    isRefreshing = false;
  }
}

// ─── API Routes ─────────────────────────────────────────────────────────────

/**
 * GET /api/news
 * Returns all articles, optionally paginated
 * Query params: page (default 1), limit (default 50)
 */
app.get("/api/news", async (req, res) => {
const cached = getCache("all_articles");

if (cached && cached.articles?.length > 0) {
  return res.json({
    articles: cached.articles,
    refreshedAt: cached.refreshedAt,
    total: cached.articles.length,
  });
}

// FALLBACK TO MONGODB
console.log("Cache empty — loading from MongoDB");

const articles = await getTodaysArticles();

if (articles.length > 0) {
  // repopulate cache
  setCache("all_articles", {
    articles,
    refreshedAt: new Date().toISOString(),
  });

  return res.json({
    articles,
    refreshedAt: new Date().toISOString(),
    total: articles.length,
  });
}

// truly empty
return res.json({
  articles: [],
  refreshedAt: null,
  total: 0,
  message: "No articles available",
});
});

/**
 * GET /api/news/:group
 * Filter by group: TAMANNA, AI Labs, Publications
 */
app.get("/api/news/:group", (req, res) => {
  const cached = getCache("all_articles");
  if (!cached) return res.json({ articles: [], total: 0 });

  const group = decodeURIComponent(req.params.group);
  const filtered = cached.articles.filter(
    (a) => a.group.toLowerCase() === group.toLowerCase()
  );

  res.json({ articles: filtered, total: filtered.length, group });
});

/**
 * GET /api/source/:name
 * Filter by source name (e.g. OpenAI, Wired AI)
 */
app.get("/api/source/:name", (req, res) => {
  const cached = getCache("all_articles");
  if (!cached) return res.json({ articles: [], total: 0 });

  const name = decodeURIComponent(req.params.name);
  const filtered = cached.articles.filter(
    (a) => a.source.toLowerCase() === name.toLowerCase()
  );

  res.json({ articles: filtered, total: filtered.length, source: name });
});

/**
 * GET /api/refresh
 * Trigger a manual cache-busting refresh
 */
app.get("/api/refresh", async (req, res) => {
  if (isRefreshing) {
    return res.json({ status: "in_progress", message: "Refresh already running" });
  }

  flushFeedCache();
  res.json({ status: "started", message: "Refresh triggered" });
  refreshAllNews(true); // run async, don't await
});

/**
 * GET /api/sources
 * Returns list of all sources with their status and article counts
 */
app.get("/api/sources", (req, res) => {
  const cached = getCache("all_articles");
  const articles = cached?.articles || [];

  const sources = SOURCES.map((s) => ({
    name: s.name,
    group: s.group,
    color: s.color,
    logoUrl: s.logoUrl,
    rssUrl: s.rssUrl,
    status: sourceStatuses[s.name] || "unknown",
    articleCount: articles.filter((a) => a.source === s.name).length,
  }));

  res.json({
    sources,
    total: SOURCES.length,
    ok: Object.values(sourceStatuses).filter((v) => v === "ok").length,
    error: Object.values(sourceStatuses).filter((v) => v === "error").length,
    cache: getCacheStats(),
    lastRefreshed,
    isRefreshing,
  });
});

/**
 * GET /api/health
 * Health check endpoint
 */
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    apiKeySet: !!process.env.ANTHROPIC_API_KEY,
    lastRefreshed,
    isRefreshing,
    uptime: Math.round(process.uptime()) + "s",
  });
});

/**
 * GET /api/news/date/:date
 * Fetch articles from a past date e.g. 2026-05-10
 */
app.get("/api/news/date/:date", async (req, res) => {
  const articles = await getArticlesByDate(req.params.date);
  res.json({ articles, total: articles.length, date: req.params.date });
});

// ─── React Frontend Fallback ────────────────────────────────────────────────
// Any non-API route should load the React app
app.get("/", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

// ─── Scheduled refresh every 30 minutes ─────────────────────────────────────
// cron.schedule("*/30 * * * *", () => {
//   console.log("⏰ Scheduled refresh triggered");
//   refreshAllNews(true);
// });

// ─── Start ───────────────────────────────────────────────────────────────────
app.listen(PORT, async () => {
  console.log(`pulse.ai backend on http://0.0.0.0:${PORT}`);

  try{
  // Connect to MongoDB
  await connect();

  // Load today's existing articles into cache (instant API response)
  await warmCacheFromDB();

//populate the cache
  await refreshAllNews(true);
  // Start the 8 AM IST daily scheduler
  startScheduler();

console.log("Startup completed successfully");
}
catch(err) {
console.error("Startup failed:", err);
}
  // If no articles exist yet for today, fetch immediately
  const { hasTodaysArticles } = require("./db");
  const hasData = await hasTodaysArticles();

  if (!hasData) {
    console.log("No articles for today yet — fetching now...");
    runDailyFetch();
  }

//ALWAYS refresh cache after startup 
await refreshAllNews(true);
});
