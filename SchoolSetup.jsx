// ══════════════════════════════════════════════════════════════════════════════
// ⚙️ إعدادات المدرسة — لوحة واحدة تجعل النظام قابلًا للتشغيل في أي مدرسة دون تعديل الكود
//   الهوية والشعار • المرحلة والفصول • الدوام والحصص • مصفوفة الصلاحيات (أقسام البوابة لكل دور، وصفحات الإدارة)
// قاعدة البيانات:
//   school-profile        { name, short, full, stage, gender, region, office, city, gov, principal, principalShort, ministryNo, logo, roleOff:{role:{tile:1}}, adminOff:{مدير|وكيل:{page:1}}, at, by }
//   school-mattend-meta   { counts:[...], deadline, lateStart }  (قائم — عدد الفصول لكل صف)
//   school-tt-cfg         { times:[[بداية, نهاية]...], work:[بداية الدوام, نهايته] }  (قائم — أوقات الحصص)
// ══════════════════════════════════════════════════════════════════════════════
import React, { useState, useEffect, useMemo, useRef } from "react";

const NAVY = "#0b2545", GOLD = "#c9a227";
const ar = n => String(n ?? "").replace(/\d/g, d => "٠١٢٣٤٥٦٧٨٩"[d]);
const obj = v => (v && typeof v === "object" ? v : {});
const arrv = v => Array.isArray(v) ? v : (v && typeof v === "object" ? Object.values(v) : []);
const ROLES = [["principal", "المدير"], ["deputy", "الوكيل"], ["counselor", "الموجه الطلابي"], ["admin", "الإداري"], ["teacher", "المعلم"]];
const ADMIN_ROLES = [["مدير", "حساب المدير"], ["وكيل", "حساب الوكيل"]];
const STAGES = [["mid", "المتوسطة", 3], ["pri", "الابتدائية", 6], ["sec", "الثانوية", 3]];
const F_ID = [
  ["name", "الاسم الرسمي للمدرسة", "يظهر في الترويسات والتقارير والرسائل", "مدرسة … المتوسطة"],
  ["short", "الاسم المختصر", "يظهر في العناوين القصيرة والقائمة", "مدرسة …"],
  ["full", "الاسم الكامل للمخاطبات الرسمية", "عند الحاجة لاسم أطول (مثل: بن عبدالعزيز)", ""],
  ["region", "إدارة التعليم", "", "الإدارة العامة للتعليم بمحافظة …"],
  ["office", "مكتب التعليم (اختياري)", "", "مكتب التعليم بـ…"],
  ["city", "المدينة", "", ""], ["gov", "المنطقة/المحافظة (للنماذج)", "مثل: مكة المكرمة/جدة", ""],
  ["ministryNo", "الرقم الوزاري (اختياري)", "", ""],
  ["principal", "اسم مدير المدرسة كاملًا", "للتوقيعات والتقارير الرسمية", ""], ["principalShort", "اسم المدير مختصرًا", "يظهر تحت التوقيع", ""],
];
const pad = n => String(n).padStart(2, "0");
const toMin = v => { const m = String(v || "").match(/^(\d{1,2}):(\d{2})/); return m ? +m[1] * 60 + +m[2] : null; };
const hm = m => `${pad(Math.floor(m / 60) % 24)}:${pad(m % 60)}`;

// تصغير الشعار قبل حفظه (حتى لا يُثقل الموقع)
const shrink = (file, max = 360) => new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => { const im = new Image(); im.onload = () => { const k = Math.min(1, max / Math.max(im.width, im.height)); const c = document.createElement("canvas"); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k); const g = c.getContext("2d"); g.drawImage(im, 0, 0, c.width, c.height);
  const png = c.toDataURL("image/png"); res(png.length < 220000 ? png : c.toDataURL("image/jpeg", .85)); }; im.onerror = rej; im.src = fr.result; }; fr.onerror = rej; fr.readAsDataURL(file); });

