File Management API Documentation body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; background-color: #f9f9f9; color: #333; } h1, h2, h3 { color: #444; } code { background-color: #eee; padding: 2px 4px; border-radius: 4px; font-family: "Courier New", Courier, monospace; } pre { background-color: #eee; padding: 10px; border-radius: 4px; overflow: auto; } .endpoint { margin-bottom: 20px; }

# File Management API

## Description

This API provides functionality for managing files, integrating SQLite and PostgreSQL databases, and securing endpoints using JWT authentication.

## Features

- **Directory Listing:** Lists files in a specified local directory.
- **SQLite Database Integration:** Adds files to a lightweight SQLite database.
- **PostgreSQL Integration:** Stores and retrieves file information in a Dockerized PostgreSQL database.
- **JWT Authentication:** Secures specific endpoints with token-based authentication.

## Prerequisites

- **Node.js** and **npm** installed
- **Docker** and **Docker Compose** installed
- **SQLite** installed locally

## Setup

1.  Clone the repository:
    ```bash
        git clone https://github.com/yourusername/my-api-project.git
        cd my-api-project
    ```
2.  Install dependencies:
    ```bash
        npm install
    ```
3.  Start the PostgreSQL database:
    ```bash
        docker-compose up -d
    ```
4.  Start the server:
    ```bash
        node server.js
    ```

## API Endpoints

### 1\. Root Endpoint

**URL:** `/`

**Method:** `GET`

**Description:** Check if the API is running.

```bash
    API is running!
```

#### Example `curl` Command:

```bash
    curl http://localhost:3000/
```

### 2\. List Files in a Directory

**URL:** `/files`

**Method:** `GET`

**Description:** Lists files in a specified local directory.

```bash
    { "files": ["example.txt"] }
```

#### Example `curl` Command:

```bash
    curl http://localhost:3000/files
```

### 3\. Add a File to SQLite

**URL:** `/add-file`

**Method:** `POST`

**Description:** Adds a file to the SQLite database.

```bash
        {
            "name": "example.txt"
        }
```

#### Example `curl` Command:

```bash
        curl -X POST -H "Content-Type: application/json" \
        -d '{"name": "example.txt"}' \
        http://localhost:3000/add-file
```

### 4\. List Files from PostgreSQL

**URL:** `/db-files`

**Method:** `GET`

**Description:** Retrieves file information from the PostgreSQL database.

```bash
        [
            { "id": 1, "name": "example.txt" }
        ]
```

#### Example `curl` Command:

```bash
    curl http://localhost:3000/db-files
```

### 5\. Generate a JWT

**URL:** `/login`

**Method:** `POST`

**Description:** Generates a JSON Web Token (JWT) for authentication.

```bash
    {
      "username": "testuser"
    }
```

#### Example `curl` Command:

```bash
    curl -X POST -H "Content-Type: application/json" \
    -d '{"username": "testuser"}' \
    http://localhost:3000/login
```

### 6\. Access a Secure Endpoint

**URL:** `/secure-endpoint`

**Method:** `GET`

**Description:** Access a secure endpoint using a JWT.

```bash
    This is a secure endpoint!
```

#### Example `curl` Command:

```bash
    curl -H "Authorization: Bearer <your-jwt-token>" \
    http://localhost:3000/secure-endpoint
```

## Automated Testing

A test script (`test-api.sh`) is included for automating the testing process.

### How to Use the Test Script

1.  Ensure `jq` (a JSON parser for the command line) is installed:

```bash
        sudo dnf install jq
```

2.  Run the script:

```bash
        bash test-api.sh
```

3.  The script performs the following:
    - Generates a JWT.
    - Tests `/secure-endpoint` with the generated token.
    - Tests `/files` and `/db-files` endpoints with the token.

## License

This project is licensed under the MIT License. Feel free to use and modify it.
