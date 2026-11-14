import type { WebsiteFontStyle } from '../types';

export interface WebsiteFontPreset {
  id: WebsiteFontStyle;
  nameEn: string;
  nameBn: string;
  pairLabel: string;
  descEn: string;
  descBn: string;
  previewClass: string;
}

export const WEBSITE_FONT_PRESETS: WebsiteFontPreset[] = [
  {
    id: 'editorial',
    nameEn: 'Editorial Grace (Default)',
    nameBn: 'নান্দনিক এডিটোরিয়াল (ডিফল্ট)',
    pairLabel: 'Playfair Display + Noto Serif Bengali · DM Sans',
    descEn: 'Refined serif headlines paired with crisp, legible bilingual body typography.',
    descBn: 'অভিজাত ও দৃষ্টিনন্দন শিরোনাম এবং অত্যন্ত পরিচ্ছন্ন ও আরামদায়ক বাংলা-ইংরেজি লেখা।',
    previewClass: 'font-preview-editorial',
  },
  {
    id: 'youthful',
    nameEn: 'Bangla Youth Modern',
    nameBn: 'তারুণ্যের আধুনিক বাংলা',
    pairLabel: 'Urbanist + Baloo Da 2 · Plus Jakarta Sans',
    descEn: 'Friendly, energetic rounded Bengali display font tailored for youth communities.',
    descBn: 'তরুণ ও প্রাণবন্ত গ্রাম্য কমিউনিটির জন্য জনপ্রিয় ও আকর্ষণীয় আধুনিক বাংলা ফন্ট।',
    previewClass: 'font-preview-youthful',
  },
  {
    id: 'heritage',
    nameEn: 'Nature Heritage Serif',
    nameBn: 'প্রকৃতি ও ঐতিহ্য সেরিফ',
    pairLabel: 'Fraunces + Noto Serif Bengali · Lora',
    descEn: 'Organic literary curves that harmonize with Madhupur forest heritage.',
    descBn: 'সাংস্কৃতিক গল্প, ইতিহাস ও প্রকৃতির সাথে মানানসই উষ্ণ ও শৈল্পিক ফন্ট।',
    previewClass: 'font-preview-heritage',
  },
  {
    id: 'classic',
    nameEn: 'Classic Clean Sans',
    nameBn: 'সরল ও পরিপাটি ক্লাসিক',
    pairLabel: 'Plus Jakarta Sans + Hind Siliguri',
    descEn: 'Uniform modern sans-serif across headings, cards, notices, and tables.',
    descBn: 'সব সেকশনে একরকম সরল, আধুনিক ও পঠনযোগ্য স্যান্স-সেরিফ ফন্ট।',
    previewClass: 'font-preview-classic',
  },
];

export const VALID_WEBSITE_FONT_STYLES: WebsiteFontStyle[] = [
  'editorial',
  'youthful',
  'heritage',
  'civic',
  'classic',
  'botanical',
];

export function normalizeWebsiteFontStyle(value?: string): WebsiteFontStyle {
  if (value === 'youthful' || value === 'heritage' || value === 'classic' || value === 'editorial') {
    return value;
  }
  if (value === 'civic') {
    return 'youthful';
  }
  return 'editorial';
}
