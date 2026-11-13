// تحويل تسجيل قراءة الطالب إلى نص (لأجهزة أندرويد التي لا تسمح بالتعرف الفوري مع التسجيل)
// يحتاج متغير بيئة في Vercel: GROQ_API_KEY (مجاني من console.groq.com) أو OPENAI_API_KEY
export const config = { api: { bodyParser: { sizeLimit: "4mb" } } };

export default async function handler(req, res) {
  if (req.method === "GET") return res.status(200).json({ ok: !!(process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY) });
  if (req.method !== "POST") return res.status(405).json({ error: "method" });
  const groq = process.env.GROQ_API_KEY, oai = process.env.OPENAI_API_KEY;
  if (!groq && !oai) return res.status(200).json({ error: "nokey" });
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const d = String(body.audio || ""); const i = d.indexOf(",");
    if (!d.startsWith("data:") || i < 0) return res.status(400).json({ error: "audio" });
    const mime = d.slice(5, d.indexOf(";")) || "audio/webm";
    const ext = /mp4|m4a|aac/.test(mime) ? "m4a" : /ogg/.test(mime) ? "ogg" : /wav/.test(mime) ? "wav" : "webm";
    const buf = Buffer.from(d.slice(i + 1), "base64");
    if (buf.length > 3.5e6) return res.status(413).json({ error: "big" });
    const fd = new FormData();
    fd.append("file", new Blob([buf], { type: mime.split(";")[0] }), "read." + ext);
    fd.append("model", groq ? "whisper-large-v3" : "whisper-1");
    fd.append("language", "ar"); fd.append("response_format", "verbose_json"); fd.append("timestamp_granularities[]", "word"); fd.append("temperature", "0");
    const url = groq ? "https://api.groq.com/openai/v1/audio/transcriptions" : "https://api.openai.com/v1/audio/transcriptions";
    const r = await fetch(url, { method: "POST", headers: { Authorization: "Bearer " + (groq || oai) }, body: fd });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) return res.status(200).json({ error: (j.error && j.error.message) || ("http " + r.status) });
    // أزمنة الكلمات (لقياس التردد والوقف عند علامات الترقيم)
    const words = Array.isArray(j.words) ? j.words.map(w => ({ w: String(w.word || "").replace(/\s+/g, ""), s: Math.round((+w.start || 0) * 100) / 100, e: Math.round((+w.end || 0) * 100) / 100 })).filter(w => w.w) : [];
    return res.status(200).json({ text: String(j.text || "").trim(), words });
  } catch (e) { return res.status(200).json({ error: String(e && e.message || e) }); }
}
