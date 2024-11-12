const express = require('express');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = 3000;

// Secret key for JWT
const JWT_SECRET = 'your_jwt_secret_key';

// Middleware
app.use(express.json()); // Parse JSON body
app.use(express.static('public')); // Serve static files from "public"

// PostgreSQL Database Setup
const pool = new Pool({
    user: 'youruser',
    host: 'localhost',
    database: 'yourdatabase',
    password: 'yourpassword',
    port: 5432,
});

// Ensure the "Database" directory exists
const databaseDirectory = path.join(__dirname, 'Database');
if (!fs.existsSync(databaseDirectory)) {
    fs.mkdirSync(databaseDirectory);
    console.log(`Created directory: ${databaseDirectory}`);
}

// Ensure the "files" table exists
pool.query(`
    CREATE TABLE IF NOT EXISTS files (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        path TEXT NOT NULL,
        size INTEGER NOT NULL,
        upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
`).then(() => {
    console.log('PostgreSQL table "files" is ready.');
}).catch(err => {
    console.error('Error creating PostgreSQL table:', err.message);
});

// Mock user credentials for login (replace this with a user table in a real app)
const mockUser = {
    username: 'admin',
    password: bcrypt.hashSync('password', 10), // Hash "password"
};

// Middleware to authenticate JWT
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).send('Access token required.');

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).send('Invalid token.');
        req.user = user;
        next();
    });
}

// Routes

// Login Endpoint
app.post('/login', (req, res) => {
    console.log('Login attempt:', req.body);

    const { username, password } = req.body;

    if (!username || !password) {
        console.log('Missing username or password');
        return res.status(400).send('Username and password required.');
    }

    if (username !== mockUser.username || !bcrypt.compareSync(password, mockUser.password)) {
        console.log('Invalid credentials');
        return res.status(401).send('Invalid credentials.');
    }

    console.log('Credentials valid');
    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
});

// List Files Endpoint
app.get('/files', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT id, name, size, upload_date FROM files');
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching files:', err.message);
        res.status(500).send('Failed to fetch files.');
    }
});

// Add File Metadata
app.post('/add-file', authenticateToken, async (req, res) => {
    const { name, size } = req.body;

    if (!name || !size || size <= 0) {
        return res.status(400).send('Invalid file name or size.');
    }

    const filePath = path.join(databaseDirectory, name);

    try {
        // Check if file already exists
        if (fs.existsSync(filePath)) {
            return res.status(400).send('File already exists in the directory.');
        }

        // Create a placeholder file
        fs.writeFileSync(filePath, Buffer.alloc(size), 'utf-8');
        console.log(`Created placeholder file: ${filePath}`);

        // Add metadata to the database
        await pool.query(
            'INSERT INTO files (name, path, size, upload_date) VALUES ($1, $2, $3, NOW())',
            [name, filePath, size]
        );

        res.send('File added successfully.');
    } catch (err) {
        console.error('Error adding file:', err.message);
        res.status(500).send('Failed to add file.');
    }
});

// Download File
app.get('/download/:name', authenticateToken, (req, res) => {
    const filePath = path.join(databaseDirectory, req.params.name);
    res.download(filePath, (err) => {
        if (err) {
            console.error('Error downloading file:', err.message);
            res.status(500).send('Failed to download file.');
        }
    });
});

// Delete File
app.delete('/delete/:name', authenticateToken, async (req, res) => {
    const { name } = req.params;

    try {
        const filePath = path.join(databaseDirectory, name);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        await pool.query('DELETE FROM files WHERE name = $1', [name]);
        res.send('File deleted successfully.');
    } catch (err) {
        console.error('Error deleting file:', err.message);
        res.status(500).send('Failed to delete file.');
    }
});

// Start the Server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

