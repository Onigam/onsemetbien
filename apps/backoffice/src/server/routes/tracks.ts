import express, { Request, Response } from 'express';
import { TrackModel, Track, VALID_TRACK_TYPES } from '@onsemetbien/shared';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { volumeService } from '../services/volumeService';
import { YoutubeDownloadService } from '../services/youtubeDownloadService';
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

async function getSignedS3Url(key: string) {
  console.log('Getting signed URL for:', key);

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

const router = express.Router();

// GET /api/tracks - List tracks with pagination and search
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = (req.query.search as string) || '';
    const type = (req.query.type as string) || '';

    const skip = (page - 1) * limit;

    // Build query
    const query: any = {};
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }
    if (type) {
      query.type = type;
    }

    // Get tracks and total count
    const [tracks, total] = await Promise.all([
      TrackModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      TrackModel.countDocuments(query),
    ]);

    res.json({
      tracks,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching tracks:', error);
    res.status(500).json({ error: 'Failed to fetch tracks' });
  }
});

// GET /api/tracks/:id - Get single track details
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const track = await TrackModel.findById(req.params.id);
    if (!track) {
      return res.status(404).json({ error: 'Track not found' });
    }
    res.json(track);
  } catch (error) {
    console.error('Error fetching track:', error);
    res.status(500).json({ error: 'Failed to fetch track' });
  }
});

// PUT /api/tracks/:id/visibility - Toggle track visibility
router.put('/:id/visibility', async (req: Request, res: Response) => {
  try {
    const { hidden } = req.body;
    const track = await TrackModel.findByIdAndUpdate(
      req.params.id,
      { hidden },
      { new: true }
    );

    if (!track) {
      return res.status(404).json({ error: 'Track not found' });
    }

    res.json(track);
  } catch (error) {
    console.error('Error updating track visibility:', error);
    res.status(500).json({ error: 'Failed to update track visibility' });
  }
});

// PUT /api/tracks/:id/volume - Re-encode track with new volume
router.put('/:id/volume', async (req: Request, res: Response) => {
  try {
    const { volume } = req.body;

    if (!volume || volume < 0.5 || volume > 2.0) {
      return res.status(400).json({
        error: 'Volume must be between 0.5 and 2.0',
      });
    }

    const track = await TrackModel.findById(req.params.id);
    if (!track) {
      return res.status(404).json({ error: 'Track not found' });
    }

    // Process volume change
    const trackUpdated = await volumeService.adjustVolume(track, volume);

    res.json({ message: 'Volume adjusted successfully', track: trackUpdated });
  } catch (error) {
    console.error('Error adjusting volume:', error);
    res.status(500).json({ error: 'Failed to adjust volume' });
  }
});

// GET /api/tracks/:id/metadata - Get track metadata
router.get('/:id/metadata', async (req: Request, res: Response) => {
  try {
    const track = await TrackModel.findById(req.params.id);
    if (!track) {
      return res.status(404).json({ error: 'Track not found' });
    }

    const metadata = await volumeService.getMetadata(track);
    res.json(metadata);
  } catch (error) {
    console.error('Error getting metadata:', error);
    res.status(500).json({ error: 'Failed to get metadata' });
  }
});

// GET /api/tracks/:id/audio - Get signed URL for audio playback
router.get('/:id/audio', async (req: Request, res: Response) => {
  try {
    const track = await TrackModel.findById(req.params.id);
    if (!track) {
      return res.status(404).json({ error: 'Track not found' });
    }

    const signedUrl = await getSignedS3Url(track.url);
    res.json({ url: signedUrl });
  } catch (error) {
    console.error('Error getting audio URL:', error);
    res.status(500).json({ error: 'Failed to get audio URL' });
  }
});

// POST /api/tracks/download - Download track from YouTube
router.post('/download', async (req: Request, res: Response) => {
  try {
    const { url, type } = req.body;

    if (!url || !type) {
      return res.status(400).json({ error: 'URL and type are required' });
    }

    if (!VALID_TRACK_TYPES.includes(type)) {
      return res.status(400).json({
        error: `Invalid track type. Must be one of: ${VALID_TRACK_TYPES.join(
          ', '
        )}`,
      });
    }

    // Get Socket.IO instance from app
    const io = req.app.get('io');
    const downloadService = new YoutubeDownloadService();

    // Start download process
    const track = await downloadService.downloadTrack(url, type, (progress) => {
      // Emit progress to all connected clients
      io.emit('download-progress', progress);
    });

    res.json({ success: true, track });
  } catch (error) {
    console.error('Error downloading track:', error);
    res.status(500).json({
      error:
        error instanceof Error ? error.message : 'Failed to download track',
    });
  }
});

export { router as tracksRouter };
