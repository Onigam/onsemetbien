# Railway Deployment Configuration

This project now supports deploying both the webradio and backoffice applications to Railway through GitHub Actions.

## Services

### WebRadio Service
- **Configuration**: `railway.webradio.json`
- **Dockerfile**: `Dockerfile` (root level)
- **Port**: 3001
- **Start command**: `pnpm start:radio`

### Backoffice Service  
- **Configuration**: `railway.backoffice.json`
- **Dockerfile**: `apps/backoffice/Dockerfile`
- **Port**: 3002
- **Start command**: `pnpm start:backoffice`

## GitHub Actions Deployment

The deployment workflow (`.github/workflows/deploy.yml`) now includes two parallel jobs:

1. `deploy-webradio`: Deploys the webradio service
2. `deploy-backoffice`: Deploys the backoffice service

## Required Secrets

You need to configure the following GitHub repository secrets:

- `RAILWAY_TOKEN`: Your Railway API token
- `RAILWAY_PROJECT_ID`: Your Railway project ID
- `RAILWAY_WEBRADIO_SERVICE_NAME`: Service name for the webradio app
- `RAILWAY_BACKOFFICE_SERVICE_NAME`: Service name for the backoffice app

## Local Development

To run both services locally:

```bash
# Install dependencies
pnpm install

# Run webradio in development
pnpm dev:radio

# Run backoffice in development  
pnpm dev:backoffice
```

To build both services:

```bash
# Build all services
pnpm build

# Or build individually
pnpm --filter webradio build
pnpm --filter backoffice build
```