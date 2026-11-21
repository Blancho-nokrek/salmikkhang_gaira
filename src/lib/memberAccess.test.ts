import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  nextSequentialCode,
  parseLocalIsoDate,
  parseTagList,
  resolvePortalAccessOutcome,
  safeLower,
  translateWithFallback,
  validateJoinApplication,
} from './memberAccess.ts';

describe('resolvePortalAccessOutcome', () => {
  it('declines unregistered Google users on member portal and NEVER auto-creates a join request', () => {
    const outcome = resolvePortalAccessOutcome('member', {
      allowed: false,
      isAdmin: false,
      role: null,
      reason: 'not_found',
    });
    assert.deepEqual(outcome, {
      unlocked: false,
      noticeStatus: 'declined',
      shouldAutoCreateRequest: false,
    });
  });

  it('marks inactive members as inactive without auto-creating a join request', () => {
    const outcome = resolvePortalAccessOutcome('member', {
      allowed: false,
      isAdmin: false,
      role: 'Member',
      reason: 'inactive',
    });
    assert.deepEqual(outcome, {
      unlocked: false,
      noticeStatus: 'inactive',
      shouldAutoCreateRequest: false,
    });
  });

  it('marks temporary backend outages as failed without auto-creating a join request', () => {
    const outcome = resolvePortalAccessOutcome('member', {
      allowed: false,
      isAdmin: false,
      role: null,
      reason: 'firestore_unavailable',
    });
    assert.deepEqual(outcome, {
      unlocked: false,
      noticeStatus: 'failed',
      shouldAutoCreateRequest: false,
    });
  });

  it('unlocks registered active members', () => {
    const outcome = resolvePortalAccessOutcome('member', {
      allowed: true,
      isAdmin: false,
      role: 'Member',
      reason: 'ok',
    });
    assert.deepEqual(outcome, {
      unlocked: true,
      noticeStatus: null,
      shouldAutoCreateRequest: false,
    });
  });

  it('declines non-admin members on admin portal and never auto-creates a request', () => {
    const outcome = resolvePortalAccessOutcome('admin', {
      allowed: true,
      isAdmin: false,
      role: 'Member',
      reason: 'ok',
    });
    assert.deepEqual(outcome, {
      unlocked: false,
      noticeStatus: 'declined',
      shouldAutoCreateRequest: false,
    });
  });

  it('unlocks verified admins on admin portal', () => {
    const outcome = resolvePortalAccessOutcome('admin', {
      allowed: true,
      isAdmin: true,
      role: 'Admin',
      reason: 'ok',
    });
    assert.deepEqual(outcome, {
      unlocked: true,
      noticeStatus: null,
      shouldAutoCreateRequest: false,
    });
  });
});

describe('validateJoinApplication', () => {
  it('accepts a valid membership application and normalizes fields', () => {
    const result = validateJoinApplication({
      name: '  Rahim Mia  ',
      phone: ' 01712345678 ',
      email: '  Rahim.Youth@Gmail.com ',
      skills: ' Teaching, Design ',
      interests: ' Plantation ',
      reason: ' I want to serve our village community. ',
    });
    assert.equal(result.valid, true);
    if (result.valid) {
      assert.equal(result.normalized.email, 'rahim.youth@gmail.com');
      assert.equal(result.normalized.name, 'Rahim Mia');
      assert.equal(result.normalized.phone, '01712345678');
      assert.equal(result.normalized.interests, 'Plantation');
    }
  });

  it('rejects empty or invalid email addresses instead of synthesizing @example.com', () => {
    const emptyEmail = validateJoinApplication({
      name: 'Rahim Mia',
      phone: '01712345678',
      email: '',
      reason: 'Want to join the village group',
    });
    assert.deepEqual(emptyEmail, { valid: false, errorCode: 'invalid_email' });

    const placeholderEmail = validateJoinApplication({
      name: 'Rahim Mia',
      phone: '01712345678',
      email: 'rahim@example.com',
      reason: 'Want to join the village group',
    });
    assert.deepEqual(placeholderEmail, { valid: false, errorCode: 'placeholder_email' });
  });

  it('rejects whitespace-only name, phone, or short reason', () => {
    assert.deepEqual(
      validateJoinApplication({
        name: ' ',
        phone: '01712345678',
        email: 'a@gmail.com',
        reason: 'Want to help',
      }),
      { valid: false, errorCode: 'missing_name' }
    );
    assert.deepEqual(
      validateJoinApplication({
        name: 'Karim',
        phone: '123',
        email: 'a@gmail.com',
        reason: 'Want to help',
      }),
      { valid: false, errorCode: 'missing_phone' }
    );
    assert.deepEqual(
      validateJoinApplication({
        name: 'Karim',
        phone: '01712345678',
        email: 'a@gmail.com',
        reason: 'hi',
      }),
      { valid: false, errorCode: 'missing_reason' }
    );
  });
});

describe('nextSequentialCode', () => {
  it('starts at 001 when empty', () => {
    assert.equal(nextSequentialCode('SMK', [], 2026), 'SMK-2026-001');
  });

  it('avoids collisions after deletions and formats 10+ cleanly without extra leading zero', () => {
    assert.equal(
      nextSequentialCode('SMK', ['SMK-2026-001', 'SMK-2026-009', undefined], 2026),
      'SMK-2026-010'
    );
    assert.equal(
      nextSequentialCode('VCH', ['VCH-2025-004', 'VCH-2026-012'], 2026),
      'VCH-2026-013'
    );
  });
});

describe('parseLocalIsoDate', () => {
  it('parses YYYY-MM-DD in local time without shifting day backward', () => {
    const parsed = parseLocalIsoDate('2026-05-10');
    assert.ok(parsed);
    assert.equal(parsed.getFullYear(), 2026);
    assert.equal(parsed.getMonth(), 4); // May is 4
    assert.equal(parsed.getDate(), 10);
  });

  it('returns null on invalid or empty input', () => {
    assert.equal(parseLocalIsoDate(''), null);
    assert.equal(parseLocalIsoDate(undefined), null);
    assert.equal(parseLocalIsoDate('2026-02-31'), null);
  });
});

describe('safeLower, translateWithFallback, parseTagList', () => {
  it('safeLower never throws on undefined/null/number', () => {
    assert.equal(safeLower(undefined), '');
    assert.equal(safeLower(null), '');
    assert.equal(safeLower(123), '');
    assert.equal(safeLower('SalMikkhang'), 'salmikkhang');
  });

  it('translateWithFallback falls back to non-empty language when bn is blank', () => {
    assert.equal(translateWithFallback('bn', 'Tree Plantation', ''), 'Tree Plantation');
    assert.equal(translateWithFallback('bn', 'Tree Plantation', undefined), 'Tree Plantation');
    assert.equal(translateWithFallback('bn', 'Tree Plantation', 'বৃক্ষরোপণ'), 'বৃক্ষরোপণ');
    assert.equal(translateWithFallback('en', '', 'বৃক্ষরোপণ'), 'বৃক্ষরোপণ');
  });

  it('parseTagList removes blank tokens and duplicates', () => {
    assert.deepEqual(parseTagList('  , Teaching, Design, teaching , '), ['Teaching', 'Design']);
    assert.deepEqual(parseTagList('   '), []);
  });
});
