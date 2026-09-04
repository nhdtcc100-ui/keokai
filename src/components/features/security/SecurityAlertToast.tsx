import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, ArrowLeft, X, Lock } from 'lucide-react';
import { ThreatLog } from '../../../lib/security/threatEngine';

interface SecurityAlertToastProps {
  onOpenAdmin?: () => void;
  isAdmin?: boolean;
}

export const SecurityAlertToast: React.FC<SecurityAlertToastProps> = ({ onOpenAdmin, isAdmin = false }) => {
  const [currentAlert, setCurrentAlert] = useState<ThreatLog | null>(null);
  const [showUnauthorized, setShowUnauthorized] = useState(false);

  useEffect(() => {
    const handleSecurityAlert = (e: any) => {
      const log: ThreatLog = e.detail;
      if (!log) return;

      if (isAdmin) {
        // Admin: show full security alert
        setCurrentAlert(log);
      } else {
        // Non-admin: show "not authorized" message briefly then dismiss
        setShowUnauthorized(true);
        setTimeout(() => setShowUnauthorized(false), 3000);
      }
    };

    window.addEventListener('SECURITY_ALERT', handleSecurityAlert);
    return () => window.removeEventListener('SECURITY_ALERT', handleSecurityAlert);
  }, [isAdmin]);

  // Non-admin: "not authorized" message
  if (!isAdmin && showUnauthorized) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -40, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -30, scale: 0.92 }}
          className="fixed top-4 left-4 right-4 md:left-auto md:right-6 md:w-80 z-[300] bg-slate-900/96 text-white p-4 rounded-2xl shadow-2xl border border-slate-700/60 backdrop-blur-xl"
          dir="rtl"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-700/50 border border-slate-600/40 flex items-center justify-center shrink-0">
              <Lock className="text-slate-400" size={18} />
            </div>
            <div>
              <p className="text-xs font-black text-slate-200">غير مصرح لك بالوصول</p>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">هذا القسم مخصص للمشرفين فقط</p>
            </div>
            <button onClick={() => setShowUnauthorized(false)} className="p-1 text-slate-500 hover:text-white rounded-lg transition-colors mr-auto">
              <X size={14} />
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Non-admin: don't show security details
  if (!isAdmin) return null;

  if (!currentAlert) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -30, scale: 0.9 }}
        className="fixed top-4 left-4 right-4 md:left-auto md:right-6 md:w-96 z-[300] bg-red-950/95 text-white p-4 rounded-2xl shadow-2xl border border-red-500/40 backdrop-blur-xl"
        dir="rtl"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center shrink-0">
              <ShieldAlert className="text-red-400" size={20} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider bg-red-500/30 text-red-200 px-2 py-0.5 rounded-full border border-red-500/30">
                  {currentAlert.severity}
                </span>
                <span className="text-xs font-black text-red-100">تنبيه أمني فوري</span>
              </div>
              <p className="text-[11px] text-red-300/90 font-bold mt-0.5">
                {currentAlert.attack_type === 'CODE_INJECTION' ? 'محاولة رفع ملف تنفيذي أو شل' :
                  currentAlert.attack_type === 'HEADER_TAMPERING' ? 'تزييف ترويسة ملف (MIME Spoofing)' :
                    currentAlert.attack_type === 'SQL_INJECTION' ? 'محاولة حقن قواعد بيانات SQL' :
                      'اكتشاف سلوك غير آمن في المنصة'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setCurrentAlert(null)}
            className="p-1 text-red-400 hover:text-white rounded-lg transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {currentAlert.payload_sample && (
          <p className="text-[10px] bg-black/40 border border-red-500/20 text-red-200/90 rounded-xl p-2 mt-2.5 font-mono truncate">
            {currentAlert.payload_sample}
          </p>
        )}

        <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-red-500/20">
          <span className="text-[9px] text-red-400 font-bold">
            المستخدم: {currentAlert.user_name || 'زائر'}
          </span>
          {onOpenAdmin && (
            <button
              onClick={() => {
                onOpenAdmin();
                setCurrentAlert(null);
              }}
              className="flex items-center gap-1 px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded-xl text-[10px] font-black transition-all shadow-md active:scale-95"
            >
              <span>مركز السايبر</span>
              <ArrowLeft size={12} />
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
