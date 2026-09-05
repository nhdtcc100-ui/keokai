import React from 'react';
import { motion } from 'motion/react';
import { 
  Briefcase, 
  GraduationCap, 
  Star, 
  Globe, 
  Phone, 
  MapPin, 
  Link2, 
  User, 
  Award,
  Calendar,
  Building2,
  CheckCircle2
} from 'lucide-react';
import { GlassCard } from '../../ui';

interface ProfileActivityViewProps {
  profile: any;
}

const hasContent = (val: any) => {
  if (!val) return false;
  if (typeof val === 'string' && (val.trim() === '' || val.trim() === '[]')) return false;
  if (Array.isArray(val) && val.length === 0) return false;
  return true;
};

export const ProfileActivityView: React.FC<ProfileActivityViewProps> = ({ profile }) => {
  return (
    <motion.div
      key="activity"
      initial={{ opacity: 0, x: 20 }} 
      animate={{ opacity: 1, x: 0 }} 
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8 w-full pb-20"
    >
      {/* ─── Professional Summary Section ─────────────────────────────────────────── */}
      <GlassCard className="p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/80 shadow-sm relative overflow-hidden group profile-card-section">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 dark:bg-blue-950/20 rounded-bl-[5rem] -z-10 transition-transform group-hover:scale-110" />
        
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300 flex items-center justify-center shrink-0 shadow-sm">
            <User size={22} />
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">الملخص المهني</h4>
            <p className="text-[9px] text-slate-400 dark:text-slate-400 font-bold uppercase tracking-widest">Professional Summary</p>
          </div>
        </div>
        
        <div className="relative">
          <p className="text-sm text-slate-700 dark:text-slate-100 leading-loose whitespace-pre-wrap font-medium">
            {profile.bio || "لم يتم إضافة نبذة مهنية بعد. الملفات الشخصية المكتملة تحصل على فرص عمل أكثر بنسبة 40%."}
          </p>
        </div>

        {/* Contact Strip */}
        <div className="flex flex-wrap gap-3 mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
          {profile.location && (
            <span className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-[10px] font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
              <MapPin size={12} className="text-blue-500" /> {profile.location}
            </span>
          )}
          {profile.phone && (
            <span className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-[10px] font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
              <Phone size={12} className="text-emerald-500" /> {profile.phone}
            </span>
          )}
          {profile.website && (
            <a href={profile.website} target="_blank" rel="noopener noreferrer"
               className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 rounded-xl text-[10px] font-bold text-blue-600 dark:text-blue-300 border border-blue-100 dark:border-blue-800 hover:bg-blue-100 transition-all">
              <Globe size={12} /> {profile.website.replace(/^https?:\/\//, '')}
            </a>
          )}
        </div>
      </GlassCard>

      {/* ─── Stacked Sections: Experience, Skills, Education, Accomplishments ─── */}
      <div className="flex flex-col space-y-8 w-full">
        {/* ─── Experience Section ────────────────── */}
        <GlassCard className="p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/80 shadow-sm profile-card-section">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 flex items-center justify-center shrink-0">
              <Briefcase size={22} />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">الخبرة المهنية</h4>
              <p className="text-[9px] text-slate-400 dark:text-slate-400 font-bold uppercase tracking-widest">Work Experience</p>
            </div>
          </div>

          {hasContent(profile.experience) ? (
            <div className="space-y-8 relative before:absolute before:right-[23px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100 dark:before:bg-slate-800">
              <div className="relative pr-10">
                <div className="absolute right-0 top-1 w-[46px] h-[46px] -mr-[23px] bg-white dark:bg-slate-900 border-4 border-slate-100 dark:border-slate-800 rounded-full flex items-center justify-center z-10">
                  <div className="w-2.5 h-2.5 bg-blue-500 rounded-full shadow-sm shadow-blue-500/50" />
                </div>
                <div className="bg-slate-50/80 dark:bg-slate-800/80 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700 group hover:border-blue-300 dark:hover:border-blue-600 transition-all">
                  <p className="text-sm text-slate-800 dark:text-white leading-relaxed whitespace-pre-wrap font-medium">
                    {profile.experience}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 px-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem]">
              <p className="text-xs text-slate-400 dark:text-slate-400 font-bold">لا توجد خبرات مهنية مضافة.</p>
            </div>
          )}
        </GlassCard>

        {/* ─── Skills Section ────────────────── */}
        <GlassCard className="p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900/80 profile-card-section">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300 flex items-center justify-center shrink-0">
              <Star size={22} />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">المهارات والخبرات التقنية</h4>
              <p className="text-[9px] text-slate-400 dark:text-slate-400 font-bold uppercase tracking-widest">Key Skills</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2.5">
            {(profile.skills || []).length > 0 ? profile.skills.map((s: string) => (
              <span key={s} className="px-4 py-2 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white rounded-xl text-xs font-black border border-slate-200 dark:border-slate-700 shadow-sm hover:border-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-400 transition-all cursor-default skill-tag">
                {s}
              </span>
            )) : (
              <p className="text-xs text-slate-400 dark:text-slate-400 font-medium italic">لم يتم تحديد مهارات.</p>
            )}
          </div>
        </GlassCard>

        {/* ─── Education Section ────────────────── */}
        <GlassCard className="p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/80 shadow-sm profile-card-section">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 flex items-center justify-center shrink-0">
              <GraduationCap size={22} />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">التعليم والمؤهلات</h4>
              <p className="text-[9px] text-slate-400 dark:text-slate-400 font-bold uppercase tracking-widest">Academic Background</p>
            </div>
          </div>

          {hasContent(profile.education) ? (
            <div className="bg-slate-50/80 dark:bg-slate-800/80 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700">
              <p className="text-sm text-slate-800 dark:text-white leading-loose whitespace-pre-wrap font-medium">
                {profile.education}
              </p>
            </div>
          ) : (
            <p className="text-xs text-slate-400 dark:text-slate-400 font-medium italic text-center">لم يتم إضافة بيانات تعليمية.</p>
          )}
        </GlassCard>


          {/* Certifications / Accomplishments */}
          <GlassCard className="p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/80 shadow-sm profile-card-section">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-300 flex items-center justify-center shrink-0">
                <Award size={22} />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">الإنجازات</h4>
                <p className="text-[9px] text-slate-400 dark:text-slate-400 font-bold uppercase tracking-widest">Accomplishments</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-800 dark:text-white">عضو موثق في Elevate عراق</p>
                  <p className="text-[9px] text-slate-400 dark:text-slate-400 font-bold uppercase">Identity Verified</p>
                </div>
              </div>
              {profile.is_pro && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
                    <Star size={14} className="text-amber-500" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-800 dark:text-white">عضوية Pro المميزة</p>
                    <p className="text-[9px] text-slate-400 dark:text-slate-400 font-bold uppercase">Premium Professional</p>
                  </div>
                </div>
              )}
            </div>
          </GlassCard>

      </div>
    </motion.div>
  );
};

