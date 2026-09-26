import React, { useState, useRef, useEffect } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  placeholder = 'Search movies...',
}) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      onSearch(query);
    }, 300);
    return () => clearTimeout(handler);
  }, [query, onSearch]);

  const handleClear = () => {
    setQuery('');
    onSearch('');
    inputRef.current?.focus();
  };

  return (
    <div className={`search-bar ${isFocused ? 'search-bar-focused' : ''}`}>
      <div className="search-icon" aria-hidden="true">
        🔍
      </div>
      <input
        ref={inputRef}
        type="text"
        className="search-input"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        aria-label="Search movies"
        data-focusable="true"
      />
      {query && (
        <button
          className="search-clear"
          onClick={handleClear}
          aria-label="Clear search"
          tabIndex={-1}
        >
          ✕
        </button>
      )}
    </div>
  );
};

export default SearchBar;
