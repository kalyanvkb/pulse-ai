const axios = require("axios");

const {
  sendEmail
} = require("../email/brevo");

async function sendStrategyMeeting() {

  try {

    console.log(
      "\n🏛️ Running Executive Strategy Meeting..."
    );

    const response = await axios.post(
      `${process.env.AI_SERVICE_URL}/generate-strategy-brief`
    );

    const {
      conversation,
      finalReport
    } = response.data;

    const html = `
      <h1>Pulse-AI Executive Strategy Meeting</h1>

      <h2>Conversation</h2>

      <pre>
${conversation}
      </pre>

      <hr/>

      <h2>Final Recommendation</h2>

      <pre>
${finalReport}
      </pre>
    `;

    await sendEmail({
      to: "kalyanvkb@gmail.com",
      subject:
        "Pulse-AI Executive Strategy Meeting",
      html
    });

    console.log(
      "✅ Strategy email sent"
    );

  } catch (err) {

    console.error(
      "❌ Strategy meeting failed"
    );

    console.error(err);

  }

}

module.exports = {
  sendStrategyMeeting
};