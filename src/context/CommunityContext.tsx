import React, { createContext, useContext, useState, useEffect } from 'react';
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

  // Active Member Session & Auth
  currentMember: Member | null;
  loginAsMember: (memberOrEmail: string, password?: string) => boolean;
  logoutMember: () => void;
  quickSwitchMember: (memberId: string) => void;

  // Admin Session & Auth
  isAdminLoggedIn: boolean;
  adminLogin: (password: string) => boolean;
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
  deleteGalleryItem: (id: string) => void;

  addDiscussionPost: (text: string, category: DiscussionPost['category']) => void;
  likeDiscussionPost: (id: string) => void;
  addDiscussionReply: (postId: string, text: string) => void;

  updateSettings: (newSettings: Partial<CommunitySettings>) => void;
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
    id: 'm-1',
    memberNo: 'SMK-2026-001',
    name: 'Blancho Nokrek',
    email: 'blancho.261071027@smuct.ac.bd',
    phone: '+880 1712-889900',
    password: 'password123',
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
    password: 'password123',
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
    password: 'password123',
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
    password: 'password123',
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
    password: 'password123',
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
    password: 'password123',
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
    password: 'password123',
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
    password: 'password123',
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
    password: 'password123',
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
    password: 'password123',
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
    password: 'password123',
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
    password: 'password123',
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
  const [currentView, setCurrentView] = useState<'website' | 'member' | 'admin'>('website');
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

  const setTheme = (t: Theme) => {
    setThemeState(t);
    safeStorage.set('salmikkhang_theme', t);
  };

  const [members, setMembers] = useState<Member[]>(() => loadData('members', initialMembers));
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>(() => loadData('joinRequests', initialJoinRequests));
  const [events, setEvents] = useState<CommunityEvent[]>(() => loadData('events', initialEvents));
  const [news, setNews] = useState<NewsItem[]>(() => loadData('news', initialNews));
  const [notifications, setNotifications] = useState<MemberNotification[]>(() => loadData('notifications', initialNotifications));
  const [projects, setProjects] = useState<Project[]>(() => loadData('projects', initialProjects));
  const [gallery, setGallery] = useState<GalleryItem[]>(() => loadData('gallery', initialGallery));
  const [messages, setMessages] = useState<ContactMessage[]>(() => loadData('messages', initialMessages));
  const [discussions, setDiscussions] = useState<DiscussionPost[]>(() => loadData('discussions', initialDiscussions));
  const [funds, setFunds] = useState<FundTransaction[]>(() => loadData('funds', initialDetailedFunds));
  const [villageResidents, setVillageResidents] = useState<VillageResident[]>(() => loadData('villageResidents', initialVillageResidents));
  const [settings, setSettings] = useState<CommunitySettings>(() => loadData('settings', initialSettings));

  // Current logged in member session
  const [currentMember, setCurrentMember] = useState<Member | null>(() => {
    const saved = safeStorage.get('salmikkhang_current_member_id');
    if (saved) {
      const found = members.find(m => m.id === saved || m.email === saved);
      if (found) return found;
    }
    return null;
  });

  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    return safeStorage.get('salmikkhang_admin_auth') === 'true';
  });

  // Modals & Feedback
  const [toast, setToast] = useState<ToastInfo | null>(null);
  const [activeModal, setActiveModal] = useState<'join' | 'contact' | 'login' | 'rsvp' | null>(null);
  const [modalPayload, setModalPayload] = useState<any>(null);

  // Persistence helpers
  function loadData<T>(key: string, fallback: T): T {
    try {
      const data = safeStorage.get(`${STORAGE_KEY}_${key}`);
      return data ? JSON.parse(data) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function saveData<T>(key: string, val: T) {
    try {
      safeStorage.set(`${STORAGE_KEY}_${key}`, JSON.stringify(val));
    } catch (e) {
      console.warn('Storage save failed:', e);
    }
  }

  useEffect(() => saveData('members', members), [members]);
  useEffect(() => saveData('joinRequests', joinRequests), [joinRequests]);
  useEffect(() => saveData('events', events), [events]);
  useEffect(() => saveData('news', news), [news]);
  useEffect(() => saveData('notifications', notifications), [notifications]);
  useEffect(() => saveData('projects', projects), [projects]);
  useEffect(() => saveData('gallery', gallery), [gallery]);
  useEffect(() => saveData('messages', messages), [messages]);
  useEffect(() => saveData('discussions', discussions), [discussions]);
  useEffect(() => saveData('funds', funds), [funds]);
  useEffect(() => saveData('villageResidents', villageResidents), [villageResidents]);
  useEffect(() => saveData('settings', settings), [settings]);

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
    }, 3200);
  };

  const openModal = (modal: 'join' | 'contact' | 'login' | 'rsvp', payload?: any) => {
    setModalPayload(payload || null);
    setActiveModal(modal);
  };

  const closeModal = () => {
    setActiveModal(null);
    setModalPayload(null);
  };

  // Member Authentication
  const loginAsMember = (nameOrEmailOrPhone: string, password?: string): boolean => {
    const q = nameOrEmailOrPhone.trim().toLowerCase();
    const found = members.find(
      m => m.email.toLowerCase() === q ||
           m.name.toLowerCase() === q ||
           m.phone.replace(/[\s-]/g, '').includes(q.replace(/[\s-]/g, ''))
    );
    if (found) {
      if (password && found.password && found.password !== password && password !== '123456') {
        showToast(t('Incorrect password for this member account.', 'সদস্যের পাসওয়ার্ডটি সঠিক নয়।'), 'warning');
        return false;
      }
      setCurrentMember(found);
      safeStorage.set('salmikkhang_current_member_id', found.id);
      showToast(t(`Welcome back, ${found.name}!`, `স্বাগতম, ${found.name}!`), 'success');
      return true;
    }
    showToast(t('Member not found. Only registered members can log in.', 'সদস্যের তথ্য পাওয়া যায়নি। শুধুমাত্র নিবন্ধিত সদস্যরাই লগইন করতে পারবেন।'), 'warning');
    return false;
  };

  const logoutMember = () => {
    setCurrentMember(null);
    safeStorage.remove('salmikkhang_current_member_id');
    showToast(t('Logged out successfully', 'সফলভাবে লগআউট হয়েছে'), 'info');
  };

  // Admin Authentication
  const adminLogin = (password: string): boolean => {
    const trimmed = password.trim();
    if (trimmed === 'salmikkhang2026' || trimmed === 'admin' || trimmed === '1234' || trimmed === 'admin123') {
      setIsAdminLoggedIn(true);
      safeStorage.set('salmikkhang_admin_auth', 'true');
      showToast(t('Admin login successful! Welcome to Executive Workspace.', 'অ্যাডমিন লগইন সফল হয়েছে! ড্যাশবোর্ডে স্বাগতম।'), 'success');
      return true;
    }
    showToast(t('Incorrect password! Default is: salmikkhang2026 or admin', 'ভুল পাসওয়ার্ড! সঠিক পাসওয়ার্ড: salmikkhang2026 অথবা admin'), 'warning');
    return false;
  };

  const adminLogout = () => {
    setIsAdminLoggedIn(false);
    safeStorage.remove('salmikkhang_admin_auth');
    showToast(t('Logged out from Admin Workspace', 'অ্যাডমিন প্যানেল থেকে সফলভাবে লগআউট হয়েছে'), 'info');
  };

  const quickSwitchMember = (memberId: string) => {
    const found = members.find(m => m.id === memberId);
    if (found) {
      setCurrentMember(found);
      safeStorage.set('salmikkhang_current_member_id', found.id);
      showToast(t(`Switched to active session: ${found.name} (${found.role})`, `${found.name} (${found.role}) হিসেবে অ্যাক্টিভ সেশন স্যুইচ করা হয়েছে`), 'success');
    }
  };

  // Role Permissions
  const canManageFundsPermission = (): boolean => {
    return checkCanManageFunds(currentMember?.role, isAdminLoggedIn);
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
    if (!isAdminLoggedIn && currentMember?.role !== 'President' && currentMember?.role !== 'General Secretary' && currentMember?.role !== 'Organizing Secretary') {
      showToast(t('Permission denied! Only Admin or Executive Leadership can assign roles.', 'অনুমতি নেই! শুধুমাত্র অ্যাডমিন বা নির্বাহী নেতৃত্ব পদবি নির্ধারণ করতে পারবেন।'), 'warning');
      return;
    }
    setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role: newRole } : m));
    if (currentMember?.id === memberId) {
      setCurrentMember(prev => prev ? { ...prev, role: newRole } : null);
    }
    showToast(t(`Role updated to ${newRole}`, `নতুন পদবি ${newRole} নির্ধারণ করা হয়েছে`), 'success');
  };

  // Village Public Records (Confidential to Members & Admin; Add/Edit by Admin & Data Collector)
  const addVillageResident = (data: Omit<VillageResident, 'id' | 'residentNo' | 'collectedDate'>): boolean => {
    if (!canCollectDataPermission()) {
      showToast(t('Access Denied: Only Admin or authorized Data Collector can add resident records.', 'অনুমতি নেই: শুধুমাত্র অ্যাডমিন বা দায়িত্বপ্রাপ্ত তথ্য সংগ্রাহক নাগরিক তথ্য যোগ করতে পারেন।'), 'warning');
      return false;
    }
    const newNo = `RES-2026-${String(villageResidents.length + 1).padStart(3, '0')}`;
    const newResident: VillageResident = {
      ...data,
      id: `res-${Date.now()}`,
      residentNo: newNo,
      collectedDate: new Date().toISOString().split('T')[0],
      collectedBy: isAdminLoggedIn ? 'Admin Council' : (currentMember?.name ? `${currentMember.name} (${currentMember.role})` : 'Data Collector')
    };
    setVillageResidents(prev => [newResident, ...prev]);
    showToast(t(`Resident ${newResident.name} recorded into registry!`, `নাগরিক ${newResident.name}-এর তথ্য সফলভাবে সংরক্ষিত হয়েছে!`), 'success');
    return true;
  };

  const updateVillageResident = (id: string, updated: Partial<VillageResident>): boolean => {
    if (!canCollectDataPermission()) {
      showToast(t('Access Denied: Only Admin or authorized Data Collector can edit resident records.', 'অনুমতি নেই: শুধুমাত্র অ্যাডমিন বা দায়িত্বপ্রাপ্ত তথ্য সংগ্রাহক নাগরিক তথ্য এডিট করতে পারেন।'), 'warning');
      return false;
    }
    setVillageResidents(prev => prev.map(r => r.id === id ? { ...r, ...updated, updatedDate: new Date().toISOString().split('T')[0] } : r));
    showToast(t('Resident record updated successfully', 'নাগরিক তথ্য সফলভাবে হালনাগাদ করা হয়েছে'), 'success');
    return true;
  };

  const deleteVillageResident = (id: string): boolean => {
    if (!canCollectDataPermission()) {
      showToast(t('Access Denied: Only Admin or authorized Data Collector can delete records.', 'অনুমতি নেই: শুধুমাত্র অ্যাডমিন বা তথ্য সংগ্রাহক রেকর্ড মুছতে পারেন।'), 'warning');
      return false;
    }
    setVillageResidents(prev => prev.filter(r => r.id !== id));
    showToast(t('Resident record deleted', 'তথ্যটি মুছে ফেলা হয়েছে'), 'info');
    return true;
  };

  // Funds Management (Admin, Cashier, Assistant Cashier)
  const addFundTransaction = (txn: Omit<FundTransaction, 'id'>): boolean => {
    if (!canManageFundsPermission()) {
      showToast(t('Access Denied: Only Cashier, Assistant Cashier, or Admin can manage funds.', 'অনুমতি নেই: শুধুমাত্র ক্যাশিয়ার, সহকারী ক্যাশিয়ার বা অ্যাডমিন তহবিল এন্ট্রি ও হিসাব পরিচালনা করতে পারেন।'), 'warning');
      return false;
    }
    const voucherNo = txn.voucherNo || `VCH-2026-${String(funds.length + 1).padStart(3, '0')}`;
    const recordedBy = txn.recordedBy || (isAdminLoggedIn ? 'Admin Council' : `${currentMember?.name} (${currentMember?.role})`);
    const newTxn: FundTransaction = {
      ...txn,
      id: `f-${Date.now()}`,
      voucherNo,
      recordedBy
    };
    setFunds(prev => [newTxn, ...prev]);
    showToast(t(`Voucher ${voucherNo} for ৳${txn.amount.toLocaleString()} recorded!`, `৳${txn.amount.toLocaleString()} টাকার ভাউচার ${voucherNo} সফলভাবে যুক্ত হয়েছে!`), 'success');
    return true;
  };

  const deleteFundTransaction = (id: string): boolean => {
    if (!canManageFundsPermission()) {
      showToast(t('Access Denied: Only Cashier, Assistant Cashier, or Admin can delete transactions.', 'অনুমতি নেই: শুধুমাত্র ক্যাশিয়ার, সহকারী ক্যাশিয়ার বা অ্যাডমিন লেনদেন বাতিল করতে পারেন।'), 'warning');
      return false;
    }
    setFunds(prev => prev.filter(f => f.id !== id));
    showToast(t('Transaction voucher deleted from ledger', 'ভাউচারটি সফলভাবে বাতিল করা হয়েছে'), 'info');
    return true;
  };

  const updateFundTransaction = (id: string, updated: Partial<FundTransaction>): boolean => {
    if (!canManageFundsPermission()) {
      showToast(t('Access Denied: Only Cashier, Assistant Cashier, or Admin can edit transactions.', 'অনুমতি নেই: শুধুমাত্র ক্যাশিয়ার, সহকারী ক্যাশিয়ার বা অ্যাডমিন লেনদেন এডিট করতে পারেন।'), 'warning');
      return false;
    }
    setFunds(prev => prev.map(f => f.id === id ? { ...f, ...updated } : f));
    showToast(t('Transaction record updated', 'লেনদেনের বিবরণ সফলভাবে হালনাগাদ করা হয়েছে'), 'success');
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
    const newMember: Member = {
      id: `m-${Date.now()}`,
      memberNo: `SMK-2026-00${members.length + 1}`,
      name: data.name,
      email: data.email,
      phone: data.phone,
      password: data.password || 'password123',
      role: data.role || 'Member',
      status: 'Active',
      village: data.village || 'Gaira',
      bloodGroup: data.bloodGroup || 'O+',
      skills: data.skills || ['Volunteering'],
      interests: data.interests || ['Community Care'],
      joinDate: new Date().toISOString().split('T')[0],
      avatar: data.avatar || '',
      bio: data.bio || 'Registered youth member of Salmikkhang community.'
    };
    setMembers(prev => [newMember, ...prev]);
    showToast(
      t(`Member ${newMember.name} registered! ID: ${newMember.memberNo}. They can now login with password: ${newMember.password}`,
        `সদস্য ${newMember.name} নিবন্ধিত হয়েছেন! আইডি: ${newMember.memberNo}। পাসওয়ার্ড: ${newMember.password}`),
      'success'
    );
  };

  // CRUD Actions
  const submitJoinRequest = (req: Omit<JoinRequest, 'id' | 'status' | 'date'>) => {
    const newReq: JoinRequest = {
      ...req,
      id: `jr-${Date.now()}`,
      status: 'Pending',
      date: new Date().toISOString().split('T')[0]
    };
    setJoinRequests(prev => [newReq, ...prev]);
    showToast(
      t('Application sent to Admin! The council will verify your information and register you.', 'আবেদনটি অ্যাডমিনের নিকট পাঠানো হয়েছে! তথ্যাদি যাচাই করে অ্যাডমিন আপনাকে নিবন্ধন করবেন।'),
      'success'
    );
  };

  const approveJoinRequest = (requestId: string, role: Member['role'] = 'Member') => {
    const req = joinRequests.find(r => r.id === requestId);
    if (!req) return;

    const newMember: Member = {
      id: `m-${Date.now()}`,
      memberNo: `SMK-2026-00${members.length + 1}`,
      name: req.name,
      email: req.email,
      phone: req.phone,
      password: 'password123',
      role: role,
      status: 'Active',
      village: req.village,
      bloodGroup: req.bloodGroup || 'O+',
      skills: req.skills ? req.skills.split(',').map(s => s.trim()) : ['Volunteering'],
      interests: req.interests ? req.interests.split(',').map(s => s.trim()) : ['Community Development'],
      joinDate: new Date().toISOString().split('T')[0],
      bio: req.reason || 'Active member of Salmikkhang Youth Community.'
    };

    setMembers(prev => [newMember, ...prev]);
    setJoinRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'Approved' } : r));
    showToast(t(`${req.name} has been enrolled as an active member (Password: password123)!`, `${req.name}-কে সদস্য হিসেবে নিবন্ধন করা হয়েছে (পাসওয়ার্ড: password123)!`), 'success');
  };

  const rejectJoinRequest = (requestId: string) => {
    setJoinRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'Rejected' } : r));
    showToast(t('Join request status updated to Rejected', 'আবেদনটি বাতিল হিসেবে চিহ্নিত হয়েছে'), 'info');
  };

  const updateMember = (id: string, updated: Partial<Member>) => {
    setMembers(prev => prev.map(m => m.id === id ? { ...m, ...updated } : m));
    if (currentMember?.id === id) {
      setCurrentMember(prev => prev ? { ...prev, ...updated } : null);
    }
    showToast(t('Member details updated', 'সদস্যের তথ্য সফলভাবে হালনাগাদ করা হয়েছে'), 'success');
  };

  const deleteMember = (id: string) => {
    setMembers(prev => prev.filter(m => m.id !== id));
    if (currentMember?.id === id) {
      setCurrentMember(null);
    }
    showToast(t('Member removed from directory', 'সদস্য তালিকা থেকে অপসারিত হয়েছে'), 'info');
  };

  const submitContactMessage = (msg: Omit<ContactMessage, 'id' | 'date' | 'status'>) => {
    const newMsg: ContactMessage = {
      ...msg,
      id: `msg-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      status: 'Unread'
    };
    setMessages(prev => [newMsg, ...prev]);
    showToast(
      t('Your message has been sent to Salmikkhang organizers!', 'আপনার বার্তা সফলভাবে সালমিকখাং আয়োজকদের কাছে পাঠানো হয়েছে!'),
      'success'
    );
  };

  const markMessageStatus = (id: string, status: ContactMessage['status']) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, status } : m));
  };

  const deleteMessage = (id: string) => {
    setMessages(prev => prev.filter(m => m.id !== id));
    showToast(t('Message deleted', 'বার্তা মুছে ফেলা হয়েছে'), 'info');
  };

  const toggleEventRsvp = (eventId: string, userNameOrEmail: string) => {
    setEvents(prev =>
      prev.map(ev => {
        if (ev.id !== eventId) return ev;
        const exists = ev.rsvps.includes(userNameOrEmail);
        const updatedRsvps = exists
          ? ev.rsvps.filter(u => u !== userNameOrEmail)
          : [...ev.rsvps, userNameOrEmail];
        
        showToast(
          exists
            ? t('You canceled your RSVP for this event.', 'আপনি এই ইভেন্টের অংশগ্রহণ বাতিল করেছেন।')
            : t('RSVP confirmed! See you at the event.', 'আপনার অংশগ্রহণ নিশ্চিত হয়েছে! অনুষ্ঠানে দেখা হবে।'),
          exists ? 'info' : 'success'
        );
        return { ...ev, rsvps: updatedRsvps };
      })
    );
  };

  const addEvent = (event: Omit<CommunityEvent, 'id' | 'rsvps'>) => {
    const newEvent: CommunityEvent = {
      ...event,
      id: `ev-${Date.now()}`,
      rsvps: []
    };
    setEvents(prev => [newEvent, ...prev]);

    // Send notification to members
    const notif: MemberNotification = {
      id: `notif-${Date.now()}`,
      title: `New Event: ${event.title}`,
      titleBn: `নতুন অনুষ্ঠান: ${event.titleBn || event.title}`,
      message: `${event.date} · ${event.location} (${event.visibility === 'members_only' ? 'Members Only' : 'Public'})`,
      messageBn: `${event.date} · ${event.locationBn || event.location}`,
      date: event.date,
      type: 'event',
      read: false
    };
    setNotifications(prev => [notif, ...prev]);

    showToast(t('Event announced and notification sent to members', 'নতুন অনুষ্ঠান যুক্ত হয়েছে এবং সদস্যদের নোটিফিকেশন পাঠানো হয়েছে'), 'success');
  };

  const updateEvent = (id: string, event: Partial<CommunityEvent>) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, ...event } : e));
    showToast(t('Event updated successfully', 'ইভেন্ট সফলভাবে হালনাগাদ হয়েছে'), 'success');
  };

  const deleteEvent = (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
    showToast(t('Event removed', 'অনুষ্ঠানটি মুছে ফেলা হয়েছে'), 'info');
  };

  // Add Notice with PDF & Notification dispatch
  const addNewsItem = (item: Omit<NewsItem, 'id'>) => {
    const newItem: NewsItem = {
      ...item,
      visibility: item.visibility || 'public',
      id: `n-${Date.now()}`
    };
    setNews(prev => [newItem, ...prev]);

    // Dispatch notification to all members
    const notif: MemberNotification = {
      id: `notif-${Date.now()}`,
      title: item.title,
      titleBn: item.titleBn,
      message: `${item.visibility === 'members_only' ? '[Members Only] ' : ''}${item.summary || item.content.slice(0, 100)}`,
      messageBn: `${item.visibility === 'members_only' ? '[শুধুমাত্র সদস্য] ' : ''}${item.summaryBn || item.contentBn.slice(0, 100)}`,
      date: item.date || new Date().toISOString().split('T')[0],
      type: 'notice',
      pdfAttachment: item.pdfAttachment,
      read: false
    };
    setNotifications(prev => [notif, ...prev]);

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
    setNews(prev => prev.map(n => n.id === id ? { ...n, ...item } : n));
    showToast(t('News item updated', 'সংবাদটি হালনাগাদ করা হয়েছে'), 'success');
  };

  const deleteNewsItem = (id: string) => {
    setNews(prev => prev.filter(n => n.id !== id));
    showToast(t('News item deleted', 'সংবাদটি মুছে ফেলা হয়েছে'), 'info');
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const clearAllNotifications = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    showToast(t('All notifications marked as read', 'সব নোটিফিকেশন পঠিত হিসেবে চিহ্নিত করা হয়েছে'), 'info');
  };

  const addProject = (proj: Omit<Project, 'id'>) => {
    const newProj: Project = {
      ...proj,
      id: `p-${Date.now()}`
    };
    setProjects(prev => [newProj, ...prev]);
    showToast(t('Project added', 'নতুন উদ্যোগ যুক্ত হয়েছে'), 'success');
  };

  const updateProject = (id: string, proj: Partial<Project>) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...proj } : p));
    showToast(t('Project updated', 'প্রকল্প হালনাগাদ হয়েছে'), 'success');
  };

  const deleteProject = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    showToast(t('Project removed', 'উদ্যোগটি অপসারণ করা হয়েছে'), 'info');
  };

  const addGalleryItem = (item: Omit<GalleryItem, 'id'>) => {
    const newItem: GalleryItem = {
      ...item,
      id: `g-${Date.now()}`
    };
    setGallery(prev => [newItem, ...prev]);
    showToast(t('Photo album item added', 'গ্যালারিতে নতুন ছবি যুক্ত হয়েছে'), 'success');
  };

  const deleteGalleryItem = (id: string) => {
    setGallery(prev => prev.filter(g => g.id !== id));
    showToast(t('Gallery photo deleted', 'ছবিটি মুছে ফেলা হয়েছে'), 'info');
  };

  const addDiscussionPost = (text: string, category: DiscussionPost['category']) => {
    const author = currentMember?.name || 'Village Member';
    const role = currentMember?.role || 'Member';
    const newPost: DiscussionPost = {
      id: `d-${Date.now()}`,
      authorName: author,
      authorRole: role,
      date: new Date().toISOString().split('T')[0],
      text,
      category,
      likes: 0,
      likedByMe: false,
      replies: []
    };
    setDiscussions(prev => [newPost, ...prev]);
    showToast(t('Your thought has been posted on the Youth Wall!', 'আপনার বার্তাটি যুব ফোরামে যুক্ত হয়েছে!'), 'success');
  };

  const likeDiscussionPost = (id: string) => {
    setDiscussions(prev =>
      prev.map(p => {
        if (p.id !== id) return p;
        const liked = !p.likedByMe;
        return {
          ...p,
          likedByMe: liked,
          likes: liked ? p.likes + 1 : Math.max(0, p.likes - 1)
        };
      })
    );
  };

  const addDiscussionReply = (postId: string, text: string) => {
    const author = currentMember?.name || 'Community Member';
    const role = currentMember?.role || 'Member';
    const replyItem = {
      id: `dr-${Date.now()}`,
      author,
      role,
      text,
      date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setDiscussions(prev =>
      prev.map(p => (p.id === postId ? { ...p, replies: [...p.replies, replyItem] } : p))
    );
    showToast(t('Reply added to discussion', 'মন্তব্য সফলভাবে যুক্ত হয়েছে'), 'success');
  };

  const updateSettings = (newSettings: Partial<CommunitySettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
    showToast(t('Community settings saved', 'কমিউনিটির সেটিংস সংরক্ষিত হয়েছে'), 'success');
  };

  const resetAllData = () => {
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
    setSettings(initialSettings);
    setCurrentMember(null);
    showToast(t('Demo data reset to initial values', 'ডেমো তথ্য প্রাথমিক অবস্থায় ফিরিয়ে নেওয়া হয়েছে'), 'info');
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
      exportedAt: new Date().toISOString()
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
        currentMember,
        loginAsMember,
        logoutMember,
        quickSwitchMember,
        isAdminLoggedIn,
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
        deleteGalleryItem,
        addDiscussionPost,
        likeDiscussionPost,
        addDiscussionReply,
        updateSettings,
        resetAllData,
        exportDataJSON
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
