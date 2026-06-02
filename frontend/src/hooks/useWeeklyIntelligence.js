import { useEffect, useState, useCallback } from "react";

export default function useWeeklyIntelligence(user) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Wrapped in useCallback to prevent infinite loops when passed as a dependency
  const load = useCallback(async () => {
    if (!user?.email) {
      return;
    }

    try {
      setLoading(true);
      setError(null); // Clear previous errors on retry

      const response = await fetch(
        `/api/intelligence/weekly?email=${encodeURIComponent(user.email)}`
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      const json = await response.json();
      setData(json);
    } catch (err) {
      console.error(err);
      setError("Failed to load weekly intelligence");
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    data,
    loading,
    error,
    reload: load // Exposing this allows Dashboard.jsx to call reloadWeeklyIntelligence()
  };
}