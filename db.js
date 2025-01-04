const { Pool } = require('pg');
const { config } = require('dotenv');
const fs = require('fs');
config();

// Ensure DB_URL is defined
if (!process.env.DB_URL) {
    console.error("DB_URL is not defined in the environment variables");
    process.exit(1);
}

// Set up PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DB_URL, // Use the full DB_URL connection string
  ssl: {
    rejectUnauthorized: false, // Set to true if you want to reject self-signed certificates
    // Uncomment and provide path if you want to use a certificate file for security
    // ca: fs.readFileSync('/path/to/ca-certificate.crt').toString(),
  }
});

// Test connection using a query
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Error connecting to the database:', err);
    } else {
        console.log('Connected to the PostgreSQL database:', res.rows);
    }
});

// Handle any errors in the pool
pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1); // Exits the process
});

module.exports = pool;
