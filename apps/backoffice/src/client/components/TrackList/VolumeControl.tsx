import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import './VolumeControl.css';

interface Track {
  _id: string;
  title: string;
  url: string;
  duration?: number;
  createdAt: string;
  type: string;
  sourceUrl?: string;
  hidden?: boolean;
}

interface TrackMetadata {
  duration: number;
  bitrate: number;
  format: string;
  codec: string;
  sampleRate: number;
  channels: number;
}

interface VolumeControlProps {
  track: Track;
  onUpdate: () => void;
}

export const VolumeControl: React.FC<VolumeControlProps> = ({
  track,
  onUpdate,
}) => {
  const [volume, setVolume] = useState(1.0);
  const [metadata, setMetadata] = useState<TrackMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMetadata();
  }, [track._id]);

  const loadMetadata = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getTrackMetadata(track._id);
      setMetadata(data);
    } catch (err) {
      setError('Failed to load metadata');
      console.error('Failed to load metadata:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(parseFloat(e.target.value));
  };

  const handleAdjustVolume = async () => {
    if (volume < 0.5 || volume > 2.0) {
      alert('Volume must be between 50% and 200%');
      return;
    }

    setIsAdjusting(true);
    setError(null);
    try {
      await api.adjustTrackVolume(track._id, volume);
      onUpdate();
      alert('Volume adjusted successfully!');
    } catch (err) {
      setError('Failed to adjust volume');
      console.error('Failed to adjust volume:', err);
      alert('Failed to adjust volume');
    } finally {
      setIsAdjusting(false);
    }
  };

  const getVolumePercentage = () => Math.round(volume * 100);

  return (
    <div className="volume-control">
      <h4>Volume Control</h4>

      {isLoading && <div className="loading">Loading metadata...</div>}

      {error && <div className="error">{error}</div>}

      {metadata && (
        <div className="metadata-info">
          <div className="metadata-grid">
            <div className="metadata-item">
              <label>Format:</label>
              <span>{metadata.format}</span>
            </div>
            <div className="metadata-item">
              <label>Codec:</label>
              <span>{metadata.codec}</span>
            </div>
            <div className="metadata-item">
              <label>Bitrate:</label>
              <span>
                {metadata.bitrate
                  ? `${Math.round(metadata.bitrate / 1000)} kbps`
                  : 'Unknown'}
              </span>
            </div>
            <div className="metadata-item">
              <label>Sample Rate:</label>
              <span>
                {metadata.sampleRate ? `${metadata.sampleRate} Hz` : 'Unknown'}
              </span>
            </div>
            <div className="metadata-item">
              <label>Channels:</label>
              <span>{metadata.channels || 'Unknown'}</span>
            </div>
          </div>
        </div>
      )}

      <div className="volume-adjustment">
        <div className="volume-slider-container">
          <label htmlFor="volume-slider">
            Volume: {getVolumePercentage()}%
          </label>
          <input
            id="volume-slider"
            type="range"
            min="0.5"
            max="2.0"
            step="0.1"
            value={volume}
            onChange={handleVolumeChange}
            className="volume-slider"
          />
          <div className="volume-labels">
            <span>50%</span>
            <span>100%</span>
            <span>200%</span>
          </div>
        </div>

        <button
          onClick={handleAdjustVolume}
          disabled={isAdjusting || volume === 1.0}
          className="adjust-button"
        >
          {isAdjusting ? 'Adjusting...' : 'Apply Volume Change'}
        </button>
      </div>
    </div>
  );
};
