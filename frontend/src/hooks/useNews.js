// frontend/src/hooks/useNews.js — Custom hook for fetching and managing news state

import { useState, useEffect, useCallback, useRef } from "react";
import { fetchNews, triggerRefresh } from "../api";

const POLL_INTERVAL = 60 * 1000; // poll every 60s to pick up backend refreshes

/**
 * useNews — manages article fetching, filtering, searching, and refresh
 * @returns {object} - articles, loading, error, refresh, lastRefreshed, total
 */
export default function useNews() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [total, setTotal] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const pollRef = useRef(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchNews({ limit: 200 });
      setArticles(data.articles || []);
      setTotal(data.total || 0);
      setLastRefreshed(data.refreshedAt);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await triggerRefresh();
      // Wait a moment for backend to start, then poll
      await new Promise((r) => setTimeout(r, 2000));
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsRefreshing(false);
    }
  }, [load]);

  // Initial load
  useEffect(() => {
    load();
  }, [load]);

  // Poll for updates
  useEffect(() => {
    pollRef.current = setInterval(load, POLL_INTERVAL);
    return () => clearInterval(pollRef.current);
  }, [load]);

  return { articles, loading, error, refresh, lastRefreshed, total, isRefreshing };
}
