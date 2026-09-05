import { supabase } from '../supabase';
import { withMutex } from './concurrencyMutex';
import { idempotencyEngine, withIdempotency } from './idempotencyEngine';
import { withCollisionRetry } from './collisionHandler';
import { generateUUID } from '../security/distributedId';

export const groupService = {
  // Group Creation with Mutex, Idempotency and Collision Retry
  async createGroup(formData: { name: string; description?: string; avatar_url?: string; is_private?: boolean; category?: string }, userId: string) {
    const mutexKey = `group_create_${userId}`;
    const idempotencyKey = idempotencyEngine.generateKey('groups', userId, { name: formData.name, userId });

    return withMutex(mutexKey, () =>
      withIdempotency(
        idempotencyKey,
        async () => {
          return withCollisionRetry(async (_attempt, freshId) => {
            const { data, error } = await (supabase.from('groups') as any)
              .insert([{
                id: freshId,
                name: formData.name.trim(),
                description: formData.description?.trim() || '',
                avatar_url: formData.avatar_url || null,
                is_private: Boolean(formData.is_private),
                category: formData.category || 'عام',
                created_by: userId,
                member_count: 1
              }])
              .select()
              .single();

            if (error) {
              console.error("[groupService] createGroup error:", error);
              return { data: null, error };
            }

            // Auto-join creator as owner
            if (data?.id) {
              await supabase.from('group_members').insert([{
                group_id: data.id,
                user_id: userId,
                role: 'owner',
                status: 'accepted'
              }]);
            }

            return { data, error: null };
          }, { scope: 'createGroup' });
        },
        { ttlMs: 30000, scope: 'groups' }
      )
    );
  },

  // Group Management
  async updateGroup(groupId: string, updates: { name?: string; description?: string; avatar_url?: string; is_private?: boolean }) {
    return supabase.from('groups').update(updates).eq('id', groupId);
  },

  // Member Management
  async addMember(groupId: string, userId: string) {
    return supabase.from('group_members').insert([{
      group_id: groupId,
      user_id: userId,
      role: 'member',
      status: 'accepted'
    }]);
  },

  async updateMemberStatus(groupId: string, userId: string, status: 'accepted' | 'suspended' | 'pending') {
    return supabase.from('group_members')
      .update({ status })
      .eq('group_id', groupId)
      .eq('user_id', userId);
  },

  async removeMember(groupId: string, userId: string) {
    return supabase.from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', userId);
  },

  // Message Management
  async editMessage(postId: string, content: string) {
    return supabase.from('group_posts')
      .update({ 
        content, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', postId);
  },

  async deleteMessage(postId: string) {
    return supabase.from('group_posts')
      .delete()
      .eq('id', postId);
  },

  async sendGroupMessage(groupId: string, authorId: string, content: string, imageUrl?: string) {
    const mutexKey = `group_msg_${groupId}_${authorId}`;
    const idempotencyKey = idempotencyEngine.generateKey('group_msg', authorId, { groupId, content, imageUrl });

    return withMutex(mutexKey, () =>
      withIdempotency(
        idempotencyKey,
        async () => {
          return withCollisionRetry(async (_attempt, freshId) => {
            const { data, error } = await (supabase.from('group_posts') as any).insert([{
              id: freshId,
              group_id: groupId,
              author_id: authorId,
              content: content,
              image_url: imageUrl
            }]).select();
            
            if (error) {
              console.error("DEBUG: sendGroupMessage error details:", error);
            }
            return { data, error };
          }, { scope: 'sendGroupMessage' });
        },
        { ttlMs: 5000, scope: 'group_posts' }
      )
    );
  }
};
