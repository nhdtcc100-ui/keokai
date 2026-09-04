import { AppUser } from '../../types';

/**
 * 👑 Checks if a user is an Administrator (highest authority).
 * Administrators always have full superpowers and access to all tools.
 */
export const isUserAdmin = (user: any): boolean => {
  if (!user) return false;
  const role = String(user.role || '').toLowerCase().trim();
  const email = String(user.email || '').toLowerCase().trim();

  return Boolean(
    user.isAdmin === true ||
    user.is_admin === true ||
    role === 'admin' ||
    role === 'superadmin' ||
    role === 'مدير' ||
    role === 'ادمن' ||
    email === 'admin@prolink.com' ||
    email.includes('nhdtcc100@gmail.com') ||
    email.includes('nhd0770@gmail.com')
  );
};

/**
 * 💼 Checks if a user is authorized to post jobs.
 * 1. Admin: ALWAYS TRUE (full access).
 * 2. Seeker: ALWAYS FALSE (strictly hidden).
 * 3. Employer: TRUE.
 * 4. Unspecified: Default to FALSE unless they explicitly choose Employer.
 */
export const isJobPoster = (user: any): boolean => {
  if (!user) return false;

  // 👑 Admin always has full power
  if (isUserAdmin(user)) {
    return true;
  }

  const role = String(user.role || '').toLowerCase().trim();

  // 🚫 Seeker is strictly forbidden from posting jobs
  if (
    role === 'seeker' ||
    role === 'jobseeker' ||
    role === 'job_seeker' ||
    role === 'candidate' ||
    role === 'applicant' ||
    role === 'باحث' ||
    role === 'باحث عن عمل'
  ) {
    return false;
  }

  // ✅ Only explicitly designated Employers can post jobs
  if (
    role === 'employer' ||
    role === 'company' ||
    role === 'recruiter' ||
    role === 'صاحب عمل' ||
    role === 'شركة' ||
    role === 'مؤسسة' ||
    user.hasCompanyProfile === true
  ) {
    return true;
  }

  // Default: non-employers cannot post jobs
  return false;
};

/**
 * 👤 Checks if a user is a Job Seeker.
 */
export const isJobSeeker = (user: any): boolean => {
  if (!user) return false;
  if (isUserAdmin(user)) return false;

  const role = String(user.role || '').toLowerCase().trim();
  return (
    role === 'seeker' ||
    role === 'jobseeker' ||
    role === 'job_seeker' ||
    role === 'candidate' ||
    role === 'applicant' ||
    role === 'باحث' ||
    role === 'باحث عن عمل'
  );
};

/**
 * 📝 Checks if a user can post articles, posts, and interact (like/dislike/comment/echo).
 * Seekers are read-only for posts and cannot publish or interact.
 * Employers and Admins have full access to post and interact.
 */
export const canUserPostAndInteract = (user: any): boolean => {
  if (!user) return false;
  if (isUserAdmin(user)) return true;
  if (isJobSeeker(user)) return false;
  return isJobPoster(user);
};

