const express = require('express');
const adminMiddleware = require('../middleware/adminMiddleware');
const {createProblem, updateProblem,deleteProblem , getProblemById, getAllProblem, solvedAllProblemByUser, submittedProblem, getProblemForAdmin }= require('../controllers/userProblem');
const userMiddleware = require('../middleware/userMiddleware');
const problemRouter = express.Router();

// need admin access for below request
problemRouter.post("/create",adminMiddleware , createProblem);
problemRouter.put("/update/:id", adminMiddleware, updateProblem);
problemRouter.delete("/delete/:id", adminMiddleware, deleteProblem);
problemRouter.get("/admin/problemByID/:id", adminMiddleware, getProblemForAdmin);

// no need of admin access
problemRouter.get("/problemByID/:id", userMiddleware, getProblemById);
problemRouter.get("/getAllProblem", userMiddleware, getAllProblem);
problemRouter.get("/problemSolvedByUser", userMiddleware, solvedAllProblemByUser);
// problemId
problemRouter.get("/submittedProblem/:pid", userMiddleware, submittedProblem);

module.exports = problemRouter;
// create
// fetch
// update
// delete