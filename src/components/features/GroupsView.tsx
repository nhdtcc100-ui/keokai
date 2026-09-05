import React, { useState, useEffect } from 'react';
import { Users, Plus, ArrowRight, Lock, Globe } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { groupService } from '../../lib/services/groupService';
import { GroupCard, GroupDetailView } from './groups';
import { AppUser } from '../../types';
import { motion, AnimatePresence } from 'motion/react';

const Skeleton = () => (
  <div className="bg-white p-4 rounded-3xl border border-slate-100 animate-pulse">
    <div className="w-full h-32 bg-slate-100 rounded-2xl mb-4" />
    <div className="h-4 bg-slate-100 rounded w-3/4 mb-2" />
    <div className="h-3 bg-slate-100 rounded w-1/2" />
  </div>
);

const DEMO_GROUPS = [
  { id: 'dg-1', name: 'مجتمع مطوري الذكاء الاصطناعي', description: 'تجمع نخبة المطورين في مجالات AI & ML وتقنيات البيانات الضخمة والتعلم العميق', category: 'برمجة', member_count: 1240, is_private: false, cover_url: 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=600&h=200&fit=crop&auto=format' },
  { id: 'dg-2', name: 'رواد الأعمال والشركات الناشئة', description: 'نقاشات حول الاستثمار، الإدارة وتطوير المشاريع الريادية في العراق والوطن العربي', category: 'ريادة أعمال', member_count: 856, is_private: false, cover_url: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=600&h=200&fit=crop&auto=format' },
  { id: 'dg-3', name: 'مهندسو البرمجيات العراق', description: 'مجتمع للمهندسين البرمجيين العراقيين لتبادل الخبرات والفرص الوظيفية والمعرفة التقنية', category: 'برمجة', member_count: 2341, is_private: false, cover_url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&h=200&fit=crop&auto=format' },
  { id: 'dg-4', name: 'قادة التسويق الرقمي', description: 'منتدى حصري لمتخصصي التسويق الرقمي وصناع المحتوى وخبراء SEO وSocial Media', category: 'تسويق', member_count: 634, is_private: true, cover_url: 'https://images.unsplash.com/photo-1611926653458-09294b3142bf?w=600&h=200&fit=crop&auto=format' },
  { id: 'dg-5', name: 'نساء في التقنية — عراق', description: 'مجتمع داعم لتمكين المرأة في قطاع التكنولوجيا والابتكار والريادة التقنية', category: 'عام', member_count: 445, is_private: false, cover_url: 'https://images.unsplash.com/photo-1573164713988-8665fc963095?w=600&h=200&fit=crop&auto=format' },
  { id: 'dg-6', name: 'مصممو الجرافيك والهوية البصرية', description: 'فضاء إبداعي لمصممي الجرافيك والهوية البصرية لعرض أعمالهم وتبادل الإلهام والموارد', category: 'تصميم', member_count: 389, is_private: false, cover_url: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&h=200&fit=crop&auto=format' },
];

export interface GroupsViewProps {
  addToast: (m: string, t?: any) => void;
  appUser: any;
  sharedPost?: any;
  onClearSharedPost?: () => void;
  onSelectGroup?: (group: any) => void;
}

type GroupsTab = 'discover' | 'my';

export function GroupsView({ addToast, appUser, sharedPost, onClearSharedPost, onSelectGroup }: GroupsViewProps) {
  const [activeTab, setActiveTab] = useState<GroupsTab>('discover');
  const [showCreatePage, setShowCreatePage] = useState(false);
  const [groups, setGroups] = useState<any[]>([]);
  const [myGroups, setMyGroups] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [createForm, setCreateForm] = useState({ name: '', description: '', category: 'عام', is_private: false });
  const [creating, setCreating] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [connections, setConnections] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);

  const categories = ['عام', 'برمجة', 'تصميم', 'تسويق', 'ريادة أعمال', 'هندسة', 'طب', 'قانون', 'تعليم'];

  useEffect(() => {
    fetchGroups();
    if (appUser) {
      fetchMyGroups();
      fetchConnections();
    }
  }, [appUser]);

  const fetchGroups = async () => {
    setLoading(true);
    const { data } = await supabase.from('groups').select('*').eq('is_private', false).order('created_at', { ascending: false });
    if (data && data.length > 0) setGroups(data);
    else setGroups(DEMO_GROUPS);
    setLoading(false);
  };

  const fetchMyGroups = async () => {
    const { data } = await supabase.from('group_members').select('*, groups(*)').eq('user_id', appUser.id).eq('status', 'accepted');
    if (data) setMyGroups(data.map((d: any) => d.groups).filter(Boolean));
  };

  const fetchConnections = async () => {
    const { data: conns } = await supabase.from('connections').select('*').or(`requester_id.eq.${appUser.id},recipient_id.eq.${appUser.id}`).eq('status', 'accepted');
    if (conns) setConnections(conns);
    const { data: users } = await supabase.from('profiles').select('id, name, avatar_url, role, title, company_name');
    if (users) setAllUsers(users);
  };

  const fetchPendingRequests = async (groupId: string) => {
    const { data: members } = await supabase.from('group_members').select('*').eq('group_id', groupId).eq('status', 'pending');
    if (members) {
      const joined = members.map((m: any) => ({
        ...m,
        profiles: allUsers.find(p => p.id === m.user_id) || null
      }));
      setPendingRequests(joined);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name.trim()) { addToast('أدخل اسم المجموعة', 'error'); return; }
    if (!appUser) return;
    setCreating(true);
    try {
      const { data: group, error } = await groupService.createGroup(createForm, appUser.id);
      if (error) throw error;
      if (!group) throw new Error('فشل إنشاء المجموعة');

      // Optimistic update: add group immediately to local state
      const newGroup = group as any;
      setMyGroups(prev => [newGroup, ...prev]);
      setGroups(prev => prev[0]?.id?.startsWith('dg-') ? prev : [newGroup, ...prev]);

      addToast('تم إنشاء المجموعة بنجاح! 🎉');
      setCreateForm({ name: '', description: '', category: 'عام', is_private: false });
      setShowCreatePage(false);
      setActiveTab('my');
    } catch (e: any) { addToast('خطأ: ' + e.message, 'error'); }
    setCreating(false);
  };

  const handleJoinRequest = async (group: any) => {
    if (!appUser) return;
    const { data: existing } = await supabase.from('group_members').select('id,status').eq('group_id', group.id).eq('user_id', appUser.id).maybeSingle();
    if (existing) { addToast(existing.status === 'pending' ? 'طلبك قيد الانتظار' : 'أنت عضو بالفعل', 'error'); return; }
    await supabase.from('group_members').insert([{ group_id: group.id, user_id: appUser.id, role: 'member', status: group.is_private ? 'pending' : 'accepted' }]);
    if (!group.is_private) {
      const { data: countData } = await supabase.from('group_members').select('id', { count: 'exact' }).eq('group_id', group.id).eq('status', 'accepted');
      if (countData !== null) await supabase.from('groups').update({ member_count: countData }).eq('id', group.id);
      // Optimistic: add to myGroups
      setMyGroups(prev => [...prev, group]);
    }
    addToast(group.is_private ? 'تم إرسال طلب الانضمام ✅' : 'تم الانضمام للمجموعة! 🎉');
    fetchGroups();
  };

  const handleApprove = async (memberId: string, approve: boolean) => {
    await supabase.from('group_members').update({ status: approve ? 'accepted' : 'rejected' }).eq('id', memberId);
    if (approve && selectedGroup) {
      const { data: countData } = await supabase.from('group_members').select('id', { count: 'exact' }).eq('group_id', selectedGroup.id).eq('status', 'accepted');
      if (countData !== null) await supabase.from('groups').update({ member_count: countData }).eq('id', selectedGroup.id);
    }
    addToast(approve ? 'تم قبول الطلب ✅' : 'تم رفض الطلب');
    if (selectedGroup) fetchPendingRequests(selectedGroup.id);
  };

  const inviteConnectedUser = async (group: any, userId: string) => {
    const { data: existing } = await supabase.from('group_members').select('id').eq('group_id', group.id).eq('user_id', userId).maybeSingle();
    if (existing) { addToast('هذا المستخدم مُضاف بالفعل', 'error'); return; }
    await supabase.from('group_members').insert([{ group_id: group.id, user_id: userId, role: 'member', status: 'accepted' }]);
    addToast('تمت الدعوة بنجاح ✅');
  };

  // ── Full-page group detail ──
  if (selectedGroup) return (
    <GroupDetailView 
      group={selectedGroup} 
      appUser={appUser} 
      addToast={addToast} 
      onBack={() => {
        if (onSelectGroup) onSelectGroup(null);
        setSelectedGroup(null);
      }}
      pendingRequests={pendingRequests}
      connections={connections}
      allUsers={allUsers}
      onApprove={async (id, acc) => {
        await supabase.from('group_members').update({ status: acc ? 'accepted' : 'rejected' }).eq('id', id);
        fetchPendingRequests(selectedGroup.id);
        fetchMyGroups();
      }}
      onInvite={async (g, u) => {
        await supabase.from('group_members').insert([{ group_id: g.id, user_id: u, status: 'pending', role: 'member' }]);
        addToast('تم إرسال الدعوة بنجاح ✅');
      }}
      fetchPending={fetchPendingRequests}
      sharedPost={sharedPost} 
      onClearSharedPost={onClearSharedPost} 
    />
  );

  // ── Full-page group creation ──
  if (showCreatePage) return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="min-h-screen pb-32"
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 p-4 bg-white dark:bg-slate-900/80 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <button
            onClick={() => { setShowCreatePage(false); setCreateForm({ name: '', description: '', category: 'عام', is_private: false }); }}
            className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-2xl text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95"
          >
            <ArrowRight size={20} />
          </button>
          <div>
            <h2 className="text-lg font-black text-slate-800 dark:text-white">إنشاء مجموعة جديدة</h2>
            <p className="text-xs font-bold text-slate-400">أنشئ مجتمعاً مهنياً وابدأ التواصل</p>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden">
          {/* Decorative banner */}
          <div className="h-24 bg-gradient-to-l from-blue-600 via-indigo-600 to-violet-600 relative overflow-hidden">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_50%,white,transparent_60%)]" />
            <div className="absolute bottom-4 right-6 flex items-center gap-2">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                <Users size={20} className="text-white" />
              </div>
              <p className="text-white font-black text-sm">مجموعة مهنية جديدة</p>
            </div>
          </div>

          <form onSubmit={handleCreate} className="p-6 space-y-5">
            {/* Name */}
            <div>
              <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">اسم المجموعة *</label>
              <input
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-800 dark:text-white outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 dark:focus:ring-blue-900/20 transition-all"
                value={createForm.name}
                onChange={e => setCreateForm({ ...createForm, name: e.target.value })}
                placeholder="مثال: مهندسو البرمجيات العراق"
                required
                autoFocus
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">الوصف</label>
              <textarea
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-800 dark:text-white outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 dark:focus:ring-blue-900/20 transition-all resize-none"
                rows={3}
                value={createForm.description}
                onChange={e => setCreateForm({ ...createForm, description: e.target.value })}
                placeholder="ما هدف هذه المجموعة؟"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">التصنيف</label>
              <select
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-800 dark:text-white outline-none focus:border-blue-400 transition-all"
                value={createForm.category}
                onChange={e => setCreateForm({ ...createForm, category: e.target.value })}
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Privacy Toggle */}
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${createForm.is_private ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-600' : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600'}`}>
                  {createForm.is_private ? <Lock size={18} /> : <Globe size={18} />}
                </div>
                <div>
                  <p className="text-sm font-black text-slate-800 dark:text-white">
                    {createForm.is_private ? 'مجموعة خاصة' : 'مجموعة عامة'}
                  </p>
                  <p className="text-[10px] font-bold text-slate-400">
                    {createForm.is_private ? 'يتطلب الانضمام موافقة المالك' : 'يمكن للجميع الانضمام مباشرة'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCreateForm({ ...createForm, is_private: !createForm.is_private })}
                className={`relative w-12 h-6 rounded-full transition-all duration-300 ${createForm.is_private ? 'bg-amber-500' : 'bg-emerald-500'}`}
              >
                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300 ${createForm.is_private ? 'right-0.5' : 'left-0.5'}`} />
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={creating || !createForm.name.trim()}
              className="w-full py-4 bg-gradient-to-l from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-500/25 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {creating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  جاري الإنشاء...
                </>
              ) : (
                <>
                  <Plus size={18} />
                  إنشاء المجموعة الآن
                </>
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </AnimatePresence>
  );

  // ── Main Groups View ──
  return (
    <div className="space-y-4" dir="rtl">
      {/* Tab Bar */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900/80 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="flex gap-2">
          {(['discover', 'my'] as const).map((key) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${activeTab === key ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
            >
              {key === 'discover' ? 'اكتشاف' : 'مجموعاتي'}
            </button>
          ))}
        </div>
        {/* Create button */}
        <button
          onClick={() => setShowCreatePage(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition-all shadow-lg shadow-blue-500/20 active:scale-95"
        >
          <Plus size={14} />
          إنشاء
        </button>
      </div>

      {activeTab === 'my' && (
        <div className="grid grid-cols-1 gap-4">
          {myGroups.length === 0 ? (
            <div className="col-span-full py-20 text-center bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-inner">
              <Users size={64} className="mx-auto text-slate-100 dark:text-slate-800 mb-6 animate-bounce" />
              <p className="text-slate-400 font-black text-lg uppercase tracking-widest">لم تنضم لأي مجتمع مهني بعد</p>
              <button onClick={() => setActiveTab('discover')} className="mt-4 bg-blue-600 text-white px-8 py-3 rounded-2xl font-black text-sm shadow-xl shadow-blue-100 hover:scale-105 transition-all">اكتشف الفرص الآن</button>
            </div>
          ) : myGroups.map(g => (
            <GroupCard key={g.id} group={g} variant="my" onClick={() => { setSelectedGroup(g); fetchPendingRequests(g.id); }} />
          ))}
        </div>
      )}

      {activeTab === 'discover' && (
        <div className="grid grid-cols-1 gap-3">
          {loading ? (
            <>
              <Skeleton />
              <Skeleton />
              <Skeleton />
              <Skeleton />
            </>
          ) : groups.map(g => (
            <GroupCard key={g.id} group={g} variant="discover" onClick={() => { setSelectedGroup(g); fetchPendingRequests(g.id); }} onJoin={() => handleJoinRequest(g)} />
          ))}
        </div>
      )}
    </div>
  );
}
