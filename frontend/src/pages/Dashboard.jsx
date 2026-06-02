// frontend/src/Dashboard.jsx — Main layout with nav, filters, grid
import { useNavigate } from "react-router-dom";
import React, { useEffect, useState, useMemo } from "react";
import useNews from "../hooks/useNews";
import useFollowing from "../hooks/useFollowing";
import NewsCard from "../components/NewsCard";
import SkeletonCard from "../components/SkeletonCard";
import ContactModal from "../components/ContactModal";
import AuthModal from "../components/AuthModal";
import UserMenu from "../components/UserMenu";  
import useWeeklyIntelligence from "../hooks/useWeeklyIntelligence";
import { auth, onAuthStateChanged } from "../firebase";

const GROUPS = [
  "All",
  "My Watchlist",
  "Models",
  "Platforms",
  "Hardware",
  "Enterprise",
  "Developers",
  "Robotics"
];

const GROUP_COLORS = {
  Models: "#5b8af0",
  Platforms: "#3dd68c",
  Hardware: "#ff9f43",
  Enterprise: "#f0a04b",
  Developers: "#7a5cff",
  Robotics: "#ff6b6b",
};

function normalizeGroup(group) {
  if (!group) return "";
  const cleaned = group.trim();
  const mapping = {
    "Model Builders": "Models",
    "Infra & Platforms": "Platforms",
    "Infra & platforms": "Platforms",
    "Semiconductor & Hardware": "Hardware",
    "Enterprise AI": "Enterprise",
    "Coding and Developer Assistants": "Developers",
    "Robotics": "Robotics",
  };
  return mapping[cleaned] || cleaned;
}

function formatWeek(isoWeek) {
  if (!isoWeek) return "";

  const [year, week] = isoWeek.split("-W");
  const firstDay = new Date(Number(year), 0, 1 + (Number(week) - 1) * 7);

  const start = new Date(firstDay);
  const end = new Date(firstDay);
  end.setDate(end.getDate() + 6);

  return `${start.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric"
  })} - ${end.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  })}`;
}

