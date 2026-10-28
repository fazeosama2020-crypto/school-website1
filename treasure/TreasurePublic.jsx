// ══════════════════════════════════════════════════════════
// 🗺️ رحلة الكنز: طريقي إلى نافس — بوابة الطالب (#treasure)
// تُحمَّل عند فتح الرابط فقط (React.lazy) فلا تؤثر على سرعة بقية الموقع
// ══════════════════════════════════════════════════════════
import React, { useEffect, useMemo, useRef, useState } from "react";
import { TR_CFG, TR_PROG, TR_TOTAL, TR_PASS, passOf, isPassed, TR_SCHOOL, WORLDS, worldOf, READY, DEMO_H, SKILLS, loadStage, SUBJ, LEVELS, HOTS, hotsOf, Rich, Fig, ar, shuffleIdx, starsOf, arr, obj, lsGet, lsSet, beep, useFonts, BASE_CSS } from "./core.jsx";

const LET = ["أ", "ب", "ج", "د"];
const normId = v => String(v ?? "").replace(/[٠-٩]/g, d => "٠١٢٣٤٥٦٧٨٩".indexOf(d)).replace(/\D/g, "");

export default function TreasurePublic({ onBack, api }) {
  useFonts();
  const [cfg, setCfg] = useState(null);
  const [me, setMe] = useState(null);
  const [prog, setProg] = useState(null);
  const [view, setView] = useState("boot"); // boot | login | map | play
  const [stage, setStage] = useState(null);
  const [loadingStage, setLoadingStage] = useState(0);
  const [mute, setMute] = useState(() => lsGet("tr-mute", false));
  const [playId, setPlayId] = useState(0);
  const [demo, setDemo] = useState(false);
  const [intro, setIntro] = useState(false);
  const [kg, setKg] = useState(null); // 🗝️ بوابة المفتاح بين مرحلتين {stage, qs, next}

  const avail = demo ? READY : Math.min(READY, cfg && +cfg.upTo ? +cfg.upTo : READY);

  useEffect(() => { (async () => {
    const c = obj(await api.maGet(TR_CFG)); setCfg({ open: c.open !== false, upTo: +c.upTo || READY, onlyG3: c.onlyG3 !== false, demo: arr(c.demo).map(d => d && d.h).filter(Boolean) });
    const saved = lsGet("tr-me", null);
    if (saved && saved.demo && Date.now() - (saved.at || 0) < 30 * 864e5) { enterDemo(); return; }
    if (saved && saved.sid && saved.ck && Date.now() - (saved.at || 0) < 30 * 864e5) {
      const r = obj(await api.maGet(`${api.MA_ROSTER}/${saved.ck}`)); const st = arr(r.students).find(x => x.id === saved.sid);
      if (st) { await enter({ ...st, ck: saved.ck }); return; }
    }
    setView("login");
  })(); }, []);

  async function enter(st) {
    const sid = st.id; const p = obj(await api.maGet(`${TR_PROG}/${sid}`));
    const base = { sid, name: st.name, ck: st.ck, n4: st.n4 || "", unlocked: 1, stars: {}, best: {}, start: Date.now() };
    const rec = { ...base, ...p, name: st.name, ck: st.ck, n4: st.n4 || p.n4 || "" };
    setMe({ id: sid, name: st.name, ck: st.ck, n4: st.n4 || "" }); setProg(rec);
    lsSet("tr-me", { sid, ck: st.ck, at: Date.now() }); setView("map"); setDemo(false);
    if (!lsGet("tr-intro-" + sid, false)) setIntro(true);
    try { api.logLogin && api.logLogin({ sid, name: st.name, ck: st.ck, n4: st.n4 || "" }, "treasure"); } catch {}
  }
  // 👨‍🏫 وضع الشرح: كل المراحل مفتوحة، ولا يُحفظ شيء في سجلات الطلاب ولا يظهر في المتابعة
  function enterDemo() {
    setMe({ id: "demo", name: "وضع الشرح", ck: "", n4: "" }); setProg({ sid: "demo", unlocked: TR_TOTAL, stars: {}, best: {}, start: Date.now() });
    setDemo(true); lsSet("tr-me", { demo: true, at: Date.now() }); setView("map");
  }
  const logout = () => { lsSet("tr-me", null); setMe(null); setProg(null); setDemo(false); setView("login"); };
  const closeIntro = () => { setIntro(false); if (me && !demo) lsSet("tr-intro-" + me.id, true); };

  async function play(n, viaGate) {
    // 🗝️ قبل أول دخول لمرحلة جديدة: بوابة المفتاح من أسئلة المرحلة السابقة (مرة واحدة لكل مرحلة)
    if (!viaGate && !demo && n > 1 && prog && isPassed(obj(prog.best[n - 1])) && !obj(prog.best)[n] && !obj(prog.gem)[n - 1]) {
      setLoadingStage(n); const p = await loadStage(n - 1); setLoadingStage(0);
      if (p) { openGate(p, null, null, n); return; }
    }
    setLoadingStage(n); const s = await loadStage(n); setLoadingStage(0);
    if (!s) { alert("محتوى هذه المرحلة يُجهَّز قريباً"); return; }
    beep("click"); setPlayId(x => x + 1); setStage(s); setView("play"); window.scrollTo(0, 0);
  }

  function openGate(st, items, res, next) { beep("gate"); setKg({ stage: st, qs: kgPick(st, items, res, (+obj(obj(prog && prog.best)[st.n]).tries || 0) + Date.now() % 5), next }); setView("gate"); window.scrollTo(0, 0); }
  // ⏸️ حفظ التقدّم داخل المرحلة بعد كل سؤال — ليكمل الطالب من حيث توقف (من أي جهاز)
  async function saveCur(c) {
    if (demo || !prog) return; setProg(p => ({ ...p, cur: c })); lsSet("tr-cur-" + me.id, c);
    try { await api.maPut(`${TR_PROG}/${me.id}/cur`, c); } catch {}
  }
  const curOf = n => { if (demo || !prog || !me) return null; const a = obj(prog.cur), b = obj(lsGet("tr-cur-" + me.id, null)); const c = (+b.at || 0) > (+a.at || 0) ? b : a; return c && +c.n === +n && arr(c.res).length ? c : null; };
  async function takeGem(n) {
    if (demo || !prog) return; const gem = { ...obj(prog.gem), [n]: Date.now() }; const rec = { ...prog, gem }; setProg(rec);
    try { await api.maPut(`${TR_PROG}/${me.id}/gem`, gem); } catch {}
  }
  async function finish(res) {
    const n = stage.n; const old = obj(prog.best && prog.best[n]); const tries = (+old.tries || 0) + 1;
    const better = !old.sc || res.sc >= old.sc;
    const best = { ...obj(prog.best), [n]: better ? { ...res, tries, ts: Date.now() } : { ...old, tries, lastSc: res.sc, sk: res.sk, ts: Date.now() } };
    const ok = res.sc >= passOf(res.of);
    const stars = { ...obj(prog.stars), [n]: Math.max(+obj(prog.stars)[n] || 0, starsOf(res.sc, res.of)) };
    const unlocked = Math.max(+prog.unlocked || 1, ok ? Math.min(TR_TOTAL, n + 1) : 1);
    const rec = { ...prog, best, stars, unlocked, last: Date.now(), done: Math.max(+prog.done || 0, ok ? n : 0) }; delete rec.cur;
    setProg(rec); if (!demo) { lsSet("tr-cur-" + me.id, null); await api.maPut(`${TR_PROG}/${me.id}`, rec); }
    return { tries, unlockedNew: unlocked > (+prog.unlocked || 1) };
  }

  const toggleMute = () => { const v = !mute; setMute(v); lsSet("tr-mute", v); };

  return <div className="tr-root tr-pub"><style>{BASE_CSS + PUB_CSS + KG_CSS + RS_CSS}</style>
    {view === "boot" && <div className="tr-boot"><div className="tr-compass">🧭</div><b className="tr-disp">جارٍ تجهيز الخريطة…</b></div>}
    {view === "login" && <Login api={api} cfg={cfg} onEnter={enter} onDemo={enterDemo} onBack={onBack} />}
    {view === "map" && cfg && !cfg.open && <Closed onBack={onBack} />}
    {view === "map" && cfg && cfg.open && <MapView me={me} prog={prog} avail={avail} demo={demo} loading={loadingStage} onPlay={play} curOf={curOf} onLogout={logout} onBack={onBack} mute={mute} toggleMute={toggleMute} onIntro={() => setIntro(true)} />}
    {view === "map" && intro && <Journey name={demo ? "" : me && me.name} onClose={closeIntro} />}
    {view === "play" && stage && <Player key={playId} stage={stage} prog={prog} avail={avail} demo={demo} mute={mute} toggleMute={toggleMute} onFinish={finish} saved={curOf(stage.n)} onSave={saveCur} onExit={() => { setView("map"); setStage(null); }} onNext={n => play(n)} onGate={(items, res, n) => (demo || obj(prog.gem)[n - 1] || obj(prog.best)[n]) ? play(n, true) : openGate(stage, items, res, n)} />}
    {view === "gate" && kg && <KeyGate key={kg.stage.n} stage={kg.stage} qs={kg.qs} nextN={kg.next} demo={demo} onGem={() => takeGem(kg.stage.n)} onEnter={n => { setKg(null); play(n, true); }} onMap={() => { setKg(null); setView("map"); }} />}
  </div>;
}

// ══════════ الدخول برقم الهوية ══════════
function Login({ api, cfg, onEnter, onDemo, onBack }) {
  const [id, setId] = useState(""); const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  const go = async () => {
    const n = normId(id); if (n.length !== 10) { setErr("رقم الهوية يتكوّن من ١٠ أرقام"); return; }
    setBusy(true); setErr("");
    try {
      const h = await api.stuHash(n);
      if (DEMO_H.includes(h) || arr(cfg && cfg.demo).includes(h)) { beep("start"); onDemo(); return; }
      const ros = obj(await api.maGet(api.MA_ROSTER)); let found = null;
      Object.entries(ros).forEach(([ck, r]) => arr(r && r.students).forEach(st => { if (!found && st && st.nh === h) found = { ...st, ck }; }));
      if (!found) { setErr("لم نجد هذا الرقم في كشوف الطلاب. تأكد من الرقم أو راجع إدارة المدرسة."); setBusy(false); return; }
      if (cfg && cfg.onlyG3 && !String(found.ck).startsWith("3-")) { setErr("هذه الرحلة مخصصة لطلاب الصف الثالث المتوسط 🌟"); setBusy(false); return; }
      await onEnter(found);
    } catch { setErr("تعذّر الاتصال، حاول مرة أخرى"); setBusy(false); }
  };
  return <div className="tr-login">
    <div className="tr-stars-bg" aria-hidden="true">{Array.from({ length: 28 }, (_, i) => <i key={i} style={{ top: (i * 37) % 100 + "%", left: (i * 61) % 100 + "%", animationDelay: (i % 7) * .4 + "s" }} />)}</div>
    <div className="tr-login-card">
      <div className="tr-login-map" aria-hidden="true">
        <svg viewBox="0 0 220 120"><path d="M14 100 C 50 20, 90 110, 120 55 S 190 30, 205 18" fill="none" stroke="#b45309" strokeWidth="3" strokeDasharray="7 7" strokeLinecap="round" /><text x="196" y="30" fontSize="22">❌</text><text x="4" y="112" fontSize="18">🧭</text></svg>
      </div>
      <small className="tr-school">{TR_SCHOOL}</small>
      <h1 className="tr-disp tr-title">رحلة الكنز</h1>
      <div className="tr-sub">طريقي إلى نافس • الصف الثالث المتوسط</div>
      <p className="tr-lead">من <b>مدرسة الأمير عبدالمجيد</b> ننطلق إلى <b>جزيرة كنز نافس</b> 🏝️<br />٢٥ مرحلة • ٥ عوالم • القراءة والرياضيات والعلوم<br />اجمع المفاتيح وافتح الصناديق حتى تصل إلى الكنز الكبير 🏆</p>
      <label className="tr-lbl">رقم الهوية (السجل المدني)</label>
      <input className="tr-inp" inputMode="numeric" dir="ltr" maxLength={14} value={id} placeholder="1xxxxxxxxx" onChange={e => { setId(e.target.value); setErr(""); }} onKeyDown={e => e.key === "Enter" && go()} autoFocus />
      {err && <div className="tr-err">{err}</div>}
      <button className="tr-btn tr-gold tr-big" disabled={busy} onClick={go}>{busy ? "جارٍ التحقق…" : "🗝️ ابدأ رحلتي"}</button>
      {onBack && <button className="tr-link" onClick={onBack}>العودة لموقع المدرسة</button>}
    </div>
  </div>;
}

function Closed({ onBack }) {
  return <div className="tr-login"><div className="tr-login-card"><div style={{ fontSize: 56 }}>🌙</div><h2 className="tr-disp" style={{ fontSize: 28, margin: "6px 0" }}>الرحلة مغلقة الآن</h2><p className="tr-lead">ستفتح إدارة المدرسة الرحلة قريباً — استعد يا بطل!</p>{onBack && <button className="tr-btn tr-gold" onClick={onBack}>العودة للموقع</button>}</div></div>;
}

