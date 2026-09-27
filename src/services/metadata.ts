import { clearCatalogCache } from './movieCatalog';

export interface MovieMetadataOverride {
  title?: string;
  posterUrl?: string;
  category?: string;
  year?: string;
  description?: string;
}

const STORAGE_KEY = 'familyMovies_metadataOverrides';

export function getAllMetadataOverrides(): Record<string, MovieMetadataOverride> {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

export function getMetadataOverride(movieId: string): MovieMetadataOverride | null {
  const all = getAllMetadataOverrides();
  return all[movieId] || null;
}

export function saveMetadataOverride(movieId: string, override: MovieMetadataOverride): void {
  try {
    const all = getAllMetadataOverrides();
    // Merge existing override if any
    all[movieId] = { ...all[movieId], ...override };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    // Clear movie cache so the new metadata is applied on the next load
    clearCatalogCache();
  } catch (e) {
    console.error('Could not save metadata override', e);
  }
}
