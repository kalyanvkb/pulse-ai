// backend/server.js — Express API server for pulse.ai


require("dotenv").config({ path: require("path").join(__dirname, ".env") });

const express = require("express");
const cors = require("cors");
const cron = require("node-cron");
const path = require("path");
const { createCanvas } = require("canvas");
const authRoutes = require("./routes/auth");

const SOURCES = require("../sources.config");
const { fetchAllSources } = require("./fetcher");
const { summarizeBatch } = require("./summarizer");
const { getCache, setCache, flushFeedCache, getCacheStats, FEED_TTL } = require("./cache");
const {
  connect,
  getTodaysArticles,
  getArticlesByDate,
  getUserByEmail,
  followCompany,
  unfollowCompany,
  getCompanyWeeklyBriefs,
  getCompanyDailyBriefs,
  createShareCard,
  getShareCardById,
  recordShareEvent
} = require("./db");
const { startScheduler, warmCacheFromDB } = require("./scheduler");

const shareCardsRouter = require("./routes/shareCards");


const app = express();
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "https://pulse-ai.in",
      "http://pulse-ai.in",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
app.options("*", cors());

app.use(express.json());
//const cors = require("cors");

app.use("/api/share-cards", shareCardsRouter);

const fs = require("fs");
const ShareCard = require("./models/ShareCard");

const FRONTEND_BASE_URL =
  process.env.FRONTEND_BASE_URL || "https://pulse-ai.in";

const FRONTEND_INDEX_PATH =
  process.env.FRONTEND_INDEX_PATH ||
  path.resolve(__dirname, "../frontend/dist/index.html");

function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function buildDescription(shareCard) {
  if (shareCard?.subtitle) return shareCard.subtitle;
  const firstItem = shareCard?.payload?.items?.[0];
  if (firstItem?.text) return firstItem.text.slice(0, 180);
  return "AI intelligence, curated by Pulse-AI.";
}

function injectShareOgTags(indexHtml, shareCard) {
  const title = escapeHtml(shareCard?.title || "Pulse-AI");
  const description = escapeHtml(buildDescription(shareCard));
  const shareUrl = `${FRONTEND_BASE_URL}/share/${shareCard.shareSlug}`;
  const imageUrl = `${FRONTEND_BASE_URL}/api/share-cards/${shareCard.shareSlug}/image.svg`;

  const ogTags = `
    <title>${title} | Pulse-AI</title>
    <meta name="description" content="${description}" />

    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Pulse-AI" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:url" content="${shareUrl}" />
    <meta property="og:image" content="${imageUrl}" />
    <meta property="og:image:secure_url" content="${imageUrl}" />
    <meta property="og:image:type" content="image/svg+xml" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${imageUrl}" />
  `;

  return indexHtml.replace("</head>", `${ogTags}\n</head>`);
}

const PORT = process.env.PORT || 3001;
const PUBLIC_BASE_URL =
  process.env.PUBLIC_BASE_URL ||
  process.env.FRONTEND_URL ||
  "http://localhost:5173";

// Parse CORS origins from environment variable
const corsOrigins = (process.env.CORS_ORIGINS || "http://localhost:5173,https://pulse-ai.in").split(",").map(origin => origin.trim());

const {
  getLatestDailyIntelligence,
  getLatestWeeklyIntelligence
}
=
require("./db");

console.log(
  "AI_SERVICE_URL =",
  process.env.AI_SERVICE_URL
);

// ─── Middleware ─────────────────────────────────────────────────────────────
app.use(cors({
  origin: corsOrigins,
  credentials: true
}));

app.use("/api/auth", authRoutes);

// Increase payload size limit for share card images
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// ─── Serve React Frontend ───────────────────────────────────────────────────
const frontendPath = path.join(__dirname, "../frontend/dist");
app.use(express.static(frontendPath));

// ─── State ───────────────────────────────────────────────────────────────────
let lastRefreshed = null;
let isRefreshing = false;
let sourceStatuses = {}; // { sourceName: "ok" | "error" }

// ─── Image Generation for Share Cards ────────────────────────────────────────
const CARD_WIDTH = 1200;
const CARD_HEIGHT = 630;
const imageCache = new Map(); // Simple in-memory cache

