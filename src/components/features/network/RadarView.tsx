/**
 * RadarView.tsx
 * ──────────────────────────────────────────────────────────────────
 * رادار دائري لاكتشاف الأشخاص بنفس المسمى الوظيفي + المدينة
 * يعمل على مستوى DB (Supabase parameterized queries — آمن)
 * يعرض seeker و employer معاً
 * ──────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, RefreshCw, UserX, Briefcase, MapPin, Star } from 'lucide-react';
import { profileService, type CandidateRow } from '../../../lib/services/profileService';
import type { AppUser } from '../../../types';

interface RadarViewProps {
  appUser: AppUser;
  onUserClick: (user: CandidateRow) => void;
}

// ── حساب موضع كل شخص على المحيط الدائري ────────────────────────────────────
function polarToXY(angleRad: number, radius: number, cx: number, cy: number) {
  return {
    x: cx + radius * Math.cos(angleRad),
    y: cy + radius * Math.sin(angleRad),
  };
}

// ── بطاقة الشخص على الرادار ────────────────────────────────────────────────
const RadarUser: React.FC<{
  candidate: CandidateRow;
  x: number;
  y: number;
  index: number;
  onClick: (c: CandidateRow) => void;
}> = ({ candidate, x, y, index, onClick }) => {
  const avatarFallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(candidate.name)}&background=0a66c2&color=fff&size=80`;
  const [showTip, setShowTip] = useState(false);

  return (
    <motion.g
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.08 + 0.3, type: 'spring', stiffness: 200 }}
      className="cursor-pointer"
      onClick={() => onClick(candidate)}
      onMouseEnter={() => setShowTip(true)}
      onMouseLeave={() => setShowTip(false)}
    >
      {/* خط رابط من المركز */}
      <line
        x1="50%" y1="50%"
        x2={x} y2={y}
        stroke="#3b82f6"
        strokeWidth="0.5"
        strokeDasharray="3 4"
        strokeOpacity="0.25"
      />

      {/* الصورة الدائرية */}
      <clipPath id={`clip-${candidate.id}`}>
        <circle cx={x} cy={y} r="22" />
      </clipPath>
      <image
        href={candidate.avatar_url || avatarFallback}
        x={x - 22} y={y - 22}
        width={44} height={44}
        clipPath={`url(#clip-${candidate.id})`}
        preserveAspectRatio="xMidYMid slice"
      />
      {/* حلقة خارجية */}
      <circle
        cx={x} cy={y} r="23"
        fill="none"
        stroke={candidate.is_pro ? '#f59e0b' : '#3b82f6'}
        strokeWidth="2"
        strokeOpacity="0.8"
      />
      {/* شارة Pro */}
      {candidate.is_pro && (
        <circle cx={x + 14} cy={y - 14} r="7" fill="#f59e0b" />
      )}

      {/* Tooltip */}
      <AnimatePresence>
        {showTip && (
          <foreignObject
            x={x - 80} y={y - 72}
            width={160} height={70}
            style={{ overflow: 'visible', pointerEvents: 'none' }}
          >
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              style={{
                background: 'rgba(15,23,42,0.92)',
                backdropFilter: 'blur(8px)',
                borderRadius: '12px',
                padding: '8px 10px',
                fontSize: '10px',
                fontWeight: 900,
                color: 'white',
                border: '1px solid rgba(99,102,241,0.3)',
                textAlign: 'center',
                direction: 'rtl',
                lineHeight: 1.4,
              }}
            >
              <p style={{ fontSize: '11px', marginBottom: 2 }}>{candidate.name}</p>
              <p style={{ color: '#60a5fa', fontSize: '9px' }}>{candidate.title}</p>
              {candidate.location && (
                <p style={{ color: '#94a3b8', fontSize: '9px' }}>📍 {candidate.location}</p>
              )}
            </motion.div>
          </foreignObject>
        )}
      </AnimatePresence>
    </motion.g>
  );
};

