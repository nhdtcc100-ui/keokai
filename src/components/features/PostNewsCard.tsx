import React, { useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'motion/react';
import { 
  Clock, 
  Repeat2, 
  Image as ImageIcon,
  PlayCircle,
  Trash2,
  Edit2,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { Post } from '../../types';
import { safeTimeAgo } from '../../lib/utils/formatDate';
import { useAppContext } from '../../contexts/AppContext';
import { supabase } from '../../lib/supabase';

interface PostNewsCardProps {
  post: Post;
  delay?: number;
  onClick: () => void;
  onAuthorClick?: (e: React.MouseEvent) => void;
  allUsers: any[];
  onDeletePost?: (id: string) => void;
  onEditPost?: (post: Post) => void;
}

export function PostNewsCard({ post, delay = 0, onClick, onAuthorClick, allUsers, onDeletePost, onEditPost }: PostNewsCardProps) {
  const { appUser, addToast } = useAppContext();
  const author = allUsers.find(u => u.id === post.authorId);
  const displayImage = post.imageUrl || author?.coverUrl || author?.avatar || '/news-placeholder.png';
  const hasVideo = !!post.videoUrl;

  const isOwner = !!(
    appUser?.id && (
      (post.authorId && appUser.id === post.authorId) ||
      ((post as any).author_id && appUser.id === (post as any).author_id) ||
      (post.authorId && appUser.id.toLowerCase() === post.authorId.toLowerCase()) ||
      ((post as any).author_id && appUser.id.toLowerCase() === (post as any).author_id.toLowerCase())
    )
  );
  const isAdmin = !!((appUser as any)?.isAdmin || (appUser as any)?.role === 'admin');
  const canManage = isOwner || isAdmin;

  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleted, setDeleted] = useState(false);

  // Motion value for smooth gesture tracking
  const x = useMotionValue(0);
  // Zero opacity when idle (-15 to 15), smoothly fades in only when user drags
  const deleteOpacity = useTransform(x, [-120, -30, -10, 0], [1, 0.9, 0, 0]);
  const deleteScale = useTransform(x, [-120, -30, 0], [1, 0.85, 0.7]);
  const editOpacity = useTransform(x, [0, 10, 30, 120], [0, 0, 0.9, 1]);
  const editScale = useTransform(x, [0, 30, 120], [0.7, 0.85, 1]);

  const handleSaveEdit = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!editContent.trim() || editContent === post.content) { setIsEditing(false); return; }
    setIsSaving(true);
    try {
      let query = (supabase as any).from('posts').update({ content: editContent.trim() }).eq('id', post.id);
      if (!isAdmin) query = query.eq('author_id', appUser?.id);
      const { error } = await query;
      if (error) throw error;
      post.content = editContent.trim();
      addToast('تم تحديث المنشور ✅');
    } catch {
      addToast('فشل التحديث', 'error');
    } finally {
      setIsSaving(false);
      setIsEditing(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleting(true);
    try {
      let query = supabase.from('posts').delete().eq('id', post.id);
      if (!isAdmin) query = (query as any).eq('author_id', appUser?.id);
      const { error } = await query;
      if (error) throw error;
      setDeleted(true);
      addToast('تم حذف المنشور بنجاح ✅');
      setTimeout(() => {
        if (onDeletePost) onDeletePost(post.id);
      }, 400);
    } catch {
      addToast('فشل الحذف، حاول مجددًا', 'error');
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleDragEnd = (_: any, info: any) => {
    if (!canManage || isEditing || showDeleteConfirm) return;
    // Swipe left (negative offset) -> Delete
    if (info.offset.x < -65) {
      setShowDeleteConfirm(true);
    }
    // Swipe right (positive offset) -> Edit (Opens Full Editor Modal)
    else if (info.offset.x > 65) {
      if (onEditPost) {
        onEditPost(post);
      } else {
        setIsEditing(true);
      }
    }
  };

  // Animate out if deleted
  if (deleted) {
    return (
      <motion.div
        initial={{ opacity: 1, scale: 1, height: 'auto' }}
        animate={{ opacity: 0, scale: 0.95, height: 0, marginBottom: 0 }}
        transition={{ duration: 0.35, ease: 'easeInOut' }}
        className="overflow-hidden"
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="group relative overflow-hidden rounded-[2rem]"
    >
      {/* ── Swipe Background Indicators — Ultra Clean Floating Icon & Text (NO solid background fill block) ── */}
      {canManage && !isEditing && (
        <div className="absolute inset-0 z-0 rounded-[2rem] overflow-hidden select-none pointer-events-none flex items-center justify-between px-6">
          {/* DELETE reveal (Swipe Left → x < 0) — Clean Floating Badge */}
          <motion.div
            style={{ opacity: deleteOpacity }}
            className="absolute inset-y-0 right-0 flex items-center justify-end pr-6"
          >
            <motion.div
              style={{ scale: deleteScale }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-red-50 dark:bg-red-950/70 border border-red-200 dark:border-red-800/80 text-red-600 dark:text-red-400 shadow-md backdrop-blur-md"
            >
              <Trash2 size={18} />
              <span className="font-black text-xs">حذف المنشور</span>
            </motion.div>
          </motion.div>

          {/* EDIT reveal (Swipe Right → x > 0) — Clean Floating Badge */}
          <motion.div
            style={{ opacity: editOpacity }}
            className="absolute inset-y-0 left-0 flex items-center justify-start pl-6"
          >
            <motion.div
              style={{ scale: editScale }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800/80 text-blue-600 dark:text-blue-400 shadow-md backdrop-blur-md"
            >
              <Edit2 size={18} />
              <span className="font-black text-xs">تعديل المنشور</span>
            </motion.div>
          </motion.div>
        </div>
      )}

      {/* ── Professional Delete Confirmation Overlay ── */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, backdropFilter: 'blur(0px)' }}
            animate={{ opacity: 1, scale: 1, backdropFilter: 'blur(12px)' }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="absolute inset-0 z-30 flex items-center justify-center rounded-[2rem] bg-white/90 dark:bg-slate-900/95 backdrop-blur-xl border border-red-200/60 dark:border-red-900/40 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center gap-4 px-6 text-center">
              {/* Icon */}
              <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-900/40 flex items-center justify-center border border-red-200 dark:border-red-800/50 shadow-lg">
                <AlertTriangle size={26} className="text-red-600 dark:text-red-400" />
              </div>

              {/* Title */}
              <div>
                <p className="text-sm font-black text-slate-900 dark:text-white mb-1">حذف المنشور؟</p>
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 leading-relaxed">
                  لا يمكن التراجع عن هذا الإجراء بعد تأكيده
                </p>
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-3 w-full">
                <button
                  onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(false); }}
                  disabled={isDeleting}
                  className="flex-1 py-2.5 rounded-2xl text-xs font-black bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 py-2.5 rounded-2xl text-xs font-black bg-red-600 hover:bg-red-700 text-white border border-transparent shadow-lg shadow-red-500/25 transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isDeleting
                    ? <><Loader2 size={13} className="animate-spin" /> جاري الحذف...</>
                    : <><Trash2 size={13} /> تأكيد الحذف</>
                  }
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main Foreground Card (100% Solid Opaque Background in Idle State) ── */}
      <motion.div
        style={{ x }}
        drag={canManage && !isEditing && !showDeleteConfirm ? "x" : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.65}
        onDragEnd={handleDragEnd}
        onClick={isEditing || showDeleteConfirm ? undefined : onClick}
        whileHover={isEditing || showDeleteConfirm ? {} : { y: -4, scale: 1.003 }}
        animate={showDeleteConfirm ? { scale: 0.985 } : { scale: 1 }}
        className={`relative z-10 flex flex-col md:flex-row items-stretch gap-4 p-4 bg-white dark:bg-[#0f172a] rounded-[2rem] border border-slate-100 dark:border-slate-800 hover:border-blue-500/50 shadow-sm hover:shadow-xl transition-colors overflow-hidden ${
          canManage && !isEditing ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
        }`}
      >
        {/* Visual Indicator (Gradient Bar) */}
        <div className="absolute top-0 right-0 bottom-0 w-1.5 bg-gradient-to-b from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity rounded-r-[2rem]" />

        {/* Media Preview (Thumbnail) */}
        <div className="relative shrink-0 w-full md:w-36 h-48 md:h-28 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-inner pointer-events-none">
          <img 
            src={displayImage} 
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/news-placeholder.png'; }}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-90 group-hover:opacity-100" 
            alt=""
          />
          <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
          
          {hasVideo && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white border border-white/30 shadow-lg">
                <PlayCircle size={20} fill="currentColor" className="text-white/80" />
              </div>
            </div>
          )}

          {!hasVideo && (
             <div className="absolute bottom-2 left-2 p-1.5 bg-black/40 backdrop-blur-sm rounded-lg text-white">
                <ImageIcon size={12} />
             </div>
          )}
        </div>

        {/* Content Section */}
        <div className="flex-1 min-w-0 flex flex-col py-1">
          {/* Header Row: Author info only */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <div 
              className="flex items-center gap-2 pr-1 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
              onClick={(e) => { e.stopPropagation(); onAuthorClick?.(e); }}
            >
              <img 
                src={post.authorAvatar} 
                className="w-5 h-5 rounded-full border border-white dark:border-slate-700 shadow-sm" 
                alt={post.authorName} 
              />
              <span className="text-[10px] font-black text-slate-900 dark:text-slate-100">{post.authorName}</span>
            </div>
            <span className="text-slate-300 dark:text-slate-700 text-[10px]">•</span>
            <span className="flex items-center gap-1 text-[9px] font-bold text-slate-400 dark:text-slate-500">
              <Clock size={10} /> {safeTimeAgo(post.timestamp || (post as any).created_at)}
            </span>
            <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[8px] font-black px-2 py-0.5 rounded-full border border-blue-100 dark:border-blue-800/30 uppercase tracking-widest mr-auto">
              منشور مهني
            </span>
          </div>

          {/* Edit mode */}
          {isEditing ? (
            <div className="flex flex-col gap-2 mt-1" onClick={(e) => e.stopPropagation()}>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-blue-200 dark:border-blue-800 rounded-xl p-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white"
                rows={3}
                autoFocus
                dir="auto"
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={(e) => { e.stopPropagation(); setIsEditing(false); setEditContent(post.content); }}
                  className="px-3 py-1.5 text-[10px] font-black rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={isSaving || !editContent.trim()}
                  className="px-3 py-1.5 text-[10px] font-black rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {isSaving ? '...' : 'حفظ'}
                </button>
              </div>
            </div>
          ) : (
            <>
              <h4 className="font-black text-sm text-slate-800 dark:text-slate-100 leading-snug line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors break-words">
                {post.content.split('\n')[0] || 'منشور جديد من ' + post.authorName}
              </h4>
              
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 line-clamp-1 italic font-medium">
                {post.content.split('\n').slice(1).join(' ').trim() || post.authorTitle}
              </p>

              {/* Clean Sleek Footer: Only View Details Indicator */}
              <div className="flex items-center justify-end gap-1.5 mt-auto pt-3">
                <span className="text-[9px] font-black text-blue-500/60 uppercase tracking-tighter group-hover:text-blue-600 transition-colors">
                  عرض التفاصيل
                </span>
                <div className="w-6 h-6 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center group-hover:bg-blue-600 transition-all group-hover:text-white">
                   <Repeat2 size={12} className="group-hover:rotate-180 transition-transform duration-500" />
                </div>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