function generateShareCardImage(card) {
  // Check cache first
  const cacheKey = `card_${card._id}`;
  if (imageCache.has(cacheKey)) {
    return imageCache.get(cacheKey);
  }

  try {
    const canvas = createCanvas(CARD_WIDTH, CARD_HEIGHT);
    const ctx = canvas.getContext("2d");

    // Gradient background
    const gradient = ctx.createLinearGradient(0, 0, CARD_WIDTH, CARD_HEIGHT);
    gradient.addColorStop(0, "#0a0b0d");
    gradient.addColorStop(0.52, "#111827");
    gradient.addColorStop(1, "#172033");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

    // Rounded rectangle border
    ctx.fillStyle = "rgba(91, 138, 240, 0.14)";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.14)";
    ctx.lineWidth = 2;
    
    const x = 58, y = 52, w = CARD_WIDTH - 116, h = CARD_HEIGHT - 104, r = 28;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Brand
    ctx.font = "700 30px Arial";
    ctx.fillStyle = "#e8eaf0";
    ctx.fillText("pulse-ai", 92, 108);

    // Label
    ctx.font = "700 14px Arial";
    ctx.fillStyle = "#8ea6ff";
    ctx.fillText("SHAREABLE INTELLIGENCE", 92, 148);

    // Title
    ctx.font = "700 54px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(card.title || "Intelligence", 92, 212);

    // Subtitle
    ctx.font = "400 24px Arial";
    ctx.fillStyle = "#aeb7cc";
    const subtitle = card.subtitle || "";
    ctx.fillText(subtitle.substring(0, 100), 92, 252);

    // Items preview
    let y_pos = 312;
    (card.items || []).slice(0, 3).forEach((item, index) => {
      ctx.font = "700 23px Arial";
      ctx.fillStyle = "#7ca6ff";
      ctx.fillText(String(index + 1).padStart(2, "0"), 94, y_pos);

      ctx.font = "700 24px Arial";
      ctx.fillStyle = "#f5f7fb";
      const label = item.company ? `${item.company}: ` : "";
      ctx.fillText(label, 148, y_pos);

      ctx.font = "400 24px Arial";
      ctx.fillStyle = "#d9deea";
      const text = (item.text || "").substring(0, 60);
      ctx.fillText(text, 148 + (label ? ctx.measureText(label).width : 0), y_pos);

      y_pos += 54;
    });

    // Footer
    ctx.strokeStyle = "rgba(255, 255, 255, 0.13)";
    ctx.beginPath();
    ctx.moveTo(92, 552);
    ctx.lineTo(1108, 552);
    ctx.stroke();

    ctx.font = "500 22px Arial";
    ctx.fillStyle = "#b7c0d7";
    ctx.fillText(card.period || "Generated by Pulse AI", 92, 590);

    ctx.font = "700 22px Arial";
    ctx.fillStyle = "#3dd68c";
    ctx.textAlign = "right";
    ctx.fillText("Tracked by Pulse AI", 1108, 590);

    // Convert to buffer
    const buffer = canvas.toBuffer("image/png");
    
    // Cache for 24 hours
    imageCache.set(cacheKey, buffer);
    setTimeout(() => imageCache.delete(cacheKey), 24 * 60 * 60 * 1000);

    return buffer;
  } catch (err) {
    console.error("Error generating card image:", err);
    return null;
  }
}

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

function getTopItems(
  briefs,
  sectionName,
  minimumCount = 5
) {

  const selected = [];
  const remaining = [];

  for (const brief of briefs) {

    const items =
      brief[sectionName] || [];

    const sorted =
      [...items].sort(
        (a, b) =>
          b.importance - a.importance
      );

    if (sorted.length === 0) {
      continue;
    }

    selected.push({
      company: brief.company,
      ...sorted[0]
    });

    remaining.push(
      ...sorted
        .slice(1)
        .map(item => ({
          company: brief.company,
          ...item
        }))
    );
  }

  remaining.sort(
    (a, b) =>
      b.importance - a.importance
  );

  const totalAvailable =
    selected.length +
    remaining.length;

  const requiredCount =
    Math.min(
      minimumCount,
      totalAvailable
    );

  while (
    selected.length <
      requiredCount &&
    remaining.length > 0
  ) {
    selected.push(
      remaining.shift()
    );
  }

  return selected;
}

