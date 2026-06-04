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
const {
  connect,
  getTodaysArticles,
  getArticlesByDate,
  getUserByEmail,
  followCompany,
  unfollowCompany,
  getCompanyWeeklyBriefs,
  getCompanyDailyBriefs
} = require("./db");
const { startScheduler, warmCacheFromDB } = require("./scheduler");


const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3001;

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