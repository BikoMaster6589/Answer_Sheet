const { Pool } = require('pg');

// Set up PostgreSQL connection
const pool = new Pool({
    user: 'postgres',       // Replace with your PostgreSQL username
    host: 'localhost',
    database: 'newProject', // Replace with your database name
    password: 'mohan',    // Replace with your PostgreSQL password
    port: 5432,                   // Default PostgreSQL port
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
