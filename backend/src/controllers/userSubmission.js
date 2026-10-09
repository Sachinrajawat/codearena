const mongoose = require("mongoose");
const Problem = require("../models/problem");
const Submission = require("../models/submission");
const User = require("../models/user");

const {
  getLanguageId,
  normalizeLanguage,
  submitBatch,
  submitToken,
} = require("../utils/ProblemUtility");

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const submitCode = async (req, res) => {
  try {
    const userId = req.result._id;
    const problemId = req.params.id;

    const { code, language } = req.body;

    if (!userId || !code || !problemId || !language) {
      return res.status(400).json({ message: "Some field missing" });
    }
    if (!isValidId(problemId)) {
      return res.status(400).json({ message: "Invalid problem ID" });
    }

    const problem = await Problem.findById(problemId);
    if (!problem) {
      return res.status(404).json({ message: "Problem not found" });
    }

    const languageId = getLanguageId(language);
    if (!languageId) {
      return res.status(400).json({ message: "Unsupported language" });
    }

    // Judge first. If Judge0 fails, an error is thrown here and nothing is saved.
    const submissions = problem.hiddenTestCases.map(({ input, output }) => ({
      source_code: code,
      language_id: languageId,
      stdin: input,
      expected_output: output,
    }));
    const submitResult = await submitBatch(submissions);
    const resultToken = submitResult.map((value) => value.token);
    const testResult = await submitToken(resultToken);

    let testCasesPassed = 0;
    let runtime = 0;
    let memory = 0;
    let status = "Accepted";
    let errorMessage = null;
    for (const test of testResult) {
      if (test.status_id == 3) {
        testCasesPassed++;
        if (test.time) {
          runtime += parseFloat(test.time);
        }
        if (test.memory) {
          memory = Math.max(memory, test.memory);
        }
      } else {
        if (test.status_id === 4) {
          status = "Wrong Answer";
          errorMessage = test.stderr || test.message;
        } else if (test.status_id === 5) {
          status = "Time Limit Exceeded";
        } else if (test.status_id === 6) {
          status = "Compilation Error";
          errorMessage = test.stderr || test.message;
        } else if (test.status_id >= 7 && test.status_id <= 12) {
          status = "Runtime Error";
          errorMessage = test.stderr || test.message;
        } else {
          status = "Runtime Error";
          errorMessage = test.stderr || test.message;
        }

        // No need to continue checking if one test case failed
        break;
      }
    }

    // One write, with the final result
    await Submission.create({
      userId,
      problemId,
      language: normalizeLanguage(language),
      code,
      status,
      testCasesPassed,
      totalTestCases: problem.hiddenTestCases.length,
      runtime,
      memory,
      errorMessage,
    });

    const accepted = status === "Accepted";

    // Only an Accepted submission marks the problem as solved.
    // $addToSet is atomic and never adds a duplicate.
    if (accepted) {
      await User.updateOne(
        { _id: userId },
        { $addToSet: { problemSolved: problemId } },
      );
    }

    res.status(201).json({
      accepted,
      totalTestCases: problem.hiddenTestCases.length,
      passedTestCases: testCasesPassed,
      runtime: runtime.toFixed(3),
      memory,
      error: errorMessage || status,
    });
  } catch (error) {
    console.error("Submit code error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const runCode = async (req, res) => {
  try {
    const userId = req.result._id;
    const problemId = req.params.id;

    const { code, language } = req.body;

    if (!userId || !code || !problemId || !language) {
      return res.status(400).json({ message: "Some field missing" });
    }
    if (!isValidId(problemId)) {
      return res.status(400).json({ message: "Invalid problem ID" });
    }

    const problem = await Problem.findById(problemId);
    if (!problem) {
      return res.status(404).json({ message: "Problem not found" });
    }

    const languageId = getLanguageId(language);
    if (!languageId) {
      return res.status(400).json({ message: "Unsupported language" });
    }

    const submissions = problem.visibleTestCases.map(({ input, output }) => ({
      source_code: code,
      language_id: languageId,
      stdin: input,
      expected_output: output,
    }));

    const submitResult = await submitBatch(submissions);
    const resultToken = submitResult.map((value) => value.token);
    const testResult = await submitToken(resultToken);

    let testCasesPassed = 0;
    let runtime = 0;
    let memory = 0;
    let status = true;
    let errorMessage = null;

    for (const test of testResult) {
      if (test.status_id == 3) {
        testCasesPassed++;
        if (test.time) {
          runtime = runtime + parseFloat(test.time);
        }
        if (test.memory) {
          memory = Math.max(memory, test.memory);
        }
      } else {
        if (test.status_id == 4) {
          status = false;
          errorMessage = test.stderr || test.message || "Wrong Answer";
        } else {
          status = false;
          errorMessage = test.stderr || test.message || "Error";
        }
      }
    }

    const testCasesWithResults = testResult.map((test, index) => ({
      stdin: problem.visibleTestCases[index].input,
      expected_output: problem.visibleTestCases[index].output,
      stdout: test.stdout || test.compile_output || test.stderr || "",
      status_id: test.status_id,
    }));

    res.status(201).json({
      success: status,
      runtime: runtime.toFixed(3),
      memory,
      testCases: testCasesWithResults,
      errorMessage,
    });
  } catch (error) {
    console.error("Run code error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = { submitCode, runCode };