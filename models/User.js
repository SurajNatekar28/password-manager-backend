const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: String,
  passwordHash: String,
  salt: String,
  twoFAEnabled: Boolean,
  encryptionKey: String // Optional: AES key (if per-user encryption)
});

module.exports = mongoose.model("User", userSchema);
