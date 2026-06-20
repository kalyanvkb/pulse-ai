import React from "react";
import ShareInsightButton from "../../../components/ShareInsightButton";

export default function MobileAccordionSection({
  title,
  shareTitle,
  subtitle,
  period,
  sectionType,
  items = [],
  userEmail,
  defaultOpen = false,
}) {
  return (
    <details className="mobile-accordion" open={defaultOpen}>
      <summary className="mobile-accordion-header">
        <span className="mobile-accordion-title">{title}</span>

        <ShareInsightButton
          title={shareTitle}
          subtitle={subtitle}
          period={period}
          sectionType={sectionType}
          items={items}
          userEmail={userEmail}
        />

        <span className="accordion-count">({items.length})</span>
      </summary>

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
    </details>
  );
}