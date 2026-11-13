export type Language = 'en' | 'bn';
export type Theme = 'light' | 'dark' | 'system';

export type Role = 
  | 'President' 
  | 'Vice President'
  | 'General Secretary' 
  | 'Joint Secretary'
  | 'Cashier'
  | 'Assistant Cashier'
  | 'Organizing Secretary'
  | 'Data Collector'
  | 'Publicity Secretary'
  | 'Sports & Cultural Secretary'
  | 'Social Welfare Secretary'
  | 'Education & Library Secretary'
  | 'Youth Coordinator' 
  | 'Executive Member' 
  | 'Advisor' 
  | 'Volunteer' 
  | 'Member';

export type AidStatus = 
  | 'General Resident' 
  | 'Eligible for Aid' 
  | 'Senior Citizen' 
  | 'Student / Youth' 
  | 'Medical Assistance'
  | 'Farmer / Daily Wage Earner';

export interface VillageResident {
  id: string;
  residentNo: string; // e.g. "RES-2026-001"
  name: string;
  nameBn?: string;
  guardianName: string; // পিতা/স্বামীর নাম
  village: string; // গাইরা, জলছত্র, পীরগাছা, শোলাকুড়ী
  para: string; // পাড়া / মহল্লা
  phone: string;
  nidOrBirthCert?: string; // জাতীয় পরিচয়পত্র / জন্ম নিবন্ধন নং
  occupation: string; // পেশা (কৃষক, শিক্ষক, দিনমজুর, ইত্যাদি)
  familyMembersCount: number; // পরিবারের সদস্য সংখ্যা
  bloodGroup: string; // রক্তের গ্রুপ
  aidStatus: AidStatus;
  aidStatusBn: string;
  notes?: string; // জরুরি সহায়তা প্রয়োজন বা মন্তব্য
  collectedBy: string; // তথ্য সংগ্রাহক (Data Collector) বা অ্যাডমিনের নাম
  collectedByUid?: string;
  collectedDate: string;
  updatedDate?: string;
}

export interface RoleDetail {
  role: Role;
  titleEn: string;
  titleBn: string;
  departmentEn: string;
  departmentBn: string;
  descriptionEn: string;
  descriptionBn: string;
  dutiesEn: string[];
  dutiesBn: string[];
  canManageFunds?: boolean;
  canCollectData?: boolean;
  canManageMembers?: boolean;
  canManageNotices?: boolean;
  canManageEvents?: boolean;
  canManageProjects?: boolean;
  canManageGallery?: boolean;
  badgeColor: string;
}

export interface Member {
  id: string;
  memberNo: string; // e.g. "SMK-2026-001"
  name: string;
  email: string;
  phone: string;
  password?: string; // Member portal login password
  role: Role;
  status: 'Active' | 'Inactive';
  village: string;
  bloodGroup: string; // "A+", "B+", "O+", "AB+", etc.
  skills: string[];
  interests: string[];
  joinDate: string;
  avatar?: string;
  bio?: string;
  ownerUid?: string;
  ownerEmail?: string;
}

export interface JoinRequest {
  id: string;
  name: string;
  email: string;
  phone: string;
  village: string;
  bloodGroup: string;
  skills: string;
  interests: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  date: string;
}

export interface CommunityEvent {
  id: string;
  title: string;
  titleBn: string;
  date: string;
  time: string;
  timeBn: string;
  location: string;
  locationBn: string;
  category: 'Meeting' | 'Environment' | 'Culture' | 'Sports' | 'Education';
  categoryBn: string;
  description: string;
  descriptionBn: string;
  image: string;
  status: 'Upcoming' | 'Past' | 'Planning';
  visibility: 'public' | 'members_only'; // public for all visitors, members_only for registered members
  rsvps: string[]; // array of member emails or names
}

export interface PdfAttachment {
  fileName: string;
  fileSize?: string;
  dataUrl: string;
}

export interface NewsItem {
  id: string;
  title: string;
  titleBn: string;
  category: 'Announcement' | 'Notice' | 'Education' | 'Environment' | 'Sports' | 'Community';
  categoryBn: string;
  date: string;
  summary: string;
  summaryBn: string;
  content: string;
  contentBn: string;
  image: string;
  tagColor: 'green' | 'blue' | 'purple' | 'amber';
  status: 'Published' | 'Draft';
  visibility?: 'public' | 'members_only'; // public for all visitors, members_only for registered members only
  pdfAttachment?: PdfAttachment;
}

export interface MemberNotification {
  id: string;
  title: string;
  titleBn: string;
  message: string;
  messageBn: string;
  date: string;
  type: 'notice' | 'event' | 'system';
  pdfAttachment?: PdfAttachment;
  read: boolean;
}

export interface Project {
  id: string;
  title: string;
  titleBn: string;
  category: string;
  categoryBn: string;
  status: 'Ongoing' | 'Planning' | 'Completed';
  statusBn: string;
  progress: number; // 0 - 100
  description: string;
  descriptionBn: string;
  image: string;
  volunteersNeeded: number;
  volunteersEnrolled: number;
}

export interface GalleryItem {
  id: string;
  title: string;
  titleBn: string;
  category: string;
  categoryBn: string;
  image: string;
  date: string;
  visibility?: 'public';
}

export interface ContactMessage {
  id: string;
  name: string;
  contact: string;
  message: string;
  date: string;
  status: 'Unread' | 'Read' | 'Replied';
}

export interface DiscussionPost {
  id: string;
  authorUid?: string;
  authorName: string;
  authorRole: string;
  authorAvatar?: string;
  date: string;
  text: string;
  category: 'General' | 'Project Idea' | 'Question' | 'Event Prep';
  likes: number;
  likedByMe?: boolean;
  likedByUids?: string[];
  replies: {
    id: string;
    author: string;
    role: string;
    text: string;
    date: string;
  }[];
}

export interface FundTransaction {
  id: string;
  date: string;
  type: 'Inflow' | 'Outflow';
  amount: number;
  title: string;
  titleBn: string;
  donorOrBeneficiary: string;
  category: 
    | 'Membership Dues' 
    | 'Tree Saplings' 
    | 'Sports Equipment' 
    | 'Education Supplies' 
    | 'Event Food & Tent'
    | 'Public Donation'
    | 'Emergency Aid'
    | 'Office & Printing'
    | 'Community Welfare';
  recordedBy?: string; // Recorded by Cashier / Assistant Cashier / Admin
  recordedByUid?: string;
  voucherNo?: string;
  notes?: string;
}

export interface CommunitySettings {
  name: string;
  nameBn: string;
  village: string;
  address: string;
  phone: string;
  email: string;
  motto: string;
  mottoBn: string;
  about: string;
  aboutBn: string;
  /** Admin-uploaded home page banner background (data URL). Falls back to the bundled image. */
  heroBackground?: string;
  /** Admin-uploaded site-wide background (data URL). Falls back to the bundled image. */
  siteBackground?: string;
}
