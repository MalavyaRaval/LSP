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
    
    console.log("Backend: POST query result - nodeId:", nodeId, "type:", typeof nodeId);
    
    const newResult = new QueryResult({
      nodeId: nodeId.toString(), // Ensure nodeId is string
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

    console.log("Backend: PUT query result - nodeId:", nodeId, "type:", typeof nodeId);

    const updatedResult = await QueryResult.findOneAndUpdate(
      { nodeId: nodeId.toString(), projectId }, // Ensure nodeId is string
      { queryType, values, nodeName }, // Update queryType, values, and nodeName
      { new: true, upsert: true } // Return the updated document and create if not exists
    );

    res.json({ message: "Query result updated", result: updatedResult });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET: Retrieve query results, optionally filtering by projectId, nodeId, or nodeName
router.get("/", async (req, res) => {
    try {
      const { project, nodeId, nodeName } = req.query;
      console.log("Backend: GET query-results request - project:", project, "nodeId:", nodeId, "nodeName:", nodeName);
      
      if (!project) {
        return res.status(400).json({ message: "Project parameter is required" });
      }
      
      // Build query filter
      const filter = { projectId: project };
      if (nodeId) {
        // Ensure nodeId is treated as string for consistent comparison
        filter.nodeId = nodeId.toString();
      }
      if (nodeName) {
        // Search by nodeName instead of nodeId
        filter.nodeName = nodeName;
      }
      
      console.log("Backend: Query filter:", filter);
      
      // Find query results for the given project and optionally nodeId/nodeName
      const results = await QueryResult.find(filter);
      console.log("Backend: Found results:", results.length, "for filter:", filter);
      console.log("Backend: Results:", results.map(r => ({ nodeId: r.nodeId, nodeName: r.nodeName, queryType: r.queryType })));
      res.json(results);
    } catch (err) {
      console.error("Backend: Error in GET query-results:", err);
      res.status(500).json({ message: err.message });
    }
  });

module.exports = router;
