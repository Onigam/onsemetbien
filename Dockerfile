FROM node:20-slim

# Install Python, pnpm and other dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python-is-python3 \
    && rm -rf /var/lib/apt/lists/* \
    && npm install -g pnpm@9

# Set working directory
WORKDIR /app

# Copy workspace configuration
COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY pnpm-lock.yaml ./

# Copy all package.json files for workspace dependencies
COPY shared/package.json ./shared/
COPY apps/webradio/package.json ./apps/webradio/
COPY apps/backoffice/package.json ./apps/backoffice/
COPY tools/package.json ./tools/

# Install dependencies using pnpm
RUN pnpm install --frozen-lockfile

# Copy the rest of the code
COPY . .

# Build the shared package first
RUN pnpm --filter shared build

# Build the webradio app
RUN pnpm --filter webradio build

# Expose the port
EXPOSE 3001

# Start the webradio server
CMD ["pnpm", "start:radio"]
