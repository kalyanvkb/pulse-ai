import React from "react";

export default function DashboardTabs({
  groups,
  activeGroup,
  groupCounts,
  onChange,
}) {
  return (
    <div className="tabs">
      {groups.map((g) => (
        <button
          key={g}
          className={`tab ${activeGroup === g ? "tab-active" : ""}`}
          onClick={() => onChange(g)}
        >
          {g}
          <span className="count-badge">{groupCounts[g] || 0}</span>
        </button>
      ))}
    </div>
  );
}