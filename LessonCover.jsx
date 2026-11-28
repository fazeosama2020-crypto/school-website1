import React, { useEffect, useMemo, useState } from "react";

// 🛡️ تأمين الحصص اليومية
// المعلم: يفتح جدوله، يختار اليوم ويضغط الحصة التي يريد تأمينها، فيرى المعلمين المتاحين (أصحاب الانتظار أولًا) ويرسل الطلب
// المعلم المؤمِّن: يصله الطلب فيوافق ويوقّع إلكترونيًا أو يعتذر
// الإدارة: ترى طلبات اليوم وتسجّل دخول المعلم للحصة في وقتها أو تأخره أو عدم دخوله، مع ملاحظات وطباعة
// school-lcover/{YYYY-MM-DD}/{id} = { id, dk, d, p, ck, s, fromT, from, toT, to, reason, st:"pend"|"ok"|"no"|"cancel", at, sig:{img,at,note}, decl, adm:{st:"in"|"late"|"no", mins, note, by, at} }
// school-lcover-in/{tk}/{dk_id} = { dk, id, st, at }  ← صندوق وارد المعلم المؤمِّن
const NODE = "school-lcover", INB = "school-lcover-in";
const DAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس"];
const ORD = ["الأولى", "الثانية", "الثالثة", "الرابعة", "الخامسة", "السادسة", "السابعة", "الثامنة"];
const ar = n => String(n).replace(/\d/g, d => "٠١٢٣٤٥٦٧٨٩"[d]);
const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const clsName = k => { const [g, s] = String(k).split("-"); return s ? `${g}م/${s}` : k; };
const pad = n => String(n).padStart(2, "0");
const dkOf = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fromDk = k => { const [y, m, d] = String(k).split("-").map(Number); return new Date(y, m - 1, d); };
const nextSchoolDay = (d0 = new Date()) => { const d = new Date(d0); while (d.getDay() > 4) d.setDate(d.getDate() + 1); return d; };
const dayLabel = k => { const d = fromDk(k); return `${DAYS[d.getDay()] || ""} ${d.toLocaleDateString("ar-SA-u-ca-islamic-umalqura", { day: "numeric", month: "long" })}`; };
const obj = v => (v && typeof v === "object" ? v : {});
const tkOf = n => String(n || "").trim().replace(/\s+/g, "_").replace(/[.#$\[\]\/]/g, "");
const ST = { pend: ["⏳ بانتظار الموافقة", "#92400e", "#fef3c7"], ok: ["✅ وافق ووقّع", "#15803d", "#dcfce7"], no: ["✋ اعتذر", "#991b1b", "#fee2e2"], cancel: ["⊘ أُلغي", "#475569", "#f1f5f9"] };
const ADM = { in: ["✅ دخل في الوقت", "#15803d", "#dcfce7"], late: ["⏰ تأخر", "#b45309", "#fef3c7"], no: ["❌ لم يدخل", "#991b1b", "#fee2e2"] };

const CSS = `.lc{direction:rtl;font-family:Tajawal,system-ui,sans-serif;color:#0f172a;display:grid;gap:12px}.lc>*{min-width:0}
.lc-hero{border-radius:22px;padding:16px 18px;color:#fff;background:linear-gradient(135deg,#0b2545,#13315c 60%,#8a6d1d);border-bottom:4px solid #c9a227;display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:space-between}
.lc-hero h2{margin:0;font-size:21px;font-weight:900}.lc-hero p{margin:3px 0 0;opacity:.88;font-size:13px;font-weight:700}
.lc-card{background:#fff;border:1px solid #e2e8f0;border-radius:18px;padding:12px;box-shadow:0 2px 10px rgba(15,23,42,.05)}
.lc-tabs{display:flex;gap:6px;flex-wrap:wrap}.lc-tabs button{font:inherit;font-weight:800;border-radius:999px;border:1px solid #cbd5e1;background:#fff;padding:8px 14px;cursor:pointer;color:#334155}.lc-tabs button.on{background:#0b2545;color:#fff;border-color:#0b2545}.lc-tabs i{font-style:normal;background:#dc2626;color:#fff;border-radius:999px;padding:0 7px;margin-inline-start:5px;font-size:12px}
.lc-btn{font:inherit;font-weight:800;border-radius:12px;border:1px solid #cbd5e1;background:#fff;color:#0b2545;padding:8px 14px;cursor:pointer}.lc-btn.p{background:#0b2545;color:#fff;border-color:#0b2545}.lc-btn.g{background:#c9a227;border-color:#c9a227;color:#0b2545}.lc-btn.r{color:#991b1b;border-color:#fca5a5}.lc-btn:disabled{opacity:.5;cursor:not-allowed}
.lc-inp{font:inherit;border:1px solid #cbd5e1;border-radius:12px;padding:8px 10px;background:#fff;width:100%;box-sizing:border-box}
.lc-days{display:flex;gap:6px;overflow-x:auto;padding-bottom:2px}.lc-days button{flex:none;font:inherit;font-weight:800;border-radius:14px;border:1px solid #cbd5e1;background:#fff;padding:6px 12px;cursor:pointer;color:#334155;text-align:center;line-height:1.3}.lc-days button small{display:block;font-size:11px;font-weight:700;color:#64748b}.lc-days button.on{background:#0b2545;color:#fff;border-color:#0b2545}.lc-days button.on small{color:#e2e8f0}
.lc-list{display:grid;gap:8px;margin-top:10px}.lc-row{display:grid;grid-template-columns:64px 1fr;gap:10px}
.lc-pn{border-radius:14px;background:#f1f5f9;display:flex;flex-direction:column;align-items:center;justify-content:center;font-weight:900;color:#0b2545;padding:6px 0}.lc-pn small{font-size:11px;font-weight:700;color:#64748b}
.lc-l{border-radius:14px;padding:10px 12px;border:2px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center;gap:8px;min-height:56px;background:#f8fafc;color:#94a3b8;font-weight:700}
.lc-l.ls{background:linear-gradient(135deg,#eff6ff,#fff);border-color:#93c5fd;color:#0f172a;cursor:pointer}.lc-l.ls:hover{border-color:#0b2545;box-shadow:0 4px 14px rgba(11,37,69,.12)}.lc-l.ls b{font-size:16px;color:#1e3a8a}
.lc-l .cl{font-weight:900;background:#fff;border-radius:10px;padding:3px 10px;color:#0b2545}.lc-l .tag{font-size:12px;border-radius:999px;padding:2px 10px;font-weight:800}
.lc-l.sb{background:repeating-linear-gradient(135deg,#fff7d6,#fff7d6 8px,#fff 8px,#fff 14px);border-color:#f5c542;color:#854d0e}
.lc-mdl{position:fixed;inset:0;background:rgba(11,37,69,.55);z-index:1000;display:flex;align-items:flex-start;justify-content:center;padding:16px;overflow:auto}.lc-mdl>div{background:#f8fafc;border-radius:20px;max-width:760px;width:100%;padding:16px;box-shadow:0 20px 50px rgba(0,0,0,.3)}
.lc-cand{display:grid;grid-template-columns:auto 1fr auto;gap:10px;align-items:center;background:#fff;border:2px solid #e2e8f0;border-radius:14px;padding:9px 12px;cursor:pointer;text-align:start;font:inherit;width:100%}.lc-cand.on{border-color:#c9a227;background:#fffbeb;box-shadow:0 0 0 3px rgba(201,162,39,.2)}
.lc-cand .rk{border-radius:10px;padding:3px 9px;font-weight:900;font-size:12px}.lc-cand small{display:block;color:#64748b;font-weight:700}
.lc-req{background:#fff;border:1px solid #e2e8f0;border-inline-start:6px solid #c9a227;border-radius:16px;padding:12px;display:grid;gap:8px}
.lc-pill{border-radius:999px;padding:3px 12px;font-weight:800;font-size:12.5px;white-space:nowrap}
.lc-kpi{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px}.lc-kpi div{background:#fff;border:1px solid #e2e8f0;border-top:4px solid #0b2545;border-radius:14px;padding:8px 10px;text-align:center}.lc-kpi b{display:block;font-size:24px;color:#0b2545}.lc-kpi span{font-size:12px;font-weight:800;color:#64748b}
.lc-t{width:100%;border-collapse:separate;border-spacing:0 6px}.lc-t th{font-size:12px;color:#64748b;text-align:start;padding:0 8px}.lc-t td{background:#fff;padding:8px;border-top:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;vertical-align:top;font-size:13.5px}.lc-t td:first-child{border-inline-start:1px solid #e2e8f0;border-radius:0 12px 12px 0}.lc-t td:last-child{border-inline-end:1px solid #e2e8f0;border-radius:12px 0 0 12px}
.lc-chip{font:inherit;font-weight:800;font-size:12.5px;border-radius:999px;border:1.5px solid #cbd5e1;background:#fff;padding:4px 10px;cursor:pointer}
.lc-note{font-size:12.5px;color:#64748b;font-weight:700;line-height:1.7}
@media(max-width:760px){.lc-t thead{display:none}.lc-t tr{display:grid;background:#fff;border:1px solid #e2e8f0;border-radius:14px;margin-bottom:8px;padding:6px}.lc-t td{border:0!important;border-radius:0!important;padding:4px 6px}}`;

// ——— قراءة الجدول المنشور ———
function useTT(api) {
  const [T, setT] = useState(null), [times, setTimes] = useState([]), [err, setErr] = useState("");
  useEffect(() => { (async () => { try { const [a, c] = await Promise.all([api.maGet(api.TT_NODE), api.maGet(api.TT_CFG)]); const tt = api.ttFresh(a); setT(tt); setTimes(c && Array.isArray(c.times) ? c.times : tt.times || []); } catch (e) { setErr("تعذّر تحميل الجدول المدرسي"); } })(); }, []);
  return { T, times, err };
}
const cleanN = n => String(n || "").replace(/\s*\(.*?\)\s*/g, "").trim();
function lessonsOf(T, ti, d) { const out = {}; Object.entries(T.C || {}).forEach(([k, days]) => { const row = (days || [])[d] || []; row.forEach((c, p) => { if (Array.isArray(c) && +c[1] === ti && +c[0] >= 0) { const s = (T.S || [])[+c[0]] || ""; if (!/احتياط/.test(s)) out[p] = { ck: k, s }; } }); }); return out; }
function busyAt(T, ti, d, p) { return Object.values(T.C || {}).some(days => { const c = ((days || [])[d] || [])[p]; return Array.isArray(c) && +c[1] === ti && +c[0] >= 0; }); }
function sbRank(T, ti, d, p) { const r = ((T.RS || {})[DAYS[d]] || [])[p] || []; const i = r.indexOf(ti); return i >= 0 ? i + 1 : 0; }
function dayLoad(T, ti, d) { let n = Object.keys(lessonsOf(T, ti, d)).length; const rs = (T.RS || {})[DAYS[d]] || []; rs.forEach(r => { if ((r || []).includes(ti)) n++; }); return n; }

// ——— واجهة المعلم ———
export function CoverTeacher({ me, api, start }) {
  const { T, times, err } = useTT(api);
  const [ti, setTi] = useState(-1), [tab, setTab] = useState(start || "req"), [dk, setDk] = useState(dkOf(nextSchoolDay()));
  const [pick, setPick] = useState(null), [to, setTo] = useState(null), [reason, setReason] = useState(""), [busy, setBusy] = useState(false), [msg, setMsg] = useState("");
  const [inb, setInb] = useState([]), [mine, setMine] = useState([]), [dayCov, setDayCov] = useState({}), [signFor, setSignFor] = useState(null), [note, setNote] = useState(""), [declFor, setDeclFor] = useState(null);
  const tk = tkOf(me.name);
  useEffect(() => { if (T) setTi(api.sttFindMe(T, me.name)); }, [T]);
  const days = useMemo(() => { const out = []; const d = nextSchoolDay(); for (let i = 0; out.length < 10 && i < 20; i++) { const x = new Date(d); x.setDate(d.getDate() + i); if (x.getDay() <= 4) out.push(dkOf(x)); } return out; }, []);
  const loadDay = async k => setDayCov(obj(await api.maGet(`${NODE}/${k}`)));
  const loadInb = async () => {
    const idx = Object.values(obj(await api.maGet(`${INB}/${tk}`))).filter(x => x && x.dk && x.id);
    const recent = idx.filter(x => fromDk(x.dk) >= new Date(Date.now() - 21 * 864e5)).sort((a, b) => (b.at || 0) - (a.at || 0)).slice(0, 40);
    const full = await Promise.all(recent.map(x => api.maGet(`${NODE}/${x.dk}/${x.id}`).catch(() => null)));
    setInb(full.filter(Boolean).filter(r => r.st !== "cancel"));
  };
  const loadMine = async () => { const ks = []; const b = new Date(Date.now() - 14 * 864e5); for (let i = 0; i < 30; i++) { const x = new Date(b); x.setDate(b.getDate() + i); if (x.getDay() <= 4) ks.push(dkOf(x)); }
    const all = await Promise.all(ks.map(k => api.maGet(`${NODE}/${k}`).catch(() => null))); const L = []; all.forEach(o => Object.values(obj(o)).forEach(r => { if (r && r.from && cleanN(r.from) === cleanN(me.name)) L.push(r); })); setMine(L.sort((a, b) => (b.at || 0) - (a.at || 0))); };
  useEffect(() => { loadInb(); loadMine(); }, []);
  useEffect(() => { loadDay(dk); }, [dk]);
  if (err) return <div className="lc-card">{err}</div>;
  if (!T) return <div className="lc-card" style={{ textAlign: "center", color: "#94a3b8", fontWeight: 800 }}>⏳ جارٍ تحميل جدولك...</div>;
  const pendIn = inb.filter(r => r.st === "pend").length;
  const d = fromDk(dk).getDay(), P = T.P || 7, my = ti >= 0 ? lessonsOf(T, ti, d) : {};
  const covKey = (p, ck) => Object.values(dayCov).find(r => r && r.p === p && r.ck === ck && r.fromT === ti && (r.st === "pend" || r.st === "ok"));
  const tm = p => times && times[p] ? times[p][0] : "";
  const cands = pick ? (T.T || []).map((n, i) => i).filter(i => i !== ti && !busyAt(T, i, d, pick.p)).map(i => {
    const taken = Object.values(dayCov).find(r => r && r.p === pick.p && r.toT === i && (r.st === "pend" || r.st === "ok"));
    return { i, n: cleanN(T.T[i]), rk: sbRank(T, i, d, pick.p), load: dayLoad(T, i, d), taken };
  }).sort((a, b) => (!!a.taken - !!b.taken) || ((a.rk || 99) - (b.rk || 99)) || a.load - b.load) : [];
  const send = async () => {
    if (!pick || to == null) return; setBusy(true); setMsg("");
    const id = `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`, toN = cleanN(T.T[to]);
    const rec = { id, dk, d, p: pick.p, ck: pick.ck, s: pick.s, fromT: ti, from: cleanN(T.T[ti]) || me.name, toT: to, to: toN, reason: reason.trim(), st: "pend", at: Date.now() };
    const ok = await api.maPut(`${NODE}/${dk}/${id}`, rec);
    if (ok !== false) { await api.maPut(`${INB}/${tkOf(toN)}/${dk}_${id}`, { dk, id, st: "pend", at: rec.at }); setMsg(`✓ أُرسل طلب تأمين حصة ${ORD[pick.p]} (${clsName(pick.ck)}) إلى أ/ ${toN}. ستظهر حالته في «طلباتي».`); setPick(null); setTo(null); setReason(""); loadDay(dk); loadMine(); }
    else setMsg("⚠️ تعذّر الإرسال، تحقق من الاتصال.");
    setBusy(false);
  };
  const answer = async (r, st, extra) => { setBusy(true); const upd = { ...r, st, ...extra, ansAt: Date.now() }; const ok = await api.maPut(`${NODE}/${r.dk}/${r.id}`, upd); if (ok !== false) { await api.maPut(`${INB}/${tk}/${r.dk}_${r.id}`, { dk: r.dk, id: r.id, st, at: r.at }); setMsg(st === "ok" ? "✓ سُجّلت موافقتك وتوقيعك على تأمين الحصة." : "سُجّل اعتذارك، وسيظهر للمعلم صاحب الطلب."); setSignFor(null); setDeclFor(null); setNote(""); loadInb(); } else setMsg("⚠️ تعذّر الحفظ."); setBusy(false); };
  const cancel = async r => { if (!window.confirm("إلغاء طلب التأمين؟")) return; await api.maPut(`${NODE}/${r.dk}/${r.id}`, { ...r, st: "cancel", canAt: Date.now() }); await api.maPut(`${INB}/${tkOf(r.to)}/${r.dk}_${r.id}`, { dk: r.dk, id: r.id, st: "cancel", at: r.at }); loadMine(); loadDay(dk); };
  const Pill = ({ st, map = ST }) => { const s = map[st] || ST.pend; return <span className="lc-pill" style={{ color: s[1], background: s[2] }}>{s[0]}</span>; };
  const Sig = api.SigPad;
  return <div className="lc"><style>{CSS}</style>
    <div className="lc-hero"><div><h2>🛡️ تأمين الحصص</h2><p>اضغط الحصة التي تريد تأمينها من جدولك، واختر زميلًا متاحًا، فيصله الطلب ليوافق ويوقّع.</p></div></div>
    {msg && <div className="lc-card" style={{ background: "#ecfdf5", borderColor: "#a7f3d0", color: "#065f46", fontWeight: 800 }}>{msg}</div>}
    <div className="lc-tabs"><button className={tab === "req" ? "on" : ""} onClick={() => setTab("req")}>🛡️ طلب تأمين حصة</button><button className={tab === "in" ? "on" : ""} onClick={() => { setTab("in"); loadInb(); }}>📥 طلبات واردة إليّ{pendIn ? <i>{ar(pendIn)}</i> : null}</button><button className={tab === "mine" ? "on" : ""} onClick={() => { setTab("mine"); loadMine(); }}>📤 طلباتي</button></div>

    {tab === "req" && (ti < 0 ? <div className="lc-card"><b style={{ color: "#b45309" }}>🔎 لم أجد اسمك في الجدول — اختر اسمك:</b><select className="lc-inp" style={{ marginTop: 8 }} value="" onChange={e => setTi(+e.target.value)}><option value="">— اختر —</option>{(T.T || []).map((n, i) => <option key={i} value={i}>{cleanN(n)}</option>)}</select></div>
      : <div className="lc-card">
        <div className="lc-days">{days.map(k => { const x = fromDk(k); return <button key={k} className={dk === k ? "on" : ""} onClick={() => { setDk(k); setPick(null); }}>{DAYS[x.getDay()]}<small>{x.toLocaleDateString("ar-SA-u-ca-islamic-umalqura", { day: "numeric", month: "short" })}{k === dkOf(new Date()) ? " • اليوم" : ""}</small></button>; })}</div>
        <div className="lc-list">{Array.from({ length: P }, (_, p) => { const x = my[p], rk = sbRank(T, ti, d, p), cv = x ? covKey(p, x.ck) : null;
          return <div className="lc-row" key={p}><div className="lc-pn">{ar(p + 1)}<small>{tm(p)}</small></div>
            {x ? <div className="lc-l ls" role="button" tabIndex={0} onClick={() => { if (cv) return; setPick({ p, ...x }); setTo(null); setReason(""); }} onKeyDown={e => { if (e.key === "Enter" && !cv) { setPick({ p, ...x }); setTo(null); } }} style={cv ? { cursor: "default", opacity: .85 } : null}>
                <span><b>{x.s}</b></span><span style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}><span className="cl">{clsName(x.ck)}</span>{cv ? <span className="tag" style={{ background: cv.st === "ok" ? "#dcfce7" : "#fef3c7", color: cv.st === "ok" ? "#15803d" : "#92400e" }}>{cv.st === "ok" ? `✅ أمّنها أ/ ${cv.to}` : `⏳ طلب إلى أ/ ${cv.to}`}</span> : <span className="tag" style={{ background: "#0b2545", color: "#fff" }}>🛡️ تأمين</span>}</span></div>
              : rk ? <div className="lc-l sb">انتظار {ar(rk)}</div> : <div className="lc-l">فراغ</div>}</div>; })}</div>
        <p className="lc-note" style={{ marginTop: 8 }}>الحصص الزرقاء من جدولك؛ اضغط أيًّا منها لتأمينها في {dayLabel(dk)}.</p>
      </div>)}

    {tab === "in" && <div style={{ display: "grid", gap: 10 }}>{!inb.length && <div className="lc-card lc-note">لا توجد طلبات تأمين واردة إليك.</div>}
      {inb.sort((a, b) => (a.st === "pend" ? 0 : 1) - (b.st === "pend" ? 0 : 1) || (b.at || 0) - (a.at || 0)).map(r => <div key={r.id} className="lc-req" style={{ borderInlineStartColor: r.st === "pend" ? "#c9a227" : r.st === "ok" ? "#16a34a" : "#dc2626" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", alignItems: "center" }}><b style={{ color: "#0b2545", fontSize: 16 }}>{dayLabel(r.dk)} — الحصة {ORD[r.p]} {tm(r.p) ? `(${tm(r.p)})` : ""}</b><Pill st={r.st} /></div>
        <div style={{ fontWeight: 700 }}>تأمين حصة <b>{r.s}</b> لفصل <b>{clsName(r.ck)}</b> عن أ/ <b>{r.from}</b>{r.reason ? <span className="lc-note"> — السبب: {r.reason}</span> : null}</div>
        {r.st === "ok" && r.sig && <div className="lc-note">وقّعت {new Date(r.sig.at).toLocaleString("ar-SA")}{r.sig.note ? ` — ${r.sig.note}` : ""}</div>}
        {r.st === "pend" && (signFor === r.id ? <div style={{ display: "grid", gap: 8 }}><textarea className="lc-inp" rows={2} value={note} onChange={e => setNote(e.target.value)} placeholder="ملاحظة (اختياري)" />{Sig ? <Sig busy={busy} onCancel={() => setSignFor(null)} onSave={img => answer(r, "ok", { sig: { img, at: Date.now(), note: note.trim() } })} /> : <button className="lc-btn p" onClick={() => answer(r, "ok", { sig: { at: Date.now(), note: note.trim() } })}>موافق</button>}</div>
          : declFor === r.id ? <div style={{ display: "grid", gap: 8 }}><textarea className="lc-inp" rows={2} value={note} onChange={e => setNote(e.target.value)} placeholder="سبب الاعتذار" /><div style={{ display: "flex", gap: 6 }}><button className="lc-btn r" disabled={busy} onClick={() => answer(r, "no", { decl: note.trim() })}>تأكيد الاعتذار</button><button className="lc-btn" onClick={() => setDeclFor(null)}>رجوع</button></div></div>
          : <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}><button className="lc-btn g" onClick={() => { setSignFor(r.id); setNote(""); }}>✍️ أوافق وأوقّع</button><button className="lc-btn r" onClick={() => { setDeclFor(r.id); setNote(""); }}>✋ أعتذر</button></div>)}
      </div>)}</div>}

    {tab === "mine" && <div style={{ display: "grid", gap: 10 }}>{!mine.length && <div className="lc-card lc-note">لم ترسل طلبات تأمين خلال الأسبوعين الماضيين والقادمين.</div>}
      {mine.map(r => <div key={r.id} className="lc-req" style={{ borderInlineStartColor: (ST[r.st] || ST.pend)[1] }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", alignItems: "center" }}><b style={{ color: "#0b2545" }}>{dayLabel(r.dk)} — الحصة {ORD[r.p]} • {r.s} • {clsName(r.ck)}</b><Pill st={r.st} /></div>
        <div style={{ fontWeight: 700 }}>إلى أ/ {r.to}{r.st === "no" && r.decl ? <span className="lc-note"> — سبب الاعتذار: {r.decl}</span> : null}{r.st === "ok" && r.sig && r.sig.note ? <span className="lc-note"> — ملاحظته: {r.sig.note}</span> : null}</div>
        {r.st === "pend" && <div><button className="lc-btn r" onClick={() => cancel(r)}>إلغاء الطلب</button></div>}
        {r.st === "no" && <div><button className="lc-btn" onClick={() => { setTab("req"); setDk(r.dk); setPick({ p: r.p, ck: r.ck, s: r.s }); setTo(null); }}>اختر زميلًا آخر</button></div>}
      </div>)}</div>}

    {pick && <div className="lc-mdl" onClick={e => { if (e.target === e.currentTarget) setPick(null); }}><div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}><h3 style={{ margin: 0, color: "#0b2545" }}>🛡️ تأمين حصة {pick.s} — {clsName(pick.ck)}</h3><button className="lc-btn" onClick={() => setPick(null)}>✕</button></div>
      <p className="lc-note" style={{ margin: "4px 0 10px" }}>{dayLabel(dk)} • الحصة {ORD[pick.p]} {tm(pick.p) ? `• ${tm(pick.p)}` : ""}. المعلمون الفارغون في هذا الوقت، وأصحاب الانتظار في الحصة أولًا ثم الأقل حصصًا في اليوم.</p>
      <div style={{ display: "grid", gap: 6, maxHeight: "48vh", overflow: "auto" }}>{cands.length ? cands.map(c => <button key={c.i} className={`lc-cand${to === c.i ? " on" : ""}`} disabled={!!c.taken} style={c.taken ? { opacity: .5, cursor: "not-allowed" } : null} onClick={() => setTo(c.i)}>
        <span className="rk" style={c.rk ? { background: "#fff3c4", color: "#854d0e" } : { background: "#f1f5f9", color: "#475569" }}>{c.rk ? `انتظار ${ar(c.rk)}` : "فارغ"}</span>
        <span><b>أ/ {c.n}</b><small>{c.taken ? `يؤمّن حصة أخرى في هذا الوقت (عن أ/ ${c.taken.from})` : `حصصه هذا اليوم: ${ar(c.load)}`}</small></span><span>{to === c.i ? "✔" : ""}</span></button>) : <div className="lc-note">لا يوجد معلم فارغ في هذه الحصة.</div>}</div>
      <label style={{ display: "block", marginTop: 10, fontWeight: 800, fontSize: 13 }}>سبب التأمين (اختياري)<textarea className="lc-inp" rows={2} value={reason} onChange={e => setReason(e.target.value)} placeholder="مثال: مراجعة طبية، مهمة رسمية، اجتماع..." /></label>
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}><button className="lc-btn p" disabled={to == null || busy} onClick={send}>📨 إرسال الطلب إلى أ/ {to != null ? cleanN(T.T[to]) : "..."}</button><button className="lc-btn" onClick={() => setPick(null)}>إلغاء</button></div>
    </div></div>}
  </div>;
}

// ——— شريط تنبيه للمعلم بالطلبات الواردة ———
export function CoverBanner({ me, api, onOpen }) {
  const [n, setN] = useState(0);
  useEffect(() => { api.maGet(`${INB}/${tkOf(me.name)}`).then(o => setN(Object.values(obj(o)).filter(x => x && x.st === "pend" && fromDk(x.dk) >= new Date(new Date().setHours(0, 0, 0, 0))).length)).catch(() => {}); }, []);
  if (!n) return null;
  return <button onClick={onOpen} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, background: "linear-gradient(135deg,#eff6ff,#dbeafe)", border: "2px solid #0b2545", borderRadius: 16, padding: "12px 14px", margin: "0 0 12px", cursor: "pointer", fontFamily: "inherit", textAlign: "right", direction: "rtl" }}><span style={{ fontSize: 26 }}>🛡️</span><span style={{ flex: 1 }}><b style={{ color: "#0b2545", fontSize: 15.5 }}>لديك {ar(n)} {n === 1 ? "طلب" : "طلبات"} تأمين حصة بانتظار موافقتك</b><br /><small style={{ color: "#475569", fontWeight: 700 }}>اضغط للاطلاع والموافقة والتوقيع أو الاعتذار</small></span><span style={{ fontWeight: 900, color: "#0b2545" }}>←</span></button>;
}

