const mongoose = require("mongoose");

const evaluationSchema = new mongoose.Schema({
  projectId: {
    type: String,
    required: true,
  },
  user: {
    type: String,
    required: true,
  },
  alternativeName: {
    type: String,
    required: true,
  },
  alternativeCost: {
    type: Number,
    required: true,
  },
  alternativeValues: {
    // Map of leafId to user input value; values are stored as numbers.
    type: Map,
    of: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Evaluation", evaluationSchema);