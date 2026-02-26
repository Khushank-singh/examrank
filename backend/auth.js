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

    db.run(
      `INSERT INTO users (name, email, password, is_verified, verification_token)
       VALUES (?, ?, ?, 0, ?)`,
      [name, email, hashedPassword, verificationToken],
      function (err) {
        if (err) {
          return res.status(400).json({
            error: "Email already exists"
          });
        }

        const verifyLink = `${BACKEND_URL}/auth/verify/${verificationToken}`;

        res.json({
          message: "Signup successful. Please verify your account.",
          verifyLink
        });
      }
    );

  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// ======================
// EMAIL VERIFY
// ======================
router.get("/verify/:token", (req, res) => {
  const { token } = req.params;

  db.get(
    "SELECT * FROM users WHERE verification_token = ?",
    [token],
    (err, user) => {
      if (err || !user) {
        return res.status(400).send("Invalid or expired token.");
      }

      db.run(
        "UPDATE users SET is_verified = 1, verification_token = NULL WHERE id = ?",
        [user.id],
        (updateErr) => {
          if (updateErr) {
            return res.status(500).send("Verification failed.");
          }

          res.redirect(FRONTEND_URL);
        }
      );
    }
  );
});

// ======================
// LOGIN
// ======================
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "All fields required" });
  }

  db.get(
    `SELECT * FROM users WHERE email = ?`,
    [email],
    async (err, user) => {

      if (err) {
        return res.status(500).json({ error: "Server error" });
      }

      if (!user) {
        return res.status(400).json({
          error: "Invalid email or password"
        });
      }

      if (!user.is_verified) {
        const verifyLink = `${BACKEND_URL}/auth/verify/${user.verification_token}`;

        return res.status(403).json({
          error: "Please verify your account before logging in.",
          verifyLink
        });
      }

      const valid = await bcrypt.compare(password, user.password);

      if (!valid) {
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
        token
      });
    }
  );
});

module.exports = router;