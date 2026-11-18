// ══════════════════════════════════════════════════════════════════════════════
// 🎓 تحليل نتائج الفترة — إشعارات «نور» (PDF) ← تحليل المدرسة + بطاقة لكل طالب
//   الإدارة: تستعرض ملفات «إشعار فترة» (ملف لكل صف أو أكثر) ← قراءة آلية ← تقرير تحليلي A4
//   الطالب وولي الأمر: بطاقة الفترة في حسابه (مواده ونسبه وتميزه وما يحتاجه)
// قاعدة البيانات:
//   school-per/idx/{pid}        { t, per, term, year, date, at, by, n, pub }
//   school-per/d/{pid}/{nh}     { n, ck, g, c, sid, att, bp, bx, S:{ k:{ s, m, t, tm, q, qm } } }   (nh = بصمة رقم الهوية — لا يُحفظ الرقم)
//   school-per/sum/{pid}        ملخص الفصول والصفوف لمقارنة الطالب بزملائه
// ══════════════════════════════════════════════════════════════════════════════
import React, { useState, useEffect, useMemo, useRef } from "react";

const NODE = "school-per";
const ar = n => String(n ?? "");
const obj = v => (v && typeof v === "object" ? v : {});
const vals = v => Object.values(obj(v)).filter(Boolean);
const esc = t => String(t ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const avg = L => { const a = L.filter(x => x != null && isFinite(x)); return a.length ? a.reduce((s, x) => s + x, 0) / a.length : null; };
const f1 = v => v == null ? "—" : (Math.round(v * 10) / 10).toFixed(1);
const pc = v => v == null ? "—" : `${f1(v)}%`;
const nrm = s => String(s || "").replace(/[ً-ٰٟ]/g, "").replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي").replace(/\s+/g, " ").trim();

// ─────────── قراءة ملف «إشعار فترة» من نظام نور ───────────
const LIG = { 0xFEF5: "آل", 0xFEF6: "آل", 0xFEF7: "أل", 0xFEF8: "أل", 0xFEF9: "إل", 0xFEFA: "إل", 0xFEFB: "ال", 0xFEFC: "ال" };
const pdDec = s => { let o = ""; for (const ch of String(s)) { let c = ch.codePointAt(0); if (c >= 0x370 && c <= 0x3ff) c += 0xfb00; if (LIG[c]) { o += LIG[c]; continue; } if (c === 0x0bcc) { o += "هللا"; continue; } o += String.fromCodePoint(c); }
  o = o.normalize("NFKC").replace(/[\u0003\u001d˰ـ]/g, " "); if (/[؀-ۿ]/.test(o) && !/[؀-ۿ]/.test(String(s))) o = [...o].reverse().join(""); return o.replace(/\s+/g, " ").trim(); };
const pdFix = s => (/[Ͱ-Ͽ]/.test(s) ? pdDec(s) : String(s || "")).replace(/[\u0003\u001d˰ـ]/g, " ").replace(/ௌ/g, "الله").replace(/األ/g, "الأ").replace(/اإل/g, "الإ").replace(/اآل/g, "الآ").replace(/(^|\s)اال/g, "$1الا").replace(/مال(?=ح)/g, "ملا").replace(/\s+/g, " ").trim();
export const SUBJ = [
  ["ar", "اللغة العربية", "العربية", /اللغه العربيه/, "📖", 1], ["ma", "الرياضيات", "الرياضيات", /الرياضيات/, "📐", 1], ["sc", "العلوم", "العلوم", /^العلوم/, "🔬", 1], ["en", "اللغة الإنجليزية", "الإنجليزية", /الانجليزي/, "🔤", 1],
  ["is", "الدراسات الإسلامية", "الإسلامية", /القران|الاسلاميه/, "🕌", 2], ["so", "الدراسات الاجتماعية", "الاجتماعية", /الاجتماعيه/, "🌍", 2], ["dg", "المهارات الرقمية", "الرقمية", /الرقميه/, "💻", 2], ["cr", "التفكير الناقد", "التفكير الناقد", /التفكير/, "🧠", 2],
  ["lf", "المهارات الحياتية والأسرية", "الحياتية", /الحياتيه/, "🏠", 3], ["pe", "التربية البدنية", "البدنية", /البدنيه/, "⚽", 3], ["fa", "التربية الفنية", "الفنية", /الفنيه/, "🎨", 3], ["ac", "النشاط", "النشاط", /النشاط/, "🎯", 3]];
const SK = Object.fromEntries(SUBJ.map(x => [x[0], { k: x[0], t: x[1], s: x[2], ic: x[4], tier: x[5] }]));
const subK = n => { const t = nrm(n); const f = SUBJ.find(x => x[3].test(t)); return f ? f[0] : "x" + Math.abs([...t].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7)).toString(36); };
const subT = (k, names) => SK[k] ? SK[k].s : (obj(names)[k] || k);
export const CORE = ["ar", "ma", "sc", "en"];
const ACAD = ["ar", "ma", "sc", "en", "is", "so", "dg", "cr"];
const TASK_X = [360, 328, 232], QUIZ_X = [296, 264, 200, 168];
const GRN = { "الاول": 1, "الثاني": 2, "الثالث": 3, "الرابع": 4, "الخامس": 5, "السادس": 6 };
function pdPage(items) {
  const I = items.map(i => ({ ...i, s: pdFix(i.s) })).filter(i => i.s);
  const near = (y, dy = 2.5) => I.filter(i => Math.abs(i.y - y) < dy);
  const lab = re => I.find(i => re.test(nrm(i.s)));
  const L = lab(/اسم الطالب/), D = lab(/رقم الهويه/); if (!L || !D) return null;
  const name = near(L.y).filter(i => i.x < L.x - 5 && i.x > 150).sort((a, b) => b.x - a.x).map(i => i.s).join(" ").replace(/\s+/g, " ").trim();
  const id = (near(D.y).filter(i => i.x < D.x - 5 && i.x > 150 && /[0-9A-Za-z]{5,}/.test(i.s)).sort((a, b) => b.x - a.x)[0] || {}).s || "";
  const G = I.find(i => /المتوسط|الابتدائي|الثانوي/.test(nrm(i.s)) && i.x < 150); let grade = 0; if (G) { const k = Object.keys(GRN).find(k => nrm(G.s).includes(k)); grade = k ? GRN[k] : 0; }
  const FC = I.filter(i => nrm(i.s) === "الفصل" && i.x > 140 && i.x < 180).sort((a, b) => a.y - b.y)[0]; const cls = FC ? +((near(FC.y, 2.5).find(i => /^\d{1,2}$/.test(i.s) && i.x < FC.x) || {}).s || 0) : 0;
  const per = (lab(/اشعار فتره/) || {}).s || ""; const term = (I.find(i => /^الفصل (الاول|الثاني|الثالث)$/.test(nrm(i.s)) && i.x < 120) || {}).s || ""; const year = (I.find(i => /^14\d\d-14\d\d$/.test(i.s)) || {}).s || "";
  const hdr = lab(/^مجموع$/), mx = lab(/^العظمي$/) || lab(/^النهايه/), tot = lab(/^المجموع$/); if (!hdr || !mx) return { name, id, grade, cls, subj: [] };
  const yTop = hdr.y - 8, yBot = tot ? tot.y + 3 : 0, sx = hdr.x + 6, mxx = mx.x + 8;
  const nums = I.filter(i => /^\d{1,3}(\.\d+)?$/.test(i.s) && i.y < yTop && i.y > yBot);
  const rows = nums.filter(i => Math.abs(i.x + 6 - mxx) < 9).sort((a, b) => b.y - a.y).map(a => ({ a, nm: [], s: null, m: +a.s, c: {} }));
  const nearest = y => { let b = null, bd = 1e9; rows.forEach(r => { const d = Math.abs(r.a.y - y); if (d < bd) { bd = d; b = r; } }); return [b, bd]; };
  I.filter(i => i.x > 370 && i.y < yTop + 2 && i.y > yBot && !/^\d/.test(i.s)).forEach(n => { const [b, bd] = nearest(n.y); if (b && bd < 11) b.nm.push(n); });
  nums.forEach(n => { const [b, bd] = nearest(n.y); if (!b || bd > 2.5 || n === b.a) return; if (Math.abs(n.x + 6 - sx) < 9) b.s = +n.s; else if (n.x > 145 && n.x < 375) b.c[Math.round((n.x + 4) / 8) * 8] = +n.s; });
  const subj = rows.map(r => ({ n: r.nm.sort((a, b) => b.y - a.y).map(i => i.s).join(" ").replace(/\s+/g, " ").trim(), s: r.s, m: r.m, c: r.c })).filter(r => r.n && !/^المجموع$/.test(r.n)).map(r => ({ ...r, k: subK(r.n) }));
  const pick = re => { const l = lab(re); if (!l) return null; const v = near(l.y, 4).find(i => /^\d{1,3}$/.test(i.s) && i.x < l.x); return v ? +v.s : null; };
  return { name, id, grade, cls, per, term, year, subj, att: pick(/درجه المواظبه/), bx: pick(/السلوك المتميز/), bp: pick(/السلوك الايجابي/), date: (I.find(i => /^\d{2}\/\d{2}\/14\d\d$/.test(i.s)) || {}).s || "" };
}
async function parseFile(pdfjs, buf, onP) { const doc = await pdfjs.getDocument({ data: new Uint8Array(buf) }).promise; const out = [], bad = [];
  for (let p = 1; p <= doc.numPages; p++) { const pg = await doc.getPage(p); const tc = await pg.getTextContent(); const it = tc.items.filter(i => i.str && i.str.trim()).map(i => ({ x: i.transform[4], y: i.transform[5], s: i.str }));
    let r = null; try { r = pdPage(it); } catch {} if (r && r.id && r.subj.length) out.push({ ...r, pg: p }); else bad.push(p); onP && onP(p, doc.numPages); try { pg.cleanup(); } catch {} }
  try { doc.destroy(); } catch {} return { students: out, pages: doc.numPages, bad }; }
// تحويل طلاب الملفات إلى سجلات مضغوطة (مع حساب درجات المهام والاختبارات من أعمدة الإشعار)
function buildRecs(students) {
  const CM = {}; students.forEach(s => s.subj.forEach(x => Object.entries(x.c).forEach(([c, v]) => { const k = `${s.grade}|${x.k}|${c}`; CM[k] = Math.max(CM[k] || 0, v); })));
  const names = {};
  return { recs: students.map(s => { const S = {}; s.subj.forEach(x => { if (!SK[x.k]) names[x.k] = x.n; const o = { s: x.s == null ? -1 : x.s, m: x.m }; let t = 0, tm = 0, q = 0, qm = 0;
      Object.entries(x.c).forEach(([c, v]) => { const M = CM[`${s.grade}|${x.k}|${c}`] || v; if (TASK_X.includes(+c)) { t += v; tm += M; } else if (QUIZ_X.includes(+c)) { q += v; qm += M; } });
      if (x.s != null && tm && qm) Object.assign(o, { t, tm, q, qm }); S[x.k] = o; });
    return { n: s.name, id: s.id, ck: `${s.grade}-${s.cls}`, g: s.grade, c: s.cls, S, att: s.att ?? -1, bp: s.bp ?? -1, bx: s.bx ?? -1 }; }), names };
}

