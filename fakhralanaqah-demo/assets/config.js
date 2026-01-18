// Fakhr Alanaqah - site-wide config (set once, works on all devices)
window.FA_CONFIG = {
  // ضع رابط Web App (Apps Script) هنا مرة واحدة ثم ارفع الموقع:
  // مثال: "https://script.google.com/macros/s/XXXX/exec"
  apiUrl: "https://script.google.com/macros/s/AKfycbwf37uGhSsXHSLpLSEPlC7c0E2X3-a4MjqJ7PHufzXeXKynAGGMamZvqNWng4JwmAup/exec",

  // ===== بدون حماية (مؤقتاً) =====
  // لن يظهر طلب PIN في الواجهة.
  // إذا كان Web App عندك ما زال يطلب PIN، ضع هنا نفس الرقم الذي في Apps Script.
  adminPin: "2025",
  staffPin: "2025",

  // (اختياري) تلميح للـPIN (لا تكتب الرقم نفسه هنا)
  adminPinHint: "PIN يعقوب",
  staffPinHint: "PIN الموظف"
};
