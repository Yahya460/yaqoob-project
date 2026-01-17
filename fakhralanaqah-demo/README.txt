# Fakhr Alanaqah (Demo)

هذه نسخة تجريبية للواجهة + لوحة الموظف (QR) + صفحة شكل للوحة يعقوب.

## تشغيل محليًا
- افتح index.html عبر سيرفر محلي (مهم بسبب fetch)
- مثال:
  - Python: `python -m http.server 8000`
  - ثم افتح: http://localhost:8000

## نشر سريع (Netlify Drop)
1) افتح Netlify > Sites > Drop
2) اسحب المجلد كاملاً أو ملف zip بعد فكّه
3) سيعطيك رابط مثل: https://xxxx.netlify.app
4) من إعدادات Site name غيّره إلى: fakhralanaqah-demo

## QR
للتجربة، QR يمكن أن يحتوي:
- SKU مباشر مثل: B-001
أو
- رابط صفحة المنتج مثل: https://your-demo-link/product.html?sku=B001

=== Google Sheets Integration (تجربة) ===
1) أنشئ Google Sheet جديد.
2) أنشئ شيت باسم products، وضع الأعمدة: sku,name,sale,rent_day,deposit,cat,sizes,thumb
   أو استورد الملف: docs/products-template.csv
3) من Extensions > Apps Script ألصق محتوى: docs/apps-script.gs
4) من Project Settings > Script Properties أضف (اختياري) FA_TOKEN
5) Deploy > New deployment > Web app
   Execute as: Me | Who has access: Anyone
6) خذ رابط الـWeb App وادخله في /admin/settings.html


=== Stronger Mode (بدون إعدادات لكل جهاز) ===
1) بعد نشر Apps Script Web App، ضع الرابط مرة واحدة داخل: assets/config.js (apiUrl)
2) في Apps Script ضع Script Property: FA_ADMIN_PIN (رقم سري ليعقوب)
3) استخدم ملف السكربت: docs/apps-script-strong.gs بدل القديم.
4) الآن أي جهاز يفتح الموقع سيقرأ المنتجات من الشيت تلقائيًا (بدون إدخال إعدادات).
