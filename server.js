const express = require('express');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware for parsing JSON
app.use(express.json());

// Serve static files from the public folder
app.use(express.static('public'));

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

// Ensure the "files" table exists with the correct schema
pool.query(`
    CREATE TABLE IF NOT EXISTS files (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        path TEXT NOT NULL,
        size INTEGER NOT NULL DEFAULT 0,
        upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
`).then(() => {
    console.log('PostgreSQL table "files" is ready.');
}).catch(err => {
    console.error('Error creating PostgreSQL table:', err.message);
});

// Routes

// Root Route
app.get('/', (req, res) => {
    res.send('API is running!');
});

// List Files with Metadata
app.get('/files', async (req, res) => {
    try {
        const result = await pool.query('SELECT id, name, size, upload_date FROM files');
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching files:', err.message);
        res.status(500).send('Failed to fetch files.');
    }
});

// Add File Metadata
app.post('/add-file', async (req, res) => {
    const { name, size } = req.body; // Assume size is sent from the UI
    const filePath = `/Database/${name}`;
    try {
        await pool.query(
            'INSERT INTO files (name, path, size, upload_date) VALUES ($1, $2, $3, NOW())',
            [name, filePath, size]
        );
        res.send('File metadata added successfully.');
    } catch (err) {
        console.error('Error adding file metadata to PostgreSQL:', err.message);
        res.status(500).send('Failed to add file metadata.');
    }
});

// Download File
app.get('/download/:name', (req, res) => {
    const filePath = path.join(databaseDirectory, req.params.name);
    res.download(filePath, (err) => {
        if (err) {
            console.error('Error downloading file:', err.message);
            res.status(500).send('Failed to download file.');
        }
    });
});

// Delete File
app.delete('/delete/:name', async (req, res) => {
    const { name } = req.params;
    try {
        // Remove the physical file
        const filePath = path.join(databaseDirectory, name);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        // Remove metadata from the database
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

