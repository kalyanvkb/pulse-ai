// backend/cache.js — In-memory cache with TTL support

const NodeCache = require("node-cache");

// Read TTL values from environment or use defaults (in seconds)
const FEED_TTL = parseInt(process.env.FEED_CACHE_TTL || "1800", 10);    // 30 minutes for raw feed data
const SUMMARY_TTL = 24 * 60 * 60; // 24 hours for AI summaries

const cache = new NodeCache({
  stdTTL: FEED_TTL,
  checkperiod: 120,
  useClones: false,
});

/**
 * Get a cached value by key
 * @param {string} key
 * @returns {any|undefined}
 */
function getCache(key) {
  return cache.get(key);
}

/**
 * Set a cached value with optional TTL
 * @param {string} key
 * @param {any} value
 * @param {number} [ttl] - in seconds; uses default if omitted
 */
function setCache(key, value, ttl) {
  if (ttl !== undefined) {
    cache.set(key, value, ttl);
  } else {
    cache.set(key, value);
  }
}

/**
 * Delete a cached key
 * @param {string} key
 */
function deleteCache(key) {
  cache.del(key);
}

/**
 * Flush all cache entries (used on manual refresh)
 */
function flushFeedCache() {
  const keys = cache.keys().filter((k) => !k.startsWith("summary:"));
  cache.del(keys);
  console.log(`  Cache flushed: ${keys.length} feed entries removed`);
}

/**
 * Get cache statistics for the /api/sources status endpoint
 * @returns {object}
 */
function getCacheStats() {
  const stats = cache.getStats();
  return {
    keys: cache.keys().length,
    hits: stats.hits,
    misses: stats.misses,
    summaries: cache.keys().filter((k) => k.startsWith("summary:")).length,
  };
}

module.exports = {
  getCache,
  setCache,
  deleteCache,
  flushFeedCache,
  getCacheStats,
  FEED_TTL,
  SUMMARY_TTL,
};
