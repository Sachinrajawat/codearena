const jwt = require("jsonwebtoken");
const User = require("../models/user");
const redisClient = require("../config/redis");

const userMiddleware = async (req, res, next) => {
  const { token } = req.cookies;
  if (!token) {
    return res.status(401).json({ message: "Token is not present" });
  }

  // Bad signature, malformed or expired token -> 401
  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_KEY);
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }

  if (!payload._id) {
    return res.status(401).json({ message: "Invalid token" });
  }

  // Redis / DB failures are server problems -> 500, not 401
  let user;
  try {
    const isBlocked = await redisClient.exists(`token:${token}`);
    if (isBlocked) {
      return res.status(401).json({ message: "Token is no longer valid" });
    }

    user = await User.findById(payload._id);
    if (!user) {
      return res.status(401).json({ message: "User doesn't exist" });
    }
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }

  req.result = user;
  next();
};

module.exports = userMiddleware;