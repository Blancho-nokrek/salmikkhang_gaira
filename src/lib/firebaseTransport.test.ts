import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getFirestoreTransportSettings,
  isFirestoreConnectivityOrQuotaError,
  shouldUsePersistentCache,
} from './firebaseTransport';

test('getFirestoreTransportSettings enables auto-detect long polling with safe fallback timeout', () => {
  const settings = getFirestoreTransportSettings();
  assert.equal(settings.experimentalAutoDetectLongPolling, true);
  assert.equal(settings.ignoreUndefinedProperties, true);
  assert.ok(
    settings.experimentalLongPollingOptions.timeoutSeconds >= 5 &&
      settings.experimentalLongPollingOptions.timeoutSeconds <= 30
  );
});

test('shouldUsePersistentCache disables multi-tab IndexedDB inside embedded iframes', () => {
  assert.equal(
    shouldUsePersistentCache({ isEmbeddedIframe: true, hasIndexedDb: true }),
    false
  );
  assert.equal(
    shouldUsePersistentCache({ isEmbeddedIframe: false, hasIndexedDb: false }),
    false
  );
  assert.equal(
    shouldUsePersistentCache({ isEmbeddedIframe: false, hasIndexedDb: true }),
    true
  );
});

test('isFirestoreConnectivityOrQuotaError recognizes 10s backend timeout and offline codes', () => {
  assert.equal(
    isFirestoreConnectivityOrQuotaError(
      new Error(
        '@firebase/firestore: Firestore (13.4.0): Could not reach Cloud Firestore backend. Backend didn\'t respond within 10 seconds.'
      )
    ),
    true
  );
  assert.equal(isFirestoreConnectivityOrQuotaError({ code: 'unavailable' }), true);
  assert.equal(isFirestoreConnectivityOrQuotaError({ code: 'deadline-exceeded' }), true);
  assert.equal(isFirestoreConnectivityOrQuotaError({ code: 'permission-denied' }), false);
});