// ─────────── التحليل ───────────
const BANDS = [[90, "ممتاز", "#1d8a5a"], [80, "جيد جداً", "#7cc47f"], [65, "جيد", "#f0c23b"], [50, "مقبول", "#ec8a3a"], [0, "ضعيف", "#d64545"]];
const band = v => v == null ? null : BANDS.findIndex(b => v >= b[0]);
const HEAT = v => v == null ? ["#eef1f4", "#94a3b8"] : v >= 90 ? ["#d3efe0", "#13633f"] : v >= 80 ? ["#e7f5df", "#2f6b2a"] : v >= 65 ? ["#fcf0c8", "#8a6600"] : v >= 50 ? ["#fcdcc4", "#a84b12"] : ["#f8d0d0", "#a3221c"];
const GCOL = { 1: "#0f8b7a", 2: "#2b6cb0", 3: "#dd6b20", 4: "#7c3aed", 5: "#be185d", 6: "#0369a1" };
const GNAME = { 1: "الأول", 2: "الثاني", 3: "الثالث", 4: "الرابع", 5: "الخامس", 6: "السادس" };
const sp = x => x && x.s >= 0 && x.m ? x.s / x.m * 100 : null;
const coreOf = r => avg(CORE.map(k => sp(obj(r.S)[k])));
const acadOf = r => avg(ACAD.map(k => sp(obj(r.S)[k])));
const clsL = ck => { const [g, c] = String(ck).split("-"); return `${ar(g)}/${ar(c)}`; };
export function analyze(D) {
  const rows = vals(D).map(r => ({ ...r, S: obj(r.S), core: coreOf(r), acad: acadOf(r) })).sort((a, b) => a.g - b.g || a.c - b.c || String(a.n).localeCompare(String(b.n), "ar"));
  const subjAll = [...new Set(rows.flatMap(r => Object.keys(r.S)))].sort((a, b) => (SUBJ.findIndex(x => x[0] === a) + 99) % 199 - (SUBJ.findIndex(x => x[0] === b) + 99) % 199);
  const grades = [...new Set(rows.map(r => r.g))].sort();
  const mk = L => { const C = L.map(r => r.core).filter(v => v != null); const B = [0, 0, 0, 0, 0]; C.forEach(v => B[band(v)]++); const sub = {}; subjAll.forEach(k => { const v = L.map(r => sp(r.S[k])).filter(v => v != null); const has = L.filter(r => r.S[k]).length; const part = v.length > 0 && v.length < has * .5; sub[k] = { a: part ? null : avg(v), ap: avg(v), part, n: v.length, has, miss: has - v.length, lt: v.filter(x => x < 50).length }; });
    const lt50 = L.filter(r => ACAD.some(k => { const p = sp(r.S[k]); return p != null && p < 50; })).length;
    const tq = {}; CORE.forEach(k => { const X = L.map(r => r.S[k]).filter(x => x && x.tm && x.qm); if (X.length) tq[k] = { t: avg(X.map(x => x.t / x.tm * 100)), q: avg(X.map(x => x.q / x.qm * 100)), n: X.length }; });
    return { n: L.length, core: avg(C), B, nC: C.length, sub, lt50, tq, ev: C.length ? (B[0] + B[1]) / C.length * 100 : null }; };
  const cls = {}; rows.forEach(r => { (cls[r.ck] = cls[r.ck] || []).push(r); });
  const CL = Object.entries(cls).map(([ck, L]) => ({ ck, g: L[0].g, c: L[0].c, ...mk(L) })).sort((a, b) => a.g - b.g || a.c - b.c);
  const GR = grades.map(g => ({ g, cls: CL.filter(c => c.g === g), ...mk(rows.filter(r => r.g === g)) }));
  const SC = mk(rows);
  const prio = rows.filter(r => r.core != null && (r.core < 60 || ACAD.filter(k => { const p = sp(r.S[k]); return p != null && p < 50; }).length >= 2)).map(r => ({ ...r, low: ACAD.filter(k => { const p = sp(r.S[k]); return p != null && p < 50; }) })).sort((a, b) => a.core - b.core);
  const top = Object.fromEntries(grades.map(g => [g, rows.filter(r => r.g === g && r.core != null).sort((a, b) => b.core - a.core || (b.acad || 0) - (a.acad || 0)).slice(0, 3)]));
  return { rows, subjAll, grades, CL, GR, SC, prio, top };
}
// القراءات الآلية (أهم النتائج وقراءة كل صف وخطة التوصيات)
function findings(A, names) {
  const F = []; const T = k => subT(k, names);
  let w = null; A.GR.forEach(g => CORE.forEach(k => { const s = g.sub[k]; if (s && s.a != null && (!w || s.a < w.a)) w = { g, k, a: s.a, lt: s.lt }; }));
  if (w) { const lows = w.g.cls.filter(c => c.sub[w.k] && c.sub[w.k].a != null).sort((a, b) => a.sub[w.k].a - b.sub[w.k].a).slice(0, 2); F.push([`${T(w.k)} في الصف ${GNAME[w.g.g]} أضعف نقطة`, `متوسطها ${pc(w.a)}، و${ar(w.lt)} طالباً دون 50%${lows.length ? `، وأدنى الفصول ${lows.map(c => `${clsL(c.ck)} (${pc(c.sub[w.k].a)})`).join(" و")}` : ""}.`, GCOL[w.g.g]]); }
  let sp2 = null; A.GR.forEach(g => CORE.forEach(k => { const L = g.cls.map(c => c.sub[k] && c.sub[k].a).filter(v => v != null); if (L.length > 1) { const d = Math.max(...L) - Math.min(...L); if (!sp2 || d > sp2.d) sp2 = { g, k, d, L }; } }));
  if (sp2 && sp2.d >= 10) { const C = sp2.g.cls.filter(c => c.sub[sp2.k] && c.sub[sp2.k].a != null).sort((a, b) => a.sub[sp2.k].a - b.sub[sp2.k].a); F.push([`${T(sp2.k)} في الصف ${GNAME[sp2.g.g]} منقسمة بين الفصول`, `${pc(C[0].sub[sp2.k].a)} في ${clsL(C[0].ck)} مقابل ${pc(C[C.length - 1].sub[sp2.k].a)} في ${clsL(C[C.length - 1].ck)} — فارق ${f1(sp2.d)} نقطة.`, GCOL[sp2.g.g]]); }
  let gd = null; ACAD.forEach(k => { const L = A.GR.map(g => ({ g, a: g.sub[k] && g.sub[k].a })).filter(x => x.a != null); if (L.length > 1) { L.sort((a, b) => a.a - b.a); const d = L[L.length - 1].a - L[0].a; if (!gd || d > gd.d) gd = { k, d, lo: L[0], hi: L[L.length - 1] }; } });
  if (gd && gd.d >= 8) F.push([`${T(gd.k)} منخفضة في الصف ${GNAME[gd.lo.g.g]}`, `${pc(gd.lo.a)} مقابل ${pc(gd.hi.a)} في الصف ${GNAME[gd.hi.g.g]}.`, GCOL[gd.lo.g.g]]);
  const tq = CORE.map(k => ({ k, ...obj(A.SC.tq[k]) })).filter(x => x.t != null).sort((a, b) => (b.t - b.q) - (a.t - a.q));
  if (tq.length && tq[0].t - tq[0].q >= 8) F.push(["المهام أعلى كثيراً من الاختبارات القصيرة", tq.slice(0, 2).map(x => `${T(x.k)} ${pc(x.t)} مقابل ${pc(x.q)}`).join("، و") + ".", "#7c3aed"]);
  const miss = A.subjAll.map(k => ({ k, m: A.SC.sub[k].miss, h: A.SC.sub[k].has })).filter(x => x.m > 0).sort((a, b) => b.m - a.m);
  if (miss.length) F.push(["الرصد غير مكتمل", `${miss.slice(0, 3).map(x => `${T(x.k)} غير مرصودة لـ${ar(x.m)} طالباً`).join("، و")}.`, "#64748b"]);
  else F.push(["الرصد مكتمل", "جميع المواد مرصودة لجميع الطلاب في إشعار هذه الفترة.", "#64748b"]);
  return F.slice(0, 5);
}
function gradeReads(g, names) {
  const T = k => subT(k, names); const R = []; const C = g.cls.filter(c => c.core != null); if (!C.length) return R;
  const best = [...C].sort((a, b) => b.core - a.core)[0]; R.push([`${clsL(best.ck)} أفضل فصول الصف`, `متوسط الأساسية ${pc(best.core)}، و${ar(Math.round(best.ev || 0))}% ممتاز وجيد جداً، و${ar(best.lt50)} طالباً لديهم مادة دون 50%.`]);
  const mx = [...C].sort((a, b) => b.B[0] - a.B[0])[0]; if (mx.ck !== best.ck) R.push([`${clsL(mx.ck)} صاحب أكبر عدد من الممتازين`, `${ar(mx.B[0])} طالباً من ${ar(mx.n)}.`]);
  const worst = [...C].sort((a, b) => a.core - b.core)[0]; if (worst.ck !== best.ck) { const wk = CORE.filter(k => worst.sub[k] && worst.sub[k].a != null).sort((a, b) => worst.sub[a].a - worst.sub[b].a)[0]; R.push([`${clsL(worst.ck)} يحتاج تدخلاً${wk ? ` في ${T(wk)}` : ""}`, `${wk ? `${pc(worst.sub[wk].a)} مقابل متوسط الصف ${pc(g.sub[wk].a)}، ` : ""}و${ar(worst.lt50)} طلاب لديهم مادة دون 50%.`]); }
  const sp3 = C.map(c => { const L = ACAD.map(k => c.sub[k] && c.sub[k].a).filter(v => v != null); return { c, d: L.length ? Math.max(...L) - Math.min(...L) : 0, L }; }).sort((a, b) => b.d - a.d)[0];
  if (sp3 && sp3.d >= 15) { const ks = ACAD.filter(k => sp3.c.sub[k] && sp3.c.sub[k].a != null).sort((a, b) => sp3.c.sub[a].a - sp3.c.sub[b].a); R.push([`${clsL(sp3.c.ck)} أوسع الفصول تبايناً بين المواد`, `${T(ks[ks.length - 1])} ${pc(sp3.c.sub[ks[ks.length - 1]].a)} مقابل ${T(ks[0])} ${pc(sp3.c.sub[ks[0]].a)}.`]); }
  ACAD.forEach(k => { const L = C.map(c => ({ c, a: c.sub[k] && c.sub[k].a })).filter(x => x.a != null); if (L.length < 2) return; L.sort((a, b) => a.a - b.a); if (L[L.length - 1].a - L[0].a >= 15 && R.length < 6) R.push([`${T(k)} متفاوتة بين الفصول`, `${pc(L[L.length - 1].a)} في ${clsL(L[L.length - 1].c.ck)} مقابل ${pc(L[0].a)} في ${clsL(L[0].c.ck)} — يستدعي توحيد معايير التقويم.`]); });
  return R.slice(0, 6);
}
function recPlan(A, names) {
  const T = k => subT(k, names); const P = [];
  const miss = A.subjAll.filter(k => A.SC.sub[k].miss > 0);
  if (miss.length) P.push(["عاجل", `استكمال رصد المواد الناقصة في نور (${miss.slice(0, 3).map(T).join("، ")})`, "وكيل الشؤون التعليمية ومعلمو المواد", "خلال أسبوع", "رصد 100% لكل مادة وفصل"]);
  const zero = A.rows.filter(r => CORE.some(k => r.S[k] && r.S[k].s === 0)).length; if (zero) P.push(["عاجل", `التحقق من ${ar(zero)} طالباً لديهم درجة صفر في مادة أساسية وإعادة الاختبار للغائبين بعذر`, "معلمو المواد", "خلال أسبوع", "لا درجة صفر بسبب الغياب"]);
  const W = []; A.GR.forEach(g => CORE.forEach(k => { const s = g.sub[k]; if (s && s.a != null && s.a < 80) W.push({ g, k, a: s.a, lt: s.lt }); })); W.sort((a, b) => a.a - b.a);
  W.slice(0, 3).forEach(x => { const lows = x.g.cls.filter(c => c.sub[x.k] && c.sub[x.k].a != null && c.sub[x.k].a < x.a).map(c => clsL(c.ck)); P.push(["علاجي", `اختبار تشخيصي في ${T(x.k)} للصف ${GNAME[x.g.g]}${lows.length ? ` (${lows.join(" و")})` : ""} ثم حصص علاجية أسبوعية في مجموعات صغيرة`, `معلمو ${T(x.k)}`, "يبدأ خلال أسبوعين", `نزول الطلاب دون 50% من ${ar(x.lt)} إلى النصف`]); });
  const sp4 = []; A.GR.forEach(g => CORE.forEach(k => { const L = g.cls.map(c => c.sub[k] && c.sub[k].a).filter(v => v != null); if (L.length > 1 && Math.max(...L) - Math.min(...L) >= 12) sp4.push({ g, k }); }));
  if (sp4.length) P.push(["علاجي", `زيارات صفية وتبادل خبرات بين فصول ${sp4.slice(0, 2).map(x => `${T(x.k)} الصف ${GNAME[x.g.g]}`).join(" و")} مع توحيد أدوات التقويم`, "قائد المدرسة والمشرف التربوي", "خلال ثلاثة أسابيع", "فارق بين الفصول أقل من 10 نقاط"]);
  if (A.prio.length) P.push(["علاجي", `خطة فردية لكل طالب من طلاب الأولوية الـ${ar(A.prio.length)} واجتماع بولي أمره`, "الموجه الطلابي ومعلمو المواد", "خلال أسبوعين", "خطة موقعة ومتابعة أسبوعية"]);
  const tq = CORE.map(k => ({ k, ...obj(A.SC.tq[k]) })).filter(x => x.t != null && x.t - x.q >= 10);
  if (tq.length) P.push(["تطويري", `سلالم تقدير موحدة للمهام الأدائية والمشاركة في ${tq.map(x => T(x.k)).join("، ")} لتقريبها من مستوى الاختبارات`, "لجنة التحصيل الدراسي", "قبل رصد الفترة الثانية", "فجوة لا تزيد على 15 نقطة"]);
  P.push(["تطويري", "اختبارات محاكية لنافس في الرياضيات والعلوم والقراءة وتحليلها بحسب المهارة", "معلمو المواد", "شهرياً", "تحسّن كل اختبار عن سابقه"]);
  const bestC = [...A.CL].filter(c => c.core != null).sort((a, b) => b.core - a.core).slice(0, 2); if (bestC.length) P.push(["تطويري", `تكريم المتفوقين وعرض ممارسات فصلَي ${bestC.map(c => clsL(c.ck)).join(" و")} في اجتماع المعلمين`, "قائد المدرسة", "خلال أسبوعين", "تنفيذ التكريم وتوثيق الممارسات"]);
  P.push(["متابعة", "إعادة هذا التحليل بالمؤشرات نفسها بعد رصد الفترة الثانية ومقارنة النتائج", "وكيل الشؤون التعليمية", "بعد الفترة الثانية", "تقرير مقارن للجنة التحصيل"]);
  return P;
}

