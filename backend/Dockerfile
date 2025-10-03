# Use official Node.js LTS image
FROM node:18-alpine

# Set working directory inside container
WORKDIR /usr/src/app

# Copy package files first for better caching
COPY package*.json ./

# Disable Husky git hooks in the container and install all dependencies
ENV HUSKY=0
RUN npm install

# Copy source code
COPY . .

# Expose backend port
EXPOSE 4000

# Default command to start server
CMD ["npm", "start"]
