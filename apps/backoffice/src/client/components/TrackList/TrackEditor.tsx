import React, { useState, useRef, useEffect } from 'react';
import { api } from '../../services/api';
import './TrackEditor.css';

interface Track {
  _id: string;
  title: string;
  duration?: number;
  type: string;
}

interface TrackEditorProps {
  track: Track;
  onUpdate: () => void;
}

const MAX_DURATIONS: Record<string, number> = {
  music: 360,
  excerpt: 90,
  sketch: 90,
  jingle: 20,
};

export const TrackEditor: React.FC<TrackEditorProps> = ({ track, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [trimDuration, setTrimDuration] = useState(track.duration || 0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const maxDuration = MAX_DURATIONS[track.type] || 360;

  useEffect(() => {
    const maxTrimDuration = track.duration || 0;
    if (trimDuration > maxTrimDuration) {
      setTrimDuration(maxTrimDuration);
    }

    if (startTime + trimDuration > (track.duration || 0)) {
      const newDuration = (track.duration || 0) - startTime;
      if (newDuration > 0) {
        setTrimDuration(newDuration);
      } else {
        setStartTime(0);
        setTrimDuration(track.duration || 0);
      }
    }
  }, [track.duration, track.type]);

  const handleApplyTrim = async () => {
    setError(null);
    setSuccessMessage(null);

    if (trimDuration <= 0) {
      setError('Duration must be greater than 0');
      return;
    }

    if (trimDuration > maxDuration) {
      setError(
        `Duration (${trimDuration}s) exceeds maximum for ${track.type} type (${maxDuration}s)`
      );
      return;
    }

    if (startTime + trimDuration > (track.duration || 0)) {
      setError(
        `End time (\${startTime + trimDuration}s) exceeds track duration (\${track.duration}s)`
      );
      return;
    }

    setIsProcessing(true);
    try {
      await api.trimTrack(track._id, startTime, trimDuration);
      setSuccessMessage('Track trimmed successfully!');
      onUpdate();
      setTimeout(() => {
        setIsEditing(false);
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to trim track'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePreview = async () => {
    try {
      const previewUrl = await api.previewTrimmedAudio(
        track._id,
        startTime,
        trimDuration
      );

      if (audioRef.current) {
        audioRef.current.src = previewUrl;
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          await playPromise;
          setIsPlayingPreview(true);
        }
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to generate preview'
      );
    }
  };

  const handleStopPreview = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      setIsPlayingPreview(false);
    }
  };

  const handleReset = () => {
    setStartTime(0);
    setTrimDuration(track.duration || 0);
    setError(null);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const endTime = startTime + trimDuration;
  const originalDuration = track.duration || 0;
  const savedTime = originalDuration - endTime;

  return (
    <div className="track-editor">
      {!isEditing ? (
        <button className="edit-btn" onClick={() => setIsEditing(true)}>
          Edit / Trim Track
        </button>
      ) : (
        <div className="editor-container">
          <h4>Trim / Crop Track</h4>

          {error && <div className="error-message">{error}</div>}
          {successMessage && <div className="success-message">{successMessage}</div>}

          <div className="editor-section">
            <div className="time-inputs">
              <div className="time-group">
                <label>Start Time:</label>
                <input
                  type="number"
                  value={startTime}
                  onChange={(e) =>
                    setStartTime(Math.max(0, parseFloat(e.target.value) || 0))
                  }
                  min={0}
                  max={originalDuration}
                  step="0.1"
                  disabled={isProcessing}
                />
                <span>s</span>
              </div>

              <div className="time-group">
                <label>Duration:</label>
                <input
                  type="number"
                  value={trimDuration}
                  onChange={(e) =>
                    setTrimDuration(
                      Math.max(
                        0,
                        Math.min(
                          (track.duration || 0) - startTime,
                          parseFloat(e.target.value) || 0
                        )
                      )
                    )
                  }
                  min={0.1}
                  max={originalDuration - startTime}
                  step="0.1"
                  disabled={isProcessing}
                />
                <span>s</span>
              </div>
            </div>

            <div className="duration-summary">
              <div className="duration-summary-item">
                <span className="label">Original:</span>
                <span className="value">{formatTime(originalDuration)}</span>
              </div>
              <div className="duration-summary-item">
                <span className="label">Trim Duration:</span>
                <span className="value">{formatTime(endTime)}</span>
              </div>
              <div className="duration-summary-item">
                <span className="label">Saved Time:</span>
                <span className="value">
                  {savedTime > 0 ? `+${formatTime(savedTime)}` : '0:00'}
                </span>
              </div>
            </div>
          </div>

          <div className="editor-section">
            <p className="preview-hint">
              Preview the trimmed portion before applying:
            </p>
            <audio
              ref={audioRef}
              onEnded={() => setIsPlayingPreview(false)}
              className="preview-audio"
            />
            <div className="preview-controls">
              <button
                className="preview-btn"
                onClick={handlePreview}
                disabled={isProcessing}
              >
                {isPlayingPreview ? 'Preview Playing...' : 'Preview'}
              </button>
              {isPlayingPreview && (
                <button className="stop-btn" onClick={handleStopPreview}>
                  Stop Preview
                </button>
              )}
            </div>
          </div>

          <div className="editor-actions">
            <button
              className="reset-btn"
              onClick={handleReset}
              disabled={isProcessing}
            >
              Reset
            </button>
            <button
              className="apply-btn"
              onClick={handleApplyTrim}
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Apply Trim'}
            </button>
            <button
              className="cancel-btn"
              onClick={() => {
                setIsEditing(false);
                setError(null);
                handleReset();
              }}
              disabled={isProcessing}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
