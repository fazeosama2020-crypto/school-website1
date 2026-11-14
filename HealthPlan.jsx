// ═══════════════════════════════════════════════════════════════════════════
//  🩺 الخطة المشتركة للبرامج الصحية المدرسية 1448هـ — متابعة التنفيذ والتوثيق والطباعة
//  (بتصميم الخطة الرسمية: وزارة التعليم • هيئة الصحة العامة «وقاية» • الصحة القابضة)
// ═══════════════════════════════════════════════════════════════════════════
import React, { useState, useEffect, useMemo, useRef } from "react";
import { HP_PROGRAMS, HP_SECS, HP_GOALS, HP_STAGES, HP_TITLE, HP_YEAR } from "./hpSeed.js";
import { HP_LOGOS } from "./hpLogos.js";

const N = { CFG: "school-hp/cfg", R: "school-hp/r", IMG: "school-hp-img", PDF: "school-hp-pdf" };
const TEAL = "#2490ab", TEAL2 = "#1d7a93", GREY = "#d9d9d9", PURP = "#3b1d8f", NAVY = "#0f1e3d", GOLD = "#c9a227", DASH = "#4a7bbf";
const MAX_IMG = 6, MAX_PDF = 5, PDF_MB = 4;
const obj = v => (v && typeof v === "object" ? v : {});
const arr = v => (Array.isArray(v) ? v : v && typeof v === "object" ? Object.values(v) : []);
const ar = n => String(n ?? "").replace(/\d/g, d => "٠١٢٣٤٥٦٧٨٩"[d]);
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const hij = d => { try { return d ? new Date(d + "T12:00:00").toLocaleDateString("ar-SA-u-ca-islamic-umalqura", { day: "numeric", month: "long", year: "numeric" }) : ""; } catch { return d || ""; } };
const todayH = () => { try { return new Date().toLocaleDateString("ar-SA-u-ca-islamic-umalqura", { day: "numeric", month: "long", year: "numeric" }); } catch { return ""; } };
const ST = { none: { t: "لم يبدأ", c: "#64748b", b: "#f1f5f9" }, run: { t: "قيد التنفيذ", c: "#b45309", b: "#fef3c7" }, done: { t: "منفّذ", c: "#15803d", b: "#dcfce7" } };
// الشاهد متوفر إذا أُشّر عليه، أو تلقائياً: «صور» عند رفع صور، و«استمارة/محضر/نموذج» عند رفع ملف PDF
const evOn = (r, x, i) => !!obj(r.ev)[i] || (/صور/.test(x) && Object.keys(obj(r.imgs)).length > 0) || (/استمار|محضر|نموذج|إشعار/.test(x) && Object.keys(obj(r.pdfs)).length > 0);
const secOf = k => HP_SECS.find(s => s.k === k) || HP_SECS[0];

// ضغط الصورة قبل الحفظ (أقصى بُعد 1400px)
const squeeze = (file, max = 1400, q = 0.8) => new Promise((res, rej) => { const fr = new FileReader(); fr.onerror = rej; fr.onload = () => { const im = new Image(); im.onerror = rej; im.onload = () => { const k = Math.min(1, max / Math.max(im.width, im.height)); const c = document.createElement("canvas"); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k); const x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height); x.drawImage(im, 0, 0, c.width, c.height); res(c.toDataURL("image/jpeg", q)); }; im.src = fr.result; }; fr.readAsDataURL(file); });
const readUrl = f => new Promise((res, rej) => { const fr = new FileReader(); fr.onerror = rej; fr.onload = () => res(fr.result); fr.readAsDataURL(f); });
const openData = d => { try { const [h, b] = d.split(","); const mime = (h.match(/data:([^;]+)/) || [])[1] || "application/pdf"; const bin = atob(b); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); window.open(URL.createObjectURL(new Blob([u], { type: mime })), "_blank"); } catch { alert("تعذّر فتح الملف"); } };

