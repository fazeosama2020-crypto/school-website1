// /api/sms.js — Vercel Serverless (Node https — no fetch needed)
const https = require("https");
const http = require("http");

function doRequest(urlStr, method, headers, bodyStr) {
  return new Promise((resolve) => {
    try {
      const u = new URL(urlStr);
      const mod = u.protocol === "https:" ? https : http;
      const opts = {
        hostname: u.hostname,
        path: u.pathname + u.search,
        method,
        headers: { ...headers, "Content-Length": bodyStr ? Buffer.byteLength(bodyStr) : 0 },
      };
      const req = mod.request(opts, (res) => {
        let data = "";
        res.on("data", c => data += c);
        res.on("end", () => resolve({ status: res.statusCode, text: data }));
      });
      req.on("error", (e) => resolve({ status: 0, text: "", error: e.message }));
      if (bodyStr) req.write(bodyStr);
      req.end();
    } catch (e) {
      resolve({ status: 0, text: "", error: e.message });
    }
  });
}

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
      h:{"Content-Type":"application/json"},
      b:JSON.stringify({ username, password, numbers:cleanNums, message, sender:s, msgType:isArabic?2:0 }) },

    { method:"POST", url:"https://app.mobile.net.sa/api/v1/sendSMS",
      h:{"Content-Type":"application/json"},
      b:JSON.stringify({ username, password, mobile:cleanNums, message, sender:s, unicode:isArabic?1:0 }) },

    { method:"POST", url:"https://app.mobile.net.sa/api/v1/sendSMS",
      h:{"Content-Type":"application/x-www-form-urlencoded"},
      b:`username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&numbers=${encodeURIComponent(cleanNums)}&message=${encodeURIComponent(message)}&sender=${encodeURIComponent(s)}` },

    { method:"GET", url:`https://app.mobile.net.sa/api/v1/sendSMS?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&numbers=${encodeURIComponent(cleanNums)}&message=${encodeURIComponent(message)}&sender=${encodeURIComponent(s)}`,
      h:{}, b:null },

    { method:"POST", url:"https://app.mobile.net.sa/api/send",
      h:{"Content-Type":"application/json"},
      b:JSON.stringify({ username, password, numbers:cleanNums, message, sender:s }) },
  ];

  for (let i = 0; i < attempts.length; i++) {
    const a = attempts[i];
    const r = await doRequest(a.url, a.method, a.h, a.b);
    let parsed = null;
    try { parsed = JSON.parse(r.text); } catch {}

    results.push({ n:i+1, url:a.url, http:r.status, raw:(r.text||r.error||"").substring(0,200) });

    const ok = parsed?.success===true || parsed?.code===0 || parsed?.code==="0" ||
               parsed?.status==="success" || r.text.trim()==="0" || r.text.trim()==="00" ||
               (r.status===200 && r.text.length>0 && r.text.length<20 && /^\d+$/.test(r.text.trim()));

    if (ok) {
      return res.status(200).json({ success:true, attempt:i+1, url:a.url, raw:r.text, allAttempts:results });
    }
  }

  return res.status(200).json({ success:false, allAttempts:results, cleanNums, error:"جميع المحاولات فشلت" });
};
