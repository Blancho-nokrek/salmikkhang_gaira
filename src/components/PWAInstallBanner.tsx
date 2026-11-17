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
  Info,
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
  const { isInstallable, isInstalled, isIOS, isMobile, inIframe, install } = usePWAInstall();
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
    typeof window !== 'undefined' ? `${window.location.origin}/` : 'https://salmikkhang.vercel.app/';

  const handleDirectInstall = async () => {
    if (isInstallable) {
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
      showToast(
        t('Copy failed. Please copy from address bar.', 'কপি করা যায়নি, ব্রাউজার বার থেকে কপি করুন।'),
        'warning'
      );
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
                'App is already installed! You can launch Salmikkhang anytime from your Home Screen or Desktop.',
                'অ্যাপটি ইতিমধ্যেই ইনস্টল করা আছে! হোম স্ক্রিন বা ডেস্কটপ থেকেই সরাসরি চালু করতে পারবেন।'
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
            <span>{t('Install App Now (1-Click)', 'এখনই ইনস্টল করুন (১ ক্লিকে)')}</span>
          </button>
        )}

        {!isInstalled && !isInstallable && inIframe && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/70 space-y-2.5">
            <div className="flex items-start gap-2 text-xs text-emerald-950 dark:text-emerald-200 leading-relaxed">
              <Info className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
              <span>
                {t(
                  'Inside an embedded preview frame, browsers block the 1-click "Install app" popup. Open this page in a direct browser tab to install in 1 click!',
                  'প্রিভিউ ফ্রেমের ভেতর ব্রাউজার ১-ক্লিক ইনস্টল পপআপ ব্লক করে রাখে। সরাসরি ব্রাউজার ট্যাবে খুলে ডাউনলোডে ক্লিক করলেই ১-ক্লিকে ইনস্টল পপআপ আসবে।'
                )}
              </span>
            </div>
            <a
              href={appUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm"
            >
              <ExternalLink className="w-4 h-4" />
              <span>{t('Open in Browser Tab to Install', 'ইনস্টল করতে নতুন ট্যাবে খুলুন')}</span>
            </a>
          </div>
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
              {t('Android Phone (Chrome / Brave / Edge)', 'অ্যান্ড্রয়েড ফোন (Chrome / Brave / Edge)')}
            </div>
            <ol className="list-decimal pl-4 space-y-1.5">
              <li>
                {t(
                  'Tap Download in the menu to trigger the 1-click "Install app" popup automatically.',
                  'মেনু থেকে ডাউনলোডে ট্যাপ করলেই সরাসরি "Install app" পপআপ আসবে।'
                )}
              </li>
              <li>
                {t(
                  'If the popup was dismissed earlier, tap the top-right ⋮ menu → "Install app" or "Add to Home screen".',
                  'যদি আগে বাতিল করে থাকেন বা না আসে, উপরে ডানদিকে ⋮ মেনু → "Install app" বা "Add to Home screen" চাপুন।'
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
              {t('Windows PC, Mac & Laptop (Brave / Chrome / Edge)', 'উইন্ডোজ পিসি, ম্যাক ও ল্যাপটপ (Brave / Chrome / Edge)')}
            </div>
            <ol className="list-decimal pl-4 space-y-1.5">
              <li>
                {t(
                  'Click the Install icon (screen with downward arrow) on the right side of the browser address bar to open the "Install app" dialog.',
                  'ব্রাউজার অ্যাড্রেস বারের ডানদিকে থাকা Install আইকনে ক্লিক করলেই সরাসরি "Install app" পপআপ আসবে।'
                )}
              </li>
              <li>
                {t(
                  'Or open the browser menu (☰ / ⋮) → Cast, save, and share → Install page as app.',
                  'অথবা ব্রাউজার মেনু (☰ / ⋮) → Cast, save, and share → Install page as app ব্যবহার করুন।'
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
            <span>{t('PC Shortcut (.url)', 'পিসি শর্টকাট (.url)')}</span>
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
