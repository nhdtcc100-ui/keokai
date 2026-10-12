import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  ArrowRight, 
  Shield, 
  Compass, 
  Search, 
  Plus, 
  Loader2, 
  Sparkles, 
  CheckCircle2, 
  Check 
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { AppUser } from '../../../types';

interface CreateGroupPageProps {
  currentUser: AppUser | null;
  syncedUsers: any[];
  onClose: () => void;
  onGroupCreated: (newGroup: any) => void;
  addToast?: (m: string, t?: any) => void;
  fetchMyGroups?: () => Promise<void>;
}

export const CreateGroupPage: React.FC<CreateGroupPageProps> = ({
  currentUser,
  syncedUsers,
  onClose,
  onGroupCreated,
  addToast,
  fetchMyGroups
}) => {
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [groupCategory, setGroupCategory] = useState('عام');
  const [isPrivate, setIsPrivate] = useState(false);
  const [selectedGroupMembers, setSelectedGroupMembers] = useState<string[]>([]);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  const categories = ['عام', 'تقني', 'وظائف', 'تجارة', 'هندسة', 'تصميم', 'تسويق', 'استشارات'];

  const handleCreateGroup = async () => {
    const trimmedName = groupName.trim();
    if (!trimmedName) {
      addToast?.('يرجى كتابة اسم المجموعة', 'error');
      return;
    }
    if (!currentUser?.id) {
      addToast?.('تعذر تحديد حساب المستخدم، يرجى إعادة تسجيل الدخول', 'error');
      return;
    }

    setIsCreatingGroup(true);
    console.log("🚀 [CreateGroupPage] بدء إنشاء المجموعة:", {
      name: trimmedName,
      description: groupDescription,
      category: groupCategory,
      is_private: isPrivate,
      created_by: currentUser.id,
      membersCount: selectedGroupMembers.length
    });

    try {
      const { data: newGroup, error: groupErr } = await supabase.from('groups').insert([{
        name: trimmedName,
        description: groupDescription.trim(),
        category: groupCategory,
        created_by: currentUser.id,
        is_private: isPrivate
      }]).select().single();

      if (groupErr) {
        console.error("❌ [CreateGroupPage] خطأ في إنشاء المجموعة في جدول groups:", groupErr);
        throw groupErr;
      }

      if (newGroup) {
        const createdGroupId = (newGroup as any).id;
        const membersToInsert = [
          { group_id: createdGroupId, user_id: currentUser.id, role: 'owner', status: 'accepted' },
          ...selectedGroupMembers.map(uid => ({
            group_id: createdGroupId,
            user_id: uid,
            role: 'member',
            status: 'accepted'
          }))
        ];

        const { error: memErr } = await supabase.from('group_members').insert(membersToInsert);
        if (memErr) {
          console.warn("⚠️ [CreateGroupPage] تنبيه في إدراج الأعضاء:", memErr);
        }

        console.log("✅ [CreateGroupPage] تم إنشاء المجموعة بنجاح تام!", newGroup);
        addToast?.('تم إنشاء المجموعة بنجاح! 🎉', 'success');

        // تحديث المجموعات في الخلفية فورياً
        if (fetchMyGroups) {
          fetchMyGroups().catch(console.error);
        }

        // إشعار الأب فورياً لفتح المجموعة والانتقال لها مباشرة بدون خروج
        onGroupCreated(newGroup);
      }
    } catch (e: any) {
      console.error("❌ [CreateGroupPage] حدث خطأ:", e);
      addToast?.('فشل إنشاء المجموعة: ' + (e.message || 'خطأ غير معروف'), 'error');
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const filteredUsers = syncedUsers.filter((u: any) =>
    (u?.name || '').toLowerCase().includes((memberSearchQuery || '').toLowerCase())
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-6 max-w-4xl mx-auto pb-40 px-2 md:px-4"
      dir="rtl"
    >
      {/* ── Top Header / Breadcrumbs Bar ── */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-2xl text-xs font-black hover:bg-slate-50 dark:hover:bg-slate-700 transition-all border border-slate-100 dark:border-slate-700 shadow-sm cursor-pointer active:scale-95"
        >
          <ArrowRight size={16} />
          <span>العودة للرسائل</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-black text-slate-400 dark:text-slate-500">
            إنشاء مجتمع مهني جديد
          </span>
        </div>
      </div>

      {/* ── Hero Gradient Header (Matches Profile / Job Post Page) ── */}
      <div className="rounded-[2.5rem] overflow-hidden bg-gradient-to-bl from-[#0a66c2] via-[#0d5ca8] to-[#003d7a] text-white p-6 md:p-8 relative shadow-lg border border-white/10">
        <div className="absolute -top-10 -left-10 w-44 h-44 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-60 h-32 bg-white/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-4 md:gap-5 relative z-10">
          <div className="w-14 h-14 md:w-16 md:h-16 bg-white/15 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20 shadow-xl shrink-0">
            <Users size={28} className="text-white" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-[10px] font-black uppercase tracking-wider mb-1 border border-white/20">
              <Sparkles size={11} className="text-amber-300" />
              مجتمعات عمل المهنية
            </div>
            <h2 className="text-xl md:text-2xl font-black leading-tight">إنشاء مجموعة وتجمع تخصصي</h2>
            <p className="text-xs text-blue-100 font-bold mt-0.5">
              اجمع زملاء المهنة والمحترفين لتبادل الخبرات والفرص في بيئة عمل احترافية
            </p>
          </div>
        </div>
      </div>

      {/* ── Main Form Body ── */}
      <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-6 md:p-8 border border-slate-100 dark:border-slate-700 shadow-sm space-y-6">
        
        {/* Privacy Toggle Card */}
        <div className="p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className={`p-3 rounded-2xl shadow-sm ${
              isPrivate 
                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30' 
                : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
            }`}>
              {isPrivate ? <Shield size={22} /> : <Compass size={22} />}
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-800 dark:text-white">
                {isPrivate ? 'مجموعة خاصة (مغلقة)' : 'مجموعة عامة (مفتوحة للجميع)'}
              </h4>
              <p className="text-xs text-slate-400 font-bold mt-0.5">
                {isPrivate ? 'يحتاج العضو لموافقة مالك المجموعة للانضمام' : 'يمكن لأي محترف في المنصة الانضمام والمشاركة الفورية'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsPrivate(!isPrivate)}
            className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
              isPrivate 
                ? 'bg-amber-600 text-white shadow-md shadow-amber-500/20' 
                : 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
            }`}
          >
            {isPrivate ? <Shield size={14} /> : <Compass size={14} />}
            <span>{isPrivate ? 'تغيير إلى عامة' : 'تغيير إلى خاصة'}</span>
          </button>
        </div>

        {/* Group Name & Category Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
              اسم المجموعة <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="مثال: خبراء الذكاء الاصطناعي وتطوير الويب"
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl py-3.5 px-5 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 focus:border-blue-500 text-slate-800 dark:text-white transition-all shadow-sm placeholder:text-slate-400"
            />
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
              التصنيف المهني
            </label>
            <div className="relative">
              <select
                value={groupCategory}
                onChange={e => setGroupCategory(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl py-3.5 px-5 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 focus:border-blue-500 text-slate-800 dark:text-white transition-all shadow-sm cursor-pointer"
              >
                {categories.map(c => (
                  <option key={c} value={c} className="dark:bg-slate-800">{c}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Description Field */}
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
            نبذة ووصف المجموعة
          </label>
          <textarea
            placeholder="ما هو تخصص وهدف هذه المجموعة؟ ما هي القواعد أو المواضيع التي تتم مناقشتها؟"
            value={groupDescription}
            onChange={e => setGroupDescription(e.target.value)}
            rows={4}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl py-3.5 px-5 text-sm font-medium outline-none focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 focus:border-blue-500 text-slate-800 dark:text-white transition-all resize-none shadow-sm placeholder:text-slate-400"
          />
        </div>

        {/* Member Invitation Grid */}
        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-700/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
                <span>دعوة أعضاء ومزامنين</span>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-xs font-black">
                  {selectedGroupMembers.length} تم اختيارهم
                </span>
              </h4>
              <p className="text-xs text-slate-400 font-bold mt-0.5">
                يمكنك اختيار أعضاء لإضافتهم فورياً للمجموعة عند الإنشاء
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="بحث عن عضو بالاسم..."
                value={memberSearchQuery}
                onChange={e => setMemberSearchQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl py-2.5 pr-9 pl-4 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          {filteredUsers.length === 0 ? (
            <div className="py-8 text-center bg-slate-50 dark:bg-slate-900/40 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-400 font-bold">لا يوجد أعضاء متطابقين مع البحث</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-72 overflow-y-auto p-1">
              {filteredUsers.map((user: any) => {
                const isSelected = selectedGroupMembers.includes(user.id);
                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setSelectedGroupMembers(prev => prev.filter(id => id !== user.id));
                      } else {
                        setSelectedGroupMembers(prev => [...prev, user.id]);
                      }
                    }}
                    className={`p-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 cursor-pointer text-center relative ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 shadow-sm ring-2 ring-blue-500/20'
                        : 'border-slate-100 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/50 hover:border-blue-300'
                    }`}
                  >
                    <div className="relative">
                      <img
                        src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=random`}
                        className="w-12 h-12 rounded-2xl object-cover border border-white dark:border-slate-700 shadow-sm"
                        alt=""
                      />
                      {isSelected && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-md border border-white">
                          <Check size={11} strokeWidth={3} />
                        </div>
                      )}
                    </div>
                    <p className={`text-xs font-black truncate w-full ${
                      isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'
                    }`}>
                      {user.name}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Submit Buttons Bar ── */}
        <div className="pt-6 border-t border-slate-100 dark:border-slate-700/60 flex flex-col sm:flex-row items-center gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isCreatingGroup}
            className="w-full sm:w-auto px-8 py-3.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-200 rounded-2xl font-black text-xs transition-all cursor-pointer"
          >
            إلغاء الأمر
          </button>

          <button
            type="button"
            onClick={handleCreateGroup}
            disabled={isCreatingGroup || !groupName.trim()}
            className="w-full sm:w-auto px-10 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs shadow-xl shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
          >
            {isCreatingGroup ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>جاري إنشاء المجموعة وحفظها...</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={16} />
                <span>تأكيد وإنشاء المجموعة ✓</span>
              </>
            )}
          </button>
        </div>

      </div>
    </motion.div>
  );
};
