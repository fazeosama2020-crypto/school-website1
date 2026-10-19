// ══════════════════════════════════════════════════════════
// 🗺️ رحلة الكنز: طريقي إلى نافس — الأدوات المشتركة (الطالب + الإدارة)
// قاعدة البيانات:
//   school-tr-cfg            = { open, upTo, onlyG3 }
//   school-tr-prog/{sid}     = { sid, name, ck, n4, unlocked, stars:{n:1..3}, best:{n:{sc,r,m,s,sk,tries,ts}}, start, last }
// ══════════════════════════════════════════════════════════
import React from "react";

export const TR_CFG = "school-tr-cfg";
export const TR_PROG = "school-tr-prog";
export const TR_TOTAL = 25;          // عدد مراحل الرحلة
export const TR_PASS = 10;           // حد العبور القديم (من ١٥) — للسجلات السابقة
// حد العبور = ثلثا أسئلة المرحلة (١٤ من ٢١ • ١٠ من ١٥)
export const passOf = of => Math.ceil((+of || 15) * 2 / 3);
export const isPassed = b => !!b && (+b.sc || 0) >= passOf(b.of || 15);
export const TR_SCHOOL = "مدرسة الأمير عبدالمجيد المتوسطة";

// العوالم الخمسة — كل عالم ٥ مراحل
export const WORLDS = [
  { n: 1, name: "واحة البدايات", icon: "🌴", from: 1, to: 5, c1: "#0f766e", c2: "#14b8a6", soft: "#ccfbf1", sky: "#e6fffa", badge: "🥉", badgeName: "وسام الواحة" },
  { n: 2, name: "صحراء الألغاز", icon: "🐪", from: 6, to: 10, c1: "#c2410c", c2: "#f59e0b", soft: "#ffedd5", sky: "#fff7ed", badge: "🥈", badgeName: "وسام الصحراء" },
  { n: 3, name: "جبال التحدي", icon: "⛰️", from: 11, to: 15, c1: "#5b21b6", c2: "#8b5cf6", soft: "#ede9fe", sky: "#f5f3ff", badge: "🥇", badgeName: "وسام القمة" },
  { n: 4, name: "مدينة المستقبل", icon: "🏙️", from: 16, to: 20, c1: "#0f172a", c2: "#6366f1", soft: "#e0e7ff", sky: "#eef2ff", badge: "💎", badgeName: "وسام المستقبل" },
  { n: 5, name: "جزيرة الكنز", icon: "🏝️", from: 21, to: 25, c1: "#1d4ed8", c2: "#06b6d4", soft: "#dbeafe", sky: "#eff6ff", badge: "👑", badgeName: "تاج الكنز" },
];
export const worldOf = n => WORLDS.find(w => n >= w.from && n <= w.to) || WORLDS[0];

// تحميل محتوى العالم عند الحاجة فقط (كل عالم ملف مستقل)
const LOADERS = { 1: () => import("./data/w1.js"), 2: () => import("./w2.js"), 3: () => import("./w3.js"), 4: () => import("./w4.js"), 5: () => import("./w5.js") };
// أسئلة إضافية (السؤالان السادس والسابع لكل مادة) لمراحل العوالم ١ و٢ و٣ و٥ (العالم الرابع مكتوب بسبعة أسئلة أصلاً)
const EXTRA = { 1: () => import("./x1.js"), 2: () => import("./x2.js"), 3: () => import("./x3.js"), 5: () => import("./x5.js") };
async function loadWorld(n) {
  const [m, x] = await Promise.all([LOADERS[n](), EXTRA[n] ? EXTRA[n]() : Promise.resolve(null)]);
  const X = (x && x.default) || {};
  return (m.default || []).map(s => { const e = X[s.n]; return e ? { ...s, read: { ...s.read, qs: [...s.read.qs, ...(e.r || [])] }, math: [...s.math, ...(e.m || [])], sci: [...s.sci, ...(e.s || [])] } : s; });
}
export const READY = 25; // جميع المراحل جاهزة
// 👨‍🏫 وضع الشرح للمعلم: بصمات (SHA-256) لا أرقام هوية صريحة — تضاف هويات أخرى من إعدادات لوحة المتابعة
export const DEMO_H = ["bbaadbd6d39b9b341ef4e24820e3a21638c819788ec72a0a5760573a3c938e82"];
// تحميل كل المراحل (لخريطة نواتج التعلم في لوحة المتابعة)
export async function loadAllStages() { const ms = await Promise.all(Object.keys(LOADERS).map(k => loadWorld(+k))); return ms.flat().sort((x, y) => x.n - y.n); }
export async function loadStage(n) {
  const w = worldOf(n); const L = LOADERS[w.n]; if (!L) return null;
  const L2 = await loadWorld(w.n); return L2.find(s => s.n === n) || null;
}

