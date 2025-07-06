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
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);

  useEffect(() => {
    const fetchAudioUrl = async () => {
      setIsLoadingAudio(true);
      try {
        const response = await fetch(`/api/tracks/${track._id}/audio`);
        if (response.ok) {
          const data = await response.json();
          setAudioUrl(data.url);
        } else {
          console.error('Failed to fetch audio URL');
        }
      } catch (error) {
        console.error('Error fetching audio URL:', error);
      } finally {
        setIsLoadingAudio(false);
      }
    };

    fetchAudioUrl();
  }, [track._id]);

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
        {isLoadingAudio ? (
          <div className="loading-audio">Loading audio...</div>
        ) : audioUrl ? (
          <audio controls className="audio-player" key={audioUrl}>
            <source src={audioUrl} type="audio/mpeg" />
            Your browser does not support the audio element.
          </audio>
        ) : (
          <div className="audio-error">Failed to load audio</div>
        )}
      </div>

      <VolumeControl track={track} onUpdate={onUpdate} />
    </div>
  );
};
