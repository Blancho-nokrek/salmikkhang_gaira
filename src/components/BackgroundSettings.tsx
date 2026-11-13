import React, { useState } from 'react';
import { Upload, RotateCcw } from 'lucide-react';
import { useCommunity } from '../context/CommunityContext';
import { compressImage } from '../lib/imageUpload';
import defaultHero from '../assets/images/hero_community_landscape_1794424784970.jpg';
import defaultSite from '../assets/images/nature_glass_bg_1794467445710.jpg';

type Key = 'heroBackground' | 'siteBackground';

export const BackgroundSettings: React.FC = () => {
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
    if (!file) return;
    setBusy(key);
    try {
      const dataUrl = await compressImage(file, 1280, 350_000);
      updateSettings({ [key]: dataUrl } as any);
      showToast(t('Background updated.', 'ব্যাকগ্রাউন্ড আপডেট হয়েছে।'), 'success');
    } catch (err: any) {
      showToast(t('Could not use this image.', 'ছবিটি ব্যবহার করা যায়নি।'), 'warning');
    } finally {
      setBusy(null);
    }
  };

  const reset = (key: Key) => {
    updateSettings({ [key]: undefined } as any);
    showToast(t('Background reset to default.', 'ডিফল্ট ব্যাকগ্রাউন্ডে ফেরানো হয়েছে।'), 'info');
  };

  return (
    <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
      <div>
        <h3 className="font-extrabold text-base text-slate-950 dark:text-slate-100">
          {t('Website Backgrounds', 'ওয়েবসাইটের ব্যাকগ্রাউন্ড')}
        </h3>
        <p className="text-xs text-slate-800 dark:text-slate-400 mt-0.5">
          {t('Upload a photo to replace a background. Changes apply immediately.', 'ছবি আপলোড করে ব্যাকগ্রাউন্ড পরিবর্তন করুন। পরিবর্তন সাথে সাথে কার্যকর হয়।')}
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {fields.map(f => {
          const current = settings[f.key];
          return (
            <div key={f.key} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-800/40 p-3 space-y-3">
              <img
                src={current || f.fallback}
                alt={f.title}
                className="w-full aspect-video object-cover rounded-xl border border-slate-200 dark:border-slate-700"
              />
              <div>
                <div className="font-bold text-xs text-slate-950 dark:text-slate-100">{f.title}</div>
                <div className="text-[11px] text-slate-800 dark:text-slate-400 mt-0.5">{f.desc}</div>
              </div>
              <div className="flex flex-wrap gap-2">
                <label className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  {busy === f.key ? t('Working...', 'অপেক্ষা করুন...') : t('Upload new photo', 'নতুন ছবি আপলোড')}
                  <input type="file" accept="image/*" className="hidden" onChange={e => handleFile(f.key, e)} disabled={busy !== null} />
                </label>
                {current && (
                  <button
                    type="button"
                    onClick={() => reset(f.key)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    {t('Use default', 'ডিফল্ট ব্যবহার করুন')}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
