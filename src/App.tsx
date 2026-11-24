import React, { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { CommunityProvider, useCommunity } from './context/CommunityContext';
import { Header } from './components/Header';
import { PublicWebsite } from './components/PublicWebsite';
import { Modals } from './components/Modals';
import { PWAInstallModal, OfflineIndicator } from './components/PWAInstallBanner';
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
  const [scrollProgress, setScrollProgress] = useState(0);

  // Top scroll progress tracker
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight <= 0) {
        setScrollProgress(0);
        return;
      }
      const progress = (window.scrollY / totalHeight) * 100;
      setScrollProgress(Math.min(100, Math.max(0, progress)));
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
    <div className="min-h-screen overflow-x-clip relative text-slate-100 flex flex-col font-sans selection:bg-cyan-400/30 selection:text-cyan-100 transition-colors bg-[#050a0e]">
      
      {/* Top Scroll-Progress Bar with Glowing Cyan-to-Emerald Gradient */}
      <div
        className="fixed top-0 left-0 right-0 h-1 z-[70] pointer-events-none transition-all duration-75 ease-out"
        style={{
          width: `${scrollProgress}%`,
          background: 'linear-gradient(90deg, #22d3ee 0%, #14b8a6 50%, #10b981 100%)',
          boxShadow: '0 0 16px rgba(34, 211, 238, 0.8), 0 0 28px rgba(16, 185, 129, 0.5)'
        }}
      />

      {/* Deep Midnight Obsidian Background Layer with slow-moving ambient Cyan & Emerald radial glow blobs */}
      <div
        className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-gradient-to-b from-[#050a0e] via-[#071318] to-[#04080c]"
        style={{ contain: 'strict', transform: 'translateZ(0)' }}
      >
        {/* Optional Custom Admin Background (softly blended if configured) */}
        {settings.siteBackground && (
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-15 mix-blend-luminosity"
            style={{ backgroundImage: `url(${settings.siteBackground})` }}
          />
        )}

        {/* Ambient Radial Cyan Glow Blob 1 */}
        <div
          className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full bg-cyan-500/12 blur-[140px] animate-blob-1 pointer-events-none"
        />

        {/* Ambient Radial Emerald Glow Blob 2 */}
        <div
          className="absolute top-1/3 -right-40 w-[650px] h-[650px] rounded-full bg-emerald-500/12 blur-[150px] animate-blob-2 pointer-events-none"
        />

        {/* Ambient Radial Teal Glow Blob 3 */}
        <div
          className="absolute -bottom-40 left-1/4 w-[550px] h-[550px] rounded-full bg-teal-500/10 blur-[130px] animate-blob-3 pointer-events-none"
        />

        {/* Subtle Cyber Grid & Soft Neon Light Trails */}
        <div
          className="absolute inset-0 opacity-25 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(ellipse at 50% 0%, rgba(34, 211, 238, 0.14), transparent 75%),
                              linear-gradient(to right, rgba(34, 211, 238, 0.035) 1px, transparent 1px),
                              linear-gradient(to bottom, rgba(16, 185, 129, 0.035) 1px, transparent 1px)`,
            backgroundSize: '100% 100%, 72px 72px, 72px 72px'
          }}
        />

        {/* Soft Obsidian Vignette */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050a0e]/30 to-[#050a0e]/85 pointer-events-none" />
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 flex flex-col flex-1 min-w-0">
        {/* Toast Notification Pill */}
        {toast && (
          <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:bottom-6 sm:right-6 z-50 toast-enter no-print">
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
