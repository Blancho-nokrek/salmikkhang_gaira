import { useEffect, useState } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

declare global {
  interface Window {
    __pwaDeferredPrompt?: BeforeInstallPromptEvent | null;
    __pwaInstalled?: boolean;
  }
}

export type InstallResult = 'accepted' | 'dismissed' | 'unavailable';

function detectStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    Boolean(window.__pwaInstalled) ||
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function detectIframe(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(() =>
    typeof window !== 'undefined' ? window.__pwaDeferredPrompt ?? null : null
  );
  const [isInstalled, setIsInstalled] = useState<boolean>(() => detectStandalone());
  const [isIOS, setIsIOS] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [inIframe] = useState<boolean>(() => detectIframe());

  useEffect(() => {
    const syncFromWindow = () => {
      setDeferredPrompt(window.__pwaDeferredPrompt ?? null);
      if (detectStandalone()) {
        setIsInstalled(true);
      }
    };

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      window.__pwaDeferredPrompt = e as BeforeInstallPromptEvent;
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      window.__pwaInstalled = true;
      window.__pwaDeferredPrompt = null;
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    syncFromWindow();

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('pwa:prompt-ready', syncFromWindow);
    window.addEventListener('pwa:installed', handleAppInstalled);

    const ua = window.navigator.userAgent.toLowerCase();
    const iosDevice = /iphone|ipad|ipod/.test(ua);
    const mobileDevice = iosDevice || /android|mobile/.test(ua);
    setIsIOS(iosDevice);
    setIsMobile(mobileDevice);

    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = (ev: MediaQueryListEvent) => {
      if (ev.matches) {
        handleAppInstalled();
      }
    };
    mediaQuery.addEventListener?.('change', handleDisplayModeChange);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('pwa:prompt-ready', syncFromWindow);
      window.removeEventListener('pwa:installed', handleAppInstalled);
      mediaQuery.removeEventListener?.('change', handleDisplayModeChange);
    };
  }, []);

  const install = async (): Promise<InstallResult> => {
    const promptEvent = window.__pwaDeferredPrompt ?? deferredPrompt;
    if (!promptEvent) return 'unavailable';
    try {
      await promptEvent.prompt();
      const { outcome } = await promptEvent.userChoice;
      window.__pwaDeferredPrompt = null;
      setDeferredPrompt(null);
      if (outcome === 'accepted') {
        window.__pwaInstalled = true;
        setIsInstalled(true);
        return 'accepted';
      }
      return 'dismissed';
    } catch {
      window.__pwaDeferredPrompt = null;
      setDeferredPrompt(null);
      return 'unavailable';
    }
  };

  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    isIOS,
    isMobile,
    inIframe,
    install,
  };
}

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
