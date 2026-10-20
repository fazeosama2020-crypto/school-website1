// ════════════════════════════════════════════════════════════════════
// 📚 مراجع نافس – الصف الثالث المتوسط (الرياضيات • العلوم • لغتي)
// • الطالب: يدخل برقم هويته (كشوف الثالث المتوسط) ويحل في دفتره الخاص      school-nafsbook/{sid}/{book}/{page}
// • المعلم: يرى مواده وفصوله حسب الجدول المدرسي، يعرض للشرح ويكتب على السبورة لكل فصل
//            school-nafsbook-t/{tkey}/{ck}/{book}/{page} ، ويسجّل ما شرحه   school-nafsbook-tp/{tkey}/{book}/{ck}/{slot}
//            ويتابع حلول طلابه ويعلّق                                      school-nafsbook-tc/{sid}/{book}/{page}
// • الإدارة: تتصفح الكتب الثلاثة، وترى إنجاز كل معلم وكل طالب
// • ملفات PDF في public/nafs/ ولا تدخل في حزمة الموقع؛ ومكتبة pdf.js تُحمَّل فقط عند فتح هذه الصفحة
// ════════════════════════════════════════════════════════════════════
import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";

const NB = "school-nafsbook", NB_IDX = "school-nafsbook-idx", NB_TC = "school-nafsbook-tc";
const NB_T = "school-nafsbook-t", NB_TP = "school-nafsbook-tp";
const PDFJS = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
const PDFJS_W = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
const REMEMBER = "nafsbook-stu-v1", TMAN = "nafsbook-tman-v1";
const ar = n => String(n ?? "").replace(/\d/g, d => "٠١٢٣٤٥٦٧٨٩"[d]);
const normId = v => String(v ?? "").replace(/[٠-٩]/g, d => "٠١٢٣٤٥٦٧٨٩".indexOf(d)).replace(/\D/g, "");
const obj = v => (v && typeof v === "object" ? v : {});
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

const CSS = `
.nb{direction:rtl;font-family:inherit;color:#1d2433;min-height:100vh;background:#eef0f4}
.nb *{box-sizing:border-box}
.nb-top{position:sticky;top:0;z-index:30;background:#fff;border-bottom:3px solid var(--c,#334155);padding:8px 10px;display:flex;flex-wrap:wrap;gap:6px;align-items:center}
.nb-top b{font-size:15px}
.nb-sp{flex:1}
.nb-b{border:1px solid #cbd5e1;background:#fff;border-radius:10px;padding:6px 10px;font:inherit;font-size:13px;font-weight:800;cursor:pointer;white-space:nowrap;color:#1d2433}
.nb-b.on{background:var(--c,#334155);color:#fff;border-color:var(--c,#334155)}
.nb-b.ok{background:#16a34a;color:#fff;border-color:#16a34a}
.nb-b:disabled{opacity:.4}
.nb-sel{border:1px solid #cbd5e1;border-radius:10px;padding:6px;font:inherit;font-size:13px;max-width:190px;background:#fff}
.nb-pg{display:flex;align-items:center;gap:4px;font-weight:800;font-size:13px}
.nb-pg input{width:52px;text-align:center;border:1px solid #cbd5e1;border-radius:8px;padding:5px;font:inherit}
.nb-tools{position:sticky;top:var(--th,52px);z-index:29;display:flex;gap:6px;overflow-x:auto;padding:6px 10px;background:#f8fafc;border-bottom:1px solid #e2e8f0;align-items:center}
.nb-dot{width:26px;height:26px;border-radius:50%;border:3px solid #fff;box-shadow:0 0 0 1px #cbd5e1;cursor:pointer;flex:none}
.nb-dot.on{box-shadow:0 0 0 3px #1d2433}
.nb-stage{padding:10px 0 90px;overflow-x:auto}
.nb-page{position:relative;margin:0 auto;background:#fff;box-shadow:0 4px 18px rgba(0,0,0,.15)}
.nb-page canvas{position:absolute;inset:0;width:100%;height:100%}
.nb-note{position:absolute;transform:translate(50%,-50%);background:#fff8c5;border:1.5px solid #e0b100;border-radius:8px;padding:2px 6px;font-weight:800;color:#7c2d12;min-width:40px;max-width:60%;box-shadow:0 2px 6px rgba(0,0,0,.15);z-index:5;white-space:pre-wrap;line-height:1.5}
.nb-note textarea{border:0;background:transparent;font:inherit;color:inherit;resize:none;width:100%;min-width:120px;outline:none}
.nb-note .x{position:absolute;top:-10px;left:-10px;width:20px;height:20px;border-radius:50%;background:#dc2626;color:#fff;border:0;font-size:12px;line-height:20px;cursor:pointer;padding:0}
.nb-tc{max-width:900px;margin:8px auto;background:#ecfdf5;border:2px solid #10b981;border-radius:12px;padding:8px 12px;font-weight:700;font-size:14px}
.nb-info{max-width:900px;margin:8px auto;background:#fffbeb;border:1.5px dashed #f59e0b;border-radius:12px;padding:6px 12px;font-weight:800;font-size:13px;color:#92400e;text-align:center}
.nb-msg{text-align:center;padding:40px 10px;font-weight:800;color:#475569}
.nb-card{background:#fff;border-radius:16px;box-shadow:0 2px 12px rgba(0,0,0,.08);padding:18px;max-width:520px;margin:20px auto}
.nb-home{display:grid;gap:12px;max-width:980px;margin:16px auto;padding:0 12px}
.nb-book{background:#fff;border-radius:16px;border-top:6px solid var(--c);padding:14px;box-shadow:0 2px 10px rgba(0,0,0,.07);min-width:0}
.nb-weeks{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
.nb-wk{border:1px solid #cbd5e1;background:#fff;border-radius:8px;min-width:36px;padding:4px 0;font:inherit;font-weight:800;cursor:pointer}
.nb-wk.done{background:var(--c);color:#fff;border-color:var(--c)}
.nb-save{position:fixed;bottom:calc(14px + env(safe-area-inset-bottom,0px));left:14px;z-index:40;background:#1d2433;color:#fff;border-radius:999px;padding:6px 14px;font-size:12px;font-weight:800;opacity:.9}
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
.nb-bar{height:8px;border-radius:99px;background:#e2e8f0;overflow:hidden;min-width:60px}
.nb-bar i{display:block;height:100%;background:var(--c,#16a34a);border-radius:99px}
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
@media (max-width:560px){.nb-top b{font-size:13.5px}.nb-tbl{font-size:12.5px}}
`;

