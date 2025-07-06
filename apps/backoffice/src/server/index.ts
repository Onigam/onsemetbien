import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectToDatabase } from '@onsemetbien/shared';
import { tracksRouter } from './routes/tracks.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.BACKOFFICE_PORT || 3002;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client')));

// API Routes
app.use('/api/tracks', tracksRouter);

// Serve React app for all other routes
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

// Start server
connectToDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Back office server running on port ${PORT}`);
  });
});
