const express = require("express");
const cors = require("cors");

// PostgreSQL connection
const pool = require("./db");

// import auth routes
const authRoutes = require("./auth");

// import auth middleware
const authMiddleware = require("./authMiddleware");

const app = express();

// ==============================
// CORS CONFIGURATION
// ==============================

const allowedOrigins = [
  "http://localhost:5173",
  "https://examrank.vercel.app"
];

app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());

// ==============================
// CREATE TABLES (AUTO)
// ==============================

pool.query(`
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  verification_token TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`)
.then(() => console.log("Users table ready"))
.catch(err => console.error("Users table error:", err));

pool.query(`
CREATE TABLE IF NOT EXISTS predictions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  physics INTEGER,
  chemistry INTEGER,
  maths INTEGER,
  biology INTEGER,
  stream TEXT,
  total INTEGER,
  predicted_rank INTEGER,
  percentile NUMERIC,
  confidence NUMERIC,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`)
.then(() => console.log("Predictions table ready"))
.catch(err => console.error("Predictions table error:", err));

// ==============================
// TOTAL STUDENTS
// ==============================

const TOTAL_NEET_STUDENTS = 2300000;
const TOTAL_JEE_STUDENTS = 1200000;

// ==============================
// MARKS VS RANK TABLES
// ==============================

const NEET_TABLE = [
  [720, 1],[710,15],[700,75],[690,250],[680,800],[670,2000],
  [660,5000],[650,9000],[640,15000],[630,22000],[620,32000],
  [610,45000],[600,65000],[580,110000],[560,180000],[540,260000],
  [520,360000],[500,500000],[480,700000],[460,950000],[440,1200000],
  [420,1450000],[400,1700000],[380,1900000],[350,2100000],[300,2250000]
];

const JEE_TABLE = [
  [300,1],[290,50],[280,200],[270,600],[260,1500],[250,3200],
  [240,6000],[230,10000],[220,16000],[210,24000],[200,35000],
  [190,48000],[180,65000],[170,85000],[160,110000],[150,140000],
  [140,180000],[130,220000],[120,270000],[110,320000],[100,380000]
];

// ==============================
// INTERPOLATION FUNCTION
// ==============================

function interpolate(marks, table) {

  if (marks >= table[0][0]) return table[0][1];
  if (marks <= table[table.length - 1][0])
    return table[table.length - 1][1];

  for (let i = 0; i < table.length - 1; i++) {

    const [m1, r1] = table[i];
    const [m2, r2] = table[i + 1];

    if (m1 >= marks && marks >= m2) {

      const ratio = (marks - m2) / (m1 - m2);
      const rank = r2 + ratio * (r1 - r2);

      return Math.floor(rank);
    }
  }

  return table[table.length - 1][1];
}

// ==============================
// PERCENTILE FUNCTION
// ==============================

function calculatePercentile(rank, totalStudents) {
  return Number((((totalStudents - rank) / totalStudents) * 100).toFixed(2));
}

// ==============================
// CONFIDENCE FUNCTION
// ==============================

function calculateConfidence(marks, table) {

  const maxMarks = table[0][0];
  const minMarks = table[table.length - 1][0];

  const normalized = (marks - minMarks) / (maxMarks - minMarks);
  const confidence = 70 + (normalized * 29);

  return Number(confidence.toFixed(2));
}

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
// PREDICT ROUTE
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

    let total, rank, percentile, confidence;

    if (stream === "PCM") {

      total = Number(physics) + Number(chemistry) + Number(maths);
      rank = interpolate(total, JEE_TABLE);
      percentile = calculatePercentile(rank, TOTAL_JEE_STUDENTS);
      confidence = calculateConfidence(total, JEE_TABLE);

    } else if (stream === "PCB") {

      total = Number(physics) + Number(chemistry) + Number(biology);
      rank = interpolate(total, NEET_TABLE);
      percentile = calculatePercentile(rank, TOTAL_NEET_STUDENTS);
      confidence = calculateConfidence(total, NEET_TABLE);

    } else {
      return res.status(400).json({ error: "Invalid stream" });
    }

    await pool.query(
      `INSERT INTO predictions
      (user_id, physics, chemistry, maths, biology, stream, total, predicted_rank, percentile, confidence)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        userId,
        physics,
        chemistry,
        maths,
        biology,
        stream,
        total,
        rank,
        percentile,
        confidence
      ]
    );

    res.json({
      total_marks: total,
      predicted_rank: rank,
      percentile,
      confidence
    });

  } catch (error) {
    console.error("Prediction error:", error);
    res.status(500).json({ error: "Prediction failed" });
  }

});

// ==============================
// HISTORY ROUTE
// ==============================

app.get("/history", authMiddleware, async (req, res) => {

  try {

    const userId = req.userId;

    const result = await pool.query(
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
       WHERE user_id = $1
       ORDER BY id DESC
       LIMIT 8`,
      [userId]
    );

    res.json(result.rows);

  } catch (error) {

    console.error("Database error:", error);
    res.status(500).json({ error: "Database error" });

  }

});

// ==============================
// START SERVER
// ==============================

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
