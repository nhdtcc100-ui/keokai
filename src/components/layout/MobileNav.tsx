import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Home, Briefcase, Plus, Globe, MessageSquare, Users, MoreHorizontal, Info, LogOut, Shield, Sparkles, Phone, Building2, Moon, Sun, Briefcase as MissionIcon } from 'lucide-react';
import { MobileNavItem, DrawerItem } from './';
import { AppUser } from '../../types';
import { useAppContext } from '../../contexts/AppContext';

interface MobileNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  showMobileMenu: boolean;
  setShowMobileMenu: (show: boolean) => void;
  setShowPostFormGlobal: (show: boolean) => void;
  appUser: AppUser | null;
  setSelectedProfile: (user: AppUser | null) => void;
  notifications: any[];
  toggleProRank: () => void;
  logout: () => void;
  setShowAdmin: (show: boolean) => void;
  theme?: 'light' | 'dark';
  toggleTheme?: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  activeTab,
  setActiveTab,
  showMobileMenu,
  setShowMobileMenu,
  setShowPostFormGlobal,
  appUser,
  setSelectedProfile,
  notifications,
  toggleProRank,
  logout,
  setShowAdmin,
  theme,
  toggleTheme
}) => {
  const { posts, connections, unreadMessagesCount, pendingRequestsCount } = useAppContext();

  // 📊 Task Manager stats for Mobile View
  const userPosts = posts.filter(p => p.authorId === appUser?.id);
  const totalLikes = userPosts.reduce((acc, p) => acc + (p.likesCount || 0), 0);
  const totalInteractions = totalLikes + userPosts.length;
  const userConnectionsCount = connections.filter(c => 
    c.status === 'accepted' && (c.requesterId === appUser?.id || c.recipientId === appUser?.id)
  ).length;
  const signalViews = userConnectionsCount * 7 + userPosts.length * 15;

  return (
    <>
      {/* ── Bottom Mobile Nav Bar ── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-[60] bg-white/95 dark:bg-[#020817]/95 backdrop-blur-2xl border-t border-slate-100 dark:border-slate-800/80 flex items-center px-3 py-2.5 shadow-[0_-8px_30px_rgb(0,0,0,0.08)] justify-around pb-safe overflow-visible">
        {/* الرئيسية - أزرق احترافي */}
        <MobileNavItem
          icon={<Home size={20} />}
          label="الرئيسية"
          active={activeTab === 'home'}
          onClick={() => setActiveTab('home')}
          activeColor="text-blue-600 dark:text-blue-400"
          activeBg="bg-blue-50 dark:bg-blue-950/70"
          indicatorColor="bg-blue-600 dark:bg-blue-400"
        />

        {/* الوظائف - نيلي/بنفسجي */}
        <MobileNavItem
          icon={<Briefcase size={20} />}
          label="الوظائف"
          active={activeTab === 'jobs'}
          onClick={() => setActiveTab('jobs')}
          activeColor="text-indigo-600 dark:text-indigo-400"
          activeBg="bg-indigo-50 dark:bg-indigo-950/70"
          indicatorColor="bg-indigo-600 dark:bg-indigo-400"
        />

        {/* الأخبار - زمردي فاقع */}
        <MobileNavItem
          icon={<Globe size={20} />}
          label="الأخبار"
          active={activeTab === 'news'}
          onClick={() => setActiveTab('news')}
          activeColor="text-emerald-600 dark:text-emerald-400"
          activeBg="bg-emerald-50 dark:bg-emerald-950/70"
          indicatorColor="bg-emerald-600 dark:bg-emerald-400"
        />

        {/* الرسائل - كهرماني ذهبي */}
        <div className="relative overflow-visible z-20">
          <MobileNavItem
            icon={<MessageSquare size={20} />}
            label="الرسائل"
            active={activeTab === 'messages'}
            onClick={() => setActiveTab('messages')}
            activeColor="text-amber-600 dark:text-amber-400"
            activeBg="bg-amber-50 dark:bg-amber-950/70"
            indicatorColor="bg-amber-500 dark:bg-amber-400"
          />
          {unreadMessagesCount > 0 && (
            <span className="absolute -top-1.5 right-1 z-30 min-w-[18px] h-[18px] px-1 bg-red-600 text-white font-black text-[9px] rounded-full animate-bounce pointer-events-none flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-lg">
              {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
            </span>
          )}
        </div>

        {/* المزيد - بنفسجي غامق */}
        <MobileNavItem
          icon={<MoreHorizontal size={20} />}
          label="المزيد"
          active={showMobileMenu}
          onClick={() => setShowMobileMenu(true)}
          activeColor="text-violet-600 dark:text-violet-400"
          activeBg="bg-violet-50 dark:bg-violet-950/70"
          indicatorColor="bg-violet-600 dark:bg-violet-400"
        />
      </div>

      {/* --- Mobile Side Drawer --- */}
      <AnimatePresence>
        {showMobileMenu && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowMobileMenu(false)} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed top-0 right-0 bottom-0 w-4/5 max-w-sm bg-white dark:bg-slate-900 z-[110] shadow-2xl flex flex-col" dir="rtl">
              {/* Header */}
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-l from-blue-50/60 dark:from-blue-900/20 to-transparent">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setSelectedProfile(appUser); setActiveTab('profile'); setShowMobileMenu(false); }}>
                   {appUser?.avatar && <img src={appUser.avatar} className="w-12 h-12 rounded-2xl border-2 border-blue-200 dark:border-blue-800 shadow-md cursor-pointer" />}
                   <div className="cursor-pointer">
                      <p className="font-black text-slate-800 dark:text-white text-sm">{appUser?.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <p className="text-[10px] text-blue-600 dark:text-blue-400 font-black uppercase">
                          {appUser?.role === 'employer' ? 'مدير مهام @ المقر' : 'عميل ميداني نخبة'}
                        </p>
                      </div>
                   </div>
                </div>
                <button onClick={() => setShowMobileMenu(false)} className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl hover:bg-red-50 hover:text-red-500 transition-colors"><Plus size={20} className="rotate-45" /></button>
              </div>

              {/* Stats Card */}
              <div className="mx-4 mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl border border-blue-100 dark:border-blue-800/30 flex justify-around items-center">
                <div className="text-center">
                  <p className="text-[9px] font-black text-blue-400 uppercase">مشاهدات الإشارة</p>
                  <p className="text-sm font-black text-blue-600 dark:text-blue-400">{signalViews}</p>
                </div>
                <div className="h-6 w-px bg-blue-200 dark:bg-blue-700" />
                <div className="text-center">
                  <p className="text-[9px] font-black text-indigo-400 uppercase">التفاعلات</p>
                  <p className="text-sm font-black text-indigo-600 dark:text-indigo-400">{totalInteractions}</p>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {appUser?.isAdmin && (
                  <DrawerItem icon={<Phone size={20} className="text-emerald-500" />} label="المكالمات والاتصال" onClick={() => { setActiveTab('calls'); setShowMobileMenu(false); }} color="text-emerald-700 dark:text-emerald-300" />
                )}
                <div className="relative">
                  <DrawerItem icon={<Users size={20} className="text-violet-500" />} label="شبكتي المهنية" onClick={() => { setActiveTab('network'); setShowMobileMenu(false); }} color="text-violet-700 dark:text-violet-300" />
                  {pendingRequestsCount > 0 && (
                    <span className="absolute top-3 left-4 px-2 py-0.5 bg-red-600 text-white font-black text-[9px] rounded-full shadow-md">
                      {pendingRequestsCount > 9 ? '9+' : pendingRequestsCount} جديد
                    </span>
                  )}
                </div>
                {appUser?.isAdmin && (
                  <DrawerItem icon={<Building2 size={20} className="text-blue-500" />} label="نظام الموارد البشرية (ERP)" onClick={() => { setActiveTab('erp'); setShowMobileMenu(false); }} color="text-blue-700 dark:text-blue-300" />
                )}
                <DrawerItem icon={<Globe size={20} className="text-emerald-500" />} label="آخر الأخبار" onClick={() => { setActiveTab('news'); setShowMobileMenu(false); }} color="text-emerald-700 dark:text-emerald-300" />

                {appUser?.isAdmin && (
                  <DrawerItem icon={<Shield size={20} className="text-red-500" />} label="لوحة التحكم العليا" onClick={() => { setShowAdmin(true); setShowMobileMenu(false); }} color="text-red-700 dark:text-red-300" />
                )}
                <DrawerItem icon={<Info size={20} className="text-amber-500" />} label="عن منصة عمل أولاً" onClick={() => { setActiveTab('about'); setShowMobileMenu(false); }} color="text-amber-700 dark:text-amber-300" />
                {toggleTheme && (
                  <DrawerItem 
                    icon={theme === 'dark' ? <Sun size={20} className="text-amber-500" /> : <Moon size={20} className="text-indigo-500" />} 
                    label={theme === 'dark' ? 'الوضع الفاتح ☀️' : 'الوضع الليلي 🌙'} 
                    onClick={() => { toggleTheme(); setShowMobileMenu(false); }}
                    color={theme === 'dark' ? 'text-amber-700 dark:text-amber-300' : 'text-indigo-700 dark:text-indigo-300'}
                  />
                )}
                <DrawerItem icon={<LogOut size={20} className="text-red-500" />} label="تسجيل الخروج" onClick={() => { setShowMobileMenu(false); logout(); }} color="text-red-700 dark:text-red-300" />
              </div>


              <div className="p-6 bg-slate-50 dark:bg-slate-800/40 text-center">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">منصة عمل أولاً • إصدار 2.6.0</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
