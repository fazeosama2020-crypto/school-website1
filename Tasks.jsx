// ══════════════════════════════════════════════════════════════════
// 📌 توزيع مهام تنفيذ البرامج — الخطة التشغيلية والتقويم الخارجي
// المدير: يسند مهام مرتبطة ببرنامج أو مؤشر لأي إداري، يتابع التقدم، ويقدّم تغذية راجعة (اعتماد / تعديل / توجيه)
// الإداري: «مهامي» — يحدّث نسبة الإنجاز ويكتب ما نفّذه ويرفع الشواهد ويسلّم للاعتماد
// school-tasks/{id} = {id, src:opp|ext, ref, refT, refD, to, title, det, due, pri, st, prog, ups{}, fb{}, seen{}, ev, by, at, up}
// school-tasks-img/{id} = [صور الشواهد المضغوطة] (تُجلب عند الفتح فقط)
// ══════════════════════════════════════════════════════════════════
import React, { useEffect, useMemo, useRef, useState } from "react";

const NODE = "school-tasks", IMG = "school-tasks-img";
const NAVY = "#0b2545", GOLD = "#c9a227";
const ar = n => String(n ?? "").replace(/\d/g, d => "٠١٢٣٤٥٦٧٨٩"[d]);
const esc = t => String(t ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const obj = v => (v && typeof v === "object" ? v : {});
const arr = v => Array.isArray(v) ? v.filter(Boolean) : (v && typeof v === "object" ? Object.values(v).filter(Boolean) : []);
const uid = p => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const clean = n => String(n || "").replace(/\s*\(.*?\)\s*/g, "").replace(/\s+/g, " ").trim();
const same = (a, b) => { a = clean(a); b = clean(b); if (!a || !b) return false; if (a === b) return true; const A = a.split(" "), B = b.split(" "); return A.length > 1 && B.length > 1 && A[0] === B[0] && A[A.length - 1] === B[B.length - 1]; };
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const hij = k => { if (!k) return ""; try { const [y, m, d] = String(k).split("-").map(Number); return new Date(y, m - 1, d, 12).toLocaleDateString("ar-SA-u-ca-islamic-umalqura-nu-arab", { day: "numeric", month: "long" }); } catch { return k; } };
const when = ms => { try { const d = new Date(ms); return d.toLocaleDateString("ar-SA-u-ca-islamic-umalqura-nu-arab", { day: "numeric", month: "short" }) + " • " + d.toLocaleTimeString("ar-SA-u-nu-arab", { hour: "2-digit", minute: "2-digit" }); } catch { return ""; } };
const shrink = (file, max = 1280, q = 0.72) => new Promise(res => { const r = new FileReader(); r.onload = () => { const im = new Image(); im.onload = () => { const k = Math.min(1, max / Math.max(im.width, im.height)), c = document.createElement("canvas"); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k); c.getContext("2d").drawImage(im, 0, 0, c.width, c.height); res(c.toDataURL("image/jpeg", q)); }; im.onerror = () => res(null); im.src = r.result; }; r.onerror = () => res(null); r.readAsDataURL(file); });

export const TK_ST = {
  new: { t: "جديدة", c: "#475569", bg: "#f1f5f9", ic: "🆕" },
  run: { t: "قيد التنفيذ", c: "#1d4ed8", bg: "#dbeafe", ic: "⏳" },
  sub: { t: "بانتظار الاعتماد", c: "#7c3aed", bg: "#ede9fe", ic: "📤" },
  rev: { t: "مطلوب تعديل", c: "#c2410c", bg: "#ffedd5", ic: "🔁" },
  done: { t: "معتمدة", c: "#15803d", bg: "#dcfce7", ic: "✅" },
};
const PRI = { h: ["عالية", "#dc2626"], m: ["متوسطة", "#d97706"], l: ["عادية", "#64748b"] };
const SRC = { opp: ["🗂️", "الخطة التشغيلية"], ext: ["📋", "التقويم الخارجي"] };
const late = t => t.st !== "done" && t.due && t.due < today();
const lastFb = t => arr(t.fb).sort((a, b) => (b.at || 0) - (a.at || 0))[0];
const unreadFb = t => { const f = lastFb(t); return !!f && (f.at || 0) > (obj(t.seen).to || 0); };
const unreadUp = t => { const u = arr(t.ups).sort((a, b) => (b.at || 0) - (a.at || 0))[0]; return !!u && (u.at || 0) > (obj(t.seen).mgr || 0); };

