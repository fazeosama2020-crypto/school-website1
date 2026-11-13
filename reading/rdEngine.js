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
// توحيد الكتابة فقط (لا النطق): أشكال الهمزة وألف تنوين الفتح — وما عدا ذلك يجب أن تطابق الكلمة المقروءة المكتوبةَ تماماً
// (إضافة «ال» أو حذفها، أو حذف واو العطف، أو تغيير حرف = خطأ قراءة)
const canon = s => { let x = s.replace(/ء/g, ""); if (x.length > 2) x = x.replace(/ا$/, ""); return x; };
function near(a, b) { if (a === b) return true; if (!a || !b) return false; return canon(a) === canon(b); }
// محاولتان متتاليتان للكلمة نفسها (تكرار أو تصحيح ذاتي أو بداية متقطعة «مذ… مذهلة»)
function sameTry(a, b) { if (!a || !b) return false; const A = canon(a), B = canon(b); if (A === B) return true; if (A.length >= 2 && B.startsWith(A)) return true; const L = Math.max(A.length, B.length); return L >= 3 && lev(A, B) / L <= 0.5; }

// المحاذاة: R كلمات النص (مطبّعة) و H ما سُمع (مطبّع) → حالة كل كلمة + ما سُمع مكان الكلمة الخاطئة + عدد الإضافات
export function rdAlign(ref, heardText) {
  const R = ref.map(x => x.n);
  const Hraw = String(heardText || "").split(/\s+/).filter(Boolean);
  const H = []; const Hd = []; const Hx = []; let pre = "";
  Hraw.forEach((w, x) => { const n = arNorm(w); if (!n) return; if (n === "و") { pre = "و"; return; } H.push(pre + n); Hd.push((pre ? "و" : "") + w); Hx.push(x); pre = ""; });
  // ── تكرار الكلمة عدة مرات: يؤخذ آخر نطق ويُحكم عليه (مع تسجيل التكرار)
  { const H2 = [], D2 = [], F2 = [], X2 = []; for (let j = 0; j < H.length; j++) {
      const nx = H[j + 1]; // لا يُدمج إن كان النص نفسه فيه الكلمة مكررة متتالية
      const inRef = nx != null && R.some((r, i) => i + 1 < R.length && sameTry(r, H[j]) && sameTry(R[i + 1], nx) && sameTry(r, R[i + 1]));
      if (nx != null && sameTry(H[j], nx) && !inRef) { F2.rep = true; continue; }
      H2.push(H[j]); D2.push(Hd[j]); X2.push(Hx[j]); F2.push(!!F2.rep); F2.rep = false; }
    H.length = 0; Hd.length = 0; Hx.length = 0; H.push(...H2); Hd.push(...D2); Hx.push(...X2); var REP = F2; }
  const n = R.length, m = H.length;
  const st = Array(n).fill("n"); const hd = {}; const hm = {}; let ins = 0;
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
    if (o.k === "m") { st[o.i] = (pend && o.i === lastI + 1) || REP[o.j] ? "r" : "o"; hm[o.i] = Hx[o.j]; pend = false; lastI = o.i; }
    else if (o.k === "s") { st[o.i] = "s"; hd[o.i] = Hd[o.j]; hm[o.i] = Hx[o.j]; lastI = o.i; }
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
  return { st: st.join(""), hd, ins, pos: lastI, hm };
}

// ══════════ التوقيت (من أزمنة الكلمات في التسجيل): التردد ومراعاة الوقف عند علامات الترقيم ══════════
// tw: [[بداية، نهاية], …] بترتيب كلمات النص المسموع. التردد: سكتة طويلة داخل الجملة قبل كلمة.
// إهمال الوقف: وصل نهاية الجملة (. ؟ ! ؛ :) بما بعدها دون أي سكتة. لا يُخصمان من الدقة؛ يظهران في التشخيص.
const ENDP = /[.؟?!؛;:]$/, ANYP = /[.؟?!؛;:،,]$/;
export function rdTiming(ref, A, tw) {
  const hes = [], pun = []; if (!tw || !tw.length || !A || !A.hm) return { hes, pun };
  for (let i = 1; i < ref.length; i++) { const a = A.hm[i - 1], b = A.hm[i]; if (a == null || b == null || !tw[a] || !tw[b] || b <= a) continue;
    const gap = tw[b][0] - tw[a][1];
    if (!ANYP.test(ref[i - 1].d) && gap >= 1.8) hes.push(i);
    if (ENDP.test(ref[i - 1].d) && gap < 0.08) pun.push(i - 1); }
  return { hes, pun };
}

