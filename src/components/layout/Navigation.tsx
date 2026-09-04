import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Plus } from 'lucide-react';

export function NavbarItem({ icon, label, active, onClick, badge }: any) {
  return (
    <div
      onClick={onClick}
      className={`flex flex-col items-center justify-center px-4 cursor-pointer relative h-full transition-all group text-slate-900 dark:text-slate-400 hover:text-blue-600`}
    >
      <div className="relative group-hover:scale-110 transition-transform">
        {icon}
        {badge > 0 && (
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-bounce pointer-events-none z-20" />
        )}
      </div>
      <span className="text-[10px] mt-1 hidden lg:block font-bold whitespace-nowrap">{label}</span>
    </div>
  );
}

export function SidebarLink({ label, onClick }: { label: string, onClick?: () => void }) {
  return (
    <div onClick={onClick} className="flex items-center gap-3 text-xs font-bold text-slate-500 hover:bg-[#0a66c2]/5 p-1.5 rounded-lg cursor-pointer transition-all group">
      <Users size={14} className="text-slate-400 group-hover:text-[#0a66c2]" />
      <span className="truncate">{label}</span>
      <Plus size={14} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}

export function MobileNavItem({ 
  icon, 
  label, 
  active, 
  onClick,
  activeColor = 'text-blue-600 dark:text-blue-400',
  activeBg = 'bg-blue-50/80 dark:bg-blue-950/70',
  indicatorColor = 'bg-blue-600 dark:bg-blue-400'
}: { 
  icon: React.ReactNode; 
  label?: string; 
  active: boolean; 
  onClick: () => void;
  activeColor?: string;
  activeBg?: string;
  indicatorColor?: string;
}) {
  const handleClick = () => {
    try {
      if (navigator && typeof navigator.vibrate === 'function') {
        navigator.vibrate(10);
      }
    } catch (_) {}
    onClick();
  };

  return (
    <button 
      onClick={handleClick}
      className={`relative flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all duration-200 active:scale-90 select-none ${
        active 
          ? `${activeBg} ${activeColor} font-black shadow-sm` 
          : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
      }`}
    >
      <div className={`relative flex items-center justify-center transition-transform duration-200 ${
        active ? 'scale-110' : 'scale-100 opacity-75 hover:opacity-100'
      }`}>
        {icon}
      </div>

      {label && (
        <span className={`text-[10px] mt-1 tracking-tight transition-colors duration-200 ${
          active ? 'font-black' : 'font-bold opacity-85'
        }`}>
          {label}
        </span>
      )}

      {active && (
        <span className={`w-1.5 h-1.5 ${indicatorColor} rounded-full mt-0.5 animate-pulse`} />
      )}
    </button>
  );
}

export function DrawerItem({ icon, label, onClick, color = 'text-slate-700 dark:text-slate-200' }: { icon: React.ReactNode, label: string, onClick: () => void, color?: string }) {
  return (
    <motion.div 
      whileHover={{ x: -6 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick} 
      className="flex items-center gap-4 p-3.5 bg-white dark:bg-slate-800/60 rounded-2xl cursor-pointer transition-all border border-slate-100 dark:border-slate-700/50 shadow-sm hover:shadow-md group mb-2"
    >
      <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-700/60 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <span className={`text-sm font-black transition-colors ${color}`}>{label}</span>
    </motion.div>
  );
}

export function NavDropdownItem({ icon, label, onClick, color = 'text-slate-600' }: { icon: React.ReactNode, label: string, onClick: () => void, color?: string }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-2.5 w-full text-right p-2.5 hover:bg-slate-50 rounded-xl transition-all ${color}`}>
       {icon}
       <span className="text-xs font-bold">{label}</span>
    </button>
  );
}

export const RoleOption = ({ selected, icon: Icon, title, description, onClick }: any) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    onClick={onClick}
    className={`p-6 rounded-3xl cursor-pointer transition-all border-2 flex items-start gap-4 ${selected
        ? 'bg-white border-[#0a66c2] shadow-md'
        : 'bg-white/50 border-transparent hover:border-slate-200'
      }`}
  >
    <div className={`p-4 rounded-2xl ${selected ? 'bg-[#0a66c2] text-white' : 'bg-slate-100 text-slate-500'}`}>
      <Icon size={32} />
    </div>
    <div className="flex-1">
      <h3 className={`font-bold text-lg mb-1 ${selected ? 'text-[#0a66c2]' : 'text-slate-800'}`}>{title}</h3>
      <p className="text-sm text-slate-500 leading-snug">{description}</p>
    </div>
  </motion.div>
);
