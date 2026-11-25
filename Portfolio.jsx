// ══════════════════════════════════════════════════════════════════
// 🏅 ملف الأداء الوظيفي للمعلم — 11 عنصرًا، لكل عنصر حتى 6 شواهد مصورة
// لكل شاهد: صورة + تعليق المعلم + الشاهد الذي يحققه • تغذية راجعة من الزملاء والإدارة • لوحة متابعة • طباعة ملف إنجاز
// قاعدة البيانات (خفيفة): school-pf/{tk} نصوص فقط • school-pf-th/{tk}/{d}/{id} صورة مصغرة • school-pf-img/{tk}/{d}/{id} الصورة الكاملة
//                       school-pf-fb/{tk}/{d}/{id} التغذية الراجعة • school-pf-ix/{tk} فهرس صغير للوحة المتابعة
// ══════════════════════════════════════════════════════════════════
import React, { useState, useEffect, useRef } from "react";

const N = { P: "school-pf", TH: "school-pf-th", IM: "school-pf-img", FB: "school-pf-fb", IX: "school-pf-ix" };
const NAVY = "#0b2545", GOLD = "#c9a227", MAXP = 6;
const ar = n => String(n ?? "").replace(/\d/g, x => "٠١٢٣٤٥٦٧٨٩"[x]);
const esc = t => String(t ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const obj = v => (v && typeof v === "object" ? v : {});
const tkOf = n => String(n || "").trim().replace(/\s+/g, "_").replace(/[.#$\[\]\/]/g, "");
const nid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const when = t => { try { return new Date(t).toLocaleDateString("ar-SA-u-ca-islamic-umalqura", { day: "numeric", month: "long" }); } catch { return ""; } };
const shrink = (file, max, q) => new Promise((res, rej) => {
  if (!file || !/^image\//.test(file.type)) return rej(new Error("type"));
  const u = URL.createObjectURL(file), im = new Image();
  im.onload = () => { const k = Math.min(1, max / Math.max(im.width, im.height)); const c = document.createElement("canvas"); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k); const g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height); g.drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(u); res(c.toDataURL("image/jpeg", q)); };
  im.onerror = () => { URL.revokeObjectURL(u); rej(new Error("img")); }; im.src = u;
});
const countOf = rec => { const n = {}; let tot = 0; for (const [d, v] of Object.entries(obj(obj(rec).d))) { const c = Object.keys(obj(obj(v).ev)).length; n[d] = c; tot += c; } return { n, tot }; };

const CSS = `
.pf{direction:rtl;font-family:inherit;color:#0f172a}
.pf-tabs{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px}
.pf-tab{border:1px solid #dbe2ea;background:#fff;border-radius:999px;padding:8px 16px;font-weight:800;cursor:pointer}
.pf-tab.on{background:${NAVY};color:#fff;border-color:${NAVY}}
.pf-hero{background:linear-gradient(135deg,${NAVY},#13315c);color:#fff;border-radius:20px;padding:20px;display:flex;gap:18px;align-items:center;flex-wrap:wrap;border-bottom:4px solid ${GOLD}}
.pf-hero h2{margin:0;font-size:24px}.pf-hero p{margin:4px 0 0;opacity:.85;font-size:14px}
.pf-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:12px;margin-top:14px;align-items:start}
.pf-card{background:#fff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(15,23,42,.05)}
.pf-ch{display:flex;align-items:center;gap:10px;padding:12px 14px;cursor:pointer;border-inline-start:6px solid var(--c)}
.pf-ic{width:42px;height:42px;border-radius:12px;display:grid;place-items:center;font-size:22px;background:var(--bg);flex:none}
.pf-ch b{font-size:15.5px;display:block}.pf-ch small{color:#64748b;font-size:12px}
.pf-cnt{margin-inline-start:auto;font-weight:900;font-size:14px;padding:4px 10px;border-radius:999px;background:#f1f5f9;flex:none}
.pf-cnt.full{background:#dcfce7;color:#166534}
.pf-bar{height:6px;background:#f1f5f9}.pf-bar i{display:block;height:100%;background:var(--c)}
.pf-body{padding:12px 14px;border-top:1px solid #eef2f6}
.pf-dets{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 10px}
.pf-det{font-size:12.5px;padding:5px 10px;border-radius:999px;border:1px dashed #cbd5e1;color:#475569}
.pf-det.ok{border:1px solid #16a34a;background:#f0fdf4;color:#166534;font-weight:800}
.pf-ph{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px}
.pf-ev{border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;background:#f8fafc;display:flex;flex-direction:column}
.pf-ev img{width:100%;aspect-ratio:4/3;object-fit:cover;cursor:zoom-in;background:#e2e8f0;display:block}
.pf-ev .pf-ld{width:100%;aspect-ratio:4/3;display:grid;place-items:center;color:#94a3b8;font-size:12px;background:#eef2f6}
.pf-ev textarea,.pf-ev select{font:inherit;font-size:13px;border:0;border-top:1px solid #e2e8f0;padding:6px 8px;background:#fff;width:100%;resize:vertical}
.pf-ev .pf-cap{font-size:13px;padding:6px 8px;line-height:1.5}
.pf-ev .pf-tag{font-size:11.5px;color:#166534;padding:0 8px 6px}
.pf-add{border:2px dashed #cbd5e1;border-radius:12px;display:grid;place-items:center;min-height:150px;cursor:pointer;color:#475569;font-weight:800;text-align:center;padding:10px}
.pf-btn{border:1px solid #dbe2ea;background:#fff;border-radius:10px;padding:7px 12px;font-weight:800;cursor:pointer;font:inherit}
.pf-btn.p{background:${NAVY};color:#fff;border-color:${NAVY}}.pf-btn.g{background:${GOLD};color:#1b1404;border-color:${GOLD}}.pf-btn.d{color:#b91c1c}
.pf-fb{margin-top:12px;background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:10px}
.pf-fb h4{margin:0 0 6px;font-size:14px}
.pf-fbi{background:#fff;border-radius:10px;padding:8px 10px;margin-top:6px;font-size:13.5px;line-height:1.6}
.pf-fbi .r{margin-top:6px;padding:6px 8px;border-radius:8px;background:#eff6ff;font-size:13px}
.pf-row{display:flex;gap:6px;margin-top:8px}.pf-row textarea{flex:1;font:inherit;font-size:13.5px;border:1px solid #e2e8f0;border-radius:10px;padding:6px 8px;min-height:40px}
.pf-tbl{width:100%;border-collapse:collapse;background:#fff;border-radius:14px;overflow:hidden;font-size:13px}
.pf-tbl th{background:${NAVY};color:#fff;padding:8px 4px;font-weight:800}.pf-tbl td{border-top:1px solid #eef2f6;padding:6px 4px;text-align:center}
.pf-tbl td.nm{text-align:start;font-weight:800;padding-inline-start:10px;white-space:nowrap}
.pf-h{display:inline-block;min-width:26px;border-radius:6px;padding:3px 0;font-weight:900}
.pf-k{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin:12px 0}
.pf-k div{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:10px 12px}.pf-k span{font-size:12px;color:#64748b}.pf-k b{display:block;font-size:26px;color:${NAVY}}
.pf-lb{position:fixed;inset:0;background:rgba(2,6,23,.85);z-index:9999;display:grid;place-items:center;padding:14px}
.pf-lb img{max-width:100%;max-height:82vh;border-radius:12px}.pf-lb p{color:#fff;text-align:center;max-width:700px}
.pf-people{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:10px}
.pf-person{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:12px;cursor:pointer;display:flex;gap:10px;align-items:center}
.pf-msg{padding:8px 12px;border-radius:10px;background:#ecfdf5;color:#065f46;font-weight:800;margin:8px 0}
`;

// ── تحليلات نتائج الطلاب (مشتركة بين لوحة المعلم ومركز القيادة)
const nrmA = s => String(s || "").replace(/[ً-ْـ]/g, "").replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي").replace(/\s*\(.*?\)\s*/g, " ").replace(/^ال/, "").trim();
const sameName = (a, b) => { const x = nrmA(a).split(/\s+/).filter(Boolean), y = nrmA(b).split(/\s+/).filter(Boolean); if (!x.length || !y.length) return false; if (x.join(" ") === y.join(" ")) return true; return x[0] === y[0] && (x[x.length - 1] === y[y.length - 1] || x.slice(1).some(w => y.slice(1).includes(w))); };
const sameSub = (a, b) => { const x = nrmA(a).replace(/^ال/, ""), y = nrmA(b).replace(/^ال/, ""); return !!x && !!y && (x === y || x.includes(y) || y.includes(x)); };
const isFirst = r => r.type === "اختبار فترة" && (!r.title || !/(ثاني|الثانيه|2|٢)/.test(r.title));
const isDiag = r => r.type === "تشخيصي";
const avgA = L => { const a = L.filter(x => x != null && isFinite(x)); return a.length ? a.reduce((s, x) => s + x, 0) / a.length : null; };
function stuAgg(recs) { const S = {}; recs.forEach(r => { const mx = +r.max || 0; if (!mx) return; Object.entries(obj(r.marks)).forEach(([sid, v]) => { if (v === "غ" || v === "" || v == null || !isFinite(+v)) return; const k = r.ck + "|" + sid; const s = S[k] || (S[k] = { sid, ck: r.ck, name: obj(r.names)[sid] || sid, L: [], subj: {} }); const p = +v / mx * 100; s.L.push({ p, r }); (s.subj[r.subj] = s.subj[r.subj] || []).push(p); }); });
  return Object.values(S).map(s => ({ ...s, avg: avgA(s.L.map(x => x.p)), low: Object.entries(s.subj).map(([k, v]) => [k, avgA(v)]).sort((a, b) => a[1] - b[1]) })); }

function Insight({ api, me, onGoPf }) {
  const [D0, setD0] = useState(null), [ty, setTy] = useState("first"), [sel, setSel] = useState({}), [msg, setMsg] = useState(""), [rec, setRec] = useState(null);
  useEffect(() => { (async () => { const [g, T, pf] = await Promise.all([api.maGet("school-grades"), api.tt ? api.tt().catch(() => null) : null, api.maGet(`${N.P}/${tkOf(me.name)}`)]); setRec({ d: {}, ...obj(pf) });
    const pairs = []; if (T && T.C && api.ttFind) { const ti = api.ttFind(T, me.name); if (ti >= 0) Object.entries(T.C).forEach(([k, days]) => (days || []).forEach(row => (row || []).forEach(c => { if (Array.isArray(c) && c[1] === ti && T.S[c[0]] && !/احتياط|نشاط/.test(T.S[c[0]]) && !pairs.some(x => x.ck === k && x.s === T.S[c[0]])) pairs.push({ ck: k, s: T.S[c[0]] }); }))); }
    const all = Object.values(obj(g)).filter(r => r && r.ck && r.marks);
    const mine = all.filter(r => sameName(r.teacher || r.by, me.name) || pairs.some(x => x.ck === r.ck && sameSub(x.s, r.subj)));
    setD0({ mine, pairs }); })(); }, []);
  if (!D0) return <div style={{ padding: 20 }}>⏳ جارٍ تجميع نتائج طلابك...</div>;
  const recs = D0.mine.filter(r => ty === "first" ? isFirst(r) : ty === "diag" ? isDiag(r) : true), S = stuAgg(recs).filter(s => s.avg != null);
  const cls = ck => api.className ? api.className(ck) : ck, lim = ty === "diag" ? 50 : 60;
  const weak = S.filter(s => s.avg < lim).sort((a, b) => a.avg - b.avg), best = S.slice().sort((a, b) => b.avg - a.avg).slice(0, 10), weak10 = S.slice().sort((a, b) => a.avg - b.avg).slice(0, 10);
  const byC = {}; recs.forEach(r => { const k = r.ck + "|" + r.subj; (byC[k] = byC[k] || { ck: r.ck, s: r.subj, L: [] }).L.push(r); });
  const CR = Object.values(byC).map(c => { const A = stuAgg(c.L); return { ...c, n: A.length, avg: avgA(A.map(s => s.avg)), w: A.filter(s => s.avg < lim).length }; }).sort((a, b) => String(a.ck).localeCompare(String(b.ck)));
  const { n: pn, tot } = countOf(rec || {}), missing = api.D.filter(d => (pn[d.id] || 0) < MAXP), max = api.D.length * MAXP;
  const say = t => { setMsg(t); setTimeout(() => setMsg(""), 4000); };
  const plan = async () => { const ids = Object.keys(sel).filter(k => sel[k]); const L = (ids.length ? weak.filter(s => ids.includes(s.ck + "|" + s.sid)) : weak); if (!L.length) { say("لا يوجد طلاب لاقتراح برنامج لهم"); return; }
    const groups = {}; L.forEach(s => { const sub = (s.low[0] || ["عام"])[0]; const k = s.ck + "|" + sub; (groups[k] = groups[k] || { ck: s.ck, sub, sids: [] }).sids.push(s.sid); });
    const today = new Date(), dk = d => d.toISOString().slice(0, 10); let n = 0;
    for (const g of Object.values(groups)) { const id = nid(); await api.maPut(`school-cmd-iv/${id}`, { id, title: `برنامج علاجي — ${g.sub} — ${cls(g.ck)}`, sk: "", sids: g.sids, owner: me.name, start: dk(today), due: dk(new Date(Date.now() + 28 * 864e5)), st: "plan", note: `مقترح من لوحة المعلم بناءً على ${ty === "diag" ? "الاختبار التشخيصي" : ty === "first" ? "اختبار الفترة الأولى" : "نتائج الاختبارات"} (أقل من ${lim}٪)`, by: me.name, at: Date.now(), up: Date.now() }); n++; }
    setSel({}); say(`أُنشئت ${ar(n)} خطة علاجية، وتظهر في «خطط التدخل» بمركز القيادة لمتابعة أثرها.`); };
  const Row = ({ s, chk }) => <tr><td>{chk && <input type="checkbox" checked={!!sel[s.ck + "|" + s.sid]} onChange={e => setSel(x => ({ ...x, [s.ck + "|" + s.sid]: e.target.checked }))} />}</td><td className="nm">{s.name}</td><td>{cls(s.ck)}</td><td><span className="pf-h" style={{ background: s.avg >= 85 ? "#16a34a" : s.avg >= lim ? "#bbf7d0" : s.avg >= 40 ? "#fde68a" : "#fecaca", color: s.avg >= 85 ? "#fff" : "#0f172a", padding: "3px 8px" }}>{ar(Math.round(s.avg))}٪</span></td><td style={{ fontSize: 12 }}>{s.low.slice(0, 2).map(([k, v]) => `${k} ${ar(Math.round(v))}٪`).join("، ")}</td></tr>;
  return <div>
    <div className="pf-hero"><Ring v={tot} max={max} light /><div style={{ flex: "1 1 260px" }}><h2>لوحتي</h2><p>أ/ {me.name} • {D0.pairs.length ? `أدرّس ${ar(D0.pairs.length)} فصلًا-مادة` : "لم أُطابق في الجدول المدرسي"} • ملف الأداء {ar(tot)} من {ar(max)} شاهدًا</p></div>
      {missing.length > 0 && <button className="pf-btn g" onClick={onGoPf}>استكمال ملف الأداء ({ar(missing.length)} عناصر ناقصة)</button>}</div>
    {msg && <div className="pf-msg">{msg}</div>}
    {missing.length > 0 && <div className="pf-fb" style={{ marginTop: 12 }}><h4>📌 لاستكمال ملف الأداء الوظيفي</h4><div className="pf-dets">{missing.map(d => <span key={d.id} className="pf-det">{d.icon} {d.title}: {ar(pn[d.id] || 0)}/{ar(MAXP)}</span>)}</div></div>}
    <div className="pf-tabs" style={{ marginTop: 14 }}>{[["first", "📝 الفترة الأولى"], ["diag", "🩺 الاختبارات التشخيصية"], ["all", "📊 كل الاختبارات"]].map(([k, l]) => <button key={k} className={"pf-tab" + (ty === k ? " on" : "")} onClick={() => { setTy(k); setSel({}); }}>{l}</button>)}</div>
    {!recs.length ? <div className="pf-card" style={{ padding: 16, color: "#64748b" }}>لا توجد درجات {ty === "first" ? "لاختبار الفترة الأولى" : ty === "diag" ? "لاختبارات تشخيصية" : ""} لطلابك في «رصد الدرجات» بعد. تُعرض هنا تلقائيًا عند رصدها باسمك أو لفصولك ومادتك.</div> : <>
      <div className="pf-k"><div><span>طلاب مقيَّمون</span><b>{ar(S.length)}</b></div><div><span>متوسط الأداء</span><b>{ar(Math.round(avgA(S.map(s => s.avg)) || 0))}٪</b></div><div><span>يُقترح لهم برنامج علاجي</span><b style={{ color: "#b91c1c" }}>{ar(weak.length)}</b></div><div><span>متميزون (٩٠٪ فأكثر)</span><b style={{ color: "#15803d" }}>{ar(S.filter(s => s.avg >= 90).length)}</b></div></div>
      <div className="pf-card" style={{ padding: 12, overflowX: "auto" }}><b>فصولي</b><table className="pf-tbl" style={{ marginTop: 8 }}><thead><tr><th>الفصل</th><th>المادة</th><th>الطلاب</th><th>المتوسط</th><th>دون {ar(lim)}٪</th></tr></thead><tbody>{CR.map(c => <tr key={c.ck + c.s}><td className="nm">{cls(c.ck)}</td><td>{c.s}</td><td>{ar(c.n)}</td><td><b>{ar(Math.round(c.avg || 0))}٪</b></td><td style={{ color: c.w ? "#b91c1c" : "#15803d", fontWeight: 800 }}>{ar(c.w)}</td></tr>)}</tbody></table></div>
      <div className="pf-grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(340px,1fr))" }}>
        <div className="pf-card" style={{ padding: 12, overflowX: "auto" }}><b>🔻 أضعف الطلاب</b><table className="pf-tbl" style={{ marginTop: 8 }}><thead><tr><th></th><th>الطالب</th><th>الفصل</th><th>النسبة</th><th>الأضعف في</th></tr></thead><tbody>{weak10.map(s => <Row key={s.ck + s.sid} s={s} chk={s.avg < lim} />)}</tbody></table>
          <div className="pf-row" style={{ alignItems: "center" }}><button className="pf-btn p" onClick={plan}>اقتراح برنامج علاجي {Object.values(sel).some(Boolean) ? "للمحددين" : `لكل من هم دون ${ar(lim)}٪ (${ar(weak.length)})`}</button></div>
          <p style={{ fontSize: 12, color: "#64748b" }}>يُنشئ خطة علاجية لكل فصل ومادة الأضعف، وتظهر في «خطط التدخل» بمركز القيادة ليُقاس أثرها.</p></div>
        <div className="pf-card" style={{ padding: 12, overflowX: "auto" }}><b>⭐ أفضل الطلاب</b><table className="pf-tbl" style={{ marginTop: 8 }}><thead><tr><th></th><th>الطالب</th><th>الفصل</th><th>النسبة</th><th>المواد</th></tr></thead><tbody>{best.map(s => <Row key={s.ck + s.sid} s={s} />)}</tbody></table></div>
      </div>
      {weak.length > 10 && <details className="pf-card" style={{ padding: 12, marginTop: 12 }}><summary><b>كل من يُقترح لهم برنامج علاجي ({ar(weak.length)})</b></summary><table className="pf-tbl" style={{ marginTop: 8 }}><tbody>{weak.map(s => <Row key={s.ck + s.sid} s={s} chk />)}</tbody></table></details>}
    </>}
  </div>;
}

