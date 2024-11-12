const API_URL = 'http://localhost:3000';

// List files with metadata
function listFiles() {
    fetch(`${API_URL}/files`)
        .then(response => response.json())
        .then(data => {
            const fileList = document.getElementById('file-list');
            fileList.innerHTML = ''; // Clear existing list
            data.forEach(file => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <strong>Name:</strong> ${file.name} |
                    <strong>Size:</strong> ${file.size} bytes |
                    <strong>Uploaded:</strong> ${file.upload_date}
                `;
                fileList.appendChild(li);
            });
        })
        .catch(err => console.error('Error listing files:', err));
}

// Add file metadata
function addFile() {
    const name = document.getElementById('file-name').value;
    const size = document.getElementById('file-size').value;

    if (!name || !size) {
        alert('Please enter both name and size.');
        return;
    }

    fetch(`${API_URL}/add-file`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, size: parseInt(size, 10) })
    })
        .then(response => response.text())
        .then(data => {
            document.getElementById('add-file-response').innerText = data;
            listFiles(); // Refresh the list
        })
        .catch(err => console.error('Error adding file:', err));
}

// Download file
function downloadFile() {
    const name = document.getElementById('download-name').value;

    if (!name) {
        alert('Please enter a file name to download.');
        return;
    }

    window.location.href = `${API_URL}/download/${name}`;
}

// Delete file
function deleteFile() {
    const name = document.getElementById('delete-name').value;

    if (!name) {
        alert('Please enter a file name to delete.');
        return;
    }

    fetch(`${API_URL}/delete/${name}`, { method: 'DELETE' })
        .then(response => response.text())
        .then(data => {
            document.getElementById('delete-response').innerText = data;
            listFiles(); // Refresh the list
        })
        .catch(err => console.error('Error deleting file:', err));
}

