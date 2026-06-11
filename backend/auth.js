const express = require("express");
const router = express.Router();
const pool = require("./db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const SECRET = process.env.JWT_SECRET || "examrank_dev_secret";

/*
|--------------------------------------------------------------------------
| Signup
|--------------------------------------------------------------------------
| New users are created as verified users.
| Email verification is no longer required.
*/
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "All fields required" });
    }

    // Check if email already exists
    const existing = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      "INSERT INTO users (name, email, password, is_verified, verification_token) VALUES ($1,$2,$3,$4,$5)",
      [name, email, hashedPassword, true, null]
    );

    res.json({
      message: "Signup successful. You can now log in."
    });

  } catch (error) {
    if (error.code === "23505") {
      return res.status(400).json({ error: "Email already exists" });
    }

    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

/*
|--------------------------------------------------------------------------
| Verify Email
|--------------------------------------------------------------------------
| Kept for backward compatibility with old verification links.
*/
router.get("/verify/:token", async (req, res) => {
  const token = req.params.token;

  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE verification_token = $1",
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).send("Token already used or invalid.");
    }

    const user = result.rows[0];

    await pool.query(
      "UPDATE users SET is_verified = true, verification_token = NULL WHERE id = $1",
      [user.id]
    );

    res.send("Account verified. You can now log in.");

  } catch (error) {
    console.error(error);
    res.status(500).send("Verification failed.");
  }
});

/*
|--------------------------------------------------------------------------
| Login
|--------------------------------------------------------------------------
| All users are treated as verified.
*/
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
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const user = result.rows[0];

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(400).json({ error: "Invalid email or password" });
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

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;