function Ring({ v, max, size = 92, light }) {
  const p = max ? Math.min(1, v / max) : 0, r = size / 2 - 8, C = 2 * Math.PI * r;
  return <svg width={size} height={size} style={{ flex: "none" }}><circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={light ? "rgba(255,255,255,.18)" : "#e2e8f0"} strokeWidth="9" /><circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={GOLD} strokeWidth="9" strokeLinecap="round" strokeDasharray={`${C * p} ${C}`} transform={`rotate(-90 ${size / 2} ${size / 2})`} /><text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" fill={light ? "#fff" : NAVY} fontWeight="900" fontSize={size / 4.2}>{ar(Math.round(p * 100))}٪</text></svg>;
}

async function saveIndex(api, tk, name, rec) {
  const { n, tot } = countOf(rec); const prev = obj(await api.maGet(`${N.IX}/${tk}`));
  await api.maPut(`${N.IX}/${tk}`, { ...prev, name, n, tot, upd: Date.now() });
}

function DomainCard({ dom, rec, tk, name, own, canFb, me, api, onRec, say, open, setOpen }) {
  const ev = obj(obj(obj(rec.d)[dom.id]).ev), ids = Object.keys(ev).sort((a, b) => (ev[a].at || 0) - (ev[b].at || 0));
  const [th, setTh] = useState(null), [fb, setFb] = useState(null), [busy, setBusy] = useState(false), [lb, setLb] = useState(null), [fbT, setFbT] = useState(""), [rep, setRep] = useState({});
  const fileRef = useRef();
  useEffect(() => { if (!open) return; let a = true; (async () => { const [t, f] = await Promise.all([ids.length ? api.maGet(`${N.TH}/${tk}/${dom.id}`) : null, api.maGet(`${N.FB}/${tk}/${dom.id}`)]); if (a) { setTh(obj(t)); setFb(obj(f)); } })(); return () => { a = false; }; }, [open, tk]);
  const used = new Set(ids.map(i => ev[i].det).filter(x => x >= 0));
  const setEv = async (id, patch) => { const r = JSON.parse(JSON.stringify(rec)); r.d = obj(r.d); r.d[dom.id] = obj(r.d[dom.id]); r.d[dom.id].ev = obj(r.d[dom.id].ev); if (patch === null) delete r.d[dom.id].ev[id]; else r.d[dom.id].ev[id] = { ...obj(r.d[dom.id].ev[id]), ...patch }; r.name = name; r.upd = Date.now(); await api.maPut(`${N.P}/${tk}`, r); onRec(r); await saveIndex(api, tk, name, r); };
  const add = async files => {
    const room = MAXP - ids.length; const L = [...files].slice(0, room); if (!L.length) { say(`الحد ${ar(MAXP)} صور لكل عنصر`); return; }
    setBusy(true); const r = JSON.parse(JSON.stringify(rec)); r.d = obj(r.d); r.d[dom.id] = obj(r.d[dom.id]); r.d[dom.id].ev = obj(r.d[dom.id].ev); const nt = { ...obj(th) };
    let ok = 0;
    for (const f of L) { try { const [full, small] = await Promise.all([shrink(f, 1280, .78), shrink(f, 360, .7)]); const id = nid(); await api.maPut(`${N.IM}/${tk}/${dom.id}/${id}`, full); await api.maPut(`${N.TH}/${tk}/${dom.id}/${id}`, small); r.d[dom.id].ev[id] = { c: "", det: -1, at: Date.now() }; nt[id] = small; ok++; } catch (e) { } }
    r.name = name; r.upd = Date.now(); await api.maPut(`${N.P}/${tk}`, r); onRec(r); setTh(nt); await saveIndex(api, tk, name, r); setBusy(false);
    say(ok ? `رُفعت ${ok === 1 ? "صورة واحدة" : ok === 2 ? "صورتان" : ar(ok) + (ok <= 10 ? " صور" : " صورة")}` : "تعذّر رفع الصور. اختر صورًا من الجوال أو الجهاز.");
    if (L.length < files.length) say(`رُفع ${ar(L.length)} فقط من ${ar(files.length)}، لأن الحد ${ar(MAXP)} صور لكل عنصر`);
  };
  const del = async id => { if (!window.confirm("حذف هذا الشاهد وصورته؟")) return; await api.maPut(`${N.IM}/${tk}/${dom.id}/${id}`, null); await api.maPut(`${N.TH}/${tk}/${dom.id}/${id}`, null); const nt = { ...obj(th) }; delete nt[id]; setTh(nt); await setEv(id, null); };
  const showFull = async (id, i) => { setLb({ src: obj(th)[id], cap: ev[id].c, i }); const full = await api.maGet(`${N.IM}/${tk}/${dom.id}/${id}`); if (full) setLb(x => x && x.i === i ? { ...x, src: full } : x); };
  const sendFb = async () => { const t = fbT.trim(); if (!t) return; const id = nid(), v = { by: me.name || "زميل", t, at: Date.now() }; await api.maPut(`${N.FB}/${tk}/${dom.id}/${id}`, v); setFb(f => ({ ...obj(f), [id]: v })); setFbT(""); const prev = obj(await api.maGet(`${N.IX}/${tk}`)); await api.maPut(`${N.IX}/${tk}`, { ...prev, name, fb: (+prev.fb || 0) + 1 }); say("أُرسلت التغذية الراجعة"); };
  const sendRep = async id => { const t = (rep[id] || "").trim(); if (!t) return; const v = { ...fb[id], r: t, rat: Date.now() }; await api.maPut(`${N.FB}/${tk}/${dom.id}/${id}`, v); setFb(f => ({ ...f, [id]: v })); setRep(x => ({ ...x, [id]: "" })); };
  const delFb = async id => { if (!window.confirm("حذف هذه الملاحظة؟")) return; await api.maPut(`${N.FB}/${tk}/${dom.id}/${id}`, null); setFb(f => { const o = { ...f }; delete o[id]; return o; }); };
  const fbL = Object.entries(obj(fb)).sort((a, b) => (a[1].at || 0) - (b[1].at || 0));
  return (
    <div className="pf-card" style={{ "--c": dom.color, "--bg": dom.bg }}>
      <div className="pf-ch" onClick={() => setOpen(open ? null : dom.id)}>
        <div className="pf-ic">{dom.icon}</div>
        <div style={{ minWidth: 0 }}><b>{ar(dom.num)}. {dom.title}</b><small>الوزن {ar(dom.weight)} • {ar(used.size)} من {ar(dom.details.length)} شواهد محققة</small></div>
        <span className={"pf-cnt" + (ids.length >= MAXP ? " full" : "")}>{ar(ids.length)}/{ar(MAXP)}</span>
      </div>
      <div className="pf-bar"><i style={{ width: `${ids.length / MAXP * 100}%` }} /></div>
      {open && <div className="pf-body">
        <div style={{ fontSize: 12.5, color: "#64748b", marginBottom: 6 }}>شواهد التحقيق:</div>
        <div className="pf-dets">{dom.details.map((t, i) => <span key={i} className={"pf-det" + (used.has(i) ? " ok" : "")}>{used.has(i) ? "✓ " : ""}{t}</span>)}</div>
        <div className="pf-ph">
          {ids.map((id, i) => <div key={id} className="pf-ev">
            {th && th[id] ? <img src={th[id]} alt="" onClick={() => showFull(id, i)} /> : <div className="pf-ld">⏳</div>}
            {own ? <>
              <select value={ev[id].det ?? -1} onChange={e => setEv(id, { det: +e.target.value })}><option value={-1}>— أي شاهد تحققه الصورة؟ —</option>{dom.details.map((t, k) => <option key={k} value={k}>{t}</option>)}</select>
              <textarea defaultValue={ev[id].c || ""} placeholder="تعليقك على الشاهد" rows={2} onBlur={e => { if (e.target.value !== (ev[id].c || "")) setEv(id, { c: e.target.value }); }} />
              <button className="pf-btn d" style={{ borderRadius: 0, border: 0, borderTop: "1px solid #e2e8f0" }} onClick={() => del(id)}>حذف</button>
            </> : <>{ev[id].det >= 0 && <div className="pf-tag">✓ {dom.details[ev[id].det]}</div>}<div className="pf-cap">{ev[id].c || <span style={{ color: "#94a3b8" }}>بلا تعليق</span>}</div></>}
          </div>)}
          {own && ids.length < MAXP && <div className="pf-add" onClick={() => !busy && fileRef.current.click()}>{busy ? "⏳ جارٍ الضغط والرفع..." : <>＋<br />إضافة صور<br /><small style={{ fontWeight: 400 }}>متبقٍ {ar(MAXP - ids.length)}</small></>}<input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={e => { add(e.target.files); e.target.value = ""; }} /></div>}
          {!own && !ids.length && <div style={{ color: "#94a3b8", fontSize: 13 }}>لم تُرفع شواهد لهذا العنصر بعد.</div>}
        </div>
        <div className="pf-fb">
          <h4>💬 التغذية الراجعة {fbL.length ? `(${ar(fbL.length)})` : ""}</h4>
          {fb === null ? <div style={{ fontSize: 12 }}>⏳</div> : !fbL.length && <div style={{ fontSize: 12.5, color: "#92400e" }}>{own ? "لم يكتب زملاؤك ملاحظات بعد." : "كن أول من يكتب ملاحظة بنّاءة."}</div>}
          {fbL.map(([id, f]) => <div key={id} className="pf-fbi"><b>{f.by}</b> <span style={{ color: "#94a3b8", fontSize: 11.5 }}>{when(f.at)}</span>
            {(f.by === me.name || me.admin) && <button className="pf-btn d" style={{ float: "left", padding: "2px 8px", fontSize: 11 }} onClick={() => delFb(id)}>حذف</button>}
            <div>{f.t}</div>{f.r && <div className="r"><b>رد {name.split(" ")[0]}:</b> {f.r}</div>}
            {own && !f.r && <div className="pf-row"><textarea value={rep[id] || ""} onChange={e => setRep(x => ({ ...x, [id]: e.target.value }))} placeholder="ردك على الملاحظة" /><button className="pf-btn" onClick={() => sendRep(id)}>رد</button></div>}
          </div>)}
          {canFb && !own && <div className="pf-row"><textarea value={fbT} onChange={e => setFbT(e.target.value)} placeholder="ملاحظتك البنّاءة لزميلك على هذا العنصر" /><button className="pf-btn p" onClick={sendFb}>إرسال</button></div>}
        </div>
      </div>}
      {lb && <div className="pf-lb" onClick={() => setLb(null)}><div><img src={lb.src} alt="" /><p>{lb.cap}</p></div></div>}
    </div>
  );
}

