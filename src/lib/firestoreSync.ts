import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  writeBatch,
  collection,
} from 'firebase/firestore';
import {
  db,
  auth,
  OperationType,
  handleFirestoreError,
  isFirestoreConnectivityOrQuotaError,
  BOOTSTRAP_ADMIN_EMAIL,
} from './firebase';
import { encodeMemberStatusForFirestore } from './memberStatus';
import {
  LEGACY_DEMO_DISCUSSION_IDS,
  LEGACY_DEMO_EVENT_IDS,
  LEGACY_DEMO_FUND_IDS,
  LEGACY_DEMO_GALLERY_IDS,
  LEGACY_DEMO_JOIN_REQUEST_IDS,
  LEGACY_DEMO_MEMBER_ENTRIES,
  LEGACY_DEMO_MESSAGE_IDS,
  LEGACY_DEMO_NEWS_IDS,
  LEGACY_DEMO_NOTIFICATION_IDS,
  LEGACY_DEMO_PROJECT_IDS,
  LEGACY_DEMO_RESIDENT_IDS,
  isLegacyDemoMemberDoc,
} from './legacyDemoData';
import type {
  Member,
  VillageResident,
  JoinRequest,
  CommunityEvent,
  NewsItem,
  Project,
  GalleryItem,
  ContactMessage,
  DiscussionPost,
  FundTransaction,
  CommunitySettings,
  MemberNotification,
} from '../types';

export function cleanObj<T extends Record<string, any>>(obj: T): Partial<T> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out as Partial<T>;
}

export function clampStr(val: string | undefined, max: number, fallback = ''): string {
  const s = (val ?? fallback).toString();
  return s.length > max ? s.slice(0, max) : s;
}

export function sanitizeId(id: string): string {
  const clean = id.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 128);
  return clean || `id-${Date.now()}`;
}

// ───────── Payload Builders matching firestore.rules allowlists ─────────
export function toSettingsMainPayload(s: CommunitySettings) {
  return cleanObj({
    name: clampStr(s.name, 160, 'Salmikkhang Village Youth Community'),
    nameBn: clampStr(s.nameBn, 200),
    village: clampStr(s.village, 120, 'Gaira, Jolchotro'),
    address: clampStr(s.address, 240),
    phone: clampStr(s.phone, 40),
    email: clampStr(s.email, 160),
    facebookUrl: clampStr(s.facebookUrl, 300),
    whatsapp: clampStr(s.whatsapp, 160),
    fontStyle: ['editorial', 'youthful', 'heritage', 'civic', 'classic', 'botanical'].includes(s.fontStyle || '')
      ? s.fontStyle
      : 'editorial',
    motto: clampStr(s.motto, 200),
    mottoBn: clampStr(s.mottoBn, 240),
    about: clampStr(s.about, 2000),
    aboutBn: clampStr(s.aboutBn, 2000),
    updatedAt: new Date().toISOString(),
  });
}

export function toMemberPublicPayload(m: Member) {
  const { firestoreStatus, encodedInterests } = encodeMemberStatusForFirestore(
    m.status,
    m.interests
  );
  return cleanObj({
    id: sanitizeId(m.id),
    memberNo: clampStr(m.memberNo, 40, 'SMK-2026-001'),
    name: clampStr(m.name, 120, 'Member'),
    role: clampStr(m.role, 80, 'Member'),
    status: firestoreStatus,
    village: clampStr(m.village, 100, 'Gaira'),
    bloodGroup: clampStr(m.bloodGroup, 10, 'O+'),
    skills: Array.isArray(m.skills) ? m.skills.slice(0, 20).map(s => clampStr(s, 80)) : [],
    interests: encodedInterests.slice(0, 20).map(s => clampStr(s, 80)),
    joinDate: clampStr(m.joinDate, 40, new Date().toISOString().split('T')[0]),
    avatar: m.avatar ? clampStr(m.avatar, 450000) : '',
    bio: clampStr(m.bio, 1000),
    ownerEmail: clampStr((m.ownerEmail || m.email || '').toLowerCase(), 160),
    ...(m.ownerUid ? { ownerUid: clampStr(m.ownerUid, 128) } : {}),
  });
}