const CSS = `
.hp{direction:rtl;font-family:inherit;color:#0f172a;display:grid;gap:14px}
.hp-hero{position:relative;overflow:hidden;border-radius:22px;background:linear-gradient(120deg,${TEAL2},${TEAL} 55%,#3aa7c1);color:#fff;padding:20px 22px;display:grid;gap:12px}
.hp-hero::after{content:"";position:absolute;inset:auto -60px -80px auto;width:280px;height:280px;border-radius:50%;background:rgba(255,255,255,.08)}
.hp-hero h1{margin:0;font-size:24px;font-weight:900;line-height:1.5}.hp-hero small{opacity:.9;font-weight:700}
.hp-logos{background:#fff;border-radius:14px;padding:8px 12px;display:inline-flex;align-items:center;justify-self:start;box-shadow:0 8px 24px -12px rgba(0,0,0,.4)}.hp-logos img{height:46px;max-width:100%}
.hp-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;position:relative;z-index:1}
.hp-kpi{background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.25);border-radius:14px;padding:8px 12px}.hp-kpi b{display:block;font-size:22px;font-weight:900}.hp-kpi span{font-size:12px;font-weight:800;opacity:.92}
.hp-tabs{display:flex;gap:6px;flex-wrap:wrap}.hp-tab{border:1.5px solid #cfe6ee;background:#fff;color:${TEAL2};border-radius:999px;padding:7px 14px;font-weight:900;font-size:13.5px;cursor:pointer;font-family:inherit}
.hp-tab.on{background:${TEAL};border-color:${TEAL};color:#fff}
.hp-bar{display:flex;gap:6px;flex-wrap:wrap;align-items:center;background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:8px 10px}
.hp-chip{border:1.5px solid #e2e8f0;background:#fff;border-radius:999px;padding:5px 11px;font-weight:800;font-size:12.5px;cursor:pointer;font-family:inherit;color:#334155}.hp-chip.on{background:${NAVY};border-color:${NAVY};color:#fff}
.hp-in{border:1.5px solid #e2e8f0;border-radius:12px;padding:8px 10px;font-family:inherit;font-size:14px;width:100%;box-sizing:border-box;background:#fff}
.hp-btn{border:none;border-radius:12px;padding:8px 14px;font-weight:900;font-size:13.5px;cursor:pointer;font-family:inherit;background:${TEAL};color:#fff;display:inline-flex;align-items:center;gap:6px}
.hp-btn.g{background:linear-gradient(135deg,#b08d57,${GOLD});}.hp-btn.n{background:${NAVY}}.hp-btn.l{background:#fff;color:${TEAL2};border:1.5px solid #cfe6ee}.hp-btn.r{background:#fff;color:#b91c1c;border:1.5px solid #fecaca}.hp-btn:disabled{opacity:.5;cursor:default}
.hp-sec{display:flex;align-items:center;justify-content:flex-start;gap:10px;margin:8px 0 2px}
.hp-sec h2{margin:0;font-size:21px;font-weight:900;color:${NAVY};background:linear-gradient(90deg,transparent,#eef7fa);padding:4px 16px;border-inline-start:9px solid ${TEAL}}
.hp-sec small{color:#64748b;font-weight:700}
.hp-card{border:1.6px dashed ${DASH};border-radius:6px;padding:8px;background:#fff}
.hp-card.off{opacity:.6}
.hp-name{display:grid;grid-template-columns:150px 1fr;gap:6px;cursor:pointer}
.hp-name .l{background:${TEAL};color:#fff;font-weight:900;display:grid;place-items:center;font-size:14px;padding:6px}
.hp-name .t{background:${GREY};color:${PURP};font-weight:900;font-size:17px;padding:7px 12px;display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.hp-meta{display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-top:6px}
.hp-pill{border-radius:999px;padding:2px 10px;font-size:11.5px;font-weight:900}
.hp-tbl{display:grid;grid-template-columns:1fr 1fr 1.5fr 1.1fr 1.3fr;gap:6px;margin-top:8px}
.hp-col h4{margin:0 0 4px;background:${TEAL};color:#fff;font-size:13px;font-weight:900;padding:6px 8px;display:flex;align-items:center;gap:6px}
.hp-row{display:grid;grid-template-columns:1fr 26px;gap:4px;margin-bottom:4px}
.hp-row span{background:${GREY};font-size:12px;font-weight:700;padding:4px 8px;line-height:1.5;color:#1f2937}
.hp-row i{background:#fff;border:1px solid #cbd5e1;display:grid;place-items:center;font-style:normal;font-weight:900;color:${NAVY};font-size:14px}
.hp-row.sp{grid-template-columns:1fr}
.hp-desc{display:grid;grid-template-columns:1fr 150px;gap:8px;margin-top:8px;border:1.6px dashed ${DASH};padding:6px}
.hp-desc p{margin:0;border:1px solid #e5e7eb;box-shadow:0 2px 6px rgba(0,0,0,.06);padding:10px 12px;font-size:14px;font-weight:600;line-height:1.95;text-align:justify}
.hp-desc b{background:${TEAL};color:#fff;display:grid;place-items:center;font-size:16px;font-weight:900;padding:8px}
.hp-sub{display:flex;gap:4px;flex-wrap:wrap;margin-top:10px;border-bottom:2px solid #e2f1f6}
.hp-sub button{border:none;background:none;padding:7px 12px;font-weight:900;font-size:13px;color:#64748b;cursor:pointer;font-family:inherit;border-bottom:3px solid transparent;margin-bottom:-2px}
.hp-sub button.on{color:${TEAL2};border-color:${TEAL}}
.hp-list{list-style:none;margin:8px 0 0;padding:0;display:grid;gap:5px}
.hp-list li{display:flex;gap:8px;align-items:flex-start;font-size:13.5px;font-weight:700;line-height:1.8;background:#f8fbfc;border-radius:10px;padding:6px 10px}
.hp-list li input{margin-top:6px;width:17px;height:17px;accent-color:${TEAL}}
.hp-src{font-size:10.5px;font-weight:900;border-radius:999px;padding:1px 8px}
.hp-doc{margin-top:10px;background:linear-gradient(180deg,#f3fafc,#fff);border:1.5px solid #cfe6ee;border-radius:16px;padding:12px;display:grid;gap:10px}
.hp-g2{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:8px}
.hp-lbl{display:grid;gap:3px;font-size:12px;font-weight:900;color:${TEAL2}}
.hp-imgs{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px}
.hp-img{position:relative;border-radius:12px;overflow:hidden;border:2px solid #e2e8f0;background:#f8fafc}.hp-img img{width:100%;height:110px;object-fit:cover;display:block}
.hp-img input{border:none;border-top:1px solid #e2e8f0;width:100%;font-size:11.5px;padding:4px 6px;font-family:inherit;box-sizing:border-box}
.hp-img button{position:absolute;top:4px;left:4px;border:none;background:rgba(185,28,28,.9);color:#fff;border-radius:8px;width:24px;height:24px;cursor:pointer;font-weight:900}
.hp-pdf{display:flex;align-items:center;gap:6px;background:#fff;border:1.5px solid #fecaca;border-radius:10px;padding:5px 9px;font-size:12.5px;font-weight:800}
.hp-up{border:2px dashed #9fd0de;border-radius:12px;padding:10px;text-align:center;font-weight:900;color:${TEAL2};cursor:pointer;background:#fff;font-size:13px}
.hp-box{background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:14px}
.hp-goal{display:grid;grid-template-columns:150px 1fr;gap:8px;margin-bottom:8px}.hp-goal b{background:${TEAL};color:#fff;display:grid;place-items:center;font-weight:900;padding:8px;font-size:14px;text-align:center}.hp-goal div{border:1px solid #e5e7eb;box-shadow:0 2px 6px rgba(0,0,0,.06);padding:8px 12px;font-weight:700;font-size:13.5px;line-height:1.9}
.hp-time td,.hp-time th{border:1px solid #cbd5e1;padding:6px 8px;font-size:13px;font-weight:700}.hp-time th{background:${TEAL};color:#fff}
@media(max-width:820px){.hp-tbl{grid-template-columns:1fr 1fr}.hp-name{grid-template-columns:1fr}.hp-desc,.hp-goal{grid-template-columns:1fr}}
`;

// ── جدول البرنامج بنفس تصميم الخطة
function PlanTable({ p, stage }) {
  const R = (t, on, k) => <div className="hp-row" key={k || t}><span>{t}</span><i>{on ? "√" : ""}</i></div>;
  const pr = p.pr || {};
  return <div className="hp-tbl">
    <div className="hp-col"><h4>🎓 المرحلة الدراسية</h4>{HP_STAGES.map(([k, l]) => R(<>{l}{p.stNote && p.stNote[k] ? <small style={{ fontSize: 10 }}> ({p.stNote[k]})</small> : null}{k === stage ? <b style={{ color: GOLD }}> ★</b> : null}</>, p.st[k], k))}</div>
    <div className="hp-col"><h4>👥 الفئة المستهدفة</h4>{p.tgO.map(t => R(t, p.tg.includes(t)))}</div>
    <div className="hp-col"><h4>⚙️ الجهة المنفذة</h4>{p.exO.map(t => R(t, p.ex.includes(t)))}</div>
    <div className="hp-col"><h4>🤝 الجهة الداعمة</h4>{p.sp.map(t => <div className="hp-row sp" key={t}><span>{t}</span></div>)}</div>
    <div className="hp-col"><h4>📅 فترة التنفيذ</h4>{R("الفصل الدراسي الأول", pr.s1, "s1")}{R("الفصل الدراسي الثاني", pr.s2, "s2")}{pr.note ? R(`(${pr.note})`, 1, "n") : null}</div>
  </div>;
}

