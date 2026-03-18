// api/send-sms.js — Vercel Serverless Function (CommonJS)
module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { apiKey: clientKey, numbers, message, sender } = req.body || {};
  const apiKey = process.env.SMS_API_KEY || clientKey || "";
  const senderName = sender || process.env.SMS_SENDER || "School1";

  if (!apiKey || !numbers || !message) {
    return res.status(400).json({ success: false, message: "بيانات ناقصة" });
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
    { label: "Bearer token", url: "https://app.mobile.net.sa/api/v1/sendSMS", method: "POST", headers: { "Content-Type": "application/json", "Authorization": "Bearer " + apiKey }, body: JSON.stringify({ numbers: cleanNums, message, sender: senderName, msgType: isArabic ? 2 : 0 }) },
    { label: "token in body", url: "https://app.mobile.net.sa/api/v1/sendSMS", method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: apiKey, numbers: cleanNums, message, sender: senderName }) },
    { label: "apiKey in body", url: "https://app.mobile.net.sa/api/v1/sendSMS", method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ apiKey, numbers: cleanNums, message, sender: senderName }) },
    { label: "Token header", url: "https://app.mobile.net.sa/api/v1/sendSMS", method: "POST", headers: { "Content-Type": "application/json", "Authorization": "Token " + apiKey }, body: JSON.stringify({ numbers: cleanNums, message, sender: senderName }) },
    { label: "form token", url: "https://app.mobile.net.sa/api/v1/sendSMS", method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ token: apiKey, numbers: cleanNums, message, sender: senderName }).toString() },
    { label: "GET token", url: "https://app.mobile.net.sa/webservice/?token=" + encodeURIComponent(apiKey) + "&numbers=" + encodeURIComponent(cleanNums) + "&message=" + encodeURIComponent(message) + "&sender=" + encodeURIComponent(senderName), method: "GET", headers: {}, body: null },
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
      const ok = parsed?.success === true || parsed?.code === 0 || parsed?.code === "0" || parsed?.status === "success" || parsed?.status === "sent" || parsed?.result === true || parsed?.message_id || text.trim() === "0" || text.trim() === "00" || (r.status === 200 && text.length < 15 && /^\d+$/.test(text.trim()));
      if (ok) return res.status(200).json({ success: true, message: "تم الإرسال بنجاح", via: attempt.label, response: text });
    } catch (err) {
      results.push({ label: attempt.label, error: err.message });
    }
