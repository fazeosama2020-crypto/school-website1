// ══════════════════════════════════════════════════════════
// 🗺️ رحلة الكنز: طريقي إلى نافس — بوابة الطالب (#treasure)
// تُحمَّل عند فتح الرابط فقط (React.lazy) فلا تؤثر على سرعة بقية الموقع
// ══════════════════════════════════════════════════════════
import React, { useEffect, useMemo, useRef, useState } from "react";
import { TR_CFG, TR_PROG, TR_TOTAL, TR_PASS, TR_SCHOOL, WORLDS, worldOf, READY, loadStage, SUBJ, LEVELS, Rich, Fig, ar, shuffleIdx, starsOf, arr, obj, lsGet, lsSet, beep, useFonts, BASE_CSS } from "./core.jsx";

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

  const avail = Math.min(READY, cfg && +cfg.upTo ? +cfg.upTo : READY);

  useEffect(() => { (async () => {
    const c = obj(await api.maGet(TR_CFG)); setCfg({ open: c.open !== false, upTo: +c.upTo || READY, onlyG3: c.onlyG3 !== false });
    const saved = lsGet("tr-me", null);
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
    lsSet("tr-me", { sid, ck: st.ck, at: Date.now() }); setView("map");
    try { api.logLogin && api.logLogin({ sid, name: st.name, ck: st.ck, n4: st.n4 || "" }, "treasure"); } catch {}
  }
  const logout = () => { lsSet("tr-me", null); setMe(null); setProg(null); setView("login"); };

  async function play(n) {
    setLoadingStage(n); const s = await loadStage(n); setLoadingStage(0);
    if (!s) { alert("محتوى هذه المرحلة يُجهَّز قريباً"); return; }
    beep("click"); setPlayId(x => x + 1); setStage(s); setView("play"); window.scrollTo(0, 0);
  }

  async function finish(res) {
    const n = stage.n; const old = obj(prog.best && prog.best[n]); const tries = (+old.tries || 0) + 1;
    const better = !old.sc || res.sc >= old.sc;
    const best = { ...obj(prog.best), [n]: better ? { ...res, tries, ts: Date.now() } : { ...old, tries, lastSc: res.sc, sk: res.sk, ts: Date.now() } };
    const stars = { ...obj(prog.stars), [n]: Math.max(+obj(prog.stars)[n] || 0, starsOf(res.sc)) };
    const unlocked = Math.max(+prog.unlocked || 1, res.sc >= TR_PASS ? Math.min(TR_TOTAL, n + 1) : 1);
    const rec = { ...prog, best, stars, unlocked, last: Date.now(), done: Math.max(+prog.done || 0, res.sc >= TR_PASS ? n : 0) };
    setProg(rec); await api.maPut(`${TR_PROG}/${me.id}`, rec);
    return { tries, unlockedNew: unlocked > (+prog.unlocked || 1) };
  }

  const toggleMute = () => { const v = !mute; setMute(v); lsSet("tr-mute", v); };

  return <div className="tr-root tr-pub"><style>{BASE_CSS + PUB_CSS}</style>
    {view === "boot" && <div className="tr-boot"><div className="tr-compass">🧭</div><b className="tr-disp">جارٍ تجهيز الخريطة…</b></div>}
    {view === "login" && <Login api={api} cfg={cfg} onEnter={enter} onBack={onBack} />}
    {view === "map" && cfg && !cfg.open && <Closed onBack={onBack} />}
    {view === "map" && cfg && cfg.open && <MapView me={me} prog={prog} avail={avail} loading={loadingStage} onPlay={play} onLogout={logout} onBack={onBack} mute={mute} toggleMute={toggleMute} />}
    {view === "play" && stage && <Player key={playId} stage={stage} prog={prog} avail={avail} onFinish={finish} onExit={() => { setView("map"); setStage(null); }} onNext={n => play(n)} />}
  </div>;
}

// ══════════ الدخول برقم الهوية ══════════
function Login({ api, cfg, onEnter, onBack }) {
  const [id, setId] = useState(""); const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  const go = async () => {
    const n = normId(id); if (n.length !== 10) { setErr("رقم الهوية يتكوّن من ١٠ أرقام"); return; }
    setBusy(true); setErr("");
    try {
      const h = await api.stuHash(n); const ros = obj(await api.maGet(api.MA_ROSTER)); let found = null;
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
      <p className="tr-lead">٢٠ مرحلة • ٤ عوالم • القراءة والرياضيات والعلوم<br />اجمع المفاتيح وافتح الصناديق حتى تصل إلى الكنز الكبير 🏆</p>
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
function MapView({ me, prog, avail, loading, onPlay, onLogout, onBack, mute, toggleMute }) {
  const cur = Math.min(+prog.unlocked || 1, TR_TOTAL); const stars = obj(prog.stars);
  const totalStars = Object.values(stars).reduce((a, b) => a + (+b || 0), 0);
  const keys = Object.keys(obj(prog.best)).filter(k => (+obj(prog.best[k]).sc || 0) >= TR_PASS).length;
  const curRef = useRef(null);
  useEffect(() => { setTimeout(() => { try { curRef.current && curRef.current.scrollIntoView({ behavior: "smooth", block: "center" }); } catch {} }, 350); }, []);
  return <div className="tr-map">
    <header className="tr-hud">
      <div className="tr-hud-me"><span className="tr-avatar">🧭</span><div><b>{me.name.split(" ").slice(0, 2).join(" ")}</b><small>المستكشف • {ar(me.ck.replace("3-", "ثالث/"))}</small></div></div>
      <div className="tr-hud-stats"><span title="المفاتيح">🗝️ {ar(keys)}</span><span title="النجوم">⭐ {ar(totalStars)}</span></div>
      <div className="tr-hud-act"><button onClick={toggleMute} title="الصوت">{mute ? "🔇" : "🔊"}</button><button onClick={onLogout} title="خروج">🚪</button></div>
    </header>
    <div className="tr-map-title"><h1 className="tr-disp">رحلة الكنز</h1><p>كل مرحلة تفتح التي بعدها — تحتاج {ar(TR_PASS)} من ١٥ لتعبر</p></div>
    {WORLDS.map(w => {
      const done = Array.from({ length: 5 }, (_, i) => w.from + i).every(n => (+obj(prog.best[n]).sc || 0) >= TR_PASS);
      const H = 5 * 118 + 60;
      const pts = XS.map((x, i) => [x, 84 + i * 118]);
      const d = pts.map(([x, y], i) => i === 0 ? `M ${x} ${y}` : `C ${pts[i - 1][0]} ${y - 70}, ${x} ${pts[i - 1][1] + 70}, ${x} ${y}`).join(" ");
      return <section key={w.n} className="tr-world" style={{ "--w1": w.c1, "--w2": w.c2, "--ws": w.soft, "--wsky": w.sky }}>
        <div className="tr-world-head"><span className="tr-world-ic">{w.icon}</span><div><small>العالم {ar(w.n)}</small><b className="tr-disp">{w.name}</b></div><span className={"tr-world-badge" + (done ? " on" : "")} title={w.badgeName}>{done ? w.badge : "🔒"}</span></div>
        <div className="tr-world-body" style={{ height: H }}>
          <Decor w={w.n} />
          <svg className="tr-path" viewBox={`0 0 100 ${H}`} preserveAspectRatio="none" aria-hidden="true"><path d={d} fill="none" stroke="rgba(120,53,15,.35)" strokeWidth="9" strokeLinecap="round" vectorEffect="non-scaling-stroke" /><path d={d} fill="none" stroke="#fff8e7" strokeWidth="3" strokeDasharray="2 10" strokeLinecap="round" vectorEffect="non-scaling-stroke" /></svg>
          {pts.map(([x, y], i) => {
            const n = w.from + i; const b = obj(prog.best[n]); const passed = (+b.sc || 0) >= TR_PASS;
            const open = n <= cur; const soon = open && n > avail; const isCur = open && !passed && !soon;
            const st = +stars[n] || 0;
            return <div key={n} ref={isCur ? curRef : null} className={"tr-node" + (open ? " open" : "") + (passed ? " passed" : "") + (isCur ? " cur" : "") + (soon ? " soon" : "")} style={{ left: x + "%", top: y }}>
              {isCur && <span className="tr-me-pin">🧭</span>}
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
    <div className={"tr-final" + ((+prog.done || 0) >= TR_TOTAL ? " won" : "")}><div className="tr-final-chest">{(+prog.done || 0) >= TR_TOTAL ? "👑" : "💎"}</div><b className="tr-disp">الكنز الكبير</b><small>{(+prog.done || 0) >= TR_TOTAL ? "أنت بطل نافس! 🎉" : "في نهاية الطريق… هل تصل إليه؟"}</small></div>
    {onBack && <div style={{ textAlign: "center", padding: "10px 0 30px" }}><button className="tr-link" onClick={onBack}>العودة لموقع المدرسة</button></div>}
  </div>;
}

function Decor({ w }) {
  const set = { 1: ["🌴", "🌿", "💧", "🌴", "🦜", "🌺"], 2: ["🌵", "🐪", "☀️", "🏜️", "🦂", "🌵"], 3: ["🏔️", "🦅", "❄️", "🌲", "⛰️", "🪨"], 4: ["🌊", "🐚", "🦀", "⚓", "🐠", "🏝️"] }[w];
  const pos = [[8, 9], [86, 22], [12, 40], [88, 58], [6, 76], [84, 90]];
  return <div className="tr-decor" aria-hidden="true">{set.map((e, i) => <span key={i} style={{ right: pos[i][0] + "%", top: pos[i][1] + "%", animationDelay: i * .7 + "s" }}>{e}</span>)}</div>;
}

// ══════════ لاعب المرحلة ══════════
function swapTwin(q) { return q.t ? { ...q, q: q.t.q, fig: q.t.fig, o: q.t.o, a: q.t.a, e: q.t.e, t: { q: q.q, fig: q.fig, o: q.o, a: q.a, e: q.e } } : q; }

function Player({ stage, prog, avail, onFinish, onExit, onNext }) {
  const w = worldOf(stage.n); const [tries] = useState(() => +obj(prog.best[stage.n]).tries || 0);
  const items = useMemo(() => {
    const L = [...stage.read.qs.map(q => ({ ...q, sub: "r" })), ...stage.math.map(q => ({ ...q, sub: "m" })), ...stage.sci.map(q => ({ ...q, sub: "s" }))];
    return L.map(q => tries % 2 ? swapTwin(q) : q);
  }, [stage, tries]);
  const [i, setI] = useState(0);
  const [gate, setGate] = useState("intro"); // intro | gate | q | done
  const [phase, setPhase] = useState("ask"); // ask | ok | wrong | twin | twinok | twinbad
  const [pick, setPick] = useState(null);
  const [res, setRes] = useState([]); // {v:1|.5|0, first:bool}
  const [showText, setShowText] = useState(true);
  const [confirmExit, setConfirmExit] = useState(false);
  const [summary, setSummary] = useState(null);
  const [fx, setFx] = useState(0);
  const topRef = useRef(null);

  const q = items[i]; const sub = SUBJ[q.sub];
  const isTwin = phase === "twin" || phase === "twinok" || phase === "twinbad";
  const cq = isTwin ? { ...q.t, k: q.k } : q;
  const order = useMemo(() => shuffleIdx(cq.o.length, tries * 31 + i * 7 + (isTwin ? 3 : 1)), [i, isTwin, tries]);
  const score = res.reduce((a, r) => a + r.v, 0);

  const scrollTop = () => { try { topRef.current && topRef.current.scrollIntoView({ behavior: "smooth", block: "start" }); } catch {} };
  const check = () => {
    if (pick === null) return; const ok = +pick === +cq.a;
    if (!isTwin) {
      if (ok) { setPhase("ok"); setRes(r => [...r, { v: 1, first: true }]); beep("ok"); setFx(x => x + 1); }
      else if (q.t) { setPhase("wrong"); beep("bad"); }
      else { setPhase("twinbad"); setRes(r => [...r, { v: 0, first: false }]); beep("bad"); }
    } else {
      if (ok) { setPhase("twinok"); setRes(r => [...r, { v: .5, first: false }]); beep("ok"); setFx(x => x + 1); }
      else { setPhase("twinbad"); setRes(r => [...r, { v: 0, first: false }]); beep("bad"); }
    }
  };
  const toTwin = () => { setPick(null); setPhase("twin"); scrollTop(); };
  const next = async () => {
    setPick(null); setPhase("ask");
    if (i + 1 >= items.length) {
      const R = [...res]; const by = s => R.filter((_, j) => items[j].sub === s).reduce((a, r) => a + r.v, 0);
      const sk = {}; items.forEach((it, j) => { const k = it.k || "?"; sk[k] = sk[k] || [0, 0]; sk[k][1]++; if (R[j] && R[j].first) sk[k][0]++; });
      const out = { sc: R.reduce((a, r) => a + r.v, 0), r: by("r"), m: by("m"), s: by("s"), first: R.filter(r => r.first).length, sk };
      setGate("done"); setSummary({ ...out, saving: true });
      const meta = await onFinish(out); setSummary({ ...out, ...meta, saving: false });
      if (out.sc >= TR_PASS) beep("win");
      window.scrollTo(0, 0); return;
    }
    const ni = i + 1; setI(ni);
    if (items[ni].sub !== q.sub) setGate("gate"); else scrollTop();
  };

  if (gate === "done" && summary) return <Result stage={stage} w={w} s={summary} avail={avail} onExit={onExit} onNext={onNext} />;

  return <div className="tr-play" style={{ "--w1": w.c1, "--w2": w.c2, "--ws": w.soft, "--wsky": w.sky, "--sc": sub.c, "--ss": sub.soft }}>
    <header className="tr-play-hud" ref={topRef}>
      <button className="tr-x" onClick={() => setConfirmExit(true)} aria-label="خروج">✕</button>
      <div className="tr-play-t"><small>{w.icon} {w.name}</small><b className="tr-disp">المرحلة {ar(stage.n)}: {stage.title}</b></div>
      <div className="tr-coins" key={fx}><span>🪙</span>{ar(score)}</div>
    </header>
    <div className="tr-dots">{items.map((it, j) => { const r = res[j]; return <i key={j} className={(j === i && gate === "q" ? "cur " : "") + (r ? (r.v === 1 ? "ok" : r.v ? "half" : "bad") : "") + (j % 5 === 0 ? " gap" : "")} style={{ "--c": SUBJ[it.sub].c }} />; })}</div>

    {gate === "intro" && <div className="tr-card tr-intro tr-pop">
      <div className="tr-intro-ic">{w.icon}</div>
      <h2 className="tr-disp">{stage.title}</h2>
      <p className="tr-story"><Rich t={stage.story} /></p>
      <div className="tr-gates">{["r", "m", "s"].map(k => <div key={k} style={{ "--c": SUBJ[k].c, "--s": SUBJ[k].soft }}><span>{SUBJ[k].icon}</span><b>{SUBJ[k].gate}</b><small>{SUBJ[k].name} • ٥ أسئلة</small></div>)}</div>
      <div className="tr-rules">✅ إجابة صحيحة = عملة كاملة 🪙 • ❌ خطأ؟ تأتيك تلميحة وسؤال تعويضي بنصف عملة • تحتاج {ar(TR_PASS)} عملات لتعبر</div>
      {tries > 0 && <div className="tr-rules" style={{ background: "#fef3c7" }}>🔁 هذه محاولتك رقم {ar(tries + 1)} — الأسئلة تتغير في كل محاولة</div>}
      <button className="tr-btn tr-gold tr-big" onClick={() => { setGate("gate"); beep("click"); }}>انطلق 🚀</button>
    </div>}

    {gate === "gate" && <div className="tr-card tr-gatecard tr-pop" style={{ "--c": sub.c, "--s": sub.soft }}>
      <div className="tr-gate-door"><span>{sub.icon}</span></div>
      <small>البوابة {ar(q.sub === "r" ? 1 : q.sub === "m" ? 2 : 3)} من ٣</small>
      <h2 className="tr-disp">{sub.gate}</h2>
      <p>{q.sub === "r" ? "اقرأ النص بتمعّن ثم أجب — النص يبقى أمامك طوال الأسئلة" : q.sub === "m" ? "فكّر بهدوء، واكتب خطواتك في ورقة جانبية إن احتجت" : "لاحظ الرسوم والجداول جيداً، فالعالِم يستنتج من الأدلة"}</p>
      <button className="tr-btn tr-big" style={{ background: sub.c, color: "#fff" }} onClick={() => { setGate("q"); beep("click"); }}>ادخل البوابة ←</button>
    </div>}

    {gate === "q" && <>
      {q.sub === "r" && <div className={"tr-card tr-passage" + (showText ? "" : " closed")}>
        <button className="tr-passage-h" onClick={() => setShowText(v => !v)}><span>📜 {stage.read.title}</span><small>{showText ? "إخفاء النص ▲" : "عرض النص ▼"}</small></button>
        {showText && <div className="tr-passage-b">{stage.read.text.map((p, j) => <p key={j}><Rich t={p} /></p>)}{stage.read.fig && <Fig f={stage.read.fig} />}</div>}
      </div>}

      <div className={"tr-card tr-q " + (phase === "wrong" ? "shake" : "") + (isTwin ? " twin" : "")} key={i + (isTwin ? "t" : "")}>
        <div className="tr-q-meta">
          <span className="tr-chip" style={{ background: sub.soft, color: sub.c }}>{sub.icon} {sub.name}</span>
          <span className="tr-chip">السؤال {ar(i + 1)} / ١٥</span>
          {q.lv && <span className="tr-chip lv">{LEVELS[q.lv]}</span>}
          {isTwin && <span className="tr-chip tw">🔄 سؤال تعويضي</span>}
        </div>
        <div className="tr-q-text"><Rich t={cq.q} /></div>
        <Fig f={cq.fig} />
        <div className={"tr-opts" + (cq.o.some(o => String(o).length > 28) ? " col" : "")}>
          {order.map((oi, j) => {
            const done = phase !== "ask" && phase !== "twin"; const right = oi === +cq.a;
            const cls = "tr-opt" + (pick === oi ? " sel" : "") + (done && right && phase !== "wrong" ? " right" : "") + (done && pick === oi && !right ? " wrong" : "");
            return <button key={oi} className={cls} disabled={done} onClick={() => { setPick(oi); beep("click"); }}><span className="tr-let">{LET[j]}</span><span className="tr-opt-t"><Rich t={cq.o[oi]} /></span></button>;
          })}
        </div>

        {(phase === "ask" || phase === "twin") && <button className="tr-btn tr-big tr-check" disabled={pick === null} onClick={check}>تحقّق ✓</button>}

        {phase === "ok" && <Feedback kind="ok" title={["أحسنت! 🌟", "رائع يا بطل! 🔥", "إجابة ذكية! 💡", "ممتاز! 🎯"][i % 4]} e={cq.e} onNext={next} last={i === items.length - 1} />}
        {phase === "wrong" && <div className="tr-fb hint tr-pop">
          <b>💡 تلميحة</b><p><Rich t={q.h || "أعد قراءة السؤال وحدّد المطلوب بدقة، ثم استبعد الخيارات غير المنطقية."} /></p>
          <button className="tr-btn tr-big" style={{ background: "#7c3aed", color: "#fff" }} onClick={toTwin}>جرّب السؤال التعويضي 🔄</button>
        </div>}
        {phase === "twinok" && <Feedback kind="ok" title="عوّضتها! نصف عملة 🪙" e={cq.e} onNext={next} last={i === items.length - 1} />}
        {phase === "twinbad" && <Feedback kind="bad" title="لا بأس — تعلّم منها 💪" ans={cq.o[+cq.a]} e={cq.e} onNext={next} last={i === items.length - 1} />}
      </div>
    </>}

    {fx > 0 && (phase === "ok" || phase === "twinok") && <Burst key={"b" + fx} />}
    {confirmExit && <div className="tr-modal" onClick={() => setConfirmExit(false)}><div className="tr-card tr-pop" onClick={e => e.stopPropagation()} style={{ maxWidth: 360, textAlign: "center" }}><div style={{ fontSize: 40 }}>🧭</div><b className="tr-disp" style={{ fontSize: 22 }}>تغادر المرحلة؟</b><p style={{ color: "#78716c", fontWeight: 700 }}>لن تُحفظ إجاباتك في هذه المرحلة، وستبدأها من جديد لاحقاً.</p><div style={{ display: "flex", gap: 8 }}><button className="tr-btn" style={{ flex: 1, background: "#f5f5f4" }} onClick={() => setConfirmExit(false)}>أكمل</button><button className="tr-btn" style={{ flex: 1, background: "#dc2626", color: "#fff" }} onClick={onExit}>مغادرة</button></div></div></div>}
  </div>;
}

function Feedback({ kind, title, e, ans, onNext, last }) {
  return <div className={"tr-fb tr-pop " + kind}>
    <b>{title}</b>
    {ans !== undefined && <p>الإجابة الصحيحة: <b><Rich t={ans} /></b></p>}
    {e && <p className="tr-exp"><Rich t={e} /></p>}
    <button className="tr-btn tr-big tr-gold" onClick={onNext}>{last ? "افتح الصندوق 🧰" : "التالي ←"}</button>
  </div>;
}

function Burst() {
  return <div className="tr-burst" aria-hidden="true">{Array.from({ length: 14 }, (_, i) => <i key={i} style={{ "--a": (i * 360 / 14) + "deg", "--d": (60 + (i % 3) * 25) + "px" }}>{["🪙", "✨", "⭐"][i % 3]}</i>)}</div>;
}

function Result({ stage, w, s, avail, onExit, onNext }) {
  const pass = s.sc >= TR_PASS; const st = starsOf(s.sc); const n = stage.n;
  const worldDone = pass && n === w.to; const hasNext = pass && n < TR_TOTAL;
  const nextOpen = hasNext && n + 1 <= avail;
  return <div className="tr-play tr-result" style={{ "--w1": w.c1, "--w2": w.c2, "--ws": w.soft, "--wsky": w.sky }}>
    {pass && <div className="tr-confetti" aria-hidden="true">{Array.from({ length: 40 }, (_, i) => <i key={i} style={{ left: (i * 2.5) + "%", animationDelay: (i % 10) * .12 + "s", background: ["#f59e0b", "#ef4444", "#10b981", "#3b82f6", "#a855f7"][i % 5] }} />)}</div>}
    <div className="tr-card tr-pop" style={{ textAlign: "center" }}>
      <div className={"tr-big-chest" + (pass ? " open" : "")}>{pass ? (worldDone ? w.badge : "🗝️") : "🧰"}</div>
      <h2 className="tr-disp" style={{ fontSize: 30, margin: "4px 0" }}>{pass ? (worldDone ? `حصلت على ${w.badgeName}!` : "عبرت المرحلة!") : "اقتربت كثيراً!"}</h2>
      <div className="tr-res-stars">{[1, 2, 3].map(k => <i key={k} className={k <= st ? "on" : ""} style={{ animationDelay: k * .25 + "s" }}>★</i>)}</div>
      <div className="tr-res-score"><b>{ar(s.sc)}</b> <span>من ١٥</span></div>
      <div className="tr-res-subs">{[["r", s.r], ["m", s.m], ["s", s.s]].map(([k, v]) => <div key={k} style={{ "--c": SUBJ[k].c, "--s": SUBJ[k].soft }}><span>{SUBJ[k].icon}</span><b>{ar(v)} / ٥</b><small>{SUBJ[k].name}</small><i style={{ width: (v / 5 * 100) + "%" }} /></div>)}</div>
      <p className="tr-res-msg">{pass ? (st === 3 ? "أداء أسطوري! ثلاث نجوم كاملة 🌟" : `أصبت ${ar(s.first)} من أول محاولة — أعد المرحلة متى شئت لتجمع نجوماً أكثر`) : `تحتاج ${ar(TR_PASS)} عملات لتعبر — راجع التلميحات وحاول مرة أخرى، ستتغير الأسئلة 💪`}</p>
      {s.saving && <small style={{ color: "#78716c" }}>جارٍ حفظ تقدمك…</small>}
      <div className="tr-res-act">
        {nextOpen && <button className="tr-btn tr-gold tr-big" onClick={() => onNext(n + 1)}>المرحلة {ar(n + 1)} ←</button>}
        {hasNext && !nextOpen && <div className="tr-rules">🔓 فُتحت المرحلة {ar(n + 1)} — ستتاح قريباً من إدارة المدرسة</div>}
        <button className="tr-btn tr-big" style={{ background: pass ? "#f5f5f4" : "#7c3aed", color: pass ? "#1c1917" : "#fff" }} onClick={onExit}>{pass ? "🗺️ العودة للخريطة" : "🗺️ الخريطة ثم المحاولة"}</button>
      </div>
    </div>
  </div>;
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
`;
