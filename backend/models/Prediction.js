const mongoose = require("../db");

const predictionSchema = new mongoose.Schema({

  physics: Number,
  chemistry: Number,
  maths: Number,
  biology: Number,

  stream: String,

  total: Number,

  rank: Number,

  createdAt: {
    type: Date,
    default: Date.now
  }

});

module.exports = mongoose.model("Prediction", predictionSchema);
