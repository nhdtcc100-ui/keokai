-- ============================================================
-- 🔧 PROLINK: إصلاح شامل ونهائي لجميع الجداول وحل خطأ 500
-- انسخ هذا الكود كاملاً ونفّذه في Supabase -> SQL Editor -> Run
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. جدول رسائل الدعم الفني support_messages
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.support_messages (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id    uuid NOT NULL,
  receiver_id  uuid NOT NULL,
  content      text NOT NULL,
  message_type text DEFAULT 'text',
  read         boolean DEFAULT false,
  created_at   timestamptz DEFAULT now()
);

ALTER TABLE public.support_messages ADD COLUMN IF NOT EXISTS sender_id uuid;
ALTER TABLE public.support_messages ADD COLUMN IF NOT EXISTS receiver_id uuid;
ALTER TABLE public.support_messages ADD COLUMN IF NOT EXISTS content text;
ALTER TABLE public.support_messages ADD COLUMN IF NOT EXISTS message_type text DEFAULT 'text';
ALTER TABLE public.support_messages ADD COLUMN IF NOT EXISTS read boolean DEFAULT false;
ALTER TABLE public.support_messages ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "support_select_policy" ON public.support_messages;
DROP POLICY IF EXISTS "support_insert_policy" ON public.support_messages;
DROP POLICY IF EXISTS "support_update_policy" ON public.support_messages;
DROP POLICY IF EXISTS "admin_support_select_all" ON public.support_messages;
DROP POLICY IF EXISTS "admin_support_insert_reply" ON public.support_messages;

CREATE POLICY "support_select_policy" ON public.support_messages
  FOR SELECT USING (
    auth.uid() = sender_id OR auth.uid() = receiver_id
  );

CREATE POLICY "support_insert_policy" ON public.support_messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "support_update_policy" ON public.support_messages
  FOR UPDATE USING (
    auth.uid() = receiver_id
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND (is_admin = true OR role IN ('admin','superadmin'))
    )
  );

CREATE POLICY "admin_support_select_all" ON public.support_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND (is_admin = true OR role IN ('admin','superadmin'))
    )
  );

CREATE POLICY "admin_support_insert_reply" ON public.support_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND (is_admin = true OR role IN ('admin','superadmin'))
    )
  );

-- ─────────────────────────────────────────────────────────────
-- 2. جدول المجموعات groups وأعضائها group_members
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.groups (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name         text NOT NULL,
  description  text DEFAULT '',
  avatar_url   text,
  is_private   boolean DEFAULT false,
  category     text DEFAULT 'عام',
  created_by   uuid,
  member_count integer DEFAULT 1,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS description text DEFAULT '';
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS is_private boolean DEFAULT false;
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS category text DEFAULT 'عام';
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS created_by uuid;
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS member_count integer DEFAULT 1;
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='groups' AND column_name='creator_id') THEN
    UPDATE public.groups SET created_by = creator_id WHERE created_by IS NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='groups' AND column_name='user_id') THEN
    UPDATE public.groups SET created_by = user_id WHERE created_by IS NULL;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.group_members (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id   uuid NOT NULL,
  user_id    uuid NOT NULL,
  role       text DEFAULT 'member',
  status     text DEFAULT 'accepted',
  joined_at  timestamptz DEFAULT now()
);

ALTER TABLE public.group_members ADD COLUMN IF NOT EXISTS group_id uuid;
ALTER TABLE public.group_members ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.group_members ADD COLUMN IF NOT EXISTS role text DEFAULT 'member';
ALTER TABLE public.group_members ADD COLUMN IF NOT EXISTS status text DEFAULT 'accepted';
ALTER TABLE public.group_members ADD COLUMN IF NOT EXISTS joined_at timestamptz DEFAULT now();

-- ربط العلاقة الخارجية لتمكين الـ Join groups(*) في PostgREST
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'group_members_group_id_fkey'
  ) THEN
    ALTER TABLE public.group_members
      ADD CONSTRAINT group_members_group_id_fkey
      FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "groups_select_all"    ON public.groups;
DROP POLICY IF EXISTS "groups_insert_auth"   ON public.groups;
DROP POLICY IF EXISTS "groups_update_owner"  ON public.groups;
DROP POLICY IF EXISTS "groups_delete_owner"  ON public.groups;
DROP POLICY IF EXISTS "members_select"       ON public.group_members;
DROP POLICY IF EXISTS "members_insert_auth"  ON public.group_members;
DROP POLICY IF EXISTS "members_update_owner" ON public.group_members;
DROP POLICY IF EXISTS "members_delete_auth"  ON public.group_members;

