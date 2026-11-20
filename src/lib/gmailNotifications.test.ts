import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GMAIL_SUBSCRIBER_MARKER,
  buildDefaultSubject,
  buildDraftFromEvent,
  buildDraftFromNews,
  buildDraftFromProject,
  buildGmailRawMessages,
  collectNotificationRecipients,
  encodeMimeHeaderUtf8,
  extractGmailSubscribers,
  normalizeEmail,
} from './gmailNotifications';
import type { ContactMessage, JoinRequest, Member } from '../types';

const sampleMembers: Member[] = [
  {
    id: 'm-0',
    memberNo: 'SMK-001',
    name: 'Salmikkhang Admin',
    email: 'salmikkhang@gmail.com',
    ownerEmail: 'salmikkhang@gmail.com',
    phone: '01700000001',
    role: 'Admin',
    status: 'Active',
    village: 'Gaira',
    bloodGroup: 'O+',
    skills: [],
    interests: [],
    joinDate: '2026-01-01',
  },
  {
    id: 'm-1',
    memberNo: 'SMK-002',
    name: 'Blancho',
    email: 'Blancho@Gmail.com ',
    ownerEmail: 'blancho@gmail.com',
    phone: '01700000002',
    role: 'President',
    status: 'Active',
    village: 'Gaira',
    bloodGroup: 'B+',
    skills: [],
    interests: [],
    joinDate: '2026-01-02',
  },
  {
    id: 'm-inactive',
    memberNo: 'SMK-003',
    name: 'Inactive User',
    email: 'inactive@gmail.com',
    phone: '01700000003',
    role: 'Member',
    status: 'Inactive',
    village: 'Gaira',
    bloodGroup: 'A+',
    skills: [],
    interests: [],
    joinDate: '2026-01-03',
  },
  {
    id: 'm-demo',
    memberNo: 'SMK-004',
    name: 'Demo',
    email: 'fake@example.com',
    phone: '01700000004',
    role: 'Member',
    status: 'Active',
    village: 'Gaira',
    bloodGroup: 'A+',
    skills: [],
    interests: [],
    joinDate: '2026-01-04',
  },
];

const sampleMessages: ContactMessage[] = [
  {
    id: 'sub-1',
    name: 'Nadia',
    contact: 'nadia.gaira@gmail.com',
    message: `${GMAIL_SUBSCRIBER_MARKER} Subscribed for updates`,
    date: '2026-11-20',
    status: 'Unread',
  },
  {
    id: 'sub-dup',
    name: 'Blancho Duplicate',
    contact: 'blancho@gmail.com',
    message: `${GMAIL_SUBSCRIBER_MARKER} Subscribed for updates`,
    date: '2026-11-20',
    status: 'Unread',
  },
  {
    id: 'msg-regular',
    name: 'Visitor',
    contact: 'visitor@gmail.com',
    message: 'Hello, regular contact inquiry',
    date: '2026-11-20',
    status: 'Unread',
  },
];

const sampleJoinRequests: JoinRequest[] = [
  {
    id: 'jr-1',
    name: 'Pending Youth',
    email: 'youth.pending@gmail.com',
    phone: '01711111111',
    village: 'Gaira',
    bloodGroup: 'O+',
    skills: '',
    interests: '',
    reason: 'Join',
    status: 'Pending',
    date: '2026-11-19',
  },
  {
    id: 'jr-2',
    name: 'Rejected Applicant',
    email: 'rejected@gmail.com',
    phone: '01722222222',
    village: 'Gaira',
    bloodGroup: 'O+',
    skills: '',
    interests: '',
    reason: 'Join',
    status: 'Rejected',
    date: '2026-11-19',
  },
];

test('normalizeEmail trims, lowercases, and rejects invalid or example.com addresses', () => {
  assert.equal(normalizeEmail('  Salmikkhang@GMAIL.COM '), 'salmikkhang@gmail.com');
  assert.equal(normalizeEmail('not-an-email'), null);
  assert.equal(normalizeEmail('test@example.com'), null);
});

test('extractGmailSubscribers reads only tagged subscriber records and deduplicates', () => {
  const subs = extractGmailSubscribers(sampleMessages);
  assert.deepEqual(
    subs.map((s) => s.email),
    ['nadia.gaira@gmail.com', 'blancho@gmail.com']
  );
});

