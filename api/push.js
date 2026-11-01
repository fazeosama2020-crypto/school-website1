// 🔔 إشعارات الجوال (Web Push) — المسار الذي يستدعيه الموقع: /api/push
// • المفتاح الخاص لا يُكتب هنا: يُضاف في Vercel ← Settings ← Environment Variables باسم VAPID_PRIVATE_KEY
// • اشتراكات الأجهزة: school/school-push/{uid}/{id} = {sub, n, nn, r:"t"|"a"|"s", ck, ti, at}
//   uid: "u_" + بصمة الموظف • "s_" + رقم الطالب
// • الاستهداف to = {all, roles:[], names:[], uids:[], cls:[], ti:[]} — يُرسل لمن يطابق أيًّا منها
// • عدّاد يومي school-push-cnt/{يوم} وسجل school-push-log/{يوم}
const webpush = require("web-push");
const ALLOWED = ["https://school-website1-sigma.vercel.app"];
const FB = "https://school-faza-default-rtdb.firebaseio.com/school";
const PUB = process.env.VAPID_PUBLIC_KEY || "BJuDAE7GCkbs-9k2aDTf_gIiZzR8cZsEwyUHPalHSoMDRGfer0PdRbAIID5I5MkL1RkJjelx1ZPhz8arUtUSNWQ";
const DAY_CAP = 6000; // سقف يومي لعدد الإشعارات المرسلة (حماية من الإساءة)

const fbGet = async p => { try { const r = await fetch(`${FB}/${p}.json`); return await r.json(); } catch { return null; } };
const fbPatch = async o => { try { await fetch(`${FB}.json`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(o) }); } catch {} };
const ksa = () => new Date(Date.now() + 3 * 3600e3).toISOString();
const norm = s => String(s || "").replace(/^(أ\.|ا\.|الأستاذ|الاستاذ|أ\/)\s*/, "").replace(/[ً-ْـ]/g, "").replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي").replace(/\s+/g, "");
const cut = (s, n) => String(s || "").slice(0, n);

module.exports = async function handler(req, res) {
  const origin = req.headers.origin || "";
  if (ALLOWED.includes(origin)) res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ ok: false, msg: "Method not allowed" });
  if (!ALLOWED.includes(origin)) return res.status(403).json({ ok: false, msg: "غير مسموح من خارج موقع المدرسة" });
  const PRIV = process.env.VAPID_PRIVATE_KEY;
  if (!PRIV) return res.status(200).json({ ok: false, code: "nokey", msg: "لم يُضبط المفتاح VAPID_PRIVATE_KEY في إعدادات Vercel" });
  try {
    webpush.setVapidDetails("mailto:" + (process.env.PUSH_EMAIL || "school@example.com"), PUB, PRIV);
    const b = req.body || {};
    if (b.kind === "ping") return res.status(200).json({ ok: true });
    const to = b.to || {}; const day = ksa().slice(0, 10);
    const used = +(await fbGet(`school-push-cnt/${day}`)) || 0;
    if (used >= DAY_CAP) return res.status(200).json({ ok: false, msg: "بلغ الإرسال السقف اليومي" });
    // الرابط حسب الدور: url للمعلم • urlA للإداري • urlS للطالب
    const payload = r => JSON.stringify({ title: cut(b.title || "مدرسة الأمير عبدالمجيد", 80), body: cut(b.body, 180), url: cut((r === "a" && b.urlA) || (r === "s" && b.urlS) || b.url || "/", 200), tag: cut(b.tag, 60) || undefined });
    const all = (await fbGet("school-push")) || {};
    const roles = new Set(to.roles || []), names = new Set((to.names || []).map(norm).filter(Boolean)), uids = new Set(to.uids || []), cls = new Set(to.cls || []), tis = new Set((to.ti || []).map(Number));
    const targets = [];
    Object.entries(all).forEach(([uid, devs]) => Object.entries(devs || {}).forEach(([id, d]) => {
      if (!d || !d.sub || !d.sub.endpoint) return;
      const hit = to.all || roles.has(d.r) || uids.has(uid) || (d.nn && names.has(d.nn)) || (d.r === "s" && d.ck && cls.has(d.ck)) || (d.r !== "s" && d.ti != null && tis.has(+d.ti));
      if (hit) targets.push({ uid, id, sub: d.sub, r: d.r });
    }));
    const list = targets.slice(0, Math.max(0, DAY_CAP - used));
    let sent = 0; const dead = {};
    for (let i = 0; i < list.length; i += 50) {
      await Promise.all(list.slice(i, i + 50).map(async t => {
        try { await webpush.sendNotification(t.sub, payload(t.r), { TTL: 86400, urgency: b.urgent ? "high" : "normal" }); sent++; }
        catch (e) { if (e && (e.statusCode === 404 || e.statusCode === 410)) dead[`school-push/${t.uid}/${t.id}`] = null; }
      }));
    }
    const lk = Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    await fbPatch({ ...dead, [`school-push-cnt/${day}`]: { ".sv": { increment: sent } }, [`school-push-log/${day}/${lk}`]: { t: cut(b.title, 80), b: cut(b.body, 120), by: cut(b.by, 60), n: targets.length, s: sent, at: ksa().slice(11, 16) } });
    return res.status(200).json({ ok: true, matched: targets.length, sent, removed: Object.keys(dead).length });
  } catch (e) {
    return res.status(500).json({ ok: false, msg: "خطأ: " + e.message });
  }
};
