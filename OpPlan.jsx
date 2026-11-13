// ══════════════════════════════════════════════════════════════════
// 🎯 الخطة التشغيلية — متابعة تنفيذ البرامج (للمدير والوكلاء)
// لكل برنامج: المجال • البرنامج • الهدف • المؤشر • القيمة الحالية • المستهدف • المتحقق • المنفذ • الفترة • الإجراءات • الشواهد • الصور
// لوحة متابعة • استيراد البرامج من جدول (Word/Excel) • عرض وثيقة الخطة من التعاميم • تقرير فاخر للطباعة
// قاعدة البيانات: school-opp/{id} • school-opp-img/{id}/{imgId} • school-opp-cfg
// ══════════════════════════════════════════════════════════════════
import React, { useState, useEffect, useMemo, useRef } from "react";

const N = { P: "school-opp", IMG: "school-opp-img", CFG: "school-opp-cfg" };
const NAVY = "#0b2545", GOLD = "#c9a227", GOLD2 = "#a16207";
const ar = n => String(n ?? "").replace(/\d/g, x => "٠١٢٣٤٥٦٧٨٩"[x]);
const esc = t => String(t ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const obj = v => (v && typeof v === "object" ? v : {});
const arr = v => Array.isArray(v) ? v.filter(Boolean) : (v && typeof v === "object" ? Object.values(v).filter(Boolean) : []);
const num = v => { const s = String(v ?? "").replace(/[٠-٩]/g, d => "٠١٢٣٤٥٦٧٨٩".indexOf(d)).replace(/[٫,]/g, ".").replace(/[^\d.]/g, ""); return s === "" ? null : +s; };
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const hij = k => { if (!k) return ""; try { const [y, m, d] = String(k).split("-").map(Number); return new Date(y, m - 1, d, 12).toLocaleDateString("ar-SA-u-ca-islamic-umalqura-nu-arab", { day: "numeric", month: "long", year: "numeric" }); } catch { return k; } };
const hijS = k => { if (!k) return ""; try { const [y, m, d] = String(k).split("-").map(Number); return new Date(y, m - 1, d, 12).toLocaleDateString("ar-SA-u-ca-islamic-umalqura-nu-arab", { day: "numeric", month: "numeric", year: "numeric" }); } catch { return k; } };
const uid = p => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);

export const OP_ST = {
  done: { t: "مكتمل", c: "#15803d", bg: "#dcfce7", ic: "✅" },
  run: { t: "جارٍ التنفيذ", c: "#1d4ed8", bg: "#dbeafe", ic: "⏳" },
  late: { t: "متأخر", c: "#dc2626", bg: "#fee2e2", ic: "⚠️" },
  wait: { t: "لم يبدأ", c: "#64748b", bg: "#f1f5f9", ic: "⏸" },
  hold: { t: "معلّق", c: "#b45309", bg: "#fef3c7", ic: "✋" },
};
// اتجاه المؤشر: «الأقل أفضل» (الغياب، التأخر…) أو «الأعلى أفضل»
export const opDown = p => p.dir ? p.dir === "down" : /غياب|تأخر|تاخر|تسرب|مخالف|حوادث|رسوب|تعثر|شكاوى|إصابات|اصابات/.test(String(p.ind || "") + String(p.t || ""));
// نسبة الإنجاز: الإجراءات المنفذة، وإن لم توجد فنسبة تحقق المؤشر
export function opCalc(p) {
  const pr = arr(p.proc); const dn = pr.filter(x => x.done).length; const tg = num(p.tg), act = num(p.act), base = num(p.base);
  const down = opDown(p); let ach = null;
  if (tg != null && act != null) {
    if (down) ach = base != null && base > tg ? (base - act) / (base - tg) * 100 : act <= tg ? 100 : act ? tg / act * 100 : 100;
    else if (tg !== 0) ach = base != null && tg > base ? (act - base) / (tg - base) * 100 : act / tg * 100;
    if (ach != null) ach = Math.max(0, Math.min(100, ach)); }
  const procP = pr.length ? dn / pr.length * 100 : null;
  const prog = Math.round(procP != null && ach != null ? (procP + ach) / 2 : procP != null ? procP : ach != null ? ach : 0);
  const t = today(); let st;
  if (p.st === "hold") st = "hold"; else if (prog >= 100) st = "done"; else if (p.to && p.to < t) st = "late"; else if (prog > 0 || (p.from && p.from <= t)) st = "run"; else st = "wait";
  return { prog, ach: ach == null ? null : Math.round(ach), procP: procP == null ? null : Math.round(procP), dn, pn: pr.length, st, nImg: Object.keys(obj(p.imgs)).length };
}

