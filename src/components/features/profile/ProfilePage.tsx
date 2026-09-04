import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Briefcase, ArrowRight, Lock, Send, Loader2, CheckCircle2, AlertCircle, ArrowLeftRight } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { profileService } from '../../../lib/services/profileService';
import { imageService } from '../../../lib/services/imageService';
import { PostTransmissionCard } from '../index';
import { AppUser, Post } from '../../../types';
import { ProfileHeader, ProfileTabs, ProfileEditView, ProfileActivityView } from './index';
import { ProfileCompletenessWidget } from './ProfileCompletenessWidget';
import { useAppContext } from '../../../contexts/AppContext';

interface ProfilePageProps {
  profile: AppUser;
  isMe: boolean;
  isEditing?: boolean;
  user: any;
  onBack?: () => void;
  onSave?: (updates: any) => Promise<void>;
  onSyncSignal?: () => void;
  isConnected?: boolean;
  handleRelocatePost: (p: Post) => void;
  setRelocatingPost: (p: Post) => void;
  addToast: (m: string, t?: any) => void;
  onLike: (id: string) => void;
  onDislike?: (id: string) => void;
  onAddComment: (id: string, c: string) => void;
  setAppUser?: (user: any) => void;
  onMessageClick?: () => void;
  onCallClick?: (u: any) => void;
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export function ProfilePage({
  profile,
  isMe,
  isEditing,
  user,
  onBack,
  onSave,
  handleRelocatePost,
  setRelocatingPost,
  addToast,
  onLike,
  onDislike,
  onAddComment,
  setAppUser,
  onMessageClick,
  onCallClick
}: ProfilePageProps) {
  const { appUser } = useAppContext();
  const [formData, setFormData] = useState({
    id:          profile.id           || '',
    name:        profile.name         || '',
    bio:         profile.bio          || '',
    companyName: profile.companyName  || '',
    location:    profile.location     || '',
    website:     profile.website      || '',
    industry:    profile.title || (profile as any).industry || '',
    phone:       profile.phone        || '',
    avatar:      profile.avatar       || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=random`,
    coverUrl:    (profile as any).coverUrl  || '',
    experience:  (profile as any).experience || '',
    education:   (profile as any).education  || '',
    cvUrl:       profile.cvUrl || (profile as any).cv_url || '',
    skills:      profile.skills || [],
    open_to:     (profile as any).open_to || 'none',
    role:        profile.role || 'seeker',
  });

  // Pending CV: selected locally but NOT uploaded yet — committed on Save
  const [pendingCV, setPendingCV]             = useState<File | null>(null);
  const [pendingCVName, setPendingCVName]     = useState<string | null>(null);

  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [activeTab, setActiveTab] = useState<'posts' | 'activity' | 'edit'>(isEditing ? 'edit' : 'activity');
  const [userPosts, setUserPosts]   = useState<any[]>([]);
  const saveTimerRef                = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef                = useRef<string>(JSON.stringify(formData));


  useEffect(() => {
    const fetchUserPosts = async () => {
      const { data } = await supabase
        .from('posts')
        .select('*')
        .eq('author_id', profile.id)
        .order('created_at', { ascending: false });

      if (data) setUserPosts((data as any[]).map((p: any) => ({
        id: p.id,
        authorId: p.author_id,
        authorName:   profile.name,
        authorAvatar: profile.avatar,
        authorTitle:  profile.role === 'employer' ? 'صاحب عمل' : 'باحث عن عمل',
        content:   p.content,
        imageUrl:  p.image_url,
        videoUrl:  p.video_url,
        timestamp: { toDate: () => new Date(p.created_at) },
        likesCount: p.likes_count
      })));
    };

    fetchUserPosts();

    const channel = supabase
      .channel(`user-posts-page-${profile.id}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'posts',
        filter: `author_id=eq.${profile.id}`
      }, fetchUserPosts)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [profile.id, profile.name, profile.avatar, profile.role]);

