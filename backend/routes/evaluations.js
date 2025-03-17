const express = require("express");
const router = express.Router();
const Evaluation = require("../models/Evaluation");

// POST: Save a new evaluation along with user inserted values.
router.post("/", async (req, res) => {
  try {
    const { projectId, user, alternativeName, alternativeCost, alternativeValues } = req.body;
    if (!projectId || !user || !alternativeName || alternativeCost === undefined || !alternativeValues) {
      return res.status(400).json({ message: "Missing required fields." });
    }
    const evaluation = new Evaluation({
      projectId,
      user,
      alternativeName,
      alternativeCost,
      alternativeValues,
    });
    await evaluation.save();
    res.status(201).json({ message: "Evaluation saved successfully.", evaluation });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET: Retrieve evaluations for a project
router.get("/", async (req, res) => {
    try {
      const projectId = req.query.project;
      if (!projectId) {
        return res.status(400).json({ message: "Project ID is required." });
      }
      const evaluations = await Evaluation.find({ projectId });
      res.json(evaluations);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

module.exports = router;