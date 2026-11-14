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
} from '../lib/firebase';
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
  syncMemberRoleGrant,
  removeMemberRoleGrant,
} from '../lib/firestoreSync';
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
  initialVillageResidents,
  initialDetailedFunds,
  canManageFunds as checkCanManageFunds,
  canCollectData as checkCanCollectData,
  canManageNotices as checkCanManageNotices,
  canManageEvents as checkCanManageEvents,
  canManageProjects as checkCanManageProjects,
  canManageMembers as checkCanManageMembers,
  canManageGallery as checkCanManageGallery,
} from '../data/organizationRoles';

// Asset references
import heroLandscapeImg from '../assets/images/hero_community_landscape_1794424784970.jpg';
import learningImg from '../assets/images/community_learning_youth_1794424785641.jpg';
import plantationImg from '../assets/images/village_tree_plantation_1794424786374.jpg';
import culturalImg from '../assets/images/youth_cultural_heritage_1794424787606.jpg';
import sportsImg from '../assets/images/village_sports_youth_1794424787423.jpg';

export interface ToastInfo {
  message: string;
  type?: 'success' | 'info' | 'warning';
}

export interface MemberAccessNotice {
  email: string;
  status: 'sent' | 'pending' | 'rejected' | 'inactive';
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
  t: (en: string, bn: string) => string;

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

const initialSettings: CommunitySettings = {
  name: 'Salmikkhang Village Youth Community',
  nameBn: 'সালমিকখাং গ্রাম যুব কমিউনিটি',
  village: 'Gaira, Jolchotro',
  address: 'Gaira, Jolchotro, Madhupur, Tangail, Bangladesh',
  phone: '+880 1712-345678',
  email: 'salmikkhang.community@gmail.com',
  motto: 'Together for a greener, kinder and stronger village',
  mottoBn: 'একত্রে আমরা আমাদের গ্রামের আরও উজ্জ্বল ও সুন্দর ভবিষ্যৎ গড়তে পারি',
  about: 'Salmikkhang is a non-political, grassroots youth organization rooted in Gaira and Jolchotro, Madhupur. We bring young minds together for education, environmental preservation, sports, and community solidarity.',
  aboutBn: 'সালমিকখাং একটি অরাজনৈতিক, তৃণমূল যুব সংগঠন যা গাইরা ও জলছত্র, মধুপুরকে কেন্দ্র করে গঠিত। শিক্ষা, পরিবেশ সংরক্ষণ, খেলাধুলা ও সামাজিক সংহতিতে তরুণদের একত্র করাই আমাদের ব্রত।'
};

const initialMembers: Member[] = [
  {
    id: 'm-0',
    memberNo: 'SMK-ADMIN',
    name: 'Salmikkhang Admin',
    email: 'salmikkhang@gmail.com',
    phone: '+880 1712-345678',
    role: 'Admin',
    status: 'Active',
    village: 'Gaira',
    bloodGroup: 'O+',
    skills: ['System Administration', 'Community Governance', 'Registry Oversight'],
    interests: ['Community Development', 'Transparency'],
    joinDate: '2025-01-01',
    bio: 'Primary System & Community Administrator of Salmikkhang Youth Council.',
    ownerEmail: 'salmikkhang@gmail.com'
  },
  {
    id: 'm-1',
    memberNo: 'SMK-2026-001',
    name: 'Blancho Nokrek',
    email: 'blancho.261071027@smuct.ac.bd',
    phone: '+880 1712-889900',
    role: 'General Secretary',
    status: 'Active',
    village: 'Gaira',
    bloodGroup: 'O+',
    skills: ['Community Leadership', 'Web & Tech', 'Youth Mentorship'],
    interests: ['Environmental Conservation', 'Digital Literacy', 'Achik Culture'],
    joinDate: '2025-01-15',
    bio: 'Dedicated to empowering rural youth, administrative notices, fostering education, and protecting our ancestral natural surroundings in Madhupur.'
  },
  {
    id: 'm-2',
    memberNo: 'SMK-2026-002',
    name: 'Subrata Marak',
    email: 'subrata.cashier@example.com',
    phone: '+880 1715-443322',
    role: 'Cashier',
    status: 'Active',
    village: 'Gaira',
    bloodGroup: 'B+',
    skills: ['Treasury Accounts', 'Fund Audit', 'Budgeting', 'Banking'],
    interests: ['Financial Transparency', 'Community Savings'],
    joinDate: '2025-01-20',
    bio: 'Treasurer & Cashier of Salmikkhang. Authorized to maintain cash books, approve expense vouchers, and calculate fund balances.'
  },
  {
    id: 'm-3',
    memberNo: 'SMK-2026-003',
    name: 'Riton Chisim',
    email: 'riton.assis@example.com',
    phone: '+880 1819-778899',
    role: 'Assistant Cashier',
    status: 'Active',
    village: 'Jolchotro',
    bloodGroup: 'A+',
    skills: ['Cash Collection', 'Receipt Book', 'Field Accounts', 'Spreadsheets'],
    interests: ['Youth Sports Fund', 'Emergency Patient Aid'],
    joinDate: '2025-02-01',
    bio: 'Assistant Cashier working alongside Treasurer. Authorized to receive monthly dues, issue money receipts, and record daily transactions.'
  },
  {
    id: 'm-4',
    memberNo: 'SMK-2026-004',
    name: 'Pritom Sangma',
    email: 'pritom.data@example.com',
    phone: '+880 1912-334455',
    role: 'Data Collector',
    status: 'Active',
    village: 'Gaira',
    bloodGroup: 'AB+',
    skills: ['Field Survey', 'Census Data Collection', 'Interviewing', 'Documentation'],
    interests: ['Village Demographics', 'Winter Relief Mapping'],
    joinDate: '2025-02-15',
    bio: 'Official Field Data Collector authorized by Admin to record and update villager household information, relief needs, and emergency citizen profiles.'
  },
  {
    id: 'm-5',
    memberNo: 'SMK-2026-005',
    name: 'Bipul Rema',
    email: 'bipul.president@example.com',
    phone: '+880 1711-998877',
    role: 'President',
    status: 'Active',
    village: 'Gaira',
    bloodGroup: 'O+',
    skills: ['Strategic Governance', 'Community Moderation', 'Public Dialogue'],
    interests: ['Social Harmony', 'Forest Protection'],
    joinDate: '2025-01-10',
    bio: 'President of Salmikkhang Youth Council. Presiding over executive meetings and steering overall community growth.'
  },
  {
    id: 'm-6',
    memberNo: 'SMK-2026-006',
    name: 'Suman Mankhin',
    email: 'suman.org@example.com',
    phone: '+880 1822-114477',
    role: 'Organizing Secretary',
    status: 'Active',
    village: 'Jolchotro',
    bloodGroup: 'B+',
    skills: ['Member Mobilization', 'Para Unit Coordination', 'Discipline'],
    interests: ['Youth Volunteer Brigade', 'Anti-Addiction Campaigns'],
    joinDate: '2025-03-01',
    bio: 'Organizing Secretary managing member registrations, volunteer deployments, and neighborhood youth units.'
  },
  {
    id: 'm-7',
    memberNo: 'SMK-2026-007',
    name: 'Nabila Rahman',
    email: 'nabila.media@example.com',
    phone: '+880 1799-556677',
    role: 'Publicity Secretary',
    status: 'Active',
    village: 'Jolchotro',
    bloodGroup: 'A+',
    skills: ['Press Releases', 'Social Media', 'Photography', 'Graphic Design'],
    interests: ['Community Bulletins', 'Event Media'],
    joinDate: '2025-03-15',
    bio: 'Publicity & Communication Secretary responsible for publishing announcements, news bulletins, and managing photo galleries.'
  },
  {
    id: 'm-8',
    memberNo: 'SMK-2026-008',
    name: 'Rakib Hasan',
    email: 'rakib.sports@example.com',
    phone: '+880 1819-445566',
    role: 'Sports & Cultural Secretary',
    status: 'Active',
    village: 'Gaira',
    bloodGroup: 'A+',
    skills: ['Football Coaching', 'Tournament Logistics', 'Cultural Arts'],
    interests: ['Youth Sports', 'Traditional Achik Dances'],
    joinDate: '2025-03-01',
    bio: 'Captain of youth football team and coordinator for sports tournaments and indigenous cultural programs.'
  },
  {
    id: 'm-9',
    memberNo: 'SMK-2026-009',
    name: 'Ayesha Akter',
    email: 'ayesha.welfare@example.com',
    phone: '+880 1711-223344',
    role: 'Social Welfare Secretary',
    status: 'Active',
    village: 'Jolchotro',
    bloodGroup: 'B+',
    skills: ['Relief Coordination', 'Environmental Planting', 'First Aid'],
    interests: ['Tree Plantation', 'Winter Cloth Distribution', 'Maternal Health'],
    joinDate: '2025-02-10',
    bio: 'Social Welfare & Relief Secretary leading green village projects and aid for low-income families.'
  },
  {
    id: 'm-10',
    memberNo: 'SMK-2026-010',
    name: 'Subir Rema',
    email: 'subir.advisor@example.com',
    phone: '+880 1723-556677',
    role: 'Advisor',
    status: 'Active',
    village: 'Gaira',
    bloodGroup: 'O+',
    skills: ['Garo Cultural Heritage', 'Conflict Resolution', 'Counseling'],
    interests: ['Traditional Music & Arts', 'Indigenous Rights'],
    joinDate: '2025-01-10',
    bio: 'Senior advisor guiding youth leaders on cultural preservation, ethical conduct, and village harmony.'
  },
  {
    id: 'm-11',
    memberNo: 'SMK-2026-011',
    name: 'Nusrat Jahan',
    email: 'nusrat.j@example.com',
    phone: '+880 1912-778899',
    role: 'Executive Member',
    status: 'Active',
    village: 'Jolchotro',
    bloodGroup: 'AB+',
    skills: ['Tree Nursery Care', 'Social Media', 'Creative Writing'],
    interests: ['Green Madhupur', 'Recycling', 'Plantation'],
    joinDate: '2025-04-18',
    bio: 'Active member participating in executive resolutions and tree sapling nurturing.'
  },
  {
    id: 'm-12',
    memberNo: 'SMK-2026-012',
    name: 'Joyanto Marak',
    email: 'joyanto.m@example.com',
    phone: '+880 1733-882211',
    role: 'Member',
    status: 'Active',
    village: 'Gaira',
    bloodGroup: 'O+',
    skills: ['Volunteering', 'Gardening'],
    interests: ['Youth Development', 'Village Cleanliness'],
    joinDate: '2025-05-01',
    bio: 'General active member participating in community assemblies, forums, and events.'
  }
];

const initialJoinRequests: JoinRequest[] = [
  {
    id: 'jr-1',
    name: 'Mim Akter',
    email: 'mim.akter@example.com',
    phone: '+880 1755-123456',
    village: 'Gaira',
    bloodGroup: 'O+',
    skills: 'Graphic design & posters',
    interests: 'Environment & Tree Plantation',
    reason: 'I want to help with creative posters and participate in tree planting drives in Gaira.',
    status: 'Pending',
    date: '2026-10-15'
  },
  {
    id: 'jr-2',
    name: 'Tanvir Islam',
    email: 'tanvir.isl@example.com',
    phone: '+880 1833-654321',
    village: 'Jolchotro',
    bloodGroup: 'B+',
    skills: 'Photography & video clips',
    interests: 'Youth Events & Sports',
    reason: 'Passionate about documenting youth football tournaments and community gatherings on social media.',
    status: 'Pending',
    date: '2026-10-14'
  }
];

const initialEvents: CommunityEvent[] = [
  {
    id: 'ev-1',
    title: 'Gaira Village Clean-Up & Sanitation Drive',
    titleBn: 'গাইরা গ্রাম পরিচ্ছন্নতা ও স্যানিটেশন অভিযান',
    date: '2026-11-20',
    time: '8:00 AM - 12:30 PM',
    timeBn: 'সকাল ৮:০০ - দুপুর ১২:৩০',
    location: 'Gaira Village Center & Main Road',
    locationBn: 'গাইরা গ্রাম কেন্দ্র ও প্রধান সড়ক',
    category: 'Environment',
    categoryBn: 'পরিবেশ',
    description: 'Youth volunteers will sweep village lanes, clear roadside plastics, and install eco-friendly bamboo waste receptacles.',
    descriptionBn: 'তরুণ স্বেচ্ছাসেবকরা গ্রামের রাস্তাঘাট পরিষ্কার করবেন, প্লাস্টিক বর্জ্য অপসারণ করবেন এবং বাঁশের তৈরি পরিচ্ছন্নতা ঝুড়ি স্থাপন করবেন।',
    image: plantationImg,
    status: 'Upcoming',
    visibility: 'public',
    rsvps: ['blancho.261071027@smuct.ac.bd', 'ayesha.akter@example.com', 'rakib.sports@example.com', 'nusrat.j@example.com']
  },
  {
    id: 'ev-2',
    title: 'Wangala Indigenous Youth Cultural Gathering',
    titleBn: 'ওয়ানগালা আদিবাসী যুব সাংস্কৃতিক সম্মেলন',
    date: '2026-11-28',
    time: '2:30 PM - 7:00 PM',
    timeBn: 'দুপুর ২:৩০ - সন্ধ্যা ৭:০০',
    location: 'Salmikkhang Cultural Grounds, Gaira',
    locationBn: 'সালমিকখাং সাংস্কৃতিক প্রাঙ্গণ, গাইরা',
    category: 'Culture',
    categoryBn: 'সংস্কৃতি',
    description: 'Celebrating Garo/Achik folk heritage, traditional songs, Dama drum rhythms, Dokmanda handloom showcases, and community feast.',
    descriptionBn: 'গারো আচিক লোক ঐতিহ্য, লোকগান, ঐতিহ্যবাহী দামা ড্রামের ছন্দ, দকমান্দা বস্ত্র প্রদর্শনী এবং সম্প্রীতির ঐতিহ্যবাহী উৎসব।',
    image: culturalImg,
    status: 'Upcoming',
    visibility: 'public',
    rsvps: ['blancho.261071027@smuct.ac.bd', 'subir.rema@example.com', 'probal.chisim@example.com']
  },
  {
    id: 'ev-3',
    title: 'Winter Inter-Village Youth Football Cup',
    titleBn: 'শীতকালীন আন্তঃগ্রাম যুব ফুটবল কাপ',
    date: '2026-12-05',
    time: '3:00 PM - 5:30 PM',
    timeBn: 'বিকাল ৩:০০ - ৫:৩০',
    location: 'Jolchotro High School Ground',
    locationBn: 'জলছত্র উচ্চ বিদ্যালয় মাঠ',
    category: 'Sports',
    categoryBn: 'খেলাধুলা',
    description: 'Friendly 7-a-side football tournament between Gaira, Jolchotro, and neighboring village youth teams promoting health and friendship.',
    descriptionBn: 'গাইরা, জলছত্র ও পার্শ্ববর্তী গ্রামের যুব দলগুলোর মধ্যে সৌহার্দ্যপূর্ণ ৭-সাইড ফুটবল টুর্নামেন্ট।',
    image: sportsImg,
    status: 'Upcoming',
    visibility: 'public',
    rsvps: ['rakib.sports@example.com', 'blancho.261071027@smuct.ac.bd']
  },
  {
    id: 'ev-4',
    title: 'Youth Council Internal Strategy & Budget Planning',
    titleBn: 'যুব কাউন্সিলের অভ্যন্তরীণ কর্মপরিকল্পনা ও বাজেট সভা',
    date: '2026-12-12',
    time: '10:00 AM - 1:00 PM',
    timeBn: 'সকাল ১০:০০ - দুপুর ১:০০',
    location: 'Salmikkhang Community Room, Gaira',
    locationBn: 'সালমিকখাং কমিউনিটি কক্ষ, গাইরা',
    category: 'Meeting',
    categoryBn: 'সভা',
    description: 'Confidential strategic meeting for registered youth members to allocate community funds for winter initiatives and volunteer assignments.',
    descriptionBn: 'নিবন্ধিত সদস্যদের অভ্যন্তরীণ বিশেষ সভা, যেখানে শীতকালীন উন্নয়ন কর্মকাণ্ডের বাজেট ও দায়িত্ব বণ্টন করা হবে।',
    image: learningImg,
    status: 'Upcoming',
    visibility: 'members_only',
    rsvps: ['blancho.261071027@smuct.ac.bd', 'ayesha.akter@example.com']
  }
];

const initialNews: NewsItem[] = [
  {
    id: 'n-1',
    title: 'Official Resolution: Monthly Executive Meeting Minutes (PDF Attached)',
    titleBn: 'অফিসিয়াল নোটিশ: মাসিক কার্যনির্বাহী সভার রেজোলিউশন (PDF সংযুক্ত)',
    category: 'Notice',
    categoryBn: 'নোটিশ',
    date: '2026-11-10',
    summary: 'The executive committee met in Gaira to approve the winter budget and project roadmap.',
    summaryBn: 'গাইরায় কার্যনির্বাহী কমিটির সভায় শীতকালীন কর্মপরিকল্পনা ও বাজেট অনুমোদন করা হয়েছে।',
    content: 'All registered members are requested to review the attached resolution PDF document regarding the upcoming tree plantation phase and winter emergency blood bank roster. Your cooperation is appreciated.',
    contentBn: 'আসন্ন বৃক্ষরোপণ কর্মসূচি ও জরুরি রক্তের রোস্টার সম্পর্কিত সভার সিদ্ধান্তসমূহ বিস্তারিতভাবে সংযুক্ত PDF ডকুমেন্টে উল্লেখ করা হয়েছে। সকল সদস্যকে এটি পাঠ করার অনুরোধ জানানো হচ্ছে।',
    image: plantationImg,
    tagColor: 'green',
    status: 'Published',
    visibility: 'members_only',
    pdfAttachment: {
      fileName: 'Salmikkhang_Council_Resolution_Nov_2026.pdf',
      fileSize: '184 KB',
      dataUrl: 'data:application/pdf;base64,JVBERi0xLjMKJcfsj6IKNSAwIG9iago8PAovVHlwZSAvUGFnZQovUGFyZW50IDQgMCBSCi9NZWRpYUJveCBbMCAwIDU5NSA4NDJdCi9Db250ZW50cyA2IDAgUgo+PgplbmRvYmoKNiAwIG9iago8PAovTGVuZ3RoIDcwCj4+CnN0cmVhbQpCVAovRjEgMTggVGYKNTAgODAwIFRECiAoU2FsbWlra2hhbmcgWW91dGggQ29tbXVuaXR5IC0gT2ZmaWNpYWwgTm90aWNlKSBUagpFVAplbmRzdHJlYW0KZW5kb2JqCg=='
    }
  },
  {
    id: 'n-2',
    title: 'Salmikkhang Clean-Up Campaign & Eco-Bins Installed',
    titleBn: 'সালমিকখাং পরিচ্ছন্নতা অভিযান ও পরিবেশবান্ধব ডাস্টবিন স্থাপন',
    category: 'Environment',
    categoryBn: 'পরিবেশ',
    date: '2026-10-20',
    summary: 'Over 40 youth assembled to clean the primary village paths and install waste baskets.',
    summaryBn: '৪০ জনেরও বেশি তরুণ একত্রিত হয়ে গ্রামের প্রধান পথগুলো পরিষ্কার করেন ও বর্জ্য ফেলার ঝুড়ি স্থাপন করেন।',
    content: 'On Friday morning, local youth from Gaira gathered with brooms, gloves, and bamboo baskets. The initiative succeeded in removing plastic debris from a 2-kilometer stretch along Jolchotro road, fostering community responsibility for clean surroundings.',
    contentBn: 'শুক্রবার সকালে গাইরার স্থানীয় তরুণরা ঝাড়ু, গ্লাভস এবং বাঁশের ঝুড়ি নিয়ে সমবেত হন। জলছত্র সড়ক বরাবর ২ কিলোমিটার এলাকায় প্লাস্টিক বর্জ্য অপসারণ করে স্বাস্থ্যসম্মত গ্রাম গড়ে তোলার অঙ্গীকার ব্যক্ত করা হয়।',
    image: plantationImg,
    tagColor: 'green',
    status: 'Published',
    visibility: 'public'
  },
  {
    id: 'n-3',
    title: 'Tree Plantation Drive Volunteer Route Map (PDF Attached)',
    titleBn: 'বৃক্ষরোপণ অভিযানের নির্দেশিকা ও রুট ম্যাপ (PDF সংযুক্ত)',
    category: 'Notice',
    categoryBn: 'নোটিশ',
    date: '2026-10-18',
    summary: 'Detailed route guidelines and sapling distribution list for team coordinators.',
    summaryBn: 'দলীয় সমন্বয়কারীদের জন্য চারা বিতরণ ও রোপণ এলাকার নির্দেশিকা।',
    content: 'Attached PDF includes the exact distribution of 500 indigenous fruit and timber trees along Gaira school road and community fields.',
    contentBn: 'সংযুক্ত PDF ফাইলে গাইরা বিদ্যালয়ের সড়ক ও উন্মুক্ত প্রান্তরে ৫০০টি ফলদ ও বনজ চারা বিতরণের বিস্তারিত রুট দেওয়া হয়েছে।',
    image: learningImg,
    tagColor: 'blue',
    status: 'Published',
    visibility: 'members_only',
    pdfAttachment: {
      fileName: 'Tree_Plantation_Route_and_Guidelines.pdf',
      fileSize: '120 KB',
      dataUrl: 'data:application/pdf;base64,JVBERi0xLjMKJcfsj6IKNSAwIG9iago8PAovVHlwZSAvUGFnZQovUGFyZW50IDQgMCBSCi9NZWRpYUJveCBbMCAwIDU5NSA4NDJdCi9Db250ZW50cyA2IDAgUgo+PgplbmRvYmoKNiAwIG9iago8PAovTGVuZ3RoIDcwCj4+CnN0cmVhbQpCVAovRjEgMTggVGYKNTAgODAwIFRECiAoU2FsbWlra2hhbmcgWW91dGggQ29tbXVuaXR5IC0gUGxhbnRhdGlvbiBHdWlkZWxpbmVzKSBUagpFVAplbmRzdHJlYW0KZW5kb2JqCg=='
    }
  }
];

const initialNotifications: MemberNotification[] = [
  {
    id: 'notif-1',
    title: 'Monthly Council Meeting Minutes & Budget Allocation (PDF)',
    titleBn: 'মাসিক যুব কাউন্সিল সভার সিদ্ধান্ত ও বাজেট বিবরণী (PDF)',
    message: 'Official resolution of the executive committee meeting held in Gaira. Please read the attached document.',
    messageBn: 'গাইরায় অনুষ্ঠিত কার্যনির্বাহী কমিটির সভার রেজোলিউশন ও সিদ্ধান্ত। সংযুক্ত PDF ফাইলটি দেখুন।',
    date: '2026-11-10',
    type: 'notice',
    pdfAttachment: {
      fileName: 'Salmikkhang_Council_Resolution_Nov_2026.pdf',
      fileSize: '184 KB',
      dataUrl: 'data:application/pdf;base64,JVBERi0xLjMKJcfsj6IKNSAwIG9iago8PAovVHlwZSAvUGFnZQovUGFyZW50IDQgMCBSCi9NZWRpYUJveCBbMCAwIDU5NSA4NDJdCi9Db250ZW50cyA2IDAgUgo+PgplbmRvYmoKNiAwIG9iago8PAovTGVuZ3RoIDcwCj4+CnN0cmVhbQpCVAovRjEgMTggVGYKNTAgODAwIFRECiAoU2FsbWlra2hhbmcgWW91dGggQ29tbXVuaXR5IC0gT2ZmaWNpYWwgTm90aWNlKSBUagpFVAplbmRzdHJlYW0KZW5kb2JqCg=='
    },
    read: false
  },
  {
    id: 'notif-2',
    title: 'Upcoming Tree Plantation Volunteer Guidelines (PDF)',
    titleBn: 'আসন্ন বৃক্ষরোপণ অভিযানের স্বেচ্ছাসেবক নির্দেশিকা (PDF)',
    message: 'Guidance and roadside route map for the upcoming Gaira saplings drive.',
    messageBn: 'গাইরা গ্রামের রাস্তা বরাবর বৃক্ষরোপণ কাজের রুট ম্যাপ ও দায়িত্ব বণ্টন।',
    date: '2026-11-05',
    type: 'notice',
    pdfAttachment: {
      fileName: 'Tree_Plantation_Route_and_Guidelines.pdf',
      fileSize: '120 KB',
      dataUrl: 'data:application/pdf;base64,JVBERi0xLjMKJcfsj6IKNSAwIG9iago8PAovVHlwZSAvUGFnZQovUGFyZW50IDQgMCBSCi9NZWRpYUJveCBbMCAwIDU5NSA4NDJdCi9Db250ZW50cyA2IDAgUgo+PgplbmRvYmoKNiAwIG9iago8PAovTGVuZ3RoIDcwCj4+CnN0cmVhbQpCVAovRjEgMTggVGYKNTAgODAwIFRECiAoU2FsbWlra2hhbmcgWW91dGggQ29tbXVuaXR5IC0gUGxhbnRhdGlvbiBHdWlkZWxpbmVzKSBUagpFVAplbmRzdHJlYW0KZW5kb2JqCg=='
    },
    read: true
  }
];

const initialProjects: Project[] = [
  {
    id: 'p-1',
    title: 'Greener Gaira: Sal Forest & Roadside Plantation',
    titleBn: 'সবুজ গাইরা: শালবন ও সড়কপার্শ্ব বৃক্ষরোপণ',
    category: 'Environment',
    categoryBn: 'পরিবেশ',
    status: 'Ongoing',
    statusBn: 'চলমান',
    progress: 75,
    description: 'Planting 1,000 indigenous fruit and timber trees along village pathways to restore greenery and promote biodiversity.',
    descriptionBn: 'গ্রামের সড়ক ও উন্মুক্ত স্থানে ১,০০০টি ফলদ ও বনজ বৃক্ষরোপণ এবং লালন-পালনের উদ্যোগ।',
    image: plantationImg,
    volunteersNeeded: 25,
    volunteersEnrolled: 19
  },
  {
    id: 'p-2',
    title: 'Youth Learning & Digital Skills Circle',
    titleBn: 'যুব শিক্ষা ও ডিজিটাল দক্ষতা বৃত্ত',
    category: 'Education',
    categoryBn: 'শিক্ষা',
    status: 'Ongoing',
    statusBn: 'চলমান',
    progress: 50,
    description: 'Equipping village students with smartphone literacy, computer fundamentals, and academic mentoring.',
    descriptionBn: 'গ্রামের ছাত্রছাত্রীদের কম্পিউটার ও ডিজিটাল সাক্ষরতা প্রদান এবং উচ্চশিক্ষার পরামর্শ।',
    image: learningImg,
    volunteersNeeded: 12,
    volunteersEnrolled: 8
  },
  {
    id: 'p-3',
    title: 'Village Sports Ground & Youth Fitness Club',
    titleBn: 'গ্রামের খেলার মাঠ সংস্কার ও যুব ফিটনেস',
    category: 'Sports',
    categoryBn: 'খেলাধুলা',
    status: 'Planning',
    statusBn: 'পরিকল্পনাধীন',
    progress: 30,
    description: 'Leveling the football field, setting up goalposts, and procuring volleyball nets for daily active play.',
    descriptionBn: 'ফুটবল মাঠ সমতল করা, নতুন গোলপোস্ট স্থাপন এবং যুবকদের নিয়মিত খেলাধুলার সুযোগ তৈরি।',
    image: sportsImg,
    volunteersNeeded: 15,
    volunteersEnrolled: 6
  },
  {
    id: 'p-4',
    title: 'Achik Cultural Center & Musical Archive',
    titleBn: 'আচিক সাংস্কৃতিক কর্নার ও বাদ্যযন্ত্র সংরক্ষণ',
    category: 'Culture',
    categoryBn: 'সংস্কৃতি',
    status: 'Ongoing',
    statusBn: 'চলমান',
    progress: 60,
    description: 'Procuring traditional Garo instruments (Dama, Kram, Rang) and teaching indigenous folk songs to children.',
    descriptionBn: 'ঐতিহ্যবাহী বাদ্যযন্ত্র সংগ্রহ এবং শিশুদের লোকগান ও নৃত্যের প্রাথমিক তালিম প্রদান।',
    image: culturalImg,
    volunteersNeeded: 10,
    volunteersEnrolled: 9
  }
];

const initialGallery: GalleryItem[] = [
  {
    id: 'g-1',
    title: 'Sal Forest Road at Dawn, Gaira',
    titleBn: 'ভোরের আলোয় গাইরা শালবনের মেঠোপথ',
    category: 'Landscape',
    categoryBn: 'প্রকৃতি',
    image: heroLandscapeImg,
    date: '2026-10-15'
  },
  {
    id: 'g-2',
    title: 'Village Youth Learning Circle',
    titleBn: 'উন্মুক্ত আঙিনায় পাঠচক্র ও মতবিনিময়',
    category: 'Education',
    categoryBn: 'শিক্ষা',
    image: learningImg,
    date: '2026-10-10'
  },
  {
    id: 'g-3',
    title: 'Green Saplings Plantation Team',
    titleBn: 'বৃক্ষরোপণ অভিযানের তরুণ দল',
    category: 'Environment',
    categoryBn: 'পরিবেশ',
    image: plantationImg,
    date: '2026-10-05'
  },
  {
    id: 'g-4',
    title: 'Wangala Indigenous Cultural Celebration',
    titleBn: 'ঐতিহ্যবাহী পোশাকে সংস্কৃতি উদযাপন',
    category: 'Culture',
    categoryBn: 'সংস্কৃতি',
    image: culturalImg,
    date: '2026-09-22'
  },
  {
    id: 'g-5',
    title: 'Afternoon Football on Village Green',
    titleBn: 'সবুজ মাঠে বিকেলের ফুটবল ম্যাচ',
    category: 'Sports',
    categoryBn: 'খেলাধুলা',
    image: sportsImg,
    date: '2026-09-15'
  }
];

const initialMessages: ContactMessage[] = [
  {
    id: 'msg-1',
    name: 'Father Lawrence',
    contact: 'lawrence.mission@example.com',
    message: 'Appreciating the village cleanup work done by Salmikkhang youth. The church ground can be made available for your next education workshop.',
    date: '2026-10-16',
    status: 'Read'
  },
  {
    id: 'msg-2',
    name: 'Robin Marak',
    contact: '+880 1711-998877',
    message: 'I am currently working in Dhaka but would like to donate 20 fruit saplings for the next tree planting drive in Gaira.',
    date: '2026-10-17',
    status: 'Unread'
  }
];

const initialDiscussions: DiscussionPost[] = [
  {
    id: 'd-1',
    authorName: 'Blancho Nokrek',
    authorRole: 'General Secretary',
    date: '2026-10-19',
    text: 'Hello everyone! We are finalizing the logistics for the upcoming Clean-Up & Sapling care drive this Friday. Please check the official PDF notice on the notice board.',
    category: 'Event Prep',
    likes: 12,
    likedByMe: true,
    replies: [
      {
        id: 'dr-1',
        author: 'Rakib Hasan',
        role: 'Executive Member',
        text: 'I have arranged 5 shovels and 10 bamboo baskets from the southern neighborhood.',
        date: '2026-10-19 14:20'
      },
      {
        id: 'dr-2',
        author: 'Ayesha Akter',
        role: 'Youth Coordinator',
        text: 'Girls volunteer team will meet at 7:45 AM at the community pavilion.',
        date: '2026-10-19 16:05'
      }
    ]
  }
];

const initialFunds: FundTransaction[] = [
  {
    id: 'f-1',
    date: '2026-10-01',
    type: 'Inflow',
    amount: 3200,
    title: 'Monthly Member Subscriptions (32 members)',
    titleBn: 'মাসিক সদস্য চাঁদা (৩২ জন)',
    donorOrBeneficiary: 'Active Members',
    category: 'Membership Dues'
  },
  {
    id: 'f-2',
    date: '2026-10-05',
    type: 'Outflow',
    amount: 1450,
    title: 'Purchase of 60 Native Neem & Mahogany Saplings',
    titleBn: '৬০টি নিম ও মেহগনি চারা ক্রয়',
    donorOrBeneficiary: 'Madhupur Forest Nursery',
    category: 'Tree Saplings'
  }
];

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
  const [firestoreSeeded, setFirestoreSeeded] = useState<boolean>(false);

