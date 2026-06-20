import React from "react";
import IntelligenceSectionCard from "./IntelligenceSectionCard";
import MobileAccordionSection from "./MobileAccordionSection";

export default function DailyBriefingView({ loading, data, userEmail }) {
  if (loading) {
    return (
      <div className="weekly-intelligence">
        <div>Loading intelligence...</div>
      </div>
    );
  }

  const whatsHappening = data?.executiveSummary?.whatsHappening || [];
  const whyItMatters = data?.executiveSummary?.whyItMatters || [];

  return (
    <div className="weekly-intelligence">
      <div className="weekly-header">
        <div className="weekly-meta">
          <div className="weekly-pill">{data?.date}</div>
          <div className="weekly-pill">{data?.companyCount} Companies</div>
        </div>
      </div>

      <div className="desktop-only">
        <div className="intelligence-grid daily-grid">
          <IntelligenceSectionCard
            title="🔥 Top Developments Today"
            shareTitle="Top Developments Today"
            subtitle="Key moves from your tracked companies"
            period={data?.date}
            sectionType="daily-top-developments"
            items={whatsHappening}
            userEmail={userEmail}
          />

          <IntelligenceSectionCard
            title="💡 Why It Matters"
            shareTitle="Why It Matters"
            subtitle="What the news means for operators and builders"
            period={data?.date}
            sectionType="daily-why-it-matters"
            items={whyItMatters}
            userEmail={userEmail}
          />
        </div>
      </div>

      <div className="mobile-only">
        <div className="intelligence-grid daily-grid">
          <MobileAccordionSection
            title="🔥 Top Developments Today"
            shareTitle="Top Developments Today"
            subtitle="Key moves from your tracked companies"
            period={data?.date}
            sectionType="daily-top-developments"
            items={whatsHappening}
            userEmail={userEmail}
            defaultOpen={true}
          />

          <MobileAccordionSection
            title="💡 Why It Matters"
            shareTitle="Why It Matters"
            subtitle="What the news means for operators and builders"
            period={data?.date}
            sectionType="daily-why-it-matters"
            items={whyItMatters}
            userEmail={userEmail}
          />
        </div>
      </div>
    </div>
  );
}