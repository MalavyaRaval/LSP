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
    
    // Check if alternative name already exists for this project
    const existingEvaluation = await Evaluation.findOne({ 
      projectId, 
      alternativeName: alternativeName.trim() 
    });
    
    if (existingEvaluation) {
      return res.status(409).json({ 
        message: "Alternative name already exists for this project." 
      });
    }
    
    const evaluation = new Evaluation({
      projectId,
      user,
      alternativeName: alternativeName.trim(),
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

// DELETE: Delete a specific evaluation
router.delete("/:evaluationId", async (req, res) => {
  try {
    const { evaluationId } = req.params;
    const deletedEvaluation = await Evaluation.findByIdAndDelete(evaluationId);

    if (!deletedEvaluation) {
      return res.status(404).json({ message: "Evaluation not found." });
    }

    // TODO: Clean up related data if needed (e.g., references in other collections)

    res.json({ 
      message: "Evaluation deleted successfully.",
      deletedEvaluation // Return the deleted document for confirmation
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT: Update a specific evaluation
router.put("/:evaluationId", async (req, res) => {
  try {
    const { evaluationId } = req.params;
    const { alternativeName, alternativeCost, alternativeValues } = req.body;
    
    if (!alternativeName || alternativeCost === undefined || !alternativeValues) {
      return res.status(400).json({ message: "Missing required fields." });
    }
    
    // Check if alternative name already exists for this project (excluding current evaluation)
    const existingEvaluation = await Evaluation.findOne({ 
      projectId: req.body.projectId, 
      alternativeName: alternativeName.trim(),
      _id: { $ne: evaluationId }
    });
    
    if (existingEvaluation) {
      return res.status(409).json({ 
        message: "Alternative name already exists for this project." 
      });
    }
    
    const updatedEvaluation = await Evaluation.findByIdAndUpdate(
      evaluationId,
      {
        alternativeName: alternativeName.trim(),
        alternativeCost,
        alternativeValues,
      },
      { new: true }
    );
    
    if (!updatedEvaluation) {
      return res.status(404).json({ message: "Evaluation not found." });
    }
    
    res.json({ message: "Evaluation updated successfully.", evaluation: updatedEvaluation });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET: Retrieve a specific evaluation by ID (moved to end to avoid conflicts)
router.get("/:evaluationId", async (req, res) => {
  try {
    const { evaluationId } = req.params;
    const evaluation = await Evaluation.findById(evaluationId);
    
    if (!evaluation) {
      return res.status(404).json({ message: "Evaluation not found." });
    }
    
    res.json(evaluation);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;