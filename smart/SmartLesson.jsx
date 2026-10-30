// ═════════════════════════════════════════════════════════════════
// ✨ درسي الذكي — يصوّر المعلم درسه (أو يختاره من الفهرس) فيستخرج الذكاء الاصطناعي:
//    الأهداف وفق المنهج السعودي • مستويات بلوم • مهارات التفكير العليا • الربط بالحياة • خطة السير • بطاقة الخروج
//    مع وضع العرض أمام الطلاب، والطباعة، وبنك دروس مشترك يوفّر التكلفة والوقت
// • المفتاح في Vercel فقط (api/ai.js) — لا يصل إلى المتصفح
// • دروس المعلم          school-sl-my/{hk}/{id}
// • بنك الدروس المشترك   school-sl-bank/{subjKey}/{lessonKey}
// • الإعدادات والعدّادات  school-sl-cfg • school-sl-use • school-sl-usem • school-sl-log
// ═════════════════════════════════════════════════════════════════
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import MATH3 from "./math3.js";
import { visSVG, VIS_SCHEMA, visPrompt, VIS_NAMES, VFONT } from "./visuals.js";
// خطوط ودودة للطلاب: «بالو بهيجان» للعناوين والعرض، و«تجوّل» للنصوص
if (typeof document !== "undefined" && !document.getElementById("sl-fonts")) { const l = document.createElement("link"); l.id = "sl-fonts"; l.rel = "stylesheet"; l.href = "https://fonts.googleapis.com/css2?family=Baloo+Bhaijaan+2:wght@500;600;700;800&family=Tajawal:wght@400;500;700;800;900&display=swap"; document.head.appendChild(l); }

