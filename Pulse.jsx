// ══════════════════════════════════════════════════════════════════════════════
//  📈 مؤشر أداء المدرسة الأسبوعي — مقارنة الأسابيع في كل النواحي
//   يُعاد حساب كل أسبوع (الأحد ← الخميس) من البيانات الأصلية المؤرخة مباشرة — لا تقدير ولا لقطات قديمة:
//   الحضور والغياب (بعذر/بدون) • التأخر الصباحي • الملاحظات السلوكية والمخالفات • المتابعة اليومية
//   • تفاعل المعلمين (رصد الحضور/المتابعة/الدرجات) • الدرجات • القراءة الجهرية • نافس • حلقات القرآن
//   ضمانات الدقة: نسبة تغطية البيانات لكل أسبوع • استبعاد أسابيع الإجازة • المقارنة فقط عند توفر البيانات في الأسبوعين
// ══════════════════════════════════════════════════════════════════════════════
import React, { useState, useEffect, useMemo } from "react";
const obj = v => (v && typeof v === "object" ? v : {});
const arr = v => Array.isArray(v) ? v.filter(Boolean) : (v && typeof v === "object" ? Object.values(v).filter(Boolean) : []);
const ar = n => String(n ?? "").replace(/\d/g, d => "٠١٢٣٤٥٦٧٨٩"[d]);
const esc = t => String(t ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const pad = n => String(n).padStart(2, "0"); const dkey = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const dt = k => { const [y, m, d] = String(k).split("-").map(Number); return new Date(y, m - 1, d, 12); };
const addD = (k, n) => { const d = dt(k); d.setDate(d.getDate() + n); return dkey(d); };
const sunOf = k => { const d = dt(k); const w = d.getDay(); return addD(k, w === 5 || w === 6 ? -(w) : -w); }; // الجمعة والسبت ← أحد الأسبوع المنتهي
const hijS = k => { try { return dt(k).toLocaleDateString("ar-SA-u-ca-islamic-umalqura-nu-arab", { day: "numeric", month: "short" }); } catch { return k; } };
const hijL = k => { try { return dt(k).toLocaleDateString("ar-SA-u-ca-islamic-umalqura-nu-arab", { day: "numeric", month: "long", year: "numeric" }); } catch { return k; } };
const r1 = v => v == null || !isFinite(v) ? null : Math.round(v * 10) / 10;
const avg = L => { const a = L.filter(x => x != null && isFinite(x)); return a.length ? a.reduce((s, x) => s + x, 0) / a.length : null; };
const tsDk = ts => { try { return dkey(new Date(+ts)); } catch { return ""; } };
const ixKey = sid => String(sid).replace(/[.#$[\]/]/g, "");

// تعريف المؤشرات: up = الارتفاع تحسّن؟ • u = الوحدة • g = المجموعة • n = الحد الأدنى للسجلات ليُعتمد الرقم
export const KPI = [
  { k: "att", g: "A", t: "نسبة الحضور", u: "٪", up: true, ic: "🗓️", d: "١ − (أيام غياب الطلاب ÷ مقاعد الحصص المرصودة)" },
  { k: "unx", g: "A", t: "أيام الغياب بدون عذر", u: "", up: false, ic: "🚫", per: true, d: "مجموع أيام الغياب بدون عذر لكل الطلاب في الأسبوع" },
  { k: "exc", g: "A", t: "أيام الغياب بعذر", u: "", up: false, ic: "📄", per: true },
  { k: "chr", g: "A", t: "طلاب غابوا يومين فأكثر بدون عذر", u: "", up: false, ic: "⚠️" },
  { k: "full", g: "A", t: "طلاب بحضور كامل دون تأخر", u: "٪", up: true, ic: "🌟", d: "نسبة الطلاب الذين لم يغيبوا ولم يتأخروا طوال الأسبوع" },
  { k: "late", g: "L", t: "حالات التأخر الصباحي", u: "", up: false, ic: "⏰", per: true },
  { k: "lateM", g: "L", t: "متوسط دقائق التأخر", u: " د", up: false, ic: "⏱️" },
  { k: "bnNeg", g: "B", t: "ملاحظات سلوكية سلبية", u: "", up: false, ic: "📝" },
  { k: "bnPos", g: "B", t: "ملاحظات سلوكية إيجابية", u: "", up: true, ic: "⭐" },
  { k: "dc", g: "B", t: "مخالفات الانضباط المرصودة", u: "", up: false, ic: "🛑" },
  { k: "sdPos", g: "B", t: "إيجابية المتابعة اليومية", u: "٪", up: true, ic: "📒", d: "التقييمات الإيجابية ÷ كل تقييمات المتابعة (مشاركة، واجبات، أدوات، سلوك)" },
  { k: "risk", g: "B", t: "طلاب في الخطر (أحمر) هذا الأسبوع", u: "", up: false, ic: "🔴", d: "وفق معايير «تحليل الحضور والسلوك» على بيانات الأسبوع فقط" },
  { k: "tSd", g: "T", t: "معلمون سجّلوا المتابعة اليومية", u: "", up: true, ic: "👨‍🏫" },
  { k: "sdN", g: "T", t: "سجلات المتابعة اليومية", u: "", up: true, ic: "🧾" },
  { k: "attCov", g: "T", t: "اكتمال رصد الحضور", u: "٪", up: true, ic: "✅", d: "أيام الفصول المرصود حضورها ÷ (عدد الفصول × أيام الدوام)" },
  { k: "grN", g: "T", t: "درجات مرصودة (طالب×تقويم)", u: "", up: true, ic: "🧮" },
  { k: "gr", g: "S", t: "متوسط الدرجات المرصودة", u: "٪", up: true, ic: "📊", n: 10 },
  { k: "rd", g: "S", t: "متوسط القراءة الجهرية", u: "", up: true, ic: "📖", n: 3 },
  { k: "rdN", g: "S", t: "محاولات القراءة المقيّمة", u: "", up: true, ic: "🎙️" },
  { k: "nq", g: "S", t: "متوسط اختبارات نافس التدريبية", u: "٪", up: true, ic: "🎯", n: 5 },
  { k: "nqN", g: "S", t: "اختبارات نافس المؤداة", u: "", up: true, ic: "📝" },
  { k: "qt", g: "Q", t: "مرات التسميع (القرآن)", u: "", up: true, ic: "🟢" },
  { k: "qm", g: "Q", t: "مرات المراجعة (القرآن)", u: "", up: true, ic: "🔵" },
  { k: "qs", g: "Q", t: "طلاب شاركوا في الحلقات", u: "", up: true, ic: "📖" }];
export const GRP = { A: ["🗓️", "الحضور والغياب"], L: ["⏰", "التأخر الصباحي"], B: ["🧭", "السلوك والانضباط"], T: ["👨‍🏫", "تفاعل المعلمين ورصد البيانات"], S: ["📚", "التحصيل والقراءة ونافس"], Q: ["📖", "حلقات القرآن الكريم"] };
const KP = Object.fromEntries(KPI.map(x => [x.k, x]));

// ───────── حساب أسبوع واحد من البيانات الأصلية ─────────
function weekMetrics(D, R, G, wk) { const S = Object.values(R.S); const C = Object.values(R.C); const K = D.classes.length;
  const days = new Set(); Object.entries(obj(D.att)).forEach(([dk, day]) => { if (Object.values(obj(day)).some(Boolean)) days.add(dk); }); const nd = days.size;
  const recDays = C.reduce((a, c) => a + (c.attDays || 0), 0); const seats = C.reduce((a, c) => a + (c.seats || 0), 0), absN = C.reduce((a, c) => a + (c.absN || 0), 0);
  const nStu = S.length; const u = S.reduce((a, s) => a + s.abs.length - arr(s.absE).length, 0), e = S.reduce((a, s) => a + arr(s.absE).length, 0);
  const lateN = S.reduce((a, s) => a + s.late.length, 0), lateM = S.reduce((a, s) => a + (s.lateMins || 0), 0);
  const sdPos = C.reduce((a, c) => a + (c.sdPos || 0), 0), sdNeg = C.reduce((a, c) => a + (c.sdNeg || 0), 0);
  const tSd = new Set(); let sdN = 0; Object.values(obj(D.sd)).forEach(byD => Object.values(obj(byD)).forEach(recs => Object.values(obj(recs)).forEach(rec => { if (!rec || !rec.items) return; sdN++; if (rec.by) tSd.add(String(rec.by).trim()); })));
  let dc = 0; Object.values(obj(D.dc)).forEach(day => Object.values(obj(day)).forEach(x => { if (x && typeof x === "object") dc += x.sid || x.name || x.cat ? 1 : Object.values(x).filter(y => y && typeof y === "object").length || 1; }));
  const bnNeg = S.reduce((a, s) => a + (s.bnNeg || 0), 0), bnPos = S.reduce((a, s) => a + Math.max(0, arr(s.bn).length - (s.bnNeg || 0)), 0);
  const cls = Object.fromEntries(C.map(c => [c.ck, { att: c.attRate == null ? null : r1(c.attRate * 100), late: c.lateN || 0, n: c.n, absN: c.absN, seats: c.seats }]));
  const M = { wk, nd, K, nStu, has: nd > 0,
    att: seats ? r1((1 - absN / seats) * 100) : null, unx: nd ? u : null, exc: nd ? e : null, chr: nd ? S.filter(s => s.abs.length - arr(s.absE).length >= 2).length : null,
    full: nd >= 3 && nStu ? r1(100 * S.filter(s => !s.abs.length && !s.late.length && !s.newIn).length / nStu) : null,
    late: nd ? lateN : null, lateM: lateN ? r1(lateM / lateN) : null, bnNeg: nd ? bnNeg : null, bnPos: nd ? bnPos : null, dc: nd ? dc : null,
    sdPos: sdPos + sdNeg >= 20 ? r1(100 * sdPos / (sdPos + sdNeg)) : null, risk: nd >= 3 ? S.filter(s => s.lvl === "r").length : null,
    tSd: nd ? tSd.size : null, sdN: nd ? sdN : null, attCov: K && nd ? r1(Math.min(100, 100 * recDays / (K * nd))) : null,
    cov: { att: K && nd ? Math.min(1, recDays / (K * nd)) : 0, sd: sdPos + sdNeg }, cls, n: { att: seats, sd: sdPos + sdNeg } };
  Object.assign(M, G); return M; }
// الدرجات والقراءة ونافس والقرآن — تُحمّل مرة واحدة وتُوزَّع على الأسابيع حسب تاريخ كل سجل
function extraByWeek(X, W) { const out = Object.fromEntries(W.map(w => [w.wk, { grL: [], rdL: [], nqL: [], qt: 0, qm: 0, qS: new Set() }])); const find = dk => { const w = W.find(x => dk >= x.f && dk <= x.t); return w && out[w.wk]; };
  Object.values(obj(X.gr)).forEach(byS => Object.values(obj(byS)).forEach(recs => Object.values(obj(recs)).forEach(r => { if (!r || !r.mx || r.v === "غ" || r.v === "" || r.v == null || !isFinite(+r.v)) return; const o = find(String(r.d || tsDk(r.at)).slice(0, 10)); if (o) o.grL.push(Math.max(0, Math.min(100, +r.v / +r.mx * 100))); })));
  Object.values(obj(X.rd)).forEach(byK => Object.values(obj(byK)).forEach(rec => arr(rec && rec.tries).forEach(tr => { if (!tr.m || tr.rej) return; const o = find(tsDk(tr.at)); if (o) o.rdL.push(+tr.m.score || 0); })));
  Object.values(obj(X.nq)).forEach(byK => Object.values(obj(byK)).forEach(r => { if (!r || !r.res || !r.res.maxTotal) return; const o = find(tsDk(r.ts)); if (o) o.nqL.push(100 * r.res.total / r.res.maxTotal); }));
  Object.entries(obj(X.qr)).forEach(([dk, day]) => { const o = find(dk); if (!o) return; Object.values(obj(day)).forEach(cls => Object.entries(obj(cls)).forEach(([sid, ms]) => Object.values(obj(ms)).forEach(m => { if (!m || !m.k) return; if (m.k === "t") o.qt++; else o.qm++; o.qS.add(sid); }))); });
  return Object.fromEntries(Object.entries(out).map(([wk, o]) => [wk, { gr: o.grL.length >= 10 ? r1(avg(o.grL)) : null, grN: o.grL.length, rd: o.rdL.length >= 3 ? r1(avg(o.rdL)) : null, rdN: o.rdL.length, nq: o.nqL.length >= 5 ? r1(avg(o.nqL)) : null, nqN: o.nqL.length, qt: o.qt, qm: o.qm, qs: o.qS.size }])); }
// المؤشر العام للانضباط (يُحسب فقط عند توفر الحضور) + المؤشر الأكاديمي (عند توفر بياناته)
export function pulseIndex(M) { if (!M || !M.has || M.att == null) return null; const per100 = v => M.nStu ? v / M.nStu * 100 : 0;
  const a = Math.max(0, Math.min(100, (M.att - 85) / 15 * 100)); const l = Math.max(0, 100 - per100(M.late || 0) * 2.5); const b = M.sdPos != null ? M.sdPos : Math.max(0, 100 - per100((M.bnNeg || 0) + (M.dc || 0)) * 5);
  return Math.round(a * .5 + l * .25 + b * .25); }
const cmpOk = (k, a, b) => a && b && a.has && b.has && a[k] != null && b[k] != null;
// تقييم التغير: + تحسن • − تراجع • 0 ثابت (هامش يتجاهل الفروق الصغيرة جداً)
function trend(k, cur, prev) { const K = KP[k]; if (!cmpOk(k, cur, prev)) return null; let a = cur[k], b = prev[k];
  if (K.per && cur.nd && prev.nd) { a = a / cur.nd; b = b / prev.nd; } // عدّاد يومي لعدالة المقارنة بين أسابيع مختلفة الأيام
  const d = a - b; const base = Math.max(Math.abs(b), K.u === "٪" ? 1 : 1); const rel = d / base; const thr = K.u === "٪" ? .5 : .08;
  const s = Math.abs(K.u === "٪" ? d : rel) < thr ? 0 : (d > 0) === K.up ? 1 : -1; return { s, d: r1(cur[k] - prev[k]), rel: Math.round(rel * 100), perDay: !!(K.per && cur.nd !== prev.nd) }; }

const CSS = `.ps{--nv:#0b2545;--gd:#c9a227;direction:rtl;color:#0f172a}
.ps .hero{position:relative;overflow:hidden;border-radius:26px;padding:20px;color:#fff;background:radial-gradient(800px 260px at 110% -40%,rgba(201,162,39,.45),transparent 60%),linear-gradient(135deg,#071a33,#0b2545 50%,#13406e);box-shadow:0 22px 44px -26px #071a33}
.ps .hero h2{margin:0;font-size:22px;font-weight:900}.ps .hero p{margin:4px 0 0;font-size:13px;font-weight:700;opacity:.85}
.ps .big{display:flex;gap:14px;flex-wrap:wrap;margin-top:14px}.ps .gauge{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.18);border-radius:20px;padding:12px 16px;min-width:200px;flex:1}
.ps .gauge b{font-size:40px;line-height:1;font-weight:900}.ps .gauge small{display:block;font-size:12px;font-weight:800;opacity:.85;margin-top:4px}
.ps .card{background:#fff;border:1.5px solid #e2e8f0;border-radius:22px;padding:14px;box-shadow:0 12px 26px -22px rgba(11,37,69,.6)}
.ps .b{border:none;border-radius:13px;padding:9px 14px;font:inherit;font-weight:800;font-size:13.5px;cursor:pointer;display:inline-flex;gap:6px;align-items:center}.ps .b.p{background:linear-gradient(135deg,#13406e,#0b2545);color:#fff}.ps .b.g{background:#fff;color:#0b2545;border:1.5px solid #cbd5e1}.ps .b.y{background:linear-gradient(135deg,#d8b443,#b8901c);color:#231a02}
.ps .chip{border:1.5px solid #cbd5e1;background:#fff;border-radius:999px;padding:6px 12px;font-weight:800;font-size:12.5px;cursor:pointer;font-family:inherit;color:#334155}.ps .chip.on{background:#0b2545;color:#fff;border-color:#0b2545}
.ps .kg{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:10px}.ps .k{border:1.5px solid #e2e8f0;border-radius:18px;padding:11px 12px;background:#fff;display:grid;gap:4px;position:relative;overflow:hidden}
.ps .k .t{font-size:12.5px;font-weight:800;color:#475569}.ps .k .v{font-size:26px;font-weight:900;color:#0b2545;line-height:1.1}.ps .k .dl{font-size:12px;font-weight:900;border-radius:999px;padding:2px 9px;justify-self:start}
.ps .k.up{border-color:#86efac;background:linear-gradient(180deg,#f0fdf4,#fff 60%)}.ps .k.dn{border-color:#fca5a5;background:linear-gradient(180deg,#fef2f2,#fff 60%)}
.ps .gh{display:flex;align-items:center;gap:8px;font-size:15px;font-weight:900;color:#0b2545;margin:4px 2px}
.ps table{width:100%;border-collapse:separate;border-spacing:0}.ps th{background:#0b2545;color:#fff;font-size:11.5px;padding:7px 6px;font-weight:800;position:sticky;top:0}.ps th:first-child{border-radius:0 12px 0 0}.ps th:last-child{border-radius:12px 0 0 0}
.ps td{border-bottom:1px solid #eef2f7;padding:7px 6px;text-align:center;font-weight:800;font-size:13px}.ps td:first-child{text-align:right;color:#334155;font-size:12.5px}.ps tr.gr td{background:#f1f5f9;color:#0b2545;font-weight:900;text-align:right}
.ps .ins{display:grid;gap:6px}.ps .ins div{border-radius:14px;padding:8px 12px;font-weight:800;font-size:13.5px;line-height:1.8}
.ps .warn{background:#fffbeb;border:1px solid #fde68a;color:#92400e;border-radius:14px;padding:8px 12px;font-size:12.5px;font-weight:800;line-height:1.8}`;
const Spark = ({ vals, up, w = 120, h = 30 }) => { const P = vals.map((v, i) => [i, v]).filter(x => x[1] != null); if (P.length < 2) return <svg width={w} height={h} />; const mn = Math.min(...P.map(x => x[1])), mx = Math.max(...P.map(x => x[1])); const sx = i => w - 4 - i / (vals.length - 1) * (w - 8), sy = v => mx === mn ? h / 2 : h - 4 - (v - mn) / (mx - mn) * (h - 8);
  const last = P[P.length - 1], prev = P[P.length - 2]; const good = last[1] === prev[1] ? null : (last[1] > prev[1]) === up; const col = good == null ? "#64748b" : good ? "#16a34a" : "#dc2626";
  return <svg width={w} height={h} style={{ direction: "ltr" }}><polyline fill="none" stroke={col} strokeWidth="2.2" strokeLinejoin="round" points={P.map(([i, v]) => `${sx(i)},${sy(v)}`).join(" ")} />{P.map(([i, v]) => <circle key={i} cx={sx(i)} cy={sy(v)} r={i === last[0] ? 3.5 : 2} fill={i === last[0] ? col : "#94a3b8"} />)}</svg>; };
const fmt = (k, v) => v == null ? "—" : ar(v) + (KP[k] ? KP[k].u : "");
const wkName = w => `${hijS(w.f)} — ${hijS(w.t)}`;

export function SchoolPulse({ api }) {
  const [nW, setNW] = useState(8); const [W, setW] = useState(null); const [M, setM] = useState({}); const [step, setStep] = useState(""); const [sel, setSel] = useState(null); const [err, setErr] = useState("");
  const build = async () => { setErr(""); setM({}); const today = dkey(new Date()); const s0 = sunOf(today);
    const L = Array.from({ length: nW }, (_, i) => { const f = addD(s0, -7 * i), thu = addD(f, 4); return { wk: f, f, t: thu > today ? today : thu, cur: thu > today }; }).filter(w => w.f <= w.t).reverse(); setW(L); setSel(null);
    try { setStep("الدرجات والقراءة ونافس والقرآن"); const [gr, rd, nq, qr] = await Promise.all([api.maGet("school-grades-stu"), api.maGet("school-rd-res"), api.maGet("school-nq-res"), api.fbRange("school-qrn", L[0].f, L[L.length - 1].t).catch(() => ({}))]);
      const EX = extraByWeek({ gr, rd, nq, qr }, L); const out = {};
      for (let i = 0; i < L.length; i++) { const w = L[i]; setStep(`الحضور والسلوك — أسبوع ${ar(i + 1)} من ${ar(L.length)}`); const D = await api.inLoad(w.f, w.t); const R = api.inCompute(D); out[w.wk] = weekMetrics(D, R, EX[w.wk], w.wk); setM({ ...out }); }
      setStep(""); } catch (e) { setStep(""); setErr("تعذّر تحميل البيانات — " + (e && e.message || "تحقق من الاتصال")); } };
  useEffect(() => { build(); }, [nW]);
  const valid = W ? W.filter(w => M[w.wk] && M[w.wk].has) : []; const curW = sel ? W.find(w => w.wk === sel) : valid[valid.length - 1]; const ci = curW ? valid.indexOf(curW) : -1; const prevW = ci > 0 ? valid[ci - 1] : null;
  const cur = curW && M[curW.wk], prev = prevW && M[prevW.wk]; const I = pulseIndex(cur), Ip = pulseIndex(prev);
  const ins = useMemo(() => { if (!cur || !prev) return null; const T = KPI.map(K => ({ K, tr: trend(K.k, cur, prev) })).filter(x => x.tr && x.tr.s); const by = s => T.filter(x => x.tr.s === s).sort((a, b) => Math.abs(b.tr.rel) - Math.abs(a.tr.rel)).slice(0, 5);
    const cls = Object.entries(cur.cls).map(([ck, c]) => ({ ck, d: c.att != null && prev.cls[ck] && prev.cls[ck].att != null ? r1(c.att - prev.cls[ck].att) : null, att: c.att })).filter(x => x.d != null).sort((a, b) => a.d - b.d);
    return { up: by(1), dn: by(-1), clsDn: cls.filter(x => x.d <= -2).slice(0, 4), clsUp: cls.filter(x => x.d >= 2).reverse().slice(0, 4), low: Object.entries(cur.cls).filter(([, c]) => c.att != null).sort((a, b) => a[1].att - b[1].att).slice(0, 3) }; }, [cur, prev]);
  const print = () => { if (!cur) return; const rows = KPI.map(K => `<tr><td>${K.ic} ${K.t}</td>${valid.map(w => `<td${w === curW ? ' style="background:#fff7d6"' : ""}>${fmt(K.k, M[w.wk][K.k])}</td>`).join("")}<td>${(() => { const t = trend(K.k, cur, prev); return !t ? "—" : t.s > 0 ? "▲ تحسّن" : t.s < 0 ? "▼ تراجع" : "● ثابت"; })()}</td></tr>`).join("");
    api.print(`<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>تقرير أداء المدرسة الأسبوعي</title><style>@page{size:A4 landscape;margin:9mm}body{font-family:Tahoma,"Traditional Arabic",sans-serif;color:#0f172a;-webkit-print-color-adjust:exact;print-color-adjust:exact;font-size:12px}h1{color:#0b2545;font-size:20px;margin:4px 0}table{width:100%;border-collapse:collapse}th{background:#0b2545;color:#fff;padding:5px;font-size:11px}td{border:1px solid #dbe3ec;padding:4px;text-align:center}td:first-child{text-align:right;font-weight:bold}.hd{display:flex;justify-content:space-between;align-items:center;border-bottom:3px double #0b2545;padding-bottom:6px}.ins{display:flex;gap:10px;margin:8px 0}.ins div{flex:1;border:1px solid #e2e8f0;border-radius:6px;padding:6px;line-height:1.8}</style></head><body>
    <div class="hd"><div style="line-height:1.7;font-weight:bold">المملكة العربية السعودية<br>وزارة التعليم<br>${esc(api.region || "")}<br>${esc(api.school || "")}</div>${api.moeLogo ? `<img src="${api.moeLogo}" style="height:60px">` : ""}</div>
    <h1>📈 تقرير أداء المدرسة الأسبوعي — أسبوع ${esc(wkName(curW))}</h1><div><b>مؤشر الانضباط العام:</b> ${I == null ? "—" : ar(I) + " / ١٠٠"}${Ip != null && I != null ? ` (${I - Ip >= 0 ? "▲ +" : "▼ "}${ar(I - Ip)} عن الأسبوع السابق)` : ""} • الطلاب ${ar(cur.nStu)} • أيام الدوام ${ar(cur.nd)} • اكتمال رصد الحضور ${fmt("attCov", cur.attCov)}</div>
    ${ins ? `<div class="ins"><div><b style="color:#15803d">▲ أبرز التحسن</b><br>${ins.up.map(x => `• ${x.K.t}: ${fmt(x.K.k, prev[x.K.k])} ← ${fmt(x.K.k, cur[x.K.k])}`).join("<br>") || "—"}</div><div><b style="color:#b91c1c">▼ أبرز التراجع</b><br>${ins.dn.map(x => `• ${x.K.t}: ${fmt(x.K.k, prev[x.K.k])} ← ${fmt(x.K.k, cur[x.K.k])}`).join("<br>") || "—"}</div></div>` : ""}
    <table><tr><th>المؤشر</th>${valid.map(w => `<th>${esc(wkName(w))}${w.cur ? " (جارٍ)" : ""}</th>`).join("")}<th>الاتجاه</th></tr>${rows}</table>
    <div style="margin-top:6px;font-size:10.5px;color:#475569">المصدر: بيانات الموقع الأصلية المؤرخة، أُعيد حساب كل أسبوع لحظة الطباعة. «—» = لا توجد بيانات كافية. العدّادات تُقارن بالمعدل اليومي عند اختلاف عدد أيام الدوام. استُبعدت أسابيع الإجازة.</div>
    <script>setTimeout(()=>print(),400)</script></body></html>`); };
  const done = W && Object.keys(M).length === W.length && !step;
  return <div className="ps grid gap-3"><style>{CSS}</style>
    <div className="hero"><div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}><div style={{ fontSize: 44 }}>📈</div><div style={{ flex: 1, minWidth: 220 }}><h2>مؤشر أداء المدرسة الأسبوعي</h2><p>كل أسبوع يُعاد حسابه من البيانات الأصلية: الحضور • التأخر • السلوك • المتابعة • المعلمون • الدرجات • القراءة • نافس • القرآن</p></div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{[4, 8, 12].map(n => <button key={n} className={`chip${nW === n ? " on" : ""}`} style={nW === n ? { background: "#c9a227", borderColor: "#c9a227", color: "#231a02" } : { background: "rgba(255,255,255,.1)", color: "#fff", borderColor: "rgba(255,255,255,.3)" }} onClick={() => setNW(n)}>آخر {ar(n)} أسابيع</button>)}<button className="b y" disabled={!!step} onClick={build}>🔄 إعادة الحساب</button><button className="b g" disabled={!cur} onClick={print}>🖨 تقرير</button></div></div>
      {cur && <div className="big"><div className="gauge"><small>مؤشر الانضباط العام — أسبوع {wkName(curW)}{curW.cur ? " (جارٍ)" : ""}</small><b>{I == null ? "—" : ar(I)}</b><span style={{ fontSize: 14, fontWeight: 800 }}> / ١٠٠ </span>{Ip != null && I != null && <span style={{ fontWeight: 900, fontSize: 15, color: I > Ip ? "#86efac" : I < Ip ? "#fca5a5" : "#e2e8f0" }}>{I > Ip ? "▲" : I < Ip ? "▼" : "●"} {ar(Math.abs(I - Ip))} عن الأسبوع السابق</span>}<small>يجمع الحضور ٥٠٪ والتأخر ٢٥٪ والسلوك ٢٥٪</small></div>
        <div className="gauge"><small>نسبة الحضور</small><b>{fmt("att", cur.att)}</b><small>{ar(cur.nStu)} طالب • {ar(cur.nd)} أيام دوام • اكتمال الرصد {fmt("attCov", cur.attCov)}</small></div>
        <div className="gauge"><small>اتجاه المدرسة</small><b style={{ fontSize: 26 }}>{!ins ? "—" : ins.up.length > ins.dn.length ? "📈 تتحسّن" : ins.dn.length > ins.up.length ? "📉 تتراجع" : "➖ مستقرة"}</b><small>{ins ? `${ar(ins.up.length)} مؤشرات تحسّنت • ${ar(ins.dn.length)} تراجعت` : "يلزم أسبوعان فيهما بيانات للمقارنة"}</small></div></div>}</div>
    {(step || err) && <div className="card" style={{ textAlign: "center", fontWeight: 900, color: err ? "#b91c1c" : "#0b2545" }}>{err || `⏳ جارٍ الحساب من البيانات الأصلية: ${step}…`}</div>}
    {W && <div className="card"><div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}><b style={{ fontSize: 13.5 }}>الأسبوع المعروض:</b>{W.map(w => { const m = M[w.wk]; const ok = m && m.has; return <button key={w.wk} className={`chip${curW === w ? " on" : ""}`} disabled={!ok} title={!m ? "جارٍ الحساب" : !ok ? "لا بيانات حضور (إجازة؟)" : ""} style={!ok ? { opacity: .45 } : null} onClick={() => setSel(w.wk)}>{wkName(w)}{w.cur ? " • جارٍ" : ""}{m && !m.has ? " • إجازة" : ""}</button>; })}</div>
      {cur && prev && <div style={{ fontSize: 12, fontWeight: 800, color: "#64748b", marginTop: 6 }}>المقارنة مع أسبوع {wkName(prevW)} • العدّادات (غياب، تأخر) تُقارن بالمعدل اليومي إذا اختلف عدد أيام الدوام</div>}
      {cur && cur.attCov != null && cur.attCov < 85 && <div className="warn" style={{ marginTop: 8 }}>⚠️ اكتمال رصد الحضور هذا الأسبوع {fmt("attCov", cur.attCov)} فقط — بعض الفصول لم يُرصد حضورها في بعض الأيام، فالأرقام أقل دقة. أكمل الرصد ثم اضغط «🔄 إعادة الحساب».</div>}
      {curW && curW.cur && <div className="warn" style={{ marginTop: 8, background: "#eff6ff", borderColor: "#bfdbfe", color: "#1e40af" }}>ℹ️ الأسبوع الحالي لم يكتمل بعد ({ar(cur ? cur.nd : 0)} أيام حتى الآن) — تُقارن العدّادات بالمعدل اليومي.</div>}</div>}
    {ins && <div className="kg" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))" }}>
      <div className="card ins"><b style={{ color: "#15803d" }}>▲ أبرز التحسن</b>{ins.up.length ? ins.up.map(x => <div key={x.K.k} style={{ background: "#f0fdf4" }}>{x.K.ic} {x.K.t}: {fmt(x.K.k, prev[x.K.k])} ← <b>{fmt(x.K.k, cur[x.K.k])}</b></div>) : <div style={{ background: "#f8fafc" }}>لا يوجد</div>}</div>
      <div className="card ins"><b style={{ color: "#b91c1c" }}>▼ أبرز التراجع — يحتاج قراراً</b>{ins.dn.length ? ins.dn.map(x => <div key={x.K.k} style={{ background: "#fef2f2" }}>{x.K.ic} {x.K.t}: {fmt(x.K.k, prev[x.K.k])} ← <b>{fmt(x.K.k, cur[x.K.k])}</b></div>) : <div style={{ background: "#f8fafc" }}>لا يوجد</div>}</div>
      <div className="card ins"><b style={{ color: "#0b2545" }}>🏫 الفصول</b>{ins.clsDn.map(c => <div key={c.ck} style={{ background: "#fef2f2" }}>▼ {api.maClassName(c.ck)}: الحضور {ar(c.att)}٪ ({ar(c.d)} نقطة)</div>)}{ins.clsUp.map(c => <div key={c.ck} style={{ background: "#f0fdf4" }}>▲ {api.maClassName(c.ck)}: الحضور {ar(c.att)}٪ (+{ar(c.d)} نقطة)</div>)}{!ins.clsDn.length && !ins.clsUp.length && <div style={{ background: "#f8fafc" }}>لا تغيّر ملحوظ في حضور الفصول</div>}<div style={{ background: "#fffbeb" }}>الأقل حضوراً: {ins.low.map(([ck, c]) => `${api.maClassName(ck)} ${ar(c.att)}٪`).join(" • ")}</div></div></div>}
    {cur && Object.entries(GRP).map(([g, [ic, t]]) => { const L = KPI.filter(K => K.g === g); if (L.every(K => cur[K.k] == null && !valid.some(w => M[w.wk][K.k] != null))) return null;
      return <div key={g} className="grid gap-2"><div className="gh">{ic} {t}</div><div className="kg">{L.map(K => { const tr = trend(K.k, cur, prev); const vals = valid.map(w => M[w.wk][K.k]);
        return <div key={K.k} className={`k${tr && tr.s > 0 ? " up" : tr && tr.s < 0 ? " dn" : ""}`} title={K.d || ""}><div className="t">{K.ic} {K.t}</div><div style={{ display: "flex", alignItems: "end", justifyContent: "space-between", gap: 6 }}><div className="v">{fmt(K.k, cur[K.k])}</div><Spark vals={vals} up={K.up} /></div>
          {tr ? <span className="dl" style={{ background: tr.s > 0 ? "#dcfce7" : tr.s < 0 ? "#fee2e2" : "#f1f5f9", color: tr.s > 0 ? "#15803d" : tr.s < 0 ? "#b91c1c" : "#475569" }}>{tr.s > 0 ? "▲ تحسّن" : tr.s < 0 ? "▼ تراجع" : "● ثابت"} {tr.d > 0 ? "+" : ""}{ar(tr.d)}{K.u}{tr.perDay ? " (بالمعدل اليومي)" : ""}</span> : <span className="dl" style={{ background: "#f8fafc", color: "#94a3b8" }}>{cur[K.k] == null ? "لا بيانات كافية" : "لا مقارنة"}</span>}</div>; })}</div></div>; })}
    {valid.length > 1 && <div className="card" style={{ overflowX: "auto" }}><b style={{ fontSize: 15 }}>📋 جدول المقارنة بين الأسابيع</b><table style={{ marginTop: 8, minWidth: 700 }}><thead><tr><th>المؤشر</th>{valid.map(w => <th key={w.wk}>{wkName(w)}{w.cur ? " •جارٍ" : ""}</th>)}</tr></thead>
      <tbody><tr><td><b>مؤشر الانضباط العام</b></td>{valid.map(w => <td key={w.wk} style={{ color: "#0b2545" }}>{ar(pulseIndex(M[w.wk]) ?? "—")}</td>)}</tr>{Object.entries(GRP).map(([g, [ic, t]]) => <React.Fragment key={g}><tr className="gr"><td colSpan={valid.length + 1}>{ic} {t}</td></tr>{KPI.filter(K => K.g === g).map(K => <tr key={K.k}><td>{K.t}</td>{valid.map((w, i) => { const tr = i ? trend(K.k, M[w.wk], M[valid[i - 1].wk]) : null; return <td key={w.wk} style={{ color: tr && tr.s > 0 ? "#15803d" : tr && tr.s < 0 ? "#b91c1c" : "#0f172a", background: w === curW ? "#fffbea" : undefined }}>{fmt(K.k, M[w.wk][K.k])}{tr && tr.s ? (tr.s > 0 ? " ▲" : " ▼") : ""}</td>; })}</tr>)}</React.Fragment>)}
        <tr className="gr"><td colSpan={valid.length + 1}>🔎 جودة البيانات</td></tr><tr><td>أيام الدوام</td>{valid.map(w => <td key={w.wk}>{ar(M[w.wk].nd)}</td>)}</tr><tr><td>اكتمال رصد الحضور</td>{valid.map(w => <td key={w.wk} style={{ color: M[w.wk].attCov < 85 ? "#b45309" : "#15803d" }}>{fmt("attCov", M[w.wk].attCov)}</td>)}</tr><tr><td>تقييمات المتابعة اليومية</td>{valid.map(w => <td key={w.wk}>{ar(M[w.wk].n.sd)}</td>)}</tr></tbody></table></div>}
    {done && <div className="card" style={{ fontSize: 12.5, fontWeight: 700, color: "#475569", lineHeight: 1.9 }}>🔎 <b>منهجية الحساب:</b> كل رقم يُحسب لحظياً من سجلات الموقع المؤرخة داخل الأسبوع (الأحد–الخميس)، فأي تصحيح لاحق في البيانات ينعكس مباشرة. يُستبعد الأسبوع الذي لا رصد حضور فيه (إجازة). لا يُعرض المتوسط إلا عند توفر حد أدنى من السجلات (الدرجات ١٠، القراءة ٣، نافس ٥، المتابعة ٢٠ تقييماً). يُعدّ التغيّر «ثابتاً» إذا كان أقل من نصف نقطة مئوية أو ٨٪ من القيمة، حتى لا تُضخَّم الفروق الصغيرة.</div>}
  </div>; }
