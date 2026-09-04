/**
 * formatNews.ts
 * Formats dense text, fixes word collisions, numbers, locations, and formatting.
 */

export const formatNewsText = (text: string): string => {
  if (!text) return '';

  let cleaned = text
    // Normalize line breaks
    .replace(/\r\n/g, '\n')
    // Fix word collisions where numbers are glued to text (e.g. راتب500الف -> راتب 500 الف)
    .replace(/([^\s\d])(\d+)/g, '$1 $2')
    .replace(/(\d+)([^\s\d])/g, '$1 $2')
    // Fix punctuation spacing
    .replace(/\s*([،؛:!?.])\s*/g, '$1 ')
    // Multiple spaces to single space
    .replace(/[ \t]{2,}/g, ' ')
    // Split sentences into clear paragraphs
    .replace(/([.!?؟!،])\s+/g, '$1\n\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return cleaned;
};

// Recognized Iraqi and Arab cities for location tagging
export const RECOGNIZED_LOCATIONS = [
  'بغداد', 'البصرة', 'أربيل', 'اربيل', 'النجف', 'كربلاء', 'السليمانية',
  'دهوك', 'كركوك', 'الموصل', 'نينوى', 'بابل', 'الحلة', 'ديالى', 'بعقوبة',
  'واسط', 'الكوت', 'ميسان', 'العمارة', 'ذي قار', 'الناصرية', 'المثنى',
  'السماوة', 'الأنبار', 'الانبار', 'الرمادي', 'الفلوجة', 'صلاح الدين', 'تكريت',
  'عن بعد', 'عن بُعد', 'الكرخ', 'الرصافة', 'المنصور', 'زيونة', 'الجادرية', 'الكرادة',
  'دبي', 'الرياض', 'عمان', 'القاهرة'
];

// Working hours terms
export const WORKING_HOURS_KEYWORDS = [
  'دوام كامل', 'دوام جزئي', 'دوام صباحي', 'دوام مسائي', 'دوام ليلي',
  'شفت صباحي', 'شفت مسائي', '8 ساعات', '6 ساعات', '12 ساعة', 'عن بعد'
];
