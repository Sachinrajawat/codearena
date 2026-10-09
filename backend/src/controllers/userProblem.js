const mongoose = require("mongoose");
const Problem = require("../models/problem");
const User = require("../models/user");
const Submission = require("../models/submission");

const {
  getLanguageId,
  submitBatch,
  submitToken,
} = require("../utils/ProblemUtility");

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// Only these fields can be written by the client; everything else is ignored
const pickProblemFields = (body) => ({
  title: body.title,
  description: body.description,
  difficulty: body.difficulty,
  tags: body.tags,
  visibleTestCases: body.visibleTestCases,
  hiddenTestCases: body.hiddenTestCases,
  startCode: body.startCode,
  referenceSolution: body.referenceSolution,
});

// Runs every reference solution against the visible AND hidden test cases.
// Returns null when all pass, otherwise { message, details } for the first failure.
const verifyReferenceSolutions = async (
  referenceSolution,
  visibleTestCases,
  hiddenTestCases,
) => {
  const testCases = [...visibleTestCases, ...hiddenTestCases];

  for (const { language, completeCode } of referenceSolution) {
    const languageId = getLanguageId(language);
    if (!languageId) {
      return { message: `Unsupported language: ${language}` };
    }

    const submissions = testCases.map(({ input, output }) => ({
      source_code: completeCode,
      language_id: languageId,
      stdin: input,
      expected_output: output,
    }));

    const submitResult = await submitBatch(submissions);
    const resultToken = submitResult.map((value) => value.token);
    const testResult = await submitToken(resultToken);

    for (let i = 0; i < testResult.length; i++) {
      const test = testResult[i];
      if (test.status_id != 3) {
        const isHidden = i >= visibleTestCases.length;
        const caseLabel = isHidden
          ? `hidden test case ${i - visibleTestCases.length + 1}`
          : `visible test case ${i + 1}`;
        return {
          message: `${language} reference solution failed on ${caseLabel}! Judge0 Status: ${test.status_id}`,
          details: test.compile_output || test.stderr || "Wrong Answer",
        };
      }
    }
  }
  return null;
};

const hasVerificationData = (body) =>
  Array.isArray(body.referenceSolution) &&
  body.referenceSolution.length > 0 &&
  Array.isArray(body.visibleTestCases) &&
  body.visibleTestCases.length > 0 &&
  Array.isArray(body.hiddenTestCases) &&
  body.hiddenTestCases.length > 0;

const sendProblemError = (res, error) => {
  if (error.name === "ValidationError" || error.name === "CastError") {
    return res.status(400).json({ message: error.message });
  }
  console.error("Problem controller error:", error);
  return res.status(500).json({ message: "Internal Server Error" });
};

const createProblem = async (req, res) => {
  try {
    const data = pickProblemFields(req.body);

    if (!hasVerificationData(data)) {
      return res.status(400).json({
        message: "referenceSolution, visibleTestCases and hiddenTestCases are required",
      });
    }

    const failure = await verifyReferenceSolutions(
      data.referenceSolution,
      data.visibleTestCases,
      data.hiddenTestCases,
    );
    if (failure) {
      return res.status(400).json(failure);
    }

    const created = await Problem.create({
      ...data,
      problemCreator: req.result._id,
    });

    // Same lightweight shape that getAllProblem returns for list items.
    // Hidden test cases and reference solutions are deliberately not included.
    res.status(201).json({
      message: "Problem created successfully",
      problem: {
        _id: created._id,
        title: created.title,
        difficulty: created.difficulty,
        tags: created.tags,
      },
    });
  } catch (error) {
    sendProblemError(res, error);
  }
};

const updateProblem = async (req, res) => {
  const { id } = req.params;

  try {
    if (!isValidId(id)) {
      return res.status(400).json({ message: "Invalid problem ID" });
    }

    const dsaProblem = await Problem.findById(id);
    if (!dsaProblem) {
      return res.status(404).json({ message: "Problem not found" });
    }

    const data = pickProblemFields(req.body);

    if (!hasVerificationData(data)) {
      return res.status(400).json({
        message: "referenceSolution, visibleTestCases and hiddenTestCases are required",
      });
    }

    const failure = await verifyReferenceSolutions(
      data.referenceSolution,
      data.visibleTestCases,
      data.hiddenTestCases,
    );
    if (failure) {
      return res.status(400).json(failure);
    }

    const newProblem = await Problem.findByIdAndUpdate(id, data, {
      runValidators: true,
      new: true,
    });

    res.status(200).json(newProblem);
  } catch (error) {
    sendProblemError(res, error);
  }
};

const deleteProblem = async (req, res) => {
  const { id } = req.params;
  try {
    if (!isValidId(id)) {
      return res.status(400).json({ message: "Invalid problem ID" });
    }

    const deletedProblem = await Problem.findByIdAndDelete(id);
    if (!deletedProblem) {
      return res.status(404).json({ message: "Problem not found" });
    }

    res.status(200).json({ message: "Successfully Deleted" });
  } catch (error) {
    console.error("Delete problem error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getProblemById = async (req, res) => {
  const { id } = req.params;

  try {
    if (!isValidId(id)) {
      return res.status(400).json({ message: "Invalid problem ID" });
    }

    const getProblem = await Problem.findById(id).select(
      "_id title description difficulty tags visibleTestCases startCode referenceSolution",
    );
    if (!getProblem) {
      return res.status(404).json({ message: "Problem not found" });
    }

    res.status(200).json(getProblem);
  } catch (error) {
    console.error("Get problem error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getAllProblem = async (req, res) => {
  try {
    const allProblem = await Problem.find({}).select(
      "_id title difficulty tags",
    );
    // An empty list is a valid result, not an error
    res.status(200).json(allProblem);
  } catch (error) {
    console.error("Get all problems error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const solvedAllProblemByUser = async (req, res) => {
  try {
    const user = await User.findById(req.result._id)
      .select("problemSolved")
      .populate({
        path: "problemSolved",
        select: "_id title difficulty tags",
      });

    res.status(200).json({ problemSolved: user ? user.problemSolved : [] });
  } catch (error) {
    console.error("Solved problems error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const submittedProblem = async (req, res) => {
  try {
    const userId = req.result._id;
    const problemId = req.params.pid;

    if (!isValidId(problemId)) {
      return res.status(400).json({ message: "Invalid problem ID" });
    }

    const ans = await Submission.find({ userId, problemId }).sort({
      createdAt: -1,
    });

    res.status(200).json(ans);
  } catch (error) {
    console.error("Submission fetch error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Admin-only: full problem including hidden test cases, used by the edit form
const getProblemForAdmin = async (req, res) => {
  const { id } = req.params;
  try {
    if (!isValidId(id)) {
      return res.status(400).json({ message: "Invalid problem ID" });
    }

    const problem = await Problem.findById(id);
    if (!problem) {
      return res.status(404).json({ message: "Problem not found" });
    }

    res.status(200).json(problem);
  } catch (error) {
    console.error("Get problem (admin) error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  createProblem,
  updateProblem,
  deleteProblem,
  getProblemById,
  getAllProblem,
  solvedAllProblemByUser,
  submittedProblem,
  getProblemForAdmin,
};