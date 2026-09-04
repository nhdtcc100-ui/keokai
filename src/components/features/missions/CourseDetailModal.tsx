import React from 'react';
import { motion } from 'motion/react';
import {
  ArrowRight, BookOpen, Clock, DollarSign, Tag,
  GraduationCap, Award, CheckCircle, CheckCircle2,
  Share2, Bookmark, User, Sparkles, Home
} from 'lucide-react';

import { Course } from '../../../types';

interface CourseDetailModalProps {
  course: Course | null;
  onClose: () => void;
  onApply: (course: Course) => void;
  onNavigateHome?: () => void;
  appUser?: any;
  allUsers?: any[];
  isRegistered?: boolean;
  registrationStatus?: string;
  onOpenProfile?: (user: any) => void;
}

export const CourseDetailModal: React.FC<CourseDetailModalProps> = ({
  course,
  onClose,
  onApply,
  onNavigateHome,
  appUser,
  allUsers = [],
  isRegistered = false,
  registrationStatus,
  onOpenProfile
}) => {
  if (!course) return null;

  const isActive = course.is_active !== false;
  const isProvider = !!(appUser && appUser.id === course.provider_id);

  const publisher = (allUsers || []).find((u: any) => u.id === course.provider_id) ||
                    (appUser && appUser.id === course.provider_id ? appUser : null);

  const heroCover = publisher?.coverUrl || (publisher as any)?.cover_url || course.image_url;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 30 }}
      transition={{ type: 'spring', damping: 26, stiffness: 280 }}
      className="fixed inset-0 h-[100dvh] max-h-[100dvh] z-[220] bg-white dark:bg-slate-900 flex flex-col overflow-hidden"
      dir="rtl"
    >
      <div className="flex flex-col w-full h-full max-w-3xl mx-auto relative overflow-hidden">

        {/* ── Hero Header Banner ── */}
        <div className="relative shrink-0 overflow-hidden" style={{ minHeight: '200px' }}>
          {heroCover ? (
            <img src={heroCover} alt={course.title} className="w-full h-full object-cover absolute inset-0" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-indigo-700 via-blue-700 to-blue-950 absolute inset-0 overflow-hidden">
              <div className="absolute inset-0 opacity-10 flex items-center justify-center -rotate-12 scale-150">
                <GraduationCap size={120} className="text-white" />
              </div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/40 to-transparent" />

          {/* Navigation Buttons */}
          <div
            className="absolute flex items-center gap-2 z-20"
            style={{ top: 'max(env(safe-area-inset-top, 0px), 16px)', right: '16px' }}
          >
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white/15 hover:bg-white/25 border border-white/20 text-white rounded-2xl text-xs font-black transition-all backdrop-blur-md cursor-pointer active:scale-95"
            >
              <ArrowRight size={16} />
              <span>رجوع</span>
            </button>
            {onNavigateHome && (
              <button
                onClick={onNavigateHome}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-white/15 hover:bg-white/25 border border-white/20 text-white rounded-2xl text-xs font-black transition-all backdrop-blur-md cursor-pointer active:scale-95"
              >
                <Home size={15} />
                <span>الرئيسية</span>
              </button>
            )}
          </div>

          <div className="absolute bottom-6 right-6 left-6 z-10">
            <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.15em] backdrop-blur-md border mb-3 ${
              isActive ? 'bg-emerald-500/20 border-emerald-400/30 text-emerald-400' : 'bg-slate-700/20 border-slate-600/30 text-slate-300'
            }`}>
              <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`} />
              {isActive ? 'التسجيل متاح الآن' : 'التسجيل مغلق'}
            </div>
            
            <h1 className="text-2xl md:text-3xl font-black text-white drop-shadow-2xl leading-tight tracking-tight">
              {course.title}
            </h1>
            
            <div className="flex items-center gap-3 mt-2.5">
              <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white/30 bg-blue-600 flex items-center justify-center text-white text-xs font-black shrink-0">
                {publisher?.avatar || course.providerAvatar ? (
                  <img src={publisher?.avatar || course.providerAvatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User size={14} />
                )}
              </div>
              <p className="font-extrabold text-white/90 text-sm">
                {publisher?.name || course.providerName || 'مدرب محترف'}
              </p>
            </div>
          </div>
        </div>

        {/* ── Scrollable Body Content ── */}
        <div className="flex-1 overflow-y-auto p-5 md:p-8 space-y-6 bg-slate-50/50 dark:bg-slate-900/60 custom-scrollbar">

          {/* Meta Stats Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-700 flex flex-col gap-1 shadow-sm">
              <Clock size={15} className="text-blue-500" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">المدة الزمنية</span>
              <span className="font-black text-xs md:text-sm text-slate-800 dark:text-white truncate">
                {course.duration || 'مرن'}
              </span>
            </div>

            <div className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-700 flex flex-col gap-1 shadow-sm">
              <DollarSign size={15} className="text-emerald-500" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">الرسوم</span>
              <span className="font-black text-xs md:text-sm text-emerald-600 dark:text-emerald-400 truncate">
                {course.price || 'مجاني'}
              </span>
            </div>

            <div className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-700 flex flex-col gap-1 shadow-sm">
              <Tag size={15} className="text-indigo-500" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">المستوى</span>
              <span className="font-black text-xs md:text-sm text-slate-800 dark:text-white truncate">
                {course.level || 'كافة المستويات'}
              </span>
            </div>
          </div>

          {/* Section 1: Course Description */}
          <div className="bg-white dark:bg-slate-800 p-5 md:p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm space-y-3">
            <h3 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
              <BookOpen size={16} className="text-blue-600" />
              نبذة وتفاصيل الدورة التدريبية
            </h3>
            <p className="text-xs md:text-sm leading-relaxed font-medium text-slate-600 dark:text-slate-300 whitespace-pre-line">
              {course.description}
            </p>
          </div>

          {/* Section 2: Learning Outcomes */}
          {course.outcomes && (
            <div className="bg-white dark:bg-slate-800 p-5 md:p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm space-y-3">
              <h3 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
                <Award size={16} className="text-emerald-500" />
                ماذا سيتعلم الطالب؟ (أهم المخرجات)
              </h3>
              <p className="text-xs md:text-sm leading-relaxed font-medium text-slate-600 dark:text-slate-300 whitespace-pre-line">
                {course.outcomes}
              </p>
            </div>
          )}

          {/* Section 3: Prerequisites */}
          {course.requirements && (
            <div className="bg-white dark:bg-slate-800 p-5 md:p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm space-y-3">
              <h3 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
                <CheckCircle size={16} className="text-amber-500" />
                المتطلبات المسبقة للالتحاق
              </h3>
              <p className="text-xs md:text-sm leading-relaxed font-medium text-slate-600 dark:text-slate-300 whitespace-pre-line">
                {course.requirements}
              </p>
            </div>
          )}

          {/* Section 4: Trainer Profile Card */}
          {publisher && (
            <div className="bg-white dark:bg-slate-800 p-5 md:p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-12 h-12 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 shrink-0">
                  {publisher.avatar ? (
                    <img src={publisher.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 font-black">
                      {publisher.name?.slice(0, 1) || 'U'}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs md:text-sm font-black text-slate-800 dark:text-white truncate">
                      {publisher.name}
                    </h4>
                    <Sparkles size={12} className="text-amber-500 shrink-0" />
                  </div>
                  <p className="text-[11px] font-bold text-slate-400 truncate mt-0.5">
                    {publisher.title || publisher.companyName || 'مدرب معتمد'}
                  </p>
                </div>
              </div>

              {onOpenProfile && (
                <button
                  type="button"
                  onClick={() => onOpenProfile(publisher)}
                  className="px-4 py-2 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0"
                >
                  عرض الملف
                </button>
              )}
            </div>
          )}

        </div>

        {/* ── Sticky Bottom Action Bar ── */}
        <div className="p-4 md:p-6 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700/80 flex items-center gap-3 shrink-0 shadow-lg z-20">
          {isProvider ? (
            <div className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 font-black text-xs text-center rounded-2xl">
              أنت ناشر هذا البرنامج التدريبي 🎓
            </div>
          ) : isRegistered ? (
            <div className="flex-1 py-3.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 font-black text-xs flex items-center justify-center gap-2 rounded-2xl">
              <CheckCircle2 size={16} />
              <span>{registrationStatus === 'approved' ? 'تم قبول تسجيلك في الدورة 🎉' : 'تم إرسال طلب التسجيل (قيد المراجعة ⏳)'}</span>
            </div>
          ) : !isActive ? (
            <div className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-700 text-slate-400 font-black text-xs text-center rounded-2xl">
              التسجيل في الدورة مغلق حالياً 🔒
            </div>
          ) : (
            <button
              onClick={() => onApply(course)}
              className="flex-1 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-98 text-white font-black text-xs md:text-sm rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/25 cursor-pointer"
            >
              <GraduationCap size={17} />
              <span>التسجيل في الدورة التدريبية 🚀</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: course.title,
                  text: course.description,
                  url: window.location.href,
                }).catch(() => {});
              } else {
                navigator.clipboard?.writeText(window.location.href);
              }
            }}
            className="p-3.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 rounded-2xl transition-all cursor-pointer"
            title="مشاركة الدورة"
          >
            <Share2 size={17} />
          </button>
        </div>

      </div>
    </motion.div>
  );
};
