import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { create } from 'youtube-dl-exec';
import { TrackModel, StorageService, TrackType } from '@onsemetbien/shared';

// Configure youtube-dl-exec to use system yt-dlp
const youtubeDl = create('/opt/homebrew/bin/yt-dlp');

export interface DownloadProgress {
  step: string;
  message: string;
  progress?: number;
  error?: string;
}

export class YoutubeDownloadService {
  private storageService: StorageService;
  private dataDir: string;

  constructor() {
    this.storageService = new StorageService();
    this.dataDir = path.join(process.cwd(), 'data');

    // Create data directory if it doesn't exist
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  async downloadTrack(
    url: string,
    trackType: TrackType,
    onProgress: (progress: DownloadProgress) => void
  ): Promise<any> {
    try {
      onProgress({
        step: 'validation',
        message: 'Validating YouTube URL...',
        progress: 0,
      });

      // Check if track already exists
      const existingTrack = await TrackModel.findOne({ sourceUrl: url });
      if (existingTrack) {
        throw new Error(
          'A track with this YouTube URL already exists in the database'
        );
      }

      onProgress({
        step: 'info',
        message: 'Fetching video information...',
        progress: 10,
      });

      // Get video info first
      const info = await youtubeDl(url, {
        dumpSingleJson: true,
        noCheckCertificates: true,
        noWarnings: true,
      });

      if (!info || !info.title) {
        throw new Error(
          'Failed to fetch video information. Please check the YouTube URL.'
        );
      }

      onProgress({
        step: 'download',
        message: `Downloading "${info.title}"...`,
        progress: 20,
      });

      const fileName = `${uuidv4()}.mp3`;
      const filePath = path.join(this.dataDir, fileName);

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

      onProgress({
        step: 'upload',
        message: 'Uploading to cloud storage...',
        progress: 70,
      });

      // Upload to cloud storage
      await this.storageService.uploadFile(filePath, fileName);

      onProgress({
        step: 'database',
        message: 'Saving to database...',
        progress: 90,
      });

      // Save to MongoDB with track type
      const track = await TrackModel.create({
        title: info.title,
        url: fileName,
        duration: info.duration,
        type: trackType,
        sourceUrl: url,
      });

      // Clean up local file
      fs.unlinkSync(filePath);

      onProgress({
        step: 'complete',
        message: 'Track successfully added!',
        progress: 100,
      });

      return track;
    } catch (error) {
      onProgress({
        step: 'error',
        message:
          error instanceof Error ? error.message : 'An unknown error occurred',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
}
