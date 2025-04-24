const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { poolPromise } = require("../db/sqlConnection");
const jwt = require("jsonwebtoken");


// POST /register
router.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const pool = await poolPromise;

    // Check if user already exists
    const check = await pool
      .request()
      .input("email", email)
      .query("SELECT * FROM Users WHERE email = @email");

    if (check.recordset.length > 0) {
      return res.status(400).json({ message: "User already exists." });
    }

    // Hash the password with salt
    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    const hash = await bcrypt.hash(password, salt);

    // Generate a 256-bit AES key (32 bytes)
    const aesKey = crypto.randomBytes(32).toString("hex");

    // Insert into Users table
    await pool
      .request()
      .input("email", email)
      .input("password_hash", hash)
      .input("salt", salt)
      .input("aes_key", aesKey)
      .query(`
        INSERT INTO Users (email, password_hash, salt, aes_key)
        VALUES (@email, @password_hash, @salt, @aes_key)
      `);

    res.status(201).json({ message: "User registered successfully." });
  } catch (err) {
    console.error("❌ Register Error:", err);
    res.status(500).json({ message: "Internal server error." });
  }
});

// POST /login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const pool = await poolPromise;

    // Get user by email
    const result = await pool
      .request()
      .input("email", email)
      .query("SELECT * FROM Users WHERE email = @email");

    if (result.recordset.length === 0) {
      return res.status(400).json({ message: "Invalid credentials." });
    }

    const user = result.recordset[0];

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials." });
    }

    // Create JWT token
const token = jwt.sign(
  { user_id: user.user_id },
  process.env.JWT_SECRET,
  { expiresIn: "1h" }
);

res.status(200).json({
  message: "Login successful.",
  token: token
});
  } catch (err) {
    console.error("❌ Login Error:", err);
    res.status(500).json({ message: "Internal server error." });
  }
});

module.exports = router;
