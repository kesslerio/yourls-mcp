FROM node:18-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY src/ ./src/
COPY yourls-mcp.js ./

# Make the main script executable
RUN chmod +x yourls-mcp.js

# Set environment variables
ENV NODE_ENV=production

# Command to run the server
CMD ["node", "yourls-mcp.js"]