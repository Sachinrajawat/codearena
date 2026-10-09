const express = require('express');
const userMiddleware = require('../middleware/userMiddleware');
const { runLimiter, submitLimiter } = require('../middleware/rateLimiters');
const { submitCode, runCode } = require('../controllers/userSubmission');
const submitRouter = express.Router();

submitRouter.post("/submit/:id", userMiddleware, submitLimiter, submitCode);
submitRouter.post("/run/:id", userMiddleware, runLimiter, runCode);

module.exports = submitRouter;