// المهارات (مأخوذة من نواتج التعلم في نافس للصف الثالث المتوسط)
export const SKILLS = {
  R1: "معاني المفردات من السياق", R2: "الفكرة الرئيسة والأفكار الفرعية", R3: "الاستنتاج والأفكار الضمنية",
  R4: "العلاقات والروابط في النص", R5: "بنية النص ونوعه وغرض الكاتب", R6: "التمييز بين الحقيقة والرأي",
  R7: "التقويم وإبداء الرأي وتوظيف النص", R8: "قراءة البيانات في النص المعلوماتي",
  M1: "الأعداد الحقيقية والعمليات", M2: "النسبة والتناسب والنسبة المئوية", M3: "المعادلات والمتباينات",
  M4: "الدوال والمتتابعات والميل", M5: "القوى وكثيرات الحدود", M6: "الهندسة والقياس",
  M7: "الإحصاء والاحتمال", M8: "أنظمة المعادلات الخطية",
  S1: "طبيعة العلم والاستقصاء", S2: "تركيب المادة والذرة", S3: "التفاعلات والتغيرات الكيميائية",
  S4: "القوة والحركة والطاقة", S5: "الكهرباء والموجات", S6: "علوم الحياة",
  S7: "الأرض والفضاء", S8: "البيئة والأنظمة البيئية",
};
export const SUBJ = {
  r: { name: "القراءة", icon: "📖", c: "#be123c", soft: "#ffe4e6", gate: "ممر الحكمة" },
  m: { name: "الرياضيات", icon: "🔢", c: "#1d4ed8", soft: "#dbeafe", gate: "ممر الأرقام" },
  s: { name: "العلوم", icon: "🔬", c: "#047857", soft: "#d1fae5", gate: "ممر الاكتشاف" },
};
export const LEVELS = { 1: "معرفة", 2: "تطبيق", 3: "استدلال" };

// 🧠 مهارات التفكير العليا — تظهر مع كل سؤال كداعم ومحفّز
export const HOTS = {
  an: { ic: "🔍", n: "التحليل", d: "تفكيك المعطيات واكتشاف العلاقات بينها" },
  in: { ic: "💡", n: "الاستنتاج", d: "الوصول إلى ما لم يُذكر صراحةً اعتماداً على الأدلة" },
  ev: { ic: "⚖️", n: "التقويم وإصدار الحكم", d: "الحكم على فكرة أو حل بمعايير واضحة واختيار الأفضل" },
  cr: { ic: "🧐", n: "التفكير الناقد", d: "التمييز بين الحقيقة والرأي وفحص قوة الدليل" },
  ps: { ic: "🧩", n: "حل المشكلات", d: "تحويل الموقف إلى خطوات واختيار الاستراتيجية المناسبة" },
  cm: { ic: "🔀", n: "المقارنة والتصنيف", d: "إيجاد أوجه الشبه والاختلاف وتجميع ما يتشابه" },
  ex: { ic: "🔬", n: "التفسير العلمي", d: "ربط الظاهرة بسببها العلمي" },
  pr: { ic: "🔮", n: "التنبؤ", d: "توقّع النتيجة اعتماداً على قاعدة أو نمط" },
  tr: { ic: "🔁", n: "النقل والتطبيق", d: "استعمال القاعدة في موقف جديد من الحياة" },
  sy: { ic: "🧱", n: "التركيب", d: "جمع أكثر من فكرة أو خطوة لبناء حل متكامل" },
  dt: { ic: "📊", n: "تفسير البيانات", d: "قراءة الجداول والرسوم واستخلاص النتائج منها" },
};
// المهارة المصرَّح بها في السؤال، وإلا تُستنتج من المهارة والمستوى (لأسئلة العالم الأول)
export function hotsOf(q, sub) {
  if (!q) return null; if (q.ht) return HOTS[q.ht] ? q.ht : null;
  const k = String(q.k || ""), lv = +q.lv || 1, f = q.fig && (q.fig.t === "line" || q.fig.t === "bars" || q.fig.t === "table");
  if (k[0] === "R") return { R2: "an", R3: "in", R4: "an", R5: "an", R6: "cr", R7: "ev", R8: "dt" }[k] || (lv >= 2 ? "an" : null);
  if (k[0] === "M") return f ? "dt" : lv >= 3 ? "ps" : lv === 2 ? "tr" : null;
  if (k[0] === "S") return f ? "dt" : k === "S1" ? "an" : lv >= 3 ? "ex" : lv === 2 ? "tr" : null;
  return null;
}

