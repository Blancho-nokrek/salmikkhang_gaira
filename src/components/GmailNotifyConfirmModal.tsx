import React, { useEffect, useMemo, useState } from 'react';
import {
  Mail,
  Send,
  X,
  CheckCircle2,
  AlertTriangle,
  Users,
  Plus,
  Lock,
  Globe,
} from 'lucide-react';
import { useCommunity } from '../context/CommunityContext';
import {
  buildDefaultSubject,
  collectNotificationRecipients,
  DEFAULT_GMAIL_SENDER,
  normalizeEmail,
} from '../lib/gmailNotifications';
import { GoogleSignInButton } from './GoogleSignInButton';

export const GmailNotifyConfirmModal: React.FC = () => {
  const {
    t,
    members,
    messages,
    joinRequests,
    gmailSession,
    gmailConnecting,
    connectGmailForAlerts,
    pendingGmailDraft,
    dismissGmailNotification,
    confirmAndSendGmailNotification,
  } = useCommunity();

  const [subject, setSubject] = useState('');
  const [customNote, setCustomNote] = useState('');
  const [extraEmailsInput, setExtraEmailsInput] = useState('');
  const [extraEmails, setExtraEmails] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!pendingGmailDraft) return;
    setSubject(buildDefaultSubject(pendingGmailDraft));
    setCustomNote('');
    setExtraEmailsInput('');
    setExtraEmails([]);
    setErrorMsg(null);
  }, [pendingGmailDraft]);

  useEffect(() => {
    if (!pendingGmailDraft) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !sending) dismissGmailNotification();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [pendingGmailDraft, sending, dismissGmailNotification]);

  const recipientInfo = useMemo(() => {
    if (!pendingGmailDraft) {
      return { allEmails: [], memberEmails: [], subscriberEmails: [] };
    }
    return collectNotificationRecipients({
      members,
      messages,
      joinRequests,
      visibility: pendingGmailDraft.visibility,
      extraEmails,
      excludeSenderEmail: gmailSession.email || DEFAULT_GMAIL_SENDER,
    });
  }, [pendingGmailDraft, members, messages, joinRequests, extraEmails, gmailSession.email]);

  if (!pendingGmailDraft) return null;

  const handleAddExtraEmail = () => {
    const parts = extraEmailsInput
      .split(/[\s,;]+/)
      .map((s) => normalizeEmail(s))
      .filter((e): e is string => Boolean(e));
    if (parts.length === 0) {
      setErrorMsg(t('Enter a valid Gmail/email address to add.', 'সঠিক একটি Gmail বা ইমেইল ঠিকানা লিখুন।'));
      return;
    }
    setErrorMsg(null);
    setExtraEmails((prev) => Array.from(new Set([...prev, ...parts])));
    setExtraEmailsInput('');
  };

  const handleConfirmSend = async () => {
    setErrorMsg(null);
    if (!gmailSession.connected) {
      setErrorMsg(
        t(
          `Please connect ${DEFAULT_GMAIL_SENDER} first before sending Gmail alerts.`,
          `ইমেইল পাঠানোর আগে প্রথমে ${DEFAULT_GMAIL_SENDER} সংযুক্ত করুন।`
        )
      );
      return;
    }
    if (recipientInfo.allEmails.length === 0) {
      setErrorMsg(
        t(
          'No recipient Gmail addresses found. Add at least one member or subscriber email.',
          'কোনো প্রাপকের Gmail পাওয়া যায়নি। অন্তত একটি ইমেইল যুক্ত করুন।'
        )
      );
      return;
    }

    setSending(true);
    try {
      const result = await confirmAndSendGmailNotification({
        draft: pendingGmailDraft,
        recipients: recipientInfo.allEmails,
        subject: subject.trim() || buildDefaultSubject(pendingGmailDraft),
        customNote: customNote.trim() || undefined,
      });
      if (result.sentCount > 0 && result.failedRecipients === 0) {
        dismissGmailNotification();
      } else if (result.errorMessage) {
        setErrorMsg(result.errorMessage);
      }
    } finally {
      setSending(false);
    }
  };

  const kindBadgeLabel =
    pendingGmailDraft.kind === 'notice'
      ? t('Notice', 'নোটিশ')
      : pendingGmailDraft.kind === 'event'
      ? t('Event', 'অনুষ্ঠান')
      : pendingGmailDraft.kind === 'project'
      ? t('Project', 'প্রকল্প')
      : t('News', 'সংবাদ');

  return (
    <div
      className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-start sm:items-center justify-center p-3 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="gmail-notify-confirm-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !sending) dismissGmailNotification();
      }}
    >
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl border border-emerald-200/80 dark:border-slate-700 space-y-4 my-auto max-h-[92dvh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Mail className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3
                id="gmail-notify-confirm-title"
                className="font-display font-extrabold text-base text-slate-950 dark:text-white"
              >
                {t('Confirm Gmail Notification Dispatch', 'সবার Gmail-এ নোটিফিকেশন পাঠান')}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {t(
                  `Send ${kindBadgeLabel} alert to all database member & logged-in emails via Gmail`,
                  `${kindBadgeLabel} আপলোড হয়েছে — ডেটাবেসে থাকা সবার ইমেইলে Gmail নোটিফিকেশন পাঠাবেন?`
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={sending}
            onClick={dismissGmailNotification}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer shrink-0"
            aria-label="Close Gmail notification dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sender Connection Status */}
        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 space-y-2.5">
          {gmailSession.connected ? (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {t('Sender:', 'প্রেরক:')} {gmailSession.email}
                </span>
              </div>
              {!gmailSession.isPreferredSender && (
                <button
                  type="button"
                  onClick={() => void connectGmailForAlerts(DEFAULT_GMAIL_SENDER)}
                  className="text-[11px] font-bold text-amber-700 dark:text-amber-300 underline cursor-pointer"
                >
                  {t(`Switch to ${DEFAULT_GMAIL_SENDER}`, `${DEFAULT_GMAIL_SENDER}-এ পরিবর্তন করুন`)}
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2.5">
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {t(
                  `Connect ${DEFAULT_GMAIL_SENDER} to send this notification directly to everyone's Gmail inbox.`,
                  `সবার Gmail ইনবক্সে নোটিফিকেশন পাঠাতে ${DEFAULT_GMAIL_SENDER} অ্যাকাউন্ট সংযুক্ত করুন।`
                )}
              </p>
              <GoogleSignInButton
                label={t(`Sign in with Google (${DEFAULT_GMAIL_SENDER})`, `${DEFAULT_GMAIL_SENDER} দিয়ে Google সংযুক্ত করুন`)}
                loading={gmailConnecting}
                onClick={() => void connectGmailForAlerts(DEFAULT_GMAIL_SENDER)}
                className="w-full"
              />
            </div>
          )}

          {gmailSession.connected && !gmailSession.isPreferredSender && (
            <div className="text-[11px] text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-xl px-3 py-2 flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>
                {t(
                  `Currently connected as ${gmailSession.email}. Switch if you want emails sent from ${DEFAULT_GMAIL_SENDER}.`,
                  `বর্তমানে ${gmailSession.email} সংযুক্ত আছে। ${DEFAULT_GMAIL_SENDER} থেকে পাঠাতে চাইলে অ্যাকাউন্ট পরিবর্তন করুন।`
                )}
              </span>
            </div>
          )}
        </div>

        {/* Recipients Summary */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100">
              <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>
                {t(
                  `Recipients (${recipientInfo.allEmails.length})`,
                  `প্রাপক (${recipientInfo.allEmails.length} জন)`
                )}
              </span>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
              {pendingGmailDraft.visibility === 'members_only' ? (
                <>
                  <Lock className="w-3 h-3 text-amber-600" />
                  {t('Active Members Only (Bcc)', 'শুধুমাত্র সক্রিয় সদস্য (Bcc)')}
                </>
              ) : (
                <>
                  <Globe className="w-3 h-3 text-emerald-600" />
                  {t(
                    `${recipientInfo.memberEmails.length} members · ${recipientInfo.subscriberEmails.length} other database emails (Bcc)`,
                    `${recipientInfo.memberEmails.length} সদস্য · ${recipientInfo.subscriberEmails.length} অন্যান্য ডেটাবেস ইমেইল (Bcc)`
                  )}
                </>
              )}
            </span>
          </div>

          {recipientInfo.allEmails.length > 0 ? (
            <div className="max-h-24 overflow-y-auto p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-[11px] font-mono text-slate-700 dark:text-slate-300 leading-relaxed break-all">
              {recipientInfo.allEmails.join(', ')}
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200">
              {t(
                'No member or subscriber Gmail addresses are listed yet. You can add recipient email(s) below.',
                'এখনো কোনো সদস্য বা সাবস্ক্রাইবারের Gmail যুক্ত নেই। নিচে প্রাপকের Gmail যোগ করতে পারেন।'
              )}
            </div>
          )}

          {/* Add Extra Recipient Email */}
          <div className="flex gap-2">
            <input
              type="text"
              value={extraEmailsInput}
              onChange={(e) => setExtraEmailsInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddExtraEmail();
                }
              }}
              placeholder={t('Add extra Gmail(s), comma separated...', 'অতিরিক্ত Gmail যোগ করুন (কমা দিয়ে)...')}
              aria-label={t('Add extra recipient emails', 'অতিরিক্ত প্রাপক ইমেইল')}
              className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100"
            />
            <button
              type="button"
              onClick={handleAddExtraEmail}
              className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 text-xs font-bold inline-flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              {t('Add', 'যোগ')}
            </button>
          </div>
        </div>

        {/* Email Subject & Preview */}
        <div className="space-y-2.5 text-xs">
          <div>
            <label
              htmlFor="gmail-confirm-subject"
              className="block font-bold text-slate-700 dark:text-slate-300 mb-1"
            >
              {t('Email Subject', 'ইমেইলের বিষয়')}
            </label>
            <input
              id="gmail-confirm-subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-800/60 space-y-1">
            <div className="font-bold text-slate-950 dark:text-white">{pendingGmailDraft.titleEn}</div>
            {pendingGmailDraft.titleBn && pendingGmailDraft.titleBn !== pendingGmailDraft.titleEn && (
              <div className="font-semibold text-emerald-900 dark:text-emerald-300">
                {pendingGmailDraft.titleBn}
              </div>
            )}
            {pendingGmailDraft.metaLine && (
              <div className="text-[11px] font-medium text-emerald-800 dark:text-emerald-400">
                {pendingGmailDraft.metaLine}
              </div>
            )}
            {pendingGmailDraft.summaryEn && (
              <p className="text-[11px] text-slate-700 dark:text-slate-300 line-clamp-3 pt-1">
                {pendingGmailDraft.summaryEn}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="gmail-confirm-note"
              className="block font-bold text-slate-700 dark:text-slate-300 mb-1"
            >
              {t('Optional Personal Note', 'অতিরিক্ত বার্তা (ঐচ্ছিক)')}
            </label>
            <input
              id="gmail-confirm-note"
              type="text"
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder={t('e.g., Please attend on time.', 'যেমন: অনুগ্রহ করে সময়মতো উপস্থিত থাকুন।')}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs font-semibold text-rose-800 dark:text-rose-200">
            {errorMsg}
          </div>
        )}

        {/* Confirmation Actions */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
          <button
            type="button"
            disabled={sending}
            onClick={dismissGmailNotification}
            className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs cursor-pointer"
          >
            {t('Cancel / Skip Email', 'বাতিল করুন')}
          </button>
          <button
            type="button"
            disabled={sending || !gmailSession.connected || recipientInfo.allEmails.length === 0}
            onClick={() => void handleConfirmSend()}
            className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs inline-flex items-center justify-center gap-2 shadow-sm cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>
              {sending
                ? t('Sending via Gmail...', 'Gmail-এ পাঠানো হচ্ছে...')
                : t(
                    `Confirm & Send Gmail Alert (${recipientInfo.allEmails.length})`,
                    `নিশ্চিত করে Gmail পাঠান (${recipientInfo.allEmails.length} জন)`
                  )}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
