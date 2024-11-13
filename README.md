File Management API

# File Management API

This is a simple File Management System that allows users to manage file metadata using a PostgreSQL database and interact with the system through a Node.js back end. A user-friendly front end is included for listing, adding, downloading, and deleting files.

## Features

- List all files with metadata such as file name, size, and upload date.
- Add metadata for files.
- Download files stored in the local **Database** directory.
- Delete files and their associated metadata.
- Expose the API for remote access using **ngrok** (optional).

## Project Setup

### Prerequisites

- Node.js (v14 or higher)
- Docker and Docker Compose

### Clone the Repository

```bash
    git clone https://github.com/Rehjii-Martin/file-managment-API.git
    cd file-managment-API
```

### Run the Project

1.  Start the PostgreSQL database and back end using Docker Compose:

```bash
    docker-compose up -d
```

2.  Install project dependencies:

```bash
    npm install
```

3.  Start the server:

```bash
    node server.js
```

4.  Access the UI at:

```bash
    http://localhost:3000
```

### Database Configuration

The PostgreSQL database is automatically configured via Docker Compose. If you wish to manually configure it, ensure the following:

- Database: `yourdatabase` <--- replace with name of your Database
- User: `youruser` <--- replace with name of your user
- Password: `yourpassword` <--- replace with your password

## API Endpoints

### 1\. List Files

Retrieve a list of all files with metadata.

        `GET /files`

#### Example Response:

        `[{"id": 1,"name": "example.txt","size": 1024,"upload_date": "2024-11-12T10:30:00.000Z"}]

### 2\. Add File Metadata

Add metadata for a new file.

        `POST /add-file Content-Type: application/json{ "name": "example.txt","size": 1024}

#### Example Response:

        `File metadata added successfully.`

### 3\. Download File

Download a file from the **Database** directory.

        `GET /download/:name`

#### Example Usage:

```bash
    curl http://localhost:3000/download/example.txt`
```

### 4\. Delete File

Delete a file and its associated metadata.

        `DELETE /delete/:name`

#### Example Usage:

```bash
    curl -X DELETE http://localhost:3000/delete/example.txt
```

#### Example Response:

        `File deleted successfully.`

#### Expose the API Using ngrok (Optional):

To temporarily expose your API for remote access:

1. Install ngrok by following the instructions here.

2. Start your server locally:

```bash
    node server.js
```

3. Run ngrok to expose your local server:

```bash
    ngrok http 3000
```

4. Use the public URL generated by ngrok (e.g., https://randomsubdomain.ngrok.io) to access the API/UI remotely.

## Technologies Used

- **Back End:** Node.js, Express.js
- **Database:** PostgreSQL (via Docker)
- **Front End:** HTML, CSS, JavaScript

## Development Notes

- Physical files are stored in the **Database** directory.
- File metadata is stored in the PostgreSQL database.
- Pagination and filtering features can be added for scalability.

## Future Enhancements

- Add authentication using JWT for secure access.
- Enable file uploads directly from the UI.
- Support cloud storage options (e.g., AWS S3).
