// backend/scheduler.js — Daily 8 AM IST fetch scheduler

const cron = require("node-cron");
const SOURCES = require("../sources.config");
const { fetchAllSources } = require("./fetcher");
const { summarizeBatch } = require("./summarizer");
const { saveArticles, hasTodaysArticles, getTodaysArticles } = require("./db");
const { setCache } = require("./cache");

/**
 * Run the full fetch → summarize → save pipeline
 */
async function runDailyFetch() {
  console.log("\n📰 Daily fetch started...");
  try {
    const articles = await fetchAllSources(SOURCES);
    await summarizeBatch(articles);
    await saveArticles(articles);

    // Warm the in-memory cache so API responds instantly
    setCache("all_articles", {
      articles,
      refreshedAt: new Date().toISOString(),
    });

    console.log(`✅ Daily fetch complete — ${articles.length} articles saved\n`);
  } catch (err) {
    console.error("❌ Daily fetch failed:", err.message);
  }
}

/**
 * Load today's articles from DB into memory cache on startup
 */
async function warmCacheFromDB() {
  const articles = await getTodaysArticles();
  if (articles.length > 0) {
    setCache("all_articles", {
      articles,
      refreshedAt: new Date().toISOString(),
    });
    console.log(`✓ Loaded ${articles.length} articles from MongoDB into cache`);
  }
}

/**
 * Start the scheduler
 * Cron: environment variable SCHEDULER_CRON_TIME (default: "0 8 * * *" = every day at 08:00)
 * Timezone: environment variable SCHEDULER_TIMEZONE (default: Asia/Kolkata)
 */
function startScheduler() {
  const cronTime = process.env.SCHEDULER_CRON_TIME || "0 8 * * *";
  const cronTimezone = process.env.SCHEDULER_TIMEZONE || "Asia/Kolkata";
  
  cron.schedule(
    cronTime,
    () => runDailyFetch(),
    { timezone: cronTimezone }
  );
  console.log(`⏰ Scheduler set: ${cronTime} (Timezone: ${cronTimezone})`);
}

module.exports = { startScheduler, runDailyFetch, warmCacheFromDB };