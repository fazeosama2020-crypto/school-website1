// ══════════════════════════════════════════════════════════════════
// 📖 مختبر القراءة الجهرية — يقرأ الطالب النص بصوته، فيسجّل الموقع ويقيّم ويُظهر الأخطاء والمستوى
// • الطالب: الدخول برقم الهوية ← اختيار النص ← الاستماع لقراءة المعلم ← القراءة والتسجيل ← النتيجة والأخطاء والتدريب والإعادة
// • المعلم: إضافة النصوص وتسجيل القراءة النموذجية • نتائج فصوله • مراجعة التقييم واعتماده • التقييم الحضوري • قائمة الضعف
// • المدير: لوحة المدرسة • المستويات حسب الصف والفصل • المهارات الأضعف • قائمة الطلاب المحتاجين للمعالجة
// قاعدة البيانات: school-rd-txt/{tid} • school-rd-taud/{tid} • school-rd-res/{tid}/{ck_sid} • school-rd-aud/{tid}/{ck_sid}/{tryId}
// ══════════════════════════════════════════════════════════════════
import React, { useState, useEffect, useRef, useMemo } from "react";
import { RD_LV, rdLvOf, RD_TARGET, RD_ST, RD_CYCLE, rdTokens, rdAlign, rdMetrics, rdSkills, rdSkTitle, rdSkTip, rdNeeds, rdFmtDur, arNorm, rdExplain, rdStopInfo, rdFixRec } from "./rdEngine.js";

