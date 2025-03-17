const mongoose = require("mongoose");

const queryResultSchema = new mongoose.Schema({
  nodeId: {
    type: String,  // Change from Number to String
    required: true,
  },
  queryType: {
    type: String,
    required: true,
    enum: ["q4", "q5", "q6", "q7"],
  },
  values: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("QueryResult", queryResultSchema);