function PFile({ tk, name, api, me, own, canFb, onBack }) {
  const [rec, setRec] = useState(null), [open, setOpen] = useState(null), [msg, setMsg] = useState(""), [pr, setPr] = useState(false);
  useEffect(() => { let a = true; setRec(null); api.maGet(`${N.P}/${tk}`).then(r => { if (a) setRec({ name, d: {}, ...obj(r) }); }); return () => { a = false; }; }, [tk]);
  const say = t => { setMsg(t); setTimeout(() => setMsg(""), 3500); };
  if (!rec) return <div style={{ padding: 20 }}>⏳ جارٍ تحميل الملف...</div>;
  const { n, tot } = countOf(rec), D = api.D, max = D.length * MAXP, doneD = D.filter(d => (n[d.id] || 0) > 0).length;
  return <div>
    {onBack && <button className="pf-btn" onClick={onBack} style={{ marginBottom: 10 }}>→ رجوع</button>}
    <div className="pf-hero">
      <Ring v={tot} max={max} light />
      <div style={{ flex: "1 1 240px" }}><h2>{own ? "ملف أدائي الوظيفي" : "ملف الأداء الوظيفي"}</h2><p>أ/ {name} • {ar(tot)} شاهدًا مصورًا من {ar(max)} • {ar(doneD)} من {ar(D.length)} عناصر موثقة{rec.upd ? ` • آخر تحديث ${when(rec.upd)}` : ""}</p></div>
      <button className="pf-btn g" disabled={pr} onClick={async () => { setPr(true); try { await printPF(api, tk, name, rec); } finally { setPr(false); } }}>{pr ? "⏳ يجهّز..." : "🖨 طباعة ملف الإنجاز"}</button>
    </div>
    {msg && <div className="pf-msg">{msg}</div>}
    {own && <p style={{ fontSize: 13, color: "#64748b", margin: "10px 2px 0" }}>افتح كل عنصر، وارفع حتى {ar(MAXP)} صور شواهد، واختر لكل صورة الشاهد الذي تحققه واكتب تعليقك. تُضغط الصور تلقائيًا قبل الرفع.</p>}
    <div className="pf-grid">{D.map(dom => <DomainCard key={dom.id} dom={dom} rec={rec} tk={tk} name={name} own={own} canFb={canFb} me={me} api={api} onRec={setRec} say={say} open={open === dom.id} setOpen={setOpen} />)}</div>
  </div>;
}

