import {
  buildDefaultSubject,
  normalizeEmail,
  type GmailNotificationDraft,
  type NotificationContentKind,
} from './gmailNotifications.ts';

export const MAX_AUTO_NOTIFY_RECIPIENTS = 200;

export interface AutoNotifyPayload {
  recipients: string[];
  subject: string;
  draft: GmailNotificationDraft;
}

export interface SmtpRuntimeConfig {
  configured: boolean;
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromName: string;
}

export interface BuiltAutoEmail {
  subject: string;
  text: string;
  html: string;
  from: string;
}

function stripHeaderControls(input: string, maxLen: number): string {
  return input.replace(/[\r\n\t]+/g, ' ').trim().slice(0, maxLen);
}

function sanitizeSafeUrl(raw?: string): string {
  const fallback = 'https://salmikkhang.vercel.app/';
  if (!raw || typeof raw !== 'string') return fallback;
  const trimmed = raw.trim();
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.toString();
    }
  } catch {
    // Ignore invalid URL
  }
  return fallback;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const VALID_KINDS: NotificationContentKind[] = ['notice', 'news', 'event', 'project'];

export function validateAutoNotifyPayload(
  rawBody: unknown
): { ok: true; payload: AutoNotifyPayload } | { ok: false; error: string } {
  if (!rawBody || typeof rawBody !== 'object') {
    return { ok: false, error: 'Invalid request body.' };
  }
  const body = rawBody as Record<string, unknown>;
  if (!Array.isArray(body.recipients)) {
    return { ok: false, error: 'Recipients list is required.' };
  }

  const dedupedRecipients: string[] = [];
  const seen = new Set<string>();
  for (const rawEmail of body.recipients) {
    if (typeof rawEmail !== 'string') continue;
    const normalized = normalizeEmail(rawEmail);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    dedupedRecipients.push(normalized);
    if (dedupedRecipients.length >= MAX_AUTO_NOTIFY_RECIPIENTS) break;
  }

  if (dedupedRecipients.length === 0) {
    return { ok: false, error: 'No valid recipient email addresses provided.' };
  }

  const rawDraft = body.draft;
  if (!rawDraft || typeof rawDraft !== 'object') {
    return { ok: false, error: 'Notification draft payload is required.' };
  }
  const d = rawDraft as Record<string, unknown>;
  const kind: NotificationContentKind =
    typeof d.kind === 'string' && VALID_KINDS.includes(d.kind as NotificationContentKind)
      ? (d.kind as NotificationContentKind)
      : 'notice';
  const visibility = d.visibility === 'members_only' ? 'members_only' : 'public';
  const titleEn = typeof d.titleEn === 'string' ? stripHeaderControls(d.titleEn, 240) : '';
  const titleBn = typeof d.titleBn === 'string' ? stripHeaderControls(d.titleBn, 240) : undefined;
  if (!titleEn && !titleBn) {
    return { ok: false, error: 'Notification title is required.' };
  }

  const draft: GmailNotificationDraft = {
    kind,
    visibility,
    titleEn: titleEn || titleBn || 'Community Notice',
    titleBn: titleBn || undefined,
    summaryEn: typeof d.summaryEn === 'string' ? d.summaryEn.trim().slice(0, 4000) : '',
    summaryBn: typeof d.summaryBn === 'string' ? d.summaryBn.trim().slice(0, 4000) : undefined,
    date: typeof d.date === 'string' ? stripHeaderControls(d.date, 40) : undefined,
    metaLine: typeof d.metaLine === 'string' ? stripHeaderControls(d.metaLine, 240) : undefined,
    appUrl: sanitizeSafeUrl(typeof d.appUrl === 'string' ? d.appUrl : undefined),
  };

  const subjectRaw =
    typeof body.subject === 'string' && body.subject.trim()
      ? body.subject
      : buildDefaultSubject(draft);
  const subject = stripHeaderControls(subjectRaw, 200);

  return {
    ok: true,
    payload: {
      recipients: dedupedRecipients,
      subject,
      draft,
    },
  };
}

