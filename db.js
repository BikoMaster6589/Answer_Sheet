const { Pool } = require('pg');
const { config } = require('dotenv');
const fs = require('fs');
config();


if (!process.env.DB_URL) {
    console.error("DB_URL is not defined in the environment variables");
    process.exit(1);
}


const sslEnabled = process.env.PG_SSL === 'true'; 

// Set up PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DB_URL,  
  ssl: sslEnabled ? {
  rejectUnauthorized: false, 
  } : false, 
});


pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Error connecting to the database:', err);
    } else {
        console.log('Connected to the PostgreSQL database:', res.rows);
    }
});

pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1); 
});

module.exports = pool;
