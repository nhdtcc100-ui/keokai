import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Key, Search, UserCheck, Database, Cpu, ArrowLeftRight, Zap, Lock, Network } from 'lucide-react';
import { threatEngine, ThreatLog } from '../../../lib/security/threatEngine';

interface NodeInfo {
  id: string;
  name: string;
  sub: string;
  port: number;
  icon: React.ReactNode;
  gradient: string;
  glow: string;
}

const NODES: NodeInfo[] = [
  { id: 'Auth Gateway', name: 'بوابة المصادقة', sub: '/api/auth/login', port: 443, icon: <Key size={18} />, gradient: 'from-blue-600 to-indigo-600', glow: 'shadow-blue-500/20' },
  { id: 'Search & Data Engine', name: 'محرك البحث والبيانات', sub: '/api/users/search', port: 5432, icon: <Search size={18} />, gradient: 'from-purple-600 to-indigo-700', glow: 'shadow-purple-500/20' },
  { id: 'Profile & Feed Module', name: 'وحدة البروفايل والتلقي', sub: '/api/posts', port: 443, icon: <UserCheck size={18} />, gradient: 'from-emerald-600 to-teal-700', glow: 'shadow-emerald-500/20' },
  { id: 'Core Database', name: 'قاعدة البيانات الرئيسية', sub: 'Postgres / Supabase', port: 5432, icon: <Database size={18} />, gradient: 'from-rose-600 to-red-700', glow: 'shadow-rose-500/20' },
  { id: 'Client DOM & Runtime Shield', name: 'درع فحص الواجهة (Anti-Inspect)', sub: 'Client DOM / DevTools Shield', port: 443, icon: <Shield size={18} />, gradient: 'from-pink-600 to-rose-700', glow: 'shadow-pink-500/20' },
  { id: 'Rate Limiter Cache', name: 'مخزن كبح المعدل', sub: 'Redis Session Store', port: 6379, icon: <Cpu size={18} />, gradient: 'from-amber-600 to-orange-700', glow: 'shadow-amber-500/20' },
];

