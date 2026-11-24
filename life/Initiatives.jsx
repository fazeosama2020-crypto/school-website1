// ══════════════════════════════════════════════════════════
// 🚀 المبادرات المدرسية — تدوين وتوثيق كل مبادرة وفق بطاقة المبادرة المعتمدة في الميدان:
//   البيانات الأساسية • الارتباط الاستراتيجي • الفئة المستهدفة • المنفذون والشركاء • الفكرة والاحتياج • الأهداف • آلية التنفيذ • الموارد
//   • مؤشرات الأداء (الوضع الراهن/المستهدف/المتحقق) • النتائج والأثر • الإيجابيات والمعوقات والتوصيات • الشواهد والصور • الاعتماد
//   school-ini/{id} = البيانات (خفيفة، مع صورة غلاف مصغّرة) • school-ini-img/{id}/{k} = {d, cap, at} صور التقرير (تُحمَّل عند فتح المبادرة فقط)
// ══════════════════════════════════════════════════════════
import { React, useState, useEffect, useMemo, useRef, obj, arr, ar, uid, esc, nrm, hDate, when, Av, shrinkImg, loadPeople, aiJSON, aiHash, printDoc, printHead,
  logoIdea, logoSVG, cleanIcon, LOGO_STYLES, svgURL, svgToPng, LfStyle, Field, ListEd, PeoplePick, Loading, GRP } from "./core.jsx";

const N = "school-ini", NI = "school-ini-img";
const FIELDS = ["القيم والهوية الوطنية", "التحصيل الدراسي", "القراءة والكتابة", "اختبارات نافس", "الانضباط والحضور", "الصحة والسلامة", "البيئة والاستدامة", "التقنية والابتكار", "المواهب والإبداع", "الشراكة الأسرية والمجتمعية", "التطوع والمسؤولية", "التوجيه والإرشاد", "التنمية المهنية للمعلمين"];
const LINKS = ["رؤية المملكة ٢٠٣٠ — برنامج تنمية القدرات البشرية", "خطة التحسين المدرسي", "مجال الإدارة المدرسية", "مجال التعليم والتعلم", "مجال نواتج التعلم", "مجال البيئة المدرسية", "القيم والسلوك الإيجابي"];
const TG = ["جميع طلاب المدرسة", "طلاب الصف الأول", "طلاب الصف الثاني", "طلاب الصف الثالث", "فصول محددة", "طلاب محددون", "المعلمون", "أولياء الأمور", "المجتمع المحلي"];
const ST = { plan: ["📝 مخطط لها", "#64748b"], run: ["⚙️ قيد التنفيذ", "#2563eb"], done: ["✅ منفذة", "#15803d"] };
const STEP_ST = [["todo", "لم يبدأ", "#94a3b8"], ["run", "جارٍ", "#2563eb"], ["done", "تم", "#15803d"]];
const blank = me => ({ id: uid("in"), name: "", slogan: "", field: "", owner: me || "", links: [], summary: "", need: "", tg: [], tgCks: [], tgN: "", tgDesc: "", execs: [], partners: "", start: "", end: "", place: "", goals: [""], steps: [{ t: "", d: "", st: "todo" }], res: [""], kpis: [{ k: "", base: "", target: "", actual: "" }], results: "", pos: "", obs: "", recs: "", ev: "", status: "plan", photos: [], logo: null });
const prog = I => { const S = arr(I.steps).filter(s => s && s.t); return S.length ? Math.round(S.filter(s => s.st === "done").length / S.length * 100) : I.status === "done" ? 100 : 0; };

