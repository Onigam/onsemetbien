# On se met bien - Back Office

A React-based administration interface for managing tracks in the "On se met bien" web radio system.

## Features

### Track Management

- **Paginated Track List**: View tracks with configurable pagination (20, 50, or 100 items per page)
- **Search & Filter**: Search tracks by name and filter by type (music, excerpt, sketch, jingle)
- **Expandable Details**: Click on any track to view detailed information

### Track Details & Controls

- **Source Information**: View original YouTube URL and file details
- **Audio Player**: Built-in MP3 player for previewing tracks
- **Visibility Toggle**: Hide/show tracks from the radio playlist
- **Volume Control**: Adjust track volume from 50% to 200% using ffmpeg re-encoding

### Volume Re-encoding

- **Metadata Display**: View audio format, codec, bitrate, sample rate, and channels
- **Visual Volume Slider**: Intuitive slider interface for volume adjustment
- **Real-time Processing**: Server-side ffmpeg processing with progress feedback

## Architecture

### Frontend (React SPA)

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and building
- **Styling**: CSS Modules with responsive design
- **State Management**: React hooks (useState, useEffect)
- **HTTP Client**: Axios for API communication

### Backend (Express API)

- **Framework**: Express.js with TypeScript
- **Audio Processing**: fluent-ffmpeg for volume adjustment
- **File Handling**: Temporary file management for processing
- **Cloud Storage**: Integration with OVH S3 for file operations

### Shared Dependencies

- **Database**: MongoDB via shared package
- **Types**: Shared TypeScript interfaces
- **Storage**: Shared S3 service for file operations

## Development

### Prerequisites

- Node.js 20+
- pnpm (workspace package manager)
- MongoDB database
- OVH S3 storage credentials
- ffmpeg installed on system

### Environment Variables

Create a `.env` file in the project root with:

```env
MONGODB_URI=your_mongodb_uri
OVH_REGION=your_ovh_region
OVH_BUCKET=your_bucket_name
OVH_ACCESS_KEY_ID=your_access_key
OVH_SECRET_ACCESS_KEY=your_secret_key
BACKOFFICE_PORT=3003
```

### Development Commands

```bash
# Install dependencies (from project root)
pnpm install

# Start development server (client + server)
pnpm dev:backoffice

# Start only the client (React dev server)
pnpm --filter backoffice dev:client

# Start only the server (Express API)
pnpm --filter backoffice dev:server

# Build for production
pnpm --filter backoffice build

# Start production server
pnpm --filter backoffice start
```

### Development Workflow

1. **Client Development**: The React app runs on `http://localhost:3002`
2. **Server Development**: The Express API runs on `http://localhost:3003`
3. **Proxy Setup**: Vite proxies `/api` requests to the Express server
4. **Hot Reload**: Both client and server support hot reloading during development

## API Endpoints

### Track Management

- `GET /api/tracks` - List tracks with pagination and search
- `GET /api/tracks/:id` - Get single track details
- `PUT /api/tracks/:id/visibility` - Toggle track visibility
- `PUT /api/tracks/:id/volume` - Adjust track volume
- `GET /api/tracks/:id/metadata` - Get track metadata

### Request/Response Examples

#### List Tracks

```bash
GET /api/tracks?page=1&limit=20&search=music&type=music
```

#### Adjust Volume

```bash
PUT /api/tracks/:id/volume
Content-Type: application/json

{
  "volume": 1.5
}
```

## Component Structure

```
src/client/
├── components/
│   ├── TrackList/
│   │   ├── TrackList.tsx          # Main track listing
│   │   ├── TrackRow.tsx           # Individual track row
│   │   ├── ExpandedTrackDetails.tsx # Detailed track view
│   │   └── VolumeControl.tsx      # Volume adjustment controls
│   ├── Search/
│   │   └── SearchFilter.tsx       # Search and filter controls
│   └── Pagination/
│       └── Pagination.tsx         # Pagination controls
├── pages/
│   └── Dashboard.tsx              # Main dashboard page
├── hooks/
│   └── useTrackList.ts           # Track data management hook
└── services/
    └── api.ts                    # API client service
```

## Styling

The application uses a minimalist design approach with:

- **Responsive Grid Layout**: Adapts to different screen sizes
- **Dark/Light Mode Support**: Automatic theme detection
- **Clean Typography**: Focus on readability and functionality
- **Accessible Controls**: Keyboard navigation and screen reader support

## Volume Processing

The volume adjustment feature uses ffmpeg to re-encode audio files:

1. **Download**: Fetch original file from S3 storage
2. **Process**: Apply volume filter using ffmpeg
3. **Upload**: Replace original file with processed version
4. **Cleanup**: Remove temporary files

### Volume Filter

```bash
ffmpeg -i input.mp3 -af "volume=1.5" output.mp3
```

## Production Deployment

### Build Process

```bash
# Build client and server
pnpm --filter backoffice build

# Files are output to:
# - dist/client/ (React build)
# - dist/server/ (Express build)
```

### Server Configuration

The production server serves both the API and the React app:

- API routes: `/api/*`
- Static files: React build served for all other routes
- Port: Configurable via `BACKOFFICE_PORT` environment variable

## Security Considerations

- **Input Validation**: All API inputs are validated
- **File Processing**: Temporary files are cleaned up after processing
- **Error Handling**: Graceful error handling with user feedback
- **CORS**: Configured for development and production environments

## Troubleshooting

### Common Issues

1. **ffmpeg not found**: Ensure ffmpeg is installed and in system PATH
2. **S3 connection errors**: Verify OVH credentials and bucket permissions
3. **MongoDB connection**: Check database URI and network connectivity
4. **Port conflicts**: Ensure ports 3002 and 3003 are available

### Debug Mode

Set `NODE_ENV=development` for detailed error logging and stack traces.
