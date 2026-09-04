import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  BookOpen, Clock, DollarSign, Send, Loader2,
  ChevronDown, AlignLeft, CheckCircle, XCircle,
  ArrowRight, Sparkles, Image as ImageIcon, GraduationCap, Award
} from 'lucide-react';
import { validateField } from '../../../lib/security/inputValidator';

export interface CoursePostFormData {
  title: string;
  description: string;
  requirements: string;
  outcomes: string;
  image_url: string;
  duration: string;
  price: string;
  level: string;
  is_active: boolean;
}

interface CoursePostFormProps {
  formData: CoursePostFormData;
  setFormData: (data: CoursePostFormData) => void;
  onSubmit: () => void;
  isPosting: boolean;
  onClose: () => void;
  isEditing?: boolean;
  appUser: any;
}

const inputClass =
  'w-full bg-slate-50/90 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-700/90 rounded-2xl px-4 py-3.5 text-xs md:text-sm font-medium focus:ring-4 focus:ring-blue-50 dark:focus:ring-blue-900/20 focus:border-blue-500 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all outline-none placeholder:text-slate-300 dark:placeholder:text-slate-500 text-slate-800 dark:text-white shadow-sm';
const labelClass = 'text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5';

const LEVELS = ['مبتدئ', 'متوسط', 'متقدم', 'شامل لكافة المستويات'];

