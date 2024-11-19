#!/bin/bash

# Generate a new 32-byte hex encryption key
NEW_ENCRYPTION_KEY=$(openssl rand -hex 32)

# Generate a new 64-character alphanumeric JWT secret
NEW_JWT_SECRET=$(openssl rand -base64 48)

# Update the .env file with the new keys
if [ -f ".env" ]; then
    # Update ENCRYPTION_KEY
    sed -i "s/^ENCRYPTION_KEY=.*/ENCRYPTION_KEY=${NEW_ENCRYPTION_KEY}/" .env

    # Update JWT_SECRET
    sed -i "s/^JWT_SECRET=.*/JWT_SECRET=${NEW_JWT_SECRET}/" .env

    echo "Keys rotated successfully!"
    echo "New ENCRYPTION_KEY: $NEW_ENCRYPTION_KEY"
    echo "New JWT_SECRET: $NEW_JWT_SECRET"
else
    echo ".env file not found. Aborting."
    exit 1
fi
