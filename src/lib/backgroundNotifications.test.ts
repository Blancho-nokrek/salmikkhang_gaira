import test from 'node:test';
import assert from 'node:assert/strict';
import {
  detectNewCommunityUpdates,
  type CommunityAlertCandidate,
} from './backgroundNotifications';

const initialItems: CommunityAlertCandidate[] = [
  { id: 'n-1', kind: 'news', title: 'Tower Relocation', body: 'Details' },
  { id: 'ev-1', kind: 'event', title: 'Christmas', body: 'Dec 25' },
];

test('detectNewCommunityUpdates records baseline without firing retroactive notifications', () => {
  const res = detectNewCommunityUpdates(null, initialItems);
  assert.equal(res.newAlerts.length, 0);
  assert.equal(res.nextSeenIds.has('n-1'), true);
  assert.equal(res.nextSeenIds.has('ev-1'), true);
});

test('detectNewCommunityUpdates emits alerts only for newly added items', () => {
  const baseline = detectNewCommunityUpdates(null, initialItems);
  const nextItems: CommunityAlertCandidate[] = [
    ...initialItems,
    { id: 'p-99', kind: 'project', title: 'Village Road Repair', body: 'Ongoing project' },
  ];
  const res = detectNewCommunityUpdates(baseline.nextSeenIds, nextItems);
  assert.equal(res.newAlerts.length, 1);
  assert.equal(res.newAlerts[0].id, 'p-99');
  assert.equal(res.nextSeenIds.has('p-99'), true);

  // Repeating the same list yields zero duplicate alerts
  const resRepeat = detectNewCommunityUpdates(res.nextSeenIds, nextItems);
  assert.equal(resRepeat.newAlerts.length, 0);
});
