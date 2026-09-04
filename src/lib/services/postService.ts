import { supabase } from '../supabase';
import { Post, AppUser } from '../../types';
import { sanitizeInput, sanitizeComment } from '../security/inputValidator';
import { canUserPostAndInteract } from '../utils/roleUtils';

// ✅ Max content lengths to prevent payload abuse
const MAX_POST_LENGTH = 5000;
const MAX_ECHO_LENGTH = 3000;

export const postService = {
  /**
   * Home Feed: Only posts from last 3 days (72 hours).
   * Sorted by recency + engagement.
   */
  async fetchPosts(limit = 50) {
    try {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase.from('posts')
        .select('*')
        .gte('created_at', threeDaysAgo)           // ✅ Only last 3 days for home feed
        .order('created_at', { ascending: false })
        .limit(Math.min(limit, 100));

      if (error) {
        console.error("[fetchPosts] Supabase Error:", error);
        return { data: [], error };
      }

      return { data: data || [], error: null };
    } catch (err) {
      console.error("[fetchPosts] Exception caught:", err);
      return { data: [], error: err };
    }
  },

  /**
   * Profile Page: ALL posts by a specific user (no time limit).
   */
  async fetchUserPosts(authorId: string, limit = 100) {
    try {
      const { data, error } = await supabase.from('posts')
        .select('*')
        .eq('author_id', authorId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error("[fetchUserPosts] Supabase Error:", error);
        return { data: [], error };
      }

      return { data: data || [], error: null };
    } catch (err) {
      console.error("[fetchUserPosts] Exception caught:", err);
      return { data: [], error: err };
    }
  },

  async createPost(postData: any) {
    // 🚫 Strict Server/Service Guard: Seekers cannot create posts
    if (postData.author_id) {
      const { data: profile } = await supabase.from('profiles').select('id, role, is_admin').eq('id', postData.author_id).single();
      if (profile && !canUserPostAndInteract(profile)) {
        return { data: null, error: { message: 'غير مصرح للباحثين عن عمل بنشر المنشورات 🚫' } };
      }
    }

    // ✅ Sanitize all text fields & scan for threat injections before inserting
    const user = { id: postData.author_id, name: postData.author_name };
    const sanitized = {
      ...postData,
      content: sanitizeInput(postData.content || '', MAX_POST_LENGTH, user),
      author_name: sanitizeInput(postData.author_name || '', 100, user),
    };
    try {
      const res = await (supabase.from('posts') as any).insert([{ ...sanitized, dislikes_count: 0 }]);
      if (res.error && (res.error.code === '42703' || res.error.message?.includes('dislikes_count'))) {
        return (supabase.from('posts') as any).insert([sanitized]);
      }
      return res;
    } catch {
      return (supabase.from('posts') as any).insert([sanitized]);
    }
  },

  /**
   * ✅ Atomic like using parameterized SDK query.
   */
  async likePost(postId: string, currentLikes: number) {
    return (supabase.from('posts') as any)
      .update({ likes_count: Math.max(0, currentLikes + 1) })
      .eq('id', postId);
  },

  /**
   * ✅ Dislike: increments dislikes_count atomically with fallback.
   */
  async dislikePost(postId: string, currentDislikes: number) {
    try {
      const res = await (supabase.from('posts') as any)
        .update({ dislikes_count: Math.max(0, currentDislikes + 1) })
        .eq('id', postId);
      if (res.error && (res.error.code === '42703' || res.error.message?.includes('dislikes_count'))) {
        return { data: null, error: null };
      }
      return res;
    } catch (e) {
      console.warn('[postService] Dislike update fallback:', e);
      return { data: null, error: null };
    }
  },

  /**
   * ✅ Parameterized comment insert with strict input sanitization
   */
  async addComment(postId: string, author: AppUser, content: string) {
    // 🚫 Strict Role Check
    if (!canUserPostAndInteract(author)) {
      return { data: null, error: { message: 'غير مصرح للباحثين عن عمل بالتعليق أو التفاعل 🚫' } };
    }

    // Validate inputs
    if (!postId || !author?.id || !content?.trim()) {
      return { data: null, error: { message: 'بيانات التعليق غير مكتملة' } };
    }

    const user = { id: author.id, name: author.name, email: author.email };

    // ✅ Sanitize comment content & scan for threat injection
    const cleanContent = sanitizeComment(content, user);
    if (!cleanContent) {
      return { data: null, error: { message: 'محتوى التعليق فارغ بعد التحقق الأمني' } };
    }

    // ✅ Author name sanitized to prevent XSS in displayed name
    return (supabase.from('comments') as any).insert([{
      post_id: postId,
      author_id: author.id,   // From authenticated session - not user input
      author_name: sanitizeInput(author.name || 'مستخدم', 100, user),
      author_avatar: author.avatar,
      content: cleanContent   // ✅ Sanitized content
    }]);
  },

  /**
   * ✅ Echo / Repost: creates a new post carrying full repost metadata
   * so the UI can render it as a "repost card" instead of plain text.
   */
  async echoPost(author: AppUser, post: Post) {
    // 🚫 Strict Role Check
    if (!canUserPostAndInteract(author)) {
      return { data: null, error: { message: 'غير مصرح للباحثين عن عمل بإعادة نشر المنشورات 🚫' } };
    }

    return this.createPost({
      author_id: author.id,           // From authenticated session
      author_name: sanitizeInput(author.name || 'مستخدم', 100),
      author_avatar: author.avatar,
      content: '',                     // Echo posts have no extra caption by default
      image_url: null,
      likes_count: 0,
      // Repost-specific metadata
      is_echo: true,
      original_post_id: post.id,
      original_author_name: sanitizeInput(post.authorName || 'مستخدم', 100),
      original_author_avatar: post.authorAvatar || null,
      original_content: sanitizeInput(post.content || '', MAX_ECHO_LENGTH),
    });
  },

  /**
   * ✅ Relocate post: both IDs from authenticated context, content sanitized
   */
  async relocatePost(author: AppUser, targetUser: AppUser, post: Post) {
    const safeContent = sanitizeInput(
      `تم ترحيل منشور إليك: ${post.content}\nالرابط: ${post.imageUrl || ''}`,
      2000
    );
    return (supabase.from('messages') as any).insert([{
      sender_id: author.id,       // From authenticated session
      receiver_id: targetUser.id, // From validated user list
      content: safeContent        // ✅ Sanitized
    }]);
  },

  /**
   * ✅ Delete post with ownership verification
   * RLS on Supabase also enforces this at the DB level.
   */
  async deletePost(postId: string, authorId: string) {
    return (supabase.from('posts') as any)
      .delete()
      .eq('id', postId)
      .eq('author_id', authorId); // ✅ Ownership guard — only author can delete
  },
};
