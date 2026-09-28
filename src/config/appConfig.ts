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

  // Google OAuth Client ID for authenticating users to bypass API rate limits
  googleClientId: '259012956341-ptdhcihhg0m6jddra5iamhiaci353ile.apps.googleusercontent.com',

  // TMDB API Key for automatic high-res movie posters (optional)
  tmdbApiKey: '06260fb32ec4ee1fa7b8cf630cd08cb1',

  // Display name for your movie library
  siteName: 'NanduRulz',

  // Catalog mode: always drive for this setup
  catalogMode: { type: 'drive' },
};

export default appConfig;
