import express, { Request, Response } from 'express';
import { TrackModel, Track } from '@onsemetbien/shared';
import { volumeService } from '../services/volumeService';

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
    await volumeService.adjustVolume(track, volume);

    res.json({ message: 'Volume adjusted successfully' });
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

export { router as tracksRouter };