// ——— صفحة الإدارة: تأمين الحصص اليومية ———
export function CoverAdmin({ api, by }) {
  const { T, times } = useTT(api);
  const [dk, setDk] = useState(dkOf(nextSchoolDay())), [L, setL] = useState(null), [ed, setEd] = useState({}), [msg, setMsg] = useState("");
  const load = async k => { setL(null); const o = obj(await api.maGet(`${NODE}/${k}`)); setL(Object.values(o).filter(r => r && r.id).sort((a, b) => a.p - b.p || (a.at || 0) - (b.at || 0))); setEd({}); };
  useEffect(() => { load(dk); }, [dk]);
  const shift = n => { const x = fromDk(dk); do { x.setDate(x.getDate() + n); } while (x.getDay() > 4); setDk(dkOf(x)); };
  const tm = p => times && times[p] ? times[p][0] : "";
  const val = r => ({ ...(r.adm || {}), ...(ed[r.id] || {}) });
  const setV = (r, k, v) => setEd(e => ({ ...e, [r.id]: { ...(e[r.id] || {}), [k]: v } }));
  const saveAdm = async r => { const a = val(r); const rec = { ...r, adm: { st: a.st || "", mins: a.st === "late" ? +a.mins || 0 : 0, note: (a.note || "").trim(), by, at: Date.now() } }; const ok = await api.maPut(`${NODE}/${r.dk}/${r.id}`, rec); if (ok !== false) { setL(l => l.map(x => x.id === r.id ? rec : x)); setEd(e => { const n = { ...e }; delete n[r.id]; return n; }); setMsg(`✓ حُفظت ملاحظة الإدارة على حصة ${ORD[r.p]} (${clsName(r.ck)}).`); } else setMsg("⚠️ تعذّر الحفظ."); };
  const act = (L || []).filter(r => r.st !== "cancel");
  const K = { all: act.length, ok: act.filter(r => r.st === "ok").length, pend: act.filter(r => r.st === "pend").length, no: act.filter(r => r.st === "no").length, inT: act.filter(r => r.adm && r.adm.st === "in").length, late: act.filter(r => r.adm && r.adm.st === "late").length, miss: act.filter(r => r.adm && r.adm.st === "no").length };
  const doPrint = () => {
    const rows = act.map((r, i) => { const a = r.adm || {}, s = ST[r.st] || ST.pend, m = ADM[a.st]; return `<tr><td>${ar(i + 1)}</td><td>${ORD[r.p]}<br><small>${esc(tm(r.p))}</small></td><td>${esc(clsName(r.ck))}<br><small>${esc(r.s)}</small></td><td>${esc(r.from)}</td><td>${esc(r.to)}</td><td>${esc(r.reason || "")}</td><td>${s[0]}${r.sig && r.sig.img ? `<br><img src="${r.sig.img}" style="height:34px">` : ""}</td><td>${m ? m[0] + (a.st === "late" && a.mins ? ` ${ar(a.mins)} د` : "") : "—"}</td><td>${esc(a.note || "")}</td></tr>`; }).join("");
    const html = `<html dir="rtl"><head><meta charset="utf-8"><title>تأمين الحصص ${esc(dk)}</title><style>@page{size:A4 landscape;margin:10mm}body{font-family:Tajawal,Arial,sans-serif;color:#0f172a;-webkit-print-color-adjust:exact;print-color-adjust:exact}.hd{display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #c9a227;padding-bottom:6px;margin-bottom:10px;color:#0b2545}.hd h1{margin:0;font-size:20px}.hd img{height:56px}table{width:100%;border-collapse:collapse;font-size:12.5px}th{background:#0b2545;color:#fff;padding:6px}td{border:1px solid #cbd5e1;padding:5px;text-align:center;vertical-align:middle}tr:nth-child(even) td{background:#f8fafc}small{color:#64748b}.k{display:flex;gap:8px;margin:0 0 10px}.k span{border:1px solid #c9a227;border-radius:8px;padding:4px 10px;font-weight:700}.ft{display:flex;justify-content:space-between;margin-top:26px;font-weight:700}</style></head><body>
      <div class="hd"><div><h1>🛡️ سجل تأمين الحصص اليومية</h1><div>${esc(api.school || "")} • ${esc(dayLabel(dk))} (${esc(dk)})</div></div>${api.logo ? `<img src="${api.logo}">` : ""}</div>
      <div class="k"><span>الطلبات: ${ar(K.all)}</span><span>وافق ووقّع: ${ar(K.ok)}</span><span>بانتظار: ${ar(K.pend)}</span><span>دخل في الوقت: ${ar(K.inT)}</span><span>تأخر: ${ar(K.late)}</span><span>لم يدخل: ${ar(K.miss)}</span></div>
      <table><tr><th>م</th><th>الحصة</th><th>الفصل والمادة</th><th>المعلم صاحب الحصة</th><th>المعلم المؤمِّن</th><th>السبب</th><th>الموافقة والتوقيع</th><th>الدخول للحصة</th><th>ملاحظات الإدارة</th></tr>${rows || '<tr><td colspan="9">لا توجد طلبات تأمين في هذا اليوم</td></tr>'}</table>
      <div class="ft"><span>وكيل الشؤون التعليمية: ..................</span><span>مدير المدرسة: ..................</span></div><script>onload=()=>print()<\/script></body></html>`;
    const w = window.open("", "_blank"); if (w) { w.document.write(html); w.document.close(); }
  };
  return <div className="lc"><style>{CSS}</style>
    <div className="lc-hero"><div><h2>🛡️ تأمين الحصص اليومية</h2><p>طلبات التأمين بين المعلمين وموافقاتهم وتواقيعهم، وملاحظات الإدارة على دخول المعلم المؤمِّن للحصة.</p></div><button className="lc-btn g" onClick={doPrint}>🖨️ طباعة سجل اليوم</button></div>
    <div className="lc-card" style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}><button className="lc-btn" onClick={() => shift(-1)}>→ السابق</button><input type="date" className="lc-inp" style={{ width: "auto" }} value={dk} onChange={e => e.target.value && setDk(e.target.value)} /><button className="lc-btn" onClick={() => shift(1)}>التالي ←</button><button className="lc-btn" onClick={() => setDk(dkOf(new Date()))}>اليوم</button><b style={{ color: "#0b2545", marginInlineStart: 6 }}>{dayLabel(dk)}</b><button className="lc-btn" onClick={() => load(dk)} style={{ marginInlineStart: "auto" }}>↻ تحديث</button></div>
    <div className="lc-kpi"><div><b>{ar(K.all)}</b><span>طلبات التأمين</span></div><div style={{ borderTopColor: "#16a34a" }}><b>{ar(K.ok)}</b><span>وافق ووقّع</span></div><div style={{ borderTopColor: "#c9a227" }}><b>{ar(K.pend)}</b><span>بانتظار الموافقة</span></div><div style={{ borderTopColor: "#16a34a" }}><b>{ar(K.inT)}</b><span>دخل في الوقت</span></div><div style={{ borderTopColor: "#d97706" }}><b>{ar(K.late)}</b><span>تأخر</span></div><div style={{ borderTopColor: "#dc2626" }}><b>{ar(K.miss)}</b><span>لم يدخل</span></div></div>
    {msg && <div className="lc-card" style={{ background: "#ecfdf5", borderColor: "#a7f3d0", color: "#065f46", fontWeight: 800 }}>{msg}</div>}
    {!L ? <div className="lc-card" style={{ textAlign: "center", color: "#94a3b8", fontWeight: 800 }}>⏳</div> : !act.length ? <div className="lc-card lc-note">لا توجد طلبات تأمين في هذا اليوم.</div> :
      <table className="lc-t"><thead><tr><th>الحصة</th><th>الفصل والمادة</th><th>صاحب الحصة ← المؤمِّن</th><th>الموافقة</th><th>دخول المعلم المؤمِّن وملاحظات الإدارة</th></tr></thead><tbody>
        {act.map(r => { const a = val(r), dirty = !!ed[r.id]; return <tr key={r.id}>
          <td><b style={{ color: "#0b2545" }}>{ORD[r.p]}</b><div className="lc-note">{tm(r.p)}</div></td>
          <td><b>{clsName(r.ck)}</b><div className="lc-note">{r.s}</div></td>
          <td><div style={{ fontWeight: 800 }}>أ/ {r.from} <span style={{ color: "#c9a227" }}>←</span> أ/ {r.to}</div>{r.reason && <div className="lc-note">السبب: {r.reason}</div>}</td>
          <td><span className="lc-pill" style={{ color: (ST[r.st] || ST.pend)[1], background: (ST[r.st] || ST.pend)[2] }}>{(ST[r.st] || ST.pend)[0]}</span>{r.sig && r.sig.img && <div><img src={r.sig.img} alt="توقيع" style={{ height: 34, marginTop: 4 }} /></div>}{r.st === "no" && r.decl && <div className="lc-note">{r.decl}</div>}{r.sig && r.sig.note && <div className="lc-note">{r.sig.note}</div>}</td>
          <td style={{ minWidth: 260 }}><div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>{Object.entries(ADM).map(([k, v]) => <button key={k} className="lc-chip" style={a.st === k ? { background: v[2], color: v[1], borderColor: v[1] } : null} onClick={() => setV(r, "st", a.st === k ? "" : k)}>{v[0]}</button>)}</div>
            {a.st === "late" && <label className="lc-note" style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 6 }}>مدة التأخر (دقيقة)<input type="number" min="1" max="45" className="lc-inp" style={{ width: 80 }} value={a.mins || ""} onChange={e => setV(r, "mins", e.target.value)} /></label>}
            <textarea className="lc-inp" rows={2} style={{ marginTop: 6 }} value={a.note || ""} onChange={e => setV(r, "note", e.target.value)} placeholder="ملاحظات الإدارة على دخول المعلم الحصة" />
            <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 6 }}><button className="lc-btn p" disabled={!dirty} onClick={() => saveAdm(r)}>💾 حفظ</button>{r.adm && r.adm.at && !dirty && <span className="lc-note">حُفظت {new Date(r.adm.at).toLocaleTimeString("ar-SA", { hour: "numeric", minute: "2-digit" })}{r.adm.by ? ` — ${r.adm.by}` : ""}</span>}</div></td>
        </tr>; })}</tbody></table>}
  </div>;
}
