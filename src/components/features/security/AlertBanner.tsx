import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, X, Zap, User, MapPin, Code2, Layers, Bell } from 'lucide-react';
import { ThreatLog, AttackType, threatEngine } from '../../../lib/security/threatEngine';
import { AppUser } from '../../../types';

interface AlertBannerProps {
  onNavigateToSecurity: () => void;
  appUser?: AppUser | null;
}

const ATTACK_LABELS: Record<AttackType, { label: string; subLabel: string; color: string }> = {
  BRUTE_FORCE:          { label: 'هجوم القوة الغاشمة (Brute Force)',      subLabel: 'محاولات دخول مكثفة ومشبوهة',                        color: 'from-amber-600 to-red-600' },
  XSS_ATTACK:           { label: 'حقن برمجيات خبيثة (XSS Injection)',     subLabel: 'محاولة إدراج وسوم <script> أو أحداث HTML',           color: 'from-red-600 to-rose-600' },
  SQL_INJECTION:        { label: 'حقن استعلامات SQL (SQL Injection)',      subLabel: 'محاولة اختراق قواعد البيانات واستعلامات SQL',         color: 'from-purple-600 to-red-600' },
  NOSQL_INJECTION:      { label: 'حقن MongoDB (NoSQL Injection)',           subLabel: 'محاولة إدراج $where أو $expr أو أوامر MongoDB',      color: 'from-emerald-600 to-teal-700' },
  CODE_INJECTION:       { label: 'حقن كود برمجي (Code Injection)',         subLabel: 'محاولة تنفيذ أوامر برمجية على الخادم أو المتصفح',    color: 'from-orange-600 to-red-600' },
  RATE_LIMIT_EXCEEDED:  { label: 'تجاوز حد الطلبات (DoS Rate Limit)',     subLabel: 'معدل طلبات غير طبيعي من نفس المصدر',                 color: 'from-yellow-600 to-amber-600' },
  HEADER_TAMPERING:     { label: 'التلاعب بالترويسات الأمنية',            subLabel: 'تعديل ترويسات HTTP للاحتيال',                         color: 'from-slate-600 to-slate-800' },
  DEVTOOLS_INSPECT:     { label: 'محاولة فحص الواجهة (DevTools Inspect)', subLabel: 'رصد محاولة فتح أدوات المطورين أو فحص العناصر',      color: 'from-rose-600 to-pink-700' },
  DEBUGGER_TAMPERING:   { label: 'تتبع الكود البرمجي (Debugger Tamper)',  subLabel: 'محاولة إيقاف التنفيذ وتتبع متغيرات الذاكرة',         color: 'from-red-700 to-indigo-900' },
  SOURCE_INSPECTION:    { label: 'محاولة سحب السورس كود (View Source)',   subLabel: 'محاولة تحميل الكود المصدري أو حفظ الصفحة',           color: 'from-amber-600 to-orange-700' },
  CONSOLE_TAMPERING:    { label: 'تلاعب بالكونسول (Console Injection)',   subLabel: 'محاولة حقن دوال وسكريبتات عبر الكونسول',             color: 'from-violet-600 to-purple-800' },
};

