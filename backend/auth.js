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

// ======================
// SIGNUP (SIMULATED EMAIL VERIFICATION)
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
                    console.error("Signup error:", err.message);
                    return res.status(400).json({
                        error: "Email already exists"
                    });
                }

                const verifyLink =
                    `https://examrank-backend.onrender.com/auth/verify/${verificationToken}`;

                // Log verification link (for testing)
                console.log("Verification link:", verifyLink);

                res.json({
                    message: "Signup successful. Please verify your account.",
                    verifyLink: verifyLink
                });

            }
        );

    } catch (error) {

        console.error("Server error:", error.message);
        res.status(500).json({ error: "Server error" });

    }

});

// ======================
// EMAIL VERIFY ROUTE
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

                    res.send("Email verified successfully. You can now login.");
                }
            );

        }
    );

});

// ======================
// LOGIN (BLOCK IF NOT VERIFIED)
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
                return res.status(403).json({
                    error: "Please verify your account before logging in."
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