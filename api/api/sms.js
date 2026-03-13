// Vercel Serverless Function — SMS Proxy for mobile.net.sa
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { username, password, numbers, message, sender } = req.body;
  if (!username || !password || !numbers || !message) {
    return res.status(400).json({ success: false, error: "بيانات ناقصة" });
  }

  // تحويل الأرقام 05X → 9665X
  const cleanNums = numbers.split(/[\n,،\s]+/)
    .map(n => n.trim()).filter(n => n.length >= 9)
    .map(n => n.startsWith("05") ? "966" + n.slice(1) : n)
    .join(",");

  const isArabic = /[\u0600-\u06FF]/.test(message);
  const results = [];

  // ===== جرّب كل الـ endpoints المحتملة =====
  const attempts = [
    // 1. JSON v1
    { url: "https://app.mobile.net.sa/api/v1/sendSMS",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, numbers: cleanNums, message, sender: sender||"School1", msgType: isArabic?2:0 }) },

    // 2. JSON v1 unicode field
    { url: "https://app.mobile.net.sa/api/v1/sendSMS",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, mobile: cleanNums, message, sender: sender||"School1", unicode: isArabic?1:0 }) },

    // 3. Form-encoded v1
    { url: "https://app.mobile.net.sa/api/v1/sendSMS",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ username, password, numbers: cleanNums, message, sender: sender||"School1" }).toString() },

    // 4. GET request
    { url: `https://app.mobile.net.sa/api/v1/sendSMS?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&numbers=${encodeURIComponent(cleanNums)}&message=${encodeURIComponent(message)}&sender=${encodeURIComponent(sender||"School1")}`,
      headers: {}, body: null, method: "GET" },

    // 5. webservice endpoint
    { url: "https://app.mobile.net.sa/webservice/",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, numbers: cleanNums, message, sender: sender||"School1" }) },

    // 6. api/send endpoint
    { url: "https://app.mobile.net.sa/api/send",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, numbers: cleanNums, message, sender: sender||"School1", msgType: isArabic?2:0 }) },

    // 7. mobile.net.sa root (no app.)
    { url: "https://mobile.net.sa/api/v1/sendSMS",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, numbers: cleanNums, message, sender: sender||"School1" }) },
  ];

  let firstSuccess = null;
  for (let i = 0; i < attempts.length; i++) {
    const a = attempts[i];
    try {
      const r = await fetch(a.url, {
        method: a.method || "POST",
        headers: a.headers,
        body: a.body || undefined,
      });
      const text = await r.text();
      let parsed = null;
      try { parsed = JSON.parse(text); } catch {}

      const entry = { attempt: i+1, url: a.url, httpStatus: r.status, raw: text.substring(0,300), parsed };
      results.push(entry);

      // كشف النجاح
      const success =
        (parsed?.success === true) || (parsed?.code === 0) || (parsed?.code === "0") ||
        (parsed?.status === "success") || (text.trim() === "0") ||
        (r.status === 200 && text.length > 0 && !text.toLowerCase().includes("error") &&
         !text.toLowerCase().includes("invalid") && !text.toLowerCase().includes("not found") &&
         !text.toLowerCase().includes("404"));

      if (success && r.status < 400 && !firstSuccess) {
        firstSuccess = entry;
      }
    } catch (e) {
      results.push({ attempt: i+1, url: a.url, error: e.message });
    }
  }

  // إذا نجح أي محاولة
  if (firstSuccess) {
    return res.status(200).json({
      success: true,
      winningAttempt: firstSuccess.attempt,
      winningUrl: firstSuccess.url,
      rawResponse: firstSuccess.raw,
      allAttempts: results,
    });
  }

  // كل المحاولات فشلت — أعد التفاصيل للتشخيص
  return res.status(200).json({
    success: false,
    error: "جميع المحاولات فشلت — راجع allAttempts للتفاصيل",
    allAttempts: results,
    cleanNumbersSent: cleanNums,
  });
}
