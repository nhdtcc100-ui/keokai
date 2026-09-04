import React from 'react';
import { Shield, Rocket, ShieldCheck, FileText, Settings, Info, HeartHandshake, Briefcase, Eye, Activity, Crown } from 'lucide-react';
import { GlassCard } from '../ui';
import { AppUser } from '../../types';
import { useAppContext } from '../../contexts/AppContext';
import { AboutPlatformModal } from './AboutPlatformModal';

async function checkBiometricSupport(): Promise<{ supported: boolean; error: string | null }> {
  if (!window.isSecureContext) {
    return { supported: false, error: '❌ تفعيل البصمة يتطلب اتصالاً آمناً (HTTPS) أو العمل على localhost.' };
  }
  if (!window.PublicKeyCredential) {
    return { supported: false, error: '⚠️ هذا المتصفح لا يدعم تقنية تسجيل البصمة.' };
  }
  try {
    const isHardwareAvailable = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    if (!isHardwareAvailable) {
      return { supported: false, error: '❌ هذا الجهاز لا يدعم تقنية البصمة الحيوية.' };
    }
    return { supported: true, error: null };
  } catch (e) {
    return { supported: false, error: 'فشل فحص دعم البصمة في هذا الجهاز.' };
  }
}

interface IntelligenceCenterProps {
  addToast: (msg: string, type?: 'success' | 'error') => void;
  setShowAdmin?: (show: boolean) => void;
  appUser?: AppUser | null;
  setSelectedProfile?: (user: AppUser | null) => void;
}

export const IntelligenceCenter: React.FC<IntelligenceCenterProps> = ({ 
  addToast, 
  setShowAdmin,
  appUser: propUser,
  setSelectedProfile
}) => {
  const { appUser: contextUser, posts, connections } = useAppContext();
  const appUser = propUser || contextUser;
  const [showAbout, setShowAbout] = React.useState(false);

  // 📊 Dynamic stats calculation
  const userPosts = posts.filter(p => p.authorId === appUser?.id);
  const totalLikes = userPosts.reduce((acc, p) => acc + (p.likesCount || 0), 0);
  const totalInteractions = totalLikes + userPosts.length;
  const userConnectionsCount = connections.filter(c => 
    c.status === 'accepted' && (c.requesterId === appUser?.id || c.recipientId === appUser?.id)
  ).length;
  const signalViews = userConnectionsCount * 7 + userPosts.length * 15;

  return (
    <div className="lg:col-span-3 space-y-4 mb-10 md:mb-0 hidden md:block">
      <div className="sticky top-20 space-y-4">
        {/* ── Task Manager Card ── */}
        <GlassCard className="card-3d rounded-[2.5rem] p-6 border-none shadow-2xl bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl group border border-white/20 dark:border-slate-800">
          <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
                  <Briefcase size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-800 dark:text-white">مدير المهام</h4>
                  <p className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mt-0.5">لوحة التحكم والمتابعة الميدانية</p>
                </div>
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-sm shadow-emerald-500/50" />
            </div>

            {/* Profile Quick Summary */}
            <div 
              onClick={() => appUser && setSelectedProfile?.(appUser)}
              className="flex items-center gap-3.5 p-3.5 bg-slate-50/70 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50 cursor-pointer hover:bg-blue-50/50 dark:hover:bg-slate-800 transition-all group/prof"
            >
              <img 
                src={appUser?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(appUser?.name || 'User')}&background=random`}
                className="w-11 h-11 rounded-2xl border-2 border-white dark:border-slate-700 shadow-md object-cover"
                alt=""
              />
              <div className="min-w-0 flex-1">
                <p className="font-black text-xs text-slate-800 dark:text-white truncate group-hover/prof:text-blue-600 transition-colors">{appUser?.name}</p>
                <p className="text-[10px] font-black text-slate-400 uppercase mt-0.5">
                  {appUser?.role === 'employer' ? 'مدير مهام @ المقر' : 'عميل ميداني نخبة'}
                </p>
              </div>
            </div>

            {/* Live Stats */}
            <div className="grid grid-cols-2 gap-2 p-3 bg-blue-50/40 dark:bg-blue-950/20 rounded-2xl border border-blue-100/40 dark:border-blue-900/30">
              <div className="p-2.5 text-center">
                <div className="flex items-center justify-center gap-1 text-slate-400 mb-1">
                  <Eye size={12} />
                  <span className="text-[9px] font-black uppercase">الإشارات</span>
                </div>
                <span className="text-base font-black text-blue-600 dark:text-blue-400">{signalViews}</span>
              </div>
              <div className="p-2.5 text-center border-r border-blue-100 dark:border-blue-900/40">
                <div className="flex items-center justify-center gap-1 text-slate-400 mb-1">
                  <Activity size={12} />
                  <span className="text-[9px] font-black uppercase">التفاعلات</span>
                </div>
                <span className="text-base font-black text-blue-600 dark:text-blue-400">{totalInteractions}</span>
              </div>
            </div>

            {/* ── Super Admin Button (ONLY FOR ADMINS -> Opens Admin Dashboard) ── */}
            {appUser?.isAdmin && (
              <button 
                onClick={() => setShowAdmin?.(true)}
                className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 text-white rounded-2xl shadow-xl shadow-blue-600/25 hover:scale-[1.02] active:scale-95 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20">
                    <Shield size={18} className="text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black uppercase tracking-tight">لوحة التحكم العليا</p>
                    <p className="text-[9px] font-bold text-blue-100 opacity-90">الانتقال للـ Dashboard الرئيسي</p>
                  </div>
                </div>
                <Rocket size={16} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </button>
            )}

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800/60 text-center">
              <p className="text-[9px] text-slate-400 font-black tracking-widest uppercase">منصة عمل • 2026</p>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
