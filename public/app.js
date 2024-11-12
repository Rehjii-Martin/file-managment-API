let token = null;

// Login Functionality
document.getElementById('login-form').addEventListener('submit', async (event) => {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            token = data.token;
            localStorage.setItem('jwt', token);
            document.getElementById('login-response').innerText = 'Login successful!';
            showAppSection();
        } else {
            document.getElementById('login-response').innerText = 'Invalid credentials.';
        }
    } catch (err) {
        document.getElementById('login-response').innerText = 'Error during login.';
        console.error(err);
    }
});

function showAppSection() {
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('app-section').style.display = 'block';
}

// Logout Functionality
function logout() {
    token = null;
    localStorage.removeItem('jwt');
    document.getElementById('login-section').style.display = 'block';
    document.getElementById('app-section').style.display = 'none';
    document.getElementById('login-response').innerText = 'Logged out successfully.';
}

// Retrieve File List
async function listFiles() {
    const responseElement = document.getElementById('list-response');
    responseElement.classList.add('hidden'); // Hide the response initially

    try {
        const response = await fetch('/files', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('jwt')}`
            }
        });

        const files = await response.json();
        responseElement.textContent = JSON.stringify(files, null, 2); // Pretty JSON formatting

        // Trigger the fade-in effect
        setTimeout(() => {
            responseElement.classList.remove('hidden');
            responseElement.classList.add('visible');
        }, 100); // Small delay for smooth animation
    } catch (err) {
        responseElement.textContent = 'Error fetching files.';
        console.error(err);

        // Trigger the fade-in effect for error message
        setTimeout(() => {
            responseElement.classList.remove('hidden');
            responseElement.classList.add('visible');
        }, 100);
    }
}


// Add File Metadata
async function addFile(event) {
    event.preventDefault();

    const name = document.getElementById('add-name').value;
    const size = parseInt(document.getElementById('add-size').value);

    try {
        const response = await fetch('/add-file', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('jwt')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, size })
        });

        if (response.ok) {
            document.getElementById('add-response').innerText = 'File added successfully!';
        } else {
            document.getElementById('add-response').innerText = 'Failed to add file.';
        }
    } catch (err) {
        document.getElementById('add-response').innerText = 'Error adding file.';
        console.error(err);
    }
}

// Download File
async function downloadFile(event) {
    event.preventDefault();

    const name = document.getElementById('download-name').value;

    try {
        const response = await fetch(`/download/${name}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('jwt')}`
            }
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = name;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.getElementById('download-response').innerText = 'File downloaded successfully!';
        } else {
            document.getElementById('download-response').innerText = 'Failed to download file.';
        }
    } catch (err) {
        document.getElementById('download-response').innerText = 'Error downloading file.';
        console.error(err);
    }
}

// Delete File
async function deleteFile(event) {
    event.preventDefault();

    const name = document.getElementById('delete-name').value;

    try {
        const response = await fetch(`/delete/${name}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('jwt')}`
            }
        });

        if (response.ok) {
            document.getElementById('delete-response').innerText = 'File deleted successfully!';
        } else {
            document.getElementById('delete-response').innerText = 'Failed to delete file.';
        }
    } catch (err) {
        document.getElementById('delete-response').innerText = 'Error deleting file.';
        console.error(err);
    }
}

