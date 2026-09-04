-- ════════════════════════════════════════════════════════════════════════════════
-- 📋 جدول طلبات تغيير نوع الحساب (role_change_requests)
-- منفصل تماماً عن رسائل الدعم والرسائل العادية
-- ════════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.role_change_requests (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_name      TEXT NOT NULL DEFAULT '',
  user_avatar    TEXT NOT NULL DEFAULT '',
  user_email     TEXT DEFAULT NULL,
  user_phone     TEXT DEFAULT NULL,
  from_role      TEXT NOT NULL CHECK (from_role IN ('seeker', 'employer')),
  requested_role TEXT NOT NULL CHECK (requested_role IN ('seeker', 'employer')),
  reason         TEXT DEFAULT '',
  status         TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_note     TEXT DEFAULT NULL,
  reviewed_by    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at    TIMESTAMPTZ DEFAULT NULL
);

-- ── 1. فهارس الأداء ────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_rcr_user_id    ON public.role_change_requests (user_id);
CREATE INDEX IF NOT EXISTS idx_rcr_status     ON public.role_change_requests (status);
CREATE INDEX IF NOT EXISTS idx_rcr_created    ON public.role_change_requests (created_at DESC);

-- ── 2. Row Level Security ───────────────────────────────────────────────────────
ALTER TABLE public.role_change_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rcr_select" ON public.role_change_requests;
DROP POLICY IF EXISTS "rcr_insert" ON public.role_change_requests;
DROP POLICY IF EXISTS "rcr_update" ON public.role_change_requests;

-- القراءة: صاحب الطلب نفسه أو الأدمن
CREATE POLICY "rcr_select" ON public.role_change_requests
  FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND (profiles.is_admin = TRUE OR profiles.role IN ('admin', 'superadmin'))
    )
  );

-- الإدراج: أي مستخدم مسجل يرسل باسمه فقط
CREATE POLICY "rcr_insert" ON public.role_change_requests
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- التحديث (القبول/الرفض): الأدمن فقط
CREATE POLICY "rcr_update" ON public.role_change_requests
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND (profiles.is_admin = TRUE OR profiles.role IN ('admin', 'superadmin'))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND (profiles.is_admin = TRUE OR profiles.role IN ('admin', 'superadmin'))
    )
  );

-- ── 3. تفعيل Realtime ─────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'role_change_requests'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.role_change_requests;
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;
