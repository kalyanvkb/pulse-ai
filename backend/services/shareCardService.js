const crypto = require("crypto");

function slugify(input = "") {
  return String(input)
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function shortId(length = 8) {
  return crypto.randomBytes(6).toString("base64url").slice(0, length);
}

function buildShareSlug({ title, period }) {
  const datePart = new Date().toISOString().slice(0, 10);
  const titleSlug = slugify(title || "insight");
  const periodSlug = slugify(period || "");
  const suffix = shortId(8);

  return [titleSlug, periodSlug, datePart, suffix]
    .filter(Boolean)
    .join("-");
}

function buildShareId() {
  return `shr_${shortId(10)}`;
}

function buildImageHash({ title, subtitle, period, items }) {
  const payload = JSON.stringify({
    title,
    subtitle,
    period,
    items: items || [],
  });
  return crypto.createHash("sha256").update(payload).digest("hex");
}

function escapeXml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function truncateText(str = "", max = 120) {
  if (!str) return "";
  return str.length > max ? `${str.slice(0, max - 1)}…` : str;
}

function buildShareSvg({
  title,
  subtitle,
  period,
  items = [],
}) {
  const safeTitle = escapeXml(title || "");
  const safeSubtitle = escapeXml(subtitle || "");
  const safePeriod = escapeXml(period || "");

  // Use max 3 items for cleaner share cards across all sections
  const previewItems = (items || []).slice(0, 3);

  const width = 1200;
  const height = 630;

  const itemBlocks = previewItems
    .map((item, idx) => {
      const y = 255 + idx * 110;
      const company = escapeXml(item?.company || "");
      const text = escapeXml(truncateText(item?.text || "", 135));

      return `
        <g transform="translate(72, ${y})">
          <circle cx="18" cy="18" r="18" fill="url(#indexGrad)" />
          <text
            x="18"
            y="24"
            text-anchor="middle"
            font-family="Inter, Arial, sans-serif"
            font-size="16"
            font-weight="700"
            fill="#ffffff"
          >
            ${idx + 1}
          </text>

          <rect
            x="52"
            y="0"
            rx="18"
            ry="18"
            width="1038"
            height="84"
            fill="rgba(255,255,255,0.06)"
            stroke="rgba(255,255,255,0.08)"
          />

          ${
            company
              ? `
                <text
                  x="76"
                  y="30"
                  font-family="Inter, Arial, sans-serif"
                  font-size="22"
                  font-weight="700"
                  fill="#74bbff"
                >
                  ${company}
                </text>
              `
              : ""
          }

          <text
            x="76"
            y="${company ? 58 : 46}"
            font-family="Inter, Arial, sans-serif"
            font-size="20"
            fill="#F5F7FB"
          >
            ${text}
          </text>
        </g>
      `;
    })
    .join("\n");

  return `
  <svg
    width="${width}"
    height="${height}"
    viewBox="0 0 ${width} ${height}"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="bgGrad" x1="0" y1="0" x2="1200" y2="630" gradientUnits="userSpaceOnUse">
        <stop stop-color="#09162F"/>
        <stop offset="1" stop-color="#0D1531"/>
      </linearGradient>

      <radialGradient id="orb1" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(1030 120) rotate(90) scale(180)">
        <stop stop-color="#5DA7FF" stop-opacity="0.35"/>
        <stop offset="1" stop-color="#5DA7FF" stop-opacity="0"/>
      </radialGradient>

      <radialGradient id="orb2" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(170 560) rotate(90) scale(140)">
        <stop stop-color="#36D8AB" stop-opacity="0.22"/>
        <stop offset="1" stop-color="#36D8AB" stop-opacity="0"/>
      </radialGradient>

      <linearGradient id="indexGrad" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
        <stop stop-color="#5DA7FF"/>
        <stop offset="1" stop-color="#347EFF"/>
      </linearGradient>
    </defs>

    <rect width="1200" height="630" rx="32" fill="url(#bgGrad)"/>
    <circle cx="1030" cy="120" r="180" fill="url(#orb1)"/>
    <circle cx="170" cy="560" r="140" fill="url(#orb2)"/>

    <g>
      <circle cx="86" cy="70" r="10" fill="#67B4FF"/>
      <text x="108" y="77" font-family="Inter, Arial, sans-serif" font-size="28" font-weight="700" fill="#FFFFFF">pulse-ai</text>
      ${
        safePeriod
          ? `
            <text
              x="1110"
              y="77"
              text-anchor="end"
              font-family="Inter, Arial, sans-serif"
              font-size="18"
              fill="rgba(255,255,255,0.7)"
            >
              ${safePeriod}
            </text>
          `
          : ""
      }
    </g>

    <g transform="translate(72, 128)">
      <text
        x="0"
        y="0"
        font-family="Inter, Arial, sans-serif"
        font-size="52"
        font-weight="800"
        fill="#FFFFFF"
      >
        ${safeTitle}
      </text>

      ${
        safeSubtitle
          ? `
            <text
              x="0"
              y="48"
              font-family="Inter, Arial, sans-serif"
              font-size="24"
              fill="rgba(255,255,255,0.78)"
            >
              ${safeSubtitle}
            </text>
          `
          : ""
      }
    </g>

    ${itemBlocks}

    <g transform="translate(72, 590)">
      <text
        x="0"
        y="0"
        font-family="Inter, Arial, sans-serif"
        font-size="18"
        fill="rgba(255,255,255,0.62)"
      >
        AI intelligence, curated by Pulse AI
      </text>
      <text
        x="1020"
        y="0"
        text-anchor="end"
        font-family="Inter, Arial, sans-serif"
        font-size="18"
        font-weight="600"
        fill="#FFFFFF"
      >
        pulse-ai.in
      </text>
    </g>
  </svg>
  `;
}

function svgToDataUrl(svg) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

module.exports = {
  buildShareSlug,
  buildShareId,
  buildImageHash,
  buildShareSvg,
  svgToDataUrl,
};