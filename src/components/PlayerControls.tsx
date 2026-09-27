import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { ViewMode } from '../types/movie';
import { formatTime } from '../services/playback';
import { useRemoteNavigation } from '../hooks/useRemoteNavigation';

interface PlayerControlsProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  onBack: () => void;
  title: string;
}

const PlayerControls: React.FC<PlayerControlsProps> = ({ videoRef, onBack, title }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('fit');
  const hideTimerRef = useRef<number | null>(null);
  const controlsRef = useRef<HTMLDivElement>(null);

  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    if (isPlaying) {
      hideTimerRef.current = window.setTimeout(() => {
        setShowControls(false);
      }, 4000);
    }
  }, [isPlaying]);

  useRemoteNavigation({
    enabled: showControls,
    containerRef: controlsRef,
    onBack: () => {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        onBack();
      }
    }
  });

  // Sync with video element
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => { setIsPlaying(false); setShowControls(true); };
    const onTimeUpdate = () => setCurrentTime(video.currentTime);
    const onDurationChange = () => setDuration(video.duration);
    const onVolumeChange = () => {
      setVolume(video.volume);
      setIsMuted(video.muted);
    };
    const onEnded = () => { setIsPlaying(false); setShowControls(true); };

    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('durationchange', onDurationChange);
    video.addEventListener('volumechange', onVolumeChange);
    video.addEventListener('ended', onEnded);

    return () => {
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('durationchange', onDurationChange);
      video.removeEventListener('volumechange', onVolumeChange);
      video.removeEventListener('ended', onEnded);
    };
  }, [videoRef]);

  // Fullscreen change listener
  useEffect(() => {
    const onFSChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFSChange);
    return () => document.removeEventListener('fullscreenchange', onFSChange);
  }, []);

  // Mouse/touch/key activity listener
  useEffect(() => {
    const handleActivity = () => showControlsTemporarily();
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('touchstart', handleActivity);
    window.addEventListener('keydown', handleActivity);
    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      window.removeEventListener('keydown', handleActivity);
    };
  }, [showControlsTemporarily]);

  // Keyboard controls for player
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const video = videoRef.current;
      if (!video) return;

      // Don't handle if in an input
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT') return;

      switch (e.key) {
        case ' ':
        case 'Enter':
          if (!showControls) {
            e.preventDefault();
            if (video.paused) video.play();
            else video.pause();
          }
          // If controls are shown, useRemoteNavigation handles Enter
          break;
        case 'ArrowLeft':
          if (!showControls) {
            e.preventDefault();
            video.currentTime = Math.max(0, video.currentTime - 10);
            showControlsTemporarily();
          }
          break;
        case 'ArrowRight':
          if (!showControls) {
            e.preventDefault();
            video.currentTime = Math.min(video.duration, video.currentTime + 10);
            showControlsTemporarily();
          }
          break;
        case 'ArrowUp':
          if (!showControls) {
            e.preventDefault();
            showControlsTemporarily();
          }
          break;
        case 'ArrowDown':
          if (!showControls) {
            e.preventDefault();
            showControlsTemporarily();
          } else {
            e.preventDefault();
            setShowControls(false);
          }
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          toggleMute();
          break;
        case 'Escape':
        case 'Backspace':
          // useRemoteNavigation handles Backspace/Escape when controls are visible
          if (!showControls) {
            e.preventDefault();
            if (document.fullscreenElement) {
              document.exitFullscreen();
            } else {
              onBack();
            }
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [videoRef, onBack, showControlsTemporarily]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play();
    else video.pause();
  };

  const seek = (time: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = time;
  };

  const seekRelative = (delta: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + delta));
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
  };

  const changeVolume = (v: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = v;
    video.muted = v === 0;
  };

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        const playerContainer = videoRef.current?.closest('.player-container');
        if (playerContainer) {
          await playerContainer.requestFullscreen();
        }
      }
    } catch {
      console.warn('Fullscreen not supported');
    }
  };

  const toggleViewMode = () => {
    const video = videoRef.current;
    if (!video) return;
    const newMode = viewMode === 'fit' ? 'fill' : 'fit';
    setViewMode(newMode);
    video.style.objectFit = newMode === 'fit' ? 'contain' : 'cover';
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const bar = e.currentTarget;
    const rect = bar.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    seek(percent * duration);
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={controlsRef}
      className={`player-controls-overlay ${showControls ? 'visible' : 'hidden'}`}
      onClick={(e) => {
        // Click on the overlay (not on controls) toggles play
        if (e.target === e.currentTarget) {
          togglePlay();
        }
      }}
    >
      {/* Top bar */}
      <div className="player-top-bar">
        <button
          className="player-btn player-back-btn"
          onClick={onBack}
          aria-label="Go back"
          data-focusable="true"
        >
          ← Back
        </button>
        <div className="player-title">{title}</div>
      </div>

      {/* Center play button */}
      {!isPlaying && (
        <button
          className="player-center-play"
          onClick={togglePlay}
          aria-label="Play"
        >
          ▶
        </button>
      )}

      {/* Bottom controls */}
      <div className="player-bottom-bar">
        {/* Progress bar */}
        <div
          className="player-progress-bar"
          onClick={handleProgressClick}
          role="slider"
          aria-label="Video progress"
          aria-valuemin={0}
          aria-valuemax={duration}
          aria-valuenow={currentTime}
        >
          <div className="player-progress-track">
            <div
              className="player-progress-fill"
              style={{ width: `${progressPercent}%` }}
            />
            <div
              className="player-progress-handle"
              style={{ left: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="player-controls-row">
          {/* Left controls */}
          <div className="player-controls-left">
            <button
              className="player-btn"
              onClick={() => seekRelative(-10)}
              aria-label="Seek back 10 seconds"
              data-focusable="true"
            >
              ⏪ 10s
            </button>
            <button
              className="player-btn player-btn-play"
              onClick={togglePlay}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              data-focusable="true"
            >
              {isPlaying ? '❚❚' : '▶'}
            </button>
            <button
              className="player-btn"
              onClick={() => seekRelative(10)}
              aria-label="Seek forward 10 seconds"
              data-focusable="true"
            >
              10s ⏩
            </button>

            <div className="player-time">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>

          {/* Right controls */}
          <div className="player-controls-right">
            {/* Volume */}
            <div className="player-volume-group">
              <button
                className="player-btn"
                onClick={toggleMute}
                aria-label={isMuted ? 'Unmute' : 'Mute'}
                data-focusable="true"
              >
                {isMuted || volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}
              </button>
              <input
                type="range"
                className="player-volume-slider"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={(e) => changeVolume(parseFloat(e.target.value))}
                aria-label="Volume"
              />
            </div>

            {/* View mode */}
            <button
              className="player-btn"
              onClick={toggleViewMode}
              aria-label={viewMode === 'fit' ? 'Fill screen' : 'Fit screen'}
              data-focusable="true"
            >
              {viewMode === 'fit' ? 'FIT' : 'FILL'}
            </button>

            {/* Fullscreen */}
            <button
              className="player-btn"
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              data-focusable="true"
            >
              {isFullscreen ? '⛶' : '⛶'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerControls;
