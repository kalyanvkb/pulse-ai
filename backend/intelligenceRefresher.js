const axios = require("axios");

/**
 * Trigger Daily Company Brief Generation
 *
 * AI Service:
 * POST /generate-company-briefs
 *
 * The AI service is responsible for:
 * - generating company briefs
 * - saving them into companyBriefs
 *
 * This function only triggers the process.
 */
async function refreshDailyIntelligence() {
  console.log("\n🧠 Refreshing Daily Intelligence...");

  try {
    const response = await axios.post(
      `${process.env.AI_SERVICE_URL}/generate-company-briefs`
    );

    console.log("✅ Daily Intelligence Complete");
    console.log("Response:", response.data);

    return response.data;
  } catch (err) {
    console.error(
      "❌ Daily Intelligence Failed:",
      err.response?.data || err.message
    );
    throw err;
  }
}

/**
 * Trigger Weekly Company Brief Generation
 *
 * AI Service:
 * POST /generate-company-weekly-briefs
 *
 * The AI service is responsible for:
 * - generating weekly company briefs
 * - saving them into companyWeeklyBriefs
 *
 * This function only triggers the process.
 */
async function refreshWeeklyIntelligence() {
  console.log("\n📊 Refreshing Weekly Intelligence...");

  try {
    const response = await axios.post(
      `${process.env.AI_SERVICE_URL}/generate-company-weekly-briefs`
    );

    console.log("✅ Weekly Intelligence Complete");
    console.log("Response:", response.data);

    return response.data;
  } catch (err) {
    console.error(
      "❌ Weekly Intelligence Failed:",
      err.response?.data || err.message
    );
    throw err;
  }
}

module.exports = {
  refreshDailyIntelligence,
  refreshWeeklyIntelligence
};