// ── أرقام عربية: ٣٫٦ • ٢٥٪
export const ar = v => String(v ?? "")
  .replace(/(\d)\.(\d)/g, "$1٫$2").replace(/%/g, "٪")
  .replace(/\d/g, d => "٠١٢٣٤٥٦٧٨٩"[d]);
const arSvg = b => String(b).replace(/>([^<>]+)</g, (m, t) => ">" + ar(t) + "<");

// ── نص منسّق: {{أ|ب}} كسر • [[كلمة]] تمييز • **غامق** • سطر جديد \n
export function Rich({ t, style }) {
  const parts = String(t ?? "").split(/(\{\{[^}]+\}\}|\[\[[^\]]+\]\]|\*\*[^*]+\*\*|\n)/g);
  return <span style={style}>{parts.map((p, i) => {
    if (!p) return null;
    if (p === "\n") return <br key={i} />;
    if (p.startsWith("{{")) { const [a, b] = p.slice(2, -2).split("|"); return <span key={i} className="tr-frac"><span>{ar(a)}</span><span>{ar(b)}</span></span>; }
    if (p.startsWith("[[")) return <mark key={i} className="tr-mark">{ar(p.slice(2, -2))}</mark>;
    if (p.startsWith("**")) return <b key={i}>{ar(p.slice(2, -2))}</b>;
    // الجذور (√50 ، √(36 + 64)) تُعزل باتجاه يسار←يمين حتى لا ينقلب ترتيبها داخل النص العربي
    if (p.includes("√")) return <React.Fragment key={i}>{p.split(/(√(?:\([^)]*\)|[\d.]+))/g).map((x, j) => x.startsWith("√") ? <span key={j} dir="ltr" style={{ unicodeBidi: "isolate", whiteSpace: "nowrap" }}>{ar(x)}</span> : ar(x))}</React.Fragment>;
    return <React.Fragment key={i}>{ar(p)}</React.Fragment>;
  })}</span>;
}

// ══════════ الرسومات (SVG خفيفة تُرسم بالكود) ══════════
const INK = "#1e293b", GRID = "#cbd5e1", AX = "#334155";
const PAL = ["#2563eb", "#dc2626", "#059669", "#d97706", "#7c3aed"];

