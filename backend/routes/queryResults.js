const express = require("express");
const router = express.Router();
const QueryResult = require("../models/QueryResult");

// POST: Save a new query result
router.post("/", async (req, res) => {
  try {
    const { nodeId, queryType, values } = req.body;
    if (!nodeId || !queryType || !values) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    const newResult = new QueryResult({ nodeId, queryType, values });
    await newResult.save();
    res.status(201).json({ message: "Query result saved", result: newResult });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET: Retrieve query results
router.get("/", async (req, res) => {
  try {
    const results = await QueryResult.find().sort({ createdAt: -1 });
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;