export function Initiatives({ api, me, canAll }) {
  const [L, setL] = useState(null); const [P, setP] = useState(null); const [ed, setEd] = useState(null); const [view, setView] = useState(null);
  const [fs, setFs] = useState("all"); const [ff, setFf] = useState(""); const [q, setQ] = useState("");
  const load = async () => { const d = await api.maGet(N); setL(Object.values(obj(d)).filter(x => x && x.id).sort((a, b) => (b.upd || b.at || 0) - (a.upd || a.at || 0))); };
  useEffect(() => { load(); loadPeople(api).then(setP).catch(() => setP({ principal: [], deputy: [], counselor: [], activity: [], admin: [], teachers: [], byCk: {}, all: [] })); }, []);
  const can = I => canAll || !I || I.by === me.name || arr(I.execs).some(x => nrm(x.name) === nrm(me.name));
  if (!L || !P) return <div className="lf"><LfStyle /><Loading /></div>;
  const LL = L.filter(I => (fs === "all" || I.status === fs) && (!ff || I.field === ff) && (!q || nrm(I.name + " " + (I.slogan || "")).includes(nrm(q))));
  const nImg = L.reduce((a, I) => a + arr(I.photos).length, 0);
  if (ed) return <IniEditor api={api} me={me} P={P} I0={ed} onClose={async saved => { setEd(null); if (saved) { await load(); setView(saved); } }} />;
  if (view) { const I = L.find(x => x.id === view) || null; if (I) return <IniView api={api} I={I} can={can(I)} onBack={() => setView(null)} onEdit={() => setEd(I)} onDel={async () => { if (!window.confirm(`حذف مبادرة «${I.name}» وكل صورها؟`)) return; await api.maPut(`${N}/${I.id}`, null); await api.maPut(`${NI}/${I.id}`, null); setView(null); load(); }} />; }
  return <div className="lf"><LfStyle />
    <div className="lf-hero" style={{ "--h1": "#0b2545", "--h2": "#1d4ed8" }}>
      <h2>🚀 مبادرات المدرسة</h2>
      <p>دوّن كل مبادرة تُنفَّذ في المدرسة ووثّقها كاملة: الفكرة والفئة المستهدفة والمنفذين والأهداف وآلية التنفيذ ومؤشرات الأداء والنتائج، مع الصور والشعار، ثم اطبع تقريرها الرسمي بضغطة.</p>
      <div className="lf-kp"><div><b>{ar(L.length)}</b><small>مبادرة</small></div><div><b>{ar(L.filter(x => x.status === "run").length)}</b><small>قيد التنفيذ</small></div><div><b>{ar(L.filter(x => x.status === "done").length)}</b><small>منفذة</small></div><div><b>{ar(nImg)}</b><small>صورة توثيق</small></div>
        <div style={{ marginInlineStart: "auto", background: "transparent", border: 0, padding: 0, display: "flex", alignItems: "center" }}><button className="lf-b g" style={{ fontSize: 15, padding: "11px 20px" }} onClick={() => setEd(blank(me.name))}>➕ مبادرة جديدة</button></div></div>
    </div>
    <div className="lf-card" style={{ display: "grid", gap: 10 }}>
      <div className="lf-h"><div className="lf-tabs" style={{ flex: "1 1 360px" }}>{[["all", "الكل"], ...Object.entries(ST).map(([k, v]) => [k, v[0]])].map(([k, t]) => <button key={k} className={fs === k ? "on" : ""} onClick={() => setFs(k)}>{t} ({ar(k === "all" ? L.length : L.filter(x => x.status === k).length)})</button>)}</div>
        <select className="lf-sel" style={{ width: 220 }} value={ff} onChange={e => setFf(e.target.value)}><option value="">كل المجالات</option>{FIELDS.map(f => <option key={f}>{f}</option>)}</select>
        <input className="lf-in" style={{ width: 200 }} placeholder="🔎 بحث" value={q} onChange={e => setQ(e.target.value)} /></div>
    </div>
    {!LL.length ? <div className="lf-card lf-empty"><b>🌱</b>{L.length ? "لا توجد مبادرات بهذا التصنيف" : "لم تُدوَّن أي مبادرة بعد — ابدأ بأول مبادرة، وسيبتكر الموقع شعارها من اسمها"}</div> :
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(min(100%,300px),1fr))", gap: 14 }}>{LL.map(I => { const p = prog(I), s = ST[I.status] || ST.plan;
        return <button key={I.id} onClick={() => setView(I.id)} className="lf-card" style={{ textAlign: "right", cursor: "pointer", font: "inherit", display: "grid", gap: 10, padding: 0, overflow: "hidden", border: "1px solid #e2e8f0" }}>
          <div style={{ position: "relative", height: 128, background: I.cover ? `center/cover url(${I.cover})` : `linear-gradient(135deg,${obj(I.logo).pal ? I.logo.pal[0] : "#0b2545"},${obj(I.logo).pal ? I.logo.pal[1] : "#1d4ed8"})` }}>
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,transparent 30%,rgba(2,6,23,.65))" }} />
            <span className="lf-st" style={{ "--c": s[1], position: "absolute", top: 10, left: 10, background: "#fff" }}>{s[0]}</span>
            {I.logoSvg && <img src={svgURL(I.logoSvg)} alt="" style={{ position: "absolute", right: 12, bottom: -34, width: 86, height: 86, filter: "drop-shadow(0 6px 10px rgba(0,0,0,.3))" }} />}
          </div>
          <div style={{ padding: "0 14px 14px", display: "grid", gap: 6, paddingTop: I.logoSvg ? 30 : 0 }}>
            <b style={{ fontSize: 17, color: "#0b2545", lineHeight: 1.5 }}>{I.name || "مبادرة بلا اسم"}</b>
            {I.slogan && <span style={{ color: "#b8860b", fontWeight: 800, fontSize: 13 }}>«{I.slogan}»</span>}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{I.field && <span className="lf-st" style={{ "--c": "#0369a1" }}>{I.field}</span>}{arr(I.tg).slice(0, 2).map(t => <span key={t} className="lf-st" style={{ "--c": "#7c3aed" }}>🎯 {t}</span>)}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={{ display: "flex" }}>{arr(I.execs).slice(0, 5).map((x, i) => <span key={i} style={{ marginInlineStart: i ? -8 : 0, border: "2px solid #fff", borderRadius: "50%" }}><Av n={x.name} s={26} /></span>)}</div><small style={{ color: "#64748b", fontWeight: 800 }}>{arr(I.execs).length ? `${ar(arr(I.execs).length)} منفذ` : ""}{I.start ? ` • ${hDate(I.start, { day: "numeric", month: "short" })}` : ""}</small><span className="lf-sp" />{arr(I.photos).length > 0 && <small style={{ fontWeight: 800, color: "#64748b" }}>📷 {ar(arr(I.photos).length)}</small>}</div>
            <div className="lf-bar" style={{ "--c": s[1] }}><i style={{ width: p + "%" }} /></div><small style={{ color: "#64748b", fontWeight: 800 }}>الإنجاز {ar(p)}٪ • آخر تحديث {when(I.upd || I.at)}</small>
          </div></button>; })}</div>}
  </div>;
}