export function SchoolSetup({ api, me = {}, tiles = [], pages = [], groups = [], PermsPanel = null }) {
  const SP = api.SP;
  const [tab, setTab] = useState("id");
  const [P, setP] = useState(null); const [orig, setOrig] = useState("");
  const [meta, setMeta] = useState(null); const [tt, setTt] = useState(null); const [ros, setRos] = useState({}); const [P0, setP0] = useState(7);
  const [busy, setBusy] = useState(""); const [msg, setMsg] = useState(""); const [hasP, setHasP] = useState(false);
  const fileRef = useRef(null);
  useEffect(() => { (async () => {
    const [p, m, c, r, T] = await Promise.all([api.maGet("school-profile"), api.maGet(api.MA_META), api.maGet(api.TT_CFG), api.maGet(api.MA_ROSTER), api.ttGet().catch(() => null)]);
    const base = { name: SP.name, short: SP.short, full: SP.full, stage: SP.stage, gender: SP.gender, region: SP.region, office: SP.office, city: SP.city, gov: SP.gov, principal: SP.principal, principalShort: SP.principalShort, ministryNo: SP.ministryNo, logo: SP.logo, roleOff: obj(SP.roleOff), adminOff: obj(SP.adminOff), ...obj(p) };
    setP(base); setOrig(JSON.stringify(base));
    const mm = obj(m); const n = (SP.grades || []).length || 3; const counts = Array.from({ length: Math.max(n, arrv(mm.counts).length) }, (_, i) => +arrv(mm.counts)[i] || 0).slice(0, n);
    setMeta({ ...mm, counts }); const cc = obj(c); const np = T && T.P ? T.P : Math.max(arrv(cc.times).length, 7); setP0(np); setHasP(!!(T && T.P));
    setTt({ ...cc, times: Array.from({ length: np }, (_, i) => [...(arrv(cc.times)[i] || ["", ""])]), work: Array.isArray(cc.work) ? cc.work : ["06:30", "13:30"] }); setRos(obj(r));
  })(); }, []);
  const toast = t => { setMsg(t); setTimeout(() => setMsg(""), 3500); };
  if (!P || !meta || !tt) return <div className="ss" dir="rtl"><style>{CSS}</style><div className="ss-load"><div className="ss-spin" /><b>جارٍ تحميل إعدادات المدرسة…</b></div></div>;
  const dirty = JSON.stringify(P) !== orig;
  const stg = STAGES.find(s => s[0] === P.stage) || STAGES[0];
  const grades = (api.STAGES[P.stage] || api.STAGES.mid).g;
  const stuIn = ck => arrv(obj(ros[ck]).students).filter(Boolean).length;
  const saveProfile = async (reload = true) => { setBusy("p"); const v = { ...P, at: Date.now(), by: me.name || "" }; const ok = await api.maPut("school-profile", v); setBusy("");
    if (ok === false) { toast("⚠️ تعذّر الحفظ — تحقق من الاتصال"); return false; }
    try { localStorage.setItem(api.SP_LS, JSON.stringify(v)); } catch {} setOrig(JSON.stringify(P));
    if (reload) { toast("✅ حُفظت إعدادات المدرسة — يُعاد تحميل الموقع لتطبيقها في كل الأقسام…"); setTimeout(() => window.location.reload(), 1400); } return true; };

  // ── الفصول
  const maxSec = i => { const L = Object.keys(ros).filter(ck => ck.startsWith(`${i + 1}-`) && stuIn(ck) > 0).map(ck => +ck.split("-")[1]); return L.length ? Math.max(...L) : 0; };
  const setCount = (i, v) => { const n = Math.max(0, Math.min(20, +v || 0)); const need = maxSec(i); if (n < need) { toast(`⚠️ لا يمكن إنقاص فصول ${grades[i][0]} إلى ${ar(n)}: الفصل ${ar(need)} فيه طلاب. انقلهم أو احذفهم أولًا من «الطلاب».`); return; } const c = [...meta.counts]; c[i] = n; setMeta({ ...meta, counts: c }); };
  const saveMeta = async () => { setBusy("m"); const cur = obj(await api.maGet(api.MA_META)); const ok = await api.maPut(api.MA_META, { ...cur, counts: meta.counts, deadline: meta.deadline || cur.deadline || "", lateStart: meta.lateStart || cur.lateStart || "" }); setBusy(""); toast(ok === false ? "⚠️ تعذّر الحفظ" : "✅ حُفظت الفصول ومواعيد التحضير — تظهر فورًا في الحضور والطلاب"); };
  // ── الحصص
  const tErr = tt.times.map(([a, b], i) => { if (!a && !b) return ""; if (!a || !b) return "أكمل الوقت"; if (toMin(b) <= toMin(a)) return "النهاية قبل البداية"; const pe = i > 0 && tt.times[i - 1][1] ? toMin(tt.times[i - 1][1]) : null; return pe != null && toMin(a) < pe ? "تتداخل مع السابقة" : ""; });
  const setT = (i, j, v) => { const t = tt.times.map(x => [...x]); t[i][j] = v; setTt({ ...tt, times: t }); };
  const autoT = () => { const st = toMin(tt.times[0][0]) ?? 420; const len = +prompt("مدة الحصة بالدقائق؟", "45") || 45; const br = +prompt("مدة الفسحة بالدقائق؟ (بعد الحصة الثالثة)", "25") || 0; let cur = st;
    setTt({ ...tt, times: tt.times.map((_, i) => { const a = cur, b = cur + len; cur = b + (i === 2 ? br : 0); return [hm(a), hm(b)]; }) }); };
  const saveTt = async () => { if (tErr.some(Boolean)) { toast("⚠️ صحّح أوقات الحصص المظللة أولًا"); return; } setBusy("t"); const cur = obj(await api.maGet(api.TT_CFG)); const ok = await api.maPut(api.TT_CFG, { ...cur, times: tt.times, work: tt.work, tAt: Date.now(), tBy: me.name || "" }); setBusy(""); toast(ok === false ? "⚠️ تعذّر الحفظ" : "✅ حُفظت أوقات الدوام والحصص — تظهر في «الحصص الآن» والجدول وبوابة الطلاب"); };
  // ── الصلاحيات
  const togRole = (r, id) => { const o = { ...obj(P.roleOff) }; const m = { ...obj(o[r]) }; if (m[id]) delete m[id]; else m[id] = 1; o[r] = m; setP({ ...P, roleOff: o }); };
  const togAdm = (r, id) => { const o = { ...obj(P.adminOff) }; const m = { ...obj(o[r]) }; if (m[id]) delete m[id]; else m[id] = 1; o[r] = m; setP({ ...P, adminOff: o }); };
  const offCnt = r => Object.keys(obj(obj(P.roleOff)[r])).length; const admCnt = r => Object.keys(obj(obj(P.adminOff)[r])).length;

  const Field = ([k, l, h, ph]) => <label key={k} className="ss-f"><span>{l}</span><input className="ss-in" value={P[k] || ""} placeholder={ph || ""} onChange={e => setP({ ...P, [k]: e.target.value })} />{h && <small>{h}</small>}</label>;
  const logo = P.logo || api.defLogo;
  return <div className="ss" dir="rtl"><style>{CSS}</style>
    <div className="ss-hero"><div><span className="ss-badge">لوحة واحدة</span><h1>⚙️ إعدادات المدرسة</h1><p>هوية المدرسة وشعارها، والمرحلة والفصول، والدوام والحصص، ومن يرى ماذا. كل ما يُحفظ هنا يظهر في كل أقسام الموقع والتقارير المطبوعة دون تعديل الكود.</p></div>
      <div className="ss-idc"><img src={logo} alt="" /><div><b>{P.name}</b><small>{P.region}</small></div></div></div>
    <div className="ss-tabs" role="tablist">{[["id", "🏫 الهوية والشعار"], ["cls", "🎓 المرحلة والفصول"], ["tt", "⏰ الدوام والحصص"], ["perm", "🔐 مصفوفة الصلاحيات"]].map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{l}</button>)}</div>
    {msg && <div className="ss-toast">{msg}</div>}

    {tab === "id" && <div className="ss-grid">
      <div className="ss-card"><h3>🏫 بيانات المدرسة</h3>
        <div className="ss-fs">{F_ID.slice(0, 3).map(Field)}</div>
        <div className="ss-fs"><label className="ss-f"><span>المرحلة</span><select className="ss-in" value={P.stage} onChange={e => setP({ ...P, stage: e.target.value })}>{STAGES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select><small>تحدد أسماء الصفوف (أول متوسط، أول ابتدائي…)</small></label>
          <label className="ss-f"><span>بنين / بنات</span><select className="ss-in" value={P.gender || "بنين"} onChange={e => setP({ ...P, gender: e.target.value })}><option>بنين</option><option>بنات</option></select></label></div>
        {P.stage !== SP.stage && <div className="ss-warn">⚠️ تغيير المرحلة يغيّر أسماء الصفوف وعددها في الحضور والطلاب. بعض الأقسام صُممت للمرحلة المتوسطة (مثل مراجع نافس للثالث المتوسط) وتحتاج مراجعة عند التشغيل في مرحلة أخرى. عدّل عدد الفصول من تبويب «المرحلة والفصول» بعد الحفظ.</div>}
        <div className="ss-fs">{F_ID.slice(3, 8).map(Field)}</div>
        <div className="ss-fs">{F_ID.slice(8).map(Field)}</div>
      </div>
      <div className="ss-card"><h3>🖼️ شعار المدرسة</h3>
        <div className="ss-logo"><img src={logo} alt="شعار المدرسة" /><div><button className="ss-b" onClick={() => fileRef.current && fileRef.current.click()}>📤 رفع شعار جديد</button>{P.logo && <button className="ss-b" onClick={() => setP({ ...P, logo: "" })}>↺ الشعار الافتراضي</button>}<small>PNG أو JPG بخلفية شفافة أو بيضاء. يُصغَّر تلقائيًا.</small></div>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={async e => { const f = e.target.files && e.target.files[0]; e.target.value = ""; if (!f) return; try { const d = await shrink(f); setP(p => ({ ...p, logo: d })); } catch { toast("⚠️ تعذّرت قراءة الصورة"); } }} /></div>
        <h3 style={{ marginTop: 16 }}>👁️ معاينة الترويسة المطبوعة</h3>
        <div className="ss-prev"><div className="ss-prev-h"><div className="r"><b>المملكة العربية السعودية</b><span>وزارة التعليم</span><span>{P.region}</span>{P.office && <span>{P.office}</span>}<span>{P.name}</span></div><img src={api.moeLogo} alt="" /><img src={logo} alt="" /></div>
          <div className="ss-prev-t">عنوان التقرير</div><div className="ss-prev-s"><div>الموجه الطلابي</div><div>وكيل شؤون الطلاب</div><div>مدير المدرسة<br /><b>{P.principalShort || P.principal}</b></div></div></div>
      </div>
      <div className="ss-bar"><span>{dirty ? "● توجد تغييرات لم تُحفظ" : "✓ محفوظ"}</span><button className="ss-b gold" disabled={!dirty || busy === "p"} onClick={() => saveProfile(true)}>{busy === "p" ? "⏳ جارٍ الحفظ…" : "💾 حفظ وتطبيق على الموقع"}</button></div>
    </div>}

    {tab === "cls" && <div className="ss-card">
      <h3>🎓 الصفوف والفصول — المرحلة {stg[1]}</h3>
      <p className="ss-muted">عدد الفصول لكل صف هو ما يظهر في التحضير والحضور وقوائم الطلاب وجداول الحصص. لا يمكن إنقاص فصل فيه طلاب.</p>
      <div className="ss-grades">{grades.map(([gn, gs], i) => <div key={i} className="ss-gr">
        <div className="ss-gr-h"><b>{gn}</b><div className="ss-num"><button onClick={() => setCount(i, (meta.counts[i] || 0) - 1)} aria-label="إنقاص">−</button><input inputMode="numeric" value={ar(meta.counts[i] || 0)} onChange={e => setCount(i, String(e.target.value).replace(/[٠-٩]/g, d => "٠١٢٣٤٥٦٧٨٩".indexOf(d)))} /><button onClick={() => setCount(i, (meta.counts[i] || 0) + 1)} aria-label="زيادة">+</button></div></div>
        <div className="ss-chips">{Array.from({ length: meta.counts[i] || 0 }, (_, k) => { const ck = `${i + 1}-${k + 1}`; const n = stuIn(ck); return <span key={ck} className={n ? "has" : ""}>{gs} {(api.STAGES[P.stage] || api.STAGES.mid).w} / {ar(k + 1)}<em>{n ? `${ar(n)} طالب` : "فارغ"}</em></span>; })}{!(meta.counts[i]) && <small className="ss-muted">لا توجد فصول</small>}</div>
      </div>)}</div>
      <h3 style={{ marginTop: 16 }}>⏱️ مواعيد التحضير اليومي</h3>
      <div className="ss-fs"><label className="ss-f"><span>آخر موعد لرصد الغياب</span><input type="time" className="ss-in" value={meta.deadline || ""} onChange={e => setMeta({ ...meta, deadline: e.target.value })} /><small>بعده يظهر الفصل «متأخر في الرصد»</small></label>
        <label className="ss-f"><span>بداية احتساب التأخر الصباحي</span><input type="time" className="ss-in" value={meta.lateStart || ""} onChange={e => setMeta({ ...meta, lateStart: e.target.value })} /></label></div>
      <div className="ss-bar"><span className="ss-muted">مجموع الفصول: {ar(meta.counts.reduce((a, b) => a + (+b || 0), 0))}</span><button className="ss-b gold" disabled={busy === "m"} onClick={saveMeta}>{busy === "m" ? "⏳…" : "💾 حفظ الفصول والمواعيد"}</button></div>
    </div>}

    {tab === "tt" && <div className="ss-card">
      <h3>⏰ الدوام الرسمي</h3>
      <div className="ss-fs"><label className="ss-f"><span>بداية الدوام</span><input type="time" className="ss-in" value={tt.work[0] || ""} onChange={e => setTt({ ...tt, work: [e.target.value, tt.work[1]] })} /></label><label className="ss-f"><span>نهاية الدوام</span><input type="time" className="ss-in" value={tt.work[1] || ""} onChange={e => setTt({ ...tt, work: [tt.work[0], e.target.value] })} /></label></div>
      <div className="ss-flt"><h3 style={{ margin: 0, flex: 1 }}>🔔 أوقات الحصص ({ar(tt.times.length)})</h3><button className="ss-b" onClick={autoT}>⚡ توزيع تلقائي من بداية الحصة الأولى</button>
        {!hasP && <><button className="ss-b" onClick={() => setTt({ ...tt, times: [...tt.times, ["", ""]] })}>＋ حصة</button>{tt.times.length > 1 && <button className="ss-b" onClick={() => setTt({ ...tt, times: tt.times.slice(0, -1) })}>− حصة</button>}</>}</div>
      {hasP && <p className="ss-muted">عدد الحصص ({ar(P0)}) مأخوذ من الجدول المدرسي المعتمد.</p>}
      <div className="ss-times">{tt.times.map(([a, b], i) => <div key={i} className={"ss-tr" + (tErr[i] ? " err" : "")}><b>الحصة {ar(i + 1)}</b><input type="time" className="ss-in" value={a || ""} onChange={e => setT(i, 0, e.target.value)} /><span>إلى</span><input type="time" className="ss-in" value={b || ""} onChange={e => setT(i, 1, e.target.value)} /><small>{tErr[i] || (a && b ? `${ar(toMin(b) - toMin(a))} دقيقة` : "")}</small></div>)}</div>
      <div className="ss-bar"><span className="ss-muted">تُطبَّق على «الحصص الآن» وشاشة العرض والجدول وبوابة الطلاب.</span><button className="ss-b gold" disabled={busy === "t"} onClick={saveTt}>{busy === "t" ? "⏳…" : "💾 حفظ الدوام والحصص"}</button></div>
    </div>}

    {tab === "perm" && <>
      <div className="ss-card"><h3>🔐 أقسام بوابة الموظفين لكل دور</h3>
        <p className="ss-muted">ألغِ تحديد القسم ليختفي عن هذا الدور في البوابة، ولا يُفتح حتى من رابط مباشر. هذه المصفوفة تُخفي فقط؛ ما لا يملكه الدور أصلًا لا يظهر له حتى لو كان محددًا.</p>
        <div className="ss-tw"><table className="ss-mx"><thead><tr><th className="r">القسم</th>{ROLES.map(([r, l]) => <th key={r}>{l}<small>{offCnt(r) ? `${ar(offCnt(r))} مخفي` : "الكل"}</small></th>)}</tr></thead>
          <tbody>{tiles.map(([id, ic, t]) => <tr key={id}><td className="r">{ic} {t}</td>{ROLES.map(([r]) => { const on = !obj(obj(P.roleOff)[r])[id]; return <td key={r}><button className={"ss-ck" + (on ? " on" : "")} onClick={() => togRole(r, id)} aria-label={`${t} — ${r}`}>{on ? "✓" : ""}</button></td>; })}</tr>)}</tbody></table></div>
      </div>
      <div className="ss-card"><h3>🖥️ صفحات حساب الإدارة</h3>
        <p className="ss-muted">الصفحات غير المحددة تختفي من قائمة هذا الحساب ولا تُفتح له.</p>
        <div className="ss-tw"><table className="ss-mx"><thead><tr><th className="r">الصفحة</th>{ADMIN_ROLES.map(([r, l]) => <th key={r}>{l}<small>{admCnt(r) ? `${ar(admCnt(r))} مخفية` : "الكل"}</small></th>)}</tr></thead>
          <tbody>{groups.map(g => <React.Fragment key={g.title}><tr className="ss-gh"><td colSpan={ADMIN_ROLES.length + 1}>{g.icon} {g.title}</td></tr>
            {g.ids.map(id => pages.find(p => p.id === id)).filter(Boolean).map(p => <tr key={p.id}><td className="r">{p.icon} {p.label}</td>{ADMIN_ROLES.map(([r]) => { const on = !obj(obj(P.adminOff)[r])[p.id]; const lock = r === "مدير" && (p.id === "settings" || p.id === "schoolsetup"); return <td key={r}><button className={"ss-ck" + (on ? " on" : "")} disabled={lock} title={lock ? "لا يمكن إخفاؤها عن المدير" : ""} onClick={() => togAdm(r, p.id)}>{on ? "✓" : ""}</button></td>; })}</tr>)}</React.Fragment>)}</tbody></table></div>
      </div>
      <div className="ss-bar sticky"><span>{dirty ? "● توجد تغييرات لم تُحفظ" : "✓ محفوظ"}</span><button className="ss-b gold" disabled={!dirty || busy === "p"} onClick={() => saveProfile(true)}>{busy === "p" ? "⏳…" : "💾 حفظ الصلاحيات"}</button></div>
      {PermsPanel && <div className="ss-card"><h3>👤 صلاحيات الأفراد (الإداريون والمرشدون)</h3><p className="ss-muted">لكل شخص على حدة، فوق صلاحيات دوره.</p><PermsPanel /></div>}
    </>}
  </div>;
}

