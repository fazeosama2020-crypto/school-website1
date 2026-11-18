// ═══════════════════════════════════════════════════════════════════════════════
//  🚫 تقرير الطلاب الغائبين + الإحالة للموجه الطلابي
//  وفق قواعد السلوك والمواظبة لطلبة التعليم العام — الإصدار الخامس ١٤٤٧هـ (المادة ٣٤: الغياب بدون عذر)
//   • الوكيل: يختار اليوم (قديم أو حديث) ← يحدد الغائبين من كشوف الفصول ← يشعر ولي الأمر (يصل حساب الطالب)
//   • يحيل الطالب للموجه الطلابي بنموذج الإحالة ← الموجه يستلم ويعبّئ إفادته ← يُطبع نموذج إجراءات الغياب بدون عذر
//  البيانات: school-absref/{id} (الإحالات) • school-absproc/{sid}/{k} (تواريخ تنفيذ الإجراءات) • الغياب نفسه في كشوف الحضور (school-mattend)
// ═══════════════════════════════════════════════════════════════════════════════
import React, { useState, useEffect, useMemo } from "react";

const NREF = "school-absref", NPROC = "school-absproc";
const NAVY = "#0b2545", NAVY2 = "#13315c", GOLD = "#c9a227", TEAL = "#0f766e", RED = "#b91c1c";
const obj = v => (v && typeof v === "object" ? v : {});
const arr = v => (Array.isArray(v) ? v.filter(Boolean) : v && typeof v === "object" ? Object.values(v).filter(Boolean) : []);
const ar = n => String(n ?? "").replace(/\d/g, d => "٠١٢٣٤٥٦٧٨٩"[d]);
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const pad = n => String(n).padStart(2, "0");
const key = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const dt = k => { const [y, m, d] = String(k).split("-").map(Number); return new Date(y, m - 1, d, 12); };
const today = () => key(new Date());
const hij = k => { try { return dt(k).toLocaleDateString("ar-SA-u-ca-islamic-umalqura-nu-arab", { day: "numeric", month: "long", year: "numeric" }); } catch { return k; } };
const hijN = k => { try { return dt(k).toLocaleDateString("ar-SA-u-ca-islamic-umalqura-nu-arab", { day: "2-digit", month: "2-digit", year: "numeric" }).replace(/\s*هـ/, "") + "هـ"; } catch { return k; } };
const dayN = k => { try { return dt(k).toLocaleDateString("ar-SA", { weekday: "long" }); } catch { return ""; } };
const gre = k => { const [y, m, d] = String(k).split("-"); return `${ar(d)}/${ar(m)}/${ar(y)}م`; };
const yearStart = k => { const d = dt(k || today()); const y = d.getMonth() >= 7 ? d.getFullYear() : d.getFullYear() - 1; return `${y}-08-01`; };
const addD = (k, n) => { const d = dt(k); d.setDate(d.getDate() + n); return key(d); };
const when = t => { try { return new Date(t).toLocaleString("ar-SA", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }); } catch { return ""; } };

// ── المادة ٣٤ — إجراءات الغياب بدون عذر (الإصدار الخامس ١٤٤٧هـ) ──
export const RULES = [
  { k: "d1", n: 1, t: "يوم غياب", a: "التواصل مع ولي الأمر في يوم الغياب نفسه برسالة نصية أو اتصال للاستفسار عن سبب الغياب، وحسم درجة من المواظبة عن كل يوم غياب بدون عذر.", who: "وكيل شؤون الطلاب", c: "#0369a1", bg: "#e0f2fe" },
  { k: "s3", n: 3, t: "٣ أيام", a: "تحويل الطالب للموجه الطلابي لدراسة الحالة وتقديم الخدمات التربوية المناسبة له.", who: "وكيل شؤون الطلاب ← الموجه الطلابي", c: "#b45309", bg: "#fef3c7" },
  { k: "s3p", n: 3, t: "عند الاستمرار", a: "استدعاء ولي الأمر وإطلاعه على الخطة وتبعات استمرار الغياب، وأخذ التعهد الخطي على الطالب وولي أمره بالالتزام بالخطة المقدمة.", who: "الموجه الطلابي", c: "#c2410c", bg: "#ffedd5" },
  { k: "s5", n: 5, t: "٥ أيام", a: "استدعاء ولي الأمر لمناقشة أسباب الغياب، وإحالة الطالب إلى لجنة التوجيه الطلابي لمراجعة الخطة، وإشعار ولي الأمر بتبعات استمرار الغياب.", who: "وكيل شؤون الطلاب ولجنة التوجيه الطلابي", c: "#dc2626", bg: "#fee2e2" },
  { k: "s10", n: 10, t: "١٠ أيام", a: "مخاطبة المدرسة للجهات ذات الاختصاص حيال تطبيق نظام حماية الطفل ونظام الحماية من الإيذاء ولائحتيهما، مع إشعار إدارة التعليم بذلك ومتابعة الحالة.", who: "مدير المدرسة", c: "#9f1239", bg: "#ffe4e6" },
  { k: "cons", n: 0, t: "٣ أيام متصلة", a: "إذا كانت أيام الغياب بدون عذر متصلة (ثلاثة أيام فأكثر) تخاطب المدرسة الجهات ذات الاختصاص دون انتظار بلوغ عشرة أيام.", who: "مدير المدرسة", c: "#7f1d1d", bg: "#fecdd3" }];
const RK = Object.fromEntries(RULES.map(r => [r.k, r]));
const stageOf = s => s.u >= 10 ? "s10" : s.u >= 5 ? "s5" : s.u >= 3 ? "s3" : s.u >= 1 ? "d1" : "";
const STG = { "": ["—", "#64748b", "#f1f5f9"], d1: ["تواصل", "#0369a1", "#e0f2fe"], s3: ["إحالة للموجه", "#b45309", "#fef3c7"], s5: ["استدعاء ولجنة", "#dc2626", "#fee2e2"], s10: ["جهات الاختصاص", "#9f1239", "#ffe4e6"] };
const REASONS = ["صحية", "أسرية", "دراسية / تحصيلية", "سلوكية", "نفسية", "اجتماعية / رفاق", "بُعد السكن / المواصلات", "غير معروفة بعد"];
const CACTS = ["مقابلة الطالب فردياً", "دراسة حالة", "التواصل الهاتفي مع ولي الأمر", "استدعاء ولي الأمر ومقابلته", "أخذ التعهد الخطي على الطالب وولي أمره", "إعداد خطة علاجية / إرشادية", "إحالة الطالب للجنة التوجيه الطلابي", "التنسيق مع المعلمين لتعويض الفاقد", "تحويل لجهة مختصة (صحية / نفسية)"];

const CSS = `.ar{font-family:inherit;direction:rtl;color:#0f172a}.ar-card{background:#fff;border:1px solid #e2e8f0;border-radius:20px;padding:14px;box-shadow:0 14px 30px -26px rgba(15,23,42,.6)}
.ar-b{border:none;border-radius:13px;padding:9px 15px;font-family:inherit;font-weight:800;font-size:13.5px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;white-space:nowrap}.ar-b:disabled{opacity:.45;cursor:default}
.ar-nv{background:${NAVY};color:#fff}.ar-gd{background:${GOLD};color:${NAVY}}.ar-tl{background:${TEAL};color:#fff}.ar-rd{background:${RED};color:#fff}.ar-gh{background:#fff;color:#334155;border:1.5px solid #e2e8f0}.ar-pp{background:#6d28d9;color:#fff}
.ar-in{border:1.5px solid #e2e8f0;border-radius:12px;padding:8px 11px;font-family:inherit;font-size:14px;font-weight:700;background:#fff;color:#0f172a}
.ar-tab{border:1.5px solid #e2e8f0;background:#fff;border-radius:999px;padding:8px 16px;font-family:inherit;font-weight:800;font-size:13.5px;cursor:pointer;color:#334155;display:inline-flex;gap:6px;align-items:center}.ar-tab.on{background:${NAVY};color:#fff;border-color:${NAVY}}
.ar-tab i{font-style:normal;background:${RED};color:#fff;border-radius:999px;padding:0 7px;font-size:11.5px}.ar-chip{border-radius:999px;padding:2px 10px;font-size:12px;font-weight:800;display:inline-flex;align-items:center;gap:4px}
.ar-cls{border:1.5px solid #e2e8f0;background:#fff;border-radius:14px;padding:7px 12px;font-family:inherit;font-weight:800;font-size:13px;cursor:pointer;display:grid;text-align:center;min-width:76px}.ar-cls.on{border-color:${NAVY};background:${NAVY};color:#fff}.ar-cls b{font-size:17px}
.ar-st{display:flex;align-items:center;gap:10px;border:1.5px solid #e2e8f0;border-radius:14px;padding:9px 12px;background:#fff;cursor:pointer;transition:.15s}.ar-st.ab{border-color:#fca5a5;background:linear-gradient(90deg,#fff1f2,#fff)}.ar-st:hover{border-color:#94a3b8}
.ar-x{width:26px;height:26px;border-radius:8px;border:2px solid #cbd5e1;display:grid;place-items:center;font-weight:900;color:#fff;flex:0 0 auto}.ar-st.ab .ar-x{background:${RED};border-color:${RED}}
.ar-row{display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center;border:1px solid #e2e8f0;border-radius:16px;padding:10px 12px;background:#fff;border-inline-start:5px solid var(--c)}
.ar-hero{border-radius:24px;padding:18px 22px;color:#fff;background:linear-gradient(120deg,${NAVY},${NAVY2} 55%,#1d4e89);border-bottom:4px solid ${GOLD};display:flex;gap:14px;align-items:center;flex-wrap:wrap}
.ar-kp{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px}.ar-kp>div{border-radius:16px;padding:10px 12px;background:var(--b);color:var(--c)}.ar-kp b{font-size:24px;font-weight:900;display:block}.ar-kp small{font-weight:800;font-size:12px}
.ar-lad{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:8px}.ar-lad>div{border-radius:14px;padding:9px 11px;background:var(--b);border:1px solid var(--c)33}.ar-lad b{color:var(--c);font-size:13.5px}.ar-lad p{margin:4px 0 0;font-size:11.5px;font-weight:700;color:#334155;line-height:1.8}
.ar-ov{position:fixed;inset:0;z-index:950;background:rgba(15,23,42,.6);display:flex;align-items:flex-start;justify-content:center;padding:12px;overflow:auto}.ar-ov>div{width:min(760px,100%);margin:12px 0}
.ar-ck{display:flex;gap:8px;align-items:flex-start;font-size:13.5px;font-weight:700;padding:5px 0;cursor:pointer}.ar-ck input{width:17px;height:17px;margin-top:3px}`;

// ── قراءة الغياب: كشوف الحضور + تصنيف بعذر/بدون عذر ──
async function loadData(api, to) {
  const f = yearStart(to);
  const [ros, meta, att, ax] = await Promise.all([api.maGet(api.MA_ROSTER), api.maGet(api.MA_META), api.fbRange(api.MA_ATT, f, to), api.fbRange(api.ABSX, f, to).catch(() => ({}))]);
  const counts = meta && Array.isArray(meta.counts) ? meta.counts.map(n => +n || 0) : [6, 4, 4];
  const classes = api.classes(counts).map(c => c.ck); const S = {}; const R = obj(ros), X = obj(ax);
  classes.forEach(ck => arr(R[ck] && R[ck].students).filter(x => x.id && x.name).forEach(s => { S[s.id] = { sid: s.id, name: s.name, nh: s.nh || "", ck, abs: [], ex: [] }; }));
  const days = obj(att); Object.entries(days).forEach(([dk, day]) => Object.entries(obj(day)).forEach(([ck, r]) => arr(r && r.absent).forEach(a => { const o = S[a.id]; if (!o || o.abs.includes(dk)) return; o.abs.push(dk); if (obj(obj(X[dk])[a.id]).s === "e") o.ex.push(dk); })));
  Object.values(S).forEach(o => { o.abs.sort(); o.ud = o.abs.filter(d => !o.ex.includes(d)); o.u = o.ud.length; o.e = o.ex.length; });
  return { S, classes, ros: R, days, X, f };
}
// أطول سلسلة غياب بدون عذر متصلة (تتخطى أيام الإجازات)
function streak(ud, off, upTo) { const U = new Set(ud.filter(d => !upTo || d <= upTo)); let best = 0, cur = 0, lastEnd = ""; const L = [...U].sort();
  L.forEach(d => { let p = addD(d, -1), g = 0; while (g < 10 && off(p)) { p = addD(p, -1); g++; } cur = U.has(p) ? cur + 1 : 1; if (cur >= best) { best = cur; lastEnd = d; } }); return { best, end: lastEnd }; }

