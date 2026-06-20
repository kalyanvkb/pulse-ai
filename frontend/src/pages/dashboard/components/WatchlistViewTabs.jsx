import React from "react";

export default function WatchlistViewTabs({ watchlistView, onChange }) {
  return (
    <div className="watchlist-tabs">
      <div className="watchlist-view-toggle">
        <button
          className={`watchlist-btn ${
            watchlistView === "latest" ? "watchlist-btn-active" : ""
          }`}
          onClick={() => onChange("latest")}
        >
          Latest
        </button>

        <button
          className={`watchlist-btn ${
            watchlistView === "daily" ? "watchlist-btn-active" : ""
          }`}
          onClick={() => onChange("daily")}
        >
          Daily Briefing
        </button>

        <button
          className={`watchlist-btn ${
            watchlistView === "weekly" ? "watchlist-btn-active" : ""
          }`}
          onClick={() => onChange("weekly")}
        >
          Weekly Intelligence
        </button>
      </div>
    </div>
  );
}