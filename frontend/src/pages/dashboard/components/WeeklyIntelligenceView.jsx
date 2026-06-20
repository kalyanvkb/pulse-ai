import React from "react";
import IntelligenceSectionCard from "./IntelligenceSectionCard";
import MobileAccordionSection from "./MobileAccordionSection";
import { formatWeek } from "../dashboardUtils";

export default function WeeklyIntelligenceView({ loading, data, userEmail }) {
  if (loading) {
    return (
      <div className="weekly-intelligence">
        <div>Loading intelligence...</div>
      </div>
    );
  }

  const period = formatWeek(data?.week);
  const whatChanged = data?.executiveSummary?.whatChanged || [];
  const whyItMatters = data?.executiveSummary?.whyItMatters || [];
  const signalsToWatch = data?.executiveSummary?.signalsToWatch || [];

  return (
    <div className="weekly-intelligence">
      <div className="weekly-header">
        <div className="weekly-meta">
          <div className="weekly-pill">{period}</div>
          <div className="weekly-pill">{data?.companyCount} Companies</div>
        </div>
      </div>

      <div className="desktop-only">
        <div className="intelligence-grid">
          <IntelligenceSectionCard
            title="🚀 Top Moves"
            shareTitle="Top Moves This Week"
            subtitle="The strongest changes across your watchlist"
            period={period}
            sectionType="weekly-top-moves"
            items={whatChanged}
            userEmail={userEmail}
          />

          <IntelligenceSectionCard
            title="🧠 Why It Matters"
            shareTitle="Why It Matters"
            subtitle="The business implications behind this week's AI moves"
            period={period}
            sectionType="weekly-why-it-matters"
            items={whyItMatters}
            userEmail={userEmail}
          />

          <IntelligenceSectionCard
            title="🔮 Signals To Watch"
            shareTitle="Signals To Watch"
            subtitle="Forward-looking signals from your tracked companies"
            period={period}
            sectionType="weekly-signals-to-watch"
            items={signalsToWatch}
            userEmail={userEmail}
          />
        </div>
      </div>

      <div className="mobile-only">
        <div className="intelligence-grid">
          <MobileAccordionSection
            title="🚀 Top Moves"
            shareTitle="Top Moves This Week"
            subtitle="The strongest changes across your watchlist"
            period={period}
            sectionType="weekly-top-moves"
            items={whatChanged}
            userEmail={userEmail}
            defaultOpen={true}
          />

          <MobileAccordionSection
            title="🧠 Why It Matters"
            shareTitle="Why It Matters"
            subtitle="The business implications behind this week's AI moves"
            period={period}
            sectionType="weekly-why-it-matters"
            items={whyItMatters}
            userEmail={userEmail}
          />

          <MobileAccordionSection
            title="🔮 Signals To Watch"
            shareTitle="Signals To Watch"
            subtitle="Forward-looking signals from your tracked companies"
            period={period}
            sectionType="weekly-signals-to-watch"
            items={signalsToWatch}
            userEmail={userEmail}
          />
        </div>
      </div>
    </div>
  );
}