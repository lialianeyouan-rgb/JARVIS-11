/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User, 
  signOut 
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App singleton safely
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

export const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/fitness.activity.read',
  'https://www.googleapis.com/auth/fitness.body.read',
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/documents',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/contacts.readonly',
];

const provider = new GoogleAuthProvider();
SCOPES.forEach((scope) => provider.addScope(scope));
provider.setCustomParameters({
  prompt: 'consent',
  access_type: 'offline',
});

// Flag to indicate if we are in the middle of a sign-in flow.
let isSigningIn = false;

// Storage keys
const STORAGE_KEY_TOKEN = 'jarvis_google_access_token';
const STORAGE_KEY_USER = 'jarvis_google_user_email';
const STORAGE_KEY_TIME = 'jarvis_google_token_saved_at';

// In-memory token initialized from localStorage if available
let cachedAccessToken: string | null = null;
if (typeof window !== 'undefined') {
  try {
    cachedAccessToken = localStorage.getItem(STORAGE_KEY_TOKEN);
  } catch (e) {
    console.warn('LocalStorage not available for token initialization', e);
  }
}

// Initialize auth state listener. Call this on app load.
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      const storedToken = cachedAccessToken || (typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_TOKEN) : null);
      if (storedToken) {
        cachedAccessToken = storedToken;
        if (onAuthSuccess) onAuthSuccess(user, storedToken);
      } else if (!isSigningIn) {
        if (onAuthSuccess) onAuthSuccess(user, '');
      }
    } else {
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Must be called from a button click or user interaction
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to get access token from Google Auth Provider');
    }

    cachedAccessToken = credential.accessToken;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY_TOKEN, cachedAccessToken);
        localStorage.setItem(STORAGE_KEY_USER, result.user.email || '');
        localStorage.setItem(STORAGE_KEY_TIME, Date.now().toString());
      } catch (e) {
        console.warn('Could not persist Google access token:', e);
      }
    }

    // Sync with backend vault for server-side token management and refresh token persistence
    try {
      await fetch('/api/auth/google/store-tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken: cachedAccessToken,
          email: result.user.email,
          expiresIn: 3599,
          scope: SCOPES.join(' ')
        })
      });
    } catch (e) {
      console.warn('Failed to sync token with backend vault:', e);
    }

    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    if (
      error?.code === 'auth/popup-closed-by-user' ||
      error?.code === 'auth/cancelled-popup-request' ||
      error?.code === 'auth/popup-blocked' ||
      error?.message?.includes('popup-closed-by-user') ||
      error?.message?.includes('cancelled-popup-request')
    ) {
      console.info('Connexion Google interrompue ou fermée par l\'utilisateur.');
      return null;
    }
    console.warn('Google Sign In warning:', error?.message || error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  // First check backend status if client has no token
  if (!cachedAccessToken && typeof window !== 'undefined') {
    try {
      const statusRes = await fetch('/api/auth/google/status');
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        if (statusData.authenticated && statusData.hasRefreshToken) {
          // Backend has valid or renewable token
          return 'backend-managed-token';
        }
      }
    } catch (e) {
      // Ignored
    }
  }

  if (cachedAccessToken && typeof cachedAccessToken === 'string' && cachedAccessToken !== 'null' && cachedAccessToken !== 'undefined' && cachedAccessToken.trim()) {
    return cachedAccessToken.trim();
  }
  if (typeof window !== 'undefined') {
    try {
      const token = localStorage.getItem(STORAGE_KEY_TOKEN);
      if (token && typeof token === 'string' && token !== 'null' && token !== 'undefined' && token.trim()) {
        cachedAccessToken = token.trim();
        return cachedAccessToken;
      }
    } catch (e) {
      console.warn('Could not read Google access token:', e);
    }
  }
  return null;
};

export const getStoredGoogleUser = (): { email: string | null; hasToken: boolean } => {
  if (typeof window === 'undefined') return { email: null, hasToken: false };
  try {
    const token = localStorage.getItem(STORAGE_KEY_TOKEN) || cachedAccessToken;
    const email = localStorage.getItem(STORAGE_KEY_USER) || (auth.currentUser?.email || null);
    return { email, hasToken: !!token };
  } catch {
    return { email: null, hasToken: false };
  }
};

export const validateGoogleToken = async (token?: string): Promise<{
  valid: boolean;
  email?: string;
  expiresIn?: number;
  scopes?: string[];
  error?: string;
}> => {
  const tokenToTest = token || (await getAccessToken());
  if (!tokenToTest) {
    return { valid: false, error: 'Aucun jeton Google OAuth trouvé.' };
  }

  try {
    const res = await fetch(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${tokenToTest}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { valid: false, error: err.error_description || 'Jeton expiré ou invalide.' };
    }
    const info = await res.json();
    return {
      valid: true,
      email: info.email,
      expiresIn: info.expires_in,
      scopes: info.scope ? info.scope.split(' ') : [],
    };
  } catch (e: any) {
    return { valid: false, error: e.message };
  }
};

export const logout = async (): Promise<void> => {
  await signOut(auth);
  cachedAccessToken = null;
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(STORAGE_KEY_TOKEN);
      localStorage.removeItem(STORAGE_KEY_USER);
      localStorage.removeItem(STORAGE_KEY_TIME);
    } catch (e) {
      console.warn('Could not clear local storage on logout:', e);
    }
  }
  try {
    await fetch('/api/auth/google/logout', { method: 'POST' });
  } catch (e) {
    // Ignored
  }
};
