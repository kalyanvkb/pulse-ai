// backend/summarizer.js — Single daily Claude API call for all summaries

const Anthropic = require("@anthropic-ai/sdk");

let client = null;

/**
 * Lazily initialize Anthropic client (fails gracefully if key missing)
 * @returns {Anthropic|null}
 */
function getClient() {
  if (client) return client;
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn("⚠ ANTHROPIC_API_KEY not set — summaries will use raw excerpts");
    return null;
  }
  client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

/**
 * Fallback: split raw content into pseudo-bullets when AI is unavailable
 * @param {object} article
 * @returns {string[]|null}
 */
function fallbackSummary(article) {
  if (!article.rawContent) return null;
  return article.rawContent
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20)
    .slice(0, 3);
}

/**
 * Summarize ALL articles in a single Claude API call.
 * Mutates each article in-place by setting article.summary.
 * @param {object[]} articles
 * @returns {Promise<void>}
 */
async function summarizeBatch(articles) {
  const ai = getClient();

  // Filter to only articles with enough content and no existing summary
  const toSummarize = articles.filter(
    (a) => !a.summary && a.rawContent && a.rawContent.length > 60
  );

  console.log(`  Summarizing ${toSummarize.length} articles in ONE API call...`);

  if (!ai || toSummarize.length === 0) {
    articles.forEach((a) => {
      if (!a.summary) a.summary = fallbackSummary(a);
    });
    return;
  }

  // Build a numbered list of all articles for Claude to process at once
  const articleList = toSummarize
    .map(
      (a, i) =>
        `[${i + 1}] SOURCE: ${a.source}
TITLE: ${a.title}
CONTENT: ${a.rawContent.slice(0, 400)}`
    )
    .join("\n\n---\n\n");

  const prompt = `You are a news summarizer. Below are ${toSummarize.length} tech/AI news articles numbered [1] to [${toSummarize.length}].

For EACH article, write exactly 4 bullet points. Each bullet must be ≤18 words.
Focus on: what happened, who's involved, why it matters, key numbers or dates.

Return your response in this EXACT format with no extra text:

[1]
- bullet one
- bullet two
- bullet three
- bullet four

[2]
- bullet one
- bullet two
- bullet three
- bullet four

...and so on for all ${toSummarize.length} articles.

ARTICLES:

${articleList}`;

  try {
    const message = await ai.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: Math.min(toSummarize.length * 150, 8000),
      messages: [{ role: "user", content: prompt }],
    });

    const responseText = message.content?.[0]?.text || "";

    // Parse the numbered blocks out of the response
    const blocks = responseText.split(/\[(\d+)\]/).slice(1); // ["1", "...bullets...", "2", "..."]

    for (let i = 0; i < blocks.length - 1; i += 2) {
      const idx = parseInt(blocks[i], 10) - 1; // convert [1] → index 0
      const bulletText = blocks[i + 1];

      const bullets = bulletText
        .split("\n")
        .map((line) =>
          line
            .replace(/^[-•*▪◦→]\s*/, "")  // handle many bullet styles
            .replace(/^\d+\.\s*/, "")       // handle numbered lists like "1. "
            .trim()
        )
        .filter((line) => line.length > 8 && !line.startsWith("[")) // skip stray [n] markers
        .slice(0, 4);

      if (idx >= 0 && idx < toSummarize.length && bullets.length >= 1) {
        toSummarize[idx].summary = bullets;
      }
    }

    // Log how many were successfully parsed vs missed
    const parsed = toSummarize.filter((a) => a.summary).length;
    const missed = toSummarize.filter((a) => !a.summary).length;
    console.log(`  Parsed: ${parsed} summaries OK, ${missed} missed → using fallback`);

    // Fallback for any articles Claude missed
    toSummarize.forEach((a) => {
      if (!a.summary) a.summary = fallbackSummary(a);
    });

    const usage = message.usage;
    console.log(
      `  ✓ All summaries done — tokens used: ${usage.input_tokens} in / ${usage.output_tokens} out`
    );
  } catch (err) {
    console.error("  ✗ Claude API call failed:", err.message);
    // Fallback all articles if the single call fails
    toSummarize.forEach((a) => {
      a.summary = fallbackSummary(a);
    });
  }
}

module.exports = { summarizeBatch };