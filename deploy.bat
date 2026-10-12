@echo off
chcp 65001 >nul
echo ═══════════════════════════════════════════════════════
echo   🚀 ProLink: نشر التعديلات إلى GitHub و Netlify Live
echo ═══════════════════════════════════════════════════════
echo.

echo 📦 1. إضافة وحفظ كافة التعديلات...
git add -A

set /p msg="📝 اكتب رسالة التحديث (أو اضغط Enter للافتراضي): "
if "%msg%"=="" set msg=تحديث جديد لتطبيق ProLink

git commit -m "%msg%"

echo.
echo 🚀 2. الرفع إلى GitHub...
git push origin main

if %errorlevel% equ 0 (
    echo.
    echo ✅ تم رفع التحديث بنجاح إلى GitHub!
    echo 🌐 سيقوم Netlify الآن ببناء ونشر التحديث تلقائياً خلال ثوانٍ.
) else (
    echo.
    echo ⚠️ حدث خطأ أثناء الرفع، تأكد من اتصال الإنترنت أو تسجيل دخول GitHub.
)

echo.
pause
