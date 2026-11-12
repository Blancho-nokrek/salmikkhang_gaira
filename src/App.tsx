import React, { useState } from 'react';
import { CommunityProvider, useCommunity } from './context/CommunityContext';
import { Header } from './components/Header';
import { PublicWebsite } from './components/PublicWebsite';
import { MemberPortal } from './components/MemberPortal';
import { AdminDashboard } from './components/AdminDashboard';
import { Modals } from './components/Modals';
import { Shield, Users, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import natureBgImg from './assets/images/nature_glass_bg_1794467445710.jpg';

const MainApp: React.FC = () => {
  const {
    currentView,
    setCurrentView,
    toast,
    joinRequests,
    settings,
    t
  } = useCommunity();

  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedNewsId, setSelectedNewsId] = useState<string | null>(null);
  const [selectedGalleryItem, setSelectedGalleryItem] = useState<any | null>(null);

  const pendingRequests = joinRequests.filter(r => r.status === 'Pending').length;

  return (
    <div className="min-h-screen relative text-slate-800 dark:text-slate-100 flex flex-col font-sans selection:bg-emerald-400/30 selection:text-emerald-950 dark:selection:text-emerald-100 transition-colors">
      
      {/* Background Nature Glassmorphism Layer */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Full Cinematic Nature Landscape */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105 transition-transform duration-1000 ease-out"
          style={{ backgroundImage: `url(${settings.siteBackground || natureBgImg})` }}
        />

        {/* Atmosphere: sky haze above, forest depth below, sunlight bloom */}
        <div className="absolute inset-0 bg-gradient-to-b from-sky-200/50 via-emerald-50/40 to-emerald-900/30 dark:from-[#021210]/80 dark:via-[#06281f]/75 dark:to-[#021210]/92" />
        <div className="absolute -top-40 right-0 w-[40rem] h-[40rem] rounded-full bg-[#A3E635]/20 dark:bg-[#38BDF8]/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-24 w-[36rem] h-[36rem] rounded-full bg-[#047857]/25 blur-3xl" />
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 flex flex-col flex-1">
        {/* Toast Notification Notification Pill */}
        {toast && (
          <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
            <div className={`px-4 py-3 rounded-2xl shadow-[0_18px_40px_-14px_rgba(0,0,0,0.5)] backdrop-blur-2xl border flex items-center gap-2.5 text-xs font-semibold ${
              toast.type === 'warning'
                ? 'bg-amber-950/80 border-amber-500/30 text-amber-200'
                : toast.type === 'info'
                ? 'bg-slate-900/80 border-cyan-500/30 text-cyan-200'
                : 'bg-emerald-950/80 border-emerald-500/30 text-emerald-200'
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
        <Header onOpenSearch={() => setSearchOpen(true)} />

        {/* Main View Router */}
        <main key={currentView} className="flex-1 view-enter">
          {currentView === 'website' && (
            <PublicWebsite
              onSelectNews={(id) => setSelectedNewsId(id)}
              onSelectGallery={(item) => setSelectedGalleryItem(item)}
            />
          )}

          {currentView === 'member' && <MemberPortal />}

          {currentView === 'admin' && <AdminDashboard />}
        </main>

        {/* Global Interactive Modals */}
        <Modals
          searchOpen={searchOpen}
          onCloseSearch={() => setSearchOpen(false)}
          selectedNewsId={selectedNewsId}
          onCloseNews={() => setSelectedNewsId(null)}
          selectedGalleryItem={selectedGalleryItem}
          onCloseGallery={() => setSelectedGalleryItem(null)}
        />

        {/* Floating View Switcher Bar (Nature Glassmorphism styled after reference image) */}
        <div className="glass-dock fixed bottom-5 left-5 z-40 hidden sm:flex items-center gap-1.5 p-1.5 rounded-2xl text-xs font-semibold">
          <span className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-wider px-2">
            {t('PORTAL:', 'ভিউ:')}
          </span>
          <button
            onClick={() => setCurrentView('website')}
            className={`px-3.5 py-1.5 rounded-xl transition-all ${
              currentView === 'website'
                ? 'bg-emerald-600 text-white font-bold'
                : 'text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-white/40 dark:hover:bg-white/5'
            }`}
          >
            {t('Website', 'পাবলিক সাইট')}
          </button>
          <button
            onClick={() => setCurrentView('member')}
            className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              currentView === 'member'
                ? 'bg-emerald-600 text-white font-bold'
                : 'text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-white/40 dark:hover:bg-white/5'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>{t('Member Panel', 'সদস্য প্যানেল')}</span>
          </button>
          <button
            onClick={() => setCurrentView('admin')}
            className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              currentView === 'admin'
                ? 'bg-emerald-600 text-white font-bold'
                : 'text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-white/40 dark:hover:bg-white/5'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>{t('Admin Panel', 'অ্যাডমিন')}</span>
            {pendingRequests > 0 && (
              <span className="px-1.5 py-0.2 bg-amber-500 text-white text-[10px] font-bold rounded-md">
                {pendingRequests}
              </span>
            )}
          </button>
        </div>
      </div>

    </div>
  );
};

export default function App() {
  return (
    <CommunityProvider>
      <MainApp />
    </CommunityProvider>
  );
}
