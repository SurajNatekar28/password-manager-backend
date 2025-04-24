const mongoose = require("mongoose");

const vaultSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  site: String,
  encryptedPassword: String,
  iv: String
});

module.exports = mongoose.model("Vault", vaultSchema);
