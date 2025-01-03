const { Pool } = require('pg');
const { config } = require('dotenv');

// Load environment variables
config();

// Set up PostgreSQL connection
const poolConfig = process.env.DB_URL
  ? { connectionString: process.env.DB_URL, ssl: { rejectUnauthorized: false } }
  : {
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT,
      ssl: { rejectUnauthorized: false }, // Enable/disable as needed
    };

const pool = new Pool(poolConfig);

// Test the connection
pool.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err);
  } else {
    console.log('Connected to the PostgreSQL database');
  }
});

module.exports = pool;