const CSS = `
.ss{font-family:'Cairo','Noto Sans Arabic',Tahoma,sans-serif;color:#0f172a;display:grid;gap:14px;max-width:1200px;margin:0 auto}
.ss *{box-sizing:border-box}
.ss-hero{border-radius:24px;padding:20px 22px;color:#fff;display:flex;gap:16px;align-items:center;flex-wrap:wrap;background:radial-gradient(circle at 10% 0%,rgba(201,162,39,.35),transparent 45%),linear-gradient(135deg,${NAVY},#1d3f73);box-shadow:0 16px 36px rgba(11,37,69,.25)}
.ss-hero>div:first-child{flex:1 1 380px}.ss-hero h1{margin:4px 0;font-size:clamp(22px,3vw,30px);font-weight:900}.ss-hero p{margin:0;opacity:.88;font-weight:700;font-size:14px;line-height:1.8}
.ss-badge{display:inline-block;background:${GOLD};color:${NAVY};font-weight:900;font-size:12px;border-radius:99px;padding:2px 12px}
.ss-idc{display:flex;gap:12px;align-items:center;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);border-radius:18px;padding:10px 14px;max-width:420px}
.ss-idc img{width:58px;height:58px;border-radius:50%;background:#fff;padding:3px;object-fit:contain;box-shadow:0 0 0 3px ${GOLD}}.ss-idc b{display:block;font-size:15px}.ss-idc small{opacity:.85;font-weight:700;font-size:12px}
.ss-tabs{display:flex;gap:6px;flex-wrap:wrap;background:#fff;border-radius:16px;padding:6px;box-shadow:0 2px 10px rgba(15,23,42,.06)}
.ss-tabs button{flex:1 1 auto;border:0;background:none;border-radius:12px;padding:10px 14px;font:inherit;font-weight:900;font-size:14px;color:#475569;cursor:pointer}
.ss-tabs button.on{background:${NAVY};color:#fff;box-shadow:inset 0 -3px 0 ${GOLD}}
.ss-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,480px),1fr));gap:14px}
.ss-card{background:#fff;border-radius:18px;padding:16px;box-shadow:0 2px 14px rgba(15,23,42,.07);border:1px solid #eef2f6;min-width:0}
.ss-card h3{margin:0 0 10px;font-size:16px;color:${NAVY};font-weight:900}
.ss-fs{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px;margin-bottom:10px}
.ss-f{display:grid;gap:4px;align-content:start;font-weight:800;font-size:13px;color:#334155}.ss-f small{color:#64748b;font-weight:700;font-size:11.5px}
.ss-in{border:1.5px solid #cbd5e1;border-radius:12px;padding:9px 11px;font:inherit;font-weight:700;font-size:14px;background:#fff;color:#0f172a;width:100%;min-width:0}
.ss-in:focus{outline:none;border-color:${NAVY};box-shadow:0 0 0 3px rgba(11,37,69,.12)}
.ss-b{border:1.5px solid #cbd5e1;background:#fff;color:${NAVY};border-radius:12px;padding:8px 14px;font:inherit;font-weight:800;font-size:13.5px;cursor:pointer;white-space:nowrap}
.ss-b:hover{border-color:${NAVY}}.ss-b:disabled{opacity:.5;cursor:default}
.ss-b.gold{background:linear-gradient(135deg,#e2bc3c,${GOLD});border-color:${GOLD};color:${NAVY};box-shadow:0 4px 12px rgba(201,162,39,.35)}
.ss-muted{color:#64748b;font-weight:700;font-size:13px;margin:0 0 10px}
.ss-warn{background:#fffbeb;border:1px solid #fde68a;color:#92400e;border-radius:12px;padding:8px 12px;font-weight:800;font-size:13px;margin-bottom:10px;line-height:1.8}
.ss-logo{display:flex;gap:16px;align-items:center;flex-wrap:wrap}.ss-logo img{width:120px;height:120px;border-radius:50%;object-fit:contain;background:#fff;box-shadow:0 0 0 4px ${GOLD},0 10px 24px rgba(0,0,0,.15);padding:6px}
.ss-logo>div{display:grid;gap:6px}.ss-logo small{color:#64748b;font-weight:700}
.ss-prev{border:1.5px solid #e2e8f0;border-radius:12px;padding:12px;background:#fff}
.ss-prev-h{display:flex;align-items:center;gap:10px;border-bottom:3px solid ${GOLD};padding-bottom:8px}.ss-prev-h .r{flex:1;display:grid;font-size:11.5px;font-weight:800;color:#334155;line-height:1.6}.ss-prev-h .r b{color:${NAVY}}.ss-prev-h img{height:50px;max-width:80px;object-fit:contain}
.ss-prev-t{text-align:center;font-weight:900;color:${NAVY};font-size:16px;margin:16px 0}
.ss-prev-s{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;text-align:center;font-weight:800;font-size:11.5px;color:#334155}.ss-prev-s div{border-top:1.5px solid #94a3b8;padding-top:5px}
.ss-bar{grid-column:1/-1;display:flex;gap:10px;align-items:center;justify-content:space-between;background:#fff;border-radius:16px;padding:10px 14px;box-shadow:0 2px 14px rgba(15,23,42,.07);border:1px solid #eef2f6;margin-top:12px;font-weight:800;color:#475569;flex-wrap:wrap}
.ss-bar.sticky{position:sticky;bottom:8px;z-index:3;margin-top:0}
.ss-grades{display:grid;gap:10px}
.ss-gr{border:1.5px solid #e2e8f0;border-radius:14px;padding:10px 12px}
.ss-gr-h{display:flex;align-items:center;gap:10px;margin-bottom:8px}.ss-gr-h b{flex:1;color:${NAVY};font-size:15px}
.ss-num{display:flex;align-items:center;border:1.5px solid #cbd5e1;border-radius:12px;overflow:hidden}.ss-num button{border:0;background:#f1f5f9;width:36px;height:36px;font-size:18px;font-weight:900;cursor:pointer;color:${NAVY}}.ss-num input{width:46px;border:0;text-align:center;font:inherit;font-weight:900;font-size:16px}
.ss-chips{display:flex;flex-wrap:wrap;gap:6px}.ss-chips span{border:1px dashed #cbd5e1;border-radius:10px;padding:4px 10px;font-weight:800;font-size:12.5px;display:grid;background:#f8fafc}.ss-chips span.has{border-style:solid;border-color:#86efac;background:#f0fdf4}.ss-chips em{font-style:normal;font-size:11px;color:#64748b}
.ss-flt{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:6px 0 10px}
.ss-times{display:grid;gap:6px}
.ss-tr{display:grid;grid-template-columns:90px minmax(0,140px) auto minmax(0,140px) 1fr;gap:8px;align-items:center;padding:6px 8px;border-radius:12px;background:#f8fafc}
.ss-tr b{color:${NAVY}}.ss-tr small{color:#64748b;font-weight:800}.ss-tr.err{background:#fef2f2}.ss-tr.err small{color:#b91c1c}
.ss-tw{overflow:auto;max-height:70vh;border:1px solid #eef2f6;border-radius:12px}
.ss-mx{width:100%;border-collapse:separate;border-spacing:0;font-size:13.5px}
.ss-mx th{position:sticky;top:0;background:#f8fafc;color:${NAVY};font-weight:900;padding:8px;border-bottom:2px solid ${GOLD};text-align:center;z-index:1}.ss-mx th small{display:block;font-size:11px;color:#64748b}
.ss-mx td{padding:5px 8px;border-bottom:1px solid #f1f5f9;text-align:center}.ss-mx .r{text-align:right;font-weight:700}
.ss-mx tr:hover td{background:#fafcff}.ss-gh td{background:#f1f5f9;font-weight:900;color:${NAVY};text-align:right}
.ss-ck{width:30px;height:30px;border-radius:9px;border:2px solid #cbd5e1;background:#fff;font-weight:900;color:#fff;cursor:pointer}.ss-ck.on{background:#16a34a;border-color:#16a34a}.ss-ck:disabled{opacity:.5;cursor:not-allowed}
.ss-toast{position:fixed;bottom:22px;left:50%;transform:translateX(-50%);background:${NAVY};color:#fff;font-weight:800;padding:10px 18px;border-radius:14px;z-index:4000;box-shadow:0 10px 30px rgba(0,0,0,.3);border-bottom:3px solid ${GOLD};max-width:92vw}
.ss-load{min-height:40vh;display:grid;place-content:center;justify-items:center;gap:8px;color:${NAVY}}
.ss-spin{width:42px;height:42px;border-radius:50%;border:5px solid #e2e8f0;border-top-color:${GOLD};animation:ssR 1s linear infinite}@keyframes ssR{to{transform:rotate(360deg)}}
@media(max-width:600px){.ss-tr{grid-template-columns:70px 1fr auto 1fr}.ss-tr small{grid-column:1/-1}}
`;
export default SchoolSetup;