  const clearAuthError = () => setAuthError(null);
  const clearMemberAccessNotice = () => setMemberAccessNotice(null);
  const clearAdminAccessWarning = () => setAdminAccessWarning(null);

  // Live Community Data (starts with initial defaults until Firestore snapshot arrives)
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>(initialJoinRequests);
  const [events, setEvents] = useState<CommunityEvent[]>(initialEvents);
  const [news, setNews] = useState<NewsItem[]>(initialNews);
  const [notifications, setNotifications] = useState<MemberNotification[]>(initialNotifications);
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [gallery, setGallery] = useState<GalleryItem[]>(initialGallery);
  const [messages, setMessages] = useState<ContactMessage[]>(initialMessages);
  const [discussions, setDiscussions] = useState<DiscussionPost[]>(initialDiscussions);
  const [funds, setFunds] = useState<FundTransaction[]>(initialDetailedFunds);
  const [villageResidents, setVillageResidents] = useState<VillageResident[]>(initialVillageResidents);
  const [settingsMain, setSettingsMain] = useState<CommunitySettings>(initialSettings);
  const [heroBgAsset, setHeroBgAsset] = useState<string | undefined>(undefined);
  const [siteBgAsset, setSiteBgAsset] = useState<string | undefined>(undefined);

  const settings: CommunitySettings = {
    ...settingsMain,
    ...(heroBgAsset ? { heroBackground: heroBgAsset } : {}),
    ...(siteBgAsset ? { siteBackground: siteBgAsset } : {}),
  };

