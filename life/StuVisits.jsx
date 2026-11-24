// ══════════════════════════════════════════════════════════
// 👣 زيارات الطلاب — يزور كل عضو (المدير • الوكلاء • الموجهون …) خمسة طلاب في فصولهم، يقابلهم ويتعرف على مستواهم وكتبهم ويستمع إليهم ويعلّق
//   ويأخذ رأي معلميهم، ثم يحفظ فتظهر الزيارة للطالب ومعلميه والإدارة
//   school-zy/{cid} = دورة الزيارات {title, from, to, per, cks, members[], assign:{memberKey:[{id,name,ck}]}, status}
//   school-zy-rec/{cid}/{sid} = سجل الزيارة {member, date, lv, bk{}, listen, interests, needs, comment, goals[], priv, tOps:{tkey:{name,subj,r,note,tags,show,at}}, done}
// ══════════════════════════════════════════════════════════
import { React, useState, useEffect, useMemo, obj, arr, ar, uid, esc, nrm, hDate, gDay, when, Av, loadPeople, loadStudents, loadSignals, printDoc, printHead, yearStart, dkey,
  LfStyle, Field, ListEd, PeoplePick, Loading, GRP, colOf } from "./core.jsx";

const NZ = "school-zy", NR = "school-zy-rec";
const LV = [[4, "متميز", "🌟", "#15803d"], [3, "متقدم", "👍", "#0369a1"], [2, "متوسط", "🙂", "#b45309"], [1, "يحتاج دعمًا", "🤝", "#b91c1c"]];
const LV_STU = { 4: "أداؤك متميز — استمر يا بطل 🌟", 3: "أداؤك متقدم — خطوة وتصل للتميز 👍", 2: "أنت في الطريق الصحيح — نثق بقدرتك على التقدم 🙂", 1: "نحن معك — بخطة بسيطة ستتحسن كثيرًا 🤝" };
const BK = [["books", "📚", "كتبه المدرسية مكتملة"], ["nb", "📓", "دفاتره منظمة"], ["hw", "📝", "واجباته منجزة"], ["tools", "✏️", "أدواته حاضرة"], ["part", "🙋", "يشارك في الحصة"]];
const T_TAGS = ["مشارك ومتفاعل", "منظم ومرتب", "ملتزم بالواجبات", "مهذب وخلوق", "يحتاج متابعة في الواجبات", "يحتاج تشجيعًا على المشاركة", "كثير السرحان", "يحتاج دعمًا في المهارات الأساسية"];
const STRAT = [["cls", "🏫 حسب الفصل", "طلاب الفصل الواحد عند عضو واحد (أسهل للزيارة)"], ["prio", "🎯 الأولوية للمحتاجين", "يبدأ بالأكثر غيابًا وتأخرًا وملاحظات وضعفًا في نافس"], ["rand", "🎲 عشوائي متوازن", "توزيع عشوائي عادل"]];
const lvOf = v => LV.find(x => x[0] === +v);
const isDone = r => r && r.done;
const needScore = s => s ? s.na * 3 + s.nl * 2 + s.bnNeg * 3 + s.neg + (s.lv3 && !s.nEnt ? 6 : 0) + (s.nafs != null && s.nafs < 50 ? 4 : 0) : 0;

// ══════════ الإدارة: الدورات والتوزيع والمتابعة ══════════
export function StuVisitsAdmin({ api, me, canAll }) {
  const [C, setC] = useState(null); const [R, setR] = useState(null); const [P, setP] = useState(null); const [ST, setST] = useState(null); const [cur, setCur] = useState(null); const [mk, setMk] = useState(null); const [tab, setTab] = useState("board"); const [open, setOpen] = useState(null);
  const load = async () => { const [c, r] = await Promise.all([api.maGet(NZ), api.maGet(NR)]); const L = Object.values(obj(c)).filter(x => x && x.id).sort((a, b) => (b.at || 0) - (a.at || 0)); setC(L); setR(obj(r)); if (!cur && L[0]) setCur(L[0].id); };
  useEffect(() => { load(); loadPeople(api).then(setP).catch(() => setP({ principal: [], deputy: [], counselor: [], activity: [], admin: [], teachers: [], byCk: {}, all: [] })); loadStudents(api).then(setST); }, []);
  if (!C || !P || !ST || !R) return <div className="lf"><LfStyle /><Loading /></div>;
  if (open) { const Zo = C.find(x => x.id === cur); if (Zo) return <VisitForm api={api} me={me} P={P} Z={Zo} s={open} r0={obj(obj(R[Zo.id])[open.id])} member={arr(Zo.members).find(m => m.key === open.mk)} canAll={canAll} onClose={async ch => { setOpen(null); if (ch) await load(); }} />; }
  if (mk) return <CycleMaker api={api} me={me} P={P} ST={ST} C={C} R={R} base={mk} onClose={async id => { setMk(null); await load(); if (id) setCur(id); }} />;
  const visited = new Set(); Object.values(R).forEach(cr => Object.values(obj(cr)).forEach(r => { if (isDone(r)) visited.add(r.sid); }));
  const Z = C.find(x => x.id === cur);
  return <div className="lf"><LfStyle />
    <div className="lf-hero" style={{ "--h1": "#0b2545", "--h2": "#7c3aed" }}>
      <h2>👣 زيارات الطلاب</h2>
      <p>يزور كل عضو من الإدارة والتوجيه خمسة طلاب في فصولهم: يقابلهم ويتعرف على مستواهم وكتبهم ويستمع إليهم ويعلّق ويأخذ رأي معلميهم، فتظهر الزيارة للطالب ومعلميه والإدارة. وزّع الطلاب على الأعضاء تلقائيًا وتابع الإنجاز لحظة بلحظة.</p>
      <div className="lf-kp"><div><b>{ar(C.length)}</b><small>دورة زيارات</small></div><div><b>{ar(visited.size)}</b><small>طالب زِير</small></div><div><b>{ST.S.length ? ar(Math.round(visited.size / ST.S.length * 100)) : "٠"}٪</b><small>تغطية طلاب المدرسة</small></div>
        <div style={{ marginInlineStart: "auto", background: "transparent", border: 0, padding: 0, display: "flex", alignItems: "center" }}><button className="lf-b g" style={{ fontSize: 15, padding: "11px 20px" }} onClick={() => setMk({})}>➕ دورة زيارات جديدة</button></div></div>
    </div>
    {!C.length ? <div className="lf-card lf-empty"><b>👣</b>لم تُنشأ أي دورة زيارات بعد — أنشئ أول دورة ووزّع الطلاب على الأعضاء بضغطة</div> : <>
      <div className="lf-chips">{C.map(z => { const rr = obj(R[z.id]); const tot = Object.values(obj(z.assign)).flat().length, dn = Object.values(rr).filter(isDone).length; return <button key={z.id} className={"lf-chip" + (z.id === cur ? " on" : "")} onClick={() => setCur(z.id)}>{z.status === "closed" ? "🔒" : "🟢"} {z.title} <small>{ar(dn)}/{ar(tot)}</small></button>; })}</div>
      {Z && <CycleView api={api} me={me} P={P} ST={ST} Z={Z} RR={obj(R[Z.id])} tab={tab} setTab={setTab} setOpen={setOpen} canAll={canAll} onEdit={() => setMk(Z)} onReload={load} visited={visited} onNext={() => setMk({ next: Z })} />}
    </>}
  </div>;
}

