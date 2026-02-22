const express = require("express");
const cors = require("cors");
const axios = require("axios");

// import SQLite database
const db = require("./db");

// import auth routes
const authRoutes = require("./auth");

// import auth middleware
const authMiddleware = require("./authMiddleware");

const app = express();

app.use(cors());
app.use(express.json());


// ==============================
// AUTH ROUTES
// ==============================

app.use("/auth", authRoutes);


// ==============================
// TEST ROUTE
// ==============================

app.get("/", (req, res) => {
    res.send("ExamRank Backend Running");
});


// ==============================
// PREDICTION ROUTE (PROTECTED)
// ==============================

app.post("/predict", authMiddleware, async (req, res) => {

    try {

        const userId = req.userId;

        const {
            physics = 0,
            chemistry = 0,
            maths = 0,
            biology = 0,
            stream = "PCM"
        } = req.body;


        // ==============================
        // CALL ML SERVICE
        // ==============================

        const mlResponse = await axios.post(
            "https://examrank-ml-service.onrender.com/predict",
            {
                physics,
                chemistry,
                maths,
                biology,
                stream
            }
        );


        // ==============================
        // EXTRACT ML RESPONSE
        // ==============================

        const {
            total_marks,
            predicted_rank,
            percentile,
            confidence
        } = mlResponse.data;


        // ==============================
        // SAVE INTO DATABASE
        // ==============================

        db.run(
            `INSERT INTO predictions
            (user_id, physics, chemistry, maths, biology, stream, total, predicted_rank, percentile, confidence)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                userId,
                physics,
                chemistry,
                maths,
                biology,
                stream,
                total_marks,
                predicted_rank,
                percentile,
                confidence
            ],
            function(err) {

                if (err) {

                    console.error("Database error:", err.message);

                } else {

                    console.log("Prediction saved for user:", userId);

                }

            }
        );


        // ==============================
        // SEND RESPONSE TO FRONTEND
        // ==============================

        res.json({
            total_marks,
            predicted_rank,
            percentile,
            confidence
        });

    }
    catch (error) {

        console.error("Prediction error:", error.message);

        res.status(500).json({
            error: "Prediction failed"
        });

    }

});


// ==============================
// HISTORY ROUTE (PROTECTED)
// ==============================

app.get("/history", authMiddleware, (req, res) => {

    const userId = req.userId;

    db.all(
        `SELECT id,
                physics,
                chemistry,
                maths,
                biology,
                stream,
                total,
                predicted_rank,
                percentile,
                confidence,
                created_at
         FROM predictions
         WHERE user_id = ?
         ORDER BY id DESC
         LIMIT 8`,
        [userId],
        (err, rows) => {

            if (err) {

                console.error("Database error:", err.message);

                return res.status(500).json({
                    error: "Database error"
                });

            }

            res.json(rows);

        }
    );

});


// ==============================
// START SERVER
// ==============================

const PORT = 4000;

app.listen(PORT, () => {

    console.log(`Server running on port ${PORT}`);

});