function getSourcesForGroup(articles, group) {
  const filtered =
    group === "All"
      ? articles
      : articles.filter((a) => normalizeGroup(a.group) === group);
  const seen = new Set();
  return filtered
    .map((a) => ({ name: a.source, color: a.color, group: a.group }))
    .filter((s) => {
      if (seen.has(s.name)) return false;
      seen.add(s.name);
      return true;
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

function formatRefreshed(iso) {
  if (!iso) return "Not loaded";
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function normalizeRoute(path) {
  return path.replace(/\/+$/, "").toLowerCase();
}

function getDateFilterFromPath(path) {
  const normalized = normalizeRoute(path);
  if (normalized === "/yesterday") return "yesterday";
  if (normalized === "/today") return "today";
  return null;
}

function getDateFilterValue(isoDate) {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date >= today) return "today";
  if (date >= yesterday && date < today) return "yesterday";
  return null;
}

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [contactOpen, setContactOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [pendingCompany, setPendingCompany] = useState(null);
  const { articles, loading, error, refresh, lastRefreshed, isRefreshing } = useNews();
  const navigate = useNavigate();

  const { following, follow, unfollow } = useFollowing(user);

  const [activeGroup, setActiveGroup] = useState("My Watchlist");
  const [activeSources, setActiveSources] = useState(new Set());
  const [sortMode, setSortMode] = useState("latest");
  const [searchQuery, setSearchQuery] = useState("");
  const [showContact, setShowContact] = useState(false);
  const [watchlistView, setWatchlistView] = useState("weekly");

  // Moved hook initialization to the top, before any useEffect hooks call its values
  const {
    data: weeklyData,
    loading: weeklyLoading,
    reload: reloadWeeklyIntelligence
  } = useWeeklyIntelligence(user);

  useEffect(() => {

  if (
    activeGroup === "My Watchlist" &&
    reloadWeeklyIntelligence
  ) {

    reloadWeeklyIntelligence();

  }

}, [
  following,
  activeGroup,
  reloadWeeklyIntelligence
]);

  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceRef = useMemo(() => {
    let timer = null;
    return (val) => {
      clearTimeout(timer);
      timer = setTimeout(() => setDebouncedSearch(val), 300);
    };
  }, []);

  useEffect(() => {
    if (!authLoading && user?.email && following.length > 0 && activeGroup === "All") {
      setActiveGroup("My Watchlist");
      setWatchlistView("weekly");
    }
  }, [authLoading, user, following]);

  const [groupInitialized, setGroupInitialized] = useState(false);

  useEffect(() => {
    if (groupInitialized || authLoading) return;
    if (user?.email && following.length > 0) {
      setActiveGroup("My Watchlist");
    }
    setGroupInitialized(true);
  }, [authLoading, user, following, groupInitialized]);

  useEffect(() => {
    const company = localStorage.getItem("pendingFollow");
    if (user?.email && company) {
      const autoFollow = async () => {
        await follow(company);
        localStorage.removeItem("pendingFollow");
        setPendingCompany(null);
        setActiveGroup("My Watchlist");
      };
      autoFollow();
    }
  }, [user]);

  useEffect(() => {
    console.log("Dashboard mounted");
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("onAuthStateChanged fired:", firebaseUser);
      if (firebaseUser) {
        console.log("User authenticated:", firebaseUser.email);
        setUser(firebaseUser);
      } else {
        console.log("No authenticated user");
        setUser(null);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    debounceRef(value.trim().toLowerCase());
  };

  const handleGroupChange = (g) => {
    setActiveGroup(g);
    setActiveSources(new Set());
  };

  const toggleSource = (name) => {
    const sourceName = name?.trim();
    if (!sourceName) return;
    setActiveSources((prev) => {
      const next = new Set(prev);
      if (next.has(sourceName)) next.delete(sourceName);
      else next.add(sourceName);
      return next;
    });
  };

  const clearSources = () => setActiveSources(new Set());

  const routeDateFilter = useMemo(() => getDateFilterFromPath(window.location.pathname), []);

  const filtered = useMemo(() => {
    let arr = [...articles];

    const seen = new Set();
    arr = arr.filter((a) => {
      if (seen.has(a.title)) return false;
      seen.add(a.title);
      return true;
    });

    if (activeGroup === "My Watchlist") {
      const followedSet = new Set(following.map(s => s.trim().toLowerCase()));
      arr = arr.filter(a => followedSet.has((a.source || "").trim().toLowerCase()));
    } else if (activeGroup !== "All") {
      arr = arr.filter(a => normalizeGroup(a.group) === activeGroup);
    }

    if (activeSources.size > 0) {
      arr = arr.filter((a) => activeSources.has((a.source || "").trim()));
    }
    const searchTerm = debouncedSearch.trim().toLowerCase();
    if (searchTerm) {
      arr = arr.filter(
        (a) =>
          a.title.toLowerCase().includes(searchTerm) ||
          a.source.toLowerCase().includes(searchTerm)
      );
    }

    if (routeDateFilter === "today" || routeDateFilter === "yesterday") {
      arr = arr.filter((a) => {
        const filterDate = getDateFilterValue(a.fetchedAt || a.publishedAt);
        return filterDate === routeDateFilter;
      });
    }

    const hasSummary = (article) => {
      if (!article.summary) return false;
      return Array.isArray(article.summary) ? article.summary.length > 0 : Boolean(article.summary);
    };

    const compareSummary = (a, b) => {
      const aHas = hasSummary(a);
      const bHas = hasSummary(b);
      if (aHas && !bHas) return -1;
      if (!aHas && bHas) return 1;
      return 0;
    };

    if (sortMode === "latest") {
      arr.sort((a, b) => {
        const summaryOrder = compareSummary(a, b);
        if (summaryOrder !== 0) return summaryOrder;
        return new Date(b.publishedAt) - new Date(a.publishedAt);
      });
    } else if (sortMode === "source") {
      arr.sort((a, b) => {
        const summaryOrder = compareSummary(a, b);
        if (summaryOrder !== 0) return summaryOrder;
        return a.source.localeCompare(b.source);
      });
    }

    return arr;
  }, [articles, activeGroup, activeSources, debouncedSearch, sortMode, routeDateFilter, following]);

  const sourcesForFilter = useMemo(() => {
    if (activeGroup === "My Watchlist") {
      return getSourcesForGroup(articles.filter((a) => following.includes(a.source)), "All");
    }
    return getSourcesForGroup(articles, activeGroup);
  }, [articles, activeGroup, following]);


  const groupCounts = useMemo(() => {
    const counts = { All: articles.length };
    counts["My Watchlist"] = articles.filter((a) => following.includes(a.source)).length;
    GROUPS.slice(2).forEach((g) => {
      counts[g] = articles.filter((a) => normalizeGroup(a.group) === g).length;
    });
    return counts;
  }, [articles, following]);

  if (authLoading) {
    return <div className="loading-screen">Loading...</div>;
  }

  return (
    <div className="dashboard">
      <ContactModal isOpen={showContact} onClose={() => setShowContact(false)} />
      
      {/* ── NAV ── */}
      <nav className="nav">
        <div className="logo">pulse-ai</div>
        <div className="search-wrap">
          <span className="search-icon">⌕</span>
          <input
            type="text"
            className="search-input"
            placeholder="Search news…"
            value={searchQuery}
            onChange={handleSearch}
          />
        </div>
        <div className="nav-right">
          <span className="last-updated">Updated {formatRefreshed(lastRefreshed)}</span>
          <button
            className={`btn refresh-btn ${isRefreshing ? "btn-loading" : ""}`}
            onClick={refresh}
            disabled={isRefreshing}
          >
            <span className="refresh-icon">↻</span>
            <span className="refresh-text">{isRefreshing ? "  Refreshing…" : "  Refresh"}</span>
          </button>
          <button className="contact-btn" onClick={() => setContactOpen(true)}>Contact</button>
          <div className="auth-section">
            {user ? <UserMenu user={user} /> : <button onClick={() => setAuthOpen(true)} className="auth-btn">Login / Register</button>}
          </div>
        </div>
      </nav>

      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />

      {/* ── TABS ── */}
      <div className="tabs">
        {GROUPS.map((g) => (
          <button
            key={g}
            className={`tab ${activeGroup === g ? "tab-active" : ""}`}
            onClick={() => handleGroupChange(g)}
          >
            {g}
            <span className="count-badge">{groupCounts[g] || 0}</span>
          </button>
        ))}
      </div>

      {/* ── SOURCE CHIPS ── */}
      {!(activeGroup === "My Watchlist" && following.length === 0) && (
        <div className="source-filter">
          <div
            className={`source-chip ${activeSources.size === 0 ? "chip-active" : ""}`}
            onClick={clearSources}
            style={activeSources.size === 0 ? { background: "rgba(255,255,255,0.1)" } : {}}
          >
            All sources
          </div>
          {sourcesForFilter.map((s) => {
            const isFollowing = following.includes(s.name);
            return (
              <div
                key={s.name}
                className={`source-chip ${activeSources.has(s.name) ? "chip-active" : ""} ${isFollowing ? "source-followed" : ""}`}
                onClick={() => toggleSource(s.name)}
              >
                <span className="source-dot" style={{ background: s.color }} />
                <span className="source-label">{s.name}</span>
                <span
                  className={`follow-star ${isFollowing ? "followed" : ""}`}
                  // Marked this handler as async to support 'await' inside it safely
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (!user) {
                      localStorage.setItem("pendingFollow", s.name);
                      setPendingCompany(s.name);
                      setAuthOpen(true);
                      return;
                    }
                    if (isFollowing) {
                      await unfollow(s.name);
                    } else {
                      await follow(s.name);
                    }
                    reloadWeeklyIntelligence();
                  }}
                >
                  {isFollowing ? "★" : "☆"}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {activeGroup === "My Watchlist" && following.length > 0 && (
        <div className="watchlist-tabs">
          <div className="watchlist-view-toggle">
            <button
              className={`watchlist-btn ${watchlistView === "latest" ? "watchlist-btn-active" : ""}`}
              onClick={() => setWatchlistView("latest")}
            >
              Latest News
            </button>
            <button
              className={`watchlist-btn ${watchlistView === "weekly" ? "watchlist-btn-active" : ""}`}
              onClick={() => setWatchlistView("weekly")}
            >
              Weekly Intelligence
            </button>
          </div>
        </div>
      )}

      {/* ── STATS BAR ── */}
      {(routeDateFilter === "today" || routeDateFilter === "yesterday") && (
        <div className="banner banner-info">Showing news fetched {routeDateFilter}.</div>
      )}

      {/* ── TOOLBAR ── */}
      {articles.length > 0 && !(activeGroup === "My Watchlist" && watchlistView === "weekly") && (
        <div className="toolbar">
          <span className="toolbar-label">Sort by</span>
          <button className={`sort-btn ${sortMode === "latest" ? "sort-active" : ""}`} onClick={() => setSortMode("latest")}>Latest</button>
          <button className={`sort-btn ${sortMode === "source" ? "sort-active" : ""}`} onClick={() => setSortMode("source")}>Source</button>
          <span className="total-label">{filtered.length} articles</span>
        </div>
      )}

      {/* ── ERROR BANNER ── */}
      {error && (
        <div className="banner banner-error">⚠ Backend error: {error}. Is the backend running?</div>
      )}

      {/* ── GRID ── */}
      <div className="grid-wrap">
        <div className="grid">
          {loading ? (
            Array(9).fill(null).map((_, i) => <SkeletonCard key={i} />)
          ) : activeGroup === "My Watchlist" && following.length === 0 ? (
            <div className="watchlist-empty">
              <div className="watchlist-empty-icon">★</div>
              <h2>Build Your Watchlist</h2>
              <p>Follow the companies that matter to you by clicking the ★ icon next to any company above.</p>
              <p>Your personalized daily and weekly intelligence will appear here.</p>
            </div>
          ) : activeGroup === "My Watchlist" && watchlistView === "weekly" ? (
            <div className="weekly-intelligence">
              {weeklyLoading ? (
                <div>Loading intelligence...</div>
              ) : (
                <>
                  <div className="weekly-header">
                    <div className="weekly-meta">
                      <div className="weekly-pill">{formatWeek(weeklyData?.week)}</div>
                      <div className="weekly-pill">{weeklyData?.companyCount} Companies</div>
                    </div>
                  </div>
                  <div className="intelligence-grid">
                    <div className="intel-card">
                      <div className="intel-card-header">Top Moves</div>
                      <div className="intel-card-content">
                        {(weeklyData?.executiveSummary?.whatChanged || []).map((item, idx) => (
                          <div className="intel-item" key={idx}>
                            <div className="intel-row">
                              <span className="intel-company">{item.company}</span>
                              <span className="intel-text">{item.text}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="intel-card">
                      <div className="intel-card-header">Why It Matters</div>
                      <div className="intel-card-content">
                        {(weeklyData?.executiveSummary?.whyItMatters || []).map((item, idx) => (
                          <div className="intel-item" key={idx}>
                            <span className="intel-company">{item.company}</span>
                            <span className="intel-text">{item.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="intel-card">
                      <div className="intel-card-header">Signals To Watch</div>
                      <div className="intel-card-content">
                        {(weeklyData?.executiveSummary?.signalsToWatch || []).map((item, idx) => (
                          <div className="intel-item" key={idx}>
                            <div className="intel-company">{item.company}</div>
                            <div className="intel-text">{item.text}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : debouncedSearch && filtered.length === 0 ? (
            <div className="empty">No articles matched your search.</div>
          ) : (
            filtered.map((a, i) => (
              <NewsCard key={`${a.id}-${i}`} article={a} index={i} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}