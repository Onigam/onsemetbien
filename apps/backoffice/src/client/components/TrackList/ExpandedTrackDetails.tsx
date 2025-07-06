import React, { useState, useEffect } from 'react';
import { VolumeControl } from './VolumeControl';
import { api } from '../../services/api';
import './ExpandedTrackDetails.css';

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

interface ExpandedTrackDetailsProps {
  track: Track;
  onUpdate: () => void;
}

export const ExpandedTrackDetails: React.FC<ExpandedTrackDetailsProps> = ({
  track,
  onUpdate,
}) => {
  const [isUpdatingVisibility, setIsUpdatingVisibility] = useState(false);

  const handleVisibilityToggle = async () => {
    setIsUpdatingVisibility(true);
    try {
      await api.updateTrackVisibility(track._id, !track.hidden);
      onUpdate();
    } catch (error) {
      console.error('Failed to update track visibility:', error);
      alert('Failed to update track visibility');
    } finally {
      setIsUpdatingVisibility(false);
    }
  };

  const getAudioUrl = () => {
    // For now, we'll use a placeholder since we need signed URLs from the backend
    return `/api/tracks/${track._id}/audio`;
  };

  return (
    <div className="expanded-track-details">
      <div className="track-details-grid">
        <div className="track-info-section">
          <h4>Track Information</h4>
          <div className="info-item">
            <label>Source URL:</label>
            {track.sourceUrl ? (
              <a
                href={track.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="source-link"
              >
                {track.sourceUrl}
              </a>
            ) : (
              <span>Not available</span>
            )}
          </div>
          <div className="info-item">
            <label>File:</label>
            <span>{track.url}</span>
          </div>
          <div className="info-item">
            <label>Created:</label>
            <span>{new Date(track.createdAt).toLocaleString()}</span>
          </div>
        </div>

        <div className="track-controls-section">
          <h4>Controls</h4>
          <div className="control-group">
            <button
              onClick={handleVisibilityToggle}
              disabled={isUpdatingVisibility}
              className={`visibility-button ${track.hidden ? 'show' : 'hide'}`}
            >
              {isUpdatingVisibility
                ? 'Updating...'
                : track.hidden
                ? 'Show Track'
                : 'Hide Track'}
            </button>
          </div>
        </div>
      </div>

      <div className="audio-section">
        <h4>Audio Player</h4>
        <audio controls className="audio-player">
          <source src={getAudioUrl()} type="audio/mpeg" />
          Your browser does not support the audio element.
        </audio>
      </div>

      <VolumeControl track={track} onUpdate={onUpdate} />
    </div>
  );
};
