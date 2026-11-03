// ⏰ التذكيرات المجدولة (ملاحظة: off في مهام الإشراف تعني «من الجدول الرسمي» وليست «معطّلة») — يستدعيه GitHub Actions كل ٥ دقائق خلال الدوام (.github/workflows/school-cron.yml)
// • ملخص الصباح: مهام الإشراف والمناوبة وحصص الانتظار لكل معلم
// • قبل البداية بـ ١٥ دقيقة: تذكير بالإشراف/المناوبة وبحصة الانتظار
// • كل تذكير يُرسل مرة واحدة فقط: school-push-sent/{يوم}/{مفتاح}
// • الإعدادات (اختيارية): school-push-cfg = {off, morning, duty, sub, lead, mornAt}
const { sendTo, fbGet, fbPatch, ksa } = require("./_pushcore.js");
const DU_TY = { morn: ["الإشراف الصباحي", "06:40"], brk: ["إشراف الفسحة", "09:15"], pray: ["إشراف الصلاة", "11:50"], end: ["مناوبة نهاية الدوام", "12:35"], oth: ["مهمة إشراف", ""], mon: ["المناوبة اليومية", "06:30"] };
const DEF_TIMES = [["07:00", "07:45"], ["07:45", "08:30"], ["08:30", "09:15"], ["09:35", "10:20"], ["10:20", "11:05"], ["11:25", "12:10"], ["12:10", "12:55"], ["12:55", "13:40"]];
const ORD = ["الأولى", "الثانية", "الثالثة", "الرابعة", "الخامسة", "السادسة", "السابعة", "الثامنة"];
const ar = n => String(n ?? "").replace(/\d/g, d => "٠١٢٣٤٥٦٧٨٩"[d]);
const toMin = t => { const m = String(t || "").match(/^(\d{1,2}):(\d{2})/); return m ? +m[1] * 60 + +m[2] : null; };
const fmt = t => { const m = toMin(t); if (m == null) return ""; const h = Math.floor(m / 60), mm = m % 60; return ar(`${((h + 11) % 12) + 1}:${String(mm).padStart(2, "0")}`) + (h < 12 ? " ص" : " م"); };
const cls = ck => { const [g, c] = String(ck || "").split("-"); return g && c ? `${ar(c)}/${ar(g)}` : String(ck || ""); };
const arr = v => Array.isArray(v) ? v : v && typeof v === "object" ? Object.values(v) : [];
const days = v => arr(v).filter(x => x !== null && x !== "").map(Number);

