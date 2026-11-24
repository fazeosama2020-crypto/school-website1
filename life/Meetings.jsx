// ══════════════════════════════════════════════════════════
// 🤝 اللقاءات الطلابية — تخطيط اللقاء ودعوة المشاركين (المعلمون • الوكلاء • الموجهون • رائد النشاط) واختيار الفصول والطلاب
//   مع اقتراحات ذكية من بيانات الموقع: المتميزون في الانضباط • متكررو الغياب • متكررو التأخر الصباحي • المتفاعلون وغير المتفاعلين في نافس • الملاحظات السلوكية
//   ثم المحضر والتوصيات والحضور والصور والطباعة (دعوة • كشف حضور • محضر)
//   school-meet/{id} • school-meet-img/{id}/{k}
// ══════════════════════════════════════════════════════════
import { React, useState, useEffect, useMemo, obj, arr, ar, uid, esc, nrm, hDate, gDay, when, Av, shrinkImg, loadPeople, loadStudents, loadSignals, aiJSON, printDoc, printHead, yearStart, dkey,
  LfStyle, Field, ListEd, PeoplePick, Loading, GRP } from "./core.jsx";

const N = "school-meet", NI = "school-meet-img";
export const MT = {
  disc: ["🏅", "لقاء المتميزين في الانضباط", "#15803d", "تكريم الطلاب المنضبطين وتعزيز القدوة الحسنة"],
  abs: ["🚫", "لقاء متكرري الغياب", "#b91c1c", "التعرف على أسباب الغياب ووضع خطة التزام فردية"],
  late: ["⏰", "لقاء المتأخرين صباحًا", "#c2410c", "معالجة التأخر الصباحي والاتفاق على حلول عملية"],
  nafsOn: ["🎯", "لقاء أبطال نافس", "#1d4ed8", "تحفيز المتفاعلين في نافس وجعلهم سفراء لزملائهم"],
  nafsOff: ["🔔", "لقاء تحفيزي لغير المتفاعلين في نافس", "#7c3aed", "رفع تفاعل الطلاب مع مراجع نافس ونماذجه"],
  beh: ["🧭", "لقاء إرشادي سلوكي", "#0f766e", "تعزيز السلوك الإيجابي ومعالجة الملاحظات السلوكية"],
  council: ["🏛️", "مجلس الطلاب / اللقاء المفتوح", "#0b2545", "الاستماع لآراء الطلاب ومقترحاتهم"],
  other: ["✨", "لقاء آخر", "#475569", ""],
};
const SUG = [["disc", "🏅", "المتميزون في الانضباط", "#15803d"], ["abs", "🚫", "متكررو الغياب", "#b91c1c"], ["late", "⏰", "متكررو التأخر الصباحي", "#c2410c"], ["nafsOn", "🎯", "المتفاعلون في نافس", "#1d4ed8"], ["nafsOff", "🔔", "غير المتفاعلين في نافس", "#7c3aed"], ["beh", "🧭", "ملاحظات سلوكية", "#0f766e"]];
// معايير الاقتراح
function suggest(k, s) {
  if (!s) return null;
  if (k === "disc") return s.na === 0 && s.nl === 0 && s.neg === 0 && s.bnNeg === 0 ? { w: 100 + s.pos + s.bnPos * 3, why: ["حضور كامل", "بلا تأخر", s.pos + s.bnPos ? `${ar(s.pos + s.bnPos)} ملاحظة إيجابية` : "بلا ملاحظات"].join(" • ") } : null;
  if (k === "abs") return s.na >= 3 ? { w: s.na, why: `غياب ${ar(s.na)} أيام بلا عذر${s.ne ? ` + ${ar(s.ne)} بعذر` : ""}` } : null;
  if (k === "late") return s.nl >= 3 ? { w: s.nl, why: `تأخر ${ar(s.nl)} مرات${s.mins ? ` (${ar(s.mins)} دقيقة)` : ""}` } : null;
  if (k === "nafsOn") return s.lv3 && ((s.nafs != null && s.nafs >= 80) || s.nPg >= 12) ? { w: (s.nafs || 0) + s.nPg, why: [s.nafs != null ? `نافس ${ar(s.nafs)}٪` : "", s.nPg ? `${ar(s.nPg)} صفحة محلولة` : "", s.nN ? `${ar(s.nN)} نموذج` : ""].filter(Boolean).join(" • ") } : null;
  if (k === "nafsOff") return s.lv3 && (!s.nEnt || (s.nafs != null && s.nafs < 50)) ? { w: s.nEnt ? 100 - s.nafs : 200, why: !s.nEnt ? "لم يدخل المراجع ولا النماذج" : `نافس ${ar(s.nafs)}٪` } : null;
  if (k === "beh") return s.bnNeg >= 2 || s.neg >= 3 ? { w: s.bnNeg * 2 + s.neg, why: [s.bnNeg ? `${ar(s.bnNeg)} ملاحظة سلوكية` : "", s.neg ? `${ar(s.neg)} ملاحظة متابعة` : ""].filter(Boolean).join(" • ") } : null;
  return null;
}
const AGENDA = {
  disc: ["الترحيب بالطلاب وتهنئتهم بتميزهم", "كلمة المدير عن قيمة الانضباط وأثره في النجاح", "قصص نجاح قصيرة من الطلاب أنفسهم", "تسليم شهادات الشكر والتكريم", "إعلانهم سفراء للانضباط وتكليفهم بمهام قيادية", "صورة جماعية توثيقية"],
  abs: ["الترحيب وكسر الحاجز بحوار ودّي", "عرض أثر الغياب على التحصيل ونسبة الحرمان", "الاستماع لأسباب الغياب من كل طالب", "الاتفاق على خطة التزام فردية وتوقيعها", "تحديد موعد متابعة وإشعار ولي الأمر بالخطة"],
  late: ["الترحيب وتوضيح الهدف من اللقاء", "أثر التأخر على الحصة الأولى والتحصيل", "الاستماع لأسباب التأخر وحلولها المقترحة", "الاتفاق على تحدي «أسبوع بلا تأخر» بحوافز", "آلية المتابعة اليومية مع الوكيل"],
  nafsOn: ["تهنئة الطلاب بتفاعلهم ونتائجهم", "عرض لوحة الإنجاز في مراجع نافس", "اختيارهم سفراء نافس في فصولهم", "توزيع مهام دعم الزملاء (ثنائيات تعلم)", "حوافز الأسبوع القادم"],
  nafsOff: ["الترحيب وتوضيح أهمية اختبارات نافس", "عرض سريع لطريقة الدخول إلى المراجع والنماذج", "الاستماع لأسباب ضعف التفاعل", "التدرب العملي على حل نموذج قصير", "الاتفاق على هدف أسبوعي ومتابعة المعلم"],
  beh: ["الترحيب وبناء الثقة", "حوار مفتوح عن السلوك الإيجابي وأثره", "الاستماع لكل طالب وفهم دوافعه", "الاتفاق على عقد سلوكي ومكافآت التحسن", "جدولة جلسات متابعة فردية مع الموجه"],
  council: ["الترحيب وتعريف بالمجلس", "عرض منجزات المدرسة", "الاستماع لمقترحات الطلاب وملاحظاتهم", "مناقشة المقترحات وتحديد الممكن منها", "إعلان التوصيات ومسؤولي التنفيذ"],
  other: ["الترحيب", "موضوع اللقاء", "الحوار والنقاش", "التوصيات"],
};
const blank = (me, t = "disc") => ({ id: uid("mt"), type: t, title: MT[t][1], goal: MT[t][3], date: dkey(new Date()), time: "", place: "", staff: [], cks: [], studs: [], agenda: AGENDA[t], notes: "", recs: [{ t: "", who: "", d: "" }], att: {}, sAtt: {}, photos: [], status: "plan" });