function distribute(students, members, per, strat, SG) {
  const k = members.length; if (!k) return {}; const need = k * per; let L = [...students];
  if (strat === "prio") L.sort((a, b) => needScore(SG && SG.S[b.id]) - needScore(SG && SG.S[a.id]));
  else if (strat === "rand") { for (let i = L.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [L[i], L[j]] = [L[j], L[i]]; } }
  else L.sort((a, b) => a.ck.localeCompare(b.ck, "en", { numeric: true }) || a.name.localeCompare(b.name, "ar"));
  L = L.slice(0, need); const A = {}; members.forEach(m => { A[m.key] = []; });
  if (strat === "prio") L.forEach((s, i) => A[members[i % k].key].push(s));   // تتوزع الحالات الأشد على الأعضاء بالتساوي
  else L.forEach((s, i) => A[members[Math.floor(i / per)].key].push(s));
  Object.keys(A).forEach(key => { A[key] = A[key].map(s => ({ id: s.id, name: s.name, ck: s.ck })); });
  return A;
}

function CycleMaker({ api, me, P, ST, C, R, base, onClose }) {
  const prev = base.next; const edit = base.id ? base : null;
  const allDone = new Set(); Object.values(R).forEach(cr => Object.values(obj(cr)).forEach(r => { if (isDone(r)) allDone.add(r.sid); }));
  const assigned = new Set(); C.forEach(z => { if (edit && z.id === edit.id) return; Object.values(obj(z.assign)).flat().forEach(s => s && assigned.add(s.id)); });
  const [Z, setZ] = useState(edit || { id: uid("zy"), title: prev ? `دورة الزيارات ${ar(C.length + 1)}` : "دورة الزيارات الأولى", from: dkey(new Date()), to: dkey(new Date(Date.now() + 14 * 864e5)), per: 5, cks: prev ? arr(prev.cks) : [], members: prev ? arr(prev.members) : [...P.principal, ...P.deputy, ...P.counselor].map(x => ({ key: x.key, name: x.name, grp: x.grp, job: x.job })), strat: "cls", skip: true, assign: {}, status: "open" });
  const [SG, setSG] = useState(null); const [busy, setBusy] = useState(""); const [step, setStep] = useState(edit ? 2 : 0); const [mv, setMv] = useState(null);
  const set = o => setZ(x => ({ ...x, ...o }));
  useEffect(() => { if (Z.strat === "prio" && !SG) loadSignals(api, dkey(new Date(Date.now() - 60 * 864e5))).then(setSG).catch(() => setSG({ S: {} })); }, [Z.strat]);
  const cks = arr(Z.cks); const pool = ST.S.filter(s => (!cks.length || cks.includes(s.ck)) && (!Z.skip || (!allDone.has(s.id) && !assigned.has(s.id))));
  const A = obj(Z.assign); const inA = new Set(Object.values(A).flat().map(s => s.id)); const rest = pool.filter(s => !inA.has(s.id));
  const gen = () => set({ assign: distribute(pool, arr(Z.members), +Z.per || 5, Z.strat, SG) });
  const save = async () => { if (!arr(Z.members).length) { alert("اختر الأعضاء"); return; } if (!Object.values(A).flat().length) { alert("وزّع الطلاب أولًا"); return; } setBusy("💾…"); await api.maPut(`${NZ}/${Z.id}`, { ...Z, by: Z.by || me.name, at: Z.at || Date.now(), upd: Date.now() }); setBusy(""); onClose(Z.id); };
  const STEPS = ["الأعضاء", "الفصول والطلاب", "التوزيع"];
  return <div className="lf"><LfStyle />
    <div className="lf-hero" style={{ "--h1": "#0b2545", "--h2": "#7c3aed" }}><h2>{edit ? "✏️ تعديل دورة الزيارات" : "➕ دورة زيارات جديدة"}</h2>
      <div className="lf-kp"><div><b>{ar(arr(Z.members).length)}</b><small>عضو</small></div><div><b>{ar(+Z.per || 5)}</b><small>طلاب لكل عضو</small></div><div><b>{ar(arr(Z.members).length * (+Z.per || 5))}</b><small>طالب في الدورة</small></div><div><b>{ar(pool.length)}</b><small>طالب متاح</small></div></div></div>
    <div className="lf-tabs">{STEPS.map((t, i) => <button key={i} className={step === i ? "on" : ""} onClick={() => setStep(i)}>{ar(i + 1)}) {t}</button>)}</div>
    {step === 0 && <div className="lf-card" style={{ display: "grid", gap: 12 }}>
      <div className="lf-g3"><Field l="اسم الدورة"><input className="lf-in" value={Z.title} onChange={e => set({ title: e.target.value })} /></Field><Field l="من"><input className="lf-in" type="date" value={Z.from} onChange={e => set({ from: e.target.value })} /></Field><Field l="إلى"><input className="lf-in" type="date" value={Z.to} onChange={e => set({ to: e.target.value })} /></Field>
        <Field l="عدد الطلاب لكل عضو"><input className="lf-in" type="number" min={1} max={15} value={Z.per} onChange={e => set({ per: Math.max(1, Math.min(15, +e.target.value || 5)) })} /></Field></div>
      <div className="lf-note">👥 الأعضاء الزائرون: المدير والوكلاء والموجهون الطلابيون (اختيار تلقائي)، ويمكن إضافة رائد النشاط والإداريين أو معلمين.</div>
      <PeoplePick P={P} sel={Z.members} set={v => set({ members: v })} groups={["principal", "deputy", "counselor", "activity", "admin", "teachers"]} />
      <button className="lf-b p" style={{ justifySelf: "end" }} onClick={() => setStep(1)}>التالي ←</button></div>}
    {step === 1 && <div className="lf-card" style={{ display: "grid", gap: 12 }}>
      <div className="lf-h"><b>🏫 الفصول المشمولة</b><small style={{ color: "#64748b", fontWeight: 800 }}>{cks.length ? `${ar(cks.length)} فصل` : "كل الفصول"}</small><span className="lf-sp" /><button className="lf-b sm" onClick={() => set({ cks: [] })}>كل الفصول</button></div>
      <div className="lf-chips">{ST.classes.filter(c => (ST.byCk[c.ck] || []).length).map(c => <button key={c.ck} className={"lf-chip" + (cks.includes(c.ck) ? " on" : "")} onClick={() => set({ cks: cks.includes(c.ck) ? cks.filter(x => x !== c.ck) : [...cks, c.ck] })}>{c.name} <small>{ar((ST.byCk[c.ck] || []).length)}</small></button>)}</div>
      <label style={{ display: "flex", gap: 8, alignItems: "center", fontWeight: 800 }}><input type="checkbox" checked={!!Z.skip} onChange={e => set({ skip: e.target.checked })} /> استبعاد الطلاب الذين زِيروا أو وُزِّعوا في دورات سابقة ({ar(new Set([...allDone, ...assigned]).size)}) — حتى تشمل الزيارات كل الطلاب تدريجيًا</label>
      <b>طريقة التوزيع</b><div className="lf-g3">{STRAT.map(([k, t, d]) => <button key={k} onClick={() => set({ strat: k })} style={{ border: `2px solid ${Z.strat === k ? "#7c3aed" : "#e2e8f0"}`, background: Z.strat === k ? "#f5f3ff" : "#fff", borderRadius: 14, padding: 12, textAlign: "right", cursor: "pointer", font: "inherit" }}><b style={{ display: "block", color: "#4c1d95" }}>{t}</b><small style={{ fontWeight: 700, color: "#64748b" }}>{d}</small></button>)}</div>
      {Z.strat === "prio" && !SG && <small style={{ fontWeight: 800, color: "#7c3aed" }}>⏳ تحليل احتياج الطلاب…</small>}
      <div className="lf-h"><button className="lf-b" onClick={() => setStep(0)}>→ السابق</button><span className="lf-sp" /><button className="lf-b g" disabled={Z.strat === "prio" && !SG} onClick={() => { gen(); setStep(2); }}>🎲 وزّع الطلاب ←</button></div></div>}
    {step === 2 && <div style={{ display: "grid", gap: 12 }}>
      <div className="lf-card lf-h" style={{ gap: 8 }}><b>🗂️ لوحة التوزيع</b><small style={{ fontWeight: 800, color: "#64748b" }}>{ar(inA.size)} طالب موزّع • {ar(rest.length)} متبقٍ للدورات القادمة</small><span className="lf-sp" /><button className="lf-b" onClick={gen}>🔄 إعادة التوزيع</button><button className="lf-b g" disabled={!!busy} onClick={save}>{busy || "💾 حفظ الدورة وإبلاغ الأعضاء"}</button></div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(min(100%,280px),1fr))", gap: 10 }}>{arr(Z.members).map(m => { const L = arr(A[m.key]); const c = (GRP[m.grp] || [])[2] || colOf(m.name);
        return <div key={m.key} className="lf-card" style={{ padding: 12, borderTop: `4px solid ${c}`, display: "grid", gap: 6, alignContent: "start" }}><div className="lf-h"><Av n={m.name} s={34} c={c} /><div><b style={{ fontSize: 14 }}>{m.name}</b><div style={{ fontSize: 11.5, fontWeight: 800, color: "#64748b" }}>{m.job || (GRP[m.grp] || [])[1]}</div></div><span className="lf-sp" /><span className="lf-st" style={{ "--c": L.length >= (+Z.per || 5) ? "#15803d" : "#b45309" }}>{ar(L.length)}/{ar(+Z.per || 5)}</span></div>
          {L.map(s => <div key={s.id} style={{ display: "flex", gap: 6, alignItems: "center", background: mv && mv.s.id === s.id ? "#ede9fe" : "#f8fafc", borderRadius: 10, padding: "5px 8px" }}><Av n={s.name} s={24} /><div style={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 800 }}>{s.name}<div style={{ fontSize: 11, color: "#64748b" }}>{api.maClassName(s.ck)}</div></div>
            <button className="lf-b sm" title="نقل إلى عضو آخر" onClick={() => setMv(mv && mv.s.id === s.id ? null : { s, from: m.key })}>↔</button><button className="lf-b sm d" onClick={() => set({ assign: { ...A, [m.key]: L.filter(x => x.id !== s.id) } })}>✕</button></div>)}
          {mv && mv.from !== m.key && <button className="lf-b sm p" onClick={() => { set({ assign: { ...A, [mv.from]: arr(A[mv.from]).filter(x => x.id !== mv.s.id), [m.key]: [...L, mv.s] } }); setMv(null); }}>⬇️ انقل «{mv.s.name.split(" ")[0]}» هنا</button>}
          {rest.length > 0 && <select className="lf-sel" style={{ fontSize: 12.5 }} value="" onChange={e => { const s = rest.find(x => x.id === e.target.value); if (s) set({ assign: { ...A, [m.key]: [...L, { id: s.id, name: s.name, ck: s.ck }] } }); }}><option value="">➕ إضافة طالب…</option>{rest.slice(0, 300).map(s => <option key={s.id} value={s.id}>{s.name} — {api.maClassName(s.ck)}</option>)}</select>}
        </div>; })}</div>
      <button className="lf-b" style={{ justifySelf: "start" }} onClick={() => setStep(1)}>→ السابق</button>
    </div>}
  </div>;
}