function Plane({ f }) {
  const [a, b] = f.range || [-5, 5]; const n = b - a; const S = 240, p = 16, u = (S - 2 * p) / n;
  const X = x => p + (x - a) * u, Y = y => S - p - (y - a) * u;
  const g = [];
  for (let i = a; i <= b; i++) { g.push(<line key={"v" + i} x1={X(i)} y1={Y(a)} x2={X(i)} y2={Y(b)} stroke={GRID} strokeWidth={i === 0 ? 0 : 1} />); g.push(<line key={"h" + i} x1={X(a)} y1={Y(i)} x2={X(b)} y2={Y(i)} stroke={GRID} strokeWidth={i === 0 ? 0 : 1} />); }
  const lines = (f.lines || []).map((l, i) => { const c = l.c || PAL[i % 5]; const y1 = l.m * a + l.b, y2 = l.m * b + l.b; return l.v !== undefined ? <line key={"l" + i} x1={X(l.v)} y1={Y(a)} x2={X(l.v)} y2={Y(b)} stroke={c} strokeWidth="2.5" /> : <line key={"l" + i} x1={X(a)} y1={Y(y1)} x2={X(b)} y2={Y(y2)} stroke={c} strokeWidth="2.5" />; });
  const segs = (f.seg || []).map((s, i) => <polyline key={"s" + i} points={s.pts.map(([x, y]) => X(x) + "," + Y(y)).join(" ")} fill={s.fill || "none"} fillOpacity=".18" stroke={s.c || PAL[i % 5]} strokeWidth="2.5" />);
  const pts = (f.pts || []).map(([x, y, lb, c], i) => <g key={"p" + i}><circle cx={X(x)} cy={Y(y)} r="4.5" fill={c || "#dc2626"} />{lb && <text x={X(x) + 6} y={Y(y) < 24 ? Y(y) + 18 : Y(y) - 6} fontSize="13" fontWeight="800" fill={INK}>{ar(lb).replace(/،\s*/g, "\u200E، \u200E")}</text>}</g>);
  const ticks = []; for (let i = a; i <= b; i += f.step || 1) if (i) { ticks.push(<text key={"tx" + i} x={X(i)} y={Y(0) + 13} fontSize="9" textAnchor="middle" fill="#64748b">{ar(i < 0 ? "-" + -i : i)}</text>); ticks.push(<text key={"ty" + i} x={X(0) - 4} y={Y(i) + 3} fontSize="9" textAnchor="end" fill="#64748b">{ar(i < 0 ? "-" + -i : i)}</text>); }
  const cid = "trc" + Math.random().toString(36).slice(2, 7);
  return <svg viewBox={`0 0 ${S} ${S}`} className="tr-svg" style={{ maxWidth: f.w || 250 }} direction="ltr">
    <defs><clipPath id={cid}><rect x={X(a)} y={Y(b)} width={X(b) - X(a)} height={Y(a) - Y(b)} /></clipPath></defs>
    <rect width={S} height={S} rx="10" fill="#fff" />{g}
    <line x1={X(a)} y1={Y(0)} x2={X(b)} y2={Y(0)} stroke={AX} strokeWidth="1.6" /><line x1={X(0)} y1={Y(a)} x2={X(0)} y2={Y(b)} stroke={AX} strokeWidth="1.6" />
    <text x={X(b) - 4} y={Y(0) - 5} fontSize="12" fontWeight="800" fill={AX}>{f.xl || "س"}</text><text x={X(0) + 5} y={Y(b) + 10} fontSize="12" fontWeight="800" fill={AX}>{f.yl || "ص"}</text>
    {ticks}<g clipPath={`url(#${cid})`}>{segs}{lines}</g>{pts}
  </svg>;
}