// ══════════ الخريطة ══════════
const XS = [74, 30, 66, 24, 58];
function MapView({ me, prog, avail, demo, loading, onPlay, onLogout, onBack, mute, toggleMute, onIntro, curOf }) {
  const cur = demo ? TR_TOTAL : Math.min(+prog.unlocked || 1, TR_TOTAL); const stars = obj(prog.stars);
  const totalStars = Object.values(stars).reduce((a, b) => a + (+b || 0), 0);
  const keys = Object.keys(obj(prog.best)).filter(k => isPassed(obj(prog.best[k]))).length;
  const curRef = useRef(null);
  useEffect(() => { setTimeout(() => { try { curRef.current && curRef.current.scrollIntoView({ behavior: "smooth", block: "center" }); } catch {} }, 350); }, []);
  return <div className="tr-map">
    <header className="tr-hud">
      <div className="tr-hud-me"><span className="tr-avatar">{demo ? "👨‍🏫" : "🧭"}</span><div><b>{demo ? "وضع الشرح" : me.name.split(" ").slice(0, 2).join(" ")}</b><small>{demo ? "للمعلم • لا يُحتسب" : "المستكشف • " + ar(me.ck.replace("3-", "ثالث/"))}</small></div></div>
      <div className="tr-hud-stats"><span title="المفاتيح">🗝️ {ar(keys)}</span><span title="النجوم">⭐ {ar(totalStars)}</span><span className="gem" title="الجواهر">💎 {ar(Object.keys(obj(prog.gem)).length)}</span></div>
      <div className="tr-hud-act"><button onClick={onIntro} title="قصة الرحلة">📜</button><button onClick={toggleMute} title="الصوت">{mute ? "🔇" : "🔊"}</button><button onClick={onLogout} title="خروج">🚪</button></div>
    </header>
    {demo && <div className="tr-demo-bar">👨‍🏫 <b>وضع الشرح:</b> جميع المراحل مفتوحة • داخل كل سؤال لوحة تُظهر التلميحة والحل والشرح والسؤال التوأم • لا يُحفظ شيء ولا يظهر في متابعة الطلاب</div>}
    <div className="tr-map-title"><h1 className="tr-disp">رحلة الكنز</h1><p>من مدرسة الأمير عبدالمجيد إلى جزيرة كنز نافس — ٢١ سؤالاً في كل مرحلة، تحتاج ١٤ لتعبر</p></div>
    <HuntCard done={+prog.done || 0} />
    <div className="tr-start-pt"><span className="tr-school-ic">🏫</span><div><small>نقطة الانطلاق</small><b className="tr-disp">مدرسة الأمير عبدالمجيد</b></div><span className="tr-start-flag">🚩</span></div>
    {WORLDS.map(w => {
      const done = Array.from({ length: 5 }, (_, i) => w.from + i).every(n => isPassed(obj(prog.best[n])));
      const H = 5 * 118 + 60;
      const pts = XS.map((x, i) => [x, 84 + i * 118]);
      const d = pts.map(([x, y], i) => i === 0 ? `M ${x} ${y}` : `C ${pts[i - 1][0]} ${y - 70}, ${x} ${pts[i - 1][1] + 70}, ${x} ${y}`).join(" ");
      return <section key={w.n} className="tr-world" style={{ "--w1": w.c1, "--w2": w.c2, "--ws": w.soft, "--wsky": w.sky }}>
        <div className="tr-world-head"><span className="tr-world-ic">{w.icon}</span><div><small>العالم {ar(w.n)}</small><b className="tr-disp">{w.name}</b></div><span className={"tr-world-badge" + (done ? " on" : "")} title={w.badgeName}>{done ? w.badge : "🔒"}</span></div>
        <div className="tr-world-body" style={{ height: H }}>
          <Decor w={w.n} />
          <svg className="tr-path" viewBox={`0 0 100 ${H}`} preserveAspectRatio="none" aria-hidden="true"><path d={d} fill="none" stroke="rgba(120,53,15,.35)" strokeWidth="9" strokeLinecap="round" vectorEffect="non-scaling-stroke" /><path d={d} fill="none" stroke="#fff8e7" strokeWidth="3" strokeDasharray="2 10" strokeLinecap="round" vectorEffect="non-scaling-stroke" /></svg>
          {pts.map(([x, y], i) => {
            const n = w.from + i; const b = obj(prog.best[n]); const passed = isPassed(b);
            const open = n <= cur; const soon = open && n > avail; const isCur = !demo && open && !passed && !soon;
            const st = +stars[n] || 0;
            return <div key={n} ref={isCur ? curRef : null} className={"tr-node" + (open ? " open" : "") + (passed ? " passed" : "") + (isCur ? " cur" : "") + (soon ? " soon" : "")} style={{ left: x + "%", top: y }}>
              {isCur && <span className="tr-me-pin">🧭</span>}
              {curOf && curOf(n) && <span className="tr-paused" title="مرحلة متوقفة — اضغط لتكمل">⏸️ {ar(Math.min(+curOf(n).i + 1, 21))}</span>}
              <button disabled={!open || soon || !!loading} onClick={() => onPlay(n)} aria-label={"المرحلة " + n}>
                {loading === n ? <span className="tr-spin">⏳</span> : !open ? "🔒" : <span className="tr-disp">{ar(n)}</span>}
              </button>
              <div className="tr-node-stars">{open && !soon ? [1, 2, 3].map(k => <i key={k} className={k <= st ? "on" : ""}>★</i>) : soon ? <small>قريباً</small> : null}</div>
            </div>;
          })}
        </div>
        <div className={"tr-chest" + (done ? " open" : "")}><span>{done ? "🏆" : "🧰"}</span><div><b>{done ? w.badgeName + " — مبروك!" : "صندوق " + w.name}</b><small>{done ? "أنهيت مراحل هذا العالم كلها" : `أنهِ المراحل ${ar(w.from)}–${ar(w.to)} لتفتحه`}</small></div></div>
      </section>;
    })}
    <div className={"tr-final" + ((+prog.done || 0) >= TR_TOTAL ? " won" : "")}><div className="tr-final-chest">{(+prog.done || 0) >= TR_TOTAL ? "👑" : "💎"}</div><b className="tr-disp">جزيرة كنز نافس</b><small>{(+prog.done || 0) >= TR_TOTAL ? "وصلت إلى الكنز… أنت بطل نافس! 🎉" : "الكنز الكبير في نهاية الطريق… هل تصل إليه؟"}</small>{(+prog.done || 0) >= TR_TOTAL && !demo && <button className="tr-btn tr-gold" style={{ marginTop: 10 }} onClick={() => printCert(me, prog)}>🎓 اطبع شهادة «بطل نافس»</button>}</div>
    {onBack && <div style={{ textAlign: "center", padding: "10px 0 30px" }}><button className="tr-link" onClick={onBack}>العودة لموقع المدرسة</button></div>}
  </div>;
}

function Decor({ w }) {
  const set = { 1: ["🌴", "🌿", "💧", "🌴", "🦜", "🌺"], 2: ["🌵", "🐪", "☀️", "🏜️", "🦂", "🌵"], 3: ["🏔️", "🦅", "❄️", "🌲", "⛰️", "🪨"], 4: ["🏙️", "🚇", "🤖", "🛰️", "💡", "🚁"], 5: ["🌊", "🐚", "🦀", "⚓", "🐠", "🏝️"] }[w] || [];
  const pos = [[8, 9], [86, 22], [12, 40], [88, 58], [6, 76], [84, 90]];
  return <div className="tr-decor" aria-hidden="true">{set.map((e, i) => <span key={i} style={{ right: pos[i][0] + "%", top: pos[i][1] + "%", animationDelay: i * .7 + "s" }}>{e}</span>)}</div>;
}

// ══════════ لاعب المرحلة ══════════
function swapTwin(q) { return q.t ? { ...q, q: q.t.q, fig: q.t.fig, o: q.t.o, a: q.t.a, e: q.t.e, t: { q: q.q, fig: q.fig, o: q.o, a: q.a, e: q.e } } : q; }

// عبارات التحفيز
const PRAISE = ["أحسنت! 🌟", "رائع يا بطل! 🔥", "إجابة ذكية! 💡", "ممتاز! 🎯", "عبقري! 🧠", "هكذا يفكر العلماء! 🔬", "ضربة معلّم! 🏹", "مستكشف حقيقي! 🧭", "تألّق! ✨", "إجابة ذهبية! 🪙", "لا شيء يوقفك! 🚀", "الكنز يقترب! 🏝️"];
const STREAK = { 3: "🔥 ثلاث متتالية! سلسلة نارية", 5: "⚡ خمس متتالية! لا أحد يوقفك", 7: "🌪️ سبع متتالية! إعصار المعرفة", 10: "👑 عشر متتالية! أسطورة نافس", 15: "💎 مرحلة كاملة بلا خطأ!" };
const OOPS = ["لا تقلق… حتى الأبطال يتعثرون 💪", "قريب جداً! خذ هذه التلميحة 💡", "فرصة ثانية تنتظرك 🔄", "فكّر بطريقة أخرى… أنت قادر 🧭"];

