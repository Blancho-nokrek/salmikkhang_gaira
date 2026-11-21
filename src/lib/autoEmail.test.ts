import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateAutoNotifyPayload,
  resolveSmtpConfig,
  buildAutoNotificationEmail,
} from './autoEmail';

describe('validateAutoNotifyPayload', () => {
  it('validates, deduplicates, strips header injection, and sanitizes unsafe URLs', () => {
    const res = validateAutoNotifyPayload({
      recipients: [
        'Member1@Gmail.com ',
        'member1@gmail.com',
        'invalid-email',
        'fake@example.com',
        'member2@gmail.com',
      ],
      subject: 'Urgent Notice\r\nBcc: attacker@evil.com',
      draft: {
        kind: 'notice',
        visibility: 'members_only',
        titleEn: 'Monthly Meeting\nTonight',
        titleBn: 'মাসিক সভা',
        summaryEn: 'Please join at 7 PM.',
        appUrl: 'javascript:alert(1)',
      },
    });

    assert.equal(res.ok, true);
    if (!res.ok) return;
    assert.deepEqual(res.payload.recipients, ['member1@gmail.com', 'member2@gmail.com']);
    assert.equal(res.payload.subject.includes('\r'), false);
    assert.equal(res.payload.subject.includes('\n'), false);
    assert.equal(res.payload.draft.appUrl, 'https://salmikkhang.vercel.app/');
    assert.equal(res.payload.draft.visibility, 'members_only');
  });

  it('rejects empty recipients or missing title', () => {
    const noRecipients = validateAutoNotifyPayload({
      recipients: ['bad', 'demo@example.com'],
      draft: { kind: 'notice', visibility: 'public', titleEn: 'Hello', summaryEn: 'World' },
    });
    assert.equal(noRecipients.ok, false);

    const noTitle = validateAutoNotifyPayload({
      recipients: ['valid@gmail.com'],
      draft: { kind: 'notice', visibility: 'public', titleEn: '   ', summaryEn: 'World' },
    });
    assert.equal(noTitle.ok, false);
  });
});

describe('resolveSmtpConfig', () => {
  it('defaults to Gmail SSL SMTP when SMTP_USER is a Gmail address', () => {
    const cfg = resolveSmtpConfig({
      SMTP_USER: 'salmikkhang@gmail.com',
      SMTP_PASS: 'app-pass-placeholder',
    });
    assert.equal(cfg.configured, true);
    assert.equal(cfg.host, 'smtp.gmail.com');
    assert.equal(cfg.port, 465);
    assert.equal(cfg.secure, true);
  });

  it('reports configured: false when SMTP credentials are absent', () => {
    const cfg = resolveSmtpConfig({});
    assert.equal(cfg.configured, false);
  });
});

describe('buildAutoNotificationEmail', () => {
  it('escapes HTML entities in title and summary and preserves bilingual text', () => {
    const validated = validateAutoNotifyPayload({
      recipients: ['alice@gmail.com'],
      draft: {
        kind: 'notice',
        visibility: 'public',
        titleEn: '<script>alert(1)</script> Meeting',
        titleBn: 'জরুরি নোটিশ',
        summaryEn: 'Bring <notes> & water.',
        appUrl: 'https://salmikkhang.example.org/',
      },
    });
    assert.equal(validated.ok, true);
    if (!validated.ok) return;

    const email = buildAutoNotificationEmail(validated.payload, 'salmikkhang@gmail.com');
    assert.equal(email.html.includes('<script>'), false);
    assert.ok(email.html.includes('&lt;script&gt;alert(1)&lt;/script&gt; Meeting'));
    assert.ok(email.html.includes('জরুরি নোটিশ'));
    assert.ok(email.text.includes('https://salmikkhang.example.org/'));
    assert.equal(email.from, '"Salmikkhang Community" <salmikkhang@gmail.com>');
  });
});
