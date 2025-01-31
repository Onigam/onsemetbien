FROM node:20-slim

# Install Python and other dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python-is-python3 \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the code
COPY . .

# Build TypeScript
RUN npm run build

# Start the server
CMD ["npm", "start"] 