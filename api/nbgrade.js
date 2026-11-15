// ✅ تصحيح إجابات الطلاب في «مراجع نافس» على الخادم — مفاتيح الإجابات لا تصل إلى جهاز الطالب قبل التصحيح
// POST { b: "math"|"sci"|"ar", pages: [{ p: رقم الصفحة, a: { رقم السؤال: الإجابة } }] }
// ← { ok, res: { [p]: { r:{i:1 صحيحة|0 خاطئة|-1 بانتظار المعلم}, ci:{i:الخيار الصحيح}, k:{i:الإجابة النموذجية}, c, g, t, p } } }
const K = require("./_nbkeys.js");

const LET = ["أ", "ب", "ج", "د"];
const stripH = h => String(h || "").replace(/<br\s*\/?>/g, " ").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim();
const kindOf = (t, a) => /اختيار من متعدد/.test(t) ? "m" : /صواب\/خطأ/.test(t) ? "tf" : (/^(أكمل|أكمل الحل|حساب ذهني)$/.test(stripH(t)) && stripH(a).length <= 40) ? "s" : "o";
const dig = s => String(s).replace(/[٠-٩]/g, d => "٠١٢٣٤٥٦٧٨٩".indexOf(d)).replace(/[۰-۹]/g, d => "۰۱۲۳۴۵۶۷۸۹".indexOf(d));
const norm = s => dig(stripH(s)).replace(/[ً-ْـ]/g, "").replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي").replace(/[−–—]/g, "-").replace(/[٫,]/g, ".").replace(/×/g, "x").replace(/[\s()]/g, "").replace(/(ريالا|ريال|سم|كم|درجه|°)$/, "").replace(/\.$/, "");
function shortOk(key, v) {
  const k = stripH(key), a = String(v || ""); if (!a.trim()) return false;
  const nk = norm(k), na = norm(a); if (!na) return false; if (na === nk) return true;
  if (k.includes("=") && norm(k.split("=").pop()) === na) return true;
  const parts = s => s.split(/[،؛;]|\sو\s|\sأو\s/).map(norm).filter(Boolean);
  const kp = parts(k), ap = parts(a);
  return kp.length > 1 && kp.length === ap.length && kp.every(x => ap.includes(x));
}
function grade(b, pages) {
  const out = {};
  for (const { p, a } of pages) {
    const L = (K[b] && K[b][p]) || []; const A = a && typeof a === "object" ? a : {};
    const r = {}, ci = {}, k = {}; let c = 0, g = 0, pn = 0;
    L.forEach(([n, t, key], i) => {
      const kd = kindOf(t, key), v = A[i], empty = v == null || String(v).trim() === "";
      if (kd === "m") { const s = stripH(key); ci[i] = LET.indexOf(s[0]); const ex = String(key).split("—").slice(1).join("—").trim(); if (ex) k[i] = ex; r[i] = !empty && +v === ci[i] ? 1 : 0; }
      else if (kd === "tf") { ci[i] = /^صواب/.test(stripH(key)) ? "ص" : "خ"; k[i] = key; r[i] = v === ci[i] ? 1 : 0; }
      else { k[i] = key; r[i] = empty ? 0 : kd === "s" && shortOk(key, v) ? 1 : -1; }
      if (r[i] === 1) c++; if (r[i] === -1) pn++; else g++;
    });
    out[p] = { r, ci, k, c, g, t: L.length, p: pn };
  }
  return out;
}

module.exports = async function handler(req, res) {
  if (req.method === "GET") return res.status(200).json({ ok: true });
  if (req.method !== "POST") return res.status(405).json({ ok: false });
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const b = String(body.b || ""); if (!K[b]) return res.status(400).json({ ok: false, msg: "book" });
    const pages = (Array.isArray(body.pages) ? body.pages : []).slice(0, 12).map(x => ({ p: parseInt(x && x.p, 10), a: x && x.a })).filter(x => x.p > 0);
    return res.status(200).json({ ok: true, res: grade(b, pages) });
  } catch (e) { return res.status(500).json({ ok: false, msg: e.message }); }
};
module.exports.grade = grade;