function CycleView({ api, me, P, ST, Z, RR, tab, setTab, setOpen, canAll, onEdit, onReload, visited, onNext }) {
  const [lvF, setLvF] = useState("");
  const A = obj(Z.assign); const all = Object.entries(A).flatMap(([k, L]) => arr(L).map(s => ({ ...s, mk: k })));
  const dn = all.filter(s => isDone(RR[s.id])); const tOps = all.reduce((a, s) => a + Object.keys(obj(obj(RR[s.id]).tOps)).length, 0);
  const remain = ST.S.filter(s => !visited.has(s.id) && !all.some(x => x.id === s.id));
  const lvCount = LV.map(l => [l, dn.filter(s => +RR[s.id].lv === l[0]).length]);
  const printSum = () => printDoc(Z.title, `${printHead(api, "تقرير دورة زيارات الطلاب", esc(Z.title))}<table><tr><td class="k">الفترة</td><td>${hDate(Z.from)} — ${hDate(Z.to)}</td><td class="k">الإنجاز</td><td>${ar(dn.length)} من ${ar(all.length)} (${all.length ? ar(Math.round(dn.length / all.length * 100)) : "٠"}٪)</td></tr></table>
<h2>إنجاز الأعضاء</h2><table><tr><th>العضو</th><th>الصفة</th><th>المكلَّف بهم</th><th>المُنجز</th></tr>${arr(Z.members).map(m => { const L = arr(A[m.key]); return `<tr><td>${esc(m.name)}</td><td>${esc(m.job || (GRP[m.grp] || [])[1] || "")}</td><td style="text-align:center">${ar(L.length)}</td><td style="text-align:center">${ar(L.filter(s => isDone(RR[s.id])).length)}</td></tr>`; }).join("")}</table>
<h2>نتائج الزيارات</h2><table><tr><th>م</th><th>الطالب</th><th>الفصل</th><th>الزائر</th><th>التاريخ</th><th>المستوى</th><th>آراء المعلمين</th><th>التعليق</th></tr>${all.map((s, i) => { const r = obj(RR[s.id]); const l = lvOf(r.lv); const m = arr(Z.members).find(x => x.key === s.mk) || {}; return `<tr><td>${ar(i + 1)}</td><td>${esc(s.name)}</td><td>${esc(api.maClassName(s.ck))}</td><td>${esc(m.name || "")}</td><td>${r.date ? hDate(r.date, { day: "numeric", month: "short" }) : "—"}</td><td>${l ? l[1] : "لم يُزر"}</td><td style="text-align:center">${ar(Object.keys(obj(r.tOps)).length)}</td><td style="font-size:11px">${esc((r.comment || "").slice(0, 120))}</td></tr>`; }).join("")}</table>
<div class="sg"><div>الموجه الطلابي</div><div>وكيل شؤون الطلاب</div><div>مدير المدرسة<br>${esc(obj(api.SP).principal || "")}</div></div>`);
  return <>
    <div className="lf-card" style={{ display: "grid", gap: 10 }}>
      <div className="lf-h"><b style={{ fontSize: 18 }}>{Z.status === "closed" ? "🔒" : "🟢"} {Z.title}</b><small style={{ color: "#64748b", fontWeight: 800 }}>{hDate(Z.from, { day: "numeric", month: "short" })} — {hDate(Z.to, { day: "numeric", month: "short" })}</small><span className="lf-sp" />
        {canAll && <button className="lf-b sm" onClick={onEdit}>✏️ تعديل التوزيع</button>}{canAll && <button className="lf-b sm" onClick={async () => { await api.maPut(`${NZ}/${Z.id}/status`, Z.status === "closed" ? "open" : "closed"); onReload(); }}>{Z.status === "closed" ? "🔓 إعادة فتح" : "🔒 إغلاق الدورة"}</button>}<button className="lf-b sm p" onClick={printSum}>🖨️ تقرير الدورة</button></div>
      <div className="lf-g3">{[["👣", "زيارات منجزة", `${ar(dn.length)} / ${ar(all.length)}`, "#7c3aed"], ["🗣️", "آراء المعلمين", ar(tOps), "#0369a1"], ["👥", "الأعضاء", ar(arr(Z.members).length), "#0f766e"], ["⏭️", "لم يُشملوا بعد", ar(remain.length), "#b45309"]].map(([ic, t, v, c]) => <div key={t} style={{ border: `1.5px solid ${c}33`, borderRadius: 14, padding: 10, textAlign: "center", background: `${c}08` }}><b style={{ fontSize: 22, color: c, display: "block" }}>{v}</b><small style={{ fontWeight: 800, color: "#475569" }}>{ic} {t}</small></div>)}</div>
      <div className="lf-bar" style={{ "--c": "#7c3aed", height: 12 }}><i style={{ width: (all.length ? dn.length / all.length * 100 : 0) + "%" }} /></div>
      {remain.length > 0 && canAll && <div className="lf-note" style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>⏭️ بقي {ar(remain.length)} طالبًا لم تشملهم أي دورة. <button className="lf-b sm p" onClick={onNext}>➕ إنشاء الدورة التالية لهم</button></div>}
    </div>
    <div className="lf-tabs">{[["board", "👥 الأعضاء وطلابهم"], ["res", "📊 النتائج"]].map(([k, t]) => <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{t}</button>)}</div>
    {tab === "board" && <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(min(100%,300px),1fr))", gap: 10 }}>{arr(Z.members).map(m => { const L = arr(A[m.key]); const d = L.filter(s => isDone(RR[s.id])).length; const c = (GRP[m.grp] || [])[2] || colOf(m.name);
      return <div key={m.key} className="lf-card" style={{ padding: 12, display: "grid", gap: 6, alignContent: "start", borderTop: `4px solid ${c}` }}><div className="lf-h"><Av n={m.name} s={36} c={c} /><div><b>{m.name}</b><div style={{ fontSize: 11.5, fontWeight: 800, color: "#64748b" }}>{m.job || (GRP[m.grp] || [])[1]}</div></div><span className="lf-sp" /><b style={{ color: d === L.length && L.length ? "#15803d" : "#7c3aed" }}>{ar(d)}/{ar(L.length)}</b></div>
        <div className="lf-bar" style={{ "--c": c }}><i style={{ width: (L.length ? d / L.length * 100 : 0) + "%" }} /></div>
        {L.map(s => { const r = obj(RR[s.id]); const l = lvOf(r.lv); const nt = Object.keys(obj(r.tOps)).length; return <button key={s.id} onClick={() => setOpen({ ...s, mk: m.key })} style={{ display: "flex", gap: 8, alignItems: "center", border: "1px solid #eef2f6", borderRadius: 12, padding: "6px 8px", background: isDone(r) ? "#f0fdf4" : "#fff", cursor: "pointer", font: "inherit", textAlign: "right" }}><Av n={s.name} s={28} /><div style={{ flex: 1, minWidth: 0 }}><b style={{ fontSize: 13 }}>{s.name}</b><div style={{ fontSize: 11, fontWeight: 800, color: "#64748b" }}>{api.maClassName(s.ck)}{nt ? ` • 🗣️ ${ar(nt)}` : ""}{r.date ? ` • ${hDate(r.date, { day: "numeric", month: "short" })}` : ""}</div></div>{l ? <span className="lf-st" style={{ "--c": l[3] }}>{l[2]} {l[1]}</span> : <span className="lf-st" style={{ "--c": "#94a3b8" }}>لم يُزر</span>}</button>; })}
      </div>; })}</div>}
    {tab === "res" && <div className="lf-card" style={{ display: "grid", gap: 10 }}>
      <div className="lf-g3">{lvCount.map(([l, n]) => <button key={l[0]} onClick={() => setLvF(lvF === String(l[0]) ? "" : String(l[0]))} style={{ border: `2px solid ${lvF === String(l[0]) ? l[3] : l[3] + "33"}`, borderRadius: 14, padding: 10, background: `${l[3]}0a`, cursor: "pointer", font: "inherit" }}><b style={{ fontSize: 24, color: l[3], display: "block" }}>{ar(n)}</b><small style={{ fontWeight: 900, color: l[3] }}>{l[2]} {l[1]}</small><div className="lf-bar" style={{ "--c": l[3], marginTop: 6 }}><i style={{ width: (dn.length ? n / dn.length * 100 : 0) + "%" }} /></div></button>)}</div>
      <div className="lf-scroll"><table className="lf-tbl"><thead><tr><th>الطالب</th><th>الفصل</th><th>الزائر</th><th>التاريخ</th><th>المستوى</th><th>الكتب والدفاتر</th><th>المعلمون</th></tr></thead><tbody>{dn.filter(s => !lvF || String(RR[s.id].lv) === lvF).map(s => { const r = RR[s.id]; const l = lvOf(r.lv); const m = arr(Z.members).find(x => x.key === s.mk) || {}; const bk = BK.filter(b => obj(r.bk)[b[0]]).length;
        return <tr key={s.id} style={{ cursor: "pointer" }} onClick={() => setOpen(s)}><td><b>{s.name}</b></td><td>{api.maClassName(s.ck)}</td><td>{m.name}</td><td>{r.date ? hDate(r.date, { day: "numeric", month: "short" }) : ""}</td><td>{l && <span className="lf-st" style={{ "--c": l[3] }}>{l[2]} {l[1]}</span>}</td><td>{ar(bk)}/{ar(BK.length)}</td><td>{ar(Object.keys(obj(r.tOps)).length)}</td></tr>; })}</tbody></table></div>
      {!dn.length && <div className="lf-empty">لم تُنجز زيارات بعد</div>}
    </div>}
  </>;
}

