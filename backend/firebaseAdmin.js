require("dotenv").config({ path: require("path").join(__dirname, ".env") });

const admin = require("firebase-admin");
const path = require("path");

// Load Firebase service account from environment path or default
const serviceAccountPath = path.resolve(
  __dirname,
  process.env.FIREBASE_SERVICE_ACCOUNT_PATH || "./firebase-service-account.json"
);

let serviceAccount;
try {
  serviceAccount = require(serviceAccountPath);
} catch (err) {
  console.error(`❌ Failed to load Firebase service account from: ${serviceAccountPath}`);
  console.error("Make sure FIREBASE_SERVICE_ACCOUNT_PATH is set correctly in .env");
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;