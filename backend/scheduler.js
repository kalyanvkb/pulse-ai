const {
  sendStrategyMeeting
} = require(
  "./jobs/sendStrategyMeeting"
);

const cron = require("node-cron");
const SOURCES = require("../sources.config");
const { fetchAllSources } = require("./fetcher");
const { summarizeBatch } = require("./summarizer");
const { saveArticles, getTodaysArticles } = require("./db");
const { setCache } = require("./cache");
const {
  refreshDailyIntelligence,
  refreshWeeklyIntelligence
} = require("./intelligenceRefresher");

const {
  sendDailyDigest
} = require(
  "./jobs/sendDailyDigest"
);

/**
 * Fetch → Summarize → Save Articles
 */
async function runDailyFetch() {
  console.log("\n📰 Daily fetch started...");
  try {
    const rawArticles =
  await fetchAllSources(SOURCES);

await summarizeBatch(rawArticles);

const { isArticleStale } = require("./db");

// Inside runDailyFetch(), before saveArticles():
const freshArticles = rawArticles.filter(a => !isArticleStale(a));
console.log(`  Filtered ${rawArticles.length - freshArticles.length} stale articles`);
await saveArticles(freshArticles);

    setCache("all_articles", {
  articles: rawArticles,
  refreshedAt: new Date().toISOString()
});

console.log(
  `Daily fetch complete - ${rawArticles.length} articles saved`
);

return rawArticles;
  } catch (err) {
    console.error("❌ Daily fetch failed:", err.message);
    throw err;
  }
}

/**
 * Daily Pipeline
 * Fetch News → Generate Daily Company Briefs
 */
async function runDailyPipeline() {
  console.log("\n🚀 Daily Pipeline Started...");
  try {
    await runDailyFetch();

    console.log("🧠 Generating Daily Intelligence...");
    const result = await refreshDailyIntelligence();

    console.log("Daily Intelligence Result:", result);
    console.log("✅ Daily Pipeline Complete");
  } catch (err) {
    console.error("❌ Daily Pipeline Failed:", err);
  }
}

/**
 * Weekly Pipeline
 * Generate Weekly Company Briefs
 */
async function runWeeklyPipeline() {
  console.log("\n📊 Weekly Intelligence Started...");
  try {
    const result = await refreshWeeklyIntelligence();

    console.log("Weekly Intelligence Result:", result);
    console.log("✅ Weekly Intelligence Complete");
  } catch (err) {
    console.error("❌ Weekly Intelligence Failed:", err);
  }
}

/**
 * Load today's articles into cache
 * Startup only warms cache.
 * No fetching.
 * No AI generation.
 */
async function warmCacheFromDB() {
  try {
    const articles = await getTodaysArticles();

    if (articles && articles.length > 0) {
      setCache("all_articles", {
        articles,
        refreshedAt: new Date().toISOString()
      });

      console.log(`✓ Loaded ${articles.length} articles from MongoDB into cache`);
    }
  } catch (err) {
    console.error("❌ Failed to warm cache from DB:", err.message);
  }
}

/**
 * Scheduler Setup
 */
function startScheduler() {
  const timezone = process.env.SCHEDULER_TIMEZONE || "Asia/Kolkata";

  /**
   * Daily Pipeline
   * Every day @ 5:00 AM IST
   */
  cron.schedule("0 5 * * *", runDailyPipeline, { timezone });
  console.log("⏰ Daily Pipeline: Every day @ 5:00 AM IST");

  /**
   * Weekly Pipeline
   * Saturday @ 8:00 AM IST
   */
  cron.schedule("0 8 * * 6", runWeeklyPipeline, { timezone });
  console.log("⏰ Weekly Intelligence: Saturday @ 8:00 AM IST");

  cron.schedule("30 6 * * *", sendDailyDigest, { timezone }  );
  //cron.schedule("*/2 * * * *", sendDailyDigest, { timezone }  );

console.log("📧 Daily Digest: Every day @ 6:30 AM IST");



cron.schedule(
  "0 7 * * 0",
  async () => {

    const reference =
      new Date("2026-01-04");

    const today =
      new Date();

    const weeks =
      Math.floor(
        (today - reference) /
        (1000 * 60 * 60 * 24 * 7)
      );

    if (weeks % 2 === 0) {

      await sendStrategyMeeting();

    }

  },
  { timezone }
);
}


module.exports = {
  startScheduler,
  runDailyFetch,
  runDailyPipeline,
  runWeeklyPipeline,
  warmCacheFromDB,
  sendDailyDigest
};