const mongoose = require("mongoose");

const ShareCardSchema = new mongoose.Schema(
  {
    shareId: { type: String, required: true, unique: true },
    shareSlug: { type: String, required: true, unique: true },
    shareUrl: { type: String, required: true },

    imageDataUrl: { type: String, default: "" },
    imageSvg: { type: String, default: "" },
    imageHash: { type: String, default: "" },

    createdBy: {
      userId: { type: String, default: "" },
      email: { type: String, default: "" },
    },

    sectionType: { type: String, required: true },
    title: { type: String, required: true },
    subtitle: { type: String, default: "" },
    period: { type: String, default: "" },

    payload: {
      items: [
        {
          company: { type: String, default: "" },
          text: { type: String, default: "" },
        },
      ],
    },

    sourceContext: {
      viewType: { type: String, default: "" },
      watchlistCompanies: [{ type: String }],
    },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },

    analytics: {
      pageViews: { type: Number, default: 0 },
      shareClicks: { type: Number, default: 0 },
    },
  },
  {
    versionKey: false,
    strict: true,
  }
);

ShareCardSchema.index({ shareId: 1 }, { unique: true });
ShareCardSchema.index({ shareSlug: 1 }, { unique: true });
ShareCardSchema.index({ "createdBy.userId": 1, createdAt: -1 });

/**
 * IMPORTANT:
 * Delete any previously compiled ShareCard model so we don't keep reusing
 * an older schema from the same Node process.
 */
if (mongoose.connection.models.ShareCard) {
  delete mongoose.connection.models.ShareCard;
}

module.exports = mongoose.model("ShareCard", ShareCardSchema);