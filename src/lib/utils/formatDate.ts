/**
 * formatDate.ts
 * Bulletproof Arabic relative time formatter (safeTimeAgo).
 * Handles Firestore timestamps (.toDate()), ISO strings, numeric epoch ms, Date objects,
 * and always falls back safely without ever printing NaN.
 */

export function safeTimeAgo(dateInput: any): string {
  if (!dateInput) return 'منذ قليل';

  try {
    let date: Date;

    if (typeof dateInput?.toDate === 'function') {
      date = dateInput.toDate();
    } else if (dateInput instanceof Date) {
      date = dateInput;
    } else if (typeof dateInput === 'number') {
      date = new Date(dateInput);
    } else if (typeof dateInput === 'string') {
      const parsed = new Date(dateInput);
      if (!isNaN(parsed.getTime())) {
        date = parsed;
      } else {
        // Try parsing number if string is numeric timestamp
        const num = Number(dateInput);
        if (!isNaN(num) && num > 0) {
          date = new Date(num);
        } else {
          return 'منذ قليل';
        }
      }
    } else if (typeof dateInput === 'object' && dateInput.seconds) {
      // Common timestamp format { seconds, nanoseconds }
      date = new Date(dateInput.seconds * 1000);
    } else {
      return 'منذ قليل';
    }

    const time = date.getTime();
    if (isNaN(time)) return 'منذ قليل';

    const diff = Date.now() - time;
    if (diff < 0) return 'منذ لحظات';

    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return 'منذ لحظات';

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      if (minutes === 1) return 'منذ دقيقة';
      if (minutes === 2) return 'منذ دقيقتين';
      if (minutes <= 10) return `منذ ${minutes} دقائق`;
      return `منذ ${minutes} دقيقة`;
    }

    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      if (hours === 1) return 'منذ ساعة';
      if (hours === 2) return 'منذ ساعتين';
      if (hours <= 10) return `منذ ${hours} ساعات`;
      return `منذ ${hours} ساعة`;
    }

    const days = Math.floor(hours / 24);
    if (days < 7) {
      if (days === 1) return 'أمس';
      if (days === 2) return 'منذ يومين';
      if (days <= 10) return `منذ ${days} أيام`;
      return `منذ ${days} يوم`;
    }

    const weeks = Math.floor(days / 7);
    if (weeks < 4) {
      if (weeks === 1) return 'منذ أسبوع';
      if (weeks === 2) return 'منذ أسبوعين';
      return `منذ ${weeks} أسابيع`;
    }

    const months = Math.floor(days / 30);
    if (months < 12) {
      if (months === 1) return 'منذ شهر';
      if (months === 2) return 'منذ شهرين';
      return `منذ ${months} أشهر`;
    }

    return date.toLocaleDateString('ar-EG');
  } catch {
    return 'منذ قليل';
  }
}
