const axios = require("axios");

async function sendEmail(
  to,
  subject,
  html
) {

  const response =
    await axios.post(

      "https://api.brevo.com/v3/smtp/email",

      {
        sender: {

          name:
            process.env.FROM_NAME ||
            "Pulse AI",

          email:
            process.env.FROM_EMAIL
        },

        to: [
          {
            email: to
          }
        ],

        subject,

        htmlContent: html
      },

      {
        headers: {

          accept:
            "application/json",

          "api-key":
            process.env.BREVO_API_KEY,

          "content-type":
            "application/json"
        }
      }
    );

  //return response.data;

  console.log(
  "BREVO RESPONSE:",
  JSON.stringify(
    response.data,
    null,
    2
  )
);

return response.data;
}

module.exports = {
  sendEmail
};