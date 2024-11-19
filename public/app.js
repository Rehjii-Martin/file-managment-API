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

// displayList
function displayList(files) {
    const listContainer = document.getElementById('list-response');
    listContainer.innerHTML = ''; // Clear existing content

    // Add each file to the list container
    files.forEach(file => {
        const listItem = document.createElement('div');
        listItem.textContent = `${file.name} (${file.size} bytes)`;
        listItem.style.padding = '5px'; // Optional: Add styling
        listItem.style.borderBottom = '1px solid #ccc'; // Optional: Add styling
        listContainer.appendChild(listItem);
    });

    listContainer.style.display = 'block'; // Show the list
}

// Token Getter
function getToken() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No token found in localStorage.');
            alert('You must log in to perform this action.');
        } else {
            console.log('Token successfully fetched:', token);
        }
        return token;
    } catch (error) {
        console.error('Error accessing localStorage:', error);
        alert('An error occurred while accessing the token. Please try again.');
        return null;
    }
}

// Format the metadata //
function populateList(responseData) {
    const listContainer = document.getElementById('list-response');
    listContainer.innerHTML = ''; // Clear existing content

    const ul = document.createElement('ul');

    responseData.forEach(file => {
        const li = document.createElement('li');

        // Add styled metadata
        li.innerHTML = `
            <span class="label">File Name:</span> <span>${file.name}</span>
            <span class="label">Size:</span> <span>${file.size} bytes</span>
            <span class="label">Upload Date:</span> <span>${new Date(file.upload_date).toLocaleString()}</span>
        `;

        ul.appendChild(li);
    });

    listContainer.appendChild(ul);
}


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

// Token handling during login

async function login(event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });

        console.log('Raw response:', response); // Debugging log

        // Check content type of the response
        const contentType = response.headers.get('content-type');
        console.log('Response content type:', contentType); // Debugging log

        // Parse the response based on content type
        if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            console.log('Parsed response data:', data);

            if (data.token) {
                localStorage.setItem('token', data.token);
                alert(data.message);
            } else {
                alert('Login failed. No token received.');
            }
        } else {
            console.error('Unexpected response format:', await response.text());
            alert('Unexpected response format. Please contact support.');
        }
    } catch (error) {
        console.error('Error during login:', error);
        alert('Login failed. Please try again.');
    }
}


// Retrieve File List
async function retrieveList() {
    try {
        const response = await fetch('/files', {
            method: 'GET',
        });

        if (response.ok) {
            const files = await response.json();
            displayList(files);
        } else {
            const errorMessage = await response.text();
            console.error('Failed to retrieve files:', errorMessage);
            alert('Failed to retrieve files. Please log in again.');
        }
    } catch (error) {
        console.error('Error retrieving file list:', error);
        alert('An error occurred while retrieving the file list. Please try again.');
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
    event.preventDefault(); // Prevent the form's default behavior

    const fileName = document.getElementById('file-name').value.trim(); // Ensure you're using the correct input ID

    if (!fileName) {
        alert('Please enter a valid file name.');
        return;
    }

    try {
        const response = await fetch(`/download/${encodeURIComponent(fileName)}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const blob = await response.blob();
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = fileName;
        link.style.display = 'none';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        console.log('File downloaded successfully.');
    } catch (err) {
        console.error('Error downloading file:', err.message);
        alert('Failed to download file. Please try again.');
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
// Upload File
async function uploadFile(event) {
    event.preventDefault();

    const fileInput = document.getElementById('file-upload');
    const formData = new FormData();
    formData.append('file', fileInput.files[0]);

    try {
        const response = await fetch('/upload', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('jwt')}`,
            },
            body: formData,
        });

        if (response.ok) {
            document.getElementById('upload-response').innerText = 'File uploaded successfully!';
        } else {
            const errorText = await response.text();
            document.getElementById('upload-response').innerText = `Error: ${errorText}`;
        }
    } catch (err) {
        document.getElementById('upload-response').innerText = 'Error uploading file.';
        console.error(err);
    }
}

