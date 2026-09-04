/**
 * 🔄 ProLink — أداة نقل وتصدير البيانات من قاعدة البيانات القديمة إلى الجديدة
 * ==============================================================================
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const axios = require('axios');

dotenv.config();

const TABLES_ORDER = [
  'profiles',
  'jobs',
  'posts',
  'comments',
  'job_applications',
  'messages',
  'connections',
  'notifications',
  'groups',
  'group_members',
  'group_posts',
  'courses',
  'course_registrations',
  'employees',
  'attendance',
  'kiosk_devices',
  'reports',
  'security_logs'
];

async function runMigration() {
  const oldUrl = process.env.OLD_SUPABASE_URL || 'https://fwqeadonwddzvlyooeee.supabase.co';
  const oldKey = process.env.OLD_SUPABASE_KEY || 'sb_publishable_wTlOrKPwifHxBk_53Bk0BA__P6bJCPi';

  const newUrl = process.env.NEW_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const newKey = process.env.NEW_SUPABASE_SERVICE_KEY || process.env.NEW_SUPABASE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  console.log('═══════════════════════════════════════════════════════════');
  console.log('🚀 بدء فحص ونقل البيانات عبر التيرمنل');
  console.log(`📡 المشروع القديم: ${oldUrl}`);
  console.log(`🎯 المشروع الجديد: ${newUrl}`);
  console.log('═══════════════════════════════════════════════════════════\n');

  // 1. اختبار استجابة المشروع القديم أولاً بـ timeout محدد
  console.log('⏳ جاري فحص الاتصال بالمشروع القديم...');
  let oldOnline = false;
  try {
    const ping = await axios.get(`${oldUrl}/rest/v1/profiles?select=count`, {
      headers: {
        'apikey': oldKey,
        'Authorization': `Bearer ${oldKey}`
      },
      timeout: 8000
    });
    oldOnline = true;
    console.log('✅ السيرفر القديم متصل ويستجيب بنجاح!\n');
  } catch (err) {
    console.log(`\n❌ تعذر الاتصال بالسيرفر القديم (${err.message})`);
    if (err.response && err.response.status === 503) {
      console.log('🛑 سبب الخطأ: سوبابيز أغلقت خادم المشروع القديم (Error 503: Service Unavailable / Container Paused).');
      console.log('💡 الحل: يلزم الدخول على لوحة تحكم سوبابيز والضغط على Restore Project لتشغيل الخادم وسحب البيانات.');
    }
    return;
  }

  if (!oldOnline) return;

  const oldClient = createClient(oldUrl, oldKey);
  const newClient = createClient(newUrl, newKey);

  let totalMigrated = 0;

  for (const table of TABLES_ORDER) {
    process.stdout.write(`📦 نقل جدول [${table}]... `);
    try {
      // 1. جلب البيانات من المشروع القديم
      const { data, error } = await oldClient.from(table).select('*').limit(5000);

      if (error) {
        console.log(`⚠️ تعذر القراءة (${error.message})`);
        continue;
      }

      if (!data || data.length === 0) {
        console.log(`⚪ فارغ (0 صفوف)`);
        continue;
      }

      // 2. إدخال البيانات في المشروع الجديد
      const { error: insertError } = await newClient
        .from(table)
        .upsert(data, { ignoreDuplicates: true });

      if (insertError) {
        console.log(`❌ خطأ أثناء الإدخال: ${insertError.message}`);
      } else {
        console.log(`✅ تم نقل ${data.length} سجل بنجاح.`);
        totalMigrated += data.length;
      }
    } catch (e) {
      console.log(`❌ خطأ: ${e.message}`);
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log(`🎉 اكتملت عملية الترحيل! تم نقل ${totalMigrated} سجلاً بنجاح.`);
  console.log('═══════════════════════════════════════════════════════════');
}

runMigration().catch(console.error);
