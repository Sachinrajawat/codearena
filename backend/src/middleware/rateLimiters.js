const rateLimit = require("express-rate-limit");

// Limits are counted per logged-in user, not per IP. These limiters must be
// placed AFTER userMiddleware in the route, so req.result is always set.
const createLimiter = ({ windowMs, max, message }) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: "draft-7", // sends RateLimit-* headers
    legacyHeaders: false,
    keyGenerator: (req) => String(req.result._id),
    handler: (req, res) => {
      res.status(429).json({ message });
    },
  });

// Run: visible test cases only, cheapest of the three
const runLimiter = createLimiter({
  windowMs: 60 * 1000,
  max: 10,
  message: "Too many runs. Please wait a minute and try again.",
});

// Submit: runs every hidden test case, so it is the most expensive
const submitLimiter = createLimiter({
  windowMs: 60 * 1000,
  max: 5,
  message: "Too many submissions. Please wait a minute and try again.",
});

// AI chat: each request is a paid Gemini call
const aiLimiter = createLimiter({
  windowMs: 60 * 1000,
  max: 10,
  message: "You're sending messages too fast. Please wait a moment.",
});

module.exports = { runLimiter, submitLimiter, aiLimiter };