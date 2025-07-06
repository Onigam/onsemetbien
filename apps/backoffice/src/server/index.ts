import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { connectToDatabase } from '@onsemetbien/shared';
import { tracksRouter } from './routes/tracks.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});
const PORT = process.env.BACKOFFICE_PORT || 3002;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client')));

// Make io available to routes
app.set('io', io);

// API Routes
app.use('/api/tracks', tracksRouter);

// Serve React app for all other routes
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Start server
connectToDatabase().then(() => {
  httpServer.listen(PORT, () => {
    console.log(`Back office server running on port ${PORT}`);
  });
});
