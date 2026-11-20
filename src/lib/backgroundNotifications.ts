export interface CommunityAlertCandidate {
  id: string;
  kind: 'notice' | 'news' | 'event' | 'project';
  title: string;
  body: string;
}

const SEEN_STORAGE_KEY = 'salmikkhang_seen_alert_ids_v1';
const DEVICE_ALERTS_ENABLED_KEY = 'salmikkhang_device_alerts_enabled_v1';

/**
 * Pure detector that computes which incoming community items are brand-new
 * compared to the previously observed ID set.
 * On the very first baseline load (when previousIds is null), no retroactive
 * notifications are emitted; all current IDs are simply recorded as seen.
 */
export function detectNewCommunityUpdates(
  previousIds: Set<string> | null,
  currentItems: CommunityAlertCandidate[]
): {
  nextSeenIds: Set<string>;
  newAlerts: CommunityAlertCandidate[];
} {
  const nextSeenIds = new Set<string>(previousIds ? Array.from(previousIds) : []);
  if (previousIds === null) {
    for (const item of currentItems) {
      nextSeenIds.add(item.id);
    }
    return { nextSeenIds, newAlerts: [] };
  }

  const newAlerts: CommunityAlertCandidate[] = [];
  for (const item of currentItems) {
    if (!nextSeenIds.has(item.id)) {
      nextSeenIds.add(item.id);
      newAlerts.push(item);
    }
  }
  return { nextSeenIds, newAlerts };
}

export function loadSeenAlertIds(): Set<string> | null {
  try {
    const raw = localStorage.getItem(SEEN_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return new Set(parsed.filter((v): v is string => typeof v === 'string'));
  } catch {
    return null;
  }
}

export function saveSeenAlertIds(ids: Set<string>): void {
  try {
    const trimmed = Array.from(ids).slice(-250);
    localStorage.setItem(SEEN_STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // Ignore storage failures in private browsing / sandboxed iframes
  }
}

export function isDeviceAlertsPreferenceEnabled(): boolean {
  try {
    return localStorage.getItem(DEVICE_ALERTS_ENABLED_KEY) === '1';
  } catch {
    return false;
  }
}

export function setDeviceAlertsPreference(enabled: boolean): void {
  try {
    localStorage.setItem(DEVICE_ALERTS_ENABLED_KEY, enabled ? '1' : '0');
  } catch {
    // Ignore
  }
}

export function getBrowserNotificationSupport(): {
  supported: boolean;
  permission: NotificationPermission | 'unsupported';
} {
  if (typeof window === 'undefined' || typeof Notification === 'undefined') {
    return { supported: false, permission: 'unsupported' };
  }
  return { supported: true, permission: Notification.permission };
}

export async function requestDeviceNotificationAccess(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof window === 'undefined' || typeof Notification === 'undefined') {
    return 'unsupported';
  }
  try {
    const result = await Notification.requestPermission();
    if (result === 'granted') {
      setDeviceAlertsPreference(true);
      await registerPeriodicBackgroundSync();
    } else {
      setDeviceAlertsPreference(false);
    }
    return result;
  } catch {
    return 'denied';
  }
}

export async function registerPeriodicBackgroundSync(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return false;
  }
  try {
    const reg = await navigator.serviceWorker.ready;
    const periodicSync = (reg as unknown as {
      periodicSync?: { register: (tag: string, options: { minInterval: number }) => Promise<void> };
    }).periodicSync;
    if (periodicSync) {
      await periodicSync.register('salmikkhang-community-sync', {
        minInterval: 60 * 60 * 1000, // 1 hour minimum interval supported by installed Android Chrome PWAs
      });
      return true;
    }
  } catch {
    // Periodic Background Sync is optional and only available on installed Chromium PWAs
  }
  return false;
}

export async function dispatchDeviceNotification(alert: CommunityAlertCandidate): Promise<boolean> {
  if (typeof window === 'undefined' || typeof Notification === 'undefined') {
    return false;
  }
  if (Notification.permission !== 'granted') {
    return false;
  }

  const options: NotificationOptions = {
    body: alert.body.slice(0, 180),
    icon: '/pwa-192x192.png',
    badge: '/favicon.png',
    tag: `salmikkhang-${alert.kind}-${alert.id}`,
    data: { url: '/', kind: alert.kind, id: alert.id },
  };

  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      if (reg && typeof reg.showNotification === 'function') {
        await reg.showNotification(alert.title, options);
        return true;
      }
    }
  } catch {
    // Fall back to direct Window Notification API
  }

  try {
    new Notification(alert.title, options);
    return true;
  } catch {
    return false;
  }
}

export function updateAppUnreadBadge(count: number): void {
  if (typeof navigator === 'undefined') return;
  const nav = navigator as unknown as {
    setAppBadge?: (n?: number) => Promise<void>;
    clearAppBadge?: () => Promise<void>;
  };
  try {
    if (count > 0 && typeof nav.setAppBadge === 'function') {
      void nav.setAppBadge(count).catch(() => {});
    } else if (count === 0 && typeof nav.clearAppBadge === 'function') {
      void nav.clearAppBadge().catch(() => {});
    }
  } catch {
    // App Badging API is optional
  }
}