const CSS = `.tk{direction:rtl;font-family:Tajawal,system-ui,sans-serif;color:#0f172a;display:grid;gap:12px}.tk *{box-sizing:border-box}
.tk-hero{border-radius:22px;padding:16px 18px;color:#fff;background:radial-gradient(circle at 12% 10%,rgba(201,162,39,.42),transparent 40%),linear-gradient(135deg,#0b2545,#1e3a8a 70%);border-bottom:4px solid #c9a227;position:relative;overflow:hidden}
.tk-hero:after{content:"";position:absolute;inset:0;background:repeating-linear-gradient(135deg,rgba(255,255,255,.05) 0 12px,transparent 12px 24px);pointer-events:none}
.tk-card{background:#fff;border:1px solid #e2e8f0;border-radius:18px;padding:12px 14px;box-shadow:0 2px 10px rgba(15,23,42,.04)}
.tk-btn{font:inherit;font-weight:800;border-radius:11px;border:1px solid #cbd5e1;background:#fff;color:#0b2545;padding:7px 13px;cursor:pointer;white-space:nowrap}.tk-btn.p{background:#0b2545;color:#fff;border-color:#0b2545}.tk-btn.g{background:#c9a227;border-color:#c9a227;color:#0b2545}.tk-btn.ok{background:#15803d;border-color:#15803d;color:#fff}.tk-btn.w{background:#c2410c;border-color:#c2410c;color:#fff}.tk-btn.r{color:#b91c1c;border-color:#fca5a5}.tk-btn.s{padding:4px 10px;font-size:12.5px;border-radius:9px}.tk-btn:disabled{opacity:.5;cursor:not-allowed}
.tk-inp{font:inherit;border:1px solid #cbd5e1;border-radius:10px;padding:7px 10px;background:#fff;width:100%}.tk-inp:focus{outline:2px solid #c9a227;border-color:#c9a227}
.tk-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px}.tk-kpi{border-radius:14px;padding:9px;text-align:center;border:1px solid #e2e8f0;background:#fff;cursor:pointer}.tk-kpi b{display:block;font-size:24px}.tk-kpi small{font-weight:800;font-size:12px}
.tk-pill{display:inline-flex;align-items:center;gap:3px;border-radius:999px;padding:2px 9px;font-size:12px;font-weight:800;border:1px solid transparent;white-space:nowrap}
.tk-bar{height:9px;border-radius:9px;background:#e2e8f0;overflow:hidden}.tk-bar i{display:block;height:100%;border-radius:9px;background:linear-gradient(90deg,#1e3a8a,#c9a227)}
.tk-list{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:10px}
.tk-t{background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:11px 12px;display:grid;gap:7px;cursor:pointer;text-align:right;font:inherit;transition:.15s;position:relative}.tk-t:hover{transform:translateY(-2px);box-shadow:0 10px 22px rgba(11,37,69,.12)}
.tk-t .dot{position:absolute;top:10px;left:10px;width:10px;height:10px;border-radius:50%;background:#dc2626;box-shadow:0 0 0 3px #fee2e2}
.tk-ppl{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:8px}.tk-pp{border:1px solid #e2e8f0;border-radius:14px;padding:9px 11px;background:linear-gradient(180deg,#fff,#f8fafc);cursor:pointer;display:grid;gap:5px}.tk-pp.on{border-color:#c9a227;box-shadow:0 0 0 2px #c9a227 inset}
.tk-modal{position:fixed;inset:0;background:rgba(2,6,23,.55);z-index:900;display:grid;place-items:center;padding:12px}.tk-dlg{background:#f8fafc;border-radius:20px;width:min(860px,100%);max-height:92vh;overflow:auto;display:grid;gap:10px;padding:14px;border-top:5px solid #c9a227}
.tk-tl{display:grid;gap:7px}.tk-tl>div{border-radius:12px;padding:8px 10px;font-size:13px;line-height:1.7}.tk-tl .u{background:#eff6ff;border-inline-start:4px solid #1d4ed8}.tk-tl .f{background:#fffbeb;border-inline-start:4px solid #c9a227}.tk-tl .f.fix{background:#fff7ed;border-color:#c2410c}.tk-tl .f.ok{background:#f0fdf4;border-color:#15803d}
.tk-ev{display:flex;gap:6px;flex-wrap:wrap;align-items:center}.tk-ev .th{position:relative;width:86px;height:64px;border-radius:10px;overflow:hidden;border:1.5px solid #c9a227;cursor:zoom-in}.tk-ev img{width:100%;height:100%;object-fit:cover}.tk-ev .x{position:absolute;top:2px;left:2px;border:0;border-radius:6px;background:rgba(0,0,0,.6);color:#fff;font:inherit;font-size:11px;cursor:pointer;padding:0 5px}
.tk-zoom{position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:950;display:grid;place-items:center}.tk-zoom img{max-width:95vw;max-height:90vh;border-radius:10px}
.tk-note{font-size:12.5px;color:#64748b;font-weight:700;line-height:1.7}.tk-star{font-size:20px;cursor:pointer;background:none;border:0;padding:0 1px;color:#cbd5e1}.tk-star.on{color:#c9a227}
.tk-chips{display:flex;gap:5px;flex-wrap:wrap}.tk-chip{font:inherit;font-size:12.5px;font-weight:800;border-radius:999px;border:1px solid #cbd5e1;background:#fff;padding:4px 10px;cursor:pointer}.tk-chip.on{background:#0b2545;color:#fff;border-color:#0b2545}
.tk-g2{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:8px}.tk-g2 label{display:grid;gap:3px;font-size:12.5px;font-weight:800;color:#334155}`;

const StP = ({ k }) => { const S = TK_ST[k] || TK_ST.new; return <span className="tk-pill" style={{ background: S.bg, color: S.c, borderColor: S.c + "55" }}>{S.ic} {S.t}</span>; };
const Bar = ({ v }) => <div className="tk-bar"><i style={{ width: Math.max(0, Math.min(100, v || 0)) + "%" }} /></div>;
function useTasks(api) {
  const [T, setT] = useState(null);
  const load = async () => setT(obj(await api.maGet(NODE)));
  useEffect(() => { load(); const iv = setInterval(load, 60000); return () => clearInterval(iv); }, []);
  const put = async (t) => { const v = { ...t, up: Date.now() }; setT(o => ({ ...o, [t.id]: v })); return api.maPut(`${NODE}/${t.id}`, v); };
  const del = async id => { setT(o => { const n = { ...o }; delete n[id]; return n; }); await api.maPut(`${NODE}/${id}`, null); await api.maPut(`${IMG}/${id}`, null); };
  return [T, put, del, load];
}
async function loadRefs(api, src) {
  if (src === "opp") return arr(await api.maGet("school-opp")).sort((a, b) => (a.ord || 0) - (b.ord || 0)).map(p => ({ id: p.id, t: p.t, d: p.dom || "", ex: p.ex || "", code: p.gn ? `${p.gn}-${p.on}` : "" }));
  try { const m = await import("./smart/ExtEval.jsx"); return (m.EXT_IND || []).map(I => ({ id: I.id, t: I.i, d: I.d + (I.s ? " • " + I.s : ""), code: m.codeOf ? m.codeOf(I) : "" })); } catch { return []; }
}