export function toMemberPrivatePayload(m: Member) {
  return cleanObj({
    email: clampStr((m.email || '').toLowerCase(), 160),
    phone: clampStr(m.phone, 40),
    ownerEmail: clampStr((m.ownerEmail || m.email || '').toLowerCase(), 160),
    ...(m.ownerUid ? { ownerUid: clampStr(m.ownerUid, 128) } : {}),
  });
}

const VALID_AID_STATUSES = [
  'General Resident',
  'Eligible for Aid',
  'Senior Citizen',
  'Student / Youth',
  'Medical Assistance',
  'Farmer / Daily Wage Earner',
] as const;

export function toResidentPublicPayload(r: VillageResident, uid?: string) {
  return cleanObj({
    id: sanitizeId(r.id),
    residentNo: clampStr(r.residentNo, 40, 'RES-2026-001'),
    name: clampStr(r.name, 120, 'Resident'),
    nameBn: clampStr(r.nameBn, 160),
    village: clampStr(r.village, 100, 'Gaira'),
    para: clampStr(r.para, 100),
    occupation: clampStr(r.occupation, 120, 'Citizen'),
    familyMembersCount: Math.max(1, Math.min(100, Number(r.familyMembersCount) || 1)),
    bloodGroup: clampStr(r.bloodGroup, 10, 'O+'),
    aidStatus: VALID_AID_STATUSES.includes(r.aidStatus as any) ? r.aidStatus : 'General Resident',
    aidStatusBn: clampStr(r.aidStatusBn, 100),
    notes: clampStr(r.notes, 1000),
    collectedBy: clampStr(r.collectedBy, 120, 'Admin Council'),
    collectedByUid: clampStr(r.collectedByUid || uid || auth.currentUser?.uid || 'admin', 128),
    collectedDate: clampStr(r.collectedDate, 40, new Date().toISOString().split('T')[0]),
    ...(r.updatedDate ? { updatedDate: clampStr(r.updatedDate, 40) } : {}),
  });
}

export function toResidentPrivatePayload(r: VillageResident, uid?: string) {
  return cleanObj({
    guardianName: clampStr(r.guardianName, 120),
    phone: clampStr(r.phone, 40),
    nidOrBirthCert: clampStr(r.nidOrBirthCert, 80),
    collectedByUid: clampStr(r.collectedByUid || uid || auth.currentUser?.uid || 'admin', 128),
  });
}

export function toNewsPayload(n: NewsItem) {
  const payload: Record<string, any> = {
    id: sanitizeId(n.id),
    title: clampStr(n.title, 240, 'Notice'),
    titleBn: clampStr(n.titleBn, 300),
    category: clampStr(n.category, 80, 'Notice'),
    categoryBn: clampStr(n.categoryBn, 80),
    date: clampStr(n.date, 40, new Date().toISOString().split('T')[0]),
    summary: clampStr(n.summary, 1000),
    summaryBn: clampStr(n.summaryBn, 1200),
    content: clampStr(n.content, 10000),
    contentBn: clampStr(n.contentBn, 12000),
    image: clampStr(n.image, 450000),
    tagColor: ['green', 'blue', 'purple', 'amber'].includes(n.tagColor) ? n.tagColor : 'green',
    status: n.status === 'Draft' ? 'Draft' : 'Published',
    visibility: n.visibility === 'members_only' ? 'members_only' : 'public',
  };
  if (n.pdfAttachment?.dataUrl) {
    payload.pdfAttachment = cleanObj({
      fileName: clampStr(n.pdfAttachment.fileName, 200, 'document.pdf'),
      fileSize: clampStr(n.pdfAttachment.fileSize, 40),
      dataUrl: clampStr(n.pdfAttachment.dataUrl, 700000),
    });
  }
  return payload;
}

