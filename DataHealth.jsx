// ══════════════════════════════════════════════════════════════════════════════
// 🩺 صحة البيانات — يكتشف ما يُفسد دقة التقارير والإنذار المبكر قبل أن يظهر أثره
//   فصول لم تُرصد • طلاب مكررون أو بلا هوية • نتائج لا تطابق طالبًا • درجات خارج المدى • أقسام توقف تحديثها
//   school-dh-ignore/{check}/{key} = 1   (حالات راجعها المسؤول وتأكد أنها صحيحة — مثل توأمين بالاسم نفسه)
// ══════════════════════════════════════════════════════════════════════════════
import React, { useState, useEffect, useMemo } from "react";

const NAVY = "#0b2545", GOLD = "#c9a227";
const ar = n => String(n ?? "").replace(/\d/g, d => "٠١٢٣٤٥٦٧٨٩"[d]);
const obj = v => (v && typeof v === "object" ? v : {});
const arrv = v => Array.isArray(v) ? v.filter(Boolean) : (v && typeof v === "object" ? Object.values(v).filter(Boolean) : []);
const nrm = s => String(s || "").replace(/[ً-ْـ]/g, "").replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي").replace(/\s+/g, " ").trim();
const ixKey = sid => String(sid).replace(/[.#$[\]/]/g, "");
const pad = n => String(n).padStart(2, "0");
const dkey = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const daysAgo = ts => ts ? Math.floor((Date.now() - ts) / 864e5) : null;
const dTs = k => { const [y, m, d] = String(k).split("-").map(Number); return y ? new Date(y, m - 1, d, 12).getTime() : 0; };
const SEV = { h: ["مهم", "#b91c1c", "#fee2e2", 7], m: ["متوسط", "#b45309", "#fef3c7", 3.5], l: ["تنبيه", "#2563eb", "#dbeafe", 1.2], ok: ["سليم", "#15803d", "#dcfce7", 0] };

async function scan(api) {
  const T = new Date(); const t = dkey(T); const f = dkey(new Date(Date.now() - 16 * 864e5));
  const [ros, meta, att, late, bn, gr, rdR, nqR, pre, qr, staff, ign, ann, circ] = await Promise.all([
    api.maGet(api.MA_ROSTER), api.maGet(api.MA_META), api.fbRange(api.MA_ATT, f, t).catch(() => ({})), api.fbRange(api.MA_LATE, f, t).catch(() => ({})), api.fbRange(api.BN_NODE, dkey(new Date(Date.now() - 60 * 864e5)), t).catch(() => ({})),
    api.maGet("school-grades-stu"), api.maGet("school-rd-res"), api.maGet("school-nq-res"), api.maGet("school-nafsbook-pre"), api.maGet("school-nafsbook-qr"), api.maGet(api.PT_STAFF), api.maGet("school-dh-ignore"), api.maGet(api.ANN_NODE).catch(() => null), api.maGet(api.CR_NODE).catch(() => null)]);
  const M = obj(meta); const classes = api.maClasses(arrv(M.counts).length ? arrv(M.counts).map(Number) : [0]); const R = obj(ros);
  const S = []; const byId = {}; const ck2 = {};
  Object.entries(R).forEach(([ck, c]) => arrv(obj(c).students).forEach(s => { if (!s) return; const x = { ...s, ck }; S.push(x); (byId[s.id] = byId[s.id] || []).push(x); (ck2[ck] = ck2[ck] || []).push(x); }));
  const inRos = (sid, ck) => !!(byId[sid] && (!ck || byId[sid].some(x => x.ck === ck))) || S.some(x => ixKey(x.id) === sid && (!ck || x.ck === ck));
  const name = api.maClassName; const IG = obj(ign); const ig = (c, k) => !!obj(IG[c])[k];
  const C = [];
  // ١) رصد الغياب
  const sd = []; for (let i = 0; i < 16 && sd.length < 5; i++) { const k = dkey(new Date(Date.now() - i * 864e5)); if (!api.maOff(k)) sd.push(k); }
  const A = obj(att); const miss = [];
  sd.forEach(k => classes.forEach(c => { if (!(ck2[c.ck] || []).length) return; if (!obj(A[k])[c.ck]) miss.push({ k: `${k}|${c.ck}`, t: name(c.ck), sub: k === t ? "اليوم" : new Date(dTs(k)).toLocaleDateString("ar-SA", { weekday: "long", day: "numeric", month: "long" }), today: k === t }); }));
  const todayMiss = miss.filter(x => x.today); const pastMiss = miss.filter(x => !x.today);
  const afterDl = M.deadline ? (T.getHours() * 60 + T.getMinutes()) > (+M.deadline.split(":")[0] * 60 + +M.deadline.split(":")[1]) : T.getHours() >= 9;
  C.push({ id: "att_today", g: "att", sev: todayMiss.length && afterDl && sd[0] === t ? "h" : todayMiss.length ? "l" : "ok", title: "فصول لم ترصد غياب اليوم", why: "الفصل غير المرصود يُحسب كأن طلابه حاضرون، فتنقص أرقام الغياب ويضعف الإنذار المبكر.", items: sd[0] === t ? todayMiss : [], go: "morningattend", goL: "التحضير الصباحي", empty: sd[0] === t ? "كل الفصول رصدت اليوم ✔" : "اليوم ليس يوم دوام" });
  C.push({ id: "att_past", g: "att", sev: pastMiss.length > 3 ? "h" : pastMiss.length ? "m" : "ok", title: "أيام دوام سابقة بلا رصد (آخر ٥ أيام)", why: "أيام بلا رصد تجعل نسبة الحضور ومؤشر الخطر أدق مما هي في الواقع.", items: pastMiss, go: "morningattend", goL: "التحضير الصباحي" });
  // ٢) الطلاب
  const dupId = Object.entries(byId).filter(([, L]) => new Set(L.map(x => x.ck)).size > 1).map(([id, L]) => ({ k: id, t: L[0].name, sub: L.map(x => name(x.ck)).join(" ، ") })).filter(x => !ig("dup_id", x.k));
  C.push({ id: "dup_id", g: "stu", sev: dupId.length ? "h" : "ok", title: "طالب مسجّل في أكثر من فصل", why: "يُحتسب غيابه ودرجاته مرتين، ويظهر في قائمتين.", items: dupId, go: "students", goL: "الطلاب", ign: true });
  const byN = {}; S.forEach(s => { const k = nrm(s.name); if (k) (byN[k] = byN[k] || []).push(s); });
  const dupN = Object.values(byN).filter(L => L.length > 1 && new Set(L.map(x => x.id)).size > 1).map(L => ({ k: nrm(L[0].name), t: L[0].name, sub: L.map(x => name(x.ck)).join(" ، "), same: new Set(L.map(x => x.ck)).size < L.length })).filter(x => !ig("dup_name", x.k));
  C.push({ id: "dup_name", g: "stu", sev: dupN.some(x => x.same) ? "h" : dupN.length ? "m" : "ok", title: "أسماء متطابقة لطلاب مختلفين", why: "قد يكون الطالب أُضيف مرتين، أو أنهما شخصان (مثل التوأم). النتائج التي تُطابَق بالاسم قد تذهب للطالب الخطأ. إن تحققت أنهما مختلفان اضغط «صحيح، تجاهل».", items: dupN, go: "students", goL: "الطلاب", ign: true });
  const noNh = S.filter(s => !s.nh).map(s => ({ k: s.id, t: s.name, sub: name(s.ck) }));
  C.push({ id: "no_nh", g: "stu", sev: noNh.length > S.length * .3 ? "h" : noNh.length ? "m" : "ok", title: "طلاب بلا رقم هوية مسجّل", why: "لا يستطيع الطالب ولا ولي أمره الدخول إلى البوابة واختبارات نافس والمراجع برقم الهوية.", items: noNh, go: "students", goL: "الطلاب" });
  const badN = S.filter(s => String(s.name || "").trim().split(/\s+/).length < 3).map(s => ({ k: s.id, t: s.name || "(بلا اسم)", sub: name(s.ck) })).filter(x => !ig("bad_name", x.k));
  C.push({ id: "bad_name", g: "stu", sev: badN.length ? "l" : "ok", title: "أسماء غير مكتملة (أقل من ثلاثة أجزاء)", why: "تصعّب البحث والمطابقة مع نور والشهادات.", items: badN, go: "students", goL: "الطلاب", ign: true });
  const emptyC = classes.filter(c => !(ck2[c.ck] || []).length).map(c => ({ k: c.ck, t: name(c.ck), sub: "لا يوجد طلاب" }));
  const extraC = Object.keys(R).filter(ck => (ck2[ck] || []).length && !classes.some(c => c.ck === ck)).map(ck => ({ k: ck, t: name(ck), sub: `${ar((ck2[ck] || []).length)} طالب في فصل غير موجود بالإعدادات` }));
  C.push({ id: "cls", g: "stu", sev: extraC.length ? "h" : emptyC.length ? "l" : "ok", title: "فصول فارغة أو غير معرّفة", why: "فصل فيه طلاب وليس في إعدادات الفصول لا يظهر في التحضير. والفصل الفارغ يظهر بلا فائدة.", items: [...extraC, ...emptyC], go: "schoolsetup", goL: "إعدادات المدرسة" });
  // ٣) الدرجات
  const gOut = [], gOrph = []; let lastG = 0;
  Object.entries(obj(gr)).forEach(([ck, bySid]) => Object.entries(obj(bySid)).forEach(([sid, recs]) => { const st = (ck2[ck] || []).find(x => x.id === sid || ixKey(x.id) === sid); let orphan = !st;
    Object.entries(obj(recs)).forEach(([rid, r]) => { if (!r) return; const ts = r.at || dTs(r.d); if (ts > lastG) lastG = ts; if (orphan) return; const v = r.v, mx = +r.mx;
      if (v === "غ" || v === "" || v == null) return; const n = +v; if (!mx || !isFinite(n) || n < 0 || n > mx) gOut.push({ k: `${ck}|${sid}|${rid}`, t: st.name, sub: `${r.s || "مادة"} — ${r.ti || r.ty || "تقويم"}: ${ar(v)} من ${ar(r.mx || "؟")}` }); });
    if (orphan) gOrph.push({ k: `${ck}|${sid}`, t: `سجل درجات لطالب غير موجود في ${name(ck)}`, sub: `${ar(Object.keys(obj(recs)).length)} درجة` }); }));
  C.push({ id: "g_range", g: "res", sev: gOut.length ? "h" : "ok", title: "درجات خارج المدى", why: "درجة أكبر من النهاية العظمى أو سالبة أو غير رقمية تُفسد المتوسطات وتحليل النتائج.", items: gOut.filter(x => !ig("g_range", x.k)), go: "gradebook", goL: "رصد الدرجات", ign: true });
  // ٤) نتائج لا تطابق طالبًا
  const orph = [...gOrph];
  Object.entries(obj(rdR)).forEach(([tid, byK]) => Object.keys(obj(byK)).forEach(k => { const i = k.indexOf("_"); const ck = k.slice(0, i), sk = k.slice(i + 1); if (!inRos(sk, ck)) orph.push({ k: `rd|${tid}|${k}`, t: "نتيجة قراءة جهرية", sub: `${name(ck)} — طالب لم يعد في الفصل` }); }));
  Object.entries(obj(nqR)).forEach(([eid, byK]) => Object.entries(obj(byK)).forEach(([k, r]) => { if (!r) return; const ok = r.sid ? inRos(r.sid) : S.some(s => s.ck === r.ck && nrm(s.name) === nrm(r.name)); if (!ok) orph.push({ k: `nq|${eid}|${k}`, t: r.name || "نتيجة نافس", sub: `اختبار نافس — ${r.ck ? name(r.ck) : "فصل غير محدد"}${r.sid ? "" : " (طوبق بالاسم ولم يُعثر عليه)"}` }); }));
  Object.entries(obj(pre)).forEach(([b, bySid]) => Object.entries(obj(bySid)).forEach(([sid, v]) => { if (!inRos(sid)) orph.push({ k: `pre|${b}|${sid}`, t: (v && v.n) || "نتيجة قبلي", sub: "الاختبار القبلي في المراجع — طالب غير موجود" }); }));
  Object.keys(obj(qr)).forEach(sid => { if (!inRos(sid)) orph.push({ k: `qr|${sid}`, t: "إجابات إلكترونية في المراجع", sub: "طالب غير موجود في القوائم" }); });
  C.push({ id: "orphan", g: "res", sev: orph.length > 10 ? "m" : orph.length ? "l" : "ok", title: "نتائج لا تطابق أي طالب", why: "غالبًا لطالب نُقل أو حُذف، أو أُدخل اسمه بطريقة مختلفة. لا تدخل هذه النتائج في ملف أي طالب ولا في التقارير.", items: orph.filter(x => !ig("orphan", x.k)), ign: true });
  // ٥) الأقسام التي توقف تحديثها
  const maxK = o => Object.keys(obj(o)).sort().pop();
  const lastAtt = maxK(A) ? dTs(maxK(A)) : 0; const lastLate = maxK(late) ? dTs(maxK(late)) : 0; const lastBn = maxK(bn) ? dTs(maxK(bn)) : 0;
  let lastRd = 0; Object.values(obj(rdR)).forEach(byK => Object.values(obj(byK)).forEach(r => arrv(r && r.tries).forEach(x => { if ((x.at || 0) > lastRd) lastRd = x.at; })));
  let lastNq = 0; Object.values(obj(nqR)).forEach(byK => Object.values(obj(byK)).forEach(r => { if (r && (r.ts || 0) > lastNq) lastNq = r.ts; }));
  let lastAnn = 0; arrv(ann).forEach(a => { const x = +(a.at || a.ts || a.createdAt || a.date && Date.parse(a.date) || 0); if (x > lastAnn) lastAnn = x; });
  let lastCr = 0; arrv(circ).forEach(a => { const x = +(a.at || a.ts || 0); if (x > lastCr) lastCr = x; });
  const st = [["att", "رصد الغياب", lastAtt, 3, "morningattend"], ["late", "التأخر الصباحي", lastLate, 7, "morninglate"], ["bn", "الملاحظات السلوكية", lastBn, 14, "behavior"], ["g", "رصد الدرجات", lastG, 30, "gradebook"], ["rd", "اختبار القراءة الجهرية", lastRd, 45, "readlab"], ["nq", "اختبارات نافس التدريبية", lastNq, 30, "nafes"], ["ann", "الإعلانات", lastAnn, 21, "announcements"], ["cr", "التعاميم", lastCr, 21, "circulars"]];
  const stale = st.map(([k, l, ts, lim, go]) => { const d = daysAgo(ts); return { k, t: l, sub: ts ? (d === 0 ? "حُدّث اليوم" : `آخر تحديث قبل ${ar(d)} يوم`) : "لا توجد بيانات بعد", d, lim, go, bad: d == null || d > lim }; });
  C.push({ id: "stale", g: "sec", sev: stale.filter(x => x.bad && (x.k === "att" || x.k === "g")).length ? "m" : stale.some(x => x.bad) ? "l" : "ok", title: "أقسام توقف تحديثها", why: "قسم لم يُحدَّث منذ مدة يعني أن تقاريره ومؤشراته لا تعكس الواقع الحالي.", items: stale.filter(x => x.bad), all: stale });
  // ٦) الموظفون
  const stf = arrv(staff); const badS = stf.filter(x => !x.idHash || !x.role).map(x => ({ k: x.id, t: x.name || "(بلا اسم)", sub: !x.idHash ? "بلا رقم هوية — لا يستطيع الدخول" : "بلا دور محدد" }));
  C.push({ id: "staff", g: "sec", sev: badS.length ? "m" : "ok", title: "إداريون بلا هوية أو دور", why: "لا يستطيع الدخول للبوابة، أو لا تظهر له أقسام دوره.", items: badS, go: "settings", goL: "الإعدادات" });
  return { C, S, classes, at: Date.now(), stale };
}

export function DataHealth({ api, me = {} }) {
  const [D, setD] = useState(null); const [err, setErr] = useState(""); const [open, setOpen] = useState(null); const [g, setG] = useState("");
  const load = async () => { setErr(""); setD(null); try { setD(await scan(api)); } catch (e) { setErr(String(e && e.message || e)); } };
  useEffect(() => { load(); }, []);
  const ignore = async (cid, k) => { await api.maPut(`school-dh-ignore/${cid}/${String(k).replace(/[.#$[\]/]/g, "_")}`, 1); setD(d => ({ ...d, C: d.C.map(c => c.id === cid ? { ...c, items: c.items.filter(x => x.k !== k), sev: c.items.length <= 1 ? "ok" : c.sev } : c) })); };
  if (err) return <Wrap><div className="dh-card">⚠️ تعذّر الفحص: {err} <button className="dh-b" onClick={load}>إعادة</button></div></Wrap>;
  if (!D) return <Wrap><div className="dh-load"><div className="dh-spin" /><b>جارٍ فحص بيانات المدرسة…</b><small>الطلاب • الحضور • الدرجات • النتائج • آخر التحديثات</small></div></Wrap>;
  const C = D.C.map(c => ({ ...c, sev: c.items.length ? c.sev : "ok" }));
  const pen = C.reduce((s, c) => s + SEV[c.sev][3] * (c.sev === "ok" ? 0 : Math.min(1.7, 1 + .35 * Math.log10(Math.max(1, c.items.length)))), 0);
  const score = Math.max(0, Math.round(100 - pen)); const sc = score >= 90 ? "#15803d" : score >= 75 ? "#65a30d" : score >= 55 ? "#d97706" : "#dc2626";
  const G = [["", "الكل"], ["att", "🗓️ الحضور"], ["stu", "🎓 الطلاب"], ["res", "📝 الدرجات والنتائج"], ["sec", "🧭 الأقسام والموظفون"]];
  const L = C.filter(c => !g || c.g === g).sort((a, b) => SEV[b.sev][3] - SEV[a.sev][3]);
  const nIss = C.filter(c => c.sev !== "ok").length;
  return <Wrap>
    <div className="dh-hero">
      <div className="dh-ring" style={{ "--v": score, "--c": sc }}><b>{ar(score)}٪</b><small>صحة البيانات</small></div>
      <div className="dh-ht"><h1>🩺 صحة البيانات</h1><p>دقة التقارير ومؤشر الإنذار المبكر تعتمد على اكتمال البيانات وسلامتها. هنا ما يحتاج تصحيحًا، ولماذا، وأين يُصحَّح.</p>
        <div className="dh-sum">{["h", "m", "l"].map(k => { const n = C.filter(c => c.sev === k).length; return <span key={k} style={{ background: SEV[k][2], color: SEV[k][1] }}>{SEV[k][0]}: {ar(n)}</span>; })}<span style={{ background: "#dcfce7", color: "#15803d" }}>سليم: {ar(C.length - nIss)}</span>
          <span className="dh-mute">{ar(D.S.length)} طالب، {ar(D.classes.length)} فصل، فُحص {new Date(D.at).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}</span></div></div>
      <button className="dh-b gold" onClick={load}>🔄 إعادة الفحص</button></div>
    <div className="dh-tabs">{G.map(([k, l]) => <button key={k} className={g === k ? "on" : ""} onClick={() => setG(k)}>{l}{k && C.filter(c => c.g === k && c.sev !== "ok").length ? <em>{ar(C.filter(c => c.g === k && c.sev !== "ok").length)}</em> : null}</button>)}</div>
    <div className="dh-list">{L.map(c => { const s = SEV[c.sev]; const op = open === c.id;
      return <div key={c.id} className={"dh-it" + (op ? " op" : "")} style={{ "--sc": s[1], "--sb": s[2] }}>
        <button className="dh-ih" onClick={() => setOpen(op ? null : c.id)} aria-expanded={op}>
          <span className="dh-sev">{c.sev === "ok" ? "✓" : ar(c.items.length)}</span>
          <span className="dh-t"><b>{c.title}</b><small>{c.sev === "ok" ? (c.empty || "لا توجد مشكلات") : c.why}</small></span>
          <span className="dh-tag">{s[0]}</span><span className="dh-cv">{op ? "▴" : "▾"}</span></button>
        {op && <div className="dh-body">
          {c.id === "stale" && <div className="dh-stale">{c.all.map(x => <button key={x.k} className={x.bad ? "bad" : ""} onClick={() => x.go && api.go && api.go(x.go)}><b>{x.t}</b><small>{x.sub}</small><i style={{ width: `${x.d == null ? 100 : Math.min(100, x.d / x.lim * 100)}%` }} /></button>)}</div>}
          {c.id !== "stale" && (c.items.length ? <div className="dh-rows">{c.items.slice(0, 200).map(x => <div key={x.k} className="dh-row"><b>{x.t}</b><small>{x.sub}</small>{c.ign && <button className="dh-b sm" onClick={() => ignore(c.id, x.k)} title="راجعتها وهي صحيحة">صحيح، تجاهل</button>}</div>)}{c.items.length > 200 && <small className="dh-mute">و{ar(c.items.length - 200)} أخرى…</small>}</div> : <div className="dh-ok">✔ {c.empty || "لا توجد مشكلات"}</div>)}
          {c.go && api.go && c.items.length > 0 && <button className="dh-b gold" onClick={() => api.go(c.go)}>🛠️ صحّحها في «{c.goL}» ‹</button>}
        </div>}
      </div>; })}</div>
  </Wrap>;
}
const Wrap = ({ children }) => <div className="dh" dir="rtl"><style>{CSS}</style>{children}</div>;
const CSS = `
.dh{font-family:'Cairo','Noto Sans Arabic',Tahoma,sans-serif;color:#0f172a;display:grid;gap:14px;max-width:1100px;margin:0 auto}.dh *{box-sizing:border-box}
.dh-hero{display:flex;gap:18px;align-items:center;flex-wrap:wrap;border-radius:24px;padding:20px;color:#fff;background:radial-gradient(circle at 90% 0%,rgba(201,162,39,.35),transparent 45%),linear-gradient(135deg,${NAVY},#1d3f73);box-shadow:0 16px 36px rgba(11,37,69,.25)}
.dh-ht{flex:1 1 360px}.dh-ht h1{margin:0;font-size:clamp(22px,3vw,30px);font-weight:900}.dh-ht p{margin:4px 0 8px;opacity:.88;font-weight:700;font-size:14px;line-height:1.8}
.dh-ring{width:120px;height:120px;border-radius:50%;flex:none;display:grid;place-content:center;text-align:center;background:radial-gradient(closest-side,#102f57 80%,transparent 81% 100%),conic-gradient(var(--c) calc(var(--v)*1%),rgba(255,255,255,.15) 0)}
.dh-ring b{font-size:30px;font-weight:900;line-height:1}.dh-ring small{font-size:11.5px;opacity:.85;font-weight:800}
.dh-sum{display:flex;gap:6px;flex-wrap:wrap;align-items:center}.dh-sum span{border-radius:99px;padding:2px 11px;font-weight:900;font-size:12.5px}.dh-sum .dh-mute{background:none!important;color:rgba(255,255,255,.75)!important}
.dh-b{border:1.5px solid #cbd5e1;background:#fff;color:${NAVY};border-radius:12px;padding:8px 14px;font:inherit;font-weight:800;font-size:13.5px;cursor:pointer;white-space:nowrap;justify-self:start}
.dh-b.gold{background:linear-gradient(135deg,#e2bc3c,${GOLD});border-color:${GOLD};color:${NAVY}}.dh-b.sm{padding:4px 10px;font-size:12px;margin-inline-start:auto}
.dh-tabs{display:flex;gap:6px;flex-wrap:wrap;background:#fff;border-radius:16px;padding:6px;box-shadow:0 2px 10px rgba(15,23,42,.06)}
.dh-tabs button{flex:1 1 auto;border:0;background:none;border-radius:12px;padding:9px 12px;font:inherit;font-weight:900;font-size:13.5px;color:#475569;cursor:pointer;display:inline-flex;gap:6px;justify-content:center;align-items:center}
.dh-tabs button.on{background:${NAVY};color:#fff;box-shadow:inset 0 -3px 0 ${GOLD}}.dh-tabs em{font-style:normal;background:#dc2626;color:#fff;border-radius:99px;padding:0 7px;font-size:11.5px}
.dh-list{display:grid;gap:10px}
.dh-it{background:#fff;border-radius:16px;border:1px solid #eef2f6;border-inline-start:6px solid var(--sc);box-shadow:0 2px 12px rgba(15,23,42,.06);overflow:hidden}
.dh-ih{width:100%;display:flex;gap:12px;align-items:center;border:0;background:none;padding:12px 14px;font:inherit;text-align:right;cursor:pointer}
.dh-sev{min-width:44px;height:44px;border-radius:14px;display:grid;place-items:center;background:var(--sb);color:var(--sc);font-weight:900;font-size:17px;flex:none}
.dh-t{flex:1;display:grid;gap:2px;min-width:0}.dh-t b{font-size:15px;color:${NAVY}}.dh-t small{color:#64748b;font-weight:700;font-size:12.5px;line-height:1.7}
.dh-tag{background:var(--sb);color:var(--sc);font-weight:900;font-size:12px;border-radius:99px;padding:2px 10px;flex:none}.dh-cv{color:#94a3b8;font-size:14px}
.dh-body{padding:0 14px 14px;display:grid;gap:10px}
.dh-rows{display:grid;gap:4px;max-height:420px;overflow:auto;border:1px solid #f1f5f9;border-radius:12px;padding:6px}
.dh-row{display:flex;gap:10px;align-items:center;flex-wrap:wrap;padding:6px 8px;border-radius:9px}.dh-row:nth-child(odd){background:#f8fafc}.dh-row b{font-size:13.5px}.dh-row small{color:#64748b;font-weight:700;font-size:12.5px}
.dh-ok{background:#f0fdf4;color:#15803d;font-weight:800;border-radius:12px;padding:10px}
.dh-stale{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:8px}
.dh-stale button{position:relative;overflow:hidden;border:1.5px solid #e2e8f0;border-radius:12px;background:#fff;padding:9px 11px 12px;text-align:right;font:inherit;cursor:pointer;display:grid;gap:2px}
.dh-stale button.bad{border-color:#fca5a5;background:#fffafa}.dh-stale b{font-size:13.5px;color:${NAVY}}.dh-stale small{color:#64748b;font-weight:800;font-size:12px}
.dh-stale i{position:absolute;bottom:0;right:0;height:4px;background:#16a34a}.dh-stale .bad i{background:#dc2626}
.dh-mute{color:#64748b;font-weight:700}
.dh-load{min-height:40vh;display:grid;place-content:center;justify-items:center;gap:8px;color:${NAVY}}.dh-load small{color:#64748b;font-weight:800}
.dh-spin{width:42px;height:42px;border-radius:50%;border:5px solid #e2e8f0;border-top-color:${GOLD};animation:dhR 1s linear infinite}@keyframes dhR{to{transform:rotate(360deg)}}
.dh-card{background:#fff;border-radius:16px;padding:16px;font-weight:800}
`;
export default DataHealth;