async function printPF(api, tk, name, rec) {
  const D = api.D, srcs = {}, fbs = {};
  await Promise.all(D.map(async d => { const ev = obj(obj(obj(rec.d)[d.id]).ev); if (Object.keys(ev).length) srcs[d.id] = obj(await api.maGet(`${N.IM}/${tk}/${d.id}`)); fbs[d.id] = obj(await api.maGet(`${N.FB}/${tk}/${d.id}`)); }));
  const { tot } = countOf(rec), max = D.length * MAXP;
  const cover = `<section class="pg cover"><div class="lg">${api.moeLogo ? `<img src="${api.moeLogo}">` : ""}${api.logo ? `<img src="${api.logo}">` : ""}</div><div class="ct"><div class="k">ملف الإنجاز</div><h1>الأداء الوظيفي</h1><h2>أ/ ${esc(name)}</h2><p>${esc(api.school || "")}</p><div class="st"><div><b>${ar(tot)}</b><span>شاهدًا مصورًا</span></div><div><b>${ar(D.filter(d => Object.keys(obj(obj(obj(rec.d)[d.id]).ev)).length).length)}/${ar(D.length)}</b><span>عناصر موثقة</span></div><div><b>${ar(Math.round(tot / max * 100))}٪</b><span>نسبة الاكتمال</span></div></div></div><ol class="toc">${D.map(d => `<li><span>${d.icon}</span>${esc(d.title)}<i>${ar(Object.keys(obj(obj(obj(rec.d)[d.id]).ev)).length)}/${ar(MAXP)}</i></li>`).join("")}</ol></section>`;
  const pages = D.map(d => { const ev = obj(obj(obj(rec.d)[d.id]).ev), ids = Object.keys(ev).sort((a, b) => (ev[a].at || 0) - (ev[b].at || 0)), used = new Set(ids.map(i => ev[i].det)), F = Object.values(fbs[d.id] || {});
    return `<section class="pg"><div class="hd" style="--c:${d.color}"><span class="ic">${d.icon}</span><div><small>العنصر ${ar(d.num)} • الوزن ${ar(d.weight)}</small><h3>${esc(d.title)}</h3></div><b>${ar(ids.length)}/${ar(MAXP)}</b></div>
      <div class="dets">${d.details.map((t, i) => `<span class="${used.has(i) ? "ok" : ""}">${used.has(i) ? "✓ " : "○ "}${esc(t)}</span>`).join("")}</div>
      <div class="ph">${ids.map((id, k) => `<figure><div class="im">${srcs[d.id] && srcs[d.id][id] ? `<img src="${srcs[d.id][id]}">` : ""}</div><figcaption><b>شاهد ${ar(k + 1)}${ev[id].det >= 0 ? ` — ${esc(d.details[ev[id].det])}` : ""}</b>${ev[id].c ? `<br>${esc(ev[id].c)}` : ""}</figcaption></figure>`).join("") || `<p class="no">لم تُرفع شواهد لهذا العنصر.</p>`}</div>
      ${F.length ? `<div class="fb"><b>💬 من التغذية الراجعة</b>${F.slice(0, 3).map(f => `<p>«${esc(f.t)}» — ${esc(f.by)}${f.r ? `<br><i>الرد: ${esc(f.r)}</i>` : ""}</p>`).join("")}</div>` : ""}</section>`; }).join("");
  const css = `@page{size:A4;margin:10mm}*{box-sizing:border-box}body{font-family:Tajawal,Cairo,sans-serif;color:#0f172a;margin:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .pg{page-break-after:always;min-height:270mm;padding:4mm}.cover{background:linear-gradient(160deg,${NAVY},#13315c 70%);color:#fff;border-radius:6mm;padding:12mm;display:flex;flex-direction:column}
  .cover .lg{display:flex;justify-content:space-between}.cover .lg img{height:60px;background:#fff;border-radius:10px;padding:4px}.cover .ct{text-align:center;margin:18mm 0 10mm}.cover .k{color:${GOLD};font-weight:800;letter-spacing:0;font-size:18px}
  .cover h1{font-size:46px;margin:6px 0}.cover h2{font-size:26px;margin:0;color:${GOLD}}.cover p{opacity:.85}.st{display:flex;justify-content:center;gap:14px;margin-top:10mm}.st div{border:1px solid rgba(255,255,255,.3);border-radius:14px;padding:10px 18px;min-width:120px}.st b{display:block;font-size:30px;color:${GOLD}}
  .toc{list-style:none;padding:0;margin:auto 0 0;display:grid;grid-template-columns:1fr 1fr;gap:6px}.toc li{background:rgba(255,255,255,.08);border-radius:10px;padding:8px 10px;display:flex;gap:8px;align-items:center}.toc i{margin-inline-start:auto;font-style:normal;color:${GOLD};font-weight:800}
  .hd{display:flex;gap:12px;align-items:center;border-bottom:4px solid ${GOLD};padding-bottom:8px;margin-bottom:10px}.hd .ic{width:54px;height:54px;border-radius:14px;background:var(--c);display:grid;place-items:center;font-size:28px}.hd h3{margin:2px 0;font-size:24px;color:${NAVY}}.hd small{color:#64748b}.hd>b{margin-inline-start:auto;font-size:22px;color:${NAVY}}
  .dets{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px}.dets span{font-size:12.5px;border:1px solid #cbd5e1;border-radius:999px;padding:4px 10px;color:#64748b}.dets span.ok{background:#f0fdf4;border-color:#16a34a;color:#166534;font-weight:800}
  .ph{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px}figure{margin:0;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;break-inside:avoid}.im{aspect-ratio:4/3;background:#f1f5f9}.im img{width:100%;height:100%;object-fit:cover;display:block}figcaption{font-size:11.5px;padding:6px 8px;line-height:1.5}
  .fb{margin-top:10px;background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:8px 12px;font-size:12.5px}.fb p{margin:4px 0}.no{color:#94a3b8}`;
  const html = `<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>ملف الأداء الوظيفي — ${esc(name)}</title><link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;800&display=swap" rel="stylesheet"><style>${css}</style></head><body>${cover}${pages}<script>setTimeout(()=>window.print(),900)<\/script></body></html>`;
  api.print(html);
}

