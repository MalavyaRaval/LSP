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

const Event = mongoose.model("Event", eventSchema);

module.exports = Event;