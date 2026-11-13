import React, { useState } from 'react';
import { CommunityProvider, useCommunity } from './context/CommunityContext';
import { Header } from './components/Header';
import { PublicWebsite } from './components/PublicWebsite';
import { MemberPortal } from './components/MemberPortal';
import { AdminDashboard } from './components/AdminDashboard';
import { Modals } from './components/Modals';
import { CheckCircle, Info, AlertTriangle } from 'lucide-react';
import natureBgImg from './assets/images/nature_glass_bg_1794467445710.jpg';

const MainApp: React.FC = () => {
  const {
    currentView,
    settings,
    toast
  } = useCommunity();

  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedNewsId, setSelectedNewsId] = useState<string | null>(null);
  const [selectedGalleryItem, setSelectedGalleryItem] = useState<any | null>(null);

  return (
    <div className="min-h-screen overflow-x-clip relative text-slate-950 dark:text-slate-100 flex flex-col font-sans selection:bg-emerald-400/30 selection:text-emerald-950 dark:selection:text-emerald-100 transition-colors">
      
      {/* Background Nature Glassmorphism Layer */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Full Cinematic Nature Landscape */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105 transition-transform duration-1000 ease-out"
          style={{ backgroundImage: `url(${settings.siteBackground || natureBgImg})` }}
        />

        {/* Atmosphere: crisp bright veil in light mode for black text contrast, deep forest depth in dark mode */}
        <div className="absolute inset-0 bg-gradient-to-b from-sky-100/80 via-white/75 to-emerald-50/85 dark:from-[#021210]/80 dark:via-[#06281f]/75 dark:to-[#021210]/92" />
        <div className="absolute -top-40 right-0 w-[40rem] h-[40rem] rounded-full bg-[#A3E635]/15 dark:bg-[#38BDF8]/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-24 w-[36rem] h-[36rem] rounded-full bg-[#047857]/15 dark:bg-[#047857]/25 blur-3xl" />
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 flex flex-col flex-1 min-w-0">
        {/* Toast Notification Pill */}
        {toast && (
          <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:bottom-6 sm:right-6 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
            <div className={`px-4 py-3 rounded-2xl shadow-[0_18px_40px_-14px_rgba(0,0,0,0.5)] backdrop-blur-2xl border flex items-center gap-2.5 text-xs font-semibold ${
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
        />

        {/* Main View Router */}
        <main key={currentView} className="flex-1 min-w-0 view-enter">
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
