const express = require("express");
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

   console.log("Returning shareCard response:", {
  shareId: doc.shareId,
  shareSlug: doc.shareSlug,
  shareUrl: doc.shareUrl,
  hasImageDataUrl: !!doc.imageDataUrl,
  title: doc.title,
});

console.log("SHARE ROUTE VERSION 2 HIT");

const responsePayload = {
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
};

console.log("FULL RESPONSE PAYLOAD:");
console.log(JSON.stringify(responsePayload, null, 2));

return res.json(responsePayload);

  } catch (err) {
    console.error("share generate failed", err);
    return res.status(500).json({
      success: false,
      error: "Failed to generate share card",
    });
  }
});

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
      { $inc: { "analytics.pageViews": 1 }, $set: { updatedAt: new Date() } }
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

router.post("/:shareSlug/click", async (req, res) => {
  try {
    const { shareSlug } = req.params;

    await ShareCard.updateOne(
      { shareSlug },
      { $inc: { "analytics.shareClicks": 1 }, $set: { updatedAt: new Date() } }
    );

    return res.json({ success: true });
  } catch (err) {
    console.error("share click tracking failed", err);
    return res.status(500).json({ success: false });
  }
});

module.exports = router;