function buildRankedSection(
  briefs,
  field
) {

  return briefs

    .flatMap(brief =>

      (brief[field] || [])

        .map(item => {

          if (
            typeof item ===
            "string"
          ) {

            return {

              company:
                brief.company,

              importance: 5,

              text: item
            };
          }

          return {

            company:
              brief.company,

            importance:
              item.importance || 5,

            text:
              item.text || ""
          };
        })
    )

    .filter(
      item =>
        item.text
    )

    .sort(
      (a, b) =>
        b.importance -
        a.importance
    )

    .slice(0, 12);
}


function aggregateIntelligence(
  briefs
) {

  if (
    !briefs ||
    briefs.length === 0
  ) {

    return {

      week: null,

      companyCount: 0,

      executiveSummary: {

        whatChanged: [],
        whyItMatters: [],
        signalsToWatch: []
      },

      companyBriefs: []
    };
  }

  return {

    week:
      briefs[0].week,

    companyCount:
      briefs.length,

    executiveSummary: {

      whatChanged:
        buildRankedSection(
          briefs,
          "whatChanged"
        ),

      whyItMatters:
        buildRankedSection(
          briefs,
          "whyItMatters"
        ),

      signalsToWatch:
        buildRankedSection(
          briefs,
          "signalsToWatch"
        )
    },

    companyBriefs:
      briefs
  };
}

function aggregateDailyIntelligence(
  briefs
) {

  if (
    !briefs ||
    briefs.length === 0
  ) {

    return {

      date: null,

      companyCount: 0,

      executiveSummary: {

        whatsHappening: [],

        whyItMatters: []
      },

      companyBriefs: []
    };
  }

  return {

    date:
      briefs[0].date,

    companyCount:
      briefs.length,

    executiveSummary: {

      whatsHappening:
        getTopItems(
          briefs,
          "whatsHappening",
          12
        ),

      whyItMatters:
        getTopItems(
          briefs,
          "whyItMatters",
          12
        )
    },

    companyBriefs:
      briefs
  };
}

app.get(
  "/api/intelligence/weekly",
  async (req, res) => {

    try {

      const email =
        req.query.email;

      if (!email) {

        return res.status(400).json({
          error:
            "email required"
        });
      }

      const user =
        await getUserByEmail(
          email
        );
        
      if (!user) {

        return res.status(404).json({
          error:
            "user not found"
        });
      }

      const companies =
        user.preferences?.sources  || [];

      const briefs =
        await getCompanyWeeklyBriefs(
          companies
        );

        console.log(
  "Followed Companies:",
  companies.length,
  companies
);

console.log(
  "Weekly Brief Records:",
  briefs.length
);

async function getCompanyDailyBriefs(
  companies
) {

  const db =
    getDb();

  const latest =
    await db
      .collection(
        "companyBriefs"
      )
      .findOne(
        {},
        {
          sort: {
            date: -1
          }
        }
      );

  if (!latest) {

    return [];
  }

  return db

    .collection(
      "companyBriefs"
    )

    .find({

      company: {
        $in: companies
      },

      date:
        latest.date
    })

    .toArray();
}
      const result =
        aggregateIntelligence(
          briefs
        );
        result.companyCount =
  companies.length;

      res.json(result);

    } catch (err) {

      console.error(err);

      res.status(500).json({
        error:
          err.message
      });
    }
  }
);

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

app.post("/api/share-cards", async (req, res) => {
  try {
    const {
      title,
      subtitle,
      period,
      sectionType,
      items,
      userEmail
    } = req.body;

    if (!title || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        error: "title and items are required"
      });
    }

    const card =
      await createShareCard({
        title,
        subtitle,
        period,
        sectionType,
        items: items.slice(0, 10),
        userEmail
      });

    const baseUrl =
      req.get("origin") ||
      PUBLIC_BASE_URL;

    res.json({
      cardId: card._id,
      shareUrl: `${baseUrl.replace(/\/$/, "")}/shared-insight/${card._id}`
    });
  } catch (err) {
    console.error("Failed creating share card", err);
    res.status(500).json({
      error: "Failed to create share card"
    });
  }
});

app.get("/api/share-cards/:id", async (req, res) => {
  try {
    const card =
      await getShareCardById(req.params.id);

    if (!card) {
      return res.status(404).json({
        error: "Share card not found"
      });
    }

    await recordShareEvent({
      cardId: req.params.id,
      action: "view",
      sectionType: card.sectionType,
      referrer: req.get("referer"),
      userAgent: req.get("user-agent")
    });

    res.json(card);
  } catch (err) {
    console.error("Failed loading share card", err);
    res.status(500).json({
      error: "Failed to load share card"
    });
  }
});

