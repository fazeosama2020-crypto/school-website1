// ══════════════════════════════════════════════════════════
// 🗺️ رحلة الكنز: طريقي إلى نافس — الأدوات المشتركة (الطالب + الإدارة)
// قاعدة البيانات:
//   school-tr-cfg            = { open, upTo, onlyG3 }
//   school-tr-prog/{sid}     = { sid, name, ck, n4, unlocked, stars:{n:1..3}, best:{n:{sc,r,m,s,sk,tries,ts}}, start, last }
// ══════════════════════════════════════════════════════════
import React from "react";

export const TR_CFG = "school-tr-cfg";
export const TR_PROG = "school-tr-prog";
export const TR_TOTAL = 20;          // عدد مراحل الرحلة
export const TR_PASS = 10;           // الحد الأدنى لفتح المرحلة التالية (من ١٥)
export const TR_SCHOOL = "مدرسة الأمير عبدالمجيد المتوسطة";

// العوالم الأربعة — كل عالم ٥ مراحل
export const WORLDS = [
  { n: 1, name: "واحة البدايات", icon: "🌴", from: 1, to: 5, c1: "#0f766e", c2: "#14b8a6", soft: "#ccfbf1", sky: "#e6fffa", badge: "🥉", badgeName: "وسام الواحة" },
  { n: 2, name: "صحراء الألغاز", icon: "🐪", from: 6, to: 10, c1: "#c2410c", c2: "#f59e0b", soft: "#ffedd5", sky: "#fff7ed", badge: "🥈", badgeName: "وسام الصحراء" },
  { n: 3, name: "جبال التحدي", icon: "⛰️", from: 11, to: 15, c1: "#5b21b6", c2: "#8b5cf6", soft: "#ede9fe", sky: "#f5f3ff", badge: "🥇", badgeName: "وسام القمة" },
  { n: 4, name: "جزيرة الكنز", icon: "🏝️", from: 16, to: 20, c1: "#1d4ed8", c2: "#06b6d4", soft: "#dbeafe", sky: "#eff6ff", badge: "👑", badgeName: "تاج الكنز" },
];
export const worldOf = n => WORLDS.find(w => n >= w.from && n <= w.to) || WORLDS[0];

// تحميل محتوى العالم عند الحاجة فقط (كل عالم ملف مستقل)
const LOADERS = { 1: () => import("./data/w1.js"), 2: () => import("./w2.js") };
export const READY = 10; // آخر مرحلة جاهز محتواها — يزيد مع إضافة العوالم
export async function loadStage(n) {
  const w = worldOf(n); const L = LOADERS[w.n]; if (!L) return null;
  const m = await L(); return (m.default || []).find(s => s.n === n) || null;
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
  else if (f.t === "info") el = <div className="tr-info">{f.items.map(([ic, v, l], i) => <div key={i}><span>{ic}</span><b>{ar(v)}</b><small>{ar(l)}</small></div>)}</div>;
  return <figure className="tr-fig">{el}{f.cap && <figcaption>{ar(f.cap)}</figcaption>}</figure>;
}

// ── خلط مع بذرة (ترتيب خيارات مختلف في كل محاولة)
export function shuffleIdx(n, seed) { const a = Array.from({ length: n }, (_, i) => i); let s = seed || 1; for (let i = n - 1; i > 0; i--) { s = (s * 9301 + 49297) % 233280; const j = Math.floor(s / 233280 * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
export const starsOf = sc => sc >= 14 ? 3 : sc >= 12 ? 2 : sc >= TR_PASS ? 1 : 0;
export const arr = v => Array.isArray(v) ? v.filter(Boolean) : (v && typeof v === "object" ? Object.values(v).filter(Boolean) : []);
export const obj = v => (v && typeof v === "object" ? v : {});
export const when = ms => { try { const d = new Date(ms); return d.toLocaleDateString("ar-SA-u-ca-islamic-umalqura-nu-arab", { day: "numeric", month: "short" }) + " • " + d.toLocaleTimeString("ar-SA-u-nu-arab", { hour: "2-digit", minute: "2-digit" }); } catch { return ""; } };
export const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } };
export const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
export const trLink = () => { try { return window.location.origin + window.location.pathname + "#treasure"; } catch { return "#treasure"; } };

// ── أصوات قصيرة تُولَّد بالكود (بدون ملفات)
let actx = null;
export function beep(kind) {
  if (lsGet("tr-mute", false)) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const seq = { ok: [[660, .09], [880, .14]], bad: [[220, .16]], win: [[523, .1], [659, .1], [784, .1], [1046, .25]], click: [[440, .04]] }[kind] || [];
    let t = actx.currentTime;
    seq.forEach(([fq, d]) => { const o = actx.createOscillator(), g = actx.createGain(); o.type = kind === "bad" ? "sawtooth" : "triangle"; o.frequency.value = fq; g.gain.setValueAtTime(.12, t); g.gain.exponentialRampToValueAtTime(.001, t + d); o.connect(g); g.connect(actx.destination); o.start(t); o.stop(t + d); t += d * .9; });
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
