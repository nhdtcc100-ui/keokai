/**
 * 🔥 Smoke Test — 50 مستخدم متزامن
 * الهدف: التحقق الأساسي من أن التطبيق يعمل بدون أخطاء
 * كيف تشغله: k6 run tests/load/smoke-test.js
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const jobsLoadTime = new Trend('jobs_load_time');

// ✅ [SECURITY FIX CRIT-1] API keys loaded from k6 environment variables ONLY.
// Usage: k6 run -e SUPABASE_URL=https://... -e SUPABASE_ANON_KEY=eyJ... smoke-test.js
// Never hardcode real credentials in test files.
const SUPABASE_URL     = __ENV.SUPABASE_URL      || 'http://localhost:54321';
const SUPABASE_ANON_KEY = __ENV.SUPABASE_ANON_KEY || 'local-anon-key-for-docker-testing';

export const options = {
  vus: 50,           // 50 مستخدم متزامن
  duration: '2m',    // لمدة دقيقتين
  thresholds: {
    http_req_duration: ['p(95)<2000'],  // 95% أسرع من 2 ثانية
    errors: ['rate<0.01'],               // أقل من 1% أخطاء
  },
};

const HEADERS = {
  'apikey': SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
};

export default function () {
  // 1️⃣ جلب قائمة الوظائف
  const jobsRes = http.get(
    `${SUPABASE_URL}/rest/v1/jobs?select=id,title,company,location,salary,job_type,is_active&limit=20&order=created_at.desc`,
    { headers: HEADERS }
  );

  const jobsOk = check(jobsRes, {
    '✅ Jobs API status 200': (r) => r.status === 200,
    '✅ Jobs loads < 1s': (r) => r.timings.duration < 1000,
    '✅ Returns JSON array': (r) => Array.isArray(JSON.parse(r.body)),
  });

  jobsLoadTime.add(jobsRes.timings.duration);
  errorRate.add(!jobsOk);

  sleep(0.5);

  // 2️⃣ جلب المنشورات
  const postsRes = http.get(
    `${SUPABASE_URL}/rest/v1/posts?select=id,content,author_name,likes_count,created_at&limit=10&order=created_at.desc`,
    { headers: HEADERS }
  );

  check(postsRes, {
    '✅ Posts API status 200': (r) => r.status === 200,
    '✅ Posts loads < 1s': (r) => r.timings.duration < 1000,
  });

  sleep(0.5);

  // 3️⃣ جلب ملفات المستخدمين
  const profilesRes = http.get(
    `${SUPABASE_URL}/rest/v1/profiles?select=id,name,role,location,avatar_url&limit=20`,
    { headers: HEADERS }
  );

  check(profilesRes, {
    '✅ Profiles API status 200': (r) => r.status === 200,
    '✅ Profiles loads < 1.5s': (r) => r.timings.duration < 1500,
  });

  sleep(1);
}

export function handleSummary(data) {
  return {
    'tests/load/reports/smoke-test-report.json': JSON.stringify(data, null, 2),
  };
}
