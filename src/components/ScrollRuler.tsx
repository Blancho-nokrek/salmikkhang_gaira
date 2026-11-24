import React, { useEffect, useState } from 'react';
import { useCommunity } from '../context/CommunityContext';
import {
  computeScrollPercent,
  resolveRulerSection,
  splitOdometerDigits,
  type RulerSectionInput,
} from '../lib/scrollRuler';

interface RulerSectionMeta {
  id: string;
  code: string;
  labelEn: string;
  labelBn: string;
}

const RULER_SECTIONS: RulerSectionMeta[] = [
  { id: 'home', code: '01', labelEn: 'Home', labelBn: 'হোম' },
  { id: 'about', code: '02', labelEn: 'Mission', labelBn: 'লক্ষ্য' },
  { id: 'events', code: '03', labelEn: 'Events', labelBn: 'অনুষ্ঠান' },
  { id: 'projects', code: '04', labelEn: 'Projects', labelBn: 'উদ্যোগ' },
  { id: 'gallery', code: '05', labelEn: 'Gallery', labelBn: 'গ্যালারি' },
  { id: 'contact', code: '06', labelEn: 'Contact', labelBn: 'যোগাযোগ' },
];

const DIGIT_STACK = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
const TICK_COUNT = 21;

export const ScrollRuler: React.FC = () => {
  const { t } = useCommunity();
  const [percent, setPercent] = useState(0);
  const [activeSection, setActiveSection] = useState<RulerSectionMeta>(RULER_SECTIONS[0]);

  useEffect(() => {
    let rafId = 0;

    const measure = () => {
      rafId = 0;
      const scrollY = window.scrollY;
      const innerHeight = window.innerHeight;
      const scrollHeight = document.documentElement.scrollHeight;

      setPercent(computeScrollPercent(scrollY, scrollHeight, innerHeight));

      const positioned: RulerSectionInput[] = RULER_SECTIONS.map((s) => {
        const el = document.getElementById(s.id);
        return {
          ...s,
          top: el ? el.getBoundingClientRect().top : Number.POSITIVE_INFINITY,
        };
      }).filter((s) => Number.isFinite(s.top));

      const resolved = resolveRulerSection(positioned, innerHeight, scrollY, scrollHeight);
      if (resolved) {
        setActiveSection(resolved);
      }
    };

    const onScroll = () => {
      if (rafId !== 0) return;
      rafId = window.requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (rafId !== 0) window.cancelAnimationFrame(rafId);
    };
  }, []);

  const digits = splitOdometerDigits(percent);

  const jumpTo = (id: string) => {
    if (id === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const el = document.getElementById(id);
    if (!el) return;
    const top = Math.max(0, el.getBoundingClientRect().top + window.scrollY - 88);
    window.scrollTo({ top, behavior: 'smooth' });
  };

  return (
    <aside
      aria-label={t('Page scroll progress and section navigation', 'পৃষ্ঠা স্ক্রল অগ্রগতি')}
      className="hidden min-[1380px]:flex fixed right-2.5 top-24 bottom-6 z-30 flex-col items-end justify-between pointer-events-none select-none no-print"
    >
      {/* Top Active Section Readout */}
      <div className="pointer-events-auto flex flex-col items-end gap-1 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border border-emerald-900/15 dark:border-white/15 rounded-xl px-2.5 py-1.5 shadow-sm transition-all duration-300">
        <span className="font-mono text-[9px] font-bold tracking-[0.12em] uppercase text-emerald-800 dark:text-emerald-400 whitespace-nowrap">
          {activeSection.code} / {t(activeSection.labelEn, activeSection.labelBn)}
        </span>
        <div className="flex items-center gap-0.5 font-mono text-xs font-extrabold text-slate-950 dark:text-white tabular-nums">
          <span className="ruler-digits" aria-label={`${percent}%`}>
            {digits.map((digit, idx) => (
              <span key={`${digits.length}-${idx}`} className="ruler-digit-col" style={{ transform: `translateY(-${digit}em)` }}>
                {DIGIT_STACK.map((n) => (
                  <span key={n}>{n}</span>
                ))}
              </span>
            ))}
          </span>
          <span className="text-[10px] text-emerald-700 dark:text-emerald-400">%</span>
        </div>
      </div>

      {/* Vertical Architectural Ruler Rail */}
      <div className="relative flex-1 my-3 w-8 flex items-center justify-end">
        <div className="relative h-full w-6 flex flex-col justify-between items-end py-1">
          {/* Hairline Track */}
          <div className="absolute right-0 top-0 bottom-0 w-px bg-emerald-950/15 dark:bg-white/15" />

          {/* Moving Progress Fill */}
          <div
            className="absolute right-0 top-0 w-[2px] bg-gradient-to-b from-emerald-500 to-lime-400 rounded-full origin-top transition-transform duration-150 ease-out"
            style={{
              height: '100%',
              transform: `scaleY(${Math.max(0.02, percent / 100)})`,
            }}
          />

          {/* Ruler Ticks */}
          {Array.from({ length: TICK_COUNT }).map((_, i) => {
            const isMajor = i % 5 === 0;
            const tickPct = (i / (TICK_COUNT - 1)) * 100;
            const isPassed = percent >= tickPct - 1;
            return (
              <span
                key={i}
                className={`block h-px transition-all duration-200 ${
                  isMajor ? 'w-3.5' : 'w-2'
                } ${
                  isPassed
                    ? 'bg-emerald-600 dark:bg-emerald-400'
                    : 'bg-slate-400/60 dark:bg-slate-500/60'
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* Bottom Interactive Section Quick-Jump List */}
      <nav
        aria-label={t('Quick section jump', 'সেকশন তালিকা')}
        className="pointer-events-auto flex flex-col items-end gap-0.5 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border border-emerald-900/15 dark:border-white/15 rounded-xl p-1.5 shadow-sm"
      >
        {RULER_SECTIONS.map((sec) => {
          const isActive = activeSection.id === sec.id;
          return (
            <button
              key={sec.id}
              type="button"
              onClick={() => jumpTo(sec.id)}
              className={`px-2 py-0.5 rounded-md font-mono text-[9px] uppercase tracking-[0.12em] transition-[background-color,transform] duration-200 cursor-pointer ${
                isActive
                  ? 'bg-emerald-700 text-white dark:bg-emerald-400 dark:text-slate-950 font-bold translate-x-0 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-emerald-800 dark:hover:text-emerald-300 hover:-translate-x-0.5'
              }`}
            >
              {t(sec.labelEn, sec.labelBn)}
            </button>
          );
        })}
      </nav>
    </aside>
  );
};
