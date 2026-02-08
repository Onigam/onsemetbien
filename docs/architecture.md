# On se met bien - System Architecture

## Overview

On se met bien is a real-time web radio streaming platform. The architecture prioritizes simplicity, real-time synchronization, and a fun neobrutalist user experience.

---

## System Architecture Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                      User Browser                            │
│  - Neobrutalist player interface (public/index.html)         │
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
| `<style>` | CSS with neobrutalist theme and custom audio player |
| `<body>` | HTML structure (header, player, equalizer, custom controls) |
| `<script>` | JavaScript (Socket.IO client, custom audio player controls) |

### Design System: Neobrutalism

The UI uses a colorful neobrutalist design with:
- **Light beige background** (`#e8e0d0`) as the page canvas
- **Thick black borders** (3-4px) on all panels and elements
- **Cyan panels** (`#00e5ff`) for the player info area
- **Purple accents** (`#c39bd3`) for the skip vote section
- **Orange/red buttons** for interactive elements (skip, play)
- **Green progress bar** for audio playback
- **Bold uppercase typography** for headings
- **Parrot mascot** with sunglasses as the radio logo
- **Flat, no-shadow** aesthetic with strong geometric shapes

### UI Components (Currently in HTML)

1. **Header** - Title (bold uppercase) + parrot logo + tagline
2. **Player Info Panel** - Cyan background with now-playing display, orange listener badge, purple skip vote area
3. **Equalizer** - 5 animated bars (dark green)
4. **Audio Player** - Fully custom-built player with red play button, green progress bar, orange volume slider, time display

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

The planned refactor will convert `public/index.html` into a proper TypeScript frontend while keeping the exact same neobrutalist visual design:

```
apps/webradio/
├── src/
│   ├── components/
│   │   ├── Header.ts          # Logo + title + tagline
│   │   ├── PlayerInfo.ts      # Now-playing panel (cyan)
│   │   ├── Equalizer.ts       # Animated bars
│   │   ├── AudioPlayer.ts     # Custom audio controls
│   │   ├── SkipVote.ts        # Skip voting UI (purple)
│   │   └── ListenerCount.ts   # Orange listener badge
│   ├── services/
│   │   ├── socket.ts          # Socket.IO client wrapper
│   │   └── audio.ts           # Audio playback manager
│   ├── styles/
│   │   ├── variables.css      # Neobrutalist CSS custom properties
│   │   ├── neobrutalist.css   # Base neobrutalist styles
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
