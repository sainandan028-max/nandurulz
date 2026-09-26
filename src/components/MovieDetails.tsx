import React from 'react';
import type { Movie } from '../types/movie';
import { getProgress, formatTime, clearProgress } from '../services/playback';

interface MovieDetailsProps {
  movie: Movie;
  onPlay: (startFromBeginning?: boolean) => void;
  onBack: () => void;
}

const MovieDetails: React.FC<MovieDetailsProps> = ({ movie, onPlay, onBack }) => {
  const progress = getProgress(movie.driveFileId);
  const hasProgress = progress && !progress.completed && progress.currentTime > 10;

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    img.style.display = 'none';
    const fallback = img.parentElement?.querySelector('.detail-poster-fallback') as HTMLElement;
    if (fallback) fallback.style.display = 'flex';
  };

  return (
    <div className="movie-details">
      <button
        className="back-button"
        onClick={onBack}
        data-focusable="true"
        aria-label="Go back to library"
      >
        ← Back
      </button>

      <div className="details-content">
        <div className="details-poster-container">
          {movie.posterUrl ? (
            <img
              src={movie.posterUrl}
              alt={movie.title}
              className="details-poster"
              onError={handleImageError}
            />
          ) : null}
          <div
            className="detail-poster-fallback"
            style={{ display: movie.posterUrl ? 'none' : 'flex' }}
          >
            <div className="poster-fallback-icon">🎬</div>
            <div className="poster-fallback-title">{movie.title}</div>
          </div>
        </div>

        <div className="details-info">
          <h1 className="details-title">{movie.title}</h1>

          <div className="details-meta">
            {movie.year && <span className="details-year">{movie.year}</span>}
            {movie.category && movie.category !== 'Uncategorized' && (
              <>
                <span className="details-dot">•</span>
                <span className="details-category">{movie.category}</span>
              </>
            )}
          </div>

          {movie.description && (
            <p className="details-description">{movie.description}</p>
          )}

          <div className="details-actions">
            {hasProgress ? (
              <>
                <button
                  className="btn-primary btn-large"
                  onClick={() => onPlay(false)}
                  data-focusable="true"
                  aria-label={`Resume at ${formatTime(progress.currentTime)}`}
                >
                  ▶ Resume at {formatTime(progress.currentTime)}
                </button>
                <button
                  className="btn-secondary btn-large"
                  onClick={() => {
                    clearProgress(movie.driveFileId);
                    onPlay(true);
                  }}
                  data-focusable="true"
                  aria-label="Start from beginning"
                >
                  ↺ Start from Beginning
                </button>
              </>
            ) : (
              <button
                className="btn-primary btn-large"
                onClick={() => onPlay(true)}
                data-focusable="true"
                aria-label="Play movie"
              >
                ▶ Play
              </button>
            )}
          </div>

          {/* Video format notice */}
          <div className="details-notice">
            <p>
              Playback depends on your browser and device capabilities.
              If direct playback doesn't work, you'll be able to open the movie in Google Drive's player.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieDetails;