const SL_MY = "school-sl-my", SL_BANK = "school-sl-bank", SL_CFG = "school-sl-cfg", SL_USEM = "school-sl-usem", SL_LOG = "school-sl-log", SL_USE = "school-sl-use";
const IDX = { [`رياضيات|الثالث المتوسط|الفصل الدراسي الأول`]: MATH3 };
const SUBJ = ["رياضيات", "علوم", "لغتي", "الدراسات الإسلامية", "الدراسات الاجتماعية", "اللغة الإنجليزية", "المهارات الرقمية", "التفكير الناقد", "التربية الفنية", "التربية البدنية والدفاع عن النفس", "المهارات الحياتية والأسرية"];
const GRADES = ["الأول المتوسط", "الثاني المتوسط", "الثالث المتوسط"];
const TERMS = ["الفصل الدراسي الأول", "الفصل الدراسي الثاني"];
const NAFES_SUBJ = { "رياضيات": "الرياضيات", "علوم": "العلوم", "لغتي": "القراءة (لغتي)" };
const BLOOM = [["تذكر", "#64748b"], ["فهم", "#0891b2"], ["تطبيق", "#16a34a"], ["تحليل", "#d97706"], ["تقويم", "#dc2626"], ["إبداع", "#7c3aed"]];
const bColor = b => (BLOOM.find(x => String(b || "").includes(x[0])) || ["", "#475569"])[1];
const HOT_IC = { "تحليل": "🔍", "تقويم": "⚖️", "إبداع": "💡", "تفكير ناقد": "🧠", "حل مشكلات": "🧩", "استدلال": "🔗", "تبرير": "🗣️", "تعميم": "🌐" };
const hotIc = s => { const k = Object.keys(HOT_IC).find(k => String(s || "").includes(k)); return k ? HOT_IC[k] : "✨"; };
const LIFE_IC = ["🏙️", "🕋", "🛒", "⚽", "🌴", "🚗", "💼", "🏥", "🌍"];
const ar = n => String(n ?? "").replace(/\d/g, d => "٠١٢٣٤٥٦٧٨٩"[d]);
const arr = v => Array.isArray(v) ? v.filter(x => x != null && x !== "") : (v && typeof v === "object" ? Object.values(v).filter(Boolean) : []);
const obj = v => (v && typeof v === "object" ? v : {});
const lsGet = (k, d = null) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const fk = s => String(s || "").replace(/[.#$/\[\]]/g, "_").replace(/\s+/g, "_").slice(0, 90);
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const today = () => { const d = new Date(Date.now() + 3 * 3600e3); return d.toISOString().slice(0, 10); };

// ── ضغط الصورة قبل الإرسال (أسرع وأرخص)
const shrink = file => new Promise((res, rej) => {
  const fr = new FileReader(); fr.onerror = rej;
  fr.onload = () => { const im = new Image(); im.onerror = rej; im.onload = () => { const M = 1400, s = Math.min(1, M / Math.max(im.width, im.height)); const c = document.createElement("canvas"); c.width = Math.round(im.width * s); c.height = Math.round(im.height * s); const g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height); g.drawImage(im, 0, 0, c.width, c.height); res(c.toDataURL("image/jpeg", .78)); }; im.src = fr.result; };
  fr.readAsDataURL(file);
});

// ── صياغة الطلب
function buildPrompt({ subj, grade, term, L, chap, title, note, nImg }) {
  const nf = grade === "الثالث المتوسط" && NAFES_SUBJ[subj];
  const ref = L ? `\nمرجع الدرس من دليل المعلم الرسمي (التزم به):\n- الفصل: ${chap}\n- عنوان الدرس: ${L.t}\n- فيما سبق: ${L.prior}\n- أهداف الدرس في الكتاب (والآن): ${L.obj.join(" • ")}\n- المفردات: ${(L.vocab || []).join("، ") || "—"}\n- فقرة «لماذا؟» في الكتاب: ${L.why}\n- ما بعد الدرس: ${L.next || "—"}` : `\nلا يتوفر فهرس رسمي لهذا الدرس؛ استنتج الأهداف من ${nImg ? "صور صفحات الكتاب المرفقة" : "عنوان الدرس"} وفق وثيقة منهج المادة للمرحلة المتوسطة في المملكة، واذكر في الحقل src أنها مستنتجة.`;
  return `حلّل درسًا لمعلم سعودي وأعدّ له مادة تدريس متميزة.
المادة: ${subj} — الصف: ${grade} — ${term}
${title ? "عنوان الدرس كما كتبه المعلم: " + title : ""}${ref}
${nImg ? `مرفق ${nImg} صورة لصفحات الدرس من كتاب الطالب: اعتمد على محتواها وأمثلتها.` : ""}
${note ? "ملاحظة المعلم: " + note : ""}
المطلوب: أخرج JSON واحدًا فقط بلا أي نص قبله أو بعده، بالمفاتيح الآتية وبالعربية، موجزًا (كل نص لا يتجاوز ٢٥ كلمة). لا تستعمل علامة التنصيص " داخل النصوص إطلاقًا، واستعمل «» بدلًا منها:
{
"title":"عنوان الدرس","unit":"الفصل/الوحدة","big":"الفكرة الكبرى للدرس في جملة واحدة ملهمة","src":"${L ? "دليل المعلم" : "مستنتج من الكتاب"}",
"obj":[{"t":"أن + فعل سلوكي قابل للقياس + المحتوى (مثل: أن يحلّ الطالب…)","b":"أحد: تذكر|فهم|تطبيق|تحليل|تقويم|إبداع","d":"معرفي|مهاري|وجداني"}] (٤–٦ أهداف متدرجة تشمل أهداف الكتاب وتصل إلى المستويات العليا، وهدف وجداني واحد),
"prior":["متطلب سابق"] (٢–٣),
"vocab":[{"w":"المصطلح","d":"تعريف مختصر دقيق"}],
"hook":{"t":"عنوان جذاب","text":"تهيئة مثيرة لدقيقتين من واقع الطالب","q":"سؤال يفتح النقاش"},
"life":[{"t":"عنوان قصير","text":"موقف حقيقي من الحياة في المملكة يظهر فيه مفهوم الدرس","q":"سؤال للطالب على الموقف"}] (٣ مواقف متنوعة),
"hots":[{"s":"تحليل|تقويم|إبداع|تفكير ناقد|حل مشكلات|استدلال","q":"سؤال تفكير عليا مرتبط بمحتوى الدرس نفسه","a":"إجابة نموذجية أو مؤشر للإجابة"}] (٥ أسئلة بمهارات مختلفة),
"flow":[{"ph":"تهيئة|استكشاف|شرح|تطبيق موجّه|تقويم ختامي","min":عدد الدقائق,"tch":"دور المعلم","stu":"نشاط الطالب"}] (مجموع الدقائق ٤٥),
"strat":["اسم استراتيجية: سبب اختيارها لهذا الدرس"] (٣),
"exit":[{"q":"سؤال بطاقة الخروج","a":"الإجابة"}] (٣ أسئلة قصيرة متدرجة),
"diff":{"low":"دعم الطلاب المتعثرين","high":"إثراء للمتميزين"},
"values":"قيمة أو ربط برؤية المملكة ٢٠٣٠ بلا تكلّف"${nf ? `,\n"nafes":"المهارة أو المجال المرتبط بالدرس في اختبارات نافس (${nf}) وكيف يُدرَّب عليه"` : ""}
}`;
}
// قالب البيانات المطلوب (يُرسل للخادم فيُلزم الذكاء بإخراج JSON سليم)
const S_ = { type: "string" }, SA = { type: "array", items: S_ };
const OA = p => ({ type: "array", items: { type: "object", properties: Object.fromEntries(p.map(k => [k, k === "min" ? { type: "number" } : S_])), required: p } });
const SCHEMA = { type: "object", properties: {
  title: S_, unit: S_, big: S_, src: S_, obj: OA(["t", "b", "d"]), prior: SA, vocab: OA(["w", "d"]),
  hook: { type: "object", properties: { t: S_, text: S_, q: S_ }, required: ["t", "text", "q"] },
  life: OA(["t", "text", "q"]), hots: OA(["s", "q", "a"]), flow: OA(["ph", "min", "tch", "stu"]), strat: SA, exit: OA(["q", "a"]),
  diff: { type: "object", properties: { low: S_, high: S_ }, required: ["low", "high"] }, values: S_, nafes: S_ },
  required: ["title", "unit", "big", "obj", "prior", "vocab", "hook", "life", "hots", "flow", "strat", "exit", "diff", "values"] };
// إصلاح ردود JSON المعيبة: علامات تنصيص غير مهرّبة داخل النصوص، أسطر جديدة، فواصل زائدة، رد مقطوع
function repairJSON(t) {
  let o = "", inS = false, key = false, st = [];
  const nx = j => { while (j < t.length && /\s/.test(t[j])) j++; return j; };
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (inS) {
      if (c === "\\") { o += c + (t[i + 1] || ""); i++; continue; }
      if (c === '"') {
        const j = nx(i + 1), n = t[j]; let end;
        if (n === undefined) end = true;
        else if (key) end = n === ":";
        else if (n === "}" || n === "]") end = true;
        else if (n === ",") { const k = t[nx(j + 1)]; end = k === undefined || /["{\[\-\d]/.test(k); }
        else end = false;
        if (end) { inS = false; o += c; } else o += '\\"';
        continue;
      }
      if (c === "\n") { o += "\\n"; continue; } if (c === "\r" || c === "\t") { o += " "; continue; }
      o += c; continue;
    }
    if (c === '"') { const p = o.replace(/\s+$/, "").slice(-1); key = st[st.length - 1] === "}" && (p === "{" || p === ","); inS = true; o += c; continue; }
    if (c === "{" || c === "[") st.push(c === "{" ? "}" : "]"); else if (c === "}" || c === "]") st.pop();
    o += c;
  }
  if (inS) o += '"';
  o = o.replace(/[,:]\s*$/, "").replace(/,\s*"[^"]*"\s*$/, "");
  while (st.length) o += st.pop();
  return o.replace(/,\s*([}\]])/g, "$1");
}
const parseJSON = txt => {
  const t = String(txt || "").replace(/```(json)?/g, ""); const s = t.indexOf("{"); if (s < 0) throw new Error("لم تُفهم إجابة الذكاء الاصطناعي — أعد المحاولة");
  const e = t.lastIndexOf("}"); const body = e > s ? t.slice(s, e + 1) : t.slice(s);
  try { return JSON.parse(body); } catch {}
  try { return JSON.parse(repairJSON(body)); } catch {}
  try { return JSON.parse(repairJSON(t.slice(s))); } catch {}
  throw new Error("وصلت إجابة الذكاء غير مكتملة — اضغط «حلّل الدرس» مرة أخرى");
};

// ── الاتصال بالوسيط (/api/ai) مع البث التدريجي — وعند عدم ضبط المفتاح في Vercel يُستعمل مفتاح الجهاز إن وُجد
async function callAI({ me, api, prompt, images, tag, onText, schema = SCHEMA, kind = "", max = 6000 }) {
  let r;
  try { r = await fetch("/api/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ hash: me.hash, prompt, images, tag, max, schema, kind }) }); }
  catch { throw new Error("تعذّر الاتصال — تحقق من الإنترنت"); }
  const ct = r.headers.get("content-type") || "";
  if (!r.ok && !ct.includes("json")) { if (api.directAI) return api.directAI(prompt, images); throw new Error("خدمة الذكاء الاصطناعي غير مفعّلة بعد على الخادم (api/ai.js)"); }
  if (ct.includes("json")) { const j = await r.json(); if (j.code === "nokey" && api.directAI) return api.directAI(prompt, images); throw new Error(j.msg || "تعذّر التحليل"); }
  const rd = r.body.getReader(), dec = new TextDecoder(); let out = "";
  for (;;) { const { done, value } = await rd.read(); if (done) break; out += dec.decode(value, { stream: true }); onText && onText(out); }
  return out;
}

const CSS = `
.sl{font-family:'Tajawal',Cairo,Tahoma,sans-serif;color:#0f172a;--ink:#0b1b3a;--gold:#c9a227;--teal:#0f766e}
.sl *{box-sizing:border-box}
.sl-hero{position:relative;overflow:hidden;border-radius:26px;padding:22px 24px;color:#fff;background:radial-gradient(120% 140% at 100% 0%,#1e3a8a 0%,#0b1b3a 55%,#062a2a 100%);box-shadow:0 24px 50px -30px #0b1b3a}
.sl-hero h2{margin:0;font-size:27px;font-weight:800;font-family:${VFONT}}.sl-h,.sl-top h1,.slp-t,.slp-k,.sl-vis b{font-family:${VFONT}!important}.sl-hero p{margin:6px 0 0;font-size:13.5px;font-weight:700;opacity:.85;line-height:1.9}
.sl-hero .orb{position:absolute;width:240px;height:240px;border-radius:50%;left:-70px;top:-90px;background:radial-gradient(circle,#c9a22755,transparent 70%)}
.sl-hero .orb2{position:absolute;width:180px;height:180px;border-radius:50%;left:30%;bottom:-120px;background:radial-gradient(circle,#14b8a655,transparent 70%)}
.sl-q{display:inline-flex;gap:6px;align-items:center;background:#ffffff1f;border:1px solid #ffffff33;border-radius:999px;padding:4px 12px;font-size:12px;font-weight:800;margin-top:10px}
.sl-card{background:#fff;border:1px solid #e8edf4;border-radius:22px;padding:16px 18px;box-shadow:0 10px 30px -26px #0b1b3a}
.sl-h{display:flex;align-items:center;gap:8px;margin:0 0 12px;font-size:16px;font-weight:900;color:var(--ink)}.sl-h::after{content:"";flex:1;height:2px;border-radius:2px;background:linear-gradient(90deg,#e2e8f0,transparent)}
.sl-h i{font-style:normal;width:34px;height:34px;border-radius:11px;display:grid;place-items:center;background:linear-gradient(135deg,var(--c,#1e3a8a),var(--c2,#0f766e));color:#fff;font-size:17px;box-shadow:0 8px 16px -10px var(--c,#1e3a8a)}
.sl-tabs{display:flex;gap:8px;flex-wrap:wrap}.sl-tab{border:2px solid #e2e8f0;background:#fff;border-radius:999px;padding:7px 16px;font:800 13px Cairo,Tahoma;color:#475569;cursor:pointer}.sl-tab.on{background:var(--ink);border-color:var(--ink);color:#fff}
.sl-sel{display:flex;gap:8px;flex-wrap:wrap}.sl-chip{border:2px solid #e2e8f0;background:#fff;border-radius:14px;padding:8px 14px;font:800 13.5px Cairo,Tahoma;color:#334155;cursor:pointer;transition:.15s}.sl-chip:hover{border-color:#94a3b8}.sl-chip.on{border-color:#1e3a8a;background:#eef2ff;color:#1e3a8a;box-shadow:0 6px 14px -10px #1e3a8a}
.sl-chip small{display:block;font-size:10.5px;color:#16a34a;font-weight:900}
.sl-b{border:0;border-radius:14px;padding:10px 18px;font:900 14px Cairo,Tahoma;cursor:pointer;display:inline-flex;align-items:center;gap:6px;transition:.15s}.sl-b:disabled{opacity:.5;cursor:not-allowed}
.sl-b.pri{background:linear-gradient(135deg,#1e3a8a,#0f766e);color:#fff;box-shadow:0 12px 24px -14px #1e3a8a}.sl-b.pri:hover:not(:disabled){transform:translateY(-1px)}
.sl-b.gold{background:linear-gradient(135deg,#c9a227,#a16207);color:#fff}.sl-b.gh{background:#f1f5f9;color:#334155}.sl-b.red{background:#fee2e2;color:#b91c1c}.sl-b.sm{padding:6px 12px;font-size:12.5px;border-radius:11px}
.sl-in{width:100%;border:2px solid #e2e8f0;border-radius:12px;padding:9px 12px;font:700 14px Cairo,Tahoma;outline:none;background:#fff}.sl-in:focus{border-color:#1e3a8a}
.sl-ch{margin-bottom:12px}.sl-ch>b{display:block;font-size:13px;color:#64748b;font-weight:900;margin:6px 2px}
.sl-ls{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:8px}
.sl-l{position:relative;text-align:right;border:2px solid #eef2f6;background:#fff;border-radius:14px;padding:10px 12px;cursor:pointer;font:800 13.5px Cairo,Tahoma;color:#1e293b;line-height:1.6}.sl-l:hover{border-color:#94a3b8}.sl-l.on{border-color:#0f766e;background:#f0fdfa}
.sl-l u{text-decoration:none;display:inline-block;min-width:34px;text-align:center;border-radius:8px;background:#0b1b3a;color:#fff;font-size:11.5px;padding:1px 6px;margin-left:6px}.sl-l .bk{position:absolute;left:8px;top:-8px;background:#c9a227;color:#fff;border-radius:999px;font-size:10.5px;padding:1px 8px}
.sl-drop{border:2.5px dashed #cbd5e1;border-radius:18px;padding:16px;text-align:center;background:#f8fafc;cursor:pointer;font-weight:800;color:#475569}
.sl-th{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.sl-th div{position:relative}.sl-th img{width:86px;height:110px;object-fit:cover;border-radius:10px;border:2px solid #e2e8f0}.sl-th button{position:absolute;top:-6px;left:-6px;width:22px;height:22px;border-radius:50%;border:0;background:#dc2626;color:#fff;font-weight:900;cursor:pointer}
.sl-load{display:grid;place-items:center;text-align:center;padding:34px 16px}
.sl-brain{width:96px;height:96px;border-radius:30px;display:grid;place-items:center;font-size:46px;background:conic-gradient(from 0deg,#1e3a8a,#0f766e,#c9a227,#1e3a8a);animation:slSpin 3s linear infinite;box-shadow:0 20px 40px -20px #1e3a8a}.sl-brain span{display:grid;place-items:center;width:82px;height:82px;border-radius:24px;background:#fff;animation:slSpin 3s linear infinite reverse}
@keyframes slSpin{to{transform:rotate(360deg)}}
.sl-pb{width:min(420px,90%);height:9px;border-radius:9px;background:#e2e8f0;overflow:hidden;margin-top:14px}.sl-pb i{display:block;height:100%;background:linear-gradient(90deg,#1e3a8a,#0f766e,#c9a227);border-radius:9px;transition:width .4s}
.sl-res{display:grid;gap:14px}
.sl-top{position:relative;overflow:hidden;border-radius:26px;padding:22px;color:#fff;background:linear-gradient(135deg,#0b1b3a,#123b6b 55%,#0f766e)}
.sl-top h1{margin:4px 0 6px;font-size:26px;font-weight:900;line-height:1.5}.sl-top .big{font-size:15.5px;font-weight:800;line-height:1.9;background:#ffffff14;border-right:4px solid #c9a227;border-radius:12px;padding:8px 12px}
.sl-tg{display:inline-block;border-radius:999px;padding:3px 11px;font-size:11.5px;font-weight:900;background:#ffffff22;margin:0 0 0 6px}
.sl-ob{display:flex;gap:10px;align-items:flex-start;padding:10px 0;border-bottom:1px dashed #e2e8f0}.sl-ob:last-child{border-bottom:0}
.sl-ob .n{flex:none;width:30px;height:30px;border-radius:10px;display:grid;place-items:center;background:#0b1b3a;color:#fff;font-weight:900;font-size:13px}
.sl-ob .t{flex:1;font-size:14.5px;font-weight:800;line-height:1.9}
.sl-bl{flex:none;border-radius:999px;padding:3px 10px;font-size:11.5px;font-weight:900;color:#fff}
.sl-lad{display:flex;gap:4px;align-items:flex-end;height:64px;margin-top:8px}.sl-lad div{flex:1;text-align:center;font-size:10.5px;font-weight:900;color:#64748b}.sl-lad i{display:block;border-radius:6px 6px 0 0;margin:0 auto 3px;width:80%;min-height:4px;transition:height .4s}
.sl-g2{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:14px}
.sl-voc{display:flex;flex-wrap:wrap;gap:8px}.sl-voc span{background:#eef2ff;border:1px solid #c7d2fe;color:#1e3a8a;border-radius:12px;padding:6px 10px;font-size:13px;font-weight:800;line-height:1.7}.sl-voc span em{font-style:normal;display:block;font-size:11.5px;color:#475569;font-weight:700}
.sl-hook{border-radius:20px;padding:16px;background:linear-gradient(135deg,#fffbeb,#fef3c7);border:1.5px solid #fde68a}
.sl-hot{border-radius:18px;padding:12px 14px;border:1.5px solid #e2e8f0;background:#fff;position:relative}.sl-hot .s{display:inline-flex;gap:6px;align-items:center;font-size:12px;font-weight:900;color:#7c3aed;background:#f5f3ff;border-radius:999px;padding:2px 10px}
.sl-hot .q{font-size:14.5px;font-weight:800;line-height:1.9;margin:6px 0}.sl-hot .a{font-size:13px;font-weight:700;color:#166534;background:#f0fdf4;border-radius:10px;padding:6px 10px;line-height:1.8}
.sl-life{border-radius:18px;padding:14px;background:linear-gradient(160deg,#ecfeff,#f0fdfa);border:1.5px solid #a5f3fc}.sl-life b{display:flex;gap:6px;align-items:center;font-size:14.5px;color:#0e7490}.sl-life p{margin:6px 0;font-size:13.5px;font-weight:700;line-height:1.9;color:#134e4a}.sl-life .q{font-size:13px;font-weight:900;color:#0f766e}
.sl-fl{position:relative;padding-right:22px}.sl-fl::before{content:"";position:absolute;right:8px;top:6px;bottom:6px;width:3px;border-radius:3px;background:linear-gradient(#1e3a8a,#0f766e,#c9a227)}
.sl-fi{position:relative;margin-bottom:10px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:10px 12px}.sl-fi::before{content:"";position:absolute;right:-19px;top:14px;width:13px;height:13px;border-radius:50%;background:#fff;border:3px solid #0f766e}
.sl-fi b{font-size:14px}.sl-fi .m{float:left;background:#0b1b3a;color:#fff;border-radius:999px;font-size:11.5px;font-weight:900;padding:1px 9px}.sl-fi div{font-size:13px;font-weight:700;line-height:1.8;color:#334155;margin-top:4px}
.sl-ex{display:grid;gap:8px}.sl-ex div{border-radius:14px;padding:10px 12px;background:#fff7ed;border:1px solid #fed7aa;font-size:13.5px;font-weight:800;line-height:1.8}
.sl-act{position:sticky;bottom:10px;z-index:5;display:flex;gap:8px;flex-wrap:wrap;justify-content:center;background:#ffffffe6;backdrop-filter:blur(8px);border:1px solid #e2e8f0;border-radius:18px;padding:10px;box-shadow:0 14px 30px -20px #0b1b3a}
.sl-e{width:100%;border:1.5px solid #93c5fd;border-radius:10px;padding:6px 9px;font:700 13.5px Cairo,Tahoma;background:#eff6ff;resize:vertical}
.sl-msg{border-radius:14px;padding:10px 14px;font-weight:800;font-size:13.5px}
.sl-bank{display:flex;gap:10px;align-items:center;flex-wrap:wrap;border-radius:16px;padding:12px 14px;background:linear-gradient(135deg,#fffbeb,#fef9c3);border:1.5px solid #facc15;font-weight:800;font-size:13.5px;color:#713f12}
.sl-my{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:10px}.sl-my button.c{text-align:right;border:1px solid #e2e8f0;background:#fff;border-radius:18px;padding:12px 14px;cursor:pointer;font-family:inherit;position:relative}.sl-my b{display:block;font-size:14.5px;color:#0b1b3a}.sl-my small{font-size:12px;color:#64748b;font-weight:700}
.sl-kp{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px}.sl-kp div{background:#fff;border:1px solid #e8edf4;border-radius:18px;padding:12px 14px}.sl-kp b{display:block;font-size:24px;font-weight:900;color:var(--c,#1e3a8a)}.sl-kp small{font-size:12px;font-weight:800;color:#64748b}
.sl-tb{width:100%;border-collapse:collapse;font-size:13px}.sl-tb th{background:#0b1b3a;color:#fff;padding:8px 6px;font-weight:800}.sl-tb td{padding:7px 6px;border-bottom:1px solid #eef2f7;text-align:center}.sl-tb tr:nth-child(even) td{background:#f8fafc}
.sl-vis{border-radius:20px;border:1.5px solid #e2e8f0;background:#fff;padding:12px;display:flex;flex-direction:column;gap:6px}.sl-vis b{font-size:17px;color:#0b1b3a}.sl-vis .k{align-self:flex-start;font-size:11.5px;font-weight:800;color:#7c3aed;background:#f5f3ff;border-radius:999px;padding:2px 10px}.sl-vis p{margin:0;font-size:14px;font-weight:700;line-height:1.9;color:#334155;background:#f8fafc;border-radius:12px;padding:8px 10px}
.sl-vwait{display:flex;align-items:center;gap:12px;padding:18px;border-radius:18px;background:linear-gradient(135deg,#f5f3ff,#eef2ff);font-weight:800;color:#5b21b6}.sl-vwait i{width:26px;height:26px;border-radius:50%;border:3px solid #c4b5fd;border-top-color:#7c3aed;animation:slSpin 1s linear infinite}
.slp-svg{background:#fff;border-radius:24px;padding:14px;max-width:min(980px,100%);margin:6px auto 0;max-height:62vh;display:flex;justify-content:center}.slp-svg svg{max-height:58vh}
/* وضع العرض */
.slp{position:fixed;inset:0;z-index:3000;background:radial-gradient(120% 120% at 100% 0%,#1e3a8a,#0b1b3a 50%,#04201f);color:#fff;font-family:'Tajawal',Cairo,Tahoma,sans-serif;display:flex;flex-direction:column}
.slp-top{display:flex;align-items:center;gap:10px;padding:12px 18px;font-weight:800;font-size:14px;opacity:.9}.slp-top button{border:0;background:#ffffff1f;color:#fff;border-radius:12px;padding:6px 14px;font:800 14px Cairo,Tahoma;cursor:pointer}
.slp-body{flex:1;display:grid;place-items:center;padding:10px 6vw;overflow:auto}
.slp-s{width:min(1100px,100%);animation:slIn .45s ease}@keyframes slIn{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}
.slp-k{display:inline-block;border-radius:999px;background:#c9a227;color:#1c1300;font-weight:900;font-size:clamp(13px,1.6vw,18px);padding:4px 16px;margin-bottom:14px}
.slp-t{font-size:clamp(28px,4.4vw,58px);font-weight:900;line-height:1.45;margin:0 0 12px}
.slp-p{font-size:clamp(18px,2.5vw,32px);font-weight:700;line-height:1.9;opacity:.95}
.slp-li{display:flex;gap:14px;align-items:flex-start;font-size:clamp(17px,2.2vw,28px);font-weight:800;line-height:1.8;margin:10px 0;background:#ffffff12;border-radius:18px;padding:10px 16px}.slp-li i{font-style:normal;flex:none;min-width:44px;height:44px;border-radius:14px;display:grid;place-items:center;background:#c9a227;color:#1c1300;font-weight:900}
.slp-ans{margin-top:16px;font-size:clamp(16px,2vw,26px);font-weight:800;background:#16a34a33;border:2px solid #4ade80;border-radius:18px;padding:12px 16px;line-height:1.8}
.slp-nav{display:flex;align-items:center;justify-content:center;gap:12px;padding:14px}.slp-nav button{border:0;border-radius:14px;padding:10px 22px;font:900 16px Cairo,Tahoma;cursor:pointer;background:#ffffff22;color:#fff}.slp-nav button.g{background:#c9a227;color:#1c1300}
.slp-dots{display:flex;gap:5px}.slp-dots i{width:8px;height:8px;border-radius:50%;background:#ffffff44}.slp-dots i.on{background:#c9a227;width:22px;border-radius:5px}
@media(max-width:640px){.sl-act{gap:5px;padding:7px}.sl-act .sl-b{padding:6px 9px;font-size:12px;border-radius:10px}.sl-hero h2{font-size:20px}.sl-top h1{font-size:21px}.sl-card{padding:14px}}
`;

// ── حقل قابل للتعديل
const Ed = ({ on, v, set, area }) => on ? (area ? <textarea className="sl-e" rows={2} value={v || ""} onChange={e => set(e.target.value)} /> : <input className="sl-e" value={v || ""} onChange={e => set(e.target.value)} />) : <>{v}</>;

// ═════════ عرض نتيجة التحليل ═════════
function Visuals({ R, vis, onVis }) {
  const V = arr(R.vis);
  return <div className="sl-card"><h3 className="sl-h"><i style={{ "--c": "#7c3aed", "--c2": "#db2777" }}>🎨</i>صور توضيحية تبسّط الدرس للطلاب</h3>
    {V.length ? <div className="sl-g2" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,460px),1fr))" }}>{V.map((v, i) => { const h = visSVG(v); return h ? <div className="sl-vis" key={i}><span className="k">{VIS_NAMES[v.k] || ""}</span><b>{v.t}</b><div dangerouslySetInnerHTML={{ __html: h }} />{v.cap ? <p>🗣️ {v.cap}</p> : null}</div> : null; })}</div>
      : vis === "busy" ? <div className="sl-vwait"><i />يرسم الذكاء الصور التوضيحية لهذا الدرس…</div>
      : <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>{vis && vis !== "busy" ? <span style={{ color: "#b91c1c", fontWeight: 800, fontSize: 13 }}>⚠️ {vis}</span> : <span style={{ color: "#64748b", fontWeight: 800, fontSize: 13 }}>رسوم مبسّطة مثل الميزان وخط الأعداد والمستوى الإحداثي وخرائط المفاهيم</span>}<button className="sl-b gold sm" onClick={onVis}>🎨 ارسم الصور التوضيحية</button></div>}
    {V.length && onVis ? <button className="sl-b gh sm" style={{ marginTop: 10 }} onClick={onVis}>🔄 رسوم أخرى</button> : null}
  </div>;
}
function Result({ R, setR, meta, edit, showAns, vis, onVis }) {
  const up = (k, i, f, v) => setR(p => { const n = { ...p }; const a = [...arr(n[k])]; a[i] = f ? { ...a[i], [f]: v } : v; n[k] = a; return n; });
  const del = (k, i) => setR(p => ({ ...p, [k]: arr(p[k]).filter((_, j) => j !== i) }));
  const add = (k, o) => setR(p => ({ ...p, [k]: [...arr(p[k]), o] }));
  const lad = BLOOM.map(([b, c]) => [b, c, arr(R.obj).filter(o => String(o.b || "").includes(b)).length]);
  const mx = Math.max(1, ...lad.map(x => x[2]));
  const fl = arr(R.flow); const tot = fl.reduce((a, f) => a + (+f.min || 0), 0);
  const [open, setOpen] = useState({});
  const H = ({ ic, t, c, c2 }) => <h3 className="sl-h"><i style={{ "--c": c, "--c2": c2 }}>{ic}</i>{t}</h3>;
  return <div className="sl-res">
    <div className="sl-top">
      <div><span className="sl-tg">📘 {meta.subj}</span><span className="sl-tg">🎓 {meta.grade}</span>{R.unit ? <span className="sl-tg">📂 {R.unit}</span> : null}<span className="sl-tg" style={{ background: R.src === "دليل المعلم" ? "#16a34a" : "#b45309" }}>{R.src === "دليل المعلم" ? "✔ مبني على دليل المعلم" : "⚠ مستنتج من الكتاب"}</span></div>
      <h1><Ed on={edit} v={R.title} set={v => setR(p => ({ ...p, title: v }))} /></h1>
      {R.big ? <div className="big">💡 <Ed on={edit} area v={R.big} set={v => setR(p => ({ ...p, big: v }))} /></div> : null}
    </div>

    <div className="sl-card">
      <H ic="🎯" t="أهداف الدرس" c="#1e3a8a" c2="#0f766e" />
      {arr(R.obj).map((o, i) => <div className="sl-ob" key={i}>
        <span className="n">{ar(i + 1)}</span>
        <span className="t"><Ed on={edit} area v={o.t} set={v => up("obj", i, "t", v)} /></span>
        {edit ? <select className="sl-e" style={{ width: 90 }} value={o.b || ""} onChange={e => up("obj", i, "b", e.target.value)}>{BLOOM.map(b => <option key={b[0]}>{b[0]}</option>)}</select> : <span className="sl-bl" style={{ background: bColor(o.b) }}>{o.b}</span>}
        {o.d && !edit ? <span className="sl-bl" style={{ background: "#e2e8f0", color: "#334155" }}>{o.d}</span> : null}
        {edit ? <button className="sl-b red sm" onClick={() => del("obj", i)}>✕</button> : null}
      </div>)}
      {edit ? <button className="sl-b gh sm" onClick={() => add("obj", { t: "أن ", b: "تطبيق", d: "معرفي" })}>＋ هدف</button> : null}
      <div style={{ marginTop: 10, fontSize: 12, fontWeight: 900, color: "#64748b" }}>سلّم بلوم: توزيع الأهداف على المستويات</div>
      <div className="sl-lad">{lad.map(([b, c, n]) => <div key={b}><i style={{ height: 6 + n / mx * 40, background: n ? c : "#e2e8f0" }} />{b}{n ? ` (${ar(n)})` : ""}</div>)}</div>
    </div>

    <Visuals R={R} vis={vis} onVis={edit ? null : onVis} />

    <div className="sl-g2">
      <div className="sl-card"><H ic="🧱" t="المتطلبات السابقة" c="#475569" c2="#94a3b8" />
        {arr(R.prior).map((p, i) => <div key={i} style={{ fontSize: 13.5, fontWeight: 800, lineHeight: 1.9 }}>• <Ed on={edit} v={p} set={v => up("prior", i, null, v)} /></div>)}
      </div>
      <div className="sl-card"><H ic="🔤" t="المفردات" c="#4338ca" c2="#6366f1" />
        <div className="sl-voc">{arr(R.vocab).map((w, i) => <span key={i}>{edit ? <><Ed on v={w.w} set={v => up("vocab", i, "w", v)} /><Ed on v={w.d} set={v => up("vocab", i, "d", v)} /></> : <>{w.w}<em>{w.d}</em></>}</span>)}</div>
      </div>
    </div>

    {R.hook ? <div className="sl-hook"><H ic="⚡" t={"التهيئة: " + (R.hook.t || "")} c="#b45309" c2="#c9a227" />
      <div style={{ fontSize: 14.5, fontWeight: 800, lineHeight: 1.9 }}><Ed on={edit} area v={R.hook.text} set={v => setR(p => ({ ...p, hook: { ...p.hook, text: v } }))} /></div>
      {R.hook.q ? <div style={{ marginTop: 6, fontWeight: 900, color: "#92400e" }}>❓ <Ed on={edit} v={R.hook.q} set={v => setR(p => ({ ...p, hook: { ...p.hook, q: v } }))} /></div> : null}
    </div> : null}

    <div className="sl-card"><H ic="🧠" t="مهارات التفكير العليا" c="#6d28d9" c2="#db2777" />
      <div className="sl-g2">{arr(R.hots).map((h, i) => <div className="sl-hot" key={i}>
        <span className="s">{hotIc(h.s)} {edit ? <Ed on v={h.s} set={v => up("hots", i, "s", v)} /> : h.s}</span>
        <div className="q"><Ed on={edit} area v={h.q} set={v => up("hots", i, "q", v)} /></div>
        {edit ? <Ed on area v={h.a} set={v => up("hots", i, "a", v)} /> : (showAns || open[i]) ? <div className="a">✔ {h.a}</div> : <button className="sl-b gh sm" onClick={() => setOpen(o => ({ ...o, [i]: 1 }))}>👁 الإجابة النموذجية</button>}
        {edit ? <button className="sl-b red sm" style={{ marginTop: 6 }} onClick={() => del("hots", i)}>✕ حذف</button> : null}
      </div>)}</div>
      {edit ? <button className="sl-b gh sm" style={{ marginTop: 8 }} onClick={() => add("hots", { s: "تحليل", q: "", a: "" })}>＋ سؤال</button> : null}
    </div>

    <div className="sl-card"><H ic="🌍" t="الربط بواقع الحياة" c="#0e7490" c2="#14b8a6" />
      <div className="sl-g2">{arr(R.life).map((l, i) => <div className="sl-life" key={i}>
        <b>{LIFE_IC[i % LIFE_IC.length]} <Ed on={edit} v={l.t} set={v => up("life", i, "t", v)} /></b>
        <p><Ed on={edit} area v={l.text} set={v => up("life", i, "text", v)} /></p>
        {l.q ? <div className="q">❓ <Ed on={edit} v={l.q} set={v => up("life", i, "q", v)} /></div> : null}
      </div>)}</div>
    </div>

    <div className="sl-g2">
      <div className="sl-card"><H ic="🗺️" t={`خطة سير الحصة (${ar(tot || 45)} دقيقة)`} c="#0b1b3a" c2="#123b6b" />
        <div className="sl-fl">{fl.map((f, i) => <div className="sl-fi" key={i}><span className="m">{ar(f.min)} د</span><b>{f.ph}</b>
          <div>👨‍🏫 <Ed on={edit} area v={f.tch} set={v => up("flow", i, "tch", v)} /></div><div>🧑‍🎓 <Ed on={edit} area v={f.stu} set={v => up("flow", i, "stu", v)} /></div></div>)}</div>
      </div>
      <div style={{ display: "grid", gap: 14, alignContent: "start" }}>
        <div className="sl-card"><H ic="🧭" t="استراتيجيات مقترحة" c="#0f766e" c2="#16a34a" />
          {arr(R.strat).map((s, i) => <div key={i} style={{ fontSize: 13.5, fontWeight: 800, lineHeight: 1.9, marginBottom: 4 }}>◆ <Ed on={edit} area v={s} set={v => up("strat", i, null, v)} /></div>)}
        </div>
        {R.diff ? <div className="sl-card"><H ic="🪜" t="مراعاة الفروق الفردية" c="#be185d" c2="#f43f5e" />
          <div style={{ fontSize: 13.5, fontWeight: 800, lineHeight: 1.9 }}><b style={{ color: "#b45309" }}>🤝 دعم: </b><Ed on={edit} area v={R.diff.low} set={v => setR(p => ({ ...p, diff: { ...p.diff, low: v } }))} /></div>
          <div style={{ fontSize: 13.5, fontWeight: 800, lineHeight: 1.9, marginTop: 4 }}><b style={{ color: "#7c3aed" }}>🚀 إثراء: </b><Ed on={edit} area v={R.diff.high} set={v => setR(p => ({ ...p, diff: { ...p.diff, high: v } }))} /></div>
        </div> : null}
      </div>
    </div>

    <div className="sl-g2">
      <div className="sl-card"><H ic="🎫" t="بطاقة الخروج" c="#c2410c" c2="#f59e0b" />
        <div className="sl-ex">{arr(R.exit).map((e, i) => <div key={i}>{ar(i + 1)}) <Ed on={edit} area v={e.q} set={v => up("exit", i, "q", v)} />{showAns && !edit ? <div style={{ color: "#166534", fontSize: 12.5, background: "transparent", border: 0, padding: 0 }}>✔ {e.a}</div> : edit ? <Ed on area v={e.a} set={v => up("exit", i, "a", v)} /> : null}</div>)}</div>
      </div>
      <div style={{ display: "grid", gap: 14, alignContent: "start" }}>
        {R.values ? <div className="sl-card"><H ic="🇸🇦" t="القيم والرؤية" c="#166534" c2="#15803d" /><div style={{ fontSize: 13.5, fontWeight: 800, lineHeight: 1.9 }}><Ed on={edit} area v={R.values} set={v => setR(p => ({ ...p, values: v }))} /></div></div> : null}
        {R.nafes ? <div className="sl-card"><H ic="🎯" t="الربط باختبارات نافس" c="#1d4ed8" c2="#0891b2" /><div style={{ fontSize: 13.5, fontWeight: 800, lineHeight: 1.9 }}><Ed on={edit} area v={R.nafes} set={v => setR(p => ({ ...p, nafes: v }))} /></div></div> : null}
      </div>
    </div>
  </div>;
}

// ═════════ وضع العرض أمام الطلاب ═════════
function Present({ R, meta, onClose }) {
  const S = useMemo(() => {
    const s = [{ k: meta.subj + " • " + meta.grade, t: R.title, p: R.big }];
    if (R.hook) s.push({ k: "⚡ تهيئة", t: R.hook.t, p: R.hook.text, ans: R.hook.q ? "❓ " + R.hook.q : "", q: 1 });
    if (arr(R.obj).length) s.push({ k: "🎯 أهداف الدرس", t: "في نهاية الدرس أكون قادرًا على:", li: arr(R.obj).map(o => String(o.t || "").replace(/^أن\s+يـ?/, "أن أ").replace(/الطالب\s*/, "")) });
    if (arr(R.vocab).length) s.push({ k: "🔤 المفردات", t: "مفردات الدرس", li: arr(R.vocab).map(v => v.w + " — " + v.d) });
    arr(R.vis).forEach(v => { const h = visSVG(v); if (h) s.push({ k: "🎨 " + (VIS_NAMES[v.k] || "توضيح"), t: v.t, svg: h, p: v.cap }); });
    arr(R.life).forEach(l => s.push({ k: "🌍 من واقع الحياة", t: l.t, p: l.text, ans: l.q ? "❓ " + l.q : "", q: 1 }));
    arr(R.hots).forEach(h => s.push({ k: hotIc(h.s) + " فكّر: " + h.s, t: h.q, ans: h.a ? "✔ " + h.a : "" }));
    if (arr(R.exit).length) s.push({ k: "🎫 بطاقة الخروج", t: "قبل أن تغادر…", li: arr(R.exit).map(e => e.q), ans: arr(R.exit).map((e, i) => ar(i + 1) + ") " + e.a).join("   •   ") });
    s.push({ k: "🌟", t: "أحسنتم!", p: R.values || "" });
    return s;
  }, [R, meta]);
  const [i, setI] = useState(0); const [show, setShow] = useState(false);
  const go = d => { setShow(false); setI(x => Math.max(0, Math.min(S.length - 1, x + d))); };
  useEffect(() => { const h = e => { if (e.key === "ArrowLeft" || e.key === " ") go(1); else if (e.key === "ArrowRight") go(-1); else if (e.key === "Escape") onClose(); else if (e.key === "Enter") setShow(v => !v); }; window.addEventListener("keydown", h); try { document.documentElement.requestFullscreen && document.documentElement.requestFullscreen().catch(() => {}); } catch {} return () => { window.removeEventListener("keydown", h); try { document.fullscreenElement && document.exitFullscreen(); } catch {} }; }, []);
  const s = S[i];
  return createPortal(<div className="slp" dir="rtl"><style>{CSS}</style>
    <div className="slp-top"><span>✨ درسي الذكي</span><span style={{ opacity: .7 }}>{R.title}</span><span style={{ marginRight: "auto" }}>{ar(i + 1)} / {ar(S.length)}</span><button onClick={onClose}>✕ إغلاق</button></div>
    <div className="slp-body" onClick={e => { if (e.target.classList.contains("slp-body")) go(1); }}>
      <div className="slp-s" key={i}>
        <span className="slp-k">{s.k}</span>
        <h2 className="slp-t" style={s.svg ? { fontSize: "clamp(22px,3vw,40px)", marginBottom: 6 } : null}>{s.t}</h2>
        {s.svg ? <div className="slp-svg" dangerouslySetInnerHTML={{ __html: s.svg }} /> : null}
        {s.p ? <div className="slp-p" style={s.svg ? { fontSize: "clamp(16px,2vw,24px)", marginTop: 10 } : null}>{s.svg ? "🗣️ " : ""}{s.p}</div> : null}
        {s.li ? s.li.map((x, j) => <div className="slp-li" key={j}><i>{ar(j + 1)}</i><span>{x}</span></div>) : null}
        {s.ans ? (show ? <div className="slp-ans">{s.ans}</div> : <button onClick={() => setShow(true)} style={{ marginTop: 16, border: "2px dashed #ffffff66", background: "transparent", color: "#fff", borderRadius: 16, padding: "10px 20px", font: "800 18px Cairo,Tahoma", cursor: "pointer" }}>{s.q ? "❓ اعرض السؤال" : "👁 اكشف الإجابة"}</button>) : null}
      </div>
    </div>
    <div className="slp-nav"><button onClick={() => go(-1)} disabled={!i}>→ السابق</button><div className="slp-dots">{S.map((_, j) => <i key={j} className={j === i ? "on" : ""} />)}</div><button className="g" onClick={() => go(1)} disabled={i === S.length - 1}>التالي ←</button></div>
  </div>, document.body);
}

// ═════════ الطباعة ═════════
function printLesson(R, meta, by) {
  const li = a => arr(a).map(x => `<li>${esc(x)}</li>`).join("");
  const html = `<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>${esc(R.title)}</title>
<link href="https://fonts.googleapis.com/css2?family=Baloo+Bhaijaan+2:wght@600;800&family=Tajawal:wght@500;700;800&display=swap" rel="stylesheet">
<style>@page{size:A4;margin:12mm}*{box-sizing:border-box}body{font-family:Tajawal,Cairo,Tahoma;color:#0f172a;margin:0;font-size:12.5px;line-height:1.75;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.hd{background:linear-gradient(135deg,#0b1b3a,#123b6b 60%,#0f766e);color:#fff;border-radius:14px;padding:12px 16px;display:flex;justify-content:space-between;gap:10px;align-items:flex-start}
.hd h1{margin:2px 0;font-size:21px}.hd small{opacity:.85;font-weight:700}.big{margin-top:6px;border-right:3px solid #c9a227;padding:2px 8px;background:#ffffff18;border-radius:6px;font-weight:700}
h2{font-size:14px;margin:12px 0 6px;color:#0b1b3a;border-bottom:2px solid #e2e8f0;padding-bottom:3px}
table{width:100%;border-collapse:collapse}td,th{border:1px solid #cbd5e1;padding:5px 7px;vertical-align:top}th{background:#eef2ff;color:#1e3a8a;font-weight:900}
.b{display:inline-block;border-radius:10px;color:#fff;padding:0 8px;font-size:11px;font-weight:900}.g2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
ul{margin:0;padding-right:18px}.box{border:1px solid #e2e8f0;border-radius:10px;padding:8px 10px;break-inside:avoid}.ft{margin-top:14px;display:flex;justify-content:space-between;font-weight:800;color:#475569}</style></head><body>
<div class="hd"><div><small>${esc(meta.subj)} • ${esc(meta.grade)} • ${esc(meta.term || "")}${R.unit ? " • " + esc(R.unit) : ""}</small><h1>${esc(R.title)}</h1>${R.big ? `<div class="big">💡 ${esc(R.big)}</div>` : ""}</div><div style="text-align:left"><small>درسي الذكي</small><br><b>${esc(by || "")}</b></div></div>
<h2>🎯 أهداف الدرس</h2><table><tr><th style="width:28px">م</th><th>الهدف</th><th style="width:70px">المستوى</th><th style="width:60px">المجال</th></tr>${arr(R.obj).map((o, i) => `<tr><td>${i + 1}</td><td>${esc(o.t)}</td><td><span class="b" style="background:${bColor(o.b)}">${esc(o.b)}</span></td><td>${esc(o.d || "")}</td></tr>`).join("")}</table>
<div class="g2"><div><h2>🧱 المتطلبات السابقة</h2><ul>${li(R.prior)}</ul></div><div><h2>🔤 المفردات</h2><ul>${arr(R.vocab).map(v => `<li><b>${esc(v.w)}</b>: ${esc(v.d)}</li>`).join("")}</ul></div></div>
${R.hook ? `<h2>⚡ التهيئة: ${esc(R.hook.t)}</h2><div class="box">${esc(R.hook.text)}${R.hook.q ? `<br><b>❓ ${esc(R.hook.q)}</b>` : ""}</div>` : ""}
${arr(R.vis).length ? `<h2>🎨 صور توضيحية</h2><div class="g2">${arr(R.vis).map(v => { const h = visSVG(v); return h ? `<div class="box"><b>${esc(v.t)}</b>${h}<div style="font-size:11.5px;color:#475569">${esc(v.cap || "")}</div></div>` : ""; }).join("")}</div>` : ""}
<h2>🗺️ خطة سير الحصة</h2><table><tr><th style="width:90px">المرحلة</th><th style="width:40px">الزمن</th><th>دور المعلم</th><th>نشاط الطالب</th></tr>${arr(R.flow).map(f => `<tr><td><b>${esc(f.ph)}</b></td><td>${esc(f.min)} د</td><td>${esc(f.tch)}</td><td>${esc(f.stu)}</td></tr>`).join("")}</table>
<h2>🧠 أسئلة مهارات التفكير العليا</h2><table><tr><th style="width:80px">المهارة</th><th>السؤال</th><th>الإجابة النموذجية</th></tr>${arr(R.hots).map(h => `<tr><td><b>${esc(h.s)}</b></td><td>${esc(h.q)}</td><td>${esc(h.a)}</td></tr>`).join("")}</table>
<h2>🌍 الربط بواقع الحياة</h2><div class="g2">${arr(R.life).map(l => `<div class="box"><b>${esc(l.t)}</b><br>${esc(l.text)}${l.q ? `<br><b>❓ ${esc(l.q)}</b>` : ""}</div>`).join("")}</div>
<div class="g2"><div><h2>🧭 الاستراتيجيات</h2><ul>${li(R.strat)}</ul></div><div><h2>🪜 الفروق الفردية</h2><div class="box"><b>دعم:</b> ${esc(obj(R.diff).low)}<br><b>إثراء:</b> ${esc(obj(R.diff).high)}</div></div></div>
<h2>🎫 بطاقة الخروج</h2><table><tr><th>السؤال</th><th style="width:35%">الإجابة</th></tr>${arr(R.exit).map(e => `<tr><td>${esc(e.q)}</td><td>${esc(e.a)}</td></tr>`).join("")}</table>
${R.values || R.nafes ? `<div class="g2">${R.values ? `<div><h2>🇸🇦 القيم والرؤية</h2><div class="box">${esc(R.values)}</div></div>` : ""}${R.nafes ? `<div><h2>🎯 الربط بنافس</h2><div class="box">${esc(R.nafes)}</div></div>` : ""}</div>` : ""}
<div class="ft"><span>المعلم: ${esc(by || "")}</span><span>التاريخ: ${today()}</span><span>${R.src === "دليل المعلم" ? "المرجع: دليل المعلم" : "مستنتج من الكتاب المدرسي"}</span></div>
<script>window.onload=()=>setTimeout(()=>window.print(),600)<\/script></body></html>`;
  const w = window.open("", "_blank"); if (!w) { alert("اسمح بالنوافذ المنبثقة للطباعة"); return; } w.document.write(html); w.document.close();
}

// ═════════ صفحة المعلم ═════════
export function SmartLessonTeacher({ me, api }) {
  const hk = String(me.hash || "").slice(0, 16) || "x";
  const pref = lsGet("sl-pref", {}) || {};
  const [tab, setTab] = useState("new");
  const [subj, setSubj] = useState(pref.subj || "رياضيات"); const [grade, setGrade] = useState(pref.grade || "الثالث المتوسط"); const [term, setTerm] = useState(pref.term || TERMS[0]);
  const [lid, setLid] = useState(""); const [title, setTitle] = useState(""); const [note, setNote] = useState("");
  const [imgs, setImgs] = useState([]); const [busy, setBusy] = useState(false); const [prog, setProg] = useState(0); const [err, setErr] = useState("");
  const [R, setR] = useState(null); const [meta, setMeta] = useState(null); const [vis, setVis] = useState(""); const [edit, setEdit] = useState(false); const [pres, setPres] = useState(false); const [ans, setAns] = useState(false);
  const [bank, setBank] = useState({}); const [my, setMy] = useState(null); const [saved, setSaved] = useState(""); const [quota, setQuota] = useState(null);
  const fileRef = useRef(null), camRef = useRef(null);
  const ix = IDX[`${subj}|${grade}|${term}`];
  const sk = fk(`${subj}|${grade}|${term}`);
  const flat = useMemo(() => ix ? ix.chapters.flatMap(c => c.lessons.map(l => ({ ...l, chap: `الفصل ${ar(c.n)}: ${c.t}` }))) : [], [ix]);
  const L = flat.find(l => l.id === lid) || null;
  const lk = L ? fk(L.id) : fk(title);
  useEffect(() => { lsSet("sl-pref", { subj, grade, term }); setLid(""); (async () => setBank(obj(await api.maGet(`${SL_BANK}/${sk}`))))(); }, [subj, grade, term]);
  useEffect(() => { (async () => { try { const r = await fetch("/api/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ hash: me.hash, kind: "ping" }) }); const j = await r.json(); if (j.ok) setQuota(j); } catch {} })(); }, [busy]);
  const loadMy = async () => setMy(obj(await api.maGet(`${SL_MY}/${hk}`)));
  useEffect(() => { if (tab === "my") loadMy(); }, [tab]);
  const inBank = lk && bank[lk] && bank[lk].res ? bank[lk] : null;
  const tips = ["يقرأ صفحات الدرس…", "يصوغ الأهداف وفق المنهج السعودي…", "يرتّبها على سلّم بلوم…", "يبني أسئلة التفكير العليا…", "يبحث عن مواقف من حياة الطالب…", "يخطط لسير الحصة…", "يجهّز بطاقة الخروج…"];
  const addFiles = async fl => { const a = []; for (const f of [...fl].slice(0, 4 - imgs.length)) { try { a.push(await shrink(f)); } catch {} } setImgs(x => [...x, ...a].slice(0, 4)); };
  const run = async () => {
    if (!L && !title.trim() && !imgs.length) { setErr("اختر الدرس من الفهرس أو اكتب عنوانه أو صوّر صفحاته"); return; }
    setErr(""); setBusy(true); setProg(2); setR(null); setEdit(false); setSaved("");
    const m = { subj, grade, term, lid: L ? L.id : "", lk, title: L ? L.t : title.trim() };
    try {
      const prompt = buildPrompt({ subj, grade, term, L, chap: L && L.chap, title: L ? "" : title.trim(), note: note.trim(), nImg: imgs.length });
      // الرسوم التوضيحية تُطلب بالتوازي مع التحليل فلا تزيد زمن الانتظار
      setVis("busy"); const vp = drawVis({ subj, grade, title: m.title || title.trim() || "الدرس المصوّر", objs: L ? L.obj.join(" • ") : "" }, imgs);
      const txt = await callAI({ me, api, prompt, images: imgs, tag: `${subj} • ${grade} • ${m.title || "درس مصوّر"}`, onText: t => setProg(Math.min(97, Math.round(t.length / 55))) });
      const res = parseJSON(txt); if (!res.title) res.title = m.title || "درس"; if (L) res.src = "دليل المعلم";
      setMeta(m); setR(p => ({ ...res, vis: p && p.__vis ? p.__vis : res.vis })); setProg(100); vp.then(V => V && setR(p => p ? { ...p, vis: V } : { __vis: V }));
    } catch (e) { setErr(e.message || "تعذّر التحليل"); setR(null); }
    setBusy(false);
  };
  async function drawVis(o, im) {
    setVis("busy");
    try { const t = await callAI({ me, api, prompt: visPrompt(o) + (im && im.length ? "\nاستعن بصور صفحات الدرس المرفقة." : ""), images: im || [], tag: "🎨 " + o.title, schema: VIS_SCHEMA, kind: "vis", max: 3000 }); const j = parseJSON(t); const V = arr(j.vis).filter(v => visSVG(v)); setVis(V.length ? "" : "تعذّر رسم الصور — أعد المحاولة"); return V.length ? V : null; }
    catch (e) { setVis(e.message || "تعذّر رسم الصور"); return null; }
  }
  const visNow = async () => { if (!R) return; const V = await drawVis({ subj: meta.subj, grade: meta.grade, title: R.title, objs: arr(R.obj).map(o => o.t).join(" • ") }, []); if (V) setR(p => ({ ...p, vis: V })); };
  const openBank = () => { setMeta({ subj, grade, term, lid: L ? L.id : "", lk, title: L ? L.t : title }); setR(inBank.res); setVis(""); setEdit(false); setSaved("🏦 من بنك دروس المدرسة — إعداد " + (inBank.by || "")); };
  const save = async () => {
    if (!R || !meta) return; const id = fk(meta.lk || Date.now().toString(36)) + "_" + fk(meta.subj).slice(0, 12);
    const rec = { res: R, subj: meta.subj, grade: meta.grade, term: meta.term, lid: meta.lid || "", t: R.title, at: Date.now() };
    const o = { [`${SL_MY}/${hk}/${id}`]: rec };
    if (meta.lk) o[`${SL_BANK}/${fk(`${meta.subj}|${meta.grade}|${meta.term}`)}/${meta.lk}`] = { res: R, by: me.name, at: Date.now(), t: R.title };
    const ok = await api.fbPatch(o); setSaved(ok === false ? "⚠️ تعذّر الحفظ" : "✅ حُفظ في دروسي وفي بنك دروس المدرسة ليستفيد منه زملاؤك"); setEdit(false);
    if (meta.lk) setBank(b => ({ ...b, [meta.lk]: { res: R, by: me.name, t: R.title } }));
  };
  const steps = <>
    <div className="sl-card">
      <div className="sl-ch"><b>① المادة</b><div className="sl-sel">{SUBJ.map(s => <button key={s} className={"sl-chip" + (s === subj ? " on" : "")} onClick={() => setSubj(s)}>{s}{Object.keys(IDX).some(k => k.startsWith(s + "|")) ? <small>✔ فهرس رسمي</small> : null}</button>)}</div></div>
      <div className="sl-ch"><b>② الصف والفصل الدراسي</b><div className="sl-sel">{GRADES.map(g => <button key={g} className={"sl-chip" + (g === grade ? " on" : "")} onClick={() => setGrade(g)}>{g}</button>)}<span style={{ width: 10 }} />{TERMS.map(t => <button key={t} className={"sl-chip" + (t === term ? " on" : "")} onClick={() => setTerm(t)}>{t}</button>)}</div></div>
      <div className="sl-ch"><b>③ الدرس</b>
        {ix ? <>
          <div style={{ fontSize: 12.5, fontWeight: 800, color: "#16a34a", margin: "0 2px 8px" }}>✔ فهرس «{ix.src}» متوفر: اختر الدرس وستُبنى الأهداف على الكتاب الرسمي{Object.keys(bank).length ? ` • 🏦 ${ar(Object.keys(bank).length)} درس جاهز في بنك المدرسة` : ""}</div>
          {ix.chapters.map(c => <div key={c.n} style={{ marginBottom: 10 }}><div style={{ fontWeight: 900, fontSize: 13.5, color: "#0b1b3a", margin: "4px 2px 6px" }}>📂 الفصل {ar(c.n)}: {c.t}</div>
            <div className="sl-ls">{c.lessons.map(l => <button key={l.id} className={"sl-l" + (l.id === lid ? " on" : "")} onClick={() => { setLid(l.id === lid ? "" : l.id); setTitle(""); }}>{bank[fk(l.id)] ? <span className="bk">🏦 جاهز</span> : null}<u>{ar(l.id)}</u>{l.t}</button>)}</div></div>)}
          {!lid ? <input className="sl-in" style={{ marginTop: 4 }} placeholder="أو اكتب عنوان درس غير موجود في الفهرس…" value={title} onChange={e => setTitle(e.target.value)} /> : null}
        </> : <>
          <div style={{ fontSize: 12.5, fontWeight: 800, color: "#b45309", margin: "0 2px 8px", lineHeight: 1.8 }}>لا يتوفر فهرس رسمي لهذه المادة بعد — اكتب عنوان الدرس وصوّر صفحاته، وسيستنتج الذكاء الأهداف من الكتاب نفسه وفق منهج المادة.{Object.keys(bank).length ? ` • 🏦 ${ar(Object.keys(bank).length)} درس في بنك المدرسة` : ""}</div>
          <input className="sl-in" list="sl-bank-l" placeholder="عنوان الدرس كما في الكتاب" value={title} onChange={e => setTitle(e.target.value)} />
          <datalist id="sl-bank-l">{Object.values(bank).map((b, i) => <option key={i} value={b.t} />)}</datalist>
        </>}
      </div>
      <div className="sl-ch"><b>④ صور صفحات الدرس {L ? "(اختيارية — تُحسّن الأمثلة)" : "(مهمة)"}</b>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="sl-b gh" onClick={() => camRef.current.click()} disabled={imgs.length >= 4}>📷 تصوير الصفحة</button>
          <button className="sl-b gh" onClick={() => fileRef.current.click()} disabled={imgs.length >= 4}>🖼️ اختيار صور</button>
          <span style={{ alignSelf: "center", fontSize: 12, color: "#64748b", fontWeight: 800 }}>حتى ٤ صفحات — تُضغط تلقائيًا</span>
        </div>
        <input ref={camRef} type="file" accept="image/*" capture="environment" hidden onChange={e => { addFiles(e.target.files); e.target.value = ""; }} />
        <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={e => { addFiles(e.target.files); e.target.value = ""; }} />
        {imgs.length ? <div className="sl-th">{imgs.map((s, i) => <div key={i}><img src={s} alt="" /><button onClick={() => setImgs(a => a.filter((_, j) => j !== i))}>×</button></div>)}</div> : null}
      </div>
      <div className="sl-ch"><b>⑤ ملاحظة للذكاء (اختيارية)</b><input className="sl-in" placeholder="مثال: الفصل مستواه متوسط • أريد نشاطًا تعاونيًا • الحصة ٤٠ دقيقة" value={note} onChange={e => setNote(e.target.value)} /></div>
      {inBank ? <div className="sl-bank">🏦 هذا الدرس محلَّل في بنك المدرسة (إعداد {inBank.by}) — اعرضه فورًا دون انتظار ودون استهلاك من حدّك<button className="sl-b gold sm" onClick={openBank}>اعرضه الآن</button></div> : null}
      {err ? <div className="sl-msg" style={{ background: "#fef2f2", color: "#b91c1c", marginTop: 10 }}>⚠️ {err}</div> : null}
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginTop: 12 }}>
        <button className="sl-b pri" style={{ fontSize: 16, padding: "12px 26px" }} disabled={busy} onClick={run}>✨ {inBank ? "تحليل جديد" : "حلّل الدرس"}</button>
        {quota ? <span style={{ fontSize: 12.5, fontWeight: 800, color: "#64748b" }}>المتبقي لك اليوم: <b style={{ color: quota.left ? "#16a34a" : "#dc2626" }}>{ar(quota.left)}</b> من {ar(quota.daily)}</span> : null}
      </div>
    </div>
  </>;
  return <div className="sl" dir="rtl"><style>{CSS}</style>
    <div className="sl-hero"><span className="orb" /><span className="orb2" />
      <h2>✨ درسي الذكي</h2>
      <p>اختر درسك أو صوّر صفحاته، فتحصل خلال دقيقة على أهداف مصوغة وفق المنهج السعودي، وأسئلة لمهارات التفكير العليا، وربطٍ بحياة الطالب، وخطة لسير الحصة، مع عرض جاهز للسبورة.</p>
      <span className="sl-q">👤 {me.name}</span>
    </div>
    <div className="sl-tabs" style={{ margin: "14px 0" }}>
      <button className={"sl-tab" + (tab === "new" ? " on" : "")} onClick={() => setTab("new")}>✨ تحليل درس</button>
      <button className={"sl-tab" + (tab === "my" ? " on" : "")} onClick={() => setTab("my")}>📚 دروسي المحفوظة</button>
    </div>
    {tab === "my" ? <div className="sl-card">
      {my === null ? <div style={{ padding: 20, textAlign: "center", fontWeight: 800, color: "#64748b" }}>⏳ جارٍ التحميل…</div> : !Object.keys(my).length ? <div style={{ padding: 20, textAlign: "center", fontWeight: 800, color: "#64748b" }}>لا توجد دروس محفوظة بعد — حلّل درسًا واضغط «💾 حفظ»</div> :
        <div className="sl-my">{Object.entries(my).sort((a, b) => (b[1].at || 0) - (a[1].at || 0)).map(([id, x]) => <div key={id} style={{ position: "relative" }}><button className="c" style={{ width: "100%" }} onClick={() => { setMeta({ subj: x.subj, grade: x.grade, term: x.term, lid: x.lid, lk: x.lid ? fk(x.lid) : fk(x.t), title: x.t }); setR(x.res); setVis(""); setTab("new"); setSaved(""); setEdit(false); }}>
          <b>{x.t}</b><small>{x.subj} • {x.grade}{x.lid ? " • درس " + ar(x.lid) : ""}</small><br /><small>🗓️ {new Date(x.at || 0).toLocaleDateString("ar-SA")}</small></button>
          <button className="sl-b red sm" style={{ position: "absolute", left: 8, top: 8 }} onClick={async () => { if (!confirm("حذف الدرس من دروسي؟")) return; await api.fbPatch({ [`${SL_MY}/${hk}/${id}`]: null }); loadMy(); }}>🗑</button></div>)}</div>}
    </div> : busy ? <div className="sl-card sl-load">
      <div className="sl-brain"><span>🧠</span></div>
      <div style={{ marginTop: 16, fontSize: 17, fontWeight: 900, color: "#0b1b3a" }}>{tips[Math.min(tips.length - 1, Math.floor(prog / 15))]}</div>
      <div className="sl-pb"><i style={{ width: prog + "%" }} /></div>
      <div style={{ marginTop: 8, fontSize: 12.5, color: "#64748b", fontWeight: 800 }}>يستغرق عادةً ٣٠–٦٠ ثانية</div>
    </div> : R ? <>
      {saved ? <div className="sl-msg" style={{ background: saved.startsWith("⚠") ? "#fef2f2" : "#f0fdf4", color: saved.startsWith("⚠") ? "#b91c1c" : "#166534", marginBottom: 12 }}>{saved}</div> : null}
      {edit ? <div className="sl-msg" style={{ background: "#eff6ff", color: "#1d4ed8", marginBottom: 12 }}>✏️ وضع التعديل: عدّل أي نص ثم اضغط «💾 حفظ»</div> : null}
      <Result R={R} setR={setR} meta={meta} edit={edit} showAns={ans} vis={vis} onVis={visNow} />
      <div className="sl-act" style={{ marginTop: 14 }}>
        <button className="sl-b gold" onClick={() => setPres(true)}>🎬 وضع العرض</button>
        <button className="sl-b pri" onClick={save}>💾 حفظ</button>
        <button className="sl-b gh" onClick={() => setEdit(e => !e)}>{edit ? "✔ إنهاء التعديل" : "✏️ تعديل"}</button>
        <button className="sl-b gh" onClick={() => setAns(a => !a)}>{ans ? "🙈 إخفاء الإجابات" : "👁 كل الإجابات"}</button>
        <button className="sl-b gh" onClick={() => printLesson(R, meta, me.name)}>🖨 طباعة</button>
        <button className="sl-b gh" onClick={() => { setR(null); setSaved(""); }}>↩ درس آخر</button>
      </div>
      {pres ? <Present R={R} meta={meta} onClose={() => setPres(false)} /> : null}
    </> : steps}
  </div>;
}

// ═════════ صفحة الإدارة ═════════
export function SmartLessonAdmin({ by, api, me }) {
  const [cfg, setCfg] = useState(null); const [log, setLog] = useState({}); const [bank, setBank] = useState({}); const [mUsed, setMUsed] = useState(0); const [msg, setMsg] = useState(""); const [ping, setPing] = useState("");
  const mon = today().slice(0, 7);
  const load = async () => {
    const [c, b, m, l] = await Promise.all([api.maGet(SL_CFG), api.maGet(SL_BANK), api.maGet(`${SL_USEM}/${mon}`), api.fbRange ? api.fbRange(SL_LOG, mon + "-01", mon + "-31") : api.maGet(SL_LOG)]);
    setCfg({ daily: 8, monthly: 600, inR: 3, outR: 15, ...obj(c) }); setBank(obj(b)); setMUsed(+m || 0); setLog(obj(l));
  };
  useEffect(() => { load(); }, []);
  const saveCfg = async () => { const ok = await api.maPut(SL_CFG, { daily: +cfg.daily || 8, monthly: +cfg.monthly || 600, off: !!cfg.off, inR: +cfg.inR || 3, outR: +cfg.outR || 15, by, at: Date.now() }); setMsg(ok === false ? "⚠️ تعذّر الحفظ" : "✅ حُفظت الإعدادات"); };
  const test = async () => { setPing("⏳ جارٍ الفحص…"); try { const r = await fetch("/api/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ hash: me && me.hash, kind: "ping" }) }); const ct = r.headers.get("content-type") || ""; if (!ct.includes("json")) { setPing("❌ ملف الخادم api/ai.js غير مرفوع بعد إلى المستودع"); return; } const j = await r.json(); setPing(j.ok ? `✅ الخدمة تعمل — المفتاح مضبوط في Vercel` : j.code === "nokey" ? "❌ الملف مرفوع لكن المفتاح ANTHROPIC_API_KEY غير مضاف في إعدادات Vercel" : "⚠️ " + j.msg); } catch (e) { setPing("❌ " + e.message); } };
  const rows = useMemo(() => { const T = {}; let n = 0, ti = 0, to = 0; Object.values(log).forEach(d => Object.values(obj(d)).forEach(x => { if (!x) return; n++; ti += +x.i || 0; to += +x.o || 0; const k = x.n || "—"; const t = T[k] || (T[k] = { n: k, c: 0, i: 0, o: 0, last: "" }); t.c++; t.i += +x.i || 0; t.o += +x.o || 0; })); return { n, ti, to, T: Object.values(T).sort((a, b) => b.c - a.c) }; }, [log]);
  if (!cfg) return <div className="sl" style={{ padding: 30, textAlign: "center", fontWeight: 800 }}>⏳ جارٍ التحميل…</div>;
  const usd = (rows.ti * cfg.inR + rows.to * cfg.outR) / 1e6;
  const bankN = Object.values(bank).reduce((a, s) => a + Object.keys(obj(s)).length, 0);
  return <div className="sl" dir="rtl"><style>{CSS}</style>
    <div className="sl-hero"><span className="orb" /><span className="orb2" /><h2>✨ درسي الذكي — الإدارة</h2><p>مفتاح واحد للمدرسة محفوظ في Vercel، وحدود استخدام تحمي الميزانية، وبنك دروس مشترك يقلل التكلفة كلما زاد استخدامه.</p></div>
    <div className="sl-kp" style={{ margin: "14px 0" }}>
      <div style={{ "--c": "#1e3a8a" }}><b>{ar(mUsed)}</b><small>تحليلات هذا الشهر من {ar(cfg.monthly)}</small></div>
      <div style={{ "--c": "#0f766e" }}><b>{ar(rows.T.length)}</b><small>معلمون استخدموا الخدمة</small></div>
      <div style={{ "--c": "#c9a227" }}><b>{ar(bankN)}</b><small>درس في بنك المدرسة</small></div>
      <div style={{ "--c": "#7c3aed" }}><b>${usd.toFixed(2)}</b><small>تكلفة تقديرية للشهر</small></div>
    </div>
    <div className="sl-g2">
      <div className="sl-card"><h3 className="sl-h"><i>⚙️</i>الإعدادات</h3>
        <label style={{ display: "block", fontWeight: 800, fontSize: 13, marginBottom: 8 }}>الحد اليومي لكل معلم<input className="sl-in" type="number" min="1" value={cfg.daily} onChange={e => setCfg({ ...cfg, daily: e.target.value })} /></label>
        <label style={{ display: "block", fontWeight: 800, fontSize: 13, marginBottom: 8 }}>السقف الشهري للمدرسة<input className="sl-in" type="number" min="1" value={cfg.monthly} onChange={e => setCfg({ ...cfg, monthly: e.target.value })} /></label>
        <details style={{ fontSize: 12.5, fontWeight: 700, color: "#64748b", marginBottom: 8 }}><summary>أسعار التقدير (دولار لكل مليون رمز)</summary>
          <div style={{ display: "flex", gap: 8, marginTop: 6 }}><input className="sl-in" type="number" value={cfg.inR} onChange={e => setCfg({ ...cfg, inR: e.target.value })} title="المدخلات" /><input className="sl-in" type="number" value={cfg.outR} onChange={e => setCfg({ ...cfg, outR: e.target.value })} title="المخرجات" /></div></details>
        <label style={{ display: "flex", gap: 8, alignItems: "center", fontWeight: 800, fontSize: 13.5, marginBottom: 10 }}><input type="checkbox" checked={!!cfg.off} onChange={e => setCfg({ ...cfg, off: e.target.checked })} /> إيقاف الخدمة مؤقتًا</label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><button className="sl-b pri" onClick={saveCfg}>💾 حفظ</button><button className="sl-b gh" onClick={test}>🔌 فحص الاتصال بالمفتاح</button></div>
        {msg ? <div className="sl-msg" style={{ background: "#f0fdf4", color: "#166534", marginTop: 8 }}>{msg}</div> : null}
        {ping ? <div className="sl-msg" style={{ background: ping.startsWith("✅") ? "#f0fdf4" : "#fff7ed", color: ping.startsWith("✅") ? "#166534" : "#9a3412", marginTop: 8 }}>{ping}</div> : null}
      </div>
      <div className="sl-card"><h3 className="sl-h"><i>🏦</i>بنك دروس المدرسة</h3>
        {!bankN ? <div style={{ fontWeight: 800, color: "#64748b", fontSize: 13.5 }}>لم يُحفظ أي درس بعد — كل درس يحفظه معلم يُضاف هنا ويستفيد منه زملاؤه دون تكلفة.</div> :
          Object.entries(bank).map(([s, L]) => <div key={s} style={{ marginBottom: 10 }}><b style={{ fontSize: 13.5, color: "#0b1b3a" }}>{s.replace(/_/g, " ").replace(/\|/g, " • ")}</b>
            {Object.values(obj(L)).map((x, i) => <div key={i} style={{ fontSize: 12.5, fontWeight: 700, color: "#334155", lineHeight: 1.8 }}>• {x.t} <span style={{ color: "#94a3b8" }}>— {x.by}</span></div>)}</div>)}
      </div>
    </div>
    <div className="sl-card" style={{ marginTop: 14 }}><h3 className="sl-h"><i>📊</i>الاستخدام هذا الشهر حسب المعلم</h3>
      {!rows.T.length ? <div style={{ fontWeight: 800, color: "#64748b", fontSize: 13.5 }}>لا يوجد استخدام هذا الشهر بعد.</div> :
        <div style={{ overflowX: "auto" }}><table className="sl-tb"><thead><tr><th>المعلم</th><th>عدد التحليلات</th><th>التكلفة التقديرية</th></tr></thead><tbody>
          {rows.T.map(t => <tr key={t.n}><td style={{ textAlign: "right", fontWeight: 800 }}>{t.n}</td><td>{ar(t.c)}</td><td>${((t.i * cfg.inR + t.o * cfg.outR) / 1e6).toFixed(2)}</td></tr>)}
        </tbody></table></div>}
    </div>
  </div>;
}
export default SmartLessonTeacher;
