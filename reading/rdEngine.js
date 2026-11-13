// ══════════════════════════════════════════════════════════════════
// 📖 محرك تقييم القراءة الجهرية — مطابقة ما نطقه الطالب بالنص الأصلي
// • تطبيع عربي (إزالة التشكيل وتوحيد الهمزات والتاء المربوطة …)
// • محاذاة كلمة بكلمة (برمجة ديناميكية) لاستخراج: الحذف • الإبدال • الإضافة • التكرار
// • حساب الدقة والطلاقة (كلمة صحيحة/دقيقة) ونسبة الإنجاز والدرجة والمستوى
// • تحليل المهارات من خصائص الكلمات الخاطئة (التشديد، التنوين، اللام الشمسية، الهمزات …)
// ══════════════════════════════════════════════════════════════════

export const RD_LV = [
  { k: "a", t: "متقن", min: 85, c: "#15803d", bg: "#dcfce7", ic: "🌟", d: "يقرأ بدقة عالية وطلاقة مناسبة لصفه" },
  { k: "b", t: "متمكن", min: 70, c: "#0e7490", bg: "#cffafe", ic: "✅", d: "قراءة سليمة في الغالب مع أخطاء قليلة" },
  { k: "m", t: "ضعف متوسط", min: 50, c: "#d97706", bg: "#fef3c7", ic: "🟠", d: "يتعثر في كلمات كثيرة أو يقرأ ببطء واضح — يحتاج دعماً" },
  { k: "s", t: "ضعف شديد", min: 0, c: "#dc2626", bg: "#fee2e2", ic: "🔴", d: "دقة منخفضة جداً — يحتاج خطة علاجية عاجلة" },
];
export const rdLvOf = k => RD_LV.find(x => x.k === k) || RD_LV[3];
export const RD_TARGET = { 1: 90, 2: 100, 3: 110 }; // كلمة صحيحة في الدقيقة (قابلة للتعديل لكل نص)

// حالة كل كلمة: o صحيحة • d حذف • s إبدال/خطأ نطق • t خطأ ضبط (تشكيل) • r تكرار • n لم يُقرأ
export const RD_ST = {
  o: { t: "صحيحة", c: "#15803d", bg: "transparent" },
  s: { t: "إبدال / خطأ نطق", c: "#c2410c", bg: "#ffedd5" },
  d: { t: "حذف", c: "#dc2626", bg: "#fee2e2" },
  t: { t: "خطأ ضبط (تشكيل)", c: "#7c3aed", bg: "#ede9fe" },
  r: { t: "تكرار", c: "#0891b2", bg: "#cffafe" },
  n: { t: "لم يُقرأ", c: "#94a3b8", bg: "#f1f5f9" },
};
export const RD_CYCLE = ["o", "s", "d", "t", "r", "n"];