// ——— الشواهد (مشترك) ———
function Evidence({ api, t, edit, onCount, setZoom }) {
  const [L, setL] = useState(null), [busy, setBusy] = useState(false);
  useEffect(() => { if (t.ev) api.maGet(`${IMG}/${t.id}`).then(v => setL(arr(v))); else setL([]); }, [t.id]);
  const add = async files0 => { const files = Array.from(files0 || []); setBusy(true); const n = (L || []).slice(); for (const f of files) { if (n.length >= 8) break; const d = await shrink(f); if (d) n.push(d); } const ok = await api.maPut(`${IMG}/${t.id}`, n); setBusy(false); if (ok !== false) { setL(n); onCount(n.length); } };
  const rm = async j => { if (!window.confirm("حذف الشاهد؟")) return; const n = L.filter((_, i) => i !== j); await api.maPut(`${IMG}/${t.id}`, n.length ? n : null); setL(n); onCount(n.length); };
  if (!L) return <div className="tk-note">⏳ جارٍ تحميل الشواهد…</div>;
  return <div className="tk-ev">{L.map((s, j) => <div key={j} className="th" onClick={() => setZoom(s)}><img src={s} alt="" />{edit && <button className="x" onClick={e => { e.stopPropagation(); rm(j); }}>✕</button>}</div>)}
    {edit && L.length < 8 && <label className="tk-btn s g" style={{ cursor: "pointer" }}>{busy ? "⏳ جارٍ الرفع" : "📎 رفع شاهد"}<input type="file" accept="image/*" multiple hidden onChange={e => { add(e.target.files); e.target.value = ""; }} /></label>}
    {!L.length && !edit && <span className="tk-note">لا توجد شواهد مرفوعة.</span>}</div>;
}
const Timeline = ({ t }) => { const items = [...arr(t.ups).map(u => ({ ...u, k: "u" })), ...arr(t.fb).map(f => ({ ...f, k: "f" }))].sort((a, b) => (a.at || 0) - (b.at || 0));
  if (!items.length) return <div className="tk-note">لا توجد تحديثات بعد.</div>;
  return <div className="tk-tl">{items.map((x, i) => x.k === "u" ? <div key={i} className="u"><b>🛠️ {x.by}</b> <span className="tk-note">• {when(x.at)}{x.prog != null ? ` • الإنجاز ${ar(x.prog)}٪` : ""}</span><div>{x.t}</div></div>
    : <div key={i} className={`f ${x.kind || ""}`}><b>{x.kind === "ok" ? "✅ اعتماد" : x.kind === "fix" ? "🔁 طلب تعديل" : "💬 توجيه"} — {x.by}</b> <span className="tk-note">• {when(x.at)}</span>{x.rate ? <span style={{ color: GOLD, marginInlineStart: 6 }}>{"★".repeat(x.rate)}<span style={{ color: "#cbd5e1" }}>{"★".repeat(5 - x.rate)}</span></span> : null}<div>{x.t}</div></div>)}</div>; };

