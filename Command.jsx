// ══════════════════════════════════════════════════════════════════════════════
// 🧭 مركز القيادة والإنذار المبكر — للمدير والوكيل والموجه الطلابي
//   يجمع كل بيانات الطالب الموجودة في الموقع دون أي إدخال جديد:
//   الحضور والتأخر (بعذر/بدون عذر)، السلوك والمتابعة اليومية وتصنيف المعلمين، رصد الدرجات
//  ، اختبار القراءة الجهرية، نافس (الاختبارات التدريبية + القبلي + الإجابات الإلكترونية في المراجع)
//   ← مؤشر خطر لكل طالب بأسبابه، خريطة مهارات نافس للفصول، خطط تدخل تُقاس أثرها، ملخص الأحد للمدير
// قاعدة البيانات (جديدة):
//   school-cmd-cfg                    المعايير والأوزان
//   school-cmd-iv/{id}                خطط التدخل { title, sk, skLbl, subj, sids[], owner, start, due, st, pre, preR, post, note, by, at }
//   school-cmd-note/{sid}/{id}        ملاحظات المتابعة على الطالب { t, by, at }
//   school-cmd-snap/{weekKey}         لقطة أسبوعية لمؤشر الخطر { sid: risk } — لمعرفة من دخل الخطر ومن تحسّن
// ══════════════════════════════════════════════════════════════════════════════
import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { BOOKS } from "./nafs/NafsBooks.jsx";
import PRE from "./nafs/pretest.js";
import { rdFixRec, rdTokens } from "./reading/rdEngine.js";

