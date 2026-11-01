// النواة المشتركة لإرسال إشعارات الجوال (يستعملها api/push.js و api/cron.js) — الملفات التي تبدأ بـ _ لا تصبح مسارات
const webpush = require("web-push");
const FB = "https://school-faza-default-rtdb.firebaseio.com/school";
const PUB = process.env.VAPID_PUBLIC_KEY || "BJuDAE7GCkbs-9k2aDTf_gIiZzR8cZsEwyUHPalHSoMDRGfer0PdRbAIID5I5MkL1RkJjelx1ZPhz8arUtUSNWQ";
const DAY_CAP = 6000;
const fbGet = async p => { try { const r = await fetch(`${FB}/${p}.json`); return await r.json(); } catch { return null; } };
const fbPatch = async o => { try { await fetch(`${FB}.json`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(o) }); } catch {} };
const ksa = () => new Date(Date.now() + 3 * 3600e3).toISOString();
const norm = s => String(s || "").replace(/^(أ\.|ا\.|الأستاذ|الاستاذ|أ\/)\s*/, "").replace(/[ً-ْـ]/g, "").replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي").replace(/\s+/g, "");
// مطابقة الأسماء: كامل الاسم، أو الاسم الأول + اسم العائلة (حسن العيسي = حسن محمد العيسي)
const toks = s => String(s || "").replace(/^(أ\.|ا\.|الأستاذ|الاستاذ|أ\/)\s*/, "").replace(/[ً-ْـ]/g, "").replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي").split(/\s+/).filter(w => w && !/^(بن|ابن|بنت)$/.test(w));
const sameName = (a, b) => { if (!a || !b) return false; if (norm(a) === norm(b)) return true; const A = toks(a), B = toks(b); return A.length > 1 && B.length > 1 && A[0] === B[0] && A[A.length - 1] === B[B.length - 1]; };
const cut = (s, n) => String(s || "").slice(0, n);

// to = {all, roles:[], names:[], uids:[], cls:[], ti:[]} • m = {title, body, url, urlA, urlS, tag, urgent, by}
async function sendTo(to, m) {
  const PRIV = process.env.VAPID_PRIVATE_KEY; if (!PRIV) return { ok: false, code: "nokey", msg: "لم يُضبط المفتاح VAPID_PRIVATE_KEY في إعدادات Vercel" };
  webpush.setVapidDetails("mailto:" + (process.env.PUSH_EMAIL || "school@example.com"), PUB, PRIV);
  to = to || {}; const day = ksa().slice(0, 10);
  const used = +(await fbGet(`school-push-cnt/${day}`)) || 0;
  if (used >= DAY_CAP) return { ok: false, msg: "بلغ الإرسال السقف اليومي" };
  const payload = r => JSON.stringify({ title: cut(m.title || "مدرسة الأمير عبدالمجيد", 80), body: cut(m.body, 180), url: cut((r === "a" && m.urlA) || (r === "s" && m.urlS) || m.url || "/", 200), tag: cut(m.tag, 60) || undefined });
  const all = (await fbGet("school-push")) || {};
  const roles = new Set(to.roles || []), names = (to.names || []).filter(Boolean), uids = new Set(to.uids || []), cls = new Set(to.cls || []), tis = new Set((to.ti || []).map(Number));
  const targets = [];
  Object.entries(all).forEach(([uid, devs]) => Object.entries(devs || {}).forEach(([id, d]) => {
    if (!d || !d.sub || !d.sub.endpoint) return;
    const hit = to.all || roles.has(d.r) || uids.has(uid) || (d.n && d.r !== "s" && names.some(n => sameName(n, d.n))) || (d.r === "s" && d.ck && cls.has(d.ck)) || (d.r !== "s" && d.ti != null && tis.has(+d.ti));
    if (hit) targets.push({ uid, id, sub: d.sub, r: d.r });
  }));
  const list = targets.slice(0, Math.max(0, DAY_CAP - used));
  let sent = 0; const dead = {};
  for (let i = 0; i < list.length; i += 50) {
    await Promise.all(list.slice(i, i + 50).map(async t => {
      try { await webpush.sendNotification(t.sub, payload(t.r), { TTL: 86400, urgency: m.urgent ? "high" : "normal" }); sent++; }
      catch (e) { if (e && (e.statusCode === 404 || e.statusCode === 410)) dead[`school-push/${t.uid}/${t.id}`] = null; }
    }));
  }
  const lk = Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  await fbPatch({ ...dead, [`school-push-cnt/${day}`]: { ".sv": { increment: sent } }, [`school-push-log/${day}/${lk}`]: { t: cut(m.title, 80), b: cut(m.body, 120), by: cut(m.by, 60), n: targets.length, s: sent, at: ksa().slice(11, 16) } });
  return { ok: true, matched: targets.length, sent, removed: Object.keys(dead).length };
}
module.exports = { sendTo, fbGet, fbPatch, ksa, sameName };
