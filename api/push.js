// 🔔 إشعارات الجوال (Web Push) — المسار الذي يستدعيه الموقع: /api/push
// • المفتاح الخاص لا يُكتب هنا: يُضاف في Vercel ← Settings ← Environment Variables باسم VAPID_PRIVATE_KEY
// • اشتراكات الأجهزة: school/school-push/{uid}/{id} = {sub, n, nn, r:"t"|"a"|"s", ck, ti, at}
//   uid: "u_" + بصمة الموظف • "s_" + رقم الطالب
// • الاستهداف to = {all, roles:[], names:[], uids:[], cls:[], ti:[]} — يُرسل لمن يطابق أيًّا منها
// • منطق الإرسال في api/_pushcore.js (مشترك مع التذكيرات المجدولة api/cron.js)
const { sendTo } = require("./_pushcore.js");
const ALLOWED = ["https://school-website1-sigma.vercel.app"];

module.exports = async function handler(req, res) {
  const origin = req.headers.origin || "";
  if (ALLOWED.includes(origin)) res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ ok: false, msg: "Method not allowed" });
  if (!ALLOWED.includes(origin)) return res.status(403).json({ ok: false, msg: "غير مسموح من خارج موقع المدرسة" });
  try {
    const b = req.body || {};
    if (b.kind === "ping") return res.status(200).json({ ok: !!process.env.VAPID_PRIVATE_KEY });
    return res.status(200).json(await sendTo(b.to, b));
  } catch (e) {
    return res.status(500).json({ ok: false, msg: "خطأ: " + e.message });
  }
};
