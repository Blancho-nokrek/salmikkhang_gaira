import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveActiveNavSection,
  getOptionalFontStylesheetUrl,
  type SectionPosition,
} from './scrollSmooth';

describe('resolveActiveNavSection', () => {
  const baseSections: SectionPosition[] = [
    { id: 'about', top: 500 },
    { id: 'events', top: 1000 },
    { id: 'news', top: 1000 },
    { id: 'projects', top: 1800 },
    { id: 'gallery', top: 2600 },
    { id: 'contact', top: 3400 },
  ];

  it('returns home near the top of the page', () => {
    const result = resolveActiveNavSection({
      scrollY: 40,
      innerHeight: 900,
      scrollHeight: 4200,
      threshold: 160,
      sections: baseSections,
      previousSection: 'projects',
    });
    assert.equal(result, 'home');
  });

  it('returns contact when scrolled near the bottom', () => {
    const result = resolveActiveNavSection({
      scrollY: 3250,
      innerHeight: 900,
      scrollHeight: 4200,
      threshold: 160,
      sections: baseSections,
      previousSection: 'gallery',
    });
    assert.equal(result, 'contact');
  });

  it('selects the last section whose top is at or above threshold', () => {
    const result = resolveActiveNavSection({
      scrollY: 1900,
      innerHeight: 900,
      scrollHeight: 4200,
      threshold: 160,
      sections: [
        { id: 'about', top: -1400 },
        { id: 'events', top: -900 },
        { id: 'news', top: -900 },
        { id: 'projects', top: -100 },
        { id: 'gallery', top: 700 },
        { id: 'contact', top: 1500 },
      ],
      previousSection: 'events',
    });
    assert.equal(result, 'projects');
  });

  it('keeps events active when events and news columns share top alignment on desktop', () => {
    const result = resolveActiveNavSection({
      scrollY: 1050,
      innerHeight: 900,
      scrollHeight: 4200,
      threshold: 160,
      sections: [
        { id: 'about', top: -450 },
        { id: 'events', top: 80 },
        { id: 'news', top: 90 },
        { id: 'projects', top: 850 },
      ],
      previousSection: 'events',
    });
    assert.equal(result, 'events');
  });

  it('switches to news on stacked mobile layout when news is further below events', () => {
    const result = resolveActiveNavSection({
      scrollY: 1650,
      innerHeight: 844,
      scrollHeight: 5200,
      threshold: 160,
      sections: [
        { id: 'about', top: -1100 },
        { id: 'events', top: -600 },
        { id: 'news', top: 90 },
        { id: 'projects', top: 900 },
      ],
      previousSection: 'events',
    });
    assert.equal(result, 'news');
  });
});

describe('getOptionalFontStylesheetUrl', () => {
  it('returns null for default editorial and botanical presets', () => {
    assert.equal(getOptionalFontStylesheetUrl(undefined), null);
    assert.equal(getOptionalFontStylesheetUrl('editorial'), null);
    assert.equal(getOptionalFontStylesheetUrl('botanical'), null);
  });

  it('returns valid Google Fonts URLs for optional presets and admin preview set', () => {
    const youthfulUrl = getOptionalFontStylesheetUrl('youthful');
    const civicUrl = getOptionalFontStylesheetUrl('civic');
    const heritageUrl = getOptionalFontStylesheetUrl('heritage');
    const classicUrl = getOptionalFontStylesheetUrl('classic');
    const allUrl = getOptionalFontStylesheetUrl('all');

    assert.ok(youthfulUrl && youthfulUrl.includes('Urbanist') && youthfulUrl.includes('Baloo+Da+2'));
    assert.equal(civicUrl, youthfulUrl);
    assert.ok(heritageUrl && heritageUrl.includes('Fraunces') && heritageUrl.includes('Lora'));
    assert.ok(classicUrl && classicUrl.includes('Plus+Jakarta+Sans') && classicUrl.includes('Hind+Siliguri'));
    assert.ok(allUrl && allUrl.includes('Fraunces') && allUrl.includes('Urbanist'));
  });
});
