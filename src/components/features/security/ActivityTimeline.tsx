import React from 'react';
import { motion } from 'motion/react';
import { Clock, Flame } from 'lucide-react';
import { threatEngine } from '../../../lib/security/threatEngine';

export const ActivityTimeline: React.FC = () => {
  const [hourlyData, setHourlyData] = React.useState(() => threatEngine.getHourlyDistribution());

  const refreshData = React.useCallback(() => {
    setHourlyData(threatEngine.getHourlyDistribution());
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

  const maxCount = Math.max(...hourlyData.map(h => h.count), 1);
  const totalInPeriod = hourlyData.reduce((s, h) => s + h.count, 0);
  const peakHour = hourlyData.reduce((best, h) => h.count > best.count ? h : best, hourlyData[0] || { hour: 0, count: 0, label: '00:00' });

  const BAR_COLORS = (count: number) => {
    const ratio = count / maxCount;
    if (ratio > 0.7) return 'from-red-600 to-rose-500';
    if (ratio > 0.4) return 'from-orange-600 to-amber-500';
    if (ratio > 0.1) return 'from-blue-600 to-indigo-500';
    return 'from-slate-700 to-slate-600';
  };

  // Show every 3rd hour label to avoid crowding
  const showLabel = (h: number) => h % 3 === 0;

  return (
    <div className="bg-slate-800/40 border border-slate-700/50 rounded-[2.5rem] p-8 shadow-2xl backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-sm font-black text-white uppercase tracking-widest">توزيع الهجمات — آخر 24 ساعة</h3>
          <p className="text-[9px] text-slate-500 mt-0.5 uppercase tracking-widest">
            {totalInPeriod} هجوم إجمالاً خلال 24 ساعة
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Clock size={16} className="text-blue-500" />
          {peakHour.count > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-xl">
              <Flame size={11} className="text-red-400" />
              <span className="text-[9px] font-black text-red-400">ذروة: {peakHour.label}</span>
            </div>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="relative h-52">
        {/* Grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="border-t border-slate-700/30 w-full relative">
              <span className="absolute -top-2.5 -right-2 text-[8px] text-slate-600 font-bold">
                {Math.round((maxCount * (4 - i)) / 4)}
              </span>
            </div>
          ))}
        </div>

        {/* Bars */}
        <div className="absolute inset-0 flex items-end gap-[2px] pr-6">
          {hourlyData.map((h) => {
            const heightPct = maxCount > 0 ? (h.count / maxCount) * 100 : 0;
            const isPeak = h.hour === peakHour.hour && h.count > 0;
            return (
              <div
                key={h.hour}
                className="flex-1 flex flex-col items-center justify-end gap-1 group"
                title={`${h.label}: ${h.count} هجمات`}
              >
                {/* Value tooltip on hover */}
                {h.count > 0 && (
                  <span className="text-[7px] font-black text-slate-500 group-hover:text-white transition-colors opacity-0 group-hover:opacity-100 mb-1">
                    {h.count}
                  </span>
                )}
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(heightPct, h.count > 0 ? 4 : 1)}%` }}
                  transition={{ duration: 0.6, delay: h.hour * 0.02, ease: 'easeOut' }}
                  className={`w-full rounded-t-lg bg-gradient-to-t ${BAR_COLORS(h.count)} relative ${isPeak ? 'shadow-lg shadow-red-900/30' : ''} cursor-pointer hover:opacity-90 transition-opacity`}
                >
                  {isPeak && (
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                  )}
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>

      {/* X-axis labels */}
      <div className="flex gap-[2px] pr-6 mt-3">
        {hourlyData.map((h) => (
          <div key={h.hour} className="flex-1 text-center">
            {showLabel(h.hour) && (
              <span className="text-[8px] text-slate-600 font-bold">{h.label.replace(':00', '')}</span>
            )}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 mt-6 pt-5 border-t border-slate-800/60">
        {[
          { color: 'from-red-600 to-rose-500', label: 'شديد الخطورة (>70%)' },
          { color: 'from-orange-600 to-amber-500', label: 'متوسط (40-70%)' },
          { color: 'from-blue-600 to-indigo-500', label: 'منخفض (<40%)' },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded bg-gradient-to-r ${item.color}`} />
            <span className="text-[9px] text-slate-500 font-bold">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