// ═══════════════ النماذج المطبوعة (A4) ═══════════════
const P_CSS = `@page{size:A4;margin:10mm}*{box-sizing:border-box}body{margin:0;font-family:"Traditional Arabic","Sakkal Majalla",Tahoma,Arial,sans-serif;color:#111;direction:rtl;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.pg{page-break-after:always;padding:2mm 3mm}.pg:last-child{page-break-after:auto}.hd{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;border-bottom:3px double ${NAVY};padding-bottom:6px;margin-bottom:8px}
.hd .r{font-size:13.5px;line-height:1.7;font-weight:bold}.hd .l{text-align:left;font-size:13px;line-height:1.7}.hd img{height:70px}.tt{text-align:center;margin:8px 0 10px}.tt b{display:inline-block;background:${NAVY};color:#fff;border-radius:10px;padding:6px 26px;font-size:19px}
.tt small{display:block;color:#555;font-size:12px;margin-top:4px}table{width:100%;border-collapse:collapse;font-size:13.5px;margin-bottom:8px}th,td{border:1px solid #333;padding:6px 7px;vertical-align:middle}th{background:#e8edf3;font-weight:bold}td.k{background:#f4f6f9;font-weight:bold;width:22%}
.sec{background:${NAVY};color:#fff;font-weight:bold;padding:5px 10px;border-radius:6px 6px 0 0;font-size:14px;margin-top:8px}.box{border:1px solid #333;border-top:none;padding:8px 10px;font-size:14px;line-height:2.1;margin-bottom:8px}
.dots{border-bottom:1px dotted #555;display:inline-block;min-width:120px}.ck{display:inline-block;width:13px;height:13px;border:1.4px solid #222;margin-inline-end:5px;vertical-align:middle;text-align:center;line-height:11px;font-size:11px}
.sg{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:10px;text-align:center;font-size:13.5px}.sg div{border:1px solid #999;border-radius:6px;padding:6px;min-height:70px}.sg b{display:block}.ft{font-size:10.5px;color:#555;border-top:1px solid #ccc;margin-top:8px;padding-top:4px;display:flex;justify-content:space-between}`;
const head = (api, title, sub) => `<div class="hd"><div class="r">المملكة العربية السعودية<br>وزارة التعليم<br>${esc(api.region || "")}<br>${esc(api.school || "")}</div><div>${api.moeLogo ? `<img src="${api.moeLogo}">` : ""}</div><div class="l">${api.logo ? `<img src="${api.logo}" style="height:58px"><br>` : ""}التاريخ: ${hijN(today())}</div></div><div class="tt"><b>${esc(title)}</b>${sub ? `<small>${sub}</small>` : ""}</div>`;
const doPrint = (api, title, body) => api.print(`<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>${esc(title)}</title><style>${P_CSS}</style></head><body>${body}<script>setTimeout(()=>window.print(),400)</script></body></html>`);
const REF_SRC = "قواعد السلوك والمواظبة لطلبة التعليم العام — الإصدار الخامس ١٤٤٧هـ — المادة (٣٤)";

// نموذج إحالة طالب للموجه الطلابي (الجزء الأول: الوكيل • الجزء الثاني: إفادة الموجه)
function refForm(api, R) { const C = obj(R.coun); const acts = arr(C.acts); const rs = arr(C.rs);
  const DL = arr(R.days); const dRows = Array.from({ length: Math.ceil(DL.length / 2) }, (_, r) => `<tr>${[0, 1].map(c => { const i = r * 2 + c, d = DL[i]; return d ? `<td style="text-align:center">${ar(i + 1)}</td><td>${dayN(d)}</td><td>${hijN(d)}</td><td>${gre(d)}</td>` : "<td></td><td></td><td></td><td></td>"; }).join("")}</tr>`).join("");
  return `<div class="pg">${head(api, "نموذج إحالة طالب للموجه الطلابي", "الغياب بدون عذر — " + REF_SRC)}
  <div class="sec">أولاً: بيانات الطالب</div><table style="margin:0"><tr><td class="k">اسم الطالب</td><td colspan="3"><b>${esc(R.name)}</b></td></tr><tr><td class="k">الصف / الفصل</td><td>${esc(R.cls)}</td><td class="k">تاريخ الإحالة</td><td>${dayN(R.dk)} ${hijN(R.dk)}</td></tr>
  <tr><td class="k">أيام الغياب بدون عذر</td><td><b>${ar(R.u)}</b> يوماً${R.cons >= 3 ? ` (منها ${ar(R.cons)} متصلة)` : ""}</td><td class="k">أيام الغياب بعذر</td><td>${ar(R.e || 0)}</td></tr></table>
  <div class="sec">ثانياً: سبب الإحالة (يعبّأ من وكيل شؤون الطلاب)</div><div class="box">المكرم الموجه الطلابي&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;وفقه الله<br>السلام عليكم ورحمة الله وبركاته،،، وبعد:<br>
  نحيل إليكم الطالب الموضح بياناته أعلاه لـ <span class="ck">✓</span>الغياب بدون عذر، ${DL.length ? `وذلك لغيابه بدون عذر ${DL.length === 1 ? "يوم" : "أيام"}: <b>${DL.map(d => `${dayN(d)} ${hijN(d)}`).join("، ")}</b>، وقد بلغ إجمالي غيابه بدون عذر (${ar(R.u)}) أيام حتى تاريخه،` : `حيث بلغ غيابه بدون عذر (${ar(R.u)}) أيام حتى تاريخه،`} وذلك تطبيقاً لما ورد في المادة (٣٤) من ${esc("قواعد السلوك والمواظبة")} (الإصدار الخامس) بتحويل الطالب للموجه الطلابي عند غيابه ثلاثة أيام بدون عذر؛ لدراسة حالته وتقديم الخدمات التربوية المناسبة له.<br>
  <b>الإجراءات التي اتُّخذت قبل الإحالة:</b> ${arr(R.prev).length ? arr(R.prev).map(x => esc(x)).join(" • ") : '<span class="dots" style="min-width:60%"></span>'}${R.note ? `<br><b>ملاحظات الوكيل:</b> ${esc(R.note)}` : ""}</div>
  ${DL.length ? `<div style="font-weight:bold;font-size:13px;margin-top:6px">${DL.length === 1 ? "يوم الغياب المُحال بسببه" : "أيام الغياب المُحال بسببها"}</div><table style="font-size:12.5px;margin-top:2px"><tr>${"<th style=\"width:5%\">م</th><th>اليوم</th><th>التاريخ الهجري</th><th>التاريخ الميلادي</th>".repeat(DL.length > 1 ? 2 : 1)}</tr>${DL.length > 1 ? dRows : `<tr><td style="text-align:center">١</td><td>${dayN(DL[0])}</td><td>${hijN(DL[0])}</td><td>${gre(DL[0])}</td></tr>`}</table>` : ""}
  <table><tr><td class="k">وكيل شؤون الطلاب</td><td><b>${esc(R.by || "")}</b></td><td class="k">التوقيع</td><td style="width:22%"></td></tr></table>
  <div class="sec">ثالثاً: إفادة الموجه الطلابي</div><div class="box">تم استلام الإحالة بتاريخ: ${C.rcvAt ? `<b>${dayN(key(new Date(C.rcvAt)))} ${hijN(key(new Date(C.rcvAt)))}</b>` : '<span class="dots"></span>'}<br>
  <b>أسباب الغياب كما ظهرت من دراسة الحالة:</b> ${REASONS.map(x => `<span class="ck">${rs.includes(x) ? "✓" : ""}</span>${x}`).join("&nbsp;&nbsp; ")}<br>
  <b>الإجراءات والخدمات المقدمة:</b><br>${CACTS.map(x => `<span class="ck">${acts.includes(x) ? "✓" : ""}</span>${x}`).join("&nbsp;&nbsp; ")}<br>
  <b>الخطة / التوصيات:</b> ${C.plan ? esc(C.plan) : '<span class="dots" style="min-width:75%"></span><br><span class="dots" style="min-width:95%"></span>'}<br>
  <b>نتيجة المتابعة:</b> ${C.res ? esc(C.res) : '<span class="dots" style="min-width:70%"></span>'}</div>
  <div class="sg"><div>الموجه الطلابي<b>${esc(C.by || "")}</b><br>التوقيع:</div><div>وكيل شؤون الطلاب<b>${esc(R.by || "")}</b><br>التوقيع:</div><div>مدير المدرسة<b>${esc(api.principal || "")}</b><br>التوقيع:</div></div>
  <div class="ft"><span>${REF_SRC}</span><span>رقم الإحالة: ${esc(R.id)}</span></div></div>`; }
// نموذج إجراءات الغياب بدون عذر (سجل الأيام + إجراءات المادة ٣٤ وتواريخ تنفيذها)
function procForm(api, s, P, R) { const pr = obj(P); const cell = (d, i) => d ? `<td style="text-align:center">${ar(i + 1)}</td><td>${dayN(d)}</td><td>${hijN(d)}</td><td>${s.ex.includes(d) ? "بعذر" : "<b>بدون عذر</b>"}</td>` : "<td></td><td></td><td></td><td></td>"; const rows = Array.from({ length: Math.ceil(s.abs.length / 2) }, (_, r) => `<tr>${cell(s.abs[r * 2], r * 2)}${cell(s.abs[r * 2 + 1], r * 2 + 1)}</tr>`).join("");
  const st = s.cons || 0;
  const lad = RULES.map(r => { const x = obj(pr[r.k]); const due = r.k === "cons" ? st >= 3 : s.u >= r.n && r.n > 0; return `<tr style="${due ? "background:#fff8e6" : ""}"><td style="text-align:center;font-weight:bold">${r.t}</td><td>${r.a}</td><td style="text-align:center">${r.who}</td><td style="text-align:center">${x.dk ? `${hijN(x.dk)}${x.by ? `<br><small>${esc(x.by)}</small>` : ""}` : due ? "<small style='color:#b45309'>مستحق</small>" : ""}</td><td style="width:13%"></td></tr>`; }).join("");
  return `<div class="pg">${head(api, "نموذج إجراءات الغياب بدون عذر", REF_SRC)}
  <table><tr><td class="k">اسم الطالب</td><td><b>${esc(s.name)}</b></td><td class="k">الصف / الفصل</td><td>${esc(api.className(s.ck))}</td></tr><tr><td class="k">أيام الغياب بدون عذر</td><td><b>${ar(s.u)}</b> يوماً</td><td class="k">أيام الغياب بعذر</td><td>${ar(s.e)} يوماً</td></tr>
  <tr><td class="k">أطول غياب متصل بدون عذر</td><td>${ar(st)} أيام</td><td class="k">حسم المواظبة</td><td>${ar(s.u)} درجة (درجة عن كل يوم)</td></tr></table>
  <div class="sec">سجل أيام الغياب (من ${hijN(s.f || yearStart())} حتى ${hijN(s.to || today())})</div><table style="margin-top:0;font-size:12.5px"><tr>${"<th style=\"width:5%\">م</th><th>اليوم</th><th>التاريخ</th><th>النوع</th>".repeat(2)}</tr>${rows || '<tr><td colspan="8" style="text-align:center">لا يوجد غياب مسجل</td></tr>'}</table>
  <div class="sec">الإجراءات المتخذة وفق المادة (٣٤)</div><table style="margin-top:0"><tr><th style="width:12%">عدد الأيام</th><th>الإجراء</th><th style="width:17%">المسؤول</th><th style="width:15%">تاريخ التنفيذ</th><th>التوقيع</th></tr>${lad}</table>
  ${R ? `<div style="font-size:13px;margin:4px 0">حالة الإحالة للموجه الطلابي: <b>${R.st === "done" ? "أُغلقت بإفادة الموجه" : R.st === "rcv" ? "استلمها الموجه — قيد المتابعة" : "مُرسلة — بانتظار الاستلام"}</b> (${hijN(R.dk)})</div>` : ""}
  <div style="font-size:12px;line-height:1.9;border:1px dashed #999;border-radius:6px;padding:6px 9px">• يُقدَّم العذر مع ما يثبته خلال ثلاثة أيام عمل من الغياب، ويُثبت العذر الصحي من منصة صحتي.&nbsp; • يُحرم الطالب إذا تجاوز غيابه بدون عذر ١٠٪ من أيام الدراسة (الانتقال للعام التالي في المرحلتين الابتدائية والمتوسطة).</div>
  <div class="sg"><div>وكيل شؤون الطلاب<br>التوقيع:</div><div>الموجه الطلابي<br>التوقيع:</div><div>مدير المدرسة<b>${esc(api.principal || "")}</b>التوقيع:</div></div>
  <div class="sg" style="grid-template-columns:1fr 1fr"><div>اطلعت — ولي أمر الطالب<br>الاسم والتوقيع:</div><div>الطالب<br>التوقيع:</div></div></div>`; }
// كشف الغائبين ليوم
function dayList(api, dk, L) { const rows = L.map((s, i) => `<tr><td>${ar(i + 1)}</td><td style="text-align:right"><b>${esc(s.name)}</b></td><td>${esc(api.className(s.ck))}</td><td>${s.ex.includes(dk) ? "بعذر" : "بدون عذر"}</td><td>${ar(s.u)}</td><td>${STG[stageOf(s)][0]}</td><td>${s.sent ? "✓" : ""}</td><td>${s.ref ? "✓" : ""}</td></tr>`).join("");
  return `<div class="pg">${head(api, "كشف الطلاب الغائبين", `${dayN(dk)} ${hij(dk)} — الموافق ${gre(dk)}`)}<table><tr><th style="width:6%">م</th><th>اسم الطالب</th><th>الفصل</th><th>نوع الغياب</th><th>غياب بدون عذر (العام)</th><th>الإجراء المستحق</th><th>إشعار ولي الأمر</th><th>إحالة للموجه</th></tr>${rows || '<tr><td colspan="8" style="text-align:center">لا يوجد غياب</td></tr>'}</table>
  <div class="sg" style="grid-template-columns:1fr 1fr"><div>وكيل شؤون الطلاب<br>التوقيع:</div><div>مدير المدرسة<b>${esc(api.principal || "")}</b>التوقيع:</div></div><div class="ft"><span>${REF_SRC}</span><span>عدد الغائبين: ${ar(L.length)}</span></div></div>`; }