function Dashboard({ api, onOpen }) {
  const [ix, setIx] = useState(null), [staff, setStaff] = useState([]), [q, setQ] = useState("");
  useEffect(() => { (async () => { const [a, s] = await Promise.all([api.maGet(N.IX), api.teachers ? api.teachers() : []]); setIx(obj(a)); setStaff(Array.isArray(s) ? s : []); })(); }, []);
  if (!ix) return <div style={{ padding: 20 }}>⏳</div>;
  const D = api.D, max = D.length * MAXP, rows = Object.entries(ix).map(([tk, v]) => ({ tk, name: v.name || tk, n: obj(v.n), tot: +v.tot || 0, fb: +v.fb || 0, upd: v.upd }));
  staff.forEach(nm => { nm = String(nm || "").replace(/\s*\(.*?\)\s*/g, " ").trim(); if (nm && !rows.some(r => r.tk === tkOf(nm) || r.name.split(" ")[0] === nm.split(" ")[0] && r.name.split(" ").slice(-1)[0] === nm.split(" ").slice(-1)[0])) rows.push({ tk: tkOf(nm), name: nm, n: {}, tot: 0, fb: 0 }); });
  rows.sort((a, b) => b.tot - a.tot);
  const L = rows.filter(r => !q || r.name.includes(q)), all = rows.reduce((a, r) => a + r.tot, 0), started = rows.filter(r => r.tot).length, full = rows.filter(r => D.every(d => (r.n[d.id] || 0) >= MAXP)).length;
  const hc = c => c >= MAXP ? ["#16a34a", "#fff"] : c >= 3 ? ["#bbf7d0", "#14532d"] : c > 0 ? ["#fef3c7", "#78350f"] : ["#f1f5f9", "#94a3b8"];
  return <div>
    <div className="pf-k"><div><span>المعلمون الذين بدؤوا</span><b>{ar(started)}/{ar(rows.length)}</b></div><div><span>ملفات مكتملة</span><b>{ar(full)}</b></div><div><span>الشواهد المرفوعة</span><b>{ar(all)}</b></div><div><span>نسبة الإنجاز العامة</span><b>{ar(rows.length ? Math.round(all / (rows.length * max) * 100) : 0)}٪</b></div></div>
    <input value={q} onChange={e => setQ(e.target.value)} placeholder="بحث باسم المعلم" style={{ font: "inherit", padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 10, marginBottom: 10, width: "min(320px,100%)" }} />
    <div style={{ overflowX: "auto" }}><table className="pf-tbl"><thead><tr><th>المعلم</th>{D.map(d => <th key={d.id} title={d.title}>{d.icon}<br />{ar(d.num)}</th>)}<th>الإنجاز</th><th>النواقص</th><th>💬</th><th></th></tr></thead><tbody>
      {L.map(r => <tr key={r.tk}><td className="nm">{r.name}</td>{D.map(d => { const c = r.n[d.id] || 0, [b, f] = hc(c); return <td key={d.id}><span className="pf-h" style={{ background: b, color: f }}>{ar(c)}</span></td>; })}<td><b>{ar(Math.round(r.tot / max * 100))}٪</b></td><td style={{ fontSize: 11.5, color: "#b45309", whiteSpace: "nowrap" }}>{(() => { const m = D.filter(d => (r.n[d.id] || 0) < MAXP); return m.length ? (m.length > 5 ? `${ar(m.length)} عناصر` : m.map(d => ar(d.num)).join("، ")) : "✓ مكتمل"; })()}</td><td>{ar(r.fb)}</td><td><button className="pf-btn p" onClick={() => onOpen(r)}>فتح</button></td></tr>)}
    </tbody></table></div>
    <p style={{ fontSize: 12, color: "#64748b" }}>الرقم في كل خانة: عدد الشواهد المصورة للعنصر من {ar(MAXP)}. الأخضر الداكن مكتمل.</p>
  </div>;
}

