-- ════════════════════════════════════════════════════════════════════════════════
-- 🎧 جدول رسائل الدعم الفني المنفصل (support_messages)
-- منفصل 100% عن جدول الرسائل العادية (messages)
-- ════════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.support_messages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content       TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 3000),
  message_type  TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'role_change_request', 'system')),
  metadata      JSONB DEFAULT NULL,
  read          BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 1. فهارس الأداء (Performance Indexes) ──────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_support_messages_sender    ON public.support_messages (sender_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_receiver  ON public.support_messages (receiver_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_created   ON public.support_messages (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_messages_type      ON public.support_messages (message_type);
CREATE INDEX IF NOT EXISTS idx_support_messages_read      ON public.support_messages (read);

-- ── 2. تفعيل الحماية على مستوى الصفوف (Row Level Security) ─────────────────────
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "support_messages_select" ON public.support_messages;
DROP POLICY IF EXISTS "support_messages_insert" ON public.support_messages;
DROP POLICY IF EXISTS "support_messages_update" ON public.support_messages;
DROP POLICY IF EXISTS "support_messages_delete" ON public.support_messages;

-- السياسة 1: القراءة للمرسل أو المستقبل أو أي أدمن
CREATE POLICY "support_messages_select" ON public.support_messages
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = sender_id 
    OR auth.uid() = receiver_id
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
        AND (profiles.is_admin = TRUE OR profiles.role IN ('admin', 'superadmin'))
    )
  );

-- السياسة 2: الإدراج لأي مستخدم مسجل
CREATE POLICY "support_messages_insert" ON public.support_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = sender_id);

-- السياسة 3: التحديث للمستلم أو الأدمن
CREATE POLICY "support_messages_update" ON public.support_messages
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = receiver_id
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
        AND (profiles.is_admin = TRUE OR profiles.role IN ('admin', 'superadmin'))
    )
  )
  WITH CHECK (
    auth.uid() = receiver_id
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
        AND (profiles.is_admin = TRUE OR profiles.role IN ('admin', 'superadmin'))
    )
  );

-- السياسة 4: الحذف للمرسل أو الأدمن
CREATE POLICY "support_messages_delete" ON public.support_messages
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = sender_id
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
        AND (profiles.is_admin = TRUE OR profiles.role IN ('admin', 'superadmin'))
    )
  );

-- ── 3. تفعيل Realtime على جدول الدعم ─────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'support_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages;
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;
