const express = require("express");
const router = express.Router();
const QueryResult = require("../models/QueryResult");

// POST: Save a new query result
router.post("/", async (req, res) => {
  try {
    // Make sure the frontend sends nodeName along with nodeId, queryType, values and projectId
    const { nodeId, nodeName, queryType, values, projectId } = req.body;
    if (!nodeId || !nodeName || !queryType || !values || !projectId) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    const newResult = new QueryResult({
      nodeId,
      nodeName,
      queryType,
      values,
      projectId,
    });
    await newResult.save();
    res.status(201).json({ message: "Query result saved", result: newResult });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT: Update an existing query result
router.put("/", async (req, res) => {
  try {
    const { nodeId, projectId, queryType, values, nodeName } = req.body;

    if (!nodeId || !projectId || !queryType || !values || !nodeName) {
      return res.status(400).json({ message: "Missing required fields for update" });
    }

    const updatedResult = await QueryResult.findOneAndUpdate(
      { nodeId, projectId },
      { queryType, values, nodeName }, // Update queryType, values, and nodeName
      { new: true, upsert: true } // Return the updated document and create if not exists
    );

    res.json({ message: "Query result updated", result: updatedResult });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET: Retrieve query results, optionally filtering by projectId
router.get("/", async (req, res) => {
    try {
      const { project } = req.query;
      if (!project) {
        return res.status(400).json({ message: "Project parameter is required" });
      }
      // Find query results for the given project
      const results = await QueryResult.find({ projectId: project });
      res.json(results);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

module.exports = router;