function People({ api, me, onOpen }) {
  const [ix, setIx] = useState(null);
  useEffect(() => { api.maGet(N.IX).then(a => setIx(obj(a))); }, []);
  if (!ix) return <div style={{ padding: 20 }}>⏳</div>;
  const max = api.D.length * MAXP, L = Object.entries(ix).map(([tk, v]) => ({ tk, name: v.name || tk, tot: +v.tot || 0 })).filter(r => r.tk !== tkOf(me.name) && r.tot > 0).sort((a, b) => b.tot - a.tot);
  if (!L.length) return <p style={{ color: "#64748b" }}>لم ينشر زملاؤك شواهد بعد.</p>;
  return <div className="pf-people">{L.map(r => <div key={r.tk} className="pf-person" onClick={() => onOpen(r)}><Ring v={r.tot} max={max} size={56} /><div><b>{r.name}</b><div style={{ fontSize: 12, color: "#64748b" }}>{ar(r.tot)} شاهدًا • اضغط للاطلاع والتعليق</div></div></div>)}</div>;
}

export function Portfolio({ me, api, admin, start }) {
  const isAdmin = admin || ["principal", "deputy"].includes(me && me.role);
  const [tab, setTab] = useState(isAdmin && admin ? "dash" : (start || "insight")), [view, setView] = useState(null);
  const M = { ...me, admin: isAdmin };
  return <div className="pf"><style>{CSS}</style>
    {!view && <div className="pf-tabs">
      {!admin && <button className={"pf-tab" + (tab === "insight" ? " on" : "")} onClick={() => setTab("insight")}>📈 لوحتي ونتائج طلابي</button>}
      {!admin && <button className={"pf-tab" + (tab === "mine" ? " on" : "")} onClick={() => setTab("mine")}>🏅 ملف أدائي</button>}
      <button className={"pf-tab" + (tab === "peers" ? " on" : "")} onClick={() => setTab("peers")}>👥 ملفات الزملاء</button>
      {isAdmin && <button className={"pf-tab" + (tab === "dash" ? " on" : "")} onClick={() => setTab("dash")}>📊 لوحة المتابعة</button>}
    </div>}
    {view ? <PFile tk={view.tk} name={view.name} api={api} me={M} own={view.tk === tkOf(me.name)} canFb onBack={() => setView(null)} />
      : tab === "insight" && !admin ? <Insight api={api} me={M} onGoPf={() => setTab("mine")} />
      : tab === "mine" && !admin ? <PFile tk={tkOf(me.name)} name={me.name} api={api} me={M} own canFb={false} />
      : tab === "peers" ? <People api={api} me={M} onOpen={setView} />
      : <Dashboard api={api} onOpen={setView} />}
  </div>;
}
