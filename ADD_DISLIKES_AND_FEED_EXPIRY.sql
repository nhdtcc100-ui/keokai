-- ================================================================
-- ProLink: Add dislikes_count to posts table
-- Run this in Supabase SQL Editor
-- ================================================================

-- 1. Add dislikes_count column (safe: only adds if not exists)
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS dislikes_count INTEGER NOT NULL DEFAULT 0;

-- 2. Set default for any existing rows that might have NULL
UPDATE public.posts SET dislikes_count = 0 WHERE dislikes_count IS NULL;

-- 3. (Optional) Index for fast sorting on feed
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON public.posts (author_id);

-- Done! ✅
-- The home feed now only fetches posts from the last 3 days.
-- All posts remain visible on user profile pages with no time limit.
