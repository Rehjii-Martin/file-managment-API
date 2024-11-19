require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = 3000;

// Secret key for JWT
const JWT_SECRET = process.env.JWT_SECRET; 

// Middleware
app.use(express.json()); // Parse JSON body
app.use(express.static('public')); // Serve static files from "public"

// PostgreSQL Database Setup
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
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


// Middleware to authenticate JWT
const cookieParser = require('cookie-parser');
app.use(cookieParser());

function authenticateToken(req, res, next) {
    const token = req.cookies.token;

    if (!token) {
        return res.sendStatus(401); // Unauthorized
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.sendStatus(403); // Forbidden
        }
        req.user = user;
        next();
    });
}
// Implement File Upload Feature
const multer = require('multer');
const crypto = require('crypto');

// Configure multer to upload files to the Database directory
const upload = multer({ dest: 'uploads/' }); // Temporary storage for uploaded

// Encryption Configuration
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // Replace with a 32-byte key

if (!ENCRYPTION_KEY || Buffer.from(ENCRYPTION_KEY, 'hex').length !== 32) {
    throw new Error('Encryption key must be 32 bytes long.');
}

// Function to Encrypt Files
function encryptFile(filePath, encryptedPath) {
    return new Promise((resolve, reject) => {
        try {
            const iv = crypto.randomBytes(16); // Generate a random 16-byte IV
            const cipher = crypto.createCipheriv(
                'aes-256-cbc',
                Buffer.from(ENCRYPTION_KEY, 'hex'),
                iv
            );

            const input = fs.createReadStream(filePath);
            const output = fs.createWriteStream(encryptedPath);

            input.pipe(cipher).pipe(output);

            output.on('finish', () => {
                console.log(`Encryption completed for file: ${filePath}`);
                resolve(iv.toString('hex')); // Return the IV as a hex string
            });

            output.on('error', (err) => {
                console.error('Error during encryption:', err.message);
                reject(err);
            });
        } catch (err) {
            console.error('Unexpected error during encryption:', err.message);
            reject(err);
        }
    });
} 

// File upload endpoint
app.post('/upload', authenticateToken, upload.single('file'), async (req, res) => {
    const file = req.file;

    if (!file) {
        return res.status(400).send('No file uploaded.');
    }

    const { originalname, path: tempPath, size } = file;


    try {
        // Define encrypted file path
        const encryptedPath = path.join(__dirname, 'Database', `${originalname}.enc`);
    
        // Encrypt the file
        const iv = await encryptFile(tempPath, encryptedPath);
    
        // Store file metadata in the database
        await pool.query(
            'INSERT INTO files (name, path, size, iv, upload_date) VALUES ($1, $2, $3, $4, NOW())',
            [originalname, encryptedPath, size, iv]
        );

        // Delete temporary file after encryption
        fs.unlinkSync(tempPath);
        console.log('Temporary file deleted:', tempPath);

        res.send('File uploaded and encrypted successfully.');
    } catch (err) {
        console.error('Error during file upload:', err.message);
        res.status(500).send('Failed to upload file.');
    }

});

// Routes

// Login Endpoint
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (username === 'admin' && password === 'password') {
        const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '1h' });

        // Debugging log
        console.log('Generated token:', token);

        // Set the token as a secure HTTP-only cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 3600000,
        });

        // Send the token as JSON
        res.status(200).json({ message: 'Login successful', token });
    } else {
        // Debugging log for invalid credentials
        console.log('Invalid login attempt:', username, password);
        res.status(401).send('Invalid credentials');
    }
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

// Decrypt file function
function decryptFile(encryptedPath, iv) {
    const decipher = crypto.createDecipheriv(
        'aes-256-cbc',
        Buffer.from(ENCRYPTION_KEY, 'hex'),
        Buffer.from(iv, 'hex')
    );

    const decryptedPath = encryptedPath.replace('.enc', ''); // Optional: Change path if needed
    const input = fs.createReadStream(encryptedPath); // Read encrypted file
    const output = fs.createWriteStream(decryptedPath); // Write decrypted file

    input.pipe(decipher).pipe(output);

    return new Promise((resolve, reject) => {
        output.on('finish', () => resolve(decryptedPath)); // Return path of decrypted file
        output.on('error', (err) => reject(err));
    });
}

// Download file
app.get('/download/:name', async (req, res) => {
    const fileName = req.params.name;

    try {
        const result = await pool.query('SELECT path, iv FROM files WHERE name = $1', [fileName]);
        if (result.rowCount === 0) {
            console.error('File not found in database:', fileName);
            return res.status(404).send('File not found.');
        }

        const { path: encryptedPath, iv } = result.rows[0];

        console.log('Received filename:', fileName);
        console.log('File path:', encryptedPath);
        console.log('IV:', iv);
        console.log('Encryption key length:', Buffer.from(ENCRYPTION_KEY, 'hex').length);

        // Validate IV
        if (!iv || Buffer.from(iv, 'hex').length !== 16) {
            console.error('Invalid IV:', iv);
            return res.status(500).send('Invalid IV in database.');
        }

        if (!fs.existsSync(encryptedPath)) {
            console.error('File not found on disk:', encryptedPath);
            return res.status(404).send('File not found on disk.');
        }

       // Decrypt file
        const decryptedPath = await decryptFile(encryptedPath, iv);
        res.download(decryptedPath, fileName, (err) => {
            if (err) {
                console.error('Error sending file:', err.message);
                return res.status(500).send('Failed to send file.');
            }

            // Clean up decrypted file
            fs.unlink(decryptedPath, (unlinkErr) => {
                if (unlinkErr) console.error('Error cleaning up decrypted file:', unlinkErr.message);
            });
        });
    } catch (err) {
        console.error('Unhandled error during file download:', err.message);
        res.status(500).send('Failed to download file.');
    }
});

async function decryptFile(encryptedPath, iv) {
    const decipher = crypto.createDecipheriv(
        'aes-256-cbc',
        Buffer.from(process.env.ENCRYPTION_KEY, 'hex'),
        Buffer.from(iv, 'hex')
    );

    const decryptedPath = encryptedPath.replace('.enc', '');

    return new Promise((resolve, reject) => {
        const input = fs.createReadStream(encryptedPath);
        const output = fs.createWriteStream(decryptedPath);

        input.pipe(decipher).pipe(output);

        output.on('finish', () => resolve(decryptedPath));
        output.on('error', (err) => reject(err));
    });
} 

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

