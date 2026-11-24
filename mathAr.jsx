// ══════════════════════════════════════════════════════════
// 🔢 عرض الرموز الرياضية بأسلوب المناهج السعودية — للعرض فقط (لا يغيّر الأسئلة المحفوظة ولا إجابات الطلاب)
// • الأرقام عربية: ٠١٢٣٤٥٦٧٨٩ • الفاصلة العشرية «٫» وفاصل الآلاف «٬» • ٪
// • الأس يسار الأساس كما في الكتاب: ١٠⁴ و 10^4 و 10<sup>4</sup> و \(10^{4}\) تُعرض كلها بالأس يسارًا
// • الكسر ٣/٤ و ½ و \frac{3}{4} كسر رأسي • الجذر √ بخط علوي • رموز LaTeX (\times \div \le …) تتحول لرموزها
// • في الرياضيات فقط: المتغيرات x y z … تصبح س ص ع … و f(x) تصبح د(س)
// الاستعمال: <Mth t={نص} math /> • mthHtml(نص، {math, html, inline}) لنوافذ الطباعة • mthScan(نص) لفحص النماذج
// ══════════════════════════════════════════════════════════
import React from "react";

const AD = "٠١٢٣٤٥٦٧٨٩";
const SUP = { "⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4", "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9", "⁻": "−", "⁺": "+", "ⁿ": "n", "ˣ": "x" };
const VF = { "½": [1, 2], "⅓": [1, 3], "⅔": [2, 3], "¼": [1, 4], "¾": [3, 4], "⅕": [1, 5], "⅖": [2, 5], "⅗": [3, 5], "⅘": [4, 5], "⅙": [1, 6], "⅚": [5, 6], "⅛": [1, 8], "⅜": [3, 8], "⅝": [5, 8], "⅞": [7, 8] };
const VAR = { x: "س", y: "ص", z: "ع", a: "أ", b: "ب", c: "جـ", n: "ن", m: "م", k: "ك", l: "ل" };
const D = "0-9٠-٩";
const toAr = s => String(s).replace(/[0-9]/g, d => AD[d]);
const hasAr = s => /[ء-ي]/.test(s);
const PUA0 = 0xE000;

