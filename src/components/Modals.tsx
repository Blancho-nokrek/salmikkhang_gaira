import React, { useEffect, useState } from 'react';
import { useCommunity } from '../context/CommunityContext';
import { X, Search, Download, ExternalLink, Shield, AlertTriangle, Clock } from 'lucide-react';
import { safeLower, validateJoinApplication } from '../lib/memberAccess';
import logoImg from '../assets/images/logo.png';

interface ModalsProps {
  searchOpen: boolean;
  onCloseSearch: () => void;
  selectedNewsId: string | null;
  onCloseNews: () => void;
  onSelectNews?: (newsId: string) => void;
  selectedGalleryItem: any | null;
  onCloseGallery: () => void;
}

export const Modals: React.FC<ModalsProps> = ({
  searchOpen,
  onCloseSearch,
  selectedNewsId,
  onCloseNews,
  onSelectNews,
  selectedGalleryItem,
  onCloseGallery
}) => {
  const {
    t,
    activeModal,
    modalPayload,
    openModal,
    closeModal,
    submitJoinRequest,
    showToast,
    firebaseUser,
    authLoading,
    authError,
    clearAuthError,
    memberAccessNotice,
    clearMemberAccessNotice,
    loginAsMember,
    verifyExistingGoogleSession,
    logoutMember,
    isMemberSessionUnlocked,
    isAdminSessionUnlocked,
    canViewAdminPanel,
    currentMember,
    members,
    news,
    events,
    projects,
    setCurrentView
  } = useCommunity();

  // Join form state
  const [joinName, setJoinName] = useState('');
  const [joinEmail, setJoinEmail] = useState('');
  const [joinPhone, setJoinPhone] = useState('');
  const [joinVillage, setJoinVillage] = useState('Gaira');
  const [joinBlood, setJoinBlood] = useState('O+');
  const [joinSkills, setJoinSkills] = useState('');
  const [joinInterests, setJoinInterests] = useState('');
  const [joinReason, setJoinReason] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);

  // Global search input
  const [searchQuery, setSearchQuery] = useState('');

  // Pre-fill Gmail when opening Join modal from an Access Declined screen or signed-in Google session
  useEffect(() => {
    if (activeModal === 'join') {
      setJoinError(null);
      const prefill =
        (typeof modalPayload?.prefillEmail === 'string' && modalPayload.prefillEmail.trim()) ||
        (firebaseUser?.email ? firebaseUser.email.trim() : '');
      if (prefill && !joinEmail.trim()) {
        setJoinEmail(prefill);
      }
    }
  }, [activeModal, modalPayload, firebaseUser?.email]);

  // Close active modal on Escape key
  useEffect(() => {
    const hasOpenModal = Boolean(activeModal || searchOpen || selectedNewsId || selectedGalleryItem);
    if (!hasOpenModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (searchOpen) onCloseSearch();
      else if (selectedGalleryItem) onCloseGallery();
      else if (selectedNewsId) onCloseNews();
      else if (activeModal) closeModal();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeModal, searchOpen, selectedNewsId, selectedGalleryItem, closeModal, onCloseGallery, onCloseNews, onCloseSearch]);

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateJoinApplication({
      name: joinName,
      phone: joinPhone,
      email: joinEmail,
      skills: joinSkills,
      interests: joinInterests,
      reason: joinReason,
    });

    if (!validation.valid) {
      const msg =
        validation.errorCode === 'missing_name'
          ? t('Please enter your full name (at least 2 characters).', 'অনুগ্রহ করে আপনার সম্পূর্ণ নাম লিখুন (কমপক্ষে ২ অক্ষর)।')
          : validation.errorCode === 'missing_phone'
          ? t('Please enter a valid mobile phone number.', 'অনুগ্রহ করে একটি সঠিক মোবাইল নম্বর লিখুন।')
          : validation.errorCode === 'placeholder_email'
          ? t(
              'Please enter your real Gmail address (placeholder @example.com emails cannot be approved for Google login).',
              'অনুগ্রহ করে আপনার আসল Gmail ঠিকানা দিন (নমুনা @example.com ইমেইল দিয়ে Google লগইন করা যাবে না)।'
            )
          : validation.errorCode === 'invalid_email'
          ? t('Please enter a valid Gmail / email address so Admin can activate your login.', 'লগইন অনুমোদনের জন্য অনুগ্রহ করে একটি সঠিক Gmail / ইমেইল ঠিকানা লিখুন।')
          : t('Please tell us briefly why you want to join (at least 5 characters).', 'কমিউনিটিতে যোগদানের কারণ সংক্ষেপে লিখুন (কমপক্ষে ৫ অক্ষর)।');
      setJoinError(msg);
      showToast(msg, 'warning');
      return;
    }

    setJoinError(null);
    submitJoinRequest({
      name: validation.normalized.name,
      email: validation.normalized.email,
      phone: validation.normalized.phone,
      village: joinVillage,
      bloodGroup: joinBlood,
      skills: validation.normalized.skills,
      interests: validation.normalized.interests,
      reason: validation.normalized.reason,
    });
    setJoinName('');
    setJoinEmail('');
    setJoinPhone('');
    setJoinSkills('');
    setJoinInterests('');
    setJoinReason('');
    closeModal();
  };

  const handleGoogleSignIn = async () => {
    const ok = await loginAsMember();
    if (ok) {
      closeModal();
      setCurrentView('member');
    }
  };

  const handleExistingGoogleLink = async () => {
    const ok = await verifyExistingGoogleSession('member');
    if (ok) {
      closeModal();
      setCurrentView('member');
    }
  };

  const selectedNews = selectedNewsId ? news.find(n => n.id === selectedNewsId) : null;

  // Filtered search results (null-safe bilingual search; respect members_only & directory privacy)
  const canSeePrivate = Boolean((isMemberSessionUnlocked && currentMember) || (isAdminSessionUnlocked && canViewAdminPanel));
  const visibleEvents = events.filter(e => canSeePrivate || e.visibility !== 'members_only');
  const visibleNews = news.filter(n => canSeePrivate || n.visibility !== 'members_only');
  const q = safeLower(searchQuery).trim();
  const searchResults = q
    ? {
        events: visibleEvents.filter(
          e =>
            safeLower(e.title).includes(q) ||
            safeLower(e.titleBn).includes(q) ||
            safeLower(e.location).includes(q) ||
            safeLower(e.locationBn).includes(q) ||
            safeLower(e.category).includes(q)
        ),
        news: visibleNews.filter(
          n =>
            safeLower(n.title).includes(q) ||
            safeLower(n.titleBn).includes(q) ||
            safeLower(n.summary).includes(q) ||
            safeLower(n.summaryBn).includes(q) ||
            safeLower(n.category).includes(q)
        ),
        projects: projects.filter(
          p =>
            safeLower(p.title).includes(q) ||
            safeLower(p.titleBn).includes(q) ||
            safeLower(p.category).includes(q) ||
            safeLower(p.categoryBn).includes(q)
        ),
        members: canSeePrivate
          ? members.filter(
              m =>
                safeLower(m.name).includes(q) ||
                safeLower(m.village).includes(q) ||
                (Array.isArray(m.skills) ? m.skills : []).some(s => safeLower(s).includes(q))
            )
          : [],
      }
    : null;

  const hasAnySearchMatch = Boolean(
    searchResults &&
      (searchResults.news.length > 0 ||
        searchResults.events.length > 0 ||
        searchResults.projects.length > 0 ||
        searchResults.members.length > 0)
  );

  return (
    <>
      {/* 1. JOIN APPLICATION MODAL (Sent to Admin for enrollment) */}
      {activeModal === 'join' && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t('Apply for Salmikkhang Membership', 'সালমিকখাং সদস্যপদের আবেদন')}
          className="backdrop-enter fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-start sm:items-center justify-center p-3 sm:p-4 overflow-y-auto"
          onClick={closeModal}
        >
          <div
            className="modal-enter glass-surface rounded-3xl max-w-xl w-full p-5 sm:p-8 shadow-2xl border border-white/40 dark:border-white/10 my-4 sm:my-8 space-y-4 sm:space-y-5 backdrop-blur-2xl max-h-[92dvh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-emerald-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <img
                  src={logoImg}
                  alt="Salmikkhang Logo"
                  className="w-10 h-10 rounded-full object-contain shadow-sm ring-1 ring-emerald-500/30 shrink-0"
                />
                <div>
                  <h3 className="font-extrabold text-lg text-slate-900 dark:text-slate-100 leading-tight">
                    {t('Apply for Salmikkhang Membership', 'সালমিকখাং সদস্যপদের আবেদন')}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t('Applications are reviewed and registered by Council Admins', 'আবেদন পর্যালোচনা করে অ্যাডমিন সদস্য হিসেবে নিবন্ধন করবেন')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeModal}
                aria-label={t('Close membership form', 'আবেদন ফর্ম বন্ধ করুন')}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {joinError && (
              <div
                role="alert"
                className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 text-xs font-semibold text-rose-800 dark:text-rose-200 flex items-start gap-2"
              >
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                <span>{joinError}</span>
              </div>
            )}

            <form onSubmit={handleJoinSubmit} noValidate className="space-y-4 text-xs">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t('Full Name *', 'সম্পূর্ণ নাম *')}
                  </label>
                  <input
                    type="text"
                    required
                    value={joinName}
                    onChange={e => { setJoinName(e.target.value); if (joinError) setJoinError(null); }}
                    placeholder="e.g. Robin Marak"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t('Mobile Phone *', 'মোবাইল নম্বর *')}
                  </label>
                  <input
                    type="tel"
                    required
                    value={joinPhone}
                    onChange={e => { setJoinPhone(e.target.value); if (joinError) setJoinError(null); }}
                    placeholder="+880 1712-XXXXXX"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-12 gap-4">
                <div className="sm:col-span-6">
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t('Gmail / Email *', 'Gmail / ইমেইল *')}
                  </label>
                  <input
                    type="email"
                    required
                    value={joinEmail}
                    onChange={e => { setJoinEmail(e.target.value); if (joinError) setJoinError(null); }}
                    placeholder="yourname@gmail.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t('Village / Area *', 'গ্রাম / এলাকা *')}
                  </label>
                  <select
                    value={joinVillage}
                    onChange={e => setJoinVillage(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm font-semibold"
                  >
                    <option value="Gaira">Gaira (গাইরা)</option>
                    <option value="Jolchotro">Jolchotro (জলছত্র)</option>
                    <option value="Pirgachha">Pirgachha (পীরগাছা)</option>
                    <option value="Aronkhola">Aronkhola (অরণখোলা)</option>
                    <option value="Madhupur">Madhupur (মধুপুর)</option>
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t('Blood Group *', 'রক্তের গ্রুপ *')}
                  </label>
                  <select
                    value={joinBlood}
                    onChange={e => setJoinBlood(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm font-bold"
                  >
                    {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t('Skills & Talents', 'দক্ষতা ও বিশেষ গুণ')}
                  </label>
                  <input
                    type="text"
                    value={joinSkills}
                    onChange={e => setJoinSkills(e.target.value)}
                    placeholder={t('e.g. Teaching, photography, sports', 'যেমন: শিক্ষকতা, ছবি তোলা, খেলাধুলা')}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t('Community Interests', 'আগ্রহের ক্ষেত্র')}
                  </label>
                  <input
                    type="text"
                    value={joinInterests}
                    onChange={e => setJoinInterests(e.target.value)}
                    placeholder={t('e.g. Tree planting, education, youth club', 'যেমন: বৃক্ষরোপণ, শিক্ষা, যুব ক্লাব')}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t('Why do you want to join? *', 'কমিউনিটিতে যোগদানের কারণ *')}
                </label>
                <textarea
                  required
                  rows={2}
                  value={joinReason}
                  onChange={e => setJoinReason(e.target.value)}
                  placeholder={t('Tell us how you would like to help our village community...', 'কীভাবে গ্রামের সেবায় অংশ নিতে চান...')}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2.5 text-slate-600 dark:text-slate-400 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  {t('Cancel', 'বাতিল')}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-md transition-transform hover:-translate-y-0.5"
                >
                  {t('Submit Application to Admin →', 'অ্যাডমিনের কাছে আবেদন পাঠান →')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. MEMBER LOGIN MODAL */}
      {activeModal === 'login' && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t('Salmikkhang Member Portal Login', 'সদস্য পোর্টালে লগইন')}
          className="backdrop-enter fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-start sm:items-center justify-center p-3 sm:p-4 overflow-y-auto"
          onClick={closeModal}
        >
          <div
            className="modal-enter glass-surface rounded-3xl max-w-md w-full p-5 sm:p-8 shadow-2xl border border-white/40 dark:border-white/10 my-4 sm:my-0 space-y-4 sm:space-y-5 backdrop-blur-2xl max-h-[92dvh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <img
                  src={logoImg}
                  alt="Salmikkhang Logo"
                  className="w-9 h-9 rounded-full object-contain shadow-sm ring-1 ring-emerald-500/30 shrink-0"
                />
                <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                  {t('Salmikkhang Member Portal Login', 'সদস্য পোর্টালে লগইন')}
                </h3>
              </div>
              <button
                type="button"
                onClick={closeModal}
                aria-label={t('Close login dialog', 'লগইন বন্ধ করুন')}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {t(
                'Continue with Google using your registered Gmail address to unlock the Member Portal. Admin Panel requires a separate Continue with Google verification.',
                'সদস্য পোর্টালে প্রবেশ করতে আপনার নিবন্ধিত Gmail দিয়ে Google সাইন-ইন করুন। অ্যাডমিন প্যানেলের জন্য আলাদাভাবে প্রবেশ করতে হবে।'
              )}
            </p>

            {authLoading ? (
              <div className="py-4 text-center text-xs font-bold text-emerald-700 dark:text-emerald-400">
                {t('Checking Google session...', 'Google সেশন যাচাই করা হচ্ছে...')}
              </div>
            ) : memberAccessNotice ? (
              <div className="space-y-3">
                <div className={`p-3.5 rounded-2xl border text-xs space-y-2 ${
                  memberAccessNotice.status === 'declined' || memberAccessNotice.status === 'inactive'
                    ? 'bg-rose-50/90 dark:bg-rose-950/50 border-rose-300 dark:border-rose-800'
                    : 'bg-amber-50/90 dark:bg-amber-950/50 border-amber-300 dark:border-amber-800'
                }`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 font-extrabold text-rose-950 dark:text-rose-100">
                      {memberAccessNotice.status === 'declined' || memberAccessNotice.status === 'inactive' ? (
                        <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                      ) : (
                        <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      )}
                      <span>
                        {memberAccessNotice.status === 'declined'
                          ? t('Access Declined — Not Registered', 'অ্যাক্সেস বাতিল — নিবন্ধিত নয়')
                          : memberAccessNotice.status === 'failed'
                          ? t('Database Connection Unavailable', 'ডেটাবেসের সাথে সংযোগ পাওয়া যায়নি')
                          : t('Access Declined — Inactive', 'অ্যাক্সেস বাতিল — নিষ্ক্রিয়')}
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
                  <p className="text-[11px] text-slate-800 dark:text-slate-200 leading-relaxed">
                    {memberAccessNotice.status === 'declined'
                      ? t(
                          `"${memberAccessNotice.email}" is not registered in our database, so access is declined. No request was sent to Admin. Submit a Membership Application if you wish to join.`,
                          `"${memberAccessNotice.email}" আমাদের ডেটাবেসে নিবন্ধিত নয়, তাই অ্যাক্সেস বাতিল করা হয়েছে। অ্যাডমিনের কাছে কোনো রিকোয়েস্ট পাঠানো হয়নি। যুক্ত হতে চাইলে সদস্যপদের আবেদন জমা দিন।`
                        )
                      : memberAccessNotice.status === 'failed'
                      ? t(
                          `Signed in as "${memberAccessNotice.email}", but could not connect to the cloud database right now (offline or daily quota reached).`,
                          `"${memberAccessNotice.email}" দিয়ে লগইন হয়েছে, কিন্তু এই মুহূর্তে ক্লাউড ডেটাবেসে সংযোগ পাওয়া যাচ্ছে না।`
                        )
                      : t(
                          `"${memberAccessNotice.email}" is marked Inactive in the database, so access is declined.`,
                          `"${memberAccessNotice.email}" ডেটাবেসে নিষ্ক্রিয় (Inactive) রয়েছে, তাই অ্যাক্সেস বাতিল করা হয়েছে।`
                        )}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => openModal('join', { prefillEmail: memberAccessNotice.email })}
                    className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl"
                  >
                    {t('Apply for Membership →', 'আবেদন করুন →')}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleGoogleSignIn()}
                    className="px-3.5 py-2.5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white font-bold text-xs rounded-xl"
                  >
                    {t('Other Account', 'অন্য অ্যাকাউন্ট')}
                  </button>
                </div>
              </div>
            ) : isMemberSessionUnlocked && firebaseUser ? (
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs space-y-1">
                  <div className="font-bold text-slate-900 dark:text-slate-100">
                    {t('Signed in as:', 'বর্তমান অ্যাকাউন্ট:')} <span className="font-mono">{firebaseUser.email}</span>
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-400">
                    {currentMember
                      ? t(`Active role: ${currentMember.role}`, `সক্রিয় পদবি: ${currentMember.role}`)
                      : t('Not registered as an approved member yet.', 'এখনো অনুমোদিত সদস্য তালিকায় যুক্ত নয়।')}
                  </div>
                </div>

                <div className="flex gap-2">
                  {currentMember ? (
                    <button
                      type="button"
                      onClick={() => {
                        closeModal();
                        setCurrentView('member');
                      }}
                      className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl"
                    >
                      {t('Open Member Portal →', 'সদস্য পোর্টালে যান →')}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => openModal('join')}
                      className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl"
                    >
                      {t('Apply for Membership →', 'সদস্যপদের আবেদন করুন →')}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={logoutMember}
                    className="px-3.5 py-2.5 bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl"
                  >
                    {t('Sign Out', 'লগআউট')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {authError && (
                  <div className="p-3 rounded-2xl bg-rose-50/90 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 text-xs text-rose-950 dark:text-rose-200 flex items-start justify-between gap-2">
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

                {firebaseUser?.emailVerified && firebaseUser?.email ? (
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => void handleExistingGoogleLink()}
                      className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 px-3"
                    >
                      <Shield className="w-4 h-4 shrink-0" />
                      <span className="truncate">
                        {t(`Continue & Link as ${firebaseUser.email} →`, `${firebaseUser.email} দিয়ে প্রবেশ করুন →`)}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleGoogleSignIn()}
                      className="w-full py-2.5 bg-slate-900/90 dark:bg-slate-800 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl"
                    >
                      {t('Use Another Google Account', 'অন্য Google অ্যাকাউন্ট দিন')}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => void handleGoogleSignIn()}
                    className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2"
                  >
                    <Shield className="w-4 h-4" />
                    <span>{t('Continue with Google →', 'Google দিয়ে এগিয়ে যান →')}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => openModal('join')}
                  className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs rounded-xl"
                >
                  {t('New here? Apply for Membership', 'নতুন সদস্য? আবেদন পাঠান')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. NEWS READER MODAL WITH PDF DOWNLOAD */}
      {selectedNews && (
        <div
          className="backdrop-enter fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-start sm:items-center justify-center p-3 sm:p-4 overflow-y-auto"
          onClick={onCloseNews}
        >
          <div
            className="modal-enter glass-surface rounded-3xl max-w-2xl w-full p-5 sm:p-8 shadow-2xl border border-white/40 dark:border-white/10 my-4 sm:my-8 space-y-4 sm:space-y-5 max-h-[92dvh] overflow-y-auto backdrop-blur-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-lg">
                  {t(selectedNews.category, selectedNews.categoryBn)}
                </span>
                {selectedNews.visibility === 'members_only' ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800 rounded-md flex items-center gap-1">
                    <span>🔒</span>
                    <span>{t('Members Only (Private)', 'শুধুমাত্র সদস্য')}</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-medium px-2 py-0.5 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-md">
                    {t('Public Notice', 'সার্বজনীন')}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={onCloseNews}
                aria-label={t('Close story', 'সংবাদ বন্ধ করুন')}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 leading-snug">
                {t(selectedNews.title, selectedNews.titleBn)}
              </h2>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {t('Published on', 'প্রকাশিত')} {selectedNews.date} · Salmikkhang Youth Council
              </div>
            </div>

            {selectedNews.image && (
              <img
                src={selectedNews.image}
                alt={selectedNews.title}
                className="w-full h-64 sm:h-80 object-cover rounded-2xl bg-slate-100 dark:bg-slate-800"
              />
            )}

            {/* Attached PDF in News Reader */}
            {selectedNews.pdfAttachment && (
              <div className="p-4 bg-rose-50/80 dark:bg-rose-950/40 rounded-2xl border border-rose-200 dark:border-rose-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900 text-rose-700 dark:text-rose-300 flex items-center justify-center font-bold text-xs shrink-0">
                    PDF
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-900 dark:text-slate-100">
                      {selectedNews.pdfAttachment.fileName}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {selectedNews.pdfAttachment.fileSize} · {t('Official signed circular document', 'অফিসিয়াল স্বাক্ষরিত পরিপত্র')}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={selectedNews.pdfAttachment.dataUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>{t('Open PDF', 'PDF খুলুন')}</span>
                  </a>
                  <a
                    href={selectedNews.pdfAttachment.dataUrl}
                    download={selectedNews.pdfAttachment.fileName}
                    className="px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{t('Download', 'ডাউনলোড')}</span>
                  </a>
                </div>
              </div>
            )}

            <div className="prose prose-sm dark:prose-invert text-slate-700 dark:text-slate-300 leading-relaxed text-sm space-y-4">
              <p className="font-medium text-slate-900 dark:text-slate-100">
                {t(selectedNews.summary, selectedNews.summaryBn)}
              </p>
              <p>
                {t(selectedNews.content, selectedNews.contentBn)}
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={onCloseNews}
                className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl"
              >
                {t('Close Story', 'বন্ধ করুন')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. GALLERY LIGHTBOX MODAL */}
      {selectedGalleryItem && (
        <div 
          className="backdrop-enter fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={onCloseGallery}
        >
          <div 
            className="modal-enter max-w-4xl w-full space-y-4 relative"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between text-white pb-2">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  {t(selectedGalleryItem.category, selectedGalleryItem.categoryBn)}
                </span>
                <h3 className="text-lg font-bold">
                  {t(selectedGalleryItem.title, selectedGalleryItem.titleBn)}
                </h3>
              </div>
              <button
                type="button"
                onClick={onCloseGallery}
                aria-label={t('Close gallery preview', 'গ্যালারি প্রিভিউ বন্ধ করুন')}
                className="p-2 text-white/80 hover:text-white rounded-full bg-white/10"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden max-h-[75vh] flex items-center justify-center bg-black">
              <img
                src={selectedGalleryItem.image}
                alt={selectedGalleryItem.title}
                className="max-h-[75vh] w-auto max-w-full object-contain rounded-xl"
              />
            </div>

            <div className="text-xs text-slate-400 text-center">
              Salmikkhang Community Moments · {selectedGalleryItem.date}
            </div>
          </div>
        </div>
      )}

      {/* 5. INSTANT SEARCH MODAL */}
      {searchOpen && (
        <div 
          className="backdrop-enter fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-start justify-center p-3 sm:p-4 pt-12 sm:pt-20 overflow-y-auto"
          onClick={onCloseSearch}
        >
          <div 
            className="modal-enter glass-surface rounded-3xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl border border-white/40 dark:border-white/10 space-y-4 backdrop-blur-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="relative">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
              <input
                type="search"
                autoFocus
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={t('Search news, events, tree planting, members, sports...', 'খবর, অনুষ্ঠান, গাছ লাগানো, সদস্য বা খেলা খুঁজুন...')}
                className="w-full pl-12 pr-10 py-3 text-sm rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {searchResults && (
              <div className="space-y-4 max-h-[60vh] overflow-y-auto text-xs">
                {!hasAnySearchMatch && (
                  <div className="py-8 text-center text-slate-500 dark:text-slate-400">
                    {t(`No matching results found for "${searchQuery}".`, `"${searchQuery}"-এর সাথে কোনো ফলাফল পাওয়া যায়নি।`)}
                  </div>
                )}

                {/* News matches */}
                {searchResults.news.length > 0 && (
                  <div className="space-y-2">
                    <span className="font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">
                      {t('News & Notices', 'খবর ও নোটিশ')} ({searchResults.news.length})
                    </span>
                    <div className="space-y-1">
                      {searchResults.news.map(n => (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => {
                            onCloseSearch();
                            setCurrentView('website');
                            if (onSelectNews) {
                              setTimeout(() => onSelectNews(n.id), 60);
                            } else {
                              setTimeout(() => document.getElementById('news')?.scrollIntoView({ behavior: 'smooth' }), 80);
                            }
                          }}
                          className="w-full text-left p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-slate-700 cursor-pointer flex items-center justify-between"
                        >
                          <div>
                            <div className="font-bold text-slate-900 dark:text-slate-100">{t(n.title, n.titleBn)}</div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400">{n.date} · {t(n.category, n.categoryBn)}</div>
                          </div>
                          {n.pdfAttachment && (
                            <span className="text-[10px] px-2 py-0.5 bg-rose-100 text-rose-700 font-bold rounded">PDF</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Event matches */}
                {searchResults.events.length > 0 && (
                  <div className="space-y-2">
                    <span className="font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">
                      {t('Events', 'অনুষ্ঠান')} ({searchResults.events.length})
                    </span>
                    <div className="space-y-1">
                      {searchResults.events.map(ev => (
                        <button
                          key={ev.id}
                          type="button"
                          onClick={() => {
                            onCloseSearch();
                            setCurrentView('website');
                            setTimeout(() => document.getElementById('events')?.scrollIntoView({ behavior: 'smooth' }), 80);
                          }}
                          className="w-full text-left p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-slate-700 cursor-pointer flex items-center justify-between"
                        >
                          <div>
                            <div className="font-bold text-slate-900 dark:text-slate-100">{t(ev.title, ev.titleBn)}</div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400">{ev.date} · {t(ev.location, ev.locationBn)}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Project matches */}
                {searchResults.projects.length > 0 && (
                  <div className="space-y-2">
                    <span className="font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">
                      {t('Projects', 'উদ্যোগ')} ({searchResults.projects.length})
                    </span>
                    <div className="space-y-1">
                      {searchResults.projects.map(p => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            onCloseSearch();
                            setCurrentView('website');
                            setTimeout(() => document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' }), 80);
                          }}
                          className="w-full text-left p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-slate-700 cursor-pointer flex items-center justify-between"
                        >
                          <div>
                            <div className="font-bold text-slate-900 dark:text-slate-100">{t(p.title, p.titleBn)}</div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400">{t(p.category, p.categoryBn)} · {p.progress}%</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Member matches (only shown to authorized members/admins) */}
                {searchResults.members.length > 0 && (
                  <div className="space-y-2">
                    <span className="font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">
                      {t('Community Members', 'সদস্যবৃন্দ')} ({searchResults.members.length})
                    </span>
                    <div className="space-y-1">
                      {searchResults.members.map(m => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            onCloseSearch();
                            setCurrentView('member');
                          }}
                          className="w-full text-left p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-slate-700 flex items-center justify-between"
                        >
                          <div>
                            <div className="font-bold text-slate-900 dark:text-slate-100">{m.name}</div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400">{m.role} · {m.village} · Blood: {m.bloodGroup}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