// ضغط الصورة قبل الحفظ
function compress(file, max = 1400, q = 0.72) {
  return new Promise((res, rej) => { const fr = new FileReader(); fr.onerror = rej; fr.onload = () => { const im = new Image(); im.onerror = rej; im.onload = () => { const s = Math.min(1, max / Math.max(im.width, im.height)); const c = document.createElement("canvas"); c.width = Math.round(im.width * s); c.height = Math.round(im.height * s); const g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height); g.drawImage(im, 0, 0, c.width, c.height); res({ src: c.toDataURL("image/jpeg", q), w: c.width, h: c.height }); }; im.src = fr.result; }; fr.readAsDataURL(file); });
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@500;700;800;900&display=swap');
.op{font-family:Cairo,Tahoma,sans-serif;direction:rtl;color:#0f172a}.op *{box-sizing:border-box}
.op-card{background:#fff;border:1px solid #e2e8f0;border-radius:20px;padding:16px;box-shadow:0 10px 28px -22px rgba(11,37,69,.45)}
.op-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:10px 16px;border-radius:12px;border:1px solid #e2e8f0;background:#fff;font-family:inherit;font-weight:800;font-size:14px;color:#334155;cursor:pointer;white-space:nowrap;transition:all .15s}
.op-btn:hover{transform:translateY(-1px);box-shadow:0 8px 16px -10px rgba(15,23,42,.45)}.op-btn:disabled{opacity:.45;cursor:not-allowed;transform:none}
.op-btn.p{background:linear-gradient(135deg,${NAVY},#1e3a8a);color:#fff;border-color:transparent}.op-btn.g{background:linear-gradient(135deg,${GOLD},${GOLD2});color:#fff;border-color:transparent}
.op-btn.ok{background:linear-gradient(135deg,#16a34a,#15803d);color:#fff;border-color:transparent}.op-btn.red{background:#fff5f5;color:#dc2626;border-color:#fecaca}.op-btn.sm{padding:6px 11px;font-size:12.5px;border-radius:10px}
.op-inp{width:100%;min-height:42px;border-radius:12px;border:1.5px solid #e2e8f0;background:#f8fafc;padding:8px 12px;font-family:inherit;font-size:14px;font-weight:700;outline:none;color:#0f172a}
.op-inp:focus{border-color:${GOLD};background:#fff;box-shadow:0 0 0 3px rgba(201,162,39,.18)}
.op-lbl{display:grid;gap:4px;font-size:12.5px;font-weight:800;color:#475569}
.op-tabs{display:flex;gap:6px;flex-wrap:wrap;padding:6px;background:#eef2f7;border-radius:16px}
.op-tab{flex:1;min-width:120px;padding:10px 12px;border-radius:12px;border:none;background:transparent;font-family:inherit;font-weight:900;font-size:13.5px;color:#475569;cursor:pointer}.op-tab.on{background:#fff;color:${NAVY};box-shadow:0 6px 16px -10px rgba(15,23,42,.5)}
.op-hero{background:linear-gradient(135deg,${NAVY},#13315c 60%,#1e3a8a);color:#fff;border-radius:22px;padding:18px;position:relative;overflow:hidden}
.op-hero::after{content:"";position:absolute;inset:auto -50px -70px auto;width:200px;height:200px;border-radius:50%;background:radial-gradient(circle,rgba(201,162,39,.45),transparent 70%)}
.op-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px}.op-kpi{border-radius:16px;padding:10px;text-align:center;background:#f8fafc;border:1.5px solid #e2e8f0}.op-kpi b{display:block;font-size:24px;font-weight:900;color:${NAVY}}.op-kpi small{font-size:12px;font-weight:800;color:#64748b}
.op-lv{display:inline-flex;align-items:center;gap:4px;border-radius:999px;padding:3px 10px;font-weight:900;font-size:12px;white-space:nowrap}
.op-bar{height:10px;border-radius:9px;background:#eef2f7;overflow:hidden}.op-bar i{display:block;height:100%;border-radius:9px;background:linear-gradient(90deg,${GOLD},#16a34a)}
.op-chip{padding:6px 12px;border-radius:999px;border:1.5px solid #e2e8f0;background:#fff;font-family:inherit;font-weight:800;font-size:12.5px;cursor:pointer;color:#475569}.op-chip.on{background:${NAVY};border-color:${NAVY};color:#fff}
.op-prog{border-radius:18px;border:1px solid #e2e8f0;background:#fff;padding:14px;display:grid;gap:8px;cursor:pointer;text-align:right;font-family:inherit;transition:all .15s;box-shadow:0 10px 24px -22px rgba(11,37,69,.6)}
.op-prog:hover{transform:translateY(-2px);border-color:${GOLD}}
.op-modal{position:fixed;inset:0;background:rgba(2,6,23,.6);display:flex;align-items:flex-start;justify-content:center;z-index:900;padding:16px 8px;overflow:auto}.op-modal>div{background:#f8fafc;border-radius:22px;width:100%;max-width:1040px;padding:16px;display:grid;gap:12px}
.op-sec{background:#fff;border:1px solid #e2e8f0;border-radius:18px;padding:14px;display:grid;gap:10px}.op-sec>b{color:${NAVY};font-size:15px}
.op-proc{display:grid;grid-template-columns:28px 1fr 150px 34px;gap:8px;align-items:center}
.op-imgs{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:10px}.op-img{border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;background:#f8fafc;display:grid}.op-img img{width:100%;height:130px;object-fit:cover;display:block;background:#e2e8f0}
.op-tbl{width:100%;border-collapse:collapse;font-size:13px}.op-tbl th{background:${NAVY};color:#fff;padding:8px 6px;font-weight:800;white-space:nowrap}.op-tbl td{padding:7px 6px;border-bottom:1px solid #eef2f7;text-align:center}.op-tbl tr:hover td{background:#fffbeb}
.op-note{font-size:12.5px;font-weight:700;color:#64748b;line-height:1.9}
`;
const Ring = ({ v, size = 64, c = NAVY }) => { const p = Math.max(0, Math.min(100, +v || 0)); return <div style={{ width: size, height: size, borderRadius: "50%", background: `conic-gradient(${c} ${p * 3.6}deg,#e8edf3 0)`, display: "grid", placeItems: "center", flex: "none" }}><div style={{ width: size - 12, height: size - 12, borderRadius: "50%", background: "#fff", display: "grid", placeItems: "center", fontWeight: 900, fontSize: size / 4.4, color: c }}>{ar(p)}٪</div></div>; };
const StB = ({ k }) => { const S = OP_ST[k] || OP_ST.wait; return <span className="op-lv" style={{ background: S.bg, color: S.c }}>{S.ic} {S.t}</span>; };
const useToast = () => { const [m, setM] = useState(""); const t = useRef(); return [m, s => { setM(s); clearTimeout(t.current); t.current = setTimeout(() => setM(""), 2600); }]; };

// ══════════ محرر البرنامج ══════════
function Editor({ api, init, people, doms, by, onClose, onSaved, onDel, onPrint, onPro }) {
  const [p, setP] = useState(() => ({ dom: "", t: "", goal: "", ind: "", base: "", tg: "", act: "", unit: "%", ex: "", par: "", from: "", to: "", proc: [], ev: [], note: "", st: "", imgs: {}, ...JSON.parse(JSON.stringify(init)) }));
  const [srcs, setSrcs] = useState({}); const [busy, setBusy] = useState(""); const [nproc, setNproc] = useState(""); const [nev, setNev] = useState({ t: "", u: "" }); const fileR = useRef();
  const isNew = !init.id; const id = useRef(init.id || uid("p")).current;
  useEffect(() => { if (!isNew && Object.keys(obj(init.imgs)).length) api.maGet(`${N.IMG}/${id}`).then(v => setSrcs(obj(v))); }, []);
  const set = (k, v) => setP(x => ({ ...x, [k]: v })); const C = opCalc(p);
  const addImgs = async files => { setBusy("img"); const add = {}; const meta = {};
    for (const f of [...files].slice(0, 12)) { if (!/^image\//.test(f.type)) continue; try { const r = await compress(f); const iid = uid("i"); add[iid] = r.src; meta[iid] = { cap: "", at: Date.now(), w: r.w, h: r.h, ord: Date.now() }; } catch {} }
    for (const [iid, src] of Object.entries(add)) await api.maPut(`${N.IMG}/${id}/${iid}`, src);
    setSrcs(s => ({ ...s, ...add })); setP(x => ({ ...x, imgs: { ...obj(x.imgs), ...meta } })); setBusy("");
    if (!isNew) await api.maPut(`${N.P}/${id}/imgs`, { ...obj(p.imgs), ...meta }); };
  const delImg = async iid => { if (!confirm("حذف الصورة؟")) return; await api.maPut(`${N.IMG}/${id}/${iid}`, null); setSrcs(s => { const o = { ...s }; delete o[iid]; return o; }); setP(x => { const im = { ...obj(x.imgs) }; delete im[iid]; return { ...x, imgs: im }; }); };
  const save = async () => { if (!p.t.trim()) { alert("اكتب اسم البرنامج"); return; } setBusy("save"); const v = { ...p, meth: arr(p.meth).map(x => x.trim()).filter(Boolean), evalp: arr(p.evalp).map(x => x.trim()).filter(Boolean), req: arr(p.req).map(x => x.trim()).filter(Boolean), id, t: p.t.trim(), by: p.by || by, at: p.at || Date.now(), up: Date.now(), upBy: by, ord: p.ord || Date.now() };
    await api.maPut(`${N.P}/${id}`, v); setBusy(""); onSaved(v); };
  const imgs = Object.entries(obj(p.imgs)).sort((a, b) => (a[1].ord || 0) - (b[1].ord || 0));
  return <div className="op-modal" onClick={e => e.target === e.currentTarget && onClose()}><div className="op">
    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}><Ring v={C.prog} size={58} c={OP_ST[C.st].c} /><div style={{ flex: 1, minWidth: 200 }}><b style={{ fontSize: 18, color: NAVY }}>{isNew ? "➕ برنامج جديد" : p.t || "برنامج"}</b><div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}><StB k={C.st} />{C.pn > 0 && <span className="op-note">الإجراءات {ar(C.dn)}/{ar(C.pn)}</span>}{C.ach != null && <span className="op-note">• تحقق المؤشر {ar(C.ach)}٪</span>}</div></div>
      {!isNew && <button className="op-btn sm p" onClick={() => onPro({ ...p, id })}>📘 تقرير البرنامج الاحترافي</button>}{!isNew && <button className="op-btn sm g" onClick={() => onPrint({ ...p, id })}>🖨️ ورقة صفحة واحدة</button>}<button className="op-btn sm" onClick={onClose}>✕</button></div>

    <div className="op-sec"><b>📋 بيانات البرنامج</b>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 10 }}>
        <label className="op-lbl">المجال<input className="op-inp" list="op-doms" value={p.dom} onChange={e => set("dom", e.target.value)} placeholder="مثال: التعليم والتعلم" /><datalist id="op-doms">{doms.map(d => <option key={d} value={d} />)}</datalist></label>
        <label className="op-lbl" style={{ gridColumn: "span 2" }}>البرنامج / المبادرة<input className="op-inp" value={p.t} onChange={e => set("t", e.target.value)} placeholder="اسم البرنامج" /></label>
      </div>
      <label className="op-lbl">الهدف<textarea className="op-inp" rows={2} value={p.goal} onChange={e => set("goal", e.target.value)} /></label>
      <label className="op-lbl">مؤشر الإنجاز<textarea className="op-inp" rows={2} value={p.ind} onChange={e => set("ind", e.target.value)} placeholder="مثال: نسبة الطلاب المتقنين لمهارات القراءة" /></label>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 10 }}>
        <label className="op-lbl">القيمة الحالية (خط الأساس)<input className="op-inp" value={p.base} onChange={e => set("base", e.target.value)} /></label>
        <label className="op-lbl">المستهدف<input className="op-inp" value={p.tg} onChange={e => set("tg", e.target.value)} /></label>
        <label className="op-lbl">المتحقق فعلياً<input className="op-inp" value={p.act} onChange={e => set("act", e.target.value)} style={{ borderColor: p.act ? "#86efac" : undefined }} /></label>
        <label className="op-lbl">اتجاه المؤشر<select className="op-inp" value={p.dir || (opDown(p) ? "down" : "up")} onChange={e => set("dir", e.target.value)}><option value="up">⬆ الأعلى أفضل</option><option value="down">⬇ الأقل أفضل (كالغياب)</option></select></label>
        <label className="op-lbl">الوحدة<select className="op-inp" value={p.unit} onChange={e => set("unit", e.target.value)}><option value="%">نسبة ٪</option><option value="عدد">عدد</option><option value="">أخرى</option></select></label>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 10 }}>
        <label className="op-lbl">المنفّذ (مسؤول التنفيذ)<input className="op-inp" list="op-ppl" value={p.ex} onChange={e => set("ex", e.target.value)} placeholder="اختر أو اكتب" /><datalist id="op-ppl">{people.map(n => <option key={n} value={n} />)}</datalist></label>
        <label className="op-lbl">المساندون / المشاركون<input className="op-inp" value={p.par} onChange={e => set("par", e.target.value)} placeholder="مثال: معلمو اللغة العربية، الموجه الطلابي" /></label>
        <label className="op-lbl">من تاريخ<input className="op-inp" type="date" value={p.from} onChange={e => set("from", e.target.value)} /></label>
        <label className="op-lbl">إلى تاريخ<input className="op-inp" type="date" value={p.to} onChange={e => set("to", e.target.value)} /></label>
      </div>
      <label className="op-lbl" style={{ display: "flex", alignItems: "center", gap: 6 }}><input type="checkbox" checked={p.st === "hold"} onChange={e => set("st", e.target.checked ? "hold" : "")} /> البرنامج معلّق مؤقتاً</label>
    </div>

    <details className="op-sec" open><summary style={{ cursor: "pointer", fontWeight: 900, color: NAVY, fontSize: 15 }}>📑 ارتباط البرنامج بالخطة (الهدف العام والتفصيلي والمتابعة)</summary>
      <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
        <label className="op-lbl">الهدف الاستراتيجي<input className="op-inp" value={p.strat || ""} onChange={e => set("strat", e.target.value)} /></label>
        <label className="op-lbl">الهدف العام {p.gn ? `(${p.gn})` : ""}<textarea className="op-inp" rows={2} value={p.gen || ""} onChange={e => set("gen", e.target.value)} /></label>
        <label className="op-lbl">مؤشر قياس أداء الهدف العام<textarea className="op-inp" rows={2} value={p.gind || ""} onChange={e => set("gind", e.target.value)} /></label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 10 }}>
          <label className="op-lbl">خط الأساس للهدف العام<input className="op-inp" value={p.gbase || ""} onChange={e => set("gbase", e.target.value)} /></label>
          <label className="op-lbl">مستهدف الهدف العام<input className="op-inp" value={p.gtg || ""} onChange={e => set("gtg", e.target.value)} /></label>
        </div>
        <label className="op-lbl">الهدف التفصيلي {p.on ? `(${p.on})` : ""}<textarea className="op-inp" rows={2} value={p.obj || ""} onChange={e => set("obj", e.target.value)} /></label>
        <label className="op-lbl">الأثر المتوقع<textarea className="op-inp" rows={2} value={p.gimp || ""} onChange={e => set("gimp", e.target.value)} placeholder="ما الذي سيتحسن بعد تنفيذ البرنامج؟" /></label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 10 }}>
          <label className="op-lbl">المستفيدون<input className="op-inp" value={p.ben || ""} onChange={e => set("ben", e.target.value)} /></label>
          <label className="op-lbl">مكان التنفيذ<input className="op-inp" value={p.place || ""} onChange={e => set("place", e.target.value)} /></label>
          <label className="op-lbl">مسؤول المتابعة<input className="op-inp" list="op-ppl" value={p.fol || ""} onChange={e => set("fol", e.target.value)} /></label>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 10 }}>
          <label className="op-lbl">أساليب التنفيذ (كل أسلوب في سطر)<textarea className="op-inp" rows={6} value={arr(p.meth).join("\n")} onChange={e => set("meth", e.target.value.split("\n"))} /></label>
          <label className="op-lbl">إجراءات التقويم (كل إجراء في سطر)<textarea className="op-inp" rows={6} value={arr(p.evalp).join("\n")} onChange={e => set("evalp", e.target.value.split("\n"))} /></label>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 10 }}>
          <label className="op-lbl">متطلبات التنفيذ والموارد (كل متطلب في سطر)<textarea className="op-inp" rows={4} value={arr(p.req).join("\n")} onChange={e => set("req", e.target.value.split("\n"))} placeholder={"مثال:\nقاعة مجهزة بجهاز عرض\nمطبوعات وشهادات تكريم\nتنسيق مع أولياء الأمور"} /></label>
          <label className="op-lbl">التكلفة التقديرية (اختياري)<input className="op-inp" value={p.cost || ""} onChange={e => set("cost", e.target.value)} placeholder="مثال: ٥٠٠ ريال / بدون تكلفة" /></label>
        </div>
      </div></details>

    <div className="op-sec"><b>🛠️ الإجراءات التنفيذية <span className="op-note">— أشّر على المنفَّذ منها</span></b>
      {arr(p.proc).map((x, i) => <div key={i} className="op-proc"><input type="checkbox" style={{ width: 20, height: 20 }} checked={!!x.done} onChange={e => set("proc", p.proc.map((y, k) => k === i ? { ...y, done: e.target.checked ? 1 : 0, d: e.target.checked ? (y.d || today()) : "" } : y))} />
        <input className="op-inp" style={{ textDecoration: x.done ? "line-through" : "none", color: x.done ? "#15803d" : undefined }} value={x.t} onChange={e => set("proc", p.proc.map((y, k) => k === i ? { ...y, t: e.target.value } : y))} />
        <input className="op-inp" type="date" title="تاريخ التنفيذ" value={x.d || ""} onChange={e => set("proc", p.proc.map((y, k) => k === i ? { ...y, d: e.target.value } : y))} />
        <button className="op-btn sm red" onClick={() => set("proc", p.proc.filter((_, k) => k !== i))}>✕</button></div>)}
      <div style={{ display: "flex", gap: 6 }}><input className="op-inp" value={nproc} onChange={e => setNproc(e.target.value)} placeholder="إجراء جديد… ثم Enter" onKeyDown={e => { if (e.key === "Enter" && nproc.trim()) { set("proc", [...arr(p.proc), { t: nproc.trim(), done: 0 }]); setNproc(""); } }} /><button className="op-btn sm p" onClick={() => { if (nproc.trim()) { set("proc", [...arr(p.proc), { t: nproc.trim(), done: 0 }]); setNproc(""); } }}>إضافة</button></div>
    </div>

    <div className="op-sec"><b>📎 الشواهد</b>
      {arr(p.ev).map((x, i) => <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 34px", gap: 8 }}><input className="op-inp" value={x.t} onChange={e => set("ev", p.ev.map((y, k) => k === i ? { ...y, t: e.target.value } : y))} placeholder="وصف الشاهد" /><input className="op-inp" dir="ltr" value={x.u || ""} onChange={e => set("ev", p.ev.map((y, k) => k === i ? { ...y, u: e.target.value } : y))} placeholder="رابط (اختياري)" /><button className="op-btn sm red" onClick={() => set("ev", p.ev.filter((_, k) => k !== i))}>✕</button></div>)}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 8 }}><input className="op-inp" value={nev.t} onChange={e => setNev({ ...nev, t: e.target.value })} placeholder="مثال: كشف حضور الطلاب، محضر اجتماع" /><input className="op-inp" dir="ltr" value={nev.u} onChange={e => setNev({ ...nev, u: e.target.value })} placeholder="https:// (اختياري)" /><button className="op-btn sm p" onClick={() => { if (nev.t.trim()) { set("ev", [...arr(p.ev), { t: nev.t.trim(), u: nev.u.trim() }]); setNev({ t: "", u: "" }); } }}>إضافة</button></div>
    </div>

    <div className="op-sec"><div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}><b style={{ flex: 1, color: NAVY, fontSize: 15 }}>📸 صور التنفيذ ({ar(imgs.length)})</b><button className="op-btn sm g" disabled={busy === "img"} onClick={() => fileR.current.click()}>{busy === "img" ? "⏳ جارٍ الرفع والضغط…" : "➕ إضافة صور"}</button><input ref={fileR} type="file" accept="image/*" multiple hidden onChange={e => { addImgs(e.target.files); e.target.value = ""; }} /></div>
      {!imgs.length ? <div className="op-note">أضف صوراً من التنفيذ (تُضغط تلقائياً). تظهر في التقرير مع وصفها.</div> :
        <div className="op-imgs">{imgs.map(([iid, m]) => <div key={iid} className="op-img">{srcs[iid] ? <img src={srcs[iid]} alt="" /> : <div style={{ height: 130, display: "grid", placeItems: "center", color: "#94a3b8" }}>⏳</div>}
          <div style={{ padding: 6, display: "flex", gap: 4 }}><input className="op-inp" style={{ minHeight: 32, fontSize: 12 }} placeholder="وصف الصورة" value={m.cap || ""} onChange={e => setP(x => ({ ...x, imgs: { ...obj(x.imgs), [iid]: { ...m, cap: e.target.value } } }))} /><button className="op-btn sm" title="إظهار الصورة في ورقة تقرير البرنامج" style={{ padding: "4px 8px", background: m.main ? GOLD : "#fff", color: m.main ? "#fff" : "#94a3b8" }} onClick={() => { const n = Object.values(obj(p.imgs)).filter(x => x.main).length; if (!m.main && n >= 4) { alert("الحد الأعلى ٤ صور في ورقة التقرير — الصور الأخرى تظهر في الملحق"); return; } setP(x => ({ ...x, imgs: { ...obj(x.imgs), [iid]: { ...m, main: m.main ? 0 : 1 } } })); }}>⭐</button><button className="op-btn sm red" style={{ padding: "4px 8px" }} onClick={() => delImg(iid)}>🗑</button></div></div>)}</div>}
      {imgs.length > 0 && <div className="op-note">⭐ اختر من صورتين إلى ٤ صور تظهر في ورقة «تقرير تنفيذ البرنامج» (إن لم تختر تُؤخذ أول ٤). بقية الصور تُطبع في ملحق.</div>}
    </div>

    <div className="op-sec"><b>📝 ملاحظات / معوقات</b><textarea className="op-inp" rows={2} value={p.note} onChange={e => set("note", e.target.value)} /></div>
    <div style={{ display: "flex", gap: 8, justifyContent: "space-between", flexWrap: "wrap" }}>{!isNew ? <button className="op-btn red" onClick={() => onDel({ ...p, id })}>🗑 حذف البرنامج</button> : <span />}<div style={{ display: "flex", gap: 8 }}><button className="op-btn" onClick={onClose}>إلغاء</button><button className="op-btn p" disabled={busy === "save" || busy === "img"} onClick={save}>{busy === "save" ? "⏳" : "💾 حفظ"}</button></div></div>
  </div></div>;
}

// ══════════ الاستيراد من جدول ══════════
const COLS = [["dom", /مجال|محور/], ["t", /برنامج|مبادر|مشروع|نشاط/], ["goal", /هدف|أهداف|اهداف/], ["ind", /مؤشر/], ["base", /حالي|أساس|اساس|خط/], ["tg", /مستهدف|المستهدف|قيمة مستهدفة/], ["ex", /منفذ|مسؤول|مسئول|المنفذ/], ["par", /مشارك/], ["proc", /إجراء|اجراء|آلية|الية|خطوات/], ["ev", /شاهد|شواهد|أدلة|ادلة|توثيق/], ["time", /زمن|توقيت|فترة|مدة|تاريخ/]];
function parseRows(rows) {
  rows = rows.map(r => r.map(c => String(c ?? "").trim())).filter(r => r.some(Boolean)); if (rows.length < 2) return { map: {}, data: [] };
  let hi = 0, best = 0; rows.slice(0, 6).forEach((r, i) => { const s = r.filter(c => COLS.some(([, re]) => re.test(c))).length; if (s > best) { best = s; hi = i; } });
  const H = rows[hi]; const map = {}; H.forEach((h, j) => { const m = COLS.find(([k, re]) => re.test(h) && map[k] == null); if (m) map[m[0]] = j; });
  if (map.t == null) map.t = H.findIndex((_, j) => !Object.values(map).includes(j));
  const data = rows.slice(hi + 1).map(r => { const g = k => map[k] != null ? r[map[k]] || "" : ""; const split = s => s.split(/\n|•|؛|\s-\s|^\d+[.-]\s*/m).map(x => x.replace(/^[\d.\-•\s]+/, "").trim()).filter(x => x.length > 2);
    return { dom: g("dom"), t: g("t"), goal: g("goal"), ind: g("ind"), base: g("base"), tg: g("tg"), ex: g("ex"), par: g("par"), proc: split(g("proc")).map(t => ({ t, done: 0 })), ev: split(g("ev")).map(t => ({ t, u: "" })), note: g("time") ? `الزمن: ${g("time")}` : "" }; }).filter(x => x.t);
  let lastDom = ""; data.forEach(x => { if (x.dom) lastDom = x.dom; else x.dom = lastDom; });
  return { map, data, H };
}
function Importer({ api, onClose, onDone }) {
  const [txt, setTxt] = useState(""); const [res, setRes] = useState(null); const [busy, setBusy] = useState(false);
  const fromText = t => { const rows = t.split(/\r?\n(?=(?:[^"]*"[^"]*")*[^"]*$)/).map(l => l.split("\t").map(c => c.replace(/^"|"$/g, "").replace(/""/g, '"'))); setRes(parseRows(rows)); };
  const fromXlsx = async f => { setBusy(true); try { const X = await api.xlsx(); const wb = X.read(await f.arrayBuffer(), { type: "array" }); const ws = wb.Sheets[wb.SheetNames[0]]; setRes(parseRows(X.utils.sheet_to_json(ws, { header: 1, defval: "" }))); } catch (e) { alert("تعذّر قراءة الملف: " + (e.message || e)); } setBusy(false); };
  const go = async () => { setBusy(true); const P = {}; const t0 = Date.now(); res.data.forEach((x, i) => { const id = uid("p"); P[`${N.P}/${id}`] = { ...x, id, unit: /٪|%|نسبة/.test(x.tg + x.ind) ? "%" : "", act: "", from: "", to: "", imgs: {}, st: "", by: api.by, at: t0 + i, up: t0 + i, ord: t0 + i }; }); await api.fbPatch(P); setBusy(false); onDone(res.data.length); };
  const lbl = { dom: "المجال", t: "البرنامج", goal: "الهدف", ind: "المؤشر", base: "القيمة الحالية", tg: "المستهدف", ex: "المنفذ", par: "المشاركون", proc: "الإجراءات", ev: "الشواهد", time: "الزمن" };
  return <div className="op-modal" onClick={e => e.target === e.currentTarget && onClose()}><div className="op">
    <div style={{ display: "flex", alignItems: "center" }}><b style={{ fontSize: 18, color: NAVY, flex: 1 }}>📥 استيراد برامج الخطة</b><button className="op-btn sm" onClick={onClose}>✕</button></div>
    <div className="op-sec"><b>الطريقة ١: انسخ جدول الخطة من Word أو Excel والصقه هنا</b><div className="op-note">حدّد الجدول كاملاً مع صف العناوين (البرنامج، الهدف، المؤشر، المستهدف، المنفذ، الإجراءات، الشواهد…) ثم انسخ والصق.</div>
      <textarea className="op-inp" rows={6} value={txt} onChange={e => setTxt(e.target.value)} onPaste={e => { const t = e.clipboardData.getData("text"); setTimeout(() => fromText(t), 0); }} placeholder="الصق الجدول هنا…" /><button className="op-btn sm" style={{ justifySelf: "start" }} onClick={() => fromText(txt)} disabled={!txt.trim()}>تحليل الجدول</button></div>
    <div className="op-sec"><b>الطريقة ٢: رفع ملف Excel</b><label className="op-btn" style={{ justifySelf: "start" }}>{busy ? "⏳" : "📁 اختر ملف Excel"}<input type="file" accept=".xlsx,.xls,.csv" hidden onChange={e => e.target.files[0] && fromXlsx(e.target.files[0])} /></label></div>
    {res && <div className="op-sec"><b>المعاينة: {ar(res.data.length)} برنامج</b>
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>{Object.keys(lbl).map(k => <span key={k} className="op-lv" style={{ background: res.map[k] != null ? "#dcfce7" : "#f1f5f9", color: res.map[k] != null ? "#15803d" : "#94a3b8" }}>{res.map[k] != null ? "✔" : "—"} {lbl[k]}{res.map[k] != null && res.H ? ` ← «${res.H[res.map[k]]}»` : ""}</span>)}</div>
      <div style={{ overflowX: "auto", maxHeight: 300 }}><table className="op-tbl"><thead><tr><th>المجال</th><th>البرنامج</th><th>المؤشر</th><th>المستهدف</th><th>المنفذ</th><th>إجراءات</th></tr></thead><tbody>{res.data.slice(0, 50).map((x, i) => <tr key={i}><td>{x.dom}</td><td style={{ textAlign: "right", fontWeight: 800 }}>{x.t}</td><td style={{ fontSize: 12 }}>{x.ind}</td><td>{x.tg}</td><td>{x.ex}</td><td>{ar(x.proc.length)}</td></tr>)}</tbody></table></div>
      <button className="op-btn ok" disabled={busy || !res.data.length} onClick={go}>{busy ? "⏳" : `✔️ استيراد ${ar(res.data.length)} برنامج`}</button></div>}
  </div></div>;
}

// ══════════ التقرير الفاخر ══════════
const RCSS = `@page{size:A4;margin:0}html,body{margin:0!important;padding:0!important;background:#fff!important}
body{font-family:Cairo,Tahoma,sans-serif;color:#0f172a;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.rp{width:210mm;min-height:297mm;padding:12mm 13mm 16mm;position:relative;page-break-after:always;break-after:page;overflow:hidden;box-sizing:border-box}
.rp:last-child{page-break-after:auto}
.rp::before{content:"";position:absolute;inset:6mm;border:1.6pt solid ${NAVY};border-radius:4mm;pointer-events:none}
.rp::after{content:"";position:absolute;inset:7.6mm;border:.6pt solid ${GOLD};border-radius:3mm;pointer-events:none}
.hd{display:flex;align-items:center;justify-content:space-between;gap:8px;border-bottom:2pt solid ${GOLD};padding-bottom:4px;margin-bottom:6px;position:relative;z-index:1}
.hd img{height:14mm;width:auto}.hd .m{text-align:center;font-size:9.5pt;font-weight:700;line-height:1.45;color:${NAVY}}.hd .m b{font-size:12pt;font-weight:900}
.ft{position:absolute;bottom:9mm;left:13mm;right:13mm;display:flex;justify-content:space-between;font-size:8pt;color:#64748b;font-weight:700;z-index:1}
.cv{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;min-height:250mm;gap:8mm;position:relative;z-index:1}
.cv .logos{display:flex;gap:16mm;align-items:center}.cv .logos img{height:30mm}
.cv h1{font-size:30pt;font-weight:900;color:${NAVY};margin:0;line-height:1.4}.cv h2{font-size:15pt;color:${GOLD2};margin:0;font-weight:800}
.cv .band{background:linear-gradient(135deg,${NAVY},#1e3a8a);color:#fff;border-radius:6mm;padding:7mm 14mm;min-width:120mm;box-shadow:0 0 0 1.5mm ${GOLD}}
.cv .band b{display:block;font-size:34pt;font-weight:900;color:#fde68a}.cv .meta{font-size:12pt;font-weight:800;color:#334155;line-height:2}
.sec{background:linear-gradient(90deg,${NAVY},#1e3a8a);color:#fff;border-radius:3mm;padding:1.5mm 4mm;font-size:11pt;font-weight:900;margin:2.4mm 0 1.6mm;display:flex;justify-content:space-between;align-items:center;position:relative;z-index:1}
.sec small{color:#fde68a;font-size:10pt}
.kp{display:grid;grid-template-columns:repeat(5,1fr);gap:2.5mm;position:relative;z-index:1}.kp div{border:1pt solid #e2e8f0;border-top:3pt solid ${GOLD};border-radius:3mm;padding:2.5mm;text-align:center;font-size:8.5pt;font-weight:800;color:#475569;background:#fff}.kp b{display:block;font-size:17pt;color:${NAVY};font-weight:900}
table{width:100%;border-collapse:collapse;font-size:9pt;position:relative;z-index:1;background:#fff}th{background:${NAVY};color:#fff;padding:2mm 1.5mm;font-weight:800}td{border:.6pt solid #cbd5e1;padding:1.3mm 2mm;vertical-align:top}
.kv td:first-child{background:#f8f5e9;color:${NAVY};font-weight:900;width:32mm;white-space:nowrap}.kv td{font-size:8.3pt;line-height:1.5;padding:.9mm 2mm}
.bar{height:3.2mm;border-radius:2mm;background:#e5e7eb;overflow:hidden}.bar i{display:block;height:100%;background:linear-gradient(90deg,${GOLD},#16a34a)}
.st{display:inline-block;border-radius:9px;padding:.5mm 2.5mm;font-weight:900;font-size:8pt}
.pt{display:flex;align-items:center;gap:4mm;position:relative;z-index:1;margin-bottom:2mm}.pt .ring{width:18mm;height:18mm;border-radius:50%;display:grid;place-items:center;flex:none}.pt .ring span{width:14mm;height:14mm;border-radius:50%;background:#fff;display:grid;place-items:center;font-weight:900;font-size:10pt}
.pt h3{margin:0;font-size:14pt;color:${NAVY};font-weight:900;line-height:1.4}.pt .dm{font-size:9.5pt;color:${GOLD2};font-weight:800}
.pr{list-style:none;margin:0;padding:0;display:grid;gap:.9mm;position:relative;z-index:1}.pr li{display:flex;gap:2mm;font-size:8.6pt;font-weight:700;align-items:flex-start}.pr .bx{width:4mm;height:4mm;border:1pt solid ${NAVY};border-radius:1mm;flex:none;display:grid;place-items:center;font-size:8pt;margin-top:.8mm}
.ph{display:grid;gap:3mm;position:relative;z-index:1}.ph.g2{grid-template-columns:1fr 1fr}.ph.g3{grid-template-columns:1fr 1fr 1fr}
.ph figure{margin:0;border:1pt solid #e2e8f0;border-radius:3mm;overflow:hidden;background:#fff;box-shadow:0 0 0 .6pt ${GOLD}}.ph img{width:100%;height:44mm;object-fit:cover;display:block}.ph.g3 img{height:40mm}.ph.g1 img{height:80mm;object-fit:contain;background:#f8fafc}.ph.big img{height:62mm}
.ph figcaption{font-size:8.5pt;font-weight:800;color:#334155;padding:1.4mm 2mm;text-align:center;background:#fffdf5}
.two{display:grid;grid-template-columns:1fr 1fr;gap:4mm;position:relative;z-index:1}.pr.sm li{font-size:8pt}.pr.sm{gap:.8mm}
.sg{display:grid;grid-template-columns:repeat(3,1fr);gap:6mm;margin-top:3mm;text-align:center;font-size:9.5pt;font-weight:800;position:relative;z-index:1}.sg div{border-top:1pt dashed #94a3b8;padding-top:2mm}.sg b{display:block;color:${NAVY};margin-bottom:4mm}
.dbar{display:grid;grid-template-columns:62mm 1fr 14mm;gap:3mm;align-items:center;font-size:9.5pt;font-weight:800;margin:1.6mm 0;position:relative;z-index:1}`;
const stHtml = k => { const S = OP_ST[k]; return `<span class="st" style="background:${S.bg};color:${S.c}">${S.ic} ${S.t}</span>`; };
const ringHtml = (v, c) => `<div class="ring" style="background:conic-gradient(${c} ${v * 3.6}deg,#e5e7eb 0)"><span style="color:${c}">${ar(v)}٪</span></div>`;
async function printReport(api, list, cfg, by, { imgs = true, cover = true, scope = "" } = {}) {
  const L = list.map(p => ({ p, C: opCalc(p) }));
  const srcs = {}; if (imgs) await Promise.all(L.filter(x => x.C.nImg).map(async x => { srcs[x.p.id] = obj(await api.maGet(`${N.IMG}/${x.p.id}`)); }));
  const hd = `<div class="hd"><img src="${api.moe}"><div class="m">المملكة العربية السعودية<br>وزارة التعليم<br>${esc(api.region || "الإدارة العامة للتعليم بمحافظة جدة")}<br><b>${esc(api.school)}</b></div><img src="${api.logo}"></div>`;
  const ft = n => `<div class="ft"><span>تقرير متابعة تنفيذ الخطة التشغيلية ${esc(cfg.year || "")}</span><span>${n}</span></div>`;
  const avg = L.length ? Math.round(L.reduce((a, x) => a + x.C.prog, 0) / L.length) : 0; const cnt = k => L.filter(x => x.C.st === k).length;
  const doms = [...new Set(L.map(x => x.p.dom || "عام"))];
  let pg = 0; const P = [];
  const sumTbl = (X, off) => `<div class="sec">📋 جدول متابعة البرامج${off ? "<small>تابع</small>" : ""}</div><table><thead><tr><th>م</th><th>البرنامج</th><th>مسؤول التنفيذ</th><th>ينتهي في</th><th>الإجراءات</th><th>المتحقق</th><th>الإنجاز</th><th>الحالة</th></tr></thead><tbody>
    ${X.map((x, i) => `<tr><td style="text-align:center">${ar(off + i + 1)}</td><td><b>${esc(x.p.t)}</b><div style="font-size:7.5pt;color:${GOLD2}">${esc(x.p.dom || "")}</div></td><td style="font-size:8.5pt">${esc(x.p.ex || "—")}</td><td style="text-align:center;font-size:8pt;white-space:nowrap">${x.p.to ? hijS(x.p.to) : "—"}</td><td style="text-align:center">${x.C.pn ? `${ar(x.C.dn)}/${ar(x.C.pn)}` : "—"}</td><td style="text-align:center;font-weight:900">${esc(x.p.act || "—")}${x.p.act && x.p.unit === "%" && !/[٪%]/.test(x.p.act) ? "٪" : ""}</td><td style="min-width:22mm"><div class="bar"><i style="width:${x.C.prog}%"></i></div><div style="text-align:center;font-size:8pt;font-weight:900">${ar(x.C.prog)}٪</div></td><td style="text-align:center;white-space:nowrap">${stHtml(x.C.st)}</td></tr>`).join("")}</tbody></table>`;
  if (cover) P.push(`<section class="rp"><div class="cv"><div class="logos"><img src="${api.moe}"><img src="${api.logo}"></div><div class="meta">${esc(api.region || "الإدارة العامة للتعليم بمحافظة جدة")}<br><b style="font-size:15pt;color:${NAVY}">${esc(api.school)}</b></div>
    <h1>${esc(cfg.title || "تقرير متابعة تنفيذ الخطة التشغيلية")}</h1><h2>${esc(scope || "جميع البرامج")} • العام الدراسي ${esc(cfg.year || "")}</h2>
    <div class="band">نسبة الإنجاز العامة<b>${ar(avg)}٪</b>${ar(L.length)} برنامجاً • ${ar(cnt("done"))} مكتمل • ${ar(cnt("run"))} جارٍ • ${ar(cnt("late"))} متأخر</div>
    <div class="meta">تاريخ التقرير: ${hij(today())}<br>إعداد: ${esc(by)}</div></div>${ft("")}</section>`);
  P.push(`<section class="rp">${hd}<div class="sec">📊 الملخص التنفيذي<small>${hij(today())}</small></div>
    <div class="kp"><div><b>${ar(L.length)}</b>إجمالي البرامج</div><div><b style="color:#15803d">${ar(cnt("done"))}</b>مكتمل</div><div><b style="color:#1d4ed8">${ar(cnt("run"))}</b>جارٍ التنفيذ</div><div><b style="color:#dc2626">${ar(cnt("late"))}</b>متأخر</div><div><b>${ar(avg)}٪</b>متوسط الإنجاز</div></div>
    <div class="sec">🧭 الإنجاز حسب المجال</div>${doms.map(d => { const X = L.filter(x => (x.p.dom || "عام") === d); const v = Math.round(X.reduce((a, x) => a + x.C.prog, 0) / X.length); return `<div class="dbar"><span>${esc(d)} (${ar(X.length)})</span><div class="bar"><i style="width:${v}%"></i></div><b>${ar(v)}٪</b></div>`; }).join("")}
    ${sumTbl(L.slice(0, 8), 0)}${ft(ar(++pg))}</section>`);
  for (let k = 8; k < L.length; k += 13) P.push(`<section class="rp">${hd}${sumTbl(L.slice(k, k + 13), k)}${ft(ar(++pg))}</section>`);
  L.forEach(({ p, C }) => { const S = OP_ST[C.st]; const im = Object.entries(obj(p.imgs)).sort((a, b) => (a[1].ord || 0) - (b[1].ord || 0)).filter(([iid]) => srcs[p.id] && srcs[p.id][iid]);
    const u = v => v ? esc(v) + (p.unit === "%" && !/[٪%]/.test(v) ? "٪" : "") : "";
    const kv = [["الهدف العام", p.gen ? `${p.gn ? `(${p.gn}) ` : ""}${p.gen}` : ""], ["الهدف التفصيلي", p.obj], ["هدف البرنامج", p.goal], ["مؤشر الإنجاز", p.ind], ["مستهدف الهدف العام", p.gtg ? `${p.gbase ? `خط الأساس: ${p.gbase} ← ` : ""}المستهدف: ${p.gtg}` : ""], ["المستفيدون", p.ben && p.place ? `${p.ben} — مكان التنفيذ: ${p.place}` : p.ben || p.place], ["القيمة الحالية", u(p.base)], ["المستهدف", u(p.tg)], ["المتحقق", p.act ? `<b style="color:#15803d;font-size:11pt">${u(p.act)}</b>${C.ach != null ? ` <span style="font-size:8.5pt;color:#64748b">(تحقق المؤشر ${ar(C.ach)}٪)</span>` : ""}` : ""], ["مسؤول التنفيذ", p.ex], ["المساندون", p.par], ["مسؤول المتابعة", p.fol], ["الفترة الزمنية", p.from || p.to ? `${p.from ? hijS(p.from) : "—"} ← ${p.to ? hijS(p.to) : "—"}` : ""]].filter(([, v]) => v);
    const hasPlan = arr(p.meth).length || arr(p.evalp).length; const lines = arr(p.proc).length + arr(p.ev).length + (p.note ? 2 : 0) + (hasPlan ? 8 : 0) + (p.gen ? 3 : 0); const nMain = lines > 12 ? 0 : lines > 7 ? 2 : im.length === 3 ? 3 : 2;
    const first = im.slice(0, nMain), rest = im.slice(nMain);
    const imgBlock = (arr, cont) => arr.length ? `<div class="ph ${cont ? "g2 big" : arr.length === 1 ? "g1" : arr.length === 3 ? "g3" : "g2"}">${arr.map(([iid, m]) => `<figure><img src="${srcs[p.id][iid]}">${m.cap ? `<figcaption>${esc(m.cap)}</figcaption>` : ""}</figure>`).join("")}</div>` : "";
    P.push(`<section class="rp">${hd}<div class="pt">${ringHtml(C.prog, S.c)}<div style="flex:1"><div class="dm">${esc(p.dom || "")}</div><h3>${esc(p.t)}</h3>${stHtml(C.st)}${C.pn ? ` <span style="font-size:9pt;font-weight:800;color:#475569">الإجراءات المنفذة ${ar(C.dn)} من ${ar(C.pn)}</span>` : ""}</div></div>
      <table class="kv"><tbody>${kv.map(([k, v]) => `<tr><td>${k}</td><td>${["المتحقق", "القيمة الحالية", "المستهدف", "الفترة الزمنية"].includes(k) ? v : esc(v)}</td></tr>`).join("")}</tbody></table>
      ${arr(p.proc).length ? `<div class="sec">🛠️ الإجراءات التنفيذية</div><ul class="pr">${arr(p.proc).map(x => `<li><span class="bx" style="${x.done ? `background:#16a34a;border-color:#16a34a;color:#fff` : ""}">${x.done ? "✓" : ""}</span><span style="flex:1">${esc(x.t)}</span>${x.d ? `<span style="font-size:8pt;color:#64748b">${hijS(x.d)}</span>` : ""}</li>`).join("")}</ul>` : ""}
      ${hasPlan ? `<div class="two"><div><div class="sec">🧩 أساليب التنفيذ</div><ul class="pr sm">${arr(p.meth).map(x => `<li><span class="bx">•</span><span>${esc(x)}</span></li>`).join("")}</ul></div><div><div class="sec">📐 إجراءات التقويم</div><ul class="pr sm">${arr(p.evalp).map(x => `<li><span class="bx">•</span><span>${esc(x)}</span></li>`).join("")}</ul></div></div>` : ""}
      ${arr(p.ev).length ? `<div class="sec">📎 الشواهد</div><ul class="pr">${arr(p.ev).map(x => `<li><span class="bx">•</span><span>${esc(x.t)}${x.u ? ` — <span dir="ltr" style="font-size:8pt;color:#1d4ed8">${esc(x.u)}</span>` : ""}</span></li>`).join("")}</ul>` : ""}
      ${first.length ? `<div class="sec">📸 صور التنفيذ<small>${ar(im.length)} صورة${rest.length ? " — تتمة الصور في الصفحات التالية" : ""}</small></div>${imgBlock(first)}` : rest.length ? `<div class="sec">📸 صور التنفيذ<small>${ar(im.length)} صورة في الصفحات التالية</small></div>` : ""}
      ${p.note ? `<div class="sec">📝 ملاحظات ومعوقات</div><div style="font-size:9.5pt;font-weight:700;line-height:1.9;position:relative;z-index:1">${esc(p.note)}</div>` : ""}
      <div class="sg"><div><b>مسؤول التنفيذ</b>${esc(p.ex || "")}</div><div><b>${p.fol && !/مدير/.test(p.fol) ? "مسؤول المتابعة" : "وكيل المدرسة"}</b>${p.fol && !/مدير/.test(p.fol) ? esc(p.fol) : ""}</div><div><b>مدير المدرسة</b>${esc(api.mgr || "")}</div></div>${ft(ar(++pg))}</section>`);
    for (let k = 0; k < rest.length; k += 6) P.push(`<section class="rp">${hd}<div class="sec">📸 صور التنفيذ: ${esc(p.t)}<small>${ar(nMain + k + 1)}–${ar(Math.min(im.length, nMain + k + 6))} من ${ar(im.length)}</small></div>${imgBlock(rest.slice(k, k + 6), true)}${ft(ar(++pg))}</section>`);
  });
  api.print(P.join(""), cfg.title || "تقرير الخطة التشغيلية", RCSS);
}

// ══════════ ورقة توثيق البرنامج (صفحة واحدة بتصميم مميز + ٢–٤ صور) ══════════
const SCSS = `
.sh{width:210mm;height:297mm;position:relative;overflow:hidden;page-break-after:always;break-after:page;box-sizing:border-box;display:flex;flex-direction:column;background:#fff;font-family:Cairo,Tahoma,sans-serif;color:#0f172a}
.sh:last-child{page-break-after:auto}.sh *{box-sizing:border-box}
.sh-top{position:relative;height:28mm;background:linear-gradient(120deg,${NAVY} 0%,#13315c 55%,#1e3a8a 100%);color:#fff;display:flex;align-items:center;justify-content:space-between;padding:0 12mm;flex:none}
.sh-top::before{content:"";position:absolute;left:38%;top:-34mm;width:56mm;height:56mm;border-radius:50%;border:4mm solid rgba(201,162,39,.22)}
.sh-top::after{content:"";position:absolute;inset:auto 0 0 0;height:1.6mm;background:linear-gradient(90deg,${GOLD},#f5e6a8,${GOLD})}
.sh-top .lg{width:20mm;height:20mm;border-radius:5mm;background:#fff;display:grid;place-items:center;position:relative;z-index:1;box-shadow:0 0 0 .8mm rgba(201,162,39,.75)}.sh-top .lg img{max-width:16.5mm;max-height:16.5mm}
.sh-top .m{text-align:center;font-size:9.5pt;font-weight:700;line-height:1.55;position:relative;z-index:1}.sh-top .m b{font-size:12.5pt;font-weight:900;color:#fde68a}
.sh-ti{position:relative;margin:3.5mm 12mm 0;display:flex;align-items:center;gap:5mm;flex:none}
.sh-ti .kind{display:inline-block;background:${GOLD};color:#fff;font-weight:900;font-size:9pt;padding:.8mm 4mm;border-radius:0 3mm 0 3mm;letter-spacing:.3px}
.sh-ti h1{margin:.5mm 0 0;font-size:21pt;font-weight:900;color:${NAVY};line-height:1.35}
.sh-ti .dm{font-size:9.5pt;font-weight:800;color:${GOLD2}}
.sh-ring{width:22mm;height:22mm;border-radius:50%;display:grid;place-items:center;flex:none}.sh-ring span{width:17mm;height:17mm;border-radius:50%;background:#fff;display:grid;place-items:center;text-align:center;font-weight:900;font-size:12.5pt;line-height:1.1}.sh-ring small{display:block;font-size:6pt;color:#64748b;font-weight:800}
.sh-tl{display:grid;grid-template-columns:repeat(4,1fr);gap:2.5mm;margin:3mm 12mm 0;flex:none}
.sh-tl div{background:#f6f3e6;border-radius:3mm;padding:1.3mm 3mm;border-inline-start:1.4mm solid ${GOLD};font-size:9pt;font-weight:800;color:${NAVY};line-height:1.45;min-height:10mm}
.sh-tl small{display:block;font-size:7pt;color:${GOLD2};font-weight:900}
.sh-bd{display:grid;grid-template-columns:1.08fr 1fr;gap:4mm;margin:3mm 12mm 0;flex:none}
.sh-h{display:flex;align-items:center;gap:2mm;font-size:10.5pt;font-weight:900;color:${NAVY};margin:0 0 1.5mm}
.sh-h::before{content:"";width:3mm;height:3mm;background:${GOLD};transform:rotate(45deg);flex:none}
.sh-h::after{content:"";flex:1;height:.5mm;background:linear-gradient(90deg,transparent,${GOLD})}
.sh-g{background:#fff;border:.4mm solid #e7e2cc;border-radius:3mm;padding:1.2mm 3mm;margin-bottom:1.4mm;position:relative}
.sh-g small{display:block;font-size:7.5pt;font-weight:900;color:${GOLD2}}.sh-g p{margin:0;font-size:8.2pt;font-weight:700;line-height:1.5;color:#1e293b}
.sh-g.nv{background:linear-gradient(135deg,${NAVY},#1e3a8a);border-color:${NAVY}}.sh-g.nv small{color:#fde68a}.sh-g.nv p{color:#fff}
.sh-l{list-style:none;margin:0 0 2mm;padding:0;display:grid;gap:1.1mm}.sh-l li{display:flex;gap:2mm;font-size:8.2pt;font-weight:700;line-height:1.45;align-items:flex-start}
.sh-l .bx{width:3.8mm;height:3.8mm;border-radius:50%;border:.4mm solid #94a3b8;flex:none;display:grid;place-items:center;font-size:6.5pt;margin-top:.7mm;color:#fff}.sh-l .bx.on{background:#15803d;border-color:#15803d}.sh-l .ev{background:${GOLD};border-color:${GOLD}}
.sh-l .d{font-size:7pt;color:#64748b;white-space:nowrap}
.sh-ph{flex:1;min-height:0;margin:2.5mm 12.5mm 1mm;display:grid;gap:3.4mm}
.sh-ph.n1{grid-template-columns:1fr}.sh-ph.n2{grid-template-columns:1fr 1fr;align-content:center}.sh-ph.n2:not(.ap) figure{height:72mm}.sh-ph.n3{grid-template-columns:1.35fr 1fr;grid-template-rows:1fr 1fr}.sh-ph.n3 figure:first-child{grid-row:1 / span 2}.sh-ph.n4{grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr}
.sh-ph.ap{grid-template-columns:1fr;grid-template-rows:1fr 1fr}
.sh-ph figure{margin:0;position:relative;border-radius:4mm;overflow:hidden;min-height:0;box-shadow:0 0 0 .5mm ${GOLD},0 0 0 1.3mm #fff,0 0 0 1.6mm ${NAVY}}
.sh-ph img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
.sh-ph figcaption{position:absolute;inset:auto 0 0 0;background:linear-gradient(0deg,rgba(11,37,69,.92),rgba(11,37,69,0));color:#fff;font-size:8.5pt;font-weight:800;padding:6mm 3mm 1.6mm;text-align:center}
.sh-tx{flex:1;min-height:0;margin:3mm 12mm 0;display:grid;grid-template-columns:1fr 1fr;gap:4mm;align-content:start}
.sh-sg{display:grid;grid-template-columns:repeat(3,1fr);gap:8mm;margin:2.5mm 14mm 0;text-align:center;font-size:9pt;font-weight:800;flex:none}.sh-sg b{display:block;color:${NAVY};font-size:9.5pt}.sh-sg i{display:block;height:6mm;border-bottom:.3mm dashed #94a3b8;margin-bottom:1mm}
.sh-ft{margin-top:2.5mm;height:8mm;background:${NAVY};color:#fff;display:flex;justify-content:space-between;align-items:center;padding:0 12mm;font-size:8pt;font-weight:700;flex:none;border-top:1.2mm solid ${GOLD}}
`;
const mainImgs = p => { const all = Object.entries(obj(p.imgs)).sort((a, b) => (a[1].ord || 0) - (b[1].ord || 0)); const st = all.filter(([, m]) => m.main); const main = (st.length ? st : all).slice(0, 4); return { main, rest: all.filter(x => !main.includes(x)) }; };
function sheetHtml(api, p, cfg, src) {
  const C = opCalc(p); const S = OP_ST[C.st]; const { main, rest } = mainImgs(p); const M = main.filter(([iid]) => src[iid]); const R = rest.filter(([iid]) => src[iid]);
  const top = `<div class="sh-top"><div class="lg"><img src="${api.moe}"></div><div class="m">المملكة العربية السعودية • وزارة التعليم<br>${esc(api.region || "")}<br><b>${esc(api.school)}</b></div><div class="lg"><img src="${api.logo}"></div></div>`;
  const ft = t => `<div class="sh-ft"><span>${esc(cfg.docName || "الخطة التشغيلية")} ${esc(cfg.year || "")}</span><span>${t}</span><span>${hij(today())}</span></div>`;
  const tiles = [["مسؤول التنفيذ", p.ex], ["تاريخ التنفيذ", p.from || p.to ? `${p.from ? hijS(p.from) : "—"} ← ${p.to ? hijS(p.to) : "—"}` : ""], ["المستفيدون", p.ben], ["مكان التنفيذ", p.place || (p.par ? "" : "")]].map(([k, v]) => `<div><small>${k}</small>${esc(v || "—")}</div>`).join("");
  const goals = [["الهدف العام", p.gen, 1], ["الهدف التفصيلي", p.obj], ["هدف البرنامج", p.goal], ["مؤشر الإنجاز", p.ind]].filter(x => x[1]).map(([k, v, nv]) => `<div class="sh-g${nv ? " nv" : ""}"><small>${k}</small><p>${esc(v)}</p></div>`).join("");
  const proc = arr(p.proc); const ev = arr(p.ev); const act = p.act ? esc(p.act) + (p.unit === "%" && !/[٪%]/.test(p.act) ? "٪" : "") : "";
  const left = `${proc.length ? `<div class="sh-h">الإجراءات المنفذة (${ar(C.dn)} من ${ar(C.pn)})</div><ul class="sh-l">${proc.map(x => `<li><span class="bx${x.done ? " on" : ""}">${x.done ? "✓" : ""}</span><span style="flex:1">${esc(x.t)}</span>${x.d ? `<span class="d">${hijS(x.d)}</span>` : ""}</li>`).join("")}</ul>` : ""}
    ${ev.length ? `<div class="sh-h">الشواهد</div><ul class="sh-l">${ev.map(x => `<li><span class="bx ev">◆</span><span>${esc(x.t)}${x.u ? `<br><span dir="ltr" style="font-size:7pt;color:#1d4ed8;word-break:break-all">${esc(x.u)}</span>` : ""}</span></li>`).join("")}</ul>` : ""}
    ${act || p.tg ? `<div class="sh-g"><small>المتحقق${p.tg ? " / المستهدف" : ""}</small><p><b style="font-size:11pt;color:#15803d">${act || "—"}</b>${p.tg ? ` من ${esc(p.tg)}${p.unit === "%" && !/[٪%]/.test(p.tg) ? "٪" : ""}` : ""}</p></div>` : ""}
    ${p.note ? `<div class="sh-g"><small>ملاحظات</small><p>${esc(p.note)}</p></div>` : ""}`;
  const fig = ([iid, m]) => `<figure><img src="${src[iid]}">${m.cap ? `<figcaption>${esc(m.cap)}</figcaption>` : ""}</figure>`;
  const li = a => `<ul class="sh-l">${a.map(x => `<li><span class="bx ev">◆</span><span>${esc(x)}</span></li>`).join("")}</ul>`;
  const mid = M.length ? `<div class="sh-ph n${M.length}">${M.map(fig).join("")}</div>` : `<div class="sh-tx">${arr(p.meth).length ? `<div><div class="sh-h">أساليب التنفيذ</div>${li(arr(p.meth))}</div>` : ""}${arr(p.evalp).length ? `<div><div class="sh-h">إجراءات التقويم</div>${li(arr(p.evalp))}</div>` : ""}</div>`;
  const pages = [`<section class="sh">${top}
    <div class="sh-ti"><div style="flex:1"><span class="kind">تقرير تنفيذ برنامج</span><h1>${esc(p.t)}</h1><div class="dm">${esc(p.dom || "")}${p.gn ? ` • الهدف ${esc(p.gn)}-${esc(p.on || "")}` : ""}${p.strat ? ` • ${esc(p.strat)}` : ""}</div></div>
      <div class="sh-ring" style="background:conic-gradient(${S.c} ${C.prog * 3.6}deg,#e5e7eb 0)"><span style="color:${S.c}">${ar(C.prog)}٪<small>${S.t}</small></span></div></div>
    <div class="sh-tl">${tiles}</div>
    <div class="sh-bd"><div><div class="sh-h">الأهداف والمؤشر</div>${goals}</div><div>${left}</div></div>
    ${M.length ? `<div class="sh-h" style="margin:2mm 12mm 0">التوثيق المصوّر</div>` : ""}${mid}
    <div class="sh-sg"><div><i></i><b>مسؤول التنفيذ</b>${esc(p.ex || "")}</div><div><i></i><b>مسؤول المتابعة</b>${esc(p.fol && !/مدير/.test(p.fol) ? p.fol : "وكيل المدرسة")}</div><div><i></i><b>مدير المدرسة</b>${esc(api.mgr || "")}</div></div>
    ${ft("تقرير تنفيذ برنامج")}</section>`];
  for (let k = 0; k < R.length; k += 4) { const X = R.slice(k, k + 4); pages.push(`<section class="sh">${top}<div class="sh-ti"><div style="flex:1"><span class="kind">ملحق الصور</span><h1 style="font-size:18pt">${esc(p.t)}</h1></div></div><div class="sh-ph n${X.length}${X.length === 2 ? " ap" : ""}" style="margin-bottom:4mm">${X.map(fig).join("")}</div>${ft("ملحق التوثيق المصوّر")}</section>`); }
  return pages.join("");
}
async function printSheets(api, list, cfg) {
  const out = []; for (const p of list) { const src = Object.keys(obj(p.imgs)).length ? obj(await api.maGet(`${N.IMG}/${p.id}`)) : {}; out.push(sheetHtml(api, p, cfg, src)); }
  api.print(out.join(""), list.length === 1 ? `تقرير تنفيذ برنامج — ${list[0].t}` : "تقارير تنفيذ البرامج", RCSS + SCSS);
}

// ══════════ 📘 تقرير البرنامج الاحترافي (كل عناصر التنفيذ + الصور صورتين متجاورتين بحجم متوسط) ══════════
const PCSS2 = `@page{size:A4;margin:9mm 0 11mm}*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{margin:0;background:#fff;font-family:Cairo,Tahoma,sans-serif;color:#0f172a}
.pp{width:210mm;padding:0 12mm;break-before:page;page-break-before:always}.pp:first-child{break-before:auto;page-break-before:auto}
.pp-top{display:flex;align-items:center;justify-content:space-between;background:linear-gradient(120deg,${NAVY},#13315c 60%,#1e3a8a);color:#fff;border-radius:5mm;padding:3.5mm 6mm;position:relative;overflow:hidden}
.pp-top::after{content:"";position:absolute;inset:auto 0 0 0;height:1.4mm;background:linear-gradient(90deg,${GOLD},#f5e6a8,${GOLD})}
.pp-top .lg{width:17mm;height:17mm;background:#fff;border-radius:4mm;display:grid;place-items:center;box-shadow:0 0 0 .7mm rgba(201,162,39,.8)}.pp-top .lg img{max-width:14mm;max-height:14mm}
.pp-top .m{text-align:center;font-size:9pt;font-weight:700;line-height:1.6}.pp-top .m b{font-size:12pt;color:#fde68a}
.pp-ti{display:flex;gap:5mm;align-items:center;margin:5mm 0 3mm}
.pp-ti .k{display:inline-block;background:${GOLD};color:#fff;font-size:8.5pt;font-weight:900;padding:.8mm 4mm;border-radius:0 3mm 0 3mm}
.pp-ti h1{margin:1mm 0 0;font-size:20pt;font-weight:900;color:${NAVY};line-height:1.35}.pp-ti .dm{font-size:9pt;font-weight:800;color:${GOLD2}}
.pp-rg{width:24mm;height:24mm;border-radius:50%;display:grid;place-items:center;flex:none}.pp-rg span{width:18.5mm;height:18.5mm;border-radius:50%;background:#fff;display:grid;place-items:center;text-align:center;font-weight:900;font-size:13pt;line-height:1.1}.pp-rg small{display:block;font-size:6.5pt;color:#64748b}
.pp-in{display:grid;grid-template-columns:repeat(4,1fr);gap:2.2mm;margin-bottom:3mm}
.pp-in div{background:#f8f5e8;border-radius:3mm;padding:1.6mm 3mm;border-inline-start:1.3mm solid ${GOLD};font-size:8.8pt;font-weight:800;color:${NAVY};line-height:1.5;break-inside:avoid}
.pp-in small{display:block;font-size:7pt;color:${GOLD2};font-weight:900}
.pp-h{display:flex;align-items:center;gap:2mm;font-size:11pt;font-weight:900;color:${NAVY};margin:4mm 0 2mm;break-after:avoid}
.pp-h::before{content:"";width:3.2mm;height:3.2mm;background:${GOLD};transform:rotate(45deg)}.pp-h::after{content:"";flex:1;height:.5mm;background:linear-gradient(90deg,${GOLD},transparent)}
.pp-g{border:.4mm solid #e7e2cc;border-radius:3.5mm;padding:2mm 4mm;margin-bottom:2mm;break-inside:avoid;background:#fff}
.pp-g small{display:block;font-size:7.5pt;font-weight:900;color:${GOLD2}}.pp-g p{margin:0;font-size:9.3pt;font-weight:700;line-height:1.7}
.pp-g.nv{background:linear-gradient(135deg,${NAVY},#1e3a8a);border-color:${NAVY}}.pp-g.nv small{color:#fde68a}.pp-g.nv p{color:#fff}
.pp-2{display:grid;grid-template-columns:1fr 1fr;gap:4mm}
.pp-k{display:grid;grid-template-columns:repeat(3,1fr);gap:2.5mm;margin:2mm 0}.pp-k div{text-align:center;border-radius:3mm;padding:2mm;background:#f1f5f9;font-size:8pt;font-weight:800;color:#475569}.pp-k b{display:block;font-size:14pt;color:${NAVY}}
.pp-l{list-style:none;margin:0;padding:0;display:grid;gap:1.3mm}.pp-l li{display:flex;gap:2mm;font-size:9pt;font-weight:700;line-height:1.6;break-inside:avoid}.pp-l li::before{content:"◆";color:${GOLD};font-size:7pt;margin-top:1mm}
table.pp-t{width:100%;border-collapse:separate;border-spacing:0;font-size:9pt;border:.4mm solid #cbd5e1;border-radius:3mm;overflow:hidden}
.pp-t th{background:${NAVY};color:#fff;padding:1.8mm;font-weight:900}.pp-t td{padding:1.6mm 2.5mm;border-top:.3mm solid #e2e8f0;font-weight:700}.pp-t tr:nth-child(even) td{background:#fafaf5}.pp-t tr{break-inside:avoid}
.pp-ok{display:inline-block;border-radius:999px;padding:.3mm 3mm;font-size:8pt;font-weight:900}
.pp-ph{display:grid;grid-template-columns:1fr 1fr;gap:5mm;margin-top:2mm}
.pp-ph figure{margin:0;break-inside:avoid;background:#fff;border-radius:4mm;padding:1.6mm;box-shadow:0 0 0 .45mm ${GOLD},0 0 0 1.2mm #fff,0 0 0 1.5mm ${NAVY}}
.pp-ph .im{height:62mm;border-radius:3mm;overflow:hidden;background:#f1f5f9}.pp-ph img{width:100%;height:100%;object-fit:cover;display:block}
.pp-ph figcaption{text-align:center;font-size:8.5pt;font-weight:800;color:${NAVY};padding:1.6mm 1mm .4mm;line-height:1.5}
.pp-ph figcaption::before{content:"";display:block;width:14mm;height:.6mm;background:${GOLD};margin:0 auto 1mm;border-radius:2px}
.pp-sg{display:grid;grid-template-columns:repeat(3,1fr);gap:8mm;margin:7mm 2mm 2mm;text-align:center;font-size:9pt;font-weight:800;break-inside:avoid}.pp-sg b{display:block;color:${NAVY}}.pp-sg i{display:block;height:8mm;border-bottom:.3mm dashed #94a3b8;margin-bottom:1mm}
.pp-ft{margin-top:4mm;display:flex;justify-content:space-between;font-size:8pt;font-weight:700;color:#64748b;border-top:.4mm solid ${GOLD};padding-top:1.5mm}`;
function proHtml(api, p, cfg, src) {
  const C = opCalc(p); const S = OP_ST[C.st]; const u = v => v ? esc(v) + (p.unit === "%" && !/[٪%]/.test(v) ? "٪" : "") : "—";
  const im = Object.entries(obj(p.imgs)).sort((a, b) => (b[1].main ? 1 : 0) - (a[1].main ? 1 : 0) || (a[1].ord || 0) - (b[1].ord || 0)).filter(([iid]) => src[iid]);
  const tile = (k, v) => `<div><small>${k}</small>${esc(v || "—")}</div>`;
  const per = p.from || p.to ? `${p.from ? hijS(p.from) : "—"} ← ${p.to ? hijS(p.to) : "—"}` : "";
  const box = (k, v, nv) => v ? `<div class="pp-g${nv ? " nv" : ""}"><small>${k}</small><p>${esc(v)}</p></div>` : "";
  const list = a => `<ul class="pp-l">${arr(a).map(x => `<li><span>${esc(typeof x === "string" ? x : x.t)}</span></li>`).join("")}</ul>`;
  const proc = arr(p.proc); const req = arr(p.req), meth = arr(p.meth), evalp = arr(p.evalp), ev = arr(p.ev);
  return `<section class="pp">
  <div class="pp-top"><div class="lg"><img src="${api.moe}"></div><div class="m">المملكة العربية السعودية • وزارة التعليم<br>${esc(api.region || "")}<br><b>${esc(api.school)}</b></div><div class="lg"><img src="${api.logo}"></div></div>
  <div class="pp-ti"><div style="flex:1"><span class="k">تقرير برنامج • ${esc(cfg.docName || "الخطة التشغيلية")} ${esc(cfg.year || "")}</span><h1>${esc(p.t)}</h1><div class="dm">${esc(p.dom || "")}${p.gn ? ` • الهدف العام ${esc(p.gn)}${p.on ? ` — الهدف التفصيلي ${esc(p.on)}` : ""}` : ""}</div></div>
    <div class="pp-rg" style="background:conic-gradient(${S.c} ${C.prog * 3.6}deg,#e5e7eb 0)"><span style="color:${S.c}">${ar(C.prog)}٪<small>${S.t}</small></span></div></div>
  <div class="pp-in">${tile("المجال", p.dom)}${tile("الهدف الاستراتيجي", p.strat)}${tile("المنفّذ (مسؤول التنفيذ)", p.ex)}${tile("المشاركون / المساندون", p.par)}${tile("المستفيدون", p.ben)}${tile("مكان التنفيذ", p.place)}${tile("الفترة الزمنية", per)}${tile("مسؤول المتابعة", p.fol)}</div>
  <div class="pp-h">الأهداف</div>
  ${box(`الهدف العام${p.gn ? ` (${p.gn})` : ""}`, p.gen, 1)}
  ${p.gind || p.gtg || p.gbase ? `<div class="pp-g"><small>مؤشر قياس الهدف العام</small><p>${esc(p.gind || "")}${p.gbase || p.gtg ? ` <b style="color:${GOLD2}">— خط الأساس: ${esc(p.gbase || "—")} • المستهدف: ${esc(p.gtg || "—")}</b>` : ""}</p></div>` : ""}
  <div class="pp-2"><div>${box(`الهدف التفصيلي${p.on ? ` (${p.on})` : ""}`, p.obj)}</div><div>${box("هدف البرنامج", p.goal)}</div></div>
  ${box("الأثر المتوقع", p.gimp)}
  <div class="pp-h">مؤشر الإنجاز</div>
  ${box("المؤشر", p.ind)}
  <div class="pp-k"><div><b>${u(p.base)}</b>القيمة الحالية (خط الأساس)</div><div><b>${u(p.tg)}</b>المستهدف</div><div><b style="color:#15803d">${u(p.act)}</b>المتحقق فعلياً</div></div>
  ${req.length || p.cost || meth.length ? `<div class="pp-2"><div><div class="pp-h">متطلبات التنفيذ والموارد</div>${req.length ? list(req) : ""}${p.cost ? `<div class="pp-g" style="margin-top:2mm"><small>التكلفة التقديرية</small><p>${esc(p.cost)}</p></div>` : ""}${!req.length && !p.cost ? `<div style="font-size:9pt;color:#94a3b8">—</div>` : ""}</div><div><div class="pp-h">أساليب التنفيذ</div>${meth.length ? list(meth) : `<div style="font-size:9pt;color:#94a3b8">—</div>`}</div></div>` : ""}
  ${proc.length ? `<div class="pp-h">الإجراءات التنفيذية (المنفّذ ${ar(C.dn)} من ${ar(C.pn)})</div><table class="pp-t"><thead><tr><th style="width:9mm">م</th><th>الإجراء</th><th style="width:26mm">الحالة</th><th style="width:30mm">تاريخ التنفيذ</th></tr></thead><tbody>${proc.map((x, i) => `<tr><td style="text-align:center">${ar(i + 1)}</td><td>${esc(x.t)}</td><td style="text-align:center"><span class="pp-ok" style="background:${x.done ? "#dcfce7" : "#f1f5f9"};color:${x.done ? "#15803d" : "#64748b"}">${x.done ? "✓ منفّذ" : "قيد التنفيذ"}</span></td><td style="text-align:center">${x.d ? hijS(x.d) : "—"}</td></tr>`).join("")}</tbody></table>` : ""}
  ${evalp.length || ev.length ? `<div class="pp-2"><div>${evalp.length ? `<div class="pp-h">إجراءات التقويم</div>${list(evalp)}` : ""}</div><div>${ev.length ? `<div class="pp-h">الشواهد</div><ul class="pp-l">${ev.map(x => `<li><span>${esc(x.t)}${x.u ? `<br><span dir="ltr" style="font-size:7.5pt;color:#1d4ed8;word-break:break-all">${esc(x.u)}</span>` : ""}</span></li>`).join("")}</ul>` : ""}</div></div>` : ""}
  ${p.note ? `<div class="pp-h">ملاحظات ومعوقات</div>${box("", p.note)}` : ""}
  ${im.length ? `<div class="pp-h">التوثيق المصوّر (${ar(im.length)} صورة)</div><div class="pp-ph">${im.map(([iid, m]) => `<figure><div class="im"><img src="${src[iid]}"></div><figcaption>${esc(m.cap || p.t)}</figcaption></figure>`).join("")}</div>` : ""}
  <div class="pp-sg"><div><i></i><b>مسؤول التنفيذ</b>${esc(p.ex || "")}</div><div><i></i><b>مسؤول المتابعة</b>${esc(p.fol && !/مدير/.test(p.fol) ? p.fol : "وكيل المدرسة")}</div><div><i></i><b>مدير المدرسة</b>${esc(api.mgr || "")}</div></div>
  <div class="pp-ft"><span>${esc(api.school)}</span><span>تقرير برنامج: ${esc(p.t)}</span><span>${hij(today())}</span></div>
  </section>`;
}
async function printPro(api, list, cfg) {
  const out = []; for (const p of list) { const src = Object.keys(obj(p.imgs)).length ? obj(await api.maGet(`${N.IMG}/${p.id}`)) : {}; out.push(proHtml(api, p, cfg, src)); }
  api.print(out.join(""), list.length === 1 ? `تقرير برنامج — ${list[0].t}` : "تقارير البرامج", PCSS2);
}

// ══════════ الصفحة الرئيسية ══════════
export function OpPlan({ api, me }) {
  const by = (me && me.name) || "الإدارة"; const [toast, say] = useToast();
  const [tab, setTab] = useState("dash"); const [L, setL] = useState(null); const [cfg, setCfg] = useState({}); const [ed, setEd] = useState(null); const [imp, setImp] = useState(false);
  const [people, setPeople] = useState([]); const [mgr, setMgr] = useState(""); const [f, setF] = useState({ dom: "", st: "", ex: "", q: "" }); const [circs, setCircs] = useState(null); const [busy, setBusy] = useState(""); const [ro, setRo] = useState({ imgs: true, cover: true });
  const load = async () => { const [p, c] = await Promise.all([api.maGet(N.P), api.maGet(N.CFG)]); setL(arr(p).sort((a, b) => (a.ord || 0) - (b.ord || 0))); setCfg({ year: "١٤٤٨هـ", title: "تقرير متابعة تنفيذ الخطة التشغيلية", ...obj(c) }); };
  useEffect(() => { load(); (async () => { try { const [T, s] = await Promise.all([api.TT().catch(() => null), api.staff().catch(() => [])]); const pr = arr(s).find(x => x.role === "principal"); if (pr) setMgr(pr.name); setPeople([...new Set([...(T && T.T ? T.T.map(n => String(n || "").replace(/\s*\(.*?\)\s*/g, "").trim()) : []), ...arr(s).map(x => x.name)])].filter(Boolean).sort((a, b) => a.localeCompare(b, "ar"))); } catch {} })(); }, []);
  useEffect(() => { if (tab === "doc" && !circs) api.circs().then(c => setCircs(c.sort((a, b) => (b.keep ? 1 : 0) - (a.keep ? 1 : 0) || (b.at || 0) - (a.at || 0)))).catch(() => setCircs([])); }, [tab]);
  const saveCfg = async v => { const n = { ...cfg, ...v }; setCfg(n); await api.maPut(N.CFG, n); };
  const [seedN, setSeedN] = useState(0);
  useEffect(() => { import("./planSeed.js").then(m => setSeedN(m.PLAN_SEED.filter(x => !L || !L.some(p => p.id === x.sid || p.t === x.t)).length)).catch(() => {}); }, [L && L.length]);
  if (!L) return <div className="op"><style>{CSS}</style><div className="op-card" style={{ textAlign: "center", color: "#94a3b8", fontWeight: 800 }}>⏳ جارٍ التحميل…</div></div>;
  const CL = L.map(p => ({ p, C: opCalc(p) })); const doms = [...new Set(L.map(p => p.dom).filter(Boolean))]; const exs = [...new Set(L.map(p => p.ex).filter(Boolean))];
  const FL = CL.filter(x => (!f.dom || x.p.dom === f.dom) && (!f.st || x.C.st === f.st) && (!f.ex || x.p.ex === f.ex) && (!f.q || (x.p.t + x.p.goal + x.p.ind + (x.p.gen || "") + (x.p.obj || "")).includes(f.q)));
  const avg = CL.length ? Math.round(CL.reduce((a, x) => a + x.C.prog, 0) / CL.length) : 0; const cnt = k => CL.filter(x => x.C.st === k).length;
  const loadSeed = async () => { setBusy("seed"); try { const m = await import("./planSeed.js"); const P = {}; const t0 = Date.now(); let n = 0;
    m.PLAN_SEED.forEach((x, i) => { if (L.some(p => p.id === x.sid || p.t === x.t)) return; n++; const { sid, ...r } = x; P[`${N.P}/${sid}`] = { ...r, id: sid, base: "", tg: "", act: "", unit: "%", ev: [], note: "", st: "", imgs: {}, by, at: t0, up: t0, ord: i + 1 }; });
    if (n) await api.fbPatch(P); say(n ? `✅ أُضيف ${ar(n)} برنامجاً من ${m.PLAN_SEED_NAME}` : "جميع برامج الخطة موجودة"); await load(); setTab("list"); } catch (e) { alert("تعذّر التحميل: " + (e.message || e)); } setBusy(""); };
  const del = async p => { if (!confirm(`حذف البرنامج «${p.t}» وصوره؟`)) return; await api.maPut(`${N.P}/${p.id}`, null); await api.maPut(`${N.IMG}/${p.id}`, null); setEd(null); say("🗑️ تم الحذف"); load(); };
  const print = async (list, scope) => { setBusy("print"); try { await printReport({ ...api, mgr: api.mgr || mgr }, list, cfg, by, { ...ro, scope }); } catch (e) { alert("تعذّر إعداد التقرير: " + (e.message || e)); } setBusy(""); };
  const pros = async list => { setBusy("pro"); try { await printPro({ ...api, mgr: api.mgr || mgr }, list, cfg); } catch (e) { alert("تعذّر إعداد التقرير: " + (e.message || e)); } setBusy(""); };
  const sheets = async list => { setBusy("sheet"); try { await printSheets({ ...api, mgr: api.mgr || mgr }, list, cfg); } catch (e) { alert("تعذّر إعداد التقرير: " + (e.message || e)); } setBusy(""); };
  const Card = ({ x }) => { const S = OP_ST[x.C.st]; return <button className="op-prog" style={{ borderTop: `5px solid ${S.c}` }} onClick={() => setEd(x.p)}>
    <div style={{ display: "flex", gap: 10, alignItems: "center" }}><Ring v={x.C.prog} c={S.c} size={56} /><div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 11.5, fontWeight: 800, color: GOLD2 }}>{x.p.gn ? `الهدف ${x.p.gn}-${x.p.on} • ` : ""}{x.p.dom || "—"}</div><b style={{ fontSize: 15, color: NAVY, display: "block", lineHeight: 1.5 }}>{x.p.t}</b></div></div>
    {x.p.ind && <div style={{ fontSize: 12.5, fontWeight: 700, color: "#475569", lineHeight: 1.7 }}>📏 {x.p.ind}</div>}
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}><StB k={x.C.st} />{x.p.tg && <span className="op-lv" style={{ background: "#fef3c7", color: "#92400e" }}>🎯 {x.p.tg}{x.p.act ? ` ← ${x.p.act}` : ""}</span>}{x.C.pn > 0 && <span className="op-lv" style={{ background: "#eef2ff", color: "#3730a3" }}>🛠️ {ar(x.C.dn)}/{ar(x.C.pn)}</span>}{x.C.nImg > 0 && <span className="op-lv" style={{ background: "#ecfeff", color: "#0e7490" }}>📸 {ar(x.C.nImg)}</span>}</div>
    <div style={{ fontSize: 12, fontWeight: 800, color: "#64748b" }}>👤 {x.p.ex || "لم يُحدد المنفذ"}{x.p.to ? ` • ينتهي ${hijS(x.p.to)}` : ""}</div></button>; };

  const dash = () => <div style={{ display: "grid", gap: 12 }}>
    <div className="op-hero"><div style={{ position: "relative", zIndex: 1, display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
      <Ring v={avg} size={96} c={GOLD} /><div style={{ flex: "1 1 240px" }}><div style={{ fontSize: 12.5, opacity: .85, fontWeight: 800 }}>🎯 الخطة التشغيلية — {cfg.year}</div><b style={{ fontSize: 24 }}>نسبة الإنجاز العامة {ar(avg)}٪</b><div style={{ fontSize: 13, fontWeight: 700, opacity: .9 }}>{ar(L.length)} برنامجاً في {ar(doms.length)} مجالات</div></div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><button className="op-btn g" disabled={!L.length || busy === "print"} onClick={() => print(CL.map(x => x.p), "جميع البرامج")}>{busy === "print" ? "⏳ جارٍ التجهيز…" : "🖨️ التقرير الفاخر"}</button><button className="op-btn" onClick={() => setEd({})}>➕ برنامج</button></div></div></div>
    {!L.length ? <div className="op-card" style={{ textAlign: "center", display: "grid", gap: 10, justifyItems: "center" }}><div style={{ fontSize: 44 }}>🗂️</div><b style={{ fontSize: 16 }}>لم تُضف برامج الخطة بعد</b><div className="op-note">برامج خطة المدرسة المعتمدة جاهزة: ٢٦ برنامجاً بأهدافها ومؤشراتها ومسؤوليها وإجراءاتها وتواريخها.</div><div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>{seedN > 0 && <button className="op-btn g" disabled={busy === "seed"} onClick={loadSeed}>{busy === "seed" ? "⏳" : `⭐ تحميل برامج الخطة التشغيلية ١٤٤٨هـ (${ar(seedN)})`}</button>}<button className="op-btn p" onClick={() => setImp(true)}>📥 استيراد من جدول الخطة</button><button className="op-btn" onClick={() => setEd({})}>➕ إضافة يدوية</button></div></div> : <>
      <div className="op-kpis">{Object.entries(OP_ST).map(([k, S]) => <div key={k} className="op-kpi" style={{ background: S.bg, borderColor: S.bg, cursor: "pointer" }} onClick={() => { setF({ ...f, st: k }); setTab("list"); }}><b style={{ color: S.c }}>{ar(cnt(k))}</b><small style={{ color: S.c }}>{S.ic} {S.t}</small></div>)}</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 12 }}>
        <div className="op-card"><b style={{ color: NAVY }}>🧭 الإنجاز حسب المجال</b><div style={{ display: "grid", gap: 9, marginTop: 10 }}>{(doms.length ? doms : ["—"]).map(d => { const X = CL.filter(x => (x.p.dom || "—") === d || (!doms.length)); const v = X.length ? Math.round(X.reduce((a, x) => a + x.C.prog, 0) / X.length) : 0; return <div key={d} style={{ display: "grid", gridTemplateColumns: "minmax(0,170px) 1fr 44px", gap: 8, alignItems: "center", fontSize: 13, fontWeight: 800, cursor: "pointer" }} onClick={() => { setF({ ...f, dom: d === "—" ? "" : d }); setTab("list"); }}><span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d} ({ar(X.length)})</span><div className="op-bar"><i style={{ width: v + "%" }} /></div><b>{ar(v)}٪</b></div>; })}</div></div>
        <div className="op-card"><b style={{ color: "#dc2626" }}>⚠️ برامج متأخرة أو لم تبدأ</b>{(() => { const X = CL.filter(x => x.C.st === "late" || x.C.st === "wait").slice(0, 8); return !X.length ? <div className="op-note" style={{ marginTop: 8 }}>✅ لا توجد برامج متأخرة</div> : <div style={{ display: "grid", gap: 6, marginTop: 8 }}>{X.map(x => <div key={x.p.id} style={{ display: "flex", gap: 8, alignItems: "center", cursor: "pointer", padding: "6px 8px", borderRadius: 10, background: OP_ST[x.C.st].bg }} onClick={() => setEd(x.p)}><b style={{ flex: 1, fontSize: 13 }}>{x.p.t}</b><span style={{ fontSize: 12, fontWeight: 800, color: "#64748b" }}>{x.p.ex || ""}</span><StB k={x.C.st} /></div>)}</div>; })()}</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(290px,1fr))", gap: 10 }}>{CL.slice().sort((a, b) => b.p.up - a.p.up).slice(0, 6).map(x => <Card key={x.p.id} x={x} />)}</div>
    </>}
  </div>;

  const list = () => <div style={{ display: "grid", gap: 10 }}>
    <div className="op-card" style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
      <select className="op-inp" style={{ width: 180 }} value={f.dom} onChange={e => setF({ ...f, dom: e.target.value })}><option value="">جميع المجالات</option>{doms.map(d => <option key={d}>{d}</option>)}</select>
      <select className="op-inp" style={{ width: 150 }} value={f.st} onChange={e => setF({ ...f, st: e.target.value })}><option value="">جميع الحالات</option>{Object.entries(OP_ST).map(([k, S]) => <option key={k} value={k}>{S.t}</option>)}</select>
      <select className="op-inp" style={{ width: 170 }} value={f.ex} onChange={e => setF({ ...f, ex: e.target.value })}><option value="">جميع المنفذين</option>{exs.map(d => <option key={d}>{d}</option>)}</select>
      <input className="op-inp" style={{ flex: "1 1 160px", width: "auto" }} placeholder="🔎 بحث" value={f.q} onChange={e => setF({ ...f, q: e.target.value })} />
      <button className="op-btn sm p" onClick={() => setEd({ dom: f.dom })}>➕ برنامج</button><button className="op-btn sm" onClick={() => setImp(true)}>📥 استيراد</button>{seedN > 0 && <button className="op-btn sm ok" disabled={busy === "seed"} onClick={loadSeed}>⭐ برامج الخطة ({ar(seedN)})</button>}
      <button className="op-btn sm g" disabled={!FL.length || busy === "print"} onClick={() => print(FL.map(x => x.p), f.dom || (f.st ? OP_ST[f.st].t : f.ex ? `برامج ${f.ex}` : "جميع البرامج"))}>{busy === "print" ? "⏳" : `🖨️ تقرير المعروض (${ar(FL.length)})`}</button>
      <button className="op-btn sm p" disabled={!FL.length || busy === "pro"} onClick={() => pros(FL.map(x => x.p))}>{busy === "pro" ? "⏳" : `📘 تقرير احترافي لكل برنامج (${ar(FL.length)})`}</button>
      <button className="op-btn sm p" disabled={!FL.length || busy === "sheet"} onClick={() => sheets(FL.map(x => x.p))}>{busy === "sheet" ? "⏳" : `📄 ورقة لكل برنامج (${ar(FL.length)})`}</button></div>
    <div className="op-card" style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center", padding: 10 }}><b style={{ fontSize: 13 }}>خيارات التقرير:</b><label style={{ fontWeight: 800, fontSize: 13 }}><input type="checkbox" checked={ro.imgs} onChange={e => setRo({ ...ro, imgs: e.target.checked })} /> تضمين الصور</label><label style={{ fontWeight: 800, fontSize: 13 }}><input type="checkbox" checked={ro.cover} onChange={e => setRo({ ...ro, cover: e.target.checked })} /> صفحة غلاف</label></div>
    {!FL.length ? <div className="op-card" style={{ textAlign: "center", fontWeight: 800, color: "#64748b" }}>لا توجد برامج مطابقة</div> :
      doms.concat(FL.some(x => !x.p.dom) ? [""] : []).filter(d => FL.some(x => (x.p.dom || "") === d)).map(d => <div key={d || "-"} style={{ display: "grid", gap: 8 }}><b style={{ color: GOLD2, fontSize: 15 }}>◆ {d || "بدون مجال"}</b><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(290px,1fr))", gap: 10 }}>{FL.filter(x => (x.p.dom || "") === d).map(x => <Card key={x.p.id} x={x} />)}</div></div>)}
  </div>;

  const doc = () => <div style={{ display: "grid", gap: 10 }}>
    <div className="op-card" style={{ display: "grid", gap: 8 }}><b style={{ color: NAVY }}>📄 وثيقة الخطة التشغيلية</b><div className="op-note">اختر تعميم الخطة من «التعاميم» لتُعرض هنا بصفحاتها للمدير والوكلاء.</div>
      {!circs ? <div className="op-note">⏳</div> : <select className="op-inp" value={cfg.cid || ""} onChange={e => saveCfg({ cid: e.target.value })}><option value="">— اختر التعميم —</option>{circs.map(c => <option key={c.id} value={c.id}>{c.keep ? "📌 " : ""}{c.title}</option>)}</select>}</div>
    {cfg.cid && api.PlanDoc ? <api.PlanDoc cid={cfg.cid} /> : null}
  </div>;

  const set = () => <div className="op-card" style={{ display: "grid", gap: 10, maxWidth: 640 }}><b style={{ color: NAVY }}>⚙️ إعدادات التقرير</b>
    <label className="op-lbl">عنوان التقرير<input className="op-inp" value={cfg.title || ""} onChange={e => setCfg({ ...cfg, title: e.target.value })} /></label>
    <label className="op-lbl">العام الدراسي<input className="op-inp" value={cfg.year || ""} onChange={e => setCfg({ ...cfg, year: e.target.value })} /></label>
    <button className="op-btn p" style={{ justifySelf: "start" }} onClick={async () => { await saveCfg({}); say("✅ حُفظت الإعدادات"); }}>💾 حفظ</button></div>;

  return <div className="op" style={{ display: "grid", gap: 12 }}><style>{CSS}</style>
    <div className="op-tabs">{[["dash", "📊 لوحة المتابعة"], ["list", `📋 البرامج (${ar(L.length)})`], ["doc", "📄 وثيقة الخطة"], ["set", "⚙️ الإعدادات"]].map(([k, l]) => <button key={k} className={`op-tab ${tab === k ? "on" : ""}`} onClick={() => setTab(k)}>{l}</button>)}</div>
    {tab === "dash" && dash()}{tab === "list" && list()}{tab === "doc" && doc()}{tab === "set" && set()}
    {ed && <Editor api={api} init={ed} people={people} doms={doms} by={by} onClose={() => setEd(null)} onDel={del} onPrint={p => sheets([p])} onPro={p => pros([p])} onSaved={() => { setEd(null); say("✅ تم الحفظ"); load(); }} />}
    {imp && <Importer api={{ ...api, by }} onClose={() => setImp(false)} onDone={n => { setImp(false); say(`✅ استُورد ${ar(n)} برنامج`); load(); setTab("list"); }} />}
    {toast && <div style={{ position: "fixed", bottom: 18, left: "50%", transform: "translateX(-50%)", background: NAVY, color: "#fff", padding: "10px 18px", borderRadius: 14, fontWeight: 800, zIndex: 999 }}>{toast}</div>}
  </div>;
}