// ══════════ نموذج الزيارة (العضو الزائر) ══════════
function VisitForm({ api, me, P, Z, s, r0, member, canAll, onClose }) {
  const [r, setR] = useState({ sid: s.id, name: s.name, ck: s.ck, date: dkey(new Date()), lv: 0, bk: {}, listen: "", interests: "", needs: "", comment: "", goals: [""], priv: "", ...r0 });
  const [SG, setSG] = useState(null); const [busy, setBusy] = useState(""); const [tEd, setTEd] = useState(null);
  const set = o => setR(x => ({ ...x, ...o })); const f = k => e => set({ [k]: e.target.value });
  const isMine = member && nrm(member.name) === nrm(me.name); const can = canAll || isMine;
  useEffect(() => { loadSignals(api, dkey(new Date(Date.now() - 60 * 864e5))).then(setSG).catch(() => setSG({ S: {} })); }, []);
  const sg = SG ? obj(SG.S[s.id]) : null; const teachers = arr(P.byCk[s.ck]);
  const save = async (done) => { if (done && !r.lv) { alert("حدّد مستوى الطالب"); return; } setBusy("💾…"); const o = { ...r, goals: arr(r.goals).filter(x => String(x).trim()), member: member ? { key: member.key, name: member.name, grp: member.grp } : r.member || null, done: done ? 1 : r.done || 0, at: r.at || Date.now(), upd: Date.now(), by: me.name };
    await api.maPut(`${NR}/${Z.id}/${s.id}`, o); setBusy(""); onClose(true); };
  const saveT = async (t, v) => { const o = { name: t.name, subj: (t.subj || []).join("، "), r: +v.r || 0, note: v.note || "", tags: arr(v.tags), show: v.show !== false, at: Date.now(), by: me.name }; await api.maPut(`${NR}/${Z.id}/${s.id}/tOps/${tkOf(t.name)}`, o); set({ tOps: { ...obj(r.tOps), [tkOf(t.name)]: o } }); setTEd(null); };
  const print = () => printVisit(api, Z, r, member);
  const l = lvOf(r.lv);
  return <div className="lf"><LfStyle />
    <div className="lf-hero" style={{ "--h1": "#0b2545", "--h2": "#7c3aed", display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
      <Av n={s.name} s={70} c="#d4af37" /><div style={{ flex: 1, minWidth: 220, position: "relative", zIndex: 1 }}><small style={{ fontWeight: 800, opacity: .85 }}>زيارة ومقابلة الطالب</small><h2>{s.name}</h2><p>{api.maClassName(s.ck)} • الزائر: {member ? member.name : "—"} • {Z.title}</p>
        {sg && <div className="lf-kp"><div><b>{ar(sg.na || 0)}</b><small>غياب بلا عذر (٦٠ يومًا)</small></div><div><b>{ar(sg.nl || 0)}</b><small>تأخر صباحي</small></div><div><b>{ar((sg.bnNeg || 0) + (sg.neg || 0))}</b><small>ملاحظات</small></div>{sg.lv3 && <div><b>{sg.nafs != null ? ar(sg.nafs) + "٪" : sg.nEnt ? "—" : "لم يدخل"}</b><small>نافس</small></div>}</div>}</div>
      <div style={{ display: "flex", gap: 8, position: "relative", zIndex: 1 }}><button className="lf-b" onClick={() => onClose(false)}>→ رجوع</button>{r.done ? <button className="lf-b" onClick={print}>🖨️ طباعة</button> : null}</div>
    </div>
    {!can && <div className="lf-note">👁️ هذه الزيارة مسندة إلى {member ? member.name : "عضو آخر"} — تعرضها للاطلاع فقط.</div>}
    <div className="lf-g2" style={{ alignItems: "start" }}>
      <div className="lf-card" style={{ display: "grid", gap: 12 }}>
        <div className="lf-g2"><Field l="تاريخ الزيارة"><input className="lf-in" type="date" value={r.date} disabled={!can} onChange={f("date")} /></Field></div>
        <Field l="مستوى الطالب العام"><div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6 }}>{LV.map(([v, t, ic, c]) => <button type="button" key={v} disabled={!can} onClick={() => set({ lv: v })} style={{ border: `2px solid ${+r.lv === v ? c : "#e2e8f0"}`, background: +r.lv === v ? `${c}14` : "#fff", borderRadius: 14, padding: "10px 4px", cursor: "pointer", font: "inherit", fontWeight: 900, color: c, display: "grid", gap: 2 }}><span style={{ fontSize: 22 }}>{ic}</span>{t}</button>)}</div></Field>
        <Field l="الكتب والدفاتر والأدوات"><div className="lf-chips">{BK.map(([k, ic, t]) => <button type="button" key={k} disabled={!can} className={"lf-chip" + (obj(r.bk)[k] ? " on" : "")} style={{ "--c": "#15803d" }} onClick={() => set({ bk: { ...obj(r.bk), [k]: obj(r.bk)[k] ? null : 1 } })}>{obj(r.bk)[k] ? "✓" : ic} {t}</button>)}</div></Field>
        <Field l="👂 استمعتُ إليه: ماذا قال الطالب؟" s="رأيه في دراسته ومدرسته، ما يحبه وما يزعجه، طموحه"><textarea className="lf-ta" disabled={!can} value={r.listen} onChange={f("listen")} /></Field>
        <div className="lf-g2"><Field l="اهتماماته ومواهبه"><input className="lf-in" disabled={!can} value={r.interests} onChange={f("interests")} /></Field><Field l="احتياجاته"><input className="lf-in" disabled={!can} value={r.needs} onChange={f("needs")} placeholder="مثال: دعم في الرياضيات، متابعة القراءة" /></Field></div>
        <Field l="💬 تعليقي على مستواه (يظهر للطالب)"><textarea className="lf-ta" disabled={!can} value={r.comment} onChange={f("comment")} placeholder="كلمة مشجعة وواضحة يقرؤها الطالب" /></Field>
        <div className="lf-sec"><h4><i>🎯</i>ما اتفقنا عليه (أهداف للطالب)</h4>{can ? <ListEd v={r.goals} set={v => set({ goals: v })} ph="هدف قريب قابل للتحقيق" add="➕ هدف" /> : <ul>{arr(r.goals).map((g, i) => <li key={i}>{g}</li>)}</ul>}</div>
        <Field l="🔒 ملاحظة للإدارة (لا تظهر للطالب)"><textarea className="lf-ta" style={{ minHeight: 60 }} disabled={!can} value={r.priv} onChange={f("priv")} /></Field>
        {can && <div className="lf-h" style={{ gap: 8 }}><button className="lf-b" disabled={!!busy} onClick={() => save(false)}>حفظ مسودة</button><button className="lf-b g" disabled={!!busy} onClick={() => save(true)}>{busy || "✅ حفظ الزيارة (تظهر للطالب ومعلميه)"}</button></div>}
      </div>
      <div className="lf-card" style={{ display: "grid", gap: 10, position: "sticky", top: 8 }}>
        <b style={{ color: "#0b2545" }}>🗣️ رأي المعلمين ({ar(Object.keys(obj(r.tOps)).length)} من {ar(teachers.length)})</b>
        <small style={{ color: "#64748b", fontWeight: 800, lineHeight: 1.7 }}>يرى معلمو الطالب هذه الزيارة في بوابتهم ويكتبون رأيهم، أو دوّن رأي المعلم بنفسك بعد سؤاله.</small>
        {!teachers.length && <div className="lf-note">لا يوجد جدول مدرسي يربط هذا الفصل بمعلميه — يمكن للمعلمين كتابة رأيهم من بوابتهم.</div>}
        {teachers.map(t => { const o = obj(obj(r.tOps)[tkOf(t.name)]); const ol = lvOf(o.r);
          return <div key={t.key} style={{ border: "1px solid #eef2f6", borderRadius: 12, padding: 8, display: "grid", gap: 6, background: o.at ? "#f0f9ff" : "#fff" }}><div className="lf-h"><Av n={t.name} s={28} c="#0369a1" /><div style={{ flex: 1 }}><b style={{ fontSize: 13 }}>{t.name}</b><div style={{ fontSize: 11, fontWeight: 800, color: "#64748b" }}>{(t.subj || []).join("، ")}</div></div>{ol ? <span className="lf-st" style={{ "--c": ol[3] }}>{ol[2]} {ol[1]}</span> : <span className="lf-st" style={{ "--c": "#94a3b8" }}>بانتظار رأيه</span>}{can && tEd !== t.key && <button className="lf-b sm" onClick={() => setTEd(t.key)}>✍️</button>}</div>
            {o.note && <div style={{ fontSize: 12.5, fontWeight: 700, lineHeight: 1.8 }}>«{o.note}»</div>}{arr(o.tags).length > 0 && <div className="lf-chips">{arr(o.tags).map(x => <span key={x} className="lf-st" style={{ "--c": "#0369a1" }}>{x}</span>)}</div>}
            {tEd === t.key && <TOpForm o={o} onSave={v => saveT(t, v)} onCancel={() => setTEd(null)} />}</div>; })}
        {Object.entries(obj(r.tOps)).filter(([k]) => !teachers.some(t => tkOf(t.name) === k)).map(([k, o]) => { const ol = lvOf(o.r); return <div key={k} style={{ border: "1px solid #eef2f6", borderRadius: 12, padding: 8, background: "#f0f9ff" }}><div className="lf-h"><Av n={o.name} s={28} c="#0369a1" /><b style={{ flex: 1, fontSize: 13 }}>{o.name}<small style={{ display: "block", color: "#64748b" }}>{o.subj}</small></b>{ol && <span className="lf-st" style={{ "--c": ol[3] }}>{ol[1]}</span>}</div>{o.note && <div style={{ fontSize: 12.5, fontWeight: 700 }}>«{o.note}»</div>}</div>; })}
      </div>
    </div>
  </div>;
}
export const tkOf = n => { let h = 5381; for (const c of nrm(n)) h = ((h * 33) ^ c.charCodeAt(0)) >>> 0; return "t" + h.toString(36); };  // مفتاح لاتيني ثابت من اسم المعلم
function TOpForm({ o, onSave, onCancel }) {
  const [v, setV] = useState({ r: o.r || 0, note: o.note || "", tags: arr(o.tags), show: o.show !== false });
  return <div style={{ display: "grid", gap: 6 }}><div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 4 }}>{LV.map(([x, t, ic, c]) => <button type="button" key={x} onClick={() => setV({ ...v, r: x })} style={{ border: `2px solid ${+v.r === x ? c : "#e2e8f0"}`, background: +v.r === x ? `${c}14` : "#fff", borderRadius: 10, padding: "6px 2px", font: "inherit", fontWeight: 900, fontSize: 11.5, color: c, cursor: "pointer" }}>{ic} {t}</button>)}</div>
    <div className="lf-chips">{T_TAGS.map(x => <button type="button" key={x} className={"lf-chip" + (v.tags.includes(x) ? " on" : "")} style={{ "--c": "#0369a1", fontSize: 11.5, padding: "3px 9px" }} onClick={() => setV({ ...v, tags: v.tags.includes(x) ? v.tags.filter(y => y !== x) : [...v.tags, x] })}>{x}</button>)}</div>
    <textarea className="lf-ta" style={{ minHeight: 60 }} placeholder="رأي المعلم في مستواه ومشاركته وواجباته" value={v.note} onChange={e => setV({ ...v, note: e.target.value })} />
    <label style={{ fontWeight: 800, fontSize: 12.5, display: "flex", gap: 6, alignItems: "center" }}><input type="checkbox" checked={v.show} onChange={e => setV({ ...v, show: e.target.checked })} /> يظهر الرأي للطالب</label>
    <div style={{ display: "flex", gap: 6 }}><button type="button" className="lf-b sm p" disabled={!v.r} onClick={() => onSave(v)}>💾 حفظ الرأي</button><button type="button" className="lf-b sm" onClick={onCancel}>إلغاء</button></div></div>;
}
function printVisit(api, Z, r, member) {
  const l = lvOf(r.lv); const T = Object.values(obj(r.tOps));
  printDoc("زيارة " + r.name, `${printHead(api, "نموذج زيارة ومقابلة طالب", esc(Z.title))}<table><tr><td class="k">الطالب</td><td><b>${esc(r.name)}</b></td><td class="k">الفصل</td><td>${esc(api.maClassName(r.ck))}</td></tr><tr><td class="k">الزائر</td><td>${esc(member ? member.name : obj(r.member).name || "")}</td><td class="k">التاريخ</td><td>${r.date ? gDay(r.date) + " " + hDate(r.date) : ""}</td></tr><tr><td class="k">المستوى العام</td><td colspan="3"><b>${l ? l[2] + " " + l[1] : ""}</b></td></tr><tr><td class="k">الكتب والدفاتر</td><td colspan="3">${BK.map(b => `<span class="chip">${obj(r.bk)[b[0]] ? "✓" : "✗"} ${b[2]}</span>`).join("")}</td></tr></table>
${r.listen ? `<h2>ماذا قال الطالب</h2><div style="white-space:pre-wrap">${esc(r.listen)}</div>` : ""}${r.interests || r.needs ? `<table><tr><td class="k">اهتماماته</td><td>${esc(r.interests || "")}</td></tr><tr><td class="k">احتياجاته</td><td>${esc(r.needs || "")}</td></tr></table>` : ""}
${r.comment ? `<h2>تعليق الزائر</h2><div style="white-space:pre-wrap">${esc(r.comment)}</div>` : ""}${arr(r.goals).length ? `<h2>ما اتُّفق عليه</h2><ol>${arr(r.goals).map(g => `<li>${esc(g)}</li>`).join("")}</ol>` : ""}
${T.length ? `<h2>رأي المعلمين</h2><table><tr><th>المعلم</th><th>المادة</th><th>التقدير</th><th>الرأي</th></tr>${T.map(o => `<tr><td>${esc(o.name)}</td><td>${esc(o.subj || "")}</td><td>${(lvOf(o.r) || [, ""])[1]}</td><td>${esc([...(o.tags || []), o.note].filter(Boolean).join(" — "))}</td></tr>`).join("")}</table>` : ""}
${r.priv ? `<h2>ملاحظة للإدارة</h2><div>${esc(r.priv)}</div>` : ""}<div class="sg"><div>الزائر<br>${esc(member ? member.name : "")}</div><div>الموجه الطلابي</div><div>مدير المدرسة<br>${esc(obj(api.SP).principal || "")}</div></div>`);
}

