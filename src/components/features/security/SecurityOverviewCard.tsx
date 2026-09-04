import React from 'react';
import { motion } from 'motion/react';
import { ShieldAlert, Ban, UserX, TrendingUp } from 'lucide-react';
import { threatEngine } from '../../../lib/security/threatEngine';

interface SecurityOverviewCardProps {
  onRefresh: () => void;
}

export const SecurityOverviewCard: React.FC<SecurityOverviewCardProps> = ({ onRefresh }) => {
  const [todayCount, setTodayCount] = React.useState(() => threatEngine.getTodayCount());
  const [criticalCount, setCriticalCount] = React.useState(() => threatEngine.getCriticalCount());
  const [blockedIPs, setBlockedIPs] = React.useState(() => threatEngine.getBlockedIPs());
  const [topActor, setTopActor] = React.useState(() => threatEngine.getTopActor());

  const refreshData = React.useCallback(() => {
    setTodayCount(threatEngine.getTodayCount());
    setCriticalCount(threatEngine.getCriticalCount());
    setBlockedIPs(threatEngine.getBlockedIPs());
    setTopActor(threatEngine.getTopActor());
  }, []);

  React.useEffect(() => {
    refreshData();
    window.addEventListener('SECURITY_ALERT', refreshData);
    window.addEventListener('storage', refreshData);
    return () => {
      window.removeEventListener('SECURITY_ALERT', refreshData);
      window.removeEventListener('storage', refreshData);
    };
  }, [refreshData]);

  const cards = [
    {
      label: 'إجمالي التهديدات اليوم',
      value: todayCount,
      sub: `${criticalCount} حرجة`,
      icon: <ShieldAlert size={22} />,
      gradient: 'from-red-600 to-rose-700',
      glow: 'shadow-red-600/25',
      ring: 'border-red-500/30',
      pulse: todayCount > 0,
    },
    {
      label: 'عناوين IP المحظورة',
      value: blockedIPs.length,
      sub: 'نشطة حالياً',
      icon: <Ban size={22} />,
      gradient: 'from-orange-600 to-amber-700',
      glow: 'shadow-orange-600/25',
      ring: 'border-orange-500/30',
      pulse: false,
    },
    {
      label: 'أخطر مستخدم مشبوه',
      value: topActor ? topActor.count : 0,
      sub: topActor ? topActor.identifier : 'لا يوجد',
      icon: <UserX size={22} />,
      gradient: 'from-violet-600 to-purple-700',
      glow: 'shadow-violet-600/25',
      ring: 'border-violet-500/30',
      pulse: false,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
          onClick={onRefresh}
          className={`relative overflow-hidden bg-slate-800/40 border ${card.ring} rounded-[2rem] p-7 flex flex-col items-center text-center group hover:border-opacity-60 transition-all shadow-2xl backdrop-blur-xl cursor-pointer`}
        >
          {/* BG gradient hover glow */}
          <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-[0.04] transition-opacity rounded-[2rem]`} />

          {/* Icon */}
          <div className={`relative w-16 h-16 rounded-[1.5rem] bg-gradient-to-br ${card.gradient} flex items-center justify-center text-white mb-4 shadow-2xl ${card.glow} scale-100 group-hover:scale-110 transition-transform duration-500`}>
            {card.icon}
            {card.pulse && (
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 animate-ping" />
            )}
          </div>

          {/* Value */}
          <p className="text-4xl font-black text-white tracking-tighter mb-1">
            {card.value.toLocaleString('ar-EG')}
          </p>

          {/* Label */}
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 group-hover:text-white transition-colors">
            {card.label}
          </p>

          {/* Sub */}
          <p className={`text-[9px] font-bold max-w-[120px] truncate bg-gradient-to-r ${card.gradient} bg-clip-text text-transparent`}>
            {card.sub}
          </p>

          {/* Decorative corner */}
          <div className={`absolute bottom-0 right-0 w-20 h-20 rounded-full bg-gradient-to-br ${card.gradient} opacity-5 blur-2xl`} />
        </motion.div>
      ))}

      {/* Trend mini card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.28 }}
        className="md:col-span-3 relative overflow-hidden bg-slate-800/30 border border-emerald-500/20 rounded-[2rem] p-5 flex items-center gap-4 shadow-xl backdrop-blur-xl"
      >
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-lg shadow-emerald-900/30 flex-shrink-0">
          <TrendingUp size={18} />
        </div>
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">حالة محرك الكشف</p>
          <div className="flex items-center gap-3 mt-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-xs font-black text-emerald-400">نشط — يراقب الأنماط في الوقت الفعلي</p>
          </div>
        </div>
        <div className="mr-auto text-left">
          <p className="text-[9px] font-bold text-slate-500 uppercase">نمط XSS • Brute Force • SQLi • Rate Limiting</p>
        </div>
      </motion.div>
    </div>
  );
};

