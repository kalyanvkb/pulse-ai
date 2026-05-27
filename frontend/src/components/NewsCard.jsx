// frontend/src/components/NewsCard.jsx — Single article card component

import { useState } from "react";

const GROUP_COLORS = {
  Models: "#5b8af0",
  Platforms: "#3dd68c",
  Hardware: "#ff9f43",
  Enterprise: "#f0a04b",
  Developers: "#7a5cff",
  Robotics: "#ff6b6b",
};

/**
 * Format an ISO date string to a human-readable relative time
 * @param {string} isoStr
 * @returns {string}
 */
function relativeTime(isoStr) {
  if (!isoStr) return "unknown";
  const diff = Date.now() - new Date(isoStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d === 1 ? "yesterday" : `${d}d ago`;
}

/**
 * Get initials or short label for source logo fallback
 * @param {string} name
 * @returns {string}
 */
function getInitials(name) {
  const words = name.split(" ");
  if (words.length === 1) return name.slice(0, 2).toUpperCase();
  return words
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

/**
 * NewsCard — displays a single article with source, title, bullets, and link
 * @param {object} props
 * @param {object} props.article
 * @param {number} props.index - for staggered animation delay
 */
export default function NewsCard({ article, index = 0 }) {
  const [imgError, setImgError] = useState(false);
  const groupColor = GROUP_COLORS[article.group] || "#888";
  const delay = (index % 12) * 0.04;

  return (
    <div
      className="news-card"
      style={{ animationDelay: `${delay}s` }}
    >
      {/* Header: logo, source name, group tag, time */}
      <div className="card-header">
        <div
          className="source-logo"
          style={{ background: `${article.color}22`, color: article.color }}
        >
          {!imgError && article.logoUrl ? (
            <img
              src={article.logoUrl}
              alt={article.source}
              loading="lazy"
              onError={() => setImgError(true)}
            />
          ) : (
            <span>{getInitials(article.source)}</span>
          )}
        </div>

        <span className="source-name" style={{ color: article.color }}>
          {article.source}
        </span>

        <span
          className="group-tag"
          style={{
            background: `${groupColor}18`,
            color: groupColor,
          }}
        >
          {article.group}
        </span>

        <span className="card-time">
          {relativeTime(article.fetchedAt || article.publishedAt)}
        </span>
      </div>

      {/* Article title */}
      <a
        className="card-title"
        href={article.url}
        target="_blank"
        rel="noopener noreferrer"
      >
        {article.title}
      </a>

      {/* Bullet-point summary */}
      <div className="bullets">
        {article.summary ? (
          article.summary.map((bullet, i) => (
            <div className="bullet" key={i}>
              {bullet}
            </div>
          ))
        ) : article.rawContent ? (
          <div className="bullet excerpt">
            {article.rawContent.slice(0, 160)}
            {article.rawContent.length > 160 ? "…" : ""}
          </div>
        ) : (
          <div className="bullet muted">Summarizing with Claude AI…</div>
        )}
      </div>

      {/* Footer: read link */}
      <div className="card-footer">
        <a
          className="read-link"
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          Read full article →
        </a>
        <span className="footer-source">{article.source}</span>
      </div>
    </div>
  );
}