// ══════════════════════ عارض الصفحة مع طبقة الكتابة ══════════════════════
// store: مسار حفظ الكتابة (null = كتابة مؤقتة للعرض لا تُحفظ) • idx: فهرس الصفحات المحلولة
// tc: "show" يعرض تعليق المعلم للطالب • "edit" يكتب المعلم تعليقه • tp: تسجيل «تم شرحه» لفصل
function BookViewer({ api, book, startPage = 1, store = null, idx = null, readOnly = false, tc: tcMode = null, tcPath = null, tp = null, title = "", by = "", onBack }) {
  const B = BOOKS[book];
  const [doc, setDoc] = useState(null);
  const [err, setErr] = useState("");
  const [page, setPage] = useState(startPage);
  const [fit, setFit] = useState("width");
  const [zoom, setZoom] = useState(1);
  const [tool, setTool] = useState("view");
  const [color, setColor] = useState("#1d4ed8");
  const [ann, setAnn] = useState({ s: [], n: [] });
  const [tc, setTc] = useState(null);
  const [tcDraft, setTcDraft] = useState("");
  const [saved, setSaved] = useState("");
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [editNote, setEditNote] = useState(null);
  const [tpDone, setTpDone] = useState({});
  const stageRef = useRef(null), pdfRef = useRef(null), inkRef = useRef(null), topRef = useRef(null);
  const hist = useRef([]), drawing = useRef(null), saveT = useRef(null), renderT = useRef(null), annRef = useRef(ann);
  annRef.current = ann;
  const base = `${book}/${page}`;
  const seg = segAt(book, page);

  useEffect(() => { let ok = true; openDoc(book).then(d => ok && setDoc(d)).catch(() => ok && setErr("تعذّر تحميل المرجع. تأكد من الاتصال بالإنترنت ثم أعد المحاولة.")); return () => { ok = false; }; }, [book]);
  useEffect(() => { if (tp) api.maGet(tp.path).then(d => setTpDone(obj(d))); }, [tp && tp.path]);

  // تحميل الكتابة وتعليق المعلم للصفحة
  useEffect(() => {
    let ok = true; hist.current = []; setEditNote(null);
    setAnn({ s: [], n: [] }); setTc(null); setTcDraft("");
    Promise.all([store ? api.maGet(`${store}/${base}`) : null, tcMode && tcPath ? api.maGet(`${tcPath}/${base}`) : null]).then(([a, t]) => {
      if (!ok) return;
      const A = obj(a);
      setAnn({ s: arr(A.s).map(x => ({ ...x, p: dec(x.p) })), n: arr(A.n) });
      setTc(t && t.t ? t : null); setTcDraft(t && t.t ? t.t : "");
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
  }, [doc, page, fit, zoom]);
  useEffect(() => { render(); }, [render]);
  useEffect(() => { let t; const f = () => { clearTimeout(t); t = setTimeout(render, 200); }; window.addEventListener("resize", f); return () => window.removeEventListener("resize", f); }, [render]);
  useEffect(() => { if (topRef.current && stageRef.current) stageRef.current.parentElement.style.setProperty("--th", topRef.current.offsetHeight + "px"); });

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
      if (idx) await api.maPut(`${idx}/${base}`, empty ? null : Date.now());
      setSaved(ok === false ? "تعذّر الحفظ – سيُعاد تلقائيًا" : "تم الحفظ ✓"); setTimeout(() => setSaved(""), 1500);
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
    await api.maPut(`${tcPath}/${base}`, v); setTc(v); setSaved("تم حفظ التعليق ✓"); setTimeout(() => setSaved(""), 1500);
  };
  const toggleTp = async () => {
    if (!tp || !seg) return; const on = !tpDone[seg.slot]; const v = on ? Date.now() : null;
    setTpDone(d => { const n = { ...d }; if (on) n[seg.slot] = v; else delete n[seg.slot]; return n; });
    await api.maPut(`${tp.path}/${seg.slot}`, v); if (tp.onChange) tp.onChange();
    setSaved(on ? `سُجّل: ${seg.k === "t" ? "طُبّق" : "شُرح"} لفصل ${cls(tp.ck)} ✓` : "أُلغي التسجيل"); setTimeout(() => setSaved(""), 1800);
  };

  const go = d => setPage(p => Math.min(Math.max(1, p + d), doc ? doc.numPages : B.pages));
  useEffect(() => { window.scrollTo({ top: 0 }); }, [page]);
  useEffect(() => { const k = e => { if (/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return; if (e.key === "ArrowLeft") go(1); if (e.key === "ArrowRight") go(-1); }; window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); });

  const drawingMode = !readOnly && tool !== "view";
  const COLORS = ["#1d4ed8", "#dc2626", "#16a34a", "#111827"];
  const total = doc ? doc.numPages : B.pages;
  const tpOn = tp && seg && tpDone[seg.slot];

  return <div style={{ "--c": B.c }}>
    <div className="nb-top" ref={topRef}>
      <button className="nb-b" onClick={onBack}>→ رجوع</button>
      <b>{B.name}{title ? ` • ${title}` : ""}</b>
      <span className="nb-sp" />
      <select className="nb-sel" value="" onChange={e => e.target.value && setPage(+e.target.value)} aria-label="انتقل إلى">
        <option value="">انتقل إلى…</option>
        <option value="1">الغلاف والخطة</option>
        {Array.from({ length: 15 }, (_, w) => <optgroup key={w} label={`الأسبوع ${ar(w + 1)}`}>
          <option value={B.units[w * 2]}>{B.titles[w * 2]}</option>
          <option value={B.units[w * 2 + 1]}>{B.titles[w * 2 + 1]}</option>
          <option value={B.tests[w]}>اختبار الأسبوع {ar(w + 1)}</option>
        </optgroup>)}
      </select>
      <span className="nb-pg">
        <button className="nb-b" onClick={() => go(-1)} disabled={page <= 1}>›</button>
        <input value={ar(page)} inputMode="numeric" onChange={e => { const v = +normId(e.target.value); if (v >= 1 && v <= total) setPage(v); }} aria-label="رقم الصفحة" />
        / {ar(total)}
        <button className="nb-b" onClick={() => go(1)} disabled={page >= total}>‹</button>
      </span>
      <button className={"nb-b" + (fit === "width" ? " on" : "")} onClick={() => { setFit("width"); setZoom(1); }}>بعرض الشاشة</button>
      <button className={"nb-b" + (fit === "page" ? " on" : "")} onClick={() => { setFit("page"); setZoom(1); }}>صفحة كاملة</button>
      <button className="nb-b" onClick={() => setZoom(z => Math.max(1, +(z - 0.25).toFixed(2)))} disabled={zoom <= 1} aria-label="تصغير">−</button>
      <button className="nb-b" onClick={() => setZoom(z => Math.min(2.5, +(z + 0.25).toFixed(2)))} aria-label="تكبير">+</button>
    </div>
    {!readOnly && <div className="nb-tools">
      {tp && seg && <button className={"nb-b" + (tpOn ? " ok" : "")} onClick={toggleTp} title={seg.label}>{tpOn ? "✅" : "⬜"} {seg.k === "t" ? "طُبّق الاختبار" : "تم شرح الدرس"} • {cls(tp.ck)}</button>}
      <button className={"nb-b" + (tool === "view" ? " on" : "")} onClick={() => setTool("view")}>✋ تصفح</button>
      <button className={"nb-b" + (tool === "pen" ? " on" : "")} onClick={() => setTool("pen")}>✏️ قلم</button>
      {COLORS.map(c => <span key={c} className={"nb-dot" + (tool === "pen" && color === c ? " on" : "")} style={{ background: c }} onClick={() => { setColor(c); setTool("pen"); }} role="button" aria-label="لون" />)}
      <button className={"nb-b" + (tool === "hl" ? " on" : "")} onClick={() => setTool("hl")}>🖍️ تظليل</button>
      <button className={"nb-b" + (tool === "text" ? " on" : "")} onClick={() => setTool("text")}>💬 ملاحظة</button>
      <button className={"nb-b" + (tool === "erase" ? " on" : "")} onClick={() => setTool("erase")}>🧽 ممحاة</button>
      <button className="nb-b" onClick={undo} disabled={!hist.current.length}>↩︎ تراجع</button>
      <button className="nb-b" onClick={clearPage}>🗑️ مسح الصفحة</button>
    </div>}
    {!readOnly && !store && <div className="nb-info">وضع العرض: ما تكتبه هنا للشرح فقط ولا يُحفظ</div>}

    {tcMode === "show" && tc && <div className="nb-tc">💬 تعليق {tc.by}: {tc.t}</div>}
    {tcMode === "edit" && <div className="nb-tc" style={{ background: "#eff6ff", borderColor: "#3b82f6" }}>
      <div style={{ marginBottom: 6 }}>تعليقك على هذه الصفحة للطالب{tc && tc.by && tc.by !== by ? ` (آخر تعليق: ${tc.by})` : ""}:</div>
      <div style={{ display: "flex", gap: 6 }}>
        <input value={tcDraft} onChange={e => setTcDraft(e.target.value)} placeholder="مثال: أحسنت، راجع السؤال ٣" style={{ flex: 1, minWidth: 0, border: "1px solid #cbd5e1", borderRadius: 8, padding: 8, font: "inherit" }} />
        <button className="nb-b on" style={{ "--c": "#2563eb" }} onClick={saveTc}>حفظ</button>
      </div>
    </div>}

    <div className="nb-stage" ref={stageRef}>
      {err ? <div className="nb-msg">{err}</div> : !doc ? <div className="nb-msg">📚 جارٍ تحميل المرجع…</div> :
        <div className="nb-page" style={{ width: size.w || "100%", height: size.h || "60vh" }}>
          <canvas ref={pdfRef} />
          <canvas ref={inkRef} style={{ touchAction: drawingMode ? "none" : "auto", cursor: drawingMode ? (tool === "text" ? "text" : "crosshair") : "default", pointerEvents: drawingMode ? "auto" : "none" }}
            onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} />
          {ann.n.map(n => <div key={n.id} className="nb-note" style={{ right: `${(1 - n.x) * 100}%`, top: `${n.y * 100}%`, fontSize: Math.max(12, size.w * 0.022) }}
            onClick={e => { if (!readOnly) { e.stopPropagation(); setEditNote(n.id); } }}>
            {editNote === n.id ? <textarea autoFocus rows={2} value={n.t} onChange={e => setNoteText(n.id, e.target.value)} onBlur={() => finishNote(n.id)} placeholder="اكتب هنا…" />
              : <span>{n.t}</span>}
            {!readOnly && editNote !== n.id && <button className="x" onClick={e => { e.stopPropagation(); delNote(n.id); }} aria-label="حذف الملاحظة">×</button>}
          </div>)}
        </div>}
    </div>

    <div className="nb-nav"><button onClick={() => go(-1)} aria-label="السابقة">›</button><button onClick={() => go(1)} aria-label="التالية">‹</button></div>
    {saved && <div className="nb-save">{saved}</div>}
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
      try { localStorage.setItem(REMEMBER, JSON.stringify({ ...st, until: Date.now() + 30 * 864e5 })); } catch {}
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

function Library({ api, student, books = BOOK_IDS, onOpen, onLogout, onBack, readOnly }) {
  const [done, setDone] = useState({});
  useEffect(() => { if (student) api.maGet(`${NB_IDX}/${student.id}`).then(d => setDone(obj(d))); }, [student && student.id]);
  const weekHas = (book, w) => Object.keys(obj(done[book])).some(p => weekOfPage(book, +p) === w);
  const count = book => Object.keys(obj(done[book])).length;
  return <div className="nb-home">
    <div className="nb-book" style={{ "--c": "#7c3aed", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 900, fontSize: 17 }}>{readOnly ? "دفتر الطالب: " : "أهلًا "}{student.name}</div>
        <div style={{ color: "#64748b", fontWeight: 700, fontSize: 13 }}>الثالث المتوسط / {ar(String(student.ck).split("-")[1])} • الأسابيع الملوّنة فيها حل محفوظ</div>
      </div>
      {onLogout && <button className="nb-b" onClick={onLogout}>تبديل الطالب</button>}
      {onBack && <button className="nb-b" onClick={onBack}>رجوع</button>}
    </div>
    {books.map(id => { const B = BOOKS[id]; return <div key={id} className="nb-book" style={{ "--c": B.c }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <b style={{ fontSize: 19, color: B.c, flex: 1 }}>{B.name}</b>
        <small style={{ fontWeight: 800, color: "#64748b" }}>{ar(count(id))} صفحة فيها حل</small>
        <button className="nb-b on" onClick={() => onOpen(id, 1)}>{readOnly ? "افتح دفتره" : "افتح المرجع"}</button>
      </div>
      <div className="nb-weeks">{Array.from({ length: 15 }, (_, w) => <button key={w} className={"nb-wk" + (weekHas(id, w) ? " done" : "")} onClick={() => onOpen(id, B.units[w * 2])} aria-label={`الأسبوع ${w + 1}`}>{ar(w + 1)}</button>)}</div>
      {readOnly && count(id) > 0 && <div style={{ marginTop: 8, fontSize: 13, fontWeight: 700, color: "#475569" }}>الصفحات: {Object.keys(obj(done[id])).sort((a, b) => a - b).map(p => <button key={p} className="nb-wk" style={{ margin: 2, padding: "2px 6px" }} onClick={() => onOpen(id, +p)}>{ar(p)}</button>)}</div>}
    </div>; })}
  </div>;
}

// ══════════════════════ بوابة الطالب (#marji) ══════════════════════
export function NafsBooksStudent({ api, onBack }) {
  const [st, setSt] = useState(() => { try { const s = JSON.parse(localStorage.getItem(REMEMBER) || "null"); return s && s.until > Date.now() ? s : null; } catch { return null; } });
  const [open, setOpen] = useState(null);
  const logout = () => { try { localStorage.removeItem(REMEMBER); } catch {} setSt(null); setOpen(null); };
  return <div className="nb"><style>{CSS}</style>
    {!st ? <StudentLogin api={api} onIn={setSt} onBack={onBack} />
      : open ? <BookViewer api={api} book={open.book} startPage={open.page} store={`${NB}/${st.id}`} idx={`${NB_IDX}/${st.id}`} tc="show" tcPath={`${NB_TC}/${st.id}`}
          title={st.name.split(" ").slice(0, 2).join(" ")} onBack={() => setOpen(null)} />
        : <Library api={api} student={st} onOpen={(book, page) => setOpen({ book, page })} onLogout={logout} onBack={onBack} />}
  </div>;
}

// ══════════════════════ أجزاء مشتركة للمعلم والإدارة ══════════════════════
const Bar = ({ v, c = "#16a34a" }) => <div className="nb-bar" style={{ "--c": c }}><i style={{ width: `${Math.min(100, v)}%` }} /></div>;

// خطة الأسابيع: ما شرحه المعلم وما طبّقه من اختبارات لكل فصل
function PlanGrid({ api, tkey, book, cks, editable, onOpen }) {
  const B = BOOKS[book];
  const [D, setD] = useState(null);
  const load = () => api.maGet(`${NB_TP}/${tkey}/${book}`).then(d => setD(obj(d)));
  useEffect(() => { load(); }, [tkey, book]);
  const toggle = async (ck, slot) => {
    if (!editable) return; const on = !(D[ck] && D[ck][slot]);
    setD(d => { const n = { ...d, [ck]: { ...obj(d[ck]) } }; if (on) n[ck][slot] = Date.now(); else delete n[ck][slot]; return n; });
    await api.maPut(`${NB_TP}/${tkey}/${book}/${ck}/${slot}`, on ? Date.now() : null);
  };
  if (!D) return <div className="nb-msg">⏳</div>;
  return <div style={{ display: "grid", gap: 8 }}>
    <div className="nb-kpis">{cks.map(ck => { const c = tpCount(D[ck]); return <div key={ck} className="nb-kpi" style={{ "--c": B.c }}>
      <small>فصل {cls(ck)}</small><b>{ar(c.u)}<small style={{ fontSize: 13 }}> / ٣٠ درسًا</small></b>
      <Bar v={pct(c.u, 30)} c={B.c} /><small>الاختبارات المطبّقة: {ar(c.t)} / ١٥</small></div>; })}</div>
    {editable && <div className="nb-info" style={{ margin: 0 }}>اضغط اسم الفصل بجانب الدرس عند انتهائك من شرحه (✓ أخضر)، أو سجّله من داخل الكتاب أثناء العرض</div>}
    {Array.from({ length: 15 }, (_, w) => <div key={w} className="nb-wkc">
      <b style={{ color: B.c }}>الأسبوع {ar(w + 1)}</b>
      {[["u" + (w * 2), B.titles[w * 2], B.units[w * 2]], ["u" + (w * 2 + 1), B.titles[w * 2 + 1], B.units[w * 2 + 1]], ["t" + w, `📝 اختبار الأسبوع ${ar(w + 1)}`, B.tests[w]]].map(([slot, label, pg]) =>
        <div key={slot} className="nb-it">
          <span style={{ flex: "1 1 160px", minWidth: 0 }}>{label}</span>
          <span style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {onOpen && <button className="nb-chk" onClick={() => onOpen(pg)} title="افتح الصفحة">📖</button>}
          {cks.map(ck => { const t = D[ck] && D[ck][slot]; return <button key={ck} className={"nb-chk" + (t ? " on" : "")} disabled={!editable} onClick={() => toggle(ck, slot)} title={t ? new Date(t).toLocaleDateString("ar-SA") : ""}>{t ? "✓ " : ""}{cls(ck)}</button>; })}
          </span>
        </div>)}
    </div>)}
  </div>;
}

// قائمة طلاب الفصول مع إنجازهم في الكتب
function ClassStudents({ api, ros, idx, cks, books, onPick }) {
  const [ck, setCk] = useState(cks[0] || ""); const [q, setQ] = useState(""); const [only, setOnly] = useState("all");
  useEffect(() => { if (!cks.includes(ck)) setCk(cks[0] || ""); }, [cks.join()]);
  const studs = arr(ros[ck] && ros[ck].students).filter(s => s && s.id && s.name);
  const pages = (s, b) => Object.keys(obj(obj(idx[s.id])[b])).length;
  const weeks = (s, b) => new Set(Object.keys(obj(obj(idx[s.id])[b])).map(p => weekOfPage(b, +p)).filter(w => w >= 0)).size;
  const last = s => Math.max(0, ...books.flatMap(b => Object.values(obj(obj(idx[s.id])[b])).map(Number)));
  const tot = s => books.reduce((t, b) => t + pages(s, b), 0);
  const rows = studs.filter(s => (!q || s.name.includes(q)) && (only === "all" || (only === "no" ? !tot(s) : tot(s) > 0)));
  const started = studs.filter(s => tot(s) > 0).length;
  const csv = () => {
    const H = ["الطالب", "الفصل", ...books.flatMap(b => [`${BOOKS[b].name} صفحات`, `${BOOKS[b].name} أسابيع`]), "آخر نشاط"];
    const L = rows.map(s => [s.name, cls(ck), ...books.flatMap(b => [pages(s, b), weeks(s, b)]), last(s) ? new Date(last(s)).toLocaleDateString("ar-SA") : "—"]);
    const t = "﻿" + [H, ...L].map(r => r.map(x => `"${String(x).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([t], { type: "text/csv;charset=utf-8" })); a.download = `مراجع_نافس_${cls(ck).replace("/", "-")}.csv`; a.click();
  };
  if (!cks.length) return <div className="nb-msg">لا توجد فصول</div>;
  return <div className="nb-book" style={{ "--c": "#7c3aed", display: "grid", gap: 8 }}>
    <div className="nb-tabs">{cks.map(c => <button key={c} className={"nb-b" + (ck === c ? " on" : "")} onClick={() => setCk(c)}>فصل {cls(c)}</button>)}</div>
    <div className="nb-kpis">
      <div className="nb-kpi"><b>{ar(started)} <small style={{ fontSize: 13 }}>من {ar(studs.length)}</small></b><small>طالب بدأ الحل</small><Bar v={pct(started, studs.length)} c="#7c3aed" /></div>
      {books.map(b => { const s = studs.filter(x => pages(x, b) > 0).length, p = studs.reduce((t, x) => t + pages(x, b), 0); return <div key={b} className="nb-kpi" style={{ "--c": BOOKS[b].c }}>
        <b>{ar(s)} <small style={{ fontSize: 13 }}>طالب</small></b><small>{BOOKS[b].name}: {ar(p)} صفحة محلولة</small><Bar v={pct(s, studs.length)} c={BOOKS[b].c} /></div>; })}
      <div className="nb-kpi" style={{ "--c": "#b91c1c" }}><b>{ar(studs.filter(s => !s.nh).length)}</b><small>لم تُربط هويتهم (لا يستطيعون الدخول)</small></div>
    </div>
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
      <input value={q} onChange={e => setQ(e.target.value)} placeholder="🔍 ابحث باسم الطالب" style={{ flex: "1 1 160px", border: "1px solid #cbd5e1", borderRadius: 10, padding: 8, font: "inherit" }} />
      {[["all", "الكل"], ["yes", "بدأ"], ["no", `لم يبدأ (${ar(studs.length - started)})`]].map(([k, l]) => <button key={k} className={"nb-b" + (only === k ? " on" : "")} onClick={() => setOnly(k)}>{l}</button>)}
      <button className="nb-b" onClick={csv}>⬇️ تصدير Excel</button>
    </div>
    <div className="nb-tbl-w"><table className="nb-tbl"><thead><tr><th>م</th><th className="r">الطالب</th>{books.map(b => <th key={b} style={{ color: BOOKS[b].c }}>{BOOKS[b].name}<br /><small>صفحات • أسابيع</small></th>)}<th>آخر نشاط</th></tr></thead>
      <tbody>{rows.map((s, i) => <tr key={s.id} className="click" onClick={() => onPick({ id: s.id, name: s.name, ck })}>
        <td style={{ color: "#94a3b8" }}>{ar(i + 1)}</td>
        <td className="r">{s.name}{!s.nh && <small style={{ color: "#b91c1c" }}> • لم تُربط هويته</small>}</td>
        {books.map(b => <td key={b}>{pages(s, b) ? <>{ar(pages(s, b))} • {ar(weeks(s, b))}/١٥</> : <span style={{ color: "#cbd5e1" }}>—</span>}</td>)}
        <td style={{ color: "#64748b" }}>{when(last(s))}</td></tr>)}
        {!rows.length && <tr><td colSpan={books.length + 3} style={{ color: "#94a3b8", padding: 20 }}>لا يوجد طلاب مطابقون</td></tr>}
      </tbody></table></div>
    <small style={{ color: "#64748b", fontWeight: 700 }}>اضغط اسم الطالب لفتح دفتره والتعليق على صفحاته</small>
  </div>;
}

// مراجعة دفتر طالب (المعلم/الإدارة)
function StudentReview({ api, st, books, by, onBack }) {
  const [open, setOpen] = useState(null);
  return open ? <BookViewer api={api} book={open.book} startPage={open.page} store={`${NB}/${st.id}`} readOnly tc="edit" tcPath={`${NB_TC}/${st.id}`} by={by}
      title={st.name.split(" ").slice(0, 2).join(" ")} onBack={() => setOpen(null)} />
    : <Library api={api} student={st} books={books} readOnly onOpen={(book, page) => setOpen({ book, page })} onBack={onBack} />;
}

// ══════════════════════ صفحة المعلم: حسب تخصصه في الجدول ══════════════════════
export function NafsBooksTeacher({ api, by }) {
  const [S, setS] = useState(null);       // { name, key, fromTT, assign }
  const [ros, setRos] = useState({}); const [idx, setIdx] = useState({});
  const [view, setView] = useState(null); // {k:"present"|"plan"|"studs"|"stu", book, ck, page, st}
  const [selCk, setSelCk] = useState({});
  const [man, setMan] = useState(null);
  useEffect(() => { (async () => {
    const [T, r, i] = await Promise.all([api.TT ? api.TT().catch(() => null) : null, api.maGet(api.MA_ROSTER), api.maGet(NB_IDX)]);
    const ti = T && T.T && api.ttFind ? api.ttFind(T, by) : -1; const name = ti >= 0 ? T.T[ti] : by;
    let assign = assignOf(T, ti), fromTT = Object.keys(assign).length > 0;
    const key = tKey(name);
    if (!fromTT) { const m = await api.maGet(`${NB_TP}/${key}/_man`); if (m && typeof m === "object") assign = Object.fromEntries(Object.entries(m).map(([b, v]) => [b, arr(v).sort(byCk)]));
      else { try { assign = JSON.parse(localStorage.getItem(TMAN) || "{}") || {}; } catch { assign = {}; } } } setRos(obj(r)); setIdx(obj(i)); setS({ name, key, fromTT, assign });
    api.maPut(`${NB_TP}/${key}/_n`, name); api.maPut(`${NB_TP}/${key}/_at`, Date.now());
  })(); }, []);
  if (!S) return <div className="nb" style={{ minHeight: "auto", background: "transparent" }}><style>{CSS}</style><div className="nb-msg">⏳ جارٍ قراءة جدولك…</div></div>;
  const books = BOOK_IDS.filter(b => arr(S.assign[b]).length);
  const allCks = Object.keys(ros).filter(k => k.startsWith("3-")).sort(byCk);
  const saveMan = M => { const A = Object.fromEntries(Object.entries(M).filter(([, v]) => v.length)); try { localStorage.setItem(TMAN, JSON.stringify(A)); } catch {} api.maPut(`${NB_TP}/${S.key}/_man`, Object.keys(A).length ? A : null); setS(s => ({ ...s, assign: A })); setMan(null); };
  const V = view; const back = () => setView(null);
  const wrapIn = n => <div className="nb" style={{ minHeight: "auto", background: "transparent" }}><style>{CSS}</style>{n}</div>;

  if (V && V.k === "present") return wrapIn(<BookViewer api={api} book={V.book} startPage={V.page || 1} store={`${NB_T}/${S.key}/${V.ck}`} tp={{ path: `${NB_TP}/${S.key}/${V.book}/${V.ck}`, ck: V.ck }}
    title={`سبورة فصل ${cls(V.ck)}`} onBack={back} />);
  if (V && V.k === "plan") return wrapIn(<div className="nb-home"><div className="nb-book nb-h" style={{ "--c": BOOKS[V.book].c }}><b>🗓️ إنجازي في {BOOKS[V.book].name}</b><span className="nb-sp" /><button className="nb-b" onClick={back}>رجوع</button></div>
    <PlanGrid api={api} tkey={S.key} book={V.book} cks={S.assign[V.book]} editable onOpen={pg => setView({ k: "present", book: V.book, ck: selCk[V.book] || S.assign[V.book][0], page: pg })} /></div>);
  if (V && V.k === "stu") return wrapIn(<StudentReview api={api} st={V.st} books={[V.book]} by={S.name} onBack={() => setView({ k: "studs", book: V.book })} />);
  if (V && V.k === "studs") return wrapIn(<div className="nb-home"><div className="nb-book nb-h" style={{ "--c": BOOKS[V.book].c }}><b>🎓 حلول طلابي في {BOOKS[V.book].name}</b><span className="nb-sp" /><button className="nb-b" onClick={back}>رجوع</button></div>
    <ClassStudents api={api} ros={ros} idx={idx} cks={S.assign[V.book]} books={[V.book]} onPick={st => setView({ k: "stu", book: V.book, st })} /></div>);

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
    {books.map(b => { const B = BOOKS[b], cks = S.assign[b], ck = selCk[b] || cks[0];
      const studs = cks.flatMap(c => arr(ros[c] && ros[c].students).filter(s => s && s.id)); const st = studs.filter(s => Object.keys(obj(obj(idx[s.id])[b])).length).length;
      return <div key={b} className="nb-book" style={{ "--c": B.c, display: "grid", gap: 10 }}>
        <div className="nb-h"><b style={{ color: B.c, fontSize: 20 }}>{B.name}</b><span className="nb-sp" /><small style={{ fontWeight: 800, color: "#64748b" }}>بدأ الحل {ar(st)} من {ar(studs.length)} طالب</small></div>
        <div className="nb-h" style={{ gap: 6 }}><small style={{ fontWeight: 800 }}>أشرح الآن لفصل:</small>{cks.map(c => <button key={c} className={"nb-b" + (ck === c ? " on" : "")} onClick={() => setSelCk(s => ({ ...s, [b]: c }))}>{cls(c)}</button>)}</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 8 }}>
          <button className="nb-b on" style={{ padding: 12, fontSize: 15 }} onClick={() => setView({ k: "present", book: b, ck })}>📽️ اعرض للشرح</button>
          <button className="nb-b" style={{ padding: 12, fontSize: 15 }} onClick={() => setView({ k: "plan", book: b })}>🗓️ إنجازي (الخطة)</button>
          <button className="nb-b" style={{ padding: 12, fontSize: 15 }} onClick={() => setView({ k: "studs", book: b })}>🎓 حلول طلابي</button>
        </div>
        <div className="nb-weeks">{Array.from({ length: 15 }, (_, w) => <button key={w} className="nb-wk" onClick={() => setView({ k: "present", book: b, ck, page: B.units[w * 2] })} title={`الأسبوع ${w + 1}`}>{ar(w + 1)}</button>)}</div>
        <small style={{ color: "#64748b", fontWeight: 700 }}>ما تكتبه أثناء الشرح يُحفظ لسبورة كل فصل على حدة، ويمكنك تسجيل «تم شرح الدرس» من شريط الأدوات.</small>
      </div>; })}
  </div>);
}

// ══════════════════════ صفحة الإدارة: تصفح الكتب + إنجاز المعلمين والطلاب ══════════════════════
export function NafsBooksAdmin({ api, by = "الإدارة" }) {
  const [D, setD] = useState(null); const [tab, setTab] = useState("sum"); const [view, setView] = useState(null);
  const load = async () => {
    const [T, r, i, tp, tc] = await Promise.all([api.TT ? api.TT().catch(() => null) : null, api.maGet(api.MA_ROSTER), api.maGet(NB_IDX), api.maGet(NB_TP), api.maGet(NB_TC)]);
    setD({ T, ros: obj(r), idx: obj(i), tp: obj(tp), tc: obj(tc) });
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
      const per = r.cks.map(ck => ({ ck, ...tpCount(P[ck]) }));
      const u = per.reduce((t, x) => t + x.u, 0) / Math.max(1, per.length), t = per.reduce((s, x) => s + x.t, 0) / Math.max(1, per.length);
      const ss = studs.filter(s => r.cks.includes(s.ck)); const st = ss.filter(s => pages(s.id, r.book)).length;
      return { ...r, per, u, t, n: ss.length, st, tc: tcBy[r.name] || 0, at: obj(D.tp[r.key])._at || 0 };
    });
    return { cks, studs, pages, tcN, rows };
  }, [D]);
  if (!D || !M) return wrapIn(<div className="nb-msg">⏳ جارٍ تحميل البيانات…</div>);
  const V = view; const back = () => setView(null);

  if (V && V.k === "book") return wrapIn(<BookViewer api={api} book={V.book} startPage={V.page || 1} title="تصفح الإدارة" onBack={back} />);
  if (V && V.k === "board") return wrapIn(<BookViewer api={api} book={V.book} startPage={V.page || 1} store={`${NB_T}/${V.r.key}/${V.ck}`} readOnly title={`سبورة ${V.r.name} • ${cls(V.ck)}`} onBack={() => setView({ k: "teacher", r: V.r })} />);
  if (V && V.k === "stu") return wrapIn(<StudentReview api={api} st={V.st} books={V.books || BOOK_IDS} by={by} onBack={() => setView(V.from || null)} />);
  if (V && V.k === "teacher") { const r = V.r, B = BOOKS[r.book]; return wrapIn(<div className="nb-home">
    <div className="nb-book nb-h" style={{ "--c": B.c }}><b>👨‍🏫 {r.name} • {B.name}</b><span className="nb-tag" style={{ "--c": B.c }}>{r.cks.map(cls).join("، ")}</span><span className="nb-sp" /><button className="nb-b" onClick={back}>رجوع</button></div>
    <div className="nb-book" style={{ "--c": B.c }}><b>سبورة الشرح المحفوظة لكل فصل:</b> <div className="nb-h" style={{ marginTop: 6, gap: 6 }}>{r.cks.map(ck => <button key={ck} className="nb-b" onClick={() => setView({ k: "board", r, ck, book: r.book })}>📽️ فصل {cls(ck)}</button>)}</div></div>
    <PlanGrid api={api} tkey={r.key} book={r.book} cks={r.cks} editable={false} />
    <ClassStudents api={api} ros={D.ros} idx={D.idx} cks={r.cks} books={[r.book]} onPick={st => setView({ k: "stu", st, books: [r.book], from: V })} />
  </div>); }

  const started = M.studs.filter(s => BOOK_IDS.some(b => M.pages(s.id, b))).length;
  const totalPages = M.studs.reduce((t, s) => t + BOOK_IDS.reduce((x, b) => x + M.pages(s.id, b), 0), 0);
  return wrapIn(<div className="nb-home">
    <div className="nb-book" style={{ "--c": "#7c3aed" }}>
      <div className="nb-h"><b>📚 مراجع نافس – متابعة الإدارة</b><span className="nb-sp" /><button className="nb-b" onClick={() => { setD(null); load(); }}>🔄 تحديث</button></div>
      <p style={{ margin: "6px 0 10px", color: "#475569", fontWeight: 700, fontSize: 13.5 }}>رابط الطلاب: <span dir="ltr" style={{ userSelect: "all" }}>{window.location.origin}/#marji</span> • المعلمون من «بوابة المعلمين» ويرى كلٌّ مادته وفصوله حسب الجدول</p>
      <div className="nb-tabs">{[["sum", "📊 الملخص"], ["books", "📖 الكتب"], ["teachers", "👨‍🏫 المعلمون"], ["students", "🎓 الطلاب"]].map(([k, l]) => <button key={k} className={"nb-b" + (tab === k ? " on" : "")} onClick={() => setTab(k)}>{l}</button>)}</div>
    </div>

    {tab === "sum" && <>
      <div className="nb-kpis">
        <div className="nb-kpi"><b>{ar(M.studs.length)}</b><small>طالب في الثالث المتوسط ({ar(M.cks.length)} فصول)</small></div>
        <div className="nb-kpi" style={{ "--c": "#0f766e" }}><b>{ar(started)}</b><small>بدأ الحل ({ar(pct(started, M.studs.length))}٪)</small><Bar v={pct(started, M.studs.length)} c="#0f766e" /></div>
        <div className="nb-kpi" style={{ "--c": "#2563eb" }}><b>{ar(totalPages)}</b><small>صفحة محلولة في المجموع</small></div>
        <div className="nb-kpi" style={{ "--c": "#b45309" }}><b>{ar(M.tcN)}</b><small>تعليق من المعلمين</small></div>
        <div className="nb-kpi" style={{ "--c": "#b91c1c" }}><b>{ar(M.studs.filter(s => !s.nh).length)}</b><small>طالب لم تُربط هويته</small></div>
      </div>
      <div className="nb-book" style={{ "--c": "#334155" }}><b>الإنجاز حسب المادة والفصل</b>
        <div className="nb-tbl-w" style={{ marginTop: 8 }}><table className="nb-tbl"><thead><tr><th className="r">الفصل</th>{BOOK_IDS.map(b => <th key={b} style={{ color: BOOKS[b].c }}>{BOOKS[b].name}<br /><small>شرح المعلم • طلاب بدؤوا</small></th>)}</tr></thead>
          <tbody>{M.cks.map(ck => { const ss = M.studs.filter(s => s.ck === ck); return <tr key={ck}><td className="r">فصل {cls(ck)}</td>
            {BOOK_IDS.map(b => { const r = M.rows.find(x => x.book === b && x.cks.includes(ck)); const p = r && r.per.find(x => x.ck === ck); const st = ss.filter(s => M.pages(s.id, b)).length;
              return <td key={b}>{r ? <>{ar(p ? p.u : 0)}/٣٠ <small style={{ color: "#64748b" }}>({r.name.split(" ")[0]})</small></> : <small style={{ color: "#cbd5e1" }}>لا معلم</small>} • {ar(st)}/{ar(ss.length)}</td>; })}</tr>; })}</tbody></table></div>
      </div>
    </>}

    {tab === "books" && BOOK_IDS.map(b => { const B = BOOKS[b]; return <div key={b} className="nb-book" style={{ "--c": B.c }}>
      <div className="nb-h"><b style={{ color: B.c }}>{B.name}</b><span className="nb-sp" /><button className="nb-b on" onClick={() => setView({ k: "book", book: b })}>افتح الكتاب</button></div>
      <div className="nb-weeks">{Array.from({ length: 15 }, (_, w) => <button key={w} className="nb-wk" onClick={() => setView({ k: "book", book: b, page: B.units[w * 2] })} title={`${B.titles[w * 2]} • ${B.titles[w * 2 + 1]}`}>{ar(w + 1)}</button>)}</div>
    </div>; })}

    {tab === "teachers" && <div className="nb-book" style={{ "--c": "#334155" }}>
      {!M.rows.length ? <div className="nb-msg">لم يُعثر في الجدول على معلمي الرياضيات والعلوم ولغتي للصف الثالث المتوسط.</div> :
        <div className="nb-tbl-w"><table className="nb-tbl"><thead><tr><th className="r">المعلم</th><th>المادة</th><th>الفصول</th><th>الدروس المشروحة<br /><small>متوسط من ٣٠</small></th><th>الاختبارات<br /><small>من ١٥</small></th><th>طلاب بدؤوا</th><th>تعليقاته</th><th>آخر دخول</th></tr></thead>
          <tbody>{M.rows.map(r => <tr key={r.key + r.book} className="click" onClick={() => setView({ k: "teacher", r })}>
            <td className="r">{r.name}{r.manual && <small style={{ color: "#94a3b8" }}> (يدوي)</small>}</td>
            <td><span className="nb-tag" style={{ "--c": BOOKS[r.book].c }}>{BOOKS[r.book].name}</span></td>
            <td>{r.cks.map(cls).join("، ")}</td>
            <td><div style={{ display: "flex", alignItems: "center", gap: 6 }}><Bar v={pct(r.u, 30)} c={BOOKS[r.book].c} /><span>{ar(Math.round(r.u))}</span></div></td>
            <td>{ar(Math.round(r.t))}</td><td>{ar(r.st)}/{ar(r.n)}</td><td>{ar(r.tc)}</td><td style={{ color: "#64748b" }}>{when(r.at)}</td></tr>)}</tbody></table></div>}
      <small style={{ color: "#64748b", fontWeight: 700 }}>اضغط اسم المعلم لرؤية خطته أسبوعًا بأسبوع وسبورة كل فصل وحلول طلابه</small>
    </div>}

    {tab === "students" && <ClassStudents api={api} ros={D.ros} idx={D.idx} cks={M.cks} books={BOOK_IDS} onPick={st => setView({ k: "stu", st, from: null })} />}
  </div>);
}

export default function NafsBooks({ mode = "student", ...p }) {
  return mode === "admin" ? <NafsBooksAdmin {...p} /> : mode === "teacher" ? <NafsBooksTeacher {...p} /> : <NafsBooksStudent {...p} />;
}
