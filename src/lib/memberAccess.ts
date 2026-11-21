export type MemberAccessNoticeStatus = 'declined' | 'inactive' | 'failed';

export interface PortalAccessCheckResult {
  allowed: boolean;
  isAdmin: boolean;
  role: string | null;
  reason?: 'ok' | 'not_found' | 'inactive' | 'firestore_unavailable';
}

export interface PortalAccessOutcome {
  unlocked: boolean;
  noticeStatus: MemberAccessNoticeStatus | null;
  /**
   * Unregistered accounts must NEVER automatically send a join request to Admin.
   * Users must explicitly complete and submit the Membership Application form.
   */
  shouldAutoCreateRequest: false;
}

export function resolvePortalAccessOutcome(
  targetPortal: 'member' | 'admin',
  access: PortalAccessCheckResult
): PortalAccessOutcome {
  if (targetPortal === 'admin') {
    if (access.allowed && access.isAdmin) {
      return { unlocked: true, noticeStatus: null, shouldAutoCreateRequest: false };
    }
    if (access.reason === 'firestore_unavailable') {
      return { unlocked: false, noticeStatus: 'failed', shouldAutoCreateRequest: false };
    }
    return { unlocked: false, noticeStatus: 'declined', shouldAutoCreateRequest: false };
  }

  if (access.allowed) {
    return { unlocked: true, noticeStatus: null, shouldAutoCreateRequest: false };
  }
  if (access.reason === 'inactive') {
    return { unlocked: false, noticeStatus: 'inactive', shouldAutoCreateRequest: false };
  }
  if (access.reason === 'firestore_unavailable') {
    return { unlocked: false, noticeStatus: 'failed', shouldAutoCreateRequest: false };
  }
  return { unlocked: false, noticeStatus: 'declined', shouldAutoCreateRequest: false };
}

export interface JoinApplicationInput {
  name: string;
  phone: string;
  email: string;
  skills?: string;
  interests?: string;
  reason: string;
}

export type JoinValidationErrorCode =
  | 'missing_name'
  | 'missing_phone'
  | 'invalid_email'
  | 'placeholder_email'
  | 'missing_reason';

export type JoinValidationResult =
  | {
      valid: true;
      normalized: {
        name: string;
        phone: string;
        email: string;
        skills: string;
        interests: string;
        reason: string;
      };
    }
  | {
      valid: false;
      errorCode: JoinValidationErrorCode;
    };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const BLOCKED_PLACEHOLDER_DOMAINS = ['@example.com', '@example.org', '@example.net', '@test.com'];

export function validateJoinApplication(input: JoinApplicationInput): JoinValidationResult {
  const name = (input.name || '').trim();
  const phone = (input.phone || '').trim();
  const email = (input.email || '').trim().toLowerCase();
  const skills = (input.skills || '').trim();
  const interests = (input.interests || '').trim();
  const reason = (input.reason || '').trim();

  if (name.length < 2) {
    return { valid: false, errorCode: 'missing_name' };
  }
  if (phone.length < 6) {
    return { valid: false, errorCode: 'missing_phone' };
  }
  if (!EMAIL_PATTERN.test(email)) {
    return { valid: false, errorCode: 'invalid_email' };
  }
  if (BLOCKED_PLACEHOLDER_DOMAINS.some((domain) => email.endsWith(domain))) {
    return { valid: false, errorCode: 'placeholder_email' };
  }
  if (reason.length < 5) {
    return { valid: false, errorCode: 'missing_reason' };
  }

  return {
    valid: true,
    normalized: {
      name,
      phone,
      email,
      skills,
      interests,
      reason,
    },
  };
}

export function nextSequentialCode(
  prefix: string,
  existingCodes: Array<string | undefined | null>,
  year: number = new Date().getFullYear()
): string {
  const normalizedPrefix = prefix.trim().toUpperCase();
  let maxNumber = 0;

  for (const rawCode of existingCodes) {
    if (typeof rawCode !== 'string') continue;
    const trimmed = rawCode.trim().toUpperCase();
    if (!trimmed.startsWith(`${normalizedPrefix}-`)) continue;
    const match = trimmed.match(/(\d+)$/);
    if (!match) continue;
    const parsed = Number.parseInt(match[1], 10);
    if (Number.isFinite(parsed) && parsed > maxNumber) {
      maxNumber = parsed;
    }
  }

  return `${normalizedPrefix}-${year}-${String(maxNumber + 1).padStart(3, '0')}`;
}

export function parseLocalIsoDate(dateStr?: string | null): Date | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const trimmed = dateStr.trim();
  if (!trimmed) return null;

  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const year = Number.parseInt(isoMatch[1], 10);
    const month = Number.parseInt(isoMatch[2], 10);
    const day = Number.parseInt(isoMatch[3], 10);
    const localDate = new Date(year, month - 1, day);
    if (
      localDate.getFullYear() === year &&
      localDate.getMonth() === month - 1 &&
      localDate.getDate() === day
    ) {
      return localDate;
    }
    return null;
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function safeLower(val: unknown): string {
  return typeof val === 'string' ? val.toLowerCase() : '';
}

export function translateWithFallback(
  language: 'en' | 'bn',
  en?: string | null,
  bn?: string | null
): string {
  const enStr = typeof en === 'string' ? en : '';
  const bnStr = typeof bn === 'string' ? bn : '';
  if (language === 'bn') {
    return bnStr.trim() ? bnStr : enStr;
  }
  return enStr.trim() ? enStr : bnStr;
}

export function parseTagList(raw?: string | null): string[] {
  if (typeof raw !== 'string') return [];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const part of raw.split(',')) {
    const cleaned = part.trim();
    if (!cleaned) continue;
    const key = cleaned.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(cleaned);
  }
  return result;
}
