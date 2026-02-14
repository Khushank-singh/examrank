const sqlite3 = require('sqlite3').verbose();

// Connect to SQLite database (creates file if not exists)
const db = new sqlite3.Database('./examrank.db', (err) => {
    if (err) {
        console.error("Database connection error:", err.message);
    } else {
        console.log("Connected to SQLite database.");
    }
});

// Create history table
db.run(`
    CREATE TABLE IF NOT EXISTS history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        physics INTEGER,
        chemistry INTEGER,
        maths INTEGER,
        total INTEGER,
        rank INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);

module.exports = db;
