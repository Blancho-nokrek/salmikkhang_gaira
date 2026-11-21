import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type User,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import {
  auth,
  db,
  googleProvider,
  BOOTSTRAP_ADMIN_EMAIL,
  isBootstrapAdminEmail,
  OperationType,
  handleFirestoreError,
  isFirestoreConnectivityOrQuotaError,
} from '../lib/firebase';
import { hydrateMemberStatus, normalizeMemberStatus } from '../lib/memberStatus';
import {
  nextSequentialCode,
  parseTagList,
  resolvePortalAccessOutcome,
  translateWithFallback,
  type MemberAccessNoticeStatus,
} from '../lib/memberAccess';
import { ensureOptionalFontLoaded } from '../lib/scrollSmooth';
import {
  cleanObj,
  clampStr,
  sanitizeId,
  toSettingsMainPayload,
  toMemberPublicPayload,
  toMemberPrivatePayload,
  toResidentPublicPayload,
  toResidentPrivatePayload,
  toNewsPayload,
  toEventPayload,
  toProjectPayload,
  toGalleryPayload,
  toFundPayload,
  toDiscussionPayload,
  toNotificationPayload,
  toJoinRequestPayload,
  toMessagePayload,
  fsSet,
  fsDelete,
  seedInitialFirestoreIfEmpty,
  purgeLegacyDemoFirestoreData,
  syncMemberRoleGrant,
  removeMemberRoleGrant,
} from '../lib/firestoreSync';
import {
  filterOutLegacyDemoItems,
  filterOutLegacyDemoMembers,
} from '../lib/legacyDemoData';
import {
  buildDefaultSubject,
  buildDraftFromEvent,
  buildDraftFromNews,
  buildDraftFromProject,
  collectNotificationRecipients,
  DEFAULT_GMAIL_SENDER,
  type GmailNotificationDraft,
} from '../lib/gmailNotifications';
import {
  detectNewCommunityUpdates,
  dispatchDeviceNotification,
  getBrowserNotificationSupport,
  isDeviceAlertsPreferenceEnabled,
  loadSeenAlertIds,
  registerPeriodicBackgroundSync,
  requestDeviceNotificationAccess,
  saveSeenAlertIds,
  setDeviceAlertsPreference,
  updateAppUnreadBadge,
  type CommunityAlertCandidate,
} from '../lib/backgroundNotifications';
import {
  Member,
  Role,
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
  Language,
  Theme,
  MemberNotification,
} from '../types';
import {
  canManageFunds as checkCanManageFunds,
  canCollectData as checkCanCollectData,
  canManageNotices as checkCanManageNotices,
  canManageEvents as checkCanManageEvents,
  canManageProjects as checkCanManageProjects,
  canManageMembers as checkCanManageMembers,
  canManageGallery as checkCanManageGallery,
} from '../data/organizationRoles';

export interface ToastInfo {
  message: string;
  type?: 'success' | 'info' | 'warning';
}

export interface MemberAccessNotice {
  email: string;
  status: MemberAccessNoticeStatus;
}

export interface AdminAccessWarning {
  email: string;
  role?: string | null;
}

interface CommunityContextType {
  // Navigation & View Mode
  currentView: 'website' | 'member' | 'admin';
  setCurrentView: (view: 'website' | 'member' | 'admin') => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (en: string, bn?: string) => string;

  // Theme (Light, Dark, System)
  theme: Theme;
  setTheme: (theme: Theme) => void;

  // Firebase Auth Session
  firebaseUser: User | null;
  authLoading: boolean;
  authError: string | null;
  clearAuthError: () => void;
  memberAccessNotice: MemberAccessNotice | null;
  clearMemberAccessNotice: () => void;
  adminAccessWarning: AdminAccessWarning | null;
  clearAdminAccessWarning: () => void;
  loginWithGoogle: (options?: { silentSuccessToast?: boolean; targetPortal?: 'member' | 'admin' }) => Promise<boolean>;
  verifyExistingGoogleSession: (targetPortal: 'member' | 'admin') => Promise<boolean>;
  logoutGoogle: () => Promise<void>;

  // Active Member Session & Auth
  currentMember: Member | null;
  previewMemberId: string | null;
  isMemberSessionUnlocked: boolean;
  loginAsMember: (memberOrEmail?: string, password?: string) => boolean | Promise<boolean>;
  logoutMember: () => void;
  quickSwitchMember: (memberId: string) => void;
  resetPreviewMember: () => void;

  // Admin Session & Auth
  isAdminLoggedIn: boolean;
  isAdminSessionUnlocked: boolean;
  canViewAdminPanel: boolean;
  isPresidentViewOnly: boolean;
  adminLogin: (password?: string) => boolean | Promise<boolean>;
  adminLogout: () => void;
  registerMemberByAdmin: (data: {
    name: string;
    email: string;
    phone: string;
    password?: string;
    role: Member['role'];
    status?: Member['status'];
    village: string;
    bloodGroup: string;
    skills?: string[];
    interests?: string[];
    avatar?: string;
    bio?: string;
  }) => void;

  // Role Permissions
  canManageFundsPermission: () => boolean;
  canCollectDataPermission: () => boolean;
  canManageNoticesPermission: () => boolean;
  canManageEventsPermission: () => boolean;
  canManageProjectsPermission: () => boolean;
  canManageMembersPermission: () => boolean;
  canManageGalleryPermission: () => boolean;
  assignMemberRole: (memberId: string, newRole: Role) => void;

  // Data Collections
  members: Member[];
  joinRequests: JoinRequest[];
  events: CommunityEvent[];
  news: NewsItem[];
  notifications: MemberNotification[];
  markNotificationAsRead: (id: string) => void;
  clearAllNotifications: () => void;
  projects: Project[];
  gallery: GalleryItem[];
  messages: ContactMessage[];
  discussions: DiscussionPost[];
  funds: FundTransaction[];
  villageResidents: VillageResident[];
  settings: CommunitySettings;

  // Modals & Feedback
  toast: ToastInfo | null;
  showToast: (message: string, type?: 'success' | 'info' | 'warning') => void;
  activeModal: 'join' | 'contact' | 'login' | 'rsvp' | null;
  modalPayload: any;
  openModal: (modal: 'join' | 'contact' | 'login' | 'rsvp', payload?: any) => void;
  closeModal: () => void;

  // Actions
  submitJoinRequest: (req: Omit<JoinRequest, 'id' | 'status' | 'date'>) => void;
  approveJoinRequest: (requestId: string, role?: Member['role']) => void;
  rejectJoinRequest: (requestId: string) => void;
  updateMember: (id: string, updated: Partial<Member>) => void;
  deleteMember: (id: string) => void;

  // Village Public Records (Confidential to Members & Admin; Add/Edit by Admin & Data Collector)
  addVillageResident: (resident: Omit<VillageResident, 'id' | 'residentNo' | 'collectedDate'>) => boolean;
  updateVillageResident: (id: string, resident: Partial<VillageResident>) => boolean;
  deleteVillageResident: (id: string) => boolean;

  // Funds & Treasury (Admin, Cashier, Assistant Cashier)
  addFundTransaction: (txn: Omit<FundTransaction, 'id'>) => boolean;
  deleteFundTransaction: (id: string) => boolean;
  updateFundTransaction: (id: string, txn: Partial<FundTransaction>) => boolean;

  submitContactMessage: (msg: Omit<ContactMessage, 'id' | 'date' | 'status'>) => void;
  markMessageStatus: (id: string, status: ContactMessage['status']) => void;
  deleteMessage: (id: string) => void;

  toggleEventRsvp: (eventId: string, userNameOrEmail: string) => void;
  addEvent: (event: Omit<CommunityEvent, 'id' | 'rsvps'>) => void;
  updateEvent: (id: string, event: Partial<CommunityEvent>) => void;
  deleteEvent: (id: string) => void;

  addNewsItem: (item: Omit<NewsItem, 'id'>) => void;
  updateNewsItem: (id: string, item: Partial<NewsItem>) => void;
  deleteNewsItem: (id: string) => void;

  addProject: (proj: Omit<Project, 'id'>) => void;
  updateProject: (id: string, proj: Partial<Project>) => void;
  deleteProject: (id: string) => void;

  addGalleryItem: (item: Omit<GalleryItem, 'id'>) => void;
  updateGalleryItem: (id: string, item: Partial<GalleryItem>) => void;
  deleteGalleryItem: (id: string) => void;

  addDiscussionPost: (text: string, category: DiscussionPost['category']) => void;
  likeDiscussionPost: (id: string) => void;
  addDiscussionReply: (postId: string, text: string) => void;
  deleteDiscussionPost: (id: string) => void;

  updateSettings: (newSettings: Partial<CommunitySettings>) => Promise<void>;
  resetAllData: () => void;
  exportDataJSON: () => void;

  deviceAlertsEnabled: boolean;
  deviceNotificationPermission: NotificationPermission | 'unsupported';
  enableDeviceAlerts: () => Promise<boolean>;
  disableDeviceAlerts: () => void;
}

// localStorage can throw (private mode, blocked cookies, sandboxed iframes). Never let that crash the app.
const safeStorage = {
  get(key: string): string | null {
    try { return localStorage.getItem(key); } catch { return null; }
  },
  set(key: string, value: string): void {
    try { localStorage.setItem(key, value); } catch { /* ignore */ }
  },
  remove(key: string): void {
    try { localStorage.removeItem(key); } catch { /* ignore */ }
  },
};

const STORAGE_KEY = 'salmikkhang_youth_community_v3';
const LEGACY_DEMO_PURGED_KEY = 'salmikkhang_legacy_demo_purged_v1';

const initialSettings: CommunitySettings = {
  name: 'Salmikkhang Village Youth Community',
  nameBn: 'সালমিকখাং গ্রাম যুব কমিউনিটি',
  village: 'Gaira, Jolchotro',
  address: 'Gaira, Jolchotro, Madhupur, Tangail, Bangladesh',
  phone: '',
  email: '',
  facebookUrl: '',
  whatsapp: '',
  fontStyle: 'editorial',
  motto: 'Together for a greener, kinder and stronger village',
  mottoBn: 'একত্রে আমরা আমাদের গ্রামের আরও উজ্জ্বল ও সুন্দর ভবিষ্যৎ গড়তে পারি',
  about: 'Salmikkhang is a non-political, grassroots youth organization rooted in Gaira and Jolchotro, Madhupur. We bring young minds together for education, environmental preservation, sports, and community solidarity.',
  aboutBn: 'সালমিকখাং একটি অরাজনৈতিক, তৃণমূল যুব সংগঠন যা গাইরা ও জলছত্র, মধুপুরকে কেন্দ্র করে গঠিত। শিক্ষা, পরিবেশ সংরক্ষণ, খেলাধুলা ও সামাজিক সংহতিতে তরুণদের একত্র করাই আমাদের ব্রত।'
};

const CommunityContext = createContext<CommunityContextType | undefined>(undefined);

