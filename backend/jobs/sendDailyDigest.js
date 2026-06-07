const { sendEmail } = require("../email/brevo");
const { buildDigestHtml } = require("../email/digestBuilder");
const { getDigestUsers, getCompanyDailyBriefs } = require("../db");

async function buildUserIntelligence(user) {
  const companies = user?.preferences?.sources || [];
  if (companies.length === 0) return null;

  const briefs = await getCompanyDailyBriefs(companies);
  if (!briefs || briefs.length === 0) return null;

  const whatsHappening = [];
  const whyItMatters = [];

  briefs.forEach(brief => {
    (brief.whatsHappening || []).forEach(item => {
      whatsHappening.push({
        company: brief.company,
        text: item?.text || item
      });
    });

    (brief.whyItMatters || []).forEach(item => {
      whyItMatters.push({
        company: brief.company,
        text: item?.text || item
      });
    });
  });

  if (whatsHappening.length === 0 && whyItMatters.length === 0) {
    return null;
  }

  return {
    date: briefs[0]?.date,
    companyCount: briefs.length,
    executiveSummary: {
      whatsHappening: whatsHappening.slice(0, 10),
      whyItMatters: whyItMatters.slice(0, 10)
    }
  };
}

// Helper function to process an individual user's digest
async function processUserDigest(user) {

  if (!user?.email) {

    return {
      status: "skipped",
      email: "unknown"
    };
  }
  const companies = user?.preferences?.sources || [];
  if (companies.length === 0) {
    return { status: 'skipped', email: user.email };
  }

  const intelligence = await buildUserIntelligence(user);
  if (!intelligence) {
    return { status: 'skipped', email: user.email };
  }

  const html = buildDigestHtml(user, intelligence);
  await sendEmail(
    user.email,
    `Pulse AI Daily Brief • ${intelligence.date}`,
    html
  );

  return { status: 'sent', email: user.email };
}

async function sendDailyDigest() {
  console.log("\n📧 Sending Daily Digest...");
  const users = await getDigestUsers();
  console.log(`Found ${users.length} users`);

  let sentCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  // Chunking configuration to avoid hitting API rate limits or overwhelming the DB
  const BATCH_SIZE = 10; 
  
  for (let i = 0; i < users.length; i += BATCH_SIZE) {
    const batch = users.slice(i, i + BATCH_SIZE);
    
    // Process the current batch concurrently
    const results = await Promise.allSettled(
      batch.map(user => processUserDigest(user))
    );

    // Analyze the results of the batch
    results.forEach((result, index) => {
      const user = batch[index];

      if (result.status === 'fulfilled') {
        const value = result.value;
        if (value.status === 'sent') {
          sentCount++;
          console.log(`Sent: ${value.email}`);
        } else {
          skippedCount++;
        }
      } else {
        // Handle rejected promises (unexpected errors in processUserDigest)
        failedCount++;
        console.error(`Failed: ${user?.email || 'Unknown User'}`, result.reason?.message || result.reason);
      }
    });
  }

  console.log(`\n✅ Daily Digest Complete`);
  console.log(`📊 Sent: ${sentCount} | Skipped: ${skippedCount} | Failed: ${failedCount}`);
}

module.exports = { sendDailyDigest };