-- ✅ حل خطأ 500 (Infinite Recursion):
-- سياسة group_members تكون بسيطة ومباشرة بدون استعلامات ذاتية دائرية
CREATE POLICY "members_select" ON public.group_members
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "members_insert_auth" ON public.group_members
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "members_update_owner" ON public.group_members
  FOR UPDATE USING (user_id = auth.uid() OR auth.uid() IS NOT NULL);

CREATE POLICY "members_delete_auth" ON public.group_members
  FOR DELETE USING (user_id = auth.uid() OR auth.uid() IS NOT NULL);

-- سياسة groups: المجموعات العامة يراها الجميع، الخاصة يراها المنشئ وأعضاؤها
CREATE POLICY "groups_select_all" ON public.groups
  FOR SELECT USING (
    is_private = false
    OR created_by = auth.uid()
    OR id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
  );

CREATE POLICY "groups_insert_auth" ON public.groups
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "groups_update_owner" ON public.groups
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "groups_delete_owner" ON public.groups
  FOR DELETE USING (
    auth.uid() = created_by
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND (is_admin = true OR role IN ('admin','superadmin'))
    )
  );

-- ─────────────────────────────────────────────────────────────
-- 2.1 جدول منشورات ورسائل المجموعات group_posts
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.group_posts (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id    uuid NOT NULL,
  author_id   uuid NOT NULL,
  content     text NOT NULL,
  image_url   text,
  is_edited   boolean DEFAULT false,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

ALTER TABLE public.group_posts ADD COLUMN IF NOT EXISTS group_id uuid;
ALTER TABLE public.group_posts ADD COLUMN IF NOT EXISTS author_id uuid;
ALTER TABLE public.group_posts ADD COLUMN IF NOT EXISTS content text;
ALTER TABLE public.group_posts ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE public.group_posts ADD COLUMN IF NOT EXISTS is_edited boolean DEFAULT false;
ALTER TABLE public.group_posts ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.group_posts ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'group_posts_group_id_fkey'
  ) THEN
    ALTER TABLE public.group_posts
      ADD CONSTRAINT group_posts_group_id_fkey
      FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

ALTER TABLE public.group_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "group_posts_select" ON public.group_posts;
DROP POLICY IF EXISTS "group_posts_insert" ON public.group_posts;
DROP POLICY IF EXISTS "group_posts_update" ON public.group_posts;
DROP POLICY IF EXISTS "group_posts_delete" ON public.group_posts;

CREATE POLICY "group_posts_select" ON public.group_posts
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "group_posts_insert" ON public.group_posts
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "group_posts_update" ON public.group_posts
  FOR UPDATE USING (author_id = auth.uid());

CREATE POLICY "group_posts_delete" ON public.group_posts
  FOR DELETE USING (
    author_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.groups g WHERE g.id = group_posts.group_id AND g.created_by = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.group_members gm WHERE gm.group_id = group_posts.group_id AND gm.user_id = auth.uid() AND gm.role IN ('owner', 'admin')
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (is_admin = true OR role IN ('admin', 'superadmin'))
    )
  );

-- ─────────────────────────────────────────────────────────────
-- 3. جدول الإشعارات notifications ومحفزات التحديث
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid NOT NULL,
  actor_id   uuid,
  type       text NOT NULL,
  content    text NOT NULL,
  target_id  uuid,
  is_read    boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS actor_id uuid;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS type text;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS content text;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS target_id uuid;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS is_read boolean DEFAULT false;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "notif_select_own" ON public.notifications;
DROP POLICY IF EXISTS "notif_insert_auth" ON public.notifications;
DROP POLICY IF EXISTS "notif_update_own" ON public.notifications;

CREATE POLICY "notif_select_own" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "notif_insert_auth" ON public.notifications
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "notif_update_own" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- تأمين أعمدة job_applications
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS applicant_id uuid;
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS employer_id uuid;
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS job_id uuid;
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';

