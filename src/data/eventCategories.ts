export interface EventCategoryOption {
  value: string;
  labelEn: string;
  labelBn: string;
}

export const EVENT_CATEGORIES: EventCategoryOption[] = [
  { value: 'Meeting', labelEn: 'Meeting', labelBn: 'সভা' },
  { value: 'Environment', labelEn: 'Environment', labelBn: 'পরিবেশ' },
  { value: 'Culture', labelEn: 'Culture', labelBn: 'সংস্কৃতি' },
  { value: 'Sports', labelEn: 'Sports', labelBn: 'খেলাধুলা' },
  { value: 'Education', labelEn: 'Education', labelBn: 'শিক্ষা' },
  { value: 'Community', labelEn: 'Community', labelBn: 'কমিউনিটি' },
  { value: 'Workshop', labelEn: 'Workshop', labelBn: 'কর্মশালা' },
  { value: 'Health', labelEn: 'Health', labelBn: 'স্বাস্থ্য' },
];

export function isPresetEventCategory(category?: string): boolean {
  const normalized = (category || '').trim().toLowerCase();
  return EVENT_CATEGORIES.some(c => c.value.toLowerCase() === normalized);
}

export function getEventCategoryBn(category: string): string {
  const normalized = (category || '').trim().toLowerCase();
  const match = EVENT_CATEGORIES.find(c => c.value.toLowerCase() === normalized);
  return match ? match.labelBn : category;
}
