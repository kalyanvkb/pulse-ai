import React from "react";
import { logout } from "../firebase";

export default function UserMenu({ user }) {

  const handleLogout = async () => {
    await logout();

    localStorage.removeItem("token");

    window.location.reload();
  };

  // Generate initials from user name
  const getInitials = (name) => {

    if (!name) return "U";

    return name
      .split(" ")
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  };

  const initials = getInitials(user?.displayName);

  return (
    <div className="user-menu-inline">

      <span className="welcome-text">
        👋 Welcome, {user?.displayName?.split(" ")[0] || "User"}
      </span>

      <div className="avatar-wrapper">

        {user?.photoURL ? (

          <img
            src={user.photoURL}
            alt="profile"
            className="user-avatar"
          />

        ) : (

          <div className="avatar-fallback">
            {initials}
          </div>

        )}

      </div>

      <button
        onClick={handleLogout}
        className="signout-btn"
      >
        Sign Out
      </button>

    </div>
  );
}