// ══════════ بوابة العضو: «زياراتي» ══════════
export function MyVisits({ api, me }) {
  const [C, setC] = useState(null); const [R, setR] = useState(null); const [P, setP] = useState(null); const [open, setOpen] = useState(null);
  const load = async () => { const [c, r] = await Promise.all([api.maGet(NZ), api.maGet(NR)]); setC(Object.values(obj(c)).filter(x => x && x.id && x.status !== "closed")); setR(obj(r)); };
  useEffect(() => { load(); loadPeople(api).then(setP).catch(() => setP({ byCk: {}, all: [] })); }, []);
  if (!C || !R || !P) return <div className="lf"><LfStyle /><Loading /></div>;
  const mine = C.flatMap(z => arr(z.members).filter(m => nrm(m.name) === nrm(me.name)).flatMap(m => arr(obj(z.assign)[m.key]).map(s => ({ z, m, s }))));
  if (open) return <VisitForm api={api} me={me} P={P} Z={open.z} s={{ ...open.s, mk: open.m.key }} r0={obj(obj(R[open.z.id])[open.s.id])} member={open.m} canAll={false} onClose={async ch => { setOpen(null); if (ch) await load(); }} />;
  const dn = mine.filter(x => isDone(obj(R[x.z.id])[x.s.id])).length;
  return <div className="lf"><LfStyle />
    <div className="lf-hero" style={{ "--h1": "#0b2545", "--h2": "#7c3aed" }}><h2>👣 زياراتي للطلاب</h2><p>زر طلابك في فصولهم، قابلهم واستمع إليهم وتعرّف على مستواهم وكتبهم، ثم سجّل الزيارة لتظهر لهم ولمعلميهم وللإدارة.</p>
      <div className="lf-kp"><div><b>{ar(mine.length)}</b><small>طالب مسند إليك</small></div><div><b>{ar(dn)}</b><small>زيارة منجزة</small></div><div><b>{ar(mine.length - dn)}</b><small>متبقية</small></div></div></div>
    {!mine.length ? <div className="lf-card lf-empty"><b>👣</b>لا يوجد طلاب مسندون إليك في دورة زيارات مفتوحة</div> :
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(min(100%,280px),1fr))", gap: 10 }}>{mine.map(({ z, m, s }) => { const r = obj(obj(R[z.id])[s.id]); const l = lvOf(r.lv); const nt = Object.keys(obj(r.tOps)).length;
        return <button key={z.id + s.id} onClick={() => setOpen({ z, m, s })} className="lf-card" style={{ cursor: "pointer", font: "inherit", textAlign: "right", display: "grid", gap: 8, borderTop: `4px solid ${isDone(r) ? "#15803d" : "#7c3aed"}` }}>
          <div className="lf-h"><Av n={s.name} s={44} /><div style={{ flex: 1 }}><b style={{ fontSize: 15 }}>{s.name}</b><div style={{ fontSize: 12, fontWeight: 800, color: "#64748b" }}>{api.maClassName(s.ck)} • {z.title}</div></div></div>
          <div className="lf-h">{l ? <span className="lf-st" style={{ "--c": l[3] }}>{l[2]} {l[1]}</span> : <span className="lf-st" style={{ "--c": "#7c3aed" }}>⏳ لم تتم الزيارة</span>}<span className="lf-sp" /><small style={{ fontWeight: 800, color: "#0369a1" }}>🗣️ {ar(nt)} رأي معلم</small></div>
          <span className="lf-b sm p" style={{ justifySelf: "start" }}>{isDone(r) ? "👁️ عرض / تعديل" : "✍️ تسجيل الزيارة"}</span></button>; })}</div>}
  </div>;
}

