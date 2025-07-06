import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import fs from 'fs';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import youtubeDl from 'youtube-dl-exec';
import {
  VALID_TRACK_TYPES,
  connectToDatabase,
  TrackModel,
  StorageService,
  TrackType,
} from '@onsemetbien/shared';

// Create data directory if it doesn't exist
const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}

const storageService = new StorageService();

function isValidTrackType(type: string): type is TrackType {
  return VALID_TRACK_TYPES.includes(type as TrackType);
}

async function downloadYoutubeVideo(url: string, trackType: string) {
  if (!url) {
    console.error('Please provide a YouTube URL');
    process.exit(1);
  }

  if (!isValidTrackType(trackType)) {
    console.error(
      `Invalid track type. Must be one of: ${VALID_TRACK_TYPES.join(', ')}`
    );
    process.exit(1);
  }

  try {
    // Check if track already exists
    const existingTrack = await TrackModel.findOne({ sourceUrl: url });
    if (existingTrack) {
      console.error(
        'A track with this YouTube URL already exists in the database'
      );
      await mongoose.connection.close();
      process.exit(1);
    }

    console.log('Starting download...');

    // Get video info first
    const info = await youtubeDl(url, {
      dumpSingleJson: true,
      noCheckCertificates: true,
      noWarnings: true,
    });

    const fileName = `${uuidv4()}.mp3`;
    const filePath = path.join(DATA_DIR, fileName);

    // Download and convert to MP3
    await youtubeDl(url, {
      extractAudio: true,
      audioFormat: 'mp3',
      output: filePath,
      noCheckCertificates: true,
      noWarnings: true,
      preferFreeFormats: true,
      addHeader: ['referer:youtube.com', 'user-agent:Mozilla/5.0'],
    });

    console.log('Download completed, uploading to cloud storage...');

    // Upload to cloud storage
    const cloudUrl = await storageService.uploadFile(filePath, fileName);

    // Save to MongoDB with track type
    await TrackModel.create({
      title: info.title,
      url: fileName,
      duration: info.duration,
      type: trackType,
      sourceUrl: url,
    });

    // Clean up local file
    fs.unlinkSync(filePath);

    console.log('Process completed successfully!');
    console.log(`Track type: ${trackType}`);

    // Close MongoDB connection and exit
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('An error occurred:', error);
    // Make sure to close the connection even on error
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Connect to database and start the download
connectToDatabase().then(() => {
  const trackType = process.argv[2];
  const youtubeUrl = process.argv[3];

  if (!trackType) {
    console.error(
      `Please provide a track type as the first argument. Valid types are: ${VALID_TRACK_TYPES.join(
        ', '
      )}`
    );
    process.exit(1);
  }

  if (!youtubeUrl) {
    console.error('Please provide a YouTube URL as the second argument');
    process.exit(1);
  }

  downloadYoutubeVideo(youtubeUrl, trackType);
});
