import React, { useEffect, useMemo, useState } from "react";

// جدولي المدرسي — عرض ملون وواضح لجدول المعلم في حسابه، مع الانتظار وعلامة «معدّل»
const PAL = ["#2563eb", "#059669", "#d97706", "#7c3aed", "#db2777", "#0891b2", "#65a30d", "#dc2626", "#4f46e5", "#0d9488", "#ca8a04", "#9333ea", "#e11d48", "#0284c7"];
const ar = n => String(n).replace(/\d/g, d => "٠١٢٣٤٥٦٧٨٩"[d]);
const ORD = ["الأولى", "الثانية", "الثالثة", "الرابعة", "الخامسة", "السادسة", "السابعة", "الثامنة"];
const clsName = k => { const [g, s] = String(k).split("-"); return s ? `${g}م/${s}` : k; };
const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const toMin = s => { const m = String(s || "").match(/(\d+):(\d+)/); if (!m) return null; let h = +m[1]; if (h < 6) h += 12; return h * 60 + +m[2]; };

const CSS = `.mtt>*{min-width:0}.mtt{direction:rtl;font-family:Tajawal,system-ui,sans-serif;color:#0f172a;display:grid;gap:14px}
.mtt-hero{border-radius:22px;padding:16px 18px;color:#fff;background:linear-gradient(135deg,#0b2545,#13315c 60%,#8a6d1d);display:flex;flex-wrap:wrap;gap:14px;align-items:center;justify-content:space-between;border-bottom:4px solid #c9a227}
.mtt-hero h2{margin:0;font-size:21px;font-weight:900}.mtt-hero p{margin:3px 0 0;opacity:.88;font-size:13px;font-weight:700}
.mtt-k{display:flex;gap:8px;flex-wrap:wrap}.mtt-k div{background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.25);border-radius:14px;padding:6px 12px;text-align:center;min-width:72px}.mtt-k b{display:block;font-size:22px;line-height:1.1}.mtt-k span{font-size:11.5px;opacity:.9}
.mtt-btn{font:inherit;font-weight:800;border-radius:12px;border:1px solid #cbd5e1;background:#fff;color:#0b2545;padding:8px 14px;cursor:pointer}.mtt-btn.g{background:#c9a227;border-color:#c9a227;color:#0b2545}
.mtt-card{background:#fff;border:1px solid #e2e8f0;border-radius:18px;padding:12px;box-shadow:0 2px 10px rgba(15,23,42,.05)}
.mtt-days{display:flex;gap:6px;overflow-x:auto;padding-bottom:2px}.mtt-days button{flex:none;font:inherit;font-weight:800;border-radius:999px;border:1px solid #cbd5e1;background:#fff;padding:7px 14px;cursor:pointer;color:#334155}.mtt-days button.on{background:#0b2545;color:#fff;border-color:#0b2545}
.mtt-list{display:grid;gap:8px;margin-top:10px}
.mtt-row{display:grid;grid-template-columns:64px 1fr;gap:10px;align-items:stretch}
.mtt-pn{border-radius:14px;background:#f1f5f9;display:flex;flex-direction:column;align-items:center;justify-content:center;font-weight:900;color:#0b2545;padding:6px 0}.mtt-pn small{font-size:11px;font-weight:700;color:#64748b}
.mtt-l{position:relative;border-radius:14px;padding:10px 12px;border:2px solid transparent;display:flex;justify-content:space-between;align-items:center;gap:8px;min-height:58px}
.mtt-l b{font-size:16px}.mtt-l .cl{font-weight:900;font-size:15px;background:rgba(255,255,255,.75);border-radius:10px;padding:3px 10px}
.mtt-l.free{background:#f8fafc;color:#94a3b8;border:1px dashed #e2e8f0}
.mtt-l.sb{background:repeating-linear-gradient(135deg,#fff7d6,#fff7d6 8px,#fff 8px,#fff 14px);border-color:#f5c542;color:#854d0e}
.mtt-l.now{box-shadow:0 0 0 3px #c9a227}
.mtt-mk{position:absolute;top:-9px;inset-inline-start:10px;background:#c9a227;color:#0b2545;font-size:11px;font-weight:900;border-radius:8px;padding:1px 8px}
.mtt-l.mk,.mtt-g td.mk{outline:2.5px dashed #c9a227;outline-offset:-5px}
.mtt-g{width:100%;border-collapse:separate;border-spacing:4px;table-layout:fixed;min-width:680px}
.mtt-g th{font-size:12px;color:#475569;font-weight:800}.mtt-g th small{display:block;font-weight:600;color:#94a3b8;font-size:10.5px}
.mtt-g th.d{width:74px;text-align:start;color:#0b2545;font-size:13.5px}.mtt-g tr.today th.d{color:#b45309}
.mtt-g td{height:62px;border-radius:12px;text-align:center;font-size:12.5px;line-height:1.3;position:relative;padding:3px 2px;border:1px solid #eef2f7;background:#f8fafc}
.mtt-g td b{display:block;font-size:13.5px}.mtt-g td .c2{display:inline-block;margin-top:3px;background:rgba(255,255,255,.8);border-radius:8px;padding:0 7px;font-weight:900}
.mtt-g td.sb{background:repeating-linear-gradient(135deg,#fff7d6,#fff7d6 7px,#fff 7px,#fff 12px);border-color:#f5c542;color:#854d0e;font-weight:900}
.mtt-g tr.today td{box-shadow:inset 0 0 0 1px #fcd34d}.mtt-g td.now{box-shadow:0 0 0 3px #c9a227!important}
.mtt-g .mtt-mk{top:-7px;font-size:9.5px;padding:0 5px}
.mtt-leg{display:flex;flex-wrap:wrap;gap:6px 12px;font-size:12.5px;font-weight:700;color:#334155;margin-top:8px}.mtt-leg i{display:inline-block;width:13px;height:13px;border-radius:4px;vertical-align:-2px;margin-inline-end:4px}
.mtt-scroll{overflow-x:auto}`;

