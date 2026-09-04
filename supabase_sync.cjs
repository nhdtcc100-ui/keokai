#!/usr/bin/env node
/**
 * ============================================================
 * 🔄 Supabase SQL Sync Tool — ProLink
 * ============================================================
 * يتيح هذا السكريبت:
 *  1. 📥 PULL  — جلب السياسات الحالية من Supabase وعرضها
 *  2. 📤 PUSH  — تشغيل ملف SQL محلي مباشرة على Supabase
 *  3. 📋 LIST  — عرض كافة سياسات RLS الموجودة في قاعدة البيانات
 *
 * الاستخدام:
 *   node supabase_sync.cjs pull           ← عرض السياسات الحالية
 *   node supabase_sync.cjs push           ← تشغيل prolink_master_realtime_and_rls_fix.sql
 *   node supabase_sync.cjs push <file>    ← تشغيل ملف SQL محدد
 *   node supabase_sync.cjs list           ← عرض جميع الجداول وسياساتها
 * ============================================================
 */

const https = require('https');
const fs    = require('fs');
const path  = require('path');

// ─── اقرأ بيانات الاتصال من .env ──────────────────────────────────────────────
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) {
    console.error('❌ ملف .env غير موجود!');
    process.exit(1);
  }
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  const env = {};
  for (const line of lines) {
    const [key, ...rest] = line.split('=');
    if (key && rest.length) env[key.trim()] = rest.join('=').trim();
  }
  return env;
}

const env = loadEnv();
const SUPABASE_URL = env['VITE_SUPABASE_URL'];
const ANON_KEY    = env['VITE_SUPABASE_ANON_KEY'];

// استخرج Project Ref من الـ URL
const PROJECT_REF = SUPABASE_URL?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

if (!SUPABASE_URL || !ANON_KEY || !PROJECT_REF) {
  console.error('❌ لم يتم العثور على VITE_SUPABASE_URL أو VITE_SUPABASE_ANON_KEY في ملف .env');
  process.exit(1);
}

