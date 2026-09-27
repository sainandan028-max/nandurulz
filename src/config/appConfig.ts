import type { AppConfig } from '../types/movie';

const appConfig: AppConfig = {
  // ═══════════════════════════════════════════════════════════════
  // PUBLIC CONFIGURATION
  // These values are bundled into frontend JavaScript.
  // ═══════════════════════════════════════════════════════════════

  // Google Drive folder ID containing your movie files
  driveFolderId: '1Fwe56N3V6HqQbePuhu1HAaF_6kRU4hWk',

  // Google Cloud API key (restricted to Drive API + your domain)
  googleApiKey: 'AIzaSyAaEQUd7kVPStmIxwbtQMD9ZWwbhZlHzhg',

  // Display name for your movie library
  siteName: 'NanduRulz',

  // Catalog mode: always drive for this setup
  catalogMode: { type: 'drive' },
};

export default appConfig;
