// ═══════════════════════════════════════════════════════════════════════
// 📋 ملف شواهد التقويم الخارجي — أداة التحقق من شواهد مؤشرات التقويم المدرسي (١٤٤٨هـ)
// وحدة مستقلة تُحمَّل عند فتح الصفحة فقط (لا تؤثر على سرعة الموقع)
// التخزين:
//   school-ext/cfg            = إعدادات الغلاف (المدرسة، المدير، العام، الإدارة)
//   school-ext/s/{iid}        = {st:{i:"y|p|n"}, av:{i:"y|p|n"}, nt:{i:""}, na, note, at, by}   (صغير)
//   school-ext/fm/{iid}/{fid} = بيانات الشاهد {n, k:img|pdf|link|site|doc, e, sz, u, sk, cnt, at, by}
//   school-ext/fd/{fid}       = محتوى الملف (يُحمَّل عند العرض أو الطباعة فقط)
// ═══════════════════════════════════════════════════════════════════════
import React, { useEffect, useMemo, useRef, useState } from "react";
import { EXT_IND } from "./extEvalData.js";

const NODE = "school-ext";
const obj = v => (v && typeof v === "object" ? v : {});
const arr = v => (Array.isArray(v) ? v : v && typeof v === "object" ? Object.values(v) : []);
const ar = n => String(n ?? "").replace(/\d/g, d => "٠١٢٣٤٥٦٧٨٩"[d]);
const esc = v => String(v ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const fid = () => "f" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const DOMS = [
  { n: "الإدارة المدرسية", c: "#1e3a8a", c2: "#3b82f6", ic: "🏛️" },
  { n: "التعليم والتعلم", c: "#0f766e", c2: "#14b8a6", ic: "📚" },
  { n: "نواتج التعلم", c: "#7c3aed", c2: "#a78bfa", ic: "🎓" },
  { n: "البيئة المدرسية", c: "#b45309", c2: "#f59e0b", ic: "🏫" },
];
const domOf = n => DOMS.find(d => d.n === n) || DOMS[0];
const ST = [["y", "متحقق", "#15803d", "#dcfce7", "✔"], ["p", "متحقق جزئي", "#b45309", "#fef3c7", "½"], ["n", "غير متحقق", "#b91c1c", "#fee2e2", "✖"]];
const AV = [["y", "موجود", "#0f766e", "#ccfbf1", "📁"], ["p", "موجود جزئياً", "#a16207", "#fef9c3", "½"], ["n", "غير موجود", "#64748b", "#f1f5f9", "∅"]];
// أقسام الموقع التي تصلح شواهد: [أيقونة، الاسم، الصفحة، عقدة العدّ، الوحدة]
const SRC = {
  ip: ["🎯", "خطة التحسين المدرسي (الاستمارة ١ و٢)", "ipadmin", "school-ip/w", "أسبوع"], termplan: ["🗓️", "الخطة الفصلية", "termplan"], meetings: ["👥", "الاجتماعات ومحاضرها", "meetings"],
  committee: ["🧩", "اجتماعات اللجان", "committeemeeting"], circ: ["📜", "التعاميم الإلكترونية وتوقيع المنسوبين", "circulars", "school-circ", "تعميم"], trep: ["📑", "التقارير الدورية للمعلمين ومنصة مدرستي", "trepadm", "school-trep/idx", "تقرير"],
  lead: ["🧭", "لوحة القائد", "staff:lead"], monthly: ["📑", "التقرير الشهري", "monthlyreport"], weekly: ["📅", "الخطة الأسبوعية", "weeklyplan", "school-wplan", "خطة"],
  activities: ["🎯", "الأنشطة", "activities"], gallery: ["🖼️", "معرض الأنشطة", "gallery"], broadcast: ["🎙️", "الإذاعة المدرسية", "broadcast"], ann: ["📣", "الإعلانات والأخبار", "announcements", "school-ann-items", "إعلان"],
  hd: ["📈", "سجل الانضباط اليومي للمعلمين (حضوري)", "hdisc", "school-hd-up", "رفع"], hfx: ["📨", "نماذج متابعة الدوام والمساءلة", "hfx", "school-hfx", "نموذج"], staffdisc: ["🏅", "متابعة انضباط المعلمين والإداريين", "staffdisc"],
  tasks: ["📌", "المهام اليومية للإداريين", "admtasks"], certs: ["🏆", "الشهادات الرقمية والتكريم", "certificates"], dplan: ["🛡️", "خطة وسجل الانضباط المدرسي", "dplan"],
  absx: ["📋", "تصنيف الغياب وتقرير الأعذار والتحذير", "absxadm", "school-pexcuses", "عذر"], mlate: ["⏰", "سجل التأخر الصباحي", "morninglate", "school-mlate-day", "يوم"], alrep: ["🔁", "الغياب والتأخر المتكرر والإنذارات", "alreport"],
  beh: ["📝", "الملاحظات السلوكية اليومية", "behavior"], conduct: ["🌟", "متابعة السلوك اليومي", "conduct"], att: ["✅", "الحضور اليومي للطلاب", "attendance", "school-mattend", "يوم رصد"],
  honor: ["🥇", "لوحة الشرف", "honorboard"], dailyquiz: ["❓", "الاختبار اليومي", "dailyquiz"], treasure: ["🗺️", "رحلة الكنز إلى نافس", "treasureadm"], plr: ["🤝", "مجتمعات التعلّم المهنية", "plcr"],
  peerx: ["🔄", "تبادل الزيارات بين المعلمين", "peerx"], pinbox: ["📨", "طلبات أولياء الأمور والتواصل", "parentinbox", "school-pinbox-idx", "طلب"], portals: ["🚪", "بوابة ولي الأمر والطالب", "portals"],
  surveys: ["📊", "الاستبيانات وقياس الرضا", "surveys"], messages: ["✉️", "رسائل الأهالي", "messages"], prolic: ["🎓", "الرخصة المهنية", "prolicense"], pgrec: ["📚", "سجل النمو المهني", "pgrec"],
  cv: ["👁️", "الزيارات الصفية", "classvisits"], perf: ["📋", "تقويم الأداء الوظيفي", "perfresults"], lv: ["📶", "سجل مستويات الطلاب وحصرها", "stulevels", "school-stlv", "سجل"], remedial: ["🩹", "الخطط العلاجية", "lessonrecommend"],
  nafes: ["🧠", "منصة نافس التدريبية", "nafes"], diag: ["🧪", "الاختبارات التشخيصية (قبلي/بعدي)", "diag"], prep: ["📘", "تحليل تحضير المعلمين", "prepadm", "school-prep", "أسبوع"],
  tt: ["🗓️", "الجدول المدرسي وحصص الانتظار", "timetable", "school-ttlog", "يوم"], strategies: ["💡", "الاستراتيجيات", "strategies"], stlog: ["🔐", "سجل دخول الطلاب للمنصات", "stlogins", "school-stlog", "يوم"],
  remote: ["🏠", "الدوام عن بعد والتحضير بالحصص", "staff:rmtadm"], readweak: ["📖", "حصر الضعف القرائي", "readweak"], formative: ["📝", "التقويم التكويني", "formative"], grade: ["📊", "تحليل درجات الطلاب", "gradeanalysis"],
  classify: ["🏷️", "تصنيف الطلاب", "studentclassify"], studentperf: ["📈", "متابعة أداء الطلاب", "studentperf"], nafsbooks: ["📚", "مراجع نافس — متابعة الإنجاز", "nafsbooks"], raffle: ["🎲", "سحب الطلاب", "raffle"],
  duty: ["🛡️", "الإشراف اليومي والمناوبة", "duty", "school-duty-rep", "تقرير"],
};
const CFG0 = { school: "مدرسة الأمير عبدالمجيد المتوسطة الأولى", principal: "فازع القرني", edu: "الإدارة العامة للتعليم بمحافظة جدة", year: "١٤٤٨هـ", stage: "المرحلة المتوسطة — بنين" };
// النسبة: متحقق = ١، جزئي = ٠٫٥ ، غير متحقق = ٠ (يُستبعد ما لا ينطبق وما لم يُقيَّم)
function score(I, s) { const st = obj(s.st); let a = 0, n = 0, c = { y: 0, p: 0, n: 0, u: 0 }; I.e.forEach((_, i) => { const v = st[i]; if (v === "y") { a += 1; n++; c.y++; } else if (v === "p") { a += .5; n++; c.p++; } else if (v === "n") { n++; c.n++; } else c.u++; }); return { pct: n ? Math.round(a / n * 100) : null, c, done: !c.u }; }
const lvl = p => p == null ? ["لم يُقيَّم", "#94a3b8"] : p >= 90 ? ["متميز", "#15803d"] : p >= 75 ? ["متقدم", "#0f766e"] : p >= 50 ? ["منطلق", "#b45309"] : ["بحاجة لدعم", "#b91c1c"];
const imgSmall = (src, max = 1600, q = .82) => new Promise(res => { const im = new Image(); im.onload = () => { const sc = Math.min(1, max / Math.max(im.width, im.height)); const c = document.createElement("canvas"); c.width = Math.round(im.width * sc); c.height = Math.round(im.height * sc); const g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height); g.drawImage(im, 0, 0, c.width, c.height); try { res(c.toDataURL("image/jpeg", q)); } catch { res(src); } }; im.onerror = () => res(src); im.src = src; });
const readUrl = f => new Promise((ok, no) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = no; r.readAsDataURL(f); });
const parseJSON = t => { const s = String(t || ""); const a = s.indexOf("{"), b = s.lastIndexOf("}"); if (a < 0 || b < a) return null; try { return JSON.parse(s.slice(a, b + 1)); } catch { return null; } };

