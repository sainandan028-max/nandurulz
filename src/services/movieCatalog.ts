/**
 * Movie catalog service
 * Orchestrates loading movies exclusively from the Google Drive folder
 * and applies local metadata overrides (like custom titles).
 */
import type { Movie, SortMode } from '../types/movie';
import { listDriveFolderVideos } from './drive';
import { getMetadataOverride } from './metadata';

const CACHE_KEY = 'familyMovies_catalogCache';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface CachedCatalog {
  movies: Movie[];
  timestamp: number;
}

function getCachedCatalog(): Movie[] | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const data: CachedCatalog = JSON.parse(cached);
    if (Date.now() - data.timestamp < CACHE_TTL) {
      return data.movies;
    }
  } catch {
    // Cache corrupted, ignore
  }
  return null;
}

function setCachedCatalog(movies: Movie[]): void {
  try {
    const data: CachedCatalog = { movies, timestamp: Date.now() };
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    // localStorage full or disabled
  }
}

export function clearCatalogCache(): void {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {
    // Ignore
  }
}

/**
 * Clean up filenames by removing common patterns and extensions to create a better default title.
 */
function cleanFilenameAsTitle(filename: string): string {
  let title = filename;
  
  // Remove file extension
  title = title.replace(/\.[^/.]+$/, '');
  
  // Replace dots, underscores with spaces
  title = title.replace(/[._]/g, ' ');
  
  // Try to remove common resolution/release tags (e.g., 1080p, 720p, bluray, x264, WEBRip)
  title = title.replace(/\b(1080p|720p|4k|2160p|bluray|x264|x265|hevc|webrip|web-dl|hdrip|brrip|dvdrip)\b/gi, '');
  
  // Try to extract year if present (e.g., Avatar 2009 -> Avatar)
  // We'll leave the year in the title for now unless we do more complex parsing, 
  // but let's clean up any trailing empty brackets/parentheses caused by the above
  title = title.replace(/\[\s*\]|\(\s*\)/g, '');
  
  // Clean up extra spaces
  return title.trim().replace(/\s+/g, ' ');
}

import appConfig from '../config/appConfig';
import { saveMetadataOverride } from './metadata';

async function fetchTmdbPoster(title: string): Promise<string | null> {
  if (!appConfig.tmdbApiKey) return null;
  
  try {
    // Extract year if present (e.g. "Champion (2025) Telugu" -> year = 2025)
    const yearMatch = title.match(/\((\d{4})\)/);
    const year = yearMatch ? yearMatch[1] : null;
    
    // Clean title for TMDB search
    // 1. Remove anything in parentheses or brackets
    let cleanQuery = title.replace(/\(.*?\)/g, '').replace(/\[.*?\]/g, '');
    // 2. Remove language tags
    cleanQuery = cleanQuery.replace(/\b(telugu|tamil|hindi|malayalam|kannada|english|bengali|marathi|gujarati|punjabi)\b/gi, '');
    // 3. Remove splitters and trim
    cleanQuery = cleanQuery.split('-')[0].trim();
    // 4. Remove extra spaces
    cleanQuery = cleanQuery.replace(/\s+/g, ' ');
    
    let url = `https://api.themoviedb.org/3/search/movie?api_key=${appConfig.tmdbApiKey}&query=${encodeURIComponent(cleanQuery)}&page=1`;
    // Add year for more accurate results
    if (year) {
      url += `&year=${year}`;
    }
    
    console.log(`[TMDB] Searching: query="${cleanQuery}" year=${year || 'any'}`);
    let response = await fetch(url);
    let data = await response.json();
    
    // If no results with year filter, try without year
    if ((!data.results || data.results.length === 0) && year) {
      console.log(`[TMDB] No results with year=${year}, retrying without year...`);
      url = `https://api.themoviedb.org/3/search/movie?api_key=${appConfig.tmdbApiKey}&query=${encodeURIComponent(cleanQuery)}&page=1`;
      response = await fetch(url);
      data = await response.json();
    }
    
    if (data.results && data.results.length > 0) {
      const posterPath = data.results[0].poster_path;
      if (posterPath) {
        return `https://image.tmdb.org/t/p/w600_and_h900_bestv2${posterPath}`;
      }
    }
  } catch {
    // Ignore errors
  }
  return null;
}

