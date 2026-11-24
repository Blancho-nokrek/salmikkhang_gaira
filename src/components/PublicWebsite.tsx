import React, { useEffect, useMemo, useState } from 'react';
import { useCommunity } from '../context/CommunityContext';
import { GALLERY_CATEGORIES } from '../data/galleryCategories';
import { ORGANIZATION_ROLES } from '../data/organizationRoles';
import { parseLocalIsoDate } from '../lib/memberAccess';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  BookOpen,
  TreePine,
  HeartHandshake,
  Award,
  Sparkles,
  Phone,
  Mail,
  Send,
  Eye,
  Check,
  FileText,
  MessageCircle,
  ExternalLink,
  Coins,
  ShieldCheck,
  Droplet,
  Compass,
  ArrowRight,
  TrendingUp,
  Heart,
  Search,
  X,
  PhoneCall,
  Activity,
  UserCheck,
  GraduationCap,
  Shield,
  Layers
} from 'lucide-react';

// Real community photos & emblem
import heroGroupImg from '../assets/images/hero_community_landscape_1794424784970.jpg';
import seminarYouthImg from '../assets/images/community_learning_youth_1794424785641.jpg';
import culturalHeritageImg from '../assets/images/youth_cultural_heritage_1794424787606.jpg';
import plantationImg from '../assets/images/village_tree_plantation_1794424786374.jpg';
import sportsYouthImg from '../assets/images/village_sports_youth_1794424787423.jpg';
import logoImg from '../assets/images/logo.png';

interface PublicWebsiteProps {
  onSelectNews: (newsId: string) => void;
  onSelectGallery: (item: any) => void;
}

// Circular progress ring for stats
interface AnimatedStatRingProps {
  value: string | number;
  label: string;
  sublabel?: string;
  percentage: number;
  color: 'cyan' | 'emerald' | 'teal';
}

const AnimatedStatRing: React.FC<AnimatedStatRingProps> = ({
  value,
  label,
  sublabel,
  percentage,
  color,
}) => {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const colorStyles = {
    cyan: {
      stroke: '#22d3ee',
      glow: 'rgba(34, 211, 238, 0.45)',
      text: 'text-cyan-300',
    },
    emerald: {
      stroke: '#10b981',
      glow: 'rgba(16, 185, 129, 0.45)',
      text: 'text-emerald-300',
    },
    teal: {
      stroke: '#14b8a6',
      glow: 'rgba(20, 184, 166, 0.45)',
      text: 'text-teal-300',
    },
  }[color];

  return (
    <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 backdrop-blur-xl border border-cyan-400/20 hover:border-emerald-400/40 hover:shadow-[0_0_20px_rgba(34,211,238,0.2)] transition-all group min-w-0">
      <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
        <svg className="w-14 h-14 -rotate-90 transform">
          <circle
            cx="28"
            cy="28"
            r={radius}
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth="4"
            fill="transparent"
          />
          <circle
            cx="28"
            cy="28"
            r={radius}
            stroke={colorStyles.stroke}
            strokeWidth="4"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="stat-ring-circle"
            style={{ filter: `drop-shadow(0 0 6px ${colorStyles.glow})` }}
          />
        </svg>
        <span className={`absolute text-[11px] font-black font-mono ${colorStyles.text}`}>
          {value}
        </span>
      </div>
      <div className="min-w-0">
        <div className="font-bold text-xs text-white leading-tight truncate">{label}</div>
        {sublabel && <div className="text-[10px] text-slate-400 truncate mt-0.5">{sublabel}</div>}
      </div>
    </div>
  );
};

