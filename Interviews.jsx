// ═════════════════════════════════════════════════════════════════
// 🤝 مقابلات المعلمين — جدولة اللقاء، لوحة المدير ببيانات المعلم الحية، محاور النقاش بمقاييس واضحة،
// تفويض المعلم بكتابة محاور، مشاركون (وكلاء وموجهون)، توقيع إلكتروني للجميع، تغذية راجعة، ومحضر رسمي للطباعة
// school-tint/{id} نصوص المقابلة • school-tint-sig/{id}/{who} صور التواقيع (منفصلة لخفة القائمة)
// ═════════════════════════════════════════════════════════════════
import React, { useState, useEffect, useMemo, useRef } from "react";

const N = { I: "school-tint", SG: "school-tint-sig" };
const NAVY = "#0b2545", GOLD = "#c9a227";
const ar = n => String(n ?? "").replace(/\d/g, x => "٠١٢٣٤٥٦٧٨٩"[x]);
const obj = v => (v && typeof v === "object" ? v : {});
const arr = v => Array.isArray(v) ? v.filter(x => x != null) : v && typeof v === "object" ? Object.values(v) : [];
const esc = t => String(t ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const nid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const nrm = s => String(s || "").replace(/[ً-ْـ]/g, "").replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي").replace(/\s*\(.*?\)\s*/g, " ").trim();
const sameName = (a, b) => { const x = nrm(a).split(/\s+/).filter(Boolean), y = nrm(b).split(/\s+/).filter(Boolean); if (!x.length || !y.length) return false; if (x.join(" ") === y.join(" ")) return true; return x[0] === y[0] && (x[x.length - 1] === y[y.length - 1] || x.slice(1).some(w => y.slice(1).includes(w))); };
const sameSub = (a, b) => { const x = nrm(a).replace(/^ال/, ""), y = nrm(b).replace(/^ال/, ""); return !!x && !!y && (x === y || x.includes(y) || y.includes(x)); };
const avg = L => { const a = L.filter(v => v != null && isFinite(v)); return a.length ? a.reduce((s, v) => s + v, 0) / a.length : null; };
const hij = d => { try { return new Date(d + "T12:00:00").toLocaleDateString("ar-SA-u-ca-islamic-umalqura", { weekday: "long", day: "numeric", month: "long", year: "numeric" }); } catch { return d || ""; } };
const todayK = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const daysTo = d => Math.round((new Date(d + "T12:00:00") - new Date(todayK() + "T12:00:00")) / 864e5);
const nw = (n, one, two, few, many) => n === 1 ? one : n === 2 ? two : `${ar(n)} ${n >= 3 && n <= 10 ? few : many}`;

// مقياس الأداء (سلم الوزارة الخماسي)
const LV = [null, ["غير مرضٍ", "#b91c1c", "#fee2e2"], ["بحاجة إلى تطوير", "#b45309", "#fef3c7"], ["وافق التوقعات", "#1d4ed8", "#dbeafe"], ["فاق التوقعات", "#0f766e", "#ccfbf1"], ["مثالي", "#15803d", "#dcfce7"]];
// مقياس مستويات الطلاب (من نسب الدرجات)
const SL = [["متقدم", 90, "#15803d"], ["متمكن", 75, "#0d9488"], ["متوسط", 60, "#2563eb"], ["يحتاج دعمًا", 50, "#d97706"], ["متعثر", 0, "#dc2626"]];
const slOf = p => SL.findIndex(s => p >= s[1]);
// محاور المقابلة
const SEC = [
  { k: "perf", n: 1, t: "مستوى الأداء والتحضير والانضباط", ic: "🎯", q: ["التحضير وخطط الدروس محدثة ومرتبطة بالأهداف", "الحضور والانصراف وبدء الحصص في وقتها", "حصص الانتظار والمناوبة والإشراف", "الأداء داخل الصف في الزيارات الصفية"] },
  { k: "rec", n: 2, t: "سجل التقويم وتوفره", ic: "📒", q: ["السجل متوفر ومحدث (ورقي أو إلكتروني)", "رصد الدرجات في نظام نور في مواعيده", "تنوع أدوات التقويم (تشخيصي، تكويني، ختامي)", "توثيق نتائج التقويم واستخدامها"] },
  { k: "lvl", n: 3, t: "مستويات الطلاب", ic: "📊", q: ["معرفة المعلم بمستويات طلابه بالأسماء", "تصنيف الطلاب وفق مقياس المستويات", "تحديد المهارات الأضعف لكل فصل", "مراعاة الفروق الفردية في التدريس"] },
  { k: "plan", n: 4, t: "الالتزام بالخطة الدراسية حسب التوزيع", ic: "🗓️", q: ["مطابقة ما أُنجز لتوزيع المنهج", "خطة تعويض واضحة عند التأخر", "عدم الاستعجال على حساب الإتقان", "تنسيق التوزيع مع معلمي المادة"] },
  { k: "imp", n: 5, t: "مستوى تحسن الطلاب وجهود المعلم", ic: "📈", q: ["خطط علاجية للمتعثرين بأسمائهم", "برامج إثرائية للمتميزين", "قياس التحسن بعد التدخل", "التواصل مع أولياء الأمور بشأن المستوى"] },
];
const GOALS0 = ["الوقوف على واقع أداء المعلم ودعمه مهنيًا", "مناقشة سجل التقويم وتوفره", "مراجعة مستويات الطلاب وخطط العلاج والإثراء", "متابعة الالتزام بالخطة الدراسية حسب التوزيع", "الاتفاق على أولويات التطوير وموعد المتابعة"];
const REQS0 = ["سجل التقويم (ورقي أو إلكتروني)", "خطط الدروس / دفتر التحضير", "توزيع المنهج وما أُنجز منه", "نتائج الاختبارات التشخيصية والفترة الأولى", "خطط العلاج والإثراء وشواهدها", "ملف الأداء الوظيفي محدّثًا"];
const ROLES = ["وكيل الشؤون التعليمية", "وكيل شؤون الطلاب", "وكيل الشؤون المدرسية", "الموجه الطلابي", "رائد النشاط", "معلم أول / منسق المادة", "مشرف تربوي"];
const ST = { plan: ["مجدولة", "#0369a1", "#e0f2fe"], held: ["عُقدت — بانتظار التواقيع", "#7c3aed", "#ede9fe"], done: ["مكتملة وموقّعة", "#15803d", "#dcfce7"] };

const CSS = `
.iv{direction:rtl;color:#0f172a;font-family:inherit}
.iv *{box-sizing:border-box}
.iv-hero{background:linear-gradient(135deg,${NAVY},#13315c 65%,#7a5c12);color:#fff;border-radius:22px;padding:18px 20px;border-bottom:4px solid ${GOLD};display:flex;flex-wrap:wrap;gap:14px;align-items:center;justify-content:space-between}
.iv-hero h2{margin:0;font-size:23px;font-weight:900}.iv-hero p{margin:4px 0 0;opacity:.88;font-size:13.5px}
.iv-k{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px;margin:12px 0}
.iv-k div{background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:10px 12px;border-top:4px solid var(--c,${NAVY})}.iv-k b{display:block;font-size:26px;color:var(--c,${NAVY});line-height:1.1}.iv-k span{font-size:12.5px;color:#475569;font-weight:700}
.iv-card{background:#fff;border:1px solid #e2e8f0;border-radius:18px;padding:14px;box-shadow:0 2px 10px rgba(15,23,42,.04);margin-bottom:12px}
.iv-card h3{margin:0 0 10px;color:${NAVY};font-size:16px;display:flex;gap:8px;align-items:center}
.iv-btn{font-family:inherit;font-weight:800;border-radius:12px;border:1px solid #cbd5e1;background:#fff;color:${NAVY};padding:8px 14px;cursor:pointer;min-height:40px}
.iv-btn.p{background:${NAVY};color:#fff;border-color:${NAVY}}.iv-btn.g{background:${GOLD};border-color:${GOLD};color:${NAVY}}.iv-btn.d{color:#b91c1c;border-color:#fecaca}.iv-btn:disabled{opacity:.5}
.iv-in,.iv-ta,.iv-sel{font-family:inherit;font-size:14px;border:1.5px solid #cbd5e1;border-radius:12px;padding:8px 10px;background:#fff;color:#0f172a;width:100%}
.iv-ta{min-height:70px;resize:vertical;line-height:1.7}
.iv-row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.iv-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px}
.iv-lb{font-size:12.5px;font-weight:800;color:#475569;margin:8px 0 4px;display:block}
.iv-chip{display:inline-flex;gap:6px;align-items:center;border:1.5px solid #cbd5e1;background:#fff;border-radius:999px;padding:5px 12px;font-weight:700;font-size:13px;cursor:pointer;font-family:inherit;color:#334155;margin:3px}
.iv-chip.on{background:#ecfdf5;border-color:#10b981;color:#065f46}
.iv-tbl{width:100%;border-collapse:collapse;font-size:13.5px}.iv-tbl th{background:${NAVY};color:#fff;padding:8px 6px;font-weight:800}.iv-tbl td{border-bottom:1px solid #eef2f7;padding:8px 6px;text-align:center}.iv-tbl td.r{text-align:start}
.iv-st{display:inline-block;border-radius:999px;padding:2px 10px;font-weight:800;font-size:12px}
.iv-sc{display:flex;gap:5px;flex-wrap:wrap}.iv-sc button{min-width:44px;min-height:40px;border-radius:12px;border:1.5px solid #e2e8f0;background:#fff;font-family:inherit;font-weight:900;cursor:pointer;display:grid;place-items:center;line-height:1.1;padding:3px 6px}.iv-sc button small{font-size:9.5px;font-weight:700}
.iv-sc button.on{color:#fff;border-color:transparent}
.iv-sec{border:1px solid #e2e8f0;border-radius:18px;margin-bottom:12px;overflow:hidden;background:#fff}
.iv-sh{display:flex;gap:10px;align-items:center;padding:12px 14px;background:linear-gradient(90deg,#f4ead2,#fff);border-bottom:1px solid #eee3c8}
.iv-sh .ic{width:40px;height:40px;border-radius:12px;background:${NAVY};display:grid;place-items:center;font-size:20px;flex:none}
.iv-sh b{font-size:15.5px;color:${NAVY}}.iv-sh small{display:block;color:#64748b;font-size:12px}
.iv-sb{padding:12px 14px;display:grid;gap:10px}
.iv-data{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px}
.iv-data div{background:#f8fafc;border:1px solid #eef2f7;border-radius:12px;padding:8px 10px}.iv-data b{display:block;font-size:19px;color:${NAVY}}.iv-data span{font-size:12px;color:#64748b;font-weight:700}
.iv-sl{display:flex;height:26px;border-radius:10px;overflow:hidden;border:1px solid #e2e8f0}.iv-sl i{display:grid;place-items:center;color:#fff;font-style:normal;font-size:11.5px;font-weight:800;min-width:0}
.iv-leg{display:flex;flex-wrap:wrap;gap:4px 12px;font-size:12px;font-weight:700;color:#334155}.iv-leg i{display:inline-block;width:11px;height:11px;border-radius:3px;margin-inline-end:4px;vertical-align:-1px}
.iv-tn{background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:8px 10px;font-size:13.5px;line-height:1.7}.iv-tn b{color:#1e3a8a}
.iv-sig{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px}
.iv-sgc{border:1.5px dashed #cbd5e1;border-radius:14px;padding:8px;text-align:center;background:#fff}
.iv-sgc img{max-width:100%;height:64px;object-fit:contain}.iv-sgc .n{font-weight:900;color:${NAVY};font-size:13.5px}.iv-sgc .r{font-size:11.5px;color:#64748b}
.iv-pad{touch-action:none;background:#fff;border:1.5px solid #94a3b8;border-radius:12px;width:100%;height:140px;cursor:crosshair}
.iv-cd{display:flex;gap:10px;align-items:center;background:#fffbeb;border:1px solid #fde68a;border-radius:14px;padding:10px 12px}.iv-cd b{font-size:30px;color:#b45309;line-height:1}
.iv-ht td{font-weight:900}
.iv-msg{position:sticky;top:8px;z-index:5;background:#ecfdf5;border:1px solid #a7f3d0;color:#065f46;border-radius:12px;padding:8px 12px;font-weight:800;margin:8px 0}
@media(max-width:640px){.iv-hero h2{font-size:19px}.iv-tbl{font-size:12.5px}}
`;

// ── لوحة التوقيع
function SigPad({ onSave, onCancel }) {
  const c = useRef(null), dr = useRef(false), last = useRef(null), [has, setHas] = useState(false);
  useEffect(() => { const cv = c.current, r = cv.getBoundingClientRect(), k = window.devicePixelRatio || 1; cv.width = r.width * k; cv.height = r.height * k; const x = cv.getContext("2d"); x.scale(k, k); x.lineWidth = 2.4; x.lineCap = "round"; x.lineJoin = "round"; x.strokeStyle = NAVY; }, []);
  const pt = e => { const r = c.current.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  const down = e => { e.preventDefault(); c.current.setPointerCapture(e.pointerId); dr.current = true; last.current = pt(e); };
  const move = e => { if (!dr.current) return; const p = pt(e), x = c.current.getContext("2d"); x.beginPath(); x.moveTo(...last.current); x.lineTo(...p); x.stroke(); last.current = p; setHas(true); };
  const up = () => { dr.current = false; };
  const clear = () => { const cv = c.current; cv.getContext("2d").clearRect(0, 0, cv.width, cv.height); setHas(false); };
  const save = () => { const cv = c.current, o = document.createElement("canvas"), w = 360, h = Math.round(w * cv.height / cv.width); o.width = w; o.height = h; o.getContext("2d").drawImage(cv, 0, 0, w, h); onSave(o.toDataURL("image/png")); };
  return <div><canvas ref={c} className="iv-pad" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up} /><div className="iv-row" style={{ marginTop: 6 }}><button className="iv-btn p" disabled={!has} onClick={save}>اعتماد التوقيع</button><button className="iv-btn" onClick={clear}>مسح</button>{onCancel && <button className="iv-btn" onClick={onCancel}>إلغاء</button>}</div></div>;
}

function Scale({ v, on, ro }) {
  return <div className="iv-sc">{[1, 2, 3, 4, 5].map(n => <button key={n} disabled={ro} className={v === n ? "on" : ""} style={v === n ? { background: LV[n][1] } : null} title={LV[n][0]} onClick={() => on(v === n ? 0 : n)}>{ar(n)}<small>{LV[n][0]}</small></button>)}</div>;
}
const LvTag = ({ v }) => v ? <span className="iv-st" style={{ background: LV[v][2], color: LV[v][1] }}>{ar(v)} — {LV[v][0]}</span> : <span className="iv-st" style={{ background: "#f1f5f9", color: "#94a3b8" }}>لم يُقدَّر</span>;
const SLBar = ({ d }) => { const t = d.reduce((a, b) => a + b, 0); if (!t) return <div style={{ color: "#94a3b8", fontSize: 13 }}>لا توجد درجات مرصودة لطلابه بعد.</div>; return <><div className="iv-sl">{d.map((n, i) => n ? <i key={i} style={{ width: `${n / t * 100}%`, background: SL[i][2] }} title={`${SL[i][0]}: ${n}`}>{n / t >= .07 ? ar(n) : ""}</i> : null)}</div><div className="iv-leg" style={{ marginTop: 6 }}>{SL.map((s, i) => <span key={i}><i style={{ background: s[2] }} />{s[0]} {i < 4 ? `(${ar(s[1])}٪ فأكثر)` : `(دون ٥٠٪)`}: <b>{ar(d[i])}</b></span>)}</div></>; };

// ── تجميع بيانات المعلم من الموقع
async function loadCtx(api) {
  const g = k => api.maGet(k).catch(() => null);
  const [T, staff, grades, pfix, iv, abs, cvp, cve] = await Promise.all([api.tt ? api.tt().catch(() => null) : null, api.staff ? api.staff().catch(() => []) : [], g("school-grades"), g("school-pf-ix"), g("school-cmd-iv"), g("school-tt-abs"), g("school-cv-plan"), g("school-cv-eval")]);
  return { T, staff: arr(staff), grades: Object.values(obj(grades)).filter(r => r && r.ck && r.marks), pfix: obj(pfix), iv: Object.values(obj(iv)).filter(Boolean), abs: obj(abs), cvp: Object.values(obj(cvp)).filter(Boolean), cve: obj(cve) };
}
function teacherData(name, C, api) {
  const T = C.T, ti = T && api.ttFind ? api.ttFind(T, name) : -1, pairs = [];
  if (T && T.C && ti >= 0) Object.entries(T.C).forEach(([k, days]) => (days || []).forEach(row => (row || []).forEach(c => { if (Array.isArray(c) && c[1] === ti && T.S[c[0]] && !/احتياط|نشاط|انتظار/.test(T.S[c[0]])) { const p = pairs.find(x => x.ck === k && x.s === T.S[c[0]]); if (p) p.n++; else pairs.push({ ck: k, s: T.S[c[0]], n: 1 }); } })));
  let sb = 0; if (T && T.RS && ti >= 0) Object.values(T.RS).forEach(day => (day || []).forEach(r => { if (Array.isArray(r) && r.includes(ti)) sb++; }));
  const subs = {}; pairs.forEach(p => subs[p.s] = (subs[p.s] || 0) + p.n); const spec = Object.entries(subs).sort((a, b) => b[1] - a[1]).map(x => x[0]);
  const load = pairs.reduce((a, p) => a + p.n, 0);
  const mine = C.grades.filter(r => sameName(r.teacher || r.by, name) || pairs.some(x => x.ck === r.ck && sameSub(x.s, r.subj)));
  const stu = {}; mine.forEach(r => { const mx = +r.max || 0; if (!mx) return; Object.entries(obj(r.marks)).forEach(([sid, v]) => { if (v === "غ" || v === "" || v == null || !isFinite(+v)) return; const k = r.ck + "|" + sid; const s = stu[k] || (stu[k] = { L: [], dg: [], ot: [] }); const p = +v / mx * 100; s.L.push(p); (r.type === "تشخيصي" ? s.dg : s.ot).push({ p, d: r.date || "", at: r.at || 0 }); }); });
  const S = Object.values(stu).map(s => avg(s.L)).filter(v => v != null), dist = [0, 0, 0, 0, 0]; S.forEach(p => dist[slOf(p)]++);
  const pairsImp = Object.values(stu).filter(s => s.dg.length && s.ot.length).map(s => avg(s.ot.map(x => x.p)) - avg(s.dg.map(x => x.p)));
  const tk = String(name || "").trim().replace(/\s+/g, "_").replace(/[.#$\[\]\/]/g, ""), px = obj(C.pfix[tk]);
  const absDays = ti < 0 ? null : Object.values(C.abs).reduce((a, day) => a + (Object.values(obj(day)).some(x => x && x.ti === ti) ? 1 : 0), 0);
  const vis = C.cvp.filter(r => sameName(r.t, name)), visDone = vis.filter(r => obj(obj(C.cve[r.tk])[r.v]).fin).length;
  const rem = C.iv.filter(v => sameName(v.owner || v.by, name));
  return { ti, pairs, spec, load, sb, n: S.length, avg: avg(S), dist, recs: mine.length, types: [...new Set(mine.map(r => r.type).filter(Boolean))], imp: pairsImp.length ? { n: pairsImp.length, d: avg(pairsImp), up: pairsImp.filter(x => x > 2).length } : null, pf: px.tot != null ? { tot: +px.tot || 0, pct: Math.round((+px.tot || 0) / 66 * 100) } : null, absDays, vis: vis.length, visDone, rem: rem.length, remSt: rem.filter(v => v.st === "done").length };
}

const ivIndex = r => avg(SEC.map(s => +obj(obj(r.sec)[s.k]).r || null));

// ════════ المكوّن الرئيسي
export function Interviews({ me, api, admin }) {
  const [L, setL] = useState(null), [C, setC] = useState(null), [open, setOpen] = useState(null), [mode, setMode] = useState("list"), [msg, setMsg] = useState("");
  const say = t => { setMsg(t); setTimeout(() => setMsg(""), 3500); };
  const load = async () => { const a = obj(await api.maGet(N.I)); setL(Object.values(a).filter(x => x && x.id).sort((x, y) => (y.date || "").localeCompare(x.date || ""))); };
  useEffect(() => { load(); loadCtx(api).then(setC); }, []);
  const save = async r => { r.up = Date.now(); await api.maPut(`${N.I}/${r.id}`, r); setL(l => { const o = (l || []).filter(x => x.id !== r.id); return [r, ...o].sort((x, y) => (y.date || "").localeCompare(x.date || "")); }); };
  if (!L) return <div style={{ padding: 20 }}>⏳ جارٍ التحميل...</div>;
  const cur = open && L.find(x => x.id === open);
  return <div className="iv"><style>{CSS}</style>
    {msg && <div className="iv-msg">{msg}</div>}
    {cur ? <Meeting r={cur} me={me} admin={admin} api={api} C={C} save={save} say={say} onBack={() => setOpen(null)} onDel={id => { setL(l => l.filter(x => x.id !== id)); setOpen(null); say("حُذفت المقابلة"); }} />
      : admin ? (mode === "new" ? <NewIv C={C} me={me} L={L} onCancel={() => setMode("list")} onSave={async r => { await save(r); setMode("list"); setOpen(r.id); say("جُدولت المقابلة، وتظهر الآن في حساب المعلم والمشاركين."); }} />
        : <Center L={L} C={C} api={api} onOpen={setOpen} onNew={() => setMode("new")} />)
        : <Mine L={L} me={me} onOpen={setOpen} />}
  </div>;
}

// ── مركز المقابلات (المدير)
function Center({ L, C, api, onOpen, onNew }) {
  const [q, setQ] = useState("");
  const all = C && C.T ? [...new Set((C.T.T || []).map(n => String(n).replace(/\s*\(.*?\)\s*/g, "").trim()).filter(Boolean))] : [];
  const done = L.filter(r => r.st !== "plan"), up = L.filter(r => r.st === "plan").sort((a, b) => (a.date || "").localeCompare(b.date || "")), wait = L.filter(r => r.st === "held");
  const met = new Set(L.map(r => nrm(r.t))), notYet = all.filter(n => !met.has(nrm(n)));
  const cov = all.length ? Math.round(new Set(done.map(r => nrm(r.t))).size / all.length * 100) : 0;
  const secAvg = SEC.map(s => ({ s, v: avg(done.map(r => +obj(obj(r.sec)[s.k]).r || null)) })), idx = avg(done.map(ivIndex));
  const pri = secAvg.filter(x => x.v != null).sort((a, b) => a.v - b.v).slice(0, 2);
  const V = L.filter(r => !q || nrm(r.t).includes(nrm(q)));
  return <>
    <div className="iv-hero"><div><h2>🤝 مقابلات المعلمين</h2><p>لقاءات فردية موثقة تكشف واقع العمل في المدرسة: الأداء والتحضير والانضباط، سجل التقويم، مستويات الطلاب، الخطة الدراسية، وتحسن الطلاب.</p></div><button className="iv-btn g" onClick={onNew}>＋ جدولة مقابلة</button></div>
    <div className="iv-k">
      <div style={{ "--c": "#0f766e" }}><b>{ar(cov)}٪</b><span>تغطية المعلمين ({ar(new Set(done.map(r => nrm(r.t))).size)} من {ar(all.length)})</span></div>
      <div style={{ "--c": "#0369a1" }}><b>{ar(up.length)}</b><span>مقابلات قادمة</span></div>
      <div style={{ "--c": "#7c3aed" }}><b>{ar(wait.length)}</b><span>بانتظار التواقيع</span></div>
      <div style={{ "--c": GOLD }}><b>{idx == null ? "—" : ar(Math.round(idx * 10) / 10)}</b><span>متوسط تقدير المقابلات من ٥</span></div>
    </div>
    {done.length > 0 && <div className="iv-card"><h3>🧭 واقع العمل في المدرسة من المقابلات</h3>
      <div className="iv-grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))" }}>{secAvg.map(({ s, v }) => { const l = v ? Math.round(v) : 0; return <div key={s.k} style={{ border: "1px solid #e2e8f0", borderRadius: 14, padding: 10, borderTop: `4px solid ${l ? LV[l][1] : "#cbd5e1"}` }}><div style={{ fontSize: 12.5, fontWeight: 800, color: "#475569" }}>{s.ic} {s.t}</div><b style={{ fontSize: 24, color: l ? LV[l][1] : "#94a3b8" }}>{v == null ? "—" : ar(Math.round(v * 10) / 10)}</b>{l > 0 && <div style={{ fontSize: 12, color: LV[l][1], fontWeight: 800 }}>{LV[l][0]}</div>}</div>; })}</div>
      {pri.length > 0 && <div className="iv-tn" style={{ marginTop: 10 }}><b>أولويات التطوير على مستوى المدرسة:</b> {pri.map(x => `${x.s.t} (${ar(Math.round(x.v * 10) / 10)})`).join("، ")}. ابنِ عليها برنامج دعم جماعي أو مجتمع تعلم مهني.</div>}
      <div style={{ overflowX: "auto", marginTop: 10 }}><table className="iv-tbl iv-ht"><thead><tr><th>المعلم</th>{SEC.map(s => <th key={s.k} title={s.t}>{s.ic}</th>)}<th>التقدير</th><th>المتابعة</th></tr></thead>
        <tbody>{done.map(r => { const x = ivIndex(r); return <tr key={r.id} style={{ cursor: "pointer" }} onClick={() => onOpen(r.id)}><td className="r">{r.t}</td>{SEC.map(s => { const v = +obj(obj(r.sec)[s.k]).r || 0; return <td key={s.k} style={{ background: v ? LV[v][2] : "#fff", color: v ? LV[v][1] : "#cbd5e1" }}>{v ? ar(v) : "—"}</td>; })}<td>{x == null ? "—" : ar(Math.round(x * 10) / 10)}</td><td style={{ fontWeight: 600, fontSize: 12 }}>{obj(r.fb).fu ? hij(r.fb.fu).split("،").slice(1).join("،") : "—"}</td></tr>; })}</tbody></table></div>
    </div>}
    <div className="iv-card"><h3>📋 المقابلات</h3><input className="iv-in" placeholder="بحث باسم المعلم" value={q} onChange={e => setQ(e.target.value)} style={{ marginBottom: 8 }} />
      {V.length ? <div style={{ overflowX: "auto" }}><table className="iv-tbl"><thead><tr><th>المعلم</th><th>الموعد</th><th>الحالة</th><th>التواقيع</th><th></th></tr></thead><tbody>{V.map(r => { const st = ST[r.st] || ST.plan, need = 2 + arr(r.parts).length, got = Object.keys(obj(r.sg)).length; return <tr key={r.id}><td className="r"><b>{r.t}</b><div style={{ fontSize: 11.5, color: "#64748b" }}>{r.spec || ""}</div></td><td style={{ fontSize: 12.5 }}>{hij(r.date)}{r.time ? ` • ${r.time}` : ""}</td><td><span className="iv-st" style={{ background: st[2], color: st[1] }}>{st[0]}</span></td><td>{ar(got)}/{ar(need)}</td><td><button className="iv-btn" onClick={() => onOpen(r.id)}>فتح</button></td></tr>; })}</tbody></table></div> : <p style={{ color: "#94a3b8" }}>لا توجد مقابلات بعد. ابدأ بجدولة أول مقابلة.</p>}
    </div>
    {notYet.length > 0 && <div className="iv-card"><h3>⏳ معلمون لم تُجدول لهم مقابلة ({ar(notYet.length)})</h3><div>{notYet.map(n => <span key={n} className="iv-chip">{n}</span>)}</div></div>}
  </>;
}

// ── جدولة مقابلة
function NewIv({ C, me, L, onCancel, onSave }) {
  const names = C && C.T ? [...new Set((C.T.T || []).map(n => String(n).replace(/\s*\(.*?\)\s*/g, "").trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, "ar")) : [];
  const staffN = (C ? C.staff : []).map(s => typeof s === "string" ? { name: s } : s).filter(s => s && s.name);
  const [f, setF] = useState({ t: "", date: todayK(), time: "", place: "مكتب مدير المدرسة", goals: GOALS0.slice(), reqs: REQS0.slice(), parts: [], deleg: { plan: true, imp: true }, note: "" });
  const [ng, setNg] = useState(""), [nr, setNr] = useState(""), [pn, setPn] = useState(""), [pr, setPr] = useState(ROLES[0]);
  const td = f.t && C ? teacherData(f.t, C, { ttFind: (T, n) => { const i = (T.T || []).findIndex(x => sameName(x, n)); return i; } }) : null;
  const up = (k, v) => setF(x => ({ ...x, [k]: v }));
  const ok = f.t && f.date;
  return <div className="iv-card"><h3>＋ جدولة مقابلة معلم</h3>
    <div className="iv-grid">
      <label><span className="iv-lb">المعلم</span><select className="iv-sel" value={f.t} onChange={e => up("t", e.target.value)}><option value="">— اختر من القائمة —</option>{names.map(n => <option key={n} value={n}>{n}{L.some(r => nrm(r.t) === nrm(n)) ? " ✓" : ""}</option>)}</select></label>
      <label><span className="iv-lb">التاريخ</span><input type="date" className="iv-in" value={f.date} onChange={e => up("date", e.target.value)} /></label>
      <label><span className="iv-lb">الوقت</span><input type="time" className="iv-in" value={f.time} onChange={e => up("time", e.target.value)} /></label>
      <label><span className="iv-lb">المكان</span><input className="iv-in" value={f.place} onChange={e => up("place", e.target.value)} /></label>
    </div>
    {td && <div className="iv-tn" style={{ marginTop: 8 }}><b>{f.t}:</b> {td.spec[0] || "—"} • {nw(new Set(td.pairs.map(p => p.ck)).size, "فصل واحد", "فصلان", "فصول", "فصلًا")} • النصاب {nw(td.load, "حصة واحدة", "حصتان", "حصص", "حصة")} • {f.date ? hij(f.date) : ""}</div>}
    <span className="iv-lb">أهداف المقابلة (تظهر للمعلم)</span>
    <div>{f.goals.map((g, i) => <span key={i} className="iv-chip on" onClick={() => up("goals", f.goals.filter((_, k) => k !== i))}>✓ {g} ✕</span>)}</div>
    <div className="iv-row"><input className="iv-in" style={{ flex: 1 }} placeholder="هدف إضافي" value={ng} onChange={e => setNg(e.target.value)} /><button className="iv-btn" onClick={() => { if (ng.trim()) { up("goals", [...f.goals, ng.trim()]); setNg(""); } }}>إضافة</button></div>
    <span className="iv-lb">المتطلبات التي يحضرها المعلم</span>
    <div>{f.reqs.map((g, i) => <span key={i} className="iv-chip on" onClick={() => up("reqs", f.reqs.filter((_, k) => k !== i))}>📎 {g} ✕</span>)}</div>
    <div className="iv-row"><input className="iv-in" style={{ flex: 1 }} placeholder="متطلب إضافي" value={nr} onChange={e => setNr(e.target.value)} /><button className="iv-btn" onClick={() => { if (nr.trim()) { up("reqs", [...f.reqs, nr.trim()]); setNr(""); } }}>إضافة</button></div>
    <span className="iv-lb">المشاركون في اللقاء (الوكلاء والموجهون)</span>
    <div>{f.parts.map((p, i) => <span key={i} className="iv-chip on" onClick={() => up("parts", f.parts.filter((_, k) => k !== i))}>👤 {p.n} — {p.r} ✕</span>)}</div>
    <div className="iv-row"><input className="iv-in" style={{ flex: "2 1 180px" }} list="iv-staff" placeholder="اسم المشارك" value={pn} onChange={e => setPn(e.target.value)} /><datalist id="iv-staff">{staffN.map(s => <option key={s.name} value={s.name}>{s.job || ""}</option>)}{names.map(n => <option key={"t" + n} value={n} />)}</datalist>
      <select className="iv-sel" style={{ flex: "1 1 160px", width: "auto" }} value={pr} onChange={e => setPr(e.target.value)}>{ROLES.map(r => <option key={r}>{r}</option>)}</select><button className="iv-btn" onClick={() => { if (pn.trim()) { up("parts", [...f.parts, { n: pn.trim(), r: pr }]); setPn(""); } }}>إضافة</button></div>
    <span className="iv-lb">تفويض المعلم بكتابة محاور قبل اللقاء</span>
    <div>{SEC.map(s => <span key={s.k} className={"iv-chip" + (f.deleg[s.k] ? " on" : "")} onClick={() => up("deleg", { ...f.deleg, [s.k]: !f.deleg[s.k] })}>{f.deleg[s.k] ? "✓ " : ""}{s.ic} {s.t}</span>)}</div>
    <label><span className="iv-lb">رسالة للمعلم (اختياري)</span><textarea className="iv-ta" value={f.note} onChange={e => up("note", e.target.value)} placeholder="مثال: لقاء ودي لدعمك والوقوف على احتياجاتك، نرجو إحضار المتطلبات أدناه." /></label>
    <div className="iv-row" style={{ marginTop: 10 }}><button className="iv-btn p" disabled={!ok} onClick={() => onSave({ id: nid(), ...f, spec: td ? td.spec[0] || "" : "", st: "plan", sec: {}, reqOk: {}, by: me.name || "الإدارة", at: Date.now() })}>حفظ وإرسال للمعلم</button><button className="iv-btn" onClick={onCancel}>إلغاء</button></div>
  </div>;
}

// ── مقابلاتي (المعلم والمشاركون)
function Mine({ L, me, onOpen }) {
  const mine = L.filter(r => sameName(r.t, me.name)), part = L.filter(r => arr(r.parts).some(p => sameName(p.n, me.name)) && !sameName(r.t, me.name));
  const Card = ({ r, role }) => { const d = daysTo(r.date), st = ST[r.st] || ST.plan; return <div className="iv-card" style={{ cursor: "pointer" }} onClick={() => onOpen(r.id)}>
    <div className="iv-row" style={{ justifyContent: "space-between" }}><div><b style={{ fontSize: 16, color: NAVY }}>{role === "t" ? "مقابلتي مع إدارة المدرسة" : `مقابلة أ/ ${r.t}`}</b><div style={{ fontSize: 13, color: "#475569", fontWeight: 700 }}>📅 {hij(r.date)}{r.time ? ` • ⏰ ${r.time}` : ""}{r.place ? ` • 📍 ${r.place}` : ""}</div></div><span className="iv-st" style={{ background: st[2], color: st[1] }}>{st[0]}</span></div>
    {r.st === "plan" && d >= 0 && <div className="iv-cd" style={{ marginTop: 8 }}><b>{d === 0 ? "اليوم" : ar(d)}</b><span>{d === 0 ? "موعد المقابلة اليوم" : d === 1 ? "يوم واحد على المقابلة" : `${d <= 10 ? "أيام" : "يومًا"} على المقابلة`}</span></div>}
    <div style={{ fontSize: 13, marginTop: 8, color: "#334155" }}>{role === "t" ? "اضغط لعرض الأهداف والمتطلبات والمحاور المفوضة إليك" : "اضغط للاطلاع والتوقيع على المحضر"}</div></div>; };
  return <>
    <div className="iv-hero"><div><h2>🤝 مقابلاتي</h2><p>مواعيد لقاءاتك مع إدارة المدرسة، وأهدافها ومتطلباتها، والمحاور التي فُوضت إليك، والتغذية الراجعة بعد اللقاء.</p></div></div>
    <div style={{ marginTop: 12 }}>{mine.map(r => <Card key={r.id} r={r} role="t" />)}{part.map(r => <Card key={r.id} r={r} role="p" />)}{!mine.length && !part.length && <div className="iv-card" style={{ color: "#64748b" }}>لا توجد مقابلات مجدولة لك حاليًا.</div>}</div>
  </>;
}

// ── صفحة المقابلة
function Meeting({ r, me, admin, api, C, save, say, onBack, onDel }) {
  const isT = sameName(r.t, me.name), pIdx = arr(r.parts).findIndex(p => sameName(p.n, me.name)), parts = arr(r.parts);
  const [d, setD] = useState(() => JSON.parse(JSON.stringify({ sec: {}, reqOk: {}, fb: {}, sg: {}, ...r })));
  const [sig, setSig] = useState({}), [pad, setPad] = useState(null), [dirty, setDirty] = useState(false);
  useEffect(() => { api.maGet(`${N.SG}/${r.id}`).then(x => setSig(obj(x))); }, [r.id]);
  const td = useMemo(() => C ? teacherData(r.t, C, api) : null, [C, r.t]);
  const canSec = k => admin || (isT && obj(d.deleg)[k] && d.st === "plan");
  const set = (path, v) => { setD(x => { const o = JSON.parse(JSON.stringify(x)); let p = o; const ks = path.split("."); ks.slice(0, -1).forEach(k => { p[k] = obj(p[k]); p = p[k]; }); p[ks[ks.length - 1]] = v; return o; }); setDirty(true); };
  const persist = async (extra) => { const o = { ...d, ...(extra || {}) }; delete o.sg; o.sg = Object.fromEntries(Object.keys(sig).map(k => [k, 1])); await save(o); setD(x => ({ ...x, ...(extra || {}) })); setDirty(false); say("حُفظ ✓"); };
  const who = [{ k: "p", n: admin ? (me.name || "مدير المدرسة") : (d.by || "مدير المدرسة"), r: "مدير المدرسة" }, { k: "t", n: r.t, r: "المعلم" }, ...parts.map((p, i) => ({ k: "x" + i, n: p.n, r: p.r }))];
  const mayKey = k => admin ? true : (k === "t" && isT) || (k === "x" + pIdx);
  const sign = async (k, img) => { const v = { img, at: Date.now(), n: who.find(w => w.k === k).n }; await api.maPut(`${N.SG}/${r.id}/${k}`, v); const ns = { ...sig, [k]: v }; setSig(ns); setPad(null);
    const all = who.every(w => ns[w.k]); const o = { ...d, sg: Object.fromEntries(Object.keys(ns).map(x => [x, 1])), st: all ? "done" : d.st }; await save(o); setD(o); say(all ? "اكتملت التواقيع، وأصبح المحضر معتمدًا ✓" : "سُجّل التوقيع ✓"); };
  const st = ST[d.st] || ST.plan, idx = ivIndex(d), dd = daysTo(d.date);
  const DataRow = ({ k }) => { if (!td) return <div style={{ color: "#94a3b8", fontSize: 12.5 }}>⏳ جارٍ جمع بيانات المعلم...</div>;
    if (k === "perf") return <div className="iv-data"><div><b>{td.pf ? ar(td.pf.pct) + "٪" : "—"}</b><span>إنجاز ملف الأداء الوظيفي{td.pf ? ` (${ar(td.pf.tot)} شاهدًا)` : ""}</span></div><div><b>{td.vis ? `${ar(td.visDone)}/${ar(td.vis)}` : "—"}</b><span>الزيارات الصفية المنفذة</span></div><div><b>{td.absDays == null ? "—" : ar(td.absDays)}</b><span>أيام غياب مسجلة هذا العام</span></div><div><b>{ar(td.load)}{td.sb ? `+${ar(td.sb)}` : ""}</b><span>النصاب + الانتظار أسبوعيًا</span></div></div>;
    if (k === "rec") return <div className="iv-data"><div><b>{ar(td.recs)}</b><span>سجل درجات مرصود في الموقع</span></div><div><b>{td.types.length ? ar(td.types.length) : "—"}</b><span>أنواع التقويم: {td.types.join("، ") || "لا يوجد"}</span></div></div>;
    if (k === "lvl") return <><div className="iv-data"><div><b>{ar(td.n)}</b><span>طالبًا مقيَّمًا</span></div><div><b>{td.avg == null ? "—" : ar(Math.round(td.avg)) + "٪"}</b><span>متوسط الأداء</span></div><div><b style={{ color: "#dc2626" }}>{ar(td.dist[3] + td.dist[4])}</b><span>يحتاجون دعمًا أو متعثرون</span></div></div><SLBar d={td.dist} /></>;
    if (k === "imp") return <div className="iv-data"><div><b>{td.imp ? (td.imp.d >= 0 ? "+" : "−") + ar(Math.abs(Math.round(td.imp.d))) + "٪" : "—"}</b><span>متوسط التحسن من التشخيصي إلى الاختبارات اللاحقة{td.imp ? ` (${ar(td.imp.n)} طالبًا)` : ""}</span></div><div><b>{td.imp ? ar(td.imp.up) : "—"}</b><span>طلاب تحسنوا بوضوح</span></div><div><b>{ar(td.rem)}</b><span>برامج علاجية أنشأها المعلم{td.rem ? ` (مكتمل ${ar(td.remSt)})` : ""}</span></div></div>;
    return null; };
  const Section = ({ s }) => { const v = obj(obj(d.sec)[s.k]), can = canSec(s.k), adm = admin, tCan = isT && obj(d.deleg)[s.k];
    return <div className="iv-sec"><div className="iv-sh"><span className="ic">{s.ic}</span><div style={{ flex: 1 }}><b>المحور {ar(s.n)}: {s.t}</b><small>{obj(d.deleg)[s.k] ? "✍️ مفوَّض للمعلم بالكتابة قبل اللقاء" : "يكتبه المدير أثناء اللقاء"}</small></div><LvTag v={+v.r || 0} /></div>
      <div className="iv-sb">
        {DataRow({ k: s.k })}
        <div><span className="iv-lb">محاور النقاش</span><div>{s.q.map((q, i) => { const on = obj(v.ck)[i]; return <span key={i} className={"iv-chip" + (on ? " on" : "")} onClick={() => adm && set(`sec.${s.k}.ck.${i}`, !on)} style={{ cursor: adm ? "pointer" : "default" }}>{on ? "✓ " : "○ "}{q}</span>; })}</div></div>
        {s.k === "rec" && <div><span className="iv-lb">توفر سجل التقويم</span><div className="iv-row">{[["y", "متوفر ومحدّث", "#15803d"], ["p", "متوفر جزئيًا", "#b45309"], ["n", "غير متوفر", "#b91c1c"]].map(([k, t, c]) => <button key={k} className="iv-btn" disabled={!adm} style={v.av === k ? { background: c, color: "#fff", borderColor: c } : null} onClick={() => set(`sec.rec.av`, v.av === k ? "" : k)}>{t}</button>)}</div></div>}
        {s.k === "plan" && <div className="iv-grid"><label><span className="iv-lb">الدرس المقرر حسب التوزيع</span><input className="iv-in" disabled={!can} value={v.pl || ""} onChange={e => set("sec.plan.pl", e.target.value)} placeholder="مثال: الوحدة ٣ — الدرس ٢" /></label><label><span className="iv-lb">الدرس الذي وصل إليه فعليًا</span><input className="iv-in" disabled={!can} value={v.ac || ""} onChange={e => set("sec.plan.ac", e.target.value)} /></label><label><span className="iv-lb">الحالة</span><select className="iv-sel" disabled={!can} value={v.ps || ""} onChange={e => set("sec.plan.ps", e.target.value)}><option value="">—</option><option value="on">مطابق للتوزيع</option><option value="ah">متقدم على التوزيع</option><option value="bh1">متأخر حصة إلى حصتين</option><option value="bh2">متأخر أكثر من أسبوع</option></select></label></div>}
        {tCan && <label><span className="iv-lb">✍️ ما كتبه المعلم</span>{isT && can ? <textarea className="iv-ta" value={v.tn || ""} onChange={e => set(`sec.${s.k}.tn`, e.target.value)} placeholder="اكتب واقعك في هذا المحور بإيجاز وبالأرقام إن أمكن، وما تحتاجه من دعم." /> : <div className="iv-tn">{v.tn || <span style={{ color: "#94a3b8" }}>لم يكتب المعلم بعد.</span>}</div>}</label>}
        {adm ? <><span className="iv-lb">تقدير المحور (سلم الأداء الخماسي)</span><Scale v={+v.r || 0} on={n => set(`sec.${s.k}.r`, n)} /><label><span className="iv-lb">ملاحظات الإدارة</span><textarea className="iv-ta" value={v.n || ""} onChange={e => set(`sec.${s.k}.n`, e.target.value)} placeholder="ما لوحظ في اللقاء، والأدلة، وما اتُّفق عليه" /></label></>
          : v.n ? <div className="iv-tn" style={{ background: "#f8fafc", borderColor: "#e2e8f0" }}><b>ملاحظات الإدارة:</b> {v.n}</div> : null}
      </div></div>; };
  return <div>
    <button className="iv-btn" onClick={onBack} style={{ marginBottom: 10 }}>→ رجوع</button>
    <div className="iv-hero"><div style={{ flex: "1 1 280px" }}><h2>{isT && !admin ? "مقابلتي مع إدارة المدرسة" : `مقابلة أ/ ${r.t}`}</h2><p>📅 {hij(d.date)}{d.time ? ` • ⏰ ${d.time}` : ""}{d.place ? ` • 📍 ${d.place}` : ""}</p><p>{td ? `${td.spec.slice(0, 2).join("، ") || "—"} • ${td.pairs.map(p => api.className ? api.className(p.ck) : p.ck).filter((x, i, a) => a.indexOf(x) === i).join("، ")}` : ""}</p></div>
      <div style={{ display: "grid", gap: 6, justifyItems: "end" }}><span className="iv-st" style={{ background: st[2], color: st[1], fontSize: 13 }}>{st[0]}</span>{idx != null && <span className="iv-st" style={{ background: "rgba(255,255,255,.15)", color: "#fff", fontSize: 13 }}>تقدير اللقاء {ar(Math.round(idx * 10) / 10)} من ٥</span>}<button className="iv-btn g" onClick={() => printIv(d, sig, td, api, who)}>🖨 طباعة المحضر</button></div></div>
    {d.st === "plan" && dd >= 0 && <div className="iv-cd" style={{ margin: "10px 0" }}><b>{dd === 0 ? "اليوم" : ar(dd)}</b><span>{dd === 0 ? "موعد المقابلة اليوم" : dd === 1 ? "يوم واحد على المقابلة" : `${dd <= 10 ? "أيام" : "يومًا"} على المقابلة`}</span></div>}
    {d.note && <div className="iv-tn" style={{ margin: "10px 0" }}><b>رسالة الإدارة:</b> {d.note}</div>}
    <div className="iv-grid" style={{ marginTop: 10 }}>
      <div className="iv-card"><h3>🎯 أهداف المقابلة</h3><ol style={{ margin: 0, paddingInlineStart: 20, lineHeight: 1.9, fontSize: 14 }}>{arr(d.goals).map((g, i) => <li key={i}>{g}</li>)}</ol></div>
      <div className="iv-card"><h3>📎 المتطلبات</h3>{arr(d.reqs).map((g, i) => { const on = obj(d.reqOk)[i]; return <div key={i} className="iv-row" style={{ padding: "4px 0", borderBottom: "1px dashed #eef2f7" }}><button className={"iv-chip" + (on ? " on" : "")} disabled={!(isT || admin)} onClick={() => { set(`reqOk.${i}`, !on); }}>{on ? "✓ جاهز" : "○ لم يُجهز"}</button><span style={{ fontSize: 14 }}>{g}</span></div>; })}{isT && <p style={{ fontSize: 12, color: "#64748b", margin: "6px 0 0" }}>علّم ما جهّزته، ثم اضغط «حفظ» أسفل الصفحة.</p>}</div>
      <div className="iv-card"><h3>👥 المشاركون</h3>{who.map(w => <div key={w.k} className="iv-row" style={{ justifyContent: "space-between", padding: "4px 0", borderBottom: "1px dashed #eef2f7", fontSize: 14 }}><span><b>{w.n}</b> <span style={{ color: "#64748b", fontSize: 12.5 }}>— {w.r}</span></span>{sig[w.k] ? <span className="iv-st" style={{ background: "#dcfce7", color: "#15803d" }}>✓ وقّع</span> : <span className="iv-st" style={{ background: "#f1f5f9", color: "#94a3b8" }}>لم يوقّع</span>}</div>)}</div>
    </div>
    {(admin || isT || pIdx >= 0) && <>
      {admin && td && <div className="iv-card"><h3>🪪 بطاقة المعلم</h3><div className="iv-data"><div><b style={{ fontSize: 15 }}>{td.spec[0] || "—"}</b><span>التخصص (من الجدول)</span></div><div><b>{ar(td.load)}</b><span>حصة أسبوعيًا</span></div><div><b>{ar(new Set(td.pairs.map(p => p.ck)).size)}</b><span>فصول يدرّسها</span></div><div><b>{td.avg == null ? "—" : ar(Math.round(td.avg)) + "٪"}</b><span>متوسط طلابه</span></div></div>
        <div style={{ overflowX: "auto", marginTop: 8 }}><table className="iv-tbl"><thead><tr><th>الفصل</th><th>المادة</th><th>الحصص</th></tr></thead><tbody>{td.pairs.map(p => <tr key={p.ck + p.s}><td>{api.className ? api.className(p.ck) : p.ck}</td><td>{p.s}</td><td>{ar(p.n)}</td></tr>)}</tbody></table></div></div>}
      {SEC.map(s => <React.Fragment key={s.k}>{Section({ s })}</React.Fragment>)}
      <div className="iv-card" style={{ borderTop: `4px solid ${GOLD}` }}><h3>💬 التغذية الراجعة من الإدارة</h3>
        {admin ? <div className="iv-grid">{[["str", "نقاط القوة"], ["imp", "فرص التحسين"], ["rec", "التوصيات والدعم المقدم"]].map(([k, t]) => <label key={k}><span className="iv-lb">{t}</span><textarea className="iv-ta" value={obj(d.fb)[k] || ""} onChange={e => set(`fb.${k}`, e.target.value)} /></label>)}<label><span className="iv-lb">موعد لقاء المتابعة</span><input type="date" className="iv-in" value={obj(d.fb).fu || ""} onChange={e => set("fb.fu", e.target.value)} /></label></div>
          : d.st !== "plan" && (obj(d.fb).str || obj(d.fb).imp || obj(d.fb).rec) ? <div className="iv-grid">{[["str", "✅ نقاط القوة", "#ecfdf5"], ["imp", "🔧 فرص التحسين", "#fffbeb"], ["rec", "🤝 التوصيات والدعم", "#eff6ff"]].map(([k, t, bg]) => d.fb[k] ? <div key={k} style={{ background: bg, borderRadius: 12, padding: 10, fontSize: 14, lineHeight: 1.8 }}><b>{t}</b><div>{d.fb[k]}</div></div> : null)}{d.fb.fu && <div style={{ fontWeight: 800 }}>📅 لقاء المتابعة: {hij(d.fb.fu)}</div>}</div> : <p style={{ color: "#94a3b8", margin: 0 }}>تظهر التغذية الراجعة هنا بعد اللقاء.</p>}
      </div>
      <div className="iv-row" style={{ position: "sticky", bottom: 8, background: "rgba(255,255,255,.9)", padding: 8, borderRadius: 14, border: "1px solid #e2e8f0", zIndex: 4 }}>
        <button className="iv-btn p" disabled={!dirty} onClick={() => persist()}>💾 حفظ{dirty ? " التعديلات" : ""}</button>
        {admin && d.st === "plan" && <button className="iv-btn g" onClick={() => persist({ st: "held", heldAt: Date.now() })}>✔ اعتماد عقد اللقاء وطلب التواقيع</button>}
        {admin && <button className="iv-btn d" onClick={async () => { if (!window.confirm("حذف المقابلة نهائيًا؟")) return; await api.maPut(`${N.I}/${r.id}`, null); await api.maPut(`${N.SG}/${r.id}`, null); onDel(r.id); }}>حذف</button>}
      </div>
      <div className="iv-card" style={{ marginTop: 12 }}><h3>✍️ التوقيع الإلكتروني على المحضر</h3>
        {d.st === "plan" ? <p style={{ color: "#64748b", margin: 0 }}>يُفتح التوقيع بعد أن تعتمد الإدارة عقد اللقاء.</p> : <div className="iv-sig">{who.map(w => <div key={w.k} className="iv-sgc"><div className="n">{w.n}</div><div className="r">{w.r}</div>
          {sig[w.k] ? <><img src={sig[w.k].img} alt="" /><div className="r">{new Date(sig[w.k].at).toLocaleString("ar-SA", { dateStyle: "medium", timeStyle: "short" })}</div></>
            : pad === w.k ? <SigPad onSave={img => sign(w.k, img)} onCancel={() => setPad(null)} /> : mayKey(w.k) ? <button className="iv-btn p" style={{ marginTop: 8 }} onClick={() => setPad(w.k)}>توقيع</button> : <div className="r" style={{ marginTop: 8 }}>بانتظار التوقيع</div>}</div>)}</div>}
        {d.st === "held" && admin && <p style={{ fontSize: 12, color: "#64748b", margin: "8px 0 0" }}>يوقّع كل مشارك من حسابه، أو يوقّع هنا مباشرة على جهازك أثناء اللقاء.</p>}
      </div>
    </>}
  </div>;
}

// ── محضر المقابلة للطباعة
function printIv(d, sig, td, api, who) {
  const cls = ck => api.className ? api.className(ck) : ck, lv = v => v ? `<span class="lv" style="background:${LV[v][2]};color:${LV[v][1]}">${ar(v)} — ${LV[v][0]}</span>` : `<span class="lv" style="color:#94a3b8">—</span>`;
  const idx = ivIndex(d);
  const secH = SEC.map(s => { const v = obj(obj(d.sec)[s.k]); const ck = s.q.map((q, i) => `<span class="${obj(v.ck)[i] ? "ok" : ""}">${obj(v.ck)[i] ? "✓" : "○"} ${esc(q)}</span>`).join("");
    let ex = ""; if (s.k === "rec" && v.av) ex = `<p><b>توفر السجل:</b> ${{ y: "متوفر ومحدّث", p: "متوفر جزئيًا", n: "غير متوفر" }[v.av]}</p>`;
    if (s.k === "plan" && (v.pl || v.ac || v.ps)) ex = `<p><b>المقرر:</b> ${esc(v.pl || "—")} • <b>الفعلي:</b> ${esc(v.ac || "—")} • <b>الحالة:</b> ${{ on: "مطابق للتوزيع", ah: "متقدم على التوزيع", bh1: "متأخر حصة إلى حصتين", bh2: "متأخر أكثر من أسبوع" }[v.ps] || "—"}</p>`;
    if (s.k === "lvl" && td && td.n) { const t = td.dist.reduce((a, b) => a + b, 0); ex = `<div class="sl">${td.dist.map((n, i) => n ? `<i style="width:${n / t * 100}%;background:${SL[i][2]}">${n / t >= .07 ? ar(n) : ""}</i>` : "").join("")}</div><div class="lg">${SL.map((x, i) => `<span><i style="background:${x[2]}"></i>${x[0]}: ${ar(td.dist[i])}</span>`).join("")}</div>`; }
    if (s.k === "imp" && td && td.imp) ex = `<p><b>متوسط التحسن:</b> ${td.imp.d >= 0 ? "+" : "−"}${ar(Math.abs(Math.round(td.imp.d)))}٪ لـ ${ar(td.imp.n)} طالبًا • <b>برامج علاجية:</b> ${ar(td.rem)}</p>`;
    return `<div class="sec"><div class="sh"><b>${s.ic} المحور ${ar(s.n)}: ${esc(s.t)}</b>${lv(+v.r || 0)}</div><div class="ck">${ck}</div>${ex}${v.tn ? `<p class="tn"><b>ما كتبه المعلم:</b> ${esc(v.tn)}</p>` : ""}${v.n ? `<p><b>ملاحظات الإدارة:</b> ${esc(v.n)}</p>` : ""}</div>`; }).join("");
  const fb = obj(d.fb);
  const html = `<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>محضر مقابلة — ${esc(d.t)}</title><style>
  @page{size:A4;margin:11mm}body{font-family:Tajawal,Arial,sans-serif;color:#0f172a;font-size:12.5px;-webkit-print-color-adjust:exact;print-color-adjust:exact;margin:0}
  .hd{display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid ${GOLD};padding-bottom:6px}.hd img{height:56px}.hd .c{text-align:center;color:${NAVY}}.hd h1{margin:0;font-size:20px}
  table.i{width:100%;border-collapse:collapse;margin:8px 0}table.i td{border:1px solid #cbd5e1;padding:5px 7px}table.i td.k{background:#f4ead2;font-weight:800;color:${NAVY};width:16%}
  h3{color:${NAVY};font-size:14px;margin:10px 0 4px;border-inline-start:4px solid ${GOLD};padding-inline-start:6px}
  .sec{border:1px solid #e2e8f0;border-radius:8px;padding:6px 9px;margin:6px 0;break-inside:avoid}.sh{display:flex;justify-content:space-between;align-items:center;color:${NAVY}}.lv{border-radius:99px;padding:1px 9px;font-weight:800;font-size:11.5px}
  .ck span{display:inline-block;margin:2px 6px 2px 0;font-size:11.5px;color:#64748b}.ck span.ok{color:#15803d;font-weight:800}.sec p{margin:4px 0;line-height:1.7}.tn{background:#eff6ff;border-radius:6px;padding:3px 6px}
  .sl{display:flex;height:16px;border-radius:6px;overflow:hidden;margin-top:4px}.sl i{color:#fff;font-style:normal;font-size:10px;text-align:center;font-weight:800}.lg span{margin-inline-end:10px;font-size:11px}.lg i{display:inline-block;width:9px;height:9px;border-radius:2px;margin-inline-end:3px}
  .fb{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px}.fb div{border:1px solid #e2e8f0;border-radius:8px;padding:6px;line-height:1.7}.fb b{color:${NAVY}}
  .sg{display:grid;grid-template-columns:repeat(${Math.min(4, who.length)},1fr);gap:6px;margin-top:6px}.sg div{border:1px solid #cbd5e1;border-radius:8px;text-align:center;padding:5px;min-height:96px;break-inside:avoid}.sg img{height:46px;max-width:100%;object-fit:contain}.sg small{display:block;color:#64748b;font-size:10.5px}
  ol{margin:2px 0;padding-inline-start:18px;line-height:1.7}</style></head><body>
  <div class="hd">${api.moeLogo ? `<img src="${api.moeLogo}">` : "<span></span>"}<div class="c"><h1>محضر مقابلة معلم</h1><div>${esc(api.school || "")}</div></div>${api.logo ? `<img src="${api.logo}">` : "<span></span>"}</div>
  <table class="i"><tr><td class="k">المعلم</td><td>${esc(d.t)}</td><td class="k">التخصص</td><td>${esc((td && td.spec[0]) || d.spec || "—")}</td></tr>
  <tr><td class="k">التاريخ</td><td>${esc(hij(d.date))}${d.time ? ` • ${esc(d.time)}` : ""}</td><td class="k">المكان</td><td>${esc(d.place || "—")}</td></tr>
  <tr><td class="k">الفصول</td><td>${td ? esc([...new Set(td.pairs.map(p => cls(p.ck)))].join("، ")) : "—"}</td><td class="k">تقدير اللقاء</td><td><b>${idx == null ? "—" : ar(Math.round(idx * 10) / 10) + " من ٥"}</b></td></tr></table>
  <h3>أهداف المقابلة</h3><ol>${arr(d.goals).map(g => `<li>${esc(g)}</li>`).join("")}</ol>
  <h3>محاور المقابلة</h3>${secH}
  <h3>التغذية الراجعة من الإدارة</h3><div class="fb"><div><b>نقاط القوة</b><br>${esc(fb.str || "—")}</div><div><b>فرص التحسين</b><br>${esc(fb.imp || "—")}</div><div><b>التوصيات والدعم</b><br>${esc(fb.rec || "—")}</div></div>${fb.fu ? `<p><b>موعد لقاء المتابعة:</b> ${esc(hij(fb.fu))}</p>` : ""}
  <h3>التواقيع</h3><div class="sg">${who.map(w => `<div><b>${esc(w.n)}</b><small>${esc(w.r)}</small>${sig[w.k] ? `<img src="${sig[w.k].img}"><small>${new Date(sig[w.k].at).toLocaleDateString("ar-SA-u-ca-islamic-umalqura")}</small>` : "<small style='margin-top:26px'>..................</small>"}</div>`).join("")}</div>
  <script>onload=()=>setTimeout(()=>print(),400)<\/script></body></html>`;
  const w = window.open("", "_blank"); if (!w) { alert("اسمح بالنوافذ المنبثقة للطباعة"); return; } w.document.write(html); w.document.close();
}
