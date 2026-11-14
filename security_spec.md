# Salmikkhang Firestore Security Specification

## 1. Data Invariants
1. **Settings & Visual Assets (`/settings/{settingId}`)**: Only authenticated verified Admin (`salmikkhang@gmail.com`, `blanchonokreksk@gmail.com`, UID in `/admins`, or `'Admin'` in `/roleGrants`) can create/update/delete community settings (`main`, `heroBackground`, `siteBackground`). Public visitors can only `get` settings documents.
2. **RBAC Isolation (`/admins/{uid}`, `/roleGrants/{email}`)**: Only Admin can create, update, or delete `/admins` and `/roleGrants`. Users can never self-assign or escalate their own role. Users may only `get` their own `/roleGrants/{email}` record; President has read-only access to inspect `/admins` and `/roleGrants`. Only emails with an active `/roleGrants/{email}` (or Admin) pass `isVerifiedMember()`.
3. **Member PII Isolation (`/members/{memberId}` & `/members/{memberId}/private/{docId}`)**: Directory profiles (`/members/{memberId}`) are readable/listable only by verified active members (`isVerifiedMember()`). PII (`email`, `phone`) resides strictly in `/members/{memberId}/private/contact`, readable only by Admin, President (read-only), or the verified member owner (`ownerEmail == request.auth.token.email || ownerUid == request.auth.uid`).
4. **Village Census PII Isolation (`/villageResidents/{residentId}` & `/villageResidents/{residentId}/private/{docId}`)**: Household records are readable only by Admin, President (read-only), and Data Collector. Sensitive PII resides in `/villageResidents/{residentId}/private/info`, readable by Admin, President (read-only), Data Collector, or the original collector, and writable only by Admin or Data Collector.
5. **Treasury Cash Book (`/funds/{fundId}`)**: Listable/readable only by `isVerifiedMember()`. Only Admin, Cashier, or Assistant Cashier (verified in `/roleGrants`) may create, update, or delete vouchers. President has read-only audit visibility. `amount` must be a positive finite number `> 0`.
6. **Public Inquiries & Membership Applications (`/joinRequests/{requestId}`, `/messages/{messageId}`)**: Public visitors or users may `create` new records only with initial status (`Pending` / `Unread`) and bounded string lengths. Verified users may `get` only their own `joinRequest` document (`email == request.auth.token.email`) to check pending status. Admin and President (read-only) may `get` and `list` all; only Admin may `update` or `delete`.
7. **Notices & Events (`/news/{newsId}`, `/events/{eventId}`)**: Public documents (`visibility == 'public'`) are readable without login. `members_only` items require `isVerifiedMember()`. `Publicity Secretary` and Admin/authorized secretaries may upload/create and edit both Notices and Events; President is read-only. Verified users may update ONLY `rsvps` on public events; `members_only` events require `isVerifiedMember()`.
8. **Youth Discussion Wall (`/discussions/{postId}`)**: Readable/listable only by `isVerifiedMember()`. `authorUid` on create must strictly equal `request.auth.uid`. Non-admin members can only edit their own post text or toggle `likes`/`likedByUids` or append `replies`.

## 2. "Dirty Dozen" Adversarial Payloads
1. **Shadow Role Escalation**: Unprivileged user updates `/members/m-1` or `/roleGrants/user@example.com` adding `role: "Admin"` or `isAdmin: true` -> `PERMISSION_DENIED`.
2. **PII Scraping (Members)**: Non-owner signed-in user calls `get` or `list` on `/members/m-1/private/contact` -> `PERMISSION_DENIED`.
3. **PII Scraping (Census)**: Non-collector member calls `get` on `/villageResidents/res-1/private/info` -> `PERMISSION_DENIED`.
4. **Unverified Admin Email Spoof**: User with `email: "salmikkhang@gmail.com"` and `email_verified: false` attempts write on `/settings/main` -> `PERMISSION_DENIED`.
5. **ID Poisoning**: Attacker attempts `setDoc` on `/news/<1500-char-id>` or `/projects/bad$id` -> `PERMISSION_DENIED` (`isValidId` fails).
6. **Denial-of-Wallet Oversized String**: Attacker submits `/messages/msg-1` with a 500KB `message` field -> `PERMISSION_DENIED` (`size() <= 2000` fails).
7. **Unauthorized Cash Book Mutation**: Regular Member (`role: "Member"`) or President tries to create or delete `/funds/f-1` -> `PERMISSION_DENIED`.
8. **Negative/Zero Fund Injection**: Cashier submits `/funds/f-99` with `amount: -5000` -> `PERMISSION_DENIED`.
9. **Public Inbox Exfiltration**: Non-admin/non-president user attempts `list` on `/joinRequests` or `/messages` -> `PERMISSION_DENIED`.
10. **Status Shortcutting on Join Request**: Applicant submits `/joinRequests/jr-99` with `status: "Approved"` -> `PERMISSION_DENIED`.
11. **Discussion Author Spoofing**: Signed-in member creates `/discussions/d-99` with `authorUid: "someone-else"` -> `PERMISSION_DENIED`.
12. **Shadow Field Injection on Event RSVP**: Signed-in member updates `/events/ev-1` touching `['rsvps', 'visibility']` -> `PERMISSION_DENIED` (`affectedKeys().hasOnly(['rsvps'])` fails).