export function HealthPlan({ api, me = {}, canEdit = true }) {
  const [cfg, setCfg] = useState({}); const [R, setR] = useState({}); const [ld, setLd] = useState(true);
  const [tab, setTab] = useState("list"); const [sec, setSec] = useState(""); const [mine, setMine] = useState(true); const [sf, setSf] = useState(""); const [q, setQ] = useState("");
  const [open, setOpen] = useState({}); const [busy, setBusy] = useState("");
  useEffect(() => { (async () => { try { const [c, r] = await Promise.all([api.maGet(N.CFG), api.maGet(N.R)]); setCfg({ stage: "m", ...obj(c) }); setR(obj(r)); } catch {} setLd(false); })(); }, []);
  const stage = cfg.stage || "m";
  // صلاحية التوثيق: الإدارة دائماً، والموجه الصحي المسجّل في الإعدادات (canEdit = "guide")
  canEdit = canEdit === true || (canEdit === "guide" && !!cfg.guide && !!me.name && (String(me.name).includes(cfg.guide) || String(cfg.guide).includes(me.name)));
  const stName = (HP_STAGES.find(x => x[0] === stage) || [, ""])[1];
  const recOf = id => obj(R[id]);
  const saveRec = async (id, rec) => { const v = { ...rec, at: Date.now(), by: me.name || "" }; await api.maPut(`${N.R}/${id}`, v); setR(o => ({ ...o, [id]: v })); };
  const saveCfg = async c => { await api.maPut(N.CFG, c); setCfg(c); };
  const L = useMemo(() => HP_PROGRAMS.filter(p => (!sec || p.sec === sec) && (!mine || p.st[stage]) && (!sf || (recOf(p.id).st || "none") === sf) && (!q || (p.t + p.d).includes(q.trim()))), [sec, mine, sf, q, R, stage]);
  const mineAll = HP_PROGRAMS.filter(p => p.st[stage]);
  const done = mineAll.filter(p => recOf(p.id).st === "done").length, run = mineAll.filter(p => recOf(p.id).st === "run").length;
  const ben = HP_PROGRAMS.reduce((a, p) => a + (+recOf(p.id).ben || 0), 0);
  const uniq = Math.max(0, ...HP_PROGRAMS.map(p => +recOf(p.id).ben || 0));
  const kpi = cfg.total ? Math.min(100, Math.round(uniq / cfg.total * 100)) : null;

  const printOne = async p => { setBusy(p.id); try { await printExec(api, cfg, p, recOf(p.id)); } catch (e) { alert("تعذّر إعداد التقرير: " + (e.message || e)); } setBusy(""); };
  const printAll = () => printLog(api, cfg, HP_PROGRAMS.filter(p => !mine || p.st[stage]), R);

  if (ld) return <div style={{ padding: 40, textAlign: "center", fontWeight: 900, color: TEAL2 }}>⏳ جارٍ تحميل الخطة الصحية…</div>;
  return <div className="hp"><style>{CSS}</style>
    <div className="hp-hero">
      <div className="hp-logos"><img src={HP_LOGOS} alt="الجهات الشريكة" /></div>
      <div><h1>🩺 {HP_TITLE}<br />للعام الدراسي {HP_YEAR}</h1><small>وزارة التعليم • هيئة الصحة العامة (وقاية) • الصحة القابضة — متابعة تنفيذ البرامج وتوثيقها وطباعة تقاريرها</small></div>
      <div className="hp-kpis">
        <div className="hp-kpi"><b>{ar(mineAll.length)}</b><span>برنامجاً مستهدفاً للمرحلة {stName}</span></div>
        <div className="hp-kpi"><b>{ar(done)}</b><span>منفّذ</span></div>
        <div className="hp-kpi"><b>{ar(run)}</b><span>قيد التنفيذ</span></div>
        <div className="hp-kpi"><b>{ar(ben)}</b><span>مجموع المستفيدين</span></div>
        <div className="hp-kpi"><b>{kpi == null ? "—" : ar(kpi) + "٪"}</b><span>مؤشر الأداء: نسبة الطلبة المستفيدين</span></div>
      </div>
    </div>
    <div className="hp-tabs">{[["list", "📋 البرامج"], ["goals", "🎯 الأهداف ومؤشر الأداء"], ["time", "🗓️ الخطة الزمنية"], ...(canEdit ? [["cfg", "⚙️ الإعدادات"]] : [])].map(([k, l]) => <button key={k} className={"hp-tab" + (tab === k ? " on" : "")} onClick={() => setTab(k)}>{l}</button>)}
      <span style={{ flex: 1 }} /><button className="hp-btn g" onClick={printAll}>🖨️ سجل تنفيذ الخطة</button></div>

    {tab === "list" && <>
      <div className="hp-bar">
        <button className={"hp-chip" + (!sec ? " on" : "")} onClick={() => setSec("")}>الكل</button>
        {HP_SECS.map(s => <button key={s.k} className={"hp-chip" + (sec === s.k ? " on" : "")} onClick={() => setSec(s.k)}>{s.ic} {s.t}</button>)}
        <span style={{ width: 1, height: 22, background: "#e2e8f0" }} />
        <label className="hp-chip" style={{ display: "inline-flex", gap: 5, alignItems: "center" }}><input type="checkbox" checked={mine} onChange={e => setMine(e.target.checked)} /> المستهدف للمرحلة {stName} فقط</label>
        <select className="hp-in" style={{ width: "auto" }} value={sf} onChange={e => setSf(e.target.value)}><option value="">كل الحالات</option>{Object.entries(ST).map(([k, v]) => <option key={k} value={k}>{v.t}</option>)}</select>
        <input className="hp-in" style={{ flex: 1, minWidth: 160 }} placeholder="🔎 بحث في البرامج…" value={q} onChange={e => setQ(e.target.value)} />
      </div>
      {HP_SECS.filter(s => L.some(p => p.sec === s.k)).map(s => <React.Fragment key={s.k}>
        <div className="hp-sec"><h2>{s.ic} {s.t}</h2><small>{s.d}</small></div>
        {s.k === "camp" && !sec && <div className="hp-box" style={{ fontSize: 13, fontWeight: 700, color: "#334155", lineHeight: 1.9 }}><b style={{ color: TEAL2 }}>التوعية الصحية المدرسية: </b>برنامج يُعنى بتقديم مجموعة من الأنشطة والمبادرات التوعوية التي تهدف إلى الارتقاء بالمعارف الصحية، وبناء الاتجاهات، وغرس السلوكيات الصحية في المجتمع المدرسي. وبرامجه الفرعية: الحملات التوعوية، الأيام الصحية الخليجية/العالمية، البرامج التوعوية، الزيارات التوعوية.</div>}
        {L.filter(p => p.sec === s.k).map(p => <Prog key={p.id} p={p} rec={recOf(p.id)} stage={stage} cfg={cfg} api={api} canEdit={canEdit} open={!!open[p.id]} toggle={() => setOpen(o => ({ ...o, [p.id]: !o[p.id] }))} onSave={r => saveRec(p.id, r)} onPrint={() => printOne(p)} busy={busy === p.id} />)}
      </React.Fragment>)}
      {!L.length && <div className="hp-box" style={{ textAlign: "center", fontWeight: 800, color: "#64748b" }}>لا توجد برامج مطابقة.</div>}
    </>}

    {tab === "goals" && <div className="hp-box">
      <div className="hp-goal"><b>الهدف الاستراتيجي</b><div>• {HP_GOALS.strat}</div></div>
      <div className="hp-goal"><b>الأهداف التفصيلية</b><div>{HP_GOALS.det.map((g, i) => <div key={i}>• {g}</div>)}</div></div>
      <div className="hp-goal"><b>مؤشر الأداء</b><div>• {HP_GOALS.kpi}<div style={{ marginTop: 6, color: TEAL2, fontWeight: 900 }}>القيمة الحالية: {kpi == null ? "أدخل عدد طلبة المدرسة في الإعدادات لحساب المؤشر" : `${ar(kpi)}٪ (أعلى عدد مستفيدين في برنامج واحد ${ar(uniq)} من ${ar(cfg.total)} طالباً)`}</div></div></div>
    </div>}

    {tab === "time" && <div className="hp-box" style={{ overflowX: "auto" }}>
      <table className="hp-time" style={{ borderCollapse: "collapse", width: "100%" }}><thead><tr><th>الفترة</th><th>البرنامج</th><th>الموعد</th><th>الحالة</th><th>تاريخ التنفيذ</th></tr></thead><tbody>
        {[["قبل بداية العام الدراسي", p => !p.pr.s1 && !p.pr.s2 && /قبل/.test(p.pr.note || "")], ["الفصل الدراسي الأول", p => p.pr.s1 || (!p.pr.s2 && !/قبل/.test(p.pr.note || "") && !/2027/.test(p.pr.note || ""))], ["الفصل الدراسي الثاني", p => p.pr.s2 || /2027/.test(p.pr.note || "")]].map(([t, f]) => { const P = HP_PROGRAMS.filter(p => f(p) && (!mine || p.st[stage])); return P.map((p, i) => { const r = recOf(p.id); const s = ST[r.st || "none"]; return <tr key={t + p.id}>{i === 0 && <td rowSpan={P.length} style={{ background: "#eef7fa", fontWeight: 900, color: TEAL2, textAlign: "center" }}>{t}</td>}<td>{p.t}</td><td>{p.pr.note || (p.pr.s1 && p.pr.s2 ? "الفصلان" : "خلال الفصل")}</td><td><span className="hp-pill" style={{ background: s.b, color: s.c }}>{s.t}</span></td><td>{r.d1 ? hij(r.d1) : "—"}</td></tr>; }); })}
      </tbody></table></div>}

    {tab === "cfg" && canEdit && <CfgPanel cfg={cfg} onSave={saveCfg} />}
  </div>;
}