// ── المكوّن الرئيسي ────────────────────────────────────────────────────────
export const RadarView: React.FC<RadarViewProps> = ({ appUser, onUserClick }) => {
  const [people, setPeople] = useState<CandidateRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState<string | null>(null);
  const [sweep, setSweep]   = useState(0); // زاوية دوران الرادار

  const load = useCallback(async () => {
    const title    = appUser.title || (appUser as any).industry || '';
    const location = appUser.location || '';
    if (!title && !location) { setPeople([]); return; }

    setLoading(true);
    setError(null);
    const { data, error: err } = await profileService.fetchSimilarProfiles(
      title, location, appUser.id, 12
    );
    setLoading(false);
    if (err) { setError(err); return; }
    setPeople(data);
  }, [appUser.id, appUser.title, appUser.location]);

  useEffect(() => { load(); }, [load]);

  // دوران خط الرادار
  useEffect(() => {
    const timer = setInterval(() => setSweep(s => (s + 1.5) % 360), 50);
    return () => clearInterval(timer);
  }, []);

  // حساب مواضع الأشخاص على المحيط
  const SIZE   = 420;
  const CX     = SIZE / 2;
  const CY     = SIZE / 2;
  const RINGS  = [80, 140, 190]; // نصف قطر الحلقات
  const RADAR_R = 200;

  const positioned = people.map((p, i) => {
    const angle = (i / people.length) * 2 * Math.PI - Math.PI / 2;
    const ring  = RINGS[i % RINGS.length];
    const { x, y } = polarToXY(angle, ring, CX, CY);
    return { ...p, x, y };
  });

  const hasData = !loading && (appUser.title || appUser.location);

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      {/* ─── Header ─── */}
      <div className="text-center">
        <h3 className="text-sm font-black text-slate-800 dark:text-white">الرادار المهني</h3>
        <p className="text-[10px] font-bold text-slate-400 mt-1">
          أشخاص بنفس مسماك الوظيفي في {appUser.location || 'نفس المنطقة'}
        </p>
      </div>

      {/* ─── SVG Radar ─── */}
      <div className="relative" style={{ width: SIZE, height: SIZE, maxWidth: '100%' }}>
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="w-full h-auto"
          style={{ maxWidth: 420 }}
        >
          {/* حلقات الرادار */}
          {RINGS.map((r, i) => (
            <circle key={r} cx={CX} cy={CY} r={r}
              fill="none"
              stroke="#3b82f6"
              strokeWidth={i === RINGS.length - 1 ? 1.5 : 0.7}
              strokeOpacity={0.15 + i * 0.05}
              strokeDasharray={i < RINGS.length - 1 ? '4 6' : undefined}
            />
          ))}
          {/* الحلقة الخارجية */}
          <circle cx={CX} cy={CY} r={RADAR_R} fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeOpacity="0.25" />

          {/* خطوط الشبكة */}
          {[0, 45, 90, 135].map(deg => {
            const rad = (deg * Math.PI) / 180;
            return (
              <line key={deg}
                x1={CX + RADAR_R * Math.cos(rad)} y1={CY + RADAR_R * Math.sin(rad)}
                x2={CX - RADAR_R * Math.cos(rad)} y2={CY - RADAR_R * Math.sin(rad)}
                stroke="#3b82f6" strokeWidth="0.5" strokeOpacity="0.1"
              />
            );
          })}

          {/* خط المسح الدوار */}
          <line
            x1={CX} y1={CY}
            x2={CX + RADAR_R * Math.cos((sweep * Math.PI) / 180)}
            y2={CY + RADAR_R * Math.sin((sweep * Math.PI) / 180)}
            stroke="#3b82f6" strokeWidth="2" strokeOpacity="0.5"
            style={{ filter: 'drop-shadow(0 0 6px #3b82f6)' }}
          />
          {/* تأثير التلاشي خلف الخط */}
          <path
            d={`M ${CX} ${CY} L ${CX + RADAR_R * Math.cos(((sweep - 60) * Math.PI) / 180)} ${CY + RADAR_R * Math.sin(((sweep - 60) * Math.PI) / 180)} A ${RADAR_R} ${RADAR_R} 0 0 1 ${CX + RADAR_R * Math.cos((sweep * Math.PI) / 180)} ${CY + RADAR_R * Math.sin((sweep * Math.PI) / 180)} Z`}
            fill="url(#radarGrad)"
            fillOpacity="0.08"
          />
          <defs>
            <radialGradient id="radarGrad">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* المستخدم في المنتصف */}
          <clipPath id="clip-me">
            <circle cx={CX} cy={CY} r="28" />
          </clipPath>
          <image
            href={appUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(appUser.name)}&background=0a66c2&color=fff&size=80`}
            x={CX - 28} y={CY - 28}
            width={56} height={56}
            clipPath="url(#clip-me)"
            preserveAspectRatio="xMidYMid slice"
          />
          <circle cx={CX} cy={CY} r="30" fill="none" stroke="#0a66c2" strokeWidth="3" />
          {/* نقطة نابضة */}
          <circle cx={CX} cy={CY} r="34" fill="none" stroke="#0a66c2" strokeWidth="1.5" strokeOpacity="0.4">
            <animate attributeName="r" values="30;40;30" dur="2s" repeatCount="indefinite" />
            <animate attributeName="stroke-opacity" values="0.4;0;0.4" dur="2s" repeatCount="indefinite" />
          </circle>

          {/* الأشخاص على المحيط */}
          {!loading && positioned.map((p, i) => (
            <RadarUser key={p.id} candidate={p} x={p.x} y={p.y} index={i} onClick={onUserClick} />
          ))}
        </svg>

        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 size={24} className="text-blue-500 animate-spin" />
              <p className="text-[10px] font-bold text-slate-400">جاري المسح الرادار...</p>
            </div>
          </div>
        )}
      </div>

      {/* ─── نتائج / حالات ─── */}
      {!loading && people.length === 0 && hasData && (
        <div className="text-center py-4">
          <UserX size={28} className="text-slate-300 mx-auto mb-2" />
          <p className="text-[11px] font-bold text-slate-400">
            لم يعثر الرادار على أحد بنفس مسماك في هذه المنطقة
          </p>
        </div>
      )}

      {!loading && !hasData && (
        <div className="text-center py-4 px-6 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-100 dark:border-amber-800/30">
          <p className="text-[11px] font-bold text-amber-700 dark:text-amber-400">
            أضف مسماك الوظيفي وموقعك في ملفك الشخصي حتى يعمل الرادار
          </p>
        </div>
      )}

      {/* قائمة أسماء */}
      {!loading && people.length > 0 && (
        <div className="w-full max-w-sm">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center mb-3">
            {people.length} شخص مكتشَف
          </p>
          <div className="grid grid-cols-2 gap-2">
            {people.slice(0, 6).map(p => (
              <button
                key={p.id}
                onClick={() => onUserClick(p)}
                className="flex items-center gap-2 p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-blue-300 transition-all text-right"
              >
                <img
                  src={p.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=0a66c2&color=fff&size=40`}
                  className="w-8 h-8 rounded-lg object-cover shrink-0"
                  alt={p.name}
                  onError={e => { (e.currentTarget as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=0a66c2&color=fff`; }}
                />
                <div className="min-w-0">
                  <p className="text-[10px] font-black text-slate-800 dark:text-white truncate">{p.name}</p>
                  <p className="text-[8px] text-blue-500 font-bold truncate">{p.title}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* زر تحديث */}
      <button
        onClick={load}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 text-[10px] font-black text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all disabled:opacity-40"
      >
        <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
        تحديث الرادار
      </button>
    </div>
  );
};
