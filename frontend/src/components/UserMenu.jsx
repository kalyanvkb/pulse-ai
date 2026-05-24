import React, { useState, useRef, useEffect } from "react";
import { logout } from "../firebase";

export default function UserMenu({ user }) {

  const [open, setOpen] = useState(false);

  const menuRef = useRef(null);

  const handleLogout = async () => {
    await logout();

    localStorage.removeItem("token");

    window.location.reload();
  };

  // Close dropdown on outside click
  useEffect(() => {

    const handleClickOutside = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };

  }, []);

  const firstName =
    user?.displayName?.split(" ")[0] || "User";

  return (
    <div className="user-menu-wrapper" ref={menuRef}>

      {/* Welcome text */}
      <span className="welcome-text">
        👋 {firstName}
      </span>

      {/* Avatar */}
      <button
        className="avatar-btn"
        onClick={() => setOpen(!open)}
      >

        {user?.photoURL ? (
          <img
            src={user.photoURL}
            alt="profile"
            className="user-avatar"
          />
        ) : (
          <div className="avatar-fallback">
            {firstName[0]}
          </div>
        )}

      </button>

      {/* Dropdown */}
      {open && (
        <div className="user-dropdown">

            <button
            className="dropdown-item"
            onClick={handleLogout}
          >
            Sign Out
          </button>

        </div>
      )}

    </div>
  );
}