test('collectNotificationRecipients includes members + public subscribers for public items, excludes Inactive and Rejected', () => {
  const result = collectNotificationRecipients({
    members: sampleMembers,
    messages: sampleMessages,
    joinRequests: sampleJoinRequests,
    visibility: 'public',
    excludeSenderEmail: 'salmikkhang@gmail.com',
  });

  assert.deepEqual(result.memberEmails, ['blancho@gmail.com']);
  assert.deepEqual(result.subscriberEmails, [
    'nadia.gaira@gmail.com',
    'youth.pending@gmail.com',
  ]);
  assert.deepEqual(result.allEmails, [
    'blancho@gmail.com',
    'nadia.gaira@gmail.com',
    'youth.pending@gmail.com',
  ]);
});

test('collectNotificationRecipients restricts members_only items strictly to Active members', () => {
  const result = collectNotificationRecipients({
    members: sampleMembers,
    messages: sampleMessages,
    joinRequests: sampleJoinRequests,
    visibility: 'members_only',
    excludeSenderEmail: 'salmikkhang@gmail.com',
  });

  assert.deepEqual(result.allEmails, ['blancho@gmail.com']);
  assert.deepEqual(result.subscriberEmails, []);
});

test('buildGmailRawMessages produces RFC 2822 base64url payloads with UTF-8 Bengali headers and BCC chunking', () => {
  const draft = buildDraftFromNews({
    title: 'Village Clean-Up Notice',
    titleBn: 'গ্রাম পরিচ্ছন্নতা নোটিশ',
    category: 'Notice',
    categoryBn: 'নোটিশ',
    date: '2026-11-25',
    summary: 'Everyone please join at 8 AM.',
    summaryBn: 'সকাল ৮টায় সবাই উপস্থিত থাকুন।',
    content: '',
    contentBn: '',
    image: '',
    tagColor: 'green',
    status: 'Published',
    visibility: 'public',
  });

  const subject = buildDefaultSubject(draft);
  assert.match(subject, /Salmikkhang Official Notice/);
  assert.match(encodeMimeHeaderUtf8(subject), /^=\?UTF-8\?B\?/);

  const batches = buildGmailRawMessages({
    senderEmail: 'salmikkhang@gmail.com',
    recipients: ['a@gmail.com', 'b@gmail.com', 'c@gmail.com'],
    subject,
    draft,
    maxPerBatch: 2,
  });

  assert.equal(batches.length, 2);
  assert.deepEqual(batches[0].bcc, ['a@gmail.com', 'b@gmail.com']);
  assert.deepEqual(batches[1].bcc, ['c@gmail.com']);
  // Must be URL-safe base64 without +, /, or trailing =
  assert.equal(/[+/=]/.test(batches[0].raw), false);

  const decoded = Buffer.from(
    batches[0].raw.replace(/-/g, '+').replace(/_/g, '/'),
    'base64'
  ).toString('utf-8');
  assert.match(decoded, /To: salmikkhang@gmail\.com/);
  assert.match(decoded, /Bcc: a@gmail\.com, b@gmail\.com/);
});

test('draft builders cover events and projects with accurate metadata', () => {
  const evDraft = buildDraftFromEvent({
    title: 'Christmas',
    titleBn: 'বড়দিন',
    date: '2026-12-25',
    time: '4:00 PM',
    timeBn: 'বিকাল ৪টা',
    location: 'Gaira Church',
    locationBn: 'গাইরা চার্চ',
    category: 'Festival',
    categoryBn: 'উৎসব',
    description: 'Annual celebration',
    descriptionBn: 'বার্ষিক উদযাপন',
    image: '',
    status: 'Upcoming',
    visibility: 'public',
  });
  assert.equal(evDraft.kind, 'event');
  assert.match(evDraft.metaLine || '', /Gaira Church/);

  const projDraft = buildDraftFromProject({
    title: 'Church Decoration',
    titleBn: 'চার্চ সাজসজ্জা',
    category: 'Community',
    categoryBn: 'কমিউনিটি',
    status: 'Ongoing',
    statusBn: 'চলমান',
    progress: 60,
    description: 'Decorating for 2026',
    descriptionBn: '২০২৬ সালের সাজসজ্জা',
    image: '',
    volunteersNeeded: 10,
    volunteersEnrolled: 4,
  });
  assert.equal(projDraft.kind, 'project');
  assert.match(projDraft.metaLine || '', /60% progress/);
});