export function toEventPayload(ev: CommunityEvent) {
  return cleanObj({
    id: sanitizeId(ev.id),
    title: clampStr(ev.title, 240, 'Event'),
    titleBn: clampStr(ev.titleBn, 300),
    date: clampStr(ev.date, 40, new Date().toISOString().split('T')[0]),
    time: clampStr(ev.time, 80),
    timeBn: clampStr(ev.timeBn, 100),
    location: clampStr(ev.location, 200),
    locationBn: clampStr(ev.locationBn, 240),
    category: clampStr(ev.category, 80, 'Meeting'),
    categoryBn: clampStr(ev.categoryBn, 80),
    description: clampStr(ev.description, 4000),
    descriptionBn: clampStr(ev.descriptionBn, 5000),
    image: clampStr(ev.image, 450000),
    status: ['Upcoming', 'Past', 'Planning'].includes(ev.status) ? ev.status : 'Upcoming',
    visibility: ev.visibility === 'members_only' ? 'members_only' : 'public',
    rsvps: Array.isArray(ev.rsvps) ? ev.rsvps.slice(0, 500).map(r => clampStr(r, 160)) : [],
  });
}

export function toProjectPayload(p: Project) {
  return cleanObj({
    id: sanitizeId(p.id),
    title: clampStr(p.title, 200, 'Project'),
    titleBn: clampStr(p.titleBn, 240),
    category: clampStr(p.category, 80, 'Community'),
    categoryBn: clampStr(p.categoryBn, 100),
    status: ['Ongoing', 'Planning', 'Completed'].includes(p.status) ? p.status : 'Ongoing',
    statusBn: clampStr(p.statusBn, 80),
    progress: Math.max(0, Math.min(100, Number(p.progress) || 0)),
    description: clampStr(p.description, 4000),
    descriptionBn: clampStr(p.descriptionBn, 5000),
    image: clampStr(p.image, 450000),
    volunteersNeeded: Math.max(0, Number(p.volunteersNeeded) || 0),
    volunteersEnrolled: Math.max(0, Number(p.volunteersEnrolled) || 0),
  });
}

export function toGalleryPayload(g: GalleryItem) {
  return cleanObj({
    id: sanitizeId(g.id),
    title: clampStr(g.title, 200, 'Photo'),
    titleBn: clampStr(g.titleBn, 240),
    category: clampStr(g.category, 80, 'Community'),
    categoryBn: clampStr(g.categoryBn, 100),
    image: clampStr(g.image, 450000, 'placeholder'),
    date: clampStr(g.date, 40, new Date().toISOString().split('T')[0]),
    visibility: 'public',
  });
}

export function toFundPayload(f: FundTransaction, uid?: string) {
  return cleanObj({
    id: sanitizeId(f.id),
    date: clampStr(f.date, 40, new Date().toISOString().split('T')[0]),
    type: f.type === 'Outflow' ? 'Outflow' : 'Inflow',
    amount: Math.max(1, Math.min(100000000, Number(f.amount) || 1)),
    title: clampStr(f.title, 240, 'Transaction'),
    titleBn: clampStr(f.titleBn, 300),
    donorOrBeneficiary: clampStr(f.donorOrBeneficiary, 160, 'Community'),
    category: clampStr(f.category, 80, 'Community Welfare'),
    recordedBy: clampStr(f.recordedBy, 120),
    recordedByUid: clampStr(f.recordedByUid || uid || auth.currentUser?.uid || 'admin', 128),
    voucherNo: clampStr(f.voucherNo, 60),
    notes: clampStr(f.notes, 1000),
  });
}

export function toDiscussionPayload(d: DiscussionPost, uid?: string) {
  return cleanObj({
    id: sanitizeId(d.id),
    authorUid: clampStr(d.authorUid || uid || auth.currentUser?.uid || 'admin', 128),
    authorName: clampStr(d.authorName, 120, 'Member'),
    authorRole: clampStr(d.authorRole, 80, 'Member'),
    ...(d.authorAvatar ? { authorAvatar: clampStr(d.authorAvatar, 450000) } : {}),
    date: clampStr(d.date, 40, new Date().toISOString().split('T')[0]),
    text: clampStr(d.text, 3000, 'Post'),
    category: ['General', 'Project Idea', 'Question', 'Event Prep'].includes(d.category) ? d.category : 'General',
    likes: Math.max(0, Number(d.likes) || 0),
    likedByUids: Array.isArray(d.likedByUids) ? d.likedByUids.slice(0, 500) : [],
    replies: Array.isArray(d.replies) ? d.replies.slice(0, 200) : [],
  });
}

