export type NavSectionId =
  | 'home'
  | 'about'
  | 'events'
  | 'news'
  | 'projects'
  | 'gallery'
  | 'contact';

export interface SectionPosition {
  id: Exclude<NavSectionId, 'home'>;
  top: number;
}

export interface ResolveActiveNavSectionInput {
  scrollY: number;
  innerHeight: number;
  scrollHeight: number;
  threshold: number;
  sections: SectionPosition[];
  previousSection: NavSectionId;
}

/**
 * Pure scroll-spy resolver used inside a requestAnimationFrame-throttled scroll handler.
 * Preserves side-by-side events/news stability when both columns start near the same Y offset.
 */
export function resolveActiveNavSection(input: ResolveActiveNavSectionInput): NavSectionId {
  const { scrollY, innerHeight, scrollHeight, threshold, sections, previousSection } = input;

  if (scrollY < 100) {
    return 'home';
  }

  if (scrollHeight > 0 && innerHeight + scrollY >= scrollHeight - 60) {
    return 'contact';
  }

  let current: NavSectionId = 'home';
  for (const section of sections) {
    if (section.top <= threshold) {
      current = section.id;
    }
  }

  if (previousSection === 'news' && current === 'news') {
    return 'news';
  }

  if (previousSection === 'events' && current === 'news') {
    const eventsPos = sections.find((s) => s.id === 'events');
    const newsPos = sections.find((s) => s.id === 'news');
    if (eventsPos && newsPos && Math.abs(eventsPos.top - newsPos.top) < 40) {
      return 'events';
    }
  }

  return current;
}

const OPTIONAL_FONT_URLS: Record<'youthful' | 'heritage' | 'classic' | 'all', string> = {
  youthful:
    'https://fonts.googleapis.com/css2?family=Baloo+Da+2:wght@500;600;700;800&family=Hind+Siliguri:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Urbanist:wght@500;600;700;800&display=swap',
  heritage:
    'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700;9..144,800&family=Lora:wght@400;500;600;700&display=swap',
  classic:
    'https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap',
  all:
    'https://fonts.googleapis.com/css2?family=Baloo+Da+2:wght@500;600;700;800&family=Fraunces:opsz,wght@9..144,600;9..144,700;9..144,800&family=Hind+Siliguri:wght@400;500;600;700&family=Lora:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Urbanist:wght@500;600;700;800&display=swap',
};

/**
 * Returns the Google Fonts stylesheet URL required for optional non-default typography presets,
 * or null when the default editorial preset (preloaded in index.html) is active.
 */
export function getOptionalFontStylesheetUrl(fontStyle?: string): string | null {
  if (!fontStyle || fontStyle === 'editorial' || fontStyle === 'botanical') {
    return null;
  }
  if (fontStyle === 'youthful' || fontStyle === 'civic') {
    return OPTIONAL_FONT_URLS.youthful;
  }
  if (fontStyle === 'heritage') {
    return OPTIONAL_FONT_URLS.heritage;
  }
  if (fontStyle === 'classic') {
    return OPTIONAL_FONT_URLS.classic;
  }
  if (fontStyle === 'all') {
    return OPTIONAL_FONT_URLS.all;
  }
  return null;
}

/**
 * Idempotently injects the optional Google Fonts stylesheet into document.head on demand.
 */
export function ensureOptionalFontLoaded(fontStyle?: string): void {
  if (typeof document === 'undefined') return;
  const href = getOptionalFontStylesheetUrl(fontStyle);
  if (!href) return;

  const existing = document.head.querySelector(`link[data-optional-font-href="${href}"]`);
  if (existing) return;

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  link.dataset.optionalFontHref = href;
  document.head.appendChild(link);
}