// ══════════ بوابة المعلم: رأيي في طلابي المزارين ══════════
export function TeacherOpinions({ api, me }) {
  const [C, setC] = useState(null); const [R, setR] = useState(null); const [T, setT] = useState(undefined); const [ed, setEd] = useState(null); const [f, setF] = useState("wait");
  const load = async () => { const [c, r, t] = await Promise.all([api.maGet(NZ), api.maGet(NR), api.ttGet().catch(() => null)]); setC(Object.values(obj(c)).filter(x => x && x.id)); setR(obj(r)); setT(t); };
  useEffect(() => { load(); }, []);
  if (!C || !R || T === undefined) return <div className="lf"><LfStyle /><Loading /></div>;
  const ti = T ? api.ttFind(T, me.name) : -1; const myCk = {};
  if (ti >= 0) Object.entries(obj(T.C)).forEach(([ck, days]) => arr(days).forEach(day => arr(day).forEach(c => { if (Array.isArray(c) && +c[1] === ti && +c[0] >= 0) (myCk[ck] = myCk[ck] || new Set()).add((T.S || [])[+c[0]] || ""); })));
  const tk = tkOf(ti >= 0 ? T.T[ti] : me.name);
  const L = C.flatMap(z => Object.entries(obj(z.assign)).flatMap(([mk, A]) => arr(A).filter(s => myCk[s.ck]).map(s => ({ z, s, m: arr(z.members).find(x => x.key === mk) || {}, r: obj(obj(R[z.id])[s.id]) }))));
  const wait = L.filter(x => !obj(x.r.tOps)[tk] && x.z.status !== "closed"), mine = L.filter(x => obj(x.r.tOps)[tk]), vis = L.filter(x => isDone(x.r));
  const LL = f === "wait" ? wait : f === "mine" ? mine : vis;
  const save = async (x, v) => { const o = { name: ti >= 0 ? T.T[ti] : me.name, subj: [...(myCk[x.s.ck] || [])].filter(Boolean).join("، "), r: +v.r || 0, note: v.note || "", tags: arr(v.tags), show: v.show !== false, at: Date.now(), by: me.name };
    await api.maPut(`${NR}/${x.z.id}/${x.s.id}/tOps/${tk}`, o); if (!x.r.sid) { await api.maPut(`${NR}/${x.z.id}/${x.s.id}/sid`, x.s.id); await api.maPut(`${NR}/${x.z.id}/${x.s.id}/name`, x.s.name); await api.maPut(`${NR}/${x.z.id}/${x.s.id}/ck`, x.s.ck); } setEd(null); await load(); };
  return <div className="lf"><LfStyle />
    <div className="lf-hero" style={{ "--h1": "#0b2545", "--h2": "#0369a1" }}><h2>🗣️ رأيي في طلابي (زيارات الطلاب)</h2><p>يزور أعضاء الإدارة والتوجيه طلابًا من فصولك ويقابلونهم. اكتب رأيك في مستوى كل طالب ومشاركته وواجباته، واطّلع على ما دار في زيارته.</p>
      <div className="lf-kp"><div><b>{ar(wait.length)}</b><small>بانتظار رأيك</small></div><div><b>{ar(mine.length)}</b><small>كتبتَ رأيك</small></div><div><b>{ar(vis.length)}</b><small>زيارة منجزة لطلابك</small></div></div></div>
    {ti < 0 && <div className="lf-note">لم يُعثر على اسمك في الجدول المدرسي، لذلك لا تظهر فصولك. تأكد من تطابق اسمك في الجدول مع اسم دخولك.</div>}
    <div className="lf-tabs">{[["wait", `⏳ بانتظار رأيي (${ar(wait.length)})`], ["mine", `✅ آرائي (${ar(mine.length)})`], ["vis", `👣 الزيارات المنجزة (${ar(vis.length)})`]].map(([k, t]) => <button key={k} className={f === k ? "on" : ""} onClick={() => setF(k)}>{t}</button>)}</div>
    {!LL.length ? <div className="lf-card lf-empty"><b>{f === "wait" ? "🎉" : "🗂️"}</b>{f === "wait" ? "لا يوجد طلاب بانتظار رأيك" : "لا يوجد شيء هنا بعد"}</div> :
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(min(100%,320px),1fr))", gap: 10 }}>{LL.map(x => { const o = obj(obj(x.r.tOps)[tk]); const l = lvOf(x.r.lv), ol = lvOf(o.r); const k = x.z.id + x.s.id;
        return <div key={k} className="lf-card" style={{ display: "grid", gap: 8, alignContent: "start" }}><div className="lf-h"><Av n={x.s.name} s={40} /><div style={{ flex: 1 }}><b>{x.s.name}</b><div style={{ fontSize: 12, fontWeight: 800, color: "#64748b" }}>{api.maClassName(x.s.ck)} • الزائر: {x.m.name || "—"}</div></div>{l && <span className="lf-st" style={{ "--c": l[3] }}>{l[2]} {l[1]}</span>}</div>
          {isDone(x.r) && <div style={{ background: "#f8fafc", borderRadius: 12, padding: 8, fontSize: 12.5, fontWeight: 700, lineHeight: 1.8 }}>{x.r.comment && <div>💬 {x.r.comment}</div>}{arr(x.r.goals).length > 0 && <div>🎯 {arr(x.r.goals).join(" • ")}</div>}{x.r.needs && <div>🧩 احتياجاته: {x.r.needs}</div>}</div>}
          {ed === k ? <TOpForm o={o} onSave={v => save(x, v)} onCancel={() => setEd(null)} /> : <div className="lf-h">{ol ? <><span className="lf-st" style={{ "--c": ol[3] }}>رأيي: {ol[1]}</span>{o.note && <small style={{ fontWeight: 700 }}>«{o.note.slice(0, 60)}»</small>}</> : <small style={{ color: "#b45309", fontWeight: 800 }}>لم تكتب رأيك بعد</small>}<span className="lf-sp" />{x.z.status !== "closed" && <button className="lf-b sm p" onClick={() => setEd(k)}>{ol ? "✏️ تعديل" : "✍️ اكتب رأيك"}</button>}</div>}
        </div>; })}</div>}
  </div>;
}

