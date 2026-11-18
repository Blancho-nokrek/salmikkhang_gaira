import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  doc,
  getDocFromServer,
  type Firestore,
} from 'firebase/firestore';
import rawFirebaseConfig from '../../firebase-applet-config.json';

export const BOOTSTRAP_ADMIN_EMAIL = 'salmikkhang@gmail.com';
export const BOOTSTRAP_ADMIN_EMAILS = [
  'salmikkhang@gmail.com',
  'blanchonokreksk@gmail.com',
];

export function isBootstrapAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return BOOTSTRAP_ADMIN_EMAILS.includes(email.trim().toLowerCase());
}

const env = (import.meta as any).env || {};
const firebaseConfig = {
  ...rawFirebaseConfig,
  ...(env.VITE_FIREBASE_API_KEY ? { apiKey: env.VITE_FIREBASE_API_KEY } : {}),
  ...(env.VITE_FIREBASE_AUTH_DOMAIN ? { authDomain: env.VITE_FIREBASE_AUTH_DOMAIN } : {}),
  ...(env.VITE_FIREBASE_PROJECT_ID ? { projectId: env.VITE_FIREBASE_PROJECT_ID } : {}),
  ...(env.VITE_FIREBASE_APP_ID ? { appId: env.VITE_FIREBASE_APP_ID } : {}),
};

const app = initializeApp(firebaseConfig);

function createFirestoreInstance(): Firestore {
  try {
    return initializeFirestore(
      app,
      {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager(),
        }),
      },
      firebaseConfig.firestoreDatabaseId
    );
  } catch {
    return getFirestore(app, firebaseConfig.firestoreDatabaseId);
  }
}

export const db = createFirestoreInstance();
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

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

export function isFirestoreConnectivityOrQuotaError(error: unknown): boolean {
  const code = typeof (error as any)?.code === 'string' ? ((error as any).code as string).toLowerCase() : '';
  const msg = (error instanceof Error ? error.message : String(error || '')).toLowerCase();
  if (
    code === 'resource-exhausted' ||
    code === 'unavailable' ||
    code === 'failed-precondition' ||
    code === 'aborted' ||
    code === 'deadline-exceeded'
  ) {
    return true;
  }
  return (
    msg.includes('quota limit exceeded') ||
    msg.includes('resource-exhausted') ||
    msg.includes('the client is offline') ||
    msg.includes('could not reach cloud firestore backend') ||
    msg.includes("backend didn't respond")
  );
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
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (isFirestoreConnectivityOrQuotaError(error)) {
      console.warn(
        'Firestore running in cached/local mode (connection unavailable or quota exceeded):',
        error instanceof Error ? error.message : String(error)
      );
    }
  }
}

testConnection();
