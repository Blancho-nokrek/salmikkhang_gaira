export interface NewsCategoryOption {
  value: string;
  labelEn: string;
  labelBn: string;
}

export const NEWS_CATEGORIES: NewsCategoryOption[] = [
  { value: 'Notice', labelEn: 'Notice', labelBn: 'নোটিশ' },
  { value: 'Announcement', labelEn: 'Announcement', labelBn: 'ঘোষণা' },
  { value: 'News', labelEn: 'News', labelBn: 'সংবাদ' },
  { value: 'Education', labelEn: 'Education', labelBn: 'শিক্ষা' },
  { value: 'Environment', labelEn: 'Environment', labelBn: 'পরিবেশ' },
  { value: 'Sports', labelEn: 'Sports', labelBn: 'খেলাধুলা' },
  { value: 'Culture', labelEn: 'Culture', labelBn: 'সংস্কৃতি' },
  { value: 'Community', labelEn: 'Community', labelBn: 'কমিউনিটি' },
  { value: 'Resolution', labelEn: 'Resolution', labelBn: 'রেজোলিউশন' },
  { value: 'Health', labelEn: 'Health', labelBn: 'স্বাস্থ্য' },
];

export function isPresetNewsCategory(category?: string): boolean {
  const normalized = (category || '').trim().toLowerCase();
  return NEWS_CATEGORIES.some(c => c.value.toLowerCase() === normalized);
}

export function getNewsCategoryBn(category: string): string {
  const normalized = (category || '').trim().toLowerCase();
  const match = NEWS_CATEGORIES.find(c => c.value.toLowerCase() === normalized);
  return match ? match.labelBn : category;
}
