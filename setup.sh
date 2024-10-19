#!/bin/bash

# Log to a file and also output to console
exec > >(tee -a /app/install.log) 2>&1

# Mark /app as a safe directory for Git
echo "Marking /app as a safe directory..."
git config --global --add safe.directory /app

# Check if the repository has already been cloned
if [ ! -d ".git" ]; then
  echo "Cloning repository..."
  git clone https://github.com/Nicoolodion/isthisnotpossible_CG.git .
fi

# Ensure we're on the correct branch
echo "Checking out PostgresSQL branch..."
# Reset any local changes
git reset --hard

# Fetch the latest branches and check out the PostgresSQL branch
git fetch origin
git checkout PostgresSQL || git switch PostgresSQL

# Install dependencies and build the bot
echo "Installing dependencies..."
npm install

npm i --save-dev @types/tough-cookie

npm uninstall typescript
npm run build
npm install typescript 

echo "Building the project..."
npm run build

# Start the bot
echo "Starting the bot..."
npm start
