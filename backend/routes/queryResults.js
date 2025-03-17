const express = require("express");
const router = express.Router();
const QueryResult = require("../models/QueryResult");

// POST: Save a new query result
router.post("/", async (req, res) => {
  try {
    const { nodeId, queryType, values, projectId } = req.body;
    if (!nodeId || !queryType || !values || !projectId) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    const newResult = new QueryResult({ nodeId, queryType, values, projectId });
    await newResult.save();
    res.status(201).json({ message: "Query result saved", result: newResult });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET: Retrieve query results, optionally filtering by projectId
router.get("/", async (req, res) => {
  try {
    const { project } = req.query;
    const filter = project ? { projectId: project } : {};
    const results = await QueryResult.find(filter).sort({ createdAt: -1 });
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;