import React, { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { CommunityProvider, useCommunity } from './context/CommunityContext';
import { Header } from './components/Header';
import { PublicWebsite } from './components/PublicWebsite';
import { Modals } from './components/Modals';
import { PWAInstallModal, OfflineIndicator } from './components/PWAInstallBanner';
import { GmailNotifyConfirmModal } from './components/GmailNotifyConfirmModal';
import { usePWAInstall } from './hooks/usePWAInstall';
import { CheckCircle, Info, AlertTriangle } from 'lucide-react';
import natureBgImg from './assets/images/nature_glass_bg_1794467445710.jpg';

const loadMemberPortal = () => import('./components/MemberPortal');
const loadAdminDashboard = () => import('./components/AdminDashboard');

const MemberPortal = lazy(() =>
  loadMemberPortal().then((m) => ({ default: m.MemberPortal }))
);
const AdminDashboard = lazy(() =>
  loadAdminDashboard().then((m) => ({ default: m.AdminDashboard }))
);

const PortalLoadingFallback: React.FC<{ label: string }> = ({ label }) => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <div className="glass-card rounded-3xl p-8 sm:p-10 flex flex-col items-center justify-center gap-3 text-center">
      <div className="w-8 h-8 rounded-full border-2 border-emerald-600/30 border-t-emerald-600 dark:border-emerald-400/30 dark:border-t-emerald-400 animate-spin" />
      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{label}</p>
    </div>
  </div>
);

