const mongoose = require("mongoose");

const nodeAttributesSchema = new mongoose.Schema({
  importance: {
    type: Number,
    min: [1, "Minimum is 1"],
    max: [9, "Maximum is 9"],
  },  connection: {
    type: String,
    enum: [
      "A",
      "SC-",
      "SC",
      "SC+",
      "HC-",
      "HC",
      "HC+",
      "HC++",
      "SD-",
      "SD",
      "SD+",
      "HD-",
      "HD",
      "HD+",
      "HD++",
      "CPA",
    ],
  },  partialabsorption: {
    type: String,
    enum: ["Mandatory", "Optional"],
    default: null,
  },
  penaltyreward: {
    penalty: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.15
    },
    reward: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.1
    }
  },
  created: { type: Date, default: Date.now },
  decisionProcess: String,
  objectName: String,
  lastUpdated: Date,
});

const treeNodeSchema = new mongoose.Schema({
  id: { type: Number, required: true },
  name: { type: String, required: true },
  nodeNumber: { type: String, default: "1" }, // Adding node number
  attributes: nodeAttributesSchema,
  children: { type: [mongoose.Schema.Types.Mixed], default: [] },
  parent: { type: Number, default: null },
});

const projectSchema = new mongoose.Schema({
  projectId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  treeData: {
    type: treeNodeSchema,
    required: true,
    default: () => ({
      id: Date.now(),
      name: "Root",
      nodeNumber: "1",
      attributes: { importance: null, connection: null, partialabsorption: null, created: Date.now() },
      children: [],
      parent: null,
    }),
  },  // New eventInfo field to store event details from /event route.
  eventInfo: {
    name: String,
    description: String,
    createdBy: String, // Changed from ObjectId to String since we removed authentication
    createdAt: Date,
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

projectSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Project", projectSchema);