export async function loadMovies(forceRefresh = false): Promise<Movie[]> {
  if (!forceRefresh) {
    const cached = getCachedCatalog();
    if (cached) {
      // Even with cached data, check if any movies need TMDB posters
      if (appConfig.tmdbApiKey) {
        const needsPosters = cached.some(m => {
          const override = getMetadataOverride(m.id);
          return !override?.posterUrl;
        });
        if (needsPosters) {
          fetchMissingPosters(cached);
        }
      }
      return cached;
    }
  }

  // Always use Drive API to list files directly
  const driveFiles = await listDriveFolderVideos();
  
  const movies = driveFiles.map((file, index): Movie => {
    // Default title is the cleaned filename
    const defaultTitle = cleanFilenameAsTitle(file.name);
    
    // Check if the user has renamed it locally
    const override = getMetadataOverride(file.id);

    return {
      id: file.id,
      title: override?.title || defaultTitle,
      driveFileId: file.id,
      driveUrl: file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`,
      posterUrl: override?.posterUrl || file.thumbnailLink || '',
      description: override?.description || '',
      year: override?.year || '',
      category: override?.category || 'Uncategorized',
      visible: true,
      sortOrder: index + 1,
      mimeType: file.mimeType,
      modifiedTime: file.modifiedTime,
      size: file.size,
      thumbnailLink: file.thumbnailLink,
      resourceKey: file.resourceKey,
      webViewLink: file.webViewLink,
    };
  });

  setCachedCatalog(movies);

  // Fetch TMDB posters for movies that don't have a custom poster yet
  if (appConfig.tmdbApiKey) {
    fetchMissingPosters(movies);
  }
  return movies;
}

async function fetchMissingPosters(movies: Movie[]) {
  let updated = false;
  for (const movie of movies) {
    const override = getMetadataOverride(movie.id);
    if (!override?.posterUrl) {
      console.log(`[TMDB] Fetching poster for: "${movie.title}"`);
      const tmdbPoster = await fetchTmdbPoster(movie.title);
      if (tmdbPoster) {
        console.log(`[TMDB] Found poster for "${movie.title}":`, tmdbPoster);
        const all = JSON.parse(localStorage.getItem('familyMovies_metadataOverrides') || '{}');
        all[movie.id] = { ...all[movie.id], posterUrl: tmdbPoster };
        localStorage.setItem('familyMovies_metadataOverrides', JSON.stringify(all));
        updated = true;
      } else {
        console.log(`[TMDB] No poster found for "${movie.title}"`);
      }
    } else {
      console.log(`[TMDB] Skipping "${movie.title}" - already has poster`);
    }
  }
  if (updated) {
    console.log('[TMDB] Posters updated! Refreshing UI...');
    clearCatalogCache();
    window.dispatchEvent(new CustomEvent('posters-updated'));
  }
}

export function sortMovies(movies: Movie[], mode: SortMode): Movie[] {
  const sorted = [...movies];

  switch (mode) {
    case 'alphabetical':
      sorted.sort((a, b) => a.title.localeCompare(b.title));
      break;
    case 'recent':
      sorted.sort((a, b) => {
        const aTime = a.modifiedTime ? new Date(a.modifiedTime).getTime() : 0;
        const bTime = b.modifiedTime ? new Date(b.modifiedTime).getTime() : 0;
        return bTime - aTime; // newest first
      });
      break;
    case 'custom':
    default:
      sorted.sort((a, b) => a.sortOrder - b.sortOrder);
      break;
  }

  return sorted;
}

export function getCategories(movies: Movie[]): string[] {
  const cats = new Set<string>();
  movies.forEach((m) => {
    if (m.category && m.category !== 'Uncategorized') cats.add(m.category);
  });
  return ['All Movies', ...Array.from(cats).sort()];
}

export function filterByCategory(movies: Movie[], category: string): Movie[] {
  if (category === 'All Movies') return movies;
  return movies.filter((m) => m.category === category);
}

export function searchMovies(movies: Movie[], query: string): Movie[] {
  if (!query.trim()) return movies;
  const q = query.toLowerCase().trim();
  return movies.filter(
    (m) =>
      m.title.toLowerCase().includes(q) ||
      (m.year && m.year.toLowerCase().includes(q)) ||
      (m.category && m.category.toLowerCase().includes(q)) ||
      (m.description && m.description.toLowerCase().includes(q))
  );
}
