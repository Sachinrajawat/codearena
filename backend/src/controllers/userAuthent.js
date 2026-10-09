const redisClient = require("../config/redis");
const User = require("../models/user");
const validate = require("../utils/validate");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieOptions = require("../utils/cookieOptions");

// Maps Mongo/Mongoose errors to proper status codes
const sendSignupError = (res, error) => {
  if (error.code === 11000) {
    return res.status(409).json({ message: "Email is already registered" });
  }
  if (error.name === "ValidationError") {
    return res.status(400).json({ message: error.message });
  }
  console.error("Signup error:", error);
  return res.status(500).json({ message: "Internal Server Error" });
};

const register = async (req, res) => {
  // Input validation problems are the client's fault -> 400
  try {
    validate(req.body);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }

  try {
    const { firstName, lastName, emailId, age, password } = req.body;

    const user = await User.create({
      firstName,
      lastName,
      emailId,
      age,
      password: await bcrypt.hash(password, 10),
      role: "user",
    });
    const token = jwt.sign(
      { _id: user._id, emailId: user.emailId, role: user.role },
      process.env.JWT_KEY,
      { expiresIn: 60 * 60 },
    );
    const reply = {
      firstName: user.firstName,
      emailId: user.emailId,
      _id: user._id,
      role: user.role,
    };

    res.cookie("token", token, { ...cookieOptions, maxAge: 60 * 60 * 1000 });
    res.status(201).json({
      user: reply,
      message: "Registered Successfully",
    });
  } catch (error) {
    sendSignupError(res, error);
  }
};

const login = async (req, res) => {
  try {
    const { emailId, password } = req.body;

    // Reject missing or non-string values (also blocks query-operator objects)
    if (typeof emailId !== "string" || typeof password !== "string") {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ emailId });
    if (!user) {
      return res.status(401).json({ message: "Invalid Credentials" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: "Invalid Credentials" });
    }

    const reply = {
      firstName: user.firstName,
      emailId: user.emailId,
      _id: user._id,
      role: user.role,
    };

    const token = jwt.sign(
      { _id: user._id, emailId: user.emailId, role: user.role },
      process.env.JWT_KEY,
      { expiresIn: 60 * 60 },
    );

    res.cookie("token", token, { ...cookieOptions, maxAge: 60 * 60 * 1000 });
    res.status(200).json({
      user: reply,
      message: "Logged in Successfully",
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const adminRegister = async (req, res) => {
  try {
    validate(req.body);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }

  try {
    const { firstName, lastName, emailId, age, password } = req.body;

    const user = await User.create({
      firstName,
      lastName,
      emailId,
      age,
      password: await bcrypt.hash(password, 10),
      role: "admin",
    });

    // No cookie here: the calling admin must stay logged in as themselves
    res.status(201).json({
      message: "Admin registered successfully",
      user: {
        firstName: user.firstName,
        emailId: user.emailId,
        _id: user._id,
        role: user.role,
      },
    });
  } catch (error) {
    sendSignupError(res, error);
  }
};

const logout = async (req, res) => {
  try {
    const { token } = req.cookies;

    const payload = jwt.decode(token);
    await redisClient.set(`token:${token}`, "Blocked");
    await redisClient.expireAt(`token:${token}`, payload.exp);

    res.clearCookie("token", cookieOptions);
    res.status(200).json({ message: "Logged Out Successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const deleteProfile = async (req, res) => {
  try {
    const userId = req.result._id;

    // The post('findOneAndDelete') hook in user.js also removes their submissions
    await User.findByIdAndDelete(userId);
    res.clearCookie("token", cookieOptions);
    res.status(200).json({ message: "Deleted Successfully" });
  } catch (error) {
    console.error("Delete profile error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = { register, login, logout, adminRegister, deleteProfile };