function CfgPanel({ cfg, onSave }) {
  const [c, setC] = useState(cfg); const set = (k, v) => setC(o => ({ ...o, [k]: v }));
  return <div className="hp-box" style={{ display: "grid", gap: 10 }}>
    <div className="hp-g2">
      <label className="hp-lbl">مرحلة المدرسة<select className="hp-in" value={c.stage || "m"} onChange={e => set("stage", e.target.value)}>{HP_STAGES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
      <label className="hp-lbl">اسم الموجه الصحي<input className="hp-in" value={c.guide || ""} onChange={e => set("guide", e.target.value)} /></label>
      <label className="hp-lbl">وكيل شؤون الطلاب<input className="hp-in" value={c.deputy || ""} onChange={e => set("deputy", e.target.value)} /></label>
      <label className="hp-lbl">مدير المدرسة<input className="hp-in" value={c.principal || ""} onChange={e => set("principal", e.target.value)} /></label>
      <label className="hp-lbl">عدد طلبة المدرسة (لحساب مؤشر الأداء)<input className="hp-in" type="number" min="0" value={c.total || ""} onChange={e => set("total", +e.target.value || 0)} /></label>
      <label className="hp-lbl">التجمع الصحي / المركز الصحي المرتبط<input className="hp-in" value={c.center || ""} onChange={e => set("center", e.target.value)} /></label>
    </div>
    <div><button className="hp-btn" onClick={() => onSave(c).then(() => alert("✅ حُفظت الإعدادات"))}>💾 حفظ الإعدادات</button></div>
  </div>;
}

// ── بطاقة البرنامج
function Prog({ p, rec, stage, cfg, api, canEdit, open, toggle, onSave, onPrint, busy }) {
  const [sub, setSub] = useState("how"); const s = ST[rec.st || "none"]; const tgt = !!p.st[stage];
  const ni = Object.keys(obj(rec.imgs)).length, np = Object.keys(obj(rec.pdfs)).length;
  const SRC = k => k === "plan" ? <span className="hp-src" style={{ background: "#dcfce7", color: "#166534" }}>من الخطة</span> : <span className="hp-src" style={{ background: "#fef3c7", color: "#92400e" }}>مقترح — قابل للتوثيق</span>;
  return <div className={"hp-card" + (tgt ? "" : " off")}>
    <div className="hp-name" onClick={toggle}><div className="l">اسم البرنامج</div><div className="t"><span style={{ flex: 1 }}>{p.t}</span>
      <span className="hp-pill" style={{ background: s.b, color: s.c }}>{s.t}</span>{rec.act ? <span className="hp-pill" style={{ background: "#e0f2fe", color: "#0369a1" }}>✓ مفعّل</span> : null}{!tgt && <span className="hp-pill" style={{ background: "#f1f5f9", color: "#64748b" }}>غير مستهدف لمرحلتكم</span>}<span style={{ fontSize: 13, color: "#64748b" }}>{open ? "▲" : "▼"}</span></div></div>
    <div className="hp-meta"><span className="hp-pill" style={{ background: "#eef7fa", color: TEAL2 }}>📅 {p.pr.note || [p.pr.s1 && "الفصل الأول", p.pr.s2 && "الفصل الثاني"].filter(Boolean).join(" و")}</span>
      {rec.d1 && <span className="hp-pill" style={{ background: "#f0fdf4", color: "#15803d" }}>🗓️ نُفّذ: {hij(rec.d1)}{rec.d2 && rec.d2 !== rec.d1 ? ` — ${hij(rec.d2)}` : ""}</span>}
      {+rec.ben ? <span className="hp-pill" style={{ background: "#faf5ff", color: "#7c3aed" }}>👥 {ar(rec.ben)} مستفيد</span> : null}
      {ni ? <span className="hp-pill" style={{ background: "#fff7ed", color: "#c2410c" }}>📷 {ar(ni)}</span> : null}{np ? <span className="hp-pill" style={{ background: "#fef2f2", color: "#b91c1c" }}>📄 {ar(np)}</span> : null}
      <span style={{ flex: 1 }} />{(rec.st === "done" || rec.st === "run") && <button className="hp-btn g" style={{ padding: "4px 10px", fontSize: 12 }} disabled={busy} onClick={onPrint}>{busy ? "⏳" : "🖨️ تقرير التنفيذ"}</button>}</div>
    {open && <>
      <PlanTable p={p} stage={stage} />
      <div className="hp-desc"><p>{p.d}</p><b>وصف البرنامج</b></div>
      <div className="hp-sub">{[["how", "⚙️ آلية التنفيذ"], ["role", "🧑‍⚕️ دور الموجه الصحي"], ["ev", "📎 الشواهد"], ...(canEdit ? [["doc", "✍️ توثيق التنفيذ"]] : [])].map(([k, l]) => <button key={k} className={sub === k ? "on" : ""} onClick={() => setSub(k)}>{l}</button>)}</div>
      {sub === "how" && <div><div style={{ marginTop: 8 }}>{SRC(p.howSrc)}</div><ul className="hp-list">{p.how.map((x, i) => <li key={i}><b style={{ color: TEAL }}>{ar(i + 1)}.</b><span>{x}</span>{rec.how && rec.how[i] ? <b style={{ color: "#15803d", marginInlineStart: "auto" }}>✓ نُفّذ</b> : null}</li>)}</ul></div>}
      {sub === "role" && <div><div style={{ marginTop: 8 }}>{SRC(p.roleSrc)}</div><ul className="hp-list">{p.role.map((x, i) => <li key={i}><b style={{ color: TEAL }}>◆</b><span>{x}</span></li>)}</ul></div>}
      {sub === "ev" && <div><div style={{ marginTop: 8 }}>{SRC("sug")}</div><ul className="hp-list">{[...p.ev, ...arr(rec.evX)].map((x, i) => <li key={i}><b style={{ color: TEAL }}>📎</b><span>{x}</span>{(i < p.ev.length ? evOn(rec, x, i) : 1) ? <b style={{ color: "#15803d", marginInlineStart: "auto" }}>✓ متوفر</b> : <small style={{ color: "#94a3b8", marginInlineStart: "auto" }}>لم يُرفق</small>}</li>)}</ul></div>}
      {sub === "doc" && canEdit && <DocPanel p={p} rec={rec} cfg={cfg} api={api} onSave={onSave} onPrint={onPrint} busy={busy} />}
    </>}
  </div>;
}

// ── توثيق التنفيذ: الحالة، التاريخ (اختياري)، المنفذ، المستفيدون، الإجراءات، الشواهد، الوصف، الصور (١–٦)، الاستمارات PDF
function DocPanel({ p, rec, cfg, api, onSave, onPrint, busy }) {
  const [r, setR] = useState(() => ({ st: "none", ex: cfg.guide || "", ...rec })); const [sv, setSv] = useState(false); const [imgs, setImgs] = useState({}); const [up, setUp] = useState("");
  const set = (k, v) => setR(o => ({ ...o, [k]: v }));
  useEffect(() => { (async () => { if (Object.keys(obj(rec.imgs)).length) setImgs(obj(await api.maGet(`${N.IMG}/${p.id}`))); })(); }, []);
  const im = Object.entries(obj(r.imgs)).sort((a, b) => (a[1].ord || 0) - (b[1].ord || 0));
  const pd = Object.entries(obj(r.pdfs));
  const tick = (k, i) => setR(o => ({ ...o, [k]: { ...obj(o[k]), [i]: obj(o[k])[i] ? 0 : 1 } }));
  const save = async (x = r, quiet) => { setSv(true); try { await onSave(x); if (!quiet) alert("✅ حُفظ توثيق البرنامج"); } catch (e) { alert("تعذّر الحفظ: " + (e.message || e)); } setSv(false); };
  const addImgs = async files => { const room = MAX_IMG - im.length; if (room <= 0) { alert(`الحد الأقصى ${ar(MAX_IMG)} صور`); return; } setUp("img"); let x = { ...r, imgs: { ...obj(r.imgs) } }; const add = {};
    for (const f of [...files].slice(0, room)) { if (!/^image\//.test(f.type)) continue; try { const d = await squeeze(f); const id = "i" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5); await api.maPut(`${N.IMG}/${p.id}/${id}`, d); add[id] = d; x.imgs[id] = { cap: "", ord: Date.now() }; } catch {} }
    setImgs(o => ({ ...o, ...add })); setR(x); await save(x, true); setUp(""); };
  const delImg = async id => { if (!window.confirm("حذف الصورة؟")) return; await api.maPut(`${N.IMG}/${p.id}/${id}`, null); const m = { ...obj(r.imgs) }; delete m[id]; const x = { ...r, imgs: m }; setR(x); await save(x, true); };
  const addPdfs = async files => { const room = MAX_PDF - pd.length; if (room <= 0) { alert(`الحد الأقصى ${ar(MAX_PDF)} استمارات`); return; } setUp("pdf"); let x = { ...r, pdfs: { ...obj(r.pdfs) } };
    for (const f of [...files].slice(0, room)) { if (!/pdf/i.test(f.type) && !/\.pdf$/i.test(f.name)) continue; if (f.size > PDF_MB * 1048576) { alert(`«${f.name}» أكبر من ${ar(PDF_MB)} ميجابايت`); continue; } try { const d = await readUrl(f); const id = "f" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5); await api.maPut(`${N.PDF}/${p.id}/${id}`, d); x.pdfs[id] = { n: f.name.replace(/\.pdf$/i, ""), sz: f.size, at: Date.now() }; } catch {} }
    setR(x); await save(x, true); setUp(""); };
  const delPdf = async id => { if (!window.confirm("حذف الاستمارة؟")) return; await api.maPut(`${N.PDF}/${p.id}/${id}`, null); const m = { ...obj(r.pdfs) }; delete m[id]; const x = { ...r, pdfs: m }; setR(x); await save(x, true); };
  const viewPdf = async id => { const d = await api.maGet(`${N.PDF}/${p.id}/${id}`); if (d) openData(d); };
  const evAll = [...p.ev, ...arr(r.evX)];
  return <div className="hp-doc">
    <div className="hp-g2">
      <label className="hp-lbl">تفعيل البرنامج في المدرسة<select className="hp-in" value={r.act ? "1" : ""} onChange={e => set("act", e.target.value ? 1 : 0)}><option value="">غير مفعّل</option><option value="1">✓ مفعّل</option></select></label>
      <label className="hp-lbl">حالة التنفيذ<select className="hp-in" value={r.st || "none"} onChange={e => set("st", e.target.value)}>{Object.entries(ST).map(([k, v]) => <option key={k} value={k}>{v.t}</option>)}</select></label>
      <label className="hp-lbl">تاريخ التنفيذ (اختياري)<input className="hp-in" type="date" value={r.d1 || ""} onChange={e => set("d1", e.target.value)} />{r.d1 && <small style={{ color: "#64748b" }}>{hij(r.d1)}</small>}</label>
      <label className="hp-lbl">إلى تاريخ (اختياري)<input className="hp-in" type="date" value={r.d2 || ""} onChange={e => set("d2", e.target.value)} />{r.d2 && <small style={{ color: "#64748b" }}>{hij(r.d2)}</small>}</label>
      <label className="hp-lbl">المنفّذ<input className="hp-in" value={r.ex || ""} onChange={e => set("ex", e.target.value)} placeholder="الموجه الصحي / الفريق الصحي" /></label>
      <label className="hp-lbl">عدد المستفيدين<input className="hp-in" type="number" min="0" value={r.ben || ""} onChange={e => set("ben", +e.target.value || 0)} /></label>
      <label className="hp-lbl">مكان التنفيذ<input className="hp-in" value={r.place || ""} onChange={e => set("place", e.target.value)} placeholder="المسرح، الفناء، مصادر التعلم…" /></label>
      <label className="hp-lbl">الجهة المشاركة<input className="hp-in" value={r.part || ""} onChange={e => set("part", e.target.value)} placeholder={cfg.center || "التجمع الصحي / المركز الصحي"} /></label>
    </div>
    <div><b style={{ color: TEAL2, fontSize: 13 }}>⚙️ إجراءات التنفيذ المنجزة</b><ul className="hp-list">{p.how.map((x, i) => <li key={i}><input type="checkbox" checked={!!obj(r.how)[i]} onChange={() => tick("how", i)} /><span>{x}</span></li>)}</ul></div>
    <div><b style={{ color: TEAL2, fontSize: 13 }}>📎 الشواهد المتوفرة</b><ul className="hp-list">{evAll.map((x, i) => <li key={i}>{i < p.ev.length ? <input type="checkbox" checked={evOn(r, x, i)} onChange={() => tick("ev", i)} /> : <button className="hp-btn r" style={{ padding: "0 7px" }} onClick={() => set("evX", arr(r.evX).filter((_, k) => k !== i - p.ev.length))}>×</button>}<span>{x}</span></li>)}</ul>
      <div style={{ display: "flex", gap: 6, marginTop: 6 }}><input className="hp-in" id={"evx-" + p.id} placeholder="إضافة شاهد آخر…" /><button className="hp-btn l" onClick={() => { const el = document.getElementById("evx-" + p.id); const v = el.value.trim(); if (v) { set("evX", [...arr(r.evX), v]); el.value = ""; } }}>＋ إضافة</button></div></div>
    <label className="hp-lbl">وصف ما تم تنفيذه<textarea className="hp-in" rows={4} value={r.txt || ""} onChange={e => set("txt", e.target.value)} placeholder="اكتب بإيجاز كيف نُفّذ البرنامج: الفعاليات، الفئات، المشاركون، الأساليب المستخدمة…" /></label>
    <label className="hp-lbl">النتائج والتوصيات (اختياري)<textarea className="hp-in" rows={2} value={r.out || ""} onChange={e => set("out", e.target.value)} /></label>
    <div><b style={{ color: TEAL2, fontSize: 13 }}>📷 صور التنفيذ ({ar(im.length)} من {ar(MAX_IMG)})</b>
      <div className="hp-imgs" style={{ marginTop: 6 }}>{im.map(([id, m]) => <div key={id} className="hp-img">{imgs[id] ? <img src={imgs[id]} alt="" /> : <div style={{ height: 110, display: "grid", placeItems: "center", color: "#94a3b8" }}>⏳</div>}<button onClick={() => delImg(id)}>×</button><input placeholder="وصف الصورة" value={m.cap || ""} onChange={e => setR(o => ({ ...o, imgs: { ...obj(o.imgs), [id]: { ...m, cap: e.target.value } } }))} /></div>)}
        {im.length < MAX_IMG && <label className="hp-up" style={{ display: "grid", placeItems: "center", minHeight: 110 }}>{up === "img" ? "⏳ جارٍ الرفع…" : "＋ إضافة صور"}<input type="file" accept="image/*" multiple hidden onChange={e => { addImgs(e.target.files); e.target.value = ""; }} /></label>}</div></div>
    <div><b style={{ color: TEAL2, fontSize: 13 }}>📄 الاستمارات والنماذج PDF ({ar(pd.length)} من {ar(MAX_PDF)})</b>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>{pd.map(([id, m]) => <span key={id} className="hp-pdf">📄 <span style={{ cursor: "pointer", textDecoration: "underline" }} onClick={() => viewPdf(id)}>{m.n}</span><small style={{ color: "#94a3b8" }}>{ar(Math.round((m.sz || 0) / 1024))}ك.ب</small><b style={{ color: "#b91c1c", cursor: "pointer" }} onClick={() => delPdf(id)}>×</b></span>)}
        {pd.length < MAX_PDF && <label className="hp-up">{up === "pdf" ? "⏳ جارٍ الرفع…" : "＋ رفع استمارة PDF"}<input type="file" accept="application/pdf,.pdf" multiple hidden onChange={e => { addPdfs(e.target.files); e.target.value = ""; }} /></label>}</div></div>
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><button className="hp-btn" disabled={sv} onClick={() => save()}>{sv ? "⏳ جارٍ الحفظ…" : "💾 حفظ التوثيق"}</button>
      <button className="hp-btn g" disabled={busy} onClick={async () => { await save(r, true); onPrint(); }}>{busy ? "⏳" : "🖨️ حفظ وطباعة تقرير التنفيذ"}</button></div>
  </div>;
}

// ══════════ الطباعة: تقرير تنفيذ البرنامج بترويسة الخطة المشتركة ══════════
const PCSS = `@page{size:A4;margin:8mm 0 10mm}*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{margin:0;font-family:Cairo,Tahoma,sans-serif;color:#0f172a;background:#fff}
.pg{width:210mm;padding:0 11mm;break-before:page}.pg:first-child{break-before:auto}
.hd{position:relative;border-radius:5mm;overflow:hidden;background:linear-gradient(120deg,${TEAL2},${TEAL} 60%,#3aa7c1);color:#fff;padding:3.5mm 5mm 3mm;display:grid;grid-template-columns:1fr auto;gap:4mm;align-items:center}
.hd::after{content:"";position:absolute;inset:auto 0 0 0;height:1.3mm;background:linear-gradient(90deg,${GOLD},#f3e3a3,${GOLD})}
.hd .m{font-size:8.6pt;font-weight:800;line-height:1.65}.hd .m b{font-size:11.5pt;color:#fff}.hd .m i{font-style:normal;display:block;font-size:12.5pt;font-weight:900;color:#fde68a;margin-top:.5mm}
.hd .lg{background:#fff;border-radius:3.5mm;padding:1.6mm 2.5mm;display:flex;gap:2mm;align-items:center}.hd .lg img{height:12mm}
.kh{display:flex;align-items:center;gap:3mm;margin:4mm 0 2.5mm}.kh span{background:${GOLD};color:#fff;font-weight:900;font-size:9pt;padding:1mm 4mm;border-radius:0 3mm 0 3mm}.kh small{font-size:8.5pt;font-weight:800;color:#64748b}
.nm{display:grid;grid-template-columns:34mm 1fr;gap:1.5mm}.nm .l{background:${TEAL};color:#fff;font-weight:900;display:grid;place-items:center;font-size:10pt}.nm .t{background:${GREY};color:${PURP};font-weight:900;font-size:13.5pt;padding:2mm 4mm}
.tb{display:grid;grid-template-columns:1fr 1fr 1.45fr 1.1fr 1.3fr;gap:1.6mm;margin-top:2mm}
.tb h4{margin:0 0 1mm;background:${TEAL};color:#fff;font-size:8.6pt;font-weight:900;padding:1.3mm 2mm}
.rw{display:grid;grid-template-columns:1fr 5mm;gap:.8mm;margin-bottom:.8mm}.rw span{background:${GREY};font-size:7.8pt;font-weight:700;padding:.9mm 1.6mm;line-height:1.45}.rw i{border:.3mm solid #94a3b8;background:#fff;display:grid;place-items:center;font-style:normal;font-weight:900;font-size:9pt;color:${NAVY}}.rw.sp{grid-template-columns:1fr}
.ds{display:grid;grid-template-columns:1fr 30mm;gap:2mm;margin-top:2.5mm;border:.4mm dashed ${DASH};padding:1.5mm}.ds p{margin:0;border:.3mm solid #e5e7eb;padding:2mm 3mm;font-size:9pt;font-weight:600;line-height:1.85;text-align:justify}.ds b{background:${TEAL};color:#fff;display:grid;place-items:center;font-size:10.5pt;font-weight:900}
.h{display:flex;align-items:center;gap:2mm;font-size:10.5pt;font-weight:900;color:${TEAL2};margin:3.5mm 0 1.8mm;break-after:avoid}.h::before{content:"";width:3mm;height:3mm;background:${TEAL};transform:rotate(45deg)}.h::after{content:"";flex:1;height:.4mm;background:linear-gradient(90deg,${TEAL},transparent)}
.ti{display:grid;grid-template-columns:repeat(4,1fr);gap:1.8mm}.ti div{background:#eef7fa;border-inline-start:1.2mm solid ${TEAL};border-radius:2mm;padding:1.4mm 2.5mm;font-size:8.6pt;font-weight:800;color:${NAVY};break-inside:avoid}.ti small{display:block;font-size:6.8pt;color:${TEAL2};font-weight:900}
.two{display:grid;grid-template-columns:1fr 1fr;gap:3mm}
ul.ls{list-style:none;margin:0;padding:0;display:grid;gap:1mm}ul.ls li{display:flex;gap:1.6mm;font-size:8.6pt;font-weight:700;line-height:1.6;break-inside:avoid}ul.ls li b{color:${TEAL};flex:none}ul.ls li.no{color:#94a3b8}
.tx{border:.3mm solid #e2e8f0;border-radius:2.5mm;padding:2mm 3mm;font-size:9pt;font-weight:600;line-height:1.85;text-align:justify;break-inside:avoid}
.ph{display:grid;grid-template-columns:1fr 1fr;gap:4mm}.ph.n1{grid-template-columns:1fr}.ph figure{margin:0;break-inside:avoid;border-radius:3.5mm;padding:1.4mm;background:#fff;box-shadow:0 0 0 .45mm ${TEAL},0 0 0 1.1mm #fff,0 0 0 1.4mm ${GOLD}}
.ph .im{height:58mm;border-radius:2.5mm;overflow:hidden;background:#f1f5f9}.ph.n1 .im{height:85mm}.ph img{width:100%;height:100%;object-fit:cover;display:block}
.ph figcaption{text-align:center;font-size:8pt;font-weight:800;color:${NAVY};padding:1.2mm 1mm 0}
.fm{display:flex;flex-wrap:wrap;gap:1.6mm}.fm span{border:.3mm solid #fecaca;background:#fff5f5;border-radius:2mm;padding:1mm 2.5mm;font-size:8.2pt;font-weight:800}
.ap img{width:100%;max-height:250mm;object-fit:contain;border:.3mm solid #e2e8f0;border-radius:2mm}
.sg{display:grid;grid-template-columns:repeat(3,1fr);gap:7mm;margin:6mm 1mm 1mm;text-align:center;font-size:8.8pt;font-weight:800;break-inside:avoid}.sg i{display:block;height:8mm;border-bottom:.3mm dashed #94a3b8;margin-bottom:1mm}.sg b{display:block;color:${TEAL2}}
.ft{margin-top:3mm;display:flex;justify-content:space-between;align-items:center;border-top:.4mm solid ${TEAL};padding-top:1.3mm;font-size:7.5pt;font-weight:700;color:#64748b}.ft img{height:6mm}
table.lg2{width:100%;border-collapse:collapse;font-size:8.4pt}table.lg2 th{background:${TEAL};color:#fff;padding:1.6mm;font-weight:900}table.lg2 td{border:.3mm solid #cbd5e1;padding:1.3mm 2mm;font-weight:700}table.lg2 tr{break-inside:avoid}table.lg2 td.c{text-align:center}`;
const head = (api, cfg, sub) => `<div class="hd"><div class="m">المملكة العربية السعودية • وزارة التعليم<br>${esc(api.region || "")} — <b>${esc(api.school || "")}</b><i>${esc(HP_TITLE)} ${esc(HP_YEAR)}</i>${sub ? `<span style="font-size:8pt">${esc(sub)}</span>` : ""}</div><div class="lg">${api.moeLogo ? `<img src="${api.moeLogo}">` : ""}<img src="${HP_LOGOS}" style="height:11mm">${api.logo ? `<img src="${api.logo}">` : ""}</div></div>`;
const foot = (api, t) => `<div class="ft"><span>${esc(api.school || "")}</span><span>${esc(t)}</span><span>${todayH()}</span></div>`;
const tableHtml = (p) => { const R = (t, on) => `<div class="rw"><span>${t}</span><i>${on ? "√" : ""}</i></div>`; const pr = p.pr || {};
  return `<div class="tb"><div><h4>المرحلة الدراسية</h4>${HP_STAGES.map(([k, l]) => R(esc(l) + (p.stNote && p.stNote[k] ? ` <small>(${esc(p.stNote[k])})</small>` : ""), p.st[k])).join("")}</div>
  <div><h4>الفئة المستهدفة</h4>${p.tgO.map(t => R(esc(t), p.tg.includes(t))).join("")}</div><div><h4>الجهة المنفذة</h4>${p.exO.map(t => R(esc(t), p.ex.includes(t))).join("")}</div>
  <div><h4>الجهة الداعمة</h4>${p.sp.map(t => `<div class="rw sp"><span>${esc(t)}</span></div>`).join("")}</div>
  <div><h4>فترة التنفيذ</h4>${R("الفصل الدراسي الأول", pr.s1)}${R("الفصل الدراسي الثاني", pr.s2)}${pr.note ? R(`(${esc(pr.note)})`, 1) : ""}</div></div>`; };

async function printExec(api, cfg, p, r) {
  const imE = Object.entries(obj(r.imgs)).sort((a, b) => (a[1].ord || 0) - (b[1].ord || 0)); const src = imE.length ? obj(await api.maGet(`${N.IMG}/${p.id}`)) : {};
  const im = imE.filter(([id]) => src[id]);
  const pdE = Object.entries(obj(r.pdfs)); const appx = [];
  if (pdE.length && api.pdfImgs) for (const [id, m] of pdE) { try { const d = await api.maGet(`${N.PDF}/${p.id}/${id}`); if (!d) continue; const b = await (await fetch(d)).blob(); const pages = await api.pdfImgs(b, { max: 2, w: 1100, q: 0.8 }); pages.forEach((src2, k) => appx.push({ n: m.n, k, src: src2 })); } catch {} }
  const s = ST[r.st || "none"]; const sec = secOf(p.sec);
  const howDone = p.how.map((x, i) => [x, !!obj(r.how)[i]]); const evAll = [...p.ev.map((x, i) => [x, evOn(r, x, i)]), ...arr(r.evX).map(x => [x, true])];
  const per = r.d1 ? `${hij(r.d1)}${r.d2 && r.d2 !== r.d1 ? " — " + hij(r.d2) : ""}` : (p.pr.note || "—");
  const tile = (k, v) => `<div><small>${k}</small>${esc(v || "—")}</div>`;
  let h = `<section class="pg">${head(api, cfg, sec.t)}
  <div class="kh"><span>تقرير تنفيذ برنامج</span><small>${esc(sec.t)} • الحالة: <b style="color:${s.c}">${s.t}</b></small></div>
  <div class="nm"><div class="l">اسم البرنامج</div><div class="t">${esc(p.t)}</div></div>
  ${tableHtml(p)}
  <div class="ds"><p>${esc(p.d)}</p><b>وصف البرنامج</b></div>
  <div class="h">بيانات التنفيذ</div>
  <div class="ti">${tile("تاريخ التنفيذ", per)}${tile("المنفّذ", r.ex || cfg.guide)}${tile("عدد المستفيدين", r.ben ? ar(r.ben) : "")}${tile("مكان التنفيذ", r.place)}${tile("الجهة المشاركة", r.part || cfg.center)}${tile("حالة التنفيذ", s.t)}${tile("الصور المرفقة", ar(im.length))}${tile("الاستمارات المرفقة", ar(pdE.length))}</div>
  <div class="two"><div><div class="h">آلية التنفيذ والإجراءات المنجزة</div><ul class="ls">${howDone.map(([x, d]) => `<li class="${d ? "" : "no"}"><b>${d ? "✔" : "○"}</b><span>${esc(x)}</span></li>`).join("")}</ul></div>
  <div><div class="h">دور الموجه الصحي</div><ul class="ls">${p.role.map(x => `<li><b>◆</b><span>${esc(x)}</span></li>`).join("")}</ul><div class="h">الشواهد</div><ul class="ls">${evAll.map(([x, d]) => `<li class="${d ? "" : "no"}"><b>${d ? "✔" : "○"}</b><span>${esc(x)}</span></li>`).join("")}</ul></div></div>
  ${r.txt ? `<div class="h">وصف ما تم تنفيذه</div><div class="tx">${esc(r.txt).replace(/\n/g, "<br>")}</div>` : ""}
  ${r.out ? `<div class="h">النتائج والتوصيات</div><div class="tx">${esc(r.out).replace(/\n/g, "<br>")}</div>` : ""}
  ${im.length ? `<div class="h">التوثيق المصوّر</div><div class="ph${im.length === 1 ? " n1" : ""}">${im.map(([id, m]) => `<figure><div class="im"><img src="${src[id]}"></div><figcaption>${esc(m.cap || p.t)}</figcaption></figure>`).join("")}</div>` : ""}
  ${pdE.length ? `<div class="h">الاستمارات والنماذج المرفقة</div><div class="fm">${pdE.map(([, m]) => `<span>📄 ${esc(m.n)}</span>`).join("")}</div>` : ""}
  <div class="sg"><div><i></i><b>الموجه الصحي</b>${esc(cfg.guide || r.ex || "")}</div><div><i></i><b>وكيل شؤون الطلاب</b>${esc(cfg.deputy || "")}</div><div><i></i><b>مدير المدرسة</b>${esc(cfg.principal || "")}</div></div>
  ${foot(api, "تقرير تنفيذ: " + p.t)}</section>`;
  appx.forEach(a => { h += `<section class="pg">${head(api, cfg, "ملحق الاستمارات")}<div class="kh"><span>ملحق</span><small>${esc(a.n)}${a.k ? ` — صفحة ${ar(a.k + 1)}` : ""} • ${esc(p.t)}</small></div><div class="ap"><img src="${a.src}"></div>${foot(api, "ملحق: " + a.n)}</section>`; });
  api.print(`<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>تقرير تنفيذ — ${esc(p.t)}</title><link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;800;900&display=swap" rel="stylesheet"><style>${PCSS}</style></head><body>${h}<script>(async()=>{try{await document.fonts.ready}catch(e){}await Promise.all([...document.images].map(i=>i.complete?1:new Promise(r=>{i.onload=i.onerror=r})));setTimeout(()=>print(),400);})();</script></body></html>`);
}

function printLog(api, cfg, list, R) {
  const rows = list.map((p, i) => { const r = obj(R[p.id]); const s = ST[r.st || "none"]; return `<tr><td class="c">${ar(i + 1)}</td><td>${esc(p.t)}</td><td>${esc(secOf(p.sec).t)}</td><td class="c">${esc(p.pr.note || [p.pr.s1 && "ف١", p.pr.s2 && "ف٢"].filter(Boolean).join(" + "))}</td><td class="c">${r.d1 ? hij(r.d1) : "—"}</td><td class="c">${r.ben ? ar(r.ben) : "—"}</td><td class="c" style="color:${s.c};font-weight:900">${s.t}</td><td class="c">${ar(Object.keys(obj(r.imgs)).length)} / ${ar(Object.keys(obj(r.pdfs)).length)}</td></tr>`; }).join("");
  const dn = list.filter(p => obj(R[p.id]).st === "done").length;
  const h = `<section class="pg">${head(api, cfg, "سجل متابعة تنفيذ البرامج")}<div class="kh"><span>سجل تنفيذ الخطة</span><small>المنفّذ ${ar(dn)} من ${ar(list.length)} برنامجاً</small></div>
  <table class="lg2"><thead><tr><th>م</th><th>البرنامج</th><th>القسم</th><th>فترة التنفيذ</th><th>تاريخ التنفيذ</th><th>المستفيدون</th><th>الحالة</th><th>صور / استمارات</th></tr></thead><tbody>${rows}</tbody></table>
  <div class="sg"><div><i></i><b>الموجه الصحي</b>${esc(cfg.guide || "")}</div><div><i></i><b>وكيل شؤون الطلاب</b>${esc(cfg.deputy || "")}</div><div><i></i><b>مدير المدرسة</b>${esc(cfg.principal || "")}</div></div>${foot(api, "سجل تنفيذ الخطة الصحية")}</section>`;
  api.print(`<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>سجل تنفيذ الخطة الصحية</title><link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;800;900&display=swap" rel="stylesheet"><style>${PCSS}</style></head><body>${h}<script>(async()=>{try{await document.fonts.ready}catch(e){}setTimeout(()=>print(),400);})();</script></body></html>`);
}

export { printExec, printLog };
