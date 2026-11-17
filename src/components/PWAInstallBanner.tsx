import React, { useEffect, useState } from 'react';
import {
  Download,
  Smartphone,
  Laptop,
  Share2,
  Copy,
  Check,
  X,
  WifiOff,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';
import { useCommunity } from '../context/CommunityContext';
import { usePWAInstall, useOnlineStatus } from '../hooks/usePWAInstall';
import logoImg from '../assets/images/logo.png';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({ isOpen, onClose }) => {
  const { t, showToast } = useCommunity();
  const { isInstallable, isInstalled, isIOS, isMobile, install } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<'android' | 'ios' | 'desktop'>(() => {
    if (typeof navigator !== 'undefined') {
      const ua = navigator.userAgent.toLowerCase();
      if (/iphone|ipad|ipod/.test(ua)) return 'ios';
      if (/android/.test(ua)) return 'android';
    }
    return 'desktop';
  });
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
    typeof window !== 'undefined' ? `${window.location.origin}/` : 'https://salmikkhang.app/';

  const handleDirectInstall = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (accepted) {
        showToast(
          t(
            'Salmikkhang shortcut added! You can now launch it directly from your Home Screen or Desktop.',
            'সালমিকখাং শর্টকাট যোগ হয়েছে! এখন হোম স্ক্রিন বা ডেস্কটপ থেকেই সরাসরি চালু করতে পারবেন।'
          ),
          'success'
        );
        onClose();
      }
      return;
    }
    setActiveTab(isIOS ? 'ios' : isMobile ? 'android' : 'desktop');
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(appUrl);
      setCopied(true);
      showToast(t('Website link copied!', 'ওয়েবসাইটের লিঙ্ক কপি হয়েছে!'), 'success');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      showToast(t('Copy failed. Please copy from address bar.', 'কপি করা যায়নি, ব্রাউজার বার থেকে কপি করুন।'), 'warning');
    }
  };

  const handleDownloadDesktopShortcut = () => {
    const content = `[InternetShortcut]\r\nURL=${appUrl}\r\n`;
    const blob = new Blob([content], { type: 'application/internet-shortcut' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Salmikkhang Community.url';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast(
      t(
        'Desktop shortcut file downloaded! Double-click it anytime on Windows PC/Laptop.',
        'ডেস্কটপ শর্টকাট ফাইল ডাউনলোড হয়েছে! পিসি/ল্যাপটপ থেকে ডাবল-ক্লিক করেই সরাসরি খুলুন।'
      ),
      'success'
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 my-auto animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={logoImg}
              alt="Salmikkhang App Icon"
              className="w-10 h-10 rounded-xl bg-emerald-950 p-1 object-contain shrink-0"
            />
            <div className="min-w-0">
              <h3 className="font-display font-extrabold text-base text-slate-950 dark:text-white">
                {t('Direct Access & Home Screen Shortcut', 'সরাসরি ব্রাউজ ও হোম স্ক্রিন শর্টকাট')}
              </h3>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                {t('Save on Phone, Laptop & Desktop PC', 'ফোন, ল্যাপটপ ও ডেস্কটপ পিসিতে শর্টকাট রাখুন')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isInstalled && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2 text-xs font-semibold text-emerald-900 dark:text-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>
              {t(
                'App shortcut is active! You are viewing Salmikkhang in standalone app mode.',
                'অ্যাপ শর্টকাট সক্রিয় আছে! আপনি এখন অ্যাপ মোডে ওয়েবসাইটটি ব্যবহার করছেন।'
              )}
            </span>
          </div>
        )}

        {!isInstalled && isInstallable && (
          <button
            type="button"
            onClick={() => void handleDirectInstall()}
            className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{t('Install App / Add Shortcut (1-Click)', 'এখনই ইনস্টল ও শর্টকাট যোগ করুন (১ ক্লিকে)')}</span>
          </button>
        )}

        {/* Device Switcher Tabs */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('android')}
            className={`py-2 px-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'android'
                ? 'bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Android</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ios')}
            className={`py-2 px-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'ios'
                ? 'bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>iPhone / iPad</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('desktop')}
            className={`py-2 px-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'desktop'
                ? 'bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>{t('PC / Laptop', 'পিসি / ল্যাপটপ')}</span>
          </button>
        </div>

        {activeTab === 'android' && (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
            <div className="font-bold text-emerald-900 dark:text-emerald-300">
              {t('Android Phone (Chrome / Edge)', 'অ্যান্ড্রয়েড ফোন (Chrome / Edge ব্রাউজার)')}
            </div>
            <ol className="list-decimal pl-4 space-y-1.5">
              <li>{t('Open this website in Google Chrome.', 'Google Chrome ব্রাউজারে এই ওয়েবসাইটটি খুলুন।')}</li>
              <li>
                {t(
                  'Tap the top-right ⋮ menu button.',
                  'উপরের ডান কোণায় থাকা ⋮ (তিন ডট) মেনুতে ট্যাপ করুন।'
                )}
              </li>
              <li>
                {t(
                  'Select "Add to Home screen" → "Install" (or "Create shortcut").',
                  '"Add to Home screen" অথবা "Install app" সিলেক্ট করে যোগ করুন।'
                )}
              </li>
            </ol>
          </div>
        )}

        {activeTab === 'ios' && (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
            <div className="font-bold text-emerald-900 dark:text-emerald-300">
              {t('iPhone & iPad (Safari Browser)', 'আইফোন ও আইপ্যাড (Safari ব্রাউজার)')}
            </div>
            <ol className="list-decimal pl-4 space-y-1.5">
              <li>{t('Open this website in Safari.', 'Safari ব্রাউজারে এই ওয়েবসাইটটি খুলুন।')}</li>
              <li>
                {t(
                  'Tap the Share icon (square with an upward arrow) at the bottom/top toolbar.',
                  'নিচের বা উপরের টুলবার থেকে Share আইকনে (উপরমুখী তীর চিহ্ন) ট্যাপ করুন।'
                )}
              </li>
              <li>
                {t(
                  'Scroll down and tap "Add to Home Screen", then tap "Add".',
                  'নিচে স্ক্রল করে "Add to Home Screen" সিলেক্ট করে "Add" চাপুন।'
                )}
              </li>
            </ol>
          </div>
        )}

        {activeTab === 'desktop' && (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
            <div className="font-bold text-emerald-900 dark:text-emerald-300">
              {t('Windows PC, Mac & Laptop (Chrome / Edge)', 'উইন্ডোজ পিসি, ম্যাক ও ল্যাপটপ (Chrome / Edge)')}
            </div>
            <ol className="list-decimal pl-4 space-y-1.5">
              <li>
                {t(
                  'Click the Install app icon on the right side of the browser address bar, OR open ⋮ Menu → Cast, save, and share → Install page as app / Create shortcut.',
                  'ব্রাউজার অ্যাড্রেস বারের ডানদিকে Install আইকনে ক্লিক করুন, অথবা ⋮ মেনু → Cast, save, and share → Create shortcut / Install page as app ব্যবহার করুন।'
                )}
              </li>
              <li>
                {t(
                  'Or download the Windows Desktop Shortcut file below and keep it directly on your Desktop.',
                  'অথবা নিচের বাটন থেকে সরাসরি ডেস্কটপ শর্টকাট (.url) ডাউনলোড করে পিসি স্ক্রিনে রাখতে পারেন।'
                )}
              </li>
            </ol>
          </div>
        )}

        {/* Direct Utilities: Windows .url shortcut & Copy Direct URL */}
        <div className="grid sm:grid-cols-2 gap-2.5 pt-1">
          <button
            type="button"
            onClick={handleDownloadDesktopShortcut}
            className="w-full py-2.5 px-3 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>{t('Download PC Shortcut (.url)', 'পিসি শর্টকাট ডাউনলোড (.url)')}</span>
          </button>

          <button
            type="button"
            onClick={() => void handleCopyUrl()}
            className="w-full py-2.5 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
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
