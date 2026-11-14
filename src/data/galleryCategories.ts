export interface GalleryCategoryOption {
  value: string;
  labelEn: string;
  labelBn: string;
}

export const GALLERY_CATEGORIES: GalleryCategoryOption[] = [
  { value: 'Landscape', labelEn: 'Landscape', labelBn: 'প্রকৃতি' },
  { value: 'Education', labelEn: 'Education', labelBn: 'শিক্ষা' },
  { value: 'Environment', labelEn: 'Environment', labelBn: 'পরিবেশ' },
  { value: 'Culture', labelEn: 'Culture', labelBn: 'সংস্কৃতি' },
  { value: 'Sports', labelEn: 'Sports', labelBn: 'খেলাধুলা' },
  { value: 'Community', labelEn: 'Community', labelBn: 'কমিউনিটি' },
  { value: 'Events', labelEn: 'Events', labelBn: 'অনুষ্ঠান' },
];

export function getGalleryCategoryBn(category: string): string {
  const normalized = (category || '').trim().toLowerCase();
  const match = GALLERY_CATEGORIES.find(c => c.value.toLowerCase() === normalized);
  return match ? match.labelBn : category;
}
