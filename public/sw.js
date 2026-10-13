// عامل خدمة خفيف: لا يخزّن الموقع (حتى تصل التحديثات فوراً) — وظيفته التثبيت كتطبيق والإشعارات فقط
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));
// إشعارات مُرسلة من الخادم (للمرحلة القادمة)
self.addEventListener("push", e => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch { d = { title: "مدرسة الأمير عبدالمجيد", body: e.data && e.data.text() }; }
  e.waitUntil(self.registration.showNotification(d.title || "مدرسة الأمير عبدالمجيد", { body: d.body || "", icon: "/icon-192.png", badge: "/icon-192.png", dir: "rtl", lang: "ar", tag: d.tag, data: { url: d.url || "/" } }));
});
// الضغط على الإشعار يفتح الموقع (أو يعيد التركيز عليه)
self.addEventListener("notificationclick", e => {
  e.notification.close(); const url = (e.notification.data && e.notification.data.url) || "/";
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(L => { for (const c of L) { if ("focus" in c) { c.navigate && c.url !== url && c.navigate(url).catch(() => {}); return c.focus(); } } return self.clients.openWindow(url); }));
});