// ══════════════ لوحة المدير ══════════════
export function TaskBoard({ api, me, src }) {
  const by = (me && me.name) || "مدير المدرسة";
  const [T, put, del] = useTasks(api); const [refs, setRefs] = useState([]); const [staff, setStaff] = useState([]); const [names, setNames] = useState([]);
  const [who, setWho] = useState(""); const [fst, setFst] = useState(""); const [q, setQ] = useState(""); const [ed, setEd] = useState(null); const [view, setView] = useState(null); const [zoom, setZoom] = useState(null); const [toast, setToast] = useState(""); const [auto, setAuto] = useState(null);
  useEffect(() => { loadRefs(api, src).then(setRefs); (async () => { try { const s = arr(await api.staff()); setStaff(s.filter(x => x.name && x.role !== "principal").map(x => ({ name: clean(x.name), job: x.job || "", role: x.role }))); } catch {} try { setNames(await api.loadStaff()); } catch {} })(); }, [src]);
  const say = m => { setToast(m); setTimeout(() => setToast(""), 2600); };
  if (!T) return <div className="tk"><style>{CSS}</style><div className="tk-card tk-note" style={{ textAlign: "center" }}>⏳ جارٍ تحميل المهام…</div></div>;
  const all = Object.values(T).filter(t => t && t.id && t.src === src);
  const people = [...new Set([...staff.map(s => s.name), ...all.map(t => t.to)])].filter(Boolean);
  const per = people.map(n => { const L = all.filter(t => t.to === n); return { n, job: (staff.find(s => s.name === n) || {}).job || "", L, prog: L.length ? Math.round(L.reduce((a, t) => a + (t.st === "done" ? 100 : t.prog || 0), 0) / L.length) : 0, late: L.filter(late).length, sub: L.filter(t => t.st === "sub").length }; }).filter(p => p.L.length || staff.some(s => s.name === p.n)).sort((a, b) => b.L.length - a.L.length);
  const FL = all.filter(t => (!who || t.to === who) && (!fst || (fst === "late" ? late(t) : t.st === fst)) && (!q || (t.title + t.refT + t.to).includes(q))).sort((a, b) => ({ sub: 0, rev: 2, run: 3, new: 4, done: 9 }[a.st] ?? 5) - ({ sub: 0, rev: 2, run: 3, new: 4, done: 9 }[b.st] ?? 5) || (late(b) - late(a)) || (b.up || 0) - (a.up || 0));
  const avg = all.length ? Math.round(all.reduce((a, t) => a + (t.st === "done" ? 100 : t.prog || 0), 0) / all.length) : 0;
  const covered = new Set(all.map(t => t.ref)).size;
  const cnt = k => all.filter(t => t.st === k).length;
  const openView = async t => { setView(t); if (unreadUp(t)) await put({ ...t, seen: { ...obj(t.seen), mgr: Date.now() } }); };

  const autoPlan = () => { const L = []; refs.forEach(r => { if (!r.ex || all.some(t => t.ref === r.id)) return; const p = people.find(n => String(r.ex).split(/[،,\/و-]| و /).some(x => same(x, n))) || people.find(n => String(r.ex).includes(clean(n).split(" ")[0]) && String(r.ex).includes(clean(n).split(" ").slice(-1)[0])); if (p) L.push({ r, to: p, on: true }); }); setAuto(L); };
  const runAuto = async () => { const L = auto.filter(x => x.on); for (const x of L) await put({ id: uid("t"), src, ref: x.r.id, refT: x.r.t, refD: x.r.d, code: x.r.code, to: x.to, title: `تنفيذ برنامج: ${x.r.t}`, det: "", due: "", pri: "m", st: "new", prog: 0, ups: {}, fb: {}, seen: {}, ev: 0, by, at: Date.now() }); setAuto(null); say(`✅ أُسندت ${ar(L.length)} مهمة`); };

  const printRep = () => { const w = window.open("", "_blank"); if (!w) return; const P = per.filter(p => p.L.length);
    w.document.write(`<html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>تقرير متابعة مهام ${SRC[src][1]}</title><link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;800&display=swap" rel="stylesheet"><style>@page{size:A4;margin:10mm}body{font-family:Tajawal,Arial;font-size:11px;color:#111;-webkit-print-color-adjust:exact;print-color-adjust:exact}.hd{display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid ${GOLD};padding-bottom:6px;margin-bottom:8px}.hd img{height:54px}h1{font-size:17px;color:${NAVY};text-align:center;margin:6px 0}h2{font-size:13px;color:#fff;background:${NAVY};padding:5px 10px;border-radius:6px;margin:10px 0 4px;display:flex;justify-content:space-between}table{width:100%;border-collapse:collapse}th{background:#e2e8f0;border:1px solid #64748b;padding:4px}td{border:1px solid #94a3b8;padding:4px;vertical-align:top}.c{text-align:center}.b{height:8px;background:#e2e8f0;border-radius:6px;overflow:hidden}.b i{display:block;height:100%;background:linear-gradient(90deg,${NAVY},${GOLD})}.s{display:inline-block;border-radius:9px;padding:1px 7px;font-weight:800}.sig{margin-top:18px;display:flex;justify-content:space-between;font-weight:800}</style></head><body>
      <div class="hd"><div><b>المملكة العربية السعودية</b><br>وزارة التعليم<br>${esc(api.school || "")}</div>${api.moeLogo ? `<img src="${api.moeLogo}">` : ""}</div>
      <h1>تقرير متابعة توزيع مهام ${SRC[src][1]}</h1><div style="text-align:center;font-weight:800">إجمالي المهام ${ar(all.length)} • المعتمدة ${ar(cnt("done"))} • المتأخرة ${ar(all.filter(late).length)} • نسبة الإنجاز العامة ${ar(avg)}٪</div>
      ${P.map(p => `<h2><span>👤 ${esc(p.n)}${p.job ? ` — ${esc(p.job)}` : ""}</span><span>${ar(p.L.length)} مهام • الإنجاز ${ar(p.prog)}٪</span></h2><table><tr><th style="width:4%">م</th><th>المهمة / ${src === "opp" ? "البرنامج" : "المؤشر"}</th><th style="width:12%">الموعد</th><th style="width:16%">الإنجاز</th><th style="width:13%">الحالة</th><th style="width:26%">آخر تغذية راجعة</th></tr>${p.L.map((t, i) => { const S = TK_ST[t.st] || TK_ST.new, f = lastFb(t); return `<tr><td class="c">${ar(i + 1)}</td><td><b>${esc(t.title)}</b><br><small>${esc(t.refT)}</small></td><td class="c">${t.due ? esc(hij(t.due)) : "—"}${late(t) ? `<br><b style="color:#dc2626">متأخرة</b>` : ""}</td><td><div class="b"><i style="width:${t.st === "done" ? 100 : t.prog || 0}%"></i></div><div class="c">${ar(t.st === "done" ? 100 : t.prog || 0)}٪</div></td><td class="c"><span class="s" style="background:${S.bg};color:${S.c}">${S.t}</span></td><td>${f ? esc(f.t) : "—"}</td></tr>`; }).join("")}</table>`).join("")}
      <div class="sig"><span>مدير المدرسة: ${esc(by)}</span><span>التوقيع: ..................</span></div><script>setTimeout(()=>print(),700)<\/script></body></html>`); w.document.close(); };

  return <div className="tk"><style>{CSS}</style>{zoom && <div className="tk-zoom" onClick={() => setZoom(null)}><img src={zoom} alt="" /></div>}
    <datalist id="tk-names">{[...new Set([...people, ...names.map(clean)])].map(n => <option key={n} value={n} />)}</datalist>
    <div className="tk-hero"><div style={{ position: "relative", zIndex: 1, display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
      <div style={{ width: 84, height: 84, borderRadius: "50%", display: "grid", placeItems: "center", background: `conic-gradient(${GOLD} ${avg * 3.6}deg,rgba(255,255,255,.18) 0)` }}><div style={{ width: 66, height: 66, borderRadius: "50%", background: NAVY, display: "grid", placeItems: "center", fontWeight: 900, fontSize: 19 }}>{ar(avg)}٪</div></div>
      <div style={{ flex: "1 1 260px" }}><div style={{ fontSize: 12.5, fontWeight: 800, opacity: .85 }}>{SRC[src][0]} {SRC[src][1]}</div><b style={{ fontSize: 21 }}>توزيع مهام التنفيذ ومتابعتها</b><div style={{ fontSize: 13, fontWeight: 700, opacity: .9 }}>{ar(all.length)} مهمة لـ {ar(per.filter(p => p.L.length).length)} من الإداريين • تغطي {ar(covered)} من {ar(refs.length)} {src === "opp" ? "برنامجاً" : "مؤشراً"}</div></div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}><button className="tk-btn g" onClick={() => setEd({})}>➕ إسناد مهمة</button>{src === "opp" && <button className="tk-btn" onClick={autoPlan}>⚡ توزيع حسب المنفذ في الخطة</button>}<button className="tk-btn" disabled={!all.length} onClick={printRep}>🖨️ تقرير المتابعة</button></div></div></div>
    {toast && <div className="tk-card" style={{ background: "#ecfdf5", borderColor: "#a7f3d0", fontWeight: 800, color: "#065f46" }}>{toast}</div>}
    <div className="tk-kpis">{Object.entries(TK_ST).map(([k, S]) => <div key={k} className="tk-kpi" style={{ background: fst === k ? S.bg : "#fff", borderColor: fst === k ? S.c : "#e2e8f0" }} onClick={() => setFst(fst === k ? "" : k)}><b style={{ color: S.c }}>{ar(cnt(k))}</b><small style={{ color: S.c }}>{S.ic} {S.t}</small></div>)}<div className="tk-kpi" style={{ background: fst === "late" ? "#fee2e2" : "#fff", borderColor: fst === "late" ? "#dc2626" : "#e2e8f0" }} onClick={() => setFst(fst === "late" ? "" : "late")}><b style={{ color: "#dc2626" }}>{ar(all.filter(late).length)}</b><small style={{ color: "#dc2626" }}>⚠️ متأخرة</small></div></div>
    <div className="tk-card"><b style={{ color: NAVY }}>👥 تقدّم الإداريين</b><span className="tk-note"> — اضغط على اسم لعرض مهامه</span>
      <div className="tk-ppl" style={{ marginTop: 8 }}>{per.map(p => <div key={p.n} className={`tk-pp${who === p.n ? " on" : ""}`} onClick={() => setWho(who === p.n ? "" : p.n)}><div style={{ display: "flex", justifyContent: "space-between", gap: 6 }}><b style={{ color: NAVY }}>👤 {p.n}</b><b style={{ color: GOLD }}>{ar(p.prog)}٪</b></div>{p.job && <span className="tk-note" style={{ marginTop: -4 }}>{p.job}</span>}<Bar v={p.prog} /><div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}><span className="tk-pill" style={{ background: "#eef2ff", color: "#3730a3" }}>📌 {ar(p.L.length)}</span><span className="tk-pill" style={{ background: "#dcfce7", color: "#15803d" }}>✅ {ar(p.L.filter(t => t.st === "done").length)}</span>{p.sub > 0 && <span className="tk-pill" style={{ background: "#ede9fe", color: "#7c3aed" }}>📤 {ar(p.sub)}</span>}{p.late > 0 && <span className="tk-pill" style={{ background: "#fee2e2", color: "#dc2626" }}>⚠️ {ar(p.late)}</span>}</div></div>)}
        {!per.length && <div className="tk-note">لم تُضف أسماء الإداريين بعد في «الإداريون والموظفون». يمكنك كتابة أي اسم عند الإسناد.</div>}</div></div>
    <div className="tk-card" style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}><input className="tk-inp" style={{ flex: "1 1 200px", width: "auto" }} placeholder="🔎 بحث في المهام" value={q} onChange={e => setQ(e.target.value)} />{(who || fst) && <button className="tk-btn s" onClick={() => { setWho(""); setFst(""); }}>✕ إلغاء التصفية</button>}<span className="tk-note">{ar(FL.length)} مهمة معروضة — المرفوعة للاعتماد أولًا</span></div>
    {!FL.length ? <div className="tk-card tk-note" style={{ textAlign: "center" }}>{all.length ? "لا توجد مهام مطابقة." : "لم تُسند مهام بعد. ابدأ بـ «➕ إسناد مهمة»" + (src === "opp" ? " أو «⚡ توزيع حسب المنفذ في الخطة»." : ".")}</div>
      : <div className="tk-list">{FL.map(t => <button key={t.id} className="tk-t" style={{ borderTop: `4px solid ${(TK_ST[t.st] || TK_ST.new).c}` }} onClick={() => openView(t)}>{(unreadUp(t) || t.st === "sub") && <span className="dot" title="تحديث جديد" />}
        <div className="tk-note" style={{ color: "#a16207" }}>{t.code ? `${t.code} • ` : ""}{t.refT}</div><b style={{ color: NAVY, fontSize: 14.5, lineHeight: 1.5 }}>{t.title}</b>
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", alignItems: "center" }}><StP k={t.st} />{late(t) && <span className="tk-pill" style={{ background: "#fee2e2", color: "#dc2626" }}>⚠️ متأخرة</span>}<span className="tk-pill" style={{ color: PRI[t.pri || "m"][1], borderColor: PRI[t.pri || "m"][1] + "55" }}>● {PRI[t.pri || "m"][0]}</span>{t.ev > 0 && <span className="tk-pill" style={{ background: "#fef9c3", color: "#854d0e" }}>📎 {ar(t.ev)}</span>}</div>
        <Bar v={t.st === "done" ? 100 : t.prog} /><div className="tk-note" style={{ display: "flex", justifyContent: "space-between" }}><span>👤 {t.to}</span><span>{ar(t.st === "done" ? 100 : t.prog || 0)}٪{t.due ? ` • ${hij(t.due)}` : ""}</span></div></button>)}</div>}

    {ed && <TaskEdit api={api} src={src} refs={refs} people={people} staff={staff} t={ed} by={by} onClose={() => setEd(null)} onSave={async (v, many) => { for (const x of many) await put(x); setEd(null); say(many.length > 1 ? `✅ أُسندت ${ar(many.length)} مهام` : "✅ تم حفظ المهمة"); }} />}
    {view && <MgrView api={api} t={T[view.id] || view} by={by} put={put} setZoom={setZoom} onEdit={() => { setEd(T[view.id] || view); setView(null); }} onDel={async () => { if (!window.confirm("حذف المهمة وشواهدها؟")) return; await del(view.id); setView(null); say("🗑️ حُذفت المهمة"); }} onClose={() => setView(null)} />}
    {auto && <div className="tk-modal" onClick={() => setAuto(null)}><div className="tk-dlg" onClick={e => e.stopPropagation()}><b style={{ fontSize: 17, color: NAVY }}>⚡ توزيع المهام حسب المنفذ المكتوب في الخطة</b>
      <div className="tk-note">طابقت عمود «المنفذ» في برامج الخطة مع أسماء الإداريين، للبرامج التي لم تُسند بعد. أزل الإشارة عمّا لا تريده أو غيّر الاسم.</div>
      {!auto.length ? <div className="tk-card tk-note">لم أجد برامج غير مسندة يطابق منفذها اسم إداري. استخدم «➕ إسناد مهمة» واختر عدة برامج دفعة واحدة.</div> : <div className="tk-card" style={{ display: "grid", gap: 6 }}>{auto.map((x, i) => <div key={x.r.id} style={{ display: "grid", gridTemplateColumns: "26px 1fr 200px", gap: 8, alignItems: "center" }}><input type="checkbox" checked={x.on} onChange={e => setAuto(a => a.map((y, j) => j === i ? { ...y, on: e.target.checked } : y))} /><div><b style={{ fontSize: 13.5 }}>{x.r.t}</b><div className="tk-note">المنفذ في الخطة: {x.r.ex}</div></div><input className="tk-inp" list="tk-names" value={x.to} onChange={e => setAuto(a => a.map((y, j) => j === i ? { ...y, to: e.target.value } : y))} /></div>)}</div>}
      <div style={{ display: "flex", gap: 8 }}><button className="tk-btn p" disabled={!auto.some(x => x.on && x.to)} onClick={runAuto}>✅ إسناد {ar(auto.filter(x => x.on).length)} مهمة</button><button className="tk-btn" onClick={() => setAuto(null)}>إلغاء</button></div></div></div>}
  </div>;
}

