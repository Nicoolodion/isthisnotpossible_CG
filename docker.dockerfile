# Use an official Node.js image as the base image
FROM node:14

# Set the working directory to /app
WORKDIR /app

# Clone the repository and keep the games.db file
RUN git clone -b V2_CG https://github.com/Nicoolodion/isthisnotpossible_CG.git . \
    && git reset --hard HEAD \
    && git checkout games.db

# Every time the Docker image is built, pull the latest changes from the repository
RUN git pull origin V2_CG

# Install dependencies
RUN npm install

# Build the application
RUN npm run build

# Expose the port the bot will use
EXPOSE 3000

# Start the bot when the container is launched
CMD ["npm", "start"]