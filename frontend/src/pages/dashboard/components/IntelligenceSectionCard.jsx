import React from "react";
import ShareInsightButton from "../../../components/ShareInsightButton";

export default function IntelligenceSectionCard({
  title,
  shareTitle,
  subtitle,
  period,
  sectionType,
  items = [],
  userEmail,
}) {
  return (
    <div className="intel-card">
      <div className="intel-card-header intel-card-header-action">
        <span>{title}</span>
        <ShareInsightButton
          title={shareTitle}
          subtitle={subtitle}
          period={period}
          sectionType={sectionType}
          items={items}
          userEmail={userEmail}
        />
      </div>

      <div className="intel-card-content">
        {items.map((item, idx) => (
          <div className="intel-item" key={idx}>
            <div className="intel-row">
              <span className="intel-company">{item.company}</span>
              <span className="intel-text">{item.text}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}