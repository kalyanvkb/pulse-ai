import React from "react";

export default function SourceFilterBar({
  activeGroup,
  following,
  sourcesForFilter,
  activeSources,
  onToggleSource,
  onClearSources,
  user,
  follow,
  unfollow,
  setAuthOpen,
  setPendingCompany,
  reloadWeeklyIntelligence,
  refreshDaily,
}) {
  if (activeGroup === "My Watchlist" && following.length === 0) {
    return null;
  }

  return (
    <div className="source-filter">
      <div
        className={`source-chip ${activeSources.size === 0 ? "chip-active" : ""}`}
        onClick={onClearSources}
        style={
          activeSources.size === 0
            ? { background: "rgba(255,255,255,0.1)" }
            : {}
        }
      >
        All sources
      </div>

      {sourcesForFilter.map((s) => {
        const isFollowing = following.includes(s.name);

        return (
          <div
            key={s.name}
            className={`source-chip ${activeSources.has(s.name) ? "chip-active" : ""} ${
              isFollowing ? "source-followed" : ""
            }`}
            onClick={() => onToggleSource(s.name)}
          >
            <span
              className="source-dot"
              style={{ background: s.color || "#ccc" }}
            />
            <span className="source-label">{s.name}</span>

            <span
              className={`follow-star ${isFollowing ? "followed" : ""}`}
              onClick={async (e) => {
                e.stopPropagation();

                if (!user) {
                  localStorage.setItem("pendingFollow", s.name);
                  setPendingCompany(s.name);
                  setAuthOpen(true);
                  return;
                }

                if (isFollowing) await unfollow(s.name);
                else await follow(s.name);

                if (reloadWeeklyIntelligence) reloadWeeklyIntelligence();
                if (refreshDaily) refreshDaily();
              }}
            >
              {isFollowing ? "★" : "☆"}
            </span>
          </div>
        );
      })}
    </div>
  );
}