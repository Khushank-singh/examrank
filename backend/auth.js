const express = require("express");
const router = express.Router();
const db = require("./db");

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

// ======================
// ENV CONFIG
// ======================
const SECRET = process.env.JWT_SECRET || "examrank_dev_secret";

// 🔥 DEBUG LINE — MUST appear in Render logs
console.log("🔥🔥🔥 NEW BACKEND VERSION DEPLOYED SUCCESSFULLY 🔥🔥🔥");

// IMPORTANT: change this if your frontend URL changes
const FRONTEND_URL = "https://examrank-ga7km4wes-khushank-singhs-projects.vercel.app";

// 🔥 CHANGE DOMAIN COMPLETELY FOR TEST
const BACKEND_URL = "https://THIS-IS-THE-NEW-BACKEND.onrender.com";

// ======================
// SIGNUP
// ======================
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString("hex");

    db.run(
      `INSERT INTO users (name, email, password, is_verified, verification_token)
       VALUES (?, ?, ?, 0, ?)`,
      [name, email, hashedPassword, verificationToken],
      function (err) {

        const verifyLink = `${BACKEND_URL}/auth/verify/${verificationToken}`;

        console.log("🔥 VERIFY LINK GENERATED:", verifyLink);

        res.json({
          message: "Signup successful.",
          verifyLink
        });
      }
    );

  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;