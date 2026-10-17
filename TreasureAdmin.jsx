// ══════════════════════════════════════════════════════════
// 🗺️ رحلة الكنز — لوحة الإدارة: الرابط والإعدادات ومتابعة تقدم الطلاب
// ══════════════════════════════════════════════════════════
import React, { useEffect, useMemo, useState } from "react";
import { TR_CFG, TR_PROG, TR_TOTAL, TR_PASS, TR_SCHOOL, WORLDS, worldOf, READY, SKILLS, SUBJ, LEVELS, HOTS, hotsOf, loadAllStages, ar, arr, obj, when, trLink, useFonts, BASE_CSS } from "./core.jsx";

const pct = (a, b) => b ? Math.round(a / b * 100) : 0;
const esc = t => String(t ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

function rowStats(p) {
  const best = obj(p.best); const ks = Object.keys(best).map(Number).filter(n => n >= 1 && n <= TR_TOTAL);
  const passed = ks.filter(n => (+best[n].sc || 0) >= TR_PASS);
  let r = 0, m = 0, s = 0, tries = 0; ks.forEach(n => { r += +best[n].r || 0; m += +best[n].m || 0; s += +best[n].s || 0; tries += +best[n].tries || 0; });
  const stars = Object.values(obj(p.stars)).reduce((a, b) => a + (+b || 0), 0);
  return { played: ks.length, passed: passed.length, stage: Math.min(+p.unlocked || 1, TR_TOTAL), stars, tries, r: pct(r, ks.length * 5), m: pct(m, ks.length * 5), s: pct(s, ks.length * 5), avg: pct(r + m + s, ks.length * 15) };
}

export default function TreasureAdmin({ by, api }) {
  useFonts();
  const [cfg, setCfg] = useState(null);
  const [prog, setProg] = useState({});
  const [ros, setRos] = useState({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("track");
  const [cls, setCls] = useState("all");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("stage");
  const [detail, setDetail] = useState(null);
  const [msg, setMsg] = useState("");

  const load = async () => {
    setLoading(true);
    const [c, p, r] = await Promise.all([api.maGet(TR_CFG), api.maGet(TR_PROG), api.maGet(api.MA_ROSTER)]);
    const C = obj(c); setCfg({ open: C.open !== false, upTo: +C.upTo || READY, onlyG3: C.onlyG3 !== false });
    setProg(obj(p)); setRos(obj(r)); setLoading(false);
  };
  useEffect(() => { load(); }, []);
  const toast = t => { setMsg(t); setTimeout(() => setMsg(""), 2600); };
  const saveCfg = async v => { const n = { ...cfg, ...v }; setCfg(n); await api.maPut(TR_CFG, n); toast("✅ حُفظت الإعدادات"); };

  // طلاب الصف الثالث من كشوف الفصول
  const roster = useMemo(() => {
    const L = []; Object.entries(ros).forEach(([ck, r]) => { if (cfg && cfg.onlyG3 && !String(ck).startsWith("3-")) return; arr(r && r.students).forEach(st => { if (st && st.id && st.name) L.push({ id: st.id, name: st.name, ck, n4: st.n4 || "", hasId: !!st.nh }); }); });
    return L;
  }, [ros, cfg]);
  const classes = useMemo(() => [...new Set([...roster.map(s => s.ck), ...Object.values(prog).map(p => p && p.ck).filter(Boolean)])].sort((a, b) => a.localeCompare(b, "en", { numeric: true })), [roster, prog]);
  const rows = useMemo(() => Object.values(prog).filter(p => p && p.sid).map(p => { const st = roster.find(x => x.id === p.sid); return { ...p, name: (st && st.name) || p.name, ck: (st && st.ck) || p.ck, n4: (st && st.n4) || p.n4, ...rowStats(p) }; }), [prog, roster]);
  const view = useMemo(() => {
    let L = rows.filter(r => (cls === "all" || r.ck === cls) && (!q || String(r.name).includes(q.trim()) || String(r.n4).includes(q.trim())));
    const S = { stage: (a, b) => b.passed - a.passed || b.stars - a.stars, stars: (a, b) => b.stars - a.stars || b.passed - a.passed, avg: (a, b) => b.avg - a.avg, last: (a, b) => (+b.last || 0) - (+a.last || 0), name: (a, b) => String(a.name).localeCompare(String(b.name), "ar") };
    return L.sort(S[sort] || S.stage);
  }, [rows, cls, q, sort]);
  const notStarted = useMemo(() => roster.filter(s => !prog[s.id] && (cls === "all" || s.ck === cls)), [roster, prog, cls]);
  const target = roster.filter(s => cls === "all" || s.ck === cls).length;
  const scoped = rows.filter(r => cls === "all" || r.ck === cls);

  const kpi = useMemo(() => {
    const n = scoped.length; const sum = k => scoped.reduce((a, r) => a + (+r[k] || 0), 0);
    const playedRows = scoped.filter(r => r.played);
    const avgOf = k => playedRows.length ? Math.round(playedRows.reduce((a, r) => a + r[k], 0) / playedRows.length) : 0;
    return { n, passed: sum("passed"), stars: sum("stars"), avgStage: n ? (sum("passed") / n).toFixed(1) : "0", w1: scoped.filter(r => r.passed >= 5).length, w2: scoped.filter(r => r.passed >= 10).length, w3: scoped.filter(r => r.passed >= 15).length, w4: scoped.filter(r => r.passed >= 20).length, r: avgOf("r"), m: avgOf("m"), s: avgOf("s"), avg: avgOf("avg") };
  }, [scoped]);

  const skills = useMemo(() => {
    const A = {}; scoped.forEach(p => Object.values(obj(p.best)).forEach(b => Object.entries(obj(b && b.sk)).forEach(([k, v]) => { if (!SKILLS[k]) return; A[k] = A[k] || [0, 0]; A[k][0] += +(v && v[0]) || 0; A[k][1] += +(v && v[1]) || 0; })));
    return Object.entries(A).map(([k, [ok, t]]) => ({ k, ok, t, p: pct(ok, t) })).sort((a, b) => a.p - b.p);
  }, [scoped]);

  const stageDist = useMemo(() => Array.from({ length: TR_TOTAL }, (_, i) => scoped.filter(r => r.passed === i + 1 || (i === 0 && false)).length), [scoped]);

  const reset = async r => { if (!window.confirm(`إعادة تعيين رحلة الطالب ${r.name}؟ سيُحذف تقدمه بالكامل.`)) return; await api.maPut(`${TR_PROG}/${r.sid}`, null); setProg(p => { const o = { ...p }; delete o[r.sid]; return o; }); setDetail(null); toast("🗑️ أُعيد تعيين الطالب"); };

  const csv = () => {
    const H = ["م", "اسم الطالب", "الفصل", "آخر 4 من الهوية", "المرحلة الحالية", "المراحل المنجزة", "النجوم", "القراءة %", "الرياضيات %", "العلوم %", "المتوسط %", "عدد المحاولات", "آخر نشاط"];
    const L = view.map((r, i) => [i + 1, r.name, api.maClassName(r.ck), r.n4 ? "***" + r.n4 : "", r.stage, r.passed, r.stars, r.r, r.m, r.s, r.avg, r.tries, r.last ? new Date(r.last).toLocaleString("ar-SA") : ""]);
    notStarted.forEach(s => L.push(["", s.name, api.maClassName(s.ck), s.n4 ? "***" + s.n4 : "", "لم يبدأ", 0, 0, "", "", "", "", 0, ""]));
    const txt = "﻿" + [H, ...L].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\r\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([txt], { type: "text/csv;charset=utf-8" })); a.download = `رحلة-الكنز-${cls === "all" ? "كل-الفصول" : cls}.csv`; a.click();
  };
  const print = () => {
    const w = window.open("", "_blank"); if (!w) { alert("اسمح بالنوافذ المنبثقة للطباعة"); return; }
    const sk = skills.slice(0, 8).map(s => `<tr><td>${esc(SKILLS[s.k])}</td><td>${ar(s.p)}٪</td><td>${ar(s.t)}</td></tr>`).join("");
    w.document.write(`<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>تقرير رحلة الكنز</title><style>body{font-family:Tajawal,Tahoma,sans-serif;margin:18px;color:#1c1917}h1{margin:0;font-size:22px;color:#78350f}h3{margin:16px 0 6px;color:#1e3a8a}table{width:100%;border-collapse:collapse;font-size:12px}th{background:#1e3a8a;color:#fff;padding:5px}td{border:1px solid #cbd5e1;padding:4px;text-align:center}td.r{text-align:right}.k{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin:10px 0}.k div{border:1px solid #e2e8f0;border-radius:8px;padding:6px;text-align:center;font-size:11px}.k b{display:block;font-size:18px;color:#b45309}tr{break-inside:avoid}@media print{button{display:none}}</style></head><body>
      <button onclick="print()" style="float:left;padding:8px 14px">🖨️ طباعة</button><small>${esc(TR_SCHOOL)}</small><h1>🗺️ تقرير رحلة الكنز — طريقي إلى نافس</h1><small>${esc(cls === "all" ? "جميع فصول الصف الثالث" : api.maClassName(cls))} • ${new Date().toLocaleDateString("ar-SA-u-ca-islamic-umalqura-nu-arab")} • ${esc(by || "")}</small>
      <div class="k"><div><b>${ar(kpi.n)} / ${ar(target)}</b>المشاركون</div><div><b>${ar(kpi.avgStage)}</b>متوسط المراحل المنجزة</div><div><b>${ar(kpi.r)}٪</b>القراءة</div><div><b>${ar(kpi.m)}٪</b>الرياضيات</div><div><b>${ar(kpi.s)}٪</b>العلوم</div></div>
      ${sk ? `<h3>المهارات الأكثر احتياجاً للدعم (نسبة الإجابة الصحيحة من أول محاولة)</h3><table><tr><th>المهارة</th><th>النسبة</th><th>عدد الأسئلة المجابة</th></tr>${sk}</table>` : ""}
      <h3>تقدم الطلاب</h3><table><tr><th>م</th><th>الطالب</th><th>الفصل</th><th>الهوية</th><th>المرحلة</th><th>المنجزة</th><th>النجوم</th><th>قراءة</th><th>رياضيات</th><th>علوم</th><th>آخر نشاط</th></tr>
      ${view.map((r, i) => `<tr><td>${ar(i + 1)}</td><td class="r">${esc(r.name)}</td><td>${esc(api.maClassName(r.ck))}</td><td>${r.n4 ? "***" + ar(r.n4) : ""}</td><td>${ar(r.stage)}</td><td>${ar(r.passed)}</td><td>${ar(r.stars)}</td><td>${ar(r.r)}٪</td><td>${ar(r.m)}٪</td><td>${ar(r.s)}٪</td><td>${r.last ? esc(when(r.last)) : ""}</td></tr>`).join("")}</table>
      ${notStarted.length ? `<h3>لم يبدؤوا الرحلة (${ar(notStarted.length)})</h3><div style="font-size:12px;line-height:2">${notStarted.map(s => esc(s.name) + " <small>(" + esc(api.maClassName(s.ck)) + ")</small>").join(" • ")}</div>` : ""}
      </body></html>`);
    w.document.close();
  };

  const link = trLink();
  const wa = `https://wa.me/?text=${encodeURIComponent(`🗺️ أبنائي طلاب الصف الثالث المتوسط\nانطلقوا في «رحلة الكنز: طريقي إلى نافس» 🏆\n٢٠ مرحلة في القراءة والرياضيات والعلوم — ادخل برقم هويتك وابدأ:\n${link}`)}`;
  const qr = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=6&data=${encodeURIComponent(link)}`;
  const printQR = () => { const w = window.open("", "_blank"); if (!w) return; w.document.write(`<!doctype html><html dir="rtl"><head><meta charset="utf-8"><title>رحلة الكنز</title><style>body{font-family:Tajawal,Tahoma,sans-serif;text-align:center;padding:40px;color:#451a03}h1{font-size:44px;margin:6px 0;color:#78350f}p{font-size:20px;font-weight:700}.b{border:6px double #b45309;border-radius:28px;padding:30px;max-width:560px;margin:auto;background:#fdf6e3}img{width:280px;height:280px}</style></head><body><div class="b"><div style="font-size:60px">🗺️🏆</div><small>${esc(TR_SCHOOL)}</small><h1>رحلة الكنز</h1><p>طريقي إلى نافس • الصف الثالث المتوسط</p><img src="${qr.replace("220x220", "400x400")}" onload="setTimeout(()=>print(),300)"><p>امسح الرمز وادخل برقم هويتك وابدأ رحلتك!</p><p style="font-size:15px">٢٠ مرحلة • قراءة • رياضيات • علوم</p></div></body></html>`); w.document.close(); };

  if (loading || !cfg) return <div className="tr-root tra"><style>{BASE_CSS + ADM_CSS}</style><div className="tra-card" style={{ textAlign: "center", padding: 40 }}>🧭 جارٍ تحميل بيانات الرحلة…</div></div>;

  const g3 = roster.length, withId = roster.filter(s => s.hasId).length;

  return <div className="tr-root tra"><style>{BASE_CSS + ADM_CSS}</style>
    <div className="tra-hero">
      <div><small>{TR_SCHOOL}</small><h1 className="tr-disp">🗺️ رحلة الكنز — متابعة الطلاب</h1><p>٢٠ مرحلة • ٤ عوالم • ١٥ سؤالاً في كل مرحلة (قراءة • رياضيات • علوم) مع أسئلة تعويضية • المحتوى الجاهز: المراحل ١–{ar(READY)}</p></div>
      <div className={"tra-status" + (cfg.open ? " on" : "")} onClick={() => saveCfg({ open: !cfg.open })} role="button">{cfg.open ? "🟢 الرحلة مفتوحة" : "🔴 الرحلة مغلقة"}<small>اضغط للتبديل</small></div>
    </div>

    <div className="tra-card tra-link">
      <b>🔗 رابط الطلاب</b>
      <span dir="ltr" className="tra-url">{link}</span>
      <div className="tra-btns">
        <button className="tra-b" onClick={() => { try { navigator.clipboard.writeText(link); toast("✅ نُسخ الرابط"); } catch {} }}>📋 نسخ</button>
        <a className="tra-b wa" href={wa} target="_blank" rel="noreferrer">💬 واتساب</a>
        <button className="tra-b" onClick={printQR}>🖨️ ملصق QR</button>
        <a className="tra-b" href="#treasure" target="_blank" rel="noreferrer">👁 معاينة</a>
      </div>
      <img className="tra-qr" src={qr} alt="رمز QR لرابط رحلة الكنز" loading="lazy" />
      {g3 > 0 && withId < g3 && <div className="tra-warn">⚠️ {ar(g3 - withId)} من طلاب الصف الثالث ليست أرقام هوياتهم مرتبطة بكشوف الفصول، ولن يتمكنوا من الدخول. استورد كشوف نور التي فيها «رقم السجل المدني» من صفحة الفصول.</div>}
    </div>

    <div className="tra-tabs">{[["track", "📊 المتابعة"], ["skills", "🧠 المهارات"], ["map", "🗺️ خريطة النواتج"], ["none", `⏳ لم يبدؤوا (${ar(notStarted.length)})`], ["top", "🏆 الأوائل"], ["set", "⚙️ الإعدادات"]].map(([k, l]) => <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{l}</button>)}</div>

    <div className="tra-filter">
      <select value={cls} onChange={e => setCls(e.target.value)}><option value="all">جميع الفصول</option>{classes.map(c => <option key={c} value={c}>{api.maClassName(c)}</option>)}</select>
      {tab === "track" && <><input placeholder="🔎 بحث بالاسم أو آخر أرقام الهوية" value={q} onChange={e => setQ(e.target.value)} />
        <select value={sort} onChange={e => setSort(e.target.value)}><option value="stage">الترتيب: الأكثر تقدماً</option><option value="stars">الأكثر نجوماً</option><option value="avg">أعلى متوسط</option><option value="last">آخر نشاط</option><option value="name">الاسم</option></select></>}
      <button className="tra-b" onClick={load}>🔄 تحديث</button>
      <button className="tra-b" onClick={csv}>📥 Excel</button>
      <button className="tra-b" onClick={print}>🖨️ تقرير</button>
    </div>

    {tab === "track" && <>
      <div className="tra-kpis">
        <div><b>{ar(kpi.n)} <small>من {ar(target)}</small></b><span>المشاركون</span><i style={{ width: pct(kpi.n, target) + "%" }} /></div>
        <div><b>{ar(kpi.avgStage)}</b><span>متوسط المراحل المنجزة</span></div>
        <div><b>{ar(kpi.w1)}</b><span>أنهوا العالم الأول 🥉</span></div>
        <div><b>{ar(kpi.w2)}</b><span>أنهوا العالم الثاني 🥈</span></div>
        <div><b>{ar(kpi.w3)}</b><span>أنهوا العالم الثالث 🥇</span></div>
        <div><b>{ar(kpi.w4)}</b><span>وصلوا إلى الكنز 👑</span></div>
        <div><b>{ar(kpi.stars)}</b><span>مجموع النجوم ⭐</span></div>
        {["r", "m", "s"].map(k => <div key={k} style={{ "--c": SUBJ[k].c }}><b style={{ color: SUBJ[k].c }}>{ar(kpi[k])}٪</b><span>{SUBJ[k].icon} {SUBJ[k].name}</span><i style={{ width: kpi[k] + "%", background: SUBJ[k].c }} /></div>)}
      </div>
      <div className="tra-card"><b>توزيع الطلاب حسب عدد المراحل المنجزة</b>
        <div className="tra-dist">{stageDist.map((v, i) => { const w = worldOf(i + 1); const mx = Math.max(1, ...stageDist); return <div key={i} title={`${v} طالب`}><i style={{ height: (v / mx * 100) + "%", background: w.c2 }} /><small>{ar(i + 1)}</small>{v > 0 && <em>{ar(v)}</em>}</div>; })}</div>
      </div>
      <div className="tra-card" style={{ padding: 0, overflow: "hidden" }}>
        {view.length === 0 ? <div style={{ padding: 30, textAlign: "center", color: "#78716c", fontWeight: 700 }}>لم يبدأ أي طالب الرحلة بعد — أرسل الرابط للطلاب 🚀</div> :
          <div className="tra-tbl-wrap"><table className="tra-tbl"><thead><tr><th>#</th><th className="r">الطالب</th><th>الفصل</th><th>الهوية</th><th>المرحلة</th><th>المنجزة</th><th>⭐</th><th>📖</th><th>🔢</th><th>🔬</th><th>آخر نشاط</th><th></th></tr></thead>
            <tbody>{view.map((r, i) => <tr key={r.sid}>
              <td>{ar(i + 1)}</td><td className="r"><b>{r.name}</b></td><td>{api.maClassName(r.ck)}</td><td dir="ltr">{r.n4 ? "***" + ar(r.n4) : "—"}</td>
              <td><span className="tra-stage" style={{ background: worldOf(r.stage).soft, color: worldOf(r.stage).c1 }}>{worldOf(r.stage).icon} {ar(r.stage)}</span></td>
              <td><div className="tra-prog"><i style={{ width: pct(r.passed, TR_TOTAL) + "%" }} /><span>{ar(r.passed)} من ٢٠</span></div></td>
              <td>{ar(r.stars)}</td><td style={{ color: r.r < 60 ? "#dc2626" : "#166534" }}>{ar(r.r)}٪</td><td style={{ color: r.m < 60 ? "#dc2626" : "#166534" }}>{ar(r.m)}٪</td><td style={{ color: r.s < 60 ? "#dc2626" : "#166534" }}>{ar(r.s)}٪</td>
              <td className="sm">{r.last ? when(r.last) : "—"}</td><td><button className="tra-b sm" onClick={() => setDetail(r)}>تفاصيل</button></td>
            </tr>)}</tbody></table></div>}
      </div>
    </>}

    {tab === "skills" && <div className="tra-card">
      <b>🧠 المهارات مرتبة من الأضعف إلى الأقوى</b><p className="tra-note">النسبة = الأسئلة المُجابة صحيحة من أول محاولة ÷ كل الأسئلة في المهارة (لكل طالب: أفضل محاولة في كل مرحلة). المهارات الحمراء أولوية في الخطط العلاجية.</p>
      {skills.length === 0 ? <p className="tra-note">لا توجد بيانات بعد.</p> : skills.map(s => { const sub = SUBJ[s.k[0] === "R" ? "r" : s.k[0] === "M" ? "m" : "s"]; return <div key={s.k} className="tra-skill">
        <span className="tra-sk-ic" style={{ background: sub.soft }}>{sub.icon}</span>
        <div><b>{SKILLS[s.k]}</b><small>{sub.name} • {ar(s.t)} إجابة</small><div className="tra-bar"><i style={{ width: s.p + "%", background: s.p < 50 ? "#dc2626" : s.p < 70 ? "#f59e0b" : "#16a34a" }} /></div></div>
        <em style={{ color: s.p < 50 ? "#dc2626" : s.p < 70 ? "#b45309" : "#166534" }}>{ar(s.p)}٪</em>
      </div>; })}
    </div>}

    {tab === "map" && <OutcomeMap />}

    {tab === "none" && <div className="tra-card">
      <b>⏳ طلاب لم يبدؤوا الرحلة ({ar(notStarted.length)})</b>
      {notStarted.length === 0 ? <p className="tra-note">رائع! جميع الطلاب بدؤوا 🎉</p> :
        classes.filter(c => cls === "all" || c === cls).map(c => { const L = notStarted.filter(s => s.ck === c); if (!L.length) return null; return <div key={c} className="tra-none"><h4>{api.maClassName(c)} <small>({ar(L.length)})</small></h4><div>{L.map(s => <span key={s.id} className={s.hasId ? "" : "noid"} title={s.hasId ? "" : "رقم الهوية غير مرتبط"}>{s.name}{!s.hasId && " ⚠️"}</span>)}</div></div>; })}
    </div>}

    {tab === "top" && <div className="tra-card">
      <b>🏆 لوحة شرف المستكشفين</b>
      <div className="tra-top">{[...scoped].sort((a, b) => b.passed - a.passed || b.stars - a.stars || b.avg - a.avg).slice(0, 10).map((r, i) => <div key={r.sid} className={"tra-top-r" + (i < 3 ? " p" + i : "")}><span className="tra-rank">{["🥇", "🥈", "🥉"][i] || ar(i + 1)}</span><div><b>{r.name}</b><small>{api.maClassName(r.ck)}</small></div><em>{worldOf(r.stage).icon} {ar(r.passed)} مراحل • ⭐ {ar(r.stars)}</em></div>)}</div>
      {scoped.length === 0 && <p className="tra-note">لا يوجد مشاركون بعد.</p>}
    </div>}

    {tab === "set" && <div className="tra-card tra-set">
      <b>⚙️ إعدادات الرحلة</b>
      <label><input type="checkbox" checked={cfg.open} onChange={e => saveCfg({ open: e.target.checked })} /> الرحلة مفتوحة للطلاب</label>
      <label><input type="checkbox" checked={cfg.onlyG3} onChange={e => saveCfg({ onlyG3: e.target.checked })} /> مخصصة لطلاب الصف الثالث المتوسط فقط</label>
      <div><span>إتاحة المراحل حتى المرحلة: </span><select value={cfg.upTo} onChange={e => saveCfg({ upTo: +e.target.value })}>{Array.from({ length: READY }, (_, i) => i + 1).map(n => <option key={n} value={n}>{ar(n)} — {worldOf(n).name}</option>)}</select>
        <p className="tra-note">يمكنك فتح المراحل تدريجياً (مثلاً مرحلة كل أسبوع). الطالب الذي يُنهي آخر مرحلة متاحة يرى رسالة «ستتاح قريباً».</p></div>
      <div className="tra-worlds">{WORLDS.map(w => <div key={w.n} style={{ background: w.soft, color: w.c1 }}><span>{w.icon}</span><b>{w.name}</b><small>المراحل {ar(w.from)}–{ar(w.to)} • {w.to <= READY ? "✅ جاهزة" : "🛠️ قيد الإعداد"}</small></div>)}</div>
      <p className="tra-note">• شرط عبور المرحلة: {ar(TR_PASS)} من ١٥ • الإجابة الصحيحة من أول مرة = درجة، والسؤال التعويضي = نصف درجة • النجوم: ⭐⭐⭐ من ١٤ فأكثر، ⭐⭐ من ١٢، ⭐ من {ar(TR_PASS)}.</p>
    </div>}

    {detail && <div className="tra-modal" onClick={() => setDetail(null)}><div className="tra-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 640, width: "100%", maxHeight: "86vh", overflowY: "auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}><b style={{ flex: 1, fontSize: 17 }}>🧭 {detail.name}</b><button className="tra-b sm" onClick={() => setDetail(null)}>✕</button></div>
      <small className="tra-note">{api.maClassName(detail.ck)} • الهوية ***{ar(detail.n4)} • بدأ: {detail.start ? when(detail.start) : "—"}</small>
      <div className="tra-tbl-wrap" style={{ marginTop: 8 }}><table className="tra-tbl"><thead><tr><th>المرحلة</th><th>الدرجة</th><th>📖</th><th>🔢</th><th>🔬</th><th>⭐</th><th>المحاولات</th><th>التاريخ</th></tr></thead>
        <tbody>{Object.keys(obj(detail.best)).map(Number).sort((a, b) => a - b).map(n => { const b = detail.best[n]; return <tr key={n} style={{ background: (+b.sc || 0) >= TR_PASS ? "#f0fdf4" : "#fff7ed" }}><td>{worldOf(n).icon} {ar(n)}</td><td><b>{ar(b.sc)}</b> من ١٥</td><td>{ar(b.r)}</td><td>{ar(b.m)}</td><td>{ar(b.s)}</td><td>{"★".repeat(+obj(detail.stars)[n] || 0) || "—"}</td><td>{ar(b.tries)}</td><td className="sm">{b.ts ? when(b.ts) : ""}</td></tr>; })}</tbody></table></div>
      {(() => { const A = {}; Object.values(obj(detail.best)).forEach(b => Object.entries(obj(b.sk)).forEach(([k, v]) => { A[k] = A[k] || [0, 0]; A[k][0] += +v[0] || 0; A[k][1] += +v[1] || 0; })); const W = Object.entries(A).filter(([k, [o, t]]) => SKILLS[k] && t && o / t < .6); return W.length ? <div className="tra-warn" style={{ marginTop: 10 }}>🎯 مهارات تحتاج دعماً: {W.map(([k]) => SKILLS[k]).join(" • ")}</div> : null; })()}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}><button className="tra-b" style={{ background: "#fee2e2", color: "#991b1b" }} onClick={() => reset(detail)}>🗑️ إعادة تعيين رحلة الطالب</button></div>
    </div></div>}
    {msg && <div className="tra-toast">{msg}</div>}
  </div>;
}

// 🗺️ خريطة نواتج التعلم: توزيع أسئلة الرحلة على المهارات والمراحل والمستويات ومهارات التفكير العليا
function OutcomeMap() {
  const [S, setS] = useState(null);
  useEffect(() => { let on = true; loadAllStages().then(x => on && setS(x)).catch(() => on && setS([])); return () => { on = false; }; }, []);
  if (!S) return <div className="tra-card"><p className="tra-note">⏳ جارٍ تحميل محتوى المراحل…</p></div>;
  const qsOf = s => [...((s.read && s.read.qs) || []), ...(s.math || []), ...(s.sci || [])];
  const keys = Object.keys(SKILLS), grid = {}, lv = {}, ht = {}; let total = 0;
  S.forEach(s => qsOf(s).forEach(q => { total++; (grid[q.k] = grid[q.k] || {})[s.n] = (grid[q.k][s.n] || 0) + 1; lv[q.lv] = (lv[q.lv] || 0) + 1; const h = hotsOf(q); if (h) ht[h] = (ht[h] || 0) + 1; }));
  const rowSum = k => Object.values(grid[k] || {}).reduce((a, b) => a + b, 0);
  const subOf = k => SUBJ[k[0] === "R" ? "r" : k[0] === "M" ? "m" : "s"];
  return <div className="tra-card">
    <b>🗺️ خريطة نواتج التعلم في الرحلة</b>
    <p className="tra-note">{ar(S.length)} مرحلة • {ar(total)} سؤال أساسي، ولكل سؤال توأم تعويضي بالمهارة نفسها. كل خانة = عدد أسئلة المهارة في المرحلة.</p>
    <div className="tra-tbl-wrap"><table className="tra-tbl tra-map"><thead><tr><th className="r">المهارة (ناتج التعلم)</th>{S.map(s => <th key={s.n} style={{ background: worldOf(s.n).c1, color: "#fff" }}>{ar(s.n)}</th>)}<th>المجموع</th></tr></thead>
      <tbody>{keys.map(k => { const sub = subOf(k); return <tr key={k}><td className="r"><span style={{ color: sub.c }}>{sub.icon}</span> {SKILLS[k]}</td>{S.map(s => { const v = (grid[k] || {})[s.n] || 0; return <td key={s.n} style={{ background: v ? sub.soft : "transparent", color: v ? sub.c : "#cbd5e1" }}>{v ? ar(v) : "·"}</td>; })}<td><b>{ar(rowSum(k))}</b></td></tr>; })}</tbody></table></div>
    <div className="tra-map-foot">
      <div><b>المستويات المعرفية</b>{Object.keys(LEVELS).map(l => <span key={l}>{LEVELS[l]}: {ar(lv[l] || 0)}</span>)}</div>
      <div><b>🧠 مهارات التفكير العليا</b>{Object.keys(HOTS).map(h => <span key={h}>{HOTS[h].ic} {HOTS[h].n}: {ar(ht[h] || 0)}</span>)}</div>
    </div>
  </div>;
}

const ADM_CSS = `
.tra{max-width:1100px;margin:0 auto;padding:4px 0 30px;display:grid;gap:12px}
.tra-hero{display:flex;gap:12px;align-items:center;flex-wrap:wrap;background:radial-gradient(circle at 15% 20%,#1e3a5f,#0c1a2b);color:#fff;border-radius:22px;padding:18px 20px;box-shadow:0 10px 30px rgba(12,26,43,.25)}
.tra-hero>div:first-child{flex:1 1 280px}
.tra-hero small{color:#fde68a;font-weight:800}
.tra-hero h1{font-size:30px;margin:2px 0;color:#fde68a}
.tra-hero p{margin:0;font-weight:600;opacity:.9;font-size:13.5px;line-height:1.8}
.tra-status{background:rgba(255,255,255,.1);border:2px solid rgba(255,255,255,.25);border-radius:16px;padding:10px 16px;font-weight:900;cursor:pointer;text-align:center}
.tra-status small{display:block;font-size:11px;opacity:.7;color:#fff}
.tra-status.on{border-color:#4ade80}
.tra-card{background:#fff;border-radius:18px;padding:14px 16px;box-shadow:0 4px 16px rgba(0,0,0,.06);border:1px solid #f1f5f9}
.tra-card>b{font-size:15.5px;color:#1e293b}
.tra-link{display:grid;grid-template-columns:1fr auto;gap:8px 14px;align-items:center;background:#fffbeb;border:2px solid #fde68a}
.tra-link>b{grid-column:1}
.tra-url{grid-column:1;background:#fff;border-radius:10px;padding:8px 12px;font-size:13px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;border:1px solid #fde68a}
.tra-btns{grid-column:1;display:flex;gap:6px;flex-wrap:wrap}
.tra-qr{grid-column:2;grid-row:1/4;width:118px;height:118px;border-radius:12px;border:3px solid #fff;box-shadow:0 4px 12px rgba(0,0,0,.1)}
.tra-warn{grid-column:1/-1;background:#fef2f2;border:1px solid #fecaca;color:#991b1b;font-weight:700;font-size:13px;padding:8px 10px;border-radius:10px;line-height:1.8}
.tra-b{border:1px solid #e2e8f0;background:#fff;border-radius:10px;padding:7px 12px;font-weight:800;font-size:13px;color:#1e293b;text-decoration:none;display:inline-flex;align-items:center;gap:4px;font-family:inherit;cursor:pointer}
.tra-b:hover{background:#f8fafc}
.tra-b.wa{background:#25d366;color:#fff;border-color:#25d366}
.tra-b.sm{padding:4px 9px;font-size:12px}
.tra-tabs{display:flex;gap:6px;flex-wrap:wrap}
.tra-tabs button{border:none;background:#fff;border-radius:12px;padding:9px 14px;font-weight:900;font-size:13.5px;color:#475569;box-shadow:0 2px 8px rgba(0,0,0,.05);font-family:inherit;cursor:pointer}
.tra-tabs button.on{background:#0c1a2b;color:#fde68a}
.tra-filter{display:flex;gap:6px;flex-wrap:wrap;align-items:center}
.tra-filter select,.tra-filter input{border:1px solid #e2e8f0;border-radius:10px;padding:8px 10px;font-family:inherit;font-weight:700;font-size:13px;background:#fff}
.tra-filter input{flex:1 1 200px}
.tra-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:8px}
.tra-kpis>div{position:relative;overflow:hidden;background:#fff;border-radius:16px;padding:12px;box-shadow:0 4px 14px rgba(0,0,0,.05);display:flex;flex-direction:column;gap:2px}
.tra-kpis b{font-size:26px;color:#b45309;font-weight:900}
.tra-kpis b small{font-size:14px;color:#94a3b8}
.tra-kpis span{font-size:12.5px;font-weight:800;color:#64748b}
.tra-kpis i{position:absolute;bottom:0;right:0;height:4px;background:#f59e0b}
.tra-dist{display:flex;align-items:flex-end;gap:4px;height:120px;margin-top:10px;padding-top:16px}
.tra-dist>div{flex:1;height:100%;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;position:relative}
.tra-dist i{width:100%;border-radius:6px 6px 0 0;min-height:2px}
.tra-dist small{font-size:10.5px;color:#64748b;font-weight:800}
.tra-dist em{position:absolute;top:-2px;font-style:normal;font-size:11px;font-weight:900;color:#1e293b}
.tra-tbl-wrap{overflow-x:auto}
.tra-tbl{width:100%;border-collapse:collapse;font-size:13px;min-width:760px}
.tra-tbl th{background:#0c1a2b;color:#fde68a;padding:9px 6px;font-weight:900;white-space:nowrap}
.tra-tbl td{border-bottom:1px solid #f1f5f9;padding:7px 6px;text-align:center;font-weight:700}
.tra-tbl .r{text-align:right}.tra-tbl .sm{font-size:11.5px;color:#64748b}
.tra-tbl tbody tr:hover{background:#fffbeb}
.tra-stage{border-radius:99px;padding:3px 9px;font-weight:900;font-size:12.5px;white-space:nowrap}
.tra-prog{position:relative;background:#f1f5f9;border-radius:99px;height:18px;min-width:80px;overflow:hidden;display:flex;align-items:center;justify-content:center}
.tra-prog i{position:absolute;top:0;bottom:0;right:0;background:linear-gradient(90deg,#fbbf24,#f59e0b)}
.tra-prog span{position:relative;font-size:11px;font-weight:900}
.tra-note{color:#64748b;font-weight:600;font-size:12.5px;line-height:1.8;margin:4px 0}
.tra-skill{display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px dashed #e2e8f0}
.tra-skill>div{flex:1}
.tra-skill b{font-size:14px}.tra-skill small{display:block;color:#94a3b8;font-weight:700;font-size:11.5px}
.tra-skill em{font-style:normal;font-weight:900;font-size:18px;min-width:52px;text-align:left}
.tra-sk-ic{width:36px;height:36px;border-radius:10px;display:grid;place-items:center;font-size:18px}
.tra-bar{height:8px;background:#f1f5f9;border-radius:99px;overflow:hidden;margin-top:4px}
.tra-bar i{display:block;height:100%;border-radius:99px}
.tra-map{min-width:900px;font-size:12px}.tra-map td{padding:5px 3px;font-weight:900}.tra-map th{padding:7px 3px}.tra-map td.r{white-space:nowrap;font-weight:800}
.tra-map-foot{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:10px;margin-top:12px}
.tra-map-foot>div{background:#f8fafc;border-radius:12px;padding:10px;display:flex;flex-wrap:wrap;gap:6px;align-items:center}
.tra-map-foot b{width:100%;font-size:13px}
.tra-map-foot span{background:#fff;border:1px solid #e2e8f0;border-radius:99px;padding:3px 9px;font-size:12px;font-weight:800}
.tra-none h4{margin:12px 0 6px;color:#1e3a8a}
.tra-none>div{display:flex;flex-wrap:wrap;gap:6px}
.tra-none span{background:#f8fafc;border:1px solid #e2e8f0;border-radius:99px;padding:4px 10px;font-size:12.5px;font-weight:700}
.tra-none span.noid{background:#fef2f2;border-color:#fecaca}
.tra-top{display:grid;gap:6px;margin-top:10px}
.tra-top-r{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:14px;background:#f8fafc}
.tra-top-r.p0{background:linear-gradient(90deg,#fef3c7,#fff)}.tra-top-r.p1{background:linear-gradient(90deg,#f1f5f9,#fff)}.tra-top-r.p2{background:linear-gradient(90deg,#ffedd5,#fff)}
.tra-top-r>div{flex:1}.tra-top-r b{display:block}.tra-top-r small{color:#64748b;font-weight:700}
.tra-top-r em{font-style:normal;font-weight:800;font-size:13px;color:#78350f}
.tra-rank{font-size:22px;min-width:32px;text-align:center;font-weight:900}
.tra-set{display:grid;gap:10px}
.tra-set label{display:flex;gap:8px;align-items:center;font-weight:800}
.tra-set select{border:1px solid #e2e8f0;border-radius:10px;padding:6px 10px;font-family:inherit;font-weight:800}
.tra-worlds{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px}
.tra-worlds>div{border-radius:14px;padding:10px;display:flex;flex-direction:column;gap:2px}
.tra-worlds span{font-size:24px}.tra-worlds small{font-weight:700;color:#475569}
.tra-modal{position:fixed;inset:0;background:rgba(12,26,43,.55);z-index:80;display:grid;place-items:center;padding:16px}
.tra-toast{position:fixed;bottom:22px;left:50%;transform:translateX(-50%);background:#0c1a2b;color:#fde68a;padding:10px 18px;border-radius:99px;font-weight:900;z-index:90;box-shadow:0 8px 24px rgba(0,0,0,.3)}
@media (max-width:600px){.tra-link{grid-template-columns:1fr}.tra-qr{grid-column:1;grid-row:auto;justify-self:center}.tra-hero h1{font-size:24px}}
`;
