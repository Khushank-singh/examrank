
const express = require("express");
const router = express.Router();
const pool = require("./db");

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

// ======================
// ENV CONFIG
// ======================
const SECRET = process.env.JWT_SECRET || "examrank_dev_secret";

// Production URLs
const FRONTEND_URL = "https://examrank-ga7km4wes-khushank-singhs-projects.vercel.app";
const BACKEND_URL = "https://examrank.onrender.com";

// ======================
// SIGNUP
// ======================
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "All fields required" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString("hex");

    await pool.query(
      "INSERT INTO users (name, email, password, is_verified, verification_token) VALUES ($1,$2,$3,$4,$5)",
      [name, email, hashedPassword, false, verificationToken]
    );

    const verifyLink = BACKEND_URL + "/auth/verify/" + verificationToken;

    res.json({
      message: "Signup successful. Please verify your account.",
      verifyLink: verifyLink
    });

  } catch (error) {
    if (error.code === "23505") {
      return res.status(400).json({ error: "Email already exists" });
    }

    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// ======================
// EMAIL VERIFY
// ======================
router.get("/verify/:token", async (req, res) => {
  const token = req.params.token;

  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE verification_token = $1",
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).send("Invalid or expired token.");
    }

    const user = result.rows[0];

    await pool.query(
      "UPDATE users SET is_verified = true, verification_token = NULL WHERE id = $1",
      [user.id]
    );

    res.redirect(FRONTEND_URL);

  } catch (error) {
    console.error(error);
    res.status(500).send("Verification failed.");
  }
});

// ======================
// LOGIN
// ======================
router.post("/login", async (req, res) => {

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "All fields required" });
  }

  try {

    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        error: "Invalid email or password"
      });
    }

    const user = result.rows[0];

    if (!user.is_verified) {

      const verifyLink = BACKEND_URL + "/auth/verify/" + user.verification_token;

      return res.status(403).json({
        error: "Please verify your account before logging in.",
        verifyLink: verifyLink
      });

    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(400).json({
        error: "Invalid email or password"
      });
    }

    const token = jwt.sign(
      { userId: user.id },
      SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token: token
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }

});

module.exports = router;