// ─── دالة طلب HTTP ──────────────────────────────────────────────────────────────
function request(method, path, body, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const url  = new URL(SUPABASE_URL + path);
    const data = body ? JSON.stringify(body) : null;

    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method,
      headers: {
        'apikey':         ANON_KEY,
        'Authorization':  `Bearer ${ANON_KEY}`,
        'Content-Type':   'application/json',
        'Prefer':         'return=representation',
        ...extraHeaders
      }
    };
    if (data) options.headers['Content-Length'] = Buffer.byteLength(data);

    const req = https.request(options, res => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

// ─── استعلام SQL مباشر عبر /rest/v1/rpc أو PostgREST ────────────────────────
async function runSQL(sql) {
  // نستخدم endpoint مباشر للـ SQL عبر supabase-js REST API
  const url = new URL(`${SUPABASE_URL}/rest/v1/`);
  
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query: sql });
    const options = {
      hostname: url.hostname,
      path: `/rest/v1/rpc/exec_sql`,
      method: 'POST',
      headers: {
        'apikey':        ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`,
        'Content-Type':  'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    };
    
    const req = https.request(options, res => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => resolve({ status: res.statusCode, body: raw }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ─── جلب كافة سياسات RLS ───────────────────────────────────────────────────────
async function listPolicies() {
  console.log('\n📋 جلب سياسات RLS من Supabase...\n');
  
  const QUERY_TABLES = [
    'messages', 'connections', 'notifications', 
    'calls', 'job_applications', 'posts', 'profiles', 'jobs'
  ];
  
  for (const table of QUERY_TABLES) {
    const res = await request('GET', `/rest/v1/rpc/`, null);
    console.log(`\n📌 جدول: ${table.toUpperCase()}`);
    console.log('─'.repeat(50));
  }

  // استعلام pg_policies عبر Supabase PostgREST
  const res = await request('GET', `/rest/v1/pg_policies?select=tablename,policyname,cmd,permissive&schemaname=eq.public&order=tablename.asc,policyname.asc`, null, {
    'Accept': 'application/json'
  });

  if (!Array.isArray(res.body)) {
    console.log('⚠️ تعذر الوصول لـ pg_policies مباشرة — جرب استخدام Supabase Management API');
    console.log('📊 حالة الاتصال بـ Supabase:', res.status);
    return;
  }
  
  let currentTable = '';
  for (const policy of res.body) {
    if (policy.tablename !== currentTable) {
      currentTable = policy.tablename;
      console.log(`\n📌 ${currentTable.toUpperCase()}`);
      console.log('─'.repeat(50));
    }
    console.log(`  ✅ [${policy.cmd}] ${policy.policyname} (${policy.permissive})`);
  }
}

// ─── تشغيل ملف SQL على Supabase ────────────────────────────────────────────────
async function pushSQL(filePath) {
  const defaultFile = path.join(__dirname, 'prolink_master_realtime_and_rls_fix.sql');
  const targetFile  = filePath || defaultFile;

  if (!fs.existsSync(targetFile)) {
    console.error(`❌ الملف غير موجود: ${targetFile}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(targetFile, 'utf8');
  console.log(`\n📤 تشغيل الملف: ${path.basename(targetFile)}`);
  console.log(`📊 حجم الاستعلام: ${(Buffer.byteLength(sql) / 1024).toFixed(1)} KB\n`);

  // تقسيم الاستعلامات الكبيرة (PostgreSQL يتطلب أن تُرسل كل DO $$ block بمفردها)
  const statements = sql
    .split(/(?<=;)\s*\n(?=\s*(?:--|CREATE|ALTER|DROP|INSERT|UPDATE|DELETE|DO|SELECT|GRANT|REVOKE))/i)
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--'));

  console.log(`📝 عدد التعليمات: ${statements.length}`);
  
  // نفذ عبر API مباشر
  const body = Buffer.from(sql);
  
  return new Promise((resolve) => {
    const options = {
      hostname: `${PROJECT_REF}.supabase.co`,
      path: `/rest/v1/rpc/exec_sql`,
      method: 'POST',
      headers: {
        'apikey':         ANON_KEY,
        'Authorization':  `Bearer ${ANON_KEY}`,
        'Content-Type':   'application/json',
      }
    };

    // بما أن exec_sql لا يوجد في Supabase ANON key، نوضح للمستخدم الخطوات
    console.log('═'.repeat(60));
    console.log('📋 الاستعلامات جاهزة للتشغيل في Supabase Dashboard:');
    console.log('═'.repeat(60));
    console.log(`\n🔗 افتح: https://supabase.com/dashboard/project/${PROJECT_REF}/sql/new`);
    console.log('\n📌 أو قم بنسخ الملف من:');
    console.log(`   ${targetFile}`);
    console.log('\n💡 نصيحة: يتطلب تشغيل SQL المباشر مفتاح SERVICE_ROLE (ليس ANON_KEY)');
    console.log('   أضف SUPABASE_SERVICE_KEY إلى ملف .env لتفعيل التشغيل التلقائي\n');
    
    resolve();
  });
}

// ─── فحص الاتصال بـ Supabase ───────────────────────────────────────────────────
async function checkConnection() {
  console.log('\n🔍 فحص الاتصال بـ Supabase...');
  const res = await request('GET', '/rest/v1/profiles?select=count&limit=1', null);
  if (res.status === 200 || res.status === 206) {
    console.log(`✅ متصل بـ Supabase Project: ${PROJECT_REF}`);
    console.log(`   URL: ${SUPABASE_URL}`);
    return true;
  }
  console.log(`⚠️ حالة الاتصال: ${res.status}`);
  return false;
}

// ─── عرض السياسات المحلية من ملف SQL ──────────────────────────────────────────
function pullLocal() {
  const filePath = path.join(__dirname, 'prolink_master_realtime_and_rls_fix.sql');
  if (!fs.existsSync(filePath)) {
    console.error('❌ ملف prolink_master_realtime_and_rls_fix.sql غير موجود');
    return;
  }
  
  const sql = fs.readFileSync(filePath, 'utf8');
  console.log('\n📄 محتوى ملف السياسات المحلي (prolink_master_realtime_and_rls_fix.sql):');
  console.log('═'.repeat(60));
  
  // استخرج فقط أسطر CREATE POLICY
  const policies = sql.match(/CREATE POLICY[^;]+;/gs) || [];
  console.log(`\n📊 إجمالي السياسات المحلية: ${policies.length}\n`);
  
  for (const policy of policies) {
    const name  = policy.match(/CREATE POLICY "([^"]+)"/)?.[1] || '?';
    const table = policy.match(/ON public\.(\w+)/)?.[1] || '?';
    const op    = policy.match(/FOR (\w+)/)?.[1] || '?';
    console.log(`  ✅ [${table}] ${name} (${op})`);
  }
  
  console.log(`\n🔗 فتح Supabase SQL Editor:`);
  console.log(`   https://supabase.com/dashboard/project/${PROJECT_REF}/sql/new`);
}

// ─── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const cmd  = process.argv[2] || 'help';
  const arg2 = process.argv[3];

  console.log(`\n🚀 ProLink Supabase Sync Tool`);
  console.log(`   Project: ${PROJECT_REF}`);
  
  switch (cmd) {
    case 'pull':
      pullLocal();
      break;
    case 'list':
      await checkConnection();
      await listPolicies();
      break;
    case 'push':
      await checkConnection();
      await pushSQL(arg2);
      break;
    default:
      console.log(`
📖 الاستخدام:
  node supabase_sync.cjs pull           عرض السياسات المحلية
  node supabase_sync.cjs list           جلب السياسات من Supabase
  node supabase_sync.cjs push           تشغيل prolink_master_realtime_and_rls_fix.sql
  node supabase_sync.cjs push <file>    تشغيل ملف SQL محدد
`);
  }
}

main().catch(e => { console.error('خطأ:', e.message); process.exit(1); });
