import { DiscussionPost, Member } from '../types';

export function stripRoleSuffix(rawLabel?: string): string {
  if (!rawLabel) return '';
  return rawLabel.replace(/\s*\([^)]*\)\s*$/, '').trim();
}

export function findMemberByUidOrName(
  members: Member[],
  opts: {
    uid?: string;
    name?: string;
    expectedRole?: string;
    allowAdminUidMatch?: boolean;
  }
): Member | undefined {
  const cleanName = stripRoleSuffix(opts.name).toLowerCase();
  const byName = cleanName
    ? members.find((m) => m.name.trim().toLowerCase() === cleanName)
    : undefined;

  const uid = opts.uid && opts.uid !== 'admin' ? opts.uid : undefined;
  const byUid = uid
    ? members.find((m) => m.ownerUid && m.ownerUid === uid)
    : undefined;

  if (byUid) {
    // Seeded initial items or Admin preview posts carry the Admin's UID even when authorName is another member.
    // Only prefer byUid over a differing name if it is NOT an Admin UID masquerading as a non-Admin author.
    if (
      byName &&
      byName.id !== byUid.id &&
      (byUid.role === 'Admin' || opts.allowAdminUidMatch === false) &&
      opts.expectedRole !== 'Admin'
    ) {
      return byName;
    }
    return byUid;
  }

  return byName;
}

export function resolveDiscussionAuthor(
  members: Member[],
  post: DiscussionPost
): { name: string; role: string; avatar?: string } {
  const matched = findMemberByUidOrName(members, {
    uid: post.authorUid,
    name: post.authorName,
    expectedRole: post.authorRole,
  });

  if (matched) {
    return {
      name: matched.name,
      role: matched.role,
      avatar: matched.avatar || post.authorAvatar,
    };
  }

  return {
    name: post.authorName,
    role: post.authorRole,
    avatar: post.authorAvatar,
  };
}

export function resolveReplyAuthor(
  members: Member[],
  reply: DiscussionPost['replies'][number]
): { name: string; role: string } {
  const matched = findMemberByUidOrName(members, {
    name: reply.author,
    expectedRole: reply.role,
  });

  if (matched) {
    return {
      name: matched.name,
      role: matched.role,
    };
  }

  return {
    name: reply.author,
    role: reply.role,
  };
}

export function resolveRoleStampedActor(
  members: Member[],
  rawLabel?: string,
  uid?: string,
  fallback = 'Council'
): string {
  const trimmed = (rawLabel || '').trim();
  const isGenericDeskLabel =
    !trimmed ||
    trimmed === 'Admin Council' ||
    trimmed === 'Treasury Desk' ||
    trimmed === 'Council' ||
    trimmed === 'Treasurer / Cashier' ||
    trimmed === 'Data Collector';

  const cleanName = stripRoleSuffix(trimmed).toLowerCase();
  const byName = cleanName
    ? members.find((m) => m.name.trim().toLowerCase() === cleanName)
    : undefined;

  if (byName) {
    return `${byName.name} (${byName.role})`;
  }

  if (!isGenericDeskLabel && uid && uid !== 'admin') {
    const byUid = members.find((m) => m.ownerUid && m.ownerUid === uid);
    if (byUid) {
      return `${byUid.name} (${byUid.role})`;
    }
  }

  return trimmed || fallback;
}

export function resolvePresidentName(members: Member[], fallback = 'Council President'): string {
  return members.find((m) => m.role === 'President')?.name || fallback;
}
