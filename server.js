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

// Report result of query
pool.query('SELECT * FROM files', (err, result) => {
    if (err) {
        console.error('Database query failed:', err.message);
    } else {
        console.log('Database query result:', result.rows);
    }
});


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

// Implement File Upload Feature
const multer = require('multer');

// Configure multer to upload files to the Database directory
const upload = multer({
    dest: path.join(__dirname, 'Database'), // Temporary location
    limits: { fileSize: 50 * 1024 * 1024 }, // Limit files to 50MB
});

// Required Modules
const crypto = require('crypto');

// Encryption Configuration
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-32-byte-secret-key'; // Replace with a 32-byte key
const IV_LENGTH = 16; // AES block size

// Function to Encrypt File
function encryptFile(filePath, encryptedPath) {
    const iv = crypto.randomBytes(IV_LENGTH); // Generate a random IV
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);

    const input = fs.createReadStream(filePath);
    const output = fs.createWriteStream(encryptedPath);

    input.pipe(cipher).pipe(output); // Encrypt file content

    return iv.toString('hex'); // Return the IV as a hex string
}

// File Upload Endpoint with Encryption
app.post('/upload', authenticateToken, upload.single('file'), async (req, res) => {
    const file = req.file;

    if (!file) {
        return res.status(400).send('No file uploaded.');
    }

    const { originalname, size } = file;
    const encryptedFilePath = path.join(__dirname, 'Database', `${originalname}.enc`);

    try {
        // Encrypt the file and save the IV
        const iv = encryptFile(file.path, encryptedFilePath);

        // Remove the original file after encryption
        fs.unlinkSync(file.path);

        // Store metadata in the database, including the encrypted path and IV
        await pool.query(
            'INSERT INTO files (name, path, size, upload_date, iv) VALUES ($1, $2, $3, NOW(), $4)',
            [originalname, encryptedFilePath, size, iv]
        );

        res.send('File uploaded and encrypted successfully.');
    } catch (err) {
        console.error('Error uploading file:', err.message);
        res.status(500).send('Failed to upload file.');
    }
});

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

// Decrypt File Function
function decryptFile(encryptedPath, iv) {
    const decipher = crypto.createDecipheriv(
        'aes-256-cbc',
        Buffer.from(process.env.ENCRYPTION_KEY), // Replace with your 32-byte key stored in an environment variable
        Buffer.from(iv, 'hex') // Convert IV from hex string to a buffer
    );

    const decryptedPath = encryptedPath.replace('.enc', ''); // Original file name (removes .enc extension)
    const input = fs.createReadStream(encryptedPath); // Read encrypted file
    const output = fs.createWriteStream(decryptedPath); // Create writable stream for decrypted file

    // Pipe the input stream through the decipher and into the output stream
    input.pipe(decipher).pipe(output);

    return new Promise((resolve, reject) => {
        output.on('finish', () => resolve(decryptedPath)); // Resolve the promise when decryption is complete
        output.on('error', (err) => reject(err)); // Reject the promise if an error occurs
    });
}

// File Download Endpoint
app.get('/download/:name', async (req, res) => {
    const fileName = req.params.name;

    try {
        // Query the database for file metadata
        const result = await pool.query(
            'SELECT path, iv FROM files WHERE name = $1',
            [fileName]
        );

        // Check if the file exists in the database
        if (result.rowCount === 0) {
            return res.status(404).send('File not found.');
        }

        const { path: encryptedPath, iv } = result.rows[0];

        // Decrypt the file
        const decryptedPath = await decryptFile(encryptedPath, iv);

        // Send the decrypted file to the client
        res.download(decryptedPath, fileName, (err) => {
            if (err) {
                console.error('Error sending file:', err.message);
                return res.status(500).send('Failed to send file.');
            }

            // Clean up the decrypted file after sending it
            fs.unlinkSync(decryptedPath);
        });
    } catch (err) {
        console.error('Error during file download:', err.message);
        res.status(500).send('Failed to download file.');
    }
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

