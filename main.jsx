import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

// 🔄 بعد كل تحديث للموقع تتغير أسماء ملفاته؛ الصفحة المفتوحة من قبل التحديث قد تطلب ملفاً قديماً لم يعد موجوداً
// فتظهر رسالة "Failed to fetch dynamically imported module". هنا نعيد تحميل الصفحة تلقائياً مرة واحدة لجلب النسخة الجديدة.
const RELOAD_KEY = "app-chunk-reload";
function reloadOnce(e) {
  try {
    const last = +sessionStorage.getItem(RELOAD_KEY) || 0;
    if (Date.now() - last < 30000) return; // منع التكرار إن كانت المشكلة غير ذلك
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  } catch {}
  if (e && e.preventDefault) e.preventDefault();
  window.location.reload();
}
window.addEventListener("vite:preloadError", reloadOnce);
window.addEventListener("unhandledrejection", e => {
  const m = String((e && e.reason && (e.reason.message || e.reason)) || "");
  if (/dynamically imported module|Importing a module script failed|error loading dynamically imported module/i.test(m)) reloadOnce();
});

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
