const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('/tmp/examrank.db', (err) => {
    if (err) {
        console.error("Database connection error:", err.message);
    } else {
        console.log("Connected to SQLite database.");
    }
});


// ==============================
// USERS TABLE
// ==============================

db.run(`
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
`);


// ==============================
// PREDICTIONS TABLE (UPGRADED)
// ==============================

db.run(`
CREATE TABLE IF NOT EXISTS predictions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    physics INTEGER,
    chemistry INTEGER,
    maths INTEGER,
    biology INTEGER,
    stream TEXT,
    total INTEGER,
    predicted_rank INTEGER,
    percentile REAL,
    confidence REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
)
`);


// ==============================
// SAFE COLUMN ADD FOR EXISTING DATABASE
// (Will silently ignore if already exists)
// ==============================

db.run(`ALTER TABLE predictions ADD COLUMN percentile REAL`, (err) => {
    if (err && !err.message.includes("duplicate column")) {
        console.error(err.message);
    }
});

db.run(`ALTER TABLE predictions ADD COLUMN confidence REAL`, (err) => {
    if (err && !err.message.includes("duplicate column")) {
        console.error(err.message);
    }
});


// ==============================

module.exports = db;
