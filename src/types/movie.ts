export interface Movie {
  id: string;
  title: string;
  driveFileId: string;
  driveUrl: string;
  posterUrl?: string;
  description?: string;
  year?: string;
  category?: string;
  visible: boolean;
  sortOrder: number;
  // Drive API metadata
  mimeType?: string;
  modifiedTime?: string;
  size?: string;
  thumbnailLink?: string;
  resourceKey?: string;
  webViewLink?: string;
}

export interface PlaybackProgress {
  movieId: string;
  currentTime: number;
  duration: number;
  updatedAt: number;
  completed: boolean;
}

export interface CatalogMode {
  type: 'drive';
}

export interface AppConfig {
  driveFolderId: string;
  googleApiKey: string;
  googleClientId?: string;
  siteName: string;
  catalogMode: CatalogMode;
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  size?: string;
  thumbnailLink?: string;
  resourceKey?: string;
  webViewLink?: string;
}

export type SortMode = 'recent' | 'alphabetical' | 'custom';

export type ViewMode = 'fit' | 'fill';
