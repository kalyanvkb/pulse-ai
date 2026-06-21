import React from "react";

export default function WatchlistEmptyState() {
  return (<div className="watchlist-empty-shell">
  <div className="watchlist-empty-state">
    <div className="watchlist-empty-card">
      <div className="watchlist-empty-main">
        <div className="watchlist-empty-badge">
          <span className="watchlist-empty-badge-icon">★</span>
          <span className="watchlist-empty-badge-text">Your personal AI radar</span>
        </div>

        <h2 className="watchlist-empty-title">Build Your Watchlist</h2>

        <p className="watchlist-empty-copy">
          Follow the companies that matter to you by tapping the ★ icon anywhere in Pulse-AI.
          Your personalized daily and weekly intelligence will appear here.
        </p>

        <div className="watchlist-empty-highlights">
          <div className="watchlist-empty-pill">Daily Intelligence</div>
          <div className="watchlist-empty-pill">Weekly Intelligence</div>
          <div className="watchlist-empty-pill">Signals to Watch</div>
        </div>

        <div className="watchlist-empty-hint">
          Start with <strong>OpenAI, Anthropic, Google or Nvidia</strong> to unlock your first personalized briefing.
        </div>
      </div>

      <div className="watchlist-empty-preview">
        <div className="watchlist-preview-card">
          <div className="watchlist-preview-card-label">Daily Intelligence</div>
          <div className="watchlist-preview-card-title">Top developments across your watchlist</div>
          <div className="watchlist-preview-card-copy">
            See the most important moves from the companies you follow — condensed into a quick daily briefing.
          </div>
        </div>

        <div className="watchlist-preview-card">
          <div className="watchlist-preview-card-label">Why It Matters</div>
          <div className="watchlist-preview-card-title">Business implications, not just headlines</div>
          <div className="watchlist-preview-card-copy">
            Understand what launches, funding moves and model releases actually mean for operators and builders.
          </div>
        </div>

        <div className="watchlist-preview-card">
          <div className="watchlist-preview-card-label">Signals to Watch</div>
          <div className="watchlist-preview-card-title">Forward-looking intelligence</div>
          <div className="watchlist-preview-card-copy">
            Track early signals that may shape the next wave of moves in the AI ecosystem.
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
  );
}