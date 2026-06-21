const express = require("express");
const fs = require("fs");
const path = require("path");
const ShareCard = require("../models/ShareCard");
const {
  buildShareSlug,
  buildShareId,
  buildImageHash,
  buildShareSvg,
  svgToDataUrl,
} = require("../services/shareCardService");

const router = express.Router();

const FRONTEND_BASE_URL =
  process.env.FRONTEND_BASE_URL || "https://pulse-ai.in";

// IMPORTANT:
// Point this to your built frontend index.html on the server
// Adjust if your folder structure is different.
const FRONTEND_INDEX_PATH =
  process.env.FRONTEND_INDEX_PATH ||
  path.resolve(__dirname, "../../frontend/dist/index.html");

function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function buildDescription(shareCard) {
  if (shareCard?.subtitle) return shareCard.subtitle;

  const firstItem = shareCard?.payload?.items?.[0];
  if (firstItem?.text) return firstItem.text.slice(0, 180);

  return "AI intelligence, curated by Pulse-AI.";
}

function buildOgHtml({ indexHtml, shareCard }) {
  const title = escapeHtml(shareCard?.title || "Pulse-AI");
  const description = escapeHtml(buildDescription(shareCard));
  const shareUrl = `${FRONTEND_BASE_URL}/share/${shareCard.shareSlug}`;
  const imageUrl = `${FRONTEND_BASE_URL}/api/share-cards/${shareCard.shareSlug}/image.svg`;

  const ogTags = `
    <title>${title} | Pulse-AI</title>
    <meta name="description" content="${description}" />

    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Pulse-AI" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:url" content="${shareUrl}" />
    <meta property="og:image" content="${imageUrl}" />
    <meta property="og:image:secure_url" content="${imageUrl}" />
    <meta property="og:image:type" content="image/svg+xml" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${imageUrl}" />
  `;

  // Replace </head> with OG tags + </head>
  return indexHtml.replace("</head>", `${ogTags}\n</head>`);
}

/**
 * ------------------------------------------------------------
 * POST /api/share-cards/generate
 * ------------------------------------------------------------
 */
router.post("/generate", async (req, res) => {
  try {
    const {
      title,
      subtitle = "",
      period = "",
      sectionType = "insight",
      items = [],
      userEmail = "",
      userId = "",
      sourceContext = {},
    } = req.body || {};

    if (!title || !Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        error: "title and items are required",
      });
    }

    const normalizedItems = items.slice(0, 10).map((item) => ({
      company: item?.company || "",
      text: item?.text || "",
    }));

    const shareId = buildShareId();
    const shareSlug = buildShareSlug({ title, period });
    const shareUrl = `${FRONTEND_BASE_URL}/share/${shareSlug}`;

    const imageHash = buildImageHash({
      title,
      subtitle,
      period,
      items: normalizedItems,
    });

    const imageSvg = buildShareSvg({
      title,
      subtitle,
      period,
      items: normalizedItems,
    });

    const imageDataUrl = svgToDataUrl(imageSvg);

    const doc = await ShareCard.create({
      shareId,
      shareSlug,
      shareUrl,
      imageHash,
      imageSvg,
      imageDataUrl,
      createdBy: {
        userId,
        email: userEmail,
      },
      sectionType,
      title,
      subtitle,
      period,
      payload: {
        items: normalizedItems,
      },
      sourceContext,
      createdAt: new Date(),
      updatedAt: new Date(),
      analytics: {
        pageViews: 0,
        shareClicks: 0,
      },
    });

    return res.json({
      success: true,
      shareCard: {
        shareId: doc.shareId,
        shareSlug: doc.shareSlug,
        shareUrl: doc.shareUrl,
        imageDataUrl: doc.imageDataUrl,
        title: doc.title,
        subtitle: doc.subtitle,
        period: doc.period,
      },
    });
  } catch (err) {
    console.error("share generate failed", err);
    return res.status(500).json({
      success: false,
      error: "Failed to generate share card",
    });
  }
});

/**
 * ------------------------------------------------------------
 * GET /api/share-cards/:shareSlug
 * Existing API for React page fetch
 * ------------------------------------------------------------
 */
router.get("/:shareSlug", async (req, res) => {
  try {
    const { shareSlug } = req.params;
    const doc = await ShareCard.findOne({ shareSlug }).lean();

    if (!doc) {
      return res.status(404).json({
        success: false,
        error: "Share card not found",
      });
    }

    await ShareCard.updateOne(
      { _id: doc._id },
      {
        $inc: { "analytics.pageViews": 1 },
        $set: { updatedAt: new Date() },
      }
    );

    return res.json({
      success: true,
      shareCard: doc,
    });
  } catch (err) {
    console.error("share fetch failed", err);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch share card",
    });
  }
});

/**
 * ------------------------------------------------------------
 * GET /api/share-cards/:shareSlug/image.svg
 * Public image endpoint for OG tags
 * ------------------------------------------------------------
 */
router.get("/:shareSlug/image.svg", async (req, res) => {
  try {
    const { shareSlug } = req.params;
    const doc = await ShareCard.findOne({ shareSlug }).lean();

    if (!doc || !doc.imageSvg) {
      return res.status(404).send("Share image not found");
    }

    res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    return res.send(doc.imageSvg);
  } catch (err) {
    console.error("share image fetch failed", err);
    return res.status(500).send("Failed to load share image");
  }
});

/**
 * ------------------------------------------------------------
 * POST /api/share-cards/:shareSlug/click
 * ------------------------------------------------------------
 */
router.post("/:shareSlug/click", async (req, res) => {
  try {
    const { shareSlug } = req.params;

    await ShareCard.updateOne(
      { shareSlug },
      {
        $inc: { "analytics.shareClicks": 1 },
        $set: { updatedAt: new Date() },
      }
    );

    return res.json({ success: true });
  } catch (err) {
    console.error("share click tracking failed", err);
    return res.status(500).json({ success: false });
  }
});

/**
 * ------------------------------------------------------------
 * GET /share/:shareSlug
 * IMPORTANT:
 * This is the HTML route that injects OG tags into your built frontend HTML
 * ------------------------------------------------------------
 */
router.get("/page/:shareSlug", async (req, res) => {
  try {
    const { shareSlug } = req.params;
    const doc = await ShareCard.findOne({ shareSlug }).lean();

    if (!doc) {
      return res.status(404).send("Share card not found");
    }

    if (!fs.existsSync(FRONTEND_INDEX_PATH)) {
      console.error("Frontend index.html not found at:", FRONTEND_INDEX_PATH);
      return res.status(500).send("Frontend build not found");
    }

    const indexHtml = fs.readFileSync(FRONTEND_INDEX_PATH, "utf8");
    const html = buildOgHtml({
      indexHtml,
      shareCard: doc,
    });

    return res.send(html);
  } catch (err) {
    console.error("share page html render failed", err);
    return res.status(500).send("Failed to render share page");
  }
});

module.exports = router;