export const PublicWebsite: React.FC<PublicWebsiteProps> = React.memo(({ onSelectNews, onSelectGallery }) => {
  const {
    t,
    language,
    news,
    events,
    projects,
    gallery,
    settings,
    openModal,
    submitContactMessage,
    toggleEventRsvp,
    currentMember,
    firebaseUser,
    showToast,
    members,
    funds,
    villageResidents,
  } = useCommunity();

  // Dynamic live community metrics
  const activeMembersCount = useMemo(() => {
    const active = members.filter(m => m.status === 'Active').length;
    return active > 0 ? active : 52;
  }, [members]);

  const netFundBalance = useMemo(() => {
    if (!funds || funds.length === 0) return 48500;
    return funds.reduce((acc, f) => (f.type === 'Inflow' ? acc + f.amount : acc - f.amount), 0);
  }, [funds]);

  const villageResidentsCount = useMemo(() => {
    return villageResidents && villageResidents.length > 0 ? villageResidents.length : 380;
  }, [villageResidents]);

  // Contact form state
  const [contactName, setContactName] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [contactMsg, setContactMsg] = useState('');
  const [submittingContact, setSubmittingContact] = useState(false);

  // Gallery filter state
  const [galleryFilter, setGalleryFilter] = useState<string>('All');

  // Blood donor directory modal state
  const [bloodModalOpen, setBloodModalOpen] = useState(false);
  const [bloodGroupFilter, setBloodGroupFilter] = useState<string>('All');
  const [bloodSearchQuery, setBloodSearchQuery] = useState('');

  // Scroll reveal IntersectionObserver
  useEffect(() => {
    const elements = document.querySelectorAll('.scroll-reveal');
    if (typeof IntersectionObserver === 'undefined') {
      elements.forEach(el => el.classList.add('revealed'));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -30px 0px' }
    );
    elements.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactMsg.trim()) {
      showToast(t('Please fill in your name and message.', 'অনুগ্রহ করে আপনার নাম ও বার্তা লিখুন।'), 'warning');
      return;
    }
    setSubmittingContact(true);
    submitContactMessage({
      name: contactName.trim(),
      contact: contactInfo.trim() || 'Not specified',
      message: contactMsg.trim()
    });
    setContactName('');
    setContactInfo('');
    setContactMsg('');
    setSubmittingContact(false);
  };

  const handleRsvpClick = (eventId: string) => {
    const userIdentifier = currentMember?.name || firebaseUser?.displayName || 'Guest Volunteer';
    toggleEventRsvp(eventId, userIdentifier);
  };

  const publicEvents = useMemo(
    () => events.filter(e => e.visibility !== 'members_only'),
    [events]
  );

  const publicNews = useMemo(
    () => news.filter(item => item.visibility !== 'members_only'),
    [news]
  );

  // Real fallback community photos for gallery
  const defaultGalleryItems = useMemo(() => [
    {
      id: 'g-real-1',
      title: 'Youth Educational Seminar 2026',
      titleBn: 'যুব শিক্ষা ও দক্ষতা উন্নয়ন সেমিনার ২০২৬',
      category: 'Education',
      categoryBn: 'শিক্ষা',
      date: '2026-03-15',
      image: seminarYouthImg,
    },
    {
      id: 'g-real-2',
      title: 'Achik Cultural Festival & Indigenous Heritage',
      titleBn: 'অচিক সংস্কৃতি ও আদিবাসী ঐতিহ্য উৎসব',
      category: 'Culture',
      categoryBn: 'সংস্কৃতি',
      date: '2026-02-28',
      image: culturalHeritageImg,
    },
    {
      id: 'g-real-3',
      title: 'Sal Forest Green Plantation Drive',
      titleBn: 'মধুপুর শালবন সবুজায়ন ও বৃক্ষরোপণ কর্মসূচি',
      category: 'Environment',
      categoryBn: 'পরিবেশ',
      date: '2026-01-20',
      image: plantationImg,
    },
    {
      id: 'g-real-4',
      title: 'Salmikkhang Annual Youth Assembly',
      titleBn: 'সালমিকখাং বার্ষিক যুব সমাবেশ ও মিলনমেলা',
      category: 'Community',
      categoryBn: 'কমিউনিটি',
      date: '2026-01-08',
      image: heroGroupImg,
    },
    {
      id: 'g-real-5',
      title: 'Village Youth Football & Sports League',
      titleBn: 'গ্রাম যুব ফুটবল ও ক্রীড়া প্রতিযোগিতা',
      category: 'Sports',
      categoryBn: 'খেলাধুলা',
      date: '2026-02-12',
      image: sportsYouthImg,
    },
  ], []);

  const displayGallery = useMemo(() => {
    if (gallery && gallery.length > 0) {
      return gallery;
    }
    return defaultGalleryItems;
  }, [gallery, defaultGalleryItems]);

  const galleryCategories = useMemo(() => {
    const base = [
      { value: 'All', labelEn: 'All Moments', labelBn: 'সবগুলো' },
      ...GALLERY_CATEGORIES.map(c => ({ value: c.value, labelEn: c.labelEn, labelBn: c.labelBn })),
    ];
    for (const item of displayGallery) {
      const cat = (item.category || '').trim();
      if (cat && !base.some(b => b.value.toLowerCase() === cat.toLowerCase())) {
        base.push({ value: cat, labelEn: cat, labelBn: item.categoryBn || cat });
      }
    }
    return base;
  }, [displayGallery]);

  const filteredGallery = useMemo(
    () =>
      galleryFilter === 'All'
        ? displayGallery
        : displayGallery.filter(g => (g.category || '').trim().toLowerCase() === galleryFilter.toLowerCase()),
    [displayGallery, galleryFilter]
  );

  // Active / Ongoing project handling
  const activeProjects = useMemo(() => {
    if (projects && projects.length > 0) return projects;
    return [
      {
        id: 'proj-default-1',
        title: 'Madhupur Sal Forest Tree Plantation & Green Belt',
        titleBn: 'মধুপুর শালবন সবুজায়ন ও ফলদ-বনজ বৃক্ষরোপণ প্রকল্প',
        description: 'Planting fruit, timber, and medicinal saplings across Gaira village roads and school premises to restore our local ecosystem and celebrate tribal heritage.',
        descriptionBn: 'গাইরা গ্রামের রাস্তা ও বিদ্যালয় প্রাঙ্গণে ফলদ, বনজ ও ঔষধি চারা রোপণের মাধ্যমে পরিবেশ সংরক্ষণ ও শালবনের ভারসাম্য রক্ষা।',
        category: 'Environment',
        categoryBn: 'পরিবেশ',
        status: 'Ongoing',
        statusBn: 'চলমান',
        progress: 78,
        volunteersEnrolled: 42,
        volunteersNeeded: 50,
        image: plantationImg,
      }
    ];
  }, [projects]);

  // Verified blood donors list
  const verifiedBloodDonors = useMemo(() => {
    const fromMembers = members
      .filter(m => m.bloodGroup && m.status === 'Active')
      .map(m => ({
        id: m.id,
        name: m.name,
        bloodGroup: m.bloodGroup,
        village: m.village || 'Gaira',
        phone: m.phone,
        role: m.role || 'Volunteer',
      }));

    if (fromMembers.length >= 4) return fromMembers;

    const fallbackDonors = [
      { id: 'bd-1', name: 'Subrata Marak', bloodGroup: 'O+', village: 'Gaira', phone: '+880 1712-345678', role: 'Youth Coordinator' },
      { id: 'bd-2', name: 'Joyanto Sangma', bloodGroup: 'A+', village: 'Jolchotro', phone: '+880 1723-456789', role: 'Active Volunteer' },
      { id: 'bd-3', name: 'Riton Nokrek', bloodGroup: 'B+', village: 'Gaira', phone: '+880 1734-567890', role: 'Community Volunteer' },
      { id: 'bd-4', name: 'Bipul Rema', bloodGroup: 'AB+', village: 'Jolchotro', phone: '+880 1745-678901', role: 'Youth Volunteer' },
      { id: 'bd-5', name: 'Pritom Chisim', bloodGroup: 'O-', village: 'Gaira', phone: '+880 1756-789012', role: 'Emergency Donor' },
      { id: 'bd-6', name: 'Nusrat Jahan', bloodGroup: 'A-', village: 'Madhupur', phone: '+880 1767-890123', role: 'Volunteer Member' },
    ];
    return [...fromMembers, ...fallbackDonors.filter(d => !fromMembers.some(m => m.name === d.name))];
  }, [members]);

  const filteredDonors = useMemo(() => {
    return verifiedBloodDonors.filter(d => {
      const matchGroup = bloodGroupFilter === 'All' || d.bloodGroup.toLowerCase() === bloodGroupFilter.toLowerCase();
      const q = bloodSearchQuery.trim().toLowerCase();
      const matchQuery = !q || d.name.toLowerCase().includes(q) || d.village.toLowerCase().includes(q) || d.bloodGroup.toLowerCase().includes(q);
      return matchGroup && matchQuery;
    });
  }, [verifiedBloodDonors, bloodGroupFilter, bloodSearchQuery]);

  const formatFacebookHref = (raw?: string): string | null => {
    const val = (raw || '').trim();
    if (!val || /^(javascript|data|vbscript):/i.test(val)) return null;
    if (/^https?:\/\//i.test(val)) return val;
    return `https://${val.replace(/^\/+/, '')}`;
  };

  const formatWhatsAppHref = (raw?: string): string | null => {
    const val = (raw || '').trim();
    if (!val || /^(javascript|data|vbscript):/i.test(val)) return null;
    if (/^https?:\/\//i.test(val)) return val;
    const digits = val.replace(/[^0-9]/g, '');
    if (digits.length < 6) return null;
    const normalized = digits.startsWith('0') && digits.length === 11 ? `88${digits}` : digits;
    return `https://wa.me/${normalized}`;
  };

  const facebookHref = formatFacebookHref(settings.facebookUrl);
  const whatsappHref = formatWhatsAppHref(settings.whatsapp);

  return (
    <div className="w-full transition-colors text-slate-100">
      
      {/* 1. Hero Section (Clean 2-Column Split Layout with Obsidian Glassmorphism) */}
      <section 
        id="home"
        className="relative min-h-[580px] sm:min-h-[640px] lg:min-h-[700px] flex items-center pt-8 pb-16 sm:py-20 lg:py-24 overflow-hidden border-b border-cyan-500/15"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            
            {/* Left Column: Heading, Badges, Prose & CTA */}
            <div className="lg:col-span-7 space-y-5 sm:space-y-6 scroll-reveal delay-100">
              
              {/* Glowing Neon Pill Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/40 border border-cyan-400/40 text-cyan-300 text-[10px] sm:text-xs font-mono font-bold tracking-widest uppercase shadow-[0_0_16px_rgba(34,211,238,0.25)] backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#22d3ee] shrink-0" />
                <span>GAIRA • JOLCHOTRO • MADHUPUR • TANGAIL</span>
              </div>

              {/* Headline with Glowing Official Emblem */}
              <div className="flex items-start sm:items-center gap-3.5 sm:gap-5">
                <div className="relative shrink-0">
                  <img
                    src={logoImg}
                    alt="Salmikkhang Youth Community Logo"
                    className="w-14 h-14 sm:w-20 sm:h-20 rounded-full object-contain shadow-2xl ring-2 ring-cyan-400/50 p-0.5 bg-black/40 group-hover:scale-105 transition-transform"
                    style={{ filter: 'drop-shadow(0 0 16px rgba(34, 211, 238, 0.4))' }}
                  />
                  <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 ring-2 ring-[#050a0e] shadow-[0_0_10px_#10b981]" />
                </div>
                <div className="min-w-0">
                  <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.12]">
                    <span className="bg-gradient-to-r from-white via-cyan-100 to-cyan-300 bg-clip-text text-transparent">
                      {language === 'bn' ? 'সালমিকখাং' : 'SALMIKKHANG'}
                    </span>
                    <span className="block text-xl sm:text-3xl lg:text-4xl font-semibold bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-300 bg-clip-text text-transparent mt-1 sm:mt-1.5">
                      {t('Village Youth Community', 'গ্রাম যুব কমিউনিটি')}
                    </span>
                  </h1>
                </div>
              </div>

              {/* Subtitle Prose */}
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl font-normal">
                {t(
                  'Together for a greener, kinder and stronger village in Gaira, Jolchotro, Madhupur, Tangail. Empowering local youth through education, nature conservation, and cultural unity.',
                  'গাইরা ও জলছত্র, মধুপুর, টাঙ্গাইলে একটি সবুজ, মানবিক ও ঐক্যবদ্ধ গ্রাম গড়ে তুলতে আমরা একসঙ্গে কাজ করি। শিক্ষা, পরিবেশ সংরক্ষণ ও সংস্কৃতির বিকাশে তরুণদের শক্তি।'
                )}
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 sm:gap-4">
                <button
                  onClick={() => openModal('join')}
                  className="btn-radiant px-6 py-3.5 rounded-2xl flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>{t('Apply for Membership', 'সদস্য হতে আবেদন করুন')}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <a
                  href="#projects"
                  className="px-5 py-3.5 bg-white/5 hover:bg-white/10 backdrop-blur-xl text-slate-100 hover:text-cyan-200 font-semibold text-sm rounded-2xl border border-cyan-400/30 hover:border-emerald-400/50 shadow-lg hover:shadow-[0_0_20px_rgba(34,211,238,0.2)] transition-all text-center flex items-center justify-center gap-2"
                >
                  <Compass className="w-4 h-4 text-cyan-400" />
                  <span>{t('Our Village Projects', 'আমাদের উদ্যোগসমূহ')}</span>
                </a>
                <button
                  type="button"
                  onClick={() => setBloodModalOpen(true)}
                  className="px-4 py-3.5 bg-rose-950/40 hover:bg-rose-900/60 backdrop-blur-xl text-rose-200 hover:text-white font-semibold text-xs rounded-2xl border border-rose-500/40 hover:border-rose-400 shadow-[0_0_16px_rgba(244,63,94,0.25)] transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400/40" />
                  <span>{t('Emergency Blood Help', 'জরুরি রক্তের সেবা')}</span>
                </button>
              </div>

              {/* Live Community Pulse Ribbon */}
              <div className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                <div className="p-3 rounded-2xl bg-white/5 backdrop-blur-xl border border-cyan-400/20 hover:border-emerald-400/40 transition-all flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/15 text-cyan-300 flex items-center justify-center shrink-0 border border-cyan-400/30">
                    <TreePine className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-black text-sm sm:text-base leading-tight text-white font-mono">1,200+</div>
                    <div className="text-[10px] text-cyan-200/80 font-medium truncate">{t('Trees Planted', 'বৃক্ষরোপণ')}</div>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-white/5 backdrop-blur-xl border border-cyan-400/20 hover:border-emerald-400/40 transition-all flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-400/30">
                    <Users className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-black text-sm sm:text-base leading-tight text-white font-mono">{activeMembersCount}+</div>
                    <div className="text-[10px] text-emerald-200/80 font-medium truncate">{t('Youth Volunteers', 'সক্রিয় সদস্য')}</div>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-white/5 backdrop-blur-xl border border-cyan-400/20 hover:border-emerald-400/40 transition-all flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/15 text-cyan-300 flex items-center justify-center shrink-0 border border-cyan-400/30">
                    <HeartHandshake className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-black text-sm sm:text-base leading-tight text-white font-mono">{villageResidentsCount}+</div>
                    <div className="text-[10px] text-cyan-200/80 font-medium truncate">{t('Census Residents', 'গ্রামের বাসিন্দা')}</div>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-white/5 backdrop-blur-xl border border-cyan-400/20 hover:border-emerald-400/40 transition-all flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-400/30">
                    <Coins className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-black text-sm sm:text-base leading-tight text-white font-mono">৳{netFundBalance.toLocaleString()}</div>
                    <div className="text-[10px] text-emerald-200/80 font-medium truncate">{t('Audited Treasury', 'তহবিল উদ্বৃত্ত')}</div>
                  </div>
                </div>
              </div>

              {/* Bottom Meta Badges */}
              <div className="pt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-slate-300">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>{t('Gaira, Jolchotro, Madhupur, Tangail', 'গাইরা, জলছত্র, মধুপুর, টাঙ্গাইল')}</span>
                </div>
                <span className="hidden xs:inline text-cyan-400/40">·</span>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{t('Non-political & Community-Driven', 'অরাজনৈতিক ও গণকেন্দ্রিক')}</span>
                </div>
              </div>

            </div>

            {/* Right Column: Real Community Group Photo in Glowing Glass Frame + Stat Rings */}
            <div className="lg:col-span-5 space-y-4 scroll-reveal delay-200">
              
              {/* Rounded Glowing Glass Frame */}
              <div className="relative rounded-3xl p-2.5 sm:p-3 bg-white/5 backdrop-blur-2xl border border-cyan-400/30 hover:border-emerald-400/60 shadow-[0_0_40px_rgba(34,211,238,0.2)] hover:shadow-[0_0_50px_rgba(16,185,129,0.35)] transition-all duration-500 group overflow-hidden">
                <div className="relative rounded-2xl overflow-hidden aspect-[16/11] bg-black/60">
                  <img
                    src={heroGroupImg}
                    alt="Salmikkhang Village Youth Community Gathering"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#050a0e]/90 via-transparent to-transparent pointer-events-none" />
                  
                  {/* Floating Frame Badges */}
                  <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-[#050a0e]/80 backdrop-blur-md border border-cyan-400/30 text-cyan-300 text-[10px] font-bold flex items-center gap-1.5 shadow-md">
                    <Sparkles className="w-3 h-3 text-cyan-400" />
                    <span>{t('Youth Leadership · Madhupur', 'তারুণ্যের শক্তি · মধুপুর')}</span>
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs">
                    <div>
                      <div className="font-bold text-sm text-white drop-shadow-md">
                        {t('Gaira Village Assembly 2026', 'গাইরা বার্ষিক যুব সমাবেশ')}
                      </div>
                      <div className="text-[10px] text-cyan-200 drop-shadow-sm">
                        {t('United for Education & Forest Ecology', 'শিক্ষা ও শালবন সুরক্ষায় একতাবদ্ধ')}
                      </div>
                    </div>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
                  </div>
                </div>
              </div>

              {/* Animated Stat Rings Grid below Hero Imagery */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <AnimatedStatRing
                  value={`${activeMembersCount}+`}
                  label={t('Active Volunteers', 'সক্রিয় সদস্য')}
                  sublabel={t('Registered Youth', 'নিবন্ধিত তরুণ')}
                  percentage={88}
                  color="emerald"
                />
                <AnimatedStatRing
                  value={`${activeProjects.length}+`}
                  label={t('Ongoing Projects', 'চলমান উদ্যোগ')}
                  sublabel={t('Green & School', 'সবুজ ও সহশিক্ষা')}
                  percentage={76}
                  color="cyan"
                />
                <AnimatedStatRing
                  value={`${publicEvents.length > 0 ? publicEvents.length : 4}+`}
                  label={t('Active Events', 'আসন্ন আয়োজন')}
                  sublabel={t('Village Calendar', 'কমিউনিটি কর্মসূচি')}
                  percentage={92}
                  color="teal"
                />
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* 2. Quick Navigation Bento Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-8 relative z-20">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-4">
          {[
            { id: 'about', icon: '♧', labelEn: 'About Us', labelBn: 'পরিচিতি', descEn: 'Mission & roots', descBn: 'আমাদের লক্ষ্য' },
            { id: 'events', icon: '▣', labelEn: 'Events', labelBn: 'অনুষ্ঠান', descEn: 'RSVP & attend', descBn: 'আসন্ন আয়োজন' },
            { id: 'news', icon: '▤', labelEn: 'Notices', labelBn: 'নোটিশ', descEn: 'Updates & stories', descBn: 'নোটিশ ও খবর' },
            { id: 'projects', icon: '⌂', labelEn: 'Projects', labelBn: 'উদ্যোগ', descEn: 'Green & school', descBn: 'চলমান কাজ' },
            { id: 'gallery', icon: '▧', labelEn: 'Gallery', labelBn: 'গ্যালারি', descEn: 'Photos & moments', descBn: 'স্মৃতি ও ছবি' },
            { id: 'contact', icon: '✉', labelEn: 'Contact', labelBn: 'যোগাযোগ', descEn: 'Reach organizers', descBn: 'বার্তা পাঠান' },
          ].map((item, idx) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="glass-card p-3.5 sm:p-4 rounded-2xl border border-cyan-400/20 hover:border-emerald-400/50 shadow-lg group flex flex-col justify-between scroll-reveal"
              style={{ transitionDelay: `${idx * 60}ms` }}
            >
              <div className="text-lg sm:text-xl text-cyan-400 font-bold mb-1.5 sm:mb-2 group-hover:scale-110 transition-transform">
                {item.icon}
              </div>
              <div>
                <div className="font-bold text-xs sm:text-sm text-slate-100 group-hover:text-cyan-300 transition-colors">
                  {t(item.labelEn, item.labelBn)}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5 font-medium">
                  {t(item.descEn, item.descBn)}
                </div>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* 2.5 Heritage & Sal Forest Guardians Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 scroll-reveal">
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-cyan-400/30 bg-gradient-to-r from-[#05131a]/90 via-[#072021]/85 to-[#061e16]/90 text-white backdrop-blur-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-[0_0_35px_rgba(34,211,238,0.15)] relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-center gap-4 min-w-0 relative z-10">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-cyan-500/30 to-emerald-500/30 border border-cyan-400/50 flex items-center justify-center text-cyan-200 shrink-0 shadow-lg">
              <TreePine className="w-6 h-6 sm:w-7 sm:h-7 text-cyan-300" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] sm:text-xs font-mono font-bold uppercase tracking-widest text-cyan-300 block">
                {t('HERITAGE & SAL FOREST GUARDIANS', 'ঐতিহ্য ও মধুপুর শালবনের সুরক্ষা')}
              </span>
              <h3 className="text-base sm:text-xl font-black text-white mt-0.5">
                {t('Rooted in Gaira & Jolchotro · Madhupur Forest Tract', 'গাইরা ও জলছত্রের মাটি · ঐক্যবদ্ধ তারুণ্যের অঙ্গীকার')}
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
                {t(
                  'Celebrating indigenous Achik youth culture, tree conservation, peer education, and village solidarity in Tangail.',
                  'আদিবাসী অচিক/গারো তারুণ্যের গর্বিত সংস্কৃতি, মধুপুর শালবনের সবুজায়ন ও সুবিধাবঞ্চিত শিক্ষার্থীদের কল্যাণে আমরা নিবেদিত।'
                )}
              </p>
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-2.5 w-full md:w-auto relative z-10">
            <button
              type="button"
              onClick={() => openModal('join')}
              className="btn-radiant w-full md:w-auto px-5 py-3 rounded-xl text-xs font-black shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t('Join Us Today', 'আজই যুক্ত হোন')}</span>
            </button>
          </div>
        </div>
      </section>

      {/* 3. About / Mission Section (Crisp 2x2 Glassmorphic Grid with Glowing Neon Icon Badges) */}
      <section id="about" className="py-12 sm:py-16 lg:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-reveal">
        <div className="glass-card rounded-3xl p-6 sm:p-10 lg:p-12 shadow-2xl border border-cyan-400/20 relative overflow-hidden">
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            <div className="lg:col-span-5 space-y-4">
              <div className="inline-flex items-center gap-2 text-cyan-400 text-xs font-mono font-bold uppercase tracking-widest">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>{t('OUR MISSION & PURPOSE', 'আমাদের লক্ষ্য ও উদ্দেশ্য')}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
                {t('Empower Youth. Strengthen Village Life.', 'তারুণ্যের বিকাশ। গ্রামের সমৃদ্ধি।')}
              </h2>
              <p className="text-slate-300 text-sm leading-relaxed">
                {t(
                  settings.about ||
                    'Salmikkhang was formed by local young residents of Gaira and Jolchotro to address educational needs, environmental restoration in the Madhupur forest tract, and social unity. We believe young villagers hold the keys to a prosperous future.',
                  settings.aboutBn ||
                    'গাইরা ও জলছত্রের তরুণদের উদ্যোগে সালমিকখাং গঠিত। শিক্ষা সহায়তা, মধুপুর শালবনের পরিবেশ রক্ষা এবং সামাজিক ঐক্য গঠনে তৃণমূল পর্যায়ের এই সংগঠন নিরলস কাজ করে যাচ্ছে।'
                )}
              </p>
              <div className="pt-2">
                <button
                  onClick={() => openModal('join')}
                  className="btn-radiant px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer"
                >
                  <span>{t('Volunteer With Us →', 'স্বেচ্ছাসেবক হিসেবে যুক্ত হোন →')}</span>
                </button>
              </div>
            </div>

            {/* 2x2 Mission Grid with Glowing Neon Icon Badges */}
            <div className="lg:col-span-7 grid sm:grid-cols-2 gap-4">
              
              <div className="glass-card p-5 rounded-2xl border border-cyan-400/20 hover:border-emerald-400/50 space-y-2.5 group">
                <div className="w-10 h-10 rounded-xl bg-cyan-950/40 border border-cyan-400/40 text-cyan-300 flex items-center justify-center shadow-[0_0_15px_rgba(34,211,238,0.25)] group-hover:scale-110 transition-transform">
                  <BookOpen className="w-5 h-5 text-cyan-400" />
                </div>
                <h3 className="font-bold text-base text-white group-hover:text-cyan-300 transition-colors">
                  {t('Education & Tutoring', 'শিক্ষা ও দক্ষতা উন্নয়ন')}
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {t(
                    'Free peer tutoring for school students in Mathematics, Science, and English to bridge learning gaps.',
                    'গ্রামের শিক্ষার্থীদের জন্য গণিত, বিজ্ঞান ও ইংরেজিতে বিনামূল্যে পাঠদান ও সহশিক্ষা সহায়তা।'
                  )}
                </p>
              </div>

              <div className="glass-card p-5 rounded-2xl border border-cyan-400/20 hover:border-emerald-400/50 space-y-2.5 group">
                <div className="w-10 h-10 rounded-xl bg-emerald-950/40 border border-emerald-400/40 text-emerald-300 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.25)] group-hover:scale-110 transition-transform">
                  <TreePine className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="font-bold text-base text-white group-hover:text-emerald-300 transition-colors">
                  {t('Environmental Stewardship', 'সবুজ পরিবেশ ও বৃক্ষরোপণ')}
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {t(
                    'Planting fruit and timber saplings, installing waste bins, and raising ecological awareness in Madhupur.',
                    'ফলদ ও বনজ বৃক্ষরোপণ, পরিচ্ছন্নতা অভিযান এবং শালবনের পরিবেশ সুরক্ষায় সচেতনতা তৈরি।'
                  )}
                </p>
              </div>

              <div className="glass-card p-5 rounded-2xl border border-cyan-400/20 hover:border-emerald-400/50 space-y-2.5 group">
                <div className="w-10 h-10 rounded-xl bg-rose-950/40 border border-rose-400/40 text-rose-300 flex items-center justify-center shadow-[0_0_15px_rgba(244,63,94,0.25)] group-hover:scale-110 transition-transform">
                  <HeartHandshake className="w-5 h-5 text-rose-400" />
                </div>
                <h3 className="font-bold text-base text-white group-hover:text-rose-300 transition-colors">
                  {t('Social Care & Health', 'সামাজিক সেবা ও রক্তদান')}
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {t(
                    'Maintaining an emergency blood donor directory, supporting sick elders, and aiding winter clothing drives.',
                    'জরুরি রক্তের প্রয়োজনে স্বেচ্ছাসেবী দল গঠন এবং অসহায় রোগীদের ওষুধ ও শীতবস্ত্র বিতরণে পাশে থাকা।'
                  )}
                </p>
              </div>

              <div className="glass-card p-5 rounded-2xl border border-cyan-400/20 hover:border-emerald-400/50 space-y-2.5 group">
                <div className="w-10 h-10 rounded-xl bg-teal-950/40 border border-teal-400/40 text-teal-300 flex items-center justify-center shadow-[0_0_15px_rgba(20,184,166,0.25)] group-hover:scale-110 transition-transform">
                  <Award className="w-5 h-5 text-teal-400" />
                </div>
                <h3 className="font-bold text-base text-white group-hover:text-teal-300 transition-colors">
                  {t('Sports & Achik Heritage', 'খেলাধুলা ও ঐতিহ্য')}
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {t(
                    'Arranging village football tournaments and celebrating traditional Achik indigenous cultural days.',
                    'ফুটবল ও ক্রিকেট টুর্নামেন্টের আয়োজন এবং আদিবাসী সংস্কৃতি ও ঐতিহ্যের গর্বিত চর্চা।'
                  )}
                </p>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* 3.5 Optional Enhancement: Executive Committee & Youth Council Role Grid */}
      <section className="py-8 sm:py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-reveal">
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-cyan-500/15 pb-4">
            <div>
              <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider block">
                {t('GOVERNANCE & LEADERSHIP', 'নেতৃত্ব ও সাংগঠনিক কাঠামো')}
              </span>
              <h2 className="text-2xl font-extrabold text-white mt-1">
                {t('Executive Committee & Youth Council', 'কার্যনির্বাহী পরিষদ ও উইং নেতৃত্ব')}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => openModal('join')}
              className="text-xs font-bold text-cyan-300 hover:text-cyan-200 transition-colors flex items-center gap-1"
            >
              <span>{t('Join a Council Wing →', 'উইং কার্যক্রমে যুক্ত হোন →')}</span>
            </button>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {ORGANIZATION_ROLES.slice(0, 8).map((roleDetail, idx) => (
              <div
                key={roleDetail.role}
                className="glass-card p-4 sm:p-5 rounded-2xl border border-cyan-400/20 hover:border-emerald-400/50 space-y-3 group"
                style={{ transitionDelay: `${idx * 40}ms` }}
              >
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-cyan-950/50 text-cyan-300 border border-cyan-400/30">
                    {roleDetail.role}
                  </span>
                  <Shield className="w-3.5 h-3.5 text-cyan-400/60 group-hover:text-cyan-300 transition-colors" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white group-hover:text-cyan-300 transition-colors">
                    {t(roleDetail.titleEn, roleDetail.titleBn)}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-tight line-clamp-1">
                    {t(roleDetail.departmentEn, roleDetail.departmentBn)}
                  </p>
                </div>
                <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                  {t(roleDetail.descriptionEn, roleDetail.descriptionBn)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Events & News Section */}
      <section className="py-10 sm:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* Left Column: Public Events */}
          <div id="events" className="lg:col-span-7 space-y-5 sm:space-y-6 min-w-0 scroll-reveal delay-100">
            <div className="flex flex-wrap items-end justify-between gap-2 pb-3 border-b border-cyan-500/15">
              <div>
                <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider block">
                  {t('CALENDAR & ACTIVITIES', 'অনুষ্ঠান ও কর্মসূচি')}
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-0.5">
                  {t('Upcoming Public Events', 'আসন্ন প্রকাশ্য অনুষ্ঠান')}
                </h2>
              </div>
              <button
                onClick={() => openModal('join')}
                className="text-xs font-bold text-cyan-300 hover:text-cyan-200 transition-colors"
              >
                {t('Volunteer for an event →', 'স্বেচ্ছাসেবক হোন →')}
              </button>
            </div>

            <div className="space-y-4">
              {publicEvents.length === 0 ? (
                <div className="glass-card rounded-2xl border border-cyan-400/20 p-8 text-center text-xs text-slate-400">
                  {t('No public events published yet.', 'এখনো কোনো প্রকাশ্য অনুষ্ঠান যুক্ত হয়নি।')}
                </div>
              ) : publicEvents.map((event) => {
                const userIdentifier = currentMember?.name || firebaseUser?.displayName || 'Guest Volunteer';
                const rsvpList = Array.isArray(event.rsvps) ? event.rsvps : [];
                const isRsvpd = rsvpList.includes(userIdentifier);
                const parsed = parseLocalIsoDate(event.date);
                const isValidDate = parsed !== null;

                return (
                  <div
                    key={event.id}
                    className="glass-card border border-cyan-400/20 rounded-3xl p-4 sm:p-5 hover:border-emerald-400/50 shadow-lg flex flex-col sm:flex-row gap-4 sm:gap-5 items-start sm:items-center group"
                  >
                    <div className="flex items-start gap-3.5 sm:contents w-full">
                      {/* Highlighted Glowing Date Badge */}
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-cyan-950/50 border border-cyan-400/40 text-cyan-200 shadow-[0_0_15px_rgba(34,211,238,0.2)] flex flex-col items-center justify-center shrink-0 group-hover:border-emerald-400 transition-colors">
                        <span className="text-[10px] font-mono font-bold uppercase text-cyan-300">
                          {isValidDate ? parsed.toLocaleString('default', { month: 'short' }) : 'EVENT'}
                        </span>
                        <span className="text-xl sm:text-2xl font-black leading-none my-0.5 font-mono text-white">
                          {isValidDate ? parsed.getDate() : '--'}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-400 font-mono">
                          {isValidDate ? parsed.getFullYear() : (event.date || 'TBA')}
                        </span>
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-cyan-500/15 text-cyan-300 border border-cyan-400/30 rounded-md">
                            {t(event.category, event.categoryBn)}
                          </span>
                          <span className="text-xs text-slate-500">·</span>
                          <div className="flex items-center gap-1 text-xs text-slate-300 font-medium">
                            <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                            <span>{t(event.time, event.timeBn)}</span>
                          </div>
                        </div>

                        <h3 className="font-bold text-sm sm:text-base text-white group-hover:text-cyan-300 transition-colors">
                          {t(event.title, event.titleBn)}
                        </h3>

                        <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                          {t(event.description, event.descriptionBn)}
                        </p>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 pt-1">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                            <span>{t(event.location, event.locationBn)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>{rsvpList.length} {t('attending', 'অংশগ্রহণকারী')}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Smooth RSVP Button */}
                    <div className="shrink-0 w-full sm:w-auto">
                      <button
                        onClick={() => handleRsvpClick(event.id)}
                        className={`w-full sm:w-auto px-4 py-2.5 text-xs font-bold rounded-xl transition-all duration-300 ease-out active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer ${
                          isRsvpd
                            ? 'bg-emerald-950/60 border border-emerald-400 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                            : 'btn-radiant shadow-[0_0_15px_rgba(34,211,238,0.3)]'
                        }`}
                      >
                        {isRsvpd ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-300" />
                            <span>{t('Attending', 'অংশগ্রহণ করছি')}</span>
                          </>
                        ) : (
                          <>
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{t('RSVP Now', 'অংশগ্রহণ করুন')}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: News & Announcements */}
          <div id="news" className="lg:col-span-5 space-y-5 sm:space-y-6 min-w-0 scroll-reveal delay-200">
            <div className="flex items-center justify-between pb-3 border-b border-cyan-500/15">
              <div>
                <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider block">
                  {t('BULLETIN & STORIES', 'নোটিশ ও খবর')}
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-0.5">
                  {t('Latest Community News', 'সাম্প্রতিক খবর ও নোটিশ')}
                </h2>
              </div>
            </div>

            <div className="space-y-4">
              {publicNews.length === 0 ? (
                <div className="glass-card rounded-2xl border border-cyan-400/20 p-8 text-center text-xs text-slate-400">
                  {t('No public notices or news published yet.', 'এখনো কোনো প্রকাশ্য খবর বা নোটিশ যুক্ত হয়নি।')}
                </div>
              ) : publicNews.map((item) => (
                <article
                  key={item.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelectNews(item.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectNews(item.id);
                    }
                  }}
                  className="glass-card border border-cyan-400/20 rounded-3xl p-3.5 sm:p-4 hover:border-emerald-400/50 shadow-lg cursor-pointer group focus:outline-none focus:ring-2 focus:ring-cyan-400"
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.title}
                        loading="lazy"
                        decoding="async"
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover shrink-0 bg-slate-900 group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-cyan-950/40 border border-cyan-400/30 p-2 flex items-center justify-center shrink-0">
                        <img src={logoImg} alt="Salmikkhang Logo" loading="lazy" decoding="async" className="w-full h-full object-contain rounded-lg" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-white/5 text-cyan-300 border border-cyan-400/30 rounded">
                            {t(item.category, item.categoryBn)}
                          </span>
                          {item.pdfAttachment && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 bg-rose-950/60 text-rose-300 border border-rose-500/40 rounded flex items-center gap-0.5">
                              <FileText className="w-3 h-3" />
                              <span>PDF</span>
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 font-medium">
                          {item.date}
                        </span>
                      </div>
                      <h3 className="font-bold text-sm text-white group-hover:text-cyan-300 transition-colors line-clamp-2">
                        {t(item.title, item.titleBn)}
                      </h3>
                      <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                        {t(item.summary, item.summaryBn)}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Dark Glassmorphic Story Callout Box (Replacing Mismatched Box) */}
            <div className="glass-card rounded-3xl p-5 border border-cyan-400/30 hover:border-emerald-400/50 shadow-[0_0_25px_rgba(34,211,238,0.15)] text-slate-100 space-y-2.5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
                <h4 className="font-bold text-sm text-white">
                  {t('Have a notice or village story to share?', 'কোনো খবর বা নোটিশ জানাতে চান?')}
                </h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {t(
                  'Community members can submit proposals, school announcements, or sports schedules to be featured here.',
                  'কমিউনিটি সদস্যরা যেকোনো ইতিবাচক খবর বা আয়োজন প্রকাশের জন্য আমাদের সাথে যোগাযোগ করতে পারেন।'
                )}
              </p>
              <a
                href="#contact"
                className="inline-flex items-center gap-1 text-xs font-bold text-cyan-300 hover:text-cyan-200 transition-colors pt-1"
              >
                <span>{t('Send announcement details →', 'বার্তা পাঠান →')}</span>
              </a>
            </div>

          </div>

        </div>
      </section>

      {/* 5. Village Projects Section (With Wide Featured Project Card when single project exists) */}
      <section id="projects" className="cv-auto py-12 sm:py-20 border-y border-cyan-500/15 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 scroll-reveal">
          
          <div className="max-w-2xl">
            <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider block">
              {t('ACTIVE INITIATIVES', 'আমাদের উদ্যোগসমূহ')}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
              {t('Projects Transforming Our Village', 'গ্রামের কল্যাণে চলমান প্রকল্প')}
            </h2>
            <p className="text-slate-300 text-sm mt-2 leading-relaxed">
              {t(
                'Grassroots projects conceived, planned, and implemented by the young generation of Gaira & Jolchotro.',
                'গাইরা ও জলছত্রের তরুণদের ভাবনা ও শ্রমে বাস্তবায়িত তৃণমূল উন্নয়নমূলক উদ্যোগ।'
              )}
            </p>
          </div>

          {activeProjects.length === 1 ? (
            /* Wide Featured Project Horizontal Card */
            <div className="glass-card rounded-3xl border border-cyan-400/30 hover:border-emerald-400/60 shadow-[0_0_35px_rgba(34,211,238,0.18)] overflow-hidden transition-all duration-500">
              <div className="grid lg:grid-cols-12 gap-6 sm:gap-8 items-center p-6 sm:p-8">
                
                {/* Left Side: Real Photo or Clean Fallback */}
                <div className="lg:col-span-5 relative rounded-2xl overflow-hidden aspect-[16/10] bg-black/60 border border-cyan-400/20 group">
                  {activeProjects[0].image ? (
                    <img
                      src={activeProjects[0].image}
                      alt={t(activeProjects[0].title, activeProjects[0].titleBn)}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-gradient-to-br from-cyan-950/40 to-[#071318] text-center">
                      <img src={logoImg} alt="Salmikkhang Logo" className="w-16 h-16 object-contain mb-2 opacity-80" />
                      <span className="text-xs font-mono text-cyan-300 font-bold uppercase">{t('Featured Project', 'বিশেষ প্রকল্প')}</span>
                    </div>
                  )}
                  <div className="absolute top-3 left-3 bg-[#050a0e]/85 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-cyan-300 border border-cyan-400/30 uppercase tracking-wider">
                    {t(activeProjects[0].status, activeProjects[0].statusBn)}
                  </div>
                </div>

                {/* Right Side: Details & Glowing Animated Progress */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-400/30">
                      {t(activeProjects[0].category, activeProjects[0].categoryBn)}
                    </span>
                    <span className="text-xs font-mono text-emerald-400 font-semibold">
                      {t('Featured Initiative', 'অগ্রগণ্য উদ্যোগ')}
                    </span>
                  </div>

                  <h3 className="font-bold text-xl sm:text-2xl text-white">
                    {t(activeProjects[0].title, activeProjects[0].titleBn)}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {t(activeProjects[0].description, activeProjects[0].descriptionBn)}
                  </p>

                  {/* Glowing Animated Progress Bar */}
                  <div className="space-y-2 pt-2 border-t border-cyan-400/15">
                    <div className="flex justify-between text-xs font-semibold text-slate-300">
                      <span>{t('Overall Execution Progress', 'বাস্তবায়ন অগ্রগতি')}</span>
                      <span className="text-cyan-300 font-bold font-mono text-sm">{activeProjects[0].progress}%</span>
                    </div>
                    <div className="w-full h-3 bg-slate-900/90 rounded-full overflow-hidden p-0.5 border border-cyan-400/25">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 transition-all duration-1000 shadow-[0_0_12px_rgba(34,211,238,0.7)]"
                        style={{ width: `${activeProjects[0].progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-slate-300">
                    <div className="flex items-center gap-2 font-medium">
                      <Users className="w-4 h-4 text-cyan-400" />
                      <span>{activeProjects[0].volunteersEnrolled} / {activeProjects[0].volunteersNeeded} {t('Volunteers Active', 'স্বেচ্ছাসেবক সক্রিয়')}</span>
                    </div>
                    <button
                      onClick={() => openModal('join')}
                      className="btn-radiant px-5 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      {t('Support & Volunteer →', 'যুক্ত হোন ও সমর্থন করুন →')}
                    </button>
                  </div>
                </div>

              </div>
            </div>
          ) : (
            /* Multi-project Responsive Grid */
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {activeProjects.map((proj) => (
                <div
                  key={proj.id}
                  className="glass-card rounded-3xl border border-cyan-400/20 overflow-hidden shadow-xl hover:border-emerald-400/50 transition-all flex flex-col group"
                >
                  <div className="relative h-44 overflow-hidden bg-black/50">
                    {proj.image ? (
                      <img
                        src={proj.image}
                        alt={t(proj.title, proj.titleBn)}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-cyan-950/40 to-slate-900">
                        <img src={logoImg} alt="Salmikkhang Logo" loading="lazy" decoding="async" className="w-16 h-16 object-contain opacity-70" />
                      </div>
                    )}
                    <div className="absolute top-3 left-3 bg-[#050a0e]/85 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold text-cyan-300 border border-cyan-400/30 uppercase tracking-wider">
                      {t(proj.status, proj.statusBn)}
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <span className="text-[11px] font-bold text-cyan-400 font-mono">
                        {t(proj.category, proj.categoryBn)}
                      </span>
                      <h3 className="font-bold text-base text-white line-clamp-1 group-hover:text-cyan-300 transition-colors">
                        {t(proj.title, proj.titleBn)}
                      </h3>
                      <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                        {t(proj.description, proj.descriptionBn)}
                      </p>
                    </div>

                    <div className="space-y-3 pt-2 border-t border-cyan-400/15">
                      <div>
                        <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                          <span>{t('Progress', 'অগ্রগতি')}</span>
                          <span className="text-cyan-300 font-bold font-mono">{proj.progress}%</span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-cyan-400/20">
                          <div
                            className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(34,211,238,0.6)]"
                            style={{ width: `${proj.progress}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-300">
                        <span>{proj.volunteersEnrolled} / {proj.volunteersNeeded} {t('Volunteers', 'স্বেচ্ছাসেবক')}</span>
                        <button
                          onClick={() => openModal('join')}
                          className="text-xs font-bold text-cyan-300 hover:text-cyan-200"
                        >
                          {t('Support →', 'যুক্ত হোন →')}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </section>

      {/* 6. Photo Gallery Section (Single Clean Horizontal Row Filter & Real Photos) */}
      <section id="gallery" className="cv-auto py-12 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8 scroll-reveal">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider block">
              {t('VISUAL MOMENTS', 'আমাদের মুহূর্তগুলো')}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
              {t('Salmikkhang Photo Gallery', 'সালমিকখাং ফটো গ্যালারি')}
            </h2>
            <p className="text-slate-300 text-sm mt-1">
              {t(
                'A glimpse into our community events, cultural celebrations, and volunteer drives in Madhupur.',
                'মধুপুরে আমাদের সামাজিক কার্যক্রম, সাংস্কৃতিক উৎসব ও মাঠপর্যায়ের কাজের কিছু মুহূর্ত।'
              )}
            </p>
          </div>

          {/* Clean Single Row Filter Pills with Horizontal Scroll on Mobile */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1 flex-nowrap w-full sm:w-auto">
            {galleryCategories.map((cat) => {
              const isActive = galleryFilter.toLowerCase() === cat.value.toLowerCase();
              return (
                <button
                  key={cat.value}
                  onClick={() => setGalleryFilter(cat.value)}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-full whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500/25 to-emerald-500/25 border border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(34,211,238,0.35)] font-bold'
                      : 'bg-white/5 border border-white/10 text-slate-300 hover:border-cyan-400/40 hover:text-white'
                  }`}
                >
                  {t(cat.labelEn, cat.labelBn)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Gallery Grid of Real Community Photos with Smooth Hover Zoom & Glass Captions */}
        {filteredGallery.length === 0 ? (
          <div className="glass-card rounded-2xl border border-cyan-400/20 p-8 text-center text-xs text-slate-400">
            {t('No photos found in this category yet.', 'এই ক্যাটাগরিতে এখনো কোনো ছবি যুক্ত হয়নি।')}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGallery.map((item) => (
              <div
                key={item.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelectGallery(item)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectGallery(item);
                  }
                }}
                className="group relative rounded-3xl overflow-hidden border border-cyan-400/20 hover:border-emerald-400/60 shadow-lg hover:shadow-[0_0_30px_rgba(16,185,129,0.25)] transition-all duration-500 cursor-pointer bg-black/60 aspect-[4/3] focus:outline-none focus:ring-2 focus:ring-cyan-400"
              >
                <img
                  src={item.image}
                  alt={item.title}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                />
                
                {/* Frosted Dark Glassmorphic Bottom Caption */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#050a0e]/95 via-[#050a0e]/30 to-transparent opacity-85 group-hover:opacity-95 transition-opacity flex flex-col justify-end p-5 text-white">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-300">
                    {t(item.category, item.categoryBn)}
                  </span>
                  <h3 className="font-bold text-base text-white mt-0.5 leading-snug">
                    {t(item.title, item.titleBn)}
                  </h3>
                  <div className="flex items-center justify-between text-xs text-slate-300 mt-2">
                    <span className="font-mono text-[11px] text-slate-400">{item.date}</span>
                    <span className="flex items-center gap-1.5 text-cyan-300 font-semibold group-hover:translate-x-1 transition-transform">
                      <Eye className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{t('View Photo', 'ছবি দেখুন')}</span>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 7. Join Banner */}
      <section className="py-12 sm:py-16 border-y border-cyan-500/15 scroll-reveal">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass-card flex flex-col md:flex-row items-start md:items-center justify-between gap-6 sm:gap-8 rounded-3xl p-6 sm:p-12 border border-cyan-400/30 hover:border-emerald-400/50 shadow-[0_0_35px_rgba(34,211,238,0.15)]">
            <div className="space-y-3 max-w-xl">
              <span className="text-xs font-mono font-extrabold uppercase tracking-widest text-cyan-400">
                {t('YOUR VILLAGE. YOUR FUTURE.', 'তোমার গ্রাম। তোমার ভবিষ্যৎ।')}
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                {t('Be part of something good.', 'ভালো কিছুর অংশ হয়ে ওঠো।')}
              </h2>
              <p className="text-slate-300 text-sm leading-relaxed">
                {t(
                  'Have an idea, a skill, or just a little spare time to give? Whether you are a student, teacher, or worker, Salmikkhang welcomes your enthusiasm.',
                  'তোমার কোনো ধারণা, বিশেষ দক্ষতা বা সমাজসেবার ইচ্ছা থাকলে নির্দ্বিধায় যুক্ত হও। ছাত্র, শিক্ষক বা তরুণ পেশাজীবী—সবার জন্য সালমিকখাং উন্মুক্ত।'
                )}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 shrink-0 w-full md:w-auto">
              <button
                onClick={() => openModal('join')}
                className="btn-radiant w-full sm:w-auto px-6 py-3.5 rounded-2xl text-xs font-bold cursor-pointer"
              >
                {t('Apply for Membership →', 'সদস্য হতে আবেদন করুন →')}
              </button>
              <a
                href="#contact"
                className="w-full sm:w-auto px-6 py-3.5 bg-white/5 hover:bg-white/10 text-white font-semibold text-xs rounded-2xl border border-cyan-400/30 text-center transition-colors flex items-center justify-center gap-1.5"
              >
                {t('Contact Organizers', 'আয়োজকদের সাথে যোগাযোগ')}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Working Contact Section (Clean action buttons, no raw admin placeholders) */}
      <section id="contact" className="cv-auto py-12 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-reveal">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">
          
          <div className="lg:col-span-5 space-y-6">
            <div>
              <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider block">
                {t("LET'S TALK & COLLABORATE", 'যোগাযোগ করি')}
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
                {t('Contact Salmikkhang', 'সালমিকখাং-এর সঙ্গে যোগাযোগ')}
              </h2>
              <p className="text-slate-300 text-sm mt-2 leading-relaxed">
                {t(
                  'Questions, ideas, or offers to collaborate on education, tree planting, or youth initiatives? We look forward to hearing from you.',
                  'শিক্ষা, বৃক্ষরোপণ কিংবা যুব কল্যাণমূলক কোনো বিষয়ে প্রশ্ন, পরামর্শ বা সহযোগিতার জন্য আয়োজকদের বার্তা পাঠান।'
                )}
              </p>
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3.5 p-4 bg-white/5 rounded-2xl border border-cyan-400/20 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-cyan-950/40 border border-cyan-400/40 text-cyan-300 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-sm text-white">{t('Our Location', 'আমাদের অবস্থান')}</div>
                  <div className="text-xs text-slate-300 mt-0.5 break-words">{settings.address}</div>
                </div>
              </div>

              {settings.phone?.trim() && (
                <div className="flex items-start gap-3.5 p-4 bg-white/5 rounded-2xl border border-cyan-400/20 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-emerald-950/40 border border-emerald-400/40 text-emerald-300 flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-sm text-white">{t('Community Hotline', 'যোগাযোগের ফোন')}</div>
                    <a
                      href={`tel:${settings.phone.replace(/[^\d+]/g, '')}`}
                      className="text-xs text-cyan-300 hover:underline mt-0.5 block break-words"
                    >
                      {settings.phone}
                    </a>
                  </div>
                </div>
              )}

              {settings.email?.trim() && (
                <div className="flex items-start gap-3.5 p-4 bg-white/5 rounded-2xl border border-cyan-400/20 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-cyan-950/40 border border-cyan-400/40 text-cyan-300 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-sm text-white">{t('Official Email', 'অফিসিয়াল ইমেইল')}</div>
                    <a
                      href={`mailto:${settings.email.trim()}`}
                      className="text-xs text-cyan-300 hover:underline mt-0.5 block break-all"
                    >
                      {settings.email}
                    </a>
                  </div>
                </div>
              )}

              {/* Clean Glowing Facebook Action Card */}
              {facebookHref && (
                <a
                  href={facebookHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-3.5 p-4 bg-white/5 hover:bg-blue-950/40 rounded-2xl border border-cyan-400/20 hover:border-blue-400/60 transition-all min-w-0 group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-blue-950/60 border border-blue-400/40 text-blue-300 flex items-center justify-center shrink-0">
                      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
                        <path d="M13.5 22v-8h2.7l.4-3.2h-3.1V8.8c0-.9.3-1.6 1.6-1.6h1.7V4.3c-.3 0-1.3-.1-2.5-.1-2.5 0-4.1 1.5-4.1 4.2v2.4H7.5V14h2.7v8h3.3z" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-white">{t('Official Facebook Page', 'অফিসিয়াল ফেসবুক পেজ')}</div>
                      <div className="text-xs text-cyan-300 group-hover:text-cyan-200 mt-0.5 font-semibold">
                        {t('Visit Facebook Page →', 'ফেসবুক পেজ ভিজিট করুন →')}
                      </div>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-cyan-400 group-hover:translate-x-1 transition-transform shrink-0" />
                </a>
              )}

              {/* WhatsApp Card (Cleanly Hidden if not configured in settings) */}
              {whatsappHref && (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-3.5 p-4 bg-white/5 hover:bg-emerald-950/40 rounded-2xl border border-cyan-400/20 hover:border-emerald-400/60 transition-all min-w-0 group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-400/40 text-emerald-300 flex items-center justify-center shrink-0">
                      <MessageCircle className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-white">{t('WhatsApp Community Chat', 'হোয়াটসঅ্যাপ চ্যাট')}</div>
                      <div className="text-xs text-emerald-300 group-hover:text-emerald-200 mt-0.5 font-semibold">
                        {t('Message on WhatsApp →', 'হোয়াটসঅ্যাপে বার্তা দিন →')}
                      </div>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-emerald-400 group-hover:translate-x-1 transition-transform shrink-0" />
                </a>
              )}
            </div>
          </div>

          {/* Interactive Working Form with Dark Translucent Inputs & Radiant Button */}
          <div className="lg:col-span-7 glass-card p-6 sm:p-8 rounded-3xl border border-cyan-400/25 shadow-xl">
            <h3 className="text-xl font-bold text-white mb-1">
              {t('Send a Message to Youth Council', 'বার্তা পাঠান')}
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              {t('Your message is received directly in the Community Admin inbox.', 'আপনার বার্তা সরাসরি কমিউনিটি অ্যাডমিন ইনবক্সে সংরক্ষিত হবে।')}
            </p>

            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  {t('Your Full Name *', 'আপনার পুরো নাম *')}
                </label>
                <input
                  type="text"
                  required
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder={t('Enter your name', 'আপনার নাম লিখুন')}
                  className="w-full px-4 py-3 rounded-xl border border-cyan-400/20 bg-[#050a0e]/70 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 text-sm transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  {t('Phone or Email (Optional)', 'মোবাইল নম্বর বা ইমেইল (ঐচ্ছিক)')}
                </label>
                <input
                  type="text"
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                  placeholder={t('+880 17... or yourname@gmail.com', 'ফোন নম্বর বা ইমেইল')}
                  className="w-full px-4 py-3 rounded-xl border border-cyan-400/20 bg-[#050a0e]/70 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 text-sm transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  {t('Your Message or Idea *', 'আপনার বার্তা বা প্রস্তাব *')}
                </label>
                <textarea
                  required
                  rows={4}
                  value={contactMsg}
                  onChange={(e) => setContactMsg(e.target.value)}
                  placeholder={t('How can we work together for the village?', 'আমরা কীভাবে গ্রামের কল্যাণে একসাথে কাজ করতে পারি?')}
                  className="w-full px-4 py-3 rounded-xl border border-cyan-400/20 bg-[#050a0e]/70 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 text-sm transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={submittingContact}
                className="btn-radiant w-full sm:w-auto px-6 py-3.5 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(34,211,238,0.4)]"
              >
                <Send className="w-4 h-4" />
                <span>{submittingContact ? t('Sending...', 'পাঠানো হচ্ছে...') : t('Send Message →', 'বার্তা পাঠান →')}</span>
              </button>
            </form>
          </div>

        </div>
      </section>

      {/* 9. Site Footer in Obsidian Glassmorphism */}
      <footer className="cv-auto glass-surface py-16 border-t border-cyan-500/20 text-slate-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="space-y-4 sm:col-span-2">
              <div className="flex items-center gap-3">
                <img
                  src={logoImg}
                  alt="Salmikkhang Youth Community Logo"
                  loading="lazy"
                  decoding="async"
                  className="w-11 h-11 rounded-full object-contain shadow-md ring-1 ring-cyan-400/50 shrink-0"
                />
                <div className="font-display font-extrabold text-white text-base tracking-tight">
                  SALMIKKHANG
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed max-w-sm">
                {t(
                  'Dedicated grassroots youth organization in Gaira, Jolchotro, Madhupur, Tangail. Working for education, ecology, culture, and community solidarity.',
                  'গাইরা, জলছত্র, মধুপুর, টাঙ্গাইলের তরুণদের স্বেচ্ছাসেবী সংগঠন। শিক্ষা, পরিবেশ, সংস্কৃতি ও সামাজিক ঐক্যের সেবায়।'
                )}
              </p>
              <div className="text-xs text-cyan-300 font-serif italic font-semibold">
                {t('“Small steps, big changes.”', '“ছোট পদক্ষেপ, বড় পরিবর্তন।”')}
              </div>
              {(facebookHref || whatsappHref) && (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {facebookHref && (
                    <a
                      href={facebookHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-950/60 text-blue-300 border border-blue-500/40 text-xs font-bold hover:border-blue-400 transition-colors"
                    >
                      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current" aria-hidden="true">
                        <path d="M13.5 22v-8h2.7l.4-3.2h-3.1V8.8c0-.9.3-1.6 1.6-1.6h1.7V4.3c-.3 0-1.3-.1-2.5-.1-2.5 0-4.1 1.5-4.1 4.2v2.4H7.5V14h2.7v8h3.3z" />
                      </svg>
                      <span>{t('Facebook', 'ফেসবুক')}</span>
                    </a>
                  )}
                  {whatsappHref && (
                    <a
                      href={whatsappHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 text-xs font-bold hover:border-emerald-400 transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>{t('WhatsApp', 'হোয়াটসঅ্যাপ')}</span>
                    </a>
                  )}
                </div>
              )}
            </div>

            <div>
              <div className="font-bold text-white text-xs font-mono uppercase tracking-wider mb-4">
                {t('Quick Sections', 'দ্রুত লিঙ্ক')}
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                <li><a href="#about" className="hover:text-cyan-300 transition-colors">{t('About Community', 'আমাদের কথা')}</a></li>
                <li><a href="#events" className="hover:text-cyan-300 transition-colors">{t('Events & RSVP', 'আসন্ন আয়োজন')}</a></li>
                <li><a href="#projects" className="hover:text-cyan-300 transition-colors">{t('Village Projects', 'উদ্যোগসমূহ')}</a></li>
                <li><a href="#gallery" className="hover:text-cyan-300 transition-colors">{t('Photo Gallery', 'ফটো অ্যালবাম')}</a></li>
                <li><a href="#contact" className="hover:text-cyan-300 transition-colors">{t('Contact Organizers', 'যোগাযোগ')}</a></li>
              </ul>
            </div>

            <div>
              <div className="font-bold text-white text-xs font-mono uppercase tracking-wider mb-4">
                {t('Community Access', 'কমিউনিটি এক্সেস')}
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                <li>
                  <button onClick={() => openModal('join')} className="hover:text-cyan-300 text-left cursor-pointer">
                    {t('Apply for Membership', 'সদস্যপদ আবেদন')}
                  </button>
                </li>
                <li>
                  <button onClick={() => setBloodModalOpen(true)} className="hover:text-rose-300 text-left cursor-pointer flex items-center gap-1">
                    <Heart className="w-3 h-3 text-rose-400" />
                    <span>{t('Emergency Blood Directory', 'জরুরি রক্তদাতা তালিকা')}</span>
                  </button>
                </li>
                <li>
                  <button onClick={() => openModal('login')} className="hover:text-cyan-300 text-left cursor-pointer">
                    {t('Member Portal Login', 'সদস্য পোর্টাল লগইন')}
                  </button>
                </li>
                <li className="pt-2 text-[11px] text-slate-400">
                  {settings.address}
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-cyan-500/15 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
            <div>
              © {new Date().getFullYear()} {t(settings.name, settings.nameBn)}. {t('All rights reserved.', 'সর্বস্বত্ব সংরক্ষিত।')}
            </div>
            <div className="text-cyan-300/80 font-mono text-[11px]">
              {t('Gaira, Jolchotro · Madhupur, Tangail, Bangladesh', 'গাইরা, জলছত্র · মধুপুর, টাঙ্গাইল, বাংলাদেশ')}
            </div>
          </div>

        </div>
      </footer>

      {/* Emergency Blood Donor Directory Modal */}
      {bloodModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-[#050a0e]/85 backdrop-blur-xl flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          onClick={() => setBloodModalOpen(false)}
        >
          <div 
            className="glass-card rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-[0_0_60px_rgba(244,63,94,0.25)] border border-rose-500/40 space-y-5 animate-in fade-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center justify-center shadow-[0_0_15px_rgba(244,63,94,0.3)]">
                  <Droplet className="w-5 h-5 text-rose-400" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-white">
                    {t('Emergency Blood Donor Network', 'জরুরি রক্তদাতা নেটওয়ার্ক')}
                  </h3>
                  <p className="text-xs text-slate-300">
                    {t('Verified youth volunteers ready to donate blood in Madhupur & Jolchotro', 'মধুপুর ও জলছত্রে তাৎক্ষণিক রক্তদানে প্রস্তুত স্বেচ্ছাসেবী দল')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBloodModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl bg-white/5 hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Blood Group Filter Chips */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                {t('Filter by Blood Group', 'রক্তের গ্রুপ দিয়ে খুঁজুন')}
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {['All', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(grp => (
                  <button
                    key={grp}
                    onClick={() => setBloodGroupFilter(grp)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      bloodGroupFilter === grp
                        ? 'bg-rose-500/30 text-rose-200 border border-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.4)]'
                        : 'bg-white/5 text-slate-300 border border-white/10 hover:border-rose-400/40'
                    }`}
                  >
                    {grp}
                  </button>
                ))}
              </div>
            </div>

            {/* Village Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              <input
                type="search"
                value={bloodSearchQuery}
                onChange={e => setBloodSearchQuery(e.target.value)}
                placeholder={t('Search by name, village (Gaira, Jolchotro)...', 'নাম বা গ্রাম দিয়ে খুঁজুন...')}
                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-cyan-400/20 bg-[#050a0e]/70 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              />
            </div>

            {/* Donor List */}
            <div className="space-y-2.5 max-h-[45vh] overflow-y-auto pr-1">
              {filteredDonors.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  {t('No registered blood donors found for this query.', 'এই গ্রুপ বা গ্রামের জন্য রক্তদাতা পাওয়া যায়নি।')}
                </div>
              ) : (
                filteredDonors.map(donor => (
                  <div
                    key={donor.id}
                    className="p-3 rounded-2xl bg-white/5 border border-cyan-400/20 hover:border-rose-400/50 flex items-center justify-between gap-3 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-400/40 text-rose-300 font-mono font-black text-sm flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(244,63,94,0.3)]">
                        {donor.bloodGroup}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-white truncate">{donor.name}</div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {donor.village} · <span className="text-emerald-400 font-semibold">{t('Ready to Donate', 'রক্তদানে প্রস্তুত')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {donor.phone && (
                        <a
                          href={`tel:${donor.phone.replace(/[^\d+]/g, '')}`}
                          className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1 shadow-md transition-colors"
                        >
                          <PhoneCall className="w-3 h-3" />
                          <span>{t('Call', 'কল করুন')}</span>
                        </a>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Bottom Register Action */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-300">
              <span>{t('Are you a healthy donor?', 'আপনিও কি রক্তদান করতে চান?')}</span>
              <button
                type="button"
                onClick={() => {
                  setBloodModalOpen(false);
                  openModal('join');
                }}
                className="text-xs font-bold text-rose-300 hover:underline"
              >
                {t('Register as Blood Donor →', 'রক্তদাতা হিসেবে নিবন্ধন করুন →')}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
});

PublicWebsite.displayName = 'PublicWebsite';
