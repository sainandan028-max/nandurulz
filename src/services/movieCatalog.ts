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

export async function loadMovies(forceRefresh = false): Promise<Movie[]> {
  if (!forceRefresh) {
    const cached = getCachedCatalog();
    if (cached) return cached;
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
  return movies;
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
