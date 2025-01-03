const { Pool } = require('pg');
const { config } = require('dotenv');
config();

// Set up PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DB_URL, // Use the full DB_URL connection string
  ssl: {
    rejectUnauthorized: false // Set to true if you want to reject self-signed certificates
  }
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