function Bars({ f }) {
  const W = 320, H = 200, p = 30, n = f.vals.length, mx = f.max || Math.max(...f.vals) * 1.15, bw = (W - 2 * p) / n;
  const steps = f.ticks || 4;
  return <svg viewBox={`0 0 ${W} ${H + 24}`} className="tr-svg" style={{ maxWidth: 360 }}>
    <rect width={W} height={H + 24} rx="10" fill="#fff" />
    {f.title && <text x={W / 2} y="16" fontSize="12" fontWeight="800" textAnchor="middle" fill={INK}>{ar(f.title)}</text>}
    {Array.from({ length: steps + 1 }, (_, i) => { const v = mx / steps * i, y = H - (v / mx) * (H - 40); return <g key={i}><line x1={p} x2={W - 8} y1={y} y2={y} stroke="#e2e8f0" /><text x={p - 4} y={y + 3} fontSize="9" textAnchor="end" fill="#64748b">{ar(Math.round(v * 10) / 10)}</text></g>; })}
    {f.vals.map((v, i) => { const h = (v / mx) * (H - 40), x = W - p - (i + 1) * bw + bw * .18; return <g key={i}>
      <rect x={x} y={H - h} width={bw * .64} height={h} rx="4" fill={(f.colors && f.colors[i]) || PAL[0]} />
      {f.show !== false && <text x={x + bw * .32} y={H - h - 4} fontSize="10" fontWeight="800" textAnchor="middle" fill={INK}>{ar(v)}</text>}
      <text x={x + bw * .32} y={H + 14} fontSize="10.5" fontWeight="700" textAnchor="middle" fill={INK}>{ar(f.labels[i])}</text></g>; })}
    <line x1={p} x2={W - 8} y1={H} y2={H} stroke={AX} />
  </svg>;
}

function LineChart({ f }) {
  const W = 320, H = 200, p = 32, n = f.vals.length, mn = f.min ?? 0, mx = f.max || Math.max(...f.vals) * 1.15;
  const X = i => p + 6 + i * ((W - 2 * p - 6) / (n - 1)), Y = v => H - ((v - mn) / (mx - mn)) * (H - 40);
  return <svg viewBox={`0 0 ${W} ${H + 24}`} className="tr-svg" style={{ maxWidth: 360 }} direction="ltr">
    <rect width={W} height={H + 24} rx="10" fill="#fff" />
    {f.title && <text x={W / 2} y="16" fontSize="12" fontWeight="800" textAnchor="middle" fill={INK}>{ar(f.title)}</text>}
    {[0, 1, 2, 3, 4].map(i => { const v = mn + (mx - mn) / 4 * i; return <g key={i}><line x1={p} x2={W - p + 6} y1={Y(v)} y2={Y(v)} stroke="#e2e8f0" /><text x={p - 3} y={Y(v) + 3} fontSize="9" textAnchor="end" fill="#64748b">{ar(Math.round(v))}</text></g>; })}
    <polyline points={f.vals.map((v, i) => X(i) + "," + Y(v)).join(" ")} fill="none" stroke={PAL[1]} strokeWidth="2.5" />
    {f.vals.map((v, i) => <g key={i}><circle cx={X(i)} cy={Y(v)} r="4" fill={PAL[1]} />{f.show !== false && <text x={X(i)} y={Y(v) - 8} fontSize="10" fontWeight="800" textAnchor="middle" fill={INK}>{ar(v)}</text>}<text x={X(i)} y={H + 14} fontSize="10" textAnchor="middle" fontWeight="700" fill={INK}>{ar(f.labels[i])}</text></g>)}
  </svg>;
}

function NumLine({ f }) {
  const W = 320, p = 18, [a, b] = [f.from, f.to], X = x => p + (x - a) * ((W - 2 * p) / (b - a));
  const ray = f.ray; const items = [];
  for (let i = a; i <= b; i++) items.push(<g key={i}><line x1={X(i)} x2={X(i)} y1="34" y2="46" stroke={AX} /><text x={X(i)} y="62" fontSize="11" textAnchor="middle" fill={INK}>{ar(i < 0 ? "-" + -i : i)}</text></g>);
  return <svg viewBox={`0 0 ${W} 72`} className="tr-svg" style={{ maxWidth: 360 }} direction="ltr">
    <rect width={W} height="72" rx="10" fill="#fff" />
    <line x1={p - 8} x2={W - p + 8} y1="40" y2="40" stroke={AX} strokeWidth="1.6" />{items}
    {ray && <line x1={X(ray.x)} x2={ray.dir > 0 ? X(b) + 8 : X(a) - 8} y1="40" y2="40" stroke="#dc2626" strokeWidth="5" strokeLinecap="round" />}
    {f.seg && <line x1={X(f.seg[0])} x2={X(f.seg[1])} y1="40" y2="40" stroke="#dc2626" strokeWidth="5" />}
    {(f.dots || []).map(([x, open, lb], i) => <g key={i}><circle cx={X(x)} cy="40" r="6" fill={open ? "#fff" : "#dc2626"} stroke="#dc2626" strokeWidth="2.5" />{lb && <text x={X(x)} y="22" fontSize="14" fontWeight="900" textAnchor="middle" fill="#1d4ed8">{lb}</text>}</g>)}
  </svg>;
}

