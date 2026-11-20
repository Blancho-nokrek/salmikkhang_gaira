import test from 'node:test';
import assert from 'node:assert/strict';
import {
  encodeMemberStatusForFirestore,
  filterMembersDirectory,
  getMemberStatusMeta,
  hydrateMemberStatus,
  normalizeMemberStatus,
  summarizeMemberStatuses,
} from './memberStatus';
import { Member } from '../types';

const sampleMembers: Member[] = [
  {
    id: 'm-1',
    memberNo: 'SMK-2026-001',
    name: 'Blancho Nokrek',
    email: 'blancho@example.org',
    phone: '+8801700000001',
    role: 'President',
    status: 'Active',
    village: 'Gaira',
    bloodGroup: 'O+',
    skills: ['Leadership', 'Tree Plantation'],
    interests: ['Nature'],
    joinDate: '2026-01-01',
  },
  {
    id: 'm-2',
    memberNo: 'SMK-2026-002',
    name: 'Rina Chambugong',
    email: 'rina@example.org',
    phone: '+8801700000002',
    role: 'Education & Library Secretary',
    status: 'On-Leave',
    village: 'Jolchotro',
    bloodGroup: 'A+',
    skills: ['Tutoring'],
    interests: ['Books'],
    joinDate: '2026-01-05',
  },
  {
    id: 'm-3',
    memberNo: 'SMK-2026-003',
    name: 'Sajib Marak',
    email: 'sajib@example.org',
    phone: '+8801700000003',
    role: 'Volunteer',
    status: 'Inactive',
    village: 'Madhupur',
    bloodGroup: 'B+',
    skills: ['First Aid'],
    interests: ['Sports'],
    joinDate: '2026-01-10',
  },
];

test('normalizeMemberStatus maps Active, On-Leave, Inactive, and fallbacks safely', () => {
  assert.equal(normalizeMemberStatus('Active'), 'Active');
  assert.equal(normalizeMemberStatus('On-Leave'), 'On-Leave');
  assert.equal(normalizeMemberStatus('on leave'), 'On-Leave');
  assert.equal(normalizeMemberStatus('Inactive'), 'Inactive');
  assert.equal(normalizeMemberStatus(undefined), 'Active');
  assert.equal(normalizeMemberStatus('unknown'), 'Active');
});

test('encodeMemberStatusForFirestore and hydrateMemberStatus round-trip On-Leave without breaking Firestore enum', () => {
  const encodedOnLeave = encodeMemberStatusForFirestore('On-Leave', ['Sports', 'Education']);
  assert.equal(encodedOnLeave.firestoreStatus, 'Active');
  assert.deepEqual(encodedOnLeave.encodedInterests, ['Sports', 'Education', '__status:On-Leave']);

  const hydratedOnLeave = hydrateMemberStatus({
    id: 'm-2',
    status: encodedOnLeave.firestoreStatus,
    interests: encodedOnLeave.encodedInterests,
  });
  assert.equal(hydratedOnLeave.status, 'On-Leave');
  assert.deepEqual(hydratedOnLeave.interests, ['Sports', 'Education']);

  const encodedActive = encodeMemberStatusForFirestore('Active', encodedOnLeave.encodedInterests);
  assert.equal(encodedActive.firestoreStatus, 'Active');
  assert.deepEqual(encodedActive.encodedInterests, ['Sports', 'Education']);

  const encodedInactive = encodeMemberStatusForFirestore('Inactive', encodedOnLeave.encodedInterests);
  assert.equal(encodedInactive.firestoreStatus, 'Inactive');
  assert.deepEqual(encodedInactive.encodedInterests, ['Sports', 'Education']);
});

test('getMemberStatusMeta provides bilingual labels and semantic tones for all statuses', () => {
  assert.equal(getMemberStatusMeta('Active').tone, 'emerald');
  assert.equal(getMemberStatusMeta('On-Leave').tone, 'amber');
  assert.equal(getMemberStatusMeta('On-Leave').labelEn, 'On-Leave');
  assert.equal(getMemberStatusMeta('Inactive').tone, 'slate');
});

test('filterMembersDirectory filters accurately by status, blood group, village, and search', () => {
  assert.equal(
    filterMembersDirectory(sampleMembers, {
      search: '',
      bloodGroup: 'All',
      village: 'All',
      status: 'On-Leave',
    }).map((m) => m.id).join(','),
    'm-2'
  );

  assert.equal(
    filterMembersDirectory(sampleMembers, {
      search: 'on-leave',
      bloodGroup: 'All',
      village: 'All',
      status: 'All',
    }).length,
    1
  );

  assert.equal(
    filterMembersDirectory(sampleMembers, {
      search: '',
      bloodGroup: 'O+',
      village: 'Gaira',
      status: 'Active',
    }).map((m) => m.id).join(','),
    'm-1'
  );
});

test('summarizeMemberStatuses counts total, active, onLeave, and inactive members', () => {
  assert.deepEqual(summarizeMemberStatuses(sampleMembers), {
    total: 3,
    active: 1,
    onLeave: 1,
    inactive: 1,
  });
});
