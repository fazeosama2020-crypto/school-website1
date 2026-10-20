// ════════════════════════════════════════════════════════════════════
// 📚 مراجع نافس – الصف الثالث المتوسط (الرياضيات • العلوم • لغتي)
// • الطالب يدخل برقم هويته (من كشوف الثالث المتوسط في school-mroster)
// • يقرأ المرجع صفحةً صفحة بعرض الشاشة دون تشويه، ويكتب ويرسم ويمسح ويضيف ملاحظات
// • حل كل طالب مستقل: school-nafsbook/{studentId}/{book}/{page}
// • المعلم يتصفح دفتر أي طالب ويعلّق على الصفحة: school-nafsbook-tc/{studentId}/{book}/{page}
// • ملفات PDF في public/nafs/ ولا تدخل في حزمة الموقع؛ ومكتبة pdf.js تُحمَّل فقط عند فتح هذه الصفحة
// ════════════════════════════════════════════════════════════════════
import React, { useEffect, useRef, useState, useCallback } from "react";

const NB = "school-nafsbook", NB_IDX = "school-nafsbook-idx", NB_TC = "school-nafsbook-tc";
const PDFJS = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
const PDFJS_W = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
const REMEMBER = "nafsbook-stu-v1";
const ar = n => String(n ?? "").replace(/\d/g, d => "٠١٢٣٤٥٦٧٨٩"[d]);
const normId = v => String(v ?? "").replace(/[٠-٩]/g, d => "٠١٢٣٤٥٦٧٨٩".indexOf(d)).replace(/\D/g, "");
const obj = v => (v && typeof v === "object" ? v : {});
const arr = v => Array.isArray(v) ? v.filter(Boolean) : (v && typeof v === "object" ? Object.values(v).filter(Boolean) : []);

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
.nb-b:disabled{opacity:.4}
.nb-sel{border:1px solid #cbd5e1;border-radius:10px;padding:6px;font:inherit;font-size:13px;max-width:190px;background:#fff}
.nb-pg{display:flex;align-items:center;gap:4px;font-weight:800;font-size:13px}
.nb-pg input{width:52px;text-align:center;border:1px solid #cbd5e1;border-radius:8px;padding:5px;font:inherit}
.nb-tools{position:sticky;top:var(--th,52px);z-index:29;display:flex;gap:6px;overflow-x:auto;padding:6px 10px;background:#f8fafc;border-bottom:1px solid #e2e8f0}
.nb-dot{width:26px;height:26px;border-radius:50%;border:3px solid #fff;box-shadow:0 0 0 1px #cbd5e1;cursor:pointer;flex:none}
.nb-dot.on{box-shadow:0 0 0 3px #1d2433}
.nb-stage{padding:10px 0 90px;overflow-x:auto}
.nb-page{position:relative;margin:0 auto;background:#fff;box-shadow:0 4px 18px rgba(0,0,0,.15)}
.nb-page canvas{position:absolute;inset:0;width:100%;height:100%}
.nb-note{position:absolute;transform:translate(50%,-50%);background:#fff8c5;border:1.5px solid #e0b100;border-radius:8px;padding:2px 6px;font-weight:800;color:#7c2d12;min-width:40px;max-width:60%;box-shadow:0 2px 6px rgba(0,0,0,.15);z-index:5;white-space:pre-wrap;line-height:1.5}
.nb-note textarea{border:0;background:transparent;font:inherit;color:inherit;resize:none;width:100%;min-width:120px;outline:none}
.nb-note .x{position:absolute;top:-10px;left:-10px;width:20px;height:20px;border-radius:50%;background:#dc2626;color:#fff;border:0;font-size:12px;line-height:20px;cursor:pointer;padding:0}
.nb-tc{max-width:900px;margin:8px auto;background:#ecfdf5;border:2px solid #10b981;border-radius:12px;padding:8px 12px;font-weight:700;font-size:14px}
.nb-msg{text-align:center;padding:40px 10px;font-weight:800;color:#475569}
.nb-card{background:#fff;border-radius:16px;box-shadow:0 2px 12px rgba(0,0,0,.08);padding:18px;max-width:520px;margin:20px auto}
.nb-home{display:grid;gap:12px;max-width:900px;margin:16px auto;padding:0 12px}
.nb-book{background:#fff;border-radius:16px;border-top:6px solid var(--c);padding:14px;box-shadow:0 2px 10px rgba(0,0,0,.07)}
.nb-weeks{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
.nb-wk{border:1px solid #cbd5e1;background:#fff;border-radius:8px;min-width:36px;padding:4px 0;font:inherit;font-weight:800;cursor:pointer}
.nb-wk.done{background:var(--c);color:#fff;border-color:var(--c)}
.nb-save{position:fixed;bottom:calc(14px + env(safe-area-inset-bottom,0px));left:14px;z-index:40;background:#1d2433;color:#fff;border-radius:999px;padding:6px 14px;font-size:12px;font-weight:800;opacity:.9}
.nb-nav{position:fixed;bottom:calc(12px + env(safe-area-inset-bottom,0px));right:12px;z-index:40;display:flex;gap:8px}
.nb-nav button{width:52px;height:46px;border-radius:14px;border:0;background:var(--c,#334155);color:#fff;font-size:22px;font-weight:900;box-shadow:0 3px 10px rgba(0,0,0,.25);cursor:pointer}
.nb-list{display:grid;gap:6px}
.nb-row{display:flex;align-items:center;justify-content:space-between;gap:8px;background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:8px 12px;cursor:pointer;font-weight:800}
.nb-row small{color:#64748b;font-weight:700}
`;

// ══════════════════════ عارض الصفحة مع طبقة الكتابة ══════════════════════
function BookViewer({ api, book, student, startPage = 1, readOnly = false, teacherName = "", onBack }) {
  const B = BOOKS[book];
  const [doc, setDoc] = useState(null);
  const [err, setErr] = useState("");
  const [page, setPage] = useState(startPage);
  const [fit, setFit] = useState("width");          // width | page
  const [zoom, setZoom] = useState(1);
  const [tool, setTool] = useState("view");          // view | pen | hl | erase | text
  const [color, setColor] = useState("#1d4ed8");
  const [ann, setAnn] = useState({ s: [], n: [] }); // s: strokes, n: notes
  const [tc, setTc] = useState(null);
  const [tcDraft, setTcDraft] = useState("");
  const [saved, setSaved] = useState("");
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [editNote, setEditNote] = useState(null);
  const stageRef = useRef(null), pdfRef = useRef(null), inkRef = useRef(null), topRef = useRef(null);
  const hist = useRef([]), drawing = useRef(null), saveT = useRef(null), renderT = useRef(null), annRef = useRef(ann);
  annRef.current = ann;
  const sid = student && (student.id || student.sid);
  const base = `${book}/${page}`;

  useEffect(() => { let ok = true; openDoc(book).then(d => ok && setDoc(d)).catch(() => ok && setErr("تعذّر تحميل المرجع. تأكد من الاتصال بالإنترنت ثم أعد المحاولة.")); return () => { ok = false; }; }, [book]);

  // تحميل حل الطالب وتعليق المعلم للصفحة
  useEffect(() => {
    let ok = true; hist.current = []; setEditNote(null);
    setAnn({ s: [], n: [] }); setTc(null); setTcDraft("");
    if (!sid) return;
    Promise.all([api.maGet(`${NB}/${sid}/${base}`), api.maGet(`${NB_TC}/${sid}/${base}`)]).then(([a, t]) => {
      if (!ok) return;
      const A = obj(a);
      setAnn({ s: arr(A.s).map(x => ({ ...x, p: dec(x.p) })), n: arr(A.n) });
      setTc(t && t.t ? t : null); setTcDraft(t && t.t ? t.t : "");
    });
    return () => { ok = false; };
  }, [sid, base]);

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

  // رسم طبقة الحبر
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

  // حفظ مؤجل
  const persist = (next) => {
    if (readOnly || !sid) return;
    clearTimeout(saveT.current); setSaved("جارٍ الحفظ…");
    saveT.current = setTimeout(async () => {
      const empty = !next.s.length && !next.n.length;
      const v = empty ? null : { s: next.s.map(x => ({ k: x.k, c: x.c, p: enc(x.p) })), n: next.n, at: Date.now() };
      const ok = await api.maPut(`${NB}/${sid}/${base}`, v);
      await api.maPut(`${NB_IDX}/${sid}/${base}`, empty ? null : Date.now());
      setSaved(ok === false ? "تعذّر الحفظ – سيُعاد تلقائيًا" : "تم الحفظ ✓"); setTimeout(() => setSaved(""), 1500);
    }, 900);
  };
  const commit = (next) => { hist.current.push(annRef.current); if (hist.current.length > 60) hist.current.shift(); setAnn(next); persist(next); };
  const undo = () => { const p = hist.current.pop(); if (p) { setAnn(p); persist(p); } };
  const clearPage = () => { if (!ann.s.length && !ann.n.length) return; if (!window.confirm("مسح كل ما كتبته في هذه الصفحة؟")) return; commit({ s: [], n: [] }); };

  // أحداث القلم
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
    const v = tcDraft.trim() ? { t: tcDraft.trim(), by: teacherName || "المعلم", at: Date.now() } : null;
    await api.maPut(`${NB_TC}/${sid}/${base}`, v); setTc(v); setSaved("تم حفظ التعليق ✓"); setTimeout(() => setSaved(""), 1500);
  };

  const go = d => setPage(p => Math.min(Math.max(1, p + d), doc ? doc.numPages : B.pages));
  useEffect(() => { window.scrollTo({ top: 0 }); }, [page]);
  useEffect(() => { const k = e => { if (/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return; if (e.key === "ArrowLeft") go(1); if (e.key === "ArrowRight") go(-1); }; window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); });

  const drawingMode = !readOnly && tool !== "view";
  const COLORS = ["#1d4ed8", "#dc2626", "#16a34a", "#111827"];
  const total = doc ? doc.numPages : B.pages;

  return <div style={{ "--c": B.c }}>
    <div className="nb-top" ref={topRef}>
      <button className="nb-b" onClick={onBack}>→ رجوع</button>
      <b>{B.name}{student && student.name ? ` • ${student.name.split(" ").slice(0, 2).join(" ")}` : ""}</b>
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
      <button className={"nb-b" + (tool === "view" ? " on" : "")} onClick={() => setTool("view")}>✋ تصفح</button>
      <button className={"nb-b" + (tool === "pen" ? " on" : "")} onClick={() => setTool("pen")}>✏️ قلم</button>
      {COLORS.map(c => <span key={c} className={"nb-dot" + (tool === "pen" && color === c ? " on" : "")} style={{ background: c }} onClick={() => { setColor(c); setTool("pen"); }} role="button" aria-label="لون" />)}
      <button className={"nb-b" + (tool === "hl" ? " on" : "")} onClick={() => setTool("hl")}>🖍️ تظليل</button>
      <button className={"nb-b" + (tool === "text" ? " on" : "")} onClick={() => setTool("text")}>💬 ملاحظة</button>
      <button className={"nb-b" + (tool === "erase" ? " on" : "")} onClick={() => setTool("erase")}>🧽 ممحاة</button>
      <button className="nb-b" onClick={undo} disabled={!hist.current.length}>↩︎ تراجع</button>
      <button className="nb-b" onClick={clearPage}>🗑️ مسح الصفحة</button>
    </div>}

    {tc && !readOnly && <div className="nb-tc">💬 تعليق {tc.by}: {tc.t}</div>}
    {readOnly && <div className="nb-tc" style={{ background: "#eff6ff", borderColor: "#3b82f6" }}>
      <div style={{ marginBottom: 6 }}>تعليقك على هذه الصفحة للطالب:</div>
      <div style={{ display: "flex", gap: 6 }}>
        <input value={tcDraft} onChange={e => setTcDraft(e.target.value)} placeholder="مثال: أحسنت، راجع السؤال ٣" style={{ flex: 1, border: "1px solid #cbd5e1", borderRadius: 8, padding: 8, font: "inherit" }} />
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

function Library({ api, student, onOpen, onLogout, onBack, readOnly }) {
  const [done, setDone] = useState({});
  useEffect(() => { if (student) api.maGet(`${NB_IDX}/${student.id}`).then(d => setDone(obj(d))); }, [student && student.id]);
  const weekHas = (book, w) => { const B = BOOKS[book], from = B.units[w * 2], to = (w < 14 ? B.units[w * 2 + 2] : B.pages + 1); return Object.keys(obj(done[book])).some(p => +p >= from && +p < to); };
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
    {Object.entries(BOOKS).map(([id, B]) => <div key={id} className="nb-book" style={{ "--c": B.c }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <b style={{ fontSize: 19, color: B.c, flex: 1 }}>{B.name}</b>
        <small style={{ fontWeight: 800, color: "#64748b" }}>{ar(count(id))} صفحة فيها حل</small>
        <button className="nb-b on" onClick={() => onOpen(id, 1)}>افتح المرجع</button>
      </div>
      <div className="nb-weeks">{Array.from({ length: 15 }, (_, w) => <button key={w} className={"nb-wk" + (weekHas(id, w) ? " done" : "")} onClick={() => onOpen(id, B.units[w * 2])} aria-label={`الأسبوع ${w + 1}`}>{ar(w + 1)}</button>)}</div>
      {readOnly && count(id) > 0 && <div style={{ marginTop: 8, fontSize: 13, fontWeight: 700, color: "#475569" }}>الصفحات: {Object.keys(obj(done[id])).sort((a, b) => a - b).map(p => <button key={p} className="nb-wk" style={{ margin: 2, padding: "2px 6px" }} onClick={() => onOpen(id, +p)}>{ar(p)}</button>)}</div>}
    </div>)}
  </div>;
}

// ══════════════════════ بوابة الطالب (#marji) ══════════════════════
export function NafsBooksStudent({ api, onBack }) {
  const [st, setSt] = useState(() => { try { const s = JSON.parse(localStorage.getItem(REMEMBER) || "null"); return s && s.until > Date.now() ? s : null; } catch { return null; } });
  const [open, setOpen] = useState(null);
  const logout = () => { try { localStorage.removeItem(REMEMBER); } catch {} setSt(null); setOpen(null); };
  return <div className="nb"><style>{CSS}</style>
    {!st ? <StudentLogin api={api} onIn={setSt} onBack={onBack} />
      : open ? <BookViewer api={api} book={open.book} startPage={open.page} student={st} onBack={() => setOpen(null)} />
        : <Library api={api} student={st} onOpen={(book, page) => setOpen({ book, page })} onLogout={logout} onBack={onBack} />}
  </div>;
}

// ══════════════════════ صفحة المعلم: متابعة دفاتر الطلاب ══════════════════════
export function NafsBooksTeacher({ api, by }) {
  const [ros, setRos] = useState(null); const [ck, setCk] = useState(""); const [idx, setIdx] = useState({});
  const [st, setSt] = useState(null); const [open, setOpen] = useState(null); const [q, setQ] = useState("");
  useEffect(() => { Promise.all([api.maGet(api.MA_ROSTER), api.maGet(NB_IDX)]).then(([r, i]) => { setRos(obj(r)); setIdx(obj(i)); }); }, []);
  const classes = Object.keys(obj(ros)).filter(k => k.startsWith("3-")).sort((a, b) => +a.split("-")[1] - +b.split("-")[1]);
  const studs = ck ? arr(ros[ck] && ros[ck].students).filter(s => s && s.id && s.name && (!q || s.name.includes(q))) : [];
  const n = s => Object.values(obj(idx[s.id])).reduce((t, b) => t + Object.keys(obj(b)).length, 0);
  return <div className="nb" style={{ minHeight: "auto", background: "transparent" }}><style>{CSS}</style>
    {open ? <BookViewer api={api} book={open.book} startPage={open.page} student={st} readOnly teacherName={by} onBack={() => setOpen(null)} />
      : st ? <Library api={api} student={st} readOnly onOpen={(book, page) => setOpen({ book, page })} onBack={() => setSt(null)} />
        : <div className="nb-home">
          <div className="nb-book" style={{ "--c": "#7c3aed" }}>
            <b style={{ fontSize: 18 }}>📚 مراجع نافس – متابعة حلول طلاب الثالث المتوسط</b>
            <p style={{ margin: "6px 0 10px", color: "#475569", fontWeight: 700, fontSize: 14 }}>رابط الطلاب: <span dir="ltr" style={{ userSelect: "all" }}>{window.location.origin}/#marji</span> — يدخل الطالب برقم هويته ويحل في دفتره الخاص.</p>
            {ros === null ? <div className="nb-msg">جارٍ تحميل الكشوف…</div> : !classes.length ? <div className="nb-msg">لا توجد فصول للثالث المتوسط في الكشوف. أضفها من صفحة الفصول أولًا.</div> :
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{classes.map(c => <button key={c} className={"nb-b" + (ck === c ? " on" : "")} style={{ "--c": "#7c3aed" }} onClick={() => setCk(c)}>{api.maClassName ? api.maClassName(c) : c}</button>)}</div>}
          </div>
          {ck && <div className="nb-book" style={{ "--c": "#7c3aed" }}>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="ابحث باسم الطالب" style={{ width: "100%", border: "1px solid #cbd5e1", borderRadius: 10, padding: 8, font: "inherit", marginBottom: 8 }} />
            <div className="nb-list">{studs.map(s => <div key={s.id} className="nb-row" onClick={() => setSt({ id: s.id, name: s.name, ck })}>
              <span>{s.name}</span><small>{n(s) ? `${ar(n(s))} صفحة محلولة` : "لم يبدأ بعد"}{!s.nh ? " • لم تُربط هويته" : ""}</small></div>)}</div>
          </div>}
        </div>}
  </div>;
}

export default function NafsBooks({ mode = "student", ...p }) {
  return mode === "teacher" ? <NafsBooksTeacher {...p} /> : <NafsBooksStudent {...p} />;
}
