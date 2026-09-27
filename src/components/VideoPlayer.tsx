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
  const [playerMode, setPlayerMode] = useState<'direct' | 'preview'>('direct');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [showStandaloneBar, setShowStandaloneBar] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hasSetInitialTime = useRef(false);
  const standaloneTimerRef = useRef<number | null>(null);

  // Auto-hide standalone bar
  const showStandaloneBarTemporarily = useCallback(() => {
    setShowStandaloneBar(true);
    if (standaloneTimerRef.current) clearTimeout(standaloneTimerRef.current);
    standaloneTimerRef.current = window.setTimeout(() => {
      setShowStandaloneBar(false);
    }, 4000);
  }, []);

  useEffect(() => {
    if (playerMode === 'preview') {
      showStandaloneBarTemporarily();
      const handleActivity = () => showStandaloneBarTemporarily();
      window.addEventListener('mousemove', handleActivity);
      window.addEventListener('touchstart', handleActivity);
      window.addEventListener('keydown', handleActivity);
      return () => {
        window.removeEventListener('mousemove', handleActivity);
        window.removeEventListener('touchstart', handleActivity);
        window.removeEventListener('keydown', handleActivity);
        if (standaloneTimerRef.current) clearTimeout(standaloneTimerRef.current);
      };
    }
  }, [playerMode, showStandaloneBarTemporarily]);

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
      setErrorMessage(
        'Direct playback is unavailable (likely an unsupported format like MKV on a PC browser). You can use the Drive Player instead.'
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

  const previewUrl = getDrivePreviewUrl(movie.driveFileId, movie.resourceKey);

  return (
    <div className="player-container">
      {playerMode === 'direct' ? (
        <>
          {isLoading && (
            <div className="player-loading">
              <div className="loading-spinner large" />
              <p>Loading video stream...</p>
            </div>
          )}
          {errorMessage && (
            <div className="player-error-toast" style={{
              position: 'absolute', top: 80, left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.9)', border: '1px solid #ff4444', color: 'white', padding: '20px', borderRadius: 8, zIndex: 9999, textAlign: 'center', maxWidth: 600
            }}>
              <p style={{ margin: '0 0 15px 0' }}>{errorMessage}</p>
              <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button 
                  className="btn-primary" 
                  onClick={() => setPlayerMode('preview')}
                  style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer' }}
                  data-focusable="true"
                >
                  ▶ Google Drive Player
                </button>
                <a
                  href={`intent://www.googleapis.com/drive/v3/files/${movie.driveFileId}?alt=media&key=${appConfig.googleApiKey}#Intent;package=org.videolan.vlc;scheme=https;type=video/*;end`}
                  className="btn-secondary"
                  style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '10px 20px', fontSize: '16px', cursor: 'pointer' }}
                  data-focusable="true"
                >
                  🟠 Open in VLC (TV/Mobile)
                </a>
              </div>
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
        </>
      ) : (
        <>
          <div 
            className="player-top-bar-standalone" 
            style={{ 
              position: 'absolute', top: 0, left: 0, right: 0, zIndex: 50, background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)', padding: '20px',
              opacity: showStandaloneBar ? 1 : 0,
              pointerEvents: showStandaloneBar ? 'auto' : 'none',
              transition: 'opacity 0.3s ease'
            }}
            onMouseEnter={showStandaloneBarTemporarily}
          >
            <button className="player-btn player-back-btn" onClick={onBack} data-focusable="true" style={{ fontSize: '18px' }}>← Back</button>
            <span style={{ color: 'white', marginLeft: 20, fontSize: '18px', fontWeight: 'bold' }}>{movie.title} (Drive Player)</span>
          </div>
          {/* Invisible trigger area at the top to catch mouse moves even if iframe steals focus */}
          <div 
            style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '40px', zIndex: 40 }}
            onMouseMove={showStandaloneBarTemporarily}
          />
          <iframe
            className="player-iframe"
            src={previewUrl}
            title={`${movie.title} - Google Drive Player`}
            allow="autoplay; encrypted-media; fullscreen"
            allowFullScreen
            tabIndex={0}
            ref={(el) => {
              if (el) {
                // Attempt to force focus onto the iframe for Silk browser
                setTimeout(() => el.focus(), 500);
              }
            }}
            onLoad={(e) => {
              setIsLoading(false);
              const target = e.target as HTMLIFrameElement;
              target.focus();
            }}
            style={{ width: '100%', height: '100%', border: 'none' }}
          />
        </>
      )}
    </div>
  );
};

export default VideoPlayer;
