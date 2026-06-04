// backend/db.js — MongoDB connection and article queries

const mongoose = require("mongoose");

// ── Article Schema ────────────────────────────────────────────────────────
const articleSchema = new mongoose.Schema({
  id:          { type: String, required: true, unique: true },
  title:       String,
  url:         String,
  publishedAt: String,
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
  return Article.find({ fetchedDate: getTodayIST() })
    .sort({ publishedAt: -1 })
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
  getCompanyDailyBriefs
};