app.get("/api/share-cards/:id/preview", async (req, res) => {
  try {
    const card = await getShareCardById(req.params.id);
    
    if (!card) {
      return res.status(404).json({ error: "Card not found" });
    }

    // Generate the PNG image
    const imageBuffer = generateShareCardImage(card);
    
    if (!imageBuffer) {
      return res.status(500).json({ error: "Failed to generate image" });
    }

    res.set("Content-Type", "image/png");
    res.set("Cache-Control", "public, max-age=86400"); // Cache for 24 hours
    res.set("Content-Length", imageBuffer.length);
    res.send(imageBuffer);
  } catch (err) {
    console.error("Error generating preview", err);
    res.status(500).json({ error: "Failed to generate preview" });
  }
});

app.post("/api/share-events", async (req, res) => {
  try {
    const {
      cardId,
      action,
      sectionType,
      userEmail
    } = req.body;

    if (!action) {
      return res.status(400).json({
        error: "action required"
      });
    }

    await recordShareEvent({
      cardId,
      action,
      sectionType,
      userEmail,
      referrer: req.get("referer"),
      userAgent: req.get("user-agent")
    });

    res.json({
      success: true
    });
  } catch (err) {
    console.error("Failed recording share event", err);
    res.status(500).json({
      error: "Failed to record share event"
    });
  }
});

app.get("/api/debug/user-model", async (req, res) => {
  const users = await mongoose.model("User").find({});
  res.json(users);
});

app.get("/api/users/following", async (req, res) => {
  try {

    const email = req.query.email;

    if (!email) {
      return res.status(400).json({
        error: "email required"
      });
    }

    const user =
      await getUserByEmail(email);

    return res.json(
      user?.preferences?.sources || []
    );

  } catch (err) {

    console.error(
      "Failed loading following",
      err
    );

    return res.status(500).json({
      error: "Failed to load following"
    });
  }
});

app.post("/api/users/follow", async (req, res) => {

  try {

    const { email, company } =
      req.body;

    if (!email || !company) {
      return res.status(400).json({
        error:
          "email and company required"
      });
    }

    await followCompany(
      email,
      company
    );

    return res.json({
      success: true
    });

  } catch (err) {

    console.error(
      "Follow failed",
      err
    );

    return res.status(500).json({
      success: false
    });
  }
});

app.post("/api/users/unfollow", async (req, res) => {

  try {

    const { email, company } =
      req.body;

    if (!email || !company) {
      return res.status(400).json({
        error:
          "email and company required"
      });
    }

    await unfollowCompany(
      email,
      company
    );

    return res.json({
      success: true
    });

  } catch (err) {

    console.error(
      "Unfollow failed",
      err
    );

    return res.status(500).json({
      success: false
    });
  }
});

/**
 * GET /api/news/date/:date
 * Fetch articles from a past date e.g. 2026-05-10
 */
app.get("/api/news/date/:date", async (req, res) => {
  const articles = await getArticlesByDate(req.params.date);
  res.json({ articles, total: articles.length, date: req.params.date });
});