export function resolveSmtpConfig(env: Record<string, string | undefined>): SmtpRuntimeConfig {
  const user = (env.SMTP_USER || '').trim();
  const pass = (env.SMTP_PASS || '').trim();
  const fromName = stripHeaderControls(env.SMTP_FROM_NAME || 'Salmikkhang Community', 80);
  const isGmail = user.toLowerCase().endsWith('@gmail.com');
  const host = (env.SMTP_HOST || (isGmail ? 'smtp.gmail.com' : '')).trim();
  const parsedPort = Number(env.SMTP_PORT || (host === 'smtp.gmail.com' ? 465 : 587));
  const port = Number.isFinite(parsedPort) && parsedPort > 0 ? parsedPort : 465;
  const secure = port === 465;

  return {
    configured: Boolean(host && user && pass),
    host,
    port,
    secure,
    user,
    pass,
    fromName,
  };
}

function getKindBadge(kind: NotificationContentKind): { en: string; bn: string; color: string } {
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

export function buildAutoNotificationEmail(
  payload: AutoNotifyPayload,
  senderEmail: string,
  fromName: string = 'Salmikkhang Community'
): BuiltAutoEmail {
  const { draft, subject } = payload;
  const badge = getKindBadge(draft.kind);
  const safeAppUrl = sanitizeSafeUrl(draft.appUrl);
  const safeFromName = stripHeaderControls(fromName, 80);

  const text = [
    'SALMIKKHANG VILLAGE YOUTH COMMUNITY',
    `${badge.en} / ${badge.bn}`,
    '',
    draft.titleEn,
    draft.titleBn && draft.titleBn !== draft.titleEn ? draft.titleBn : '',
    draft.metaLine ? `Details: ${draft.metaLine}` : '',
    '',
    draft.summaryEn,
    draft.summaryBn && draft.summaryBn !== draft.summaryEn ? `\n${draft.summaryBn}` : '',
    '',
    `Open Salmikkhang Portal: ${safeAppUrl}`,
    `Automatic notification from ${senderEmail}`,
  ]
    .filter((line) => line !== undefined)
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#f0fdf4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0f172a;">
    <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:18px;border:1px solid #d1fae5;overflow:hidden;">
      <div style="background:#064e3b;padding:20px 24px;color:#ffffff;">
        <div style="font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#a7f3d0;">
          Salmikkhang Village Youth Community · সালমিকখাং
        </div>
        <div style="display:inline-block;margin-top:8px;padding:4px 10px;border-radius:8px;background:${badge.color};font-size:12px;font-weight:700;color:#ffffff;">
          ${escapeHtml(badge.en)} · ${escapeHtml(badge.bn)}
        </div>
      </div>
      <div style="padding:24px;">
        <h1 style="margin:0 0 6px;font-size:20px;line-height:1.35;color:#0f172a;">${escapeHtml(draft.titleEn)}</h1>
        ${
          draft.titleBn && draft.titleBn !== draft.titleEn
            ? `<h2 style="margin:0 0 12px;font-size:16px;font-weight:600;color:#065f46;">${escapeHtml(draft.titleBn)}</h2>`
            : ''
        }
        ${
          draft.metaLine
            ? `<div style="margin:0 0 16px;padding:10px 12px;border-radius:10px;background:#ecfdf5;font-size:12px;font-weight:600;color:#065f46;">${escapeHtml(draft.metaLine)}</div>`
            : ''
        }
        ${
          draft.summaryEn
            ? `<p style="margin:0 0 12px;font-size:14px;line-height:1.65;color:#1e293b;white-space:pre-line;">${escapeHtml(draft.summaryEn)}</p>`
            : ''
        }
        ${
          draft.summaryBn && draft.summaryBn !== draft.summaryEn
            ? `<p style="margin:0 0 12px;font-size:14px;line-height:1.65;color:#334155;white-space:pre-line;">${escapeHtml(draft.summaryBn)}</p>`
            : ''
        }
        <div style="margin-top:20px;">
          <a href="${escapeHtml(safeAppUrl)}" style="display:inline-block;padding:12px 20px;border-radius:10px;background:#047857;color:#ffffff;text-decoration:none;font-weight:700;font-size:13px;">
            Open Salmikkhang Portal · পোর্টাল খুলুন →
          </a>
        </div>
      </div>
      <div style="padding:14px 24px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:11px;color:#64748b;">
        Automatic community alert · ${escapeHtml(senderEmail)} · Gaira, Jolchotro, Madhupur, Tangail
      </div>
    </div>
  </body>
</html>`;

  return {
    subject,
    text,
    html,
    from: `"${safeFromName.replace(/"/g, '')}" <${senderEmail}>`,
  };
}