function Table({ f }) {
  return <div className="tr-tbl-wrap"><table className="tr-tbl">
    {f.title && <caption>{ar(f.title)}</caption>}
    <thead><tr>{f.head.map((h, i) => <th key={i}><Rich t={h} /></th>)}</tr></thead>
    <tbody>{f.rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}><Rich t={c} /></td>)}</tr>)}</tbody>
  </table></div>;
}

export function Fig({ f }) {
  if (!f) return null;
  if (Array.isArray(f)) return <div className="tr-figs">{f.map((x, i) => <Fig key={i} f={x} />)}</div>;
  let el = null;
  if (f.t === "plane") el = <Plane f={f} />;
  else if (f.t === "bars") el = <Bars f={f} />;
  else if (f.t === "line") el = <LineChart f={f} />;
  else if (f.t === "nline") el = <NumLine f={f} />;
  else if (f.t === "table") el = <Table f={f} />;
  else if (f.t === "svg") el = <svg viewBox={`0 0 ${f.w || 300} ${f.h || 180}`} className="tr-svg" direction="ltr" style={{ maxWidth: f.max || 340 }} dangerouslySetInnerHTML={{ __html: `<rect width="${f.w || 300}" height="${f.h || 180}" rx="10" fill="#fff"/>` + arSvg(f.body) }} />;
  else if (f.t === "scene") el = <div className="tr-scene">{f.items.map((it, i) => Array.isArray(it) ? <div key={i} className="tr-sc-it"><span>{it[0]}</span>{it[1] && <small>{ar(it[1])}</small>}</div> : <b key={i} className="tr-sc-op">{it}</b>)}</div>;
  else if (f.t === "info") el = <div className="tr-info">{f.items.map(([ic, v, l], i) => <div key={i}><span>{ic}</span><b>{ar(v)}</b><small>{ar(l)}</small></div>)}</div>;
  return <figure className="tr-fig">{el}{f.cap && <figcaption>{ar(f.cap)}</figcaption>}</figure>;
}

