import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Mail,
  Send,
  Users,
  LogOut,
} from 'lucide-react';
import { useCommunity } from '../context/CommunityContext';
import {
  collectNotificationRecipients,
  DEFAULT_GMAIL_SENDER,
} from '../lib/gmailNotifications';
import { GoogleSignInButton } from './GoogleSignInButton';

/**
 * Admin Settings Card for connecting salmikkhang@gmail.com, reviewing all
 * database emails (registered & logged-in accounts), and sending custom
 * Gmail notifications (always opens the confirmation dialog).
 */
export const AdminGmailSettingsCard: React.FC<{ readOnly?: boolean }> = ({ readOnly = false }) => {
  const {
    t,
    members,
    messages,
    joinRequests,
    gmailSession,
    gmailConnecting,
    connectGmailForAlerts,
    disconnectGmailForAlerts,
    requestGmailNotification,
  } = useCommunity();

  const [quickTitle, setQuickTitle] = useState('');
  const [quickBody, setQuickBody] = useState('');

  const recipients = useMemo(
    () =>
      collectNotificationRecipients({
        members,
        messages,
        joinRequests,
        visibility: 'public',
        excludeSenderEmail: gmailSession.email || DEFAULT_GMAIL_SENDER,
      }),
    [members, messages, joinRequests, gmailSession.email]
  );

  const handleOpenQuickBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;
    const appUrl =
      typeof window !== 'undefined' ? `${window.location.origin}/` : 'https://salmikkhang.vercel.app/';
    requestGmailNotification({
      kind: 'notice',
      visibility: 'public',
      titleEn: quickTitle.trim(),
      summaryEn: quickBody.trim(),
      date: new Date().toISOString().split('T')[0],
      metaLine: `Notice · ${new Date().toISOString().split('T')[0]}`,
      appUrl,
    });
    setQuickTitle('');
    setQuickBody('');
  };

  return (
    <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-extrabold text-base text-slate-950 dark:text-slate-100 flex items-center gap-2">
            <Mail className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
            <span>{t('Database Gmail Notification Center', 'ডেটাবেস Gmail নোটিফিকেশন সিস্টেম')}</span>
          </h3>
          <p className="text-xs text-slate-700 dark:text-slate-400 mt-0.5">
            {t(
              `Connect ${DEFAULT_GMAIL_SENDER} to email all registered & logged-in database accounts whenever Admin uploads News, Events, or Projects.`,
              `অ্যাডমিন নতুন নিউজ, ইভেন্ট বা প্রজেক্ট আপলোড করলেই ডেটাবেসে থাকা সবার ইমেইলে নোটিফিকেশন পাঠাতে ${DEFAULT_GMAIL_SENDER} সংযুক্ত করুন।`
            )}
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-900 dark:text-emerald-200">
          <Users className="w-3.5 h-3.5" />
          <span>
            {t(
              `${recipients.allEmails.length} Database Emails Ready`,
              `ডেটাবেসে মোট ${recipients.allEmails.length}টি ইমেইল`
            )}
          </span>
        </div>
      </div>

      {/* Sender Account Box */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="text-xs font-bold text-slate-950 dark:text-white flex items-center gap-2">
            {gmailSession.connected ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>
                  {t('Connected Gmail Sender:', 'সংযুক্ত Gmail প্রেরক:')} {gmailSession.email}
                </span>
              </>
            ) : (
              <span>
                {t(
                  `Sender Gmail not connected (${DEFAULT_GMAIL_SENDER})`,
                  `প্রেরক Gmail এখনো সংযুক্ত হয়নি (${DEFAULT_GMAIL_SENDER})`
                )}
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400">
            {t(
              'Whenever News, Events, or Projects are uploaded, you will confirm before sending to all database emails.',
              'যেকোনো নিউজ, ইভেন্ট বা প্রজেক্ট আপলোডের পর ডেটাবেসের সব ইমেইলে পাঠানোর আগে আপনাকে কনফার্ম করতে বলা হবে।'
            )}
          </p>
        </div>

        {!readOnly && (
          <div className="flex flex-wrap items-center gap-2">
            {gmailSession.connected ? (
              <>
                {!gmailSession.isPreferredSender && (
                  <GoogleSignInButton
                    label={t(`Switch to ${DEFAULT_GMAIL_SENDER}`, `${DEFAULT_GMAIL_SENDER}-এ পরিবর্তন`)}
                    loading={gmailConnecting}
                    onClick={() => void connectGmailForAlerts(DEFAULT_GMAIL_SENDER)}
                  />
                )}
                <button
                  type="button"
                  onClick={() => void disconnectGmailForAlerts()}
                  className="px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{t('Disconnect', 'বিচ্ছিন্ন করুন')}</span>
                </button>
              </>
            ) : (
              <GoogleSignInButton
                label={t(`Sign in with Google (${DEFAULT_GMAIL_SENDER})`, `${DEFAULT_GMAIL_SENDER} সংযুক্ত করুন`)}
                loading={gmailConnecting}
                onClick={() => void connectGmailForAlerts(DEFAULT_GMAIL_SENDER)}
              />
            )}
          </div>
        )}
      </div>

      {/* Quick Custom Broadcast Form */}
      {!readOnly && (
        <form
          onSubmit={handleOpenQuickBroadcast}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-3 text-xs"
        >
          <div className="font-bold text-slate-950 dark:text-white">
            {t('Send Instant Notice to All Database Emails', 'ডেটাবেসের সবার ইমেইলে দ্রুত নোটিশ পাঠান')}
          </div>
          <input
            type="text"
            required
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            placeholder={t('Announcement title (English or বাংলা)...', 'নোটিশের শিরোনাম লিখুন...')}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
          />
          <textarea
            rows={2}
            value={quickBody}
            onChange={(e) => setQuickBody(e.target.value)}
            placeholder={t('Short message details...', 'বিস্তারিত বার্তা লিখুন...')}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{t('Review & Send via Gmail', 'রিভিউ করে Gmail পাঠান')}</span>
          </button>
        </form>
      )}

      {/* Database Recipient Emails Preview */}
      <div className="space-y-2">
        <div className="text-xs font-bold text-slate-800 dark:text-slate-300">
          {t(
            `Active Member Emails (${recipients.memberEmails.length}) · Other Database Emails (${recipients.subscriberEmails.length})`,
            `সক্রিয় সদস্যদের ইমেইল (${recipients.memberEmails.length}) · অন্যান্য লগইন/আবেদনকারী ইমেইল (${recipients.subscriberEmails.length})`
          )}
        </div>
        {recipients.allEmails.length === 0 ? (
          <p className="text-xs text-slate-600 dark:text-slate-400">
            {t(
              'No member emails found in the database yet. Register members or approve join requests to populate recipients.',
              'ডেটাবেসে এখনো কোনো সদস্যের ইমেইল পাওয়া যায়নি। নতুন সদস্য নিবন্ধন করলে অটোমেটিক এখানে যুক্ত হবে।'
            )}
          </p>
        ) : (
          <div className="max-h-32 overflow-y-auto p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[11px] font-mono text-slate-700 dark:text-slate-300 leading-relaxed break-all">
            {recipients.allEmails.join(', ')}
          </div>
        )}
      </div>
    </div>
  );
};
