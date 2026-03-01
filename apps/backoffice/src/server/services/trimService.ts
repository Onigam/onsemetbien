import ffmpeg from 'fluent-ffmpeg';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Track, StorageService, TrackModel } from '@onsemetbien/shared';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
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

class TrimService {
  private tempDir = path.join(process.cwd(), 'temp');

  constructor() {
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

  async getAudioDuration(filePath: string): Promise<number> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          reject(err);
          return;
        }
        const duration = metadata.format?.duration || 0;
        resolve(duration);
      });
    });
  }

  async trimTrack(
    track: Track,
    startTime: number,
    newDuration: number
  ): Promise<Track> {
    return new Promise(async (resolve, reject) => {
      try {
        const inputPath = await this.downloadFromS3(track.url);
        const fileDuration = await this.getAudioDuration(inputPath);

        if (startTime >= fileDuration) {
          fs.unlinkSync(inputPath);
          throw new Error(
            `Start time (${startTime}s) exceeds track duration (${fileDuration}s)`
          );
        }

        const endTime = startTime + newDuration;
        if (endTime > fileDuration) {
          fs.unlinkSync(inputPath);
          throw new Error(
            `End time (${endTime}s) exceeds track duration (${fileDuration}s)`
          );
        }

        const newFileName = `${uuidv4()}.mp3`;
        const outputPath = path.join(this.tempDir, newFileName);

        ffmpeg(inputPath)
          .setStartTime(startTime)
          .setDuration(newDuration)
          .outputOptions('-codec:a libmp3lame')
          .outputOptions('-b:a 128k')
          .on('end', async () => {
            try {
              const result = await getStorageService().uploadFile(
                outputPath,
                newFileName
              );
              console.log('Uploaded trimmed file to:', result);

              await getStorageService().deleteFile(track.url);

              track.url = newFileName;
              track.duration = newDuration;
              await TrackModel.findByIdAndUpdate(track._id, track);

              fs.unlinkSync(inputPath);
              fs.unlinkSync(outputPath);

              resolve(track);
            } catch (uploadError) {
              console.error('Error uploading trimmed file:', uploadError);
              if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
              if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
              reject(uploadError);
            }
          })
          .on('error', (err) => {
            console.error('FFmpeg error:', err);
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

  async previewCroppedTrack(
    track: Track,
    startTime: number,
    newDuration: number
  ): Promise<string> {
    try {
      const inputPath = await this.downloadFromS3(track.url);

      const previewFileName = `${uuidv4()}.mp3`;
      const outputPath = path.join(this.tempDir, previewFileName);

      return new Promise(async (resolve, reject) => {
        ffmpeg(inputPath)
          .setStartTime(startTime)
          .setDuration(newDuration)
          .outputOptions('-codec:a libmp3lame')
          .outputOptions('-b:a 128k')
          .on('end', async () => {
            try {
              const buffer = fs.readFileSync(outputPath);
              const tempUrl = `data:audio/mpeg;base64,${buffer.toString('base64')}`;
              fs.unlinkSync(outputPath);
              fs.unlinkSync(inputPath);
              resolve(tempUrl);
            } catch (error) {
              reject(error);
            }
          })
          .on('error', (err) => {
            if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
            reject(err);
          })
          .run();
      });
    } catch (error) {
      throw error;
    }
  }
}

export const trimService = new TrimService();
