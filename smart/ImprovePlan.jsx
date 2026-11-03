// ═══════════════════════════════════════════════════════════════
// 🎯 خطة التحسين المدرسي — الاستمارة (1) بناء الخطة • الاستمارة (2) تنفيذ الخطة أسبوعياً
// المصادر: تقرير التقويم المدرسي الذاتي + بطاقة نافس 1447هـ + واقع المدرسة من الموقع (يُحسب لحظياً)
// التوليد بالذكاء الاصطناعي عبر /api/ai (kind: "ip" — عدّاد مستقل عن «درسي الذكي»)
// التخزين (نصوص فقط — لا تُحفظ ملفات): school-ip/cfg • school-ip/b (الاستمارة 1) • school-ip/w/{أحد الأسبوع} (الاستمارة 2) • school-ip/snap
// الختم والتوقيع: يُحفظان على جهاز المدير فقط (localStorage) ولا يُرفعان للموقع
// الطباعة: مطابقة لاستمارتي الوزارة (الألوان والأعمدة والخطوط والأحجام كما في ملفات Word الأصلية)
// ═══════════════════════════════════════════════════════════════
import React, { useEffect, useMemo, useState } from "react";
import { IP_SCHOOL, IP_LV, IP_SE, IP_NAFES, IP_DOMS, IP_PERIOD, IP_NOTE, IP_B0, IP_B0_RECS, IP_W0, IP_W0_RECS } from "./improveData.js";

const NODE = "school-ip";
const LS_SIG = "ip-sig-v1";
const esc = v => String(v ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const nl = v => esc(v).replace(/\n/g, "<br>");
const pad = n => String(n).padStart(2, "0");
const dKey = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const dOf = k => { const [y, m, d] = String(k).split("-").map(Number); return new Date(y, m - 1, d, 12); };
const addD = (k, n) => { const d = dOf(k); d.setDate(d.getDate() + n); return dKey(d); };
const wkOf = k => { const d = dOf(k); d.setDate(d.getDate() - d.getDay()); return dKey(d); };
const hij = (k, yr = false) => { try { const p = {}; new Intl.DateTimeFormat("ar-SA-u-ca-islamic-umalqura-nu-latn", { day: "numeric", month: "numeric", year: "numeric" }).formatToParts(dOf(k)).forEach(x => { p[x.type] = x.value; }); return `${p.day} / ${p.month}${yr ? ` / ${p.year}هـ` : ""}`; } catch { return k; } };
const dayN = k => dOf(k).toLocaleDateString("ar-SA", { weekday: "long" });
const wkLbl = wk => `من الأحد ${hij(wk, true)} إلى الخميس ${hij(addD(wk, 4), true)}`;
const obj = v => (v && typeof v === "object" ? v : {});
const arr = v => (Array.isArray(v) ? v : v && typeof v === "object" ? Object.values(v) : []);
const sigGet = () => { try { return JSON.parse(localStorage.getItem(LS_SIG) || "{}"); } catch { return {}; } };
const sigSet = v => { try { localStorage.setItem(LS_SIG, JSON.stringify(v)); return true; } catch { return false; } };
const fileUrl = f => new Promise((ok, no) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = no; r.readAsDataURL(f); });
const domName = n => String(n || "").replace(/^مجال\s+/, "");

// ── الاتصال بالذكاء الاصطناعي (بث تدريجي) + إصلاح JSON المقطوع
function repairJSON(s) { let o = "", inS = false, esc2 = false; const st = [];
  for (let i = 0; i < s.length; i++) { const c = s[i];
    if (inS) { if (esc2) { esc2 = false; o += c; continue; } if (c === "\\") { esc2 = true; o += c; continue; }
      if (c === '"') { let j = i + 1; while (j < s.length && /\s/.test(s[j])) j++; const nx = s[j]; if (nx === undefined || /[,:}\]]/.test(nx)) { inS = false; o += c; } else o += '\\"'; continue; }
      if (c === "\n") { o += "\\n"; continue; } if (c === "\r" || c === "\t") { o += " "; continue; } o += c; continue; }
    if (c === '"') { inS = true; o += c; continue; } if (c === "{" || c === "[") st.push(c === "{" ? "}" : "]"); else if (c === "}" || c === "]") st.pop(); o += c; }
  if (inS) o += '"'; o = o.replace(/[,:]\s*$/, "").replace(/,\s*"[^"]*"\s*$/, ""); while (st.length) o += st.pop(); return o.replace(/,\s*([}\]])/g, "$1"); }
