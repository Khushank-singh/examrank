const axios = require("axios");
const express = require("express");
const cors = require("cors");
const Prediction = require("./models/Prediction");  // MongoDB model

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());


// Test route
app.get("/", (req, res) => {
  res.send("Backend running");
});


// Predict route (Node → Flask → MongoDB → Frontend)
app.post("/predict", async (req, res) => {

  try {

    const { physics, chemistry, maths, biology, stream } = req.body;

    // Call Flask ML service
    const mlResponse = await axios.post(
      "http://127.0.0.1:5001/predict",
      {
        physics,
        chemistry,
        maths,
        biology,
        stream
      }
    );

    // Calculate total
    const total =
      stream === "PCM"
        ? Number(physics) + Number(chemistry) + Number(maths)
        : Number(physics) + Number(chemistry) + Number(biology);

    // Get predicted rank
    const rank = mlResponse.data.predicted_rank;

    // Save prediction in MongoDB
    const newPrediction = new Prediction({

      physics: Number(physics),
      chemistry: Number(chemistry),
      maths: Number(maths),
      biology: Number(biology),

      stream: stream,

      total: total,

      rank: rank

    });

    await newPrediction.save();

    console.log("Prediction saved:", newPrediction);

    // Send result back to frontend
    res.json({
      total: total,
      rank: rank
    });

  } catch (error) {

    console.error("Prediction error:", error.message);

    res.status(500).json({
      error: "Prediction failed"
    });

  }

});


// History route (Get last 10 predictions)
app.get("/history", async (req, res) => {

  try {

    const history = await Prediction
      .find()
      .sort({ createdAt: -1 })
      .limit(10);

    res.json(history);

  } catch (error) {

    console.error("History error:", error.message);

    res.status(500).json({
      error: "Failed to fetch history"
    });

  }

});


// Start server
app.listen(PORT, () => {

  console.log("Server running on port " + PORT);

});
