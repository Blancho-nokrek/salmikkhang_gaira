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
  BOOTSTRAP_ADMIN_EMAIL,
} from './firebase';
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
    motto: clampStr(s.motto, 200),
    mottoBn: clampStr(s.mottoBn, 240),
    about: clampStr(s.about, 2000),
    aboutBn: clampStr(s.aboutBn, 2000),
    updatedAt: new Date().toISOString(),
  });
}

export function toMemberPublicPayload(m: Member) {
  return cleanObj({
    id: sanitizeId(m.id),
    memberNo: clampStr(m.memberNo, 40, 'SMK-2026-001'),
    name: clampStr(m.name, 120, 'Member'),
    role: clampStr(m.role, 80, 'Member'),
    status: m.status === 'Inactive' ? 'Inactive' : 'Active',
    village: clampStr(m.village, 100, 'Gaira'),
    bloodGroup: clampStr(m.bloodGroup, 10, 'O+'),
    skills: Array.isArray(m.skills) ? m.skills.slice(0, 20).map(s => clampStr(s, 80)) : [],
    interests: Array.isArray(m.interests) ? m.interests.slice(0, 20).map(s => clampStr(s, 80)) : [],
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
    category: ['Announcement', 'Notice', 'Education', 'Environment', 'Sports', 'Community'].includes(n.category)
      ? n.category
      : 'Notice',
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
    category: ['Meeting', 'Environment', 'Culture', 'Sports', 'Education'].includes(ev.category)
      ? ev.category
      : 'Meeting',
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
  return cleanObj({
    id: sanitizeId(r.id),
    name: clampStr(r.name, 120, 'Applicant'),
    email: clampStr(r.email, 160),
    phone: clampStr(r.phone, 40, '0000'),
    village: clampStr(r.village, 100, 'Gaira'),
    bloodGroup: clampStr(r.bloodGroup, 10, 'O+'),
    skills: clampStr(r.skills, 400),
    interests: clampStr(r.interests, 400),
    reason: clampStr(r.reason, 1500, 'Interested in volunteering'),
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
    handleFirestoreError(err, op, path);
  }
}

export async function fsDelete(path: string) {
  try {
    const parts = path.split('/').filter(Boolean);
    await deleteDoc(doc(db, parts[0], ...parts.slice(1)));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function seedInitialFirestoreIfEmpty(seed: {
  settings: CommunitySettings;
  members: Member[];
  joinRequests: JoinRequest[];
  events: CommunityEvent[];
  news: NewsItem[];
  notifications: MemberNotification[];
  projects: Project[];
  gallery: GalleryItem[];
  messages: ContactMessage[];
  discussions: DiscussionPost[];
  funds: FundTransaction[];
  villageResidents: VillageResident[];
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

    for (const m of seed.members) {
      const mId = sanitizeId(m.id);
      batch.set(doc(db, 'members', mId), toMemberPublicPayload(m));
      batch.set(doc(db, 'members', mId, 'private', 'contact'), toMemberPrivatePayload(m));
      if (m.email) {
        const emailKey = m.email.toLowerCase();
        batch.set(doc(db, 'roleGrants', emailKey), {
          email: emailKey,
          role: m.role,
          memberId: mId,
          memberName: clampStr(m.name, 120),
          updatedAt: new Date().toISOString(),
        });
      }
    }

    for (const ev of seed.events) {
      batch.set(doc(db, 'events', sanitizeId(ev.id)), toEventPayload(ev));
    }
    for (const n of seed.news) {
      batch.set(doc(db, 'news', sanitizeId(n.id)), toNewsPayload(n));
    }
    for (const notif of seed.notifications) {
      batch.set(doc(db, 'notifications', sanitizeId(notif.id)), toNotificationPayload(notif));
    }
    for (const p of seed.projects) {
      batch.set(doc(db, 'projects', sanitizeId(p.id)), toProjectPayload(p));
    }
    for (const g of seed.gallery) {
      batch.set(doc(db, 'gallery', sanitizeId(g.id)), toGalleryPayload(g));
    }
    for (const jr of seed.joinRequests) {
      batch.set(doc(db, 'joinRequests', sanitizeId(jr.id)), toJoinRequestPayload(jr));
    }
    for (const msg of seed.messages) {
      batch.set(doc(db, 'messages', sanitizeId(msg.id)), toMessagePayload(msg));
    }
    for (const d of seed.discussions) {
      batch.set(doc(db, 'discussions', sanitizeId(d.id)), toDiscussionPayload(d, uid));
    }
    for (const f of seed.funds) {
      batch.set(doc(db, 'funds', sanitizeId(f.id)), toFundPayload(f, uid));
    }
    for (const r of seed.villageResidents) {
      const rId = sanitizeId(r.id);
      batch.set(doc(db, 'villageResidents', rId), toResidentPublicPayload(r, uid));
      batch.set(doc(db, 'villageResidents', rId, 'private', 'info'), toResidentPrivatePayload(r, uid));
    }

    await batch.commit();
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'seedInitialFirestoreIfEmpty');
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
