import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  memoryLocalCache,
  persistentLocalCache,
  persistentMultipleTabManager,
  enableNetwork,
  setLogLevel,
  doc,
  getDocFromServer,
  type Firestore,
} from 'firebase/firestore';
import rawFirebaseConfig from '../../firebase-applet-config.json';
import {
  detectEmbeddedIframe,
  getFirestoreTransportSettings,
  isFirestoreConnectivityOrQuotaError,
  shouldUsePersistentCache,
} from './firebaseTransport';

export { isFirestoreConnectivityOrQuotaError };

export const BOOTSTRAP_ADMIN_EMAIL = 'salmikkhang@gmail.com';
export const BOOTSTRAP_ADMIN_EMAILS = [
  'salmikkhang@gmail.com',
  'blanchonokreksk@gmail.com',
];

export function isBootstrapAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return BOOTSTRAP_ADMIN_EMAILS.includes(email.trim().toLowerCase());
}

const PRIMARY_FIRESTORE_CONFIG = {
  projectId: 'fifth-chassis-zct7q',
  appId: '1:103678617019:web:986e8f1a5292b03596509e',
  apiKey: 'AIzaSyDzOjxt2T2Di3UOGm5gcN0bsdIM3fnb4Ns',
  authDomain: 'fifth-chassis-zct7q.firebaseapp.com',
  firestoreDatabaseId: 'ai-studio-salmikkhanggaira-553f112d-8a98-4028-ba5f-1cdd71bd2af9',
  storageBucket: 'fifth-chassis-zct7q.firebasestorage.app',
  messagingSenderId: '103678617019',
  measurementId: '',
  oAuthClientId: '103678617019-fq2egsf7jpsndut50g12epesu1d0klr0.apps.googleusercontent.com',
  recaptchaSiteKey: '',
};

interface FirebaseClientConfig {
  projectId: string;
  appId: string;
  apiKey: string;
  authDomain: string;
  firestoreDatabaseId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  measurementId?: string;
  oAuthClientId?: string;
  recaptchaSiteKey?: string;
}

const env = (import.meta as any).env || {};
const appletConfig = rawFirebaseConfig as FirebaseClientConfig;
const baseFirestoreConfig: FirebaseClientConfig = appletConfig.firestoreDatabaseId
  ? appletConfig
  : PRIMARY_FIRESTORE_CONFIG;

const firebaseConfig: FirebaseClientConfig = {
  ...baseFirestoreConfig,
  ...(env.VITE_FIREBASE_API_KEY ? { apiKey: env.VITE_FIREBASE_API_KEY } : {}),
  ...(env.VITE_FIREBASE_AUTH_DOMAIN ? { authDomain: env.VITE_FIREBASE_AUTH_DOMAIN } : {}),
  ...(env.VITE_FIREBASE_PROJECT_ID ? { projectId: env.VITE_FIREBASE_PROJECT_ID } : {}),
  ...(env.VITE_FIREBASE_APP_ID ? { appId: env.VITE_FIREBASE_APP_ID } : {}),
};

export const firebaseApp = initializeApp(firebaseConfig);
const app = firebaseApp;

function createFirestoreInstance(): Firestore {
  const databaseId = firebaseConfig.firestoreDatabaseId || PRIMARY_FIRESTORE_CONFIG.firestoreDatabaseId;
  const transportSettings = getFirestoreTransportSettings();
  const usePersistent = shouldUsePersistentCache({
    isEmbeddedIframe: detectEmbeddedIframe(),
    hasIndexedDb: typeof indexedDB !== 'undefined',
  });

  if (usePersistent) {
    try {
      return initializeFirestore(
        app,
        {
          ...transportSettings,
          localCache: persistentLocalCache({
            tabManager: persistentMultipleTabManager(),
          }),
        },
        databaseId
      );
    } catch {
      // Fall through to memory cache if persistent IndexedDB cache is unavailable or already locked
    }
  }

  try {
    return initializeFirestore(
      app,
      {
        ...transportSettings,
        localCache: memoryLocalCache(),
      },
      databaseId
    );
  } catch {
    return getFirestore(app, databaseId);
  }
}

// Keep internal SDK transient offline retries quiet; structured app errors still log via handleFirestoreError.
setLogLevel('silent');

export const db = createFirestoreInstance();
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

if (typeof window !== 'undefined') {
  const reconnectFirestore = () => {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
    void enableNetwork(db).catch(() => {
      // Ignore reconnect errors when network is still stabilizing
    });
  };
  window.addEventListener('online', reconnectFirestore);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      reconnectFirestore();
    }
  });
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return;
  }
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (isFirestoreConnectivityOrQuotaError(error)) {
      // Operating in local/cached mode until network recovers
      return;
    }
  }
}

if (typeof window !== 'undefined') {
  window.setTimeout(() => {
    void testConnection();
  }, 1500);
} else {
  void testConnection();
}