// ── استوديو الشعار: يبتكر الموقع الشعار بمجرد كتابة الاسم (محليًا فورًا + بالذكاء الاصطناعي عند الطلب)
function LogoStudio({ api, I, set }) {
  const idea = logoIdea(I.name); const L0 = obj(I.logo);
  const [cons, setCons] = useState(L0.cons || []); const [busy, setBusy] = useState(""); const [err, setErr] = useState("");
  const cur = { style: L0.style || "seal", pal: L0.pal || idea.pal, emoji: L0.emoji || idea.emoji, icon: L0.icon || "", seed: idea.seed, name: I.name, slogan: I.slogan, school: obj(api.SP).name };
  const apply = o => { const n = { ...cur, ...o }; set({ logo: { style: n.style, pal: n.pal, emoji: n.emoji, icon: n.icon, cons }, logoSvg: logoSVG(n) }); };
  useEffect(() => { if (I.name) apply({}); }, [I.name, I.slogan]);  // يتجدد الشعار مع كل تعديل في الاسم أو الشعار اللفظي
  const ai = async () => {
    setErr(""); setBusy("✨ يبتكر الذكاء الاصطناعي شعار المبادرة…");
    try {
      const j = await aiJSON(api, `ابتكر هوية بصرية لمبادرة مدرسية في مدرسة متوسطة للبنين بالمملكة العربية السعودية.
اسم المبادرة: «${I.name}»${I.field ? `\nالمجال: ${I.field}` : ""}${arr(I.tg).length ? `\nالفئة المستهدفة: ${arr(I.tg).join("، ")}` : ""}${I.summary ? `\nالفكرة: ${I.summary.slice(0, 400)}` : ""}
المطلوب:
١) slogan: شعار لفظي جذاب قصير (٢–٥ كلمات) يعبّر عن المبادرة.
٢) concepts: ثلاثة تصاميم مختلفة، لكل تصميم: idea (فكرة الرمز في جملة)، emoji (رمز تعبيري واحد مناسب)، palette (ثلاثة ألوان hex: داكن ثم متوسط ثم فاتح/ذهبي متناسقة)، icon_svg: أيقونة مسطّحة احترافية بعناصر SVG فقط (path/circle/rect/polygon/ellipse/line/g) داخل مساحة 0 0 100 100 متمركزة، بلا وسم <svg> وبلا نصوص، من ٣ إلى ١٢ عنصرًا، بألوان من اللوحة مع الأبيض، خطوط واضحة جريئة تصلح للطباعة.`, {
        type: "object", properties: { slogan: { type: "string" }, concepts: { type: "array", items: { type: "object", properties: { idea: { type: "string" }, emoji: { type: "string" }, palette: { type: "array", items: { type: "string" } }, icon_svg: { type: "string" } }, required: ["idea", "emoji", "palette", "icon_svg"] } } }, required: ["slogan", "concepts"] }, "ini-logo", 5000);
      const C = arr(j.concepts).map(c => ({ idea: String(c.idea || ""), emoji: String(c.emoji || "").slice(0, 4) || idea.emoji, pal: arr(c.palette).filter(x => /^#[0-9a-f]{6}$/i.test(x)).slice(0, 3), icon: cleanIcon(c.icon_svg) })).map(c => ({ ...c, pal: c.pal.length === 3 ? c.pal : idea.pal })).slice(0, 3);
      if (!C.length) throw new Error("لم يصل تصميم صالح");
      setCons(C); const sl = !I.slogan && j.slogan ? String(j.slogan).slice(0, 40) : I.slogan;
      const n = { ...cur, pal: C[0].pal, emoji: C[0].emoji, icon: C[0].icon, slogan: sl };
      set({ slogan: sl, logo: { style: cur.style, pal: n.pal, emoji: n.emoji, icon: n.icon, cons: C }, logoSvg: logoSVG(n) });
    } catch (e) { setErr(e.message === "nohash" ? "الابتكار بالذكاء الاصطناعي يتطلب الدخول من بوابة الإداريين برقم السجل المدني — التصاميم أدناه مبتكرة محليًا من اسم المبادرة." : e.message); }
    setBusy("");
  };
  const EM = ["✨", "🌟", "💡", "🏆", "🎯", "📚", "🧮", "🔬", "💻", "🌱", "🤝", "🌴", "🕌", "⏰", "🛡️", "🎨", "🚀", "🎙️", "🏃", "🏡", "😊", "❤️", "🧠", "📖"];
  const PALS = [cur.pal, ...cons.map(c => c.pal), ["#0b2545", "#1d4ed8", "#d4af37"], ["#064e3b", "#10b981", "#fcd34d"], ["#4c1d95", "#8b5cf6", "#fbcfe8"], ["#7c2d12", "#f97316", "#fde68a"], ["#0c4a6e", "#0ea5e9", "#bae6fd"], ["#831843", "#db2777", "#fbcfe8"], ["#1f2937", "#475569", "#e2e8f0"]].filter((p, i, A) => A.findIndex(x => x.join() === p.join()) === i).slice(0, 10);
  const dl = async () => { const png = await svgToPng(I.logoSvg, 1200); const a = document.createElement("a"); a.href = png; a.download = `شعار-${I.name || "المبادرة"}.png`; a.click(); };
  if (!I.name) return <div className="lf-note">✍️ اكتب اسم المبادرة أولًا، وسيبتكر الموقع شعارها فورًا.</div>;
  return <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,300px),1fr))", gap: 14, alignItems: "start" }}>
    <div style={{ display: "grid", gap: 10, justifyItems: "center", background: "radial-gradient(circle at 50% 30%,#f8fafc,#e2e8f0)", borderRadius: 20, padding: 16 }}>
      {I.logoSvg && <img src={svgURL(I.logoSvg)} alt="شعار المبادرة" style={{ width: "min(100%,300px)", aspectRatio: "1", filter: "drop-shadow(0 14px 22px rgba(15,23,42,.28))" }} />}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}><button type="button" className="lf-b g" disabled={!!busy} onClick={ai}>{busy || "✨ ابتكر بالذكاء الاصطناعي"}</button><button type="button" className="lf-b" onClick={dl}>⬇️ تنزيل PNG</button></div>
      {err && <div className="lf-note" style={{ fontSize: 12 }}>{err}</div>}
    </div>
    <div style={{ display: "grid", gap: 12 }}>
      <div><b style={{ fontSize: 13.5 }}>القالب</b><div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginTop: 6 }}>{LOGO_STYLES.map(([k, t]) => <button type="button" key={k} onClick={() => apply({ style: k })} style={{ border: `2px solid ${cur.style === k ? "#1d4ed8" : "#e2e8f0"}`, borderRadius: 14, background: "#fff", padding: 6, cursor: "pointer", font: "inherit", fontWeight: 800, fontSize: 12 }}><img src={svgURL(logoSVG({ ...cur, style: k }))} alt="" style={{ width: "100%", aspectRatio: "1" }} />{t}</button>)}</div></div>
      {cons.length > 0 && <div><b style={{ fontSize: 13.5 }}>تصاميم الذكاء الاصطناعي</b><div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginTop: 6 }}>{cons.map((c, i) => <button type="button" key={i} title={c.idea} onClick={() => apply({ pal: c.pal, emoji: c.emoji, icon: c.icon })} style={{ border: `2px solid ${cur.icon === c.icon && cur.pal.join() === c.pal.join() ? "#b8860b" : "#e2e8f0"}`, borderRadius: 14, background: "#fff", padding: 6, cursor: "pointer", font: "inherit", fontSize: 11, fontWeight: 700, color: "#475569" }}><img src={svgURL(logoSVG({ ...cur, pal: c.pal, emoji: c.emoji, icon: c.icon }))} alt="" style={{ width: "100%", aspectRatio: "1" }} />{c.idea.slice(0, 40)}</button>)}</div></div>}
      <div><b style={{ fontSize: 13.5 }}>الألوان</b><div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>{PALS.map((p, i) => <button type="button" key={i} onClick={() => apply({ pal: p })} style={{ width: 46, height: 30, borderRadius: 10, border: `2.5px solid ${cur.pal.join() === p.join() ? "#0f172a" : "#fff"}`, boxShadow: "0 0 0 1px #cbd5e1", background: `linear-gradient(90deg,${p[0]} 0 40%,${p[1]} 40% 75%,${p[2]} 75%)`, cursor: "pointer" }} />)}</div></div>
      <div><b style={{ fontSize: 13.5 }}>الرمز</b>{cur.icon && <button type="button" className="lf-b sm" style={{ marginInlineStart: 8 }} onClick={() => apply({ icon: "" })}>استبدال أيقونة الذكاء برمز</button>}<div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 6 }}>{EM.map(e => <button type="button" key={e} onClick={() => apply({ emoji: e, icon: "" })} style={{ width: 38, height: 38, fontSize: 20, borderRadius: 10, border: `2px solid ${!cur.icon && cur.emoji === e ? "#1d4ed8" : "#e2e8f0"}`, background: "#fff", cursor: "pointer" }}>{e}</button>)}</div></div>
    </div>
  </div>;
}

