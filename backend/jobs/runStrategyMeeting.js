const axios = require("axios");

async function runStrategyMeeting() {

  try {

    console.log("\n🏛️ Executive Strategy Meeting Started...");

    const response = await axios.post(
      `${process.env.AI_SERVICE_URL}/generate-strategy-brief`
    );

    console.log(
      "Strategy Meeting Result:",
      response.data
    );

    console.log(
      "✅ Executive Strategy Meeting Complete"
    );

  } catch (err) {

    console.error(
      "❌ Executive Strategy Meeting Failed:",
      err.message
    );

    if (err.response) {
      console.error(err.response.data);
    }

  }

}

module.exports = {
  runStrategyMeeting
};