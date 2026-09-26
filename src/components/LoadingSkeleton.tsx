import React from 'react';

const LoadingSkeleton: React.FC = () => {
  return (
    <div className="loading-container" role="status" aria-label="Loading movies">
      <div className="loading-header">
        <div className="skeleton skeleton-title" />
      </div>
      <div className="skeleton-grid">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="skeleton-card" style={{ animationDelay: `${i * 100}ms` }}>
            <div className="skeleton skeleton-poster" />
            <div className="skeleton skeleton-text" />
            <div className="skeleton skeleton-text-short" />
          </div>
        ))}
      </div>
      <div className="loading-text">
        <div className="loading-spinner" />
        <span>Loading movies...</span>
      </div>
    </div>
  );
};

export default LoadingSkeleton;