function TaskEdit({ src, refs, people, staff, t, by, onClose, onSave }) {
  const isNew = !t.id; const [v, setV] = useState({ title: "", det: "", due: "", pri: "m", to: "", ...t }); const [sel, setSel] = useState(t.ref ? [t.ref] : []); const [rq, setRq] = useState(""); const [tos, setTos] = useState(t.to ? [t.to] : []);
  const R = refs.filter(r => !rq || (r.t + r.d + r.code).includes(rq)).slice(0, 60);
  const ok = sel.length && (isNew ? tos.length : v.to) ;
  const save = () => { const now = Date.now(); if (!isNew) { const r = refs.find(x => x.id === sel[0]) || { id: t.ref, t: t.refT, d: t.refD, code: t.code }; return onSave(null, [{ ...t, ...v, ref: r.id, refT: r.t, refD: r.d, code: r.code || "" }]); }
    const many = []; sel.forEach(id => { const r = refs.find(x => x.id === id); tos.forEach(to => many.push({ id: uid("t"), src, ref: r.id, refT: r.t, refD: r.d, code: r.code || "", to, title: v.title.trim() || (src === "opp" ? `تنفيذ برنامج: ${r.t}` : `استكمال شواهد المؤشر: ${r.t}`), det: v.det, due: v.due, pri: v.pri, st: "new", prog: 0, ups: {}, fb: {}, seen: {}, ev: 0, by, at: now })); }); onSave(null, many); };
  return <div className="tk-modal" onClick={onClose}><div className="tk-dlg" onClick={e => e.stopPropagation()}>
    <b style={{ fontSize: 17, color: NAVY }}>{isNew ? "➕ إسناد مهمة تنفيذ" : "✏️ تعديل المهمة"}</b>
    <div className="tk-card" style={{ display: "grid", gap: 6 }}><b>{src === "opp" ? "🗂️ البرنامج من الخطة التشغيلية" : "📋 المؤشر من التقويم الخارجي"} {isNew && <span className="tk-note">(يمكن اختيار أكثر من واحد)</span>}</b>
      <input className="tk-inp" placeholder="🔎 ابحث" value={rq} onChange={e => setRq(e.target.value)} />
      <div style={{ maxHeight: 220, overflow: "auto", display: "grid", gap: 4 }}>{R.map(r => { const on = sel.includes(r.id); return <label key={r.id} style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "5px 8px", borderRadius: 10, background: on ? "#eef2ff" : "#fff", border: `1px solid ${on ? "#6366f1" : "#e2e8f0"}`, cursor: "pointer" }}><input type={isNew ? "checkbox" : "radio"} checked={on} onChange={() => setSel(isNew ? (on ? sel.filter(x => x !== r.id) : [...sel, r.id]) : [r.id])} /><span><b style={{ fontSize: 13.5 }}>{r.code ? `${r.code} • ` : ""}{r.t}</b><div className="tk-note">{r.d}{r.ex ? ` • المنفذ: ${r.ex}` : ""}</div></span></label>; })}{!refs.length && <div className="tk-note">لا توجد {src === "opp" ? "برامج في الخطة بعد — أضفها من تبويب البرامج" : "مؤشرات"}.</div>}</div></div>
    <div className="tk-card" style={{ display: "grid", gap: 6 }}><b>👤 المكلّف بالتنفيذ {isNew && <span className="tk-note">(يمكن اختيار أكثر من إداري)</span>}</b>
      <div className="tk-chips">{people.map(n => { const on = isNew ? tos.includes(n) : v.to === n; return <button key={n} className={`tk-chip${on ? " on" : ""}`} onClick={() => isNew ? setTos(on ? tos.filter(x => x !== n) : [...tos, n]) : setV({ ...v, to: n })}>{n}{(staff.find(s => s.name === n) || {}).job ? <small style={{ opacity: .7 }}> • {staff.find(s => s.name === n).job}</small> : null}</button>; })}</div>
      <input className="tk-inp" list="tk-names" placeholder="أو اكتب اسمًا ثم Enter" onKeyDown={e => { const n = clean(e.target.value); if (e.key === "Enter" && n) { isNew ? setTos([...new Set([...tos, n])]) : setV({ ...v, to: n }); e.target.value = ""; } }} />{isNew && tos.filter(n => !people.includes(n)).map(n => <span key={n} className="tk-chip on" onClick={() => setTos(tos.filter(x => x !== n))}>{n} ✕</span>)}</div>
    <div className="tk-card tk-g2"><label style={{ gridColumn: "1/-1" }}>عنوان المهمة <span className="tk-note">(اتركه فارغًا ليُكتب تلقائيًا)</span><input className="tk-inp" value={v.title} onChange={e => setV({ ...v, title: e.target.value })} placeholder={src === "opp" ? "تنفيذ برنامج: …" : "استكمال شواهد المؤشر: …"} /></label>
      <label style={{ gridColumn: "1/-1" }}>المطلوب تنفيذه بالتفصيل<textarea className="tk-inp" rows={3} value={v.det} onChange={e => setV({ ...v, det: e.target.value })} placeholder="مثال: إعداد خطة البرنامج، تنفيذ ٣ لقاءات، رفع التقرير والصور، تحديث المؤشر…" /></label>
      <label>موعد الإنجاز<input className="tk-inp" type="date" value={v.due} onChange={e => setV({ ...v, due: e.target.value })} /></label>
      <label>الأولوية<div className="tk-chips">{Object.entries(PRI).map(([k, [l, c]]) => <button key={k} className={`tk-chip${v.pri === k ? " on" : ""}`} style={v.pri === k ? { background: c, borderColor: c } : null} onClick={() => setV({ ...v, pri: k })}>{l}</button>)}</div></label></div>
    <div style={{ display: "flex", gap: 8 }}><button className="tk-btn p" disabled={!ok} onClick={save}>{isNew ? `✅ إسناد ${ar(Math.max(1, sel.length * tos.length))} مهمة` : "💾 حفظ"}</button><button className="tk-btn" onClick={onClose}>إلغاء</button></div>
  </div></div>;
}

