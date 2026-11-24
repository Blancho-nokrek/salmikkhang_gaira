import React, { useEffect, useState } from 'react';
import {
  Download,
  Copy,
  Check,
  X,
  WifiOff,
  ExternalLink,
  CheckCircle2,
  BellRing,
} from 'lucide-react';
import { useCommunity } from '../context/CommunityContext';
import { usePWAInstall, useOnlineStatus } from '../hooks/usePWAInstall';
import logoImg from '../assets/images/logo.png';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({ isOpen, onClose }) => {
  const {
    t,
    showToast,
    deviceAlertsEnabled,
    deviceNotificationPermission,
    enableDeviceAlerts,
    disableDeviceAlerts,
  } = useCommunity();
  const { isInstallable, isInstalled, inIframe, install } = usePWAInstall();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const appUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/` : 'https://salmikkhang.vercel.app/';

  const handleDirectInstall = async () => {
    if (!isInstallable) return;
    const outcome = await install();
    if (outcome === 'accepted') {
      showToast(
        t(
          'Salmikkhang app installed! You can now launch it directly from your Home Screen or Desktop.',
          'সালমিকখাং অ্যাপ ইনস্টল হয়েছে! এখন হোম স্ক্রিন বা ডেস্কটপ থেকেই সরাসরি চালু করতে পারবেন।'
        ),
        'success'
      );
      onClose();
    } else if (outcome === 'dismissed') {
      onClose();
    }
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(appUrl);
      setCopied(true);
      showToast(t('Website link copied!', 'ওয়েবসাইটের লিঙ্ক কপি হয়েছে!'), 'success');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      showToast(
        t('Copy failed. Please copy from address bar.', 'কপি করা যায়নি, ব্রাউজার বার থেকে কপি করুন।'),
        'warning'
      );
    }
  };

  return (
    <div
      className="backdrop-enter fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-enter bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 my-auto">
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={logoImg}
              alt="Salmikkhang App Icon"
              className="w-10 h-10 rounded-xl bg-emerald-950 p-1 object-contain shrink-0"
            />
            <div className="min-w-0">
              <h3 className="font-display font-extrabold text-base text-slate-950 dark:text-white">
                {t('Install Salmikkhang App', 'সালমিকখাং অ্যাপ ডাউনলোড ও ইনস্টল')}
              </h3>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                {t('Direct app access on Phone, Laptop & PC', 'ফোন, ল্যাপটপ ও ডেস্কটপ পিসিতে সরাসরি ব্যবহার করুন')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer shrink-0"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isInstalled && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2.5 text-xs font-semibold text-emerald-900 dark:text-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>
              {t(
                'App is already installed! You can launch Salmikkhang anytime from your Home Screen or Desktop.',
                'অ্যাপটি ইতিমধ্যেই ইনস্টল করা আছে! হোম স্ক্রিন বা ডেস্কটপ থেকেই সরাসরি চালু করতে পারবেন।'
              )}
            </span>
          </div>
        )}

        <div className="space-y-2.5">
          {!isInstalled && isInstallable && (
            <button
              type="button"
              onClick={() => void handleDirectInstall()}
              className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{t('Install App Now (1-Click)', 'এখনই ইনস্টল করুন (১ ক্লিকে)')}</span>
            </button>
          )}

          {!isInstalled && !isInstallable && inIframe && (
            <a
              href={appUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span>{t('Open in Browser Tab to Install', 'ইনস্টল করতে নতুন ট্যাবে খুলুন')}</span>
            </a>
          )}

          <button
            type="button"
            onClick={() => {
              if (deviceAlertsEnabled && deviceNotificationPermission === 'granted') {
                disableDeviceAlerts();
              } else {
                void enableDeviceAlerts();
              }
            }}
            className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer border ${
              deviceAlertsEnabled && deviceNotificationPermission === 'granted'
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700'
                : 'bg-slate-900 dark:bg-emerald-800 hover:bg-slate-800 dark:hover:bg-emerald-700 text-white border-transparent'
            }`}
          >
            <BellRing className="w-3.5 h-3.5" />
            <span>
              {deviceAlertsEnabled && deviceNotificationPermission === 'granted'
                ? t('Phone Background Alerts Active', 'ফোন ব্যাকগ্রাউন্ড নোটিফিকেশন চালু আছে')
                : t('Enable Phone Background Alerts', 'ফোন ব্যাকগ্রাউন্ড নোটিফিকেশন চালু করুন')}
            </span>
          </button>

          <button
            type="button"
            onClick={() => void handleCopyUrl()}
            className="w-full py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? t('Link Copied', 'কপি হয়েছে') : t('Copy Website Link', 'লিঙ্ক কপি করুন')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  const { t } = useCommunity();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-900/95 border border-amber-500/40 px-3.5 py-2 text-xs font-semibold text-amber-100 shadow-lg backdrop-blur-md">
      <WifiOff className="w-3.5 h-3.5 text-amber-300 shrink-0" />
      <span>
        {t(
          'Offline Mode — Viewing cached community data.',
          'অফলাইন মোড — সংরক্ষিত তথ্য দেখানো হচ্ছে।'
        )}
      </span>
    </div>
  );
};
