// Vercel Serverless Function — SMS Proxy for mobile.net.sa
// الملف يجب أن يكون في مجلد /api/ في جذر المشروع
// مساره: /api/sms.js

export default async function handler(req, res) {
  // السماح بـ CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { username, password, numbers, message, sender } = req.body;

  if (!username || !password || !numbers || !message) {
    return res.status(400).json({ success: false, error: "بيانات ناقصة" });
  }

  try {
    const response = await fetch("https://app.mobile.net.sa/api/v1/sendSMS", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        password,
        numbers,
        message,
        sender: sender || "School1",
        msgType: 0,     // 0 = عربي/English, 1 = Unicode
        sendTime: "",   // فارغ = إرسال فوري
      }),
    });

    const text = await response.text();

    // بعض خوادم SMS ترجع JSON وبعضها نص
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      // إذا كان الرد نصاً مثل "0" (نجاح) أو رمز خطأ
      data = { rawResponse: text };
      // 0 أو 200 = نجاح في معظم بوابات SMS السعودية
      if (text.trim() === "0" || text.includes("success") || text.includes("SUCCESS")) {
        data.success = true;
      }
    }

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
