# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**On se met bien** is a French web radio station streaming curated audio content (music, comedy excerpts, sketches) with a colorful neobrutalist design. It features real-time listening with Socket.IO, skip voting, and cloud-based audio storage on OVH S3.

**Key Technology**: Express.js, Socket.IO, TypeScript, MongoDB (Mongoose), AWS S3 (OVH), pnpm monorepo.

## Development Setup

### Prerequisites
- **Node.js 20+**
- **pnpm** (package manager - NOT npm or yarn)
- **MongoDB** running locally or via cloud
- **OVH S3** credentials for audio storage

### Initial Setup

```bash
pnpm install
cp .env.example .env
# Edit .env with your credentials
```

### Environment Variables

```bash
PORT=3001                        # Server port
MONGODB_URI=mongodb://localhost:27017/webradio
OVH_REGION=eu-west-par           # OVH cloud region
OVH_BUCKET=your-bucket           # S3 bucket name
OVH_ACCESS_KEY_ID=your-key       # S3 access key
OVH_SECRET_ACCESS_KEY=your-secret # S3 secret key
```

### Development Commands

```bash
# Start web radio dev server
pnpm dev:radio

# Start back office dev server
pnpm dev:backoffice

# Build all packages
pnpm build

# Download tracks
pnpm dl:music           # Download music tracks
pnpm dl:excerpt         # Download excerpt tracks
pnpm dl:sketch          # Download sketch tracks

# Search & upload
pnpm search:tracks      # Search YouTube for tracks
pnpm bulk:upload        # Batch upload tracks
```

## Architecture

### Monorepo Structure

This is a **pnpm monorepo** with workspace packages:

```
onsemetbien/
├── public/                    # Frontend static assets (index.html)
│   ├── index.html             # Main player interface (neobrutalist)
│   └── logo.png               # Radio logo
├── src/                       # Main server source
│   ├── server.ts              # Express + Socket.IO server
│   ├── config/database.ts     # MongoDB connection
│   ├── models/Track.ts        # Mongoose Track model
│   ├── types/Track.ts         # Track TypeScript types
│   ├── common/track-type.ts   # Shared track type constants
│   ├── services/              # Business logic
│   │   ├── storage.ts         # OVH S3 storage operations
│   │   └── trackService.ts    # Track management
│   ├── scripts/               # Utility scripts
│   │   ├── bulk-upload-tracks.ts
│   │   └── youtube-search-tracks.ts
│   └── index.ts               # YouTube downloader entry
├── apps/
│   ├── webradio/              # Web radio server package
│   └── backoffice/            # Management interface package
├── shared/                    # Shared types & models
├── tools/                     # CLI utilities (download, search, upload)
├── docs/                      # Documentation
│   └── prompts/               # Multi-agent orchestration prompts
├── .claude/
│   └── agents/                # Specialized AI agent definitions
├── tracks-proposals/          # Track contribution proposals (YAML)
└── docker-compose.yml         # Local development with Docker
```

### Core Data Model

**Track** (MongoDB via Mongoose):
```typescript
interface Track {
  _id?: string;
  title: string;       // Track display name
  url: string;         // Filename in OVH S3 bucket
  duration?: number;   // Duration in seconds
  type: TrackType;     // 'music' | 'excerpt' | 'sketch' | 'jingle'
  sourceUrl?: string;  // Original YouTube URL
  hidden?: boolean;    // Exclude from rotation
  createdAt: Date;
}
```

### Server Architecture

The server (`src/server.ts`) is an Express.js app with Socket.IO:

1. **Track Rotation**: Random selection with variety rules (no same type twice, music priority after non-music)
2. **S3 Signed URLs**: Generates 1-hour presigned URLs for audio streaming from OVH
3. **Skip Voting**: 50% of listeners required to skip a track
4. **Listener Tracking**: Real-time count via Socket.IO connections
5. **Track History**: Last 20 played tracks excluded from rotation

### Frontend Architecture

Currently a **single `index.html` file** in `public/` with:
- Inline CSS (neobrutalist theme)
- Inline JavaScript (Socket.IO client, audio player controls)
- Custom audio player with full controls
- Animated equalizer bars
- Skip vote UI

**Design System**:
- Neobrutalist aesthetic: thick black borders, bold colors, flat panels
- Color palette: light beige background (`#e8e0d0`), cyan panels (`#00e5ff`), purple accents (`#c39bd3`), orange/red buttons, green progress bars
- Bold sans-serif typography (uppercase headings)
- Parrot mascot with sunglasses as logo
- CSS variables for theming
- Custom-built audio player (play/pause, progress bar, volume, time display)

## Important Development Patterns

### TypeScript Usage
- **Strict mode enabled** in tsconfig.json
- Track types are shared between server and common via `src/common/track-type.ts`
- Mongoose models use TypeScript generics for type safety

### Socket.IO Events

**Server emits:**
- `trackChange` - New track info (title, signed URL, type, position)
- `listenersUpdate` - Current listener count
- `skipVotesUpdate` - Current votes and required threshold

**Client emits:**
- `voteSkip` - Client wants to skip current track

### Track Type System

Valid track types: `music`, `excerpt`, `sketch`, `jingle`
- **music**: Songs (max 6 minutes)
- **excerpt**: Audio excerpts (max 90 seconds)
- **sketch**: Comedy sketches (max 90 seconds)
- **jingle**: Radio jingles (max 20 seconds)

### Contributing Tracks

Tracks are proposed via YAML files in `tracks-proposals/` directory. See `CONTRIBUTING-ADDING-TRACKS.md`.

## Key Constraints

1. **Single page frontend**: Currently all in `public/index.html` (planned TypeScript refactor)
2. **OVH S3 storage**: Audio files stored on OVH S3-compatible cloud, NOT local filesystem
3. **MongoDB required**: All track metadata in MongoDB
4. **Real-time sync**: All listeners hear the same track at the same position
5. **No authentication**: Public radio, no user accounts

## Deployment

- **Platform**: Railway
- **Config**: `railway.json` and `Procfile`
- **Docker**: Available via `docker-compose.yml` and `Dockerfile`
- **Health check**: `GET /health` returns "OK"

## AI Agents

Specialized AI agent definitions are in `.claude/agents/`. See `docs/prompts/` for multi-agent orchestration strategies and implementation prompts.

### Available Agents
- **multi-agent-coordinator** - Overall orchestration
- **project-manager** - Task distribution & tracking
- **context-manager** - State management across agents
- **architect-reviewer** - Architecture validation
- **typescript-pro** - TypeScript & monorepo setup
- **backend-developer** - Server-side development
- **frontend-developer** - UI development
- **devops-engineer** - Infrastructure & deployment
- **deployment-engineer** - CI/CD & release management
- **ui-designer** - Design system & components
- **ux-researcher** - User experience research
- **research-analyst** - Research & analysis
- **search-specialist** - Code search & exploration
- **agent-organizer** - Agent team assembly & workflow

## Documentation

- `docs/README.md` - Documentation index
- `docs/architecture.md` - System architecture & data flows
- `docs/prompts/` - Multi-agent prompts for implementation
- `CONTRIBUTING-ADDING-TRACKS.md` - Track contribution guide
- `DOCKER.md` - Docker setup guide
- `README.md` - Project overview
