const mongoose = require("mongoose");

const { Schema } = mongoose;

const submissionSchema = new Schema(
    {
        problemId: {
            type: Schema.Types.ObjectId,
            ref: "problem",
            required: true
        },

        userId: {
            type: Schema.Types.ObjectId,
            ref: "user",
            required: true
        },

        code: {
            type: String,
            required: true
        },

        language: {
            type: String,
            enum: ["c++", "java", "javascript"],
            required: true
        },

        // languageId: {
        //     type: Number,
        //     required: true
        // },

        status: {
            type: String,
            enum: [
                "Accepted",
                "Wrong Answer",
                "Compilation Error",
                "Runtime Error",
                "Time Limit Exceeded",
                "Memory Limit Exceeded",
                "Pending"
            ],
            default: "Pending"
        },

        testCasesPassed: {
            type: Number,
            default: 0
        },

        totalTestCases: {
            type: Number,
            default: 0
        },

        runtime: {
            type: Number,
            default: 0
        },

        memory: {
            type: Number,
            default: 0
        },

        errorMessage: {
            type: String,
            default: ''
        }
    },
    {
        timestamps: true
    }
);

// compound index
// they are in ascending order
submissionSchema.index({userId:1, problemId:1});

const Submission = mongoose.model("submission", submissionSchema);

module.exports = Submission;