// المقاييس من حالة الكلمات
export function rdMetrics(stStr, ins = 0, dur = 0, target = 100, auto = false) {
  const st = String(stStr || ""); const n = st.length; const c = { o: 0, d: 0, s: 0, t: 0, r: 0, n: 0 };
  for (const ch of st) c[ch] = (c[ch] || 0) + 1;
  const att = n - c.n; const correct = c.o + c.r; const insRaw = +ins || 0;
  // الكلمات المضافة: في التقييم الآلي قد يكرّر متعرّف الصوت (خصوصاً في أندرويد) ما سمعه فتتضخم الإضافات؛
  // إن تجاوزت نصف المقروء فهي خلل تقني لا خطأ قراءة فلا تُحتسب، وفي كل الأحوال لا تخصم أكثر من ٢٠٪ من الدقة
  const dup = auto && att > 0 && insRaw > att * 0.5; ins = dup ? 0 : Math.min(insRaw, Math.ceil(att * 0.2));
  const errs = c.d + c.s + c.t + ins;
  const acc = att ? Math.max(0, (att - errs) / att * 100) : 0;
  const comp = n ? att / n * 100 : 0;
  const wcpm = dur >= 3 ? correct / (dur / 60) : 0;
  const flu = Math.min(100, target ? wcpm / target * 100 : 0);
  let score = att ? Math.round(acc * 0.6 + flu * 0.25 + comp * 0.15) : 0;
  let lv = RD_LV.find(x => score >= x.min).k;
  // سقف المستوى حسب الدقة (معيار القراءة: أقل من ٩٠٪ مستوى إحباط، أقل من ٨٠٪ ضعف، أقل من ٦٠٪ ضعف شديد)
  if (acc < 60 && "abm".includes(lv)) lv = "s"; else if (acc < 80 && "ab".includes(lv)) lv = "m"; else if (acc < 90 && lv === "a") lv = "b";
  if (comp < 50 && "ab".includes(lv)) lv = "m"; // لم يُكمل نصف النص
  return { n, c, ins, insRaw, dup: dup ? 1 : 0, att, correct, errs, acc: Math.round(acc), comp: Math.round(comp), wcpm: Math.round(wcpm), flu: Math.round(flu), score, lv, dur: Math.round(dur) };
}

