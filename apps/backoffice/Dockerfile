FROM node:20-slim

# Install Python, pnpm and other dependencies needed for backoffice
RUN apt-get update && apt-get install -y \
    python3 \
    python-is-python3 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/* \
    && npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy workspace configuration from root
COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY pnpm-lock.yaml ./

# Copy all package.json files for workspace dependencies
COPY shared/package.json ./shared/
COPY apps/backoffice/package.json ./apps/backoffice/
COPY tools/package.json ./tools/

# Install dependencies using pnpm
RUN pnpm install --frozen-lockfile

# Copy the rest of the code
COPY shared ./shared
COPY apps/backoffice ./apps/backoffice
COPY tools ./tools

# Build the shared package first
RUN pnpm --filter shared build

# Build the backoffice app (both client and server)
RUN pnpm --filter backoffice build

# Expose the port (backoffice typically runs on 3002)
EXPOSE 3002

# Start the backoffice server
CMD ["pnpm", "start:backoffice"]