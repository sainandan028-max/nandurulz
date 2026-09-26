import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import type { Movie } from '../types/movie';
import { loadMovies } from '../services/movieCatalog';
import MovieDetails from '../components/MovieDetails';
import VideoPlayer from '../components/VideoPlayer';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { useRemoteNavigation } from '../hooks/useRemoteNavigation';

const MoviePage: React.FC = () => {
  const { movieId } = useParams<{ movieId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [movie, setMovie] = useState<Movie | null>(
    (location.state as { movie?: Movie })?.movie || null
  );
  const [loading, setLoading] = useState(!movie);
  const [isPlaying, setIsPlaying] = useState(false);
  const [startFromBeginning, setStartFromBeginning] = useState(false);

  // Remote navigation (only when not playing)
  useRemoteNavigation({
    enabled: !isPlaying,
    onBack: () => {
      if (isPlaying) {
        setIsPlaying(false);
      } else {
        navigate('/');
      }
    },
  });

  // If movie not in state, fetch from catalog
  useEffect(() => {
    if (movie) return;

    const fetchMovie = async () => {
      try {
        setLoading(true);
        const movies = await loadMovies();
        const found = movies.find((m) => m.driveFileId === movieId);
        if (found) {
          setMovie(found);
        }
      } catch {
        // Error loading
      } finally {
        setLoading(false);
      }
    };

    fetchMovie();
  }, [movieId, movie]);

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (!movie) {
    return (
      <div className="error-container">
        <div className="error-content">
          <div className="error-icon">🎬</div>
          <h2>Movie not found</h2>
          <p>The movie you're looking for doesn't exist or has been removed.</p>
          <button
            className="btn-primary btn-large"
            onClick={() => navigate('/')}
            data-focusable="true"
          >
            ← Back to Library
          </button>
        </div>
      </div>
    );
  }

  if (isPlaying) {
    return (
      <VideoPlayer
        movie={movie}
        startFromBeginning={startFromBeginning}
        onBack={() => setIsPlaying(false)}
      />
    );
  }

  return (
    <MovieDetails
      movie={movie}
      onPlay={(fromBeginning) => {
        setStartFromBeginning(fromBeginning || false);
        setIsPlaying(true);
      }}
      onBack={() => navigate('/')}
    />
  );
};

export default MoviePage;
