const express = require("express");
const router = express.Router();
const { encrypt } = require("../utils/encryption");
const { decrypt } = require("../utils/encryption"); // reuse decrypt from utils
const { poolPromise } = require("../db/sqlConnection");
const authenticateToken = require("../middleware/authMiddleware");


// POST /vault/add
router.post("/add", authenticateToken, async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { site_name, password } = req.body;
    if (!user_id || !site_name || !password) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    const pool = await poolPromise;

    // Get the user's AES key from the Users table
    const result = await pool
      .request()
      .input("user_id", user_id)
      .query("SELECT aes_key FROM Users WHERE user_id = @user_id");

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    const aesKey = result.recordset[0].aes_key;

    // Encrypt the password
    const { encryptedData, iv } = encrypt(password, aesKey);

    // Store into Passwords table
    await pool
      .request()
      .input("user_id", user_id)
      .input("site_name", site_name)
      .input("encrypted_password", encryptedData)
      .input("iv", iv)
      .query(`
        INSERT INTO Passwords (user_id, site_name, encrypted_password, iv)
        VALUES (@user_id, @site_name, @encrypted_password, @iv)
      `);

    res.status(201).json({ message: "Password stored securely." });
  } catch (err) {
    console.error("❌ Vault Add Error:", err);
    res.status(500).json({ message: "Internal server error." });
  }
});


// GET /vault/get/:user_id
router.get("/get", authenticateToken, async (req, res) => {
  try {
    const user_id = req.user.user_id;

    const pool = await poolPromise;

    // Get AES key for the user
    const userResult = await pool
      .request()
      .input("user_id", user_id)
      .query("SELECT aes_key FROM Users WHERE user_id = @user_id");

    if (userResult.recordset.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    const aesKey = userResult.recordset[0].aes_key;

    // Get all vault entries for this user
    const vaultResult = await pool
      .request()
      .input("user_id", user_id)
      .query("SELECT site_name, encrypted_password, iv FROM Passwords WHERE user_id = @user_id");

    const decryptedVault = vaultResult.recordset.map((entry) => {
      const decryptedPassword = decrypt(entry.encrypted_password, entry.iv, aesKey);
      return {
        site_name: entry.site_name,
        password: decryptedPassword
      };
    });

    res.status(200).json(decryptedVault);
  } catch (err) {
    console.error("❌ Vault Get Error:", err);
    res.status(500).json({ message: "Internal server error." });
  }
});


module.exports = router;