function MgrView({ api, t, by, put, setZoom, onEdit, onDel, onClose }) {
  const [txt, setTxt] = useState(""), [rate, setRate] = useState(0);
  const send = async kind => { if (!txt.trim() && kind !== "ok") return; const k = uid("f"); const f = { at: Date.now(), by, t: txt.trim() || "تم الاعتماد، شكرًا على الإنجاز.", rate: rate || null, kind }; await put({ ...t, fb: { ...obj(t.fb), [k]: f }, st: kind === "ok" ? "done" : kind === "fix" ? "rev" : t.st, prog: kind === "ok" ? 100 : t.prog, seen: { ...obj(t.seen), mgr: Date.now() } }); setTxt(""); setRate(0); };
  const S = TK_ST[t.st] || TK_ST.new;
  return <div className="tk-modal" onClick={onClose}><div className="tk-dlg" onClick={e => e.stopPropagation()}>
    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}><div><div className="tk-note" style={{ color: "#a16207" }}>{SRC[t.src][0]} {t.code ? `${t.code} • ` : ""}{t.refT}</div><b style={{ fontSize: 17, color: NAVY }}>{t.title}</b></div><div style={{ display: "flex", gap: 6, alignItems: "start" }}><button className="tk-btn s" onClick={onEdit}>✏️ تعديل</button><button className="tk-btn s r" onClick={onDel}>🗑️</button><button className="tk-btn s" onClick={onClose}>✕</button></div></div>
    <div className="tk-card" style={{ display: "grid", gap: 6 }}><div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}><StP k={t.st} /><span className="tk-pill" style={{ background: "#eef2ff", color: "#3730a3" }}>👤 {t.to}</span>{t.due && <span className="tk-pill" style={{ background: late(t) ? "#fee2e2" : "#f1f5f9", color: late(t) ? "#dc2626" : "#334155" }}>📅 {hij(t.due)}{late(t) ? " • متأخرة" : ""}</span>}<span className="tk-pill" style={{ color: PRI[t.pri || "m"][1] }}>● أولوية {PRI[t.pri || "m"][0]}</span></div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, alignItems: "center" }}><Bar v={t.st === "done" ? 100 : t.prog} /><b style={{ color: S.c }}>{ar(t.st === "done" ? 100 : t.prog || 0)}٪</b></div>
      {t.det && <div style={{ fontSize: 13.5, lineHeight: 1.8, whiteSpace: "pre-wrap" }}><b>المطلوب: </b>{t.det}</div>}</div>
    <div className="tk-card"><b style={{ color: NAVY }}>📎 الشواهد المرفوعة</b><div style={{ marginTop: 6 }}><Evidence api={api} t={t} setZoom={setZoom} onCount={() => {}} /></div></div>
    <div className="tk-card"><b style={{ color: NAVY }}>🕘 سجل التنفيذ والتغذية الراجعة</b><div style={{ marginTop: 6 }}><Timeline t={t} /></div></div>
    <div className="tk-card" style={{ display: "grid", gap: 6, borderTop: `4px solid ${GOLD}` }}><b style={{ color: NAVY }}>💬 تغذية راجعة للمكلّف</b>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}><span className="tk-note">التقييم:</span>{[1, 2, 3, 4, 5].map(i => <button key={i} className={`tk-star${i <= rate ? " on" : ""}`} onClick={() => setRate(rate === i ? 0 : i)}>★</button>)}</div>
      <textarea className="tk-inp" rows={3} value={txt} onChange={e => setTxt(e.target.value)} placeholder="اكتب ملاحظتك: نقاط القوة، ما يحتاج استكمالًا، توجيه للخطوة القادمة…" />
      <div className="tk-chips">{["أحسنت، عمل متميز ومكتمل الشواهد.", "نأمل إرفاق شواهد أوضح (صور، محضر، كشف حضور).", "يرجى تحديث نسبة الإنجاز وكتابة ما تم تنفيذه.", "نأمل الإسراع؛ الموعد قريب.", "التنفيذ جيد، ونحتاج قياس أثر البرنامج على المؤشر."].map(s => <button key={s} className="tk-chip" onClick={() => setTxt(s)}>{s}</button>)}</div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}><button className="tk-btn ok" onClick={() => send("ok")}>✅ اعتماد المهمة</button><button className="tk-btn w" disabled={!txt.trim()} onClick={() => send("fix")}>🔁 إعادة للتعديل</button><button className="tk-btn p" disabled={!txt.trim()} onClick={() => send("note")}>💬 إرسال توجيه</button></div></div>
  </div></div>;
}

