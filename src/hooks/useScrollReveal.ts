import { useEffect, type RefObject } from 'react';

export function useScrollReveal(
  containerRef: RefObject<HTMLElement | null>,
  depsKey: string | number
): void {
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    const elements = Array.from(root.querySelectorAll<HTMLElement>('[data-reveal="true"]'));
    if (elements.length === 0) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const revealElement = (el: HTMLElement) => {
      if (el.getAttribute('data-revealed') !== 'true') {
        el.setAttribute('data-revealed', 'true');
      }
    };

    if (prefersReducedMotion || typeof IntersectionObserver === 'undefined') {
      elements.forEach(revealElement);
      return;
    }

    // Reveal items already inside or above the current viewport immediately so deep/hash links never appear blank
    const viewportThreshold = window.innerHeight + 90;
    const pending: HTMLElement[] = [];

    for (const el of elements) {
      if (el.getAttribute('data-revealed') === 'true') continue;
      const rect = el.getBoundingClientRect();
      if (rect.top <= viewportThreshold) {
        revealElement(el);
      } else {
        pending.push(el);
      }
    }

    if (pending.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting || entry.boundingClientRect.top <= window.innerHeight + 60) {
            revealElement(entry.target as HTMLElement);
            observer.unobserve(entry.target);
          }
        }
      },
      {
        threshold: 0.03,
        rootMargin: '60px 0px 80px 0px',
      }
    );

    for (const el of pending) {
      observer.observe(el);
    }

    // Fallback safety check on fast scroll / programmatic jumps
    const handleScrollReveal = () => {
      const limit = window.innerHeight + 100;
      for (const el of pending) {
        if (el.getAttribute('data-revealed') === 'true') continue;
        if (el.getBoundingClientRect().top <= limit) {
          revealElement(el);
          observer.unobserve(el);
        }
      }
    };

    window.addEventListener('hashchange', handleScrollReveal, { passive: true });
    window.addEventListener('scroll', handleScrollReveal, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener('hashchange', handleScrollReveal);
      window.removeEventListener('scroll', handleScrollReveal);
    };
  }, [containerRef, depsKey]);
}
