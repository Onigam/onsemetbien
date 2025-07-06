import React from 'react';
import { TrackRow } from './TrackRow';
import './TrackList.css';

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

interface TrackListProps {
  tracks: Track[];
  onTrackUpdate: () => void;
}

export const TrackList: React.FC<TrackListProps> = ({
  tracks,
  onTrackUpdate,
}) => {
  if (tracks.length === 0) {
    return (
      <div className="track-list-empty">
        <p>No tracks found.</p>
      </div>
    );
  }

  return (
    <div className="track-list">
      <div className="track-list-header">
        <div className="track-header-title">Title</div>
        <div className="track-header-type">Type</div>
        <div className="track-header-duration">Duration</div>
        <div className="track-header-status">Status</div>
        <div className="track-header-actions">Actions</div>
      </div>
      <div className="track-list-body">
        {tracks.map((track) => (
          <TrackRow key={track._id} track={track} onUpdate={onTrackUpdate} />
        ))}
      </div>
    </div>
  );
};
