import React, { useEffect, useState } from 'react';
import { useCommunity } from '../context/CommunityContext';
import { Member, DiscussionPost } from '../types';
import { VillageResidentsManager } from './VillageResidentsManager';
import { TreasuryFundsManager } from './TreasuryFundsManager';
import { OrganizationStructure } from './OrganizationStructure';
import logoImg from '../assets/images/logo.png';
import {
  Shield,
  MapPin,
  Droplet,
  Phone,
  Mail,
  Calendar,
  MessageSquare,
  ThumbsUp,
  Search,
  Users,
  Award,
  Send,
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
    addDiscussionPost,
    likeDiscussionPost,
    addDiscussionReply,
    updateMember,
    toggleEventRsvp,
    firebaseUser,
    authLoading,
    loginWithGoogle,
    logoutGoogle,
    isAdminLoggedIn,
    quickSwitchMember
  } = useCommunity();

  // Active tab inside member portal
  const [activeTab, setActiveTab] = useState<'wall' | 'residents' | 'fund' | 'roles' | 'directory' | 'notices' | 'events'>('wall');

  // Notification center popup state
  const [notificationOpen, setNotificationOpen] = useState(false);

  // New post state
  const [newPostText, setNewPostText] = useState('');
  const [newPostCategory, setNewPostCategory] = useState<DiscussionPost['category']>('General');

  // Reply inputs state
  const [replyInputs, setReplyInputs] = useState<{ [key: string]: string }>({});

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

  const unreadNotifsCount = notifications.filter(n => !n.read).length;
  const canAccessDataCollectorTab = isAdminLoggedIn || currentMember?.role === 'Data Collector';

  useEffect(() => {
    if (activeTab === 'residents' && !canAccessDataCollectorTab) {
      setActiveTab('wall');
    }
  }, [activeTab, canAccessDataCollectorTab]);

  // 1. MEMBER LOGIN GATEWAY (Google Auth + Admin-verified Membership)
  if (!currentMember) {
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
                'Sign in with your registered Google account to access notices, village records, treasury, and discussions.',
                'নোটিশ, গ্রামের তথ্য ভাণ্ডার, তহবিল ও ফোরামে প্রবেশ করতে আপনার নিবন্ধিত Google অ্যাকাউন্ট দিয়ে লগইন করুন।'
              )}
            </p>
          </div>

          {authLoading ? (
            <div className="py-6 text-center text-xs font-bold text-emerald-800 dark:text-emerald-300">
              {t('Checking Google session...', 'Google সেশন যাচাই করা হচ্ছে...')}
            </div>
          ) : firebaseUser ? (
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
                  onClick={() => void logoutGoogle()}
                  className="py-3 px-4 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white font-bold text-xs rounded-xl"
                >
                  {t('Switch Google Account', 'অন্য অ্যাকাউন্ট দিন')}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => void loginWithGoogle()}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm rounded-xl shadow-lg transition-transform hover:-translate-y-0.5 active:translate-y-0 border border-white/20 flex items-center justify-center gap-2"
              >
                <Shield className="w-4 h-4" />
                <span>{t('Sign in with Google →', 'Google দিয়ে লগইন করুন →')}</span>
              </button>

              <p className="text-[11px] text-center text-slate-600 dark:text-slate-400">
                {t(
                  'Use the Gmail address approved by Salmikkhang Executive Admin.',
                  'অ্যাডমিন কর্তৃক অনুমোদিত আপনার Gmail ঠিকানা দিয়ে সাইন-ইন করুন।'
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

  const handlePostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostText.trim()) return;
    addDiscussionPost(newPostText.trim(), newPostCategory);
    setNewPostText('');
  };

  const handleReplySubmit = (postId: string) => {
    const text = replyInputs[postId]?.trim();
    if (!text) return;
    addDiscussionReply(postId, text);
    setReplyInputs(prev => ({ ...prev, [postId]: '' }));
  };

  const handleSaveProfile = () => {
    updateMember(currentMember.id, {
      phone: editPhone,
      village: editVillage,
      bloodGroup: editBlood,
      bio: editBio
    });
    setIsEditingProfile(false);
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

          {/* Admin Role Preview Switcher (visible only to signed-in Admin) */}
          {isAdminLoggedIn && (
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
              { id: 'wall', labelEn: 'Discussion Forum', labelBn: 'কমিউনিটি ফোরাম', icon: MessageSquare },
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
        <div className="grid xl:grid-cols-12 gap-6 items-start">
          
          {/* Main Discussion Feed */}
          <div className="xl:col-span-8 space-y-6 min-w-0">
            
            {/* Create Post Box */}
            <div className="glass-card p-5 sm:p-6 rounded-3xl border border-white/40 dark:border-white/10 shadow-lg space-y-4 backdrop-blur-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-700 dark:text-emerald-400 font-bold flex items-center justify-center text-sm border border-emerald-500/20 shadow-sm">
                  {currentMember.name[0]}
                </div>
                <div>
                  <div className="font-bold text-sm text-slate-900 dark:text-slate-100">{currentMember.name}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">{currentMember.role} · {currentMember.village}</div>
                </div>
              </div>

              <form onSubmit={handlePostSubmit} className="space-y-3">
                <textarea
                  rows={3}
                  value={newPostText}
                  onChange={e => setNewPostText(e.target.value)}
                  placeholder={t(
                    'Share an idea, question, or update with community youth...',
                    'কমিউনিটি সদস্যদের সাথে কোনো প্রস্তাব, ভাবনা বা প্রশ্ন শেয়ার করুন...'
                  )}
                  className="w-full px-4 py-3 text-sm rounded-2xl border border-white/30 dark:border-white/10 bg-white/60 dark:bg-slate-900/60 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 backdrop-blur-md"
                />

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{t('Topic:', 'বিষয়:')}</span>
                    <select
                      value={newPostCategory}
                      onChange={e => setNewPostCategory(e.target.value as any)}
                      className="text-xs font-medium bg-white/60 dark:bg-slate-900/60 px-3 py-1.5 rounded-xl border border-white/30 dark:border-white/10 text-slate-700 dark:text-slate-300 backdrop-blur-md"
                    >
                      <option value="General">{t('General Thought', 'সাধারণ আলোচনা')}</option>
                      <option value="Project Idea">{t('Project Idea', 'উদ্যোগ প্রস্তাব')}</option>
                      <option value="Event Prep">{t('Event Prep', 'অনুষ্ঠানের প্রস্তুতি')}</option>
                      <option value="Question">{t('Question / Help', 'সহায়তা / প্রশ্ন')}</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md border border-white/20 transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{t('Post to Wall', 'পোস্ট করুন')}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Discussions List */}
            <div className="space-y-4">
              {discussions.map(post => (
                <div
                  key={post.id}
                  className="glass-card p-4 sm:p-6 rounded-3xl border border-white/40 dark:border-white/10 shadow-lg space-y-4 backdrop-blur-2xl"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-slate-800 text-emerald-950 dark:text-emerald-300 font-bold flex items-center justify-center text-sm border border-emerald-100 dark:border-slate-700 shrink-0">
                        {post.authorName[0]}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-slate-950 dark:text-slate-100 truncate">{post.authorName}</div>
                        <div className="text-[11px] text-slate-800 dark:text-slate-400 truncate">{post.authorRole} · {post.date}</div>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950 text-emerald-950 dark:text-emerald-300 rounded-lg shrink-0">
                      {post.category}
                    </span>
                  </div>

                  <p className="text-sm text-slate-950 dark:text-slate-200 leading-relaxed">
                    {post.text}
                  </p>

                  <div className="flex items-center gap-4 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <button
                      onClick={() => likeDiscussionPost(post.id)}
                      className={`flex items-center gap-1.5 font-bold transition-colors ${
                        post.likedByMe ? 'text-emerald-900 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-400 hover:text-emerald-900'
                      }`}
                    >
                      <ThumbsUp className={`w-4 h-4 ${post.likedByMe ? 'fill-emerald-700' : ''}`} />
                      <span>{post.likes} {t('Appreciate', 'পছন্দ')}</span>
                    </button>
                    <span className="text-slate-400 dark:text-slate-600">·</span>
                    <span className="text-slate-800 dark:text-slate-400">
                      {post.replies.length} {t('Replies', 'মন্তব্য')}
                    </span>
                  </div>

                  {/* Replies list */}
                  {post.replies.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      {post.replies.map(reply => (
                        <div key={reply.id} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl space-y-1 text-xs">
                          <div className="flex flex-wrap items-center justify-between gap-1 text-slate-800 dark:text-slate-400">
                            <span className="font-bold text-slate-950 dark:text-slate-100">{reply.author} <small className="text-slate-700 dark:text-slate-400 font-normal">({reply.role})</small></span>
                            <span className="text-[10px] text-slate-700 dark:text-slate-400">{reply.date}</span>
                          </div>
                          <p className="text-slate-900 dark:text-slate-300">{reply.text}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add reply row */}
                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="text"
                      value={replyInputs[post.id] || ''}
                      onChange={e => setReplyInputs({ ...replyInputs, [post.id]: e.target.value })}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleReplySubmit(post.id);
                        }
                      }}
                      placeholder={t('Write a supportive reply...', 'একটি মন্তব্য লিখুন...')}
                      className="flex-1 min-w-0 px-3 sm:px-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-950 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                    <button
                      onClick={() => handleReplySubmit(post.id)}
                      className="px-3 py-2 bg-emerald-100 dark:bg-slate-800 hover:bg-emerald-200 dark:hover:bg-slate-700 text-emerald-950 dark:text-emerald-300 font-bold text-xs rounded-xl transition-colors shrink-0"
                    >
                      {t('Reply', 'উত্তর')}
                    </button>
                  </div>
                </div>
              ))}
            </div>

          </div>

          {/* Right Column: Values & Emergency Blood Donors Quick Box */}
          <div className="xl:col-span-4 space-y-6 min-w-0">
            
            {/* Urgent Blood Network Box */}
            <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-3xl p-5 space-y-3 text-rose-950 dark:text-rose-200">
              <div className="flex items-center gap-2 font-bold text-sm text-rose-900 dark:text-rose-300">
                <Droplet className="w-4 h-4 fill-rose-600 text-rose-600" />
                <span>{t('Emergency Blood Network', 'জরুরি রক্তের নেটওয়ার্ক')}</span>
              </div>
              <p className="text-xs text-rose-800/90 dark:text-rose-300/90 leading-relaxed">
                {t(
                  'Salmikkhang members maintain a blood donor registry for Gaira & Jolchotro patients in Madhupur hospitals.',
                  'মধুপুরের যে কোনো জরুরি প্রয়োজনে আমাদের সদস্যদের রক্তের গ্রুপ ও ফোন নম্বর প্রস্তুত রাখা আছে।'
                )}
              </p>
              <button
                onClick={() => setActiveTab('directory')}
                className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-colors"
              >
                {t('Find Blood Donors by Group →', 'রক্তদাতাদের তালিকা দেখুন →')}
              </button>
            </div>

            {/* Community Values Card */}
            <div className="bg-emerald-900 dark:bg-slate-800 text-white rounded-3xl p-6 space-y-3">
              <div className="text-emerald-300 font-bold text-xs uppercase tracking-wider">
                {t('YOUTH CODE OF CONDUCT', 'সদস্য নীতিমালা')}
              </div>
              <h3 className="font-extrabold text-base text-white">
                {t('Our Shared Commitments', 'আমাদের অঙ্গীকার')}
              </h3>
              <ul className="space-y-2 text-xs text-emerald-100/90 dark:text-slate-300 leading-relaxed">
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Respect all community elders and encourage younger students.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Actively care for local trees and keep public spaces clean.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Honor and preserve Achik cultural heritage and songs.</span>
                </li>
              </ul>
            </div>

          </div>

        </div>
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

                  {item.pdfAttachment && (
                    <span className="text-xs font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1">
                      <FileText className="w-4 h-4 shrink-0" />
                      <span>{t('Official PDF Attached', 'অফিসিয়াল PDF সংযুক্ত')}</span>
                    </span>
                  )}
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
          <div className="glass-surface p-5 rounded-3xl border border-white/30 dark:border-white/10 shadow-lg backdrop-blur-2xl">
            <h2 className="text-xl font-extrabold text-slate-950 dark:text-slate-100">
              {t('Community Events & Your Participation', 'কমিউনিটি ইভেন্ট ও অংশগ্রহণ')}
            </h2>
            <p className="text-xs text-slate-800 dark:text-slate-400 mt-0.5">
              {t('RSVP for upcoming drives or meetings. Members-only events are marked with a lock.', 'আসন্ন অনুষ্ঠানসমূহে অংশগ্রহণের নিশ্চয়তা দিন। সদস্যদের বিশেষ ইভেন্টগুলোতে অংশগ্রহণ করুন।')}
            </p>
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
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-400">
                        {ev.date}
                      </span>
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

      {/* TAB: Village Public Records (Visible only to Admin & Data Collector) */}
      {activeTab === 'residents' && canAccessDataCollectorTab && (
        <VillageResidentsManager isAdmin={isAdminLoggedIn} />
      )}

      {/* TAB: Treasury & Cash Book (Add/Remove by Cashier, Assistant Cashier & Admin) */}
      {activeTab === 'fund' && (
        <TreasuryFundsManager isAdmin={false} />
      )}

      {/* TAB: Organization Structure & Role Portfolios */}
      {activeTab === 'roles' && (
        <OrganizationStructure isAdmin={false} />
      )}

        </div>
      </div>

    </div>
  );
};
