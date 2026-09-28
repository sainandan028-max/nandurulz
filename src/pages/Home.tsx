import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Movie, SortMode } from '../types/movie';
import {
  loadMovies,
  sortMovies,
  getCategories,
  filterByCategory,
  searchMovies,
  clearCatalogCache,
} from '../services/movieCatalog';
import { getContinueWatching } from '../services/playback';
import MovieGrid from '../components/MovieGrid';
import SearchBar from '../components/SearchBar';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { useRemoteNavigation } from '../hooks/useRemoteNavigation';
import { useAuth } from '../contexts/AuthContext';
import appConfig from '../config/appConfig';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, login, logout } = useAuth();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Movies');
  const [sortMode, setSortMode] = useState<SortMode>('custom');

  // Remote navigation
  useRemoteNavigation({
    enabled: true,
    onBack: () => {
      // On home, back does nothing (don't leave the website)
    },
  });

  const fetchMovies = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);
      const data = await loadMovies(forceRefresh);
      setMovies(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load movies';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMovies();
  }, [fetchMovies]);

  const handleRefresh = () => {
    clearCatalogCache();
    fetchMovies(true);
  };

  const handleMovieClick = (movie: Movie) => {
    navigate(`/movie/${movie.driveFileId}`, { state: { movie } });
  };

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  // Process movies
  const categories = getCategories(movies);
  let displayMovies = searchQuery
    ? searchMovies(movies, searchQuery)
    : filterByCategory(movies, selectedCategory);
  displayMovies = sortMovies(displayMovies, sortMode);

  // Continue watching
  const continueWatchingProgress = getContinueWatching();
  const continueWatchingMovies = continueWatchingProgress
    .map((p) => movies.find((m) => m.driveFileId === p.movieId))
    .filter((m): m is Movie => !!m);

  // Recently added (last 5 by sort order or modified time)
  const recentMovies = sortMovies([...movies], 'recent').slice(0, 5);

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-content">
          <div className="error-icon">📡</div>
          <h2>Movie library couldn't be loaded</h2>
          <p className="error-message">{error}</p>
          <button
            className="btn-primary btn-large"
            onClick={handleRefresh}
            data-focusable="true"
          >
            🔄 Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="home-page">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <h1 className="app-title">{appConfig.siteName}</h1>
          <div className="header-actions">
            <SearchBar onSearch={handleSearch} />
            {isAuthenticated ? (
              <button
                className="btn-secondary"
                onClick={logout}
                data-focusable="true"
                style={{ padding: '8px 12px', fontSize: '14px', whiteSpace: 'nowrap' }}
              >
                Sign Out
              </button>
            ) : (
              <button
                className="btn-primary"
                onClick={login}
                data-focusable="true"
                style={{ background: '#4285f4', border: 'none', padding: '8px 12px', fontSize: '14px', whiteSpace: 'nowrap' }}
              >
                Sign in with Google
              </button>
            )}
            <a
              href="nandurulz.apk"
              className="btn-secondary"
              style={{ textDecoration: 'none', padding: '8px 12px', fontSize: '14px', whiteSpace: 'nowrap' }}
              data-focusable="true"
              download="nandurulz.apk"
            >
              📺 Download TV App
            </a>
            <button
              className="btn-icon refresh-btn"
              onClick={handleRefresh}
              aria-label="Refresh library"
              data-focusable="true"
              title="Refresh Library"
            >
              ⟳
            </button>
          </div>
        </div>
      </header>

      <main className="main-content">
        {/* Category / Sort bar */}
        {!searchQuery && (
          <div className="filter-bar">
            <div className="category-tabs" role="tablist" aria-label="Movie categories">
              {categories.map((cat) => (
                <button
                  key={cat}
                  className={`category-tab ${selectedCategory === cat ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                  role="tab"
                  aria-selected={selectedCategory === cat}
                  data-focusable="true"
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="sort-controls">
              <select
                className="sort-select"
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as SortMode)}
                aria-label="Sort movies"
                data-focusable="true"
              >
                <option value="custom">Custom Order</option>
                <option value="alphabetical">A–Z</option>
                <option value="recent">Recently Added</option>
              </select>
            </div>
          </div>
        )}

        {/* Search results */}
        {searchQuery ? (
          <MovieGrid
            movies={displayMovies}
            title={`Search: "${searchQuery}"`}
            onMovieClick={handleMovieClick}
            showEmpty={true}
            emptyMessage="No movies match your search"
          />
        ) : (
          <>
            {/* Continue Watching */}
            {continueWatchingMovies.length > 0 && selectedCategory === 'All Movies' && (
              <MovieGrid
                movies={continueWatchingMovies}
                title="Continue Watching"
                onMovieClick={handleMovieClick}
              />
            )}

            {/* Recently Added */}
            {recentMovies.length > 0 && selectedCategory === 'All Movies' && (
              <MovieGrid
                movies={recentMovies}
                title="Recently Added"
                onMovieClick={handleMovieClick}
              />
            )}

            {/* All Movies / Category */}
            <MovieGrid
              movies={displayMovies}
              title={selectedCategory}
              onMovieClick={handleMovieClick}
              showEmpty={true}
              emptyMessage="No movies in this category"
            />
          </>
        )}
      </main>

      {/* Footer - minimal */}
      <footer className="app-footer">
        <p>
          {appConfig.siteName} • Powered by Google Drive
        </p>
      </footer>
    </div>
  );
};

export default Home;