const PORTS_DATA = [
  { port: 443, service: 'HTTPS / API Traffic', status: 'نشط ومحمّي بـ TLS 1.3', badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  { port: 5432, service: 'PostgreSQL Database', status: 'معزول ومحمّي بـ RLS', badge: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  { port: 6379, service: 'Redis Rate Limiter', status: 'تشغيل مستقر 100%', badge: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' },
  { port: 80, service: 'HTTP Insecure', status: 'تحويل إجباري لـ 443', badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
];

export const InteractiveThreatTree: React.FC = () => {
  const [logs, setLogs] = useState<ThreatLog[]>([]);
  const [selectedNode, setSelectedNode] = useState<NodeInfo | null>(null);

  useEffect(() => {
    const handleRefresh = () => setLogs(threatEngine.getLogs());
    handleRefresh();
    const interval = setInterval(handleRefresh, 4000);
    window.addEventListener('SECURITY_ALERT', handleRefresh);
    window.addEventListener('storage', handleRefresh);
    return () => {
      clearInterval(interval);
      window.removeEventListener('SECURITY_ALERT', handleRefresh);
      window.removeEventListener('storage', handleRefresh);
    };
  }, []);

  const activeThreatsByNode = (nodeName: string) => {
    return logs.filter(l => l.target_node === nodeName || l.endpoint.toLowerCase().includes(nodeName.toLowerCase()));
  };

  const latestThreat = logs.length > 0 ? logs[0] : null;

  return (
    <div className="bg-slate-800/40 border border-slate-700/50 rounded-[2.5rem] p-8 shadow-2xl backdrop-blur-xl space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-black text-white uppercase tracking-widest">شجرة التهديدات التفاعلية والأهداف المستهدفة</h3>
            <span className="px-2 py-0.5 rounded-full text-[8px] font-black bg-blue-500/20 text-blue-400 border border-blue-500/30 animate-pulse">
              Live Vector Map
            </span>
          </div>
          <p className="text-[9px] text-slate-500 mt-1 uppercase tracking-widest">
            مخطط تفاعلي مباشر للعقد الأمنية والمسارات التكتيكية المتوقعة للهجمات الحالية
          </p>
        </div>
        <div className="flex items-center gap-2 text-slate-400">
          <Network size={18} className="text-blue-500 animate-pulse" />
        </div>
      </div>

      {/* Main Interactive Tree Nodes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
        {NODES.map((node) => {
          const threats = activeThreatsByNode(node.id);
          const isTargeted = threats.length > 0;
          const isSelected = selectedNode?.id === node.id;

          return (
            <motion.div
              key={node.id}
              onClick={() => setSelectedNode(isSelected ? null : node)}
              whileHover={{ scale: 1.03, y: -4 }}
              whileTap={{ scale: 0.97 }}
              className={`relative overflow-hidden rounded-3xl p-5 border transition-all cursor-pointer flex flex-col justify-between min-h-[160px] ${
                isTargeted
                  ? 'bg-red-950/20 border-red-500/50 shadow-lg shadow-red-950/40'
                  : isSelected
                  ? 'bg-slate-800/80 border-blue-500/60 shadow-lg shadow-blue-900/30'
                  : 'bg-slate-900/50 border-slate-700/50 hover:border-slate-600'
              }`}
            >
              {/* Target glow animation if under threat */}
              {isTargeted && (
                <div className="absolute inset-0 bg-red-500/10 animate-pulse pointer-events-none rounded-3xl" />
              )}

              {/* Node Header */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${node.gradient} flex items-center justify-center text-white shadow-md ${node.glow}`}>
                    {node.icon}
                  </div>
                  <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border font-mono ${
                    isTargeted ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse' : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}>
                    PORT {node.port}
                  </span>
                </div>

                <p className="text-xs font-black text-white">{node.name}</p>
                <p className="text-[9px] font-mono text-slate-500 truncate mt-0.5">{node.sub}</p>
              </div>

              {/* Threat Status Footer */}
              <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between">
                <span className="text-[8px] font-black uppercase text-slate-400">الحالة الحالية</span>
                {isTargeted ? (
                  <span className="text-[8px] font-black text-red-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                    {threats.length} هجمة مرصودة
                  </span>
                ) : (
                  <span className="text-[8px] font-bold text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    آمن ومستقر
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Live Tactical Vector Details Panel */}
      {latestThreat ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 bg-slate-900/60 border border-red-500/30 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 backdrop-blur-md"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center text-white shadow-lg flex-shrink-0">
              <Zap size={18} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black text-red-400 uppercase tracking-widest">الهجمة الحالية المرصودة</span>
                <span className="text-[9px] text-slate-400 font-mono">({latestThreat.ip_address})</span>
              </div>
              <p className="text-xs font-black text-white mt-0.5">
                العقدة المستهدفة: <span className="text-blue-400">{latestThreat.target_node}</span> — نوع الهجمة: <span className="text-orange-400">{latestThreat.attack_type}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 border-t md:border-t-0 md:border-r border-slate-800 pt-3 md:pt-0 md:pr-4">
            <ArrowLeftRight size={16} className="text-slate-500 flex-shrink-0" />
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">المسار التكتيكي التالي المتوقع</p>
              <p className="text-xs font-bold text-amber-400 mt-0.5">{latestThreat.next_predicted_vector}</p>
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="p-4 bg-slate-900/40 border border-slate-800/80 rounded-2xl text-center">
          <p className="text-xs font-black text-slate-400">🛡️ لا توجد هجمات نشطة مرصودة حالياً خلال نافذة الساعة الحالية</p>
        </div>
      )}

      {/* Target Ports Section Below Graph */}
      <div className="pt-4 border-t border-slate-700/50 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Lock size={12} className="text-blue-400" />
            مراقبة البورتات الأمنية المستهدفة (Target Ports Tracker)
          </p>
          <span className="text-[8px] font-bold text-slate-500 uppercase">محدث مباشر</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {PORTS_DATA.map((p) => (
            <div
              key={p.port}
              className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-2xl flex items-center justify-between hover:border-slate-700 transition-colors"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-white font-mono">PORT {p.port}</span>
                </div>
                <p className="text-[9px] font-bold text-slate-400 mt-0.5">{p.service}</p>
              </div>
              <span className={`text-[8px] font-black px-2 py-1 rounded-lg border ${p.badge}`}>
                {p.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

