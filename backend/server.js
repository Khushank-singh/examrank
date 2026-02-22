const express = require("express");
const cors = require("cors");

// import SQLite database
const db = require("./db");

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
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use(express.json());

// ==============================
// TOTAL STUDENTS
// ==============================

const TOTAL_NEET_STUDENTS = 2300000;
const TOTAL_JEE_STUDENTS = 1200000;

// ==============================
// MARKS VS RANK TABLES
// ==============================

const NEET_TABLE = [
  [720, 1], [710, 20], [700, 100], [690, 400],
  [680, 1000], [670, 3000], [660, 7000], [650, 13000],
  [640, 22000], [630, 35000], [620, 52000], [600, 95000],
  [580, 150000], [560, 230000], [540, 320000],
  [520, 450000], [500, 620000], [480, 800000],
  [460, 1000000], [440, 1200000], [420, 1400000],
  [400, 1600000], [380, 1800000], [360, 1950000],
  [340, 2100000], [300, 2200000]
];

const JEE_TABLE = [
  [300, 1], [290, 50], [280, 200], [270, 600],
  [260, 1500], [250, 3200], [240, 6000],
  [230, 10000], [220, 16000], [210, 24000],
  [200, 35000], [190, 48000], [180, 65000],
  [170, 85000], [160, 110000], [150, 140000],
  [140, 180000], [130, 220000], [120, 270000],
  [110, 320000], [100, 380000]
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
// PREDICT ROUTE (PROTECTED)
// ==============================

app.post("/predict", authMiddleware, (req, res) => {

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

    // SAVE INTO DATABASE
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
        total,
        rank,
        percentile,
        confidence
      ],
      function (err) {
        if (err) {
          console.error("Database error:", err.message);
        } else {
          console.log("Prediction saved for user:", userId);
        }
      }
    );

    res.json({
      total_marks: total,
      predicted_rank: rank,
      percentile,
      confidence
    });

  } catch (error) {
    console.error("Prediction error:", error.message);
    res.status(500).json({ error: "Prediction failed" });
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
        return res.status(500).json({ error: "Database error" });
      }

      res.json(rows);
    }
  );

});

// ==============================
// START SERVER
// ==============================

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});