// ═══════════════ النماذج الرسمية طبق الأصل — قواعد السلوك والمواظبة (الإصدار الخامس) ص٧٤ و ص٧٥ ═══════════════
//  school-absdoc/{sid}/{docId} = نسخة النموذج المعبّأة إلكترونياً + توقيعات الطالب وولي الأمر والمدير
export const NDOC = "school-absdoc";
export const MF_FONT = "https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;500;600;700&display=swap";
export const MF_CSS = `@page{size:A4;margin:0}html,body{margin:0;padding:0;background:#fff}*{box-sizing:border-box}
.mf{width:210mm;height:297mm;position:relative;overflow:hidden;background:#fff;color:#262626;font-family:"Noto Naskh Arabic","Traditional Arabic","Sakkal Majalla","Times New Roman",serif;direction:rtl;page-break-after:always;break-after:page;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.mf:last-child{page-break-after:auto;break-after:auto}.mf b.v{color:#0b2a5b;font-weight:700}
.mf .lg1{position:absolute;top:8.5mm;left:9.5mm;width:31.5mm}.mf .lgc{position:absolute;left:50%;transform:translateX(-50%);width:24.5mm}
.mf .hr{position:absolute;right:17.5mm;font-size:9.4pt;line-height:2.05;white-space:nowrap}.mf .hl{position:absolute;left:12mm;width:63mm;font-size:9.2pt;line-height:2.05;white-space:nowrap;text-align:right}
.mf .hl div{display:flex;align-items:baseline;gap:1mm;justify-content:flex-start}.mf .hl .fl{flex:1;font-size:8.2pt}
.mf .ttl{position:absolute;left:0;right:0;text-align:center;font-size:14.4pt;font-weight:500}
.mf .fl{display:inline-block;border-bottom:1.6px dotted #444;min-height:1.2em;line-height:1.25;padding:0 1.5mm;text-align:center;vertical-align:baseline;white-space:nowrap;overflow:hidden}
.mf .ln{position:absolute;right:17.5mm;left:21mm;display:flex;align-items:baseline;gap:1.5mm;font-size:10.7pt;white-space:nowrap}
.mf table{position:absolute;top:118.5mm;left:10.3mm;width:189.4mm;border-collapse:collapse;table-layout:fixed}
.mf th,.mf td{border:1.4px solid #d2d2d2;vertical-align:top}.mf th{height:18.2mm;font-size:8.3pt;font-weight:600;line-height:1.75;padding-top:2.4mm;text-align:center;border-bottom:3.5px solid #d4d4d4}
.mf td{height:17.4mm;font-size:8pt;line-height:1.7;padding:1.6mm 1.8mm;text-align:center}.mf td.k{text-align:right;font-weight:600;font-size:8.3pt;padding:2.4mm 3mm 0 0;line-height:1.75}
.mf td.a{text-align:right;color:#0b2a5b;font-weight:600;line-height:1.62}.mf td.a div{max-height:14.6mm;overflow:hidden}.mf td{max-height:17.4mm}.mf td.d,.mf td.n{color:#0b2a5b;font-weight:700;padding-top:4.5mm}.mf td.n{font-size:10.5pt}
.mf td img{max-width:100%;max-height:13.5mm;display:block;margin:0 auto}
.mf .sb{position:absolute;width:52mm;font-size:10.2pt}.mf .sb .t{text-align:center;margin-bottom:1.6mm;font-weight:500;padding-right:4mm}
.mf .sb .r{display:flex;align-items:baseline;height:9.15mm;position:relative}.mf .sb .r .fl{flex:1;font-size:8.4pt}
.mf .sb .r img{position:absolute;left:4mm;bottom:.4mm;height:12.5mm;max-width:40mm;object-fit:contain}
.mf .pn{position:absolute;left:21.5mm;top:281.5mm;font-size:10.5pt;color:#8a8a8a;font-family:Arial,Helvetica,sans-serif}
.mf .arc{position:absolute;left:31mm;right:-2mm;bottom:5.6mm;height:6mm;border:1px solid #9eb0b8;border-bottom:none;border-radius:4.5mm 0 0 0}
.mf .bar{position:absolute;left:19.5mm;right:0;bottom:1.6mm;height:4.6mm;border-radius:2.6mm 0 0 2.6mm;background:linear-gradient(90deg,#6dbf8b 0%,#55a99b 38%,#4f93ae 66%,#4b7fc2 100%);display:flex;align-items:center;justify-content:center;gap:1.4mm;color:#fff;font:600 6.3pt/1 Arial,Helvetica,sans-serif;letter-spacing:.55mm;direction:ltr}
.mf .bar i{width:2.9mm;height:2.9mm;border-radius:50%;background:radial-gradient(circle,#f5e6b8 30%,#c9a24a 75%);display:inline-block}`;
const A74 = {
  s3: "تحويل الطالب للموجه الطلابي لدراسة حالته وتقديم الخدمات التربوية المناسبة، والتواصل مع ولي الأمر.",
  s3p: " واستدعاء ولي الأمر وأخذ التعهد الخطي بالالتزام بالخطة.",
  cons: "مخاطبة الجهات ذات الاختصاص (نظام حماية الطفل ونظام الحماية من الإيذاء) وإشعار إدارة التعليم.",
  s5: "استدعاء ولي الأمر لمناقشة أسباب الغياب، وإحالة الطالب للجنة التوجيه الطلابي، وإشعار ولي الأمر بتبعات استمرار الغياب.",
  s10: "مخاطبة الجهات ذات الاختصاص حيال تطبيق نظام حماية الطفل ونظام الحماية من الإيذاء، وإشعار إدارة التعليم." };
export const ROWS74 = [["s3", "٣ أيام"], ["cons", "٣ أيام<br>متصلة"], ["s5", "٥ أيام"], ["s10", "١٠ أيام"]];
const hShort = k => k ? hijN(k) : "";
const fl = (v, st = "") => `<span class="fl" style="${st}">${v ? `<b class="v">${esc(v)}</b>` : ""}</span>`;
const sigTag = x => x && x.img ? `<img src="${x.img}" alt="">` : "";
const mfHead = (D, top) => `<div class="hr" style="top:${top + 4}mm">المملكة العربية السعودية<br>وزارة التعليـــــــــــــم</div>
  ${D.logo ? `<img class="lgc" style="top:${top}mm" src="${D.logo}" alt="">` : ""}
  <div class="hl" style="top:${top + 4}mm"><div>المنطقة/المحافظة${fl(D.gov)}</div><div>المدرسة ${fl(D.school)}</div></div>`;
const mfFoot = n => `<div class="pn">${n}</div><div class="arc"></div><div class="bar"><i></i>WWW.MOE.GOV.SA</div>`;
const sbBlock = (t, x, pos, img) => `<div class="sb" style="${pos}"><div class="t">${t}</div>
  <div class="r">الاسم:${fl(x.n)}</div><div class="r">التوقيع:${fl("")}${img ? `<img src="${img}" alt="">` : ""}</div><div class="r">التاريخ:${fl(x.dk ? hShort(x.dk) : "")}</div></div>`;
// صفحة واحدة A4 (HTML) — D.t: "p74" نموذج إجراءات الغياب بدون عذر • "plg" تعهد الالتزام بالحضور
export function mfPage(D, o = {}) { D = obj(D); const M = obj(D.m); const mImg = M.sig && o.mgrImg ? o.mgrImg : "";
  if (D.t === "plg") { const S = obj(D.s), G = obj(D.g);
    return `<div class="mf">${D.logo ? `<img class="lg1" src="${D.logo}" alt="">` : ""}${mfHead(D, 57.5)}
    <div class="ttl" style="top:94mm">تعهـــد الالتزام بالحضور</div>
    <div class="ln" style="top:118mm">أنا الطالب/الطالبة ${fl(D.name, "flex:1")}</div>
    <div class="ln" style="top:127.3mm">بالصف${fl(D.cls, "flex:1")}</div>
    <div class="ln" style="top:136.6mm;left:auto">أنني تغيبت عن الحضور للمدرسة بدون عذر لمدة ${fl(D.u ? ar(D.u) : "", "width:15mm")}أيام،&nbsp; بتاريخ ${fl(D.dts, `width:50mm;font-size:${String(D.dts || "").length > 34 ? 6.6 : String(D.dts || "").length > 24 ? 7.6 : 8.8}pt`)}</div>
    <div class="ln" style="top:145.9mm">وأتعهد بالالتزام بالخطة التربوية والعلاجية المقدمة لتحسين الحضور، وعلى ذلك جرى التوقيع.</div>
    ${sbBlock("الطالب/الطالبة", { n: S.n || D.name, dk: S.dk }, "top:190.5mm;right:18mm", S.img)}
    ${sbBlock("ولي الأمر", { n: G.n, dk: G.dk }, "top:190.5mm;right:78mm", G.img)}
    ${sbBlock("مدير/مديرة المدرسة", { n: M.n, dk: M.dk }, "top:189mm;right:138.5mm", mImg)}
    ${mfFoot(75)}</div>`; }
  const R = obj(D.rows);
  const tr = ROWS74.map(([k, t]) => { const r = obj(R[k]); return `<tr><td class="k">${t}</td><td class="a"><div style="font-size:${String(r.act || "").length > 170 ? 6.9 : String(r.act || "").length > 120 ? 7.6 : 8.3}pt">${esc(r.act || "")}</div></td><td class="d">${hShort(r.dk)}</td><td>${sigTag(r.s)}</td><td>${sigTag(r.g)}</td><td class="n">${r.ded !== "" && r.ded != null ? ar(r.ded) : ""}</td></tr>`; }).join("");
  return `<div class="mf">${D.logo ? `<img class="lg1" src="${D.logo}" alt="">` : ""}${mfHead(D, 46.5)}
  <div class="ttl" style="top:72.5mm">نموذج إجراءات الغياب بدون عذر</div>
  <div class="ln" style="top:91mm">اسم الطالب/ الطالبة: ${fl(D.name, "flex:1")}</div>
  <div class="ln" style="top:100.3mm">المرحلة: ${fl(D.stage, "width:49mm")}&nbsp;الصف:${fl(D.cls, "flex:1")}</div>
  <table><colgroup><col style="width:20.4mm"><col><col style="width:26.5mm"><col style="width:18.6mm"><col style="width:18.6mm"><col style="width:24.5mm"></colgroup>
  <tr><th>عدد أيام<br>الغياب</th><th>الإجراء المتخذ</th><th>تاريخ الإجراء</th><th>توقيع<br>الطالب</th><th>توقيع ولي<br>الأمر</th><th>عدد درجات<br>المواظبة<br>المحسومة</th></tr>${tr}</table>
  ${sbBlock("مدير/مديرة المدرسة", M, "top:241.5mm;left:22mm;width:54mm", mImg)}
  ${mfFoot(74)}</div>`; }
export const mfHtml = (pages, title, auto) => `<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>${esc(title || "نموذج")}</title><link rel="stylesheet" href="${MF_FONT}"><style>${MF_CSS}@media screen{body{background:#e5e7eb}.mf{margin:0 auto 6mm;box-shadow:0 2px 14px rgba(0,0,0,.18)}}</style></head><body>${pages}${auto ? `<script>(document.fonts&&document.fonts.ready?document.fonts.ready:Promise.resolve()).then(()=>setTimeout(()=>window.print(),300))</script>` : ""}</body></html>`;
// التوقيع: who = "s" الطالب • "g" ولي الأمر — في نموذج ٧٤ يوقَّع كل إجراء مُعبّأ لم يُوقَّع بعد
export const mfPending = (D, who) => D && (D.t === "p74" ? Object.values(obj(D.rows)).some(r => r && r.act && !obj(r[who]).img) : !obj(D[who]).img);
export function mfSign(D, who, img, n) { const x = JSON.parse(JSON.stringify(D)); const at = Date.now(), dk = today();
  if (x.t === "p74") Object.values(obj(x.rows)).forEach(r => { if (r && r.act && !obj(r[who]).img) r[who] = { img, at, ...(n ? { n } : {}) }; });
  else x[who] = { ...obj(x[who]), img, at, dk, ...(n ? { n } : {}) };
  return x; }
const lastDts = s => { const L = s.ud.slice(-2); return L.length ? L.map(hijN).join("، ") : ""; };
function p74Def(api, s, P0, old) { const P = obj(P0), O = obj(old), OR = obj(O.rows); const has = k => obj(P[k]).dk || "";
  const reach = { s3: s.u >= 3 || !!has("s3"), cons: (s.cons || 0) >= 3 || !!has("cons"), s5: s.u >= 5 || !!has("s5"), s10: s.u >= 10 || !!has("s10") };
  const rows = {}; ROWS74.forEach(([k]) => { const o = obj(OR[k]); const d = reach[k] ? { act: A74[k] + (k === "s3" && has("s3p") ? A74.s3p : ""), dk: has(k) || (k === "s3" ? has("s3p") : "") || (k !== "cons" ? s.ud[RK[k].n - 1] || "" : ""), ded: k === "cons" ? Math.max(3, s.cons || 0) : RK[k].n } : { act: "", dk: "", ded: "" };
    rows[k] = { ...d, ...(o.edited ? { act: o.act, dk: o.dk, ded: o.ded, edited: true } : {}), ...(o.s ? { s: o.s } : {}), ...(o.g ? { g: o.g } : {}) }; });
  return { gov: api.gov || "مكة المكرمة/جدة", school: api.school || "", stage: api.stage || "المتوسطة", m: { n: api.principal || "", dk: today(), sig: true }, ...O,
    t: "p74", id: "p74", sid: s.sid, nh: s.nh || "", name: s.name, cls: O.cls || api.className(s.ck), ck: s.ck, logo: api.moeLogo || "", u: s.u, rows }; }
