import React, { useEffect, useRef, useState } from 'react';
import { useCommunity } from '../context/CommunityContext';
import {
  Search,
  Globe,
  Users,
  Shield,
  Menu,
  X,
  ChevronDown,
  Sun,
  Moon,
  Monitor,
  LogIn,
  ExternalLink
} from 'lucide-react';
import { Theme } from '../types';
import logoImg from '../assets/images/logo.png';

interface HeaderProps {
  onOpenSearch: () => void;
  onSelectNews?: (newsId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSearch, onSelectNews }) => {
  const {
    currentView,
    setCurrentView,
    language,
    toggleLanguage,
    t,
    theme,
    setTheme,
    currentMember,
    logoutMember,
    isAdminLoggedIn,
    joinRequests,
    openModal,
    news,
    events,
    projects,
    members
  } = useCommunity();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [communityDropdownOpen, setCommunityDropdownOpen] = useState(false);
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const headerRef = useRef<HTMLElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);

  const pendingRequestsCount = joinRequests.filter(r => r.status === 'Pending').length;

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
        setThemeDropdownOpen(false);
        setCommunityDropdownOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSearchFocused(false);
        setMobileSearchOpen(false);
        setThemeDropdownOpen(false);
        setCommunityDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, []);

  useEffect(() => {
    if (mobileSearchOpen) {
      setTimeout(() => mobileSearchInputRef.current?.focus(), 40);
    }
  }, [mobileSearchOpen]);

  const handleNavClick = (sectionId: string) => {
    if (currentView !== 'website') {
      setCurrentView('website');
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        el?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.getElementById(sectionId);
      el?.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  const q = searchQuery.trim().toLowerCase();
  const visibleNews = news.filter(n => currentMember || isAdminLoggedIn || n.visibility !== 'members_only');
  const visibleEvents = events.filter(ev => currentMember || isAdminLoggedIn || ev.visibility !== 'members_only');

  const searchResults = q
    ? {
        news: visibleNews.filter(
          n =>
            n.title.toLowerCase().includes(q) ||
            n.titleBn.toLowerCase().includes(q) ||
            n.summary.toLowerCase().includes(q) ||
            n.category.toLowerCase().includes(q)
        ),
        events: visibleEvents.filter(
          ev =>
            ev.title.toLowerCase().includes(q) ||
            ev.titleBn.toLowerCase().includes(q) ||
            ev.location.toLowerCase().includes(q)
        ),
        projects: projects.filter(
          p =>
            p.title.toLowerCase().includes(q) ||
            p.titleBn.toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q)
        ),
        members: members.filter(
          m =>
            m.name.toLowerCase().includes(q) ||
            m.village.toLowerCase().includes(q) ||
            m.skills.some(s => s.toLowerCase().includes(q))
        ),
      }
    : null;

  const hasSearchMatches = Boolean(
    searchResults &&
      (searchResults.news.length > 0 ||
        searchResults.events.length > 0 ||
        searchResults.projects.length > 0 ||
        searchResults.members.length > 0)
  );

  const closeAllSearch = () => {
    setSearchFocused(false);
    setMobileSearchOpen(false);
  };

  const handleSelectNewsResult = (newsId: string) => {
    closeAllSearch();
    setCurrentView('website');
    if (onSelectNews) {
      setTimeout(() => onSelectNews(newsId), 60);
    }
  };

  const handleSelectSectionResult = (sectionId: string) => {
    closeAllSearch();
    handleNavClick(sectionId);
  };

  const renderSearchResults = () => {
    if (!q || !searchResults) return null;
    if (!hasSearchMatches) {
      return (
        <div className="p-4 text-center text-xs text-slate-600 dark:text-slate-400">
          {t('No matching results found.', 'কোনো মিল খুঁজে পাওয়া যায়নি।')}
        </div>
      );
    }

    return (
      <div className="p-2 space-y-3 max-h-[60vh] overflow-y-auto text-xs">
        {searchResults.news.length > 0 && (
          <div className="space-y-1">
            <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t('News & Notices', 'সংবাদ ও নোটিশ')} ({searchResults.news.length})
            </div>
            {searchResults.news.slice(0, 4).map(n => (
              <button
                key={n.id}
                type="button"
                onClick={() => handleSelectNewsResult(n.id)}
                className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-emerald-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <div className="font-bold text-slate-950 dark:text-slate-100 truncate">{t(n.title, n.titleBn)}</div>
                  <div className="text-[10px] text-slate-600 dark:text-slate-400 truncate">{n.date} · {t(n.category, n.categoryBn)}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {searchResults.events.length > 0 && (
          <div className="space-y-1">
            <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t('Events', 'অনুষ্ঠান')} ({searchResults.events.length})
            </div>
            {searchResults.events.slice(0, 4).map(ev => (
              <button
                key={ev.id}
                type="button"
                onClick={() => handleSelectSectionResult('events')}
                className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-emerald-50 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="font-bold text-slate-950 dark:text-slate-100 truncate">{t(ev.title, ev.titleBn)}</div>
                <div className="text-[10px] text-slate-600 dark:text-slate-400 truncate">{ev.date} · {t(ev.location, ev.locationBn)}</div>
              </button>
            ))}
          </div>
        )}

        {searchResults.projects.length > 0 && (
          <div className="space-y-1">
            <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t('Projects', 'উদ্যোগ')} ({searchResults.projects.length})
            </div>
            {searchResults.projects.slice(0, 4).map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelectSectionResult('projects')}
                className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-emerald-50 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="font-bold text-slate-950 dark:text-slate-100 truncate">{t(p.title, p.titleBn)}</div>
                <div className="text-[10px] text-slate-600 dark:text-slate-400 truncate">{t(p.category, p.categoryBn)} · {p.progress}%</div>
              </button>
            ))}
          </div>
        )}

        {searchResults.members.length > 0 && (
          <div className="space-y-1">
            <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t('Community Members', 'সদস্যবৃন্দ')} ({searchResults.members.length})
            </div>
            {searchResults.members.slice(0, 4).map(m => (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  closeAllSearch();
                  if (currentMember) {
                    setCurrentView('member');
                  } else {
                    onOpenSearch();
                  }
                }}
                className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-emerald-50 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="font-bold text-slate-950 dark:text-slate-100 truncate">{m.name}</div>
                <div className="text-[10px] text-slate-600 dark:text-slate-400 truncate">{m.role} · {m.village} · {m.bloodGroup}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  const themeOptions: { id: Theme; labelEn: string; labelBn: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'light', labelEn: 'Light', labelBn: 'লাইট', icon: Sun },
    { id: 'dark', labelEn: 'Dark', labelBn: 'ডার্ক', icon: Moon },
    { id: 'system', labelEn: 'System', labelBn: 'সিস্টেম', icon: Monitor }
  ];

  const CurrentThemeIcon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor;

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-40 bg-white/70 dark:bg-[#080f1d]/75 backdrop-blur-2xl border-b border-white/20 dark:border-white/10 shadow-[0_4px_24px_0_rgba(0,0,0,0.25)] transition-colors"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-2 sm:gap-3">
          
          {/* Brand Logo & Name */}
          <div 
            onClick={() => { setCurrentView('website'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="flex items-center gap-2 sm:gap-3 cursor-pointer group min-w-0 shrink"
          >
            <img
              src={logoImg}
              alt="Salmikkhang Youth Community logo"
              className="w-9 h-9 sm:w-11 sm:h-11 rounded-full object-contain shadow-md ring-1 ring-white/40 group-hover:scale-105 transition-transform shrink-0"
            />
            <div className="flex flex-col min-w-0">
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-slate-950 dark:text-emerald-300 font-sans leading-tight group-hover:text-emerald-800 dark:group-hover:text-emerald-200 truncate">
                SALMIKKHANG
              </span>
              <span className="text-[10px] sm:text-[11px] font-semibold text-emerald-900 dark:text-emerald-400/90 leading-tight truncate">
                {t('Village Youth Community', 'গ্রাম যুব কমিউনিটি')}
              </span>
            </div>
          </div>

          {/* Center Navigation Links (xl+ to prevent collision on resize across tablet/small laptop) */}
          <nav className="hidden xl:flex items-center gap-4 2xl:gap-5 shrink-0">
            <button
              onClick={() => handleNavClick('home')}
              className={`text-xs uppercase tracking-wider font-semibold transition-colors py-2 whitespace-nowrap ${
                currentView === 'website' 
                  ? 'text-emerald-800 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-300'
              }`}
            >
              {t('Home', 'হোম')}
            </button>
            <button
              onClick={() => handleNavClick('about')}
              className="text-xs uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors py-2 whitespace-nowrap"
            >
              {t('About', 'পরিচিতি')}
            </button>
            <button
              onClick={() => handleNavClick('events')}
              className="text-xs uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors py-2 whitespace-nowrap"
            >
              {t('Events', 'অনুষ্ঠান')}
            </button>
            <button
              onClick={() => handleNavClick('news')}
              className="text-xs uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors py-2 whitespace-nowrap"
            >
              {t('News & Notices', 'সংবাদ ও নোটিশ')}
            </button>
            <button
              onClick={() => handleNavClick('projects')}
              className="text-xs uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors py-2 whitespace-nowrap"
            >
              {t('Projects', 'উদ্যোগ')}
            </button>
            <button
              onClick={() => handleNavClick('gallery')}
              className="text-xs uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors py-2 whitespace-nowrap"
            >
              {t('Gallery', 'গ্যালারি')}
            </button>
            <button
              onClick={() => handleNavClick('contact')}
              className="text-xs uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors py-2 whitespace-nowrap"
            >
              {t('Contact', 'যোগাযোগ')}
            </button>
          </nav>

          {/* Right Action Tools */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            
            {/* Inline Search Box on Tablet & Desktop (sm+) */}
            <div className="hidden sm:block relative">
              <div className="relative flex items-center">
                <Search className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400 absolute left-3 pointer-events-none" />
                <input
                  type="search"
                  value={searchQuery}
                  onFocus={() => setSearchFocused(true)}
                  onChange={e => {
                    setSearchQuery(e.target.value);
                    setSearchFocused(true);
                  }}
                  placeholder={t('Search...', 'অনুসন্ধান করুন...')}
                  aria-label={t('Search website', 'ওয়েবসাইট অনুসন্ধান')}
                  className="w-40 md:w-52 lg:w-60 xl:w-44 2xl:w-56 pl-8 pr-7 py-1.5 text-xs font-medium rounded-xl border border-emerald-200/80 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 text-slate-950 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                    aria-label={t('Clear search', 'খোঁজ মুছুন')}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {searchFocused && q && (
                <div className="absolute right-0 mt-2 w-80 bg-white/95 dark:bg-[#0c1527]/95 backdrop-blur-2xl rounded-2xl shadow-[0_16px_40px_0_rgba(0,0,0,0.4)] border border-white/40 dark:border-white/10 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  {renderSearchResults()}
                </div>
              )}
            </div>

            {/* Mobile Phone Search Box Trigger (expands inline search bar when tapped) */}
            <button
              type="button"
              onClick={() => {
                setMobileSearchOpen(prev => !prev);
                setMobileMenuOpen(false);
              }}
              className={`sm:hidden flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition-colors text-xs font-medium ${
                mobileSearchOpen
                  ? 'bg-emerald-700 text-white border-emerald-600'
                  : 'text-slate-900 dark:text-slate-200 bg-white/80 dark:bg-slate-800/80 border-emerald-200/80 dark:border-slate-700 hover:bg-emerald-50 dark:hover:bg-slate-800'
              }`}
              title={t('Search website...', 'অনুসন্ধান করুন...')}
              aria-label="Search"
              aria-expanded={mobileSearchOpen}
            >
              {mobileSearchOpen ? <X className="w-3.5 h-3.5" /> : <Search className="w-3.5 h-3.5" />}
              <span className="hidden min-[420px]:inline">{t('Search', 'খুঁজুন')}</span>
            </button>

            {/* Language Switch */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 text-xs font-bold text-slate-950 dark:text-emerald-200 bg-emerald-50 dark:bg-slate-800 hover:bg-emerald-100 dark:hover:bg-slate-700 rounded-lg border border-emerald-200 dark:border-slate-700 transition-colors"
              title={language === 'en' ? 'Switch to Bangla' : 'Switch to English'}
            >
              <Globe className="w-3.5 h-3.5 text-emerald-800 dark:text-emerald-400" />
              <span>{language === 'en' ? 'বাংলা' : 'EN'}</span>
            </button>

            {/* Theme Switcher (Dark, Light, System) - shown on sm+ (mobile has it inside hamburger menu) */}
            <div className="relative hidden sm:block">
              <button
                onClick={() => setThemeDropdownOpen(!themeDropdownOpen)}
                className="p-2 text-slate-900 dark:text-slate-300 hover:text-emerald-900 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1"
                title={`${t('Theme: ', 'থিম: ')}${theme}`}
                aria-label="Change theme"
              >
                <CurrentThemeIcon className="w-4 h-4 text-emerald-800 dark:text-emerald-400" />
                <ChevronDown className="w-3 h-3 opacity-60" />
              </button>

              {themeDropdownOpen && (
                <div 
                  className="absolute right-0 mt-2 w-36 bg-white/85 dark:bg-[#0c1527]/90 backdrop-blur-2xl rounded-2xl shadow-[0_16px_40px_0_rgba(0,0,0,0.4)] border border-white/30 dark:border-white/10 p-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                  onMouseLeave={() => setThemeDropdownOpen(false)}
                >
                  <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    {t('Theme', 'থিম')}
                  </div>
                  {themeOptions.map((opt) => {
                    const Icon = opt.icon;
                    const isSelected = theme === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => {
                          setTheme(opt.id);
                          setThemeDropdownOpen(false);
                        }}
                        className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-left transition-colors ${
                          isSelected
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{t(opt.labelEn, opt.labelBn)}</span>
                        {isSelected && <span className="ml-auto text-[10px] text-emerald-600 dark:text-emerald-400">✓</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Community Portal Menu Dropdown - shown on sm+ (mobile uses hamburger drawer) */}
            <div className="relative hidden sm:block">
              <button
                onClick={() => setCommunityDropdownOpen(!communityDropdownOpen)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                  currentView !== 'website'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
                aria-expanded={communityDropdownOpen}
              >
                <span>
                  {currentView === 'website' 
                    ? t('Community Hub', 'কমিউনিটি হাব') 
                    : currentView === 'member' 
                    ? t('Member Panel', 'সদস্য প্যানেল') 
                    : t('Admin Panel', 'অ্যাডমিন প্যানেল')}
                </span>
                {pendingRequestsCount > 0 && currentView !== 'admin' && (
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                )}
                <ChevronDown className="w-3.5 h-3.5 opacity-80" />
              </button>

              {communityDropdownOpen && (
                <div 
                  className="absolute right-0 mt-2 w-64 bg-white/85 dark:bg-[#0c1527]/90 backdrop-blur-2xl rounded-2xl shadow-[0_16px_40px_0_rgba(0,0,0,0.4)] border border-white/30 dark:border-white/10 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                  onMouseLeave={() => setCommunityDropdownOpen(false)}
                >
                  <div className="px-3 py-2 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 mb-1">
                    {t('Switch View / Portal', 'পোর্টাল পরিবর্তন')}
                  </div>

                  <button
                    onClick={() => {
                      setCurrentView('website');
                      setCommunityDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium text-left transition-colors ${
                      currentView === 'website'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 font-semibold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <ExternalLink className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <div>
                        <div className="font-semibold">{t('Public Website', 'পাবলিক ওয়েবসাইট')}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">{t('Home, news, events & story', 'হোম, খবর, অনুষ্ঠান ও তথ্য')}</div>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setCurrentView('member');
                      setCommunityDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium text-left transition-colors ${
                      currentView === 'member'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 font-semibold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <div>
                        <div className="font-semibold">{t('Member Portal', 'সদস্য পোর্টাল')}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">
                          {currentMember ? `${currentMember.name} (${currentMember.role})` : t('Login to access member area', 'সদস্য লগইন প্রয়োজন')}
                        </div>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setCurrentView('admin');
                      setCommunityDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium text-left transition-colors ${
                      currentView === 'admin'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 font-semibold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Shield className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                      <div>
                        <div className="font-semibold">{t('Admin Dashboard', 'অ্যাডমিন ড্যাশবোর্ড')}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">
                          {isAdminLoggedIn ? t('Admin Workspace Active', 'অ্যাডমিন প্যানেল সক্রিয়') : t('Council login required', 'অ্যাডমিন লগইন প্রয়োজন')}
                        </div>
                      </div>
                    </div>
                    {pendingRequestsCount > 0 && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold text-white bg-amber-600 rounded-md">
                        {pendingRequestsCount}
                      </span>
                    )}
                  </button>

                  <div className="border-t border-slate-100 dark:border-slate-800 mt-1 pt-1">
                    {currentMember ? (
                      <div className="px-3 py-2 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                        <div className="truncate max-w-[140px] text-emerald-900 dark:text-emerald-300 font-medium">
                          {currentMember.name}
                        </div>
                        <button
                          onClick={logoutMember}
                          className="text-[11px] text-rose-600 dark:text-rose-400 hover:underline"
                        >
                          {t('Logout', 'লগআউট')}
                        </button>
                      </div>
                    ) : (
                      <div className="p-1">
                        <button
                          onClick={() => {
                            openModal('login');
                            setCommunityDropdownOpen(false);
                          }}
                          className="w-full py-1.5 text-center text-xs font-semibold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-lg flex items-center justify-center gap-1.5"
                        >
                          <LogIn className="w-3.5 h-3.5" />
                          <span>{t('Member / Admin Login', 'সদস্য বা অ্যাডমিন লগইন')}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Mobile / Tablet menu trigger (visible below xl so window resizing never clips nav) */}
            <button
              onClick={() => {
                setMobileMenuOpen(!mobileMenuOpen);
                setMobileSearchOpen(false);
              }}
              className="xl:hidden relative p-2 text-slate-900 dark:text-slate-300 hover:text-emerald-900 dark:hover:text-emerald-400 rounded-lg"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              {pendingRequestsCount > 0 && !mobileMenuOpen && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500" />
              )}
            </button>
          </div>

        </div>

        {/* Mobile Expandable Search Box Bar (opens when tapping search on phone) */}
        {mobileSearchOpen && (
          <div className="sm:hidden pb-3 pt-1 border-t border-emerald-100/80 dark:border-slate-800 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-slate-600 dark:text-slate-400 absolute left-3.5 pointer-events-none" />
              <input
                ref={mobileSearchInputRef}
                type="search"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={t('Search news, events, projects, members...', 'খবর, অনুষ্ঠান, উদ্যোগ বা সদস্য খুঁজুন...')}
                className="w-full pl-10 pr-9 py-2.5 text-sm rounded-xl border border-emerald-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-950 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                  aria-label={t('Clear search', 'খোঁজ মুছুন')}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {q && (
              <div className="mt-2 bg-white/95 dark:bg-[#0c1527]/95 backdrop-blur-2xl rounded-2xl shadow-xl border border-white/40 dark:border-white/10">
                {renderSearchResults()}
              </div>
            )}
          </div>
        )}

        {/* Mobile / Tablet Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="xl:hidden py-4 border-t border-emerald-100 dark:border-slate-800 space-y-2 animate-in fade-in duration-200 max-h-[calc(100dvh-4.5rem)] overflow-y-auto">
            {/* View switcher for mobile */}
            <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl mb-3">
              <button
                onClick={() => {
                  setCurrentView('website');
                  setMobileMenuOpen(false);
                }}
                className={`py-2 text-xs font-semibold rounded-lg ${
                  currentView === 'website' 
                    ? 'bg-white dark:bg-slate-900 text-emerald-900 dark:text-emerald-300 shadow-xs' 
                    : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                {t('Website', 'ওয়েবসাইট')}
              </button>
              <button
                onClick={() => {
                  setCurrentView('member');
                  setMobileMenuOpen(false);
                }}
                className={`py-2 text-xs font-semibold rounded-lg ${
                  currentView === 'member' 
                    ? 'bg-white dark:bg-slate-900 text-emerald-900 dark:text-emerald-300 shadow-xs' 
                    : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                {t('Member Panel', 'সদস্য')}
              </button>
              <button
                onClick={() => {
                  setCurrentView('admin');
                  setMobileMenuOpen(false);
                }}
                className={`col-span-2 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 ${
                  currentView === 'admin' 
                    ? 'bg-emerald-700 text-white' 
                    : 'bg-emerald-100/70 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>{t('Admin Management Dashboard', 'অ্যাডমিন ড্যাশবোর্ড')}</span>
                {pendingRequestsCount > 0 && (
                  <span className="px-1.5 py-0.2 text-[10px] bg-amber-500 text-white rounded">
                    {pendingRequestsCount}
                  </span>
                )}
              </button>
            </div>

            {/* Theme switcher on mobile */}
            <div className="flex sm:hidden items-center justify-between px-3 py-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{t('Theme:', 'থিম:')}</span>
              <div className="flex items-center gap-1">
                {themeOptions.map((opt) => {
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => setTheme(opt.id)}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-lg flex items-center gap-1 ${
                        theme === opt.id
                          ? 'bg-emerald-700 text-white'
                          : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      <span>{t(opt.labelEn, opt.labelBn)}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => handleNavClick('home')}
              className="w-full text-left px-3 py-2 text-sm font-medium text-slate-800 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-lg"
            >
              {t('Home', 'হোম')}
            </button>
            <button
              onClick={() => handleNavClick('about')}
              className="w-full text-left px-3 py-2 text-sm font-medium text-slate-800 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-lg"
            >
              {t('About Salmikkhang', 'আমাদের পরিচিতি')}
            </button>
            <button
              onClick={() => handleNavClick('events')}
              className="w-full text-left px-3 py-2 text-sm font-medium text-slate-800 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-lg"
            >
              {t('Upcoming Events', 'আসন্ন অনুষ্ঠান')}
            </button>
            <button
              onClick={() => handleNavClick('news')}
              className="w-full text-left px-3 py-2 text-sm font-medium text-slate-800 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-lg"
            >
              {t('News & Community Updates', 'খবর ও আপডেট')}
            </button>
            <button
              onClick={() => handleNavClick('projects')}
              className="w-full text-left px-3 py-2 text-sm font-medium text-slate-800 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-lg"
            >
              {t('Village Projects', 'গ্রামের উদ্যোগ')}
            </button>
            <button
              onClick={() => handleNavClick('gallery')}
              className="w-full text-left px-3 py-2 text-sm font-medium text-slate-800 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-lg"
            >
              {t('Photo Gallery', 'ফটো গ্যালারি')}
            </button>
            <button
              onClick={() => handleNavClick('contact')}
              className="w-full text-left px-3 py-2 text-sm font-medium text-slate-800 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-lg"
            >
              {t('Contact Us', 'যোগাযোগ')}
            </button>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex gap-2">
              <button
                onClick={() => {
                  openModal('join');
                  setMobileMenuOpen(false);
                }}
                className="flex-1 py-2.5 text-center text-xs font-bold text-white bg-emerald-700 rounded-lg"
              >
                {t('Request Membership', 'সদস্যপদের আবেদন')}
              </button>
              <button
                onClick={() => {
                  openModal('login');
                  setMobileMenuOpen(false);
                }}
                className="py-2.5 px-4 text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-slate-800 rounded-lg"
              >
                {t('Login', 'লগইন')}
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
