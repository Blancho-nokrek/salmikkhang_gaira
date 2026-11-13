import React, { useState } from 'react';
import { useCommunity } from '../context/CommunityContext';
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
} from 'lucide-react';

// Hero background image
import heroBg from '../assets/images/hero_community_landscape_1794424784970.jpg';

interface PublicWebsiteProps {
  onSelectNews: (newsId: string) => void;
  onSelectGallery: (item: any) => void;
}

export const PublicWebsite: React.FC<PublicWebsiteProps> = ({ onSelectNews, onSelectGallery }) => {
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
    showToast
  } = useCommunity();

  // Contact form state
  const [contactName, setContactName] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [contactMsg, setContactMsg] = useState('');
  const [submittingContact, setSubmittingContact] = useState(false);

  // Gallery filter
  const [galleryFilter, setGalleryFilter] = useState<string>('All');

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
    const userIdentifier = currentMember ? currentMember.name : 'Guest Volunteer';
    toggleEventRsvp(eventId, userIdentifier);
  };

  const filteredGallery = galleryFilter === 'All'
    ? gallery
    : gallery.filter(g => g.category.toLowerCase() === galleryFilter.toLowerCase());

  return (
    <div className="w-full transition-colors">
      {/* 1. Hero Section */}
      <section 
        id="home"
        className="relative min-h-[440px] sm:min-h-[540px] lg:min-h-[600px] flex items-center bg-emerald-950 text-white overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(105deg, rgba(5,28,21,0.93) 0%, rgba(9,42,32,0.86) 55%, rgba(8,38,28,0.58) 100%), url(${settings.heroBackground || heroBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 45%'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 lg:py-20 w-full relative z-10">
          <div className="max-w-2xl space-y-4 sm:space-y-6">
            
            {/* Top Eyebrow Tag */}
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-800/60 backdrop-blur-md rounded-lg border border-emerald-500/30 text-emerald-100 text-[10px] sm:text-xs font-bold tracking-widest uppercase">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span>GAIRA · JOLCHOTRO · MADHUPUR · TANGAIL</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.08] text-white">
              {language === 'bn' ? 'সালমিকখাং' : 'SALMIKKHANG'}
              <span className="block text-xl sm:text-3xl lg:text-4xl font-semibold text-emerald-200/95 mt-1.5 sm:mt-2">
                {t('Village Youth Community', 'গ্রাম যুব কমিউনিটি')}
              </span>
            </h1>

            {/* Subtitle Prose */}
            <p className="text-sm sm:text-lg text-emerald-100/95 leading-relaxed max-w-xl font-normal">
              {t(
                'Together for a greener, kinder and stronger village in Gaira, Jolchotro, Madhupur, Tangail. Empowering local youth through education, nature conservation, and cultural unity.',
                'গাইরা ও জলছত্র, মধুপুর, টাঙ্গাইলে একটি সবুজ, মানবিক ও ঐক্যবদ্ধ গ্রাম গড়ে তুলতে আমরা একসঙ্গে কাজ করি। শিক্ষা, পরিবেশ সংরক্ষণ ও সংস্কৃতির বিকাশে তরুণদের শক্তি।'
              )}
            </p>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 sm:gap-4">
              <button
                onClick={() => openModal('join')}
                className="w-full sm:w-auto px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold text-sm rounded-xl shadow-lg transition-transform hover:-translate-y-0.5 active:translate-y-0 text-center"
              >
                {t('Apply for Membership →', 'সদস্য হতে আবেদন করুন →')}
              </button>
              <a
                href="#projects"
                className="w-full sm:w-auto px-5 py-3.5 bg-white/15 hover:bg-white/25 backdrop-blur-md text-white font-semibold text-sm rounded-xl border border-white/25 transition-colors text-center"
              >
                {t('Our Village Projects', 'আমাদের উদ্যোগসমূহ')}
              </a>
            </div>

            {/* Bottom Meta Badges */}
            <div className="pt-2 sm:pt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-emerald-100/85">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Gaira, Jolchotro, Madhupur</span>
              </div>
              <span className="hidden xs:inline">·</span>
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>50+ Active Youth Volunteers</span>
              </div>
            </div>

          </div>

        </div>

      </section>

      {/* 2. Quick Navigation Bento Cards */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 -mt-6 sm:-mt-8 relative z-20">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-4">
          {[
            { id: 'about', icon: '♧', labelEn: 'About Us', labelBn: 'পরিচিতি', descEn: 'Mission & roots', descBn: 'আমাদের লক্ষ্য' },
            { id: 'events', icon: '▣', labelEn: 'Events', labelBn: 'অনুষ্ঠান', descEn: 'RSVP & attend', descBn: 'আসন্ন আয়োজন' },
            { id: 'news', icon: '▤', labelEn: 'News', labelBn: 'সংবাদ', descEn: 'Notices & updates', descBn: 'নোটিশ ও খবর' },
            { id: 'projects', icon: '⌂', labelEn: 'Projects', labelBn: 'উদ্যোগ', descEn: 'Green & school', descBn: 'চলমান কাজ' },
            { id: 'gallery', icon: '▧', labelEn: 'Gallery', labelBn: 'গ্যালারি', descEn: 'Photos & moments', descBn: 'স্মৃতি ও ছবি' },
            { id: 'contact', icon: '✉', labelEn: 'Contact', labelBn: 'যোগাযোগ', descEn: 'Reach organizers', descBn: 'বার্তা পাঠান' },
          ].map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="glass-card hover:border-emerald-500/40 p-3.5 sm:p-4 rounded-2xl border border-white/40 dark:border-white/10 shadow-lg backdrop-blur-xl transition-all group flex flex-col justify-between"
            >
              <div className="text-lg sm:text-xl text-emerald-800 dark:text-emerald-400 font-bold mb-1.5 sm:mb-2 group-hover:scale-110 transition-transform">
                {item.icon}
              </div>
              <div>
                <div className="font-bold text-xs sm:text-sm text-slate-950 dark:text-slate-100 group-hover:text-emerald-800 dark:group-hover:text-emerald-300">
                  {t(item.labelEn, item.labelBn)}
                </div>
                <div className="text-[11px] text-slate-700 dark:text-slate-400 mt-0.5 font-medium">
                  {t(item.descEn, item.descBn)}
                </div>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* 3. About & Goals Strip */}
      <section id="about" className="py-12 sm:py-16 lg:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-card bg-white/85 dark:bg-slate-900 text-slate-950 dark:text-white rounded-3xl p-5 sm:p-8 lg:p-12 shadow-xl border border-white/50 dark:border-slate-800 relative overflow-hidden">
          <div className="grid lg:grid-cols-12 gap-8 items-center">
            
            <div className="lg:col-span-5 space-y-4">
              <div className="inline-flex items-center gap-2 text-emerald-900 dark:text-emerald-300 text-xs font-extrabold uppercase tracking-widest">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{t('OUR MISSION & PURPOSE', 'আমাদের লক্ষ্য ও উদ্দেশ্য')}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white">
                {t('Empower Youth. Strengthen Village Life.', 'তারুণ্যের বিকাশ। গ্রামের সমৃদ্ধি।')}
              </h2>
              <p className="text-slate-900 dark:text-slate-300 text-sm leading-relaxed">
                {t(
                  'Salmikkhang was formed by local young residents of Gaira and Jolchotro to address educational needs, environmental restoration in the Madhupur forest tract, and social unity. We believe young villagers hold the keys to a prosperous future.',
                  'গাইরা ও জলছত্রের তরুণদের উদ্যোগে সালমিকখাং গঠিত। শিক্ষা সহায়তা, মধুপুর শালবনের পরিবেশ রক্ষা এবং সামাজিক ঐক্য গঠনে তৃণমূল পর্যায়ের এই সংগঠন নিরলস কাজ করে যাচ্ছে।'
                )}
              </p>
              <div className="pt-2">
                <button
                  onClick={() => openModal('join')}
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 dark:bg-white text-white dark:text-emerald-950 font-bold text-xs rounded-lg dark:hover:bg-emerald-50 transition-colors"
                >
                  {t('Volunteer With Us →', 'স্বেচ্ছাসেবক হিসেবে যুক্ত হোন →')}
                </button>
              </div>
            </div>

            <div className="lg:col-span-7 grid sm:grid-cols-2 gap-4">
              <div className="bg-white/75 dark:bg-slate-800/80 border border-emerald-900/10 dark:border-slate-700 p-5 rounded-2xl space-y-2 shadow-xs">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-800 flex items-center justify-center text-emerald-900 dark:text-emerald-200">
                  <BookOpen className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base text-slate-950 dark:text-white">
                  {t('Education & Tutoring', 'শিক্ষা ও দক্ষতা উন্নয়ন')}
                </h3>
                <p className="text-xs text-slate-900 dark:text-slate-300 leading-relaxed">
                  {t(
                    'Free peer tutoring for school students in Mathematics, Science, and English to bridge learning gaps.',
                    'গ্রামের শিক্ষার্থীদের জন্য গণিত, বিজ্ঞান ও ইংরেজিতে বিনামূল্যে পাঠদান ও সহশিক্ষা সহায়তা।'
                  )}
                </p>
              </div>

              <div className="bg-white/75 dark:bg-slate-800/80 border border-emerald-900/10 dark:border-slate-700 p-5 rounded-2xl space-y-2 shadow-xs">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-800 flex items-center justify-center text-emerald-900 dark:text-emerald-200">
                  <TreePine className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base text-slate-950 dark:text-white">
                  {t('Environmental Stewardship', 'সবুজ পরিবেশ ও বৃক্ষরোপণ')}
                </h3>
                <p className="text-xs text-slate-900 dark:text-slate-300 leading-relaxed">
                  {t(
                    'Planting fruit and timber saplings, installing waste bins, and raising ecological awareness in Madhupur.',
                    'ফলদ ও বনজ বৃক্ষরোপণ, পরিচ্ছন্নতা অভিযান এবং শালবনের পরিবেশ সুরক্ষায় সচেতনতা তৈরি।'
                  )}
                </p>
              </div>

              <div className="bg-white/75 dark:bg-slate-800/80 border border-emerald-900/10 dark:border-slate-700 p-5 rounded-2xl space-y-2 shadow-xs">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-800 flex items-center justify-center text-emerald-900 dark:text-emerald-200">
                  <HeartHandshake className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base text-slate-950 dark:text-white">
                  {t('Social Care & Health', 'সামাজিক সেবা ও রক্তদান')}
                </h3>
                <p className="text-xs text-slate-900 dark:text-slate-300 leading-relaxed">
                  {t(
                    'Maintaining an emergency blood donor directory, supporting sick elders, and aiding winter clothing drives.',
                    'জরুরি রক্তের প্রয়োজনে স্বেচ্ছাসেবী দল গঠন এবং অসহায় রোগীদের ওষুধ ও শীতবস্ত্র বিতরণে পাশে থাকা।'
                  )}
                </p>
              </div>

              <div className="bg-white/75 dark:bg-slate-800/80 border border-emerald-900/10 dark:border-slate-700 p-5 rounded-2xl space-y-2 shadow-xs">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-800 flex items-center justify-center text-emerald-900 dark:text-emerald-200">
                  <Award className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base text-slate-950 dark:text-white">
                  {t('Sports & Achik Heritage', 'খেলাধুলা ও ঐতিহ্য')}
                </h3>
                <p className="text-xs text-slate-900 dark:text-slate-300 leading-relaxed">
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

      {/* 4. Events & News Section */}
      <section className="py-10 sm:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* Left Column: Public Events */}
          <div id="events" className="lg:col-span-7 space-y-5 sm:space-y-6 min-w-0">
            <div className="flex flex-wrap items-end justify-between gap-2 pb-3 border-b border-emerald-900/15 dark:border-slate-800">
              <div>
                <span className="text-xs font-bold text-emerald-950 dark:text-emerald-400 uppercase tracking-wider block">
                  {t('CALENDAR & ACTIVITIES', 'অনুষ্ঠান ও কর্মসূচি')}
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-950 dark:text-slate-100 mt-0.5">
                  {t('Upcoming Public Events', 'আসন্ন প্রকাশ্য অনুষ্ঠান')}
                </h2>
              </div>
              <button
                onClick={() => openModal('join')}
                className="text-xs font-bold text-emerald-900 dark:text-emerald-400 hover:text-emerald-950 dark:hover:text-emerald-300"
              >
                {t('Volunteer for an event →', 'স্বেচ্ছাসেবক হোন →')}
              </button>
            </div>

            <div className="space-y-4">
              {events.filter(e => e.visibility !== 'members_only').map((event) => {
                const userIdentifier = currentMember ? currentMember.name : 'Guest Volunteer';
                const isRsvpd = event.rsvps.includes(userIdentifier);
                return (
                  <div
                    key={event.id}
                    className="glass-card border border-white/40 dark:border-white/10 rounded-3xl p-4 sm:p-5 hover:border-emerald-500/40 shadow-lg backdrop-blur-2xl transition-all flex flex-col sm:flex-row gap-4 sm:gap-5 items-start sm:items-center"
                  >
                    <div className="flex items-start gap-3.5 sm:contents w-full">
                      {/* Date Badge */}
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-emerald-50 dark:bg-slate-800 border border-emerald-200 dark:border-slate-700 text-slate-950 dark:text-emerald-300 flex flex-col items-center justify-center shrink-0">
                        <span className="text-[10px] font-bold uppercase text-emerald-800 dark:text-emerald-400">
                          {new Date(event.date).toLocaleString('default', { month: 'short' })}
                        </span>
                        <span className="text-xl sm:text-2xl font-black leading-none my-0.5">
                          {new Date(event.date).getDate()}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-400">
                          {new Date(event.date).getFullYear()}
                        </span>
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="text-[11px] font-bold px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-950 dark:text-emerald-300 rounded-md">
                            {t(event.category, event.categoryBn)}
                          </span>
                          <span className="text-xs text-slate-600 dark:text-slate-400">·</span>
                          <div className="flex items-center gap-1 text-xs text-slate-800 dark:text-slate-400 font-medium">
                            <Clock className="w-3.5 h-3.5 shrink-0" />
                            <span>{t(event.time, event.timeBn)}</span>
                          </div>
                        </div>

                        <h3 className="font-bold text-sm sm:text-base text-slate-950 dark:text-slate-100 hover:text-emerald-900 dark:hover:text-emerald-300 transition-colors">
                          {t(event.title, event.titleBn)}
                        </h3>

                        <p className="text-xs text-slate-800 dark:text-slate-300 leading-relaxed line-clamp-2">
                          {t(event.description, event.descriptionBn)}
                        </p>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-800 dark:text-slate-400 pt-1">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-emerald-800 dark:text-emerald-400 shrink-0" />
                            <span>{t(event.location, event.locationBn)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-emerald-800 dark:text-emerald-400 shrink-0" />
                            <span>{event.rsvps.length} {t('attending', 'অংশগ্রহণকারী')}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* RSVP Button */}
                    <div className="shrink-0 w-full sm:w-auto">
                      <button
                        onClick={() => handleRsvpClick(event.id)}
                        className={`w-full sm:w-auto px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                          isRsvpd
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-950 dark:text-emerald-300 hover:bg-emerald-200'
                            : 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs'
                        }`}
                      >
                        {isRsvpd ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
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
          <div id="news" className="lg:col-span-5 space-y-5 sm:space-y-6 min-w-0">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-900/15 dark:border-slate-800">
              <div>
                <span className="text-xs font-bold text-emerald-950 dark:text-emerald-400 uppercase tracking-wider block">
                  {t('BULLETIN & STORIES', 'নোটিশ ও খবর')}
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-950 dark:text-slate-100 mt-0.5">
                  {t('Latest Community News', 'সাম্প্রতিক খবর ও নোটিশ')}
                </h2>
              </div>
            </div>

            <div className="space-y-4">
              {news.filter(item => item.visibility !== 'members_only').map((item) => (
                <article
                  key={item.id}
                  onClick={() => onSelectNews(item.id)}
                  className="glass-card border border-white/40 dark:border-white/10 rounded-3xl p-3.5 sm:p-4 hover:border-emerald-500/40 shadow-lg backdrop-blur-2xl transition-all cursor-pointer group"
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover shrink-0 bg-slate-100 dark:bg-slate-800 group-hover:opacity-90 transition-opacity"
                      />
                    ) : (
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-emerald-50 dark:bg-slate-800 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold text-lg shrink-0">
                        🌿
                      </div>
                    )}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-950 dark:text-slate-300 rounded">
                            {t(item.category, item.categoryBn)}
                          </span>
                          {item.pdfAttachment && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 bg-rose-50 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-900 rounded flex items-center gap-0.5">
                              <FileText className="w-3 h-3" />
                              <span>PDF</span>
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-700 dark:text-slate-400 font-medium">
                          {item.date}
                        </span>
                      </div>
                      <h3 className="font-bold text-sm text-slate-950 dark:text-slate-100 group-hover:text-emerald-900 dark:group-hover:text-emerald-300 transition-colors line-clamp-2">
                        {t(item.title, item.titleBn)}
                      </h3>
                      <p className="text-xs text-slate-800 dark:text-slate-400 line-clamp-2">
                        {t(item.summary, item.summaryBn)}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Support Callout Box */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-slate-800/80 dark:to-slate-900 border border-emerald-200/80 dark:border-slate-700 rounded-2xl p-4 sm:p-5 text-slate-950 dark:text-emerald-200 space-y-2">
              <h4 className="font-bold text-sm text-slate-950 dark:text-emerald-200">
                {t('Have a notice or village story to share?', 'কোনো খবর বা নোটিশ জানাতে চান?')}
              </h4>
              <p className="text-xs text-slate-800 dark:text-slate-300 leading-relaxed">
                {t(
                  'Community members can submit proposals, school announcements, or sports schedules to be featured here.',
                  'কমিউনিটি সদস্যরা যেকোনো ইতিবাচক খবর বা আয়োজন প্রকাশের জন্য আমাদের সাথে যোগাযোগ করতে পারেন।'
                )}
              </p>
              <a
                href="#contact"
                className="inline-block text-xs font-bold text-emerald-900 dark:text-emerald-400 hover:underline mt-1"
              >
                {t('Send announcement details →', 'বার্তা পাঠান →')}
              </a>
            </div>

          </div>

        </div>
      </section>

      {/* 5. Village Projects Section with Progress */}
      <section id="projects" className="py-12 sm:py-16 bg-slate-50/70 dark:bg-slate-950 border-y border-slate-200/60 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
          
          <div className="max-w-2xl">
            <span className="text-xs font-bold text-emerald-950 dark:text-emerald-400 uppercase tracking-wider block">
              {t('ACTIVE INITIATIVES', 'আমাদের উদ্যোগসমূহ')}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 dark:text-slate-100 mt-1">
              {t('Projects Transforming Our Village', 'গ্রামের কল্যাণে চলমান প্রকল্প')}
            </h2>
            <p className="text-slate-800 dark:text-slate-300 text-sm mt-2">
              {t(
                'Grassroots projects conceived, planned, and implemented by the young generation of Gaira & Jolchotro.',
                'গাইরা ও জলছত্রের তরুণদের ভাবনা ও শ্রমে বাস্তবায়িত তৃণমূল উন্নয়নমূলক উদ্যোগ।'
              )}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {projects.map((proj) => (
              <div
                key={proj.id}
                className="glass-card rounded-3xl border border-white/40 dark:border-white/10 overflow-hidden shadow-xl hover:border-emerald-500/40 backdrop-blur-2xl transition-all flex flex-col"
              >
                <div className="relative h-44 overflow-hidden bg-slate-100 dark:bg-slate-800">
                  <img
                    src={proj.image}
                    alt={proj.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3 bg-white/95 dark:bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                    {t(proj.status, proj.statusBn)}
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-emerald-900 dark:text-emerald-400">
                      {t(proj.category, proj.categoryBn)}
                    </span>
                    <h3 className="font-bold text-base text-slate-950 dark:text-slate-100 line-clamp-1">
                      {t(proj.title, proj.titleBn)}
                    </h3>
                    <p className="text-xs text-slate-800 dark:text-slate-300 line-clamp-3 leading-relaxed">
                      {t(proj.description, proj.descriptionBn)}
                    </p>
                  </div>

                  <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div>
                      <div className="flex justify-between text-xs font-semibold text-slate-800 dark:text-slate-400 mb-1">
                        <span>{t('Progress', 'অগ্রগতি')}</span>
                        <span className="text-emerald-900 dark:text-emerald-400 font-bold">{proj.progress}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                          style={{ width: `${proj.progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-800 dark:text-slate-400">
                      <span>{proj.volunteersEnrolled} / {proj.volunteersNeeded} {t('Volunteers', 'স্বেচ্ছাসেবক')}</span>
                      <button
                        onClick={() => openModal('join')}
                        className="text-xs font-bold text-emerald-900 dark:text-emerald-400 hover:underline"
                      >
                        {t('Support →', 'যুক্ত হোন →')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 6. Photo Gallery Section with Lightbox */}
      <section id="gallery" className="py-12 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-emerald-950 dark:text-emerald-400 uppercase tracking-wider block">
              {t('VISUAL MOMENTS', 'আমাদের মুহূর্তগুলো')}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 dark:text-slate-100 mt-1">
              {t('Salmikkhang Photo Gallery', 'সালমিকখাং ফটো গ্যালারি')}
            </h2>
            <p className="text-slate-800 dark:text-slate-300 text-sm mt-1">
              {t(
                'A glimpse into our community events, cultural celebrations, and volunteer drives in Madhupur.',
                'মধুপুরে আমাদের সামাজিক কার্যক্রম, সাংস্কৃতিক উৎসব ও মাঠপর্যায়ের কাজের কিছু মুহূর্ত।'
              )}
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-full sm:w-auto">
            {['All', 'Landscape', 'Education', 'Environment', 'Culture', 'Sports'].map((cat) => (
              <button
                key={cat}
                onClick={() => setGalleryFilter(cat)}
                className={`px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  galleryFilter.toLowerCase() === cat.toLowerCase()
                    ? 'bg-white dark:bg-slate-700 text-slate-950 dark:text-emerald-300 shadow-xs font-bold'
                    : 'text-slate-800 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredGallery.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectGallery(item)}
              className="group relative rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-xl transition-all cursor-pointer bg-slate-100 dark:bg-slate-800 aspect-[4/3]"
            >
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-85 group-hover:opacity-95 transition-opacity flex flex-col justify-end p-4 sm:p-5 text-white">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                  {t(item.category, item.categoryBn)}
                </span>
                <h3 className="font-bold text-base text-white mt-0.5">
                  {t(item.title, item.titleBn)}
                </h3>
                <div className="flex items-center justify-between text-xs text-slate-200 mt-2">
                  <span>{item.date}</span>
                  <span className="flex items-center gap-1 text-emerald-300 font-semibold group-hover:translate-x-1 transition-transform">
                    <Eye className="w-3.5 h-3.5" />
                    <span>{t('View Photo', 'ছবি দেখুন')}</span>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. Join Banner */}
      <section className="bg-white/45 dark:bg-slate-900 text-slate-950 dark:text-white py-12 sm:py-16 border-y border-emerald-900/10 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass-card flex flex-col md:flex-row items-start md:items-center justify-between gap-6 sm:gap-8 bg-white/85 dark:bg-slate-800/80 border border-white/50 dark:border-slate-700 rounded-3xl p-6 sm:p-12">
            <div className="space-y-3 max-w-xl">
              <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-900 dark:text-emerald-300">
                {t('YOUR VILLAGE. YOUR FUTURE.', 'তোমার গ্রাম। তোমার ভবিষ্যৎ।')}
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white">
                {t('Be part of something good.', 'ভালো কিছুর অংশ হয়ে ওঠো।')}
              </h2>
              <p className="text-slate-900 dark:text-slate-300 text-sm leading-relaxed">
                {t(
                  'Have an idea, a skill, or just a little spare time to give? Whether you are a student, teacher, or worker, Salmikkhang welcomes your enthusiasm.',
                  'তোমার কোনো ধারণা, বিশেষ দক্ষতা বা সমাজসেবার ইচ্ছা থাকলে নির্দ্বিধায় যুক্ত হও। ছাত্র, শিক্ষক বা তরুণ পেশাজীবী—সবার জন্য সালমিকখাং উন্মুক্ত।'
                )}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 shrink-0 w-full md:w-auto">
              <button
                onClick={() => openModal('join')}
                className="w-full sm:w-auto px-6 py-3.5 bg-emerald-700 hover:bg-emerald-800 dark:bg-white text-white dark:text-emerald-950 font-bold text-sm rounded-xl dark:hover:bg-emerald-50 shadow-md transition-transform hover:-translate-y-0.5 text-center"
              >
                {t('Apply for Membership →', 'সদস্য হতে আবেদন করুন →')}
              </button>
              <a
                href="#contact"
                className="w-full sm:w-auto px-6 py-3.5 bg-white/85 hover:bg-white dark:bg-emerald-700 dark:hover:bg-emerald-600 text-slate-950 dark:text-white font-semibold text-sm rounded-xl border border-slate-300 dark:border-emerald-500/50 text-center transition-colors"
              >
                {t('Contact Organizers', 'আয়োজকদের সাথে যোগাযোগ')}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Working Contact Section */}
      <section id="contact" className="py-12 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">
          
          <div className="lg:col-span-5 space-y-6">
            <div>
              <span className="text-xs font-bold text-emerald-950 dark:text-emerald-400 uppercase tracking-wider block">
                {t("LET'S TALK & COLLABORATE", 'যোগাযোগ করি')}
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 dark:text-slate-100 mt-1">
                {t('Contact Salmikkhang', 'সালমিকখাং-এর সঙ্গে যোগাযোগ')}
              </h2>
              <p className="text-slate-800 dark:text-slate-300 text-sm mt-2 leading-relaxed">
                {t(
                  'Questions, ideas, or offers to collaborate on education, tree planting, or youth initiatives? We look forward to hearing from you.',
                  'শিক্ষা, বৃক্ষরোপণ কিংবা যুব কল্যাণমূলক কোনো বিষয়ে প্রশ্ন, পরামর্শ বা সহযোগিতার জন্য আয়োজকদের বার্তা পাঠান।'
                )}
              </p>
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3.5 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm text-slate-900 dark:text-slate-100">{t('Our Location', 'আমাদের অবস্থান')}</div>
                  <div className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">{settings.address}</div>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm text-slate-900 dark:text-slate-100">{t('Community Hotline', 'যোগাযোগের ফোন')}</div>
                  <div className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">{settings.phone}</div>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm text-slate-900 dark:text-slate-100">{t('Official Email', 'অফিসিয়াল ইমেইল')}</div>
                  <div className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">{settings.email}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Working Form */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-emerald-100 dark:border-slate-800 shadow-md">
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-1">
              {t('Send a Message to Youth Council', 'বার্তা পাঠান')}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              {t('Your message is received directly in the Community Admin inbox.', 'আপনার বার্তা সরাসরি কমিউনিটি অ্যাডমিন ইনবক্সে সংরক্ষিত হবে।')}
            </p>

            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  {t('Your Full Name *', 'আপনার পুরো নাম *')}
                </label>
                <input
                  type="text"
                  required
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder={t('e.g. Robin Marak', 'যেমন: রবিন মারাক')}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  {t('Phone or Email (Optional)', 'মোবাইল নম্বর বা ইমেইল (ঐচ্ছিক)')}
                </label>
                <input
                  type="text"
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                  placeholder={t('+880 17... or you@example.com', 'ফোন নম্বর বা ইমেইল')}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  {t('Your Message or Idea *', 'আপনার বার্তা বা প্রস্তাব *')}
                </label>
                <textarea
                  required
                  rows={4}
                  value={contactMsg}
                  onChange={(e) => setContactMsg(e.target.value)}
                  placeholder={t('How can we work together for the village?', 'আমরা কীভাবে গ্রামের কল্যাণে একসাথে কাজ করতে পারি?')}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={submittingContact}
                className="w-full sm:w-auto px-6 py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <Send className="w-4 h-4" />
                <span>{submittingContact ? t('Sending...', 'পাঠানো হচ্ছে...') : t('Send Message →', 'বার্তা পাঠান →')}</span>
              </button>
            </form>
          </div>

        </div>
      </section>

      {/* 9. Site Footer */}
      <footer className="glass-surface bg-white/85 dark:bg-slate-900 text-slate-900 dark:text-slate-300 py-16 border-t border-white/50 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="space-y-4 sm:col-span-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center p-1.5">
                  <svg viewBox="0 0 48 48" fill="none" className="w-full h-full text-white">
                    <path d="M4 38 17 19l7 10 7-14 13 23H4Z" stroke="currentColor" strokeWidth="2.8" strokeLinejoin="round"/>
                    <path d="m10 38 8-11 7 11M27 38l5-8 7 8" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round"/>
                    <circle cx="35" cy="9" r="4" stroke="currentColor" strokeWidth="2.4"/>
                  </svg>
                </div>
                <div className="font-extrabold text-slate-950 dark:text-white text-base tracking-tight">
                  SALMIKKHANG
                </div>
              </div>
              <p className="text-xs text-slate-900 dark:text-slate-300 leading-relaxed max-w-sm">
                {t(
                  'Dedicated grassroots youth organization in Gaira, Jolchotro, Madhupur, Tangail. Working for education, ecology, culture, and community solidarity.',
                  'গাইরা, জলছত্র, মধুপুর, টাঙ্গাইলের তরুণদের স্বেচ্ছাসেবী সংগঠন। শিক্ষা, পরিবেশ, সংস্কৃতি ও সামাজিক ঐক্যের সেবায়।'
                )}
              </p>
              <div className="text-xs text-emerald-900 dark:text-emerald-400 font-serif italic font-semibold">
                {t('“Small steps, big changes.”', '“ছোট পদক্ষেপ, বড় পরিবর্তন।”')}
              </div>
            </div>

            <div>
              <div className="font-bold text-slate-950 dark:text-white text-xs uppercase tracking-wider mb-4">
                {t('Quick Sections', 'দ্রুত লিঙ্ক')}
              </div>
              <ul className="space-y-2 text-xs text-slate-900 dark:text-slate-300">
                <li><a href="#about" className="hover:text-emerald-800 dark:hover:text-emerald-400 transition-colors">{t('About Community', 'আমাদের কথা')}</a></li>
                <li><a href="#events" className="hover:text-emerald-800 dark:hover:text-emerald-400 transition-colors">{t('Events & RSVP', 'আসন্ন আয়োজন')}</a></li>
                <li><a href="#projects" className="hover:text-emerald-800 dark:hover:text-emerald-400 transition-colors">{t('Village Projects', 'উদ্যোগসমূহ')}</a></li>
                <li><a href="#gallery" className="hover:text-emerald-800 dark:hover:text-emerald-400 transition-colors">{t('Photo Gallery', 'ফটো অ্যালবাম')}</a></li>
                <li><a href="#contact" className="hover:text-emerald-800 dark:hover:text-emerald-400 transition-colors">{t('Contact Organizers', 'যোগাযোগ')}</a></li>
              </ul>
            </div>

            <div>
              <div className="font-bold text-slate-950 dark:text-white text-xs uppercase tracking-wider mb-4">
                {t('Community Access', 'কমিউনিটি এক্সেস')}
              </div>
              <ul className="space-y-2 text-xs text-slate-900 dark:text-slate-300">
                <li>
                  <button onClick={() => openModal('join')} className="hover:text-emerald-800 dark:hover:text-emerald-400 text-left">
                    {t('Apply for Membership', 'সদস্যপদ আবেদন')}
                  </button>
                </li>
                <li>
                  <button onClick={() => openModal('login')} className="hover:text-emerald-800 dark:hover:text-emerald-400 text-left">
                    {t('Member Portal Login', 'সদস্য পোর্টাল লগইন')}
                  </button>
                </li>
                <li className="pt-2 text-[11px] text-slate-800 dark:text-slate-400">
                  {settings.address}
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-800 dark:text-slate-400 gap-4">
            <div>
              © {new Date().getFullYear()} {settings.name}. {t('All rights reserved.', 'সর্বস্বত্ব সংরক্ষিত।')}
            </div>
            <div>
              Gaira, Jolchotro · Madhupur, Tangail, Bangladesh
            </div>
          </div>

        </div>
      </footer>
    </div>
  );
};