export function toNotificationPayload(n: MemberNotification) {
  const payload: Record<string, any> = {
    id: sanitizeId(n.id),
    title: clampStr(n.title, 240, 'Notification'),
    titleBn: clampStr(n.titleBn, 300),
    message: clampStr(n.message, 1500),
    messageBn: clampStr(n.messageBn, 1500),
    date: clampStr(n.date, 40, new Date().toISOString().split('T')[0]),
    type: ['notice', 'event', 'system'].includes(n.type) ? n.type : 'notice',
    read: Boolean(n.read),
  };
  if (n.pdfAttachment?.dataUrl) {
    payload.pdfAttachment = cleanObj({
      fileName: clampStr(n.pdfAttachment.fileName, 200, 'document.pdf'),
      fileSize: clampStr(n.pdfAttachment.fileSize, 40),
      dataUrl: clampStr(n.pdfAttachment.dataUrl, 700000),
    });
  }
  return payload;
}

export function toJoinRequestPayload(r: JoinRequest) {
  const safePhone = (r.phone || '').trim();
  const safeName = (r.name || '').trim();
  const safeVillage = (r.village || '').trim();
  const safeReason = (r.reason || '').trim();
  return cleanObj({
    id: sanitizeId(r.id),
    name: clampStr(safeName || 'Applicant', 120),
    email: clampStr((r.email || '').trim().toLowerCase(), 160),
    phone: clampStr(safePhone.length >= 4 ? safePhone : '0000', 40),
    village: clampStr(safeVillage || 'Gaira', 100),
    bloodGroup: clampStr(r.bloodGroup, 10, 'O+'),
    skills: clampStr(r.skills, 400),
    interests: clampStr(r.interests, 400),
    reason: clampStr(safeReason || 'Interested in volunteering', 1500),
    status: ['Pending', 'Approved', 'Rejected'].includes(r.status) ? r.status : 'Pending',
    date: clampStr(r.date, 40, new Date().toISOString().split('T')[0]),
  });
}

export function toMessagePayload(m: ContactMessage) {
  return cleanObj({
    id: sanitizeId(m.id),
    name: clampStr(m.name, 120, 'Visitor'),
    contact: clampStr(m.contact, 160, 'Not specified'),
    message: clampStr(m.message, 2000, 'Hello'),
    date: clampStr(m.date, 40, new Date().toISOString().split('T')[0]),
    status: ['Unread', 'Read', 'Replied'].includes(m.status) ? m.status : 'Unread',
  });
}

// ───────── Firestore CRUD Helpers with Mandatory Error Context ─────────
export async function fsSet(path: string, data: Record<string, any>, op: OperationType = OperationType.WRITE) {
  try {
    const parts = path.split('/').filter(Boolean);
    await setDoc(doc(db, parts[0], ...parts.slice(1)), data);
  } catch (err) {
    if (isFirestoreConnectivityOrQuotaError(err)) {
      console.warn(`Firestore write skipped (offline/quota) at ${path}:`, err instanceof Error ? err.message : String(err));
      throw err;
    }
    handleFirestoreError(err, op, path);
  }
}

