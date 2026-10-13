<div align="center">

# 🔗 ProLink — منصة التوظيف المهنية العراقية

[![CI](https://github.com/nhdtcc100-ui/keokai/actions/workflows/ci.yml/badge.svg)](https://github.com/nhdtcc100-ui/keokai/actions)
[![Netlify Status](https://api.netlify.com/api/v1/badges/YOUR_NETLIFY_BADGE_ID/deploy-status)](https://app.netlify.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

</div>

---

## 📋 نظرة عامة

**ProLink** هي منصة توظيف مهنية متكاملة مصممة للسوق العراقي، تربط أصحاب العمل بالباحثين عن عمل بشكل مباشر وسريع.

### ✨ الميزات الرئيسية:
- 👥 **ملفات مهنية شاملة** — صور، مهارات، سيرة ذاتية
- 💼 **نشر واستقبال طلبات الوظائف** — مع إشعارات فورية عند القبول أو الرفض
- 📚 **الدورات التدريبية** — تسجيل ومتابعة الطلبات مباشرة
- 💬 **شات المجموعات** — محادثات جماعية مع اشتراكات مباشرة
- 🔔 **إشعارات لحظية** — عبر Supabase Realtime + polling احتياطي كل 3 ثوانٍ
- 🎥 **مكالمات مرئية وصوتية** — عبر WebRTC / PeerJS
- 🌐 **أخبار مهنية** — عبر قنوات Telegram متخصصة
- 📊 **لوحة تحكم المشرف** — إدارة المستخدمين والتطبيقات والدعم الفني
- 📱 **تطبيق أندرويد** — عبر Capacitor (PWA + Native)

---

## 🏗️ التقنيات المستخدمة

| الطبقة | التقنية |
|--------|---------|
| Frontend | React 19, TypeScript, Vite 6 |
| Styling | Vanilla CSS + CSS Variables |
| Backend/DB | Supabase (PostgreSQL + Auth + Realtime + Storage) |
| AI | Google Gemini AI |
| Mobile | Capacitor (Android) |
| Auth | Supabase Auth + Firebase Auth |
| Realtime | Supabase WebSockets + HTTP Polling Heartbeat |
| CI/CD | GitHub Actions + Netlify Auto Deploy |

---

## 🚀 الرفع إلى GitHub والنشر على Netlify

### الطريقة السريعة (ضغطة واحدة):
```bash
# بعد أي تعديل — رفع كل شيء إلى GitHub
npm run ship
```
أو بالضغط مرتين على ملف **`deploy.bat`** في مجلد المشروع.

---

### الإعداد الأولي (للمرة الأولى فقط):

#### 1. استنساخ المشروع
```bash
git clone https://github.com/nhdtcc100-ui/keokai.git
cd keokai
npm install
```

#### 2. إعداد المتغيرات البيئية
```bash
# انسخ ملف المثال وعدّله بالقيم الحقيقية
cp .env.example .env
```

ثم افتح ملف `.env` وضع القيم التالية (من لوحة Supabase → Project Settings → API):
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

#### 3. تشغيل قاعدة البيانات
افتح **Supabase → SQL Editor** وشغّل ملف:
```
FIX_ALL_ISSUES.sql
```
هذا الملف ينشئ ويُهيئ كل الجداول (groups, group_posts, group_members, job_applications, notifications, support_messages...) مع سياسات الأمان الكاملة.

#### 4. تشغيل التطبيق محلياً
```bash
npm run dev
# التطبيق يعمل على: http://localhost:3000
```

---

## 🔄 دورة التطوير والنشر (CI/CD)

```
أجري تعديل في الكود
        │
        ▼
   npm run ship
   (git add + commit + push)
        │
        ▼
  GitHub (keokai)
   ┌────┴────┐
   │         │
   ▼         ▼
GitHub     Netlify
Actions    Auto-Build
(CI Test)  (npm run build)
           │
           ▼
      🌐 موقع لايف
```

### ✅ ما يحدث تلقائياً عند كل Push:

1. **GitHub Actions** يشغّل:
   - فحص TypeScript (`tsc --noEmit`) — لا يرفع الكود المكسور
   - بناء إنتاج (`npm run build`) — تأكيد أن البناء يعمل

2. **Netlify** يشغّل تلقائياً:
   - `npm run build` لبناء ملفات `dist/`
   - نشرها على الموقع المباشر فوراً

---

## 📦 أوامر المشروع

| الأمر | الوظيفة |
|-------|---------|
| `npm run dev` | تشغيل المشروع محلياً (منفذ 3000) |
| `npm run build` | بناء نسخة الإنتاج في مجلد `dist/` |
| `npm run lint` | فحص أخطاء TypeScript |
| `npm run ship` | رفع كل التعديلات إلى GitHub مباشرةً |
| `npm run preview` | معاينة نسخة الإنتاج محلياً |

---

## 🌐 ربط Netlify بـ GitHub (مرة واحدة فقط)

1. ادخل **[app.netlify.com](https://app.netlify.com)** → **Add new site** → **Import an existing project**
2. اختر **GitHub** ثم اختر مستودع **`keokai`**
3. Netlify سيقرأ الإعدادات تلقائياً من `netlify.toml`:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Node version: `20`
4. أضف المتغيرات السرية في **Site Settings → Environment variables**:
   ```
   VITE_SUPABASE_URL
   VITE_SUPABASE_ANON_KEY
   VITE_GEMINI_API_KEY
   ```
5. اضغط **Deploy site** ✅

---

## 🔑 إعداد GitHub Actions Secrets (اختياري للبناء الكامل)

في **GitHub → Repository Settings → Secrets and variables → Actions**، أضف:
```
VITE_SUPABASE_URL = https://ubeqmsyyyojojmswmidq.supabase.co
VITE_SUPABASE_ANON_KEY = your_anon_key_here
```

---

## 📁 هيكل المشروع

```
keokai/
├── .github/
│   └── workflows/
│       └── ci.yml          ← فحص تلقائي عند كل Push
├── src/
│   ├── components/
│   │   ├── features/       ← صفحات وميزات التطبيق
│   │   └── layout/         ← Navbar, Navigation, MobileNav
│   ├── contexts/
│   │   └── AppContext.tsx  ← إدارة الحالة العامة + Realtime
│   ├── lib/
│   │   ├── services/       ← Supabase queries (jobs, groups, profiles...)
│   │   ├── hooks/          ← Custom React hooks
│   │   └── utils/          ← أدوات مشتركة
│   └── types/              ← TypeScript types
├── public/                 ← أيقونات + PWA manifest
├── android/                ← ملفات تطبيق Android (Capacitor)
├── FIX_ALL_ISSUES.sql      ← إعداد قاعدة البيانات كاملاً
├── netlify.toml            ← إعدادات Netlify
├── deploy.bat              ← نشر بضغطة واحدة (Windows)
├── .env.example            ← نموذج المتغيرات البيئية
└── package.json            ← إعدادات المشروع والأوامر
```

---

## 🗄️ قاعدة البيانات (Supabase)

الجداول الرئيسية وأدوارها:

| الجدول | الوظيفة |
|--------|---------|
| `profiles` | بيانات المستخدمين والملفات الشخصية |
| `jobs` | الوظائف المنشورة |
| `job_applications` | طلبات التوظيف (مع إشعار تلقائي عند التغيير) |
| `courses` | الدورات التدريبية |
| `course_registrations` | تسجيلات الدورات (مع إشعار تلقائي) |
| `groups` | المجموعات المهنية |
| `group_members` | أعضاء المجموعات |
| `group_posts` | رسائل وشات المجموعات |
| `notifications` | الإشعارات الداخلية |
| `support_messages` | رسائل الدعم الفني |
| `connections` | طلبات التواصل المهني |
| `messages` | الرسائل الخاصة |

---

## 📖 التطورات الأخيرة (Changelog)

| الإصدار | التعديل |
|---------|---------|
| ✅ v1.5 | تنظيف الملفات المؤقتة + CI/CD كامل |
| ✅ v1.4 | نظام نشر تلقائي `deploy.bat` + `npm run ship` |
| ✅ v1.3 | شات المجموعات + مزامنة هجينة (Realtime + Polling كل 3ث) |
| ✅ v1.2 | إصلاح طلبات الوظائف + الدورات + إشعارات القبول/الرفض |
| ✅ v1.1 | إصلاح خطأ 500 في group_members (Infinite Recursion RLS) |
| ✅ v1.0 | الرفع الأول للمشروع الكامل |

---

## ⚡ نصائح مهمة

> **🔒 لا ترفع ملف `.env` أبداً** — يحتوي على كلمات مرور ومفاتيح سرية.

> **🌐 مفتاح Supabase الأنون** — يجب أن يبدأ بـ `eyJhbGci...` (JWT) وليس `sb_publishable_...` لكي تعمل WebSockets.

> **📱 للرفع على أندرويد:** شغّل `npm run build:android` ثم افتح Android Studio.

---

## 📞 الدعم

لأي مشكلة تقنية، ارجع إلى ملف `FIX_ALL_ISSUES.sql` وشغّله في Supabase SQL Editor.