function Player({ stage, prog, avail, demo, mute, toggleMute, onFinish, onExit, onNext, onGate, saved, onSave }) {
  const w = worldOf(stage.n); const [tries] = useState(() => +obj(prog.best[stage.n]).tries || 0);
  const items = useMemo(() => {
    const L = [...stage.read.qs.map(q => ({ ...q, sub: "r" })), ...stage.math.map(q => ({ ...q, sub: "m" })), ...stage.sci.map(q => ({ ...q, sub: "s" }))];
    return L.map(q => tries % 2 ? swapTwin(q) : q);
  }, [stage, tries]);
  const [i, setI] = useState(0);
  const [gate, setGate] = useState("intro"); // intro | gate | q | done
  const [phase, setPhase] = useState("ask"); // ask | ok | wrong | twin | twinok | twinbad
  const [pick, setPick] = useState(null);
  const [res, setRes] = useState([]); // [j] = {v:1|.5|0, first:bool}
  const [showText, setShowText] = useState(true);
  const [confirmExit, setConfirmExit] = useState(false);
  const [summary, setSummary] = useState(null);
  const [fx, setFx] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [toast, setToast] = useState(null);
  const [rev, setRev] = useState({}); // وضع الشرح: {h: تلميحة, s: حل}
  const [hintOn, setHintOn] = useState(false);
  const [party, setParty] = useState(null); // {k, kind}
  const topRef = useRef(null);
  const sv = saved && +saved.tries === tries && arr(saved.res).length ? saved : null; // تقدّم محفوظ لنفس نسخة الأسئلة
  const [resumed, setResumed] = useState(false);

  const q = items[i]; const sub = SUBJ[q.sub];
  const isTwin = phase === "twin" || phase === "twinok" || phase === "twinbad";
  const cq = isTwin ? { ...q.t, k: q.k } : q;
  const order = useMemo(() => shuffleIdx(cq.o.length, tries * 31 + i * 7 + (isTwin ? 3 : 1)), [i, isTwin, tries]);
  const score = res.reduce((a, r) => a + (r ? r.v : 0), 0);
  const left = items.length - 1 - i; const N = items.length; const P = passOf(N);
  const per = { r: items.filter(x => x.sub === "r").length, m: items.filter(x => x.sub === "m").length, s: items.filter(x => x.sub === "s").length };
  const celebrate = kind => setParty({ k: Date.now(), kind });

  const scrollTop = () => { try { topRef.current && topRef.current.scrollIntoView({ behavior: "smooth", block: "start" }); } catch {} };
  const pop = (t, ms = 2600) => { setToast(t); setTimeout(() => setToast(x => x === t ? null : x), ms); };
  const record = (v, first) => setRes(r => { const c = [...r]; c[i] = { v, first }; if (!demo && onSave) onSave({ n: stage.n, tries, i: i + 1, res: c.map(x => x || { v: 0, first: false }), at: Date.now() }); return c; });
  const gotKey = add => { if (score < P && score + add >= P) setTimeout(() => { beep("key"); setTimeout(() => beep("fireworks"), 500); celebrate("party"); pop("🗝️ حصلت على مفتاح المرحلة التالية! أكمل لتجمع النجوم ⭐", 3400); }, 450); };
  const check = () => {
    if (pick === null) return; const ok = +pick === +cq.a;
    if (!isTwin) {
      if (ok) {
        const st = streak + 1; setStreak(st); setBestStreak(b => Math.max(b, st));
        setPhase("ok"); record(1, true); setFx(x => x + 1);
        if (st >= 3) { beep("streak", st - 3); if (STREAK[st]) { pop(STREAK[st]); celebrate("balloons"); setTimeout(() => beep("pop"), 900); } else celebrate("petals"); } else { beep("ok"); celebrate("petals"); }
        gotKey(1);
      }
      else { setStreak(0); if (q.t) { setPhase("wrong"); beep("bad"); setTimeout(() => beep("hint"), 380); } else { setPhase("twinbad"); record(0, false); beep("bad"); } }
    } else {
      if (ok) { setPhase("twinok"); record(.5, false); beep("twin"); setFx(x => x + 1); celebrate("petals"); gotKey(.5); }
      else { setPhase("twinbad"); record(0, false); beep("bad"); }
    }
  };
  const toTwin = () => { setPick(null); setPhase("twin"); setHintOn(false); beep("click"); scrollTop(); };
  const go = j => { setI(j); setPick(null); setPhase("ask"); setRev({}); setHintOn(false); setGate("q"); beep("click"); scrollTop(); };
  const complete = async R => { const by = s => R.filter((r, j) => r && items[j].sub === s).reduce((a, r) => a + r.v, 0);
      const sk = {}; items.forEach((it, j) => { const k = it.k || "?"; sk[k] = sk[k] || [0, 0]; sk[k][1]++; if (R[j] && R[j].first) sk[k][0]++; });
      const out = { sc: R.reduce((a, r) => a + (r ? r.v : 0), 0), r: by("r"), m: by("m"), s: by("s"), first: R.filter(r => r && r.first).length, sk, of: N, per: per.r };
      beep("drum"); setGate("done"); setSummary({ ...out, streak: bestStreak, saving: true });
      const meta = await onFinish(out); setSummary({ ...out, ...meta, streak: bestStreak, saving: false });
      window.scrollTo(0, 0);
  };
  const resume = () => { const R = arr(sv.res).map(x => ({ v: +obj(x).v || 0, first: !!obj(x).first })); setRes(R); setResumed(true); beep("start");
    const ni = Math.min(+sv.i || R.length, items.length); if (ni >= items.length) { complete(R); return; }
    setI(ni); setPick(null); setPhase("ask"); setGate(ni === 0 || items[ni].sub !== items[ni - 1].sub ? "gate" : "q"); scrollTop(); };
  const next = async () => {
    setPick(null); setPhase("ask"); setRev({}); setHintOn(false);
    if (i + 1 >= items.length) { await complete([...res]); return; }
    const ni = i + 1; setI(ni);
    if (items[ni].sub !== q.sub && !demo) setGate("gate"); else { if (demo) setGate("q"); scrollTop(); }
  };

  if (gate === "done" && summary) return <Result stage={stage} w={w} s={summary} per={per} avail={avail} demo={demo} onExit={onExit} onNext={n => onGate ? onGate(items, res, n) : onNext(n)} />;

  const done = phase !== "ask" && phase !== "twin";
  return <div className="tr-play" style={{ "--w1": w.c1, "--w2": w.c2, "--ws": w.soft, "--wsky": w.sky, "--sc": sub.c, "--ss": sub.soft }}>
    <header className="tr-play-hud" ref={topRef}>
      <button className="tr-x" onClick={() => setConfirmExit(true)} aria-label="خروج">✕</button>
      <div className="tr-play-t"><small>{w.icon} {w.name}{demo ? " • 👨‍🏫 وضع الشرح" : ""}</small><b className="tr-disp">المرحلة {ar(stage.n)}: {stage.title}</b></div>
      <button className="tr-mute" onClick={toggleMute} aria-label="الصوت">{mute ? "🔇" : "🔊"}</button>
      <div className="tr-coins" key={fx}><span>🪙</span>{ar(score)}</div>
    </header>
    <div className="tr-dots">{items.map((it, j) => { const r = res[j]; return <i key={j} onClick={demo ? () => go(j) : undefined} className={(j === i && gate === "q" ? "cur " : "") + (r ? (r.v === 1 ? "ok" : r.v ? "half" : "bad") : "") + (j > 0 && items[j - 1].sub !== it.sub ? " gap" : "") + (demo ? " nav" : "")} style={{ "--c": SUBJ[it.sub].c }} />; })}</div>
    {gate === "q" && <div className="tr-meter"><div className="tr-meter-row"><div className="tr-meter-bar"><i style={{ width: Math.min(100, score / P * 100) + "%" }} /></div><span className={"tr-meter-key" + (score >= P ? " on" : "")}>{score >= P ? "🗝️" : "🔒"}</span>{streak >= 2 && <span className="tr-combo" key={streak}>🔥 ×{ar(streak)}</span>}</div><small>{score >= P ? `🗝️ المفتاح معك! باقي ${ar(left + (done ? 0 : 1))} أسئلة لجمع النجوم` : `تحتاج ${ar(P - score)} لتعبر • باقي ${ar(left + (done ? 0 : 1))} أسئلة`}</small></div>}

    {gate === "intro" && <div className="tr-card tr-intro tr-pop">
      <div className="tr-intro-ic">{w.icon}</div>
      <h2 className="tr-disp">{stage.title}</h2>
      {sv && !demo ? <div className="tr-resume">
        <div className="tr-resume-h">⏸️ توقفت في هذه المرحلة عند السؤال <b>{ar(Math.min(+sv.i + 1, N))}</b> من {ar(N)} — ومعك <b>{ar(arr(sv.res).reduce((a, x) => a + (+obj(x).v || 0), 0))}</b> 🪙</div>
        <div className="tr-resume-bar"><i style={{ width: Math.min(100, (+sv.i || 0) / N * 100) + "%" }} /></div>
        <button className="tr-btn tr-gold tr-big" onClick={resume}>▶️ أكمل من حيث توقفت</button>
        <button className="tr-btn" style={{ background: "#f5f5f4" }} onClick={() => { if (window.confirm("تبدأ المرحلة من أولها؟ سيُلغى تقدّمك المحفوظ فيها.")) { onSave && onSave(null); setGate("gate"); beep("start"); } }}>🔁 ابدأ المرحلة من جديد</button>
      </div> : null}
      <p className="tr-story"><Rich t={stage.story} /></p>
      <div className="tr-gates">{["r", "m", "s"].map(k => <div key={k} style={{ "--c": SUBJ[k].c, "--s": SUBJ[k].soft }}><span>{SUBJ[k].icon}</span><b>{SUBJ[k].gate}</b><small>{SUBJ[k].name} • {ar(per[k])} أسئلة</small></div>)}</div>
      {(() => { const by = { r: [], m: [], s: [] }; items.forEach(it => { const h = hotsOf(it); if (h && !by[it.sub].includes(h)) by[it.sub].push(h); }); return <div className="tr-hots-box"><b>🧠 مهارات التفكير العليا في هذه المرحلة</b>{["r", "m", "s"].map(k => by[k].length ? <div key={k}><span style={{ color: SUBJ[k].c }}>{SUBJ[k].icon} {SUBJ[k].name}:</span> {by[k].map(h => <em key={h} title={HOTS[h].d}>{HOTS[h].ic} {HOTS[h].n}</em>)}</div> : null)}</div>; })()}
      <div className="tr-rules">✅ إجابة صحيحة = عملة كاملة 🪙 • 🔥 الإجابات المتتالية تشعل السلسلة • 💡 تلميحة متاحة في كل سؤال • ❌ خطأ؟ سؤال تعويضي بنصف عملة • تحتاج {ar(P)} من {ar(N)} لتعبر</div>
      {tries > 0 && !demo && <div className="tr-rules" style={{ background: "#fef3c7" }}>🔁 هذه محاولتك رقم {ar(tries + 1)} — الأسئلة تتغير في كل محاولة</div>}
      {demo && <div className="tr-rules" style={{ background: "#e0e7ff" }}>👨‍🏫 وضع الشرح: تنقّل بين الأسئلة بالنقاط أعلاه أو بأزرار لوحة الشرح، وأظهر التلميحة والحل متى شئت.</div>}
      {!(sv && !demo) && <button className="tr-btn tr-gold tr-big" onClick={() => { setGate(demo ? "q" : "gate"); beep("start"); }}>{demo ? "ابدأ الشرح 👨‍🏫" : "انطلق 🚀"}</button>}
    </div>}

    {gate === "gate" && <div className="tr-card tr-gatecard tr-pop" style={{ "--c": sub.c, "--s": sub.soft }}>
      <div className="tr-gate-door"><span>{sub.icon}</span></div>
      <small>البوابة {ar(q.sub === "r" ? 1 : q.sub === "m" ? 2 : 3)} من ٣</small>
      <h2 className="tr-disp">{sub.gate}</h2>
      <p>{q.sub === "r" ? "اقرأ النص بتمعّن ثم أجب — النص يبقى أمامك طوال الأسئلة" : q.sub === "m" ? "فكّر بهدوء، واكتب خطواتك في ورقة جانبية إن احتجت" : "لاحظ الرسوم والجداول جيداً، فالعالِم يستنتج من الأدلة"}</p>
      {q.sub !== "r" && <p className="tr-gate-score">🪙 جمعت حتى الآن {ar(score)} — {score >= P ? "المفتاح معك، اجمع النجوم!" : `تحتاج ${ar(P - score)} لتعبر`}</p>}
      <button className="tr-btn tr-big" style={{ background: sub.c, color: "#fff" }} onClick={() => { setGate("q"); beep("gate"); }}>ادخل البوابة ←</button>
    </div>}

    {gate === "q" && <>
      {q.sub === "r" && <div className={"tr-card tr-passage" + (showText ? "" : " closed")}>
        <button className="tr-passage-h" onClick={() => setShowText(v => !v)}><span>📜 {stage.read.title}</span><small>{showText ? "إخفاء النص ▲" : "عرض النص ▼"}</small></button>
        {showText && <div className="tr-passage-b">{stage.read.text.map((p, j) => <p key={j}><Rich t={p} /></p>)}{stage.read.fig && <Fig f={stage.read.fig} />}</div>}
      </div>}

      <div className={"tr-card tr-q " + (phase === "wrong" ? "shake" : "") + (isTwin ? " twin" : "")} key={i + (isTwin ? "t" : "")}>
        <div className="tr-q-meta">
          <span className="tr-chip" style={{ background: sub.soft, color: sub.c }}>{sub.icon} {sub.name}</span>
          <span className="tr-chip">السؤال {ar(i + 1)} / {ar(N)}</span>
          {q.lv && <span className="tr-chip lv">{LEVELS[q.lv]}</span>}
          {hotsOf(q) && <span className="tr-chip ht" title={HOTS[hotsOf(q)].d}>🧠 {HOTS[hotsOf(q)].n}</span>}
          {isTwin && <span className="tr-chip tw">🔄 سؤال تعويضي</span>}
        </div>
        <div className="tr-q-text"><Rich t={cq.q} /></div>
        <Fig f={cq.fig} />
        <div className={"tr-opts" + (cq.o.some(o => String(o).length > 28) ? " col" : "")}>
          {order.map((oi, j) => {
            const right = oi === +cq.a;
            const cls = "tr-opt" + (pick === oi ? " sel" : "") + ((done && right && phase !== "wrong") || (demo && rev.s && right) ? " right" : "") + (done && pick === oi && !right ? " wrong" : "");
            return <button key={oi} className={cls} disabled={done} onClick={() => { setPick(oi); beep("click"); }}><span className="tr-let">{LET[j]}</span><span className="tr-opt-t"><Rich t={cq.o[oi]} /></span></button>;
          })}
        </div>

        {(phase === "ask" || phase === "twin") && !demo && q.h && <div className="tr-hintbox">{hintOn ? <div className="tr-fb hint tr-pop"><b>💡 تلميحة</b><p><Rich t={q.h} /></p></div> : <button className="tr-hint-btn" onClick={() => { setHintOn(true); beep("hint"); }}>💡 أحتاج تلميحة</button>}</div>}
        {(phase === "ask" || phase === "twin") && <button className="tr-btn tr-big tr-check" disabled={pick === null} onClick={check}>تحقّق ✓</button>}

        {phase === "ok" && <Feedback kind="ok" title={STREAK[streak] || PRAISE[(i * 5 + stage.n * 3 + streak) % PRAISE.length]} e={cq.e} ep={cq.ep} ht={hotsOf(q)} onNext={next} last={i === items.length - 1} />}
        {phase === "wrong" && <div className="tr-fb hint tr-pop">
          <b>{OOPS[(i + stage.n) % OOPS.length]}</b><p><b>💡 تلميحة:</b> <Rich t={q.h || "أعد قراءة السؤال وحدّد المطلوب بدقة، ثم استبعد الخيارات غير المنطقية."} /></p>
          <button className="tr-btn tr-big" style={{ background: "#7c3aed", color: "#fff" }} onClick={toTwin}>جرّب السؤال التعويضي 🔄</button>
        </div>}
        {phase === "twinok" && <Feedback kind="ok" title="عوّضتها! نصف عملة 🪙 — هذا هو الإصرار 💪" e={cq.e} ep={cq.ep} ht={hotsOf(q)} onNext={next} last={i === items.length - 1} />}
        {phase === "twinbad" && <Feedback kind="bad" title="لا بأس — كل خطأ درس جديد 💪" ans={cq.o[+cq.a]} e={cq.e} ep={cq.ep} ht={hotsOf(q)} onNext={next} last={i === items.length - 1} />}
      </div>

      {demo && <div className="tr-card tr-teach">
        <div className="tr-teach-h"><b>👨‍🏫 لوحة الشرح</b><small>{SKILLS[q.k] || ""} • {LEVELS[q.lv] || ""}</small></div>
        <div className="tr-teach-btns">
          <button className={rev.h ? "on" : ""} onClick={() => { setRev(r => ({ ...r, h: !r.h })); beep("hint"); }}>💡 التلميحة</button>
          <button className={rev.s ? "on" : ""} onClick={() => { setRev(r => ({ ...r, s: !r.s })); beep("ok"); }}>✅ الحل والشرح</button>
          {q.t && <button onClick={() => { setPick(null); setRev({}); setPhase(isTwin ? "ask" : "twin"); beep("twin"); }}>{isTwin ? "↩️ السؤال الأصلي" : "🔄 السؤال التوأم"}</button>}
          <button disabled={i === 0} onClick={() => go(i - 1)}>→ السابق</button>
          <button disabled={i === items.length - 1} onClick={() => go(i + 1)}>التالي ←</button>
        </div>
        {rev.h && <div className="tr-fb hint"><b>💡 التلميحة (خطوة البداية)</b><p><Rich t={q.h || "—"} /></p></div>}
        {rev.s && <div className="tr-fb ok"><b>✅ الإجابة: <Rich t={cq.o[+cq.a]} /></b><p className="tr-exp"><b>خطوات الحل والشرح:</b> <Rich t={cq.e} /></p>{cq.ep && <div className="tr-ep"><small>🖼️ صورة الفكرة</small><Fig f={cq.ep} /></div>}{hotsOf(q) && <p className="tr-hots">🧠 المهارة العليا: <b>{HOTS[hotsOf(q)].ic} {HOTS[hotsOf(q)].n}</b> — {HOTS[hotsOf(q)].d}</p>}</div>}
      </div>}
    </>}

    {fx > 0 && (phase === "ok" || phase === "twinok") && <Burst key={"b" + fx} plus={phase === "ok" ? "+١" : "+½"} big={streak >= 3} />}
    {toast && <div className="tr-toast tr-pop" key={toast}>{toast}</div>}
    {party && <Celebrate key={party.k} kind={party.kind} />}
    {confirmExit && <div className="tr-modal" onClick={() => setConfirmExit(false)}><div className="tr-card tr-pop" onClick={e => e.stopPropagation()} style={{ maxWidth: 360, textAlign: "center" }}><div style={{ fontSize: 40 }}>🧭</div><b className="tr-disp" style={{ fontSize: 22 }}>{demo ? "تغادر المرحلة؟" : "تريد أن تستريح؟"}</b><p style={{ color: "#78716c", fontWeight: 700, lineHeight: 1.8 }}>{demo ? "ستعود إلى الخريطة." : res.filter(Boolean).length ? <>✅ <b style={{ color: "#0f766e" }}>تقدّمك محفوظ</b>: أجبت {ar(res.filter(Boolean).length)} من {ar(N)} ومعك {ar(score)} 🪙<br />عندما تعود — من هذا الجهاز أو غيره — ستكمل من السؤال {ar(Math.min(res.filter(Boolean).length + 1, N))} مباشرة.</> : "لم تُجب عن أي سؤال بعد — ستبدأ المرحلة من أولها عندما تعود."}</p><div style={{ display: "flex", gap: 8 }}><button className="tr-btn" style={{ flex: 1, background: "#f5f5f4" }} onClick={() => setConfirmExit(false)}>أكمل الآن</button><button className="tr-btn" style={{ flex: 1, background: demo ? "#dc2626" : "#0f766e", color: "#fff" }} onClick={onExit}>{demo ? "مغادرة" : "⏸️ احفظ واخرج"}</button></div></div></div>}
  </div>;
}

function Feedback({ kind, title, e, ep, ans, ht, onNext, last }) {
  return <div className={"tr-fb tr-pop " + kind}>
    <b>{title}</b>
    {ans !== undefined && <p>الإجابة الصحيحة: <b><Rich t={ans} /></b></p>}
    {e && <p className="tr-exp"><Rich t={e} /></p>}
    {ep && <div className="tr-ep"><small>🖼️ صورة الفكرة</small><Fig f={ep} /></div>}
    {ht && HOTS[ht] && <p className="tr-hots">🧠 {kind === "ok" ? "استعملتَ مهارة" : "هذا السؤال يدرّبك على مهارة"} <b>{HOTS[ht].ic} {HOTS[ht].n}</b>: {HOTS[ht].d}{kind === "ok" ? " — عقلك يكبر مع كل تحدٍّ! 🚀" : ""}</p>}
    <button className="tr-btn tr-big tr-gold" onClick={onNext}>{last ? "افتح الصندوق 🧰" : "التالي ←"}</button>
  </div>;
}

function Burst({ plus, big }) {
  const n = big ? 22 : 14;
  return <div className="tr-burst" aria-hidden="true">{Array.from({ length: n }, (_, i) => <i key={i} style={{ "--a": (i * 360 / n) + "deg", "--d": (60 + (i % 3) * 25 + (big ? 30 : 0)) + "px" }}>{(big ? ["🔥", "🪙", "⭐"] : ["🪙", "✨", "⭐"])[i % 3]}</i>)}{plus && <b className="tr-plus">{plus} 🪙</b>}</div>;
}

