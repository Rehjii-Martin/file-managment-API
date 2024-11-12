const API_URL = 'http://localhost:3000';
let token = '';

// Generate JWT
function generateToken() {
    const username = document.getElementById('username').value;
    if (!username) {
        alert('Please enter a username.');
        return;
    }
    fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
    })
    .then(response => response.json())
    .then(data => {
        token = data.token;
        document.getElementById('token-display').innerText = `Token: ${token}`;
    })
    .catch(err => console.error('Error generating token:', err));
}

// List Files
function listFiles() {
    fetch(`${API_URL}/files`)
        .then(response => response.json())
        .then(data => {
            const filesList = document.getElementById('files-list');
            filesList.innerHTML = '';
            data.files.forEach(file => {
                const li = document.createElement('li');
                li.innerText = file;
                filesList.appendChild(li);
            });
        })
        .catch(err => console.error('Error fetching files:', err));
}

// Add File to SQLite
function addFile() {
    const filename = document.getElementById('filename').value;
    if (!filename) {
        alert('Please enter a file name.');
        return;
    }
    fetch(`${API_URL}/add-file`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: filename })
    })
    .then(response => response.text())
    .then(data => {
        document.getElementById('add-file-response').innerText = data;
    })
    .catch(err => console.error('Error adding file:', err));
}

// List Files from PostgreSQL
function listDbFiles() {
    fetch(`${API_URL}/db-files`, {
        headers: { Authorization: `Bearer ${token}` }
    })
    .then(response => response.json())
    .then(data => {
        const dbFilesList = document.getElementById('db-files-list');
        dbFilesList.innerHTML = '';
        data.forEach(file => {
            const li = document.createElement('li');
            li.innerText = `${file.id}: ${file.name}`;
            dbFilesList.appendChild(li);
        });
    })
    .catch(err => console.error('Error fetching database files:', err));
}

// Access Secure Endpoint
function accessSecureEndpoint() {
    fetch(`${API_URL}/secure-endpoint`, {
        headers: { Authorization: `Bearer ${token}` }
    })
    .then(response => response.text())
    .then(data => {
        document.getElementById('secure-endpoint-response').innerText = data;
    })
    .catch(err => console.error('Error accessing secure endpoint:', err));
}

