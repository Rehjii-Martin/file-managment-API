File Management API

# File Management API

This is a secure and user-friendly file management system that allows users to upload, encrypt, download, and delete files while maintaining metadata in a PostgreSQL database. All files are encrypted using AES-256-CBC encryption before storage, ensuring confidentiality and security.

## Features

- Upload and encrypt files securely.
- Retrieve a list of encrypted files with metadata (file name, size, upload date).
- Download and decrypt files securely.
- Delete files and their metadata from the database.

## Project Setup

### Prerequisites

- Node.js (v14 or higher)
- Docker and Docker Compose

### Setup Steps

1.  Clone the repository:

    ```bash

    git clone https://github.com/Rehjii-Martin/file-managment-API.git
    cd file-managment-API

    ```

2.  Create a \`.env\` file in the root directory and add your encryption key (32-byte hex string):

    ```bash

    ENCRYPTION_KEY=<32-byte-hex-key>
    JWT_SECRET=
    DATABASE_URL=

    ```

3.  Start the PostgreSQL database and backend using Docker Compose:

    ```bash

    docker-compose up -d

    ```

4.  Install project dependencies:

    ```bash

    npm install

    ```

5.  Start the server:

    ```bash

    node server.js

    ```

6.  Access the frontend at:

    ```bash

    http://localhost:3000

    ```

## Endpoints

### 1\. Upload a File

```bash

POST /upload
Headers: Authorization: Bearer
Form Data: file=

```

### 2\. Retrieve List of Files

```bash

GET /files
Headers: Authorization: Bearer

```

### 3\. Download a File

```bash

GET /download/:name
Headers: Authorization: Bearer

```

### 4\. Delete a File

```bash

DELETE /delete/:name
Headers: Authorization: Bearer

```

## Technologies Used

- **Back End:** Node.js, Express.js
- **Database:** PostgreSQL (via Docker)
- **Frontend:** HTML, CSS, JavaScript
- **Encryption:** AES-256-CBC

## Development Notes

- Files are encrypted upon upload using AES-256-CBC.
- Metadata, including IVs, is stored securely in the database.
- Ensure the \`.env\` file contains secure and valid keys.

## Future Enhancements

- Implement user-specific file management.
- Integrate cloud storage for scalability.
- Deprecate or enhance the "Add File" endpoint to support encryption and uploading placeholder files.