export function MyTT({ me, api }) {
  const [T, setT] = useState(null), [times, setTimes] = useState(null), [ti, setTi] = useState(-1), [day, setDay] = useState(-1), [err, setErr] = useState("");
  useEffect(() => { (async () => { try { const [a, c] = await Promise.all([api.maGet(api.TT_NODE), api.maGet(api.TT_CFG)]); const tt = api.ttFresh(a); setT(tt); setTimes(c && Array.isArray(c.times) ? c.times : tt.times || []); setTi(api.sttFindMe(tt, me.name)); } catch (e) { setErr("تعذّر تحميل الجدول"); } })(); }, []);
  const now = new Date(), jsd = now.getDay(), todayIdx = jsd <= 4 ? jsd : -1;
  useEffect(() => { setDay(todayIdx >= 0 ? todayIdx : 0); }, []);
  const G = useMemo(() => {
    if (!T || ti < 0) return null;
    const P = T.P || 7, D = T.D || ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس"], M = T.M || {}, mL = new Set(M.L || []), mR = new Set(M.R || []);
    const grid = D.map(() => Array(P).fill(null)), subs = {};
    Object.entries(T.C || {}).forEach(([k, days]) => (days || []).forEach((row, d) => (row || []).forEach((c, p) => { if (Array.isArray(c) && c[1] === ti && c[0] >= 0 && grid[d]) { const s = (T.S || [])[c[0]] || ""; if (/احتياط/.test(s)) return; subs[s] = 1; grid[d][p] = { t: "l", s, k, mk: mL.has(`${k}|${d}|${p}`) }; } })));
    D.forEach((dn, d) => { const rs = (T.RS || {})[dn] || []; for (let p = 0; p < P; p++) { const r = rs[p] || []; const i = r.indexOf(ti); if (i >= 0 && !grid[d][p]) grid[d][p] = { t: "s", r: i + 1, mk: mR.has(`${d}|${p}|${i + 1}`) }; } });
    const SL = Object.keys(subs).sort(), col = s => PAL[SL.indexOf(s) % PAL.length];
    let nL = 0, nS = 0, nM = 0; grid.forEach(r => r.forEach(x => { if (!x) return; if (x.t === "l") nL++; else nS++; if (x.mk) nM++; }));
    return { P, D, grid, SL, col, nL, nS, nM };
  }, [T, ti]);
  const curP = useMemo(() => { if (!times || todayIdx < 0) return -1; const m = now.getHours() * 60 + now.getMinutes(); return times.findIndex(t => { const a = toMin(t && t[0]), b = toMin(t && t[1]); return a != null && b != null && m >= a && m < b; }); }, [times]);
  if (err) return <div className="mtt-card">{err}</div>;
  if (!T) return <div className="mtt-card" style={{ textAlign: "center", color: "#94a3b8", fontWeight: 800 }}>⏳ جارٍ تحميل جدولك...</div>;
  if (ti < 0) return <div className="mtt"><style>{CSS}</style><div className="mtt-card"><b style={{ color: "#b45309" }}>🔎 لم أجد اسمك في الجدول — اختر اسمك:</b><select className="ma-inp" style={{ marginTop: 8, width: "100%" }} value="" onChange={e => setTi(+e.target.value)}><option value="">— اختر —</option>{(T.T || []).map((n, i) => ({ i, n: String(n).trim() })).sort((a, b) => a.n.localeCompare(b.n, "ar")).map(x => <option key={x.i} value={x.i}>{x.n}</option>)}</select></div></div>;
  const { P, D, grid, SL, col, nL, nS, nM } = G, tname = String(T.T[ti] || "").replace(/\s*\(.*?\)\s*/g, "").trim();
  const tm = p => times && times[p] ? `${times[p][0]}` : "";
  const bg = c => `linear-gradient(135deg, ${c}22, ${c}12)`;
  const Cell = ({ x, d, p }) => {
    const now1 = d === todayIdx && p === curP;
    if (!x) return <td className={now1 ? "now" : ""} />;
    if (x.t === "s") return <td className={`sb${x.mk ? " mk" : ""}${now1 ? " now" : ""}`}>{x.mk && <span className="mtt-mk">معدّل</span>}انتظار {ar(x.r)}</td>;
    const c = col(x.s); return <td className={`${x.mk ? "mk" : ""}${now1 ? " now" : ""}`} style={{ background: bg(c), borderColor: c + "55", color: "#0f172a" }}>{x.mk && <span className="mtt-mk">معدّل</span>}<b style={{ color: c }}>{x.s}</b><span className="c2">{clsName(x.k)}</span></td>;
  };
  const doPrint = () => {
    const rows = D.map((dn, d) => `<tr><th class="d">${esc(dn)}</th>${grid[d].map(x => { if (!x) return "<td></td>"; if (x.t === "s") return `<td class="sb${x.mk ? " mk" : ""}">${x.mk ? '<i class="m">معدّل</i>' : ""}انتظار ${ar(x.r)}</td>`; const c = col(x.s); return `<td class="${x.mk ? "mk" : ""}" style="background:${c}1f;border-color:${c}66">${x.mk ? '<i class="m">معدّل</i>' : ""}<b style="color:${c}">${esc(x.s)}</b><span>${esc(clsName(x.k))}</span></td>`; }).join("")}</tr>`).join("");
    const html = `<style>@page{size:A4 landscape;margin:10mm}body{font-family:Tajawal,Arial,sans-serif;direction:rtl;color:#0f172a;-webkit-print-color-adjust:exact;print-color-adjust:exact}.hd{display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #c9a227;padding-bottom:6px;margin-bottom:10px;color:#0b2545}.hd h1{margin:0;font-size:20px}.hd img{height:54px}table{width:100%;border-collapse:separate;border-spacing:4px;table-layout:fixed}th{background:#0b2545;color:#fff;border-radius:8px;padding:6px 2px;font-size:12px}th small{display:block;font-weight:400;opacity:.85}th.d{background:#f4ead2;color:#0b2545;width:80px}td{height:64px;border:1px solid #e2e8f0;border-radius:10px;text-align:center;font-size:12px;position:relative}td b{display:block;font-size:14px}td span{display:inline-block;margin-top:3px;background:#fff;border-radius:6px;padding:0 6px;font-weight:800}td.sb{background:#fff7d6;border-color:#f5c542;color:#854d0e;font-weight:800}td.mk{outline:2px dashed #c9a227;outline-offset:-4px}i.m{position:absolute;top:2px;right:4px;font-style:normal;background:#c9a227;color:#0b2545;font-size:9px;font-weight:800;border-radius:4px;padding:0 4px}.ft{display:flex;justify-content:space-between;margin-top:12px;font-size:12px;color:#0b2545}</style>
      <div class="hd"><div><h1>جدولي المدرسي — أ/ ${esc(tname)}</h1><div>${esc(api.school || "")} • الحصص ${ar(nL)} • الانتظار ${ar(nS)} • الإجمالي ${ar(nL + nS)}</div></div>${api.logo ? `<img src="${api.logo}">` : ""}</div>
      <table><tr><th class="d"></th>${Array.from({ length: P }, (_, p) => `<th>${ORD[p] || ar(p + 1)}<small>${esc(tm(p))}</small></th>`).join("")}</tr>${rows}</table>
      <div class="ft"><span>${nM ? `الحصص المؤطرة بخط متقطع عليها «معدّل»: ${ar(nM)}` : ""}</span><span>المعلم: ..................</span><span>مدير المدرسة: ..................</span></div>`;
    if (api.print) api.print(html, `جدول ${tname}`); else { const w = window.open("", "_blank"); if (w) { w.document.write(`<html dir="rtl"><head><meta charset="utf-8"><title>جدولي</title></head><body>${html}<script>onload=()=>print()<\/script></body></html>`); w.document.close(); } }
  };
  const dd = day < 0 ? 0 : day;
  return <div className="mtt"><style>{CSS}</style>
    <div className="mtt-hero"><div><h2>🗓️ جدولي المدرسي</h2><p>أ/ {tname}{T.src ? ` • ${T.src}` : ""}</p></div>
      <div className="mtt-k"><div><b>{ar(nL)}</b><span>حصة</span></div><div><b>{ar(nS)}</b><span>انتظار</span></div><div><b>{ar(nL + nS)}</b><span>الإجمالي</span></div>{nM > 0 && <div style={{ background: "rgba(201,162,39,.35)" }}><b>{ar(nM)}</b><span>معدّلة</span></div>}</div>
      <button className="mtt-btn g" onClick={doPrint}>🖨️ طباعة جدولي ملونًا</button></div>
    {nM > 0 && <div className="mtt-card" style={{ borderColor: "#c9a227", background: "#fffbeb", fontWeight: 800, color: "#854d0e" }}>✎ في جدولك {ar(nM)} {nM === 1 ? "حصة معدّلة" : "حصص معدّلة"} مؤخرًا، مؤطرة بخط ذهبي متقطع وعليها كلمة «معدّل».</div>}
    <div className="mtt-card">
      <div className="mtt-days">{D.map((dn, d) => <button key={d} className={dd === d ? "on" : ""} onClick={() => setDay(d)}>{dn}{d === todayIdx ? " • اليوم" : ""}</button>)}</div>
      <div className="mtt-list">{Array.from({ length: P }, (_, p) => { const x = grid[dd][p], n1 = dd === todayIdx && p === curP; const c = x && x.t === "l" ? col(x.s) : null;
        return <div className="mtt-row" key={p}><div className="mtt-pn" style={n1 ? { background: "#c9a227" } : null}>{ar(p + 1)}<small>{tm(p)}</small></div>
          {!x ? <div className={`mtt-l free${n1 ? " now" : ""}`}>فراغ</div>
            : x.t === "s" ? <div className={`mtt-l sb${x.mk ? " mk" : ""}${n1 ? " now" : ""}`}>{x.mk && <span className="mtt-mk">معدّل</span>}<b>انتظار {ar(x.r)}</b><span style={{ fontSize: 12 }}>كن جاهزًا للتغطية</span></div>
            : <div className={`mtt-l${x.mk ? " mk" : ""}${n1 ? " now" : ""}`} style={{ background: bg(c), borderColor: c + "66" }}>{x.mk && <span className="mtt-mk">معدّل</span>}<b style={{ color: c }}>{x.s}</b><span className="cl" style={{ color: c }}>{clsName(x.k)}</span></div>}</div>; })}</div>
    </div>
    <div className="mtt-card"><b style={{ color: "#0b2545" }}>الأسبوع كاملًا</b>
      <div className="mtt-scroll" style={{ marginTop: 8 }}><table className="mtt-g"><thead><tr><th className="d"></th>{Array.from({ length: P }, (_, p) => <th key={p}>{ORD[p] || ar(p + 1)}<small>{tm(p)}</small></th>)}</tr></thead>
        <tbody>{D.map((dn, d) => <tr key={d} className={d === todayIdx ? "today" : ""}><th className="d">{dn}</th>{grid[d].map((x, p) => <Cell key={p} x={x} d={d} p={p} />)}</tr>)}</tbody></table></div>
      <div className="mtt-leg">{SL.map(s => <span key={s}><i style={{ background: col(s) }} />{s}</span>)}<span><i style={{ background: "#fff7d6", border: "1px solid #f5c542" }} />انتظار</span><span><i style={{ border: "2px dashed #c9a227" }} />معدّل</span></div>
    </div>
  </div>;
}
