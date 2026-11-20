export interface LegacyDemoMemberEntry {
  id: string;
  email: string;
}

export const LEGACY_DEMO_EVENT_IDS = ['ev-1', 'ev-2', 'ev-3', 'ev-4'] as const;
export const LEGACY_DEMO_NEWS_IDS = ['n-1', 'n-2', 'n-3'] as const;
export const LEGACY_DEMO_NOTIFICATION_IDS = ['notif-1', 'notif-2'] as const;
export const LEGACY_DEMO_PROJECT_IDS = ['p-1', 'p-2', 'p-3', 'p-4'] as const;
export const LEGACY_DEMO_GALLERY_IDS = ['g-1', 'g-2', 'g-3', 'g-4', 'g-5'] as const;
export const LEGACY_DEMO_JOIN_REQUEST_IDS = ['jr-1', 'jr-2'] as const;
export const LEGACY_DEMO_MESSAGE_IDS = ['msg-1', 'msg-2'] as const;
export const LEGACY_DEMO_DISCUSSION_IDS = ['d-1'] as const;
export const LEGACY_DEMO_FUND_IDS = ['f-1', 'f-2', 'f-3', 'f-4', 'f-5', 'f-6'] as const;
export const LEGACY_DEMO_RESIDENT_IDS = [
  'res-1',
  'res-2',
  'res-3',
  'res-4',
  'res-5',
  'res-6',
  'res-7',
] as const;

/**
 * Only fake @example.com demo members originally seeded by the starter template.
 * Real admin/member accounts (such as m-0 / salmikkhang@gmail.com or any
 * timestamp-created member m-<Date.now()>) are never included here.
 */
export const LEGACY_DEMO_MEMBER_ENTRIES: readonly LegacyDemoMemberEntry[] = [
  { id: 'm-2', email: 'subrata.cashier@example.com' },
  { id: 'm-3', email: 'riton.assis@example.com' },
  { id: 'm-4', email: 'pritom.data@example.com' },
  { id: 'm-5', email: 'bipul.president@example.com' },
  { id: 'm-6', email: 'suman.org@example.com' },
  { id: 'm-7', email: 'nabila.media@example.com' },
  { id: 'm-8', email: 'rakib.sports@example.com' },
  { id: 'm-9', email: 'ayesha.welfare@example.com' },
  { id: 'm-10', email: 'subir.advisor@example.com' },
  { id: 'm-11', email: 'nusrat.j@example.com' },
  { id: 'm-12', email: 'joyanto.m@example.com' },
] as const;

export type LegacyCollectionName =
  | 'events'
  | 'news'
  | 'notifications'
  | 'projects'
  | 'gallery'
  | 'joinRequests'
  | 'messages'
  | 'discussions'
  | 'funds'
  | 'villageResidents';

const LEGACY_ID_SETS: Record<LegacyCollectionName, ReadonlySet<string>> = {
  events: new Set<string>(LEGACY_DEMO_EVENT_IDS),
  news: new Set<string>(LEGACY_DEMO_NEWS_IDS),
  notifications: new Set<string>(LEGACY_DEMO_NOTIFICATION_IDS),
  projects: new Set<string>(LEGACY_DEMO_PROJECT_IDS),
  gallery: new Set<string>(LEGACY_DEMO_GALLERY_IDS),
  joinRequests: new Set<string>(LEGACY_DEMO_JOIN_REQUEST_IDS),
  messages: new Set<string>(LEGACY_DEMO_MESSAGE_IDS),
  discussions: new Set<string>(LEGACY_DEMO_DISCUSSION_IDS),
  funds: new Set<string>(LEGACY_DEMO_FUND_IDS),
  villageResidents: new Set<string>(LEGACY_DEMO_RESIDENT_IDS),
};

const LEGACY_MEMBER_ID_SET = new Set<string>(LEGACY_DEMO_MEMBER_ENTRIES.map((m) => m.id));

export function isLegacyDemoId(collectionName: LegacyCollectionName, id: string): boolean {
  return LEGACY_ID_SETS[collectionName].has(id);
}

export function isLegacyDemoMemberDoc(id: string, ownerEmail?: string | null): boolean {
  if (!LEGACY_MEMBER_ID_SET.has(id)) return false;
  const normalized = (ownerEmail || '').trim().toLowerCase();
  return !normalized || normalized.endsWith('@example.com');
}

export function filterOutLegacyDemoItems<T extends { id: string }>(
  collectionName: LegacyCollectionName,
  items: T[]
): T[] {
  return items.filter((item) => !isLegacyDemoId(collectionName, item.id));
}

export function filterOutLegacyDemoMembers<
  T extends { id: string; ownerEmail?: string; email?: string },
>(members: T[]): T[] {
  return members.filter(
    (m) => !isLegacyDemoMemberDoc(m.id, m.ownerEmail || m.email)
  );
}
