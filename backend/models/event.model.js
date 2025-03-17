const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
  name: String,
  description: String,
  image: String,
  projectId: {  
    type: String,
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
});

// Pre-validate hook to generate projectId from name if not provided.
eventSchema.pre("validate", function (next) {
  if (!this.projectId && this.name) {
    this.projectId = this.name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]+/g, "");
  }
  next();
});

const Event = mongoose.model("Event", eventSchema);

module.exports = Event;