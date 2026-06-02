import { useEffect, useState } from "react";
import { auth } from "../firebase";

export default function useDailyIntelligence() {

  const [data, setData] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState(null);

  useEffect(() => {

    const load = async () => {

      try {

        const user =
          auth.currentUser;

        if (!user?.email) {

          setLoading(false);
          return;
        }

        const response =
          await fetch(
            `/api/intelligence/daily?email=${encodeURIComponent(
              user.email
            )}`
          );

        const json =
          await response.json();

        setData(json);

      } catch (err) {

        console.error(err);

        setError(
          "Failed to load daily intelligence"
        );

      } finally {

        setLoading(false);
      }
    };

    load();

  }, []);

  return {
    data,
    loading,
    error
  };
}