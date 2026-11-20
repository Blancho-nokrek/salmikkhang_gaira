import test from 'node:test';
import assert from 'node:assert/strict';
import {
  filterOutLegacyDemoItems,
  filterOutLegacyDemoMembers,
  isLegacyDemoId,
  isLegacyDemoMemberDoc,
} from './legacyDemoData';

test('isLegacyDemoId flags static starter IDs and keeps uploaded timestamp IDs', () => {
  assert.equal(isLegacyDemoId('events', 'ev-1'), true);
  assert.equal(isLegacyDemoId('events', 'ev-4'), true);
  assert.equal(isLegacyDemoId('events', 'ev-1763123456789'), false);

  assert.equal(isLegacyDemoId('news', 'n-2'), true);
  assert.equal(isLegacyDemoId('news', 'n-1763123456789'), false);

  assert.equal(isLegacyDemoId('projects', 'p-1'), true);
  assert.equal(isLegacyDemoId('projects', 'p-1763123456789'), false);

  assert.equal(isLegacyDemoId('gallery', 'g-5'), true);
  assert.equal(isLegacyDemoId('gallery', 'g-1763123456789'), false);

  assert.equal(isLegacyDemoId('funds', 'f-6'), true);
  assert.equal(isLegacyDemoId('funds', 'f-1763123456789'), false);

  assert.equal(isLegacyDemoId('villageResidents', 'res-7'), true);
  assert.equal(isLegacyDemoId('villageResidents', 'res-1763123456789'), false);
});

test('isLegacyDemoMemberDoc only matches fake @example.com demo members', () => {
  assert.equal(isLegacyDemoMemberDoc('m-2', 'subrata.cashier@example.com'), true);
  assert.equal(isLegacyDemoMemberDoc('m-12', 'joyanto.m@example.com'), true);
  assert.equal(isLegacyDemoMemberDoc('m-0', 'salmikkhang@gmail.com'), false);
  assert.equal(isLegacyDemoMemberDoc('m-1', 'blancho.261071027@smuct.ac.bd'), false);
  assert.equal(isLegacyDemoMemberDoc('m-2', 'real.person@gmail.com'), false);
  assert.equal(isLegacyDemoMemberDoc('m-1763123456789', 'user@example.com'), false);
});

test('filterOutLegacyDemoItems and filterOutLegacyDemoMembers preserve uploaded items only', () => {
  const events = filterOutLegacyDemoItems('events', [
    { id: 'ev-1', title: 'Old Demo' },
    { id: 'ev-1763999999999', title: 'Christmas Program' },
  ]);
  assert.deepEqual(events, [{ id: 'ev-1763999999999', title: 'Christmas Program' }]);

  const members = filterOutLegacyDemoMembers([
    { id: 'm-0', email: 'salmikkhang@gmail.com' },
    { id: 'm-2', email: 'subrata.cashier@example.com' },
    { id: 'm-1763999999999', email: 'member@gmail.com' },
  ]);
  assert.deepEqual(members, [
    { id: 'm-0', email: 'salmikkhang@gmail.com' },
    { id: 'm-1763999999999', email: 'member@gmail.com' },
  ]);
});