// ── خلط مع بذرة (ترتيب خيارات مختلف في كل محاولة)
export function shuffleIdx(n, seed) { const a = Array.from({ length: n }, (_, i) => i); let s = seed || 1; for (let i = n - 1; i > 0; i--) { s = (s * 9301 + 49297) % 233280; const j = Math.floor(s / 233280 * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
export const starsOf = (sc, of = 15) => sc >= Math.ceil(of * .93) ? 3 : sc >= Math.ceil(of * .8) ? 2 : sc >= passOf(of) ? 1 : 0;
export const arr = v => Array.isArray(v) ? v.filter(Boolean) : (v && typeof v === "object" ? Object.values(v).filter(Boolean) : []);
export const obj = v => (v && typeof v === "object" ? v : {});
export const when = ms => { try { const d = new Date(ms); return d.toLocaleDateString("ar-SA-u-ca-islamic-umalqura-nu-arab", { day: "numeric", month: "short" }) + " • " + d.toLocaleTimeString("ar-SA-u-nu-arab", { hour: "2-digit", minute: "2-digit" }); } catch { return ""; } };
export const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } };
export const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
export const trLink = () => { try { return window.location.origin + window.location.pathname + "#treasure"; } catch { return "#treasure"; } };

// ── أصوات قصيرة تُولَّد بالكود (بدون ملفات)
// 🔊 مؤثرات صوتية مُولَّدة بالكود (بلا ملفات) — تُكتم من زر الصوت
let actx;
function tone(f, d, { type = "triangle", vol = .12, at = 0, to = 0 } = {}) {
  const t = actx.currentTime + at, o = actx.createOscillator(), g = actx.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t); if (to) o.frequency.exponentialRampToValueAtTime(to, t + d);
  g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + .012); g.gain.exponentialRampToValueAtTime(.0001, t + d);
  o.connect(g); g.connect(actx.destination); o.start(t); o.stop(t + d + .02);
}
function whoosh(d = .45, at = 0, up = true) {
  const t = actx.currentTime + at, n = Math.floor(actx.sampleRate * d), b = actx.createBuffer(1, n, actx.sampleRate), x = b.getChannelData(0);
  for (let i = 0; i < n; i++) x[i] = Math.random() * 2 - 1;
  const src = actx.createBufferSource(), f = actx.createBiquadFilter(), g = actx.createGain(); src.buffer = b; f.type = "bandpass"; f.Q.value = 1.4;
  f.frequency.setValueAtTime(up ? 300 : 2400, t); f.frequency.exponentialRampToValueAtTime(up ? 2600 : 260, t + d);
  g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.16, t + d * .3); g.gain.exponentialRampToValueAtTime(.0001, t + d);
  src.connect(f); f.connect(g); g.connect(actx.destination); src.start(t); src.stop(t + d);
}
export function beep(kind, lvl = 0) {
  if (lsGet("tr-mute", false)) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)(); if (actx.state === "suspended") actx.resume();
    const N = [523, 587, 659, 784, 880, 1047, 1175, 1319, 1568];
    switch (kind) {
      case "click": tone(520, .05, { vol: .06 }); break;
      case "ok": tone(988, .09, { type: "sine", vol: .13 }); tone(1319, .28, { type: "sine", vol: .13, at: .08 }); tone(2637, .12, { type: "sine", vol: .03, at: .1 }); break; // رنين عملة
      case "streak": { const b = Math.min(lvl, 5); [0, 2, 4].forEach((k, j) => tone(N[k + b] || 1568, .12, { vol: .1, at: j * .07 })); tone((N[4 + b] || 1568) * 2, .3, { type: "sine", vol: .05, at: .22 }); break; }
      case "bad": tone(330, .16, { vol: .09, to: 220 }); tone(247, .22, { vol: .07, at: .13, to: 165 }); break; // نغمة لطيفة غير مُحبِطة
      case "twin": tone(659, .08, { vol: .1 }); tone(784, .08, { vol: .1, at: .07 }); tone(1047, .22, { type: "sine", vol: .1, at: .14 }); break;
      case "hint": tone(880, .1, { type: "sine", vol: .07 }); tone(1175, .18, { type: "sine", vol: .06, at: .09 }); break;
      case "gate": whoosh(.5); tone(392, .12, { vol: .07, at: .3 }); tone(523, .25, { vol: .08, at: .4 }); break;
      case "key": [784, 988, 1175, 1568].forEach((f, j) => tone(f, .16, { vol: .1, at: j * .09 })); tone(2093, .45, { type: "sine", vol: .06, at: .38 }); break;
      case "start": whoosh(.6, 0, true); [392, 523, 659, 784].forEach((f, j) => tone(f, .18, { vol: .1, at: .25 + j * .12 })); tone(1047, .5, { vol: .1, at: .75 }); break;
      case "drum": for (let j = 0; j < 10; j++) tone(110 + j * 6, .06, { type: "square", vol: .035, at: j * .06 }); break;
      case "star": tone(1319 + lvl * 220, .22, { type: "sine", vol: .1 }); tone(2637 + lvl * 440, .15, { type: "sine", vol: .03, at: .05 }); break;
      case "win": [523, 659, 784, 1047].forEach((f, j) => tone(f, .14, { vol: .11, at: j * .11 })); [784, 1047, 1319].forEach(f => tone(f, .7, { vol: .07, at: .5 })); break;
      case "pop": tone(900, .05, { type: "square", vol: .05, to: 300 }); whoosh(.08, 0, false); break;
      case "fireworks": for (let j = 0; j < 4; j++) { const at = j * .42; tone(500 + j * 90, .32, { type: "sine", vol: .045, at, to: 1700 + j * 120 }); whoosh(.38, at + .3, false); tone(90, .25, { type: "triangle", vol: .12, at: at + .3, to: 45 }); for (let k = 0; k < 4; k++) tone(1800 + k * 400 + j * 150, .07, { type: "sine", vol: .025, at: at + .38 + k * .05 }); } break;
      case "lose": tone(392, .2, { vol: .08 }); tone(349, .2, { vol: .08, at: .18 }); tone(392, .4, { vol: .08, at: .36 }); break;
      default: break;
    }
  } catch {}
}

