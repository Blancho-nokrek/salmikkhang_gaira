import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import { firebaseApp, workspaceOAuthConfig } from './firebase';

export const GMAIL_SENDER_EMAIL = 'salmikkhang@gmail.com';
export const GMAIL_SCOPES = ['https://www.googleapis.com/auth/gmail.send'] as const;

const GMAIL_APP_NAME = 'salmikkhang-gmail-oauth';

function getGmailFirebaseApp() {
  if (workspaceOAuthConfig.projectId === firebaseApp.options.projectId) {
    return firebaseApp;
  }
  const existing = getApps().find((a) => a.name === GMAIL_APP_NAME);
  if (existing) return existing;
  return initializeApp(workspaceOAuthConfig, GMAIL_APP_NAME);
}

const gmailAuth = getAuth(getGmailFirebaseApp());

// In-memory cache ONLY (never persisted to localStorage or sessionStorage)
let cachedGmailAccessToken: string | null = null;
let cachedGmailUserEmail: string | null = null;
let isConnectingGmail = false;

export interface GmailAuthSession {
  connected: boolean;
  email: string | null;
  displayName: string | null;
  hasToken: boolean;
  isPreferredSender: boolean;
}

export function getGmailAuthSession(): GmailAuthSession {
  const email = cachedGmailUserEmail || gmailAuth.currentUser?.email || null;
  const normalized = email ? email.trim().toLowerCase() : null;
  return {
    connected: Boolean(cachedGmailAccessToken && normalized),
    email: normalized,
    displayName: gmailAuth.currentUser?.displayName || null,
    hasToken: Boolean(cachedGmailAccessToken),
    isPreferredSender: normalized === GMAIL_SENDER_EMAIL,
  };
}

export function subscribeGmailAuthState(
  onChange: (session: GmailAuthSession) => void
): () => void {
  return onAuthStateChanged(gmailAuth, (user: User | null) => {
    if (!user) {
      cachedGmailAccessToken = null;
      cachedGmailUserEmail = null;
      onChange(getGmailAuthSession());
      return;
    }

    if (!isConnectingGmail) {
      if (!cachedGmailAccessToken) {
        cachedGmailUserEmail = user.email ? user.email.trim().toLowerCase() : null;
      }
      onChange(getGmailAuthSession());
    }
  });
}

export async function connectGmailSender(
  preferredEmail: string = GMAIL_SENDER_EMAIL
): Promise<{ email: string; accessToken: string }> {
  const provider = new GoogleAuthProvider();
  for (const scope of GMAIL_SCOPES) {
    provider.addScope(scope);
  }
  provider.setCustomParameters({
    login_hint: preferredEmail,
    prompt: 'select_account consent',
  });

  try {
    isConnectingGmail = true;
    const result = await signInWithPopup(gmailAuth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Could not obtain Gmail send authorization token from Google.');
    }
    const email = (result.user.email || preferredEmail).trim().toLowerCase();
    cachedGmailAccessToken = credential.accessToken;
    cachedGmailUserEmail = email;
    return { email, accessToken: credential.accessToken };
  } finally {
    isConnectingGmail = false;
  }
}

export function getCachedGmailAccessToken(): string | null {
  return cachedGmailAccessToken;
}

export function clearCachedGmailAccessToken(): void {
  cachedGmailAccessToken = null;
}

export async function disconnectGmailSender(): Promise<void> {
  cachedGmailAccessToken = null;
  cachedGmailUserEmail = null;
  try {
    await signOut(gmailAuth);
  } catch {
    // Ignore sign-out errors if already signed out
  }
}