const CSS = `
.xe{font-family:'Cairo','Tajawal',Tahoma,sans-serif;color:#0f172a;--nv:#0b2545;--gd:#c9a227}.xe *{box-sizing:border-box}
.xe-hero{position:relative;overflow:hidden;border-radius:26px;padding:20px 22px;color:#fff;background:radial-gradient(1200px 400px at 110% -40%,rgba(201,162,39,.35),transparent 60%),linear-gradient(135deg,#0b2545 0%,#13315c 55%,#134074 100%);box-shadow:0 18px 40px -18px rgba(11,37,69,.6)}
.xe-hero::after{content:"";position:absolute;inset:auto -60px -80px auto;width:260px;height:260px;border-radius:50%;border:38px solid rgba(255,255,255,.05)}
.xe-hero h1{margin:0;font-size:24px;font-weight:900;letter-spacing:-.3px}.xe-hero h1 em{font-style:normal;color:#f3d77a}
.xe-hero p{margin:4px 0 0;opacity:.85;font-weight:700;font-size:13px}
.xe-logos{display:flex;gap:10px;align-items:center}.xe-logos img{height:54px;background:#fff;border-radius:14px;padding:4px}
.xe-kp{display:grid;grid-template-columns:repeat(auto-fit,minmax(118px,1fr));gap:8px;margin-top:14px;position:relative;z-index:1}
.xe-kp>div{background:rgba(255,255,255,.09);border:1px solid rgba(255,255,255,.16);border-radius:16px;padding:9px 10px;backdrop-filter:blur(4px)}
.xe-kp b{display:block;font-size:22px;font-weight:900;line-height:1.15}.xe-kp small{font-weight:800;font-size:11.5px;opacity:.85}
.xe-ring{--p:0;--c:#22c55e;width:118px;height:118px;border-radius:50%;background:conic-gradient(var(--c) calc(var(--p)*1%),rgba(255,255,255,.14) 0);display:grid;place-items:center;flex-shrink:0}
.xe-ring>div{width:92px;height:92px;border-radius:50%;background:#0f2c52;display:grid;place-items:center;text-align:center}.xe-ring b{font-size:26px;font-weight:900;line-height:1}.xe-ring small{display:block;font-size:10.5px;font-weight:800;opacity:.85}
.xe-doms{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:10px}
.xe-dom{cursor:pointer;border:0;text-align:right;font:inherit;border-radius:20px;padding:12px 14px;background:#fff;box-shadow:0 6px 20px -12px rgba(15,23,42,.35);border-top:5px solid var(--c);display:grid;gap:6px;transition:.15s}
.xe-dom:hover{transform:translateY(-2px)}.xe-dom.on{outline:3px solid var(--c);outline-offset:2px}
.xe-bar{height:8px;border-radius:999px;background:#eef2f7;overflow:hidden}.xe-bar>i{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,var(--c),var(--c2))}
.xe-tool{display:flex;gap:8px;flex-wrap:wrap;align-items:center;background:#fff;border-radius:18px;padding:10px 12px;box-shadow:0 6px 18px -14px rgba(15,23,42,.4);position:sticky;top:0;z-index:5}
.xe-in{font:inherit;border:1.5px solid #e2e8f0;border-radius:12px;padding:7px 11px;font-weight:700;font-size:13.5px;background:#fff;min-width:0}
.xe-b{font:inherit;cursor:pointer;border:1.5px solid #e2e8f0;background:#fff;border-radius:12px;padding:7px 13px;font-weight:900;font-size:13px;white-space:nowrap;display:inline-flex;gap:5px;align-items:center;color:#0f172a}
.xe-b:hover{background:#f8fafc}.xe-b.pri{background:var(--nv);color:#fff;border-color:var(--nv)}.xe-b.gd{background:linear-gradient(135deg,#c9a227,#e8c766);color:#1e293b;border-color:#c9a227}.xe-b.sm{padding:3px 9px;font-size:12px;border-radius:10px}
.xe-b:disabled{opacity:.5;cursor:default}
.xe-card{background:#fff;border-radius:20px;box-shadow:0 8px 24px -16px rgba(15,23,42,.45);overflow:hidden;border:1px solid #eef2f7}
.xe-ch{display:grid;grid-template-columns:auto 1fr auto;gap:12px;align-items:center;padding:12px 14px;cursor:pointer;border-inline-start:6px solid var(--c)}
.xe-no{width:42px;height:42px;border-radius:14px;display:grid;place-items:center;font-weight:900;color:#fff;background:linear-gradient(135deg,var(--c),var(--c2));font-size:15px}
.xe-chip{display:inline-flex;align-items:center;gap:4px;border-radius:999px;padding:2px 10px;font-weight:900;font-size:11.5px;white-space:nowrap}
.xe-it{display:grid;grid-template-columns:1fr auto;gap:8px;padding:10px 14px;border-top:1px solid #f1f5f9;align-items:start}
.xe-it:nth-child(even){background:#fbfcfe}
.xe-seg{display:inline-flex;border:1.5px solid #e2e8f0;border-radius:12px;overflow:hidden}.xe-seg button{font:inherit;border:0;background:#fff;padding:4px 9px;font-weight:900;font-size:12px;cursor:pointer;color:#475569;white-space:nowrap}
.xe-seg button+button{border-inline-start:1px solid #e2e8f0}
.xe-ev{display:inline-flex;align-items:center;gap:5px;border:1px solid #e2e8f0;background:#fff;border-radius:10px;padding:3px 8px;font-size:12px;font-weight:800;cursor:pointer;max-width:100%}
.xe-ev span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:230px}
.xe-sg{display:grid;gap:8px;padding:12px 14px;background:linear-gradient(160deg,#fffbeb,#fff);border-top:1px dashed #fcd34d}
.xe-src{display:flex;gap:6px;align-items:center;border:1.5px solid #e2e8f0;border-radius:12px;padding:5px 9px;background:#fff;font-size:12.5px;font-weight:800}
.xe-ov{position:fixed;inset:0;z-index:900;background:rgba(15,23,42,.6);display:flex;align-items:center;justify-content:center;padding:10px}
.xe-md{background:#fff;border-radius:22px;width:min(560px,100%);max-height:92vh;overflow:auto;padding:16px;display:grid;gap:10px}
@media(max-width:640px){.xe-it{grid-template-columns:1fr}.xe-hero h1{font-size:19px}.xe-ring{width:96px;height:96px}.xe-ring>div{width:74px;height:74px}.xe-ring b{font-size:20px}}
`;

