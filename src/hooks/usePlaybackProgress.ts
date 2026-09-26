/**
 * Custom hook for managing video playback progress.
 * Saves progress every 10 seconds and on pause/stop.
 */
import { useEffect, useRef, useCallback } from 'react';
import { saveProgress, getProgress, formatTime } from '../services/playback';
import type { PlaybackProgress } from '../types/movie';

interface UsePlaybackProgressOptions {
  movieId: string;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  enabled?: boolean;
}

interface UsePlaybackProgressReturn {
  savedProgress: PlaybackProgress | null;
  resumePosition: number;
  formattedResumeTime: string;
  hasProgress: boolean;
  isCompleted: boolean;
}

export function usePlaybackProgress({
  movieId,
  videoRef,
  enabled = true,
}: UsePlaybackProgressOptions): UsePlaybackProgressReturn {
  const saveIntervalRef = useRef<number | null>(null);
  const savedProgressRef = useRef<PlaybackProgress | null>(null);

  // Load saved progress on mount
  const savedProgress = getProgress(movieId);
  savedProgressRef.current = savedProgress;

  const doSave = useCallback(() => {
    const video = videoRef.current;
    if (!video || !enabled || !movieId) return;
    if (video.currentTime > 0 && video.duration > 0) {
      saveProgress(movieId, video.currentTime, video.duration);
    }
  }, [movieId, videoRef, enabled]);

  useEffect(() => {
    if (!enabled || !movieId) return;

    const video = videoRef.current;
    if (!video) return;

    // Save every 10 seconds
    saveIntervalRef.current = window.setInterval(doSave, 10000);

    // Save on pause
    const handlePause = () => doSave();
    const handleEnded = () => doSave();
    const handleBeforeUnload = () => doSave();

    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
      }
      doSave(); // Save on unmount
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [movieId, videoRef, enabled, doSave]);

  const resumePosition = savedProgress?.completed
    ? 0
    : savedProgress?.currentTime || 0;

  return {
    savedProgress,
    resumePosition,
    formattedResumeTime: formatTime(resumePosition),
    hasProgress: !!savedProgress && !savedProgress.completed && savedProgress.currentTime > 10,
    isCompleted: savedProgress?.completed || false,
  };
}
