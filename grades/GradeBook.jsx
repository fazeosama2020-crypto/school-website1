// ══════════════════════════════════════════════════════════════════
// 📝 رصد الدرجات — اختيار المادة والمعلم ونوع الاختبار والفصل والدرجة العظمى، ثم رصد درجة كل طالب
// • الأسماء تُجلب تلقائياً من كشوف الفصول في الموقع (نظام الغياب / نافذ)
// • الحفظ ← تحليل فوري وتقرير مطبوع ← مقارنة بين الفصول وأنواع الاختبارات وتقدم الطالب
// قاعدة البيانات: school-grades/{id} = { subj, teacher, type, title, ck, max, date, marks:{sid: درجة | "غ"}, names, by, at }
// ══════════════════════════════════════════════════════════════════
import React, { useState, useEffect, useMemo, useRef } from "react";
import { rdFixRec, rdTokens } from "../reading/rdEngine.js";

const NODE = "school-grades";
const IX = "school-grades-stu"; // فهرس لكل طالب: school-grades-stu/{ck}/{sid}/{recId} — تقرأ منه صفحة الطالب وولي الأمر
const RD = { TXT: "school-rd-txt", RES: "school-rd-res" };
const ixKey = sid => String(sid).replace(/[.#$[\]/]/g, "");
const ixPatch = (rec, prev) => { const P = {}; const e = { s: rec.subj, ty: rec.type, ti: rec.title || "", mx: +rec.max, d: rec.date, t: rec.teacher || "", at: rec.up || Date.now() };
  Object.entries(obj(rec.marks)).forEach(([sid, v]) => { P[`${IX}/${rec.ck}/${ixKey(sid)}/${rec.id}`] = { ...e, v }; });
  if (prev) Object.keys(obj(prev.marks)).forEach(sid => { if (prev.ck !== rec.ck || obj(rec.marks)[sid] == null) P[`${IX}/${prev.ck}/${ixKey(sid)}/${rec.id}`] = null; });
  return P; };
const NAVY = "#0b2545", GOLD = "#c9a227";
const TYPES = ["تشخيصي", "تكويني", "تجريبي", "اختبار فترة", "نافس تجريبي", "نهائي"];
const MAXES = Array.from({ length: 21 }, (_, i) => i + 10); // من ١٠ إلى ٣٠
const SUBJ_STD = ["لغتي", "رياضيات", "علوم", "انجليزي", "الدراسات الإسلامية", "اجتماعيات", "المهارات الرقمية", "التفكير الناقد", "المهارات الحياتية", "التربية الفنية", "التربية البدنية"];
const BANDS = [
  { k: "ex", t: "ممتاز", min: 90, c: "#15803d", bg: "#dcfce7" },
  { k: "vg", t: "جيد جداً", min: 80, c: "#0e7490", bg: "#cffafe" },
  { k: "gd", t: "جيد", min: 65, c: "#2563eb", bg: "#dbeafe" },
  { k: "ac", t: "مقبول", min: 50, c: "#d97706", bg: "#fef3c7" },
  { k: "wk", t: "دون المستوى", min: 0, c: "#dc2626", bg: "#fee2e2" },
];
const bandOf = p => BANDS.find(b => p >= b.min) || BANDS[4];
const ar = n => String(n ?? "").replace(/\d/g, x => "٠١٢٣٤٥٦٧٨٩"[x]);
const f1 = n => n == null || !isFinite(n) ? "—" : ar(Math.round(n * 10) / 10);
const esc = t => String(t ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const obj = v => (v && typeof v === "object" ? v : {});
const arr = v => Array.isArray(v) ? v.filter(Boolean) : (v && typeof v === "object" ? Object.values(v).filter(Boolean) : []);
const nrm = s => String(s || "").replace(/^(أ\.|ا\.|الأستاذ|الاستاذ|أ\/)\s*/, "").replace(/[ً-ْـ]/g, "").replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي").replace(/\s+/g, " ").trim();
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const dAr = k => { try { const [y, m, d] = String(k).split("-").map(Number); return new Date(y, m - 1, d, 12).toLocaleDateString("ar-SA-u-ca-islamic-umalqura-nu-arab", { day: "numeric", month: "long", year: "numeric" }); } catch { return k; } };
const toNum = v => { const s = String(v ?? "").replace(/[٠-٩]/g, d => "٠١٢٣٤٥٦٧٨٩".indexOf(d)).replace(/[٫,]/g, ".").trim(); if (s === "") return null; const n = +s; return isFinite(n) ? n : NaN; };
const typeOrd = t => { const i = TYPES.indexOf(t); return i < 0 ? 99 : i; };
const subjRe = s => { const n = nrm(s); if (/لغتي|عربي/.test(n)) return /لغتي|عربي/; if (/رياض/.test(n)) return /رياض/; if (/علوم/.test(n)) return /علوم/; if (/انجليز|english/i.test(n)) return /انجليز|english/i; if (/اسلام|دين|قران|توحيد|فقه/.test(n)) return /اسلام|دين|قران/; if (/اجتماع/.test(n)) return /اجتماع/; if (/رقمي/.test(n)) return /رقمي/; if (/تفكير|ناقد/.test(n)) return /تفكير|ناقد/; if (/حياتي|اسري/.test(n)) return /حياتي|اسري/; if (/فني/.test(n)) return /فني/; if (/بدني/.test(n)) return /بدني/; return new RegExp(n.split(" ")[0] || "^$"); };

// إحصاء سجل
function stats(rec) {
  const M = obj(rec.marks); const max = +rec.max || 10; const vals = Object.values(M).filter(v => typeof v === "number");
  const P = vals.map(v => v / max * 100).sort((a, b) => a - b); const n = P.length;
  const mean = n ? P.reduce((a, b) => a + b, 0) / n : null; const sd = n ? Math.sqrt(P.reduce((a, b) => a + (b - mean) ** 2, 0) / n) : null;
  const med = n ? (n % 2 ? P[(n - 1) / 2] : (P[n / 2 - 1] + P[n / 2]) / 2) : null;
  return { n, abs: Object.values(M).filter(v => v === "غ").length, mean, sd, med, hi: n ? P[n - 1] : null, lo: n ? P[0] : null, pass: n ? P.filter(p => p >= 50).length / n * 100 : null, ex: n ? P.filter(p => p >= 90).length / n * 100 : null, bands: BANDS.map(b => P.filter(p => bandOf(p).k === b.k).length), meanRaw: mean == null ? null : mean * max / 100 };
}
const CSS = `
.gb{font-family:Cairo,Tahoma,sans-serif;direction:rtl;color:#0f172a}.gb *{box-sizing:border-box}
.gb-card{background:#fff;border:1px solid #e2e8f0;border-radius:20px;padding:16px;box-shadow:0 10px 28px -22px rgba(11,37,69,.45)}
.gb-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:10px 16px;border-radius:12px;border:1px solid #e2e8f0;background:#fff;font-family:inherit;font-weight:800;font-size:14px;color:#334155;cursor:pointer;white-space:nowrap;transition:all .15s}
.gb-btn:hover{transform:translateY(-1px);box-shadow:0 8px 16px -10px rgba(15,23,42,.45)}.gb-btn:disabled{opacity:.45;cursor:not-allowed;transform:none}
.gb-btn.p{background:linear-gradient(135deg,${NAVY},#1e3a8a);color:#fff;border-color:transparent}.gb-btn.g{background:linear-gradient(135deg,${GOLD},#a16207);color:#fff;border-color:transparent}
.gb-btn.ok{background:linear-gradient(135deg,#16a34a,#15803d);color:#fff;border-color:transparent}.gb-btn.red{background:#fff5f5;color:#dc2626;border-color:#fecaca}.gb-btn.sm{padding:6px 11px;font-size:12.5px;border-radius:10px}
.gb-inp{width:100%;min-height:42px;border-radius:12px;border:1.5px solid #e2e8f0;background:#f8fafc;padding:8px 12px;font-family:inherit;font-size:14px;font-weight:700;outline:none;color:#0f172a}
.gb-inp:focus{border-color:${GOLD};background:#fff;box-shadow:0 0 0 3px rgba(201,162,39,.18)}
.gb-lbl{display:grid;gap:4px;font-size:12.5px;font-weight:800;color:#475569}
.gb-tabs{display:flex;gap:6px;flex-wrap:wrap;padding:6px;background:#eef2f7;border-radius:16px}
.gb-tab{flex:1;min-width:120px;padding:10px 12px;border-radius:12px;border:none;background:transparent;font-family:inherit;font-weight:900;font-size:13.5px;color:#475569;cursor:pointer}.gb-tab.on{background:#fff;color:${NAVY};box-shadow:0 6px 16px -10px rgba(15,23,42,.5)}
.gb-chip{padding:7px 13px;border-radius:999px;border:1.5px solid #e2e8f0;background:#fff;font-family:inherit;font-weight:800;font-size:13px;cursor:pointer;color:#475569}.gb-chip.on{background:${NAVY};border-color:${NAVY};color:#fff}
.gb-tbl{width:100%;border-collapse:collapse;font-size:13px}.gb-tbl th{background:${NAVY};color:#fff;padding:8px 6px;font-weight:800;white-space:nowrap;position:sticky;top:0;z-index:1}.gb-tbl td{padding:6px;border-bottom:1px solid #eef2f7;text-align:center}.gb-tbl tr:hover td{background:#fffbeb}
.gb-mk{width:84px;height:40px;text-align:center;font-size:17px;font-weight:900;border-radius:10px;border:2px solid #e2e8f0;font-family:inherit;outline:none;background:#fff}
.gb-mk:focus{border-color:${GOLD};box-shadow:0 0 0 3px rgba(201,162,39,.2)}.gb-mk.bad{border-color:#dc2626;background:#fef2f2}
.gb-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(118px,1fr));gap:8px}.gb-kpi{border-radius:16px;padding:10px;text-align:center;background:#f8fafc;border:1.5px solid #e2e8f0}.gb-kpi b{display:block;font-size:22px;font-weight:900;color:${NAVY}}.gb-kpi small{font-size:12px;font-weight:800;color:#64748b}
.gb-lv{display:inline-flex;align-items:center;border-radius:999px;padding:2px 10px;font-weight:900;font-size:12px;white-space:nowrap}
.gb-bar{height:10px;border-radius:9px;background:#eef2f7;overflow:hidden}.gb-bar i{display:block;height:100%;border-radius:9px}
.gb-stk{display:flex;height:14px;border-radius:9px;overflow:hidden;background:#eef2f7}.gb-stk i{display:block;height:100%}
.gb-hero{background:linear-gradient(135deg,${NAVY},#13315c 60%,#1e3a8a);color:#fff;border-radius:22px;padding:16px 18px}
.gb-sticky{position:sticky;bottom:8px;z-index:5}
.gb-cols{display:flex;align-items:flex-end;gap:10px;height:190px;padding:8px 4px 0;border-bottom:2px solid #e2e8f0;overflow-x:auto}
.gb-cols>div{flex:1;min-width:46px;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%;font-size:11.5px;font-weight:900}
.gb-cols i{display:block;width:100%;max-width:54px;border-radius:10px 10px 0 0;transition:height .4s}
.gb-note{font-size:12.5px;font-weight:700;color:#64748b;line-height:1.9}
.gb-modal{position:fixed;inset:0;background:rgba(2,6,23,.6);display:flex;align-items:flex-start;justify-content:center;z-index:900;padding:18px 10px;overflow:auto}.gb-modal>div{background:#f8fafc;border-radius:22px;width:100%;max-width:1000px;padding:16px}
`;
const PCSS = `.pg{border-color:${NAVY}}.pg::before{background:linear-gradient(90deg,${NAVY},${GOLD},${NAVY})}.tt span{background:linear-gradient(135deg,${NAVY},#1e3a8a)}th{background:${NAVY}}h3{color:${NAVY}}.kp b{color:${NAVY}}.hd{border-bottom-color:${GOLD}}.cols{display:flex;align-items:flex-end;gap:6px;height:120px;border-bottom:1.5px solid #cbd5e1;margin:6px 0}.cols div{flex:1;text-align:center;font-size:9px;font-weight:800}.cols i{display:block;margin:0 auto;width:70%;border-radius:5px 5px 0 0}`;
const Lv = ({ p }) => { if (p == null) return <span className="gb-lv" style={{ background: "#f1f5f9", color: "#64748b" }}>غائب</span>; const b = bandOf(p); return <span className="gb-lv" style={{ background: b.bg, color: b.c }}>{b.t}</span>; };
const lvHtml = p => { const b = bandOf(p); return `<span class="lv" style="background:${b.bg};color:${b.c}">${b.t}</span>`; };
const useToast = () => { const [m, setM] = useState(""); const t = useRef(); return [m, s => { setM(s); clearTimeout(t.current); t.current = setTimeout(() => setM(""), 2600); }]; };

function useRoster(api) {
  const [st, setSt] = useState({ counts: [6, 4, 4], ros: null });
  useEffect(() => { (async () => { const [m, r] = await Promise.all([api.maGet(api.MA_META), api.maGet(api.MA_ROSTER)]); setSt({ counts: m && Array.isArray(m.counts) ? m.counts.map(n => +n || 0) : [6, 4, 4], ros: obj(r) }); })(); }, []);
  const studentsOf = ck => arr(st.ros && st.ros[ck] && st.ros[ck].students).filter(s => s && s.name).map(s => ({ ...s, id: s.id || "n" + api.asmK(s.name), ck })).sort((a, b) => a.name.localeCompare(b.name, "ar"));
  const classes = api.maClasses(st.counts).filter(c => !st.ros || studentsOf(c.ck).length);
  return { classes, studentsOf, ready: !!st.ros };
}

// ── طباعة تقرير سجل
function printRecord(api, rec, R, others, prev, by) {
  const S = stats(rec); const max = +rec.max; const M = obj(rec.marks); const names = obj(rec.names);
  const rows = Object.keys(M).map(sid => ({ sid, name: names[sid] || "—", v: M[sid] })).sort((a, b) => (typeof b.v === "number" ? b.v : -1) - (typeof a.v === "number" ? a.v : -1));
  const weak = rows.filter(x => typeof x.v === "number" && x.v / max * 100 < 50); const pv = prev ? obj(prev.marks) : null;
  const cmp = others.length ? `<h3>📊 مقارنة الفصول في ${esc(rec.subj)} — ${esc(rec.type)}</h3><div class="cols">${others.map(o => { const s = stats(o); return `<div><b>${f1(s.mean)}٪</b><i style="height:${Math.max(3, (s.mean || 0) * 0.95)}px;background:${o.id === rec.id ? GOLD : NAVY}"></i>${api.maClassName(o.ck)}</div>`; }).join("")}</div>` : "";
  api.print(`<section class="pg">${api.hdr(`تقرير تحليل نتائج ${esc(rec.type)} — ${esc(rec.subj)}`, `${api.maClassName(rec.ck)}<br>${dAr(rec.date)}<br>الدرجة من ${ar(max)}`)}
    <div style="text-align:center;font-size:11.5px;font-weight:800;margin-bottom:4px">المعلم: ${esc(rec.teacher || "—")}${rec.title ? ` • ${esc(rec.title)}` : ""}</div>
    <div class="kp"><div><b>${ar(S.n)}</b>طالباً رُصدت درجاتهم${S.abs ? ` • غياب ${ar(S.abs)}` : ""}</div><div><b>${f1(S.meanRaw)} / ${ar(max)}</b>المتوسط (${f1(S.mean)}٪)</div><div><b>${f1(S.pass)}٪</b>نسبة النجاح (٥٠٪ فأكثر)</div><div><b>${f1(S.ex)}٪</b>نسبة التميز (٩٠٪ فأكثر)</div></div>
    <div class="kp"><div><b>${f1(S.hi)}٪</b>أعلى نسبة</div><div><b>${f1(S.lo)}٪</b>أدنى نسبة</div><div><b>${f1(S.med)}٪</b>الوسيط</div><div><b>${f1(S.sd)}</b>الانحراف المعياري</div></div>
    <h3>📈 توزيع المستويات</h3><table><thead><tr>${BANDS.map(b => `<th>${b.t} (${b.min ? ar(b.min) + "٪+" : "أقل من ٥٠٪"})</th>`).join("")}</tr></thead><tbody><tr>${S.bands.map((n, i) => `<td style="color:${BANDS[i].c};font-weight:900">${ar(n)} (${ar(S.n ? Math.round(n / S.n * 100) : 0)}٪)</td>`).join("")}</tr></tbody></table>
    ${cmp}
    <h3>📋 درجات الطلاب مرتبة</h3><table><thead><tr><th>م</th><th>الطالب</th><th>الدرجة</th><th>النسبة</th><th>المستوى</th>${pv ? `<th>السابق (${esc(prev.type)})</th><th>التغير</th>` : ""}</tr></thead><tbody>
    ${rows.map((x, i) => { const p = typeof x.v === "number" ? x.v / max * 100 : null; const pp = pv && typeof pv[x.sid] === "number" ? pv[x.sid] / (+prev.max) * 100 : null; return `<tr><td>${ar(i + 1)}</td><td class="r">${esc(x.name)}</td><td><b>${p == null ? "غ" : f1(x.v)}</b></td><td>${p == null ? "—" : f1(p) + "٪"}</td><td>${p == null ? "غائب" : lvHtml(p)}</td>${pv ? `<td>${pp == null ? "—" : f1(pp) + "٪"}</td><td style="color:${p != null && pp != null ? (p >= pp ? "#15803d" : "#dc2626") : "#94a3b8"};font-weight:900">${p != null && pp != null ? (p >= pp ? "▲" : "▼") + f1(Math.abs(p - pp)) : "—"}</td>` : ""}</tr>`; }).join("")}</tbody></table>
    ${weak.length ? `<h3 style="color:#dc2626">⚠️ طلاب يحتاجون خطة علاجية (${ar(weak.length)})</h3><div style="font-size:11px;line-height:2">${weak.map(x => `<b>${esc(x.name)}</b> (${f1(x.v / max * 100)}٪)`).join(" • ")}</div>` : ""}
    <h3>💡 قراءة النتائج والتوصيات</h3><ul style="font-size:11px;line-height:1.9;margin:0">${recs(S, rec, others).map(t => `<li>${esc(t)}</li>`).join("")}</ul>
    ${api.sig(rec.teacher || by, "وكيل الشؤون التعليمية")}</section>`, `تحليل ${rec.subj} — ${api.maClassName(rec.ck)}`, PCSS);
}
function recs(S, rec, others) {
  const L = []; if (!S.n) return ["لم تُرصد درجات بعد"];
  if (S.mean >= 85) L.push("مستوى الفصل مرتفع؛ يُوصى بأنشطة إثرائية وتحدّيات أعلى للمتميزين.");
  else if (S.mean >= 65) L.push("مستوى الفصل جيد إجمالاً؛ يُوصى بتعزيز المهارات التي انخفض فيها الأداء ومتابعة فئة «مقبول».");
  else L.push("متوسط الفصل منخفض؛ يُوصى بمراجعة المهارات الأساسية للوحدة وإعادة التدريس بأساليب متنوعة ثم إعادة القياس.");
  if (S.bands[4]) L.push(`${S.bands[4]} طالباً دون المستوى (أقل من ٥٠٪): خطة علاجية فردية، ومجموعات تعلم صغيرة، وتواصل مع أولياء الأمور.`);
  if (S.sd > 20) L.push("تباين كبير بين الطلاب (انحراف معياري مرتفع): يُوصى بالتعليم المتمايز وتقسيم الطلاب إلى مجموعات حسب المستوى.");
  const sm = others.filter(o => o.id !== rec.id).map(o => stats(o).mean).filter(v => v != null);
  if (sm.length) { const a = sm.reduce((x, y) => x + y, 0) / sm.length; L.push(S.mean >= a ? `أداء الفصل أعلى من متوسط بقية الفصول (${Math.round(a)}٪) بفارق ${Math.round(S.mean - a)} نقطة.` : `أداء الفصل أقل من متوسط بقية الفصول (${Math.round(a)}٪) بفارق ${Math.round(a - S.mean)} نقطة — يُوصى بتبادل الخبرات مع معلمي الفصول الأعلى.`); }
  if (S.abs) L.push(`${S.abs} طالباً غائبون عن الاختبار: يُرصد لهم اختبار بديل.`);
  return L;
}

// ══════════ الصفحة الرئيسية ══════════
export function GradeBook({ api, me, admin = false }) {
  const by = (me && me.name) || "الإدارة"; const R = useRoster(api); const [toast, say] = useToast();
  const [tab, setTab] = useState("new"); const [all, setAll] = useState(null); const [T, setTT] = useState(null); const [staff, setStaff] = useState([]);
  const blank = () => ({ subj: "", teacher: admin ? "" : by, type: "", title: "", ck: "", max: 20, date: today(), marks: {} });
  const [f, setF] = useState(blank); const [raw, setRaw] = useState({}); const [view, setView] = useState(null); const [busy, setBusy] = useState(false);
  const [cs, setCs] = useState({ subj: "", type: "", g: "", ck: "" }); const [lq, setLq] = useState({ subj: "", type: "", ck: "", q: "" });
  const inputs = useRef([]);
  const load = async () => { const L = arr(await api.maGet(NODE)).sort((a, b) => (b.at || 0) - (a.at || 0)); setAll(L);
    // ترحيل الرصود القديمة إلى صفحات الطلاب (مرة واحدة لكل رصد)
    const old = L.filter(r => r && r.id && !r.ix).slice(0, 40); if (old.length) { const P = {}; old.forEach(r => { Object.assign(P, ixPatch(r)); P[`${NODE}/${r.id}/ix`] = 1; }); try { await api.fbPatch(P); } catch {} } };
  useEffect(() => { load(); api.TT().then(setTT).catch(() => {}); api.staff().then(s => setStaff(arr(s).map(x => x.name).filter(Boolean))).catch(() => {}); }, []);
  const teachers = useMemo(() => [...new Set([...(T && T.T ? T.T.map(n => String(n || "").replace(/\s*\(.*?\)\s*/g, "").trim()) : []), ...staff])].filter(Boolean).sort((a, b) => a.localeCompare(b, "ar")), [T, staff]);
  const subjects = useMemo(() => { const s = T && T.S ? T.S.map((x, i) => (T.SA && T.SA[i]) || x).filter(x => x && !/احتياط|نشاط|ريادة|انتظار/.test(x)) : []; return [...new Set([...s, ...SUBJ_STD, ...(all || []).map(r => r.subj)])].filter(Boolean); }, [T, all]);
  const ttTeacher = (ck, subj) => { if (!T || !T.C || !T.C[ck] || !subj) return ""; const re = subjRe(subj); const c = {}; arr(T.C[ck]).forEach(d => arr(d).forEach(x => { if (x && x[0] >= 0 && x[1] >= 0 && re.test(nrm((T.SA && T.SA[x[0]]) || T.S[x[0]]))) c[x[1]] = (c[x[1]] || 0) + 1; })); const top = Object.entries(c).sort((a, b) => b[1] - a[1])[0]; return top ? String(T.T[top[0]] || "").replace(/\s*\(.*?\)\s*/g, "").trim() : ""; };
  const myRec = r => admin || nrm(r.teacher) === nrm(by) || r.by === by;
  const set = (k, v) => setF(p => { const n = { ...p, [k]: v }; if ((k === "ck" || k === "subj") && admin) { const t = ttTeacher(n.ck, n.subj); if (t) n.teacher = t; } return n; });
  if (!all || !R.ready) return <div className="gb"><style>{CSS}</style><div className="gb-card" style={{ textAlign: "center", color: "#94a3b8", fontWeight: 800 }}>⏳ جارٍ التحميل…</div></div>;

  const S = f.ck ? R.studentsOf(f.ck) : []; const max = +f.max || 20;
  const marks = {}; let bad = 0; S.forEach(s => { const r = raw[s.id]; if (r === "غ") { marks[s.id] = "غ"; return; } const v = toNum(r); if (v == null) return; if (isNaN(v) || v < 0 || v > max) { bad++; return; } marks[s.id] = v; });
  const live = stats({ marks, max });
  const startEdit = r => { setF({ ...r }); const o = {}; Object.entries(obj(r.marks)).forEach(([k, v]) => { o[k] = v === "غ" ? "غ" : String(v); }); setRaw(o); setView(null); setTab("new"); };
  const save = async () => {
    if (!f.subj.trim() || !f.type.trim() || !f.ck || !f.teacher.trim()) { alert("أكمل البيانات: المادة • المعلم • نوع الاختبار • الفصل"); return; }
    if (bad) { alert(`توجد ${bad} درجة غير صحيحة (أكبر من ${max} أو غير رقمية) — صحّحها أولاً`); return; }
    if (!Object.keys(marks).length) { alert("لم تُرصد أي درجة"); return; }
    if (!f.id) { const dup = all.find(r => r.ck === f.ck && nrm(r.subj) === nrm(f.subj) && r.type === f.type && (r.title || "") === (f.title || "")); if (dup && !confirm(`يوجد رصد سابق لنفس المادة والنوع والفصل (${dAr(dup.date)}). هل تريد إنشاء رصد جديد؟ (للتعديل افتح السجل من «السجلات»)`)) return; }
    setBusy(true); const id = f.id || "g" + Date.now().toString(36); const names = {}; S.forEach(s => { if (marks[s.id] != null) names[s.id] = s.name; });
    const rec = { ...f, id, subj: f.subj.trim(), teacher: f.teacher.trim(), type: f.type.trim(), title: (f.title || "").trim(), max, marks, names, n: S.length, by: f.by || by, at: f.at || Date.now(), up: Date.now(), ix: 1 };
    const ok = await api.maPut(`${NODE}/${id}`, rec); try { await api.fbPatch(ixPatch(rec, all.find(x => x.id === id))); } catch {} setBusy(false); if (ok === false) { say("⚠️ حُفظ على الجهاز وسيُرفع عند عودة الاتصال"); }
    else say("✅ تم الحفظ والتحليل — ظهرت الدرجات في صفحات الطلاب وأولياء الأمور"); setAll(a => [rec, ...a.filter(x => x.id !== id)]); setView(rec); setF(blank()); setRaw({});
  };
  const del = async r => { if (!confirm(`حذف رصد ${r.subj} — ${r.type} — ${api.maClassName(r.ck)}؟`)) return; await api.maPut(`${NODE}/${r.id}`, null); try { const P = {}; Object.keys(obj(r.marks)).forEach(sid => { P[`${IX}/${r.ck}/${ixKey(sid)}/${r.id}`] = null; }); await api.fbPatch(P); } catch {} setAll(a => a.filter(x => x.id !== r.id)); setView(null); say("🗑️ تم الحذف"); };
  const othersOf = r => all.filter(o => nrm(o.subj) === nrm(r.subj) && o.type === r.type && String(o.ck)[0] === String(r.ck)[0]).reduce((m, o) => { const c = m.find(x => x.ck === o.ck); if (!c || (o.date || "") > (c.date || "")) return [...m.filter(x => x.ck !== o.ck), o]; return m; }, []).sort((a, b) => a.ck.localeCompare(b.ck, "en", { numeric: true }));
  const prevOf = r => all.filter(o => o.id !== r.id && o.ck === r.ck && nrm(o.subj) === nrm(r.subj) && ((o.date || "") < (r.date || "") || ((o.date || "") === (r.date || "") && (o.at || 0) < (r.at || 0)))).sort((a, b) => (b.date || "").localeCompare(a.date || "") || (b.at || 0) - (a.at || 0))[0];

  // ── عرض تحليل سجل
  const Report = ({ r }) => { const s = stats(r); const mx = +r.max; const M = obj(r.marks); const nm = obj(r.names); const oth = othersOf(r); const pv = prevOf(r); const pm = pv ? obj(pv.marks) : null;
    const rows = Object.keys(M).map(sid => ({ sid, name: nm[sid] || "—", v: M[sid], p: typeof M[sid] === "number" ? M[sid] / mx * 100 : null, pp: pm && typeof pm[sid] === "number" ? pm[sid] / (+pv.max) * 100 : null })).sort((a, b) => (b.p ?? -1) - (a.p ?? -1));
    const omax = Math.max(1, ...oth.map(o => stats(o).mean || 0));
    return <div style={{ display: "grid", gap: 12 }}>
      <div className="gb-hero"><div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}><div style={{ flex: "1 1 260px" }}><div style={{ fontSize: 12.5, opacity: .85, fontWeight: 800 }}>{r.type} • {dAr(r.date)} • الدرجة من {ar(mx)}</div><b style={{ fontSize: 20 }}>{r.subj} — {api.maClassName(r.ck)}</b><div style={{ fontSize: 13, opacity: .9, fontWeight: 700 }}>👤 {r.teacher}{r.title ? ` • ${r.title}` : ""}</div></div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}><button className="gb-btn g" onClick={() => printRecord(api, r, R, oth, pv, by)}>🖨️ طباعة التقرير</button>{myRec(r) && <button className="gb-btn" onClick={() => startEdit(r)}>✏️ تعديل</button>}{(admin || r.by === by) && <button className="gb-btn red" onClick={() => del(r)}>🗑️</button>}</div></div></div>
      <div className="gb-kpis"><div className="gb-kpi"><b>{ar(s.n)}</b><small>رُصدت درجاتهم{s.abs ? ` • غ ${ar(s.abs)}` : ""}</small></div><div className="gb-kpi"><b>{f1(s.meanRaw)}</b><small>المتوسط من {ar(mx)} ({f1(s.mean)}٪)</small></div><div className="gb-kpi"><b style={{ color: "#15803d" }}>{f1(s.pass)}٪</b><small>نسبة النجاح</small></div><div className="gb-kpi"><b style={{ color: GOLD }}>{f1(s.ex)}٪</b><small>نسبة التميز</small></div><div className="gb-kpi"><b>{f1(s.hi)}٪</b><small>أعلى</small></div><div className="gb-kpi"><b>{f1(s.lo)}٪</b><small>أدنى</small></div><div className="gb-kpi"><b>{f1(s.sd)}</b><small>الانحراف المعياري</small></div></div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 12 }}>
        <div className="gb-card"><b style={{ color: NAVY }}>📈 توزيع المستويات</b><div style={{ display: "grid", gap: 8, marginTop: 10 }}>{BANDS.map((b, i) => <div key={b.k} style={{ display: "grid", gridTemplateColumns: "90px 1fr 60px", gap: 8, alignItems: "center", fontSize: 13, fontWeight: 800 }}><span style={{ color: b.c }}>{b.t}</span><div className="gb-bar"><i style={{ width: `${s.n ? s.bands[i] / s.n * 100 : 0}%`, background: b.c }} /></div><span>{ar(s.bands[i])} ({ar(s.n ? Math.round(s.bands[i] / s.n * 100) : 0)}٪)</span></div>)}</div></div>
        <div className="gb-card"><b style={{ color: NAVY }}>📊 مقارنة الفصول ({r.type})</b>{oth.length < 2 ? <div className="gb-note" style={{ marginTop: 8 }}>ستظهر المقارنة عند رصد نفس الاختبار لفصول أخرى من الصف نفسه.</div> : <div className="gb-cols">{oth.map(o => { const m = stats(o).mean || 0; return <div key={o.id}><span>{f1(m)}٪</span><i style={{ height: `${m / omax * 82}%`, background: o.id === r.id ? `linear-gradient(180deg,${GOLD},#a16207)` : `linear-gradient(180deg,#1e3a8a,${NAVY})` }} /><span style={{ fontSize: 10.5, color: "#475569", marginTop: 3 }}>{api.maClassName(o.ck).replace(" متوسط", "")}</span></div>; })}</div>}</div>
      </div>
      <div className="gb-card"><b style={{ color: "#15803d" }}>💡 قراءة النتائج والتوصيات</b><ul style={{ margin: "6px 0 0", paddingInlineStart: 20, fontSize: 13.5, fontWeight: 700, lineHeight: 1.9 }}>{recs(s, r, oth).map((t, i) => <li key={i}>{t}</li>)}</ul></div>
      <div className="gb-card" style={{ overflowX: "auto", padding: 8 }}><table className="gb-tbl"><thead><tr><th>م</th><th>الطالب</th><th>الدرجة</th><th>النسبة</th><th>المستوى</th>{pv && <><th>السابق ({pv.type})</th><th>التغير</th></>}</tr></thead>
        <tbody>{rows.map((x, i) => <tr key={x.sid} style={x.p != null && x.p < 50 ? { background: "#fff7f7" } : null}><td>{ar(i + 1)}</td><td style={{ textAlign: "right", fontWeight: 800 }}>{x.name}</td><td><b>{x.p == null ? "غ" : f1(x.v)}</b></td><td>{x.p == null ? "—" : f1(x.p) + "٪"}</td><td><Lv p={x.p} /></td>{pv && <><td>{x.pp == null ? "—" : f1(x.pp) + "٪"}</td><td style={{ fontWeight: 900, color: x.p != null && x.pp != null ? (x.p >= x.pp ? "#15803d" : "#dc2626") : "#94a3b8" }}>{x.p != null && x.pp != null ? `${x.p >= x.pp ? "▲" : "▼"} ${f1(Math.abs(x.p - x.pp))}` : "—"}</td></>}</tr>)}</tbody></table></div>
      <div style={{ display: "flex", gap: 8, justifyContent: "center" }}><button className="gb-btn p" onClick={() => { setView(null); setTab("new"); }}>➕ رصد جديد</button><button className="gb-btn" onClick={() => { setView(null); setTab("list"); }}>📚 السجلات</button></div>
    </div>; };

  if (view) return <div className="gb" style={{ display: "grid", gap: 12 }}><style>{CSS}</style><div><button className="gb-btn sm" onClick={() => setView(null)}>→ رجوع</button></div><Report r={view} />{toast && <div style={{ position: "fixed", bottom: 18, left: "50%", transform: "translateX(-50%)", background: NAVY, color: "#fff", padding: "10px 18px", borderRadius: 14, fontWeight: 800, zIndex: 999 }}>{toast}</div>}</div>;

  // ── تبويب الرصد
  const newTab = () => <div style={{ display: "grid", gap: 12 }}>
    <div className="gb-card" style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}><b style={{ fontSize: 16, color: NAVY, flex: 1 }}>{f.id ? "✏️ تعديل رصد محفوظ" : "📝 بيانات الاختبار"}</b>{f.id && <button className="gb-btn sm" onClick={() => { setF(blank()); setRaw({}); }}>إلغاء التعديل</button>}</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 10 }}>
        <label className="gb-lbl">📚 المادة (اختر أو اكتب)<input className="gb-inp" list="gb-subj" value={f.subj} onChange={e => set("subj", e.target.value)} placeholder="مثال: رياضيات" /><datalist id="gb-subj">{subjects.map(s => <option key={s} value={s} />)}</datalist></label>
        <label className="gb-lbl">👤 معلم المادة<input className="gb-inp" list="gb-tch" value={f.teacher} onChange={e => set("teacher", e.target.value)} placeholder="اختر من أسماء المعلمين" /><datalist id="gb-tch">{teachers.map(s => <option key={s} value={s} />)}</datalist></label>
        <label className="gb-lbl">🗓️ تاريخ الاختبار<input className="gb-inp" type="date" value={f.date} onChange={e => set("date", e.target.value)} /></label>
        <label className="gb-lbl">🏷️ عنوان (اختياري)<input className="gb-inp" value={f.title} onChange={e => set("title", e.target.value)} placeholder="مثال: الوحدة الثانية" /></label>
      </div>
      <div className="gb-lbl">🧪 نوع الاختبار<div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{TYPES.map(t => <button key={t} type="button" className={`gb-chip ${f.type === t ? "on" : ""}`} onClick={() => set("type", t)}>{t}</button>)}<input className="gb-inp" style={{ width: 190, minHeight: 36 }} placeholder="نوع آخر… اكتبه" value={TYPES.includes(f.type) ? "" : f.type} onChange={e => set("type", e.target.value)} /></div></div>
      <div className="gb-lbl">🏫 الفصل<div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{R.classes.map(c => <button key={c.ck} type="button" className={`gb-chip ${f.ck === c.ck ? "on" : ""}`} onClick={() => { set("ck", c.ck); }}>{api.maClassName(c.ck)} <small style={{ opacity: .7 }}>({ar(R.studentsOf(c.ck).length)})</small></button>)}</div></div>
      <div className="gb-lbl">🎯 الدرجة العظمى للاختبار — من<div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>{MAXES.map(m => <button key={m} type="button" className={`gb-chip ${max === m ? "on" : ""}`} style={{ minWidth: 46, padding: "7px 8px", ...([10, 15, 20, 25, 30].includes(m) ? { borderColor: max === m ? NAVY : GOLD } : {}) }} onClick={() => set("max", m)}>{ar(m)}</button>)}</div></div>
    </div>
    {f.ck && <div className="gb-card" style={{ padding: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", padding: "4px 6px 10px" }}><b style={{ color: NAVY, flex: 1 }}>👥 طلاب {api.maClassName(f.ck)} ({ar(S.length)}) — اكتب الدرجة من {ar(max)} ثم Enter للانتقال</b>
        <button className="gb-btn sm" onClick={() => { const o = { ...raw }; S.forEach(s => { if (o[s.id] == null || o[s.id] === "") o[s.id] = "غ"; }); setRaw(o); }}>تعبئة الفارغ «غائب»</button><button className="gb-btn sm red" onClick={() => confirm("مسح جميع الدرجات المكتوبة؟") && setRaw({})}>مسح</button></div>
      <div style={{ overflowX: "auto", maxHeight: "62vh", overflowY: "auto" }}><table className="gb-tbl"><thead><tr><th>م</th><th>اسم الطالب</th><th>الدرجة / {ar(max)}</th><th>غائب</th><th>النسبة</th><th>المستوى</th></tr></thead>
        <tbody>{S.map((s, i) => { const r = raw[s.id]; const v = r === "غ" ? null : toNum(r); const isBad = r !== "غ" && v != null && (isNaN(v) || v < 0 || v > max); const p = v != null && !isBad ? v / max * 100 : null;
          return <tr key={s.id}><td>{ar(i + 1)}</td><td style={{ textAlign: "right", fontWeight: 800 }}>{s.name}</td>
            <td><input ref={el => inputs.current[i] = el} className={`gb-mk ${isBad ? "bad" : ""}`} inputMode="decimal" disabled={r === "غ"} value={r === "غ" ? "" : (r ?? "")} onChange={e => setRaw(o => ({ ...o, [s.id]: e.target.value }))} onKeyDown={e => { if (e.key === "Enter" || e.key === "ArrowDown") { e.preventDefault(); const nx = inputs.current[i + 1]; nx && nx.focus(); nx && nx.select(); } if (e.key === "ArrowUp") { e.preventDefault(); const pv = inputs.current[i - 1]; pv && pv.focus(); } }} placeholder="—" /></td>
            <td><button className={`gb-chip ${r === "غ" ? "on" : ""}`} style={{ padding: "4px 10px" }} onClick={() => setRaw(o => ({ ...o, [s.id]: o[s.id] === "غ" ? "" : "غ" }))}>غ</button></td>
            <td style={{ fontWeight: 800 }}>{p == null ? "—" : f1(p) + "٪"}</td><td>{r === "غ" ? <Lv p={null} /> : p == null ? (isBad ? <span style={{ color: "#dc2626", fontWeight: 900, fontSize: 12 }}>أكبر من {ar(max)}</span> : "—") : <Lv p={p} />}</td></tr>; })}</tbody></table></div>
    </div>}
    {f.ck && <div className="gb-sticky"><div className="gb-card" style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", padding: 10, background: "rgba(255,255,255,.97)" }}>
      <span style={{ fontWeight: 800, fontSize: 13 }}>رُصد <b>{ar(live.n + live.abs)}</b> من {ar(S.length)}</span><span style={{ fontWeight: 800, fontSize: 13 }}>المتوسط <b>{f1(live.meanRaw)}</b> ({f1(live.mean)}٪)</span><span style={{ fontWeight: 800, fontSize: 13, color: "#dc2626" }}>دون المستوى {ar(live.bands[4])}</span>{bad > 0 && <span style={{ fontWeight: 900, color: "#dc2626" }}>⚠️ {ar(bad)} درجة غير صحيحة</span>}
      <div className="gb-stk" style={{ flex: "1 1 160px" }}>{live.bands.map((n, i) => <i key={i} style={{ width: `${live.n ? n / live.n * 100 : 0}%`, background: BANDS[i].c }} />)}</div>
      <button className="gb-btn ok" style={{ fontSize: 16, padding: "12px 26px" }} disabled={busy} onClick={save}>{busy ? "⏳ جارٍ الحفظ…" : "💾 حفظ وتحليل"}</button></div></div>}
  </div>;

  // ── السجلات
  const listTab = () => { const L = all.filter(r => (admin || myRec(r)) && (!lq.subj || nrm(r.subj) === nrm(lq.subj)) && (!lq.type || r.type === lq.type) && (!lq.ck || r.ck === lq.ck) && (!lq.q || (r.teacher + r.title + r.subj).includes(lq.q)));
    return <div style={{ display: "grid", gap: 10 }}>
      <div className="gb-card" style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <select className="gb-inp" style={{ width: 170 }} value={lq.subj} onChange={e => setLq({ ...lq, subj: e.target.value })}><option value="">جميع المواد</option>{[...new Set(all.map(r => r.subj))].map(s => <option key={s}>{s}</option>)}</select>
        <select className="gb-inp" style={{ width: 160 }} value={lq.type} onChange={e => setLq({ ...lq, type: e.target.value })}><option value="">جميع الأنواع</option>{[...new Set(all.map(r => r.type))].sort((a, b) => typeOrd(a) - typeOrd(b)).map(s => <option key={s}>{s}</option>)}</select>
        <select className="gb-inp" style={{ width: 160 }} value={lq.ck} onChange={e => setLq({ ...lq, ck: e.target.value })}><option value="">جميع الفصول</option>{R.classes.map(c => <option key={c.ck} value={c.ck}>{api.maClassName(c.ck)}</option>)}</select>
        <input className="gb-inp" style={{ flex: "1 1 160px", width: "auto" }} placeholder="بحث بالمعلم أو العنوان" value={lq.q} onChange={e => setLq({ ...lq, q: e.target.value })} /></div>
      {!L.length ? <div className="gb-card" style={{ textAlign: "center", fontWeight: 800, color: "#64748b" }}>لا توجد سجلات محفوظة بعد</div> :
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(270px,1fr))", gap: 10 }}>{L.map(r => { const s = stats(r); const b = s.mean == null ? null : bandOf(s.mean);
          return <button key={r.id} className="gb-card" style={{ textAlign: "right", cursor: "pointer", fontFamily: "inherit", display: "grid", gap: 6, borderTop: `5px solid ${b ? b.c : "#94a3b8"}` }} onClick={() => setView(r)}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 6 }}><b style={{ color: NAVY, fontSize: 15.5 }}>{r.subj}</b><span className="gb-lv" style={{ background: "#fef3c7", color: "#92400e" }}>{r.type}</span></div>
            <div className="gb-note">{api.maClassName(r.ck)} • {dAr(r.date)} • من {ar(r.max)}<br />👤 {r.teacher}{r.title ? ` • ${r.title}` : ""}</div>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}><b style={{ fontSize: 20, color: b ? b.c : "#64748b" }}>{f1(s.mean)}٪</b><span className="gb-note">متوسط • نجاح {f1(s.pass)}٪ • {ar(s.n)} طالب</span></div>
            <div className="gb-stk">{s.bands.map((n, i) => <i key={i} style={{ width: `${s.n ? n / s.n * 100 : 0}%`, background: BANDS[i].c }} />)}</div>
          </button>; })}</div>}
    </div>; };

  // ── التحليل والمقارنة
  const cmpTab = () => { const subjL = [...new Set(all.filter(r => admin || myRec(r)).map(r => r.subj))]; const subj = cs.subj || subjL[0] || "";
    const base = all.filter(r => nrm(r.subj) === nrm(subj) && (!cs.g || String(r.ck)[0] === cs.g));
    const types = [...new Set(base.map(r => r.type))].sort((a, b) => typeOrd(a) - typeOrd(b));
    const latest = (ck, t) => base.filter(r => r.ck === ck && r.type === t).sort((a, b) => (b.date || "").localeCompare(a.date || ""))[0];
    const cks = [...new Set(base.map(r => r.ck))].sort((a, b) => a.localeCompare(b, "en", { numeric: true }));
    const typ = cs.type || types[types.length - 1] || ""; const bars = cks.map(ck => { const r = latest(ck, typ); return { ck, m: r ? stats(r).mean : null, r }; }).filter(x => x.m != null); const bmax = Math.max(1, ...bars.map(x => x.m));
    const subjAll = [...new Set(all.map(r => r.subj))].map(s => { const L = all.filter(r => r.subj === s); const ms = L.map(r => stats(r).mean).filter(v => v != null); return { s, n: L.length, m: ms.length ? ms.reduce((a, b) => a + b, 0) / ms.length : null }; }).sort((a, b) => (b.m ?? -1) - (a.m ?? -1));
    const prog = cs.ck ? base.filter(r => r.ck === cs.ck).sort((a, b) => (a.date || "").localeCompare(b.date || "") || (a.at || 0) - (b.at || 0)) : [];
    const pStu = cs.ck ? R.studentsOf(cs.ck) : [];
    const printCmp = () => api.print(`<section class="pg">${api.hdr(`تقرير مقارنة نتائج ${esc(subj)}`)}
      <h3>📊 متوسط الفصول (٪) حسب نوع الاختبار</h3><table><thead><tr><th>الفصل</th>${types.map(t => `<th>${esc(t)}</th>`).join("")}<th>التغير</th></tr></thead><tbody>${cks.map(ck => { const v = types.map(t => { const r = latest(ck, t); return r ? stats(r).mean : null; }); const a = v.filter(x => x != null); const d = a.length > 1 ? a[a.length - 1] - a[0] : null; return `<tr><td><b>${api.maClassName(ck)}</b></td>${v.map(x => `<td>${x == null ? "—" : f1(x) + "٪"}</td>`).join("")}<td style="color:${d == null ? "#94a3b8" : d >= 0 ? "#15803d" : "#dc2626"};font-weight:900">${d == null ? "—" : (d >= 0 ? "▲" : "▼") + f1(Math.abs(d))}</td></tr>`; }).join("")}</tbody></table>
      ${bars.length ? `<h3>📈 مقارنة الفصول في «${esc(typ)}»</h3><div class="cols">${bars.map(x => `<div><b>${f1(x.m)}٪</b><i style="height:${Math.max(3, x.m * 0.95)}px;background:${NAVY}"></i>${api.maClassName(x.ck)}</div>`).join("")}</div>` : ""}
      ${admin ? `<h3>📚 متوسط المواد على مستوى المدرسة</h3><table><thead><tr><th>المادة</th><th>عدد الرصود</th><th>المتوسط</th><th>المستوى</th></tr></thead><tbody>${subjAll.map(x => `<tr><td class="r"><b>${esc(x.s)}</b></td><td>${ar(x.n)}</td><td>${f1(x.m)}٪</td><td>${x.m == null ? "—" : lvHtml(x.m)}</td></tr>`).join("")}</tbody></table>` : ""}
      ${api.sig(by, "وكيل الشؤون التعليمية")}</section>`, `مقارنة ${subj}`, PCSS);
    if (!subjL.length) return <div className="gb-card" style={{ textAlign: "center", fontWeight: 800, color: "#64748b" }}>احفظ رصداً واحداً على الأقل لتظهر المقارنات</div>;
    return <div style={{ display: "grid", gap: 12 }}>
      <div className="gb-card" style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
        <select className="gb-inp" style={{ width: 180 }} value={subj} onChange={e => setCs({ ...cs, subj: e.target.value, type: "" })}>{subjL.map(s => <option key={s}>{s}</option>)}</select>
        <select className="gb-inp" style={{ width: 150 }} value={cs.g} onChange={e => setCs({ ...cs, g: e.target.value })}><option value="">جميع الصفوف</option><option value="1">الأول</option><option value="2">الثاني</option><option value="3">الثالث</option></select>
        <button className="gb-btn sm g" style={{ marginInlineStart: "auto" }} onClick={printCmp}>🖨️ طباعة المقارنة</button></div>
      <div className="gb-card" style={{ overflowX: "auto", padding: 8 }}><b style={{ color: NAVY, display: "block", padding: 6 }}>📊 متوسط الفصول (٪) عبر أنواع الاختبارات — {subj}</b><table className="gb-tbl"><thead><tr><th>الفصل</th>{types.map(t => <th key={t}>{t}</th>)}<th>التغير من الأول للأخير</th></tr></thead>
        <tbody>{cks.map(ck => { const v = types.map(t => { const r = latest(ck, t); return r ? stats(r).mean : null; }); const a = v.filter(x => x != null); const d = a.length > 1 ? a[a.length - 1] - a[0] : null;
          return <tr key={ck}><td style={{ fontWeight: 900 }}>{api.maClassName(ck)}</td>{v.map((x, i) => <td key={i}>{x == null ? "—" : <span className="gb-lv" style={{ background: bandOf(x).bg, color: bandOf(x).c }}>{f1(x)}٪</span>}</td>)}<td style={{ fontWeight: 900, color: d == null ? "#94a3b8" : d >= 0 ? "#15803d" : "#dc2626" }}>{d == null ? "—" : `${d >= 0 ? "▲" : "▼"} ${f1(Math.abs(d))}`}</td></tr>; })}</tbody></table></div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 12 }}>
        <div className="gb-card"><div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}><b style={{ color: NAVY, flex: 1 }}>📈 مقارنة الفصول</b>{types.map(t => <button key={t} className={`gb-chip ${typ === t ? "on" : ""}`} style={{ padding: "4px 10px", fontSize: 12 }} onClick={() => setCs({ ...cs, type: t })}>{t}</button>)}</div>
          {!bars.length ? <div className="gb-note">لا بيانات</div> : <div className="gb-cols">{bars.map(x => <div key={x.ck} style={{ cursor: "pointer" }} onClick={() => setView(x.r)}><span style={{ color: bandOf(x.m).c }}>{f1(x.m)}٪</span><i style={{ height: `${x.m / bmax * 82}%`, background: `linear-gradient(180deg,${bandOf(x.m).c},${NAVY})` }} /><span style={{ fontSize: 10.5, color: "#475569", marginTop: 3 }}>{api.maClassName(x.ck).replace(" متوسط", "")}</span></div>)}</div>}</div>
        {admin && <div className="gb-card"><b style={{ color: NAVY }}>📚 متوسط المواد على مستوى المدرسة</b><div style={{ display: "grid", gap: 7, marginTop: 10 }}>{subjAll.map(x => <div key={x.s} style={{ display: "grid", gridTemplateColumns: "minmax(0,130px) 1fr 52px", gap: 8, alignItems: "center", fontSize: 13, fontWeight: 800 }}><span>{x.s}</span><div className="gb-bar"><i style={{ width: `${x.m || 0}%`, background: x.m == null ? "#cbd5e1" : bandOf(x.m).c }} /></div><b>{f1(x.m)}٪</b></div>)}</div></div>}
      </div>
      <div className="gb-card" style={{ display: "grid", gap: 8 }}><div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}><b style={{ color: NAVY, flex: 1 }}>🧑‍🎓 تقدّم الطلاب عبر الاختبارات — {subj}</b><select className="gb-inp" style={{ width: 180 }} value={cs.ck} onChange={e => setCs({ ...cs, ck: e.target.value })}><option value="">اختر الفصل</option>{cks.map(ck => <option key={ck} value={ck}>{api.maClassName(ck)}</option>)}</select></div>
        {cs.ck && (prog.length < 1 ? <div className="gb-note">لا توجد رصود لهذا الفصل</div> : <div style={{ overflowX: "auto" }}><table className="gb-tbl"><thead><tr><th>الطالب</th>{prog.map(r => <th key={r.id} title={dAr(r.date)}>{r.type}{r.title ? ` – ${r.title}` : ""}</th>)}<th>الاتجاه</th></tr></thead>
          <tbody>{pStu.map(s => { const v = prog.map(r => { const m = obj(r.marks)[s.id]; return typeof m === "number" ? m / (+r.max) * 100 : null; }); const a = v.filter(x => x != null); const d = a.length > 1 ? a[a.length - 1] - a[0] : null;
            return <tr key={s.id}><td style={{ textAlign: "right", fontWeight: 800 }}>{s.name}</td>{v.map((x, i) => <td key={i} style={{ color: x == null ? "#cbd5e1" : bandOf(x).c, fontWeight: 900 }}>{x == null ? "—" : f1(x) + "٪"}</td>)}<td style={{ fontWeight: 900, color: d == null ? "#94a3b8" : d >= 0 ? "#15803d" : "#dc2626" }}>{d == null ? "—" : `${d >= 0 ? "▲ تحسّن" : "▼ تراجع"} ${f1(Math.abs(d))}`}</td></tr>; })}</tbody></table></div>)}
      </div>
    </div>; };

  // ── الطلاب المحتاجون لمعالجة (آخر رصد لكل مادة)
  const weakTab = () => { const lastBy = {}; all.filter(r => admin || myRec(r)).forEach(r => { const k = r.ck + "|" + nrm(r.subj); if (!lastBy[k] || (r.date || "") > (lastBy[k].date || "")) lastBy[k] = r; });
    const W = {}; Object.values(lastBy).forEach(r => Object.entries(obj(r.marks)).forEach(([sid, v]) => { if (typeof v !== "number") return; const p = v / (+r.max) * 100; if (p >= 50) return; const o = W[r.ck + sid] = W[r.ck + sid] || { sid, ck: r.ck, name: obj(r.names)[sid] || "—", L: [] }; o.L.push({ s: r.subj, p, t: r.type, teacher: r.teacher }); }));
    const L = Object.values(W).filter(x => !lq.ck || x.ck === lq.ck).sort((a, b) => b.L.length - a.L.length || a.ck.localeCompare(b.ck, "en", { numeric: true }));
    const pr = () => api.print(`<section class="pg">${api.hdr("الطلاب المحتاجون لخطط علاجية (أقل من ٥٠٪)")}<div class="kp"><div><b>${ar(L.length)}</b>طالباً</div><div><b>${ar(L.filter(x => x.L.length > 1).length)}</b>متدنٍ في أكثر من مادة</div><div><b>${ar(Object.keys(lastBy).length)}</b>رصداً محللاً</div><div><b>${ar(new Set(L.map(x => x.ck)).size)}</b>فصلاً</div></div>
      <table><thead><tr><th>م</th><th>الطالب</th><th>الفصل</th><th>عدد المواد</th><th>المواد والنسب والمعلم</th></tr></thead><tbody>${L.map((x, i) => `<tr><td>${ar(i + 1)}</td><td class="r"><b>${esc(x.name)}</b></td><td>${api.maClassName(x.ck)}</td><td><b style="color:${x.L.length > 1 ? "#dc2626" : "#d97706"}">${ar(x.L.length)}</b></td><td class="r" style="font-size:9.5px">${x.L.map(y => `${esc(y.s)} ${f1(y.p)}٪ (${esc(y.teacher || "")})`).join(" • ")}</td></tr>`).join("")}</tbody></table>${api.sig(by, "وكيل الشؤون التعليمية")}</section>`, "الطلاب المحتاجون لمعالجة", PCSS);
    return <div style={{ display: "grid", gap: 10 }}>
      <div className="gb-card" style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}><select className="gb-inp" style={{ width: 170 }} value={lq.ck} onChange={e => setLq({ ...lq, ck: e.target.value })}><option value="">جميع الفصول</option>{R.classes.map(c => <option key={c.ck} value={c.ck}>{api.maClassName(c.ck)}</option>)}</select><span className="gb-note" style={{ flex: 1 }}>يُعتمد آخر رصد لكل مادة في كل فصل • الحد: أقل من ٥٠٪</span><button className="gb-btn sm p" disabled={!L.length} onClick={pr}>🖨️ طباعة القائمة</button></div>
      {!L.length ? <div className="gb-card" style={{ textAlign: "center", fontWeight: 900, color: "#15803d" }}>✅ لا يوجد طلاب دون المستوى في آخر الرصود</div> :
        <div className="gb-card" style={{ overflowX: "auto", padding: 8 }}><table className="gb-tbl"><thead><tr><th>م</th><th>الطالب</th><th>الفصل</th><th>عدد المواد</th><th>المواد</th></tr></thead><tbody>{L.map((x, i) => <tr key={x.ck + x.sid} style={x.L.length > 1 ? { background: "#fff7f7" } : null}><td>{ar(i + 1)}</td><td style={{ textAlign: "right", fontWeight: 900 }}>{x.name}</td><td>{api.maClassName(x.ck)}</td><td><span className="gb-lv" style={{ background: x.L.length > 1 ? "#dc2626" : "#fef3c7", color: x.L.length > 1 ? "#fff" : "#92400e" }}>{ar(x.L.length)}</span></td><td style={{ textAlign: "right", fontSize: 12.5 }}>{x.L.map((y, j) => <span key={j} style={{ display: "inline-block", margin: 2, padding: "2px 8px", borderRadius: 8, background: "#fee2e2", color: "#b91c1c", fontWeight: 800 }}>{y.s} {f1(y.p)}٪</span>)}</td></tr>)}</tbody></table></div>}
    </div>; };

  return <div className="gb" style={{ display: "grid", gap: 12 }}><style>{CSS}</style>
    <div className="gb-tabs">{[["new", f.id ? "✏️ تعديل الرصد" : "📝 رصد الدرجات"], ["list", `📚 السجلات (${ar(all.filter(r => admin || myRec(r)).length)})`], ["cmp", "📊 التحليل والمقارنة"], ["weak", "⚠️ يحتاجون معالجة"]].map(([k, l]) => <button key={k} className={`gb-tab ${tab === k ? "on" : ""}`} onClick={() => setTab(k)}>{l}</button>)}</div>
    {tab === "new" && newTab()}{tab === "list" && listTab()}{tab === "cmp" && cmpTab()}{tab === "weak" && weakTab()}
    {toast && <div style={{ position: "fixed", bottom: 18, left: "50%", transform: "translateX(-50%)", background: NAVY, color: "#fff", padding: "10px 18px", borderRadius: 14, fontWeight: 800, zIndex: 999 }}>{toast}</div>}
  </div>;
}


// ══════════ درجات الطالب في صفحته وصفحة ولي أمره ══════════
// لكل اختبار مرصود: الدرجة • النسبة • عدد الأخطاء (الدرجات المفقودة) • المستوى — ومعها نتائج اختبار القراءة الجهرية
export function StudentMarks({ api, me }) {
  const [L, setL] = useState(null); const [RL, setRL] = useState([]); const [fs, setFs] = useState("");
  useEffect(() => { let on = true; (async () => {
    const m = obj(await api.maGet(`${IX}/${me.ck}/${ixKey(me.sid)}`)); const list = Object.entries(m).map(([id, x]) => ({ id, ...x })).filter(x => x && x.s).sort((a, b) => (b.d || "").localeCompare(a.d || "") || (b.at || 0) - (a.at || 0)); on && setL(list);
    try { const T = arr(await api.maGet(RD.TXT)); const out = []; await Promise.all(T.map(async t => { const r = await api.maGet(`${RD.RES}/${t.id}/${me.ck}_${ixKey(me.sid)}`); const fx = rdFixRec(r, rdTokens(t.body)); const tr = arr(fx && fx.tries).filter(x => x.m && !x.rej); if (tr.length) out.push({ t, last: tr[tr.length - 1], n: tr.length, first: tr[0] }); })); on && setRL(out.sort((a, b) => (b.last.at || 0) - (a.last.at || 0))); } catch {}
  })(); return () => { on = false; }; }, [me.sid, me.ck]);
  const box = { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 18, padding: 14, boxShadow: "0 10px 24px -22px rgba(11,37,69,.6)" };
  const cell = (v, l, c) => <div style={{ flex: "1 1 76px", textAlign: "center", background: "#f8fafc", borderRadius: 12, padding: "6px 4px" }}><b style={{ display: "block", fontSize: 19, fontWeight: 900, color: c || NAVY, lineHeight: 1.4 }}>{v}</b><small style={{ fontSize: 11, fontWeight: 800, color: "#64748b" }}>{l}</small></div>;
  if (!L) return <div style={{ ...box, textAlign: "center", color: "#94a3b8", fontWeight: 800 }}>⏳</div>;
  const subs = [...new Set(L.map(x => x.s))]; const F = L.filter(x => !fs || x.s === fs); const num = F.filter(x => typeof x.v === "number");
  const avg = num.length ? num.reduce((a, x) => a + x.v / x.mx * 100, 0) / num.length : null;
  const RLV = { a: ["متقن", "#15803d", "#dcfce7"], b: ["متمكن", "#0e7490", "#cffafe"], m: ["ضعف متوسط", "#d97706", "#fef3c7"], s: ["ضعف شديد", "#dc2626", "#fee2e2"] };
  return <div className="gb" style={{ display: "grid", gap: 10 }}><style>{CSS}</style>
    <div style={{ ...box, background: `linear-gradient(135deg,${NAVY},#1e3a8a)`, color: "#fff", display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
      <div style={{ flex: "1 1 200px" }}><b style={{ fontSize: 17 }}>📝 درجات الاختبارات</b><div style={{ fontSize: 12.5, fontWeight: 700, opacity: .85 }}>{ar(L.length)} اختباراً مرصوداً{avg != null ? ` • متوسط النسبة ${f1(avg)}٪` : ""}</div></div>
      {subs.length > 1 && <select className="gb-inp" style={{ width: 170, minHeight: 38 }} value={fs} onChange={e => setFs(e.target.value)}><option value="">جميع المواد</option>{subs.map(x => <option key={x}>{x}</option>)}</select>}</div>
    {!L.length && <div style={{ ...box, textAlign: "center", color: "#94a3b8", fontWeight: 800 }}>لم تُرصد درجات اختبارات بعد</div>}
    {F.map(x => { const ab = x.v === "غ"; const p = ab ? null : x.v / x.mx * 100; const b = p == null ? null : bandOf(p); const er = ab ? null : Math.max(0, Math.round((x.mx - x.v) * 100) / 100);
      return <div key={x.id} style={{ ...box, borderRight: `6px solid ${b ? b.c : "#94a3b8"}`, display: "grid", gap: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", alignItems: "center" }}><b style={{ fontSize: 15.5, color: NAVY }}>📚 {x.s} <span className="gb-lv" style={{ background: "#fef3c7", color: "#92400e" }}>{x.ty}</span></b><span style={{ fontSize: 12, fontWeight: 800, color: "#64748b" }}>{dAr(x.d)}{x.t ? ` • 👤 ${x.t}` : ""}</span></div>
        {x.ti && <div style={{ fontSize: 12.5, fontWeight: 700, color: "#475569" }}>{x.ti}</div>}
        {ab ? <div style={{ fontWeight: 900, color: "#b45309" }}>غائب عن الاختبار</div> : <>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{cell(<>{f1(x.v)}<small style={{ fontSize: 12, color: "#64748b" }}> / {ar(x.mx)}</small></>, "الدرجة", b.c)}{cell(f1(p) + "٪", "النسبة", b.c)}{cell(f1(er), "عدد الأخطاء", er ? "#dc2626" : "#15803d")}{cell(<span className="gb-lv" style={{ background: b.bg, color: b.c, fontSize: 13 }}>{b.t}</span>, "المستوى")}</div>
          <div className="gb-bar"><i style={{ width: `${p}%`, background: b.c }} /></div></>}
      </div>; })}
    {RL.length > 0 && <div style={{ ...box, display: "grid", gap: 8 }}><b style={{ fontSize: 15.5, color: NAVY }}>🎙️ اختبار القراءة الجهرية</b>
      {RL.map(({ t, last, n, first }) => { const M = last.m; const lv = RLV[M.lv] || RLV.s; const d = n > 1 ? M.score - first.m.score : null;
        return <div key={t.id} style={{ border: "1px solid #eef2f7", borderRadius: 14, padding: 10, display: "grid", gap: 6 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 6, flexWrap: "wrap" }}><b style={{ fontSize: 14 }}>📄 {t.title}</b><span className="gb-lv" style={{ background: lv[2], color: lv[1] }}>{lv[0]}</span></div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{cell(<>{ar(M.score)}<small style={{ fontSize: 12, color: "#64748b" }}> / ١٠٠</small></>, "الدرجة", lv[1])}{cell(ar(M.acc) + "٪", "دقة القراءة")}{cell(ar(M.errs), "عدد الأخطاء", M.errs ? "#dc2626" : "#15803d")}{cell(ar(M.wcpm), "كلمة/دقيقة")}</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>حذف {ar(M.c.d || 0)} • إبدال {ar(M.c.s || 0)} • ضبط {ar(M.c.t || 0)} • إضافة {ar(M.ins || 0)} • المحاولات {ar(n)}{d != null ? ` • ${d >= 0 ? "تحسّن" : "تراجع"} ${ar(Math.abs(d))} درجة` : ""}</div></div>; })}</div>}
  </div>;
}
