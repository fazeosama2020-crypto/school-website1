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

const NB = "school-nafsbook", NB_IDX = "school-nafsbook-idx", NB_TC = "school-nafsbook-tc";
const NB_T = "school-nafsbook-t", NB_TP = "school-nafsbook-tp", NB_B = "school-nafsbook-b";
const NB_SEEN = "school-nafsbook-seen", NB_AL = "school-nafsbook-alerts", NB_OPEN = "school-nafsbook-open";
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
.nb-save{position:fixed;bottom:calc(14px + env(safe-area-inset-bottom,0px));left:14px;z-index:60;background:#1d2433;color:#fff;border-radius:999px;padding:7px 14px;font-size:12.5px;font-weight:800;opacity:.95;max-width:70vw}
.nb-nav{position:fixed;bottom:calc(12px + env(safe-area-inset-bottom,0px));right:12px;z-index:40;display:flex;gap:8px}
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
/* الفهرس */
.nb-drawer-bg{position:fixed;inset:0;background:rgba(15,23,42,.45);z-index:80}
.nb-drawer{position:fixed;top:0;bottom:0;right:0;width:min(440px,94vw);background:#f8fafc;z-index:81;display:flex;flex-direction:column;box-shadow:-10px 0 30px rgba(0,0,0,.25);animation:nbIn .2s ease-out}
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
.bd{position:fixed;z-index:70;background:#fff;border-radius:16px;box-shadow:0 24px 60px -18px rgba(0,0,0,.55),0 0 0 1px rgba(15,23,42,.08);display:flex;flex-direction:column;overflow:hidden;direction:rtl}
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
.bd-min{position:fixed;z-index:70;border-radius:999px;background:linear-gradient(135deg,#1e3a8a,#0f766e);color:#fff;font-weight:900;padding:10px 16px;box-shadow:0 12px 26px -10px rgba(0,0,0,.6);cursor:grab;touch-action:none;user-select:none;border:2px solid #fbbf24;font-size:14px}
.bd-ft{display:flex;gap:6px;padding:5px 8px;align-items:center;background:#fff;border-top:1px solid #e2e8f0;font-size:12px;font-weight:800;color:#64748b;flex-wrap:wrap}
.nb-conf{position:fixed;inset:0;pointer-events:none;z-index:200;overflow:hidden}
.nb-conf i{position:absolute;top:-20px;width:10px;height:14px;border-radius:2px;animation:nbFall 2.6s ease-in forwards}
@keyframes nbFall{to{top:105vh;transform:rotate(720deg)}}
@media (max-width:560px){.nb-top b{font-size:13.5px}.nb-tbl{font-size:12.5px}.nb-hide-s{display:none!important}}
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

// ══════════════════════ عارض الصفحة مع طبقة الكتابة والسبورة ══════════════════════
// store: مسار حفظ الكتابة (null = مؤقتة) • idx: فهرس الصفحات المحلولة • marks: مسار فهرس للاطّلاع فقط
// tc: "show" / "edit" تعليق المعلم • tp: {tkey,tname,cks,ck} تسجيل «تم شرح الصفحة» • boards: مسار السبورات
function BookViewer({ api, book, startPage = 1, store: store0 = null, idx = null, marks = null, readOnly = false, tc: tcMode = null, tcPath = null, tp = null, boards = null, boardsRO = false, seenSid = null, who = "x", title = "", by = "", onBack }) {
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
  const rootRef = useRef(null), stageRef = useRef(null), pdfRef = useRef(null), inkRef = useRef(null), topRef = useRef(null), pageRef = useRef(null);
  const hist = useRef([]), drawing = useRef(null), saveT = useRef(null), renderT = useRef(null), annRef = useRef(ann), msgT = useRef(null), touch = useRef(null), pinD = useRef(null);
  annRef.current = ann;
  const base = `${book}/${page}`;
  const seg = segAt(book, page);
  const flash = (m, ms = 1700) => { setSaved(m); clearTimeout(msgT.current); msgT.current = setTimeout(() => setSaved(""), ms); };
  useSeen(api, seenSid, book, page);

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
    const H0 = window.innerHeight - (topRef.current ? topRef.current.getBoundingClientRect().bottom : 110) - 24;
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
    if (page < (doc.numPages || B.pages)) doc.getPage(page + 1).catch(() => {});
  }, [doc, page, fit, zoom, fs]);
  useEffect(() => { render(); }, [render]);
  useEffect(() => { let t; const f = () => { clearTimeout(t); t = setTimeout(render, 200); }; window.addEventListener("resize", f); return () => window.removeEventListener("resize", f); }, [render]);
  useEffect(() => { if (topRef.current && rootRef.current) rootRef.current.style.setProperty("--th", topRef.current.offsetHeight + "px"); });
  useEffect(() => { const f = () => setFs(!!document.fullscreenElement); document.addEventListener("fullscreenchange", f); return () => document.removeEventListener("fullscreenchange", f); }, []);
  const toggleFs = () => { try { if (document.fullscreenElement) document.exitFullscreen(); else (rootRef.current || document.documentElement).requestFullscreen(); } catch {} };

  const paint = useCallback(() => {
    const c = inkRef.current; if (!c || !size.w) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    c.width = size.w * dpr; c.height = size.h * dpr;
    const g = c.getContext("2d"); g.scale(dpr, dpr); g.lineCap = "round"; g.lineJoin = "round";
    const all = [...annRef.current.s, ...(drawing.current ? [drawing.current] : [])];
    for (const s of all) {
      if (!s.p || !s.p.length) continue;
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
      const ok = await api.maPut(`${store}/${base}`, v);
      if (idx) { await api.maPut(`${idx}/${base}`, empty ? null : Date.now()); setSolved(o => { const n = { ...o }; if (empty) delete n[page]; else n[page] = Date.now(); return n; }); }
      flash(ok === false ? "تعذّر الحفظ – سيُعاد تلقائيًا" : "تم الحفظ ✓", 1500);
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
    e.preventDefault(); inkRef.current.setPointerCapture(e.pointerId);
    const p = pos(e);
    if (tool === "text") { const id = "n" + Date.now().toString(36); const next = { ...ann, n: [...ann.n, { id, x: p[0], y: p[1], t: "" }] }; hist.current.push(ann); setAnn(next); setEditNote(id); return; }
    if (tool === "erase") { hist.current.push(annRef.current); erased.current = eraseAt(p); return; }
    drawing.current = { k: tool, c: tool === "hl" ? "#facc15" : color, p: [p] }; paint();
  };
  const move = e => {
    if (readOnly) return;
    if (tool === "erase" && e.buttons) { if (eraseAt(pos(e))) erased.current = true; return; }
    if (!drawing.current) return;
    const p = pos(e), last = drawing.current.p[drawing.current.p.length - 1];
    if (Math.hypot(p[0] - last[0], p[1] - last[1]) > 0.002) { drawing.current.p.push(p); paint(); }
  };
  const up = () => {
    if (tool === "erase") { if (erased.current) persist(annRef.current); else hist.current.pop(); erased.current = false; return; }
    if (!drawing.current) return; const s = drawing.current; drawing.current = null; commit({ ...annRef.current, s: [...annRef.current.s, s] });
  };
  const setNoteText = (id, t) => setAnn(a => ({ ...a, n: a.n.map(x => x.id === id ? { ...x, t } : x) }));
  const finishNote = (id) => { setEditNote(null); const next = { ...annRef.current, n: annRef.current.n.filter(x => x.id !== id || x.t.trim()) }; setAnn(next); persist(next); };
  const delNote = (id) => commit({ ...ann, n: ann.n.filter(x => x.id !== id) });

  const saveTc = async () => {
    const v = tcDraft.trim() ? { t: tcDraft.trim(), by: by || "المعلم", at: Date.now() } : null;
    await api.maPut(`${tcPath}/${base}`, v); setTc(v); flash("تم حفظ التعليق ✓");
  };

  const total = doc ? doc.numPages : B.pages;
  const go = d => setPage(p => Math.min(Math.max(1, p + d), total));
  const goTo = p => { setPage(Math.min(Math.max(1, p), total)); setIdxOpen(false); };
  useEffect(() => { window.scrollTo({ top: 0 }); if (stageRef.current) stageRef.current.scrollTop = 0; }, [page]);
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
  const COLORS = ["#1d4ed8", "#dc2626", "#16a34a", "#111827"];
  const wP = w => tp && ck ? weekPct(C, book, w) : (idx || marks) ? stuWeekPct(solved, book, w) : null;
  const curW = weekOfPage(book, page);
  const nBoards = Object.keys(pb).length;

  return <div ref={rootRef} className="nb" style={{ "--c": B.c, minHeight: fs ? "100vh" : undefined }}>
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
      {!readOnly && <>
        <span className="sep" />
        <button className={"nb-b" + (tool === "view" ? " on" : "")} onClick={() => setTool("view")}>✋ تصفح</button>
        <button className={"nb-b" + (tool === "pen" ? " on" : "")} onClick={() => setTool("pen")}>✏️ قلم</button>
        {COLORS.map(c => <span key={c} className={"nb-dot" + (tool === "pen" && color === c ? " on" : "")} style={{ background: c }} onClick={() => { setColor(c); setTool("pen"); }} role="button" aria-label="لون" />)}
        <button className={"nb-b" + (tool === "hl" ? " on" : "")} onClick={() => setTool("hl")}>🖍️ تظليل</button>
        <button className={"nb-b" + (tool === "text" ? " on" : "")} onClick={() => setTool("text")}>💬 ملاحظة</button>
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

    <div className="nb-stage" ref={stageRef} onTouchStart={tStart} onTouchEnd={tEnd}>
      {err ? <div className="nb-msg">{err}</div> : !doc ? <div className="nb-msg">📚 جارٍ تحميل المرجع…</div> :
        <div className="nb-page" ref={pageRef} style={{ width: size.w || "100%", height: size.h || "60vh" }} onPointerMove={pinMove} onPointerUp={pinUp}>
          <canvas className="pdf" ref={pdfRef} />
          <canvas className="ink" ref={inkRef} style={{ touchAction: drawingMode ? "none" : "auto", cursor: drawingMode ? (tool === "text" ? "text" : "crosshair") : "default", pointerEvents: drawingMode ? "auto" : "none" }}
            onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} />
          {tp && pageDone && <div className="nb-done">✅ شُرحت لفصل {cls(ck)}</div>}
          {!tp && solved[page] && (idx || marks) && <div className="nb-done" style={{ background: "#7c3aed" }}>✍️ فيها حل</div>}
          {ann.n.map(n => <div key={n.id} className="nb-note" style={{ right: `${(1 - n.x) * 100}%`, top: `${n.y * 100}%`, fontSize: Math.max(12, size.w * 0.022) }}
            onClick={e => { if (!readOnly) { e.stopPropagation(); setEditNote(n.id); } }}>
            {editNote === n.id ? <textarea autoFocus rows={2} value={n.t} onChange={e => setNoteText(n.id, e.target.value)} onBlur={() => finishNote(n.id)} placeholder="اكتب هنا…" />
              : <span>{n.t}</span>}
            {!readOnly && editNote !== n.id && <button className="x" onClick={e => { e.stopPropagation(); delNote(n.id); }} aria-label="حذف الملاحظة">×</button>}
          </div>)}
          {Object.entries(pb).map(([id, b]) => <div key={id} className={"nb-pin" + (BD_DARK(b.bg) ? " chalk" : "")} style={{ right: `${(1 - (b.px ?? .1)) * 100}%`, top: `${(b.py ?? .1) * 100}%` }}
            onPointerDown={e => pinDown(e, id)} title="اضغط لفتح السبورة • اسحب لتحريكها">📌 {b.n || "سبورة"}</div>)}
        </div>}
    </div>

    <div className="nb-nav"><button onClick={() => go(-1)} aria-label="السابقة">›</button><button onClick={() => go(1)} aria-label="التالية">‹</button></div>
    {saved && <div className="nb-save">{saved}</div>}
    {idxOpen && <IndexDrawer book={book} doc={doc} page={page} onGo={goTo} onClose={() => setIdxOpen(false)}
      mark={p => tp && ck ? (C["p" + p] ? "✓" : "") : solved[p] ? "✍️" : ""} weekP={(tp && ck) || idx || marks ? wP : null}
      weekLbl={tp && ck ? w => `فصل ${cls(ck)}: ${weekPct(C, book, w) === 100 ? "اكتمل الشرح ✅" : `شُرح ${ar(weekPct(C, book, w))}٪`}` : null} />}
    {bo && <Board key={bo.id} init={bo.init} readOnly={boardsRO} canSave={canBoard} label={`${B.name} • ص ${ar(bo.page)}`}
      onSave={d => saveBoard(bo, d)} onClose={closeBoard} onDelete={pb[bo.id] || canBoard ? delBoard : null} />}
  </div>;
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

function Library({ api, student, books = BOOK_IDS, onOpen, onLogout, onBack, readOnly }) {
  const [done, setDone] = useState({}); const [open, setOpen] = useState({});
  useEffect(() => { if (!student) return; api.maGet(`${NB_IDX}/${student.id}`).then(d => setDone(obj(d))); api.maGet(`${NB_OPEN}/${student.ck}`).then(d => setOpen(obj(d))); }, [student && student.id]);
  const count = book => Object.keys(obj(done[book])).length;
  const tests = books.flatMap(b => Object.keys(obj(open[b])).map(w => ({ b, w: +w, solved: testSolved(done[b], b, +w) }))).sort((a, c) => a.solved - c.solved);
  return <div className="nb-home">
    <div className="nb-book" style={{ "--c": "#7c3aed", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 900, fontSize: 17 }}>{readOnly ? "دفتر الطالب: " : "أهلًا "}{student.name}</div>
        <div style={{ color: "#64748b", fontWeight: 700, fontSize: 13 }}>الثالث المتوسط / {ar(String(student.ck).split("-")[1])} • الشريط تحت كل أسبوع يبيّن نسبة ما حللته فيه</div>
      </div>
      {onLogout && <button className="nb-b" onClick={onLogout}>تبديل الطالب</button>}
      {onBack && <button className="nb-b" onClick={onBack}>رجوع</button>}
    </div>
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
        {readOnly && count(id) > 0 && <div style={{ marginTop: 8, fontSize: 13, fontWeight: 700, color: "#475569" }}>الصفحات: {Object.keys(obj(done[id])).sort((a, b) => a - b).map(p => <button key={p} className="nb-wk" style={{ margin: 2, padding: "2px 6px", display: "inline-flex" }} onClick={() => onOpen(id, +p)}>{ar(p)}</button>)}</div>}
      </div>; })}
  </div>;
}

// ══════════════════════ بوابة الطالب (#marji) ══════════════════════
export function NafsBooksStudent({ api, onBack }) {
  const [st, setSt] = useState(() => { const s = lsGet(REMEMBER); return s && s.until > Date.now() ? s : null; });
  const [open, setOpen] = useState(null);
  useEffect(() => { if (!st) return; const k = "nb-visit-" + st.id; try { if (sessionStorage.getItem(k)) return; sessionStorage.setItem(k, "1"); } catch {}
    (async () => { const n = +(await api.maGet(`${NB_SEEN}/${st.id}/n`)) || 0; const now = Date.now(); api.maPut(`${NB_SEEN}/${st.id}/n`, n + 1); api.maPut(`${NB_SEEN}/${st.id}/at`, now); if (!n) api.maPut(`${NB_SEEN}/${st.id}/first`, now); })(); }, [st && st.id]);
  const logout = () => { try { localStorage.removeItem(REMEMBER); } catch {} setSt(null); setOpen(null); };
  return <div className="nb"><style>{CSS}</style>
    {!st ? <StudentLogin api={api} onIn={setSt} onBack={onBack} />
      : open ? <BookViewer api={api} book={open.book} startPage={open.page} store={`${NB}/${st.id}`} idx={`${NB_IDX}/${st.id}`} tc="show" tcPath={`${NB_TC}/${st.id}`}
          boards={`${NB_B}/s_${st.id}`} seenSid={st.id} who={"s_" + st.id} title={st.name.split(" ").slice(0, 2).join(" ")} onBack={() => setOpen(null)} />
        : <Library api={api} student={st} onOpen={(book, page) => setOpen({ book, page })} onLogout={logout} onBack={onBack} />}
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

function StudentReview({ api, st, books, by, onBack }) {
  const [open, setOpen] = useState(null);
  return open ? <BookViewer api={api} book={open.book} startPage={open.page} store={`${NB}/${st.id}`} marks={`${NB_IDX}/${st.id}`} readOnly tc="edit" tcPath={`${NB_TC}/${st.id}`} by={by}
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
  if (!S) return <div className="nb" style={{ minHeight: "auto", background: "transparent" }}><style>{CSS}</style><div className="nb-msg">⏳ جارٍ قراءة جدولك…</div></div>;
  const books = BOOK_IDS.filter(b => arr(S.assign[b]).length);
  const allCks = Object.keys(ros).filter(k => k.startsWith("3-")).sort(byCk);
  const saveMan = M => { const A = Object.fromEntries(Object.entries(M).filter(([, v]) => v.length)); lsSet(TMAN, A); api.maPut(`${NB_TP}/${S.key}/_man`, Object.keys(A).length ? A : null); setS(s => ({ ...s, assign: A })); setMan(null); };
  const V = view; const back = () => { setView(null); loadTp(S.key); };
  const wrapIn = n => <div className="nb" style={{ minHeight: "auto", background: "transparent" }}><style>{CSS}</style>{n}</div>;
  const myAl = Object.values(al).filter(a => a && a.tkey === S.key);

  if (V && V.k === "present") return wrapIn(<BookViewer api={api} book={V.book} startPage={V.page || lsGet(`nb-last-t_${S.key}-${V.book}`, 1) || 1}
    tp={{ tkey: S.key, tname: S.name, cks: S.assign[V.book], ck: V.ck, storeBase: `${NB_T}/${S.key}` }} boards={`${NB_B}/t_${S.key}`} who={"t_" + S.key} title="العرض والشرح" onBack={back} />);
  if (V && V.k === "plan") return wrapIn(<div className="nb-home"><div className="nb-book nb-h" style={{ "--c": BOOKS[V.book].c }}><b>🗓️ إنجازي في {BOOKS[V.book].name}</b><span className="nb-sp" /><button className="nb-b" onClick={back}>رجوع</button></div>
    <PlanGrid api={api} tkey={S.key} tname={S.name} book={V.book} cks={S.assign[V.book]} editable alerts={al} onOpen={pg => setView({ k: "present", book: V.book, ck: selCk[V.book] || S.assign[V.book][0], page: pg })} /></div>);
  if (V && V.k === "stu") return wrapIn(<StudentReview api={api} st={V.st} books={[V.book]} by={S.name} onBack={() => setView({ k: "studs", book: V.book })} />);
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
  const wrapIn = n => <div className="nb" style={{ minHeight: "auto", background: "transparent" }}><style>{CSS}</style>{n}</div>;
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

  if (V && V.k === "book") return wrapIn(<BookViewer api={api} book={V.book} startPage={V.page || 1} title="تصفح الإدارة" who="adm" onBack={back} />);
  if (V && V.k === "board") return wrapIn(<BookViewer api={api} book={V.book} startPage={V.page || 1} store={`${NB_T}/${V.r.key}/${V.ck}`} readOnly boards={`${NB_B}/t_${V.r.key}`} boardsRO who="adm" title={`عرض ${V.r.name} • ${cls(V.ck)}`} onBack={() => setView({ k: "teacher", r: V.r })} />);
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
      <div className="nb-tabs">{[["sum", "📊 الملخص"], ["alerts", <>🔔 الاختبارات{nNew ? <span className="nb-badge">{ar(nNew)}</span> : null}</>], ["teachers", "👨‍🏫 المعلمون"], ["students", "🎓 الطلاب"], ["books", "📖 الكتب"]].map(([k, l]) => <button key={k} className={"nb-b" + (tab === k ? " on" : "")} onClick={() => setTab(k)}>{l}</button>)}</div>
    </div>

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
