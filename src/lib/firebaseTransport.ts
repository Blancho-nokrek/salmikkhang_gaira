export interface FirestoreCacheEnvironment {
  isEmbeddedIframe: boolean;
  hasIndexedDb: boolean;
}

export interface FirestoreTransportOptions {
  experimentalForceLongPolling: true;
  experimentalLongPollingOptions: {
    timeoutSeconds: number;
  };
}

/**
 * Detect whether the app is running inside a cross-origin or sandboxed iframe.
 * In embedded frames (such as preview containers), IndexedDB multi-tab leases
 * can stall across reloads, so memoryLocalCache is safer and faster.
 */
export function detectEmbeddedIframe(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

export function shouldUsePersistentCache(env: FirestoreCacheEnvironment): boolean {
  return !env.isEmbeddedIframe && env.hasIndexedDb;
}

/**
 * Forces WebChannel long-polling with a 25s hanging-GET timeout so proxies,
 * mobile networks, antivirus shields, and preview iframes do not buffer
 * chunked streaming responses and trigger the 10-second offline timeout.
 */
export function getFirestoreTransportSettings(): FirestoreTransportOptions {
  return {
    experimentalForceLongPolling: true,
    experimentalLongPollingOptions: {
      timeoutSeconds: 25,
    },
  };
}

export function isFirestoreConnectivityOrQuotaError(error: unknown): boolean {
  const code =
    typeof (error as { code?: unknown })?.code === 'string'
      ? ((error as { code: string }).code).toLowerCase()
      : '';
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
