const fs = require('fs');
const crypto = require('crypto');

const ENCRYPTION_KEY = 8ea9624b823bfa81cef6b81e97978951b104ce155057fb090dc2fdbd80120028
  // Replace with your key
const IV = 'your-iv-here'; // Replace with the IV from the database
const encryptedPath = '/path/to/Database/example.txt.enc';
const decryptedPath = '/path/to/Database/example_decrypted.txt';

const decipher = crypto.createDecipheriv(
    'aes-256-cbc',
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    Buffer.from(IV, 'hex')
);

const input = fs.createReadStream(encryptedPath);
const output = fs.createWriteStream(decryptedPath);

input.pipe(decipher).pipe(output);

output.on('finish', () => {
    console.log('Decryption successful. File saved at:', decryptedPath);
});

output.on('error', (err) => {
    console.error('Error during decryption:', err.message);
});