function plgDef(api, s, old) { const O = obj(old); return { gov: api.gov || "مكة المكرمة/جدة", school: api.school || "", m: { n: api.principal || "", dk: today(), sig: true }, ...O,
  t: "plg", id: O.id || "plg" + Date.now().toString(36), sid: s.sid, nh: s.nh || "", name: s.name, ck: s.ck, cls: O.cls || api.className(s.ck), logo: api.moeLogo || "", u: O.u ?? s.u, dts: O.dts ?? lastDts(s), s: { n: s.name, ...obj(O.s) }, g: obj(O.g) }; }
// معاينة صفحة A4 داخل الشاشة (iframe مصغّر)
export function MfPreview({ D, mgrImg, max = 520 }) { const [w, setW] = useState(max); const ref = React.useRef(null);
  useEffect(() => { const el = ref.current; if (!el) return; const f = () => setW(Math.min(max, el.clientWidth || max)); f(); const ro = window.ResizeObserver ? new ResizeObserver(f) : null; ro && ro.observe(el); return () => ro && ro.disconnect(); }, [max]);
  const sc = w / 794; const html = useMemo(() => mfHtml(mfPage(D, { mgrImg }), "", false).replace("@media screen{body{background:#e5e7eb}.mf{margin:0 auto 6mm;box-shadow:0 2px 14px rgba(0,0,0,.18)}}", "body{overflow:hidden}"), [D, mgrImg]);
  return <div ref={ref} style={{ width: "100%", maxWidth: max, margin: "0 auto", direction: "ltr" }}><div style={{ width: w, height: 1123 * sc, overflow: "hidden", borderRadius: 6, boxShadow: "0 6px 24px -10px rgba(15,23,42,.45)", border: "1px solid #e2e8f0", background: "#fff" }}>
    <iframe title="معاينة النموذج" srcDoc={html} style={{ width: 794, height: 1123, border: 0, transform: `scale(${sc})`, transformOrigin: "top left", display: "block", pointerEvents: "none" }} /></div></div>; }

const In = ({ l, v, on, w, type = "text", ...r }) => <label style={{ display: "grid", gap: 3, fontSize: 12, fontWeight: 800, color: "#475569", flex: w ? `0 0 ${w}` : "1 1 150px" }}>{l}<input className="ar-in" type={type} value={v ?? ""} onChange={e => on(e.target.value)} {...r} /></label>;
const Sg = ({ x, l }) => <span className="ar-chip" style={{ background: x && x.img ? "#dcfce7" : "#f1f5f9", color: x && x.img ? "#15803d" : "#94a3b8" }}>{x && x.img ? "✓" : "○"} {l}</span>;

// كتابة/حذف غياب طالب في يوم سابق داخل سجل غياب فصله (نفس سجل الحضور اليومي)
async function writeAbs(api, D, s, dk, add, by) { const prev = await api.maGet(`${api.MA_ATT}/${dk}/${s.ck}`); const cur = arr(prev && prev.absent).filter(a => a && a.id);
  const next = add ? (cur.some(a => a.id === s.sid) ? cur : [...cur, { id: s.sid, name: s.name }]) : cur.filter(a => a.id !== s.sid);
  const total = (prev && prev.total) || arr(obj(obj(D.ros)[s.ck]).students).length || next.length; return api.saveAbs(dk, s.ck, next, total, by, add ? "إضافة غياب سابق لطالب" : "حذف غياب سابق لطالب"); }
