import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

export default function SharePage() {
  const { shareSlug } = useParams();
  const [loading, setLoading] = useState(true);
  const [shareCard, setShareCard] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadShare() {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(`${API_BASE}/api/share-cards/${shareSlug}`);
        const data = await res.json();

        if (!res.ok || !data?.success) {
          throw new Error(data?.error || "Failed to load share card");
        }

        if (!mounted) return;
        setShareCard(data.shareCard);
      } catch (err) {
        console.error(err);
        if (mounted) setError(err.message || "Failed to load share card");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadShare();

    return () => {
      mounted = false;
    };
  }, [shareSlug]);

  if (loading) {
    return (
      <div className="share-page-shell">
        <div className="share-page-card">Loading shared insight…</div>
      </div>
    );
  }

  if (error || !shareCard) {
    return (
      <div className="share-page-shell">
        <div className="share-page-card">
          {error || "Share card not found"}
        </div>
      </div>
    );
  }

  const items = (shareCard?.payload?.items || []).slice(0, 5);

  return (
    <div className="share-page-shell">
      <div className="share-page-card">
        <div className="share-page-topbar">
          <div className="share-page-brand">
            <span className="share-page-brand-dot" />
            pulse-ai
          </div>
          {shareCard.period ? (
            <div className="share-page-period">{shareCard.period}</div>
          ) : null}
        </div>

        <h1 className="share-page-title">{shareCard.title}</h1>

        {shareCard.subtitle ? (
          <div className="share-page-subtitle">{shareCard.subtitle}</div>
        ) : null}

        <div className="share-page-items">
          {items.map((item, idx) => (
            <div className="share-page-item" key={idx}>
              <div className="share-page-index">{idx + 1}</div>

              <div className="share-page-copy">
                {item.company ? (
                  <div className="share-page-company">{item.company}</div>
                ) : null}
                <div className="share-page-text">{item.text}</div>
              </div>
            </div>
          ))}
        </div>

        <a
          href="https://pulse-ai.in"
          target="_blank"
          rel="noopener noreferrer"
          className="share-page-cta"
        >
          Explore more AI intelligence on Pulse-AI
        </a>
      </div>
    </div>
  );
}