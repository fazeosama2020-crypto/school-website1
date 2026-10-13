// إرسال الرسائل النصية عبر «موبايل.نت» — المسار الصحيح الذي يستدعيه الموقع: /api/send-sms
// المفتاح لا يُكتب هنا: يُضاف في Vercel ← Settings ← Environment Variables باسم SMS_API_KEY
// واسم المرسل المعتمد لدى المزوّد باسم SMS_SENDER
const ALLOWED = ["https://school-website1-sigma.vercel.app"]; // لا يُقبل الإرسال إلا من موقع المدرسة

module.exports = async function handler(req, res) {
  const origin = req.headers.origin || "";
  if (ALLOWED.includes(origin)) res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ success: false, message: "Method not allowed" });
  if (!ALLOWED.includes(origin)) return res.status(403).json({ success: false, message: "غير مسموح بالإرسال من خارج موقع المدرسة" });
  try {
    const { numbers, message, sender } = req.body || {};
    const apiKey = process.env.SMS_API_KEY;
    const senderName = process.env.SMS_SENDER || sender || "School1";
    if (!apiKey) return res.status(200).json({ success: false, message: "لم يُضبط مفتاح SMS_API_KEY في إعدادات Vercel" });
    if (!numbers || !message) return res.status(400).json({ success: false, message: "بيانات ناقصة" });
    if (String(message).length > 700) return res.status(400).json({ success: false, message: "الرسالة طويلة جداً" });
    const numList = [...new Set(String(numbers).split(/[\n,،\s]+/).map(n => n.trim().replace(/[٠-٩]/g, d => "٠١٢٣٤٥٦٧٨٩".indexOf(d)).replace(/\D/g, "")).filter(n => n.length >= 9)
      .map(n => n.startsWith("05") ? "966" + n.slice(1) : n.startsWith("5") ? "966" + n : n))].slice(0, 300);
    const results = [];
    for (const number of numList) {
      try {
        const r = await fetch("https://app.mobile.net.sa/api/v1/send", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": "Bearer " + apiKey },
          body: JSON.stringify({ number, senderName, sendAtOption: "NOW", messageBody: message, allow_duplicate: true })
        });
        const text = await r.text();
        results.push({ number, status: r.status, response: text.substring(0, 300) });
      } catch (err) { results.push({ number, error: err.message }); }
    }
    const anySuccess = results.some(r => r.status === 200 || r.status === 201);
    // عند الفشل نُرجع ردّ المزوّد كما هو ليظهر سبب الرفض (اسم المرسل، الرصيد، المفتاح…)
    return res.status(200).json({ success: anySuccess, message: anySuccess ? "تم الإرسال بنجاح" : "فشل الإرسال — " + ((results[0] && (results[0].response || results[0].error)) || ""), sender: senderName, results });
  } catch (err) {
    return res.status(500).json({ success: false, message: "خطأ: " + err.message });
  }
};
