import React from "react";
import UserMenu from "../../../components/UserMenu";
import { formatRefreshed } from "../dashboardUtils";

export default function DashboardHeader({
  searchQuery,
  onSearchChange,
  lastRefreshed,
  isRefreshing,
  onRefresh,
  user,
  onOpenAuth,
  onOpenContact,
}) {
  return (
    <nav className="nav">
      <div className="logo">pulse-ai</div>

      <div className="search-wrap">
        <span className="search-icon">⌕</span>
        <input
          type="text"
          className="search-input"
          placeholder="Search news…"
          value={searchQuery}
          onChange={onSearchChange}
        />
      </div>

      <div className="nav-right">
        <span className="last-updated">
          Updated {formatRefreshed(lastRefreshed)}
        </span>

        <button
          className={`btn refresh-btn ${isRefreshing ? "btn-loading" : ""}`}
          onClick={onRefresh}
          disabled={isRefreshing}
        >
          <span className="refresh-icon">↻</span>
          <span className="refresh-text">
            {isRefreshing ? " Refreshing…" : " Refresh"}
          </span>
        </button>

        <button className="contact-btn" onClick={onOpenContact}>
          Contact
        </button>

        <div className="auth-section">
          {user ? (
            <UserMenu user={user} />
          ) : (
            <button onClick={onOpenAuth} className="auth-btn">
              Login / Register
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}