const { Pool } = require('pg');

require('dotenv').config();
// Set up PostgreSQL connection
const pool = new Pool({
    connectionString: process.env.DB_URL,
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_POST,
  ssl: {
    rejectUnauthorized: false // Set to true if you want to reject self-signed certificates
  }                  // Default PostgreSQL port
});

// Test connection
pool.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err);
    } else {
        console.log('Connected to the PostgreSQL database');
    }
});

module.exports = pool;