// ── ١) توحيد الكتابة قبل التحليل
function prep(src, math) {
  let t = String(src ?? "");
  // LaTeX
  t = t.replace(/\$\$?([^$]+?)\$\$?/g, "$1").replace(/\\\(|\\\)|\\\[|\\\]/g, "")
    .replace(/\\(?:text|mathrm|textbf)\{([^{}]*)\}/g, "$1").replace(/\\left|\\right/g, "")
    .replace(/\\d?frac\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g, "$1$2")
    .replace(/\\times/g, "×").replace(/\\div/g, "÷").replace(/\\cdot/g, "×").replace(/\\pm/g, "±").replace(/\\mp/g, "∓")
    .replace(/\\(?:leq|le)(?![a-z])/g, "≤").replace(/\\(?:geq|ge)(?![a-z])/g, "≥").replace(/\\(?:neq|ne)(?![a-z])/g, "≠")
    .replace(/\\approx/g, "≈").replace(/\\pi/g, "π").replace(/\\infty/g, "∞").replace(/\\angle/g, "∠").replace(/\\triangle/g, "△")
    .replace(/\^\s*\{?\s*\\circ\s*\}?/g, "°").replace(/\\circ/g, "°").replace(/\\%/g, "%").replace(/\\sqrt/g, "√").replace(/\\[,;:! ]/g, " ");
  // رموز مكتوبة بالآلة
  t = t.replace(/<=/g, "≤").replace(/>=/g, "≥").replace(/!=/g, "≠")
    .replace(new RegExp(`([${D}\\)])\\s*\\*\\*\\s*(?=[${D}(])`, "g"), "$1^")
    .replace(new RegExp(`([${D}\\)a-zA-Z\\u0621-\\u064A])\\s*\\*\\s*(?=[${D}(a-zA-Z\\u0621-\\u064A])`, "g"), "$1 × ");
  if (math && (hasAr(t) || !/[A-Za-z]{3,}/.test(t))) {
    t = t.replace(new RegExp(`([${D}])\\s+[xX]\\s+(?=[${D}])`, "g"), "$1 × ")
      .replace(/(^|[^A-Za-z\\])f(?=\s*\()/g, "$1د")
      .replace(/(^|[^A-Za-z\\])([xyzabcnmkl])(?![A-Za-z])/g, (m, p, v) => p + VAR[v]);
    // المتغير اللاتيني الملاصق لعدد: 3x → ٣س
    t = t.replace(new RegExp(`([${D}])([xyz])(?![A-Za-z])`, "g"), (m, d, v) => d + VAR[v]);
  }
  // الأزواج المرتبة (3,4) و (−2, 5) بالفاصلة العربية
  t = t.replace(new RegExp(`\\(\\s*([−-]?[${D}.]+)\\s*,\\s*([−-]?[${D}.]+)\\s*\\)`, "g"), "($1، $2)");
  // الأعداد: فاصل الآلاف ثم الكسر العشري ثم الأرقام العربية
  const th = new RegExp(`([${D}]),([${D}]{3})(?![${D}])`);
  for (let k = 0; k < 4 && th.test(t); k++) t = t.replace(new RegExp(th.source, "g"), "$1٬$2");
  t = t.replace(new RegExp(`([${D}])[.,](?=[${D}])`, "g"), "$1٫")
    .replace(new RegExp(`([${D}])\\s?%`, "g"), "$1٪").replace(new RegExp(`%(?=\\s?[${D}])`, "g"), "٪");
  if (hasAr(t)) t = t.replace(/,(?=\s)/g, "،");
  return toAr(t);
}

// ── ٢) التحليل إلى عقد: نص • أس • كسر • جذر
const closeOf = { "(": ")", "{": "}", "[": "]" };
function matchFwd(s, j) { const o = s[j], c = closeOf[o]; let d = 0; for (let k = j; k < s.length; k++) { if (s[k] === o) d++; else if (s[k] === c && --d === 0) return k; } return -1; }
function matchBack(s, j) { let d = 0; for (let k = j; k >= 0; k--) { if (s[k] === ")") d++; else if (s[k] === "(" && --d === 0) return k; } return -1; }
const NUM_END = /[٠-٩][٠-٩٫٬]*$/;
const NUM_START = /^[٠-٩][٠-٩٫٬]*/;

function parse(s) {
  const out = []; let buf = "";
  const flush = () => { if (buf) { out.push(buf); buf = ""; } };
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    // كسر LaTeX المعلَّم
    if (c === "") { const a = s.indexOf("", i), b = s.indexOf("", a); if (a > 0 && b > 0) { flush(); out.push({ f: [parse(s.slice(i + 1, a)), parse(s.slice(a + 1, b))] }); i = b + 1; continue; } }
    // كسر بحرف واحد ½
    if (VF[c]) { flush(); out.push({ f: [[toAr(VF[c][0])], [toAr(VF[c][1])]] }); i++; continue; }
    // الأس
    if (SUP[c] || c === "^") {
      let exp = "", j = i;
      if (c === "^") {
        j = i + 1; while (s[j] === " ") j++;
        if (s[j] === "{" || s[j] === "(") { const k = matchFwd(s, j); if (k < 0) { buf += c; i++; continue; } exp = s.slice(j + 1, k); j = k + 1; }
        else { const m = /^[−-]?(?:[٠-٩][٠-٩٫]*|[^\s٠-٩])/.exec(s.slice(j)); if (!m) { buf += c; i++; continue; } exp = m[0]; j += m[0].length; }
      } else { while (j < s.length && SUP[s[j]]) { exp += SUP[s[j]]; j++; } exp = toAr(exp); }
      exp = exp.replace(/-/g, "−"); if (s[i] !== "^" && /^[nx]$/.test(exp)) exp = VAR[exp];
      const e = parse(exp);
      // أساس عربي (حرف/كلمة مثل س² أو سم²): الاتجاه من اليمين يضع الأس يسارًا تلقائيًا دون كسر وصل الحروف
      if (/[ء-يـπ]\s*$/.test(buf) && !/\)\s*$/.test(buf)) { flush(); out.push({ s: e }); i = j; continue; }
      let base = null;
      if (/\)\s*$/.test(buf)) { const end = buf.lastIndexOf(")"); const p = matchBack(buf, end); if (p >= 0) { base = parse(buf.slice(p, end + 1)); buf = buf.slice(0, p); } }
      if (!base) { const m = NUM_END.exec(buf) || /[A-Za-z]$/.exec(buf); if (m) { base = [m[0]]; buf = buf.slice(0, buf.length - m[0].length); } }
      flush();
      out.push(base ? { p: base, e } : { s: e });
      i = j; continue;
    }
    // الكسر ٣/٤ (عدد/عدد فقط — لا يمس الوحدات مثل كم/س ولا التواريخ ١٤٤٦/٥/٣)
    if (c === "/") {
      const m1 = NUM_END.exec(buf), m2 = NUM_START.exec(s.slice(i + 1));
      if (m1 && m2) {
        const before = buf[buf.length - m1[0].length - 1], after = s[i + 1 + m2[0].length];
        if (before !== "/" && after !== "/" && !/[٠-٩]/.test(after || "")) {
          buf = buf.slice(0, buf.length - m1[0].length); flush();
          out.push({ f: [[m1[0]], [m2[0]]] }); i += 1 + m2[0].length; continue;
        }
      }
    }
    // الجذر
    if (c === "√") {
      let j = i + 1; while (s[j] === " ") j++; let body = null, k = j;
      if (s[j] === "(" || s[j] === "{") { const e = matchFwd(s, j); if (e > 0) { body = s.slice(j + 1, e); k = e + 1; } }
      else { const m = /^(?:[٠-٩][٠-٩٫٬]*|[ء-يA-Za-zπ])/.exec(s.slice(j)); if (m) { body = m[0]; k = j + m[0].length; } }
      if (body != null) {
        // معامل قبل الجذر يبقى قبله: ٣√٢
        flush(); out.push({ r: parse(body) }); i = k; continue;
      }
    }
    buf += c; i++;
  }
  flush();
  return out;
}

