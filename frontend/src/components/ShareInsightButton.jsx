import React, { useMemo, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

export default function ShareInsightButton({
  title,
  subtitle,
  period,
  sectionType,
  items = [],
  userEmail,
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareStatus, setShareStatus] = useState("");
  const [shareCard, setShareCard] = useState(null);
  const [generating, setGenerating] = useState(false);

  //const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  const modalItems = useMemo(() => {
  return (items || []).slice(0, 5);
}, [items]);

const allShareItems = useMemo(() => {
  return (items || []).slice(0, 10);
}, [items]);


  const shareText = useMemo(() => {
    const lines = allShareItems.map((item, idx) => {
      if (typeof item === "string") return `${idx + 1}. ${item}`;
      const company = item?.company ? `${item.company}: ` : "";
      const text = item?.text || "";
      return `${idx + 1}. ${company}${text}`;
    });

    return [
      title,
      subtitle || "",
      period ? `Period: ${period}` : "",
      "",
      ...lines,
      "",
      "Shared via Pulse AI",
    ]
      .filter(Boolean)
      .join("\n");
  }, [title, subtitle, period, allShareItems]);

  const handleOpen = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen(true);
    setShareStatus("");

    if (!shareCard?.shareUrl && !generating) {
      await ensureShareCard();
    }
  };

  const handleClose = () => {
    setOpen(false);
    setCopied(false);
    setShareStatus("");
  };

  const ensureShareCard = async () => {
    if (shareCard?.shareUrl) {
      return shareCard;
    }

    if (generating) {
      return null;
    }

    try {
      setGenerating(true);
      setShareStatus("Preparing share card...");

      const normalizedItems = allShareItems.map((item) =>
        typeof item === "string"
          ? { company: "", text: item }
          : { company: item?.company || "", text: item?.text || "" }
      );

      const res = await fetch(`${API_BASE}/api/share-cards/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          subtitle,
          period,
          sectionType,
          items: normalizedItems,
          userEmail: userEmail || "",
          sourceContext: {
            viewType: sectionType?.includes("weekly") ? "weekly" : "daily",
          },
        }),
      });

      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        throw new Error("Share API returned a non-JSON response");
      }

      const data = await res.json();

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Failed to generate share card");
      }

      const generatedCard = data?.shareCard || null;

      if (!generatedCard?.shareUrl) {
        throw new Error("Share card generated without shareUrl");
      }

      setShareCard(generatedCard);
      setShareStatus("");

      return generatedCard;
    } catch (err) {
      console.error("ensureShareCard failed", err);
      setShareStatus("Failed to prepare share card");
      return null;
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async () => {
    try {
      const urlPart = shareCard?.shareUrl ? `\n\n${shareCard.shareUrl}` : "";
      await navigator.clipboard.writeText(`${shareText}${urlPart}`);
      setCopied(true);
      setShareStatus("Copied share content");
      setTimeout(() => {
        setCopied(false);
        setShareStatus("");
      }, 1800);
    } catch (err) {
      console.error("Copy failed", err);
      setShareStatus("Failed to copy");
      setTimeout(() => setShareStatus(""), 1800);
    }
  };

  const openShareWindow = (url) => {
    window.open(url, "_blank", "noopener,noreferrer,width=760,height=720");
  };

  const trackShareClick = async (cardArg) => {
    const slug = cardArg?.shareSlug || shareCard?.shareSlug;
    if (!slug) return;

    try {
      await fetch(`${API_BASE}/api/share-cards/${slug}/click`, {
        method: "POST",
      });
    } catch (err) {
      console.error("share click tracking failed", err);
    }
  };

  const handleShareX = async () => {
    if (generating) return;
    const card = await ensureShareCard();
    if (!card?.shareUrl) return;

    await trackShareClick(card);

    const text = encodeURIComponent(
      `${title}${subtitle ? ` — ${subtitle}` : ""}`
    );
    const url = encodeURIComponent(card.shareUrl);

    openShareWindow(`https://twitter.com/intent/tweet?text=${text}&url=${url}`);
  };

  const handleShareLinkedIn = async () => {
    if (generating) return;
    const card = await ensureShareCard();
    if (!card?.shareUrl) return;

    await trackShareClick(card);

    const url = encodeURIComponent(card.shareUrl);
    openShareWindow(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`);
  };

  const handleShareFacebook = async () => {
    if (generating) return;
    const card = await ensureShareCard();
    if (!card?.shareUrl) return;

    await trackShareClick(card);

    const url = encodeURIComponent(card.shareUrl);
    openShareWindow(`https://www.facebook.com/sharer/sharer.php?u=${url}`);
  };

  const handleShareInstagram = async () => {
    if (generating) return;
    const card = await ensureShareCard();
    if (!card?.shareUrl) return;

    const urlPart = `\n\n${card.shareUrl}`;

    try {
      await navigator.clipboard.writeText(`${shareText}${urlPart}`);
      setShareStatus("Copied caption + share link for Instagram");
      setTimeout(() => setShareStatus(""), 2200);
    } catch (err) {
      console.error("Failed to copy Instagram content", err);
      setShareStatus("Failed to copy caption for Instagram");
      setTimeout(() => setShareStatus(""), 2200);
    }

    await trackShareClick(card);
    openShareWindow("https://www.instagram.com/");
  };

  const previewImage = shareCard?.imageDataUrl || null;

  return (
    <>
      <button
        type="button"
        className="share-trigger-btn"
        aria-label={`Share ${title}`}
        title={`Share ${title}`}
        onClick={handleOpen}
      >
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <path d="M8.59 13.51 15.42 17.49" />
          <path d="M15.41 6.51 8.59 10.49" />
        </svg>
      </button>

      {open && (
        <div className="share-modal-backdrop" onClick={handleClose}>
          <div className="share-modal" onClick={(e) => e.stopPropagation()}>
            <div className="share-modal-header">
              <div className="share-modal-header-copy">
                <div className="share-modal-kicker">Share insight</div>
              </div>

              <button
                className="share-modal-close"
                onClick={handleClose}
                aria-label="Close share dialog"
              >
                ✕
              </button>
            </div>

            <div className="share-modal-summary">
  <div className="share-modal-summary-top">
    <div className="share-modal-summary-brand">
      <span className="share-preview-brand-dot" />
      <span className="share-preview-brand-text">pulse-ai</span>
    </div>

    {period ? (
      <div className="share-preview-date-pill">{period}</div>
    ) : null}
  </div>

  <div className="share-modal-summary-title">{title}</div>

  {subtitle ? (
    <div className="share-modal-summary-subtitle">{subtitle}</div>
  ) : null}
</div>

            <div className="share-preview-list">
  {modalItems.length === 0 ? (
    <div className="share-preview-empty">No items to share</div>
  ) : (
    modalItems.map((item, idx) => {
      const company = typeof item === "string" ? "" : item?.company || "";
      const text = typeof item === "string" ? item : item?.text || "";

      return (
        <div className="share-preview-row" key={idx}>
          <div className="share-preview-index">{idx + 1}</div>
          <div className="share-preview-copy">
            {company ? (
              <div className="share-preview-company">{company}</div>
            ) : null}
            <div className="share-preview-text">{text}</div>
          </div>
        </div>
      );
    })
  )}
</div>

            <div className="share-modal-actions">
              <button
                className={`share-icon-btn ${copied ? "share-icon-btn-copied" : ""}`}
                onClick={handleCopy}
                title={copied ? "Copied" : "Copy text"}
                aria-label="Copy text"
                disabled={generating}
              >
                {copied ? (
                  <svg
                    viewBox="0 0 24 24"
                    width="20"
                    height="20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                ) : (
                  <svg
                    viewBox="0 0 24 24"
                    width="20"
                    height="20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                )}
              </button>

              <button
                className="share-icon-btn"
                onClick={handleShareX}
                title="Share on X"
                aria-label="Share on X"
                disabled={generating}
              >
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
                  <path d="M18.244 2H21l-6.56 7.497L22.15 22h-6.037l-4.728-6.184L5.97 22H3.213l7.014-8.014L2 2h6.192l4.273 5.648L18.244 2zm-1.058 18h1.674L7.91 3.894H6.114L17.186 20z" />
                </svg>
              </button>

              <button
                className="share-icon-btn"
                onClick={handleShareLinkedIn}
                title="Share on LinkedIn"
                aria-label="Share on LinkedIn"
                disabled={generating}
              >
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
                  <path d="M6.94 8.5H3.56V20h3.38V8.5zM5.25 3A2.25 2.25 0 1 0 5.25 7.5 2.25 2.25 0 0 0 5.25 3zM20.44 13.06c0-3.05-1.63-4.47-3.8-4.47-1.75 0-2.53.96-2.97 1.64V8.5H10.3c.04 1.15 0 11.5 0 11.5h3.37v-6.42c0-.34.03-.68.13-.92.27-.68.89-1.38 1.93-1.38 1.36 0 1.9 1.04 1.9 2.56V20H21V13.06h-.56z" />
                </svg>
              </button>

              <button
                className="share-icon-btn"
                onClick={handleShareFacebook}
                title="Share on Facebook"
                aria-label="Share on Facebook"
                disabled={generating}
              >
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
                  <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.88 3.77-3.88 1.09 0 2.23.19 2.23.19v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.77l-.44 2.89h-2.33v6.99A10 10 0 0 0 22 12z" />
                </svg>
              </button>

              <button
                className="share-icon-btn"
                onClick={handleShareInstagram}
                title="Share on Instagram"
                aria-label="Share on Instagram"
                disabled={generating}
              >
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
                  <path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2zm0 1.8A3.95 3.95 0 0 0 3.8 7.75v8.5a3.95 3.95 0 0 0 3.95 3.95h8.5a3.95 3.95 0 0 0 3.95-3.95v-8.5a3.95 3.95 0 0 0-3.95-3.95h-8.5zm8.95 1.35a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2zM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 1.8A3.2 3.2 0 1 0 12 15.2 3.2 3.2 0 0 0 12 8.8z" />
                </svg>
              </button>
            </div>

            {shareStatus ? (
              <div className="share-status-message">{shareStatus}</div>
            ) : null}
          </div>
        </div>
      )}
    </>
  );
}