const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Project = require("../models/Project");
const Evaluation = require("../models/Evaluation");

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
              connection: child.attributes?.connection, // Keep connection as string
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

// DELETE all children of a node
router.delete("/:projectId/nodes/:nodeId/children", async (req, res) => {
  try {
    const project = await Project.findOne({ projectId: req.params.projectId });
    if (!project) return res.status(404).json({ message: "Project not found" });

    // Get timestamp parameter - only remove nodes created after this time
    const timestamp = req.query.timestamp ? parseInt(req.query.timestamp) : 0;
    const targetNodeId = req.params.nodeId;

    function removeAllChildren(node, nodeId) {
      if (node.id.toString() === nodeId.toString()) {
        // Found the target node
        if (timestamp > 0) {
          // If timestamp provided, only remove children created after the timestamp
          // Keep track of how many children were removed
          const originalChildrenCount = node.children.length;

          // Filter children based on their creation timestamp
          node.children = node.children.filter((child) => {
            // Get creation time from attributes
            const childCreatedAt = child.attributes?.created
              ? new Date(child.attributes.created).getTime()
              : Infinity;

            // Keep child if it was created before or at the specified timestamp
            return childCreatedAt <= timestamp;
          });

          return originalChildrenCount !== node.children.length; // Return true if any children were removed
        } else {
          // No timestamp provided, remove all children (original behavior)
          const hadChildren = node.children.length > 0;
          node.children = [];
          return hadChildren;
        }
      }

      if (node.children && node.children.length > 0) {
        for (let i = 0; i < node.children.length; i++) {
          if (removeAllChildren(node.children[i], nodeId)) {
            return true;
          }
        }
      }

      return false;
    }

    const nodeModified = removeAllChildren(project.treeData, targetNodeId);

    if (!nodeModified) {
      return res
        .status(404)
        .json({ message: "Node not found or no children were removed" });
    }

    project.markModified("treeData");
    await project.save();

    res.json({
      message: "Children of the node have been removed successfully",
      treeData: project.treeData,
    });
  } catch (err) {
    console.error("Error removing children:", err);
    res.status(500).json({ message: err.message });
  }
});

// DELETE a project and all its related data.
router.delete("/:projectId", async (req, res) => {
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

router.post("/event", async (req, res) => {
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
    // Set the eventInfo field with default testing user.
    project.eventInfo = {
      name,
      description,
      createdBy: "testing",
      createdAt: new Date(),
    };
    await project.save();
    res.json({ event: project.eventInfo, projectId: project.projectId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE specific nodes by their IDs
router.delete("/:projectId/nodes", async (req, res) => {
  try {
    const project = await Project.findOne({ projectId: req.params.projectId });
    if (!project) return res.status(404).json({ message: "Project not found" });

    // Get the list of node IDs to remove
    const { nodeIds } = req.body;
    if (!nodeIds || !Array.isArray(nodeIds) || nodeIds.length === 0) {
      return res.status(400).json({ message: "Node IDs array is required" });
    }

    // Convert all IDs to strings for consistency in comparison
    const idsToRemove = nodeIds.map((id) => id.toString());

    // Function to recursively remove nodes with matching IDs
    function removeSpecificNodes(node) {
      if (!node) return null;

      // If this is a node to remove, return null (delete it)
      if (idsToRemove.includes(node.id?.toString())) {
        return null;
      }

      // Otherwise, process its children
      if (node.children && node.children.length > 0) {
        // Filter out children that should be removed
        const newChildren = [];
        for (const child of node.children) {
          const processedChild = removeSpecificNodes(child);
          if (processedChild) {
            newChildren.push(processedChild);
          }
        }
        node.children = newChildren;
      }

      return node;
    }

    // Process the tree, removing specified nodes
    project.treeData = removeSpecificNodes(project.treeData);

    // Save the updated tree
    project.markModified("treeData");
    await project.save();

    res.json({
      message: "Specified nodes have been removed successfully",
      treeData: project.treeData,
    });
  } catch (err) {
    console.error("Error removing specific nodes:", err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