// ─────────── رسوم SVG ───────────
const ring = (p, col, size = 120, sw = 13, label = "", fs = 22) => { const r = (size - sw) / 2, C = 2 * Math.PI * r, v = Math.max(0, Math.min(100, p || 0)); return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="direction:ltr"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="#e8edf2" stroke-width="${sw}"/><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${col}" stroke-width="${sw}" stroke-linecap="round" stroke-dasharray="${C * v / 100} ${C}" transform="rotate(-90 ${size / 2} ${size / 2})"/><text x="50%" y="${label ? "47%" : "53%"}" text-anchor="middle" dominant-baseline="middle" font-size="${fs}" font-weight="800" fill="#13314a" direction="ltr">${p == null ? "—" : f1(p) + "%"}</text>${label ? `<text x="50%" y="66%" text-anchor="middle" font-size="${fs * .45}" fill="#64748b">${label}</text>` : ""}</svg>`; };
const pie = (B, size = 200) => { const tot = B.reduce((a, b) => a + b, 0) || 1; const r = size / 2 - 18, C = 2 * Math.PI * r; let o = 0; return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="#eef2f6" stroke-width="34"/>${B.map((v, i) => { const L = C * v / tot; const s = `<circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${BANDS[i][2]}" stroke-width="34" stroke-dasharray="${L} ${C - L}" stroke-dashoffset="${-o}" transform="rotate(-90 ${size / 2} ${size / 2})"/>`; o += L; return s; }).join("")}<text x="50%" y="46%" text-anchor="middle" dominant-baseline="middle" font-size="30" font-weight="800" fill="#13314a">${ar(Math.round((B[0] + B[1]) / tot * 100))}%</text><text x="50%" y="62%" text-anchor="middle" font-size="12" fill="#64748b">ممتاز وجيد جداً</text></svg>`; };
const stack = (B, h = 10, nums = false) => { const tot = B.reduce((a, b) => a + b, 0) || 1; return `<div class="stk" style="height:${h}px">${[...B].map((v, i) => [v, i]).reverse().filter(([v]) => v).map(([v, i]) => `<span style="width:${v / tot * 100}%;background:${BANDS[i][2]}">${nums && v / tot > .07 ? ar(v) : ""}</span>`).join("")}</div>`; };
function barsSvg(CL, school) { const W = 680, H = 250, pad = 34, bw = Math.min(38, (W - pad * 2) / (CL.length + 3) - 8); let x = W - pad; const out = []; const gx = []; let lastG = null;
  const y = v => H - 30 - (v || 0) / 100 * (H - 60);
  CL.forEach(c => { if (lastG !== null && c.g !== lastG) x -= 26; lastG = c.g; x -= bw + 8; const yy = y(c.core); out.push(`<rect x="${x}" y="${yy}" width="${bw}" height="${H - 30 - yy}" rx="5" fill="${GCOL[c.g]}"/><text x="${x + bw / 2}" y="${yy + 15}" text-anchor="middle" font-size="10.5" font-weight="800" fill="#fff">${c.core == null ? "" : f1(c.core)}</text><text x="${x + bw / 2}" y="${H - 14}" text-anchor="middle" font-size="10.5" fill="#475569">${clsL(c.ck)}</text>`); (gx[c.g] = gx[c.g] || []).push(x); });
  const grid = [0, 25, 50, 75, 100].map(v => `<line x1="${pad}" x2="${W - pad + 8}" y1="${y(v)}" y2="${y(v)}" stroke="#e8edf2"/><text x="${W - 6}" y="${y(v) + 4}" font-size="9" fill="#94a3b8" text-anchor="end">${v}</text>`).join("");
  const sy = y(school); return `<svg viewBox="0 0 ${W} ${H}" width="100%" direction="ltr" style="direction:ltr">${grid}${out.join("")}<line x1="${pad - 20}" x2="${W - pad + 8}" y1="${sy}" y2="${sy}" stroke="#13314a" stroke-width="1.6" stroke-dasharray="6 4"/><rect x="0" y="${sy - 26}" width="58" height="30" rx="5" fill="#13314a"/><text x="29" y="${sy - 14}" text-anchor="middle" font-size="8.5" fill="#fff">متوسط المدرسة</text><text x="29" y="${sy - 2}" text-anchor="middle" font-size="10" font-weight="800" fill="#f2c94c">${f1(school)}%</text></svg>`; }
function colsSvg(CL, key, H = 120) { const W = 680, n = CL.length, bw = Math.min(30, W / (n + 3) - 12); const mx = Math.max(1, ...CL.map(c => c[key] || 0)); let x = W - 18; let lastG = null; return `<svg viewBox="0 0 ${W} ${H}" width="100%" style="direction:ltr">${CL.map(c => { if (lastG !== null && c.g !== lastG) x -= 18; lastG = c.g; x -= bw + 12; const h = (c[key] || 0) / mx * (H - 44) + 3; return `<rect x="${x}" y="${H - 22 - h}" width="${bw}" height="${h}" rx="4" fill="${GCOL[c.g]}"/><text x="${x + bw / 2}" y="${H - 28 - h}" text-anchor="middle" font-size="11" font-weight="800" fill="#13314a">${ar(c[key] || 0)}</text><text x="${x + bw / 2}" y="${H - 7}" text-anchor="middle" font-size="10" fill="#475569">${clsL(c.ck)}</text>`; }).join("")}<line x1="10" x2="${W - 10}" y1="${H - 22}" y2="${H - 22}" stroke="#cbd5e1"/></svg>`; }
function radar(L, size = 300) { const n = L.length; if (n < 3) return ""; const c = size / 2, R = size / 2 - 46; const pt = (i, v) => { const a = -Math.PI / 2 + i * 2 * Math.PI / n; return [c + Math.cos(a) * R * (v || 0) / 100, c + Math.sin(a) * R * (v || 0) / 100]; };
  const poly = k => L.map((x, i) => pt(i, x[k]).map(v => v.toFixed(1)).join(",")).join(" ");
  return `<svg viewBox="0 0 ${size} ${size}" width="100%" style="max-width:${size}px;direction:ltr">${[25, 50, 75, 100].map(v => `<polygon points="${L.map((_, i) => pt(i, v).join(",")).join(" ")}" fill="${v === 100 ? "#f8fafc" : "none"}" stroke="#e2e8f0"/>`).join("")}${L.map((_, i) => `<line x1="${c}" y1="${c}" x2="${pt(i, 100)[0]}" y2="${pt(i, 100)[1]}" stroke="#e2e8f0"/>`).join("")}
    <polygon points="${poly("cls")}" fill="rgba(148,163,184,.18)" stroke="#94a3b8" stroke-width="1.6" stroke-dasharray="5 3"/><polygon points="${poly("me")}" fill="rgba(15,139,122,.22)" stroke="#0f8b7a" stroke-width="2.4"/>${L.map((x, i) => { const [px, py] = pt(i, x.me); return `<circle cx="${px}" cy="${py}" r="3.6" fill="${HEAT(x.me)[1]}"/>`; }).join("")}
    ${L.map((x, i) => { const [px, py] = pt(i, 122); return `<text x="${px}" y="${py}" text-anchor="middle" dominant-baseline="middle" font-size="11" font-weight="700" fill="#334155">${esc(x.t)}</text>`; }).join("")}</svg>`; }

// ─────────── تنسيق التقارير (A4) ───────────
const CSS = `@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap');
.pr{font-family:Tajawal,Tahoma,Arial,sans-serif;direction:rtl;color:#13314a;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.pr *{box-sizing:border-box}.pr .pg{width:210mm;min-height:297mm;background:#fff;margin:0 auto 14px;position:relative;overflow:hidden;padding:0 0 16mm;box-shadow:0 10px 40px -18px rgba(15,23,42,.35)}
.pr .pg:last-child{margin-bottom:0}.pr .in{padding:6mm 11mm 0}.pr .bar{height:9mm}.pr .ft{position:absolute;bottom:5mm;right:11mm;left:11mm;border-top:1px solid #e2e8f0;padding-top:2.5mm;display:flex;justify-content:space-between;align-items:center;font-size:9.5px;color:#64748b}
.pr .pn{width:22px;height:22px;border-radius:50%;background:#13314a;color:#fff;display:grid;place-items:center;font-weight:800;font-size:10px}
.pr .cover{background:linear-gradient(120deg,#0e3448 0%,#0d5c5a 60%,#0f7c6c 100%);color:#fff;padding:7mm 11mm 6mm;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;border-bottom:4px solid #d4a72c}
.pr .cover .r b{display:block;font-size:14.5px}.pr .cover .r span{display:block;font-size:11.5px;opacity:.88;margin-top:3px}.pr .cover .r .s{color:#f2c94c;font-weight:800;margin-top:6px;opacity:1}
.pr .cover .l{text-align:left;font-size:11.5px;line-height:2}.pr .cover .l b{color:#f2c94c}.pr .logo{width:74px;height:74px;border-radius:50%;background:rgba(255,255,255,.1);display:grid;place-items:center;border:2px solid rgba(242,201,76,.6)}
.pr .logo img{width:56px;height:56px;border-radius:50%;background:#fff;padding:3px}
.pr h1{font-size:30px;font-weight:900;text-align:center;margin:7mm 0 1mm;color:#0e3448}.pr .sub{text-align:center;color:#64748b;font-size:12.5px}
.pr .kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:9px;margin:6mm 0 5mm}.pr .kpi{border-radius:14px;color:#fff;padding:11px 14px;min-height:88px}.pr .kpi b{font-size:28px;font-weight:900;display:block;line-height:1.1;direction:ltr;text-align:right}
.pr .kpi strong{display:block;font-size:13px;margin-top:4px}.pr .kpi small{font-size:10.5px;opacity:.85}
.pr .box{border:1px solid #e3e9ef;border-radius:14px;padding:10px 12px;background:#fbfcfd}.pr .h{font-size:14px;font-weight:800;margin:0 0 8px;display:flex;align-items:center;gap:7px}.pr .h:before{content:"";width:5px;height:16px;border-radius:3px;background:#d4a72c}
.pr .h small{font-weight:500;color:#64748b;font-size:10.5px}.pr .g2{display:grid;grid-template-columns:1fr 1fr;gap:10px}.pr .stk{display:flex;border-radius:6px;overflow:hidden;background:#eef2f6;direction:ltr}.pr .stk span{display:grid;place-items:center;color:#fff;font-size:8.5px;font-weight:800}
.pr .fd{display:flex;gap:10px;align-items:flex-start;border:1px solid #e3e9ef;border-radius:12px;padding:9px 12px;margin-bottom:7px;border-right-width:4px;background:#fff}.pr .fd .n{width:24px;height:24px;border-radius:50%;color:#fff;display:grid;place-items:center;font-weight:800;font-size:11px;flex:0 0 auto}
.pr .fd b{font-size:13px;display:block}.pr .fd span{font-size:11px;color:#475569}.pr .sec{display:flex;gap:12px;align-items:center;margin:2mm 0 4mm}.pr .sec .ic{width:44px;height:44px;border-radius:12px;display:grid;place-items:center;color:#fff;font-size:20px;font-weight:900}
.pr .sec h2{margin:0;font-size:21px;font-weight:900}.pr .sec p{margin:2px 0 0;font-size:11.5px;color:#475569}.pr .mini{display:flex;gap:7px;margin-inline-start:auto}.pr .mini div{border:1px solid #e3e9ef;border-radius:10px;padding:5px 10px;text-align:center;min-width:62px;background:#fff}.pr .mini b{display:block;font-size:16px}.pr .mini small{font-size:9.5px;color:#64748b}
.pr table.ht{width:100%;border-collapse:separate;border-spacing:3px;font-size:11px}.pr table.ht th{background:#13314a;color:#fff;border-radius:7px;padding:6px 4px;font-weight:700}.pr table.ht td{border-radius:7px;padding:5px 4px;text-align:center;font-weight:800}.pr table.ht td.k{background:#0f8b7a;color:#fff}
.pr table.ht tr.tot td{background:#13314a!important;color:#f2c94c!important}.pr .legend{display:flex;gap:6px;justify-content:center;margin-top:4px;font-size:9.5px}.pr .legend span{border-radius:999px;padding:2px 9px}
.pr .cc{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.pr .card{border:1px solid #e3e9ef;border-radius:12px;overflow:hidden;background:#fff}.pr .card .t{display:flex;justify-content:space-between;color:#fff;padding:5px 10px;font-size:11.5px;font-weight:800}
.pr .card .b{display:flex;align-items:center;justify-content:space-between;padding:6px 10px;gap:6px}.pr .card .b .x{font-size:10.5px;color:#475569;line-height:1.9}.pr .card .b .x b{color:#13314a}.pr .rd{background:#f8fafc;border-radius:10px;padding:6px 10px;margin-bottom:5px;font-size:11px;line-height:1.75}.pr .rd b{color:#0e3448}
.pr .rd:before{content:"●";color:#0f8b7a;margin-inline-end:6px}.pr .hb{display:grid;grid-template-columns:150px 1fr 54px 70px;align-items:center;gap:8px;font-size:11px;padding:3px 0}.pr .hb .tr{height:10px;border-radius:6px;background:#eef2f6;overflow:hidden}.pr .hb .tr i{display:block;height:100%;border-radius:6px}
.pr table.lt{width:100%;border-collapse:separate;border-spacing:0 4px;font-size:10.5px}.pr table.lt th{background:#13314a;color:#fff;padding:6px;font-weight:700}.pr table.lt th:first-child{border-radius:0 8px 8px 0}.pr table.lt th:last-child{border-radius:8px 0 0 8px}.pr table.lt td{background:#f6f8fa;padding:5px 7px}
.pr .tag{display:inline-block;border-radius:999px;padding:2px 9px;color:#fff;font-weight:800;font-size:9.5px}.pr .tp{border:1px solid #e3e9ef;border-radius:12px;overflow:hidden}.pr .tp .t{color:#fff;text-align:center;padding:6px;font-weight:800;font-size:12.5px}.pr .tp .r{display:flex;align-items:center;gap:8px;padding:7px 10px;border-top:1px dashed #e2e8f0}
.pr .md{width:22px;height:22px;border-radius:50%;display:grid;place-items:center;color:#fff;font-weight:800;font-size:11px}.pr .sig{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:8mm}.pr .sig div{border:1px solid #e3e9ef;border-radius:12px;padding:10px 14px;min-height:62px;font-size:11px;color:#64748b}.pr .sig b{display:block;color:#13314a;font-size:13.5px;margin-top:4px}
/* بطاقة الطالب */
.pr .sh{background:linear-gradient(125deg,#0e3448 0%,#0d5c5a 55%,#118a78 100%);color:#fff;padding:7mm 11mm 6mm;position:relative;overflow:hidden}.pr .sh:after{content:"";position:absolute;inset:auto -60px -90px auto;width:260px;height:260px;border-radius:50%;background:radial-gradient(circle,rgba(242,201,76,.28),transparent 70%)}
.pr .sh .top{display:flex;justify-content:space-between;font-size:11px;opacity:.9}.pr .sh .who{display:flex;align-items:center;gap:16px;margin-top:5mm;position:relative;z-index:1}.pr .sh .who h3{margin:0;font-size:24px;font-weight:900}.pr .sh .who p{margin:4px 0 0;font-size:12.5px;opacity:.9}
.pr .chips{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}.pr .chips span{background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.25);border-radius:999px;padding:3px 11px;font-size:11px;font-weight:700}
.pr .sk{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:-7mm 11mm 4mm;position:relative;z-index:2}.pr .sk div{background:#fff;border-radius:14px;padding:9px 10px;box-shadow:0 10px 24px -14px rgba(15,23,42,.45);border-top:4px solid var(--c);text-align:center}.pr .sk b{display:block;font-size:22px;font-weight:900;color:var(--c);direction:ltr}.pr .sk small{font-size:10.5px;color:#475569;font-weight:700}
.pr .sub3{display:grid;grid-template-columns:1fr 1fr;gap:8px}.pr .sc{border:1px solid #e3e9ef;border-radius:13px;padding:9px 11px;background:#fff;border-inline-start:5px solid var(--c)}.pr .sc .a{display:flex;align-items:center;gap:8px}.pr .sc .a .i{font-size:19px}.pr .sc .a b{font-size:13px;flex:1}.pr .sc .a .p{font-size:19px;font-weight:900;color:var(--c);direction:ltr}
.pr .sc .tr{position:relative;height:9px;border-radius:6px;background:#eef2f6;margin:7px 0 4px}.pr .sc .tr i{position:absolute;top:0;bottom:0;right:0;border-radius:6px;background:var(--c)}.pr .sc .tr u{position:absolute;top:-4px;width:2px;height:17px;background:#13314a;border-radius:2px}
.pr .sc .m{display:flex;justify-content:space-between;font-size:10px;color:#64748b}.pr .sc .bd{display:inline-block;border-radius:999px;padding:1px 8px;font-size:10px;font-weight:800}.pr .ok{background:#f0faf4;border:1px solid #bfe6cf;border-radius:13px;padding:9px 12px}.pr .wk{background:#fff6ef;border:1px solid #f6d2b5;border-radius:13px;padding:9px 12px}
.pr .ok li,.pr .wk li{font-size:11.5px;line-height:1.9;margin-bottom:2px}.pr .ok ul,.pr .wk ul{margin:4px 0 0;padding-inline-start:18px}
.pr .sx{display:grid;grid-template-columns:1fr 250px;gap:10px;align-items:start}
.pr.fluid .pg{width:100%;max-width:210mm;min-height:0}
@container pa (max-width:720px){.pr.fluid .pg{padding-bottom:12px;border-radius:18px}.pr.fluid .in{padding:12px}.pr.fluid .sh{padding:16px 14px 26px}.pr.fluid .sh .top{flex-direction:column;gap:2px}.pr.fluid .sh .who{flex-direction:column;text-align:center;gap:8px}.pr.fluid .chips{justify-content:center}.pr.fluid .sh .who h3{font-size:21px}
.pr.fluid .sk{grid-template-columns:1fr 1fr;margin:-16px 12px 10px}.pr.fluid .sub3,.pr.fluid .g2,.pr.fluid .sx{grid-template-columns:1fr}.pr.fluid .ft{position:static;margin:12px 12px 0;flex-direction:column;gap:4px;text-align:center}.pr.fluid .sc .a b{font-size:14px}.pr.fluid .ok li,.pr.fluid .wk li{font-size:13px}.pr.fluid .rd{font-size:12.5px}}
@media print{.pr .pg{box-shadow:none;margin:0;page-break-after:always}.pr .pg:last-child{page-break-after:auto}}`;
const PRINT = (title, body) => `<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>${esc(title)}</title><style>@page{size:A4;margin:0}html,body{margin:0;background:#e9eef3}${CSS}@media print{html,body{background:#fff}}</style></head><body><div class="pr">${body}</div><script>document.fonts&&document.fonts.ready.then(()=>setTimeout(()=>window.print(),350))</script></body></html>`;

// ─────────── التقرير التحليلي للمدرسة ───────────
export function schoolReport(A, M, cfg) {
  const names = obj(M.names); const T = k => subT(k, names); const pages = []; const ft = n => `<div class="ft"><span>${esc(cfg.school)} · تقرير تحليل نتائج ${esc(M.perT || "الفترة")} ${esc(M.year || "")}هـ</span><span class="pn">${ar(n)}</span></div>`;
  const BT = (B, tot) => BANDS.map((b, i) => `<div style="display:grid;grid-template-columns:14px 1fr 36px 44px;gap:8px;align-items:center;font-size:12px;padding:5px 0;border-bottom:1px dashed #e2e8f0"><i style="width:11px;height:11px;border-radius:3px;background:${b[2]}"></i><span>${b[1]}</span><b>${ar(B[i])}</b><small style="color:#64748b">${f1(B[i] / (tot || 1) * 100)}%</small></div>`).join("");
  const F = findings(A, names);
  // ١) الغلاف والمؤشرات
  pages.push(`<div class="pg"><div class="cover"><div class="r"><b>المملكة العربية السعودية</b><span>وزارة التعليم</span><span>${esc(cfg.region)}</span><span class="s">${esc(cfg.school)}</span></div><div class="logo"><img src="${cfg.logo}"></div><div class="l">العام الدراسي: <b>${esc(M.year || "")}هـ</b><br>الفصل الدراسي: <b>${esc((M.term || "").replace(/^الفصل\s*/, ""))}</b><br>الفترة: <b>${esc(M.perT || "")}</b><br>تاريخ البيانات: <b>${esc(M.date || "")}هـ</b></div></div>
    <div class="in"><h1>تقرير تحليل نتائج الطلاب</h1><div class="sub">قراءة تحليلية لإشعارات ${esc(M.perT || "الفترة")} في الصفوف والفصول والمواد، مع التوصيات</div>
    <div class="kpis"><div class="kpi" style="background:#0f7c6c"><b>${ar(A.rows.length)}</b><strong>طالباً</strong><small>في ${ar(A.grades.length)} صفوف</small></div><div class="kpi" style="background:#2b6cb0"><b>${ar(A.CL.length)}</b><strong>فصلاً</strong><small>${A.GR.map(g => `${ar(g.cls.length)} ${GNAME[g.g]}`).join(" · ")}</small></div><div class="kpi" style="background:#13314a"><b style="color:#f2c94c">${pc(A.SC.core)}</b><strong>متوسط المواد الأساسية</strong><small>تقدير ${BANDS[band(A.SC.core) ?? 4][1]}</small></div><div class="kpi" style="background:#dd6b20"><b>${ar(A.SC.lt50)}</b><strong>طلاب لديهم مادة دون 50%</strong><small>${f1(A.SC.lt50 / (A.rows.length || 1) * 100)}% من الطلاب</small></div></div>
    <div class="g2"><div class="box"><div class="h">توزيع تقديرات الطلاب في المواد الأساسية</div><div style="display:flex;align-items:center;gap:10px"><div style="flex:1">${BT(A.SC.B, A.SC.nC)}</div>${pie(A.SC.B, 190)}</div></div>
    <div class="box"><div class="h">متوسط المواد الأساسية في كل صف</div><div style="display:flex;justify-content:space-around;text-align:center">${A.GR.map(g => `<div>${ring(g.core, GCOL[g.g], 112, 12)}<div style="color:${GCOL[g.g]};font-weight:900;font-size:14px">الصف ${GNAME[g.g]}</div><small style="color:#64748b;font-size:10px">${ar(g.n)} طالباً · ${ar(g.B[0])} ممتازاً</small><div style="width:112px;margin-top:5px">${stack(g.B, 7)}</div></div>`).join("")}</div></div></div>
    <div class="h" style="margin-top:6mm">أهم النتائج</div>${F.map((f, i) => `<div class="fd" style="border-right-color:${f[2]}"><div class="n" style="background:${f[2]}">${ar(i + 1)}</div><div><b>${esc(f[0])}</b><span>${esc(f[1])}</span></div></div>`).join("")}</div>${ft(1)}</div>`);
  // ٢) صورة المدرسة
  const SA = ACAD.filter(k => A.SC.sub[k] && A.SC.sub[k].a != null).sort((a, b) => A.SC.sub[b].a - A.SC.sub[a].a);
  const skill = A.subjAll.filter(k => !ACAD.includes(k) && A.SC.sub[k].a != null);
  const TQ = CORE.filter(k => A.SC.tq[k]).map(k => ({ k, ...A.SC.tq[k] })).sort((a, b) => (b.t - b.q) - (a.t - a.q));
  const qRows = CORE.filter(k => A.GR.some(g => g.tq[k])).map(k => `<tr><td class="k" style="background:#3d566e">${T(k)}</td>${A.GR.map(g => { const v = g.tq[k] && g.tq[k].q; const [bg, c] = HEAT(v); return `<td style="background:${bg};color:${c}">${v == null ? "—" : pc(v)}</td>`; }).join("")}</tr>`).join("");
  const low = [...A.CL].filter(c => c.core != null).sort((a, b) => a.core - b.core)[0];
  pages.push(`<div class="pg"><div class="bar" style="background:#13314a"></div><div class="in"><div class="sec"><div class="ic" style="background:#13314a">◆</div><div><h2>صورة المدرسة: الفصول والمواد</h2><p>${low ? `أدنى الفصول ${clsL(low.ck)} (${pc(low.core)})، ` : ""}و${SA.length ? `${T(SA[SA.length - 1])} أدنى المواد الأكاديمية (${pc(A.SC.sub[SA[SA.length - 1]].a)})` : ""}.</p></div></div>
    <div class="h">متوسط المواد الأساسية في الفصول (%)</div><div class="box" style="background:#fff">${barsSvg(A.CL, A.SC.core)}<div style="display:flex;gap:8px;justify-content:center;margin-top:4px">${A.GR.map(g => `<span style="background:${GCOL[g.g]}18;color:${GCOL[g.g]};border-radius:999px;padding:3px 14px;font-size:11px;font-weight:800">الصف ${GNAME[g.g]} · ${pc(g.core)}</span>`).join("")}</div></div>
    <div class="g2" style="margin-top:5mm"><div class="box"><div class="h">متوسط كل مادة في المدرسة</div>${SA.map(k => { const s = A.SC.sub[k]; return `<div class="hb"><span>${T(k)}</span><div class="tr"><i style="width:${s.a}%;background:${s.a >= 80 ? "#5cb46a" : s.a >= 65 ? "#e3b23c" : "#e07a3a"}"></i></div><b>${pc(s.a)}</b><small style="color:#64748b">${ar(s.lt)} دون 50%</small></div>`; }).join("")}${skill.length ? `<div style="font-size:10px;color:#64748b;margin-top:6px;line-height:1.8">المواد المهارية (${skill.map(k => `${T(k)} ${pc(A.SC.sub[k].a)}`).join("، ")}) قريبة من الدرجة الكاملة ولا تميّز بين مستويات الطلاب.</div>` : ""}</div>
    <div class="box"><div class="h">المهام والمشاركة مقابل الاختبار القصير</div><div style="display:flex;gap:12px;font-size:10.5px;margin-bottom:6px"><span><i style="display:inline-block;width:10px;height:10px;border-radius:3px;background:#7c5cc4"></i> المهام والمشاركة</span><span><i style="display:inline-block;width:10px;height:10px;border-radius:3px;background:#efa53a"></i> الاختبار القصير</span></div>
    ${TQ.map(x => `<div style="border-bottom:1px dashed #e2e8f0;padding:6px 0"><div style="display:flex;justify-content:space-between"><b style="font-size:12.5px">${T(x.k)}</b><small style="color:#dd6b20;font-weight:800">الفجوة ${f1(x.t - x.q)} نقطة</small></div>${[["t", "#7c5cc4"], ["q", "#efa53a"]].map(([z, c]) => `<div style="display:flex;align-items:center;gap:6px;margin-top:3px;direction:ltr"><b style="font-size:10.5px;width:42px">${pc(x[z])}</b><div style="flex:1;height:9px;background:#eef2f6;border-radius:6px"><div style="width:${x[z]}%;height:100%;background:${c};border-radius:6px"></div></div></div>`).join("")}</div>`).join("") || `<small style="color:#94a3b8">لا تتوفر أعمدة المهام والاختبارات في الإشعار</small>`}</div></div>
    ${qRows ? `<div class="h" style="margin-top:5mm">الاختبار القصير بحسب الصف</div><table class="ht"><tr><th>المادة</th>${A.GR.map(g => `<th>${GNAME[g.g]}</th>`).join("")}</tr>${qRows}</table>` : ""}</div>${ft(2)}</div>`);
  // ٣) صفحة لكل صف
  A.GR.forEach((g, gi) => { const col = GCOL[g.g]; const cols = ACAD.filter(k => g.sub[k] && g.sub[k].has); const best = [...g.cls].filter(c => c.core != null).sort((a, b) => b.core - a.core); const R = gradeReads(g, names);
    const cell = (s, bold) => { const v = s && s.a; if (s && s.has && v == null) return `<td style="background:#eef1f4;color:#94a3b8">${s.n ? `جزئي (${ar(s.n)})` : "غير مرصودة"}</td>`; const [bg, c] = HEAT(v); return `<td style="background:${bg};color:${c}${bold ? ";font-weight:900" : ""}">${pc(v)}</td>`; };
    pages.push(`<div class="pg"><div class="bar" style="background:${col}"></div><div class="in"><div class="sec"><div class="ic" style="background:${col}">${ar(g.g)}</div><div><h2>الصف ${GNAME[g.g]} المتوسط</h2><p>${best.length > 1 ? `الفارق بين أعلى الفصول (${clsL(best[0].ck)}) وأدناها (${clsL(best[best.length - 1].ck)}) ${f1(best[0].core - best[best.length - 1].core)} نقطة.` : ""}</p></div>
      <div class="mini"><div><b>${ar(g.n)}</b><small>طالباً</small></div><div><b>${ar(g.cls.length)}</b><small>فصول</small></div><div><b style="color:${col}">${pc(g.core)}</b><small>متوسط الأساسية</small></div><div><b>${ar(g.lt50)}</b><small>لديهم مادة دون 50%</small></div></div></div>
      <div class="h">بطاقات الفصول</div><div class="cc">${g.cls.map(c => `<div class="card"><div class="t" style="background:${col}"><span>الفصل ${clsL(c.ck)}</span><span style="font-weight:500">${ar(c.n)} طالباً</span></div><div class="b"><div class="x"><b>${ar(Math.round(c.ev || 0))}%</b> ممتاز وجيد جداً<br><b>${ar(c.lt50)}</b> لديهم مادة دون 50%</div>${ring(c.core, col, 84, 10, "", 15)}</div><div style="padding:0 10px 8px">${stack(c.B, 12, true)}</div></div>`).join("")}</div>
      <div class="legend" style="margin-top:6px">${BANDS.map(b => `<span style="background:${b[2]}22;color:#334155"><i style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${b[2]}"></i> ${b[1]}</span>`).join("")}</div>
      <div class="h" style="margin-top:5mm">متوسطات المواد بحسب الفصل</div><table class="ht"><tr><th>الفصل</th><th>الأساسية</th>${cols.map(k => `<th>${T(k)}</th>`).join("")}</tr>${g.cls.map(c => `<tr><td class="k" style="background:${col}">${clsL(c.ck)}</td>${(() => { const [bg] = HEAT(c.core); return `<td style="background:#eef2f6;color:#13314a">${pc(c.core)}</td>`; })()}${cols.map(k => cell(c.sub[k])).join("")}</tr>`).join("")}<tr class="tot"><td>الصف</td><td>${pc(g.core)}</td>${cols.map(k => `<td>${pc(g.sub[k] && g.sub[k].a)}</td>`).join("")}</tr></table>
      <div class="legend">${[["90% فأعلى", 95], ["80 - 89%", 85], ["65 - 79%", 70], ["50 - 64%", 55], ["دون 50%", 30]].map(([l, v]) => `<span style="background:${HEAT(v)[0]};color:${HEAT(v)[1]}">${l}</span>`).join("")}</div>
      <div class="h" style="margin-top:5mm">قراءة الفصول</div>${R.map(r => `<div class="rd"><b>${esc(r[0])}:</b> ${esc(r[1])}</div>`).join("")}</div>${ft(3 + gi)}</div>`); });
  // ٤) الرصد وطلاب الأولوية
  const comp = A.subjAll.map(k => ({ k, ...A.SC.sub[k] })).filter(x => x.has).map(x => ({ ...x, r: x.n / x.has * 100 })).sort((a, b) => a.r - b.r);
  const missCls = comp.filter(x => x.miss > 0).map(x => { const L = A.CL.filter(c => c.sub[x.k] && c.sub[x.k].miss > 0); const full = L.filter(c => c.sub[x.k].n === 0).map(c => clsL(c.ck)), part = L.filter(c => c.sub[x.k].n > 0).map(c => clsL(c.ck)); return { k: x.k, t: [full.length ? `غير مرصودة: ${full.join(" و")}` : "", part.length ? `جزئي: ${part.join(" و")}` : ""].filter(Boolean).join(" · ") }; });
  const pn = 3 + A.GR.length;
  pages.push(`<div class="pg"><div class="bar" style="background:#64748b"></div><div class="in"><div class="sec"><div class="ic" style="background:#64748b">✓</div><div><h2>اكتمال الرصد وطلاب الأولوية</h2><p>${missCls.length ? `الرصد ناقص في ${ar(missCls.length)} مواد` : "الرصد مكتمل"}، و${ar(A.prio.length)} طالباً يحتاجون خطة فردية عاجلة.</p></div></div>
    <div class="g2"><div class="box"><div class="h">نسبة الطلاب المرصود لهم في كل مادة</div>${comp.map(x => `<div class="hb" style="grid-template-columns:140px 1fr 50px 70px"><span>${T(x.k)}</span><div class="tr"><i style="width:${x.r}%;background:${x.r >= 98 ? "#1d8a5a" : x.r >= 75 ? "#e3b23c" : "#d64545"}"></i></div><b>${pc(x.r)}</b><small style="color:#64748b">${x.miss ? `${ar(x.miss)} غير مكتمل` : "مكتمل"}</small></div>`).join("")}</div>
    <div><div class="h">الفصول غير المرصودة</div>${missCls.length ? `<table class="lt"><tr><th>المادة</th><th>الفصول المعنية</th></tr>${missCls.map(x => `<tr><td style="background:#3d566e;color:#fff;font-weight:800;text-align:center">${T(x.k)}</td><td>${esc(x.t)}</td></tr>`).join("")}</table>` : `<div class="box" style="text-align:center;color:#15803d;font-weight:800">✓ جميع المواد مرصودة</div>`}</div></div>
    <div class="h" style="margin-top:5mm">عدد الطلاب الذين لديهم مادة فأكثر دون 50% في كل فصل</div><div class="box" style="background:#fff">${colsSvg(A.CL, "lt50")}</div>
    <div class="h" style="margin-top:5mm">طلاب الأولوية في المتابعة <small>(متوسط الأساسية دون 60% أو مادتان فأكثر دون 50%)</small></div>
    <table class="lt"><tr><th>الفصل</th><th>الطالب</th><th>متوسط الأساسية</th><th>المواد دون 50%</th></tr>${A.prio.slice(0, 16).map(r => { const [bg, c] = HEAT(r.core); return `<tr><td style="background:${GCOL[r.g]};color:#fff;text-align:center;font-weight:800">${clsL(r.ck)}</td><td><b>${esc(r.n)}</b></td><td style="background:${bg};color:${c};text-align:center;font-weight:800">${pc(r.core)}</td><td>${r.low.map(T).join("، ") || "—"}</td></tr>`; }).join("")}</table>${A.prio.length > 16 ? `<div style="font-size:10px;color:#64748b;margin-top:3px">… و${ar(A.prio.length - 16)} طلاب آخرين في صفحة «الطلاب» بالموقع.</div>` : ""}</div>${ft(pn)}</div>`);
  // ٥) المتفوقون والتوصيات
  const P = recPlan(A, names); const TC = { "عاجل": "#d64545", "علاجي": "#dd6b20", "تطويري": "#2b6cb0", "متابعة": "#1d8a5a" };
  pages.push(`<div class="pg"><div class="bar" style="background:#d4a72c"></div><div class="in"><div class="sec"><div class="ic" style="background:#d4a72c">★</div><div><h2>المتفوقون والتوصيات</h2><p>الأولوية: استكمال الرصد، ثم علاج المواد الأضعف، ثم ضبط معايير تقويم المهام.</p></div></div>
    <div class="h">أعلى ثلاثة طلاب في كل صف <small>(متوسط المواد الأساسية)</small></div><div style="display:grid;grid-template-columns:repeat(${A.GR.length},1fr);gap:8px">${A.GR.map(g => `<div class="tp"><div class="t" style="background:${GCOL[g.g]}">الصف ${GNAME[g.g]}</div>${(A.top[g.g] || []).map((r, i) => `<div class="r"><div class="md" style="background:${["#d4a72c", "#9aa6b2", "#b7794a"][i]}">${ar(i + 1)}</div><div style="flex:1"><b style="font-size:12px">${esc(r.n)}</b><div style="font-size:10px;color:#64748b">الفصل ${clsL(r.ck)}</div></div><b style="color:#1d8a5a;font-size:13px">${pc(r.core)}</b></div>`).join("")}</div>`).join("")}</div>
    <div class="h" style="margin-top:6mm">خطة التوصيات</div><table class="lt"><tr><th>م</th><th>النوع</th><th>الإجراء</th><th>المسؤول</th><th>الموعد</th><th>مؤشر التحقق</th></tr>${P.map((p, i) => `<tr><td style="text-align:center;font-weight:800">${ar(i + 1)}</td><td style="text-align:center"><span class="tag" style="background:${TC[p[0]]}">${p[0]}</span></td><td>${esc(p[1])}</td><td style="text-align:center">${esc(p[2])}</td><td style="text-align:center">${esc(p[3])}</td><td style="text-align:center">${esc(p[4])}</td></tr>`).join("")}</table>
    <div style="font-size:9.5px;color:#64748b;margin-top:5px;line-height:1.8">المسؤولون والمواعيد مقترحة وتُعدَّل بحسب تشكيلات المدرسة. النسبة = الدرجة ÷ النهاية العظمى. المواد الأساسية: العربية والرياضيات والعلوم والإنجليزية بحسب المرصود. التقديرات: ممتاز 90% فأعلى، جيد جداً من 80%، جيد من 65%، مقبول من 50%.</div>
    <div class="sig"><div>قائد المدرسة<b>${esc(cfg.principal)}</b></div><div>التوقيع</div><div>الختم</div></div></div>${ft(pn + 1)}</div>`);
  return pages.join("");
}

// ─────────── بطاقة الطالب ───────────
const TIP = { ar: "قراءة يومية ١٥ دقيقة بصوت مسموع، وتدريب على الإملاء والقواعد بأمثلة من الكتاب.", ma: "حل ٥ مسائل يومياً من تمارين الدرس، ومراجعة الأخطاء مع المعلم، وتثبيت المفاهيم الأساسية أولاً.", sc: "تلخيص كل درس في خريطة مفاهيم، وحل أسئلة التقويم في نهاية الدرس، وربط المفاهيم بالحياة.", en: "حفظ ١٠ كلمات أسبوعياً، والاستماع لمقاطع قصيرة، والتدرّب على تكوين جمل كتابةً ونطقاً.", is: "مراجعة الحفظ يومياً مع التلاوة الصحيحة، وفهم معاني الآيات والأحاديث.", so: "ربط الدروس بالخرائط والصور، وتلخيص الأفكار الرئيسة في بطاقات.", dg: "التطبيق العملي على الحاسب وإكمال المشاريع المطلوبة في وقتها.", cr: "حل ألغاز ومسائل تفكير أسبوعياً، ومناقشة الآراء وتعليلها." };
export function studentCard(r, sum, M, cfg) {
  const names = obj(M.names); const T = k => subT(k, names); const C = obj(obj(sum).cls)[r.ck] || {}; const G = obj(obj(sum).gr)[r.g] || {}; const S = obj(r.S);
  const ks = [...ACAD, ...SUBJ.filter(x => x[5] === 3).map(x => x[0]), ...Object.keys(S).filter(k => !SK[k])].filter(k => S[k]);
  const L = ks.map(k => { const x = S[k]; const p = sp(x); const ca = obj(C.sub)[k]; return { k, x, p, ca: ca == null ? null : ca, d: p != null && ca != null ? p - ca : null, tq: x.tm && x.qm ? { t: x.t / x.tm * 100, q: x.q / x.qm * 100 } : null }; });
  const core = coreOf(r), acad = acadOf(r); const bi = band(core); const bc = bi == null ? "#94a3b8" : BANDS[bi][2];
  const A = L.filter(x => ACAD.includes(x.k) && x.p != null); const strong = A.filter(x => x.p >= 90 || (x.d != null && x.d >= 5 && x.p >= 80)).sort((a, b) => b.p - a.p);
  const weak = A.filter(x => x.p < 65 || (x.d != null && x.d <= -8)).sort((a, b) => a.p - b.p); const miss = L.filter(x => x.p == null);
  const above = A.filter(x => x.d != null && x.d > 0).length; const gap = L.filter(x => x.tq && x.tq.t - x.tq.q >= 15 && CORE.includes(x.k));
  const rad = A.filter(x => ACAD.includes(x.k)).map(x => ({ t: T(x.k), me: x.p, cls: x.ca }));
  const card = x => { const p = x.p; const [, tc] = HEAT(p); const col = p == null ? "#94a3b8" : p >= 90 ? "#1d8a5a" : p >= 80 ? "#4f9e55" : p >= 65 ? "#c9971b" : p >= 50 ? "#dd6b20" : "#d64545"; const b = p == null ? null : BANDS[band(p)];
    return `<div class="sc" style="--c:${col}"><div class="a"><span class="i">${SK[x.k] ? SK[x.k].ic : "📘"}</span><b>${T(x.k)}</b><span class="p">${p == null ? "—" : f1(p) + "%"}</span></div><div class="tr">${p != null ? `<i style="width:${p}%"></i>` : ""}${x.ca != null ? `<u style="right:calc(${x.ca}% - 1px)" title="متوسط الفصل"></u>` : ""}</div>
      <div class="m"><span>${p == null ? "لم تُرصد بعد" : `${ar(x.x.s)} من ${ar(x.x.m)}`}${b ? ` · <span class="bd" style="background:${b[2]}22;color:${tc}">${b[1]}</span>` : ""}</span><span>${x.ca != null ? `الفصل ${f1(x.ca)}% ${x.d != null ? `<b style="color:${x.d >= 0 ? "#15803d" : "#b91c1c"}">${x.d >= 0 ? "▲" : "▼"} ${f1(Math.abs(x.d))}</b>` : ""}` : ""}</span></div>
      ${x.tq ? `<div class="m" style="margin-top:3px;background:#f8fafc;border-radius:7px;padding:2px 7px"><span>🧩 المهام <b>${f1(x.tq.t)}%</b></span><span>📝 الاختبار القصير <b>${f1(x.tq.q)}%</b></span></div>` : ""}</div>`; };
  const acadL = L.filter(x => ACAD.includes(x.k)), skL = L.filter(x => !ACAD.includes(x.k));
  const rec = [...weak.slice(0, 3).map(x => `<b>${T(x.k)}:</b> ${TIP[x.k] || "متابعة مع معلم المادة ومراجعة الدروس أسبوعياً."}`), ...gap.slice(0, 2).map(x => `<b>${T(x.k)}:</b> درجات المهام (${f1(x.tq.t)}%) أعلى من الاختبارات القصيرة (${f1(x.tq.q)}%) — يحتاج تدريباً على حل الأسئلة ونماذج الاختبارات.`)];
  if (!rec.length) rec.push("الحفاظ على هذا المستوى المتميز بالمراجعة المنتظمة، والمشاركة في المسابقات والأنشطة الإثرائية.");
  const hdl = bi == null ? "نتائج الفترة" : bi === 0 ? "أداء متميز — ما شاء الله" : bi === 1 ? "أداء جيد جداً — قريب من التميز" : bi === 2 ? "أداء جيد — يحتاج دفعة في بعض المواد" : bi === 3 ? "يحتاج متابعة ودعماً" : "يحتاج خطة علاجية عاجلة";
  return `<div class="pg"><div class="sh"><div class="top"><span>${esc(cfg.school)}</span><span>${esc(M.perT || "")} · ${esc((M.term || "").replace(/^الفصل\s*/, "الفصل الدراسي "))} · ${esc(M.year || "")}هـ</span></div>
    <div class="who"><div style="background:#fff;border-radius:50%;padding:4px;flex:0 0 auto">${ring(core, bc, 112, 12, "الأساسية", 20)}</div><div style="flex:1"><h3>${esc(r.n)}</h3><p>الصف ${GNAME[r.g] || ar(r.g)} المتوسط · الفصل ${clsL(r.ck)}</p><div class="chips"><span style="background:${bc};border-color:${bc}">${bi == null ? "—" : BANDS[bi][1]}</span><span>${esc(hdl)}</span>${C.core != null ? `<span>متوسط فصله ${f1(C.core)}%</span>` : ""}</div></div></div></div>
    <div class="sk"><div style="--c:#0f8b7a"><b>${pc(acad)}</b><small>متوسط المواد الأكاديمية</small></div><div style="--c:#1d8a5a"><b>${ar(strong.length)}</b><small>مواد تميّز</small></div><div style="--c:#dd6b20"><b>${ar(weak.length)}</b><small>مواد تحتاج دعماً</small></div><div style="--c:#2b6cb0"><b style="direction:rtl">${ar(above)} <span style="font-size:13px">من</span> ${ar(A.length)}</b><small>مواد أعلى من متوسط فصله</small></div></div>
    <div class="in" style="padding-top:0"><div class="sx"><div><div class="h">المواد الأكاديمية <small>(الخط الداكن = متوسط الفصل)</small></div><div class="sub3">${acadL.map(card).join("")}</div></div>
      <div class="box" style="text-align:center;background:#fff"><div class="h">خريطة الأداء</div>${radar(rad, 250)}<div style="display:flex;gap:10px;justify-content:center;font-size:10px"><span><i style="display:inline-block;width:14px;height:3px;background:#0f8b7a;vertical-align:middle"></i> الطالب</span><span><i style="display:inline-block;width:14px;height:3px;background:#94a3b8;vertical-align:middle"></i> متوسط الفصل</span></div>
      ${r.att >= 0 || r.bp >= 0 ? `<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:8px">${r.att >= 0 ? `<div style="background:#f0f9ff;border-radius:10px;padding:6px"><b style="color:#0369a1;font-size:16px">${ar(r.att)}</b><div style="font-size:9.5px;color:#475569">درجة المواظبة</div></div>` : ""}${r.bp >= 0 ? `<div style="background:#f5f3ff;border-radius:10px;padding:6px"><b style="color:#6d28d9;font-size:16px">${ar(r.bp)}</b><div style="font-size:9.5px;color:#475569">السلوك الإيجابي</div></div>` : ""}</div>` : ""}</div></div>
    ${skL.length ? `<div class="h" style="margin-top:4mm">المواد المهارية</div><div style="display:flex;gap:6px;flex-wrap:wrap">${skL.map(x => { const [bg, c] = HEAT(x.p); return `<span style="background:${bg};color:${c};border-radius:999px;padding:4px 12px;font-size:11.5px;font-weight:800">${SK[x.k] ? SK[x.k].ic : ""} ${T(x.k)}: ${x.p == null ? "لم تُرصد" : f1(x.p) + "%"}</span>`; }).join("")}</div>` : ""}
    <div class="g2" style="margin-top:4mm"><div class="ok"><b style="color:#15803d">🌟 نقاط التميّز</b><ul>${strong.length ? strong.slice(0, 5).map(x => `<li><b>${T(x.k)}</b> ${f1(x.p)}%${x.d != null && x.d > 0 ? ` — أعلى من متوسط فصله بـ${f1(x.d)} نقطة` : ""}</li>`).join("") : `<li>يحتاج إلى رفع مستواه ليظهر تميّزه — كل مادة فوق 90% تظهر هنا.</li>`}</ul></div>
    <div class="wk"><b style="color:#c2410c">🎯 يحتاج دعماً</b><ul>${weak.length ? weak.slice(0, 5).map(x => `<li><b>${T(x.k)}</b> ${f1(x.p)}%${x.d != null && x.d < 0 ? ` — أقل من متوسط فصله بـ${f1(-x.d)} نقطة` : ""}${x.p < 50 ? " <b style='color:#b91c1c'>(دون 50%)</b>" : ""}</li>`).join("") : `<li>لا توجد مادة ضعيفة — أداء متوازن 👏</li>`}${miss.length ? `<li style="color:#64748b">لم تُرصد بعد: ${miss.map(x => T(x.k)).join("، ")}</li>` : ""}</ul></div></div>
    <div class="box" style="margin-top:4mm;background:#fff"><div class="h">💡 توصيات للطالب وولي الأمر</div>${rec.map(t => `<div class="rd">${t}</div>`).join("")}</div>
    <div style="font-size:9.5px;color:#64748b;margin-top:4mm;text-align:center">هذا التقرير تحليل لإشعار ${esc(M.perT || "الفترة")} من نظام نور، وليس النتيجة النهائية للطالب. النسبة = الدرجة ÷ النهاية العظمى.</div></div>
    <div class="ft"><span>${esc(cfg.school)} · بطاقة نتائج ${esc(M.perT || "الفترة")}</span><span>${esc(cfg.principal ? "قائد المدرسة: " + cfg.principal : "")}</span></div></div>`;
}
// ملخص يُحفظ للمقارنة (متوسطات الفصل والصف لكل مادة)
function mkSum(A) { const sub = x => Object.fromEntries(Object.entries(x.sub).filter(([, v]) => v.a != null).map(([k, v]) => [k, Math.round(v.a * 10) / 10])); return { cls: Object.fromEntries(A.CL.map(c => [c.ck, { n: c.n, core: c.core == null ? -1 : Math.round(c.core * 10) / 10, sub: sub(c) }])), gr: Object.fromEntries(A.GR.map(g => [g.g, { n: g.n, core: g.core == null ? -1 : Math.round(g.core * 10) / 10, sub: sub(g) }])), at: Date.now() }; }
// Firebase يحوّل المفاتيح الرقمية (الصفوف 1،2،3) إلى مصفوفة فيها null — نُعيدها كائناً ونتجاهل الفراغات
const fixSum = s => { const o = obj(s); const f = x => ({ ...x, core: x.core == null || x.core < 0 ? null : x.core, sub: obj(x.sub) }); const m = v => Object.fromEntries(Object.entries(obj(v)).filter(([, x]) => x && typeof x === "object").map(([k, x]) => [k, f(x)])); return { cls: m(o.cls), gr: m(o.gr) }; };
const fixRec = r => ({ ...obj(r), S: Object.fromEntries(Object.entries(obj(obj(r).S)).filter(([, x]) => x && typeof x === "object").map(([k, x]) => [k, { ...x, s: x.s < 0 ? -1 : x.s }])) });
const perTitle = s => { const t = nrm(s); return /ثاني/.test(t) ? "الفترة الثانية" : /ثالث/.test(t) ? "الفترة الثالثة" : /اولي|اول/.test(t) ? "الفترة الأولى" : "الفترة"; };

// ─────────── واجهات React ───────────
const UI = `.pa{font-family:inherit;direction:rtl;color:#13314a}.pa-b{border:none;border-radius:13px;padding:9px 16px;font-family:inherit;font-weight:800;font-size:14px;cursor:pointer;display:inline-flex;align-items:center;gap:6px}.pa-b:disabled{opacity:.5;cursor:default}
.pa-pri{background:#0f7c6c;color:#fff}.pa-nv{background:#13314a;color:#fff}.pa-gh{background:#fff;color:#334155;border:1.5px solid #e2e8f0}.pa-gold{background:#d4a72c;color:#13314a}.pa-card{background:#fff;border:1px solid #e3e9ef;border-radius:20px;padding:14px;box-shadow:0 14px 32px -28px rgba(15,23,42,.6)}
.pa-tab{border:1.5px solid #e2e8f0;background:#fff;border-radius:999px;padding:7px 15px;font-family:inherit;font-weight:800;font-size:13.5px;cursor:pointer;color:#334155}.pa-tab.on{background:#13314a;color:#fff;border-color:#13314a}
.pa-in{border:1.5px solid #e2e8f0;border-radius:12px;padding:8px 11px;font-family:inherit;font-size:14px;font-weight:700;background:#fff;color:#13314a}.pa-drop{border:2.5px dashed #9fd3c7;border-radius:22px;padding:26px 16px;text-align:center;background:linear-gradient(135deg,#f0fbf8,#fff);cursor:pointer;transition:.2s}.pa-drop:hover,.pa-drop.on{border-color:#0f7c6c;background:#e6f7f2}
.pa-t{width:100%;border-collapse:separate;border-spacing:0 4px;font-size:13px}.pa-t th{background:#13314a;color:#fff;padding:8px 6px;font-weight:800;position:sticky;top:0;z-index:1}.pa-t td{background:#f8fafc;padding:6px;text-align:center;font-weight:700}.pa-t tr:hover td{background:#eef6f4;cursor:pointer}
.pa-pages{overflow:hidden;border-radius:18px;background:#e9eef3;padding:12px}`;
function Pages({ html, fluid }) { const ref = useRef(null); const [z, setZ] = useState(1); useEffect(() => { const f = () => { const w = ref.current ? ref.current.clientWidth - 24 : 800; setZ(Math.min(1, w / 800)); }; f(); window.addEventListener("resize", f); return () => window.removeEventListener("resize", f); }, []);
  return <div ref={ref} className="pa-pages" style={fluid ? { containerType: "inline-size", containerName: "pa", padding: 6 } : null}><style>{CSS}</style><div className={`pr${fluid ? " fluid" : ""}`} style={fluid ? null : { zoom: z }} dangerouslySetInnerHTML={{ __html: html }} /></div>; }
const cfgOf = api => ({ school: api.school || "المدرسة", region: api.region || "", principal: api.principal || "", logo: api.logo || "" });

export function PeriodAdmin({ api, me }) {
  const [idx, setIdx] = useState(null); const [pid, setPid] = useState(""); const [D, setD] = useState(null); const [tab, setTab] = useState("rep"); const [msg, setMsg] = useState("");
  const [up, setUp] = useState(null); const [prog, setProg] = useState(null); const [drag, setDrag] = useState(false); const [q, setQ] = useState(""); const [fc, setFc] = useState(""); const [one, setOne] = useState(null); const [sort, setSort] = useState("cls");
  const cfg = cfgOf(api); const fr = useRef(null);
  const toast = m => { setMsg(m); setTimeout(() => setMsg(""), 4000); };
  const loadIdx = async () => { const v = obj(await api.maGet(`${NODE}/idx`)); setIdx(v); const L = Object.entries(v).sort((a, b) => (b[1].at || 0) - (a[1].at || 0)); if (L.length && !pid) setPid(L[0][0]); if (!L.length) setTab("up"); return v; };
  useEffect(() => { loadIdx(); }, []);
  useEffect(() => { if (!pid) return; setD(null); api.maGet(`${NODE}/d/${pid}`).then(v => setD(Object.fromEntries(Object.entries(obj(v)).map(([k, r]) => [k, fixRec(r)])))); }, [pid]);
  const M = obj(obj(idx)[pid]); const A = useMemo(() => D ? analyze(D) : null, [D]);
  const repHtml = useMemo(() => A && A.rows.length ? schoolReport(A, M, cfg) : "", [A, M.at]);
  // ── الرفع ──
  const pick = async files => { const FL = [...files].filter(f => /\.pdf$/i.test(f.name) || f.type === "application/pdf"); if (!FL.length) { toast("⚠️ اختر ملفات PDF (إشعار فترة من نظام نور)"); return; }
    let L; try { L = await api.pdfLib(); } catch (e) { toast("⚠️ " + (e.message || "تعذّر تحميل قارئ PDF")); return; }
    const all = []; const rep = [];
    for (let i = 0; i < FL.length; i++) { const f = FL[i]; setProg({ f: f.name, i, n: FL.length, p: 0, t: 1 }); try { const r = await parseFile(L, await f.arrayBuffer(), (p, t) => setProg({ f: f.name, i, n: FL.length, p, t })); all.push(...r.students); rep.push({ f: f.name, n: r.students.length, pages: r.pages, bad: r.bad }); } catch (e) { rep.push({ f: f.name, n: 0, err: e.message || String(e) }); } }
    setProg(null); if (!all.length) { setUp({ rep, recs: [] }); toast("⚠️ لم يُعثر على إشعارات طلاب في الملفات"); return; }
    const byId = new Map(); all.forEach(s => byId.set(s.id, s)); const S = [...byId.values()]; const { recs, names } = buildRecs(S);
    const ros = obj(await api.maGet(api.MA_ROSTER)); const RN = {}; Object.entries(ros).forEach(([ck, r]) => (Array.isArray(r && r.students) ? r.students : vals(r && r.students)).forEach(s => { if (s && s.nh) RN[s.nh] = { ck, sid: s.id }; }));
    for (const r of recs) { r.nh = await api.stuHash(r.id); const m = RN[r.nh]; if (m) { r.sid = m.sid; r.rck = m.ck; } } try { api.idSave && api.idSave(recs.map(r => [r.nh, r.id])); } catch {}
    const s0 = S[0]; const year = s0.year || ""; const per = perTitle(s0.per); const tn = /ثاني/.test(nrm(s0.term)) ? 2 : /ثالث/.test(nrm(s0.term)) ? 3 : 1; const pn = /ثاني/.test(per) ? 2 : /ثالث/.test(per) ? 3 : 1;
    const id = `${(year.split("-")[1] || year || "y").replace(/\D/g, "")}_${tn}_${pn}`;
    setUp({ rep, recs, names, meta: { id, year, term: s0.term || "", perT: per, date: s0.date || "", t: `${per} — ${s0.term || ""} ${year}هـ` } }); };
  const save = async () => { const { recs, meta, names } = up; const P = {}; recs.forEach(r => { const { id, rck, ...o } = r; P[`${NODE}/d/${meta.id}/${r.nh}`] = o; });
    const old = obj(obj(idx)[meta.id]); const keys = Object.keys(P); for (let i = 0; i < keys.length; i += 150) { const part = Object.fromEntries(keys.slice(i, i + 150).map(k => [k, P[k]])); const ok = await api.fbPatch(part); if (!ok) { toast("⚠️ تعذّر الحفظ — تحقق من الاتصال وأعد المحاولة"); return; } }
    const full = obj(await api.maGet(`${NODE}/d/${meta.id}`)); const A2 = analyze(Object.fromEntries(Object.entries(full).map(([k, r]) => [k, fixRec(r)])));
    await api.fbPatch({ [`${NODE}/idx/${meta.id}`]: { ...old, ...meta, names: { ...obj(old.names), ...names }, n: A2.rows.length, at: Date.now(), by: me && me.name || "الإدارة", pub: old.pub ?? 1 }, [`${NODE}/sum/${meta.id}`]: mkSum(A2) });
    toast(`✅ حُفظت نتائج ${ar(recs.length)} طالباً — وظهرت في حساباتهم`); setUp(null); await loadIdx(); setPid(meta.id); setD(null); api.maGet(`${NODE}/d/${meta.id}`).then(v => setD(Object.fromEntries(Object.entries(obj(v)).map(([k, r]) => [k, fixRec(r)])))); setTab("rep"); };
  const setPub = async v => { await api.fbPatch({ [`${NODE}/idx/${pid}/pub`]: v ? 1 : 0 }); setIdx(x => ({ ...x, [pid]: { ...x[pid], pub: v ? 1 : 0 } })); toast(v ? "👁 النتائج ظاهرة للطلاب وأولياء الأمور" : "🙈 أُخفيت النتائج عن الطلاب"); };
  const del = async () => { if (!window.confirm(`حذف «${M.t}» وجميع نتائجها؟`)) return; await api.fbPatch({ [`${NODE}/d/${pid}`]: null, [`${NODE}/sum/${pid}`]: null, [`${NODE}/idx/${pid}`]: null }); setPid(""); setD(null); await loadIdx(); toast("🗑️ حُذفت الفترة"); };
  const sumC = useMemo(() => A ? mkSum(A) : null, [A]);
  const stuHtml = r => studentCard(r, fixSum(sumC), M, cfg);
  const rowsF = A ? A.rows.filter(r => (!fc || r.ck === fc) && (!q || nrm(r.n).includes(nrm(q)))).sort((a, b) => sort === "lo" ? (a.core ?? 999) - (b.core ?? 999) : sort === "hi" ? (b.core ?? -1) - (a.core ?? -1) : 0) : [];
  const cols = A ? ACAD.filter(k => A.subjAll.includes(k)) : [];
  const PL = Object.entries(obj(idx)).sort((a, b) => (b[1].at || 0) - (a[1].at || 0));
  return <div className="pa grid gap-3" style={{ maxWidth: 1180, margin: "0 auto" }}><style>{UI}</style>
    <div style={{ borderRadius: 24, padding: "18px 22px", color: "#fff", background: "linear-gradient(120deg,#0e3448,#0d5c5a 60%,#0f7c6c)", borderBottom: "4px solid #d4a72c", display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
      <div style={{ width: 54, height: 54, borderRadius: 16, background: "rgba(255,255,255,.12)", display: "grid", placeItems: "center", fontSize: 28 }}>🎓</div>
      <div style={{ flex: "1 1 260px" }}><b style={{ fontSize: 21 }}>تحليل نتائج الفترة</b><div style={{ fontSize: 13, opacity: .88, fontWeight: 600, marginTop: 3 }}>ارفع «إشعار فترة» من نظام نور (PDF) ← تحليل احترافي للمدرسة والصفوف والفصول ← بطاقة نتائج في حساب كل طالب</div></div>
      {PL.length > 0 && <select className="pa-in" value={pid} onChange={e => setPid(e.target.value)} style={{ minWidth: 220 }}>{PL.map(([k, v]) => <option key={k} value={k}>{v.t || k}</option>)}</select>}</div>
    {msg && <div style={{ background: /⚠️/.test(msg) ? "#fef2f2" : "#f0fdf4", color: /⚠️/.test(msg) ? "#b91c1c" : "#15803d", borderRadius: 14, padding: 10, fontWeight: 800, textAlign: "center" }}>{msg}</div>}
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>{[["rep", "📊 التقرير التحليلي"], ["stu", "👥 الطلاب"], ["up", "⬆️ رفع إشعارات فترة"]].map(([k, l]) => <button key={k} className={`pa-tab ${tab === k ? "on" : ""}`} onClick={() => setTab(k)}>{l}</button>)}
      {pid && M.t && <span style={{ marginInlineStart: "auto", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}><label style={{ display: "flex", gap: 6, alignItems: "center", fontWeight: 800, fontSize: 13, cursor: "pointer" }}><input type="checkbox" checked={M.pub !== 0} onChange={e => setPub(e.target.checked)} style={{ width: 17, height: 17 }} />ظاهرة في حسابات الطلاب</label><button className="pa-b pa-gh" style={{ padding: "6px 12px", fontSize: 12.5 }} onClick={del}>🗑️</button></span>}</div>

    {tab === "up" && <div className="pa-card grid gap-3">
      <div className={`pa-drop ${drag ? "on" : ""}`} onClick={() => fr.current && fr.current.click()} onDragOver={e => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={e => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files); }}>
        <div style={{ fontSize: 46 }}>📂</div><b style={{ fontSize: 17 }}>استعرض ملفات «إشعار فترة» أو اسحبها هنا</b><div style={{ fontSize: 13, color: "#475569", fontWeight: 600, marginTop: 6, lineHeight: 1.9 }}>من نظام نور: التقارير ← إشعار فترة ← لكل صف ملف PDF (يمكن اختيار عدة ملفات معاً)<br />يقرأ النظام اسم الطالب وفصله ودرجاته في كل مادة تلقائياً</div>
        <input ref={fr} type="file" accept="application/pdf,.pdf" multiple style={{ display: "none" }} onChange={e => { const f = e.target.files; if (f && f.length) pick(f); e.target.value = ""; }} /></div>
      {prog && <div className="pa-card" style={{ background: "#f8fafc" }}><b>⏳ جارٍ قراءة {prog.f} ({ar(prog.i + 1)} من {ar(prog.n)}) — صفحة {ar(prog.p)} من {ar(prog.t)}</b><div style={{ height: 10, borderRadius: 6, background: "#e2e8f0", marginTop: 8, overflow: "hidden" }}><div style={{ height: "100%", width: `${prog.p / prog.t * 100}%`, background: "linear-gradient(90deg,#0f7c6c,#d4a72c)", transition: ".2s" }} /></div></div>}
      {up && <div className="grid gap-3">
        <div className="grid gap-2">{up.rep.map((r, i) => <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", background: r.n ? "#f0fdf4" : "#fef2f2", borderRadius: 12, padding: "8px 12px", fontWeight: 700, fontSize: 13 }}><span>📄 <span dir="ltr">{r.f}</span></span><span style={{ marginInlineStart: "auto", color: r.n ? "#15803d" : "#b91c1c" }}>{r.err ? `⚠️ ${r.err}` : `${ar(r.n)} طالباً من ${ar(r.pages)} صفحة${r.bad && r.bad.length ? ` · تعذّر قراءة ${ar(r.bad.length)} صفحة` : ""}`}</span></div>)}</div>
        {up.recs.length > 0 && (() => { const G = {}; up.recs.forEach(r => { (G[r.g] = G[r.g] || {})[r.ck] = (G[r.g][r.ck] || 0) + 1; }); const unm = up.recs.filter(r => !r.sid); const mv = up.recs.filter(r => r.rck && r.rck !== r.ck);
          return <div className="grid gap-2">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 8 }}><div style={{ background: "#0f7c6c", color: "#fff", borderRadius: 16, padding: 12 }}><b style={{ fontSize: 26 }}>{ar(up.recs.length)}</b><div style={{ fontWeight: 700 }}>طالباً</div></div><div style={{ background: "#13314a", color: "#fff", borderRadius: 16, padding: 12 }}><b style={{ fontSize: 18 }}>{up.meta.perT}</b><div style={{ fontWeight: 700, fontSize: 12.5 }}>{up.meta.term} · {up.meta.year}</div></div><div style={{ background: unm.length ? "#fff7ed" : "#f0fdf4", color: unm.length ? "#c2410c" : "#15803d", borderRadius: 16, padding: 12, border: "1px solid #e2e8f0" }}><b style={{ fontSize: 22 }}>{ar(up.recs.length - unm.length)}</b><div style={{ fontWeight: 700, fontSize: 12.5 }}>مطابقون لكشوف المدرسة{unm.length ? ` · ${ar(unm.length)} غير مطابق` : ""}</div></div></div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{Object.entries(G).map(([g, C]) => Object.entries(C).sort().map(([ck, n]) => <span key={ck} style={{ background: GCOL[g] + "18", color: GCOL[g], borderRadius: 999, padding: "3px 12px", fontWeight: 800, fontSize: 12.5 }}>{clsL(ck)}: {ar(n)}</span>))}</div>
            {unm.length > 0 && <details><summary style={{ cursor: "pointer", fontWeight: 800, fontSize: 13, color: "#c2410c" }}>طلاب برقم هوية غير موجود في كشوف المدرسة ({ar(unm.length)}) — تُحفظ نتائجهم ويرونها عند الدخول برقم هويتهم</summary><div style={{ fontSize: 12.5, lineHeight: 2, marginTop: 6 }}>{unm.map(r => `${r.n} (${clsL(r.ck)})`).join(" • ")}</div></details>}
            {mv.length > 0 && <div style={{ fontSize: 12.5, color: "#64748b", fontWeight: 700 }}>ℹ️ {ar(mv.length)} طلاب فصلهم في الإشعار يختلف عن كشوف المدرسة — يُعتمد فصل الإشعار في التحليل.</div>}
            <label style={{ fontSize: 12.5, fontWeight: 800, color: "#475569" }}>عنوان الفترة<input className="pa-in" style={{ width: "100%", marginTop: 4 }} value={up.meta.t} onChange={e => setUp(u => ({ ...u, meta: { ...u.meta, t: e.target.value } }))} /></label>
            {obj(idx)[up.meta.id] && <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12, padding: "8px 12px", fontSize: 12.5, fontWeight: 700, color: "#92400e" }}>يوجد تحليل محفوظ لهذه الفترة ({ar(obj(idx)[up.meta.id].n || 0)} طالباً) — سيُضاف الجديد ويُحدَّث الطالب المكرر.</div>}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><button className="pa-b pa-pri" onClick={save}>💾 حفظ وتحليل ونشر في حسابات الطلاب</button><button className="pa-b pa-gh" onClick={() => setUp(null)}>إلغاء</button></div></div>; })()}</div>}
      {!up && !prog && <div style={{ fontSize: 12.5, color: "#64748b", fontWeight: 600, lineHeight: 1.9 }}>🔒 لا يُحفظ رقم هوية الطالب — تُحفظ بصمة مشفّرة منه فقط لربط النتيجة بحسابه. ويمكن رفع كل صف في وقت مختلف؛ تُدمج الملفات في تحليل واحد للفترة.</div>}
    </div>}

    {tab === "rep" && (!pid ? <div className="pa-card" style={{ textAlign: "center", color: "#64748b", fontWeight: 800 }}>لا توجد فترة محفوظة — ابدأ من «⬆️ رفع إشعارات فترة»</div> : !A ? <div className="pa-card" style={{ textAlign: "center", color: "#94a3b8" }}>⏳ جارٍ التحليل…</div> : <div className="grid gap-2">
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><button className="pa-b pa-gold" onClick={() => api.print(PRINT("تقرير تحليل نتائج الطلاب", repHtml))}>🖨 طباعة التقرير / حفظ PDF</button><span style={{ alignSelf: "center", fontSize: 12.5, color: "#64748b", fontWeight: 700 }}>{ar(A.rows.length)} طالباً · {ar(A.CL.length)} فصلاً · {ar(4 + A.GR.length)} صفحات A4</span></div>
      <Pages html={repHtml} /></div>)}

    {tab === "stu" && A && <div className="grid gap-2">
      <div className="pa-card" style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", padding: 10 }}><input className="pa-in" style={{ flex: "1 1 200px" }} value={q} onChange={e => setQ(e.target.value)} placeholder="🔎 ابحث باسم الطالب" />
        <select className="pa-in" value={fc} onChange={e => setFc(e.target.value)}><option value="">كل الفصول</option>{A.CL.map(c => <option key={c.ck} value={c.ck}>الفصل {clsL(c.ck)}</option>)}</select>
        <select className="pa-in" value={sort} onChange={e => setSort(e.target.value)}><option value="cls">ترتيب الكشف</option><option value="hi">الأعلى أولاً</option><option value="lo">الأدنى أولاً</option></select>
        {fc && <button className="pa-b pa-nv" onClick={() => api.print(PRINT(`بطاقات الفصل ${fc}`, A.rows.filter(r => r.ck === fc).map(stuHtml).join("")))}>🖨 بطاقات الفصل كاملة</button>}</div>
      <div className="pa-card" style={{ overflowX: "auto", padding: 8, maxHeight: "70vh", overflowY: "auto" }}><table className="pa-t"><thead><tr><th>الفصل</th><th style={{ textAlign: "right" }}>الطالب</th><th>الأساسية</th>{cols.map(k => <th key={k}>{subT(k, M.names)}</th>)}</tr></thead>
        <tbody>{rowsF.map(r => <tr key={r.nh || r.n} onClick={() => setOne(r)}><td style={{ background: GCOL[r.g], color: "#fff", borderRadius: "0 10px 10px 0" }}>{clsL(r.ck)}</td><td style={{ textAlign: "right" }}>{r.n}</td>{(() => { const [bg, c] = HEAT(r.core); return <td style={{ background: bg, color: c, fontWeight: 900 }}>{pc(r.core)}</td>; })()}{cols.map(k => { const p = sp(r.S[k]); const [bg, c] = HEAT(p); return <td key={k} style={{ background: r.S[k] ? bg : "#fff", color: c }}>{r.S[k] ? (p == null ? "—" : Math.round(p)) : ""}</td>; })}</tr>)}</tbody></table>
        {!rowsF.length && <div style={{ textAlign: "center", color: "#94a3b8", padding: 20, fontWeight: 800 }}>لا نتائج</div>}</div></div>}
    {one && <div style={{ position: "fixed", inset: 0, zIndex: 900, background: "rgba(15,23,42,.6)", overflow: "auto", padding: 12 }} onClick={() => setOne(null)}><div style={{ maxWidth: 840, margin: "0 auto" }} onClick={e => e.stopPropagation()}>
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}><button className="pa-b pa-gold" onClick={() => api.print(PRINT(one.n, stuHtml(one)))}>🖨 طباعة بطاقة الطالب</button><button className="pa-b pa-gh" style={{ marginInlineStart: "auto" }} onClick={() => setOne(null)}>✕ إغلاق</button></div><Pages html={stuHtml(one)} /></div></div>}
  </div>;
}

// بطاقة الطالب في حسابه (بوابة الطالب وولي الأمر)
export function PeriodStudent({ api, me }) {
  const [st, setSt] = useState(null); const [pid, setPid] = useState(""); const cfg = cfgOf(api);
  useEffect(() => { (async () => { const idx = obj(await api.maGet(`${NODE}/idx`)); const L = Object.entries(idx).filter(([, v]) => v.pub !== 0).sort((a, b) => (b[1].at || 0) - (a[1].at || 0)); const got = [];
    for (const [k, v] of L) { const r = me.nh ? await api.maGet(`${NODE}/d/${k}/${me.nh}`) : null; if (r && r.S) got.push({ k, M: v, r: fixRec(r) }); }
    setSt(got); if (got.length) setPid(got[0].k); })(); }, [me && me.nh]);
  const cur = (st || []).find(x => x.k === pid); const [sum, setSum] = useState(null);
  useEffect(() => { if (!cur) return; setSum(null); api.maGet(`${NODE}/sum/${cur.k}`).then(v => setSum(fixSum(v))); }, [pid, !!cur]);
  if (st === null) return <div style={{ textAlign: "center", padding: 30, color: "#94a3b8", fontWeight: 800 }}>⏳ جارٍ تحميل نتائج الفترة…</div>;
  if (!st.length) return <div style={{ textAlign: "center", padding: "30px 16px", background: "#fff", borderRadius: 18, border: "1px solid #e2e8f0" }}><div style={{ fontSize: 42 }}>🎓</div><b style={{ fontSize: 16, color: "#13314a" }}>لم تُنشر نتائج فترة لك بعد</b><div style={{ fontSize: 13, color: "#64748b", fontWeight: 600, marginTop: 6 }}>تظهر هنا بطاقة نتائجك وتحليل مستواك في كل مادة بعد أن ترفعها المدرسة.</div></div>;
  const html = cur && sum ? studentCard(cur.r, sum, cur.M, cfg) : "";
  return <div className="pa grid gap-2"><style>{UI}</style>
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>{st.length > 1 && st.map(x => <button key={x.k} className={`pa-tab ${pid === x.k ? "on" : ""}`} onClick={() => setPid(x.k)}>{x.M.perT || x.M.t}</button>)}
      {html && <button className="pa-b pa-gold" style={{ marginInlineStart: "auto" }} onClick={() => api.print(PRINT(`نتائج ${me.name}`, html))}>🖨 طباعة / حفظ PDF</button>}</div>
    {html ? <Pages html={html} fluid /> : <div style={{ textAlign: "center", padding: 30, color: "#94a3b8" }}>⏳</div>}</div>;
}