function Result({ stage, w, s, per, avail, demo, onExit, onNext }) {
  const of = s.of || 15; const pass = s.sc >= passOf(of); const st = starsOf(s.sc, of); const n = stage.n;
  const worldDone = pass && n === w.to; const hasNext = pass && n < TR_TOTAL;
  const nextOpen = hasNext && n + 1 <= avail;
  useEffect(() => {
    const T = [];
    if (pass) { for (let k = 1; k <= st; k++) T.push(setTimeout(() => beep("star", k - 1), 500 + k * 280)); T.push(setTimeout(() => beep("win"), 600 + st * 280 + 200)); T.push(setTimeout(() => beep("fireworks"), 1500 + st * 280)); }
    else T.push(setTimeout(() => beep("lose"), 500));
    return () => T.forEach(clearTimeout);
  }, []);
  return <div className="tr-play tr-result" style={{ "--w1": w.c1, "--w2": w.c2, "--ws": w.soft, "--wsky": w.sky }}>
    {pass && <Celebrate kind="finale" />}
    {pass && <div className="tr-confetti" aria-hidden="true">{Array.from({ length: 40 }, (_, i) => <i key={i} style={{ left: (i * 2.5) + "%", animationDelay: (i % 10) * .12 + "s", background: ["#f59e0b", "#ef4444", "#10b981", "#3b82f6", "#a855f7"][i % 5] }} />)}</div>}
    <div className="tr-card tr-pop" style={{ textAlign: "center" }}>
      <div className={"tr-big-chest" + (pass ? " open" : "")}>{pass ? (n === TR_TOTAL ? "👑" : worldDone ? w.badge : "🗝️") : "🧰"}</div>
      <h2 className="tr-disp" style={{ fontSize: 30, margin: "4px 0" }}>{pass ? (n === TR_TOTAL ? "وصلت إلى كنز نافس!" : worldDone ? `حصلت على ${w.badgeName}!` : "عبرت المرحلة!") : "اقتربت كثيراً!"}</h2>
      <div className="tr-res-stars">{[1, 2, 3].map(k => <i key={k} className={k <= st ? "on" : ""} style={{ animationDelay: k * .28 + .3 + "s" }}>★</i>)}</div>
      <div className="tr-res-score"><b>{ar(s.sc)}</b> <span>من {ar(of)}</span></div>
      {s.streak >= 3 && <div className="tr-res-streak">🔥 أطول سلسلة إجابات متتالية: <b>{ar(s.streak)}</b></div>}
      <div className="tr-res-subs">{[["r", s.r], ["m", s.m], ["s", s.s]].map(([k, v]) => <div key={k} style={{ "--c": SUBJ[k].c, "--s": SUBJ[k].soft }}><span>{SUBJ[k].icon}</span><b>{ar(v)} / {ar(per[k])}</b><small>{SUBJ[k].name}</small><i style={{ width: (v / per[k] * 100) + "%" }} /></div>)}</div>
      <p className="tr-res-msg">{pass ? (st === 3 ? "أداء أسطوري! ثلاث نجوم كاملة 🌟" : `أصبت ${ar(s.first)} من أول محاولة — أعد المرحلة متى شئت لتجمع نجوماً أكثر`) : `تحتاج ${ar(passOf(of))} من ${ar(of)} لتعبر — استعن بالتلميحات وحاول مرة أخرى، ستتغير الأسئلة 💪`}</p>
      {pass && !demo && n < TR_TOTAL && <p className="tr-res-msg" style={{ color: "#0f766e" }}>🏝️ باقي {ar(TR_TOTAL - n)} مراحل على جزيرة كنز نافس!</p>}
      {pass && n === TR_TOTAL && !demo && <div className="tr-rules" style={{ background: "#fef3c7" }}>🎓 مبروك! اطبع شهادة «بطل نافس» من زر «جزيرة كنز نافس» في آخر الخريطة، وأخبر معلمك بإنجازك 🏆</div>}
      {demo && <div className="tr-rules" style={{ background: "#e0e7ff" }}>👨‍🏫 وضع الشرح — لم تُحفظ هذه النتيجة</div>}
      {s.saving && <small style={{ color: "#78716c" }}>جارٍ حفظ تقدمك…</small>}
      <div className="tr-res-act">
        {nextOpen && <button className="tr-btn tr-gold tr-big" onClick={() => onNext(n + 1)}>🗝️ إلى بوابة المرحلة {ar(n + 1)} ←</button>}
        {hasNext && !nextOpen && <div className="tr-rules">🔓 فُتحت المرحلة {ar(n + 1)} — ستتاح قريباً من إدارة المدرسة</div>}
        <button className="tr-btn tr-big" style={{ background: pass ? "#f5f5f4" : "#7c3aed", color: pass ? "#1c1917" : "#fff" }} onClick={onExit}>{pass ? "🗺️ العودة للخريطة" : "🗺️ الخريطة ثم المحاولة"}</button>
      </div>
    </div>
  </div>;
}

// ══════════ قصة الرحلة: من مدرسة الأمير عبدالمجيد إلى جزيرة كنز نافس ══════════
const JPATH = "M300 396 C 250 380, 330 330, 268 304 S 120 296, 150 246 S 300 214, 236 186 S 330 140, 298 112 S 150 56, 80 54";
const JSTOPS = [["🌴", 268, 304, "واحة البدايات"], ["🐪", 150, 246, "صحراء الألغاز"], ["⛰️", 236, 186, "جبال التحدي"], ["🏙️", 298, 112, "مدينة المستقبل"]];
function JourneyMap() {
  return <svg className="tr-j-map" viewBox="0 0 360 420" aria-hidden="true">
    <defs><linearGradient id="jsea" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#7dd3fc" /><stop offset="1" stopColor="#0ea5e9" /></linearGradient></defs>
    <rect width="360" height="420" rx="22" fill="#f6e7c1" />
    <path d="M0 0 H360 V40 C 300 60, 250 30, 200 70 C 160 100, 120 110, 60 130 C 30 140, 10 150, 0 152 Z" fill="url(#jsea)" opacity=".85" />
    <text x="190" y="40" fontSize="16">🐬</text><text x="140" y="96" fontSize="16">⛵</text>
    <ellipse cx="80" cy="60" rx="40" ry="20" fill="#fde68a" stroke="#d97706" strokeWidth="2" />
    <path className="tr-j-trail" d={JPATH} fill="none" stroke="#92400e" strokeWidth="4" strokeDasharray="8 8" strokeLinecap="round" />
    <text x="62" y="62" fontSize="26">🏝️</text><text x="94" y="60" fontSize="18" className="tr-j-x">❌</text>
    {JSTOPS.map(([e, x, y]) => <text key={e} x={x - 14} y={y + 9} fontSize="26">{e}</text>)}
    <text x="284" y="412" fontSize="28">🏫</text>
    <g fontSize="11.5" fontWeight="800" fill="#7c2d12" textAnchor="middle">
      <text x="296" y="372">مدرسة الأمير عبدالمجيد</text>{JSTOPS.map(([e, x, y, l]) => <text key={l} x={x} y={y + 26}>{l}</text>)}
    </g>
    <text x="80" y="100" fontSize="13" fontWeight="900" fill="#1e3a8a" textAnchor="middle">جزيرة كنز نافس</text>
    <g><text fontSize="24" x="-12" y="8">🧭</text><animateMotion dur="8s" repeatCount="indefinite" rotate="0" keyPoints="1;0" keyTimes="0;1" calcMode="linear" path={JPATH} /></g>
  </svg>;
}

