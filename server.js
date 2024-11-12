// Import required modules
const express = require('express');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');

// Initialize Express app
const app = express();
const PORT = 3000;

// Middleware to parse JSON requests
app.use(express.json());

// JWT Secret Key
const secret = 'your-secret-key';

// Authentication Middleware
const authenticate = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        console.log('No Authorization header provided');
        return res.status(403).send('Token required.');
    }

    const token = authHeader.split(' ')[1];
    console.log('Received Token:', token);

    jwt.verify(token, 'your-secret-key', (err, decoded) => {
        if (err) {
            console.log('Token verification failed:', err.message);
            return res.status(401).send('Invalid token.');
        }
        console.log('Token decoded successfully:', decoded);
        req.user = decoded;
        next();
    });
};
// PostgreSQL Pool Setup (for Virtualized Database)
const pool = new Pool({
    user: 'youruser',
    host: 'localhost',
    database: 'yourdatabase',
    password: 'yourpassword',
    port: 5432,
});

// Automatically create the 'files' table if it doesn't exist
pool.query(`
    CREATE TABLE IF NOT EXISTS files (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL
    );
`, (err, res) => {
    if (err) {
        console.error('Error creating table:', err);
    } else {
        console.log('Table "files" is ready.');
    }
});

// SQLite Local Database Setup (Optional)
const db = new sqlite3.Database('./database.db');
db.serialize(() => {
    db.run('CREATE TABLE IF NOT EXISTS files (id INTEGER PRIMARY KEY, name TEXT)');
});

// API Endpoints

// Root Endpoint
app.get('/', (req, res) => {
    res.send('API is running!');
});

// File System Endpoint: List files in a directory
app.get('/files', (req, res) => {
    const directoryPath = '/home/ispec0/API Database';
    fs.readdir(directoryPath, (err, files) => {
        if (err) {
            return res.status(500).send('Unable to scan directory.');
        }
        res.json({ files });
    });
});

// Add a file to the SQLite database
app.post('/add-file', (req, res) => {
    const { name } = req.body;
    db.run('INSERT INTO files(name) VALUES(?)', [name], (err) => {
        if (err) {
            return res.status(500).send('Failed to add file.');
        }
        res.send('File added successfully.');
    });
});

// List files from PostgreSQL (Virtualized Database)
app.get('/db-files', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM files');
        res.json(result.rows);
    } catch (err) {
        res.status(500).send('Error fetching files from database.');
    }
});

// Secure Endpoint Example
app.use('/secure-endpoint', authenticate, (req, res) => {
    res.send('This is a secure endpoint!');
});

// JWT Login: Generate token for a user
app.post('/login', (req, res) => {
    const { username } = req.body;
    const token = jwt.sign({ username }, secret, { expiresIn: '1h' });
    res.json({ token });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

