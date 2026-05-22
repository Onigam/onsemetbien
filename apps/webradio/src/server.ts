import dotenv from 'dotenv';
import path from 'path';
// Load environment variables from the monorepo root .env file
dotenv.config({ path: path.resolve(__dirname, '..', '..', '..', '.env') });

import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { connectToDatabase, TrackModel, TrackType } from '@onsemetbien/shared';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

const s3Client = new S3Client({
  region: process.env.OVH_REGION || 'eu-west-par',
  endpoint: `https://s3.${process.env.OVH_REGION}.io.cloud.ovh.net`,
  credentials: {
    accessKeyId: process.env.OVH_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.OVH_SECRET_ACCESS_KEY || '',
  },
  forcePathStyle: true,
});

let currentTrack: any = null;
let listeners = 0;
let lastPlayedType: TrackType | null = null;
let lastPlayedTrackId: string | null = null;
let currentTrackStartTime: number = Date.now();
let skipVotes = new Set<string>();
let currentTrackTimeout: NodeJS.Timeout | null = null;

// Shuffled deck per track type. Each deck holds the remaining track IDs to play
// for that type. When a deck empties, it is reshuffled from the DB. This
// guarantees every track of a type plays once before any repeat.
const decks: Record<TrackType, string[]> = {
  music: [],
  excerpt: [],
  sketch: [],
  jingle: [],
};

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function refillDeck(type: TrackType): Promise<void> {
  const tracks = await TrackModel.find({ type, hidden: { $ne: true } })
    .select('_id')
    .lean();
  const ids = tracks.map((t) => t._id.toString());
  decks[type] = shuffle(ids);
  console.log(`Refilled ${type} deck with ${decks[type].length} tracks`);
}

async function drawFromDeck(type: TrackType): Promise<string | null> {
  if (decks[type].length === 0) {
    await refillDeck(type);
  }
  if (decks[type].length === 0) return null;

  // Avoid handing back the exact track that just played (only matters if the
  // deck just got refilled and the first card is the last track we played).
  let id = decks[type].shift()!;
  if (id === lastPlayedTrackId && decks[type].length > 0) {
    decks[type].push(id);
    id = decks[type].shift()!;
  }
  return id;
}

async function getSignedS3Url(key: string) {
  // Remove any full URL if it exists, we just want the filename
  const filename = key.split('/').pop() || key;

  console.log('Getting signed URL for:', filename);

  const command = new GetObjectCommand({
    Bucket: process.env.OVH_BUCKET,
    Key: filename,
  });

  // URL expires in 1 hour
  const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  console.log('Signed URL:', url);
  return url;
}

async function pickNextType(): Promise<TrackType | null> {
  // Prefer music after a non-music track; otherwise pick any type that isn't
  // the same as the last one. Falls back to whatever has tracks available.
  const typesWithTracks: TrackType[] = [];
  for (const type of ['music', 'excerpt', 'sketch', 'jingle'] as TrackType[]) {
    if (decks[type].length > 0) {
      typesWithTracks.push(type);
      continue;
    }
    const count = await TrackModel.countDocuments({ type, hidden: { $ne: true } });
    if (count > 0) typesWithTracks.push(type);
  }

  if (typesWithTracks.length === 0) return null;

  if (lastPlayedType && lastPlayedType !== 'music' && typesWithTracks.includes('music')) {
    return 'music';
  }

  const candidates = typesWithTracks.filter((t) => t !== lastPlayedType);
  const pool = candidates.length > 0 ? candidates : typesWithTracks;
  return pool[Math.floor(Math.random() * pool.length)];
}

async function getNextTrack() {
  try {
    const type = await pickNextType();
    if (!type) throw new Error('No tracks available to play');

    let id: string | null = null;
    // Try up to 2 times: deck may be stale (track deleted/hidden since shuffle).
    for (let attempt = 0; attempt < 2 && !id; attempt++) {
      const candidateId = await drawFromDeck(type);
      if (!candidateId) break;
      const exists = await TrackModel.exists({
        _id: candidateId,
        hidden: { $ne: true },
      });
      if (exists) {
        id = candidateId;
      } else {
        // Stale entry; force a refill next loop.
        decks[type] = [];
      }
    }

    if (!id) throw new Error(`No playable track in ${type} deck`);

    const track = await TrackModel.findById(id)
      .select('title url duration type _id')
      .lean();

    if (!track) throw new Error('Failed to load next track');

    lastPlayedType = track.type as TrackType;
    lastPlayedTrackId = track._id.toString();

    console.log(`Selected track: ${track.title} (${track.type})`);
    console.log(`Remaining in ${type} deck: ${decks[type].length}`);

    return track;
  } catch (error) {
    console.error('Error getting next track:', error);
    return null;
  }
}

