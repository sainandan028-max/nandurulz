import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { Movie } from '../types/movie';
import { getDrivePreviewUrl, getDriveViewUrl } from '../services/drive';
import { getProgress } from '../services/playback';
import { usePlaybackProgress } from '../hooks/usePlaybackProgress';
import PlayerControls from './PlayerControls';

interface VideoPlayerProps {
  movie: Movie;
  startFromBeginning?: boolean;
  onBack: () => void;
}

type PlayerMode = 'direct' | 'preview' | 'error';

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  movie,
  startFromBeginning = false,
  onBack,
}) => {
  const [playerMode, setPlayerMode] = useState<PlayerMode>('direct');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const hasSetInitialTime = useRef(false);

  // Playback progress tracking
  usePlaybackProgress({
    movieId: movie.driveFileId,
    videoRef,
    enabled: playerMode === 'direct',
  });

  // Build the direct URL using a streaming-compatible approach
  const getDirectStreamUrl = useCallback(() => {
    // Use the Google Drive direct download link
    return `https://drive.google.com/uc?export=download&id=${movie.driveFileId}`;
  }, [movie.driveFileId]);

  // Set initial time after video loads metadata
  useEffect(() => {
    const video = videoRef.current;
    if (!video || playerMode !== 'direct') return;

    const handleLoadedMetadata = () => {
      setIsLoading(false);
      if (!hasSetInitialTime.current) {
        hasSetInitialTime.current = true;
        if (!startFromBeginning) {
          const progress = getProgress(movie.driveFileId);
          if (progress && !progress.completed && progress.currentTime > 10) {
            video.currentTime = progress.currentTime;
          }
        }
        video.play().catch(() => {
          // Autoplay may be blocked
        });
      }
    };

    const handleError = () => {
      setIsLoading(false);
      setPlayerMode('error');
      setErrorMessage(
        'Direct playback is unavailable. This can happen due to browser restrictions, file format incompatibility, or Google Drive access limitations.'
      );
    };

    const handleCanPlay = () => {
      setIsLoading(false);
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('error', handleError);
    video.addEventListener('canplay', handleCanPlay);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('error', handleError);
      video.removeEventListener('canplay', handleCanPlay);
    };
  }, [movie.driveFileId, startFromBeginning, playerMode]);

  const handleRetry = () => {
    setPlayerMode('direct');
    setIsLoading(true);
    setErrorMessage('');
    hasSetInitialTime.current = false;
  };

  const handleOpenDrivePlayer = () => {
    setPlayerMode('preview');
    setIsLoading(true);
    setErrorMessage('');
  };

  const handleOpenInDrive = () => {
    const url = getDriveViewUrl(movie.driveFileId, movie.resourceKey);
    window.open(url, '_blank');
  };

  const previewUrl = getDrivePreviewUrl(movie.driveFileId, movie.resourceKey);

  return (
    <div className="player-container">
      {/* Direct HTML5 Video Player */}
      {playerMode === 'direct' && (
        <>
          {isLoading && (
            <div className="player-loading">
              <div className="loading-spinner large" />
              <p>Loading video...</p>
            </div>
          )}
          <video
            ref={videoRef}
            className="player-video"
            src={getDirectStreamUrl()}
            playsInline
            preload="metadata"
          />
          <PlayerControls
            videoRef={videoRef}
            onBack={onBack}
            title={movie.title}
          />
        </>
      )}

      {/* Google Drive Preview/Embedded Player */}
      {playerMode === 'preview' && (
        <>
          <div className="player-top-bar-standalone">
            <button
              className="player-btn player-back-btn"
              onClick={onBack}
              data-focusable="true"
              aria-label="Go back"
            >
              ← Back
            </button>
            <div className="player-title">{movie.title}</div>
            <button
              className="player-btn"
              onClick={handleOpenInDrive}
              data-focusable="true"
              aria-label="Open in Google Drive"
            >
              Open in Drive ↗
            </button>
          </div>
          {isLoading && (
            <div className="player-loading">
              <div className="loading-spinner large" />
              <p>Loading Drive player...</p>
            </div>
          )}
          <iframe
            className="player-iframe"
            src={previewUrl}
            title={`${movie.title} - Google Drive Player`}
            allow="autoplay; encrypted-media; fullscreen"
            allowFullScreen
            onLoad={() => setIsLoading(false)}
          />
          <div className="drive-player-notice">
            <p>
              Using Google Drive's built-in player. Custom controls are not available in this mode.
              Playback progress will not be saved automatically.
            </p>
          </div>
        </>
      )}

      {/* Error / Fallback State */}
      {playerMode === 'error' && (
        <div className="player-error">
          <button
            className="player-btn player-back-btn error-back"
            onClick={onBack}
            data-focusable="true"
            aria-label="Go back"
          >
            ← Back
          </button>
          <div className="player-error-content">
            <div className="player-error-icon">⚠️</div>
            <h2>Playback Unavailable</h2>
            <p className="player-error-message">{errorMessage}</p>
            <div className="player-error-actions">
              <button
                className="btn-primary btn-large"
                onClick={handleRetry}
                data-focusable="true"
              >
                🔄 Try Again
              </button>
              <button
                className="btn-secondary btn-large"
                onClick={handleOpenDrivePlayer}
                data-focusable="true"
              >
                ▶ Open Drive Player
              </button>
              <button
                className="btn-secondary btn-large"
                onClick={handleOpenInDrive}
                data-focusable="true"
              >
                ↗ Open in Google Drive
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
