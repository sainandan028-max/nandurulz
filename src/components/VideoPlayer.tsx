import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { Movie } from '../types/movie';
import { getDrivePreviewUrl, getDriveViewUrl } from '../services/drive';
import { getProgress } from '../services/playback';
import { usePlaybackProgress } from '../hooks/usePlaybackProgress';
import PlayerControls from './PlayerControls';
import appConfig from '../config/appConfig';

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
    // Use the Drive API alt=media endpoint to bypass the virus scan HTML page
    return `https://www.googleapis.com/drive/v3/files/${movie.driveFileId}?alt=media&key=${appConfig.googleApiKey}`;
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
      {isLoading && (
        <div className="player-loading">
          <div className="loading-spinner large" />
          <p>Loading video stream...</p>
        </div>
      )}
      {errorMessage && (
        <div className="player-error-toast" style={{
          position: 'absolute', top: 20, right: 20, background: 'rgba(255,0,0,0.8)', color: 'white', padding: '10px 20px', borderRadius: 8, zIndex: 9999
        }}>
          {errorMessage}
        </div>
      )}
      <video
        ref={videoRef}
        className="player-video"
        src={getDirectStreamUrl()}
        playsInline
        preload="metadata"
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
      />
      <PlayerControls
        videoRef={videoRef}
        onBack={onBack}
        title={movie.title}
      />
    </div>
  );
};

export default VideoPlayer;