// ══════════ الأنماط ══════════
export const FONT_LINK = "https://fonts.googleapis.com/css2?family=Lalezar&family=Tajawal:wght@400;500;700;800;900&display=swap";
export function useFonts() {
  React.useEffect(() => { if (document.getElementById("tr-fonts")) return; const l = document.createElement("link"); l.id = "tr-fonts"; l.rel = "stylesheet"; l.href = FONT_LINK; document.head.appendChild(l); }, []);
}
export const BASE_CSS = `
.tr-root{--ink:#1c1917;--muted:#78716c;--gold:#f59e0b;--gold2:#fbbf24;--paper:#fdf6e3;--night:#0c1a2b;font-family:Tajawal,system-ui,sans-serif;color:var(--ink);direction:rtl;-webkit-tap-highlight-color:transparent}
.tr-root *{box-sizing:border-box}
.tr-root button{font-family:inherit;cursor:pointer}
.tr-disp{font-family:Lalezar,Tajawal,sans-serif;font-weight:400;letter-spacing:.2px}
.tr-frac{display:inline-flex;flex-direction:column;vertical-align:middle;text-align:center;line-height:1.05;margin:0 3px;font-size:.92em}
.tr-frac span:first-child{border-bottom:1.5px solid currentColor;padding:0 3px}
.tr-mark{background:#fef08a;padding:0 3px;border-radius:4px;color:inherit}
.tr-fig{margin:10px 0;display:flex;flex-direction:column;align-items:center;gap:4px}
.tr-figs{display:flex;flex-wrap:wrap;gap:10px;justify-content:center}
.tr-scene{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:8px;background:linear-gradient(135deg,#fff7ed,#f0f9ff);border:1.5px dashed #fbbf24;border-radius:18px;padding:12px 10px;max-width:420px}
.tr-sc-it{display:flex;flex-direction:column;align-items:center;gap:2px;background:#fff;border-radius:14px;padding:8px 10px;min-width:70px;box-shadow:0 3px 10px rgba(0,0,0,.06)}
.tr-sc-it span{font-size:38px;line-height:1.1}.tr-sc-it small{font-size:12px;font-weight:800;color:#57534e;text-align:center;max-width:110px;line-height:1.4}
.tr-sc-op{font-size:24px;color:#d97706;font-weight:900}
.tr-fig figcaption{font-size:12px;color:var(--muted);font-weight:700}
.tr-svg{width:100%;height:auto;border:1px solid #e7e5e4;border-radius:10px;display:block}
.tr-tbl-wrap{max-width:100%;overflow-x:auto}
.tr-tbl{border-collapse:collapse;font-size:14px;background:#fff;border-radius:10px;overflow:hidden;min-width:220px}
.tr-tbl caption{font-weight:800;font-size:13px;padding:4px;color:var(--muted)}
.tr-tbl th{background:#334155;color:#fff;padding:7px 10px;font-weight:800}
.tr-tbl td{border:1px solid #e2e8f0;padding:6px 10px;text-align:center;font-weight:700}
.tr-tbl tr:nth-child(even) td{background:#f8fafc}
.tr-info{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;width:100%}
.tr-info>div{background:linear-gradient(160deg,#1e293b,#334155);color:#fff;border-radius:12px;padding:10px;text-align:center;display:flex;flex-direction:column;gap:2px}
.tr-info span{font-size:22px}.tr-info b{font-size:19px;color:#fcd34d}.tr-info small{font-size:12px;opacity:.9;font-weight:700}
`;
