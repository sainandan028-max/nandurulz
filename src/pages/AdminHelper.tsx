import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Movie } from '../types/movie';
import { loadMovies, clearCatalogCache } from '../services/movieCatalog';
import { saveMetadataOverride, MovieMetadataOverride } from '../services/metadata';

const AdminHelper: React.FC = () => {
  const navigate = useNavigate();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [editForm, setEditForm] = useState<MovieMetadataOverride>({
    title: '',
    posterUrl: '',
    category: '',
    year: ''
  });

  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    setLoading(true);
    try {
      const data = await loadMovies();
      setMovies(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshFromDrive = () => {
    clearCatalogCache();
    fetchMovies();
  };

  const startEdit = (movie: Movie) => {
    setEditingId(movie.driveFileId);
    setEditForm({
      title: movie.title,
      posterUrl: movie.posterUrl || '',
      category: movie.category === 'Uncategorized' ? '' : movie.category,
      year: movie.year || ''
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = (driveFileId: string) => {
    // Save to local storage
    saveMetadataOverride(driveFileId, editForm);
    
    // Update local state so it reflects immediately
    setMovies(prev => prev.map(m => {
      if (m.driveFileId === driveFileId) {
        return {
          ...m,
          title: editForm.title || m.title,
          posterUrl: editForm.posterUrl || m.posterUrl,
          category: editForm.category || 'Uncategorized',
          year: editForm.year || m.year
        };
      }
      return m;
    }));
    
    // Clear catalog cache so next time Home loads it uses new overrides
    clearCatalogCache();
    setEditingId(null);
  };

  return (
    <div className="admin-helper-page">
      <header className="admin-header">
        <button
          className="back-button"
          onClick={() => navigate('/')}
          aria-label="Back to library"
        >
          ← Back to Library
        </button>
        <h1 className="admin-title">Movie Management</h1>
        <p className="admin-subtitle">
          Rename movies and edit metadata. All changes are saved locally to your browser.
        </p>
      </header>

      <main className="admin-content" style={{ maxWidth: '1200px' }}>
        <div className="admin-notice">
          <h3>📂 Google Drive Integration</h3>
          <p>
            Movies are automatically loaded from your configured Google Drive folder. 
            If you just uploaded a new movie, click the button below to rescan the folder.
          </p>
          <div style={{ marginTop: '1rem' }}>
            <button className="btn-secondary" onClick={handleRefreshFromDrive}>
              🔄 Rescan Google Drive
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>Loading movies from Drive...</div>
        ) : (
          <div className="generated-section" style={{ overflowX: 'auto' }}>
            <table className="columns-table" style={{ minWidth: '800px' }}>
              <thead>
                <tr>
                  <th>Poster</th>
                  <th>Movie Title</th>
                  <th>Category</th>
                  <th>Year</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {movies.map(movie => {
                  const isEditing = editingId === movie.driveFileId;
                  
                  return (
                    <tr key={movie.driveFileId}>
                      <td style={{ width: '80px' }}>
                        {movie.posterUrl ? (
                          <img src={movie.posterUrl} alt="Poster" style={{ width: '50px', borderRadius: '4px' }} />
                        ) : (
                          <div style={{ width: '50px', height: '75px', background: '#2a1a4a', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#9a9ab8' }}>No Poster</div>
                        )}
                      </td>
                      
                      <td>
                        {isEditing ? (
                          <input 
                            type="text" 
                            style={{ width: '100%', padding: '8px', background: 'var(--bg-surface)', color: 'white', border: '1px solid var(--border-card)', borderRadius: '4px' }}
                            value={editForm.title} 
                            onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                            placeholder="Movie Title"
                          />
                        ) : (
                          <div style={{ fontWeight: 'bold' }}>{movie.title}</div>
                        )}
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>File: {movie.id}</div>
                      </td>
                      
                      <td>
                        {isEditing ? (
                          <input 
                            type="text" 
                            style={{ width: '100%', padding: '8px', background: 'var(--bg-surface)', color: 'white', border: '1px solid var(--border-card)', borderRadius: '4px' }}
                            value={editForm.category} 
                            onChange={(e) => setEditForm({...editForm, category: e.target.value})}
                            placeholder="e.g. Action"
                          />
                        ) : (
                          <span>{movie.category}</span>
                        )}
                      </td>
                      
                      <td>
                        {isEditing ? (
                          <input 
                            type="text" 
                            style={{ width: '80px', padding: '8px', background: 'var(--bg-surface)', color: 'white', border: '1px solid var(--border-card)', borderRadius: '4px' }}
                            value={editForm.year} 
                            onChange={(e) => setEditForm({...editForm, year: e.target.value})}
                            placeholder="2024"
                          />
                        ) : (
                          <span>{movie.year}</span>
                        )}
                      </td>
                      
                      <td>
                        {isEditing ? (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button className="btn-primary btn-small" onClick={() => saveEdit(movie.driveFileId)}>Save</button>
                            <button className="btn-secondary btn-small" onClick={cancelEdit}>Cancel</button>
                          </div>
                        ) : (
                          <button className="btn-secondary btn-small" onClick={() => startEdit(movie)}>Edit</button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {movies.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>
                      No movies found in this Drive folder.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminHelper;
