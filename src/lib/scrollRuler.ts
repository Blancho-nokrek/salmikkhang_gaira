export interface RulerSectionInput {
  id: string;
  code: string;
  labelEn: string;
  labelBn: string;
  top: number;
}

export function computeScrollPercent(
  scrollY: number,
  scrollHeight: number,
  innerHeight: number
): number {
  if (!Number.isFinite(scrollY) || !Number.isFinite(scrollHeight) || !Number.isFinite(innerHeight)) {
    return 0;
  }
  const maxScroll = Math.max(0, scrollHeight - innerHeight);
  if (maxScroll <= 0) return 0;
  const raw = Math.round((Math.max(0, scrollY) / maxScroll) * 100);
  return Math.max(0, Math.min(100, raw));
}

export function splitOdometerDigits(percent: number): number[] {
  const clamped = Number.isFinite(percent)
    ? Math.max(0, Math.min(100, Math.round(percent)))
    : 0;
  if (clamped === 100) {
    return [1, 0, 0];
  }
  const tens = Math.floor(clamped / 10);
  const ones = clamped % 10;
  return [tens, ones];
}

export function resolveRulerSection(
  sections: RulerSectionInput[],
  viewportHeight: number,
  scrollY: number,
  scrollHeight: number
): RulerSectionInput | null {
  if (sections.length === 0) return null;
  if (scrollY <= 24) return sections[0];

  const maxScroll = Math.max(0, scrollHeight - viewportHeight);
  if (maxScroll > 0 && scrollY >= maxScroll - 32) {
    return sections[sections.length - 1];
  }

  const threshold = Math.max(120, Math.round(viewportHeight * 0.34));
  let active = sections[0];
  for (const sec of sections) {
    if (sec.top <= threshold) {
      active = sec;
    } else {
      break;
    }
  }
  return active;
}