  const [currentMember, setCurrentMember] = useState<Member | null>(null);
  const [previewMemberId, setPreviewMemberId] = useState<string | null>(null);
  const seededOnceRef = useRef(false);

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

  const t = (en: string, bn: string) => (language === 'bn' ? bn : en);

  const showToast = (message: string, type: 'success' | 'info' | 'warning' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(prev => (prev?.message === message ? null : prev));
    }, 3400);
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
    reason?: 'inactive' | 'not_found';
  }> => {
    const emailLower = (user.email || '').trim().toLowerCase();
    if (!emailLower || !user.emailVerified) {
      return { allowed: false, isAdmin: false, role: null, memberId: null, reason: 'not_found' };
    }
    if (isBootstrapAdminEmail(emailLower)) {
      return { allowed: true, isAdmin: true, role: 'Admin', memberId: null };
    }

    let hasAdminDoc = false;
    try {
      const adminSnap = await getDoc(doc(db, 'admins', user.uid));
      if (adminSnap.exists()) hasAdminDoc = true;
    } catch {
      // Ignore lookup error and verify via roleGrants
    }

    try {
      const grantSnap = await getDoc(doc(db, 'roleGrants', emailLower));
      if (grantSnap.exists()) {
        const data = grantSnap.data();
        const grantStatus = (data.status as string | undefined) || 'Active';
        if (grantStatus === 'Inactive' && !hasAdminDoc) {
          return { allowed: false, isAdmin: false, role: null, memberId: data.memberId || null, reason: 'inactive' };
        }
        const role = (data.role as Role) || 'Member';
        return {
          allowed: true,
          isAdmin: hasAdminDoc || role === 'Admin',
          role,
          memberId: data.memberId || null,
        };
      }
    } catch {
      // Not found or inaccessible
    }

    if (hasAdminDoc) {
      return { allowed: true, isAdmin: true, role: 'Admin', memberId: null };
    }

    return { allowed: false, isAdmin: false, role: null, memberId: null, reason: 'not_found' };
  };

  const ensureAutoJoinRequestForUser = async (user: User): Promise<'sent' | 'pending' | 'rejected'> => {
    const emailLower = (user.email || '').trim().toLowerCase();
    const reqId = sanitizeId(`req-${user.uid}`);

    try {
      const existingSnap = await getDoc(doc(db, 'joinRequests', reqId));
      if (existingSnap.exists()) {
        const st = existingSnap.data()?.status;
        if (st === 'Rejected') return 'rejected';
        return 'pending';
      }
    } catch {
      // Proceed to create if unreadable/missing
    }

    const fallbackName = emailLower.split('@')[0] || 'Google User';
    const newReq: JoinRequest = {
      id: reqId,
      name: clampStr(user.displayName || fallbackName, 120),
      email: emailLower,
      phone: 'Google Sign-In',
      village: 'Pending Verification',
      bloodGroup: 'O+',
      skills: '',
      interests: '',
      reason: `Member Portal access requested via Google Sign-In (${emailLower}).`,
      status: 'Pending',
      date: new Date().toISOString().split('T')[0],
    };

    try {
      await fsSet(`joinRequests/${reqId}`, toJoinRequestPayload(newReq), OperationType.CREATE);
    } catch (err) {
      console.error('Could not create automatic join request:', err);
    }
    return 'sent';
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
                `RESTRICTED ACCESS WARNING: "${res.user.email}" is not authorized for Admin & President Panel. No request is sent here.`,
                `সতর্কতা — সংরক্ষিত প্রবেশাধিকার: "${res.user.email}" অ্যাডমিন বা সভাপতি প্যানেলের জন্য অনুমোদিত নয়। এখানে কোনো রিকোয়েস্ট গ্রহণ করা হয় না।`
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
            if (access.allowed) {
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
            } else if (access.reason === 'inactive') {
              setIsMemberSessionUnlocked(false);
              setMemberAccessNotice({ email: emailLower, status: 'inactive' });
              const msg = t(
                `Access Denied! "${emailLower}" is marked Inactive in the member database.`,
                `প্রবেশাধিকার নেই! "${emailLower}" সদস্য ডেটাবেসে নিষ্ক্রিয় (Inactive) রয়েছে।`
              );
              setAuthError(msg);
              showToast(msg, 'warning');
              setCurrentViewState('member');
            } else {
              setIsMemberSessionUnlocked(false);
              const reqStatus = await ensureAutoJoinRequestForUser(res.user);
              setMemberAccessNotice({ email: emailLower, status: reqStatus });
              const msg =
                reqStatus === 'rejected'
                  ? t(
                      `Access Denied! "${emailLower}" was declined by Admin and cannot enter the Member Portal.`,
                      `প্রবেশাধিকার নেই! "${emailLower}" আবেদনটি অ্যাডমিন কর্তৃক প্রত্যাখ্যাত হয়েছে।`
                    )
                  : reqStatus === 'pending'
                  ? t(
                      `"${emailLower}" is not in the member database yet. Your request is already pending Admin approval.`,
                      `"${emailLower}" এখনো সদস্য ডেটাবেসে যুক্ত হয়নি। আপনার রিকোয়েস্ট অ্যাডমিনের অনুমোদনের অপেক্ষায় রয়েছে।`
                    )
                  : t(
                      `Access Denied! "${emailLower}" is not in the database. An access request has been sent to the Admin.`,
                      `প্রবেশাধিকার নেই! "${emailLower}" ডেটাবেসে নেই। অ্যাডমিনের কাছে অনুমোদনের জন্য রিকোয়েস্ট পাঠানো হয়েছে।`
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

      setAuthLoading(true);
      setFirebaseUser(user);

      const emailLower = user.email.toLowerCase();
      const isBootstrap = isBootstrapAdminEmail(emailLower);
      let adminAllowed = isBootstrap;
      let resolvedGrantRole: Role | null = isBootstrap ? 'Admin' : null;
      let resolvedMemberId: string | null = null;

      try {
        if (!isBootstrap) {
          const adminSnap = await getDoc(doc(db, 'admins', user.uid));
          if (adminSnap.exists()) adminAllowed = true;
        }
      } catch (err) {
        console.warn('Admin doc lookup skipped:', err);
      }

      // Check role grant by verified email
      try {
        const grantSnap = await getDoc(doc(db, 'roleGrants', emailLower));
        if (grantSnap.exists()) {
          const data = grantSnap.data();
          const grantStatus = (data.status as string | undefined) || 'Active';
          if (grantStatus === 'Inactive' && !isBootstrap && !adminAllowed) {
            resolvedGrantRole = null;
            resolvedMemberId = data.memberId || null;
            adminAllowed = false;
          } else {
            const grantRole = (data.role as Role) || 'Member';
            resolvedMemberId = data.memberId || null;
            if (isBootstrap) {
              resolvedGrantRole = grantRole;
              adminAllowed = true;
            } else {
              resolvedGrantRole = grantRole;
              adminAllowed = adminAllowed || grantRole === 'Admin';
            }
          }
        } else if (adminAllowed) {
          resolvedGrantRole = 'Admin';
        }
      } catch (err) {
        console.warn('Role grant lookup:', err);
        if (adminAllowed) {
          resolvedGrantRole = 'Admin';
        }
      }

      setIsAdminLoggedIn(adminAllowed);
      setGrantedRole(resolvedGrantRole);
      setGrantedMemberId(resolvedMemberId);
      if (!adminAllowed && !resolvedGrantRole) {
        setIsMemberSessionUnlocked(false);
        setIsAdminSessionUnlocked(false);
      }

      // Seed initial Firestore data automatically on first Admin login
      if (adminAllowed && !seededOnceRef.current) {
        seededOnceRef.current = true;
        try {
          const didSeed = await seedInitialFirestoreIfEmpty({
            settings: initialSettings,
            members: initialMembers,
            joinRequests: initialJoinRequests,
            events: initialEvents,
            news: initialNews,
            notifications: initialNotifications,
            projects: initialProjects,
            gallery: initialGallery,
            messages: initialMessages,
            discussions: initialDiscussions,
            funds: initialDetailedFunds,
            villageResidents: initialVillageResidents,
          });
          if (didSeed) {
            showToast(t('Cloud database initialized with community records!', 'ক্লাউড ডেটাবেস সফলভাবে সেটআপ হয়েছে!'), 'success');
          }
        } catch (err) {
          console.error(err);
        }
      }

      setAuthLoading(false);
    });

    return () => unsub();
  }, []);

  // 1b. Real-time roleGrants & admins listeners so role updates take effect live without re-login
  useEffect(() => {
    if (!firebaseUser?.emailVerified || !firebaseUser?.email) return;

    const emailLower = firebaseUser.email.toLowerCase();
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
          doc(db, 'admins', firebaseUser.uid),
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
  }, [firebaseUser]);

  // 2. Public Firestore Listeners (always active for all website visitors)
  useEffect(() => {
    const unsubs: (() => void)[] = [];

    unsubs.push(
      onSnapshot(
        doc(db, 'settings', 'main'),
        (snap) => {
          if (snap.exists()) {
            setFirestoreSeeded(true);
            const { heroBackground: _hb, siteBackground: _sb, ...cleanMain } = snap.data() as CommunitySettings;
            setSettingsMain(cleanMain);
          } else {
            setFirestoreSeeded(false);
          }
        },
        (error) => handleFirestoreError(error, OperationType.GET, 'settings/main')
      )
    );

    unsubs.push(
      onSnapshot(
        doc(db, 'settings', 'heroBackground'),
        (snap) => {
          setHeroBgAsset(snap.exists() ? (snap.data().dataUrl as string) : undefined);
        },
        (error) => handleFirestoreError(error, OperationType.GET, 'settings/heroBackground')
      )
    );

    unsubs.push(
      onSnapshot(
        doc(db, 'settings', 'siteBackground'),
        (snap) => {
          setSiteBgAsset(snap.exists() ? (snap.data().dataUrl as string) : undefined);
        },
        (error) => handleFirestoreError(error, OperationType.GET, 'settings/siteBackground')
      )
    );

    unsubs.push(
      onSnapshot(
        query(collection(db, 'projects'), where('status', 'in', ['Ongoing', 'Planning', 'Completed'])),
        (snap) => {
          if (!snap.empty || firestoreSeeded) {
            setProjects(snap.docs.map(d => d.data() as Project));
          }
        },
        (error) => handleFirestoreError(error, OperationType.LIST, 'projects')
      )
    );

    unsubs.push(
      onSnapshot(
        query(collection(db, 'gallery'), where('visibility', '==', 'public')),
        (snap) => {
          if (!snap.empty || firestoreSeeded) {
            const list = snap.docs.map(d => d.data() as GalleryItem);
            list.sort((a, b) => b.date.localeCompare(a.date));
            setGallery(list);
          }
        },
        (error) => handleFirestoreError(error, OperationType.LIST, 'gallery')
      )
    );

    return () => unsubs.forEach(u => u());
  }, [firestoreSeeded]);

  // 3. News & Events Listeners (public-only for guests & unregistered users; full list only for verified database members)
  useEffect(() => {
    const isAuthorizedMember = Boolean(
      firebaseUser?.emailVerified && firebaseUser?.email && (isAdminLoggedIn || grantedRole)
    );
    const newsQuery = isAuthorizedMember
      ? query(collection(db, 'news'), where('status', 'in', ['Published', 'Draft']))
      : query(collection(db, 'news'), where('visibility', '==', 'public'));

    const eventsQuery = isAuthorizedMember
      ? query(collection(db, 'events'), where('status', 'in', ['Upcoming', 'Past', 'Planning']))
      : query(collection(db, 'events'), where('visibility', '==', 'public'));

    const unsubNews = onSnapshot(
      newsQuery,
      (snap) => {
        if (!snap.empty || firestoreSeeded) {
          const items = snap.docs.map(d => d.data() as NewsItem);
          items.sort((a, b) => b.date.localeCompare(a.date));
          setNews(items);
        }
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'news')
    );

    const unsubEvents = onSnapshot(
      eventsQuery,
      (snap) => {
        if (!snap.empty || firestoreSeeded) {
          const items = snap.docs.map(d => d.data() as CommunityEvent);
          items.sort((a, b) => a.date.localeCompare(b.date));
          setEvents(items);
        }
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'events')
    );

    return () => {
      unsubNews();
      unsubEvents();
    };
  }, [firebaseUser, isAdminLoggedIn, grantedRole, firestoreSeeded]);

  // 4. Member & Authenticated Listeners (only attached when user is a verified member in the database)
  useEffect(() => {
    const isAuthorizedMember = Boolean(
      firebaseUser?.emailVerified && firebaseUser?.email && (isAdminLoggedIn || grantedRole)
    );
    if (!isAuthorizedMember || !firebaseUser?.email) {
      setVillageResidents([]);
      return;
    }

    const uid = firebaseUser.uid;
    const emailLower = firebaseUser.email.toLowerCase();
    const unsubs: (() => void)[] = [];

    unsubs.push(
      onSnapshot(
        query(collection(db, 'members'), where('status', 'in', ['Active', 'Inactive'])),
        async (snap) => {
          if (snap.empty && !firestoreSeeded) return;
          const baseMembers = snap.docs.map(d => ({
            ...(d.data() as Member),
            email: (d.data() as Member).ownerEmail || '',
            phone: '',
          }));

          // Hydrate private contact info for Admin, President (view-only), or the member owner
          const canAuditAll = isAdminLoggedIn || grantedRole === 'President';
          const hydrated = await Promise.all(
            baseMembers.map(async (m) => {
              const isOwner =
                m.ownerUid === uid || (m.ownerEmail && m.ownerEmail.toLowerCase() === emailLower);
              if (!canAuditAll && !isOwner) return m;
              try {
                const privSnap = await getDoc(doc(db, 'members', m.id, 'private', 'contact'));
                if (privSnap.exists()) {
                  const pData = privSnap.data();
                  return {
                    ...m,
                    email: pData.email || m.email,
                    phone: pData.phone || '',
                  };
                }
              } catch {
                // Keep non-PII fields if private doc is restricted
              }
              return m;
            })
          );

          hydrated.sort((a, b) => a.memberNo.localeCompare(b.memberNo));
          setMembers(hydrated);
        },
        (error) => handleFirestoreError(error, OperationType.LIST, 'members')
      )
    );

    const isCollector = isAdminLoggedIn || grantedRole === 'President' || grantedRole === 'Data Collector';

    if (isCollector) {
      const residentGroupA = ['General Resident', 'Eligible for Aid', 'Senior Citizen'];
      const residentGroupB = ['Student / Youth', 'Medical Assistance', 'Farmer / Daily Wage Earner'];
      let groupARows: VillageResident[] = [];
      let groupBRows: VillageResident[] = [];
      let groupAReady = false;
      let groupBReady = false;

      const hydrateAndPublishResidents = async () => {
        if (!groupAReady && !groupBReady) return;
        const combinedMap = new Map<string, VillageResident>();
        for (const r of [...groupARows, ...groupBRows]) {
          combinedMap.set(r.id, r);
        }
        const baseResidents = Array.from(combinedMap.values());
        if (baseResidents.length === 0 && !firestoreSeeded) return;

        const hydrated = await Promise.all(
          baseResidents.map(async (r) => {
            try {
              const privSnap = await getDoc(doc(db, 'villageResidents', r.id, 'private', 'info'));
              if (privSnap.exists()) {
                const p = privSnap.data();
                return {
                  ...r,
                  guardianName: p.guardianName || '',
                  phone: p.phone || '',
                  nidOrBirthCert: p.nidOrBirthCert || '',
                };
              }
            } catch {
              // Keep non-PII census fields
            }
            return r;
          })
        );

        hydrated.sort((a, b) => b.collectedDate.localeCompare(a.collectedDate));
        setVillageResidents(hydrated);
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
            await hydrateAndPublishResidents();
          },
          (error) => handleFirestoreError(error, OperationType.LIST, 'villageResidents')
        )
      );

      unsubs.push(
        onSnapshot(
          query(collection(db, 'villageResidents'), where('aidStatus', 'in', residentGroupB)),
          async (snap) => {
            groupBReady = true;
            groupBRows = mapResidentSnapshot(snap);
            await hydrateAndPublishResidents();
          },
          (error) => handleFirestoreError(error, OperationType.LIST, 'villageResidents')
        )
      );
    } else {
      setVillageResidents([]);
    }

    unsubs.push(
      onSnapshot(
        query(collection(db, 'funds'), where('type', 'in', ['Inflow', 'Outflow'])),
        (snap) => {
          if (!snap.empty || firestoreSeeded) {
            const list = snap.docs.map(d => d.data() as FundTransaction);
            list.sort((a, b) => b.date.localeCompare(a.date));
            setFunds(list);
          }
        },
        (error) => handleFirestoreError(error, OperationType.LIST, 'funds')
      )
    );

    unsubs.push(
      onSnapshot(
        query(
          collection(db, 'discussions'),
          where('category', 'in', ['General', 'Project Idea', 'Question', 'Event Prep'])
        ),
        (snap) => {
          if (!snap.empty || firestoreSeeded) {
            const list = snap.docs.map(d => {
              const data = d.data() as DiscussionPost;
              return {
                ...data,
                likedByMe: Array.isArray(data.likedByUids) ? data.likedByUids.includes(uid) : false,
              };
            });
            list.sort((a, b) => b.date.localeCompare(a.date));
            setDiscussions(list);
          }
        },
        (error) => handleFirestoreError(error, OperationType.LIST, 'discussions')
      )
    );

    unsubs.push(
      onSnapshot(
        query(collection(db, 'notifications'), where('type', 'in', ['notice', 'event', 'system'])),
        (snap) => {
          if (!snap.empty || firestoreSeeded) {
            const list = snap.docs.map(d => d.data() as MemberNotification);
            list.sort((a, b) => b.date.localeCompare(a.date));
            setNotifications(list);
          }
        },
        (error) => handleFirestoreError(error, OperationType.LIST, 'notifications')
      )
    );

    return () => unsubs.forEach(u => u());
  }, [firebaseUser, isAdminLoggedIn, grantedRole, firestoreSeeded]);

  // 5. Admin & President (View-Only) Listeners (Join Requests & Contact Inbox)
  useEffect(() => {
    const canViewAdminInbox = isAdminLoggedIn || grantedRole === 'President';
    if (!canViewAdminInbox || !firebaseUser?.emailVerified) {
      return;
    }

    const unsubRequests = onSnapshot(
      collection(db, 'joinRequests'),
      (snap) => {
        if (!snap.empty || firestoreSeeded) {
          const list = snap.docs.map(d => d.data() as JoinRequest);
          list.sort((a, b) => b.date.localeCompare(a.date));
          setJoinRequests(list);
        }
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'joinRequests')
    );

    const unsubMessages = onSnapshot(
      collection(db, 'messages'),
      (snap) => {
        if (!snap.empty || firestoreSeeded) {
          const list = snap.docs.map(d => d.data() as ContactMessage);
          list.sort((a, b) => b.date.localeCompare(a.date));
          setMessages(list);
        }
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'messages')
    );

    return () => {
      unsubRequests();
      unsubMessages();
    };
  }, [isAdminLoggedIn, grantedRole, firebaseUser, firestoreSeeded]);

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

      // Fallback to full-page redirect when popups are blocked or unsupported (e.g., mobile / in-app browsers)
      if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment') {
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

  const loginAsMember = async (): Promise<boolean> => {
    const previousEmail = firebaseUser?.email?.toLowerCase() || null;
    setMemberAccessNotice(null);
    setAdminAccessWarning(null);
    const ok = await loginWithGoogle({ silentSuccessToast: true, targetPortal: 'member' });
    if (!ok || !auth.currentUser?.email) return false;

    const user = auth.currentUser;
    const emailLower = user.email!.toLowerCase();
    if (previousEmail && previousEmail !== emailLower) {
      setIsAdminSessionUnlocked(false);
    }
    setPreviewMemberId(null);

    const access = await verifyMemberDatabaseAccess(user);
    if (!access.allowed) {
      setIsMemberSessionUnlocked(false);
      if (access.reason === 'inactive') {
        setMemberAccessNotice({ email: emailLower, status: 'inactive' });
        const msg = t(
          `Access Denied! "${emailLower}" is marked Inactive in the database and cannot enter the Member Portal.`,
          `প্রবেশাধিকার নেই! "${emailLower}" ডেটাবেসে নিষ্ক্রিয় (Inactive) রয়েছে—তাই সদস্য পোর্টালে প্রবেশ করা যাবে না।`
        );
        setAuthError(msg);
        showToast(msg, 'warning');
        return false;
      }

      const reqStatus = await ensureAutoJoinRequestForUser(user);
      setMemberAccessNotice({ email: emailLower, status: reqStatus });
      const msg =
        reqStatus === 'rejected'
          ? t(
              `Access Denied! "${emailLower}" was declined by Admin and cannot enter the Member Portal.`,
              `প্রবেশাধিকার নেই! "${emailLower}" আবেদনটি অ্যাডমিন কর্তৃক প্রত্যাখ্যাত হয়েছে।`
            )
          : reqStatus === 'pending'
          ? t(
              `Not Registered Yet! "${emailLower}" is not in the database. Your access request is already pending Admin approval.`,
              `নিবন্ধিত নয়! "${emailLower}" ডেটাবেসে নেই। আপনার রিকোয়েস্ট অ্যাডমিনের অনুমোদনের অপেক্ষায় রয়েছে।`
            )
          : t(
              `Access Denied! "${emailLower}" is not in the database. An access request has been sent to the Admin.`,
              `প্রবেশাধিকার নেই! "${emailLower}" ডেটাবেসে নেই। অ্যাডমিনের কাছে রিকোয়েস্ট পাঠানো হয়েছে।`
            );
      setAuthError(msg);
      showToast(msg, 'warning');
      return false;
    }

    setMemberAccessNotice(null);
    setAuthError(null);
    setIsMemberSessionUnlocked(true);
    showToast(
      t(
        `Member Portal unlocked for ${user.displayName || user.email}`,
        `${user.displayName || user.email}-এর জন্য সদস্য পোর্টাল আনলক হয়েছে`
      ),
      'success'
    );
    return true;
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
    const ok = await loginWithGoogle({ silentSuccessToast: true, targetPortal: 'admin' });
    if (!ok || !auth.currentUser?.email) return false;

    const user = auth.currentUser;
    const emailLower = user.email!.toLowerCase();
    if (previousEmail && previousEmail !== emailLower) {
      setIsMemberSessionUnlocked(false);
    }

    const access = await verifyMemberDatabaseAccess(user);
    const allowed = access.allowed && (access.isAdmin || access.role === 'President');

    if (!allowed) {
      setIsAdminSessionUnlocked(false);
      setAdminAccessWarning({ email: emailLower, role: access.role });
      const msg = t(
        `RESTRICTED ACCESS WARNING: "${user.email}" is not authorized for the Admin & President Panel. No access request is accepted here.`,
        `সতর্কতা — সংরক্ষিত প্রবেশাধিকার: "${user.email}" অ্যাডমিন বা সভাপতি প্যানেলের জন্য অনুমোদিত নয়। এখানে কোনো রিকোয়েস্ট পাঠানো বা গ্রহণ করা হয় না।`
      );
      setAuthError(msg);
      showToast(msg, 'warning');
      return false;
    }

    setAdminAccessWarning(null);
    setAuthError(null);
    setPreviewMemberId(null);
    setIsAdminSessionUnlocked(true);
    showToast(
      t(`Admin Panel unlocked for ${user.displayName || user.email}`, `${user.displayName || user.email}-এর জন্য অ্যাডমিন প্যানেল আনলক হয়েছে`),
      'success'
    );
    return true;
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

  // Village Public Records (Confidential to Members & Admin; Add/Edit by Admin & Data Collector)
  const addVillageResident = (data: Omit<VillageResident, 'id' | 'residentNo' | 'collectedDate'>): boolean => {
    if (!canCollectDataPermission()) {
      showToast(
        t('Access Denied: Only Admin or authorized Data Collector can add resident records.', 'অনুমতি নেই: শুধুমাত্র অ্যাডমিন বা দায়িত্বপ্রাপ্ত তথ্য সংগ্রাহক নাগরিক তথ্য যোগ করতে পারেন।'),
        'warning'
      );
      return false;
    }
    const newNo = `RES-2026-${String(villageResidents.length + 1).padStart(3, '0')}`;
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
    setVillageResidents(prev => [newResident, ...prev]);
    void (async () => {
      const rId = sanitizeId(newResident.id);
      await fsSet(`villageResidents/${rId}`, toResidentPublicPayload(newResident, uid), OperationType.CREATE);
      await fsSet(`villageResidents/${rId}/private/info`, toResidentPrivatePayload(newResident, uid), OperationType.CREATE);
    })();
    showToast(t(`Resident ${newResident.name} recorded into registry!`, `নাগরিক ${newResident.name}-এর তথ্য সফলভাবে সংরক্ষিত হয়েছে!`), 'success');
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
    const merged: VillageResident = {
      ...existingRes,
      ...updated,
      updatedDate: new Date().toISOString().split('T')[0],
    };
    setVillageResidents(prev => prev.map(r => (r.id === id ? merged : r)));
    void (async () => {
      const rId = sanitizeId(id);
      await fsSet(`villageResidents/${rId}`, toResidentPublicPayload(merged), OperationType.UPDATE);
      await fsSet(`villageResidents/${rId}/private/info`, toResidentPrivatePayload(merged), OperationType.UPDATE);
    })();
    showToast(t('Resident record updated successfully', 'নাগরিক তথ্য সফলভাবে হালনাগাদ করা হয়েছে'), 'success');
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
    setVillageResidents(prev => prev.filter(r => r.id !== id));
    void (async () => {
      const rId = sanitizeId(id);
      await fsDelete(`villageResidents/${rId}/private/info`);
      await fsDelete(`villageResidents/${rId}`);
    })();
    showToast(t('Resident record deleted', 'তথ্যটি মুছে ফেলা হয়েছে'), 'info');
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
    const voucherNo = txn.voucherNo || `VCH-2026-${String(funds.length + 1).padStart(3, '0')}`;
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
      } catch (err) {
        setFunds(prevFunds);
        throw err;
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
      } catch (err) {
        setFunds(prevFunds);
        throw err;
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
      } catch (err) {
        setFunds(prevFunds);
        throw err;
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
    const newMember: Member = {
      id: `m-${Date.now()}`,
      memberNo: `SMK-2026-00${members.length + 1}`,
      name: data.name,
      email: emailLower,
      phone: data.phone,
      role: data.role || 'Member',
      status: 'Active',
      village: data.village || 'Gaira',
      bloodGroup: data.bloodGroup || 'O+',
      skills: data.skills || ['Volunteering'],
      interests: data.interests || ['Community Care'],
      joinDate: new Date().toISOString().split('T')[0],
      avatar: data.avatar || '',
      bio: data.bio || 'Registered youth member of Salmikkhang community.',
      ownerEmail: emailLower,
    };
    setMembers(prev => [newMember, ...prev]);
    void (async () => {
      const mId = sanitizeId(newMember.id);
      await fsSet(`members/${mId}`, toMemberPublicPayload(newMember), OperationType.CREATE);
      await fsSet(`members/${mId}/private/contact`, toMemberPrivatePayload(newMember), OperationType.CREATE);
      await syncMemberRoleGrant(newMember);
    })();
    showToast(
      t(
        `Member ${newMember.name} registered! ID: ${newMember.memberNo}. They can sign in with Google (${emailLower}).`,
        `সদস্য ${newMember.name} নিবন্ধিত হয়েছেন! আইডি: ${newMember.memberNo}। Google (${emailLower}) দিয়ে লগইন করতে পারবেন।`
      ),
      'success'
    );
  };

  // CRUD Actions
  const submitJoinRequest = (req: Omit<JoinRequest, 'id' | 'status' | 'date'>) => {
    const newReq: JoinRequest = {
      ...req,
      id: `jr-${Date.now()}`,
      status: 'Pending',
      date: new Date().toISOString().split('T')[0],
    };
    setJoinRequests(prev => [newReq, ...prev]);
    void fsSet(`joinRequests/${sanitizeId(newReq.id)}`, toJoinRequestPayload(newReq), OperationType.CREATE);
    showToast(
      t('Application sent to Admin! The council will verify your information and register you.', 'আবেদনটি অ্যাডমিনের নিকট পাঠানো হয়েছে! তথ্যাদি যাচাই করে অ্যাডমিন আপনাকে নিবন্ধন করবেন।'),
      'success'
    );
  };

  const approveJoinRequest = (requestId: string, role: Member['role'] = 'Member') => {
    if (!isAdminLoggedIn) return;
    const req = joinRequests.find(r => r.id === requestId);
    if (!req) return;

    const emailLower = (req.email || '').trim().toLowerCase();
    const newMember: Member = {
      id: `m-${Date.now()}`,
      memberNo: `SMK-2026-00${members.length + 1}`,
      name: req.name,
      email: emailLower,
      phone: req.phone,
      role,
      status: 'Active',
      village: req.village,
      bloodGroup: req.bloodGroup || 'O+',
      skills: req.skills ? req.skills.split(',').map(s => s.trim()) : ['Volunteering'],
      interests: req.interests ? req.interests.split(',').map(s => s.trim()) : ['Community Development'],
      joinDate: new Date().toISOString().split('T')[0],
      bio: req.reason || 'Active member of Salmikkhang Youth Community.',
      ownerEmail: emailLower,
    };

    const prevMembers = members;
    const prevJoinRequests = joinRequests;
    const updatedReq: JoinRequest = { ...req, status: 'Approved' };
    setMembers(prev => [newMember, ...prev]);
    setJoinRequests(prev => prev.map(r => (r.id === requestId ? updatedReq : r)));

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
      } catch (err) {
        setMembers(prevMembers);
        setJoinRequests(prevJoinRequests);
        throw err;
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
      } catch (err) {
        setJoinRequests(prevJoinRequests);
        throw err;
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
          handleFirestoreError(err, OperationType.UPDATE, `members/${mId}`);
        }
      })();
    }
  };

  const deleteMember = (id: string) => {
    if (!isAdminLoggedIn) return;
    const target = members.find(m => m.id === id);
    setMembers(prev => prev.filter(m => m.id !== id));
    if (currentMember?.id === id) {
      setCurrentMember(null);
    }
    void (async () => {
      const mId = sanitizeId(id);
      await fsDelete(`members/${mId}/private/contact`);
      await fsDelete(`members/${mId}`);
      if (target?.email) await removeMemberRoleGrant(target.email);
    })();
    showToast(t('Member removed from directory', 'সদস্য তালিকা থেকে অপসারিত হয়েছে'), 'info');
  };

  const submitContactMessage = (msg: Omit<ContactMessage, 'id' | 'date' | 'status'>) => {
    const newMsg: ContactMessage = {
      ...msg,
      id: `msg-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      status: 'Unread',
    };
    setMessages(prev => [newMsg, ...prev]);
    void fsSet(`messages/${sanitizeId(newMsg.id)}`, toMessagePayload(newMsg), OperationType.CREATE);
    showToast(
      t('Your message has been sent to Salmikkhang organizers!', 'আপনার বার্তা সফলভাবে সালমিকখাং আয়োজকদের কাছে পাঠানো হয়েছে!'),
      'success'
    );
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
      } catch (err) {
        setMessages(prevMessages);
        throw err;
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
      } catch (err) {
        setMessages(prevMessages);
        throw err;
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
    const exists = ev.rsvps.includes(identifier);
    const updatedRsvps = exists ? ev.rsvps.filter(u => u !== identifier) : [...ev.rsvps, identifier];

    setEvents(prev => prev.map(item => (item.id === eventId ? { ...item, rsvps: updatedRsvps } : item)));

    void (async () => {
      try {
        await updateDoc(doc(db, 'events', sanitizeId(eventId)), {
          rsvps: updatedRsvps.slice(0, 500),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `events/${eventId}`);
      }
    })();

    showToast(
      exists
        ? t('You canceled your RSVP for this event.', 'আপনি এই ইভেন্টের অংশগ্রহণ বাতিল করেছেন।')
        : t('RSVP confirmed! See you at the event.', 'আপনার অংশগ্রহণ নিশ্চিত হয়েছে! অনুষ্ঠানে দেখা হবে।'),
      exists ? 'info' : 'success'
    );
  };

  const addEvent = (event: Omit<CommunityEvent, 'id' | 'rsvps'>) => {
    if (!canManageEventsPermission()) return;
    const newEvent: CommunityEvent = {
      ...event,
      id: `ev-${Date.now()}`,
      rsvps: [],
    };
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
      await fsSet(`events/${sanitizeId(newEvent.id)}`, toEventPayload(newEvent), OperationType.CREATE);
      await fsSet(`notifications/${sanitizeId(notif.id)}`, toNotificationPayload(notif), OperationType.CREATE);
    })();

    showToast(
      t('Event announced and notification sent to members', 'নতুন অনুষ্ঠান যুক্ত হয়েছে এবং সদস্যদের নোটিফিকেশন পাঠানো হয়েছে'),
      'success'
    );
  };

  const updateEvent = (id: string, event: Partial<CommunityEvent>) => {
    if (!canManageEventsPermission()) return;
    const existingEv = events.find(e => e.id === id);
    if (!existingEv) return;
    const merged = { ...existingEv, ...event };
    setEvents(prev => prev.map(e => (e.id === id ? merged : e)));
    void fsSet(`events/${sanitizeId(id)}`, toEventPayload(merged), OperationType.UPDATE);
    showToast(t('Event updated successfully', 'ইভেন্ট সফলভাবে হালনাগাদ হয়েছে'), 'success');
  };

  const deleteEvent = (id: string) => {
    if (!canManageEventsPermission()) return;
    setEvents(prev => prev.filter(e => e.id !== id));
    void fsDelete(`events/${sanitizeId(id)}`);
    showToast(t('Event removed', 'অনুষ্ঠানটি মুছে ফেলা হয়েছে'), 'info');
  };

  // Add Notice with PDF & Notification dispatch
  const addNewsItem = (item: Omit<NewsItem, 'id'>) => {
    if (!canManageNoticesPermission()) return;
    const newItem: NewsItem = {
      ...item,
      visibility: item.visibility || 'public',
      id: `n-${Date.now()}`,
    };
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
      await fsSet(`news/${sanitizeId(newItem.id)}`, toNewsPayload(newItem), OperationType.CREATE);
      await fsSet(`notifications/${sanitizeId(notif.id)}`, toNotificationPayload(notif), OperationType.CREATE);
    })();

    showToast(
      item.visibility === 'members_only'
        ? t('Private Notice published for Members Only!', 'শুধুমাত্র সদস্যদের জন্য অভ্যন্তরীণ নোটিশ প্রকাশিত হয়েছে!')
        : item.pdfAttachment
        ? t('Public Notice & PDF document published! Notification dispatched to all members.', 'পাবলিক নোটিশ ও PDF প্রকাশিত হয়েছে! সকল সদস্যদের নোটিফিকেশন পাঠানো হয়েছে।')
        : t('Notice / News published!', 'খবর বা নোটিশ প্রকাশিত হয়েছে!'),
      'success'
    );
  };

  const updateNewsItem = (id: string, item: Partial<NewsItem>) => {
    if (!canManageNoticesPermission()) return;
    const existingNews = news.find(n => n.id === id);
    if (!existingNews) return;
    const merged = { ...existingNews, ...item };
    setNews(prev => prev.map(n => (n.id === id ? merged : n)));
    void fsSet(`news/${sanitizeId(id)}`, toNewsPayload(merged), OperationType.UPDATE);
    showToast(t('News item updated', 'সংবাদটি হালনাগাদ করা হয়েছে'), 'success');
  };

  const deleteNewsItem = (id: string) => {
    if (!canManageNoticesPermission()) return;
    setNews(prev => prev.filter(n => n.id !== id));
    void fsDelete(`news/${sanitizeId(id)}`);
    showToast(t('News item deleted', 'সংবাদটি মুছে ফেলা হয়েছে'), 'info');
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
    if (auth.currentUser?.emailVerified) {
      void (async () => {
        try {
          await updateDoc(doc(db, 'notifications', sanitizeId(id)), { read: true });
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, `notifications/${id}`);
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
          handleFirestoreError(err, OperationType.UPDATE, `notifications/${id}`)
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
    setProjects(prev => [newProj, ...prev]);
    void fsSet(`projects/${sanitizeId(newProj.id)}`, toProjectPayload(newProj), OperationType.CREATE);
    showToast(t('Project added', 'নতুন উদ্যোগ যুক্ত হয়েছে'), 'success');
  };

  const updateProject = (id: string, proj: Partial<Project>) => {
    if (!canManageProjectsPermission()) return;
    const existingProj = projects.find(p => p.id === id);
    if (!existingProj) return;
    const merged = { ...existingProj, ...proj };
    setProjects(prev => prev.map(p => (p.id === id ? merged : p)));
    void fsSet(`projects/${sanitizeId(id)}`, toProjectPayload(merged), OperationType.UPDATE);
    showToast(t('Project updated', 'প্রকল্প হালনাগাদ হয়েছে'), 'success');
  };

  const deleteProject = (id: string) => {
    if (!canManageProjectsPermission()) return;
    setProjects(prev => prev.filter(p => p.id !== id));
    void fsDelete(`projects/${sanitizeId(id)}`);
    showToast(t('Project removed', 'উদ্যোগটি অপসারণ করা হয়েছে'), 'info');
  };

  const addGalleryItem = (item: Omit<GalleryItem, 'id'>) => {
    if (!canManageGalleryPermission()) return;
    const newItem: GalleryItem = {
      ...item,
      id: `g-${Date.now()}`,
      visibility: 'public',
    };
    setGallery(prev => [newItem, ...prev]);
    void fsSet(`gallery/${sanitizeId(newItem.id)}`, toGalleryPayload(newItem), OperationType.CREATE);
    showToast(t('Photo album item added', 'গ্যালারিতে নতুন ছবি যুক্ত হয়েছে'), 'success');
  };

  const updateGalleryItem = (id: string, item: Partial<GalleryItem>) => {
    if (!canManageGalleryPermission()) return;
    const existingItem = gallery.find(g => g.id === id);
    if (!existingItem) return;
    const merged: GalleryItem = {
      ...existingItem,
      ...item,
      id: existingItem.id,
      visibility: 'public',
    };
    setGallery(prev => prev.map(g => (g.id === id ? merged : g)));
    void fsSet(`gallery/${sanitizeId(id)}`, toGalleryPayload(merged), OperationType.UPDATE);
    showToast(t('Gallery photo updated', 'গ্যালারির ছবি হালনাগাদ হয়েছে'), 'success');
  };

  const deleteGalleryItem = (id: string) => {
    if (!canManageGalleryPermission()) return;
    setGallery(prev => prev.filter(g => g.id !== id));
    void fsDelete(`gallery/${sanitizeId(id)}`);
    showToast(t('Gallery photo deleted', 'ছবিটি মুছে ফেলা হয়েছে'), 'info');
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
    setDiscussions(prev => [newPost, ...prev]);
    void fsSet(`discussions/${sanitizeId(newPost.id)}`, toDiscussionPayload(newPost, uid), OperationType.CREATE);
    showToast(t('Your thought has been posted on the Youth Wall!', 'আপনার বার্তাটি যুব ফোরামে যুক্ত হয়েছে!'), 'success');
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
        handleFirestoreError(err, OperationType.UPDATE, `discussions/${id}`);
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

    setDiscussions(prev =>
      prev.map(p => (p.id === postId ? { ...p, replies: updatedReplies } : p))
    );

    void (async () => {
      try {
        await updateDoc(doc(db, 'discussions', sanitizeId(postId)), {
          replies: updatedReplies,
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `discussions/${postId}`);
      }
    })();
    showToast(t('Reply added to discussion', 'মন্তব্য সফলভাবে যুক্ত হয়েছে'), 'success');
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
    setDiscussions(prev => prev.filter(p => p.id !== id));
    void fsDelete(`discussions/${sanitizeId(id)}`);
    showToast(t('Discussion post removed', 'ফোরাম পোস্টটি মুছে ফেলা হয়েছে'), 'info');
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
    setMembers(initialMembers);
    setJoinRequests(initialJoinRequests);
    setEvents(initialEvents);
    setNews(initialNews);
    setNotifications(initialNotifications);
    setProjects(initialProjects);
    setGallery(initialGallery);
    setMessages(initialMessages);
    setDiscussions(initialDiscussions);
    setFunds(initialDetailedFunds);
    setVillageResidents(initialVillageResidents);
    setSettingsMain(initialSettings);
    setHeroBgAsset(undefined);
    setSiteBgAsset(undefined);

    void (async () => {
      await fsSet('settings/main', toSettingsMainPayload(initialSettings), OperationType.WRITE);
      await fsDelete('settings/heroBackground');
      await fsDelete('settings/siteBackground');
    })();

    showToast(t('Settings reset to initial values', 'সেটিংস প্রাথমিক অবস্থায় ফিরিয়ে নেওয়া হয়েছে'), 'info');
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
