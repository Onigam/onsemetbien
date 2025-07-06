import ffmpeg from 'fluent-ffmpeg';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Track, StorageService, TrackModel } from '@onsemetbien/shared';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
// Load environment variables before other imports
dotenv.config();

const s3Client = new S3Client({
  region: process.env.OVH_REGION || 'eu-west-par',
  endpoint: `https://s3.${process.env.OVH_REGION}.io.cloud.ovh.net`,
  credentials: {
    accessKeyId: process.env.OVH_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.OVH_SECRET_ACCESS_KEY || '',
  },
  forcePathStyle: true,
});

let storageService: StorageService | null = null;

function getStorageService() {
  if (!storageService) {
    storageService = new StorageService();
  }
  return storageService;
}

class VolumeService {
  private tempDir = path.join(process.cwd(), 'temp');

  constructor() {
    // Ensure temp directory exists
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  async downloadFromS3(filename: string): Promise<string> {
    const tempFilePath = path.join(this.tempDir, `${uuidv4()}-${filename}`);

    const command = new GetObjectCommand({
      Bucket: process.env.OVH_BUCKET,
      Key: filename,
    });

    try {
      const response = await s3Client.send(command);
      const stream = response.Body as NodeJS.ReadableStream;
      const writeStream = fs.createWriteStream(tempFilePath);

      return new Promise((resolve, reject) => {
        stream.pipe(writeStream);
        writeStream.on('finish', () => resolve(tempFilePath));
        writeStream.on('error', reject);
      });
    } catch (error) {
      console.error('Error downloading from S3:', error);
      throw error;
    }
  }

  async getMetadata(track: Track): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        console.log('Getting metadata for:', track.url);
        const tempFilePath = await this.downloadFromS3(track.url);

        ffmpeg.ffprobe(tempFilePath, (err, metadata) => {
          // Clean up temp file
          fs.unlinkSync(tempFilePath);

          if (err) {
            reject(err);
            return;
          }

          const audioStream = metadata.streams.find(
            (s) => s.codec_type === 'audio'
          );
          resolve({
            duration: metadata.format.duration,
            bitrate: metadata.format.bit_rate,
            format: metadata.format.format_name,
            codec: audioStream?.codec_name,
            sampleRate: audioStream?.sample_rate,
            channels: audioStream?.channels,
          });
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  async adjustVolume(track: Track, volumeMultiplier: number): Promise<Track> {
    return new Promise(async (resolve, reject) => {
      try {
        const inputPath = await this.downloadFromS3(track.url);
        const newFileName = `${uuidv4()}.mp3`;
        const outputPath = path.join(this.tempDir, newFileName);

        ffmpeg(inputPath)
          .audioFilters(`volume=${volumeMultiplier}`)
          .output(outputPath)
          .on('end', async () => {
            try {
              // Upload the adjusted file back to S3
              const result = await getStorageService().uploadFile(
                outputPath,
                newFileName
              );
              console.log('Uploaded adjusted file to:', result);

              // Delete the original file
              await getStorageService().deleteFile(track.url);

              // Update the track with the new URL
              track.url = newFileName;
              await TrackModel.findByIdAndUpdate(track._id, track);

              // Clean up temp files
              fs.unlinkSync(inputPath);
              fs.unlinkSync(outputPath);

              resolve(track);
            } catch (uploadError) {
              console.error('Error uploading adjusted file:', uploadError);
              reject(uploadError);
            }
          })
          .on('error', (err) => {
            // Clean up temp files on error
            if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
            if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
            reject(err);
          })
          .run();
      } catch (error) {
        reject(error);
      }
    });
  }
}

export const volumeService = new VolumeService();