const cache = new Map();
function nodesOf(t, math) {
  const k = (math ? "1" : "0") + t; if (cache.has(k)) return cache.get(k);
  const n = parse(prep(t, math)); if (cache.size > 3000) cache.clear(); cache.set(k, n); return n;
}

// ── ٣) العرض في React
function rn(nodes, kp = "") {
  return nodes.map((n, i) => {
    const key = kp + i;
    if (typeof n === "string") return <React.Fragment key={key}>{n}</React.Fragment>;
    if (n.s) return <sup key={key} className="mx-e">{rn(n.s, key + "s")}</sup>;
    if (n.p) return <span key={key} className="mx-pw"><sup className="mx-e">{rn(n.e, key + "e")}</sup><span className="mx-b">{rn(n.p, key + "b")}</span></span>;
    if (n.f) return <span key={key} className="mx-fr"><span>{rn(n.f[0], key + "n")}</span><span>{rn(n.f[1], key + "d")}</span></span>;
    if (n.r) return <span key={key} className="mx-rt"><span className="mx-rs">√</span><span className="mx-rb">{rn(n.r, key + "r")}</span></span>;
    return null;
  });
}

export const MX_CSS = `.mx-pw,.mx-rt{display:inline-block;direction:ltr;unicode-bidi:isolate;white-space:nowrap;text-indent:0}
.mx-b,.mx-rb{direction:rtl;unicode-bidi:isolate}
.mx-e{font-size:.64em;line-height:0;vertical-align:.8em;direction:rtl;unicode-bidi:isolate;margin:0 .04em;font-weight:inherit}
.mx-fr{display:inline-flex;flex-direction:column;align-items:stretch;vertical-align:middle;text-align:center;line-height:1.12;margin:0 .18em;font-size:.9em;unicode-bidi:isolate;text-indent:0}
.mx-fr>span{display:block;padding:0 .22em;white-space:nowrap}
.mx-fr>span:first-child{border-bottom:.09em solid currentColor;padding-bottom:.06em}
.mx-fr>span:last-child{padding-top:.06em}
.mx-rs{display:inline-block;transform:scaleY(1.08);margin-left:-.02em}
.mx-rb{border-top:.08em solid currentColor;padding:0 .12em 0 .08em;margin-top:.12em;display:inline-block;line-height:1.2}`;
let cssOn = false;
function ensureCss() { if (cssOn || typeof document === "undefined") return; cssOn = true; const st = document.createElement("style"); st.setAttribute("data-mx", "1"); st.textContent = MX_CSS; document.head.appendChild(st); }
if (typeof document !== "undefined") ensureCss();

/** نص رياضي مُنسَّق: t النص • math=true لمادة الرياضيات (تحويل المتغيرات x→س) */
export function Mth({ t, math, as = "span", className, style }) {
  ensureCss();
  if (t == null || t === "") return null;
  return React.createElement(as, { className, style }, rn(nodesOf(String(t), !!math)));
}

