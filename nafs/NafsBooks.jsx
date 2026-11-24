// ════════════════════════════════════════════════════════════════════
// 📚 مراجع نافس – الصف الثالث المتوسط (الرياضيات • العلوم • لغتي)
// • المعلم: يرى مواده وفصوله حسب الجدول المدرسي، يعرض للشرح ويكتب على السبورة لكل فصل
// • الطالب: يدخل برقم هويته (كشوف الثالث المتوسط) ويحل في دفتره الخاص      school-nafsbook/{sid}/{book}/{page}
//   ويُتابَع دخوله واطّلاعه                                                    school-nafsbook-seen/{sid}
// • المعلم: سبورة الصفحة لكل فصل school-nafsbook-t/{tkey}/{ck}/{book}/{page}
//            «تم شرح الصفحة» والدروس والاختبارات                            school-nafsbook-tp/{tkey}/{book}/{ck}/{p12|u3|t1}
//            تعليقه على دفتر الطالب                                         school-nafsbook-tc/{sid}/{book}/{page}
// • السبورة الذكية (ملاحظات محفوظة لكل صفحة)                               school-nafsbook-b/{owner}/{book}/{page}/{id}
// • عند اكتمال شرح أسبوع يُنبَّه المدير لعمل الاختبار                      school-nafsbook-alerts/{book}_{ck}_{w}
//   ويفتح المدير الاختبار لطلاب الفصل                                       school-nafsbook-open/{ck}/{book}/{w}
// • ملفات PDF في public/nafs/ ولا تدخل في حزمة الموقع؛ ومكتبة pdf.js تُحمَّل فقط عند فتح هذه الصفحة
// ════════════════════════════════════════════════════════════════════
import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import PRE from "./pretest.js";
import { Mth, mthHtml } from "../mathAr.jsx";
const isM = B => !!(B && /رياض/.test(B.name || ""));
import { Q as QM, P as QP, S as QS } from "./qmeta.js";
import { QB, QST, QCTX } from "./qbox.js";

const NB = "school-nafsbook", NB_IDX = "school-nafsbook-idx", NB_TC = "school-nafsbook-tc";
const NB_T = "school-nafsbook-t", NB_TP = "school-nafsbook-tp", NB_B = "school-nafsbook-b";
const NB_SEEN = "school-nafsbook-seen", NB_AL = "school-nafsbook-alerts", NB_OPEN = "school-nafsbook-open";
// مواضع الإجابات على الصفحة (يضعها المعلم مرة واحدة) {book}/{page}/{i}={x,y}  • إتاحة الإجابات للطلاب {ck}/{book}/{page}={at,by}
const NB_ANS = "school-nafsbook-ans", NB_REL = "school-nafsbook-rel";
// لوحة الرموز والقوالب الرياضية والعلمية للكتابة في الفراغ
const NB_SYM = [["رياضيات", ["×", "÷", "−", "+", "=", "≠", "≈", "<", ">", "≤", "≥", "±", "√", "∛", "π", "∞", "°", "%", "½", "¼", "¾", "⅓", "|  |", "(  )", "∠", "△", "⊥", "∥", "≅", "∼", "→"]], ["قوالب", ["√(  )", "(  )²", "(  )³", "× ١٠ⁿ", "س²", "س³", "أ/ب", "∑", "م = ك ÷ ح", "ق = ك × ت", "ع = ف ÷ ز"]], ["علوم", ["H₂O", "CO₂", "O₂", "H₂", "NaCl", "CH₄", "→", "⇌", "°س", "سم²", "سم³", "م/ث", "م/ث²", "كجم", "نيوتن", "جول", "واط", "أمبير", "فولت", "pH"]], ["أُس", ["⁰", "¹", "²", "³", "⁴", "⁵", "⁶", "⁷", "⁸", "⁹", "⁻", "⁺", "ⁿ"]], ["سفلي", ["₀", "₁", "₂", "₃", "₄", "₅", "₆", "₇", "₈", "₉", "₊", "₋"]]];
// طابور حفظ عند انقطاع الإنترنت: يُرفع تلقائيًا عند عودة الاتصال
const NBQ = "nb-offq-v1"; const qGet = () => lsGet(NBQ, {}) || {}; const qSet = o => lsSet(NBQ, o);
async function qFlush(api) { const Q = qGet(); const ks = Object.keys(Q); if (!ks.length) return 0; let n = 0; for (const k of ks) { const ok = await api.maPut(k, Q[k]); if (ok !== false) { const q = qGet(); delete q[k]; qSet(q); n++; } } return n; }
const stripH = h => String(h || "").replace(/<br\s*\/?>/g, " ").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim();
const PDFJS = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
const PDFJS_W = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
const REMEMBER = "nafsbook-stu-v1", TMAN = "nafsbook-tman-v1";
const ar = n => String(n ?? "").replace(/\d/g, d => "٠١٢٣٤٥٦٧٨٩"[d]);
const normId = v => String(v ?? "").replace(/[٠-٩]/g, d => "٠١٢٣٤٥٦٧٨٩".indexOf(d)).replace(/\D/g, "");
const obj = v => (v && typeof v === "object" ? v : {});
const lsGet = (k, d = null) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const arr = v => Array.isArray(v) ? v.filter(Boolean) : (v && typeof v === "object" ? Object.values(v).filter(Boolean) : []);
const byCk = (a, b) => (+a.split("-")[0] - +b.split("-")[0]) || (+a.split("-")[1] - +b.split("-")[1]);
const cls = ck => { const [l, c] = String(ck || "").split("-"); return l && c ? `${ar(c)}/${ar(l)}` : String(ck || ""); };
const pct = (a, b) => b ? Math.round(a / b * 100) : 0;
const when = t => { if (!t) return "—"; const d = (Date.now() - t) / 864e5; return d < 1 ? "اليوم" : d < 2 ? "أمس" : d < 30 ? `قبل ${ar(Math.floor(d))} يوم` : new Date(t).toLocaleDateString("ar-SA"); };
// مفتاح ثابت للمعلم من اسمه في الجدول (حروف لاتينية آمنة لـ Firebase)
export const tKey = n => { let h = 2166136261; for (const ch of String(n || "").replace(/\s+/g, " ").trim()) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619); } return "t" + (h >>> 0).toString(36); };
const bookOfSubj = s => /رياض/.test(s) ? "math" : /علوم/.test(s) ? "sci" : /لغتي|عربي|العربية/.test(s) ? "ar" : null;

export const BOOKS = {
  math: { name: "الرياضيات", c: "#2b59c3", file: "/nafs/math.pdf", pages: 217,
    units: [5,12,20,26,34,40,47,53,62,69,78,84,92,98,106,112,120,126,134,140,148,154,162,168,176,182,189,195,204,210],
    tests: [18,32,45,60,75,90,104,118,132,146,160,174,187,202,216],
    titles: ["الأعداد الصحيحة والنسبية","الأعداد الحقيقية والجذور","القوى والصيغة العلمية","العمليات على الأعداد","النسبة والتناسب","التقدير","المتتابعات والعلاقات الخطية","الدالة الخطية","الدالة التربيعية","العبارات الجبرية","تحليل العبارات الجبرية","المعادلات الخطية","المعادلات التربيعية","أنظمة المعادلات","المتباينات","الزوايا والمستقيمات المتوازية","زوايا المضلعات والتبليط","الأشكال الرباعية والمجسمات","المثلثات وفيثاغورس","التطابق والتشابه","النسب المثلثية","المستوى الإحداثي والميل","التحويلات الهندسية","وحدات القياس","المحيط والمساحة","الحجوم","المساحات السطحية","تمثيل البيانات","النزعة المركزية والتشتت","الاحتمال"] },
  sci: { name: "العلوم", c: "#12806a", file: "/nafs/sci.pdf", pages: 217,
    units: [5,12,21,28,36,42,50,56,64,70,78,84,92,98,105,111,119,125,133,139,148,154,162,168,176,182,190,196,204,210],
    tests: [18,34,48,62,76,90,103,117,131,145,160,174,188,202,215],
    titles: ["الزلازل والبراكين","حركة الصفائح","الخلية","دورة الخلية والانقسام","الكروموسوم و DNA","الوراثة ومندل","أجهزة جسم الإنسان","تصنيف المخلوقات","تركيب الذرة","المركبات والمخاليط","الجدول الدوري والروابط","الذائبية","التفاعلات الكيميائية","الأحماض والقواعد","سرعة التفاعل","الطاقة الحرارية","انتقال الحرارة","الحرارة النوعية","الطاقة الحركية والقوى","حفظ الطاقة والكهرباء","موجات الصوت","الضوء والمرايا","استكشاف الكون","الأجرام السماوية","التغير المناخي","دورة الكربون","الصخور والمعادن","دورة الصخور","النشاط البشري والمخاطر","الموارد الطبيعية"] },
  ar: { name: "لغتي", c: "#8e2a3f", file: "/nafs/ar.pdf", pages: 223,
    units: [6,12,20,25,33,39,47,53,62,68,77,83,91,97,106,111,120,125,134,140,149,155,164,169,178,184,193,199,208,214],
    tests: [18,31,45,59,74,89,103,117,131,146,161,175,190,205,221],
    titles: ["الترادف والتضاد","السياق والتعريف","الحقول الدلالية","العلاقات بين المفردات","توظيف المفردات","الحقيقي والمجازي","المعلومات غير المباشرة","طرح الأسئلة","الفكرة الرئيسة والفرعية","القصد وعناصر النص","الأفكار الضمنية","التشابه والاختلاف","الروابط داخل النص","المقارنة بين نصين","الترتيب الزمني والمكاني","القضية والأدلة","الحقيقة والرأي","المباشر وغير المباشر","بنية النص ونوعه","مشاعر الكاتب","أبدي وجهة نظري","مصداقية المعلومات","القيم والاتجاهات","البدائل والحلول","الحجج والبراهين","وسائل الإقناع","المشكلة في السرد","حل المشكلات","التلخيص","المنظمات البيانية"] },
};
const BOOK_IDS = Object.keys(BOOKS);

// أجزاء الكتاب: ٣٠ درسًا (u0..u29) و١٥ اختبارًا (t0..t14)
const SEGS = {};
const segs = book => SEGS[book] || (SEGS[book] = (() => { const B = BOOKS[book], L = [];
  for (let w = 0; w < 15; w++) { L.push({ s: B.units[w * 2], slot: "u" + (w * 2), label: B.titles[w * 2], w, k: "u" }); L.push({ s: B.units[w * 2 + 1], slot: "u" + (w * 2 + 1), label: B.titles[w * 2 + 1], w, k: "u" }); L.push({ s: B.tests[w], slot: "t" + w, label: `اختبار الأسبوع ${ar(w + 1)}`, w, k: "t" }); }
  return L.sort((a, b) => a.s - b.s); })());
const segAt = (book, page) => { let r = null; for (const x of segs(book)) if (x.s <= page) r = x; return r; };
const tpCount = (o) => { const k = Object.keys(obj(o)); return { u: k.filter(x => x[0] === "u").length, t: k.filter(x => x[0] === "t").length }; };
const weekOfPage = (book, p) => { const B = BOOKS[book]; for (let w = 14; w >= 0; w--) if (p >= B.units[w * 2]) return w; return -1; };

// فصول المعلم ومواده الثلاث من الجدول: { math: ["3-1","3-2"], ... }
function assignOf(T, ti) {
  const P = {}; if (!T || !T.C || ti < 0) return P;
  Object.entries(T.C).forEach(([ck, days]) => { if (!String(ck).startsWith("3-")) return; arr(days).forEach(day => arr(day).forEach(c => {
    if (Array.isArray(c) && +c[1] === ti && +c[0] >= 0) { const b = bookOfSubj(T.S[+c[0]] || ""); if (b) (P[b] = P[b] || new Set()).add(ck); } })); });
  return Object.fromEntries(Object.entries(P).map(([b, s]) => [b, [...s].sort(byCk)]));
}
// كل معلمي المواد الثلاث للثالث المتوسط
function allAssign(T) {
  if (!T || !T.T) return [];
  const out = []; T.T.forEach((name, ti) => { const P = assignOf(T, ti); Object.entries(P).forEach(([book, cks]) => out.push({ name, ti, book, cks, key: tKey(name) })); });
  return out.sort((a, b) => BOOK_IDS.indexOf(a.book) - BOOK_IDS.indexOf(b.book) || byCk(a.cks[0], b.cks[0]));
}

// ── تحميل pdf.js مرة واحدة عند الحاجة (لا يدخل في حزمة الموقع)
let pdfjsP = null;
function loadPdfjs() {
  if (pdfjsP) return pdfjsP;
  pdfjsP = new Promise((res, rej) => {
    if (window.pdfjsLib) return res(window.pdfjsLib);
    const s = document.createElement("script"); s.src = PDFJS; s.async = true;
    s.onload = async () => {
      const lib = window.pdfjsLib;
      try { const t = await (await fetch(PDFJS_W)).text(); lib.GlobalWorkerOptions.workerSrc = URL.createObjectURL(new Blob([t], { type: "text/javascript" })); }
      catch { lib.GlobalWorkerOptions.workerSrc = PDFJS_W; }
      res(lib);
    };
    s.onerror = () => { pdfjsP = null; rej(new Error("pdfjs")); };
    document.head.appendChild(s);
  });
  return pdfjsP;
}
const docCache = {};
async function openDoc(book) {
  if (!docCache[book]) docCache[book] = loadPdfjs().then(lib => lib.getDocument({ url: BOOKS[book].file }).promise).catch(e => { delete docCache[book]; throw e; });
  return docCache[book];
}

// ── ترميز الخطوط: نقاط نسبية (٠–١) حتى تطابق الصفحة على أي شاشة
const enc = pts => pts.map(p => `${p[0].toFixed(4)},${p[1].toFixed(4)}`).join(";");
const dec = s => String(s || "").split(";").filter(Boolean).map(x => x.split(",").map(Number));


// ══════════════════════ حساب التقدّم: الصفحة ← الدرس ← الأسبوع ← الكتاب ══════════════════════
const range = (a, b) => { const r = []; for (let i = a; i <= b; i++) r.push(i); return r; };
const UP = {};
// صفحات الدرس i: من بدايته حتى ما قبل الجزء التالي (درس أو اختبار)
const unitPages = (book, i) => { const k = book + i; if (UP[k]) return UP[k]; const S = segs(book); const ix = S.findIndex(x => x.slot === "u" + i); const end = S[ix + 1] ? S[ix + 1].s - 1 : BOOKS[book].pages; return (UP[k] = range(S[ix].s, end)); };
const testPages = (book, w) => { const B = BOOKS[book]; return range(B.tests[w], w < 14 ? B.units[w * 2 + 2] - 1 : B.pages); };
const weekPages = (book, w) => [...unitPages(book, w * 2), ...unitPages(book, w * 2 + 1)];
const unitFrac = (C, book, i) => { C = obj(C); if (C["u" + i]) return 1; const P = unitPages(book, i); return P.filter(p => C["p" + p]).length / P.length; };
const weekPct = (C, book, w) => { const a = unitPages(book, w * 2).length, b = unitPages(book, w * 2 + 1).length; return Math.round((unitFrac(C, book, w * 2) * a + unitFrac(C, book, w * 2 + 1) * b) / (a + b) * 100); };
const bookPct = (C, book) => { let t = 0, d = 0; for (let i = 0; i < 30; i++) { const n = unitPages(book, i).length; t += n; d += unitFrac(C, book, i) * n; } return Math.round(d / t * 100); };
const weeksDone = (C, book) => Array.from({ length: 15 }, (_, w) => weekPct(C, book, w) === 100).filter(Boolean).length;
// تقدّم الطالب: الصفحات التي فيها حل من صفحات الأسبوع (الدروس والاختبار)
const stuWeekPct = (pagesObj, book, w) => { const P = [...weekPages(book, w), ...testPages(book, w)]; const o = obj(pagesObj); return Math.round(P.filter(p => o[p]).length / P.length * 100); };
const testSolved = (pagesObj, book, w) => testPages(book, w).some(p => obj(pagesObj)[p]);

// تنبيه المدير عند اكتمال شرح أسبوع لفصل (مرة واحدة لكل أسبوع وفصل)
async function raiseAlert(api, { book, ck, w, tkey, tname }) {
  const key = `${book}_${ck}_${w}`; const cur = await api.maGet(`${NB_AL}/${key}`);
  if (cur && cur.at) return false;
  await api.maPut(`${NB_AL}/${key}`, { book, ck, w, t: tname || "", tkey, at: Date.now(), st: "new" });
  return true;
}

// ── تتبّع اطّلاع الطالب: الصفحة تُحسب «مقروءة» بعد بقائها ثانيتين
function useSeen(api, sid, book, page) {
  useEffect(() => {
    if (!sid) return; const t = setTimeout(() => { const n = Date.now();
      api.maPut(`${NB_SEEN}/${sid}/b/${book}/p/${page}`, n); api.maPut(`${NB_SEEN}/${sid}/b/${book}/at`, n); api.maPut(`${NB_SEEN}/${sid}/at`, n); }, 2000);
    return () => clearTimeout(t);
  }, [sid, book, page]);
}

// احتفال صغير عند اكتمال أسبوع
function confetti() {
  try { const box = document.createElement("div"); box.className = "nb-conf"; const C = ["#f59e0b", "#10b981", "#3b82f6", "#ef4444", "#8b5cf6", "#ec4899"];
    for (let i = 0; i < 60; i++) { const s = document.createElement("i"); s.style.left = Math.random() * 100 + "%"; s.style.background = C[i % C.length]; s.style.animationDelay = Math.random() * .6 + "s"; s.style.transform = `rotate(${Math.random() * 360}deg)`; box.appendChild(s); }
    document.body.appendChild(box); setTimeout(() => box.remove(), 3200); } catch {}
}

const CSS = `
.nb{direction:rtl;font-family:inherit;color:#1d2433;min-height:100vh;background:#eef0f4}
.nb *{box-sizing:border-box}
.nb-fs{position:fixed;inset:0;z-index:2000;overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;height:100vh;height:100dvh;min-height:0;padding-bottom:env(safe-area-inset-bottom,0px);animation:nbFsIn .18s ease-out}
@keyframes nbFsIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
.nb-fs .nb-page canvas.pdf{transition:opacity .15s}
@media (max-width:560px){.nb-fs .nb-top{padding:6px 8px;gap:5px}.nb-fs .nb-top .nb-b{padding:6px 8px}.nb-fs .nb-top b{flex:1 1 0;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.nb-fs .nb-top .nb-sp{display:none}.nb-fs .nb-pg{width:100%;justify-content:center}.nb-fs .nb-tools{gap:5px;padding:5px 8px}.nb-fs .nb-tools .nb-b{padding:6px 8px;font-size:12.5px}.nb-fs .nb-stage{padding-top:6px}}
.nb-top{position:sticky;top:0;z-index:30;background:#fff;border-bottom:3px solid var(--c,#334155);padding:7px 10px;display:flex;flex-wrap:wrap;gap:6px;align-items:center}
.nb-top b{font-size:15px}
.nb-sp{flex:1}
.nb-b{border:1px solid #cbd5e1;background:#fff;border-radius:10px;padding:6px 10px;font:inherit;font-size:13px;font-weight:800;cursor:pointer;white-space:nowrap;color:#1d2433;display:inline-flex;align-items:center;gap:4px;justify-content:center}
.nb-b.on{background:var(--c,#334155);color:#fff;border-color:var(--c,#334155)}
.nb-b.ok{background:#16a34a;color:#fff;border-color:#16a34a}
.nb-b.big{padding:9px 14px;font-size:14px}
.nb-b:disabled{opacity:.4;cursor:default}
.nb-sel{border:1px solid #cbd5e1;border-radius:10px;padding:6px;font:inherit;font-size:13px;max-width:190px;background:#fff;font-weight:800}
.nb-pg{display:flex;align-items:center;gap:4px;font-weight:800;font-size:13px}
.nb-pg input{width:52px;text-align:center;border:1px solid #cbd5e1;border-radius:8px;padding:5px;font:inherit}
.nb-tools{position:sticky;top:var(--th,52px);z-index:29;display:flex;gap:6px;overflow-x:auto;padding:6px 10px;background:#f8fafc;border-bottom:1px solid #e2e8f0;align-items:center;scrollbar-width:thin}
.nb-tools .sep{width:1px;align-self:stretch;background:#e2e8f0;flex:none}
.nb-dot{width:26px;height:26px;border-radius:50%;border:3px solid #fff;box-shadow:0 0 0 1px #cbd5e1;cursor:pointer;flex:none}
.nb-dot.on{box-shadow:0 0 0 3px #1d2433}
.nb-scrub{position:relative;height:16px;margin:0 10px;cursor:pointer;display:flex;gap:2px;align-items:center}
.nb-scrub i{flex:1;height:7px;border-radius:3px;background:#e2e8f0;position:relative;overflow:hidden}
.nb-scrub i b{position:absolute;inset:0 0 0 auto;background:var(--c);opacity:.85}
.nb-scrub i.cur{height:11px;box-shadow:0 0 0 2px var(--c)}
.nb-ribbon{max-width:1100px;margin:8px auto 0;padding:8px 10px;border-radius:14px;background:#fff;border:2px solid var(--c);display:flex;flex-wrap:wrap;gap:8px;align-items:center;box-shadow:0 4px 14px -10px rgba(0,0,0,.4)}
.nb-ribbon .lbl{font-weight:900;font-size:13.5px}
.nb-stage{padding:10px 0 96px;overflow-x:auto}
.nb-page{position:relative;margin:0 auto;background:#fff;box-shadow:0 4px 18px rgba(0,0,0,.15)}
.nb-page canvas.pdf,.nb-page canvas.ink{position:absolute;inset:0;width:100%;height:100%}
.nb-done{position:absolute;top:8px;left:8px;z-index:6;background:#16a34a;color:#fff;border-radius:999px;padding:3px 10px;font-weight:900;font-size:12px;box-shadow:0 2px 8px rgba(0,0,0,.2)}
.nb-note{position:absolute;transform:translate(50%,-50%);background:#fff8c5;border:1.5px solid #e0b100;border-radius:8px;padding:2px 6px;font-weight:800;color:#7c2d12;min-width:40px;max-width:60%;box-shadow:0 2px 6px rgba(0,0,0,.15);z-index:5;white-space:pre-wrap;line-height:1.5}
.nb-fill{position:absolute;transform:translateY(-50%);z-index:6;font-weight:800;line-height:1.25;white-space:nowrap;font-family:inherit;padding:0 2px;border-radius:4px}
.nb-fill.ed{background:rgba(255,255,255,.92);box-shadow:0 0 0 2px #3b82f6}.nb-fill input{border:0;outline:0;background:transparent;font:inherit;color:inherit;min-width:2.5em;padding:0}.nb-fill span{text-shadow:0 0 2px #fff,0 0 2px #fff}
.nb-fill .x{position:absolute;top:-9px;left:-9px;width:16px;height:16px;border-radius:50%;background:#dc2626;color:#fff;border:0;font-size:10px;line-height:16px;cursor:pointer;padding:0;opacity:.75}
.nb-ansp{position:absolute;transform:translateY(-50%);z-index:7;color:#15803d;background:rgba(220,252,231,.92);border:1.5px dashed #16a34a;border-radius:6px;padding:0 5px;font-weight:900;max-width:46%;line-height:1.35;pointer-events:none}
.nb-placeov{position:absolute;inset:0;z-index:9;cursor:copy;background:rgba(15,118,110,.06);outline:2px dashed #0f766e}
.nb-place{position:sticky;top:calc(var(--th,52px) + 46px);z-index:28;display:flex;gap:6px;flex-wrap:wrap;align-items:center;padding:6px 10px;background:#ecfdf5;border-bottom:1px solid #a7f3d0;font-size:13px}
.nb-pal{position:fixed;inset:auto 0 0 0;z-index:60;background:#fff;border-top:2px solid #3b82f6;box-shadow:0 -10px 30px rgba(0,0,0,.15);padding:6px 8px calc(6px + env(safe-area-inset-bottom))}
.nb-pal .pt{display:flex;gap:5px;align-items:center;overflow-x:auto}.nb-pal .ps{display:flex;gap:5px;overflow-x:auto;padding-top:6px}
.nb-pal .ps button{flex:none;min-width:42px;height:40px;border-radius:10px;border:1px solid #cbd5e1;background:#f8fafc;font:inherit;font-size:17px;font-weight:800;cursor:pointer;padding:0 8px;direction:ltr}
.nb-note textarea{border:0;background:transparent;font:inherit;color:inherit;resize:none;width:100%;min-width:120px;outline:none}
.nb-note .x{position:absolute;top:-10px;left:-10px;width:20px;height:20px;border-radius:50%;background:#dc2626;color:#fff;border:0;font-size:12px;line-height:20px;cursor:pointer;padding:0}
.nb-pin{position:absolute;z-index:7;transform:translate(50%,-50%);background:linear-gradient(135deg,#1e293b,#334155);color:#fff;border-radius:12px 12px 12px 3px;padding:5px 10px;font-weight:900;font-size:12.5px;cursor:grab;box-shadow:0 6px 16px -6px rgba(0,0,0,.6);white-space:nowrap;user-select:none;touch-action:none;border:2px solid #fbbf24}
.nb-pin.chalk{background:linear-gradient(135deg,#14532d,#166534)}
.nb-tc{max-width:900px;margin:8px auto;background:#ecfdf5;border:2px solid #10b981;border-radius:12px;padding:8px 12px;font-weight:700;font-size:14px}
.nb-info{max-width:900px;margin:8px auto;background:#fffbeb;border:1.5px dashed #f59e0b;border-radius:12px;padding:6px 12px;font-weight:800;font-size:13px;color:#92400e;text-align:center}
.nb-msg{text-align:center;padding:40px 10px;font-weight:800;color:#475569}
.nb-card{background:#fff;border-radius:16px;box-shadow:0 2px 12px rgba(0,0,0,.08);padding:18px;max-width:520px;margin:20px auto}
.nb-home{display:grid;gap:12px;max-width:1000px;margin:16px auto;padding:0 12px}
.nb-book{background:#fff;border-radius:16px;border-top:6px solid var(--c);padding:14px;box-shadow:0 2px 10px rgba(0,0,0,.07);min-width:0}
.nb-weeks{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
.nb-wk{border:1px solid #cbd5e1;background:#fff;border-radius:8px;min-width:38px;padding:4px 0 0;font:inherit;font-weight:800;cursor:pointer;position:relative;overflow:hidden;display:flex;flex-direction:column;align-items:center}
.nb-wk i{display:block;height:4px;width:100%;margin-top:3px;background:#f1f5f9}
.nb-wk i b{display:block;height:100%;background:var(--c)}
.nb-wk.done{background:var(--c);color:#fff;border-color:var(--c)}
.nb-wk.done i{background:rgba(255,255,255,.35)}.nb-wk.done i b{background:#fff}
.nb-save{position:fixed;bottom:calc(14px + env(safe-area-inset-bottom,0px));left:14px;z-index:2060;background:#1d2433;color:#fff;border-radius:999px;padding:7px 14px;font-size:12.5px;font-weight:800;opacity:.95;max-width:70vw}
.nb-nav{position:fixed;bottom:calc(12px + env(safe-area-inset-bottom,0px));right:12px;z-index:2040;display:flex;gap:8px}
.nb-nav button{width:52px;height:46px;border-radius:14px;border:0;background:var(--c,#334155);color:#fff;font-size:22px;font-weight:900;box-shadow:0 3px 10px rgba(0,0,0,.25);cursor:pointer}
.nb-list{display:grid;gap:6px}
.nb-row{display:flex;align-items:center;justify-content:space-between;gap:8px;background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:8px 12px;cursor:pointer;font-weight:800;flex-wrap:wrap}
.nb-row small{color:#64748b;font-weight:700}
.nb-h{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.nb-h b{font-size:18px}
.nb-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:8px}
.nb-kpi{background:#fff;border-radius:14px;padding:10px 12px;border-right:5px solid var(--c,#7c3aed);box-shadow:0 2px 8px rgba(0,0,0,.06)}
.nb-kpi b{display:block;font-size:22px;color:var(--c,#7c3aed)}
.nb-kpi small{font-weight:800;color:#64748b;font-size:12.5px}
.nb-tabs{display:flex;gap:6px;flex-wrap:wrap}
.nb-badge{display:inline-grid;place-items:center;min-width:20px;height:20px;border-radius:999px;background:#ef4444;color:#fff;font-size:11.5px;font-weight:900;padding:0 5px;margin-inline-start:3px}
.nb-bar{height:8px;border-radius:99px;background:#e2e8f0;overflow:hidden;min-width:60px}
.nb-bar i{display:block;height:100%;background:var(--c,#16a34a);border-radius:99px;transition:width .4s}
.nb-ring{--p:0;width:64px;height:64px;border-radius:50%;display:grid;place-items:center;background:conic-gradient(var(--c) calc(var(--p)*1%),#e2e8f0 0);flex:none}
.nb-ring>span{width:50px;height:50px;border-radius:50%;background:#fff;display:grid;place-items:center;font-weight:900;font-size:14px;color:var(--c)}
.nb-wbars{display:grid;grid-template-columns:repeat(15,1fr);gap:3px;align-items:end;height:40px}
.nb-wbars i{display:block;background:#eef2f7;border-radius:3px 3px 0 0;position:relative;height:100%;cursor:pointer}
.nb-wbars i b{position:absolute;bottom:0;left:0;right:0;background:var(--c);border-radius:3px 3px 0 0}
.nb-wbars i.full b{background:#16a34a}
.nb-tbl-w{overflow-x:auto;-webkit-overflow-scrolling:touch}
.nb-tbl{width:100%;border-collapse:collapse;font-size:13.5px;font-weight:700}
.nb-tbl th{background:#f1f5f9;padding:7px 6px;font-weight:900;white-space:nowrap;position:sticky;top:0}
.nb-tbl td{padding:7px 6px;border-bottom:1px solid #eef2f7;text-align:center;white-space:nowrap}
.nb-tbl td.r,.nb-tbl th.r{text-align:right}
.nb-tbl tr.click{cursor:pointer}
.nb-tbl tr.click:hover td{background:#f8fafc}
.nb-wkc{border:1px solid #e2e8f0;border-radius:12px;padding:8px 10px;background:#fff}
.nb-it{display:flex;align-items:center;gap:6px;flex-wrap:wrap;padding:5px 0;border-top:1px dashed #eef2f7;font-size:13.5px;font-weight:800}
.nb-it:first-of-type{border-top:0}
.nb-chk{border:1.5px solid #cbd5e1;background:#fff;border-radius:999px;padding:3px 9px;font:inherit;font-size:12.5px;font-weight:900;cursor:pointer;color:#475569}
.nb-chk.on{background:#16a34a;border-color:#16a34a;color:#fff}
.nb-chk:disabled{cursor:default}
.nb-tag{display:inline-block;border-radius:999px;padding:2px 9px;font-size:12px;font-weight:900;background:color-mix(in srgb,var(--c) 14%,#fff);color:var(--c)}
.nb-st{display:inline-block;border-radius:999px;padding:2px 8px;font-size:11.5px;font-weight:900}
.nb-alert{display:grid;gap:8px;background:#fff;border-radius:16px;padding:12px 14px;border-right:6px solid var(--c);box-shadow:0 4px 16px -10px rgba(0,0,0,.35)}
.nb-alert.new{background:linear-gradient(90deg,#fff,#fff7ed)}
.nb-opent{display:flex;gap:10px;align-items:center;flex-wrap:wrap;background:linear-gradient(135deg,var(--c),#0f172a);color:#fff;border-radius:16px;padding:12px 14px}
/* مفاتيح الإجابات */
.nb-keys{max-width:1100px;margin:8px auto 0;background:#fffbeb;border:2px solid #f59e0b;border-radius:14px;overflow:hidden;box-shadow:0 6px 18px -12px rgba(146,64,14,.5)}
.nb-keys .kh{display:flex;align-items:center;gap:8px;padding:6px 10px;cursor:pointer;background:#fef3c7;flex-wrap:wrap}
.nb-keys .kh b{font-size:14.5px;color:#92400e}
.nb-keys .ke{padding:10px 12px;font-weight:800;font-size:13px;color:#92400e}
.nb-keys .kg{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:6px;padding:8px;max-height:38vh;overflow:auto}
.nb-keys .ki{display:flex;gap:8px;align-items:flex-start;background:#fff;border:1px solid #fde68a;border-radius:10px;padding:6px 8px;transition:filter .2s}
.nb-keys .ki.blur{cursor:pointer}.nb-keys .ki.blur .ka{filter:blur(7px);user-select:none}
.nb-keys .kn{flex:none;min-width:26px;height:26px;border-radius:999px;background:#b45309;color:#fff;display:grid;place-items:center;font-weight:900;font-size:12.5px;padding:0 6px}
.nb-keys small{display:block;color:#a16207;font-weight:800;font-size:11.5px}
.nb-keys .ka{font-weight:800;font-size:14.5px;color:#1c1917;line-height:1.7}
.nb-keys .fr{display:inline-flex;flex-direction:column;vertical-align:middle;text-align:center;font-size:.85em;line-height:1.15;margin:0 2px}
.nb-keys .fr .nu{border-bottom:1.5px solid currentColor;padding:0 2px}.nb-keys .fr .de{padding:0 2px}
.nb-keys .sq .rad{border-top:1.5px solid currentColor;padding:0 1px}
.nb-keys .lat{direction:ltr;unicode-bidi:isolate}
.nb-keys mark{background:#fde68a}
/* الفهرس */
.nb-drawer-bg{position:fixed;inset:0;background:rgba(15,23,42,.45);z-index:2080}
.nb-drawer{position:fixed;top:0;bottom:0;right:0;width:min(440px,94vw);background:#f8fafc;z-index:2081;display:flex;flex-direction:column;box-shadow:-10px 0 30px rgba(0,0,0,.25);animation:nbIn .2s ease-out}
@keyframes nbIn{from{transform:translateX(100%)}to{transform:none}}
.nb-drawer header{display:flex;align-items:center;gap:8px;padding:10px 12px;background:#fff;border-bottom:3px solid var(--c)}
.nb-drawer .body{overflow:auto;padding:10px;display:grid;gap:8px;align-content:start;grid-auto-rows:max-content;flex:1;min-height:0}
.nb-wsec{background:#fff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden}
.nb-wsec>button{all:unset;cursor:pointer;display:flex;align-items:center;gap:8px;width:100%;padding:9px 12px;box-sizing:border-box;font-weight:900}
.nb-wsec.cur{border-color:var(--c);box-shadow:0 0 0 2px var(--c)}
.nb-ulink{all:unset;cursor:pointer;display:flex;gap:6px;align-items:center;padding:6px 12px;font-weight:800;font-size:13.5px;border-top:1px dashed #eef2f7;box-sizing:border-box;width:100%}
.nb-ulink:hover{background:#f8fafc}
.nb-thumbs{display:grid;grid-template-columns:repeat(auto-fill,minmax(74px,1fr));gap:6px;padding:8px 10px 10px}
.nb-th{all:unset;cursor:pointer;position:relative;border-radius:6px;overflow:hidden;background:#fff;box-shadow:0 0 0 1px #e2e8f0;aspect-ratio:210/297;display:block}
.nb-th img{width:100%;height:100%;object-fit:cover;display:block}
.nb-th span{position:absolute;bottom:0;left:0;right:0;background:rgba(15,23,42,.75);color:#fff;font-size:11px;font-weight:900;text-align:center}
.nb-th.cur{box-shadow:0 0 0 3px var(--c)}
.nb-th em{position:absolute;top:3px;left:3px;font-style:normal;background:#16a34a;color:#fff;border-radius:999px;font-size:10px;padding:0 5px;font-weight:900}
/* السبورة */
.bd{position:fixed;z-index:2070;background:#fff;border-radius:16px;box-shadow:0 24px 60px -18px rgba(0,0,0,.55),0 0 0 1px rgba(15,23,42,.08);display:flex;flex-direction:column;overflow:hidden;direction:rtl}
.bd.max{inset:0;border-radius:0}
.bd-h{display:flex;align-items:center;gap:6px;padding:6px 8px;background:linear-gradient(135deg,#0f172a,#1e3a8a);color:#fff;cursor:move;touch-action:none;user-select:none}
.bd-h input{flex:1;min-width:60px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.25);border-radius:8px;color:#fff;font:inherit;font-weight:900;font-size:13.5px;padding:4px 8px}
.bd-h button{all:unset;cursor:pointer;width:30px;height:28px;display:grid;place-items:center;border-radius:8px;font-size:15px;font-weight:900;background:rgba(255,255,255,.12)}
.bd-h button:hover{background:rgba(255,255,255,.25)}
.bd-tb{display:flex;gap:4px;padding:5px 6px;overflow-x:auto;background:#f1f5f9;border-bottom:1px solid #e2e8f0;align-items:center;scrollbar-width:thin}
.bd-tb button,.bd-tb select{flex:none;border:1px solid #cbd5e1;background:#fff;border-radius:9px;min-width:34px;height:32px;padding:0 7px;font:inherit;font-size:14px;font-weight:900;cursor:pointer;color:#0f172a}
.bd-tb button.on{background:#1e3a8a;color:#fff;border-color:#1e3a8a}
.bd-tb button:disabled{opacity:.35}
.bd-tb .c{width:24px;height:24px;min-width:24px;border-radius:50%;padding:0;border:3px solid #fff;box-shadow:0 0 0 1px #94a3b8}
.bd-tb .c.on{box-shadow:0 0 0 3px #0f172a}
.bd-tb .sep{width:1px;height:24px;background:#cbd5e1;flex:none}
.bd-math{display:flex;flex-wrap:wrap;gap:4px;padding:5px 6px;background:#eef2ff;border-bottom:1px solid #c7d2fe}
.bd-math button{border:1px solid #c7d2fe;background:#fff;border-radius:8px;min-width:34px;height:30px;font:inherit;font-size:16px;font-weight:800;cursor:pointer;color:#1e1b4b;padding:0 6px;direction:ltr}
.bd-math small{align-self:center;font-size:11.5px;font-weight:800;color:#4338ca}
.bd-cv{position:relative;flex:1;display:grid;place-items:center;background:#e2e8f0;overflow:hidden;min-height:0}
.bd-cv canvas{display:block;touch-action:none;box-shadow:0 0 0 1px rgba(0,0,0,.08)}
.bd-cv textarea{position:absolute;border:2px dashed #2563eb;background:rgba(255,255,255,.85);outline:none;font-weight:800;resize:none;padding:2px 4px;line-height:1.25;min-width:120px;font-family:inherit;z-index:3}
.bd-rs{position:absolute;left:0;bottom:0;width:22px;height:22px;cursor:nesw-resize;touch-action:none;background:linear-gradient(225deg,transparent 50%,#1e3a8a 50%);opacity:.8;z-index:4}
.bd-min{position:fixed;z-index:2070;border-radius:999px;background:linear-gradient(135deg,#1e3a8a,#0f766e);color:#fff;font-weight:900;padding:10px 16px;box-shadow:0 12px 26px -10px rgba(0,0,0,.6);cursor:grab;touch-action:none;user-select:none;border:2px solid #fbbf24;font-size:14px}
.bd-ft{display:flex;gap:6px;padding:5px 8px;align-items:center;background:#fff;border-top:1px solid #e2e8f0;font-size:12px;font-weight:800;color:#64748b;flex-wrap:wrap}
.nb-conf{position:fixed;inset:0;pointer-events:none;z-index:2200;overflow:hidden}
.nb-conf i{position:absolute;top:-20px;width:10px;height:14px;border-radius:2px;animation:nbFall 2.6s ease-in forwards}
@keyframes nbFall{to{top:105vh;transform:rotate(720deg)}}
@media (max-width:560px){.nb-top b{font-size:13.5px}.nb-tbl{font-size:12.5px}.nb-hide-s{display:none!important}.nb-keys .kg{grid-template-columns:repeat(auto-fill,minmax(140px,1fr));max-height:30vh;padding:6px;gap:5px}.nb-keys .ki{padding:4px 6px}.nb-keys .ka{font-size:13.5px}}
@media print{.nb-top,.nb-tools,.nb-nav,.nb-save,.nb-ribbon,.nb-scrub{display:none!important}}
`;

// ══════════════════════ 🧑‍🏫 السبورة الذكية ══════════════════════
// لوحة عائمة: تُسحب وتُكبَّر وتُصغَّر إلى أيقونة، فيها أشكال ورموز رياضية وقوالب (مربعات/مستوى إحداثي/خط أعداد)
// وتُحفظ ملاحظةً مثبّتة على الصفحة وتُستعاد بضغطة
const BW = 1000, BH = 625;
const BD_BG = { grid: "▦ مربعات", plain: "⬜ بيضاء", lines: "☰ مسطّرة", axes: "✛ مستوى إحداثي", numline: "↔ خط الأعداد", chalk: "🟩 سبورة خضراء", dark: "⬛ سبورة سوداء" };
const BD_DARK = b => b === "chalk" || b === "dark";
const BD_COL = ["#111827", "#1d4ed8", "#dc2626", "#16a34a", "#ea580c", "#7c3aed", "#ffffff"];
const BD_W = [3, 6, 11], BD_FS = [26, 36, 50];
const BD_TOOLS = [["pen", "✏️", "قلم"], ["hl", "🖍️", "تظليل"], ["line", "╱", "خط مستقيم"], ["arrow", "➚", "سهم"], ["rect", "▭", "مستطيل"], ["ell", "◯", "دائرة"], ["text", "T", "نص ومعادلة"], ["move", "✥", "تحريك"], ["erase", "🧽", "ممحاة"], ["laser", "🔴", "مؤشر ليزر (لا يُحفظ)"]];
const MATH = ["√", "∛", "π", "²", "³", "ⁿ", "⁻¹", "×", "÷", "±", "=", "≠", "≈", "≤", "≥", "<", ">", "∞", "°", "∠", "△", "⊥", "∥", "½", "¼", "¾", "%", "→", "⇐", "∴", "Δ", "θ", "( )", "| |", "س", "ص"];
const SUP = { 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹", "-": "⁻", "+": "⁺", n: "ⁿ" };
// كتابة سريعة للمعادلات: x^2 → x² • x_1 → x₁ • sqrt → √ • pi → π • <= → ≤ • != → ≠ • +- → ±
const mathify = s => String(s || "")
  .replace(/\^\(?([-+]?[0-9n]+)\)?/g, (m, g) => [...g].map(c => SUP[c] || c).join(""))
  .replace(/_([0-9]+)/g, (m, g) => [...g].map(c => "₀₁₂₃₄₅₆₇₈₉"[c]).join(""))
  .replace(/sqrt/gi, "√").replace(/\bpi\b/gi, "π").replace(/<=/g, "≤").replace(/>=/g, "≥").replace(/!=/g, "≠").replace(/\+-/g, "±").replace(/(\d)\s*\*\s*(\d)/g, "$1×$2");
const benc = s => ({ k: s.k, c: s.c, w: s.w, p: s.p.map(q => Math.round(q[0]) + "," + Math.round(q[1])).join(";") });
const bdec = s => ({ ...s, p: String(s.p || "").split(";").filter(Boolean).map(x => x.split(",").map(Number)) });
const isAr = t => /[؀-ۿ]/.test(t);
const bdEmpty = d => !d || (!arr(d.s).length && !arr(d.t).length);

function bdDrawBg(g, bg) {
  g.fillStyle = bg === "chalk" ? "#1f3d2b" : bg === "dark" ? "#111827" : "#ffffff"; g.fillRect(0, 0, BW, BH);
  const L = (a, b, c, d) => { g.beginPath(); g.moveTo(a, b); g.lineTo(c, d); g.stroke(); };
  g.globalAlpha = 1;
  if (bg === "grid" || bg === "axes") { g.strokeStyle = "#dbe4ee"; g.lineWidth = 1; for (let x = 0; x <= BW; x += 25) L(x, 0, x, BH); for (let y = 0; y <= BH; y += 25) L(0, y, BW, y); }
  if (bg === "chalk" || bg === "dark") { g.strokeStyle = "rgba(255,255,255,.06)"; g.lineWidth = 1; for (let x = 0; x <= BW; x += 50) L(x, 0, x, BH); for (let y = 0; y <= BH; y += 50) L(0, y, BW, y); }
  if (bg === "lines") { g.strokeStyle = "#c7d7ea"; g.lineWidth = 1.2; for (let y = 70; y < BH; y += 46) L(0, y, BW, y); g.strokeStyle = "#fca5a5"; L(BW - 60, 0, BW - 60, BH); }
  g.font = "700 15px Tahoma, sans-serif"; g.direction = "ltr";
  if (bg === "axes") {
    const cx = 500, cy = 300, u = 50; g.strokeStyle = "#334155"; g.fillStyle = "#334155"; g.lineWidth = 2.2; L(8, cy, BW - 8, cy); L(cx, BH - 8, cx, 8);
    const head = (x, y, a) => { g.beginPath(); g.moveTo(x, y); g.lineTo(x - 12 * Math.cos(a - .4), y - 12 * Math.sin(a - .4)); g.lineTo(x - 12 * Math.cos(a + .4), y - 12 * Math.sin(a + .4)); g.closePath(); g.fill(); };
    head(BW - 6, cy, 0); head(cx, 6, -Math.PI / 2);
    g.lineWidth = 1.6; g.textAlign = "center"; g.textBaseline = "top";
    for (let i = -9; i <= 9; i++) { if (!i) continue; const x = cx + i * u; L(x, cy - 5, x, cy + 5); g.fillText(String(i), x, cy + 8); }
    g.textAlign = "right"; g.textBaseline = "middle";
    for (let j = -5; j <= 5; j++) { if (!j) continue; const y = cy - j * u; L(cx - 5, y, cx + 5, y); g.fillText(String(j), cx - 9, y); }
    g.font = "800 20px Tahoma, sans-serif"; g.textAlign = "center"; g.fillText("س", BW - 22, cy - 18); g.fillText("ص", cx + 20, 18); g.fillText("0", cx - 12, cy + 14);
  }
  if (bg === "numline") {
    const cy = BH / 2, x0 = 50, x1 = BW - 50, n = 20, d = (x1 - x0) / n; g.strokeStyle = "#334155"; g.fillStyle = "#334155"; g.lineWidth = 2.4; L(x0 - 30, cy, x1 + 30, cy);
    [[x1 + 34, 0], [x0 - 34, Math.PI]].forEach(([x, a]) => { g.beginPath(); g.moveTo(x, cy); g.lineTo(x - 13 * Math.cos(a - .45), cy - 13 * Math.sin(a - .45)); g.lineTo(x - 13 * Math.cos(a + .45), cy - 13 * Math.sin(a + .45)); g.closePath(); g.fill(); });
    g.textAlign = "center"; g.textBaseline = "top"; g.lineWidth = 2;
    for (let i = 0; i <= n; i++) { const x = x0 + i * d, v = i - 10; L(x, cy - (v ? 9 : 14), x, cy + (v ? 9 : 14)); g.font = v ? "700 16px Tahoma" : "900 18px Tahoma"; g.fillText(String(v), x, cy + 16); }
  }
}
const bdSample = s => { const p = s.p; if (s.k === "pen" || s.k === "hl") return p; const [a, b] = [p[0], p[p.length - 1]]; const out = [];
  if (s.k === "line" || s.k === "arrow") for (let i = 0; i <= 20; i++) out.push([a[0] + (b[0] - a[0]) * i / 20, a[1] + (b[1] - a[1]) * i / 20]);
  if (s.k === "rect") [[a[0], a[1], b[0], a[1]], [b[0], a[1], b[0], b[1]], [b[0], b[1], a[0], b[1]], [a[0], b[1], a[0], a[1]]].forEach(([x1, y1, x2, y2]) => { for (let i = 0; i <= 12; i++) out.push([x1 + (x2 - x1) * i / 12, y1 + (y2 - y1) * i / 12]); });
  if (s.k === "ell") { const cx = (a[0] + b[0]) / 2, cy = (a[1] + b[1]) / 2, rx = Math.abs(b[0] - a[0]) / 2, ry = Math.abs(b[1] - a[1]) / 2; for (let i = 0; i < 40; i++) out.push([cx + rx * Math.cos(i / 40 * 2 * Math.PI), cy + ry * Math.sin(i / 40 * 2 * Math.PI)]); }
  return out; };
function bdStroke(g, s) {
  const p = s.p; if (!p || !p.length) return;
  g.strokeStyle = s.c; g.fillStyle = s.c; g.lineWidth = s.w; g.globalAlpha = s.k === "hl" ? .35 : 1; g.lineCap = "round"; g.lineJoin = "round";
  if (s.k === "pen" || s.k === "hl") { g.beginPath(); p.forEach((q, i) => i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])); if (p.length === 1) g.lineTo(p[0][0] + .1, p[0][1]); g.stroke(); }
  else { const a = p[0], b = p[p.length - 1];
    if (s.k === "line" || s.k === "arrow") { g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke();
      if (s.k === "arrow") { const t = Math.atan2(b[1] - a[1], b[0] - a[0]), h = Math.max(16, s.w * 3.6); g.beginPath(); g.moveTo(b[0], b[1]); g.lineTo(b[0] - h * Math.cos(t - .45), b[1] - h * Math.sin(t - .45)); g.lineTo(b[0] - h * Math.cos(t + .45), b[1] - h * Math.sin(t + .45)); g.closePath(); g.fill(); } }
    if (s.k === "rect") g.strokeRect(Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1]));
    if (s.k === "ell") { g.beginPath(); g.ellipse((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, Math.abs(b[0] - a[0]) / 2 || .5, Math.abs(b[1] - a[1]) / 2 || .5, 0, 0, 2 * Math.PI); g.stroke(); } }
  g.globalAlpha = 1;
}
function bdText(g, t, bb) {
  const fs = t.z || 36; g.font = `800 ${fs}px Tajawal, "Noto Naskh Arabic", Tahoma, sans-serif`; g.fillStyle = t.c; g.textBaseline = "top";
  const rtl = isAr(t.v); g.direction = rtl ? "rtl" : "ltr"; g.textAlign = rtl ? "right" : "left";
  const lines = String(t.v).split("\n"); let w = 0; lines.forEach((ln, i) => { g.fillText(ln, t.x, t.y + i * fs * 1.25); w = Math.max(w, g.measureText(ln).width); });
  const h = lines.length * fs * 1.25; if (bb) bb[t.id] = rtl ? { x0: t.x - w, x1: t.x, y0: t.y, y1: t.y + h } : { x0: t.x, x1: t.x + w, y0: t.y, y1: t.y + h };
}
function bdRender(g, d, skipId) { bdDrawBg(g, d.bg); arr(d.s).forEach(s => bdStroke(g, s)); const bb = {}; arr(d.t).forEach(t => { if (t.id !== skipId) bdText(g, t, bb); }); return bb; }

function Board({ init, readOnly, canSave, onSave, onClose, onDelete, label }) {
  const W0 = window.innerWidth, H0 = window.innerHeight, small = W0 < 640;
  const [s, setS] = useState(() => arr(init && init.s).map(bdec));
  const [t, setT] = useState(() => arr(init && init.t));
  const [bg, setBg] = useState((init && init.bg) || "grid");
  const [name, setName] = useState((init && init.n) || "سبورة");
  const [tool, setTool] = useState("pen");
  const [color, setColor] = useState(BD_DARK(init && init.bg) ? "#ffffff" : "#1d4ed8");
  const [size, setSize] = useState(1);
  const [mode, setMode] = useState("float");
  const [pos, setPos] = useState(() => { const w = small ? W0 - 12 : Math.min(780, W0 - 60); return { x: small ? 6 : Math.max(10, W0 - w - 28), y: small ? 64 : 84, w }; });
  const [edit, setEdit] = useState(null);
  const [mathOn, setMathOn] = useState(false);
  const [dirty, setDirty] = useState(0);
  const [cw, setCw] = useState(600);
  const [st, setSt] = useState("");
  const [, force] = useState(0);
  const cvRef = useRef(null), wrapRef = useRef(null), taRef = useRef(null);
  const hist = useRef([]), redo = useRef([]), cur = useRef(null), drag = useRef(null), pdrag = useRef(null), laser = useRef([]), bbox = useRef({}), raf = useRef(0), saveT = useRef(null);
  const sRef = useRef(s), tRef = useRef(t); sRef.current = s; tRef.current = t;
  const payload = () => ({ n: name.trim() || "سبورة", bg, s: sRef.current.map(benc), t: tRef.current, at: Date.now() });

  // مقاس اللوحة حسب حجم النافذة
  useEffect(() => { const el = wrapRef.current; if (!el) return; const f = () => { const r = el.getBoundingClientRect(); setCw(Math.max(220, Math.floor(Math.min(r.width - 10, (r.height - 10) * BW / BH)))); };
    f(); const ro = new ResizeObserver(f); ro.observe(el); return () => ro.disconnect(); }, [mode]);
  const paint = useCallback(() => {
    const c = cvRef.current; if (!c) return; const dpr = Math.min(window.devicePixelRatio || 1, 2.5), ch = cw * BH / BW;
    if (c.width !== Math.round(cw * dpr)) { c.width = Math.round(cw * dpr); c.height = Math.round(ch * dpr); }
    c.style.width = cw + "px"; c.style.height = ch + "px";
    const g = c.getContext("2d"); g.setTransform(dpr * cw / BW, 0, 0, dpr * cw / BW, 0, 0);
    bbox.current = bdRender(g, { bg, s: cur.current ? [...sRef.current, cur.current] : sRef.current, t: tRef.current }, edit && edit.id);
    const now = performance.now(); laser.current = laser.current.filter(q => now - q[2] < 900);
    if (laser.current.length > 1) { g.lineCap = "round"; for (let i = 1; i < laser.current.length; i++) { const a = laser.current[i - 1], b = laser.current[i]; g.globalAlpha = Math.max(0, 1 - (now - b[2]) / 900); g.strokeStyle = "#ef4444"; g.shadowColor = "#ef4444"; g.shadowBlur = 12; g.lineWidth = 9; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); } g.globalAlpha = 1; g.shadowBlur = 0; }
  }, [cw, bg, edit, s, t]);
  useEffect(() => { paint(); }, [paint]);
  const loop = () => { cancelAnimationFrame(raf.current); const f = () => { paint(); if (laser.current.length) raf.current = requestAnimationFrame(f); }; raf.current = requestAnimationFrame(f); };
  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  // حفظ تلقائي
  useEffect(() => { if (!dirty || !canSave) return; setSt("جارٍ الحفظ…"); clearTimeout(saveT.current); saveT.current = setTimeout(() => { onSave && onSave(payload()); setSt("محفوظة ✓"); }, 900); return () => clearTimeout(saveT.current); }, [dirty]);
  const close = () => { clearTimeout(saveT.current); if (edit) commitText(); onClose && onClose(readOnly ? null : payload(), !!dirty); };

  const P = e => { const r = cvRef.current.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * BW, (e.clientY - r.top) / r.height * BH]; };
  const snap = () => { hist.current.push({ s: sRef.current, t: tRef.current }); if (hist.current.length > 80) hist.current.shift(); redo.current = []; };
  const bump = () => setDirty(d => d + 1);
  const hitText = p => Object.entries(bbox.current).find(([, b]) => p[0] >= b.x0 - 8 && p[0] <= b.x1 + 8 && p[1] >= b.y0 - 6 && p[1] <= b.y1 + 6)?.[0];
  const hitStroke = p => { for (let i = sRef.current.length - 1; i >= 0; i--) { const x = sRef.current[i]; const R = Math.max(14, x.w); if (bdSample(x).some(q => Math.hypot(q[0] - p[0], q[1] - p[1]) < R)) return i; } return -1; };
  const eraseAt = p => { const i = hitStroke(p); if (i >= 0) { const n = sRef.current.filter((_, j) => j !== i); sRef.current = n; setS(n); drag.current.hit = true; return; } const id = hitText(p); if (id) { const n = tRef.current.filter(x => x.id !== id); tRef.current = n; setT(n); drag.current.hit = true; } };

  const down = e => {
    if (readOnly) return; e.preventDefault(); try { cvRef.current.setPointerCapture(e.pointerId); } catch {}
    const p = P(e);
    if (tool === "text") { if (edit) { commitText(); return; } const id = hitText(p); const x = id && tRef.current.find(q => q.id === id);
      setEdit(x ? { ...x } : { id: "x" + Date.now().toString(36), x: p[0], y: Math.max(0, p[1] - BD_FS[size] * .6), v: "", c: color, z: BD_FS[size] }); return; }
    if (tool === "laser") { laser.current.push([...p, performance.now()]); drag.current = { laser: 1 }; loop(); return; }
    if (tool === "erase") { snap(); drag.current = { erase: 1, hit: false }; eraseAt(p); return; }
    if (tool === "move") { const id = hitText(p); if (id) { snap(); drag.current = { mv: "t", id, last: p }; return; } const i = hitStroke(p); if (i >= 0) { snap(); drag.current = { mv: "s", i, last: p }; } return; }
    cur.current = { k: tool, c: tool === "hl" ? (color === "#ffffff" || color === "#111827" ? "#facc15" : color) : color, w: tool === "hl" ? BD_W[size] * 4 : BD_W[size], p: [p] }; drag.current = { draw: 1 }; paint();
  };
  const move = e => {
    const D = drag.current; if (!D) return; const p = P(e);
    if (D.laser) { laser.current.push([...p, performance.now()]); return; }
    if (D.erase) { eraseAt(p); return; }
    if (D.mv) { const dx = p[0] - D.last[0], dy = p[1] - D.last[1]; D.last = p;
      if (D.mv === "t") { const n = tRef.current.map(x => x.id === D.id ? { ...x, x: x.x + dx, y: x.y + dy } : x); tRef.current = n; setT(n); }
      else { const n = sRef.current.map((x, j) => j === D.i ? { ...x, p: x.p.map(q => [q[0] + dx, q[1] + dy]) } : x); sRef.current = n; setS(n); } return; }
    if (D.draw && cur.current) { const c = cur.current; if (c.k === "pen" || c.k === "hl") { const l = c.p[c.p.length - 1]; if (Math.hypot(p[0] - l[0], p[1] - l[1]) > 1.6) c.p.push(p); } else c.p = [c.p[0], p]; paint(); }
  };
  const up = () => {
    const D = drag.current; drag.current = null; if (!D) return;
    if (D.erase) { if (D.hit) bump(); else hist.current.pop(); return; }
    if (D.mv) { bump(); return; }
    if (D.draw && cur.current) { const c = cur.current; cur.current = null; const a = c.p[0], b = c.p[c.p.length - 1];
      if (c.k !== "pen" && c.k !== "hl" && Math.hypot(b[0] - a[0], b[1] - a[1]) < 5) { paint(); return; }
      snap(); const n = [...sRef.current, c]; sRef.current = n; setS(n); bump(); }
  };
  function commitText() {
    const E = edit; if (!E) return; setEdit(null); const v = mathify(E.v).replace(/\s+$/, ""); const ex = tRef.current.some(x => x.id === E.id);
    const old = tRef.current.find(x => x.id === E.id); if (ex && old.v === v) return; if (!ex && !v) return;
    snap(); const n = !v ? tRef.current.filter(x => x.id !== E.id) : ex ? tRef.current.map(x => x.id === E.id ? { ...x, v } : x) : [...tRef.current, { id: E.id, x: E.x, y: E.y, v, c: E.c, z: E.z }];
    tRef.current = n; setT(n); bump();
  }
  const insert = sym => {
    const ins = sym === "( )" ? "()" : sym === "| |" ? "||" : sym; const back = ins.length === 2 && /[(|]/.test(ins[0]) ? 1 : 0;
    if (!edit) { setTool("text"); setEdit({ id: "x" + Date.now().toString(36), x: 60, y: 40 + (tRef.current.length % 10) * 52, v: ins, c: color, z: BD_FS[size] }); setTimeout(() => { const a = taRef.current; if (a) { a.focus(); a.selectionStart = a.selectionEnd = ins.length - back; } }, 30); return; }
    const a = taRef.current; const v = edit.v; const i = a ? a.selectionStart : v.length, j = a ? a.selectionEnd : v.length;
    setEdit({ ...edit, v: v.slice(0, i) + ins + v.slice(j) }); setTimeout(() => { if (a) { a.focus(); a.selectionStart = a.selectionEnd = i + ins.length - back; } }, 20);
  };
  const undo = () => { const h = hist.current.pop(); if (!h) return; redo.current.push({ s: sRef.current, t: tRef.current }); setS(h.s); setT(h.t); bump(); };
  const redoF = () => { const h = redo.current.pop(); if (!h) return; hist.current.push({ s: sRef.current, t: tRef.current }); setS(h.s); setT(h.t); bump(); };
  const clear = () => { if ((!s.length && !t.length) || !window.confirm("مسح كل ما في السبورة؟")) return; snap(); setS([]); setT([]); bump(); };
  useEffect(() => { const k = e => { if (/INPUT|TEXTAREA/.test(e.target.tagName)) return; if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") { e.preventDefault(); e.shiftKey ? redoF() : undo(); } if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") { e.preventDefault(); redoF(); } }; window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); });
  const setBgX = b => { setBg(b); if (BD_DARK(b) && (color === "#111827" || color === "#1d4ed8")) setColor("#ffffff"); if (!BD_DARK(b) && color === "#ffffff") setColor("#1d4ed8"); bump(); };

  // صورة للمشاركة (واتساب…)
  const exportPng = async () => {
    if (edit) commitText(); const c = document.createElement("canvas"); c.width = BW * 2; c.height = BH * 2; const g = c.getContext("2d"); g.scale(2, 2);
    bdRender(g, { bg, s: sRef.current, t: tRef.current }); g.font = "700 14px Tahoma"; g.fillStyle = BD_DARK(bg) ? "rgba(255,255,255,.5)" : "rgba(15,23,42,.45)"; g.direction = "rtl"; g.textAlign = "right"; g.fillText(`${name}${label ? " • " + label : ""}`, BW - 12, BH - 22);
    const blob = await new Promise(r => c.toBlob(r, "image/png")); const fn = `${(name || "سبورة").replace(/[\\/:*?"<>|]/g, "")}.png`;
    try { const f = new File([blob], fn, { type: "image/png" }); if (navigator.canShare && navigator.canShare({ files: [f] })) { await navigator.share({ files: [f], title: name }); return; } } catch {}
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = fn; a.click();
  };

  // سحب اللوحة وتغيير حجمها
  const clampPos = (x, y, w) => ({ x: Math.min(Math.max(-w + 80, x), window.innerWidth - 80), y: Math.min(Math.max(0, y), window.innerHeight - 50), w });
  const hDown = e => { if (/INPUT|BUTTON|SELECT/.test(e.target.tagName) || mode === "max") return; pdrag.current = { k: "mv", sx: e.clientX, sy: e.clientY, ...pos, moved: 0 }; try { e.currentTarget.setPointerCapture(e.pointerId); } catch {} };
  const rDown = e => { e.stopPropagation(); pdrag.current = { k: "rs", sx: e.clientX, ...pos }; try { e.currentTarget.setPointerCapture(e.pointerId); } catch {} };
  const pMove = e => { const D = pdrag.current; if (!D) return; const dx = e.clientX - D.sx, dy = e.clientY - (D.sy || 0); if (Math.abs(dx) + Math.abs(dy) > 4) D.moved = 1;
    if (D.k === "mv") setPos(clampPos(D.x + dx, D.y + dy, D.w));
    if (D.k === "rs") { const w = Math.min(window.innerWidth - 8, Math.max(300, D.w - dx)); setPos({ x: D.x + (D.w - w), y: D.y, w }); } };
  const pUp = () => { const D = pdrag.current; pdrag.current = null; return D; };

  if (mode === "min") return <div className="bd-min" style={{ left: Math.min(pos.x + pos.w - 160, window.innerWidth - 170), top: pos.y }} onPointerDown={e => { pdrag.current = { k: "mv", sx: e.clientX, sy: e.clientY, ...pos, moved: 0 }; try { e.currentTarget.setPointerCapture(e.pointerId); } catch {} }}
    onPointerMove={pMove} onPointerUp={() => { const D = pUp(); if (!D || !D.moved) setMode("float"); }} title="اضغط لفتح السبورة">🧑‍🏫 {name}{st === "محفوظة ✓" ? " ✓" : ""}</div>;

  const dark = BD_DARK(bg); const COLS = dark ? BD_COL.filter(c => c !== "#111827") : BD_COL.filter(c => c !== "#ffffff");
  const ch = cw * BH / BW; const cvOff = cvRef.current ? { l: cvRef.current.offsetLeft, t: cvRef.current.offsetTop } : { l: 0, t: 0 }; const k = cw / BW;
  return <div className={"bd" + (mode === "max" ? " max" : "")} style={mode === "max" ? null : { left: pos.x, top: pos.y, width: pos.w }} dir="rtl" onPointerMove={pMove} onPointerUp={pUp}>
    <div className="bd-h" onPointerDown={hDown}>
      <span style={{ fontSize: 18 }}>🧑‍🏫</span>
      <input value={name} onChange={e => { setName(e.target.value); bump(); }} disabled={readOnly} aria-label="اسم السبورة" />
      {label && <small className="nb-hide-s" style={{ opacity: .8, fontWeight: 800, whiteSpace: "nowrap" }}>{label}</small>}
      <button title="تصغير إلى أيقونة" onClick={() => setMode("min")}>—</button>
      <button title={mode === "max" ? "حجم عادي" : "ملء الشاشة (للعرض)"} onClick={() => setMode(m => m === "max" ? "float" : "max")}>{mode === "max" ? "🗗" : "⛶"}</button>
      <button title="حفظ وإغلاق" onClick={close}>✕</button>
    </div>
    {!readOnly && <div className="bd-tb">
      {BD_TOOLS.map(([k2, ic, l]) => <button key={k2} className={tool === k2 ? "on" : ""} title={l} aria-label={l} onClick={() => { if (edit) commitText(); setTool(k2); if (k2 === "text") setMathOn(true); }}>{ic}</button>)}
      <span className="sep" />
      {COLS.map(c => <button key={c} className={"c" + (color === c ? " on" : "")} style={{ background: c }} title="لون" onClick={() => { setColor(c); if (["erase", "move", "laser"].includes(tool)) setTool("pen"); }} />)}
      <span className="sep" />
      {BD_W.map((w, i) => <button key={i} className={size === i ? "on" : ""} title="السُّمك والحجم" onClick={() => setSize(i)}><span style={{ display: "inline-block", width: 4 + i * 5, height: 4 + i * 5, borderRadius: 9, background: "currentColor" }} /></button>)}
      <span className="sep" />
      <button onClick={undo} disabled={!hist.current.length} title="تراجع (Ctrl+Z)">↶</button>
      <button onClick={redoF} disabled={!redo.current.length} title="إعادة">↷</button>
      <button onClick={clear} title="مسح السبورة">🗑️</button>
      <span className="sep" />
      <select value={bg} onChange={e => setBgX(e.target.value)} title="خلفية السبورة">{Object.entries(BD_BG).map(([k2, l]) => <option key={k2} value={k2}>{l}</option>)}</select>
      <button className={mathOn ? "on" : ""} onClick={() => setMathOn(m => !m)} title="رموز رياضية">∑ رموز</button>
    </div>}
    {!readOnly && mathOn && <div className="bd-math">
      {MATH.map(m => <button key={m} onPointerDown={e => e.preventDefault()} onClick={() => insert(m)}>{m}</button>)}
      <small>اكتب x^2 ← x² ، x_1 ← x₁ ، sqrt ← √ ، &lt;= ← ≤</small>
    </div>}
    <div className="bd-cv" ref={wrapRef} style={mode === "max" ? null : { height: Math.round((pos.w - 10) * BH / BW) + 10, flex: "none" }}>
      <canvas ref={cvRef} style={{ cursor: readOnly ? "default" : tool === "text" ? "text" : tool === "move" ? "move" : tool === "laser" ? "pointer" : "crosshair" }} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} />
      {edit && (() => { const rtl = isAr(edit.v); const X = cvOff.l + edit.x * k, Y = cvOff.t + edit.y * k; const fs = Math.max(13, edit.z * k);
        return <textarea ref={taRef} autoFocus dir="auto" value={edit.v} rows={Math.max(1, edit.v.split("\n").length)} placeholder="اكتب… (Enter للإنهاء)"
          style={{ top: Y, fontSize: fs, color: edit.c === "#ffffff" ? "#111827" : edit.c, ...(rtl ? { right: Math.max(0, (wrapRef.current ? wrapRef.current.clientWidth : cw) - X) } : { left: X }), width: Math.min(cw * .9, Math.max(160, (edit.v.split("\n").reduce((m, l) => Math.max(m, l.length), 0) + 3) * fs * .62)) }}
          onChange={e => setEdit({ ...edit, v: e.target.value })} onBlur={() => setTimeout(() => { if (document.activeElement !== taRef.current) commitText(); }, 120)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); commitText(); } if (e.key === "Escape") setEdit(null); }} />; })()}
      {mode !== "max" && <div className="bd-rs" onPointerDown={rDown} title="اسحب لتغيير الحجم" />}
    </div>
    <div className="bd-ft">
      <span>{readOnly ? "👁️ للاطّلاع" : canSave ? (st || "تُحفظ تلقائيًا في هذه الصفحة") : "وضع العرض — لا تُحفظ"}</span>
      <span className="nb-sp" />
      <button className="nb-b" onClick={exportPng} title="حفظ صورة أو مشاركتها">📷 صورة</button>
      {onDelete && !readOnly && <button className="nb-b" style={{ color: "#b91c1c" }} onClick={onDelete}>🗑️ حذف</button>}
      <button className="nb-b on" style={{ "--c": "#1e3a8a" }} onClick={close}>{readOnly ? "إغلاق" : "💾 حفظ وإغلاق"}</button>
    </div>
  </div>;
}

// ══════════════════════ 📑 الفهرس: الأسابيع والدروس وصور مصغّرة للصفحات ══════════════════════
const thumbCache = {};
function Thumb({ doc, book, p, cur, mark, onGo }) {
  const ref = useRef(null); const [src, setSrc] = useState(thumbCache[book + p] || "");
  useEffect(() => { if (src || !doc || !ref.current) return; let ok = true;
    const io = new IntersectionObserver(async es => { if (!es[0].isIntersecting) return; io.disconnect();
      try { const pg = await doc.getPage(p); const v = pg.getViewport({ scale: 1 }); const vp = pg.getViewport({ scale: 150 / v.width }); const c = document.createElement("canvas"); c.width = vp.width; c.height = vp.height;
        await pg.render({ canvasContext: c.getContext("2d"), viewport: vp }).promise; const u = c.toDataURL("image/jpeg", .7); thumbCache[book + p] = u; if (ok) setSrc(u); } catch {} }, { rootMargin: "200px" });
    io.observe(ref.current); return () => { ok = false; io.disconnect(); }; }, [doc, p]);
  return <button ref={ref} className={"nb-th" + (cur ? " cur" : "")} onClick={() => onGo(p)} aria-label={`صفحة ${p}`}>{src ? <img src={src} alt="" /> : null}{mark && <em>{mark}</em>}<span>{ar(p)}</span></button>;
}
function IndexDrawer({ book, doc, page, onGo, onClose, mark, weekP, weekLbl }) {
  const B = BOOKS[book]; const curW = Math.max(0, weekOfPage(book, page)); const [openW, setOpenW] = useState(curW);
  const body = useRef(null);
  useEffect(() => { const el = body.current && body.current.querySelector(".nb-wsec.cur"); if (el) el.scrollIntoView({ block: "start" }); }, []);
  return <>
    <div className="nb-drawer-bg" onClick={onClose} />
    <div className="nb-drawer" style={{ "--c": B.c }} role="dialog" aria-label="فهرس المرجع">
      <header><b style={{ fontSize: 16, color: B.c }}>📑 فهرس {B.name}</b><span className="nb-sp" /><button className="nb-b" onClick={() => onGo(1)}>الغلاف</button><button className="nb-b" onClick={onClose}>✕</button></header>
      <div className="body" ref={body}>
        {Array.from({ length: 15 }, (_, w) => { const wp = weekP ? weekP(w) : null; const P = range(B.units[w * 2], w < 14 ? B.units[w * 2 + 2] - 1 : B.pages);
          return <div key={w} className={"nb-wsec" + (w === curW ? " cur" : "")}>
            <button onClick={() => setOpenW(openW === w ? -1 : w)}>
              <span style={{ color: B.c }}>الأسبوع {ar(w + 1)}</span>
              {wp != null && <><div className="nb-bar" style={{ "--c": wp === 100 ? "#16a34a" : B.c, flex: 1 }}><i style={{ width: wp + "%" }} /></div><small style={{ fontWeight: 900, color: wp === 100 ? "#16a34a" : "#64748b" }}>{wp === 100 ? "✅" : ar(wp) + "٪"}</small></>}
              {wp == null && <span className="nb-sp" />}
              <small style={{ color: "#94a3b8" }}>{openW === w ? "▲" : "▼"}</small>
            </button>
            {openW === w && <>
              {[[B.units[w * 2], B.titles[w * 2], "📘"], [B.units[w * 2 + 1], B.titles[w * 2 + 1], "📘"], [B.tests[w], `اختبار الأسبوع ${ar(w + 1)}`, "📝"]].map(([pg, l, ic]) =>
                <button key={pg} className="nb-ulink" onClick={() => onGo(pg)}><span>{ic}</span><span style={{ flex: 1 }}>{l}</span><small style={{ color: "#64748b" }}>ص {ar(pg)}</small></button>)}
              {weekLbl && <div style={{ padding: "2px 12px", fontSize: 12, fontWeight: 800, color: "#64748b" }}>{weekLbl(w)}</div>}
              <div className="nb-thumbs">{P.map(p => <Thumb key={p} doc={doc} book={book} p={p} cur={p === page} mark={mark && mark(p)} onGo={onGo} />)}</div>
            </>}
          </div>; })}
      </div>
    </div>
  </>;
}

// ══════════════════════ 🔑 إجابات الصفحة للمعلم ══════════════════════
// المفاتيح في ملف مستقل يُحمَّل عند الحاجة فقط في شاشات المعلم والإدارة
let keysP = null;
const loadKeys = () => keysP || (keysP = import("./keys.js").then(m => m.default).catch(e => { keysP = null; throw e; }));
function KeysPanel({ book, page, hidden, setHidden, open, setOpen }) {
  const [K, setK] = useState(null); const [err, setErr] = useState(false); const [rev, setRev] = useState({});
  useEffect(() => { loadKeys().then(setK).catch(() => setErr(true)); }, []);
  useEffect(() => setRev({}), [page, hidden]);
  const L = K ? arr(obj(K[book])[page]) : [];
  return <div className="nb-keys">
    <div className="kh" onClick={() => setOpen(!open)}>
      <b>🔑 إجابات صفحة {ar(page)}</b>{K && <span className="nb-st" style={{ background: "#fef3c7", color: "#92400e" }}>{L.length ? `${ar(L.length)} إجابة` : "لا أسئلة"}</span>}
      <span className="nb-sp" />
      {open && L.length > 0 && <button className="nb-b" onClick={e => { e.stopPropagation(); setHidden(!hidden); }} title="للعرض أمام الطلاب: تُخفى الإجابات وتظهر بالضغط على كل سؤال">{hidden ? "👁️ إظهار الكل" : "🙈 إخفاء عن الطلاب"}</button>}
      <button className="nb-b" onClick={e => { e.stopPropagation(); setOpen(!open); }}>{open ? "▲ طي" : "▼ عرض"}</button>
    </div>
    {open && (err ? <div className="ke">تعذّر تحميل المفاتيح — تأكد من رفع ملف nafs/keys.js</div> : !K ? <div className="ke">⏳</div> : !L.length ? <div className="ke">لا توجد في هذه الصفحة أسئلة لها إجابات (شرح أو أمثلة محلولة)</div> :
      <div className="kg">{L.map(([n, t, a], i) => { const show = !hidden || rev[i]; return <div key={i} className={"ki" + (show ? "" : " blur")} onClick={() => hidden && setRev(r => ({ ...r, [i]: !r[i] }))}>
        <span className="kn" dangerouslySetInnerHTML={{ __html: mthHtml(n, { html: true }) }} /><div style={{ minWidth: 0 }}><small dangerouslySetInnerHTML={{ __html: t }} /><div className="ka" dangerouslySetInnerHTML={{ __html: mthHtml(a, { html: true, math: book === "math" }) }} /></div></div>; })}</div>)}
  </div>;
}

// ══════════════════════ عارض الصفحة مع طبقة الكتابة والسبورة ══════════════════════
// store: مسار حفظ الكتابة (null = مؤقتة) • idx: فهرس الصفحات المحلولة • marks: مسار فهرس للاطّلاع فقط
// tc: "show" / "edit" تعليق المعلم • tp: {tkey,tname,cks,ck} تسجيل «تم شرح الصفحة» • boards: مسار السبورات
function BookViewer({ api, book, startPage = 1, store: store0 = null, idx = null, marks = null, readOnly = false, tc: tcMode = null, tcPath = null, tp = null, keys = false, boards = null, boardsRO = false, seenSid = null, who = "x", title = "", by = "", onBack, rel = null, qz = null }) {
  const B = BOOKS[book];
  const [doc, setDoc] = useState(null);
  const [err, setErr] = useState("");
  const [page, setPage] = useState(startPage);
  const [fit, setFit] = useState(() => lsGet("nb-fit", "width"));
  const [zoom, setZoom] = useState(1);
  const [tool, setTool] = useState("view");
  const [color, setColor] = useState("#1d4ed8");
  const [ann, setAnn] = useState({ s: [], n: [] });
  const [tc, setTc] = useState(null);
  const [tcDraft, setTcDraft] = useState("");
  const [saved, setSaved] = useState("");
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [editNote, setEditNote] = useState(null);
  const [solved, setSolved] = useState({});
  const [tpD, setTpD] = useState({});
  const [ck, setCk] = useState(tp ? tp.ck : "");
  const store = tp && tp.storeBase && ck ? `${tp.storeBase}/${ck}` : store0; // سبورة الصفحة لكل فصل
  const [idxOpen, setIdxOpen] = useState(false);
  const [pb, setPb] = useState({});
  const [bo, setBo] = useState(null);
  const [fs, setFs] = useState(false);
  const [kOpen, setKOpen0] = useState(() => lsGet("nb-keys-open", true)); const setKOpen = v => { setKOpen0(v); lsSet("nb-keys-open", v); };
  const [kHide, setKHide] = useState(false);
  const [penOnly, setPenOnly] = useState(() => lsGet("nb-penonly", false)); const [fz, setFz] = useState(1); const [symT, setSymT] = useState(0);
  const [K, setK] = useState(null); const [ansPos, setAnsPos] = useState({}); const [placing, setPlacing] = useState(null); const [relP, setRelP] = useState({}); const [ansOn, setAnsOn] = useState(false); const [ansList, setAnsList] = useState(false);
  const fillRef = useRef(null);
  const rootRef = useRef(null), stageRef = useRef(null), pdfRef = useRef(null), inkRef = useRef(null), topRef = useRef(null), pageRef = useRef(null);
  const hist = useRef([]), drawing = useRef(null), saveT = useRef(null), renderT = useRef(null), annRef = useRef(ann), msgT = useRef(null), touch = useRef(null), pinD = useRef(null);
  annRef.current = ann;
  const base = `${book}/${page}`;
  const seg = segAt(book, page);
  const flash = (m, ms = 1700) => { setSaved(m); clearTimeout(msgT.current); msgT.current = setTimeout(() => setSaved(""), ms); };
  useSeen(api, seenSid, book, page);
  // ✅ الإجابة الإلكترونية والتصحيح الآلي
  const Z = useQuiz({ api, qz, book, page, idx, flash }); const [qzOpen, setQzOpen] = useState(false);
  // ── الإجابات: إتاحتها للطلاب ومواضعها على الصفحة
  useEffect(() => { const c = rel || (tp && ck); if (!c) { setRelP({}); return; } api.maGet(`${NB_REL}/${c}/${book}`).then(d => setRelP(obj(d))); }, [book, rel, ck]);
  const released = !!relP[page];
  const canAns = keys || (rel && released);
  useEffect(() => { setPlacing(null); if (!canAns) { setAnsPos({}); if (rel) setAnsOn(false); return; } api.maGet(`${NB_ANS}/${book}/${page}`).then(d => setAnsPos(obj(d))); }, [book, page, canAns]);
  useEffect(() => { if (canAns && !K) loadKeys().then(setK).catch(() => {}); }, [canAns]);
  useEffect(() => { qFlush(api).then(n => n && flash(`☁️ رُفع ${ar(n)} حفظ كان مؤجَّلاً`)); const f = () => qFlush(api).then(n => n && flash(`☁️ عاد الاتصال — رُفع ${ar(n)} حفظ مؤجَّل`)); window.addEventListener("online", f); return () => window.removeEventListener("online", f); }, []);
  const keyL = K ? arr(obj(K[book])[page]) : [];

  useEffect(() => { let ok = true; openDoc(book).then(d => ok && setDoc(d)).catch(() => ok && setErr("تعذّر تحميل المرجع. تأكد من الاتصال بالإنترنت ثم أعد المحاولة.")); return () => { ok = false; }; }, [book]);
  useEffect(() => { const m = idx || marks; if (m) api.maGet(`${m}/${book}`).then(d => setSolved(obj(d))); }, [book]);
  useEffect(() => { if (tp) api.maGet(`${NB_TP}/${tp.tkey}/${book}`).then(d => setTpD(obj(d))); }, [book]);
  useEffect(() => { lsSet(`nb-last-${who}-${book}`, page); }, [page]);

  // الكتابة على الصفحة + تعليق المعلم + السبورات المحفوظة
  useEffect(() => {
    let ok = true; hist.current = []; setEditNote(null);
    setAnn({ s: [], n: [] }); setTc(null); setTcDraft(""); setPb({});
    Promise.all([store ? api.maGet(`${store}/${base}`) : null, tcMode && tcPath ? api.maGet(`${tcPath}/${base}`) : null, boards ? api.maGet(`${boards}/${base}`) : null]).then(([a, t, b]) => {
      if (!ok) return; const A = obj(a);
      setAnn({ s: arr(A.s).map(x => ({ ...x, p: dec(x.p) })), n: arr(A.n) });
      setTc(t && t.t ? t : null); setTcDraft(t && t.t ? t.t : ""); setPb(obj(b));
    });
    return () => { ok = false; };
  }, [store, base]);

  // رسم صفحة PDF بحجم الشاشة ودقة الجهاز
  const render = useCallback(async () => {
    if (!doc || !stageRef.current) return;
    const pg = await doc.getPage(page);
    const v1 = pg.getViewport({ scale: 1 });
    const W0 = stageRef.current.clientWidth - 16;
    const H0 = window.innerHeight - (topRef.current ? topRef.current.offsetHeight : 110) - 26;
    let w = fit === "page" ? Math.min(W0, H0 * v1.width / v1.height) : Math.min(W0, 1100);
    w = Math.floor(w * zoom); const h = Math.floor(w * v1.height / v1.width);
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const vp = pg.getViewport({ scale: (w / v1.width) * dpr });
    const off = document.createElement("canvas"); off.width = Math.floor(vp.width); off.height = Math.floor(vp.height);
    if (renderT.current) { try { renderT.current.cancel(); } catch {} }
    renderT.current = pg.render({ canvasContext: off.getContext("2d"), viewport: vp });
    try { await renderT.current.promise; } catch { return; }
    const c = pdfRef.current; if (!c) return;
    c.width = off.width; c.height = off.height; c.getContext("2d").drawImage(off, 0, 0);
    setSize({ w, h });
    // «صفحة كاملة»: تظهر الصفحة كلها تحت شريط الأدوات مباشرة دون تمرير
    if (fit === "page" && rootRef.current && stageRef.current && topRef.current) requestAnimationFrame(() => { const r = rootRef.current; if (r) r.scrollTop = Math.max(0, stageRef.current.offsetTop - topRef.current.offsetHeight); });
    if (page < (doc.numPages || B.pages)) doc.getPage(page + 1).catch(() => {});
  }, [doc, page, fit, zoom, fs]);
  useEffect(() => { render(); }, [render]);
  useEffect(() => { let t; const f = () => { clearTimeout(t); t = setTimeout(render, 200); }; window.addEventListener("resize", f); return () => window.removeEventListener("resize", f); }, [render]);
  useEffect(() => { if (topRef.current && rootRef.current) rootRef.current.style.setProperty("--th", topRef.current.offsetHeight + "px"); });
  useEffect(() => { const f = () => { const on = !!document.fullscreenElement; setFs(on); if (on) setKHide(true); }; document.addEventListener("fullscreenchange", f); return () => document.removeEventListener("fullscreenchange", f); }, []);
  const toggleFs = () => { try { if (document.fullscreenElement) document.exitFullscreen(); else (rootRef.current || document.documentElement).requestFullscreen(); } catch {} };

  const paint = useCallback(() => {
    const c = inkRef.current; if (!c || !size.w) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    c.width = size.w * dpr; c.height = size.h * dpr;
    const g = c.getContext("2d"); g.scale(dpr, dpr); g.lineCap = "round"; g.lineJoin = "round";
    const all = [...annRef.current.s, ...(drawing.current ? [drawing.current] : [])];
    for (const s of all) {
      if (!s.p || !s.p.length) continue;
      if (["ell", "line", "arrow", "ok", "no"].includes(s.k)) { g.globalAlpha = 1; g.strokeStyle = s.c; g.lineWidth = 0.0042 * size.w; const [a, b] = [s.p[0], s.p[s.p.length - 1]]; const X = q => q[0] * size.w, Y = q => q[1] * size.h; g.beginPath();
        if (s.k === "ell") { g.ellipse((X(a) + X(b)) / 2, (Y(a) + Y(b)) / 2, Math.max(4, Math.abs(X(b) - X(a)) / 2), Math.max(4, Math.abs(Y(b) - Y(a)) / 2), 0, 0, Math.PI * 2); }
        else if (s.k === "line" || s.k === "arrow") { g.moveTo(X(a), Y(a)); g.lineTo(X(b), Y(b)); if (s.k === "arrow") { const t = Math.atan2(Y(b) - Y(a), X(b) - X(a)), L = 0.018 * size.w; g.moveTo(X(b), Y(b)); g.lineTo(X(b) - L * Math.cos(t - .45), Y(b) - L * Math.sin(t - .45)); g.moveTo(X(b), Y(b)); g.lineTo(X(b) - L * Math.cos(t + .45), Y(b) - L * Math.sin(t + .45)); } }
        else { const r = 0.016 * size.w, x = X(a), y = Y(a); g.lineWidth = 0.0055 * size.w; if (s.k === "ok") { g.moveTo(x - r, y); g.lineTo(x - r * .3, y + r * .7); g.lineTo(x + r, y - r * .8); } else { g.moveTo(x - r * .8, y - r * .8); g.lineTo(x + r * .8, y + r * .8); g.moveTo(x + r * .8, y - r * .8); g.lineTo(x - r * .8, y + r * .8); } }
        g.stroke(); continue; }
      g.globalAlpha = s.k === "hl" ? 0.3 : 1; g.strokeStyle = s.c; g.lineWidth = (s.k === "hl" ? 0.022 : 0.004) * size.w;
      g.beginPath(); s.p.forEach((q, i) => i ? g.lineTo(q[0] * size.w, q[1] * size.h) : g.moveTo(q[0] * size.w, q[1] * size.h));
      if (s.p.length === 1) g.lineTo(s.p[0][0] * size.w + 0.1, s.p[0][1] * size.h);
      g.stroke();
    }
  }, [size]);
  useEffect(() => { paint(); }, [paint, ann]);

  const persist = (next) => {
    if (readOnly || !store) return;
    clearTimeout(saveT.current); setSaved("جارٍ الحفظ…");
    saveT.current = setTimeout(async () => {
      const empty = !next.s.length && !next.n.length;
      const v = empty ? null : { s: next.s.map(x => ({ k: x.k, c: x.c, p: enc(x.p) })), n: next.n, at: Date.now() };
      const key = `${store}/${base}`; let ok = navigator.onLine === false ? false : await api.maPut(key, v);
      if (ok === false) { const q = qGet(); q[key] = v; qSet(q); } else { const q = qGet(); if (q[key] !== undefined) { delete q[key]; qSet(q); } }
      if (idx && ok !== false) { await api.maPut(`${idx}/${base}`, empty ? null : Date.now()); setSolved(o => { const n = { ...o }; if (empty) delete n[page]; else n[page] = Date.now(); return n; }); }
      flash(ok === false ? "📴 لا يوجد اتصال — حُفظ على جهازك وسيُرفع تلقائيًا" : "تم الحفظ ✓", ok === false ? 3000 : 1500);
    }, 900);
  };
  const commit = (next) => { hist.current.push(annRef.current); if (hist.current.length > 60) hist.current.shift(); setAnn(next); persist(next); };
  const undo = () => { const p = hist.current.pop(); if (p) { setAnn(p); persist(p); } };
  const clearPage = () => { if (!ann.s.length && !ann.n.length) return; if (!window.confirm("مسح كل ما كُتب في هذه الصفحة؟")) return; commit({ s: [], n: [] }); };

  const pos = e => { const r = inkRef.current.getBoundingClientRect(); return [Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), Math.min(1, Math.max(0, (e.clientY - r.top) / r.height))]; };
  const eraseAt = (p) => {
    const R = 0.025; const keep = annRef.current.s.filter(s => !s.p.some(q => Math.hypot(q[0] - p[0], (q[1] - p[1]) * size.h / size.w) < R));
    if (keep.length !== annRef.current.s.length) { const next = { ...annRef.current, s: keep }; annRef.current = next; setAnn(next); return true; }
    return false;
  };
  const erased = useRef(false);
  const down = e => {
    if (readOnly || tool === "view") return;
    if (penOnly && e.pointerType === "touch") return; // «القلم فقط»: يُتجاهل لمس اليد
    e.preventDefault(); inkRef.current.setPointerCapture(e.pointerId);
    const p = pos(e);
    if (tool === "ok" || tool === "no") { commit({ ...annRef.current, s: [...annRef.current.s, { k: tool, c: tool === "ok" ? "#16a34a" : "#dc2626", p: [p] }] }); return; }
    if (tool === "type") { const id = "f" + Date.now().toString(36); const next = { ...ann, n: [...ann.n, { id, x: p[0], y: p[1], t: "", k: "f", z: fz, c: color }] }; hist.current.push(ann); setAnn(next); setEditNote(id); return; }
    if (["ell", "line", "arrow"].includes(tool)) { drawing.current = { k: tool, c: color, p: [p, p] }; paint(); return; }
    if (tool === "text") { const id = "n" + Date.now().toString(36); const next = { ...ann, n: [...ann.n, { id, x: p[0], y: p[1], t: "" }] }; hist.current.push(ann); setAnn(next); setEditNote(id); return; }
    if (tool === "erase") { hist.current.push(annRef.current); erased.current = eraseAt(p); return; }
    drawing.current = { k: tool, c: tool === "hl" ? "#facc15" : color, p: [p] }; paint();
  };
  const move = e => {
    if (readOnly) return;
    if (tool === "erase" && e.buttons) { if (eraseAt(pos(e))) erased.current = true; return; }
    if (!drawing.current) return;
    if (["ell", "line", "arrow"].includes(drawing.current.k)) { drawing.current.p[1] = pos(e); paint(); return; }
    const p = pos(e), last = drawing.current.p[drawing.current.p.length - 1];
    if (Math.hypot(p[0] - last[0], p[1] - last[1]) > 0.002) { drawing.current.p.push(p); paint(); }
  };
  const up = () => {
    if (tool === "erase") { if (erased.current) persist(annRef.current); else hist.current.pop(); erased.current = false; return; }
    if (!drawing.current) return; const s = drawing.current; drawing.current = null; if (["ell", "line", "arrow"].includes(s.k) && Math.hypot(s.p[0][0] - s.p[1][0], s.p[0][1] - s.p[1][1]) < 0.008) { paint(); return; } commit({ ...annRef.current, s: [...annRef.current.s, s] });
  };
  const setNoteText = (id, t) => setAnn(a => ({ ...a, n: a.n.map(x => x.id === id ? { ...x, t } : x) }));
  const finishNote = (id) => { setEditNote(null); const next = { ...annRef.current, n: annRef.current.n.filter(x => x.id !== id || x.t.trim()) }; setAnn(next); persist(next); };
  const delNote = (id) => commit({ ...ann, n: ann.n.filter(x => x.id !== id) });

  const ins = sym => { const el = fillRef.current; if (!el || !editNote) return; const a = el.selectionStart ?? el.value.length, b = el.selectionEnd ?? el.value.length; const v = el.value.slice(0, a) + sym + el.value.slice(b); setNoteText(editNote, v); requestAnimationFrame(() => { try { el.focus(); const c = a + sym.length - (/\(  \)|\|  \|/.test(sym) ? sym.length - 2 : 0); el.setSelectionRange(c, c); } catch {} }); };
  const setFillZ = d => { if (!editNote) return; setAnn(a => ({ ...a, n: a.n.map(x => x.id === editNote ? { ...x, z: Math.max(.6, Math.min(2.4, +((x.z || 1) + d).toFixed(2))) } : x) })); setFz(z => Math.max(.6, Math.min(2.4, +(z + d).toFixed(2)))); };
  const placeAt = async e => { if (placing == null) return; const r = pageRef.current.getBoundingClientRect(); const v = { x: +((e.clientX - r.left) / r.width).toFixed(4), y: +((e.clientY - r.top) / r.height).toFixed(4) }; await api.maPut(`${NB_ANS}/${book}/${page}/${placing}`, v); setAnsPos(o => ({ ...o, [placing]: v })); setAnsOn(true); const nx = keyL.findIndex((_, i) => i > placing && !ansPos[i]); setPlacing(nx >= 0 ? nx : null); flash("📍 وُضعت الإجابة"); };
  const unplace = async i => { await api.maPut(`${NB_ANS}/${book}/${page}/${i}`, null); setAnsPos(o => { const n = { ...o }; delete n[i]; return n; }); };
  const relPage = async on => { if (!tp || !ck) return; const v = on ? { at: Date.now(), by: tp.tname || "" } : null; await api.maPut(`${NB_REL}/${ck}/${book}/${page}`, v); setRelP(o => { const n = { ...o }; if (on) n[page] = v; else delete n[page]; return n; }); flash(on ? `👁 أُتيحت إجابات الصفحة ${ar(page)} لطلاب ${cls(ck)}` : `🙈 أُخفيت إجابات الصفحة ${ar(page)} عن ${cls(ck)}`, 2600); };
  const relWeek = async () => { if (!tp || !ck || !seg || seg.k !== "u") return; const P = [...weekPages(book, seg.w), ...testPages(book, seg.w)]; if (!window.confirm(`إتاحة إجابات الأسبوع ${ar(seg.w + 1)} كاملاً (${ar(P.length)} صفحة) لطلاب ${cls(ck)}؟`)) return; const v = { at: Date.now(), by: tp.tname || "" }; await Promise.all(P.map(pg => api.maPut(`${NB_REL}/${ck}/${book}/${pg}`, v))); setRelP(o => { const n = { ...o }; P.forEach(pg => { n[pg] = v; }); return n; }); flash(`👁 أُتيحت إجابات الأسبوع ${ar(seg.w + 1)} لطلاب ${cls(ck)}`, 2600); };
  const saveTc = async () => {
    const v = tcDraft.trim() ? { t: tcDraft.trim(), by: by || "المعلم", at: Date.now() } : null;
    await api.maPut(`${tcPath}/${base}`, v); setTc(v); flash("تم حفظ التعليق ✓");
  };

  const total = doc ? doc.numPages : B.pages;
  const go = d => setPage(p => Math.min(Math.max(1, p + d), total));
  const goTo = p => { setPage(Math.min(Math.max(1, p), total)); setIdxOpen(false); };
  useEffect(() => { if (rootRef.current) rootRef.current.scrollTop = 0; if (stageRef.current) stageRef.current.scrollTop = 0; }, [page]);
  // قفل تمرير صفحة الموقع خلفه، وإعادته كما كان عند الخروج
  useEffect(() => { const b = document.body, h = document.documentElement; const o = [b.style.overflow, h.style.overflow]; b.style.overflow = "hidden"; h.style.overflow = "hidden"; return () => { b.style.overflow = o[0]; h.style.overflow = o[1]; }; }, []);
  useEffect(() => { const k = e => { if (/INPUT|TEXTAREA|SELECT/.test(e.target.tagName) || bo) return;
    if (e.key === "ArrowLeft" || e.key === "PageDown") { e.preventDefault(); go(1); } if (e.key === "ArrowRight" || e.key === "PageUp") { e.preventDefault(); go(-1); }
    if (e.key === "Home") goTo(1); if (e.key === "End") goTo(total); if (e.key.toLowerCase() === "f") toggleFs(); };
    window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); });
  // السحب بالإصبع للتقليب (وضع التصفح فقط)
  const tStart = e => { if (tool !== "view" || zoom > 1 || e.touches.length !== 1) { touch.current = null; return; } const q = e.touches[0]; touch.current = { x: q.clientX, y: q.clientY, t: Date.now() }; };
  const tEnd = e => { const T = touch.current; touch.current = null; if (!T) return; const q = e.changedTouches[0]; const dx = q.clientX - T.x, dy = q.clientY - T.y; if (Date.now() - T.t < 700 && Math.abs(dx) > 70 && Math.abs(dy) < 60) go(dx > 0 ? 1 : -1); };

  // ── «تم شرح الصفحة» للمعلم ← يكتمل الدرس ← يكتمل الأسبوع ← تنبيه المدير
  const C = obj(tpD[ck]);
  const pageDone = !!C["p" + page];
  const markPage = async (on, next) => {
    if (!tp || !ck) return; const n = { ...C }; const ops = {}; const now = Date.now();
    if (on) { n["p" + page] = now; ops["p" + page] = now; } else { delete n["p" + page]; ops["p" + page] = null; }
    let unitDone = false;
    if (seg && seg.k === "u") { const i = +seg.slot.slice(1);
      if (on && !n["u" + i] && unitPages(book, i).every(p => n["p" + p])) { n["u" + i] = now; ops["u" + i] = now; unitDone = true; }
      if (!on && n["u" + i]) { delete n["u" + i]; ops["u" + i] = null; } }
    setTpD(d => ({ ...d, [ck]: n }));
    const path = `${NB_TP}/${tp.tkey}/${book}/${ck}`; await Promise.all(Object.entries(ops).map(([k, v]) => api.maPut(`${path}/${k}`, v)));
    if (on && seg && seg.k === "u" && weekPct(n, book, seg.w) === 100) {
      const nw = await raiseAlert(api, { book, ck, w: seg.w, tkey: tp.tkey, tname: tp.tname }); confetti();
      flash(`🎉 اكتمل شرح الأسبوع ${ar(seg.w + 1)} لفصل ${cls(ck)}${nw ? " — أُبلغت الإدارة لعمل الاختبار" : ""}`, 4500);
    } else if (unitDone) flash(`🌟 اكتمل درس «${seg.label}» لفصل ${cls(ck)}`, 2600);
    else if (on) flash(`✅ سُجّلت الصفحة ${ar(page)} لفصل ${cls(ck)}`);
    if (on && next) go(1);
  };

  // ── السبورات المثبّتة على الصفحة
  const canBoard = !!boards && !boardsRO;
  const newBoard = () => { const n = Object.keys(pb).length; setBo({ id: "b" + Date.now().toString(36), page, init: { n: `سبورة ${ar(n + 1)}`, bg: book === "math" ? "grid" : book === "sci" ? "plain" : "lines", px: .1, py: Math.min(.9, .08 + n * .07) } }); };
  const boardPath = (pg, id) => `${boards}/${book}/${pg}/${id}`;
  const saveBoard = (b, data) => { if (!canBoard) return; const old = b.page === page ? pb[b.id] : null; const v = { ...data, px: (old || b.init).px ?? .1, py: (old || b.init).py ?? .1 };
    if (bdEmpty(v)) { api.maPut(boardPath(b.page, b.id), null); if (b.page === page) setPb(o => { const x = { ...o }; delete x[b.id]; return x; }); return; }
    api.maPut(boardPath(b.page, b.id), v); if (b.page === page) setPb(o => ({ ...o, [b.id]: v })); };
  const closeBoard = (data, changed) => { const b = bo; setBo(null); if (data && changed) saveBoard(b, data); else if (data && bdEmpty(data) && pb[b.id]) saveBoard(b, data); if (data && changed && canBoard && !bdEmpty(data)) flash(`📌 حُفظت «${data.n}» على صفحة ${ar(b.page)}`); };
  const delBoard = () => { const b = bo; if (!window.confirm("حذف هذه السبورة نهائيًا؟")) return; setBo(null); if (canBoard) { api.maPut(boardPath(b.page, b.id), null); if (b.page === page) setPb(o => { const x = { ...o }; delete x[b.id]; return x; }); } };
  const pinDown = (e, id) => { e.stopPropagation(); const r = pageRef.current.getBoundingClientRect(); pinD.current = { id, r, sx: e.clientX, sy: e.clientY, moved: false }; try { e.currentTarget.setPointerCapture(e.pointerId); } catch {} };
  const pinMove = e => { const D = pinD.current; if (!D || !canBoard) return; if (Math.abs(e.clientX - D.sx) + Math.abs(e.clientY - D.sy) > 6) D.moved = true; if (!D.moved) return;
    const px = Math.min(.97, Math.max(.03, 1 - (e.clientX - D.r.left) / D.r.width)), py = Math.min(.97, Math.max(.03, (e.clientY - D.r.top) / D.r.height)); setPb(o => ({ ...o, [D.id]: { ...o[D.id], px, py } })); };
  const pinUp = () => { const D = pinD.current; pinD.current = null; if (!D) return; const b = pb[D.id]; if (D.moved && canBoard) { api.maPut(`${boardPath(page, D.id)}/px`, b.px); api.maPut(`${boardPath(page, D.id)}/py`, b.py); } else setBo({ id: D.id, page, init: b }); };

  const drawingMode = !readOnly && tool !== "view";
  const fillEd = !!editNote && (ann.n.find(x => x.id === editNote) || {}).k === "f";
  const COLORS = ["#1d4ed8", "#dc2626", "#16a34a", "#111827"];
  const wP = w => tp && ck ? weekPct(C, book, w) : (idx || marks) ? stuWeekPct(solved, book, w) : null;
  const curW = weekOfPage(book, page);
  const nBoards = Object.keys(pb).length;

  // يُعرض في طبقة كاملة فوق الموقع (لا تتداخل معه القوائم والعناوين وأشرطة التنقل)
  return createPortal(<div ref={rootRef} className="nb nb-fs" dir="rtl" style={{ "--c": B.c }} role="dialog" aria-label={`مرجع ${B.name}`}><style>{CSS + LCSS + QZ_CSS}</style>
    <div className="nb-top" ref={topRef}>
      <button className="nb-b" onClick={() => { if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); onBack(); }}>→ رجوع</button>
      <b>{B.name}{title ? ` • ${title}` : ""}</b>
      <span className="nb-sp" />
      <button className="nb-b on" onClick={() => setIdxOpen(true)}>📑 الفهرس</button>
      <span className="nb-pg">
        <button className="nb-b" onClick={() => go(-1)} disabled={page <= 1} aria-label="السابقة">›</button>
        <input value={ar(page)} inputMode="numeric" onFocus={e => e.target.select()} onChange={e => { const v = +normId(e.target.value); if (v >= 1 && v <= total) setPage(v); }} aria-label="رقم الصفحة" />
        / {ar(total)}
        <button className="nb-b" onClick={() => go(1)} disabled={page >= total} aria-label="التالية">‹</button>
      </span>
    </div>
    <div className="nb-scrub" style={{ background: "#fff", margin: 0, padding: "4px 10px 6px", height: "auto" }} title="الأسابيع — اضغط للانتقال">
      {Array.from({ length: 15 }, (_, w) => { const v = wP(w); return <i key={w} className={w === curW ? "cur" : ""} onClick={() => goTo(B.units[w * 2])} title={`الأسبوع ${w + 1}`}><b style={{ width: (v == null ? (w < curW ? 100 : 0) : v) + "%", background: v === 100 ? "#16a34a" : undefined }} /></i>; })}
    </div>
    <div className="nb-tools">
      <button className={"nb-b" + (fit === "width" ? " on" : "")} onClick={() => { setFit("width"); lsSet("nb-fit", "width"); setZoom(1); }}>↔ بعرض الشاشة</button>
      <button className={"nb-b" + (fit === "page" ? " on" : "")} onClick={() => { setFit("page"); lsSet("nb-fit", "page"); setZoom(1); }}>▯ صفحة كاملة</button>
      <button className="nb-b" onClick={() => setZoom(z => Math.max(1, +(z - 0.25).toFixed(2)))} disabled={zoom <= 1} aria-label="تصغير">−</button>
      <button className="nb-b" onClick={() => setZoom(z => Math.min(2.5, +(z + 0.25).toFixed(2)))} aria-label="تكبير">+</button>
      <button className={"nb-b" + (fs ? " on" : "")} onClick={toggleFs} title="ملء الشاشة للعرض (F)">⛶ {fs ? "خروج" : "عرض"}</button>
      <span className="sep" />
      <button className="nb-b" style={{ background: "linear-gradient(135deg,#1e3a8a,#0f766e)", color: "#fff", borderColor: "transparent" }} onClick={() => bo ? null : newBoard()} title="سبورة عائمة لحل المسائل والمعادلات">🧑‍🏫 سبورة{nBoards ? ` (${ar(nBoards)})` : ""}</button>
      {keys && <button className={"nb-b" + (kOpen ? " on" : "")} style={{ "--c": "#b45309" }} onClick={() => setKOpen(!kOpen)} title="مفتاح إجابات هذه الصفحة">🔑 الإجابات</button>}
      {keys && keyL.length > 0 && <button className={"nb-b" + (ansOn ? " on" : "")} style={{ "--c": "#15803d" }} onClick={() => setAnsOn(!ansOn)} title="إظهار الإجابات في أماكنها على الصفحة">✅ على الصفحة</button>}
      {keys && !readOnly && keyL.length > 0 && <button className={"nb-b" + (placing != null ? " on" : "")} style={{ "--c": "#0f766e" }} onClick={() => { if (placing != null) { setPlacing(null); return; } const i = keyL.findIndex((_, j) => !ansPos[j]); setPlacing(i >= 0 ? i : 0); setAnsOn(true); }} title="ضع كل إجابة في فراغها مرة واحدة لتظهر للطلاب في مكانها">📍 وضع الإجابات في الفراغات</button>}
      {Z.on && Z.U.pages.length > 0 && <button className={"nb-b" + (qzOpen ? " on" : "")} style={{ "--c": "#15803d", fontWeight: 900 }} onClick={() => setQzOpen(!qzOpen)} title="أجب عن أسئلة الصفحة إلكترونيًا وصحّحها فورًا">📝 ورقة الإجابة ({ar(Z.st.ans)}/{ar(Z.st.tot)})</button>}
      {rel && released && <button className={"nb-b" + (ansOn ? " on" : "")} style={{ "--c": "#15803d" }} onClick={() => { setAnsOn(!ansOn); if (!Object.keys(ansPos).length) setAnsList(true); }} title="أتاحها معلمك">🔑 الإجابات {ansOn ? "(ظاهرة)" : ""}</button>}
      {rel && released && <button className={"nb-b" + (ansList ? " on" : "")} onClick={() => setAnsList(!ansList)}>📋 قائمة الإجابات</button>}
      {!readOnly && <>
        <span className="sep" />
        <button className={"nb-b" + (tool === "view" ? " on" : "")} onClick={() => setTool("view")}>✋ تصفح</button>
        <button className={"nb-b" + (tool === "pen" ? " on" : "")} onClick={() => setTool("pen")}>✏️ قلم</button>
        {COLORS.map(c => <span key={c} className={"nb-dot" + (tool === "pen" && color === c ? " on" : "")} style={{ background: c }} onClick={() => { setColor(c); setTool("pen"); }} role="button" aria-label="لون" />)}
        <button className={"nb-b" + (tool === "hl" ? " on" : "")} onClick={() => setTool("hl")}>🖍️ تظليل</button>
        <button className={"nb-b" + (tool === "type" ? " on" : "")} onClick={() => setTool("type")} title="اضغط على الفراغ واكتب — تنفتح لوحة المفاتيح ولوحة الرموز">⌨️ كتابة في الفراغ</button>
        <button className={"nb-b" + (tool === "ell" ? " on" : "")} onClick={() => setTool("ell")} title="اسحب حول الإجابة لتحويطها">⭕ تحويط</button>
        <button className={"nb-b" + (tool === "line" ? " on" : "")} onClick={() => setTool("line")} title="اسحب من البند إلى ما يقابله">🔗 توصيل</button>
        <button className={"nb-b" + (tool === "arrow" ? " on" : "")} onClick={() => setTool("arrow")}>➚ سهم</button>
        <button className={"nb-b" + (tool === "ok" ? " on" : "")} onClick={() => setTool("ok")} title="اضغط مكان العلامة">✔️</button>
        <button className={"nb-b" + (tool === "no" ? " on" : "")} onClick={() => setTool("no")}>✖️</button>
        <button className={"nb-b" + (tool === "text" ? " on" : "")} onClick={() => setTool("text")}>💬 ملاحظة</button>
        <button className={"nb-b" + (penOnly ? " on" : "")} onClick={() => { setPenOnly(!penOnly); lsSet("nb-penonly", !penOnly); flash(!penOnly ? "🖊️ الكتابة بالقلم فقط — لمس اليد للتمرير" : "✋ الكتابة بالإصبع مفعّلة"); }} title="للأجهزة اللوحية مع القلم: يمنع خطوط راحة اليد">🖊️ القلم فقط</button>
        <button className={"nb-b" + (tool === "erase" ? " on" : "")} onClick={() => setTool("erase")}>🧽 ممحاة</button>
        <button className="nb-b" onClick={undo} disabled={!hist.current.length}>↩︎ تراجع</button>
        <button className="nb-b" onClick={clearPage}>🗑️ مسح الصفحة</button>
      </>}
    </div>

    {tp && <div className="nb-ribbon" style={{ "--c": B.c }}>
      <span className="lbl">📽️ أشرح لفصل</span>
      <select className="nb-sel" value={ck} onChange={e => setCk(e.target.value)}>{tp.cks.map(c => <option key={c} value={c}>{cls(c)}</option>)}</select>
      {seg && seg.k === "u" ? <>
        <span className="lbl" style={{ color: B.c }}>الأسبوع {ar(seg.w + 1)}</span>
        <div className="nb-bar" style={{ width: 90, "--c": weekPct(C, book, seg.w) === 100 ? "#16a34a" : B.c }}><i style={{ width: weekPct(C, book, seg.w) + "%" }} /></div><b style={{ fontSize: 13 }}>{ar(weekPct(C, book, seg.w))}٪</b>
        <button className={"nb-b big" + (pageDone ? " ok" : "")} onClick={() => markPage(!pageDone)}>{pageDone ? "✅ تم شرح الصفحة" : "⬜ تم شرح الصفحة"}</button>
        {!pageDone && page < total && <button className="nb-b big on" onClick={() => markPage(true, true)}>✅ وانتقل للتالية ‹</button>}
      </> : seg && seg.k === "t" ? <span className="lbl" style={{ color: "#b45309" }}>📝 صفحات اختبار الأسبوع {ar(seg.w + 1)} — تُطبَّق بعد اكتمال الشرح بتوجيه الإدارة</span>
        : <span className="lbl" style={{ color: "#64748b" }}>صفحات التمهيد والخطة</span>}
      <span className="nb-sp" />
      <button className={"nb-b" + (released ? " ok" : "")} onClick={() => relPage(!released)} title="يرى طلاب هذا الفصل إجابات الصفحة على أجهزتهم وفي فراغاتها">{released ? "👁 الإجابات متاحة للطلاب" : "🔒 إتاحة إجابات الصفحة للطلاب"}</button>
      {seg && seg.k === "u" && <button className="nb-b" onClick={relWeek}>👁 إتاحة إجابات الأسبوع</button>}
      <small style={{ fontWeight: 900, color: "#475569" }}>إنجاز الكتاب لفصل {cls(ck)}: {ar(bookPct(C, book))}٪</small>
    </div>}
    {!readOnly && !store && <div className="nb-info">وضع العرض: ما تكتبه على الصفحة للشرح فقط ولا يُحفظ</div>}
    {tcMode === "show" && tc && <div className="nb-tc">💬 تعليق {tc.by}: {tc.t}</div>}
    {tcMode === "edit" && <div className="nb-tc" style={{ background: "#eff6ff", borderColor: "#3b82f6" }}>
      <div style={{ marginBottom: 6 }}>تعليقك على هذه الصفحة للطالب{tc && tc.by && tc.by !== by ? ` (آخر تعليق: ${tc.by})` : ""}:</div>
      <div style={{ display: "flex", gap: 6 }}>
        <input value={tcDraft} onChange={e => setTcDraft(e.target.value)} placeholder="مثال: أحسنت، راجع السؤال ٣" style={{ flex: 1, minWidth: 0, border: "1px solid #cbd5e1", borderRadius: 8, padding: 8, font: "inherit" }} />
        <button className="nb-b on" style={{ "--c": "#2563eb" }} onClick={saveTc}>حفظ</button>
      </div>
    </div>}

    {keys && <KeysPanel book={book} page={page} hidden={kHide} setHidden={setKHide} open={kOpen} setOpen={setKOpen} />}
    {rel && released && ansList && <KeysPanel book={book} page={page} hidden={false} setHidden={() => {}} open={true} setOpen={() => setAnsList(false)} />}
    {rel && released && !ansOn && !ansList && <div className="nb-info" style={{ background: "#dcfce7", color: "#166534", borderColor: "#86efac" }}>🔑 أتاح معلمك إجابات هذه الصفحة — حُلّ أولاً ثم اضغط «الإجابات» لتقارن حلك</div>}
    {placing != null && <div className="nb-place"><b>📍 اضغط على الصفحة مكان إجابة:</b>{keyL.map((k, i) => <button key={i} className={"nb-b" + (placing === i ? " on" : "")} style={{ "--c": "#0f766e" }} onClick={() => setPlacing(i)}>{ansPos[i] ? "✓ " : ""}{stripH(k[0])}: {stripH(k[2]).slice(0, 22)}</button>)}{ansPos[placing] && <button className="nb-b" onClick={() => unplace(placing)}>✕ إزالة موضعها</button>}<button className="nb-b" onClick={() => setPlacing(null)}>تم</button></div>}
    <div className="nb-stage" ref={stageRef} onTouchStart={tStart} onTouchEnd={tEnd}>
      {err ? <div className="nb-msg">{err}</div> : !doc ? <div className="nb-msg">📚 جارٍ تحميل المرجع…</div> :
        <div className="nb-page" ref={pageRef} style={{ width: size.w || "100%", height: size.h || "60vh" }} onPointerMove={pinMove} onPointerUp={pinUp}>
          <canvas className="pdf" ref={pdfRef} />
          <canvas className="ink" ref={inkRef} style={{ touchAction: drawingMode ? "none" : "auto", cursor: drawingMode ? (tool === "text" ? "text" : "crosshair") : "default", pointerEvents: drawingMode ? "auto" : "none" }}
            onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} />
          {tp && pageDone && <div className="nb-done">✅ شُرحت لفصل {cls(ck)}</div>}
          {!tp && solved[page] && (idx || marks) && <div className="nb-done" style={{ background: "#7c3aed" }}>✍️ فيها حل</div>}
          {ann.n.filter(n => n.k === "f").map(n => <div key={n.id} className={"nb-fill" + (editNote === n.id ? " ed" : "")} style={{ right: `${(1 - n.x) * 100}%`, top: `${n.y * 100}%`, fontSize: Math.max(11, size.w * 0.02 * (n.z || 1)), color: n.c || "#1d4ed8" }}
            onPointerDown={e => e.stopPropagation()} onClick={e => { if (!readOnly) { e.stopPropagation(); setEditNote(n.id); } }}>
            {editNote === n.id ? <input ref={fillRef} autoFocus value={n.t} dir="auto" onChange={e => setNoteText(n.id, e.target.value)} onKeyDown={e => { if (e.key === "Enter") e.target.blur(); }} onBlur={() => setTimeout(() => { if (document.activeElement && document.activeElement.closest && document.activeElement.closest(".nb-pal")) return; finishNote(n.id); }, 120)} placeholder="اكتب…" size={Math.max(4, n.t.length + 1)} />
              : <span>{n.t}</span>}
            {!readOnly && editNote !== n.id && <button className="x" onClick={e => { e.stopPropagation(); delNote(n.id); }} aria-label="حذف">×</button>}
          </div>)}
          {ansOn && keyL.map((k, i) => ansPos[i] ? <div key={"a" + i} className="nb-ansp" style={{ right: `${(1 - ansPos[i].x) * 100}%`, top: `${ansPos[i].y * 100}%`, fontSize: Math.max(10, size.w * 0.017) }} title={stripH(k[1])}>{stripH(k[2])}</div> : null)}
          <QzBubbles Z={Z} book={book} page={page} size={size} active={tool === "view" && !Z.ro && placing == null} color={B.c} />
          {placing != null && <div className="nb-placeov" onPointerDown={e => { e.stopPropagation(); placeAt(e); }} />}
          {ann.n.filter(n => n.k !== "f").map(n => <div key={n.id} className="nb-note" style={{ right: `${(1 - n.x) * 100}%`, top: `${n.y * 100}%`, fontSize: Math.max(12, size.w * 0.022) }}
            onClick={e => { if (!readOnly) { e.stopPropagation(); setEditNote(n.id); } }}>
            {editNote === n.id ? <textarea autoFocus rows={2} value={n.t} onChange={e => setNoteText(n.id, e.target.value)} onBlur={() => finishNote(n.id)} placeholder="اكتب هنا…" />
              : <span>{n.t}</span>}
            {!readOnly && editNote !== n.id && <button className="x" onClick={e => { e.stopPropagation(); delNote(n.id); }} aria-label="حذف الملاحظة">×</button>}
          </div>)}
          {Object.entries(pb).map(([id, b]) => <div key={id} className={"nb-pin" + (BD_DARK(b.bg) ? " chalk" : "")} style={{ right: `${(1 - (b.px ?? .1)) * 100}%`, top: `${(b.py ?? .1) * 100}%` }}
            onPointerDown={e => pinDown(e, id)} title="اضغط لفتح السبورة • اسحب لتحريكها">📌 {b.n || "سبورة"}</div>)}
        </div>}
    </div>

    {fillEd && <div className="nb-pal" onMouseDown={e => e.preventDefault()} onPointerDown={e => e.preventDefault()}>
      <div className="pt">{NB_SYM.map(([l], i) => <button key={l} className={"nb-b" + (symT === i ? " on" : "")} onClick={() => setSymT(i)}>{l}</button>)}<span className="nb-sp" /><button className="nb-b" onClick={() => setFillZ(-0.15)}>A−</button><button className="nb-b" onClick={() => setFillZ(0.15)}>A+</button>{["#1d4ed8", "#dc2626", "#111827"].map(c => <span key={c} className="nb-dot" style={{ background: c }} onClick={() => { setColor(c); setAnn(a => ({ ...a, n: a.n.map(x => x.id === editNote ? { ...x, c } : x) })); }} />)}<button className="nb-b on" onClick={() => { const id = editNote; finishNote(id); }}>✓ تم</button></div>
      <div className="ps">{NB_SYM[symT][1].map(x => <button key={x} onClick={() => ins(x)}>{x}</button>)}</div></div>}
    {Z.on && Z.U.pages.length > 0 && !qzOpen && !fillEd && <button className="qz-fab" style={{ "--c": B.c }} onClick={() => setQzOpen(true)}>📝 {Z.ro ? "إجابات الطالب" : Z.graded ? "نتيجتي والتغذية الراجعة" : Z.U.test ? "ورقة إجابة الاختبار" : "أجب وصحّح"}<small>{Z.anyG && qPct(Z.st.C, Z.st.G) != null ? `${ar(qPct(Z.st.C, Z.st.G))}٪` : `${ar(Z.st.ans)}/${ar(Z.st.tot)}`}</small></button>}
    {Z.on && qzOpen && <QzSheet Z={Z} book={book} page={page} onClose={() => setQzOpen(false)} onGo={goTo} color={B.c} />}
    {!fillEd && <div className="nb-nav"><button onClick={() => go(-1)} aria-label="السابقة">›</button><button onClick={() => go(1)} aria-label="التالية">‹</button></div>}
    {saved && <div className="nb-save">{saved}</div>}
    {idxOpen && <IndexDrawer book={book} doc={doc} page={page} onGo={goTo} onClose={() => setIdxOpen(false)}
      mark={p => tp && ck ? (C["p" + p] ? "✓" : "") : solved[p] ? "✍️" : ""} weekP={(tp && ck) || idx || marks ? wP : null}
      weekLbl={tp && ck ? w => `فصل ${cls(ck)}: ${weekPct(C, book, w) === 100 ? "اكتمل الشرح ✅" : `شُرح ${ar(weekPct(C, book, w))}٪`}` : null} />}
    {bo && <Board key={bo.id} init={bo.init} readOnly={boardsRO} canSave={canBoard} label={`${B.name} • ص ${ar(bo.page)}`}
      onSave={d => saveBoard(bo, d)} onClose={closeBoard} onDelete={pb[bo.id] || canBoard ? delBoard : null} />}
  </div>, document.body);
}

// ══════════════════════ دخول الطالب ومكتبته ══════════════════════
function StudentLogin({ api, onIn, onBack }) {
  const [v, setV] = useState(""); const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  const go = async () => {
    const n = normId(v); if (n.length !== 10) { setErr("أدخل رقم الهوية كاملًا (١٠ أرقام)"); return; }
    setBusy(true); setErr("");
    try {
      const h = await api.stuHash(n); const ros = obj(await api.maGet(api.MA_ROSTER)); let st = null;
      for (const [ck, r] of Object.entries(ros)) { if (!String(ck).startsWith("3-")) continue; const x = arr(r && r.students).find(y => y && y.nh === h); if (x) { st = { id: x.id, name: x.name, ck, nh: h }; break; } }
      if (!st) { setErr("لم يُعثر على رقم الهوية في كشوف الصف الثالث المتوسط. راجع وكيل شؤون الطلاب."); setBusy(false); return; }
      lsSet(REMEMBER, { ...st, until: Date.now() + 30 * 864e5 });
      try { api.logLogin && api.logLogin({ ...st, sid: st.id, n4: n.slice(-4) }, "marji"); } catch {}
      onIn(st);
    } catch { setErr("تعذّر الاتصال، حاول مرة أخرى."); }
    setBusy(false);
  };
  return <div className="nb-card">
    <div style={{ fontSize: 40, textAlign: "center" }}>📚</div>
    <h2 style={{ textAlign: "center", margin: "4px 0 2px", fontSize: 20 }}>مراجع نافس – الثالث المتوسط</h2>
    <p style={{ textAlign: "center", color: "#64748b", fontWeight: 700, margin: "0 0 14px", fontSize: 14 }}>ادخل برقم هويتك؛ فيُحفظ حلك في دفترك أنت فقط</p>
    <input value={v} onChange={e => setV(e.target.value)} onKeyDown={e => e.key === "Enter" && go()} inputMode="numeric" placeholder="رقم الهوية الوطنية"
      style={{ width: "100%", fontSize: 18, textAlign: "center", padding: 12, borderRadius: 12, border: "2px solid #cbd5e1", font: "inherit", letterSpacing: 2 }} />
    {err && <div style={{ color: "#b91c1c", fontWeight: 800, marginTop: 8, fontSize: 14 }}>{err}</div>}
    <button className="nb-b on" style={{ "--c": "#7c3aed", width: "100%", marginTop: 12, padding: 12, fontSize: 16 }} onClick={go} disabled={busy}>{busy ? "جارٍ التحقق…" : "دخول"}</button>
    {onBack && <button className="nb-b" style={{ width: "100%", marginTop: 8 }} onClick={onBack}>العودة للرئيسية</button>}
  </div>;
}

const Bar = ({ v, c = "#16a34a", w }) => <div className="nb-bar" style={{ "--c": c, ...(w ? { width: w } : {}) }}><i style={{ width: `${Math.min(100, v || 0)}%` }} /></div>;
const Ring = ({ v, c, label }) => <div style={{ display: "grid", justifyItems: "center", gap: 2 }}><div className="nb-ring" style={{ "--p": v, "--c": v === 100 ? "#16a34a" : c }}><span>{ar(v)}٪</span></div>{label && <small style={{ fontWeight: 900, color: "#475569" }}>{label}</small>}</div>;
const WeekBars = ({ vals, c, onPick, cur }) => <div className="nb-wbars" style={{ "--c": c }}>{vals.map((v, w) => <i key={w} className={v === 100 ? "full" : ""} title={`الأسبوع ${w + 1}: ${v}%`} onClick={() => onPick && onPick(w)} style={cur === w ? { outline: `2px solid ${c}` } : null}><b style={{ height: Math.max(v ? 8 : 0, v) + "%" }} /></i>)}</div>;

function Library({ api, student, books = BOOK_IDS, onOpen, onLogout, onBack, onProfile, readOnly, learn }) {
  const [done, setDone] = useState({}); const [open, setOpen] = useState({});
  useEffect(() => { if (!student) return; api.maGet(`${NB_IDX}/${student.id}`).then(d => setDone(obj(d))); api.maGet(`${NB_OPEN}/${student.ck}`).then(d => setOpen(obj(d))); }, [student && student.id]);
  const count = book => Object.keys(obj(done[book])).length;
  const tests = books.flatMap(b => Object.keys(obj(open[b])).map(w => ({ b, w: +w, solved: testSolved(done[b], b, +w) }))).sort((a, c) => a.solved - c.solved);
  return <div className="nb-home"><style>{QZ_CSS}</style>
    <div className="nb-book" style={{ "--c": "#7c3aed", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 900, fontSize: 17 }}>{readOnly ? "دفتر الطالب: " : "أهلًا "}{student.name}</div>
        <div style={{ color: "#64748b", fontWeight: 700, fontSize: 13 }}>الثالث المتوسط / {ar(String(student.ck).split("-")[1])} • الشريط تحت كل أسبوع يبيّن نسبة ما حللته فيه</div>
      </div>
      {onProfile && <button className="nb-b on" style={{ "--c": "#1e3a8a" }} onClick={onProfile} title="الغياب والتأخر وتقييم المعلمين والملاحظات">📋 ملفي الشامل</button>}
      {onLogout && <button className="nb-b" onClick={onLogout}>تبديل الطالب</button>}
      {onBack && <button className="nb-b" onClick={onBack}>رجوع</button>}
    </div>
    {learn}
    {tests.map(x => { const B = BOOKS[x.b]; return <div key={x.b + x.w} className="nb-opent" style={{ "--c": x.solved ? "#16a34a" : B.c }}>
      <span style={{ fontSize: 30 }}>{x.solved ? "✅" : "📝"}</span>
      <div style={{ flex: 1, minWidth: 160 }}><b style={{ fontSize: 16 }}>اختبار الأسبوع {ar(x.w + 1)} – {B.name}</b><div style={{ fontSize: 13, fontWeight: 700, opacity: .9 }}>{x.solved ? "حللت فيه — يمكنك المراجعة" : "متاح الآن بتوجيه من المدرسة — حل في دفترك"}</div></div>
      <button className="nb-b big" style={{ color: "#0f172a" }} onClick={() => onOpen(x.b, B.tests[x.w])}>{x.solved ? "مراجعة" : readOnly ? "عرض" : "ابدأ الاختبار ←"}</button>
    </div>; })}
    {books.map(id => { const B = BOOKS[id]; const last = lsGet(`nb-last-s_${student.id}-${id}`); const vals = Array.from({ length: 15 }, (_, w) => stuWeekPct(done[id], id, w));
      return <div key={id} className="nb-book" style={{ "--c": B.c }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <b style={{ fontSize: 19, color: B.c, flex: 1 }}>{B.name}</b>
          <small style={{ fontWeight: 800, color: "#64748b" }}>{ar(count(id))} صفحة فيها حل</small>
          {!readOnly && last > 1 && <button className="nb-b" onClick={() => onOpen(id, last)}>↩️ تابع من ص {ar(last)}</button>}
          <button className="nb-b on" onClick={() => onOpen(id, 1)}>{readOnly ? "افتح دفتره" : "افتح المرجع"}</button>
        </div>
        <div className="nb-weeks">{vals.map((v, w) => <button key={w} className={"nb-wk" + (v >= 60 ? " done" : "")} onClick={() => onOpen(id, B.units[w * 2])} aria-label={`الأسبوع ${w + 1}`}>{ar(w + 1)}<i><b style={{ width: v + "%" }} /></i></button>)}</div>
        <QzMine api={api} sid={student.id} book={id} color={B.c} />
        {readOnly && count(id) > 0 && <div style={{ marginTop: 8, fontSize: 13, fontWeight: 700, color: "#475569" }}>الصفحات: {Object.keys(obj(done[id])).sort((a, b) => a - b).map(p => <button key={p} className="nb-wk" style={{ margin: 2, padding: "2px 6px", display: "inline-flex" }} onClick={() => onOpen(id, +p)}>{ar(p)}</button>)}</div>}
      </div>; })}
  </div>;
}

// ══════════════════════ بوابة الطالب (#marji) ══════════════════════
export function NafsBooksStudent({ api, onBack }) {
  const [st, setSt] = useState(() => { const s = lsGet(REMEMBER); return s && s.until > Date.now() ? s : null; });
  const [open, setOpen] = useState(null); const [lv, setLv] = useState(null);
  useEffect(() => { if (!st) return; const k = "nb-visit-" + st.id; try { if (sessionStorage.getItem(k)) return; sessionStorage.setItem(k, "1"); } catch {}
    (async () => { const n = +(await api.maGet(`${NB_SEEN}/${st.id}/n`)) || 0; const now = Date.now(); api.maPut(`${NB_SEEN}/${st.id}/n`, n + 1); api.maPut(`${NB_SEEN}/${st.id}/at`, now); if (!n) api.maPut(`${NB_SEEN}/${st.id}/first`, now); })(); }, [st && st.id]);
  const logout = () => { try { localStorage.removeItem(REMEMBER); } catch {} setSt(null); setOpen(null); };
  return <div className="nb"><style>{CSS + LCSS}</style>
    {!st ? <StudentLogin api={api} onIn={setSt} onBack={onBack} />
      : open ? <BookViewer api={api} book={open.book} startPage={open.page} store={`${NB}/${st.id}`} idx={`${NB_IDX}/${st.id}`} tc="show" tcPath={`${NB_TC}/${st.id}`} rel={st.ck}
          boards={`${NB_B}/s_${st.id}`} seenSid={st.id} who={"s_" + st.id} title={st.name.split(" ").slice(0, 2).join(" ")} onBack={() => setOpen(null)} qz={{ sid: st.id, ck: st.ck, nm: st.name }} />
        : lv ? (lv.k === "pre" ? <PreTest api={api} st={st} book={lv.b} onBack={() => setLv(null)} /> : <HwDo api={api} st={st} hw={lv.h} onBack={() => setLv(null)} onOpenPage={p => setOpen({ book: lv.h.book, page: p })} />)
        : <Library api={api} student={st} onOpen={(book, page) => setOpen({ book, page })} onLogout={logout} onBack={onBack} learn={<StudentLearn key={st.id + (lv ? 1 : 0)} api={api} st={st} onPre={b => setLv({ k: "pre", b })} onHw={h => setLv({ k: "hw", h })} />}
            onProfile={() => { lsSet("pam-parent", { ck: st.ck, sid: st.id, name: st.name, nh: st.nh }); window.location.hash = "parent"; window.location.reload(); }} />}
  </div>;
}

// ══════════════════════ أجزاء مشتركة للمعلم والإدارة ══════════════════════
const AL_ST = { new: { l: "🔔 جاهز للاختبار", c: "#c2410c", bg: "#ffedd5" }, open: { l: "📝 الاختبار مفتوح للطلاب", c: "#1d4ed8", bg: "#dbeafe" }, done: { l: "✅ طُبّق الاختبار", c: "#15803d", bg: "#dcfce7" } };

// خطة الأسابيع: الدروس والاختبارات لكل فصل مع نسبة الشرح
function PlanGrid({ api, tkey, tname, book, cks, editable, onOpen, alerts = {} }) {
  const B = BOOKS[book];
  const [D, setD] = useState(null);
  useEffect(() => { api.maGet(`${NB_TP}/${tkey}/${book}`).then(d => setD(obj(d))); }, [tkey, book]);
  const toggle = async (ck, slot) => {
    if (!editable) return; const on = !(D[ck] && D[ck][slot]); const n = { ...obj(D[ck]) }; if (on) n[slot] = Date.now(); else delete n[slot];
    setD(d => ({ ...d, [ck]: n })); await api.maPut(`${NB_TP}/${tkey}/${book}/${ck}/${slot}`, on ? Date.now() : null);
    if (on && slot[0] === "u") { const w = Math.floor(+slot.slice(1) / 2); if (weekPct(n, book, w) === 100) { const nw = await raiseAlert(api, { book, ck, w, tkey, tname }); confetti(); if (nw) window.setTimeout(() => window.alert(`🎉 اكتمل شرح الأسبوع ${ar(w + 1)} لفصل ${cls(ck)} — أُبلغت الإدارة لعمل الاختبار`), 300); } }
  };
  if (!D) return <div className="nb-msg">⏳</div>;
  return <div style={{ display: "grid", gap: 8 }}>
    <div className="nb-kpis" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))" }}>{cks.map(ck => { const C = obj(D[ck]); const bp = bookPct(C, book); return <div key={ck} className="nb-kpi" style={{ "--c": B.c, display: "flex", gap: 10, alignItems: "center" }}>
      <Ring v={bp} c={B.c} />
      <div style={{ flex: 1, minWidth: 0 }}><small>فصل {cls(ck)}</small><div style={{ fontWeight: 900, fontSize: 13 }}>أسابيع مكتملة: {ar(weeksDone(C, book))} / ١٥</div>
        <small>الاختبارات المطبّقة: {ar(Object.keys(C).filter(k => k[0] === "t").length)} / ١٥</small>
        <WeekBars vals={Array.from({ length: 15 }, (_, w) => weekPct(C, book, w))} c={B.c} /></div></div>; })}</div>
    {editable && <div className="nb-info" style={{ margin: 0 }}>الأسهل: سجّل «✅ تم شرح الصفحة» أثناء العرض فيُحسب الدرس والأسبوع تلقائيًا. ويمكنك هنا اعتماد درس كامل بضغطة على اسم الفصل.</div>}
    {Array.from({ length: 15 }, (_, w) => <div key={w} className="nb-wkc">
      <div className="nb-h" style={{ gap: 6 }}><b style={{ color: B.c, fontSize: 15 }}>الأسبوع {ar(w + 1)}</b>
        {cks.map(ck => { const v = weekPct(obj(D[ck]), book, w); const al = alerts[`${book}_${ck}_${w}`]; return <span key={ck} className="nb-st" style={{ background: v === 100 ? "#dcfce7" : "#f1f5f9", color: v === 100 ? "#15803d" : "#475569" }}>{cls(ck)}: {v === 100 ? "✅" : ar(v) + "٪"}{al ? " • " + AL_ST[al.st || "new"].l.split(" ")[0] : ""}</span>; })}</div>
      {[["u" + (w * 2), B.titles[w * 2], B.units[w * 2]], ["u" + (w * 2 + 1), B.titles[w * 2 + 1], B.units[w * 2 + 1]], ["t" + w, `📝 اختبار الأسبوع ${ar(w + 1)}`, B.tests[w]]].map(([slot, label, pg]) =>
        <div key={slot} className="nb-it">
          <span style={{ flex: "1 1 160px", minWidth: 0 }}>{label}</span>
          <span style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {onOpen && <button className="nb-chk" onClick={() => onOpen(pg)} title="افتح الصفحة">📖</button>}
            {cks.map(ck => { const C = obj(D[ck]); const t = C[slot]; const part = !t && slot[0] === "u" ? Math.round(unitFrac(C, book, +slot.slice(1)) * 100) : 0;
              return <button key={ck} className={"nb-chk" + (t ? " on" : "")} disabled={!editable || slot[0] === "t"} onClick={() => toggle(ck, slot)} title={t ? new Date(t).toLocaleDateString("ar-SA") : ""}>{t ? "✓ " : part ? `${ar(part)}٪ ` : ""}{cls(ck)}</button>; })}
          </span>
        </div>)}
    </div>)}
  </div>;
}

// قائمة طلاب الفصول: الدخول والاطّلاع والحل
function ClassStudents({ api, ros, idx, seen = {}, cks, books, onPick }) {
  const [ck, setCk] = useState(cks[0] || ""); const [q, setQ] = useState(""); const [only, setOnly] = useState("all");
  useEffect(() => { if (!cks.includes(ck)) setCk(cks[0] || ""); }, [cks.join()]);
  const studs = arr(ros[ck] && ros[ck].students).filter(s => s && s.id && s.name);
  const pages = (s, b) => Object.keys(obj(obj(idx[s.id])[b])).length;
  const viewed = (s, b) => Object.keys(obj(obj(obj(obj(seen[s.id]).b)[b]).p)).length;
  const weeks = (s, b) => new Set(Object.keys(obj(obj(idx[s.id])[b])).map(p => weekOfPage(b, +p)).filter(w => w >= 0)).size;
  const tot = s => books.reduce((t, b) => t + pages(s, b), 0);
  const S = s => tot(s) ? "work" : obj(seen[s.id]).at ? "look" : "no";
  const SL = { no: ["لم يدخل", "#b91c1c", "#fee2e2"], look: ["اطّلع ولم يحل", "#b45309", "#fef3c7"], work: ["يحل", "#15803d", "#dcfce7"] };
  const rows = studs.filter(s => (!q || s.name.includes(q)) && (only === "all" || S(s) === only));
  const cnt = k => studs.filter(s => S(s) === k).length;
  const csv = () => {
    const H = ["الطالب", "الفصل", "الحالة", "مرات الدخول", "آخر دخول", ...books.flatMap(b => [`${BOOKS[b].name} اطّلع`, `${BOOKS[b].name} حل`, `${BOOKS[b].name} أسابيع`])];
    const L = rows.map(s => { const x = obj(seen[s.id]); return [s.name, cls(ck), SL[S(s)][0], x.n || 0, x.at ? new Date(x.at).toLocaleDateString("ar-SA") : "—", ...books.flatMap(b => [viewed(s, b), pages(s, b), weeks(s, b)])]; });
    const t = "﻿" + [H, ...L].map(r => r.map(x => `"${String(x).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([t], { type: "text/csv;charset=utf-8" })); a.download = `مراجع_نافس_${cls(ck).replace("/", "-")}.csv`; a.click();
  };
  if (!cks.length) return <div className="nb-msg">لا توجد فصول</div>;
  return <div className="nb-book" style={{ "--c": "#7c3aed", display: "grid", gap: 8 }}>
    <div className="nb-tabs">{cks.map(c => <button key={c} className={"nb-b" + (ck === c ? " on" : "")} onClick={() => setCk(c)}>فصل {cls(c)}</button>)}</div>
    <div className="nb-kpis">
      <div className="nb-kpi" style={{ "--c": "#0f766e" }}><b>{ar(studs.length - cnt("no"))} <small style={{ fontSize: 13 }}>من {ar(studs.length)}</small></b><small>دخلوا المراجع</small><Bar v={pct(studs.length - cnt("no"), studs.length)} c="#0f766e" /></div>
      <div className="nb-kpi" style={{ "--c": "#15803d" }}><b>{ar(cnt("work"))}</b><small>يحلون في دفاترهم</small></div>
      <div className="nb-kpi" style={{ "--c": "#b45309" }}><b>{ar(cnt("look"))}</b><small>اطّلعوا ولم يحلوا</small></div>
      <div className="nb-kpi" style={{ "--c": "#b91c1c" }}><b>{ar(cnt("no"))}</b><small>لم يدخلوا بعد ({ar(studs.filter(s => !s.nh).length)} بلا هوية مربوطة)</small></div>
    </div>
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
      <input value={q} onChange={e => setQ(e.target.value)} placeholder="🔍 ابحث باسم الطالب" style={{ flex: "1 1 160px", border: "1px solid #cbd5e1", borderRadius: 10, padding: 8, font: "inherit" }} />
      {[["all", "الكل"], ["work", "يحلون"], ["look", "اطّلعوا فقط"], ["no", `لم يدخلوا (${ar(cnt("no"))})`]].map(([k, l]) => <button key={k} className={"nb-b" + (only === k ? " on" : "")} onClick={() => setOnly(k)}>{l}</button>)}
      <button className="nb-b" onClick={csv}>⬇️ Excel</button>
    </div>
    <div className="nb-tbl-w"><table className="nb-tbl"><thead><tr><th>م</th><th className="r">الطالب</th><th>الحالة</th><th>الدخول</th>{books.map(b => <th key={b} style={{ color: BOOKS[b].c }}>{BOOKS[b].name}<br /><small>اطّلع • حل • أسابيع</small></th>)}</tr></thead>
      <tbody>{rows.map((s, i) => { const x = obj(seen[s.id]); const st = SL[S(s)]; return <tr key={s.id} className="click" onClick={() => onPick({ id: s.id, name: s.name, ck })}>
        <td style={{ color: "#94a3b8" }}>{ar(i + 1)}</td>
        <td className="r">{s.name}{!s.nh && <small style={{ color: "#b91c1c" }}> • لم تُربط هويته</small>}</td>
        <td><span className="nb-st" style={{ background: st[2], color: st[1] }}>{st[0]}</span></td>
        <td style={{ color: "#64748b" }}>{x.at ? <>{when(x.at)}<br /><small>{ar(x.n || 1)} مرة</small></> : "—"}</td>
        {books.map(b => <td key={b}>{viewed(s, b) || pages(s, b) ? <>{ar(viewed(s, b))} • <b style={{ color: "#15803d" }}>{ar(pages(s, b))}</b> • {ar(weeks(s, b))}/١٥</> : <span style={{ color: "#cbd5e1" }}>—</span>}</td>)}</tr>; })}
        {!rows.length && <tr><td colSpan={books.length + 4} style={{ color: "#94a3b8", padding: 20 }}>لا يوجد طلاب مطابقون</td></tr>}
      </tbody></table></div>
    <small style={{ color: "#64748b", fontWeight: 700 }}>«اطّلع» = صفحات فتحها الطالب • «حل» = صفحات كتب فيها • اضغط اسم الطالب لفتح دفتره وسبوراته والتعليق عليها</small>
  </div>;
}

function StudentReview({ api, st, books, by, onBack }) { // يفتحه المعلم أو الإدارة فقط
  const [open, setOpen] = useState(null);
  return open ? <BookViewer api={api} book={open.book} startPage={open.page} store={`${NB}/${st.id}`} marks={`${NB_IDX}/${st.id}`} readOnly keys tc="edit" tcPath={`${NB_TC}/${st.id}`} by={by} qz={{ sid: st.id, ro: 1 }}
      boards={`${NB_B}/s_${st.id}`} boardsRO who="rv" title={st.name.split(" ").slice(0, 2).join(" ")} onBack={() => setOpen(null)} />
    : <Library api={api} student={st} books={books} readOnly onOpen={(book, page) => setOpen({ book, page })} onBack={onBack} />;
}

// ══════════════════════ صفحة المعلم: حسب تخصصه في الجدول ══════════════════════
export function NafsBooksTeacher({ api, by }) {
  const [S, setS] = useState(null);
  const [ros, setRos] = useState({}); const [idx, setIdx] = useState({}); const [seen, setSeen] = useState({}); const [tp, setTp] = useState({}); const [al, setAl] = useState({});
  const [view, setView] = useState(null);
  const [selCk, setSelCk] = useState({});
  const [man, setMan] = useState(null);
  const loadTp = async key => { const [t, a] = await Promise.all([api.maGet(`${NB_TP}/${key}`), api.maGet(NB_AL)]); setTp(obj(t)); setAl(obj(a)); };
  useEffect(() => { (async () => {
    const [T, r, i, sn] = await Promise.all([api.TT ? api.TT().catch(() => null) : null, api.maGet(api.MA_ROSTER), api.maGet(NB_IDX), api.maGet(NB_SEEN)]);
    const ti = T && T.T && api.ttFind ? api.ttFind(T, by) : -1; const name = ti >= 0 ? T.T[ti] : by;
    let assign = assignOf(T, ti); const fromTT = Object.keys(assign).length > 0;
    const key = tKey(name);
    if (!fromTT) { const m = await api.maGet(`${NB_TP}/${key}/_man`); if (m && typeof m === "object") assign = Object.fromEntries(Object.entries(m).map(([b, v]) => [b, arr(v).sort(byCk)])); else assign = lsGet(TMAN, {}) || {}; }
    setRos(obj(r)); setIdx(obj(i)); setSeen(obj(sn)); setS({ name, key, fromTT, assign }); loadTp(key);
    api.maPut(`${NB_TP}/${key}/_n`, name); api.maPut(`${NB_TP}/${key}/_at`, Date.now());
  })(); }, []);
  if (!S) return <div className="nb" style={{ minHeight: "auto", background: "transparent" }}><style>{CSS + LCSS}</style><div className="nb-msg">⏳ جارٍ قراءة جدولك…</div></div>;
  const books = BOOK_IDS.filter(b => arr(S.assign[b]).length);
  const allCks = Object.keys(ros).filter(k => k.startsWith("3-")).sort(byCk);
  const saveMan = M => { const A = Object.fromEntries(Object.entries(M).filter(([, v]) => v.length)); lsSet(TMAN, A); api.maPut(`${NB_TP}/${S.key}/_man`, Object.keys(A).length ? A : null); setS(s => ({ ...s, assign: A })); setMan(null); };
  const V = view; const back = () => { setView(null); loadTp(S.key); };
  const wrapIn = n => <div className="nb" style={{ minHeight: "auto", background: "transparent" }}><style>{CSS + LCSS}</style>{n}</div>;
  const myAl = Object.values(al).filter(a => a && a.tkey === S.key);

  if (V && V.k === "present") return wrapIn(<BookViewer api={api} book={V.book} startPage={V.page || lsGet(`nb-last-t_${S.key}-${V.book}`, 1) || 1}
    tp={{ tkey: S.key, tname: S.name, cks: S.assign[V.book], ck: V.ck, storeBase: `${NB_T}/${S.key}` }} keys boards={`${NB_B}/t_${S.key}`} who={"t_" + S.key} title="العرض والشرح" onBack={back} />);
  if (V && V.k === "plan") return wrapIn(<div className="nb-home"><div className="nb-book nb-h" style={{ "--c": BOOKS[V.book].c }}><b>🗓️ إنجازي في {BOOKS[V.book].name}</b><span className="nb-sp" /><button className="nb-b" onClick={back}>رجوع</button></div>
    <PlanGrid api={api} tkey={S.key} tname={S.name} book={V.book} cks={S.assign[V.book]} editable alerts={al} onOpen={pg => setView({ k: "present", book: V.book, ck: selCk[V.book] || S.assign[V.book][0], page: pg })} /></div>);
  if (V && V.k === "stu") return wrapIn(<StudentReview api={api} st={V.st} books={[V.book]} by={S.name} onBack={() => setView({ k: "studs", book: V.book })} />);
  if (V && (V.k === "pre" || V.k === "hw")) return wrapIn(<div className="nb-home"><div className="nb-book nb-h" style={{ "--c": BOOKS[V.book].c }}><b>{V.k === "pre" ? "🧪 الاختبار القبلي" : "📝 الواجبات والتغذية الراجعة"} – {BOOKS[V.book].name}</b><span className="nb-sp" /><button className="nb-b" onClick={back}>رجوع</button></div>
    {V.k === "pre" ? <PreClass api={api} book={V.book} cks={S.assign[V.book]} ros={ros} by={S.name} /> : <HwTeacher api={api} book={V.book} cks={S.assign[V.book]} ros={ros} tkey={S.key} tname={S.name} />}</div>);
  if (V && V.k === "qz") return wrapIn(<><div className="nb-home" style={{ paddingBottom: 0 }}><div className="nb-book nb-h" style={{ "--c": BOOKS[V.book].c }}><b>✅ الإجابات الإلكترونية – {BOOKS[V.book].name}</b><span className="nb-sp" /><button className="nb-b" onClick={back}>رجوع</button></div></div>
    <NbResults api={api} books={[V.book]} cks={S.assign[V.book]} ros={ros} by={S.name} /></>);
  if (V && V.k === "studs") return wrapIn(<div className="nb-home"><div className="nb-book nb-h" style={{ "--c": BOOKS[V.book].c }}><b>🎓 طلابي في {BOOKS[V.book].name}: الدخول والحل</b><span className="nb-sp" /><button className="nb-b" onClick={back}>رجوع</button></div>
    <ClassStudents api={api} ros={ros} idx={idx} seen={seen} cks={S.assign[V.book]} books={[V.book]} onPick={st => setView({ k: "stu", book: V.book, st })} /></div>);

  return wrapIn(<div className="nb-home">
    <div className="nb-book" style={{ "--c": "#7c3aed" }}>
      <div className="nb-h"><b>📚 مراجع نافس – {S.name}</b></div>
      <p style={{ margin: "6px 0 0", color: "#475569", fontWeight: 700, fontSize: 14 }}>
        {books.length ? <>موادك وفصولك {S.fromTT ? "حسب الجدول المدرسي" : "(اختيار يدوي)"}: {books.map(b => <span key={b} className="nb-tag" style={{ "--c": BOOKS[b].c, margin: "0 3px" }}>{BOOKS[b].name}: {S.assign[b].map(cls).join("، ")}</span>)}</>
          : "لا تظهر لك في الجدول حصص رياضيات أو علوم أو لغتي للصف الثالث المتوسط."}
      </p>
      <p style={{ margin: "6px 0 0", color: "#64748b", fontWeight: 700, fontSize: 13 }}>رابط الطلاب: <span dir="ltr" style={{ userSelect: "all" }}>{window.location.origin}/#marji</span></p>
      {!S.fromTT && <button className="nb-b" style={{ marginTop: 8 }} onClick={() => setMan(Object.fromEntries(BOOK_IDS.map(b => [b, arr(S.assign[b])])))}>✏️ اختيار موادي وفصولي يدويًا</button>}
      {man && <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
        {BOOK_IDS.map(b => <div key={b} className="nb-h" style={{ gap: 6 }}><b style={{ fontSize: 14, color: BOOKS[b].c, minWidth: 70 }}>{BOOKS[b].name}</b>
          {allCks.map(ck => <button key={ck} className={"nb-chk" + (man[b].includes(ck) ? " on" : "")} onClick={() => setMan(M => ({ ...M, [b]: M[b].includes(ck) ? M[b].filter(x => x !== ck) : [...M[b], ck].sort(byCk) }))}>{cls(ck)}</button>)}</div>)}
        <div className="nb-h"><button className="nb-b on" onClick={() => saveMan(man)}>حفظ</button><button className="nb-b" onClick={() => setMan(null)}>إلغاء</button></div>
      </div>}
    </div>
    {books.map(b => { const B = BOOKS[b], cks = S.assign[b], ck = selCk[b] || cks[0]; const C = obj(obj(tp[b])[ck]);
      const studs = arr(ros[ck] && ros[ck].students).filter(s => s && s.id); const inN = studs.filter(s => obj(seen[s.id]).at || Object.keys(obj(idx[s.id])).length).length; const solN = studs.filter(s => Object.keys(obj(obj(idx[s.id])[b])).length).length;
      const vals = Array.from({ length: 15 }, (_, w) => weekPct(C, b, w)); const nextW = vals.findIndex(v => v < 100); const last = lsGet(`nb-last-t_${S.key}-${b}`);
      const aL = myAl.filter(a => a.book === b && a.ck === ck).sort((x, y) => y.w - x.w);
      return <div key={b} className="nb-book" style={{ "--c": B.c, display: "grid", gap: 10 }}>
        <div className="nb-h"><b style={{ color: B.c, fontSize: 20 }}>{B.name}</b><span className="nb-sp" />{cks.map(c => <button key={c} className={"nb-b" + (ck === c ? " on" : "")} onClick={() => setSelCk(s => ({ ...s, [b]: c }))}>فصل {cls(c)}</button>)}</div>
        <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 12, alignItems: "center" }}>
          <Ring v={bookPct(C, b)} c={B.c} label="إنجاز الكتاب" />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 900, fontSize: 13.5, marginBottom: 4 }}>الأسابيع ({ar(weeksDone(C, b))}/١٥ مكتملة){nextW >= 0 ? ` • التالي: الأسبوع ${ar(nextW + 1)} (${ar(vals[nextW])}٪)` : " • 🎉 اكتمل الكتاب"}</div>
            <WeekBars vals={vals} c={B.c} cur={nextW} onPick={w => setView({ k: "present", book: b, ck, page: B.units[w * 2] })} />
            <small style={{ color: "#64748b", fontWeight: 800 }}>اضغط عمود أي أسبوع لفتحه • الطلاب: دخل {ar(inN)} وحلّ {ar(solN)} من {ar(studs.length)}</small>
          </div>
        </div>
        {aL.length > 0 && <div className="nb-h" style={{ gap: 6 }}>{aL.slice(0, 4).map(a => { const s = AL_ST[a.st || "new"]; return <span key={a.w} className="nb-st" style={{ background: s.bg, color: s.c }}>الأسبوع {ar(a.w + 1)}: {a.st === "new" || !a.st ? "🔔 أُبلغت الإدارة" : s.l}</span>; })}</div>}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 8 }}>
          <button className="nb-b on big" style={{ padding: 12, fontSize: 15, gridColumn: "1/-1", whiteSpace: "normal" }} onClick={() => setView({ k: "present", book: b, ck, page: nextW >= 0 ? (last && weekOfPage(b, last) === nextW ? last : B.units[nextW * 2]) : 1 })}>📽️ اعرض للشرح{nextW >= 0 ? ` — الأسبوع ${ar(nextW + 1)}` : ""}</button>
          <button className="nb-b big" style={{ padding: 12, fontSize: 15 }} onClick={() => setView({ k: "plan", book: b })}>🗓️ إنجازي (الخطة)</button>
          <button className="nb-b big" style={{ padding: 12, fontSize: 15 }} onClick={() => setView({ k: "studs", book: b })}>🎓 طلابي: الدخول والحل</button>
          <button className="nb-b big" style={{ padding: 12, fontSize: 15 }} onClick={() => setView({ k: "pre", book: b })}>🧪 الاختبار القبلي: مستوى طلابي</button>
          <button className="nb-b big" style={{ padding: 12, fontSize: 15 }} onClick={() => setView({ k: "hw", book: b })}>📝 الواجبات والتغذية الراجعة</button>
          <button className="nb-b big on" style={{ padding: 12, fontSize: 15, "--c": "#15803d" }} onClick={() => setView({ k: "qz", book: b })}>✅ الإجابات الإلكترونية والنتائج</button>
        </div>
        <small style={{ color: "#64748b", fontWeight: 700 }}>أثناء العرض: «✅ تم شرح الصفحة» يحسب الدرس والأسبوع تلقائيًا، وعند اكتمال الأسبوع تُبلَّغ الإدارة لعمل الاختبار. وسبورتك 🧑‍🏫 تُحفظ ملاحظةً على الصفحة لكل فصولك.</small>
      </div>; })}
  </div>);
}

// ══════════════════════ صفحة الإدارة ══════════════════════
export function NafsBooksAdmin({ api, by = "الإدارة", tab0 = "sum" }) {
  const [D, setD] = useState(null); const [tab, setTab] = useState(tab0); const [view, setView] = useState(null); const [alF, setAlF] = useState("act"); const [showLeft, setShowLeft] = useState("");
  const load = async () => {
    const [T, r, i, tp, tc, sn, al, op] = await Promise.all([api.TT ? api.TT().catch(() => null) : null, api.maGet(api.MA_ROSTER), api.maGet(NB_IDX), api.maGet(NB_TP), api.maGet(NB_TC), api.maGet(NB_SEEN), api.maGet(NB_AL), api.maGet(NB_OPEN)]);
    setD({ T, ros: obj(r), idx: obj(i), tp: obj(tp), tc: obj(tc), seen: obj(sn), al: obj(al), op: obj(op) });
  };
  useEffect(() => { load(); }, []);
  const wrapIn = n => <div className="nb" style={{ minHeight: "auto", background: "transparent" }}><style>{CSS + LCSS}</style>{n}</div>;
  const M = useMemo(() => {
    if (!D) return null;
    const cks = Object.keys(D.ros).filter(k => k.startsWith("3-") && arr(D.ros[k] && D.ros[k].students).length).sort(byCk);
    const studs = cks.flatMap(ck => arr(D.ros[ck].students).filter(s => s && s.id).map(s => ({ ...s, ck })));
    const pages = (sid, b) => Object.keys(obj(obj(D.idx[sid])[b])).length;
    const tcBy = {}; let tcN = 0; Object.values(D.tc).forEach(sb => Object.values(obj(sb)).forEach(bk => Object.values(obj(bk)).forEach(x => { if (x && x.t) { tcN++; tcBy[x.by] = (tcBy[x.by] || 0) + 1; } })));
    let rows = allAssign(D.T);
    const known = new Set(rows.map(r => r.key));
    Object.entries(D.tp).forEach(([key, v]) => { if (known.has(key)) return; BOOK_IDS.forEach(b => { const c = [...new Set([...Object.keys(obj(obj(v)[b])), ...arr(obj(obj(v)._man)[b])])]; if (c.length) rows.push({ name: (v && v._n) || "معلم", book: b, cks: c.sort(byCk), key, manual: true }); }); });
    rows = rows.map(r => {
      const P = obj(obj(D.tp[r.key])[r.book]);
      const per = r.cks.map(ck => ({ ck, bp: bookPct(P[ck], r.book), wd: weeksDone(P[ck], r.book), t: Object.keys(obj(P[ck])).filter(k => k[0] === "t").length, vals: Array.from({ length: 15 }, (_, w) => weekPct(P[ck], r.book, w)) }));
      const avg = Math.round(per.reduce((s, x) => s + x.bp, 0) / Math.max(1, per.length));
      const ss = studs.filter(s => r.cks.includes(s.ck)); const st = ss.filter(s => pages(s.id, r.book)).length;
      return { ...r, per, avg, n: ss.length, st, tc: tcBy[r.name] || 0, at: obj(D.tp[r.key])._at || 0 };
    });
    const alerts = Object.entries(D.al).map(([k, a]) => ({ k, ...a, st: a.st || "new" })).filter(a => a.book && BOOKS[a.book]).sort((a, b) => (a.st === "new" ? 0 : a.st === "open" ? 1 : 2) - (b.st === "new" ? 0 : b.st === "open" ? 1 : 2) || (b.at || 0) - (a.at || 0));
    const entered = studs.filter(s => obj(D.seen[s.id]).at || Object.keys(obj(D.idx[s.id])).length).length;
    return { cks, studs, pages, tcN, rows, alerts, entered };
  }, [D]);
  if (!D || !M) return wrapIn(<div className="nb-msg">⏳ جارٍ تحميل البيانات…</div>);
  const V = view; const back = () => setView(null);
  const nNew = M.alerts.filter(a => a.st === "new").length;
  const testRes = a => { const ss = M.studs.filter(s => s.ck === a.ck); const ok = ss.filter(s => testSolved(obj(D.idx[s.id])[a.book], a.book, a.w)); return { n: ss.length, ok: ok.length, left: ss.filter(s => !ok.includes(s)) }; };
  const setAl = async (a, patch, extra) => { const v = { ...D.al[a.k], ...patch }; setD(d => ({ ...d, al: { ...d.al, [a.k]: v } })); await api.maPut(`${NB_AL}/${a.k}`, v); if (extra) await extra(); };
  const openTest = a => setAl(a, { st: "open", openAt: Date.now(), by }, async () => { const v = { at: Date.now(), by }; await api.maPut(`${NB_OPEN}/${a.ck}/${a.book}/${a.w}`, v); setD(d => ({ ...d, op: { ...d.op, [a.ck]: { ...obj(d.op[a.ck]), [a.book]: { ...obj(obj(d.op[a.ck])[a.book]), [a.w]: v } } } })); });
  const closeTest = a => setAl(a, { st: "new" }, () => api.maPut(`${NB_OPEN}/${a.ck}/${a.book}/${a.w}`, null));
  const doneTest = a => { if (!window.confirm(`اعتماد تطبيق اختبار الأسبوع ${a.w + 1} لفصل ${cls(a.ck)} وإغلاقه؟`)) return; setAl(a, { st: "done", doneAt: Date.now(), by }, async () => { await api.maPut(`${NB_OPEN}/${a.ck}/${a.book}/${a.w}`, null); if (a.tkey) await api.maPut(`${NB_TP}/${a.tkey}/${a.book}/${a.ck}/t${a.w}`, Date.now()); }); };

  if (V && V.k === "book") return wrapIn(<BookViewer api={api} book={V.book} startPage={V.page || 1} keys title="تصفح الإدارة" who="adm" onBack={back} />);
  if (V && V.k === "board") return wrapIn(<BookViewer api={api} book={V.book} startPage={V.page || 1} store={`${NB_T}/${V.r.key}/${V.ck}`} readOnly keys boards={`${NB_B}/t_${V.r.key}`} boardsRO who="adm" title={`عرض ${V.r.name} • ${cls(V.ck)}`} onBack={() => setView({ k: "teacher", r: V.r })} />);
  if (V && V.k === "stu") return wrapIn(<StudentReview api={api} st={V.st} books={V.books || BOOK_IDS} by={by} onBack={() => setView(V.from || null)} />);
  if (V && V.k === "teacher") { const r = V.r, B = BOOKS[r.book]; return wrapIn(<div className="nb-home">
    <div className="nb-book nb-h" style={{ "--c": B.c }}><b>👨‍🏫 {r.name} • {B.name}</b><span className="nb-tag" style={{ "--c": B.c }}>{r.cks.map(cls).join("، ")}</span><span className="nb-sp" /><button className="nb-b" onClick={back}>رجوع</button></div>
    <div className="nb-book" style={{ "--c": B.c }}><b>📽️ صفحات العرض والسبورات (لكل فصل):</b> <div className="nb-h" style={{ marginTop: 6, gap: 6 }}>{r.cks.map(ck => <button key={ck} className="nb-b" onClick={() => setView({ k: "board", r, ck, book: r.book })}>فصل {cls(ck)}</button>)}</div></div>
    <PlanGrid api={api} tkey={r.key} tname={r.name} book={r.book} cks={r.cks} editable={false} alerts={D.al} />
    <ClassStudents api={api} ros={D.ros} idx={D.idx} seen={D.seen} cks={r.cks} books={[r.book]} onPick={st => setView({ k: "stu", st, books: [r.book], from: V })} />
  </div>); }

  const started = M.studs.filter(s => BOOK_IDS.some(b => M.pages(s.id, b))).length;
  const totalPages = M.studs.reduce((t, s) => t + BOOK_IDS.reduce((x, b) => x + M.pages(s.id, b), 0), 0);
  const AL = M.alerts.filter(a => alF === "all" || (alF === "act" ? a.st !== "done" : a.st === "done"));
  return wrapIn(<div className="nb-home">
    <div className="nb-book" style={{ "--c": "#7c3aed" }}>
      <div className="nb-h"><b>📚 مراجع نافس – متابعة الإدارة</b><span className="nb-sp" /><button className="nb-b" onClick={() => { setD(null); load(); }}>🔄 تحديث</button></div>
      <p style={{ margin: "6px 0 10px", color: "#475569", fontWeight: 700, fontSize: 13.5 }}>رابط الطلاب: <span dir="ltr" style={{ userSelect: "all" }}>{window.location.origin}/#marji</span> • المعلمون من «بوابة المعلمين» ويرى كلٌّ مادته وفصوله حسب الجدول</p>
      <div className="nb-tabs">{[["sum", "📊 الملخص"], ["week", "📅 المتابعة الأسبوعية"], ["alerts", <>🔔 الاختبارات{nNew ? <span className="nb-badge">{ar(nNew)}</span> : null}</>], ["teachers", "👨‍🏫 المعلمون"], ["pre", "🧪 القبلي"], ["hw", "📝 الواجبات"], ["qz", "✅ الإجابات الإلكترونية"], ["students", "🎓 الطلاب"], ["books", "📖 الكتب"], ["center", "🎯 مركز المتابعة والاختبار الورقي"]].map(([k, l]) => <button key={k} className={"nb-b" + (tab === k ? " on" : "")} onClick={() => setTab(k)}>{l}</button>)}</div>
    </div>

    {tab === "week" && <WeekBoard api={api} D={D} rows={M.rows} cks={M.cks} />}
    {tab === "center" && <NbCenter api={api} D={D} M={M} by={by} onStu={st => setView({ k: "stu", st, from: null })} />}
    {tab === "qz" && <NbResults api={api} books={BOOK_IDS} cks={M.cks} ros={D.ros} by={by} />}
    {tab === "pre" && BOOK_IDS.map(b => <PreClass key={b} api={api} book={b} cks={M.cks} ros={D.ros} by={by} />)}
    {tab === "hw" && BOOK_IDS.map(b => <HwTeacher key={b} api={api} book={b} cks={M.cks} ros={D.ros} admin tname={by} />)}
    {tab === "sum" && <>
      {nNew > 0 && <button className="nb-opent" style={{ "--c": "#c2410c", border: 0, cursor: "pointer", textAlign: "right", font: "inherit" }} onClick={() => setTab("alerts")}><span style={{ fontSize: 30 }}>🔔</span><div style={{ flex: 1 }}><b style={{ fontSize: 16 }}>{ar(nNew)} أسبوع اكتمل شرحه وجاهز للاختبار</b><div style={{ fontSize: 13, fontWeight: 700, opacity: .9 }}>{M.alerts.filter(a => a.st === "new").slice(0, 3).map(a => `${BOOKS[a.book].name} الأسبوع ${ar(a.w + 1)} (${cls(a.ck)})`).join(" • ")}</div></div><span className="nb-b" style={{ color: "#0f172a" }}>عرض ←</span></button>}
      <div className="nb-kpis">
        <div className="nb-kpi"><b>{ar(M.studs.length)}</b><small>طالب في الثالث المتوسط ({ar(M.cks.length)} فصول)</small></div>
        <div className="nb-kpi" style={{ "--c": "#0f766e" }}><b>{ar(M.entered)}</b><small>دخلوا المراجع ({ar(pct(M.entered, M.studs.length))}٪)</small><Bar v={pct(M.entered, M.studs.length)} c="#0f766e" /></div>
        <div className="nb-kpi" style={{ "--c": "#15803d" }}><b>{ar(started)}</b><small>يحلون في دفاترهم</small><Bar v={pct(started, M.studs.length)} c="#15803d" /></div>
        <div className="nb-kpi" style={{ "--c": "#2563eb" }}><b>{ar(totalPages)}</b><small>صفحة محلولة</small></div>
        <div className="nb-kpi" style={{ "--c": "#b45309" }}><b>{ar(M.tcN)}</b><small>تعليق من المعلمين</small></div>
        <div className="nb-kpi" style={{ "--c": "#c2410c" }}><b>{ar(M.alerts.filter(a => a.st === "done").length)}</b><small>اختبار أسبوعي طُبّق</small></div>
      </div>
      <div className="nb-book" style={{ "--c": "#334155" }}><b>الإنجاز حسب المادة والفصل</b>
        <div className="nb-tbl-w" style={{ marginTop: 8 }}><table className="nb-tbl"><thead><tr><th className="r">الفصل</th>{BOOK_IDS.map(b => <th key={b} style={{ color: BOOKS[b].c }}>{BOOKS[b].name}<br /><small>شرح المعلم • أسابيع • طلاب يحلون</small></th>)}</tr></thead>
          <tbody>{M.cks.map(ck => { const ss = M.studs.filter(s => s.ck === ck); return <tr key={ck}><td className="r">فصل {cls(ck)}</td>
            {BOOK_IDS.map(b => { const r = M.rows.find(x => x.book === b && x.cks.includes(ck)); const p = r && r.per.find(x => x.ck === ck); const st = ss.filter(s => M.pages(s.id, b)).length;
              return <td key={b}>{r ? <div style={{ display: "grid", gap: 3, justifyItems: "center" }}><div style={{ display: "flex", gap: 5, alignItems: "center" }}><Bar v={p ? p.bp : 0} c={BOOKS[b].c} w={60} /><b>{ar(p ? p.bp : 0)}٪</b></div><small style={{ color: "#64748b" }}>{r.name.split(" ")[0]} • {ar(p ? p.wd : 0)}/١٥ • {ar(st)}/{ar(ss.length)}</small></div> : <small style={{ color: "#cbd5e1" }}>لا معلم</small>}</td>; })}</tr>; })}</tbody></table></div>
      </div>
    </>}

    {tab === "alerts" && <>
      <div className="nb-book" style={{ "--c": "#c2410c" }}>
        <div className="nb-h"><b>🔔 تنبيهات الاختبارات الأسبوعية</b><span className="nb-sp" />{[["act", "الحالية"], ["done", "المطبّقة"], ["all", "الكل"]].map(([k, l]) => <button key={k} className={"nb-b" + (alF === k ? " on" : "")} onClick={() => setAlF(k)}>{l}</button>)}</div>
        <p style={{ margin: "6px 0 0", fontSize: 13, fontWeight: 700, color: "#64748b" }}>يصل التنبيه تلقائيًا عندما يُكمل المعلم شرح درسي الأسبوع لفصل. افتح الاختبار للطلاب فيظهر لهم في صفحتهم، وتابع من حلّه، ثم اعتمد التطبيق.</p>
      </div>
      {!AL.length && <div className="nb-book nb-msg" style={{ "--c": "#cbd5e1" }}>{alF === "done" ? "لم يُعتمد اختبار بعد" : "لا توجد تنبيهات حالية — تصل عند اكتمال شرح أي أسبوع"}</div>}
      {AL.map(a => { const B = BOOKS[a.book]; const s = AL_ST[a.st]; const R = testRes(a); return <div key={a.k} className={"nb-alert" + (a.st === "new" ? " new" : "")} style={{ "--c": B.c }}>
        <div className="nb-h" style={{ gap: 6 }}><span className="nb-tag" style={{ "--c": B.c }}>{B.name}</span><b style={{ fontSize: 16 }}>الأسبوع {ar(a.w + 1)} • فصل {cls(a.ck)}</b><span className="nb-st" style={{ background: s.bg, color: s.c }}>{s.l}</span><span className="nb-sp" /><small style={{ color: "#64748b", fontWeight: 800 }}>{a.t ? `أنهى الشرح: ${a.t} • ` : ""}{when(a.at)}</small></div>
        <div style={{ fontSize: 13, fontWeight: 800, color: "#475569" }}>الدرسان: {B.titles[a.w * 2]} • {B.titles[a.w * 2 + 1]}</div>
        {a.st !== "new" && <div className="nb-h" style={{ gap: 8 }}><span style={{ fontWeight: 900, fontSize: 13.5 }}>حلّه {ar(R.ok)} من {ar(R.n)} طالب</span><Bar v={pct(R.ok, R.n)} c={B.c} w={140} />{R.left.length > 0 && <button className="nb-b" onClick={() => setShowLeft(showLeft === a.k ? "" : a.k)}>من لم يحل ({ar(R.left.length)})</button>}</div>}
        {showLeft === a.k && <div style={{ fontSize: 13, fontWeight: 700, color: "#7f1d1d", background: "#fef2f2", borderRadius: 10, padding: 8, lineHeight: 1.9 }}>{R.left.map(x => x.name).join(" • ")}</div>}
        <div className="nb-h" style={{ gap: 6 }}>
          <button className="nb-b" onClick={() => setView({ k: "book", book: a.book, page: B.tests[a.w] })}>👁️ معاينة الاختبار</button>
          {a.st === "new" && <button className="nb-b on" style={{ "--c": "#1d4ed8" }} onClick={() => openTest(a)}>🚀 فتح الاختبار للطلاب</button>}
          {a.st === "open" && <button className="nb-b" onClick={() => closeTest(a)}>⏸ إيقاف الإتاحة</button>}
          {a.st !== "done" && <button className="nb-b ok" onClick={() => doneTest(a)}>✅ اعتماد التطبيق</button>}
          {a.st === "done" && <><small style={{ fontWeight: 800, color: "#15803d" }}>اعتُمد {when(a.doneAt)}{a.by ? ` • ${a.by}` : ""}</small><button className="nb-b" onClick={() => openTest(a)}>↩️ إعادة فتحه</button></>}
        </div>
      </div>; })}
    </>}

    {tab === "books" && BOOK_IDS.map(b => { const B = BOOKS[b]; return <div key={b} className="nb-book" style={{ "--c": B.c }}>
      <div className="nb-h"><b style={{ color: B.c }}>{B.name}</b><span className="nb-sp" /><button className="nb-b on" onClick={() => setView({ k: "book", book: b })}>افتح الكتاب</button></div>
      <div className="nb-weeks">{Array.from({ length: 15 }, (_, w) => <button key={w} className="nb-wk" onClick={() => setView({ k: "book", book: b, page: B.units[w * 2] })} title={`${B.titles[w * 2]} • ${B.titles[w * 2 + 1]}`}>{ar(w + 1)}<i /></button>)}</div>
    </div>; })}

    {tab === "teachers" && <div className="nb-book" style={{ "--c": "#334155" }}>
      {!M.rows.length ? <div className="nb-msg">لم يُعثر في الجدول على معلمي الرياضيات والعلوم ولغتي للصف الثالث المتوسط.</div> :
        <div className="nb-tbl-w"><table className="nb-tbl"><thead><tr><th className="r">المعلم</th><th>المادة</th><th>إنجاز الكتاب</th><th style={{ minWidth: 170 }}>الأسابيع ١ ← ١٥<br /><small>متوسط فصوله</small></th><th>اختبارات</th><th>طلاب يحلون</th><th>تعليقاته</th><th>آخر دخول</th></tr></thead>
          <tbody>{M.rows.map(r => { const vals = Array.from({ length: 15 }, (_, w) => Math.round(r.per.reduce((s, x) => s + x.vals[w], 0) / Math.max(1, r.per.length))); const al = M.alerts.filter(a => a.tkey === r.key && a.book === r.book);
            return <tr key={r.key + r.book} className="click" onClick={() => setView({ k: "teacher", r })}>
            <td className="r">{r.name}{r.manual && <small style={{ color: "#94a3b8" }}> (يدوي)</small>}<br /><small style={{ color: "#64748b" }}>{r.cks.map(cls).join("، ")}</small></td>
            <td><span className="nb-tag" style={{ "--c": BOOKS[r.book].c }}>{BOOKS[r.book].name}</span></td>
            <td><div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }}><Bar v={r.avg} c={BOOKS[r.book].c} w={60} /><b>{ar(r.avg)}٪</b></div></td>
            <td><WeekBars vals={vals} c={BOOKS[r.book].c} /></td>
            <td>{ar(al.filter(a => a.st === "done").length)}{al.filter(a => a.st === "new").length ? <span className="nb-badge">{ar(al.filter(a => a.st === "new").length)}</span> : null}</td>
            <td>{ar(r.st)}/{ar(r.n)}</td><td>{ar(r.tc)}</td><td style={{ color: "#64748b" }}>{when(r.at)}</td></tr>; })}</tbody></table></div>}
      <small style={{ color: "#64748b", fontWeight: 700 }}>اضغط اسم المعلم لرؤية خطته أسبوعًا بأسبوع وصفحات عرضه وسبوراته وحلول طلابه</small>
    </div>}

    {tab === "students" && <ClassStudents api={api} ros={D.ros} idx={D.idx} seen={D.seen} cks={M.cks} books={BOOK_IDS} onPick={st => setView({ k: "stu", st, from: null })} />}
  </div>);
}

export default function NafsBooks({ mode = "student", ...p }) {
  return mode === "admin" ? <NafsBooksAdmin {...p} /> : mode === "teacher" ? <NafsBooksTeacher {...p} /> : <NafsBooksStudent {...p} />;
}

// ════════════════════════════════════════════════════════════════════
// 🧪 الاختبار القبلي • 📝 الواجبات والتغذية الراجعة • 📅 متابعة الإدارة الأسبوعية
//   school-nafsbook-pre/{book}/{sid} = {a:[], sc, of, at, n, ck}      نتيجة الاختبار القبلي
//   school-nafsbook-prec/{book} = {closed}                              إغلاق/فتح الاختبار القبلي
//   school-nafsbook-hw/{id} = {book,u,qs:[{p,n,ty,k}],cks,due,at,by,tkey,note}   الواجب من أسئلة الدرس في المرجع
//   school-nafsbook-hwa/{id}/{sid} = {a:{i:v}, at, n, ck, fb:{i:{ok,c}}, fbAt, fbBy}  إجابات الطالب والتغذية الراجعة
// ════════════════════════════════════════════════════════════════════
const NB_PRE = "school-nafsbook-pre", NB_PREC = "school-nafsbook-prec", NB_HW = "school-nafsbook-hw", NB_HWA = "school-nafsbook-hwa";
const LETS = ["أ", "ب", "ج", "د"];
const PRE_LV = s => s >= 85 ? ["متمكّن", "#15803d", "#dcfce7"] : s >= 70 ? ["جيد جداً", "#0f766e", "#ccfbf1"] : s >= 50 ? ["متوسط", "#b45309", "#fef3c7"] : ["يحتاج دعماً", "#b91c1c", "#fee2e2"];
const qKind = ty => /اختيار/.test(ty) ? "mc" : /صواب/.test(ty) ? "tf" : "open";
const keyLet = k => { const m = String(k || "").trim().match(/^[أاإبجد]/); return m ? (m[0] === "ا" || m[0] === "إ" ? "أ" : m[0]) : ""; };
const keyTF = k => /^\s*خطأ/.test(String(k || "")) ? "خطأ" : /^\s*صواب/.test(String(k || "")) ? "صواب" : "";
const autoOk = (q, v) => { const kd = qKind(q.ty); if (kd === "mc") { const L = keyLet(q.k); return L && v ? (v === L ? 1 : 0) : null; } if (kd === "tf") { const T = keyTF(q.k); const s = v && typeof v === "object" ? v.s : v; return T && s ? (s === T ? 1 : 0) : null; } return null; };
const hwScore = (hw, sub) => { const qs = arr(hw.qs); const A = obj(sub && sub.a), FB = obj(sub && sub.fb); let ok = 0, done = 0; qs.forEach((q, i) => { const f = obj(FB[i]); const v = f.ok != null ? f.ok : autoOk(q, A[i]); if (v != null) { done++; if (+v === 1) ok++; } }); return { ok, done, of: qs.length, pct: qs.length ? Math.round(ok / qs.length * 100) : 0, full: done === qs.length }; };
// عنوان الواجب: عنوان يكتبه المعلم أو اسم الدرس • مادة بنك نافس المقابلة لكل مرجع
const hwTitle = (h, B) => (h && h.t) || (h && h.u != null && B.titles[h.u]) || "واجب";
const NQ_OF = { math: "رياضيات", sci: "علوم", ar: "لغة عربية" };
const unitOfPage = (book, p) => { for (let u = 0; u < BOOKS[book].titles.length; u++) if (unitPages(book, u).includes(p)) return u; return 0; };
const shrinkImg = file => new Promise((res, rej) => { const fr = new FileReader(); fr.onerror = rej; fr.onload = () => { const im = new Image(); im.onerror = rej; im.onload = () => { const s = Math.min(1, 900 / Math.max(im.width, im.height)); const c = document.createElement("canvas"); c.width = im.width * s; c.height = im.height * s; const g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height); g.drawImage(im, 0, 0, c.width, c.height); res(c.toDataURL("image/jpeg", .8)); }; im.src = fr.result; }; fr.readAsDataURL(file); });
// أنواع أسئلة الواجب: من أسئلة الدرس {p,n,ty,k} • سؤال يكتبه المعلم أو من نماذج نافس {c:1,t,ty,o,k,img} • حل صفحة في الدفتر {pg,ty:"حل صفحة"}
const TY_MC = "اختيار من متعدد", TY_TF = "صواب وخطأ", TY_OP = "سؤال مقالي", TY_PG = "حل صفحة";
const ansTxt = v => v == null || v === "" ? "" : typeof v === "object" ? [v.s, v.c, v.w].filter(Boolean).join(" — ") : String(v);
const ansImg = v => v && typeof v === "object" && v.im ? v.im : "";
const NQ_EXN = "school-nq-ex";
const hwQsOf = (K, book, u) => unitPages(book, u).flatMap(p => arr(obj(K[book])[p]).map((x, j) => ({ p, j, n: x[0], ty: x[1], k: x[2] }))).filter(x => /^[0-9٠-٩]+$/.test(String(x.n)) && !/تمهيد|أكمل الحل/.test(x.ty));
const wkS = (off = 0) => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - d.getDay() - off * 7); return d.getTime(); };
const wkLbl = t => { const a = new Date(t), b = new Date(t + 4 * 864e5); const f = d => d.toLocaleDateString("ar-SA-u-ca-islamic-umalqura-nu-arab", { day: "numeric", month: "long" }); return `${f(a)} – ${f(b)}`; };
const dueTxt = d => d ? new Date(d + "T12:00").toLocaleDateString("ar-SA-u-ca-islamic-umalqura-nu-arab", { weekday: "long", day: "numeric", month: "long" }) : "";
const LCSS = `
.lr-card{background:#fff;border-radius:18px;padding:14px;box-shadow:0 2px 12px rgba(15,23,42,.07);border:1px solid #eef2f6;min-width:0}
.lr-hero{border-radius:18px;padding:14px 16px;color:#fff;background:linear-gradient(135deg,var(--c,#7c3aed),color-mix(in srgb,var(--c,#7c3aed) 55%,#0f172a));display:flex;gap:12px;align-items:center;flex-wrap:wrap}
.lr-hero b{font-size:17px}.lr-hero small{display:block;opacity:.9;font-weight:700;font-size:12.5px}
.lr-q{background:#fff;border-radius:18px;padding:16px;border:2px solid #eef2f6;display:grid;gap:10px}
.lr-qt{font-size:16.5px;font-weight:900;line-height:1.9;color:#0f172a}
.lr-op{display:flex;align-items:center;gap:10px;width:100%;text-align:right;border:2px solid #e2e8f0;background:#fff;border-radius:14px;padding:11px 12px;font:inherit;font-size:15px;font-weight:800;cursor:pointer;color:#1e293b}
.lr-op b{flex:none;width:30px;height:30px;border-radius:50%;display:grid;place-items:center;background:#f1f5f9;color:#475569}
.lr-op.on{border-color:var(--c,#7c3aed);background:color-mix(in srgb,var(--c,#7c3aed) 10%,#fff)}.lr-op.on b{background:var(--c,#7c3aed);color:#fff}
.lr-op.ok{border-color:#16a34a;background:#f0fdf4}.lr-op.ok b{background:#16a34a;color:#fff}.lr-op.bad{border-color:#dc2626;background:#fef2f2}.lr-op.bad b{background:#dc2626;color:#fff}
.lr-prog{height:10px;border-radius:99px;background:#e2e8f0;overflow:hidden}.lr-prog i{display:block;height:100%;background:linear-gradient(90deg,var(--c,#7c3aed),#f59e0b);transition:width .3s}
.lr-score{display:grid;justify-items:center;gap:4px;text-align:center}.lr-score .rg{width:130px;height:130px;border-radius:50%;display:grid;place-items:center;background:conic-gradient(var(--c) calc(var(--p)*1%),#e2e8f0 0);position:relative}
.lr-score .rg::after{content:"";position:absolute;inset:12px;border-radius:50%;background:#fff}.lr-score .rg span{position:relative;z-index:1;font-size:30px;font-weight:900;color:var(--c)}
.lr-pill{display:inline-flex;align-items:center;gap:4px;border-radius:999px;padding:3px 10px;font-weight:900;font-size:12px}
.lr-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px}
.lr-k{background:#fff;border-radius:14px;padding:10px 12px;border-top:4px solid var(--c,#7c3aed);box-shadow:0 2px 8px rgba(0,0,0,.05)}.lr-k b{display:block;font-size:22px;font-weight:900}.lr-k small{font-weight:800;color:#64748b}
.lr-hm{border-collapse:collapse;font-size:12.5px;font-weight:800;width:100%}.lr-hm th,.lr-hm td{border:1px solid #eef2f6;padding:4px 5px;text-align:center;white-space:nowrap}.lr-hm th{background:#f8fafc;position:sticky;top:0}.lr-hm td.r{text-align:right}
.lr-c1{background:#dcfce7;color:#15803d}.lr-c0{background:#fee2e2;color:#b91c1c}
.lr-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:9px 4px;border-bottom:1px solid #f1f5f9}
.lr-ans{display:grid;gap:10px}.lr-aq{border:1.5px solid #e2e8f0;border-radius:14px;padding:10px 12px;display:grid;gap:7px;background:#fff}
.lr-aq h5{margin:0;font-size:14px;font-weight:900;display:flex;gap:6px;align-items:center;flex-wrap:wrap}.lr-aq h5 small{color:#64748b;font-weight:800}
.lr-lets{display:flex;gap:8px;flex-wrap:wrap}.lr-lets button{width:46px;height:46px;border-radius:50%;border:2px solid #cbd5e1;background:#fff;font:inherit;font-size:18px;font-weight:900;cursor:pointer;color:#334155}
.lr-lets button.on{background:var(--c,#7c3aed);border-color:var(--c,#7c3aed);color:#fff}.lr-lets button.ok{background:#16a34a;border-color:#16a34a;color:#fff}.lr-lets button.bad{background:#dc2626;border-color:#dc2626;color:#fff}
.lr-ta{width:100%;min-height:60px;border:1.5px solid #cbd5e1;border-radius:12px;padding:8px 10px;font:inherit;font-size:14px;font-weight:700;resize:vertical}
.lr-fb{border-radius:12px;padding:8px 10px;font-size:13px;font-weight:800;line-height:1.8}.lr-fb.ok{background:#f0fdf4;color:#166534;border:1px solid #bbf7d0}.lr-fb.bad{background:#fef2f2;color:#991b1b;border:1px solid #fecaca}.lr-fb.wait{background:#fffbeb;color:#92400e;border:1px dashed #fcd34d}
.lr-key{background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:6px 10px;font-size:13px;font-weight:800;color:#1e3a8a}
.lr-pg{width:100%;border-radius:12px;border:1px solid #e2e8f0;display:block;background:#fff}
.lr-bar{height:8px;border-radius:99px;background:#e2e8f0;overflow:hidden;min-width:60px}.lr-bar i{display:block;height:100%;background:var(--c,#16a34a)}
.lr-badge{display:inline-grid;place-items:center;min-width:20px;height:20px;border-radius:99px;background:#dc2626;color:#fff;font-size:11px;font-weight:900;padding:0 5px;margin-inline-start:4px}
.lr-tf{display:flex;gap:8px}.lr-tf button{flex:1;border:2px solid #cbd5e1;background:#fff;border-radius:12px;padding:9px;font:inherit;font-weight:900;cursor:pointer}.lr-tf button.on{background:var(--c,#7c3aed);border-color:var(--c,#7c3aed);color:#fff}
.lr-okb{display:flex;gap:6px}.lr-okb button{border:2px solid #e2e8f0;background:#fff;border-radius:10px;padding:5px 12px;font:inherit;font-weight:900;cursor:pointer}.lr-okb button.y{background:#16a34a;border-color:#16a34a;color:#fff}.lr-okb button.n{background:#dc2626;border-color:#dc2626;color:#fff}
`;
const LBar = ({ v, c = "#16a34a" }) => <div className="lr-bar" style={{ "--c": c }}><i style={{ width: Math.min(100, v || 0) + "%" }} /></div>;
const pageImgCache = {};
function PageImg({ book, p, w = 900 }) {
  const [src, setSrc] = useState(pageImgCache[book + p + w] || "");
  useEffect(() => { if (src) return; let ok = true; (async () => { try { const doc = await openDoc(book); const pg = await doc.getPage(p); const v = pg.getViewport({ scale: 1 }); const vp = pg.getViewport({ scale: w / v.width }); const c = document.createElement("canvas"); c.width = vp.width; c.height = vp.height; await pg.render({ canvasContext: c.getContext("2d"), viewport: vp }).promise; const u = c.toDataURL("image/jpeg", .82); pageImgCache[book + p + w] = u; if (ok) setSrc(u); } catch {} })(); return () => { ok = false; }; }, [book, p]);
  return src ? <img className="lr-pg" src={src} alt={`صفحة ${p}`} /> : <div className="nb-msg" style={{ padding: 30 }}>⏳ تحميل صفحة {ar(p)}…</div>;
}
const lrPrint = (title, body) => { const w = window.open("", "_blank"); if (!w) return; w.document.write(`<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>${title}</title><link href="https://fonts.googleapis.com/css2?family=Cairo:wght@600;800;900&display=swap" rel="stylesheet"><style>@page{size:A4;margin:10mm}*{-webkit-print-color-adjust:exact;print-color-adjust:exact;box-sizing:border-box}body{font-family:Cairo,Tahoma,sans-serif;color:#0f172a;margin:0}h1{font-size:18px;text-align:center;background:linear-gradient(135deg,#5b21b6,#1e3a8a);color:#fff;border-radius:99px;padding:6px 18px;display:table;margin:6px auto 10px}.sub{text-align:center;font-weight:800;color:#475569;font-size:12px;margin-bottom:8px}table{width:100%;border-collapse:collapse;font-size:11px}th{background:#1e3a8a;color:#fff;padding:5px}td{border:1px solid #cbd5e1;padding:4px;text-align:center}td.r{text-align:right;font-weight:800}.ok{background:#dcfce7;color:#15803d;font-weight:900}.no{background:#fee2e2;color:#b91c1c;font-weight:900}.k{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:10px}.k div{border:1.5px solid #e2e8f0;border-radius:10px;padding:6px;text-align:center;font-weight:800;font-size:11px}.k b{display:block;font-size:18px}.sg{display:flex;justify-content:space-around;margin-top:24px;font-weight:800;font-size:12px}</style></head><body>${body}<script>setTimeout(()=>print(),700)<\/script></body></html>`); w.document.close(); };

// ── 🧪 الاختبار القبلي للطالب
function PreTest({ api, st, book, onBack }) {
  const B = BOOKS[book]; const Q = arr(PRE[book]); const [rec, setRec] = useState(undefined); const [cfg, setCfg] = useState({}); const [i, setI] = useState(-1); const [a, setA] = useState([]); const [busy, setBusy] = useState(false); const t0 = useRef(0);
  useEffect(() => { (async () => { const [r, c] = await Promise.all([api.maGet(`${NB_PRE}/${book}/${st.id}`), api.maGet(`${NB_PREC}/${book}`)]); setRec(r && r.at ? r : null); setCfg(obj(c)); })(); }, []);
  const submit = async () => { if (a.filter(x => x != null).length < Q.length && !window.confirm("لم تُجب عن كل الأسئلة. إرسال الاختبار؟")) return; setBusy(true);
    const sc = Q.filter((q, j) => +a[j] === q.a).length; const v = { a: Q.map((_, j) => a[j] == null ? -1 : a[j]), sc, of: Q.length, at: Date.now(), n: st.name, ck: st.ck, d: Math.round((Date.now() - t0.current) / 1000) };
    await api.maPut(`${NB_PRE}/${book}/${st.id}`, v); setRec(v); setBusy(false); if (sc / Q.length >= .7) confetti(); window.scrollTo(0, 0); };
  if (rec === undefined) return <div className="nb-msg">⏳</div>;
  const hero = <div className="lr-hero" style={{ "--c": B.c }}><span style={{ fontSize: 32 }}>🧪</span><div style={{ flex: 1 }}><b>الاختبار القبلي – {B.name}</b><small>يعرّفك ويعرّف معلمك بمستواك قبل بداية الشرح</small></div><button className="nb-b" onClick={onBack}>رجوع</button></div>;
  if (rec) { const p = Math.round(rec.sc / rec.of * 100); const L = PRE_LV(p); const byT = {}; Q.forEach((q, j) => { const k = q.t; byT[k] = byT[k] || [0, 0]; byT[k][1]++; if (+obj(rec.a)[j] === q.a || arr(rec.a)[j] === q.a) byT[k][0]++; });
    return <div className="nb-home">{hero}
      <div className="lr-card lr-score" style={{ "--c": L[1], "--p": p }}><div className="rg"><span>{ar(p)}٪</span></div><b style={{ fontSize: 20 }}>درجتك: {ar(rec.sc)} من {ar(rec.of)}</b><span className="lr-pill" style={{ background: L[2], color: L[1], fontSize: 14 }}>{L[0]}</span>
        <small style={{ fontWeight: 800, color: "#64748b" }}>{p >= 70 ? "بداية قوية! ستبني على ما تعرفه 🌟" : "لا تقلق — هذا الاختبار لمعرفة نقطة البداية، ومعلمك سيركّز على ما تحتاجه 💪"}</small></div>
      <div className="lr-card"><b>📋 إجاباتك والإجابات الصحيحة</b><div className="lr-ans" style={{ marginTop: 8 }}>{Q.map((q, j) => { const v = arr(rec.a).length ? rec.a[j] : obj(rec.a)[j]; const ok = +v === q.a; return <div key={j} className="lr-aq" style={{ borderColor: ok ? "#bbf7d0" : "#fecaca" }}>
        <h5>{ok ? "✅" : "❌"} السؤال {ar(j + 1)} <small>• {q.t}</small></h5><div style={{ fontWeight: 800, lineHeight: 1.8 }}><Mth t={q.q} math={book === "math"} /></div>
        <div style={{ fontSize: 13, fontWeight: 800 }}>{v >= 0 && !ok && <span className="lr-pill lr-c0">إجابتك: {LETS[v]}) {q.o[v]}</span>} <span className="lr-pill lr-c1">الصحيحة: {LETS[q.a]}) {q.o[q.a]}</span></div></div>; })}</div></div>
    </div>; }
  if (cfg.closed) return <div className="nb-home">{hero}<div className="lr-card" style={{ textAlign: "center" }}><div style={{ fontSize: 40 }}>🔒</div><b>الاختبار القبلي مغلق حالياً</b><p style={{ color: "#64748b", fontWeight: 700 }}>سيفتحه معلمك قريباً.</p></div></div>;
  if (i < 0) return <div className="nb-home">{hero}<div className="lr-card" style={{ textAlign: "center", display: "grid", gap: 10, justifyItems: "center" }}>
    <div style={{ fontSize: 48 }}>🎯</div><b style={{ fontSize: 19 }}>{ar(Q.length)} سؤالاً من موضوعات المرجع كله</b>
    <p style={{ color: "#475569", fontWeight: 700, lineHeight: 1.9, margin: 0 }}>سؤال من كل أسبوع • محاولة واحدة • تظهر درجتك فور الإرسال مع الإجابات الصحيحة.<br />أجب بما تعرفه دون مساعدة؛ فالهدف أن يعرف معلمك من أين يبدأ معك.</p>
    <button className="nb-b on big" style={{ "--c": B.c, padding: "12px 26px", fontSize: 16 }} onClick={() => { setI(0); t0.current = Date.now(); }}>ابدأ الاختبار ←</button></div></div>;
  const q = Q[i];
  return <div className="nb-home">{hero}
    <div className="lr-card" style={{ display: "grid", gap: 6 }}><div style={{ display: "flex", justifyContent: "space-between", fontWeight: 900, fontSize: 13 }}><span>السؤال {ar(i + 1)} من {ar(Q.length)}</span><span style={{ color: "#64748b" }}>{q.t}</span></div><div className="lr-prog" style={{ "--c": B.c }}><i style={{ width: ((i + 1) / Q.length * 100) + "%" }} /></div></div>
    <div className="lr-q" style={{ "--c": B.c }}><div className="lr-qt"><Mth t={q.q} math={book === "math"} /></div>
      {q.o.map((o, j) => <button key={j} className={"lr-op" + (a[i] === j ? " on" : "")} onClick={() => setA(x => { const c = [...x]; c[i] = j; return c; })}><b>{LETS[j]}</b><span><Mth t={o} math={book === "math"} /></span></button>)}</div>
    <div style={{ display: "flex", gap: 8 }}><button className="nb-b big" disabled={i === 0} onClick={() => setI(i - 1)}>→ السابق</button><span className="nb-sp" />
      {i < Q.length - 1 ? <button className="nb-b on big" style={{ "--c": B.c }} onClick={() => setI(i + 1)}>التالي ←</button> : <button className="nb-b on big" style={{ "--c": "#16a34a" }} disabled={busy} onClick={submit}>{busy ? "⏳" : "📤 إرسال الاختبار"}</button>}</div>
    <div className="nb-h" style={{ gap: 4, justifyContent: "center" }}>{Q.map((_, j) => <button key={j} className={"nb-chk" + (a[j] != null ? " on" : "")} style={j === i ? { outline: `2px solid ${B.c}` } : null} onClick={() => setI(j)}>{ar(j + 1)}</button>)}</div>
  </div>;
}

// ── 🧪 نتائج الاختبار القبلي لفصل (للمعلم والإدارة)
function PreClass({ api, book, cks, ros, by, canToggle = true }) {
  const B = BOOKS[book]; const Q = arr(PRE[book]); const [R, setR] = useState(null); const [cfg, setCfg] = useState({}); const [ck, setCk] = useState(cks[0] || "");
  useEffect(() => { (async () => { const [r, c] = await Promise.all([api.maGet(`${NB_PRE}/${book}`), api.maGet(`${NB_PREC}/${book}`)]); setR(obj(r)); setCfg(obj(c)); })(); }, [book]);
  if (!R) return <div className="nb-msg">⏳</div>;
  const studs = arr(ros[ck] && ros[ck].students).filter(s => s && s.id); const done = studs.filter(s => R[s.id]); const left = studs.filter(s => !R[s.id]);
  const ans = (s, j) => { const r = R[s.id]; const v = arr(r.a).length ? r.a[j] : obj(r.a)[j]; return +v; };
  const avg = done.length ? Math.round(done.reduce((t, s) => t + R[s.id].sc / R[s.id].of * 100, 0) / done.length) : 0;
  const qp = Q.map((q, j) => done.length ? Math.round(done.filter(s => ans(s, j) === q.a).length / done.length * 100) : 0);
  const bands = [0, 1, 2, 3].map(k => done.filter(s => { const p = R[s.id].sc / R[s.id].of * 100; return k === 0 ? p >= 85 : k === 1 ? p >= 70 && p < 85 : k === 2 ? p >= 50 && p < 70 : p < 50; }).length);
  const weak = Q.map((q, j) => ({ q, j, v: qp[j] })).filter(x => done.length).sort((x, y) => x.v - y.v).slice(0, 4);
  const toggle = async () => { const v = cfg.closed ? null : { closed: 1, at: Date.now(), by }; await api.maPut(`${NB_PREC}/${book}`, v); setCfg(obj(v)); };
  const print = () => lrPrint("نتائج الاختبار القبلي", `<h1>نتائج الاختبار القبلي – ${B.name} – فصل ${cls(ck)}</h1><div class="sub">مراجع نافس • الصف الثالث المتوسط</div>
    <div class="k"><div><b>${ar(done.length)}/${ar(studs.length)}</b>اختبروا</div><div><b>${ar(avg)}٪</b>متوسط الفصل</div><div><b>${ar(bands[0] + bands[1])}</b>متمكّن/جيد جداً</div><div><b>${ar(bands[3])}</b>يحتاجون دعماً</div></div>
    <table><tr><th>م</th><th>الطالب</th>${Q.map((_, j) => `<th>${ar(j + 1)}</th>`).join("")}<th>الدرجة</th><th>المستوى</th></tr>${done.map((s, i) => { const p = Math.round(R[s.id].sc / R[s.id].of * 100); return `<tr><td>${ar(i + 1)}</td><td class="r">${s.name}</td>${Q.map((q, j) => `<td class="${ans(s, j) === q.a ? "ok" : "no"}">${ans(s, j) === q.a ? "✓" : "✗"}</td>`).join("")}<td><b>${ar(R[s.id].sc)}</b></td><td>${PRE_LV(p)[0]}</td></tr>`; }).join("")}
    <tr><td></td><td class="r">نسبة الإجابة الصحيحة</td>${qp.map(v => `<td style="font-weight:900">${ar(v)}٪</td>`).join("")}<td colspan="2"></td></tr></table>
    <p style="font-size:11.5px;font-weight:800">الموضوعات الأضعف: ${weak.map(x => `${x.q.t} (${ar(x.v)}٪)`).join("، ")}</p>${left.length ? `<p style="font-size:11.5px;font-weight:800;color:#b91c1c">لم يختبروا: ${left.map(s => s.name).join("، ")}</p>` : ""}<div class="sg"><span>معلم المادة: ${by || ""}</span><span>مدير المدرسة: ............</span></div>`);
  return <div className="lr-card" style={{ display: "grid", gap: 10 }}>
    <div className="nb-h" style={{ gap: 6 }}><b style={{ color: B.c }}>🧪 الاختبار القبلي – {B.name}</b><span className="nb-sp" />{cks.length > 1 && cks.map(c => <button key={c} className={"nb-b" + (ck === c ? " on" : "")} onClick={() => setCk(c)}>فصل {cls(c)}</button>)}
      {canToggle && <button className="nb-b" onClick={toggle}>{cfg.closed ? "🔓 فتح الاختبار للطلاب" : "🔒 إغلاق الاختبار"}</button>}<button className="nb-b" onClick={print}>🖨 طباعة</button></div>
    <div className="lr-grid">
      <div className="lr-k" style={{ "--c": "#7c3aed" }}><b>{ar(done.length)} <small>/ {ar(studs.length)}</small></b><small>اختبروا</small></div>
      <div className="lr-k" style={{ "--c": done.length ? PRE_LV(avg)[1] : "#94a3b8" }}><b>{done.length ? ar(avg) + "٪" : "—"}</b><small>متوسط الفصل{done.length ? " • " + PRE_LV(avg)[0] : ""}</small></div>
      {["متمكّن", "جيد جداً", "متوسط", "يحتاج دعماً"].map((l, k) => <div key={l} className="lr-k" style={{ "--c": PRE_LV([90, 75, 60, 10][k])[1] }}><b>{ar(bands[k])}</b><small>{l}</small></div>)}
    </div>
    {done.length > 0 && <div className="lr-card" style={{ background: "#fffbeb", border: "1px solid #fde68a" }}><b>💡 انطباع قبل الشرح</b><div style={{ fontWeight: 700, lineHeight: 1.9, fontSize: 13.5, marginTop: 4 }}>
      متوسط الفصل <b>{ar(avg)}٪</b> ({PRE_LV(avg)[0]}). {bands[3] ? <>يحتاج <b>{ar(bands[3])}</b> طالباً إلى دعم من البداية. </> : ""}أضعف الموضوعات: {weak.map((x, k) => <span key={k} className="lr-pill lr-c0" style={{ margin: "0 2px" }}>{x.q.t} {ar(x.v)}٪</span>)} — ركّز عليها عند شرح أسابيعها.</div></div>}
    {done.length > 0 && <div style={{ overflowX: "auto" }}><table className="lr-hm"><thead><tr><th className="r" style={{ textAlign: "right" }}>الطالب</th>{Q.map((q, j) => <th key={j} title={q.t}>{ar(j + 1)}</th>)}<th>الدرجة</th></tr></thead><tbody>
      {done.sort((x, y) => R[y.id].sc - R[x.id].sc).map(s => { const p = Math.round(R[s.id].sc / R[s.id].of * 100); return <tr key={s.id}><td className="r">{s.name}</td>{Q.map((q, j) => <td key={j} className={ans(s, j) === q.a ? "lr-c1" : "lr-c0"}>{ans(s, j) === q.a ? "✓" : "✗"}</td>)}<td><span className="lr-pill" style={{ background: PRE_LV(p)[2], color: PRE_LV(p)[1] }}>{ar(R[s.id].sc)}/{ar(R[s.id].of)}</span></td></tr>; })}
      {done.length > 0 && <tr><td className="r" style={{ background: "#f8fafc" }}>٪ الإجابة الصحيحة</td>{qp.map((v, j) => <td key={j} style={{ background: v >= 70 ? "#dcfce7" : v >= 50 ? "#fef3c7" : "#fee2e2" }}>{ar(v)}</td>)}<td /></tr>}
    </tbody></table></div>}
    {!done.length && <div className="nb-msg">لم يختبر أحد من هذا الفصل بعد — رابط الطلاب: <span dir="ltr">{window.location.origin}/#marji</span></div>}
    {left.length > 0 && <div style={{ fontSize: 13, fontWeight: 800, color: "#b91c1c" }}>⏳ لم يختبروا ({ar(left.length)}): <span style={{ color: "#475569" }}>{left.map(s => s.name.split(" ").slice(0, 2).join(" ")).join("، ")}</span></div>}
  </div>;
}

// ── 📝 الواجب: حل الطالب ونتيجته والتغذية الراجعة
function HwDo({ api, st, hw, onBack, onOpenPage }) {
  const DK = `nb-hwd-${hw.id}-${st.id}`;
  const B = BOOKS[hw.book]; const qs = arr(hw.qs); const [sub, setSub] = useState(undefined); const [a, setA0] = useState(() => obj(lsGet(DK, {}))); const [busy, setBusy] = useState(false); const [showP, setShowP] = useState(true); const [solved, setSolved] = useState({});
  const setA = f => setA0(x => { const n = typeof f === "function" ? f(x) : f; lsSet(DK, n); return n; });
  useEffect(() => { api.maGet(`${NB_HWA}/${hw.id}/${st.id}`).then(r => { setSub(r && r.at ? r : null); if (r && r.a) setA0(obj(r.a)); }); if (qs.some(q => q.pg)) api.maGet(`${NB_IDX}/${st.id}/${hw.book}`).then(d => setSolved(obj(d))); }, []);
  const send = async () => { qs.forEach((q, i) => { if (q.pg && solved[q.pg] && !a[i]) a[i] = { pg: 1 }; }); const n = qs.filter((_, i) => { const v = a[i]; return v != null && v !== "" && !(typeof v === "object" && !v.s && !v.w && !v.im && !v.pg); }).length; if (n < qs.length && !window.confirm(`أجبت عن ${n} من ${qs.length}. إرسال الواجب؟`)) return; setBusy(true);
    const v = { a, at: Date.now(), n: st.name, ck: st.ck }; await api.maPut(`${NB_HWA}/${hw.id}/${st.id}`, v); setSub(v); setBusy(false); try { localStorage.removeItem(DK); } catch {} const s = hwScore(hw, v); if (s.ok / Math.max(1, s.done) >= .7) confetti(); window.scrollTo(0, 0); };
  if (sub === undefined) return <div className="nb-msg">⏳</div>;
  const S = sub ? hwScore(hw, sub) : null; const pages = [...new Set(qs.filter(q => q.p && !q.c).map(q => q.p))];
  return <div className="nb-home">
    <div className="lr-hero" style={{ "--c": B.c }}><span style={{ fontSize: 30 }}>📝</span><div style={{ flex: 1 }}><b>واجب {B.name}: {hwTitle(hw, B)}</b><small>{hw.due ? `آخر موعد: ${dueTxt(hw.due)}` : ""}{hw.by ? ` • أ. ${hw.by}` : ""}</small></div><button className="nb-b" onClick={onBack}>رجوع</button></div>
    {hw.note && <div className="lr-card" style={{ background: "#eff6ff" }}>💬 <b>توجيه المعلم:</b> {hw.note}</div>}
    {S && <div className="lr-card lr-score" style={{ "--c": S.full ? PRE_LV(S.pct)[1] : "#7c3aed", "--p": S.done ? Math.round(S.ok / S.done * 100) : 0 }}>
      <div className="rg"><span>{ar(S.ok)}/{ar(S.full ? S.of : S.done)}</span></div>
      <b style={{ fontSize: 17 }}>{S.full ? `نتيجتك النهائية: ${ar(S.ok)} من ${ar(S.of)} (${ar(S.pct)}٪)` : `صُحّح آلياً ${ar(S.done)} من ${ar(S.of)} — أصبت ${ar(S.ok)}`}</b>
      {!S.full && <span className="lr-pill" style={{ background: "#fef3c7", color: "#92400e" }}>⏳ {ar(S.of - S.done)} سؤال بانتظار تصحيح المعلم</span>}{sub.fbAt && <small style={{ fontWeight: 800, color: "#16a34a" }}>✅ صحّح المعلم واجبك</small>}</div>}
    {pages.length > 0 && <div className="lr-card"><button className="nb-b" onClick={() => setShowP(v => !v)}>📖 {showP ? "إخفاء" : "عرض"} صفحات الدرس ({ar(pages.length)})</button>
      {showP && <div style={{ display: "grid", gap: 8, marginTop: 8 }}>{pages.map(p => <PageImg key={p} book={hw.book} p={p} />)}</div>}</div>}
    <div className="lr-card"><b>✍️ ورقة الإجابة</b><div className="lr-ans" style={{ marginTop: 8, "--c": B.c }}>{qs.map((q, i) => { const kd = qKind(q.ty); const v = a[i]; const f = obj(obj(sub && sub.fb)[i]); const au = sub ? autoOk(q, v) : null; const res = f.ok != null ? +f.ok : au;
      return <div key={i} className="lr-aq" style={sub && res != null ? { borderColor: res ? "#86efac" : "#fca5a5" } : null}>
        <h5>{sub && res != null ? (res ? "✅" : "❌") : sub ? "⏳" : "❓"} {q.pg ? `حل صفحة ${ar(q.pg)} في دفترك` : `السؤال ${ar(q.c ? i + 1 : q.n)}`} <small>{q.p && !q.c ? `• صفحة ${ar(q.p)} ` : ""}• {q.ty}</small></h5>
        {q.t && <div style={{ fontWeight: 800, fontSize: 15, lineHeight: 1.9, whiteSpace: "pre-wrap" }}><Mth t={q.t} math={isM(B)} /></div>}{q.img && <img src={q.img} alt="" style={{ maxWidth: "100%", borderRadius: 10, border: "1px solid #e2e8f0" }} />}
        {q.pg ? <div style={{ display: "grid", gap: 6 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>{!sub && onOpenPage && <button className="nb-b on" style={{ "--c": B.c }} onClick={() => onOpenPage(q.pg)}>✍️ افتح الصفحة وحلّ في دفترك</button>}
            {solved[q.pg] ? <span className="lr-pill" style={{ background: "#dcfce7", color: "#15803d" }}>✓ يوجد حل في هذه الصفحة</span> : <span className="lr-pill" style={{ background: "#fef3c7", color: "#92400e" }}>لم تحل في الصفحة بعد</span>}</div>
          {!sub && <label className="nb-chk" style={{ justifySelf: "start", cursor: "pointer" }}><input type="checkbox" checked={!!(v && v.pg)} onChange={e => setA(x => ({ ...x, [i]: e.target.checked ? { ...obj(x[i]), pg: 1 } : null }))} /> حللت الصفحة</label>}
        </div> : null}
        {kd === "mc" && <div className="lr-lets" style={q.o ? { display: "grid", gridTemplateColumns: "1fr", gap: 6 } : null}>{LETS.slice(0, q.o ? Math.max(2, q.o.filter(Boolean).length) : 4).map((L, j) => <button key={L} disabled={!!sub} style={q.o ? { width: "100%", height: "auto", minHeight: 44, borderRadius: 14, textAlign: "right", padding: "8px 14px", fontSize: 15 } : null} className={(v === L ? (sub ? (res ? "ok" : "bad") : "on") : sub && keyLet(q.k) === L ? "ok" : "")} onClick={() => setA(x => ({ ...x, [i]: L }))}>{L}{q.o ? <>) <Mth t={q.o[j] || ""} math={isM(B)} /></> : ""}</button>)}</div>}
        {kd === "tf" && <><div className="lr-tf">{["صواب", "خطأ"].map(L => <button key={L} disabled={!!sub} className={obj(v).s === L ? "on" : ""} onClick={() => setA(x => ({ ...x, [i]: { ...obj(x[i]), s: L } }))}>{L === "صواب" ? "✔ صواب" : "✘ خطأ"}</button>)}</div>
          {obj(v).s === "خطأ" && <input className="lr-ta" style={{ minHeight: 0 }} disabled={!!sub} placeholder="التصحيح…" value={obj(v).c || ""} onChange={e => setA(x => ({ ...x, [i]: { ...obj(x[i]), c: e.target.value } }))} />}</>}
        {kd === "open" && !q.pg && <textarea className="lr-ta" disabled={!!sub} placeholder="اكتب إجابتك…" value={typeof v === "object" && v ? v.w || "" : v || ""} onChange={e => setA(x => { const o = x[i]; return { ...x, [i]: o && typeof o === "object" ? { ...o, w: e.target.value } : e.target.value }; })} />}
        {kd === "open" && q.pg && !sub && <input className="lr-ta" style={{ minHeight: 0 }} placeholder="ملاحظة للمعلم (اختياري)…" value={(v && v.w) || ""} onChange={e => setA(x => ({ ...x, [i]: { ...obj(x[i]), w: e.target.value } }))} />}
        {kd === "open" && (ansImg(v) ? <img src={ansImg(v)} alt="" style={{ maxWidth: "100%", maxHeight: 300, borderRadius: 10 }} /> : null)}
        {kd === "open" && !sub && <label className="nb-chk" style={{ justifySelf: "start", cursor: "pointer" }}>📷 {ansImg(v) ? "تغيير صورة الحل" : "أرفق صورة حلّك من الدفتر الورقي"}<input type="file" accept="image/*" capture="environment" hidden onChange={async e => { const f = e.target.files[0]; e.target.value = ""; if (!f) return; const im = await shrinkImg(f); setA(x => { const o = x[i]; return { ...x, [i]: { ...(o && typeof o === "object" ? o : o ? { w: o } : {}), im } }; }); }} /></label>}
        {sub && (res != null || f.c) && <div className={"lr-fb " + (res ? "ok" : res === 0 ? "bad" : "wait")}>{res ? "أحسنت! إجابة صحيحة 🌟" : res === 0 ? "إجابة غير صحيحة" : ""}{(res === 0 || f.ok != null) && <div className="lr-key">🔑 الإجابة النموذجية: <Mth t={q.k} math={isM(B)} /></div>}{f.c && <div>💬 المعلم: {f.c}</div>}</div>}
        {sub && res == null && !f.c && <div className="lr-fb wait">⏳ بانتظار تصحيح المعلم وتغذيته الراجعة</div>}
      </div>; })}</div>
      {!sub && <button className="nb-b on big" style={{ "--c": "#16a34a", width: "100%", marginTop: 10, padding: 12, fontSize: 16 }} disabled={busy} onClick={send}>{busy ? "⏳" : "📤 إرسال الواجب"}</button>}</div>
  </div>;
}

// ── واجبات الطالب ونتيجة الاختبار القبلي (تظهر في مكتبته)
function StudentLearn({ api, st, onPre, onHw }) {
  const [D, setD] = useState(null);
  useEffect(() => { (async () => { const [hw, ...pre] = await Promise.all([api.maGet(NB_HW), ...BOOK_IDS.map(b => api.maGet(`${NB_PRE}/${b}/${st.id}`))]);
    const L = Object.values(obj(hw)).filter(h => h && h.id && arr(h.cks).includes(st.ck)).sort((x, y) => (y.at || 0) - (x.at || 0)).slice(0, 12);
    const subs = await Promise.all(L.map(h => api.maGet(`${NB_HWA}/${h.id}/${st.id}`)));
    setD({ hw: L.map((h, i) => ({ h, s: subs[i] && subs[i].at ? subs[i] : null })), pre: Object.fromEntries(BOOK_IDS.map((b, i) => [b, pre[i] && pre[i].at ? pre[i] : null])) }); })(); }, []);
  const SK = `nb-hw-seen-${st.id}`; const [seen, setSeen] = useState(() => arr(lsGet(SK, [])));
  if (!D) return null; const pend = D.hw.filter(x => !x.s); const today = new Date().toISOString().slice(0, 10);
  const fresh = pend.filter(x => !seen.includes(x.h.id) && !(x.h.due && x.h.due < today));
  const markSeen = () => { const n = [...new Set([...seen, ...pend.map(x => x.h.id)])]; lsSet(SK, n); setSeen(n); };
  return <div className="nb-book" style={{ "--c": "#0f766e", display: "grid", gap: 8 }}>
    {fresh.length > 0 && <div style={{ position: "fixed", inset: 0, zIndex: 120, background: "rgba(15,23,42,.6)", display: "grid", placeItems: "center", padding: 14 }} onClick={markSeen}><div onClick={e => e.stopPropagation()} style={{ width: "min(440px,100%)", background: "#fff", borderRadius: 24, padding: 18, textAlign: "center", boxShadow: "0 30px 60px -20px #000" }}>
      <div style={{ fontSize: 46, animation: "nbBell 1s ease-in-out 3" }}>🔔</div>
      <b style={{ fontSize: 19, display: "block" }}>{fresh.length > 1 ? `لديك ${ar(fresh.length)} واجبات جديدة` : "لديك واجب جديد"}</b>
      <div style={{ display: "grid", gap: 6, margin: "12px 0" }}>{fresh.slice(0, 4).map(({ h }) => { const B = BOOKS[h.book]; return <div key={h.id} style={{ border: `1.5px solid ${B.c}55`, borderRadius: 14, padding: "8px 10px", textAlign: "right" }}><b style={{ color: B.c }}>📝 {B.name}: {hwTitle(h, B)}</b><div style={{ fontSize: 12.5, fontWeight: 800, color: "#64748b" }}>{h.by ? `أ. ${h.by}` : ""}{h.due ? ` • حتى ${dueTxt(h.due)}` : ""}</div></div>; })}</div>
      <div style={{ display: "flex", gap: 8, justifyContent: "center" }}><button className="nb-b on big" style={{ "--c": "#16a34a" }} onClick={() => { markSeen(); onHw(fresh[0].h); }}>✍️ ابدأ الحل الآن</button><button className="nb-b big" onClick={markSeen}>لاحقًا</button></div>
    </div><style>{"@keyframes nbBell{0%,100%{transform:rotate(0)}25%{transform:rotate(-18deg)}75%{transform:rotate(18deg)}}"}</style></div>}
    {api.PushBell ? <api.PushBell who={{ uid: "s_" + st.id, n: st.name, r: "s", ck: st.ck }} /> : null}
    {pend.length > 0 && <button onClick={() => onHw(pend[0].h)} style={{ display: "flex", alignItems: "center", gap: 10, border: 0, borderRadius: 16, padding: "12px 14px", background: "linear-gradient(135deg,#f59e0b,#ea580c)", color: "#fff", font: "inherit", cursor: "pointer", textAlign: "right", boxShadow: "0 12px 24px -14px #ea580c" }}><span style={{ fontSize: 26 }}>🔔</span><span style={{ flex: 1 }}><b style={{ fontSize: 16 }}>لديك {ar(pend.length)} {pend.length > 1 ? "واجبات" : "واجب"} لم تُسلَّم بعد</b><small style={{ display: "block", fontWeight: 800, opacity: .95 }}>أقربها: {BOOKS[pend[0].h.book].name} — {hwTitle(pend[0].h, BOOKS[pend[0].h.book])}</small></span><b>حل الآن ←</b></button>}
    <b style={{ fontSize: 16 }}>🎯 اختباراتي القبلية وواجباتي</b>
    <div className="lr-grid">{BOOK_IDS.map(b => { const r = D.pre[b]; const p = r ? Math.round(r.sc / r.of * 100) : 0; return <button key={b} className="lr-k" style={{ "--c": BOOKS[b].c, cursor: "pointer", font: "inherit", textAlign: "right", border: 0 }} onClick={() => onPre(b)}>
      <small style={{ color: BOOKS[b].c }}>🧪 القبلي – {BOOKS[b].name}</small>{r ? <b style={{ color: PRE_LV(p)[1] }}>{ar(r.sc)}/{ar(r.of)} <small style={{ fontSize: 12 }}>{PRE_LV(p)[0]}</small></b> : <b style={{ fontSize: 15, color: "#7c3aed" }}>ابدأ الاختبار ←</b>}</button>; })}</div>
    {D.hw.length > 0 && <div style={{ display: "grid", gap: 6 }}><b style={{ fontSize: 14 }}>📝 الواجبات {pend.length ? <span className="lr-badge">{ar(pend.length)}</span> : null}</b>
      {D.hw.map(({ h, s }) => { const B = BOOKS[h.book]; const S = s ? hwScore(h, s) : null; const late = !s && h.due && h.due < new Date().toISOString().slice(0, 10);
        return <button key={h.id} className="lr-row" style={{ border: `1.5px solid ${s ? "#bbf7d0" : late ? "#fecaca" : "#e2e8f0"}`, borderRadius: 12, background: "#fff", font: "inherit", cursor: "pointer", textAlign: "right" }} onClick={() => onHw(h)}>
          <span style={{ fontSize: 22 }}>{s ? (S.full ? "✅" : "⏳") : "📝"}</span><div style={{ flex: 1, minWidth: 0 }}><b style={{ color: B.c }}>{B.name}: {hwTitle(h, B)}</b><div style={{ fontSize: 12, fontWeight: 800, color: "#64748b" }}>{ar(arr(h.qs).length)} أسئلة{h.due ? ` • حتى ${dueTxt(h.due)}` : ""}</div></div>
          {s ? <span className="lr-pill" style={{ background: S.full ? PRE_LV(S.pct)[2] : "#fef3c7", color: S.full ? PRE_LV(S.pct)[1] : "#92400e" }}>{S.full ? `${ar(S.ok)}/${ar(S.of)}` : "بانتظار التصحيح"}</span> : <span className="lr-pill" style={{ background: late ? "#fee2e2" : "#ede9fe", color: late ? "#b91c1c" : "#6d28d9" }}>{late ? "متأخر — حلّه الآن" : "حلّ الواجب ←"}</span>}</button>; })}</div>}
  </div>;
}

// ── 📝 واجبات المعلم: إنشاء من أسئلة الدرس • نتائج الفصل • التصحيح والتغذية الراجعة
function HwTeacher({ api, book, cks, ros, tkey, tname, admin }) {
  const B = BOOKS[book]; const [L, setL] = useState(null); const [K, setK] = useState(null); const [ed, setEd] = useState(null); const [open, setOpen] = useState(null); const [subs, setSubs] = useState({}); const [gr, setGr] = useState(null); const [msg, setMsg] = useState("");
  const [bv, setBv] = useState(null); const [nq, setNq] = useState(null);
  const toast = t => { setMsg(t); setTimeout(() => setMsg(""), 2600); };
  const load = async () => { const h = obj(await api.maGet(NB_HW)); setL(Object.values(h).filter(x => x && x.id && x.book === book && (admin || x.tkey === tkey) && arr(x.cks).some(c => cks.includes(c))).sort((a, b) => (b.at || 0) - (a.at || 0))); };
  useEffect(() => { load(); loadKeys().then(setK).catch(() => setK({})); }, [book]);
  const loadSubs = async id => { const s = obj(await api.maGet(`${NB_HWA}/${id}`)); setSubs(x => ({ ...x, [id]: s })); };
  if (!L || !K) return <div className="nb-msg">⏳</div>;
  const startNew = () => { const u = 0; setEd({ u, cks: [cks[0]], due: "", note: "", t: "", sel: hwQsOf(K, book, u).map((_, i) => i), src: "book", ex: [], cq: null }); };
  const edQs = ed ? hwQsOf(K, book, ed.u) : [];
  const loadNq = async () => { setNq("busy"); const d = obj(await api.maGet(NQ_EXN)); const L = Object.values(d).filter(x => x && x.id && arr(x.subjects).length).sort((a, b) => (b.at || 0) - (a.at || 0)); setNq({ L, ex: null, sel: [] }); };
  const addEx = items => setEd(e => ({ ...e, ex: [...e.ex, ...items] }));
  const save = async () => { if (!ed.cks.length) return toast("اختر فصلاً"); const qs = [...edQs.filter((_, i) => ed.sel.includes(i)).map(q => ({ p: q.p, n: q.n, ty: q.ty, k: q.k })), ...ed.ex.map((q, i) => ({ ...q, n: q.pg ? q.pg : edQs.filter((_, j) => ed.sel.includes(j)).length + i + 1 }))]; if (!qs.length) return toast("أضف سؤالاً أو صفحة واحدة على الأقل");
    const id = "h" + Date.now().toString(36); const v = { id, book, u: ed.u, qs, cks: ed.cks, due: ed.due, note: ed.note.trim(), ...(ed.t.trim() ? { t: ed.t.trim() } : {}), at: Date.now(), by: tname, tkey };
    await api.maPut(`${NB_HW}/${id}`, v); setEd(null); await load(); toast("✅ نُشر الواجب للطلاب");
    if (api.push) api.push({ to: { cls: ed.cks }, title: "📝 واجب جديد – " + B.name, body: hwTitle(v, B) + (v.due ? " • حتى " + dueTxt(v.due) : ""), url: "/#marji", urlS: "/#marji", tag: "hw-" + id, by: tname }); };
  const del = async h => { if (!window.confirm("حذف الواجب وإجابات الطلاب عليه؟")) return; await api.maPut(`${NB_HW}/${h.id}`, null); await api.maPut(`${NB_HWA}/${h.id}`, null); setOpen(null); load(); };
  // التصحيح
  if (bv) return <BookViewer api={api} book={book} startPage={bv.page} store={`${NB}/${bv.st.id}`} marks={`${NB_IDX}/${bv.st.id}`} readOnly keys tc="edit" tcPath={`${NB_TC}/${bv.st.id}`} by={tname}
      boards={`${NB_B}/s_${bv.st.id}`} boardsRO who="rv" title={bv.st.name.split(" ").slice(0, 2).join(" ")} onBack={() => setBv(null)} />;
  if (gr) { const h = gr.h, s = gr.s, sid = gr.sid; const qs = arr(h.qs); const fb = gr.fb;
    const setF = (i, k, v) => setGr(g => ({ ...g, fb: { ...g.fb, [i]: { ...obj(g.fb[i]), [k]: v } } }));
    const saveFb = async () => { const v = { ...s, fb: gr.fb, fbAt: Date.now(), fbBy: tname }; await api.maPut(`${NB_HWA}/${h.id}/${sid}`, v); if (api.push) api.push({ to: { uids: ["s_" + sid] }, title: "✅ صحّح المعلم واجبك", body: B.name + ": " + hwTitle(h, B), url: "/#marji", urlS: "/#marji", tag: "fb-" + h.id, by: tname }); setSubs(x => ({ ...x, [h.id]: { ...obj(x[h.id]), [sid]: v } })); setGr(null); toast("✅ حُفظ التصحيح ووصلت التغذية الراجعة للطالب"); };
    return <div className="lr-card" style={{ display: "grid", gap: 8, "--c": B.c }}>
      <div className="nb-h"><b>✍️ تصحيح واجب {s.n}</b><span className="nb-sp" /><button className="nb-b" onClick={() => setGr(null)}>رجوع</button></div>
      {qs.map((q, i) => { const v = obj(s.a)[i]; const au = autoOk(q, v); const f = obj(fb[i]); const cur = f.ok != null ? +f.ok : au;
        return <div key={i} className="lr-aq" style={{ borderColor: cur === 1 ? "#86efac" : cur === 0 ? "#fca5a5" : "#e2e8f0" }}>
          <h5>{q.pg ? `📖 حل صفحة ${ar(q.pg)} في الدفتر` : `السؤال ${ar(i + 1)}`} <small>{q.p ? `• صفحة ${ar(q.p)} ` : ""}• {q.ty}{au != null ? " • صُحّح آلياً" : ""}</small></h5>
          {q.t && <div style={{ fontWeight: 800, whiteSpace: "pre-wrap" }}><Mth t={q.t} math={isM(B)} /></div>}{q.img && <img src={q.img} alt="" style={{ maxWidth: "100%", maxHeight: 220, borderRadius: 10 }} />}
          {q.pg ? <button className="nb-b on" style={{ justifySelf: "start" }} onClick={() => setBv({ st: { id: sid, name: s.n, ck: s.ck }, page: q.pg })}>📖 افتح دفتر الطالب على صفحة {ar(q.pg)}</button> : null}
          <div style={{ fontWeight: 800 }}>إجابة الطالب: <span style={{ color: "#1e3a8a" }}>{q.pg ? (v ? "✅ أفاد أنه حلّ الصفحة في دفتره" : "— لم يحل —") + (v && v.w ? " • " + v.w : "") : ansTxt(v) || "— لم يُجب —"}{q.o && LETS.indexOf(v) >= 0 ? ` (${q.o[LETS.indexOf(v)]})` : ""}</span></div>
          {ansImg(v) && <img src={ansImg(v)} alt="حل الطالب" style={{ maxWidth: "100%", maxHeight: 360, borderRadius: 10, border: "1px solid #e2e8f0" }} />}
          {q.k && <div className="lr-key">🔑 النموذجية: <Mth t={q.k} math={isM(B)} /></div>}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}><div className="lr-okb"><button className={cur === 1 ? "y" : ""} onClick={() => setF(i, "ok", 1)}>✔ صحيحة</button><button className={cur === 0 ? "n" : ""} onClick={() => setF(i, "ok", 0)}>✘ خاطئة</button></div>
            <input className="lr-ta" style={{ minHeight: 0, flex: 1, minWidth: 180 }} placeholder="💬 تغذية راجعة للطالب (اختياري)…" value={f.c || ""} onChange={e => setF(i, "c", e.target.value)} />
            <span style={{ display: "flex", gap: 4 }}>{["أحسنت 🌟", "راجع الخطوات", "انتبه للإشارة", "اقرأ السؤال جيداً"].map(t => <button key={t} className="nb-chk" onClick={() => setF(i, "c", t)}>{t}</button>)}</span></div>
        </div>; })}
      <button className="nb-b on big" style={{ "--c": "#16a34a", padding: 12 }} onClick={saveFb}>💾 اعتماد التصحيح وإرسال التغذية الراجعة</button>
    </div>; }
  if (ed) return <div className="lr-card" style={{ display: "grid", gap: 10, "--c": B.c }}>
    <div className="nb-h"><b>➕ واجب جديد – {B.name}</b><span className="nb-sp" /><button className="nb-b" onClick={() => setEd(null)}>إلغاء</button></div>
    <label style={{ fontWeight: 900, fontSize: 13 }}>عنوان الواجب (اختياري)<input className="lr-ta" style={{ minHeight: 0 }} value={ed.t} onChange={e => setEd({ ...ed, t: e.target.value })} placeholder="مثال: واجب حل المعادلات — يُكتب تلقائيًا من اسم الدرس إن تُرك" /></label>
    <label style={{ fontWeight: 900, fontSize: 13 }}>الدرس (من موضوعات المرجع)<select className="lr-ta" style={{ minHeight: 0 }} value={ed.u} onChange={e => { const u = +e.target.value; setEd({ ...ed, u, sel: hwQsOf(K, book, u).map((_, i) => i) }); }}>{B.titles.map((t, u) => <option key={u} value={u}>الأسبوع {ar(Math.floor(u / 2) + 1)} • {t} (ص {ar(unitPages(book, u)[0])}–{ar(unitPages(book, u).slice(-1)[0])})</option>)}</select></label>
    <div><b style={{ fontSize: 13 }}>الفصول:</b> {cks.map(c => <button key={c} className={"nb-chk" + (ed.cks.includes(c) ? " on" : "")} onClick={() => setEd({ ...ed, cks: ed.cks.includes(c) ? ed.cks.filter(x => x !== c) : [...ed.cks, c] })}>{cls(c)}</button>)}</div>
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><label style={{ fontWeight: 900, fontSize: 13 }}>آخر موعد للتسليم<input type="date" className="lr-ta" style={{ minHeight: 0 }} value={ed.due} onChange={e => setEd({ ...ed, due: e.target.value })} /></label>
      <label style={{ fontWeight: 900, fontSize: 13, flex: 1, minWidth: 200 }}>توجيه للطلاب (اختياري)<input className="lr-ta" style={{ minHeight: 0 }} value={ed.note} onChange={e => setEd({ ...ed, note: e.target.value })} placeholder="مثال: حلّ في دفترك أولاً ثم أدخل الإجابات" /></label></div>
    <div className="nb-h" style={{ gap: 6 }}>{[["book", "📘 من أسئلة الدرس"], ["page", "📖 صفحات يحلها في دفتره"], ["write", "✍️ أكتب أسئلتي"], ["nq", "🎯 من نماذج نافس"]].map(([k, l]) => <button key={k} className={"nb-chk" + (ed.src === k ? " on" : "")} style={{ padding: "7px 12px", fontSize: 13 }} onClick={() => { setEd({ ...ed, src: k }); if (k === "nq" && !nq) loadNq(); }}>{l}</button>)}</div>
    {ed.src === "page" && <div style={{ border: "1.5px dashed #cbd5e1", borderRadius: 12, padding: 10, display: "grid", gap: 6 }}>
      <b style={{ fontSize: 13 }}>اختر الصفحات التي يحلها الطالب في دفتره الإلكتروني (من صفحات هذا الدرس)</b>
      <div className="nb-h" style={{ gap: 4 }}>{unitPages(book, ed.u).map(p => { const on = ed.ex.some(q => q.pg === p); return <button key={p} className={"nb-chk" + (on ? " on" : "")} onClick={() => setEd(e => ({ ...e, ex: on ? e.ex.filter(q => q.pg !== p) : [...e.ex, { pg: p, ty: TY_PG }] }))}>ص {ar(p)}</button>; })}</div>
      <small style={{ color: "#64748b", fontWeight: 700 }}>يفتح الطالب الصفحة من الواجب ويحل في فراغاتها، ثم يضغط «إرسال». وتفتح أنت دفتره على الصفحة نفسها للتصحيح والتعليق.</small>
    </div>}
    {ed.src === "write" && (() => { const q = ed.cq || { ty: TY_MC, t: "", o: ["", "", "", ""], k: 0, img: "" }; const setQ = o => setEd(e => ({ ...e, cq: { ...q, ...o } }));
      const addQ = () => { if (!q.t.trim() && !q.img) return toast("اكتب نص السؤال"); if (q.ty === TY_MC && q.o.filter(x => x.trim()).length < 2) return toast("اكتب خيارين على الأقل"); const it = { c: 1, t: q.t.trim(), ty: q.ty, ...(q.img ? { img: q.img } : {}) };
        if (q.ty === TY_MC) { it.o = q.o.map(x => x.trim()); it.k = `${LETS[q.k]} ${it.o[q.k] || ""}`.trim(); } else if (q.ty === TY_TF) it.k = q.k ? "خطأ" : "صواب"; else if (q.mk && q.mk.trim()) it.k = q.mk.trim();
        setEd(e => ({ ...e, ex: [...e.ex, it], cq: { ty: q.ty, t: "", o: ["", "", "", ""], k: 0, img: "" } })); toast("✅ أُضيف السؤال"); };
      return <div style={{ border: "1.5px dashed #cbd5e1", borderRadius: 12, padding: 10, display: "grid", gap: 6 }}>
        <div className="nb-h" style={{ gap: 4 }}>{[TY_MC, TY_TF, TY_OP].map(t => <button key={t} className={"nb-chk" + (q.ty === t ? " on" : "")} onClick={() => setQ({ ty: t, k: 0 })}>{t}</button>)}</div>
        <textarea className="lr-ta" value={q.t} onChange={e => setQ({ t: e.target.value })} placeholder="نص السؤال…" />
        <label className="nb-chk" style={{ justifySelf: "start", cursor: "pointer" }}>🖼️ {q.img ? "تغيير الصورة" : "إضافة صورة أو رسم للسؤال"}<input type="file" accept="image/*" hidden onChange={async e => { const f = e.target.files[0]; e.target.value = ""; if (f) setQ({ img: await shrinkImg(f) }); }} /></label>
        {q.img && <div style={{ position: "relative", justifySelf: "start" }}><img src={q.img} alt="" style={{ maxHeight: 140, borderRadius: 10 }} /><button className="nb-chk" style={{ position: "absolute", top: 4, left: 4 }} onClick={() => setQ({ img: "" })}>✕</button></div>}
        {q.ty === TY_MC && <div style={{ display: "grid", gap: 4 }}>{q.o.map((o, j) => <label key={j} className="lr-row" style={{ padding: "2px 0" }}><input type="radio" checked={q.k === j} onChange={() => setQ({ k: j })} title="الإجابة الصحيحة" /><b>{LETS[j]})</b><input className="lr-ta" style={{ minHeight: 0, flex: 1 }} value={o} onChange={e => { const O = [...q.o]; O[j] = e.target.value; setQ({ o: O }); }} placeholder={`الخيار ${LETS[j]}`} /></label>)}<small style={{ color: "#64748b", fontWeight: 700 }}>حدّد الدائرة بجانب الإجابة الصحيحة — يُصحَّح آليًا</small></div>}
        {q.ty === TY_TF && <div className="nb-h" style={{ gap: 4 }}><b style={{ fontSize: 13 }}>الإجابة الصحيحة:</b><button className={"nb-chk" + (!q.k ? " on" : "")} onClick={() => setQ({ k: 0 })}>✔ صواب</button><button className={"nb-chk" + (q.k ? " on" : "")} onClick={() => setQ({ k: 1 })}>✘ خطأ</button></div>}
        {q.ty === TY_OP && <input className="lr-ta" style={{ minHeight: 0 }} value={q.mk || ""} onChange={e => setQ({ mk: e.target.value })} placeholder="الإجابة النموذجية (تظهر لك عند التصحيح — اختيارية)" />}
        <button className="nb-b on" style={{ justifySelf: "start" }} onClick={addQ}>➕ أضف السؤال للواجب</button>
      </div>; })()}
    {ed.src === "nq" && <div style={{ border: "1.5px dashed #cbd5e1", borderRadius: 12, padding: 10, display: "grid", gap: 6 }}>
      {!nq || nq === "busy" ? <div className="nb-msg">⏳ تحميل نماذج نافس…</div> : !nq.L.length ? <div className="nb-msg">لا توجد نماذج في منصة نافس بعد</div> : <>
        <select className="lr-ta" style={{ minHeight: 0 }} value={nq.ex ? nq.ex.id : ""} onChange={e => setNq({ ...nq, ex: nq.L.find(x => x.id === e.target.value) || null, sel: [] })}><option value="">اختر النموذج…</option>{nq.L.map(x => <option key={x.id} value={x.id}>{x.title || "نموذج"}</option>)}</select>
        {nq.ex && (() => { const subs = arr(nq.ex.subjects); const sj = subs.find(x => x.name === NQ_OF[book]) || subs[0]; const Q = arr(sj && sj.questions);
          return <><small style={{ fontWeight: 800, color: "#64748b" }}>مادة {sj ? sj.name : ""} — {ar(Q.length)} سؤالًا • حدّد ما تريد</small>
            <div style={{ display: "grid", gap: 4, maxHeight: 300, overflow: "auto" }}>{Q.map((x, j) => <label key={j} className="lr-row" style={{ cursor: "pointer", padding: "5px 4px", alignItems: "flex-start" }}><input type="checkbox" checked={nq.sel.includes(j)} onChange={() => setNq({ ...nq, sel: nq.sel.includes(j) ? nq.sel.filter(y => y !== j) : [...nq.sel, j] })} /><b>{ar(j + 1)}</b><span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 700 }}>{String(x.text || "").slice(0, 140) || "(سؤال بصورة)"}{x.image ? " 🖼️" : ""}</span></label>)}</div>
            <button className="nb-b on" style={{ justifySelf: "start" }} disabled={!nq.sel.length} onClick={() => { addEx(nq.sel.sort((a, b) => a - b).map(j => { const x = Q[j]; const o = arr(x.options).map(String); const c = +x.correct || 0; return { c: 1, nq: 1, t: String(x.text || ""), ty: TY_MC, o, k: `${LETS[c]} ${o[c] || ""}`.trim(), ...(x.image ? { img: x.image } : {}) }; })); setNq({ ...nq, sel: [] }); toast("✅ أُضيفت الأسئلة للواجب"); }}>➕ أضف المحدد ({ar(nq.sel.length)})</button></>; })()}</>}
    </div>}
    {ed.ex.length > 0 && <div style={{ display: "grid", gap: 4 }}><b style={{ fontSize: 13 }}>🧾 الأسئلة والصفحات المضافة ({ar(ed.ex.length)})</b>{ed.ex.map((q, i) => <div key={i} className="lr-row" style={{ padding: "5px 6px", border: "1px solid #e2e8f0", borderRadius: 10 }}><span className="lr-pill" style={{ background: q.pg ? "#e0f2fe" : q.ty === TY_OP ? "#fef3c7" : "#dcfce7" }}>{q.pg ? "📖 صفحة" : q.nq ? "🎯 نافس" : "✍️"} {q.ty}</span><span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{q.pg ? `حل صفحة ${ar(q.pg)} في الدفتر` : q.t || "(سؤال بصورة)"}</span><button className="nb-chk" onClick={() => setEd(e => ({ ...e, ex: e.ex.filter((_, j) => j !== i) }))}>✕</button></div>)}</div>}
    {ed.src === "book" && <div><div className="nb-h"><b style={{ fontSize: 13 }}>أسئلة الدرس ({ar(ed.sel.length)} من {ar(edQs.length)}) — الاختيار من متعدد والصواب والخطأ تُصحّح آلياً</b><span className="nb-sp" /><button className="nb-chk" onClick={() => setEd({ ...ed, sel: edQs.map((_, i) => i) })}>الكل</button><button className="nb-chk" onClick={() => setEd({ ...ed, sel: edQs.map((q, i) => qKind(q.ty) !== "open" ? i : -1).filter(i => i >= 0) })}>الآلية فقط</button></div>
      <div style={{ display: "grid", gap: 4, marginTop: 6, maxHeight: 300, overflow: "auto" }}>{edQs.map((q, i) => <label key={i} className="lr-row" style={{ cursor: "pointer", padding: "5px 4px" }}><input type="checkbox" checked={ed.sel.includes(i)} onChange={() => setEd({ ...ed, sel: ed.sel.includes(i) ? ed.sel.filter(x => x !== i) : [...ed.sel, i] })} />
        <b>س{ar(q.n)}</b><small style={{ color: "#64748b", fontWeight: 800 }}>ص {ar(q.p)}</small><span className="lr-pill" style={{ background: qKind(q.ty) === "open" ? "#fef3c7" : "#dcfce7", color: qKind(q.ty) === "open" ? "#92400e" : "#15803d" }}>{q.ty}{qKind(q.ty) === "open" ? " • يصحّحه المعلم" : " • آلي"}</span><small style={{ color: "#94a3b8", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>🔑 {q.k}</small></label>)}
        {!edQs.length && <div className="nb-msg">لا توجد أسئلة مرقّمة في هذا الدرس</div>}</div></div>}
    <button className="nb-b on big" style={{ "--c": "#16a34a", padding: 12 }} onClick={save}>📤 نشر الواجب للطلاب ({ar(ed.sel.length + ed.ex.length)}) — يصلهم تنبيه</button>
  </div>;
  const studsOf = c => arr(ros[c] && ros[c].students).filter(s => s && s.id);
  return <div className="lr-card" style={{ display: "grid", gap: 8, "--c": B.c }}>
    <div className="nb-h"><b style={{ color: B.c }}>📝 الواجبات – {B.name}</b><span className="nb-sp" />{!admin && <button className="nb-b on" style={{ "--c": B.c }} onClick={startNew}>➕ واجب جديد</button>}</div>
    {!L.length && <div className="nb-msg">لا توجد واجبات بعد{!admin ? " — اختر درساً من المرجع وانشر أسئلته واجباً بضغطة" : ""}</div>}
    {L.map(h => { const S = subs[h.id]; const isO = open === h.id; const all = arr(h.cks).filter(c => cks.includes(c)).flatMap(c => studsOf(c).map(s => ({ ...s, ck: c })));
      const got = S ? all.filter(s => S[s.id]) : []; const sc = got.map(s => hwScore(h, S[s.id])); const avg = sc.length ? Math.round(sc.reduce((t, x) => t + (x.done ? x.ok / x.done : 0), 0) / sc.length * 100) : 0; const pend = got.filter((s, i) => !sc[i].full || !S[s.id].fbAt).length;
      return <div key={h.id} style={{ border: "1.5px solid #e2e8f0", borderRadius: 14, padding: 10 }}>
        <div className="nb-h" style={{ gap: 6, cursor: "pointer" }} onClick={() => { setOpen(isO ? null : h.id); if (!S) loadSubs(h.id); }}>
          <b>{hwTitle(h, B)}</b><small style={{ color: "#64748b", fontWeight: 800 }}>{ar(arr(h.qs).length)} أسئلة • {arr(h.cks).map(cls).join("، ")}{h.due ? ` • حتى ${dueTxt(h.due)}` : ""}{admin ? ` • أ. ${h.by}` : ""}</small><span className="nb-sp" />
          {S && <><span className="lr-pill" style={{ background: "#ede9fe", color: "#6d28d9" }}>سلّم {ar(got.length)}/{ar(all.length)}</span><span className="lr-pill" style={{ background: PRE_LV(avg)[2], color: PRE_LV(avg)[1] }}>متوسط {ar(avg)}٪</span>{pend > 0 && <span className="lr-pill lr-c0">✍️ {ar(pend)} للتصحيح</span>}</>}<span>{isO ? "▲" : "▼"}</span></div>
        {isO && (!S ? <div className="nb-msg">⏳</div> : <div style={{ marginTop: 8 }}>
          {all.map(s => { const x = S[s.id]; const r = x ? hwScore(h, x) : null; return <div key={s.id} className="lr-row">
            <b style={{ flex: 1, minWidth: 140 }}>{s.name} <small style={{ color: "#94a3b8" }}>{cls(s.ck)}</small></b>
            {x ? <><LBar v={r.done ? r.ok / r.done * 100 : 0} c={PRE_LV(r.pct)[1]} /><span className="lr-pill" style={{ background: "#f1f5f9" }}>{ar(r.ok)}/{ar(r.of)}{!r.full ? ` • ${ar(r.of - r.done)} مفتوح` : ""}</span>{x.fbAt ? <span className="lr-pill lr-c1">✅ صُحّح</span> : null}
              {!admin && <button className="nb-b" onClick={() => setGr({ h, s: x, sid: s.id, fb: obj(x.fb) })}>✍️ تصحيح وتغذية راجعة</button>}</> : <span className="lr-pill lr-c0">لم يسلّم</span>}</div>; })}
          {got.length > 0 && <div style={{ marginTop: 8, borderTop: "1px dashed #e2e8f0", paddingTop: 8 }}><b style={{ fontSize: 13 }}>📊 إجابات الفصل لكل سؤال</b><div className="nb-h" style={{ gap: 4, marginTop: 4 }}>{arr(h.qs).map((q, i) => { let ok = 0, dn = 0, an = 0; got.forEach(s0 => { const x = S[s0.id]; const v = obj(x.a)[i]; if (v != null && v !== "") an++; const f = obj(obj(x.fb)[i]); const r = f.ok != null ? +f.ok : autoOk(q, v); if (r != null) { dn++; if (r === 1) ok++; } }); const pc = dn ? Math.round(ok / dn * 100) : null;
            return <span key={i} className="lr-pill" title={q.t || q.k || ""} style={{ background: pc == null ? "#f1f5f9" : PRE_LV(pc)[2], color: pc == null ? "#475569" : PRE_LV(pc)[1] }}>{q.pg ? `ص${ar(q.pg)}` : `س${ar(i + 1)}`}: {pc == null ? `أجاب ${ar(an)}` : `${ar(pc)}٪`}</span>; })}</div></div>}
          {!admin && <div className="nb-h" style={{ marginTop: 6 }}><span className="nb-sp" /><button className="nb-b" style={{ color: "#b91c1c" }} onClick={() => del(h)}>🗑 حذف الواجب</button></div>}
        </div>)}
      </div>; })}
    {msg && <div className="nb-msg" style={{ position: "fixed", bottom: 16, left: "50%", transform: "translateX(-50%)", background: "#0f172a", color: "#fff", borderRadius: 12, zIndex: 99 }}>{msg}</div>}
  </div>;
}

// ── 📅 متابعة المدير الأسبوعية: الشرح بالصفحة • إنجاز الأسبوع • الواجبات • الطلاب غير المشاركين
function WeekBoard({ api, D, rows, cks }) {
  const [off, setOff] = useState(0); const [X, setX] = useState(null); const [sel, setSel] = useState(null);
  useEffect(() => { (async () => { const [hw, hwa, pre] = await Promise.all([api.maGet(NB_HW), api.maGet(NB_HWA), api.maGet(NB_PRE)]); setX({ hw: obj(hw), hwa: obj(hwa), pre: obj(pre) }); })(); }, []);
  if (!X) return <div className="nb-msg">⏳ جارٍ تحميل متابعة الأسبوع…</div>;
  const s0 = wkS(off), s1 = s0 + 7 * 864e5; const inW = t => t >= s0 && t < s1;
  const studsOf = ck => arr(D.ros[ck] && D.ros[ck].students).filter(s => s && s.id);
  const R = rows.flatMap(r => r.cks.map(ck => { const C = obj(obj(obj(D.tp[r.key])[r.book])[ck]); const B = BOOKS[r.book];
    const pw = Object.entries(C).filter(([k, t]) => k[0] === "p" && inW(+t)).map(([k]) => +k.slice(1)).sort((a, b) => a - b);
    const vals = Array.from({ length: 15 }, (_, w) => weekPct(C, r.book, w)); let tw = vals.findIndex(v => v < 100); if (tw < 0) tw = 14;
    const wp = weekPages(r.book, tw); const wDone = wp.filter(p => C["p" + p]).length;
    const hws = Object.values(X.hw).filter(h => h && h.book === r.book && arr(h.cks).includes(ck) && inW(h.at));
    const st = studsOf(ck); const subsIn = hws.flatMap(h => st.map(s => obj(X.hwa[h.id])[s.id]).filter(Boolean));
    const scs = hws.flatMap(h => st.map(s => obj(X.hwa[h.id])[s.id]).filter(Boolean).map(x => hwScore(h, x))).filter(x => x.done);
    const avg = scs.length ? Math.round(scs.reduce((t, x) => t + x.ok / x.done, 0) / scs.length * 100) : null;
    const act = s => inW(+obj(D.seen[s.id]).at || 0) || Object.values(X.hw).some(h => inW(+obj(obj(X.hwa[h.id])[s.id]).at || 0));
    const idle = st.filter(s => !act(s));
    const pre = st.filter(s => obj(obj(X.pre[r.book])[s.id]).at); const preAvg = pre.length ? Math.round(pre.reduce((t, s) => { const x = X.pre[r.book][s.id]; return t + x.sc / x.of * 100; }, 0) / pre.length) : null;
    return { r, ck, B, pw, tw, wp, wDone, wPct: Math.round(wDone / wp.length * 100), hws, subRate: hws.length && st.length ? Math.round(subsIn.length / (hws.length * st.length) * 100) : null, avg, idle, st, pre: pre.length, preAvg };
  }));
  const tot = R.reduce((t, x) => t + x.pw.length, 0); const avgW = R.length ? Math.round(R.reduce((t, x) => t + x.wPct, 0) / R.length) : 0; const idleN = new Set(R.flatMap(x => x.idle.map(s => s.id))).size; const hwN = R.reduce((t, x) => t + x.hws.length, 0);
  const print = () => lrPrint("المتابعة الأسبوعية", `<h1>المتابعة الأسبوعية لمراجع نافس</h1><div class="sub">الأسبوع: ${wkLbl(s0)}</div><div class="k"><div><b>${ar(tot)}</b>صفحة شُرحت</div><div><b>${ar(avgW)}٪</b>متوسط إنجاز الأسبوع</div><div><b>${ar(hwN)}</b>واجباً</div><div><b>${ar(idleN)}</b>طالباً لم يشارك</div></div>
    <table><tr><th>المعلم</th><th>المادة</th><th>الفصل</th><th>صفحات هذا الأسبوع</th><th>أسبوع الخطة</th><th>إنجازه</th><th>الواجبات</th><th>التسليم</th><th>أداء الطلاب</th><th>لم يشاركوا</th></tr>${R.map(x => `<tr><td class="r">${x.r.name}</td><td>${x.B.name}</td><td>${cls(x.ck)}</td><td>${ar(x.pw.length)}${x.pw.length ? `<br><small>${x.pw.map(ar).join("، ")}</small>` : ""}</td><td>${ar(x.tw + 1)}</td><td class="${x.wPct === 100 ? "ok" : x.wPct < 50 ? "no" : ""}">${ar(x.wDone)}/${ar(x.wp.length)} (${ar(x.wPct)}٪)</td><td>${ar(x.hws.length)}</td><td>${x.subRate == null ? "—" : ar(x.subRate) + "٪"}</td><td>${x.avg == null ? "—" : ar(x.avg) + "٪"}</td><td>${ar(x.idle.length)}</td></tr>`).join("")}</table>
    ${R.filter(x => x.idle.length).map(x => `<p style="font-size:11px;font-weight:800"><b>${x.B.name} • ${cls(x.ck)}</b> — لم يشاركوا: ${x.idle.map(s => s.name).join("، ")}</p>`).join("")}<div class="sg"><span>وكيل الشؤون التعليمية: ............</span><span>مدير المدرسة: ............</span></div>`);
  const S = sel && R.find(x => x.r.key + x.ck + x.r.book === sel);
  return <div style={{ display: "grid", gap: 10 }}>
    <div className="lr-card"><div className="nb-h" style={{ gap: 6 }}><b>📅 الأسبوع: {wkLbl(s0)}</b><span className="nb-sp" />{[0, 1, 2, 3].map(o => <button key={o} className={"nb-b" + (off === o ? " on" : "")} onClick={() => setOff(o)}>{o === 0 ? "هذا الأسبوع" : o === 1 ? "الماضي" : `قبل ${ar(o)} أسابيع`}</button>)}<button className="nb-b" onClick={print}>🖨 طباعة</button></div></div>
    <div className="lr-grid">
      <div className="lr-k" style={{ "--c": "#7c3aed" }}><b>{ar(tot)}</b><small>📖 صفحة شُرحت هذا الأسبوع</small></div>
      <div className="lr-k" style={{ "--c": avgW >= 80 ? "#16a34a" : avgW >= 50 ? "#d97706" : "#dc2626" }}><b>{ar(avgW)}٪</b><small>متوسط إنجاز أسبوع الخطة</small><LBar v={avgW} c={avgW >= 80 ? "#16a34a" : avgW >= 50 ? "#d97706" : "#dc2626"} /></div>
      <div className="lr-k" style={{ "--c": "#0f766e" }}><b>{ar(hwN)}</b><small>📝 واجباً نُشر</small></div>
      <div className="lr-k" style={{ "--c": "#dc2626" }}><b>{ar(idleN)}</b><small>🚫 طالباً لم يشارك</small></div>
    </div>
    <div className="lr-card" style={{ overflowX: "auto" }}><table className="lr-hm"><thead><tr><th style={{ textAlign: "right" }}>المعلم</th><th>المادة</th><th>الفصل</th><th>📖 صفحات الأسبوع</th><th>أسبوع الخطة</th><th>العدّاد</th><th>📝 واجبات</th><th>التسليم</th><th>الأداء</th><th>🧪 القبلي</th><th>🚫 لم يشاركوا</th></tr></thead><tbody>
      {R.map(x => <tr key={x.r.key + x.ck + x.r.book} style={{ cursor: "pointer" }} onClick={() => setSel(x.r.key + x.ck + x.r.book)}>
        <td className="r">{x.r.name}</td><td style={{ color: x.B.c }}>{x.B.name}</td><td>{cls(x.ck)}</td>
        <td><b style={{ color: x.pw.length ? "#15803d" : "#b91c1c" }}>{ar(x.pw.length)}</b></td><td>{ar(x.tw + 1)}</td>
        <td style={{ minWidth: 120 }}><div style={{ display: "flex", gap: 4, alignItems: "center" }}><LBar v={x.wPct} c={x.wPct === 100 ? "#16a34a" : x.wPct >= 50 ? "#d97706" : "#dc2626"} /><small>{ar(x.wDone)}/{ar(x.wp.length)}</small></div></td>
        <td>{ar(x.hws.length)}</td><td>{x.subRate == null ? "—" : ar(x.subRate) + "٪"}</td><td>{x.avg == null ? "—" : <span className="lr-pill" style={{ background: PRE_LV(x.avg)[2], color: PRE_LV(x.avg)[1] }}>{ar(x.avg)}٪</span>}</td>
        <td>{x.pre ? `${ar(x.pre)} • ${ar(x.preAvg)}٪` : "—"}</td><td><span className={"lr-pill " + (x.idle.length ? "lr-c0" : "lr-c1")}>{ar(x.idle.length)}</span></td></tr>)}
      {!R.length && <tr><td colSpan={11}>لا توجد بيانات معلمين</td></tr>}</tbody></table>
      <small style={{ color: "#64748b", fontWeight: 700 }}>«صفحات الأسبوع» = الصفحات التي سجّل المعلم «✅ تم شرح الصفحة» خلالها • «العدّاد» = المشروح من صفحات أسبوع الخطة الحالي • «لم يشاركوا» = لم يدخلوا المراجع ولم يسلّموا واجباً هذا الأسبوع • اضغط أي صف للتفاصيل</small></div>
    {S && <div className="lr-card" style={{ "--c": S.B.c, display: "grid", gap: 8 }}>
      <div className="nb-h"><b>{S.r.name} • {S.B.name} • فصل {cls(S.ck)}</b><span className="nb-sp" /><button className="nb-b" onClick={() => setSel(null)}>✕</button></div>
      <div><b style={{ fontSize: 13 }}>📖 صفحات أسبوع الخطة {ar(S.tw + 1)} ({S.B.titles[S.tw * 2]} • {S.B.titles[S.tw * 2 + 1]}):</b>
        <div className="nb-h" style={{ gap: 4, marginTop: 4 }}>{S.wp.map(p => { const t = obj(obj(obj(D.tp[S.r.key])[S.r.book])[S.ck])["p" + p]; return <span key={p} className="lr-pill" title={t ? new Date(+t).toLocaleString("ar-SA") : "لم تُشرح"} style={{ background: t ? "#dcfce7" : "#f1f5f9", color: t ? "#15803d" : "#94a3b8" }}>{t ? "✓" : "○"} {ar(p)}</span>; })}</div></div>
      {S.idle.length > 0 && <div><b style={{ fontSize: 13, color: "#b91c1c" }}>🚫 لم يشاركوا ({ar(S.idle.length)}):</b> <span style={{ fontWeight: 700, fontSize: 13 }}>{S.idle.map(s => s.name).join("، ")}</span></div>}
      {S.hws.map(h => { const st = S.st; const got = st.filter(s => obj(X.hwa[h.id])[s.id]); return <div key={h.id} style={{ fontSize: 13, fontWeight: 800 }}>📝 {hwTitle(h, S.B)}: سلّم {ar(got.length)}/{ar(st.length)} • لم يسلّم: <span style={{ color: "#b91c1c" }}>{st.filter(s => !got.includes(s)).map(s => s.name.split(" ").slice(0, 2).join(" ")).join("، ") || "—"}</span></div>; })}
    </div>}
  </div>;
}

// ════════════════════════════════════════════════════════════════════
// ✅ الإجابة الإلكترونية في المراجع: الضغط على دائرة الاختيار في الصفحة نفسها • ورقة إجابة لكل سؤال
//    (اختيار • صواب/خطأ • إجابة مكتوبة مع لوحة الرموز) • ملاحظة الطالب لكل سؤال • تصحيح آلي فوري
//    وتغذية راجعة بسبب الخطأ • نتائج للطالب والمعلم والإدارة وتحليل الأسئلة ومراجعة الإجابات المكتوبة
//   school-nafsbook-qa/{book}/{page}/{sid} = { a:{i:الإجابة}, x:{i:التصحيح}, n:{i:ملاحظة}, sr:{i:تقييم ذاتي},
//                                             tr:{i:قرار المعلم}, c:{i:تعليق المعلم}, g:{النتيجة}, f:{المحاولة الأولى}, ck, nm }
//   school-nafsbook-qr/{sid}/{book}/{page} = { c, g, t, p, n, at }      ملخص سريع للنتائج
//   school-nafsbook-fb/{book}/{page}/{i}   = { r: سبب الإجابة الصحيحة, o:{0..3: لماذا هذا الخيار خطأ} }
// ════════════════════════════════════════════════════════════════════
const NB_QA = "school-nafsbook-qa", NB_QR = "school-nafsbook-qr", NB_FB = "school-nafsbook-fb";
const QLET = ["أ", "ب", "ج", "د"];
const QK_LBL = { m: "اختيار من متعدد", tf: "صواب أم خطأ", s: "إجابة قصيرة", o: "إجابة مكتوبة" };
const qmOf = (b, p) => { const L = obj(QM[b])[p]; return Array.isArray(L) ? L : []; };
const qKindAt = (b, p, i) => (qmOf(b, p)[i] || [])[2] || "o";
// وحدة التصحيح: صفحة الدرس وحدها، أو صفحات اختبار الأسبوع معًا (مع ورقة «ظلّل الدائرة»)
const qUnit = (b, p) => { for (let w = 0; w < 15; w++) { const T = testPages(b, w); if (T.includes(p)) return { w, test: true, pages: T.filter(x => qmOf(b, x).length) }; } return { w: weekOfPage(b, p), test: false, pages: qmOf(b, p).length ? [p] : [] }; };
const qPct = (c, g) => g ? Math.round(c / g * 100) : null;
const qLvl = v => v == null ? ["—", "#94a3b8"] : v >= 90 ? ["متقدم", "#15803d"] : v >= 75 ? ["متمكن", "#2563eb"] : v >= 60 ? ["قريب من التمكن", "#b45309"] : ["يحتاج دعمًا", "#dc2626"];
const qHtml = h => ({ __html: mthHtml(String(h || ""), { html: true }) });

// ── التصحيح نفسه (نسخة احتياطية في المتصفح عند تعذّر الخادم — نفس منطق api/nbgrade.js)
const qzKind = (t, a) => /اختيار من متعدد/.test(t) ? "m" : /صواب\/خطأ/.test(t) ? "tf" : (/^(أكمل|أكمل الحل|حساب ذهني)$/.test(stripH(t)) && stripH(a).length <= 40) ? "s" : "o";
const qDig = s => String(s).replace(/[٠-٩]/g, d => "٠١٢٣٤٥٦٧٨٩".indexOf(d)).replace(/[۰-۹]/g, d => "۰۱۲۳۴۵۶۷۸۹".indexOf(d));
const qNorm = s => qDig(stripH(s)).replace(/[ً-ْـ]/g, "").replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي").replace(/[−–—]/g, "-").replace(/[٫,]/g, ".").replace(/×/g, "x").replace(/[\s()]/g, "").replace(/(ريالا|ريال|سم|كم|درجه|°)$/, "").replace(/\.$/, "");
function qShortOk(key, v) { const k = stripH(key), a = String(v || ""); if (!a.trim()) return false; const nk = qNorm(k), na = qNorm(a); if (!na) return false; if (na === nk) return true;
  if (k.includes("=") && qNorm(k.split("=").pop()) === na) return true;
  const parts = s => s.split(/[،؛;]|\sو\s|\sأو\s/).map(qNorm).filter(Boolean); const kp = parts(k), ap = parts(a);
  return kp.length > 1 && kp.length === ap.length && kp.every(x => ap.includes(x)); }
function qGradeLocal(Kx, b, pages) { const out = {}; pages.forEach(({ p, a }) => { const L = Array.isArray(obj(Kx[b])[p]) ? Kx[b][p] : []; const A = obj(a); const r = {}, ci = {}, k = {}; let c = 0, g = 0, pn = 0;
  L.forEach(([n, t, key], i) => { const kd = qzKind(t, key), v = A[i], empty = v == null || String(v).trim() === "";
    if (kd === "m") { ci[i] = QLET.indexOf(stripH(key)[0]); const ex = String(key).split("—").slice(1).join("—").trim(); if (ex) k[i] = ex; r[i] = !empty && +v === ci[i] ? 1 : 0; }
    else if (kd === "tf") { ci[i] = /^صواب/.test(stripH(key)) ? "ص" : "خ"; k[i] = key; r[i] = v === ci[i] ? 1 : 0; }
    else { k[i] = key; r[i] = empty ? 0 : kd === "s" && qShortOk(key, v) ? 1 : -1; }
    if (r[i] === 1) c++; if (r[i] === -1) pn++; else g++; });
  out[p] = { r, ci, k, c, g, t: L.length, p: pn }; }); return out; }
async function nbGrade(book, pages) {
  try { const r = await fetch("/api/nbgrade", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ b: book, pages }) });
    if (r.ok) { const j = await r.json(); if (j && j.ok && j.res) return j.res; } } catch {}
  return qGradeLocal(await loadKeys(), book, pages);
}
// تطبيق قرارات المعلم على نتيجة التصحيح وإعادة الحساب
function qApplyTr(G, tr) { const r = { ...obj(G.r) }; Object.entries(obj(tr)).forEach(([i, v]) => { if (r[i] !== undefined && (v === 0 || v === 1)) r[i] = v; });
  let c = 0, g = 0, pn = 0; Object.values(r).forEach(v => { if (v === 1) c++; if (v === -1) pn++; else g++; }); return { ...G, r, c, g, p: pn }; }

// ── حالة الإجابات في عارض الصفحة
function useQuiz({ api, qz, book, page, idx, flash }) {
  const on = !!qz;
  const U = useMemo(() => on ? qUnit(book, page) : { pages: [] }, [on, book, page]);
  const [D, setD] = useState({}); const [fb, setFb] = useState({}); const [busy, setBusy] = useState(false);
  const tm = useRef({}); const pend = useRef({});
  const key = U.pages.join(",");
  const rec = p => obj(D[book + "/" + p]);
  useEffect(() => { if (!on || !U.pages.length) return; let ok = true;
    Promise.all(U.pages.map(p => api.maGet(`${NB_QA}/${book}/${p}/${qz.sid}`))).then(L => { if (!ok) return; setD(d => { const n = { ...d }; U.pages.forEach((p, j) => { if (!pend.current[book + "/" + p]) n[book + "/" + p] = obj(L[j]); }); return n; }); });
    return () => { ok = false; }; }, [on, book, key, qz && qz.sid]);
  const anyG = U.pages.some(p => rec(p).g);
  useEffect(() => { if (!on || !anyG) return; U.pages.forEach(p => { if (fb[book + "/" + p] === undefined) api.maGet(`${NB_FB}/${book}/${p}`).then(d => setFb(f => ({ ...f, [book + "/" + p]: obj(d) }))); }); }, [on, book, key, anyG]);
  // حفظ فوري للاختيارات، ومؤجَّل قليلًا للكتابة حتى لا يُرسل كل حرف
  const save = (fp, v, delay) => { clearTimeout(tm.current[fp]); const go = () => { delete tm.current[fp]; Promise.resolve(api.maPut(fp, v)).then(ok => { if (ok === false) { const q = qGet(); q[fp] = v; qSet(q); } }); };
    if (delay) tm.current[fp] = setTimeout(go, delay); else go(); };
  useEffect(() => () => { Object.values(tm.current).forEach(clearTimeout); }, []);
  const path = p => `${NB_QA}/${book}/${p}/${qz.sid}`;
  const put = (p, sub, v, delay) => { const k = book + "/" + p; pend.current[k] = 1;
    setD(d => { const R = obj(d[k]); const [a, b2] = sub.split("/"); const n = { ...R }; if (b2 == null) { if (v == null) delete n[a]; else n[a] = v; } else { n[a] = { ...obj(R[a]) }; if (v == null) delete n[a][b2]; else n[a][b2] = v; } return { ...d, [k]: n }; });
    save(`${path(p)}/${sub}`, v == null ? null : v, delay); };
  const meta = p => { const R = rec(p); if (R.ck || qz.ro) return; put(p, "ck", qz.ck || ""); put(p, "nm", qz.nm || ""); if (idx) api.maPut(`${idx}/${book}/${p}`, Date.now()); };
  const locked = p => !!qz.ro || !!rec(p).g;
  const setAns = (p, i, v, delay) => { if (locked(p)) { if (!qz.ro && rec(p).g) flash("🔒 صُحّحت إجاباتك — اضغط «🔁 أعد محاولة الأخطاء» للتعديل", 2400); return; } meta(p); put(p, "a/" + i, v === "" ? null : v, delay); };
  const setX = (p, i, v) => { if (!locked(p)) put(p, "x/" + i, v || null, 700); };
  const setNote = (p, i, v) => { if (qz.ro) return; meta(p); put(p, "n/" + i, v || null, 700); const n = { ...obj(rec(p).n), [i]: v }; const cnt = Object.values(n).filter(x => x && String(x).trim()).length; save(`${NB_QR}/${qz.sid}/${book}/${p}/n`, cnt || null, 900); };
  const setSelf = (p, i, v) => { if (!qz.ro) put(p, "sr/" + i, v); };
  const grade = async () => { if (busy || qz.ro) return; setBusy(true);
    try { const pages = U.pages.map(p => ({ p, a: obj(rec(p).a) })); const res = await nbGrade(book, pages); const now = Date.now(); let C = 0, G = 0, P = 0;
      for (const p of U.pages) { const R = rec(p); if (!res[p]) continue; const g = { ...qApplyTr(res[p], R.tr), at: now, try: (+R.tries || 0) + 1 };
        C += g.c; G += g.g; P += g.p; meta(p); put(p, "g", g); put(p, "tries", g.try); if (!R.f) put(p, "f", { c: g.c, g: g.g, at: now });
        const nn = Object.values(obj(R.n)).filter(x => x && String(x).trim()).length;
        save(`${NB_QR}/${qz.sid}/${book}/${p}`, { c: g.c, g: g.g, t: g.t, p: g.p, at: now, ...(nn ? { n: nn } : {}), ...(R.f ? { f: qPct(R.f.c, R.f.g) } : { f: qPct(g.c, g.g) }) }); }
      const v = qPct(C, G); if (v === 100) confetti();
      flash(v == null ? "⏳ أُرسلت إجاباتك المكتوبة لمعلمك ليقيّمها" : `${v === 100 ? "🎉 ممتاز!" : v >= 75 ? "👏 أحسنت" : "💪 راجع الأخطاء"} — نتيجتك ${ar(C)} من ${ar(G)} (${ar(v)}٪)${P ? ` • ${ar(P)} بانتظار المعلم` : ""}`, 4200);
    } catch (e) { flash("⚠️ تعذّر التصحيح الآن — تحقق من الاتصال وأعد المحاولة", 3000); }
    setBusy(false); };
  const retry = () => { if (qz.ro) return; U.pages.forEach(p => { const R = rec(p); if (!R.g) return; const A = { ...obj(R.a) }; Object.entries(obj(R.g.r)).forEach(([i, v]) => { const kd = qKindAt(book, p, +i); if (v === 0 && (kd === "m" || kd === "tf")) delete A[i]; }); put(p, "a", Object.keys(A).length ? A : null); put(p, "g", null); });
    flash("🔁 أعد اختيار إجابات الأسئلة الخاطئة ثم صحّح مرة أخرى", 2600); };
  let tot = 0, ans = 0, C = 0, G = 0, P = 0; U.pages.forEach(p => { const L = qmOf(book, p), R = rec(p), A = obj(R.a); tot += L.length; ans += L.filter((_, i) => A[i] != null && String(A[i]).trim() !== "").length; if (R.g) { C += R.g.c; G += R.g.g; P += R.g.p; } });
  const graded = U.pages.length > 0 && U.pages.every(p => rec(p).g);
  return { on, ro: on && !!qz.ro, U, rec, fb: p => obj(fb[book + "/" + p]), setAns, setX, setNote, setSelf, grade, retry, busy, graded, anyG, st: { tot, ans, C, G, P } };
}

// ── دوائر الاختيار فوق الصفحة: يضغط الطالب الدائرة نفسها في السؤال أو في ورقة «ظلّل الدائرة»
function QzBubbles({ Z, book, page, size, active, color }) {
  if (!Z.on) return null;
  const G = arr(obj(QP[book])[page]).map(([i, co]) => ({ p: page, i, co }));
  const sh = obj(QS[book])[page]; if (sh) arr(sh.g).forEach((co, n) => { const q = sh.q[n]; if (q) G.push({ p: q[0], i: q[1], co, sheet: n + 1 }); });
  if (!G.length) return null;
  const d0 = Math.max(18, size.w * 0.038), ds = size.w * 0.031;
  return G.map(g => { const R = Z.rec(g.p), v = obj(R.a)[g.i], Gr = R.g, d = g.sheet ? ds : d0; return g.co.map(([x, y], j) => {
    const sel = v != null && +v === j, ok = Gr && obj(Gr.ci)[g.i] === j, bad = Gr && sel && obj(Gr.r)[g.i] === 0;
    return <button key={`${g.p}-${g.i}-${j}-${g.sheet || 0}`} type="button" className={"qz-bub" + (sel ? " sel" : "") + (Gr && ok ? " ok" : "") + (bad ? " bad" : "") + (Gr ? " done" : "")}
      style={{ left: `${x * 100}%`, top: `${y * 100}%`, width: d, height: d, fontSize: d * 0.5, "--qc": color, pointerEvents: active ? "auto" : "none" }}
      onPointerDown={e => e.stopPropagation()} onClick={e => { e.stopPropagation(); Z.setAns(g.p, g.i, j); }} aria-label={`السؤال ${g.sheet || ""} الخيار ${QLET[j]}`}>
      {(sel || (Gr && ok)) ? (Gr ? (ok ? "✓" : "✗") : QLET[j]) : ""}</button>; }); });
}

// ── ورقة الإجابة: كل أسئلة الصفحة (أو الاختبار) مع الكتابة والملاحظة والتصحيح والتغذية الراجعة
function QzSheet({ Z, book, page, onClose, onGo, color }) {
  const [foc, setFoc] = useState(null); const [symT, setSymT] = useState(0); const [kb, setKb] = useState({ b: 0, h: 0 }); const [noteOpen, setNoteOpen] = useState({});
  const refs = useRef({});
  useEffect(() => { const vv = window.visualViewport; if (!vv) return; const f = () => setKb({ b: Math.max(0, window.innerHeight - vv.height - vv.offsetTop), h: vv.height }); f(); vv.addEventListener("resize", f); vv.addEventListener("scroll", f); return () => { vv.removeEventListener("resize", f); vv.removeEventListener("scroll", f); }; }, []);
  const U = Z.U, S = Z.st, ro = Z.ro;
  const focusField = (k, el) => { setFoc(k); setTimeout(() => { try { el.scrollIntoView({ block: "center", behavior: "smooth" }); } catch {} }, 280); };
  const insSym = s => { if (!foc) return; const el = refs.current[foc]; if (!el) return; const [p, i, kind] = foc.split("|"); const a = el.selectionStart ?? el.value.length, b = el.selectionEnd ?? a; const t = s.replace(/\s\s/g, " "); const v = el.value.slice(0, a) + t + el.value.slice(b);
    if (kind === "x") Z.setX(+p, +i, v); else Z.setAns(+p, +i, v, 700); requestAnimationFrame(() => { try { el.focus(); const c = a + t.length; el.setSelectionRange(c, c); } catch {} }); };
  const v = qPct(S.C, S.G); const L = qLvl(v);
  const kbOpen = kb.b > 80;
  const sheetH = kb.h ? Math.min(kb.h * (kbOpen ? 0.92 : 0.72), 760) : undefined;
  return <div className={"qz-sheet" + (kbOpen ? " kb" : "")} style={{ bottom: kb.b, maxHeight: sheetH, "--qc": color }} onPointerDown={e => e.stopPropagation()} role="dialog" aria-label="ورقة الإجابة">
    <div className="qz-hd">
      <div style={{ minWidth: 0, flex: 1 }}>
        <b style={{ fontSize: 15.5 }}>📝 {U.test ? `ورقة إجابة اختبار الأسبوع ${ar(U.w + 1)}` : `أسئلة صفحة ${ar(page)}`}</b>
        <div className="qz-prog"><i style={{ width: `${S.tot ? S.ans / S.tot * 100 : 0}%` }} /></div>
        <small>{ro ? "عرض إجابات الطالب" : Z.graded ? "صُحّحت — راجع التغذية الراجعة تحت كل سؤال" : `أجبت ${ar(S.ans)} من ${ar(S.tot)}`}</small>
      </div>
      {Z.anyG && <div className="qz-score" style={{ "--lc": L[1] }}><b>{v == null ? "⏳" : ar(v) + "٪"}</b><small>{v == null ? "بانتظار المعلم" : `${ar(S.C)}/${ar(S.G)} • ${L[0]}`}</small></div>}
      <button className="nb-b" onClick={onClose} aria-label="إغلاق">✕</button>
    </div>
    <div className="qz-body">
      {U.pages.map(p => { const R = Z.rec(p), A = obj(R.a), Gr = R.g, F = Z.fb(p);
        return <div key={p}>
          {U.pages.length > 1 && <div className="qz-pg"><span>صفحة {ar(p)}</span>{p !== page && <button className="nb-b" onClick={() => onGo(p)}>انتقل إليها ‹</button>}</div>}
          {qmOf(book, p).map(([n, t, kd], i) => { const val = A[i], r = Gr ? obj(Gr.r)[i] : undefined, ci = Gr ? obj(Gr.ci)[i] : undefined, kk = Gr ? obj(Gr.k)[i] : null, fbi = obj(F[i]);
            const tc = obj(R.c)[i], note = obj(R.n)[i], sr = obj(R.sr)[i], lock = ro || !!Gr;
            const st = r === 1 ? "ok" : r === 0 ? (val == null || String(val).trim() === "" ? "skip" : "bad") : r === -1 ? "wait" : "";
            const fk = `${p}|${i}|a`;
            return <div key={i} className={"qz-q " + st}>
              <div className="qz-qh"><span className="qz-n" dangerouslySetInnerHTML={qHtml(n)} /><small className="qz-t">{t || QK_LBL[kd]}</small><span className="nb-sp" />
                {st === "ok" && <span className="qz-r ok">✅ صحيحة</span>}{st === "bad" && <span className="qz-r bad">❌ خطأ</span>}{st === "skip" && <span className="qz-r skip">⚪ لم تُجب</span>}{st === "wait" && <span className="qz-r wait">⏳ يقيّمها المعلم</span>}</div>
              {kd === "m" && <div className="qz-opts">{QLET.map((l, j) => { const sel = val != null && +val === j; return <button key={j} type="button" disabled={lock} className={"qz-o" + (sel ? " sel" : "") + (Gr && ci === j ? " ok" : "") + (Gr && sel && r === 0 ? " bad" : "")} onClick={() => Z.setAns(p, i, j)}>{l}</button>; })}</div>}
              {kd === "tf" && <><div className="qz-opts tf">{[["ص", "✔ صواب"], ["خ", "✖ خطأ"]].map(([k, l]) => <button key={k} type="button" disabled={lock} className={"qz-o" + (val === k ? " sel" : "") + (Gr && ci === k ? " ok" : "") + (Gr && val === k && r === 0 ? " bad" : "")} onClick={() => Z.setAns(p, i, k)}>{l}</button>)}</div>
                {val === "خ" && <input className="qz-in" ref={el => { refs.current[`${p}|${i}|x`] = el; }} disabled={lock} value={obj(R.x)[i] || ""} onFocus={e => focusField(`${p}|${i}|x`, e.target)} onChange={e => Z.setX(p, i, e.target.value)} placeholder="صحّح العبارة الخاطئة…" enterKeyHint="done" dir="auto" />}</>}
              {(kd === "s" || kd === "o") && <textarea className="qz-in" ref={el => { refs.current[fk] = el; }} rows={kd === "s" ? 1 : 3} disabled={lock} value={val || ""} dir="auto" enterKeyHint={kd === "s" ? "done" : "enter"}
                onFocus={e => focusField(fk, e.target)} onChange={e => Z.setAns(p, i, e.target.value, 700)} onKeyDown={e => { if (kd === "s" && e.key === "Enter") { e.preventDefault(); e.target.blur(); } }}
                placeholder={ro ? "لم يكتب إجابة" : kd === "s" ? "اكتب الإجابة هنا…" : "اكتب إجابتك وخطوات الحل هنا…"} />}
              {/* التغذية الراجعة */}
              {Gr && st === "bad" && kd === "m" && <div className="qz-fb bad"><b>اخترت ({QLET[+val]}) — والإجابة الصحيحة ({QLET[ci]})</b>
                {fbi.o && fbi.o[+val] && <div><span className="qz-fl">لماذا ({QLET[+val]}) غير صحيحة؟</span> {fbi.o[+val]}</div>}
                {(fbi.r || kk) && <div><span className="qz-fl">💡 لماذا ({QLET[ci]}) هي الصحيحة؟</span> {fbi.r ? <Mth t={fbi.r} /> : <span dangerouslySetInnerHTML={qHtml(kk)} />}</div>}
                {!fbi.r && !kk && !(fbi.o && fbi.o[+val]) && <div>💡 راجع شرح الدرس في المرجع ثم اضغط «أعد محاولة الأخطاء».</div>}</div>}
              {Gr && st === "skip" && kd === "m" && <div className="qz-fb skip">الإجابة الصحيحة ({QLET[ci]}){fbi.r ? <div>💡 <Mth t={fbi.r} /></div> : null}</div>}
              {Gr && st === "ok" && kd === "m" && fbi.r && <div className="qz-fb ok">💡 <Mth t={fbi.r} /></div>}
              {Gr && kd === "tf" && (st === "bad" || st === "skip") && <div className="qz-fb bad"><b>العبارة {ci === "ص" ? "صحيحة" : "خاطئة"}</b>{fbi.r ? <div>💡 <Mth t={fbi.r} /></div> : <div dangerouslySetInnerHTML={qHtml(kk)} />}</div>}
              {Gr && kd === "tf" && st === "ok" && ci === "خ" && <div className="qz-fb ok"><span className="qz-fl">التصحيح النموذجي:</span> <span dangerouslySetInnerHTML={qHtml(String(kk || "").replace(/^خطأ،?\s*(والتصحيح:)?/, ""))} /></div>}
              {Gr && (kd === "s" || kd === "o") && kk && st !== "ok" && <div className={"qz-fb " + (st === "wait" ? "wait" : "skip")}><span className="qz-fl">الإجابة النموذجية:</span> <span dangerouslySetInnerHTML={qHtml(kk)} />{fbi.r && <div>💡 <Mth t={fbi.r} /></div>}
                {st === "wait" && !ro && <div className="qz-self">قارن إجابتك بالنموذجية: <button className={"qz-chip" + (sr === 1 ? " on ok" : "")} onClick={() => Z.setSelf(p, i, 1)}>👍 إجابتي صحيحة</button><button className={"qz-chip" + (sr === 0 ? " on bad" : "")} onClick={() => Z.setSelf(p, i, 0)}>👎 أخطأت</button></div>}
                {st === "wait" && ro && sr != null && <div className="qz-self">تقييم الطالب لنفسه: {sr ? "👍 صحيحة" : "👎 أخطأ"}</div>}</div>}
              {tc && <div className="qz-fb tc">👨‍🏫 تعليق المعلم: {tc}</div>}
              {(note || noteOpen[fk]) ? <textarea className="qz-in note" rows={2} disabled={ro} value={note || ""} dir="auto" onFocus={e => focusField(`${fk}n`, e.target)} onChange={e => Z.setNote(p, i, e.target.value)} placeholder="ملاحظتك أو سؤالك للمعلم عن هذا السؤال…" />
                : !ro && <button className="qz-add" onClick={() => setNoteOpen(o => ({ ...o, [fk]: 1 }))}>💬 إضافة ملاحظة أو سؤال للمعلم</button>}
            </div>; })}
        </div>; })}
    </div>
    {foc && !foc.endsWith("n") && book !== "ar" && !ro && !Z.rec(+foc.split("|")[0]).g && <div className="qz-sym" onMouseDown={e => e.preventDefault()} onPointerDown={e => e.preventDefault()}>
      <div className="pt">{NB_SYM.map(([l], i) => <button key={l} className={"nb-b" + (symT === i ? " on" : "")} onClick={() => setSymT(i)}>{l}</button>)}<span className="nb-sp" /><button className="nb-b" onClick={() => { const el = refs.current[foc]; setFoc(null); try { el && el.blur(); } catch {} }}>⌨️ إخفاء</button></div>
      <div className="ps">{NB_SYM[symT][1].map(x => <button key={x} onClick={() => insSym(x)}>{x}</button>)}</div></div>}
    {!ro && <div className="qz-ft">
      {!Z.graded ? <button className="nb-b big qz-go" disabled={Z.busy || !S.ans} onClick={() => { if (S.ans < S.tot && !window.confirm(`لم تُجب عن ${ar(S.tot - S.ans)} سؤال${S.tot - S.ans > 1 ? "ًا" : ""}. هل تريد التصحيح الآن؟`)) return; Z.grade(); }}>{Z.busy ? "⏳ جارٍ التصحيح…" : `✅ صحّح إجاباتي (${ar(S.ans)}/${ar(S.tot)})`}</button>
        : <>{S.G > S.C && <button className="nb-b big" onClick={Z.retry}>🔁 أعد محاولة الأخطاء</button>}<button className="nb-b big on" onClick={onClose}>تم</button></>}
    </div>}
  </div>;
}

// ── تقرير الإجابات الإلكترونية للمعلم والإدارة: الطلاب • الأسابيع • تحليل كل سؤال • مراجعة المكتوب • التغذية الراجعة
async function qPageImg(book, p, w = 1100) { const doc = await openDoc(book); const pg = await doc.getPage(p); const v1 = pg.getViewport({ scale: 1 }); const vp = pg.getViewport({ scale: w / v1.width });
  const c = document.createElement("canvas"); c.width = Math.floor(vp.width); c.height = Math.floor(vp.height); const g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height); await pg.render({ canvasContext: g, viewport: vp }).promise; return c.toDataURL("image/jpeg", 0.72); }
const qParse = s => { try { return JSON.parse(s); } catch {} const a = s.indexOf("{"), b = s.lastIndexOf("}"); if (a >= 0 && b > a) { try { return JSON.parse(s.slice(a, b + 1)); } catch {} } return null; };
async function qGenFb(api, book, p) {
  const Kx = await loadKeys(); const L = Array.isArray(obj(Kx[book])[p]) ? Kx[book][p] : []; if (!L.length) return null;
  const img = await qPageImg(book, p);
  const list = L.map(([n, t, a], i) => `${i}) السؤال ${stripH(n)} — ${stripH(t)} — الإجابة: ${stripH(a)}`).join("\n");
  const prompt = `هذه صفحة ${p} من «مرجع نافس» لمادة ${BOOKS[book].name} للصف الثالث المتوسط (الصورة مرفقة)، وهذا مفتاح إجاباتها:\n${list}\n\nالمطلوب لكل سؤال (بالرقم i نفسه) تغذية راجعة للطالب بلغة عربية سهلة يفهمها طالب الثالث المتوسط:\n• why: سطر أو سطران يشرحان لماذا الإجابة الصحيحة صحيحة (الفكرة أو القاعدة أو خطوة الحل)، دون مقدمات.\n• o0..o3 (لأسئلة الاختيار من متعدد فقط): لكل خيار خاطئ سبب الخطأ أو المفهوم الخاطئ الذي يقود الطالب إليه في جملة قصيرة، واترك الخيار الصحيح فارغًا "".\nاعتمد على نص السؤال والخيارات كما تظهر في الصورة، ولا تغيّر الإجابة الصحيحة الواردة في المفتاح.`;
  const schema = { type: "object", properties: { items: { type: "array", items: { type: "object", properties: { i: { type: "integer" }, why: { type: "string" }, o0: { type: "string" }, o1: { type: "string" }, o2: { type: "string" }, o3: { type: "string" } }, required: ["i", "why"] } } }, required: ["items"] };
  const r = await fetch("/api/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ hash: api.hash, prompt, images: [img], tag: `nbfb-${book}-${p}`, max: 4000, schema, kind: "nb" }) });
  const ct = r.headers.get("content-type") || ""; if (ct.includes("json") || !r.ok) { let j = {}; try { j = await r.json(); } catch {} throw new Error(j.msg || "خدمة الذكاء الاصطناعي غير متاحة الآن"); }
  const rd = r.body.getReader(), dc = new TextDecoder(); let out = ""; for (;;) { const { done, value } = await rd.read(); if (done) break; out += dc.decode(value, { stream: true }); }
  const j = qParse(out); if (!j || !Array.isArray(j.items)) throw new Error("تعذّر قراءة الرد");
  const cur = obj(await api.maGet(`${NB_FB}/${book}/${p}`)); const F = { ...cur };
  j.items.forEach(x => { const i = +x.i; if (!(i >= 0 && i < L.length)) return; const old = obj(cur[i]); if (old.man) return; const o = {}; [0, 1, 2, 3].forEach(k => { const s = String(x["o" + k] || "").trim(); if (s) o[k] = s; });
    F[i] = { r: String(x.why || "").trim(), ...(Object.keys(o).length ? { o } : {}), ai: 1 }; });
  await api.maPut(`${NB_FB}/${book}/${p}`, F); return F;
}

function NbResults({ api, books, cks, ros, by }) {
  const [book, setBook] = useState(books[0]); const [ck, setCk] = useState(cks[0] || ""); const [QR, setQR] = useState(null); const [pg, setPg] = useState(null); const [stu, setStu] = useState(null);
  const [gen, setGen] = useState(null); const [gw, setGw] = useState(0); const [fbHas, setFbHas] = useState({});
  const load = () => { setQR(null); api.maGet(NB_QR).then(d => setQR(obj(d))); api.maGet(NB_FB).then(d => { const F = obj(obj(d)[book]); setFbHas(Object.fromEntries(Object.keys(F).map(p => [p, 1]))); }); };
  useEffect(load, [book]);
  useEffect(() => { if (!cks.includes(ck)) setCk(cks[0] || ""); }, [cks.join()]);
  const B = BOOKS[book];
  const studs = arr(ros[ck] && ros[ck].students).filter(s => s && s.id && s.name);
  const wrap = n => <div className="nb-home"><style>{QZ_CSS}</style>{n}</div>;
  if (pg) return wrap(<QzPageAnalysis api={api} book={book} p={pg} studs={studs} ck={ck} by={by} onBack={() => { setPg(null); load(); }} onGo={setPg} />);
  if (!QR) return wrap(<div className="nb-msg">⏳ جارٍ تحميل النتائج…</div>);
  const R = s => obj(obj(QR[s.id])[book]);
  const rows = studs.map(s => { const P = R(s); let c = 0, g = 0, pn = 0, n = 0, f = [], at = 0; Object.values(P).forEach(x => { if (!x) return; c += +x.c || 0; g += +x.g || 0; pn += +x.p || 0; n += +x.n || 0; if (x.f != null) f.push(+x.f); at = Math.max(at, +x.at || 0); });
    return { s, pages: Object.keys(P).length, c, g, pn, n, v: qPct(c, g), f: f.length ? Math.round(f.reduce((a, b) => a + b, 0) / f.length) : null, at }; }).sort((a, b) => (b.v ?? -1) - (a.v ?? -1));
  const pagesAll = [...new Set(studs.flatMap(s => Object.keys(R(s)).map(Number)))].sort((a, b) => a - b);
  const pAvg = p => { let c = 0, g = 0, k = 0, pn = 0; studs.forEach(s => { const x = R(s)[p]; if (x) { c += +x.c || 0; g += +x.g || 0; pn += +x.p || 0; k++; } }); return { v: qPct(c, g), k, pn }; };
  const wAvg = w => { let c = 0, g = 0; studs.forEach(s => Object.entries(R(s)).forEach(([p, x]) => { if (x && (weekOfPage(book, +p) === w)) { c += +x.c || 0; g += +x.g || 0; } })); return qPct(c, g); };
  const act = rows.filter(r => r.pages); const avg = qPct(act.reduce((a, r) => a + r.c, 0), act.reduce((a, r) => a + r.g, 0));
  const pend = rows.reduce((a, r) => a + r.pn, 0), notes = rows.reduce((a, r) => a + r.n, 0);
  const genWeek = async () => { if (!api.hash) { alert("سجّل الدخول من بوابة المعلمين أو حساب الإدارة لاستعمال الذكاء الاصطناعي"); return; }
    const P = [...weekPages(book, gw), ...testPages(book, gw)].filter(p => qmOf(book, p).length && !fbHas[p]);
    if (!P.length) { alert("أسئلة هذا الأسبوع لها تغذية راجعة جاهزة ✓"); return; }
    if (!window.confirm(`تجهيز التغذية الراجعة (سبب الإجابة الصحيحة وسبب خطأ كل خيار) لـ ${ar(P.length)} صفحة من الأسبوع ${ar(gw + 1)} بالذكاء الاصطناعي؟\nتُراجَع وتُعدَّل بعدها من تحليل كل صفحة.`)) return;
    let ok = 0, err = ""; for (let k = 0; k < P.length; k++) { setGen(`⏳ صفحة ${ar(P[k])} (${ar(k + 1)} من ${ar(P.length)})`); try { await qGenFb(api, book, P[k]); ok++; setFbHas(h => ({ ...h, [P[k]]: 1 })); } catch (e) { err = e.message; if (/حد|السقف|أوقفت|مفتاح|سجّل|مسجّل/.test(err)) break; } }
    setGen(null); alert(`✅ جُهّزت ${ar(ok)} صفحة${err ? `\n⚠️ ${err}` : ""}`); };
  return wrap(<>
    <div className="nb-book" style={{ "--c": B.c }}>
      <div className="nb-h" style={{ gap: 6 }}><b style={{ fontSize: 17 }}>✅ الإجابات الإلكترونية والتصحيح الآلي</b><span className="nb-sp" />
        {books.length > 1 && books.map(b => <button key={b} className={"nb-b" + (book === b ? " on" : "")} style={{ "--c": BOOKS[b].c }} onClick={() => { setBook(b); setPg(null); }}>{BOOKS[b].name}</button>)}
        <button className="nb-b" onClick={load}>🔄</button></div>
      <div className="nb-h" style={{ gap: 6, marginTop: 8 }}>{cks.map(c => <button key={c} className={"nb-b" + (ck === c ? " on" : "")} onClick={() => setCk(c)}>فصل {cls(c)}</button>)}</div>
      <div className="nb-kpis" style={{ marginTop: 10 }}>
        <div className="nb-kpi"><b>{ar(act.length)}/{ar(studs.length)}</b><small>طالب أجاب إلكترونيًا</small><Bar v={pct(act.length, studs.length)} c={B.c} /></div>
        <div className="nb-kpi" style={{ "--c": qLvl(avg)[1] }}><b>{avg == null ? "—" : ar(avg) + "٪"}</b><small>متوسط الفصل • {qLvl(avg)[0]}</small></div>
        <div className="nb-kpi" style={{ "--c": "#b45309" }}><b>{ar(pend)}</b><small>إجابة مكتوبة بانتظار تقييمك</small></div>
        <div className="nb-kpi" style={{ "--c": "#2563eb" }}><b>{ar(notes)}</b><small>ملاحظة وسؤال من الطلاب</small></div>
      </div>
    </div>
    <div className="nb-book" style={{ "--c": B.c }}><b>📅 متوسط الفصل في كل أسبوع</b>
      <div className="qz-wk">{Array.from({ length: 15 }, (_, w) => { const v = wAvg(w); const Lv = qLvl(v); return <div key={w} title={`${B.titles[w * 2]} • ${B.titles[w * 2 + 1]}`}><i style={{ height: `${v ?? 0}%`, background: Lv[1] }} /><small>{v == null ? "" : ar(v)}</small><b>{ar(w + 1)}</b></div>; })}</div>
      <div className="nb-h" style={{ gap: 6, marginTop: 10 }}><b style={{ fontSize: 13.5 }}>🤖 التغذية الراجعة (سبب الخطأ):</b><select className="nb-sel" value={gw} onChange={e => setGw(+e.target.value)}>{Array.from({ length: 15 }, (_, w) => <option key={w} value={w}>الأسبوع {ar(w + 1)}</option>)}</select>
        <button className="nb-b on" disabled={!!gen} onClick={genWeek}>{gen || "تجهيزها بالذكاء الاصطناعي"}</button><small style={{ color: "#64748b", fontWeight: 700 }}>مرة واحدة لكل صفحة، وتظهر لكل الطلاب بعد التصحيح</small></div>
    </div>
    <div className="nb-book" style={{ "--c": B.c }}><b>📄 الصفحات التي أجاب عنها الطلاب — اضغط للتحليل والمراجعة</b>
      {!pagesAll.length ? <div className="nb-msg" style={{ padding: 16 }}>لم يُجب طلاب هذا الفصل إلكترونيًا بعد. يضغط الطالب دائرة الإجابة في الصفحة أو «📝 ورقة الإجابة» ثم «صحّح».</div>
        : <div className="qz-pgs">{pagesAll.map(p => { const a = pAvg(p), Lv = qLvl(a.v); return <button key={p} className="qz-pgb" style={{ "--lc": Lv[1] }} onClick={() => setPg(p)}><b>ص {ar(p)}</b><span>{a.v == null ? "⏳" : ar(a.v) + "٪"}</span><small>{ar(a.k)} طالب{a.pn ? ` • ⏳${ar(a.pn)}` : ""}{fbHas[p] ? " • 💡" : ""}</small></button>; })}</div>}
    </div>
    <div className="nb-book" style={{ "--c": B.c }}><b>🎓 نتائج الطلاب</b>
      <div className="nb-tbl-w" style={{ marginTop: 8 }}><table className="nb-tbl"><thead><tr><th className="r">الطالب</th><th>صفحات</th><th>النتيجة</th><th>المحاولة الأولى</th><th>المستوى</th><th>بانتظار التقييم</th><th>ملاحظات</th><th>آخر إجابة</th></tr></thead>
        <tbody>{rows.map(r => { const Lv = qLvl(r.v); return <tr key={r.s.id} className={r.pages ? "click" : ""} onClick={() => r.pages && setStu(stu === r.s.id ? null : r.s.id)}>
          <td className="r">{r.s.name}</td><td>{ar(r.pages)}</td>
          <td>{r.v == null ? "—" : <div style={{ display: "flex", alignItems: "center", gap: 5, justifyContent: "center" }}><Bar v={r.v} c={Lv[1]} w={56} /><b>{ar(r.v)}٪</b></div>}</td>
          <td>{r.f == null ? "—" : ar(r.f) + "٪"}</td><td><b style={{ color: Lv[1] }}>{r.pages ? Lv[0] : "لم يبدأ"}</b></td>
          <td>{r.pn ? <span className="nb-badge" style={{ background: "#b45309" }}>{ar(r.pn)}</span> : "—"}</td><td>{r.n ? `💬 ${ar(r.n)}` : "—"}</td><td style={{ color: "#64748b" }}>{when(r.at)}</td></tr>; })}</tbody></table></div>
      {stu && (() => { const s = studs.find(x => x.id === stu); const P = R(s); return <div className="qz-pgs" style={{ marginTop: 8 }}><b style={{ width: "100%", fontSize: 13.5 }}>صفحات {s.name}:</b>{Object.entries(P).sort((a, b) => a[0] - b[0]).map(([p, x]) => { const v = qPct(+x.c || 0, +x.g || 0); return <button key={p} className="qz-pgb" style={{ "--lc": qLvl(v)[1] }} onClick={() => setPg(+p)}><b>ص {ar(p)}</b><span>{v == null ? "⏳" : ar(v) + "٪"}</span><small>{ar(x.c || 0)}/{ar(x.g || 0)}{x.p ? ` • ⏳${ar(x.p)}` : ""}{x.n ? ` • 💬${ar(x.n)}` : ""}</small></button>; })}</div>; })()}
    </div>
  </>);
}

function QzPageAnalysis({ api, book, p, studs, ck, by, onBack, onGo }) {
  const [QA, setQA] = useState(null); const [K, setK] = useState(null); const [F, setF] = useState({}); const [fbEd, setFbEd] = useState(null); const [busy, setBusy] = useState(""); const [cm, setCm] = useState({});
  const load = () => Promise.all([api.maGet(`${NB_QA}/${book}/${p}`), loadKeys(), api.maGet(`${NB_FB}/${book}/${p}`)]).then(([a, k, f]) => { setQA(obj(a)); setK(k); setF(obj(f)); });
  useEffect(() => { setQA(null); load(); }, [book, p]);
  const B = BOOKS[book]; const QL = qmOf(book, p); const KL = K && Array.isArray(obj(K[book])[p]) ? K[book][p] : [];
  if (!QA || !K) return <div className="nb-msg">⏳ جارٍ تحميل إجابات الطلاب…</div>;
  const ids = new Set(studs.map(s => s.id)); const name = sid => (studs.find(s => s.id === sid) || {}).name || obj(QA[sid]).nm || sid;
  const L = Object.entries(QA).filter(([sid, R]) => R && (ids.has(sid) || (!ck && R))).map(([sid, R]) => ({ sid, R: obj(R) }));
  const review = async (sid, i, v) => { const R = obj(QA[sid]); const tr = { ...obj(R.tr) }; if (v == null) delete tr[i]; else tr[i] = v; const base = `${NB_QA}/${book}/${p}/${sid}`;
    await api.maPut(`${base}/tr/${i}`, v == null ? null : v); let g = R.g ? qApplyTr(R.g, tr) : null;
    if (R.g && v == null) { const r0 = { ...obj(R.g.r) }; r0[i] = qKindAt(book, p, i) === "m" || qKindAt(book, p, i) === "tf" ? r0[i] : (String(obj(R.a)[i] || "").trim() ? -1 : 0); g = qApplyTr({ ...R.g, r: r0 }, tr); }
    if (g) { await api.maPut(`${base}/g`, g); const q = obj(await api.maGet(`${NB_QR}/${sid}/${book}/${p}`)); await api.maPut(`${NB_QR}/${sid}/${book}/${p}`, { ...q, c: g.c, g: g.g, t: g.t, p: g.p }); }
    setQA(o => ({ ...o, [sid]: { ...R, tr, ...(g ? { g } : {}) } })); };
  const saveCm = async (sid, i) => { const t = String(cm[sid + "|" + i] ?? "").trim(); await api.maPut(`${NB_QA}/${book}/${p}/${sid}/c/${i}`, t || null); setQA(o => ({ ...o, [sid]: { ...obj(o[sid]), c: { ...obj(obj(o[sid]).c), [i]: t || undefined } } })); setCm(c => { const n = { ...c }; delete n[sid + "|" + i]; return n; }); };
  const saveFb = async (i, v) => { const n = { ...F }; if (!v.r && !Object.values(obj(v.o)).some(Boolean)) delete n[i]; else n[i] = { r: v.r || "", o: Object.fromEntries(Object.entries(obj(v.o)).filter(([, s]) => String(s || "").trim())), man: 1 }; await api.maPut(`${NB_FB}/${book}/${p}`, Object.keys(n).length ? n : null); setF(n); setFbEd(null); };
  const genAI = async () => { if (!api.hash) { alert("سجّل الدخول من بوابة المعلمين أو حساب الإدارة لاستعمال الذكاء الاصطناعي"); return; } setBusy("⏳ يجهّز الذكاء الاصطناعي التغذية الراجعة…"); try { const n = await qGenFb(api, book, p); if (n) setF(n); setBusy(""); } catch (e) { setBusy("⚠️ " + e.message); } };
  const graded = L.filter(x => x.R.g); let tc = 0, tg = 0; graded.forEach(x => { tc += x.R.g.c; tg += x.R.g.g; }); const v = qPct(tc, tg);
  return <>
    <div className="nb-book nb-h" style={{ "--c": B.c, gap: 6 }}><b>🔎 تحليل صفحة {ar(p)} • {B.name}{ck ? ` • فصل ${cls(ck)}` : ""}</b><span className="nb-tag" style={{ "--c": qLvl(v)[1] }}>{v == null ? "—" : ar(v) + "٪"} • {ar(graded.length)} طالب صحّح</span><span className="nb-sp" />
      <button className="nb-b" onClick={() => onGo(Math.max(1, p - 1))}>›</button><button className="nb-b" onClick={() => onGo(p + 1)}>‹</button>
      <button className="nb-b on" style={{ "--c": "#7c3aed" }} disabled={!!busy && busy.startsWith("⏳")} onClick={genAI}>🤖 {Object.keys(F).length ? "إعادة توليد" : "توليد"} التغذية الراجعة</button><button className="nb-b" onClick={onBack}>رجوع</button></div>
    {busy && <div className="nb-info" style={{ position: "static" }}>{busy}</div>}
    <details className="nb-book" style={{ "--c": B.c, padding: 8 }}><summary style={{ cursor: "pointer", fontWeight: 900, fontSize: 13.5 }}>📄 عرض صفحة المرجع</summary><PageImg key={p} book={book} p={p} w={900} /></details>
    {QL.map(([n, t, kd], i) => { const key = KL[i] ? KL[i][2] : ""; const ci = kd === "m" ? QLET.indexOf(stripH(key)[0]) : kd === "tf" ? (/^صواب/.test(stripH(key)) ? "ص" : "خ") : null;
      const ansd = L.filter(x => { const a = obj(x.R.a)[i]; return a != null && String(a).trim() !== ""; }); const rs = graded.map(x => obj(x.R.g.r)[i]); const okN = rs.filter(r => r === 1).length, gN = rs.filter(r => r === 0 || r === 1).length; const qv = qPct(okN, gN);
      const dist = kd === "m" ? QLET.map((_, j) => ansd.filter(x => +obj(x.R.a)[i] === j).length) : kd === "tf" ? ["ص", "خ"].map(k => ansd.filter(x => obj(x.R.a)[i] === k).length) : null;
      const wrongTop = dist && kd === "m" ? dist.map((c, j) => [c, j]).filter(([, j]) => j !== ci).sort((a, b) => b[0] - a[0])[0] : null;
      const fi = obj(F[i]); const ed = fbEd && fbEd.i === i ? fbEd : null;
      return <div key={i} className="nb-book qz-an" style={{ "--c": qLvl(qv)[1] }}>
        <div className="nb-h" style={{ gap: 6 }}><span className="qz-n" dangerouslySetInnerHTML={qHtml(n)} /><small className="qz-t">{t}</small><span className="nb-sp" /><b style={{ color: qLvl(qv)[1] }}>{qv == null ? "—" : `${ar(qv)}٪ إجابة صحيحة`}</b><small style={{ color: "#64748b", fontWeight: 800 }}>أجاب {ar(ansd.length)}</small></div>
        <div className="qz-key">🔑 <span dangerouslySetInnerHTML={qHtml(key)} /></div>
        {dist && <div className="qz-dist">{dist.map((c, j) => { const isOk = kd === "m" ? j === ci : ["ص", "خ"][j] === ci; return <div key={j} className={isOk ? "ok" : ""}><b>{kd === "m" ? QLET[j] : ["صواب", "خطأ"][j]}</b><span><i style={{ width: `${pct(c, ansd.length)}%` }} /></span><small>{ar(c)} ({ar(pct(c, ansd.length))}٪)</small></div>; })}</div>}
        {wrongTop && wrongTop[0] > 0 && pct(wrongTop[0], ansd.length) >= 25 && <div className="qz-fb bad" style={{ marginTop: 6 }}>⚠️ خطأ شائع: اختار {ar(pct(wrongTop[0], ansd.length))}٪ الخيار ({QLET[wrongTop[1]]}){fi.o && fi.o[wrongTop[1]] ? ` — ${fi.o[wrongTop[1]]}` : ""}. يُنصح بإعادة شرح هذه الفكرة.</div>}
        {(kd === "s" || kd === "o" || kd === "tf") && ansd.length > 0 && <div className="qz-ans">{ansd.map(x => { const a = obj(x.R.a)[i], r = x.R.g ? obj(x.R.g.r)[i] : undefined, tr = obj(x.R.tr)[i], sr = obj(x.R.sr)[i], nt = obj(x.R.n)[i], c0 = obj(x.R.c)[i], ck2 = x.sid + "|" + i;
          return <div key={x.sid} className={"qz-ar " + (r === 1 ? "ok" : r === 0 ? "bad" : r === -1 ? "wait" : "")}>
            <b>{name(x.sid)}</b><span className="qz-av" dir="auto">{kd === "tf" ? (a === "ص" ? "✔ صواب" : "✖ خطأ") + (obj(x.R.x)[i] ? ` — ${obj(x.R.x)[i]}` : "") : String(a)}</span>
            {sr != null && r === -1 && <small>تقييمه لنفسه: {sr ? "👍" : "👎"}</small>}
            <span className="qz-rv"><button className={"qz-chip" + (tr === 1 || (tr == null && r === 1) ? " on ok" : "")} onClick={() => review(x.sid, i, 1)}>✓ صحيحة</button><button className={"qz-chip" + (tr === 0 || (tr == null && r === 0) ? " on bad" : "")} onClick={() => review(x.sid, i, 0)}>✗ خطأ</button>{tr != null && <button className="qz-chip" title="إلغاء قرارك" onClick={() => review(x.sid, i, null)}>↺</button>}</span>
            {nt && <div className="qz-fb tc" style={{ flexBasis: "100%" }}>💬 ملاحظة الطالب: {nt}</div>}
            <div style={{ display: "flex", gap: 5, flexBasis: "100%" }}><input className="qz-in" style={{ padding: "5px 9px", fontSize: 13 }} value={cm[ck2] ?? c0 ?? ""} onChange={e => setCm(o => ({ ...o, [ck2]: e.target.value }))} placeholder="تعليقك للطالب على هذا السؤال (اختياري)" />{cm[ck2] != null && <button className="nb-b on" onClick={() => saveCm(x.sid, i)}>حفظ</button>}</div>
          </div>; })}</div>}
        {kd === "m" && L.some(x => obj(x.R.n)[i]) && <div className="qz-ans">{L.filter(x => obj(x.R.n)[i]).map(x => <div key={x.sid} className="qz-ar"><b>{name(x.sid)}</b><span className="qz-av">💬 {obj(x.R.n)[i]}</span>
          <div style={{ display: "flex", gap: 5, flexBasis: "100%" }}><input className="qz-in" style={{ padding: "5px 9px", fontSize: 13 }} value={cm[x.sid + "|" + i] ?? obj(x.R.c)[i] ?? ""} onChange={e => setCm(o => ({ ...o, [x.sid + "|" + i]: e.target.value }))} placeholder="ردّك على الطالب" />{cm[x.sid + "|" + i] != null && <button className="nb-b on" onClick={() => saveCm(x.sid, i)}>حفظ</button>}</div></div>)}</div>}
        {!ed ? <div className="qz-fbv">{fi.r || (fi.o && Object.keys(fi.o).length) ? <><div><b>💡 سبب الإجابة الصحيحة:</b> {fi.r || "—"}</div>{kd === "m" && fi.o && QLET.map((l, j) => fi.o[j] ? <div key={j}><b>({l}) خطأ لأن:</b> {fi.o[j]}</div> : null)}{fi.ai && !fi.man ? <small style={{ color: "#7c3aed" }}>🤖 مولّدة آليًا — راجعها</small> : null}</> : <small style={{ color: "#94a3b8", fontWeight: 800 }}>لا توجد تغذية راجعة مكتوبة لهذا السؤال — يرى الطالب الإجابة الصحيحة فقط</small>}
            <button className="nb-b" style={{ marginInlineStart: "auto" }} onClick={() => setFbEd({ i, r: fi.r || "", o: { ...obj(fi.o) } })}>✏️ تحرير التغذية الراجعة</button></div>
          : <div className="qz-fbe"><label>💡 لماذا الإجابة الصحيحة صحيحة؟<textarea className="qz-in" rows={2} value={ed.r} onChange={e => setFbEd({ ...ed, r: e.target.value })} /></label>
            {kd === "m" && QLET.map((l, j) => j === ci ? null : <label key={j}>({l}) سبب الخطأ / المفهوم الخاطئ<input className="qz-in" value={ed.o[j] || ""} onChange={e => setFbEd({ ...ed, o: { ...ed.o, [j]: e.target.value } })} /></label>)}
            <div className="nb-h" style={{ gap: 6 }}><button className="nb-b on" onClick={() => saveFb(i, ed)}>حفظ</button><button className="nb-b" onClick={() => setFbEd(null)}>إلغاء</button></div></div>}
      </div>; })}
  </>;
}

// نتيجة الطالب في كل كتاب (لمكتبته)
function QzMine({ api, sid, book, color }) {
  const [P, setP] = useState(null);
  useEffect(() => { api.maGet(`${NB_QR}/${sid}/${book}`).then(d => setP(obj(d))); }, [sid, book]);
  if (!P) return null; let c = 0, g = 0, pn = 0; const L = Object.values(P).filter(Boolean); L.forEach(x => { c += +x.c || 0; g += +x.g || 0; pn += +x.p || 0; }); if (!L.length) return null;
  const v = qPct(c, g), Lv = qLvl(v);
  return <div className="qz-mine" style={{ "--lc": Lv[1], "--c": color }}><b>✅ نتيجتي في الأسئلة: {v == null ? "⏳" : `${ar(v)}٪`}</b><span>{ar(c)} صحيحة من {ar(g)} • {ar(L.length)} صفحة صحّحتها{pn ? ` • ${ar(pn)} بانتظار المعلم` : ""}</span><em>{v == null ? "" : Lv[0]}</em></div>;
}

const QZ_CSS = `
.qz-bub{position:absolute;transform:translate(-50%,-50%);border-radius:50%;border:2px dashed color-mix(in srgb,var(--qc) 55%,transparent);background:rgba(255,255,255,.01);z-index:6;cursor:pointer;padding:0;display:grid;place-items:center;font:inherit;font-weight:900;color:#fff;line-height:1;transition:transform .12s,background .12s;-webkit-tap-highlight-color:transparent}
.qz-bub:hover{background:color-mix(in srgb,var(--qc) 18%,transparent);border-style:solid}
.qz-bub:active{transform:translate(-50%,-50%) scale(.9)}
.qz-bub.sel{background:var(--qc);border:2px solid var(--qc);box-shadow:0 0 0 3px color-mix(in srgb,var(--qc) 30%,transparent),0 3px 8px rgba(0,0,0,.25);animation:qzPop .25s}
.qz-bub.done{border-style:solid;border-color:transparent}
.qz-bub.done:not(.sel):not(.ok){background:transparent;border:0}
.qz-bub.ok{background:#16a34a;border:2px solid #16a34a;box-shadow:0 0 0 3px rgba(22,163,74,.3)}
.qz-bub.bad{background:#dc2626;border:2px solid #dc2626;box-shadow:0 0 0 3px rgba(220,38,38,.3)}
.qz-bub.ok:not(.sel){background:rgba(22,163,74,.18);color:#15803d}
@keyframes qzPop{0%{transform:translate(-50%,-50%) scale(.6)}70%{transform:translate(-50%,-50%) scale(1.15)}100%{transform:translate(-50%,-50%) scale(1)}}
.qz-fab{position:fixed;left:14px;bottom:calc(64px + env(safe-area-inset-bottom));z-index:2045;border:0;border-radius:999px;padding:12px 18px;font:inherit;font-weight:900;font-size:15px;color:#fff;background:linear-gradient(135deg,var(--c),#0f172a);box-shadow:0 10px 26px rgba(0,0,0,.28);cursor:pointer;display:flex;gap:8px;align-items:center}
.qz-fab small{background:rgba(255,255,255,.22);border-radius:999px;padding:2px 8px;font-size:12px}
.qz-sheet{position:fixed;left:0;right:0;z-index:2055;background:#fff;border-radius:22px 22px 0 0;box-shadow:0 -14px 40px rgba(15,23,42,.28);display:flex;flex-direction:column;max-height:72vh;border-top:4px solid var(--qc);animation:qzUp .22s ease-out}
@media(min-width:900px){.qz-sheet{left:auto;right:14px;top:auto;width:430px;border-radius:20px;bottom:14px!important;max-height:calc(100vh - 120px)!important;border:1px solid #e2e8f0;border-top:4px solid var(--qc)}}
@keyframes qzUp{from{transform:translateY(40px);opacity:.4}to{transform:none;opacity:1}}
.qz-hd{display:flex;align-items:center;gap:10px;padding:12px 14px 8px;border-bottom:1px solid #eef2f6}
.qz-hd small{color:#64748b;font-weight:800;font-size:12px}
.qz-prog{height:6px;border-radius:9px;background:#eef2f6;overflow:hidden;margin:5px 0 3px}.qz-prog i{display:block;height:100%;background:var(--qc);border-radius:9px;transition:width .3s}
.qz-score{display:grid;justify-items:center;padding:4px 10px;border-radius:14px;background:color-mix(in srgb,var(--lc) 12%,#fff);border:1.5px solid var(--lc);color:var(--lc)}
.qz-score b{font-size:19px;line-height:1.1}.qz-score small{color:inherit!important;font-size:10.5px!important}
.qz-body{overflow:auto;padding:10px 12px;display:grid;gap:10px;flex:1;overscroll-behavior:contain}
.qz-pg{display:flex;align-items:center;gap:8px;font-weight:900;color:var(--qc);font-size:13px;margin:4px 0 6px}.qz-pg span{flex:1;border-bottom:2px dotted #cbd5e1;padding-bottom:3px}
.qz-q{border:1.5px solid #e2e8f0;border-radius:16px;padding:10px 12px;display:grid;gap:8px;background:#fff;margin-bottom:8px}
.qz-q.ok{border-color:#86efac;background:#f7fef9}.qz-q.bad{border-color:#fca5a5;background:#fffafa}.qz-q.wait{border-color:#fcd34d;background:#fffdf5}.qz-q.skip{border-color:#cbd5e1;background:#f8fafc}
.qz-qh{display:flex;align-items:center;gap:7px;flex-wrap:wrap}
.qz-n{min-width:30px;height:30px;padding:0 6px;border-radius:999px;display:inline-grid;place-items:center;background:var(--qc,#334155);color:#fff;font-weight:900;font-size:14px}
.qz-an .qz-n{background:var(--c)}
.qz-t{color:#64748b;font-weight:800;font-size:12px}
.qz-r{font-weight:900;font-size:12.5px;padding:3px 10px;border-radius:999px}.qz-r.ok{background:#dcfce7;color:#15803d}.qz-r.bad{background:#fee2e2;color:#b91c1c}.qz-r.wait{background:#fef3c7;color:#92400e}.qz-r.skip{background:#f1f5f9;color:#475569}
.qz-opts{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.qz-opts.tf{grid-template-columns:1fr 1fr}
.qz-o{height:46px;border-radius:14px;border:2px solid #cbd5e1;background:#fff;font:inherit;font-size:19px;font-weight:900;color:#334155;cursor:pointer;transition:all .12s}
.qz-opts.tf .qz-o{font-size:15.5px}
.qz-o:not(:disabled):hover{border-color:var(--qc)}.qz-o:not(:disabled):active{transform:scale(.95)}
.qz-o.sel{background:var(--qc);border-color:var(--qc);color:#fff;box-shadow:0 4px 12px color-mix(in srgb,var(--qc) 35%,transparent)}
.qz-o.ok{background:#16a34a;border-color:#16a34a;color:#fff}.qz-o.ok:not(.sel){background:#dcfce7;color:#15803d}
.qz-o.bad{background:#dc2626;border-color:#dc2626;color:#fff}
.qz-o:disabled{cursor:default;opacity:1}
.qz-in{width:100%;box-sizing:border-box;border:1.5px solid #cbd5e1;border-radius:12px;padding:10px 12px;font:inherit;font-size:16px;font-weight:700;resize:vertical;background:#fff;color:#0f172a;outline:none;transition:border .12s,box-shadow .12s}
.qz-in:focus{border-color:var(--qc,#2563eb);box-shadow:0 0 0 3px color-mix(in srgb,var(--qc,#2563eb) 20%,transparent)}
.qz-in:disabled{background:#f8fafc;color:#334155}
.qz-in.note{font-size:14.5px;background:#f8fbff;border-style:dashed}
.qz-add{justify-self:start;border:0;background:none;color:#2563eb;font:inherit;font-weight:800;font-size:12.5px;cursor:pointer;padding:0}
.qz-fb{border-radius:12px;padding:8px 11px;font-size:13.5px;font-weight:700;line-height:1.8;display:grid;gap:3px}
.qz-fb.bad{background:#fef2f2;color:#7f1d1d;border:1px solid #fecaca}.qz-fb.ok{background:#f0fdf4;color:#14532d;border:1px solid #bbf7d0}.qz-fb.wait{background:#fffbeb;color:#78350f;border:1px solid #fde68a}.qz-fb.skip{background:#f8fafc;color:#334155;border:1px solid #e2e8f0}.qz-fb.tc{background:#eff6ff;color:#1e3a8a;border:1px solid #bfdbfe}
.qz-fl{font-weight:900}
.qz-self{display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-top:4px;font-weight:800}
.qz-chip{border:1.5px solid #cbd5e1;background:#fff;border-radius:999px;padding:4px 11px;font:inherit;font-size:12.5px;font-weight:800;cursor:pointer}
.qz-chip.on.ok{background:#16a34a;border-color:#16a34a;color:#fff}.qz-chip.on.bad{background:#dc2626;border-color:#dc2626;color:#fff}
.qz-ft{display:flex;gap:8px;padding:10px 12px calc(10px + env(safe-area-inset-bottom));border-top:1px solid #eef2f6;background:#fff;border-radius:0 0 20px 20px}
.qz-ft .nb-b{flex:1;justify-content:center;padding:12px;font-size:15.5px}
.qz-go{background:linear-gradient(135deg,#16a34a,#0f766e)!important;color:#fff!important;border-color:transparent!important}
.qz-go:disabled{opacity:.55}
.qz-sheet.kb .qz-ft{display:none}
.qz-sym{border-top:2px solid var(--qc);background:#f8fafc;padding:6px 8px}
.qz-sym .pt{display:flex;gap:5px;align-items:center;overflow-x:auto}.qz-sym .ps{display:flex;gap:5px;overflow-x:auto;padding-top:6px}
.qz-sym .ps button{flex:none;min-width:42px;height:40px;border-radius:10px;border:1px solid #cbd5e1;background:#fff;font:inherit;font-size:17px;font-weight:800;cursor:pointer;padding:0 8px;direction:ltr}
.qz-wk{display:grid;grid-template-columns:repeat(15,1fr);gap:4px;align-items:end;height:120px;margin-top:8px}
.qz-wk>div{display:grid;grid-template-rows:1fr auto auto;height:100%;text-align:center}.qz-wk i{align-self:end;display:block;border-radius:6px 6px 2px 2px;min-height:3px;transition:height .3s}
.qz-wk small{font-size:10.5px;font-weight:800;color:#475569}.qz-wk b{font-size:11px;color:#94a3b8}
.qz-pgs{display:flex;flex-wrap:wrap;gap:7px;margin-top:8px}
.qz-pgb{border:1.5px solid var(--lc);border-radius:13px;background:color-mix(in srgb,var(--lc) 8%,#fff);padding:6px 11px;display:grid;justify-items:center;gap:1px;cursor:pointer;font:inherit;min-width:78px}
.qz-pgb b{font-size:13px}.qz-pgb span{font-weight:900;color:var(--lc);font-size:15px}.qz-pgb small{font-size:10.5px;color:#64748b;font-weight:800}
.qz-key{font-weight:800;font-size:13.5px;background:#fffbeb;border:1px dashed #f59e0b;border-radius:10px;padding:6px 10px;margin-top:6px}
.qz-dist{display:grid;gap:5px;margin-top:8px}.qz-dist>div{display:grid;grid-template-columns:44px 1fr 90px;gap:8px;align-items:center;font-weight:800;font-size:13px}
.qz-dist span{height:12px;border-radius:9px;background:#f1f5f9;overflow:hidden}.qz-dist span i{display:block;height:100%;background:#f87171;border-radius:9px}
.qz-dist .ok span i{background:#16a34a}.qz-dist .ok b{color:#15803d}
.qz-ans{display:grid;gap:6px;margin-top:8px}
.qz-ar{display:flex;flex-wrap:wrap;gap:6px 10px;align-items:center;border:1px solid #e2e8f0;border-radius:12px;padding:7px 10px;font-size:13.5px}
.qz-ar.ok{border-color:#86efac;background:#f7fef9}.qz-ar.bad{border-color:#fca5a5;background:#fffafa}.qz-ar.wait{border-color:#fcd34d;background:#fffdf5}
.qz-ar>b{min-width:120px}.qz-av{flex:1;min-width:140px;font-weight:700;white-space:pre-wrap}.qz-rv{display:flex;gap:4px}
.qz-fbv{display:flex;flex-wrap:wrap;gap:4px 10px;align-items:center;margin-top:8px;background:#faf5ff;border:1px solid #e9d5ff;border-radius:12px;padding:8px 10px;font-size:13.5px;font-weight:700;line-height:1.8}
.qz-fbv>div{flex-basis:100%}
.qz-fbe{display:grid;gap:6px;margin-top:8px;background:#faf5ff;border:1px solid #e9d5ff;border-radius:12px;padding:8px 10px}.qz-fbe label{display:grid;gap:3px;font-weight:900;font-size:12.5px;color:#6b21a8}
.qz-mine{display:flex;flex-wrap:wrap;align-items:center;gap:4px 12px;border-radius:14px;padding:8px 12px;margin-top:8px;background:color-mix(in srgb,var(--lc) 9%,#fff);border:1.5px solid color-mix(in srgb,var(--lc) 50%,#fff)}
.qz-mine b{color:var(--lc);font-size:15px}.qz-mine span{font-size:12.5px;font-weight:800;color:#475569}.qz-mine em{font-style:normal;font-weight:900;color:var(--lc);margin-inline-start:auto}
`;

// ════════════════════════════════════════════════════════════════════
// 🎯 مركز المتابعة والاختبار الورقي (للإدارة)
//   ١) الطلاب الأقل أداءً والذين لم يدخلوا أو لم يحلوا: من المراجع (الدخول • الدفتر • الإجابات الإلكترونية • اختبارات الأسابيع) ومن منصة اختبارات نافس (#nafes)
//   ٢) مولّد اختبار نافس الورقي: من الأسابيع التي اكتمل شرحها في كل الفصول المختارة — تُقصّ الأسئلة من صفحات المرجع نفسها (nafs/qbox.js)
//   ٣) مستوى الأداء: شرح المعلمين وإنجازهم • حل الطلاب ونتائجهم • ملاحظات آلية
//   school-nafsbook-ptest/{id} = { t, at, by, books, cks, weeks:{book:[w]}, items:{book:[[p,i]]}, min, n, src, mode }
// ════════════════════════════════════════════════════════════════════
const NB_PT = "school-nafsbook-ptest", NQ_RESN = "school-nq-res";
// أيام الدراسة منذ تاريخ (لا تُحسب الإجازات ولا نهاية الأسبوع) — off: maOff من الموقع
const schDays = (ts, off) => { const dk = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; const t0 = new Date(ts); t0.setHours(0, 0, 0, 0); const now = new Date(); now.setHours(0, 0, 0, 0); let n = 0;
  for (let d = new Date(t0.getTime() + 864e5), i = 0; d <= now && i < 400; d = new Date(d.getTime() + 864e5), i++) { const w = d.getDay(); if (off ? !off(dk(d)) : (w !== 5 && w !== 6)) n++; } return n; };
const cRnd = seed => { let s = (seed >>> 0) || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); };
const cShuf = (a, r) => { const x = [...a]; for (let i = x.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [x[i], x[j]] = [x[j], x[i]]; } return x; };
const wkList = W => { const a = [...W].sort((x, y) => x - y); if (!a.length) return "—"; const out = []; let s = a[0], p = a[0]; for (let i = 1; i <= a.length; i++) { if (a[i] === p + 1) { p = a[i]; continue; } out.push(s === p ? ar(s + 1) : `${ar(s + 1)}–${ar(p + 1)}`); s = p = a[i]; } return out.join("، "); };
// الأسابيع المكتمل شرحها لفصل في مادة (من خطط كل معلمي المادة لذلك الفصل)
const ckWeeks = (D, rows, ck, b) => { const S = new Set(); rows.filter(r => r.book === b && r.cks.includes(ck)).forEach(r => { const P = obj(obj(obj(D.tp[r.key])[b])[ck]); for (let w = 0; w < 15; w++) if (weekPct(P, b, w) === 100) S.add(w); }); return S; };
// معلم المادة للفصل: إن تعدّد (الجدول + خطة يدوية) يُعتمد صاحب أعلى إنجاز مسجّل
const ckRow = (rows, ck, b, D) => { const L = rows.filter(r => r.book === b && r.cks.includes(ck)); if (L.length < 2 || !D) return L[0]; return L.map(r => [r, bookPct(obj(obj(obj(D.tp[r.key])[b])[ck]), b) + (Object.keys(obj(obj(obj(D.tp[r.key])[b])[ck])).length ? .5 : 0)]).sort((x, y) => y[1] - x[1])[0][0]; };
// مخزون أسئلة الاختيار من متعدد لأسابيع محددة
const cPool = (b, weeks, lessons) => { const out = []; [...weeks].forEach(w => {
  testPages(b, w).forEach(p => arr(obj(QB[b])[p]).forEach(([i, y0, y1]) => out.push({ b, w, p, i, y0, y1, t: 1 })));
  if (lessons) weekPages(b, w).forEach(p => arr(obj(QB[b])[p]).forEach(([i, y0, y1]) => { if (arr(obj(QCTX[b])[p]).includes(i)) return; out.push({ b, w, p, i, y0, y1, t: 0 }); }));
}); return out; };
// اختيار متوازن بين الأسابيع (أسئلة اختبار الأسبوع أولًا ثم أسئلة الدروس)
const cPick = (pool, n, r) => { const by = {}; pool.forEach(q => (by[q.w] = by[q.w] || []).push(q)); const W = Object.keys(by).map(Number).sort((a, b) => a - b);
  W.forEach(w => { by[w] = [...cShuf(by[w].filter(q => q.t), r), ...cShuf(by[w].filter(q => !q.t), r)]; });
  const out = []; let k = 0; while (out.length < n && W.some(w => by[w].length)) { const w = W[k++ % W.length]; if (by[w].length) out.push(by[w].shift()); }
  return out.sort((a, b) => a.w - b.w || a.p - b.p || a.i - b.i); };
// قصّ الأسئلة من صفحات PDF (صفحة صفحة لتوفير الذاكرة)
async function cPageCanvas(b, p, W = 1400) { const doc = await openDoc(b); const pg = await doc.getPage(p); const v = pg.getViewport({ scale: 1 }); const vp = pg.getViewport({ scale: W / v.width }); const c = document.createElement("canvas"); c.width = Math.round(vp.width); c.height = Math.round(vp.height); const g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height); await pg.render({ canvasContext: g, viewport: vp }).promise; return c; }
function cCrop(c, y0, y1, x0 = .03, x1 = .908, mask = 0) { const W = c.width, H = c.height; const sx = Math.round(x0 * W), sw = Math.round((x1 - x0) * W), sy = Math.round(y0 * H), sh = Math.max(4, Math.round((y1 - y0) * H)); const o = document.createElement("canvas"); o.width = sw; o.height = sh; const g = o.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, sw, sh); g.drawImage(c, sx, sy, sw, sh, 0, 0, sw, sh); if (mask) { g.fillStyle = "#fff"; g.fillRect(sw - Math.round(.013 * W), 0, Math.round(.013 * W) + 2, Math.round(mask * H)); } return o.toDataURL("image/jpeg", .9); }
const C_CSS = `
.cc-sub{display:flex;gap:6px;flex-wrap:wrap}.cc-sub button{flex:1 1 180px;border:2px solid #e2e8f0;background:#fff;border-radius:14px;padding:10px 12px;font:inherit;font-weight:900;font-size:14px;cursor:pointer;color:#334155;text-align:right;display:flex;gap:8px;align-items:center}
.cc-sub button small{display:block;font-weight:700;font-size:11.5px;color:#64748b}.cc-sub button.on{border-color:#1e3a8a;background:linear-gradient(135deg,#1e3a8a,#1d4ed8);color:#fff}.cc-sub button.on small{color:#dbeafe}
.cc-chips{display:flex;gap:6px;flex-wrap:wrap;align-items:center}.cc-chip{border:1.5px solid #cbd5e1;background:#fff;border-radius:99px;padding:5px 12px;font:inherit;font-weight:800;font-size:13px;cursor:pointer;color:#334155}
.cc-chip.on{background:var(--c,#1e3a8a);border-color:var(--c,#1e3a8a);color:#fff}
.cc-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px}
.cc-card{border:2px solid #e2e8f0;background:#fff;border-radius:14px;padding:10px;text-align:center;cursor:pointer;font:inherit;border-top:5px solid var(--c)}
.cc-card b{display:block;font-size:26px;font-weight:900;color:var(--c)}.cc-card small{font-weight:800;color:#475569;font-size:12px}.cc-card.on{background:color-mix(in srgb,var(--c) 10%,#fff);border-color:var(--c)}
.cc-wk{border-collapse:collapse;font-size:12.5px;font-weight:800;width:100%}.cc-wk th,.cc-wk td{border:1px solid #e2e8f0;padding:5px 3px;text-align:center;min-width:28px}.cc-wk th{background:#f8fafc}.cc-wk td.r{text-align:right;white-space:nowrap;padding:5px 8px}
.cc-wk .y{background:#dcfce7;color:#15803d}.cc-wk .n{background:#fff;color:#cbd5e1}.cc-wk th.sel{background:#1e3a8a;color:#fff;cursor:pointer}.cc-wk th.can{cursor:pointer}.cc-wk th.off{background:#f1f5f9;color:#94a3b8;cursor:pointer;text-decoration:line-through}
.cc-row{display:flex;gap:10px;flex-wrap:wrap;align-items:center}.cc-row label{display:flex;gap:6px;align-items:center;font-weight:800;font-size:13px}
.cc-in{border:1.5px solid #cbd5e1;border-radius:10px;padding:6px 10px;font:inherit;font-weight:800;width:80px;text-align:center}
.cc-ins{display:grid;gap:6px}.cc-ins div{border-radius:12px;padding:8px 12px;font-weight:800;font-size:13.5px;line-height:1.8;border-right:5px solid var(--c);background:color-mix(in srgb,var(--c) 7%,#fff)}
.cc-lv{display:inline-block;border-radius:99px;padding:2px 10px;font-weight:900;font-size:12px;color:#fff;background:var(--c)}
`;

function NbCenter({ api, D, M, by, onStu }) {
  const [sub, setSub] = useState("low");
  const [books, setBooks] = useState(BOOK_IDS); const [cks, setCks] = useState(M.cks);
  const [X, setX] = useState(null);   // { QR, NQ:[exams], NR:{exId:{sid|n:name:rec}} }
  useEffect(() => { (async () => {
    const [qr, ex, rs] = await Promise.all([api.maGet(NB_QR), api.maGet(NQ_EXN).catch(() => null), api.maGet(NQ_RESN).catch(() => null)]);
    const NQ = Object.values(obj(ex)).filter(e => e && e.id && arr(e.subjects).some(s => arr(s.questions).length));
    const NR = {}; Object.entries(obj(rs)).forEach(([eid, recs]) => { const m = {}; Object.values(obj(recs)).forEach(r => { if (!r) return; if (r.sid) m[r.sid] = r; if (r.name) m["n:" + r.ck + ":" + r.name] = r; }); NR[eid] = m; });
    setX({ QR: obj(qr), NQ, NR });
  })(); }, []);
  const tog = (L, v, set) => set(L.includes(v) ? L.filter(x => x !== v) : [...L, v]);
  const Filters = ({ noBooks }) => <div className="nb-book" style={{ "--c": "#334155", display: "grid", gap: 8 }}>
    <div className="cc-chips"><b style={{ fontSize: 13 }}>الفصول:</b>{M.cks.map(ck => <button key={ck} className={"cc-chip" + (cks.includes(ck) ? " on" : "")} onClick={() => tog(cks, ck, setCks)}>{cls(ck)}</button>)}<button className="cc-chip" onClick={() => setCks(cks.length === M.cks.length ? [] : M.cks)}>{cks.length === M.cks.length ? "إلغاء الكل" : "الكل"}</button></div>
    {!noBooks && <div className="cc-chips"><b style={{ fontSize: 13 }}>المواد:</b>{BOOK_IDS.map(b => <button key={b} className={"cc-chip" + (books.includes(b) ? " on" : "")} style={{ "--c": BOOKS[b].c }} onClick={() => tog(books, b, setBooks)}>{BOOKS[b].name}</button>)}</div>}
  </div>;
  return <>
    <style>{C_CSS}</style>
    <div className="nb-book" style={{ "--c": "#1e3a8a" }}>
      <div className="nb-h"><b style={{ fontSize: 17 }}>🎯 مركز المتابعة والاختبار الورقي</b></div>
      <div className="cc-sub" style={{ marginTop: 8 }}>{[["low", "👥", "الطلاب المحتاجون للمتابعة", "الأقل أداءً • لم يدخلوا • لم يحلوا"], ["test", "🖨️", "إنشاء اختبار نافس ورقي", "من الأسابيع المكتملة في كل الفصول"], ["perf", "📈", "مستوى الأداء", "شرح المعلمين وإنجازهم • حل الطلاب"]].map(([k, ic, t, s]) =>
        <button key={k} className={sub === k ? "on" : ""} onClick={() => setSub(k)}><span style={{ fontSize: 24 }}>{ic}</span><span>{t}<small>{s}</small></span></button>)}</div>
    </div>
    <Filters />
    {!cks.length || !books.length ? <div className="nb-book nb-msg">اختر فصلًا ومادة على الأقل</div>
      : !X ? <div className="nb-book nb-msg">⏳ جارٍ تحميل النتائج…</div>
      : sub === "low" ? <CcLow api={api} D={D} M={M} X={X} cks={cks} books={books} onStu={onStu} />
      : sub === "test" ? <CcTest api={api} D={D} M={M} cks={cks} books={books} by={by} />
      : <CcPerf D={D} M={M} X={X} cks={cks} books={books} />}
  </>;
}

// ── حساب حالة الطالب في المواد المختارة
function ccStat(D, M, X, s, books) {
  const sd = obj(D.seen[s.id]), ix = obj(D.idx[s.id]), qr = obj(X.QR[s.id]); let lastAt = +sd.at || 0;
  const per = {}; let tMiss = 0, nMiss = 0, wkDone = 0;
  books.forEach(b => {
    const pages = Object.keys(obj(ix[b])).length; const bAt = +obj(obj(sd.b)[b]).at || 0; lastAt = Math.max(lastAt, bAt);
    let c = 0, g = 0; Object.values(obj(qr[b])).forEach(x => { if (x) { c += +x.c || 0; g += +x.g || 0; lastAt = Math.max(lastAt, +x.at || 0); } });
    const wk = [...ckWeeks(D, M.rows, s.ck, b)]; const tm = wk.filter(w => !testSolved(ix[b], b, w)); tMiss += tm.length; wkDone += wk.length;
    let ns = 0, nm = 0, nT = 0, nM = 0; const sn = NQ_OF[b];
    X.NQ.forEach(e => { const sb = arr(e.subjects).find(x => x.name === sn); if (!sb || !arr(sb.questions).length) return; const R = obj(X.NR[e.id]); const r = R[s.id] || R["n:" + s.ck + ":" + s.name];
      const tgt = r || arr(e.cls).includes(s.ck) || e.allowAll; if (!tgt) return;
      if (r && r.res) { const sc = obj(obj(r.res.subjectScores)[sn]); ns += +sc.score || 0; nm += +sc.maxScore || 0; nT++; lastAt = Math.max(lastAt, +r.ts || 0); } else if (e.open !== 0 && e.open !== false) nM++; });
    nMiss += nM;
    per[b] = { pages, qv: qPct(c, g), g, nv: qPct(ns, nm), nT, nM, tm, wk: wk.length };
  });
  const vals = books.flatMap(b => [per[b].qv, per[b].nv]).filter(v => v != null);
  const v = vals.length ? Math.round(vals.reduce((a, x) => a + x, 0) / vals.length) : null;
  const entered = !!(sd.at || Object.keys(ix).length || Object.keys(qr).length || books.some(b => per[b].nT));
  const solved = books.some(b => per[b].pages || per[b].g || per[b].nT);
  return { s, per, v, entered, solved, lastAt, tMiss, nMiss, wkDone };
}

function CcLow({ api, D, M, X, cks, books, onStu }) {
  const [f, setF] = useState("low"); const [thr, setThr] = useState(60); const [q, setQ] = useState("");
  const S = useMemo(() => M.studs.filter(s => cks.includes(s.ck)).map(s => ccStat(D, M, X, s, books)), [cks.join(), books.join(), X]);
  const now = Date.now();
  const G = {
    none: S.filter(x => !x.entered),
    idle: S.filter(x => x.entered && !x.solved),
    low: S.filter(x => x.v != null && x.v < thr).sort((a, b) => a.v - b.v),
    miss: S.filter(x => x.tMiss || x.nMiss).sort((a, b) => (b.tMiss + b.nMiss) - (a.tMiss + a.nMiss)),
    stale: S.filter(x => x.entered && x.lastAt && schDays(x.lastAt, api.maOff) > 10).sort((a, b) => a.lastAt - b.lastAt),
  };
  const CARDS = [["low", "📉", `الأقل أداءً (أقل من ${ar(thr)}٪)`, "#dc2626"], ["none", "🚫", "لم يدخلوا المراجع ولا النماذج", "#7f1d1d"], ["idle", "💤", "دخلوا ولم يحلوا شيئًا", "#b45309"], ["miss", "📝", "فاتهم اختبار أسبوع أو نموذج", "#7c3aed"], ["stale", "⏰", "انقطعوا أكثر من ١٠ أيام دراسية", "#0f766e"]];
  const L = G[f].filter(x => !q || x.s.name.includes(q.trim()));
  const lvl = v => qLvl(v);
  const cell = (x, b) => { const P = x.per[b]; const vv = [P.qv, P.nv].filter(v => v != null); const v = vv.length ? Math.round(vv.reduce((a, y) => a + y, 0) / vv.length) : null;
    return <td key={b}><div style={{ display: "grid", gap: 2, justifyItems: "center" }}>{v == null ? <b style={{ color: "#cbd5e1" }}>—</b> : <b style={{ color: lvl(v)[1] }}>{ar(v)}٪</b>}
      <small style={{ color: "#64748b", fontSize: 11 }}>📖 {ar(P.pages)} ص{P.nT ? ` • 🎯 ${ar(P.nT)}` : ""}{P.tm.length ? <span style={{ color: "#7c3aed" }}> • فاته اختبار: {wkList(P.tm)}</span> : ""}</small></div></td>; };
  const why = x => f === "none" ? "لم يسجّل أي دخول" : f === "idle" ? `دخل ${when(x.lastAt)} ولم يحل` : f === "stale" ? `آخر نشاط ${when(x.lastAt)}` : f === "miss" ? [x.tMiss ? `${ar(x.tMiss)} اختبار أسبوع` : "", x.nMiss ? `${ar(x.nMiss)} نموذج على المنصة` : ""].filter(Boolean).join(" + ") : lvl(x.v)[0];
  const printIt = () => { const C = CARDS.find(c => c[0] === f); lrPrint(C[2], `<h1>${C[1]} ${C[2]}</h1><div class="sub">مراجع نافس ومنصة النماذج • ${books.map(b => BOOKS[b].name).join("، ")} • الفصول: ${cks.map(cls).join("، ")} • ${new Date().toLocaleDateString("ar-SA")}</div>
    <table><thead><tr><th>م</th><th>الطالب</th><th>الفصل</th>${books.map(b => `<th>${BOOKS[b].name}</th>`).join("")}<th>الملاحظة</th><th>الإجراء</th></tr></thead><tbody>${L.map((x, i) => `<tr><td>${ar(i + 1)}</td><td class="r">${x.s.name}</td><td>${cls(x.s.ck)}</td>${books.map(b => { const P = x.per[b]; const vv = [P.qv, P.nv].filter(v => v != null); const v = vv.length ? Math.round(vv.reduce((a, y) => a + y, 0) / vv.length) : null; return `<td>${v == null ? "—" : ar(v) + "٪"}<br><small>${ar(P.pages)} صفحة</small></td>`; }).join("")}<td>${why(x)}</td><td style="width:90px"></td></tr>`).join("")}</tbody></table><div class="sg"><span>المعلم: ................</span><span>الموجّه الطلابي: ................</span><span>مدير المدرسة: ................</span></div>`); };
  const copy = () => { const t = L.map((x, i) => `${i + 1}- ${x.s.name} (${cls(x.s.ck)})${x.v != null ? " " + x.v + "%" : ""}`).join("\n"); navigator.clipboard && navigator.clipboard.writeText(t).then(() => alert("✅ نُسخت الأسماء")).catch(() => {}); };
  return <>
    <div className="cc-cards">{CARDS.map(([k, ic, t, c]) => <button key={k} className={"cc-card" + (f === k ? " on" : "")} style={{ "--c": c }} onClick={() => setF(k)}><b>{ar(G[k].length)}</b><small>{ic} {t}</small></button>)}</div>
    <div className="nb-book" style={{ "--c": "#334155" }}>
      <div className="nb-h" style={{ gap: 8 }}><b>{CARDS.find(c => c[0] === f)[1]} {CARDS.find(c => c[0] === f)[2]} — {ar(L.length)} طالب</b><span className="nb-sp" />
        {f === "low" && <label style={{ fontWeight: 800, fontSize: 13 }}>الحد: <select className="nb-sel" value={thr} onChange={e => setThr(+e.target.value)}>{[50, 60, 70, 75].map(v => <option key={v} value={v}>أقل من {ar(v)}٪</option>)}</select></label>}
        <input className="cc-in" style={{ width: 150 }} placeholder="🔎 اسم الطالب" value={q} onChange={e => setQ(e.target.value)} />
        <button className="nb-b" disabled={!L.length} onClick={copy}>📋 نسخ الأسماء</button><button className="nb-b on" disabled={!L.length} onClick={printIt}>🖨️ طباعة القائمة</button></div>
      <p style={{ margin: "6px 0 8px", fontSize: 12.5, fontWeight: 700, color: "#64748b", lineHeight: 1.8 }}>النسبة لكل مادة = متوسط نتيجة الإجابات الإلكترونية في المرجع ونتيجة نماذج المنصة (#nafes) • 📖 الصفحات المحلولة في الدفتر • 🎯 النماذج المختبَرة • «فاته اختبار» أسابيع اكتمل شرحها لفصله ولم يحل اختبارها</p>
      {!L.length ? <div className="nb-msg" style={{ padding: 18, color: "#15803d" }}>✅ لا يوجد طلاب في هذا التصنيف</div> :
        <div className="nb-tbl-w"><table className="nb-tbl"><thead><tr><th>م</th><th className="r">الطالب</th><th>الفصل</th>{books.map(b => <th key={b} style={{ color: BOOKS[b].c }}>{BOOKS[b].name}</th>)}<th>العام</th><th>الملاحظة</th><th>آخر نشاط</th></tr></thead>
          <tbody>{L.map((x, i) => <tr key={x.s.id} className="click" onClick={() => onStu(x.s)}><td>{ar(i + 1)}</td><td className="r">{x.s.name}</td><td>{cls(x.s.ck)}</td>{books.map(b => cell(x, b))}
            <td>{x.v == null ? "—" : <span className="cc-lv" style={{ "--c": lvl(x.v)[1] }}>{ar(x.v)}٪</span>}</td><td style={{ fontSize: 12, color: "#475569" }}>{why(x)}</td><td style={{ color: "#64748b" }}>{when(x.lastAt)}</td></tr>)}</tbody></table></div>}
      <small style={{ color: "#64748b", fontWeight: 700 }}>اضغط اسم الطالب لفتح دفتره وإجاباته</small>
    </div>
  </>;
}

// ── 🖨️ مولّد الاختبار الورقي
function CcTest({ api, D, M, cks, books, by }) {
  const [mode, setMode] = useState("common"); const [man, setMan] = useState({});   // man: {book:{w:true|false}}
  const [n, setN] = useState(10); const [mins, setMins] = useState(30); const [les, setLes] = useState(false); const [two, setTwo] = useState(false);
  const [sheet, setSheet] = useState(true); const [key, setKey] = useState(true); const [ttl, setTtl] = useState("اختبار نافس التجريبي"); const [busy, setBusy] = useState(""); const [saved, setSaved] = useState(null);
  useEffect(() => { api.maGet(NB_PT).then(d => setSaved(Object.values(obj(d)).filter(x => x && x.id).sort((a, b) => (b.at || 0) - (a.at || 0)))); }, []);
  const CW = useMemo(() => { const o = {}; books.forEach(b => { o[b] = {}; cks.forEach(ck => { o[b][ck] = ckWeeks(D, M.rows, ck, b); }); }); return o; }, [books.join(), cks.join()]);
  const weeksOf = b => { const sets = cks.map(ck => CW[b][ck]); let W = [];
    for (let w = 0; w < 15; w++) { const all = sets.every(s => s.has(w)), any = sets.some(s => s.has(w)); const auto = mode === "any" ? any : all; const m = obj(man[b])[w]; if (m === true ? any || all : m === false ? false : auto) W.push(w); }
    return W; };
  const setM = (b, w, v) => setMan(m => ({ ...m, [b]: { ...obj(m[b]), [w]: v } }));
  const plan = books.map(b => { const W = weeksOf(b); const pool = cPool(b, W, les); const late = cks.map(ck => ({ ck, n: CW[b][ck].size })).sort((a, c) => a.n - c.n); return { b, W, pool, late }; });
  const make = async (rec) => {
    const w = window.open("", "_blank"); if (!w) { alert("اسمح بالنوافذ المنبثقة لطباعة الاختبار"); return; }
    w.document.write(`<html dir="rtl"><body style="font-family:Tahoma;display:grid;place-items:center;height:90vh;font-weight:bold;color:#1e3a8a">⏳ جارٍ تجهيز الاختبار وقصّ الأسئلة من المراجع…</body></html>`);
    setBusy("⏳ تحميل مفاتيح الإجابات…");
    try {
      const K = await loadKeys(); const SP = (typeof window !== "undefined" && window.__SP) || {};
      const R = rec || (() => { const seed = Date.now() % 1e9; const r = cRnd(seed); const items = {}, weeks = {}; plan.forEach(P => { const sel = cPick(P.pool, Math.min(n, P.pool.length), r); items[P.b] = sel.map(q => [q.p, q.i]); weeks[P.b] = P.W; });
        return { id: "pt" + Date.now().toString(36), t: ttl.trim() || "اختبار نافس التجريبي", at: Date.now(), by, books: plan.filter(P => P.pool.length).map(P => P.b), cks, weeks, items, min: mins, two, sheet, key, seed, mode, les }; })();
      // قصّ الصور
      const img = {}; const need = []; R.books.forEach(b => { arr(R.items[b]).forEach(([p, i]) => need.push([b, p, i])); if (b === "ar") arr(R.weeks[b]).forEach(wk => { const st = obj(QST.ar)[wk]; if (st && arr(R.items[b]).some(([p]) => testPages(b, wk).includes(p))) need.push([b, st[0], "st" + wk]); }); });
      const byPage = {}; need.forEach(([b, p, i]) => (byPage[b + ":" + p] = byPage[b + ":" + p] || []).push(i));
      const PG = Object.keys(byPage); for (let k = 0; k < PG.length; k++) { const [b, p] = PG[k].split(":"); setBusy(`⏳ قصّ الأسئلة: صفحة ${ar(k + 1)} من ${ar(PG.length)}`);
        const c = await cPageCanvas(b, +p); byPage[PG[k]].forEach(i => { if (String(i).startsWith("st")) { const st = QST.ar[+String(i).slice(2)]; img[`${b}:st${String(i).slice(2)}`] = cCrop(c, st[1], st[2], .04, .962); } else { const bx = arr(obj(QB[b])[p]).find(x => x[0] === i); if (bx) img[`${b}:${p}:${i}`] = cCrop(c, bx[1], bx[2], .03, .908, .03); } }); c.width = c.height = 1; }
      setBusy("⏳ تجهيز ملف الطباعة…");
      const keyOf = (b, p, i) => { const k = (arr(obj(K[b])[p])[i] || [])[2]; return keyLet(k) || String(k || "").slice(0, 3); };
      const srcOf = (b, p) => { const u = testPages(b, weekOfPage(b, p)).includes(p) ? `اختبار الأسبوع ${ar(weekOfPage(b, p) + 1)}` : (BOOKS[b].titles[unitOfPage(b, p)] || ""); return u; };
      const head = (b, model, N) => `<div class="cv"><div class="hd"><div class="rt">المملكة العربية السعودية<br>وزارة التعليم<br>${SP.region || ""}<br>${SP.name || ""}</div><div class="t"><h2>${R.t}</h2><div class="sb">${BOOKS[b].name} — الصف الثالث المتوسط${model ? ` • <b class="md">نموذج (${model})</b>` : ""}</div><small>الأسابيع: ${wkList(arr(R.weeks[b]))} • عدد الأسئلة: ${ar(N)} • الزمن: ${ar(R.min)} دقيقة</small></div>${api.logo ? `<img src="${api.logo}">` : `<div style="width:60px"></div>`}</div>
        <div class="inf"><span>اسم الطالب: </span><span>الفصل: </span><span>الدرجة: &nbsp;&nbsp;&nbsp; / ${ar(N)}</span></div></div>
        <div class="ins">اقرأ كل سؤال بعناية واختر إجابة صحيحة واحدة${R.sheet ? "، ثم ظلّل رمزها في ورقة الإجابة المرفقة" : " بوضع دائرة حول رمزها"}.</div>`;
      const sheetH = (b, model, N) => { const cols = Math.ceil(N / 10); let rows = ""; for (let r = 0; r < Math.min(10, N); r++) { rows += "<tr>"; for (let c = 0; c < cols; c++) { const q = c * 10 + r; rows += q < N ? `<td class="qn">${ar(q + 1)}</td>${LETS.map(l => `<td><span class="bb">${l}</span></td>`).join("")}<td class="gap"></td>` : `<td colspan="6"></td>`; } rows += "</tr>"; } return `<div class="pb"></div><div class="cv"><div class="t" style="text-align:center"><h2>ورقة الإجابة — ${BOOKS[b].name}${model ? ` • نموذج (${model})` : ""}</h2><small>${R.t}</small></div><div class="inf"><span>اسم الطالب: </span><span>الفصل: </span><span>الدرجة: &nbsp;&nbsp;&nbsp; / ${ar(N)}</span></div></div><div class="ins">ظلّل دائرة واحدة فقط لكل سؤال تظليلًا كاملًا.</div><table class="sh">${rows}</table>`; };
      let body = ""; const keys = [];
      R.books.forEach((b, bi) => { const base = arr(R.items[b]).map(([p, i]) => ({ p, i, w: weekOfPage(b, p) })); const models = R.two ? ["أ", "ب"] : [""];
        models.forEach((md, mi) => { let L = base; if (mi === 1) { const r = cRnd((R.seed || 7) + 991); const gW = [...new Set(base.map(x => x.w))]; L = cShuf(gW, r).flatMap(w => cShuf(base.filter(x => x.w === w), r)); }
          if (bi || mi) body += `<div class="pb"></div>`; body += head(b, md, L.length);
          let lastW = -1; L.forEach((x, k) => { if (b === "ar" && x.w !== lastW && img[`ar:st${x.w}`] && testPages(b, x.w).includes(x.p)) body += `<div class="ps"><div class="pst">اقرأ النص الآتي ثم أجب عن الأسئلة التي تليه:</div><img src="${img[`ar:st${x.w}`]}"></div>`; lastW = x.w;
            body += `<div class="q"><div class="n">${ar(k + 1)}</div>${img[`${b}:${x.p}:${x.i}`] ? `<img src="${img[`${b}:${x.p}:${x.i}`]}">` : `<div style="flex:1;color:#b91c1c">تعذّر قصّ السؤال (ص ${ar(x.p)})</div>`}</div>`; });
          if (R.sheet) body += sheetH(b, md, L.length);
          keys.push({ b, md, L: L.map((x, k) => ({ k: k + 1, a: keyOf(b, x.p, x.i), w: x.w, p: x.p, n: (arr(obj(QM[b])[x.p])[x.i] || [])[0], s: srcOf(b, x.p) })) }); }); });
      if (R.key) { body += `<div class="pb"></div><div class="cv"><div class="t" style="text-align:center"><h2>🔑 مفتاح الإجابة — للمعلم فقط</h2><small>${R.t} • ${new Date(R.at).toLocaleDateString("ar-SA")} • الفصول: ${R.cks.map(cls).join("، ")}</small></div></div>`;
        keys.forEach(Kx => { body += `<h3 class="kh">${BOOKS[Kx.b].name}${Kx.md ? ` — نموذج (${Kx.md})` : ""}</h3><div class="kg">${Kx.L.map(x => `<div><b>${ar(x.k)}</b><span>${x.a || "؟"}</span></div>`).join("")}</div>
          <table class="kt"><thead><tr><th>السؤال</th><th>الإجابة</th><th>الأسبوع</th><th>المصدر في المرجع</th><th>الصفحة</th><th>رقمه في المرجع</th></tr></thead><tbody>${Kx.L.map(x => `<tr><td>${ar(x.k)}</td><td><b>${x.a || "؟"}</b></td><td>${ar(x.w + 1)}</td><td style="text-align:right">${x.s}</td><td>${ar(x.p)}</td><td>${x.n || ""}</td></tr>`).join("")}</tbody></table>`; }); }
      const css = `@page{size:A4;margin:9mm}*{-webkit-print-color-adjust:exact;print-color-adjust:exact;box-sizing:border-box}body{font-family:Cairo,Tahoma,sans-serif;color:#0f172a;margin:0}
.cv{border:2px solid #1e3a8a;border-radius:14px;padding:8px 12px;margin-bottom:6px}.hd{display:flex;align-items:center;gap:10px}.hd .rt{font-size:10.5px;font-weight:800;line-height:1.55;color:#334155;width:150px}.hd img{height:62px}.hd .t,.t{flex:1;text-align:center}
h2{margin:0;font-size:18px;color:#1e3a8a;font-weight:900}.sb{font-weight:900;font-size:14px;color:#b45309}.md{background:#1e3a8a;color:#fff;border-radius:99px;padding:0 10px}small{font-weight:800;color:#475569;font-size:11.5px}
.inf{display:grid;grid-template-columns:2.2fr 1fr 1fr;gap:10px;margin-top:8px;font-weight:800;font-size:12.5px}.inf span{border-bottom:1.5px dotted #64748b;padding:5px 2px}
.ins{background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:5px 10px;font-size:11.5px;font-weight:800;margin:5px 0 4px}
.q{display:flex;gap:6px;align-items:flex-start;break-inside:avoid;page-break-inside:avoid;border-bottom:1px solid #e2e8f0;padding:5px 0}.q .n{flex:none;width:28px;height:28px;border-radius:50%;background:#1e3a8a;color:#fff;display:grid;place-items:center;font-weight:900;font-size:14px;margin-top:3px}.q img{flex:1;min-width:0;width:100%;display:block}
.ps{break-inside:avoid;page-break-inside:avoid;border:1.5px solid #94a3b8;border-radius:10px;padding:4px 6px;margin:6px 0}.ps img{width:100%;display:block}.pst{font-weight:900;font-size:12.5px;color:#7f1d1d;margin:2px 4px}
.pb{page-break-before:always;break-before:page}
.sh{border-collapse:separate;border-spacing:0 7px;margin:8px auto}.sh td{text-align:center;font-weight:900;font-size:13px;padding:0 3px}.sh .qn{width:30px;color:#1e3a8a}.sh .gap{width:26px}.bb{display:inline-grid;place-items:center;width:25px;height:25px;border:1.6px solid #334155;border-radius:50%;font-size:12px}
.kh{color:#1e3a8a;margin:10px 0 4px;font-size:15px}.kg{display:grid;grid-template-columns:repeat(10,1fr);gap:4px;margin-bottom:6px}.kg div{border:1.5px solid #cbd5e1;border-radius:8px;text-align:center;font-weight:900;padding:2px}.kg b{display:block;font-size:11px;color:#64748b}.kg span{font-size:17px;color:#15803d}
.kt{width:100%;border-collapse:collapse;font-size:11px}.kt th{background:#1e3a8a;color:#fff;padding:4px}.kt td{border:1px solid #cbd5e1;padding:3px;text-align:center}`;
      w.document.open(); w.document.write(`<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>${R.t}</title><link href="https://fonts.googleapis.com/css2?family=Cairo:wght@600;800;900&display=swap" rel="stylesheet"><style>${css}</style></head><body>${body}<script>(function(){var im=[].slice.call(document.images);var n=0;function go(){setTimeout(function(){print()},500)}if(!im.length)return go();im.forEach(function(i){if(i.complete){if(++n===im.length)go()}else{i.onload=i.onerror=function(){if(++n===im.length)go()}}})})()<\/script></body></html>`); w.document.close();
      if (!rec) { await api.maPut(`${NB_PT}/${R.id}`, R); setSaved(L => [R, ...arr(L)]); }
    } catch (e) { try { w.document.body.innerHTML = `<p style="color:#b91c1c;font-family:Tahoma">تعذّر تجهيز الاختبار: ${e.message || e}</p>`; } catch {} alert("تعذّر تجهيز الاختبار — تحقق من الاتصال ثم أعد المحاولة"); }
    setBusy("");
  };
  const total = plan.reduce((a, P) => a + Math.min(n, P.pool.length), 0);
  return <>
    <div className="nb-book" style={{ "--c": "#1e3a8a", display: "grid", gap: 10 }}>
      <b>١) الأسابيع التي يشملها الاختبار</b>
      <div className="cc-row">{[["common", "المكتملة في كل الفصول المختارة (عادل للجميع)"], ["any", "كل أسبوع اكتمل في أي فصل"]].map(([k, l]) => <label key={k}><input type="radio" checked={mode === k} onChange={() => { setMode(k); setMan({}); }} />{l}</label>)}</div>
      <small style={{ color: "#64748b", fontWeight: 700 }}>✓ = اكتمل شرح الأسبوع لهذا الفصل • اضغط رقم الأسبوع لإضافته أو استبعاده يدويًا</small>
      {plan.map(P => { const B = BOOKS[P.b]; const lag = P.late[0]; const lead = P.late[P.late.length - 1];
        return <div key={P.b} style={{ display: "grid", gap: 6 }}>
          <div className="nb-h" style={{ gap: 8 }}><span className="nb-tag" style={{ "--c": B.c }}>{B.name}</span><b style={{ fontSize: 13.5 }}>الأسابيع المشمولة: {wkList(P.W)}</b><span className="nb-st" style={{ background: P.pool.length ? "#dbeafe" : "#fee2e2", color: P.pool.length ? "#1e40af" : "#991b1b" }}>{ar(P.pool.length)} سؤال متاح</span></div>
          <div className="nb-tbl-w"><table className="cc-wk"><thead><tr><th className="r">الفصل</th>{Array.from({ length: 15 }, (_, w) => { const on = P.W.includes(w); const any = cks.some(ck => CW[P.b][ck].has(w)); return <th key={w} className={on ? "sel" : any ? "can" : "off"} title={on ? "مشمول — اضغط للاستبعاد" : any ? "اضغط للإضافة" : "لم يكتمل شرحه في أي فصل"} onClick={() => any && setM(P.b, w, !on)}>{ar(w + 1)}</th>; })}<th>المكتمل</th></tr></thead>
            <tbody>{cks.map(ck => <tr key={ck}><td className="r">فصل {cls(ck)}{!ckRow(M.rows, ck, P.b) && <small style={{ color: "#94a3b8" }}> (بلا معلم)</small>}</td>{Array.from({ length: 15 }, (_, w) => <td key={w} className={CW[P.b][ck].has(w) ? "y" : "n"}>{CW[P.b][ck].has(w) ? "✓" : "·"}</td>)}<td><b>{ar(CW[P.b][ck].size)}</b></td></tr>)}</tbody></table></div>
          {cks.length > 1 && lag && lead && lag.n < lead.n && <div className="nb-info" style={{ margin: 0 }}>⏳ الفصل {cls(lag.ck)} متأخر ({ar(lag.n)} أسبوع مقابل {ar(lead.n)} لفصل {cls(lead.ck)}){mode === "common" ? " — لذلك يقتصر الاختبار على الأسابيع المشتركة حتى لا يُختبر طالب فيما لم يُشرح له." : " — انتبه: سيتضمن الاختبار أسابيع لم تُشرح لهذا الفصل."}</div>}
          {!P.W.length && <div className="nb-info" style={{ margin: 0, background: "#fef2f2", color: "#991b1b" }}>لا يوجد أسبوع اكتمل شرحه في كل الفصول المختارة لهذه المادة — استبعد الفصل المتأخر أو اختر «كل أسبوع اكتمل في أي فصل» أو أضف أسبوعًا يدويًا.</div>}
        </div>; })}
    </div>
    <div className="nb-book" style={{ "--c": "#1e3a8a", display: "grid", gap: 10 }}>
      <b>٢) إعدادات الاختبار</b>
      <div className="cc-row">
        <label>العنوان <input className="cc-in" style={{ width: 230, textAlign: "right" }} value={ttl} onChange={e => setTtl(e.target.value)} /></label>
        <label>عدد الأسئلة لكل مادة <input className="cc-in" type="number" min={3} max={40} value={n} onChange={e => setN(Math.max(1, Math.min(40, +e.target.value || 10)))} /></label>
        <label>الزمن (دقيقة) <input className="cc-in" type="number" min={10} max={120} value={mins} onChange={e => setMins(+e.target.value || 30)} /></label>
      </div>
      <div className="cc-row">
        <label><input type="checkbox" checked={les} onChange={e => setLes(e.target.checked)} /> أضف أسئلة الاختيار من متعدد من دروس الأسابيع (لا من اختبار الأسبوع فقط)</label>
        <label><input type="checkbox" checked={two} onChange={e => setTwo(e.target.checked)} /> نموذجان (أ ، ب) بترتيب مختلف</label>
        <label><input type="checkbox" checked={sheet} onChange={e => setSheet(e.target.checked)} /> ورقة إجابة للتظليل</label>
        <label><input type="checkbox" checked={key} onChange={e => setKey(e.target.checked)} /> مفتاح الإجابة للمعلم</label>
      </div>
      <div className="nb-info" style={{ margin: 0 }}>تُقصّ الأسئلة من صفحات المرجع نفسها بالصور والأشكال كما درسها الطلاب، وتُختار موزّعة بالتساوي على الأسابيع. في لغتي يُطبع نص الاختبار قبل أسئلته. يُحفظ كل اختبار لإعادة طباعته بالأسئلة نفسها.</div>
      <div className="nb-h" style={{ gap: 8 }}><button className="nb-b on" style={{ fontSize: 15, padding: "10px 20px" }} disabled={!!busy || !total} onClick={() => make(null)}>{busy || `🖨️ إنشاء الاختبار وطباعته (${ar(total)} سؤال)`}</button>
        {plan.map(P => <small key={P.b} style={{ fontWeight: 800, color: "#475569" }}>{BOOKS[P.b].name}: {ar(Math.min(n, P.pool.length))}{P.pool.length < n ? ` (المتاح ${ar(P.pool.length)} فقط)` : ""}</small>)}</div>
    </div>
    {saved && saved.length > 0 && <div className="nb-book" style={{ "--c": "#334155" }}><b>🗂️ الاختبارات الورقية السابقة</b>
      <div className="nb-tbl-w" style={{ marginTop: 6 }}><table className="nb-tbl"><thead><tr><th className="r">الاختبار</th><th>المواد</th><th>الفصول</th><th>الأسابيع</th><th>التاريخ</th><th></th></tr></thead>
        <tbody>{saved.slice(0, 12).map(R => <tr key={R.id}><td className="r">{R.t}{R.two ? " (أ، ب)" : ""}<br /><small style={{ color: "#64748b" }}>{R.by}</small></td><td>{arr(R.books).map(b => BOOKS[b] ? BOOKS[b].name : b).join("، ")}</td><td>{arr(R.cks).map(cls).join("، ")}</td><td style={{ fontSize: 12 }}>{arr(R.books).map(b => `${BOOKS[b] ? BOOKS[b].name : b}: ${wkList(arr(obj(R.weeks)[b]))}`).join(" • ")}</td><td>{when(R.at)}</td>
          <td><button className="nb-b" disabled={!!busy} onClick={() => make(R)}>🖨️ إعادة الطباعة</button> <button className="nb-b" onClick={async () => { if (!window.confirm("حذف هذا الاختبار من القائمة؟")) return; await api.maPut(`${NB_PT}/${R.id}`, null); setSaved(L => L.filter(x => x.id !== R.id)); }}>🗑️</button></td></tr>)}</tbody></table></div></div>}
  </>;
}

// ── 📈 مستوى الأداء: شرح المعلمين وإنجازهم وحل الطلاب
function CcPerf({ D, M, X, cks, books }) {
  const [allIns, setAllIns] = useState(false);
  const T = useMemo(() => books.map(b => {
    const rowsC = cks.map(ck => {
      const r = ckRow(M.rows, ck, b, D); const P = r ? obj(obj(obj(D.tp[r.key])[b])[ck]) : {}; const W = ckWeeks(D, M.rows, ck, b);
      const bp = r ? bookPct(P, b) : 0; const tApp = Object.keys(P).filter(k => k[0] === "t").length + M.alerts.filter(a => a.book === b && a.ck === ck && a.st === "done" && !P["t" + a.w]).length;
      const ss = M.studs.filter(s => s.ck === ck); const st = ss.map(s => ccStat(D, M, X, s, [b]));
      const ent = st.filter(x => x.entered).length, sol = st.filter(x => x.solved).length;
      const pg = ss.reduce((a, s) => a + Object.keys(obj(obj(D.idx[s.id])[b])).length, 0);
      let c = 0, g = 0; ss.forEach(s => Object.values(obj(obj(X.QR[s.id])[b])).forEach(x => { if (x) { c += +x.c || 0; g += +x.g || 0; } }));
      const nvs = st.map(x => x.per[b].nv).filter(v => v != null); const nv = nvs.length ? Math.round(nvs.reduce((a, v) => a + v, 0) / nvs.length) : null;
      const tSol = W.size && ss.length ? pct(ss.reduce((a, s) => a + [...W].filter(w => testSolved(obj(D.idx[s.id])[b], b, w)).length, 0), W.size * ss.length) : null;
      const sv = [qPct(c, g), nv].filter(v => v != null); const score = sv.length ? Math.round(sv.reduce((a, v) => a + v, 0) / sv.length) : null;
      // أضعف أسبوع (الإجابات الإلكترونية)
      const wv = Array.from({ length: 15 }, (_, w) => { let cc = 0, gg = 0; ss.forEach(s => Object.entries(obj(obj(X.QR[s.id])[b])).forEach(([p, x]) => { if (x && weekOfPage(b, +p) === w) { cc += +x.c || 0; gg += +x.g || 0; } })); return gg >= 10 ? qPct(cc, gg) : null; });
      return { ck, r, bp, wd: W.size, tApp, at: r ? +obj(D.tp[r.key])._at || 0 : 0, n: ss.length, ent, sol, pg, ev: qPct(c, g), nv, tSol, score, part: pct(sol, ss.length), wv };
    });
    return { b, rowsC };
  }), [books.join(), cks.join(), X]);
  const lvlT = (wd, max) => !max ? ["—", "#94a3b8"] : wd >= max ? ["في المقدمة", "#15803d"] : max - wd <= 1 ? ["قريب", "#2563eb"] : max - wd <= 2 ? ["متأخر قليلًا", "#b45309"] : ["متأخر", "#dc2626"];
  // ملاحظات آلية
  const ins = [];
  T.forEach(({ b, rowsC }) => { const B = BOOKS[b]; const mx = Math.max(0, ...rowsC.map(x => x.wd));
    rowsC.forEach(x => { if (!x.r) ins.push(["#dc2626", `${B.name} • فصل ${cls(x.ck)}: لا يوجد معلم مسجّل في الجدول — لن تُحسب الأسابيع المكتملة لهذا الفصل.`]);
      else if (mx - x.wd >= 2) ins.push(["#dc2626", `${B.name} • فصل ${cls(x.ck)} متأخر ${ar(mx - x.wd)} أسابيع في الشرح عن أعلى فصل (${x.r.name}).`]);
      if (x.n && x.part < 50) ins.push(["#b45309", `${B.name} • فصل ${cls(x.ck)}: ${ar(100 - x.part)}٪ من الطلاب لم يحلوا شيئًا بعد (${ar(x.n - x.sol)} طالب).`]);
      if (x.score != null && x.score < 60) ins.push(["#dc2626", `${B.name} • فصل ${cls(x.ck)}: متوسط النتائج ${ar(x.score)}٪ (${qLvl(x.score)[0]}).`]);
      if (x.wd && x.tSol != null && x.tSol < 50) ins.push(["#7c3aed", `${B.name} • فصل ${cls(x.ck)}: حُلّت ${ar(x.tSol)}٪ فقط من اختبارات الأسابيع المكتملة.`]);
      const wk = x.wv.map((v, w) => [v, w]).filter(([v]) => v != null).sort((a, c) => a[0] - c[0])[0]; if (wk && wk[0] < 60) ins.push(["#0f766e", `${B.name} • فصل ${cls(x.ck)}: أضعف أسبوع الأسبوع ${ar(wk[1] + 1)} (${ar(wk[0])}٪) — ${B.titles[wk[1] * 2]} • ${B.titles[wk[1] * 2 + 1]}`]); });
    const best = rowsC.filter(x => x.score != null).sort((a, c) => c.score - a.score)[0]; if (best && best.score >= 75) ins.push(["#15803d", `${B.name}: أعلى فصل نتائج ${cls(best.ck)} (${ar(best.score)}٪)${best.r ? ` مع ${best.r.name}` : ""}.`]); });
  const SEV = { "#dc2626": 0, "#b45309": 1, "#7c3aed": 2, "#0f766e": 3, "#15803d": 4 }; const insS = [...ins].sort((x, y) => (SEV[x[0]] ?? 5) - (SEV[y[0]] ?? 5));
  const TCH = []; T.forEach(({ b, rowsC }) => rowsC.forEach(x => { if (!x.r) return; let t = TCH.find(y => y.key === x.r.key && y.b === b); if (!t) TCH.push(t = { key: x.r.key, name: x.r.name, b, L: [] }); t.L.push(x); }));
  const avg = (L, f) => { const v = L.map(f).filter(x => x != null); return v.length ? Math.round(v.reduce((a, y) => a + y, 0) / v.length) : null; };
  const pc = v => v == null ? "—" : ar(v) + "٪";
  const printIt = () => lrPrint("مستوى الأداء في مراجع نافس", `<h1>📈 مستوى الأداء في مراجع نافس ونماذجها</h1><div class="sub">${books.map(b => BOOKS[b].name).join("، ")} • الفصول: ${cks.map(cls).join("، ")} • ${new Date().toLocaleDateString("ar-SA")}</div>
    ${T.map(({ b, rowsC }) => { const mx = Math.max(0, ...rowsC.map(x => x.wd)); return `<h3 style="color:${BOOKS[b].c};margin:10px 0 4px">${BOOKS[b].name}</h3><table><thead><tr><th>الفصل</th><th>المعلم</th><th>إنجاز الشرح</th><th>الأسابيع</th><th>مستوى الإنجاز</th><th>اختبارات مطبّقة</th><th>دخلوا</th><th>يحلون</th><th>صفحات محلولة</th><th>الإجابات الإلكترونية</th><th>نماذج المنصة</th><th>حل اختبارات الأسابيع</th><th>مستوى الطلاب</th></tr></thead><tbody>${rowsC.map(x => `<tr><td>${cls(x.ck)}</td><td class="r">${x.r ? x.r.name : "—"}</td><td>${ar(x.bp)}٪</td><td>${ar(x.wd)}/١٥</td><td>${lvlT(x.wd, mx)[0]}</td><td>${ar(x.tApp)}</td><td>${ar(x.ent)}/${ar(x.n)}</td><td>${ar(x.sol)}/${ar(x.n)}</td><td>${ar(x.pg)}</td><td>${pc(x.ev)}</td><td>${pc(x.nv)}</td><td>${pc(x.tSol)}</td><td>${x.score == null ? "—" : qLvl(x.score)[0] + " " + ar(x.score) + "٪"}</td></tr>`).join("")}</tbody></table>`; }).join("")}
    <h3 style="margin:12px 0 4px">ملاحظات ومؤشرات</h3><ul style="font-size:12px;font-weight:700;line-height:1.9">${insS.map(i => `<li>${i[1]}</li>`).join("") || "<li>لا ملاحظات</li>"}</ul><div class="sg"><span>وكيل الشؤون التعليمية: ................</span><span>مدير المدرسة: ................</span></div>`);
  return <>
    <div className="nb-book" style={{ "--c": "#1e3a8a" }}><div className="nb-h"><b>📈 مستوى الأداء: شرح المعلمين وإنجازهم • حل الطلاب ونتائجهم</b><span className="nb-sp" /><button className="nb-b on" onClick={printIt}>🖨️ طباعة التقرير</button></div>
      <div className="nb-kpis" style={{ marginTop: 8 }}>
        <div className="nb-kpi" style={{ "--c": "#1e3a8a" }}><b>{pc(avg(T.flatMap(t => t.rowsC), x => x.r ? x.bp : null))}</b><small>متوسط إنجاز الشرح</small></div>
        <div className="nb-kpi" style={{ "--c": "#0f766e" }}><b>{pc(avg(T.flatMap(t => t.rowsC), x => x.n ? x.part : null))}</b><small>الطلاب الذين يحلون</small></div>
        <div className="nb-kpi" style={{ "--c": "#2563eb" }}><b>{pc(avg(T.flatMap(t => t.rowsC), x => x.ev))}</b><small>الإجابات الإلكترونية في المرجع</small></div>
        <div className="nb-kpi" style={{ "--c": "#7c3aed" }}><b>{pc(avg(T.flatMap(t => t.rowsC), x => x.nv))}</b><small>نماذج المنصة (#nafes)</small></div>
        <div className="nb-kpi" style={{ "--c": "#b45309" }}><b>{pc(avg(T.flatMap(t => t.rowsC), x => x.tSol))}</b><small>حل اختبارات الأسابيع المكتملة</small></div>
      </div></div>
    {ins.length > 0 && <div className="nb-book" style={{ "--c": "#334155" }}><div className="nb-h"><b>💡 ملاحظات ومؤشرات آلية ({ar(ins.length)})</b><span className="nb-sp" />{ins.length > 8 && <button className="nb-b" onClick={() => setAllIns(!allIns)}>{allIns ? "عرض الأهم فقط" : "عرض الكل"}</button>}</div><div className="cc-ins" style={{ marginTop: 8 }}>{(allIns ? insS : insS.slice(0, 8)).map((i, k) => <div key={k} style={{ "--c": i[0] }}>{i[1]}</div>)}</div></div>}
    {T.map(({ b, rowsC }) => { const B = BOOKS[b]; const mx = Math.max(0, ...rowsC.map(x => x.wd)); return <div key={b} className="nb-book" style={{ "--c": B.c }}>
      <b style={{ color: B.c, fontSize: 16 }}>{B.name}</b>
      <div className="nb-tbl-w" style={{ marginTop: 8 }}><table className="nb-tbl"><thead><tr><th className="r">الفصل • المعلم</th><th>إنجاز الشرح</th><th>الأسابيع المكتملة</th><th>مستوى الإنجاز</th><th>اختبارات مطبّقة</th><th>دخلوا • يحلون</th><th>صفحات محلولة</th><th>الإجابات الإلكترونية</th><th>نماذج المنصة</th><th>حل اختبارات الأسابيع</th><th>مستوى حل الطلاب</th></tr></thead>
        <tbody>{rowsC.map(x => { const LT = lvlT(x.wd, mx), LS = qLvl(x.score); return <tr key={x.ck}>
          <td className="r">فصل {cls(x.ck)}<br /><small style={{ color: "#64748b" }}>{x.r ? `${x.r.name} • آخر تحديث ${when(x.at)}` : "لا معلم في الجدول"}</small></td>
          <td><div style={{ display: "flex", gap: 5, alignItems: "center", justifyContent: "center" }}><Bar v={x.bp} c={B.c} w={56} /><b>{ar(x.bp)}٪</b></div></td>
          <td><b>{ar(x.wd)}</b>/١٥</td><td><span className="cc-lv" style={{ "--c": LT[1] }}>{LT[0]}</span></td><td>{ar(x.tApp)}</td>
          <td>{ar(x.ent)} • {ar(x.sol)} <small style={{ color: "#64748b" }}>من {ar(x.n)}</small><Bar v={x.part} c="#0f766e" /></td><td>{ar(x.pg)}</td>
          <td style={{ color: qLvl(x.ev)[1], fontWeight: 900 }}>{pc(x.ev)}</td><td style={{ color: qLvl(x.nv)[1], fontWeight: 900 }}>{pc(x.nv)}</td><td>{pc(x.tSol)}</td>
          <td>{x.score == null ? <small style={{ color: "#94a3b8" }}>لا نتائج بعد</small> : <span className="cc-lv" style={{ "--c": LS[1] }}>{LS[0]} {ar(x.score)}٪</span>}</td></tr>; })}</tbody></table></div>
    </div>; })}
    {TCH.length > 0 && <div className="nb-book" style={{ "--c": "#334155" }}><b>👨‍🏫 ملخص المعلمين</b>
      <div className="nb-tbl-w" style={{ marginTop: 8 }}><table className="nb-tbl"><thead><tr><th className="r">المعلم</th><th>المادة</th><th>فصوله</th><th>متوسط إنجاز الشرح</th><th>الأسابيع (أدنى–أعلى)</th><th>طلاب يحلون</th><th>متوسط نتائج طلابه</th><th>المستوى</th></tr></thead>
        <tbody>{TCH.map(t => { const sc = avg(t.L, x => x.score); const LS = qLvl(sc); return <tr key={t.key + t.b}><td className="r">{t.name}</td><td><span className="nb-tag" style={{ "--c": BOOKS[t.b].c }}>{BOOKS[t.b].name}</span></td><td>{t.L.map(x => cls(x.ck)).join("، ")}</td>
          <td><b>{pc(avg(t.L, x => x.bp))}</b></td><td>{ar(Math.min(...t.L.map(x => x.wd)))}–{ar(Math.max(...t.L.map(x => x.wd)))}</td><td>{pc(avg(t.L, x => x.n ? x.part : null))}</td><td style={{ color: LS[1], fontWeight: 900 }}>{pc(sc)}</td><td>{sc == null ? "—" : <span className="cc-lv" style={{ "--c": LS[1] }}>{LS[0]}</span>}</td></tr>; })}</tbody></table></div></div>}
    <small style={{ color: "#64748b", fontWeight: 700, padding: "0 4px" }}>إنجاز الشرح من «✅ تم شرح الصفحة» في خطة كل معلم • مستوى الإنجاز مقارنةً بأعلى فصل في المادة • مستوى حل الطلاب = متوسط الإجابات الإلكترونية ونماذج المنصة (متقدم ٩٠+ • متمكن ٧٥+ • قريب من التمكن ٦٠+ • يحتاج دعمًا)</small>
  </>;
}
