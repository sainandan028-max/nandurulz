import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import appConfig from '../config/appConfig';

interface AuthContextType {
  accessToken: string | null;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  accessToken: null,
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accessToken, setAccessToken] = useState<string | null>(localStorage.getItem('gdrive_access_token'));

  // Load Google Identity Services script
  useEffect(() => {
    if (!appConfig.googleClientId) return;
    
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const login = useCallback(() => {
    if (!appConfig.googleClientId) {
      alert('Google Client ID is not configured in appConfig.ts. You need to create an OAuth Client ID in Google Cloud Console to enable Google Login.');
      return;
    }

    if (!(window as any).google) {
      alert('Google Login script is still loading or failed to load. Please try again.');
      return;
    }

    const client = (window as any).google.accounts.oauth2.initTokenClient({
      client_id: appConfig.googleClientId,
      scope: 'https://www.googleapis.com/auth/drive.readonly',
      callback: (response: any) => {
        if (response.error !== undefined) {
          console.error('Google Auth Error:', response);
          alert('Login failed.');
          return;
        }
        setAccessToken(response.access_token);
        localStorage.setItem('gdrive_access_token', response.access_token);
      },
    });

    client.requestAccessToken({ prompt: '' });
  }, []);

  const logout = useCallback(() => {
    setAccessToken(null);
    localStorage.removeItem('gdrive_access_token');
  }, []);

  return (
    <AuthContext.Provider value={{ accessToken, isAuthenticated: !!accessToken, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
