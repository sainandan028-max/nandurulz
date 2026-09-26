import React from 'react';
import type { Movie } from '../types/movie';
import MovieCard from './MovieCard';

interface MovieGridProps {
  movies: Movie[];
  title: string;
  onMovieClick: (movie: Movie) => void;
  showEmpty?: boolean;
  emptyMessage?: string;
}

const MovieGrid: React.FC<MovieGridProps> = ({
  movies,
  title,
  onMovieClick,
  showEmpty = false,
  emptyMessage = 'No movies found',
}) => {
  if (movies.length === 0 && !showEmpty) return null;

  return (
    <section className="movie-section" aria-label={title}>
      <h2 className="section-title">{title}</h2>
      {movies.length === 0 ? (
        <p className="section-empty">{emptyMessage}</p>
      ) : (
        <div className="movie-grid">
          {movies.map((movie, index) => (
            <MovieCard
              key={movie.id || movie.driveFileId}
              movie={movie}
              onClick={onMovieClick}
              index={index}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default MovieGrid;
