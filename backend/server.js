require("dotenv").config();

const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const pool = require("./db");
const authRoutes = require("./auth");
const authMiddleware = require("./authMiddleware");

const app = express();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});

app.use(limiter);

const allowedOrigins = [
  "http://localhost:5173",
  "https://examrank.vercel.app"
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

app.use(express.json());

async function createTables() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        is_verified BOOLEAN DEFAULT FALSE,
        verification_token TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("Users table ready");

    await pool.query(`
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
    `);
    console.log("Predictions table ready");
  } catch (error) {
    console.error("Table creation error:", error);
  }
}

createTables();

const TOTAL_NEET_STUDENTS = 2300000;
const TOTAL_JEE_STUDENTS  = 1200000;

const NEET_TABLE = [
  [720,1],[710,20],[700,80],[690,300],[680,900],[670,2500],[660,6000],
  [650,10000],[640,17000],[630,25000],[620,36000],[610,52000],[600,72000],
  [590,95000],[580,120000],[560,180000],[540,260000],[520,360000],
  [500,520000],[480,700000],[460,950000],[440,1200000],[420,1500000],
  [400,1750000],[380,2000000],[350,2200000],[320,2270000],[300,2300000],
  [0,2300000]
];

// Extended down to 0 marks — previously stopped at 100 which gave
// anyone below 100 marks a wrongly optimistic rank of 340000 (71st percentile)
const JEE_TABLE = [
  [300,1],[290,40],[280,120],[270,350],[260,900],[250,2000],[240,4500],
  [230,8000],[220,13000],[210,20000],[200,30000],[190,42000],[180,60000],
  [170,80000],[160,105000],[150,130000],[140,160000],[130,200000],
  [120,240000],[110,290000],[100,340000],[90,420000],[80,520000],
  [70,640000],[60,760000],[50,880000],[40,980000],[30,1060000],
  [20,1120000],[10,1170000],[0,1200000]
];

function interpolate(marks, table, totalStudents) {
  if (marks >= table[0][0]) return table[0][1];
  if (marks <= table[table.length - 1][0]) return table[table.length - 1][1];
  for (let i = 0; i < table.length - 1; i++) {
    const [m1, r1] = table[i];
    const [m2, r2] = table[i + 1];
    if (marks <= m1 && marks >= m2) {
      const ratio = (marks - m2) / (m1 - m2);
      const rank  = r2 + ratio * (r1 - r2);
      return Math.max(1, Math.min(Math.floor(rank), totalStudents));
    }
  }
  return totalStudents;
}

function calculatePercentile(rank, totalStudents) {
  return Number((((totalStudents - rank) / totalStudents) * 100).toFixed(2));
}

function calculateConfidence(marks, table) {
  const maxMarks   = table[0][0];
  const minMarks   = table[table.length - 1][0];
  const normalized = (marks - minMarks) / (maxMarks - minMarks);
  return Number((70 + normalized * 29).toFixed(2));
}

app.use("/auth", authRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "ExamRank Backend", time: new Date() });
});

app.get("/", (req, res) => {
  res.send("ExamRank Backend Running");
});

app.post("/predict", authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const { physics = 0, chemistry = 0, maths = 0, biology = 0, stream = "PCM" } = req.body;

    let total, rank, percentile, confidence;

    if (stream === "PCM") {
      total      = Number(physics) + Number(chemistry) + Number(maths);
      rank       = interpolate(total, JEE_TABLE, TOTAL_JEE_STUDENTS);
      percentile = calculatePercentile(rank, TOTAL_JEE_STUDENTS);
      confidence = calculateConfidence(total, JEE_TABLE);
    } else if (stream === "PCB") {
      total      = Number(physics) + Number(chemistry) + Number(biology);
      rank       = interpolate(total, NEET_TABLE, TOTAL_NEET_STUDENTS);
      percentile = calculatePercentile(rank, TOTAL_NEET_STUDENTS);
      confidence = calculateConfidence(total, NEET_TABLE);
    } else {
      return res.status(400).json({ error: "Invalid stream" });
    }

    await pool.query(
      `INSERT INTO predictions
       (user_id, physics, chemistry, maths, biology, stream, total, predicted_rank, percentile, confidence)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [userId, physics, chemistry, maths, biology, stream, total, rank, percentile, confidence]
    );

    res.json({ total_marks: total, predicted_rank: rank, percentile, confidence });
  } catch (error) {
    console.error("Prediction error:", error);
    res.status(500).json({ error: "Prediction failed" });
  }
});

// ── HISTORY — now includes stream column + limited to last 50 records ──
app.get("/history", authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const result = await pool.query(
      `SELECT id,
              stream,
              total,
              predicted_rank,
              percentile,
              confidence,
              created_at
       FROM predictions
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("History error:", error);
    res.status(500).json({ error: "Database error" });
  }
});

// ── CLEAR HISTORY — deletes all predictions for the logged-in user ──
app.delete("/history", authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    await pool.query(
      "DELETE FROM predictions WHERE user_id = $1",
      [userId]
    );
    res.json({ message: "History cleared" });
  } catch (error) {
    console.error("Clear history error:", error);
    res.status(500).json({ error: "Failed to clear history" });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});