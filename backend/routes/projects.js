const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const Evaluation = require('../models/Evaluation');

// GET: Retrieve the project tree by projectId (create it if not exists)
router.get('/:projectId', async (req, res) => {
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
            created: new Date()
          }
        }
      });
      await project.save();
    }
    res.json(project.treeData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT: Update the project tree
router.put('/:projectId', async (req, res) => {
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

// POST: Create a new project
router.post('/', async (req, res) => {
  try {
    const { projectName } = req.body;
    if (!projectName || typeof projectName !== 'string') {
      return res.status(400).json({ message: "Valid projectName is required" });
    }
    
    const projectId = projectName.toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '');
      
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
          created: new Date()
        }
      }
    });

    await newProject.save();
    res.status(201).json({
      projectId,
      projectName,
      _id: newProject._id
    });
  } catch (err) {
    res.status(400).json({ 
      message: err.message || "Error creating project",
      errorDetails: err 
    });
  }
});

// POST: Add child nodes with DEMA metadata
router.post('/:projectId/nodes', async (req, res) => {
  try {
    const project = await Project.findOne({ projectId: req.params.projectId });
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const { parentId, children, metadata } = req.body;
    
    const addChildrenToParent = (node) => {
      if (node.id == parentId) { // Loose equality for type flexibility
        // Add DEMA metadata to parent node
        node.attributes = node.attributes || {};
        node.attributes.decisionProcess = metadata?.decisionProcess || 'DEMA';
        node.attributes.objectName = metadata?.objectName || 'Untitled Object';
        node.attributes.lastUpdated = new Date();

        // Add children with attributes (read from child.attributes)
        node.children.push(...children.map(child => ({
          ...child,
          attributes: {
            importance: Number(child.attributes?.importance),
            connection: Number(child.attributes?.connection),
            created: new Date(child.attributes?.created || Date.now())
          },
          parent: node.id,
          children: []
        })));

        return true;
      }
      return node.children?.some(addChildrenToParent);
    };

    if (!addChildrenToParent(project.treeData)) {
      return res.status(404).json({ message: 'Parent node not found' });
    }

    project.markModified('treeData');
    await project.save();
    res.json(project.treeData);
  } catch (err) {
    res.status(500).json({ 
      message: err.message,
      errorDetails: {
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        receivedData: req.body
      }
    });
  }
});

// Add this new route after your existing routes

// PUT: Update a specific node in the project tree by nodeId
router.put('/:projectId/nodes/:nodeId', async (req, res) => {
  try {
    const project = await Project.findOne({ projectId: req.params.projectId });
    if (!project) return res.status(404).json({ message: 'Project not found' });
    const treeData = project.treeData;
    const { attributes } = req.body;

    // Helper function: recursively update node attributes
    const updateNodeAttributes = (node, nodeId, newAttributes) => {
      if (node.id.toString() === nodeId.toString()) {
        node.attributes = { 
          ...node.attributes, 
          ...newAttributes, 
          lastUpdated: new Date() 
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

    project.markModified('treeData');
    await project.save();
    res.json(project.treeData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE a node and its associated query results, then update evaluations.
router.delete('/node/:nodeId', async (req, res) => {
  const { nodeId } = req.params;
  const projectId = req.query.projectId; // Expect projectId as a query parameter
  if (!projectId) {
    return res.status(400).json({ message: "Project ID is required." });
  }
  
  try {
    // Delete node logic: remove the node from treeData.
    const project = await Project.findOne({ projectId });
    if (!project) {
      return res.status(404).json({ message: "Project not found." });
    }
    
    // Recursive function to remove the node from the tree.
    function removeNode(node, nodeId) {
      if (node.id.toString() === nodeId.toString()) {
        return null; // Remove this node
      }
      if (node.children && node.children.length > 0) {
        node.children = node.children
          .map(child => removeNode(child, nodeId))
          .filter(child => child !== null);
      }
      return node;
    }
    
    project.treeData = removeNode(project.treeData, nodeId);
    project.markModified("treeData");
    await project.save();
    
    // Delete associated query results.
    const QueryResult = require('../models/QueryResult');
    await QueryResult.deleteMany({ nodeId });
    
    // Remove the key for the deleted node from all evaluations.
    await Evaluation.updateMany(
      { projectId },
      { $unset: { [`alternativeValues.${nodeId}`]: "" } }
    );
    
    res.json({ message: "Node, its query results, and evaluation entries updated.", treeData: project.treeData });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

module.exports = router;
