import React, { useState } from 'react';
import { Upload, RotateCcw } from 'lucide-react';
import { useCommunity } from '../context/CommunityContext';
import { compressImage } from '../lib/imageUpload';
import defaultHero from '../assets/images/hero_community_landscape_1794424784970.jpg';
import defaultSite from '../assets/images/nature_glass_bg_1794467445710.jpg';

type Key = 'heroBackground' | 'siteBackground';

interface BackgroundSettingsProps {
  readOnly?: boolean;
}

export const BackgroundSettings: React.FC<BackgroundSettingsProps> = ({ readOnly = false }) => {
  const { t, settings, updateSettings, showToast } = useCommunity();
  const [busy, setBusy] = useState<Key | null>(null);

  const fields: { key: Key; fallback: string; title: string; desc: string }[] = [
    {
      key: 'heroBackground',
      fallback: defaultHero,
      title: t('Home Page Banner Background', 'হোম পেজ ব্যানার ব্যাকগ্রাউন্ড'),
      desc: t('The picture behind the big title at the top of the home page.', 'হোম পেজের উপরের বড় শিরোনামের পেছনের ছবি।'),
    },
    {
      key: 'siteBackground',
      fallback: defaultSite,
      title: t('Whole Website Background', 'পুরো ওয়েবসাইটের ব্যাকগ্রাউন্ড'),
      desc: t('The fixed picture behind every page and section.', 'প্রতিটি পেজ ও সেকশনের পেছনের স্থির ছবি।'),
    },
  ];

  const handleFile = async (key: Key, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || readOnly) return;
    setBusy(key);
    try {
      const dataUrl = await compressImage(file, 1280, 350_000);
      await updateSettings({ [key]: dataUrl } as any);
      showToast(
        t('Previous photo automatically deleted and new background saved.', 'আগের ছবিটি স্বয়ংক্রিয়ভাবে মুছে নতুন ব্যাকগ্রাউন্ড সংরক্ষিত হয়েছে।'),
        'success'
      );
    } catch {
      showToast(t('Could not use this image.', 'ছবিটি ব্যবহার করা যায়নি।'), 'warning');
    } finally {
      setBusy(null);
    }
  };

  const reset = async (key: Key) => {
    if (readOnly) return;
    setBusy(key);
    try {
      await updateSettings({ [key]: undefined } as any);
      showToast(t('Uploaded photo deleted and default background restored.', 'আপলোড করা ছবিটি মুছে ডিফল্ট ব্যাকগ্রাউন্ড ফেরানো হয়েছে।'), 'info');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
      <div>
        <h3 className="font-extrabold text-base text-slate-950 dark:text-slate-100">
          {t('Website Backgrounds', 'ওয়েবসাইটের ব্যাকগ্রাউন্ড')}
        </h3>
        <p className="text-xs text-slate-800 dark:text-slate-400 mt-0.5">
          {t(
            'Upload a photo to replace a background. The previous photo is automatically deleted and replaced immediately.',
            'নতুন ছবি আপলোড করলে আগের ছবিটি স্বয়ংক্রিয়ভাবে ডিলিট হয়ে নতুন ব্যাকগ্রাউন্ড সাথে সাথে কার্যকর হবে।'
          )}
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {fields.map(f => {
          const current = settings[f.key];
          return (
            <div key={f.key} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-800/40 p-3 space-y-3 min-w-0">
              <div className="relative">
                <img
                  key={current ? `${f.key}-custom-${current.slice(-24)}` : `${f.key}-default`}
                  src={current || f.fallback}
                  alt={f.title}
                  className="w-full aspect-video object-cover rounded-xl border border-slate-200 dark:border-slate-700"
                />
                <span className={`absolute top-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-bold shadow-xs ${
                  current
                    ? 'bg-emerald-700/90 text-white'
                    : 'bg-slate-900/75 text-slate-100'
                }`}>
                  {current ? t('Custom Uploaded', 'কাস্টম ছবি') : t('Default Image', 'ডিফল্ট ছবি')}
                </span>
              </div>
              <div>
                <div className="font-bold text-xs text-slate-950 dark:text-slate-100">{f.title}</div>
                <div className="text-[11px] text-slate-800 dark:text-slate-400 mt-0.5">{f.desc}</div>
              </div>
              {!readOnly && (
                <div className="flex flex-wrap gap-2">
                  <label className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    {busy === f.key ? t('Working...', 'অপেক্ষা করুন...') : t('Upload new photo', 'নতুন ছবি আপলোড')}
                    <input type="file" accept="image/*" className="hidden" onChange={e => void handleFile(f.key, e)} disabled={busy !== null} />
                  </label>
                  {current && (
                    <button
                      type="button"
                      disabled={busy !== null}
                      onClick={() => void reset(f.key)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      {t('Delete & use default', 'আগের ছবি মুছে ডিফল্ট দিন')}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
