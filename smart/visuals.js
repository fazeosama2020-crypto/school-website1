// 🎨 الرسوم التوضيحية لـ«درسي الذكي»: الذكاء يختار نوع الرسم وبياناته، والموقع يرسمه SVG بدقة وألوان موحّدة
// الأنواع: map خريطة مفاهيم • steps خطوات • balance ميزان • line خط أعداد • graph مستوى إحداثي • compare مقارنة • analogy تشبيه • bars أعمدة
const ar = n => String(n ?? "").replace(/\d/g, d => "٠١٢٣٤٥٦٧٨٩"[d]).replace(/-/g, "−");
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const A = v => Array.isArray(v) ? v.filter(Boolean) : [];
const N = v => (v === null || v === undefined || v === "" || isNaN(+v)) ? null : +v;
export const VFONT = "'Baloo Bhaijaan 2','Tajawal',Cairo,Tahoma,sans-serif";
const C = ["#1e3a8a", "#0f766e", "#c2410c", "#7c3aed", "#be185d", "#0e7490", "#a16207"];
const L = ["#dbeafe", "#ccfbf1", "#ffedd5", "#ede9fe", "#fce7f3", "#cffafe", "#fef3c7"];
// تقسيم النص على أسطر
function wrap(t, n) { const w = String(t || "").split(/\s+/); const out = []; let cur = ""; w.forEach(x => { if ((cur + " " + x).trim().length > n && cur) { out.push(cur); cur = x; } else cur = (cur + " " + x).trim(); }); if (cur) out.push(cur); return out; }
function txt(x, y, t, o = {}) {
  const lines = o.n ? wrap(t, o.n) : [String(t ?? "")]; const fs = o.fs || 16, lh = o.lh || fs * 1.35; const y0 = y - (lines.length - 1) * lh / 2;
  return `<text x="${x}" y="${y0}" text-anchor="${o.a || "middle"}" dominant-baseline="middle" direction="${o.ltr ? "ltr" : "rtl"}" font-size="${fs}" font-weight="${o.w || 700}" fill="${o.c || "#0f172a"}">${lines.map((l, i) => `<tspan x="${x}" y="${y0 + i * lh}">${esc(l)}</tspan>`).join("")}</text>`;
}
let UID = 0;
const svg = (w, h, body) => { const u = "v" + (++UID); body = body.replace(/url\(#(ah2?|mg|gc)\)/g, `url(#$1${u})`).replace(/id="(mg|gc)"/g, `id="$1${u}"`); return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" font-family="${VFONT}" style="width:100%;height:auto;display:block"><defs><marker id="ah${u}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#64748b"/></marker><marker id="ah2${u}" viewBox="0 0 10 10" refX="5" refY="5" markerUnits="userSpaceOnUse" markerWidth="20" markerHeight="20" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="context-stroke"/></marker></defs>${body}</svg>`; };

function map(v) {
  const it = A(v.items).slice(0, 6), W = 680, H = 380, cx = W / 2, cy = H / 2; let s = "";
  const pos = it.map((_, i) => { const a = -Math.PI / 2 + i * 2 * Math.PI / it.length; return [cx + Math.cos(a) * 245, cy + Math.sin(a) * 135]; });
  pos.forEach(([x, y], i) => { s += `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="${C[i % 7]}" stroke-width="3" stroke-dasharray="2 6" stroke-linecap="round"/>`; });
  s += `<ellipse cx="${cx}" cy="${cy}" rx="105" ry="50" fill="url(#mg)"/><defs><linearGradient id="mg" x1="0" x2="1"><stop offset="0" stop-color="#1e3a8a"/><stop offset="1" stop-color="#0f766e"/></linearGradient></defs>` + txt(cx, cy, v.center || v.t, { n: 14, fs: 19, w: 800, c: "#fff" });
  it.forEach((x, i) => { const [px, py] = pos[i]; const hgt = x.d ? 72 : 48; s += `<rect x="${px - 95}" y="${py - hgt / 2}" width="190" height="${hgt}" rx="16" fill="${L[i % 7]}" stroke="${C[i % 7]}" stroke-width="2"/>` + txt(px, py - (x.d ? 14 : 0), x.t, { n: 18, fs: 15.5, w: 800, c: C[i % 7] }) + (x.d ? txt(px, py + 16, x.d, { n: 26, fs: 12.5, w: 600, c: "#334155", lh: 15 }) : ""); });
  return svg(W, H, s);
}
function steps(v) {
  const it = A(v.items).slice(0, 6), n = it.length || 1, per = n > 3 ? Math.ceil(n / 2) : n, rows = Math.ceil(n / per), W = 680, bw = (W - 40 - (per - 1) * 34) / per, bh = 120, H = rows * (bh + 30) + 10; let s = "";
  it.forEach((x, i) => {
    const r = Math.floor(i / per), c = i % per, X = W - 20 - c * (bw + 34) - bw, Y = 15 + r * (bh + 30);
    s += `<rect x="${X}" y="${Y}" width="${bw}" height="${bh}" rx="18" fill="${L[i % 7]}" stroke="${C[i % 7]}" stroke-width="2"/><circle cx="${X + bw - 22}" cy="${Y + 22}" r="15" fill="${C[i % 7]}"/>` + txt(X + bw - 22, Y + 23, ar(i + 1), { fs: 15, w: 800, c: "#fff" })
      + txt(X + bw / 2, Y + 50, x.t, { n: Math.max(10, bw / 9 | 0), fs: 15.5, w: 800, c: C[i % 7] }) + (x.d ? txt(X + bw / 2, Y + 92, x.d, { n: Math.max(12, bw / 7.5 | 0), fs: 12.5, w: 600, c: "#334155", lh: 15 }) : "");
    if (c < per - 1 && i < n - 1) s += `<line x1="${X - 4}" y1="${Y + bh / 2}" x2="${X - 28}" y2="${Y + bh / 2}" stroke="#64748b" stroke-width="3" marker-end="url(#ah)"/>`;
  });
  return svg(W, H, s);
}
function balance(v) {
  const W = 680, H = 330; let s = `<rect x="300" y="285" width="80" height="16" rx="6" fill="#475569"/><path d="M340 95 L318 285 L362 285Z" fill="#64748b"/><rect x="110" y="88" width="460" height="12" rx="6" fill="#334155"/><circle cx="340" cy="94" r="12" fill="#c9a227"/>`;
  [[170, v.left, 0], [510, v.right, 1]].forEach(([x, t, i]) => { s += `<line x1="${x}" y1="100" x2="${x - 70}" y2="185" stroke="#94a3b8" stroke-width="2"/><line x1="${x}" y1="100" x2="${x + 70}" y2="185" stroke="#94a3b8" stroke-width="2"/><path d="M${x - 115} 185 Q${x} 262 ${x + 115} 185Z" fill="${L[i]}" stroke="${C[i]}" stroke-width="2.5"/>` + txt(x, 204, t, { fs: 23, w: 800, c: C[i], n: 16 }); });
  s += txt(340, 40, v.center || "=", { fs: 30, w: 800, c: "#c9a227" });
  return svg(W, H, s);
}
function line(v) {
  let lo = N(v.min), hi = N(v.max); const P = A(v.pts), R = A(v.seg);
  const vals = [...P.map(p => N(p.x)), ...R.flatMap(r => [N(r.a), N(r.b)])].filter(x => x !== null);
  if (lo === null) lo = Math.floor(Math.min(0, ...vals) - 2); if (hi === null) hi = Math.ceil(Math.max(0, ...vals) + 2); if (hi <= lo) hi = lo + 10;
  const W = 680, H = 210, x0 = 50, x1 = 630, Y = 100, X = x => x0 + (x - lo) / (hi - lo) * (x1 - x0), span = hi - lo, st = span <= 20 ? 1 : span <= 50 ? 5 : Math.ceil(span / 10);
  let s = `<line x1="${x0 - 30}" y1="${Y}" x2="${x1 + 30}" y2="${Y}" stroke="#334155" stroke-width="3" marker-start="url(#ah)" marker-end="url(#ah)"/>`;
  for (let k = Math.ceil(lo / st) * st; k <= hi; k += st) s += `<line x1="${X(k)}" y1="${Y - 8}" x2="${X(k)}" y2="${Y + 8}" stroke="#334155" stroke-width="2"/>` + txt(X(k), Y + 26, ar(k), { fs: 14, w: 700, c: "#475569", ltr: 1 });
  R.forEach((r, i) => { const a = N(r.a), b = N(r.b), xa = a === null ? x0 - 28 : X(a), xb = b === null ? x1 + 28 : X(b), c = C[(i + 1) % 7]; s += `<line x1="${xa}" y1="${Y - 22 - i * 10}" x2="${xb}" y2="${Y - 22 - i * 10}" stroke="${c}" stroke-width="8" stroke-linecap="round" opacity=".85" ${a === null ? 'marker-start="url(#ah2)"' : ""} ${b === null ? 'marker-end="url(#ah2)"' : ""}/>`; [[a, r.ai], [b, r.bi]].forEach(([q, inc]) => { if (q !== null) s += `<circle cx="${X(q)}" cy="${Y}" r="9" fill="${inc === "مغلقة" || inc === true || inc === "1" ? c : "#fff"}" stroke="${c}" stroke-width="3"/>`; }); });
  P.forEach((p, i) => { const x = N(p.x); if (x === null) return; const c = C[(i + 2) % 7]; s += `<circle cx="${X(x)}" cy="${Y}" r="9" fill="${p.o ? "#fff" : c}" stroke="${c}" stroke-width="3"/>` + (p.l ? txt(X(x), Y + 58 + (i % 2) * 22, p.l, { fs: 14, w: 800, c }) : ""); });
  return svg(W, H, s);
}
function graph(v) {
  const P = A(v.pts), Ls = A(v.lines); const vals = P.flatMap(p => [Math.abs(N(p.x) || 0), Math.abs(N(p.y) || 0)]).concat(Ls.map(l => Math.abs(N(l.b) || 0)));
  const R = Math.min(12, Math.max(6, Math.ceil(Math.max(0, ...vals) + 1))), W = 680, H = 420, S = 360, ox = 180 + S / 2, oy = 25 + S / 2, k = S / 2 / R;
  const X = x => ox + x * k, Y = y => oy - y * k; let s = `<rect x="${ox - S / 2}" y="${oy - S / 2}" width="${S}" height="${S}" fill="#f8fafc" rx="8"/>`;
  for (let i = -R; i <= R; i++) s += `<line x1="${X(i)}" y1="${Y(-R)}" x2="${X(i)}" y2="${Y(R)}" stroke="#e2e8f0"/><line x1="${X(-R)}" y1="${Y(i)}" x2="${X(R)}" y2="${Y(i)}" stroke="#e2e8f0"/>`;
  s += `<line x1="${X(-R)}" y1="${oy}" x2="${X(R)}" y2="${oy}" stroke="#334155" stroke-width="2" marker-end="url(#ah)"/><line x1="${ox}" y1="${Y(-R)}" x2="${ox}" y2="${Y(R)}" stroke="#334155" stroke-width="2" marker-end="url(#ah)"/>` + txt(X(R) + 14, oy + 2, "س", { fs: 16, w: 800 }) + txt(ox, Y(R) - 12, "ص", { fs: 16, w: 800 });
  const st = R > 8 ? 2 : 1; for (let i = -R + 1; i < R; i++) if (i && i % st === 0) s += txt(X(i), oy + 14, ar(i), { fs: 11, w: 600, c: "#64748b", ltr: 1 }) + txt(ox - 12, Y(i), ar(i), { fs: 11, w: 600, c: "#64748b", ltr: 1 });
  s += `<clipPath id="gc"><rect x="${X(-R)}" y="${Y(R)}" width="${S}" height="${S}"/></clipPath>`;
  const leg = [];
  Ls.forEach((l, i) => { const m = N(l.m), b = N(l.b) ?? 0, c = C[i % 7]; if (m === null) return; s += `<line clip-path="url(#gc)" x1="${X(-R)}" y1="${Y(m * -R + b)}" x2="${X(R)}" y2="${Y(m * R + b)}" stroke="${c}" stroke-width="3.5" stroke-linecap="round"/>`; leg.push([c, l.l || `ص = ${ar(m)}س + ${ar(b)}`]); });
  P.forEach((p, i) => { const x = N(p.x), y = N(p.y); if (x === null || y === null) return; const c = C[(i + 2) % 7]; s += `<circle cx="${X(x)}" cy="${Y(y)}" r="6.5" fill="${c}" stroke="#fff" stroke-width="2"/>` + (p.l ? txt(X(x) + (x >= 0 ? -10 : 10), Y(y) - 15, p.l, { fs: 13, w: 800, c, a: x >= 0 ? "start" : "end" }) : ""); });
  leg.forEach(([c, t], i) => { s += `<rect x="20" y="${40 + i * 40}" width="140" height="30" rx="10" fill="${c}"/>` + txt(90, 55 + i * 40, t, { fs: 13.5, w: 800, c: "#fff", n: 22 }); });
  return svg(W, H, s);
}
function compare(v) {
  const it = A(v.items), g = [...new Set(it.map(x => x.g || "أ"))].slice(0, 2); if (g.length < 2) g.push("ب");
  const W = 680, rows = Math.max(...g.map(k => it.filter(x => (x.g || "أ") === k).length), 1), H = 80 + rows * 64; let s = "";
  g.forEach((k, j) => { const X = j === 0 ? 350 : 20, c = C[j * 2]; s += `<rect x="${X}" y="10" width="310" height="${H - 20}" rx="20" fill="${L[j * 2]}" stroke="${c}" stroke-width="2"/><rect x="${X}" y="10" width="310" height="48" rx="20" fill="${c}"/>` + txt(X + 155, 35, (j === 0 ? v.left : v.right) || k, { fs: 18, w: 800, c: "#fff", n: 26 });
    it.filter(x => (x.g || "أ") === k).forEach((x, i) => { s += `<circle cx="${X + 290}" cy="${92 + i * 64}" r="6" fill="${c}"/>` + txt(X + 276, 86 + i * 64, x.t, { a: "start", fs: 14.5, w: 800, c: "#0f172a" }) + (x.d ? txt(X + 276, 106 + i * 64, x.d, { a: "start", fs: 12, w: 600, c: "#475569" }) : ""); }); });
  s += `<circle cx="340" cy="${H / 2}" r="22" fill="#c9a227"/>` + txt(340, H / 2 + 1, "↔", { fs: 20, w: 800, c: "#fff" });
  return svg(W, H, s);
}
function analogy(v) {
  const it = A(v.items).slice(0, 4), W = 680, H = 30 + it.length * 92; let s = "";
  it.forEach((x, i) => { const Y = 15 + i * 92, c = C[i % 7]; s += `<rect x="20" y="${Y}" width="640" height="78" rx="20" fill="${L[i % 7]}"/><circle cx="615" cy="${Y + 39}" r="30" fill="#fff" stroke="${c}" stroke-width="2"/>` + txt(615, Y + 41, x.g || "💡", { fs: 30 }) + txt(570, Y + 39, x.t, { a: "start", fs: 17, w: 800, c, n: 22 }) + txt(330, Y + 39, "↔", { fs: 24, w: 800, c: "#94a3b8" }) + txt(300, Y + 39, x.d, { a: "start", fs: 15, w: 700, c: "#334155", n: 34 }); });
  return svg(W, H, s);
}
function bars(v) {
  const it = A(v.items).slice(0, 8), vals = it.map(x => N(x.d) || 0), mx = Math.max(1, ...vals), W = 680, H = 320, bw = Math.min(70, 560 / Math.max(1, it.length) - 16); let s = `<line x1="50" y1="260" x2="650" y2="260" stroke="#334155" stroke-width="2"/>`;
  it.forEach((x, i) => { const h = vals[i] / mx * 200, X = 630 - i * (600 / it.length) - bw, c = C[i % 7]; s += `<rect x="${X}" y="${260 - h}" width="${bw}" height="${h}" rx="8" fill="${c}"/>` + txt(X + bw / 2, 245 - h, ar(x.d), { fs: 14, w: 800, c, ltr: 1 }) + txt(X + bw / 2, 285, x.t, { fs: 12.5, w: 700, c: "#334155", n: 12 }); });
  return svg(W, H, s);
}
const R = { map, steps, balance, line, graph, compare, analogy, bars };
export const VIS_NAMES = { map: "خريطة مفاهيم", steps: "خطوات", balance: "ميزان", line: "خط الأعداد", graph: "المستوى الإحداثي", compare: "مقارنة", analogy: "تشبيه من الحياة", bars: "أعمدة بيانية" };
export function visSVG(v) { try { const f = R[v && v.k]; return f ? f(v) : ""; } catch { return ""; } }

// قالب بيانات الرسوم
const S_ = { type: "string" }, NUM = { type: ["number", "null"] };
export const VIS_SCHEMA = { type: "object", properties: { vis: { type: "array", items: { type: "object", properties: {
  k: { type: "string", enum: Object.keys(R) }, t: S_, cap: S_, center: S_, left: S_, right: S_, min: NUM, max: NUM,
  items: { type: "array", items: { type: "object", properties: { t: S_, d: S_, g: S_ }, required: ["t"] } },
  pts: { type: "array", items: { type: "object", properties: { x: { type: "number" }, y: NUM, l: S_, o: { type: "boolean" } }, required: ["x"] } },
  lines: { type: "array", items: { type: "object", properties: { m: { type: "number" }, b: { type: "number" }, l: S_ }, required: ["m", "b"] } },
  seg: { type: "array", items: { type: "object", properties: { a: NUM, b: NUM, ai: { type: "boolean" }, bi: { type: "boolean" } } } },
}, required: ["k", "t", "cap"] } } }, required: ["vis"] };

export function visPrompt({ subj, grade, title, objs }) {
  return `صمّم ٣ رسوم توضيحية تبسّط درس «${title}» (${subj} – ${grade}) لطلاب المرحلة المتوسطة، يعرضها المعلم على السبورة.
أهداف الدرس: ${objs || "—"}
اختر لكل رسم النوع الأنسب من الأنواع الآتية، ونوّع بينها، واملأ الحقول الخاصة بالنوع فقط:
- map خريطة مفاهيم: center المفهوم الرئيس، items (٤–٦) كل منها t مفهوم فرعي و d شرح قصير جدًا
- steps خطوات: items (٣–٥) كل منها t اسم الخطوة و d مثال تطبيقي قصير من الدرس
- balance ميزان (للمعادلات): left الطرف الأيمن من المعادلة، right الطرف الأيسر، center علامة أو عبارة قصيرة فوق الميزان
- line خط الأعداد (للمتباينات والقيمة المطلقة والأعداد): min و max، و pts نقاط {x, l تسمية, o true للدائرة المفرغة}، و seg فترات {a بداية أو null لما لا نهاية، b نهاية أو null، ai و bi true إذا كان الطرف مشمولًا}
- graph المستوى الإحداثي (للدوال والميل والأنظمة): lines مستقيمات {m الميل، b المقطع الصادي، l معادلته مكتوبة بالعربية مثل ص = ٢س + ١}، و pts نقاط {x, y, l}
- compare مقارنة: left عنوان العمود الأول، right عنوان الثاني، items كل منها t و d و g ("أ" للأول أو "ب" للثاني)
- analogy تشبيه من الحياة: items (٣–٤) كل منها t المفهوم، d ما يشبهه من حياة الطالب السعودي، g رمز تعبيري واحد مناسب
- bars أعمدة بيانية: items كل منها t التسمية و d القيمة رقمًا
لكل رسم: t عنوان قصير جذاب، cap جملة واحدة يقولها المعلم للطلاب تشرح الرسم ببساطة.
الأرقام في الحقول الرقمية أرقام حقيقية دقيقة رياضيًا ومطابقة لمحتوى الدرس. النصوص قصيرة جدًا (لا تزيد على ٦ كلمات للعناصر). لا تستعمل علامة التنصيص " داخل النصوص.
أخرج JSON فقط بالصيغة: {"vis":[ ... ]}`;
}
