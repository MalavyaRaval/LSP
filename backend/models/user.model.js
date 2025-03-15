const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zip: { type: String, required: true, minlength: 5, maxlength: 5 },
  createdOn: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", userSchema);
