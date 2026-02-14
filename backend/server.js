const express = require("express");
const cors = require("cors");
const axios = require("axios");

// import SQLite database (db.js)
const db = require("./db");

const app = express();

app.use(cors());
app.use(express.json());


/* Test route */
app.get("/", (req, res) => {
    res.send("ExamRank Backend Running");
});


/* Prediction route */
app.post("/predict", async (req, res) => {

    try {

        const { physics, chemistry, maths, biology, stream } = req.body;

        const total =
            (physics || 0) +
            (chemistry || 0) +
            (maths || 0) +
            (biology || 0);

        // Call ML service
        const mlResponse = await axios.post(
            "http://127.0.0.1:5001/predict",
            {
                physics,
                chemistry,
                maths,
                biology,
                stream,
                total
            }
        );

        const predicted_rank = mlResponse.data.predicted_rank;

        // Save to database
        db.run(
            `INSERT INTO predictions
            (physics, chemistry, maths, biology, stream, total, predicted_rank)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                physics,
                chemistry,
                maths,
                biology,
                stream,
                total,
                predicted_rank
            ],
            function(err) {

                if (err) {
                    console.error("Database insert error:", err.message);
                } else {
                    console.log("Prediction saved ID:", this.lastID);
                }

            }
        );

        // Send response to frontend
        res.json({
            total,
            predicted_rank
        });

    }
    catch (error) {

        console.error("Prediction error:", error.message);

        res.status(500).json({
            error: "Prediction failed"
        });

    }

});


/* History route */
app.get("/history", (req, res) => {

    db.all(
        "SELECT * FROM predictions ORDER BY id DESC",
        [],
        (err, rows) => {

            if (err) {
                console.error("Database fetch error:", err.message);

                res.status(500).json({
                    error: "Database error"
                });

            } else {

                res.json(rows);

            }

        }
    );

});


/* Start server */
app.listen(4000, () => {
    console.log("Server running on port 4000");
});
