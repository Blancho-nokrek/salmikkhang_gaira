import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useCommunity } from '../context/CommunityContext';
import { safeLower } from '../lib/memberAccess';
import { resolveActiveNavSection, type NavSectionId, type SectionPosition } from '../lib/scrollSmooth';
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
  ExternalLink,
  FileText,
  Download,
  Sparkles
} from 'lucide-react';
import { Theme } from '../types';
import logoImg from '../assets/images/logo.png';

interface HeaderProps {
  onOpenSearch: () => void;
  onSelectNews?: (newsId: string) => void;
  onOpenAppInstall?: () => void;
  isAppInstallOpen?: boolean;
  onPreloadPortals?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSearch,
  onSelectNews,
  onOpenAppInstall,
  isAppInstallOpen = false,
  onPreloadPortals,
}) => {
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
    isMemberSessionUnlocked,
    isAdminSessionUnlocked,
    isAdminLoggedIn,
    canViewAdminPanel,
    isPresidentViewOnly,
    joinRequests,
    openModal,
    news,
    events,
    projects,
    members
  } = useCommunity();

  const isMemberUnlocked = Boolean(isMemberSessionUnlocked && currentMember);
  const isAdminUnlocked = Boolean(isAdminSessionUnlocked && canViewAdminPanel);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [communityDropdownOpen, setCommunityDropdownOpen] = useState(false);
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<'home' | 'about' | 'events' | 'news' | 'projects' | 'gallery' | 'contact'>('home');

  const headerRef = useRef<HTMLElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);
  const manualScrollLockUntilRef = useRef<number>(0);

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

  const scrollToSection = (sectionId: 'home' | 'about' | 'events' | 'news' | 'projects' | 'gallery' | 'contact') => {
    if (sectionId === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const el = document.getElementById(sectionId);
    if (!el) return;
    const headerHeight = headerRef.current?.getBoundingClientRect().height || 80;
    const targetTop = el.getBoundingClientRect().top + window.scrollY - headerHeight - 8;
    window.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' });
  };

  useEffect(() => {
    if (currentView !== 'website') return;

    const orderedIds: Exclude<NavSectionId, 'home'>[] = [
      'about',
      'events',
      'news',
      'projects',
      'gallery',
      'contact',
    ];
    let rafId = 0;

    const updateActiveSection = () => {
      rafId = 0;
      if (Date.now() < manualScrollLockUntilRef.current) return;

      const headerHeight = headerRef.current?.getBoundingClientRect().height || 80;
      const threshold = headerHeight + 80;
      const sections: SectionPosition[] = [];
      for (const id of orderedIds) {
        const el = document.getElementById(id);
        if (el) {
          sections.push({ id, top: el.getBoundingClientRect().top });
        }
      }

      setActiveSection((prev) =>
        resolveActiveNavSection({
          scrollY: window.scrollY,
          innerHeight: window.innerHeight,
          scrollHeight: document.documentElement.scrollHeight,
          threshold,
          sections,
          previousSection: prev,
        })
      );
    };

    const handleScroll = () => {
      if (rafId !== 0) return;
      rafId = window.requestAnimationFrame(updateActiveSection);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId !== 0) window.cancelAnimationFrame(rafId);
    };
  }, [currentView]);

  const handleNavClick = (sectionId: 'home' | 'about' | 'events' | 'news' | 'projects' | 'gallery' | 'contact') => {
    setActiveSection(sectionId);
    manualScrollLockUntilRef.current = Date.now() + 900;
    setMobileMenuOpen(false);
    if (currentView !== 'website') {
      setCurrentView('website');
      setTimeout(() => {
        scrollToSection(sectionId);
      }, 120);
    } else {
      scrollToSection(sectionId);
    }
  };

  const navItems: {
    id: 'home' | 'about' | 'events' | 'news' | 'projects' | 'gallery' | 'contact';
    labelEn: string;
    labelBn: string;
    mobileLabelEn: string;
    mobileLabelBn: string;
  }[] = [
    { id: 'home', labelEn: 'Home', labelBn: 'হোম', mobileLabelEn: 'Home', mobileLabelBn: 'হোম' },
    { id: 'about', labelEn: 'About', labelBn: 'পরিচিতি', mobileLabelEn: 'About Salmikkhang', mobileLabelBn: 'আমাদের পরিচিতি' },
    { id: 'events', labelEn: 'Events', labelBn: 'অনুষ্ঠান', mobileLabelEn: 'Upcoming Events', mobileLabelBn: 'আসন্ন অনুষ্ঠান' },
    { id: 'news', labelEn: 'Notices', labelBn: 'নোটিশ', mobileLabelEn: 'News & Community Updates', mobileLabelBn: 'খবর ও আপডেট' },
    { id: 'projects', labelEn: 'Projects', labelBn: 'উদ্যোগ', mobileLabelEn: 'Village Projects', mobileLabelBn: 'গ্রামের উদ্যোগ' },
    { id: 'gallery', labelEn: 'Gallery', labelBn: 'গ্যালারি', mobileLabelEn: 'Photo Gallery', mobileLabelBn: 'ফটো গ্যালারি' },
    { id: 'contact', labelEn: 'Contact', labelBn: 'যোগাযোগ', mobileLabelEn: 'Contact Us', mobileLabelBn: 'যোগাযোগ' },
  ];

  // Top-level desktop navigation items (Notices & Download simplified into Community Hub dropdown)
  const desktopNavItems = [
    { id: 'home', labelEn: 'Home', labelBn: 'হোম' },
    { id: 'about', labelEn: 'About', labelBn: 'পরিচিতি' },
    { id: 'events', labelEn: 'Events', labelBn: 'অনুষ্ঠান' },
    { id: 'projects', labelEn: 'Projects', labelBn: 'উদ্যোগ' },
    { id: 'gallery', labelEn: 'Gallery', labelBn: 'গ্যালারি' },
    { id: 'contact', labelEn: 'Contact', labelBn: 'যোগাযোগ' },
  ] as const;

  const q = safeLower(searchQuery).trim();
  const canSeePrivateSearch = isMemberUnlocked || isAdminUnlocked;

  const searchResults = useMemo(() => {
    if (!q) return null;
    const visibleNews = news.filter(n => canSeePrivateSearch || n.visibility !== 'members_only');
    const visibleEvents = events.filter(ev => canSeePrivateSearch || ev.visibility !== 'members_only');
    return {
      news: visibleNews.filter(
        n =>
          safeLower(n.title).includes(q) ||
          safeLower(n.titleBn).includes(q) ||
          safeLower(n.summary).includes(q) ||
          safeLower(n.summaryBn).includes(q) ||
          safeLower(n.category).includes(q) ||
          safeLower(n.categoryBn).includes(q)
      ),
      events: visibleEvents.filter(
        ev =>
          safeLower(ev.title).includes(q) ||
          safeLower(ev.titleBn).includes(q) ||
          safeLower(ev.location).includes(q) ||
          safeLower(ev.locationBn).includes(q)
      ),
      projects: projects.filter(
        p =>
          safeLower(p.title).includes(q) ||
          safeLower(p.titleBn).includes(q) ||
          safeLower(p.category).includes(q) ||
          safeLower(p.categoryBn).includes(q)
      ),
      members: canSeePrivateSearch
        ? members.filter(
            m =>
              safeLower(m.name).includes(q) ||
              safeLower(m.village).includes(q) ||
              (Array.isArray(m.skills) ? m.skills : []).some(s => safeLower(s).includes(q))
          )
        : [],
    };
  }, [q, canSeePrivateSearch, news, events, projects, members]);

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

  const handleSelectSectionResult = (sectionId: 'home' | 'about' | 'events' | 'news' | 'projects' | 'gallery' | 'contact') => {
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
                  setCurrentView(isMemberUnlocked ? 'member' : 'admin');
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
      className="sticky top-0 z-50 bg-[#050a0e]/90 backdrop-blur-2xl border-b border-cyan-500/20 shadow-[0_4px_30px_rgba(0,0,0,0.8)] transition-all duration-300"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-2 sm:gap-3">
          
          {/* Brand Logo & Name */}
          <button
            type="button"
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-2 sm:gap-2.5 cursor-pointer group min-w-0 shrink xl:shrink-0 text-left"
          >
            <div className="relative">
              <img
                src={logoImg}
                alt="Salmikkhang Youth Community logo"
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-contain shadow-md ring-1 ring-cyan-400/50 group-hover:ring-emerald-400 group-hover:scale-105 transition-all shrink-0"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#050a0e]" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-display font-extrabold text-sm sm:text-base tracking-tight text-white group-hover:text-cyan-300 leading-tight transition-colors truncate">
                SALMIKKHANG
              </span>
              <span className="text-[10px] sm:text-[11px] font-semibold text-cyan-400/90 leading-tight truncate">
                {t('Village Youth Community', 'গ্রাম যুব কমিউনিটি')}
              </span>
            </div>
          </button>

          {/* Center Navigation Links (xl+ to prevent collision on resize across tablet/small laptop) */}
          <nav className="hidden xl:flex items-center gap-3 2xl:gap-4 shrink-0">
            {desktopNavItems.map(item => {
              const isActive = !isAppInstallOpen && currentView === 'website' && activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item.id)}
                  className={`text-xs uppercase tracking-wider font-semibold transition-all py-2 whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'text-cyan-300 border-b-2 border-cyan-400 shadow-[0_1px_10px_rgba(34,211,238,0.3)]'
                      : 'text-slate-300 hover:text-cyan-200 border-b-2 border-transparent'
                  }`}
                >
                  {t(item.labelEn, item.labelBn)}
                </button>
              );
            })}
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
                  className="w-40 md:w-48 lg:w-56 xl:w-36 2xl:w-48 pl-8 pr-7 py-1.5 text-xs font-medium rounded-xl border border-cyan-400/30 bg-[#050a0e]/70 text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 text-slate-400 hover:text-white"
                    aria-label={t('Clear search', 'খোঁজ মুছুন')}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {searchFocused && q && (
                <div className="absolute right-0 mt-2 w-80 bg-[#050a0e]/95 backdrop-blur-2xl rounded-2xl shadow-[0_16px_40px_0_rgba(0,0,0,0.7)] border border-cyan-400/30 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
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
                  ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400'
                  : 'text-slate-200 bg-[#050a0e]/70 border-cyan-400/30 hover:border-cyan-400'
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
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 text-xs font-bold text-cyan-200 bg-white/5 hover:bg-white/10 rounded-lg border border-cyan-400/30 transition-all hover:border-emerald-400/50"
              title={language === 'en' ? 'Switch to Bangla' : 'Switch to English'}
            >
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span>{language === 'en' ? 'বাংলা' : 'EN'}</span>
            </button>

            {/* Theme Switcher (Dark, Light, System) - shown on sm+ (mobile has it inside hamburger menu) */}
            <div className="relative hidden sm:block">
              <button
                onClick={() => setThemeDropdownOpen(!themeDropdownOpen)}
                className="p-2 text-slate-300 hover:text-cyan-300 hover:bg-white/5 rounded-lg border border-cyan-400/20 hover:border-cyan-400/40 transition-colors flex items-center gap-1"
                title={`${t('Theme: ', 'থিম: ')}${theme}`}
                aria-label="Change theme"
              >
                <CurrentThemeIcon className="w-4 h-4 text-cyan-400" />
                <ChevronDown className="w-3 h-3 opacity-60" />
              </button>

              {themeDropdownOpen && (
                <div 
                  className="absolute right-0 mt-2 w-36 bg-[#050a0e]/95 backdrop-blur-2xl rounded-2xl shadow-[0_16px_40px_0_rgba(0,0,0,0.7)] border border-cyan-400/30 p-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                  onMouseLeave={() => setThemeDropdownOpen(false)}
                >
                  <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
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
                            ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-400/30'
                            : 'text-slate-300 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{t(opt.labelEn, opt.labelBn)}</span>
                        {isSelected && <span className="ml-auto text-[10px] text-cyan-400">✓</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Community Portal Menu Dropdown - styled as glowing cyan-emerald pill button */}
            <div className="relative hidden sm:block">
              <button
                onMouseEnter={() => onPreloadPortals?.()}
                onFocus={() => onPreloadPortals?.()}
                onClick={() => {
                  onPreloadPortals?.();
                  setCommunityDropdownOpen(!communityDropdownOpen);
                }}
                className={`hub-pill-btn flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-full whitespace-nowrap cursor-pointer ${
                  currentView !== 'website'
                    ? 'border-emerald-400 text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.4)]'
                    : ''
                }`}
                aria-expanded={communityDropdownOpen}
              >
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#22d3ee]" />
                <span>
                  {currentView === 'website' 
                    ? t('Community Hub', 'কমিউনিটি হাব') 
                    : currentView === 'member' 
                    ? t('Member Panel', 'সদস্য প্যানেল') 
                    : t('Admin Panel', 'অ্যাডমিন প্যানেল')}
                </span>
                {isAdminUnlocked && pendingRequestsCount > 0 && currentView !== 'admin' && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 ring-2 ring-amber-400/50" />
                )}
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 opacity-80 ${communityDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {communityDropdownOpen && (
                <div 
                  className="absolute right-0 mt-2 w-72 bg-[#050a0e]/95 backdrop-blur-2xl rounded-2xl shadow-[0_16px_40px_0_rgba(0,0,0,0.7)] border border-cyan-400/30 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                  onMouseLeave={() => setCommunityDropdownOpen(false)}
                >
                  <div className="px-3 py-2 text-[10px] font-bold text-cyan-400/80 uppercase tracking-wider border-b border-white/10 mb-1 flex items-center justify-between">
                    <span>{t('Community Hub & Portals', 'কমিউনিটি হাব ও পোর্টাল')}</span>
                    <Sparkles className="w-3 h-3 text-cyan-400" />
                  </div>

                  <button
                    onClick={() => {
                      setCurrentView('website');
                      setCommunityDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium text-left transition-colors ${
                      currentView === 'website'
                        ? 'bg-cyan-500/15 text-cyan-200 border border-cyan-400/30 font-semibold'
                        : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <ExternalLink className="w-4 h-4 text-cyan-400" />
                      <div>
                        <div className="font-semibold text-slate-100">{t('Public Website', 'পাবলিক ওয়েবসাইট')}</div>
                        <div className="text-[10px] text-slate-400">{t('Home, news, events & story', 'হোম, খবর, অনুষ্ঠান ও তথ্য')}</div>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setCommunityDropdownOpen(false);
                      handleNavClick('news');
                    }}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium text-left transition-colors text-slate-300 hover:text-white hover:bg-white/5"
                  >
                    <div className="flex items-center gap-2.5">
                      <FileText className="w-4 h-4 text-cyan-400" />
                      <div>
                        <div className="font-semibold text-slate-100">{t('Notices & Community Stories', 'নোটিশ ও খবর')}</div>
                        <div className="text-[10px] text-slate-400">{t('Village bulletins & updates', 'গ্রামের নোটিশ ও ঘোষণা')}</div>
                      </div>
                    </div>
                  </button>

                  {onOpenAppInstall && (
                    <button
                      onClick={() => {
                        setCommunityDropdownOpen(false);
                        onOpenAppInstall();
                      }}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium text-left transition-colors text-slate-300 hover:text-white hover:bg-white/5"
                    >
                      <div className="flex items-center gap-2.5">
                        <Download className="w-4 h-4 text-emerald-400" />
                        <div>
                          <div className="font-semibold text-slate-100">{t('Download & Install App', 'অ্যাপ ডাউনলোড ও ইনস্টল')}</div>
                          <div className="text-[10px] text-slate-400">{t('Add to home screen or desktop', 'হোম স্ক্রিন বা পিসিতে যুক্ত করুন')}</div>
                        </div>
                      </div>
                    </button>
                  )}

                  <div className="my-1 border-t border-white/10" />

                  <button
                    onClick={() => {
                      setCurrentView('member');
                      setCommunityDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium text-left transition-colors ${
                      currentView === 'member'
                        ? 'bg-emerald-500/15 text-emerald-200 border border-emerald-400/30 font-semibold'
                        : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Users className="w-4 h-4 text-emerald-400" />
                      <div>
                        <div className="font-semibold text-slate-100">{t('Member Portal', 'সদস্য পোর্টাল')}</div>
                        <div className="text-[10px] text-slate-400">
                          {isMemberUnlocked && currentMember
                            ? `${currentMember.name} (${currentMember.role})`
                            : t('Continue with Google required', 'Google দিয়ে লগইন প্রয়োজন')}
                        </div>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setCurrentView('admin');
                      setCommunityDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium text-left transition-colors ${
                      currentView === 'admin'
                        ? 'bg-emerald-500/15 text-emerald-200 border border-emerald-400/30 font-semibold'
                        : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Shield className="w-4 h-4 text-emerald-400" />
                      <div>
                        <div className="font-semibold text-slate-100">{t('Admin Dashboard', 'অ্যাডমিন ড্যাশবোর্ড')}</div>
                        <div className="text-[10px] text-slate-400">
                          {isAdminUnlocked && isAdminLoggedIn
                            ? t('Admin Workspace Active', 'অ্যাডমিন প্যানেল সক্রিয়')
                            : isAdminUnlocked && isPresidentViewOnly
                            ? t('President View-Only Mode', 'সভাপতি (শুধু দেখার অনুমতি)')
                            : t('Continue with Google · Admin & President', 'Google লগইন · অ্যাডমিন ও সভাপতি')}
                        </div>
                      </div>
                    </div>
                    {isAdminUnlocked && pendingRequestsCount > 0 && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold text-white bg-amber-600 rounded-md">
                        {pendingRequestsCount}
                      </span>
                    )}
                  </button>

                  <div className="border-t border-slate-100 dark:border-slate-800 mt-1 pt-1">
                    {isMemberUnlocked && currentMember ? (
                      <div className="px-3 py-2 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                        <div className="truncate max-w-[140px] text-emerald-900 dark:text-emerald-300 font-medium">
                          {currentMember.name}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setCommunityDropdownOpen(false);
                            logoutMember();
                          }}
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
                          <span>{t('Member Portal Login', 'সদস্য পোর্টাল লগইন')}</span>
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
              {isAdminUnlocked && pendingRequestsCount > 0 && !mobileMenuOpen && (
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
              <div className="mt-2 bg-white/95 dark:bg-[#0c1527]/95 backdrop-blur-md rounded-2xl shadow-xl border border-white/40 dark:border-white/10">
                {renderSearchResults()}
              </div>
            )}
          </div>
        )}

        {/* Mobile / Tablet Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="xl:hidden py-4 border-t border-cyan-500/20 space-y-2.5 animate-in fade-in duration-200 max-h-[calc(100dvh-4.5rem)] overflow-y-auto bg-[#050a0e]/95 backdrop-blur-2xl px-1">
            {/* View switcher for mobile */}
            <div className="grid grid-cols-2 gap-2 p-1.5 bg-white/5 border border-cyan-400/20 rounded-2xl mb-3">
              <button
                onClick={() => {
                  setCurrentView('website');
                  setMobileMenuOpen(false);
                }}
                className={`py-2 text-xs font-semibold rounded-xl transition-all ${
                  currentView === 'website' 
                    ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/40 shadow-[0_0_12px_rgba(34,211,238,0.3)]' 
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {t('Website', 'ওয়েবসাইট')}
              </button>
              <button
                onClick={() => {
                  setCurrentView('member');
                  setMobileMenuOpen(false);
                }}
                className={`py-2 text-xs font-semibold rounded-xl transition-all ${
                  currentView === 'member' 
                    ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/40 shadow-[0_0_12px_rgba(16,185,129,0.3)]' 
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {t('Member Panel', 'সদস্য')}
              </button>
              <button
                onClick={() => {
                  setCurrentView('admin');
                  setMobileMenuOpen(false);
                }}
                className={`col-span-2 py-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all ${
                  currentView === 'admin' 
                    ? 'bg-gradient-to-r from-cyan-600 to-emerald-600 text-white font-bold shadow-[0_0_15px_rgba(34,211,238,0.4)]' 
                    : 'bg-white/5 border border-cyan-400/20 text-cyan-200 hover:border-cyan-400/50'
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-cyan-300" />
                <span>{t('Admin Management Dashboard', 'অ্যাডমিন ড্যাশবোর্ড')}</span>
                {isAdminUnlocked && pendingRequestsCount > 0 && (
                  <span className="px-1.5 py-0.2 text-[10px] bg-amber-500 text-slate-950 font-bold rounded">
                    {pendingRequestsCount}
                  </span>
                )}
              </button>
            </div>

            {/* Theme switcher on mobile */}
            <div className="flex sm:hidden items-center justify-between px-3 py-2 bg-white/5 border border-cyan-400/20 rounded-xl">
              <span className="text-xs font-bold text-slate-300">{t('Theme:', 'থিম:')}</span>
              <div className="flex items-center gap-1">
                {themeOptions.map((opt) => {
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => setTheme(opt.id)}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-lg flex items-center gap-1 transition-all ${
                        theme === opt.id
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      <span>{t(opt.labelEn, opt.labelBn)}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {navItems.map(item => {
              const isActive = !isAppInstallOpen && currentView === 'website' && activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full text-left px-3.5 py-2.5 text-sm rounded-xl transition-all ${
                    isActive
                      ? 'bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 font-bold shadow-[0_0_12px_rgba(34,211,238,0.2)]'
                      : 'font-medium text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {t(item.mobileLabelEn, item.mobileLabelBn)}
                </button>
              );
            })}

            {onOpenAppInstall && (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAppInstall();
                }}
                className={`w-full text-left px-3.5 py-2.5 text-sm rounded-xl transition-all ${
                  isAppInstallOpen
                    ? 'bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 font-bold'
                    : 'font-medium text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                {t('Download', 'ডাউনলোড')}
              </button>
            )}

            <div className="pt-2 border-t border-white/10 flex gap-2">
              <button
                onClick={() => {
                  openModal('join');
                  setMobileMenuOpen(false);
                }}
                className="flex-1 py-2.5 text-center text-xs font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 rounded-xl shadow-[0_0_15px_rgba(34,211,238,0.3)]"
              >
                {t('Request Membership', 'সদস্যপদের আবেদন')}
              </button>
              <button
                onClick={() => {
                  openModal('login');
                  setMobileMenuOpen(false);
                }}
                className="py-2.5 px-4 text-xs font-semibold text-cyan-200 bg-white/5 hover:bg-white/10 border border-cyan-400/30 rounded-xl"
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
