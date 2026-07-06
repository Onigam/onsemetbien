import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { TrackRow } from '../TrackList/TrackRow';
import { TRACK_TYPES, TrackTypeMeta } from '../../constants/trackTypes';
import type { Track } from '../../types';
import './AddTrackDialog.css';

interface DownloadProgress {
  step: string;
  message: string;
  progress?: number;
  error?: string;
}

interface AddTrackDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onTrackAdded: () => void;
}

// YouTube download supports everything except jingles.
const DOWNLOADABLE_TYPES = TRACK_TYPES.filter((t) => t !== 'jingle');

export const AddTrackDialog: React.FC<AddTrackDialogProps> = ({
  isOpen,
  onClose,
  onTrackAdded,
}) => {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [trackType, setTrackType] = useState('music');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<DownloadProgress | null>(null);
  const [completedTrack, setCompletedTrack] = useState<Track | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      // Connect to Socket.IO when dialog opens
      const newSocket = io();
      setSocket(newSocket);

      newSocket.on('download-progress', (progressData: DownloadProgress) => {
        setProgress(progressData);
        setLogs((prev) => [
          ...prev,
          `[${progressData.step}] ${progressData.message}`,
        ]);
      });

      return () => {
        newSocket.disconnect();
      };
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!youtubeUrl.trim()) {
      alert('Please enter a YouTube URL');
      return;
    }

    setIsProcessing(true);
    setProgress(null);
    setCompletedTrack(null);
    setLogs([]);

    try {
      const response = await fetch('/api/tracks/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: youtubeUrl.trim(),
          type: trackType,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setCompletedTrack(result.track);
        onTrackAdded();
      } else {
        throw new Error(result.error || 'Failed to download track');
      }
    } catch (error) {
      console.error('Error downloading track:', error);
      setLogs((prev) => [
        ...prev,
        `[ERROR] ${error instanceof Error ? error.message : 'Unknown error'}`,
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (socket) {
      socket.disconnect();
    }
    setYoutubeUrl('');
    setTrackType('music');
    setIsProcessing(false);
    setProgress(null);
    setCompletedTrack(null);
    setLogs([]);
    onClose();
  };

  const getProgressPercentage = () => {
    if (!progress?.progress) return 0;
    return progress.progress;
  };

  if (!isOpen) return null;

  return (
    <div className="dialog-overlay">
      <div className="dialog-content">
        <div className="dialog-header">
          <h2>Add New Track</h2>
          <button
            className="close-button"
            onClick={handleClose}
            disabled={isProcessing}
          >
            ×
          </button>
        </div>

        <div className="dialog-body">
          {!isProcessing && !completedTrack && (
            <form onSubmit={handleSubmit} className="add-track-form">
              <div className="form-group">
                <label htmlFor="youtube-url">YouTube URL</label>
                <input
                  id="youtube-url"
                  className="neo-input"
                  type="url"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="track-type">Track Type</label>
                <select
                  id="track-type"
                  className="neo-select"
                  value={trackType}
                  onChange={(e) => setTrackType(e.target.value)}
                >
                  {DOWNLOADABLE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {TrackTypeMeta[type].label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="neo-btn neo-btn--ghost"
                  onClick={handleClose}
                >
                  Cancel
                </button>
                <button type="submit" className="neo-btn neo-btn--primary">
                  Process Track
                </button>
              </div>
            </form>
          )}

          {isProcessing && (
            <div className="processing-section">
              <h3>Processing Track...</h3>

              {progress && (
                <div className="progress-section">
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${getProgressPercentage()}%` }}
                    />
                  </div>
                  <div className="progress-text">
                    {progress.message} ({getProgressPercentage()}%)
                  </div>
                </div>
              )}

              <div className="logs-section">
                <h4>Process Log:</h4>
                <div className="logs-container">
                  {logs.map((log, index) => (
                    <div key={index} className="log-entry">
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {completedTrack && (
            <div className="completed-section">
              <h3>Track Successfully Added!</h3>
              <div className="track-preview">
                <TrackRow track={completedTrack} onUpdate={onTrackAdded} />
              </div>
              <div className="form-actions">
                <button
                  onClick={handleClose}
                  className="neo-btn neo-btn--primary"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
