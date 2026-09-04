import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Lock, Sparkles, Sliders, CheckCircle2, Ban } from 'lucide-react';

export const DefensiveCapabilitiesCard: React.FC = () => {
  const DEFENSE_SYSTEMS = [
    {
      title: 'محرك Sliding Window Rate Limiter',
      sub: 'كبح معدل المحاولات وحماية من القوة الغاشمة (حظر > 5 محاولات فاشلة / دقيقة)',
      status: 'نشط وجاهز',
      icon: <Sliders size={18} />,
      color: 'from-blue-600 to-indigo-600',
      border: 'border-blue-500/30',
      text: 'text-blue-400',
    },
    {
      title: 'جدار الحماية المصغر WAF Input Sanitizer',
      sub: 'مطابقة وتعقيم المدخلات ضد XSS و SQL Injection في جميع النماذج والـ APIs',
      status: 'ترشيح مباشر 100%',
      icon: <Sparkles size={18} />,
      color: 'from-purple-600 to-indigo-700',
      border: 'border-purple-500/30',
      text: 'text-purple-400',
    },
    {
      title: 'نظام التجميد الآلي للحسابات (Account Lockout)',
      sub: 'قفل الحساب المستهدف وتجميد الجلسة تلقائياً لمدة 15 دقيقة بعد رصد التهديد',
      status: 'حماية آليـة',
      icon: <Lock size={18} />,
      color: 'from-amber-600 to-orange-700',
      border: 'border-amber-500/30',
      text: 'text-amber-400',
    },
    {
      title: 'كاشف الصور والملفات الملغومة (Magic Bytes & WebShell WAF)',
      sub: 'فحص التوقيع الثنائي للهيدر وتفتيش الصور والملفات المرفوعة ضد الألغام والكودات الخبيثة والامتدادات المزدوجة',
      status: 'حماية ثنائية حية',
      icon: <ShieldCheck size={18} />,
      color: 'from-emerald-600 to-teal-700',
      border: 'border-emerald-500/30',
      text: 'text-emerald-400',
    },
    {
      title: 'حارس استعلامات MongoDB & NoSQL Injection Guard',
      sub: 'حظر دلالات $where و $expr وأوامر قواعد البيانات غير العلاقية والتصدي لمحاولات الاختراق مباشرة',
      status: 'فحص فوري 100%',
      icon: <Sparkles size={18} />,
      color: 'from-cyan-600 to-blue-700',
      border: 'border-cyan-500/30',
      text: 'text-cyan-400',
    },
    {
      title: 'حظر العناوين المشبوهة (Dynamic IP Blacklisting)',
      sub: 'إدراج عناوين IP في قائمة التهديدات المحظورة مؤقتاً أو دائمياً بنقرة واحدة',
      status: 'تصدٍ فوري',
      icon: <Ban size={18} />,
      color: 'from-rose-600 to-red-700',
      border: 'border-rose-500/30',
      text: 'text-rose-400',
    },
  ];

  return (
    <div className="bg-slate-800/40 border border-slate-700/50 rounded-[2.5rem] p-8 shadow-2xl backdrop-blur-xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
            <ShieldCheck size={18} className="text-emerald-500" />
            قدرات الصد الحالية (Active Defensive Capabilities)
          </h3>
          <p className="text-[9px] text-slate-500 mt-1 uppercase tracking-widest">
            الأنظمة والآليات الدفاعية المتاحة حالياً لصد الهجمات والحد من آثار التهديدات
          </p>
        </div>
        <span className="text-[9px] font-black px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
          حماية نشطة 24/7
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {DEFENSE_SYSTEMS.map((system, i) => (
          <motion.div
            key={system.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className={`p-5 rounded-3xl bg-slate-900/60 border ${system.border} backdrop-blur-md flex items-start gap-4 hover:border-slate-600 transition-colors`}
          >
            <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${system.color} flex items-center justify-center text-white shadow-lg flex-shrink-0 mt-0.5`}>
              {system.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <p className="text-xs font-black text-white truncate">{system.title}</p>
                <span className={`text-[8px] font-black px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 ${system.text} flex-shrink-0`}>
                  {system.status}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed font-bold">{system.sub}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

