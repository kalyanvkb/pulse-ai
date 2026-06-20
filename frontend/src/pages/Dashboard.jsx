import React, { useEffect, useMemo, useState } from "react";
//import { useNavigate } from "react-router-dom";

import useNews from "../hooks/useNews";
import useFollowing from "../hooks/useFollowing";
import useWeeklyIntelligence from "../hooks/useWeeklyIntelligence";
import useDailyIntelligence from "../hooks/useDailyIntelligence";

import ContactModal from "../components/ContactModal";
import AuthModal from "../components/AuthModal";

import { auth, onAuthStateChanged } from "../firebase";

import {
  GROUPS,
  normalizeGroup,
  getSourcesForGroup,
  getDateFilterFromPath,
  getDateFilterValue,
} from "./dashboard/dashboardUtils";

import DashboardHeader from "./dashboard/components/DashboardHeader";
import DashboardTabs from "./dashboard/components/DashboardTabs";
import SourceFilterBar from "./dashboard/components/SourceFilterBar";
import WatchlistViewTabs from "./dashboard/components/WatchlistViewTabs";
import DailyBriefingView from "./dashboard/components/DailyBriefingView";
import WeeklyIntelligenceView from "./dashboard/components/WeeklyIntelligenceView";
import ArticleGrid from "./dashboard/components/ArticleGrid";
import WatchlistEmptyState from "./dashboard/components/WatchlistEmptyState";

