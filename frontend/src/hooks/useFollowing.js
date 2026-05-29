import { useEffect, useState } from "react";

export default function useFollowing(user) {
  const [following, setFollowing] = useState([]);
  const [loadingFollowing, setLoadingFollowing] = useState(false);

  // Load followed companies when user logs in
  useEffect(() => {
    if (!user?.email) {
      setFollowing([]);
      return;
    }

    loadFollowing();
  }, [user]);

  const loadFollowing = async () => {
    try {
      setLoadingFollowing(true);

      const response = await fetch(
        `/api/users/following?email=${encodeURIComponent(
          user.email
        )}`
      );

      if (!response.ok) {
        throw new Error("Failed to load followed companies");
      }

      const data = await response.json();

      setFollowing(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(
        "Error loading followed companies:",
        err
      );

      setFollowing([]);
    } finally {
      setLoadingFollowing(false);
    }
  };

  const follow = async (company) => {
    if (!user?.email || !company) return;

    try {
      const response = await fetch(
        "/api/users/follow",
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
        throw new Error("Failed to follow company");
      }

      // Optimistic UI update
      setFollowing((prev) => {
        if (prev.includes(company)) {
          return prev;
        }

        return [...prev, company];
      });

    } catch (err) {
      console.error(
        "Error following company:",
        err
      );
    }
  };

  const unfollow = async (company) => {
    if (!user?.email || !company) return;

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

      // Optimistic UI update
      setFollowing((prev) =>
        prev.filter((c) => c !== company)
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