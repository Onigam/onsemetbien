import React, { useState, useEffect } from 'react';
import { VolumeControl } from './VolumeControl';
import { TrackEditor } from './TrackEditor';
import { api } from '../../services/api';
import { useRenameTrack } from '../../hooks/useRenameTrack';
import { formatDateTime } from '../../utils/format';
import type { Track } from '../../types';
import './ExpandedTrackDetails.css';

interface ExpandedTrackDetailsProps {
  track: Track;
  onUpdate: () => void;
}

export const ExpandedTrackDetails: React.FC<ExpandedTrackDetailsProps> = ({
  track,
  onUpdate,
}) => {
  const [isUpdatingVisibility, setIsUpdatingVisibility] = useState(false);
  const [visibilityError, setVisibilityError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(track.title);

  const { rename, isSaving, error: renameError, clearError } =
    useRenameTrack(onUpdate);

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

  const handleRename = async () => {
    const ok = await rename(track._id, track.title, titleInput);
    if (ok) setIsEditingTitle(false);
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      void handleRename();
    }
    if (e.key === 'Escape') {
      setTitleInput(track.title);
      clearError();
      setIsEditingTitle(false);
    }
  };

  const handleVisibilityToggle = async () => {
    setIsUpdatingVisibility(true);
    setVisibilityError(null);
    try {
      await api.updateTrackVisibility(track._id, !track.hidden);
      onUpdate();
    } catch (error) {
      console.error('Failed to update track visibility:', error);
      setVisibilityError('Failed to update visibility');
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
            <label>Source URL</label>
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
            <label>File</label>
            <span>{track.url}</span>
          </div>
          <div className="info-item">
            <label>Created</label>
            <span>{formatDateTime(track.createdAt)}</span>
          </div>
        </div>

        <div className="track-controls-section">
          <h4>Controls</h4>
          <div className="control-group">
            <button
              onClick={handleVisibilityToggle}
              disabled={isUpdatingVisibility}
              className={`neo-btn ${
                track.hidden ? 'neo-btn--secondary' : 'neo-btn--danger'
              }`}
            >
              {isUpdatingVisibility
                ? 'Updating…'
                : track.hidden
                ? 'Show Track'
                : 'Hide Track'}
            </button>
          </div>
          {visibilityError && (
            <div className="neo-message neo-message--error inline-error">
              {visibilityError}
            </div>
          )}
          <div className="rename-group">
            <label className="rename-label">Rename</label>
            {isEditingTitle ? (
              <div className="rename-inline">
                <input
                  className="neo-input rename-input"
                  type="text"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  onKeyDown={handleRenameKeyDown}
                  disabled={isSaving}
                  autoFocus
                />
                <button
                  className="neo-btn neo-btn--secondary neo-btn--sm"
                  onClick={handleRename}
                  disabled={isSaving || !titleInput.trim()}
                >
                  {isSaving ? 'Saving…' : 'Save'}
                </button>
                <button
                  className="neo-btn neo-btn--ghost neo-btn--sm"
                  onClick={() => {
                    setTitleInput(track.title);
                    clearError();
                    setIsEditingTitle(false);
                  }}
                  disabled={isSaving}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                className="neo-btn neo-btn--accent neo-btn--sm"
                onClick={() => {
                  setTitleInput(track.title);
                  clearError();
                  setIsEditingTitle(true);
                }}
              >
                Edit title
              </button>
            )}
            {renameError && (
              <div className="neo-message neo-message--error inline-error">
                {renameError}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="audio-section">
        <h4>Audio Player</h4>
        {isLoadingAudio ? (
          <div className="neo-message neo-message--info loading-audio">
            Loading audio…
          </div>
        ) : audioUrl ? (
          <audio controls className="audio-player" key={audioUrl}>
            <source src={audioUrl} type="audio/mpeg" />
            Your browser does not support the audio element.
          </audio>
        ) : (
          <div className="neo-message neo-message--error audio-error">
            Failed to load audio
          </div>
        )}
      </div>

      <VolumeControl track={track} onUpdate={onUpdate} />

      <TrackEditor track={track} onUpdate={onUpdate} />
    </div>
  );
};