const N = { CFG: "school-cmd-cfg", IV: "school-cmd-iv", NOTE: "school-cmd-note", SNAP: "school-cmd-snap" };
const NAVY = "#0b2545", GOLD = "#c9a227";
const ar = n => String(n ?? "").replace(/\d/g, d => "٠١٢٣٤٥٦٧٨٩"[d]);
const obj = v => (v && typeof v === "object" ? v : {});
const arr = v => Array.isArray(v) ? v.filter(Boolean) : (v && typeof v === "object" ? Object.values(v).filter(Boolean) : []);
const clamp = v => Math.max(0, Math.min(100, v));
const avg = L => { const a = L.filter(x => x != null && isFinite(x)); return a.length ? a.reduce((s, x) => s + x, 0) / a.length : null; };
const rnd = v => v == null ? null : Math.round(v);
const pct = (c, t) => t ? Math.round(c / t * 100) : null;
const esc = t => String(t ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const pad = n => String(n).padStart(2, "0");
const dkey = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const weekStart = (d = new Date()) => { const x = new Date(d); x.setDate(x.getDate() - x.getDay()); return dkey(x); };
const yearStart = () => { const t = new Date(); const y = t.getMonth() >= 7 ? t.getFullYear() : t.getFullYear() - 1; return `${y}-08-01`; };
const dAr = k => { try { const [y, m, d] = String(k).split("-").map(Number); return new Date(y, m - 1, d, 12).toLocaleDateString("ar-SA-u-ca-islamic-umalqura-nu-arab", { day: "numeric", month: "long" }); } catch { return k; } };
const ixKey = sid => String(sid).replace(/[.#$[\]/]/g, "");
const nrm = s => String(s || "").replace(/[ً-ْـ]/g, "").replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي").trim();
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

const DEF = { wA: 25, wB: 15, wG: 25, wR: 15, wN: 20, red: 55, yel: 30, absHi: 6, lateHi: 6, gOk: 80, gLow: 50, rOk: 80, rLow: 45, nOk: 75, nLow: 35, per: "30" };
const LV = { r: { t: "خطر مرتفع — تدخل عاجل", s: "خطر", ic: "🔴", c: "#b91c1c", bg: "#fee2e2" }, y: { t: "يحتاج متابعة", s: "متابعة", ic: "🟡", c: "#b45309", bg: "#fef3c7" }, g: { t: "مستقر", s: "مستقر", ic: "🟢", c: "#15803d", bg: "#dcfce7" } };
const DOM = { A: { t: "الحضور", ic: "🗓️" }, B: { t: "السلوك", ic: "🧭" }, G: { t: "الدرجات", ic: "📝" }, R: { t: "القراءة", ic: "📖" }, N: { t: "نافس", ic: "🎯" } };
const PERS = [["30", "آخر ٣٠ يومًا"], ["60", "آخر ٦٠ يومًا"], ["year", "العام الدراسي"]];
const IV_ST = { plan: ["مخطط", "#64748b"], run: ["قيد التنفيذ", "#2563eb"], done: ["مكتمل", "#15803d"] };
const BOOK_IDS = ["math", "sci", "ar"];
const weekOf = (b, p) => { const B = BOOKS[b]; for (let w = 14; w >= 0; w--) if (p >= B.units[w * 2]) return w; return -1; };
const skLbl = k => { const [b, w] = String(k).split(":"); if (BOOKS[b]) { const i = +String(w).slice(1); return `${BOOKS[b].name}، ${BOOKS[b].titles[i * 2]}`; } return String(k).replace(/^nq:/, ""); };
const riskCol = r => r >= 55 ? "#dc2626" : r >= 30 ? "#d97706" : "#16a34a";
const perfCol = v => v == null ? "#e2e8f0" : v >= 85 ? "#15803d" : v >= 70 ? "#65a30d" : v >= 55 ? "#d97706" : v >= 40 ? "#ea580c" : "#dc2626";

// ───────────────────────── تحميل البيانات وحساب المؤشرات ─────────────────────────
async function loadAll(api, cfg, onStep) {
  const t = dkey(new Date()); const f = cfg.per === "year" ? yearStart() : dkey(new Date(Date.now() - (+cfg.per || 30) * 864e5));
  onStep("الحضور والسلوك"); const D = await api.inLoad(f, t); const IR = api.inCompute(D);
  onStep("الدرجات والقراءة ونافس");
  const [gr, rdT, rdR, nqE, nqR, pre, qr, aa, aaCfg, yr, iv, notes, snaps] = await Promise.all([
    api.maGet("school-grades-stu"), api.maGet("school-rd-txt"), api.maGet("school-rd-res"), api.maGet("school-nq-ex"), api.maGet("school-nq-res"),
    api.maGet("school-nafsbook-pre"), api.maGet("school-nafsbook-qr"), api.maGet("school-absact"), api.maGet("school-absact-cfg"),
    api.absData(yearStart(), t).catch(() => ({ list: [] })), api.maGet(N.IV), api.maGet(N.NOTE), api.maGet(N.SNAP)]);
  return { f, t, D, IR, gr: obj(gr), rdT: arr(rdT), rdR: obj(rdR), nqE: arr(nqE), nqR: obj(nqR), pre: obj(pre), qr: obj(qr), aa: obj(aa), aaCfg: obj(aaCfg), yr: arr(yr && yr.list), iv: arr(iv).sort((a, b) => (b.at || 0) - (a.at || 0)), notes: obj(notes), snaps: obj(snaps) };
}

const AA = [["msg", "📩", "رسائل التنبيه", 3], ["call", "📞", "استدعاء ولي الأمر", 5], ["pledge", "✍️", "التعهد", 10], ["counsel", "🧭", "الإرشاد ودراسة الحالة", 10], ["raise", "🏛️", "الرفع لإدارة التعليم", 15], ["protect", "🛡️", "الحماية الأسرية", 20]];

function compute(X, cfg) {
  const S = {}; const IR = X.IR;
  Object.values(IR.S).forEach(s => { S[s.sid] = { sid: s.sid, name: s.name, ck: s.ck, lv3: String(s.ck).startsWith("3-"), base: s, dom: {}, r: {}, sk: {}, why: [] }; });
  // الدرجات
  Object.entries(X.gr).forEach(([ck, bySid]) => Object.entries(obj(bySid)).forEach(([sid, recs]) => { const s = S[sid] || Object.values(S).find(x => ixKey(x.sid) === sid && x.ck === ck); if (!s) return;
    const L = Object.values(obj(recs)).filter(r => r && r.mx && r.v !== "غ" && isFinite(+r.v)); if (!L.length) return;
    const by = {}; L.forEach(r => { (by[r.s || "عام"] = by[r.s || "عام"] || []).push(+r.v / +r.mx * 100); });
    s.G = { avg: avg(L.map(r => +r.v / +r.mx * 100)), n: L.length, subj: Object.entries(by).map(([k, v]) => [k, avg(v)]).sort((a, b) => a[1] - b[1]) }; }));
  // القراءة
  const rdBody = Object.fromEntries(X.rdT.map(t => [t.id, rdTokens(t.body || "")]));
  Object.entries(X.rdR).forEach(([tid, byK]) => Object.entries(obj(byK)).forEach(([k, rec]) => { const i = k.indexOf("_"); const ck = k.slice(0, i), sk = k.slice(i + 1);
    const s = Object.values(S).find(x => x.ck === ck && ixKey(x.sid) === sk); if (!s || !rec) return; let fx = rec; try { fx = rdBody[tid] ? rdFixRec(rec, rdBody[tid]) : rec; } catch {}
    const tr = arr(fx && fx.tries).filter(x => x.m && !x.rej); if (!tr.length) return; const last = tr[tr.length - 1];
    if (!s.R || (last.at || 0) > (s.R.at || 0)) s.R = { score: +last.m.score || 0, acc: +last.m.acc || 0, wcpm: +last.m.wcpm || 0, lv: last.m.lv, at: last.at || 0, n: tr.length, first: +tr[0].m.score || 0, title: (X.rdT.find(t => t.id === tid) || {}).title || "" }; }));
  // نافس — الاختبارات التدريبية (مع المهارات من كل سؤال)
  const EX = Object.fromEntries(X.nqE.map(e => [e.id, e]));
  Object.entries(X.nqR).forEach(([eid, byK]) => { const ex = EX[eid]; Object.values(obj(byK)).forEach(r => { const s = r && (S[r.sid] || Object.values(S).find(x => x.ck === r.ck && nrm(x.name) === nrm(r.name))); if (!s || !r.res || !r.res.maxTotal) return;
    (s.NQ = s.NQ || []).push({ t: ex ? ex.title : "اختبار", p: Math.round(r.res.total / r.res.maxTotal * 100), at: r.ts || 0 });
    if (ex) arr(ex.subjects).forEach(sub => arr(sub.questions).forEach(q => { const k = "nq:" + (q.skill || sub.name || "عام"); const o = s.sk[k] = s.sk[k] || { c: 0, t: 0, src: sub.name }; o.t++; if (r.ans && r.ans[q.id] !== undefined && +r.ans[q.id] === +q.correct) o.c++; })); }); });
  // نافس — القبلي (سؤال من كل أسبوع)
  BOOK_IDS.forEach(b => Object.entries(obj(X.pre[b])).forEach(([sid, v]) => { const s = S[sid]; if (!s || !v || !v.of) return; (s.PRE = s.PRE || {})[b] = Math.round(v.sc / v.of * 100);
    arr(PRE[b]).forEach((q, j) => { const k = `${b}:w${q.w}`; const o = s.sk[k] = s.sk[k] || { c: 0, t: 0 }; o.t++; if (v.a && +v.a[j] === q.a) o.c++; }); }));
  // نافس — الإجابات الإلكترونية في المراجع
  Object.entries(X.qr).forEach(([sid, byB]) => { const s = S[sid]; if (!s) return; let c = 0, g = 0;
    Object.entries(obj(byB)).forEach(([b, pages]) => { if (!BOOKS[b]) return; Object.entries(obj(pages)).forEach(([p, x]) => { if (!x) return; c += +x.c || 0; g += +x.g || 0; const w = weekOf(b, +p); if (w < 0) return; const o = s.sk[`${b}:w${w}`] = s.sk[`${b}:w${w}`] || { c: 0, t: 0 }; o.c += +x.c || 0; o.t += +x.g || 0; }); });
    if (g) s.QR = { p: Math.round(c / g * 100), c, g }; });
  // الغياب على مستوى العام لإجراءات المعالجة
  const YR = Object.fromEntries(X.yr.map(o => [o.sid, o]));
  const th = k => +(obj(X.aaCfg.th)[k]) || AA.find(a => a[0] === k)[3];
  // المؤشر
  Object.values(S).forEach(s => { const b = s.base; const na = b.abs.length - arr(b.absE).length, ne = arr(b.absE).length, nl = b.late.length;
    s.dom.A = { na, ne, nl, mins: b.lateMins }; s.r.A = clamp(na / cfg.absHi * 100) * .75 + clamp(nl / cfg.lateHi * 100) * .25;
    const bp = (b.bnNeg || 0) * 15 + (b.sd ? b.sd.neg : 0) * 8 + (b.sc ? (b.sc.b === 3 ? 45 : b.sc.b === 2 ? 20 : 0) + (b.sc.a === 3 ? 15 : 0) : 0);
    s.dom.B = { bn: b.bnNeg || 0, sd: b.sd ? b.sd.neg : 0, sc: b.sc, notes: [...arr(b.bn).map(n => n.txt || n.note || n.cat || "").filter(Boolean), ...arr(b.sd && b.sd.notes).map(n => n.txt)].slice(0, 4) }; s.r.B = clamp(bp);
    if (s.G) s.r.G = clamp((cfg.gOk - s.G.avg) / (cfg.gOk - cfg.gLow) * 100);
    if (s.R) s.r.R = clamp((cfg.rOk - s.R.score) / (cfg.rOk - cfg.rLow) * 100);
    const nParts = [avg(arr(s.NQ).map(x => x.p)), avg(Object.values(obj(s.PRE))), s.QR ? s.QR.p : null].filter(x => x != null);
    if (nParts.length) { s.N = { p: avg(nParts), nq: rnd(avg(arr(s.NQ).map(x => x.p))), pre: obj(s.PRE), qr: s.QR }; s.r.N = clamp((cfg.nOk - s.N.p) / (cfg.nOk - cfg.nLow) * 100); }
    const W = { A: cfg.wA, B: cfg.wB, G: cfg.wG, R: cfg.wR, N: cfg.wN }; let sw = 0, sr = 0; Object.entries(s.r).forEach(([k, v]) => { sw += +W[k] || 0; sr += (+W[k] || 0) * v; });
    s.risk = sw ? Math.round(sr / sw) : 0; if (b.lvl === "r") s.risk = Math.max(s.risk, cfg.yel);
    s.lvl = s.risk >= cfg.red ? "r" : s.risk >= cfg.yel ? "y" : "g";
    const why = [];
    if (s.r.A >= 35) why.push(["A", `غياب بدون عذر ${ar(na)} ${na >= 3 && na <= 10 ? "أيام" : "يوم"}${nl ? ` وتأخر ${ar(nl)}` : ""}`, s.r.A]);
    if (s.r.B >= 35) why.push(["B", [s.dom.B.bn && `${ar(s.dom.B.bn)} ملاحظة سلوكية`, s.dom.B.sd && `${ar(s.dom.B.sd)} ملاحظة متابعة`, b.sc && b.sc.b === 3 && "تصنيف السلوك: تدخل عاجل"].filter(Boolean).join("، ") || "ملاحظات سلوكية", s.r.B]);
    if (s.r.G >= 35) why.push(["G", `متوسط الدرجات ${ar(rnd(s.G.avg))}٪${s.G.subj[0] ? ` (الأضعف: ${s.G.subj[0][0]} ${ar(rnd(s.G.subj[0][1]))}٪)` : ""}`, s.r.G]);
    if (s.r.R >= 35) why.push(["R", `القراءة ${ar(s.R.score)}/١٠٠`, s.r.R]);
    if (s.r.N >= 35) why.push(["N", `نافس ${ar(rnd(s.N.p))}٪`, s.r.N]);
    s.why = why.sort((a, b2) => b2[2] - a[2]);
    // إجراءات الغياب
    const u = YR[s.sid] ? YR[s.sid].u : 0; const st = obj(obj(X.aa[s.sid]).steps); s.aa = { u, done: AA.filter(a => obj(st[a[0]]).done).map(a => a[0]), due: AA.find(a => !obj(st[a[0]]).done && u >= th(a[0])) || null };
    // المهارات الأضعف
    { const W = Object.entries(s.sk).map(([k, o]) => ({ k, p: pct(o.c, o.t), t: o.t })).filter(x => x.t >= 1); const A2 = W.filter(x => x.t >= 2).sort((a, b2) => a.p - b2.p || b2.t - a.t); s.weak = A2.length >= 3 ? A2 : [...A2, ...W.filter(x => x.t < 2).sort((a, b2) => a.p - b2.p)]; }
  });
  // اللقطة السابقة
  const wk = weekStart(); const prevK = Object.keys(X.snaps).filter(k => k < wk).sort().pop(); const prev = prevK ? obj(X.snaps[prevK]) : null;
  Object.values(S).forEach(s => { const k = ixKey(s.sid); s.prev = prev && prev[k] != null ? +prev[k] : null; });
  return { S, list: Object.values(S), prevK, wk };
}

function classAgg(list, classes, name) {
  return classes.map(c => { const L = list.filter(s => s.ck === c.ck); if (!L.length) return null; const a = { ck: c.ck, nm: name(c.ck), n: L.length, r: 0, y: 0, g: 0 };
    L.forEach(s => a[s.lvl]++); a.risk = rnd(avg(L.map(s => s.risk))); a.G = rnd(avg(L.map(s => s.G && s.G.avg))); a.R = rnd(avg(L.map(s => s.R && s.R.score))); a.N = rnd(avg(L.map(s => s.N && s.N.p)));
    a.na = L.reduce((x, s) => x + s.dom.A.na, 0); return a; }).filter(Boolean);
}
function skillAgg(list, filt) { const K = {};
  list.forEach(s => Object.entries(s.sk).forEach(([k, o]) => { if (filt && !filt(k)) return; const x = K[k] = K[k] || { k, c: 0, t: 0, n: 0, by: {} }; x.c += o.c; x.t += o.t; x.n++; const y = x.by[s.ck] = x.by[s.ck] || { c: 0, t: 0, n: 0 }; y.c += o.c; y.t += o.t; y.n++; }));
  return K; }

// ───────────────────────── الطباعة ─────────────────────────
const P_CSS = `@page{size:A4;margin:13mm 12mm}*{box-sizing:border-box}body{font-family:'Cairo','Noto Sans Arabic',Tahoma,sans-serif;direction:rtl;color:#0f172a;margin:0;font-size:12.5px}
.hd{display:flex;align-items:center;gap:12px;border-bottom:3px solid ${GOLD};padding-bottom:8px;margin-bottom:10px}.hd img{height:54px}.hd .t{flex:1;text-align:center}.hd .t b{display:block;font-size:19px;color:${NAVY}}.hd small{color:#475569;font-weight:700}
.meta{display:flex;justify-content:space-between;font-size:11px;color:#475569;font-weight:700;margin-bottom:8px}
h2{font-size:14.5px;color:#fff;background:${NAVY};padding:5px 12px;border-radius:7px;margin:12px 0 6px;border-right:6px solid ${GOLD};break-after:avoid}
.k{display:grid;grid-template-columns:repeat(5,1fr);gap:6px}.k div{border:1.5px solid #e2e8f0;border-radius:9px;padding:6px;text-align:center}.k b{display:block;font-size:20px;color:${NAVY}}.k span{font-size:10.5px;font-weight:800;color:#475569}
table{width:100%;border-collapse:collapse;margin-top:4px;break-inside:auto}th{background:#f1f5f9;color:${NAVY};font-size:11px;padding:5px;border:1px solid #cbd5e1}td{border:1px solid #e2e8f0;padding:4px 6px;font-size:11.5px;text-align:center}td.r{text-align:right}tr{break-inside:avoid}
.chip{display:inline-block;border-radius:99px;padding:1px 8px;font-weight:800;font-size:10.5px}
.sg{display:grid;grid-template-columns:1fr 1fr 1fr;gap:18px;margin-top:22px;text-align:center;font-weight:800;break-inside:avoid}.sg div{border-top:1.5px solid #94a3b8;padding-top:6px}
.note{background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:6px 10px;font-size:11.5px;margin-top:6px}`;
const pHead = (api, title, sub) => `<div class="hd"><img src="${api.moeLogo || ""}" alt=""><div class="t"><b>${esc(title)}</b><small>${esc(api.school || "")} — ${esc(api.region || "")}</small>${sub ? `<br><small>${esc(sub)}</small>` : ""}</div><img src="${api.logo || ""}" alt=""></div>`;
const pDoc = (title, body) => `<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>${esc(title)}</title><style>${P_CSS}</style></head><body>${body}<script>setTimeout(()=>print(),600)</script></body></html>`;
const chip = l => `<span class="chip" style="background:${LV[l].bg};color:${LV[l].c}">${LV[l].ic} ${LV[l].s}</span>`;

function briefHtml(api, R, X, name, ivs, skills) {
  const L = R.list; const n = { r: L.filter(s => s.lvl === "r"), y: L.filter(s => s.lvl === "y"), g: L.filter(s => s.lvl === "g") };
  const enter = L.filter(s => s.lvl === "r" && s.prev != null && s.prev < 55).sort((a, b) => b.risk - a.risk);
  const better = L.filter(s => s.prev != null && s.prev - s.risk >= 15).sort((a, b) => (b.prev - b.risk) - (a.prev - a.risk));
  const due = L.filter(s => s.aa.due).sort((a, b) => b.aa.u - a.aa.u);
  const row = s => `<tr><td class="r">${esc(s.name)}</td><td>${esc(name(s.ck))}</td><td><b style="color:${riskCol(s.risk)}">${ar(s.risk)}</b></td><td class="r">${esc(s.why.map(w => w[1]).join("، ") || "—")}</td></tr>`;
  const top = n.r.slice().sort((a, b) => b.risk - a.risk).slice(0, 15);
  const weak = skills.slice(0, 8);
  const ivL = ivs.filter(v => v.st !== "done");
  return pDoc("ملخص الأسبوع — مركز القيادة", `${pHead(api, "ملخص الأحد — مركز القيادة والإنذار المبكر", `أسبوع ${dAr(R.wk)}، فترة البيانات من ${dAr(X.f)} إلى ${dAr(X.t)}`)}
  <div class="k"><div><b style="color:#b91c1c">${ar(n.r.length)}</b><span>🔴 خطر مرتفع</span></div><div><b style="color:#b45309">${ar(n.y.length)}</b><span>🟡 يحتاج متابعة</span></div><div><b style="color:#15803d">${ar(n.g.length)}</b><span>🟢 مستقر</span></div><div><b>${ar(enter.length)}</b><span>دخلوا الخطر هذا الأسبوع</span></div><div><b>${ar(better.length)}</b><span>تحسّنوا بوضوح</span></div></div>
  <h2>🔴 أعلى الطلاب خطرًا (يحتاجون تدخلًا هذا الأسبوع)</h2>${top.length ? `<table><tr><th>الطالب</th><th>الفصل</th><th>المؤشر</th><th>الأسباب</th></tr>${top.map(row).join("")}</table>` : `<div class="note">لا يوجد طلاب في مستوى الخطر المرتفع ✔</div>`}
  ${enter.length ? `<h2>⬆️ دخلوا مستوى الخطر منذ الأسبوع الماضي</h2><table><tr><th>الطالب</th><th>الفصل</th><th>المؤشر</th><th>الأسباب</th></tr>${enter.slice(0, 12).map(row).join("")}</table>` : ""}
  ${better.length ? `<h2>✅ تحسّنوا منذ الأسبوع الماضي</h2><table><tr><th>الطالب</th><th>الفصل</th><th>كان</th><th>أصبح</th></tr>${better.slice(0, 12).map(s => `<tr><td class="r">${esc(s.name)}</td><td>${esc(name(s.ck))}</td><td>${ar(s.prev)}</td><td><b style="color:#15803d">${ar(s.risk)}</b></td></tr>`).join("")}</table>` : ""}
  ${due.length ? `<h2>📂 إجراءات معالجة الغياب المستحقة</h2><table><tr><th>الطالب</th><th>الفصل</th><th>غياب بدون عذر (العام)</th><th>الإجراء المستحق</th></tr>${due.slice(0, 15).map(s => `<tr><td class="r">${esc(s.name)}</td><td>${esc(name(s.ck))}</td><td>${ar(s.aa.u)}</td><td>${s.aa.due[1]} ${esc(s.aa.due[2])}</td></tr>`).join("")}</table>` : ""}
  ${weak.length ? `<h2>🧩 أضعف مهارات نافس في المدرسة</h2><table><tr><th>المهارة</th><th>نسبة الإتقان</th><th>عدد الطلاب</th></tr>${weak.map(k => `<tr><td class="r">${esc(skLbl(k.k))}</td><td><b style="color:${perfCol(k.p)}">${ar(k.p)}٪</b></td><td>${ar(k.n)}</td></tr>`).join("")}</table>` : ""}
  ${ivL.length ? `<h2>🛠️ خطط التدخل الجارية</h2><table><tr><th>الخطة</th><th>المسؤول</th><th>الطلاب</th><th>الموعد</th><th>الحالة</th></tr>${ivL.map(v => `<tr><td class="r">${esc(v.title)}</td><td>${esc(v.owner || "—")}</td><td>${ar(arr(v.sids).length)}</td><td>${v.due ? dAr(v.due) : "—"}</td><td>${IV_ST[v.st || "plan"][0]}</td></tr>`).join("")}</table>` : ""}
  <div class="sg"><div>الموجه الطلابي</div><div>وكيل شؤون الطلاب</div><div>مدير المدرسة</div></div>`);
}

function stuHtml(api, s, name, notes, ivs) {
  const D = s.dom; const b = s.base;
  return pDoc("ملف الطالب — " + s.name, `${pHead(api, "الملف الشامل للطالب — مركز القيادة", `${s.name}، ${name(s.ck)}`)}
  <div class="meta"><span>المؤشر: <b style="color:${riskCol(s.risk)}">${ar(s.risk)}</b> ${chip(s.lvl)}</span><span>تاريخ الطباعة: ${dAr(dkey(new Date()))}</span></div>
  <h2>📊 المجالات</h2><table><tr><th>المجال</th><th>البيان</th><th>درجة الخطر</th></tr>
  <tr><td>🗓️ الحضور</td><td class="r">غياب بدون عذر ${ar(D.A.na)}، بعذر ${ar(D.A.ne)}، تأخر ${ar(D.A.nl)} مرة</td><td>${ar(rnd(s.r.A))}</td></tr>
  <tr><td>🧭 السلوك</td><td class="r">${ar(D.B.bn)} ملاحظة سلوكية، ${ar(D.B.sd)} ملاحظة متابعة${b.sc && b.sc.b ? "، تصنيف المعلمين: " + ["", "جيد", "يحتاج متابعة", "تدخل عاجل"][b.sc.b] : ""}</td><td>${ar(rnd(s.r.B))}</td></tr>
  <tr><td>📝 الدرجات</td><td class="r">${s.G ? `المتوسط ${ar(rnd(s.G.avg))}٪ في ${ar(s.G.n)} اختبار، ${s.G.subj.map(x => `${x[0]} ${ar(rnd(x[1]))}٪`).join("، ")}` : "لا توجد درجات مرصودة"}</td><td>${s.r.G != null ? ar(rnd(s.r.G)) : "—"}</td></tr>
  <tr><td>📖 القراءة</td><td class="r">${s.R ? `آخر نتيجة ${ar(s.R.score)}/١٠٠، الدقة ${ar(s.R.acc)}٪، ${ar(s.R.wcpm)} كلمة/دقيقة` : "لم يُختبر"}</td><td>${s.r.R != null ? ar(rnd(s.r.R)) : "—"}</td></tr>
  <tr><td>🎯 نافس</td><td class="r">${s.N ? [s.N.nq != null && `الاختبارات التدريبية ${ar(s.N.nq)}٪`, Object.keys(s.N.pre).length && "القبلي: " + Object.entries(s.N.pre).map(([k, v]) => `${BOOKS[k].name} ${ar(v)}٪`).join("، "), s.N.qr && `الإجابات الإلكترونية ${ar(s.N.qr.p)}٪`].filter(Boolean).join("، ") : "لا توجد بيانات"}</td><td>${s.r.N != null ? ar(rnd(s.r.N)) : "—"}</td></tr></table>
  ${s.weak.length ? `<h2>🧩 المهارات الأضعف</h2><table><tr><th>المهارة</th><th>الإتقان</th></tr>${s.weak.slice(0, 8).map(w => `<tr><td class="r">${esc(skLbl(w.k))}</td><td><b style="color:${perfCol(w.p)}">${ar(w.p)}٪</b></td></tr>`).join("")}</table>` : ""}
  <h2>📂 إجراءات معالجة الغياب</h2><table><tr>${AA.map(a => `<th>${a[1]} ${a[2]}</th>`).join("")}</tr><tr>${AA.map(a => `<td>${s.aa.done.includes(a[0]) ? "✓ منفّذ" : s.aa.due && s.aa.due[0] === a[0] ? "⚠️ مستحق" : "—"}</td>`).join("")}</tr></table>
  ${ivs.length ? `<h2>🛠️ خطط التدخل</h2><table><tr><th>الخطة</th><th>المسؤول</th><th>الحالة</th></tr>${ivs.map(v => `<tr><td class="r">${esc(v.title)}</td><td>${esc(v.owner || "—")}</td><td>${IV_ST[v.st || "plan"][0]}</td></tr>`).join("")}</table>` : ""}
  ${notes.length ? `<h2>🗒️ ملاحظات المتابعة</h2>${notes.map(n => `<div class="note"><b>${esc(n.by || "")}</b> — ${dAr(dkey(new Date(n.at)))}: ${esc(n.t)}</div>`).join("")}` : ""}
  <div class="sg"><div>الموجه الطلابي</div><div>وكيل شؤون الطلاب</div><div>مدير المدرسة</div></div>`);
}

// ───────────────────────── الواجهة ─────────────────────────
export function Command({ api, me = {} }) {
  const [cfg, setCfg] = useState(null); const [X, setX] = useState(null); const [step, setStep] = useState(""); const [err, setErr] = useState("");
  const [tab, setTab] = useState("ov"); const [stu, setStu] = useState(null); const [ivEd, setIvEd] = useState(null); const [cfgEd, setCfgEd] = useState(null);
  const [fl, setFl] = useState({ ck: "", lv: "", d: "", q: "" }); const [subj, setSubj] = useState("math"); const [skSel, setSkSel] = useState(null);
  const canEdit = me.canEdit !== false;
  const name = ck => api.maClassName ? api.maClassName(ck) : ck;
  const load = async c => { setErr(""); setX(null); try { const d = await loadAll(api, c, setStep); setX(d); } catch (e) { setErr("تعذّر تحميل البيانات: " + (e && e.message || e)); } };
  useEffect(() => { (async () => { const c = { ...DEF, ...obj(await api.maGet(N.CFG)) }; setCfg(c); load(c); })(); }, []);
  const R = useMemo(() => X && cfg ? compute(X, cfg) : null, [X, cfg]);
  // لقطة الأسبوع (مرة كل أسبوع)
  useEffect(() => { if (!R || !canEdit || X.snaps[R.wk]) return; const o = {}; R.list.forEach(s => { o[ixKey(s.sid)] = s.risk; }); api.maPut(`${N.SNAP}/${R.wk}`, o); }, [R]);
  const classes = X ? X.D.classes : [];
  const CA = useMemo(() => R ? classAgg(R.list, classes, name) : [], [R]);
  const SKall = useMemo(() => R ? Object.values(skillAgg(R.list)).filter(k => k.t >= 3).map(k => ({ ...k, p: pct(k.c, k.t) })).sort((a, b) => a.p - b.p) : [], [R]);

  if (err) return <Shell><div className="cm-msg">⚠️ {err}<br /><button className="cm-b on" onClick={() => load(cfg)}>إعادة المحاولة</button></div></Shell>;
  if (!R) return <Shell><div className="cm-load"><div className="cm-spin" /><b>جارٍ تجميع بيانات الطلاب…</b><small>{step}</small></div></Shell>;
  const L = R.list; const cnt = { r: L.filter(s => s.lvl === "r").length, y: L.filter(s => s.lvl === "y").length, g: L.filter(s => s.lvl === "g").length };
  const enter = L.filter(s => s.lvl === "r" && s.prev != null && s.prev < cfg.red); const better = L.filter(s => s.prev != null && s.prev - s.risk >= 15);
  const due = L.filter(s => s.aa.due);
  const has = k => L.some(s => s.r[k] != null);
  const ivOf = sid => X.iv.filter(v => arr(v.sids).includes(sid));
  const saveIv = async v => { const x = { ...v, id: v.id || uid(), at: v.at || Date.now(), up: Date.now(), by: v.by || me.name || "" }; await api.maPut(`${N.IV}/${x.id}`, x); setX(o => ({ ...o, iv: [x, ...o.iv.filter(y => y.id !== x.id)] })); setIvEd(null); };
  const delIv = async v => { if (!window.confirm(`حذف خطة «${v.title}»؟`)) return; await api.maPut(`${N.IV}/${v.id}`, null); setX(o => ({ ...o, iv: o.iv.filter(y => y.id !== v.id) })); setIvEd(null); };
  const addNote = async (sid, t) => { const id = uid(); const n = { t, by: me.name || "", at: Date.now() }; await api.maPut(`${N.NOTE}/${ixKey(sid)}/${id}`, n); setX(o => ({ ...o, notes: { ...o.notes, [ixKey(sid)]: { ...obj(o.notes[ixKey(sid)]), [id]: n } } })); };
  const notesOf = sid => Object.values(obj(X.notes[ixKey(sid)])).filter(Boolean).sort((a, b) => b.at - a.at);
  const newIv = (sk, sids) => setIvEd({ title: sk ? `علاج مهارة: ${skLbl(sk)}` : "", sk: sk || "", sids: sids || [], owner: "", start: dkey(new Date()), due: dkey(new Date(Date.now() + 14 * 864e5)), st: "plan", note: "" });
  const ivImpact = v => { const S2 = arr(v.sids).map(id => R.S[id]).filter(Boolean); if (!S2.length) return null;
    if (v.sk) { const now = avg(S2.map(s => s.sk[v.sk] ? pct(s.sk[v.sk].c, s.sk[v.sk].t) : null)); return { lbl: "إتقان المهارة", pre: v.pre, now: rnd(now), post: v.post != null && v.post !== "" ? +v.post : null, up: true }; }
    return { lbl: "متوسط مؤشر الخطر", pre: v.preR, now: rnd(avg(S2.map(s => s.risk))), up: false }; };

  const filt = L.filter(s => (!fl.ck || s.ck === fl.ck) && (!fl.lv || s.lvl === fl.lv) && (!fl.d || (s.r[fl.d] || 0) >= 35) && (!fl.q || nrm(s.name).includes(nrm(fl.q)))).sort((a, b) => b.risk - a.risk);
  const brief = () => api.print(briefHtml(api, R, X, name, X.iv, SKall));

  return <Shell>
    <div className="cm-hero">
      <div className="cm-hero-t"><span className="cm-badge">جديد</span><h1>🧭 مركز القيادة والإنذار المبكر</h1>
        <p>صورة واحدة لكل طالب من بيانات الموقع: الحضور • السلوك • الدرجات • القراءة • نافس ← إنذار مبكر بأسبابه، وتدخل يُقاس أثره.</p></div>
      <div className="cm-hero-a">
        <select className="cm-sel" value={cfg.per} onChange={e => { const c = { ...cfg, per: e.target.value }; setCfg(c); load(c); }} aria-label="فترة الحضور والسلوك">{PERS.map(([k, l]) => <option key={k} value={k}>الحضور والسلوك: {l}</option>)}</select>
        <button className="cm-b gold" onClick={brief}>🖨️ ملخص الأحد</button>
        {canEdit && <button className="cm-b" onClick={() => setCfgEd({ ...cfg })}>⚙️ المعايير</button>}
        <button className="cm-b" onClick={() => load(cfg)} title="تحديث">🔄</button></div>
      <div className="cm-kpis">
        <button className="cm-kpi r" onClick={() => { setFl({ ...fl, lv: "r", ck: "", d: "" }); setTab("list"); }}><b>{ar(cnt.r)}</b><span>🔴 خطر مرتفع</span></button>
        <button className="cm-kpi y" onClick={() => { setFl({ ...fl, lv: "y", ck: "", d: "" }); setTab("list"); }}><b>{ar(cnt.y)}</b><span>🟡 يحتاج متابعة</span></button>
        <button className="cm-kpi g" onClick={() => { setFl({ ...fl, lv: "g", ck: "", d: "" }); setTab("list"); }}><b>{ar(cnt.g)}</b><span>🟢 مستقر</span></button>
        <div className="cm-kpi"><b>{ar(enter.length)}</b><span>⬆️ دخلوا الخطر هذا الأسبوع</span></div>
        <div className="cm-kpi"><b>{ar(due.length)}</b><span>📂 إجراء غياب مستحق</span></div>
        <div className="cm-kpi"><b>{ar(X.iv.filter(v => v.st !== "done").length)}</b><span>🛠️ خطة تدخل جارية</span></div>
      </div>
      <div className="cm-dist" title="توزيع الطلاب">{["r", "y", "g"].map(k => <i key={k} style={{ flex: cnt[k] || 0.0001, background: LV[k].c }} />)}</div>
    </div>

    <div className="cm-tabs" role="tablist">{[["ov", "🎯 الصورة العامة"], ["list", `🚨 قائمة الإنذار (${ar(cnt.r + cnt.y)})`], ["sk", "🧩 خريطة مهارات نافس"], ["iv", `🛠️ خطط التدخل (${ar(X.iv.length)})`]].map(([k, l]) =>
      <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{l}</button>)}</div>

    {tab === "ov" && <>
      <div className="cm-grid2">
        <div className="cm-card"><h3>🏫 الفصول — من أين يأتي الخطر؟</h3>
          <div className="cm-tw"><table className="cm-tbl"><thead><tr><th className="r">الفصل</th><th>التوزيع</th><th>المؤشر</th>{has("G") && <th>الدرجات</th>}{has("R") && <th>القراءة</th>}{has("N") && <th>نافس</th>}<th>غياب بلا عذر</th></tr></thead>
            <tbody>{CA.map(c => <tr key={c.ck} className="click" onClick={() => { setFl({ ck: c.ck, lv: "", d: "", q: "" }); setTab("list"); }}>
              <td className="r"><b>{c.nm}</b><small> ({ar(c.n)})</small></td>
              <td><div className="cm-mini">{["r", "y", "g"].map(k => <i key={k} style={{ flex: c[k] || 0.0001, background: LV[k].c }} title={`${LV[k].s}: ${c[k]}`} />)}</div><small className="cm-rgy"><b style={{ color: LV.r.c }}>{ar(c.r)}</b><b style={{ color: LV.y.c }}>{ar(c.y)}</b><b style={{ color: LV.g.c }}>{ar(c.g)}</b></small></td>
              <td><b style={{ color: riskCol(c.risk) }}>{ar(c.risk)}</b></td>
              {has("G") && <td><Cell v={c.G} /></td>}{has("R") && <td><Cell v={c.R} /></td>}{has("N") && <td><Cell v={c.N} /></td>}<td>{ar(c.na)}</td></tr>)}</tbody></table></div></div>
        <div className="cm-card"><h3>📅 ماذا تغيّر منذ الأسبوع الماضي؟</h3>
          {R.prevK ? <><div className="cm-ch r"><b>⬆️ دخلوا مستوى الخطر ({ar(enter.length)})</b>{enter.length ? enter.slice(0, 8).map(s => <StuChip key={s.sid} s={s} name={name} onClick={() => setStu(s.sid)} d={`${ar(s.prev)} ← ${ar(s.risk)}`} />) : <small>لا أحد ✔</small>}</div>
            <div className="cm-ch g"><b>✅ تحسّنوا بوضوح ({ar(better.length)})</b>{better.length ? better.slice(0, 8).map(s => <StuChip key={s.sid} s={s} name={name} onClick={() => setStu(s.sid)} d={`${ar(s.prev)} ← ${ar(s.risk)}`} />) : <small>—</small>}</div></>
            : <div className="cm-empty">تُحفظ اليوم لقطة هذا الأسبوع، وابتداءً من الأسبوع القادم يظهر هنا من دخل مستوى الخطر ومن تحسّن.</div>}
          <h3 style={{ marginTop: 14 }}>📂 إجراءات غياب مستحقة ({ar(due.length)})</h3>
          {due.length ? due.sort((a, b) => b.aa.u - a.aa.u).slice(0, 6).map(s => <StuChip key={s.sid} s={s} name={name} onClick={() => setStu(s.sid)} d={`${ar(s.aa.u)} يوم ← ${s.aa.due[1]} ${s.aa.due[2]}`} />) : <small className="cm-muted">لا توجد إجراءات مستحقة ✔</small>}
        </div>
      </div>
      <div className="cm-grid2">
        <div className="cm-card"><h3>🔴 أعلى الطلاب خطرًا</h3>{L.filter(s => s.lvl === "r").sort((a, b) => b.risk - a.risk).slice(0, 8).map(s => <StuRow key={s.sid} s={s} name={name} onClick={() => setStu(s.sid)} />)}
          {!cnt.r && <div className="cm-empty">لا يوجد طلاب في مستوى الخطر المرتفع ✔</div>}
          {cnt.r > 8 && <button className="cm-b" onClick={() => { setFl({ ck: "", lv: "r", d: "", q: "" }); setTab("list"); }}>عرض الجميع ({ar(cnt.r)}) ‹</button>}</div>
        <div className="cm-card"><h3>🧩 أضعف مهارات نافس في المدرسة</h3>{SKall.slice(0, 7).map(k => <div key={k.k} className="cm-skr" onClick={() => { const [b] = k.k.split(":"); if (BOOKS[b]) setSubj(b); setSkSel(k.k); setTab("sk"); }}>
            <span>{skLbl(k.k)}</span><i><b style={{ width: `${k.p}%`, background: perfCol(k.p) }} /></i><em style={{ color: perfCol(k.p) }}>{ar(k.p)}٪</em></div>)}
          {!SKall.length && <div className="cm-empty">لم تُسجّل بعد نتائج القبلي أو الإجابات الإلكترونية أو اختبارات نافس.</div>}</div>
      </div>
      <div className="cm-card cm-legend"><b>كيف يُحسب المؤشر؟</b> لكل مجال درجة خطر من ٠ إلى ١٠٠، والمؤشر متوسطها الموزون بالمجالات المتوفرة للطالب: {Object.entries(DOM).map(([k, d]) => <span key={k}>{d.ic} {d.t} {ar(cfg["w" + k])}٪</span>)}، ٥٥ فأكثر = خطر مرتفع، ٣٠–٥٤ = متابعة. المؤشر يقترح ولا يحكم؛ القرار للموجه والمعلم.</div>
    </>}

    {tab === "list" && <div className="cm-card">
      <div className="cm-flt">
        <input className="cm-in" placeholder="🔎 ابحث باسم الطالب…" value={fl.q} onChange={e => setFl({ ...fl, q: e.target.value })} />
        <select className="cm-sel" value={fl.ck} onChange={e => setFl({ ...fl, ck: e.target.value })}><option value="">كل الفصول</option>{classes.map(c => <option key={c.ck} value={c.ck}>{name(c.ck)}</option>)}</select>
        <select className="cm-sel" value={fl.lv} onChange={e => setFl({ ...fl, lv: e.target.value })}><option value="">كل المستويات</option>{["r", "y", "g"].map(k => <option key={k} value={k}>{LV[k].ic} {LV[k].t}</option>)}</select>
        <select className="cm-sel" value={fl.d} onChange={e => setFl({ ...fl, d: e.target.value })}><option value="">كل المجالات</option>{Object.entries(DOM).map(([k, d]) => <option key={k} value={k}>خطر في {d.t}</option>)}</select>
        <span className="cm-muted">{ar(filt.length)} طالب</span></div>
      <div className="cm-tw"><table className="cm-tbl"><thead><tr><th className="r">الطالب</th><th>المؤشر</th>{Object.entries(DOM).map(([k, d]) => <th key={k} title={d.t}>{d.ic}</th>)}<th className="r">الأسباب</th><th>الغياب</th><th>تدخل</th></tr></thead>
        <tbody>{filt.slice(0, 300).map(s => <tr key={s.sid} className="click" onClick={() => setStu(s.sid)}>
          <td className="r"><b>{s.name}</b><br /><small className="cm-muted">{name(s.ck)}</small></td>
          <td><Gauge v={s.risk} prev={s.prev} /></td>
          {Object.keys(DOM).map(k => <td key={k}><Dot v={s.r[k]} /></td>)}
          <td className="r cm-why">{s.why.length ? s.why.slice(0, 3).map(w => <span key={w[0]}>{DOM[w[0]].ic} {w[1]}</span>) : <small className="cm-muted">—</small>}</td>
          <td>{s.aa.due ? <span className="cm-pill" style={{ background: "#fee2e2", color: "#b91c1c" }} title={s.aa.due[2]}>{s.aa.due[1]} مستحق</span> : s.aa.done.length ? <span className="cm-pill">{ar(s.aa.done.length)} ✓</span> : "—"}</td>
          <td>{ivOf(s.sid).length ? <span className="cm-pill" style={{ background: "#dbeafe", color: "#1d4ed8" }}>{ar(ivOf(s.sid).length)}</span> : "—"}</td></tr>)}</tbody></table></div>
      {!filt.length && <div className="cm-empty">لا يوجد طلاب بهذه الشروط.</div>}
    </div>}

    {tab === "sk" && <SkillMap R={R} classes={classes} name={name} subj={subj} setSubj={setSubj} sel={skSel} setSel={setSkSel} onStu={setStu} onIv={canEdit ? newIv : null} />}

    {tab === "iv" && <div className="cm-card">
      <div className="cm-flt"><h3 style={{ margin: 0, flex: 1 }}>🛠️ خطط التدخل وقياس الأثر</h3>{canEdit && <button className="cm-b gold" onClick={() => newIv("", [])}>➕ خطة تدخل جديدة</button>}</div>
      <p className="cm-muted" style={{ margin: "4px 0 10px" }}>اختر مهارة ضعيفة من «خريطة المهارات» أو طلابًا من «قائمة الإنذار» ليُنشأ التدخل بهم. يقيس المركز الأثر تلقائيًا بمقارنة إتقان المهارة (أو مؤشر الخطر) عند البدء بالوضع الآن.</p>
      <div className="cm-ivs">{X.iv.map(v => { const im = ivImpact(v); const st = IV_ST[v.st || "plan"]; const dlt = im && im.pre != null && im.now != null ? (im.up ? im.now - im.pre : im.pre - im.now) : null;
        return <div key={v.id} className="cm-iv" onClick={() => canEdit && setIvEd(v)}>
          <div className="cm-iv-h"><b>{v.title}</b><span className="cm-pill" style={{ background: st[1], color: "#fff" }}>{st[0]}</span></div>
          <small className="cm-muted">👤 {v.owner || "—"}، 👥 {ar(arr(v.sids).length)} طالب، 📅 {v.due ? dAr(v.due) : "—"}</small>
          {im && <div className="cm-imp"><span>{im.lbl}</span><b>{im.pre != null ? ar(im.pre) : "—"}</b><i>←</i><b>{im.now != null ? ar(im.now) : "—"}</b>{dlt != null && <em style={{ color: dlt > 0 ? "#15803d" : dlt < 0 ? "#b91c1c" : "#64748b" }}>{dlt > 0 ? "▲ تحسّن " : dlt < 0 ? "▼ تراجع " : "بلا تغيّر "}{ar(Math.abs(dlt))}</em>}</div>}
          {v.note && <p className="cm-ivn">{v.note}</p>}</div>; })}
        {!X.iv.length && <div className="cm-empty">لا توجد خطط تدخل بعد.</div>}</div>
    </div>}

    {stu && R.S[stu] && <StuFile s={R.S[stu]} name={name} notes={notesOf(stu)} ivs={ivOf(stu)} canEdit={canEdit} onClose={() => setStu(null)} onNote={t => addNote(stu, t)}
      onIv={() => { setStu(null); newIv(R.S[stu].weak[0] ? R.S[stu].weak[0].k : "", [stu]); }} onPrint={() => api.print(stuHtml(api, R.S[stu], name, notesOf(stu), ivOf(stu)))} onAbs={api.go ? () => api.go(api.absHash || "absaction") : null} />}
    {ivEd && <IvEdit v={ivEd} R={R} name={name} classes={classes} onSave={v => { const S2 = arr(v.sids).map(id => R.S[id]).filter(Boolean); const pre = v.id ? v.pre : (v.sk ? rnd(avg(S2.map(s => s.sk[v.sk] ? pct(s.sk[v.sk].c, s.sk[v.sk].t) : null))) : null); saveIv({ ...v, pre, preR: v.id ? v.preR : rnd(avg(S2.map(s => s.risk))) }); }} onDel={ivEd.id ? () => delIv(ivEd) : null} onClose={() => setIvEd(null)} />}
    {cfgEd && <CfgEdit c={cfgEd} setC={setCfgEd} onClose={() => setCfgEd(null)} onSave={async c => { const v = Object.fromEntries(Object.entries(c).map(([k, x]) => [k, k === "per" ? x : +x || 0])); await api.maPut(N.CFG, v); setCfg(v); setCfgEd(null); }} />}
  </Shell>;
}

const Portal = ({ children }) => createPortal(<div className="cm-pt" dir="rtl">{children}</div>, document.body);
const Shell = ({ children }) => <div className="cm" dir="rtl"><style>{CSS}</style>{children}</div>;
const Cell = ({ v }) => v == null ? <span className="cm-muted">—</span> : <span className="cm-cell" style={{ background: perfCol(v) }}>{ar(v)}</span>;
const Dot = ({ v }) => v == null ? <span className="cm-muted" title="لا توجد بيانات">·</span> : <i className="cm-dot" style={{ background: riskCol(v), opacity: .35 + v / 160 }} title={ar(Math.round(v))} />;
const Gauge = ({ v, prev }) => <div className="cm-g"><b style={{ color: riskCol(v) }}>{ar(v)}</b><i><em style={{ width: `${v}%`, background: riskCol(v) }} /></i>{prev != null && prev !== v && <small style={{ color: v > prev ? "#b91c1c" : "#15803d" }}>{v > prev ? "▲" : "▼"}{ar(Math.abs(v - prev))}</small>}</div>;
const StuChip = ({ s, name, onClick, d }) => <button className="cm-sc" onClick={onClick}><b>{s.name}</b><small>{name(s.ck)}</small><em>{d}</em></button>;
const StuRow = ({ s, name, onClick }) => <button className="cm-sr" onClick={onClick}><Gauge v={s.risk} prev={s.prev} /><div><b>{s.name}</b><small>{name(s.ck)}، {s.why.slice(0, 2).map(w => w[1]).join("، ") || "—"}</small></div></button>;

function SkillMap({ R, classes, name, subj, setSubj, sel, setSel, onStu, onIv }) {
  const L = R.list.filter(s => Object.keys(s.sk).length); const cls3 = classes.filter(c => L.some(s => s.ck === c.ck));
  const K = skillAgg(R.list, k => k.startsWith(subj + ":"));
  const B = BOOKS[subj]; const rows = Array.from({ length: 15 }, (_, w) => ({ k: `${subj}:w${w}`, w, x: K[`${subj}:w${w}`] }));
  const NQ = Object.values(skillAgg(R.list, k => k.startsWith("nq:"))).filter(k => k.t >= 3).map(k => ({ ...k, p: pct(k.c, k.t) })).sort((a, b) => a.p - b.p);
  const weakStu = sel ? R.list.filter(s => s.sk[sel] && s.sk[sel].t && pct(s.sk[sel].c, s.sk[sel].t) < 60).sort((a, b) => pct(a.sk[sel].c, a.sk[sel].t) - pct(b.sk[sel].c, b.sk[sel].t)) : [];
  return <>
    <div className="cm-card">
      <div className="cm-flt"><h3 style={{ margin: 0, flex: 1 }}>🧩 إتقان مهارات المراجع لكل فصل</h3>{["math", "sci", "ar"].map(b => <button key={b} className={"cm-b" + (subj === b ? " on" : "")} style={{ "--bc": BOOKS[b].c }} onClick={() => { setSubj(b); setSel(null); }}>{BOOKS[b].name}</button>)}</div>
      <p className="cm-muted" style={{ margin: "4px 0 8px" }}>من الاختبار القبلي والإجابات الإلكترونية في مراجع نافس. اضغط مهارة لترى الطلاب الذين لم يتقنوها وتنشئ لهم خطة تدخل.</p>
      {!cls3.length ? <div className="cm-empty">لا توجد نتائج بعد لهذه المادة.</div> :
        <div className="cm-tw"><table className="cm-tbl cm-heat"><thead><tr><th className="r">الأسبوع والمهارة</th>{cls3.map(c => <th key={c.ck}>{name(c.ck).replace(" متوسط", "")}</th>)}<th>المدرسة</th></tr></thead>
          <tbody>{rows.map(r => <tr key={r.k} className={"click" + (sel === r.k ? " sel" : "")} onClick={() => setSel(sel === r.k ? null : r.k)}>
            <td className="r"><b>{ar(r.w + 1)}.</b> {B.titles[r.w * 2]}<small className="cm-muted"> / {B.titles[r.w * 2 + 1]}</small></td>
            {cls3.map(c => { const y = r.x && r.x.by[c.ck]; const p = y && y.t ? pct(y.c, y.t) : null; return <td key={c.ck}><span className="cm-hc" style={{ background: p == null ? "#f1f5f9" : perfCol(p), color: p == null ? "#94a3b8" : "#fff" }}>{p == null ? "—" : ar(p)}</span></td>; })}
            <td><b style={{ color: r.x ? perfCol(pct(r.x.c, r.x.t)) : "#94a3b8" }}>{r.x ? ar(pct(r.x.c, r.x.t)) + "٪" : "—"}</b></td></tr>)}</tbody></table></div>}
    </div>
    {sel && <div className="cm-card cm-selp"><div className="cm-flt"><h3 style={{ margin: 0, flex: 1 }}>👥 لم يتقنوا: {skLbl(sel)} ({ar(weakStu.length)})</h3>{onIv && weakStu.length > 0 && <button className="cm-b gold" onClick={() => onIv(sel, weakStu.map(s => s.sid))}>➕ خطة تدخل لهؤلاء الطلاب</button>}</div>
      <div className="cm-scs">{weakStu.map(s => <StuChip key={s.sid} s={s} name={name} onClick={() => onStu(s.sid)} d={`${ar(pct(s.sk[sel].c, s.sk[sel].t))}٪`} />)}{!weakStu.length && <small className="cm-muted">كل من أجاب أتقن هذه المهارة ✔</small>}</div></div>}
    <div className="cm-card"><h3>🎯 مهارات اختبارات نافس التدريبية</h3>
      {NQ.length ? NQ.map(k => <div key={k.k} className={"cm-skr" + (sel === k.k ? " on" : "")} onClick={() => setSel(sel === k.k ? null : k.k)}><span>{skLbl(k.k)}</span><i><b style={{ width: `${k.p}%`, background: perfCol(k.p) }} /></i><em style={{ color: perfCol(k.p) }}>{ar(k.p)}٪</em><small className="cm-muted">{ar(k.n)} طالب</small></div>)
        : <div className="cm-empty">لا توجد نتائج لاختبارات نافس التدريبية بعد.</div>}</div>
  </>;
}

function StuFile({ s, name, notes, ivs, canEdit, onClose, onNote, onIv, onPrint, onAbs }) {
  const [t, setT] = useState(""); const b = s.base; const D = s.dom; const lv = LV[s.lvl];
  useEffect(() => { const k = e => { if (e.key === "Escape") onClose(); }; window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, []);
  const card = (k, body) => <div className="cm-dc" style={{ "--rc": s.r[k] == null ? "#cbd5e1" : riskCol(s.r[k]) }}><div className="cm-dc-h"><b>{DOM[k].ic} {DOM[k].t}</b><span>{s.r[k] == null ? "لا بيانات" : `خطر ${ar(Math.round(s.r[k]))}`}</span></div>{body}</div>;
  return <Portal><div className="cm-ov" onClick={onClose}><div className="cm-drw" onClick={e => e.stopPropagation()} role="dialog" aria-label={"ملف " + s.name}>
    <div className="cm-drw-h" style={{ "--lc": lv.c }}>
      <div className="cm-ring" style={{ "--v": s.risk, "--lc": riskCol(s.risk) }}><b>{ar(s.risk)}</b><small>المؤشر</small></div>
      <div style={{ flex: 1, minWidth: 0 }}><h2>{s.name}</h2><small>{name(s.ck)}</small><div><span className="cm-pill" style={{ background: lv.bg, color: lv.c }}>{lv.ic} {lv.t}</span>{s.prev != null && <span className="cm-pill">الأسبوع الماضي: {ar(s.prev)}</span>}</div></div>
      <button className="cm-x" onClick={onClose} aria-label="إغلاق">✕</button></div>
    <div className="cm-drw-b">
      {s.why.length > 0 && <div className="cm-whyb"><b>لماذا؟</b>{s.why.map(w => <span key={w[0]}>{DOM[w[0]].ic} {w[1]}</span>)}</div>}
      <div className="cm-dcs">
        {card("A", <ul><li>غياب بدون عذر: <b>{ar(D.A.na)}</b>، بعذر: {ar(D.A.ne)}</li><li>تأخر صباحي: <b>{ar(D.A.nl)}</b>{D.A.mins ? ` (${ar(D.A.mins)} دقيقة)` : ""}</li><li>غياب العام بلا عذر: <b>{ar(s.aa.u)}</b></li></ul>)}
        {card("B", <ul><li>ملاحظات سلوكية: <b>{ar(D.B.bn)}</b>، متابعة يومية: {ar(D.B.sd)}</li>{b.sc && <li>تصنيف المعلمين — السلوك: {["—", "جيد", "يحتاج متابعة", "تدخل عاجل"][b.sc.b || 0]}، المستوى: {["—", "جيد", "يحتاج متابعة", "متابعة عاجلة"][b.sc.a || 0]}</li>}{D.B.notes.slice(0, 2).map((n, i) => <li key={i} className="cm-muted">«{String(n).slice(0, 90)}»</li>)}</ul>)}
        {card("G", s.G ? <ul><li>المتوسط: <b>{ar(rnd(s.G.avg))}٪</b> في {ar(s.G.n)} اختبار</li>{s.G.subj.slice(0, 4).map(x => <li key={x[0]}>{x[0]}: <b style={{ color: perfCol(x[1]) }}>{ar(rnd(x[1]))}٪</b></li>)}</ul> : <small className="cm-muted">لا توجد درجات مرصودة</small>)}
        {card("R", s.R ? <ul><li>آخر نتيجة: <b>{ar(s.R.score)}/١٠٠</b>{s.R.n > 1 ? ` (الأولى ${ar(s.R.first)})` : ""}</li><li>الدقة {ar(s.R.acc)}٪، {ar(s.R.wcpm)} كلمة/دقيقة</li>{s.R.title && <li className="cm-muted">{s.R.title}</li>}</ul> : <small className="cm-muted">لم يُختبر في القراءة</small>)}
        {card("N", s.N ? <ul>{s.N.nq != null && <li>الاختبارات التدريبية: <b>{ar(s.N.nq)}٪</b></li>}{Object.entries(s.N.pre).map(([k, v]) => <li key={k}>القبلي — {BOOKS[k].name}: <b>{ar(v)}٪</b></li>)}{s.N.qr && <li>الإجابات الإلكترونية: <b>{ar(s.N.qr.p)}٪</b> ({ar(s.N.qr.c)}/{ar(s.N.qr.g)})</li>}</ul> : <small className="cm-muted">{s.lv3 ? "لا توجد بيانات نافس" : "نافس لطلاب الثالث المتوسط"}</small>)}
      </div>
      {s.weak.length > 0 && <div className="cm-sec"><h4>🧩 المهارات الأضعف</h4>{s.weak.slice(0, 6).map(w => <div key={w.k} className="cm-skr"><span>{skLbl(w.k)}</span><i><b style={{ width: `${w.p}%`, background: perfCol(w.p) }} /></i><em style={{ color: perfCol(w.p) }}>{ar(w.p)}٪</em></div>)}</div>}
      <div className="cm-sec"><h4>📂 إجراءات معالجة الغياب</h4><div className="cm-lad">{AA.map(a => { const dn = s.aa.done.includes(a[0]), du = s.aa.due && s.aa.due[0] === a[0]; return <span key={a[0]} className={dn ? "dn" : du ? "du" : ""} title={a[2]}>{a[1]}<small>{a[2]}</small><em>{dn ? "✓" : du ? "مستحق" : ""}</em></span>; })}</div>
        {onAbs && <button className="cm-b" onClick={onAbs}>📂 فتح ملف إجراءات الغياب</button>}</div>
      {ivs.length > 0 && <div className="cm-sec"><h4>🛠️ خطط التدخل</h4>{ivs.map(v => <div key={v.id} className="cm-ivmini"><b>{v.title}</b><span className="cm-pill" style={{ background: IV_ST[v.st || "plan"][1], color: "#fff" }}>{IV_ST[v.st || "plan"][0]}</span><small className="cm-muted">{v.owner}</small></div>)}</div>}
      <div className="cm-sec"><h4>🗒️ ملاحظات المتابعة</h4>
        {canEdit && <div className="cm-flt"><textarea className="cm-in" rows={2} value={t} onChange={e => setT(e.target.value)} placeholder="ملاحظة أو إجراء تم مع الطالب (يراها المدير والوكيل والموجه)…" /><button className="cm-b on" disabled={!t.trim()} onClick={() => { onNote(t.trim()); setT(""); }}>حفظ</button></div>}
        {notes.map((n, i) => <div key={i} className="cm-note"><b>{n.by}</b> <small className="cm-muted">{dAr(dkey(new Date(n.at)))}</small><p>{n.t}</p></div>)}{!notes.length && <small className="cm-muted">لا توجد ملاحظات.</small>}</div>
    </div>
    <div className="cm-drw-f">{canEdit && <button className="cm-b gold" onClick={onIv}>🛠️ خطة تدخل لهذا الطالب</button>}<button className="cm-b" onClick={onPrint}>🖨️ طباعة الملف الشامل</button></div>
  </div></div></Portal>;
}

function IvEdit({ v: v0, R, name, classes, onSave, onDel, onClose }) {
  const [v, setV] = useState({ ...v0, sids: arr(v0.sids) }); const [ck, setCk] = useState(""); const [q, setQ] = useState("");
  const skOpts = useMemo(() => { const K = skillAgg(R.list); return Object.keys(K).sort(); }, [R]);
  const pool = R.list.filter(s => (!ck || s.ck === ck) && (!q || nrm(s.name).includes(nrm(q)))).sort((a, b) => b.risk - a.risk).slice(0, 80);
  const tog = sid => setV(o => ({ ...o, sids: o.sids.includes(sid) ? o.sids.filter(x => x !== sid) : [...o.sids, sid] }));
  return <Portal><div className="cm-ov" onClick={onClose}><div className="cm-mod" onClick={e => e.stopPropagation()}>
    <div className="cm-mod-h"><b>🛠️ {v.id ? "تعديل خطة التدخل" : "خطة تدخل جديدة"}</b><button className="cm-x" onClick={onClose}>✕</button></div>
    <div className="cm-mod-b">
      <label>عنوان الخطة<input className="cm-in" value={v.title} onChange={e => setV({ ...v, title: e.target.value })} placeholder="مثال: مجموعة علاجية — مقارنة الأعداد السالبة" /></label>
      <div className="cm-row"><label>المهارة المستهدفة (لقياس الأثر)<select className="cm-sel" value={v.sk} onChange={e => setV({ ...v, sk: e.target.value })}><option value="">— بلا مهارة (يُقاس بمؤشر الخطر) —</option>{skOpts.map(k => <option key={k} value={k}>{skLbl(k)}</option>)}</select></label>
        <label>المسؤول عن التنفيذ<input className="cm-in" value={v.owner} onChange={e => setV({ ...v, owner: e.target.value })} placeholder="اسم المعلم أو الموجه" /></label></div>
      <div className="cm-row"><label>تاريخ البدء<input type="date" className="cm-in" value={v.start || ""} onChange={e => setV({ ...v, start: e.target.value })} /></label><label>موعد إعادة القياس<input type="date" className="cm-in" value={v.due || ""} onChange={e => setV({ ...v, due: e.target.value })} /></label>
        <label>الحالة<select className="cm-sel" value={v.st || "plan"} onChange={e => setV({ ...v, st: e.target.value })}>{Object.entries(IV_ST).map(([k, x]) => <option key={k} value={k}>{x[0]}</option>)}</select></label></div>
      <label>الإجراءات (ماذا سيُعمل؟)<textarea className="cm-in" rows={3} value={v.note || ""} onChange={e => setV({ ...v, note: e.target.value })} placeholder="مثال: ٣ حصص علاجية أسبوعيًا بعد الحصة السابعة + تدريب على صفحات المرجع ٢٠–٢٥ + إعادة اختبار" /></label>
      {v.id && v.sk && <label>نتيجة إعادة القياس اليدوية (اختياري، ٪)<input className="cm-in" inputMode="numeric" value={v.post ?? ""} onChange={e => setV({ ...v, post: e.target.value })} /></label>}
      <div className="cm-pick"><div className="cm-flt"><b style={{ flex: 1 }}>👥 الطلاب ({ar(v.sids.length)})</b><select className="cm-sel" value={ck} onChange={e => setCk(e.target.value)}><option value="">كل الفصول</option>{classes.map(c => <option key={c.ck} value={c.ck}>{name(c.ck)}</option>)}</select><input className="cm-in" style={{ maxWidth: 170 }} placeholder="بحث…" value={q} onChange={e => setQ(e.target.value)} /></div>
        <div className="cm-chosen">{v.sids.map(id => R.S[id] && <button key={id} className="cm-pill on" onClick={() => tog(id)}>{R.S[id].name} ✕</button>)}</div>
        <div className="cm-pool">{pool.map(s => <label key={s.sid} className={v.sids.includes(s.sid) ? "on" : ""}><input type="checkbox" checked={v.sids.includes(s.sid)} onChange={() => tog(s.sid)} /><span>{s.name}</span><small>{name(s.ck)}</small><b style={{ color: riskCol(s.risk) }}>{ar(s.risk)}</b></label>)}</div></div>
    </div>
    <div className="cm-mod-f">{onDel && <button className="cm-b" style={{ color: "#b91c1c" }} onClick={onDel}>🗑️ حذف</button>}<span style={{ flex: 1 }} /><button className="cm-b" onClick={onClose}>إلغاء</button><button className="cm-b gold" disabled={!v.title.trim() || !v.sids.length} onClick={() => onSave(v)}>حفظ الخطة</button></div>
  </div></div></Portal>;
}

function CfgEdit({ c, setC, onSave, onClose }) {
  const F = (k, l, h) => <label>{l}<input className="cm-in" inputMode="numeric" value={c[k]} onChange={e => setC({ ...c, [k]: e.target.value })} />{h && <small className="cm-muted">{h}</small>}</label>;
  const sw = ["wA", "wB", "wG", "wR", "wN"].reduce((s, k) => s + (+c[k] || 0), 0);
  return <Portal><div className="cm-ov" onClick={onClose}><div className="cm-mod" onClick={e => e.stopPropagation()}>
    <div className="cm-mod-h"><b>⚙️ معايير المؤشر</b><button className="cm-x" onClick={onClose}>✕</button></div>
    <div className="cm-mod-b">
      <h4>أوزان المجالات (المجموع {ar(sw)})</h4><div className="cm-row">{F("wA", "🗓️ الحضور")}{F("wB", "🧭 السلوك")}{F("wG", "📝 الدرجات")}{F("wR", "📖 القراءة")}{F("wN", "🎯 نافس")}</div>
      <h4>حدود المستويات</h4><div className="cm-row">{F("red", "🔴 خطر مرتفع من")}{F("yel", "🟡 متابعة من")}</div>
      <h4>حدود كل مجال</h4>
      <div className="cm-row">{F("absHi", "أيام الغياب بلا عذر = خطر كامل", "خلال الفترة المختارة")}{F("lateHi", "مرات التأخر = خطر كامل")}</div>
      <div className="cm-row">{F("gOk", "الدرجات: آمن من (٪)")}{F("gLow", "الدرجات: خطر كامل عند (٪)")}</div>
      <div className="cm-row">{F("rOk", "القراءة: آمن من")}{F("rLow", "القراءة: خطر كامل عند")}</div>
      <div className="cm-row">{F("nOk", "نافس: آمن من (٪)")}{F("nLow", "نافس: خطر كامل عند (٪)")}</div>
    </div>
    <div className="cm-mod-f"><button className="cm-b" onClick={() => setC({ ...DEF, per: c.per })}>استعادة الافتراضي</button><span style={{ flex: 1 }} /><button className="cm-b" onClick={onClose}>إلغاء</button><button className="cm-b gold" onClick={() => onSave(c)}>حفظ</button></div>
  </div></div></Portal>;
}

const CSS = `
.cm{font-family:'Cairo','Noto Sans Arabic',Tahoma,sans-serif;color:#0f172a;display:grid;gap:14px;max-width:1280px;margin:0 auto}
.cm *{box-sizing:border-box}
.cm-hero{position:relative;overflow:hidden;border-radius:24px;padding:22px 22px 16px;color:#fff;background:radial-gradient(circle at 12% 0%,rgba(201,162,39,.35),transparent 42%),linear-gradient(135deg,#0b2545 0%,#13315c 55%,#1d3f73 100%);box-shadow:0 18px 40px rgba(11,37,69,.28);display:grid;gap:14px}
.cm-hero::after{content:"";position:absolute;inset:auto -60px -80px auto;width:260px;height:260px;border-radius:50%;border:40px solid rgba(201,162,39,.12)}
.cm-hero-t h1{margin:4px 0 4px;font-size:clamp(22px,3vw,32px);font-weight:900;letter-spacing:-.3px}
.cm-hero-t p{margin:0;opacity:.88;font-weight:700;font-size:14px;max-width:760px;line-height:1.8}
.cm-badge{display:inline-block;background:${GOLD};color:${NAVY};font-weight:900;font-size:12px;border-radius:99px;padding:2px 12px}
.cm-hero-a{display:flex;gap:8px;flex-wrap:wrap;position:relative;z-index:1}
.cm-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;position:relative;z-index:1}
.cm-kpi{border:0;border-radius:16px;padding:10px 12px;background:rgba(255,255,255,.09);border:1px solid rgba(255,255,255,.16);color:#fff;text-align:right;font:inherit;display:grid;gap:2px;cursor:default}
button.cm-kpi{cursor:pointer;transition:transform .12s}button.cm-kpi:hover{transform:translateY(-2px)}
.cm-kpi b{font-size:28px;line-height:1.1;font-weight:900}.cm-kpi span{font-size:12.5px;font-weight:800;opacity:.9}
.cm-kpi.r{background:linear-gradient(135deg,#b91c1c,#7f1d1d)}.cm-kpi.y{background:linear-gradient(135deg,#d97706,#92400e)}.cm-kpi.g{background:linear-gradient(135deg,#15803d,#14532d)}
.cm-dist{display:flex;height:9px;border-radius:9px;overflow:hidden;background:rgba(255,255,255,.15);position:relative;z-index:1}.cm-dist i{display:block}
.cm-b{border:1.5px solid #cbd5e1;background:#fff;color:${NAVY};border-radius:12px;padding:8px 14px;font:inherit;font-weight:800;font-size:13.5px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;white-space:nowrap}
.cm-b:hover{border-color:${NAVY}}.cm-b:disabled{opacity:.5;cursor:default}
.cm-b.on{background:var(--bc,${NAVY});border-color:var(--bc,${NAVY});color:#fff}
.cm-b.gold{background:linear-gradient(135deg,#e2bc3c,${GOLD});border-color:${GOLD};color:${NAVY};box-shadow:0 4px 12px rgba(201,162,39,.35)}
.cm-hero .cm-b:not(.gold){background:rgba(255,255,255,.1);border-color:rgba(255,255,255,.3);color:#fff}
.cm-sel,.cm-in{border:1.5px solid #cbd5e1;border-radius:12px;padding:8px 11px;font:inherit;font-weight:700;font-size:13.5px;background:#fff;color:#0f172a;min-width:0}
.cm-hero .cm-sel{background:rgba(255,255,255,.12);border-color:rgba(255,255,255,.3);color:#fff}.cm-hero .cm-sel option{color:#0f172a}
.cm-in{width:100%}textarea.cm-in{resize:vertical}
.cm-tabs{display:flex;gap:6px;flex-wrap:wrap;background:#fff;border-radius:16px;padding:6px;box-shadow:0 2px 10px rgba(15,23,42,.06);position:sticky;top:0;z-index:5}
.cm-tabs button{flex:1 1 auto;border:0;background:none;border-radius:12px;padding:10px 14px;font:inherit;font-weight:900;font-size:14px;color:#475569;cursor:pointer}
.cm-tabs button.on{background:${NAVY};color:#fff;box-shadow:inset 0 -3px 0 ${GOLD}}
.cm-card{background:#fff;border-radius:18px;padding:16px;box-shadow:0 2px 14px rgba(15,23,42,.07);border:1px solid #eef2f6;min-width:0}
.cm-card h3{margin:0 0 10px;font-size:16px;color:${NAVY};font-weight:900}
.cm-grid2{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,460px),1fr));gap:14px}
.cm-tw{overflow-x:auto}
.cm-tbl{width:100%;border-collapse:separate;border-spacing:0;font-size:13.5px}
.cm-tbl th{background:#f8fafc;color:${NAVY};font-weight:900;padding:9px 8px;border-bottom:2px solid ${GOLD};white-space:nowrap;text-align:center}
.cm-tbl td{padding:8px;border-bottom:1px solid #eef2f6;text-align:center;vertical-align:middle}
.cm-tbl .r{text-align:right}.cm-tbl tr.click{cursor:pointer}.cm-tbl tr.click:hover td{background:#f8fbff}.cm-tbl tr.sel td{background:#fffbeb}
.cm-rgy{display:flex;gap:10px;justify-content:center;font-size:12px}.cm-mini{display:flex;height:8px;border-radius:8px;overflow:hidden;min-width:90px;background:#f1f5f9;margin-bottom:2px}.cm-mini i{display:block}
.cm-cell{display:inline-block;min-width:40px;border-radius:8px;padding:2px 6px;color:#fff;font-weight:900}
.cm-hc{display:inline-block;min-width:42px;border-radius:8px;padding:5px 4px;font-weight:900;font-size:13px}
.cm-heat td{padding:4px}
.cm-muted{color:#64748b;font-weight:700}
.cm-g{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:6px;min-width:110px}.cm-g b{font-size:16px;font-weight:900}.cm-g i{height:7px;border-radius:7px;background:#f1f5f9;overflow:hidden}.cm-g em{display:block;height:100%;border-radius:7px}.cm-g small{font-weight:900;font-size:11px}
.cm-dot{display:inline-block;width:14px;height:14px;border-radius:50%}
.cm-why{font-size:12.5px;max-width:340px}.cm-why span{display:block;line-height:1.7}
.cm-pill{display:inline-flex;align-items:center;gap:4px;border-radius:99px;padding:2px 10px;font-weight:800;font-size:12px;background:#f1f5f9;color:#334155;border:0;font-family:inherit;margin:2px}
button.cm-pill{cursor:pointer}.cm-pill.on{background:${NAVY};color:#fff}
.cm-flt{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:8px}.cm-flt .cm-in{flex:1 1 200px;width:auto}
.cm-ch{border-radius:14px;padding:10px;margin-bottom:8px;display:flex;flex-wrap:wrap;gap:6px;align-items:center}.cm-ch>b{width:100%;font-size:13.5px}.cm-ch.r{background:#fef2f2}.cm-ch.g{background:#f0fdf4}
.cm-sc{border:1px solid #e2e8f0;background:#fff;border-radius:12px;padding:5px 10px;font:inherit;cursor:pointer;display:grid;text-align:right;gap:0}
.cm-sc b{font-size:13px}.cm-sc small{font-size:11px;color:#64748b;font-weight:700}.cm-sc em{font-style:normal;font-size:11.5px;font-weight:900;color:${NAVY}}
.cm-sc:hover{border-color:${NAVY}}
.cm-scs{display:flex;flex-wrap:wrap;gap:6px}
.cm-sr{display:flex;gap:12px;align-items:center;width:100%;border:0;border-bottom:1px solid #f1f5f9;background:none;padding:8px 4px;font:inherit;text-align:right;cursor:pointer}
.cm-sr:hover{background:#f8fbff}.cm-sr .cm-g{width:130px;flex:none}.cm-sr div{display:grid;min-width:0}.cm-sr b{font-size:14px}.cm-sr small{color:#64748b;font-weight:700;font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cm-skr{display:grid;grid-template-columns:minmax(0,1fr) 120px 48px auto;align-items:center;gap:8px;padding:6px 4px;border-bottom:1px dashed #eef2f6;cursor:pointer;font-weight:800;font-size:13px}
.cm-skr:hover,.cm-skr.on{background:#fffbeb}.cm-skr i{height:9px;border-radius:9px;background:#f1f5f9;overflow:hidden}.cm-skr i b{display:block;height:100%;border-radius:9px}.cm-skr em{font-style:normal;font-weight:900;text-align:left}
.cm-empty{padding:16px;text-align:center;color:#64748b;font-weight:800;background:#f8fafc;border-radius:12px}
.cm-legend{font-size:13px;font-weight:700;color:#334155;display:flex;flex-wrap:wrap;gap:6px 12px;align-items:center;background:#fffdf5;border-color:#fde68a}
.cm-ivs{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:10px}
.cm-iv{border:1.5px solid #e2e8f0;border-radius:16px;padding:12px;display:grid;gap:6px;cursor:pointer;background:linear-gradient(180deg,#fff,#fbfcfe)}.cm-iv:hover{border-color:${GOLD}}
.cm-iv-h{display:flex;gap:8px;align-items:flex-start}.cm-iv-h b{flex:1;font-size:14.5px;color:${NAVY}}
.cm-imp{display:flex;align-items:center;gap:6px;background:#f8fafc;border-radius:10px;padding:6px 10px;font-weight:800;font-size:13px;flex-wrap:wrap}.cm-imp span{color:#475569;flex-basis:100%;font-size:12px}.cm-imp b{font-size:18px;color:${NAVY}}.cm-imp em{font-style:normal;font-weight:900;margin-inline-start:auto}
.cm-ivn{margin:0;font-size:12.5px;color:#475569;font-weight:700;white-space:pre-wrap}
.cm-pt,.cm-pt *{box-sizing:border-box}.cm-pt{font-family:'Cairo','Noto Sans Arabic',Tahoma,sans-serif;color:#0f172a}.cm-ov{position:fixed;inset:0;background:rgba(15,23,42,.45);z-index:3000;display:flex;justify-content:flex-start;animation:cmF .15s}
@keyframes cmF{from{opacity:0}to{opacity:1}}
.cm-drw{width:min(560px,100%);height:100%;background:#f8fafc;display:flex;flex-direction:column;box-shadow:-10px 0 40px rgba(0,0,0,.25);animation:cmS .22s ease-out}
@keyframes cmS{from{transform:translateX(-40px);opacity:.4}to{transform:none;opacity:1}}
.cm-drw-h{display:flex;gap:14px;align-items:center;padding:16px;background:linear-gradient(135deg,${NAVY},#1d3f73);color:#fff;border-bottom:4px solid ${GOLD}}
.cm-drw-h h2{margin:0;font-size:19px;font-weight:900}.cm-drw-h small{opacity:.85;font-weight:700}
.cm-ring{--v:0;width:78px;height:78px;border-radius:50%;flex:none;display:grid;place-content:center;text-align:center;background:radial-gradient(closest-side,#0f2c52 79%,transparent 80% 100%),conic-gradient(var(--lc) calc(var(--v)*1%),rgba(255,255,255,.18) 0)}
.cm-ring b{font-size:24px;font-weight:900;line-height:1}.cm-ring small{font-size:10px;opacity:.8}
.cm-x{border:0;background:rgba(255,255,255,.14);color:inherit;width:36px;height:36px;border-radius:50%;font-size:16px;cursor:pointer;flex:none}
.cm-mod .cm-x{background:#f1f5f9;color:#334155}
.cm-drw-b{flex:1;overflow:auto;padding:14px;display:grid;gap:12px;align-content:start}
.cm-drw-f{display:flex;gap:8px;padding:12px 14px;border-top:1px solid #e2e8f0;background:#fff;flex-wrap:wrap}
.cm-whyb{background:#fff7ed;border:1px solid #fed7aa;border-radius:14px;padding:10px 12px;display:grid;gap:3px;font-weight:800;font-size:13.5px;color:#7c2d12}
.cm-dcs{display:grid;grid-template-columns:1fr 1fr;gap:10px}
@media(max-width:520px){.cm-dcs{grid-template-columns:1fr}}
.cm-dc{background:#fff;border-radius:14px;padding:10px 12px;border:1px solid #e2e8f0;border-top:4px solid var(--rc)}
.cm-dc-h{display:flex;justify-content:space-between;align-items:center;margin-bottom:4px}.cm-dc-h b{color:${NAVY};font-size:14px}.cm-dc-h span{font-size:11.5px;font-weight:900;color:var(--rc)}
.cm-dc ul{margin:0;padding:0 16px 0 0;font-size:13px;font-weight:700;line-height:1.85}
.cm-sec{background:#fff;border-radius:14px;padding:10px 12px;border:1px solid #e2e8f0;display:grid;gap:6px}.cm-sec h4{margin:0;color:${NAVY};font-size:14.5px}
.cm-lad{display:grid;grid-template-columns:repeat(6,1fr);gap:5px}.cm-lad span{border:1.5px solid #e2e8f0;border-radius:10px;padding:5px 3px;text-align:center;font-size:17px;display:grid;gap:1px;background:#f8fafc}
.cm-lad small{font-size:9.5px;font-weight:800;color:#475569;line-height:1.3}.cm-lad em{font-style:normal;font-size:10.5px;font-weight:900;min-height:14px}
.cm-lad .dn{background:#dcfce7;border-color:#86efac}.cm-lad .dn em{color:#15803d}.cm-lad .du{background:#fee2e2;border-color:#fca5a5}.cm-lad .du em{color:#b91c1c}
.cm-note{border-right:3px solid ${GOLD};background:#fffdf5;border-radius:8px;padding:6px 10px}.cm-note p{margin:2px 0 0;font-size:13px;font-weight:700;white-space:pre-wrap}
.cm-ivmini{display:flex;gap:6px;align-items:center;flex-wrap:wrap}.cm-ivmini b{font-size:13px}
.cm-mod{margin:auto;width:min(760px,96vw);max-height:92vh;background:#fff;border-radius:20px;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.3);border-top:5px solid ${GOLD}}
.cm-mod-h{display:flex;align-items:center;padding:14px 16px;border-bottom:1px solid #eef2f6}.cm-mod-h b{flex:1;font-size:17px;color:${NAVY}}
.cm-mod-b{padding:14px 16px;overflow:auto;display:grid;gap:10px}.cm-mod-b label{display:grid;gap:4px;font-weight:800;font-size:13px;color:#334155}.cm-mod-b h4{margin:6px 0 0;color:${NAVY}}
.cm-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px}
.cm-mod-f{display:flex;gap:8px;padding:12px 16px;border-top:1px solid #eef2f6}
.cm-pick{border:1.5px solid #e2e8f0;border-radius:14px;padding:10px}
.cm-chosen{display:flex;flex-wrap:wrap;gap:4px;margin-bottom:6px}
.cm-pool{max-height:240px;overflow:auto;display:grid;gap:3px}
.cm-pool label{display:grid!important;grid-template-columns:auto 1fr auto auto;gap:8px;align-items:center;padding:5px 8px;border-radius:9px;cursor:pointer;font-weight:700!important}
.cm-pool label.on{background:#eff6ff}.cm-pool small{color:#64748b}
.cm-load{min-height:50vh;display:grid;place-content:center;justify-items:center;gap:8px;color:${NAVY}}.cm-load small{color:#64748b;font-weight:800}
.cm-spin{width:46px;height:46px;border-radius:50%;border:5px solid #e2e8f0;border-top-color:${GOLD};animation:cmR 1s linear infinite}@keyframes cmR{to{transform:rotate(360deg)}}
.cm-msg{padding:30px;text-align:center;font-weight:800;color:#b91c1c;display:grid;gap:10px;justify-items:center}
.cm-selp{border:2px solid ${GOLD}}
@media(max-width:640px){.cm-hero{padding:16px;border-radius:18px}.cm-kpi b{font-size:22px}.cm-tabs button{font-size:12.5px;padding:8px}.cm-skr{grid-template-columns:minmax(0,1fr) 70px 40px}.cm-skr small{display:none}.cm-lad{grid-template-columns:repeat(3,1fr)}}
`;
export default Command;
