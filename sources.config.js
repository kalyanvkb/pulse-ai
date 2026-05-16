// sources.config.js — Central config for all news sources aggregated by pulse.ai

const SOURCES = [
  // ─── GROUP A: TAMANNA ───────────────────────────────────────────────────────
  {
    name: "Tesla",
    group: "TAMANNA",
    rssUrl: null, // No public RSS — using scraper
    fallbackScrapeUrl: "https://www.tesla.com/en_US/blog",
    logoUrl: "https://www.tesla.com/favicon.ico",
    color: "#e82127",
  },
  {
    name: "Apple",
    group: "TAMANNA",
    rssUrl: "https://www.apple.com/newsroom/rss-feed.rss",
    fallbackScrapeUrl: "https://www.apple.com/newsroom/",
    logoUrl: "https://www.apple.com/favicon.ico",
    color: "#a2aaad",
  },
  {
    name: "Microsoft",
    group: "TAMANNA",
    rssUrl: "https://news.microsoft.com/feed/",
    fallbackScrapeUrl: "https://news.microsoft.com/",
    logoUrl: "https://www.microsoft.com/favicon.ico",
    color: "#00a4ef",
  },
  {
    name: "Amazon",
    group: "TAMANNA",
    rssUrl: "https://www.aboutamazon.com/feeds/news.rss",
    fallbackScrapeUrl: "https://www.aboutamazon.com/news",
    logoUrl: "https://www.amazon.com/favicon.ico",
    color: "#ff9900",
  },
  {
    name: "NVIDIA",
    group: "TAMANNA",
    rssUrl: "https://feeds.feedburner.com/nvidiablog",
    fallbackScrapeUrl: "https://blogs.nvidia.com",
    logoUrl: "https://www.nvidia.com/favicon.ico",
    color: "#76b900",
  },
  {
    name: "Netflix",
    group: "TAMANNA",
    rssUrl: "https://netflixtechblog.com/feed",
    fallbackScrapeUrl: "https://netflixtechblog.com",
    logoUrl: "https://www.netflix.com/favicon.ico",
    color: "#e50914",
  },
  {
    name: "Google",
    group: "TAMANNA",
    rssUrl: "https://blog.google/rss/",
    fallbackScrapeUrl: "https://blog.google/",
    logoUrl: "https://www.google.com/favicon.ico",
    color: "#4285f4",
  },

  // ─── GROUP B: AI Labs ───────────────────────────────────────────────────────
  {
    name: "OpenAI",
    group: "AI Labs",
    rssUrl: "https://openai.com/blog/rss.xml",
    fallbackScrapeUrl: "https://openai.com/blog",
    logoUrl: "https://openai.com/favicon.ico",
    color: "#10a37f",
  },
  {
    name: "Anthropic",
    group: "AI Labs",
    rssUrl: "https://www.anthropic.com/news/rss",
    fallbackScrapeUrl: "https://www.anthropic.com/news",
    logoUrl: "https://www.anthropic.com/favicon.ico",
    color: "#d4612a",
  },
  {
    name: "Google DeepMind",
    group: "AI Labs",
    rssUrl: "https://deepmind.google/blog/rss.xml",
    fallbackScrapeUrl: "https://deepmind.google/discover/blog/",
    logoUrl: "https://deepmind.google/favicon.ico",
    color: "#1a73e8",
  },
  {
    name: "Perplexity",
    group: "AI Labs",
    rssUrl: null, // No RSS — using scraper
    fallbackScrapeUrl: "https://blog.perplexity.ai",
    logoUrl: "https://www.perplexity.ai/favicon.ico",
    color: "#20b2aa",
  },
  {
    name: "Mistral",
    group: "AI Labs",
    rssUrl: null, // No RSS — using scraper
    fallbackScrapeUrl: "https://mistral.ai/news",
    logoUrl: "https://mistral.ai/favicon.ico",
    color: "#ff7000",
  },

  // ─── GROUP C: Publications ─────────────────────────────────────────────────
  {
    name: "MIT Tech Review",
    group: "Publications",
    rssUrl: "https://www.technologyreview.com/feed/",
    fallbackScrapeUrl: "https://www.technologyreview.com/",
    logoUrl: "https://www.technologyreview.com/favicon.ico",
    color: "#a00000",
  },
  {
    name: "Wired AI",
    group: "Publications",
    rssUrl: "https://www.wired.com/feed/tag/artificial-intelligence/rss",
    fallbackScrapeUrl: "https://www.wired.com/tag/artificial-intelligence/",
    logoUrl: "https://www.wired.com/favicon.ico",
    color: "#ff0000",
  },
  {
    name: "VentureBeat",
    group: "Publications",
    rssUrl: "https://venturebeat.com/category/ai/feed/",
    fallbackScrapeUrl: "https://venturebeat.com/category/ai/",
    logoUrl: "https://venturebeat.com/favicon.ico",
    color: "#0070d1",
  },
  {
    name: "The Verge",
    group: "Publications",
    rssUrl: "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml",
    fallbackScrapeUrl: "https://www.theverge.com/ai-artificial-intelligence",
    logoUrl: "https://www.theverge.com/favicon.ico",
    color: "#ff3b30",
  },
  {
    name: "TechCrunch",
    group: "Publications",
    rssUrl: "https://techcrunch.com/category/artificial-intelligence/feed/",
    fallbackScrapeUrl: "https://techcrunch.com/category/artificial-intelligence/",
    logoUrl: "https://techcrunch.com/favicon.ico",
    color: "#0a84ff",
  },
  {
    name: "ArXiv AI",
    group: "Publications",
    rssUrl: "https://rss.arxiv.org/rss/cs.LG",
    fallbackScrapeUrl: "https://arxiv.org/list/cs.LG/recent",
    logoUrl: "https://arxiv.org/favicon.ico",
    color: "#b31b1b",
  },
];

module.exports = SOURCES;