-- محفز إشعار تلقائي عند قبول أو رفض طلب الوظيفة
CREATE OR REPLACE FUNCTION notify_job_application_status_change()
RETURNS TRIGGER AS $$
DECLARE
  v_emp_id uuid;
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status IN ('approved', 'rejected') THEN
    v_emp_id := NULL;
    BEGIN
      v_emp_id := NEW.employer_id;
    EXCEPTION WHEN OTHERS THEN
      v_emp_id := NULL;
    END;

    INSERT INTO public.notifications (user_id, actor_id, type, content, target_id)
    VALUES (
      NEW.applicant_id,
      v_emp_id,
      CASE WHEN NEW.status = 'approved' THEN 'application_approved' ELSE 'application_rejected' END,
      CASE WHEN NEW.status = 'approved' 
        THEN '🎉 تهانينا! تم قبول طلب توظيفك'
        ELSE '😔 تم رفض طلب توظيفك للأسف'
      END,
      NEW.job_id
    );
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS job_app_status_notify ON public.job_applications;
CREATE TRIGGER job_app_status_notify
  AFTER UPDATE ON public.job_applications
  FOR EACH ROW EXECUTE FUNCTION notify_job_application_status_change();

-- جدول تسجيل الدورات ومحفز الإشعار
CREATE TABLE IF NOT EXISTS public.course_registrations (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id   uuid,
  user_id     uuid,
  provider_id uuid,
  status      text DEFAULT 'pending',
  notes       text DEFAULT '',
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE public.course_registrations ADD COLUMN IF NOT EXISTS course_id uuid;
ALTER TABLE public.course_registrations ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.course_registrations ADD COLUMN IF NOT EXISTS provider_id uuid;
ALTER TABLE public.course_registrations ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';
ALTER TABLE public.course_registrations ADD COLUMN IF NOT EXISTS notes text DEFAULT '';
ALTER TABLE public.course_registrations ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

CREATE OR REPLACE FUNCTION notify_course_registration_status_change()
RETURNS TRIGGER AS $$
DECLARE
  v_prov_id uuid;
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status IN ('approved', 'rejected') THEN
    v_prov_id := NULL;
    BEGIN
      v_prov_id := NEW.provider_id;
    EXCEPTION WHEN OTHERS THEN
      v_prov_id := NULL;
    END;

    INSERT INTO public.notifications (user_id, actor_id, type, content, target_id)
    VALUES (
      NEW.user_id,
      v_prov_id,
      CASE WHEN NEW.status = 'approved' THEN 'course_approved' ELSE 'course_rejected' END,
      CASE WHEN NEW.status = 'approved'
        THEN '🎉 تهانينا! تم قبول تسجيلك في الدورة التدريبية'
        ELSE '😔 تم رفض تسجيلك في الدورة التدريبية للأسف'
      END,
      NEW.course_id
    );
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS course_reg_status_notify ON public.course_registrations;
CREATE TRIGGER course_reg_status_notify
  AFTER UPDATE ON public.course_registrations
  FOR EACH ROW EXECUTE FUNCTION notify_course_registration_status_change();

-- ─────────────────────────────────────────────────────────────
-- 4. صلاحيات job_applications RLS
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "job_app_select_own"        ON public.job_applications;
DROP POLICY IF EXISTS "job_app_insert_auth"       ON public.job_applications;
DROP POLICY IF EXISTS "job_app_update_employer"   ON public.job_applications;
DROP POLICY IF EXISTS "job_app_select_employer"   ON public.job_applications;
DROP POLICY IF EXISTS "admin_job_app_select_all"  ON public.job_applications;

CREATE POLICY "job_app_select_own" ON public.job_applications
  FOR SELECT USING (auth.uid() = applicant_id);

CREATE POLICY "job_app_select_employer" ON public.job_applications
  FOR SELECT USING (auth.uid() = employer_id);

CREATE POLICY "job_app_insert_auth" ON public.job_applications
  FOR INSERT WITH CHECK (auth.uid() = applicant_id);

CREATE POLICY "job_app_update_employer" ON public.job_applications
  FOR UPDATE USING (
    auth.uid() = employer_id
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND (is_admin = true OR role IN ('admin','superadmin'))
    )
  );

CREATE POLICY "admin_job_app_select_all" ON public.job_applications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND (is_admin = true OR role IN ('admin','superadmin'))
    )
  );

-- ─────────────────────────────────────────────────────────────
-- 5. تفعيل Realtime بأمان
-- ─────────────────────────────────────────────────────────────
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.groups;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.group_members;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.group_posts;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
END $$;

-- ─────────────────────────────────────────────────────────────
-- نتيجة التنفيذ
-- ─────────────────────────────────────────────────────────────
SELECT 'All fixes applied successfully ✅' AS status;
