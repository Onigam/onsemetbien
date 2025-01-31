import dotenv from 'dotenv';
// Load environment variables before other imports
dotenv.config();

import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { connectToDatabase } from './config/database';
import { TrackModel } from './models/Track';
import { TrackType } from './types/Track';

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
let playedTracks: Set<string> = new Set(); // Keep track of played tracks by ID
let lastPlayedType: TrackType | null = null; // Keep track of last played type

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
      _id: { $nin: Array.from(playedTracks) },
    });

    // If all tracks have been played, reset the played tracks list
    if (unplayedTracksCount === 0) {
      console.log('All tracks have been played, resetting play history...');
      playedTracks.clear();
    }

    // Build the query
    const query: any = {
      _id: { $nin: Array.from(playedTracks) },
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
    }

    // Get count of available tracks
    const count = await TrackModel.countDocuments(query);
    if (count === 0) {
      throw new Error('No tracks available to play');
    }

    // Get random track from filtered selection
    const random = Math.floor(Math.random() * count);
    const track = await TrackModel.findOne(query).skip(random);

    if (!track) {
      throw new Error('Failed to get next track');
    }

    // Update tracking variables
    playedTracks.add(track._id.toString());
    lastPlayedType = track.type as TrackType;

    console.log(`Selected track: ${track.title} (${track.type})`);
    console.log(`Played tracks count: ${playedTracks.size}`);
    console.log(`Last played type: ${lastPlayedType}`);

    return track;
  } catch (error) {
    console.error('Error getting next track:', error);
    return null;
  }
}

async function playNextTrack() {
  const nextTrack = await getNextTrack();

  if (nextTrack) {
    currentTrack = nextTrack;
    // Generate signed URL for the track
    const signedUrl = await getSignedS3Url(currentTrack.url);

    io.emit('trackChange', {
      title: currentTrack.title,
      url: signedUrl,
      type: currentTrack.type, // Add type to the emitted data
    });

    console.log('Playing track:', currentTrack.title);

    // Schedule next track
    setTimeout(playNextTrack, (currentTrack.duration || 300) * 1000);
  } else {
    // If we failed to get a track, try again in 5 seconds
    console.log('No track available, retrying in 5 seconds...');
    setTimeout(playNextTrack, 5000);
  }
}

io.on('connection', async (socket) => {
  listeners++;
  io.emit('listenersUpdate', listeners);

  if (currentTrack) {
    // Generate new signed URL for new connections
    const signedUrl = await getSignedS3Url(currentTrack.url);

    socket.emit('trackChange', {
      title: currentTrack.title,
      url: signedUrl,
      type: currentTrack.type, // Add type to the emitted data
    });
  }

  socket.on('disconnect', () => {
    listeners--;
    io.emit('listenersUpdate', listeners);
  });
});

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