export function Meetings({ api, me, canAll }) {
  const [L, setL] = useState(null); const [P, setP] = useState(null); const [ST, setST] = useState(null); const [ed, setEd] = useState(null); const [q, setQ] = useState("");
  const load = async () => { const d = await api.maGet(N); setL(Object.values(obj(d)).filter(x => x && x.id).sort((a, b) => String(b.date).localeCompare(String(a.date)) || (b.at || 0) - (a.at || 0))); };
  useEffect(() => { load(); loadPeople(api).then(setP).catch(() => setP({ principal: [], deputy: [], counselor: [], activity: [], admin: [], teachers: [], byCk: {}, all: [] })); loadStudents(api).then(setST); }, []);
  if (!L || !P || !ST) return <div className="lf"><LfStyle /><Loading /></div>;
  if (ed) return <MeetEditor api={api} me={me} P={P} ST={ST} M0={ed} onClose={async () => { setEd(null); await load(); }} />;
  const up = L.filter(m => m.status !== "done"), done = L.filter(m => m.status === "done");
  const nS = new Set(L.flatMap(m => arr(m.studs).map(s => s.id))).size;
  const LL = L.filter(m => !q || nrm(m.title).includes(nrm(q)));
  return <div className="lf"><LfStyle />
    <div className="lf-hero" style={{ "--h1": "#0b2545", "--h2": "#0f766e" }}>
      <h2>🤝 اللقاءات الطلابية</h2>
      <p>خطّط لقاءاتك مع الطلاب في دقائق: اختر نوع اللقاء والمشاركين من المعلمين والوكلاء والموجهين ورائد النشاط، ودع الموقع يقترح عليك الطلاب من بيانات الحضور والتأخر والسلوك ونافس، ثم وثّق المحضر والتوصيات والصور واطبع الدعوة وكشف الحضور.</p>
      <div className="lf-kp"><div><b>{ar(L.length)}</b><small>لقاء</small></div><div><b>{ar(up.length)}</b><small>قادم / قيد الإعداد</small></div><div><b>{ar(done.length)}</b><small>منفذ</small></div><div><b>{ar(nS)}</b><small>طالب شارك</small></div></div>
    </div>
    <div className="lf-card" style={{ display: "grid", gap: 10 }}><div className="lf-h"><b>➕ ابدأ لقاءً جديدًا</b><small style={{ color: "#64748b", fontWeight: 800 }}>اختر النوع وسيُجهَّز جدول الأعمال واقتراح الطلاب تلقائيًا</small></div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(min(100%,190px),1fr))", gap: 10 }}>{Object.entries(MT).map(([k, [ic, t, c, g]]) => <button key={k} onClick={() => setEd(blank(me.name, k))} style={{ border: `2px solid ${c}33`, borderRadius: 16, padding: "12px 12px", background: `linear-gradient(160deg,#fff,${c}0d)`, cursor: "pointer", font: "inherit", textAlign: "right", display: "grid", gap: 4 }}><span style={{ fontSize: 28 }}>{ic}</span><b style={{ color: c, fontSize: 14.5 }}>{t}</b><small style={{ color: "#64748b", fontWeight: 700, lineHeight: 1.6 }}>{g || "لقاء بعنوان وأهداف تحددها"}</small></button>)}</div></div>
    <div className="lf-card" style={{ display: "grid", gap: 10 }}><div className="lf-h"><b>🗂️ سجل اللقاءات</b><span className="lf-sp" /><input className="lf-in" style={{ width: 200 }} placeholder="🔎 بحث" value={q} onChange={e => setQ(e.target.value)} /></div>
      {!LL.length ? <div className="lf-empty"><b>🤝</b>لا توجد لقاءات مسجلة بعد</div> :
        <div style={{ display: "grid", gap: 8 }}>{LL.map(m => { const T = MT[m.type] || MT.other; const nA = Object.values(obj(m.att)).filter(Boolean).length;
          return <button key={m.id} onClick={() => setEd(m)} style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 12, alignItems: "center", border: "1px solid #e2e8f0", borderRight: `5px solid ${T[2]}`, borderRadius: 14, padding: "10px 14px", background: "#fff", cursor: "pointer", font: "inherit", textAlign: "right" }}>
            <div style={{ textAlign: "center", background: `${T[2]}12`, borderRadius: 12, padding: "6px 10px", minWidth: 64 }}><div style={{ fontSize: 22 }}>{T[0]}</div><small style={{ fontWeight: 900, color: T[2], fontSize: 11 }}>{hDate(m.date, { day: "numeric", month: "short" })}</small></div>
            <div style={{ display: "grid", gap: 3 }}><b style={{ color: "#0b2545", fontSize: 15 }}>{m.title}</b><small style={{ color: "#64748b", fontWeight: 800 }}>{gDay(m.date)}{m.time ? ` • ${m.time}` : ""}{m.place ? ` • ${m.place}` : ""} • 👥 {ar(arr(m.staff).length)} من المدرسة • 🎓 {ar(arr(m.studs).length)} طالب{m.status === "done" ? ` • حضر ${ar(nA)}` : ""}</small>
              <div style={{ display: "flex" }}>{arr(m.studs).slice(0, 8).map((s, i) => <span key={i} style={{ marginInlineStart: i ? -7 : 0, border: "2px solid #fff", borderRadius: "50%" }}><Av n={s.name} s={22} /></span>)}</div></div>
            <span className="lf-st" style={{ "--c": m.status === "done" ? "#15803d" : "#2563eb" }}>{m.status === "done" ? "✅ منفذ" : "📅 مخطط"}</span></button>; })}</div>}
    </div>
  </div>;
}

