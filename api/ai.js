// «درسي الذكي» — وسيط الذكاء الاصطناعي: المسار الذي يستدعيه الموقع /api/ai
// • المفتاح لا يُكتب هنا ولا يصل إلى المتصفح: يُضاف في Vercel ← Settings ← Environment Variables باسم ANTHROPIC_API_KEY
// • لا يُقبل الطلب إلا من موقع المدرسة، ومن معلم/موظف مسجّل في المنصة (بصمة رقم السجل المدني)
// • حدّ يومي لكل معلم وسقف شهري للمدرسة يضبطهما المدير من صفحة «درسي الذكي – الإدارة»   school/school-sl-cfg
// • عدّاد الاستخدام: school/school-sl-use/{يوم}/{معلم} ، school/school-sl-usem/{شهر} ، والسجل school/school-sl-log/{يوم}
const ALLOWED = ["https://school-website1-sigma.vercel.app"];
const FB = "https://school-faza-default-rtdb.firebaseio.com/school";
const MODELS = (process.env.AI_MODEL ? [process.env.AI_MODEL] : []).concat(["claude-sonnet-5-5", "claude-sonnet-4-5"]);
const SYSTEM = "أنت خبير مناهج وطرق تدريس في المملكة العربية السعودية، ملمّ بوثائق مناهج وزارة التعليم وإطار معايير مجالات التعلم وتصنيف بلوم المعدّل ومهارات التفكير العليا واختبارات نافس. تكتب بعربية فصيحة دقيقة موجزة، وتلتزم بالمحتوى العلمي للدرس كما في الكتاب المدرسي، وتربط بالحياة من البيئة السعودية والقيم الإسلامية ورؤية المملكة ٢٠٣٠ دون تكلّف. تُخرج JSON صالحًا فقط عند طلبه.";

const fbGet = async p => { try { const r = await fetch(`${FB}/${p}.json`); return await r.json(); } catch { return null; } };
const fbPatch = async o => { try { await fetch(`${FB}.json`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(o) }); } catch {} };
const vals = v => (v && typeof v === "object" ? Object.values(v) : []);
const ksa = () => new Date(Date.now() + 3 * 3600e3).toISOString(); // توقيت الرياض

