const express = require("express");
const router = express.Router();
const db = require("./db");

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// ======================
// USE ENV SECRET (PRODUCTION SAFE)
// ======================
const SECRET = process.env.JWT_SECRET || "examrank_dev_secret";

// ======================
// SIGNUP
// ======================
router.post("/signup", async (req, res) => {

    try {

        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                error: "All fields required"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        db.run(
            `INSERT INTO users (name, email, password)
             VALUES (?, ?, ?)`,
            [name, email, hashedPassword],
            function (err) {

                if (err) {
                    console.error("Signup error:", err.message);
                    return res.status(400).json({
                        error: "Email already exists"
                    });
                }

                const token = jwt.sign(
                    { userId: this.lastID },
                    SECRET,
                    { expiresIn: "7d" }
                );

                res.json({
                    message: "Signup successful",
                    token
                });

            }
        );

    } catch (error) {

        console.error("Server error:", error.message);

        res.status(500).json({
            error: "Server error"
        });

    }

});

// ======================
// LOGIN
// ======================
router.post("/login", (req, res) => {

    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            error: "All fields required"
        });
    }

    db.get(
        `SELECT * FROM users WHERE email = ?`,
        [email],
        async (err, user) => {

            if (err) {
                console.error("Database error:", err.message);
                return res.status(500).json({
                    error: "Server error"
                });
            }

            if (!user) {
                return res.status(400).json({
                    error: "Invalid email or password"
                });
            }

            const valid = await bcrypt.compare(
                password,
                user.password
            );

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