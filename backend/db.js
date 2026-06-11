console.log(process.env.DATABASE_URL);
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production"
    ? { rejectUnauthorized: false }
    : false,
});

// Optional: test connection
pool.connect()
  .then(() => console.log("PostgreSQL connected"))
  .catch(err => console.error("Database connection error", err));

module.exports = pool;