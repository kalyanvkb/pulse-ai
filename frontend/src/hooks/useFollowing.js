import { useEffect, useState } from "react";

export default function useFollowing(user) {
  const [following, setFollowing] = useState([]);
  const [loadingFollowing, setLoadingFollowing] = useState(false);

  // 1. Define loadFollowing first so useEffect can safely access it
  const loadFollowing = async (emailOverride) => {
    const email = emailOverride || user?.email;

    if (!email) {
      setFollowing([]);
      return;
    }

    try {
      setLoadingFollowing(true);

      const response = await fetch(
        `/api/users/following?email=${encodeURIComponent(email)}`
      );

      if (!response.ok) {
        throw new Error("Failed to load followed companies");
      }

      const data = await response.json();

      setFollowing(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading followed companies:", err);
      setFollowing([]);
    } finally {
      setLoadingFollowing(false);
    }
  };

  // 2. Load followed companies when user changes
  useEffect(() => {
    if (!user?.email) {
      setFollowing([]);
      return;
    }

    loadFollowing(user.email);
  }, [user]);

  const follow = async (company) => {
    if (!user?.email || !company) {
      return;
    }

    try {
      const response = await fetch("/api/users/follow", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: user.email,
          company,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to follow company");
      }

      await loadFollowing(user.email);

      
    } catch (err) {
      console.error("Error following company:", err);
    }
  };

  const unfollow = async (company) => {

  try {

    const response = await fetch(
      "/api/users/unfollow",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          email: user.email,
          company,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(
        "Failed to unfollow company"
      );
    }

    await loadFollowing(
      user.email
    );

    
  } catch (err) {

    console.error(
      "Error unfollowing company:",
      err
    );
  }
};

  return {
    following,
    loadingFollowing,
    loadFollowing,
    follow,
    unfollow,
  };
}