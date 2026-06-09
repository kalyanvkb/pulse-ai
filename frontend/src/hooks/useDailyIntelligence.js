import {
  useEffect,
  useState,
  useCallback
} from "react";

export default function useDailyIntelligence(user) {

  const [data, setData] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState(null);

  const load = useCallback(async () => {

    if (!user?.email) {
      return;
    }

    try {

      console.log(
        "DAILY LOAD STARTED"
      );

      setLoading(true);

      setError(null);

      const response =
        await fetch(
          `/api/intelligence/daily?email=${encodeURIComponent(
            user.email
          )}`
        );

      console.log(
        "DAILY RESPONSE STATUS:",
        response.status
      );

      if (!response.ok) {

        const errorText =
          await response.text();

        throw new Error(
          errorText
        );
      }

      const json =
        await response.json();

      console.log(
        "DAILY RESPONSE:",
        json
      );

      setData(json);

    } catch (err) {

      console.error(
        "DAILY ERROR:",
        err
      );

      setError(
        "Failed to load daily intelligence"
      );

    } finally {

      console.log(
        "SETTING DAILY LOADING FALSE"
      );

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

    reload: load
  };
}