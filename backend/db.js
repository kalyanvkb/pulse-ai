// backend/db.js — MongoDB connection and article queries

const mongoose = require("mongoose");

// ── Article Schema ────────────────────────────────────────────────────────
const articleSchema = new mongoose.Schema({
  id:          { type: String, required: true, unique: true },
  title:       String,
  url:         String,
  publishedAt: { type: Date },
  source:      String,
  group:       String,
  color:       String,
  logoUrl:     String,
  rawContent:  String,
  imageUrl:    String,
  summary:     [String],
  fetchedDate: { type: String, index: true }, // "YYYY-MM-DD" IST date
  createdAt:   { type: Date, default: Date.now },
});

const Article = mongoose.model("Article", articleSchema);

const companyWeeklyBriefSchema =
  new mongoose.Schema(
    {},
    {
      strict: false
    }
  );

const CompanyWeeklyBrief =
  mongoose.models
    .CompanyWeeklyBrief ||
  mongoose.model(
    "CompanyWeeklyBrief",
    companyWeeklyBriefSchema,
    "companyWeeklyBriefs"
  );

  const companyBriefSchema =
  new mongoose.Schema(
    {},
    {
      strict: false
    }
  );

const CompanyBrief =
  mongoose.models.CompanyBrief ||
  mongoose.model(
    "CompanyBrief",
    companyBriefSchema,
    "companyBriefs"
  );

const shareCardSchema =
  new mongoose.Schema({
    title: String,
    subtitle: String,
    period: String,
    sectionType: String,
    items: [
      {
        company: String,
        text: String
      }
    ],
    userEmail: String,
    imageUrl: String, // URL where the image is stored or served from
    createdAt: {
      type: Date,
      default: Date.now
    }
  });

const ShareCard =
  mongoose.models.ShareCard ||
  mongoose.model(
    "ShareCard",
    shareCardSchema
  );

const shareEventSchema =
  new mongoose.Schema({
    cardId: String,
    action: String,
    sectionType: String,
    userEmail: String,
    referrer: String,
    userAgent: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  });

const ShareEvent =
  mongoose.models.ShareEvent ||
  mongoose.model(
    "ShareEvent",
    shareEventSchema
  );


/**
 * Connect to MongoDB
 */
async function connect() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("✓ MongoDB connected");
}

/**
 * Get today's IST date as "YYYY-MM-DD"
 */
function getTodayIST() {
  return new Date()
    .toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }); // "YYYY-MM-DD"
}

/**
 * Check if today's articles already exist in DB
 */
async function hasTodaysArticles() {
  const count = await Article.countDocuments({ fetchedDate: getTodayIST() });
  return count > 0;
}

/**
 * Save a batch of articles to DB (skip duplicates by id)
 */
async function saveArticles(articles) {
  const today = getTodayIST();
  const ops = articles.map((a) => ({
    updateOne: {
      filter: { id: a.id },
      update: { $set: { ...a, fetchedDate: today } },
      upsert: true,
    },
  }));
  const result = await Article.bulkWrite(ops);
  console.log(`✓ Saved ${result.upsertedCount} new articles to MongoDB`);
}

/**
 * Load today's articles from DB
 */
async function getTodaysArticles() {

  const latestArticle =
    await Article
      .findOne()
      .sort({
        fetchedDate: -1
      })
      .lean();

  if (!latestArticle) {

    return [];
  }

  console.log(
    "LATEST ARTICLE DATE:",
    latestArticle.fetchedDate
  );

  return Article.find({
    fetchedDate:
      latestArticle.fetchedDate
  })
    .sort({
      publishedAt: -1
    })
    .lean();
}

/**
 * Load articles from any specific date "YYYY-MM-DD"
 */
async function getArticlesByDate(date) {
  return Article.find({ fetchedDate: date })
    .sort({ publishedAt: -1 })
    .lean();
}

const userSchema =
  new mongoose.Schema({

    email: {
      type: String,
      required: true,
      unique: true
    },

    preferences: {

      groups: {
        type: [String],
        default: []
      },

      sources: {
        type: [String],
        default: []
      }
    },

    createdAt: {
      type: Date,
      default: Date.now
    }
  });

const User =
  mongoose.models.User ||
  mongoose.model("User", userSchema);

async function getUserByEmail(email) {
  const user = await User.findOne({
  email: email.trim().toLowerCase()
}).lean();

return user;
}

async function followCompany(email, company) {

  const result = await User.findOneAndUpdate(
    { email: email.trim().toLowerCase() },
    {
      $addToSet: {
        "preferences.sources": company
      }
    },
    {
      returnDocument: "after"
    }
  );

  console.log(
    "FOLLOW RESULT:",
    JSON.stringify(result, null, 2)
  );

  return result;
}

async function unfollowCompany(email, company) {

  const result = await User.findOneAndUpdate(
    { email: email.trim().toLowerCase() },
    {
      $pull: {
        "preferences.sources": company
      }
    },
    {
      returnDocument: "after"
    }
  );

  console.log(
    "UNFOLLOW RESULT:",
    JSON.stringify(result, null, 2)
  );

  return result;
}



async function getCompanyWeeklyBriefs(
  companies
) {

  return CompanyWeeklyBrief.find({
    company: {
      $in: companies
    }
  })
    .sort({
      company: 1
    })
    .lean();
}

async function getCompanyDailyBriefs(
  companies
) {

  const latestBrief =
    await CompanyBrief
      .findOne()
      .sort({
        date: -1
      })
      .lean();

  if (!latestBrief) {

    return [];
  }

  console.log(
    "LATEST DAILY BRIEF DATE:",
    latestBrief.date
  );

  return CompanyBrief.find({

    company: {
      $in: companies
    },

    date:
      latestBrief.date

  })
    .sort({
      company: 1
    })
    .lean();
}

async function getDigestUsers() {

  return User.find({

    email: {
      $exists: true
    }

  }).lean();
}

async function createShareCard(card) {
  const doc =
    await ShareCard.create({
      title: card.title,
      subtitle: card.subtitle,
      period: card.period,
      sectionType: card.sectionType,
      items: card.items || [],
      userEmail: card.userEmail,
      imageUrl: card.imageUrl || null
    });

  return doc.toObject();
}

async function getShareCardById(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }

  return ShareCard.findById(id).lean();
}

async function recordShareEvent(event) {
  return ShareEvent.create({
    cardId: event.cardId,
    action: event.action,
    sectionType: event.sectionType,
    userEmail: event.userEmail,
    referrer: event.referrer,
    userAgent: event.userAgent
  });
}

/**
 * Check if an article is older than 3 days
 * @param {object} article
 * @returns {boolean}
 */
function isArticleStale(article) {
  if (!article.publishedAt) return false;
  const published = new Date(article.publishedAt);
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
  return published < threeDaysAgo;
}

module.exports = {
  connect,
  getTodayIST,
  hasTodaysArticles,
  saveArticles,
  getTodaysArticles,
  getArticlesByDate,
  getUserByEmail,
  followCompany,
  unfollowCompany,
  getCompanyWeeklyBriefs,
  getCompanyDailyBriefs,
  getDigestUsers,
  createShareCard,
  getShareCardById,
  recordShareEvent,
  isArticleStale
};
