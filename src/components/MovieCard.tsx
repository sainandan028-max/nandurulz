import React from 'react';
import type { Movie } from '../types/movie';
import { getProgress, formatTime } from '../services/playback';

interface MovieCardProps {
  movie: Movie;
  onClick: (movie: Movie) => void;
  index: number;
}

const MovieCard: React.FC<MovieCardProps> = ({ movie, onClick, index }) => {
  const progress = getProgress(movie.driveFileId);
  const hasProgress = progress && !progress.completed && progress.currentTime > 10;
  const progressPercent =
    hasProgress && progress.duration > 0
      ? (progress.currentTime / progress.duration) * 100
      : 0;

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    img.style.display = 'none';
    const fallback = img.parentElement?.querySelector('.poster-fallback') as HTMLElement;
    if (fallback) fallback.style.display = 'flex';
  };

  return (
    <div
      className="movie-card"
      data-focusable="true"
      tabIndex={0}
      onClick={() => onClick(movie)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(movie);
        }
      }}
      role="button"
      aria-label={`${movie.title}${movie.year ? `, ${movie.year}` : ''}`}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="movie-card-poster">
        {movie.posterUrl ? (
          <img
            src={movie.posterUrl}
            alt={movie.title}
            loading="lazy"
            className="poster-image"
            onError={handleImageError}
          />
        ) : null}
        <div
          className="poster-fallback"
          style={{ display: movie.posterUrl ? 'none' : 'flex' }}
        >
          <div className="poster-fallback-icon">🎬</div>
          <div className="poster-fallback-title">{movie.title}</div>
        </div>

        {/* Progress bar */}
        {hasProgress && (
          <div className="card-progress-bar">
            <div
              className="card-progress-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}

        {/* Completed badge */}
        {progress?.completed && (
          <div className="card-completed-badge">✓</div>
        )}

        {/* Hover overlay */}
        <div className="card-overlay">
          <div className="card-play-icon">▶</div>
          {hasProgress && (
            <div className="card-resume-text">
              Resume {formatTime(progress.currentTime)}
            </div>
          )}
        </div>
      </div>

      <div className="movie-card-info">
        <h3 className="movie-card-title">{movie.title}</h3>
        <div className="movie-card-meta">
          {movie.year && <span className="movie-card-year">{movie.year}</span>}
          {movie.category && movie.category !== 'Uncategorized' && (
            <span className="movie-card-category">{movie.category}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MovieCard;
