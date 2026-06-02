import React from "react";
import useWeeklyIntelligence
  from "../hooks/useWeeklyIntelligence";

export default function WeeklyIntelligence() {

  const {
    data,
    loading,
    error
  } = useWeeklyIntelligence();

  if (loading) {

    return (
      <div className="page">
        Loading Weekly Intelligence...
      </div>
    );
  }

  if (error) {

    return (
      <div className="page">
        {error}
      </div>
    );
  }

  if (!data) {

    return (
      <div className="page">
        No intelligence available.
      </div>
    );
  }

  return (
    <div className="page">

      <h1>
        Weekly Intelligence
      </h1>

      <div className="week-label">
        Week: {data.week}
      </div>

      {renderSection(
        "What Changed",
        data.sections?.what_changed
      )}

      {renderSection(
        "Why It Matters",
        data.sections?.why_it_matters
      )}

      {renderSection(
        "Signals To Watch",
        data.sections?.signals_to_watch
      )}

    </div>
  );
}

function renderSection(
  title,
  items = []
) {

  return (

    <div className="intel-section">

      <h2>{title}</h2>

      {items.length === 0 ? (
        <div>
          No items available
        </div>
      ) : (

        items.map(
          (item, index) => (

            <div
              key={`${title}-${index}`}
              className="intel-card"
            >

              <div className="intel-company">
                {item.company}
              </div>

              <div className="intel-text">
                {item.text}
              </div>

              <div className="intel-score">
                Importance:
                {" "}
                {item.importance}
              </div>

            </div>
          )
        )
      )}
    </div>
  );
}