export function ExtEvalPage({ api, me }) {
  const by = (me && me.name) || "الإدارة";
  const [cfg, setCfg] = useState(null); const [S, setS] = useState({}); const [FM, setFM] = useState({}); const [ld, setLd] = useState(true);
  const [dom, setDom] = useState(""); const [q, setQ] = useState(""); const [flt, setFlt] = useState(""); const [open, setOpen] = useState({}); const [msg, setMsg] = useState("");
  const [cnt, setCnt] = useState(null); const [add, setAdd] = useState(null); const [pr, setPr] = useState(null); const [ed, setEd] = useState(null); const [ai, setAi] = useState({});
  const tm = useRef({});
  useEffect(() => { (async () => { const [c, s, fm] = await Promise.all([api.maGet(`${NODE}/cfg`), api.maGet(`${NODE}/s`), api.maGet(`${NODE}/fm`)]); setCfg({ ...CFG0, ...obj(c) }); setS(obj(s)); setFM(obj(fm)); setLd(false); })().catch(() => { setCfg(CFG0); setLd(false); }); }, []);
  const toast = t => { setMsg(t); setTimeout(() => setMsg(""), 2800); };
  const sOf = id => { const x = obj(S[id]); const I = EXT_IND.find(z => z.id === id); return { ...x, na: x.na != null ? x.na : (I && I.na ? 1 : 0) }; };
  const save = (id, patch) => { setS(o => { const n = { ...obj(o[id]), ...patch, at: Date.now(), by }; const all = { ...o, [id]: n }; clearTimeout(tm.current[id]); tm.current[id] = setTimeout(() => api.maPut(`${NODE}/s/${id}`, n).then(ok => !ok && toast("⚠️ تعذّر الحفظ")), 600); return all; }); };
  const setItem = (id, k, i, v) => { const s = sOf(id); const m = { ...obj(s[k]) }; if (m[i] === v) delete m[i]; else m[i] = v; save(id, { [k]: m }); };
  const files = id => Object.entries(obj(FM[id])).map(([k, v]) => ({ fid: k, ...obj(v) })).filter(x => x.n).sort((a, b) => (a.at || 0) - (b.at || 0));
  // الإحصاءات
  const stat = useMemo(() => { const D = {}; let tot = { a: 0, n: 0, y: 0, p: 0, no: 0, u: 0, ev: 0, ind: 0, done: 0 };
    EXT_IND.forEach(I => { const s = sOf(I.id); if (s.na) return; const r = score(I, s); const d = D[I.d] = D[I.d] || { a: 0, n: 0, ind: 0, done: 0 }; d.ind++; tot.ind++; if (r.done) { d.done++; tot.done++; }
      I.e.forEach((_, i) => { const v = obj(s.st)[i]; if (v) { const w = v === "y" ? 1 : v === "p" ? .5 : 0; d.a += w; d.n++; tot.a += w; tot.n++; } tot[v === "y" ? "y" : v === "p" ? "p" : v === "n" ? "no" : "u"]++; });
      tot.ev += files(I.id).length; });
    Object.values(D).forEach(d => { d.pct = d.n ? Math.round(d.a / d.n * 100) : null; }); tot.pct = tot.n ? Math.round(tot.a / tot.n * 100) : null; return { D, tot }; }, [S, FM]);
  // فحص أقسام الموقع (عدّ سطحي سريع لا يحمّل البيانات)
  const scan = async () => { setCnt({}); const ks = Object.entries(SRC).filter(([, v]) => v[3]); const out = {};
    await Promise.all(ks.map(async ([k, v]) => { try { const r = await fetch(`${api.fb}/school/${v[3]}.json?shallow=true`); const j = await r.json(); out[k] = j && typeof j === "object" ? Object.keys(j).length : 0; } catch { out[k] = null; } }));
    setCnt(out); toast("🔎 حُدّثت أعداد شواهد الموقع"); };
  useEffect(() => { if (!ld) scan(); }, [ld]);
  // إضافة شاهد
  const addFile = async (id, e, f) => { if (!f) return; const isPdf = /pdf/i.test(f.type) || /\.pdf$/i.test(f.name); const isImg = /^image\//.test(f.type);
    if (!isPdf && !isImg) { toast("⚠️ يُقبل الصور وملفات PDF فقط"); return; } if (isPdf && f.size > 4.5 * 1024 * 1024) { toast("⚠️ حجم PDF أكبر من ٤٫٥ ميجا — اضغطه أو قسّمه"); return; }
    toast("⏳ رفع الشاهد…"); let d = await readUrl(f); if (isImg) d = await imgSmall(d); const k = fid();
    const ok = await api.maPut(`${NODE}/fd/${k}`, { d }); if (!ok) { toast("⚠️ تعذّر الرفع"); return; }
    const m = { n: f.name.replace(/\.[^.]+$/, ""), k: isPdf ? "pdf" : "img", e, sz: Math.round(d.length * .75), at: Date.now(), by }; await api.maPut(`${NODE}/fm/${id}/${k}`, m);
    setFM(o => ({ ...o, [id]: { ...obj(o[id]), [k]: m } })); if (e >= 0 && !obj(sOf(id).av)[e]) setItem(id, "av", e, "y"); toast("✅ أُضيف الشاهد"); };
  const addMeta = async (id, m) => { const k = fid(); const v = { ...m, at: Date.now(), by }; await api.maPut(`${NODE}/fm/${id}/${k}`, v); setFM(o => ({ ...o, [id]: { ...obj(o[id]), [k]: v } })); if (m.e >= 0 && !obj(sOf(id).av)[m.e]) setItem(id, "av", m.e, "y"); toast("✅ أُضيف الشاهد"); };
  const delFile = async (id, f) => { if (!window.confirm(`حذف الشاهد «${f.n}»؟`)) return; await api.maPut(`${NODE}/fm/${id}/${f.fid}`, null); if (f.k === "img" || f.k === "pdf") api.maPut(`${NODE}/fd/${f.fid}`, null); setFM(o => { const x = { ...obj(o[id]) }; delete x[f.fid]; return { ...o, [id]: x }; }); };
  const view = async f => { if (f.k === "link") { window.open(f.u, "_blank"); return; } if (f.k === "site") { api.go(SRC[f.sk] ? SRC[f.sk][2] : ""); return; } if (f.k === "doc") return;
    const w = window.open("", "_blank"); const r = obj(await api.maGet(`${NODE}/fd/${f.fid}`)); if (!r.d) { w && w.close(); toast("⚠️ تعذّر فتح الملف"); return; }
    const b = await (await fetch(r.d)).blob(); const u = URL.createObjectURL(b); if (w) w.location = u; else window.open(u, "_blank"); };
  // اقتراح بالذكاء الاصطناعي
  const askAI = async I => { setAi(o => ({ ...o, [I.id]: { busy: 1 } }));
    const src = I.w.map(k => `${k}: ${SRC[k][1]}${cnt && cnt[k] != null ? ` (${cnt[k]} ${SRC[k][4] || "سجل"})` : ""}`).join("\n");
    const prompt = `أنت خبير في التقويم المدرسي الخارجي (هيئة تقويم التعليم والتدريب) والدليل الإجرائي والتنظيمي لمدارس التعليم العام في المملكة العربية السعودية.\nالمدرسة: ${cfg.school} (${cfg.stage}).\nالمجال: ${I.d} — المعيار: ${I.s}\nالمؤشر: ${I.i}\nدلالات التحقق:\n${I.e.map((x, i) => `${i}) ${x}`).join("\n")}\n\nأقسام موقع المدرسة الإلكتروني المتاحة كشواهد:\n${src || "لا يوجد"}\n\nالمطلوب: لكل دلالة تحقق اقترح ٢–٤ شواهد عملية محددة من واقع الدليل الإجرائي والتنظيمي (اسم الوثيقة/السجل/النموذج كما يُسمّى في المدارس)، واذكر مفاتيح أقسام الموقع المناسبة لها فقط من القائمة أعلاه (أو لا شيء إن لم يناسب). ثم نصيحتين قصيرتين لاستيفاء المؤشر. أعد JSON فقط.`;
    const schema = { type: "object", properties: { items: { type: "array", items: { type: "object", properties: { i: { type: "integer" }, docs: { type: "array", items: { type: "string" } }, site: { type: "array", items: { type: "string" } } }, required: ["i", "docs", "site"] } }, tips: { type: "array", items: { type: "string" } } }, required: ["items", "tips"] };
    try { const r = await fetch("/api/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ hash: me && me.hash, prompt, tag: "ext-" + I.id, max: 2500, schema, kind: "ip" }) });
      const ct = r.headers.get("content-type") || ""; if (ct.includes("json") || !r.ok) { let j = {}; try { j = await r.json(); } catch {} throw new Error(j.msg || "خدمة الذكاء الاصطناعي غير متاحة الآن"); }
      const rd = r.body.getReader(), dec = new TextDecoder(); let out = ""; for (;;) { const { done, value } = await rd.read(); if (done) break; out += dec.decode(value, { stream: true }); }
      const j = parseJSON(out); if (!j || !Array.isArray(j.items)) throw new Error("تعذّر قراءة الاقتراح"); setAi(o => ({ ...o, [I.id]: j })); setOpen(o => ({ ...o, [I.id]: 1 }));
    } catch (e) { setAi(o => ({ ...o, [I.id]: { err: e.message } })); } };

  if (ld || !cfg) return <div className="xe" style={{ padding: 40, textAlign: "center", fontWeight: 900, color: "#94a3b8" }}><style>{CSS}</style>⏳ تحميل ملف التقويم الخارجي…</div>;
  const L = EXT_IND.filter(I => (!dom || I.d === dom) && (!q || (I.i + I.s + I.e.join(" ")).includes(q.trim())) && (() => { const s = sOf(I.id); const r = score(I, s); if (flt === "todo") return !s.na && !r.done; if (flt === "noev") return !s.na && !files(I.id).length; if (flt === "n") return !s.na && (r.c.n > 0 || r.c.p > 0); if (flt === "na") return s.na; return true; })());
  const T = stat.tot; const RL = lvl(T.pct);
  return <div className="xe grid gap-3" dir="rtl" style={{ maxWidth: 1180, margin: "0 auto" }}><style>{CSS}</style>
    <div className="xe-hero"><div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap", position: "relative", zIndex: 1 }}>
      <div className="xe-ring" style={{ "--p": T.pct || 0, "--c": RL[1] === "#94a3b8" ? "#94a3b8" : "#22c55e" }}><div><b>{T.pct == null ? "—" : ar(T.pct) + "٪"}</b><small>جاهزية الملف</small></div></div>
      <div style={{ flex: 1, minWidth: 220 }}><h1>ملف شواهد <em>التقويم الخارجي</em></h1><p>{cfg.school} • {cfg.edu} • العام الدراسي {cfg.year}</p><p>مدير المدرسة: <b>أ. {cfg.principal}</b></p></div>
      <div className="xe-logos">{api.moeLogo && <img src={api.moeLogo} alt="" />}{(cfg.logo || api.logo) && <img src={cfg.logo || api.logo} alt="" />}</div></div>
      <div className="xe-kp">{[["المؤشرات", T.ind, `اكتمل تقييم ${ar(T.done)}`], ["✔ متحقق", T.y, "دلالة"], ["½ جزئي", T.p, "دلالة"], ["✖ غير متحقق", T.no, "دلالة"], ["لم تُقيَّم", T.u, "دلالة"], ["📎 الشواهد", T.ev, "ملف ورابط"]].map(([l, v, s]) => <div key={l}><small>{l}</small><b>{ar(v)}</b><small>{s}</small></div>)}</div></div>
    <div className="xe-doms">{DOMS.map(d => { const x = stat.D[d.n] || {}; return <button key={d.n} className={`xe-dom ${dom === d.n ? "on" : ""}`} style={{ "--c": d.c, "--c2": d.c2 }} onClick={() => setDom(dom === d.n ? "" : d.n)}>
      <div className="flex gap-2 items-center" style={{ display: "flex", gap: 8, alignItems: "center" }}><span style={{ fontSize: 24 }}>{d.ic}</span><b style={{ fontSize: 15, flex: 1 }}>{d.n}</b><b style={{ fontSize: 20, color: d.c }}>{x.pct == null ? "—" : ar(x.pct) + "٪"}</b></div>
      <div className="xe-bar"><i style={{ width: `${x.pct || 0}%` }} /></div><small style={{ fontWeight: 800, color: "#64748b" }}>{ar(x.ind || 0)} مؤشراً • اكتمل {ar(x.done || 0)} • {lvl(x.pct)[0]}</small></button>; })}</div>
    <div className="xe-tool"><input className="xe-in" style={{ flex: "1 1 200px" }} value={q} onChange={e => setQ(e.target.value)} placeholder="🔎 ابحث في المؤشرات ودلالات التحقق…" />
      <select className="xe-in" value={flt} onChange={e => setFlt(e.target.value)}><option value="">كل المؤشرات</option><option value="todo">لم يكتمل تقييمها</option><option value="noev">بلا شواهد مرفوعة</option><option value="n">فيها جزئي/غير متحقق</option><option value="na">لا ينطبق</option></select>
      <button className="xe-b" onClick={() => setOpen(o => Object.keys(o).length ? {} : Object.fromEntries(L.map(I => [I.id, 1])))}>{Object.keys(open).length ? "▲ طيّ الكل" : "▼ فتح الكل"}</button>
      <button className="xe-b" onClick={scan}>🔎 فحص شواهد الموقع</button><button className="xe-b" onClick={() => setEd({ ...cfg })}>⚙️ بيانات الغلاف</button>
      <button className="xe-b gd" style={{ marginInlineStart: "auto" }} onClick={() => setPr({ cover: 1, sum: 1, ind: 1, sg: 0, att: 0, only: dom || "" })}>🖨 طباعة الملف</button></div>
    {msg && <div style={{ position: "fixed", bottom: 18, insetInline: 0, margin: "0 auto", width: "fit-content", zIndex: 950, background: "#0b2545", color: "#fff", borderRadius: 999, padding: "8px 18px", fontWeight: 900, boxShadow: "0 10px 30px rgba(0,0,0,.3)" }}>{msg}</div>}
    {L.map(I => { const d = domOf(I.d); const s = sOf(I.id); const r = score(I, s); const F = files(I.id); const op = !!open[I.id]; const n = EXT_IND.indexOf(I) + 1; const lv = lvl(r.pct); const A = ai[I.id];
      return <div key={I.id} className="xe-card" style={{ "--c": d.c, "--c2": d.c2, opacity: s.na ? .62 : 1 }}>
        <div className="xe-ch" onClick={() => setOpen(o => { const x = { ...o }; if (x[I.id]) delete x[I.id]; else x[I.id] = 1; return x; })}>
          <div className="xe-no">{ar(n)}</div>
          <div style={{ minWidth: 0 }}><div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 3 }}><span className="xe-chip" style={{ background: d.c + "18", color: d.c }}>{d.ic} {I.d}</span><span className="xe-chip" style={{ background: "#fef3c7", color: "#92400e" }}>المعيار: {I.s}</span>{I.tag && <span className="xe-chip" style={{ background: "#fee2e2", color: "#b91c1c" }}>{I.tag}</span>}</div>
            <b style={{ fontSize: 14.5, lineHeight: 1.7 }}>{I.i}</b>
            {!s.na && <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 4, flexWrap: "wrap" }}><div className="xe-bar" style={{ width: 140 }}><i style={{ width: `${r.pct || 0}%` }} /></div><small style={{ fontWeight: 900, color: lv[1] }}>{r.pct == null ? "لم يُقيَّم" : `${ar(r.pct)}٪ • ${lv[0]}`}</small>
              <small style={{ fontWeight: 800, color: "#64748b" }}>✔{ar(r.c.y)} ½{ar(r.c.p)} ✖{ar(r.c.n)}{r.c.u ? ` • متبقٍ ${ar(r.c.u)}` : ""} • 📎 {ar(F.length)}</small></div>}</div>
          <span style={{ fontSize: 18, color: "#94a3b8" }}>{op ? "▲" : "▼"}</span></div>
        {op && <>
          <div style={{ display: "flex", gap: 6, alignItems: "center", padding: "6px 14px", background: "#f8fafc", borderTop: "1px solid #eef2f7", flexWrap: "wrap" }}>
            <label style={{ display: "flex", gap: 5, alignItems: "center", fontWeight: 800, fontSize: 12.5, cursor: "pointer" }}><input type="checkbox" checked={!!s.na} onChange={e => save(I.id, { na: e.target.checked ? 1 : 0 })} /> لا ينطبق على المدرسة</label>
            {!s.na && <><button className="xe-b sm" onClick={() => save(I.id, { st: Object.fromEntries(I.e.map((_, i) => [i, "y"])) })}>✔ الكل متحقق</button><button className="xe-b sm" onClick={() => save(I.id, { av: Object.fromEntries(I.e.map((_, i) => [i, "y"])) })}>📁 الكل موجود</button>
              <button className="xe-b sm" onClick={() => setAdd({ id: I.id, e: -1, I })}>➕ شاهد عام للمؤشر</button><button className="xe-b sm" disabled={A && A.busy} onClick={() => askAI(I)}>{A && A.busy ? "⏳ يقترح…" : "✨ اقترح الشواهد بالذكاء الاصطناعي"}</button></>}</div>
          {!s.na && I.lead && <div style={{ padding: "6px 14px 0", fontWeight: 900, fontSize: 12.5, color: "#475569" }}>{I.lead}</div>}
          {!s.na && I.e.map((x, i) => { const st = obj(s.st)[i], av = obj(s.av)[i]; const Fi = F.filter(f => f.e === i); const AI = A && Array.isArray(A.items) ? A.items.find(z => z.i === i) : null;
            return <div key={i} className="xe-it"><div style={{ minWidth: 0 }}><div style={{ fontWeight: 800, fontSize: 13.5, lineHeight: 1.85 }}><span style={{ color: d.c, fontWeight: 900 }}>{ar(i + 1)}.</span> {x}</div>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 4 }}>{Fi.map(f => <span key={f.fid} className="xe-ev" title={f.n} onClick={() => view(f)}>{f.k === "img" ? "🖼" : f.k === "pdf" ? "📄" : f.k === "link" ? "🔗" : f.k === "site" ? "🌐" : "🗂"}<span>{f.n}</span>{f.cnt != null && <small style={{ color: "#64748b" }}>({ar(f.cnt)})</small>}<b onClick={ev => { ev.stopPropagation(); delFile(I.id, f); }} style={{ color: "#b91c1c", marginInlineStart: 2 }}>×</b></span>)}
                <button className="xe-b sm" onClick={() => setAdd({ id: I.id, e: i, I })}>➕ شاهد</button></div>
              {AI && (AI.docs.length > 0 || AI.site.length > 0) && <div style={{ marginTop: 5, display: "flex", gap: 4, flexWrap: "wrap", alignItems: "center", fontSize: 11.5 }}><b style={{ color: "#7c3aed" }}>✨</b>{AI.docs.map(t => <button key={t} className="xe-b sm" style={{ borderColor: "#ddd6fe", color: "#5b21b6" }} title="اعتماده شاهداً (اسم وثيقة)" onClick={() => addMeta(I.id, { n: t, k: "doc", e: i })}>＋ {t}</button>)}{AI.site.filter(k => SRC[k]).map(k => <button key={k} className="xe-b sm" style={{ borderColor: "#bae6fd", color: "#0369a1" }} onClick={() => addMeta(I.id, { n: SRC[k][1], k: "site", sk: k, e: i, cnt: cnt ? cnt[k] : null })}>🌐 {SRC[k][1]}</button>)}</div>}
              <input className="xe-in" style={{ marginTop: 5, width: "100%", fontSize: 12.5, padding: "4px 9px" }} placeholder="ملاحظة (اختياري)" defaultValue={obj(s.nt)[i] || ""} onBlur={e => { const v = e.target.value.trim(); if (v === (obj(s.nt)[i] || "")) return; const m = { ...obj(s.nt) }; if (v) m[i] = v; else delete m[i]; save(I.id, { nt: m }); }} /></div>
              <div style={{ display: "grid", gap: 5, justifyItems: "end" }}><div className="xe-seg">{ST.map(([k, l, c, bg, ic]) => <button key={k} style={st === k ? { background: bg, color: c } : null} onClick={() => setItem(I.id, "st", i, k)}>{ic} {l}</button>)}</div>
                <div className="xe-seg">{AV.map(([k, l, c, bg, ic]) => <button key={k} style={av === k ? { background: bg, color: c } : null} onClick={() => setItem(I.id, "av", i, k)}>{ic} {l}</button>)}</div></div></div>; })}
          {!s.na && F.filter(f => f.e < 0).length > 0 && <div style={{ padding: "8px 14px", borderTop: "1px solid #f1f5f9", display: "flex", gap: 5, flexWrap: "wrap", alignItems: "center" }}><b style={{ fontSize: 12.5 }}>📎 شواهد عامة:</b>{F.filter(f => f.e < 0).map(f => <span key={f.fid} className="xe-ev" onClick={() => view(f)}>{f.k === "img" ? "🖼" : f.k === "pdf" ? "📄" : f.k === "link" ? "🔗" : f.k === "site" ? "🌐" : "🗂"}<span>{f.n}</span><b onClick={ev => { ev.stopPropagation(); delFile(I.id, f); }} style={{ color: "#b91c1c" }}>×</b></span>)}</div>}
          {!s.na && <div className="xe-sg">
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}><b style={{ fontSize: 13, color: "#92400e" }}>💡 شواهد مقترحة وفق الدليل الإجرائي:</b>{I.sg.map(t => <button key={t} className="xe-b sm" style={{ borderColor: "#fde68a" }} title="اعتماده شاهداً عاماً للمؤشر" onClick={() => addMeta(I.id, { n: t, k: "doc", e: -1 })}>＋ {t}</button>)}</div>
            {I.w.length > 0 && <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}><b style={{ fontSize: 13, color: "#0369a1" }}>🌐 من أعمال المدرسة في الموقع:</b>{I.w.filter(k => SRC[k]).map(k => { const v = SRC[k]; const c = cnt && cnt[k]; return <span key={k} className="xe-src"><span>{v[0]}</span>{v[1]}{c != null && v[3] && <b className="xe-chip" style={{ background: c ? "#dcfce7" : "#f1f5f9", color: c ? "#15803d" : "#94a3b8" }}>{c ? `${ar(c)} ${v[4]}` : "لا بيانات"}</b>}
              <button className="xe-b sm" title="فتح القسم" onClick={() => api.go(v[2])}>↗</button><button className="xe-b sm" title="اعتماده شاهداً" onClick={() => addMeta(I.id, { n: v[1], k: "site", sk: k, e: -1, cnt: c ?? null })}>＋</button></span>; })}</div>}
            {A && A.err && <div style={{ color: "#b91c1c", fontWeight: 800, fontSize: 12.5 }}>⚠️ {A.err}</div>}
            {A && Array.isArray(A.tips) && A.tips.length > 0 && <div style={{ fontSize: 12.5, fontWeight: 700, color: "#5b21b6" }}>✨ {A.tips.join(" • ")}</div>}
            <textarea className="xe-in" rows={2} style={{ width: "100%" }} placeholder="ملاحظة عامة على المؤشر (تظهر في الطباعة)" defaultValue={s.note || ""} onBlur={e => { if (e.target.value.trim() !== (s.note || "")) save(I.id, { note: e.target.value.trim() }); }} /></div>}
        </>}
      </div>; })}
    {!L.length && <div className="xe-card" style={{ padding: 30, textAlign: "center", fontWeight: 800, color: "#94a3b8" }}>لا توجد مؤشرات مطابقة</div>}
    {add && <AddEv a={add} cnt={cnt} onClose={() => setAdd(null)} onFile={f => { addFile(add.id, add.e, f); setAdd(null); }} onMeta={m => { addMeta(add.id, { ...m, e: add.e }); setAdd(null); }} />}
    {ed && <div className="xe-ov" onClick={() => setEd(null)}><div className="xe-md" onClick={e => e.stopPropagation()} dir="rtl"><b style={{ fontSize: 16 }}>⚙️ بيانات الغلاف والطباعة</b>
      {[["school", "اسم المدرسة"], ["principal", "مدير المدرسة"], ["edu", "إدارة التعليم"], ["year", "العام الدراسي"], ["stage", "المرحلة"]].map(([k, l]) => <label key={k} style={{ display: "grid", gap: 3, fontWeight: 800, fontSize: 13 }}>{l}<input className="xe-in" value={ed[k] || ""} onChange={e => setEd({ ...ed, [k]: e.target.value })} /></label>)}
      <label style={{ display: "grid", gap: 3, fontWeight: 800, fontSize: 13 }}>شعار المدرسة (اختياري — يحل محل الشعار الحالي)<input type="file" accept="image/*" onChange={async e => { const f = e.target.files[0]; if (!f) return; const d = await imgSmall(await readUrl(f), 420, .9); setEd(x => ({ ...x, logo: d })); }} /></label>
      {ed.logo && <div style={{ display: "flex", gap: 8, alignItems: "center" }}><img src={ed.logo} alt="" style={{ height: 56 }} /><button className="xe-b sm" onClick={() => setEd({ ...ed, logo: "" })}>إزالة</button></div>}
      <div style={{ display: "flex", gap: 8 }}><button className="xe-b pri" onClick={async () => { await api.maPut(`${NODE}/cfg`, ed); setCfg({ ...CFG0, ...ed }); setEd(null); toast("✅ حُفظت البيانات"); }}>💾 حفظ</button><button className="xe-b" onClick={() => setEd(null)}>إلغاء</button></div></div></div>}
    {pr && <PrintDlg pr={pr} setPr={setPr} onGo={o => { setPr(null); doPrint({ api, cfg, S: Object.fromEntries(EXT_IND.map(I => [I.id, sOf(I.id)])), files, stat, o, toast }); }} />}
  </div>;
}
function AddEv({ a, cnt, onClose, onFile, onMeta }) {
  const [u, setU] = useState(""); const [n, setN] = useState(""); const [tab, setTab] = useState("file");
  return <div className="xe-ov" onClick={onClose}><div className="xe-md" onClick={e => e.stopPropagation()} dir="rtl">
    <b style={{ fontSize: 16 }}>➕ إضافة شاهد</b><div style={{ fontSize: 12.5, fontWeight: 700, color: "#475569", lineHeight: 1.8 }}>{a.e >= 0 ? a.I.e[a.e] : `شاهد عام للمؤشر: ${a.I.i}`}</div>
    <div className="xe-seg" style={{ justifySelf: "start" }}>{[["file", "📎 ملف (صورة / PDF)"], ["link", "🔗 رابط"], ["site", "🌐 من الموقع"], ["doc", "🗂 اسم وثيقة"]].map(([k, l]) => <button key={k} style={tab === k ? { background: "#0b2545", color: "#fff" } : null} onClick={() => setTab(k)}>{l}</button>)}</div>
    {tab === "file" && <label className="xe-b pri" style={{ justifyContent: "center", padding: 14 }}>📤 اختر الملف من جهازك<input type="file" accept="image/*,application/pdf,.pdf" hidden onChange={e => onFile(e.target.files[0])} /></label>}
    {tab === "file" && <small style={{ color: "#64748b", fontWeight: 700 }}>الصور تُضغط تلقائياً • PDF حتى ٤٫٥ ميجا • تُحفظ منفصلة ولا تُحمَّل إلا عند فتحها أو طباعتها، فلا تؤثر على سرعة الموقع.</small>}
    {tab === "link" && <><input className="xe-in" placeholder="اسم الشاهد" value={n} onChange={e => setN(e.target.value)} /><input className="xe-in" dir="ltr" placeholder="https://drive.google.com/…" value={u} onChange={e => setU(e.target.value)} /><button className="xe-b pri" disabled={!/^https?:\/\//.test(u.trim())} onClick={() => onMeta({ n: n.trim() || u.trim(), k: "link", u: u.trim() })}>إضافة الرابط</button></>}
    {tab === "site" && <div style={{ display: "grid", gap: 5, maxHeight: "50vh", overflow: "auto" }}>{[...a.I.w, ...Object.keys(SRC).filter(k => !a.I.w.includes(k))].filter(k => SRC[k]).map((k, ix) => <button key={k} className="xe-b" style={{ justifyContent: "flex-start", borderColor: ix < a.I.w.length ? "#7dd3fc" : "#e2e8f0" }} onClick={() => onMeta({ n: SRC[k][1], k: "site", sk: k, cnt: cnt ? cnt[k] ?? null : null })}>{SRC[k][0]} {SRC[k][1]}{cnt && cnt[k] != null && SRC[k][3] ? <small style={{ color: "#15803d" }}> ({ar(cnt[k])} {SRC[k][4]})</small> : null}{ix < a.I.w.length && <small style={{ color: "#0369a1", marginInlineStart: "auto" }}>مقترح</small>}</button>)}</div>}
    {tab === "doc" && <><input className="xe-in" placeholder="اسم الوثيقة / السجل (مثال: محضر اجتماع لجنة التميز رقم ٣)" value={n} onChange={e => setN(e.target.value)} /><button className="xe-b pri" disabled={!n.trim()} onClick={() => onMeta({ n: n.trim(), k: "doc" })}>إضافة</button><small style={{ color: "#64748b", fontWeight: 700 }}>للشواهد الورقية الموجودة في ملف المدرسة — تظهر باسمها في الطباعة.</small></>}
    <button className="xe-b" onClick={onClose}>إغلاق</button></div></div>;
}
function PrintDlg({ pr, setPr, onGo }) {
  const C = (k, l) => <label style={{ display: "flex", gap: 6, alignItems: "center", fontWeight: 800, fontSize: 13.5, cursor: "pointer" }}><input type="checkbox" checked={!!pr[k]} onChange={e => setPr({ ...pr, [k]: e.target.checked ? 1 : 0 })} />{l}</label>;
  return <div className="xe-ov" onClick={() => setPr(null)}><div className="xe-md" onClick={e => e.stopPropagation()} dir="rtl"><b style={{ fontSize: 16 }}>🖨 طباعة ملف التقويم الخارجي (PDF)</b>
    {C("cover", "🎨 الغلاف (باسم المدرسة ومديرها وشعارها)")}{C("sum", "📊 صفحة الملخص وجاهزية المجالات")}{C("ind", "📋 جداول المؤشرات ودلالات التحقق (كالنموذج الرسمي)")}{C("sg", "💡 إظهار الشواهد المقترحة غير المرفقة")}{C("att", "🖼 ملحق الشواهد المرفقة (الصور وصفحات PDF)")}
    <label style={{ display: "grid", gap: 3, fontWeight: 800, fontSize: 13 }}>المجال<select className="xe-in" value={pr.only} onChange={e => setPr({ ...pr, only: e.target.value })}><option value="">جميع المجالات</option>{DOMS.map(d => <option key={d.n} value={d.n}>{d.n}</option>)}</select></label>
    <small style={{ color: "#64748b", fontWeight: 700 }}>اختر «حفظ بصيغة PDF» من نافذة الطباعة لإرفاقه في ملف التسجيل الخارجي.</small>
    <div style={{ display: "flex", gap: 8 }}><button className="xe-b gd" onClick={() => onGo(pr)}>🖨 إنشاء الملف</button><button className="xe-b" onClick={() => setPr(null)}>إلغاء</button></div></div></div>;
}
// ══════════ الطباعة ══════════
const P_CSS = `@page{size:A4;margin:0}*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{margin:0;font-family:Cairo,Tahoma,sans-serif;color:#0f172a;background:#cbd5e1}
.pg{width:210mm;min-height:297mm;margin:0 auto 6mm;background:#fff;position:relative;overflow:hidden;page-break-after:always;padding:12mm 12mm 16mm}.pg:last-child{page-break-after:auto}
.cv{padding:0;display:flex;flex-direction:column;background:linear-gradient(165deg,#0b2545 0%,#13315c 48%,#134074 100%);color:#fff}
.cv .tp{display:flex;justify-content:space-between;align-items:center;padding:14mm 14mm 0}.cv .tp img{height:30mm;background:#fff;border-radius:6mm;padding:2mm}
.cv .tp .gv{font-size:12.5px;line-height:1.9;font-weight:800;opacity:.92}
.cv .md{flex:1;display:flex;flex-direction:column;justify-content:center;padding:0 16mm;position:relative;z-index:1}
.cv .kick{display:inline-block;align-self:flex-start;background:rgba(201,162,39,.18);border:1px solid rgba(243,215,122,.6);color:#f3d77a;border-radius:999px;padding:2mm 6mm;font-weight:900;font-size:13px}
.cv h1{font-size:44px;line-height:1.25;margin:7mm 0 3mm;font-weight:900}.cv h1 em{font-style:normal;color:#f3d77a}
.cv h2{font-size:17px;font-weight:800;margin:0;opacity:.88}
.cv .line{width:60mm;height:4px;border-radius:9px;background:linear-gradient(90deg,#c9a227,#f3d77a);margin:8mm 0}
.cv .sch{font-size:25px;font-weight:900}.cv .mg{margin-top:4mm;font-size:16px;font-weight:800}.cv .mg b{color:#f3d77a}
.cv .rg{position:absolute;left:16mm;bottom:52mm;width:46mm;height:46mm;border-radius:50%;display:grid;place-items:center}.cv .rg>div{width:36mm;height:36mm;border-radius:50%;background:#0f2c52;display:grid;place-items:center;text-align:center}.cv .rg b{font-size:30px;display:block;line-height:1}.cv .rg small{font-size:11px;font-weight:800;opacity:.85}
.cv .ft{display:flex;justify-content:space-between;align-items:center;padding:6mm 14mm;background:rgba(0,0,0,.18);font-weight:800;font-size:12.5px}
.cv .deco{position:absolute;right:-40mm;bottom:-40mm;width:150mm;height:150mm;border-radius:50%;border:22mm solid rgba(255,255,255,.04)}
.cv .deco2{position:absolute;left:-30mm;top:60mm;width:90mm;height:90mm;border-radius:50%;border:12mm solid rgba(201,162,39,.08)}
.hd{display:flex;justify-content:space-between;align-items:center;border-bottom:2.5px solid #0b2545;padding-bottom:3mm;margin-bottom:4mm}.hd img{height:16mm}.hd .t{font-size:11px;font-weight:800;line-height:1.7}.hd .c{text-align:center}.hd .c b{display:block;font-size:15px;color:#0b2545}
.ft2{position:absolute;bottom:6mm;inset-inline:12mm;display:flex;justify-content:space-between;font-size:10px;color:#94a3b8;font-weight:800;border-top:1px solid #e2e8f0;padding-top:2mm}
h3{font-size:16px;color:#0b2545;margin:0 0 3mm;display:flex;gap:6px;align-items:center}h3::after{content:"";flex:1;height:2px;background:linear-gradient(90deg,#c9a227,transparent)}
.dm{display:grid;grid-template-columns:repeat(2,1fr);gap:4mm;margin-bottom:5mm}.dm>div{border-radius:5mm;padding:4mm;border:1.5px solid #e2e8f0;border-top:5px solid var(--c)}
.dm b{font-size:15px}.dm .p{font-size:28px;font-weight:900;color:var(--c);float:left}.br{height:7px;border-radius:9px;background:#eef2f7;overflow:hidden;margin:2mm 0}.br i{display:block;height:100%;background:var(--c)}
table{width:100%;border-collapse:collapse;font-size:11.5px}th{background:#0b2545;color:#fff;padding:2mm 1.5mm;font-weight:900}td{border:1px solid #cbd5e1;padding:1.6mm 2mm;vertical-align:middle}td.c{text-align:center}
.ib{page-break-inside:avoid;margin-bottom:5mm}
.ih{display:grid;grid-template-columns:1fr 1.1fr 2.6fr;border:1.5px solid #0b2545;border-radius:3mm;overflow:hidden;margin-bottom:2mm;font-size:12px}
.ih>div{padding:2mm 3mm;font-weight:800;line-height:1.7}.ih .d{color:#fff}.ih .s{background:#fbbf24;color:#422006}.ih .i{background:#fff}.ih i{font-style:normal;display:block;font-size:9.5px;opacity:.8}
.mk{font-size:15px;font-weight:900}.ok{color:#15803d}.pp{color:#b45309}.no{color:#b91c1c}
.ev{font-size:10px;color:#334155;font-weight:700;line-height:1.6}.ev span{display:inline-block;background:#f1f5f9;border-radius:2mm;padding:0 1.5mm;margin:.5mm}
.lg{display:flex;gap:4mm;font-size:10.5px;font-weight:800;margin-bottom:3mm;flex-wrap:wrap}
.ap{text-align:center}.ap img{max-width:100%;max-height:235mm;border:1px solid #e2e8f0;border-radius:2mm}
.sig{display:grid;grid-template-columns:repeat(3,1fr);gap:8mm;margin-top:10mm;text-align:center;font-weight:800;font-size:12.5px}.sig span{display:block;margin-top:12mm;color:#94a3b8}
@media print{body{background:#fff}.pg{margin:0}}`;
async function doPrint({ api, cfg, S, files, stat, o, toast }) {
  const logo = cfg.logo || api.logo || ""; const moe = api.moeLogo || "";
  const IND = EXT_IND.filter(I => !o.only || I.d === o.only);
  const now = (() => { try { return new Date().toLocaleDateString("ar-SA-u-ca-islamic-umalqura", { day: "numeric", month: "long", year: "numeric" }); } catch { return ""; } })();
  const hdr = `<div class="hd"><div class="t">المملكة العربية السعودية<br>وزارة التعليم<br>${esc(cfg.edu)}</div><div class="c">${logo ? `<img src="${logo}">` : ""}<b>ملف شواهد التقويم الخارجي</b></div><div class="t" style="text-align:left">${esc(cfg.school)}<br>العام الدراسي ${esc(cfg.year)}${moe ? `<br><img src="${moe}" style="height:10mm">` : ""}</div></div>`;
  const ft = () => `<div class="ft2"><span>${esc(cfg.school)} • مدير المدرسة: أ. ${esc(cfg.principal)}</span><span class="pn"></span></div>`;
  let h = "";
  const T = stat.tot; const ringC = T.pct == null ? "#94a3b8" : T.pct >= 75 ? "#22c55e" : "#f59e0b";
  if (o.cover) { h += `<section class="pg cv"><div class="deco"></div><div class="deco2"></div><div class="tp">${moe ? `<img src="${moe}">` : "<span></span>"}<div class="gv" style="text-align:center">المملكة العربية السعودية<br>وزارة التعليم<br>${esc(cfg.edu)}</div>${logo ? `<img src="${logo}">` : "<span></span>"}</div>
    <div class="md"><span class="kick">أداة التحقق من شواهد مؤشرات التقويم المدرسي</span><h1>ملف شواهد<br><em>التقويم الخارجي</em></h1><h2>المجالات • المعايير • المؤشرات • دلالات التحقق والشواهد</h2><div class="line"></div>
      <div class="sch">${esc(cfg.school)}</div><div class="mg">${esc(cfg.stage)}</div><div class="mg">مدير المدرسة: <b>أ. ${esc(cfg.principal)}</b></div></div>
    <div class="rg" style="background:conic-gradient(${ringC} ${(T.pct || 0)}%,rgba(255,255,255,.15) 0)"><div><b>${T.pct == null ? "—" : ar(T.pct) + "٪"}</b><small>جاهزية الملف</small></div></div>
    <div class="ft"><span>العام الدراسي ${esc(cfg.year)}</span><span>${esc(now)}</span></div></section>`; }
  if (o.sum) { const row = I => { const s = S[I.id]; const r = score(I, s); const n = EXT_IND.indexOf(I) + 1; const lv = lvl(r.pct); return `<tr><td class="c">${ar(n)}</td><td style="font-size:10.5px">${esc(I.i)}</td><td class="c" style="font-size:10px">${esc(I.s)}</td>${s.na ? `<td class="c" colspan="5" style="color:#94a3b8">لا ينطبق</td>` : `<td class="c ok">${ar(r.c.y)}</td><td class="c pp">${ar(r.c.p)}</td><td class="c no">${ar(r.c.n)}</td><td class="c">${ar(files(I.id).length)}</td><td class="c" style="font-weight:900;color:${lv[1]}">${r.pct == null ? "—" : ar(r.pct) + "٪"}</td>`}</tr>`; };
    const th = `<table><thead><tr><th>م</th><th style="text-align:right">المؤشر</th><th>المعيار</th><th>✔</th><th>½</th><th>✖</th><th>الشواهد</th><th>النسبة</th></tr></thead><tbody>`;
    const chunks = [IND.slice(0, 12)]; for (let i = 12; i < IND.length; i += 24) chunks.push(IND.slice(i, i + 24));
    chunks.forEach((C, ci) => { if (!C.length) return; h += `<section class="pg">${hdr}${ci === 0 ? `<h3>📊 ملخص جاهزية الملف</h3>
    <div class="lg"><span>طريقة الحساب: متحقق = ١ • متحقق جزئي = ٠٫٥ • غير متحقق = ٠ (يُستبعد ما لا ينطبق)</span></div>
    <div class="dm">${DOMS.filter(d => !o.only || d.n === o.only).map(d => { const x = stat.D[d.n] || {}; return `<div style="--c:${d.c}"><span class="p">${x.pct == null ? "—" : ar(x.pct) + "٪"}</span><b>${d.ic} ${d.n}</b><div class="br"><i style="width:${x.pct || 0}%"></i></div><small style="font-weight:800;color:#64748b">${ar(x.ind || 0)} مؤشراً • اكتمل تقييم ${ar(x.done || 0)} • ${lvl(x.pct)[0]}</small></div>`; }).join("")}</div>` : `<h3>📊 ملخص المؤشرات (تابع)</h3>`}
    ${th}${C.map(row).join("")}</tbody></table>${ft()}</section>`; }); }
  if (o.ind) { let body = "";
    IND.forEach(I => { const d = domOf(I.d); const s = S[I.id]; const F = files(I.id); const n = EXT_IND.indexOf(I) + 1;  const evOf = i => F.filter(f => f.e === i).map(f => `<span>${f.k === "img" ? "🖼" : f.k === "pdf" ? "📄" : f.k === "link" ? "🔗" : f.k === "site" ? "🌐" : "🗂"} ${esc(f.n)}${f.cnt ? ` (${ar(f.cnt)})` : ""}</span>`).join("");
      body += `<div class="ib" data-d="${esc(I.d)}"><div class="ih"><div class="d" style="background:${d.c}"><i>المجال</i>${esc(I.d)}</div><div class="s"><i>المعيار</i>${esc(I.s)}</div><div class="i"><i>المؤشر (${ar(n)})</i>${esc(I.i)}${I.tag ? ` <small style="color:#b91c1c">(${esc(I.tag)})</small>` : ""}</div></div>
        ${s.na ? `<div style="border:1.5px dashed #cbd5e1;border-radius:3mm;padding:3mm;text-align:center;font-weight:800;color:#64748b">لا ينطبق على المدرسة</div>` :
        `<table><thead><tr><th style="text-align:right;width:44%">دلالة التحقق${I.lead ? ` — ${esc(I.lead)}` : ""}</th><th style="width:8%">متحقق</th><th style="width:8%">متحقق جزئي</th><th style="width:8%">غير متحقق</th><th style="width:20%">الشاهد</th><th style="width:12%">ملاحظة</th></tr></thead><tbody>
        ${I.e.map((x, i) => { const v = obj(s.st)[i]; const av = obj(s.av)[i]; return `<tr><td>• ${esc(x)}</td><td class="c mk ok">${v === "y" ? "✔" : ""}</td><td class="c mk pp">${v === "p" ? "½" : ""}</td><td class="c mk no">${v === "n" ? "✖" : ""}</td><td class="ev">${evOf(i) || (av === "y" ? "موجود" : av === "p" ? "موجود جزئياً" : av === "n" ? "<span style='color:#b91c1c'>غير موجود</span>" : "")}</td><td class="ev">${esc(obj(s.nt)[i] || "")}</td></tr>`; }).join("")}
        ${F.filter(f => f.e < 0).length ? `<tr><td colspan="6" class="ev"><b>شواهد عامة: </b>${F.filter(f => f.e < 0).map(f => `<span>${f.k === "site" ? "🌐" : f.k === "link" ? "🔗" : f.k === "doc" ? "🗂" : "📎"} ${esc(f.n)}</span>`).join("")}</td></tr>` : ""}
        ${o.sg ? `<tr><td colspan="6" class="ev"><b>شواهد مقترحة: </b>${I.sg.map(t => `<span>${esc(t)}</span>`).join("")}</td></tr>` : ""}
        ${s.note ? `<tr><td colspan="6" class="ev"><b>ملاحظة: </b>${esc(s.note)}</td></tr>` : ""}</tbody></table>`}</div>`; });
    h += `<div id="flow">${body}</div>`; }
  if (o.att) { toast("⏳ تجهيز ملحق الشواهد…"); const L = IND.flatMap(I => files(I.id).filter(f => f.k === "img" || f.k === "pdf").map(f => ({ I, f })));
    for (const { I, f } of L) { const r = obj(await api.maGet(`${NODE}/fd/${f.fid}`)); if (!r.d) continue; let imgs = [];
      if (f.k === "img") imgs = [r.d]; else { try { imgs = await api.pdfImgs(await (await fetch(r.d)).blob(), { max: 6, w: 1100, q: .75 }); } catch { imgs = []; } }
      const n = EXT_IND.indexOf(I) + 1; imgs.forEach((im, k) => { h += `<section class="pg">${hdr}<div style="font-size:12px;font-weight:800;margin-bottom:3mm;color:#334155">📎 شاهد المؤشر (${ar(n)}): ${esc(I.i)}<br><span style="color:#0b2545">${esc(f.n)}${f.e >= 0 ? ` — ${esc(I.e[f.e])}` : ""}${imgs.length > 1 ? ` • صفحة ${ar(k + 1)} من ${ar(imgs.length)}` : ""}</span></div><div class="ap"><img src="${im}"></div>${ft()}</section>`; }); } }
  h += `<section class="pg">${hdr}<h3>✍️ الاعتماد</h3><p style="font-size:13.5px;line-height:2.2;font-weight:700">نشهد بأن ما ورد في هذا الملف من تقييم لدلالات التحقق وشواهد مرفقة يعكس واقع المدرسة، وقد أُعدّ للتقويم الخارجي للعام الدراسي ${esc(cfg.year)}.</p>
    <div class="sig"><div>رئيس فريق التميز / التقويم<span>..........................</span></div><div>وكيل المدرسة<span>..........................</span></div><div>مدير المدرسة<br><b>أ. ${esc(cfg.principal)}</b><span>..........................</span></div></div>${ft()}</section>`;
  api.print(`<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>ملف شواهد التقويم الخارجي — ${esc(cfg.school)}</title><link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;800;900&display=swap" rel="stylesheet"><style>${P_CSS}</style></head><body>${h}<template id="tph">${hdr}</template><template id="tpf">${ft()}</template><script>
(async()=>{try{await document.fonts.ready}catch(e){}await new Promise(r=>setTimeout(r,400));
const fl=document.getElementById('flow');if(fl){const B=[...fl.children];const H=document.getElementById('tph').innerHTML,F=document.getElementById('tpf').innerHTML;
const t=document.createElement('section');t.className='pg';document.body.appendChild(t);const MAX=t.getBoundingClientRect().height+1;t.remove();
let pg=null,bd=null,cd=null;const mk=()=>{pg=document.createElement('section');pg.className='pg';pg.innerHTML=H;bd=document.createElement('div');pg.appendChild(bd);pg.insertAdjacentHTML('beforeend',F);fl.parentNode.insertBefore(pg,fl);};
for(const b of B){if(!pg||b.dataset.d!==cd){mk();cd=b.dataset.d;}bd.appendChild(b);if(pg.getBoundingClientRect().height>MAX&&bd.children.length>1){b.remove();mk();bd.appendChild(b);}}fl.remove();}
const ar=n=>String(n).replace(/[0-9]/g,d=>"٠١٢٣٤٥٦٧٨٩"[d]);[...document.querySelectorAll('section.pg')].forEach((s,i)=>{const p=s.querySelector('.pn');if(p)p.textContent=ar(i+1);});
document.body.dataset.ready=1;setTimeout(()=>print(),300);})();
</script></body></html>`);
}