// ═══ 📅 إضافة غياب سابق لطالب (أيام قبل تفعيل النظام أو لم تُسجَّل) ═══
function PastAbs({ api, D, by, off, toast, onDone }) {
  const [q, setQ] = useState(""); const [sid, setSid] = useState(""); const [d1, setD1] = useState(""); const [d2, setD2] = useState(""); const [ty, setTy] = useState("u"); const [pend, setPend] = useState([]); const [busy, setBusy] = useState(false);
  const S = D.S; const s = S[sid]; const y0 = D.f || yearStart(); const mx = today();
  const L = q.trim().length >= 2 ? Object.values(S).filter(x => x.name.includes(q.trim())).slice(0, 10) : [];
  const addRange = () => { if (!d1) return; const a = d1, b = d2 && d2 >= d1 ? d2 : d1; if (a < y0 || b > mx) { toast("⚠️ التاريخ خارج العام الدراسي أو في المستقبل"); return; }
    const out = []; let k = a, g = 0; while (k <= b && g < 200) { if (!off(k) && !s.abs.includes(k) && !pend.some(p => p.dk === k)) out.push({ dk: k, s: ty }); k = addD(k, 1); g++; }
    if (!out.length) { toast(off(a) && a === b ? "⚠️ هذا اليوم إجازة/ليس يوم دوام" : "⚠️ لا أيام جديدة — الأيام مسجلة مسبقاً أو إجازات"); return; }
    setPend(p => [...p, ...out].sort((x, y) => x.dk < y.dk ? -1 : 1)); setD1(""); setD2(""); };
  const write = (dk, add) => writeAbs(api, D, s, dk, add, by);
  const save = async () => { setBusy(true); let n = 0; const X = {};
    for (const p of pend) { if (await write(p.dk, true)) { n++; X[`${api.ABSX}/${p.dk}/${s.sid}`] = { s: p.s, src: "man", by, at: Date.now(), past: true }; } }
    if (Object.keys(X).length) await api.fbPatch(X); setBusy(false); setPend([]); toast(n === pend.length ? `✅ أُضيف ${ar(n)} يوم غياب للطالب ${s.name}` : `⚠️ حُفظ ${ar(n)} من ${ar(pend.length)} — تحقق من الاتصال`); onDone(); };
  const del = async (dk) => { if (!confirm(`حذف غياب ${s.name} يوم ${dayN(dk)} ${hijN(dk)}؟`)) return; setBusy(true); const ok = await write(dk, false); if (ok) await api.fbPatch({ [`${api.ABSX}/${dk}/${s.sid}`]: null }); setBusy(false); toast(ok ? "🗑️ حُذف اليوم" : "⚠️ تعذّر الحذف"); onDone(); };
  const toggleEx = async (dk) => { const e = s.ex.includes(dk); setBusy(true); const ok = await api.fbPatch({ [`${api.ABSX}/${dk}/${s.sid}`]: { s: e ? "u" : "e", src: "man", by, at: Date.now() } }); setBusy(false); toast(ok ? (e ? "صار بدون عذر" : "✅ صار بعذر") : "⚠️ تعذّر الحفظ"); onDone(); };
  return <div className="ar-card grid gap-3">
    <div><b style={{ fontSize: 16 }}>📅 إضافة غياب سابق لطالب</b><div style={{ fontSize: 12.5, color: "#64748b", fontWeight: 700, marginTop: 3 }}>لأيام الغياب التي سبقت تفعيل النظام أو لم تُسجَّل — تُحتسب في عدد أيام الغياب والإحالة والنماذج. من بداية العام ({hijN(y0)}) حتى اليوم.</div></div>
    <div style={{ position: "relative" }}><input className="ar-in" style={{ width: "100%" }} placeholder="🔎 اكتب اسم الطالب (حرفان على الأقل)" value={q} onChange={e => { setQ(e.target.value); }} />
      {L.length > 0 && (!s || q !== s.name) && <div style={{ display: "grid", gap: 4, marginTop: 6 }}>{L.map(x => <button key={x.sid} className="ar-b ar-gh" style={{ justifyContent: "flex-start", textAlign: "right", padding: "7px 12px" }} onClick={() => { setSid(x.sid); setQ(x.name); setPend([]); }}>{x.name} <small style={{ color: "#64748b", marginInlineStart: 8 }}>{api.className(x.ck)} • غياب {ar(x.abs.length)}</small></button>)}</div>}</div>
    {s && <>
      <div style={{ background: "#f8fafc", borderRadius: 14, padding: "10px 12px", display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", fontWeight: 800 }}><b style={{ fontSize: 15 }}>{s.name}</b><span className="ar-chip" style={{ background: "#fff", color: NAVY }}>{api.className(s.ck)}</span><span className="ar-chip" style={{ background: "#fee2e2", color: RED }}>بدون عذر {ar(s.u)}</span><span className="ar-chip" style={{ background: "#dcfce7", color: "#15803d" }}>بعذر {ar(s.e)}</span></div>
      <div style={{ border: "1.5px dashed #cbd5e1", borderRadius: 14, padding: 10, display: "grid", gap: 8 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "end" }}>
          <label style={{ display: "grid", gap: 3, fontSize: 12, fontWeight: 800, color: "#475569" }}>من تاريخ<input className="ar-in" type="date" min={y0} max={mx} value={d1} onChange={e => setD1(e.target.value)} /></label>
          <label style={{ display: "grid", gap: 3, fontSize: 12, fontWeight: 800, color: "#475569" }}>إلى تاريخ (اختياري)<input className="ar-in" type="date" min={d1 || y0} max={mx} value={d2} onChange={e => setD2(e.target.value)} /></label>
          <div style={{ display: "flex", gap: 4 }}>{[["u", "بدون عذر", RED], ["e", "بعذر", "#15803d"]].map(([k, l, c]) => <button key={k} className="ar-b" style={{ padding: "8px 12px", background: ty === k ? c : "#f1f5f9", color: ty === k ? "#fff" : "#334155" }} onClick={() => setTy(k)}>{l}</button>)}</div>
          <button className="ar-b ar-nv" disabled={!d1} onClick={addRange}>➕ إضافة</button></div>
        {d1 && <small style={{ fontWeight: 700, color: "#475569" }}>{dayN(d1)} {hijN(d1)}{d2 && d2 > d1 ? ` ← ${dayN(d2)} ${hijN(d2)} (تُتخطّى الإجازات تلقائياً)` : ""}{off(d1) && (!d2 || d2 === d1) ? " — ⚠️ ليس يوم دوام" : ""}</small>}
        {pend.length > 0 && <><div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>{pend.map(p => <span key={p.dk} className="ar-chip" style={{ background: p.s === "e" ? "#dcfce7" : "#fee2e2", color: p.s === "e" ? "#15803d" : RED, cursor: "pointer" }} onClick={() => setPend(x => x.filter(y => y.dk !== p.dk))}>{dayN(p.dk)} {hijN(p.dk)} • {p.s === "e" ? "بعذر" : "بدون عذر"} ✕</span>)}</div>
          <button className="ar-b" style={{ background: RED, color: "#fff", justifySelf: "start" }} disabled={busy} onClick={save}>{busy ? "⏳ جارٍ الحفظ…" : `💾 حفظ ${ar(pend.length)} يوم غياب`}</button></>}
      </div>
      <b style={{ fontSize: 13.5 }}>أيام غيابه المسجلة ({ar(s.abs.length)}) <small style={{ color: "#64748b", fontWeight: 700 }}>— اضغط النوع للتبديل بين بعذر/بدون عذر</small></b>
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap", maxHeight: 220, overflow: "auto" }}>{!s.abs.length ? <small style={{ color: "#94a3b8", fontWeight: 700 }}>لا يوجد غياب مسجل</small> : s.abs.slice().reverse().map(dk => { const e = s.ex.includes(dk); return <span key={dk} className="ar-chip" style={{ background: "#fff", border: "1px solid #e2e8f0", color: "#334155", gap: 6, display: "inline-flex", alignItems: "center" }}>{dayN(dk)} {hijN(dk)}<button className="ar-b" disabled={busy} style={{ padding: "1px 8px", fontSize: 11, background: e ? "#dcfce7" : "#fee2e2", color: e ? "#15803d" : RED }} onClick={() => toggleEx(dk)}>{e ? "بعذر" : "بدون عذر"}</button><button className="ar-b ar-gh" disabled={busy} title="حذف" style={{ padding: "1px 7px", fontSize: 11 }} onClick={() => del(dk)}>✕</button></span>; })}</div>
    </>}
  </div>;
}
// نافذة النماذج الرسمية لطالب: تعبئة إلكترونية + توقيع حضوري + إرسال لولي الأمر للتوقيع + طباعة طبق الأصل
function DocDlg({ api, s, P, by, onClose, toast: toast0, init = "p74" }) {
  const [msg, setMsg] = useState(""); const toast = m => { setMsg(m); setTimeout(() => setMsg(""), 3800); };
  const [t, setT] = useState(init); const [all, setAll] = useState(null); const [D, setD] = useState(null); const [mImg, setMImg] = useState(""); const [pad, setPad] = useState(null); const [busy, setBusy] = useState(""); const [dirty, setDirty] = useState(false);
  const base = `${NDOC}/${s.sid}`;
  const load = async (pick) => { const a = obj(await api.maGet(base)); setAll(a); const plg = Object.values(a).filter(x => x && x.t === "plg").sort((x, y) => (y.at || 0) - (x.at || 0));
    const tt = pick ? pick.t : t; setD(tt === "p74" ? p74Def(api, s, P, a.p74) : plgDef(api, s, pick && pick.id ? a[pick.id] : pick && pick.fresh ? null : plg[0])); setDirty(false); };
  useEffect(() => { load({ t }); }, [t]);
  useEffect(() => { (api.mgrSig ? api.mgrSig() : Promise.resolve("")).then(x => setMImg(x || "")).catch(() => {}); }, []);
  const up = (f) => { setD(d => f(JSON.parse(JSON.stringify(d)))); setDirty(true); };
  const save = async (x = D, quiet) => { const v = { ...x, at: x.at || Date.now(), upd: Date.now(), by: x.by || by }; setBusy("s"); const ok = await api.maPut(`${base}/${v.id}`, v); setBusy(""); if (!ok) { toast("⚠️ تعذّر الحفظ"); return null; } setD(v); setDirty(false); setAll(a => ({ ...obj(a), [v.id]: v })); if (!quiet) toast("💾 حُفظ النموذج"); return v; };
  const signHere = async (who, img) => { setPad(null); const n = who === "g" ? String(obj(D.g).n || "").trim() : ""; const v = await save(mfSign(D, who, img, n), true); if (!v) return;
    if (v.t === "plg" && obj(v.g).img && !obj(obj(P).s3p).dk) await api.fbPatch({ [`${NPROC}/${s.sid}/s3p`]: { dk: today(), by, at: Date.now(), plg: v.id } }); toast("✍️ تم التوقيع وحُفظ في النموذج"); };
  const send = async () => { if (!s.nh) { toast("⚠️ الطالب غير مربوط برقم الهوية — لا يصل لحسابه"); return; } const v = await save(D, true); if (!v) return;
    const rid = "sg" + Date.now().toString(36); const nm = v.t === "p74" ? "نموذج إجراءات الغياب بدون عذر" : "تعهد الالتزام بالحضور";
    const rec = { id: rid, nh: s.nh, sname: s.name, ck: s.ck, sid: s.sid, type: "sign", doc: `${base}/${v.id}`, dt: v.t, title: `✍️ ${nm} — للاطلاع والتوقيع`, text: `ولي أمر الطالب ${s.name} — ${v.cls}\nالسلام عليكم ورحمة الله وبركاته،\nتطبيقاً للمادة (٣٤) من قواعد السلوك والمواظبة (الإصدار الخامس) نرفق لكم «${nm}» الخاص بابنكم${v.t === "plg" ? ` عن غيابه بدون عذر (${ar(v.u)} أيام)` : ""}.\nنأمل الاطلاع عليه والتوقيع إلكترونياً منكم ومن الطالب.\nإدارة ${api.school || "المدرسة"}`, at: Date.now(), by };
    setBusy("n"); const ok = await api.fbPatch({ [`${api.PT_PREP}/${rid}`]: rec, [`${base}/${v.id}/sent`]: { rid, at: Date.now(), by } }); setBusy(""); if (!ok) { toast("⚠️ تعذّر الإرسال"); return; }
    setD(d => ({ ...d, sent: { rid, at: Date.now(), by } })); api.push({ to: { uids: ["s_" + s.sid] }, title: `✍️ ${nm}`, body: "نموذج من المدرسة بانتظار توقيعكم — افتح حساب الطالب ← التنبيهات", url: "/#parent", tag: "sign-" + rid, urgent: true }).catch(() => {});
    toast("📨 وصل النموذج لحساب الطالب للتوقيع"); };
  const print = (both) => { const pages = both ? [p74Def(api, s, P, obj(all).p74), D.t === "plg" ? D : plgDef(api, s, Object.values(obj(all)).filter(x => x && x.t === "plg").sort((x, y) => (y.at || 0) - (x.at || 0))[0])].map(x => mfPage(x, { mgrImg: mImg })).join("") : mfPage(D, { mgrImg: mImg });
    api.print(mfHtml(pages, `${D.t === "p74" || both ? "نموذج إجراءات الغياب" : "تعهد الالتزام بالحضور"} — ${s.name}`, true)); };
  const plgs = Object.values(obj(all)).filter(x => x && x.t === "plg").sort((x, y) => (y.at || 0) - (x.at || 0));
  const SigPad = api.SigPad;
  return <div className="ar-ov" onClick={onClose}><div className="ar-card grid gap-3" style={{ width: "min(1120px,100%)" }} onClick={e => e.stopPropagation()}>
    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}><b style={{ fontSize: 17, color: NAVY }}>📄 النماذج الرسمية — {s.name}</b><span className="ar-chip" style={{ background: "#f1f5f9", color: NAVY }}>{api.className(s.ck)}</span><span className="ar-chip" style={{ background: "#fee2e2", color: RED }}>{ar(s.u)} أيام بدون عذر{s.cons >= 3 ? ` • ${ar(s.cons)} متصلة` : ""}</span><button className="ar-b ar-gh" style={{ marginInlineStart: "auto", padding: "6px 12px" }} onClick={onClose}>✕ إغلاق</button></div>
    {msg && <div style={{ background: /⚠️/.test(msg) ? "#fef2f2" : "#f0fdf4", color: /⚠️/.test(msg) ? RED : "#15803d", borderRadius: 12, padding: 8, fontWeight: 800, textAlign: "center" }}>{msg}</div>}
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{[["p74", "📋 نموذج إجراءات الغياب بدون عذر (ص٧٤)"], ["plg", "📝 تعهد الالتزام بالحضور (ص٧٥)"]].map(([k, l]) => <button key={k} className={`ar-tab ${t === k ? "on" : ""}`} onClick={() => setT(k)}>{l}</button>)}</div>
    {!D ? <div style={{ textAlign: "center", color: "#94a3b8", fontWeight: 800, padding: 20 }}>⏳ جارٍ التحميل…</div> : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,380px),1fr))", gap: 14, alignItems: "start" }}>
      <div style={{ position: "sticky", top: 0 }}><MfPreview D={D} mgrImg={obj(D.m).sig ? mImg : ""} /></div>
      <div className="grid gap-2">
        {D.t === "plg" && <div style={{ display: "flex", gap: 5, flexWrap: "wrap", alignItems: "center" }}><small style={{ fontWeight: 800, color: "#64748b" }}>التعهدات:</small>{plgs.map(x => <button key={x.id} className="ar-b" style={{ padding: "4px 10px", fontSize: 12, background: x.id === D.id ? NAVY : "#f1f5f9", color: x.id === D.id ? "#fff" : "#334155" }} onClick={() => load({ t: "plg", id: x.id })}>{hijN(key(new Date(x.at)))}{obj(x.g).img ? " ✓" : ""}</button>)}<button className="ar-b ar-gh" style={{ padding: "4px 10px", fontSize: 12 }} onClick={() => load({ t: "plg", fresh: true })}>➕ تعهد جديد</button></div>}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}><In l="المنطقة/المحافظة" v={D.gov} on={v => up(d => (d.gov = v, d))} /><In l="المدرسة" v={D.school} on={v => up(d => (d.school = v, d))} /></div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{D.t === "p74" && <In l="المرحلة" v={D.stage} on={v => up(d => (d.stage = v, d))} w="110px" />}<In l="الصف" v={D.cls} on={v => up(d => (d.cls = v, d))} /></div>
        {D.t === "p74" ? ROWS74.map(([k, l]) => { const r = obj(D.rows[k]); const set = (f, v) => up(d => { d.rows[k] = { ...obj(d.rows[k]), [f]: v, edited: true }; return d; }); return <div key={k} style={{ border: "1px solid #e2e8f0", borderRadius: 14, padding: 8, background: r.act ? "#fffdf5" : "#f8fafc", display: "grid", gap: 5 }}>
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}><b style={{ fontSize: 13.5 }}>{l.replace("<br>", " ")}</b><Sg x={r.s} l="الطالب" /><Sg x={r.g} l="ولي الأمر" />{r.act ? <button className="ar-b ar-gh" style={{ padding: "2px 9px", fontSize: 11.5, marginInlineStart: "auto" }} onClick={() => up(d => { d.rows[k] = { act: "", dk: "", ded: "", edited: true }; return d; })}>مسح</button> : <button className="ar-b ar-gh" style={{ padding: "2px 9px", fontSize: 11.5, marginInlineStart: "auto" }} onClick={() => set("act", A74[k])}>＋ تعبئة الإجراء</button>}</div>
          <textarea className="ar-in" style={{ minHeight: 48, fontSize: 12.5 }} placeholder="الإجراء المتخذ" value={r.act || ""} onChange={e => set("act", e.target.value)} />
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}><In l={`تاريخ الإجراء${r.dk ? ` (${hijN(r.dk)})` : ""}`} type="date" v={r.dk} on={v => set("dk", v)} /><In l="درجات المواظبة المحسومة" type="number" min="0" v={r.ded} on={v => set("ded", v)} w="150px" /></div></div>; })
          : <><div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}><In l="عدد أيام الغياب بدون عذر" type="number" min="0" v={D.u} on={v => up(d => (d.u = v, d))} w="150px" /><In l="بتاريخ" v={D.dts} on={v => up(d => (d.dts = v, d))} /></div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "end" }}><In l="اسم ولي الأمر" v={obj(D.g).n} on={v => up(d => (d.g = { ...obj(d.g), n: v }, d))} /><Sg x={D.s} l="الطالب" /><Sg x={D.g} l="ولي الأمر" /></div></>}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "end", borderTop: "1px dashed #e2e8f0", paddingTop: 8 }}><In l="مدير/مديرة المدرسة" v={obj(D.m).n} on={v => up(d => (d.m = { ...obj(d.m), n: v }, d))} /><In l="التاريخ" type="date" v={obj(D.m).dk} on={v => up(d => (d.m = { ...obj(d.m), dk: v }, d))} w="150px" />
          <label className="ar-ck" style={{ flex: "1 1 100%" }}><input type="checkbox" checked={!!obj(D.m).sig} disabled={!mImg} onChange={e => up(d => (d.m = { ...obj(d.m), sig: e.target.checked }, d))} />إدراج توقيع المدير المحفوظ{!mImg ? " (لا يوجد توقيع محفوظ)" : ""}</label></div>
        {D.sent && <div style={{ background: "#f5f3ff", borderRadius: 12, padding: "7px 11px", fontSize: 12.5, fontWeight: 800, color: "#6d28d9" }}>📨 أُرسل لولي الأمر {when(D.sent.at)} — {mfPending(D, "g") ? "⏳ بانتظار توقيعه" : "✅ وقّع ولي الأمر"}{mfPending(D, "s") ? " • الطالب لم يوقّع بعد" : " • ✓ وقّع الطالب"}</div>}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <button className="ar-b ar-nv" disabled={busy === "s"} onClick={() => save()}>💾 حفظ{dirty ? " •" : ""}</button>
          <button className="ar-b ar-pp" disabled={busy === "n" || !s.nh || (D.t === "p74" && !Object.values(obj(D.rows)).some(r => r && r.act))} onClick={send}>📨 إرسال لولي الأمر للتوقيع</button>
          <button className="ar-b ar-gd" onClick={() => print(false)}>🖨 طباعة</button><button className="ar-b ar-gh" onClick={() => print(true)}>🖨 النموذجان معاً</button></div>
        {SigPad && <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}><small style={{ fontWeight: 800, color: "#64748b" }}>توقيع حضوري بالمدرسة:</small><button className="ar-b ar-gh" style={{ padding: "5px 11px", fontSize: 12.5 }} disabled={!mfPending(D, "s") || (D.t === "p74" && !Object.values(obj(D.rows)).some(r => r && r.act))} onClick={() => setPad("s")}>✍️ الطالب</button><button className="ar-b ar-gh" style={{ padding: "5px 11px", fontSize: 12.5 }} disabled={!mfPending(D, "g") || (D.t === "p74" && !Object.values(obj(D.rows)).some(r => r && r.act))} onClick={() => setPad("g")}>✍️ ولي الأمر</button></div>}
        {!s.nh && <small style={{ color: "#b45309", fontWeight: 800 }}>⚠️ الطالب غير مربوط برقم الهوية — الإرسال لحسابه غير متاح، ويمكن التوقيع حضورياً.</small>}
      </div></div>}
    {pad && SigPad && <SigPad title={pad === "s" ? `توقيع الطالب — ${s.name}` : "توقيع ولي الأمر"} onCancel={() => setPad(null)} onDone={img => signHere(pad, img)} />}
  </div></div>; }