export const AlertBanner: React.FC<AlertBannerProps> = ({ onNavigateToSecurity, appUser }) => {
  const [currentAlert, setCurrentAlert] = useState<ThreatLog | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [visible, setVisible] = useState(false);
  const lastSeenIdRef = useRef<string | null>(null);
  const shownAlertIdsRef = useRef<Set<string>>(new Set());

  const isAdmin = appUser?.isAdmin === true || appUser?.hasSupportAccess === true;

  useEffect(() => {
    if (!isAdmin) return;

    const showAlertOnce = (log: ThreatLog, totalUnread: number) => {
      if (shownAlertIdsRef.current.has(log.id)) return;
      shownAlertIdsRef.current.add(log.id);
      lastSeenIdRef.current = log.id;
      setCurrentAlert(log);
      setUnreadCount(totalUnread);
      setVisible(true);

      // Auto hide after 7 seconds so it appears ONCE then disappears
      setTimeout(() => {
        setVisible(false);
        threatEngine.markAlertAsRead(log.id);
      }, 7000);
    };

    const poll = async () => {
      await threatEngine.fetchLogsFromSupabase();
      const unread = threatEngine.getUnreadAlerts();
      if (unread.length === 0) return;

      const latest = unread[0];
      if (!shownAlertIdsRef.current.has(latest.id)) {
        showAlertOnce(latest, unread.length);
      } else {
        setUnreadCount(unread.length);
      }
    };

    poll();
    const interval = setInterval(poll, 3000);

    const handleEvent = (e: Event) => {
      if (!isAdmin) return;
      const log = (e as CustomEvent<ThreatLog>).detail;
      if (log && !shownAlertIdsRef.current.has(log.id)) {
        showAlertOnce(log, threatEngine.getUnreadAlerts().length || 1);
      }
    };
    window.addEventListener('SECURITY_ALERT', handleEvent);

    return () => {
      clearInterval(interval);
      window.removeEventListener('SECURITY_ALERT', handleEvent);
    };
  }, [isAdmin]);

  if (!isAdmin) return null;

  const handleDismiss = useCallback(() => {
    if (currentAlert?.id) threatEngine.markAlertAsRead(currentAlert.id);
    const remaining = threatEngine.getUnreadAlerts();
    setUnreadCount(remaining.length);
    if (remaining.length > 0) {
      const next = remaining[0];
      lastSeenIdRef.current = next.id;
      setCurrentAlert(next);
    } else {
      setVisible(false);
      setCurrentAlert(null);
    }
  }, [currentAlert]);

  const handleOpenSecurity = useCallback(() => {
    threatEngine.markAllAlertsAsRead();
    setVisible(false);
    setCurrentAlert(null);
    setUnreadCount(0);
    onNavigateToSecurity();
  }, [onNavigateToSecurity]);

  if (!visible || !currentAlert) return null;

  const info = ATTACK_LABELS[currentAlert.attack_type] ?? {
    label: currentAlert.attack_type,
    subLabel: 'تم الكشف عن نشاط مشبوه',
    color: 'from-red-600 to-orange-600',
  };

  return (
    <AnimatePresence>
      <motion.div
        key={currentAlert.id}
        initial={{ opacity: 0, y: -72, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -52, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 340, damping: 28 }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] w-full max-w-3xl px-4"
        dir="rtl"
      >
        <div className="relative overflow-hidden rounded-3xl border border-red-500/70 bg-slate-950/98 backdrop-blur-2xl shadow-2xl shadow-red-950/80 text-white p-5">
          {/* Pulsing top bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-orange-500 to-red-600 animate-pulse" />

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">

            {/* ── Left: Icon + Details ── */}
            <div className="flex items-start gap-3.5 min-w-0 flex-1">
              {/* Shield icon */}
              <div className="relative shrink-0 mt-0.5">
                <div className="absolute inset-0 bg-red-500/40 blur-xl rounded-full animate-pulse" />
                <div className={`relative w-12 h-12 rounded-2xl bg-gradient-to-br ${info.color} flex items-center justify-center shadow-lg`}>
                  <ShieldAlert size={24} className="text-white" />
                </div>
              </div>

              {/* Text block */}
              <div className="min-w-0 space-y-1">
                {/* Badges row */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-red-500/20 text-red-400 border border-red-500/40 flex items-center gap-1">
                    <Zap size={10} className="animate-pulse" />
                    تنبيه أمني — قسم السايبر
                  </span>
                  {unreadCount > 1 && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                      <Layers size={10} />
                      +{unreadCount - 1} تنبيهات معلقة
                    </span>
                  )}
                  <span className="text-[9px] font-bold text-slate-400">
                    {new Date(currentAlert.created_at).toLocaleTimeString('ar-EG')}
                  </span>
                </div>

                <h4 className="text-sm font-black text-white leading-tight">{info.label}</h4>
                <p className="text-[11px] text-red-300 font-semibold">{info.subLabel}</p>

                {/* Meta grid */}
                <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-[10px] text-slate-300">
                  <div className="flex items-center gap-1.5 truncate">
                    <User size={12} className="text-blue-400 shrink-0" />
                    <span className="font-bold text-slate-400">المستخدم:</span>
                    <span className="font-black text-white truncate">{currentAlert.user_name}</span>
                    {currentAlert.user_email && (
                      <span className="text-slate-500 truncate">({currentAlert.user_email})</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 truncate">
                    <MapPin size={12} className="text-emerald-400 shrink-0" />
                    <span className="font-bold text-slate-400">مكان الإدخال:</span>
                    <span className="font-black text-emerald-300 truncate">{currentAlert.endpoint}</span>
                  </div>
                </div>

                {/* Payload snippet */}
                {currentAlert.payload_sample && (
                  <div className="mt-2 p-2 bg-slate-900/90 rounded-xl border border-slate-800 text-[10px] font-mono text-red-200 text-left flex items-start gap-2 max-h-16 overflow-y-auto" dir="ltr">
                    <Code2 size={12} className="text-red-400 shrink-0 mt-0.5" />
                    <span className="break-all">{currentAlert.payload_sample}</span>
                  </div>
                )}
              </div>
            </div>

            {/* ── Right: Action button ── */}
            <div className="shrink-0 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/60">
              <button
                onClick={handleOpenSecurity}
                className="w-full sm:w-auto px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white text-[11px] font-black rounded-2xl transition-all active:scale-95 shadow-lg shadow-red-950/60 whitespace-nowrap cursor-pointer flex items-center justify-center gap-2"
              >
                <Bell size={14} />
                فتح قسم السايبر 🛡️
              </button>
            </div>
          </div>

          {/* ── Close (dismiss, stays in log) ── */}
          <button
            onClick={handleDismiss}
            className="absolute top-4 left-4 p-1.5 rounded-xl bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
            title="إغلاق التنبيه (يبقى في السجل)"
          >
            <X size={14} />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
