// ═════════════════════════════════════════════════════════════════
// 📚 سجل التحصيل الدراسي — خطة تحسين التحصيل ونواتج التعلم
// غلاف، قرار تشكيل لجنة التحصيل الدراسي، الأهداف، حصر الواقع بالأرقام من كل نتائج الموقع
// (الدرجات بأنواعها، نافس، القراءة، المهارات)، تصنيف الطلاب، أساليب المعالجة، الخطة العلاجية التنفيذية،
// المتابعة والتقويم، واطلاع فريق العمل وتوقيعه إلكترونيًا.
// school-ach/{year} الإعدادات والتعديلات • school-ach-sig/{year}/{k} التواقيع
// ═════════════════════════════════════════════════════════════════
import React, { useState, useEffect, useMemo, useRef } from "react";
import { cmdLoadAll, cmdCompute, cmdSkillAgg, cmdSkLbl, CMD_DEF, CMD_N } from "./Command.jsx";

const NAVY = "#0b2545", GOLD = "#c9a227", N = { A: "school-ach", SG: "school-ach-sig", SN: "school-ach-snap" };
const wkStart = (d = new Date()) => { const x = new Date(d); x.setDate(x.getDate() - x.getDay()); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`; };
const wkLbl = k => { try { const [y, m, d] = String(k).split("-").map(Number); return new Date(y, m - 1, d, 12).toLocaleDateString("ar-SA-u-ca-islamic-umalqura", { day: "numeric", month: "long" }); } catch { return k; } };
const sk = k => String(k).replace(/[.#$\[\]\/]/g, "_");
const ar = n => String(n ?? "").replace(/\d/g, x => "٠١٢٣٤٥٦٧٨٩"[x]);
const obj = v => (v && typeof v === "object" ? v : {});
const arr = v => Array.isArray(v) ? v.filter(x => x != null) : v && typeof v === "object" ? Object.values(v) : [];
const avg = L => { const a = L.filter(v => v != null && isFinite(v)); return a.length ? a.reduce((s, v) => s + v, 0) / a.length : null; };
const rnd = v => v == null ? null : Math.round(v);
const pc = (a, b) => b ? Math.round(a / b * 100) : 0;
const esc = t => String(t ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const nw = (n, one, two, few, many) => n === 1 ? one : n === 2 ? two : `${ar(n)} ${n >= 3 && n <= 10 ? few : many}`;
const hYear = () => { try { const t = new Date(); const y = t.getMonth() >= 7 ? t.getFullYear() : t.getFullYear() - 1; return new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", { year: "numeric" }).format(new Date(y, 8, 1)).replace(/\D/g, ""); } catch { return "1448"; } };
const hToday = () => { try { return new Date().toLocaleDateString("ar-SA-u-ca-islamic-umalqura", { day: "numeric", month: "long", year: "numeric" }); } catch { return ""; } };
const kOf = s => String(s || "").trim().replace(/\s+/g, "_").replace(/[.#$\[\]\/]/g, "");

// مقياس مستويات التحصيل للطالب
const SL = [["متقدم", 90, "#15803d"], ["متمكن", 75, "#0d9488"], ["متوسط", 60, "#2563eb"], ["يحتاج دعمًا", 50, "#d97706"], ["متعثر", 0, "#dc2626"]];
const slOf = p => SL.findIndex(s => p >= s[1]);
// مستويات أداء المدارس (وزارة التعليم)
const BAND = p => p == null ? null : p >= 90 ? ["التميز", "استدامة وابتكار — خطة استدامة", "#15803d"] : p >= 75 ? ["التقدم", "تحسين مستمر — خطة تحسين من المدرسة", "#0d9488"] : p >= 50 ? ["الانطلاق", "دعم مخطط — خطة تحسين بمتابعة المكتب", "#d97706"] : ["التهيئة", "تدخلات جوهرية — خطة طوارئ", "#dc2626"];
const colP = v => v == null ? "#94a3b8" : v >= 85 ? "#15803d" : v >= 75 ? "#0d9488" : v >= 60 ? "#2563eb" : v >= 50 ? "#d97706" : "#dc2626";

const TEAM0 = [
  { n: "", r: "مدير المدرسة", t: "رئيس اللجنة: اعتماد الخطة ومتابعة تنفيذها ومناقشة تقارير التحصيل وإقرار التوصيات" },
  { n: "", r: "وكيل الشؤون التعليمية", t: "نائب الرئيس: تحليل النتائج ومتابعة الخطط العلاجية والإثرائية مع المعلمين" },
  { n: "", r: "وكيل شؤون الطلاب", t: "متابعة الغياب والتأخر وأثرهما في التحصيل والتواصل مع الأسر" },
  { n: "", r: "الموجه الطلابي", t: "دراسة حالات المتعثرين وتنمية الدافعية وإرشاد الطلاب وأولياء الأمور" },
  { n: "", r: "معلم خبير / متقدم", t: "دعم المعلمين مهنيًا وقيادة مجتمعات التعلم حول الفجوات التعليمية" },
  { n: "", r: "معلم الرياضيات", t: "تشخيص مهارات الرياضيات وتنفيذ البرامج العلاجية والإثرائية" },
  { n: "", r: "معلم العلوم", t: "تشخيص مهارات العلوم وتنفيذ البرامج العلاجية والإثرائية" },
  { n: "", r: "معلم لغتي", t: "تنمية القراءة والكتابة والفهم القرائي ومتابعة برنامج القراءة" },
  { n: "", r: "معلم اللغة الإنجليزية", t: "تشخيص مهارات اللغة وتنفيذ البرامج العلاجية" },
  { n: "", r: "مقرر اللجنة", t: "توثيق المحاضر والقرارات وحفظ الشواهد ومتابعة المؤشرات" },
];
const METH = [
  ["متعثر (دون ٥٠٪)", "#dc2626", ["خطة علاجية فردية بأهداف أسبوعية قابلة للقياس", "مجموعات علاجية صغيرة (٤–٦ طلاب) في حصص النشاط والانتظار", "إعادة تعليم المهارات الأساسية بأمثلة محسوسة ومتدرجة", "تعلم بالأقران: طالب متميز لكل متعثر", "اختبار قصير كل أسبوعين لقياس التحسن", "دراسة حالة مع الموجه الطلابي واستدعاء ولي الأمر"]],
  ["يحتاج دعمًا (٥٠–٥٩٪)", "#d97706", ["واجبات متمايزة حسب المهارة الأضعف", "أوراق عمل علاجية قصيرة ومتابعة حلها", "التغذية الراجعة الفورية داخل الحصة", "توظيف منصة مدرستي وقنوات عين للمراجعة"]],
  ["متوسط (٦٠–٧٤٪)", "#2563eb", ["تعلم تعاوني في مجموعات غير متجانسة", "تدريبات على نماذج اختبارات نافس والاختبارات القصيرة", "تعزيز مهارات التفكير وحل المشكلات", "خطة شخصية لرفع المستوى درجة واحدة"]],
  ["متمكن ومتقدم (٧٥٪ فأكثر)", "#15803d", ["برامج إثرائية ومسابقات علمية (أولمبياد، موهبة)", "مهام تحدٍّ ومشروعات بحثية قصيرة", "إشراكهم قادة في التعلم بالأقران", "تكريم وتحفيز ونشر قصص النجاح"]],
];
const GEN = ["تخصيص ٥–١٠ دقائق في نهاية كل حصة للتدريب على القراءة والكتابة وتصويب الأخطاء (توجيه وزاري)", "مجتمعات تعلم مهنية شهرية لتحليل النتائج وتبادل الاستراتيجيات الفاعلة", "شراكة مع الأسرة: رسائل دورية بالمستوى وخطوات الدعم المنزلي", "برنامج تنمية الدافعية للتعلم وتعزيز الانضباط والحضور"];

const CSS = `
.ar-x{direction:rtl;color:#0f172a;font-family:inherit}.ar-pg,.ar-pg *{box-sizing:border-box}
.ar-bar{position:sticky;top:0;z-index:6;display:flex;flex-wrap:wrap;gap:8px;align-items:center;background:linear-gradient(90deg,${NAVY},#13315c);color:#fff;padding:10px 14px;border-radius:16px;margin-bottom:12px;border-bottom:3px solid ${GOLD}}
.ar-bar b{font-size:16px}.ar-bar small{opacity:.8}
.ar-btn{font-family:inherit;font-weight:800;border-radius:12px;border:1px solid #cbd5e1;background:#fff;color:${NAVY};padding:7px 13px;cursor:pointer;min-height:38px}
.ar-btn.g{background:${GOLD};border-color:${GOLD}}.ar-btn.p{background:${NAVY};color:#fff;border-color:${NAVY}}
.ar-nav{display:flex;gap:6px;overflow-x:auto;margin:0 0 12px;padding-bottom:2px}.ar-nav button{flex:none;font-family:inherit;font-weight:800;font-size:12.5px;border:1px solid #cbd5e1;background:#fff;border-radius:999px;padding:6px 12px;cursor:pointer;color:#334155}
.ar-set{background:#fff;border:2px solid ${GOLD};border-radius:16px;padding:14px;margin-bottom:14px}
.ar-set h3{margin:0 0 8px;color:${NAVY}}.ar-in{font-family:inherit;font-size:13.5px;border:1.5px solid #cbd5e1;border-radius:10px;padding:6px 8px;width:100%;background:#fff}
.ar-tg{display:grid;grid-template-columns:1.2fr 1fr 2fr 34px;gap:6px;margin-bottom:6px;align-items:center}
@media(max-width:700px){.ar-tg{grid-template-columns:1fr 1fr}.ar-tg .ar-in:nth-child(3){grid-column:1/-1}}
.ar-pages{display:grid;justify-content:center}
.ar-pg{width:794px;min-height:1123px;background:#fff;margin:0 auto 18px;box-shadow:0 6px 24px rgba(15,23,42,.12);padding:46px 46px 40px;position:relative;font-size:13px;line-height:1.7;overflow:hidden;color:#0f172a}
.ar-pg .ph{display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid ${GOLD};padding-bottom:6px;margin-bottom:14px;font-size:11px;color:#475569;font-weight:700}
.ar-pg .ph img{height:38px}.ar-pg .pf{position:absolute;bottom:16px;left:46px;right:46px;display:flex;justify-content:space-between;font-size:10.5px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:4px}
.ar-pg h2{font-size:19px;color:${NAVY};margin:0 0 4px;display:flex;align-items:center;gap:10px}.ar-pg h2 i{font-style:normal;background:${NAVY};color:${GOLD};width:34px;height:34px;border-radius:10px;display:grid;place-items:center;font-size:15px}
.ar-pg .sub{color:#64748b;font-size:12px;margin:0 0 12px}
.ar-pg h3{font-size:14.5px;color:${NAVY};margin:14px 0 6px;border-inline-start:4px solid ${GOLD};padding-inline-start:8px}
.ar-k{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:8px 0}.ar-k div{border:1px solid #e2e8f0;border-top:4px solid var(--c,${NAVY});border-radius:12px;padding:8px;text-align:center}.ar-k b{display:block;font-size:24px;color:var(--c,${NAVY});line-height:1.15}.ar-k span{font-size:11px;font-weight:800;color:#475569}
.ar-t{width:100%;border-collapse:collapse;font-size:12px;margin:4px 0}.ar-t th{background:${NAVY};color:#fff;padding:6px 5px;font-weight:800}.ar-t td{border:1px solid #e2e8f0;padding:5px;text-align:center}.ar-t td.r{text-align:start}.ar-t tr:nth-child(even) td{background:#fafbfc}
.ar-bars{display:grid;gap:5px}.ar-br{display:grid;grid-template-columns:120px 1fr 56px;gap:8px;align-items:center;font-size:12px;font-weight:700}.ar-br i{height:14px;background:#f1f5f9;border-radius:99px;overflow:hidden;display:block}.ar-br em{display:block;height:100%;border-radius:99px}
.ar-sl{display:flex;height:30px;border-radius:10px;overflow:hidden;margin:6px 0}.ar-sl i{display:grid;place-items:center;color:#fff;font-style:normal;font-weight:800;font-size:12px}
.ar-leg{display:flex;flex-wrap:wrap;gap:4px 14px;font-size:11.5px;font-weight:700}.ar-leg i{display:inline-block;width:11px;height:11px;border-radius:3px;margin-inline-end:4px;vertical-align:-1px}
.ar-box{border:1px solid #e2e8f0;border-radius:12px;padding:10px 12px;margin:6px 0;background:#fcfcfd}
.ar-note{background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:8px 10px;font-size:12px;margin:6px 0}
.ar-band{display:flex;gap:12px;align-items:center;border-radius:14px;padding:10px 14px;color:#fff;margin:8px 0}.ar-band b{font-size:22px}
.ar-gl{display:grid;gap:6px;counter-reset:g}.ar-gl div{display:grid;grid-template-columns:30px 1fr;gap:8px;align-items:start;border:1px solid #e2e8f0;border-radius:10px;padding:7px 9px}.ar-gl div:before{counter-increment:g;content:counter(g);background:${GOLD};color:${NAVY};font-weight:900;border-radius:8px;display:grid;place-items:center;height:26px}
.ar-mt{display:grid;grid-template-columns:1fr 1fr;gap:8px}.ar-mt>div{border-radius:12px;border:1px solid #e2e8f0;border-top:5px solid var(--c);padding:8px 10px}.ar-mt b{color:var(--c)}.ar-mt ul{margin:4px 0 0;padding-inline-start:18px;font-size:12px}
.ar-st{display:inline-block;border-radius:99px;padding:1px 8px;font-weight:800;font-size:11px}
.ar-sig{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}.ar-sgc{border:1px solid #cbd5e1;border-radius:10px;padding:6px 8px;min-height:84px;display:grid;grid-template-columns:1fr 130px;gap:6px;align-items:center}.ar-sgc img{max-width:130px;max-height:52px;object-fit:contain}.ar-sgc small{display:block;color:#64748b;font-size:10.5px}
.ar-cov{padding:0!important;background:${NAVY};color:#fff}
.ar-pad{touch-action:none;background:#fff;border:1.5px solid #94a3b8;border-radius:10px;width:100%;height:120px}
.ar-sel{font-family:inherit;font-size:11px;border:1px solid #cbd5e1;border-radius:8px;padding:2px 4px}
@media print{.ar-noprint{display:none!important}}
`;

// ─ توقيع
function SigPad({ onSave, onCancel }) {
  const c = useRef(null), dr = useRef(false), last = useRef(null), [has, setHas] = useState(false);
  useEffect(() => { const cv = c.current, r = cv.getBoundingClientRect(), k = window.devicePixelRatio || 1; cv.width = r.width * k; cv.height = r.height * k; const x = cv.getContext("2d"); x.scale(k, k); x.lineWidth = 2.3; x.lineCap = "round"; x.strokeStyle = NAVY; }, []);
  const pt = e => { const r = c.current.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  return <div><canvas ref={c} className="ar-pad" onPointerDown={e => { e.preventDefault(); c.current.setPointerCapture(e.pointerId); dr.current = true; last.current = pt(e); }} onPointerMove={e => { if (!dr.current) return; const p = pt(e), x = c.current.getContext("2d"); x.beginPath(); x.moveTo(...last.current); x.lineTo(...p); x.stroke(); last.current = p; setHas(true); }} onPointerUp={() => dr.current = false} onPointerLeave={() => dr.current = false} />
    <div style={{ display: "flex", gap: 6, marginTop: 4 }}><button className="ar-btn p" disabled={!has} onClick={() => { const cv = c.current, o = document.createElement("canvas"); o.width = 300; o.height = Math.round(300 * cv.height / cv.width); o.getContext("2d").drawImage(cv, 0, 0, o.width, o.height); onSave(o.toDataURL("image/png")); }}>اعتماد</button><button className="ar-btn" onClick={onCancel}>إلغاء</button></div></div>;
}

// ─ إحصاءات الدرجات من سجلات «رصد الدرجات»
function gradeStats(recs) {
  const st = {}; recs.forEach(r => { const mx = +r.max || 0; if (!mx) return; Object.entries(obj(r.marks)).forEach(([sid, v]) => { if (v === "غ" || v === "" || v == null || !isFinite(+v)) return; const k = r.ck + "|" + sid; const s = st[k] || (st[k] = { k, ck: r.ck, name: obj(r.names)[sid] || sid, L: [], sub: {}, dg: [], pe: [] }); const p = +v / mx * 100; s.L.push(p); (s.sub[r.subj || "عام"] = s.sub[r.subj || "عام"] || []).push(p); if (r.type === "تشخيصي") s.dg.push(p); else if (r.type === "اختبار فترة") s.pe.push(p); }); });
  const S = Object.values(st).map(s => ({ ...s, avg: avg(s.L), subA: Object.entries(s.sub).map(([k, v]) => [k, avg(v)]).sort((a, b) => a[1] - b[1]) })).filter(s => s.avg != null);
  const dist = [0, 0, 0, 0, 0]; S.forEach(s => dist[slOf(s.avg)]++);
  const grp = key => { const m = {}; S.forEach(s => { key(s).forEach(([k, p]) => { (m[k] = m[k] || []).push(p); }); }); return Object.entries(m).map(([k, L]) => ({ k, n: L.length, avg: avg(L), ok: pc(L.filter(p => p >= 75).length, L.length), low: L.filter(p => p < 50).length })).sort((a, b) => a.avg - b.avg); };
  const bySub = grp(s => s.subA), byCls = grp(s => [[s.ck, s.avg]]);
  const both = S.filter(s => s.dg.length && s.pe.length), imp = both.length ? { n: both.length, dg: avg(both.map(s => avg(s.dg))), pe: avg(both.map(s => avg(s.pe))), up: both.filter(s => avg(s.pe) - avg(s.dg) > 2).length } : null;
  const types = {}; recs.forEach(r => { types[r.type || "أخرى"] = (types[r.type || "أخرى"] || 0) + 1; });
  return { S, dist, bySub, byCls, imp, types, avg: avg(S.map(s => s.avg)), ok: pc(S.filter(s => s.avg >= 75).length, S.length), low: S.filter(s => s.avg < 50).sort((a, b) => a.avg - b.avg), top: S.filter(s => s.avg >= 90).sort((a, b) => b.avg - a.avg) };
}

export function AchRecord({ api, me = {}, admin }) {
  const year = hYear();
  const [names, setNames] = useState([]), [snaps, setSnaps] = useState({}), [cmpW, setCmpW] = useState("");
  const [X, setX] = useState(null), [step, setStep] = useState(""), [err, setErr] = useState(""), [cfg, setCfg] = useState(null), [sig, setSig] = useState({}), [edit, setEdit] = useState(false), [pad, setPad] = useState(null), [msg, setMsg] = useState(""), [z, setZ] = useState(1);
  const wrap = useRef(null);
  const say = t => { setMsg(t); setTimeout(() => setMsg(""), 3000); };
  useEffect(() => { (async () => { try { const c0 = obj(await api.maGet(`${N.A}/${year}`)); setCfg({ year, dec: "", ...c0, goals: obj(c0.goals), rows: obj(c0.rows), extra: arr(c0.extra), team: arr(c0.team).length ? arr(c0.team) : TEAM0 }); setSig(obj(await api.maGet(`${N.SG}/${year}`))); setSnaps(obj(await api.maGet(N.SN))); if (api.names) api.names().then(L => setNames(L || [])).catch(() => {});
    const cc = { ...CMD_DEF, ...obj(await api.maGet(CMD_N.CFG)), per: "year" }; const d = await cmdLoadAll(api, cc, setStep); setX({ d, R: cmdCompute(d, cc) }); } catch (e) { setErr(String(e && e.message || e)); } })(); }, []);
  useEffect(() => { const f = () => { if (wrap.current) setZ(Math.min(1, (wrap.current.clientWidth - 4) / 794)); }; f(); window.addEventListener("resize", f); return () => window.removeEventListener("resize", f); }, [X]);
  const saveCfg = async c => { setCfg(c); await api.maPut(`${N.A}/${year}`, c); say("حُفظ ✓"); };
  const name = ck => api.maClassName ? api.maClassName(ck) : ck;
  const D = useMemo(() => { if (!X) return null; const { d, R } = X; const G = gradeStats(Object.values(obj(d.grAll)).filter(r => r && r.ck && r.marks));
    const L = R.list, nq = L.filter(s => s.N), rd = L.filter(s => s.R);
    const SK = Object.values(cmdSkillAgg(L)).filter(k => k.t >= 3).map(k => ({ ...k, p: pc(k.c, k.t) })).sort((a, b) => a.p - b.p);
    const nqA = avg(nq.map(s => s.N.p)), rdA = avg(rd.map(s => s.R.score)), rdLow = rd.filter(s => s.R.score < 60).length;
    const iv = arr(d.iv), rem = iv.filter(v => /علاج/.test(v.title || "")), enr = iv.filter(v => /إثرا/.test(v.title || ""));
    return { G, L, nq, rd, SK, nqA, rdA, rdLow, iv, rem, enr, nStu: L.length, att: avg(L.map(s => s.base && s.base.attPct)) };
  }, [X]);
  useEffect(() => { if (!D || !D.G.S.length) return; const wk = wkStart(), s = {}; D.G.S.forEach(x => { s[sk(x.k)] = Math.round(x.avg); }); const o = { at: Date.now(), avg: Math.round(D.G.avg * 10) / 10, ok: D.G.ok, low: D.G.low.length, n: D.G.S.length, s }; setSnaps(m => ({ ...m, [wk]: o })); if (admin) api.maPut(`${N.SN}/${wk}`, o); }, [D]);
  if (err) return <div className="ar-x"><style>{CSS}</style><div className="ar-set">⚠️ تعذّر تحميل البيانات: {err}</div></div>;
  if (!D || !cfg) return <div className="ar-x" style={{ padding: 30, textAlign: "center", fontWeight: 800, color: NAVY }}><style>{CSS}</style>⏳ جارٍ حصر الواقع الدراسي من بيانات الموقع… <div style={{ fontWeight: 600, color: "#64748b" }}>{step}</div></div>;
  const G = D.G, band = BAND(G.avg), targ = (b, d, mx = 98) => b == null ? null : Math.min(mx, Math.round(b + d));
  // الأهداف
  const goalsAuto = [
    G.avg != null && ["avg", `رفع متوسط التحصيل الدراسي العام من ${ar(rnd(G.avg))}٪ إلى ${ar(targ(G.avg, 5))}٪ بنهاية الفصل الدراسي.`],
    G.S.length && ["ok", `رفع نسبة الطلاب في مستوى «متمكن» فأكثر (٧٥٪ فأكثر) من ${ar(G.ok)}٪ إلى ${ar(targ(G.ok, 10, 100))}٪.`],
    G.low.length && ["low", `خفض عدد الطلاب المتعثرين (دون ٥٠٪) من ${ar(G.low.length)} إلى ${ar(Math.floor(G.low.length / 2))} طالبًا على الأكثر.`],
    G.bySub.filter(s => s.avg < 75).length && ["sub", `رفع متوسط المواد الأدنى (${G.bySub.filter(s => s.avg < 75).map(s => s.k).join("، ")}) إلى ٧٥٪ فأكثر.`],
    D.nqA != null && ["nq", `رفع متوسط أداء الطلاب في اختبارات نافس التدريبية من ${ar(rnd(D.nqA))}٪ إلى ${ar(targ(D.nqA, 10))}٪.`],
    D.rdA != null && ["rd", `رفع متوسط مهارة القراءة الجهرية من ${ar(rnd(D.rdA))} إلى ${ar(targ(D.rdA, 10, 100))} من ١٠٠، ومعالجة ${nw(D.rdLow, "طالب واحد", "طالبين", "طلاب", "طالبًا")} دون ٦٠.`],
    G.top.length && ["top", `تقديم برامج إثرائية لـ ${nw(G.top.length, "طالب متفوق", "طالبين متفوقين", "طلاب متفوقين", "طالبًا متفوقًا")} (٩٠٪ فأكثر) واستثمارهم في التعلم بالأقران.`],
    ["par", "إشراك أولياء أمور الطلاب المتعثرين في خطط الدعم بتواصل دوري موثق لا يقل عن مرة كل أسبوعين."],
  ].filter(Boolean);
  const goals = goalsAuto.map(([k, t]) => [k, cfg.goals[k] != null ? cfg.goals[k] : t]).filter(([, t]) => t);
  // الخطة العلاجية
  const rowsAuto = [];
  G.bySub.filter(s => s.avg < 75 || s.low >= 3).forEach(s => rowsAuto.push({ k: "s-" + kOf(s.k), gap: `تدني التحصيل في ${s.k}`, ev: `المتوسط ${ar(rnd(s.avg))}٪ • المتمكنون ${ar(s.ok)}٪ • المتعثرون ${ar(s.low)}`, act: "تشخيص المهارات المفقودة، ومجموعات علاجية أسبوعية، وخطط فردية للمتعثرين، واختبار قصير كل أسبوعين", tg: s.low || s.n, who: `معلمو ${s.k} — وكيل الشؤون التعليمية`, when: "٦ أسابيع", kpi: "المتوسط ٧٥٪ فأكثر وخفض المتعثرين للنصف" }));
  G.byCls.filter(c => G.avg != null && c.avg < G.avg - 5).slice(0, 3).forEach(c => rowsAuto.push({ k: "c-" + kOf(c.k), gap: `انخفاض التحصيل في الفصل ${name(c.k)}`, ev: `متوسط الفصل ${ar(rnd(c.avg))}٪ مقابل ${ar(rnd(G.avg))}٪ للمدرسة`, act: "لقاء معلمي الفصل لتوحيد الإجراءات، وتعزيز الانضباط الصفي، ومتابعة واجبات الطلاب، ولقاء أولياء الأمور", tg: c.n, who: "رائد الفصل — معلمو الفصل", when: "شهر", kpi: "تقليص الفجوة مع متوسط المدرسة" }));
  D.SK.slice(0, 3).filter(k => k.p < 60).forEach(k => rowsAuto.push({ k: "k-" + kOf(k.k), gap: `ضعف مهارة: ${cmdSkLbl(k.k)}`, ev: `نسبة الإتقان ${ar(k.p)}٪ لدى ${ar(k.n)} طالبًا`, act: "تدريب مركز على المهارة بأسئلة نافس المشابهة، وأوراق عمل متدرجة، وإعادة قياس", tg: k.n, who: "معلم المادة", when: "أسبوعان", kpi: "إتقان ٧٠٪ فأكثر" }));
  if (D.rdLow) rowsAuto.push({ k: "rd", gap: "ضعف القراءة الجهرية والفهم القرائي", ev: `${ar(D.rdLow)} طالبًا دون ٦٠ من ١٠٠ في اختبار القراءة`, act: "تخصيص ٥–١٠ دقائق نهاية كل حصة للقراءة والكتابة، وقراءة جهرية فردية أسبوعية، ونصوص متدرجة", tg: D.rdLow, who: "معلم لغتي — جميع المعلمين", when: "طوال الفصل", kpi: "خفض الضعاف في القراءة للنصف" });
  if (G.imp && G.imp.pe - G.imp.dg < 3) rowsAuto.push({ k: "imp", gap: "تحسن محدود بين التشخيصي واختبار الفترة", ev: `من ${ar(rnd(G.imp.dg))}٪ إلى ${ar(rnd(G.imp.pe))}٪ لـ ${ar(G.imp.n)} طالبًا`, act: "مراجعة الخطط العلاجية في مجتمع تعلم مهني، وتوجيه التدخل نحو المهارات الأضعف، وقياس قبلي وبعدي لكل تدخل", tg: G.imp.n, who: "لجنة التحصيل الدراسي", when: "شهر", kpi: "تحسن ٥ نقاط فأكثر" });
  if (G.low.length) rowsAuto.push({ k: "par", gap: "ضعف شراكة الأسرة في متابعة المتعثرين", ev: `${ar(G.low.length)} طالبًا متعثرًا`, act: "رسالة بالمستوى وخطة الدعم المنزلي، واستدعاء ولي الأمر عند عدم التحسن، ودراسة حالة مع الموجه الطلابي", tg: G.low.length, who: "الموجه الطلابي — وكيل شؤون الطلاب", when: "كل أسبوعين", kpi: "تواصل موثق ١٠٠٪" });
  if (G.top.length) rowsAuto.push({ k: "top", gap: "استثمار الطلاب المتفوقين", ev: `${ar(G.top.length)} طالبًا بمتوسط ٩٠٪ فأكثر`, act: "برامج إثرائية ومسابقات، وإشراكهم في التعلم بالأقران، وتكريم شهري", tg: G.top.length, who: "رائد النشاط — معلمو المواد", when: "طوال الفصل", kpi: "مشاركة ١٠٠٪ وتكريم شهري" });
  const rows = [...rowsAuto, ...cfg.extra.map((r, i) => ({ ...r, k: "x" + i, man: 1 }))];
  const stOf = k => obj(cfg.rows[k]).st || "", setRow = (k, f, v) => saveCfg({ ...cfg, rows: { ...cfg.rows, [k]: { ...obj(cfg.rows[k]), [f]: v } } });
  const team = cfg.team.filter(m => m.n || m.r), sgKey = m => kOf(m.n || m.r);
  const canSign = m => admin || (m.n && me.name && kOf(m.n) === kOf(me.name));
  const sign = async (m, img) => { const v = { img, at: Date.now(), n: m.n, r: m.r }; await api.maPut(`${N.SG}/${year}/${sgKey(m)}`, v); setSig(s => ({ ...s, [sgKey(m)]: v })); setPad(null); say("سُجّل الاطلاع والتوقيع ✓"); };
  const PH = ({ n, t }) => <><div className="ph">{api.moeLogo ? <img src={api.moeLogo} alt="" /> : <span />}<span>سجل التحصيل الدراسي — {api.school || ""} — العام الدراسي {ar(cfg.year)}هـ</span>{api.logo ? <img src={api.logo} alt="" /> : <span />}</div><div className="pf"><span>لجنة التحصيل الدراسي</span><span>{t}</span><span>صفحة {ar(n)}</span></div></>;
  const Bar = ({ L }) => <div className="ar-bars">{L.map(x => <div key={x.k} className="ar-br"><span>{x.lbl || x.k}</span><i><em style={{ width: `${Math.max(2, x.v || 0)}%`, background: colP(x.v) }} /></i><b style={{ color: colP(x.v) }}>{x.v == null ? "—" : ar(rnd(x.v)) + "٪"}</b></div>)}</div>;
  const SLB = ({ d }) => { const t = d.reduce((a, b) => a + b, 0) || 1; return <><div className="ar-sl">{d.map((n, i) => n ? <i key={i} style={{ width: `${n / t * 100}%`, background: SL[i][2] }}>{n / t > .06 ? `${ar(pc(n, t))}٪` : ""}</i> : null)}</div><div className="ar-leg">{SL.map((s, i) => <span key={i}><i style={{ background: s[2] }} />{s[0]}: <b>{ar(d[i])}</b></span>)}</div></>; };
  let pn = 0; const P = () => ++pn;
  const sections = [["cover", "الغلاف"], ["team", "فريق العمل"], ["goals", "الأهداف"], ["real1", "حصر الواقع (١)"], ["real2", "حصر الواقع (٢)"], ["cls", "تصنيف الطلاب"], ["week", "المتابعة الأسبوعية"], ["meth", "أساليب المعالجة"], ["plan", "الخطة العلاجية"], ["kpi", "المتابعة والتقويم"], ["sig", "الاطلاع والتوقيع"]];
  const go = id => { const el = document.getElementById("ar-" + id); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); };
  const doPrint = () => { const src = document.getElementById("ar-pages"), cl = src.cloneNode(true); const sel = src.querySelectorAll("select"); cl.querySelectorAll("select").forEach((s, i) => { const o = sel[i] && sel[i].selectedOptions[0]; const sp = document.createElement("span"); sp.className = "ar-st"; sp.textContent = o ? o.textContent : ""; s.replaceWith(sp); }); cl.querySelectorAll("button,.ar-noprint").forEach(b => b.remove()); const h = cl.innerHTML; const w = window.open("", "_blank"); if (!w) { alert("اسمح بالنوافذ المنبثقة للطباعة"); return; } w.document.write(`<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>سجل التحصيل الدراسي ${cfg.year}</title><style>${CSS}@page{size:A4;margin:0}body{margin:0;-webkit-print-color-adjust:exact;print-color-adjust:exact;font-family:Tajawal,'Noto Kufi Arabic',Tahoma,sans-serif}.ar-pg{box-shadow:none;margin:0;width:210mm;min-height:297mm;page-break-after:always;break-after:page}.ar-pages{display:block}.ar-noprint{display:none!important}</style></head><body><div class="ar-x"><div class="ar-pages">${h}</div></div><script>onload=()=>setTimeout(()=>print(),600)<\/script></body></html>`); w.document.close(); };
  const ST = { "": ["لم يبدأ", "#64748b", "#f1f5f9"], run: ["جارٍ", "#1d4ed8", "#dbeafe"], done: ["منفّذ", "#15803d", "#dcfce7"] };
  return <div className="ar-x"><style>{CSS}</style>
    <div className="ar-bar ar-noprint"><div style={{ flex: 1 }}><b>📚 سجل التحصيل الدراسي</b> <small>• يُحدّث تلقائيًا من نتائج الطلاب في الموقع • {nw(D.nStu, "طالب واحد", "طالبان", "طلاب", "طالبًا")}</small></div>
      {admin && <button className="ar-btn" onClick={() => setEdit(e => !e)}>{edit ? "إغلاق الإعدادات" : "⚙️ فريق العمل والأهداف"}</button>}<button className="ar-btn g" onClick={doPrint}>🖨 طباعة السجل</button></div>
    {msg && <div className="ar-note ar-noprint" style={{ position: "sticky", top: 62, zIndex: 5 }}>{msg}</div>}
    <div className="ar-nav ar-noprint">{sections.map(([k, l]) => <button key={k} onClick={() => go(k)}>{l}</button>)}</div>
    {edit && admin && <Settings cfg={cfg} goals={goalsAuto} onSave={saveCfg} names={names} />}
    <div ref={wrap} style={{ overflow: "hidden" }}><div id="ar-pages" className="ar-pages" style={{ zoom: z }}>
      {/* الغلاف */}
      <div className="ar-pg ar-cov" id="ar-cover" data-p={P()}>
        <svg width="794" height="1123" viewBox="0 0 794 1123" style={{ position: "absolute", inset: 0 }}><defs><linearGradient id="arg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#0b2545" /><stop offset=".6" stopColor="#13315c" /><stop offset="1" stopColor="#1f3b63" /></linearGradient><pattern id="arp" width="60" height="60" patternUnits="userSpaceOnUse"><path d="M30 0L60 30L30 60L0 30Z" fill="none" stroke="#c9a227" strokeOpacity=".12" strokeWidth="1" /><circle cx="30" cy="30" r="3" fill="#c9a227" fillOpacity=".12" /></pattern></defs>
          <rect width="794" height="1123" fill="url(#arg)" /><rect width="794" height="1123" fill="url(#arp)" /><rect x="28" y="28" width="738" height="1067" fill="none" stroke="#c9a227" strokeWidth="2" rx="18" /><rect x="40" y="40" width="714" height="1043" fill="none" stroke="#c9a227" strokeOpacity=".4" strokeWidth="1" rx="12" />
          <g transform="translate(397 640)"><circle r="120" fill="none" stroke="#c9a227" strokeOpacity=".25" strokeWidth="1" strokeDasharray="4 6" /><circle r="96" fill="none" stroke="#c9a227" strokeOpacity=".5" strokeWidth="2" /><circle r="84" fill="#c9a227" fillOpacity=".08" /></g>
          <path d="M0 1010 C200 960 594 1060 794 1000 L794 1123 L0 1123Z" fill="#c9a227" fillOpacity=".14" /><path d="M0 1050 C240 1000 560 1090 794 1040 L794 1123 L0 1123Z" fill="#c9a227" fillOpacity=".22" /></svg>
        <div style={{ position: "relative", height: 1123, boxSizing: "border-box", display: "flex", flexDirection: "column", alignItems: "center", padding: "70px 60px 110px", textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>{api.moeLogo ? <img src={api.moeLogo} alt="" style={{ height: 70, filter: "brightness(0) invert(1)" }} /> : <span />}<div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.8, opacity: .9 }}>المملكة العربية السعودية<br />وزارة التعليم<br />{api.region || ""}</div>{api.logo ? <img src={api.logo} alt="" style={{ height: 70, background: "#fff", borderRadius: 14, padding: 4 }} /> : <span />}</div>
          <div style={{ marginTop: 150, fontSize: 15, letterSpacing: 2, color: GOLD, fontWeight: 800 }}>لجنة التحصيل الدراسي</div>
          <div style={{ fontSize: 58, fontWeight: 900, lineHeight: 1.25, marginTop: 6 }}>سجل التحصيل<br />الدراسي</div>
          <div style={{ width: 120, height: 4, background: GOLD, borderRadius: 4, margin: "18px 0" }} />
          <div style={{ fontSize: 18, fontWeight: 700, opacity: .92 }}>خطة تحسين التحصيل ونواتج التعلم</div>
          <div style={{ marginTop: 92, fontSize: 64, lineHeight: 1 }}>📚</div>
          <div style={{ marginTop: "auto", fontSize: 24, fontWeight: 900 }}>{api.school || ""}</div>
          <div style={{ marginTop: 8, display: "inline-block", border: `1.5px solid ${GOLD}`, color: GOLD, borderRadius: 999, padding: "6px 22px", fontWeight: 800, fontSize: 16 }}>العام الدراسي {ar(cfg.year)}هـ</div>
        </div>
      </div>
      {/* فريق العمل */}
      <div className="ar-pg" id="ar-team"><PH n={P()} t="فريق العمل" /><h2><i>١</i>قرار تشكيل لجنة التحصيل الدراسي</h2><p className="sub">استنادًا إلى الدليل التنظيمي لمدارس التعليم العام (دليل الأهداف والمهام)</p>
        <div className="ar-box">{cfg.dec || `بناءً على الصلاحيات المخولة لمدير المدرسة، واستنادًا إلى الدليل التنظيمي لمدارس التعليم العام، تُشكَّل لجنة التحصيل الدراسي في ${api.school || "المدرسة"} للعام الدراسي ${ar(cfg.year)}هـ برئاسة مدير المدرسة وعضوية الوكلاء ونخبة من المعلمين بينهم معلم خبير أو متقدم، لتحليل نتائج الطلاب ومناقشة تقارير التحصيل ونواتج التعلم وإقرار التوصيات ومتابعة تنفيذ الخطط العلاجية والإثرائية.`}</div>
        <table className="ar-t"><thead><tr><th>م</th><th>الاسم</th><th>الصفة في اللجنة</th><th>المهام</th></tr></thead><tbody>{team.map((m, i) => <tr key={i}><td>{ar(i + 1)}</td><td className="r"><b>{m.n || "................"}</b></td><td>{m.r}</td><td className="r" style={{ fontSize: 11.5 }}>{m.t}</td></tr>)}</tbody></table>
        <h3>مهام اللجنة</h3><div className="ar-gl">{["تحليل نتائج الاختبارات التشخيصية والتكوينية والختامية ونتائج نافس والقراءة", "تصنيف الطلاب وفق مستويات التحصيل وتحديد الفجوات التعليمية لكل مادة وفصل", "إقرار الخطط العلاجية والإثرائية ومتابعة تنفيذها وقياس أثرها", "مناقشة تقارير التحصيل الدراسي ونواتج التعلم شهريًا وإقرار التوصيات", "دعم المعلمين مهنيًا عبر مجتمعات التعلم وتبادل الممارسات الفاعلة", "تعزيز الشراكة مع أولياء الأمور في دعم تعلم أبنائهم"].map((t, i) => <div key={i}>{t}</div>)}</div>
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20, fontWeight: 800 }}>مدير المدرسة: {cfg.team[0] && cfg.team[0].n || "................"}</div></div>
      {/* الأهداف */}
      <div className="ar-pg" id="ar-goals"><PH n={P()} t="الرؤية والأهداف" /><h2><i>٢</i>الرؤية والأهداف</h2>
        <div className="ar-box" style={{ background: "#f4ead2", borderColor: "#e7dcc2" }}><b style={{ color: NAVY }}>الرؤية:</b> طلاب متمكنون من مهارات التعلم الأساسية، يتحسن تحصيلهم باستمرار، في بيئة تعليمية تقيس وتعالج وتُثري.</div>
        <div className="ar-box"><b style={{ color: NAVY }}>الهدف العام:</b> تحسين التحصيل الدراسي ونواتج التعلم لجميع الطلاب، وتقليص الفجوات بين المواد والفصول، اعتمادًا على البيانات والقياس المستمر.</div>
        <h3>الأهداف التفصيلية (مبنية على واقع المدرسة)</h3><div className="ar-gl">{goals.map(([k, t]) => <div key={k}>{t}</div>)}</div>
        <h3>منطلقات الخطة</h3><div className="ar-gl">{["رؤية المملكة ٢٠٣٠ وبرنامج تنمية القدرات البشرية", "الدليل التنظيمي لمدارس التعليم العام ومهام لجنة التحصيل الدراسي", "نتائج الاختبارات الوطنية (نافس) ومؤشرات أداء المدرسة", "نتائج الاختبارات التشخيصية والتكوينية والختامية في المدرسة"].map((t, i) => <div key={i}>{t}</div>)}</div></div>
      {/* حصر الواقع ١ */}
      <div className="ar-pg" id="ar-real1"><PH n={P()} t="حصر الواقع الدراسي" /><h2><i>٣</i>حصر الواقع الدراسي (١): التحصيل العام</h2><p className="sub">من سجلات «رصد الدرجات» في الموقع: {Object.entries(G.types).map(([k, v]) => `${k} ${ar(v)}`).join("، ") || "لا توجد سجلات"} • حتى {hToday()}</p>
        <div className="ar-k"><div><b>{ar(D.nStu)}</b><span>طلاب المدرسة</span></div><div style={{ "--c": "#2563eb" }}><b>{ar(G.S.length)}</b><span>طالبًا مقيَّمًا</span></div><div style={{ "--c": colP(G.avg) }}><b>{G.avg == null ? "—" : ar(rnd(G.avg)) + "٪"}</b><span>متوسط التحصيل</span></div><div style={{ "--c": "#0d9488" }}><b>{ar(G.ok)}٪</b><span>متمكن فأكثر</span></div></div>
        {band && <div className="ar-band" style={{ background: band[2] }}><b>{band[0]}</b><span>مستوى الأداء التحصيلي للمدرسة وفق تصنيف مستويات أداء المدارس: {band[1]}</span></div>}
        <h3>توزيع الطلاب على مستويات التحصيل</h3><SLB d={G.dist} />
        <div className="ar-note">مقياس المستويات: متقدم ٩٠٪ فأكثر • متمكن ٧٥–٨٩٪ • متوسط ٦٠–٧٤٪ • يحتاج دعمًا ٥٠–٥٩٪ • متعثر دون ٥٠٪.</div>
        <h3>التحصيل حسب المادة</h3><table className="ar-t"><thead><tr><th>المادة</th><th>الطلاب</th><th>المتوسط</th><th>متمكن فأكثر</th><th>متعثرون</th><th>الحكم</th></tr></thead><tbody>{[...G.bySub].sort((a, b) => b.avg - a.avg).map(s => <tr key={s.k}><td className="r"><b>{s.k}</b></td><td>{ar(s.n)}</td><td><b style={{ color: colP(s.avg) }}>{ar(rnd(s.avg))}٪</b></td><td>{ar(s.ok)}٪</td><td style={{ color: s.low ? "#dc2626" : "#15803d", fontWeight: 800 }}>{ar(s.low)}</td><td>{s.avg >= 85 ? "متميز" : s.avg >= 75 ? "جيد" : s.avg >= 60 ? "يحتاج تحسين" : "أولوية علاجية"}</td></tr>)}</tbody></table>
        <h3>التحصيل حسب الفصل</h3><Bar L={[...G.byCls].sort((a, b) => String(a.k).localeCompare(String(b.k))).map(c => ({ k: c.k, lbl: `فصل ${name(c.k)}`, v: c.avg }))} /></div>
      {/* حصر الواقع ٢ */}
      <div className="ar-pg" id="ar-real2"><PH n={P()} t="حصر الواقع الدراسي" /><h2><i>٣</i>حصر الواقع الدراسي (٢): نافس والقراءة والتحسن</h2>
        <div className="ar-k"><div style={{ "--c": colP(D.nqA) }}><b>{D.nqA == null ? "—" : ar(rnd(D.nqA)) + "٪"}</b><span>متوسط نافس ({ar(D.nq.length)} طالبًا)</span></div><div style={{ "--c": colP(D.rdA) }}><b>{D.rdA == null ? "—" : ar(rnd(D.rdA))}</b><span>متوسط القراءة من ١٠٠ ({ar(D.rd.length)})</span></div><div style={{ "--c": "#dc2626" }}><b>{ar(D.rdLow)}</b><span>دون ٦٠ في القراءة</span></div><div style={{ "--c": "#7c3aed" }}><b>{ar(D.rem.length)}</b><span>برامج علاجية للمعلمين</span></div></div>
        <h3>من التشخيصي إلى اختبار الفترة</h3>{G.imp ? <><Bar L={[{ k: "dg", lbl: "الاختبار التشخيصي", v: G.imp.dg }, { k: "pe", lbl: "اختبار الفترة", v: G.imp.pe }]} /><div className="ar-note">التغير {G.imp.pe - G.imp.dg >= 0 ? "تحسن" : "تراجع"} بمقدار {ar(Math.abs(rnd(G.imp.pe - G.imp.dg)))} نقطة لـ {ar(G.imp.n)} طالبًا لهم النتيجتان، تحسّن منهم بوضوح {ar(G.imp.up)} ({ar(pc(G.imp.up, G.imp.n))}٪).</div></> : <div className="ar-note">لا توجد بعدُ نتائج تشخيصي واختبار فترة للطلاب أنفسهم للمقارنة.</div>}
        {D.nq.length > 0 && <><h3>توزيع مستويات نافس التدريبي</h3><SLB d={D.nq.reduce((d, s) => (d[slOf(s.N.p)]++, d), [0, 0, 0, 0, 0])} /></>}
        {D.rd.length > 0 && <><h3>توزيع مستويات القراءة الجهرية</h3><SLB d={D.rd.reduce((d, s) => (d[slOf(s.R.score)]++, d), [0, 0, 0, 0, 0])} /></>}
        <h3>أضعف المهارات على مستوى المدرسة</h3>{D.SK.length ? <table className="ar-t"><thead><tr><th>المهارة</th><th>نسبة الإتقان</th><th>عدد الطلاب</th></tr></thead><tbody>{D.SK.slice(0, 8).map(k => <tr key={k.k}><td className="r">{cmdSkLbl(k.k)}</td><td><b style={{ color: colP(k.p) }}>{ar(k.p)}٪</b></td><td>{ar(k.n)}</td></tr>)}</tbody></table> : <div className="ar-note">لا توجد بيانات مهارات كافية بعد.</div>}</div>
      {/* تصنيف الطلاب */}
      <div className="ar-pg" id="ar-cls"><PH n={P()} t="تصنيف الطلاب" /><h2><i>٤</i>تصنيف الطلاب: العلاج والإثراء</h2>
        <div className="ar-k"><div style={{ "--c": "#dc2626" }}><b>{ar(G.low.length)}</b><span>متعثرون — خطة علاجية</span></div><div style={{ "--c": "#d97706" }}><b>{ar(G.dist[3])}</b><span>يحتاجون دعمًا</span></div><div style={{ "--c": "#2563eb" }}><b>{ar(G.dist[2])}</b><span>متوسطون</span></div><div style={{ "--c": "#15803d" }}><b>{ar(G.top.length)}</b><span>متفوقون — برامج إثرائية</span></div></div>
        <h3>الطلاب المستهدفون بالخطة العلاجية {G.low.length > 28 ? `(أول ٢٨ من ${ar(G.low.length)})` : ""}</h3>{G.low.length ? <table className="ar-t"><thead><tr><th>م</th><th>الطالب</th><th>الفصل</th><th>المتوسط</th><th>المادة الأضعف</th></tr></thead><tbody>{G.low.slice(0, 28).map((s, i) => <tr key={s.k}><td>{ar(i + 1)}</td><td className="r">{s.name}</td><td>{name(s.ck)}</td><td><b style={{ color: "#dc2626" }}>{ar(rnd(s.avg))}٪</b></td><td>{s.subA[0] ? `${s.subA[0][0]} ${ar(rnd(s.subA[0][1]))}٪` : "—"}</td></tr>)}</tbody></table> : <div className="ar-note">لا يوجد طلاب متعثرون ✓</div>}
        <h3>الطلاب المستهدفون بالبرامج الإثرائية {G.top.length > 14 ? `(أول ١٤ من ${ar(G.top.length)})` : ""}</h3>{G.top.length ? <table className="ar-t"><thead><tr><th>م</th><th>الطالب</th><th>الفصل</th><th>المتوسط</th></tr></thead><tbody>{G.top.slice(0, 14).map((s, i) => <tr key={s.k}><td>{ar(i + 1)}</td><td className="r">{s.name}</td><td>{name(s.ck)}</td><td><b style={{ color: "#15803d" }}>{ar(rnd(s.avg))}٪</b></td></tr>)}</tbody></table> : <div className="ar-note">لا توجد بعدُ نتائج كافية لتحديد المتفوقين.</div>}</div>
      {/* المتابعة الأسبوعية */}
      {(() => { const W = Object.keys(snaps).sort(), cur = wkStart(), prevs = W.filter(w => w < cur), base = cmpW && snaps[cmpW] ? cmpW : prevs[prevs.length - 1], B = base ? obj(snaps[base]) : null, NOW = obj(snaps[cur]);
        const ch = B ? G.S.map(s => { const a = obj(B.s)[sk(s.k)]; return a == null ? null : { s, a, d: Math.round(s.avg) - a }; }).filter(Boolean) : [], up = ch.filter(x => x.d >= 3), dn = ch.filter(x => x.d <= -3);
        const watch = ch.filter(x => x.a < 60 || x.s.avg < 60 || Math.abs(x.d) >= 5).sort((a, b) => a.d - b.d).slice(0, 24), tr = W.slice(-10);
        return <div className="ar-pg" id="ar-week"><PH n={P()} t="المتابعة الأسبوعية" /><h2><i>٥</i>المتابعة الأسبوعية لتحسن التحصيل</h2>
          <p className="sub">لقطة تُحفظ آليًا كل أسبوع لمتوسط كل طالب، ويُقارَن الأسبوع الحالي ({wkLbl(cur)}) بـ{B ? ` أسبوع ${wkLbl(base)}` : " الأسبوع السابق عند توفره"}</p>
          <div className="ar-noprint" style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", marginBottom: 6, fontSize: 12.5, fontWeight: 800 }}>قارن مع: <select className="ar-sel" value={base || ""} onChange={e => setCmpW(e.target.value)}>{prevs.slice().reverse().map((w, i) => <option key={w} value={w}>{i === 0 ? "الأسبوع الماضي — " : ""}{wkLbl(w)}{Math.round((new Date(cur) - new Date(w)) / 864e5) >= 26 && Math.round((new Date(cur) - new Date(w)) / 864e5) <= 35 ? " (قبل شهر)" : ""}</option>)}</select>{prevs.length > 3 && <button className="ar-btn" onClick={() => { const t0 = new Date(cur); t0.setDate(t0.getDate() - 28); const k = prevs.filter(w => w <= wkStart(t0)).pop() || prevs[0]; setCmpW(k); }}>مقارنة شهرية</button>}</div>
          {!B ? <div className="ar-note">هذه أول لقطة أسبوعية. من الأسبوع القادم تظهر هنا المقارنة: من تحسّن ومن تراجع، وتطور متوسط المدرسة أسبوعًا بأسبوع.</div> : <>
            <div className="ar-k"><div style={{ "--c": colP(NOW.avg) }}><b>{NOW.avg != null ? ar(NOW.avg) + "٪" : "—"}</b><span>متوسط المدرسة الآن (كان {ar(B.avg)}٪)</span></div><div style={{ "--c": "#15803d" }}><b>{ar(up.length)}</b><span>طالبًا تحسّن ٣ نقاط فأكثر</span></div><div style={{ "--c": "#dc2626" }}><b>{ar(dn.length)}</b><span>طالبًا تراجع ٣ نقاط فأكثر</span></div><div style={{ "--c": "#d97706" }}><b>{ar(NOW.low ?? 0)}</b><span>متعثرون الآن (كانوا {ar(B.low)})</span></div></div>
            <h3>تطور متوسط المدرسة أسبوعيًا</h3><div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 120, borderBottom: "1px solid #cbd5e1", padding: "0 4px" }}>{tr.map(w => { const v = obj(snaps[w]).avg || 0; return <div key={w} style={{ flex: 1, textAlign: "center", fontSize: 10.5, fontWeight: 800 }}><div style={{ color: colP(v) }}>{ar(Math.round(v))}٪</div><div style={{ height: Math.max(4, (v - 30) * 1.4), background: w === cur ? GOLD : colP(v), borderRadius: "6px 6px 0 0" }} /></div>; })}</div>
            <div style={{ display: "flex", gap: 6, padding: "0 4px" }}>{tr.map(w => <div key={w} style={{ flex: 1, textAlign: "center", fontSize: 9.5, color: "#64748b" }}>{wkLbl(w)}</div>)}</div>
            <h3>الطلاب تحت المتابعة (المتعثرون ومن تغيّر مستواه بوضوح)</h3>{watch.length ? <table className="ar-t"><thead><tr><th>الطالب</th><th>الفصل</th><th>أسبوع {wkLbl(base)}</th><th>الآن</th><th>التغير</th><th>الحكم</th></tr></thead><tbody>{watch.map(x => <tr key={x.s.k}><td className="r">{x.s.name}</td><td>{name(x.s.ck)}</td><td>{ar(x.a)}٪</td><td><b style={{ color: colP(x.s.avg) }}>{ar(Math.round(x.s.avg))}٪</b></td><td style={{ color: x.d > 0 ? "#15803d" : x.d < 0 ? "#dc2626" : "#64748b", fontWeight: 900 }}>{x.d > 0 ? "▲" : x.d < 0 ? "▼" : "="}{ar(Math.abs(x.d))}</td><td>{x.d >= 3 ? "تحسّن" : x.d <= -3 ? "تراجع — يحتاج تدخلًا" : x.s.avg < 50 ? "متعثر — متابعة" : "ثابت"}</td></tr>)}</tbody></table> : <div className="ar-note">لا تغيّر ملحوظ في مستويات الطلاب منذ الأسبوع المقارن.</div>}</>}
        </div>; })()}
      {/* أساليب المعالجة */}
      <div className="ar-pg" id="ar-meth"><PH n={P()} t="أساليب المعالجة" /><h2><i>٦</i>أساليب المعالجة حسب مستوى الطالب</h2><p className="sub">استراتيجيات متدرجة تُختار حسب الفجوة، ويُقاس أثرها قبل التدخل وبعده</p>
        <div className="ar-mt">{METH.map(([t, c, L]) => <div key={t} style={{ "--c": c }}><b>{t}</b><ul>{L.map(x => <li key={x}>{x}</li>)}</ul></div>)}</div>
        <h3>إجراءات عامة لجميع الطلاب</h3><div className="ar-gl">{GEN.map(t => <div key={t}>{t}</div>)}</div>
        <h3>دورة المعالجة</h3><div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", fontWeight: 800, fontSize: 12.5 }}>{["تشخيص", "تصنيف", "خطة علاجية", "تنفيذ التدخل", "قياس بعدي", "تغذية راجعة وتعديل"].map((s, i) => <React.Fragment key={s}>{i > 0 && <span style={{ color: GOLD }}>←</span>}<span style={{ background: "#eef2ff", color: NAVY, borderRadius: 999, padding: "5px 12px" }}>{s}</span></React.Fragment>)}</div></div>
      {/* الخطة العلاجية */}
      <div className="ar-pg" id="ar-plan"><PH n={P()} t="الخطة العلاجية التنفيذية" /><h2><i>٧</i>الخطة العلاجية التنفيذية</h2><p className="sub">بنود الخطة مستخرجة آليًا من الفجوات في بيانات المدرسة، وتتحدث مع كل نتيجة جديدة</p>
        <table className="ar-t" style={{ fontSize: 11 }}><thead><tr><th>م</th><th>الفجوة</th><th>المؤشر من البيانات</th><th>الإجراء</th><th>المستهدفون</th><th>المسؤول</th><th>المدة</th><th>مؤشر النجاح</th><th>الحالة</th></tr></thead>
          <tbody>{rows.map((r, i) => { const s = stOf(r.k), S2 = ST[s] || ST[""]; return <tr key={r.k}><td>{ar(i + 1)}</td><td className="r"><b>{r.gap}</b></td><td className="r">{r.ev}</td><td className="r">{r.act}</td><td>{ar(r.tg || "—")}</td><td>{r.who}</td><td>{r.when}</td><td>{r.kpi}</td><td>{admin ? <select className="ar-sel" value={s} onChange={e => setRow(r.k, "st", e.target.value)}>{Object.entries(ST).map(([k, v]) => <option key={k} value={k}>{v[0]}</option>)}</select> : <span className="ar-st" style={{ background: S2[2], color: S2[1] }}>{S2[0]}</span>}</td></tr>; })}</tbody></table>
        {D.iv.length > 0 && <><h3>خطط التدخل الجارية في الموقع (من المعلمين ومركز القيادة)</h3><table className="ar-t"><thead><tr><th>الخطة</th><th>المسؤول</th><th>الطلاب</th><th>الحالة</th></tr></thead><tbody>{D.iv.slice(0, 10).map(v => <tr key={v.id}><td className="r">{v.title}</td><td>{v.owner || "—"}</td><td>{ar(arr(v.sids).length)}</td><td>{{ plan: "مخطط", run: "قيد التنفيذ", done: "مكتمل" }[v.st || "plan"]}</td></tr>)}</tbody></table></>}</div>
      {/* المتابعة والتقويم */}
      <div className="ar-pg" id="ar-kpi"><PH n={P()} t="المتابعة والتقويم" /><h2><i>٨</i>المتابعة والتقويم</h2>
        <h3>مؤشرات الأداء: خط الأساس والمستهدف</h3><table className="ar-t"><thead><tr><th>المؤشر</th><th>خط الأساس الحالي</th><th>المستهدف</th><th>أداة القياس</th></tr></thead><tbody>
          {[["متوسط التحصيل العام", G.avg == null ? "—" : ar(rnd(G.avg)) + "٪", G.avg == null ? "—" : ar(targ(G.avg, 5)) + "٪", "رصد الدرجات"], ["نسبة المتمكنين فأكثر", ar(G.ok) + "٪", ar(targ(G.ok, 10, 100)) + "٪", "رصد الدرجات"], ["عدد المتعثرين", ar(G.low.length), ar(Math.floor(G.low.length / 2)), "رصد الدرجات"], ["متوسط نافس التدريبي", D.nqA == null ? "—" : ar(rnd(D.nqA)) + "٪", D.nqA == null ? "—" : ar(targ(D.nqA, 10)) + "٪", "منصة اختبارات نافس"], ["متوسط القراءة الجهرية", D.rdA == null ? "—" : ar(rnd(D.rdA)), D.rdA == null ? "—" : ar(targ(D.rdA, 10, 100)), "اختبار القراءة"], ["بنود الخطة المنفذة", `${ar(rows.filter(r => stOf(r.k) === "done").length)} من ${ar(rows.length)}`, `${ar(rows.length)} من ${ar(rows.length)}`, "متابعة اللجنة"]].map(r => <tr key={r[0]}><td className="r"><b>{r[0]}</b></td><td>{r[1]}</td><td style={{ color: "#15803d", fontWeight: 800 }}>{r[2]}</td><td>{r[3]}</td></tr>)}</tbody></table>
        <h3>الجدول الزمني لاجتماعات اللجنة</h3><table className="ar-t"><thead><tr><th>الاجتماع</th><th>الموضوع</th><th>المخرجات</th></tr></thead><tbody>{[["الأول — بداية الفصل", "تحليل نتائج التشخيصي واعتماد الخطة", "تصنيف الطلاب وتوزيع المهام"], ["الثاني — بعد ٤ أسابيع", "متابعة الخطط العلاجية وقياس التحسن الأولي", "تعديل الإجراءات حسب النتائج"], ["الثالث — بعد اختبار الفترة", "مقارنة النتائج بالتشخيصي ومراجعة المؤشرات", "تقرير تحسن ورفع التوصيات"], ["الرابع — نهاية الفصل", "تقويم الخطة وقياس تحقق الأهداف", "التقرير الختامي وخطة الفصل القادم"]].map(r => <tr key={r[0]}><td className="r"><b>{r[0]}</b></td><td className="r">{r[1]}</td><td className="r">{r[2]}</td></tr>)}</tbody></table>
        <div className="ar-note">تُحدَّث أرقام هذا السجل تلقائيًا من نتائج الطلاب في الموقع؛ اطبعه بعد كل اجتماع ليكون شاهدًا على تطور المؤشرات.</div></div>
      {/* الاطلاع والتوقيع */}
      <div className="ar-pg" id="ar-sig"><PH n={P()} t="الاطلاع والتوقيع" /><h2><i>٩</i>اطلاع فريق العمل وتوقيعه</h2><p className="sub">نحن أعضاء لجنة التحصيل الدراسي اطلعنا على السجل والخطة، ونلتزم بتنفيذ ما أُسند إلينا من مهام.</p>
        <div className="ar-sig">{team.map((m, i) => { const s = sig[sgKey(m)]; return <div key={i} className="ar-sgc"><div><b>{m.n || "................"}</b><small>{m.r}</small>{s && <small>اطّلع ووقّع: {new Date(s.at).toLocaleDateString("ar-SA-u-ca-islamic-umalqura")}</small>}</div>
          <div>{s ? <img src={s.img} alt="" /> : pad === i ? null : canSign(m) && (m.n || admin) ? <button className="ar-btn p ar-noprint" onClick={() => setPad(i)}>اطّلعت وأوقّع</button> : <small>بانتظار التوقيع</small>}</div>
          {pad === i && <div style={{ gridColumn: "1/-1" }} className="ar-noprint"><SigPad onSave={img => sign(m, img)} onCancel={() => setPad(null)} /></div>}</div>; })}</div>
        <div style={{ marginTop: 26, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, textAlign: "center", fontWeight: 800 }}><div>مقرر اللجنة<br /><br />................</div><div>رئيس اللجنة — مدير المدرسة<br />{cfg.team[0] && cfg.team[0].n}<br />{sig[sgKey(cfg.team[0] || {})] ? <img src={sig[sgKey(cfg.team[0])].img} alt="" style={{ height: 50 }} /> : "................"}</div></div></div>
    </div></div>
  </div>;
}

function Settings({ cfg, goals, onSave, names = [] }) {
  const [c, setC] = useState(() => JSON.parse(JSON.stringify(cfg)));
  const upT = (i, f, v) => setC(x => ({ ...x, team: x.team.map((m, k) => k === i ? { ...m, [f]: v } : m) }));
  return <div className="ar-set ar-noprint"><h3>⚙️ فريق العمل والأهداف</h3>
    <label style={{ fontWeight: 800, fontSize: 13 }}>العام الدراسي (هـ) <input className="ar-in" style={{ width: 110 }} value={c.year} onChange={e => setC({ ...c, year: e.target.value })} /></label>
    <h4 style={{ margin: "10px 0 6px", color: NAVY }}>أعضاء لجنة التحصيل الدراسي</h4>
    <datalist id="ar-names">{names.map(n => <option key={n} value={n} />)}</datalist>{names.length > 0 && <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 6px" }}>اختر الاسم من قائمة معلمي المدرسة وموظفيها ({ar(names.length)} اسمًا) أو اكتبه.</p>}
    {c.team.map((m, i) => <div key={i} className="ar-tg"><select className="ar-in" value={names.includes(m.n) ? m.n : ""} onChange={e => e.target.value && upT(i, "n", e.target.value)} style={{ display: names.length ? "" : "none" }}><option value="">{m.n && !names.includes(m.n) ? m.n : "— اختر من المعلمين —"}</option>{names.map(n => <option key={n} value={n}>{n}</option>)}</select>{!names.length && <input className="ar-in" list="ar-names" placeholder="الاسم" value={m.n} onChange={e => upT(i, "n", e.target.value)} />}<input className="ar-in" placeholder="الصفة" value={m.r} onChange={e => upT(i, "r", e.target.value)} /><input className="ar-in" placeholder="المهام" value={m.t} onChange={e => upT(i, "t", e.target.value)} /><button className="ar-btn" onClick={() => setC(x => ({ ...x, team: x.team.filter((_, k) => k !== i) }))}>✕</button></div>)}
    <button className="ar-btn" onClick={() => setC(x => ({ ...x, team: [...x.team, { n: "", r: "عضو", t: "" }] }))}>＋ عضو</button>
    <h4 style={{ margin: "12px 0 6px", color: NAVY }}>نص قرار التشكيل (اتركه فارغًا للنص الافتراضي)</h4><textarea className="ar-in" rows={3} value={c.dec || ""} onChange={e => setC({ ...c, dec: e.target.value })} />
    <h4 style={{ margin: "12px 0 6px", color: NAVY }}>الأهداف (تُبنى آليًا من البيانات — عدّل الصياغة أو امسحها لإخفاء الهدف)</h4>
    {goals.map(([k, t]) => <textarea key={k} className="ar-in" rows={2} style={{ marginBottom: 6 }} value={c.goals[k] != null ? c.goals[k] : t} onChange={e => setC({ ...c, goals: { ...c.goals, [k]: e.target.value } })} />)}
    <h4 style={{ margin: "12px 0 6px", color: NAVY }}>بنود إضافية للخطة العلاجية</h4>
    {arr(c.extra).map((r, i) => <div key={i} className="ar-tg" style={{ gridTemplateColumns: "1fr 1fr 1fr 34px" }}><input className="ar-in" placeholder="الفجوة" value={r.gap || ""} onChange={e => setC(x => ({ ...x, extra: x.extra.map((q, k) => k === i ? { ...q, gap: e.target.value } : q) }))} /><input className="ar-in" placeholder="الإجراء" value={r.act || ""} onChange={e => setC(x => ({ ...x, extra: x.extra.map((q, k) => k === i ? { ...q, act: e.target.value } : q) }))} /><input className="ar-in" placeholder="المسؤول والمدة" value={r.who || ""} onChange={e => setC(x => ({ ...x, extra: x.extra.map((q, k) => k === i ? { ...q, who: e.target.value } : q) }))} /><button className="ar-btn" onClick={() => setC(x => ({ ...x, extra: x.extra.filter((_, k) => k !== i) }))}>✕</button></div>)}
    <button className="ar-btn" onClick={() => setC(x => ({ ...x, extra: [...arr(x.extra), { gap: "", act: "", who: "", ev: "", when: "", kpi: "" }] }))}>＋ بند</button>
    <div style={{ marginTop: 12 }}><button className="ar-btn p" onClick={() => onSave(c)}>💾 حفظ</button></div>
  </div>;
}
export default AchRecord;