const N = { TXT: "school-rd-txt", TAUD: "school-rd-taud", RES: "school-rd-res", AUD: "school-rd-aud" };
const STU_LS = "rd-stu-v1";
const ar = n => String(n ?? "").replace(/\d/g, x => "٠١٢٣٤٥٦٧٨٩"[x]);
const esc = t => String(t ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const obj = v => (v && typeof v === "object" ? v : {});
const arr = v => Array.isArray(v) ? v.filter(Boolean) : (v && typeof v === "object" ? Object.values(v).filter(Boolean) : []);
const skOf = s => `${s.ck}_${String(s.id || s.sid).replace(/[.#$[\]/]/g, "")}`;
const dateAr = t => { try { return new Date(t).toLocaleDateString("ar-SA-u-ca-islamic-umalqura-nu-arab", { day: "numeric", month: "short" }); } catch { return ""; } };
const NAVY = "#0b2545", GOLD = "#c9a227";
const SR = typeof window !== "undefined" ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;
const canRec = () => typeof window !== "undefined" && !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Cairo:wght@500;700;800;900&display=swap');
.rl{font-family:Cairo,Tahoma,sans-serif;direction:rtl;color:#0f172a}
.rl *{box-sizing:border-box}
.rl-card{background:#fff;border:1px solid #e2e8f0;border-radius:20px;padding:16px;box-shadow:0 10px 28px -22px rgba(11,37,69,.45)}
.rl-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:10px 16px;border-radius:12px;border:1px solid #e2e8f0;background:#fff;font-family:inherit;font-weight:800;font-size:14px;color:#334155;cursor:pointer;transition:all .15s;white-space:nowrap}
.rl-btn:hover{transform:translateY(-1px);box-shadow:0 8px 16px -10px rgba(15,23,42,.45)}
.rl-btn:disabled{opacity:.45;cursor:not-allowed;transform:none;box-shadow:none}
.rl-btn.p{background:linear-gradient(135deg,${NAVY},#1e3a8a);color:#fff;border-color:transparent}
.rl-btn.g{background:linear-gradient(135deg,${GOLD},#a16207);color:#fff;border-color:transparent}
.rl-btn.ok{background:linear-gradient(135deg,#16a34a,#15803d);color:#fff;border-color:transparent}
.rl-btn.red{background:#fff5f5;color:#dc2626;border-color:#fecaca}
.rl-btn.sm{padding:6px 11px;font-size:12.5px;border-radius:10px}
.rl-inp{width:100%;min-height:42px;border-radius:12px;border:1.5px solid #e2e8f0;background:#f8fafc;padding:8px 12px;font-family:inherit;font-size:14px;font-weight:700;outline:none;color:#0f172a}
.rl-inp:focus{border-color:${GOLD};background:#fff;box-shadow:0 0 0 3px rgba(201,162,39,.18)}
.rl-tabs{display:flex;gap:6px;flex-wrap:wrap;padding:6px;background:#eef2f7;border-radius:16px}
.rl-tab{flex:1;min-width:120px;padding:10px 12px;border-radius:12px;border:none;background:transparent;font-family:inherit;font-weight:900;font-size:13.5px;color:#475569;cursor:pointer}
.rl-tab.on{background:#fff;color:${NAVY};box-shadow:0 6px 16px -10px rgba(15,23,42,.5)}
.rl-hero{background:linear-gradient(135deg,${NAVY},#13315c 60%,#1e3a8a);color:#fff;border-radius:22px;padding:18px;position:relative;overflow:hidden}
.rl-hero::after{content:"";position:absolute;inset:auto -40px -60px auto;width:180px;height:180px;border-radius:50%;background:radial-gradient(circle,rgba(201,162,39,.45),transparent 70%)}
.rl-text{font-family:Amiri,'Noto Naskh Arabic',serif;font-size:27px;line-height:2.25;display:flex;flex-wrap:wrap;gap:2px 9px;padding:16px 18px;background:#fffdf5;border:2px solid #f1e3b0;border-radius:18px}
.rl-w{border-radius:8px;padding:0 4px;position:relative;transition:background .2s,color .2s;cursor:default}
.rl-w.tap{cursor:pointer}.rl-w.tap:hover{outline:2px dashed ${GOLD}}
.rl-w.cur{box-shadow:inset 0 -3px 0 ${GOLD}}
.rl-w.live{background:#dcfce7;color:#166534}
.rl-w.play{background:#fde68a!important;color:#0b2545!important;box-shadow:0 0 0 2px #f59e0b;text-decoration:none!important}
.rl-w.sel{outline:3px solid #0b2545;outline-offset:1px}
.rl-err{display:grid;grid-template-columns:34px 1fr auto;gap:10px;align-items:start;padding:10px;border-radius:14px;border:1.5px solid #e2e8f0;background:#fff;cursor:pointer}
.rl-err.on{border-color:#0b2545;box-shadow:0 8px 18px -12px rgba(11,37,69,.6)}
.rl-num{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;font-weight:900;color:#fff;font-size:13px}
.rl-w small{position:absolute;top:-14px;right:0;font-family:Cairo;font-size:10px;font-weight:900;white-space:nowrap;color:#c2410c}
.rl-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px}
.rl-kpi{border-radius:16px;padding:10px;text-align:center;background:#f8fafc;border:1.5px solid #e2e8f0}
.rl-kpi b{display:block;font-size:24px;font-weight:900;color:${NAVY};line-height:1.3}
.rl-kpi small{font-size:12px;font-weight:800;color:#64748b}
.rl-lv{display:inline-flex;align-items:center;gap:4px;border-radius:999px;padding:3px 11px;font-weight:900;font-size:12.5px;white-space:nowrap}
.rl-tbl{width:100%;border-collapse:collapse;font-size:13px}
.rl-tbl th{background:${NAVY};color:#fff;padding:8px 6px;font-weight:800;white-space:nowrap}
.rl-tbl th:first-child{border-radius:0 10px 0 0}.rl-tbl th:last-child{border-radius:10px 0 0 0}
.rl-tbl td{padding:7px 6px;border-bottom:1px solid #eef2f7;text-align:center}
.rl-tbl tr:hover td{background:#fffbeb}
.rl-modal{position:fixed;inset:0;background:rgba(2,6,23,.6);display:flex;align-items:flex-start;justify-content:center;z-index:900;padding:18px 10px;overflow:auto}
.rl-modal>div{background:#f8fafc;border-radius:22px;width:100%;max-width:980px;padding:16px;box-shadow:0 30px 60px -20px rgba(0,0,0,.5)}
.rl-mic{width:120px;height:120px;border-radius:50%;border:none;cursor:pointer;font-size:46px;color:#fff;background:radial-gradient(circle at 35% 30%,#ef4444,#b91c1c);box-shadow:0 0 0 0 rgba(239,68,68,.6);animation:rlP 1.4s infinite}
@keyframes rlP{0%{box-shadow:0 0 0 0 rgba(239,68,68,.55)}70%{box-shadow:0 0 0 22px rgba(239,68,68,0)}100%{box-shadow:0 0 0 0 rgba(239,68,68,0)}}
.rl-stk{display:flex;height:14px;border-radius:9px;overflow:hidden;background:#eef2f7}
.rl-stk i{display:block;height:100%}
.rl-bar{height:10px;border-radius:9px;background:#eef2f7;overflow:hidden}.rl-bar i{display:block;height:100%;border-radius:9px}
.rl-chip{padding:6px 12px;border-radius:999px;border:1.5px solid #e2e8f0;background:#fff;font-family:inherit;font-weight:800;font-size:12.5px;cursor:pointer;color:#475569}
.rl-chip.on{background:${NAVY};border-color:${NAVY};color:#fff}
.rl-note{font-size:12.5px;font-weight:700;color:#64748b;line-height:1.9}
@media(max-width:640px){.rl-text{font-size:22px;padding:12px}.rl-card{padding:12px}}
`;

// ── عناصر مساعدة
const Ring = ({ v, size = 92, c = NAVY, label, sub }) => { const p = Math.max(0, Math.min(100, +v || 0)); return <div style={{ display: "grid", justifyItems: "center", gap: 2 }}>
  <div style={{ width: size, height: size, borderRadius: "50%", background: `conic-gradient(${c} ${p * 3.6}deg,#e8edf3 0)`, display: "grid", placeItems: "center" }}><div style={{ width: size - 16, height: size - 16, borderRadius: "50%", background: "#fff", display: "grid", placeItems: "center", fontWeight: 900, fontSize: size / 4.2, color: c }}>{v == null ? "—" : ar(Math.round(v))}</div></div>
  {label && <b style={{ fontSize: 13 }}>{label}</b>}{sub && <small style={{ fontSize: 11.5, color: "#64748b", fontWeight: 800 }}>{sub}</small>}</div>; };
const LvB = ({ k, big }) => { const L = rdLvOf(k); return <span className="rl-lv" style={{ background: L.bg, color: L.c, fontSize: big ? 15 : 12.5 }}>{L.ic} {L.t}</span>; };
const Wait = ({ t = "جارٍ التحميل…" }) => <div className="rl-card" style={{ textAlign: "center", color: "#94a3b8", fontWeight: 800 }}>⏳ {t}</div>;
const Toast = ({ m }) => m ? <div style={{ position: "fixed", bottom: 18, left: "50%", transform: "translateX(-50%)", background: NAVY, color: "#fff", padding: "10px 18px", borderRadius: 14, fontWeight: 800, zIndex: 999, boxShadow: "0 12px 30px -10px rgba(0,0,0,.5)" }}>{m}</div> : null;
const useToast = () => { const [m, setM] = useState(""); const t = useRef(); return [m, s => { setM(s); clearTimeout(t.current); t.current = setTimeout(() => setM(""), 2600); }]; };

function useRoster(api) {
  const [st, setSt] = useState({ counts: [6, 4, 4], ros: null });
  useEffect(() => { (async () => { const [m, r] = await Promise.all([api.maGet(api.MA_META), api.maGet(api.MA_ROSTER)]); setSt({ counts: m && Array.isArray(m.counts) ? m.counts.map(n => +n || 0) : [6, 4, 4], ros: obj(r) }); })(); }, []);
  const studentsOf = ck => arr(st.ros && st.ros[ck] && st.ros[ck].students).filter(s => s && s.name).map(s => ({ ...s, id: s.id || "n" + api.asmK(s.name), ck }));
  const classes = api.maClasses(st.counts).filter(c => !st.ros || studentsOf(c.ck).length);
  return { classes, studentsOf, ros: st.ros, ready: !!st.ros };
}
const textFor = (t, ck) => t && t.open !== 0 && (arr(t.cls).length ? arr(t.cls).includes(ck) : !t.lv || String(ck).startsWith(t.lv + "-"));

// ── نطق كلمة (المتصفح) — للتصحيح
function speak(w, rate = 0.75) { try { const u = new SpeechSynthesisUtterance(w); u.lang = "ar-SA"; u.rate = rate; const v = speechSynthesis.getVoices().find(v => /^ar/i.test(v.lang)); if (v) u.voice = v; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch {} }

// ── التعرف على الكلام المستمر (يُعاد تشغيله تلقائياً إن توقف المتصفح)
function makeListener(onText, onErr) {
  if (!SR) return null; let run = false, finals = [], rec = null;
  const boot = () => { rec = new SR(); rec.lang = "ar-SA"; rec.continuous = true; rec.interimResults = true; rec.maxAlternatives = 1;
    rec.onresult = e => { let inter = ""; for (let i = e.resultIndex; i < e.results.length; i++) { const r = e.results[i]; if (r.isFinal) { const t = String(r[0].transcript || "").trim(); const L = finals.length ? finals[finals.length - 1] : ""; if (!t) continue; if (L && (t === L || t.startsWith(L + " "))) finals[finals.length - 1] = t; else if (L && L.startsWith(t + " ")) continue; else finals.push(t); } else inter += " " + r[0].transcript; } onText((finals.join(" ") + " " + inter).trim()); };
    rec.onerror = e => { if (e.error === "not-allowed" || e.error === "service-not-allowed" || e.error === "audio-capture") { run = false; onErr && onErr(e.error); } };
    rec.onend = () => { if (run) setTimeout(() => { if (run) try { boot(); } catch {} }, 120); };
    try { rec.start(); } catch {} };
  return { start() { run = true; finals = []; boot(); }, stop() { run = false; try { rec && rec.stop(); } catch {} return finals.join(" "); }, text: () => finals.join(" ") };
}
// ── تسجيل الصوت (يُحفظ ليستمع له المعلم)
async function makeRecorder() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
  const type = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"].find(t => window.MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t)) || "";
  const mr = new MediaRecorder(stream, type ? { mimeType: type, audioBitsPerSecond: 24000 } : undefined); const parts = [];
  mr.ondataavailable = e => e.data && e.data.size && parts.push(e.data); mr.start(1000);
  // قياس مستوى الصوت (لرفض التسجيل الصامت أو المنخفض جداً ولعرض مؤشر الميكروفون)
  let ctx = null, an = null, buf = null, sum = 0, cnt = 0, peak = 0, last = 0, iv = null;
  try { const AC = window.AudioContext || window.webkitAudioContext; ctx = new AC(); an = ctx.createAnalyser(); an.fftSize = 1024; ctx.createMediaStreamSource(stream).connect(an); buf = new Uint8Array(an.fftSize);
    iv = setInterval(() => { an.getByteTimeDomainData(buf); let q = 0; for (let k = 0; k < buf.length; k++) { const v = (buf[k] - 128) / 128; q += v * v; } last = Math.sqrt(q / buf.length); sum += last; cnt++; if (last > peak) peak = last; }, 200); } catch { an = null; }
  const off = () => { clearInterval(iv); try { ctx && ctx.close(); } catch {} };
  return { level: () => last, avg: () => an && cnt ? sum / cnt : null, peak: () => an ? peak : null,
    kill: () => { off(); try { mr.onstop = null; mr.stop(); } catch {} stream.getTracks().forEach(t => t.stop()); },
    stop: () => new Promise(res => { off(); mr.onstop = () => { stream.getTracks().forEach(t => t.stop()); const b = new Blob(parts, { type: mr.mimeType || type || "audio/webm" }); const fr = new FileReader(); fr.onload = () => res(fr.result); fr.onerror = () => res(null); fr.readAsDataURL(b); }; try { mr.stop(); } catch { res(null); } }) };
}

// ── عرض النص بكلمات ملونة حسب الحالة
function Words({ refT, st, hd, live, onWord, size, cur = -1, sel = -1 }) {
  return <div className="rl-text" style={size ? { fontSize: size } : null}>{refT.map((w, i) => { const s = st ? st[i] : null; const S = s && s !== "o" ? RD_ST[s] : null;
    const cls = `rl-w${onWord ? " tap" : ""}${live && live.pos === i ? " cur" : ""}${live && i <= live.pos && live.st[i] === "o" ? " live" : ""}${cur === i ? " play" : ""}${sel === i ? " sel" : ""}`;
    return <span key={i} id={`rlw-${i}`} className={cls} title={S ? S.t + (hd && hd[i] ? ` — سُمِع: ${hd[i]}` : "") : ""} onClick={onWord ? () => onWord(i) : undefined}
      style={S ? { background: S.bg, color: S.c, textDecoration: s === "d" ? "line-through" : s === "n" ? "none" : "underline wavy", textUnderlineOffset: 8 } : null}>
      {S && s !== "n" && <small style={{ color: S.c }}>{s === "s" && hd && hd[i] ? hd[i] : S.t.split(" ")[0]}</small>}{w.d}</span>; })}</div>;
}
// ── تشغيل الصوت مع إضاءة الكلمة المقروءة (تزامن تقريبي بطول الكلمات ووقفات الترقيم)
const wWeights = refT => { const W = refT.map(w => w.n.length + 1.6 + (/[،,؛:]/.test(w.d) ? 3 : /[.!؟?]/.test(w.d) ? 5 : 0)); let c = 0; return W.map(x => (c += x)); };
function TextPlayer({ src, refT, onIdx, title = "🎧 القراءة الصحيحة", sync = true, tone = "#fffbeb", line = "#fde68a" }) {
  const a = useRef(null); const cum = useMemo(() => wWeights(refT), [refT]); const lead = 0.25;
  const tick = () => { const el = a.current; if (!el || !sync || !el.duration || el.paused) return; const t = Math.max(0, el.currentTime - lead) / Math.max(0.5, el.duration - lead * 2); const tot = cum[cum.length - 1]; let i = cum.findIndex(c => c / tot >= t); if (i < 0) i = cum.length - 1; onIdx && onIdx(i); };
  return <div style={{ background: tone, border: `1px solid ${line}`, borderRadius: 14, padding: "8px 10px" }}><b style={{ fontSize: 13.5 }}>{title}</b><audio ref={a} src={src} controls preload="auto" style={{ width: "100%", marginTop: 4 }} onTimeUpdate={tick} onPause={() => onIdx && onIdx(-1)} onEnded={() => onIdx && onIdx(-1)} /></div>;
}
// عند عدم وجود قراءة المعلم: نطق آلي للنص كاملاً مع إضاءة الكلمات
function TtsPlayer({ refT, onIdx }) {
  const [on, setOn] = useState(false); if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const play = () => { try { speechSynthesis.cancel(); const txt = refT.map(w => w.d).join(" "); const starts = []; let c = 0; refT.forEach(w => { starts.push(c); c += w.d.length + 1; });
    const u = new SpeechSynthesisUtterance(txt); u.lang = "ar-SA"; u.rate = 0.82; const v = speechSynthesis.getVoices().find(v => /^ar/i.test(v.lang)); if (v) u.voice = v;
    u.onboundary = e => { let i = starts.findIndex(x => x > e.charIndex) - 1; if (i < -1) i = refT.length - 1; onIdx && onIdx(Math.max(0, i)); };
    u.onend = u.onerror = () => { setOn(false); onIdx && onIdx(-1); }; setOn(true); speechSynthesis.speak(u); } catch { setOn(false); } };
  return <button className="rl-btn" onClick={() => on ? (speechSynthesis.cancel(), setOn(false), onIdx && onIdx(-1)) : play()}>{on ? "⏹ إيقاف" : "🔊 استمع للنص (صوت آلي)"}</button>;
}

function Legend() { return <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{Object.entries(RD_ST).filter(([k]) => k !== "o").map(([k, S]) => <span key={k} className="rl-lv" style={{ background: S.bg, color: S.c }}>{S.t}</span>)}</div>; }

// ── بطاقة النتيجة (للطالب والمعلم)
function ResultCard({ text, tr, refT, onWord, hideWords, maud, saud, staff }) {
  const M = tr.m; const sk = useMemo(() => M ? rdSkills(refT, tr.st, tr.hd, M) : [], [tr]); const needs = useMemo(() => M ? rdNeeds(M, sk) : [], [tr]);
  const errs = useMemo(() => M ? rdExplain(refT, tr.st, tr.hd) : [], [tr]); const stop = useMemo(() => M ? rdStopInfo(refT, tr.st) : null, [tr]);
  const [cur, setCur] = useState(-1); const [sel, setSel] = useState(-1);
  const pick = (i, scrollTo) => { setSel(i); onWord && onWord(i); if (scrollTo) { const el = document.getElementById(scrollTo === "w" ? `rlw-${i}` : `rle-${i}`); el && el.scrollIntoView({ behavior: "smooth", block: "center" }); } };
  if (!M) return <div className="rl-card" style={{ textAlign: "center" }}><div style={{ fontSize: 40 }}>🎧</div><b style={{ fontSize: 16 }}>تم حفظ تسجيل قراءتك</b><div className="rl-note">{tr.why === "silent" ? "لم يتمكن الموقع من تمييز قراءتك آلياً، وسيستمع المعلم لتسجيلك ويعتمد التقييم." : "جهازك لا يدعم التقييم الآلي، وسيستمع المعلم لتسجيلك ويعتمد التقييم قريباً."}</div></div>;
  const L = rdLvOf(M.lv);
  return <div style={{ display: "grid", gap: 12 }}>
    <div className="rl-card" style={{ borderTop: `5px solid ${L.c}` }}>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center", justifyContent: "space-around" }}>
        <Ring v={M.score} c={L.c} size={112} label="الدرجة من ١٠٠" sub={<LvB k={M.lv} />} />
        <Ring v={M.acc} c="#0e7490" label="دقة القراءة ٪" sub={`${ar(M.correct)} من ${ar(M.att)} كلمة`} />
        <Ring v={M.flu} c={GOLD} label="الطلاقة ٪" sub={`${ar(M.wcpm)} كلمة/دقيقة (المستهدف ${ar(tr.tg || 100)})`} />
        <Ring v={M.comp} c="#7c3aed" label="إكمال النص ٪" sub={`الزمن ${ar(rdFmtDur(M.dur))}`} />
      </div>
      <div style={{ marginTop: 10, textAlign: "center", fontWeight: 800, color: L.c }}>{L.d}</div>
      {tr.rv ? <div className="rl-note" style={{ textAlign: "center" }}>✔️ اعتمد التقييم: {tr.rv.by} — {dateAr(tr.rv.at)}</div> : tr.mode === "auto" ? <div className="rl-note" style={{ textAlign: "center" }}>🤖 تقييم آلي أولي — قد يراجعه المعلم ويعدّله</div> : null}
    </div>
    <div className="rl-kpis">
      {[["d", "حذف"], ["s", "إبدال/نطق"], ["t", "ضبط"], ["r", "تكرار"]].map(([k, l]) => <div key={k} className="rl-kpi" style={{ borderColor: RD_ST[k].bg }}><b style={{ color: RD_ST[k].c }}>{ar(M.c[k] || 0)}</b><small>{l}</small></div>)}
      <div className="rl-kpi"><b style={{ color: "#be185d" }}>{ar(M.ins)}</b><small>كلمات مضافة</small></div>{M.dup ? <div className="rl-note" style={{ gridColumn: "1/-1" }}>ℹ️ كرّر الجهاز التقاط بعض الكلمات أثناء التسجيل، فلم تُحتسب الإضافات في الدرجة.</div> : null}
      <div className="rl-kpi"><b style={{ color: "#64748b" }}>{ar(M.c.n || 0)}</b><small>لم تُقرأ</small></div>
    </div>
    {!hideWords && <div className="rl-card" style={{ display: "grid", gap: 10 }}><div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}><b>📝 النص مع أخطائك ملوّنة — اضغط على أي كلمة لسماعها ومعرفة الخطأ</b><Legend /></div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 8 }}>
        {maud ? <TextPlayer src={maud} refT={refT} onIdx={setCur} title="🎧 استمع للقراءة الصحيحة وتابع الكلمات في النص" /> : <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}><TtsPlayer refT={refT} onIdx={setCur} /><span className="rl-note">تُضاء الكلمة المقروءة باللون الأصفر</span></div>}
        {saud && <TextPlayer src={saud} refT={refT} sync={false} title={staff ? "🎙️ تسجيل قراءة الطالب" : "🎙️ استمع لقراءتك وقارنها"} tone="#eff6ff" line="#bfdbfe" />}
      </div>
      <Words refT={refT} st={tr.st} hd={tr.hd} onWord={i => pick(i, errs.some(e => e.i === i) ? "e" : null)} cur={cur} sel={sel} /></div>}
    {!hideWords && (errs.length > 0 || stop) && <div className="rl-card" style={{ display: "grid", gap: 8 }}>
      <b style={{ fontSize: 15.5, color: NAVY }}>🔎 أين الخلل في قراءتك؟ ({ar(errs.length)} {errs.length === 1 ? "خطأ" : "أخطاء"})</b>
      {errs.map((e, n) => { const S = RD_ST[e.k]; return <div key={e.i} id={`rle-${e.i}`} className={`rl-err ${sel === e.i ? "on" : ""}`} onClick={() => pick(e.i, "w")}>
        <span className="rl-num" style={{ background: S.c }}>{ar(n + 1)}</span>
        <div style={{ display: "grid", gap: 3 }}><div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}><span style={{ fontFamily: "Amiri,serif", fontSize: 24, color: S.c, lineHeight: 1.4 }}>{e.w}</span><span className="rl-lv" style={{ background: S.bg, color: S.c }}>{e.title}</span></div>
          <div style={{ fontWeight: 800, fontSize: 14, lineHeight: 1.8 }}>{e.what}</div>
          {e.hints.map((h, k) => <div key={k} style={{ fontSize: 12.5, fontWeight: 700, color: "#475569" }}>💡 {h}</div>)}</div>
        <button className="rl-btn sm" onClick={ev => { ev.stopPropagation(); speak(e.w); setSel(e.i); }}>🔊 النطق</button></div>; })}
      {stop && <div className="rl-err" style={{ cursor: "default", background: "#f8fafc" }}><span className="rl-num" style={{ background: "#94a3b8" }}>⏸</span><div style={{ fontWeight: 800, fontSize: 14, lineHeight: 1.8 }}>توقفت عند كلمة «{stop.w}» ولم تُكمل {ar(stop.left)} كلمة من النص<div style={{ fontSize: 12.5, color: "#475569" }}>💡 أكمل قراءة النص كاملاً في المحاولة القادمة؛ إكمال النص جزء من الدرجة</div></div><span /></div>}
    </div>}
    {!hideWords && M && !errs.length && !stop && <div className="rl-card" style={{ textAlign: "center", fontWeight: 900, color: "#15803d" }}>🌟 قراءة سليمة — لم تُرصد أخطاء في الكلمات</div>}
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 12 }}>
      <div className="rl-card"><b style={{ color: "#b45309" }}>🔍 المهارات التي تحتاج تحسيناً</b>{!sk.length ? <div className="rl-note">لا توجد مهارات ضعيفة واضحة 🌟</div> : <div style={{ display: "grid", gap: 8, marginTop: 8 }}>{sk.slice(0, 6).map(s => <div key={s.k} style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12, padding: "8px 10px" }}><b style={{ fontSize: 13.5 }}>{rdSkTitle(s)}</b> <span className="rl-lv" style={{ background: "#fde68a", color: "#78350f" }}>{ar(s.n)}</span>{s.w.length > 0 && <div style={{ fontFamily: "Amiri,serif", fontSize: 18, color: "#7c2d12" }}>{s.w.join(" • ")}</div>}</div>)}</div>}</div>
      <div className="rl-card"><b style={{ color: "#15803d" }}>🧭 ماذا يحتاج الطالب؟</b><ol style={{ margin: "8px 0 0", paddingInlineStart: 20, display: "grid", gap: 6, fontSize: 13.5, fontWeight: 700, lineHeight: 1.8 }}>{needs.map((x, i) => <li key={i}>{x}</li>)}</ol></div>
    </div>
  </div>;
}

// ── تدريب على الكلمات الخاطئة: استمع ← انطق ← تحقق
function Practice({ refT, tr, onClose }) {
  const L = refT.map((w, i) => ({ ...w, i })).filter(w => "dst".includes(tr.st[w.i])); const [ok, setOk] = useState({}); const [on, setOn] = useState(-1); const lis = useRef(null);
  const tryWord = w => { if (!SR) { alert("جهازك لا يدعم التعرف على الكلام — استمع للكلمة وكررها بصوت مرتفع"); return; } setOn(w.i); let got = "";
    const r = new SR(); r.lang = "ar-SA"; r.interimResults = false; r.maxAlternatives = 3; lis.current = r;
    r.onresult = e => { const alts = [...e.results[0]].map(a => a.transcript); got = alts.join(" | "); const hit = alts.some(a => a.split(/\s+/).some(x => arNorm(x) === w.n || arNorm(x).replace(/ا$/, "") === w.n.replace(/ا$/, ""))); setOk(o => ({ ...o, [w.i]: hit ? 1 : -1 })); };
    r.onend = () => setOn(-1); r.onerror = () => setOn(-1); try { r.start(); } catch { setOn(-1); } };
  return <div className="rl-card"><div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}><b style={{ fontSize: 16, flex: 1 }}>🎯 تدريب على الكلمات الخاطئة ({ar(L.length)})</b><button className="rl-btn sm" onClick={onClose}>إغلاق</button></div>
    {!L.length ? <div className="rl-note">لا توجد كلمات خاطئة 🌟</div> : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(210px,1fr))", gap: 8 }}>{L.map(w => <div key={w.i} style={{ border: `2px solid ${ok[w.i] === 1 ? "#86efac" : ok[w.i] === -1 ? "#fecaca" : "#e2e8f0"}`, borderRadius: 14, padding: 10, background: ok[w.i] === 1 ? "#f0fdf4" : "#fff", display: "grid", gap: 6, justifyItems: "center" }}>
      <div style={{ fontFamily: "Amiri,serif", fontSize: 30 }}>{w.d.replace(/[،,.؛:!؟?]/g, "")}</div>
      <div style={{ display: "flex", gap: 6 }}><button className="rl-btn sm" onClick={() => speak(w.d)}>🔊 استمع</button><button className="rl-btn sm p" disabled={on >= 0} onClick={() => tryWord(w)}>{on === w.i ? "🎙️ تحدّث الآن…" : "🎤 انطقها"}</button></div>
      {ok[w.i] === 1 && <b style={{ color: "#15803d", fontSize: 13 }}>✅ أحسنت! نطق صحيح</b>}{ok[w.i] === -1 && <b style={{ color: "#dc2626", fontSize: 13 }}>↻ حاول مرة أخرى ببطء</b>}
    </div>)}</div>}
    <div className="rl-note" style={{ marginTop: 8 }}>💡 النطق الآلي للكلمة يوضّح الحروف، وقراءة معلمك النموذجية هي المرجع في الضبط والتشكيل.</div>
  </div>;
}

// ══════════ القارئ: الاستماع ← القراءة والتسجيل ← الحفظ ══════════
function Reader({ api, text, me, rec0, onBack, others = [], onOpen }) {
  const refT = useMemo(() => rdTokens(text.body), [text.body]); const tg = +text.tg || RD_TARGET[+String(me.ck)[0]] || 100;
  const [rec, setRec] = useState(rec0); const tries = arr(rec && rec.tries); const valid = tries.filter(t => !t.rej); const left = Math.max(0, (+text.max || 3) - valid.length);
  const [lvl, setLvl] = useState(0); const [audOnly, setAudOnly] = useState(false); const trialR = useRef(false); const heardR = useRef("");
  const [ph, setPh] = useState(tries.length ? "res" : "intro"); const [live, setLive] = useState({ st: "", pos: -1, text: "" }); const [sec, setSec] = useState(0); const [err, setErr] = useState(""); const [cur, setCur] = useState(() => { const v = arr(rec0 && rec0.tries); const ok = v.filter(t => !t.rej); return v.length ? (v[v.length - 1].rej ? v[v.length - 1] : ok[ok.length - 1]) : null; }); const [prac, setPrac] = useState(false);
  const [maud, setMaud] = useState(null); const [myAud, setMyAud] = useState({}); const [icur, setIcur] = useState(-1); const lisR = useRef(null), recR = useRef(null), t0 = useRef(0), tick = useRef(null), auto = useRef(null), auto2 = useRef(null), srOk = useRef(!!SR);
  useEffect(() => { if (text.aud) api.maGet(`${N.TAUD}/${text.id}`).then(v => typeof v === "string" && setMaud(v)); return () => { clearInterval(tick.current); clearTimeout(auto.current); clearTimeout(auto2.current); try { lisR.current && lisR.current.stop(); } catch {} try { recR.current && recR.current.kill(); } catch {} }; }, []);
  const start = async (trial) => {
    trialR.current = !!trial; heardR.current = ""; setErr(""); if (!canRec() && !SR) { setErr("المتصفح لا يدعم التسجيل الصوتي — افتح الرابط في متصفح Chrome أو Safari"); return; }
    const android = /Android/i.test(navigator.userAgent || "");
    try { recR.current = null; if (canRec() && !trial) recR.current = await makeRecorder(); } catch (e) { if (!SR) { setErr("لم يُسمح باستخدام الميكروفون — اسمح للموقع باستخدام الميكروفون ثم أعد المحاولة"); return; } recR.current = null; }
    srOk.current = !!SR;
    const onTxt = txt => { heardR.current = txt; const A = rdAlign(refT, txt); setLive({ st: A.st, pos: A.pos, text: txt }); clearTimeout(auto.current); if (A.pos >= refT.length - 1) auto.current = setTimeout(() => finish(), 2500); };
    lisR.current = makeListener(onTxt, () => { srOk.current = false; });
    lisR.current && lisR.current.start();
    // على بعض أجهزة أندرويد يتعارض التسجيل مع التعرف على الكلام: إذا سُمع صوت الطالب في الميكروفون ولم يلتقط المتعرّف أي كلمة فهو تعارض.
    // الافتراضي: يُحفظ صوت الطالب ويُوقف التقييم الآلي (يستمع المعلم ويقيّم). ويمكن للمعلم اختيار تقديم التقييم الآلي من إعدادات النص.
    setAudOnly(false);
    if (android && SR && recR.current) { const t1 = Date.now(); const chk = () => { if (!recR.current || heardR.current) return; const pk = recR.current.peak(); const el = (Date.now() - t1) / 1000;
        if ((pk != null && pk >= 0.04 && el >= 6) || el >= 14) {
          if (text.aprio === "auto") { try { recR.current.kill(); } catch {} recR.current = null; try { lisR.current && lisR.current.stop(); } catch {} lisR.current = makeListener(onTxt, () => { srOk.current = false; }); lisR.current && lisR.current.start(); }
          else { try { lisR.current && lisR.current.stop(); } catch {} lisR.current = null; srOk.current = false; setAudOnly(true); }
          return; }
        auto2.current = setTimeout(chk, 2000); }; auto2.current = setTimeout(chk, 6000); }
    t0.current = Date.now(); setSec(0); tick.current = setInterval(() => { const s = (Date.now() - t0.current) / 1000; setSec(s); if (recR.current) setLvl(recR.current.level()); if (s > 300) finish(); }, 300); setLive({ st: "", pos: -1, text: "" }); setPh("rec");
  };
  const busy = useRef(false);
  const finish = async () => {
    if (busy.current) return; busy.current = true; clearInterval(tick.current); clearTimeout(auto.current); clearTimeout(auto2.current); setPh("save");
    const dur = (Date.now() - t0.current) / 1000; const heard = lisR.current ? lisR.current.stop() : ""; const avg = recR.current ? recR.current.avg() : null; const peak = recR.current ? recR.current.peak() : null; const aud = recR.current ? await recR.current.stop() : null; recR.current = null;
    // ── رفض التسجيل غير الواضح (لا تُحتسب محاولة): صمت، صوت منخفض جداً، أو كلام غير مميَّز
    const hw = heard.trim().split(/\s+/).filter(Boolean).length; const quiet = avg != null && avg < 0.006 && (peak == null || peak < 0.03); const voice = avg != null && avg >= 0.015;
    let bad = "";
    if (dur < 3) bad = "التسجيل قصير جداً — اقرأ النص ثم اضغط «انتهيت»";
    else if (quiet && hw < 5) bad = "لم يُسمع صوتك — الصوت منخفض جداً أو الميكروفون مغلق";
    else if (srOk.current && hw === 0 && !voice) bad = "لم يُسمع صوتك بوضوح";
    else if (srOk.current && hw > 0 && dur >= 8 && hw / dur < 0.25 && hw < refT.length * 0.4) bad = "التسجيل غير واضح — لم تُميَّز إلا كلمات قليلة";
    if (bad) { busy.current = false; setErr(`🚫 ${bad}. لم تُحتسب محاولة — اجلس في مكان هادئ، قرّب الجهاز من فمك، واقرأ بصوت مرتفع ثم أعد التسجيل.`); setPh("intro"); return; }
    const id = Date.now().toString(36); let tr;
    if (srOk.current && heard.trim()) { const A = rdAlign(refT, heard); const M = rdMetrics(A.st, A.ins, dur, tg, true); tr = { id, at: Date.now(), dur: Math.round(dur), st: A.st, hd: A.hd, ins: A.ins, tg, m: M, sk: rdSkills(refT, A.st, A.hd, M).map(s => s.k), mode: "auto", heard: heard.slice(0, 2500) }; }
    else tr = { id, at: Date.now(), dur: Math.round(dur), st: "n".repeat(refT.length), hd: {}, ins: 0, tg, m: null, mode: "rec", why: SR ? "silent" : "nosr", heard: heard.slice(0, 2500) };
    if (trialR.current) { busy.current = false; if (!tr.m) { setErr("لم تُلتقط قراءتك في التجربة — حاول مرة أخرى بصوت أوضح"); setPh("intro"); return; } setCur({ ...tr, trial: 1 }); setPh("res"); return; }
    let audOk = false; if (aud && aud.length < 2.6e6) audOk = await api.maPut(`${N.AUD}/${text.id}/${skOf(me)}/${id}`, aud); tr.aud = audOk ? 1 : 0;
    const R = { sid: me.id, name: me.name, ck: me.ck, tries: [...tries, tr].slice(-6), last: tr.at };
    await api.maPut(`${N.RES}/${text.id}/${skOf(me)}`, R); if (aud) setMyAud(o => ({ ...o, [id]: aud })); setRec(R); setCur(tr); setPh("res"); busy.current = false;
    setTimeout(() => { try { window.scrollTo({ top: 0, behavior: "smooth" }); } catch {} }, 50);
  };
  useEffect(() => { if (ph !== "res" || !cur || !cur.aud || myAud[cur.id]) return; api.maGet(`${N.AUD}/${text.id}/${skOf(me)}/${cur.id}`).then(v => typeof v === "string" && setMyAud(o => ({ ...o, [cur.id]: v }))); }, [ph, cur && cur.id]);
  const prog = live.pos >= 0 ? Math.round((live.pos + 1) / refT.length * 100) : 0;
  return <div style={{ display: "grid", gap: 12 }}>
    <div className="rl-hero"><div style={{ display: "flex", alignItems: "center", gap: 10, position: "relative", zIndex: 1 }}><button className="rl-btn sm" onClick={onBack} disabled={ph === "rec" || ph === "save"}>→ النصوص</button><div style={{ flex: 1 }}><div style={{ fontSize: 12, opacity: .8, fontWeight: 800 }}>📖 اختبار القراءة الجهرية</div><b style={{ fontSize: 19 }}>{text.title}</b></div><span className="rl-lv" style={{ background: "rgba(255,255,255,.15)", color: "#fde68a" }}>المحاولات المتبقية: {ar(left)}</span></div></div>
    {ph === "intro" && <div className="rl-card" style={{ display: "grid", gap: 12 }}>
      <b style={{ fontSize: 16 }}>تعليمات الاختبار</b>
      <ol className="rl-note" style={{ margin: 0, paddingInlineStart: 20, fontSize: 14, color: "#334155" }}><li>اجلس في مكان هادئ، وقرّب الجهاز من فمك قليلاً.</li><li>{maud ? "استمع أولاً لقراءة معلمك النموذجية." : "اقرأ النص بعينك مرة واحدة قبل البدء."}</li><li>يمكنك قراءة النص والتدرّب عليه قبل التسجيل: اقرأه بعينك، أو اضغط «تجربة قراءة» لتجرّب بصوتك دون احتساب.</li><li>اضغط «ابدأ القراءة» واقرأ النص بصوت واضح ومسموع من أوله إلى آخره.</li><li>إذا كان التسجيل غير واضح سيُرفض ولن يُحتسب، وتعيد التسجيل.</li><li>اضغط «انتهيت» عند الانتهاء، وستظهر نتيجتك وأخطاؤك مباشرة.</li></ol>
      {maud ? <TextPlayer src={maud} refT={refT} onIdx={setIcur} title="🎧 قراءة المعلم النموذجية — تابع الكلمات في النص" /> : <div><TtsPlayer refT={refT} onIdx={setIcur} /></div>}
      <Words refT={refT} cur={icur} />
      {!SR && <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 12, padding: 10, fontWeight: 800, fontSize: 13, color: "#9a3412" }}>⚠️ متصفحك لا يدعم التقييم الآلي — سيُحفظ تسجيلك ويقيّمه المعلم. للحصول على النتيجة فوراً استخدم متصفح Google Chrome.</div>}
      {err && <div style={{ color: "#b91c1c", fontWeight: 800, background: "#fef2f2", border: "1.5px solid #fecaca", borderRadius: 12, padding: 10, lineHeight: 1.9 }}>{err}</div>}
      <div style={{ display: "grid", gridTemplateColumns: SR ? "1fr 2fr" : "1fr", gap: 8 }}>{SR && <button className="rl-btn" style={{ fontSize: 14.5, padding: 14, whiteSpace: "normal" }} onClick={() => start(true)}>📖 تجربة قراءة (بدون احتساب)</button>}<button className="rl-btn p" style={{ fontSize: 17, padding: 14 }} onClick={() => start(false)} disabled={!left}>🎙️ ابدأ القراءة والتسجيل</button></div>
    </div>}
    {ph === "rec" && <div className="rl-card" style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}><button className="rl-mic" onClick={finish} title="انتهيت">⏹</button>
        <div style={{ flex: 1, minWidth: 200 }}><b style={{ fontSize: 18, color: trialR.current ? "#0e7490" : "#b91c1c" }}>{trialR.current ? "📖 تجربة قراءة — غير محتسبة" : "● جارٍ التسجيل — اقرأ بصوت واضح"}</b>{recR.current && <div title="مستوى صوتك" style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}><small style={{ fontWeight: 800, color: "#64748b" }}>🎤</small><div className="rl-bar" style={{ flex: 1, maxWidth: 220 }}><i style={{ width: Math.min(100, lvl * 500) + "%", background: lvl < 0.01 ? "#dc2626" : lvl < 0.03 ? "#f59e0b" : "#16a34a", transition: "width .2s" }} /></div><small style={{ fontWeight: 800, color: lvl < 0.01 ? "#dc2626" : "#15803d" }}>{lvl < 0.01 ? "ارفع صوتك" : "الصوت جيد"}</small></div>}<div style={{ fontSize: 28, fontWeight: 900, color: NAVY }}>{ar(rdFmtDur(sec))}</div>{srOk.current && <><div className="rl-bar" style={{ marginTop: 4 }}><i style={{ width: prog + "%", background: `linear-gradient(90deg,${GOLD},#16a34a)` }} /></div><small style={{ fontWeight: 800, color: "#64748b" }}>تقدّم القراءة {ar(prog)}٪</small></>}</div>
        <button className="rl-btn ok" style={{ fontSize: 16, padding: "12px 22px" }} onClick={finish}>✔️ انتهيت</button></div>
      {audOnly && <div className="rl-note" style={{ background: "#eff6ff", border: "1.5px solid #bfdbfe", borderRadius: 10, padding: "6px 10px", fontWeight: 800, color: "#1e3a8a" }}>🎙️ جهازك لا يسمح بالتقييم الفوري مع التسجيل — أكمل القراءة، سيُحفظ صوتك ويقيّمك معلمك.</div>}
      <Words refT={refT} live={srOk.current ? live : null} />
    </div>}
    {ph === "save" && <Wait t="جارٍ تحليل قراءتك وحفظها…" />}
    {ph === "res" && cur && <>
      {tries.length > 1 && <div className="rl-card" style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}><b style={{ fontSize: 13 }}>محاولاتك:</b>{tries.map((t, i) => <button key={t.id} className={`rl-chip ${cur.id === t.id ? "on" : ""}`} style={t.rej ? { borderColor: "#fecaca", color: cur.id === t.id ? "#fff" : "#b91c1c" } : null} onClick={() => setCur(t)}>المحاولة {ar(i + 1)} {t.rej ? "• 🚫 مرفوضة" : t.m ? `• ${ar(t.m.score)}` : "• بانتظار المعلم"}</button>)}{(() => { const a = tries.filter(t => t.m && !t.rej); if (a.length < 2) return null; const d = a[a.length - 1].m.score - a[0].m.score; return <span className="rl-lv" style={{ background: d >= 0 ? "#dcfce7" : "#fee2e2", color: d >= 0 ? "#15803d" : "#dc2626", marginInlineStart: "auto" }}>{d >= 0 ? "📈 تحسّنت" : "📉 تراجعت"} {ar(Math.abs(d))} درجة</span>; })()}</div>}
      {cur.trial && <div className="rl-card" style={{ background: "#ecfeff", border: "2px solid #a5f3fc", fontWeight: 800, color: "#0e7490", textAlign: "center" }}>📖 هذه نتيجة تجربة غير محتسبة ولم تُحفظ — راجع أخطاءك ثم اضغط «ابدأ القراءة والتسجيل» عندما تكون جاهزاً.</div>}
      {cur.rej && <div className="rl-card" style={{ background: "#fef2f2", border: "2px solid #fecaca", display: "grid", gap: 4 }}><b style={{ color: "#b91c1c", fontSize: 16 }}>🚫 رُفض هذا التسجيل وطُلبت إعادته</b><div style={{ fontWeight: 800 }}>{cur.rej.why || "التسجيل غير واضح"}</div><div className="rl-note">المعلم: {cur.rej.by} — لم تُحتسب هذه المحاولة. أعد القراءة في مكان هادئ وبصوت واضح.</div></div>}
      {!cur.rej && <ResultCard key={cur.id} text={text} tr={cur} refT={refT} onWord={i => speak(refT[i].d)} maud={maud} saud={myAud[cur.id]} />}
      {prac ? <Practice refT={refT} tr={cur} onClose={() => setPrac(false)} /> : null}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
        {cur.m && cur.m.errs > 0 && !prac && <button className="rl-btn g" onClick={() => setPrac(true)}>🎯 تدرّب على كلماتك الخاطئة</button>}
        <button className="rl-btn p" disabled={!left} onClick={() => { setPh("intro"); setPrac(false); }}>{cur.trial ? "🎙️ أنا جاهز — ابدأ التسجيل" : cur.rej ? "🎙️ إعادة التسجيل" : "↻ إعادة القراءة"} {left ? `(${ar(left)})` : "— انتهت المحاولات"}</button>
        <button className="rl-btn" onClick={onBack}>→ قائمة النصوص</button>
      </div>
      {!cur.trial && !cur.rej && others.length > 0 && <div className="rl-card" style={{ background: "linear-gradient(135deg,#fffbeb,#fff)", border: `2px solid ${GOLD}`, display: "grid", gap: 8 }}>
        <b style={{ fontSize: 16, color: NAVY }}>📚 أحسنت! واصل تقدّمك — {others.length === 1 ? "بقي لك نص آخر لم تقرأه" : `بقي لك ${ar(others.length)} نصوص لم تقرأها`}</b>
        <div className="rl-note">القراءة المتنوعة تقوّي طلاقتك وتصحّح أخطاءك. اختر نصاً واقرأه الآن:</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{others.slice(0, 4).map(t => <button key={t.id} className="rl-btn g" onClick={() => onOpen && onOpen(t)}>📄 {t.title} ←</button>)}</div></div>}
    </>}
  </div>;
}

// ══════════ بوابة الطالب ══════════
export function ReadingStudent({ onBack, api }) {
  const [me, setMe] = useState(() => { try { const m = JSON.parse(localStorage.getItem(STU_LS) || "null"); return m && m.id && (m.until || 0) > Date.now() ? m : null; } catch { return null; } });
  const [idv, setIdv] = useState(""); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false); const [pick, setPick] = useState(false); const [ck, setCk] = useState("");
  const [texts, setTexts] = useState(null); const [mine, setMine] = useState({}); const [open, setOpen] = useState(null);
  const R = useRoster(api);
  const keep = st => { const m = { ...st, until: Date.now() + 30 * 864e5 }; setMe(m); try { localStorage.setItem(STU_LS, JSON.stringify(m)); } catch {} api.logLogin && api.logLogin({ sid: m.id, name: m.name, ck: m.ck, n4: m.n4 }, "qiraa"); };
  const login = async () => { setErr(""); const n = api.licNormId(idv); if (n.length !== 10) { setErr("رقم الهوية يتكوّن من ١٠ أرقام"); return; } setBusy(true); const h = await api.stuHash(n); let st = null;
    for (const c of R.classes) { const s = R.studentsOf(c.ck).find(x => x.nh === h); if (s) { st = { id: s.id, name: s.name, ck: c.ck, nh: h, n4: s.n4 }; break; } }
    setBusy(false); if (!st) { setErr("رقم الهوية غير مسجّل — تأكد من الرقم أو اختر فصلك واسمك"); return; } keep(st); };
  useEffect(() => { if (!me) return; (async () => { const T = arr(await api.maGet(N.TXT)).filter(t => textFor(t, me.ck)).sort((a, b) => (b.at || 0) - (a.at || 0)); setTexts(T); const o = {}; await Promise.all(T.map(async t => { const r = await api.maGet(`${N.RES}/${t.id}/${skOf(me)}`); if (r) o[t.id] = rdFixRec(r); })); setMine(o); })(); }, [me, open]);
  const wrap = node => <div className="rl" style={{ minHeight: "100vh", background: "linear-gradient(180deg,#f5f1e3,#f8fafc 260px)", padding: "14px 10px" }}><style>{CSS}</style><div style={{ maxWidth: 940, margin: "0 auto", display: "grid", gap: 12 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>{api.logo && <img src={api.logo} alt="" style={{ width: 42, height: 42, borderRadius: "50%", background: "#fff", padding: 2 }} />}<b style={{ flex: 1, color: NAVY }}>{api.school || ""}</b>{me && <button className="rl-btn sm" onClick={() => { setMe(null); setOpen(null); try { localStorage.removeItem(STU_LS); } catch {} }}>خروج</button>}{onBack && <button className="rl-btn sm" onClick={onBack}>🏠 الموقع</button>}</div>{node}</div></div>;
  if (!me) return wrap(<div className="rl-card" style={{ maxWidth: 520, margin: "20px auto", display: "grid", gap: 12, textAlign: "center" }}>
    <div style={{ fontSize: 54 }}>📖🎙️</div><b style={{ fontSize: 21, color: NAVY }}>اختبار القراءة الجهرية</b><div className="rl-note">اقرأ النص بصوتك، وسيقيّم الموقع قراءتك ويُظهر لك أخطاءك وكيف تتحسّن</div>
    {!pick ? <><input className="rl-inp" dir="ltr" inputMode="numeric" style={{ textAlign: "center", fontSize: 20, letterSpacing: 3 }} placeholder="رقم الهوية (١٠ أرقام)" value={idv} onChange={e => setIdv(e.target.value)} onKeyDown={e => e.key === "Enter" && login()} />
      <button className="rl-btn p" disabled={busy || !R.ready} onClick={login}>{busy || !R.ready ? "⏳" : "دخول"}</button>
      <button className="rl-btn sm" onClick={() => setPick(true)}>أو اختر فصلك واسمك</button></>
      : <><select className="rl-inp" value={ck} onChange={e => setCk(e.target.value)}><option value="">اختر الفصل</option>{R.classes.map(c => <option key={c.ck} value={c.ck}>{api.maClassName(c.ck)}</option>)}</select>
        {ck && <div style={{ maxHeight: 320, overflow: "auto", display: "grid", gap: 6 }}>{R.studentsOf(ck).sort((a, b) => a.name.localeCompare(b.name, "ar")).map(s => <button key={s.id} className="rl-btn" style={{ justifyContent: "flex-start" }} onClick={() => keep({ id: s.id, name: s.name, ck })}>{s.name}</button>)}</div>}
        <button className="rl-btn sm" onClick={() => setPick(false)}>الدخول برقم الهوية</button></>}
    {err && <div style={{ color: "#dc2626", fontWeight: 800 }}>{err}</div>}
  </div>);
  if (open) return wrap(<Reader key={open.id} api={api} text={open} me={me} rec0={mine[open.id] || null} onBack={() => setOpen(null)} others={arr(texts).filter(t => t.id !== open.id && !arr(mine[t.id] && mine[t.id].tries).some(x => !x.rej))} onOpen={t => setOpen(t)} />);
  return wrap(<>
    <div className="rl-hero"><div style={{ position: "relative", zIndex: 1 }}><div style={{ fontSize: 12.5, opacity: .85, fontWeight: 800 }}>مرحباً بك 👋</div><b style={{ fontSize: 21 }}>{me.name}</b><div style={{ fontSize: 13, opacity: .85, fontWeight: 700 }}>{api.maClassName(me.ck)}</div></div></div>
    {!texts ? <Wait /> : !texts.length ? <div className="rl-card" style={{ textAlign: "center", fontWeight: 800, color: "#64748b" }}>لا توجد نصوص قراءة متاحة لفصلك حالياً</div> :
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 10 }}>{texts.map(t => { const r = mine[t.id]; const trAll = arr(r && r.tries); const tr = trAll.filter(x => !x.rej); const last = tr[tr.length - 1]; const rejLast = trAll.length && trAll[trAll.length - 1].rej; const n = rdTokens(t.body).length;
        return <button key={t.id} className="rl-card" style={{ textAlign: "right", cursor: "pointer", fontFamily: "inherit", display: "grid", gap: 6, borderTop: `5px solid ${last && last.m ? rdLvOf(last.m.lv).c : GOLD}` }} onClick={() => setOpen(t)}>
          <b style={{ fontSize: 16, color: NAVY }}>📄 {t.title}</b><span className="rl-note">{ar(n)} كلمة • {t.aud ? "🎧 قراءة نموذجية • " : ""}المحاولات {ar(tr.length)}/{ar(+t.max || 3)}</span>
          {last ? last.m ? <div style={{ display: "flex", gap: 6, alignItems: "center" }}><LvB k={last.m.lv} /><b style={{ color: NAVY }}>{ar(last.m.score)} / ١٠٠</b></div> : <span className="rl-lv" style={{ background: "#e0e7ff", color: "#3730a3" }}>🎧 بانتظار تقييم المعلم</span> : rejLast ? <span className="rl-lv" style={{ background: "#fee2e2", color: "#b91c1c" }}>🚫 رُفض تسجيلك — أعد القراءة</span> : <span className="rl-lv" style={{ background: "#fef3c7", color: "#92400e" }}>✨ ابدأ الآن</span>}
        </button>; })}</div>}
  </>);
}

// ══════════ التجميع (للمعلم والمدير) ══════════
function aggregate(texts, RES, studentsOf, classes) {
  const T = Object.fromEntries(texts.map(t => [t.id, t])); const S = {};
  Object.entries(obj(RES)).forEach(([tid, rs]) => { const t = T[tid]; if (!t) return; const refT = rdTokens(t.body);
    Object.entries(obj(rs)).forEach(([sk, r]) => { if (!r || !r.ck) return; const tr = arr(r.tries).filter(x => !x.rej); const done = tr.filter(x => x.m); const o = S[sk] = S[sk] || { sid: r.sid, name: r.name, ck: r.ck, items: [], pend: 0 };
      if (tr.some(x => !x.m)) o.pend++; if (!done.length) return; const last = done[done.length - 1], first = done[0];
      o.items.push({ tid, title: t.title, last, first, n: done.length, sk: rdSkills(refT, last.st, last.hd, last.m) }); }); });
  const L = Object.values(S).map(o => { if (!o.items.length) return { ...o, M: null };
    const av = k => Math.round(o.items.reduce((a, x) => a + (x.last.m[k] || 0), 0) / o.items.length);
    const M = { score: av("score"), acc: av("acc"), wcpm: av("wcpm"), flu: av("flu"), comp: av("comp") };
    let lv = RD_LV.find(x => M.score >= x.min).k; if (M.acc < 60) lv = "s"; else if (M.acc < 80 && "ab".includes(lv)) lv = "m"; else if (M.acc < 90 && lv === "a") lv = "b"; M.lv = lv;
    const sk = {}; o.items.forEach(x => x.sk.forEach(s => { const c = sk[s.k] = sk[s.k] || { ...s, n: 0, w: [] }; c.n += s.n; s.w.forEach(w => c.w.length < 8 && !c.w.includes(w) && c.w.push(w)); if (s.x) c.x = [...new Set([...(c.x || []), ...s.x])]; }));
    const skL = Object.values(sk).sort((a, b) => b.n - a.n);
    const imp = o.items.filter(x => x.n > 1); const dlt = imp.length ? Math.round(imp.reduce((a, x) => a + x.last.m.score - x.first.m.score, 0) / imp.length) : null;
    const errs = o.items.reduce((a, x) => { ["d", "s", "t", "r"].forEach(k => a[k] += x.last.m.c[k] || 0); a.i += x.last.m.ins || 0; return a; }, { d: 0, s: 0, t: 0, r: 0, i: 0 });
    return { ...o, M, sk: skL, dlt, errs, needs: rdNeeds({ ...M, att: 1, c: { r: errs.r } }, skL) }; });
  const total = classes.reduce((a, c) => a + studentsOf(c.ck).length, 0);
  return { L, total };
}

// ── طباعة
const PCSS = `.pg{border-color:${NAVY}}.pg::before{background:linear-gradient(90deg,${NAVY},${GOLD},${NAVY})}.tt span{background:linear-gradient(135deg,${NAVY},#1e3a8a)}th{background:${NAVY}}h3{color:${NAVY}}.kp b{color:${NAVY}}.hd{border-bottom-color:${GOLD}}
.wd{font-family:Amiri,serif;font-size:17px;line-height:2.1;border:1.5px solid #f1e3b0;background:#fffdf5;border-radius:10px;padding:8px 10px}.wd span{padding:0 3px;border-radius:5px}.nd li{margin:3px 0;font-size:11px}`;
const lvHtml = k => { const L = rdLvOf(k); return `<span class="lv" style="background:${L.bg};color:${L.c}">${L.ic} ${L.t}</span>`; };
function printStudent(api, x, texts, by) {
  const body = x.items.map(it => { const t = texts.find(y => y.id === it.tid); const refT = rdTokens(t ? t.body : ""); const M = it.last.m;
    return `<h3>📄 ${esc(it.title)} — ${lvHtml(M.lv)} الدرجة ${ar(M.score)} • الدقة ${ar(M.acc)}٪ • ${ar(M.wcpm)} كلمة/دقيقة • الإكمال ${ar(M.comp)}٪</h3>
    <div class="wd">${refT.map((w, i) => { const s = it.last.st[i]; const S = s && s !== "o" ? RD_ST[s] : null; return S ? `<span style="background:${S.bg};color:${S.c};${s === "d" ? "text-decoration:line-through" : ""}" title="${S.t}">${esc(w.d)}</span>` : esc(w.d); }).join(" ")}</div>`; }).join("");
  const sk = x.sk.slice(0, 6).map(s => `<tr><td class="r"><b>${esc(rdSkTitle(s))}</b></td><td>${ar(s.n)}</td><td class="r" style="font-family:Amiri,serif;font-size:14px">${esc(s.w.join(" • "))}</td></tr>`).join("");
  api.print(`<section class="pg">${api.hdr("بطاقة تقييم القراءة الجهرية")}
    <div class="kp"><div><b>${esc(x.name)}</b>${api.maClassName(x.ck)}</div><div><b>${ar(x.M.score)}</b>متوسط الدرجة</div><div><b>${ar(x.M.acc)}٪</b>دقة القراءة</div><div><b>${ar(x.M.wcpm)}</b>كلمة/دقيقة</div></div>
    <div style="text-align:center;margin:4px 0">المستوى العام: ${lvHtml(x.M.lv)} — ${esc(rdLvOf(x.M.lv).d)}</div>
    <table><thead><tr><th>حذف</th><th>إبدال/نطق</th><th>ضبط</th><th>تكرار</th><th>إضافة</th><th>النصوص المقروءة</th><th>التحسن بين المحاولات</th></tr></thead><tbody><tr><td>${ar(x.errs.d)}</td><td>${ar(x.errs.s)}</td><td>${ar(x.errs.t)}</td><td>${ar(x.errs.r)}</td><td>${ar(x.errs.i)}</td><td>${ar(x.items.length)}</td><td>${x.dlt == null ? "—" : (x.dlt >= 0 ? "+" : "") + ar(x.dlt)}</td></tr></tbody></table>
    ${body}
    ${sk ? `<h3>🔍 المهارات التي تحتاج تحسيناً</h3><table><thead><tr><th>المهارة</th><th>عدد الأخطاء</th><th>أمثلة من قراءته</th></tr></thead><tbody>${sk}</tbody></table>` : ""}
    <h3>🧭 ماذا يحتاج الطالب؟</h3><ol class="nd">${x.needs.map(n => `<li>${esc(n)}</li>`).join("")}</ol>
    ${api.sig(by, "معلم اللغة العربية")}</section>`, "بطاقة تقييم القراءة — " + x.name, PCSS);
}
function printList(api, L, title, by, sub = "") {
  const cnt = k => L.filter(x => x.M && x.M.lv === k).length;
  api.print(`<section class="pg">${api.hdr(title)}${sub ? `<div style="text-align:center;font-weight:800;font-size:12px">${esc(sub)}</div>` : ""}
    <div class="kp">${RD_LV.map(l => `<div><b style="color:${l.c}">${ar(cnt(l.k))}</b>${l.ic} ${l.t}</div>`).join("")}</div>
    <table><thead><tr><th>م</th><th>الطالب</th><th>الفصل</th><th>الدرجة</th><th>المستوى</th><th>الدقة</th><th>كلمة/د</th><th>حذف</th><th>إبدال</th><th>ضبط</th><th>أبرز الاحتياج</th></tr></thead><tbody>
    ${L.map((x, i) => `<tr><td>${ar(i + 1)}</td><td class="r"><b>${esc(x.name)}</b></td><td>${api.maClassName(x.ck)}</td><td><b>${x.M ? ar(x.M.score) : "—"}</b></td><td>${x.M ? lvHtml(x.M.lv) : "—"}</td><td>${x.M ? ar(x.M.acc) + "٪" : "—"}</td><td>${x.M ? ar(x.M.wcpm) : "—"}</td><td>${ar(x.errs ? x.errs.d : 0)}</td><td>${ar(x.errs ? x.errs.s : 0)}</td><td>${ar(x.errs ? x.errs.t : 0)}</td><td class="r" style="font-size:9.5px">${esc(x.sk && x.sk.length ? x.sk.slice(0, 2).map(rdSkTitle).join("، ") : "—")}</td></tr>`).join("")}</tbody></table>
    ${api.sig(by, "معلم اللغة العربية")}</section>`, title, PCSS);
}

// ══════════ محرر النص ══════════
function TextEditor({ api, init, classes, by, onClose, onSaved }) {
  const [t, setT] = useState(() => ({ title: "", body: "", lv: "", cls: [], tg: "", max: 3, open: 1, ...init })); const [aud, setAud] = useState(null); const [recg, setRecg] = useState(null); const [busy, setBusy] = useState(""); const [topic, setTopic] = useState("");
  useEffect(() => { if (init && init.aud) api.maGet(`${N.TAUD}/${init.id}`).then(v => typeof v === "string" && setAud(v)); }, []);
  const set = (k, v) => setT(p => ({ ...p, [k]: v })); const n = rdTokens(t.body).length;
  const recStart = async () => { try { setRecg(await makeRecorder()); } catch { alert("لم يُسمح باستخدام الميكروفون"); } };
  const recStop = async () => { const d = await recg.stop(); setRecg(null); if (d) setAud(d); };
  const upload = f => { if (!f) return; if (f.size > 3e6) { alert("حجم الملف كبير (الحد ٣ ميجا)"); return; } const r = new FileReader(); r.onload = () => setAud(r.result); r.readAsDataURL(f); };
  const ai = async kind => { if (!api.hasAI()) { alert("فعّل مفتاح الذكاء الاصطناعي أولاً من «درسي الذكي» أو «منصة نافس»"); return; } setBusy(kind);
    try { const g = t.lv ? ["", "الأول", "الثاني", "الثالث"][+t.lv] + " المتوسط" : "المرحلة المتوسطة";
      if (kind === "gen") { const out = await api.ai(`اكتب نصاً قرائياً عربياً فصيحاً مشكولاً شكلاً تاماً لطلاب الصف ${g} في السعودية لاختبار القراءة الجهرية، عن موضوع: ${topic || "قيمة تربوية من الحياة اليومية"}. الطول ٨٠ إلى ١٢٠ كلمة، جمل واضحة متدرجة الصعوبة، تتضمن كلمات فيها شدة وتنوين ولام شمسية وقمرية وهمزات ومدود. أعد JSON فقط بالشكل {"title":"...","body":"..."}`, { max: 2000 }); const j = JSON.parse(out.slice(out.indexOf("{"), out.lastIndexOf("}") + 1)); setT(p => ({ ...p, title: p.title || j.title, body: j.body })); }
      else { const out = await api.ai(`اضبط النص التالي بالشكل التام ضبطاً نحوياً وصرفياً صحيحاً دون تغيير أي كلمة أو ترتيبها، وأعد النص المشكول فقط بلا أي تعليق:\n\n${t.body}`, { max: 3000 }); if (out.trim()) set("body", out.trim()); }
    } catch (e) { alert("تعذّر: " + (e.message || e)); } setBusy(""); };
  const save = async () => { if (!t.title.trim() || n < 5) { alert("اكتب عنواناً ونصاً لا يقل عن ٥ كلمات"); return; } setBusy("save");
    const id = t.id || "t" + Date.now().toString(36); const v = { ...t, id, title: t.title.trim(), body: t.body.trim(), words: n, tg: +t.tg || "", max: +t.max || 3, by: t.by || by, at: t.at || Date.now(), up: Date.now(), aud: aud ? 1 : 0 };
    await api.maPut(`${N.TXT}/${id}`, v); if (aud) await api.maPut(`${N.TAUD}/${id}`, aud); else if (t.aud) await api.maPut(`${N.TAUD}/${id}`, null);
    setBusy(""); onSaved(v); };
  return <div className="rl-modal" onClick={e => e.target === e.currentTarget && onClose()}><div className="rl" style={{ display: "grid", gap: 10 }}>
    <div style={{ display: "flex", alignItems: "center" }}><b style={{ fontSize: 18, flex: 1, color: NAVY }}>{t.id ? "✏️ تعديل النص" : "➕ نص قراءة جديد"}</b><button className="rl-btn sm" onClick={onClose}>✕</button></div>
    <input className="rl-inp" placeholder="عنوان النص" value={t.title} onChange={e => set("title", e.target.value)} />
    <textarea className="rl-inp" rows={7} style={{ fontFamily: "Amiri,serif", fontSize: 21, lineHeight: 2 }} placeholder="الصق النص هنا (يُفضّل مشكولاً)…" value={t.body} onChange={e => set("body", e.target.value)} />
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}><span className="rl-note">عدد الكلمات: <b>{ar(n)}</b></span>
      <input className="rl-inp" style={{ flex: "1 1 180px", width: "auto", minHeight: 36 }} placeholder="موضوع النص المقترح (اختياري)" value={topic} onChange={e => setTopic(e.target.value)} />
      <button className="rl-btn sm g" disabled={!!busy} onClick={() => ai("gen")}>{busy === "gen" ? "⏳" : "✨"} اقترح نصاً</button><button className="rl-btn sm" disabled={!!busy || n < 3} onClick={() => ai("tsh")}>{busy === "tsh" ? "⏳" : "✨"} اضبط بالشكل</button></div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 8 }}>
      <label className="rl-note">الصف<select className="rl-inp" value={t.lv} onChange={e => { set("lv", e.target.value); set("cls", []); }}><option value="">جميع الصفوف</option><option value="1">الأول المتوسط</option><option value="2">الثاني المتوسط</option><option value="3">الثالث المتوسط</option></select></label>
      <label className="rl-note">الطلاقة المستهدفة (كلمة/دقيقة)<input className="rl-inp" type="number" placeholder={`تلقائي (${ar(RD_TARGET[+t.lv] || 100)})`} value={t.tg} onChange={e => set("tg", e.target.value)} /></label>
      <label className="rl-note">عدد المحاولات للطالب<select className="rl-inp" value={t.max} onChange={e => set("max", +e.target.value)}>{[1, 2, 3, 4, 5].map(x => <option key={x} value={x}>{ar(x)}</option>)}</select></label>
      <label className="rl-note">أجهزة أندرويد (عند تعارض التسجيل والتقييم الآلي)<select className="rl-inp" value={t.aprio || "aud"} onChange={e => set("aprio", e.target.value)}><option value="aud">🎙️ احفظ صوت الطالب (يقيّمه المعلم)</option><option value="auto">🤖 التقييم الآلي بدون صوت</option></select></label>
      <label className="rl-note">الحالة<select className="rl-inp" value={t.open} onChange={e => set("open", +e.target.value)}><option value={1}>متاح للطلاب</option><option value={0}>مغلق</option></select></label>
    </div>
    <div><span className="rl-note">الفصول (اتركها فارغة لجميع فصول الصف):</span><div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 4 }}>{classes.filter(c => !t.lv || c.ck.startsWith(t.lv + "-")).map(c => { const on = arr(t.cls).includes(c.ck); return <button key={c.ck} className={`rl-chip ${on ? "on" : ""}`} onClick={() => set("cls", on ? arr(t.cls).filter(x => x !== c.ck) : [...arr(t.cls), c.ck])}>{api.maClassName(c.ck)}</button>; })}</div></div>
    <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 14, padding: 10, display: "grid", gap: 6 }}><b style={{ fontSize: 14 }}>🎧 القراءة النموذجية بصوت المعلم</b><span className="rl-note">يستمع لها الطالب قبل القراءة وبعدها ليصحّح نطقه وضبطه.</span>
      {aud && <audio src={aud} controls style={{ width: "100%" }} />}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{!recg ? <button className="rl-btn sm red" onClick={recStart}>🎙️ {aud ? "إعادة التسجيل" : "سجّل قراءتك"}</button> : <button className="rl-btn sm ok" onClick={recStop}>⏹ إيقاف وحفظ</button>}<label className="rl-btn sm">📁 رفع ملف صوتي<input type="file" accept="audio/*" hidden onChange={e => upload(e.target.files[0])} /></label>{aud && <button className="rl-btn sm" onClick={() => setAud(null)}>🗑️ حذف</button>}</div></div>
    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}><button className="rl-btn" onClick={onClose}>إلغاء</button><button className="rl-btn p" disabled={busy === "save" || !!recg} onClick={save}>{busy === "save" ? "⏳ جارٍ الحفظ" : "💾 حفظ النص"}</button></div>
  </div></div>;
}

// ══════════ مراجعة التقييم / التقييم الحضوري ══════════
function Review({ api, text, stu, rec, tryId, by, onClose, onSaved }) {
  const refT = useMemo(() => rdTokens(text.body), [text.body]); const tries = arr(rec && rec.tries); const base = tries.find(x => x.id === tryId);
  const live = !base; const tg = +text.tg || RD_TARGET[+String(stu.ck)[0]] || 100;
  const [st, setSt] = useState(() => base ? (base.mode === "rec" && !base.m ? "o".repeat(refT.length) : base.st) : "o".repeat(refT.length)); const [ins, setIns] = useState(base ? base.ins || 0 : 0); const [dur, setDur] = useState(base ? base.dur || 0 : 0);
  const [aud, setAud] = useState(null); const [mode, setMode] = useState("s"); const [t0, setT0] = useState(0); const [, force] = useState(0); const [busy, setBusy] = useState(false); const [aiTxt, setAiTxt] = useState("");
  useEffect(() => { if (base && base.aud) api.maGet(`${N.AUD}/${text.id}/${skOf(stu)}/${base.id}`).then(v => typeof v === "string" && setAud(v)); }, []);
  useEffect(() => { if (!t0) return; const i = setInterval(() => force(x => x + 1), 500); return () => clearInterval(i); }, [t0]);
  const tap = i => setSt(s => { const c = s[i]; const nx = mode === "cycle" ? RD_CYCLE[(RD_CYCLE.indexOf(c) + 1) % RD_CYCLE.length] : c === mode ? "o" : mode; return s.slice(0, i) + nx + s.slice(i + 1); });
  const stopAt = i => setSt(s => s.split("").map((c, k) => k > i ? "n" : c === "n" ? "o" : c).join(""));
  const M = rdMetrics(st, ins, dur, tg); const L = rdLvOf(M.lv);
  const save = async () => { setBusy(true); const tr = { ...(base || { id: Date.now().toString(36), at: Date.now(), mode: "live", aud: 0, hd: {} }), rej: null, st, ins, dur: Math.round(dur), tg, m: M, sk: rdSkills(refT, st, base ? base.hd : {}, M).map(s => s.k), rv: { by, at: Date.now() } };
    const list = base ? tries.map(x => x.id === base.id ? tr : x) : [...tries, tr].slice(-6); const R = { sid: stu.id, name: stu.name, ck: stu.ck, tries: list, last: Date.now() };
    await api.maPut(`${N.RES}/${text.id}/${skOf(stu)}`, R); setBusy(false); onSaved(R); };
  const reject = async () => { const why = prompt("سبب رفض التسجيل (يظهر للطالب):", "التسجيل غير واضح — أعد القراءة في مكان هادئ وبصوت مرتفع"); if (why == null) return; setBusy(true);
    const list = tries.map(x => x.id === base.id ? { ...x, rej: { by, at: Date.now(), why: why.trim() || "التسجيل غير واضح" } } : x); const R = { sid: stu.id, name: stu.name, ck: stu.ck, tries: list, last: Date.now() };
    await api.maPut(`${N.RES}/${text.id}/${skOf(stu)}`, R); setBusy(false); onSaved(R, "rej"); };
  const aiRep = async () => { if (!api.hasAI()) { alert("فعّل مفتاح الذكاء الاصطناعي أولاً"); return; } setAiTxt("⏳ جارٍ إعداد التقرير…"); const sk = rdSkills(refT, st, base ? base.hd : {}, M);
    try { setAiTxt(await api.ai(`أنت مشرف لغة عربية في المرحلة المتوسطة. اكتب تقريراً تشخيصياً مختصراً (٦–٨ أسطر) لقراءة طالب جهرية بلغة مهنية موجهة للمعلم وولي الأمر، يتضمن: وصف المستوى، أبرز الأخطاء بأمثلة، المهارات المطلوب علاجها، خطة علاجية لأسبوعين بأنشطة محددة.\nالبيانات: الدرجة ${M.score}/100، الدقة ${M.acc}%، الطلاقة ${M.wcpm} كلمة/دقيقة (المستهدف ${tg})، إكمال النص ${M.comp}%، حذف ${M.c.d}، إبدال ${M.c.s}، ضبط ${M.c.t}، تكرار ${M.c.r}، إضافة ${M.ins}.\nالمهارات الضعيفة: ${sk.map(s => rdSkTitle(s) + " (" + s.w.join("، ") + ")").join(" | ") || "لا يوجد"}.`, { max: 1500 })); } catch (e) { setAiTxt("تعذّر: " + (e.message || e)); } };
  return <div className="rl-modal" onClick={e => e.target === e.currentTarget && onClose()}><div className="rl" style={{ display: "grid", gap: 10 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={{ flex: 1 }}><b style={{ fontSize: 17, color: NAVY }}>{live ? "📝 تقييم حضوري" : "🔎 مراجعة التقييم واعتماده"} — {stu.name}</b><div className="rl-note">{api.maClassName(stu.ck)} • {text.title}{base && base.mode === "auto" ? " • التقييم الآلي جاهز للمراجعة" : base ? " • تسجيل صوتي بانتظار التقييم" : ""}</div></div><button className="rl-btn sm" onClick={onClose}>✕</button></div>
    {aud && <div className="rl-card" style={{ padding: 10 }}><b style={{ fontSize: 13 }}>🎧 تسجيل الطالب</b><audio src={aud} controls style={{ width: "100%", marginTop: 4 }} /></div>}
    {base && !!base.aud && !aud && <div className="rl-note">⏳ جارٍ تحميل التسجيل…</div>}
    {base && !base.aud && <div className="rl-note" style={{ background: "#f8fafc", borderRadius: 10, padding: "6px 10px" }}>ℹ️ لا يوجد تسجيل صوتي محفوظ لهذه المحاولة (جهاز الطالب لم يسمح بالتسجيل مع التقييم الآلي).</div>}
    {base && base.heard && <details className="rl-card" open={!base.aud} style={{ padding: 10, background: "#f0f9ff", border: "1.5px solid #bae6fd" }}><summary style={{ fontWeight: 900, cursor: "pointer", color: "#0c4a6e" }}>📝 ما قرأه الطالب كما التقطه الجهاز</summary><div style={{ fontFamily: "Amiri,serif", fontSize: 19, lineHeight: 2, marginTop: 6, whiteSpace: "pre-wrap" }}>{base.heard}</div><div className="rl-note">هذا نص تقريبي من متعرّف الصوت (بدون تشكيل)، وقد يصحّح بعض الكلمات تلقائياً — استخدمه للمقارنة مع النص الأصلي.</div></details>}
    {base && base.rej && <div style={{ background: "#fef2f2", border: "1.5px solid #fecaca", borderRadius: 12, padding: 10, fontWeight: 800, color: "#b91c1c" }}>🚫 هذا التسجيل مرفوض ({base.rej.by}): {base.rej.why}</div>}
    {live && <div className="rl-card" style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", padding: 10 }}><b>⏱️ زمن القراءة: {ar(rdFmtDur(t0 ? (Date.now() - t0) / 1000 : dur))}</b>{!t0 ? <button className="rl-btn sm red" onClick={() => setT0(Date.now() - dur * 1000)}>▶ بدء التوقيت</button> : <button className="rl-btn sm ok" onClick={() => { setDur((Date.now() - t0) / 1000); setT0(0); }}>⏹ إيقاف</button>}<span className="rl-note">ابدأ التوقيت عندما يبدأ الطالب القراءة أمامك</span></div>}
    <div className="rl-card" style={{ padding: 10, display: "grid", gap: 8 }}>
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap", alignItems: "center" }}><b style={{ fontSize: 13 }}>عند الضغط على كلمة سجّلها:</b>{["s", "d", "t", "r"].map(k => <button key={k} className={`rl-chip ${mode === k ? "on" : ""}`} style={mode === k ? { background: RD_ST[k].c, borderColor: RD_ST[k].c } : { color: RD_ST[k].c }} onClick={() => setMode(k)}>{RD_ST[k].t}</button>)}<button className={`rl-chip ${mode === "cut" ? "on" : ""}`} onClick={() => setMode("cut")}>✂️ توقّف هنا</button></div>
      <Words refT={refT} st={st} hd={base ? base.hd : {}} onWord={i => mode === "cut" ? (stopAt(i), setMode("s")) : tap(i)} size={22} />
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}><span style={{ fontWeight: 800 }}>كلمات مضافة: <button className="rl-btn sm" onClick={() => setIns(Math.max(0, ins - 1))}>−</button> <b>{ar(ins)}</b> <button className="rl-btn sm" onClick={() => setIns(ins + 1)}>+</button></span>
        <label style={{ fontWeight: 800, display: "flex", alignItems: "center", gap: 4 }}>الزمن (ث):<input className="rl-inp" type="number" style={{ width: 90, minHeight: 34 }} value={Math.round(dur)} onChange={e => setDur(+e.target.value || 0)} /></label>
        <button className="rl-btn sm" onClick={() => setSt("o".repeat(refT.length))}>↺ الكل صحيح</button></div>
    </div>
    <div className="rl-card" style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", justifyContent: "space-around", padding: 10 }}><Ring v={M.score} c={L.c} size={80} label="الدرجة" sub={<LvB k={M.lv} />} /><Ring v={M.acc} c="#0e7490" size={70} label="الدقة" /><Ring v={M.flu} c={GOLD} size={70} label="الطلاقة" sub={`${ar(M.wcpm)} ك/د`} /><Ring v={M.comp} c="#7c3aed" size={70} label="الإكمال" /></div>
    {aiTxt && <div className="rl-card" style={{ whiteSpace: "pre-wrap", lineHeight: 1.9, fontWeight: 600, fontSize: 13.5 }}>{aiTxt}</div>}
    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>{base && !base.rej && <button className="rl-btn red" disabled={busy} onClick={reject}>🚫 رفض التسجيل وطلب الإعادة</button>}<button className="rl-btn g" onClick={aiRep}>✨ تقرير تشخيصي</button><button className="rl-btn" onClick={onClose}>إلغاء</button><button className="rl-btn p" disabled={busy || (live && !dur)} onClick={save}>{busy ? "⏳" : "✔️ اعتماد التقييم"}</button></div>
    {live && !dur && <div className="rl-note" style={{ textAlign: "left" }}>سجّل زمن القراءة أولاً لحساب الطلاقة</div>}
  </div></div>;
}

// ══════════ صفحة المعلم / المدير ══════════
function ReadingStaff({ api, me, admin }) {
  const by = (me && me.name) || "الإدارة"; const R = useRoster(api); const [toast, say] = useToast();
  const [tab, setTab] = useState(admin ? "dash" : "res"); const [texts, setTexts] = useState(null); const [RES, setRES] = useState(null); const [edit, setEdit] = useState(null);
  const [tid, setTid] = useState(""); const [ck, setCk] = useState(""); const [rv, setRv] = useState(null); const [det, setDet] = useState(null); const [detAud, setDetAud] = useState(null);
  useEffect(() => { setDetAud(null); if (det && det.tr && det.tr.aud) api.maGet(`${N.AUD}/${det.text.id}/${skOf(det.stu)}/${det.tr.id}`).then(v => typeof v === "string" && setDetAud(v)); }, [det && det.tr && det.tr.id]); const [T, setTT] = useState(null); const [lvF, setLvF] = useState("ms"); const [clsF, setClsF] = useState(""); const [sel, setSel] = useState({});
  const load = async () => { const [t, r] = await Promise.all([api.maGet(N.TXT), api.maGet(N.RES)]); const L = arr(t).sort((a, b) => (b.at || 0) - (a.at || 0)); setTexts(L); const RR = {}; Object.entries(obj(r)).forEach(([k, v]) => { RR[k] = {}; Object.entries(obj(v)).forEach(([sk, x]) => { RR[k][sk] = rdFixRec(x); }); }); setRES(RR); if (!tid && L.length) setTid(L[0].id); };
  useEffect(() => { load(); api.TT().then(setTT).catch(() => {}); }, []);
  const myCls = useMemo(() => { if (admin || !T || !T.C) return null; const ti = api.ttFind(T, by); if (ti < 0) return null; return Object.keys(T.C).filter(k => arr(T.C[k]).some(d => arr(d).some(c => c && c[1] === ti))); }, [T]);
  const arT = ck => { if (!T || !T.C || !T.C[ck]) return ""; const s = new Set(); arr(T.C[ck]).forEach(d => arr(d).forEach(c => { if (c && c[0] >= 0 && c[1] >= 0 && /لغتي|عربي/.test(String((T.SA && T.SA[c[0]]) || T.S[c[0]] || ""))) s.add(String(T.T[c[1]] || "").replace(/\s*\(.*?\)\s*/g, "")); })); return [...s].join("، "); };
  const clsList = R.classes.filter(c => !myCls || myCls.includes(c.ck)); const clsAll = myCls && myCls.length ? clsList : R.classes;
  useEffect(() => { if (!ck && clsAll.length) setCk(clsAll[0].ck); }, [clsAll.length]);
  const AG = useMemo(() => texts && RES ? aggregate(texts, RES, R.studentsOf, R.classes) : null, [texts, RES, R.ready]);
  if (!texts || !RES || !R.ready) return <div className="rl"><style>{CSS}</style><Wait /></div>;
  const text = texts.find(t => t.id === tid);
  const scope = AG.L.filter(x => admin || !myCls || myCls.includes(x.ck));
  const link = (() => { try { return location.origin + location.pathname + "#qiraa"; } catch { return "#qiraa"; } })();
  const delText = async t => { if (!confirm(`حذف النص «${t.title}» ونتائج طلابه؟`)) return; await api.maPut(`${N.TXT}/${t.id}`, null); await api.maPut(`${N.TAUD}/${t.id}`, null); await api.maPut(`${N.RES}/${t.id}`, null); await api.maPut(`${N.AUD}/${t.id}`, null); say("🗑️ تم الحذف"); load(); };
  const resetStu = async s => { if (!confirm(`حذف محاولات ${s.name} في هذا النص ليعيد الاختبار؟`)) return; await api.maPut(`${N.RES}/${tid}/${skOf(s)}`, null); await api.maPut(`${N.AUD}/${tid}/${skOf(s)}`, null); say("تم — يمكن للطالب إعادة الاختبار"); load(); };
  const toRW = async L => { if (!L.length) return; const cur = obj(await api.maGet(api.RW_NODE)); const P = {}; let n = 0; const d = new Date(); const dk = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    L.forEach(x => { if (obj(cur[x.ck])[x.sid] && obj(cur[x.ck])[x.sid].lv) return; n++; P[`${api.RW_NODE}/${x.ck}/${x.sid}`] = { sid: x.sid, name: x.name, ck: x.ck, d: dk, lv: x.M.lv === "s" ? "s" : x.M.flu < 70 && x.M.acc >= 90 ? "b" : "m", st: "c", by, at: Date.now(), src: "qiraa", note: `اختبار القراءة الجهرية: ${x.M.score}/100 • دقة ${x.M.acc}% • ${x.M.wcpm} ك/د — ${x.sk.slice(0, 3).map(rdSkTitle).join("، ")}` }; });
    if (n) await api.fbPatch(P); say(n ? `✅ أُضيف ${ar(n)} طالباً إلى حصر الضعف القرائي` : "جميعهم مسجلون مسبقاً في الحصر"); setSel({}); };
  const tabs = [...(admin ? [["dash", "📊 لوحة المدرسة"]] : []), ["res", "📋 نتائج الطلاب"], ["weak", `⚠️ يحتاجون معالجة (${ar(scope.filter(x => x.M && "ms".includes(x.M.lv)).length)})`], ["texts", `📄 النصوص (${ar(texts.length)})`]];

  // ── نتائج نص لفصل
  const resTab = () => { if (!text) return <div className="rl-card" style={{ textAlign: "center", fontWeight: 800 }}>أضف نصاً أولاً من تبويب «النصوص»</div>;
    const S = R.studentsOf(ck).sort((a, b) => a.name.localeCompare(b.name, "ar")); const rs = obj(RES[tid]); const refT = rdTokens(text.body);
    const rows = S.map(s => { const r = rs[skOf(s)]; const trAll = arr(r && r.tries); const tr = trAll.filter(x => !x.rej); const done = tr.filter(x => x.m); const rejN = trAll.length - tr.length; const rejLast = trAll.length > 0 && !!trAll[trAll.length - 1].rej; return { s, r, tr, rejN, rejLast, last: done[done.length - 1], pend: tr.filter(x => !x.m || (x.mode === "auto" && !x.rv)).length, first: done[0] }; });
    const D = rows.filter(x => x.last); const avg = k => D.length ? Math.round(D.reduce((a, x) => a + x.last.m[k], 0) / D.length) : null;
    return <div style={{ display: "grid", gap: 10 }}>
      <div className="rl-card" style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <select className="rl-inp" style={{ flex: "2 1 220px", width: "auto" }} value={tid} onChange={e => setTid(e.target.value)}>{texts.map(t => <option key={t.id} value={t.id}>📄 {t.title}</option>)}</select>
        <select className="rl-inp" style={{ flex: "1 1 160px", width: "auto" }} value={ck} onChange={e => setCk(e.target.value)}>{clsAll.map(c => <option key={c.ck} value={c.ck}>{api.maClassName(c.ck)}</option>)}</select>
        <button className="rl-btn sm" onClick={load}>↻ تحديث</button>
        <button className="rl-btn sm p" disabled={!D.length} onClick={() => printList(api, aggregate([text], { [tid]: rs }, R.studentsOf, R.classes).L.filter(x => x.ck === ck && x.M).sort((a, b) => b.M.score - a.M.score), `نتائج اختبار القراءة الجهرية — ${api.maClassName(ck)}`, by, `النص: ${text.title}`)}>🖨️ تقرير الفصل</button>
      </div>
      <div className="rl-kpis"><div className="rl-kpi"><b>{ar(D.length)}/{ar(S.length)}</b><small>قرأوا النص</small></div><div className="rl-kpi"><b>{avg("score") == null ? "—" : ar(avg("score"))}</b><small>متوسط الدرجة</small></div><div className="rl-kpi"><b>{avg("acc") == null ? "—" : ar(avg("acc")) + "٪"}</b><small>متوسط الدقة</small></div><div className="rl-kpi"><b>{avg("wcpm") == null ? "—" : ar(avg("wcpm"))}</b><small>كلمة/دقيقة</small></div>{RD_LV.map(l => <div key={l.k} className="rl-kpi" style={{ background: l.bg, borderColor: l.bg }}><b style={{ color: l.c }}>{ar(D.filter(x => x.last.m.lv === l.k).length)}</b><small style={{ color: l.c }}>{l.ic} {l.t}</small></div>)}<div className="rl-kpi" style={{ background: "#eef2ff" }}><b style={{ color: "#4338ca" }}>{ar(rows.reduce((a, x) => a + x.pend, 0))}</b><small>بانتظار مراجعتك</small></div></div>
      <div className="rl-card" style={{ overflowX: "auto", padding: 8 }}><table className="rl-tbl"><thead><tr><th>م</th><th>الطالب</th><th>المحاولات</th><th>الدرجة</th><th>المستوى</th><th>الدقة</th><th>ك/د</th><th>حذف</th><th>إبدال</th><th>ضبط</th><th>تكرار</th><th>التحسّن</th><th>الحالة</th><th>إجراء</th></tr></thead>
        <tbody>{rows.map((x, i) => { const m = x.last && x.last.m; const lastT = x.tr[x.tr.length - 1]; return <tr key={x.s.id}>
          <td>{ar(i + 1)}</td><td style={{ textAlign: "right", fontWeight: 800, cursor: m ? "pointer" : "default", color: m ? NAVY : undefined }} onClick={() => m && setDet({ stu: x.s, text, tr: x.last })}>{x.s.name}</td><td>{ar(x.tr.length)}</td>
          <td><b>{m ? ar(m.score) : "—"}</b></td><td>{m ? <LvB k={m.lv} /> : "—"}</td><td>{m ? ar(m.acc) + "٪" : "—"}</td><td>{m ? ar(m.wcpm) : "—"}</td>
          {["d", "s", "t", "r"].map(k => <td key={k} style={{ color: m && m.c[k] ? RD_ST[k].c : "#cbd5e1", fontWeight: 800 }}>{m ? ar(m.c[k] || 0) : "—"}</td>)}
          <td>{x.first && x.last && x.first !== x.last ? <b style={{ color: x.last.m.score >= x.first.m.score ? "#15803d" : "#dc2626" }}>{x.last.m.score >= x.first.m.score ? "▲" : "▼"}{ar(Math.abs(x.last.m.score - x.first.m.score))}</b> : "—"}</td>
          <td>{x.rejLast ? <span className="rl-lv" style={{ background: "#fee2e2", color: "#b91c1c" }}>🚫 رُفض — بانتظار الإعادة</span> : !x.tr.length ? <span className="rl-lv" style={{ background: "#f1f5f9", color: "#64748b" }}>لم يقرأ</span> : lastT && !lastT.m ? <span className="rl-lv" style={{ background: "#e0e7ff", color: "#3730a3" }}>🎧 بانتظارك</span> : lastT.rv ? <span className="rl-lv" style={{ background: "#dcfce7", color: "#15803d" }}>✔️ معتمد</span> : <span className="rl-lv" style={{ background: "#fef3c7", color: "#92400e" }}>🤖 آلي</span>}</td>
          <td style={{ whiteSpace: "nowrap" }}>{lastT ? <button className="rl-btn sm" title={lastT.aud ? "الاستماع لتسجيل الطالب ومراجعة التقييم" : "مراجعة التقييم (لا يوجد تسجيل محفوظ)"} onClick={() => setRv({ stu: x.s, rec: x.r, tryId: lastT.id })}>{lastT.aud ? "🎧 استماع ومراجعة" : "🔎 مراجعة"}</button> : null} <button className="rl-btn sm" title="تقييم حضوري" onClick={() => setRv({ stu: x.s, rec: x.r, tryId: null })}>📝</button>{x.tr.length > 0 && <button className="rl-btn sm red" title="السماح بإعادة الاختبار" onClick={() => resetStu(x.s)}>↺</button>}</td>
        </tr>; })}</tbody></table></div>
      <div className="rl-note">💡 اضغط اسم الطالب لعرض أخطائه على النص وسماع قراءته • «🎧 استماع ومراجعة» لسماع التسجيل وتعديل التقييم واعتماده أو رفض التسجيل غير الواضح • «📝» لتقييم طالب يقرأ أمامك بلا جهاز.</div>
    </div>; };

  // ── قائمة من يحتاج معالجة
  const weakTab = () => { const L = scope.filter(x => x.M && lvF.includes(x.M.lv) && (!clsF || x.ck === clsF)).sort((a, b) => a.M.score - b.M.score); const selL = L.filter(x => sel[x.ck + x.sid]);
    return <div style={{ display: "grid", gap: 10 }}>
      <div className="rl-card" style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
        {[["ms", "⚠️ جميع الضعف"], ["s", "🔴 ضعف شديد"], ["m", "🟠 ضعف متوسط"], ["abms", "👥 الجميع"]].map(([k, l]) => <button key={k} className={`rl-chip ${lvF === k ? "on" : ""}`} onClick={() => setLvF(k)}>{l}</button>)}
        <select className="rl-inp" style={{ width: 170, minHeight: 36 }} value={clsF} onChange={e => setClsF(e.target.value)}><option value="">جميع الفصول</option>{clsAll.map(c => <option key={c.ck} value={c.ck}>{api.maClassName(c.ck)}</option>)}</select>
        <span style={{ marginInlineStart: "auto", display: "flex", gap: 6, flexWrap: "wrap" }}><button className="rl-btn sm g" disabled={!L.length} onClick={() => toRW(selL.length ? selL : L.filter(x => "ms".includes(x.M.lv)))}>📖 إضافة {selL.length ? `المحددين (${ar(selL.length)})` : "الضعاف"} إلى حصر الضعف القرائي</button><button className="rl-btn sm p" disabled={!L.length} onClick={() => printList(api, L, "قائمة الطلاب المحتاجين لمعالجة قرائية", by, clsF ? api.maClassName(clsF) : "جميع الفصول")}>🖨️ طباعة القائمة</button></span>
      </div>
      {!L.length ? <div className="rl-card" style={{ textAlign: "center", fontWeight: 900, color: "#15803d" }}>✅ لا يوجد طلاب في هذا التصنيف</div> :
        <div className="rl-card" style={{ overflowX: "auto", padding: 8 }}><table className="rl-tbl"><thead><tr><th><input type="checkbox" onChange={e => setSel(e.target.checked ? Object.fromEntries(L.map(x => [x.ck + x.sid, 1])) : {})} /></th><th>الطالب</th><th>الفصل</th><th>الدرجة</th><th>المستوى</th><th>الدقة</th><th>ك/د</th><th>أبرز الضعف</th><th>ماذا يحتاج</th><th>معلم لغتي</th><th></th></tr></thead>
          <tbody>{L.map(x => <tr key={x.ck + x.sid} style={x.M.lv === "s" ? { background: "#fff7f7" } : null}>
            <td><input type="checkbox" checked={!!sel[x.ck + x.sid]} onChange={e => setSel(p => ({ ...p, [x.ck + x.sid]: e.target.checked ? 1 : 0 }))} /></td>
            <td style={{ textAlign: "right", fontWeight: 900 }}>{x.name}</td><td>{api.maClassName(x.ck)}</td><td><b>{ar(x.M.score)}</b></td><td><LvB k={x.M.lv} /></td><td>{ar(x.M.acc)}٪</td><td>{ar(x.M.wcpm)}</td>
            <td style={{ textAlign: "right", fontSize: 12 }}>{x.sk.slice(0, 2).map(rdSkTitle).join("، ") || "—"}</td><td style={{ textAlign: "right", fontSize: 11.5, maxWidth: 280 }}>{x.needs[0]}</td><td style={{ fontSize: 12 }}>{arT(x.ck) || "—"}</td>
            <td style={{ whiteSpace: "nowrap" }}>{(() => { const it = [...x.items].sort((a, b) => (b.last.at || 0) - (a.last.at || 0))[0]; const tx = it && texts.find(t => t.id === it.tid); if (!tx) return null; const stu = { id: x.sid, sid: x.sid, name: x.name, ck: x.ck }; const rec = obj(RES[it.tid])[skOf(stu)]; if (!rec) return null; return <button className="rl-btn sm" title={it.last.aud ? "الاستماع لتسجيل الطالب ومراجعة التقييم" : "مراجعة التقييم (لا يوجد تسجيل محفوظ)"} onClick={() => setRv({ stu, rec, tryId: it.last.id, text: tx })}>{it.last.aud ? "🎧 استماع" : "🔎 مراجعة"}</button>; })()} <button className="rl-btn sm" onClick={() => printStudent(api, x, texts, by)}>🖨️ بطاقة</button></td></tr>)}</tbody></table></div>}
    </div>; };

  // ── لوحة المدرسة (المدير)
  const dashTab = () => { const D = AG.L.filter(x => x.M); const tot = AG.total; const pc = n => D.length ? Math.round(n / D.length * 100) : 0; const cnt = k => D.filter(x => x.M.lv === k).length;
    const avg = (L, k) => L.length ? Math.round(L.reduce((a, x) => a + x.M[k], 0) / L.length) : null;
    const byCls = R.classes.map(c => { const L = D.filter(x => x.ck === c.ck); return { ck: c.ck, n: R.studentsOf(c.ck).length, t: L.length, avg: avg(L, "score"), acc: avg(L, "acc"), wcpm: avg(L, "wcpm"), lv: RD_LV.map(l => L.filter(x => x.M.lv === l.k).length) }; });
    const byG = [1, 2, 3].map(g => { const L = D.filter(x => x.ck.startsWith(g + "-")); return { g, t: L.length, avg: avg(L, "score"), lv: RD_LV.map(l => L.filter(x => x.M.lv === l.k).length) }; });
    const skC = {}; D.forEach(x => x.sk.forEach(s => { const k = s.k === "lt" ? "lt" : s.k; skC[k] = skC[k] || { k, st: 0, n: 0, x: [] }; skC[k].st++; skC[k].n += s.n; if (s.x) skC[k].x = [...new Set([...skC[k].x, ...s.x])]; }));
    const skL = Object.values(skC).sort((a, b) => b.st - a.st); const skMax = Math.max(1, ...skL.map(s => s.st));
    const imp = D.filter(x => x.dlt != null); const impAvg = imp.length ? Math.round(imp.reduce((a, x) => a + x.dlt, 0) / imp.length) : null;
    const pend = AG.L.reduce((a, x) => a + (x.pend || 0), 0);
    const printDash = () => api.print(`<section class="pg">${api.hdr("التقرير الشامل لاختبار القراءة الجهرية")}
      <div class="kp"><div><b>${ar(D.length)}/${ar(tot)}</b>طالباً مختبراً</div><div><b>${ar(avg(D, "score") ?? 0)}</b>متوسط الدرجة</div><div><b>${ar(avg(D, "acc") ?? 0)}٪</b>متوسط الدقة</div><div><b>${ar(pc(cnt("m") + cnt("s")))}٪</b>نسبة الضعف</div></div>
      <div class="kp">${RD_LV.map(l => `<div><b style="color:${l.c}">${ar(cnt(l.k))}</b>${l.ic} ${l.t} (${ar(pc(cnt(l.k)))}٪)</div>`).join("")}</div>
      <h3>📊 المستويات حسب الفصل</h3><table><thead><tr><th>الفصل</th><th>الطلاب</th><th>المختبرون</th><th>متوسط الدرجة</th><th>الدقة</th><th>ك/د</th>${RD_LV.map(l => `<th>${l.t}</th>`).join("")}<th>معلم لغتي</th></tr></thead><tbody>${byCls.map(c => `<tr><td><b>${api.maClassName(c.ck)}</b></td><td>${ar(c.n)}</td><td>${ar(c.t)}</td><td>${c.avg == null ? "—" : ar(c.avg)}</td><td>${c.acc == null ? "—" : ar(c.acc) + "٪"}</td><td>${c.wcpm == null ? "—" : ar(c.wcpm)}</td>${c.lv.map((n, i) => `<td style="color:${RD_LV[i].c};font-weight:900">${ar(n)}</td>`).join("")}<td style="font-size:9.5px">${esc(arT(c.ck))}</td></tr>`).join("")}</tbody></table>
      <h3>🔍 المهارات الأكثر ضعفاً على مستوى المدرسة</h3><table><thead><tr><th>المهارة</th><th>عدد الطلاب</th><th>المعالجة المقترحة</th></tr></thead><tbody>${skL.slice(0, 8).map(s => `<tr><td class="r"><b>${esc(rdSkTitle(s))}</b></td><td>${ar(s.st)}</td><td class="r" style="font-size:9.5px">${esc(rdSkTip(s))}</td></tr>`).join("")}</tbody></table>
      <h3>⚠️ الطلاب ذوو الضعف الشديد (${ar(cnt("s"))})</h3><table><thead><tr><th>م</th><th>الطالب</th><th>الفصل</th><th>الدرجة</th><th>الدقة</th><th>أبرز الضعف</th></tr></thead><tbody>${D.filter(x => x.M.lv === "s").sort((a, b) => a.M.score - b.M.score).map((x, i) => `<tr><td>${ar(i + 1)}</td><td class="r">${esc(x.name)}</td><td>${api.maClassName(x.ck)}</td><td>${ar(x.M.score)}</td><td>${ar(x.M.acc)}٪</td><td class="r" style="font-size:9.5px">${esc(x.sk.slice(0, 2).map(rdSkTitle).join("، "))}</td></tr>`).join("") || `<tr><td colspan="6">لا يوجد</td></tr>`}</tbody></table>
      ${api.sig(by, "وكيل الشؤون التعليمية")}</section>`, "التقرير الشامل للقراءة الجهرية", PCSS);
    return <div style={{ display: "grid", gap: 12 }}>
      <div className="rl-hero"><div style={{ position: "relative", zIndex: 1, display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ flex: "1 1 260px" }}><div style={{ fontSize: 12.5, opacity: .85, fontWeight: 800 }}>📖 القراءة الجهرية — مؤشر المدرسة</div><b style={{ fontSize: 30 }}>{avg(D, "score") == null ? "—" : ar(avg(D, "score"))}<small style={{ fontSize: 15, opacity: .8 }}> / ١٠٠</small></b><div style={{ fontSize: 13, fontWeight: 700, opacity: .9 }}>اختُبر {ar(D.length)} من {ar(tot)} طالباً ({ar(tot ? Math.round(D.length / tot * 100) : 0)}٪){impAvg != null ? ` • متوسط التحسن بين المحاولات ${impAvg >= 0 ? "+" : ""}${ar(impAvg)}` : ""}</div></div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><button className="rl-btn g" onClick={printDash}>🖨️ التقرير الشامل</button><button className="rl-btn" onClick={() => { try { navigator.clipboard.writeText(`📖 اختبار القراءة الجهرية — ادخل برقم هويتك واقرأ النص بصوتك:\n${link}`); say("✅ نُسخ رابط الطلاب"); } catch {} }}>🔗 رابط الطلاب</button></div></div></div>
      <div className="rl-kpis">{RD_LV.map(l => <div key={l.k} className="rl-kpi" style={{ background: l.bg, borderColor: l.bg }}><b style={{ color: l.c }}>{ar(cnt(l.k))}</b><small style={{ color: l.c }}>{l.ic} {l.t} • {ar(pc(cnt(l.k)))}٪</small></div>)}<div className="rl-kpi"><b>{avg(D, "acc") == null ? "—" : ar(avg(D, "acc")) + "٪"}</b><small>متوسط الدقة</small></div><div className="rl-kpi"><b>{avg(D, "wcpm") == null ? "—" : ar(avg(D, "wcpm"))}</b><small>متوسط كلمة/دقيقة</small></div><div className="rl-kpi" style={{ background: "#eef2ff" }}><b style={{ color: "#4338ca" }}>{ar(pend)}</b><small>تسجيلات بانتظار المعلمين</small></div></div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 12 }}>
        <div className="rl-card"><b style={{ color: NAVY }}>🏫 المستويات حسب الصف</b><div style={{ display: "grid", gap: 10, marginTop: 10 }}>{byG.map(g => <div key={g.g}><div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: 13 }}><span>الصف {["", "الأول", "الثاني", "الثالث"][g.g]}</span><span>{g.avg == null ? "—" : `متوسط ${ar(g.avg)}`} • {ar(g.t)} طالب</span></div><div className="rl-stk" style={{ marginTop: 4 }}>{g.lv.map((n, i) => <i key={i} title={`${RD_LV[i].t}: ${n}`} style={{ width: `${g.t ? n / g.t * 100 : 0}%`, background: RD_LV[i].c }} />)}</div></div>)}</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>{RD_LV.map(l => <span key={l.k} style={{ fontSize: 11.5, fontWeight: 800, color: l.c }}>■ {l.t}</span>)}</div></div>
        <div className="rl-card"><b style={{ color: "#b45309" }}>🔍 المهارات الأضعف (عدد الطلاب)</b>{!skL.length ? <div className="rl-note">لا توجد بيانات بعد</div> : <div style={{ display: "grid", gap: 7, marginTop: 10 }}>{skL.slice(0, 8).map(s => <div key={s.k} style={{ display: "grid", gridTemplateColumns: "minmax(0,190px) 1fr 34px", gap: 8, alignItems: "center", fontSize: 12.5, fontWeight: 800 }}><span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={rdSkTip(s)}>{rdSkTitle(s)}</span><div className="rl-bar"><i style={{ width: `${s.st / skMax * 100}%`, background: `linear-gradient(90deg,${GOLD},#b45309)` }} /></div><b>{ar(s.st)}</b></div>)}</div>}</div>
      </div>
      <div className="rl-card" style={{ overflowX: "auto", padding: 8 }}><b style={{ color: NAVY, padding: 6, display: "block" }}>📊 مقارنة الفصول</b><table className="rl-tbl"><thead><tr><th>الفصل</th><th>الطلاب</th><th>المختبرون</th><th>متوسط الدرجة</th><th>الدقة</th><th>ك/د</th><th>توزيع المستويات</th>{RD_LV.map(l => <th key={l.k}>{l.ic}</th>)}<th>معلم لغتي</th></tr></thead>
        <tbody>{byCls.sort((a, b) => (b.avg ?? -1) - (a.avg ?? -1)).map(c => <tr key={c.ck}><td style={{ fontWeight: 900 }}>{api.maClassName(c.ck)}</td><td>{ar(c.n)}</td><td style={{ color: c.t < c.n ? "#b45309" : "#15803d", fontWeight: 800 }}>{ar(c.t)}</td><td><b>{c.avg == null ? "—" : ar(c.avg)}</b></td><td>{c.acc == null ? "—" : ar(c.acc) + "٪"}</td><td>{c.wcpm == null ? "—" : ar(c.wcpm)}</td><td style={{ minWidth: 130 }}><div className="rl-stk">{c.lv.map((n, i) => <i key={i} style={{ width: `${c.t ? n / c.t * 100 : 0}%`, background: RD_LV[i].c }} />)}</div></td>{c.lv.map((n, i) => <td key={i} style={{ color: RD_LV[i].c, fontWeight: 900 }}>{ar(n)}</td>)}<td style={{ fontSize: 12 }}>{arT(c.ck) || "—"}</td></tr>)}</tbody></table></div>
      <div className="rl-card" style={{ fontSize: 12.5, lineHeight: 2, fontWeight: 700, color: "#475569" }}><b style={{ color: NAVY }}>📏 معايير التقييم</b><br />الدرجة = ٦٠٪ دقة القراءة + ٢٥٪ الطلاقة (كلمة صحيحة في الدقيقة مقارنة بالمستهدف: الأول ٩٠، الثاني ١٠٠، الثالث ١١٠) + ١٥٪ إكمال النص. {RD_LV.map(l => `${l.t}: ${l.min ? ar(l.min) + " فأكثر" : "أقل من ٥٠"}`).join(" • ")}. لا يُصنّف الطالب «متقناً» إذا قلت دقته عن ٩٠٪، ولا «متمكناً» إذا قلت عن ٨٠٪، ويُعد ضعفاً شديداً إذا قلت عن ٦٠٪.</div>
    </div>; };

  // ── النصوص
  const textsTab = () => <div style={{ display: "grid", gap: 10 }}>
    <div className="rl-card" style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}><button className="rl-btn p" onClick={() => setEdit({})}>➕ نص قراءة جديد</button><button className="rl-btn" onClick={() => { try { navigator.clipboard.writeText(`📖 اختبار القراءة الجهرية — ادخل برقم هويتك واقرأ النص بصوتك:\n${link}`); say("✅ نُسخ رابط الطلاب"); } catch {} }}>🔗 نسخ رابط الطلاب</button><span className="rl-note" dir="ltr">{link}</span></div>
    {!texts.length ? <div className="rl-card" style={{ textAlign: "center", fontWeight: 800, color: "#64748b" }}>لا توجد نصوص بعد — أضف النص الأول وسجّل قراءتك النموذجية</div> :
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 10 }}>{texts.map(t => { const n = Object.keys(obj(RES[t.id])).length; const canEd = admin || t.by === by;
        return <div key={t.id} className="rl-card" style={{ display: "grid", gap: 6, borderTop: `5px solid ${t.open === 0 ? "#94a3b8" : GOLD}` }}>
          <b style={{ fontSize: 15.5, color: NAVY }}>📄 {t.title}</b><div style={{ fontFamily: "Amiri,serif", fontSize: 16, color: "#475569", maxHeight: 62, overflow: "hidden" }}>{t.body}</div>
          <div className="rl-note">{ar(t.words || rdTokens(t.body).length)} كلمة • {t.lv ? `الصف ${["", "الأول", "الثاني", "الثالث"][+t.lv]}` : "جميع الصفوف"}{arr(t.cls).length ? ` • ${arr(t.cls).map(api.maClassName).join("، ")}` : ""} • {t.aud ? "🎧 نموذجية" : "بلا قراءة نموذجية"} • {ar(n)} طالب • {t.open === 0 ? "🔒 مغلق" : "🟢 متاح"}</div>
          <div className="rl-note" style={{ fontSize: 11.5 }}>👤 {t.by}</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}><button className="rl-btn sm p" onClick={() => { setTid(t.id); setTab("res"); }}>📋 النتائج</button>{canEd && <><button className="rl-btn sm" onClick={() => setEdit(t)}>✏️ تعديل</button><button className="rl-btn sm" onClick={async () => { await api.maPut(`${N.TXT}/${t.id}/open`, t.open === 0 ? 1 : 0); load(); }}>{t.open === 0 ? "🟢 فتح" : "🔒 إغلاق"}</button><button className="rl-btn sm red" onClick={() => delText(t)}>🗑️</button></>}</div>
        </div>; })}</div>}
  </div>;

  return <div className="rl" style={{ display: "grid", gap: 12 }}><style>{CSS}</style>
    <div className="rl-tabs">{tabs.map(([k, l]) => <button key={k} className={`rl-tab ${tab === k ? "on" : ""}`} onClick={() => setTab(k)}>{l}</button>)}</div>
    {myCls && !admin && <div className="rl-note">📌 تظهر فصولك حسب الجدول المدرسي: {myCls.map(api.maClassName).join("، ")}</div>}
    {tab === "dash" && dashTab()}{tab === "res" && resTab()}{tab === "weak" && weakTab()}{tab === "texts" && textsTab()}
    {edit && <TextEditor api={api} init={edit} classes={R.classes} by={by} onClose={() => setEdit(null)} onSaved={v => { setEdit(null); say("✅ تم حفظ النص"); setTid(v.id); load(); }} />}
    {rv && (rv.text || text) && <Review api={api} text={rv.text || text} stu={rv.stu} rec={rv.rec} tryId={rv.tryId} by={by} onClose={() => setRv(null)} onSaved={(R, k) => { setRv(null); say(k === "rej" ? "🚫 رُفض التسجيل — سيُطلب من الطالب إعادة القراءة" : "✅ تم اعتماد التقييم"); load(); }} />}
    {det && <div className="rl-modal" onClick={e => e.target === e.currentTarget && setDet(null)}><div style={{ display: "grid", gap: 10 }}><div style={{ display: "flex", alignItems: "center", gap: 8 }}><b style={{ flex: 1, fontSize: 17, color: NAVY }}>{det.stu.name} — {det.text.title}</b>{(() => { const x = AG.L.find(y => y.sid === det.stu.id && y.ck === det.stu.ck); return x && x.M ? <button className="rl-btn sm p" onClick={() => printStudent(api, x, texts, by)}>🖨️ بطاقة الطالب</button> : null; })()}<button className="rl-btn sm" onClick={() => setDet(null)}>✕</button></div><ResultCard text={det.text} tr={det.tr} refT={rdTokens(det.text.body)} onWord={i => speak(rdTokens(det.text.body)[i].d)} saud={detAud} staff />{det.tr.aud && !detAud ? <div className="rl-note">⏳ جارٍ تحميل تسجيل الطالب…</div> : null}</div></div>}
    <Toast m={toast} />
  </div>;
}

export function ReadingTeacher({ me, api, admin = false }) { return <ReadingStaff me={me} api={api} admin={admin} />; }
export function ReadingAdmin({ by = "الإدارة", api }) { return <ReadingStaff me={{ name: by }} api={api} admin />; }
