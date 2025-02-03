import fs from 'fs';
import yaml from 'js-yaml';
import mongoose from 'mongoose';
import { TrackService } from '../services/trackService';
import { TrackType } from '../types/Track';

async function processTracks(fileSuffix: string) {
  if (!fileSuffix) {
    throw new Error('File suffix is required');
  }

  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not set');
  }

  const trackListFile = `tracks-proposals/track-list-${fileSuffix}.yaml`;
  console.log(`Processing tracks from ${fileSuffix}`);

  let trackList: {
    tracks: Array<{
      source: string;
      type: TrackType;
      title_override?: string;
    }>;
  };

  try {
    const trackFile = fs.readFileSync(trackListFile, 'utf8');
    trackList = yaml.load(trackFile) as {
      tracks: Array<{
        source: string;
        type: TrackType;
        title_override?: string;
      }>;
    };
    console.log(`Track list: ${trackList}`);
  } catch (error: any) {
    throw new Error(`Failed to parse YAML file: ${error.message}`);
  }

  const trackService = new TrackService();

  await mongoose.connect(process.env.MONGODB_URI);

  for (const track of trackList.tracks) {
    try {
      console.log(`Processing track: ${track.source}`);
      console.log(`Track type: ${track.type}`);
      if (track.title_override) {
        console.log(`Track title override: ${track.title_override}`);
      }

      const cloudUrl = await trackService.downloadAndUploadTrack(
        track.source,
        track.type as TrackType,
        track.title_override
      );

      console.log(`Track ${cloudUrl} uploaded and saved successfully`);
    } catch (error: any) {
      console.error(`Error processing track: ${error.message}`);
    }
  }

  mongoose.disconnect();

  console.log('Tracks list processed successfully');
}

// The file suffix should come from the command line
const fileSuffix = process.argv[2];
processTracks(fileSuffix);
