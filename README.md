# pulse.ai — AI & Tech News Aggregator

A full-stack news aggregator dashboard that fetches RSS feeds from 17 major tech
and AI sources, summarizes articles into bullet points using Claude AI, and displays
them in a clean, filterable dashboard.

## Sources

**TAMANNA (Big Tech):** Tesla · Apple · Microsoft · Amazon · NVIDIA · Netflix · Google  
**AI Labs:** OpenAI · Anthropic · Google DeepMind · Perplexity · Mistral  
**Publications:** MIT Tech Review · Wired AI · VentureBeat · The Verge · TechCrunch · ArXiv AI

---

## Prerequisites

- **Node.js 18+** — https://nodejs.org/
- **Anthropic API key** — https://console.anthropic.com/

---

## Quick Start

### 1. Clone / unzip the project

```bash
cd pulse-ai
```

### 2. Set up your API key

```bash
cp .env.example .env
```

Open `.env` and replace `sk-ant-your-key-here` with your real Anthropic API key:

```
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxx
```

### 3. Install backend dependencies

```bash
npm install
```

### 4. Install frontend dependencies

```bash
cd frontend
npm install
cd ..
```

### 5. Start the backend (Terminal 1)

```bash
npm start
```

You'll see:
```
🚀 pulse.ai backend running on http://localhost:3001
   API key: ✓ set
   Sources: 17 configured

🔄 Refreshing news...
  ✓ Apple: 8 articles (RSS)
  ✓ Microsoft: 8 articles (RSS)
  ...
  Summarizing 40 articles...
  ✓ Summarization complete
✅ Done. 120 articles ready.
```

### 6. Start the frontend (Terminal 2)

```bash
cd frontend
npm run dev
```

### 7. Open in browser

```
http://localhost:5173
```

---

## Development

| Command | Description |
|---------|-------------|
| `npm start` | Start backend (production) |
| `npm run dev` | Start backend with auto-reload (nodemon) |
| `cd frontend && npm run dev` | Start frontend dev server |
| `cd frontend && npm run build` | Build frontend for production |

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/news` | All articles (paginated, ?page=1&limit=50) |
| GET | `/api/news/:group` | Filter by group (TAMANNA, AI Labs, Publications) |
| GET | `/api/source/:name` | Filter by source name |
| GET | `/api/refresh` | Trigger manual refresh |
| GET | `/api/sources` | All sources with status |
| GET | `/api/health` | Health check |

---

## Adding New Sources

Edit `sources.config.js` and add a new entry:

```js
{
  name: "My Source",
  group: "Publications",          // TAMANNA | AI Labs | Publications
  rssUrl: "https://example.com/rss",
  fallbackScrapeUrl: "https://example.com/blog",
  logoUrl: "https://example.com/favicon.ico",
  color: "#ff6600",
}
```

No other code changes needed.

---

## Project Structure

```
pulse-ai/
├── sources.config.js        # All source definitions
├── package.json             # Backend dependencies
├── .env.example             # Environment template
├── .env                     # Your API key (not committed)
├── backend/
│   ├── server.js            # Express API server
│   ├── fetcher.js           # RSS + scraping logic
│   ├── summarizer.js        # Claude AI summarization
│   └── cache.js             # In-memory cache (30min feeds, 24h summaries)
└── frontend/
    ├── index.html           # HTML entry
    ├── vite.config.js       # Vite config
    ├── package.json         # Frontend dependencies
    └── src/
        ├── main.jsx         # React entry
        ├── App.jsx          # Root component
        ├── Dashboard.jsx    # Main layout + filtering
        ├── index.css        # Full stylesheet
        ├── api.js           # API client
        ├── components/
        │   ├── NewsCard.jsx     # Article card
        │   └── SkeletonCard.jsx # Loading skeleton
        └── hooks/
            └── useNews.js   # Data fetching hook
```

---

## Notes

- Summaries are cached in memory for 24 hours — re-running the server clears them
- Feed data is cached for 30 minutes; use the Refresh button to force a re-fetch
- Some sources (Wired, TechCrunch) may block scrapers; they'll show 0 articles
- Without `ANTHROPIC_API_KEY`, articles show raw excerpts instead of AI bullets
- Auto-refresh runs every 30 minutes via node-cron
