import React, { useState } from 'react';
import { useCommunity } from '../context/CommunityContext';
import { Member, Project, Role } from '../types';
import { VillageResidentsManager } from './VillageResidentsManager';
import { TreasuryFundsManager } from './TreasuryFundsManager';
import { OrganizationStructure } from './OrganizationStructure';
import { BackgroundSettings } from './BackgroundSettings';
import { compressImage } from '../lib/imageUpload';
import logoImg from '../assets/images/logo.png';
import {
  LayoutDashboard,
  Users,
  Newspaper,
  Calendar,
  Layers,
  Image as ImageIcon,
  UserPlus,
  Mail,
  Settings,
  Plus,
  Search,
  Check,
  X,
  Trash2,
  Edit2,
  Download,
  ExternalLink,
  Shield,
  Upload,
  LogOut,
  FileText,
  Award,
  Home,
  DollarSign,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const {
    t,
    settings,
    members,
    joinRequests,
    events,
    news,
    projects,
    gallery,
    messages,
    funds,
    villageResidents,
    setCurrentView,
    approveJoinRequest,
    rejectJoinRequest,
    deleteMember,
    updateMember,
    registerMemberByAdmin,
    addNewsItem,
    updateNewsItem,
    deleteNewsItem,
    addEvent,
    updateEvent,
    deleteEvent,
    addProject,
    updateProject,
    deleteProject,
    addGalleryItem,
    deleteGalleryItem,
    markMessageStatus,
    deleteMessage,
    updateSettings,
    exportDataJSON,
    resetAllData,
    isAdminLoggedIn,
    adminLogin,
    adminLogout,
    firebaseUser,
    authLoading,
    authError,
    clearAuthError,
    logoutGoogle,
    showToast
  } = useCommunity();

  // Active admin section
  const [activeAdminTab, setActiveAdminTab] = useState<
    'overview' | 'members' | 'roles' | 'residents' | 'funds' | 'news' | 'events' | 'projects' | 'gallery' | 'requests' | 'messages' | 'settings'
  >('overview');

  const [searchTerm, setSearchTerm] = useState('');

  // Modals for admin creation / editing
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [modalTarget, setModalTarget] = useState<'news' | 'event' | 'project' | 'gallery' | 'member' | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [deletingMember, setDeletingMember] = useState<Member | null>(null);

  // Form states
  const [formData, setFormData] = useState<any>({});

  const pendingRequests = joinRequests.filter(r => r.status === 'Pending');
  const unreadMessages = messages.filter(m => m.status === 'Unread');

  // Handle local image file upload with compression for Firestore size safety
  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const compressed = await compressImage(file, 1280, 350_000);
      setFormData((prev: any) => ({ ...prev, image: compressed, avatar: compressed }));
    } catch {
      showToast(t('Could not process this image file.', 'ছবিটি প্রসেস করা যায়নি।'), 'warning');
    }
  };

  // Handle local PDF upload into Base64 Data URL (500 KB max for Firestore 1 MB doc limit)
  const handlePdfFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        setFormData((prev: any) => ({
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

  const openCreateModal = (target: 'news' | 'event' | 'project' | 'gallery' | 'member') => {
    setModalTarget(target);
    setModalMode('create');
    setEditingItem(null);
    if (target === 'news') {
      setFormData({
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
    } else if (target === 'event') {
      setFormData({
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
    } else if (target === 'project') {
      setFormData({
        title: '',
        titleBn: '',
        category: 'Environment',
        categoryBn: 'পরিবেশ',
        status: 'Ongoing',
        statusBn: 'চলমান',
        progress: 25,
        description: '',
        descriptionBn: '',
        image: '',
        volunteersNeeded: 10,
        volunteersEnrolled: 0
      });
    } else if (target === 'gallery') {
      setFormData({
        title: '',
        titleBn: '',
        category: 'Community',
        categoryBn: 'কমিউনিটি',
        image: '',
        date: new Date().toISOString().split('T')[0]
      });
    } else if (target === 'member') {
      setFormData({
        name: '',
        email: '',
        phone: '',
        role: 'Member',
        village: 'Gaira',
        bloodGroup: 'O+',
        skills: 'Community Volunteering, Youth Mentorship',
        interests: 'Environmental Conservation, Sports',
        bio: 'Active youth member of Salmikkhang community.',
        image: '',
        avatar: ''
      });
    }
  };

  const openEditModal = (target: 'news' | 'event' | 'project' | 'gallery' | 'member', item: any) => {
    setModalTarget(target);
    setModalMode('edit');
    setEditingItem(item);
    setFormData({
      ...item,
      skills: Array.isArray(item.skills) ? item.skills.join(', ') : item.skills || '',
      visibility: item.visibility || 'public'
    });
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (modalTarget === 'news') {
      if (modalMode === 'create') {
        addNewsItem(formData);
      } else {
        updateNewsItem(editingItem.id, formData);
      }
    } else if (modalTarget === 'event') {
      if (modalMode === 'create') {
        addEvent(formData);
      } else {
        updateEvent(editingItem.id, formData);
      }
    } else if (modalTarget === 'project') {
      if (modalMode === 'create') {
        addProject(formData);
      } else {
        updateProject(editingItem.id, formData);
      }
    } else if (modalTarget === 'gallery') {
      addGalleryItem(formData);
    } else if (modalTarget === 'member') {
      const skillsArray = typeof formData.skills === 'string'
        ? formData.skills.split(',').map((s: string) => s.trim()).filter(Boolean)
        : formData.skills || [];
      if (modalMode === 'create') {
        registerMemberByAdmin({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          role: formData.role || 'Member',
          village: formData.village || 'Gaira',
          bloodGroup: formData.bloodGroup || 'O+',
          skills: skillsArray,
          bio: formData.bio,
          avatar: formData.avatar || formData.image || ''
        });
      } else {
        updateMember(editingItem.id, {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          role: formData.role,
          village: formData.village,
          bloodGroup: formData.bloodGroup,
          skills: skillsArray,
          bio: formData.bio,
          avatar: formData.avatar || formData.image || ''
        });
      }
    }
    setModalMode(null);
    setModalTarget(null);
    setEditingItem(null);
  };

  // 1. ADMIN LOGIN GATE (If not logged in as Admin via Google)
  if (!isAdminLoggedIn) {
    return (
      <div className="max-w-md mx-auto py-10 sm:py-20 px-4">
        <div className="glass-card p-6 sm:p-10 rounded-3xl border border-white/40 dark:border-white/10 shadow-2xl space-y-6 backdrop-blur-2xl">
          <div className="text-center space-y-2">
            <img
              src={logoImg}
              alt="Salmikkhang Logo"
              className="w-18 h-18 sm:w-20 sm:h-20 rounded-full object-contain mx-auto shadow-lg ring-2 ring-white/40"
            />
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-950 dark:text-slate-100 tracking-tight">
              {t('Executive Admin Login', 'অ্যাডমিন প্যানেল লগইন')}
            </h2>
            <p className="text-slate-800 dark:text-slate-400 text-xs sm:text-sm">
              {t(
                'Sign in with an authorized Council Administrator Google account to manage the live cloud database.',
                'লাইভ ক্লাউড ডেটাবেস পরিচালনা করতে অনুমোদিত অ্যাডমিন Google অ্যাকাউন্ট দিয়ে লগইন করুন।'
              )}
            </p>
          </div>

          {authLoading ? (
            <div className="py-6 text-center text-xs font-bold text-emerald-800 dark:text-emerald-300">
              {t('Checking Google session...', 'Google সেশন যাচাই করা হচ্ছে...')}
            </div>
          ) : firebaseUser ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50/90 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 text-xs space-y-1.5">
                <div className="font-bold text-amber-950 dark:text-amber-200">
                  {t('Signed-in account does not have Admin access', 'এই অ্যাকাউন্টে অ্যাডমিন অনুমতি নেই')}
                </div>
                <div className="text-slate-700 dark:text-slate-300 break-all">
                  {t('Currently signed in as:', 'বর্তমান অ্যাকাউন্ট:')}{' '}
                  <span className="font-mono font-bold">{firebaseUser.email}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => void logoutGoogle()}
                className="w-full py-3 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-colors"
              >
                {t('Sign out & Switch Google Account', 'লগআউট করে অন্য Google অ্যাকাউন্ট দিন')}
              </button>
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

              <button
                type="button"
                onClick={() => void adminLogin()}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm rounded-xl shadow-lg transition-transform hover:-translate-y-0.5 active:translate-y-0 border border-white/20 flex items-center justify-center gap-2.5"
              >
                <Shield className="w-4 h-4" />
                <span>{t('Sign in with Google (Admin) →', 'Google দিয়ে অ্যাডমিন লগইন →')}</span>
              </button>
            </div>
          )}

          <div className="text-center pt-2">
            <button
              onClick={() => setCurrentView('website')}
              className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium"
            >
              ← {t('Back to Public Website', 'পাবলিক ওয়েবসাইটে ফিরে যান')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. ADMIN DASHBOARD (When logged in)
  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 transition-colors">
      
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 sm:pb-6 border-b border-slate-200 dark:border-slate-800 gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <img
              src={logoImg}
              alt="Salmikkhang Logo"
              className="w-9 h-9 rounded-full object-contain shadow-sm ring-1 ring-emerald-500/30 shrink-0"
            />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-400">
              SALMIKKHANG EXECUTIVE WORKSPACE
            </span>
          </div>
          <h1 className="text-xl sm:text-3xl font-extrabold text-slate-950 dark:text-slate-100 mt-1">
            {t('Community Administration & CMS', 'কমিউনিটি পরিচালনা ও নিয়ন্ত্রণ প্যানেল')}
          </h1>
          <p className="text-xs text-slate-800 dark:text-slate-400 mt-0.5">
            {t('Full dynamic control over members, applications, events, circulars with PDF upload, and settings.', 'সদস্য নিবন্ধন, অনুষ্ঠান ও PDF নোটিশ প্রকাশ এবং কমিউনিটি নিয়ন্ত্রণের কেন্দ্রীয় ড্যাশবোর্ড।')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setCurrentView('website')}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-950 dark:text-slate-200 font-semibold text-xs rounded-xl transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>{t('View Live Site', 'ওয়েবসাইট দেখুন')}</span>
          </button>
          <button
            onClick={exportDataJSON}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t('Backup JSON', 'ব্যাকআপ ডাউনলোড')}</span>
          </button>
          <button
            onClick={adminLogout}
            className="flex items-center gap-1 px-3 py-2 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-800 dark:text-rose-400 font-bold text-xs rounded-xl transition-colors"
            title="Log out of Admin Workspace"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{t('Logout', 'লগআউট')}</span>
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-12 gap-5 lg:gap-8 pt-5 sm:pt-6 items-start">
        
        {/* Sidebar Nav (Left vertical list) */}
        <aside className="md:col-span-4 lg:col-span-3 min-w-0 glass-surface p-3 rounded-3xl border border-white/30 dark:border-white/10 shadow-lg backdrop-blur-2xl h-fit">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400 px-3 py-1.5">
            {t('WORKSPACE SECTIONS', 'কমিউনিটি ব্যবস্থাপনা')}
          </div>

          <div className="flex flex-col space-y-1">
            {[
              { id: 'overview', labelEn: 'Overview Dashboard', labelBn: 'এক নজরে তথ্য', icon: LayoutDashboard },
              { id: 'roles', labelEn: 'Organization Structure & Roles', labelBn: 'পদবি ও দায়িত্ব বণ্টন', icon: Award },
              { id: 'residents', labelEn: 'Village Public Records (Census)', labelBn: 'গ্রামবাসী ও নাগরিক তথ্য', icon: Home, count: villageResidents.length },
              { id: 'funds', labelEn: 'Treasury & Cash Book', labelBn: 'তহবিল ও ক্যাশ বুক', icon: DollarSign, count: funds.length },
              { id: 'members', labelEn: 'Member Registration & Registry', labelBn: 'সদস্য নিবন্ধন ও তালিকা', icon: Users, count: members.length },
              { id: 'news', labelEn: 'News & PDF Notices', labelBn: 'নোটিশ ও PDF পরিপত্র', icon: Newspaper, count: news.length },
              { id: 'events', labelEn: 'Events & Audience Manager', labelBn: 'অনুষ্ঠান ও ক্যালেন্ডার', icon: Calendar, count: events.length },
              { id: 'requests', labelEn: 'Join Applications', labelBn: 'নতুন সদস্য আবেদন', icon: UserPlus, badge: pendingRequests.length },
              { id: 'projects', labelEn: 'Village Projects Tracker', labelBn: 'উদ্যোগ ও অগ্রগতি', icon: Layers, count: projects.length },
              { id: 'gallery', labelEn: 'Photo Gallery Albums', labelBn: 'ফটো গ্যালারি', icon: ImageIcon, count: gallery.length },
              { id: 'messages', labelEn: 'Contact Inquiries', labelBn: 'ইনবক্স বার্তা', icon: Mail, badge: unreadMessages.length },
              { id: 'settings', labelEn: 'Community Settings', labelBn: 'কমিউনিটি সেটিংস', icon: Settings },
            ].map(item => {
              const Icon = item.icon;
              const active = activeAdminTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveAdminTab(item.id as any);
                    setSearchTerm('');
                  }}
                  className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
                    active
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md font-bold border border-emerald-400/30'
                      : 'text-slate-950 dark:text-slate-300 hover:bg-white/40 dark:hover:bg-white/5 hover:text-emerald-900 dark:hover:text-emerald-400'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{t(item.labelEn, item.labelBn)}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 ? (
                    <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-amber-400 text-amber-950 shrink-0">
                      {item.badge}
                    </span>
                  ) : item.count !== undefined ? (
                    <span className={`text-[10px] shrink-0 ${active ? 'text-emerald-100 font-bold' : 'text-slate-700 dark:text-slate-400'}`}>
                      {item.count}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </aside>

        {/* Content Area */}
        <div className="md:col-span-8 lg:col-span-9 min-w-0 space-y-6">
          
          {/* 1. OVERVIEW DASHBOARD */}
          {activeAdminTab === 'overview' && (
            <div className="space-y-6">
              {/* Stat Counters */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="glass-card p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl border border-white/40 dark:border-white/10 shadow-lg backdrop-blur-xl">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-400">
                    <span>{t('Total Members', 'মোট সদস্য')}</span>
                    <Users className="w-4 h-4 text-emerald-700 shrink-0" />
                  </div>
                  <div className="text-2xl font-black text-slate-950 dark:text-slate-100 mt-1">{members.length}</div>
                  <div className="text-[10px] text-emerald-900 dark:text-emerald-400 font-semibold mt-0.5">
                    {t('Verified youth', 'যাচাইকৃত তরুণ')}
                  </div>
                </div>

                <div className="glass-card p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl border border-sky-500/20 dark:border-sky-500/20 shadow-lg backdrop-blur-xl">
                  <div className="flex items-center justify-between text-xs font-bold text-sky-900 dark:text-sky-400">
                    <span>{t('Village Census', 'নাগরিক তথ্য')}</span>
                    <Home className="w-4 h-4 text-sky-800 dark:text-sky-400 shrink-0" />
                  </div>
                  <div className="text-2xl font-black text-sky-950 dark:text-sky-300 mt-1">{villageResidents.length}</div>
                  <div className="text-[10px] text-sky-900 dark:text-sky-400 font-semibold mt-0.5">
                    {t('Households listed', 'পরিবারের তথ্য')}
                  </div>
                </div>

                <div className="glass-card p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl border border-amber-500/20 dark:border-amber-500/20 shadow-lg backdrop-blur-xl">
                  <div className="flex items-center justify-between text-xs font-bold text-amber-900 dark:text-amber-400">
                    <span>{t('Treasury Balance', 'তহবিল ব্যালেন্স')}</span>
                    <DollarSign className="w-4 h-4 text-amber-800 dark:text-amber-400 shrink-0" />
                  </div>
                  <div className="text-xl font-black text-amber-950 dark:text-amber-200 mt-1">
                    ৳ {funds.reduce((acc, f) => f.type === 'Inflow' ? acc + f.amount : acc - f.amount, 0).toLocaleString()}
                  </div>
                  <div className="text-[10px] text-amber-900 dark:text-amber-400 font-semibold mt-0.5">
                    {t('Audited cash book', 'ক্যাশ বুক অডিট')}
                  </div>
                </div>

                <div className="glass-card p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl border border-white/40 dark:border-white/10 shadow-lg backdrop-blur-xl">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-400">
                    <span>{t('Applications', 'নতুন আবেদন')}</span>
                    <UserPlus className="w-4 h-4 text-amber-600 shrink-0" />
                  </div>
                  <div className="text-2xl font-black text-slate-950 dark:text-slate-100 mt-1">{pendingRequests.length}</div>
                  <div className="text-[10px] text-amber-900 dark:text-amber-400 font-semibold mt-0.5">
                    {pendingRequests.length > 0 ? t('Awaiting review', 'পর্যালোচনা বাকি') : t('All reviewed', 'সব যাচাইকৃত')}
                  </div>
                </div>

                <div className="glass-card p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl border border-white/40 dark:border-white/10 shadow-lg backdrop-blur-xl">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-400">
                    <span>{t('Notices & PDF', 'নোটিশ ও PDF')}</span>
                    <FileText className="w-4 h-4 text-rose-600 shrink-0" />
                  </div>
                  <div className="text-2xl font-black text-slate-950 dark:text-slate-100 mt-1">{news.length}</div>
                  <div className="text-[10px] text-rose-800 dark:text-rose-400 font-semibold mt-0.5">
                    {news.filter(n => n.pdfAttachment).length} {t('with PDF file', 'টিতে PDF')}
                  </div>
                </div>

                <div className="glass-card p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl border border-white/40 dark:border-white/10 shadow-lg backdrop-blur-xl">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-400">
                    <span>{t('Messages', 'বার্তা')}</span>
                    <Mail className="w-4 h-4 text-blue-700 shrink-0" />
                  </div>
                  <div className="text-2xl font-black text-slate-950 dark:text-slate-100 mt-1">{messages.length}</div>
                  <div className="text-[10px] text-blue-900 dark:text-blue-400 font-semibold mt-0.5">
                    {unreadMessages.length} {t('unread', 'অপঠিত')}
                  </div>
                </div>
              </div>

              {/* Action Banner for Member Registration */}
              <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-3xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200 flex items-center justify-center font-bold">
                    <UserPlus className="w-5 h-5 text-emerald-700 dark:text-emerald-300" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-emerald-950 dark:text-emerald-200">
                      {t('Admin Member Registration System', 'অ্যাডমিন সদস্য নিবন্ধন ব্যবস্থা')}
                    </div>
                    <div className="text-xs text-emerald-800 dark:text-emerald-300">
                      {t('Only admins have authority to register youth members with full details and credentials.', 'শুধুমাত্র অ্যাডমিনরাই প্রয়োজনীয় তথ্য দিয়ে নতুন সদস্য রেজিস্টার করতে পারবেন।')}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => openCreateModal('member')}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0 flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>{t('Register New Member Now', 'নতুন সদস্য নিবন্ধন করুন')}</span>
                </button>
              </div>

              {/* Quick Summary Tables */}
              <div className="grid md:grid-cols-2 gap-6">
                
                {/* Recent Notices */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                      {t('Recent Notices & Circulars', 'সাম্প্রতিক নোটিশ ও পরিপত্র')}
                    </span>
                    <button
                      onClick={() => openCreateModal('news')}
                      className="text-xs text-emerald-700 dark:text-emerald-400 font-bold hover:underline"
                    >
                      + {t('Post Notice', 'নোটিশ দিন')}
                    </button>
                  </div>
                  <div className="space-y-2.5">
                    {news.slice(0, 3).map(n => (
                      <div key={n.id} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl flex items-center justify-between text-xs">
                        <div className="space-y-0.5 truncate pr-2">
                          <div className="font-bold text-slate-900 dark:text-slate-100 truncate flex items-center gap-1.5">
                            <span>{n.title}</span>
                            {n.visibility === 'members_only' ? (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 rounded shrink-0">
                                🔒 Members
                              </span>
                            ) : (
                              <span className="text-[9px] font-medium px-1.5 py-0.2 bg-blue-100 dark:bg-blue-950 text-blue-900 dark:text-blue-300 rounded shrink-0">
                                Public
                              </span>
                            )}
                            {n.pdfAttachment && (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 rounded flex items-center gap-0.5 shrink-0">
                                <FileText className="w-3 h-3" />
                                <span>PDF</span>
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">{n.date} · {n.category}</div>
                        </div>
                        <button
                          onClick={() => openEditModal('news', n)}
                          className="px-2 py-1 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-[11px] font-semibold shrink-0"
                        >
                          {t('Edit', 'এডিট')}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Upcoming Events */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                      {t('Upcoming Events & Drives', 'আসন্ন অনুষ্ঠানসমূহ')}
                    </span>
                    <button
                      onClick={() => openCreateModal('event')}
                      className="text-xs text-emerald-700 dark:text-emerald-400 font-bold hover:underline"
                    >
                      + {t('Add Event', 'ইভেন্ট যোগ')}
                    </button>
                  </div>
                  <div className="space-y-2.5">
                    {events.slice(0, 3).map(ev => (
                      <div key={ev.id} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                            <span>{ev.title}</span>
                            {ev.visibility === 'members_only' ? (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 rounded">
                                🔒 Members
                              </span>
                            ) : (
                              <span className="text-[9px] font-medium px-1.5 py-0.2 bg-blue-100 dark:bg-blue-950 text-blue-900 dark:text-blue-300 rounded">
                                Public
                              </span>
                            )}
                          </div>
                          <div className="text-slate-500 dark:text-slate-400 text-[11px]">{ev.date} · {ev.location}</div>
                        </div>
                        <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-md font-bold text-[10px]">
                          {ev.rsvps.length} RSVPs
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB: ORGANIZATIONAL STRUCTURE & ROLES */}
          {activeAdminTab === 'roles' && (
            <OrganizationStructure isAdmin={true} />
          )}

          {/* TAB: VILLAGE PUBLIC RECORDS & CENSUS */}
          {activeAdminTab === 'residents' && (
            <VillageResidentsManager isAdmin={true} />
          )}

          {/* TAB: COMMUNITY FUNDS & TREASURY */}
          {activeAdminTab === 'funds' && (
            <TreasuryFundsManager isAdmin={true} />
          )}

          {/* 2. MEMBERS DIRECTORY & ADMIN REGISTRATION */}
          {activeAdminTab === 'members' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-950 dark:text-slate-100">
                    {t('Community Members Directory', 'সদস্য তালিকা ও নিবন্ধন')}
                  </h2>
                  <p className="text-xs text-slate-800 dark:text-slate-400 mt-0.5">
                    {t('Only admins have authority to register youth members with full details.', 'শুধুমাত্র অ্যাডমিনরাই সকল তথ্যাদি যাচাই করে নতুন সদস্য নিবন্ধন করতে পারেন।')}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:flex-initial">
                    <Search className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      placeholder={t('Search member name...', 'নাম খুঁজুন...')}
                      className="w-full sm:w-auto pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-950 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                  <button
                    onClick={() => openCreateModal('member')}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs whitespace-nowrap transition-colors"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>{t('Register New Member', 'নতুন সদস্য নিবন্ধন')}</span>
                  </button>
                </div>
              </div>

              {/* Mobile Member Cards */}
              <div className="md:hidden space-y-3">
                {members
                  .filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()) || m.email.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map(m => (
                    <div key={m.id} className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/50 space-y-3 text-xs">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {m.avatar ? (
                            <img src={m.avatar} alt={m.name} className="w-9 h-9 rounded-full object-cover shrink-0" />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-300 font-bold flex items-center justify-center text-xs shrink-0">
                              {m.name[0]}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-bold text-slate-950 dark:text-slate-100 truncate">{m.name}</div>
                            <div className="text-[11px] text-slate-700 dark:text-slate-400 font-mono">{m.memberNo} · {m.phone}</div>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 font-black text-[11px] shrink-0">
                          {m.bloodGroup}
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        <select
                          value={m.role}
                          onChange={e => updateMember(m.id, { role: e.target.value as Role })}
                          className="w-full text-xs font-semibold px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-950 dark:text-slate-100"
                        >
                          <option value="President">President (সভাপতি)</option>
                          <option value="Vice President">Vice President (সহ-সভাপতি)</option>
                          <option value="General Secretary">General Secretary (সাধারণ সম্পাদক)</option>
                          <option value="Joint Secretary">Joint Secretary (যুগ্ম সাধারণ সম্পাদক)</option>
                          <option value="Cashier">Cashier (কোষাধ্যক্ষ - Funds)</option>
                          <option value="Assistant Cashier">Assistant Cashier (সহকারী ক্যাশিয়ার - Funds)</option>
                          <option value="Data Collector">Data Collector (তথ্য সংগ্রাহক - Census)</option>
                          <option value="Organizing Secretary">Organizing Secretary (সাংগঠনিক সম্পাদক)</option>
                          <option value="Publicity Secretary">Publicity Secretary (প্রচার সম্পাদক)</option>
                          <option value="Sports & Cultural Secretary">Sports Secretary (ক্রীড়া সম্পাদক)</option>
                          <option value="Social Welfare Secretary">Social Welfare (সমাজকল্যাণ সম্পাদক)</option>
                          <option value="Education & Library Secretary">Education Secretary (শিক্ষা সম্পাদক)</option>
                          <option value="Youth Coordinator">Youth Coordinator (যুব সমন্বয়ক)</option>
                          <option value="Executive Member">Executive Member (কার্যনির্বাহী সদস্য)</option>
                          <option value="Advisor">Advisor (উপদেষ্টা)</option>
                          <option value="Volunteer">Volunteer (স্বেচ্ছাসেবক)</option>
                          <option value="Member">Member (সাধারণ সদস্য)</option>
                        </select>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-200/70 dark:border-slate-700">
                        <div className="text-[11px] text-slate-800 dark:text-slate-300 truncate max-w-[180px]">
                          {m.village} · <span className="font-mono">{m.email || m.ownerEmail || '-'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEditModal('member', m)}
                            className="px-2.5 py-1.5 bg-white dark:bg-slate-800 text-slate-950 dark:text-slate-200 rounded-lg font-bold border border-slate-200 dark:border-slate-700 flex items-center gap-1"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>{t('Edit', 'এডিট')}</span>
                          </button>
                          <button
                            onClick={() => setDeletingMember(m)}
                            className="p-1.5 text-rose-700 dark:text-rose-400 rounded-lg"
                            title="Delete Member"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>

              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-400 uppercase tracking-wider font-bold border-y border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-3 px-4">Member</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">Village</th>
                      <th className="py-3 px-4">Blood</th>
                      <th className="py-3 px-4">Google Email</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {members
                      .filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()) || m.email.toLowerCase().includes(searchTerm.toLowerCase()))
                      .map(m => (
                        <tr key={m.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                          <td className="py-3 px-4 font-bold text-slate-950 dark:text-slate-100">
                            <div className="flex items-center gap-2.5">
                              {m.avatar ? (
                                <img src={m.avatar} alt={m.name} className="w-8 h-8 rounded-full object-cover shrink-0" />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-300 font-bold flex items-center justify-center text-xs shrink-0">
                                  {m.name[0]}
                                </div>
                              )}
                              <div>
                                <div>{m.name}</div>
                                <div className="text-[10px] text-slate-700 dark:text-slate-400 font-normal font-mono">{m.memberNo} · {m.phone}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <select
                              value={m.role}
                              onChange={e => updateMember(m.id, { role: e.target.value as Role })}
                              className="text-xs font-semibold px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-950 dark:text-slate-100 font-medium"
                            >
                              <option value="President">President (সভাপতি)</option>
                              <option value="Vice President">Vice President (সহ-সভাপতি)</option>
                              <option value="General Secretary">General Secretary (সাধারণ সম্পাদক)</option>
                              <option value="Joint Secretary">Joint Secretary (যুগ্ম সাধারণ সম্পাদক)</option>
                              <option value="Cashier">Cashier (কোষাধ্যক্ষ - Funds)</option>
                              <option value="Assistant Cashier">Assistant Cashier (সহকারী ক্যাশিয়ার - Funds)</option>
                              <option value="Data Collector">Data Collector (তথ্য সংগ্রাহক - Census)</option>
                              <option value="Organizing Secretary">Organizing Secretary (সাংগঠনিক সম্পাদক)</option>
                              <option value="Publicity Secretary">Publicity Secretary (প্রচার সম্পাদক)</option>
                              <option value="Sports & Cultural Secretary">Sports Secretary (ক্রীড়া সম্পাদক)</option>
                              <option value="Social Welfare Secretary">Social Welfare (সমাজকল্যাণ সম্পাদক)</option>
                              <option value="Education & Library Secretary">Education Secretary (শিক্ষা সম্পাদক)</option>
                              <option value="Youth Coordinator">Youth Coordinator (যুব সমন্বয়ক)</option>
                              <option value="Executive Member">Executive Member (কার্যনির্বাহী সদস্য)</option>
                              <option value="Advisor">Advisor (উপদেষ্টা)</option>
                              <option value="Volunteer">Volunteer (স্বেচ্ছাসেবক)</option>
                              <option value="Member">Member (সাধারণ সদস্য)</option>
                            </select>
                          </td>
                          <td className="py-3 px-4 text-slate-800 dark:text-slate-300">{m.village}</td>
                          <td className="py-3 px-4 font-bold text-rose-700 dark:text-rose-400">{m.bloodGroup}</td>
                          <td className="py-3 px-4 text-slate-800 dark:text-slate-400 font-mono text-[11px] max-w-[180px] truncate">
                            {m.email || m.ownerEmail || '-'}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => openEditModal('member', m)}
                                className="p-1.5 text-slate-700 dark:text-slate-400 hover:text-emerald-700 rounded"
                                title="Edit Member Details"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeletingMember(m)}
                                className="p-1.5 text-slate-700 dark:text-slate-400 hover:text-rose-600 rounded"
                                title="Delete Member"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3. NEWS & NOTICES WITH PDF UPLOAD */}
          {activeAdminTab === 'news' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-950 dark:text-slate-100">
                    {t('Community News & PDF Notice Board', 'নোটিশ ও অফিসিয়াল PDF পরিপত্র')}
                  </h2>
                  <p className="text-xs text-slate-800 dark:text-slate-400 mt-0.5">
                    {t('Upload official PDF circulars or news. Registered members receive instant notification.', 'অফিসিয়াল PDF নোটিশ আপলোড করুন। সদস্যদের কাছে সরাসরি নোটিফিকেশন যাবে।')}
                  </p>
                </div>
                <button
                  onClick={() => openCreateModal('news')}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs shrink-0 w-full sm:w-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>{t('Post Notice / PDF', 'নতুন নোটিশ / PDF')}</span>
                </button>
              </div>

              <div className="space-y-4">
                {news.map(item => (
                  <div key={item.id} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-emerald-200 dark:hover:border-slate-700 transition-all">
                    <div className="flex items-center gap-4">
                      {item.image ? (
                        <img src={item.image} alt={item.title} className="w-14 h-14 rounded-xl object-cover shrink-0 bg-slate-100 dark:bg-slate-800" />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-emerald-50 dark:bg-slate-800 p-1 flex items-center justify-center shrink-0">
                          <img src={logoImg} alt="Salmikkhang Logo" className="w-full h-full object-contain rounded-lg" />
                        </div>
                      )}
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded">{item.category}</span>
                          {item.visibility === 'members_only' ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800 rounded flex items-center gap-1">
                              <span>🔒</span>
                              <span>{t('Members Only', 'শুধুমাত্র সদস্য')}</span>
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded">
                              {t('Public Notice', 'সার্বজনীন')}
                            </span>
                          )}
                          <span className="text-[11px] text-slate-400">{item.date}</span>
                          {item.pdfAttachment && (
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 rounded-md flex items-center gap-1">
                              <FileText className="w-3 h-3" />
                              <span>{item.pdfAttachment.fileName} ({item.pdfAttachment.fileSize})</span>
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 mt-1">{item.title}</h4>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {item.pdfAttachment && (
                        <a
                          href={item.pdfAttachment.dataUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1.5 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-700 dark:text-rose-300 rounded-lg flex items-center gap-1 text-xs font-bold transition-colors"
                          title="Open PDF"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>{t('Open PDF', 'PDF দেখুন')}</span>
                        </a>
                      )}
                      <button
                        onClick={() => openEditModal('news', item)}
                        className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-100 text-slate-700 dark:text-slate-200 rounded-lg flex items-center gap-1 text-xs font-bold transition-colors"
                        title="Edit News"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>{t('Edit', 'সম্পাদনা')}</span>
                      </button>
                      <button
                        onClick={() => deleteNewsItem(item.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                        title="Delete Notice"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. EVENTS MANAGER */}
          {activeAdminTab === 'events' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
                    {t('Events & RSVPs Manager', 'ইভেন্ট ও ক্যালেন্ডার ব্যবস্থাপনা')}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {t('Create or edit events. Choose between Public Events or Members Only access.', 'ইভেন্ট তৈরি বা এডিট করুন। সার্বজনীন অথবা শুধুমাত্র সদস্যদের জন্য অপশন নির্বাচন করুন।')}
                  </p>
                </div>
                <button
                  onClick={() => openCreateModal('event')}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>{t('Add New Event', 'নতুন ইভেন্ট যোগ')}</span>
                </button>
              </div>

              <div className="space-y-4">
                {events.map(ev => (
                  <div key={ev.id} className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-emerald-200 dark:hover:border-slate-700 transition-all">
                    <div className="flex items-start gap-4">
                      {ev.image ? (
                        <img src={ev.image} alt={ev.title} className="w-16 h-16 rounded-xl object-cover shrink-0 bg-slate-100 dark:bg-slate-800" />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-emerald-50 dark:bg-slate-800 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold text-base shrink-0">
                          📅
                        </div>
                      )}
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded">
                            {ev.category}
                          </span>
                          {ev.visibility === 'members_only' ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800 rounded flex items-center gap-1">
                              <span>🔒</span>
                              <span>{t('Members Only', 'শুধুমাত্র সদস্য')}</span>
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded">
                              {t('Public Event', 'সার্বজনীন')}
                            </span>
                          )}
                          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{ev.date} · {ev.time}</span>
                        </div>
                        <h4 className="font-bold text-base text-slate-900 dark:text-slate-100">{ev.title}</h4>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {ev.location} · <strong className="text-emerald-700 dark:text-emerald-400">{ev.rsvps.length} RSVPs</strong> ({ev.rsvps.slice(0, 3).join(', ')}{ev.rsvps.length > 3 ? '...' : ''})
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0">
                      <button
                        onClick={() => openEditModal('event', ev)}
                        className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-100 text-slate-700 dark:text-slate-200 rounded-lg flex items-center gap-1.5 text-xs font-bold transition-colors"
                        title="Edit Event"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>{t('Edit', 'সম্পাদনা')}</span>
                      </button>
                      <button
                        onClick={() => deleteEvent(ev.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                        title="Delete Event"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. JOIN APPLICATIONS */}
          {activeAdminTab === 'requests' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-950 dark:text-slate-100">
                    {t('Membership Applications', 'সদস্যপদ আবেদনসমূহ')}
                  </h2>
                  <p className="text-xs text-slate-800 dark:text-slate-400 mt-0.5">
                    {t('Review inquiries and approve applicants into active registered members.', 'আবেদন পর্যালোচনা করে অ্যাক্টিভ সদস্য হিসেবে অনুমোদন দিন।')}
                  </p>
                </div>
                <span className="self-start sm:self-auto px-3 py-1 bg-amber-100 dark:bg-amber-950 text-amber-950 dark:text-amber-300 text-xs font-bold rounded-lg shrink-0">
                  {pendingRequests.length} {t('Pending Review', 'টি অপেক্ষমান')}
                </span>
              </div>

              {joinRequests.length === 0 ? (
                <div className="py-12 text-center text-slate-700 dark:text-slate-400 text-xs">
                  {t('No join applications yet.', 'এখনো কোনো আবেদন জমা হয়নি।')}
                </div>
              ) : (
                <div className="space-y-4">
                  {joinRequests.map(req => (
                    <div
                      key={req.id}
                      className={`p-4 sm:p-5 rounded-2xl border transition-all space-y-3 ${
                        req.status === 'Pending'
                          ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900'
                          : req.status === 'Approved'
                          ? 'bg-emerald-50/30 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900'
                          : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 opacity-60'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-base text-slate-950 dark:text-slate-100">{req.name}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              req.status === 'Pending'
                                ? 'bg-amber-100 text-amber-950'
                                : req.status === 'Approved'
                                ? 'bg-emerald-100 text-emerald-950'
                                : 'bg-slate-200 text-slate-800'
                            }`}>
                              {req.status}
                            </span>
                            <span className="text-xs text-rose-700 font-bold">
                              🩸 {req.bloodGroup}
                            </span>
                          </div>
                          <div className="text-xs text-slate-800 dark:text-slate-400 mt-0.5 break-words">
                            {req.village} · {req.phone} · {req.email} · Applied on {req.date}
                          </div>
                        </div>

                        {req.status === 'Pending' && (
                          <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0">
                            <button
                              onClick={() => approveJoinRequest(req.id, 'Volunteer')}
                              className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl flex items-center gap-1 shadow-xs transition-colors"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>{t('Approve Member', 'অনুমোদন দিন')}</span>
                            </button>
                            <button
                              onClick={() => rejectJoinRequest(req.id)}
                              className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950 hover:bg-rose-100 text-rose-800 dark:text-rose-300 font-semibold text-xs rounded-xl transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>{t('Reject', 'বাতিল')}</span>
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="grid sm:grid-cols-2 gap-2 text-xs bg-white/80 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700">
                        <div>
                          <strong className="text-slate-900 dark:text-slate-300">{t('Skills:', 'দক্ষতা:')}</strong>{' '}
                          <span className="text-slate-800 dark:text-slate-400">{req.skills || 'Not specified'}</span>
                        </div>
                        <div>
                          <strong className="text-slate-900 dark:text-slate-300">{t('Interests:', 'আগ্রহ:')}</strong>{' '}
                          <span className="text-slate-800 dark:text-slate-400">{req.interests || 'Not specified'}</span>
                        </div>
                        <div className="sm:col-span-2 pt-1 border-t border-slate-100 dark:border-slate-700">
                          <strong className="text-slate-900 dark:text-slate-300">{t('Reason for Joining:', 'যোগদানের উদ্দেশ্য:')}</strong>{' '}
                          <span className="text-slate-800 dark:text-slate-400">{req.reason}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 6. PROJECTS TRACKER */}
          {activeAdminTab === 'projects' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-950 dark:text-slate-100">
                    {t('Village Projects Tracker', 'গ্রাম উন্নয়ন উদ্যোগসমূহ')}
                  </h2>
                  <p className="text-xs text-slate-800 dark:text-slate-400 mt-0.5">
                    {t('Track Greener Gaira tree planting, tutoring circles, and youth cleanups.', 'উদ্যোগের অগ্রগতি ও স্বেচ্ছাসেবক তালিকা আপডেট করুন।')}
                  </p>
                </div>
                <button
                  onClick={() => openCreateModal('project')}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs shrink-0 w-full sm:w-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>{t('New Project', 'নতুন উদ্যোগ')}</span>
                </button>
              </div>

              <div className="space-y-4">
                {projects.map(proj => (
                  <div key={proj.id} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-teal-100 dark:bg-teal-950 text-teal-900 dark:text-teal-300 rounded">{proj.category}</span>
                        <span className="text-xs text-slate-800 dark:text-slate-400">{proj.progress}% completed</span>
                      </div>
                      <h4 className="font-bold text-sm text-slate-950 dark:text-slate-100">{proj.title}</h4>
                      <p className="text-xs text-slate-800 dark:text-slate-400">{proj.description}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => openEditModal('project', proj)}
                        className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-100 text-slate-950 dark:text-slate-200 rounded-lg text-xs font-bold"
                      >
                        {t('Edit', 'এডিট')}
                      </button>
                      <button
                        onClick={() => deleteProject(proj.id)}
                        className="p-1.5 text-slate-700 dark:text-slate-400 hover:text-rose-600 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 7. GALLERY ALBUMS */}
          {activeAdminTab === 'gallery' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-950 dark:text-slate-100">
                    {t('Photo Gallery Management', 'ফটো গ্যালারি ফটো আপলোড')}
                  </h2>
                  <p className="text-xs text-slate-800 dark:text-slate-400 mt-0.5">
                    {t('Add authentic village photos directly from your phone or PC.', 'গ্রামের সুন্দর মুহূর্ত ও যুব কার্যক্রমের ছবি সরাসরি আপলোড করুন।')}
                  </p>
                </div>
                <button
                  onClick={() => openCreateModal('gallery')}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs shrink-0 w-full sm:w-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>{t('Upload Photo', 'ফটো আপলোড')}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {gallery.map(img => (
                  <div key={img.id} className="group relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 aspect-4/3">
                    <img src={img.image} alt={img.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end text-white">
                      <div className="font-bold text-xs leading-tight">{img.title}</div>
                      <div className="text-[10px] text-emerald-300">{img.category} · {img.date}</div>
                      <button
                        onClick={() => deleteGalleryItem(img.id)}
                        className="mt-2 text-rose-300 text-xs font-bold hover:underline self-start"
                      >
                        {t('Delete photo', 'মুছুন')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 8. CONTACT INQUIRIES */}
          {activeAdminTab === 'messages' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-950 dark:text-slate-100">
                    {t('Visitor & Member Inquiries', 'বার্তা ও যোগাযোগ ইনবক্স')}
                  </h2>
                  <p className="text-xs text-slate-800 dark:text-slate-400 mt-0.5">
                    {t('Messages sent from website contact form or well-wishers.', 'ওয়েবসাইট ভিজিটরদের বার্তা ও সহযোগিতার প্রস্তাব।')}
                  </p>
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-400">
                  {messages.length} {t('Messages', 'টি বার্তা')}
                </span>
              </div>

              <div className="space-y-4">
                {messages.map(msg => (
                  <div key={msg.id} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2 min-w-0">
                        <span className="font-bold text-sm text-slate-950 dark:text-slate-100">{msg.name}</span>
                        <span className="text-xs text-slate-700 dark:text-slate-400 break-all">({msg.contact})</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] text-slate-700 dark:text-slate-400">{msg.date}</span>
                        <button
                          onClick={() => deleteMessage(msg.id)}
                          className="text-slate-700 dark:text-slate-400 hover:text-rose-600 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-slate-900 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl">{msg.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 9. SETTINGS */}
          {activeAdminTab === 'settings' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-6">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
                  {t('Community Organization Profile', 'কমিউনিটি পরিচিতি সেটিংস')}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {t('Update village address, phone, motto, and organizational background.', 'সংস্থার নাম, ঠিকানা, উদ্দেশ্য ও পরিচিতি সম্পাদনা করুন।')}
                </p>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  updateSettings(settings);
                }}
                className="space-y-4 text-xs"
              >
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Organization Name (English)</label>
                    <input
                      type="text"
                      value={settings.name}
                      onChange={e => updateSettings({ name: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">সংস্থার নাম (বাংলা)</label>
                    <input
                      type="text"
                      value={settings.nameBn}
                      onChange={e => updateSettings({ nameBn: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Village & Address</label>
                    <input
                      type="text"
                      value={settings.address}
                      onChange={e => updateSettings({ address: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Contact Phone</label>
                    <input
                      type="text"
                      value={settings.phone}
                      onChange={e => updateSettings({ phone: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={resetAllData}
                    className="px-4 py-2 bg-rose-50 dark:bg-rose-950 text-rose-800 dark:text-rose-300 text-xs font-bold rounded-xl"
                  >
                    {t('Reset Demo Database', 'ডেমো ডাটা রিসেট')}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-xs"
                  >
                    {t('Save Settings', 'সংরক্ষণ করুন')}
                  </button>
                </div>
              </form>

              <BackgroundSettings />
            </div>
          )}

        </div>
      </div>

      {/* Admin Item Creation / Edit Modal */}
      {modalMode && modalTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-start sm:items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-5 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 my-auto max-h-[92dvh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-base text-slate-950 dark:text-slate-100">
                {modalMode === 'create' ? t('Add New ', 'নতুন যোগ করুন: ') : t('Edit ', 'সম্পাদনা: ')}
                {modalTarget === 'event' ? t('Event', 'অনুষ্ঠান') : modalTarget === 'member' ? t('Member', 'সদস্য') : modalTarget.toUpperCase()}
              </h3>
              <button
                onClick={() => setModalMode(null)}
                className="p-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              
              {/* Event Visibility Selector (Public vs Members Only) */}
              {modalTarget === 'event' && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <label className="block font-bold text-slate-900 dark:text-slate-200 text-xs">
                    {t('Event Visibility & Audience *', 'অনুষ্ঠানের দর্শক / অ্যাক্সেস *')}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className={`p-3 rounded-xl border cursor-pointer flex items-center gap-2.5 transition-all ${
                      formData.visibility !== 'members_only'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-950 dark:text-emerald-300 font-bold ring-1 ring-emerald-500'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}>
                      <input
                        type="radio"
                        name="visibility"
                        value="public"
                        checked={formData.visibility !== 'members_only'}
                        onChange={() => setFormData({ ...formData, visibility: 'public' })}
                        className="accent-emerald-600"
                      />
                      <div>
                        <div className="text-xs font-bold">{t('Public Event', 'সার্বজনীন')}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                          {t('Visible to all visitors', 'সবাই দেখতে পাবে')}
                        </div>
                      </div>
                    </label>

                    <label className={`p-3 rounded-xl border cursor-pointer flex items-center gap-2.5 transition-all ${
                      formData.visibility === 'members_only'
                        ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-500 text-amber-950 dark:text-amber-300 font-bold ring-1 ring-amber-500'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}>
                      <input
                        type="radio"
                        name="visibility"
                        value="members_only"
                        checked={formData.visibility === 'members_only'}
                        onChange={() => setFormData({ ...formData, visibility: 'members_only' })}
                        className="accent-amber-600"
                      />
                      <div>
                        <div className="text-xs font-bold flex items-center gap-1">
                          <span>🔒</span>
                          <span>{t('Members Only', 'শুধুমাত্র সদস্য')}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                          {t('Only registered members see this', 'শুধু সদস্যদের তালিকায় যাবে')}
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* MEMBER REGISTRATION FORM (Admin only) */}
              {modalTarget === 'member' && (
                <>
                  <div className="p-3 bg-emerald-50/80 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300">
                    <p className="font-bold text-xs">
                      {t('Admin-Only Member Registration', 'অ্যাডমিন নিয়ন্ত্রিত সদস্য নিবন্ধন')}
                    </p>
                    <p className="text-[11px] opacity-90 mt-0.5">
                      {t(
                        'Register youth member into the cloud database. Enter their Gmail address so they can sign in securely with Google.',
                        'সদস্যের তথ্য ক্লাউড ডেটাবেসে যুক্ত করুন। সদস্যের Gmail ঠিকানা দিলে তারা Google দিয়ে নিরাপদে লগইন করতে পারবেন।'
                      )}
                    </p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {t('Member Full Name *', 'সদস্যের পুরো নাম *')}
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name || ''}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Blancho Nokrek"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {t('Assigned Role *', 'সংস্থার পদবি *')}
                      </label>
                      <select
                        value={formData.role || 'Member'}
                        onChange={e => setFormData({ ...formData, role: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold"
                      >
                        <option value="President">President (সভাপতি)</option>
                        <option value="Vice President">Vice President (সহ-সভাপতি)</option>
                        <option value="General Secretary">General Secretary (সাধারণ সম্পাদক)</option>
                        <option value="Joint Secretary">Joint Secretary (যুগ্ম সাধারণ সম্পাদক)</option>
                        <option value="Cashier">Cashier (কোষাধ্যক্ষ - Funds)</option>
                        <option value="Assistant Cashier">Assistant Cashier (সহকারী ক্যাশিয়ার - Funds)</option>
                        <option value="Data Collector">Data Collector (তথ্য সংগ্রাহক - Census)</option>
                        <option value="Organizing Secretary">Organizing Secretary (সাংগঠনিক সম্পাদক)</option>
                        <option value="Publicity Secretary">Publicity Secretary (প্রচার সম্পাদক)</option>
                        <option value="Sports & Cultural Secretary">Sports & Cultural Secretary (ক্রীড়া সম্পাদক)</option>
                        <option value="Social Welfare Secretary">Social Welfare Secretary (সমাজকল্যাণ সম্পাদক)</option>
                        <option value="Education & Library Secretary">Education & Library Secretary (শিক্ষা সম্পাদক)</option>
                        <option value="Youth Coordinator">Youth Coordinator (যুব সমন্বয়ক)</option>
                        <option value="Executive Member">Executive Member (কার্যনির্বাহী সদস্য)</option>
                        <option value="Advisor">Advisor (উপদেষ্টা)</option>
                        <option value="Volunteer">Volunteer (স্বেচ্ছাসেবক)</option>
                        <option value="Member">Member (সাধারণ সদস্য)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {t('Email Address *', 'ইমেইল অ্যাড্রেস *')}
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email || ''}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        placeholder="member@example.com"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {t('Mobile Phone *', 'মোবাইল নম্বর *')}
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.phone || ''}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+880 1712-XXXXXX"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {t('Village *', 'গ্রাম *')}
                      </label>
                      <select
                        value={formData.village || 'Gaira'}
                        onChange={e => setFormData({ ...formData, village: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                      >
                        <option value="Gaira">Gaira (গাইরা)</option>
                        <option value="Jolchotro">Jolchotro (জলছত্র)</option>
                        <option value="Madhupur">Madhupur (মধুপুর)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {t('Blood Group *', 'রক্তের গ্রুপ *')}
                      </label>
                      <select
                        value={formData.bloodGroup || 'O+'}
                        onChange={e => setFormData({ ...formData, bloodGroup: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold text-rose-600"
                      >
                        {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(b => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {t('Skills (comma-separated)', 'দক্ষতাসমূহ')}
                    </label>
                    <input
                      type="text"
                      value={formData.skills || ''}
                      onChange={e => setFormData({ ...formData, skills: e.target.value })}
                      placeholder="Tree Plantation, Football, First Aid, Tutoring"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {t('Bio / Note', 'পরিচিতি')}
                    </label>
                    <textarea
                      rows={2}
                      value={formData.bio || ''}
                      onChange={e => setFormData({ ...formData, bio: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </>
              )}

              {/* NON-MEMBER FIELDS (News, Events, Projects, Gallery) */}
              {modalTarget !== 'member' && (
                <>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Title (English) *</label>
                    <input
                      type="text"
                      required
                      value={formData.title || ''}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g. Village Clean-up or Annual Football Match"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">শিরোনাম (বাংলা)</label>
                    <input
                      type="text"
                      value={formData.titleBn || ''}
                      onChange={e => setFormData({ ...formData, titleBn: e.target.value })}
                      placeholder="যেমন: পরিচ্ছন্নতা অভিযান বা ফুটবল টুর্নামেন্ট"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                </>
              )}

              {/* NEWS & NOTICE SPECIFIC: AUDIENCE SELECTOR & PDF UPLOAD */}
              {modalTarget === 'news' && (
                <>
                  {/* Notice Visibility Selector (Public vs Members Only) */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                    <label className="block font-bold text-slate-800 dark:text-slate-200 text-xs">
                      {t('Notice Audience & Visibility *', 'নোটিশের দর্শক ও দৃশ্যমানতা *')}
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label className={`p-3 rounded-xl border cursor-pointer flex items-center gap-2.5 transition-all ${
                        formData.visibility !== 'members_only'
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-950 dark:text-emerald-300 font-bold ring-1 ring-emerald-500'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                      }`}>
                        <input
                          type="radio"
                          name="news_visibility"
                          value="public"
                          checked={formData.visibility !== 'members_only'}
                          onChange={() => setFormData({ ...formData, visibility: 'public' })}
                          className="accent-emerald-600"
                        />
                        <div>
                          <div className="text-xs font-bold">{t('Public Notice', 'সার্বজনীন')}</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                            {t('Visible to all visitors on website', 'মূল ওয়েবসাইটে সবাই দেখতে পাবে')}
                          </div>
                        </div>
                      </label>

                      <label className={`p-3 rounded-xl border cursor-pointer flex items-center gap-2.5 transition-all ${
                        formData.visibility === 'members_only'
                          ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-500 text-amber-950 dark:text-amber-300 font-bold ring-1 ring-amber-500'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                      }`}>
                        <input
                          type="radio"
                          name="news_visibility"
                          value="members_only"
                          checked={formData.visibility === 'members_only'}
                          onChange={() => setFormData({ ...formData, visibility: 'members_only' })}
                          className="accent-amber-600"
                        />
                        <div>
                          <div className="text-xs font-bold flex items-center gap-1">
                            <span>🔒</span>
                            <span>{t('Members Only', 'শুধুমাত্র সদস্য')}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                            {t('Private; only visible inside Member Portal', 'গোপনীয়; শুধু সদস্যদের পোর্টালে যাবে')}
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Category</label>
                      <select
                        value={formData.category || 'Notice'}
                        onChange={e => setFormData({ ...formData, category: e.target.value, categoryBn: e.target.value === 'Notice' ? 'নোটিশ' : 'ঘোষণা' })}
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
                        value={formData.date || ''}
                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                      />
                    </div>
                  </div>

                  {/* DEDICATED PDF FILE UPLOAD */}
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-rose-600" />
                        <span>{t('Official Circular / PDF Document (Upload)', 'অফিসিয়াল পরিপত্র / PDF ফাইল আপলোড')}</span>
                      </label>
                      {formData.pdfAttachment && (
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, pdfAttachment: undefined })}
                          className="text-[11px] font-semibold text-rose-600 hover:underline"
                        >
                          {t('Remove PDF', 'PDF বাতিল')}
                        </button>
                      )}
                    </div>

                    {formData.pdfAttachment ? (
                      <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-rose-200 dark:border-rose-900 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 truncate">
                          <div className="w-9 h-9 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 flex items-center justify-center shrink-0 font-bold text-xs">
                            PDF
                          </div>
                          <div className="truncate">
                            <div className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">{formData.pdfAttachment.fileName}</div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400">{formData.pdfAttachment.fileSize} · {t('Attached for all members', 'সকল সদস্যদের জন্য সংযুক্ত')}</div>
                          </div>
                        </div>
                        <a
                          href={formData.pdfAttachment.dataUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[11px] font-bold shrink-0"
                        >
                          {t('Test Open', 'খুলুন')}
                        </a>
                      </div>
                    ) : (
                      <label className="border-2 border-dashed border-rose-200 hover:border-rose-400 dark:border-slate-700 bg-rose-50/40 dark:bg-slate-800/40 rounded-xl p-4 text-center cursor-pointer transition-colors block">
                        <input
                          type="file"
                          accept="application/pdf"
                          onChange={handlePdfFileUpload}
                          className="hidden"
                        />
                        <Upload className="w-5 h-5 text-rose-600 mx-auto mb-1.5" />
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {t('Click to upload official PDF notice / circular', 'অফিসিয়াল PDF নোটিশ আপলোড করতে ক্লিক করুন')}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {t('Attached PDF will trigger an instant notification to all registered members', 'PDF আপলোড করলে স্বয়ংক্রিয়ভাবে সকল সদস্যদের নিকট নোটিফিকেশন যাবে')}
                        </div>
                      </label>
                    )}
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Summary</label>
                    <textarea
                      rows={2}
                      value={formData.summary || ''}
                      onChange={e => setFormData({ ...formData, summary: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Full Content</label>
                    <textarea
                      rows={4}
                      value={formData.content || ''}
                      onChange={e => setFormData({ ...formData, content: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </>
              )}

              {modalTarget === 'event' && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Date</label>
                      <input
                        type="date"
                        value={formData.date || ''}
                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Time</label>
                      <input
                        type="text"
                        value={formData.time || ''}
                        onChange={e => setFormData({ ...formData, time: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Location</label>
                    <input
                      type="text"
                      value={formData.location || ''}
                      onChange={e => setFormData({ ...formData, location: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Description</label>
                    <textarea
                      rows={3}
                      value={formData.description || ''}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </>
              )}

              {modalTarget === 'project' && (
                <>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Description</label>
                    <textarea
                      rows={2}
                      value={formData.description || ''}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Progress %</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={formData.progress || 0}
                        onChange={e => setFormData({ ...formData, progress: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Volunteers Needed</label>
                      <input
                        type="number"
                        value={formData.volunteersNeeded || 10}
                        onChange={e => setFormData({ ...formData, volunteersNeeded: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* REAL PHOTO UPLOAD PICKER (Replaces URL restriction) */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-700 dark:text-slate-300">
                    {modalTarget === 'member'
                      ? t('Member Profile Photo (Upload from device)', 'সদস্যের ছবি আপলোড (ডিভাইস থেকে)')
                      : t('Photo / Image (Upload from device) *', 'ছবি / ফটো আপলোড (ডিভাইস থেকে) *')}
                  </label>
                  {(formData.image || formData.avatar) && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, image: '', avatar: '' })}
                      className="text-[11px] font-semibold text-rose-600 hover:underline"
                    >
                      {t('Remove photo', 'ছবি বাতিল')}
                    </button>
                  )}
                </div>

                {(formData.image || formData.avatar) ? (
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 max-h-48 group">
                    <img
                      src={formData.image || formData.avatar}
                      alt="Uploaded preview"
                      className="w-full h-44 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <label className="px-3 py-1.5 bg-white text-slate-900 rounded-lg text-xs font-bold cursor-pointer hover:bg-slate-100 shadow-md flex items-center gap-1.5">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{t('Change Photo', 'ছবি পরিবর্তন')}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageFileUpload}
                        />
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-emerald-300 dark:border-slate-700 hover:border-emerald-500 bg-emerald-50/40 dark:bg-slate-800/40 rounded-2xl p-5 text-center cursor-pointer transition-colors relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center justify-center mx-auto mb-2 shadow-2xs">
                      <Upload className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
                    </div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {t('Click or drag photo here to upload', 'ছবি আপলোড করতে এখানে ক্লিক করুন')}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {t('Select any photo from your phone or PC', 'আপনার ফোন বা কম্পিউটার থেকে ছবি বাছুন')} (PNG, JPG, WEBP)
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-400 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  {t('Cancel', 'বাতিল')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-xs"
                >
                  {modalMode === 'edit'
                    ? t('Update Changes', 'হালনাগাদ করুন')
                    : modalTarget === 'member'
                    ? t('Register Member', 'সদস্য নিবন্ধন করুন')
                    : t('Save Item', 'সংরক্ষণ করুন')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deletingMember && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-rose-700 dark:text-rose-400">
                {t('Remove Member from Directory', 'সদস্যকে তালিকা থেকে মুছুন')}
              </h3>
              <button
                onClick={() => setDeletingMember(null)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              {t(
                `Are you sure you want to remove "${deletingMember.name}" (${deletingMember.role}) from the community directory?`,
                `আপনি কি "${deletingMember.name}" (${deletingMember.role})-কে কমিউনিটি তালিকা থেকে মুছে ফেলতে চান?`
              )}
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingMember(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {t('Cancel', 'বাতিল')}
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteMember(deletingMember.id);
                  setDeletingMember(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t('Remove Member', 'সদস্য মুছুন')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
