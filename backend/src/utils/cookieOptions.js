const isProduction = process.env.NODE_ENV === "production";

// "lax" works locally and when frontend and backend share one domain.
// Only use "none" if they are on different domains (it forces secure cookies).
const sameSite = (process.env.COOKIE_SAMESITE || "lax").toLowerCase();

const cookieOptions = {
  httpOnly: true, // JavaScript in the browser can't read the token
  secure: isProduction || sameSite === "none", // HTTPS only in production
  sameSite,
};

module.exports = cookieOptions;