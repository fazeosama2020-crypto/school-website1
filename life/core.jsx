// ══════════════════════════════════════════════════════════
// 🌿 الحياة المدرسية — أدوات مشتركة لصفحات: المبادرات • اللقاءات الطلابية • زيارات الطلاب
// تُحمَّل عند فتح إحدى الصفحات فقط (لا تدخل في حزمة الموقع الرئيسية)
// ══════════════════════════════════════════════════════════
import React, { useState, useEffect, useMemo, useRef } from "react";
export { React, useState, useEffect, useMemo, useRef };

export const obj = v => (v && typeof v === "object" ? v : {});
export const arr = v => (Array.isArray(v) ? v.filter(x => x != null) : v && typeof v === "object" ? Object.values(v).filter(x => x != null) : []);
export const ar = n => String(n ?? "").replace(/\d/g, d => "٠١٢٣٤٥٦٧٨٩"[d]);
export const uid = p => (p || "x") + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
export const esc = t => String(t ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
export const nrm = s => String(s ?? "").replace(/[إأآا]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه").replace(/\s+/g, " ").trim();
export const dkey = d => { const x = new Date(d); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`; };
export const yearStart = () => { const t = new Date(); const y = t.getMonth() >= 7 ? t.getFullYear() : t.getFullYear() - 1; return `${y}-08-01`; };
export const hDate = (d, o = { day: "numeric", month: "long", year: "numeric" }) => { try { return new Date(d).toLocaleDateString("ar-SA-u-ca-islamic-umalqura-nu-arab", o); } catch { return String(d || ""); } };
export const gDay = d => { try { return new Date(d).toLocaleDateString("ar-SA-u-nu-arab", { weekday: "long" }); } catch { return ""; } };
export const when = t => { if (!t) return "—"; const d = (Date.now() - t) / 864e5; return d < 1 ? "اليوم" : d < 2 ? "أمس" : d < 30 ? `قبل ${ar(Math.floor(d))} يوم` : hDate(t, { day: "numeric", month: "short" }); };
export const initials = n => { const w = String(n || "").replace(/^(أ\.|د\.|م\.)\s*/, "").split(/\s+/).filter(Boolean); return (w[0] || "؟").slice(0, 1) + (w.length > 1 ? " " + w[w.length - 1].slice(0, 1) : ""); };
const COLS = ["#1e3a8a", "#0f766e", "#7c3aed", "#b45309", "#be123c", "#0369a1", "#4d7c0f", "#a21caf", "#c2410c", "#334155"];
export const colOf = s => { let h = 0; for (const c of String(s || "")) h = (h * 31 + c.charCodeAt(0)) >>> 0; return COLS[h % COLS.length]; };
export const Av = ({ n, s = 34, c }) => <span className="lf-av" style={{ width: s, height: s, fontSize: s * .36, background: c || colOf(n) }}>{initials(n)}</span>;

// ── ضغط الصور قبل الحفظ (حتى لا تثقل قاعدة البيانات ولا الصفحة)
export function shrinkImg(file, max = 1280, q = .72) {
  return new Promise((res, rej) => { const fr = new FileReader(); fr.onerror = rej; fr.onload = () => { const im = new Image(); im.onerror = rej; im.onload = () => {
    const k = Math.min(1, max / Math.max(im.width, im.height)); const c = document.createElement("canvas"); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
    const g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height); g.drawImage(im, 0, 0, c.width, c.height); res(c.toDataURL("image/jpeg", q)); }; im.src = fr.result; }; fr.readAsDataURL(file); });
}

// ── منسوبو المدرسة: المدير والوكلاء والموجهون ورائد النشاط والإداريون (سجل الإداريين) + المعلمون (الجدول وسجل الرخص) + معلمو كل فصل
export async function loadPeople(api) {
  const [st, lic, T] = await Promise.all([api.maGet(api.PT_STAFF).catch(() => null), api.maGet(api.LIC_NODE).catch(() => null), api.ttGet().catch(() => null)]);
  const P = { principal: [], deputy: [], counselor: [], activity: [], admin: [], teachers: [], byCk: {}, all: [] }; const seen = new Set();
  const add = (grp, x) => { const k = nrm(x.name); if (!k) return; if (grp !== "teachers" && seen.has(grp + k)) return; seen.add(grp + k); P[grp].push(x); };
  Object.values(obj(st)).forEach(s => { if (!s || !s.name) return; const job = String(s.job || ""); const x = { key: "s:" + (s.id || nrm(s.name)), name: s.name, role: s.role || "", job, hash: s.idHash || "" };
    if (/نشاط/.test(job)) add("activity", { ...x, grp: "activity" });
    else if (s.role === "principal" || /^مدير/.test(job)) add("principal", { ...x, grp: "principal" });
    else if (s.role === "deputy" || /وكيل/.test(job)) add("deputy", { ...x, grp: "deputy" });
    else if (s.role === "counselor" || /موجه|مرشد/.test(job)) add("counselor", { ...x, grp: "counselor" });
    else add("admin", { ...x, grp: "admin" }); });
  if (!P.principal.length && api.SP && api.SP.principal) P.principal.push({ key: "s:principal", name: api.SP.principal, role: "principal", job: "مدير المدرسة", grp: "principal" });
  const tMap = {};
  if (T && Array.isArray(T.T)) {
    T.T.forEach((name, ti) => { if (name) tMap[nrm(name)] = { key: "t:" + nrm(name), name, subj: new Set(), cks: new Set(), ti, grp: "teachers" }; });
    Object.entries(obj(T.C)).forEach(([ck, days]) => arr(days).forEach(day => arr(day).forEach(c => { if (!Array.isArray(c)) return; const ti = +c[1], si = +c[0]; const nm = T.T[ti]; if (!nm || si < 0) return; const t = tMap[nrm(nm)]; if (!t) return; const sb = (T.S || [])[si] || ""; if (sb) t.subj.add(sb); t.cks.add(ck);
      const L = P.byCk[ck] = P.byCk[ck] || {}; const k = nrm(nm); L[k] = L[k] || { key: t.key, name: nm, subj: new Set() }; if (sb) L[k].subj.add(sb); })));
  }
  Object.values(obj(lic)).forEach(l => { if (!l || !l.name) return; const k = nrm(l.name); if (!tMap[k]) { const hit = Object.keys(tMap).find(x => x.split(" ")[0] === k.split(" ")[0] && x.split(" ").pop() === k.split(" ").pop()); if (hit) { tMap[hit].hash = l.idHash; tMap[hit].spec = l.spec; return; } tMap[k] = { key: "t:" + k, name: l.name, subj: new Set(l.spec ? [l.spec] : []), cks: new Set(), grp: "teachers", hash: l.idHash }; } else { tMap[k].hash = l.idHash; tMap[k].spec = l.spec; } });
  P.teachers = Object.values(tMap).map(t => ({ ...t, subj: [...t.subj], cks: [...t.cks] })).sort((a, b) => a.name.localeCompare(b.name, "ar"));
  Object.keys(P.byCk).forEach(ck => { P.byCk[ck] = Object.values(P.byCk[ck]).map(x => ({ ...x, subj: [...x.subj] })); });
  P.all = [...P.principal, ...P.deputy, ...P.counselor, ...P.activity, ...P.admin, ...P.teachers];
  P.T = T; return P;
}
export const GRP = { principal: ["👑", "المدير", "#1e3a8a"], deputy: ["🧭", "الوكلاء", "#0f766e"], counselor: ["💬", "الموجهون الطلابيون", "#7c3aed"], activity: ["🎨", "رائد النشاط", "#c2410c"], admin: ["🗂️", "الإداريون", "#475569"], teachers: ["📘", "المعلمون", "#0369a1"] };

// ── الطلاب
export async function loadStudents(api) {
  const [ros, meta] = await Promise.all([api.maGet(api.MA_ROSTER), api.maGet(api.MA_META).catch(() => null)]);
  const counts = meta && Array.isArray(meta.counts) ? meta.counts.map(n => +n || 0) : [6, 4, 4];
  const classes = api.maClasses(counts).map(c => ({ ...c, name: api.maClassName(c.ck) }));
  const S = []; Object.entries(obj(ros)).forEach(([ck, c]) => arr(obj(c).students).forEach(s => { if (s && s.id && s.name) S.push({ id: s.id, name: s.name, ck, nh: s.nh || "" }); }));
  const byCk = {}; S.forEach(s => (byCk[s.ck] = byCk[s.ck] || []).push(s));
  return { S, byCk, classes: classes.filter(c => (byCk[c.ck] || []).length || true) };
}

// ── مؤشرات الطالب: الغياب والتأخر والسلوك ونافس (لاقتراح الطلاب)
export async function loadSignals(api, f) {
  const t = dkey(new Date());
  const D = await api.inLoad(f, t); const IR = api.inCompute(D);
  const [seen, qr, nqr] = await Promise.all([api.maGet("school-nafsbook-seen").catch(() => null), api.maGet("school-nafsbook-qr").catch(() => null), api.maGet("school-nq-res").catch(() => null)]);
  const NQ = {}; Object.values(obj(nqr)).forEach(recs => Object.values(obj(recs)).forEach(r => { if (!r || !r.sid || !r.res) return; const o = NQ[r.sid] = NQ[r.sid] || { s: 0, m: 0, n: 0 }; o.s += +r.res.total || 0; o.m += +r.res.maxTotal || 0; o.n++; }));
  const out = {};
  Object.values(IR.S).forEach(s => {
    const na = s.abs.length - arr(s.absE).length, ne = arr(s.absE).length, nl = s.late.length;
    const q = obj(obj(qr)[s.sid]); let c = 0, g = 0, pg = 0; Object.values(q).forEach(b => Object.values(obj(b)).forEach(x => { if (x) { c += +x.c || 0; g += +x.g || 0; pg++; } }));
    const nq = NQ[s.sid]; const sn = obj(obj(seen)[s.sid]);
    const nafsV = [g >= 5 ? Math.round(c / g * 100) : null, nq && nq.m ? Math.round(nq.s / nq.m * 100) : null].filter(v => v != null);
    out[s.sid] = { na, ne, nl, mins: s.lateMins, pos: s.sd.pos, neg: s.sd.neg, bnNeg: s.bnNeg || 0, bnPos: arr(s.bn).length - (s.bnNeg || 0),
      lv3: String(s.ck).startsWith("3-"), nEnt: !!(sn.at || pg || (nq && nq.n)), nPg: pg, nN: nq ? nq.n : 0, nafs: nafsV.length ? Math.round(nafsV.reduce((a, x) => a + x, 0) / nafsV.length) : null, flags: [] };
  });
  return { S: out, days: D, f, t };
}

// ── الذكاء الاصطناعي (عبر /api/ai — يتطلب الدخول برقم السجل)
export function aiHash(api) { if (api && api.hash) return api.hash; try { const s = JSON.parse(localStorage.getItem("pam-staff") || "null"); if (s && s.hash) return s.hash; } catch {} return ""; }
export async function aiJSON(api, prompt, schema, tag, max = 3000) {
  const hash = aiHash(api); if (!hash) throw new Error("nohash");
  const r = await fetch("/api/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ hash, prompt, schema, tag, max, kind: "ini" }) });
  const ct = r.headers.get("content-type") || ""; if (ct.includes("json") || !r.ok) { let j = {}; try { j = await r.json(); } catch {} throw new Error(j.msg || "خدمة الذكاء الاصطناعي غير متاحة الآن"); }
  const rd = r.body.getReader(), dc = new TextDecoder(); let out = ""; for (;;) { const { done, value } = await rd.read(); if (done) break; out += dc.decode(value, { stream: true }); }
  const a = out.indexOf("{"), b = out.lastIndexOf("}"); if (a < 0 || b < a) throw new Error("تعذّر قراءة الرد");
  try { return JSON.parse(out.slice(a, b + 1)); } catch { throw new Error("تعذّر قراءة الرد"); }
}

// ── نافذة الطباعة
export function printDoc(title, body, extraCss = "") {
  const w = window.open("", "_blank"); if (!w) { alert("اسمح بالنوافذ المنبثقة للطباعة"); return; }
  w.document.write(`<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>${esc(title)}</title><link href="https://fonts.googleapis.com/css2?family=Cairo:wght@500;700;800;900&display=swap" rel="stylesheet"><style>
@page{size:A4;margin:10mm}*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}body{font-family:Cairo,Tahoma,sans-serif;color:#0f172a;margin:0;font-size:12.5px;line-height:1.75}
.hdr{display:flex;align-items:center;gap:12px;border-bottom:3px solid #b8860b;padding-bottom:8px;margin-bottom:10px}.hdr .r{font-size:11px;font-weight:800;line-height:1.6;color:#334155;width:190px}.hdr .c{flex:1;text-align:center}.hdr img{height:66px}
h1{margin:0;color:#0b2545;font-size:22px;font-weight:900}h2{color:#0b2545;font-size:15px;margin:12px 0 6px;border-right:5px solid #b8860b;padding-right:8px}
table{width:100%;border-collapse:collapse;margin:4px 0}th{background:#0b2545;color:#fff;padding:5px;font-size:11.5px}td{border:1px solid #cbd5e1;padding:5px 7px;vertical-align:top}td.k{background:#f8fafc;font-weight:800;width:150px;color:#0b2545}
.sg{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:26px;text-align:center;font-weight:800;break-inside:avoid}.sg div{border-top:1.5px solid #94a3b8;padding-top:6px}
.chip{display:inline-block;border:1px solid #cbd5e1;border-radius:99px;padding:0 9px;margin:2px;font-size:11.5px;font-weight:700}.pb{page-break-before:always}.av{break-inside:avoid}
${extraCss}</style></head><body>${body}<script>window.onload=function(){var im=[].slice.call(document.images),n=0;function go(){setTimeout(function(){print()},400)}if(!im.length)return go();im.forEach(function(i){if(i.complete){if(++n===im.length)go()}else i.onload=i.onerror=function(){if(++n===im.length)go()}})}<\/script></body></html>`);
  w.document.close();
}
export const printHead = (api, title, sub = "") => `<div class="hdr"><div class="r">المملكة العربية السعودية<br>وزارة التعليم<br>${esc(obj(api.SP).region || "")}<br>${esc(obj(api.SP).name || "")}</div><div class="c"><h1>${title}</h1>${sub ? `<div style="font-weight:800;color:#b8860b">${sub}</div>` : ""}</div>${api.logo ? `<img src="${api.logo}">` : `<div style="width:66px"></div>`}</div>`;

// ══════════════════════════════════════════════════════════
// 🎨 مولّد الشعارات: ٤ قوالب احترافية × لوحة ألوان × رمز (أيقونة SVG من الذكاء الاصطناعي أو رمز تعبيري مختار حسب فكرة المبادرة)
// ══════════════════════════════════════════════════════════
const KW = [[/قراء|كتاب|مكتب|قصة|لغ|حرف/, "📚", ["#7c2d12", "#ea580c", "#fde68a"]], [/نافس|اختبار|تحصيل|تفوق|تميز|إتقان|اتقان/, "🎯", ["#1e3a8a", "#2563eb", "#fbbf24"]], [/رياض|حساب|أرقام|ارقام/, "🧮", ["#1e40af", "#0ea5e9", "#facc15"]],
  [/علوم|تجرب|مختبر|ابتكار|اختراع|روبوت/, "🔬", ["#065f46", "#10b981", "#a7f3d0"]], [/تقني|رقم|حاسب|برمج|ذكاء/, "💻", ["#312e81", "#6366f1", "#22d3ee"]], [/بيئ|زراع|شجر|أخضر|اخضر|نظاف/, "🌱", ["#14532d", "#22c55e", "#bef264"]],
  [/صح|غذاء|رياضة|لياق|حركة/, "🏃", ["#9a3412", "#f97316", "#fde047"]], [/قيم|أخلاق|اخلاق|احترام|تعاون|تطوع|عطاء|خير/, "🤝", ["#0f766e", "#14b8a6", "#fcd34d"]], [/وطن|سعود|رؤية|٢٠٣٠|2030|هوية|انتماء/, "🌴", ["#14532d", "#16a34a", "#d4af37"]],
  [/قرآن|قران|صلاة|مسجد|إيمان|ايمان|حفظ/, "🕌", ["#064e3b", "#059669", "#d4af37"]], [/انضباط|حضور|غياب|تأخر|التزام|وقت|بكور/, "⏰", ["#0b2545", "#1d4ed8", "#d4af37"]], [/سلام|أمن|امن|مرور|وقاي/, "🛡️", ["#7f1d1d", "#dc2626", "#fca5a5"]],
  [/فن|رسم|إبداع|ابداع|موهب|مسرح/, "🎨", ["#701a75", "#c026d3", "#fbcfe8"]], [/أسر|اسر|ولي|أم|أب|مجتمع|شراك/, "🏡", ["#78350f", "#d97706", "#fde68a"]], [/قياد|رائد|طموح|نجاح|مستقبل|صناع/, "🚀", ["#1e1b4b", "#7c3aed", "#f0abfc"]],
  [/حوار|تواصل|إعلام|اعلام|إذاع|اذاع|كلمة/, "🎙️", ["#0c4a6e", "#0284c7", "#7dd3fc"]], [/مال|ادخار|اقتصاد/, "💰", ["#14532d", "#15803d", "#fde047"]], [/نفس|سعاد|ابتسام|فرح|طمأن/, "😊", ["#9d174d", "#ec4899", "#fde68a"]]];
const PAL = [["#0b2545", "#1d4ed8", "#d4af37"], ["#064e3b", "#10b981", "#fcd34d"], ["#4c1d95", "#8b5cf6", "#fbcfe8"], ["#7c2d12", "#f97316", "#fde68a"], ["#0c4a6e", "#0ea5e9", "#bae6fd"], ["#831843", "#db2777", "#fbcfe8"]];
export function logoIdea(name) { const n = String(name || ""); const hit = KW.find(([re]) => re.test(n)); let h = 0; for (const c of n) h = (h * 33 + c.charCodeAt(0)) >>> 0; return { emoji: hit ? hit[1] : ["✨", "🌟", "💡", "🏆", "🌿", "🔆"][h % 6], pal: hit ? hit[2] : PAL[h % PAL.length], seed: h }; }
// تنظيف أيقونة SVG الواردة من الذكاء الاصطناعي (لا سكربت ولا روابط خارجية)
const OK_TAG = new Set(["g", "path", "circle", "rect", "ellipse", "polygon", "polyline", "line"]); const OK_AT = new Set(["d", "cx", "cy", "r", "x", "y", "width", "height", "rx", "ry", "points", "x1", "y1", "x2", "y2", "fill", "stroke", "stroke-width", "stroke-linecap", "stroke-linejoin", "opacity", "fill-opacity", "stroke-opacity", "transform", "fill-rule"]);
export function cleanIcon(svg) {
  try { const doc = new DOMParser().parseFromString(`<svg xmlns="http://www.w3.org/2000/svg">${String(svg || "").replace(/<\?xml[^>]*>|<!DOCTYPE[^>]*>/gi, "").replace(/<\/?svg[^>]*>/gi, "")}</svg>`, "image/svg+xml"); if (doc.querySelector("parsererror")) return "";
    const walk = el => [...el.children].map(c => { const t = c.tagName.toLowerCase(); if (!OK_TAG.has(t)) return ""; const at = [...c.attributes].filter(a => OK_AT.has(a.name) && !/url\(|javascript|expression/i.test(a.value)).map(a => `${a.name}="${esc(a.value)}"`).join(" "); return `<${t} ${at}>${walk(c)}</${t}>`; }).join("");
    const out = walk(doc.documentElement); return out.length > 40 ? out.slice(0, 12000) : ""; } catch { return ""; }
}
// الرمز داخل الشعار: أيقونة SVG (مربع ١٠٠×١٠٠) أو رمز تعبيري
const sym = (L, cx, cy, sz) => L.icon ? `<g transform="translate(${cx - sz / 2},${cy - sz / 2}) scale(${sz / 100})">${L.icon}</g>` : `<text x="${cx}" y="${cy}" font-size="${sz * .82}" text-anchor="middle" dominant-baseline="central" font-family="Apple Color Emoji,Segoe UI Emoji,Noto Color Emoji,sans-serif">${L.emoji || "✨"}</text>`;
const FONT = `font-family="Cairo,Tajawal,Tahoma,sans-serif"`;
const fitT = (t, base, maxLen) => { const n = String(t || "").length; return n > maxLen ? Math.max(base * .55, base * maxLen / n) : base; };
export const LOGO_STYLES = [["seal", "ختم دائري"], ["shield", "درع"], ["modern", "حديث"], ["hex", "سداسي"]];
export function logoSVG(L) {
  const [a, b, c] = L.pal || PAL[0]; const nm = esc(L.name || "المبادرة"), sl = esc(L.slogan || ""), id = "g" + (L.seed || 1) % 9973, sch = esc(L.school || "");
  const defs = `<defs><linearGradient id="${id}a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${b}"/><stop offset="1" stop-color="${a}"/></linearGradient><radialGradient id="${id}b" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset="1" stop-color="${c}" stop-opacity=".55"/></radialGradient><path id="${id}t" d="M 70,200 A 130,130 0 0 1 330,200"/><path id="${id}u" d="M 62,200 A 138,138 0 0 0 338,200"/></defs>`;
  if (L.style === "shield") return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">${defs}<path d="M200 22 L344 70 V190 C344 285 278 345 200 378 C122 345 56 285 56 190 V70 Z" fill="url(#${id}a)"/><path d="M200 44 L324 85 V190 C324 272 268 324 200 354 C132 324 76 272 76 190 V85 Z" fill="none" stroke="${c}" stroke-width="5"/>
<circle cx="200" cy="168" r="78" fill="url(#${id}b)"/>${sym(L, 200, 168, 100)}<path d="M40 268 H360 L338 296 L360 324 H40 L62 296 Z" fill="${c}"/><path d="M40 268 L62 296 L40 324 Z M360 268 L338 296 L360 324 Z" fill="${a}" opacity=".35"/><text x="200" y="303" text-anchor="middle" ${FONT} font-weight="900" font-size="${fitT(nm, 30, 16)}" fill="${a}">${nm}</text>${sl ? `<text x="200" y="350" text-anchor="middle" ${FONT} font-weight="800" font-size="${fitT(sl, 15, 30)}" fill="#fff" opacity=".95">${sl}</text>` : ""}</svg>`;
  if (L.style === "modern") return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">${defs}<rect x="20" y="20" width="360" height="360" rx="74" fill="url(#${id}a)"/><circle cx="318" cy="84" r="70" fill="${c}" opacity=".22"/><circle cx="74" cy="330" r="54" fill="#fff" opacity=".08"/>
<rect x="128" y="62" width="144" height="144" rx="40" fill="url(#${id}b)" transform="rotate(8 200 134)"/>${sym(L, 200, 134, 104)}<text x="200" y="268" text-anchor="middle" ${FONT} font-weight="900" font-size="${fitT(nm, 38, 13)}" fill="#fff">${nm}</text><rect x="120" y="290" width="160" height="5" rx="3" fill="${c}"/>${sl ? `<text x="200" y="330" text-anchor="middle" ${FONT} font-weight="800" font-size="${fitT(sl, 17, 26)}" fill="${c}">${sl}</text>` : ""}</svg>`;
  if (L.style === "hex") return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">${defs}<polygon points="200,18 358,108 358,292 200,382 42,292 42,108" fill="url(#${id}a)"/><polygon points="200,40 338,120 338,280 200,360 62,280 62,120" fill="none" stroke="${c}" stroke-width="4" stroke-dasharray="2 9" stroke-linecap="round"/>
<circle cx="200" cy="160" r="70" fill="url(#${id}b)"/>${sym(L, 200, 160, 92)}<rect x="70" y="250" width="260" height="52" rx="26" fill="${c}"/><text x="200" y="285" text-anchor="middle" ${FONT} font-weight="900" font-size="${fitT(nm, 27, 16)}" fill="${a}">${nm}</text>${sl ? `<text x="200" y="332" text-anchor="middle" ${FONT} font-weight="800" font-size="${fitT(sl, 14, 28)}" fill="#fff">${sl}</text>` : ""}</svg>`;
  // seal (الافتراضي)
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">${defs}<circle cx="200" cy="200" r="186" fill="url(#${id}a)"/><circle cx="200" cy="200" r="168" fill="none" stroke="${c}" stroke-width="3"/><circle cx="200" cy="200" r="104" fill="none" stroke="${c}" stroke-width="3"/>
<text ${FONT} font-weight="900" font-size="${fitT(nm, 30, 18)}" fill="#fff" letter-spacing="1"><textPath href="#${id}t" startOffset="50%" text-anchor="middle">${nm}</textPath></text>
<text ${FONT} font-weight="800" font-size="${fitT(sl || sch, 17, 30)}" fill="${c}"><textPath href="#${id}u" startOffset="50%" text-anchor="middle" dominant-baseline="hanging">${sl || sch}</textPath></text>
<circle cx="200" cy="200" r="96" fill="url(#${id}b)"/>${sym(L, 200, 200, 118)}${[[40, 200], [360, 200]].map(([x, y]) => `<text x="${x}" y="${y}" font-size="20" text-anchor="middle" dominant-baseline="central" fill="${c}">✦</text>`).join("")}</svg>`;
}
export const svgURL = s => "data:image/svg+xml;charset=utf-8," + encodeURIComponent(s);
export function svgToPng(svg, size = 1024) { return new Promise((res, rej) => { const im = new Image(); im.onload = () => { const c = document.createElement("canvas"); c.width = c.height = size; c.getContext("2d").drawImage(im, 0, 0, size, size); res(c.toDataURL("image/png")); }; im.onerror = rej; im.src = svgURL(svg); }); }

// ══════════════════════════════════════════════════════════
// 🎨 التنسيق المشترك
// ══════════════════════════════════════════════════════════
export const LF_CSS = `
.lf{--nv:#0b2545;--gd:#b8860b;--gd2:#d4af37;font-family:inherit;display:grid;gap:14px;color:#0f172a}
.lf *{box-sizing:border-box}
.lf-hero{position:relative;overflow:hidden;border-radius:24px;padding:22px 24px;color:#fff;background:radial-gradient(120% 140% at 100% 0%,var(--h2,#1d4ed8) 0%,var(--h1,#0b2545) 60%);box-shadow:0 18px 40px -22px rgba(11,37,69,.6)}
.lf-hero:after{content:"";position:absolute;inset:auto -60px -90px auto;width:260px;height:260px;border-radius:50%;background:radial-gradient(circle,rgba(212,175,55,.35),transparent 65%)}
.lf-hero h2{margin:0;font-size:24px;font-weight:900;display:flex;gap:10px;align-items:center}.lf-hero p{margin:6px 0 0;font-weight:700;opacity:.88;font-size:14px;line-height:1.8;max-width:760px}
.lf-hero .lf-kp{display:flex;gap:10px;flex-wrap:wrap;margin-top:14px;position:relative;z-index:1}.lf-hero .lf-kp div{background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.22);border-radius:14px;padding:8px 14px;backdrop-filter:blur(4px)}.lf-hero .lf-kp b{font-size:22px;font-weight:900;display:block;color:var(--gd2)}.lf-hero .lf-kp small{font-weight:800;font-size:12px;opacity:.9}
.lf-card{background:#fff;border:1px solid #e2e8f0;border-radius:18px;padding:16px;box-shadow:0 6px 18px -14px rgba(15,23,42,.35)}
.lf-h{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.lf-h>b{font-size:16px;color:var(--nv)}.lf-sp{flex:1}
.lf-b{border:1.5px solid #cbd5e1;background:#fff;color:#334155;border-radius:12px;padding:8px 14px;font:inherit;font-weight:800;font-size:13.5px;cursor:pointer;display:inline-flex;gap:6px;align-items:center;transition:.15s}
.lf-b:hover{border-color:var(--nv);color:var(--nv)}.lf-b.p{background:linear-gradient(135deg,var(--nv),#1d4ed8);color:#fff;border-color:transparent}.lf-b.g{background:linear-gradient(135deg,var(--gd),var(--gd2));color:#1f1300;border-color:transparent}
.lf-b.d{color:#b91c1c;border-color:#fecaca}.lf-b:disabled{opacity:.5;cursor:not-allowed}.lf-b.sm{padding:5px 10px;font-size:12.5px;border-radius:10px}
.lf-in,.lf-ta,.lf-sel{width:100%;border:1.5px solid #cbd5e1;border-radius:12px;padding:9px 12px;font:inherit;font-weight:700;font-size:14px;background:#fff;color:#0f172a}
.lf-in:focus,.lf-ta:focus,.lf-sel:focus{outline:none;border-color:#1d4ed8;box-shadow:0 0 0 3px rgba(29,78,216,.12)}.lf-ta{min-height:84px;resize:vertical;line-height:1.8}
.lf-f{display:grid;gap:5px;align-content:start}.lf-f>span{font-weight:900;font-size:13px;color:#334155}.lf-f>small{color:#64748b;font-weight:700;font-size:11.5px}
.lf-g2{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr));gap:12px}.lf-g3{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,200px),1fr));gap:10px}
.lf-chips{display:flex;gap:6px;flex-wrap:wrap}.lf-chip{border:1.5px solid #cbd5e1;background:#fff;border-radius:99px;padding:5px 12px;font:inherit;font-weight:800;font-size:13px;cursor:pointer;color:#334155;display:inline-flex;gap:6px;align-items:center}
.lf-chip.on{background:var(--c,#0b2545);border-color:var(--c,#0b2545);color:#fff}.lf-chip small{font-weight:800;opacity:.8}
.lf-av{display:inline-grid;place-items:center;border-radius:50%;color:#fff;font-weight:900;flex:none;letter-spacing:-.5px;box-shadow:inset 0 -3px 0 rgba(0,0,0,.15)}
.lf-pp{display:flex;align-items:center;gap:8px;border:1.5px solid #e2e8f0;border-radius:14px;padding:6px 10px;background:#fff;cursor:pointer;font:inherit;font-weight:800;font-size:13px;text-align:right;color:#0f172a;transition:.12s}
.lf-pp small{display:block;color:#64748b;font-weight:700;font-size:11px}.lf-pp.on{border-color:var(--c,#1d4ed8);background:color-mix(in srgb,var(--c,#1d4ed8) 9%,#fff);box-shadow:0 0 0 2px color-mix(in srgb,var(--c,#1d4ed8) 30%,transparent)}
.lf-pp .ck{margin-inline-start:auto;width:20px;height:20px;border-radius:50%;border:2px solid #cbd5e1;display:grid;place-items:center;font-size:12px;color:#fff;flex:none}.lf-pp.on .ck{background:var(--c,#1d4ed8);border-color:var(--c,#1d4ed8)}
.lf-tabs{display:flex;gap:6px;flex-wrap:wrap;background:#f1f5f9;padding:5px;border-radius:14px}.lf-tabs button{flex:1 1 auto;border:0;background:transparent;border-radius:10px;padding:8px 12px;font:inherit;font-weight:900;font-size:13.5px;color:#475569;cursor:pointer}.lf-tabs button.on{background:#fff;color:var(--nv);box-shadow:0 2px 8px -4px rgba(0,0,0,.25)}
.lf-st{display:inline-flex;align-items:center;gap:4px;border-radius:99px;padding:2px 10px;font-weight:900;font-size:12px;background:color-mix(in srgb,var(--c) 13%,#fff);color:var(--c);border:1px solid color-mix(in srgb,var(--c) 35%,#fff)}
.lf-empty{text-align:center;padding:30px 12px;color:#64748b;font-weight:800}.lf-empty b{display:block;font-size:40px;margin-bottom:6px}
.lf-mod{position:fixed;inset:0;z-index:2000;background:rgba(15,23,42,.55);display:grid;place-items:center;padding:12px;backdrop-filter:blur(3px)}.lf-mod>div{background:#fff;border-radius:22px;width:min(1000px,100%);max-height:94vh;overflow:auto;padding:18px;box-shadow:0 30px 80px -30px rgba(0,0,0,.5)}
.lf-sec{border:1px solid #e2e8f0;border-radius:16px;padding:14px;display:grid;gap:10px;background:linear-gradient(180deg,#fff,#fbfdff)}.lf-sec>h4{margin:0;font-size:15px;color:var(--nv);display:flex;gap:8px;align-items:center}.lf-sec>h4 i{font-style:normal;width:28px;height:28px;border-radius:9px;display:grid;place-items:center;background:#eff6ff}
.lf-list{display:grid;gap:6px}.lf-li{display:flex;gap:6px;align-items:center}.lf-li .lf-in{flex:1}
.lf-bar{height:8px;border-radius:8px;background:#e2e8f0;overflow:hidden}.lf-bar i{display:block;height:100%;border-radius:8px;background:linear-gradient(90deg,var(--c,#1d4ed8),color-mix(in srgb,var(--c,#1d4ed8) 60%,#fff))}
.lf-note{background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:8px 12px;font-weight:700;font-size:12.5px;color:#78350f;line-height:1.8}
.lf-tbl{width:100%;border-collapse:collapse;font-size:13px}.lf-tbl th{background:#f8fafc;color:#334155;font-weight:900;padding:8px;border-bottom:2px solid #e2e8f0;text-align:right}.lf-tbl td{padding:8px;border-bottom:1px solid #f1f5f9;font-weight:700}
.lf-scroll{overflow:auto;max-width:100%}
@media(max-width:640px){.lf-hero{padding:16px;border-radius:18px}.lf-hero h2{font-size:19px}.lf-card{padding:12px}.lf-mod>div{padding:12px;border-radius:16px}}
`;
export const LfStyle = () => <style>{LF_CSS}</style>;
export const Field = ({ l, s, children }) => <label className="lf-f"><span>{l}</span>{children}{s && <small>{s}</small>}</label>;
// قائمة نصوص قابلة للإضافة والحذف
export function ListEd({ v, set, ph, add = "➕ إضافة" }) {
  const L = arr(v).length ? arr(v) : [""];
  return <div className="lf-list">{L.map((x, i) => <div key={i} className="lf-li"><span style={{ fontWeight: 900, color: "#94a3b8", width: 18 }}>{ar(i + 1)}</span><input className="lf-in" value={x} placeholder={ph} onChange={e => { const n = [...L]; n[i] = e.target.value; set(n); }} />{L.length > 1 && <button type="button" className="lf-b sm d" onClick={() => set(L.filter((_, j) => j !== i))}>✕</button>}</div>)}
    <button type="button" className="lf-b sm" style={{ justifySelf: "start" }} onClick={() => set([...L, ""])}>{add}</button></div>;
}
// اختيار أشخاص مجمّعين حسب الفئة
export function PeoplePick({ P, sel, set, groups = ["principal", "deputy", "counselor", "activity", "teachers"], filter }) {
  const [q, setQ] = useState(""); const S = new Set(arr(sel).map(x => x.key));
  const tog = x => set(S.has(x.key) ? arr(sel).filter(y => y.key !== x.key) : [...arr(sel), { key: x.key, name: x.name, grp: x.grp, job: x.job || (x.subj || []).join("، ") }]);
  return <div style={{ display: "grid", gap: 10 }}>
    <input className="lf-in" placeholder="🔎 ابحث بالاسم" value={q} onChange={e => setQ(e.target.value)} />
    {groups.map(g => { let L = arr(P[g]).filter(x => !q || nrm(x.name).includes(nrm(q))); if (filter) L = L.filter(filter); if (!L.length) return null; const [ic, t, c] = GRP[g]; const on = L.filter(x => S.has(x.key)).length;
      return <div key={g} style={{ display: "grid", gap: 6 }}><div className="lf-h"><b style={{ color: c, fontSize: 14 }}>{ic} {t}</b><small style={{ color: "#64748b", fontWeight: 800 }}>{ar(on)} من {ar(L.length)}</small><span className="lf-sp" />
        <button type="button" className="lf-b sm" onClick={() => { const rest = arr(sel).filter(y => !L.some(x => x.key === y.key)); set(on === L.length ? rest : [...rest, ...L.map(x => ({ key: x.key, name: x.name, grp: x.grp, job: x.job || (x.subj || []).join("، ") }))]); }}>{on === L.length ? "إلغاء الكل" : "اختيار الكل"}</button></div>
        <div className="lf-g3">{L.map(x => <button type="button" key={x.key} className={"lf-pp" + (S.has(x.key) ? " on" : "")} style={{ "--c": c }} onClick={() => tog(x)}><Av n={x.name} s={32} c={c} /><span>{x.name}<small>{x.job || (x.subj || []).slice(0, 2).join("، ") || GRP[g][1]}</small></span><span className="ck">{S.has(x.key) ? "✓" : ""}</span></button>)}</div></div>; })}
  </div>;
}
export function Loading({ t = "⏳ جارٍ التحميل…" }) { return <div className="lf-card lf-empty"><b>⏳</b>{t}</div>; }