// ═══════════════ الصفحة ═══════════════
export function AbsRef({ api, me, mode = "dep" }) {
  const isC = mode === "coun"; const by = (me && me.name) || (isC ? "الموجه الطلابي" : "وكيل شؤون الطلاب");
  const [dk, setDk] = useState(today()); const [D, setD] = useState(null); const [refs, setRefs] = useState(null); const [proc, setProc] = useState({}); const [sent, setSent] = useState({});
  const [tab, setTab] = useState(isC ? "ref" : "day"); const [ck, setCk] = useState(""); const [edit, setEdit] = useState(null); const [msg, setMsg] = useState(""); const [busy, setBusy] = useState("");
  const [refDlg, setRefDlg] = useState(null); const [docDlg, setDocDlg] = useState(null); const [cDlg, setCDlg] = useState(null); const [rf, setRf] = useState("open"); const [edDk, setEdDk] = useState(null); const [q, setQ] = useState("");
  const toast = m => { setMsg(m); setTimeout(() => setMsg(""), 3800); };
  const off = k => { try { return !!api.off(k); } catch { const w = dt(k).getDay(); return w === 5 || w === 6; } };
  const load = async (quiet) => { if (quiet !== true) setD(null); const [d, r, p, s] = await Promise.all([loadData(api, dk), api.maGet(NREF), api.maGet(NPROC), api.maGet(`${api.PT_PREP}`).catch(() => null)]);
    Object.values(d.S).forEach(o => { o.cons = streak(o.ud, off, dk).best; o.f = d.f; o.to = dk; }); setD(d); setRefs(arr(r).sort((a, b) => (b.at || 0) - (a.at || 0))); setProc(obj(p));
    const SN = {}; arr(s).forEach(x => { if (x && x.absd && x.sid) SN[`${x.sid}|${x.absd}`] = x.at; }); setSent(SN); };
  useEffect(() => { load(); }, [dk]);
  const S = D ? D.S : {}; const openRef = sid => (refs || []).find(r => r.sid === sid && r.st !== "done");
  const dayAbs = useMemo(() => D ? Object.values(S).filter(s => s.abs.includes(dk)).map(s => ({ ...s, sent: !!sent[`${s.sid}|${dk}`], ref: !!openRef(s.sid) })).sort((a, b) => a.ck.localeCompare(b.ck, "en", { numeric: true }) || a.name.localeCompare(b.name, "ar")) : [], [D, sent, refs]);
  const due = useMemo(() => D ? Object.values(S).filter(s => s.u >= 3 && !openRef(s.sid) && !(refs || []).some(r => r.sid === s.sid && r.u >= s.u)).sort((a, b) => b.u - a.u) : [], [D, refs]);
  const recorded = D ? obj(D.days[dk]) : {}; const isOff = off(dk);
  // ── حفظ غياب فصل لليوم المختار (بنفس سجل كشوف الحضور) ──
  const saveCls = async () => { const c = edit; const L = arr(D.ros[c.ck] && D.ros[c.ck].students).filter(x => x.id && x.name); const absList = L.filter(x => c.sel[x.id]).map(x => ({ id: x.id, name: x.name }));
    const prev = obj(recorded[c.ck]); if (prev.savedAt && !c.reason.trim()) { toast("⚠️ الفصل محضَّر مسبقاً — اكتب سبب التعديل"); return; }
    setBusy("cls"); const ok = await api.saveAbs(dk, c.ck, absList, L.length, by, c.reason.trim()); setBusy(""); if (!ok) { toast("⚠️ تعذّر الحفظ — تحقق من الاتصال"); return; }
    toast(`✅ حُفظ غياب الفصل ${api.className(c.ck)} — ${ar(absList.length)} غائب`); setEdit(null); load(); };
  // ── إشعار ولي الأمر (يصل حساب الطالب + إشعار الجوال) ──
  const notify = async (list, withRef) => { const L = list.filter(s => s.nh); if (!L.length) { toast("⚠️ الطلاب غير مربوطين برقم الهوية — لا يمكن الوصول لحساباتهم"); return; } setBusy("n");
    const P = {}; const at = Date.now(); L.forEach((s, i) => { const id = "ab" + (at + i).toString(36) + String(s.sid).slice(-4).replace(/\W/g, ""); const exc = s.ex.includes(dk);
      const text = [`ولي أمر الطالب ${s.name} — ${api.className(s.ck)}`, `السلام عليكم ورحمة الله وبركاته،`, `نحيطكم علماً بغياب ابنكم يوم ${dayN(dk)} ${hij(dk)}${exc ? " (بعذر مقبول)" : ""}.`,
        exc ? "" : `عدد أيام غيابه بدون عذر منذ بداية العام: ${ar(s.u)} يوم.`, exc ? "" : `نأمل تقديم العذر مع ما يثبته خلال ثلاثة أيام عمل من خلال «📝 الأعذار» في حساب الطالب، علماً بأنه يُحسم من درجة المواظبة درجة عن كل يوم غياب بدون عذر.`,
        !exc && s.u >= 3 ? `وتطبيقاً للمادة (٣٤) من قواعد السلوك والمواظبة (الإصدار الخامس) ${withRef || openRef(s.sid) ? "تمت إحالة ابنكم للموجه الطلابي لدراسة حالته وتقديم الدعم المناسب له، وسيتم التواصل معكم." : "يستوجب ذلك إحالته للموجه الطلابي لدراسة حالته."}` : "",
        !exc && s.u >= 5 ? "ونأمل حضوركم للمدرسة لمناقشة أسباب الغياب مع إدارة المدرسة." : "", `شاكرين تعاونكم — إدارة ${api.school || "المدرسة"}`].filter(Boolean).join("\n");
      P[`${api.PT_PREP}/${id}`] = { id, nh: s.nh, sname: s.name, ck: s.ck, sid: s.sid, absd: dk, type: "warn", title: `🚫 إشعار غياب — ${dayN(dk)} ${hij(dk)}`, text, at: at + i, by };
      if (!exc && !obj(obj(proc[s.sid]).d1).dk) P[`${NPROC}/${s.sid}/d1`] = { dk, by, at, via: "حساب الطالب + إشعار الجوال" }; });
    const ok = await api.fbPatch(P); setBusy(""); if (!ok) { toast("⚠️ تعذّر الإرسال"); return; }
    api.push({ to: { uids: L.map(s => "s_" + s.sid) }, title: "🚫 إشعار غياب من المدرسة", body: `غياب يوم ${dayN(dk)} ${hij(dk)} — افتح حساب الطالب للتفاصيل وتقديم العذر`, url: "/#parent", tag: "abs-" + dk }).catch(() => {});
    toast(`📨 وصل الإشعار لحساب ${ar(L.length)} طالب${L.length < list.length ? ` (تعذّر ${ar(list.length - L.length)} غير مربوطين)` : ""}`); load(); };
  // ── الإحالة للموجه الطلابي ──
  const doRef = async () => { const s = refDlg.s; const rdk = refDlg.dk || dk; if (rdk > today()) { toast("⚠️ لا يمكن أن يكون تاريخ الإحالة في المستقبل"); return; } const sel = arr(refDlg.sel).slice().sort(); if (!sel.length) { toast("⚠️ حدّد يوم الغياب الذي تُحيل الطالب بسببه"); return; } const id = "r" + Date.now().toString(36); const R = { id, sid: s.sid, nh: s.nh || "", name: s.name, ck: s.ck, cls: api.className(s.ck), dk: rdk, at: Date.now(), by, u: s.u, e: s.e, cons: s.cons || 0, days: sel, prev: refDlg.prev, note: refDlg.note.trim(), st: "new", reason: "الغياب بدون عذر" };
    setBusy("r"); const ok = await api.fbPatch({ [`${NREF}/${id}`]: R, [`${NPROC}/${s.sid}/s3`]: { dk: rdk, by, at: Date.now(), ref: id } }); setBusy(""); if (!ok) { toast("⚠️ تعذّر الحفظ"); return; }
    api.push({ to: { roles: ["counselor"] }, title: "📥 إحالة طالب للموجه الطلابي", body: `${s.name} — ${api.className(s.ck)} • غياب بدون عذر ${s.u} أيام`, url: "/#staff:absref", tag: "absref-" + id, urgent: true }).catch(() => {});
    if (refDlg.notify) await notify([{ ...s }], true);
    setRefDlg(null); toast("➡️ أُحيل الطالب للموجه الطلابي ووصله إشعار"); load(); };
  const saveCoun = async (close) => { const R = cDlg.R; const C = { ...obj(R.coun), ...cDlg.c, by: cDlg.c.by || by, at: Date.now() }; if (!C.rcvAt) C.rcvAt = Date.now();
    const P = { [`${NREF}/${R.id}/coun`]: C, [`${NREF}/${R.id}/st`]: close ? "done" : "rcv" };
    if (arr(C.acts).includes("أخذ التعهد الخطي على الطالب وولي أمره") && !obj(obj(proc[R.sid]).s3p).dk) P[`${NPROC}/${R.sid}/s3p`] = { dk: today(), by: C.by, at: Date.now() };
    if (arr(C.acts).includes("إحالة الطالب للجنة التوجيه الطلابي") && !obj(obj(proc[R.sid]).s5).dk) P[`${NPROC}/${R.sid}/s5`] = { dk: today(), by: C.by, at: Date.now() };
    const ok = await api.fbPatch(P); if (!ok) { toast("⚠️ تعذّر الحفظ"); return; } setCDlg(null); toast(close ? "✅ أُغلقت الإحالة بإفادة الموجه" : "💾 حُفظت إفادة الموجه"); load(); };
  const recvRef = async R => { const ok = await api.fbPatch({ [`${NREF}/${R.id}/st`]: "rcv", [`${NREF}/${R.id}/coun/rcvAt`]: Date.now(), [`${NREF}/${R.id}/coun/by`]: by }); if (ok) { toast("📥 تم استلام الإحالة"); load(); } };
  const addPastRef = async () => { const s = refDlg.s, k = refDlg.pd; if (!k || k > today() || k < ((D && D.f) || yearStart())) { toast("⚠️ التاريخ خارج العام الدراسي أو في المستقبل"); return; } if (off(k)) { toast("⚠️ هذا اليوم ليس يوم دوام (إجازة)"); return; } if (s.ud.includes(k)) { setRefDlg(d => ({ ...d, pd: "", sel: arr(d.sel).includes(k) ? d.sel : [...arr(d.sel), k] })); toast("اليوم مسجل مسبقاً — تم تحديده"); return; }
    setBusy("pa"); const ok = await writeAbs(api, D, s, k, true, by); if (ok) await api.fbPatch({ [`${api.ABSX}/${k}/${s.sid}`]: { s: "u", src: "man", by, at: Date.now(), past: true } }); setBusy(""); if (!ok) { toast("⚠️ تعذّر الحفظ — تحقق من الاتصال"); return; }
    const ns = { ...s, abs: [...s.abs.filter(x => x !== k), k].sort(), ex: s.ex.filter(x => x !== k), ud: [...s.ud, k].sort() }; ns.u = ns.ud.length;
    setRefDlg(d => ({ ...d, s: ns, pd: "", sel: [...arr(d.sel), k] })); toast(`✅ أُضيف غياب ${dayN(k)} ${hijN(k)} وتم تحديده`); load(true); };
  const saveRefDk = async (R, v) => { if (!v || v > today()) { toast("⚠️ تاريخ غير صالح — لا يكون في المستقبل"); return; } const P = { [`${NREF}/${R.id}/dk`]: v, [`${NREF}/${R.id}/dkEd`]: { by, at: Date.now(), old: R.dk } }; const p3 = obj(obj(proc[R.sid]).s3); if (!p3.dk || p3.ref === R.id) P[`${NPROC}/${R.sid}/s3`] = { ...p3, dk: v, ref: R.id, by: p3.by || by, at: p3.at || Date.now() };
    const ok = await api.fbPatch(P); if (!ok) { toast("⚠️ تعذّر الحفظ"); return; } setEdDk(null); toast(`📅 عُدّل تاريخ الإحالة إلى ${dayN(v)} ${hij(v)}`); load(); };
  const markProc = async (sid, k, on) => { const ok = await api.fbPatch({ [`${NPROC}/${sid}/${k}`]: on ? { dk: today(), by, at: Date.now() } : null }); if (ok) setProc(p => ({ ...p, [sid]: { ...obj(p[sid]), [k]: on ? { dk: today(), by } : undefined } })); };
  const setExc = async (s, e) => { const ok = await api.fbPatch({ [`${api.ABSX}/${dk}/${s.sid}`]: { s: e ? "e" : "u", src: "man", by, at: Date.now() } }); if (ok) { toast(e ? "✓ صُنّف بعذر" : "✓ صُنّف بدون عذر"); load(); } };
  const printProc = s => doPrint(api, `إجراءات الغياب — ${s.name}`, procForm(api, s, proc[s.sid], (refs || []).find(r => r.sid === s.sid)));

  // ── عناصر مشتركة ──
  const Stage = ({ s }) => { const g = STG[stageOf(s)]; return <span className="ar-chip" style={{ background: g[2], color: g[1] }}>{g[0]}{s.cons >= 3 ? " • متصل" : ""}</span>; };
  const shiftDay = n => { let k = dk; for (let i = 0; i < 14; i++) { k = addD(k, n); if (!off(k)) break; } setDk(k); };
  const clsCount = c => arr(obj(recorded[c]).absent).length;
  const RL = (refs || []).filter(r => (rf === "all" || (rf === "open" ? r.st !== "done" : r.st === "done")) && (!q || r.name.includes(q)));
  const nNew = (refs || []).filter(r => r.st === "new").length;

  return <div className="ar grid gap-3" style={{ maxWidth: 1180, margin: "0 auto" }}><style>{CSS}</style>
    <div className="ar-hero"><div style={{ width: 54, height: 54, borderRadius: 16, background: "rgba(255,255,255,.12)", display: "grid", placeItems: "center", fontSize: 28 }}>{isC ? "🧭" : "🚫"}</div>
      <div style={{ flex: "1 1 280px" }}><b style={{ fontSize: 21 }}>{isC ? "إحالات الغياب للموجه الطلابي" : "تقرير الطلاب الغائبين والإحالة للموجه الطلابي"}</b><div style={{ fontSize: 12.5, opacity: .9, fontWeight: 600, marginTop: 4, lineHeight: 1.8 }}>وفق قواعد السلوك والمواظبة لطلبة التعليم العام — الإصدار الخامس ١٤٤٧هـ (المادة ٣٤: الغياب بدون عذر)</div></div>
      <div style={{ background: "rgba(255,255,255,.1)", borderRadius: 16, padding: "8px 12px", display: "grid", gap: 6 }}>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}><button className="ar-b" style={{ background: "rgba(255,255,255,.15)", color: "#fff", padding: "6px 10px" }} onClick={() => shiftDay(-1)}>→</button><input type="date" className="ar-in" value={dk} max={today()} onChange={e => e.target.value && setDk(e.target.value)} style={{ padding: "6px 9px" }} /><button className="ar-b" style={{ background: "rgba(255,255,255,.15)", color: "#fff", padding: "6px 10px" }} disabled={dk >= today()} onClick={() => shiftDay(1)}>←</button></div>
        <div style={{ fontSize: 13.5, fontWeight: 800, textAlign: "center" }}>{dayN(dk)} • {hij(dk)}{isOff ? <span style={{ color: "#fde68a" }}> • إجازة</span> : ""}</div>
        <div style={{ display: "flex", gap: 5, justifyContent: "center" }}>{[["اليوم", today()], ["أمس", (() => { let k = today(); for (let i = 0; i < 9; i++) { k = addD(k, -1); if (!off(k)) break; } return k; })()]].map(([l, k]) => <button key={l} className="ar-b" style={{ padding: "3px 12px", fontSize: 12, background: dk === k ? GOLD : "rgba(255,255,255,.15)", color: dk === k ? NAVY : "#fff" }} onClick={() => setDk(k)}>{l}</button>)}</div></div></div>
    {msg && <div style={{ background: /⚠️/.test(msg) ? "#fef2f2" : "#f0fdf4", color: /⚠️/.test(msg) ? RED : "#15803d", borderRadius: 14, padding: 10, fontWeight: 800, textAlign: "center" }}>{msg}</div>}
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{(isC ? [["ref", "🧭 الإحالات", nNew], ["day", "🚫 غياب اليوم"], ["rules", "📘 المادة ٣٤"]] : [["day", "🚫 الغائبون", dayAbs.length], ["due", "⚠️ مستحقو الإحالة", due.length], ["ref", "🧭 الإحالات", nNew], ["past", "📅 غياب سابق"], ["rules", "📘 المادة ٣٤"]]).map(([k, l, n]) => <button key={k} className={`ar-tab ${tab === k ? "on" : ""}`} onClick={() => setTab(k)}>{l}{n ? <i>{ar(n)}</i> : null}</button>)}</div>
    {!D ? <div className="ar-card" style={{ textAlign: "center", color: "#94a3b8", fontWeight: 800 }}>⏳ جارٍ جمع غياب العام الدراسي…</div> : <>

    {tab === "day" && <>
      <div className="ar-kp"><div style={{ "--b": "#fee2e2", "--c": RED }}><b>{ar(dayAbs.length)}</b><small>غائب في هذا اليوم</small></div><div style={{ "--b": "#fef3c7", "--c": "#92400e" }}><b>{ar(dayAbs.filter(s => !s.ex.includes(dk)).length)}</b><small>بدون عذر</small></div><div style={{ "--b": "#dcfce7", "--c": "#15803d" }}><b>{ar(dayAbs.filter(s => s.sent).length)}</b><small>أُشعر ولي أمره</small></div><div style={{ "--b": "#ede9fe", "--c": "#6d28d9" }}><b>{ar(dayAbs.filter(s => s.ref).length)}</b><small>محال للموجه</small></div><div style={{ "--b": "#f1f5f9", "--c": NAVY }}><b>{ar(Object.keys(recorded).length)}/{ar(D.classes.length)}</b><small>فصول محضَّرة</small></div></div>
      {!isC && <div className="ar-card grid gap-2"><b style={{ fontSize: 14.5 }}>📋 تحديد الغائبين من كشوف الفصول <small style={{ color: "#64748b", fontWeight: 700 }}>— اختر الفصل ثم اضغط على أسماء الغائبين</small></b>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{D.classes.map(c => { const n = clsCount(c); const has = !!recorded[c]; return <button key={c} className={`ar-cls ${ck === c ? "on" : ""}`} onClick={() => { setCk(c); const L = arr(D.ros[c] && D.ros[c].students); setEdit({ ck: c, sel: Object.fromEntries(arr(obj(recorded[c]).absent).map(a => [a.id, true])), reason: "" }); }}><span style={{ fontSize: 12 }}>{api.className(c)}</span><b style={{ color: ck === c ? "#fde68a" : n ? RED : has ? "#15803d" : "#94a3b8" }}>{has ? ar(n) : "—"}</b><span style={{ fontSize: 10.5, opacity: .8 }}>{has ? "غائب" : "لم يُحضَّر"}</span></button>; })}</div>
        {edit && <div className="grid gap-2" style={{ background: "#f8fafc", borderRadius: 16, padding: 10 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}><b>الفصل {api.className(edit.ck)} — {dayN(dk)} {hij(dk)}</b><span className="ar-chip" style={{ background: "#fee2e2", color: RED }}>{ar(Object.values(edit.sel).filter(Boolean).length)} غائب</span>{recorded[edit.ck] && <span className="ar-chip" style={{ background: "#e0f2fe", color: "#0369a1" }}>محضَّر مسبقاً{obj(recorded[edit.ck]).teacher ? ` — ${obj(recorded[edit.ck]).teacher}` : ""}</span>}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(230px,1fr))", gap: 6 }}>{arr(D.ros[edit.ck] && D.ros[edit.ck].students).filter(x => x.id && x.name).sort((a, b) => a.name.localeCompare(b.name, "ar")).map(x => { const on = !!edit.sel[x.id]; const s = S[x.id] || { u: 0 }; return <div key={x.id} className={`ar-st ${on ? "ab" : ""}`} onClick={() => setEdit(e => ({ ...e, sel: { ...e.sel, [x.id]: !on } }))}><span className="ar-x">{on ? "✕" : ""}</span><span style={{ flex: 1, fontWeight: 800, fontSize: 13.5 }}>{x.name}</span>{s.u > 0 && <span className="ar-chip" style={{ background: STG[stageOf(s)][2], color: STG[stageOf(s)][1] }}>{ar(s.u)}</span>}</div>; })}</div>
          {recorded[edit.ck] && <input className="ar-in" placeholder="سبب تعديل التحضير (مطلوب لأن الفصل محضَّر)" value={edit.reason} onChange={e => setEdit({ ...edit, reason: e.target.value })} />}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><button className="ar-b ar-nv" disabled={busy === "cls" || isOff} onClick={saveCls}>💾 حفظ غياب الفصل</button><button className="ar-b ar-gh" onClick={() => { setEdit(null); setCk(""); }}>إغلاق</button>{isOff && <small style={{ color: RED, fontWeight: 800, alignSelf: "center" }}>اليوم المختار إجازة</small>}</div></div>}</div>}
      <div className="ar-card grid gap-2"><div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}><b style={{ fontSize: 15 }}>🚫 الطلاب الغائبون — {dayN(dk)} {hij(dk)}</b>
        <span style={{ marginInlineStart: "auto", display: "flex", gap: 6, flexWrap: "wrap" }}>{!isC && dayAbs.some(s => !s.sent) && <button className="ar-b ar-pp" disabled={busy === "n"} onClick={() => notify(dayAbs.filter(s => !s.sent))}>📨 إشعار أولياء أمور الجميع ({ar(dayAbs.filter(s => !s.sent).length)})</button>}<button className="ar-b ar-gd" onClick={() => doPrint(api, "كشف الغائبين", dayList(api, dk, dayAbs))}>🖨 كشف الغائبين</button></span></div>
        {!dayAbs.length ? <div style={{ textAlign: "center", color: "#94a3b8", fontWeight: 800, padding: 16 }}>{Object.keys(recorded).length ? "🌟 لا يوجد غياب مسجل في هذا اليوم" : "لم يُحضَّر أي فصل في هذا اليوم بعد"}</div>
          : dayAbs.map(s => { const exc = s.ex.includes(dk); const g = STG[stageOf(s)]; const R = openRef(s.sid); return <div key={s.sid} className="ar-row" style={{ "--c": exc ? "#16a34a" : g[1] }}>
            <div><div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}><b style={{ fontSize: 15 }}>{s.name}</b><span className="ar-chip" style={{ background: "#f1f5f9", color: NAVY }}>{api.className(s.ck)}</span><span className="ar-chip" style={{ background: exc ? "#dcfce7" : "#fee2e2", color: exc ? "#15803d" : RED }}>{exc ? "بعذر" : "بدون عذر"}</span><Stage s={s} /></div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: "#64748b", marginTop: 3 }}>غياب العام: <b style={{ color: RED }}>{ar(s.u)}</b> بدون عذر • {ar(s.e)} بعذر{s.cons >= 2 ? ` • أطول غياب متصل ${ar(s.cons)} أيام` : ""}{s.sent ? " • ✓ أُشعر ولي الأمر" : ""}{R ? ` • ✓ محال للموجه (${R.st === "rcv" ? "قيد المتابعة" : "جديد"})` : ""}{!s.nh ? " • ⚠️ غير مربوط برقم الهوية" : ""}</div></div>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap", justifyContent: "flex-end" }}>
              {!isC && <button className="ar-b ar-gh" style={{ padding: "6px 10px", fontSize: 12 }} onClick={() => setExc(s, !exc)}>{exc ? "↺ بدون عذر" : "✓ بعذر"}</button>}
              {!isC && <button className="ar-b ar-pp" style={{ padding: "6px 11px", fontSize: 12.5 }} disabled={busy === "n" || !s.nh} onClick={() => notify([s])}>{s.sent ? "📨 إعادة الإشعار" : "📨 إشعار ولي الأمر"}</button>}
              {!isC && !R && s.u >= 1 && <button className="ar-b" style={{ padding: "6px 11px", fontSize: 12.5, background: s.u >= 3 ? "#b45309" : "#fff", color: s.u >= 3 ? "#fff" : "#b45309", border: "1.5px solid #b45309" }} onClick={() => setRefDlg({ s, sel: s.ud.slice(-1), prev: ["التواصل مع ولي الأمر وإشعاره بالغياب"], note: "", notify: !!s.nh })}>➡️ إحالة للموجه</button>}
              <button className="ar-b ar-gh" style={{ padding: "6px 10px", fontSize: 12 }} onClick={() => setDocDlg({ s })}>📄 النماذج</button></div></div>; })}</div></>}

    {tab === "due" && !isC && <div className="ar-card grid gap-2"><b style={{ fontSize: 15 }}>⚠️ طلاب بلغ غيابهم بدون عذر ٣ أيام فأكثر ولم يُحالوا للموجه الطلابي</b><div style={{ fontSize: 12.5, color: "#64748b", fontWeight: 700 }}>المادة (٣٤): «تحويل الطالب للموجه الطلابي لدراسة الحالة وتقديم الخدمات التربوية المناسبة» عند بلوغ ٣ أيام — محسوبة حتى {hij(dk)}.</div>
      {!due.length ? <div style={{ textAlign: "center", color: "#15803d", fontWeight: 800, padding: 14 }}>✓ لا يوجد طلاب مستحقون للإحالة</div> : due.map(s => { const g = STG[stageOf(s)]; return <div key={s.sid} className="ar-row" style={{ "--c": g[1] }}><div><div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}><b>{s.name}</b><span className="ar-chip" style={{ background: "#f1f5f9", color: NAVY }}>{api.className(s.ck)}</span><Stage s={s} /></div><div style={{ fontSize: 12.5, fontWeight: 700, color: "#64748b", marginTop: 3 }}><b style={{ color: RED }}>{ar(s.u)}</b> أيام بدون عذر — آخرها {dayN(s.ud[s.ud.length - 1])} {hij(s.ud[s.ud.length - 1])}{s.cons >= 3 ? ` • ${ar(s.cons)} أيام متصلة (تُخاطَب جهات الاختصاص)` : ""}</div></div>
        <div style={{ display: "flex", gap: 5 }}><button className="ar-b" style={{ background: "#b45309", color: "#fff", padding: "7px 12px" }} onClick={() => setRefDlg({ s, sel: s.ud.slice(-1), prev: ["التواصل مع ولي الأمر وإشعاره بالغياب"], note: "", notify: !!s.nh })}>➡️ إحالة للموجه</button><button className="ar-b ar-gh" style={{ padding: "7px 10px" }} onClick={() => setDocDlg({ s })}>📄 النماذج</button></div></div>; })}</div>}

    {tab === "ref" && <div className="grid gap-2">
      <div className="ar-card" style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", padding: 10 }}>{[["open", "المفتوحة"], ["done", "المغلقة"], ["all", "الكل"]].map(([k, l]) => <button key={k} className={`ar-tab ${rf === k ? "on" : ""}`} onClick={() => setRf(k)}>{l}</button>)}<input className="ar-in" style={{ flex: "1 1 180px" }} placeholder="🔎 اسم الطالب" value={q} onChange={e => setQ(e.target.value)} /></div>
      {!RL.length ? <div className="ar-card" style={{ textAlign: "center", color: "#94a3b8", fontWeight: 800 }}>لا توجد إحالات</div> : RL.map(R => { const C = obj(R.coun); const s = S[R.sid]; const stc = R.st === "done" ? ["أُغلقت", "#15803d", "#dcfce7"] : R.st === "rcv" ? ["قيد المتابعة", "#1d4ed8", "#dbeafe"] : ["جديدة — بانتظار الاستلام", "#b45309", "#fef3c7"];
        return <div key={R.id} className="ar-card grid gap-2" style={{ borderInlineStart: `6px solid ${stc[1]}` }}>
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}><b style={{ fontSize: 16 }}>{R.name}</b><span className="ar-chip" style={{ background: "#f1f5f9", color: NAVY }}>{R.cls}</span><span className="ar-chip" style={{ background: stc[2], color: stc[1] }}>{stc[0]}</span>{edDk && edDk.id === R.id ? <span style={{ marginInlineStart: "auto", display: "flex", gap: 5, alignItems: "center", flexWrap: "wrap" }}><input className="ar-in" type="date" style={{ width: 160, padding: "5px 8px" }} max={today()} value={edDk.v} onChange={e => e.target.value && setEdDk({ ...edDk, v: e.target.value })} /><small style={{ fontWeight: 800, color: "#475569" }}>{dayN(edDk.v)} {hij(edDk.v)}</small><button className="ar-b ar-nv" style={{ padding: "5px 11px", fontSize: 12 }} onClick={() => saveRefDk(R, edDk.v)}>حفظ</button><button className="ar-b ar-gh" style={{ padding: "5px 9px", fontSize: 12 }} onClick={() => setEdDk(null)}>✕</button></span>
            : <span style={{ marginInlineStart: "auto", fontSize: 12, fontWeight: 700, color: "#94a3b8", display: "flex", gap: 5, alignItems: "center" }}>أُحيل {dayN(R.dk)} {hij(R.dk)} — {R.by}{mode !== "coun" && <button className="ar-b ar-gh" title="تعديل تاريخ الإحالة" style={{ padding: "2px 8px", fontSize: 11.5 }} onClick={() => setEdDk({ id: R.id, v: R.dk })}>📅 تعديل التاريخ</button>}</span>}</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#334155", lineHeight: 1.9 }}>سبب الإحالة: <b>الغياب بدون عذر {arr(R.days).length <= 3 ? `يوم ${arr(R.days).map(d => `${dayN(d)} ${hijN(d)}`).join("، ")}` : `(${ar(arr(R.days).length)} أيام)`}</b> <span style={{ color: "#94a3b8" }}>• الإجمالي عند الإحالة {ar(R.u)}</span>{s && s.u > R.u ? <span style={{ color: RED }}> • ارتفع الآن إلى {ar(s.u)} أيام</span> : ""}{R.note ? <><br />ملاحظة الوكيل: {R.note}</> : null}</div>
          {(C.rcvAt || arr(C.acts).length) ? <div style={{ background: "#f8fafc", borderRadius: 12, padding: "8px 11px", fontSize: 12.5, fontWeight: 700, lineHeight: 1.9 }}>🧭 <b>إفادة الموجه{C.by ? ` (${C.by})` : ""}:</b> {C.rcvAt ? `استلم ${when(C.rcvAt)}` : ""}{arr(C.rs).length ? ` • الأسباب: ${arr(C.rs).join("، ")}` : ""}{arr(C.acts).length ? ` • الإجراءات: ${arr(C.acts).join("، ")}` : ""}{C.plan ? ` • الخطة: ${C.plan}` : ""}{C.res ? ` • النتيجة: ${C.res}` : ""}</div> : null}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{R.st === "new" && isC && <button className="ar-b ar-tl" onClick={() => recvRef(R)}>📥 استلام الإحالة</button>}
            {(isC || mode === "admin") && <button className="ar-b ar-nv" onClick={() => setCDlg({ R, c: { rs: arr(C.rs), acts: arr(C.acts), plan: C.plan || "", res: C.res || "", by: C.by || by } })}>✍️ {R.st === "done" ? "تعديل الإفادة" : "تعبئة إفادة الموجه"}</button>}
            <button className="ar-b ar-gd" onClick={() => doPrint(api, `إحالة ${R.name}`, refForm(api, R))}>🖨 نموذج الإحالة</button>{s && <button className="ar-b ar-gh" onClick={() => setDocDlg({ s })}>📋 نموذج إجراءات الغياب (ص٧٤)</button>}{s && <button className="ar-b ar-gh" onClick={() => setDocDlg({ s, t: "plg" })}>📝 تعهد الالتزام بالحضور</button>}
            {s && <ProcTicks s={s} P={proc[s.sid]} onMark={markProc} />}</div></div>; })}</div>}

    {tab === "past" && !isC && <PastAbs api={api} D={D} by={by} off={off} toast={toast} onDone={() => load(true)} />}
    {tab === "rules" && <div className="ar-card grid gap-3"><b style={{ fontSize: 16 }}>📘 إجراءات الغياب بدون عذر — المادة (٣٤)</b><div style={{ fontSize: 12.5, color: "#64748b", fontWeight: 700 }}>قواعد السلوك والمواظبة لطلبة التعليم العام — الإصدار الخامس ١٤٤٧هـ</div>
      <div className="ar-lad">{RULES.map(r => <div key={r.k} style={{ "--b": r.bg, "--c": r.c }}><b>{r.t}</b><p>{r.a}</p><p style={{ color: r.c }}>👤 {r.who}</p></div>)}</div>
      <div style={{ background: "#f8fafc", borderRadius: 14, padding: "10px 14px", fontSize: 13, fontWeight: 700, lineHeight: 2 }}>• يُحسم من درجة المواظبة درجة واحدة عن كل يوم غياب بدون عذر.<br />• يُقدَّم العذر مع ما يثبته خلال ثلاثة أيام عمل من الغياب، ويُثبت العذر الصحي من منصة صحتي.<br />• إذا تجاوز الغياب بدون عذر ١٠٪ من أيام الدراسة يُحرم الطالب من الانتقال للعام التالي (المرحلتان الابتدائية والمتوسطة) أو للفصل التالي (المرحلة الثانوية).</div></div>}
    </>}

    {refDlg && <div className="ar-ov" onClick={() => setRefDlg(null)}><div className="ar-card grid gap-2" onClick={e => e.stopPropagation()}>
      <b style={{ fontSize: 17, color: NAVY }}>➡️ نموذج إحالة طالب للموجه الطلابي</b>
      {msg && <div style={{ background: /⚠️/.test(msg) ? "#fef2f2" : "#f0fdf4", color: /⚠️/.test(msg) ? RED : "#15803d", borderRadius: 12, padding: 7, fontWeight: 800, textAlign: "center", fontSize: 13 }}>{msg}</div>}
      <div style={{ background: "#f8fafc", borderRadius: 14, padding: "10px 12px", fontSize: 13.5, fontWeight: 700, lineHeight: 2 }}>الطالب: <b>{refDlg.s.name}</b> — {api.className(refDlg.s.ck)}<br /><span style={{ color: "#64748b" }}>إجمالي غيابه بدون عذر حتى الآن: {ar(refDlg.s.u)} أيام{refDlg.s.cons >= 3 ? ` (${ar(refDlg.s.cons)} متصلة)` : ""}</span></div>
      <b style={{ fontSize: 13.5 }}>📌 يوم الغياب الذي تُحيل الطالب بسببه <small style={{ color: "#64748b", fontWeight: 700 }}>(اختر يوماً أو أكثر)</small></b>
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap", maxHeight: 150, overflow: "auto", padding: 2 }}>{refDlg.s.ud.slice().reverse().map(d => { const on = arr(refDlg.sel).includes(d); return <button key={d} className="ar-b" style={{ padding: "5px 11px", fontSize: 12.5, background: on ? "#b45309" : "#f1f5f9", color: on ? "#fff" : "#334155", border: on ? "none" : "1px solid #e2e8f0" }} onClick={() => setRefDlg(x => ({ ...x, sel: on ? arr(x.sel).filter(y => y !== d) : [...arr(x.sel), d] }))}>{on ? "✓ " : ""}{dayN(d)} {hijN(d)}</button>; })}{!refDlg.s.ud.length && <small style={{ color: "#94a3b8", fontWeight: 700 }}>لا توجد أيام غياب بدون عذر مسجلة</small>}</div>
      <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", background: "#fffbeb", border: "1px dashed #f59e0b", borderRadius: 12, padding: "7px 10px" }}><small style={{ fontWeight: 800, color: "#92400e" }}>➕ يوم غياب سابق غير موجود في القائمة (قبل تفعيل النظام):</small><input className="ar-in" type="date" style={{ flex: "0 1 165px", padding: "5px 8px" }} min={(D && D.f) || yearStart()} max={today()} value={refDlg.pd || ""} onChange={e => setRefDlg({ ...refDlg, pd: e.target.value })} />{refDlg.pd && <small style={{ fontWeight: 700, color: "#475569" }}>{dayN(refDlg.pd)} {hijN(refDlg.pd)}</small>}<button className="ar-b" style={{ padding: "5px 12px", fontSize: 12.5, background: "#b45309", color: "#fff" }} disabled={!refDlg.pd || busy === "pa"} onClick={addPastRef}>{busy === "pa" ? "⏳" : "إضافة كغياب بدون عذر"}</button></div>
      <label style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", fontSize: 13.5, fontWeight: 800 }}>📅 تاريخ الإحالة<input className="ar-in" type="date" style={{ flex: "0 1 170px" }} max={today()} value={refDlg.dk || dk} onChange={e => e.target.value && setRefDlg({ ...refDlg, dk: e.target.value })} /><span style={{ color: "#475569" }}>{dayN(refDlg.dk || dk)} {hij(refDlg.dk || dk)}</span><button className="ar-b ar-gh" style={{ padding: "4px 10px", fontSize: 12 }} onClick={() => setRefDlg({ ...refDlg, dk: today() })}>اليوم</button></label>
      {refDlg.s.u < 3 && <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12, padding: "7px 11px", fontSize: 12.5, fontWeight: 700, color: "#92400e" }}>تنبيه: لم يبلغ غيابه بدون عذر ٣ أيام بعد — الإحالة هنا مبكرة بتقدير الوكيل.</div>}
      <b style={{ fontSize: 13.5 }}>الإجراءات التي اتُّخذت قبل الإحالة</b>
      {["التواصل مع ولي الأمر وإشعاره بالغياب", "إشعار ولي الأمر عبر حساب الطالب", "اتصال هاتفي بولي الأمر", "تنبيه الطالب ومناقشته", "إنذار كتابي"].map(x => <label key={x} className="ar-ck"><input type="checkbox" checked={refDlg.prev.includes(x)} onChange={e => setRefDlg(d => ({ ...d, prev: e.target.checked ? [...d.prev, x] : d.prev.filter(y => y !== x) }))} />{x}</label>)}
      <textarea className="ar-in" style={{ minHeight: 70 }} placeholder="ملاحظات الوكيل للموجه الطلابي (اختياري)" value={refDlg.note} onChange={e => setRefDlg({ ...refDlg, note: e.target.value })} />
      <label className="ar-ck"><input type="checkbox" checked={refDlg.notify} disabled={!refDlg.s.nh} onChange={e => setRefDlg({ ...refDlg, notify: e.target.checked })} />إشعار ولي الأمر بالإحالة في حساب الطالب{!refDlg.s.nh ? " (غير مربوط برقم الهوية)" : ""}</label>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><button className="ar-b" style={{ background: "#b45309", color: "#fff" }} disabled={busy === "r"} onClick={doRef}>➡️ إحالة وإرسال للموجه</button><button className="ar-b ar-gh" onClick={() => setRefDlg(null)}>إلغاء</button></div></div></div>}
    {docDlg && <DocDlg api={api} s={docDlg.s} P={proc[docDlg.s.sid]} by={by} init={docDlg.t || "p74"} toast={toast} onClose={() => { setDocDlg(null); load(); }} />}
    {cDlg && <div className="ar-ov" onClick={() => setCDlg(null)}><div className="ar-card grid gap-2" onClick={e => e.stopPropagation()}>
      <b style={{ fontSize: 17, color: NAVY }}>🧭 إفادة الموجه الطلابي — {cDlg.R.name}</b>
      <b style={{ fontSize: 13.5 }}>أسباب الغياب كما ظهرت من دراسة الحالة</b><div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{REASONS.map(x => { const on = cDlg.c.rs.includes(x); return <button key={x} className="ar-b" style={{ padding: "5px 12px", fontSize: 12.5, background: on ? NAVY : "#f1f5f9", color: on ? "#fff" : "#334155" }} onClick={() => setCDlg(d => ({ ...d, c: { ...d.c, rs: on ? d.c.rs.filter(y => y !== x) : [...d.c.rs, x] } }))}>{x}</button>; })}</div>
      <b style={{ fontSize: 13.5 }}>الإجراءات والخدمات المقدمة</b>{CACTS.map(x => <label key={x} className="ar-ck"><input type="checkbox" checked={cDlg.c.acts.includes(x)} onChange={e => setCDlg(d => ({ ...d, c: { ...d.c, acts: e.target.checked ? [...d.c.acts, x] : d.c.acts.filter(y => y !== x) } }))} />{x}</label>)}
      <textarea className="ar-in" style={{ minHeight: 70 }} placeholder="الخطة العلاجية / التوصيات" value={cDlg.c.plan} onChange={e => setCDlg(d => ({ ...d, c: { ...d.c, plan: e.target.value } }))} />
      <textarea className="ar-in" style={{ minHeight: 50 }} placeholder="نتيجة المتابعة (عند الإغلاق)" value={cDlg.c.res} onChange={e => setCDlg(d => ({ ...d, c: { ...d.c, res: e.target.value } }))} />
      <input className="ar-in" placeholder="اسم الموجه الطلابي" value={cDlg.c.by} onChange={e => setCDlg(d => ({ ...d, c: { ...d.c, by: e.target.value } }))} />
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><button className="ar-b ar-nv" onClick={() => saveCoun(false)}>💾 حفظ (قيد المتابعة)</button><button className="ar-b ar-tl" onClick={() => saveCoun(true)}>✅ حفظ وإغلاق الإحالة</button><button className="ar-b ar-gh" onClick={() => setCDlg(null)}>إلغاء</button></div></div></div>}
  </div>;
}
// تأشير تنفيذ إجراءات المادة ٣٤ للطالب (تظهر تواريخها في النموذج المطبوع)
function ProcTicks({ s, P, onMark }) { const p = obj(P); return <div style={{ display: "flex", gap: 4, flexWrap: "wrap", width: "100%" }}>{RULES.filter(r => r.k !== "d1").map(r => { const on = !!obj(p[r.k]).dk; const dueN = r.k === "cons" ? (s.cons || 0) >= 3 : s.u >= r.n; return <button key={r.k} title={r.a} className="ar-b" style={{ padding: "4px 10px", fontSize: 11.5, background: on ? r.bg : "#fff", color: on ? r.c : dueN ? r.c : "#94a3b8", border: `1.5px ${on ? "solid" : "dashed"} ${dueN || on ? r.c : "#cbd5e1"}` }} onClick={() => onMark(s.sid, r.k, !on)}>{on ? "✓" : "○"} {r.t}{on ? ` ${hijN(obj(p[r.k]).dk)}` : ""}</button>; })}</div>; }