/**
 * Play the next track
 *
 * This function gets the next track from the database and plays it.
 * It also pre-fetches the next track's URL a few seconds before the current track ends.
 */
async function playNextTrack() {
  const nextTrack = await getNextTrack();

  if (nextTrack) {
    // Clear any existing timeout to prevent multiple track changes
    if (currentTrackTimeout) {
      clearTimeout(currentTrackTimeout);
      currentTrackTimeout = null;
    }

    currentTrack = nextTrack;
    currentTrackStartTime = Date.now(); // Update the start time when playing a new track
    const signedUrl = await getSignedS3Url(currentTrack.url);
    skipVotes.clear(); // Reset votes when track changes

    // Debug logging for track duration
    console.log('Track details:', {
      title: currentTrack.title,
      duration: currentTrack.duration,
      type: currentTrack.type,
      id: currentTrack._id,
    });

    // Emit track change with reset vote count
    io.emit('trackChange', {
      title: currentTrack.title,
      url: signedUrl,
      type: currentTrack.type,
      startTime: currentTrackStartTime,
      skipVotes: 0, // Reset vote count
    });

    // Explicitly emit vote reset to all clients
    io.emit('skipVotesUpdate', {
      votes: 0,
      required: Math.ceil(listeners * 0.5),
    });

    console.log('Playing track:', currentTrack.title);
    console.log('Votes reset for new track');

    // Use the actual track duration from the database, with a fallback of 300 seconds
    const trackDuration = currentTrack.duration || 300;
    console.log(`Track duration: ${trackDuration} seconds`);
    console.log(`Next track scheduled in: ${trackDuration} seconds`);

    // Schedule next track after the actual duration
    currentTrackTimeout = setTimeout(playNextTrack, trackDuration * 1000);
  } else {
    console.log('No track available, retrying in 5 seconds...');
    currentTrackTimeout = setTimeout(playNextTrack, 5000);
  }
}

io.on('connection', async (socket) => {
  console.log('New client connected:', socket.id);
  listeners++;
  io.emit('listenersUpdate', listeners);
  console.log('Current listeners:', listeners);

  if (currentTrack) {
    const signedUrl = await getSignedS3Url(currentTrack.url);
    const currentPosition = (Date.now() - currentTrackStartTime) / 1000; // Calculate current position in seconds

    socket.emit('trackChange', {
      title: currentTrack.title,
      url: signedUrl,
      type: currentTrack.type,
      startTime: currentTrackStartTime,
      currentPosition: currentPosition,
      skipVotes: skipVotes.size,
    });
  }

  // Handle skip votes
  socket.on('voteSkip', () => {
    console.log('Received skip vote from:', socket.id);
    skipVotes.add(socket.id);
    const voteCount = skipVotes.size;
    const requiredVotes = Math.ceil(listeners * 0.5); // 50% of listeners required to skip

    console.log('Current votes:', voteCount, 'Required votes:', requiredVotes);

    io.emit('skipVotesUpdate', {
      votes: voteCount,
      required: requiredVotes,
    });

    // If enough votes are reached, skip to next track
    if (voteCount >= requiredVotes) {
      console.log('Skip threshold reached, playing next track...');
      skipVotes.clear(); // Reset votes
      playNextTrack();
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    listeners--;
    skipVotes.delete(socket.id); // Remove vote when user disconnects
    io.emit('listenersUpdate', listeners);
    io.emit('skipVotesUpdate', {
      votes: skipVotes.size,
      required: Math.ceil(listeners * 0.5),
    });
    console.log('Current listeners after disconnect:', listeners);
  });
});

// Serve the Vite-built client (dist/client/ when compiled, src/client/ in dev)
const clientDistPath = path.join(__dirname, 'client');
app.use(express.static(clientDistPath));
app.use(express.static('public'));

app.get('/health', (req, res) => {
  res.send('OK');
});

const PORT = process.env.PORT || 3001;

connectToDatabase().then(() => {
  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    playNextTrack();
  });
});