  // Keep formData synchronized whenever the profile prop changes
  useEffect(() => {
    setFormData({
      id:          profile.id           || '',
      name:        profile.name         || '',
      bio:         profile.bio          || '',
      companyName: profile.companyName  || '',
      location:    profile.location     || '',
      website:     profile.website      || '',
      industry:    profile.title || (profile as any).industry || '',
      phone:       profile.phone        || '',
      avatar:      profile.avatar || (profile as any).avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || 'U')}&background=random`,
      coverUrl:    (profile as any).coverUrl || (profile as any).cover_url || '',
      experience:  (profile as any).experience || '',
      education:   (profile as any).education  || '',
      cvUrl:       profile.cvUrl || (profile as any).cv_url || '',
      skills:      profile.skills || [],
      open_to:     (profile as any).open_to || 'none',
      role:        profile.role || 'seeker',
    });
  }, [profile]);

  // ── Avatar: Instant Direct Upload & Database Persistence ──
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    const { inspectUploadedFile } = await import('../../../lib/security/fileInspector');
    const check = await inspectUploadedFile(file, user, '/profile/avatar-upload');
    if (!check.safe) { addToast(check.error || 'تم حظر الصورة لدواعي أمنية', 'error'); return; }

    // Instant local preview for immediate visual feedback
    const localUrl = URL.createObjectURL(file);
    setFormData(prev => ({ ...prev, avatar: localUrl }));
    setSaveStatus('saving');
    addToast('جاري رفع وتثبيت الصورة الشخصية... ⏳');

    try {
      const permanentUrl = await imageService.processAndUpload(file, user.id, 'profiles');
      setFormData(prev => ({ ...prev, avatar: permanentUrl, avatar_url: permanentUrl }));

      const { error } = await profileService.updateProfile(user.id, {
        avatar: permanentUrl,
        avatar_url: permanentUrl
      });
      if (error) throw error;

      if (isMe && setAppUser) {
        setAppUser((prev: any) => prev ? { ...prev, avatar: permanentUrl, avatar_url: permanentUrl } : null);
      }
      if (onSave) {
        await onSave({ avatar: permanentUrl, avatar_url: permanentUrl });
      }

      setSaveStatus('saved');
      addToast('تم حفظ وتثبيت الصورة الشخصية بنجاح! 📸', 'success');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch (err: any) {
      setSaveStatus('error');
      addToast('فشل رفع الصورة: ' + (err.message || ''), 'error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  // ── Cover: Instant Direct Upload & Database Persistence ──
  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    const { inspectUploadedFile } = await import('../../../lib/security/fileInspector');
    const check = await inspectUploadedFile(file, user, '/profile/cover-upload');
    if (!check.safe) { addToast(check.error || 'تم حظر صورة الغلاف لدواعي أمنية', 'error'); return; }

    // Instant local preview
    const localUrl = URL.createObjectURL(file);
    setFormData(prev => ({ ...prev, coverUrl: localUrl }));
    setSaveStatus('saving');
    addToast('جاري رفع وتثبيت صورة الغلاف... ⏳');

    try {
      const permanentUrl = await imageService.processAndUpload(file, user.id, 'profiles');
      setFormData(prev => ({ ...prev, coverUrl: permanentUrl, cover_url: permanentUrl }));

      const { error } = await profileService.updateProfile(user.id, {
        coverUrl: permanentUrl,
        cover_url: permanentUrl
      });
      if (error) throw error;

      if (isMe && setAppUser) {
        setAppUser((prev: any) => prev ? { ...prev, coverUrl: permanentUrl, cover_url: permanentUrl } : null);
      }
      if (onSave) {
        await onSave({ coverUrl: permanentUrl, cover_url: permanentUrl });
      }

      setSaveStatus('saved');
      addToast('تم حفظ وتثبيت صورة الغلاف بنجاح! 🖼️', 'success');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch (err: any) {
      setSaveStatus('error');
      addToast('فشل رفع الغلاف: ' + (err.message || ''), 'error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleManualSave = useCallback(async () => {
    if (!user?.id) return;
    setSaveStatus('saving');
    try {
      let updatedFormData = { ...formData };

      // Upload pending CV (always replaces existing one)
      if (pendingCV) {
        if (updatedFormData.cvUrl) {
          try {
            const oldPath = updatedFormData.cvUrl.split('/profiles/').pop();
            if (oldPath) await (supabase.storage.from('profiles') as any).remove([oldPath]);
          } catch { /* ignore delete error */ }
        }
        const url = await imageService.processAndUpload(pendingCV, user.id, 'profiles');
        updatedFormData = { ...updatedFormData, cvUrl: url };
        setPendingCV(null);
        setPendingCVName(null);
      }

      setFormData(updatedFormData);

      const { error } = await profileService.updateProfile(user.id, updatedFormData);
      if (error) throw error;

      lastSavedRef.current = JSON.stringify(updatedFormData);
      setSaveStatus('saved');
      addToast('تم حفظ جميع التعديلات بنجاح! 💾', 'success');

      if (isMe && setAppUser) {
        setAppUser({ ...profile, ...updatedFormData });
      }

      if (onSave) {
        await onSave(updatedFormData);
      }

      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch (err: any) {
      setSaveStatus('error');
      addToast('فشل الحفظ: ' + (err.message || ''), 'error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  }, [user?.id, isMe, setAppUser, onSave, addToast, profile, formData, pendingCV]);

  const handleFieldChange = useCallback((field: string, value: any) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    setSaveStatus('idle');
  }, [formData]);

  // ── CV: local reference only, upload deferred to handleManualSave ──
  const handleCVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    const { inspectUploadedFile } = await import('../../../lib/security/fileInspector');
    const check = await inspectUploadedFile(file, user, '/profile/cv-upload');
    if (!check.safe) { addToast(check.error || 'تم حظر الملف لدواعي أمنية', 'error'); return; }

    setPendingCV(file);
    setPendingCVName(file.name);
    addToast(`تم اختيار ${file.name} ✅ اضغط حفظ لرفعه`);
  };

  const handleDownloadCV = () => {
    if (formData.cvUrl) {
      window.open(formData.cvUrl, '_blank');
    } else {
      addToast('لم يتم رفع سيرة ذاتية بعد', 'error');
    }
  };


  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 pb-28 pt-0 md:pt-4" dir="rtl">
      
      {/* Back button header if requested */}
      {onBack && (
        <div className="flex items-center justify-between px-2 py-1">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-black hover:bg-slate-50 transition-all border border-slate-100 dark:border-slate-700 shadow-sm"
          >
            <ArrowRight size={14} />
            العودة للرئيسية
          </button>
          <p className="text-xs font-black text-slate-400">الملف الشخصي</p>
        </div>
      )}

      {/* Main Profile Header */}
      <ProfileHeader
        formData={formData}
        profile={profile}
        isMe={isMe}
        handleCoverChange={handleCoverChange}
        handleAvatarChange={handleAvatarChange}
        handleFieldChange={handleFieldChange}
        handleDownloadCV={handleDownloadCV}
        setActiveTab={setActiveTab}
        userPostsCount={userPosts.length}
        onMessageClick={onMessageClick}
        onCallClick={() => onCallClick?.(profile)}
        showCallButton={!!appUser?.isAdmin}
      />

      {/* Profile Tabs */}
      <ProfileTabs activeTab={activeTab} setActiveTab={setActiveTab} isMe={isMe} />

      {/* Profile Completeness Widget */}
      {isMe && (activeTab === 'activity' || activeTab === 'edit') && (
        <ProfileCompletenessWidget
          profile={{ ...profile, ...formData }}
          onGoToEdit={() => setActiveTab('edit')}
        />
      )}

      {/* Tab Content Container */}
      <div className="min-h-[500px] p-4 md:p-8 bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-sm relative overflow-hidden">
        <AnimatePresence mode="wait">
          
          {/* Edit View */}
          {activeTab === 'edit' && (
            <ProfileEditView
              key="edit"
              formData={formData}
              handleFieldChange={handleFieldChange}
              addToast={addToast}
              setActiveTab={setActiveTab}
              saveStatus={saveStatus}
              handleCVUpload={handleCVUpload}
              handleSave={handleManualSave}
              onScrollToTop={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              pendingCVName={pendingCVName}
            />
          )}

          {/* Posts View */}
          {activeTab === 'posts' && (
            <motion.div key="posts" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6 pb-12 w-full">
              {userPosts.length > 0 ? (
                userPosts.map((p, idx) => (
                  <PostTransmissionCard
                    key={p.id}
                    post={p}
                    delay={idx * 0.05}
                    user={user}
                    onUserClick={() => {}}
                    handleRelocatePost={handleRelocatePost}
                    setRelocatingPost={setRelocatingPost}
                    addToast={addToast}
                    onLike={onLike}
                    onDislike={onDislike}
                    onAddComment={onAddComment}
                    onDeletePost={(id) => setUserPosts(prev => prev.filter(item => item.id !== id))}
                  />
                ))
              ) : (
                <div className="py-20 text-center bg-slate-50 dark:bg-slate-800/50 rounded-[2.5rem] border-2 border-dashed border-slate-100 dark:border-slate-700 flex flex-col items-center">
                  <Briefcase className="text-slate-300 mb-3" size={32} />
                  <p className="text-xs text-slate-400 font-black">لا توجد منشورات مسجلة لهذا الحساب حالياً</p>
                </div>
              )}
            </motion.div>
          )}

          {/* Activity View */}
          {activeTab === 'activity' && (
            <ProfileActivityView key="activity" profile={{ ...profile, ...formData }} />
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
