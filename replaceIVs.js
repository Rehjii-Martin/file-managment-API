const { Pool } = require('pg');
const crypto = require('crypto');

const pool = new Pool({
    user: 'youruser',
    host: 'localhost',
    database: 'yourdatabase',
    password: 'yourpassword',
    port: 5432,
});

const IV_LENGTH = 16; // AES block size

async function replacePlaceholderIVs() {
    try {
        // Query for rows with placeholder IV values
        const result = await pool.query(
            "SELECT id, name, path, iv FROM files WHERE iv IN ('valid_iv_here', 'default_iv_value')"
        );

        const files = result.rows;

        if (files.length === 0) {
            console.log('No placeholder IV values found.');
            return;
        }

        console.log(`Found ${files.length} files with placeholder IVs. Updating...`);

        for (const file of files) {
            const { id, name, path } = file;

            // Generate a new legitimate IV
            const iv = crypto.randomBytes(IV_LENGTH).toString('hex');

            // Update the database with the new IV
            await pool.query('UPDATE files SET iv = $1 WHERE id = $2', [iv, id]);
            console.log(`Updated file "${name}" with new IV: ${iv}`);
        }

        console.log('All placeholder IVs have been replaced.');
    } catch (err) {
        console.error('Error replacing placeholder IVs:', err.message);
    } finally {
        pool.end();
    }
}

replacePlaceholderIVs();

