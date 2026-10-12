-- ============================================================================
-- ProLink v3.0 Database Migration Script
-- Adds Freelancer / Field Specialist support, Availability toggles, and Profile enhancements
-- ============================================================================

-- 1. Add new columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS display_title TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS freelancer_type TEXT; -- 'technician' | 'client'
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS specialty TEXT; -- كهربائي / تبريد / بناء / سيراميك ...
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS home_address TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS service_request TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company_logo_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company_bio TEXT;

-- 2. Update role constraint if any exists to allow 'freelancer'
DO $$
BEGIN
    -- Check if constraint exists and update
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'profiles_role_check'
    ) THEN
        ALTER TABLE profiles DROP CONSTRAINT profiles_role_check;
        ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
            CHECK (role IN ('seeker', 'employer', 'freelancer', 'admin', ''));
    END IF;
END $$;

-- 3. Create index for fast freelancer & specialty lookups
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_freelancer_type ON profiles(freelancer_type);
CREATE INDEX IF NOT EXISTS idx_profiles_specialty ON profiles(specialty);
CREATE INDEX IF NOT EXISTS idx_profiles_is_available ON profiles(is_available);

-- Confirmation output
COMMENT ON COLUMN profiles.display_title IS 'الاسم الصريح مع الاختصاص للعرض';
COMMENT ON COLUMN profiles.is_available IS 'متاح للعمل (فقط للباحثين عن عمل)';
COMMENT ON COLUMN profiles.freelancer_type IS 'نوع العمل الحر: فني مقدّم خدمة أو زبون كشفي';
COMMENT ON COLUMN profiles.specialty IS 'الاختصاص المهني للفني (كهربائي، تبريد، سيراميك، إلخ)';
COMMENT ON COLUMN profiles.home_address IS 'عنوان البيت لطلب الخدمة الكشفية';
COMMENT ON COLUMN profiles.service_request IS 'شرح المشكلة أو الخدمة المطلوبة';
