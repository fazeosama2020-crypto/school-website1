// api/send-sms.js — Vercel Serverless Function
// ضعه في مجلد: api/send-sms.js

export default async function handler(req, res) {
  // السماح بـ CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { apiKey: clientApiKey, numbers, message, sender } = req.body;

  // استخدم API Key من المتغيرات البيئية إذا لم يُرسَل من العميل
  const apiKey = clientApiKey || process.env.VITE_SMS_API_KEY;

  if (!apiKey || !numbers || !message) {
    return res.status(400).json({ error: "بيانات ناقصة" });
  }

  // تنظيف الأرقام
  const cleanNums = numbers
    .split(/[\n,،\s]+/)
    .map(n => n.trim())
    .filter(n => n.length >= 9)
    .map(n => n.startsWith("05") ? "966" + n.slice(1) : n)
    .join(",");

  const isArabic = /[\u0600-\u06FF]/.test(message);

  // محاولة إرسال عبر mobile.net.sa
  const endpoints = [
    {
      url: "https://app.mobile.net.sa/api/v1/sendSMS",
      body: JSON.stringify({
        apiKey,
        numbers: cleanNums,
        message,
        sender: sender || "School",
        msgType: isArabic ? 2 : 0,
      }),
      headers: { "Content-Type": "application/json" },
    },
    {
      url: "https://app.mobile.net.sa/api/v1/send",
      body: JSON.stringify({
        apiKey,
        numbers: cleanNums,
        message,
        sender: sender || "School",
      }),
      headers: { "Content-Type": "application/json" },
    },
    {
      url: `https://app.mobile.net.sa/webservice/?apiKey=${encodeURIComponent(apiKey)}&numbers=${encodeURIComponent(cleanNums)}&message=${encodeURIComponent(message)}&sender=${encodeURIComponent(sender || "School")}`,
      method: "GET",
      headers: {},
    },
  ];

  const results = [];

  for (const ep of endpoints) {
    try {
      const opts = {
        method: ep.method || "POST",
        headers: ep.headers,
      };
      if (ep.body) opts.body = ep.body;

      const r = await fetch(ep.url, opts);
      const text = await r.text();
      let parsed = null;
      try { parsed = JSON.parse(text); } catch {}

      results.push({ url: ep.url, status: r.status, response: text.substring(0, 200) });

      const ok =
        parsed?.success === true ||
        parsed?.code === 0 ||
        parsed?.code === "0" ||
        parsed?.status === "success" ||
        parsed?.status === "sent" ||
        text.trim() === "0" ||
        text.trim() === "00" ||
        (r.status === 200 && text.length < 10 && /^\d+$/.test(text.trim()));

      if (ok) {
        return res.status(200).json({
          success: true,
          message: "تم الإرسال بنجاح",
          response: text,
          endpoint: ep.url,
        });
      }
    } catch (err) {
      results.push({ url: ep.url, error: err.message });
    }
  }

  return res.status(500).json({
    success: false,
    message: "فشل الإرسال — تحقق من صحة API Key",
    attempts: results,
  });
}
