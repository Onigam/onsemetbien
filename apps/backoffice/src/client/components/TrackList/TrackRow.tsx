import React, { useState } from 'react';
import { ExpandedTrackDetails } from './ExpandedTrackDetails';
import './TrackRow.css';

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

interface TrackRowProps {
  track: Track;
  onUpdate: () => void;
}

export const TrackRow: React.FC<TrackRowProps> = ({ track, onUpdate }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'Unknown';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'music':
        return '#007bff';
      case 'excerpt':
        return '#28a745';
      case 'sketch':
        return '#ffc107';
      case 'jingle':
        return '#dc3545';
      default:
        return '#6c757d';
    }
  };

  return (
    <div className={`track-row ${isExpanded ? 'expanded' : ''}`}>
      <div
        className="track-row-main"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="track-cell track-title">
          <div className="track-title-text">{track.title}</div>
          <div className="track-date">{formatDate(track.createdAt)}</div>
        </div>
        <div className="track-cell track-type">
          <span
            className="track-type-badge"
            style={{ backgroundColor: getTypeColor(track.type) }}
          >
            {track.type}
          </span>
        </div>
        <div className="track-cell track-duration">
          {formatDuration(track.duration)}
        </div>
        <div className="track-cell track-status">
          <span
            className={`status-badge ${track.hidden ? 'hidden' : 'visible'}`}
          >
            {track.hidden ? 'Hidden' : 'Visible'}
          </span>
        </div>
        <div className="track-cell track-actions">
          <button
            className="expand-button"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            {isExpanded ? '▼' : '▶'}
          </button>
        </div>
      </div>

      {isExpanded && <ExpandedTrackDetails track={track} onUpdate={onUpdate} />}
    </div>
  );
};