export const CoursePostForm: React.FC<CoursePostFormProps> = ({
  formData, setFormData, onSubmit, isPosting, onClose, isEditing = false, appUser
}) => {
  const [formErrors, setFormErrors] = useState<Record<string, string | null>>({});

  const handleFieldChange = (fieldKey: keyof CoursePostFormData, label: string, val: string) => {
    setFormData({ ...formData, [fieldKey]: val });
    if (!val.trim()) {
      setFormErrors(prev => ({ ...prev, [fieldKey]: null }));
      return;
    }
    const check = validateField(val, label, appUser ? { id: appUser.id, name: appUser.name, email: appUser.email } : undefined, '/courses/post');
    setFormErrors(prev => ({ ...prev, [fieldKey]: check.valid ? null : (check.error ?? null) }));
  };

  const hasAnyError = Object.values(formErrors).some(Boolean);

  const isValid = (formData.title || '').trim().length > 2 &&
                  (formData.description || '').trim().length > 10 &&
                  !hasAnyError;

  const completionScore = [
    (formData.title || '').trim().length > 2,
    (formData.description || '').trim().length > 10,
    (formData.requirements || '').trim().length > 5,
    (formData.outcomes || '').trim().length > 5,
    (formData.duration || '').trim().length > 0,
    (formData.price || '').trim().length > 0,
    true, // Identity
  ].filter(Boolean).length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16 px-1 md:px-0" dir="rtl">
      
      {/* ── Top Back & Breadcrumb Bar ── */}
      <div className="flex items-center justify-between px-1">
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-2xl text-xs font-black hover:bg-slate-50 dark:hover:bg-slate-700 transition-all border border-slate-100 dark:border-slate-700 shadow-sm cursor-pointer active:scale-95"
        >
          <ArrowRight size={15} />
          العودة
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xs font-black text-slate-400 dark:text-slate-500">
            {isEditing ? 'تعديل بيانات الدورة' : 'نشر برنامج تدريبي جديد'}
          </span>
        </div>
      </div>

      {/* ── Premium Hero Header Banner ── */}
      <div className="rounded-[2.5rem] overflow-hidden bg-gradient-to-bl from-indigo-700 via-blue-700 to-blue-950 text-white p-6 md:p-8 relative shadow-lg border border-white/10">
        <div className="absolute -top-10 -left-10 w-44 h-44 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-60 h-32 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-center gap-4 md:gap-5 relative z-10">
          <div className="w-14 h-14 md:w-16 md:h-16 bg-white/15 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20 shadow-xl shrink-0">
            <GraduationCap size={28} className="text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black text-blue-200 uppercase tracking-[0.2em] bg-white/10 px-2.5 py-0.5 rounded-full border border-white/10">
                أكاديمية المحترفين — ProLink
              </span>
              <Sparkles size={13} className="text-amber-300" />
            </div>
            <h1 className="text-lg md:text-2xl font-black tracking-tight truncate">
              {formData.title ? formData.title : (isEditing ? 'تعديل بيانات البرنامج التدريبي' : 'نشر دورة تدريبية وتأهيل الكفاءات')}
            </h1>
            <p className="text-blue-100/80 text-xs md:text-sm font-bold truncate mt-0.5">
              {isEditing ? 'قم بتحديث محتوى ومخرجات الدورة للمتدربين' : 'شارك معرفتك وخبراتك المهنية مع المتدربين والمهنيين'}
            </p>
          </div>
        </div>

        {/* Completion Progress Widget */}
        <div className="mt-6 pt-5 border-t border-white/15 relative z-10">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-black text-blue-200 uppercase tracking-widest">نسبة اكتمال تفاصيل الدورة</span>
            <span className="text-xs font-black text-white">{Math.round((completionScore / 7) * 100)}%</span>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-emerald-400 rounded-full shadow-sm"
              initial={{ width: 0 }}
              animate={{ width: `${(completionScore / 7) * 100}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>
      </div>

      {/* ── Main Form Content Card ── */}
      <div className="p-5 md:p-8 bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-sm space-y-6">

        {/* Section 1: Basic Information */}
        <div className="space-y-4">
          <h3 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-700/60 pb-3">
            <BookOpen size={16} className="text-blue-600" />
            المعلومات الأساسية للدورة
          </h3>
          
          <div>
            <label className={labelClass}>عنوان الدورة التدريبية *</label>
            <input
              className={`${inputClass} ${formErrors.title ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : ''}`}
              placeholder="مثال: دبلوم احتراف تصميم واجهات وتجربة المستخدم UI/UX"
              value={formData.title}
              onChange={e => handleFieldChange('title', 'عنوان الدورة', e.target.value)}
              maxLength={120}
            />
            {formErrors.title && <p className="text-[11px] font-bold text-red-500 mt-1">{formErrors.title}</p>}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}><Clock size={11} /> المدة الزمنية</label>
              <input
                className={inputClass}
                placeholder="مثال: 4 أسابيع (30 ساعة تدريبية)"
                value={formData.duration}
                onChange={e => setFormData({ ...formData, duration: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass}><DollarSign size={11} /> رسوم التسجيل</label>
              <input
                className={inputClass}
                placeholder="مثال: مجاني أو 50,000 د.ع"
                value={formData.price}
                onChange={e => setFormData({ ...formData, price: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}><ChevronDown size={11} /> المستوى المستهدف</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {LEVELS.map(lvl => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setFormData({ ...formData, level: lvl })}
                  className={`py-3 px-3 rounded-2xl text-xs font-black border transition-all cursor-pointer ${
                    formData.level === lvl 
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20' 
                      : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-blue-300'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Section 2: Detailed Course Content */}
        <div className="space-y-4 pt-2">
          <h3 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-700/60 pb-3">
            <AlignLeft size={16} className="text-indigo-600" />
            المحتوى والمخرجات التدريبية
          </h3>

          <div>
            <label className={labelClass}>وصف وتفاصيل الدورة *</label>
            <textarea
              className={`${inputClass} min-h-[120px] resize-none leading-relaxed ${formErrors.description ? 'border-red-400' : ''}`}
              placeholder="اكتب نبذة مفصلة عن مواضيع الدورة وما ستتضمنه من محاور وتطبيقات عملية..."
              value={formData.description}
              onChange={e => handleFieldChange('description', 'وصف الدورة', e.target.value)}
              rows={4}
              maxLength={3000}
            />
            {formErrors.description && <p className="text-[11px] font-bold text-red-500 mt-1">{formErrors.description}</p>}
          </div>

          <div>
            <label className={labelClass}><Award size={11} className="text-emerald-500" /> ماذا سيتعلم الطالب؟ (أهم المخرجات والمهارات)</label>
            <textarea
              className={`${inputClass} min-h-[100px] resize-none leading-relaxed`}
              placeholder="مثال: إتقان بناء الأنظمة الكاملة، التعامل مع قواعد البيانات، العمل الجماعي..."
              value={formData.outcomes}
              onChange={e => setFormData({ ...formData, outcomes: e.target.value })}
              rows={3}
              maxLength={2000}
            />
          </div>

          <div>
            <label className={labelClass}><CheckCircle size={11} className="text-amber-500" /> المتطلبات المسبقة للالتحاق</label>
            <textarea
              className={`${inputClass} min-h-[90px] resize-none leading-relaxed`}
              placeholder="مثال: معرفة أساسية بمبادئ البرمجة أو الحاسوب..."
              value={formData.requirements}
              onChange={e => setFormData({ ...formData, requirements: e.target.value })}
              rows={3}
              maxLength={2000}
            />
          </div>

          <div>
            <label className={labelClass}><ImageIcon size={11} /> رابط صورة الغلاف (اختياري)</label>
            <input
              className={inputClass}
              placeholder="https://images.unsplash.com/... (إذا ترك فارغاً سيتم استخدام صورة غلاف حسابك)"
              value={formData.image_url}
              onChange={e => setFormData({ ...formData, image_url: e.target.value })}
            />
          </div>
        </div>

        {/* Section 3: Status Toggle */}
        <div className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700">
          <div>
            <p className="text-xs md:text-sm font-black text-slate-800 dark:text-white">حالة التسجيل في الدورة</p>
            <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 mt-0.5">
              {formData.is_active ? 'مفتوح للتقديم — يستطيع المهتمون التسجيل فوراً' : 'مغلق مؤقتاً — لن يستقبل طلبات جديدة'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
            className={`relative w-14 h-7 rounded-full transition-all duration-300 shadow-inner cursor-pointer ${formData.is_active ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}
          >
            <span className={`absolute top-1 w-5 h-5 bg-white dark:bg-slate-200 rounded-full shadow-md transition-all duration-300 flex items-center justify-center ${formData.is_active ? 'right-1 translate-x-7' : 'right-1'}`}>
              {formData.is_active ? <CheckCircle size={10} className="text-emerald-500" /> : <XCircle size={10} className="text-slate-400" />}
            </span>
          </button>
        </div>

        {/* Submit Actions Button */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-3.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-2xl text-xs font-black transition-all cursor-pointer"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={!isValid || isPosting}
            className={`w-full sm:w-auto px-8 py-3.5 rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer ${
              isValid && !isPosting
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25 active:scale-95'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed shadow-none'
            }`}
          >
            {isPosting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>جاري الحفظ والنشر...</span>
              </>
            ) : (
              <>
                <Send size={15} />
                <span>{isEditing ? 'حفظ تعديلات الدورة' : 'نشر الدورة التدريبية الآن 🚀'}</span>
              </>
            )}
          </button>
        </div>

      </div>

    </div>
  );
};
