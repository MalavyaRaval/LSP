const mongoose = require("mongoose");

const nodeAttributesSchema = new mongoose.Schema({
  importance: {
    type: Number,
    min: [1, 'Importance must be at least 1'],
    max: [5, 'Importance cannot exceed 5']
  },
  connection: {
    type: Number,
    min: [1, 'Connection must be at least 1'],
    max: [5, 'Connection cannot exceed 5']
  },
  created: {
    type: Date,
    default: Date.now
  },
  decisionProcess: String,
  objectName: String,
  lastUpdated: Date
});

const treeNodeSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  attributes: nodeAttributesSchema,
  children: {
    type: [mongoose.Schema.Types.Mixed],
    default: []
  },
  parent: {
    type: Number,
    default: null
  }
});

const projectSchema = new mongoose.Schema({
  projectId: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    lowercase: true
  },
  treeData: {
    type: treeNodeSchema,
    required: true,
    default: () => ({
      id: Date.now(),
      name: "Root",
      attributes: {
        importance: null,
        connection: null,
        created: Date.now()
      },
      children: [],
      parent: null
    })
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Add pre-save hook for updatedAt
projectSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Project", projectSchema);