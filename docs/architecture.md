# On se met bien - System Architecture

## Overview

On se met bien is a real-time web radio streaming platform. The architecture prioritizes simplicity, real-time synchronization, and a fun retro user experience.

---

## System Architecture Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                      User Browser                            │
│  - Windows 95 player interface (public/index.html)           │
│  - HTML5 <audio> element for playback                        │
│  - Socket.IO client for real-time events                     │
└────────────────────────┬─────────────────────────────────────┘
                         │ WebSocket + HTTP
                         ▼
┌──────────────────────────────────────────────────────────────┐
│                  Express.js + Socket.IO Server                │
│                     (src/server.ts)                           │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  HTTP Routes                                           │  │
│  │  - GET /          → Static files (public/)             │  │
│  │  - GET /health    → Health check ("OK")                │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Socket.IO Events                                      │  │
│  │  Server → Client:                                      │  │
│  │    - trackChange (title, signedUrl, type, position)    │  │
│  │    - listenersUpdate (count)                           │  │
│  │    - skipVotesUpdate (votes, required)                 │  │
│  │  Client → Server:                                      │  │
│  │    - voteSkip                                          │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Track Scheduler                                       │  │
│  │  - Random selection with variety rules                 │  │
│  │  - Last 20 tracks excluded from rotation               │  │
│  │  - Music priority after non-music tracks               │  │
│  │  - Auto-advances via setTimeout(duration)              │  │
│  └────────────────────────────────────────────────────────┘  │
└────────────┬─────────────────────────┬───────────────────────┘
             │                         │
     ┌───────┴────────┐       ┌───────┴────────┐
     ▼                ▼       ▼                ▼
┌──────────────┐  ┌──────────────────────────────┐
│   MongoDB    │  │   OVH S3-Compatible Storage  │
│              │  │                              │
│  Collection: │  │  - Audio files (MP3)         │
│  tracks      │  │  - Presigned URLs (1hr TTL)  │
│  - title     │  │  - eu-west-par region        │
│  - url       │  │                              │
│  - duration  │  │                              │
│  - type      │  │                              │
│  - hidden    │  │                              │
│  - sourceUrl │  │                              │
└──────────────┘  └──────────────────────────────┘
```

---

## Data Flow: Track Playback

```
1. Server starts → connectToDatabase() → playNextTrack()

2. playNextTrack():
   ├─ Query MongoDB for unplayed, non-hidden tracks
   ├─ Apply variety rules (different type, music priority)
   ├─ Select random track from filtered set
   ├─ Generate presigned S3 URL (1-hour expiry)
   ├─ Emit 'trackChange' to all clients via Socket.IO
   ├─ Reset skip votes
   └─ Schedule next track via setTimeout(duration * 1000)

3. Client receives 'trackChange':
   ├─ Update now-playing display
   ├─ Set audio source to signed URL
   ├─ Set currentTime if joining mid-track
   └─ Auto-play if user has interacted

4. Skip voting:
   ├─ Client clicks skip → emit 'voteSkip'
   ├─ Server counts unique votes (by socket ID)
   ├─ Threshold: ceil(listeners * 0.5)
   └─ If threshold met → playNextTrack()
```

---

## Track Selection Algorithm

```
getNextTrack():
  1. Exclude last 20 played tracks (by _id)
  2. Exclude hidden tracks
  3. If last track was NOT music AND music tracks available:
     → Force next track to be music
  4. Else if tracks of different type available:
     → Prefer different type from last played
  5. Select random track from filtered results
  6. Update played tracks history
```

This ensures variety: listeners never hear the same track twice in 20 tracks, and music is prioritized to avoid back-to-back excerpts/sketches.

---

## Current Frontend Architecture (Pre-Refactor)

The frontend is a **single `index.html`** file containing:

| Section | Content |
|---------|---------|
| `<style>` | ~235 lines of CSS with Win95 theme variables |
| `<body>` | HTML structure (header, player, equalizer) |
| `<script>` | ~85 lines of JS (Socket.IO client, audio controls) |

### CSS Design Tokens (Custom Properties)

```css
--win95-grey: #c0c0c0;      /* Main background */
--win95-dark: #808080;       /* Border dark */
--win95-darker: #404040;     /* Border darker */
--win95-light: #ffffff;      /* Border light / highlights */
--win95-blue: #000080;       /* Title bars, headings */
--win95-text: #000000;       /* Body text */
--win95-orange: #ffa500;     /* Equalizer bars accent */
```

### UI Components (Currently in HTML)

1. **Header** - Logo + title + tagline
2. **Player Info Panel** - Now-playing display, listener count, skip vote
3. **Equalizer** - 5 animated bars with CSS keyframe animation
4. **Audio Player** - Native `<audio>` element with custom Win95 styling

---

## Infrastructure

### Deployment
- **Railway** for hosting (configured via `railway.json` + `Procfile`)
- **OVH S3** for audio file storage
- **MongoDB** (cloud) for track metadata

### Docker Support
- `Dockerfile` for containerized deployment
- `docker-compose.yml` for local development

### CI/CD
- GitHub Actions workflows in `.github/`
- Track contribution automation via YAML proposals

---

## Future Architecture (Post TypeScript Refactor)

The planned refactor will convert `public/index.html` into a proper TypeScript frontend while keeping the exact same visual design:

```
apps/webradio/
├── src/
│   ├── components/
│   │   ├── Header.ts          # Logo + title
│   │   ├── PlayerInfo.ts      # Now-playing panel
│   │   ├── Equalizer.ts       # Animated bars
│   │   ├── AudioPlayer.ts     # Audio controls
│   │   ├── SkipVote.ts        # Skip voting UI
│   │   └── ListenerCount.ts   # Listener display
│   ├── services/
│   │   ├── socket.ts          # Socket.IO client wrapper
│   │   └── audio.ts           # Audio playback manager
│   ├── styles/
│   │   ├── variables.css      # Win95 CSS custom properties
│   │   ├── win95.css          # Win95 base styles
│   │   └── components.css     # Component-specific styles
│   ├── types/
│   │   └── events.ts          # Socket.IO event types
│   └── main.ts                # Entry point
├── index.html                 # Minimal HTML shell
├── package.json
├── tsconfig.json
└── vite.config.ts             # Or similar bundler config
```

---

**Last Updated**: 2026-02-08
**Version**: 1.0
