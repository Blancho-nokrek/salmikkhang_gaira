import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeScrollPercent,
  resolveRulerSection,
  splitOdometerDigits,
} from './scrollRuler';

test('computeScrollPercent clamps between 0 and 100 safely', () => {
  assert.equal(computeScrollPercent(0, 2000, 1000), 0);
  assert.equal(computeScrollPercent(500, 2000, 1000), 50);
  assert.equal(computeScrollPercent(1000, 2000, 1000), 100);
  assert.equal(computeScrollPercent(1500, 2000, 1000), 100);
  assert.equal(computeScrollPercent(-50, 2000, 1000), 0);
  assert.equal(computeScrollPercent(0, 800, 900), 0);
});

test('splitOdometerDigits pads 2 digits below 100 and splits 100 into 3 digits', () => {
  assert.deepEqual(splitOdometerDigits(0), [0, 0]);
  assert.deepEqual(splitOdometerDigits(7), [0, 7]);
  assert.deepEqual(splitOdometerDigits(42), [4, 2]);
  assert.deepEqual(splitOdometerDigits(99), [9, 9]);
  assert.deepEqual(splitOdometerDigits(100), [1, 0, 0]);
  assert.deepEqual(splitOdometerDigits(-10), [0, 0]);
});

test('resolveRulerSection selects section based on scroll position and threshold', () => {
  const sections = [
    { id: 'home', code: '01', labelEn: 'Home', labelBn: 'হোম', top: 0 },
    { id: 'about', code: '02', labelEn: 'About', labelBn: 'পরিচিতি', top: 640 },
    { id: 'projects', code: '03', labelEn: 'Projects', labelBn: 'উদ্যোগ', top: 1400 },
    { id: 'contact', code: '04', labelEn: 'Contact', labelBn: 'যোগাযোগ', top: 2200 },
  ];

  assert.equal(resolveRulerSection(sections, 900, 0, 3000)?.id, 'home');

  const midSections = sections.map(s => ({ ...s, top: s.top - 1200 }));
  assert.equal(resolveRulerSection(midSections, 900, 1200, 3000)?.id, 'projects');

  const bottomSections = sections.map(s => ({ ...s, top: s.top - 2100 }));
  assert.equal(resolveRulerSection(bottomSections, 900, 2100, 3000)?.id, 'contact');
});
