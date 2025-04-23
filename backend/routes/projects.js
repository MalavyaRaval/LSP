const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Project = require("../models/Project");
const Evaluation = require("../models/Evaluation");
const { authenticationToken } = require("../utilities");

// GET: Retrieve the project tree by projectId (create it if not exists)

router.get("/events", async (req, res) => {
  try {
    const projects = await Project.find({});
    const events = projects.map((p) => ({
      projectId: p.projectId,
      name: p.eventInfo?.name || p.treeData.name,
      description: p.eventInfo?.description || "",
      createdAt: p.eventInfo?.createdAt || p.createdAt,
    }));
    res.json({ events });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/:projectId", async (req, res) => {
  try {
    let project = await Project.findOne({ projectId: req.params.projectId });
    if (!project) {
      project = new Project({
        projectId: req.params.projectId,
        treeData: {
          id: Date.now(),
          name: "Root",
          children: [],
          parent: null,
          attributes: {
            importance: null,
            connection: null,
            created: new Date(),
          },
        },
      });
      await project.save();
    }
    res.json(project.treeData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT: Update the project tree
router.put("/:projectId", async (req, res) => {
  try {
    const project = await Project.findOneAndUpdate(
      { projectId: req.params.projectId },
      { treeData: req.body },
      { new: true, upsert: true }
    );
    res.json(project.treeData);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// POST: Create a new project (basic info)
router.post("/", async (req, res) => {
  try {
    const { projectName } = req.body;
    if (!projectName || typeof projectName !== "string") {
      return res.status(400).json({ message: "Valid projectName is required" });
    }

    const projectId = projectName
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]+/g, "");

    const exists = await Project.findOne({ projectId });
    if (exists) {
      return res.status(400).json({ message: "Project name already exists" });
    }

    const newProject = new Project({
      projectId,
      treeData: {
        id: Date.now(),
        name: projectName,
        children: [],
        parent: null,
        attributes: {
          importance: null,
          connection: null,
          created: new Date(),
        },
      },
      // Initialize eventInfo as empty.
      eventInfo: {},
    });

    await newProject.save();
    res.status(201).json({
      projectId,
      projectName,
      _id: newProject._id,
    });
  } catch (err) {
    res.status(400).json({
      message: err.message || "Error creating project",
      errorDetails: err,
    });
  }
});

// POST: Add child nodes with DEMA metadata
router.post("/:projectId/nodes", async (req, res) => {
  try {
    const project = await Project.findOne({ projectId: req.params.projectId });
    if (!project) return res.status(404).json({ message: "Project not found" });

    const { parentId, children, metadata } = req.body;

    const addChildrenToParent = (node) => {
      if (node.id == parentId) {
        // Loose equality for type flexibility
        node.attributes = node.attributes || {};
        node.attributes.decisionProcess = metadata?.decisionProcess || "DEMA";
        node.attributes.objectName = metadata?.objectName || "Untitled Object";
        node.attributes.lastUpdated = new Date();

        node.children.push(
          ...children.map((child) => ({
            ...child,
            attributes: {
              importance: Number(child.attributes?.importance),
              connection: Number(child.attributes?.connection),
              created: new Date(child.attributes?.created || Date.now()),
            },
            parent: node.id,
            children: [],
          }))
        );
        return true;
      }
      return node.children?.some(addChildrenToParent);
    };

    if (!addChildrenToParent(project.treeData)) {
      return res.status(404).json({ message: "Parent node not found" });
    }

    project.markModified("treeData");
    await project.save();
    res.json(project.treeData);
  } catch (err) {
    res.status(500).json({
      message: err.message,
      errorDetails: {
        stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
        receivedData: req.body,
      },
    });
  }
});

// PUT: Update a specific node in the project tree by nodeId
router.put("/:projectId/nodes/:nodeId", async (req, res) => {
  try {
    const project = await Project.findOne({ projectId: req.params.projectId });
    if (!project) return res.status(404).json({ message: "Project not found" });
    const treeData = project.treeData;
    const { attributes } = req.body;

    const updateNodeAttributes = (node, nodeId, newAttributes) => {
      if (node.id.toString() === nodeId.toString()) {
        node.attributes = {
          ...node.attributes,
          ...newAttributes,
          lastUpdated: new Date(),
        };
        return true;
      }
      if (node.children && Array.isArray(node.children)) {
        for (let child of node.children) {
          if (updateNodeAttributes(child, nodeId, newAttributes)) return true;
        }
      }
      return false;
    };

    const found = updateNodeAttributes(treeData, req.params.nodeId, attributes);
    if (!found) {
      return res.status(404).json({ message: "Node not found" });
    }

    project.markModified("treeData");
    await project.save();
    res.json(project.treeData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE a node and its associated query results, then update evaluations.
router.delete("/node/:nodeId", async (req, res) => {
  const { nodeId } = req.params;
  const projectId = req.query.projectId; // Expect projectId as a query parameter
  if (!projectId) {
    return res.status(400).json({ message: "Project ID is required." });
  }

  try {
    const project = await Project.findOne({ projectId });
    if (!project) {
      return res.status(404).json({ message: "Project not found." });
    }

    function removeNode(node, nodeId) {
      if (node.id.toString() === nodeId.toString()) {
        return null;
      }
      if (node.children && node.children.length > 0) {
        node.children = node.children
          .map((child) => removeNode(child, nodeId))
          .filter((child) => child !== null);
      }
      return node;
    }

    project.treeData = removeNode(project.treeData, nodeId);
    project.markModified("treeData");
    await project.save();

    const QueryResult = require("../models/QueryResult");
    await QueryResult.deleteMany({ nodeId });

    await Evaluation.updateMany(
      { projectId },
      { $unset: { [`alternativeValues.${nodeId}`]: "" } }
    );

    res.json({
      message: "Node, its query results, and evaluation entries updated.",
      treeData: project.treeData,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE a project and all its related data.
router.delete("/:projectId", authenticationToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const filter = mongoose.Types.ObjectId.isValid(projectId)
      ? { $or: [{ projectId }, { _id: projectId }] }
      : { projectId };

    const project = await Project.findOne(filter);
    if (!project) {
      return res
        .status(200)
        .json({ message: "Project not found. Nothing to delete." });
    }

    // Check authorization: only the creator (stored in eventInfo.createdBy) can delete.
    if (
      !project.eventInfo ||
      !project.eventInfo.createdBy ||
      project.eventInfo.createdBy.toString() !== req.user.userId.toString()
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this project." });
    }

    await Project.findOneAndDelete(filter);

    const customId = project.projectId;
    const QueryResult = require("../models/QueryResult");
    await QueryResult.deleteMany({ projectId: customId });
    await Evaluation.deleteMany({ projectId: customId });

    res.json({
      message:
        "Project and all its related data have been deleted successfully.",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error deleting project: " + err.message });
  }
});

// --- New Event Routes using the Project Model ---
//
// POST /api/projects/event
// This route updates the project document adding/updating its eventInfo field.
router.post("/event", authenticationToken, async (req, res) => {
  try {
    // Expect projectId, name and description in the request body.
    const { projectId, name, description } = req.body;
    if (!projectId || !name || !description) {
      return res
        .status(400)
        .json({ message: "projectId, name and description are required." });
    }
    const project = await Project.findOne({ projectId });
    if (!project) {
      return res.status(404).json({ message: "Project not found." });
    }
    // Set the eventInfo field with the authenticated user's id.
    project.eventInfo = {
      name,
      description,
      createdBy: req.user.userId,
      createdAt: new Date(),
    };
    await project.save();
    res.json({ event: project.eventInfo, projectId: project.projectId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