export async function fsDelete(path: string) {
  try {
    const parts = path.split('/').filter(Boolean);
    await deleteDoc(doc(db, parts[0], ...parts.slice(1)));
  } catch (err) {
    if (isFirestoreConnectivityOrQuotaError(err)) {
      console.warn(`Firestore delete skipped (offline/quota) at ${path}:`, err instanceof Error ? err.message : String(err));
      throw err;
    }
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function seedInitialFirestoreIfEmpty(seed: {
  settings: CommunitySettings;
}): Promise<boolean> {
  const uid = auth.currentUser?.uid;
  if (!uid) return false;
  try {
    const existingSettings = await getDoc(doc(db, 'settings', 'main'));
    if (existingSettings.exists()) return false;

    const batch = writeBatch(db);
    batch.set(doc(db, 'settings', 'main'), toSettingsMainPayload(seed.settings));
    batch.set(doc(db, 'admins', uid), {
      uid,
      email: (auth.currentUser?.email || BOOTSTRAP_ADMIN_EMAIL).toLowerCase(),
      grantedBy: 'bootstrap',
    });

    await batch.commit();
    return true;
  } catch (err) {
    if (isFirestoreConnectivityOrQuotaError(err)) {
      console.warn('Skipped initial Firestore bootstrap (client offline or daily quota reached).');
      return false;
    }
    handleFirestoreError(err, OperationType.WRITE, 'seedInitialFirestoreIfEmpty');
  }
}

/**
 * Deletes any leftover legacy starter/demo documents from Firestore while
 * preserving 100% of real user-uploaded records. Must only be called by an Admin.
 */
export async function purgeLegacyDemoFirestoreData(): Promise<{ deleted: boolean }> {
  const uid = auth.currentUser?.uid;
  if (!uid) return { deleted: false };

  try {
    const batch = writeBatch(db);

    for (const id of LEGACY_DEMO_EVENT_IDS) {
      batch.delete(doc(db, 'events', id));
    }
    for (const id of LEGACY_DEMO_NEWS_IDS) {
      batch.delete(doc(db, 'news', id));
    }
    for (const id of LEGACY_DEMO_NOTIFICATION_IDS) {
      batch.delete(doc(db, 'notifications', id));
    }
    for (const id of LEGACY_DEMO_PROJECT_IDS) {
      batch.delete(doc(db, 'projects', id));
    }
    for (const id of LEGACY_DEMO_GALLERY_IDS) {
      batch.delete(doc(db, 'gallery', id));
    }
    for (const id of LEGACY_DEMO_JOIN_REQUEST_IDS) {
      batch.delete(doc(db, 'joinRequests', id));
    }
    for (const id of LEGACY_DEMO_MESSAGE_IDS) {
      batch.delete(doc(db, 'messages', id));
    }
    for (const id of LEGACY_DEMO_DISCUSSION_IDS) {
      batch.delete(doc(db, 'discussions', id));
    }
    for (const id of LEGACY_DEMO_FUND_IDS) {
      batch.delete(doc(db, 'funds', id));
    }
    for (const id of LEGACY_DEMO_RESIDENT_IDS) {
      batch.delete(doc(db, 'villageResidents', id));
      batch.delete(doc(db, 'villageResidents', id, 'private', 'info'));
    }

    // Verify each legacy member doc before removing so real member accounts are never touched
    for (const entry of LEGACY_DEMO_MEMBER_ENTRIES) {
      try {
        const snap = await getDoc(doc(db, 'members', entry.id));
        if (snap.exists()) {
          const ownerEmail = (snap.data()?.ownerEmail as string | undefined) || entry.email;
          if (isLegacyDemoMemberDoc(entry.id, ownerEmail)) {
            batch.delete(doc(db, 'members', entry.id));
            batch.delete(doc(db, 'members', entry.id, 'private', 'contact'));
            batch.delete(doc(db, 'roleGrants', entry.email.toLowerCase()));
          }
        } else {
          // Still clean up any orphaned fake @example.com roleGrant
          batch.delete(doc(db, 'roleGrants', entry.email.toLowerCase()));
        }
      } catch {
        // Skip unreadable member check and continue cleaning other legacy records
      }
    }

    await batch.commit();
    return { deleted: true };
  } catch (err) {
    if (isFirestoreConnectivityOrQuotaError(err)) {
      console.warn('Skipped legacy demo cleanup (client offline or daily quota reached).');
      return { deleted: false };
    }
    handleFirestoreError(err, OperationType.DELETE, 'purgeLegacyDemoFirestoreData');
  }
}

export async function syncMemberRoleGrant(member: Member) {
  const emailKey = (member.ownerEmail || member.email || '').trim().toLowerCase();
  if (!emailKey) return;
  await fsSet(
    `roleGrants/${emailKey}`,
    {
      email: emailKey,
      role: clampStr(member.role, 80, 'Member'),
      memberId: sanitizeId(member.id),
      memberName: clampStr(member.name, 120),
      status: member.status === 'Inactive' ? 'Inactive' : 'Active',
      updatedAt: new Date().toISOString(),
    },
    OperationType.WRITE
  );
}

export async function removeMemberRoleGrant(email?: string) {
  const emailKey = (email || '').trim().toLowerCase();
  if (!emailKey) return;
  await fsDelete(`roleGrants/${emailKey}`);
}

export function getPublicQuery(colName: string) {
  return collection(db, colName);
}
