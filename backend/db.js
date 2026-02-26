const sqlite3 = require('sqlite3').verbose();

// ==============================
// CONNECT DATABASE (Render-safe)
// ==============================

const db = new sqlite3.Database('/tmp/examrank.db', (err) => {
    if (err) {
        console.error("Database connection error:", err.message);
    } else {
        console.log("Connected to SQLite database.");
    }
});

// ==============================
// ENSURE TABLES CREATED IN ORDER
// ==============================

db.serialize(() => {

    // USERS TABLE
    db.run(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        is_verified INTEGER DEFAULT 0,
        verification_token TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    `);

    // SAFE COLUMN ADD (for older deployments)
    db.run(`ALTER TABLE users ADD COLUMN is_verified INTEGER DEFAULT 0`, (err) => {
        if (err && !err.message.includes("duplicate column")) {
            console.error(err.message);
        }
    });

    db.run(`ALTER TABLE users ADD COLUMN verification_token TEXT`, (err) => {
        if (err && !err.message.includes("duplicate column")) {
            console.error(err.message);
        }
    });

    // PREDICTIONS TABLE
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

    // INDEX FOR FAST HISTORY QUERY
    db.run(`CREATE INDEX IF NOT EXISTS idx_user_id ON predictions(user_id)`);

});

// ==============================

module.exports = db;