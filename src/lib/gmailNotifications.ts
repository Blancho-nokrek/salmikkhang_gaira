import type {
  CommunityEvent,
  ContactMessage,
  JoinRequest,
  Member,
  NewsItem,
  Project,
} from '../types';

export const GMAIL_SUBSCRIBER_MARKER = '[GMAIL_SUBSCRIBER]';
export const DEFAULT_GMAIL_SENDER = 'salmikkhang@gmail.com';
export const MAX_BCC_PER_BATCH = 80;

export type NotificationContentKind = 'notice' | 'news' | 'event' | 'project';

export interface GmailSubscriberRecord {
  id: string;
  name: string;
  email: string;
  date: string;
}

export interface GmailNotificationDraft {
  kind: NotificationContentKind;
  visibility: 'public' | 'members_only';
  titleEn: string;
  titleBn?: string;
  summaryEn: string;
  summaryBn?: string;
  date?: string;
  metaLine?: string;
  appUrl?: string;
}

export interface RecipientCollectionResult {
  allEmails: string[];
  memberEmails: string[];
  subscriberEmails: string[];
}

export interface GmailSendResult {
  senderEmail: string;
  totalRecipients: number;
  sentCount: number;
  failedRecipients: number;
  messageIds: string[];
  authExpired?: boolean;
  errorMessage?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function normalizeEmail(raw?: string | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim().toLowerCase();
  if (!EMAIL_REGEX.test(trimmed)) return null;
  if (trimmed.endsWith('@example.com')) return null;
  return trimmed;
}

export function isSubscriberMessage(msg: Pick<ContactMessage, 'message' | 'contact'>): boolean {
  return (
    typeof msg.message === 'string' &&
    msg.message.startsWith(GMAIL_SUBSCRIBER_MARKER) &&
    normalizeEmail(msg.contact) !== null
  );
}

export function extractGmailSubscribers(messages: ContactMessage[]): GmailSubscriberRecord[] {
  const seen = new Set<string>();
  const subscribers: GmailSubscriberRecord[] = [];
  for (const msg of messages) {
    if (!isSubscriberMessage(msg)) continue;
    const email = normalizeEmail(msg.contact);
    if (!email || seen.has(email)) continue;
    seen.add(email);
    subscribers.push({
      id: msg.id,
      name: msg.name || email.split('@')[0],
      email,
      date: msg.date || '',
    });
  }
  return subscribers;
}

export function collectNotificationRecipients(params: {
  members: Member[];
  messages: ContactMessage[];
  joinRequests?: JoinRequest[];
  visibility: 'public' | 'members_only';
  extraEmails?: string[];
  excludeSenderEmail?: string | null;
}): RecipientCollectionResult {
  const senderLower = params.excludeSenderEmail
    ? params.excludeSenderEmail.trim().toLowerCase()
    : null;

  const memberSet = new Set<string>();
  for (const member of params.members) {
    if (member.status === 'Inactive') continue;
    const primary = normalizeEmail(member.email);
    const owner = normalizeEmail(member.ownerEmail);
    if (primary) memberSet.add(primary);
    if (owner) memberSet.add(owner);
  }

  const subscriberSet = new Set<string>();
  if (params.visibility === 'public') {
    for (const sub of extractGmailSubscribers(params.messages)) {
      if (!memberSet.has(sub.email)) {
        subscriberSet.add(sub.email);
      }
    }
    for (const req of params.joinRequests || []) {
      if (req.status === 'Rejected') continue;
      const email = normalizeEmail(req.email);
      if (email && !memberSet.has(email)) {
        subscriberSet.add(email);
      }
    }
  }

  const extraSet = new Set<string>();
  for (const raw of params.extraEmails || []) {
    const email = normalizeEmail(raw);
    if (email && !memberSet.has(email) && !subscriberSet.has(email)) {
      extraSet.add(email);
    }
  }

  const allSet = new Set<string>([...memberSet, ...subscriberSet, ...extraSet]);
  if (senderLower && allSet.size > 1) {
    allSet.delete(senderLower);
  }

  const filterSender = (list: string[]) =>
    senderLower && allSet.size > 0 ? list.filter((e) => e !== senderLower) : list;

  return {
    allEmails: Array.from(allSet),
    memberEmails: filterSender(Array.from(memberSet)),
    subscriberEmails: filterSender([...subscriberSet, ...extraSet]),
  };
}

export function buildDraftFromNews(item: Omit<NewsItem, 'id'> | NewsItem, appUrl?: string): GmailNotificationDraft {
  const isNotice = (item.category || '').toLowerCase().includes('notice');
  return {
    kind: isNotice ? 'notice' : 'news',
    visibility: item.visibility === 'members_only' ? 'members_only' : 'public',
    titleEn: item.title,
    titleBn: item.titleBn,
    summaryEn: item.summary || item.content || '',
    summaryBn: item.summaryBn || item.contentBn || '',
    date: item.date,
    metaLine: [item.category, item.date, item.pdfAttachment ? `PDF: ${item.pdfAttachment.fileName}` : '']
      .filter(Boolean)
      .join(' · '),
    appUrl,
  };
}

export function buildDraftFromEvent(ev: Omit<CommunityEvent, 'id' | 'rsvps'> | CommunityEvent, appUrl?: string): GmailNotificationDraft {
  return {
    kind: 'event',
    visibility: ev.visibility === 'members_only' ? 'members_only' : 'public',
    titleEn: ev.title,
    titleBn: ev.titleBn,
    summaryEn: ev.description || '',
    summaryBn: ev.descriptionBn || '',
    date: ev.date,
    metaLine: [ev.date, ev.time, ev.location].filter(Boolean).join(' · '),
    appUrl,
  };
}

export function buildDraftFromProject(proj: Omit<Project, 'id'> | Project, appUrl?: string): GmailNotificationDraft {
  return {
    kind: 'project',
    visibility: 'public',
    titleEn: proj.title,
    titleBn: proj.titleBn,
    summaryEn: proj.description || '',
    summaryBn: proj.descriptionBn || '',
    metaLine: [
      proj.category,
      proj.status,
      typeof proj.progress === 'number' ? `${proj.progress}% progress` : '',
    ]
      .filter(Boolean)
      .join(' · '),
    appUrl,
  };
}

function getKindLabels(kind: NotificationContentKind): { en: string; bn: string; color: string } {
  switch (kind) {
    case 'notice':
      return { en: 'Official Notice', bn: 'অফিসিয়াল নোটিশ', color: '#047857' };
    case 'event':
      return { en: 'Community Event', bn: 'নতুন অনুষ্ঠান', color: '#0369A1' };
    case 'project':
      return { en: 'Village Project', bn: 'নতুন প্রকল্প', color: '#6D28D9' };
    case 'news':
    default:
      return { en: 'Community News', bn: 'কমিউনিটি সংবাদ', color: '#0F766E' };
  }
}

export function buildDefaultSubject(draft: GmailNotificationDraft): string {
  const labels = getKindLabels(draft.kind);
  const audienceTag = draft.visibility === 'members_only' ? '[Members] ' : '';
  const titlePart =
    draft.titleBn && draft.titleBn.trim() && draft.titleBn.trim() !== draft.titleEn.trim()
      ? `${draft.titleEn} | ${draft.titleBn}`
      : draft.titleEn;
  return `${audienceTag}[Salmikkhang ${labels.en}] ${titlePart}`.slice(0, 180);
}

function utf8ToBase64(input: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(input, 'utf-8').toString('base64');
  }
  const bytes = new TextEncoder().encode(input);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

export function toBase64Url(input: string): string {
  return utf8ToBase64(input)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

export function encodeMimeHeaderUtf8(value: string): string {
  const clean = value.replace(/[\r\n]+/g, ' ').trim();
  if (/^[\x20-\x7E]*$/.test(clean)) return clean;
  return `=?UTF-8?B?${utf8ToBase64(clean)}?=`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function chunkRecipients(
  recipients: string[],
  maxPerBatch: number = MAX_BCC_PER_BATCH
): string[][] {
  const chunks: string[][] = [];
  for (let i = 0; i < recipients.length; i += maxPerBatch) {
    chunks.push(recipients.slice(i, i + maxPerBatch));
  }
  return chunks;
}

export function buildGmailRawMessages(params: {
  senderEmail: string;
  recipients: string[];
  subject: string;
  draft: GmailNotificationDraft;
  customNote?: string;
  maxPerBatch?: number;
}): { bcc: string[]; raw: string }[] {
  const labels = getKindLabels(params.draft.kind);
  const safeAppUrl = params.draft.appUrl || 'https://salmikkhang.vercel.app/';
  const boundary = `salmikkhang_alt_${Date.now().toString(36)}`;

  const plainLines = [
    `SALMIKKHANG VILLAGE YOUTH COMMUNITY`,
    `${labels.en} / ${labels.bn}`,
    '',
    params.draft.titleEn,
    params.draft.titleBn && params.draft.titleBn !== params.draft.titleEn ? params.draft.titleBn : '',
    params.draft.metaLine ? `Details: ${params.draft.metaLine}` : '',
    '',
    params.draft.summaryEn,
    params.draft.summaryBn && params.draft.summaryBn !== params.draft.summaryEn
      ? `\n${params.draft.summaryBn}`
      : '',
    params.customNote ? `\nNote: ${params.customNote}` : '',
    '',
    `Open Salmikkhang Portal: ${safeAppUrl}`,
    `Sent via ${params.senderEmail}`,
  ]
    .filter((line) => line !== undefined)
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const htmlBody = `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#f0fdf4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0f172a;">
    <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:18px;border:1px solid #d1fae5;overflow:hidden;">
      <div style="background:#064e3b;padding:20px 24px;color:#ffffff;">
        <div style="font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#a7f3d0;">
          Salmikkhang Village Youth Community · সালমিকখাং
        </div>
        <div style="display:inline-block;margin-top:8px;padding:4px 10px;border-radius:8px;background:${labels.color};font-size:12px;font-weight:700;color:#ffffff;">
          ${escapeHtml(labels.en)} · ${escapeHtml(labels.bn)}
        </div>
      </div>
      <div style="padding:24px;">
        <h1 style="margin:0 0 6px;font-size:20px;line-height:1.35;color:#0f172a;">${escapeHtml(params.draft.titleEn)}</h1>
        ${
          params.draft.titleBn && params.draft.titleBn !== params.draft.titleEn
            ? `<h2 style="margin:0 0 12px;font-size:16px;font-weight:600;color:#065f46;">${escapeHtml(params.draft.titleBn)}</h2>`
            : ''
        }
        ${
          params.draft.metaLine
            ? `<div style="margin:0 0 16px;padding:10px 12px;border-radius:10px;background:#ecfdf5;font-size:12px;font-weight:600;color:#065f46;">${escapeHtml(params.draft.metaLine)}</div>`
            : ''
        }
        ${
          params.draft.summaryEn
            ? `<p style="margin:0 0 12px;font-size:14px;line-height:1.65;color:#1e293b;white-space:pre-line;">${escapeHtml(params.draft.summaryEn)}</p>`
            : ''
        }
        ${
          params.draft.summaryBn && params.draft.summaryBn !== params.draft.summaryEn
            ? `<p style="margin:0 0 12px;font-size:14px;line-height:1.65;color:#334155;white-space:pre-line;">${escapeHtml(params.draft.summaryBn)}</p>`
            : ''
        }
        ${
          params.customNote
            ? `<div style="margin:16px 0;padding:12px;border-left:3px solid #10b981;background:#f8fafc;font-size:13px;color:#334155;">${escapeHtml(params.customNote)}</div>`
            : ''
        }
        <div style="margin-top:20px;">
          <a href="${escapeHtml(safeAppUrl)}" style="display:inline-block;padding:12px 20px;border-radius:10px;background:#047857;color:#ffffff;text-decoration:none;font-weight:700;font-size:13px;">
            Open Salmikkhang Portal · অ্যাপ খুলুন →
          </a>
        </div>
      </div>
      <div style="padding:14px 24px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:11px;color:#64748b;">
        Sent from ${escapeHtml(params.senderEmail)} · Gaira, Jolchotro, Madhupur, Tangail
      </div>
    </div>
  </body>
</html>`;

  const batches = chunkRecipients(params.recipients, params.maxPerBatch || MAX_BCC_PER_BATCH);

  return batches.map((bccList) => {
    const headers = [
      `From: ${encodeMimeHeaderUtf8('Salmikkhang Community')} <${params.senderEmail}>`,
      `To: ${params.senderEmail}`,
      `Bcc: ${bccList.join(', ')}`,
      `Subject: ${encodeMimeHeaderUtf8(params.subject)}`,
      'MIME-Version: 1.0',
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
    ];

    const mime = [
      ...headers,
      '',
      `--${boundary}`,
      'Content-Type: text/plain; charset="UTF-8"',
      'Content-Transfer-Encoding: base64',
      '',
      utf8ToBase64(plainLines),
      '',
      `--${boundary}`,
      'Content-Type: text/html; charset="UTF-8"',
      'Content-Transfer-Encoding: base64',
      '',
      utf8ToBase64(htmlBody),
      '',
      `--${boundary}--`,
    ].join('\r\n');

    return {
      bcc: bccList,
      raw: toBase64Url(mime),
    };
  });
}

export async function sendGmailNotificationBatch(params: {
  accessToken: string;
  senderEmail: string;
  recipients: string[];
  subject: string;
  draft: GmailNotificationDraft;
  customNote?: string;
}): Promise<GmailSendResult> {
  if (params.recipients.length === 0) {
    return {
      senderEmail: params.senderEmail,
      totalRecipients: 0,
      sentCount: 0,
      failedRecipients: 0,
      messageIds: [],
      errorMessage: 'No valid recipient Gmail addresses found.',
    };
  }

  const messages = buildGmailRawMessages({
    senderEmail: params.senderEmail,
    recipients: params.recipients,
    subject: params.subject,
    draft: params.draft,
    customNote: params.customNote,
  });

  const messageIds: string[] = [];
  let sentCount = 0;
  let failedRecipients = 0;
  let lastError: string | undefined;
  let authExpired = false;

  for (const batch of messages) {
    const response = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${params.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ raw: batch.raw }),
      }
    );

    if (response.status === 401 || response.status === 403) {
      authExpired = true;
      failedRecipients += batch.bcc.length;
      const errData = await response.json().catch(() => null);
      lastError =
        errData?.error?.message ||
        'Gmail authorization expired or insufficient permissions. Please reconnect salmikkhang@gmail.com.';
      break;
    }

    if (!response.ok) {
      failedRecipients += batch.bcc.length;
      const errData = await response.json().catch(() => null);
      lastError = errData?.error?.message || `Gmail API error (${response.status})`;
      continue;
    }

    const data = await response.json().catch(() => ({}));
    if (data?.id) messageIds.push(data.id);
    sentCount += batch.bcc.length;
  }

  return {
    senderEmail: params.senderEmail,
    totalRecipients: params.recipients.length,
    sentCount,
    failedRecipients,
    messageIds,
    authExpired,
    errorMessage: lastError,
  };
}