export const CommunityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentView, setCurrentViewState] = useState<'website' | 'member' | 'admin'>('website');
  const [language, setLanguageState] = useState<Language>(() => {
    return (safeStorage.get('salmikkhang_lang') as Language) || 'en';
  });

  const [theme, setThemeState] = useState<Theme>(() => {
    return (safeStorage.get('salmikkhang_theme') as Theme) || 'system';
  });

  // Apply Theme logic (light / dark / system)
  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = () => {
      const isDark = theme === 'dark' || (theme === 'system' && mediaQuery.matches);
      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    applyTheme();

    const listener = () => {
      if (theme === 'system') applyTheme();
    };

    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, [theme]);

  const setTheme = (tVal: Theme) => {
    setThemeState(tVal);
    safeStorage.set('salmikkhang_theme', tVal);
  };

  // Firebase Auth State
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [memberAccessNotice, setMemberAccessNotice] = useState<MemberAccessNotice | null>(null);
  const [adminAccessWarning, setAdminAccessWarning] = useState<AdminAccessWarning | null>(null);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(false);
  const [isMemberSessionUnlocked, setIsMemberSessionUnlocked] = useState<boolean>(false);
  const [isAdminSessionUnlocked, setIsAdminSessionUnlocked] = useState<boolean>(false);
  const [grantedRole, setGrantedRole] = useState<Role | null>(null);
  const [grantedMemberId, setGrantedMemberId] = useState<string | null>(null);
  const firestoreSeededRef = useRef<boolean>(false);
  const quotaOrOfflineNotifiedRef = useRef<boolean>(false);

  const clearAuthError = () => setAuthError(null);
  const clearMemberAccessNotice = () => setMemberAccessNotice(null);
  const clearAdminAccessWarning = () => setAdminAccessWarning(null);

  // Live Community Data (exclusively populated from uploaded Firestore records; never prefilled with demo items)
  const [members, setMembers] = useState<Member[]>([]);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [notifications, setNotifications] = useState<MemberNotification[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [discussions, setDiscussions] = useState<DiscussionPost[]>([]);
  const [funds, setFunds] = useState<FundTransaction[]>([]);
  const [villageResidents, setVillageResidents] = useState<VillageResident[]>([]);
  const [settingsMain, setSettingsMain] = useState<CommunitySettings>(initialSettings);
  const [heroBgAsset, setHeroBgAsset] = useState<string | undefined>(undefined);
  const [siteBgAsset, setSiteBgAsset] = useState<string | undefined>(undefined);

  // Phone Background Notification State
  const [deviceAlertsEnabled, setDeviceAlertsEnabled] = useState<boolean>(() =>
    isDeviceAlertsPreferenceEnabled()
  );
  const [deviceNotificationPermission, setDeviceNotificationPermission] = useState<
    NotificationPermission | 'unsupported'
  >(() => getBrowserNotificationSupport().permission);
  const seenAlertIdsRef = useRef<Set<string> | null>(null);
  const alertsBaselineReadyRef = useRef<boolean>(false);

  useEffect(() => {
    safeStorage.remove(STORAGE_KEY);
    seenAlertIdsRef.current = loadSeenAlertIds();
  }, []);

  const settings: CommunitySettings = {
    ...settingsMain,
    ...(heroBgAsset ? { heroBackground: heroBgAsset } : {}),
    ...(siteBgAsset ? { siteBackground: siteBgAsset } : {}),
  };

  useEffect(() => {
    const activeFont = settingsMain.fontStyle || 'editorial';
    document.documentElement.dataset.font = activeFont;
    ensureOptionalFontLoaded(activeFont);
  }, [settingsMain.fontStyle]);

  useEffect(() => {
    if (currentView === 'admin') {
      ensureOptionalFontLoaded('all');
    }
  }, [currentView]);

  const [currentMember, setCurrentMember] = useState<Member | null>(null);
  const [previewMemberId, setPreviewMemberId] = useState<string | null>(null);
  const seededOnceRef = useRef(false);
  const legacyPurgeOnceRef = useRef(false);
  const membersRef = useRef<Member[]>([]);
  const linkingUidRef = useRef<Set<string>>(new Set());
  const authFlowInProgressRef = useRef(false);

  useEffect(() => {
    membersRef.current = members;
  }, [members]);

  // Derived primitive flags so Firestore listeners do not tear down and re-subscribe on object/role jitter
  const verifiedUid = firebaseUser?.emailVerified ? firebaseUser.uid : null;
  const verifiedEmail =
    firebaseUser?.emailVerified && firebaseUser.email
      ? firebaseUser.email.toLowerCase()
      : null;
  const isAuthorizedMember = Boolean(
    verifiedUid && verifiedEmail && (isAdminLoggedIn || grantedRole)
  );
  const canAuditAllMembers = Boolean(
    isAuthorizedMember && (isAdminLoggedIn || grantedRole === 'President')
  );
  const isCollector = Boolean(
    isAuthorizedMember &&
      (isAdminLoggedIn || grantedRole === 'President' || grantedRole === 'Data Collector')
  );
  const canViewAdminInbox = Boolean(
    isAuthorizedMember && (isAdminLoggedIn || grantedRole === 'President')
  );

  // Modals & Feedback
  const [toast, setToast] = useState<ToastInfo | null>(null);
  const [activeModal, setActiveModal] = useState<'join' | 'contact' | 'login' | 'rsvp' | null>(null);
  const [modalPayload, setModalPayload] = useState<any>(null);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    safeStorage.set('salmikkhang_lang', lang);
    document.documentElement.lang = lang;
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'bn' : 'en');
  };

  const t = (en: string, bn?: string) => translateWithFallback(language, en, bn);

  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'warning' = 'success') => {
    setToast({ message, type });
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = setTimeout(() => {
      setToast(prev => (prev?.message === message ? null : prev));
      toastTimerRef.current = null;
    }, 3400);
  };

  const handleListenerError = (error: unknown, op: OperationType, path: string) => {
    if (isFirestoreConnectivityOrQuotaError(error)) {
      console.warn(
        `Firestore listener running with cached/local data (${path}):`,
        error instanceof Error ? error.message : String(error)
      );
      if (!quotaOrOfflineNotifiedRef.current) {
        quotaOrOfflineNotifiedRef.current = true;
        showToast(
          t(
            'Cloud database quota reached or offline — showing cached/local community data.',
            'ক্লাউড ডেটাবেস কোটা পূর্ণ বা অফলাইন — সংরক্ষিত/লোকাল তথ্য দেখানো হচ্ছে।'
          ),
          'warning'
        );
      }
      return;
    }
    handleFirestoreError(error, op, path);
  };

  const openModal = (modal: 'join' | 'contact' | 'login' | 'rsvp', payload?: any) => {
    setModalPayload(payload || null);
    setActiveModal(modal);
  };

  const closeModal = () => {
    setActiveModal(null);
    setModalPayload(null);
  };

  const verifyMemberDatabaseAccess = async (
    user: User
  ): Promise<{
    allowed: boolean;
    isAdmin: boolean;
    role: Role | null;
    memberId: string | null;
    reason?: 'inactive' | 'not_found' | 'offline';
  }> => {
    const emailLower = (user.email || '').trim().toLowerCase();
    if (!emailLower || !user.emailVerified) {
      return { allowed: false, isAdmin: false, role: null, memberId: null, reason: 'not_found' };
    }

    const matchedLocal = membersRef.current.find(
      m => (m.ownerEmail || m.email || '').trim().toLowerCase() === emailLower
    );

    if (isBootstrapAdminEmail(emailLower)) {
      let resolvedRole: Role = 'Admin';
      let resolvedMemberId: string | null = matchedLocal?.id || null;
      try {
        const grantSnap = await getDoc(doc(db, 'roleGrants', emailLower));
        if (grantSnap.exists()) {
          const data = grantSnap.data();
          if (data.role) resolvedRole = data.role as Role;
          if (data.memberId) resolvedMemberId = data.memberId as string;
        }
      } catch {
        // Bootstrap admin remains authorized even if offline/quota-limited
      }
      return { allowed: true, isAdmin: true, role: resolvedRole, memberId: resolvedMemberId };
    }

    let hasAdminDoc = false;
    let firestoreUnreachable = false;

    try {
      const adminSnap = await getDoc(doc(db, 'admins', user.uid));
      if (adminSnap.exists()) hasAdminDoc = true;
    } catch (err) {
      if (isFirestoreConnectivityOrQuotaError(err)) {
        firestoreUnreachable = true;
      }
    }

    let grantFound = false;
    try {
      const grantSnap = await getDoc(doc(db, 'roleGrants', emailLower));
      if (grantSnap.exists()) {
        grantFound = true;
        const data = grantSnap.data();
        const grantStatus = (data.status as string | undefined) || 'Active';
        if (grantStatus === 'Inactive' && !hasAdminDoc) {
          return {
            allowed: false,
            isAdmin: false,
            role: null,
            memberId: (data.memberId as string) || null,
            reason: 'inactive',
          };
        }
        const role = (data.role as Role) || 'Member';
        return {
          allowed: true,
          isAdmin: hasAdminDoc || role === 'Admin',
          role,
          memberId: (data.memberId as string) || matchedLocal?.id || null,
        };
      }
    } catch (err) {
      if (isFirestoreConnectivityOrQuotaError(err)) {
        firestoreUnreachable = true;
      }
    }

    if (hasAdminDoc) {
      return {
        allowed: true,
        isAdmin: true,
        role: matchedLocal?.role || 'Admin',
        memberId: matchedLocal?.id || null,
      };
    }

    // Fallback to cached/default directory when Firestore is offline/quota-limited or not yet seeded
    if (!grantFound && (firestoreUnreachable || !firestoreSeededRef.current) && matchedLocal) {
      if (matchedLocal.status === 'Inactive') {
        return { allowed: false, isAdmin: false, role: null, memberId: matchedLocal.id, reason: 'inactive' };
      }
      return {
        allowed: true,
        isAdmin: matchedLocal.role === 'Admin',
        role: matchedLocal.role || 'Member',
        memberId: matchedLocal.id,
      };
    }

    return {
      allowed: false,
      isAdmin: false,
      role: null,
      memberId: null,
      reason: firestoreUnreachable ? 'offline' : 'not_found',
    };
  };

  const syncAuthenticatedUserWithDatabase = async (
    user: User,
    access: {
      allowed: boolean;
      isAdmin: boolean;
      role: Role | null;
      memberId: string | null;
    }
  ) => {
    if (!access.allowed || !user.emailVerified || !user.email) return;
    const emailLower = user.email.trim().toLowerCase();
    const cacheKey = `${user.uid}:${emailLower}`;
    if (linkingUidRef.current.has(cacheKey)) return;
    linkingUidRef.current.add(cacheKey);

    try {
      // 1. Ensure admins/{uid} document exists for Admin users so Firestore rules recognize UID immediately
      if (access.isAdmin) {
        try {
          const adminDocRef = doc(db, 'admins', user.uid);
          const existingAdmin = await getDoc(adminDocRef);
          if (!existingAdmin.exists()) {
            await setDoc(adminDocRef, {
              uid: user.uid,
              email: emailLower,
              grantedBy: isBootstrapAdminEmail(emailLower) ? 'bootstrap' : 'google-link',
            });
          }
        } catch (err) {
          if (!isFirestoreConnectivityOrQuotaError(err)) {
            console.warn('Could not link admins doc for UID:', err);
          }
        }
      }

      // 2. Link user.uid onto matching members/{memberId} and members/{memberId}/private/contact
      const matched = membersRef.current.find(
        m =>
          (access.memberId && m.id === access.memberId) ||
          m.ownerEmail?.toLowerCase() === emailLower ||
          m.email?.toLowerCase() === emailLower
      );

      if (matched && matched.ownerUid !== user.uid) {
        const mId = sanitizeId(matched.id);
        setMembers(prev => prev.map(m => (m.id === matched.id ? { ...m, ownerUid: user.uid, ownerEmail: emailLower } : m)));
        try {
          await updateDoc(doc(db, 'members', mId), { ownerUid: user.uid });
        } catch (err) {
          if (!isFirestoreConnectivityOrQuotaError(err)) {
            console.warn('Could not link ownerUid on member public doc:', err);
          }
        }
        try {
          await updateDoc(doc(db, 'members', mId, 'private', 'contact'), { ownerUid: user.uid });
        } catch (err) {
          if (!isFirestoreConnectivityOrQuotaError(err)) {
            console.warn('Could not link ownerUid on member private doc:', err);
          }
        }
      }
    } finally {
      // Allow re-check if member doc arrives later via snapshot without ownerUid
    }
  };

  // 1. Complete any pending redirect sign-in and listen to Firebase Auth State
  useEffect(() => {
    void (async () => {
      try {
        const res = await getRedirectResult(auth);
        let pendingPortal: string | null = null;
        try {
          pendingPortal = sessionStorage.getItem('salmikkhang_pending_portal');
          sessionStorage.removeItem('salmikkhang_pending_portal');
        } catch {
          pendingPortal = null;
        }

        if (res?.user && res.user.emailVerified && res.user.email) {
          setAuthError(null);
          const emailLower = res.user.email.toLowerCase();
          const access = await verifyMemberDatabaseAccess(res.user);

          if (pendingPortal === 'admin') {
            const allowed = access.allowed && (access.isAdmin || access.role === 'President');
            if (allowed) {
              setAdminAccessWarning(null);
              setMemberAccessNotice(null);
              setIsAdminSessionUnlocked(true);
              setIsMemberSessionUnlocked(false);
              setCurrentViewState('admin');
              showToast(
                t(`Admin Panel unlocked for ${res.user.displayName || res.user.email}`, `${res.user.displayName || res.user.email}-এর জন্য অ্যাডমিন প্যানেল আনলক হয়েছে`),
                'success'
              );
            } else {
              const msg = t(
                `ACCESS DECLINED: "${res.user.email}" is not authorized for Admin & President Panel. No request was sent to Admin.`,
                `প্রবেশাধিকার বাতিল (Access Declined): "${res.user.email}" অ্যাডমিন বা সভাপতি প্যানেলের জন্য অনুমোদিত নয়। অ্যাডমিনের কাছে কোনো রিকোয়েস্ট পাঠানো হয়নি।`
              );
              setIsAdminSessionUnlocked(false);
              setAdminAccessWarning({ email: emailLower, role: access.role });
              setAuthError(msg);
              showToast(msg, 'warning');
              setCurrentViewState('admin');
            }
          } else if (pendingPortal === 'member') {
            setIsAdminSessionUnlocked(false);
            setAdminAccessWarning(null);
            const outcome = resolvePortalAccessOutcome('member', {
              allowed: access.allowed,
              isAdmin: access.isAdmin,
              role: access.role,
              reason:
                access.reason === 'offline'
                  ? 'firestore_unavailable'
                  : access.reason || 'ok',
            });
            if (outcome.unlocked) {
              setIsMemberSessionUnlocked(true);
              setMemberAccessNotice(null);
              setCurrentViewState('member');
              showToast(
                t(
                  `Member Portal unlocked for ${res.user.displayName || res.user.email}`,
                  `${res.user.displayName || res.user.email}-এর জন্য সদস্য পোর্টাল আনলক হয়েছে`
                ),
                'success'
              );
            } else if (outcome.noticeStatus === 'inactive') {
              setIsMemberSessionUnlocked(false);
              setMemberAccessNotice({ email: emailLower, status: 'inactive' });
              const msg = t(
                `Access Declined! "${emailLower}" is marked Inactive in the member database.`,
                `প্রবেশাধিকার বাতিল! "${emailLower}" সদস্য ডেটাবেসে নিষ্ক্রিয় (Inactive) রয়েছে।`
              );
              setAuthError(msg);
              showToast(msg, 'warning');
              setCurrentViewState('member');
            } else if (outcome.noticeStatus === 'failed') {
              setIsMemberSessionUnlocked(false);
              setMemberAccessNotice({ email: emailLower, status: 'failed' });
              const msg = t(
                `Could not connect to the cloud database for "${emailLower}". Please check your internet connection or try again later.`,
                `"${emailLower}"-এর জন্য ক্লাউড ডেটাবেসের সাথে সংযোগ করা যায়নি। ইন্টারনেট সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।`
              );
              setAuthError(msg);
              showToast(msg, 'warning');
              setCurrentViewState('member');
            } else {
              setIsMemberSessionUnlocked(false);
              setMemberAccessNotice({ email: emailLower, status: 'declined' });
              const msg = t(
                `Access Declined! "${emailLower}" is not registered in our database. No request was sent to Admin — please submit a Membership Application to join.`,
                `অ্যাক্সেস বাতিল (Access Declined)! "${emailLower}" আমাদের ডেটাবেসে নিবন্ধিত নয়। অ্যাডমিনের কাছে কোনো রিকোয়েস্ট পাঠানো হয়নি — যুক্ত হতে হলে অনুগ্রহ করে সদস্যপদের আবেদন ফর্ম পূরণ করুন।`
              );
              setAuthError(msg);
              showToast(msg, 'warning');
              setCurrentViewState('member');
            }
          } else {
            showToast(
              t(
                `Signed in as ${res.user.displayName || res.user.email}`,
                `${res.user.displayName || res.user.email} হিসেবে লগইন সফল হয়েছে`
              ),
              'success'
            );
          }
        }
      } catch (err: any) {
        console.error('Google redirect sign-in error:', err);
        const host = typeof window !== 'undefined' ? window.location.hostname : '';
        if (err?.code === 'auth/unauthorized-domain') {
          setAuthError(
            t(
              `This domain (${host}) is not authorized for Google Sign-In. Add "${host}" in Firebase Console → Authentication → Settings → Authorized domains.`,
              `এই ডোমেইন (${host}) Google লগইনের জন্য অনুমোদিত নয়। Firebase Console → Authentication → Settings → Authorized domains-এ "${host}" যুক্ত করুন।`
            )
          );
        } else if (err?.code) {
          setAuthError(`${err.code}: ${err.message || 'Google Sign-In failed.'}`);
        }
      }
    })();

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user || !user.emailVerified || !user.email) {
        setFirebaseUser(user);
        if (user) setAuthError(null);
        setIsAdminLoggedIn(false);
        setIsMemberSessionUnlocked(false);
        setIsAdminSessionUnlocked(false);
        setGrantedRole(null);
        setGrantedMemberId(null);
        setPreviewMemberId(null);
        setCurrentMember(null);
        setAuthLoading(false);
        return;
      }

      const isManualFlow = authFlowInProgressRef.current;
      if (!isManualFlow) {
        setAuthLoading(true);
      }
      setFirebaseUser(user);

      const access = await verifyMemberDatabaseAccess(user);

      setIsAdminLoggedIn(access.isAdmin);
      setGrantedRole(access.role);
      setGrantedMemberId(access.memberId);

      if (!isManualFlow && !access.allowed && access.reason !== 'offline') {
        setIsMemberSessionUnlocked(false);
        setIsAdminSessionUnlocked(false);
      }

      // Always unblock auth UI immediately; run background linking/seeding without stalling
      setAuthLoading(false);

      if (access.allowed) {
        void syncAuthenticatedUserWithDatabase(user, access);
      }

      if (access.isAdmin && !seededOnceRef.current) {
        seededOnceRef.current = true;
        void (async () => {
          try {
            const didSeed = await seedInitialFirestoreIfEmpty({
              settings: initialSettings,
            });
            if (didSeed) {
              showToast(
                t('Cloud database initialized!', 'ক্লাউড ডেটাবেস সফলভাবে প্রস্তুত হয়েছে!'),
                'success'
              );
            }
          } catch (err) {
            console.error(err);
          }
        })();
      }

      if (access.isAdmin && !legacyPurgeOnceRef.current && !safeStorage.get(LEGACY_DEMO_PURGED_KEY)) {
        legacyPurgeOnceRef.current = true;
        void (async () => {
          try {
            const res = await purgeLegacyDemoFirestoreData();
            if (res.deleted) {
              safeStorage.set(LEGACY_DEMO_PURGED_KEY, '1');
            }
          } catch (err) {
            console.warn('Legacy demo cleanup skipped:', err);
          }
        })();
      }
    });

    return () => unsub();
  }, []);

  // 1b. Real-time roleGrants & admins listeners so role updates take effect live without re-login
  useEffect(() => {
    if (!verifiedUid || !verifiedEmail) return;

    const emailLower = verifiedEmail;
    const isBootstrap = isBootstrapAdminEmail(emailLower);
    let hasAdminDoc = isBootstrap;
    let grantExists = false;
    let grantActive = true;
    let latestGrantRole: Role | null = isBootstrap ? 'Admin' : null;
    let latestMemberId: string | null = null;

    const applyLiveRoleState = () => {
      if (isBootstrap) {
        setIsAdminLoggedIn(true);
        setGrantedRole(latestGrantRole || 'Admin');
        setGrantedMemberId(latestMemberId);
        return;
      }
      if (grantExists && grantActive && latestGrantRole) {
        setIsAdminLoggedIn(hasAdminDoc || latestGrantRole === 'Admin');
        setGrantedRole(latestGrantRole);
        setGrantedMemberId(latestMemberId);
      } else {
        setIsAdminLoggedIn(hasAdminDoc);
        setGrantedRole(hasAdminDoc ? 'Admin' : null);
        setGrantedMemberId(null);
        if (!hasAdminDoc) {
          setIsMemberSessionUnlocked(false);
          setIsAdminSessionUnlocked(false);
        }
      }
    };

    const unsubGrant = onSnapshot(
      doc(db, 'roleGrants', emailLower),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          grantExists = true;
          grantActive = ((data.status as string | undefined) || 'Active') !== 'Inactive';
          latestGrantRole = (data.role as Role) || 'Member';
          latestMemberId = data.memberId || null;
        } else {
          grantExists = false;
          grantActive = true;
          latestGrantRole = null;
          latestMemberId = null;
        }
        applyLiveRoleState();
      },
      (err) => {
        console.warn('Live roleGrant listener error:', err);
      }
    );

    const unsubAdmin = isBootstrap
      ? () => {}
      : onSnapshot(
          doc(db, 'admins', verifiedUid),
          (snap) => {
            hasAdminDoc = snap.exists();
            applyLiveRoleState();
          },
          (err) => {
            console.warn('Live admin listener error:', err);
          }
        );

    return () => {
      unsubGrant();
      unsubAdmin();
    };
  }, [verifiedUid, verifiedEmail]);

  // 2. Public Firestore Listeners (stagger heavy image collections so the initial Watch handshake settles fast)
  useEffect(() => {
    const unsubs: (() => void)[] = [];
    let mediaListenersAttached = false;
    let disposed = false;

    const attachMediaListeners = () => {
      if (mediaListenersAttached || disposed) return;
      mediaListenersAttached = true;

      unsubs.push(
        onSnapshot(
          doc(db, 'settings', 'heroBackground'),
          (snap) => {
            setHeroBgAsset(snap.exists() ? (snap.data().dataUrl as string) : undefined);
          },
          (error) => handleListenerError(error, OperationType.GET, 'settings/heroBackground')
        )
      );

      unsubs.push(
        onSnapshot(
          doc(db, 'settings', 'siteBackground'),
          (snap) => {
            setSiteBgAsset(snap.exists() ? (snap.data().dataUrl as string) : undefined);
          },
          (error) => handleListenerError(error, OperationType.GET, 'settings/siteBackground')
        )
      );

      unsubs.push(
        onSnapshot(
          query(collection(db, 'gallery'), where('visibility', '==', 'public')),
          (snap) => {
            const list = filterOutLegacyDemoItems('gallery', snap.docs.map(d => d.data() as GalleryItem));
            list.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
            setGallery(list);
          },
          (error) => handleListenerError(error, OperationType.LIST, 'gallery')
        )
      );
    };

    const mediaFallbackTimer = window.setTimeout(attachMediaListeners, 350);

    unsubs.push(
      onSnapshot(
        doc(db, 'settings', 'main'),
        (snap) => {
          if (snap.exists()) {
            firestoreSeededRef.current = true;
            const { heroBackground: _hb, siteBackground: _sb, ...cleanMain } = snap.data() as CommunitySettings;
            setSettingsMain(cleanMain);
          } else {
            firestoreSeededRef.current = false;
          }
          attachMediaListeners();
        },
        (error) => {
          attachMediaListeners();
          handleListenerError(error, OperationType.GET, 'settings/main');
        }
      )
    );

    unsubs.push(
      onSnapshot(
        query(collection(db, 'projects'), where('status', 'in', ['Ongoing', 'Planning', 'Completed'])),
        (snap) => {
          const list = filterOutLegacyDemoItems('projects', snap.docs.map(d => d.data() as Project));
          setProjects(list);
        },
        (error) => handleListenerError(error, OperationType.LIST, 'projects')
      )
    );

    return () => {
      disposed = true;
      window.clearTimeout(mediaFallbackTimer);
      unsubs.forEach(u => u());
    };
  }, []);

  // 3. News & Events Listeners (public-only for guests & unregistered users; full list only for verified database members)
  useEffect(() => {
    const newsQuery = isAuthorizedMember
      ? query(collection(db, 'news'), where('status', 'in', ['Published', 'Draft']))
      : query(collection(db, 'news'), where('visibility', '==', 'public'));

    const eventsQuery = isAuthorizedMember
      ? query(collection(db, 'events'), where('status', 'in', ['Upcoming', 'Past', 'Planning']))
      : query(collection(db, 'events'), where('visibility', '==', 'public'));

    const unsubNews = onSnapshot(
      newsQuery,
      (snap) => {
        const items = filterOutLegacyDemoItems('news', snap.docs.map(d => d.data() as NewsItem));
        items.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
        setNews(items);
      },
      (error) => handleListenerError(error, OperationType.LIST, 'news')
    );

    const unsubEvents = onSnapshot(
      eventsQuery,
      (snap) => {
        const items = filterOutLegacyDemoItems('events', snap.docs.map(d => d.data() as CommunityEvent));
        items.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
        setEvents(items);
      },
      (error) => handleListenerError(error, OperationType.LIST, 'events')
    );

    return () => {
      unsubNews();
      unsubEvents();
    };
  }, [isAuthorizedMember]);

  // 4. Member & Authenticated Listeners (only attached when user is a verified member in the database)
  useEffect(() => {
    if (!isAuthorizedMember || !verifiedUid || !verifiedEmail) {
      setMembers([]);
      setFunds([]);
      setDiscussions([]);
      setNotifications([]);
      setVillageResidents([]);
      return;
    }

    const uid = verifiedUid;
    const emailLower = verifiedEmail;
    const unsubs: (() => void)[] = [];
    const memberPrivateCache = new Map<string, { email: string; phone: string }>();
    const residentPrivateCache = new Map<
      string,
      { guardianName: string; phone: string; nidOrBirthCert: string }
    >();

    unsubs.push(
      onSnapshot(
        query(collection(db, 'members'), where('status', 'in', ['Active', 'Inactive'])),
        async (snap) => {
          const changedMemberIds = new Set<string>();
          for (const change of snap.docChanges()) {
            if (change.type === 'removed') {
              memberPrivateCache.delete(change.doc.id);
            } else {
              changedMemberIds.add(change.doc.id);
            }
          }

          const baseMembers = filterOutLegacyDemoMembers(
            snap.docs.map(d => {
              const raw = d.data() as Member;
              return hydrateMemberStatus({
                ...raw,
                email: raw.ownerEmail || '',
                phone: '',
              }) as Member;
            })
          );

          // Hydrate private contact info for Admin, President (view-only), or the member owner (cached across updates)
          const hydrated = await Promise.all(
            baseMembers.map(async (m) => {
              const isOwner =
                m.ownerUid === uid || (m.ownerEmail && m.ownerEmail.toLowerCase() === emailLower);
              if (!canAuditAllMembers && !isOwner) return m;

              const cached = memberPrivateCache.get(m.id);
              if (cached && !changedMemberIds.has(m.id)) {
                return {
                  ...m,
                  email: cached.email || m.email,
                  phone: cached.phone || '',
                };
              }

              try {
                const privSnap = await getDoc(doc(db, 'members', m.id, 'private', 'contact'));
                if (privSnap.exists()) {
                  const pData = privSnap.data();
                  const entry = {
                    email: (pData.email as string) || m.email || '',
                    phone: (pData.phone as string) || '',
                  };
                  memberPrivateCache.set(m.id, entry);
                  return {
                    ...m,
                    email: entry.email || m.email,
                    phone: entry.phone,
                  };
                }
                memberPrivateCache.set(m.id, { email: m.email || '', phone: '' });
              } catch {
                if (cached) {
                  return {
                    ...m,
                    email: cached.email || m.email,
                    phone: cached.phone || '',
                  };
                }
              }
              return m;
            })
          );

          hydrated.sort((a, b) => (a.memberNo || '').localeCompare(b.memberNo || ''));
          setMembers(hydrated);
        },
        (error) => handleListenerError(error, OperationType.LIST, 'members')
      )
    );

    if (isCollector) {
      const residentGroupA = ['General Resident', 'Eligible for Aid', 'Senior Citizen'];
      const residentGroupB = ['Student / Youth', 'Medical Assistance', 'Farmer / Daily Wage Earner'];
      let groupARows: VillageResident[] = [];
      let groupBRows: VillageResident[] = [];
      let groupAReady = false;
      let groupBReady = false;

      const hydrateAndPublishResidents = async (dirtyIds: Set<string>) => {
        if (!groupAReady && !groupBReady) return;
        const combinedMap = new Map<string, VillageResident>();
        for (const r of [...groupARows, ...groupBRows]) {
          combinedMap.set(r.id, r);
        }
        const baseResidents = filterOutLegacyDemoItems(
          'villageResidents',
          Array.from(combinedMap.values())
        );

        const hydrated = await Promise.all(
          baseResidents.map(async (r) => {
            const cached = residentPrivateCache.get(r.id);
            if (cached && !dirtyIds.has(r.id)) {
              return {
                ...r,
                guardianName: cached.guardianName,
                phone: cached.phone,
                nidOrBirthCert: cached.nidOrBirthCert,
              };
            }

            try {
              const privSnap = await getDoc(doc(db, 'villageResidents', r.id, 'private', 'info'));
              if (privSnap.exists()) {
                const p = privSnap.data();
                const entry = {
                  guardianName: (p.guardianName as string) || '',
                  phone: (p.phone as string) || '',
                  nidOrBirthCert: (p.nidOrBirthCert as string) || '',
                };
                residentPrivateCache.set(r.id, entry);
                return {
                  ...r,
                  ...entry,
                };
              }
              residentPrivateCache.set(r.id, {
                guardianName: '',
                phone: '',
                nidOrBirthCert: '',
              });
            } catch {
              if (cached) {
                return {
                  ...r,
                  ...cached,
                };
              }
            }
            return r;
          })
        );

        hydrated.sort((a, b) => (b.collectedDate || '').localeCompare(a.collectedDate || ''));
        setVillageResidents(hydrated);
      };

      const collectDirtyIds = (snap: {
        docChanges: () => Array<{ type: string; doc: { id: string } }>;
      }): Set<string> => {
        const dirty = new Set<string>();
        for (const change of snap.docChanges()) {
          if (change.type === 'removed') {
            residentPrivateCache.delete(change.doc.id);
          } else {
            dirty.add(change.doc.id);
          }
        }
        return dirty;
      };

      const mapResidentSnapshot = (snap: { docs: Array<{ data: () => unknown }> }): VillageResident[] =>
        snap.docs.map(d => ({
          ...(d.data() as VillageResident),
          guardianName: '',
          phone: '',
          nidOrBirthCert: '',
        }));

      unsubs.push(
        onSnapshot(
          query(collection(db, 'villageResidents'), where('aidStatus', 'in', residentGroupA)),
          async (snap) => {
            groupAReady = true;
            groupARows = mapResidentSnapshot(snap);
            await hydrateAndPublishResidents(collectDirtyIds(snap));
          },
          (error) => handleListenerError(error, OperationType.LIST, 'villageResidents')
        )
      );

      unsubs.push(
        onSnapshot(
          query(collection(db, 'villageResidents'), where('aidStatus', 'in', residentGroupB)),
          async (snap) => {
            groupBReady = true;
            groupBRows = mapResidentSnapshot(snap);
            await hydrateAndPublishResidents(collectDirtyIds(snap));
          },
          (error) => handleListenerError(error, OperationType.LIST, 'villageResidents')
        )
      );
    } else {
      setVillageResidents([]);
    }

    unsubs.push(
      onSnapshot(
        query(collection(db, 'funds'), where('type', 'in', ['Inflow', 'Outflow'])),
        (snap) => {
          const list = filterOutLegacyDemoItems('funds', snap.docs.map(d => d.data() as FundTransaction));
          list.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
          setFunds(list);
        },
        (error) => handleListenerError(error, OperationType.LIST, 'funds')
      )
    );

    unsubs.push(
      onSnapshot(
        query(
          collection(db, 'discussions'),
          where('category', 'in', ['General', 'Project Idea', 'Question', 'Event Prep'])
        ),
        (snap) => {
          const list = filterOutLegacyDemoItems(
            'discussions',
            snap.docs.map(d => {
              const data = d.data() as DiscussionPost;
              return {
                ...data,
                likedByMe: Array.isArray(data.likedByUids) ? data.likedByUids.includes(uid) : false,
              };
            })
          );
          list.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
          setDiscussions(list);
        },
        (error) => handleListenerError(error, OperationType.LIST, 'discussions')
      )
    );

    unsubs.push(
      onSnapshot(
        query(collection(db, 'notifications'), where('type', 'in', ['notice', 'event', 'system'])),
        (snap) => {
          const list = filterOutLegacyDemoItems('notifications', snap.docs.map(d => d.data() as MemberNotification));
          list.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
          setNotifications(list);
        },
        (error) => handleListenerError(error, OperationType.LIST, 'notifications')
      )
    );

    return () => unsubs.forEach(u => u());
  }, [isAuthorizedMember, verifiedUid, verifiedEmail, canAuditAllMembers, isCollector]);

  // 5. Admin & President (View-Only) Listeners (Join Requests & Contact Inbox)
  useEffect(() => {
    if (!canViewAdminInbox) {
      setJoinRequests([]);
      setMessages([]);
      return;
    }

    const unsubRequests = onSnapshot(
      collection(db, 'joinRequests'),
      (snap) => {
        const list = filterOutLegacyDemoItems('joinRequests', snap.docs.map(d => d.data() as JoinRequest));
        list.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
        setJoinRequests(list);
      },
      (error) => handleListenerError(error, OperationType.LIST, 'joinRequests')
    );

    const unsubMessages = onSnapshot(
      collection(db, 'messages'),
      (snap) => {
        const list = filterOutLegacyDemoItems('messages', snap.docs.map(d => d.data() as ContactMessage));
        list.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
        setMessages(list);
      },
      (error) => handleListenerError(error, OperationType.LIST, 'messages')
    );

    return () => {
      unsubRequests();
      unsubMessages();
    };
  }, [canViewAdminInbox]);

  // 6. Sync currentMember profile from signed-in Google user + live members list (and keep Admin preview live)
  useEffect(() => {
    if (!firebaseUser?.emailVerified || !firebaseUser?.email) {
      setCurrentMember(null);
      return;
    }

    if (isAdminLoggedIn && previewMemberId) {
      const previewMatched = members.find(m => m.id === previewMemberId);
      if (previewMatched) {
        setCurrentMember(previewMatched);
        return;
      }
      setPreviewMemberId(null);
    }

    const emailLower = firebaseUser.email.toLowerCase();
    const isBootstrap = isBootstrapAdminEmail(emailLower);
    const matched = members.find(
      m =>
        (grantedMemberId && m.id === grantedMemberId) ||
        m.ownerEmail?.toLowerCase() === emailLower ||
        m.email?.toLowerCase() === emailLower
    );

    const effectiveRole: Role | undefined =
      matched?.role || grantedRole || (isBootstrap || isAdminLoggedIn ? 'Admin' : undefined);

    if (matched) {
      setCurrentMember({
        ...matched,
        role: effectiveRole || matched.role,
      });
    } else if (isAdminLoggedIn || grantedRole) {
      setCurrentMember({
        id: `auth-${firebaseUser.uid}`,
        memberNo: isAdminLoggedIn ? 'SMK-ADMIN' : 'SMK-MEMBER',
        name: firebaseUser.displayName || (isAdminLoggedIn ? 'Salmikkhang Admin' : 'Community Executive'),
        email: emailLower,
        phone: '',
        role: effectiveRole || 'Member',
        status: 'Active',
        village: 'Gaira',
        bloodGroup: 'O+',
        skills: ['Community Leadership'],
        interests: ['Village Development'],
        joinDate: new Date().toISOString().split('T')[0],
        avatar: firebaseUser.photoURL || '',
        bio: 'Verified Salmikkhang Youth Council account.',
        ownerUid: firebaseUser.uid,
        ownerEmail: emailLower,
      });
    } else {
      setCurrentMember(null);
    }
  }, [firebaseUser, members, isAdminLoggedIn, grantedRole, grantedMemberId, previewMemberId]);

  const isPresidentRole = !isAdminLoggedIn && (grantedRole === 'President' || currentMember?.role === 'President');
  const canViewAdminPanel = isAdminLoggedIn || isPresidentRole;
  const isPresidentViewOnly = !isAdminLoggedIn && isPresidentRole;

  const setCurrentView = (view: 'website' | 'member' | 'admin') => {
    if (view === 'admin') {
      if (previewMemberId) {
        setPreviewMemberId(null);
      }
      if (isAdminSessionUnlocked && !authLoading && (!firebaseUser || !canViewAdminPanel)) {
        setIsAdminSessionUnlocked(false);
        showToast(
          t(
            'Access Rejected! Only Admin and President can enter the Admin Panel.',
            'প্রবেশাধিকার বাতিল! অ্যাডমিন এবং সভাপতি ছাড়া অন্য কেউ অ্যাডমিন প্যানেলে প্রবেশ করতে পারবেন না।'
          ),
          'warning'
        );
        return;
      }
    }
    setCurrentViewState(view);
  };

  useEffect(() => {
    if (isAdminSessionUnlocked && !authLoading && (!firebaseUser || !canViewAdminPanel)) {
      setIsAdminSessionUnlocked(false);
      if (currentView === 'admin') {
        setCurrentViewState('website');
        showToast(
          t(
            'Access Rejected! Only Admin and President can enter the Admin Panel.',
            'প্রবেশাধিকার বাতিল! অ্যাডমিন এবং সভাপতি ছাড়া অন্য কেউ অ্যাডমিন প্যানেলে প্রবেশ করতে পারবেন না।'
          ),
          'warning'
        );
      }
    }
  }, [currentView, isAdminSessionUnlocked, authLoading, firebaseUser, canViewAdminPanel]);

  // ───────── Authentication Actions ─────────
  const formatAuthError = (err: any): string => {
    const code = err?.code || '';
    const host = typeof window !== 'undefined' ? window.location.hostname : '';
    if (code === 'auth/unauthorized-domain') {
      return t(
        `Domain "${host}" is not authorized for Google Sign-In. Add "${host}" in Firebase Console → Authentication → Settings → Authorized domains.`,
        `ডোমেইন "${host}" Google লগইনের জন্য অনুমোদিত নয়। Firebase Console → Authentication → Settings → Authorized domains-এ "${host}" যুক্ত করুন।`
      );
    }
    if (code === 'auth/popup-blocked') {
      return t(
        'Sign-in popup was blocked by your browser. Please allow popups or try again.',
        'ব্রাউজার পপআপ ব্লক করেছে। পপআপ অনুমতি দিন অথবা আবার চেষ্টা করুন।'
      );
    }
    if (code === 'auth/operation-not-supported-in-this-environment') {
      return t(
        'Popup sign-in is not supported in this browser environment. Opening redirect sign-in...',
        'এই ব্রাউজারে পপআপ লগইন সমর্থিত নয়। রিডাইরেক্ট লগইন চালু হচ্ছে...'
      );
    }
    if (code === 'auth/network-request-failed') {
      return t(
        'Network error while contacting Google. Please check your connection and try again.',
        'নেটওয়ার্ক সমস্যার কারণে Google লগইন করা যায়নি। ইন্টারনেট সংযোগ পরীক্ষা করুন।'
      );
    }
    if (code === 'auth/operation-not-allowed') {
      return t(
        'Google Sign-In provider is disabled in Firebase Authentication settings.',
        'Firebase Authentication-এ Google Sign-In চালু করা নেই।'
      );
    }
    return err?.message
      ? `${t('Google sign-in failed:', 'Google লগইন ব্যর্থ হয়েছে:')} ${err.message}`
      : t('Google sign-in failed. Please try again.', 'Google লগইন সফল হয়নি। আবার চেষ্টা করুন।');
  };

  const loginWithGoogle = async (options?: { silentSuccessToast?: boolean; targetPortal?: 'member' | 'admin' }): Promise<boolean> => {
    setAuthError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      if (!user.emailVerified || !user.email) {
        const msg = t('Please use a verified Google account.', 'যাচাইকৃত Google অ্যাকাউন্ট দিয়ে লগইন করুন।');
        setAuthError(msg);
        showToast(msg, 'warning');
        return false;
      }
      if (!options?.silentSuccessToast) {
        showToast(
          t(`Signed in as ${user.displayName || user.email}`, `${user.displayName || user.email} হিসেবে লগইন সফল হয়েছে`),
          'success'
        );
      }
      return true;
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      const code = err?.code || '';

      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        showToast(t('Google sign-in popup was closed.', 'Google লগইন পপআপ বন্ধ করা হয়েছে।'), 'warning');
        return false;
      }

      // Fallback when popups are blocked or unsupported
      if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment') {
        const isInIframe = typeof window !== 'undefined' && window.self !== window.top;
        if (isInIframe) {
          const msg = t(
            'Popup was blocked inside the preview frame. Please allow popups in your browser address bar, or open this app in a full browser tab to sign in with Google.',
            'প্রিভিউ ফ্রেমে পপআপ ব্লক হয়েছে। ব্রাউজারে পপআপ অনুমতি দিন অথবা নতুন ট্যাবে ওয়েবসাইটটি খুলে Google দিয়ে সাইন-ইন করুন।'
          );
          setAuthError(msg);
          showToast(msg, 'warning');
          return false;
        }
        try {
          if (options?.targetPortal) {
            try {
              sessionStorage.setItem('salmikkhang_pending_portal', options.targetPortal);
            } catch {
              // Ignore storage quota errors
            }
          }
          await signInWithRedirect(auth, googleProvider);
          return false;
        } catch (redirectErr: any) {
          console.error('Google redirect fallback error:', redirectErr);
          const msg = formatAuthError(redirectErr);
          setAuthError(msg);
          showToast(msg, 'warning');
          return false;
        }
      }

      const msg = formatAuthError(err);
      setAuthError(msg);
      showToast(msg, 'warning');
      return false;
    }
  };

  const logoutGoogle = async () => {
    try {
      await signOut(auth);
      setAuthError(null);
      setMemberAccessNotice(null);
      setAdminAccessWarning(null);
      setPreviewMemberId(null);
      setCurrentMember(null);
      setIsAdminLoggedIn(false);
      setIsMemberSessionUnlocked(false);
      setIsAdminSessionUnlocked(false);
      showToast(t('Signed out successfully', 'সফলভাবে লগআউট হয়েছে'), 'info');
    } catch (err) {
      console.error(err);
    }
  };

  const authorizeVerifiedUserForPortal = async (
    user: User,
    targetPortal: 'member' | 'admin'
  ): Promise<boolean> => {
    if (!user.email || !user.emailVerified) {
      const msg = t('Please use a verified Google account.', 'যাচাইকৃত Google অ্যাকাউন্ট দিয়ে লগইন করুন।');
      setAuthError(msg);
      showToast(msg, 'warning');
      return false;
    }

    const emailLower = user.email.toLowerCase();
    const access = await verifyMemberDatabaseAccess(user);

    if (targetPortal === 'admin') {
      const allowed = access.allowed && (access.isAdmin || access.role === 'President');
      if (!allowed) {
        setIsAdminSessionUnlocked(false);
        if (access.reason === 'offline') {
          const msg = t(
            'Could not verify Admin privileges because the cloud database is currently offline or quota-limited. Please try again later.',
            'ক্লাউড ডেটাবেস অফলাইন বা কোটা পূর্ণ থাকায় অ্যাডমিন অনুমতি যাচাই করা যায়নি। কিছুক্ষণ পর আবার চেষ্টা করুন।'
          );
          setAuthError(msg);
          showToast(msg, 'warning');
          return false;
        }
        setAdminAccessWarning({ email: emailLower, role: access.role });
        const msg = t(
          `RESTRICTED ACCESS WARNING: "${user.email}" is not authorized for the Admin & President Panel. No access request is accepted here.`,
          `সতর্কতা — সংরক্ষিত প্রবেশাধিকার: "${user.email}" অ্যাডমিন বা সভাপতি প্যানেলের জন্য অনুমোদিত নয়। এখানে কোনো রিকোয়েস্ট পাঠানো বা গ্রহণ করা হয় না।`
        );
        setAuthError(msg);
        showToast(msg, 'warning');
        return false;
      }

      setIsAdminLoggedIn(access.isAdmin);
      setGrantedRole(access.role);
      setGrantedMemberId(access.memberId);
      setAdminAccessWarning(null);
      setAuthError(null);
      setPreviewMemberId(null);
      setIsAdminSessionUnlocked(true);
      void syncAuthenticatedUserWithDatabase(user, access);
      showToast(
        t(`Admin Panel unlocked for ${user.displayName || user.email}`, `${user.displayName || user.email}-এর জন্য অ্যাডমিন প্যানেল আনলক হয়েছে`),
        'success'
      );
      return true;
    }

    // Member portal verification & linking (NEVER auto-create a join request)
    const memberOutcome = resolvePortalAccessOutcome('member', {
      allowed: access.allowed,
      isAdmin: access.isAdmin,
      role: access.role,
      reason:
        access.reason === 'offline'
          ? 'firestore_unavailable'
          : access.reason || 'ok',
    });

    if (!memberOutcome.unlocked) {
      setIsMemberSessionUnlocked(false);
      if (memberOutcome.noticeStatus === 'inactive') {
        setMemberAccessNotice({ email: emailLower, status: 'inactive' });
        const msg = t(
          `Access Declined! "${emailLower}" is marked Inactive in the database and cannot enter the Member Portal.`,
          `অ্যাক্সেস বাতিল! "${emailLower}" ডেটাবেসে নিষ্ক্রিয় (Inactive) রয়েছে—তাই সদস্য পোর্টালে প্রবেশ করা যাবে না।`
        );
        setAuthError(msg);
        showToast(msg, 'warning');
        return false;
      }
      if (memberOutcome.noticeStatus === 'failed') {
        setMemberAccessNotice({ email: emailLower, status: 'failed' });
        const msg = t(
          `Signed in as "${emailLower}", but could not reach the cloud database right now. Please check your connection or try again later.`,
          `"${emailLower}" হিসেবে লগইন হয়েছে, কিন্তু এই মুহূর্তে ক্লাউড ডেটাবেসের সাথে সংযোগ পাওয়া যায়নি। পরে আবার চেষ্টা করুন।`
        );
        setAuthError(msg);
        showToast(msg, 'warning');
        return false;
      }

      setMemberAccessNotice({ email: emailLower, status: 'declined' });
      const msg = t(
        `Access Declined! "${emailLower}" is not registered in our database. No request was sent to Admin — please submit a Membership Application to join.`,
        `অ্যাক্সেস বাতিল (Access Declined)! "${emailLower}" আমাদের ডেটাবেসে নিবন্ধিত নয়। অ্যাডমিনের কাছে কোনো রিকোয়েস্ট পাঠানো হয়নি — যুক্ত হতে হলে অনুগ্রহ করে সদস্যপদের আবেদন ফর্ম পূরণ করুন।`
      );
      setAuthError(msg);
      showToast(msg, 'warning');
      return false;
    }

    setIsAdminLoggedIn(access.isAdmin);
    setGrantedRole(access.role);
    setGrantedMemberId(access.memberId);
    setMemberAccessNotice(null);
    setAuthError(null);
    setIsMemberSessionUnlocked(true);
    void syncAuthenticatedUserWithDatabase(user, access);
    showToast(
      t(
        `Member Portal unlocked for ${user.displayName || user.email}`,
        `${user.displayName || user.email}-এর জন্য সদস্য পোর্টাল আনলক হয়েছে`
      ),
      'success'
    );
    return true;
  };

  const verifyExistingGoogleSession = async (targetPortal: 'member' | 'admin'): Promise<boolean> => {
    const user = auth.currentUser || firebaseUser;
    if (!user || !user.email || !user.emailVerified) {
      if (targetPortal === 'admin') return adminLogin();
      return loginAsMember();
    }
    setMemberAccessNotice(null);
    setAdminAccessWarning(null);
    setAuthError(null);
    setPreviewMemberId(null);
    authFlowInProgressRef.current = true;
    try {
      return await authorizeVerifiedUserForPortal(user, targetPortal);
    } finally {
      authFlowInProgressRef.current = false;
      setAuthLoading(false);
    }
  };

  const loginAsMember = async (): Promise<boolean> => {
    const previousEmail = firebaseUser?.email?.toLowerCase() || null;
    setMemberAccessNotice(null);
    setAdminAccessWarning(null);
    authFlowInProgressRef.current = true;
    try {
      const ok = await loginWithGoogle({ silentSuccessToast: true, targetPortal: 'member' });
      if (!ok || !auth.currentUser?.email) return false;

      const user = auth.currentUser;
      const emailLower = user.email!.toLowerCase();
      if (previousEmail && previousEmail !== emailLower) {
        setIsAdminSessionUnlocked(false);
      }
      setPreviewMemberId(null);
      return await authorizeVerifiedUserForPortal(user, 'member');
    } finally {
      authFlowInProgressRef.current = false;
      setAuthLoading(false);
    }
  };

  const logoutMember = () => {
    setPreviewMemberId(null);
    setMemberAccessNotice(null);
    setIsMemberSessionUnlocked(false);
    if (!isAdminSessionUnlocked) {
      void logoutGoogle();
    } else {
      showToast(t('Signed out of Member Portal', 'সদস্য পোর্টাল থেকে লগআউট হয়েছে'), 'info');
    }
  };

  const adminLogin = async (): Promise<boolean> => {
    const previousEmail = firebaseUser?.email?.toLowerCase() || null;
    setAdminAccessWarning(null);
    authFlowInProgressRef.current = true;
    try {
      const ok = await loginWithGoogle({ silentSuccessToast: true, targetPortal: 'admin' });
      if (!ok || !auth.currentUser?.email) return false;

      const user = auth.currentUser;
      const emailLower = user.email!.toLowerCase();
      if (previousEmail && previousEmail !== emailLower) {
        setIsMemberSessionUnlocked(false);
      }
      return await authorizeVerifiedUserForPortal(user, 'admin');
    } finally {
      authFlowInProgressRef.current = false;
      setAuthLoading(false);
    }
  };

  const adminLogout = () => {
    setPreviewMemberId(null);
    setAdminAccessWarning(null);
    setIsAdminSessionUnlocked(false);
    if (!isMemberSessionUnlocked) {
      void logoutGoogle();
    } else {
      showToast(t('Signed out of Admin Panel', 'অ্যাডমিন প্যানেল থেকে লগআউট হয়েছে'), 'info');
    }
  };

  const quickSwitchMember = (memberId: string) => {
    const found = members.find(m => m.id === memberId);
    if (found && isAdminLoggedIn && isAdminSessionUnlocked) {
      setPreviewMemberId(memberId);
      setCurrentMember(found);
      showToast(
        t(`Previewing profile: ${found.name} (${found.role})`, `${found.name} (${found.role}) প্রোফাইল প্রিভিউ চলছে`),
        'info'
      );
    }
  };

  const resetPreviewMember = () => {
    setPreviewMemberId(null);
    showToast(t('Returned to your Admin profile', 'আপনার অ্যাডমিন প্রোফাইলে ফিরে আসা হয়েছে'), 'info');
  };

  // Role Permissions
  const canManageFundsPermission = (): boolean => {
    return checkCanManageFunds(currentMember?.role, isAdminLoggedIn && !previewMemberId);
  };

  const canCollectDataPermission = (): boolean => {
    return checkCanCollectData(currentMember?.role, isAdminLoggedIn);
  };

  const canManageNoticesPermission = (): boolean => {
    return checkCanManageNotices(currentMember?.role, isAdminLoggedIn);
  };

  const canManageEventsPermission = (): boolean => {
    return checkCanManageEvents(currentMember?.role, isAdminLoggedIn);
  };

  const canManageProjectsPermission = (): boolean => {
    return checkCanManageProjects(currentMember?.role, isAdminLoggedIn);
  };

  const canManageMembersPermission = (): boolean => {
    return checkCanManageMembers(currentMember?.role, isAdminLoggedIn);
  };

  const canManageGalleryPermission = (): boolean => {
    return checkCanManageGallery(currentMember?.role, isAdminLoggedIn);
  };

  const assignMemberRole = (memberId: string, newRole: Role) => {
    if (!isAdminLoggedIn) {
      showToast(
        t('Permission denied! Only Admin can assign roles in the database.', 'অনুমতি নেই! শুধুমাত্র অ্যাডমিন ডেটাবেসে পদবি নির্ধারণ করতে পারবেন।'),
        'warning'
      );
      return;
    }
    const target = members.find(m => m.id === memberId);
    if (!target) return;

    const emailLower = (target.ownerEmail || target.email || '').trim().toLowerCase();

    const prevMembers = members;
    const prevCurrentMember = currentMember;
    const updated: Member = {
      ...target,
      role: newRole,
      ...(emailLower ? { ownerEmail: emailLower, email: emailLower } : {}),
    };

    setMembers(prev => prev.map(m => (m.id === memberId ? updated : m)));
    if (currentMember?.id === memberId) {
      setCurrentMember(updated);
    }
    if (emailLower && firebaseUser?.email?.toLowerCase() === emailLower) {
      setGrantedRole(newRole);
      if (!isBootstrapAdminEmail(emailLower)) {
        setIsAdminLoggedIn(newRole === 'Admin');
      }
    }

    void (async () => {
      try {
        const mId = sanitizeId(memberId);
        await fsSet(`members/${mId}`, toMemberPublicPayload(updated), OperationType.WRITE);
        if (emailLower) {
          await fsSet(`members/${mId}/private/contact`, toMemberPrivatePayload(updated), OperationType.WRITE);
        }
        await syncMemberRoleGrant(updated);
        if (updated.ownerUid && sanitizeId(updated.ownerUid) === updated.ownerUid && !isBootstrapAdminEmail(emailLower)) {
          if (newRole === 'Admin') {
            await fsSet(
              `admins/${updated.ownerUid}`,
              {
                uid: updated.ownerUid,
                email: emailLower || 'admin@salmikkhang.org',
                grantedBy: auth.currentUser?.email || BOOTSTRAP_ADMIN_EMAIL,
              },
              OperationType.WRITE
            );
          } else {
            await fsDelete(`admins/${updated.ownerUid}`).catch(() => {});
          }
        }
        showToast(t(`Role updated to ${newRole}`, `নতুন পদবি ${newRole} নির্ধারণ করা হয়েছে`), 'success');
      } catch (err) {
        console.error('Failed to assign member role:', err);
        setMembers(prevMembers);
        setCurrentMember(prevCurrentMember);
        showToast(
          t(
            'Could not save role change to Firestore. Ensure latest firestore.rules are published in Firebase Console.',
            'ফায়ারস্টোরে পদবি সংরক্ষণ করা যায়নি। Firebase Console-এ সর্বশেষ firestore.rules প্রকাশ করা আছে কিনা পরীক্ষা করুন।'
          ),
          'warning'
        );
      }
    })();
  };

  const logFirestoreFailure = (err: unknown, op: OperationType, path: string | null) => {
    if (isFirestoreConnectivityOrQuotaError(err)) {
      console.warn(
        `Firestore operation skipped (offline/quota) at ${path}:`,
        err instanceof Error ? err.message : String(err)
      );
      return;
    }
    try {
      handleFirestoreError(err, op, path);
    } catch {
      // Structured FirestoreErrorInfo was already logged to console.error
    }
  };

  const notifyCloudSyncFailure = () => {
    showToast(
      t(
        'Could not sync change with cloud database. Please check your connection or permissions.',
        'ক্লাউড ডেটাবেসে তথ্য সংরক্ষণ করা যায়নি। ইন্টারনেট সংযোগ বা অনুমতি পরীক্ষা করুন।'
      ),
      'warning'
    );
  };

  // Village Public Records (Confidential to Members & Admin; Add/Edit by Admin & Data Collector)
  const addVillageResident = (data: Omit<VillageResident, 'id' | 'residentNo' | 'collectedDate'>): boolean => {
    if (!canCollectDataPermission()) {
      showToast(
        t('Access Denied: Only Admin or authorized Data Collector can add resident records.', 'অনুমতি নেই: শুধুমাত্র অ্যাডমিন বা দায়িত্বপ্রাপ্ত তথ্য সংগ্রাহক নাগরিক তথ্য যোগ করতে পারেন।'),
        'warning'
      );
      return false;
    }
    const newNo = nextSequentialCode('RES', villageResidents.map(r => r.residentNo));
    const uid = auth.currentUser?.uid || 'admin';
    const newResident: VillageResident = {
      ...data,
      id: `res-${Date.now()}`,
      residentNo: newNo,
      collectedDate: new Date().toISOString().split('T')[0],
      collectedBy: isAdminLoggedIn
        ? 'Admin Council'
        : currentMember?.name
        ? `${currentMember.name} (${currentMember.role})`
        : 'Data Collector',
      collectedByUid: uid,
    };
    const prevResidents = villageResidents;
    setVillageResidents(prev => [newResident, ...prev]);
    void (async () => {
      try {
        const rId = sanitizeId(newResident.id);
        await fsSet(`villageResidents/${rId}`, toResidentPublicPayload(newResident, uid), OperationType.CREATE);
        await fsSet(`villageResidents/${rId}/private/info`, toResidentPrivatePayload(newResident, uid), OperationType.CREATE);
        showToast(t(`Resident ${newResident.name} recorded into registry!`, `নাগরিক ${newResident.name}-এর তথ্য সফলভাবে সংরক্ষিত হয়েছে!`), 'success');
      } catch {
        setVillageResidents(prevResidents);
        notifyCloudSyncFailure();
      }
    })();
    return true;
  };

  const updateVillageResident = (id: string, updated: Partial<VillageResident>): boolean => {
    if (!canCollectDataPermission()) {
      showToast(
        t('Access Denied: Only Admin or authorized Data Collector can edit resident records.', 'অনুমতি নেই: শুধুমাত্র অ্যাডমিন বা দায়িত্বপ্রাপ্ত তথ্য সংগ্রাহক নাগরিক তথ্য এডিট করতে পারেন।'),
        'warning'
      );
      return false;
    }
    const existingRes = villageResidents.find(r => r.id === id);
    if (!existingRes) return false;
    const prevResidents = villageResidents;
    const merged: VillageResident = {
      ...existingRes,
      ...updated,
      updatedDate: new Date().toISOString().split('T')[0],
    };
    setVillageResidents(prev => prev.map(r => (r.id === id ? merged : r)));
    void (async () => {
      try {
        const rId = sanitizeId(id);
        await fsSet(`villageResidents/${rId}`, toResidentPublicPayload(merged), OperationType.UPDATE);
        await fsSet(`villageResidents/${rId}/private/info`, toResidentPrivatePayload(merged), OperationType.UPDATE);
        showToast(t('Resident record updated successfully', 'নাগরিক তথ্য সফলভাবে হালনাগাদ করা হয়েছে'), 'success');
      } catch {
        setVillageResidents(prevResidents);
        notifyCloudSyncFailure();
      }
    })();
    return true;
  };

  const deleteVillageResident = (id: string): boolean => {
    if (!isAdminLoggedIn) {
      showToast(
        t('Access Denied: Only Admin can delete resident records.', 'অনুমতি নেই: শুধুমাত্র অ্যাডমিন নাগরিক তথ্য মুছতে পারবেন।'),
        'warning'
      );
      return false;
    }
    const prevResidents = villageResidents;
    setVillageResidents(prev => prev.filter(r => r.id !== id));
    void (async () => {
      try {
        const rId = sanitizeId(id);
        await fsDelete(`villageResidents/${rId}/private/info`);
        await fsDelete(`villageResidents/${rId}`);
        showToast(t('Resident record deleted', 'তথ্যটি মুছে ফেলা হয়েছে'), 'info');
      } catch {
        setVillageResidents(prevResidents);
        notifyCloudSyncFailure();
      }
    })();
    return true;
  };

  // Funds Management (Admin, Cashier, Assistant Cashier Only)
  const addFundTransaction = (txn: Omit<FundTransaction, 'id'>): boolean => {
    if (!canManageFundsPermission()) {
      showToast(
        t('Access Denied: Only Cashier, Assistant Cashier, or Admin can manage funds.', 'অনুমতি নেই: শুধুমাত্র ক্যাশিয়ার, সহকারী ক্যাশিয়ার বা অ্যাডমিন তহবিল এন্ট্রি ও হিসাব পরিচালনা করতে পারেন।'),
        'warning'
      );
      return false;
    }
    const uid = auth.currentUser?.uid || 'admin';
    const voucherNo = txn.voucherNo || nextSequentialCode('VCH', funds.map(f => f.voucherNo));
    const recordedBy =
      txn.recordedBy ||
      (currentMember?.name
        ? `${currentMember.name} (${currentMember.role})`
        : isAdminLoggedIn
        ? 'Admin Council'
        : 'Treasury Desk');
    const newTxn: FundTransaction = {
      ...txn,
      id: `f-${Date.now()}`,
      voucherNo,
      recordedBy,
      recordedByUid: uid,
    };
    const prevFunds = funds;
    setFunds(prev => [newTxn, ...prev]);
    void (async () => {
      try {
        await fsSet(`funds/${sanitizeId(newTxn.id)}`, toFundPayload(newTxn, uid), OperationType.CREATE);
        showToast(t(`Voucher ${voucherNo} for ৳${txn.amount.toLocaleString()} recorded!`, `৳${txn.amount.toLocaleString()} টাকার ভাউচার ${voucherNo} সফলভাবে যুক্ত হয়েছে!`), 'success');
      } catch {
        setFunds(prevFunds);
        notifyCloudSyncFailure();
      }
    })();
    return true;
  };

  const deleteFundTransaction = (id: string): boolean => {
    if (!canManageFundsPermission()) {
      showToast(
        t('Access Denied: Only Cashier, Assistant Cashier, or Admin can delete transactions.', 'অনুমতি নেই: শুধুমাত্র ক্যাশিয়ার, সহকারী ক্যাশিয়ার বা অ্যাডমিন লেনদেন বাতিল করতে পারেন।'),
        'warning'
      );
      return false;
    }
    const prevFunds = funds;
    setFunds(prev => prev.filter(f => f.id !== id));
    void (async () => {
      try {
        await fsDelete(`funds/${sanitizeId(id)}`);
        showToast(t('Transaction voucher deleted from ledger', 'ভাউচারটি সফলভাবে বাতিল করা হয়েছে'), 'info');
      } catch {
        setFunds(prevFunds);
        notifyCloudSyncFailure();
      }
    })();
    return true;
  };

  const updateFundTransaction = (id: string, updated: Partial<FundTransaction>): boolean => {
    if (!canManageFundsPermission()) {
      showToast(
        t('Access Denied: Only Cashier, Assistant Cashier, or Admin can edit transactions.', 'অনুমতি নেই: শুধুমাত্র ক্যাশিয়ার, সহকারী ক্যাশিয়ার বা অ্যাডমিন লেনদেন এডিট করতে পারেন।'),
        'warning'
      );
      return false;
    }
    const existingTxn = funds.find(f => f.id === id);
    if (!existingTxn) return false;
    const prevFunds = funds;
    const merged = { ...existingTxn, ...updated };
    setFunds(prev => prev.map(f => (f.id === id ? merged : f)));
    void (async () => {
      try {
        await fsSet(`funds/${sanitizeId(id)}`, toFundPayload(merged), OperationType.UPDATE);
        showToast(t('Transaction record updated', 'লেনদেনের বিবরণ সফলভাবে হালনাগাদ করা হয়েছে'), 'success');
      } catch {
        setFunds(prevFunds);
        notifyCloudSyncFailure();
      }
    })();
    return true;
  };

  // Member Registration strictly by Admin
  const registerMemberByAdmin = (data: {
    name: string;
    email: string;
    phone: string;
    password?: string;
    role: Member['role'];
    status?: Member['status'];
    village: string;
    bloodGroup: string;
    skills?: string[];
    interests?: string[];
    avatar?: string;
    bio?: string;
  }) => {
    if (!isAdminLoggedIn) {
      showToast(t('Only Admin can register members.', 'শুধুমাত্র অ্যাডমিন নতুন সদস্য নিবন্ধন করতে পারেন।'), 'warning');
      return;
    }
    const emailLower = data.email.trim().toLowerCase();
    const existingMember = members.find(
      m => (m.ownerEmail || m.email || '').trim().toLowerCase() === emailLower
    );
    if (emailLower && existingMember) {
      showToast(
        t(
          `"${emailLower}" is already registered as ${existingMember.name} (${existingMember.memberNo}).`,
          `"${emailLower}" ইতিমধ্যেই ${existingMember.name} (${existingMember.memberNo}) নামে নিবন্ধিত রয়েছে।`
        ),
        'warning'
      );
      return;
    }
    const newMember: Member = {
      id: `m-${Date.now()}`,
      memberNo: nextSequentialCode('SMK', members.map(m => m.memberNo)),
      name: data.name.trim(),
      email: emailLower,
      phone: data.phone.trim(),
      role: data.role || 'Member',
      status: normalizeMemberStatus(data.status),
      village: data.village || 'Gaira',
      bloodGroup: data.bloodGroup || 'O+',
      skills: data.skills && data.skills.length > 0 ? data.skills : ['Volunteering'],
      interests: data.interests && data.interests.length > 0 ? data.interests : ['Community Care'],
      joinDate: new Date().toISOString().split('T')[0],
      avatar: data.avatar || '',
      bio: data.bio || 'Registered youth member of Salmikkhang community.',
      ownerEmail: emailLower,
    };
    const prevMembers = members;
    setMembers(prev => [newMember, ...prev]);
    void (async () => {
      try {
        const mId = sanitizeId(newMember.id);
        await fsSet(`members/${mId}`, toMemberPublicPayload(newMember), OperationType.CREATE);
        await fsSet(`members/${mId}/private/contact`, toMemberPrivatePayload(newMember), OperationType.CREATE);
        await syncMemberRoleGrant(newMember);
        showToast(
          t(
            `Member ${newMember.name} registered! ID: ${newMember.memberNo}. They can sign in with Google (${emailLower}).`,
            `সদস্য ${newMember.name} নিবন্ধিত হয়েছেন! আইডি: ${newMember.memberNo}। Google (${emailLower}) দিয়ে লগইন করতে পারবেন।`
          ),
          'success'
        );
      } catch {
        setMembers(prevMembers);
        notifyCloudSyncFailure();
      }
    })();
  };

  // CRUD Actions
  const submitJoinRequest = (req: Omit<JoinRequest, 'id' | 'status' | 'date'>) => {
    const newReq: JoinRequest = {
      ...req,
      id: `jr-${Date.now()}`,
      status: 'Pending',
      date: new Date().toISOString().split('T')[0],
    };
    const prevRequests = joinRequests;
    setJoinRequests(prev => [newReq, ...prev]);
    void (async () => {
      try {
        await fsSet(`joinRequests/${sanitizeId(newReq.id)}`, toJoinRequestPayload(newReq), OperationType.CREATE);
        showToast(
          t('Application sent to Admin! The council will verify your information and register you.', 'আবেদনটি অ্যাডমিনের নিকট পাঠানো হয়েছে! তথ্যাদি যাচাই করে অ্যাডমিন আপনাকে নিবন্ধন করবেন।'),
          'success'
        );
      } catch {
        setJoinRequests(prevRequests);
        notifyCloudSyncFailure();
      }
    })();
  };

  const approveJoinRequest = (requestId: string, role: Member['role'] = 'Member') => {
    if (!isAdminLoggedIn) return;
    const req = joinRequests.find(r => r.id === requestId);
    if (!req || req.status === 'Approved') return;

    const emailLower = (req.email || '').trim().toLowerCase();
    const existingMember = emailLower
      ? members.find(m => (m.ownerEmail || m.email || '').trim().toLowerCase() === emailLower)
      : undefined;

    const prevMembers = members;
    const prevJoinRequests = joinRequests;
    const updatedReq: JoinRequest = { ...req, status: 'Approved' };
    setJoinRequests(prev => prev.map(r => (r.id === requestId ? updatedReq : r)));

    if (existingMember) {
      void (async () => {
        try {
          await fsSet(`joinRequests/${sanitizeId(requestId)}`, toJoinRequestPayload(updatedReq), OperationType.UPDATE);
          showToast(
            t(
              `${existingMember.name} is already registered (${existingMember.memberNo}). Application marked Approved.`,
              `${existingMember.name} ইতিমধ্যেই নিবন্ধিত (${existingMember.memberNo})। আবেদনটি অনুমোদিত হিসেবে চিহ্নিত হয়েছে।`
            ),
            'info'
          );
        } catch {
          setJoinRequests(prevJoinRequests);
          notifyCloudSyncFailure();
        }
      })();
      return;
    }

    const parsedSkills = parseTagList(req.skills);
    const parsedInterests = parseTagList(req.interests);
    const newMember: Member = {
      id: `m-${Date.now()}`,
      memberNo: nextSequentialCode('SMK', members.map(m => m.memberNo)),
      name: (req.name || '').trim(),
      email: emailLower,
      phone: (req.phone || '').trim(),
      role,
      status: 'Active',
      village: req.village || 'Gaira',
      bloodGroup: req.bloodGroup || 'O+',
      skills: parsedSkills.length > 0 ? parsedSkills : ['Volunteering'],
      interests: parsedInterests.length > 0 ? parsedInterests : ['Community Development'],
      joinDate: new Date().toISOString().split('T')[0],
      bio: req.reason || 'Active member of Salmikkhang Youth Community.',
      ownerEmail: emailLower,
    };

    setMembers(prev => [newMember, ...prev]);

    void (async () => {
      try {
        const mId = sanitizeId(newMember.id);
        await fsSet(`members/${mId}`, toMemberPublicPayload(newMember), OperationType.CREATE);
        await fsSet(`members/${mId}/private/contact`, toMemberPrivatePayload(newMember), OperationType.CREATE);
        await syncMemberRoleGrant(newMember);
        await fsSet(`joinRequests/${sanitizeId(requestId)}`, toJoinRequestPayload(updatedReq), OperationType.UPDATE);
        showToast(
          t(`${req.name} has been enrolled as an active member!`, `${req.name}-কে সদস্য হিসেবে নিবন্ধন করা হয়েছে!`),
          'success'
        );
      } catch {
        setMembers(prevMembers);
        setJoinRequests(prevJoinRequests);
        notifyCloudSyncFailure();
      }
    })();
  };

  const rejectJoinRequest = (requestId: string) => {
    if (!isAdminLoggedIn) return;
    const req = joinRequests.find(r => r.id === requestId);
    if (!req) return;
    const prevJoinRequests = joinRequests;
    const updatedReq: JoinRequest = { ...req, status: 'Rejected' };
    setJoinRequests(prev => prev.map(r => (r.id === requestId ? updatedReq : r)));
    void (async () => {
      try {
        await fsSet(`joinRequests/${sanitizeId(requestId)}`, toJoinRequestPayload(updatedReq), OperationType.UPDATE);
        showToast(t('Join request status updated to Rejected', 'আবেদনটি বাতিল হিসেবে চিহ্নিত হয়েছে'), 'info');
      } catch {
        setJoinRequests(prevJoinRequests);
        notifyCloudSyncFailure();
      }
    })();
  };

  const updateMember = (id: string, updated: Partial<Member>) => {
    const existingMember = members.find(m => m.id === id);
    if (!existingMember) return;

    const userEmail = auth.currentUser?.email?.toLowerCase();
    const userUid = auth.currentUser?.uid;
    const isSelf = Boolean(
      (userUid && existingMember.ownerUid === userUid) ||
        (userEmail &&
          (existingMember.ownerEmail?.toLowerCase() === userEmail ||
            existingMember.email?.toLowerCase() === userEmail))
    );

    if (!isAdminLoggedIn && !isSelf) {
      showToast(
        t(
          'Permission denied! Only Admin can edit other members.',
          'অনুমতি নেই! শুধুমাত্র অ্যাডমিন অন্য সদস্যদের তথ্য পরিবর্তন করতে পারবেন।'
        ),
        'warning'
      );
      return;
    }

    const oldEmailLower = (existingMember.ownerEmail || existingMember.email || '').trim().toLowerCase();

    const safeUpdate: Partial<Member> = isAdminLoggedIn
      ? updated
      : {
          ...(updated.phone !== undefined ? { phone: updated.phone } : {}),
          ...(updated.village !== undefined ? { village: updated.village } : {}),
          ...(updated.bloodGroup !== undefined ? { bloodGroup: updated.bloodGroup } : {}),
          ...(updated.bio !== undefined ? { bio: updated.bio } : {}),
          ...(updated.avatar !== undefined ? { avatar: updated.avatar } : {}),
        };

    const nextEmailLower = (
      isAdminLoggedIn
        ? updated.email !== undefined
          ? updated.email
          : existingMember.ownerEmail || existingMember.email || ''
        : existingMember.ownerEmail || existingMember.email || ''
    )
      .trim()
      .toLowerCase();

    const merged: Member = {
      ...existingMember,
      ...safeUpdate,
      ...(nextEmailLower ? { email: nextEmailLower } : {}),
      ownerEmail: nextEmailLower,
    };

    const prevMembers = members;
    const prevCurrentMember = currentMember;
    setMembers(prev => prev.map(m => (m.id === id ? merged : m)));
    if (currentMember?.id === id) {
      setCurrentMember(merged);
    }
    if (isAdminLoggedIn && nextEmailLower && firebaseUser?.email?.toLowerCase() === nextEmailLower) {
      setGrantedRole(merged.role);
      if (!isBootstrapAdminEmail(nextEmailLower)) {
        setIsAdminLoggedIn(merged.role === 'Admin');
      }
    }

    const mId = sanitizeId(id);
    if (isAdminLoggedIn) {
      void (async () => {
        try {
          await fsSet(`members/${mId}`, toMemberPublicPayload(merged), OperationType.WRITE);
          await fsSet(`members/${mId}/private/contact`, toMemberPrivatePayload(merged), OperationType.WRITE);
          if (oldEmailLower && nextEmailLower && oldEmailLower !== nextEmailLower) {
            await removeMemberRoleGrant(oldEmailLower).catch(() => {});
          }
          await syncMemberRoleGrant(merged);
          if (merged.ownerUid && sanitizeId(merged.ownerUid) === merged.ownerUid && !isBootstrapAdminEmail(nextEmailLower)) {
            if (merged.role === 'Admin') {
              await fsSet(
                `admins/${merged.ownerUid}`,
                {
                  uid: merged.ownerUid,
                  email: nextEmailLower || 'admin@salmikkhang.org',
                  grantedBy: auth.currentUser?.email || BOOTSTRAP_ADMIN_EMAIL,
                },
                OperationType.WRITE
              );
            } else if (updated.role !== undefined) {
              await fsDelete(`admins/${merged.ownerUid}`).catch(() => {});
            }
          }
          showToast(t('Member details updated', 'সদস্যের তথ্য সফলভাবে হালনাগাদ করা হয়েছে'), 'success');
        } catch (err) {
          console.error('Failed to update member:', err);
          setMembers(prevMembers);
          setCurrentMember(prevCurrentMember);
          showToast(
            t(
              'Could not save update to Firestore. Ensure latest firestore.rules are published in Firebase Console.',
              'ফায়ারস্টোরে তথ্য সংরক্ষণ করা যায়নি। Firebase Console-এ সর্বশেষ firestore.rules প্রকাশ করা আছে কিনা পরীক্ষা করুন।'
            ),
            'warning'
          );
        }
      })();
    } else if (auth.currentUser?.uid) {
      const uid = auth.currentUser.uid;
      void (async () => {
        try {
          await updateDoc(
            doc(db, 'members', mId),
            cleanObj({
              ...(safeUpdate.village !== undefined ? { village: clampStr(safeUpdate.village, 100) } : {}),
              ...(safeUpdate.bloodGroup !== undefined ? { bloodGroup: clampStr(safeUpdate.bloodGroup, 10) } : {}),
              ...(safeUpdate.bio !== undefined ? { bio: clampStr(safeUpdate.bio, 1000) } : {}),
              ...(safeUpdate.avatar !== undefined ? { avatar: clampStr(safeUpdate.avatar, 450000) } : {}),
              ownerUid: uid,
            })
          );
          if (safeUpdate.phone !== undefined) {
            await updateDoc(
              doc(db, 'members', mId, 'private', 'contact'),
              cleanObj({
                phone: clampStr(safeUpdate.phone, 40),
                ownerUid: uid,
              })
            );
          }
          showToast(t('Member details updated', 'সদস্যের তথ্য সফলভাবে হালনাগাদ করা হয়েছে'), 'success');
        } catch (err) {
          setMembers(prevMembers);
          setCurrentMember(prevCurrentMember);
          logFirestoreFailure(err, OperationType.UPDATE, `members/${mId}`);
          notifyCloudSyncFailure();
        }
      })();
    }
  };

  const deleteMember = (id: string) => {
    if (!isAdminLoggedIn) return;
    const target = members.find(m => m.id === id);
    const prevMembers = members;
    const prevCurrent = currentMember;
    setMembers(prev => prev.filter(m => m.id !== id));
    if (currentMember?.id === id) {
      setCurrentMember(null);
    }
    void (async () => {
      try {
        const mId = sanitizeId(id);
        await fsDelete(`members/${mId}/private/contact`);
        await fsDelete(`members/${mId}`);
        if (target?.email) await removeMemberRoleGrant(target.email);
        showToast(t('Member removed from directory', 'সদস্য তালিকা থেকে অপসারিত হয়েছে'), 'info');
      } catch {
        setMembers(prevMembers);
        setCurrentMember(prevCurrent);
        notifyCloudSyncFailure();
      }
    })();
  };

  const submitContactMessage = (msg: Omit<ContactMessage, 'id' | 'date' | 'status'>) => {
    const newMsg: ContactMessage = {
      ...msg,
      id: `msg-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      status: 'Unread',
    };
    const prevMessages = messages;
    setMessages(prev => [newMsg, ...prev]);
    void (async () => {
      try {
        await fsSet(`messages/${sanitizeId(newMsg.id)}`, toMessagePayload(newMsg), OperationType.CREATE);
        showToast(
          t('Your message has been sent to Salmikkhang organizers!', 'আপনার বার্তা সফলভাবে সালমিকখাং আয়োজকদের কাছে পাঠানো হয়েছে!'),
          'success'
        );
      } catch {
        setMessages(prevMessages);
        notifyCloudSyncFailure();
      }
    })();
  };

  const markMessageStatus = (id: string, status: ContactMessage['status']) => {
    if (!isAdminLoggedIn) return;
    const existingMsg = messages.find(m => m.id === id);
    if (!existingMsg) return;
    const prevMessages = messages;
    const merged: ContactMessage = { ...existingMsg, status };
    setMessages(prev => prev.map(m => (m.id === id ? merged : m)));
    void (async () => {
      try {
        await fsSet(`messages/${sanitizeId(id)}`, toMessagePayload(merged), OperationType.UPDATE);
      } catch {
        setMessages(prevMessages);
        notifyCloudSyncFailure();
      }
    })();
  };

  const deleteMessage = (id: string) => {
    if (!isAdminLoggedIn) return;
    const prevMessages = messages;
    setMessages(prev => prev.filter(m => m.id !== id));
    void (async () => {
      try {
        await fsDelete(`messages/${sanitizeId(id)}`);
        showToast(t('Message deleted', 'বার্তা মুছে ফেলা হয়েছে'), 'info');
      } catch {
        setMessages(prevMessages);
        notifyCloudSyncFailure();
      }
    })();
  };

  const toggleEventRsvp = (eventId: string, userNameOrEmail: string) => {
    if (!auth.currentUser || !auth.currentUser.emailVerified) {
      showToast(
        t('Please sign in with Google to RSVP for community events.', 'অনুষ্ঠানে অংশগ্রহণ নিশ্চিত করতে অনুগ্রহ করে Google দিয়ে লগইন করুন।'),
        'info'
      );
      openModal('login');
      return;
    }

    const ev = events.find(e => e.id === eventId);
    if (!ev) return;

    const identifier = currentMember?.name || auth.currentUser.displayName || userNameOrEmail;
    const currentRsvps = Array.isArray(ev.rsvps) ? ev.rsvps : [];
    const exists = currentRsvps.includes(identifier);
    const updatedRsvps = exists ? currentRsvps.filter(u => u !== identifier) : [...currentRsvps, identifier];

    const prevEvents = events;
    setEvents(prev => prev.map(item => (item.id === eventId ? { ...item, rsvps: updatedRsvps } : item)));

    void (async () => {
      try {
        await updateDoc(doc(db, 'events', sanitizeId(eventId)), {
          rsvps: updatedRsvps.slice(0, 500),
        });
        showToast(
          exists
            ? t('You canceled your RSVP for this event.', 'আপনি এই ইভেন্টের অংশগ্রহণ বাতিল করেছেন।')
            : t('RSVP confirmed! See you at the event.', 'আপনার অংশগ্রহণ নিশ্চিত হয়েছে! অনুষ্ঠানে দেখা হবে।'),
          exists ? 'info' : 'success'
        );
      } catch (err) {
        setEvents(prevEvents);
        logFirestoreFailure(err, OperationType.UPDATE, `events/${eventId}`);
        notifyCloudSyncFailure();
      }
    })();
  };

  const addEvent = (event: Omit<CommunityEvent, 'id' | 'rsvps'>) => {
    if (!canManageEventsPermission()) return;
    const newEvent: CommunityEvent = {
      ...event,
      id: `ev-${Date.now()}`,
      rsvps: [],
    };
    const prevEvents = events;
    const prevNotifications = notifications;
    setEvents(prev => [newEvent, ...prev]);

    const notif: MemberNotification = {
      id: `notif-${Date.now()}`,
      title: `New Event: ${event.title}`,
      titleBn: `নতুন অনুষ্ঠান: ${event.titleBn || event.title}`,
      message: `${event.date} · ${event.location} (${event.visibility === 'members_only' ? 'Members Only' : 'Public'})`,
      messageBn: `${event.date} · ${event.locationBn || event.location}`,
      date: event.date,
      type: 'event',
      read: false,
    };
    setNotifications(prev => [notif, ...prev]);

    void (async () => {
      try {
        await fsSet(`events/${sanitizeId(newEvent.id)}`, toEventPayload(newEvent), OperationType.CREATE);
        await fsSet(`notifications/${sanitizeId(notif.id)}`, toNotificationPayload(notif), OperationType.CREATE);
        showToast(
          t('Event announced and notification sent to members', 'নতুন অনুষ্ঠান যুক্ত হয়েছে এবং সদস্যদের নোটিফিকেশন পাঠানো হয়েছে'),
          'success'
        );
        const appUrl =
          typeof window !== 'undefined' ? `${window.location.origin}/` : 'https://salmikkhang.vercel.app/';
        void dispatchAutomaticEmailAlert(buildDraftFromEvent(newEvent, appUrl));
      } catch {
        setEvents(prevEvents);
        setNotifications(prevNotifications);
        notifyCloudSyncFailure();
      }
    })();
  };

  const updateEvent = (id: string, event: Partial<CommunityEvent>) => {
    if (!canManageEventsPermission()) return;
    const existingEv = events.find(e => e.id === id);
    if (!existingEv) return;
    const prevEvents = events;
    const merged = { ...existingEv, ...event };
    setEvents(prev => prev.map(e => (e.id === id ? merged : e)));
    void (async () => {
      try {
        await fsSet(`events/${sanitizeId(id)}`, toEventPayload(merged), OperationType.UPDATE);
        showToast(t('Event updated successfully', 'ইভেন্ট সফলভাবে হালনাগাদ হয়েছে'), 'success');
      } catch {
        setEvents(prevEvents);
        notifyCloudSyncFailure();
      }
    })();
  };

  const deleteEvent = (id: string) => {
    if (!canManageEventsPermission()) return;
    const prevEvents = events;
    setEvents(prev => prev.filter(e => e.id !== id));
    void (async () => {
      try {
        await fsDelete(`events/${sanitizeId(id)}`);
        showToast(t('Event removed', 'অনুষ্ঠানটি মুছে ফেলা হয়েছে'), 'info');
      } catch {
        setEvents(prevEvents);
        notifyCloudSyncFailure();
      }
    })();
  };

  // Add Notice with PDF & Notification dispatch
  const addNewsItem = (item: Omit<NewsItem, 'id'>) => {
    if (!canManageNoticesPermission()) return;
    const newItem: NewsItem = {
      ...item,
      visibility: item.visibility || 'public',
      id: `n-${Date.now()}`,
    };
    const prevNews = news;
    const prevNotifications = notifications;
    setNews(prev => [newItem, ...prev]);

    const notif: MemberNotification = {
      id: `notif-${Date.now()}`,
      title: item.title,
      titleBn: item.titleBn,
      message: `${item.visibility === 'members_only' ? '[Members Only] ' : ''}${item.summary || item.content.slice(0, 100)}`,
      messageBn: `${item.visibility === 'members_only' ? '[শুধুমাত্র সদস্য] ' : ''}${item.summaryBn || item.contentBn.slice(0, 100)}`,
      date: item.date || new Date().toISOString().split('T')[0],
      type: 'notice',
      pdfAttachment: item.pdfAttachment,
      read: false,
    };
    setNotifications(prev => [notif, ...prev]);

    void (async () => {
      try {
        await fsSet(`news/${sanitizeId(newItem.id)}`, toNewsPayload(newItem), OperationType.CREATE);
        await fsSet(`notifications/${sanitizeId(notif.id)}`, toNotificationPayload(notif), OperationType.CREATE);
        showToast(
          item.visibility === 'members_only'
            ? t('Private Notice published for Members Only!', 'শুধুমাত্র সদস্যদের জন্য অভ্যন্তরীণ নোটিশ প্রকাশিত হয়েছে!')
            : item.pdfAttachment
            ? t('Public Notice & PDF document published! Notification dispatched to all members.', 'পাবলিক নোটিশ ও PDF প্রকাশিত হয়েছে! সকল সদস্যদের নোটিফিকেশন পাঠানো হয়েছে।')
            : t('Notice / News published!', 'খবর বা নোটিশ প্রকাশিত হয়েছে!'),
          'success'
        );
        const appUrl =
          typeof window !== 'undefined' ? `${window.location.origin}/` : 'https://salmikkhang.vercel.app/';
        void dispatchAutomaticEmailAlert(buildDraftFromNews(newItem, appUrl));
      } catch {
        setNews(prevNews);
        setNotifications(prevNotifications);
        notifyCloudSyncFailure();
      }
    })();
  };

  const updateNewsItem = (id: string, item: Partial<NewsItem>) => {
    if (!canManageNoticesPermission()) return;
    const existingNews = news.find(n => n.id === id);
    if (!existingNews) return;
    const prevNews = news;
    const merged = { ...existingNews, ...item };
    setNews(prev => prev.map(n => (n.id === id ? merged : n)));
    void (async () => {
      try {
        await fsSet(`news/${sanitizeId(id)}`, toNewsPayload(merged), OperationType.UPDATE);
        showToast(t('News item updated', 'সংবাদটি হালনাগাদ করা হয়েছে'), 'success');
      } catch {
        setNews(prevNews);
        notifyCloudSyncFailure();
      }
    })();
  };

  const deleteNewsItem = (id: string) => {
    if (!canManageNoticesPermission()) return;
    const prevNews = news;
    setNews(prev => prev.filter(n => n.id !== id));
    void (async () => {
      try {
        await fsDelete(`news/${sanitizeId(id)}`);
        showToast(t('News item deleted', 'সংবাদটি মুছে ফেলা হয়েছে'), 'info');
      } catch {
        setNews(prevNews);
        notifyCloudSyncFailure();
      }
    })();
  };

  const markNotificationAsRead = (id: string) => {
    const prevNotifications = notifications;
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
    if (auth.currentUser?.emailVerified) {
      void (async () => {
        try {
          await updateDoc(doc(db, 'notifications', sanitizeId(id)), { read: true });
        } catch (err) {
          setNotifications(prevNotifications);
          logFirestoreFailure(err, OperationType.UPDATE, `notifications/${id}`);
        }
      })();
    }
  };

  const clearAllNotifications = () => {
    const ids = notifications.filter(n => !n.read).map(n => n.id);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    if (auth.currentUser?.emailVerified) {
      ids.forEach((id) => {
        void updateDoc(doc(db, 'notifications', sanitizeId(id)), { read: true }).catch((err) =>
          logFirestoreFailure(err, OperationType.UPDATE, `notifications/${id}`)
        );
      });
    }
    showToast(t('All notifications marked as read', 'সব নোটিফিকেশন পঠিত হিসেবে চিহ্নিত করা হয়েছে'), 'info');
  };

  const addProject = (proj: Omit<Project, 'id'>) => {
    if (!canManageProjectsPermission()) return;
    const newProj: Project = {
      ...proj,
      id: `p-${Date.now()}`,
    };
    const prevProjects = projects;
    const prevNotifications = notifications;
    const canAlsoNotifyFeed =
      isAdminLoggedIn || canManageNoticesPermission() || canManageEventsPermission();
    const projectNotif: MemberNotification = {
      id: `notif-${Date.now()}`,
      title: `New Project: ${proj.title}`,
      titleBn: `নতুন প্রকল্প: ${proj.titleBn || proj.title}`,
      message: `${proj.category} · ${proj.status} (${proj.progress || 0}%)`,
      messageBn: `${proj.categoryBn || proj.category} · ${proj.statusBn || proj.status}`,
      date: new Date().toISOString().split('T')[0],
      type: 'notice',
      read: false,
    };

    setProjects(prev => [newProj, ...prev]);
    if (canAlsoNotifyFeed) {
      setNotifications(prev => [projectNotif, ...prev]);
    }
    void (async () => {
      try {
        await fsSet(`projects/${sanitizeId(newProj.id)}`, toProjectPayload(newProj), OperationType.CREATE);
        if (canAlsoNotifyFeed) {
          await fsSet(
            `notifications/${sanitizeId(projectNotif.id)}`,
            toNotificationPayload(projectNotif),
            OperationType.CREATE
          ).catch(() => {});
        }
        showToast(t('Project added', 'নতুন উদ্যোগ যুক্ত হয়েছে'), 'success');
        const appUrl =
          typeof window !== 'undefined' ? `${window.location.origin}/` : 'https://salmikkhang.vercel.app/';
        void dispatchAutomaticEmailAlert(buildDraftFromProject(newProj, appUrl));
      } catch {
        setProjects(prevProjects);
        setNotifications(prevNotifications);
        notifyCloudSyncFailure();
      }
    })();
  };

  const updateProject = (id: string, proj: Partial<Project>) => {
    if (!canManageProjectsPermission()) return;
    const existingProj = projects.find(p => p.id === id);
    if (!existingProj) return;
    const prevProjects = projects;
    const merged = { ...existingProj, ...proj };
    setProjects(prev => prev.map(p => (p.id === id ? merged : p)));
    void (async () => {
      try {
        await fsSet(`projects/${sanitizeId(id)}`, toProjectPayload(merged), OperationType.UPDATE);
        showToast(t('Project updated', 'প্রকল্প হালনাগাদ হয়েছে'), 'success');
      } catch {
        setProjects(prevProjects);
        notifyCloudSyncFailure();
      }
    })();
  };

  const deleteProject = (id: string) => {
    if (!canManageProjectsPermission()) return;
    const prevProjects = projects;
    setProjects(prev => prev.filter(p => p.id !== id));
    void (async () => {
      try {
        await fsDelete(`projects/${sanitizeId(id)}`);
        showToast(t('Project removed', 'উদ্যোগটি অপসারণ করা হয়েছে'), 'info');
      } catch {
        setProjects(prevProjects);
        notifyCloudSyncFailure();
      }
    })();
  };

  const addGalleryItem = (item: Omit<GalleryItem, 'id'>) => {
    if (!canManageGalleryPermission()) return;
    const newItem: GalleryItem = {
      ...item,
      id: `g-${Date.now()}`,
      visibility: 'public',
    };
    const prevGallery = gallery;
    setGallery(prev => [newItem, ...prev]);
    void (async () => {
      try {
        await fsSet(`gallery/${sanitizeId(newItem.id)}`, toGalleryPayload(newItem), OperationType.CREATE);
        showToast(t('Photo album item added', 'গ্যালারিতে নতুন ছবি যুক্ত হয়েছে'), 'success');
      } catch {
        setGallery(prevGallery);
        notifyCloudSyncFailure();
      }
    })();
  };

  const updateGalleryItem = (id: string, item: Partial<GalleryItem>) => {
    if (!canManageGalleryPermission()) return;
    const existingItem = gallery.find(g => g.id === id);
    if (!existingItem) return;
    const prevGallery = gallery;
    const merged: GalleryItem = {
      ...existingItem,
      ...item,
      id: existingItem.id,
      visibility: 'public',
    };
    setGallery(prev => prev.map(g => (g.id === id ? merged : g)));
    void (async () => {
      try {
        await fsSet(`gallery/${sanitizeId(id)}`, toGalleryPayload(merged), OperationType.UPDATE);
        showToast(t('Gallery photo updated', 'গ্যালারির ছবি হালনাগাদ হয়েছে'), 'success');
      } catch {
        setGallery(prevGallery);
        notifyCloudSyncFailure();
      }
    })();
  };

  const deleteGalleryItem = (id: string) => {
    if (!canManageGalleryPermission()) return;
    const prevGallery = gallery;
    setGallery(prev => prev.filter(g => g.id !== id));
    void (async () => {
      try {
        await fsDelete(`gallery/${sanitizeId(id)}`);
        showToast(t('Gallery photo deleted', 'ছবিটি মুছে ফেলা হয়েছে'), 'info');
      } catch {
        setGallery(prevGallery);
        notifyCloudSyncFailure();
      }
    })();
  };

  const addDiscussionPost = (text: string, category: DiscussionPost['category']) => {
    if (!auth.currentUser?.uid || !auth.currentUser.emailVerified) {
      showToast(t('Please sign in with Google to post.', 'পোস্ট করতে Google দিয়ে লগইন করুন।'), 'warning');
      return;
    }
    const uid = auth.currentUser.uid;
    const author = currentMember?.name || auth.currentUser.displayName || 'Village Member';
    const role = currentMember?.role || 'Member';
    const avatar = currentMember?.avatar || auth.currentUser.photoURL || undefined;
    const newPost: DiscussionPost = {
      id: `d-${Date.now()}`,
      authorUid: uid,
      authorName: author,
      authorRole: role,
      ...(avatar ? { authorAvatar: avatar } : {}),
      date: new Date().toISOString().split('T')[0],
      text,
      category,
      likes: 0,
      likedByMe: false,
      likedByUids: [],
      replies: [],
    };
    const prevDiscussions = discussions;
    setDiscussions(prev => [newPost, ...prev]);
    void (async () => {
      try {
        await fsSet(`discussions/${sanitizeId(newPost.id)}`, toDiscussionPayload(newPost, uid), OperationType.CREATE);
        showToast(t('Your thought has been posted on the Youth Wall!', 'আপনার বার্তাটি যুব ফোরামে যুক্ত হয়েছে!'), 'success');
      } catch {
        setDiscussions(prevDiscussions);
        notifyCloudSyncFailure();
      }
    })();
  };

  const likeDiscussionPost = (id: string) => {
    if (!auth.currentUser?.uid || !auth.currentUser.emailVerified) return;
    const uid = auth.currentUser.uid;
    const target = discussions.find(p => p.id === id);
    if (!target) return;

    const uids = Array.isArray(target.likedByUids) ? target.likedByUids : [];
    const alreadyLiked = uids.includes(uid);
    const updatedUids = alreadyLiked ? uids.filter(u => u !== uid) : [...uids, uid];
    const updatedLikes = alreadyLiked ? Math.max(0, target.likes - 1) : target.likes + 1;

    const prevDiscussions = discussions;
    setDiscussions(prev =>
      prev.map(p => (p.id === id ? { ...p, likedByMe: !alreadyLiked, likedByUids: updatedUids, likes: updatedLikes } : p))
    );

    void (async () => {
      try {
        await updateDoc(doc(db, 'discussions', sanitizeId(id)), {
          likes: updatedLikes,
          likedByUids: updatedUids.slice(0, 500),
        });
      } catch (err) {
        setDiscussions(prevDiscussions);
        logFirestoreFailure(err, OperationType.UPDATE, `discussions/${id}`);
        notifyCloudSyncFailure();
      }
    })();
  };

  const addDiscussionReply = (postId: string, text: string) => {
    if (!auth.currentUser?.uid || !auth.currentUser.emailVerified) return;
    const target = discussions.find(p => p.id === postId);
    if (!target) return;

    const author = currentMember?.name || auth.currentUser.displayName || 'Community Member';
    const role = currentMember?.role || 'Member';
    const replyItem = {
      id: `dr-${Date.now()}`,
      author,
      role,
      text,
      date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    const updatedReplies = [...target.replies, replyItem].slice(0, 200);

    const prevDiscussions = discussions;
    setDiscussions(prev =>
      prev.map(p => (p.id === postId ? { ...p, replies: updatedReplies } : p))
    );

    void (async () => {
      try {
        await updateDoc(doc(db, 'discussions', sanitizeId(postId)), {
          replies: updatedReplies,
        });
        showToast(t('Reply added to discussion', 'মন্তব্য সফলভাবে যুক্ত হয়েছে'), 'success');
      } catch (err) {
        setDiscussions(prevDiscussions);
        logFirestoreFailure(err, OperationType.UPDATE, `discussions/${postId}`);
        notifyCloudSyncFailure();
      }
    })();
  };

  const deleteDiscussionPost = (id: string) => {
    const target = discussions.find(p => p.id === id);
    if (!target) return;
    const uid = auth.currentUser?.uid;
    if (!isAdminLoggedIn && (!uid || target.authorUid !== uid)) {
      showToast(
        t('Only Admin or the post author can delete this post.', 'শুধুমাত্র অ্যাডমিন বা পোস্টদাতা এটি মুছতে পারবেন।'),
        'warning'
      );
      return;
    }
    const prevDiscussions = discussions;
    setDiscussions(prev => prev.filter(p => p.id !== id));
    void (async () => {
      try {
        await fsDelete(`discussions/${sanitizeId(id)}`);
        showToast(t('Discussion post removed', 'ফোরাম পোস্টটি মুছে ফেলা হয়েছে'), 'info');
      } catch {
        setDiscussions(prevDiscussions);
        notifyCloudSyncFailure();
      }
    })();
  };

  const updateSettings = async (newSettings: Partial<CommunitySettings>) => {
    if (!isAdminLoggedIn) {
      showToast(t('Only Admin can update site settings.', 'শুধুমাত্র অ্যাডমিন সাইটের সেটিংস পরিবর্তন করতে পারবেন।'), 'warning');
      return;
    }

    const hasHeroUpdate = Object.prototype.hasOwnProperty.call(newSettings, 'heroBackground');
    const hasSiteUpdate = Object.prototype.hasOwnProperty.call(newSettings, 'siteBackground');

    if (hasHeroUpdate) {
      const val = newSettings.heroBackground;
      // Delete previous hero background photo before saving the replacement
      setHeroBgAsset(undefined);
      await fsDelete('settings/heroBackground');
      if (val) {
        const clamped = clampStr(val, 580000);
        setHeroBgAsset(clamped);
        await fsSet('settings/heroBackground', { dataUrl: clamped, updatedAt: new Date().toISOString() }, OperationType.WRITE);
      }
      if (settingsMain.heroBackground !== undefined) {
        const { heroBackground: _oldHb, siteBackground: _oldSb, ...cleanExisting } = settingsMain;
        setSettingsMain(cleanExisting);
        await fsSet('settings/main', toSettingsMainPayload(cleanExisting), OperationType.WRITE);
      }
    }

    if (hasSiteUpdate) {
      const val = newSettings.siteBackground;
      // Delete previous site background photo before saving the replacement
      setSiteBgAsset(undefined);
      await fsDelete('settings/siteBackground');
      if (val) {
        const clamped = clampStr(val, 580000);
        setSiteBgAsset(clamped);
        await fsSet('settings/siteBackground', { dataUrl: clamped, updatedAt: new Date().toISOString() }, OperationType.WRITE);
      }
      if (settingsMain.siteBackground !== undefined) {
        const { heroBackground: _oldHb, siteBackground: _oldSb, ...cleanExisting } = settingsMain;
        setSettingsMain(cleanExisting);
        await fsSet('settings/main', toSettingsMainPayload(cleanExisting), OperationType.WRITE);
      }
    }

    const { heroBackground: _hb, siteBackground: _sb, ...mainUpdates } = newSettings;
    if (Object.keys(mainUpdates).length > 0) {
      const { heroBackground: _oldHb, siteBackground: _oldSb, ...cleanExisting } = settingsMain;
      const mergedMain = { ...cleanExisting, ...mainUpdates };
      setSettingsMain(mergedMain);
      await fsSet('settings/main', toSettingsMainPayload(mergedMain), OperationType.WRITE);
    }

    if (!hasHeroUpdate && !hasSiteUpdate) {
      showToast(t('Community settings saved to cloud database', 'কমিউনিটির সেটিংস ক্লাউড ডেটাবেসে সংরক্ষিত হয়েছে'), 'success');
    }
  };

  const resetAllData = () => {
    if (!isAdminLoggedIn) return;
    void (async () => {
      try {
        const res = await purgeLegacyDemoFirestoreData();
        if (res.deleted) {
          safeStorage.set(LEGACY_DEMO_PURGED_KEY, '1');
          showToast(
            t(
              'All old demo data deleted. Only your uploaded records remain.',
              'পুরনো সব ডেমো ডাটা মুছে ফেলা হয়েছে। এখন শুধু আপনার আপলোড করা তথ্যই রয়েছে।'
            ),
            'success'
          );
        } else {
          notifyCloudSyncFailure();
        }
      } catch {
        notifyCloudSyncFailure();
      }
    })();
  };

  const exportDataJSON = () => {
    const bundle = {
      settings,
      members,
      joinRequests,
      events,
      news,
      notifications,
      projects,
      gallery,
      messages,
      discussions,
      funds,
      villageResidents,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `salmikkhang-community-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(t('Data exported as JSON file', 'সকল তথ্য JSON ফাইলে রপ্তানি করা হয়েছে'), 'success');
  };

  // Automatic background email delivery to all active members (zero login popup or manual confirmation)
  const dispatchAutomaticEmailAlert = async (draft: GmailNotificationDraft): Promise<void> => {
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) return;

      const recipientInfo = collectNotificationRecipients({
        members: membersRef.current,
        messages,
        joinRequests,
        visibility: draft.visibility,
        excludeSenderEmail: DEFAULT_GMAIL_SENDER,
      });
      if (recipientInfo.allEmails.length === 0) return;

      const response = await fetch('/api/auto-notify', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipients: recipientInfo.allEmails,
          subject: buildDefaultSubject(draft),
          draft,
        }),
      });

      if (!response.ok) return;
      const data = (await response.json().catch(() => null)) as {
        configured?: boolean;
        sentCount?: number;
      } | null;

      if (data?.configured && typeof data.sentCount === 'number' && data.sentCount > 0) {
        showToast(
          t(
            `Automatic email notification delivered to ${data.sentCount} member(s).`,
            `সকল সদস্যকে (${data.sentCount} জন) স্বয়ংক্রিয়ভাবে ইমেইল পাঠানো হয়েছে।`
          ),
          'success'
        );
      }
    } catch {
      // Never block or disrupt notice/event/project publishing if email network is temporarily offline
    }
  };

  const enableDeviceAlerts = async (): Promise<boolean> => {
    const permission = await requestDeviceNotificationAccess();
    setDeviceNotificationPermission(permission);
    if (permission === 'granted') {
      setDeviceAlertsEnabled(true);
      await registerPeriodicBackgroundSync();
      showToast(
        t(
          'Phone & device background alerts enabled!',
          'ফোন ও ডিভাইস ব্যাকগ্রাউন্ড নোটিফিকেশন চালু হয়েছে!'
        ),
        'success'
      );
      return true;
    }
    setDeviceAlertsEnabled(false);
    showToast(
      permission === 'unsupported'
        ? t(
            'Browser alerts are not supported on this device.',
            'এই ব্রাউজারে সরাসরি নোটিফিকেশন সাপোর্ট নেই।'
          )
        : t(
            'Notification permission was blocked. Allow notifications in browser/phone settings.',
            'নোটিফিকেশন অনুমতি ব্লক করা আছে। ফোনের সেটিংস থেকে চালু করুন।'
          ),
      'warning'
    );
    return false;
  };

  const disableDeviceAlerts = () => {
    setDeviceAlertsPreference(false);
    setDeviceAlertsEnabled(false);
    showToast(
      t('Phone background alerts paused.', 'ফোন ব্যাকগ্রাউন্ড নোটিফিকেশন বন্ধ করা হয়েছে।'),
      'info'
    );
  };

  // Monitor live Firestore updates to trigger PWA/Device notifications & update App Badge
  useEffect(() => {
    const unreadCount = notifications.filter((n) => !n.read).length;
    updateAppUnreadBadge(unreadCount);

    const candidates: CommunityAlertCandidate[] = [
      ...news.map((item) => ({
        id: `news:${item.id}`,
        kind: ((item.category || '').toLowerCase().includes('notice') ? 'notice' : 'news') as
          | 'notice'
          | 'news',
        title: `Salmikkhang: ${t(item.title, item.titleBn || item.title)}`,
        body: t(item.summary || item.content || '', item.summaryBn || item.contentBn || item.summary || ''),
      })),
      ...events.map((ev) => ({
        id: `event:${ev.id}`,
        kind: 'event' as const,
        title: `Salmikkhang Event: ${t(ev.title, ev.titleBn || ev.title)}`,
        body: `${ev.date} · ${t(ev.location, ev.locationBn || ev.location)}`,
      })),
      ...projects.map((proj) => ({
        id: `project:${proj.id}`,
        kind: 'project' as const,
        title: `Salmikkhang Project: ${t(proj.title, proj.titleBn || proj.title)}`,
        body: t(proj.description || '', proj.descriptionBn || proj.description || ''),
      })),
    ];

    if (candidates.length === 0) return;

    // On first non-empty snapshot in this session, establish baseline so old items do not spam
    if (!alertsBaselineReadyRef.current) {
      alertsBaselineReadyRef.current = true;
      const baseline = detectNewCommunityUpdates(seenAlertIdsRef.current, candidates);
      seenAlertIdsRef.current = baseline.nextSeenIds;
      saveSeenAlertIds(baseline.nextSeenIds);
      return;
    }

    const { nextSeenIds, newAlerts } = detectNewCommunityUpdates(seenAlertIdsRef.current, candidates);
    seenAlertIdsRef.current = nextSeenIds;
    saveSeenAlertIds(nextSeenIds);

    if (deviceAlertsEnabled && deviceNotificationPermission === 'granted' && newAlerts.length > 0) {
      newAlerts.slice(0, 3).forEach((alert) => {
        void dispatchDeviceNotification(alert);
      });
    }
  }, [news, events, projects, notifications, deviceAlertsEnabled, deviceNotificationPermission]);

  return (
    <CommunityContext.Provider
      value={{
        currentView,
        setCurrentView,
        language,
        setLanguage,
        toggleLanguage,
        t,
        theme,
        setTheme,
        firebaseUser,
        authLoading,
        authError,
        clearAuthError,
        memberAccessNotice,
        clearMemberAccessNotice,
        adminAccessWarning,
        clearAdminAccessWarning,
        loginWithGoogle,
        verifyExistingGoogleSession,
        logoutGoogle,
        currentMember,
        previewMemberId,
        isMemberSessionUnlocked,
        loginAsMember,
        logoutMember,
        quickSwitchMember,
        resetPreviewMember,
        isAdminLoggedIn,
        isAdminSessionUnlocked,
        canViewAdminPanel,
        isPresidentViewOnly,
        adminLogin,
        adminLogout,
        registerMemberByAdmin,
        canManageFundsPermission,
        canCollectDataPermission,
        canManageNoticesPermission,
        canManageEventsPermission,
        canManageProjectsPermission,
        canManageMembersPermission,
        canManageGalleryPermission,
        assignMemberRole,
        members,
        joinRequests,
        events,
        news,
        notifications,
        markNotificationAsRead,
        clearAllNotifications,
        projects,
        gallery,
        messages,
        discussions,
        funds,
        villageResidents,
        settings,
        toast,
        showToast,
        activeModal,
        modalPayload,
        openModal,
        closeModal,
        submitJoinRequest,
        approveJoinRequest,
        rejectJoinRequest,
        updateMember,
        deleteMember,
        addVillageResident,
        updateVillageResident,
        deleteVillageResident,
        addFundTransaction,
        deleteFundTransaction,
        updateFundTransaction,
        submitContactMessage,
        markMessageStatus,
        deleteMessage,
        toggleEventRsvp,
        addEvent,
        updateEvent,
        deleteEvent,
        addNewsItem,
        updateNewsItem,
        deleteNewsItem,
        addProject,
        updateProject,
        deleteProject,
        addGalleryItem,
        updateGalleryItem,
        deleteGalleryItem,
        addDiscussionPost,
        likeDiscussionPost,
        addDiscussionReply,
        deleteDiscussionPost,
        updateSettings,
        resetAllData,
        exportDataJSON,
        deviceAlertsEnabled,
        deviceNotificationPermission,
        enableDeviceAlerts,
        disableDeviceAlerts,
      }}
    >
      {children}
    </CommunityContext.Provider>
  );
};

export const useCommunity = () => {
  const ctx = useContext(CommunityContext);
  if (!ctx) throw new Error('useCommunity must be used within CommunityProvider');
  return ctx;
};
