/**
 * Google Drive API service
 * Uses the Drive API v3 with a browser API key for public folder listing.
 */
import type { DriveFile } from '../types/movie';
import appConfig from '../config/appConfig';

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';

const VIDEO_MIME_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-matroska',
  'video/x-msvideo',
  'video/mpeg',
  'video/ogg',
  'video/3gpp',
];

/**
 * List video files from the configured Google Drive folder.
 * Requires the folder to be shared (anyone with link can view).
 */
export async function listDriveFolderVideos(): Promise<DriveFile[]> {
  const { driveFolderId, googleApiKey } = appConfig;

  if (!driveFolderId || driveFolderId === 'YOUR_DRIVE_FOLDER_ID_HERE') {
    throw new Error('Google Drive folder ID is not configured.');
  }
  if (!googleApiKey || googleApiKey === 'YOUR_GOOGLE_API_KEY_HERE') {
    throw new Error('Google API key is not configured.');
  }

  const mimeFilter = VIDEO_MIME_TYPES.map((m) => `mimeType='${m}'`).join(' or ');
  const query = `'${driveFolderId}' in parents and trashed=false and (${mimeFilter})`;

  const params = new URLSearchParams({
    q: query,
    key: googleApiKey,
    fields: 'files(id,name,mimeType,modifiedTime,size,thumbnailLink,resourceKey,webViewLink)',
    pageSize: '1000',
    orderBy: 'name',
    includeItemsFromAllDrives: 'true',
    supportsAllDrives: 'true',
  });

  const response = await fetch(`${DRIVE_API_BASE}/files?${params}`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData?.error?.message || response.statusText;

    if (response.status === 403) {
      throw new Error(
        `API access denied. Check that your API key is valid and the Drive API is enabled. (${errorMessage})`
      );
    }
    if (response.status === 404) {
      throw new Error(
        `Drive folder not found. Check that the folder ID is correct and the folder is shared. (${errorMessage})`
      );
    }
    if (response.status === 429) {
      throw new Error('API rate limit reached. Please try again in a few minutes.');
    }
    throw new Error(`Failed to list Drive files: ${errorMessage}`);
  }

  const data = await response.json();
  return (data.files || []) as DriveFile[];
}

/**
 * Get a direct download URL for a Drive file.
 * Note: This may not always work for streaming due to Drive redirects/confirmations.
 */
export function getDriveDirectUrl(fileId: string): string {
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}

/**
 * Get a Drive preview/player URL (Google's built-in player).
 * This is the most reliable fallback for playing Drive videos.
 */
export function getDrivePreviewUrl(fileId: string, resourceKey?: string): string {
  let url = `https://drive.google.com/file/d/${fileId}/preview`;
  if (resourceKey) {
    url += `?resourcekey=${resourceKey}`;
  }
  return url;
}

/**
 * Get a Drive view URL (opens in Drive's viewer).
 */
export function getDriveViewUrl(fileId: string, resourceKey?: string): string {
  let url = `https://drive.google.com/file/d/${fileId}/view`;
  if (resourceKey) {
    url += `?resourcekey=${resourceKey}`;
  }
  return url;
}

/**
 * Extract a Drive file ID from various Google Drive URL formats.
 */
export function extractDriveFileId(url: string): string | null {
  if (!url) return null;

  // Format: https://drive.google.com/file/d/FILE_ID/...
  const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch) return fileMatch[1];

  // Format: https://drive.google.com/open?id=FILE_ID
  const openMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (openMatch) return openMatch[1];

  // Format: https://drive.google.com/uc?id=FILE_ID
  const ucMatch = url.match(/\/uc\?.*id=([a-zA-Z0-9_-]+)/);
  if (ucMatch) return ucMatch[1];

  // Format: https://docs.google.com/...?id=FILE_ID
  const docsMatch = url.match(/docs\.google\.com.*[?&]id=([a-zA-Z0-9_-]+)/);
  if (docsMatch) return docsMatch[1];

  // If it looks like just a file ID
  if (/^[a-zA-Z0-9_-]{10,}$/.test(url.trim())) {
    return url.trim();
  }

  return null;
}

/**
 * Validate that a Drive URL is a recognized format.
 */
export function isValidDriveUrl(url: string): boolean {
  return extractDriveFileId(url) !== null;
}

/**
 * Check if a MIME type is a supported video format.
 */
export function isVideoMimeType(mimeType: string): boolean {
  return VIDEO_MIME_TYPES.includes(mimeType);
}