export default function Dashboard() {
  //const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [contactOpen, setContactOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [pendingCompany, setPendingCompany] = useState(null);

  const { articles, loading, error, refresh, lastRefreshed, isRefreshing } =
    useNews();

  const { following, follow, unfollow } = useFollowing(user);

  const [activeGroup, setActiveGroup] = useState("My Watchlist");
  const [activeSources, setActiveSources] = useState(new Set());
  const [sortMode, setSortMode] = useState("latest");
  const [searchQuery, setSearchQuery] = useState("");
  const [watchlistView, setWatchlistView] = useState("daily");

  const {
    data: weeklyData,
    loading: weeklyLoading,
    reload: reloadWeeklyIntelligence,
  } = useWeeklyIntelligence(user);

  const {
    data: dailyData,
    loading: dailyLoading,
    error: dailyError,
    reload: refreshDaily,
  } = useDailyIntelligence(user);

  const [debouncedSearch, setDebouncedSearch] = useState("");

  const debounceRef = useMemo(() => {
    let timer = null;
    return (val) => {
      clearTimeout(timer);
      timer = setTimeout(() => setDebouncedSearch(val), 300);
    };
  }, []);

  const [groupInitialized, setGroupInitialized] = useState(false);

  const routeDateFilter = useMemo(
    () => getDateFilterFromPath(window.location.pathname),
    []
  );

  useEffect(() => {
    if (activeGroup === "My Watchlist") {
      if (reloadWeeklyIntelligence) reloadWeeklyIntelligence();
      if (refreshDaily) refreshDaily();
    }
  }, [following, activeGroup, reloadWeeklyIntelligence, refreshDaily]);

  useEffect(() => {
    if (!authLoading && user?.email && following.length > 0 && activeGroup === "All") {
      setWatchlistView("daily");
    }
  }, [authLoading, user, following, activeGroup]);

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

        await Promise.all([
          reloadWeeklyIntelligence
            ? reloadWeeklyIntelligence()
            : Promise.resolve(),
          refreshDaily ? refreshDaily() : Promise.resolve(),
        ]);
      };

      autoFollow();
    }
  }, [user, follow, reloadWeeklyIntelligence, refreshDaily]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) setUser(firebaseUser);
      else setUser(null);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    debounceRef(value.trim().toLowerCase());
  };

  const handleGroupChange = (group) => {
    setActiveGroup(group);
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

  const filtered = useMemo(() => {
    let arr = [...articles];

    const seen = new Set();
    arr = arr.filter((a) => {
      if (seen.has(a.title)) return false;
      seen.add(a.title);
      return true;
    });

    if (activeGroup === "My Watchlist") {
      const followedSet = new Set(following.map((s) => s.trim().toLowerCase()));
      arr = arr.filter((a) =>
        followedSet.has((a.source || "").trim().toLowerCase())
      );
    } else if (activeGroup !== "All") {
      arr = arr.filter((a) => normalizeGroup(a.group) === activeGroup);
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
      return Array.isArray(article.summary)
        ? article.summary.length > 0
        : Boolean(article.summary);
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
  }, [
    articles,
    activeGroup,
    activeSources,
    debouncedSearch,
    sortMode,
    routeDateFilter,
    following,
  ]);

  const sourcesForFilter = useMemo(() => {
    if (activeGroup === "My Watchlist") {
      return getSourcesForGroup(
        articles.filter((a) => following.includes(a.source)),
        "All"
      );
    }
    return getSourcesForGroup(articles, activeGroup);
  }, [articles, activeGroup, following]);

  const groupCounts = useMemo(() => {
    const counts = { All: articles.length };
    counts["My Watchlist"] = articles.filter((a) =>
      following.includes(a.source)
    ).length;

    GROUPS.slice(2).forEach((g) => {
      counts[g] = articles.filter((a) => normalizeGroup(a.group) === g).length;
    });

    return counts;
  }, [articles, following]);

  if (authLoading) {
    return <div className="loading-screen">Loading...</div>;
  }

  const showWatchlistTabs =
    activeGroup === "My Watchlist" && following.length > 0;

  const showToolbar =
    articles.length > 0 &&
    !(
      activeGroup === "My Watchlist" &&
      (watchlistView === "weekly" || watchlistView === "daily")
    );

  return (
    <div className="dashboard">
      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />

      <DashboardHeader
        searchQuery={searchQuery}
        onSearchChange={handleSearch}
        lastRefreshed={lastRefreshed}
        isRefreshing={isRefreshing}
        onRefresh={refresh}
        user={user}
        onOpenAuth={() => setAuthOpen(true)}
        onOpenContact={() => setContactOpen(true)}
      />

      <DashboardTabs
        groups={GROUPS}
        activeGroup={activeGroup}
        groupCounts={groupCounts}
        onChange={handleGroupChange}
      />

      <SourceFilterBar
        activeGroup={activeGroup}
        following={following}
        sourcesForFilter={sourcesForFilter}
        activeSources={activeSources}
        onToggleSource={toggleSource}
        onClearSources={clearSources}
        user={user}
        follow={follow}
        unfollow={unfollow}
        setAuthOpen={setAuthOpen}
        setPendingCompany={setPendingCompany}
        reloadWeeklyIntelligence={reloadWeeklyIntelligence}
        refreshDaily={refreshDaily}
      />

      {showWatchlistTabs && (
        <WatchlistViewTabs
          watchlistView={watchlistView}
          onChange={setWatchlistView}
        />
      )}

      {(routeDateFilter === "today" || routeDateFilter === "yesterday") && (
        <div className="banner banner-info">
          Showing news fetched {routeDateFilter}.
        </div>
      )}

      {showToolbar && (
        <div className="toolbar">
          <span className="toolbar-label">Sort by</span>

          <button
            className={`sort-btn ${sortMode === "latest" ? "sort-active" : ""}`}
            onClick={() => setSortMode("latest")}
          >
            Latest
          </button>

          <button
            className={`sort-btn ${sortMode === "source" ? "sort-active" : ""}`}
            onClick={() => setSortMode("source")}
          >
            Source
          </button>

          <span className="total-label">{filtered.length} articles</span>
        </div>
      )}

      {error && (
        <div className="banner banner-error">
          ⚠ Backend error: {error}. Is the backend running?
        </div>
      )}

      <div className="grid-wrap">
        <div className="grid">
          {activeGroup === "My Watchlist" && following.length === 0 ? (
            <WatchlistEmptyState />
          ) : activeGroup === "My Watchlist" && watchlistView === "daily" ? (
            <DailyBriefingView
              loading={dailyLoading}
              data={dailyData}
              userEmail={user?.email}
            />
          ) : activeGroup === "My Watchlist" && watchlistView === "weekly" ? (
            <WeeklyIntelligenceView
              loading={weeklyLoading}
              data={weeklyData}
              userEmail={user?.email}
            />
          ) : (
            <ArticleGrid
              loading={loading}
              filtered={filtered}
              debouncedSearch={debouncedSearch}
            />
          )}
        </div>
      </div>
    </div>
  );
}