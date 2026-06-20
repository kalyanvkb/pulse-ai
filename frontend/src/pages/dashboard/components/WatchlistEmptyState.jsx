import React from "react";

export default function WatchlistEmptyState() {
  return (
    <div className="watchlist-empty">
      <div className="watchlist-empty-icon">★</div>
      <h2>Build Your Watchlist</h2>
      <p>
        Follow the companies that matter to you by clicking the ★ icon next to
        any company from the sources above.
      </p>
      <p>Your personalized daily and weekly intelligence will appear here.</p>
    </div>
  );
}