module.exports = async function handler(req, res) {
  const origin = req.headers.origin || "";
  if (ALLOWED.includes(origin)) res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ ok: false, msg: "Method not allowed" });
  if (!ALLOWED.includes(origin)) return res.status(403).json({ ok: false, msg: "غير مسموح من خارج موقع المدرسة" });
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(200).json({ ok: false, code: "nokey", msg: "لم يُضبط مفتاح الذكاء الاصطناعي ANTHROPIC_API_KEY في إعدادات Vercel" });
  try {
    const b = req.body || {};
    const hash = String(b.hash || "").slice(0, 80);
    if (!/^[0-9a-f]{20,}$/i.test(hash)) return res.status(401).json({ ok: false, msg: "سجّل الدخول من بوابة المعلمين أولًا" });
    // ① التحقق من أن المستخدم من منسوبي المدرسة
    const [staff, lic, cfg] = await Promise.all([fbGet("school-staff2"), fbGet("school-license2"), fbGet("school-sl-cfg")]);
    const who = vals(staff).find(x => x && x.idHash === hash) || vals(lic).find(x => x && x.idHash === hash);
    if (!who) return res.status(401).json({ ok: false, msg: "الحساب غير مسجّل في المدرسة" });
    const C = cfg || {};
    if (C.off) return res.status(200).json({ ok: false, code: "off", msg: "أوقفت الإدارة خدمة الذكاء الاصطناعي مؤقتًا" });
    const daily = +C.daily > 0 ? +C.daily : 8, monthly = +C.monthly > 0 ? +C.monthly : 600;
    const now = ksa(), day = now.slice(0, 10), mon = now.slice(0, 7), hk = hash.slice(0, 16);
    if (b.kind === "ping") { const [u, m] = await Promise.all([fbGet(`school-sl-use/${day}/${hk}`), fbGet(`school-sl-usem/${mon}`)]); return res.status(200).json({ ok: true, name: who.name, left: Math.max(0, daily - (+u || 0)), daily, mUsed: +m || 0, monthly }); }
    // ② الحدود
    const [used, mUsed] = await Promise.all([fbGet(`school-sl-use/${day}/${hk}`), fbGet(`school-sl-usem/${mon}`)]);
    if ((+used || 0) >= daily) return res.status(200).json({ ok: false, code: "daily", msg: `استنفدت حدّك اليومي (${daily} تحليلات) — يتجدد غدًا. يمكنك الاستفادة من بنك الدروس دون حدود.` });
    if ((+mUsed || 0) >= monthly) return res.status(200).json({ ok: false, code: "monthly", msg: "بلغت المدرسة السقف الشهري للتحليلات — راجع الإدارة" });
    // ③ تجهيز الطلب
    const prompt = String(b.prompt || "").slice(0, 16000);
    if (prompt.length < 20) return res.status(400).json({ ok: false, msg: "طلب ناقص" });
    const imgs = (Array.isArray(b.images) ? b.images : []).filter(d => typeof d === "string" && /^data:image\/(jpeg|png|webp);base64,/.test(d)).slice(0, 4);
    const content = [...imgs.map(d => ({ type: "image", source: { type: "base64", media_type: d.slice(5, d.indexOf(";")), data: d.slice(d.indexOf(",") + 1) } })), { type: "text", text: prompt }];
    await fbPatch({ [`school-sl-use/${day}/${hk}`]: { ".sv": { increment: 1 } }, [`school-sl-usem/${mon}`]: { ".sv": { increment: 1 } } });
    // ④ الاتصال مع البث التدريجي للنص (يرى المعلم التقدّم ولا تنتهي مهلة الخادم)
    let r = null, model = "", err = "";
    for (const m of MODELS) {
      r = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" }, body: JSON.stringify({ model: m, max_tokens: Math.min(+b.max || 7000, 9000), system: SYSTEM, stream: true, messages: [{ role: "user", content }] }) });
      if (r.ok) { model = m; break; }
      err = await r.text(); if (!/not_found|model/i.test(err)) break;
    }
    if (!model) { await fbPatch({ [`school-sl-use/${day}/${hk}`]: { ".sv": { increment: -1 } }, [`school-sl-usem/${mon}`]: { ".sv": { increment: -1 } } }); let m = err; try { m = JSON.parse(err).error.message; } catch {} return res.status(200).json({ ok: false, msg: "تعذّر الاتصال بالذكاء الاصطناعي: " + String(m).slice(0, 300) }); }
    res.setHeader("Content-Type", "text/plain; charset=utf-8"); res.setHeader("Cache-Control", "no-cache"); res.setHeader("X-Accel-Buffering", "no");
    res.status(200);
    const dec = new TextDecoder(); let buf = "", tin = 0, tout = 0;
    for await (const chunk of r.body) {
      buf += dec.decode(chunk, { stream: true }); let i;
      while ((i = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
        if (!line.startsWith("data:")) continue;
        let ev; try { ev = JSON.parse(line.slice(5)); } catch { continue; }
        if (ev.type === "content_block_delta" && ev.delta && ev.delta.text) res.write(ev.delta.text);
        else if (ev.type === "message_start" && ev.message && ev.message.usage) tin = ev.message.usage.input_tokens || 0;
        else if (ev.type === "message_delta" && ev.usage) tout = ev.usage.output_tokens || 0;
      }
    }
    const lk = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    await fbPatch({ [`school-sl-log/${day}/${lk}`]: { n: who.name || "", h: hk, at: now.slice(11, 16), k: String(b.tag || "").slice(0, 120), m: model, i: tin, o: tout, im: imgs.length } });
    res.end();
  } catch (e) {
    try { if (!res.headersSent) return res.status(500).json({ ok: false, msg: "خطأ: " + e.message }); res.end(); } catch {}
  }
};
