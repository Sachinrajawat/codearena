const axios = require("axios");

const JUDGE0_URL = "https://judge0-ce.p.rapidapi.com";
const MAX_BATCH_SIZE = 20; // Judge0 CE default batch limit; adjust if your plan differs
const POLL_INTERVAL_MS = 1000;
const MAX_POLL_ATTEMPTS = 30; // about 30 seconds in total
const REQUEST_TIMEOUT_MS = 15000;

const LANGUAGE_IDS = {
  "c++": 54,
  java: 62,
  javascript: 63,
};

// Accepted spellings -> canonical name used in the DB and Judge0 lookup
const LANGUAGE_ALIASES = {
  "c++": "c++",
  cpp: "c++",
  java: "java",
  javascript: "javascript",
};

// Returns "c++" | "java" | "javascript", or null if unsupported
const normalizeLanguage = (lang) => {
  if (typeof lang !== "string") return null;
  return LANGUAGE_ALIASES[lang.trim().toLowerCase()] || null;
};

const getLanguageId = (lang) => {
  const normalized = normalizeLanguage(lang);
  return normalized ? LANGUAGE_IDS[normalized] : undefined;
};

const judge0Headers = () => ({
  "x-rapidapi-key": process.env.JUDGE0_API_KEY,
  "x-rapidapi-host": "judge0-ce.p.rapidapi.com",
});

const chunk = (items, size) => {
  const groups = [];
  for (let i = 0; i < items.length; i += size) {
    groups.push(items.slice(i, i + size));
  }
  return groups;
};

const waiting = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Single place for HTTP calls: logs the real cause and throws a clear error
const judge0Request = async (options) => {
  try {
    const response = await axios.request({
      timeout: REQUEST_TIMEOUT_MS,
      ...options,
    });
    return response.data;
  } catch (error) {
    const status = error.response?.status;
    const detail = error.response?.data?.message || error.message;
    console.error("Judge0 request failed:", status, detail);
    throw new Error(
      `Judge0 request failed${status ? ` (${status})` : ""}: ${detail}`,
    );
  }
};

// Returns an array of { token }, in the same order as the submissions
const submitBatch = async (submissions) => {
  const tokens = [];

  for (const group of chunk(submissions, MAX_BATCH_SIZE)) {
    const data = await judge0Request({
      method: "POST",
      url: `${JUDGE0_URL}/submissions/batch`,
      params: { base64_encoded: "false" },
      headers: { ...judge0Headers(), "Content-Type": "application/json" },
      data: { submissions: group },
    });

    if (!Array.isArray(data) || data.some((item) => !item || !item.token)) {
      throw new Error("Judge0 returned an unexpected response for batch submit");
    }
    tokens.push(...data);
  }

  return tokens;
};

// Polls until every submission has finished, then returns them in token order
const submitToken = async (resultToken) => {
  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
    const results = [];

    for (const group of chunk(resultToken, MAX_BATCH_SIZE)) {
      const data = await judge0Request({
        method: "GET",
        url: `${JUDGE0_URL}/submissions/batch`,
        params: {
          fields: "*",
          base64_encoded: "false",
          tokens: group.join(","),
        },
        headers: judge0Headers(),
      });

      if (!data || !Array.isArray(data.submissions)) {
        throw new Error("Judge0 returned an unexpected response for results");
      }
      results.push(...data.submissions);
    }

    // status_id 1 = In Queue, 2 = Processing; anything higher is finished
    if (results.every((r) => r && r.status_id > 2)) {
      return results;
    }

    await waiting(POLL_INTERVAL_MS);
  }

  throw new Error("Judge0 timed out waiting for results");
};

module.exports = {
  getLanguageId,
  normalizeLanguage,
  submitBatch,
  submitToken,
};