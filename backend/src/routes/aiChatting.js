const express = require('express');
const userMiddleware = require('../middleware/userMiddleware');
const { aiLimiter } = require('../middleware/rateLimiters');
const aiRouter = express.Router();
const solveDoubt = require('../controllers/solveDoubt');

aiRouter.post('/chat', userMiddleware, aiLimiter, solveDoubt);

module.exports = aiRouter;