function IniEditor({ api, me, P, I0, onClose }) {
  const isNew = !I0.at; const [I, setI] = useState({ ...blank(me.name), ...I0 }); const [tab, setTab] = useState(0); const [busy, setBusy] = useState(""); const [imgs, setImgs] = useState(null); const [S, setS] = useState(null);
  const set = o => setI(x => ({ ...x, ...o })); const f = k => e => set({ [k]: e.target.value });
  useEffect(() => { api.maGet(`${NI}/${I.id}`).then(d => setImgs(obj(d))); api.maGet(api.MA_ROSTER).then(r => setS(obj(r))).catch(() => setS({})); }, []);
  const tog = (k, v) => set({ [k]: arr(I[k]).includes(v) ? arr(I[k]).filter(x => x !== v) : [...arr(I[k]), v] });
  const save = async () => {
    if (!I.name.trim()) { setTab(0); alert("اكتب اسم المبادرة"); return; } setBusy("💾 جارٍ الحفظ…");
    const clean = { ...I, goals: arr(I.goals).filter(x => String(x).trim()), res: arr(I.res).filter(x => String(x).trim()), steps: arr(I.steps).filter(s => s && String(s.t).trim()), kpis: arr(I.kpis).filter(k => k && String(k.k).trim()), by: I.by || me.name, at: I.at || Date.now(), upd: Date.now(), updBy: me.name };
    await api.maPut(`${N}/${I.id}`, clean); setBusy(""); onClose(I.id);
  };
  const cancel = async () => { if (isNew && imgs && Object.keys(imgs).length && !window.confirm("لم تُحفظ المبادرة — حذف الصور المرفوعة والخروج؟")) return; if (isNew && imgs && Object.keys(imgs).length) await api.maPut(`${NI}/${I.id}`, null); onClose(null); };
  const upload = async files => {
    const F = [...files].filter(x => /^image\//.test(x.type)).slice(0, Math.max(0, 16 - arr(I.photos).length)); if (!F.length) { if (arr(I.photos).length >= 16) alert("الحد ١٦ صورة لكل مبادرة"); return; }
    const ph = [...arr(I.photos)]; const im = { ...imgs }; let cover = I.cover, coverK = I.coverK;
    for (let i = 0; i < F.length; i++) { setBusy(`📷 ضغط ورفع الصورة ${ar(i + 1)} من ${ar(F.length)}…`); const d = await shrinkImg(F[i], 1280, .72); const k = "p" + Date.now().toString(36) + i; await api.maPut(`${NI}/${I.id}/${k}`, { d, at: Date.now() }); im[k] = { d }; ph.push({ k, cap: "" }); if (!cover) { cover = await shrinkImg(F[i], 520, .7); coverK = k; } }
    setImgs(im); set({ photos: ph, cover, coverK }); setBusy("");
  };
  const delImg = async k => { await api.maPut(`${NI}/${I.id}/${k}`, null); const im = { ...imgs }; delete im[k]; setImgs(im); set({ photos: arr(I.photos).filter(p => p.k !== k) }); };
  const makeCover = async k => { const d = obj(imgs[k]).d; if (!d) return; const im = new Image(); im.onload = () => { const s = Math.min(1, 520 / im.width); const c = document.createElement("canvas"); c.width = im.width * s; c.height = im.height * s; c.getContext("2d").drawImage(im, 0, 0, c.width, c.height); set({ cover: c.toDataURL("image/jpeg", .7), coverK: k }); }; im.src = d; };
  const aiDraft = async () => {
    if (!I.name.trim()) { alert("اكتب اسم المبادرة أولًا"); return; } setBusy("✨ يصوغ الذكاء الاصطناعي المبادرة…");
    try {
      const j = await aiJSON(api, `صغ بطاقة مبادرة مدرسية عملية لمدرسة متوسطة بنين في المملكة العربية السعودية.
اسم المبادرة: «${I.name}»${I.field ? `\nالمجال: ${I.field}` : ""}${arr(I.tg).length ? `\nالفئة المستهدفة: ${arr(I.tg).join("، ")}` : ""}${I.summary ? `\nملاحظات المدرسة عن الفكرة: ${I.summary.slice(0, 600)}` : ""}
أعد: slogan (شعار لفظي قصير)، summary (فكرة المبادرة في ٢–٣ جمل)، need (الاحتياج والمبررات في جملتين)، goals (٣–٥ أهداف إجرائية قابلة للقياس)، steps (٤–٧ خطوات تنفيذ مرتبة)، resources (الموارد المطلوبة)، kpis (٣–٤ مؤشرات أداء لكل منها k اسم المؤشر و target القيمة المستهدفة كنسبة أو عدد)، links (اختر ما يناسب من: ${LINKS.join("، ")}).`, {
        type: "object", properties: { slogan: { type: "string" }, summary: { type: "string" }, need: { type: "string" }, goals: { type: "array", items: { type: "string" } }, steps: { type: "array", items: { type: "string" } }, resources: { type: "array", items: { type: "string" } }, kpis: { type: "array", items: { type: "object", properties: { k: { type: "string" }, target: { type: "string" } }, required: ["k", "target"] } }, links: { type: "array", items: { type: "string" } } }, required: ["summary", "goals", "steps", "kpis"] }, "ini-draft", 3500);
      const emp = a => !arr(a).some(x => (typeof x === "string" ? x : obj(x).t || obj(x).k || "").trim());
      set({ slogan: I.slogan || String(j.slogan || "").slice(0, 40), summary: I.summary.trim() ? I.summary : j.summary || "", need: I.need || j.need || "",
        goals: emp(I.goals) ? arr(j.goals) : I.goals, steps: emp(I.steps) ? arr(j.steps).map(t => ({ t, d: "", st: "todo" })) : I.steps, res: emp(I.res) ? arr(j.resources) : I.res,
        kpis: emp(I.kpis) ? arr(j.kpis).map(k => ({ k: k.k, base: "", target: k.target, actual: "" })) : I.kpis, links: arr(I.links).length ? I.links : arr(j.links).filter(x => LINKS.includes(x)) });
    } catch (e) { alert(e.message === "nohash" ? "الصياغة بالذكاء الاصطناعي تتطلب الدخول من بوابة الإداريين برقم السجل المدني" : e.message); }
    setBusy("");
  };
  const TABS = [["🎨", "الهوية والشعار"], ["📋", "البيانات والفئة المستهدفة"], ["🎯", "الأهداف والتنفيذ"], ["📊", "المؤشرات والنتائج"], ["📷", "الشواهد والصور"]];
  const classes = Object.keys(obj(S)).sort();
  return <div className="lf"><LfStyle />
    <div className="lf-hero" style={{ "--h1": "#0b2545", "--h2": obj(I.logo).pal ? I.logo.pal[1] : "#1d4ed8", display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
      {I.logoSvg && <img src={svgURL(I.logoSvg)} alt="" style={{ width: 92, height: 92, filter: "drop-shadow(0 8px 14px rgba(0,0,0,.35))" }} />}
      <div style={{ flex: 1, minWidth: 200 }}><h2>{isNew ? "✍️ مبادرة جديدة" : "✏️ تعديل المبادرة"}</h2><p style={{ fontSize: 20, fontWeight: 900, opacity: 1, color: "#fde68a" }}>{I.name || "اسم المبادرة"}</p>{I.slogan && <p>«{I.slogan}»</p>}</div>
      <div style={{ display: "flex", gap: 8, position: "relative", zIndex: 1 }}><button className="lf-b" onClick={cancel}>إلغاء</button><button className="lf-b g" disabled={!!busy} onClick={save}>{busy || "💾 حفظ المبادرة"}</button></div>
    </div>
    <div className="lf-tabs">{TABS.map(([ic, t], i) => <button key={i} className={tab === i ? "on" : ""} onClick={() => setTab(i)}>{ic} {t}</button>)}</div>
    {tab === 0 && <div className="lf-card" style={{ display: "grid", gap: 14 }}>
      <div className="lf-g2"><Field l="اسم المبادرة *" s="اكتب الاسم وسيُبتكر الشعار فورًا"><input className="lf-in" style={{ fontSize: 18, fontWeight: 900 }} value={I.name} onChange={f("name")} placeholder="مثال: سفراء القراءة" /></Field>
        <Field l="الشعار اللفظي" s="عبارة قصيرة تظهر على الشعار والتقرير"><input className="lf-in" value={I.slogan} onChange={f("slogan")} maxLength={40} placeholder="مثال: نقرأ لنرتقي" /></Field></div>
      <div className="lf-sec"><h4><i>🎨</i>شعار المبادرة المبتكر</h4><LogoStudio api={api} I={I} set={set} /></div>
      <div className="lf-note">💡 بعد كتابة الاسم يمكنك ضغط «✨ صياغة المبادرة بالذكاء الاصطناعي» في تبويب «الأهداف والتنفيذ» لاقتراح الفكرة والأهداف والخطوات والمؤشرات (تُملأ الحقول الفارغة فقط).</div>
    </div>}
    {tab === 1 && <div className="lf-card" style={{ display: "grid", gap: 14 }}>
      <div className="lf-sec"><h4><i>📋</i>البيانات الأساسية</h4>
        <div className="lf-g3"><Field l="مجال المبادرة"><select className="lf-sel" value={I.field} onChange={f("field")}><option value="">— اختر —</option>{FIELDS.map(x => <option key={x}>{x}</option>)}</select></Field>
          <Field l="مسؤول المبادرة (مالكها)"><input className="lf-in" value={I.owner} onChange={f("owner")} list="lf-people" /></Field>
          <Field l="حالة المبادرة"><select className="lf-sel" value={I.status} onChange={f("status")}>{Object.entries(ST).map(([k, v]) => <option key={k} value={k}>{v[0]}</option>)}</select></Field>
          <Field l="تاريخ البدء"><input className="lf-in" type="date" value={I.start} onChange={f("start")} /></Field><Field l="تاريخ الانتهاء"><input className="lf-in" type="date" value={I.end} onChange={f("end")} /></Field>
          <Field l="مكان التنفيذ"><input className="lf-in" value={I.place} onChange={f("place")} placeholder="مثال: مصادر التعلم، الفصول، الساحة" /></Field></div>
        <datalist id="lf-people">{P.all.map(x => <option key={x.key} value={x.name} />)}</datalist>
        <Field l="الارتباط الاستراتيجي"><div className="lf-chips">{LINKS.map(x => <button type="button" key={x} className={"lf-chip" + (arr(I.links).includes(x) ? " on" : "")} onClick={() => tog("links", x)}>{x}</button>)}</div></Field>
      </div>
      <div className="lf-sec"><h4><i>🎯</i>الفئة المستهدفة</h4>
        <div className="lf-chips">{TG.map(x => <button type="button" key={x} className={"lf-chip" + (arr(I.tg).includes(x) ? " on" : "")} style={{ "--c": "#7c3aed" }} onClick={() => tog("tg", x)}>{x}</button>)}</div>
        {arr(I.tg).includes("فصول محددة") && <div className="lf-chips">{classes.map(ck => <button type="button" key={ck} className={"lf-chip" + (arr(I.tgCks).includes(ck) ? " on" : "")} onClick={() => tog("tgCks", ck)}>{api.maClassName(ck)}</button>)}</div>}
        <div className="lf-g2"><Field l="عدد المستفيدين المتوقع"><input className="lf-in" value={I.tgN} onChange={f("tgN")} placeholder="مثال: ١٢٠ طالبًا" /></Field><Field l="وصف الفئة"><input className="lf-in" value={I.tgDesc} onChange={f("tgDesc")} placeholder="مثال: الطلاب الأقل تفاعلًا في نافس" /></Field></div>
      </div>
      <div className="lf-sec"><h4><i>👥</i>المنفذون ({ar(arr(I.execs).length)})</h4><PeoplePick P={P} sel={I.execs} set={v => set({ execs: v })} groups={["principal", "deputy", "counselor", "activity", "admin", "teachers"]} />
        <Field l="الشركاء والمساهمون من خارج المدرسة"><input className="lf-in" value={I.partners} onChange={f("partners")} placeholder="مثال: مكتب التعليم، مكتبة الملك فهد، جمعية…" /></Field></div>
    </div>}
    {tab === 2 && <div className="lf-card" style={{ display: "grid", gap: 14 }}>
      <div className="lf-h"><b>🎯 الفكرة والأهداف وآلية التنفيذ</b><span className="lf-sp" /><button className="lf-b g" disabled={!!busy} onClick={aiDraft}>{busy || "✨ صياغة المبادرة بالذكاء الاصطناعي"}</button></div>
      <div className="lf-g2"><Field l="فكرة المبادرة (ملخص)"><textarea className="lf-ta" value={I.summary} onChange={f("summary")} /></Field><Field l="الاحتياج والمبررات" s="ما المشكلة أو الفرصة التي دعت إليها؟ وما شاهدها؟"><textarea className="lf-ta" value={I.need} onChange={f("need")} /></Field></div>
      <div className="lf-sec"><h4><i>🎯</i>الأهداف</h4><ListEd v={I.goals} set={v => set({ goals: v })} ph="هدف إجرائي قابل للقياس" add="➕ هدف" /></div>
      <div className="lf-sec"><h4><i>🛠️</i>آلية التنفيذ (الخطوات)</h4>
        {arr(I.steps).map((s, i) => <div key={i} className="lf-li" style={{ flexWrap: "wrap" }}><span style={{ fontWeight: 900, color: "#94a3b8", width: 18 }}>{ar(i + 1)}</span><input className="lf-in" style={{ flex: "3 1 220px" }} value={s.t} placeholder="الخطوة" onChange={e => { const n = [...I.steps]; n[i] = { ...s, t: e.target.value }; set({ steps: n }); }} />
          <input className="lf-in" type="date" style={{ flex: "1 1 140px" }} value={s.d || ""} onChange={e => { const n = [...I.steps]; n[i] = { ...s, d: e.target.value }; set({ steps: n }); }} />
          <div className="lf-chips">{STEP_ST.map(([k, t, c]) => <button type="button" key={k} className={"lf-chip" + (s.st === k ? " on" : "")} style={{ "--c": c, padding: "4px 10px" }} onClick={() => { const n = [...I.steps]; n[i] = { ...s, st: k }; set({ steps: n }); }}>{t}</button>)}</div>
          <button type="button" className="lf-b sm d" onClick={() => set({ steps: I.steps.filter((_, j) => j !== i) })}>✕</button></div>)}
        <button type="button" className="lf-b sm" style={{ justifySelf: "start" }} onClick={() => set({ steps: [...arr(I.steps), { t: "", d: "", st: "todo" }] })}>➕ خطوة</button></div>
      <div className="lf-sec"><h4><i>📦</i>الموارد المطلوبة</h4><ListEd v={I.res} set={v => set({ res: v })} ph="مورد بشري أو مادي أو تقني" add="➕ مورد" /></div>
    </div>}
    {tab === 3 && <div className="lf-card" style={{ display: "grid", gap: 14 }}>
      <div className="lf-sec"><h4><i>📊</i>مؤشرات الأداء</h4>
        <div className="lf-scroll"><table className="lf-tbl"><thead><tr><th>المؤشر</th><th>الوضع الراهن</th><th>المستهدف</th><th>المتحقق</th><th></th></tr></thead><tbody>{arr(I.kpis).map((k, i) => <tr key={i}>{["k", "base", "target", "actual"].map(x => <td key={x}><input className="lf-in" style={{ minWidth: x === "k" ? 200 : 90 }} value={k[x] || ""} onChange={e => { const n = [...I.kpis]; n[i] = { ...k, [x]: e.target.value }; set({ kpis: n }); }} /></td>)}<td><button type="button" className="lf-b sm d" onClick={() => set({ kpis: I.kpis.filter((_, j) => j !== i) })}>✕</button></td></tr>)}</tbody></table></div>
        <button type="button" className="lf-b sm" style={{ justifySelf: "start" }} onClick={() => set({ kpis: [...arr(I.kpis), { k: "", base: "", target: "", actual: "" }] })}>➕ مؤشر</button></div>
      <Field l="النتائج والأثر" s="ما الذي تحقق فعلًا؟ أرقام ومقارنات قبل وبعد إن وُجدت"><textarea className="lf-ta" value={I.results} onChange={f("results")} /></Field>
      <div className="lf-g3"><Field l="الإيجابيات"><textarea className="lf-ta" value={I.pos} onChange={f("pos")} /></Field><Field l="المعوقات والتحديات"><textarea className="lf-ta" value={I.obs} onChange={f("obs")} /></Field><Field l="التوصيات"><textarea className="lf-ta" value={I.recs} onChange={f("recs")} /></Field></div>
    </div>}
    {tab === 4 && <div className="lf-card" style={{ display: "grid", gap: 14 }}>
      <div className="lf-note">📷 الصور أهم شواهد المبادرة: تُثبت التنفيذ، وتنقل الأثر لمن لم يحضر، وتُعتمد في ملفات الإنجاز والتقويم المدرسي. التقط صورًا لكل مرحلة (الإطلاق • التنفيذ • المشاركين • النتائج • التكريم) واكتب تحت كل صورة وصفًا قصيرًا. تُضغط الصور تلقائيًا (الحد ١٦ صورة) وتُحمَّل فقط عند فتح المبادرة حتى لا تثقل الموقع.</div>
      <div className="lf-h"><label className="lf-b p" style={{ cursor: "pointer" }}>📤 رفع صور<input type="file" accept="image/*" multiple hidden onChange={e => { upload(e.target.files); e.target.value = ""; }} /></label><small style={{ fontWeight: 800, color: "#64748b" }}>{ar(arr(I.photos).length)} / ١٦</small>{busy && <b style={{ color: "#1d4ed8" }}>{busy}</b>}</div>
      {!imgs ? <Loading t="تحميل الصور…" /> : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(min(100%,210px),1fr))", gap: 10 }}>{arr(I.photos).map((p, i) => <div key={p.k} style={{ border: "1px solid #e2e8f0", borderRadius: 14, overflow: "hidden", background: "#fff" }}>
        <div style={{ position: "relative" }}>{obj(imgs[p.k]).d ? <img src={imgs[p.k].d} alt="" style={{ width: "100%", height: 150, objectFit: "cover", display: "block" }} /> : <div style={{ height: 150, display: "grid", placeItems: "center", color: "#94a3b8" }}>…</div>}
          {I.coverK === p.k && <span className="lf-st" style={{ "--c": "#b8860b", position: "absolute", top: 6, right: 6, background: "#fff" }}>⭐ الغلاف</span>}</div>
        <div style={{ padding: 8, display: "grid", gap: 6 }}><input className="lf-in" style={{ fontSize: 12.5, padding: "6px 9px" }} placeholder="وصف الصورة" value={p.cap || ""} onChange={e => { const n = [...I.photos]; n[i] = { ...p, cap: e.target.value }; set({ photos: n }); }} />
          <div style={{ display: "flex", gap: 6 }}><button type="button" className="lf-b sm" onClick={() => makeCover(p.k)}>⭐ غلاف</button><span className="lf-sp" /><button type="button" className="lf-b sm d" onClick={() => delImg(p.k)}>🗑️</button></div></div></div>)}</div>}
      <Field l="روابط شواهد أخرى (فيديو، تغريدة، نموذج…)"><textarea className="lf-ta" style={{ minHeight: 60 }} value={I.ev} onChange={f("ev")} placeholder="رابط في كل سطر" /></Field>
    </div>}
    <div style={{ display: "flex", gap: 8, justifyContent: "space-between" }}><button className="lf-b" disabled={tab === 0} onClick={() => setTab(tab - 1)}>→ السابق</button><button className="lf-b g" disabled={!!busy} onClick={save}>{busy || "💾 حفظ المبادرة"}</button><button className="lf-b" disabled={tab === TABS.length - 1} onClick={() => setTab(tab + 1)}>التالي ←</button></div>
  </div>;
}

