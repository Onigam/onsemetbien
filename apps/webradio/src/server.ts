import dotenv from 'dotenv';
// Load environment variables before other imports
dotenv.config();

import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import express from 'express';
import { createServer } from 'http';
import path from 'path';
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
let playedTracks: string[] = []; // Change to an array to keep track of last 20 played tracks by ID
let lastPlayedType: TrackType | null = null; // Keep track of last played type
let currentTrackStartTime: number = Date.now(); // Add this line to track when the current track started
let skipVotes = new Set<string>(); // Track votes to skip current track
let currentTrackTimeout: NodeJS.Timeout | null = null;

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

async function getNextTrack() {
  try {
    // Get all tracks except those already played (unless all tracks have been played)
    const unplayedTracksCount = await TrackModel.countDocuments({
      _id: { $nin: playedTracks },
      hidden: { $ne: true },
    });

    // Build the query
    const query: any = {
      _id: { $nin: playedTracks },
      hidden: { $ne: true },
    };

    // Don't play same type as last track if possible
    if (lastPlayedType) {
      // Check if we have any tracks of different type
      const differentTypeCount = await TrackModel.countDocuments({
        ...query,
        type: { $ne: lastPlayedType },
      });

      if (differentTypeCount > 0) {
        query.type = { $ne: lastPlayedType };
      }

      // Ensure the next track is a music if the last played type is not music
      if (lastPlayedType !== 'music') {
        const musicCount = await TrackModel.countDocuments({
          ...query,
          type: 'music',
        });

        if (musicCount > 0) {
          query.type = 'music';
        }
      }
    }

    // Get count of available tracks
    const count = await TrackModel.countDocuments(query);
    if (count === 0) {
      throw new Error('No tracks available to play');
    }

    // Get random track from filtered selection, explicitly selecting all fields
    const random = Math.floor(Math.random() * count);
    const track = await TrackModel.findOne(query)
      .select('title url duration type _id')
      .skip(random);

    if (!track) {
      throw new Error('Failed to get next track');
    }

    // Update tracking variables
    playedTracks.push(track._id.toString());
    if (playedTracks.length > 20) {
      playedTracks.shift(); // Remove the oldest track ID if we have more than 20
    }
    lastPlayedType = track.type as TrackType;

    console.log(`Selected track: ${track.title} (${track.type})`);
    console.log(`Track duration: ${track.duration} seconds`);
    console.log(`Played tracks count: ${playedTracks.length}`);
    console.log(`Last played type: ${lastPlayedType}`);

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

// Serve the Vite-built client in production, fall back to public/ for legacy
const clientDistPath = path.join(__dirname, '..', 'client');
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