const parseJSON = t0 => { const t = String(t0 || "").replace(/```(json)?/g, ""); const s = t.indexOf("{"); if (s < 0) throw new Error("لم تُفهم إجابة الذكاء الاصطناعي — أعد المحاولة");
  const e = t.lastIndexOf("}"); const b = e > s ? t.slice(s, e + 1) : t.slice(s); try { return JSON.parse(b); } catch {} try { return JSON.parse(repairJSON(b)); } catch {} try { return JSON.parse(repairJSON(t.slice(s))); } catch {} throw new Error("وصلت الإجابة غير مكتملة — أعد المحاولة"); };
async function callAI(me, prompt, schema, tag, onText, max = 4000) {
  let r; try { r = await fetch("/api/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ hash: me && me.hash, prompt, tag, max, schema, kind: "ip" }) }); } catch { throw new Error("تعذّر الاتصال — تحقق من الإنترنت"); }
  const ct = r.headers.get("content-type") || ""; if (ct.includes("json") || !r.ok) { let j = {}; try { j = await r.json(); } catch {} throw new Error(j.msg || "خدمة الذكاء الاصطناعي غير متاحة الآن"); }
  const rd = r.body.getReader(), dec = new TextDecoder(); let out = ""; for (;;) { const { done, value } = await rd.read(); if (done) break; out += dec.decode(value, { stream: true }); onText && onText(out.length); }
  return parseJSON(out); }

// ── سياق البيانات للذكاء الاصطناعي
const S = { type: "string" };
const B_SCHEMA = { type: "object", properties: { rows: { type: "array", items: { type: "object", properties: { need: S, proc: S, meth: S, dur: S, resp: S }, required: ["need", "proc", "meth", "dur", "resp"] } } }, required: ["rows"] };
const BR_SCHEMA = { type: "object", properties: { recs: { type: "array", items: { type: "object", properties: { h: S, t: S }, required: ["h", "t"] } } }, required: ["recs"] };
const W_SCHEMA = { type: "object", properties: { focus: S, rows: { type: "array", items: { type: "object", properties: { dom: S, el: S, proc: S, dur: S, com: S, sup: S }, required: ["dom", "el", "proc", "dur", "com", "sup"] } }, recs: { type: "array", items: S } }, required: ["focus", "rows", "recs"] };
function ctxText(cfg, snap) {
  const I = [...IP_SE.ind].sort((a, b) => a.p - b.p);
  return [`المدرسة: ${IP_SCHOOL.name} — ${IP_SCHOOL.gender}، المرحلة ${IP_SCHOOL.stage}، ${IP_SCHOOL.edu}، عدد الطلاب ${IP_SCHOOL.students}، مبنى ${IP_SCHOOL.bType}.`,
    `مدة الخطة: من ${cfg.from} إلى ${cfg.to}.`,
    `التقويم المدرسي الذاتي (${IP_SE.cycle}): الأداء العام ${IP_SE.overall}% (${IP_LV(IP_SE.overall)})؛ المجالات: ${IP_SE.domains.map(d => `${d.n} ${d.p}%`).join("، ")}؛ المعايير: ${IP_SE.standards.map(s => `${s[1]} ${s[2]}%`).join("، ")}.`,
    `مؤشرات التقويم الذاتي (من الأدنى؛ المستوى: التميز ≥90، التقدم 75–90، الانطلاق 50–75):`, ...I.map(x => `${x.c} | ${x.t} | ${x.p}% ${IP_LV(x.p)}`),
    `بطاقة نافس ${IP_NAFES.year} (${IP_NAFES.grade}، اختُبر ${IP_NAFES.tested} من ${IP_NAFES.total}): المتقنون في المجالات الثلاثة معاً ${IP_NAFES.all3.s}% (العام السابق ${IP_NAFES.all3.prev}%).`,
    ...IP_NAFES.subj.map(s => `• ${s.n}: المتقنون ${s.prof}% (السابق ${s.prev}%، تغيّر +${s.ch})${s.admin ? `، إدارة التعليم ${s.admin}%` : ""}${s.avg ? `؛ متوسط الدرجة ${s.avg} (إدارة ${s.avgAdmin})` : ""}؛ المجالات الفرعية: ${s.subs.join("، ")}.`),
    snap && arr(snap.lines).length ? `واقع المدرسة من الموقع (محدَّث ${snap.at ? new Date(snap.at).toLocaleDateString("ar-SA") : ""}):\n${arr(snap.lines).map(x => "• " + x).join("\n")}` : "واقع المدرسة من الموقع: غير متوفر بعد."].join("\n"); }
const RULES = `قواعد الكتابة:
- عربية فصيحة إجرائية موجزة، واقعية وقابلة للتنفيذ في مدرسة متوسطة حكومية للبنين بإمكاناتها الحالية، بلا عبارات إنشائية.
- اربط كل احتياج برقم مؤشر التقويم الذاتي ونسبته ومستواه، وبأرقام نافس أو واقع الموقع حين تتصل به.
- الأولوية للمؤشرات في مستوى «الانطلاق» ثم الأدنى في «التقدم»، واستدامة مؤشرات «التميز» بإجراء مختصر.
- الإجراءات والأساليب أسطر تبدأ بـ "- " وكل سطر إجراء محدد قابل للقياس (من؟ ماذا؟ متى؟ بأي أداة؟).
- المسؤولية مسميات وظيفية فقط: مدير المدرسة، وكيل الشؤون التعليمية، وكيل شؤون الطلاب، وكيل المدرسة، الموجه الطلابي، رائد النشاط، المعلمون، معلمو المادة، لجنة التطوير المهني...، كل مسمى في سطر.
- لا تخترع أرقاماً غير واردة في البيانات.`;

// ── الطباعة: الاستمارة (1) — بناء الخطة (Letter أفقي، Sakkal Majalla)
const F1 = "'Sakkal Majalla','Arabic Typesetting','Traditional Arabic','Amiri','Noto Naskh Arabic',serif";
const F2 = "'Arabic Typesetting','Sakkal Majalla','Traditional Arabic','Amiri','Noto Naskh Arabic',serif";
const FONTS = `<link href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Noto+Naskh+Arabic:wght@500;700&display=swap" rel="stylesheet">`;
const ck = (on, a, b) => `( ${on ? "✓" : " "} ) ${a}، ( ${on ? " " : "✓"} ) ${b}`;
function form1Html(cfg, B, opt = {}) {
  const sg = opt.sig ? sigGet() : {}; const rows = arr(B.rows);
  const groups = [["t"], ["o", "a", "g"], ["p"]];
  const head = `<tr class="h"><th style="width:10.1%">المجال</th><th style="width:11.1%">العنصر / المكون / العملية المراد تحسينها</th><th style="width:14.2%">وصف الاحتياج</th><th style="width:22.9%">إجراءات التحسين</th><th style="width:18.7%">أساليب وطرق<br>التحسين</th><th style="width:11.8%">مدة الإنجاز</th><th style="width:11.1%">التنفيذ والمسؤولية</th></tr>`;
  const tbl = ks => { const body = ks.map(k => { const D = IP_DOMS.find(x => x.k === k); const R = rows.filter(r => domName(r.dom) === D.n); if (!R.length) return ""; const f = "#" + D.fill;
      return R.map((r, i) => `<tr style="background:${f}">${i === 0 ? `<td rowspan="${R.length}" class="c dm">${esc(D.n)}</td><td rowspan="${R.length}" class="c el">${D.el.map(e => `<u>${esc(e)}</u>`).join("<br><br>")}</td>` : ""}<td>${nl(r.need)}</td><td>${nl(r.proc)}</td><td>${nl(r.meth)}</td><td class="c">${nl(r.dur)}</td><td class="c">${nl(r.resp)}</td></tr>`).join(""); }).join("");
    return body ? `<table class="m"><thead>${head}</thead><tbody>${body}</tbody></table>` : ""; };
  return `<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>الاستمارة (1) بناء خطة التحسين</title>${FONTS}<style>
@page{size:11in 8.5in;margin:.5in .5in .7in .5in}*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{margin:0;font-family:${F1};font-weight:700;color:#000;font-size:12pt;line-height:1.25}
.hd{display:flex;justify-content:flex-start;align-items:flex-end;height:.71in}.hd img{height:.62in}.bar{height:3px;background:#54A021;margin:2px 0 6px}
.t{font-size:14pt;text-align:justify;margin:2pt 0}.s{font-size:14pt;margin:6pt 0 3pt}
table{width:100%;border-collapse:collapse;direction:rtl}td,th{border:1px solid #000;padding:1pt 5.4pt;vertical-align:top;text-align:right}
.bd td{font-size:13pt}.bd td.l{background:#B7E995}.bd td.v{background:#E9F6D0}.lv td{font-size:13pt}.lv td.l{background:#8DD873}
.m{margin-top:6pt;page-break-inside:auto}thead{display:table-header-group}.m th{background:#8DD873;color:#D9F2D0;font-size:16pt;text-align:center;vertical-align:top}.m td{font-size:12pt}.m td.c{text-align:center}.m td.dm{font-size:16pt;vertical-align:middle}.m td.el{vertical-align:middle}.m u{text-underline-offset:3px}
.note{color:#C00000;font-size:14pt;margin:8pt 0 2pt}.per{color:#1F3864;font-size:14pt;margin:2pt 0 6pt}
.rh{color:#4C94D8;font-size:20pt;margin:14pt 0 4pt}.rc{font-size:12pt;margin:0 0 2pt}.rc b{display:block}
.sg{border:0;margin-top:16pt}.sg td{border:0;text-align:center;font-size:15pt;vertical-align:top}.sg img{max-height:1.1in;max-width:2in}
.pb{page-break-before:always}</style></head><body>
<div class="hd"><img src="${opt.base || ""}/ip/moe1.jpg"></div><div class="bar"></div>
<div class="t">استمارة المدرسة  (1) : بناء خطة التحسين في مجالات الممارسات الإشرافية</div>
<div class="s">أولاً: البيانات  الأساسية:</div>
<table class="bd"><colgroup><col style="width:11.8%"><col style="width:19.8%"><col style="width:11.6%"><col style="width:19.6%"><col style="width:17.7%"><col style="width:19.5%"></colgroup>
<tr><td class="l">اسم المدرسة:</td><td class="v">${esc(cfg.name)}</td><td class="l">المرحلة:</td><td class="v">${esc(cfg.stage)}</td><td class="l">جنس المدرسة:</td><td class="v">${ck(cfg.gender !== "بنات", "بنين", "بنات")}</td></tr>
<tr><td class="l">الرقم الوزاري:</td><td class="v">${esc(cfg.mno)}</td><td class="l">نوع المبنى:</td><td class="v">${ck(cfg.bType !== "مستأجر", "حكومي", "مستأجر")}</td><td class="l">استقلالية المبنى:</td><td class="v">${ck(cfg.bInd !== "مشترك", "مستقل", "مشترك")}</td></tr>
<tr><td class="l">الفترة:</td><td class="v">${ck(cfg.period !== "مسائي", "صباحي", "مسائي")}</td><td class="l">استقلالية الإدارة:</td><td class="v">( ${cfg.aInd !== "مشتركة" ? "✓" : " "} ) مستقلة  ( ${cfg.aInd === "مشتركة" ? "✓" : " "} ) مشتركة</td><td class="l">اسم المدرسة المشتركة في الإدارة:</td><td class="v">${esc(cfg.shared || "— لا يوجد")}</td></tr></table>
<div class="note">${esc(cfg.note)}</div><div class="per">مدة تنفيذ الخطة: من ${esc(cfg.from)} إلى ${esc(cfg.to)}</div>
<table class="lv"><colgroup><col style="width:38%"><col style="width:10.8%"><col style="width:37.4%"><col style="width:13.8%"></colgroup><tr><td class="l">مستوى الأداء العام للمدرسة في التقويم المدرسي (تقديري) :</td><td>${esc(cfg.lvAll)}</td><td class="l">مستوى المدرسة في نواتج التعلم في التقويم المدرسي (تقديري) :</td><td>${esc(cfg.lvOut)}</td></tr></table>
<div class="s">ثانياً: إجراءات خطة التحسين في مجالات الممارسات الإشرافية</div>
${groups.map(tbl).join("")}
<div class="rh">ثالثاً: التوصيات والمقترحات:</div>
${arr(B.recs).map(r => `<div class="rc"><b>•  ${esc(r.h)}:</b>${nl(r.t)}</div>`).join("")}
<table class="sg"><tr><td style="width:25%">مدير المدرسة<br>${esc(cfg.mgr)}<br>التوقيع<br>${sg.sig ? `<img src="${sg.sig}">` : ""}</td><td></td><td style="width:25%">الختم<br>${sg.stamp ? `<img src="${sg.stamp}">` : ""}</td></tr></table>
<script>setTimeout(()=>print(),700)<\/script></body></html>`; }

// ── الطباعة: الاستمارة (2) — تنفيذ الخطة (A4 أفقي، Arabic Typesetting، ترويسة متكررة)
function form2Html(cfg, W, wk, opt = {}) {
  const sg = opt.sig ? sigGet() : {}; const rows = arr(W.rows);
  return `<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>الاستمارة (2) تنفيذ خطة التحسين — ${esc(wkLbl(wk))}</title>${FONTS}<style>
@page{size:A4 landscape;margin:.5in}*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{margin:0;font-family:${F2};font-weight:700;color:#000;font-size:16pt;line-height:1.15}
.ph{display:flex;align-items:center;justify-content:center;position:relative;min-height:.9in}.ph img{position:absolute;left:0;top:0;height:.85in}.ph div{color:#80340D;font-size:18pt;text-align:center;max-width:62%}
table{width:100%;border-collapse:collapse;direction:rtl}td,th{border:.5pt solid #000;padding:1pt 5.4pt;vertical-align:top;text-align:right}
.s1{color:#FF0000;font-size:14pt;margin:6pt 0 3pt}.bd td{font-size:16pt;color:#000}.bd td.l{background:#84E290}.bd td.v{background:#D9F2D0}.bd td.n{font-size:14pt}
.red{color:#C00000;font-size:16pt;margin:6pt 0 2pt}.per{color:#1F3864;font-size:16pt;margin:2pt 0 6pt}.lv td{border:.5pt solid #000;color:#FF0000;font-size:16pt}
.s2{color:#FF0000;font-size:16pt;margin:8pt 0 4pt}.m thead th{background:#8DD873;color:#fff;font-size:18pt;text-align:center;vertical-align:middle}.m thead tr.sub th{background:#BFEBD3;color:#000;font-size:16pt}
.m td{font-size:16pt;color:#0070C0}.m td.dm{color:#000}.m tr{page-break-inside:avoid}.m tbody tr:nth-child(even) td{background:#D9F2D0}.m tbody tr:nth-child(odd) td{background:#fff}
.rh{color:#00B050;font-size:18pt;margin:12pt 0 3pt}.rc{color:#0070C0;font-size:18pt;margin:0}.wk{color:#0070C0;font-size:14pt;margin:2pt 0}
.sg{margin-top:10pt}.sg td{border:0;text-align:center;color:#0070C0;font-size:15pt}.sg img{max-height:1.15in;max-width:2in}
table.wrap,table.wrap>thead>tr>td,table.wrap>tbody>tr>td{border:0;padding:0}thead{display:table-header-group}</style></head><body>
<table class="wrap"><thead><tr><td><div class="ph"><img src="${opt.base || ""}/ip/moe2.png"><div>استمارة المدرسة (2) تنفيذ خطة التحسين في مجالات الممارسات الإشرافية</div></div></td></tr></thead><tbody><tr><td>
<div class="s1">أولا: البيانات الأساسية:</div>
<table class="bd"><colgroup><col style="width:13.5%"><col style="width:19.9%"><col style="width:13.2%"><col style="width:14.5%"><col style="width:20.8%"><col style="width:18.1%"></colgroup>
<tr><td class="l">اسم المدرسة</td><td class="v n">${esc(cfg.name)}</td><td class="l">المرحلة</td><td class="v">المرحلة ${esc(cfg.stage)}</td><td class="l">جنس المدرسة</td><td class="v">${esc(cfg.gender)}</td></tr>
<tr><td class="l">الرقم الوزاري</td><td class="v n">${esc(cfg.mno)}</td><td class="l">نوع المبنى</td><td class="v">${esc(cfg.bType)}</td><td class="l">استقلالية المبنى</td><td class="v">${esc(cfg.bInd)}</td></tr>
<tr><td class="l">الفترة</td><td class="v n">${esc(cfg.period)}</td><td class="l">استقلالية الإدارة</td><td class="v">${esc(cfg.aInd)}</td><td class="l">اسم المدرسة المشتركة بالإدارة</td><td class="v">${esc(cfg.shared || "—")}</td></tr></table>
<div class="red">${esc(cfg.note)}</div><div class="per">مدة تنفيذ الخطة: من ${esc(cfg.from)} إلى ${esc(cfg.to)}</div>
<div class="wk">الأسبوع: ${esc(wkLbl(wk))}${W.focus ? ` — محور الأسبوع: ${esc(W.focus)}` : ""}</div>
<table class="lv"><colgroup><col style="width:34.7%"><col style="width:10.1%"><col style="width:34.1%"><col style="width:21.1%"></colgroup><tr><td>مستوى الأداء العام للمدرسة في التقويم المدرسي (تقديري):</td><td>${esc(cfg.lvAll)}</td><td>مستوى المدرسة في نواتج التعلم في التقويم المدرسي (تقديري):</td><td>${esc(cfg.lvOut)}</td></tr></table>
<div class="s2">ثانيا: إجراءات تنفيذ خطة التحسين في مجالات الممارسات الإشرافية</div>
<table class="m"><colgroup><col style="width:11.9%"><col style="width:20.5%"><col style="width:34.1%"><col style="width:11.4%"><col style="width:12.1%"><col style="width:10%"></colgroup>
<thead><tr><th rowspan="2">المجال</th><th rowspan="2">العنصر / المكون</th><th rowspan="2">الإجراءات المنفذة</th><th rowspan="2">فترة التنفيذ</th><th colspan="2">مقدم خدمات دعم التميز المدرسي</th></tr><tr class="sub"><th>لجان المدرسة</th><th>المشرف التربوي</th></tr></thead>
<tbody>${rows.map(r => `<tr><td class="dm">${nl(r.dom)}</td><td>${nl(r.el)}</td><td>${nl(r.proc)}</td><td>${nl(r.dur)}</td><td>${nl(r.com)}</td><td>${nl(r.sup)}</td></tr>`).join("")}</tbody></table>
<div class="rh">ثالثا: التوصيات</div>
<div class="rc">${arr(W.recs).map((r, i) => `${i + 1}) ${esc(r)}`).join("<br>")}</div>
<table class="sg"><colgroup><col style="width:23.4%"><col style="width:53.2%"><col style="width:23.4%"></colgroup><tr><td>مدير المدرسة<br>${esc(cfg.mgr)}<br>التوقيع<br>${sg.sig ? `<img src="${sg.sig}">` : ""}</td><td></td><td>الختم<br>${sg.stamp ? `<img src="${sg.stamp}">` : ""}</td></tr></table>
</td></tr></tbody></table><script>setTimeout(()=>print(),700)<\/script></body></html>`; }
const openPrint = html => { const w = window.open("", "_blank"); if (!w) { alert("اسمح بالنوافذ المنبثقة للطباعة"); return; } w.document.write(html); w.document.close(); };

// ── واجهة الإدارة
const CSS = `
.ip{font-family:'IBM Plex Sans Arabic',Cairo,Tahoma,sans-serif;color:#0f172a;display:grid;gap:12px;max-width:1150px;margin:0 auto}
.ip *{box-sizing:border-box}.ip-hero{border-radius:24px;padding:18px 20px;color:#fff;background:radial-gradient(420px 220px at 90% 0%,rgba(141,216,115,.35),transparent 60%),linear-gradient(135deg,#14321c,#1f6b34 55%,#54A021)}
.ip-hero h2{margin:0;font-size:22px;font-weight:900}.ip-hero p{margin:4px 0 0;font-size:13px;font-weight:700;opacity:.9;line-height:1.8}
.ip-tabs{display:flex;gap:6px;flex-wrap:wrap}.ip-tab{border:2px solid #e2e8f0;background:#fff;border-radius:999px;padding:7px 14px;font:800 13px inherit;font-family:inherit;color:#334155;cursor:pointer}.ip-tab.on{background:#1f6b34;border-color:#1f6b34;color:#fff}
.ip-card{background:#fff;border:1.5px solid #e2e8f0;border-radius:18px;padding:14px;display:grid;gap:10px}
.ip-b{border:1.5px solid #cbd5e1;background:#fff;border-radius:12px;padding:7px 14px;font-family:inherit;font-weight:900;font-size:13px;cursor:pointer;color:#0f172a;display:inline-flex;gap:6px;align-items:center}.ip-b:disabled{opacity:.5;cursor:default}
.ip-b.pri{background:#1f6b34;border-color:#1f6b34;color:#fff}.ip-b.ai{background:linear-gradient(135deg,#4338ca,#0f766e);border:0;color:#fff}.ip-b.gold{background:#a16207;border-color:#a16207;color:#fff}.ip-b.red{color:#b91c1c;border-color:#fca5a5}
.ip-in{width:100%;border:1.5px solid #dbe4e1;border-radius:10px;padding:6px 9px;font-family:inherit;font-size:13px;font-weight:700;color:#0f172a;background:#fbfdfc;resize:vertical;line-height:1.7}
.ip-dom{border-radius:16px;border:2px solid #8DD873;overflow:hidden}.ip-dh{background:#8DD873;padding:8px 12px;display:flex;gap:8px;align-items:center;flex-wrap:wrap}.ip-dh b{font-size:16px;color:#14321c}
.ip-el{font-size:11.5px;font-weight:800;background:#E9F6D0;color:#1f6b34;border-radius:8px;padding:2px 8px}
.ip-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:6px;padding:10px;border-top:1.5px dashed #c1f0c7;position:relative}.ip-row label{display:grid;gap:3px;font-size:11.5px;font-weight:900;color:#475569}
.ip-x{position:absolute;left:8px;top:6px;border:0;background:#fee2e2;color:#b91c1c;border-radius:8px;font-weight:900;cursor:pointer;padding:0 7px}
.ip-kp{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px}.ip-kp>div{border:1.5px solid #e2e8f0;border-radius:14px;padding:10px;text-align:center;border-bottom:4px solid var(--c)}.ip-kp b{display:block;font-size:20px;color:var(--c)}.ip-kp small{font-weight:800;color:#64748b;font-size:11.5px}
.ip-ind{display:grid;grid-template-columns:70px 1fr 74px;gap:6px;align-items:center;font-size:12.5px;font-weight:700;border-bottom:1px solid #f1f5f9;padding:4px 0}.ip-lv{border-radius:8px;color:#fff;text-align:center;font-weight:900;font-size:11.5px;padding:3px 0}
.ip-need{display:flex;gap:6px;align-items:center;flex-wrap:wrap;border:1.5px solid #e2e8f0;border-radius:12px;padding:6px 10px;font-size:13px;font-weight:700}
.ip-busy{position:fixed;inset:0;background:rgba(15,23,42,.55);z-index:9999;display:grid;place-items:center}.ip-busy>div{background:#fff;border-radius:22px;padding:22px 26px;text-align:center;font-weight:900;max-width:92vw}
.ip-spin{width:54px;height:54px;border-radius:50%;border:5px solid #e2e8f0;border-top-color:#1f6b34;animation:ipS 1s linear infinite;margin:0 auto 10px}@keyframes ipS{to{transform:rotate(360deg)}}
.ip-tg{font-size:11px;font-weight:900;border-radius:999px;padding:2px 8px}`;
const LVC = p => p >= 90 ? "#059669" : p >= 75 ? "#1d6fe8" : p >= 50 ? "#d9650a" : "#dc2626";
const CFG0 = { ...IP_SCHOOL, from: IP_PERIOD.from, to: IP_PERIOD.to, note: IP_NOTE, lvAll: `التقدم ${IP_SE.overall}%`, lvOut: `الانطلاق ${IP_SE.out}%`, sup: "المشرف المقيم" };
const EMPTY_B = d => ({ dom: d, need: "", proc: "", meth: "", dur: "", resp: "" });
const EMPTY_W = () => ({ dom: "مجال التدريس", el: "", proc: "", dur: "", com: "", sup: "المشرف المقيم" });
const W_DOMS = ["مجال التدريس", "مجال نواتج التعلم", "مجال الأنشطة المدرسية", "مجال التوجيه الطلابي", "مجال التطوير المهني"];

export function ImprovePlanAdmin({ by = "الإدارة", me, api }) {
  const { maGet, maPut } = api;
  const today = dKey(new Date());
  const [tab, setTab] = useState("src"); const [cfg, setCfg] = useState(null); const [B, setB] = useState(null); const [snap, setSnap] = useState(null); const [weeks, setWeeks] = useState({});
  const [wk, setWk] = useState(wkOf(today)); const [W, setW] = useState(null); const [dirtyB, setDirtyB] = useState(false); const [dirtyW, setDirtyW] = useState(false);
  const [busy, setBusy] = useState(""); const [prog, setProg] = useState(0); const [msg, setMsg] = useState(""); const [nd, setNd] = useState({ t: "", dom: "مجال التدريس", src: "ملاحظة الإدارة" }); const [sig, setSig] = useState(sigGet()); const [useSig, setUseSig] = useState(true);
  const toast = t => { setMsg(t); setTimeout(() => setMsg(""), 4000); };
  useEffect(() => { (async () => { const [c, b, s, wi] = await Promise.all([maGet(`${NODE}/cfg`), maGet(`${NODE}/b`), maGet(`${NODE}/snap`), maGet(`${NODE}/wi`)]);
    setCfg({ ...CFG0, ...obj(c) }); setB(obj(b).rows ? { ...obj(b), rows: arr(obj(b).rows), recs: arr(obj(b).recs) } : { rows: IP_B0.map(r => ({ ...r })), recs: IP_B0_RECS.map(r => ({ ...r })), seed: 1 }); setSnap(obj(s).lines ? obj(s) : null); setWeeks(obj(wi)); })().catch(() => { setCfg(CFG0); setB({ rows: IP_B0, recs: IP_B0_RECS, seed: 1 }); }); }, []);
  useEffect(() => { setW(null); setDirtyW(false); maGet(`${NODE}/w/${wk}`).then(v => { const o = obj(v); setW(o.rows || o.needs ? { ...o, rows: arr(o.rows), recs: arr(o.recs), needs: arr(o.needs) } : { rows: [], recs: [], needs: [], fresh: 1 }); }).catch(() => setW({ rows: [], recs: [], needs: [], fresh: 1 })); }, [wk]);
  const saveB = async (b = B) => { const v = { rows: b.rows, recs: b.recs, at: Date.now(), by }; const ok = await maPut(`${NODE}/b`, v); if (ok) { setB({ ...b, seed: 0 }); setDirtyB(false); } toast(ok ? "✅ حُفظت الاستمارة (1)" : "⚠️ تعذّر الحفظ"); return ok; };
  const saveW = async (w = W) => { const v = { focus: w.focus || "", rows: w.rows, recs: w.recs, needs: w.needs, at: Date.now(), by, ai: w.ai || 0 }; const ok = await maPut(`${NODE}/w/${wk}`, v);
    if (ok) { const ix = { n: w.rows.length, nd: w.needs.length, at: v.at, f: (w.focus || "").slice(0, 120) }; await maPut(`${NODE}/wi/${wk}`, ix); setWeeks(x => ({ ...x, [wk]: ix })); setW({ ...w, fresh: 0 }); setDirtyW(false); } toast(ok ? "✅ حُفظت خطة الأسبوع وأُرشفت" : "⚠️ تعذّر الحفظ"); return ok; };
  const saveCfg = async c => { setCfg(c); const ok = await maPut(`${NODE}/cfg`, Object.fromEntries(Object.entries(c).filter(([k]) => ["from", "to", "note", "lvAll", "lvOut", "mgr", "name", "stage", "gender", "mno", "bType", "bInd", "period", "aInd", "shared", "sup"].includes(k)))); toast(ok ? "✅ حُفظ الإعداد" : "⚠️ تعذّر الحفظ"); };
  const refreshSnap = async () => { if (!api.snap) return null; setBusy("snap"); try { const s = await api.snap(); const v = { ...s, at: Date.now() }; setSnap(v); await maPut(`${NODE}/snap`, v); toast("✅ حُدّثت بيانات واقع المدرسة"); return v; } catch { toast("⚠️ تعذّر تحديث بيانات الموقع"); return null; } finally { setBusy(""); } };
  // ── توليد الاستمارة (1)
  const genDom = async (D, s0) => { const ctx = ctxText(cfg, s0 || snap); const ex = IP_B0.find(r => r.dom === D.n) || IP_B0[0];
    const prompt = `${ctx}\n\n${RULES}\n\nالمطلوب: صفوف «الاستمارة (1): بناء خطة التحسين» لمجال «${D.n}» فقط. عناصر هذا المجال الثابتة: ${D.el.join("، ")}.\n- من 3 إلى 6 صفوف حسب الاحتياج الفعلي؛ كل صف احتياج واحد؛ اختصر دون إخلال.\n- need: وصف الاحتياج ثم سطر «المؤشر X-X-X-X» ثم سطر «النسبة% – المستوى» (وأضف «أولوية عاجلة» للانطلاق).\n- proc: إجراءات التحسين (3–4 أسطر). meth: أساليب وطرق التحسين (2–4 أسطر).\n- dur: «من 17 / 3\\nإلى 25 / 7» أو مدة أدق ضمن مدة الخطة مع «(متابعة أسبوعية)» أو «(اختبار محاكٍ شهري)» عند الحاجة.\n- resp: مسميات وظيفية كل منها في سطر.\nمثال صياغة صف من الخطة الحالية (للأسلوب فقط): ${JSON.stringify({ need: ex.need, proc: ex.proc, meth: ex.meth, dur: ex.dur, resp: ex.resp })}`;
    const j = await callAI(me, prompt, B_SCHEMA, "ip-b-" + D.k, n => setProg(p => Math.max(p, n)), 3000); return arr(j.rows).map(r => ({ dom: D.n, need: r.need || "", proc: r.proc || "", meth: r.meth || "", dur: r.dur || "", resp: r.resp || "" })); };
  const genB = async only => { if (!me || !me.hash) { alert("سجّل الدخول من بوابة الإداريين برقم السجل المدني"); return; } if (!window.confirm(only ? `توليد صفوف مجال «${only.n}» من جديد بالذكاء الاصطناعي؟ (تستبدل صفوف هذا المجال)` : "توليد الاستمارة (1) كاملة بالذكاء الاصطناعي؟ تستبدل الصفوف والتوصيات الحالية (يمكنك التعديل بعدها).")) return;
    setBusy(only ? "b1" : "b"); setProg(0); try { const s0 = snap || await refreshSnap(); setBusy(only ? "b1" : "b");
      const Ds = only ? [only] : IP_DOMS; const res = await Promise.all(Ds.map(D => genDom(D, s0).then(r => [D.n, r]).catch(e => [D.n, null, e])));
      const bad = res.filter(x => !x[1]); let rows = [...B.rows]; res.filter(x => x[1]).forEach(([n, r]) => { rows = rows.filter(x => domName(x.dom) !== n); rows.push(...r); }); rows.sort((a, b) => IP_DOMS.findIndex(d => d.n === domName(a.dom)) - IP_DOMS.findIndex(d => d.n === domName(b.dom)));
      let recs = B.recs; if (!only) { try { const j = await callAI(me, `${ctxText(cfg, s0)}\n\nخطة البناء المولّدة (مختصرة):\n${rows.map(r => `- ${domName(r.dom)}: ${String(r.need).split("\n")[0]}`).join("\n")}\n\nالمطلوب: «ثالثاً: التوصيات والمقترحات» للاستمارة (1): من 4 إلى 6 توصيات؛ h عنوان قصير، t سطران محددان بالأرقام والمؤشرات.`, BR_SCHEMA, "ip-b-recs", null, 1500); if (arr(j.recs).length) recs = arr(j.recs); } catch {} }
      const nb = { ...B, rows, recs }; setB(nb); await saveB(nb); if (bad.length) alert(`تعذّر توليد: ${bad.map(x => x[0]).join("، ")} — ${bad[0][2] && bad[0][2].message || ""}\nأعد المحاولة لهذا المجال من زر «✨» بجانبه.`);
    } catch (e) { alert(e.message || String(e)); } finally { setBusy(""); } };
  // ── الاحتياجات المقترحة من الموقع + توليد خطة الأسبوع
  const sugNeeds = async () => { const s = (await refreshSnap()) || snap; const L = arr(s && s.needs).filter(x => !W.needs.some(n => n.t === x.t)); if (!L.length) { toast("لا توجد احتياجات جديدة من بيانات الموقع هذا الأسبوع"); return; } setW(w => ({ ...w, needs: [...w.needs, ...L.map(x => ({ ...x, src: x.src || "واقع الموقع", at: Date.now() }))] })); setDirtyW(true); toast(`💡 أُضيف ${L.length} احتياج من واقع المدرسة`); };
  const genW = async () => { if (!me || !me.hash) { alert("سجّل الدخول من بوابة الإداريين برقم السجل المدني"); return; } if (W.rows.length && !window.confirm("توليد خطة هذا الأسبوع من جديد؟ تُستبدل الصفوف الحالية (يمكنك التعديل بعدها).")) return;
    setBusy("w"); setProg(0); try { const s0 = snap || await refreshSnap(); setBusy("w");
      const prevKs = Object.keys(weeks).filter(k => k < wk).sort().slice(-2); const prev = (await Promise.all(prevKs.map(k => maGet(`${NODE}/w/${k}`)))).map((v, i) => [prevKs[i], obj(v)]);
      const bPlan = B.rows.map(r => `- [${domName(r.dom)}] ${String(r.need).replace(/\n/g, " ")} ⇐ ${String(r.proc).split("\n").slice(0, 2).join(" ")}`).join("\n").slice(0, 6000);
      const prompt = `${ctxText(cfg, s0)}\n\nخطة البناء المعتمدة (الاستمارة 1) مختصرة:\n${bPlan}\n\n${prev.length ? `ما نُفّذ في الأسابيع السابقة (لا تكرره حرفياً؛ طوّر عليه أو انتقل لمرحلته التالية):\n${prev.map(([k, w]) => `أسبوع ${hij(k, true)}${w.focus ? ` (محور: ${w.focus})` : ""}: ${arr(w.rows).map(r => `${r.dom}: ${String(r.proc).split("\n")[0]}`).join(" | ")}`).join("\n").slice(0, 3000)}\n\n` : ""}احتياجات هذا الأسبوع (${wkLbl(wk)}):\n${W.needs.length ? W.needs.map(n => `- [${n.dom || ""}] ${n.t} (المصدر: ${n.src || "الإدارة"})`).join("\n") : "- لا توجد احتياجات مضافة؛ اعتمد على أولويات التقويم الذاتي ونافس وواقع الموقع."}\n\n${RULES}\n\nالمطلوب: «الاستمارة (2): تنفيذ خطة التحسين» لهذا الأسبوع فقط (الأحد–الخميس).\n- focus: محور الأسبوع في جملة واحدة.\n- rows: من 4 إلى 7 صفوف تغطي الاحتياجات أولاً ثم الأولويات؛ dom بصيغة «مجال التدريس / مجال نواتج التعلم / مجال الأنشطة المدرسية / مجال التوجيه الطلابي / مجال التطوير المهني».\n- el: العنصر/المكون (جملة قصيرة). proc: الإجراءات المنفذة هذا الأسبوع (3–5 أسطر تبدأ بـ «- »، محددة باليوم أو الحصة أو الأداة، مع برامج وأفكار جديدة غير مكررة).\n- dur: «من ${hij(wk)}\\nإلى ${hij(addD(wk, 4))}» أو أيام محددة داخل الأسبوع. com: لجان/مسؤولو المدرسة (مسميات). sup: «${cfg.sup || "المشرف المقيم"}».\n- recs: من 3 إلى 5 توصيات قصيرة للأسبوع، تشمل مؤشر قياس الأثر.`;
      const j = await callAI(me, prompt, W_SCHEMA, "ip-w-" + wk, n => setProg(p => Math.max(p, n)), 3200);
      const nw = { ...W, focus: j.focus || "", rows: arr(j.rows).map(r => ({ dom: r.dom || "", el: r.el || "", proc: r.proc || "", dur: r.dur || "", com: r.com || "", sup: r.sup || cfg.sup || "" })), recs: arr(j.recs).filter(Boolean), ai: Date.now() };
      setW(nw); await saveW(nw);
    } catch (e) { alert(e.message || String(e)); } finally { setBusy(""); } };
  const copyPrev = async () => { const k = Object.keys(weeks).filter(x => x < wk).sort().pop(); if (!k) { toast("لا يوجد أسبوع سابق محفوظ"); return; } const v = obj(await maGet(`${NODE}/w/${k}`)); setW(w => ({ ...w, rows: arr(v.rows).map(r => ({ ...r })), recs: arr(v.recs), focus: v.focus || "" })); setDirtyW(true); toast(`📋 نُسخت خطة أسبوع ${hij(k, true)} — عدّلها ثم احفظ`); };
  const useBase = () => { setW(w => ({ ...w, rows: IP_W0.map(r => ({ ...r })), recs: [...IP_W0_RECS] })); setDirtyW(true); };
  const base = (() => { try { return location.origin; } catch { return ""; } })();
  if (!cfg || !B) return <div className="ip"><style>{CSS}</style><div className="ip-card" style={{ textAlign: "center", color: "#94a3b8", fontWeight: 900 }}>⏳ جارٍ التحميل…</div></div>;
  const setBr = (i, k, v) => { setB(b => ({ ...b, rows: b.rows.map((r, j) => j === i ? { ...r, [k]: v } : r) })); setDirtyB(true); };
  const setWr = (i, k, v) => { setW(w => ({ ...w, rows: w.rows.map((r, j) => j === i ? { ...r, [k]: v } : r) })); setDirtyW(true); };
  const low = [...IP_SE.ind].sort((a, b) => a.p - b.p);
  const wks = Object.keys(weeks).sort().reverse();
  return <div className="ip" dir="rtl"><style>{CSS}</style>
    <div className="ip-hero"><h2>🎯 خطة التحسين المدرسي</h2><p>الاستمارة (1) بناء الخطة • الاستمارة (2) تنفيذ الخطة أسبوعياً — مبنية على التقويم الذاتي ({IP_SE.overall}% {IP_LV(IP_SE.overall)}) ونافس {IP_NAFES.year} وواقع المدرسة من الموقع، وتُطبع بنفس شكل الاستمارتين الرسميتين.</p></div>
    <div className="ip-tabs">{[["src", "📊 مصادر الخطة"], ["b", `🏗️ الاستمارة (1) البناء${dirtyB ? " •" : ""}`], ["w", `🗓️ الاستمارة (2) الأسبوعية${dirtyW ? " •" : ""}`], ["arc", `🗂️ الأرشيف (${wks.length})`], ["cfg", "⚙️ الإعداد"]].map(([k, l]) => <button key={k} className={`ip-tab ${tab === k ? "on" : ""}`} onClick={() => setTab(k)}>{l}</button>)}</div>

    {tab === "src" && <>
      <div className="ip-kp">{[["#1d6fe8", `${IP_SE.overall}%`, "الأداء العام (تقدم)"], ...IP_SE.domains.map(d => [LVC(d.p), `${d.p}%`, d.n]), ["#dc2626", `${IP_NAFES.all3.s}%`, "متقنو نافس (الثلاثة)"]].map(([c, v, l], i) => <div key={i} style={{ "--c": c }}><b>{v}</b><small>{l}</small></div>)}</div>
      <div className="ip-card"><b>📉 مؤشرات التقويم الذاتي من الأدنى</b>{low.slice(0, 12).map(x => <div key={x.c} className="ip-ind"><b style={{ direction: "ltr", textAlign: "right" }}>{x.c}</b><span>{x.t}</span><span className="ip-lv" style={{ background: LVC(x.p) }}>{x.p}%<br />{IP_LV(x.p)}</span></div>)}<small style={{ color: "#64748b", fontWeight: 800 }}>و{low.length - 12} مؤشراً آخر في «التقدم» و«التميز» — كلها تُرسل للذكاء الاصطناعي عند التوليد.</small></div>
      <div className="ip-card"><b>🎯 نافس {IP_NAFES.year} — {IP_NAFES.grade} ({IP_NAFES.tested} من {IP_NAFES.total} طالباً)</b>
        <div className="ip-kp">{IP_NAFES.subj.map(s => <div key={s.k} style={{ "--c": s.admin && s.prof < s.admin ? "#dc2626" : "#1d6fe8" }}><b>{s.prof}%</b><small>{s.n} • +{s.ch}{s.admin ? ` • الإدارة ${s.admin}%` : ""}</small></div>)}</div></div>
      <div className="ip-card"><div className="flex" style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}><b style={{ flex: 1 }}>🏫 واقع المدرسة من الموقع {snap && snap.at ? <small style={{ color: "#64748b" }}>— محدّث {new Date(snap.at).toLocaleString("ar-SA")}</small> : null}</b><button className="ip-b" disabled={!!busy} onClick={refreshSnap}>{busy === "snap" ? "⏳" : "↻ تحديث من الموقع"}</button></div>
        {snap ? <ul style={{ margin: 0, paddingInlineStart: 18, fontSize: 13, fontWeight: 700, lineHeight: 1.9 }}>{arr(snap.lines).map((x, i) => <li key={i}>{x}</li>)}</ul> : <div style={{ color: "#64748b", fontWeight: 800 }}>اضغط «تحديث من الموقع» لحساب الغياب والتأخر والسلوك ونتائج التشخيصي وانضباط المعلمين وملاحظات الحصص.</div>}</div>
    </>}

    {tab === "b" && <>
      <div className="ip-card" style={{ background: "#f6fef9", borderColor: "#8DD873" }}><div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <b style={{ flex: 1, minWidth: 200 }}>الاستمارة (1): بناء خطة التحسين — المجالات والعناصر ثابتة كما في الاستمارة الرسمية{B.seed ? <small style={{ color: "#a16207" }}> • المعروض الآن محتوى ملفك الحالي</small> : null}</b>
        <button className="ip-b ai" disabled={!!busy} onClick={() => genB(null)}>✨ توليد الخطة كاملة</button><button className="ip-b pri" disabled={!!busy || (!dirtyB && !B.seed)} onClick={() => saveB()}>💾 حفظ</button><button className="ip-b gold" onClick={() => openPrint(form1Html(cfg, B, { sig: useSig, base }))}>🖨 طباعة الاستمارة (1)</button></div></div>
      {IP_DOMS.map(D => { const idx = B.rows.map((r, i) => [r, i]).filter(([r]) => domName(r.dom) === D.n); return <div key={D.k} className="ip-dom" style={{ background: "#" + D.fill }}>
        <div className="ip-dh"><b>{D.n}</b>{D.el.map(e => <span key={e} className="ip-el">{e}</span>)}<span style={{ marginInlineStart: "auto", display: "flex", gap: 6 }}><button className="ip-b" style={{ padding: "4px 10px" }} disabled={!!busy} onClick={() => genB(D)}>✨ توليد المجال</button><button className="ip-b" style={{ padding: "4px 10px" }} onClick={() => { setB(b => ({ ...b, rows: [...b.rows, EMPTY_B(D.n)] })); setDirtyB(true); }}>＋ احتياج</button></span></div>
        {idx.map(([r, i]) => <div key={i} className="ip-row"><button className="ip-x" title="حذف" onClick={() => { if (window.confirm("حذف هذا الصف؟")) { setB(b => ({ ...b, rows: b.rows.filter((_, j) => j !== i) })); setDirtyB(true); } }}>✕</button>
          {[["need", "وصف الاحتياج"], ["proc", "إجراءات التحسين"], ["meth", "أساليب وطرق التحسين"], ["dur", "مدة الإنجاز"], ["resp", "التنفيذ والمسؤولية"]].map(([k, l]) => <label key={k}>{l}<textarea className="ip-in" rows={k === "proc" || k === "meth" ? 5 : 3} value={r[k]} onChange={e => setBr(i, k, e.target.value)} /></label>)}</div>)}
        {!idx.length && <div style={{ padding: 10, fontWeight: 800, color: "#64748b" }}>لا توجد احتياجات — أضف أو اضغط «✨ توليد المجال».</div>}</div>; })}
      <div className="ip-card"><b style={{ color: "#4C94D8" }}>ثالثاً: التوصيات والمقترحات</b>{B.recs.map((r, i) => <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 2fr auto", gap: 6 }}><input className="ip-in" value={r.h} onChange={e => { setB(b => ({ ...b, recs: b.recs.map((x, j) => j === i ? { ...x, h: e.target.value } : x) })); setDirtyB(true); }} /><textarea className="ip-in" rows={2} value={r.t} onChange={e => { setB(b => ({ ...b, recs: b.recs.map((x, j) => j === i ? { ...x, t: e.target.value } : x) })); setDirtyB(true); }} /><button className="ip-b red" onClick={() => { setB(b => ({ ...b, recs: b.recs.filter((_, j) => j !== i) })); setDirtyB(true); }}>✕</button></div>)}
        <button className="ip-b" style={{ justifySelf: "start" }} onClick={() => { setB(b => ({ ...b, recs: [...b.recs, { h: "", t: "" }] })); setDirtyB(true); }}>＋ توصية</button></div>
    </>}

    {tab === "w" && (!W ? <div className="ip-card" style={{ textAlign: "center", color: "#94a3b8" }}>⏳</div> : <>
      <div className="ip-card" style={{ background: "#f8fafc" }}><div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <button className="ip-b" onClick={() => setWk(addD(wk, -7))}>→</button><b style={{ fontSize: 15 }}>🗓️ {wkLbl(wk)}</b><button className="ip-b" onClick={() => setWk(addD(wk, 7))}>←</button>{wk !== wkOf(today) && <button className="ip-b" onClick={() => setWk(wkOf(today))}>هذا الأسبوع</button>}
        {W.ai ? <span className="ip-tg" style={{ background: "#e0e7ff", color: "#4338ca" }}>✨ مولّدة بالذكاء الاصطناعي</span> : null}{weeks[wk] ? <span className="ip-tg" style={{ background: "#dcfce7", color: "#166534" }}>🗂️ مؤرشفة</span> : <span className="ip-tg" style={{ background: "#fef3c7", color: "#92400e" }}>لم تُحفظ بعد</span>}</div></div>
      <div className="ip-card"><b>① احتياجات هذا الأسبوع ({W.needs.length})</b>
        {W.needs.map((n, i) => <div key={i} className="ip-need"><span className="ip-tg" style={{ background: "#E9F6D0", color: "#1f6b34" }}>{n.dom}</span><span style={{ flex: 1 }}>{n.t}</span><small style={{ color: "#64748b" }}>{n.src}</small><button className="ip-b red" style={{ padding: "2px 8px" }} onClick={() => { setW(w => ({ ...w, needs: w.needs.filter((_, j) => j !== i) })); setDirtyW(true); }}>✕</button></div>)}
        <div style={{ display: "grid", gridTemplateColumns: "minmax(140px,190px) 1fr auto", gap: 6 }}><select className="ip-in" value={nd.dom} onChange={e => setNd({ ...nd, dom: e.target.value })}>{W_DOMS.map(d => <option key={d}>{d}</option>)}</select><input className="ip-in" value={nd.t} onChange={e => setNd({ ...nd, t: e.target.value })} placeholder="احتياج جديد هذا الأسبوع… مثال: تدني نتائج اختبار الكسور في ثاني/٢" onKeyDown={e => { if (e.key === "Enter" && nd.t.trim()) { setW(w => ({ ...w, needs: [...w.needs, { ...nd, t: nd.t.trim(), at: Date.now() }] })); setNd({ ...nd, t: "" }); setDirtyW(true); } }} /><button className="ip-b" disabled={!nd.t.trim()} onClick={() => { setW(w => ({ ...w, needs: [...w.needs, { ...nd, t: nd.t.trim(), at: Date.now() }] })); setNd({ ...nd, t: "" }); setDirtyW(true); }}>＋ إضافة</button></div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}><button className="ip-b" disabled={!!busy} onClick={sugNeeds}>{busy === "snap" ? "⏳" : "💡 اقترح احتياجات من واقع الموقع"}</button></div></div>
      <div className="ip-card" style={{ borderColor: "#8DD873" }}><div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}><b style={{ flex: 1, minWidth: 180 }}>② إجراءات تنفيذ الخطة هذا الأسبوع ({W.rows.length})</b>
        <button className="ip-b ai" disabled={!!busy} onClick={genW}>✨ توليد خطة الأسبوع</button>{!W.rows.length && <button className="ip-b" onClick={copyPrev}>📋 نسخ الأسبوع السابق</button>}{!W.rows.length && <button className="ip-b" onClick={useBase}>📄 من ملفك الحالي</button>}
        <button className="ip-b pri" disabled={!!busy || !dirtyW} onClick={() => saveW()}>💾 حفظ وأرشفة</button><button className="ip-b gold" disabled={!W.rows.length} onClick={() => openPrint(form2Html(cfg, W, wk, { sig: useSig, base }))}>🖨 طباعة الاستمارة (2)</button></div>
        <label style={{ fontWeight: 900, fontSize: 12.5, display: "grid", gap: 3 }}>محور الأسبوع<input className="ip-in" value={W.focus || ""} onChange={e => { setW(w => ({ ...w, focus: e.target.value })); setDirtyW(true); }} /></label>
        {W.rows.map((r, i) => <div key={i} className="ip-row" style={{ background: i % 2 ? "#D9F2D0" : "#fff", borderRadius: 12, border: "1.5px solid #c1f0c7" }}><button className="ip-x" onClick={() => { setW(w => ({ ...w, rows: w.rows.filter((_, j) => j !== i) })); setDirtyW(true); }}>✕</button>
          <label>المجال<select className="ip-in" value={r.dom} onChange={e => setWr(i, "dom", e.target.value)}>{[...new Set([...W_DOMS, r.dom])].map(d => <option key={d}>{d}</option>)}</select></label>
          {[["el", "العنصر / المكون", 3], ["proc", "الإجراءات المنفذة", 6], ["dur", "فترة التنفيذ", 2], ["com", "لجان المدرسة", 3], ["sup", "المشرف التربوي", 2]].map(([k, l, n]) => <label key={k}>{l}<textarea className="ip-in" rows={n} value={r[k]} onChange={e => setWr(i, k, e.target.value)} /></label>)}</div>)}
        <button className="ip-b" style={{ justifySelf: "start" }} onClick={() => { setW(w => ({ ...w, rows: [...w.rows, { ...EMPTY_W(), sup: cfg.sup || "المشرف المقيم" }] })); setDirtyW(true); }}>＋ صف</button></div>
      <div className="ip-card"><b style={{ color: "#00B050" }}>③ التوصيات</b>{W.recs.map((r, i) => <div key={i} style={{ display: "flex", gap: 6 }}><b style={{ paddingTop: 6 }}>{i + 1})</b><textarea className="ip-in" rows={2} value={r} onChange={e => { setW(w => ({ ...w, recs: w.recs.map((x, j) => j === i ? e.target.value : x) })); setDirtyW(true); }} /><button className="ip-b red" onClick={() => { setW(w => ({ ...w, recs: w.recs.filter((_, j) => j !== i) })); setDirtyW(true); }}>✕</button></div>)}
        <button className="ip-b" style={{ justifySelf: "start" }} onClick={() => { setW(w => ({ ...w, recs: [...w.recs, ""] })); setDirtyW(true); }}>＋ توصية</button></div>
    </>)}

    {tab === "arc" && <div className="ip-card"><b>🗂️ أرشيف الاستمارة (2) الأسبوعية</b>{!wks.length && <div style={{ color: "#64748b", fontWeight: 800 }}>لا توجد أسابيع محفوظة بعد — احفظ خطة الأسبوع من تبويب «الاستمارة (2)».</div>}
      {wks.map(k => { const x = obj(weeks[k]); return <div key={k} className="ip-need"><b style={{ minWidth: 230 }}>{wkLbl(k)}</b><span style={{ flex: 1, color: "#475569" }}>{x.f || "—"}</span><span className="ip-tg" style={{ background: "#f1f5f9", color: "#334155" }}>{x.n || 0} إجراء • {x.nd || 0} احتياج</span>
        <button className="ip-b" style={{ padding: "3px 10px" }} onClick={() => { setWk(k); setTab("w"); }}>فتح</button><button className="ip-b gold" style={{ padding: "3px 10px" }} onClick={async () => { const v = obj(await maGet(`${NODE}/w/${k}`)); openPrint(form2Html(cfg, { ...v, rows: arr(v.rows), recs: arr(v.recs) }, k, { sig: useSig, base })); }}>🖨</button></div>; })}</div>}

    {tab === "cfg" && <>
      <div className="ip-card"><b>⚙️ بيانات الاستمارتين</b><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 8 }}>
        {[["name", "اسم المدرسة"], ["mno", "الرقم الوزاري"], ["mgr", "مدير المدرسة"], ["from", "بداية مدة الخطة"], ["to", "نهاية مدة الخطة"], ["lvAll", "مستوى الأداء العام (تقديري)"], ["lvOut", "مستوى نواتج التعلم (تقديري)"], ["sup", "المشرف التربوي (الافتراضي)"]].map(([k, l]) => <label key={k} style={{ display: "grid", gap: 3, fontWeight: 900, fontSize: 12.5 }}>{l}<input className="ip-in" defaultValue={cfg[k]} onBlur={e => e.target.value !== cfg[k] && saveCfg({ ...cfg, [k]: e.target.value })} /></label>)}</div>
        <label style={{ display: "grid", gap: 3, fontWeight: 900, fontSize: 12.5 }}>الملاحظة أعلى الاستمارة<textarea className="ip-in" rows={2} defaultValue={cfg.note} onBlur={e => e.target.value !== cfg.note && saveCfg({ ...cfg, note: e.target.value })} /></label></div>
      <div className="ip-card"><b>🔏 الختم والتوقيع (على جهازك فقط)</b><div style={{ fontSize: 12.5, fontWeight: 700, color: "#475569", lineHeight: 1.8 }}>لحماية ختم المدرسة وتوقيعك: تُحفظ الصورتان في هذا المتصفح فقط، ولا تُرفعان إلى الموقع أو قاعدة البيانات، وتظهران في الطباعة من هذا الجهاز. على جهاز آخر أضفهما مرة أخرى أو اختم يدوياً.</div>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "flex-end" }}>{[["sig", "التوقيع"], ["stamp", "الختم"]].map(([k, l]) => <label key={k} style={{ display: "grid", gap: 4, justifyItems: "center", fontWeight: 900, fontSize: 12.5, cursor: "pointer" }}>{sig[k] ? <img src={sig[k]} alt="" style={{ height: 70, maxWidth: 140, objectFit: "contain", border: "1.5px solid #e2e8f0", borderRadius: 10, background: "#fff" }} /> : <span style={{ width: 120, height: 70, border: "2px dashed #cbd5e1", borderRadius: 10, display: "grid", placeItems: "center", color: "#94a3b8" }}>＋ {l}</span>}{l}
          <input type="file" accept="image/*" style={{ display: "none" }} onChange={async e => { const f = e.target.files && e.target.files[0]; e.target.value = ""; if (!f) return; const u = await fileUrl(f); const n = { ...sig, [k]: u }; if (sigSet(n)) { setSig(n); toast(`✅ حُفظ ${l} على هذا الجهاز`); } else toast("⚠️ الصورة كبيرة — صغّرها وأعد المحاولة"); }} /></label>)}
          {(sig.sig || sig.stamp) && <button className="ip-b red" onClick={() => { sigSet({}); setSig({}); }}>حذف من هذا الجهاز</button>}
          <label style={{ display: "flex", gap: 6, alignItems: "center", fontWeight: 900, fontSize: 13 }}><input type="checkbox" checked={useSig} onChange={e => setUseSig(e.target.checked)} /> إظهارهما في الطباعة</label></div></div>
    </>}

    {busy && busy !== "snap" && <div className="ip-busy"><div><div className="ip-spin" /><div>{busy === "w" ? "✨ يُعِدّ الذكاء الاصطناعي خطة هذا الأسبوع…" : busy === "b1" ? "✨ يُعِدّ صفوف المجال…" : "✨ يُعِدّ الاستمارة (1) — خمسة مجالات معاً…"}</div><small style={{ color: "#64748b", fontWeight: 800 }}>{prog ? `وصل ${Math.round(prog / 1000)} ألف حرف` : "يقرأ التقويم الذاتي ونافس وواقع المدرسة…"} — قد يستغرق دقيقة</small></div></div>}
    {msg && <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 9000, background: "#0f172a", color: "#fff", padding: "10px 18px", borderRadius: 14, fontWeight: 800 }}>{msg}</div>}
  </div>;
}
export default ImprovePlanAdmin;
export { form1Html, form2Html };