// ══════════ بوابة الطالب: «زياراتي» ══════════
export function StudentVisits({ api, onBack }) {
  const [me, setMe] = useState(() => { try { const s = JSON.parse(localStorage.getItem("zy-stu-v1") || "null"); return s && s.until > Date.now() ? s : null; } catch { return null; } });
  const [idv, setIdv] = useState(""); const [err, setErr] = useState(""); const [R, setR] = useState(null); const [C, setC] = useState(null); const [busy, setBusy] = useState(false);
  useEffect(() => { if (!me) return; Promise.all([api.maGet(NZ), api.maGet(NR)]).then(([c, r]) => { setC(obj(c)); setR(obj(r)); }); }, [me]);
  const login = async () => { setErr(""); setBusy(true); try { const nh = await api.stuHash(idv); const ros = obj(await api.maGet(api.MA_ROSTER)); let hit = null; Object.entries(ros).forEach(([ck, c]) => arr(obj(c).students).forEach(s => { if (s && s.nh === nh) hit = { sid: s.id, name: s.name, ck }; })); if (!hit) setErr("رقم الهوية غير مسجّل — راجع الموجه الطلابي"); else { const o = { ...hit, until: Date.now() + 30 * 864e5 }; try { localStorage.setItem("zy-stu-v1", JSON.stringify(o)); } catch {} setMe(o); } } catch { setErr("تعذّر التحقق، حاول مرة أخرى"); } setBusy(false); };
  const wrap = ch => <div dir="rtl" style={{ minHeight: "100vh", background: "linear-gradient(160deg,#f5f3ff,#eff6ff 45%,#f8fafc)", padding: "14px 12px 40px" }}><div style={{ maxWidth: 760, margin: "0 auto" }}><div className="lf"><LfStyle />{onBack && <button className="lf-b" style={{ justifySelf: "start" }} onClick={onBack}>→ رجوع</button>}{ch}</div></div></div>;
  if (!me) return wrap(<div className="lf-card" style={{ display: "grid", gap: 12, textAlign: "center", padding: 24 }}><span style={{ fontSize: 56 }}>👣</span><h2 style={{ margin: 0, color: "#4c1d95" }}>زياراتي</h2><p style={{ margin: 0, fontWeight: 700, color: "#475569" }}>اطّلع على زيارة الإدارة لك وتعليقها ورأي معلميك فيك</p>
    <input className="lf-in" inputMode="numeric" style={{ textAlign: "center", fontSize: 20, letterSpacing: 2 }} placeholder="رقم الهوية" value={idv} onChange={e => setIdv(e.target.value)} onKeyDown={e => e.key === "Enter" && login()} />{err && <div style={{ color: "#b91c1c", fontWeight: 800 }}>{err}</div>}<button className="lf-b p" style={{ justifyContent: "center", fontSize: 16 }} disabled={busy || idv.trim().length < 9} onClick={login}>{busy ? "⏳" : "دخول"}</button></div>);
  if (!R || !C) return wrap(<Loading />);
  const recs = Object.entries(R).map(([cid, cr]) => ({ z: obj(C[cid]), r: obj(obj(cr)[me.sid]) })).filter(x => isDone(x.r)).sort((a, b) => String(b.r.date).localeCompare(String(a.r.date)));
  return wrap(<>
    <div className="lf-hero" style={{ "--h1": "#4c1d95", "--h2": "#7c3aed" }}><h2>👋 أهلًا {String(me.name).split(" ")[0]}</h2><p>{api.maClassName(me.ck)} • هنا تجد زيارات الإدارة لك وما اتفقتم عليه ورأي معلميك فيك.</p>
      <div className="lf-kp"><div><b>{ar(recs.length)}</b><small>زيارة</small></div><div style={{ marginInlineStart: "auto", background: "transparent", border: 0 }}><button className="lf-b sm" onClick={() => { try { localStorage.removeItem("zy-stu-v1"); } catch {} setMe(null); }}>خروج</button></div></div></div>
    {!recs.length ? <div className="lf-card lf-empty"><b>🌱</b>لم تُسجَّل لك زيارة بعد — ستظهر هنا بعد أن يزورك أحد أعضاء الإدارة</div> : recs.map(({ z, r }, i) => { const l = lvOf(r.lv); const T = Object.values(obj(r.tOps)).filter(o => o && o.show !== false);
      return <div key={i} className="lf-card" style={{ display: "grid", gap: 12, borderTop: `5px solid ${l ? l[3] : "#7c3aed"}` }}>
        <div className="lf-h"><Av n={obj(r.member).name} s={44} c="#7c3aed" /><div style={{ flex: 1 }}><b>زارك {obj(r.member).name || "عضو الإدارة"}</b><div style={{ fontSize: 12, fontWeight: 800, color: "#64748b" }}>{r.date ? `${gDay(r.date)} ${hDate(r.date)}` : ""} • {z.title || ""}</div></div></div>
        {l && <div style={{ background: `${l[3]}10`, border: `1.5px solid ${l[3]}40`, borderRadius: 16, padding: "12px 14px", fontWeight: 900, color: l[3], fontSize: 16 }}>{LV_STU[l[0]]}</div>}
        {r.comment && <div><b style={{ color: "#4c1d95" }}>💬 كلمة لك</b><p style={{ margin: "4px 0 0", fontWeight: 700, lineHeight: 1.9, whiteSpace: "pre-wrap" }}>{r.comment}</p></div>}
        {arr(r.goals).length > 0 && <div><b style={{ color: "#4c1d95" }}>🎯 ما اتفقنا عليه</b>{arr(r.goals).map((g, j) => <div key={j} style={{ display: "flex", gap: 8, alignItems: "center", padding: "6px 0", fontWeight: 800 }}><span style={{ width: 24, height: 24, borderRadius: 8, background: "#ede9fe", display: "grid", placeItems: "center", color: "#6d28d9", fontSize: 13 }}>{ar(j + 1)}</span>{g}</div>)}</div>}
        <div className="lf-chips">{BK.filter(b => obj(r.bk)[b[0]]).map(b => <span key={b[0]} className="lf-st" style={{ "--c": "#15803d" }}>✓ {b[2]}</span>)}</div>
        {T.length > 0 && <div style={{ display: "grid", gap: 6 }}><b style={{ color: "#4c1d95" }}>🗣️ رأي معلميك</b>{T.map((o, j) => { const ol = lvOf(o.r); return <div key={j} style={{ display: "flex", gap: 8, alignItems: "flex-start", background: "#f8fafc", borderRadius: 12, padding: 8 }}><Av n={o.name} s={32} c="#0369a1" /><div style={{ flex: 1 }}><b style={{ fontSize: 13 }}>{o.name}</b> <small style={{ color: "#64748b", fontWeight: 800 }}>{o.subj}</small>{ol && <span className="lf-st" style={{ "--c": ol[3], marginInlineStart: 6 }}>{ol[2]} {ol[1]}</span>}{o.note && <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.8 }}>{o.note}</div>}{arr(o.tags).length > 0 && <div className="lf-chips" style={{ marginTop: 4 }}>{arr(o.tags).map(x => <span key={x} className="lf-st" style={{ "--c": "#0369a1" }}>{x}</span>)}</div>}</div></div>; })}</div>}
      </div>; })}
  </>);
}

// ══════════ للمدير والوكيل في بوابة الإداريين: لوحة الإدارة + زياراتي ══════════
export function ZyStaff({ api, me, canAll }) {
  const [t, setT] = useState(canAll ? "adm" : "my");
  return <div style={{ display: "grid", gap: 12 }}>
    {canAll && <div className="lf"><LfStyle /><div className="lf-tabs">{[["adm", "🗂️ لوحة الإدارة والتوزيع"], ["my", "👣 زياراتي أنا"]].map(([k, x]) => <button key={k} className={t === k ? "on" : ""} onClick={() => setT(k)}>{x}</button>)}</div></div>}
    {t === "adm" ? <StuVisitsAdmin api={api} me={me} canAll={canAll} /> : <MyVisits api={api} me={me} />}
  </div>;
}
