const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Backend running");
});

app.post("/predict", (req, res) => {
  const { physics, chemistry, maths } = req.body;

  const total =
    Number(physics) +
    Number(chemistry) +
    Number(maths);

  const rank = Math.max(1, 200000 - total * 500);

  res.json({ total, rank });
});

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
