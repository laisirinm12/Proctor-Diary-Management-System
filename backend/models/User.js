const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true }, // USN or email
  password: { type: String, required: true },
  role: { type: String, enum: ["student", "proctor"], required: true }
});

module.exports = mongoose.model("User", userSchema);
