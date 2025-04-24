const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config(); // ✅ Load .env variables early!

const { poolPromise } = require("./db/sqlConnection");
const authRoutes = require("./routes/authRoutes"); // ✅ Import auth routes
const vaultRoutes = require("./routes/vaultRoutes");

// Debug: Log environment variables
console.log("🔍 ENV - Server:", process.env.AZURE_SQL_SERVER);
console.log("🔍 ENV - DB:", process.env.AZURE_SQL_DATABASE);
console.log("🔍 ENV - User:", process.env.AZURE_SQL_USER);

// App setup
const app = express();
app.use(cors());
app.use(express.json()); // for parsing JSON

// ✅ Mount /api/auth routes here
app.use("/api/auth", authRoutes);
app.use("/api/vault", vaultRoutes);

// Health check route
app.get("/", (req, res) => {
  res.send("🔐 Password Manager Backend is running");
});

// Test DB connection
app.get("/test-db", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query("SELECT TOP 5 * FROM Users");
    res.json(result.recordset);
  } catch (err) {
    console.error("❌ SQL query error:", err);
    res.status(500).send("Database error: " + err.message);
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