const MainApp: React.FC = () => {
  const {
    currentView,
    settings,
    toast,
    showToast,
    t
  } = useCommunity();

  const { isInstallable, install } = usePWAInstall();

  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedNewsId, setSelectedNewsId] = useState<string | null>(null);
  const [selectedGalleryItem, setSelectedGalleryItem] = useState<any | null>(null);
  const [installModalOpen, setInstallModalOpen] = useState(false);

  const preloadPortals = useCallback(() => {
    void loadMemberPortal();
    void loadAdminDashboard();
  }, []);

  useEffect(() => {
    const win = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    if (typeof win.requestIdleCallback === 'function') {
      const id = win.requestIdleCallback(() => preloadPortals(), { timeout: 2500 });
      return () => {
        if (typeof win.cancelIdleCallback === 'function') win.cancelIdleCallback(id);
      };
    }
    const timer = window.setTimeout(() => preloadPortals(), 1800);
    return () => window.clearTimeout(timer);
  }, [preloadPortals]);

  const handleDownloadClick = async () => {
    if (isInstallable) {
      const outcome = await install();
      if (outcome === 'accepted') {
        showToast(
          t(
            'Salmikkhang app installed! You can now open it directly from your Home Screen or Desktop.',
            'সালমিকখাং অ্যাপ ইনস্টল হয়েছে! এখন হোম স্ক্রিন বা ডেস্কটপ থেকেই সরাসরি চালাতে পারবেন।'
          ),
          'success'
        );
        return;
      }
      if (outcome === 'dismissed') {
        return;
      }
    }
    setInstallModalOpen(true);
  };

  return (
    <div className="min-h-screen overflow-x-clip relative text-slate-950 dark:text-slate-100 flex flex-col font-sans selection:bg-emerald-400/30 selection:text-emerald-950 dark:selection:text-emerald-100 transition-colors">
      
      {/* Background Nature Glassmorphism Layer (GPU-isolated, zero live blur filters) */}
      <div
        className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
        style={{ contain: 'strict', transform: 'translateZ(0)' }}
      >
        {/* Full Cinematic Nature Landscape */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${settings.siteBackground || natureBgImg})` }}
        />

        {/* Atmosphere: crisp bright veil in light mode for black text contrast, deep forest depth in dark mode */}
        <div className="absolute inset-0 bg-gradient-to-b from-sky-100/80 via-white/75 to-emerald-50/85 dark:from-[#021210]/80 dark:via-[#06281f]/75 dark:to-[#021210]/92" />
        {/* Soft ambient radial glows (pure CSS gradient — zero GPU blur pass) */}
        <div
          className="absolute inset-0 opacity-90 dark:opacity-0"
          style={{
            backgroundImage:
              'radial-gradient(circle 34rem at 92% 4%, rgba(163, 230, 53, 0.16), transparent 70%), radial-gradient(circle 30rem at 6% 96%, rgba(4, 120, 87, 0.15), transparent 70%)',
          }}
        />
        <div
          className="absolute inset-0 opacity-0 dark:opacity-90"
          style={{
            backgroundImage:
              'radial-gradient(circle 34rem at 92% 4%, rgba(56, 189, 248, 0.12), transparent 70%), radial-gradient(circle 30rem at 6% 96%, rgba(4, 120, 87, 0.24), transparent 70%)',
          }}
        />
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 flex flex-col flex-1 min-w-0">
        {/* Toast Notification Pill */}
        {toast && (
          <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:bottom-6 sm:right-6 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
            <div className={`px-4 py-3 rounded-2xl shadow-[0_18px_40px_-14px_rgba(0,0,0,0.5)] backdrop-blur-md border flex items-center gap-2.5 text-xs font-semibold ${
              toast.type === 'warning'
                ? 'bg-amber-950/90 border-amber-500/30 text-amber-100'
                : toast.type === 'info'
                ? 'bg-slate-900/90 border-cyan-500/30 text-cyan-100'
                : 'bg-emerald-950/90 border-emerald-500/30 text-emerald-100'
            }`}>
              {toast.type === 'warning' ? (
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              ) : toast.type === 'info' ? (
                <Info className="w-4 h-4 text-cyan-400 shrink-0" />
              ) : (
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              )}
              <span>{toast.message}</span>
            </div>
          </div>
        )}

        {/* Main Top Header */}
        <Header
          onOpenSearch={() => setSearchOpen(true)}
          onSelectNews={(id) => setSelectedNewsId(id)}
          onOpenAppInstall={() => void handleDownloadClick()}
          isAppInstallOpen={installModalOpen}
          onPreloadPortals={preloadPortals}
        />

        {/* Main View Router */}
        <main key={currentView} className="flex-1 min-w-0 view-enter">
          {currentView === 'website' && (
            <PublicWebsite
              onSelectNews={(id) => setSelectedNewsId(id)}
              onSelectGallery={(item) => setSelectedGalleryItem(item)}
            />
          )}

          {currentView === 'member' && (
            <Suspense fallback={<PortalLoadingFallback label={t('Opening Member Portal...', 'সদস্য পোর্টাল খোলা হচ্ছে...')} />}>
              <MemberPortal />
            </Suspense>
          )}

          {currentView === 'admin' && (
            <Suspense fallback={<PortalLoadingFallback label={t('Opening Admin Panel...', 'অ্যাডমিন প্যানেল খোলা হচ্ছে...')} />}>
              <AdminDashboard />
            </Suspense>
          )}
        </main>

        {/* Global Interactive Modals */}
        <Modals
          searchOpen={searchOpen}
          onCloseSearch={() => setSearchOpen(false)}
          selectedNewsId={selectedNewsId}
          onCloseNews={() => setSelectedNewsId(null)}
          onSelectNews={(id) => setSelectedNewsId(id)}
          selectedGalleryItem={selectedGalleryItem}
          onCloseGallery={() => setSelectedGalleryItem(null)}
        />

        {/* Home Screen & Desktop Shortcut Modal */}
        <PWAInstallModal
          isOpen={installModalOpen}
          onClose={() => setInstallModalOpen(false)}
        />

        {/* Mandatory Gmail Notification Confirmation Modal */}
        <GmailNotifyConfirmModal />

        {/* Offline Connectivity Indicator */}
        <OfflineIndicator />
      </div>

    </div>
  );
};

interface AppErrorBoundaryState {
  hasError: boolean;
}

class AppErrorBoundary extends React.Component<{ children: React.ReactNode }, AppErrorBoundaryState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    console.error('Application ErrorBoundary caught an error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950 text-slate-100">
          <div className="max-w-md w-full rounded-3xl border border-white/10 bg-slate-900/90 p-6 text-center space-y-4 shadow-2xl">
            <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto" />
            <h1 className="text-lg font-extrabold">Something went wrong · একটি ত্রুটি ঘটেছে</h1>
            <p className="text-xs text-slate-300 leading-relaxed">
              An unexpected display issue occurred. Please reload the page to restore normal operation.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors"
            >
              Reload Application · পেজ রিলোড করুন
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <AppErrorBoundary>
      <CommunityProvider>
        <MainApp />
      </CommunityProvider>
    </AppErrorBoundary>
  );
}
