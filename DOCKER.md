# Docker Setup for On se met bien Web Radio

This document explains how to run the On se met bien web radio system using Docker Compose.

## Prerequisites

- Docker and Docker Compose installed on your system
- OVH cloud storage credentials (for audio file storage)

## Quick Start

1. **Set up environment variables**:
   ```bash
   cp .env.example .env
   ```
   Edit the `.env` file with your actual credentials:
   ```bash
   MONGODB_URI=mongodb://mongodb:27017/webradio
   OVH_REGION=eu-west-par
   OVH_ACCESS_KEY_ID=your_actual_access_key
   OVH_SECRET_ACCESS_KEY=your_actual_secret_key
   OVH_BUCKET=your_actual_bucket_name
   PORT=3001
   ```

   **Note**: When using the Docker MongoDB service, set `MONGODB_URI=mongodb://mongodb:27017/webradio` (using the Docker service name `mongodb` as host).

2. **Build and start the services**:
   ```bash
   docker-compose up --build
   ```

3. **Access the application**:
   - Web Radio: http://localhost:3001
   - MongoDB: localhost:27017

## Available Commands

### Start services (detached mode)
```bash
docker-compose up -d
```

### Stop services
```bash
docker-compose down
```

### View logs
```bash
docker-compose logs -f webradio
docker-compose logs -f mongodb
```

### Rebuild after code changes
```bash
docker-compose build webradio
docker-compose up -d
```

### Development Mode

For development with live code reloading, uncomment the volume mounts in `docker-compose.yml`:

```yaml
volumes:
  - .:/app
  - /app/node_modules
  - /app/shared/node_modules
  - /app/apps/webradio/node_modules
  - /app/tools/node_modules
```

Then run:
```bash
docker-compose up
```

## Services

### Web Radio Application
- **Container**: `onsemetbien-webradio`
- **Port**: 3001
- **Built from**: Local Dockerfile
- **Dependencies**: MongoDB (waits for healthy status)

### MongoDB Database
- **Container**: `onsemetbien-mongodb`
- **Port**: 27017
- **Image**: mongo:7.0
- **Data persistence**: Named volume `mongodb_data`
- **Health check**: Pings MongoDB every 10 seconds

## Data Persistence

MongoDB data is stored in a named Docker volume (`mongodb_data`). This means your database data will persist even when containers are stopped or removed.

To remove all data (reset database):
```bash
docker-compose down -v
```

## Troubleshooting

### Port conflicts
If ports 3001 or 27017 are already in use, modify the port mappings in `docker-compose.yml`:
```yaml
ports:
  - "3002:3001"  # Change external port
```

### Environment variables not loading
Ensure your `.env` file is in the same directory as `docker-compose.yml` and contains all required variables. The `env_file` directive in docker-compose.yml automatically loads it.

### MongoDB connection issues
The application waits for MongoDB to be healthy before starting. Check MongoDB logs:
```bash
docker-compose logs mongodb
```

### Build issues
Clean build cache and rebuild:
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up
```

## Production Deployment

For production deployment:

1. Remove development volume mounts
2. Set appropriate restart policies
3. Use environment-specific `.env` files
4. Consider using an external MongoDB service (e.g., MongoDB Atlas)
5. Set up proper logging and monitoring

## Network Architecture

Services communicate through a custom Docker network (`webradio-network`). The application connects to MongoDB using the service name `mongodb` as the hostname.