function MeetEditor({ api, me, P, ST, M0, onClose }) {
  const [M, setM] = useState({ ...blank(me.name, M0.type || "other"), ...M0 }); const isNew = !M0.at; const [busy, setBusy] = useState(""); const [tab, setTab] = useState(isNew ? 0 : M0.status === "done" ? 3 : 0);
  const [per, setPer] = useState("60"); const [SG, setSG] = useState(null); const [sk, setSk] = useState(M0.type && SUG.some(x => x[0] === M0.type) ? M0.type : "disc"); const [pick, setPick] = useState(""); const [imgs, setImgs] = useState(null);
  const set = o => setM(x => ({ ...x, ...o })); const f = k => e => set({ [k]: e.target.value }); const T = MT[M.type] || MT.other;
  useEffect(() => { setSG(null); loadSignals(api, per === "year" ? yearStart() : dkey(new Date(Date.now() - (+per) * 864e5))).then(setSG).catch(() => setSG({ S: {} })); }, [per]);
  useEffect(() => { if (tab === 3 && !imgs) api.maGet(`${NI}/${M.id}`).then(d => setImgs(obj(d))); }, [tab]);
  const cks = arr(M.cks); const pool = ST.S.filter(s => !cks.length || cks.includes(s.ck)); const SS = new Set(arr(M.studs).map(s => s.id));
  const sug = useMemo(() => { if (!SG) return {}; const o = {}; SUG.forEach(([k]) => { o[k] = pool.map(s => ({ s, r: suggest(k, SG.S[s.id]) })).filter(x => x.r).sort((a, b) => b.r.w - a.r.w); }); return o; }, [SG, cks.join()]);
  const addS = (L, why) => { const cur = [...arr(M.studs)]; L.forEach(({ s, r }) => { if (!cur.some(x => x.id === s.id)) cur.push({ id: s.id, name: s.name, ck: s.ck, why: r ? r.why : why || "" }); }); set({ studs: cur }); };
  const delS = id => set({ studs: arr(M.studs).filter(x => x.id !== id) });
  const save = async (extra = {}) => { if (!M.title.trim()) { alert("اكتب عنوان اللقاء"); return false; } setBusy("💾 جارٍ الحفظ…"); const o = { ...M, ...extra, agenda: arr(M.agenda).filter(x => String(x).trim()), recs: arr(M.recs).filter(r => r && String(r.t).trim()), by: M.by || me.name, at: M.at || Date.now(), upd: Date.now() }; await api.maPut(`${N}/${M.id}`, o); setM(o); setBusy(""); return true; };
  const del = async () => { if (!window.confirm("حذف هذا اللقاء؟")) return; await api.maPut(`${N}/${M.id}`, null); await api.maPut(`${NI}/${M.id}`, null); onClose(); };
  const aiAgenda = async () => {
    setBusy("✨ يقترح الذكاء الاصطناعي جدول الأعمال…");
    try { const j = await aiJSON(api, `أعدّ جدول أعمال ونقاط حديث للقاء طلابي في مدرسة متوسطة للبنين بالمملكة العربية السعودية.
نوع اللقاء: ${T[1]} • العنوان: ${M.title}${M.goal ? ` • الهدف: ${M.goal}` : ""}
عدد الطلاب المدعوين: ${arr(M.studs).length}${arr(M.studs).length ? ` • أبرز مؤشراتهم: ${arr(M.studs).slice(0, 12).map(s => s.why).filter(Boolean).join("؛ ")}` : ""}
المشاركون من المدرسة: ${arr(M.staff).map(x => `${x.name} (${(GRP[x.grp] || [])[1] || ""})`).join("، ") || "—"}
أعد: agenda (٥–٧ فقرات مرتبة مع مدة تقريبية بين قوسين وصاحب الفقرة إن أمكن من المشاركين)، talk (٤–٦ نقاط حديث مؤثرة قصيرة للمتحدث)، recs (٣–٤ توصيات متوقعة للمتابعة).`, { type: "object", properties: { agenda: { type: "array", items: { type: "string" } }, talk: { type: "array", items: { type: "string" } }, recs: { type: "array", items: { type: "string" } } }, required: ["agenda"] }, "meet-agenda", 2500);
      set({ agenda: arr(j.agenda), talk: arr(j.talk), recs: arr(M.recs).some(r => r && r.t) ? M.recs : arr(j.recs).map(t => ({ t, who: "", d: "" })) });
    } catch (e) { alert(e.message === "nohash" ? "يتطلب الدخول من بوابة الإداريين برقم السجل المدني — استُعمل جدول الأعمال الجاهز لهذا النوع." : e.message); }
    setBusy("");
  };
  const upload = async files => { const F = [...files].filter(x => /^image\//.test(x.type)).slice(0, Math.max(0, 12 - arr(M.photos).length)); const ph = [...arr(M.photos)], im = { ...imgs };
    for (let i = 0; i < F.length; i++) { setBusy(`📷 رفع ${ar(i + 1)} من ${ar(F.length)}…`); const d = await shrinkImg(F[i], 1200, .72); const k = "p" + Date.now().toString(36) + i; await api.maPut(`${NI}/${M.id}/${k}`, { d, at: Date.now() }); im[k] = { d }; ph.push({ k, cap: "" }); }
    setImgs(im); set({ photos: ph }); setBusy(""); };
  // ── الطباعة
  const stTbl = (sign) => `<table><tr><th style="width:34px">م</th><th>الطالب</th><th style="width:80px">الفصل</th><th>سبب الدعوة</th>${sign ? `<th style="width:80px">الحضور</th><th style="width:110px">التوقيع</th>` : ""}</tr>${arr(M.studs).map((s, i) => `<tr><td style="text-align:center">${ar(i + 1)}</td><td>${esc(s.name)}</td><td style="text-align:center">${esc(api.maClassName(s.ck))}</td><td style="font-size:11px">${esc(s.why || "")}</td>${sign ? `<td></td><td></td>` : ""}</tr>`).join("")}</table>`;
  const stfTbl = () => `<table><tr><th style="width:34px">م</th><th>الاسم</th><th>الصفة</th><th style="width:110px">التوقيع</th></tr>${arr(M.staff).map((x, i) => `<tr><td style="text-align:center">${ar(i + 1)}</td><td>${esc(x.name)}</td><td>${esc((GRP[x.grp] || [])[1] === "المعلمون" ? "معلم" + (x.job ? ` — ${x.job}` : "") : (GRP[x.grp] || [])[1] || x.job || "")}</td><td></td></tr>`).join("")}</table>`;
  const info = () => `<table><tr><td class="k">اللقاء</td><td><b>${esc(M.title)}</b></td><td class="k">اليوم والتاريخ</td><td>${gDay(M.date)} ${hDate(M.date)}</td></tr><tr><td class="k">الوقت</td><td>${esc(M.time || "")}</td><td class="k">المكان</td><td>${esc(M.place || "")}</td></tr>${M.goal ? `<tr><td class="k">الهدف</td><td colspan="3">${esc(M.goal)}</td></tr>` : ""}${cks.length ? `<tr><td class="k">الفصول</td><td colspan="3">${cks.map(c => `<span class="chip">${esc(api.maClassName(c))}</span>`).join("")}</td></tr>` : ""}</table>`;
  const pInv = () => printDoc("دعوة " + M.title, `${printHead(api, "دعوة لحضور لقاء طلابي", esc(M.title))}<p style="font-size:14px;font-weight:700">المكرمون المشاركون في اللقاء — السلام عليكم ورحمة الله وبركاته، وبعد:<br>يسرنا دعوتكم لحضور <b>${esc(M.title)}</b> وفق البيانات الآتية:</p>${info()}${arr(M.agenda).length ? `<h2>جدول الأعمال</h2><ol>${arr(M.agenda).map(a => `<li>${esc(a)}</li>`).join("")}</ol>` : ""}<h2>المشاركون من منسوبي المدرسة</h2>${stfTbl()}<h2>الطلاب المدعوون (${ar(arr(M.studs).length)})</h2>${stTbl(false)}<div class="sg"><div>الموجه الطلابي</div><div>رائد النشاط</div><div>مدير المدرسة<br>${esc(obj(api.SP).principal || "")}</div></div>`);
  const pAtt = () => printDoc("كشف حضور " + M.title, `${printHead(api, "كشف حضور لقاء طلابي", esc(M.title))}${info()}<h2>حضور الطلاب</h2>${stTbl(true)}<h2>حضور منسوبي المدرسة</h2>${stfTbl()}`);
  const pMin = async () => { const im = imgs || obj(await api.maGet(`${NI}/${M.id}`)); const ph = arr(M.photos).filter(p => obj(im[p.k]).d); const nA = arr(M.studs).filter(s => obj(M.att)[s.id]).length;
    printDoc("محضر " + M.title, `${printHead(api, "محضر لقاء طلابي", esc(M.title))}${info()}<table><tr><td class="k">عدد الطلاب المدعوين</td><td>${ar(arr(M.studs).length)}</td><td class="k">الحاضرون</td><td>${ar(nA)}</td><td class="k">نسبة الحضور</td><td>${arr(M.studs).length ? ar(Math.round(nA / arr(M.studs).length * 100)) + "٪" : "—"}</td></tr></table>
${arr(M.agenda).length ? `<h2>جدول الأعمال</h2><ol>${arr(M.agenda).map(a => `<li>${esc(a)}</li>`).join("")}</ol>` : ""}${M.notes ? `<h2>ما دار في اللقاء</h2><div style="white-space:pre-wrap">${esc(M.notes)}</div>` : ""}
${arr(M.recs).some(r => r && r.t) ? `<h2>التوصيات والمتابعة</h2><table><tr><th>م</th><th>التوصية</th><th>المسؤول</th><th>الموعد</th></tr>${arr(M.recs).filter(r => r && r.t).map((r, i) => `<tr><td style="width:30px;text-align:center">${ar(i + 1)}</td><td>${esc(r.t)}</td><td>${esc(r.who || "")}</td><td>${r.d ? hDate(r.d, { day: "numeric", month: "short" }) : ""}</td></tr>`).join("")}</table>` : ""}
<h2>الطلاب المشاركون</h2><table><tr><th>م</th><th>الطالب</th><th>الفصل</th><th>الحضور</th></tr>${arr(M.studs).map((s, i) => `<tr><td style="width:30px;text-align:center">${ar(i + 1)}</td><td>${esc(s.name)}</td><td>${esc(api.maClassName(s.ck))}</td><td style="text-align:center">${obj(M.att)[s.id] ? "✓ حاضر" : "غائب"}</td></tr>`).join("")}</table>
<h2>المشاركون من المدرسة</h2><div>${arr(M.staff).map(x => `<span class="chip">${esc(x.name)} — ${esc((GRP[x.grp] || [])[1] || "")}</span>`).join("")}</div>
${ph.length ? `<h2>صور اللقاء</h2><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">${ph.map(p => `<figure class="av" style="margin:0;border:1px solid #cbd5e1;border-radius:12px;overflow:hidden"><img src="${im[p.k].d}" style="width:100%;height:220px;object-fit:cover;display:block">${p.cap ? `<figcaption style="padding:4px;text-align:center;font-weight:800;font-size:11px">${esc(p.cap)}</figcaption>` : ""}</figure>`).join("")}</div>` : ""}
<div class="sg"><div>محرر المحضر<br>${esc(M.by || me.name)}</div><div>الموجه الطلابي</div><div>مدير المدرسة<br>${esc(obj(api.SP).principal || "")}</div></div>`); };
  const TABS = [["📝", "تفاصيل اللقاء"], ["👥", `المشاركون (${ar(arr(M.staff).length)})`], ["🎓", `الطلاب (${ar(arr(M.studs).length)})`], ["📋", "المحضر والتوثيق"]];
  const clsOf = ck => ST.classes.find(c => c.ck === ck);
  return <div className="lf"><LfStyle />
    <div className="lf-hero" style={{ "--h1": "#0b2545", "--h2": T[2], display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
      <span style={{ fontSize: 54, position: "relative", zIndex: 1 }}>{T[0]}</span><div style={{ flex: 1, minWidth: 200, position: "relative", zIndex: 1 }}><h2>{M.title || T[1]}</h2><p>{gDay(M.date)} {hDate(M.date)}{M.time ? ` • ${M.time}` : ""}{M.place ? ` • ${M.place}` : ""}</p>
        <div className="lf-kp"><div><b>{ar(arr(M.staff).length)}</b><small>من منسوبي المدرسة</small></div><div><b>{ar(cks.length || ST.classes.length)}</b><small>{cks.length ? "فصول مختارة" : "كل الفصول"}</small></div><div><b>{ar(arr(M.studs).length)}</b><small>طالب مدعو</small></div></div></div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", position: "relative", zIndex: 1 }}><button className="lf-b" onClick={onClose}>→ رجوع</button><button className="lf-b g" disabled={!!busy} onClick={async () => { if (await save()) onClose(); }}>{busy || "💾 حفظ"}</button></div>
    </div>
    <div className="lf-tabs">{TABS.map(([ic, t], i) => <button key={i} className={tab === i ? "on" : ""} onClick={() => setTab(i)}>{ic} {t}</button>)}</div>
    {tab === 0 && <div className="lf-card" style={{ display: "grid", gap: 14 }}>
      <Field l="نوع اللقاء"><div className="lf-chips">{Object.entries(MT).map(([k, [ic, t, c]]) => <button type="button" key={k} className={"lf-chip" + (M.type === k ? " on" : "")} style={{ "--c": c }} onClick={() => { set({ type: k, title: M.title === T[1] || !M.title ? t : M.title, goal: !M.goal || M.goal === T[3] ? MT[k][3] : M.goal, agenda: arr(M.agenda).join() === arr(AGENDA[M.type]).join() ? AGENDA[k] : M.agenda }); if (SUG.some(x => x[0] === k)) setSk(k); }}>{ic} {t}</button>)}</div></Field>
      <div className="lf-g2"><Field l="عنوان اللقاء"><input className="lf-in" style={{ fontWeight: 900, fontSize: 16 }} value={M.title} onChange={f("title")} /></Field><Field l="الهدف"><input className="lf-in" value={M.goal} onChange={f("goal")} /></Field></div>
      <div className="lf-g3"><Field l="التاريخ"><input className="lf-in" type="date" value={M.date} onChange={f("date")} /></Field><Field l="الوقت"><input className="lf-in" value={M.time} onChange={f("time")} placeholder="مثال: الحصة الثالثة / ٩:٣٠ ص" /></Field><Field l="المكان"><input className="lf-in" value={M.place} onChange={f("place")} placeholder="مثال: مصادر التعلم" /></Field></div>
      <div className="lf-sec"><h4><i>🗒️</i>جدول الأعمال</h4><div className="lf-h"><small style={{ color: "#64748b", fontWeight: 800 }}>جدول جاهز لهذا النوع — عدّله أو اطلب اقتراحًا مخصصًا</small><span className="lf-sp" /><button className="lf-b g sm" disabled={!!busy} onClick={aiAgenda}>{busy || "✨ اقتراح بالذكاء الاصطناعي"}</button></div><ListEd v={M.agenda} set={v => set({ agenda: v })} ph="فقرة" add="➕ فقرة" />
        {arr(M.talk).length > 0 && <div className="lf-note"><b>🎤 نقاط حديث مقترحة:</b><ul style={{ margin: "4px 0 0", paddingInlineStart: 18 }}>{arr(M.talk).map((t, i) => <li key={i}>{t}</li>)}</ul></div>}</div>
    </div>}
    {tab === 1 && <div className="lf-card" style={{ display: "grid", gap: 12 }}><div className="lf-note">👥 اختر من سيشارك في اللقاء من منسوبي المدرسة. يظهر المعلمون بموادهم من الجدول المدرسي.</div><PeoplePick P={P} sel={M.staff} set={v => set({ staff: v })} groups={["principal", "deputy", "counselor", "activity", "admin", "teachers"]} /></div>}
    {tab === 2 && <div style={{ display: "grid", gap: 12 }}>
      <div className="lf-card" style={{ display: "grid", gap: 8 }}><div className="lf-h"><b>🏫 الفصول</b><small style={{ color: "#64748b", fontWeight: 800 }}>{cks.length ? `${ar(cks.length)} فصل • ${ar(pool.length)} طالب` : `كل الفصول • ${ar(pool.length)} طالب`}</small><span className="lf-sp" /><button className="lf-b sm" onClick={() => set({ cks: [] })}>كل الفصول</button></div>
        <div className="lf-chips">{ST.classes.filter(c => (ST.byCk[c.ck] || []).length).map(c => <button key={c.ck} className={"lf-chip" + (cks.includes(c.ck) ? " on" : "")} onClick={() => set({ cks: cks.includes(c.ck) ? cks.filter(x => x !== c.ck) : [...cks, c.ck] })}>{c.name} <small>{ar((ST.byCk[c.ck] || []).length)}</small></button>)}</div></div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,420px),1fr))", gap: 12, alignItems: "start" }}>
        <div className="lf-card" style={{ display: "grid", gap: 10 }}><div className="lf-h"><b>💡 اقتراحات الموقع</b><span className="lf-sp" /><select className="lf-sel" style={{ width: 150 }} value={per} onChange={e => setPer(e.target.value)}><option value="30">آخر ٣٠ يومًا</option><option value="60">آخر ٦٠ يومًا</option><option value="year">العام الدراسي</option></select></div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(130px,1fr))", gap: 6 }}>{SUG.map(([k, ic, t, c]) => <button key={k} onClick={() => setSk(k)} style={{ border: `2px solid ${sk === k ? c : "#e2e8f0"}`, background: sk === k ? `${c}12` : "#fff", borderRadius: 12, padding: "7px 6px", cursor: "pointer", font: "inherit", fontWeight: 900, fontSize: 12, color: c, display: "grid", gap: 2, textAlign: "center" }}><span style={{ fontSize: 18 }}>{ic}</span>{t}<b style={{ fontSize: 16 }}>{SG ? ar(arr(sug[k]).length) : "…"}</b></button>)}</div>
          {!SG ? <Loading t="تحليل الحضور والتأخر والسلوك ونافس…" /> : (() => { const Lk = arr(sug[sk]); const c = SUG.find(x => x[0] === sk)[3]; const rest = Lk.filter(x => !SS.has(x.s.id));
            return <><div className="lf-h"><small style={{ fontWeight: 800, color: "#64748b" }}>{sk.startsWith("nafs") ? "نافس للصف الثالث فقط • " : ""}{ar(Lk.length)} طالب</small><span className="lf-sp" />{rest.length > 0 && <button className="lf-b sm p" onClick={() => addS(rest)}>➕ إضافة الكل ({ar(rest.length)})</button>}{rest.length > 10 && <button className="lf-b sm" onClick={() => addS(rest.slice(0, 10))}>أعلى ١٠</button>}</div>
              {!Lk.length ? <div className="lf-empty" style={{ padding: 16 }}>لا يوجد طلاب ينطبق عليهم هذا المعيار في الفصول المختارة</div> :
                <div style={{ display: "grid", gap: 4, maxHeight: 420, overflow: "auto" }}>{Lk.map(({ s, r }) => <div key={s.id} style={{ display: "flex", gap: 8, alignItems: "center", padding: "6px 8px", borderRadius: 12, background: SS.has(s.id) ? `${c}10` : "#f8fafc" }}><Av n={s.name} s={30} /><div style={{ flex: 1, minWidth: 0 }}><b style={{ fontSize: 13.5 }}>{s.name}</b><div style={{ fontSize: 11.5, fontWeight: 800, color: "#64748b" }}>{api.maClassName(s.ck)} • <span style={{ color: c }}>{r.why}</span></div></div>{SS.has(s.id) ? <button className="lf-b sm" onClick={() => delS(s.id)}>✓ مضاف</button> : <button className="lf-b sm p" onClick={() => addS([{ s, r }])}>➕</button>}</div>)}</div>}</>; })()}
          <div style={{ borderTop: "1px dashed #e2e8f0", paddingTop: 8, display: "grid", gap: 6 }}><b style={{ fontSize: 13 }}>✋ أو اختر يدويًا من فصل</b><select className="lf-sel" value={pick} onChange={e => setPick(e.target.value)}><option value="">— اختر فصلًا —</option>{ST.classes.filter(c => (ST.byCk[c.ck] || []).length).map(c => <option key={c.ck} value={c.ck}>{c.name}</option>)}</select>
            {pick && <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 4 }}>{(ST.byCk[pick] || []).map(s => <label key={s.id} style={{ display: "flex", gap: 6, alignItems: "center", fontWeight: 700, fontSize: 13, padding: 4 }}><input type="checkbox" checked={SS.has(s.id)} onChange={() => SS.has(s.id) ? delS(s.id) : addS([{ s, r: null }], "اختيار يدوي")} />{s.name}</label>)}</div>}</div>
        </div>
        <div className="lf-card" style={{ display: "grid", gap: 8, position: "sticky", top: 8 }}><div className="lf-h"><b>🎓 الطلاب المدعوون ({ar(arr(M.studs).length)})</b><span className="lf-sp" />{arr(M.studs).length > 0 && <button className="lf-b sm d" onClick={() => window.confirm("إزالة كل الطلاب؟") && set({ studs: [] })}>إفراغ</button>}</div>
          {!arr(M.studs).length ? <div className="lf-empty" style={{ padding: 18 }}><b>🎓</b>أضف الطلاب من الاقتراحات أو يدويًا</div> :
            <div style={{ display: "grid", gap: 4, maxHeight: 560, overflow: "auto" }}>{arr(M.studs).map((s, i) => <div key={s.id} style={{ display: "flex", gap: 8, alignItems: "center", padding: "5px 6px", borderBottom: "1px dashed #eef2f6" }}><small style={{ fontWeight: 900, color: "#94a3b8", width: 20 }}>{ar(i + 1)}</small><Av n={s.name} s={26} /><div style={{ flex: 1, minWidth: 0 }}><b style={{ fontSize: 13 }}>{s.name}</b><div style={{ fontSize: 11, fontWeight: 800, color: "#64748b" }}>{api.maClassName(s.ck)}{s.why ? ` • ${s.why}` : ""}</div></div><button className="lf-b sm d" onClick={() => delS(s.id)}>✕</button></div>)}</div>}
          {arr(M.studs).length > 0 && <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}><button className="lf-b sm" onClick={pInv}>✉️ طباعة الدعوة</button><button className="lf-b sm" onClick={pAtt}>📋 كشف الحضور</button></div>}</div>
      </div></div>}
    {tab === 3 && <div className="lf-card" style={{ display: "grid", gap: 14 }}>
      <div className="lf-sec"><h4><i>✅</i>حضور الطلاب ({ar(arr(M.studs).filter(s => obj(M.att)[s.id]).length)} من {ar(arr(M.studs).length)})</h4>
        <div className="lf-h"><button className="lf-b sm" onClick={() => set({ att: Object.fromEntries(arr(M.studs).map(s => [s.id, 1])) })}>الكل حاضر</button><button className="lf-b sm" onClick={() => set({ att: {} })}>مسح</button></div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 6 }}>{arr(M.studs).map(s => { const on = !!obj(M.att)[s.id]; return <button key={s.id} className={"lf-pp" + (on ? " on" : "")} style={{ "--c": "#15803d" }} onClick={() => set({ att: { ...obj(M.att), [s.id]: on ? null : 1 } })}><Av n={s.name} s={26} /><span>{s.name}<small>{api.maClassName(s.ck)}</small></span><span className="ck">{on ? "✓" : ""}</span></button>; })}</div></div>
      <Field l="ما دار في اللقاء (المحضر)"><textarea className="lf-ta" style={{ minHeight: 130 }} value={M.notes} onChange={f("notes")} placeholder="أبرز ما طُرح، وآراء الطلاب، والاتفاقات…" /></Field>
      <div className="lf-sec"><h4><i>📌</i>التوصيات والمتابعة</h4>{arr(M.recs).map((r, i) => <div key={i} className="lf-li" style={{ flexWrap: "wrap" }}><input className="lf-in" style={{ flex: "3 1 220px" }} value={r.t} placeholder="التوصية" onChange={e => { const n = [...M.recs]; n[i] = { ...r, t: e.target.value }; set({ recs: n }); }} /><input className="lf-in" list="mt-people" style={{ flex: "1 1 150px" }} value={r.who || ""} placeholder="المسؤول" onChange={e => { const n = [...M.recs]; n[i] = { ...r, who: e.target.value }; set({ recs: n }); }} /><input className="lf-in" type="date" style={{ flex: "1 1 130px" }} value={r.d || ""} onChange={e => { const n = [...M.recs]; n[i] = { ...r, d: e.target.value }; set({ recs: n }); }} /><button className="lf-b sm d" onClick={() => set({ recs: M.recs.filter((_, j) => j !== i) })}>✕</button></div>)}
        <datalist id="mt-people">{arr(M.staff).map(x => <option key={x.key} value={x.name} />)}</datalist><button className="lf-b sm" style={{ justifySelf: "start" }} onClick={() => set({ recs: [...arr(M.recs), { t: "", who: "", d: "" }] })}>➕ توصية</button></div>
      <div className="lf-sec"><h4><i>📷</i>صور اللقاء ({ar(arr(M.photos).length)} / ١٢)</h4><label className="lf-b p" style={{ cursor: "pointer", justifySelf: "start" }}>📤 رفع صور<input type="file" accept="image/*" multiple hidden onChange={e => { upload(e.target.files); e.target.value = ""; }} /></label>
        {imgs && <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(170px,1fr))", gap: 8 }}>{arr(M.photos).map((p, i) => <div key={p.k} style={{ border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>{obj(imgs[p.k]).d && <img src={imgs[p.k].d} alt="" style={{ width: "100%", height: 120, objectFit: "cover", display: "block" }} />}<div style={{ padding: 6, display: "flex", gap: 4 }}><input className="lf-in" style={{ fontSize: 12, padding: "5px 8px" }} placeholder="وصف" value={p.cap || ""} onChange={e => { const n = [...M.photos]; n[i] = { ...p, cap: e.target.value }; set({ photos: n }); }} /><button className="lf-b sm d" onClick={async () => { await api.maPut(`${NI}/${M.id}/${p.k}`, null); set({ photos: M.photos.filter(x => x.k !== p.k) }); }}>🗑️</button></div></div>)}</div>}</div>
      <div className="lf-h" style={{ gap: 8 }}><button className="lf-b g" disabled={!!busy} onClick={async () => { if (await save({ status: "done" })) alert("✅ حُفظ اللقاء منفذًا"); }}>✅ حفظ واعتماد اللقاء منفذًا</button><button className="lf-b p" onClick={pMin}>🖨️ طباعة المحضر</button><button className="lf-b" onClick={pAtt}>📋 كشف الحضور</button><span className="lf-sp" />{!isNew && <button className="lf-b d" onClick={del}>🗑️ حذف اللقاء</button>}</div>
    </div>}
  </div>;
}