// ── ٤) نسخة HTML (للطباعة وللنصوص المخزّنة بصيغة HTML مثل مفاتيح الإجابات)
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const IS = {
  pw: "display:inline-block;direction:ltr;unicode-bidi:isolate;white-space:nowrap",
  b: "direction:rtl;unicode-bidi:isolate",
  e: "font-size:.64em;line-height:0;vertical-align:.8em;direction:rtl;unicode-bidi:isolate;margin:0 .04em",
  fr: "display:inline-flex;flex-direction:column;vertical-align:middle;text-align:center;line-height:1.12;margin:0 .18em;font-size:.9em;unicode-bidi:isolate",
  fn: "display:block;padding:0 .22em .06em;border-bottom:.09em solid currentColor;white-space:nowrap",
  fd: "display:block;padding:.06em .22em 0;white-space:nowrap",
  rb: "direction:rtl;unicode-bidi:isolate;border-top:.08em solid currentColor;padding:0 .12em 0 .08em;display:inline-block;line-height:1.2",
};
function hs(nodes, inl, tags) {
  const T = s => { let x = esc(s); if (tags) x = x.replace(/[-]/g, ch => tags[ch.charCodeAt(0) - PUA0] || ""); return x; };
  const A = (cls, st) => inl ? ` style="${IS[st]}"` : ` class="${cls}"`;
  return nodes.map(n => {
    if (typeof n === "string") return T(n);
    if (n.s) return `<sup${A("mx-e", "e")}>${hs(n.s, inl, tags)}</sup>`;
    if (n.p) return `<span${A("mx-pw", "pw")}><sup${A("mx-e", "e")}>${hs(n.e, inl, tags)}</sup><span${A("mx-b", "b")}>${hs(n.p, inl, tags)}</span></span>`;
    if (n.f) return `<span${A("mx-fr", "fr")}><span${inl ? ` style="${IS.fn}"` : ""}>${hs(n.f[0], inl, tags)}</span><span${inl ? ` style="${IS.fd}"` : ""}>${hs(n.f[1], inl, tags)}</span></span>`;
    if (n.r) return `<span${A("mx-rt", "pw")}>√<span${A("mx-rb", "rb")}>${hs(n.r, inl, tags)}</span></span>`;
    return "";
  }).join("");
}
/**
 * HTML منسَّق. o.html=true إذا كان المدخل HTML (يحافظ على الوسوم، ويحوّل <sup>…</sup> لأس يسار)
 * o.inline=true لنوافذ الطباعة (أنماط مضمّنة) • o.br=true يحوّل السطر الجديد إلى <br>
 */
export function mthHtml(src, o = {}) {
  let s = String(src ?? ""); let tags = null;
  if (o.html) {
    s = s.replace(/<sup>\s*([^<]*?)\s*<\/sup>/gi, (m, x) => `^{${x}}`).replace(/<br\s*\/?>/gi, "\n").replace(/&nbsp;/g, " ");
    tags = []; s = s.replace(/<[^>]+>|&[a-z#0-9]+;/gi, m => { tags.push(m); return String.fromCharCode(PUA0 + tags.length - 1); });
  }
  let h = hs(parse(prep(s, !!o.math)), !!o.inline, tags);
  if (o.br !== false) h = h.replace(/\n/g, "<br>");
  return h;
}
/** للعناصر React التي تعرض HTML مخزَّنًا */
export function MthHtml({ h, math, as = "span", className, style }) {
  ensureCss();
  return React.createElement(as, { className, style, dangerouslySetInnerHTML: { __html: mthHtml(h, { html: true, math }) } });
}
/** نص عادي بأرقام عربية فقط (للعناوين والتلميحات والخصائص) */
export const mthTxt = (s, math) => prep(s, math).replace(/\^\{?([^}\s]*)\}?/g, "^$1");

// ── ٥) فحص نص سؤال: ما الذي كان يظهر بخلاف المنهج؟
export function mthScan(src, math) {
  const s = String(src ?? "").replace(/<[^>]+>/g, m => /^<\/?sup/i.test(m) ? m : " ");
  const f = [];
  if (/[0-9]/.test(s)) f.push("west");
  if (new RegExp(`[${D}][${D}٫.,]*\\s*(?:[⁰¹²³⁴⁵⁶⁷⁸⁹⁻]|\\^|\\*\\*|<sup)`, "i").test(s) || /\)\s*(?:[⁰¹²³⁴⁵⁶⁷⁸⁹]|\^)/.test(s)) f.push("pow");
  if (/\\[a-z]+|\$[^$]+\$/.test(s)) f.push("latex");
  if (math && (hasAr(s) || !/[A-Za-z]{3,}/.test(s)) && /(^|[^A-Za-z])[xyz](?![A-Za-z])|[0-9][xyz](?![A-Za-z])/.test(s)) f.push("latin");
  if (new RegExp(`(^|[^/${D}])[${D}]+/[${D}]+(?![/${D}])`).test(s) || /[½⅓⅔¼¾⅛]/.test(s)) f.push("frac");
  if (/[0-9]\.[0-9]|[٠-٩],[٠-٩]/.test(s)) f.push("dec");
  if (/[*]|<=|>=|!=/.test(s)) f.push("ops");
  return f;
}
export const MX_FLAG = { west: "أرقام إنجليزية", pow: "أس يظهر يمين الأساس", latex: "رموز LaTeX خام", latin: "متغيرات لاتينية (x ، y)", frac: "كسر بخط مائل", dec: "فاصلة عشرية غير موحّدة", ops: "رموز حاسوبية (* <=)" };
