import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import youtubeDl from 'youtube-dl-exec';
import { MAX_DURATION } from '../common/track-type';
import { TrackModel } from '../models/Track';
import { TrackType } from '../types/Track';
import { StorageService } from './storage';

const DATA_DIR = path.join(process.cwd(), 'data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}

export class TrackService {
  private storageService: StorageService;

  constructor() {
    this.storageService = new StorageService();
  }

  private validateTrackDuration(trackType: TrackType, duration: number) {
    if (duration > MAX_DURATION[trackType]) {
      throw new Error(`Track duration is too long: ${duration} seconds`);
    }
  }

  /**
   * Downloads a YouTube video, converts it to MP3, and uploads it to cloud storage.
   * @param url The YouTube URL of the track.
   * @param trackType The type of the track (music, excerpt, sketch).
   * @param titleOverride Optional custom title for the track.
   * @returns The URL of the uploaded track.
   */
  async downloadAndUploadTrack(
    url: string,
    trackType: TrackType,
    titleOverride?: string
  ): Promise<string> {
    try {
      // Check if track already exists
      const existingTrack = await TrackModel.findOne({ sourceUrl: url });
      if (existingTrack) {
        throw new Error(
          'A track with this YouTube URL already exists in the database'
        );
      }

      console.log('Starting download...');

      // Get video info first
      const info = await youtubeDl(url, {
        dumpSingleJson: true,
        noCheckCertificates: true,
        noWarnings: true,
      });

      this.validateTrackDuration(trackType, info.duration);

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
      const cloudUrl = await this.storageService.uploadFile(filePath, fileName);

      // Save to MongoDB with track type
      await TrackModel.create({
        title: titleOverride || info.title,
        url: fileName,
        duration: info.duration,
        type: trackType,
        sourceUrl: url,
      });

      // Clean up local file
      fs.unlinkSync(filePath);

      return cloudUrl;
    } catch (error) {
      console.error('An error occurred:', error);
      throw error;
    }
  }
}