// ─── Shared Insight Page with Open Graph Meta Tags ────────────────────────
// This route serves HTML with OG tags for social media crawlers
app.get("/shared-insight/:id", async (req, res) => {
  try {
    const card = await getShareCardById(req.params.id);
    
    if (!card) {
      console.warn(`Card not found: ${req.params.id}`);
      return res.status(404).sendFile(path.join(frontendPath, "index.html"));
    }

    console.log(`🔗 Serving shared insight for card: ${card._id}`);

    // Build the share URL
    const baseUrl = req.get("origin") || PUBLIC_BASE_URL;
    const shareUrl = `${baseUrl.replace(/\/$/, "")}/shared-insight/${card._id}`;
    const imageUrl = `${baseUrl.replace(/\/$/, "")}/api/share-cards/${card._id}/preview`;

    console.log(`📸 Image URL: ${imageUrl}`);
    console.log(`🌐 Share URL: ${shareUrl}`);

    // Create Open Graph meta tags
    const title = card.title || "Pulse AI - Shareable Intelligence";
    const description = (card.subtitle || "Check out this AI & Tech news intelligence from Pulse AI").substring(0, 160);

    const htmlWithOG = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${escapeHtml(shareUrl)}" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:image" content="${escapeHtml(imageUrl)}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:type" content="image/png" />
  <meta property="og:site_name" content="Pulse AI" />
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:url" content="${escapeHtml(shareUrl)}" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${escapeHtml(imageUrl)}" />
  <meta name="twitter:creator" content="@pulseai" />
  
  <!-- LinkedIn -->
  <meta property="linkedin:title" content="${escapeHtml(title)}" />
  <meta property="linkedin:description" content="${escapeHtml(description)}" />
  <meta property="linkedin:image" content="${escapeHtml(imageUrl)}" />
  
  <!-- Favicon -->
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📡</text></svg>" />
  <script type="module" src="/src/main.jsx"><\/script>
</head>
<body>
  <div id="root"></div>
</body>
</html>`;

    console.log(`✅ Sending OG meta tags with image URL`);
    res.set("Content-Type", "text/html; charset=utf-8");
    res.send(htmlWithOG);
  } catch (err) {
    console.error("Error serving shared insight", err);
    res.sendFile(path.join(frontendPath, "index.html"));
  }
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
// ─── Start ───────────────────────────────────────────────────────────────────
app.listen(PORT, async () => {

  try {

     await connect();

  await warmCacheFromDB();

  startScheduler();

  console.log(
    "Startup completed successfully"
  );

  } catch (err) {

    console.error(
      "Startup failed:",
      err
    );

    process.exit(1);
  }

});

app.get(
  "/api/intelligence/daily",
  async (req, res) => {

    try {

      const email =
        req.query.email;

      if (!email) {

        return res
          .status(400)
          .json({
            error:
              "email required"
          });
      }

      const user =
        await getUserByEmail(
          email
        );

      if (!user) {

        return res
          .status(404)
          .json({
            error:
              "user not found"
          });
      }

      const companies =
        user.preferences
          ?.sources || [];

      const briefs =
        await getCompanyDailyBriefs(
          companies
        );

      const intelligence =
        aggregateDailyIntelligence(
          briefs
        );

      res.json(
        intelligence
      );

    } catch (err) {

      console.error(
        err
      );

      res.status(500)
        .json({

          error:
            "Failed to load daily intelligence"
        });
    }
  }
);
app.get(
  "/api/intelligence/weekly",
  async (req, res) => {

    const data =
      await getLatestWeeklyIntelligence();

    res.json(data);
  }
);

app.get(
  "/api/intelligence/daily",

  async (
    req,
    res
  ) => {

    try {

      const {
        email
      } = req.query;

      const result =
        await getDailyIntelligence(
          email
        );

      res.json(
        result
      );

    } catch (err) {

      console.error(
        err
      );

      res.status(500)
        .json({

          error:
            "Failed to load daily intelligence"
        });
    }
  }
);

const {
  sendDailyDigest
} = require(
  "./jobs/sendDailyDigest"
);

app.post(
  "/admin/send-digest",
  async (req, res) => {

    await sendDailyDigest();

    res.json({
      success: true
    });
  }
);

/* ===========================
   ADD THE NEW SHARE ROUTE HERE
   =========================== */
app.get("/share/:shareSlug", async (req, res) => {
  try {
    const { shareSlug } = req.params;
    const doc = await ShareCard.findOne({ shareSlug }).lean();

    if (!doc) {
      return res.status(404).send("Share card not found");
    }

    if (!fs.existsSync(FRONTEND_INDEX_PATH)) {
      console.error("Frontend index.html not found at:", FRONTEND_INDEX_PATH);
      return res.status(500).send("Frontend build not found");
    }

    const indexHtml = fs.readFileSync(FRONTEND_INDEX_PATH, "utf8");
    const html = injectShareOgTags(indexHtml, doc);

    return res.send(html);
  } catch (err) {
    console.error("share page render failed", err);
    return res.status(500).send("Failed to render share page");
  }
});

/* KEEP THIS LAST */
app.get("*", (req, res) => {
  if (
    req.path.startsWith("/api") ||
    req.path.startsWith("/admin")
  ) {
    return res.status(404).json({
      error: "Not found"
    });
  }

  res.sendFile(
    path.join(
      frontendPath,
      "index.html"
    )
  );
});