// ══════════════ «مهامي» للإداري ══════════════
export function MyTasks({ api, me }) {
  const name = clean(me && me.name); const [T, put] = useTasks(api); const [view, setView] = useState(null); const [zoom, setZoom] = useState(null); const [f, setF] = useState("open");
  if (!T) return <div className="tk"><style>{CSS}</style><div className="tk-card tk-note" style={{ textAlign: "center" }}>⏳ جارٍ تحميل مهامك…</div></div>;
  const mine = Object.values(T).filter(t => t && t.id && same(t.to, name));
  const L = mine.filter(t => f === "all" ? true : f === "done" ? t.st === "done" : t.st !== "done").sort((a, b) => (unreadFb(b) - unreadFb(a)) || ({ rev: 0, new: 1, run: 2, sub: 3, done: 9 }[a.st] ?? 5) - ({ rev: 0, new: 1, run: 2, sub: 3, done: 9 }[b.st] ?? 5) || String(a.due || "9").localeCompare(String(b.due || "9")));
  const avg = mine.length ? Math.round(mine.reduce((a, t) => a + (t.st === "done" ? 100 : t.prog || 0), 0) / mine.length) : 0;
  const open = async t => { setView(t); if (unreadFb(t)) await put({ ...t, seen: { ...obj(t.seen), to: Date.now() } }); };
  return <div className="tk"><style>{CSS}</style>{zoom && <div className="tk-zoom" onClick={() => setZoom(null)}><img src={zoom} alt="" /></div>}
    <div className="tk-hero"><div style={{ position: "relative", zIndex: 1, display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}><div style={{ width: 78, height: 78, borderRadius: "50%", display: "grid", placeItems: "center", background: `conic-gradient(${GOLD} ${avg * 3.6}deg,rgba(255,255,255,.18) 0)` }}><div style={{ width: 62, height: 62, borderRadius: "50%", background: NAVY, display: "grid", placeItems: "center", fontWeight: 900, fontSize: 18 }}>{ar(avg)}٪</div></div>
      <div><b style={{ fontSize: 20 }}>📌 مهامي في الخطة التشغيلية والتقويم الخارجي</b><div style={{ fontSize: 13, fontWeight: 700, opacity: .9 }}>{ar(mine.length)} مهمة • {ar(mine.filter(t => t.st === "done").length)} معتمدة • {ar(mine.filter(late).length)} متأخرة</div></div></div></div>
    <div className="tk-chips">{[["open", "المفتوحة"], ["done", "المعتمدة"], ["all", "الكل"]].map(([k, l]) => <button key={k} className={`tk-chip${f === k ? " on" : ""}`} onClick={() => setF(k)}>{l}</button>)}</div>
    {!L.length ? <div className="tk-card tk-note" style={{ textAlign: "center" }}>{mine.length ? "لا توجد مهام هنا." : "لا توجد مهام مسندة إليك حاليًا."}</div>
      : <div className="tk-list">{L.map(t => <button key={t.id} className="tk-t" style={{ borderTop: `4px solid ${(TK_ST[t.st] || TK_ST.new).c}` }} onClick={() => open(t)}>{unreadFb(t) && <span className="dot" title="تغذية راجعة جديدة" />}
        <div className="tk-note" style={{ color: "#a16207" }}>{SRC[t.src][0]} {SRC[t.src][1]} • {t.refT}</div><b style={{ color: NAVY, fontSize: 14.5, lineHeight: 1.5 }}>{t.title}</b>
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}><StP k={t.st} />{late(t) && <span className="tk-pill" style={{ background: "#fee2e2", color: "#dc2626" }}>⚠️ متأخرة</span>}{unreadFb(t) && <span className="tk-pill" style={{ background: "#fef3c7", color: "#92400e" }}>💬 ملاحظة جديدة من المدير</span>}</div>
        <Bar v={t.st === "done" ? 100 : t.prog} /><div className="tk-note" style={{ display: "flex", justifyContent: "space-between" }}><span>{ar(t.st === "done" ? 100 : t.prog || 0)}٪</span><span>{t.due ? `📅 ${hij(t.due)}` : ""}</span></div></button>)}</div>}
    {view && <MyView api={api} t={T[view.id] || view} name={me.name} put={put} setZoom={setZoom} onClose={() => setView(null)} />}
  </div>;
}

