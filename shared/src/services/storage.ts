import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import fs from 'fs';

export class StorageService {
  private s3Client: S3Client;
  private bucket: string;

  constructor() {
    const ovhRegion = process.env.OVH_REGION || '';
    this.bucket = process.env.OVH_BUCKET || '';

    if (!this.bucket) {
      throw new Error('OVH_BUCKET environment variable is not set');
    }

    if (!ovhRegion) {
      throw new Error('OVH_REGION environment variable is not set');
    }

    if (!process.env.OVH_ACCESS_KEY_ID || !process.env.OVH_SECRET_ACCESS_KEY) {
      throw new Error('OVH credentials are not properly configured');
    }

    this.s3Client = new S3Client({
      endpoint: `https://s3.${ovhRegion}.io.cloud.ovh.net`,
      region: 'eu-west-par',
      credentials: {
        accessKeyId: process.env.OVH_ACCESS_KEY_ID,
        secretAccessKey: process.env.OVH_SECRET_ACCESS_KEY,
      },
      forcePathStyle: true,
    });
  }

  async deleteFile(fileName: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: fileName,
    });
    await this.s3Client.send(command);
  }

  async uploadFile(filePath: string, fileName: string): Promise<string> {
    if (!this.bucket) {
      throw new Error('Bucket name is not configured');
    }

    const fileStream = fs.createReadStream(filePath);

    try {
      const upload = new Upload({
        client: this.s3Client,
        params: {
          Bucket: this.bucket,
          Key: fileName,
          Body: fileStream,
          ContentType: 'audio/mpeg',
        },
      });

      await upload.done();
      return `https://s3.${process.env.OVH_REGION}.io.cloud.ovh.net/${this.bucket}/${fileName}`;
    } catch (error) {
      console.error('Upload error details:', {
        bucket: this.bucket,
        fileName,
        error,
      });
      throw error;
    } finally {
      fileStream.destroy();
    }
  }
}
