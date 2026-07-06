import React, { useState } from 'react';
import { ExpandedTrackDetails } from './ExpandedTrackDetails';
import { getTypeColor } from '../../constants/trackTypes';
import { formatDate, formatDuration } from '../../utils/format';
import { useRenameTrack } from '../../hooks/useRenameTrack';
import type { Track } from '../../types';
import './TrackRow.css';

interface TrackRowProps {
  track: Track;
  onUpdate: () => void;
}

export const TrackRow: React.FC<TrackRowProps> = ({ track, onUpdate }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [titleInput, setTitleInput] = useState(track.title);
  const { rename, isSaving, error, clearError } = useRenameTrack(onUpdate);

  const startEditing = (e: React.MouseEvent) => {
    e.stopPropagation();
    clearError();
    setTitleInput(track.title);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setTitleInput(track.title);
    clearError();
    setIsEditing(false);
  };

  const saveTitle = async () => {
    const ok = await rename(track._id, track.title, titleInput);
    if (ok) setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      void saveTitle();
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      cancelEditing();
    }
  };

  return (
    <div className={`track-row ${isExpanded ? 'expanded' : ''}`}>
      <div
        className="track-row-main"
        onClick={() => !isEditing && setIsExpanded(!isExpanded)}
      >
        <div className="track-cell track-title">
          {isEditing ? (
            <div
              className="track-title-edit"
              onClick={(e) => e.stopPropagation()}
            >
              <input
                className="neo-input track-title-input"
                type="text"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isSaving}
                autoFocus
              />
              <button
                type="button"
                className="neo-btn neo-btn--secondary neo-btn--sm"
                onClick={(e) => {
                  e.stopPropagation();
                  void saveTitle();
                }}
                disabled={isSaving || !titleInput.trim()}
              >
                {isSaving ? 'Saving…' : 'Save'}
              </button>
              <button
                type="button"
                className="neo-btn neo-btn--ghost neo-btn--sm"
                onClick={(e) => {
                  e.stopPropagation();
                  cancelEditing();
                }}
                disabled={isSaving}
              >
                Cancel
              </button>
              {error && <span className="track-title-error">{error}</span>}
            </div>
          ) : (
            <>
              <div className="track-title-row">
                <span className="track-title-text">{track.title}</span>
                <button
                  type="button"
                  className="track-title-edit-btn"
                  title="Rename track"
                  aria-label="Rename track"
                  onClick={startEditing}
                >
                  ✎
                </button>
              </div>
              <div className="track-date">{formatDate(track.createdAt)}</div>
            </>
          )}
        </div>
        <div className="track-cell track-type">
          <span
            className="neo-badge track-type-badge"
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
            className={`neo-badge status-badge ${
              track.hidden ? 'hidden' : 'visible'
            }`}
          >
            {track.hidden ? 'Hidden' : 'Visible'}
          </span>
        </div>
        <div className="track-cell track-actions">
          <button
            className="expand-button"
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
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
