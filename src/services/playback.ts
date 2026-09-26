/**
 * Playback progress service
 * Stores and retrieves playback positions using localStorage.
 */
import type { PlaybackProgress } from '../types/movie';

const STORAGE_KEY = 'familyMovies_playbackProgress';
const COMPLETION_THRESHOLD = 0.95; // 95% = considered completed

/**
 * Get all saved playback progress entries.
 */
export function getAllProgress(): Record<string, PlaybackProgress> {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

/**
 * Get playback progress for a specific movie.
 */
export function getProgress(movieId: string): PlaybackProgress | null {
  const all = getAllProgress();
  return all[movieId] || null;
}

/**
 * Save playback progress for a specific movie.
 */
export function saveProgress(
  movieId: string,
  currentTime: number,
  duration: number
): void {
  try {
    const all = getAllProgress();
    const completed = duration > 0 && currentTime / duration >= COMPLETION_THRESHOLD;

    all[movieId] = {
      movieId,
      currentTime,
      duration,
      updatedAt: Date.now(),
      completed,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    // localStorage might be full or disabled
    console.warn('Could not save playback progress.');
  }
}

/**
 * Clear playback progress for a specific movie.
 */
export function clearProgress(movieId: string): void {
  try {
    const all = getAllProgress();
    delete all[movieId];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    console.warn('Could not clear playback progress.');
  }
}

/**
 * Format seconds into HH:MM:SS or MM:SS string.
 */
export function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds) || !isFinite(seconds)) return '0:00';

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Get movies that have saved progress (for "Continue Watching" section).
 */
export function getContinueWatching(): PlaybackProgress[] {
  const all = getAllProgress();
  return Object.values(all)
    .filter((p) => !p.completed && p.currentTime > 10) // At least 10s watched
    .sort((a, b) => b.updatedAt - a.updatedAt);
}
