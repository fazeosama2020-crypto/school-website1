// ══════════════════════════════════════════════════════════════════════════════
// ⭐ تخصيص الواجهة لكل مستخدم: المفضلة • إخفاء الأقسام غير المستعملة • دليل الاستخدام في أول دخول
//   school-ui/{userKey} = { fav:[id...], hide:[id...], tour: وقت إنهاء الدليل }   (+ نسخة في المتصفح للفتح الفوري)
// ══════════════════════════════════════════════════════════════════════════════
import React, { useState, useEffect, useMemo } from "react";

const NAVY = "#0b2545", GOLD = "#c9a227";
const ar = n => String(n ?? "").replace(/\d/g, d => "٠١٢٣٤٥٦٧٨٩"[d]);
const nrm = s => String(s || "").replace(/[ً-ْـ]/g, "").replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي").trim();
const safeK = k => String(k || "anon").replace(/[.#$[\]/]/g, "_").slice(0, 60);

export function usePrefs(api, key) {
  const k = safeK(key); const LS = "ui-prefs-" + k;
  const [P, setP] = useState(() => { try { return { fav: [], hide: [], tour: 0, ...(JSON.parse(localStorage.getItem(LS) || "null") || {}), ok: false }; } catch { return { fav: [], hide: [], tour: 0, ok: false }; } });
  useEffect(() => { if (!key) return; let a = true; (async () => { try { const d = await api.maGet(`school-ui/${k}`); if (!a) return; const v = { fav: [], hide: [], tour: 0, ...(d && typeof d === "object" ? d : {}) }; v.fav = Array.isArray(v.fav) ? v.fav.filter(Boolean) : Object.values(v.fav || {}).filter(Boolean); v.hide = Array.isArray(v.hide) ? v.hide.filter(Boolean) : Object.values(v.hide || {}).filter(Boolean);
    // إن لم يكن في القاعدة شيء نُبقي النسخة المحلية
    setP(p => { const n = d ? { ...v, ok: true } : { ...p, ok: true }; try { localStorage.setItem(LS, JSON.stringify(n)); } catch {} return n; }); } catch { setP(p => ({ ...p, ok: true })); } })(); return () => { a = false; }; }, [key]);
  const save = n => { setP(n); const { ok, ...v } = n; try { localStorage.setItem(LS, JSON.stringify(n)); } catch {} if (key) api.maPut(`school-ui/${k}`, { ...v, at: Date.now() }); };
  const togFav = id => save({ ...P, fav: P.fav.includes(id) ? P.fav.filter(x => x !== id) : [...P.fav, id] });
  const togHide = id => save({ ...P, hide: P.hide.includes(id) ? P.hide.filter(x => x !== id) : [...P.hide, id], fav: P.fav.filter(x => x !== id || P.hide.includes(id)) });
  const doneTour = () => save({ ...P, tour: Date.now() });
  const reset = () => save({ fav: [], hide: [], tour: P.tour, ok: true });
  return { ...P, togFav, togHide, doneTour, reset, save };
}

// ── نافذة تخصيص: إظهار/إخفاء كل قسم + تمييزه بنجمة
export function Customize({ groups, prefs, onClose, title = "تخصيص الصفحة", note }) {
  const [q, setQ] = useState(""); const H = new Set(prefs.hide), F = new Set(prefs.fav);
  const G = groups.map(g => ({ ...g, items: g.items.filter(it => !q || nrm(it.label).includes(nrm(q))) })).filter(g => g.items.length);
  const tot = groups.reduce((s, g) => s + g.items.length, 0);
  return <div className="pz-ov" onClick={onClose}><div className="pz-mod" onClick={e => e.stopPropagation()} dir="rtl" role="dialog" aria-label={title}>
    <div className="pz-h"><b>✏️ {title}</b><button className="pz-x" onClick={onClose} aria-label="إغلاق">✕</button></div>
    <div className="pz-b">
      <p className="pz-note">{note || "أخفِ ما لا تستعمله ليبقى أمامك ما تحتاجه فقط، وميّز بالنجمة ما تستعمله كثيرًا ليظهر في «المفضلة» أعلى الصفحة. المخفي لا يُحذف، ويمكنك إظهاره في أي وقت من هنا."}</p>
      <div className="pz-tl"><input className="pz-in" placeholder="🔎 ابحث عن قسم…" value={q} onChange={e => setQ(e.target.value)} /><span>ظاهر {ar(tot - H.size)} من {ar(tot)}، والمفضلة {ar(F.size)}</span>{(H.size > 0 || F.size > 0) && <button className="pz-bt" onClick={() => { if (window.confirm("إظهار كل الأقسام وإلغاء المفضلة؟")) prefs.reset(); }}>↺ إعادة الضبط</button>}</div>
      {G.map(g => <div key={g.title} className="pz-g"><div className="pz-gh"><b>{g.icon} {g.title}</b><button className="pz-bt" onClick={() => { const allHidden = g.items.every(it => H.has(it.id)); const ids = g.items.filter(it => !it.locked).map(it => it.id); const n = allHidden ? prefs.hide.filter(x => !ids.includes(x)) : [...new Set([...prefs.hide, ...ids])]; prefs.save({ ...prefs, hide: n, fav: allHidden ? prefs.fav : prefs.fav.filter(x => !ids.includes(x)) }); }}>{g.items.every(it => H.has(it.id)) ? "إظهار المجموعة" : "إخفاء المجموعة"}</button></div>
        <div className="pz-items">{g.items.map(it => { const hid = H.has(it.id), fav = F.has(it.id); return <div key={it.id} className={"pz-it" + (hid ? " hid" : "")}>
          <button className={"pz-sw" + (hid ? "" : " on")} disabled={it.locked} onClick={() => prefs.togHide(it.id)} aria-label={hid ? "إظهار" : "إخفاء"} title={it.locked ? "لا يمكن إخفاؤه" : hid ? "مخفي — اضغط للإظهار" : "ظاهر — اضغط للإخفاء"}><i /></button>
          <span className="pz-ic">{it.ic}</span><span className="pz-l">{it.label}</span>
          <button className={"pz-star" + (fav ? " on" : "")} disabled={hid} onClick={() => prefs.togFav(it.id)} aria-label="المفضلة" title={fav ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}>{fav ? "★" : "☆"}</button></div>; })}</div></div>)}
    </div>
    <div className="pz-f"><button className="pz-bt gold" onClick={onClose}>تم</button></div>
  </div><style>{CSS}</style></div>;
}

// ── شريط المفضلة
export function FavBar({ items, onOpen, onEdit, onTour, title = "⭐ المفضلة", dark }) {
  return <div className={"pz-fav" + (dark ? " dark" : "")} dir="rtl"><style>{CSS}</style>
    <div className="pz-fav-h"><b>{title}</b><span className="pz-sp" />{onTour && <button className="pz-chip" onClick={onTour}>❓ دليل الاستخدام</button>}{onEdit && <button className="pz-chip" onClick={onEdit}>✏️ تخصيص</button>}</div>
    {items.length ? <div className="pz-fav-l">{items.map(it => <button key={it.id} className="pz-fi" style={{ "--c": it.c || NAVY }} onClick={() => onOpen(it)}><span>{it.ic}</span><b>{it.label}</b></button>)}</div>
      : <div className="pz-fav-e">اضغط ☆ على أي قسم تستعمله كثيرًا ليظهر هنا، أو «✏️ تخصيص» لإخفاء ما لا تحتاجه.</div>}
  </div>;
}

// ── دليل الاستخدام في أول دخول
export function Tour({ name, roleLbl, steps, picks = [], onDone, onPick }) {
  const [i, setI] = useState(0); const all = [...steps, { ic: "🚀", t: "ابدأ من هنا", d: picks.length ? "أهم الأقسام لدورك. اضغط أيًّا منها، أو أغلق الدليل وتصفح بنفسك. يمكنك فتح هذا الدليل في أي وقت من «❓ دليل الاستخدام»." : "كل شيء جاهز. يمكنك فتح هذا الدليل في أي وقت من «❓ دليل الاستخدام».", picks: true }];
  const s = all[i]; const last = i === all.length - 1;
  useEffect(() => { const k = e => { if (e.key === "Escape") onDone(); if (e.key === "ArrowLeft" && !last) setI(i + 1); if (e.key === "ArrowRight" && i) setI(i - 1); }; window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, [i]);
  return <div className="pz-ov tour" dir="rtl"><style>{CSS}</style><div className="pz-tour" role="dialog" aria-label="دليل الاستخدام">
    <div className="pz-tour-top">{i === 0 && <><small>مرحبًا{name ? ` أ. ${name}` : ""} 👋</small>{roleLbl && <em>{roleLbl}</em>}</>}<button className="pz-x" onClick={onDone} aria-label="تخطي الدليل">✕</button></div>
    <div className="pz-tour-ic" key={i}>{s.ic}</div>
    <h2>{s.t}</h2><p>{s.d}</p>
    {s.picks && picks.length > 0 && <div className="pz-picks">{picks.map(p => <button key={p.id} onClick={() => { onDone(); onPick(p); }}><span>{p.ic}</span><b>{p.label}</b></button>)}</div>}
    <div className="pz-dots">{all.map((_, k) => <i key={k} className={k === i ? "on" : ""} onClick={() => setI(k)} />)}</div>
    <div className="pz-tour-f">{i > 0 && <button className="pz-bt" onClick={() => setI(i - 1)}>→ السابق</button>}<span className="pz-sp" />{!last ? <><button className="pz-bt ghost" onClick={onDone}>تخطي</button><button className="pz-bt gold" onClick={() => setI(i + 1)}>التالي ←</button></> : <button className="pz-bt gold" onClick={onDone}>ابدأ الاستخدام ✓</button>}</div>
  </div></div>;
}

const CSS = `
.pz-ov{position:fixed;inset:0;background:rgba(15,23,42,.5);z-index:3500;display:grid;place-items:center;padding:12px;font-family:'Cairo','Noto Sans Arabic',Tahoma,sans-serif;animation:pzF .15s}
.pz-ov *{box-sizing:border-box}@keyframes pzF{from{opacity:0}to{opacity:1}}
.pz-mod{width:min(820px,100%);max-height:92vh;background:#fff;border-radius:22px;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 24px 60px rgba(0,0,0,.3);border-top:5px solid ${GOLD}}
.pz-h{display:flex;align-items:center;padding:14px 16px;border-bottom:1px solid #eef2f6}.pz-h b{flex:1;font-size:17px;color:${NAVY}}
.pz-x{border:0;background:#f1f5f9;color:#334155;width:34px;height:34px;border-radius:50%;cursor:pointer;font-size:15px;flex:none}
.pz-b{padding:12px 16px;overflow:auto;display:grid;gap:12px}.pz-note{margin:0;color:#475569;font-weight:700;font-size:13.5px;line-height:1.8;background:#f8fafc;border-radius:12px;padding:8px 12px}
.pz-tl{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.pz-tl span{color:#64748b;font-weight:800;font-size:12.5px}
.pz-in{flex:1 1 220px;border:1.5px solid #cbd5e1;border-radius:12px;padding:8px 11px;font:inherit;font-weight:700;font-size:14px}
.pz-g{border:1.5px solid #eef2f6;border-radius:14px;padding:8px 10px}.pz-gh{display:flex;align-items:center;gap:8px;margin-bottom:6px}.pz-gh b{flex:1;color:${NAVY};font-size:14.5px}
.pz-items{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:4px}
.pz-it{display:flex;align-items:center;gap:8px;padding:5px 8px;border-radius:10px}.pz-it:hover{background:#f8fafc}.pz-it.hid .pz-l,.pz-it.hid .pz-ic{opacity:.4}.pz-it.hid .pz-l{text-decoration:line-through}
.pz-ic{font-size:17px;width:24px;text-align:center}.pz-l{flex:1;font-weight:800;font-size:13.5px;min-width:0}
.pz-sw{width:40px;height:22px;border-radius:99px;border:0;background:#cbd5e1;position:relative;cursor:pointer;flex:none;transition:background .15s}.pz-sw i{position:absolute;top:3px;right:3px;width:16px;height:16px;border-radius:50%;background:#fff;transition:right .15s;box-shadow:0 1px 3px rgba(0,0,0,.3)}
.pz-sw.on{background:#16a34a}.pz-sw.on i{right:21px}.pz-sw:disabled{opacity:.5;cursor:not-allowed}
.pz-star{border:0;background:none;font-size:20px;color:#cbd5e1;cursor:pointer;line-height:1;padding:0 4px}.pz-star.on{color:${GOLD}}.pz-star:disabled{opacity:.3;cursor:default}
.pz-bt{border:1.5px solid #cbd5e1;background:#fff;color:${NAVY};border-radius:12px;padding:7px 13px;font:inherit;font-weight:800;font-size:13px;cursor:pointer;white-space:nowrap}
.pz-bt.gold{background:linear-gradient(135deg,#e2bc3c,${GOLD});border-color:${GOLD};color:${NAVY};padding:9px 20px}.pz-bt.ghost{border-color:transparent;color:#64748b}
.pz-f{display:flex;justify-content:flex-end;padding:12px 16px;border-top:1px solid #eef2f6}
.pz-sp{flex:1}
.pz-fav{background:#fff;border-radius:18px;padding:12px 14px;box-shadow:0 2px 14px rgba(15,23,42,.07);border:1px solid #eef2f6;border-top:3px solid ${GOLD};font-family:'Cairo','Noto Sans Arabic',Tahoma,sans-serif;margin-bottom:14px}
.pz-fav *{box-sizing:border-box}.pz-fav-h{display:flex;gap:6px;align-items:center;margin-bottom:8px}.pz-fav-h b{color:${NAVY};font-size:15.5px}
.pz-chip{border:1.5px solid #e2e8f0;background:#f8fafc;color:${NAVY};border-radius:99px;padding:5px 12px;font:inherit;font-weight:800;font-size:12.5px;cursor:pointer}.pz-chip:hover{border-color:${GOLD}}
.pz-fav-l{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px}
.pz-fi{display:flex;align-items:center;gap:8px;border:0;border-radius:14px;padding:10px 12px;font:inherit;cursor:pointer;color:#fff;text-align:right;background:linear-gradient(135deg,var(--c),color-mix(in srgb,var(--c) 70%,#000));box-shadow:0 6px 14px -8px var(--c);transition:transform .12s}
.pz-fi:hover{transform:translateY(-2px)}.pz-fi span{font-size:20px}.pz-fi b{font-size:13px;line-height:1.4}
.pz-fav-e{color:#64748b;font-weight:700;font-size:13px;background:#f8fafc;border:1px dashed #cbd5e1;border-radius:12px;padding:10px;text-align:center}
.pz-ov.tour{background:radial-gradient(circle at 50% 30%,rgba(11,37,69,.55),rgba(11,37,69,.8))}
.pz-tour{width:min(520px,100%);background:#fff;border-radius:26px;padding:20px 22px 16px;text-align:center;box-shadow:0 30px 80px rgba(0,0,0,.4);border-top:6px solid ${GOLD};position:relative}
.pz-tour-top{display:flex;align-items:center;gap:8px;min-height:34px}.pz-tour-top small{font-weight:900;color:${NAVY};font-size:14px}.pz-tour-top em{font-style:normal;background:${NAVY};color:#fde68a;border-radius:99px;padding:2px 10px;font-weight:800;font-size:12px}.pz-tour-top .pz-x{margin-inline-start:auto}
.pz-tour-ic{font-size:60px;line-height:1;margin:6px 0 4px;animation:pzP .35s ease-out}@keyframes pzP{from{transform:scale(.6);opacity:0}to{transform:none;opacity:1}}
.pz-tour h2{margin:6px 0;color:${NAVY};font-size:21px;font-weight:900}.pz-tour p{margin:0 auto;color:#475569;font-weight:700;font-size:14.5px;line-height:1.9;max-width:430px}
.pz-picks{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:8px;margin-top:14px}
.pz-picks button{border:1.5px solid #e2e8f0;background:#f8fafc;border-radius:14px;padding:10px 8px;font:inherit;cursor:pointer;display:grid;gap:2px;justify-items:center}.pz-picks button:hover{border-color:${GOLD};background:#fffbeb}.pz-picks span{font-size:24px}.pz-picks b{font-size:12.5px;color:${NAVY}}
.pz-dots{display:flex;gap:6px;justify-content:center;margin:16px 0 10px}.pz-dots i{width:8px;height:8px;border-radius:99px;background:#cbd5e1;cursor:pointer;transition:all .2s}.pz-dots i.on{width:24px;background:${GOLD}}
.pz-tour-f{display:flex;gap:8px;align-items:center}
`;
