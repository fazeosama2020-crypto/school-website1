// ═══════════════════════════════════════════════════════════════════════════
//  📂 إجراءات معالجة غياب الطلاب — ملف لكل طالب بإجراءات وكيل شؤون الطلاب والموجه الطلابي
//  (التنبيه • الاستدعاء • التعهد • الإرشاد ودراسة الحالة • الرفع لإدارة التعليم • الحماية الأسرية)
//  مع الشواهد (صور واستمارات PDF) وتقرير مطبوع موقّع من الموجه الطلابي والوكيل والمدير
// ═══════════════════════════════════════════════════════════════════════════
import React, { useState, useEffect, useMemo } from "react";

const N = { CFG: "school-absact-cfg", R: "school-absact", IMG: "school-absact-img", PDF: "school-absact-pdf" };
const NAVY = "#0b2545", NAVY2 = "#13315c", GOLD = "#c9a227", GOLD2 = "#a8841c", RED = "#b91c1c";
const obj = v => (v && typeof v === "object" ? v : {});
const arr = v => (Array.isArray(v) ? v : v && typeof v === "object" ? Object.values(v) : []);
const ar = n => String(n ?? "").replace(/\d/g, d => "٠١٢٣٤٥٦٧٨٩"[d]);
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const hij = d => { try { return d ? new Date(d + "T12:00:00").toLocaleDateString("ar-SA-u-ca-islamic-umalqura", { day: "numeric", month: "long", year: "numeric" }) : ""; } catch { return d || ""; } };
const hijS = d => { try { return d ? new Date(d + "T12:00:00").toLocaleDateString("ar-SA-u-ca-islamic-umalqura", { day: "numeric", month: "short" }) : ""; } catch { return d || ""; } };
const dayN = d => { try { return new Date(d + "T12:00:00").toLocaleDateString("ar-SA", { weekday: "long" }); } catch { return ""; } };
const todayH = () => { try { return new Date().toLocaleDateString("ar-SA-u-ca-islamic-umalqura", { day: "numeric", month: "long", year: "numeric" }); } catch { return ""; } };
const isoToday = () => { const t = new Date(); return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`; };
const yearStart = () => { const t = new Date(); const y = t.getMonth() >= 7 ? t.getFullYear() : t.getFullYear() - 1; return `${y}-08-01`; };

// الإجراءات المتدرجة (العتبة = أيام الغياب بدون عذر التي يُستحق عندها الإجراء — قابلة للتعديل من الإعدادات)
// مرجعها المتدرج: قواعد السلوك والمواظبة (٣ أيام إنذار أول وتحويل للموجه الطلابي • ٥ إشعار ولي الأمر • ١٠ استدعاء وتعهد خطي • ١٥ تحويل لمكتب التعليم • ٢٠ الرفع لإدارة التعليم ونظام حماية الطفل)
export const AA_STEPS = [
  { k: "msg", ic: "📩", t: "إرسال رسائل التنبيه للطالب وولي أمره", s: "التنبيه والإنذار", th: 3, who: "dep", c: "#0369a1",
    f: [["ch", "وسيلة التنبيه", "sel", ["نظام نور", "رسالة نصية SMS", "واتساب", "اتصال هاتفي", "خطاب ورقي", "منصة مدرستي"]], ["cnt", "عدد الرسائل", "num"], ["no", "رقم الإنذار", "sel", ["الإنذار الأول", "الإنذار الثاني", "الإنذار الثالث"]]] },
  { k: "call", ic: "📞", t: "استدعاء ولي الأمر للوقوف على الأسباب", s: "الاستدعاء", th: 5, who: "dep", c: "#7c3aed",
    f: [["att", "حضور ولي الأمر", "sel", ["حضر", "لم يحضر", "اعتذر وحدد موعداً آخر"]], ["why", "الأسباب التي ذكرها ولي الأمر", "txt"]] },
  { k: "pledge", ic: "✍️", t: "أخذ تعهد على الطالب وولي أمره", s: "التعهد الخطي", th: 10, who: "dep", c: "#b45309",
    f: [["sgn", "توقيع التعهد", "sel", ["وقّع الطالب وولي الأمر", "وقّع الطالب فقط", "وقّع ولي الأمر فقط"]]] },
  { k: "counsel", ic: "🧭", t: "جلسة إرشاد فردي ودراسة حالة", s: "الإرشاد ودراسة الحالة", th: 10, who: "cou", c: "#047857",
    f: [["ses", "عدد الجلسات", "num"], ["cause", "الأسباب التي توصلت إليها دراسة الحالة", "txt"], ["plan", "الخطة العلاجية والخدمات المقدمة", "txt"]] },
  { k: "raise", ic: "🏛️", t: "الرفع لإدارة التعليم حول المشكلة والإجراءات التي قامت بها المدرسة", s: "الرفع لإدارة التعليم", th: 15, who: "mgr", c: "#1d4ed8",
    f: [["ref", "رقم الخطاب / المعاملة", "str"], ["to", "الجهة المرفوع لها", "sel", ["مكتب التعليم (التوجيه الطلابي)", "إدارة التعليم (الرعاية الطلابية)", "إدارة التعليم (قسم التوجيه والإرشاد)"]]] },
  { k: "protect", ic: "🛡️", t: "التحويل إلى الحماية الأسرية (حماية الطفل)", s: "الحماية الأسرية", th: 20, who: "mgr", c: RED,
    f: [["ref", "رقم الإحالة / البلاغ", "str"], ["to", "الجهة", "sel", ["وحدة حماية الطفل", "الحماية الأسرية", "عبر إدارة التعليم"]]] },
];
const WHO = { dep: "وكيل شؤون الطلاب", cou: "الموجه الطلابي", mgr: "مدير المدرسة" };

const squeeze = (file, max = 1400, q = 0.8) => new Promise((res, rej) => { const fr = new FileReader(); fr.onerror = rej; fr.onload = () => { const im = new Image(); im.onerror = rej; im.onload = () => { const k = Math.min(1, max / Math.max(im.width, im.height)); const c = document.createElement("canvas"); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k); const x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height); x.drawImage(im, 0, 0, c.width, c.height); res(c.toDataURL("image/jpeg", q)); }; im.src = fr.result; }; fr.readAsDataURL(file); });
const readUrl = f => new Promise((res, rej) => { const fr = new FileReader(); fr.onerror = rej; fr.onload = () => res(fr.result); fr.readAsDataURL(f); });
const openData = d => { try { const [h, b] = d.split(","); const mime = (h.match(/data:([^;]+)/) || [])[1] || "application/pdf"; const bin = atob(b); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); window.open(URL.createObjectURL(new Blob([u], { type: mime })), "_blank"); } catch { alert("تعذّر فتح الملف"); } };

const CSS = `
.aa{direction:rtl;display:grid;gap:12px;color:#0f172a}
.aa-hero{position:relative;overflow:hidden;border-radius:22px;padding:18px 20px;color:#fff;background:linear-gradient(125deg,${NAVY},${NAVY2} 55%,#1e3a8a);display:grid;gap:10px}
.aa-hero::before{content:"";position:absolute;inset:auto auto -90px -60px;width:260px;height:260px;border-radius:50%;border:30px solid rgba(201,162,39,.18)}
.aa-hero h1{margin:0;font-size:22px;font-weight:900}.aa-hero small{color:#f3d77a;font-weight:800}
.aa-k{display:grid;grid-template-columns:repeat(auto-fit,minmax(115px,1fr));gap:8px;position:relative}.aa-k div{background:rgba(255,255,255,.1);border:1px solid rgba(243,215,122,.35);border-radius:14px;padding:8px 10px}.aa-k b{display:block;font-size:22px;color:#f3d77a}.aa-k span{font-size:11.5px;font-weight:800}
.aa-bar{display:flex;gap:6px;flex-wrap:wrap;align-items:center;background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:8px 10px}
.aa-in{border:1.5px solid #e2e8f0;border-radius:11px;padding:7px 10px;font-family:inherit;font-size:13.5px;background:#fff;box-sizing:border-box}
.aa-btn{border:none;border-radius:11px;padding:7px 13px;font-weight:900;font-size:13px;cursor:pointer;font-family:inherit;background:${NAVY};color:#fff;display:inline-flex;align-items:center;gap:5px}
.aa-btn.g{background:linear-gradient(135deg,${GOLD2},${GOLD});color:#fff}.aa-btn.l{background:#fff;color:${NAVY};border:1.5px solid #cbd5e1}.aa-btn.r{background:#fff;color:${RED};border:1.5px solid #fecaca}.aa-btn:disabled{opacity:.5}
.aa-chip{border:1.5px solid #e2e8f0;background:#fff;border-radius:999px;padding:5px 11px;font-weight:800;font-size:12.5px;cursor:pointer;font-family:inherit}.aa-chip.on{background:${NAVY};color:#fff;border-color:${NAVY}}
.aa-tbl{width:100%;border-collapse:separate;border-spacing:0 6px}.aa-tbl th{font-size:12px;color:#64748b;font-weight:900;text-align:right;padding:0 8px}
.aa-tbl td{background:#fff;padding:8px;font-size:13.5px;font-weight:700;border-top:1px solid #eef2f7;border-bottom:1px solid #eef2f7}.aa-tbl td:first-child{border-radius:0 14px 14px 0;border-right:1px solid #eef2f7}.aa-tbl td:last-child{border-radius:14px 0 0 14px;border-left:1px solid #eef2f7}
.aa-num{display:inline-grid;place-items:center;min-width:30px;height:26px;border-radius:9px;font-weight:900;padding:0 6px}
.aa-lad{display:flex;gap:3px}.aa-lad i{width:22px;height:22px;border-radius:7px;display:grid;place-items:center;font-style:normal;font-size:11px;font-weight:900}
.aa-ov{position:fixed;inset:0;z-index:9999;background:rgba(11,37,69,.55);backdrop-filter:blur(3px);display:flex;justify-content:center;align-items:flex-start;overflow:auto;padding:16px}
.aa-md{width:min(1050px,100%);background:#f6f8fc;border-radius:22px;overflow:hidden;box-shadow:0 30px 80px -20px rgba(0,0,0,.5)}
.aa-mh{background:linear-gradient(125deg,${NAVY},${NAVY2});color:#fff;padding:14px 18px;display:flex;gap:12px;align-items:center;flex-wrap:wrap;border-bottom:4px solid ${GOLD}}
.aa-av{width:52px;height:52px;border-radius:16px;background:linear-gradient(135deg,${GOLD},#f3d77a);color:${NAVY};display:grid;place-items:center;font-weight:900;font-size:22px}
.aa-sum{display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:8px}.aa-sum div{background:#fff;border-radius:14px;padding:8px 10px;border:1px solid #e2e8f0;text-align:center}.aa-sum b{display:block;font-size:22px;font-weight:900}.aa-sum span{font-size:11.5px;color:#64748b;font-weight:800}
.aa-days{display:flex;flex-wrap:wrap;gap:4px}.aa-days span{border-radius:8px;padding:2px 8px;font-size:11.5px;font-weight:800}
.aa-step{position:relative;background:#fff;border:1.5px solid #e2e8f0;border-radius:16px;padding:10px 12px;margin-inline-start:26px}
.aa-step::before{content:"";position:absolute;inset-inline-start:-19px;top:-12px;bottom:-12px;width:3px;background:#e2e8f0}
.aa-step .dot{position:absolute;inset-inline-start:-31px;top:12px;width:27px;height:27px;border-radius:50%;display:grid;place-items:center;color:#fff;font-size:13px;font-weight:900;box-shadow:0 0 0 4px #f6f8fc}
.aa-step h3{margin:0;font-size:15px;font-weight:900;display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.aa-g{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:8px;margin-top:8px}
.aa-lbl{display:grid;gap:3px;font-size:11.5px;font-weight:900;color:#475569}
.aa-files{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}.aa-th{position:relative;width:92px}.aa-th img{width:92px;height:68px;object-fit:cover;border-radius:10px;border:2px solid #e2e8f0;display:block}.aa-th b{position:absolute;top:2px;left:2px;background:${RED};color:#fff;border-radius:6px;width:18px;height:18px;display:grid;place-items:center;cursor:pointer;font-size:11px}
.aa-pdf{display:inline-flex;align-items:center;gap:5px;background:#fff5f5;border:1.5px solid #fecaca;border-radius:10px;padding:4px 9px;font-size:12px;font-weight:800}
.aa-up{border:2px dashed #cbd5e1;border-radius:10px;padding:6px 10px;font-size:12px;font-weight:900;color:${NAVY};cursor:pointer;background:#fff;display:inline-flex;align-items:center}
.aa-pill{border-radius:999px;padding:2px 9px;font-size:11px;font-weight:900}
.aa-tbl .sm{display:none}@media(max-width:700px){.aa-tbl .hm{display:none}.aa-tbl .sm{display:block}}
`;

const stepState = (rec, st, u) => { const r = obj(obj(rec.steps)[st.k]); if (r.done) return "done"; if (u >= st.th) return "due"; return "wait"; };
const SS = { done: ["#15803d", "#dcfce7", "✓"], due: [RED, "#fee2e2", "!"], wait: ["#94a3b8", "#f1f5f9", ""] };

export function AbsAction({ api, me = {}, onClose }) {
  const [cfg, setCfg] = useState({}); const [R, setR] = useState({}); const [D, setD] = useState(null); const [err, setErr] = useState("");
  const [f, setF] = useState(yearStart()); const [t, setT] = useState(isoToday()); const [ck, setCk] = useState(""); const [min, setMin] = useState(3); const [onlyDue, setOnlyDue] = useState(false); const [q, setQ] = useState("");
  const [sel, setSel] = useState(null); const [showCfg, setShowCfg] = useState(false);
  const load = async () => { setD(null); setErr(""); try { const [c, r, d] = await Promise.all([api.maGet(N.CFG), api.maGet(N.R), api.absData(f, t)]); setCfg(obj(c)); setR(obj(r)); setD(d); } catch (e) { setErr(String(e.message || e)); setD({ list: [], classes: [] }); } };
  useEffect(() => { load(); }, [f, t]);
  const TH = k => +(obj(cfg.th)[k] || AA_STEPS.find(s => s.k === k).th);
  const steps = AA_STEPS.map(s => ({ ...s, th: TH(s.k) }));
  const recOf = sid => obj(R[sid]);
  const L = useMemo(() => !D ? [] : D.list.filter(s => s.abs.length >= min && (!ck || s.ck === ck) && (!q || s.name.includes(q.trim())) && (!onlyDue || steps.some(st => stepState(recOf(s.sid), st, s.u) === "due"))).sort((a, b) => b.u - a.u || b.abs.length - a.abs.length), [D, min, ck, q, onlyDue, R, cfg]);
  const all = D ? D.list.filter(s => s.abs.length >= min) : [];
  const dueN = all.filter(s => steps.some(st => stepState(recOf(s.sid), st, s.u) === "due")).length;
  const opened = all.filter(s => Object.values(obj(recOf(s.sid).steps)).some(x => x && x.done)).length;
  const saveRec = async (sid, rec) => { const v = { ...rec, at: Date.now(), by: me.name || "" }; await api.maPut(`${N.R}/${sid}`, v); setR(o => ({ ...o, [sid]: v })); };
  const saveCfg = async c => { await api.maPut(N.CFG, c); setCfg(c); };
  return <div className="aa"><style>{CSS}</style>
    <div className="aa-hero">
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}><div style={{ flex: 1 }}><h1>📂 إجراءات معالجة غياب الطلاب</h1><small>ملف لكل طالب بالإجراءات المتدرجة لوكيل شؤون الطلاب والموجه الطلابي — بالشواهد والاستمارات وتقرير موقّع</small></div>
        {onClose && <button className="aa-btn l" onClick={onClose}>✕ إغلاق</button>}</div>
      <div className="aa-k"><div><b>{ar(all.length)}</b><span>طالب غيابه {ar(min)} أيام فأكثر</span></div><div><b>{ar(dueN)}</b><span>لديهم إجراء مستحق لم يُنفّذ</span></div><div><b>{ar(opened)}</b><span>فُتح لهم ملف إجراءات</span></div>
        <div><b>{ar(all.filter(s => obj(obj(recOf(s.sid).steps).raise).done).length)}</b><span>رُفع لإدارة التعليم</span></div><div><b>{ar(all.filter(s => obj(obj(recOf(s.sid).steps).protect).done).length)}</b><span>حُوّل للحماية الأسرية</span></div></div>
    </div>
    <div className="aa-bar">
      <label className="aa-lbl" style={{ display: "flex", alignItems: "center", gap: 4 }}>من<input type="date" className="aa-in" value={f} onChange={e => setF(e.target.value)} /></label>
      <label className="aa-lbl" style={{ display: "flex", alignItems: "center", gap: 4 }}>إلى<input type="date" className="aa-in" value={t} onChange={e => setT(e.target.value)} /></label>
      <select className="aa-in" value={ck} onChange={e => setCk(e.target.value)}><option value="">كل الفصول</option>{(D ? D.classes : []).map(c => <option key={c.ck} value={c.ck}>{c.name}</option>)}</select>
      <select className="aa-in" value={min} onChange={e => setMin(+e.target.value)}>{[1, 3, 5, 10, 15, 20].map(n => <option key={n} value={n}>غياب {ar(n)} أيام فأكثر</option>)}</select>
      <label className="aa-chip" style={{ display: "inline-flex", gap: 4, alignItems: "center" }}><input type="checkbox" checked={onlyDue} onChange={e => setOnlyDue(e.target.checked)} /> المستحق إجراؤه فقط</label>
      <input className="aa-in" style={{ flex: 1, minWidth: 140 }} placeholder="🔎 اسم الطالب" value={q} onChange={e => setQ(e.target.value)} />
      <button className="aa-btn g" disabled={!L.length} onClick={() => printLog(api, cfg, L, R, steps, f, t)}>🖨️ سجل الإجراءات</button>
      <button className="aa-btn l" onClick={() => setShowCfg(v => !v)}>⚙️ الإعدادات</button>
    </div>
    {showCfg && <CfgBox cfg={cfg} onSave={saveCfg} />}
    {!D ? <div style={{ padding: 30, textAlign: "center", fontWeight: 900, color: NAVY }}>⏳ جارٍ حصر الغياب…</div> : <>
      {err && <div style={{ color: RED, fontWeight: 800 }}>⚠️ {err}</div>}
      <div style={{ fontSize: 12, fontWeight: 800, color: "#64748b", display: "flex", gap: 10, flexWrap: "wrap" }}>سلّم الإجراءات: {steps.map((s, i) => <span key={s.k}>{ar(i + 1)}. {s.s} <b style={{ color: s.c }}>({ar(s.th)} أيام)</b></span>)}</div>
      <table className="aa-tbl"><thead><tr><th>الطالب</th><th className="hm">الفصل</th><th>بدون عذر</th><th className="hm">بعذر</th><th>الإجمالي</th><th>الإجراءات</th><th></th></tr></thead><tbody>
        {L.map(s => { const rec = recOf(s.sid); return <tr key={s.sid}>
          <td><b>{s.name}</b><div style={{ fontSize: 11, color: "#64748b" }} className="sm">{s.cls}</div></td><td className="hm">{s.cls}</td>
          <td><span className="aa-num" style={{ background: s.u >= 10 ? "#fee2e2" : s.u >= 5 ? "#fef3c7" : "#f1f5f9", color: s.u >= 10 ? RED : s.u >= 5 ? "#b45309" : "#334155" }}>{ar(s.u)}</span></td>
          <td className="hm"><span className="aa-num" style={{ background: "#dcfce7", color: "#15803d" }}>{ar(s.e)}</span></td><td><b>{ar(s.abs.length)}</b></td>
          <td><div className="aa-lad">{steps.map((st, i) => { const x = SS[stepState(rec, st, s.u)]; return <i key={st.k} title={`${st.t} — ${x === SS.done ? "منفّذ" : x === SS.due ? "مستحق" : "لم يُستحق بعد"}`} style={{ background: x[1], color: x[0], border: `1.5px solid ${x[0]}55` }}>{x === SS.done ? "✓" : ar(i + 1)}</i>; })}</div></td>
          <td><button className="aa-btn" onClick={() => setSel(s)}>📂 ملف الطالب</button></td></tr>; })}
      </tbody></table>
      {!L.length && <div style={{ textAlign: "center", padding: 20, color: "#64748b", fontWeight: 800 }}>لا يوجد طلاب مطابقون للفترة والشروط.</div>}
    </>}
    {sel && <StudentFile api={api} me={me} cfg={cfg} s={sel} rec={recOf(sel.sid)} steps={steps} f={f} t={t} onSave={r => saveRec(sel.sid, r)} onClose={() => setSel(null)} />}
  </div>;
}

function CfgBox({ cfg, onSave }) {
  const [c, setC] = useState({ ...cfg, th: { ...obj(cfg.th) } }); const set = (k, v) => setC(o => ({ ...o, [k]: v }));
  return <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: 12, display: "grid", gap: 10 }}>
    <div className="aa-g">
      <label className="aa-lbl">الموجه الطلابي<input className="aa-in" value={c.cou || ""} onChange={e => set("cou", e.target.value)} /></label>
      <label className="aa-lbl">وكيل شؤون الطلاب<input className="aa-in" value={c.dep || ""} onChange={e => set("dep", e.target.value)} /></label>
      <label className="aa-lbl">مدير المدرسة<input className="aa-in" value={c.mgr || ""} onChange={e => set("mgr", e.target.value)} /></label>
    </div>
    <b style={{ fontSize: 13, color: NAVY }}>عتبات استحقاق الإجراءات (أيام الغياب بدون عذر)</b>
    <div className="aa-g">{AA_STEPS.map(s => <label key={s.k} className="aa-lbl">{s.ic} {s.s}<input className="aa-in" type="number" min="1" value={obj(c.th)[s.k] || s.th} onChange={e => setC(o => ({ ...o, th: { ...obj(o.th), [s.k]: +e.target.value || s.th } }))} /></label>)}</div>
    <small style={{ color: "#64748b", fontWeight: 700 }}>القيم الافتراضية وفق التدرج المعمول به في قواعد السلوك والمواظبة، ويمكن تعديلها حسب التعميم المعتمد لديكم.</small>
    <div><button className="aa-btn" onClick={() => onSave(c).then(() => alert("✅ حُفظت الإعدادات"))}>💾 حفظ</button></div>
  </div>;
}

// ── ملف الطالب: أيام الغياب + الإجراءات الستة + الشواهد + الطباعة
function StudentFile({ api, me, cfg, s, rec, steps, f, t, onSave, onClose }) {
  const [r, setR] = useState(() => ({ steps: {}, files: {}, ...rec })); const [src, setSrc] = useState({}); const [sv, setSv] = useState(false); const [up, setUp] = useState(null); const [pb, setPb] = useState(false);
  useEffect(() => { (async () => { if (Object.values(obj(rec.files)).some(x => x.k === "img")) setSrc(obj(await api.maGet(`${N.IMG}/${s.sid}`))); })(); }, []);
  const setStep = (k, patch) => setR(o => ({ ...o, steps: { ...obj(o.steps), [k]: { ...obj(obj(o.steps)[k]), ...patch } } }));
  const save = async (x = r, quiet) => { setSv(true); try { await onSave(x); if (!quiet) alert("✅ حُفظ ملف الطالب"); } catch (e) { alert("تعذّر الحفظ: " + (e.message || e)); } setSv(false); };
  const files = Object.entries(obj(r.files)).sort((a, b) => (a[1].at || 0) - (b[1].at || 0));
  const addFiles = async (list, st) => { setUp(st); let x = { ...r, files: { ...obj(r.files) } }; const add = {};
    for (const fl of [...list]) { const id = "x" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
      try { if (/^image\//.test(fl.type)) { const d = await squeeze(fl); await api.maPut(`${N.IMG}/${s.sid}/${id}`, d); add[id] = d; x.files[id] = { k: "img", st, n: fl.name.replace(/\.[^.]+$/, ""), at: Date.now() }; }
        else if (/pdf/i.test(fl.type) || /\.pdf$/i.test(fl.name)) { if (fl.size > 4 * 1048576) { alert(`«${fl.name}» أكبر من ٤ ميجابايت`); continue; } const d = await readUrl(fl); await api.maPut(`${N.PDF}/${s.sid}/${id}`, d); x.files[id] = { k: "pdf", st, n: fl.name.replace(/\.pdf$/i, ""), sz: fl.size, at: Date.now() }; } } catch {} }
    setSrc(o => ({ ...o, ...add })); setR(x); await save(x, true); setUp(null); };
  const delFile = async (id, m) => { if (!window.confirm("حذف الشاهد؟")) return; await api.maPut(`${m.k === "img" ? N.IMG : N.PDF}/${s.sid}/${id}`, null); const fm = { ...obj(r.files) }; delete fm[id]; const x = { ...r, files: fm }; setR(x); await save(x, true); };
  const viewPdf = async id => { const d = await api.maGet(`${N.PDF}/${s.sid}/${id}`); if (d) openData(d); };
  const Files = ({ st }) => { const F = files.filter(([, m]) => (m.st || "") === st); return <div className="aa-files">
    {F.map(([id, m]) => m.k === "img" ? <div key={id} className="aa-th">{src[id] ? <img src={src[id]} alt="" /> : <div style={{ width: 92, height: 68, background: "#f1f5f9", borderRadius: 10 }} />}<b onClick={() => delFile(id, m)}>×</b><input className="aa-in" style={{ width: 92, padding: "2px 4px", fontSize: 10.5, marginTop: 2 }} value={m.cap ?? m.n ?? ""} onChange={e => setR(o => ({ ...o, files: { ...obj(o.files), [id]: { ...m, cap: e.target.value } } }))} /></div>
      : <span key={id} className="aa-pdf">📄 <span style={{ cursor: "pointer", textDecoration: "underline" }} onClick={() => viewPdf(id)}>{m.n}</span><b style={{ color: RED, cursor: "pointer" }} onClick={() => delFile(id, m)}>×</b></span>)}
    <label className="aa-up">{up === st ? "⏳ جارٍ الرفع…" : "＋ شاهد (صورة / PDF)"}<input type="file" accept="image/*,application/pdf,.pdf" multiple hidden onChange={e => { addFiles(e.target.files, st); e.target.value = ""; }} /></label></div>; };
  const months = useMemo(() => { const M = {}; s.abs.slice().sort().forEach(d => { const k = (() => { try { return new Date(d + "T12:00:00").toLocaleDateString("ar-SA-u-ca-islamic-umalqura", { month: "long", year: "numeric" }); } catch { return d.slice(0, 7); } })(); (M[k] = M[k] || []).push(d); }); return Object.entries(M); }, [s]);
  const doneN = steps.filter(st => obj(obj(r.steps)[st.k]).done).length;
  return <div className="aa-ov" onClick={e => { if (e.target === e.currentTarget) onClose(); }}><div className="aa-md">
    <div className="aa-mh"><div className="aa-av">{(s.name || "؟").trim()[0]}</div><div style={{ flex: 1 }}><b style={{ fontSize: 18 }}>{s.name}</b><div style={{ fontSize: 12.5, color: "#f3d77a", fontWeight: 800 }}>{s.cls} • ملف إجراءات معالجة الغياب • المنفّذ {ar(doneN)} من {ar(steps.length)}</div></div>
      <button className="aa-btn g" disabled={pb} onClick={async () => { await save(r, true); setPb(true); try { await printFile(api, cfg, s, r, steps, f, t); } catch (e) { alert("تعذّر إعداد التقرير: " + (e.message || e)); } setPb(false); }}>{pb ? "⏳ جارٍ التجهيز…" : "🖨️ حفظ وطباعة التقرير"}</button>
      <button className="aa-btn" disabled={sv} onClick={() => save()}>{sv ? "⏳" : "💾 حفظ"}</button><button className="aa-btn l" onClick={onClose}>✕</button></div>
    <div style={{ padding: 14, display: "grid", gap: 12 }}>
      <div className="aa-sum"><div><b style={{ color: RED }}>{ar(s.u)}</b><span>غياب بدون عذر</span></div><div><b style={{ color: "#15803d" }}>{ar(s.e)}</b><span>غياب بعذر</span></div><div><b style={{ color: NAVY }}>{ar(s.abs.length)}</b><span>إجمالي أيام الغياب</span></div><div><b style={{ color: GOLD2 }}>{ar(doneN)}/{ar(steps.length)}</b><span>الإجراءات المنفّذة</span></div></div>
      <div style={{ background: "#fff", borderRadius: 16, padding: 10, border: "1px solid #e2e8f0" }}><b style={{ fontSize: 13, color: NAVY }}>🗓️ أيام الغياب ({hijS(f)} — {hijS(t)})</b>
        {months.map(([m, ds]) => <div key={m} style={{ marginTop: 6 }}><small style={{ fontWeight: 900, color: GOLD2 }}>{m}</small><div className="aa-days">{ds.map(d => { const e = s.ex.includes(d); return <span key={d} title={dayN(d)} style={{ background: e ? "#dcfce7" : "#fee2e2", color: e ? "#15803d" : RED }}>{dayN(d)} {hijS(d)}{e ? " (بعذر)" : ""}</span>; })}</div></div>)}</div>
      <div style={{ display: "grid", gap: 14, paddingTop: 6 }}>{steps.map((st, i) => { const x = obj(obj(r.steps)[st.k]); const state = stepState(r, st, s.u); const ss = SS[state];
        return <div key={st.k} className="aa-step" style={{ borderColor: x.done ? "#86efac" : state === "due" ? "#fecaca" : "#e2e8f0" }}><span className="dot" style={{ background: x.done ? "#15803d" : state === "due" ? RED : st.c }}>{x.done ? "✓" : ar(i + 1)}</span>
          <h3><span>{st.ic} {st.t}</span><span className="aa-pill" style={{ background: ss[1], color: ss[0] }}>{x.done ? "منفّذ" : state === "due" ? `مستحق (${ar(st.th)} أيام)` : `يُستحق عند ${ar(st.th)} أيام`}</span><span className="aa-pill" style={{ background: "#eef2ff", color: "#3730a3" }}>{WHO[st.who]}</span>
            <label style={{ marginInlineStart: "auto", display: "inline-flex", gap: 5, alignItems: "center", fontSize: 13 }}><input type="checkbox" style={{ width: 18, height: 18, accentColor: "#15803d" }} checked={!!x.done} onChange={e => setStep(st.k, { done: e.target.checked ? 1 : 0, d: x.d || (e.target.checked ? isoToday() : ""), by: x.by || cfg[st.who] || "" })} /> تم التنفيذ</label></h3>
          {(x.done || state === "due") && <>
            <div className="aa-g">
              <label className="aa-lbl">تاريخ الإجراء<input type="date" className="aa-in" value={x.d || ""} onChange={e => setStep(st.k, { d: e.target.value })} />{x.d && <small style={{ color: "#64748b" }}>{hij(x.d)}</small>}</label>
              <label className="aa-lbl">المنفّذ<input className="aa-in" value={x.by ?? ""} placeholder={cfg[st.who] || WHO[st.who]} onChange={e => setStep(st.k, { by: e.target.value })} /></label>
              {st.f.filter(([, , ty]) => ty !== "txt").map(([fk, fl, ty, opts]) => <label key={fk} className="aa-lbl">{fl}{ty === "sel" ? <select className="aa-in" value={x[fk] || ""} onChange={e => setStep(st.k, { [fk]: e.target.value })}><option value="">—</option>{opts.map(o => <option key={o}>{o}</option>)}</select> : <input className="aa-in" type={ty === "num" ? "number" : "text"} value={x[fk] || ""} onChange={e => setStep(st.k, { [fk]: e.target.value })} />}</label>)}
            </div>
            {st.f.filter(([, , ty]) => ty === "txt").map(([fk, fl]) => <label key={fk} className="aa-lbl" style={{ marginTop: 6 }}>{fl}<textarea className="aa-in" rows={2} value={x[fk] || ""} onChange={e => setStep(st.k, { [fk]: e.target.value })} /></label>)}
            <label className="aa-lbl" style={{ marginTop: 6 }}>ملاحظات ونتيجة الإجراء<textarea className="aa-in" rows={2} value={x.note || ""} onChange={e => setStep(st.k, { note: e.target.value })} /></label>
            <Files st={st.k} /></>}
        </div>; })}</div>
      <div style={{ background: "#fff", borderRadius: 16, padding: 12, border: "1px solid #e2e8f0", display: "grid", gap: 8 }}>
        <label className="aa-lbl">الوضع الحالي للطالب بعد الإجراءات<select className="aa-in" value={r.now || ""} onChange={e => setR(o => ({ ...o, now: e.target.value }))}><option value="">—</option>{["تحسّن الانتظام", "تحسّن جزئي ويحتاج متابعة", "لم يتحسّن", "انقطع عن الدراسة"].map(o => <option key={o}>{o}</option>)}</select></label>
        <label className="aa-lbl">التوصيات وخلاصة الحالة<textarea className="aa-in" rows={3} value={r.rec || ""} onChange={e => setR(o => ({ ...o, rec: e.target.value }))} /></label>
        <b style={{ fontSize: 13, color: NAVY }}>📎 شواهد عامة للملف</b><Files st="" />
      </div>
    </div>
  </div></div>;
}

// ══════════ تقرير الطالب المطبوع (ترويسة كحلية ذهبية مميزة) ══════════
const PCSS = `@page{size:A4;margin:8mm 0 10mm}*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{margin:0;font-family:Cairo,Tahoma,sans-serif;color:#0f172a;background:#fff}
.pg{width:210mm;padding:0 11mm;break-before:page}.pg:first-child{break-before:auto}
.hd{position:relative;border-radius:5mm;overflow:hidden;background:linear-gradient(125deg,${NAVY},${NAVY2} 55%,#1e3a8a);color:#fff;padding:4mm 6mm;display:grid;grid-template-columns:auto 1fr auto;gap:5mm;align-items:center}
.hd::before{content:"";position:absolute;width:70mm;height:70mm;border-radius:50%;border:7mm solid rgba(201,162,39,.16);left:-22mm;top:-30mm}
.hd::after{content:"";position:absolute;inset:auto 0 0 0;height:1.5mm;background:linear-gradient(90deg,${GOLD},#f3d77a,${GOLD})}
.hd .lg{width:18mm;height:18mm;border-radius:4mm;background:#fff;display:grid;place-items:center;box-shadow:0 0 0 .7mm ${GOLD};position:relative}.hd .lg img{max-width:15mm;max-height:15mm}
.hd .m{text-align:center;font-size:8.8pt;font-weight:800;line-height:1.65;position:relative}.hd .m b{display:block;font-size:12pt;color:#f3d77a}
.tt{margin:4.5mm 0 3mm;display:flex;align-items:center;gap:4mm}.tt .k{background:${GOLD};color:#fff;font-weight:900;font-size:9pt;padding:1mm 4mm;border-radius:0 3mm 0 3mm}.tt h1{margin:1mm 0 0;font-size:18pt;font-weight:900;color:${NAVY}}.tt small{font-size:8.5pt;font-weight:800;color:#64748b}
.sc{display:grid;grid-template-columns:1.3fr repeat(4,1fr);gap:2.2mm;margin-bottom:3mm}
.sc>div{border-radius:3.5mm;padding:2.2mm 3mm;background:#f8f5e8;border-inline-start:1.4mm solid ${GOLD};font-weight:800;font-size:9pt;color:${NAVY};break-inside:avoid}.sc small{display:block;font-size:7pt;color:${GOLD2};font-weight:900}.sc b{font-size:16pt;display:block;line-height:1.2}
.sc .nm{background:linear-gradient(135deg,${NAVY},#1e3a8a);color:#fff;border:none}.sc .nm small{color:#f3d77a}.sc .nm b{font-size:12.5pt}
.h{display:flex;align-items:center;gap:2mm;font-size:11pt;font-weight:900;color:${NAVY};margin:4mm 0 2mm;break-after:avoid}.h::before{content:"";width:3.2mm;height:3.2mm;background:${GOLD};transform:rotate(45deg)}.h::after{content:"";flex:1;height:.5mm;background:linear-gradient(90deg,${GOLD},transparent)}
.ds{display:flex;flex-wrap:wrap;gap:1.2mm}.ds span{border-radius:1.6mm;padding:.6mm 2mm;font-size:7.6pt;font-weight:800}.ds .u{background:#fee2e2;color:${RED}}.ds .e{background:#dcfce7;color:#15803d}
.mo{margin-bottom:1.5mm}.mo i{font-style:normal;font-size:8pt;font-weight:900;color:${GOLD2};display:block;margin-bottom:.6mm}
.lad{display:grid;grid-template-columns:repeat(6,1fr);gap:1.5mm;margin:1mm 0 2mm}.lad div{border-radius:2.5mm;padding:1.5mm;text-align:center;font-size:7.4pt;font-weight:800;line-height:1.4;border:.35mm solid}.lad b{display:block;font-size:11pt}
.st{position:relative;border:.4mm solid #e2e8f0;border-radius:3.5mm;padding:2.5mm 3.5mm 2.5mm;margin:0 7mm 2.5mm 0;break-inside:avoid;background:#fff}
.st .n{position:absolute;right:-8.5mm;top:2mm;width:6.5mm;height:6.5mm;border-radius:50%;color:#fff;display:grid;place-items:center;font-weight:900;font-size:9pt}
.st h3{margin:0 0 1.4mm;font-size:10.5pt;font-weight:900;display:flex;gap:2mm;align-items:center;flex-wrap:wrap}.st h3 span.p{font-size:7.5pt;border-radius:99px;padding:.3mm 2.5mm}
.kv{display:grid;grid-template-columns:repeat(3,1fr);gap:1.2mm 3mm;font-size:8.4pt;font-weight:700}.kv div small{display:block;font-size:6.8pt;color:#64748b;font-weight:900}
.tx{font-size:8.6pt;font-weight:600;line-height:1.8;margin-top:1.4mm;text-align:justify}.tx b{color:${NAVY}}
.th{display:flex;gap:2mm;flex-wrap:wrap;margin-top:1.6mm}.th img{width:30mm;height:21mm;object-fit:cover;border-radius:2mm;border:.4mm solid ${GOLD}}.th span{font-size:7.5pt;font-weight:800;border:.3mm solid #fecaca;background:#fff5f5;border-radius:1.6mm;padding:.6mm 2mm;align-self:center}
.ph{display:grid;grid-template-columns:1fr 1fr;gap:4mm}.ph figure{margin:0;break-inside:avoid;border-radius:3.5mm;padding:1.4mm;box-shadow:0 0 0 .45mm ${GOLD},0 0 0 1.1mm #fff,0 0 0 1.4mm ${NAVY}}.ph .im{height:60mm;border-radius:2.5mm;overflow:hidden;background:#f1f5f9}.ph img{width:100%;height:100%;object-fit:cover}.ph figcaption{text-align:center;font-size:8pt;font-weight:800;color:${NAVY};padding:1.2mm 1mm 0}
.ap img{width:100%;max-height:245mm;object-fit:contain;border:.3mm solid #e2e8f0;border-radius:2mm}
.bx{border:.4mm dashed #cbd5e1;border-radius:3mm;padding:2.5mm 3.5mm;font-size:9pt;font-weight:700;line-height:1.85;break-inside:avoid}
.sg{display:grid;grid-template-columns:repeat(3,1fr);gap:8mm;margin:7mm 1mm 1mm;text-align:center;font-size:9pt;font-weight:800;break-inside:avoid}.sg i{display:block;height:9mm;border-bottom:.3mm dashed #94a3b8;margin-bottom:1mm}.sg b{display:block;color:${NAVY}}
.ft{margin-top:3mm;display:flex;justify-content:space-between;border-top:.4mm solid ${GOLD};padding-top:1.3mm;font-size:7.5pt;font-weight:700;color:#64748b}
table.lg{width:100%;border-collapse:collapse;font-size:8.3pt}table.lg th{background:${NAVY};color:#fff;padding:1.6mm;font-weight:900}table.lg td{border:.3mm solid #cbd5e1;padding:1.2mm 1.8mm;font-weight:700;text-align:center}table.lg td.r{text-align:right}table.lg tr{break-inside:avoid}`;
const head = api => `<div class="hd"><div class="lg">${api.moeLogo ? `<img src="${api.moeLogo}">` : ""}</div><div class="m">المملكة العربية السعودية • وزارة التعليم<br>${esc(api.region || "")}<b>${esc(api.school || "")}</b>وكالة شؤون الطلاب • التوجيه الطلابي</div><div class="lg">${api.logo ? `<img src="${api.logo}">` : ""}</div></div>`;
const foot = (api, t) => `<div class="ft"><span>${esc(api.school || "")}</span><span>${esc(t)}</span><span>${todayH()}</span></div>`;
const sigs = cfg => `<div class="sg"><div><i></i><b>الموجه الطلابي</b>${esc(cfg.cou || "")}</div><div><i></i><b>وكيل شؤون الطلاب</b>${esc(cfg.dep || "")}</div><div><i></i><b>مدير المدرسة</b>${esc(cfg.mgr || "")}</div></div>`;
const wrapDoc = (title, body) => `<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>${esc(title)}</title><link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;800;900&display=swap" rel="stylesheet"><style>${PCSS}</style></head><body>${body}<script>(async()=>{try{await document.fonts.ready}catch(e){}await Promise.all([...document.images].map(i=>i.complete?1:new Promise(r=>{i.onload=i.onerror=r})));setTimeout(()=>print(),400);})();</script></body></html>`;

async function printFile(api, cfg, s, r, steps, f, t) {
  const files = Object.entries(obj(r.files)).sort((a, b) => (a[1].at || 0) - (b[1].at || 0));
  const src = files.some(([, m]) => m.k === "img") ? obj(await api.maGet(`${N.IMG}/${s.sid}`)) : {};
  const appx = []; if (api.pdfImgs) for (const [id, m] of files.filter(([, m]) => m.k === "pdf")) { try { const d = await api.maGet(`${N.PDF}/${s.sid}/${id}`); if (!d) continue; const pages = await api.pdfImgs(await (await fetch(d)).blob(), { max: 3, w: 1100, q: .8 }); pages.forEach((p, k) => appx.push({ n: m.n, st: m.st, k, src: p })); } catch {} }
  const stName = k => (steps.find(x => x.k === k) || {}).s || "شاهد عام";
  const M = {}; s.abs.slice().sort().forEach(d => { let k; try { k = new Date(d + "T12:00:00").toLocaleDateString("ar-SA-u-ca-islamic-umalqura", { month: "long", year: "numeric" }); } catch { k = d.slice(0, 7); } (M[k] = M[k] || []).push(d); });
  const doneN = steps.filter(st => obj(obj(r.steps)[st.k]).done).length;
  const lad = steps.map((st, i) => { const x = obj(obj(r.steps)[st.k]); const state = x.done ? "done" : s.u >= st.th ? "due" : "wait"; const c = state === "done" ? ["#15803d", "#f0fdf4"] : state === "due" ? [RED, "#fef2f2"] : ["#94a3b8", "#f8fafc"];
    return `<div style="border-color:${c[0]};background:${c[1]};color:${c[0]}"><b>${state === "done" ? "✓" : ar(i + 1)}</b>${esc(st.s)}<br><small>${state === "done" ? (x.d ? hijS(x.d) : "منفّذ") : state === "due" ? "مستحق" : `عند ${ar(st.th)} أيام`}</small></div>`; }).join("");
  const stepsHtml = steps.map((st, i) => { const x = obj(obj(r.steps)[st.k]); if (!x.done) return ""; const F = files.filter(([, m]) => m.st === st.k);
    const kv = [["التاريخ", x.d ? hij(x.d) : "—"], ["المنفّذ", x.by || cfg[st.who] || WHO[st.who]], ...st.f.filter(([, , ty]) => ty !== "txt").map(([fk, fl]) => [fl, x[fk] ? (typeof x[fk] === "number" || /^\d+$/.test(x[fk]) ? ar(x[fk]) : x[fk]) : "—"])];
    return `<div class="st"><span class="n" style="background:${st.c}">${ar(i + 1)}</span><h3>${st.ic} ${esc(st.t)} <span class="p" style="background:#dcfce7;color:#15803d">✓ منفّذ</span></h3>
      <div class="kv">${kv.map(([k, v]) => `<div><small>${esc(k)}</small>${esc(v)}</div>`).join("")}</div>
      ${st.f.filter(([, , ty]) => ty === "txt").map(([fk, fl]) => x[fk] ? `<div class="tx"><b>${esc(fl)}: </b>${esc(x[fk]).replace(/\n/g, "<br>")}</div>` : "").join("")}
      ${x.note ? `<div class="tx"><b>الملاحظات والنتيجة: </b>${esc(x.note).replace(/\n/g, "<br>")}</div>` : ""}
      ${F.length ? `<div class="th">${F.map(([id, m]) => m.k === "img" && src[id] ? `<img src="${src[id]}">` : m.k === "pdf" ? `<span>📄 ${esc(m.n)}</span>` : "").join("")}</div>` : ""}</div>`; }).join("");
  const due = steps.filter(st => !obj(obj(r.steps)[st.k]).done && s.u >= st.th);
  const imgs = files.filter(([id, m]) => m.k === "img" && src[id]);
  let h = `<section class="pg">${head(api)}
  <div class="tt"><div style="flex:1"><span class="k">تقرير متابعة ومعالجة غياب طالب</span><h1>${esc(s.name)}</h1><small>الفترة: ${hij(f)} — ${hij(t)} • الإجراءات المنفّذة ${ar(doneN)} من ${ar(steps.length)}</small></div></div>
  <div class="sc"><div class="nm"><small>الطالب • الفصل</small><b>${esc(s.name)}</b>${esc(s.cls)}${/^\d{10}$/.test(String(s.sid)) ? `<br><small style="color:#cbd5e1">رقم الهوية: ${ar(s.sid)}</small>` : ""}</div>
    <div><small>غياب بدون عذر</small><b style="color:${RED}">${ar(s.u)}</b>يوماً</div><div><small>غياب بعذر</small><b style="color:#15803d">${ar(s.e)}</b>يوماً</div><div><small>إجمالي الغياب</small><b>${ar(s.abs.length)}</b>يوماً</div><div><small>الوضع الحالي</small><b style="font-size:10pt">${esc(r.now || "قيد المتابعة")}</b></div></div>
  <div class="h">سلّم الإجراءات المتدرجة</div><div class="lad">${lad}</div>
  <div class="h">أيام الغياب</div>${Object.entries(M).map(([m, ds]) => `<div class="mo"><i>${esc(m)} (${ar(ds.length)})</i><div class="ds">${ds.map(d => `<span class="${s.ex.includes(d) ? "e" : "u"}">${dayN(d)} ${hijS(d)}${s.ex.includes(d) ? " • بعذر" : ""}</span>`).join("")}</div></div>`).join("")}
  <div class="h">الإجراءات المتخذة</div>${stepsHtml || `<div class="bx">لم يُسجَّل تنفيذ أي إجراء بعد.</div>`}
  ${due.length ? `<div class="bx" style="border-color:#fecaca;background:#fff5f5;color:${RED}"><b>إجراءات مستحقة لم تُنفّذ بعد: </b>${due.map(st => esc(st.s)).join("، ")}</div>` : ""}
  ${r.rec ? `<div class="h">خلاصة الحالة والتوصيات</div><div class="bx">${esc(r.rec).replace(/\n/g, "<br>")}</div>` : ""}
  ${imgs.length ? `<div class="h">الشواهد المصوّرة (${ar(imgs.length)})</div><div class="ph">${imgs.map(([id, m]) => `<figure><div class="im"><img src="${src[id]}"></div><figcaption>${esc(m.cap || m.n || "")} — ${esc(stName(m.st))}</figcaption></figure>`).join("")}</div>` : ""}
  ${files.some(([, m]) => m.k === "pdf") ? `<div class="h">الاستمارات المرفقة</div><div class="th">${files.filter(([, m]) => m.k === "pdf").map(([, m]) => `<span>📄 ${esc(m.n)} — ${esc(stName(m.st))}</span>`).join("")}</div>` : ""}
  ${sigs(cfg)}${foot(api, "تقرير معالجة غياب: " + s.name)}</section>`;
  appx.forEach(a => { h += `<section class="pg">${head(api)}<div class="tt"><span class="k">ملحق الشواهد</span><small>${esc(a.n)} — ${esc(stName(a.st))}${a.k ? ` • صفحة ${ar(a.k + 1)}` : ""} • الطالب: ${esc(s.name)}</small></div><div class="ap"><img src="${a.src}"></div>${foot(api, "ملحق: " + a.n)}</section>`; });
  api.print(wrapDoc(`تقرير معالجة غياب — ${s.name}`, h));
}

function printLog(api, cfg, L, R, steps, f, t) {
  const rows = L.map((s, i) => { const r = obj(R[s.sid]); return `<tr><td>${ar(i + 1)}</td><td class="r">${esc(s.name)}</td><td>${esc(s.cls)}</td><td style="color:${RED};font-weight:900">${ar(s.u)}</td><td>${ar(s.e)}</td><td>${ar(s.abs.length)}</td>${steps.map(st => { const x = obj(obj(r.steps)[st.k]); return `<td style="color:${x.done ? "#15803d" : s.u >= st.th ? RED : "#94a3b8"};font-weight:900">${x.done ? (x.d ? hijS(x.d) : "✓") : s.u >= st.th ? "مستحق" : "—"}</td>`; }).join("")}</tr>`; }).join("");
  const h = `<section class="pg">${head(api)}<div class="tt"><div><span class="k">سجل إجراءات معالجة الغياب</span><h1 style="font-size:15pt">الطلاب متكررو الغياب والإجراءات المتخذة</h1><small>الفترة: ${hij(f)} — ${hij(t)} • عدد الطلاب ${ar(L.length)}</small></div></div>
  <table class="lg"><thead><tr><th>م</th><th>الطالب</th><th>الفصل</th><th>بدون عذر</th><th>بعذر</th><th>الإجمالي</th>${steps.map(st => `<th>${esc(st.s)}</th>`).join("")}</tr></thead><tbody>${rows}</tbody></table>${sigs(cfg)}${foot(api, "سجل إجراءات معالجة الغياب")}</section>`;
  api.print(wrapDoc("سجل إجراءات معالجة الغياب", h));
}