const DIAC = /[ؐ-ًؚ-ٰٟۖ-ۭـ]/g;
export const arNorm = w => String(w || "")
  .replace(DIAC, "")
  .replace(/[إأآٱ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه").replace(/ؤ/g, "و").replace(/ئ/g, "ي")
  .replace(/[٠-٩]/g, d => "٠١٢٣٤٥٦٧٨٩".indexOf(d))
  .replace(/[^ء-ي0-9a-zA-Z]/g, "");

// تقسيم النص إلى كلمات: d للعرض (بالتشكيل وعلامات الترقيم) و n للمطابقة
export function rdTokens(body) {
  const out = [];
  String(body || "").split(/\s+/).forEach(w => {
    if (!w) return; const n = arNorm(w);
    if (!n) { if (out.length) out[out.length - 1].d += " " + w; return; }
    out.push({ d: w, n });
  });
  return out;
}

function lev(a, b) {
  if (a === b) return 0; const m = a.length, n = b.length; if (!m) return n; if (!n) return m;
  let p = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) { const c = [i]; for (let j = 1; j <= n; j++) c[j] = Math.min(p[j] + 1, c[j - 1] + 1, p[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); p = c; }
  return p[n];
}
// كلمتان متقاربتان (فروق إملائية/ضوضاء التعرف الصوتي وليست خطأ قراءة)
const canon = s => { let x = s.replace(/ء/g, ""); if (x.length > 2) x = x.replace(/^و/, ""); if (x.length > 2) x = x.replace(/ا$/, ""); return x; };
function near(a, b) {
  if (a === b) return true; if (!a || !b) return false;
  if (canon(a) === canon(b)) return true;           // واو العطف • ألف تنوين الفتح • الهمزة
  const L = Math.max(a.length, b.length); return L >= 6 && lev(a, b) <= 1;
}

// المحاذاة: R كلمات النص (مطبّعة) و H ما سُمع (مطبّع) → حالة كل كلمة + ما سُمع مكان الكلمة الخاطئة + عدد الإضافات
export function rdAlign(ref, heardText) {
  const R = ref.map(x => x.n);
  const Hraw = String(heardText || "").split(/\s+/).filter(Boolean);
  const H = []; const Hd = []; let pre = "";
  Hraw.forEach(w => { const n = arNorm(w); if (!n) return; if (n === "و") { pre = "و"; return; } H.push(pre + n); Hd.push((pre ? "و" : "") + w); pre = ""; });
  const n = R.length, m = H.length;
  const st = Array(n).fill("n"); const hd = {}; let ins = 0;
  if (!n) return { st: "", hd, ins: 0, pos: -1 };
  if (!m) return { st: st.join(""), hd, ins: 0, pos: -1 };
  const D = Array.from({ length: n + 1 }, () => new Float32Array(m + 1));
  const B = Array.from({ length: n + 1 }, () => new Uint8Array(m + 1));
  for (let i = 1; i <= n; i++) { D[i][0] = i; B[i][0] = 1; }
  for (let j = 1; j <= m; j++) { D[0][j] = j; B[0][j] = 2; }
  for (let i = 1; i <= n; i++) for (let j = 1; j <= m; j++) {
    const a = R[i - 1], h = H[j - 1]; const c = a === h ? 0 : near(a, h) ? 0.3 : lev(a, h) / Math.max(a.length, h.length) <= 0.4 ? 0.8 : 1.5;
    const dg = D[i - 1][j - 1] + c, up = D[i - 1][j] + 1, lf = D[i][j - 1] + 1;
    if (dg <= up && dg <= lf) { D[i][j] = dg; B[i][j] = 0; } else if (up <= lf) { D[i][j] = up; B[i][j] = 1; } else { D[i][j] = lf; B[i][j] = 2; }
  }
  // نهاية حرة: الكلمات بعد موضع توقف الطالب «لم تُقرأ» وتكلفتها رمزية حتى لا تُحسب حذفاً
  let bi = n, bc = Infinity; for (let k = n; k >= 0; k--) { const c = D[k][m] + (n - k) * 0.05; if (c < bc - 1e-6) { bc = c; bi = k; } }
  const ops = []; let i = bi, j = m;
  while (i > 0 || j > 0) {
    const b = i > 0 && j > 0 ? B[i][j] : i > 0 ? 1 : 2;
    if (b === 0) { ops.push({ k: R[i - 1] === H[j - 1] || near(R[i - 1], H[j - 1]) ? "m" : "s", i: i - 1, j: j - 1 }); i--; j--; }
    else if (b === 1) { ops.push({ k: "d", i: i - 1 }); i--; }
    else { ops.push({ k: "i", j: j - 1, i: i - 1 }); j--; }
  }
  ops.reverse();
  let lastI = -1, pend = false;
  ops.forEach(o => {
    if (o.k === "m") { st[o.i] = pend && o.i === lastI + 1 ? "r" : "o"; pend = false; lastI = o.i; }
    else if (o.k === "s") { st[o.i] = "s"; hd[o.i] = Hd[o.j]; lastI = o.i; }
    else if (o.k === "d") { st[o.i] = "d"; }
    else { // إضافة: تكرار لكلمة سابقة/لاحقة أم كلمة زائدة؟
      const w = H[o.j]; const prev = lastI >= 0 ? R[lastI] : null; const next = R[lastI + 1];
      if (prev && near(prev, w)) { if (st[lastI] === "o") st[lastI] = "r"; }
      else if (next && near(next, w) && o.j + 1 < m && near(H[o.j + 1], next)) { pend = true; /* بداية تكرار — تُحسب على الكلمة التالية */ }
      else ins++;
    }
  });
  // الكلمات بعد آخر كلمة مقروءة = لم تُقرأ (توقف الطالب)
  for (let k = n - 1; k > lastI; k--) if (st[k] === "d") st[k] = "n";
  return { st: st.join(""), hd, ins, pos: lastI };
}

// المقاييس من حالة الكلمات
export function rdMetrics(stStr, ins = 0, dur = 0, target = 100) {
  const st = String(stStr || ""); const n = st.length; const c = { o: 0, d: 0, s: 0, t: 0, r: 0, n: 0 };
  for (const ch of st) c[ch] = (c[ch] || 0) + 1;
  const att = n - c.n; const correct = c.o + c.r; const errs = c.d + c.s + c.t + (+ins || 0);
  const acc = att ? Math.max(0, (att - errs) / att * 100) : 0;
  const comp = n ? att / n * 100 : 0;
  const wcpm = dur >= 3 ? correct / (dur / 60) : 0;
  const flu = Math.min(100, target ? wcpm / target * 100 : 0);
  let score = att ? Math.round(acc * 0.6 + flu * 0.25 + comp * 0.15) : 0;
  let lv = RD_LV.find(x => score >= x.min).k;
  // سقف المستوى حسب الدقة (معيار القراءة: أقل من ٩٠٪ مستوى إحباط، أقل من ٨٠٪ ضعف، أقل من ٦٠٪ ضعف شديد)
  if (acc < 60 && "abm".includes(lv)) lv = "s"; else if (acc < 80 && "ab".includes(lv)) lv = "m"; else if (acc < 90 && lv === "a") lv = "b";
  if (comp < 50 && "ab".includes(lv)) lv = "m"; // لم يُكمل نصف النص
  return { n, c, ins: +ins || 0, att, correct, errs, acc: Math.round(acc), comp: Math.round(comp), wcpm: Math.round(wcpm), flu: Math.round(flu), score, lv, dur: Math.round(dur) };
}

// ── تحليل المهارات من الكلمات الخاطئة
const SUN = "تثدذرزسشصضطظلن";
const PAIRS = [["ذ", "ز"], ["ث", "س"], ["ض", "د"], ["ظ", "ز"], ["ض", "ظ"], ["ق", "ك"], ["ح", "ه"], ["ع", "ا"], ["ص", "س"], ["ط", "ت"], ["ق", "ء"], ["غ", "خ"]];
export const RD_SK = {
  sh: { t: "نطق الحرف المشدّد", tip: "تدريب على الكلمات المشدّدة بتقطيعها: مَدْ / رَسَة ← مَدْرَسَة، ونطق الحرف مرتين" },
  tn: { t: "التنوين", tip: "التمييز بين التنوين بأنواعه الثلاثة ونطقه نوناً ساكنة في آخر الكلمة" },
  lm: { t: "اللام الشمسية والقمرية", tip: "تصنيف كلمات النص إلى شمسية وقمرية وقراءتها مع حذف نطق اللام الشمسية" },
  hz: { t: "الهمزات", tip: "قراءة كلمات فيها همزة في أولها ووسطها وآخرها بأشكالها المختلفة" },
  md: { t: "المدود (الحركات الطويلة)", tip: "التمييز بين الحركة القصيرة والطويلة: كَتَبَ / كاتِب / كُتُوب" },
  lg: { t: "الكلمات الطويلة", tip: "تقطيع الكلمة الطويلة إلى مقاطع صوتية ثم دمجها، والبدء بالجذر ثم السوابق واللواحق" },
  tk: { t: "ضبط أواخر الكلمات (التشكيل)", tip: "قراءة جمل قصيرة مشكولة مع التركيز على الحركة الأخيرة، والقراءة النموذجية ثم المحاكاة" },
  om: { t: "حذف الكلمات وتجاوز السطر", tip: "تتبع السطر بالإصبع أو المسطرة، والقراءة المتأنية، وتقسيم النص إلى فقرات قصيرة" },
  fl: { t: "الطلاقة وسرعة القراءة", tip: "القراءة المتكررة للنص نفسه ٣ مرات يومياً، والقراءة المصاحبة لصوت المعلم مع قياس الزمن" },
  rp: { t: "التكرار والتردد", tip: "تعزيز الثقة بقراءة نص مألوف أولاً، والقراءة الصامتة قبل الجهرية" },
  cm: { t: "التحمّل القرائي (إكمال النص)", tip: "زيادة طول النص تدريجياً والتشجيع على الإكمال مع فواصل قصيرة" },
  lt: { t: "التمييز بين الحروف المتقاربة", tip: "" },
};
export function rdSkills(ref, stStr, hd = {}, M = null) {
  const st = String(stStr || ""); const S = {}; const add = (k, w, x) => { const o = S[k] = S[k] || { k, n: 0, w: [] }; o.n++; if (w && o.w.length < 8 && !o.w.includes(w)) o.w.push(w); if (x) o.x = [...new Set([...(o.x || []), x])]; };
  ref.forEach((tok, i) => {
    const s = st[i]; if (!"dst".includes(s)) return; const raw = tok.d, n = tok.n, w = raw.replace(/[^ء-ْٰ]/g, "");
    if (s === "t") add("tk", w);
    if (s === "d") add("om", w);
    if (/ّ/.test(raw)) add("sh", w);
    if (/[ً-ٍ]/.test(raw)) add("tn", w);
    if (/^(و|ف|ب|ك)?ال/.test(n) && SUN.includes(n.replace(/^(و|ف|ب|ك)?ال/, "")[0] || "")) add("lm", w);
    if (/[ءأإآؤئ]/.test(raw.replace(DIAC, "").slice(1))) add("hz", w);
    if (n.length >= 7) add("lg", w);
    if (/.[اوي]./.test(n) && s === "s") add("md", w);
    if (s === "s" && hd[i]) { const h = arNorm(hd[i]); if (h.length === n.length) { for (let k = 0; k < n.length; k++) if (n[k] !== h[k]) { const p = PAIRS.find(([a, b]) => (a === n[k] && b === h[k]) || (b === n[k] && a === h[k])); if (p) add("lt", w, p.join("/")); } } }
  });
  if (M) {
    if (M.att >= 10 && M.wcpm && M.flu < 70) S.fl = { k: "fl", n: Math.round((100 - M.flu) / 10), w: [] };
    if (M.c.r >= 2) S.rp = { k: "rp", n: M.c.r, w: [] };
    if (M.comp < 80) S.cm = { k: "cm", n: Math.round((100 - M.comp) / 10), w: [] };
  }
  return Object.values(S).filter(x => x.n).sort((a, b) => b.n - a.n);
}
export const rdSkTitle = s => s.k === "lt" && s.x ? `${RD_SK.lt.t} (${s.x.join("، ")})` : (RD_SK[s.k] || {}).t || s.k;
export const rdSkTip = s => s.k === "lt" ? `تدريب سمعي ونطقي على أزواج الحروف${s.x ? ` (${s.x.join("، ")})` : ""} في كلمات وجمل، مع مخارج الحروف أمام المرآة` : (RD_SK[s.k] || {}).tip || "";

// ماذا يحتاج الطالب؟ — توصيات علاجية مرتبة حسب الأولوية
export function rdNeeds(M, skills) {
  const L = []; if (!M || !M.att) return ["لم تُسجَّل قراءة كافية للحكم — يُعاد الاختبار بحضور المعلم"];
  if (M.lv === "s") L.push("خطة علاجية فردية عاجلة: تشخيص المهارات الأساسية (الحروف والمقاطع والحركات) وإحالة لمعلم صعوبات التعلم عند الحاجة");
  else if (M.lv === "m") L.push("إدراج الطالب في مجموعة دعم قرائي (٣ حصص أسبوعياً) مع متابعة أسبوعية لقياس التقدم");
  skills.slice(0, 4).forEach(s => { const t = rdSkTip(s); if (t) L.push(`${rdSkTitle(s)}: ${t}`); });
  if (M.lv === "a") L.push("إثراء: نصوص أطول وأعلى مستوى، وتكليفه بالقراءة النموذجية لزملائه");
  if (M.lv === "b" && !skills.length) L.push("الاستمرار في القراءة اليومية لنصوص متنوعة لرفع الطلاقة");
  return L;
}
export const rdFmtDur = s => { s = Math.round(+s || 0); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };

// ══════════ شرح دقيق لكل خطأ: ماذا حدث في الكلمة؟ ══════════
const HARAKA = { "َ": "الفتحة", "ُ": "الضمة", "ِ": "الكسرة", "ْ": "السكون", "ً": "تنوين الفتح", "ٌ": "تنوين الضم", "ٍ": "تنوين الكسر" };
const clean = w => String(w || "").replace(/[،,.؛:!؟?«»"()]/g, "");
const showL = (ch, refN, i) => ch === "ه" && i === refN.length - 1 ? "ة" : ch;
// عمليات الفرق على مستوى الحروف
function charOps(a, b) {
  const m = a.length, n = b.length; const D = Array.from({ length: m + 1 }, (_, i) => Array.from({ length: n + 1 }, (_, j) => i ? (j ? 0 : i) : j));
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) D[i][j] = Math.min(D[i - 1][j] + 1, D[i][j - 1] + 1, D[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  const ops = []; let i = m, j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && D[i][j] === D[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)) { if (a[i - 1] !== b[j - 1]) ops.push({ k: "s", i: i - 1, a: a[i - 1], b: b[j - 1] }); i--; j--; }
    else if (i > 0 && D[i][j] === D[i - 1][j] + 1) { ops.push({ k: "d", i: i - 1, a: a[i - 1] }); i--; }
    else { ops.push({ k: "i", i, b: b[j - 1] }); j--; }
  }
  return ops.reverse();
}
const lastHaraka = raw => { const m = String(raw).replace(/[^ء-يً-ْ]/g, "").match(/[ً-ْ]+$/); if (!m) return ""; const h = [...m[0]].find(c => HARAKA[c]); return h ? HARAKA[h] : ""; };
// تنبيهات من خصائص الكلمة نفسها
function wordHints(raw, n) {
  const H = []; const letters = String(raw).replace(/[^ء-يّ]/g, "");
  const sh = [...letters].map((c, i) => c === "ّ" ? letters[i - 1] : null).filter(Boolean);
  if (sh.length) H.push(`فيها حرف مشدّد (${sh.join("، ")}) يُنطق مرتين: ساكناً ثم متحركاً`);
  if (/[ً-ٍ]/.test(raw)) H.push(`تنتهي بـ${lastHaraka(raw) || "تنوين"} فتُنطق نوناً ساكنة في آخرها`);
  const pre = n.match(/^(و|ف|ب|ك)?ال/); if (pre) { const c = n.slice(pre[0].length)[0]; if (c && "تثدذرزسشصضطظلن".includes(c)) H.push(`اللام فيها شمسية: تُكتب ولا تُنطق، ويُشدّد الحرف بعدها (${c})`); }
  if (n.length >= 7) H.push("كلمة طويلة: قسّمها إلى مقاطع ثم اجمعها");
  return H;
}
// يُرجع لكل كلمة خاطئة: { i, w, k, title, what, hints[] }
export function rdExplain(ref, stStr, hd = {}) {
  const st = String(stStr || ""); const out = [];
  ref.forEach((tok, i) => {
    const s = st[i]; if (!"dstr".includes(s) || !s) return; const w = clean(tok.d); const n = tok.n;
    if (s === "d") out.push({ i, w, k: s, title: "حذف", what: `لم تقرأ كلمة «${w}» وتجاوزتها`, hints: ["تتبّع السطر بإصبعك، ولا تنتقل حتى تنطق كل كلمة"] });
    else if (s === "r") out.push({ i, w, k: s, title: "تكرار", what: `كرّرت كلمة «${w}» أكثر من مرة`, hints: ["اقرأ الكلمة مرة واحدة بثقة؛ اقرأ الجملة بعينك أولاً ثم بصوتك"] });
    else if (s === "t") { const h = lastHaraka(tok.d); out.push({ i, w, k: s, title: "ضبط (تشكيل)", what: `أخطأت في تشكيل كلمة «${w}»${h ? `؛ الصحيح أن آخرها بـ${h}` : ""}`, hints: ["انظر إلى الحركة على كل حرف، خاصة الحرف الأخير، واستمع للقراءة النموذجية"] }); }
    else if (s === "s") {
      const hr = clean(hd[i] || ""); const h = arNorm(hr); let what = hr ? `قرأتها «${hr}» والصحيح «${w}»` : `نطقت كلمة «${w}» نطقاً غير صحيح`; const det = [];
      if (h) {
        const strip = x => x.replace(/^(و|ف|ب|ك)?ال/, "");
        if (h === strip(n) && h !== n) det.push(`أسقطت «ال» من أول الكلمة`);
        else if ("ال" + h === n.replace(/^(و|ف|ب|ك)/, "") && h !== n) det.push(`أسقطت حرف (${n[0]}) من أول الكلمة`);
        else if (n === "ال" + h || ("ال" + strip(h)) === n) det.push(`أسقطت «ال» من أول الكلمة`);
        else if (h === "ال" + n) det.push("أضفت «ال» إلى أول الكلمة وهي ليست فيها");
        else { const ops = charOps(n, h); if (ops.length && ops.length <= 3) ops.forEach(o => {
          if (o.k === "s") det.push(`نطقت حرف (${o.b}) بدل حرف (${showL(o.a, n, o.i)})`);
          else if (o.k === "d") det.push(`أسقطت حرف (${showL(o.a, n, o.i)})${o.i === 0 ? " من أول الكلمة" : o.i === n.length - 1 ? " من آخر الكلمة" : " من وسط الكلمة"}`);
          else det.push(`أضفت حرف (${o.b})${o.i === 0 ? " في أول الكلمة" : o.i >= n.length ? " في آخر الكلمة" : " في وسط الكلمة"}`); }); else if (ops.length) det.push("نطقت كلمة مختلفة عن المكتوبة؛ ركّز على حروفها بالترتيب"); }
      }
      out.push({ i, w, k: s, title: "خطأ نطق / إبدال", what: what + (det.length ? ` — ${det.join("، ")}` : ""), hints: wordHints(tok.d, n) });
    }
  });
  return out;
}
// موضع التوقف إن لم يُكمل النص
export function rdStopInfo(ref, stStr) { const st = String(stStr || ""); const i = st.indexOf("n"); if (i < 0 || !/[^n]/.test(st)) return null; if (st.slice(i).replace(/n/g, "")) return null; return { i, w: clean(ref[i] ? ref[i].d : ""), left: st.length - i }; }