function MyView({ api, t, name, put, setZoom, onClose }) {
  const [prog, setProg] = useState(t.prog || 0), [txt, setTxt] = useState(""), [busy, setBusy] = useState(false); const done = t.st === "done";
  const update = async submit => { setBusy(true); const k = uid("u"); const p = submit ? 100 : prog; const u = { at: Date.now(), by: name, t: txt.trim() || (submit ? "تم الانتهاء من التنفيذ ورفع الشواهد، أرجو الاعتماد." : `تحديث نسبة الإنجاز إلى ${p}٪`), prog: p };
    await put({ ...t, prog: p, st: submit ? "sub" : p > 0 ? "run" : t.st === "rev" ? "rev" : t.st, ups: { ...obj(t.ups), [k]: u } }); setTxt(""); setProg(p); setBusy(false); };
  const f = lastFb(t);
  return <div className="tk-modal" onClick={onClose}><div className="tk-dlg" onClick={e => e.stopPropagation()}>
    <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}><div><div className="tk-note" style={{ color: "#a16207" }}>{SRC[t.src][0]} {t.refT}</div><b style={{ fontSize: 17, color: NAVY }}>{t.title}</b></div><button className="tk-btn s" onClick={onClose}>✕</button></div>
    <div className="tk-card" style={{ display: "grid", gap: 6 }}><div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}><StP k={t.st} />{t.due && <span className="tk-pill" style={{ background: late(t) ? "#fee2e2" : "#f1f5f9", color: late(t) ? "#dc2626" : "#334155" }}>📅 الموعد: {hij(t.due)}</span>}<span className="tk-pill" style={{ color: PRI[t.pri || "m"][1] }}>● أولوية {PRI[t.pri || "m"][0]}</span><span className="tk-pill" style={{ background: "#f1f5f9" }}>أسندها: {t.by}</span></div>
      {t.det && <div style={{ fontSize: 13.5, lineHeight: 1.8, whiteSpace: "pre-wrap" }}><b>المطلوب: </b>{t.det}</div>}</div>
    {f && <div className="tk-card" style={{ background: f.kind === "fix" ? "#fff7ed" : f.kind === "ok" ? "#f0fdf4" : "#fffbeb", borderColor: f.kind === "fix" ? "#fdba74" : f.kind === "ok" ? "#86efac" : "#fde68a" }}><b>{f.kind === "ok" ? "✅ اعتمد المدير المهمة" : f.kind === "fix" ? "🔁 المدير يطلب تعديلًا" : "💬 توجيه من المدير"}</b>{f.rate ? <span style={{ color: GOLD, marginInlineStart: 6 }}>{"★".repeat(f.rate)}</span> : null}<div style={{ marginTop: 4, lineHeight: 1.8 }}>{f.t}</div><div className="tk-note">{when(f.at)}</div></div>}
    {!done && <div className="tk-card" style={{ display: "grid", gap: 8, borderTop: `4px solid #1d4ed8` }}><b style={{ color: NAVY }}>🛠️ تحديث التنفيذ</b>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 60px", gap: 10, alignItems: "center" }}><input type="range" min={0} max={100} step={5} value={prog} onChange={e => setProg(+e.target.value)} /><b style={{ color: "#1d4ed8", fontSize: 18 }}>{ar(prog)}٪</b></div>
      <textarea className="tk-inp" rows={3} value={txt} onChange={e => setTxt(e.target.value)} placeholder="ماذا نفذت؟ (مثال: نُفّذ اللقاء الأول بحضور ٤٥ طالبًا، وأُعدّ التقرير…)" />
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}><button className="tk-btn p" disabled={busy} onClick={() => update(false)}>💾 حفظ التحديث</button><button className="tk-btn ok" disabled={busy || t.st === "sub"} onClick={() => update(true)}>📤 تسليم للاعتماد</button>{t.st === "sub" && <span className="tk-note">✓ سُلّمت وتنتظر اعتماد المدير</span>}</div></div>}
    <div className="tk-card"><b style={{ color: NAVY }}>📎 الشواهد</b> <span className="tk-note">صور التنفيذ، المحاضر، الكشوف، التقارير (حتى ٨ صور)</span><div style={{ marginTop: 6 }}><Evidence api={api} t={t} edit={!done} setZoom={setZoom} onCount={n => put({ ...t, ev: n })} /></div></div>
    <div className="tk-card"><b style={{ color: NAVY }}>🕘 السجل</b><div style={{ marginTop: 6 }}><Timeline t={t} /></div></div>
  </div></div>;
}

// ——— شريط تنبيه في البوابة ———
export function TaskBanner({ api, me, onOpen }) {
  const [n, setN] = useState(null);
  useEffect(() => { (async () => { const T = obj(await api.maGet(NODE)); const name = clean(me && me.name); const mine = Object.values(T).filter(t => t && t.id && same(t.to, name)); setN({ open: mine.filter(t => t.st !== "done" && t.st !== "sub").length, fb: mine.filter(unreadFb).length, late: mine.filter(late).length }); })().catch(() => {}); }, []);
  if (!n || (!n.open && !n.fb)) return null;
  return <button type="button" onClick={onOpen} style={{ width: "100%", border: "none", cursor: "pointer", fontFamily: "Tajawal,inherit", textAlign: "right", borderRadius: 16, padding: "11px 14px", margin: "6px 0", color: "#fff", background: `linear-gradient(135deg,${NAVY},#1e3a8a 65%,${GOLD})`, display: "flex", gap: 10, alignItems: "center", direction: "rtl" }}>
    <span style={{ fontSize: 26 }}>📌</span><span style={{ flex: 1 }}><b style={{ display: "block", fontSize: 15 }}>لديك {ar(n.open)} مهمة تنفيذ مفتوحة{n.late ? ` (${ar(n.late)} متأخرة)` : ""}</b><small style={{ fontWeight: 700, opacity: .92 }}>{n.fb ? `💬 ${ar(n.fb)} تغذية راجعة جديدة من المدير • ` : ""}الخطة التشغيلية والتقويم الخارجي</small></span><b>←</b></button>;
}
