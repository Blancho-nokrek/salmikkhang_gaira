import { Member, MemberStatus } from '../types';

export const MEMBER_STATUS_OPTIONS: readonly MemberStatus[] = [
  'Active',
  'On-Leave',
  'Inactive',
] as const;

const STATUS_INTEREST_PREFIX = '__status:';
const ON_LEAVE_INTEREST_MARKER = `${STATUS_INTEREST_PREFIX}On-Leave`;

export interface MemberStatusMeta {
  status: MemberStatus;
  labelEn: string;
  labelBn: string;
  shortLabelEn: string;
  shortLabelBn: string;
  tone: 'emerald' | 'amber' | 'slate';
}

export const MEMBER_STATUS_META: Record<MemberStatus, MemberStatusMeta> = {
  Active: {
    status: 'Active',
    labelEn: 'Active',
    labelBn: 'সক্রিয়',
    shortLabelEn: 'Active',
    shortLabelBn: 'সক্রিয়',
    tone: 'emerald',
  },
  'On-Leave': {
    status: 'On-Leave',
    labelEn: 'On-Leave',
    labelBn: 'ছুটিতে',
    shortLabelEn: 'On-Leave',
    shortLabelBn: 'ছুটিতে',
    tone: 'amber',
  },
  Inactive: {
    status: 'Inactive',
    labelEn: 'Inactive',
    labelBn: 'নিষ্ক্রিয়',
    shortLabelEn: 'Inactive',
    shortLabelBn: 'নিষ্ক্রিয়',
    tone: 'slate',
  },
};

export function normalizeMemberStatus(raw?: string | null): MemberStatus {
  const cleaned = (raw || '').trim().toLowerCase();
  if (cleaned === 'on-leave' || cleaned === 'on leave' || cleaned === 'leave') {
    return 'On-Leave';
  }
  if (cleaned === 'inactive') {
    return 'Inactive';
  }
  return 'Active';
}

export function getMemberStatusMeta(status?: string | null): MemberStatusMeta {
  return MEMBER_STATUS_META[normalizeMemberStatus(status)];
}

/**
 * Strips internal status markers from a member's interests list so UI never leaks markers.
 */
export function stripStatusInterestMarkers(interests?: string[] | null): string[] {
  if (!Array.isArray(interests)) return [];
  return interests.filter(
    (entry): entry is string =>
      typeof entry === 'string' && !entry.startsWith(STATUS_INTEREST_PREFIX)
  );
}

/**
 * Encodes MemberStatus for Firestore while staying 100% compatible with
 * deployed rules where `members.status` accepts `['Active', 'Inactive']`.
 * `'On-Leave'` members stay `'Active'` in Firestore access rules (keeping portal login)
 * and carry a clean internal marker inside `interests`.
 */
export function encodeMemberStatusForFirestore(
  status?: MemberStatus | string | null,
  interests?: string[] | null
): {
  firestoreStatus: 'Active' | 'Inactive';
  encodedInterests: string[];
} {
  const normalized = normalizeMemberStatus(status);
  const cleanInterests = stripStatusInterestMarkers(interests);

  if (normalized === 'Inactive') {
    return {
      firestoreStatus: 'Inactive',
      encodedInterests: cleanInterests.slice(0, 20),
    };
  }

  if (normalized === 'On-Leave') {
    return {
      firestoreStatus: 'Active',
      encodedInterests: [...cleanInterests.slice(0, 19), ON_LEAVE_INTEREST_MARKER],
    };
  }

  return {
    firestoreStatus: 'Active',
    encodedInterests: cleanInterests.slice(0, 20),
  };
}

/**
 * Hydrates a raw Firestore member document into an app Member with resolved
 * `'Active' | 'On-Leave' | 'Inactive'` status and cleaned `interests`.
 */
export function hydrateMemberStatus<T extends { status?: string; interests?: string[] }>(
  raw: T
): Omit<T, 'status' | 'interests'> & { status: MemberStatus; interests: string[] } {
  const rawInterests = Array.isArray(raw.interests) ? raw.interests : [];
  let status: MemberStatus = normalizeMemberStatus(raw.status);

  if (status === 'Active' && rawInterests.includes(ON_LEAVE_INTEREST_MARKER)) {
    status = 'On-Leave';
  }

  return {
    ...raw,
    status,
    interests: stripStatusInterestMarkers(rawInterests),
  };
}

export interface DirectoryFilterCriteria {
  search: string;
  bloodGroup: string;
  village: string;
  status: 'All' | MemberStatus;
}

export function filterMembersDirectory(
  members: Member[],
  criteria: DirectoryFilterCriteria
): Member[] {
  const q = criteria.search.trim().toLowerCase();

  return members.filter((m) => {
    const normalizedStatus = normalizeMemberStatus(m.status);
    const matchesSearch =
      !q ||
      (m.name || '').toLowerCase().includes(q) ||
      (m.village || '').toLowerCase().includes(q) ||
      (m.role || '').toLowerCase().includes(q) ||
      (m.memberNo || '').toLowerCase().includes(q) ||
      normalizedStatus.toLowerCase().includes(q) ||
      (Array.isArray(m.skills) ? m.skills : []).some((s) =>
        s.toLowerCase().includes(q)
      );

    const matchesBlood =
      criteria.bloodGroup === 'All' || m.bloodGroup === criteria.bloodGroup;
    const matchesVillage =
      criteria.village === 'All' || m.village === criteria.village;
    const matchesStatus =
      criteria.status === 'All' || normalizedStatus === criteria.status;

    return matchesSearch && matchesBlood && matchesVillage && matchesStatus;
  });
}

export interface MemberStatusSummary {
  total: number;
  active: number;
  onLeave: number;
  inactive: number;
}

export function summarizeMemberStatuses(members: Member[]): MemberStatusSummary {
  let active = 0;
  let onLeave = 0;
  let inactive = 0;

  for (const m of members) {
    const st = normalizeMemberStatus(m.status);
    if (st === 'On-Leave') onLeave += 1;
    else if (st === 'Inactive') inactive += 1;
    else active += 1;
  }

  return {
    total: members.length,
    active,
    onLeave,
    inactive,
  };
}