module.exports = async function handler(req, res) {
  if (process.env.CRON_KEY && (req.query || {}).key !== process.env.CRON_KEY) return res.status(401).json({ ok: false });
  try {
    const now = ksa(), day = now.slice(0, 10), nowM = toMin(now.slice(11, 16)), wd = new Date(day + "T12:00:00Z").getUTCDay();
    if (wd > 4) return res.status(200).json({ ok: true, skip: "weekend" });
    const [cfg0, duty, log, ttc, sentD, hdc, cvp, pxp] = await Promise.all([fbGet("school-push-cfg"), fbGet("school-duty"), fbGet(`school-ttlog/${day}`), fbGet("school-tt-cfg"), fbGet(`school-push-sent/${day}`), fbGet("school-hd-cfg"), fbGet("school-cv-plan"), fbGet("school-px/plan")]);
    // يوم دوام عن بعد (من صفحة «حضوري»): لا تذكير بالإشراف والمناوبة والزيارات
    const remD = ((hdc && hdc.rem) || {})[day]; const remote = !!remD;
    // التحضير بالحصص عن بعد: حصص اليوم (يحفظها الموقع عند تحديد اليوم) + مدة الحصة + ما حُضّر
    const [rplan, rcfg, ratt] = remote ? await Promise.all([fbGet(`school-rmt/plan/${day}`), fbGet("school-rmt/cfg"), fbGet(`school-rmt/att/${day}`)]) : [null, null, null];
    const C = { morning: true, duty: true, sub: true, lead: 15, mornAt: "06:05", ...(cfg0 || {}) };
    if (C.off) return res.status(200).json({ ok: true, skip: "off" });
    const D = duty || {}; if ((D.H || {})[day]) return res.status(200).json({ ok: true, skip: "holiday" });
    const times = ttc && Array.isArray(ttc.times) && ttc.times.length ? ttc.times : DEF_TIMES;
    const sent = sentD || {}; const mark = {}; const out = [];
    const once = async (key, fn) => { if (sent[key] || mark[key]) return; mark[`school-push-sent/${day}/${key}`] = 1; mark[key] = 1; out.push([key, await fn()]); };
    // مهام الإشراف اليوم
    const slots = arr(D.S).filter(s => s && days(s.d).includes(wd)).map(s => { const T = DU_TY[s.ty] || DU_TY.oth; return { id: s.id, l: s.lbl || T[0], f: s.f || T[1], pl: s.pl || "", tn: arr(s.tn) }; });
    if (remote) slots.length = 0;
    const mon = remote ? null : (D.M || {})[day]; if (mon) slots.push({ id: "mon", l: "المناوبة اليومية", f: (D.cfg && D.cfg.monF) || "06:30", pl: "", tn: [mon] });
    // الزيارات الصفية وتبادل الزيارات اليوم
    const hm = t => { const m = String(t || "").match(/(\d{1,2}):(\d{2})/); if (!m) return ""; let h = +m[1]; if (h < 6) h += 12; return `${String(h).padStart(2, "0")}:${m[2]}`; };
    const visits = [];
    if (!remote) {
      arr(cvp).forEach(v => { if (!v || v.date !== day || !v.t || v.done || v.ev) return; visits.push({ id: "cv" + v.id, names: [v.t], l: "🎯 زيارة صفية لحصتك", f: hm(v.tm), d: `${v.p ? "الحصة " + v.p : ""}${v.c ? " • فصل " + v.c : ""}` }); });
      arr(pxp).forEach(v => { if (!v || v.date !== day || !v.host) return; const f = times[v.p] ? times[v.p][0] : ""; const per = `الحصة ${ORD[v.p] || ar(+v.p + 1)}${v.ck ? " • فصل " + cls(v.ck) : ""}`;
        visits.push({ id: "pxh" + v.id, names: [v.host.n], l: "🤝 يزور حصتك زملاء", f, d: `${per} • ${arr(v.vis).map(x => x.n).join("، ")}` });
        const vn = arr(v.vis).map(x => x.n).filter(Boolean); if (vn.length) visits.push({ id: "pxv" + v.id, names: vn, l: "🤝 زيارة تبادلية لحصة أ. " + v.host.n, f, d: per }); });
    }
    // عن بعد: لا تنبيهات احتياط
    const subs = remote ? [] : Object.entries(log || {}).filter(([, v]) => v && v.st === "sub" && v.sub != null && v.sub !== "" && !v.pm).map(([k, v]) => { const [, p, ck] = k.split("_"); return { k, p: +p, ck, ti: +v.sub }; });
    // ① ملخص الصباح (مرة واحدة)
    if (C.morning && nowM >= toMin(C.mornAt) && nowM < toMin(C.mornAt) + 120) await once("morning", async () => {
      const by = {}; slots.forEach(s => s.tn.forEach(n => { (by[n] = by[n] || []).push(`${s.l} ${fmt(s.f)}${s.pl ? " (" + s.pl + ")" : ""}`); }));
      visits.forEach(v => v.names.forEach(n => { (by[n] = by[n] || []).push(`${v.l}${v.f ? " " + fmt(v.f) : ""}${v.d ? " (" + v.d + ")" : ""}`); }));
      let n = 0; for (const [name, L] of Object.entries(by)) { const r = await sendTo({ names: [name] }, { title: "📋 مهامك اليوم", body: L.join(" • "), url: "/#teacher:duty", urlA: "/#staff:duty", tag: "morning-duty" }); n += (r && r.sent) || 0; }
      const bt = {}; subs.forEach(s => { (bt[s.ti] = bt[s.ti] || []).push(`الحصة ${ORD[s.p] || ar(s.p + 1)} ${cls(s.ck)}`); });
      for (const [ti, L] of Object.entries(bt)) { const r = await sendTo({ ti: [+ti] }, { title: "🛡️ حصص الانتظار المسندة إليك اليوم", body: L.join(" • "), url: "/#teacher:sched", urlA: "/#staff:tt", tag: "morning-sub" }); n += (r && r.sent) || 0; }
      return n;
    });
    // ② قبل بداية الإشراف بدقائق
    if (C.duty) for (const s of slots) { const st = toMin(s.f); if (st == null || !s.tn.length) continue; const left = st - nowM;
      if (left > 0 && left <= C.lead) await once("du-" + s.id + "-" + String(s.f).replace(":", ""), () => sendTo({ names: s.tn }, { title: `⏰ ${s.l} الساعة ${fmt(s.f)}`, body: `${s.pl ? "المكان: " + s.pl + " • " : ""}بعد ${ar(left)} دقيقة`, url: "/#teacher:duty", urlA: "/#staff:duty", tag: "du-" + s.id, urgent: 1 })); }
    // ②ب قبل الزيارات بدقائق
    for (const v of visits) { const st = toMin(v.f); if (st == null) continue; const left = st - nowM;
      if (left > 0 && left <= C.lead) await once("vi-" + v.id + "-" + String(v.f).replace(":", ""), () => sendTo({ names: v.names }, { title: `⏰ ${v.l} الساعة ${fmt(v.f)}`, body: `${v.d ? v.d + " • " : ""}بعد ${ar(left)} دقيقة`, url: "/#teacher", tag: "vi-" + v.id, urgent: 1 })); }
    // ③ قبل حصة الانتظار بدقائق
    if (C.sub) for (const s of subs) { const st = toMin(times[s.p] && times[s.p][0]); if (st == null) continue; const left = st - nowM;
      if (left > 0 && left <= C.lead) await once("sb-" + s.k, () => sendTo({ ti: [s.ti] }, { title: `⏰ حصة انتظار الساعة ${fmt(times[s.p][0])}`, body: `الحصة ${ORD[s.p] || ar(s.p + 1)} — فصل ${cls(s.ck)} • بعد ${ar(left)} دقيقة`, url: "/#teacher:sched", urlA: "/#staff:tt", tag: "sb-" + s.k, urgent: 1 })); }
    // ④ الدوام عن بعد: تذكير المعلم عند بداية حصته بتحضير طلابه، وتنبيه بعد نهايتها إن لم يحضّر
    if (remote && rplan) { const L0 = Math.max(10, +(rcfg || {}).len || 35), G0 = Math.max(0, +(rcfg || {}).gap || 0), S0 = toMin(remD.s || "07:30") ?? 450;
      const rt = p => [S0 + p * (L0 + G0), S0 + p * (L0 + G0) + L0]; const hm2 = m => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
      const les = Object.values(rplan).filter(Boolean).map(L => { const g = (log || {})[`${L.di}_${L.p}_${L.ck}`]; return g && g.st === "sub" && g.sub != null && g.sub !== "" && !g.pm ? { ...L, ti: +g.sub, tn: "" } : L; });
      const grp = (arr2) => { const o = {}; arr2.forEach(L => { const k = L.ti >= 0 ? "t" + L.ti : "n" + L.tn; (o[k] = o[k] || []).push(L); }); return Object.values(o); };
      const ps = [...new Set(les.map(L => +L.p))];
      for (const p of ps) { const [a, b] = rt(p); const atP = les.filter(L => +L.p === p);
        if (nowM >= a - 3 && nowM < a + 5) for (const G of grp(atP)) { const L = G[0]; await once(`rp-${p}-${L.ti >= 0 ? L.ti : L.tn}`, () => sendTo({ ti: L.ti >= 0 ? [L.ti] : [], names: L.tn ? [L.tn] : [] }, { title: `📋 حضّر طلاب الحصة ${ORD[p] || ar(p + 1)}`, body: `${G.map(x => "فصل " + cls(x.ck) + (x.s ? " • " + x.s : "")).join(" ، ")} • ${fmt(hm2(a))}–${fmt(hm2(b))}`, url: "/#teacher", tag: "rp-" + p, urgent: 1 })); }
        if (nowM >= b + 5 && nowM < b + 15) { const miss = atP.filter(L => !(((ratt || {})[L.ck] || {})["p" + p] || {}).at); for (const G of grp(miss)) { const L = G[0]; await once(`rm-${p}-${L.ti >= 0 ? L.ti : L.tn}`, () => sendTo({ ti: L.ti >= 0 ? [L.ti] : [], names: L.tn ? [L.tn] : [] }, { title: `⚠️ لم تُحضّر الحصة ${ORD[p] || ar(p + 1)}`, body: G.map(x => "فصل " + cls(x.ck)).join(" ، ") + " — افتح بوابة المعلم وحضّرها الآن", url: "/#teacher", tag: "rm-" + p, urgent: 1 })); } } } }
    // ⑤ ملخص الأسبوع للقائد — الخميس بعد ١٢:٢٠ (مرة واحدة)
    if (wd === 4 && nowM >= 740 && nowM < 860) await once("weekly", async () => {
      const dayK = (n) => { const d = new Date(day + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
      const W = [-4, -3, -2, -1, 0].map(dayK), P = [-11, -10, -9, -8, -7].map(dayK);
      const [ix, ixP, hd, far, staff, ...lgs] = await Promise.all([Promise.all(W.map(k => fbGet(`school-mattend-index/${k}`))), Promise.all(P.map(k => fbGet(`school-mattend-index/${k}`))), fbGet("school-hd"), fbGet("school-hd-faris"), fbGet("school-staff2"), ...W.map(k => fbGet(`school-ttlog/${k}`))]);
      const sAbs = L => L.reduce((t, x) => t + (+((x || {}).absent) || 0), 0); const a1 = sAbs(ix), a0 = sAbs(ixP);
      let tAbs = 0, fPend = 0; Object.entries(hd || {}).forEach(([hk, r]) => Object.entries(r || {}).forEach(([dk, x]) => { if (!W.includes(dk) || !x || x.void) return; const ab = x.fx === "abs" || (/غياب/.test(String(x.st || "")) && x.ph !== "m") || (x.rm && !x.a && !/استئذان|مهمة|انتداب|إجازة|اجازة/.test(String(x.st || "")) && !x.fx); if (ab) { tAbs++; if (!(((far || {})[hk] || {})[dk] || {}).at) fPend++; } }));
      let nL = 0, nA = 0; lgs.forEach(o => Object.values(o || {}).forEach(v => { if (v && v.st === "late") nL++; if (v && v.st === "absent") nA++; }));
      const pr = Object.values(staff || {}).filter(x => x && x.role === "principal").map(x => x.name).filter(Boolean);
      const tr = a0 ? (a1 > a0 ? `↑ ${ar(Math.round((a1 - a0) / a0 * 100))}٪` : a1 < a0 ? `↓ ${ar(Math.round((a0 - a1) / a0 * 100))}٪` : "=") : "";
      const body = `غياب الطلاب ${ar(a1)}${tr ? ` (${tr} عن الأسبوع الماضي)` : ""} • غياب المعلمين ${ar(tAbs)} يوم${fPend ? ` (${ar(fPend)} لم يُدخل في فارس)` : ""} • ملاحظات الحصص: تأخر ${ar(nL)} وغياب ${ar(nA)}`;
      const r = await sendTo(pr.length ? { names: pr } : { roles: ["a"] }, { title: "🧭 ملخص الأسبوع — لوحة القائد", body, url: "/#staff:lead", tag: "weekly" }); return r; });
    const marks = Object.fromEntries(Object.entries(mark).filter(([k]) => k.startsWith("school-push-sent/")));
    if (Object.keys(marks).length) await fbPatch(marks);
    const dbg = (req.query || {}).debug ? { remote, rmtLessons: rplan ? Object.keys(rplan).length : 0, list: slots.map(s => `${s.f || "?"} ${s.l} ← ${s.tn.join("، ")}`), visits: visits.map(v => `${v.f || "?"} ${v.l} ← ${v.names.join("، ")}`), sb: subs.map(s => `ح${s.p + 1} ${s.ck} ← ${s.ti}`), lead: C.lead, now: nowM } : {};
    return res.status(200).json({ ok: true, at: now.slice(11, 16), slots: slots.length, subs: subs.length, done: out, ...dbg });
  } catch (e) {
    return res.status(500).json({ ok: false, msg: e.message });
  }
};