// ── تحليل المهارات من الكلمات الخاطئة
const SUN = "تثدذرزسشصضطظلن";
// أزواج الحروف المتقاربة في المخرج أو الصفة (من مخارج الحروف وصفاتها) — إبدال أحدها بالآخر خطأ نطق
const PAIRS = [["ذ", "ز"], ["ث", "س"], ["ض", "د"], ["ظ", "ز"], ["ض", "ظ"], ["ق", "ك"], ["ح", "ه"], ["ع", "ا"], ["ص", "س"], ["ط", "ت"], ["ق", "ء"], ["غ", "خ"], ["ذ", "ظ"], ["ث", "ذ"], ["ذ", "د"], ["ث", "ت"], ["ق", "غ"], ["ح", "ع"], ["ه", "ء"], ["ظ", "د"], ["ص", "ز"], ["ك", "ج"]];
const MAKH = { "ث": "طرف اللسان بين الأسنان، مهموس", "ذ": "طرف اللسان بين الأسنان، مجهور", "ظ": "طرف اللسان بين الأسنان، مجهور مفخّم", "ز": "طرف اللسان خلف الأسنان (صفير)، مجهور", "س": "طرف اللسان خلف الأسنان (صفير)، مهموس", "ص": "صفيري مفخّم", "ض": "حافة اللسان مع الأضراس، مفخّم", "د": "طرف اللسان مع أصول الثنايا، مرقّق", "ت": "طرف اللسان مع أصول الثنايا، مهموس مرقّق", "ط": "طرف اللسان مع أصول الثنايا، مفخّم", "ق": "أقصى اللسان مع اللهاة", "ك": "أقصى اللسان أسفل من القاف", "غ": "أدنى الحلق، مجهور", "خ": "أدنى الحلق، مهموس", "ح": "وسط الحلق", "ع": "وسط الحلق، مجهور", "ه": "أقصى الحلق، مهموس", "ء": "أقصى الحلق", "ا": "حرف مد من الجوف", "ج": "وسط اللسان مع الحنك" };
export const rdMakh = (a, b) => MAKH[a] && MAKH[b] ? `(${a}): ${MAKH[a]} — (${b}): ${MAKH[b]}` : "";
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
  pf: { t: "حروف العطف والجر المتصلة", tip: "التنبيه إلى الحرف الملتصق بأول الكلمة (و، ف، ب، ك، ل) وقراءته جزءاً منها؛ تلوينه بلون مختلف في التدريب" },
  sf: { t: "الضمائر واللواحق المتصلة", tip: "قراءة الكلمة حتى آخر حرف فيها؛ تدريب على كلمات تنتهي بضمائر متصلة (نا، ها، هم، كم) وتمييز معناها" },
  mr: { t: "بنية الكلمة (الإفراد والجمع، التذكير والتأنيث)", tip: "مقارنة المفرد بالجمع والمذكر بالمؤنث في جداول، وقراءة آخر الكلمة بتأنٍّ لأنه يغيّر المعنى" },
  qb: { t: "ترتيب الحروف (القلب)", tip: "تقطيع الكلمة حرفاً حرفاً بالترتيب ثم دمجها، وتتبع الحروف بالإصبع من اليمين إلى اليسار" },
  gs: { t: "القراءة التخمينية (تخمين الكلمة من شكلها)", tip: "منع التخمين: تهجئة الكلمة غير المألوفة مقطعاً مقطعاً قبل نطقها، وربطها بمعناها في الجملة" },
  pn: { t: "مراعاة علامات الترقيم والوقف", tip: "الوقوف عند النقطة وعلامة الاستفهام والتعجب وقفة واضحة، وسكتة قصيرة عند الفاصلة، مع تلوين علامات الترقيم في النص" },
};
// تصنيف الإبدال وفق قواعد العربية: حرف عطف/جر ملتصق، ضمير متصل، بنية صرفية، مدّ، قلب، تخمين
const PROC = /^(و|ف|ب|ك|ل)/, SUF = /(نا|ها|هما|هم|هن|كما|كم|كن|ني|ه|ك|ي)$/, INFL = /(ات|ون|ين|ان|تان|تين|ه|ا)$/;
export function subKind(n, h) {
  if (!h || n === h) return "";
  if (h.replace(PROC, "") === n || n.replace(PROC, "") === h) return "pf";
  const sufOf = (a, b) => a.length > b.length && a.startsWith(b) && SUF.test(a.slice(b.length)) && a.slice(b.length).match(SUF)[0] === a.slice(b.length);
  if (sufOf(n, h) || sufOf(h, n) || sufOf(n.replace(/ه$/, "ت"), h) || sufOf(h.replace(/ه$/, "ت"), n)) return "sf";
  const st = x => x.replace(INFL, ""); if (st(n).length >= 2 && st(n) === st(h)) return "mr";
  if (n.length === h.length) { const d = [...n].map((c, i) => c !== h[i] ? i : -1).filter(i => i >= 0); if (d.length === 2 && d[1] === d[0] + 1 && n[d[0]] === h[d[1]] && n[d[1]] === h[d[0]]) return "qb"; }
  const ops = charOps(n, h); if (ops.length && ops.every(o => o.k !== "s" && "اوي".includes(o.k === "d" ? o.a : o.b))) return "md";
  if (ops.length === 1 && ops[0].k === "s" && PAIRS.some(([x, y]) => (x === ops[0].a && y === ops[0].b) || (y === ops[0].a && x === ops[0].b))) return "";
  const L = Math.max(n.length, h.length); if (lev(n, h) / L > 0.6) return "gs";
  return "";
}
export function rdSkills(ref, stStr, hd = {}, M = null, tm = null) {
  const st = String(stStr || ""); const S = {}; const add = (k, w, x) => { const o = S[k] = S[k] || { k, n: 0, w: [] }; o.n++; if (w && o.w.length < 8 && !o.w.includes(w)) o.w.push(w); if (x) o.x = [...new Set([...(o.x || []), x])]; };
  ref.forEach((tok, i) => {
    const s = st[i]; if (!"dst".includes(s)) return; const raw = tok.d, n = tok.n, w = raw.replace(/[^ء-ْٰ]/g, "");
    if (s === "t") add("tk", w);
    if (s === "d") add("om", w);
    if (/ّ/.test(raw)) add("sh", w);
    if (/[ً-ٍ]/.test(raw)) add("tn", w);
    const alH = s === "s" && hd[i] ? arNorm(hd[i]) : ""; const stripAl = x => x.replace(/^(و|ف|ب|ك|ل)?(ال|لل)/, "$1");
    if (alH && alH !== n && stripAl(alH) === stripAl(n)) { const base = stripAl(n).replace(/^(و|ف|ب|ك|ل)/, ""); add("lm", w, SUN.includes(base[0] || "") ? "شمسية" : "قمرية"); }
    else if (/^(و|ف|ب|ك)?ال/.test(n) && SUN.includes(n.replace(/^(و|ف|ب|ك)?ال/, "")[0] || "")) add("lm", w);
    if (/[ءأإآؤئ]/.test(raw.replace(DIAC, "").slice(1))) add("hz", w);
    if (n.length >= 7) add("lg", w);
    if (s === "s" && alH && !(alH !== n && stripAl(alH) === stripAl(n))) { const k = subKind(n, alH); if (k === "md") add("md", w); else if (k) add(k, w); }
    else if (s === "s" && !alH && /.[اوي]./.test(n)) add("md", w);
    if (s === "s" && hd[i]) { const h = arNorm(hd[i]); if (h.length === n.length) { for (let k = 0; k < n.length; k++) if (n[k] !== h[k]) { const p = PAIRS.find(([a, b]) => (a === n[k] && b === h[k]) || (b === n[k] && a === h[k])); if (p) add("lt", w, p.join("/")); } } }
  });
  if (M) {
    if (M.att >= 10 && M.wcpm && M.flu < 70) S.fl = { k: "fl", n: Math.round((100 - M.flu) / 10), w: [] };
    if (M.c.r >= 2) S.rp = { k: "rp", n: M.c.r, w: [] };
    if (M.comp < 80) S.cm = { k: "cm", n: Math.round((100 - M.comp) / 10), w: [] };
  }
  if (tm) { const cl = i => ref[i] ? ref[i].d.replace(/[^ء-ْٰ]/g, "") : "";
    if (tm.hes && tm.hes.length) { const o = S.rp = S.rp || { k: "rp", n: 0, w: [] }; o.n += tm.hes.length; tm.hes.slice(0, 8).forEach(i => o.w.length < 8 && o.w.push(cl(i))); }
    if (tm.pun && tm.pun.length) S.pn = { k: "pn", n: tm.pun.length, w: tm.pun.slice(0, 8).map(cl) }; }
  return Object.values(S).filter(x => x.n).sort((a, b) => b.n - a.n);
}
export const rdSkTitle = s => (s.k === "lt" || s.k === "lm") && s.x ? `${RD_SK[s.k].t} (${s.x.join("، ")})` : (RD_SK[s.k] || {}).t || s.k;
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
  const bare = String(raw).replace(/[،,.؛:!؟?«»"()]/g, ""); const plain = bare.replace(DIAC, "");
  if (/^(و|ف)?ا/.test(plain) && !/^(و|ف)?[أإآ]/.test(plain)) H.push("أولها همزة وصل: تُنطق إذا بدأت بها، وتسقط في النطق إذا وصلتها بما قبلها");
  if (/ة$/.test(plain)) H.push("آخرها تاء مربوطة: تُنطق تاءً في الوصل، وهاءً ساكنة عند الوقف");
  if (/ً/.test(bare)) H.push("عند الوقف عليها يُبدل تنوين الفتح ألفاً");
  else if (/[ٌٍ]/.test(bare)) H.push("عند الوقف عليها يُحذف التنوين ويُسكَّن آخرها");
  if (/^(هذا|هذه|هذان|هذين|ذلك|ذلكم|لكن|لكنّ|أولئك|هؤلاء|الله|إله|الرحمن|طه)$/.test(plain.replace(/^(و|ف|ب|ل|ك)/, ""))) H.push("فيها ألف تُنطق ولا تُكتب");
  if (/^(مائة|مائتان|مائتين|عمرو|أولو|أولي|أولات)$/.test(plain.replace(/^(و|ف|ب|ل|ك)/, ""))) H.push("فيها حرف يُكتب ولا يُنطق");
  if (/وا$/.test(plain) && plain.length > 3) H.push("إن كانت الواو واو الجماعة فالألف بعدها تُكتب ولا تُنطق");
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
          if (o.k === "s") { const mk = rdMakh(showL(o.a, n, o.i), o.b); det.push(`نطقت حرف (${o.b}) بدل حرف (${showL(o.a, n, o.i)})${mk ? ` [${mk}]` : ""}`); }
          else if (o.k === "d") det.push(`أسقطت حرف (${showL(o.a, n, o.i)})${o.i === 0 ? " من أول الكلمة" : o.i === n.length - 1 ? " من آخر الكلمة" : " من وسط الكلمة"}`);
          else det.push(`أضفت حرف (${o.b})${o.i === 0 ? " في أول الكلمة" : o.i >= n.length ? " في آخر الكلمة" : " في وسط الكلمة"}`); }); else if (ops.length) det.push("نطقت كلمة مختلفة عن المكتوبة؛ ركّز على حروفها بالترتيب"); }
      }
      if (h) { const sk = subKind(n, h); const SKT = { pf: "حرف العطف أو الجر المتصل بأول الكلمة", sf: "الضمير أو اللاحقة المتصلة بآخر الكلمة", mr: "بنية الكلمة (إفراد/جمع أو تذكير/تأنيث) فتغيّر المعنى", qb: "ترتيب حرفين متجاورين (قلب)", md: "حرف المدّ (الحركة الطويلة)", gs: "الكلمة كلها — قراءة تخمينية من شكل الكلمة" }; if (sk && SKT[sk]) { if (sk === "pf" || sk === "sf" || sk === "qb") det.length = 0; det.unshift(`نوع الخطأ: ${SKT[sk]}`);
          if (sk === "pf") { const p0 = (n.length > h.length ? n : h).match(PROC)[0]; det.push(n.length > h.length ? `أسقطت (${p0}) من أول الكلمة` : `أضفت (${p0}) إلى أول الكلمة`); }
          if (sk === "sf") { const lg = n.length > h.length ? n : h, sh = n.length > h.length ? h : n; const x = lg.slice(sh.replace(/ه$/, "ت").length === sh.length && lg.startsWith(sh.replace(/ه$/, "ت")) ? sh.length : sh.length).replace(/^ه/, "ة"); det.push(n.length > h.length ? `أسقطت «${x}» من آخر الكلمة` : `أضفت «${x}» إلى آخر الكلمة`); }
          if (sk === "qb") { const k = [...n].findIndex((c, q) => c !== h[q]); det.push(`قدّمت حرف (${n[k + 1]}) على حرف (${n[k]})`); }
        } }
      if (h) { const sa = x => x.replace(/^(و|ف|ب|ك|ل)?(ال|لل)/, "$1"); if (h !== n && sa(h) === sa(n)) { const b0 = sa(n).replace(/^(و|ف|ب|ك|ل)/, "")[0] || ""; const sun = "تثدذرزسشصضطظلن".includes(b0); det.push(sun ? `اللام هنا شمسية (${b0}): تُكتب ولا تُنطق ويُشدّد الحرف بعدها` : `اللام هنا قمرية (${b0}): تُكتب وتُنطق ساكنة`); } }
      out.push({ i, w, k: s, title: "خطأ نطق / إبدال", what: what + (det.length ? ` — ${det.join("، ")}` : ""), hints: wordHints(tok.d, n) });
    }
  });
  return out;
}
// موضع التوقف إن لم يُكمل النص
export function rdStopInfo(ref, stStr) { const st = String(stStr || ""); const i = st.indexOf("n"); if (i < 0 || !/[^n]/.test(st)) return null; if (st.slice(i).replace(/n/g, "")) return null; return { i, w: clean(ref[i] ? ref[i].d : ""), left: st.length - i }; }

// إعادة حساب مقاييس المحاولات المحفوظة بالقاعدة الحالية (تصحيح نتائج قديمة تضخمت فيها «الكلمات المضافة»)
export function rdFixRec(r, refT) { if (!r || !Array.isArray(r.tries)) return r;
  return { ...r, tries: r.tries.map(t => { if (!t || !t.m || !t.st) return t;
    // المحاولات الآلية غير المعتمدة: تُعاد محاذاتها بقواعد المطابقة الحالية من نص ما سُمع
    if (refT && refT.length && t.heard && t.mode === "auto" && !t.rv) { const A = rdAlign(refT, t.heard); const tm = rdTiming(refT, A, t.tw); return { ...t, st: A.st, hd: A.hd, ins: A.ins, hes: tm.hes, pun: tm.pun, m: rdMetrics(A.st, A.ins, t.dur, t.tg || 100, true) }; } const raw = t.m.insRaw != null ? t.m.insRaw : (t.ins || 0); return { ...t, m: rdMetrics(t.st, raw, t.dur, t.tg || 100, !t.rv) }; }) }; }
