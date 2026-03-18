// api/send-sms.js — Vercel Serverless Function
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { username: clientUser, password: clientPass, numbers, message, sender } = req.body;
  const username = clientUser || process.env.VITE_SMS_USER || "966548454776";
  const password = clientPass || process.env.VITE_SMS_PASS;
  const senderName = sender || process.env.VITE_SMS_SENDER || "School1";

  if (!password || !numbers || !message) {
    return res.status(400).json({ success: false, message: "بيانات ناقصة — تأكد من كلمة المرور" });
  }

  const cleanNums = numbers
    .split(/[\n,،\s]+/)
    .map(n => n.trim())
    .filter(n => n.length >= 9)
    .map(n => n.startsWith("05") ? "966" + n.slice(1) : n.startsWith("5") ? "966" + n : n)
    .join(",");

  const isArabic = /[\u0600-\u06FF]/.test(message);
  const results = [];

  const attempts = [
    // صيغة 1: JSON username+password
    {
      label: "POST JSON username+password",
      url: "https://app.mobile.net.sa/api/v1/sendSMS",
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, numbers: cleanNums, message, sender: senderName, msgType: isArabic ? 2 : 0 }),
    },
    // صيغة 2: JSON مع mobile بدل username
    {
      label: "POST JSON mobile+password",
      url: "https://app.mobile.net.sa/api/v1/sendSMS",
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mobile: username, password, numbers: cleanNums, message, sender: senderName }),
    },
    // صيغة 3: form-encoded
    {
      label: "POST form username+password",
      url: "https://app.mobile.net.sa/api/v1/sendSMS",
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ username, password, numbers: cleanNums, message, sender: senderName }).toString(),
    },
    // صيغة 4: GET webservice
    {
      label: "GET webservice username+password",
      url: `https://app.mobile.net.sa/webservice/?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&numbers=${encodeURIComponent(cleanNums)}&message=${encodeURIComponent(message)}&sender=${encodeURIComponent(senderName)}`,
      method: "GET",
      headers: {},
      body: null,
    },
    // صيغة 5: /api/v1/send
    {
      label: "POST /api/v1/send username+password",
      url: "https://app.mobile.net.sa/api/v1/send",
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, numbers: cleanNums, message, sender: senderName }),
    },
    // صيغة 6: Basic Auth
    {
      label: "POST Basic Auth",
      url: "https://app.mobile.net.sa/api/v1/sendSMS",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Basic " + Buffer.from(`${username}:${password}`).toString("base64"),
      },
      body: JSON.stringify({ numbers: cleanNums, message, sender: senderName }),
    },
    // صيغة 7: phone بدل username
    {
      label: "POST JSON phone+password",
      url: "https://app.mobile.net.sa/api/v1/sendSMS",
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: username, password, numbers: cleanNums, message, sender: senderName }),
    },
    // صيغة 8: /api/send
    {
      label: "POST /api/send",
      url: "https://app.mobile.net.sa/api/send",
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, numbers: cleanNums, message, sender: senderName }),
    },
  ];

  for (const attempt of attempts) {
    try {
      const opts = { method: attempt.method, headers: attempt.headers };
      if (attempt.body) opts.body = attempt.body;
      const r = await fetch(attempt.url, opts);
      const text = await r.text();
      let parsed = null;
      try { parsed = JSON.parse(text); } catch {}
      results.push({ label: attempt.label, status: r.status, response: text.substring(0, 300) });
      const ok =
        parsed?.success === true || parsed?.code === 0 || parsed?.code === "0" ||
        parsed?.status === "success" || parsed?.status === "sent" ||
        parsed?.result === true ||
        text.trim() === "0" || text.trim() === "00" ||
        (r.status === 200 && text.length < 15 && /^\d+$/.test(text.trim()));
      if (ok) return res.status(200).json({ success: true, message: "✅ تم الإرسال بنجاح", via: attempt.label, response: text });
    } catch (err) {
      results.push({ label: attempt.label, error: err.message });
    }
  }

  return res.status(500).json({ success: false, message: "فشل الإرسال", attempts: results });
}
