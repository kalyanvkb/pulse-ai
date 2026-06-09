const path = require("path");

require("dotenv").config({
  path: path.join(__dirname, ".env")
});

const { connect } = require("./db");
const { runDailyFetch } = require("./scheduler");

(async () => {

  try {

    await connect();

    console.log("Mongo Connected");

    await runDailyFetch();

    process.exit(0);

  } catch (err) {

    console.error(err);

    process.exit(1);

  }

})();