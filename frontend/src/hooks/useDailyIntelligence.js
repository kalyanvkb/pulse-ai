import { useEffect, useState } from "react";
import { auth } from "../firebase";

export default function useDailyIntelligence( user ) {

  const [data, setData] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState(null);

  const load = async () => {

  try {

    console.log("DAILY LOAD STARTED");

     if (!user?.email) {

    console.log(
      "Daily intelligence waiting for user..."
    );
     setLoading(false);

    return;
  }



    setLoading(true);

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
};

  useEffect(() => {

  load();

}, [user]);

  return {

    data,

    loading,

    error,

    reload: load
  };
}