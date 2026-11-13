import React, { useState } from 'react';
import { useCommunity } from '../context/CommunityContext';
import { X, Search, Download, ExternalLink, Shield } from 'lucide-react';
import logoImg from '../assets/images/logo.png';

interface ModalsProps {
  searchOpen: boolean;
  onCloseSearch: () => void;
  selectedNewsId: string | null;
  onCloseNews: () => void;
  selectedGalleryItem: any | null;
  onCloseGallery: () => void;
}

export const Modals: React.FC<ModalsProps> = ({
  searchOpen,
  onCloseSearch,
  selectedNewsId,
  onCloseNews,
  selectedGalleryItem,
  onCloseGallery
}) => {
  const {
    t,
    activeModal,
    openModal,
    closeModal,
    submitJoinRequest,
    firebaseUser,
    authLoading,
    loginWithGoogle,
    logoutGoogle,
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

  // Global search input
  const [searchQuery, setSearchQuery] = useState('');

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitJoinRequest({
      name: joinName,
      email: joinEmail || firebaseUser?.email || `${joinName.toLowerCase().replace(/\s+/g, '')}@example.com`,
      phone: joinPhone,
      village: joinVillage,
      bloodGroup: joinBlood,
      skills: joinSkills,
      interests: joinInterests,
      reason: joinReason
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
    const ok = await loginWithGoogle();
    if (ok) {
      closeModal();
      setCurrentView('member');
    }
  };

  const selectedNews = selectedNewsId ? news.find(n => n.id === selectedNewsId) : null;

  // Filtered search results
  const q = searchQuery.toLowerCase().trim();
  const searchResults = q
    ? {
        events: events.filter(e => e.title.toLowerCase().includes(q) || e.location.toLowerCase().includes(q)),
        news: news.filter(n => n.title.toLowerCase().includes(q) || n.summary.toLowerCase().includes(q)),
        projects: projects.filter(p => p.title.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)),
        members: members.filter(m => m.name.toLowerCase().includes(q) || m.skills.some(s => s.toLowerCase().includes(q)))
      }
    : null;

  return (
    <>
      {/* 1. JOIN APPLICATION MODAL (Sent to Admin for enrollment) */}
      {activeModal === 'join' && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-start sm:items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="glass-surface rounded-3xl max-w-xl w-full p-5 sm:p-8 shadow-2xl border border-white/40 dark:border-white/10 my-4 sm:my-8 space-y-4 sm:space-y-5 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-2xl max-h-[92dvh] overflow-y-auto">
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
                onClick={closeModal}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleJoinSubmit} className="space-y-4 text-xs">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t('Full Name *', 'সম্পূর্ণ নাম *')}
                  </label>
                  <input
                    type="text"
                    required
                    value={joinName}
                    onChange={e => setJoinName(e.target.value)}
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
                    onChange={e => setJoinPhone(e.target.value)}
                    placeholder="+880 1712-XXXXXX"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t('Email Address', 'ইমেইল অ্যাড্রেস')}
                  </label>
                  <input
                    type="email"
                    value={joinEmail}
                    onChange={e => setJoinEmail(e.target.value)}
                    placeholder="robin@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t('Village / Area *', 'গ্রাম / এলাকা *')}
                  </label>
                  <select
                    value={joinVillage}
                    onChange={e => setJoinVillage(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm font-semibold"
                  >
                    <option value="Gaira">Gaira (গাইরা)</option>
                    <option value="Jolchotro">Jolchotro (জলছত্র)</option>
                    <option value="Pirgachha">Pirgachha (পীরগাছা)</option>
                    <option value="Aronkhola">Aronkhola (অরণখোলা)</option>
                    <option value="Madhupur">Madhupur (মধুপুর)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t('Blood Group *', 'রক্তের গ্রুপ *')}
                  </label>
                  <select
                    value={joinBlood}
                    onChange={e => setJoinBlood(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm font-bold text-rose-600"
                  >
                    {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t('Skills & Talents', 'দক্ষতা ও বিশেষ গুণ')}
                </label>
                <input
                  type="text"
                  value={joinSkills}
                  onChange={e => setJoinSkills(e.target.value)}
                  placeholder={t('e.g. Teaching, photography, design, sports, first aid', 'যেমন: শিক্ষকতা, ছবি তোলা, ফার্স্ট এইড')}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm"
                />
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
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-start sm:items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="glass-surface rounded-3xl max-w-md w-full p-5 sm:p-8 shadow-2xl border border-white/40 dark:border-white/10 my-4 sm:my-0 space-y-4 sm:space-y-5 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-2xl max-h-[92dvh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <img
                  src={logoImg}
                  alt="Salmikkhang Logo"
                  className="w-9 h-9 rounded-full object-contain shadow-sm ring-1 ring-emerald-500/30 shrink-0"
                />
                <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                  {t('Salmikkhang Member & Admin Portal', 'সদস্য ও অ্যাডমিন প্যানেলে প্রবেশ')}
                </h3>
              </div>
              <button onClick={closeModal} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {t(
                'Sign in securely with Google using your registered Gmail address to access the Member Portal or Admin Dashboard.',
                'সদস্য পোর্টাল বা অ্যাডমিন ড্যাশবোর্ডে প্রবেশ করতে আপনার নিবন্ধিত Gmail অ্যাকাউন্ট দিয়ে নিরাপদে Google সাইন-ইন করুন।'
              )}
            </p>

            {authLoading ? (
              <div className="py-4 text-center text-xs font-bold text-emerald-700 dark:text-emerald-400">
                {t('Checking Google session...', 'Google সেশন যাচাই করা হচ্ছে...')}
              </div>
            ) : firebaseUser ? (
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
                    onClick={() => void logoutGoogle()}
                    className="px-3.5 py-2.5 bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl"
                  >
                    {t('Sign Out', 'লগআউট')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => void handleGoogleSignIn()}
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2"
                >
                  <Shield className="w-4 h-4" />
                  <span>{t('Sign in with Google →', 'Google দিয়ে লগইন করুন →')}</span>
                </button>

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
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-start sm:items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="glass-surface rounded-3xl max-w-2xl w-full p-5 sm:p-8 shadow-2xl border border-white/40 dark:border-white/10 my-4 sm:my-8 space-y-4 sm:space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[92dvh] overflow-y-auto backdrop-blur-2xl">
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
              <button onClick={onCloseNews} className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
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
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={onCloseGallery}
        >
          <div 
            className="max-w-4xl w-full space-y-4 relative"
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
                onClick={onCloseGallery}
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
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-start justify-center p-3 sm:p-4 pt-12 sm:pt-20 overflow-y-auto"
          onClick={onCloseSearch}
        >
          <div 
            className="glass-surface rounded-3xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl border border-white/40 dark:border-white/10 space-y-4 animate-in fade-in slide-in-from-top-4 duration-150 backdrop-blur-2xl"
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
                {/* News matches */}
                {searchResults.news.length > 0 && (
                  <div className="space-y-2">
                    <span className="font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">
                      {t('News & Notices', 'খবর ও নোটিশ')} ({searchResults.news.length})
                    </span>
                    <div className="space-y-1">
                      {searchResults.news.map(n => (
                        <div
                          key={n.id}
                          onClick={() => {
                            onCloseSearch();
                            setCurrentView('website');
                          }}
                          className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-slate-700 cursor-pointer flex items-center justify-between"
                        >
                          <div>
                            <div className="font-bold text-slate-900 dark:text-slate-100">{n.title}</div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400">{n.date} · {n.category}</div>
                          </div>
                          {n.pdfAttachment && (
                            <span className="text-[10px] px-2 py-0.5 bg-rose-100 text-rose-700 font-bold rounded">PDF</span>
                          )}
                        </div>
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
                        <div
                          key={ev.id}
                          onClick={() => {
                            onCloseSearch();
                            setCurrentView('website');
                          }}
                          className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-slate-700 cursor-pointer flex items-center justify-between"
                        >
                          <div>
                            <div className="font-bold text-slate-900 dark:text-slate-100">{ev.title}</div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400">{ev.date} · {ev.location}</div>
                          </div>
                        </div>
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
                        <div
                          key={p.id}
                          onClick={() => {
                            onCloseSearch();
                            setCurrentView('website');
                            setTimeout(() => document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' }), 80);
                          }}
                          className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-slate-700 cursor-pointer flex items-center justify-between"
                        >
                          <div>
                            <div className="font-bold text-slate-900 dark:text-slate-100">{p.title}</div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400">{p.category} · {p.progress}%</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Member matches */}
                {searchResults.members.length > 0 && (
                  <div className="space-y-2">
                    <span className="font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">
                      {t('Community Members', 'সদস্যবৃন্দ')} ({searchResults.members.length})
                    </span>
                    <div className="space-y-1">
                      {searchResults.members.map(m => (
                        <div
                          key={m.id}
                          className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-between"
                        >
                          <div>
                            <div className="font-bold text-slate-900 dark:text-slate-100">{m.name}</div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400">{m.role} · {m.village} · Blood: {m.bloodGroup}</div>
                          </div>
                        </div>
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
