// /api/sms.js — Vercel Serverless Function
module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { username, password, numbers, message, sender } = req.body || {};
  if (!username || !password || !numbers || !message) {
    return res.status(400).json({ success: false, error: "بيانات ناقصة" });
  }

  const cleanNums = String(numbers)
    .split(/[\n,،\s]+/)
    .map(n => n.trim()).filter(n => n.length >= 9)
    .map(n => n.startsWith("05") ? "966" + n.slice(1) : n)
    .join(",");

  const isArabic = /[\u0600-\u06FF]/.test(message);
  const s = sender || "School1";
  const results = [];

  const attempts = [
    { method:"POST", url:"https://app.mobile.net.sa/api/v1/sendSMS",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({ username, password, numbers:cleanNums, message, sender:s, msgType:isArabic?2:0 }) },

    { method:"POST", url:"https://app.mobile.net.sa/api/v1/sendSMS",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({ username, password, mobile:cleanNums, message, sender:s, unicode:isArabic?1:0 }) },

    { method:"POST", url:"https://app.mobile.net.sa/api/v1/sendSMS",
      headers:{"Content-Type":"application/x-www-form-urlencoded"},
      body:`username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&numbers=${encodeURIComponent(cleanNums)}&message=${encodeURIComponent(message)}&sender=${encodeURIComponent(s)}` },

    { method:"GET", url:`https://app.mobile.net.sa/api/v1/sendSMS?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&numbers=${encodeURIComponent(cleanNums)}&message=${encodeURIComponent(message)}&sender=${encodeURIComponent(s)}`,
      headers:{}, body:null },

    { method:"POST", url:"https://app.mobile.net.sa/api/send",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({ username, password, numbers:cleanNums, message, sender:s }) },
  ];

  for (let i = 0; i < attempts.length; i++) {
    const a = attempts[i];
    try {
      const opts = { method: a.method, headers: a.headers };
      if (a.body) opts.body = a.body;
      const r = await fetch(a.url, opts);
      const text = await r.text();
      let parsed = null;
      try { parsed = JSON.parse(text); } catch {}

      results.push({ n:i+1, url:a.url, http:r.status, raw:(text||"").substring(0,200) });

      const ok = parsed?.success===true || parsed?.code===0 || parsed?.code==="0" ||
                 parsed?.status==="success" || text.trim()==="0" || text.trim()==="00" ||
                 (r.status===200 && text.length>0 && text.length<20 && /^\d+$/.test(text.trim()));

      if (ok) {
        return res.status(200).json({ success:true, attempt:i+1, url:a.url, raw:text, allAttempts:results });
      }
    } catch(e) {
      results.push({ n:i+1, url:a.url, http:0, raw:"خطأ: " + e.message });
    }
  }

  return res.status(200).json({ success:false, allAttempts:results, cleanNums, error:"جميع المحاولات فشلت" });
};
