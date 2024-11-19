File Management API

# File Management API

This is a simple File Management System that allows users to securely manage file metadata using a PostgreSQL database and interact with the system through a Node.js back end. A user-friendly front end is included for listing, adding, downloading, and deleting files.

## Features

- List all files with metadata such as file name, size, and upload date.
- Add and upload files with secure encryption.
- Download files with decryption.
- Delete files and their associated metadata.

## Project Setup

### Prerequisites

- Node.js (v14 or higher)
- Docker and Docker Compose

### Clone the Repository

```

git clone https://github.com/Rehjii-Martin/file-management-api.git
cd file-management-api
```

### Run the Project

1.  Start the PostgreSQL database and back end using Docker Compose:

    ```
    docker-compose up -d
    ```

2.  Install project dependencies:

    ```
    npm install
    ```

3.  Create a \`.env\` file in the root directory and add your encryption key:

    ```

    ENCRYPTION_KEY=your-32-byte-key
    PORT=3000
    JWT_SECRET=your-jwt-secret

    ```

4.  Start the server:

    ```
    node server.js
    ```

5.  Access the UI at:

    ```
    http://localhost:3000
    ```

## API Endpoints

### 1\. List Files

Retrieve a list of all files with metadata.

```
GET /files
```

#### Example Response:

```

[
    {
        "name": "example.txt",
        "size": 1024,
        "upload_date": "2024-11-18T10:30:00.000Z"
    }
]

```

### 2\. Upload Files

Upload and encrypt a file.

```

POST /upload
Authorization: Bearer
Form-Data: file=@example.txt

```

### 3\. Download File

Download and decrypt a file.

```

GET /download/:name
Authorization: Bearer

```

### 4\. Delete File

Delete a file and its metadata.

```

DELETE /delete/:name
Authorization: Bearer

```

## Technologies Used

- Node.js and Express.js for the back end
- PostgreSQL for the database
- Docker for database deployment
- HTML, CSS, and JavaScript for the front end

## Development Notes

- Files are encrypted upon upload and stored as \`.enc\` files in the \`Database\` directory.
- File metadata is securely stored in the PostgreSQL database.
- Environment variables are stored in a \`.env\` file (ensure it’s excluded from version control).

## Future Enhancements

- Implement user roles for more granular access control.
- Add support for large file uploads with progress tracking.
- Implement cloud storage integration for remote file management.
