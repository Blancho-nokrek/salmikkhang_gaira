import React, { useEffect, useState } from 'react';
import { useCommunity } from '../context/CommunityContext';
import { VillageResidentsManager } from './VillageResidentsManager';
import { TreasuryFundsManager } from './TreasuryFundsManager';
import { OrganizationStructure } from './OrganizationStructure';
import { DiscussionForum } from './DiscussionForum';
import { compressImage } from '../lib/imageUpload';
import logoImg from '../assets/images/logo.png';
import {
  Shield,
  MapPin,
  Droplet,
  Phone,
  Mail,
  Calendar,
  MessageSquare,
  Search,
  Users,
  Award,
  Edit3,
  Check,
  DollarSign,
  LogOut,
  FileText,
  Bell,
  Download,
  ExternalLink,
  Home,
  X,
  Plus,
  Edit2,
  Upload,
  AlertTriangle,
  Clock,
} from 'lucide-react';

export const MemberPortal: React.FC = () => {
  const {
    t,
    currentMember,
    members,
    events,
    news,
    notifications,
    markNotificationAsRead,
    clearAllNotifications,
    discussions,
    funds,
    villageResidents,
    settings,
    setCurrentView,
    logoutMember,
    openModal,
    updateMember,
    toggleEventRsvp,
    firebaseUser,
    authLoading,
    authError,
    clearAuthError,
    memberAccessNotice,
    clearMemberAccessNotice,
    loginAsMember,
    isMemberSessionUnlocked,
    isAdminLoggedIn,
    isAdminSessionUnlocked,
    previewMemberId,
    quickSwitchMember,
    resetPreviewMember,
    canManageNoticesPermission,
    canManageEventsPermission,
    addNewsItem,
    updateNewsItem,
    addEvent,
    updateEvent,
    showToast
  } = useCommunity();

  // Active tab inside member portal
  const [activeTab, setActiveTab] = useState<'wall' | 'residents' | 'fund' | 'roles' | 'directory' | 'notices' | 'events'>('wall');

  // Notification center popup state
  const [notificationOpen, setNotificationOpen] = useState(false);

  // Directory search & blood group filter
  const [directorySearch, setDirectorySearch] = useState('');
  const [bloodFilter, setBloodFilter] = useState('All');
  const [villageFilter, setVillageFilter] = useState('All');

  // Notices search & audience filter
  const [noticeSearch, setNoticeSearch] = useState('');
  const [noticeAudienceFilter, setNoticeAudienceFilter] = useState<'All' | 'members_only' | 'public'>('All');

  // Edit profile state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editPhone, setEditPhone] = useState(currentMember?.phone || '');
  const [editVillage, setEditVillage] = useState(currentMember?.village || '');
  const [editBlood, setEditBlood] = useState(currentMember?.bloodGroup || '');
  const [editBio, setEditBio] = useState(currentMember?.bio || '');

  // Notice & Event Upload / Edit Modal state (for Publicity Secretary & authorized officers)
  const [portalModalMode, setPortalModalMode] = useState<'create' | 'edit' | null>(null);
  const [portalModalTarget, setPortalModalTarget] = useState<'news' | 'event' | null>(null);
  const [portalEditingId, setPortalEditingId] = useState<string | null>(null);
  const [portalForm, setPortalForm] = useState<any>({});

  const unreadNotifsCount = notifications.filter(n => !n.read).length;
  const canAccessDataCollectorTab =
    isAdminLoggedIn || currentMember?.role === 'President' || currentMember?.role === 'Data Collector';
  const canManageNotices = canManageNoticesPermission();
  const canManageEvents = canManageEventsPermission();

  useEffect(() => {
    if (activeTab === 'residents' && !canAccessDataCollectorTab) {
      setActiveTab('wall');
    }
  }, [activeTab, canAccessDataCollectorTab]);

  useEffect(() => {
    setEditPhone(currentMember?.phone || '');
    setEditVillage(currentMember?.village || '');
    setEditBlood(currentMember?.bloodGroup || '');
    setEditBio(currentMember?.bio || '');
  }, [currentMember?.id, currentMember?.phone, currentMember?.village, currentMember?.bloodGroup, currentMember?.bio]);

  // 1. MEMBER LOGIN GATEWAY (Explicit Continue with Google + Admin-verified Membership)
  if (!currentMember || (!isMemberSessionUnlocked && !previewMemberId)) {
    return (
      <div className="max-w-xl mx-auto py-8 sm:py-16 px-4 transition-colors">
        <div className="glass-card p-5 sm:p-10 rounded-3xl border border-white/40 dark:border-white/10 shadow-2xl space-y-5 sm:space-y-6">
          <div className="text-center space-y-2">
            <img
              src={logoImg}
              alt="Salmikkhang Logo"
              className="w-18 h-18 sm:w-20 sm:h-20 rounded-full object-contain mx-auto shadow-lg ring-2 ring-white/40"
            />
            <h2 className="text-xl sm:text-3xl font-extrabold text-slate-950 dark:text-slate-100 tracking-tight">
              {t('Member Portal Login', 'সদস্য পোর্টালে লগইন')}
            </h2>
            <p className="text-slate-800 dark:text-slate-400 text-xs sm:text-sm max-w-sm mx-auto">
              {t(
                'Continue with your registered Google account to unlock notices, village records, treasury, and discussions.',
                'নোটিশ, গ্রামের তথ্য ভাণ্ডার, তহবিল ও ফোরামে প্রবেশ করতে আপনার নিবন্ধিত Google অ্যাকাউন্ট দিয়ে এগিয়ে যান।'
              )}
            </p>
          </div>

          {authLoading ? (
            <div className="py-6 text-center text-xs font-bold text-emerald-800 dark:text-emerald-300">
              {t('Checking Google session...', 'Google সেশন যাচাই করা হচ্ছে...')}
            </div>
          ) : memberAccessNotice ? (
            <div className="space-y-4">
              <div className={`p-4 rounded-2xl border text-xs space-y-2.5 ${
                memberAccessNotice.status === 'rejected' || memberAccessNotice.status === 'inactive'
                  ? 'bg-rose-50/90 dark:bg-rose-950/50 border-rose-300 dark:border-rose-800'
                  : 'bg-amber-50/90 dark:bg-amber-950/50 border-amber-300 dark:border-amber-800'
              }`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 font-extrabold text-sm text-slate-950 dark:text-slate-100">
                    {memberAccessNotice.status === 'rejected' || memberAccessNotice.status === 'inactive' ? (
                      <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
                    ) : (
                      <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                    )}
                    <span>
                      {memberAccessNotice.status === 'sent'
                        ? t('Not Registered — Request Sent to Admin', 'নিবন্ধিত নয় — অ্যাডমিনের কাছে রিকোয়েস্ট পাঠানো হয়েছে')
                        : memberAccessNotice.status === 'pending'
                        ? t('Access Pending Admin Approval', 'অ্যাডমিনের অনুমোদনের অপেক্ষায়')
                        : memberAccessNotice.status === 'rejected'
                        ? t('Access Request Declined', 'প্রবেশের আবেদন প্রত্যাখ্যাত হয়েছে')
                        : t('Membership Account Inactive', 'সদস্যপদ নিষ্ক্রিয় রয়েছে')}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      clearMemberAccessNotice();
                      clearAuthError();
                    }}
                    className="p-0.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 shrink-0"
                    aria-label="Dismiss notice"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-slate-800 dark:text-slate-200 leading-relaxed">
                  {memberAccessNotice.status === 'sent'
                    ? t(
                        `Your Google email (${memberAccessNotice.email}) is not in our member database. You cannot enter the Member Portal yet. An access request has been automatically sent to the Council Admin.`,
                        `আপনার Google ইমেইল (${memberAccessNotice.email}) আমাদের সদস্য ডেটাবেসে নেই। আপনি এখনই সদস্য পোর্টালে ঢুকতে পারবেন না—অ্যাডমিনের কাছে আপনার অ্যাক্সেস রিকোয়েস্ট পাঠানো হয়েছে।`
                      )
                    : memberAccessNotice.status === 'pending'
                    ? t(
                        `Your Google email (${memberAccessNotice.email}) is not registered in the database yet. Your request is already waiting in the Admin inbox for approval.`,
                        `আপনার Google ইমেইল (${memberAccessNotice.email}) এখনো ডেটাবেসে যুক্ত হয়নি। আপনার রিকোয়েস্ট অ্যাডমিনের ইনবক্সে অনুমোদনের অপেক্ষায় আছে।`
                      )
                    : memberAccessNotice.status === 'rejected'
                    ? t(
                        `The access request for ${memberAccessNotice.email} was declined by Admin. Please contact Council Admin or submit a complete membership application.`,
                        `${memberAccessNotice.email}-এর আবেদনটি অ্যাডমিন কর্তৃক বাতিল করা হয়েছে। অনুগ্রহ করে অ্যাডমিনের সাথে যোগাযোগ করুন অথবা পূর্ণাঙ্গ আবেদন পাঠান।`
                      )
                    : t(
                        `Your email (${memberAccessNotice.email}) is currently marked Inactive in the database. Contact Council Admin to reactivate access.`,
                        `আপনার ইমেইল (${memberAccessNotice.email}) ডেটাবেসে বর্তমানে নিষ্ক্রিয় (Inactive) রয়েছে। সক্রিয় করতে অ্যাডমিনের সাথে যোগাযোগ করুন।`
                      )}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  onClick={() => openModal('join')}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-md"
                >
                  {t('Submit Full Details Form →', 'বিস্তারিত তথ্যের আবেদন দিন →')}
                </button>
                <button
                  type="button"
                  onClick={() => void loginAsMember()}
                  className="py-3 px-4 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white font-bold text-xs rounded-xl"
                >
                  {t('Try Another Google Account', 'অন্য Google অ্যাকাউন্ট দিন')}
                </button>
              </div>
            </div>
          ) : isMemberSessionUnlocked && firebaseUser && !currentMember ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50/90 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 text-xs space-y-2">
                <div className="font-bold text-amber-950 dark:text-amber-200">
                  {t('Membership Pending / Not Registered Yet', 'আপনার ইমেইল এখনো সদস্য হিসেবে নিবন্ধিত নয়')}
                </div>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                  {t(
                    `You are signed in as ${firebaseUser.email}, which is not yet linked to an approved Salmikkhang member profile. Please submit an application or contact Council Admin to add your Gmail.`,
                    `আপনি ${firebaseUser.email} দিয়ে লগইন করেছেন, কিন্তু এই Gmail এখনো সদস্য তালিকায় যুক্ত হয়নি। আবেদন পাঠান অথবা অ্যাডমিনের সাথে যোগাযোগ করুন।`
                  )}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  onClick={() => openModal('join')}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-md"
                >
                  {t('Submit Membership Application →', 'সদস্যপদের আবেদন পাঠান →')}
                </button>
                <button
                  type="button"
                  onClick={() => void loginAsMember()}
                  className="py-3 px-4 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white font-bold text-xs rounded-xl"
                >
                  {t('Continue with Another Google Account', 'অন্য Google অ্যাকাউন্ট দিন')}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {authError && (
                <div className="p-3.5 rounded-2xl bg-rose-50/90 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 text-xs text-rose-950 dark:text-rose-200 flex items-start justify-between gap-2">
                  <span className="leading-relaxed break-words">{authError}</span>
                  <button
                    type="button"
                    onClick={clearAuthError}
                    className="p-0.5 text-rose-600 dark:text-rose-300 hover:text-rose-900 shrink-0"
                    aria-label="Dismiss error"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {firebaseUser && (
                <div className="p-3 rounded-2xl bg-sky-50/90 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-[11px] text-sky-950 dark:text-sky-200 leading-relaxed text-center">
                  {t(
                    'Only Google emails registered in our database can enter the Member Portal. Unregistered emails will automatically send an access request to Admin.',
                    'শুধুমাত্র ডেটাবেসে নিবন্ধিত Google ইমেইল দিয়েই সদস্য পোর্টালে প্রবেশ করা যাবে। নিবন্ধিত না থাকলে স্বয়ংক্রিয়ভাবে অ্যাডমিনের কাছে রিকোয়েস্ট যাবে।'
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={() => void loginAsMember()}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm rounded-xl shadow-lg transition-transform hover:-translate-y-0.5 active:translate-y-0 border border-white/20 flex items-center justify-center gap-2"
              >
                <Shield className="w-4 h-4" />
                <span>{t('Continue with Google →', 'Google দিয়ে এগিয়ে যান →')}</span>
              </button>

              <p className="text-[11px] text-center text-slate-600 dark:text-slate-400">
                {t(
                  'Only emails registered in the database can unlock the Member Portal.',
                  'শুধুমাত্র ডেটাবেসে থাকা অনুমোদিত Gmail দিয়েই সদস্য পোর্টাল আনলক হবে।'
                )}
              </p>
            </div>
          )}

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
            <button
              onClick={() => openModal('join')}
              className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 font-bold underline"
            >
              {t('Want to become a member? Submit application to Admin →', 'সদস্য হতে চান? অ্যাডমিনের কাছে আবেদন জমা দিন →')}
            </button>
            <button
              onClick={() => setCurrentView('website')}
              className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-medium"
            >
              ← {t('Back to Public Website', 'ওয়েবসাইটে ফিরে যান')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleSaveProfile = () => {
    updateMember(currentMember.id, {
      phone: editPhone,
      village: editVillage,
      bloodGroup: editBlood,
      bio: editBio
    });
    setIsEditingProfile(false);
  };

  const openPortalCreate = (target: 'news' | 'event') => {
    if (target === 'news' && !canManageNotices) return;
    if (target === 'event' && !canManageEvents) return;
    setPortalModalTarget(target);
    setPortalModalMode('create');
    setPortalEditingId(null);
    if (target === 'news') {
      setPortalForm({
        title: '',
        titleBn: '',
        category: 'Notice',
        categoryBn: 'নোটিশ',
        date: new Date().toISOString().split('T')[0],
        summary: '',
        summaryBn: '',
        content: '',
        contentBn: '',
        image: '',
        tagColor: 'green',
        status: 'Published',
        visibility: 'public',
        pdfAttachment: undefined
      });
    } else {
      setPortalForm({
        title: '',
        titleBn: '',
        date: new Date().toISOString().split('T')[0],
        time: '3:00 PM - 5:00 PM',
        timeBn: 'বিকাল ৩:০০ - ৫:০০',
        location: 'Gaira Village Ground',
        locationBn: 'গাইরা গ্রাম মাঠ',
        category: 'Meeting',
        categoryBn: 'মতবিনিময়',
        description: '',
        descriptionBn: '',
        image: '',
        status: 'Upcoming',
        visibility: 'public'
      });
    }
  };

  const openPortalEdit = (target: 'news' | 'event', item: any) => {
    if (target === 'news' && !canManageNotices) return;
    if (target === 'event' && !canManageEvents) return;
    setPortalModalTarget(target);
    setPortalModalMode('edit');
    setPortalEditingId(item.id);
    setPortalForm({
      ...item,
      visibility: item.visibility || 'public'
    });
  };

  const handlePortalImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const compressed = await compressImage(file, 1280, 350_000);
      setPortalForm((prev: any) => ({ ...prev, image: compressed }));
    } catch {
      showToast(t('Could not process this image file.', 'ছবিটি প্রসেস করা যায়নি।'), 'warning');
    }
  };

  const handlePortalPdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 500 * 1024) {
      showToast(
        t('PDF must be 500 KB or smaller for cloud storage.', 'ক্লাউড স্টোরেজের জন্য PDF ফাইল ৫০০ KB বা তার কম হতে হবে।'),
        'warning'
      );
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const sizeInKb = (file.size / 1024).toFixed(1) + ' KB';
        setPortalForm((prev: any) => ({
          ...prev,
          pdfAttachment: {
            fileName: file.name,
            fileSize: sizeInKb,
            dataUrl: event.target?.result as string
          }
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePortalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (portalModalTarget === 'news') {
      if (!canManageNotices) return;
      if (portalModalMode === 'create') {
        addNewsItem(portalForm);
      } else if (portalEditingId) {
        updateNewsItem(portalEditingId, portalForm);
      }
    } else if (portalModalTarget === 'event') {
      if (!canManageEvents) return;
      if (portalModalMode === 'create') {
        addEvent(portalForm);
      } else if (portalEditingId) {
        updateEvent(portalEditingId, portalForm);
      }
    }
    setPortalModalMode(null);
    setPortalModalTarget(null);
    setPortalEditingId(null);
  };

  // Filter directory
  const filteredMembers = members.filter(m => {
    const matchesSearch =
      m.name.toLowerCase().includes(directorySearch.toLowerCase()) ||
      m.village.toLowerCase().includes(directorySearch.toLowerCase()) ||
      m.skills.some(s => s.toLowerCase().includes(directorySearch.toLowerCase()));

    const matchesBlood = bloodFilter === 'All' || m.bloodGroup === bloodFilter;
    const matchesVillage = villageFilter === 'All' || m.village === villageFilter;

    return matchesSearch && matchesBlood && matchesVillage;
  });

  // Filter notices (search + audience)
  const filteredNotices = news.filter(n => {
    const matchesSearch =
      n.title.toLowerCase().includes(noticeSearch.toLowerCase()) ||
      n.content.toLowerCase().includes(noticeSearch.toLowerCase()) ||
      n.category.toLowerCase().includes(noticeSearch.toLowerCase());

    const matchesAudience =
      noticeAudienceFilter === 'All' ||
      (noticeAudienceFilter === 'members_only' && n.visibility === 'members_only') ||
      (noticeAudienceFilter === 'public' && n.visibility !== 'members_only');

    return matchesSearch && matchesAudience;
  });

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6 sm:space-y-8 transition-colors">
      
      {/* 1. Top Bar with Welcome & Member Notification Center */}
      <div className="grid lg:grid-cols-12 gap-5 sm:gap-8 items-start">
        
        {/* Welcome message & member info */}
        <div className="lg:col-span-7 space-y-3 sm:space-y-4 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-2 text-[11px] sm:text-xs font-bold text-emerald-950 dark:text-emerald-400 uppercase tracking-wider">
              <img src={logoImg} alt="Salmikkhang Logo" className="w-6 h-6 rounded-full object-contain shrink-0" />
              <span>{t('SALMIKKHANG MEMBER PORTAL', 'সালমিকখাং সদস্য প্যানেল')}</span>
            </span>
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Notification Bell Button */}
              <button
                onClick={() => setNotificationOpen(!notificationOpen)}
                className="relative p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-slate-700 transition-colors"
                title="Member Notifications & PDF Circulars"
              >
                <Bell className="w-4 h-4 text-emerald-800 dark:text-emerald-400" />
                {unreadNotifsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-600 text-white text-[10px] font-black rounded-full flex items-center justify-center animate-pulse">
                    {unreadNotifsCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setCurrentView('website')}
                className="text-xs font-semibold text-slate-900 dark:text-slate-400 hover:text-emerald-900 dark:hover:text-emerald-300 underline whitespace-nowrap"
              >
                ← {t('Public Website', 'মূল ওয়েবসাইট')}
              </button>
              <button
                onClick={logoutMember}
                className="flex items-center gap-1 text-xs font-semibold text-rose-700 dark:text-rose-400 hover:text-rose-900 whitespace-nowrap"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{t('Logout', 'লগআউট')}</span>
              </button>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 dark:text-slate-100 tracking-tight">
            {t('Welcome back,', 'স্বাগতম,')} <span className="text-emerald-900 dark:text-emerald-400">{currentMember.name}</span>
          </h1>

          <p className="text-slate-800 dark:text-slate-300 text-xs sm:text-sm leading-relaxed">
            {t(
              'Stay connected with Gaira & Jolchotro youth activities, read official PDF circulars, RSVP for drives, and engage in discussions.',
              'গাইরা ও জলছত্রের তরুণদের সাথে যুক্ত থাকুন, অফিসিয়াল PDF পরিপত্র পড়ুন, অনুষ্ঠানে অংশ নিন এবং মতবিনিময়ে যুক্ত থাকুন।'
            )}
          </p>

          {/* Admin Role Preview Switcher (visible only when Admin Panel is unlocked) */}
          {isAdminLoggedIn && isAdminSessionUnlocked && (
            <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/40 rounded-2xl border border-emerald-100 dark:border-emerald-900 flex flex-wrap items-center gap-2 text-xs">
              <span className="font-bold text-emerald-900 dark:text-emerald-300">{t('Admin preview profile:', 'প্রোফাইল প্রিভিউ (অ্যাডমিন):')}</span>
              {members.slice(0, 4).map(m => (
                <button
                  key={m.id}
                  onClick={() => quickSwitchMember(m.id)}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                    m.id === currentMember.id
                      ? 'bg-emerald-700 text-white font-bold'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-emerald-100 dark:hover:bg-slate-700 border border-emerald-200 dark:border-slate-700'
                  }`}
                >
                  {m.name.split(' ')[0]} ({m.role.split(' ')[0]})
                </button>
              ))}
              {previewMemberId && (
                <button
                  onClick={resetPreviewMember}
                  className="px-2.5 py-1 rounded-lg font-bold bg-slate-900 dark:bg-slate-700 text-white hover:bg-slate-800 transition-colors"
                >
                  {t('Exit Preview', 'প্রিভিউ বন্ধ')}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Digital Membership ID Card */}
        <div className="lg:col-span-5">
          <div className="bg-gradient-to-br from-emerald-800 via-emerald-900 to-teal-950 text-white rounded-3xl p-6 shadow-xl border border-emerald-700/50 relative overflow-hidden">
            <div className="absolute right-[-20px] bottom-[-20px] opacity-10 pointer-events-none">
              <Shield className="w-56 h-56" />
            </div>

            <div className="flex items-center justify-between pb-4 border-b border-emerald-700/60">
              <div className="flex items-center gap-2">
                <img
                  src={logoImg}
                  alt="Salmikkhang Logo"
                  className="w-8 h-8 rounded-full object-contain ring-1 ring-white/30 shrink-0"
                />
                <div className="font-extrabold text-xs tracking-wider uppercase text-emerald-200">
                  Salmikkhang Youth Council
                </div>
              </div>
              <span className="text-[10px] font-mono uppercase bg-emerald-700/80 px-2 py-0.5 rounded text-emerald-100">
                {currentMember.memberNo}
              </span>
            </div>

            <div className="pt-4 flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-2xl font-black shrink-0 overflow-hidden">
                {currentMember.avatar ? (
                  <img src={currentMember.avatar} alt={currentMember.name} className="w-full h-full object-cover" />
                ) : (
                  currentMember.name[0]
                )}
              </div>

              <div className="space-y-0.5">
                <h3 className="text-lg font-black tracking-tight">{currentMember.name}</h3>
                <div className="text-xs text-emerald-300 font-semibold">{currentMember.role}</div>
                <div className="text-[11px] text-emerald-200/80 flex items-center gap-2">
                  <span>📍 {currentMember.village}, Madhupur</span>
                  <span>🩸 {currentMember.bloodGroup}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-emerald-700/60 flex items-center justify-between text-[11px] text-emerald-200/90">
              <span>{t('Status: Verified Active', 'অবস্থা: সক্রিয় সদস্য')}</span>
              <button
                onClick={() => setIsEditingProfile(!isEditingProfile)}
                className="text-xs font-bold text-white hover:underline flex items-center gap-1"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isEditingProfile ? t('Close Editor', 'বন্ধ করুন') : t('Edit My Details', 'তথ্য এডিট')}</span>
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* NOTIFICATION POPUP MODAL */}
      {notificationOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-start sm:items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 my-auto max-h-[92dvh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
                <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                  {t('Member Notifications & PDF Circulars', 'সদস্য নোটিফিকেশন ও পরিপত্র')}
                </h3>
              </div>
              <button
                onClick={() => setNotificationOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {notifications.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                {t('No notifications yet.', 'কোনো নতুন নোটিফিকেশন নেই।')}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-end gap-2 text-[11px]">
                  <button
                    onClick={clearAllNotifications}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {t('Clear all', 'সব মুছুন')}
                  </button>
                </div>

                {notifications.map(n => (
                  <div
                    key={n.id}
                    className={`p-4 rounded-2xl border transition-all space-y-2 text-xs ${
                      !n.read
                        ? 'bg-emerald-50/60 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 opacity-80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                          {!n.read && <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />}
                          <span>{t(n.title, n.titleBn)}</span>
                        </div>
                        <div className="text-[10px] text-slate-400">{n.date} · {n.type.toUpperCase()}</div>
                      </div>
                      {!n.read && (
                        <button
                          onClick={() => markNotificationAsRead(n.id)}
                          className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline shrink-0"
                        >
                          {t('Mark as read', 'পঠিত')}
                        </button>
                      )}
                    </div>

                    <p className="text-slate-600 dark:text-slate-300 text-xs">{t(n.message, n.messageBn)}</p>

                    {/* PDF Attachment in notification */}
                    {n.pdfAttachment && (
                      <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-rose-200 dark:border-rose-900 flex items-center justify-between gap-3 mt-2">
                        <div className="flex items-center gap-2 truncate">
                          <FileText className="w-4 h-4 text-rose-600 shrink-0" />
                          <span className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                            {n.pdfAttachment.fileName}
                          </span>
                        </div>
                        <a
                          href={n.pdfAttachment.dataUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] rounded-lg shrink-0 flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>{t('Open PDF', 'PDF খুলুন')}</span>
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Profile Form Popup (Inline) */}
      {isEditingProfile && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
            {t('Update Your Contact & Community Profile', 'আপনার যোগাযোগের তথ্য সম্পাদনা')}
          </h3>
          <div className="grid sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Phone</label>
              <input
                type="text"
                value={editPhone}
                onChange={e => setEditPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Village</label>
              <input
                type="text"
                value={editVillage}
                onChange={e => setEditVillage(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Blood Group</label>
              <input
                type="text"
                value={editBlood}
                onChange={e => setEditBlood(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 text-xs mb-1">Personal Bio</label>
            <textarea
              rows={2}
              value={editBio}
              onChange={e => setEditBio(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setIsEditingProfile(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              {t('Cancel', 'বাতিল')}
            </button>
            <button
              onClick={handleSaveProfile}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg"
            >
              {t('Save Changes', 'সংরক্ষণ করুন')}
            </button>
          </div>
        </div>
      )}

      {/* 2. Left Sidebar + Right Content Workspace (matching Admin Panel) */}
      <div className="grid md:grid-cols-12 gap-5 lg:gap-8 pt-1 sm:pt-2 items-start">
        
        {/* Sidebar Nav (Left vertical list) */}
        <aside className="md:col-span-4 lg:col-span-3 min-w-0 glass-surface p-3 rounded-3xl border border-white/30 dark:border-white/10 shadow-lg backdrop-blur-2xl h-fit">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400 px-3 py-1.5">
            {t('MEMBER PORTAL MENU', 'সদস্য পোর্টাল মেনু')}
          </div>

          <div className="flex flex-col space-y-1">
            {[
              { id: 'wall', labelEn: 'Discussion Forum', labelBn: 'কমিউনিটি ফোরাম', icon: MessageSquare, count: discussions.length },
              ...(canAccessDataCollectorTab
                ? [{ id: 'residents', labelEn: 'Village Public Records (Census)', labelBn: 'গ্রামবাসী ও নাগরিক তথ্য', icon: Home, count: villageResidents.length }]
                : []),
              { id: 'fund', labelEn: 'Treasury & Cash Book', labelBn: 'তহবিল ও ক্যাশ বুক', icon: DollarSign, count: funds.length },
              { id: 'roles', labelEn: 'Organization Structure & Roles', labelBn: 'পদবি ও দায়িত্ব বণ্টন', icon: Award },
              { id: 'directory', labelEn: 'Member Directory & Blood Donors', labelBn: 'সদস্য তালিকা ও রক্তদাতা', icon: Users, count: members.length },
              { id: 'notices', labelEn: 'Notice Board & PDF Circulars', labelBn: 'অফিসিয়াল নোটিশ ও PDF', icon: FileText, count: news.length },
              { id: 'events', labelEn: 'Events & RSVP', labelBn: 'ইভেন্ট ও ক্যালেন্ডার', icon: Calendar, count: events.length },
            ].map(tab => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
                    active
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md font-bold border border-emerald-400/30'
                      : 'text-slate-950 dark:text-slate-300 hover:bg-white/40 dark:hover:bg-white/5 hover:text-emerald-900 dark:hover:text-emerald-400'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{t(tab.labelEn, tab.labelBn)}</span>
                  </div>
                  {tab.count !== undefined && (
                    <span className={`text-[10px] shrink-0 ${active ? 'text-emerald-100 font-bold' : 'text-slate-700 dark:text-slate-400'}`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </aside>

        {/* 3. Tab Contents */}
        <div className="md:col-span-8 lg:col-span-9 min-w-0 space-y-6">

      {/* TAB A: Youth Discussion Wall */}
      {activeTab === 'wall' && (
        <DiscussionForum onNavigateToDirectory={() => setActiveTab('directory')} />
      )}

      {/* TAB B: Notice Board & PDF Circulars */}
      {activeTab === 'notices' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
                {t('Official Notice Board & Circulars', 'অফিসিয়াল নোটিশ ও পরিপত্র')}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {t('Browse public bulletins and exclusive members-only council circulars.', 'সার্বজনীন ঘোষণা ও শুধুমাত্র সদস্যদের জন্য অভ্যন্তরীণ পরিপত্র।')}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {canManageNotices && (
                <button
                  onClick={() => openPortalCreate('news')}
                  className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t('Upload Notice / PDF', 'নোটিশ / PDF আপলোড')}</span>
                </button>
              )}

              {/* Audience Filter Pills */}
              <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold w-full sm:w-auto">
                <button
                  onClick={() => setNoticeAudienceFilter('All')}
                  className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-xl transition-all ${
                    noticeAudienceFilter === 'All'
                      ? 'bg-emerald-600 text-white font-bold shadow-sm'
                      : 'text-slate-800 dark:text-slate-300 hover:bg-white/40 dark:hover:bg-white/5'
                  }`}
                >
                  {t('All', 'সকল')}
                </button>
                <button
                  onClick={() => setNoticeAudienceFilter('members_only')}
                  className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-xl transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
                    noticeAudienceFilter === 'members_only'
                      ? 'bg-amber-500/80 text-white font-bold shadow-sm'
                      : 'text-slate-800 dark:text-slate-300 hover:bg-white/40 dark:hover:bg-white/5'
                  }`}
                >
                  <span>🔒</span>
                  <span>{t('Members Only', 'শুধুমাত্র সদস্য')}</span>
                </button>
                <button
                  onClick={() => setNoticeAudienceFilter('public')}
                  className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-xl transition-all ${
                    noticeAudienceFilter === 'public'
                      ? 'bg-blue-600 text-white font-bold shadow-sm'
                      : 'text-slate-800 dark:text-slate-300 hover:bg-white/40 dark:hover:bg-white/5'
                  }`}
                >
                  {t('Public', 'সার্বজনীন')}
                </button>
              </div>

              {/* Search input */}
              <div className="relative w-full sm:w-auto">
                <Search className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={noticeSearch}
                  onChange={e => setNoticeSearch(e.target.value)}
                  placeholder={t('Search notices...', 'নোটিশ খুঁজুন...')}
                  className="w-full sm:w-auto pl-8 pr-3 py-1.5 text-xs rounded-xl border border-white/30 dark:border-white/10 bg-white/60 dark:bg-slate-900/60 text-slate-950 dark:text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 backdrop-blur-md"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {filteredNotices.map(item => (
              <div
                key={item.id}
                className="glass-card p-4 sm:p-6 rounded-3xl border border-white/40 dark:border-white/10 shadow-lg space-y-4 hover:border-emerald-500/40 backdrop-blur-2xl transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-300 rounded-md">
                      {t(item.category, item.categoryBn)}
                    </span>
                    {item.visibility === 'members_only' ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 dark:bg-amber-950 text-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800 rounded-md flex items-center gap-1">
                        <span>🔒</span>
                        <span>{t('Members Only (Private)', 'শুধুমাত্র সদস্য (অভ্যন্তরীণ)')}</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium px-2 py-0.5 bg-blue-50 dark:bg-blue-950 text-blue-900 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-md">
                        {t('Public Notice', 'সার্বজনীন')}
                      </span>
                    )}
                    <span className="text-xs text-slate-700 dark:text-slate-400">{item.date}</span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {item.pdfAttachment && (
                      <span className="text-xs font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1">
                        <FileText className="w-4 h-4 shrink-0" />
                        <span>{t('Official PDF Attached', 'অফিসিয়াল PDF সংযুক্ত')}</span>
                      </span>
                    )}
                    {canManageNotices && (
                      <button
                        onClick={() => openPortalEdit('news', item)}
                        className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 text-slate-900 dark:text-slate-200 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>{t('Edit', 'সম্পাদনা')}</span>
                      </button>
                    )}
                  </div>
                </div>

                <h3 className="text-lg font-bold text-slate-950 dark:text-slate-100">
                  {t(item.title, item.titleBn)}
                </h3>

                <p className="text-xs text-slate-800 dark:text-slate-300 leading-relaxed">
                  {t(item.summary || item.content, item.summaryBn || item.contentBn)}
                </p>

                {/* PDF ATTACHMENT CARD */}
                {item.pdfAttachment && (
                  <div className="p-3.5 sm:p-4 bg-rose-50/70 dark:bg-rose-950/40 rounded-2xl border border-rose-200 dark:border-rose-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900 text-rose-800 dark:text-rose-300 flex items-center justify-center font-bold text-xs shrink-0">
                        PDF
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-slate-950 dark:text-slate-100 truncate">
                          {item.pdfAttachment.fileName}
                        </div>
                        <div className="text-[11px] text-slate-700 dark:text-slate-400">
                          {item.pdfAttachment.fileSize} · {t('Official signed circular', 'কাউন্সিল স্বাক্ষরিত নোটিশ')}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <a
                        href={item.pdfAttachment.dataUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 sm:flex-initial justify-center px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>{t('Open / View PDF', 'PDF দেখুন')}</span>
                      </a>
                      <a
                        href={item.pdfAttachment.dataUrl}
                        download={item.pdfAttachment.fileName}
                        className="flex-1 sm:flex-initial justify-center px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-950 dark:text-slate-200 font-bold text-xs rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>{t('Download', 'ডাউনলোড')}</span>
                      </a>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB C: Member Directory & Blood Donor Finder */}
      {activeTab === 'directory' && (
        <div className="space-y-6">
          <div className="glass-surface p-5 rounded-3xl border border-white/30 dark:border-white/10 shadow-lg backdrop-blur-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
                {t('Salmikkhang Member Directory', 'সালমিকখাং সদস্য ও রক্তদাতা তালিকা')}
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                {t('Browse verified youth members and emergency blood volunteers.', 'যাচাইকৃত সক্রিয় সদস্য ও জরুরি রক্তদাতাদের তালিকা।')}
              </p>
            </div>

            {/* Filter controls */}
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-auto">
                <Search className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={directorySearch}
                  onChange={e => setDirectorySearch(e.target.value)}
                  placeholder={t('Search name, village...', 'নাম বা এলাকা খুঁজুন...')}
                  className="w-full sm:w-auto pl-8 pr-3 py-2 text-xs rounded-xl border border-white/30 dark:border-white/10 bg-white/60 dark:bg-slate-900/60 text-slate-950 dark:text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 backdrop-blur-md"
                />
              </div>

              {/* Blood group selector */}
              <select
                value={bloodFilter}
                onChange={e => setBloodFilter(e.target.value)}
                className="flex-1 sm:flex-initial min-w-0 px-3 py-2 text-xs font-semibold rounded-xl border border-white/30 dark:border-white/10 bg-white/60 dark:bg-slate-900/60 text-slate-950 dark:text-slate-300 backdrop-blur-md"
              >
                <option value="All">{t('All Blood Groups', 'সকল রক্তের গ্রুপ')}</option>
                {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(b => (
                  <option key={b} value={b}>{b} Blood</option>
                ))}
              </select>

              {/* Village selector */}
              <select
                value={villageFilter}
                onChange={e => setVillageFilter(e.target.value)}
                className="flex-1 sm:flex-initial min-w-0 px-3 py-2 text-xs font-semibold rounded-xl border border-white/30 dark:border-white/10 bg-white/60 dark:bg-slate-900/60 text-slate-950 dark:text-slate-300 backdrop-blur-md"
              >
                <option value="All">{t('All Villages', 'সকল গ্রাম')}</option>
                <option value="Gaira">Gaira (গাইরা)</option>
                <option value="Jolchotro">Jolchotro (জলছত্র)</option>
                <option value="Madhupur">Madhupur (মধুপুর)</option>
              </select>
            </div>
          </div>

          {/* Members Card Grid (Reflected from reference image_c1acad42.png) */}
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredMembers.map(member => (
              <div
                key={member.id}
                className="glass-card p-5 rounded-3xl border border-white/40 dark:border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.25)] hover:border-emerald-500/40 space-y-4 backdrop-blur-2xl transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-950/80 dark:bg-emerald-950/80 border border-emerald-500/20 text-emerald-400 font-extrabold flex items-center justify-center text-lg overflow-hidden shrink-0 shadow-inner">
                      {member.avatar ? (
                        <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                      ) : (
                        member.name[0]
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-slate-950 dark:text-slate-100 tracking-tight leading-tight truncate">
                        {member.name}
                      </div>
                      <div className="text-xs text-emerald-900 dark:text-emerald-400 font-semibold mt-0.5 truncate">
                        {member.role}
                      </div>
                      <div className="text-[11px] text-slate-700 dark:text-slate-400 font-mono mt-0.5">
                        {member.memberNo}
                      </div>
                    </div>
                  </div>

                  {/* Blood Group Badge (exact frosted dark pill with red droplet from reference) */}
                  <div className="px-2.5 py-1 rounded-full bg-rose-950/70 border border-rose-500/30 text-rose-300 font-black text-xs flex items-center gap-1 shadow-inner shrink-0">
                    <Droplet className="w-3 h-3 fill-rose-500 text-rose-500" />
                    <span>{member.bloodGroup}</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-800 dark:text-slate-300 pt-1">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-emerald-800 dark:text-emerald-400/80 shrink-0" />
                    <span>{member.village}, Madhupur</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-emerald-800 dark:text-emerald-400/80 shrink-0" />
                    <span className="font-mono">
                      {member.phone || t('Private (Owner/Admin only)', 'গোপনীয় (শুধু অ্যাডমিন/নিজ)')}
                    </span>
                  </div>
                  {(member.email || member.ownerEmail) && (
                    <div className="flex items-center gap-2 truncate">
                      <Mail className="w-3.5 h-3.5 text-emerald-800 dark:text-emerald-400/80 shrink-0" />
                      <span className="truncate">{member.email || member.ownerEmail}</span>
                    </div>
                  )}
                </div>

                {member.skills && member.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2 border-t border-white/20 dark:border-white/10">
                    {member.skills.map((skill, i) => (
                      <span
                        key={i}
                        className="text-xs font-medium px-3 py-1 bg-slate-100/80 dark:bg-[#131f33]/85 border border-slate-200/60 dark:border-white/5 text-slate-900 dark:text-slate-300 rounded-xl"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB D: Events & Participation */}
      {activeTab === 'events' && (
        <div className="space-y-6">
          <div className="glass-surface p-5 rounded-3xl border border-white/30 dark:border-white/10 shadow-lg backdrop-blur-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-extrabold text-slate-950 dark:text-slate-100">
                {t('Community Events & Your Participation', 'কমিউনিটি ইভেন্ট ও অংশগ্রহণ')}
              </h2>
              <p className="text-xs text-slate-800 dark:text-slate-400 mt-0.5">
                {t('RSVP for upcoming drives or meetings. Members-only events are marked with a lock.', 'আসন্ন অনুষ্ঠানসমূহে অংশগ্রহণের নিশ্চয়তা দিন। সদস্যদের বিশেষ ইভেন্টগুলোতে অংশগ্রহণ করুন।')}
              </p>
            </div>
            {canManageEvents && (
              <button
                onClick={() => openPortalCreate('event')}
                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm shrink-0 self-start sm:self-auto transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>{t('Upload / Add Event', 'ইভেন্ট আপলোড / যোগ')}</span>
              </button>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
            {events.map(ev => {
              const isRsvpd = ev.rsvps.includes(currentMember.name);
              return (
                <div
                  key={ev.id}
                  className="glass-card rounded-3xl border border-white/40 dark:border-white/10 p-4 sm:p-6 shadow-lg flex flex-col justify-between space-y-4 backdrop-blur-2xl hover:border-emerald-500/40 transition-all"
                >
                  <div className="space-y-3">
                    {ev.image && (
                      <div className="h-36 rounded-2xl overflow-hidden border border-white/30 dark:border-white/10">
                        <img src={ev.image} alt={ev.title} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-bold px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-300 rounded-md">
                          {t(ev.category, ev.categoryBn)}
                        </span>
                        {ev.visibility === 'members_only' ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 dark:bg-amber-950 text-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800 rounded-md flex items-center gap-1">
                            <span>🔒</span>
                            <span>{t('Members Only', 'শুধুমাত্র সদস্য')}</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-400 rounded-md">
                            {t('Public Event', 'সার্বজনীন')}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-400">
                          {ev.date}
                        </span>
                        {canManageEvents && (
                          <button
                            onClick={() => openPortalEdit('event', ev)}
                            className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 text-slate-900 dark:text-slate-200 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>{t('Edit', 'এডিট')}</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <h3 className="font-bold text-base sm:text-lg text-slate-950 dark:text-slate-100">
                      {t(ev.title, ev.titleBn)}
                    </h3>

                    <p className="text-xs text-slate-800 dark:text-slate-300 leading-relaxed">
                      {t(ev.description, ev.descriptionBn)}
                    </p>

                    <div className="space-y-1 text-xs text-slate-800 dark:text-slate-400 pt-1">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-emerald-800 dark:text-emerald-400 shrink-0" />
                        <span>{t(ev.location, ev.locationBn)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-emerald-800 dark:text-emerald-400 shrink-0" />
                        <span>{ev.rsvps.length} {t('members attending', 'সদস্য অংশ নিচ্ছেন')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-400">
                      {isRsvpd ? (
                        <span className="text-emerald-900 dark:text-emerald-400 font-bold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          <span>{t('You are attending', 'আপনি অংশ নিচ্ছেন')}</span>
                        </span>
                      ) : (
                        t('Not yet registered', 'এখনো নিশ্চিত করেননি')
                      )}
                    </span>
                    <button
                      onClick={() => toggleEventRsvp(ev.id, currentMember.name)}
                      className={`w-full sm:w-auto px-4 py-2 text-xs font-bold rounded-xl transition-colors ${
                        isRsvpd
                          ? 'bg-rose-50 dark:bg-rose-950 text-rose-800 dark:text-rose-400 hover:bg-rose-100'
                          : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                      }`}
                    >
                      {isRsvpd ? t('Cancel Attendance', 'অংশগ্রহণ বাতিল') : t('Confirm RSVP', 'অংশগ্রহণ নিশ্চিত করুন')}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB: Village Public Records (Visible to Admin, President (read-only) & Data Collector) */}
      {activeTab === 'residents' && canAccessDataCollectorTab && (
        <VillageResidentsManager isAdmin={isAdminLoggedIn} />
      )}

      {/* TAB: Treasury & Cash Book (Add/Edit/Delete by Cashier, Assistant Cashier & Admin) */}
      {activeTab === 'fund' && (
        <TreasuryFundsManager isAdmin={isAdminLoggedIn && !previewMemberId} />
      )}

      {/* TAB: Organization Structure & Role Portfolios */}
      {activeTab === 'roles' && (
        <OrganizationStructure isAdmin={false} />
      )}

        </div>
      </div>

      {/* Notice / Event Create & Edit Modal for Publicity Secretary & Authorized Officers */}
      {portalModalMode && portalModalTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-start sm:items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-5 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 my-auto max-h-[92dvh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-base text-slate-950 dark:text-slate-100">
                {portalModalMode === 'create' ? t('Upload / Create ', 'নতুন আপলোড: ') : t('Edit ', 'সম্পাদনা: ')}
                {portalModalTarget === 'news' ? t('Official Notice', 'অফিসিয়াল নোটিশ') : t('Community Event', 'অনুষ্ঠান / ইভেন্ট')}
              </h3>
              <button
                type="button"
                onClick={() => setPortalModalMode(null)}
                className="p-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePortalSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t('Title (English) *', 'শিরোনাম (ইংরেজি) *')}
                </label>
                <input
                  type="text"
                  required
                  value={portalForm.title || ''}
                  onChange={e => setPortalForm({ ...portalForm, title: e.target.value })}
                  placeholder={portalModalTarget === 'news' ? 'e.g. Monthly General Meeting Notice' : 'e.g. Village Clean-up Drive'}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t('Title (Bangla)', 'শিরোনাম (বাংলা)')}
                </label>
                <input
                  type="text"
                  value={portalForm.titleBn || ''}
                  onChange={e => setPortalForm({ ...portalForm, titleBn: e.target.value })}
                  placeholder={portalModalTarget === 'news' ? 'যেমন: মাসিক সাধারণ সভার নোটিশ' : 'যেমন: পরিচ্ছন্নতা অভিযান'}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                <label className="block font-bold text-slate-800 dark:text-slate-200 text-xs">
                  {t('Visibility & Audience *', 'দর্শক ও দৃশ্যমানতা *')}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className={`p-3 rounded-xl border cursor-pointer flex items-center gap-2.5 transition-all ${
                    portalForm.visibility !== 'members_only'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-950 dark:text-emerald-300 font-bold ring-1 ring-emerald-500'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}>
                    <input
                      type="radio"
                      name="portal_visibility"
                      value="public"
                      checked={portalForm.visibility !== 'members_only'}
                      onChange={() => setPortalForm({ ...portalForm, visibility: 'public' })}
                      className="accent-emerald-600"
                    />
                    <div>
                      <div className="text-xs font-bold">{t('Public', 'সার্বজনীন')}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                        {t('Visible to all visitors', 'সবাই দেখতে পাবে')}
                      </div>
                    </div>
                  </label>

                  <label className={`p-3 rounded-xl border cursor-pointer flex items-center gap-2.5 transition-all ${
                    portalForm.visibility === 'members_only'
                      ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-500 text-amber-950 dark:text-amber-300 font-bold ring-1 ring-amber-500'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}>
                    <input
                      type="radio"
                      name="portal_visibility"
                      value="members_only"
                      checked={portalForm.visibility === 'members_only'}
                      onChange={() => setPortalForm({ ...portalForm, visibility: 'members_only' })}
                      className="accent-amber-600"
                    />
                    <div>
                      <div className="text-xs font-bold flex items-center gap-1">
                        <span>🔒</span>
                        <span>{t('Members Only', 'শুধুমাত্র সদস্য')}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                        {t('Only members can view', 'শুধু সদস্যদের পোর্টালে যাবে')}
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {portalModalTarget === 'news' ? (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Category</label>
                      <select
                        value={portalForm.category || 'Notice'}
                        onChange={e => setPortalForm({ ...portalForm, category: e.target.value, categoryBn: e.target.value === 'Notice' ? 'নোটিশ' : 'ঘোষণা' })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                      >
                        <option value="Notice">Notice (নোটিশ)</option>
                        <option value="Announcement">Announcement (ঘোষণা)</option>
                        <option value="Education">Education (শিক্ষা)</option>
                        <option value="Environment">Environment (পরিবেশ)</option>
                        <option value="Sports">Sports (খেলাধুলা)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Date</label>
                      <input
                        type="date"
                        value={portalForm.date || ''}
                        onChange={e => setPortalForm({ ...portalForm, date: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                      />
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-rose-600" />
                        <span>{t('Official PDF Attachment', 'অফিসিয়াল PDF সংযুক্তি')}</span>
                      </label>
                      {portalForm.pdfAttachment && (
                        <button
                          type="button"
                          onClick={() => setPortalForm({ ...portalForm, pdfAttachment: undefined })}
                          className="text-[11px] font-semibold text-rose-600 hover:underline"
                        >
                          {t('Remove PDF', 'PDF বাতিল')}
                        </button>
                      )}
                    </div>
                    {portalForm.pdfAttachment ? (
                      <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-rose-200 dark:border-rose-900 flex items-center justify-between gap-2">
                        <div className="truncate font-bold text-xs text-slate-900 dark:text-slate-100">
                          {portalForm.pdfAttachment.fileName} ({portalForm.pdfAttachment.fileSize})
                        </div>
                      </div>
                    ) : (
                      <label className="border-2 border-dashed border-rose-200 hover:border-rose-400 dark:border-slate-700 bg-rose-50/40 dark:bg-slate-800/40 rounded-xl p-4 text-center cursor-pointer transition-colors block">
                        <input type="file" accept="application/pdf" onChange={handlePortalPdfUpload} className="hidden" />
                        <Upload className="w-5 h-5 text-rose-600 mx-auto mb-1" />
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {t('Click to upload PDF notice (max 500 KB)', 'PDF নোটিশ আপলোড করতে ক্লিক করুন')}
                        </div>
                      </label>
                    )}
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Summary</label>
                    <textarea
                      rows={2}
                      value={portalForm.summary || ''}
                      onChange={e => setPortalForm({ ...portalForm, summary: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Full Content</label>
                    <textarea
                      rows={3}
                      value={portalForm.content || ''}
                      onChange={e => setPortalForm({ ...portalForm, content: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Category</label>
                      <select
                        value={portalForm.category || 'Meeting'}
                        onChange={e => setPortalForm({ ...portalForm, category: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                      >
                        <option value="Meeting">Meeting (সভা)</option>
                        <option value="Environment">Environment (পরিবেশ)</option>
                        <option value="Culture">Culture (সংস্কৃতি)</option>
                        <option value="Sports">Sports (খেলাধুলা)</option>
                        <option value="Education">Education (শিক্ষা)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Date *</label>
                      <input
                        type="date"
                        required
                        value={portalForm.date || ''}
                        onChange={e => setPortalForm({ ...portalForm, date: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Time</label>
                      <input
                        type="text"
                        value={portalForm.time || ''}
                        onChange={e => setPortalForm({ ...portalForm, time: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Location</label>
                      <input
                        type="text"
                        value={portalForm.location || ''}
                        onChange={e => setPortalForm({ ...portalForm, location: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Description</label>
                    <textarea
                      rows={3}
                      value={portalForm.description || ''}
                      onChange={e => setPortalForm({ ...portalForm, description: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </>
              )}

              {/* Image Upload */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-700 dark:text-slate-300">
                    {t('Upload Photo / Banner (optional)', 'ছবি বা ব্যানার আপলোড (ঐচ্ছিক)')}
                  </label>
                  {portalForm.image && (
                    <button
                      type="button"
                      onClick={() => setPortalForm({ ...portalForm, image: '' })}
                      className="text-[11px] font-semibold text-rose-600 hover:underline"
                    >
                      {t('Remove photo', 'ছবি বাতিল')}
                    </button>
                  )}
                </div>
                {portalForm.image ? (
                  <img src={portalForm.image} alt="Preview" className="w-full h-36 object-cover rounded-xl border border-slate-200 dark:border-slate-700" />
                ) : (
                  <label className="border-2 border-dashed border-emerald-300 dark:border-slate-700 hover:border-emerald-500 bg-emerald-50/40 dark:bg-slate-800/40 rounded-xl p-4 text-center cursor-pointer transition-colors block">
                    <input type="file" accept="image/*" onChange={handlePortalImageUpload} className="hidden" />
                    <Upload className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {t('Click to upload photo from device', 'ডিভাইস থেকে ছবি আপলোড করুন')}
                    </div>
                  </label>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setPortalModalMode(null)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-400 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  {t('Cancel', 'বাতিল')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-xs"
                >
                  {portalModalMode === 'edit' ? t('Save Changes', 'হালনাগাদ করুন') : t('Publish Now', 'প্রকাশ করুন')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