// 🖼️ لوحة التنقيب عن الكنز والجوائز المنتظرة
const PRIZES = [["🥉", "وسام الواحة", "المراحل ١–٥"], ["🥈", "وسام الصحراء", "المراحل ٦–١٠"], ["🥇", "وسام القمة", "المراحل ١١–١٥"], ["💎", "وسام المستقبل", "المراحل ١٦–٢٠"], ["👑", "تاج الكنز", "المراحل ٢١–٢٥"], ["🎓", "شهادة بطل نافس", "تُطبع باسمك"], ["🏆", "لوحة الشرف", "اسمك بين الأوائل"], ["🎁", "مفاجأة المدرسة", "لمن يصل إلى الكنز"]];
function HuntScene() {
  return <svg className="tr-hunt-svg" viewBox="0 0 360 190" aria-hidden="true">
    <defs><linearGradient id="hsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fde68a" /><stop offset="1" stopColor="#fef3c7" /></linearGradient><radialGradient id="hglow"><stop offset="0" stopColor="#fff7ad" stopOpacity="1" /><stop offset="1" stopColor="#fbbf24" stopOpacity="0" /></radialGradient></defs>
    <rect width="360" height="190" rx="18" fill="url(#hsky)" />
    <text x="300" y="44" fontSize="30">☀️</text><text x="22" y="70" fontSize="30">🌴</text><text x="318" y="128" fontSize="26">🌴</text>
    <path d="M0 132 C 80 118, 160 128, 230 120 S 330 126, 360 120 V190 H0 Z" fill="#e8c27a" />
    <ellipse cx="180" cy="150" rx="70" ry="22" fill="#8a5a2b" />
    <g className="tr-hunt-glow"><circle cx="180" cy="134" r="58" fill="url(#hglow)" />{[0, 30, 60, 90, 120, 150].map(a => <line key={a} x1="180" y1="134" x2={180 + 70 * Math.cos((a + 195) * Math.PI / 180)} y2={134 + 70 * Math.sin((a + 195) * Math.PI / 180)} stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" opacity=".7" />)}</g>
    <text x="156" y="152" fontSize="44" className="tr-hunt-chest">🧰</text>
    <text x="112" y="104" fontSize="20" className="tr-hunt-coin">🪙</text><text x="228" y="98" fontSize="20" className="tr-hunt-coin d2">💎</text><text x="196" y="80" fontSize="18" className="tr-hunt-coin d3">⭐</text>
    <text x="70" y="150" fontSize="36">🧑‍🚀</text><text x="96" y="132" fontSize="30" className="tr-hunt-dig">⛏️</text>
    <text x="250" y="160" fontSize="30">🗺️</text><text x="282" y="172" fontSize="20">🧭</text>
  </svg>;
}
function HuntCard({ done }) {
  const [open, setOpen] = useState(() => !lsGet("tr-hunt-closed", false));
  const got = WORLDS.filter(w => done >= w.to).length;
  return <section className="tr-hunt">
    <button className="tr-hunt-h" onClick={() => { const v = !open; setOpen(v); lsSet("tr-hunt-closed", !v); beep("click"); }}><span>⛏️ التنقيب عن الكنز… والجوائز المنتظرة</span><small>{open ? "▲" : "▼"}</small></button>
    {open && <><HuntScene />
      <div className="tr-prizes">{PRIZES.map(([e, t, d], i) => { const on = i < 5 ? i < got : (done >= TR_TOTAL); return <div key={t} className={on ? "on" : ""}><span>{e}</span><b>{t}</b><small>{on ? "✅ حصلت عليها" : d}</small></div>; })}</div></>}
  </section>;
}

// 🎓 شهادة «بطل نافس» للطباعة
function printCert(me, prog) {
  const w = window.open("", "_blank"); if (!w) return;
  const stars = Object.values(obj(prog.stars)).reduce((a, b) => a + (+b || 0), 0);
  const d = new Date().toLocaleDateString("ar-SA-u-ca-islamic-umalqura-nu-arab", { day: "numeric", month: "long", year: "numeric" });
  w.document.write(`<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>شهادة بطل نافس</title><link href="https://fonts.googleapis.com/css2?family=Lalezar&family=Tajawal:wght@500;800&display=swap" rel="stylesheet"><style>@page{size:A4 landscape;margin:0}body{margin:0;font-family:Tajawal,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}.c{width:297mm;height:210mm;box-sizing:border-box;padding:14mm;background:radial-gradient(circle at 50% 0,#fff7d6,#fde68a 70%,#f59e0b);display:flex}.in{flex:1;border:6px double #92400e;border-radius:18px;background:#fffdf5;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:10mm;position:relative}.e{font-size:64px}.t{font-family:Lalezar,sans-serif;font-size:58px;color:#92400e;margin:4px 0}.s{font-size:20px;color:#57534e;font-weight:800}.n{font-family:Lalezar,sans-serif;font-size:50px;color:#1e3a8a;margin:10px 0;border-bottom:3px dashed #d97706;padding:0 30px}.p{font-size:20px;line-height:2;max-width:820px;color:#292524;font-weight:500}.b{display:flex;gap:18px;font-size:40px;margin:10px 0}.f{display:flex;justify-content:space-between;width:100%;margin-top:18px;font-weight:800;color:#57534e;font-size:16px}</style></head><body><div class="c"><div class="in"><div class="e">👑</div><div class="t">شهادة بطل نافس</div><div class="s">${TR_SCHOOL} — رحلة الكنز: من مدرسة الأمير عبدالمجيد إلى جزيرة كنز نافس</div><div class="n">${String(me.name || "").replace(/[<>&]/g, "")}</div><div class="p">أتمّ بنجاح مراحل رحلة الكنز الخمس والعشرين في القراءة والرياضيات والعلوم، وجمع ${ar(stars)} نجمة ⭐، متحلّياً بمهارات التفكير العليا والإصرار والعزيمة. نبارك له هذا الإنجاز، ونتمنى له التفوق في اختبارات نافس.</div><div class="b">🥉 🥈 🥇 💎 👑</div><div class="f"><span>التاريخ: ${d}</span><span>قائد المدرسة</span></div></div></div><script>setTimeout(()=>print(),800)<\/script></body></html>`);
  w.document.close();
}

// 🎉 احتفالات: ورد ينتثر • بالونات • ألعاب نارية
function Celebrate({ kind }) {
  const [on, setOn] = useState(true);
  useEffect(() => { const t = setTimeout(() => setOn(false), kind === "petals" ? 2600 : 4800); return () => clearTimeout(t); }, []);
  if (!on) return null;
  const petals = kind === "petals" ? 12 : 26, balloons = kind === "petals" ? 0 : kind === "balloons" ? 9 : 14, fw = kind === "party" || kind === "finale" ? (kind === "finale" ? 6 : 4) : 0;
  const PET = ["🌹", "🌸", "🌺", "💮", "🌷"], BAL = ["#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#a855f7", "#ec4899"];
  return <div className="tr-cel" aria-hidden="true">
    {Array.from({ length: petals }, (_, i) => <i key={"p" + i} className="tr-petal" style={{ left: (i * 37 + 7) % 100 + "%", animationDelay: (i % 6) * .18 + "s", "--r": (i % 2 ? 1 : -1) * (180 + i * 20) + "deg", "--x": ((i % 5) - 2) * 30 + "px", fontSize: 18 + (i % 3) * 6 }}>{PET[i % 5]}</i>)}
    {Array.from({ length: balloons }, (_, i) => <i key={"b" + i} className="tr-balloon" style={{ left: (i * 23 + 5) % 92 + "%", animationDelay: (i % 5) * .25 + "s", "--c": BAL[i % 6] }}><b /></i>)}
    {Array.from({ length: fw }, (_, i) => <i key={"f" + i} className="tr-fw" style={{ left: 15 + (i * 29) % 70 + "%", top: 12 + (i * 17) % 35 + "%", animationDelay: i * .42 + .3 + "s", "--c": BAL[(i * 2) % 6] }}>{Array.from({ length: 12 }, (_, k) => <s key={k} style={{ "--a": k * 30 + "deg" }} />)}</i>)}
  </div>;
}

function Journey({ name, onClose }) {
  const [k, setK] = useState(0);
  useEffect(() => { beep(k === 0 ? "start" : "gate"); }, [k]);
  const first = name ? String(name).split(" ")[0] : "";
  const slides = [
    <div key="0" className="tr-j-slide">
      <JourneyMap />
      <h2 className="tr-disp">{first ? `يا ${first}… ` : ""}من هنا تبدأ الرحلة!</h2>
      <p>في مكتبة <b>مدرسة الأمير عبدالمجيد</b> عُثر على خريطة قديمة تقود إلى <b>جزيرة كنز نافس</b> 🏝️. الطريق يعبر خمسة عوالم مليئة بالألغاز، ولا يصل إلى الكنز إلا مستكشف يقرأ بعمق، ويحسب بدقة، ويفكّر كالعلماء.</p>
    </div>,
    <div key="1" className="tr-j-slide">
      <h2 className="tr-disp">كيف تعبر المراحل؟</h2>
      <div className="tr-j-rules">
        {[["🚪", "٣ بوابات في كل مرحلة", "📖 القراءة • 🔢 الرياضيات • 🔬 العلوم — ٧ أسئلة لكل بوابة"], ["🪙", "عملة لكل إجابة صحيحة", "رنين العملات وورد ينتثر مع كل إجابة صحيحة"], ["💡", "تلميحة عند الحاجة", "اضغط «أحتاج تلميحة» في أي سؤال"], ["🔄", "أخطأت؟ لا مشكلة", "سؤال تعويضي بنصف عملة"], ["🗝️", "١٤ من ٢١ = مفتاح", "المفتاح يفتح المرحلة التالية… مع ألعاب نارية 🎆"], ["🔥", "سلسلة نارية", "الإجابات المتتالية تطلق البالونات 🎈"]].map(([ic, t, d]) => <div key={t}><span>{ic}</span><b>{t}</b><small>{d}</small></div>)}
      </div>
    </div>,
    <div key="2" className="tr-j-slide">
      <h2 className="tr-disp">الكنز والجوائز المنتظرة</h2>
      <HuntScene />
      <div className="tr-prizes sm">{PRIZES.map(([e, t, d]) => <div key={t}><span>{e}</span><b>{t}</b><small>{d}</small></div>)}</div>
    </div>,
    <div key="3" className="tr-j-slide">
      <h2 className="tr-disp">العوالم الخمسة</h2>
      <div className="tr-j-worlds">{WORLDS.map(w => <div key={w.n} style={{ background: w.soft, color: w.c1 }}><span>{w.icon}</span><b>{w.name}</b><small>المراحل {ar(w.from)}–{ar(w.to)} • {w.badge} {w.badgeName}</small></div>)}</div>
      <p>في كل سؤال ستدرّب عقلك على <b>مهارات التفكير العليا</b>: التحليل 🔍 والاستنتاج 💡 وحل المشكلات 🧩 والتفسير العلمي 🔬 — وهي ما يقيسه <b>اختبار نافس</b>. أنت جاهز يا بطل؟</p>
    </div>,
  ];
  return <div className="tr-modal tr-journey"><div className="tr-card tr-pop">
    {slides[k]}
    <div className="tr-j-dots">{slides.map((_, j) => <i key={j} className={j === k ? "on" : ""} onClick={() => setK(j)} />)}</div>
    <div className="tr-j-act">
      {k < slides.length - 1 ? <><button className="tr-btn" style={{ background: "#f5f5f4" }} onClick={onClose}>تخطٍّ</button><button className="tr-btn tr-gold tr-big" onClick={() => setK(k + 1)}>التالي ←</button></>
        : <button className="tr-btn tr-gold tr-big" style={{ flex: 1 }} onClick={() => { beep("win"); beep("fireworks"); onClose(); }}>⛵ انطلق إلى الجزيرة!</button>}
    </div>
  </div></div>;
}

const PUB_CSS = `
.tr-pub{min-height:100vh;background:#f5ecd7}
.tr-boot{min-height:100vh;display:grid;place-items:center;align-content:center;gap:10px;font-size:22px;background:radial-gradient(circle at 50% 30%,#1e3a5f,#0c1a2b);color:#fde68a}
.tr-compass{font-size:64px;animation:trSpin 2.4s linear infinite}
@keyframes trSpin{to{transform:rotate(360deg)}}
.tr-login{min-height:100vh;display:grid;place-items:center;padding:20px 16px;background:radial-gradient(ellipse at 50% 0%,#1e3a5f 0%,#0c1a2b 70%);position:relative;overflow:hidden}
.tr-stars-bg i{position:absolute;width:3px;height:3px;border-radius:50%;background:#fde68a;opacity:.7;animation:trTw 3s ease-in-out infinite}
@keyframes trTw{50%{opacity:.15;transform:scale(.6)}}
.tr-login-card{position:relative;width:100%;max-width:420px;background:linear-gradient(180deg,#fdf6e3,#f3e3bd);border-radius:26px;padding:22px 20px 18px;text-align:center;box-shadow:0 30px 60px rgba(0,0,0,.45),inset 0 0 0 3px #e7c98a,inset 0 0 40px rgba(180,83,9,.15)}
.tr-login-map svg{width:180px;height:auto;margin:-4px auto 0;display:block}
.tr-school{display:block;color:#92400e;font-weight:800;font-size:12.5px;margin-top:2px}
.tr-title{font-size:52px;line-height:1.1;margin:2px 0 0;background:linear-gradient(180deg,#b45309,#78350f);-webkit-background-clip:text;background-clip:text;color:transparent;text-shadow:0 2px 0 rgba(255,255,255,.4)}
.tr-sub{display:inline-block;background:#78350f;color:#fde68a;font-weight:800;font-size:13px;padding:4px 14px;border-radius:99px;margin:4px 0 10px}
.tr-lead{font-weight:700;color:#57534e;line-height:1.9;font-size:14.5px;margin:0 0 14px}
.tr-lbl{display:block;text-align:right;font-weight:800;font-size:13.5px;color:#78350f;margin-bottom:6px}
.tr-inp{width:100%;font-size:22px;letter-spacing:3px;text-align:center;padding:12px;border-radius:14px;border:2.5px solid #d6b26e;background:#fffdf6;font-weight:800;outline:none;font-family:inherit}
.tr-inp:focus{border-color:#b45309;box-shadow:0 0 0 4px rgba(245,158,11,.25)}
.tr-err{margin-top:8px;background:#fee2e2;color:#991b1b;font-weight:800;font-size:13.5px;padding:8px 10px;border-radius:10px}
.tr-btn{border:none;border-radius:14px;padding:10px 16px;font-weight:900;font-size:15px;transition:transform .12s,box-shadow .12s,filter .12s}
.tr-btn:active:not(:disabled){transform:translateY(2px)}
.tr-btn:disabled{opacity:.5;cursor:not-allowed}
.tr-big{width:100%;padding:14px;font-size:17px;margin-top:12px}
.tr-gold{background:linear-gradient(180deg,#fbbf24,#f59e0b);color:#451a03;box-shadow:0 5px 0 #b45309,0 10px 18px rgba(180,83,9,.3)}
.tr-gold:active:not(:disabled){box-shadow:0 2px 0 #b45309}
.tr-link{background:none;border:none;color:#a8a29e;font-weight:800;text-decoration:underline;margin-top:12px;font-size:13px}
.tr-map{max-width:560px;margin:0 auto;padding-bottom:10px;background:radial-gradient(circle at 20% 10%,rgba(255,255,255,.5),transparent 40%),#f5ecd7;min-height:100vh}
.tr-hud{position:sticky;top:0;z-index:20;display:flex;align-items:center;gap:8px;padding:10px 12px;background:rgba(12,26,43,.94);backdrop-filter:blur(6px);color:#fff;border-radius:0 0 18px 18px;box-shadow:0 6px 20px rgba(0,0,0,.25)}
.tr-hud-me{display:flex;align-items:center;gap:8px;flex:1;min-width:0}
.tr-hud-me b{display:block;font-size:14.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tr-hud-me small{font-size:11.5px;color:#fde68a;font-weight:700}
.tr-avatar{width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,#fbbf24,#f59e0b);display:grid;place-items:center;font-size:20px;flex-shrink:0}
.tr-hud-stats{display:flex;gap:6px}
.tr-hud-stats span{background:rgba(255,255,255,.12);padding:5px 9px;border-radius:99px;font-weight:900;font-size:14px}
.tr-hud-act button{background:none;border:none;font-size:19px;padding:4px}
.tr-map-title{text-align:center;padding:16px 16px 4px}
.tr-map-title h1{font-size:40px;margin:0;color:#78350f}
.tr-map-title p{margin:0;font-weight:700;color:#78716c;font-size:13.5px}
.tr-world{margin:14px 12px;border-radius:24px;overflow:hidden;background:linear-gradient(180deg,var(--wsky),var(--ws));box-shadow:0 8px 24px rgba(120,53,15,.12);border:2px solid rgba(255,255,255,.7)}
.tr-world-head{display:flex;align-items:center;gap:10px;padding:12px 14px;background:linear-gradient(135deg,var(--w1),var(--w2));color:#fff}
.tr-world-head small{font-weight:800;opacity:.85;font-size:12px}
.tr-world-head b{display:block;font-size:24px;line-height:1.1}
.tr-world-head>div{flex:1}
.tr-world-ic{font-size:30px;filter:drop-shadow(0 2px 2px rgba(0,0,0,.2))}
.tr-world-badge{font-size:26px;width:46px;height:46px;border-radius:50%;background:rgba(255,255,255,.18);display:grid;place-items:center}
.tr-world-badge.on{background:#fff;animation:trBob 2s ease-in-out infinite}
.tr-world-body{position:relative}
.tr-path{position:absolute;inset:0;width:100%;height:100%}
.tr-decor span{position:absolute;font-size:26px;opacity:.55;animation:trBob 4s ease-in-out infinite}
@keyframes trBob{50%{transform:translateY(-6px)}}
.tr-node{position:absolute;transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;z-index:2}
.tr-node button{width:66px;height:66px;border-radius:50%;border:4px solid #fff;background:#d6d3d1;color:#78716c;font-size:22px;box-shadow:0 6px 0 #a8a29e,0 10px 16px rgba(0,0,0,.15);display:grid;place-items:center}
.tr-node.open button{background:linear-gradient(180deg,var(--w2),var(--w1));color:#fff;box-shadow:0 6px 0 rgba(0,0,0,.25),0 12px 20px rgba(0,0,0,.18)}
.tr-node.open button .tr-disp{font-size:30px;line-height:1}
.tr-node.passed button{background:linear-gradient(180deg,#fcd34d,#f59e0b);color:#78350f;box-shadow:0 6px 0 #b45309,0 12px 20px rgba(180,83,9,.3)}
.tr-node.soon button{background:#e7e5e4;color:#a8a29e}
.tr-node.cur button{animation:trPulse 1.6s ease-in-out infinite;width:76px;height:76px}
@keyframes trPulse{0%,100%{box-shadow:0 6px 0 rgba(0,0,0,.25),0 0 0 0 rgba(251,191,36,.7)}50%{box-shadow:0 6px 0 rgba(0,0,0,.25),0 0 0 16px rgba(251,191,36,0)}}
.tr-me-pin{position:absolute;top:-34px;font-size:28px;animation:trBob 1.4s ease-in-out infinite;filter:drop-shadow(0 3px 2px rgba(0,0,0,.25))}
.tr-node-stars{margin-top:6px;display:flex;gap:1px;background:rgba(255,255,255,.85);border-radius:99px;padding:0 6px;min-height:18px;align-items:center}
.tr-node-stars i{font-style:normal;color:#d6d3d1;font-size:14px}
.tr-node-stars i.on{color:#f59e0b}
.tr-node-stars small{font-size:11px;font-weight:800;color:#78716c}
.tr-node-stars:empty{display:none}
.tr-spin{display:inline-block;animation:trSpin 1s linear infinite}
.tr-chest{display:flex;align-items:center;gap:10px;margin:0 12px 14px;padding:10px 12px;background:rgba(255,255,255,.75);border-radius:16px;border:2px dashed var(--w1)}
.tr-chest>span{font-size:34px}
.tr-chest b{display:block;color:var(--w1);font-size:15px}
.tr-chest small{color:#78716c;font-weight:700;font-size:12.5px}
.tr-chest.open{border-style:solid;background:#fff}
.tr-chest.open>span{animation:trBob 2s ease-in-out infinite}
.tr-final{margin:20px 12px;padding:22px;border-radius:26px;text-align:center;background:radial-gradient(circle at 50% 20%,#1e3a5f,#0c1a2b);color:#fde68a;box-shadow:0 12px 30px rgba(0,0,0,.3)}
.tr-final-chest{font-size:62px;animation:trBob 2.4s ease-in-out infinite;filter:drop-shadow(0 0 18px rgba(251,191,36,.6))}
.tr-final b{display:block;font-size:30px}
.tr-final small{font-weight:700;opacity:.85}
.tr-play{min-height:100vh;max-width:720px;margin:0 auto;padding:0 12px 40px;background:linear-gradient(180deg,var(--wsky),var(--ws) 60%,#f5ecd7)}
.tr-play-hud{position:sticky;top:0;z-index:20;display:flex;align-items:center;gap:10px;margin:0 -12px;padding:10px 12px;background:linear-gradient(135deg,var(--w1),var(--w2));color:#fff;box-shadow:0 6px 16px rgba(0,0,0,.18);scroll-margin-top:0}
.tr-x{width:36px;height:36px;border-radius:50%;border:none;background:rgba(255,255,255,.2);color:#fff;font-size:16px;font-weight:900;flex-shrink:0}
.tr-play-t{flex:1;min-width:0}
.tr-play-t small{display:block;font-weight:800;opacity:.85;font-size:11.5px}
.tr-play-t b{display:block;font-size:18px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tr-coins{background:rgba(0,0,0,.22);border-radius:99px;padding:5px 12px;font-weight:900;font-size:17px;display:flex;gap:4px;align-items:center;animation:trCoin .5s}
@keyframes trCoin{40%{transform:scale(1.25)}}
.tr-dots{display:flex;gap:4px;justify-content:center;padding:12px 0 6px;flex-wrap:wrap}
.tr-dots i{width:15px;height:8px;border-radius:99px;background:rgba(0,0,0,.12);transition:.3s}
.tr-dots i.gap{margin-inline-start:8px}
.tr-dots i.cur{background:var(--c);width:26px}
.tr-dots i.ok{background:#10b981}.tr-dots i.half{background:#f59e0b}.tr-dots i.bad{background:#ef4444}
.tr-card{background:#fff;border-radius:22px;padding:16px;margin-top:12px;box-shadow:0 8px 24px rgba(28,25,23,.08);border:1px solid rgba(0,0,0,.04)}
.tr-pop{animation:trPop .35s cubic-bezier(.2,1.4,.4,1)}
@keyframes trPop{from{opacity:0;transform:scale(.94) translateY(8px)}}
.tr-intro{text-align:center}
.tr-intro-ic{font-size:58px;animation:trBob 2.6s ease-in-out infinite}
.tr-intro h2{font-size:32px;margin:2px 0 6px;color:var(--w1)}
.tr-story{font-size:16px;line-height:2;font-weight:600;color:#44403c;background:#fdf6e3;border-radius:14px;padding:12px;border-right:4px solid var(--w2);text-align:right;margin:0}
.tr-gates{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:12px 0 6px}
.tr-gates div{background:var(--s);border-radius:14px;padding:10px 4px;display:flex;flex-direction:column;align-items:center;gap:2px}
.tr-gates span{font-size:26px}.tr-gates b{color:var(--c);font-size:13.5px}.tr-gates small{font-size:11px;color:#78716c;font-weight:700}
.tr-rules{background:#f5f5f4;border-radius:12px;padding:8px 10px;font-size:13px;font-weight:700;color:#57534e;line-height:1.8;margin-top:8px}
.tr-gatecard{text-align:center;padding:26px 18px}
.tr-gate-door{width:120px;height:140px;margin:0 auto 8px;border-radius:60px 60px 14px 14px;background:linear-gradient(180deg,var(--c),#1c1917);display:grid;place-items:center;box-shadow:inset 0 0 0 6px rgba(255,255,255,.25),0 12px 24px rgba(0,0,0,.2);animation:trDoor .6s ease-out}
.tr-gate-door span{font-size:56px;filter:drop-shadow(0 4px 6px rgba(0,0,0,.35))}
@keyframes trDoor{from{transform:scaleY(.3);opacity:0}}
.tr-gatecard small{font-weight:800;color:#78716c}
.tr-gatecard h2{font-size:34px;margin:2px 0;color:var(--c)}
.tr-gatecard p{font-weight:700;color:#57534e;line-height:1.8}
.tr-passage{padding:0;overflow:hidden;border:2px solid #fecdd3}
.tr-passage-h{width:100%;display:flex;justify-content:space-between;align-items:center;gap:8px;padding:12px 14px;background:linear-gradient(90deg,#fff1f2,#fff);border:none;font-weight:900;font-size:16px;color:#9f1239}
.tr-passage-h small{font-size:12px;color:#be123c}
.tr-passage-b{padding:4px 16px 12px;max-height:46vh;overflow-y:auto}
.tr-passage-b p{font-size:16.5px;line-height:2.1;font-weight:500;margin:8px 0;text-align:justify}
.tr-q{position:relative}
.tr-q.twin{border:2px dashed #a78bfa;background:linear-gradient(180deg,#faf5ff,#fff)}
.tr-q.shake{animation:trShake .4s}
@keyframes trShake{20%,60%{transform:translateX(-7px)}40%,80%{transform:translateX(7px)}}
.tr-q-meta{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px}
.tr-chip{background:#f5f5f4;color:#57534e;border-radius:99px;padding:3px 10px;font-size:12px;font-weight:800}
.tr-chip.lv{background:#fef3c7;color:#92400e}
.tr-chip.ht{background:#ede9fe;color:#5b21b6}
.tr-hots{margin:8px 0 0;padding:8px 12px;border-radius:14px;background:#f5f3ff;border:1.5px dashed #a78bfa;color:#4c1d95;font-size:14px;line-height:1.8}
.tr-hots-box{margin:10px 0;padding:10px 12px;border-radius:16px;background:linear-gradient(135deg,#f5f3ff,#fff);border:1.5px solid #ddd6fe;text-align:right;font-size:13.5px;line-height:2}
.tr-hots-box b{display:block;color:#5b21b6;font-size:14.5px}
.tr-hots-box em{font-style:normal;display:inline-block;background:#ede9fe;color:#4c1d95;border-radius:999px;padding:0 10px;margin:2px 3px;font-weight:800;font-size:12.5px}
.tr-chip.tw{background:#ede9fe;color:#6d28d9}
.tr-q-text{font-size:18px;font-weight:800;line-height:1.95}
.tr-opts{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:12px}
.tr-opts.col{grid-template-columns:1fr}
.tr-opt{display:flex;align-items:center;gap:10px;text-align:right;background:#fafaf9;border:2.5px solid #e7e5e4;border-radius:16px;padding:11px 12px;font-size:16px;font-weight:700;color:#1c1917;min-height:54px;transition:.15s}
.tr-opt:hover:not(:disabled){border-color:var(--sc);background:var(--ss)}
.tr-opt.sel{border-color:var(--sc);background:var(--ss);box-shadow:0 0 0 3px color-mix(in srgb,var(--sc) 25%,transparent)}
.tr-opt.right{border-color:#10b981;background:#d1fae5;animation:trPop .3s}
.tr-opt.wrong{border-color:#ef4444;background:#fee2e2}
.tr-opt:disabled{cursor:default}
.tr-let{width:30px;height:30px;border-radius:10px;background:#fff;border:2px solid currentColor;display:grid;place-items:center;font-weight:900;font-size:14px;flex-shrink:0;color:var(--sc)}
.tr-opt.right .tr-let{color:#059669}.tr-opt.wrong .tr-let{color:#dc2626}
.tr-opt-t{flex:1;line-height:1.7}
.tr-check{background:var(--sc);color:#fff;box-shadow:0 5px 0 rgba(0,0,0,.25)}
.tr-fb{margin-top:14px;border-radius:16px;padding:12px 14px}
.tr-fb>b{font-size:18px;display:block}
.tr-fb p{margin:6px 0 0;line-height:1.9;font-weight:600;font-size:15px}
.tr-fb.ok{background:#ecfdf5;border:2px solid #6ee7b7;color:#065f46}
.tr-fb.bad{background:#fff7ed;border:2px solid #fdba74;color:#7c2d12}
.tr-fb.hint{background:#faf5ff;border:2px solid #c4b5fd;color:#4c1d95}
.tr-exp{background:rgba(255,255,255,.7);border-radius:10px;padding:8px 10px;color:#1c1917}
.tr-burst{position:fixed;top:40%;left:50%;z-index:50;pointer-events:none}
.tr-burst i{position:absolute;font-style:normal;font-size:22px;animation:trBurst .9s ease-out forwards}
@keyframes trBurst{from{transform:rotate(var(--a)) translateY(0) scale(.4);opacity:1}to{transform:rotate(var(--a)) translateY(calc(var(--d) * -1.6)) scale(1);opacity:0}}
.tr-modal{position:fixed;inset:0;background:rgba(12,26,43,.6);z-index:60;display:grid;place-items:center;padding:16px}
.tr-result{padding-top:16px;position:relative;overflow:hidden}
.tr-big-chest{font-size:84px;margin-top:4px;animation:trBob 2s ease-in-out infinite}
.tr-big-chest.open{animation:trOpen .8s cubic-bezier(.2,1.6,.4,1),trBob 2s 1s ease-in-out infinite;filter:drop-shadow(0 0 22px rgba(251,191,36,.8))}
@keyframes trOpen{from{transform:scale(.2) rotate(-30deg)}}
.tr-res-stars{display:flex;justify-content:center;gap:6px}
.tr-res-stars i{font-style:normal;font-size:46px;color:#e7e5e4}
.tr-res-stars i.on{color:#f59e0b;animation:trPop .5s both;text-shadow:0 3px 0 #b45309}
.tr-res-score{font-weight:900;color:#1c1917}
.tr-res-score b{font-size:48px}.tr-res-score span{font-size:20px;color:#a8a29e}
.tr-res-subs{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:8px 0}
.tr-res-subs div{position:relative;overflow:hidden;background:var(--s);border-radius:14px;padding:8px 4px 12px;display:flex;flex-direction:column;align-items:center}
.tr-res-subs span{font-size:22px}.tr-res-subs b{color:var(--c);font-size:17px}.tr-res-subs small{font-size:11.5px;font-weight:800;color:#57534e}
.tr-res-subs i{position:absolute;bottom:0;right:0;height:5px;background:var(--c)}
.tr-res-msg{font-weight:700;color:#57534e;line-height:1.8}
.tr-res-act{display:flex;flex-direction:column}
.tr-confetti i{position:absolute;top:-12px;width:8px;height:14px;border-radius:2px;animation:trFall 2.6s linear forwards;z-index:1}
@keyframes trFall{to{transform:translateY(105vh) rotate(720deg)}}
@media (max-width:420px){.tr-opts{grid-template-columns:1fr}.tr-q-text{font-size:17px}.tr-title{font-size:46px}}
@media (prefers-reduced-motion:reduce){.tr-root *{animation:none!important}}
/* ── وضع الشرح وقصة الرحلة والتحفيز ── */
.tr-demo-bar{margin:10px 12px 0;background:linear-gradient(135deg,#e0e7ff,#ede9fe);border:2px dashed #6366f1;color:#312e81;border-radius:16px;padding:10px 12px;font-weight:700;font-size:13.5px;line-height:1.8}
.tr-start-pt{display:flex;align-items:center;gap:10px;margin:6px auto 0;max-width:440px;background:linear-gradient(135deg,#fff7ed,#fde68a);border:2px solid #f59e0b;border-radius:18px;padding:10px 14px;box-shadow:0 6px 16px rgba(180,83,9,.18)}
.tr-start-pt>div{flex:1}.tr-start-pt small{display:block;color:#92400e;font-weight:800;font-size:12px}.tr-start-pt b{font-size:20px;color:#7c2d12}
.tr-school-ic{font-size:34px;animation:trBob 2.6s ease-in-out infinite}.tr-start-flag{font-size:24px;animation:trWave 1.4s ease-in-out infinite;transform-origin:bottom left}
@keyframes trBob{50%{transform:translateY(-4px)}}@keyframes trWave{50%{transform:rotate(-12deg)}}
.tr-mute{background:rgba(0,0,0,.18);border:none;color:#fff;border-radius:12px;width:38px;height:38px;font-size:17px}
.tr-meter{max-width:680px;margin:0 auto;padding:0 14px 6px;display:flex;flex-direction:column;gap:3px}
.tr-meter-row{display:flex;align-items:center;gap:8px}
.tr-meter-bar{flex:1;height:12px;background:rgba(0,0,0,.08);border-radius:99px;overflow:hidden;box-shadow:inset 0 1px 3px rgba(0,0,0,.12)}
.tr-meter-bar i{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,#fbbf24,#f59e0b,#d97706);transition:width .6s cubic-bezier(.3,1.5,.5,1)}
.tr-meter-key{font-size:20px;filter:grayscale(.6)}.tr-meter-key.on{filter:none;animation:trKey 1.2s ease-in-out infinite}
@keyframes trKey{50%{transform:scale(1.25) rotate(-12deg)}}
.tr-meter small{font-weight:800;color:#78716c;font-size:12px;text-align:center}
.tr-combo{background:linear-gradient(135deg,#f97316,#dc2626);color:#fff;font-weight:900;border-radius:99px;padding:3px 10px;font-size:14px;box-shadow:0 4px 12px rgba(220,38,38,.35);animation:trCombo .5s cubic-bezier(.3,1.8,.5,1)}
@keyframes trCombo{0%{transform:scale(.3)}100%{transform:scale(1)}}
.tr-toast{position:fixed;top:84px;left:50%;transform:translateX(-50%);z-index:70;background:linear-gradient(135deg,#1e1b4b,#4c1d95);color:#fde68a;font-weight:900;font-size:16px;padding:12px 18px;border-radius:18px;box-shadow:0 14px 30px rgba(0,0,0,.35);max-width:92vw;text-align:center;border:2px solid #fbbf24}
.tr-plus{direction:ltr;unicode-bidi:isolate;position:absolute;left:-30px;top:-20px;font-size:26px;font-weight:900;color:#d97706;text-shadow:0 2px 0 #fff;white-space:nowrap;animation:trPlus 1s ease-out forwards}
@keyframes trPlus{0%{transform:translateY(0) scale(.6);opacity:0}25%{opacity:1;transform:translateY(-14px) scale(1.2)}100%{transform:translateY(-70px) scale(1);opacity:0}}
.tr-gate-score{font-weight:800;color:#92400e;background:#fef3c7;border-radius:12px;padding:6px 10px;display:inline-block}
.tr-res-streak{font-weight:800;color:#c2410c;margin:4px 0}
.tr-dots i.nav{cursor:pointer;height:12px}
.tr-teach{border:2px solid #6366f1;background:linear-gradient(180deg,#eef2ff,#fff)}
.tr-teach-h{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.tr-teach-h b{color:#3730a3;font-size:16px}.tr-teach-h small{color:#6366f1;font-weight:800}
.tr-teach-btns{display:flex;flex-wrap:wrap;gap:6px;margin:10px 0}
.tr-teach-btns button{border:none;background:#fff;border:1.5px solid #c7d2fe;color:#3730a3;font-weight:800;border-radius:12px;padding:9px 12px;font-size:14px}
.tr-teach-btns button.on{background:#4f46e5;color:#fff;border-color:#4f46e5}.tr-teach-btns button:disabled{opacity:.4}
.tr-journey .tr-card{max-width:440px;width:100%;max-height:92vh;overflow-y:auto;text-align:center}
.tr-j-slide h2{font-size:26px;margin:8px 0 4px;color:#7c2d12}.tr-j-slide p{font-weight:600;line-height:2;color:#44403c;margin:6px 0}
.tr-j-map{width:100%;max-width:340px;display:block;margin:0 auto;border-radius:22px;box-shadow:0 10px 24px rgba(120,53,15,.25)}
.tr-j-trail{animation:trTrail 1.2s linear infinite}@keyframes trTrail{to{stroke-dashoffset:-32}}
.tr-j-x{animation:trKey 1.4s ease-in-out infinite;transform-origin:center;transform-box:fill-box}
.tr-j-rules{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px}
.tr-j-rules>div{background:#fffbeb;border:1.5px solid #fde68a;border-radius:16px;padding:10px 8px;display:flex;flex-direction:column;gap:2px}
.tr-j-rules span{font-size:28px}.tr-j-rules b{font-size:14px;color:#7c2d12}.tr-j-rules small{font-size:11.5px;color:#78716c;font-weight:700;line-height:1.6}
.tr-j-worlds{display:grid;gap:6px;margin:8px 0}.tr-j-worlds>div{display:flex;align-items:center;gap:10px;border-radius:14px;padding:8px 12px;text-align:right}
.tr-j-worlds span{font-size:26px}.tr-j-worlds b{flex:1;font-size:15px}.tr-j-worlds small{font-weight:800;font-size:11.5px}
.tr-j-dots{display:flex;gap:6px;justify-content:center;margin:12px 0 8px}.tr-j-dots i{width:9px;height:9px;border-radius:99px;background:#e7e5e4;cursor:pointer;transition:.3s}.tr-j-dots i.on{width:26px;background:#f59e0b}
.tr-j-act{display:flex;gap:8px}.tr-j-act .tr-big{flex:1}
/* ── التلميحة • صورة الفكرة • لوحة التنقيب • الاحتفالات ── */
.tr-hintbox{margin:6px 0 2px}
.tr-hint-btn{width:100%;border:1.5px dashed #a78bfa;background:#f5f3ff;color:#6d28d9;font-weight:900;border-radius:14px;padding:9px;font-size:14.5px}
.tr-ep{margin-top:8px;display:flex;flex-direction:column;align-items:center;gap:2px}.tr-ep>small{font-weight:900;color:#b45309;font-size:12.5px}
.tr-hunt{max-width:460px;margin:10px auto 0;padding:0 12px}
.tr-hunt-h{width:100%;display:flex;justify-content:space-between;align-items:center;border:none;background:linear-gradient(135deg,#92400e,#b45309);color:#fde68a;font-weight:900;font-size:15px;border-radius:16px;padding:11px 14px;box-shadow:0 6px 16px rgba(146,64,14,.3)}
.tr-hunt-svg{width:100%;display:block;margin-top:8px;border-radius:18px;box-shadow:0 8px 20px rgba(120,53,15,.2)}
.tr-hunt-glow{animation:trGlow 2.2s ease-in-out infinite;transform-origin:180px 134px}@keyframes trGlow{50%{opacity:.55;transform:scale(1.08)}}
.tr-hunt-chest{animation:trBob 1.8s ease-in-out infinite}
.tr-hunt-coin{animation:trFloat 2.6s ease-in-out infinite}.tr-hunt-coin.d2{animation-delay:.6s}.tr-hunt-coin.d3{animation-delay:1.2s}@keyframes trFloat{50%{transform:translateY(-10px)}}
.tr-hunt-dig{transform-box:fill-box;transform-origin:bottom left;animation:trDig 1s ease-in-out infinite}@keyframes trDig{50%{transform:rotate(-28deg)}}
.tr-prizes{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:8px}
.tr-prizes>div{background:#fffbeb;border:1.5px solid #fde68a;border-radius:14px;padding:7px 4px;display:flex;flex-direction:column;align-items:center;text-align:center;gap:1px;filter:grayscale(.15)}
.tr-prizes>div.on{background:linear-gradient(135deg,#fef08a,#fbbf24);border-color:#d97706;filter:none;box-shadow:0 4px 12px rgba(217,119,6,.35)}
.tr-prizes span{font-size:26px}.tr-prizes b{font-size:11.5px;color:#7c2d12;line-height:1.4}.tr-prizes small{font-size:10px;color:#78716c;font-weight:800;line-height:1.4}
.tr-prizes.sm span{font-size:22px}
.tr-cel{position:fixed;inset:0;pointer-events:none;z-index:65;overflow:hidden}
.tr-petal{position:absolute;top:-40px;font-style:normal;animation:trPetal 2.6s ease-in forwards}
@keyframes trPetal{0%{transform:translate(0,0) rotate(0);opacity:0}10%{opacity:1}100%{transform:translate(var(--x),105vh) rotate(var(--r));opacity:.85}}
.tr-balloon{position:absolute;bottom:-90px;width:44px;height:56px;animation:trBal 4.2s ease-out forwards}
.tr-balloon b{display:block;width:44px;height:54px;border-radius:50% 50% 48% 48%;background:radial-gradient(circle at 32% 30%,rgba(255,255,255,.75) 0 12%,var(--c) 34%);box-shadow:inset -6px -8px 0 rgba(0,0,0,.12)}
.tr-balloon:after{content:"";position:absolute;left:50%;top:54px;width:1.5px;height:40px;background:rgba(0,0,0,.35)}
@keyframes trBal{0%{transform:translateY(0)}60%{transform:translateY(-70vh) translateX(14px)}100%{transform:translateY(-125vh) translateX(-10px)}}
.tr-fw{position:absolute;width:0;height:0;opacity:0;animation:trFwShow 1.3s ease-out forwards}
.tr-fw s{position:absolute;left:0;top:0;width:6px;height:6px;border-radius:50%;background:var(--c);box-shadow:0 0 10px var(--c),0 0 3px #fff;transform:rotate(var(--a)) translateX(0);animation:trFw 1.3s ease-out forwards;animation-delay:inherit}
@keyframes trFwShow{0%{opacity:1}85%{opacity:1}100%{opacity:0}}
@keyframes trFw{0%{transform:rotate(var(--a)) translateX(0) scale(1.4)}100%{transform:rotate(var(--a)) translateX(90px) scale(.4)}}
`;

// ══════════ 🗝️ بوابة المفتاح بين المرحلتين ══════════
// سؤال من كل مادة (قراءة • رياضيات • علوم) مختار من المرحلة التي عبرها الطالب — ويُفضَّل ما أخطأ فيه ليتعلّمه
// الإجابات الثلاث تصنع المفتاح ← يفتح الصندوق ← تخرج جوهرة ومفتاح ← يأخذهما المستكشف ويمشي ليفتح بوابة المرحلة التالية ← ألعاب نارية
function kgPick(stage, items, res, seed = 0) {
  const L0 = items || [...stage.read.qs.map(q => ({ ...q, sub: "r" })), ...stage.math.map(q => ({ ...q, sub: "m" })), ...stage.sci.map(q => ({ ...q, sub: "s" }))];
  return ["r", "m", "s"].map((s, k) => {
    const L = L0.map((q, j) => ({ q, j })).filter(x => x.q.sub === s); if (!L.length) return null;
    const wrong = res ? L.filter(x => res[x.j] && res[x.j].v < 1) : [];
    const pool = wrong.length ? wrong : L; const x = pool[(seed * 7 + k * 5 + stage.n * 3) % pool.length];
    return { ...(x.q.t ? swapTwin(x.q) : x.q), sub: s, wasWrong: wrong.length > 0 };
  }).filter(Boolean);
}
const KG_KID = <svg viewBox="0 0 80 120" className="kg-kid-svg">
  <g className="kg-leg l"><rect x="30" y="80" width="9" height="30" rx="4" fill="#1e3a8a" /><ellipse cx="33" cy="112" rx="8" ry="4.5" fill="#3f2a14" /></g>
  <g className="kg-leg r"><rect x="42" y="80" width="9" height="30" rx="4" fill="#1e40af" /><ellipse cx="47" cy="112" rx="8" ry="4.5" fill="#3f2a14" /></g>
  <rect x="47" y="46" width="16" height="26" rx="6" fill="#b45309" /><rect x="49" y="50" width="12" height="6" rx="2" fill="#f59e0b" />
  <path d="M26 46 h30 a6 6 0 0 1 6 6 v30 h-42 v-30 a6 6 0 0 1 6 -6z" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
  <path d="M40 46 v36" stroke="#cbd5e1" strokeWidth="1.5" />
  <g className="kg-arm"><rect x="16" y="50" width="8" height="26" rx="4" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.2" /><circle cx="20" cy="77" r="4.5" fill="#f2c094" /></g>
  <circle cx="40" cy="30" r="16" fill="#f2c094" /><circle cx="33" cy="30" r="2" fill="#1c1917" /><circle cx="45" cy="30" r="2" fill="#1c1917" /><path d="M34 37 q5 4 10 0" stroke="#9a3412" strokeWidth="2" fill="none" strokeLinecap="round" />
  <path d="M22 22 q18 -18 36 0 l4 3 h-44z" fill="#a16207" /><rect x="18" y="22" width="44" height="5" rx="2.5" fill="#78350f" /><circle cx="27" cy="34" r="3" fill="#fca5a5" opacity=".6" /><circle cx="51" cy="34" r="3" fill="#fca5a5" opacity=".6" />
</svg>;
const KG_GEM = <svg viewBox="0 0 64 56"><path d="M14 2h36l14 16-32 36L0 18z" fill="#22d3ee" /><path d="M14 2 22 18 32 2 42 18 50 2M0 18h64M22 18l10 36 10-36" fill="none" stroke="#0e7490" strokeWidth="2" /><path d="M18 6l6 10" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity=".8" /></svg>;
const KG_KEY = <svg viewBox="0 0 80 40"><circle cx="16" cy="20" r="12" fill="none" stroke="#f5b301" strokeWidth="7" /><path d="M28 20h46M62 20v12M72 20v9" stroke="#f5b301" strokeWidth="7" strokeLinecap="round" /><circle cx="16" cy="20" r="12" fill="none" stroke="#fde68a" strokeWidth="2" /></svg>;

function KeyGate({ stage, qs, nextN, demo, onGem, onEnter, onMap }) {
  const w = worldOf(stage.n); const nw = worldOf(Math.min(TR_TOTAL, nextN));
  const [k, setK] = useState(-1); // -1 مقدمة • 0..2 الأسئلة • 3 العرض
  const [pick, setPick] = useState(null); const [bad, setBad] = useState([]); const [ph, setPh] = useState("ask"); // ask | ok | reveal
  const [got, setGot] = useState([]); const [show, setShow] = useState(true); const [sc, setSc] = useState(0); const [party, setParty] = useState(null); const T = useRef([]);
  useEffect(() => () => T.current.forEach(clearTimeout), []);
  const later = (ms, f) => T.current.push(setTimeout(f, ms));
  const q = k >= 0 && k < 3 ? qs[k] : null; const sub = q ? SUBJ[q.sub] : null;
  const order = useMemo(() => q ? shuffleIdx(q.o.length, stage.n * 13 + k * 7 + 5) : [], [k]);
  const check = () => { if (pick === null) return; if (+pick === +q.a) { setPh("ok"); setGot(g => [...g, k]); beep("ok"); setParty({ k: Date.now(), kind: "petals" }); }
    else { const b = [...bad, pick]; setBad(b); setPick(null); beep("bad"); if (b.length >= 2) { setPh("reveal"); setGot(g => [...g, k]); } } };
  const nextQ = () => { setPick(null); setBad([]); setPh("ask"); setShow(true); if (k + 1 < 3) { setK(k + 1); beep("gate"); } else play(); window.scrollTo(0, 0); };
  // 🎬 العرض: المفتاح ← الصندوق ← الجوهرة ← المستكشف ← البوابة ← الألعاب النارية
  const play = () => { setK(3); setSc(1); beep("key");
    later(1500, () => { setSc(2); beep("pop"); }); later(2300, () => { setSc(3); beep("win"); onGem && onGem(); });
    later(3700, () => { setSc(4); beep("click"); }); later(4900, () => { setSc(5); beep("star", 2); }); later(5300, () => { setSc(6); beep("gate"); });
    later(7600, () => { setSc(7); beep("key"); }); later(8300, () => { setSc(8); beep("fireworks"); setParty({ k: Date.now(), kind: "finale" }); }); later(9000, () => beep("win")); };
  const skip = () => { T.current.forEach(clearTimeout); T.current = []; setSc(8); onGem && onGem(); beep("fireworks"); setParty({ k: Date.now(), kind: "finale" }); };
  return <div className="tr-play kg" style={{ "--w1": w.c1, "--w2": w.c2, "--ws": w.soft, "--wsky": w.sky, "--n1": nw.c1, "--n2": nw.c2 }}>
    <header className="tr-play-hud"><button className="tr-x" onClick={onMap} aria-label="الخريطة">✕</button><div className="tr-play-t"><small>بين المرحلتين {ar(stage.n)} و{ar(nextN)}</small><b className="tr-disp">🗝️ بوابة المفتاح</b></div>
      <div className="kg-locks">{["r", "m", "s"].map((s, j) => <span key={s} className={got.includes(j) ? "on" : k === j ? "cur" : ""} style={{ "--c": SUBJ[s].c }}>{SUBJ[s].icon}</span>)}</div></header>
    {k === -1 && <div className="tr-card tr-pop kg-intro">
      <div className="kg-mini"><span className="kg-mini-chest"><svg viewBox="0 0 120 100" width="110"><path d="M10 40h100v50a8 8 0 0 1-8 8H18a8 8 0 0 1-8-8z" fill="#92400e" /><path d="M10 40C10 16 30 4 60 4s50 12 50 36z" fill="#b45309" /><path d="M10 40h100M10 84h100" stroke="#f5c542" strokeWidth="6" /><path d="M32 8v90M88 8v90" stroke="#f5c542" strokeWidth="6" /><rect x="50" y="34" width="20" height="24" rx="4" fill="#f5c542" /><circle cx="60" cy="44" r="3.5" fill="#5a2a0c" /><path d="M60 47v6" stroke="#5a2a0c" strokeWidth="3" /></svg></span><span className="kg-mini-lock">🔒</span></div>
      <h2 className="tr-disp">بطلٌ عبر المرحلة {ar(stage.n)}!</h2>
      <p>بوابة <b>المرحلة {ar(nextN)}</b> مقفلة، ومفتاحها داخل <b>صندوق الكنز</b>. أجب عن <b>ثلاثة أسئلة</b> — سؤال من كل بوابة عبرتها — لتصنع المفتاح وتفتح الصندوق 💎</p>
      <div className="tr-gates">{qs.map((x, j) => <div key={j} style={{ "--c": SUBJ[x.sub].c, "--s": SUBJ[x.sub].soft }}><span>{SUBJ[x.sub].icon}</span><b>قطعة المفتاح {ar(j + 1)}</b><small>{SUBJ[x.sub].name}{x.wasWrong ? " • من أسئلتك الصعبة" : ""}</small></div>)}</div>
      <button className="tr-btn tr-gold tr-big" onClick={() => { setK(0); beep("start"); }}>اصنع المفتاح 🗝️</button>
      {demo && <button className="tr-btn" style={{ background: "#e0e7ff" }} onClick={play}>👨‍🏫 عرض المشهد مباشرة</button>}
    </div>}
    {q && <>
      {q.sub === "r" && stage.read && <div className={"tr-card tr-passage" + (show ? "" : " closed")}><button className="tr-passage-h" onClick={() => setShow(v => !v)}><span>📜 {stage.read.title}</span><small>{show ? "إخفاء النص ▲" : "عرض النص ▼"}</small></button>{show && <div className="tr-passage-b">{stage.read.text.map((p, j) => <p key={j}><Rich t={p} /></p>)}{stage.read.fig && <Fig f={stage.read.fig} />}</div>}</div>}
      <div className={"tr-card tr-q kg-q" + (bad.length && ph === "ask" ? " shake" : "")} key={k + "-" + bad.length} style={{ "--sc": sub.c, "--ss": sub.soft }}>
        <div className="tr-q-meta"><span className="tr-chip" style={{ background: sub.soft, color: sub.c }}>{sub.icon} قطعة المفتاح {ar(k + 1)} من ٣ — {sub.name}</span>{q.wasWrong && <span className="tr-chip tw">💪 سؤال سبق أن أتعبك</span>}</div>
        <div className="tr-q-text"><Rich t={q.q} /></div><Fig f={q.fig} />
        <div className={"tr-opts" + (q.o.some(o => String(o).length > 28) ? " col" : "")}>{order.map((oi, j) => { const right = oi === +q.a; const off = bad.includes(oi);
          return <button key={oi} disabled={ph !== "ask" || off} className={"tr-opt" + (pick === oi ? " sel" : "") + (ph !== "ask" && right ? " right" : "") + (off ? " wrong" : "")} onClick={() => { setPick(oi); beep("click"); }}><span className="tr-let">{LET[j]}</span><span className="tr-opt-t"><Rich t={q.o[oi]} /></span></button>; })}</div>
        {ph === "ask" && bad.length === 1 && <div className="tr-fb hint tr-pop"><b>💡 قريب! جرّب مرة أخرى</b><p><Rich t={q.h || "أعد قراءة السؤال، وحدّد المطلوب، واستبعد الخيار غير المنطقي."} /></p></div>}
        {ph === "ask" && <button className="tr-btn tr-big tr-check" disabled={pick === null} onClick={check}>تحقّق ✓</button>}
        {ph === "ok" && <div className="tr-fb ok tr-pop"><b>{["🧩 القطعة الأولى معك!", "🧩 القطعة الثانية! المفتاح يتشكّل…", "🗝️ اكتمل المفتاح!"][k]}</b>{q.e && <p className="tr-exp"><Rich t={q.e} /></p>}<button className="tr-btn tr-big tr-gold" onClick={nextQ}>{k < 2 ? "القطعة التالية ←" : "افتح الصندوق 🧰"}</button></div>}
        {ph === "reveal" && <div className="tr-fb bad tr-pop"><b>لا بأس — تعلّمتها الآن 💪 وحصلت على القطعة</b><p>الإجابة الصحيحة: <b><Rich t={q.o[+q.a]} /></b></p>{q.e && <p className="tr-exp"><Rich t={q.e} /></p>}<button className="tr-btn tr-big tr-gold" onClick={nextQ}>{k < 2 ? "القطعة التالية ←" : "افتح الصندوق 🧰"}</button></div>}
      </div>
    </>}
    {k === 3 && <div className="tr-card kg-stage tr-pop">
      <div className={"kg-scene s" + sc}>
        <div className="kg-sky" /><div className="kg-ground" />
        <div className="kg-rays" />
        <div className="kg-gate"><svg viewBox="0 0 100 120"><path d="M6 118V46a44 44 0 0 1 88 0v72z" fill="#78716c" /><path d="M14 118V48a36 36 0 0 1 72 0v70z" fill="#1c1917" /><path d="M6 46a44 44 0 0 1 88 0" fill="none" stroke="#a8a29e" strokeWidth="5" strokeDasharray="9 4" /></svg>
          <div className="kg-light" /><div className="kg-door l" /><div className="kg-door r" /><b className="kg-gn">{ar(nextN)}</b><span className="kg-lock">🔒</span></div>
        <div className="kg-chest"><div className="kg-glow" /><svg viewBox="0 0 120 100" className="kg-body"><path d="M10 40h100v50a8 8 0 0 1-8 8H18a8 8 0 0 1-8-8z" fill="#92400e" /><path d="M10 40h100" stroke="#f5c542" strokeWidth="6" /><path d="M10 84h100" stroke="#f5c542" strokeWidth="4" /><path d="M32 40v58M88 40v58" stroke="#f5c542" strokeWidth="6" /><rect x="50" y="44" width="20" height="22" rx="4" fill="#f5c542" /><circle cx="60" cy="53" r="3.5" fill="#5a2a0c" /><path d="M60 56v6" stroke="#5a2a0c" strokeWidth="3" /></svg>
          <svg viewBox="0 0 120 50" className="kg-lid"><path d="M10 48C10 18 30 4 60 4s50 14 50 44z" fill="#b45309" /><path d="M10 48C10 18 30 4 60 4s50 14 50 44" fill="none" stroke="#f5c542" strokeWidth="6" /><path d="M32 12v36M88 12v36" stroke="#f5c542" strokeWidth="6" /></svg>
          <div className="kg-gem">{KG_GEM}</div><div className="kg-key2">{KG_KEY}</div></div>
        <div className="kg-pieces">{["r", "m", "s"].map((s, j) => <span key={s} className={"p" + j} style={{ "--c": SUBJ[s].c }}>{SUBJ[s].icon}</span>)}</div>
        <div className="kg-key">{KG_KEY}</div>
        <div className="kg-kid"><div className="kg-bob">{KG_KID}<div className="kg-hold"><i>{KG_GEM}</i><i>{KG_KEY}</i></div></div></div>
        <div className="kg-sparks">{Array.from({ length: 10 }, (_, i) => <i key={i} style={{ "--a": i * 36 + "deg" }} />)}</div>
      </div>
      <div className="kg-cap">{sc < 2 ? "🧩 القطع الثلاث تتحد… المفتاح يتشكّل!" : sc < 3 ? "🗝️ المفتاح في قفل الصندوق…" : sc < 4 ? "💎 انفتح الصندوق! جوهرة… ومفتاح البوابة!" : sc < 6 ? "🧒 المستكشف يأخذ الجوهرة والمفتاح…" : sc < 7 ? `🚶 في الطريق إلى بوابة المرحلة ${ar(nextN)}…` : sc < 8 ? "🔓 المفتاح في القفل…" : `🎆 انفتحت بوابة المرحلة ${ar(nextN)}!`}</div>
      {sc >= 8 ? <div className="kg-end tr-pop"><div className="kg-gem-won"><i>{KG_GEM}</i><b>+١ جوهرة</b></div>
        <button className="tr-btn tr-gold tr-big" onClick={() => onEnter(nextN)}>ادخل المرحلة {ar(nextN)} ←</button>
        <button className="tr-btn tr-big" style={{ background: "#f5f5f4" }} onClick={onMap}>🗺️ الخريطة</button></div>
        : <button className="kg-skip" onClick={skip}>تخطّي المشهد ⏭</button>}
    </div>}
    {party && <Celebrate key={party.k} kind={party.kind} />}
  </div>;
}
const KG_CSS = `
.kg-locks{display:flex;gap:6px}.kg-locks span{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:#e7e5e4;filter:grayscale(1);opacity:.6;font-size:17px;transition:.3s}
.kg-locks span.cur{opacity:1;filter:none;background:#fff;box-shadow:0 0 0 3px var(--c)}.kg-locks span.on{opacity:1;filter:none;background:var(--c);box-shadow:0 0 0 3px #fde68a;animation:trCoin .5s}
.kg-intro{text-align:center;display:grid;gap:12px;justify-items:center}.kg-intro p{font-weight:700;line-height:1.9;color:#44403c;max-width:520px}
.kg-mini{position:relative;font-size:64px;line-height:0;animation:trBob 2s ease-in-out infinite}.kg-mini-lock{position:absolute;bottom:-4px;left:-14px;font-size:30px}
.kg-stage{padding:10px;overflow:hidden}
.kg-scene{position:relative;width:100%;aspect-ratio:16/10;border-radius:18px;overflow:hidden;background:linear-gradient(180deg,var(--wsky,#eff6ff),#fff7e6)}
.kg-ground{position:absolute;left:0;right:0;bottom:0;height:24%;background:linear-gradient(180deg,#e9c46a,#c99a3d);border-top:4px solid #b7862c}
.kg-rays{position:absolute;left:50%;top:58%;width:150%;aspect-ratio:1;transform:translate(-50%,-50%) scale(0);background:repeating-conic-gradient(from 0deg,rgba(253,224,71,.55) 0 8deg,transparent 8deg 22deg);border-radius:50%;transition:transform .9s cubic-bezier(.2,1.4,.4,1);opacity:.9}
.s3 .kg-rays,.s4 .kg-rays,.s5 .kg-rays{transform:translate(-50%,-50%) scale(1);animation:kgSpin 9s linear infinite}
.s6 .kg-rays,.s7 .kg-rays,.s8 .kg-rays{transform:translate(-50%,-50%) scale(.7);opacity:.35;animation:kgSpin 9s linear infinite}
@keyframes kgSpin{to{transform:translate(-50%,-50%) scale(var(--sc,1)) rotate(360deg)}}
.kg-gate{position:absolute;left:4%;bottom:20%;width:20%;aspect-ratio:100/120}.kg-gate svg{position:absolute;inset:0;width:100%;height:100%}
.kg-light{position:absolute;left:14%;right:14%;bottom:0;top:22%;border-radius:40px 40px 0 0;background:radial-gradient(circle at 50% 70%,#fff,#fde68a 40%,var(--n2,#f59e0b));opacity:0;transition:opacity .6s}
.kg-door{position:absolute;bottom:0;top:22%;width:36%;background:linear-gradient(90deg,#7c2d12,#9a3412);border:2px solid #451a03;transition:transform 1s ease}
.kg-door.l{left:14%;border-radius:36px 0 0 0;transform-origin:left}.kg-door.r{right:14%;border-radius:0 36px 0 0;transform-origin:right}
.kg-gn{position:absolute;top:-18%;left:50%;transform:translateX(-50%);background:var(--n1,#1d4ed8);color:#fff;font-family:Lalezar,Cairo;font-weight:400;font-size:clamp(14px,3.4vw,24px);min-width:2em;text-align:center;border-radius:10px;padding:0 6px;border:2px solid #fde68a}
.kg-lock{position:absolute;left:50%;top:55%;transform:translate(-50%,-50%);font-size:clamp(18px,4vw,30px);transition:transform .9s ease-in,opacity .9s}
.s7 .kg-lock,.s8 .kg-lock{transform:translate(-50%,160%) rotate(70deg);opacity:0}
.s8 .kg-door.l{transform:perspective(300px) rotateY(75deg)}.s8 .kg-door.r{transform:perspective(300px) rotateY(-75deg)}.s8 .kg-light{opacity:1}
.kg-chest{position:absolute;left:50%;bottom:16%;width:24%;aspect-ratio:120/100;transform:translateX(-50%)}
.kg-body{position:absolute;left:0;bottom:0;width:100%}.kg-lid{position:absolute;left:0;width:100%;top:-2%;transform-origin:8% 96%;transition:transform .7s cubic-bezier(.3,1.6,.5,1)}
.s3 .kg-lid,.s4 .kg-lid,.s5 .kg-lid,.s6 .kg-lid,.s7 .kg-lid,.s8 .kg-lid{transform:rotate(-115deg)}
.kg-glow{position:absolute;left:-30%;right:-30%;top:-40%;bottom:-10%;background:radial-gradient(circle,rgba(253,224,71,.95),rgba(253,224,71,0) 60%);opacity:0;transition:opacity .5s}.s3 .kg-glow,.s4 .kg-glow{opacity:1}
.kg-gem,.kg-key2{position:absolute;left:50%;top:30%;width:36%;transform:translate(-50%,0) scale(.2);opacity:0;transition:transform 1s cubic-bezier(.2,1.5,.4,1),opacity .3s}
.kg-key2{width:46%}
.s3 .kg-gem{opacity:1;transform:translate(-90%,-150%) scale(1) rotate(-8deg);animation:kgFloat 1.6s ease-in-out .9s infinite}.s3 .kg-key2{opacity:1;transform:translate(-5%,-120%) scale(1) rotate(12deg)}
@keyframes kgFloat{50%{margin-top:-6px}}
.s4 .kg-gem,.s5 .kg-gem,.s6 .kg-gem,.s7 .kg-gem,.s8 .kg-gem,.s5 .kg-key2,.s6 .kg-key2,.s7 .kg-key2,.s8 .kg-key2{opacity:0}.s4 .kg-gem{opacity:1;transform:translate(-90%,-150%) scale(1)}.s4 .kg-key2{opacity:1;transform:translate(-5%,-120%) scale(1)}
.kg-pieces span{position:absolute;width:9%;aspect-ratio:1;border-radius:50%;display:grid;place-items:center;font-size:clamp(14px,3.4vw,26px);background:var(--c);box-shadow:0 0 0 3px #fde68a;opacity:0;transition:all .9s cubic-bezier(.5,0,.3,1)}
.kg-pieces .p0{left:10%;top:8%}.kg-pieces .p1{left:45.5%;top:4%}.kg-pieces .p2{left:81%;top:8%}
.s1 .kg-pieces span{opacity:1;animation:kgJoin 1.4s cubic-bezier(.5,0,.3,1) forwards}
.s1 .kg-pieces .p0{--x:220%}.s1 .kg-pieces .p2{--x:-220%}.s1 .kg-pieces .p1{--x:0%}
@keyframes kgJoin{0%{transform:scale(.3)}30%{transform:scale(1.15)}100%{transform:translate(var(--x),120%) scale(.2);opacity:0}}
.kg-key{position:absolute;left:50%;top:22%;width:16%;transform:translate(-50%,0) scale(0);opacity:0;transition:transform .6s cubic-bezier(.2,1.6,.4,1),top .8s ease-in,opacity .3s;filter:drop-shadow(0 0 8px #fde68a)}
.s1 .kg-key{opacity:0}.s1 .kg-key{animation:kgKeyIn 1.5s ease forwards}@keyframes kgKeyIn{0%,60%{opacity:0;transform:translate(-50%,0) scale(0)}80%{opacity:1;transform:translate(-50%,0) scale(1.3) rotate(-15deg)}100%{opacity:1;transform:translate(-50%,0) scale(1) rotate(0)}}
.s2 .kg-key{opacity:1;top:58%;transform:translate(-50%,0) scale(.55) rotate(90deg)}
.kg-kid{position:absolute;left:82%;bottom:14%;width:13%;transition:left 1.2s linear}
.kg-kid-svg{display:block;width:100%;transform:scaleX(-1)}
.s4 .kg-kid,.s5 .kg-kid{left:62%}.s6 .kg-kid{left:20%;transition:left 2.3s linear}.s7 .kg-kid,.s8 .kg-kid{left:20%}
.s4 .kg-bob,.s6 .kg-bob{animation:kgStep .32s ease-in-out infinite}@keyframes kgStep{50%{transform:translateY(-4%)}}
.s4 .kg-leg.l,.s6 .kg-leg.l{animation:kgLeg .32s ease-in-out infinite}.s4 .kg-leg.r,.s6 .kg-leg.r{animation:kgLeg .32s ease-in-out infinite reverse}
.kg-leg{transform-box:fill-box;transform-origin:50% 0}@keyframes kgLeg{0%{transform:rotate(18deg)}50%{transform:rotate(-18deg)}100%{transform:rotate(18deg)}}
.kg-arm{transform-box:fill-box;transform-origin:50% 0;transition:transform .4s}.s5 .kg-arm,.s6 .kg-arm,.s7 .kg-arm,.s8 .kg-arm{transform:rotate(150deg)}
.kg-bob{position:relative}.kg-hold{position:absolute;left:-20%;top:-26%;width:70%;display:flex;gap:2%;opacity:0;transform:scale(.3);transition:all .5s cubic-bezier(.2,1.6,.4,1)}.kg-hold i{display:block;flex:1}.kg-hold i:last-child{flex:1.4}
.s5 .kg-hold,.s6 .kg-hold,.s7 .kg-hold,.s8 .kg-hold{opacity:1;transform:scale(1)}.s8 .kg-hold{animation:kgFloat 1s ease-in-out infinite}
.kg-sparks{position:absolute;left:24%;bottom:40%;width:0;height:0}.kg-sparks i{position:absolute;width:8px;height:8px;border-radius:50%;background:#fde047;opacity:0}
.s7 .kg-sparks i{animation:kgSpark .8s ease-out forwards;transform:rotate(var(--a))}@keyframes kgSpark{0%{opacity:1;transform:rotate(var(--a)) translateY(0)}100%{opacity:0;transform:rotate(var(--a)) translateY(-60px)}}
.kg-cap{text-align:center;font-weight:900;font-size:clamp(15px,3.6vw,20px);color:#78350f;margin:10px 0 4px;min-height:1.6em}
.kg-end{display:grid;gap:8px;justify-items:center}.kg-gem-won{display:flex;align-items:center;gap:8px;font-weight:900;color:#0e7490;font-size:18px}.kg-gem-won i{width:34px;display:block;animation:trBob 1.4s infinite}
.s3 .kg-key,.s4 .kg-key,.s5 .kg-key,.s6 .kg-key,.s7 .kg-key,.s8 .kg-key{opacity:0}
.kg-skip{display:block;margin:6px auto 0;background:none;border:0;color:#78716c;font-weight:800;cursor:pointer;font-family:inherit;text-decoration:underline}
.tr-hud-stats .gem{color:#0e7490}
`;
const RS_CSS = `
.tr-resume{display:grid;gap:8px;background:#ecfdf5;border:2px dashed #10b981;border-radius:18px;padding:12px}
.tr-resume-h{font-weight:800;color:#065f46;line-height:1.8}.tr-resume-bar{height:10px;border-radius:99px;background:#d1fae5;overflow:hidden}.tr-resume-bar i{display:block;height:100%;background:linear-gradient(90deg,#10b981,#f59e0b)}
.tr-paused{position:absolute;top:-14px;left:50%;transform:translateX(-50%);background:#0f766e;color:#fff;font-weight:900;font-size:11.5px;border-radius:99px;padding:2px 8px;white-space:nowrap;border:2px solid #fde68a;z-index:3;animation:trBob 1.6s ease-in-out infinite}
`;