// ── عرض المبادرة + الطباعة
function IniView({ api, I, can, onBack, onEdit, onDel }) {
  const [imgs, setImgs] = useState(null); useEffect(() => { api.maGet(`${NI}/${I.id}`).then(d => setImgs(obj(d))); }, [I.id]);
  const s = ST[I.status] || ST.plan, p = prog(I), pal = obj(I.logo).pal || ["#0b2545", "#1d4ed8", "#d4af37"];
  const rows = [["مجال المبادرة", I.field], ["مسؤول المبادرة", I.owner], ["الفئة المستهدفة", [...arr(I.tg).filter(t => t !== "فصول محددة"), ...arr(I.tgCks).map(api.maClassName)].join("، ") + (I.tgDesc ? ` — ${I.tgDesc}` : "")], ["عدد المستفيدين", I.tgN], ["مدة التنفيذ", [I.start && hDate(I.start), I.end && hDate(I.end)].filter(Boolean).join(" ← ")], ["مكان التنفيذ", I.place], ["الارتباط الاستراتيجي", arr(I.links).join("، ")], ["الشركاء", I.partners], ["حالة المبادرة", s[0].replace(/^\S+\s/, "")]].filter(r => r[1]);
  const report = () => {
    const ph = arr(I.photos).filter(x => obj(obj(imgs)[x.k]).d);
    const sec = (t, h) => h ? `<h2>${t}</h2>${h}` : ""; const ul = L => arr(L).length ? `<ul style="margin:0;padding-inline-start:20px">${arr(L).map(x => `<li>${esc(x)}</li>`).join("")}</ul>` : ""; const tx = t => t ? `<div style="white-space:pre-wrap">${esc(t)}</div>` : "";
    printDoc(`تقرير مبادرة ${I.name}`, `${printHead(api, "تقرير توثيق مبادرة", obj(api.SP).name || "")}
<div class="av" style="display:flex;align-items:center;gap:18px;border-radius:18px;padding:14px 18px;background:linear-gradient(135deg,${pal[0]},${pal[1]});color:#fff;margin-bottom:10px">${I.logoSvg ? `<img src="${svgURL(I.logoSvg)}" style="width:120px;height:120px;background:#fff;border-radius:50%;padding:4px">` : ""}<div style="flex:1"><div style="font-size:13px;font-weight:800;opacity:.85">مبادرة</div><div style="font-size:34px;font-weight:900;line-height:1.3">${esc(I.name)}</div>${I.slogan ? `<div style="font-size:16px;font-weight:800;color:${pal[2]}">«${esc(I.slogan)}»</div>` : ""}</div><div style="text-align:center;font-weight:900"><div style="font-size:30px">${ar(p)}٪</div><div style="font-size:11px">نسبة الإنجاز</div></div></div>
<table>${rows.map(r => `<tr><td class="k">${r[0]}</td><td>${esc(r[1])}</td></tr>`).join("")}${arr(I.execs).length ? `<tr><td class="k">المنفذون</td><td>${arr(I.execs).map(x => `<span class="chip">${esc(x.name)}${x.job ? ` — ${esc(x.job)}` : ""}</span>`).join("")}</td></tr>` : ""}</table>
${sec("فكرة المبادرة", tx(I.summary))}${sec("الاحتياج والمبررات", tx(I.need))}${sec("الأهداف", ul(I.goals))}
${arr(I.steps).length ? `<h2>آلية التنفيذ</h2><table><tr><th>م</th><th>الخطوة</th><th>التاريخ</th><th>الحالة</th></tr>${arr(I.steps).map((x, i) => `<tr><td style="width:30px;text-align:center">${ar(i + 1)}</td><td>${esc(x.t)}</td><td style="width:120px">${x.d ? hDate(x.d, { day: "numeric", month: "short" }) : ""}</td><td style="width:70px">${(STEP_ST.find(y => y[0] === x.st) || STEP_ST[0])[1]}</td></tr>`).join("")}</table>` : ""}
${sec("الموارد", ul(I.res))}
${arr(I.kpis).length ? `<h2>مؤشرات الأداء</h2><table><tr><th>المؤشر</th><th>الوضع الراهن</th><th>المستهدف</th><th>المتحقق</th></tr>${arr(I.kpis).map(k => `<tr><td>${esc(k.k)}</td><td>${esc(k.base || "")}</td><td>${esc(k.target || "")}</td><td><b>${esc(k.actual || "")}</b></td></tr>`).join("")}</table>` : ""}
${sec("النتائج والأثر", tx(I.results))}${I.pos || I.obs || I.recs ? `<table><tr><th>الإيجابيات</th><th>المعوقات</th><th>التوصيات</th></tr><tr><td style="white-space:pre-wrap">${esc(I.pos || "")}</td><td style="white-space:pre-wrap">${esc(I.obs || "")}</td><td style="white-space:pre-wrap">${esc(I.recs || "")}</td></tr></table>` : ""}
${ph.length ? `<h2>الشواهد المصوّرة</h2><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">${ph.map(x => `<figure class="av" style="margin:0;border:1px solid #cbd5e1;border-radius:12px;overflow:hidden"><img src="${imgs[x.k].d}" style="width:100%;height:230px;object-fit:cover;display:block"><figcaption style="padding:4px 8px;font-weight:800;font-size:11.5px;text-align:center">${esc(x.cap || "")}</figcaption></figure>`).join("")}</div>` : ""}
${I.ev ? `<h2>روابط الشواهد</h2><div style="direction:ltr;text-align:left;font-size:11px">${esc(I.ev).replace(/\n/g, "<br>")}</div>` : ""}
<div class="sg"><div>مسؤول المبادرة<br>${esc(I.owner || "")}</div><div>رائد النشاط / الوكيل</div><div>مدير المدرسة<br>${esc(obj(api.SP).principal || "")}</div></div>`);
  };
  const poster = () => printDoc(`ملصق ${I.name}`, `<div style="height:270mm;border-radius:26px;overflow:hidden;position:relative;background:linear-gradient(160deg,${pal[0]},${pal[1]});color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:30px">
<div style="position:absolute;top:18px;right:24px;font-weight:800;font-size:13px;opacity:.9;text-align:right;line-height:1.7">${esc(obj(api.SP).name || "")}<br>${esc(obj(api.SP).region || "")}</div>${api.logo ? `<img src="${api.logo}" style="position:absolute;top:16px;left:22px;height:70px;background:#fff;border-radius:50%;padding:3px">` : ""}
${I.logoSvg ? `<img src="${svgURL(I.logoSvg)}" style="width:330px;height:330px;filter:drop-shadow(0 20px 30px rgba(0,0,0,.35))">` : ""}<div style="font-size:20px;font-weight:800;opacity:.85;margin-top:14px">تطلق المدرسة مبادرة</div><div style="font-size:58px;font-weight:900;line-height:1.25">${esc(I.name)}</div>${I.slogan ? `<div style="font-size:26px;font-weight:900;color:${pal[2]};margin-top:6px">«${esc(I.slogan)}»</div>` : ""}
${arr(I.goals).length ? `<div style="background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.3);border-radius:18px;padding:14px 22px;margin-top:22px;text-align:right;font-size:16px;font-weight:700;max-width:520px">${arr(I.goals).slice(0, 4).map(g => `<div>✦ ${esc(g)}</div>`).join("")}</div>` : ""}
<div style="display:flex;gap:14px;margin-top:22px;font-weight:800;font-size:15px">${arr(I.tg).length ? `<span style="background:${pal[2]};color:${pal[0]};border-radius:99px;padding:6px 18px">🎯 ${esc(arr(I.tg).filter(t => t !== "فصول محددة").slice(0, 2).join("، ") || "طلاب محددون")}</span>` : ""}${I.start ? `<span style="background:rgba(255,255,255,.15);border-radius:99px;padding:6px 18px">📅 ${hDate(I.start)}</span>` : ""}</div></div>`);
  return <div className="lf"><LfStyle />
    <div className="lf-hero" style={{ "--h1": pal[0], "--h2": pal[1], display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap" }}>
      {I.logoSvg && <img src={svgURL(I.logoSvg)} alt="" style={{ width: 130, height: 130, filter: "drop-shadow(0 12px 20px rgba(0,0,0,.4))" }} />}
      <div style={{ flex: 1, minWidth: 220, position: "relative", zIndex: 1 }}><small style={{ fontWeight: 800, opacity: .85 }}>مبادرة</small><h2 style={{ fontSize: 32 }}>{I.name}</h2>{I.slogan && <p style={{ color: pal[2], fontSize: 18, fontWeight: 900, opacity: 1 }}>«{I.slogan}»</p>}
        <div className="lf-kp"><div><b>{ar(p)}٪</b><small>الإنجاز</small></div><div><b>{ar(arr(I.execs).length)}</b><small>منفذ</small></div><div><b>{ar(arr(I.goals).length)}</b><small>هدف</small></div><div><b>{ar(arr(I.photos).length)}</b><small>صورة</small></div></div></div>
    </div>
    <div className="lf-card lf-h" style={{ gap: 8 }}><button className="lf-b" onClick={onBack}>→ كل المبادرات</button><span className="lf-st" style={{ "--c": s[1] }}>{s[0]}</span><span className="lf-sp" />
      <button className="lf-b p" disabled={!imgs} onClick={report}>🖨️ تقرير المبادرة</button><button className="lf-b g" onClick={poster}>🪧 ملصق المبادرة</button>{can && <button className="lf-b" onClick={onEdit}>✏️ تعديل</button>}{can && <button className="lf-b d" onClick={onDel}>🗑️</button>}</div>
    <div className="lf-g2" style={{ alignItems: "start" }}>
      <div className="lf-card" style={{ display: "grid", gap: 8 }}><b style={{ color: "#0b2545" }}>📋 بطاقة المبادرة</b><table className="lf-tbl"><tbody>{rows.map(r => <tr key={r[0]}><td style={{ color: "#64748b", width: 140 }}>{r[0]}</td><td>{r[1]}</td></tr>)}</tbody></table>
        {arr(I.execs).length > 0 && <><b style={{ color: "#0b2545" }}>👥 المنفذون</b><div className="lf-g3">{arr(I.execs).map((x, i) => <div key={i} className="lf-pp" style={{ cursor: "default", "--c": obj(GRP[x.grp])[2] }}><Av n={x.name} s={30} c={(GRP[x.grp] || [])[2]} /><span>{x.name}<small>{x.job || (GRP[x.grp] || [])[1] || ""}</small></span></div>)}</div></>}</div>
      <div className="lf-card" style={{ display: "grid", gap: 10 }}>{I.summary && <div><b style={{ color: "#0b2545" }}>💡 الفكرة</b><p style={{ margin: "4px 0", fontWeight: 700, lineHeight: 1.9, whiteSpace: "pre-wrap" }}>{I.summary}</p></div>}
        {arr(I.goals).length > 0 && <div><b style={{ color: "#0b2545" }}>🎯 الأهداف</b><ul style={{ margin: "4px 0", paddingInlineStart: 20, fontWeight: 700, lineHeight: 1.9 }}>{arr(I.goals).map((g, i) => <li key={i}>{g}</li>)}</ul></div>}
        {arr(I.steps).length > 0 && <div><b style={{ color: "#0b2545" }}>🛠️ التنفيذ</b>{arr(I.steps).map((x, i) => { const st = STEP_ST.find(y => y[0] === x.st) || STEP_ST[0]; return <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", padding: "5px 0", borderBottom: "1px dashed #e2e8f0", fontWeight: 700 }}><span className="lf-st" style={{ "--c": st[2] }}>{st[1]}</span><span style={{ flex: 1 }}>{x.t}</span><small style={{ color: "#64748b" }}>{x.d ? hDate(x.d, { day: "numeric", month: "short" }) : ""}</small></div>; })}</div>}</div>
    </div>
    {arr(I.kpis).length > 0 && <div className="lf-card"><b style={{ color: "#0b2545" }}>📊 مؤشرات الأداء</b><div className="lf-scroll"><table className="lf-tbl" style={{ marginTop: 6 }}><thead><tr><th>المؤشر</th><th>الراهن</th><th>المستهدف</th><th>المتحقق</th></tr></thead><tbody>{arr(I.kpis).map((k, i) => <tr key={i}><td>{k.k}</td><td>{k.base}</td><td>{k.target}</td><td style={{ color: "#15803d", fontWeight: 900 }}>{k.actual}</td></tr>)}</tbody></table></div></div>}
    {(I.results || I.pos || I.obs || I.recs) && <div className="lf-g3">{[["🏁 النتائج والأثر", I.results, "#15803d"], ["👍 الإيجابيات", I.pos, "#0369a1"], ["⚠️ المعوقات", I.obs, "#b45309"], ["📌 التوصيات", I.recs, "#7c3aed"]].filter(x => x[1]).map(([t, v, c]) => <div key={t} className="lf-card" style={{ borderTop: `4px solid ${c}` }}><b style={{ color: c }}>{t}</b><p style={{ margin: "4px 0 0", whiteSpace: "pre-wrap", fontWeight: 700, lineHeight: 1.9 }}>{v}</p></div>)}</div>}
    {arr(I.photos).length > 0 && <div className="lf-card"><b style={{ color: "#0b2545" }}>📷 الشواهد المصوّرة</b>{!imgs ? <Loading t="تحميل الصور…" /> : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(min(100%,240px),1fr))", gap: 10, marginTop: 8 }}>{arr(I.photos).map(x => obj(imgs[x.k]).d && <figure key={x.k} style={{ margin: 0, borderRadius: 14, overflow: "hidden", border: "1px solid #e2e8f0" }}><a href={imgs[x.k].d} target="_blank" rel="noreferrer"><img src={imgs[x.k].d} alt="" style={{ width: "100%", height: 180, objectFit: "cover", display: "block" }} /></a>{x.cap && <figcaption style={{ padding: "6px 10px", fontWeight: 800, fontSize: 12.5 }}>{x.cap}</figcaption>}</figure>)}</div>}</div>}
  </div>;
}
