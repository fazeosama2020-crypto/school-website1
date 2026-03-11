import { useState, useEffect, useRef } from "react";

const FIREBASE_URL = "https://school-website-e3b8d-default-rtdb.firebaseio.com";

const DB = {
  async get(key, fallback) {
    try {
      const r = await fetch(`${FIREBASE_URL}/school/${key}.json`);
      const data = await r.json();
      return data !== null ? data : fallback;
    } catch { return fallback; }
  },
  async set(key, value) {
    try {
      await fetch(`${FIREBASE_URL}/school/${key}.json`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(value)
      });
    } catch (e) { console.error(e); }
  }
};

const DEFAULT_TEACHERS = [
  "طالب حمدي مبروك اليوبي","نايف عقال شريم الزهراني","حبيب سعد حبيب السلمي",
  "عبدالحميد عبدالمعطي حميد اللقماني","معيض صالح محمد القرني",
  "عبدالواحد بن مبارك بن عبدالواحد الجبعه الخنفري القحطاني",
  "حامد محمد عبدالله الزهراني","رامي علي حسن ال مطر الغامدي","حسن حامد إبراهيم الساعدي",
  "فواز محمد عطيه الثقفي","رجيان رويحي عتيق الله السلمي","صالح احمد سعيد الغامدي",
  "بندر فيحان طلق السلمي","عبدالله عبدالرحيم محمد الطلحي","عبدالرحمن ابراهيم علي الفقيه",
  "سلطان حمد محمد المقاطي العتيبي","عبدالهادي بن سالم بن عويتق المعبدي الحربي",
  "فهد عبيد عبدالله النباتي","طلال سعد ساعد السلمي","هاني رده لافي الجحدلي",
  "عبد الله حامد خليوي اللقماني","ضيف الله حلسان صالح الزهراني",
  "حامد بن عبد الله بن علي المحمادي","صالح أحمد سميح المجنوني","محمد عوض عبدالله الجابري",
  "محمد مساعد فويران اللحياني","مسلم سعد مسعود الجهني","مشعل مساعد عيد الحربي",
  "بدر سرور مسعد العتيبي","وليد مسلم سليم السهلي","مصلح محمد مصلح المعبدي",
  "جازي عبدالرحمن عبدربه الثبيتي","بدر حمد محمد اللهيبي","عطيه سعيد علي الغامدي",
  "علي عبدالله حزام بن عبود","محمد علي عبدالله المحوري"
];

const DEFAULT_WEEK = {
  days: [
    { name: "الأحد", dateH: "01/09/1447", dateM: "01/03/2026" },
    { name: "الاثنين", dateH: "02/09/1447", dateM: "02/03/2026" },
    { name: "الثلاثاء", dateH: "03/09/1447", dateM: "03/03/2026" },
    { name: "الأربعاء", dateH: "04/09/1447", dateM: "04/03/2026" },
    { name: "الخميس", dateH: "05/09/1447", dateM: "05/03/2026" },
  ]
};

const ABSENCE_TYPES = ["حاضر", "اضطراري", "مرضي", "اعتيادي"];
const FARES_OPTIONS = ["—", "نعم ✓", "لا ✗"];

const DEFAULT_ANNOUNCEMENTS = [
  { id: 1, title: "تعميم بخصوص اختبارات منتصف الفصل", date: "28/08/1447 هـ", category: "تعاميم", priority: "عاجل", content: "يُعلن عن بدء اختبارات منتصف الفصل الدراسي الثالث يوم الأحد القادم.", pinned: true },
  { id: 2, title: "دورة تدريبية في استراتيجيات التعلم النشط", date: "27/08/1447 هـ", category: "تدريب", priority: "عادي", content: "تُقام دورة تدريبية بعنوان استراتيجيات التعلم النشط يوم الثلاثاء.", pinned: false },
  { id: 3, title: "إجازة اليوم الوطني", date: "25/08/1447 هـ", category: "إعلانات", priority: "عادي", content: "تُمنح إجازة رسمية بمناسبة اليوم الوطني السعودي.", pinned: false },
  { id: 4, title: "اجتماع مجلس الآباء", date: "24/08/1447 هـ", category: "اجتماعات", priority: "مهم", content: "يُعقد اجتماع مجلس الآباء والمعلمين يوم الأربعاء الساعة 6 مساءً.", pinned: true },
];

const DEFAULT_ACTIVITIES = [
  { id: 1, title: "مسابقة القرآن الكريم", date: "01/09/1447 هـ", type: "ديني", description: "مسابقة في حفظ وتلاوة القرآن الكريم.", responsible: "أحمد العتيبي", status: "قادم", image: "📖" },
  { id: 2, title: "بطولة كرة القدم", date: "02/09/1447 هـ", type: "رياضي", description: "بطولة كرة القدم بين فصول المدرسة.", responsible: "خالد الشهري", status: "جاري", image: "⚽" },
  { id: 3, title: "معرض العلوم", date: "03/09/1447 هـ", type: "علمي", description: "معرض للمشاريع العلمية والابتكارات الطلابية.", responsible: "فهد القحطاني", status: "قادم", image: "🔬" },
  { id: 4, title: "ورشة الخط العربي", date: "04/09/1447 هـ", type: "ثقافي", description: "ورشة عمل لتعليم فنون الخط العربي.", responsible: "عبدالرحمن الغامدي", status: "مكتمل", image: "🖋️" },
  { id: 5, title: "رحلة متحف التاريخ", date: "05/09/1447 هـ", type: "ترفيهي", description: "رحلة ميدانية لزيارة متحف التاريخ الوطني.", responsible: "محمد الدوسري", status: "قادم", image: "🏛️" },
];

const DEFAULT_USERS = [
  { username: "admin", password: "admin123", role: "مدير", name: "مدير المدرسة" },
  { username: "wakil", password: "wakil123", role: "وكيل", name: "وكيل شؤون المعلمين" },
];

const FONTS = [
  { label: "نوتو نسخ", value: "'Noto Naskh Arabic', serif" },
  { label: "نوتو كوفي", value: "'Noto Kufi Arabic', sans-serif" },
  { label: "القاهرة", value: "'Cairo', sans-serif" },
  { label: "تجوال", value: "'Tajawal', sans-serif" },
  { label: "ريم الكوفي", value: "'Reem Kufi', sans-serif" },
  { label: "لطيف", value: "'Lateef', serif" },
  { label: "أميري", value: "'Amiri', serif" },
];

// ===== ثوابت سجل التقييم =====
const SUBJECTS = [
  { key: "math", label: "رياضيات", color: "#C00000" },
  { key: "sci",  label: "علوم",     color: "#375623" },
  { key: "eng",  label: "إنجليزي",  color: "#7030A0" },
  { key: "arab", label: "لغتي",     color: "#C55A11" },
  { key: "soc",  label: "اجتماعيات",color: "#2E75B6" },
  { key: "isl",  label: "تربية إسلامية", color: "#833C00" },
];

const GRADE_OPTIONS = [
  { value: "",       label: "— اختر —",  bg: "#f5f5f5",  color: "#aaa",    border: "#ddd"    },
  { value: "weak",   label: "ضعيف",      bg: "#FF6B6B",  color: "#fff",    border: "#e05555" },
  { value: "accept", label: "مقبول",     bg: "#FFD93D",  color: "#5a4200", border: "#e6c100" },
  { value: "good",   label: "جيد",       bg: "#A8E6CF",  color: "#1a4a30", border: "#7dc8a0" },
  { value: "vgood",  label: "جيد جداً", bg: "#4ECDC4",  color: "#fff",    border: "#2db8ae" },
  { value: "excel",  label: "ممتاز",     bg: "#2ECC71",  color: "#fff",    border: "#27ae60" },
];

// ===== فصل مُحمَّل مسبقاً من ملف الإكسل =====
const PRELOADED_CLASS = {
  id: "cls-preloaded-1a",
  name: "الصف الأول / أ",
  level: "الصف الأول",
  section: "أ",
  teacher: "",
  semester: "الثالث",
  students: [
    {id:1700000000,num:1,name:"أحمد عطيه احمد الزهراني",nationalId:"1182501021",grades:{}},
    {id:1700000001,num:2,name:"أحمد محمد عويض القثامي",nationalId:"1165040138",grades:{}},
    {id:1700000002,num:3,name:"أنس سعود ابن مسري العتيبي",nationalId:"1166167831",grades:{}},
    {id:1700000003,num:4,name:"أنس غازي فرح العتيبي",nationalId:"1165535574",grades:{}},
    {id:1700000004,num:5,name:"البراء جابر احمد العمري",nationalId:"1165690155",grades:{}},
    {id:1700000005,num:6,name:"بتال عبدالله سعيد عطيه الزهراني",nationalId:"1166803187",grades:{}},
    {id:1700000006,num:7,name:"حماده محمد أحمد كناني",nationalId:"401231",grades:{}},
    {id:1700000007,num:8,name:"حمود تركي حصين البقمي",nationalId:"1164649848",grades:{}},
    {id:1700000008,num:9,name:"خالد عبدالله سعد الربيعي",nationalId:"1164213611",grades:{}},
    {id:1700000009,num:10,name:"راكان اسعد بن عيضه الحربي",nationalId:"1159582798",grades:{}},
    {id:1700000010,num:11,name:"رداد ضيف الله الراجحي",nationalId:"0160793238",grades:{}},
    {id:1700000011,num:12,name:"ريان حسين أحمد الزبيدي",nationalId:"1167468303",grades:{}},
    {id:1700000012,num:13,name:"عبدالرحمن نواف حجاب العتيبي",nationalId:"1165700863",grades:{}},
    {id:1700000013,num:14,name:"عبدالعزيز رجيان بن رويحي السلمي",nationalId:"1166369197",grades:{}},
    {id:1700000014,num:15,name:"عبدالعزيز عبدربه عبدالقادر اليامي",nationalId:"1166018455",grades:{}},
    {id:1700000015,num:16,name:"عبدالعزيز مشاري شباب العتيبي",nationalId:"1163926809",grades:{}},
    {id:1700000016,num:17,name:"عبداللطيف احمد علي الشهري",nationalId:"1166779452",grades:{}},
    {id:1700000017,num:18,name:"عبدالله محمد سفر العتيبى",nationalId:"1163919697",grades:{}},
    {id:1700000018,num:19,name:"علي محمد علي الزهراني",nationalId:"1165091149",grades:{}},
    {id:1700000019,num:20,name:"عمر مشعل محمد النفيعي",nationalId:"1166159960",grades:{}},
    {id:1700000020,num:21,name:"فارس عائض مقعد الغامدي",nationalId:"1162985525",grades:{}},
    {id:1700000021,num:22,name:"فراس عبدالله متعب الزهراني",nationalId:"1163565870",grades:{}},
    {id:1700000022,num:23,name:"فراس عجاب بعاج العضياني",nationalId:"1161629686",grades:{}},
    {id:1700000023,num:24,name:"فراس محمد عوض الشهري",nationalId:"1164941682",grades:{}},
    {id:1700000024,num:25,name:"فواز زكريا محمد الشريف",nationalId:"1166796266",grades:{}},
  ]
};
  const c = { teal: "bg-teal-100 text-teal-800", red: "bg-red-100 text-red-700", amber: "bg-amber-100 text-amber-800", blue: "bg-blue-100 text-blue-800", green: "bg-green-100 text-green-800", purple: "bg-purple-100 text-purple-800", gray: "bg-gray-100 text-gray-600" };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${c[color] || c.teal}`}>{children}</span>;
}

function StatCard({ icon, label, value, color }) {
  return (
    <div className={`rounded-2xl p-4 ${color} shadow-sm flex items-center gap-4 transition-transform hover:scale-105`}>
      <div className="text-3xl">{icon}</div>
      <div><div className="text-2xl font-black">{value}</div><div className="text-sm opacity-80 font-medium">{label}</div></div>
    </div>
  );
}

function RichEditor({ value, onChange }) {
  const editorRef = useRef(null);
  const fileRef = useRef(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showStickers, setShowStickers] = useState(false);
  const [showColors, setShowColors] = useState(false);
  const [showBgColors, setShowBgColors] = useState(false);
  const [showFonts, setShowFonts] = useState(false);

  const emojis = ["⭐","🎉","📢","📌","🔔","✅","❌","❗","⚠️","💡","📅","🏫","👨‍🏫","👨‍🎓","📖","🖋️","🎓","🏆","🥇","⚽","🔬","🎨","🎵","💪","👏","🤝","💐","🌟","✨","🔥","💯","❤️","💚","💙","🇸🇦","🌙","☀️","🌈","🎯","📝","🏅","🌺","🍀","🦁","🦅","🕌","🤲","🫶","😊","😄","👍","🙏"];
  const stickers = ["🏆 تهانينا!","⭐ ممتاز!","✅ تم بنجاح","📢 تنبيه مهم","🎉 مبروك!","💡 تذكير","⚠️ عاجل","📌 ملاحظة","🏫 من إدارة المدرسة","👨‍🏫 للمعلمين الكرام","👨‍🎓 للطلاب الأعزاء","🤝 بالتوفيق للجميع","🌟 إعلان هام","🎯 للاهتمام"];
  const textColors = ["#000000","#DC2626","#059669","#2563EB","#7C3AED","#D97706","#DB2777","#0D9488","#B45309","#1D4ED8","#065F46","#7F1D1D","#1E40AF","#166534"];
  const bgColors = ["transparent","#FEF3C7","#DCFCE7","#DBEAFE","#F3E8FF","#FFE4E6","#E0F2FE","#FEF9C3","#D1FAE5","#FCE7F3","#FFF7ED","#F0FDF4"];

  const exec = (cmd, val = null) => { document.execCommand(cmd, false, val); editorRef.current?.focus(); };
  const handleImage = (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { exec("insertHTML", `<img src="${ev.target.result}" style="max-width:100%;border-radius:12px;margin:8px 0;display:block;" />`); };
    reader.readAsDataURL(file); e.target.value = "";
  };
  const handleInput = () => { if (editorRef.current) onChange(editorRef.current.innerHTML); };
  useEffect(() => { if (editorRef.current && !editorRef.current.innerHTML && value) editorRef.current.innerHTML = value; }, []);
  const closeAll = () => { setShowEmoji(false); setShowStickers(false); setShowColors(false); setShowBgColors(false); setShowFonts(false); };

  const ToolBtn = ({ onClick, title, children }) => (
    <button type="button" onClick={onClick} title={title}
      className="h-8 px-2 rounded-lg flex items-center justify-center text-xs hover:bg-teal-100 bg-gray-50 text-gray-700 font-medium transition-all whitespace-nowrap">
      {children}
    </button>
  );

  return (
    <div className="border-2 border-gray-200 rounded-xl overflow-visible focus-within:border-teal-400 transition-all">
      <div className="bg-gray-50 p-2 flex flex-wrap gap-1 border-b border-gray-200">
        <ToolBtn onClick={() => exec("bold")} title="غامق"><b>غامق</b></ToolBtn>
        <ToolBtn onClick={() => exec("italic")} title="مائل"><i>مائل</i></ToolBtn>
        <ToolBtn onClick={() => exec("underline")} title="تحته خط"><u>خط</u></ToolBtn>
        <div className="w-px bg-gray-300 mx-1"></div>
        <select onChange={e => exec("fontSize", e.target.value)} defaultValue="3"
          className="h-8 px-1 rounded-lg bg-gray-50 border border-gray-200 text-xs cursor-pointer focus:outline-none">
          <option value="1">صغير جداً</option><option value="2">صغير</option><option value="3">متوسط</option>
          <option value="4">كبير</option><option value="5">كبير جداً</option><option value="6">ضخم</option><option value="7">ضخم جداً</option>
        </select>
        <div className="relative">
          <ToolBtn onClick={() => { closeAll(); setShowFonts(!showFonts); }} title="نوع الخط">🔤 الخط</ToolBtn>
          {showFonts && (
            <div className="absolute top-10 right-0 bg-white rounded-xl shadow-xl border border-gray-200 p-2 z-50 w-44">
              {FONTS.map(f => (
                <button key={f.value} onClick={() => { exec("fontName", f.value); setShowFonts(false); }}
                  className="w-full text-right px-3 py-2 rounded-lg hover:bg-teal-50 text-sm" style={{ fontFamily: f.value }}>{f.label}</button>
              ))}
            </div>
          )}
        </div>
        <div className="w-px bg-gray-300 mx-1"></div>
        <ToolBtn onClick={() => exec("justifyRight")} title="يمين">⬅ يمين</ToolBtn>
        <ToolBtn onClick={() => exec("justifyCenter")} title="وسط">↔ وسط</ToolBtn>
        <ToolBtn onClick={() => exec("justifyLeft")} title="يسار">➡ يسار</ToolBtn>
        <div className="w-px bg-gray-300 mx-1"></div>
        <div className="relative">
          <ToolBtn onClick={() => { closeAll(); setShowColors(!showColors); }} title="لون النص">🎨 لون</ToolBtn>
          {showColors && (
            <div className="absolute top-10 right-0 bg-white rounded-xl shadow-xl border border-gray-200 p-2 z-50 flex gap-1 flex-wrap w-44">
              {textColors.map(c => (
                <button key={c} onClick={() => { exec("foreColor", c); setShowColors(false); }}
                  className="w-7 h-7 rounded-full border-2 border-gray-200 hover:scale-110 transition-transform" style={{ backgroundColor: c }}></button>
              ))}
            </div>
          )}
        </div>
        <div className="relative">
          <ToolBtn onClick={() => { closeAll(); setShowBgColors(!showBgColors); }} title="خلفية">🖌 خلفية</ToolBtn>
          {showBgColors && (
            <div className="absolute top-10 right-0 bg-white rounded-xl shadow-xl border border-gray-200 p-2 z-50 flex gap-1 flex-wrap w-44">
              {bgColors.map(c => (
                <button key={c} onClick={() => { exec("hiliteColor", c); setShowBgColors(false); }}
                  className="w-7 h-7 rounded-full border-2 border-gray-200 hover:scale-110 transition-transform"
                  style={{ backgroundColor: c === "transparent" ? "#fff" : c }}>{c === "transparent" ? "✕" : ""}</button>
              ))}
            </div>
          )}
        </div>
        <div className="w-px bg-gray-300 mx-1"></div>
        <ToolBtn onClick={() => fileRef.current?.click()} title="إضافة صورة">📷 صورة</ToolBtn>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
        <div className="relative">
          <ToolBtn onClick={() => { closeAll(); setShowEmoji(!showEmoji); }} title="إيموجي">😊 إيموجي</ToolBtn>
          {showEmoji && (
            <div className="absolute top-10 right-0 bg-white rounded-xl shadow-xl border border-gray-200 p-2 z-50 flex gap-1 flex-wrap w-64 max-h-48 overflow-y-auto">
              {emojis.map(e => (
                <button key={e} onClick={() => { exec("insertText", e); setShowEmoji(false); }}
                  className="w-9 h-9 rounded-lg hover:bg-gray-100 flex items-center justify-center text-xl">{e}</button>
              ))}
            </div>
          )}
        </div>
        <div className="relative">
          <ToolBtn onClick={() => { closeAll(); setShowStickers(!showStickers); }} title="ملصقات">🏷️ ملصق</ToolBtn>
          {showStickers && (
            <div className="absolute top-10 right-0 bg-white rounded-xl shadow-xl border border-gray-200 p-2 z-50 w-56 max-h-52 overflow-y-auto">
              {stickers.map(s => (
                <button key={s} onClick={() => {
                  exec("insertHTML", `<span style="display:inline-block;background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:2px 10px;margin:2px;font-size:13px;">${s}</span>`);
                  setShowStickers(false);
                }} className="w-full text-right px-2 py-2 rounded-lg hover:bg-teal-50 text-sm">{s}</button>
              ))}
            </div>
          )}
        </div>
        <ToolBtn onClick={() => exec("insertUnorderedList")} title="قائمة">• قائمة</ToolBtn>
      </div>
      <div ref={editorRef} contentEditable dir="rtl" onInput={handleInput}
        className="min-h-36 p-4 text-sm leading-relaxed focus:outline-none"
        style={{ direction: "rtl", fontFamily: "'Noto Naskh Arabic', serif" }}
        data-placeholder="اكتب محتوى الإعلان هنا…"></div>
      <style>{`[contenteditable]:empty:before { content: attr(data-placeholder); color: #9CA3AF; pointer-events: none; }`}</style>
    </div>
  );
}

function LoginPage({ users, onLogin, siteFont, onParentPortal }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);

  const handleLogin = () => {
    const u = users.find(u => u.username === username && u.password === password);
    if (u) { onLogin(u); setError(""); } else setError("اسم المستخدم أو كلمة المرور غير صحيحة");
  };

  return (
    <div dir="rtl" className="min-h-screen flex items-center justify-center p-4"
      style={{ fontFamily: siteFont, background: "linear-gradient(135deg, #0d9488 0%, #065f46 50%, #064e3b 100%)" }}>
      <div className="relative w-full max-w-sm">
        <div className="text-center text-white mb-8">
          <div className="text-6xl mb-4">🏫</div>
          <h1 className="text-2xl font-black mb-1">مدرسة عبيدة بن الحارث المتوسطة</h1>
          <p className="opacity-70 text-sm">بوابة الإدارة المدرسية الإلكترونية</p>
        </div>
        <div className="bg-white rounded-3xl p-6 shadow-2xl">
          <h2 className="text-center font-bold text-gray-800 mb-5">تسجيل الدخول</h2>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1 block">اسم المستخدم</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="أدخل اسم المستخدم"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-teal-400 focus:outline-none text-sm" onKeyDown={e => e.key === "Enter" && handleLogin()} />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1 block">كلمة المرور</label>
              <div className="relative">
                <input type={showPass ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="أدخل كلمة المرور"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-teal-400 focus:outline-none text-sm" onKeyDown={e => e.key === "Enter" && handleLogin()} />
                <button onClick={() => setShowPass(!showPass)} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{showPass ? "🙈" : "👁️"}</button>
              </div>
            </div>
            {error && <div className="bg-red-50 text-red-600 text-xs font-bold p-3 rounded-xl text-center">{error}</div>}
            <button onClick={handleLogin} className="w-full py-3 rounded-xl bg-gradient-to-l from-teal-500 to-emerald-600 text-white font-bold hover:shadow-lg transition-all">دخول — الإدارة</button>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <button onClick={onParentPortal}
              className="w-full py-3 rounded-xl bg-gradient-to-l from-blue-500 to-indigo-600 text-white font-bold hover:shadow-lg transition-all text-sm">
              👨‍👦 بوابة أولياء الأمور — متابعة مستوى الطالب
            </button>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-gray-50 rounded-lg p-2 text-center"><span className="font-bold">المدير:</span><div className="text-gray-500">admin / admin123</div></div>
              <div className="bg-gray-50 rounded-lg p-2 text-center"><span className="font-bold">الوكيل:</span><div className="text-gray-500">wakil / wakil123</div></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HomePage({ teachers, announcements, activities, navigate }) {
  return (
    <div>
      <div className="bg-gradient-to-l from-teal-600 via-teal-700 to-emerald-800 rounded-3xl p-8 mb-6 text-white text-center shadow-xl">
        <div className="text-5xl mb-4">🏫</div>
        <h1 className="text-3xl font-black mb-2">مدرسة عبيدة بن الحارث المتوسطة</h1>
        <p className="opacity-80 text-lg">بوابة الإدارة المدرسية الإلكترونية</p>
        <p className="opacity-60 text-sm mt-2">العام الدراسي ١٤٤٧ هـ</p>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-6 sm:grid-cols-4">
        <StatCard icon="👨‍🏫" label="معلم وإداري" value={teachers.length} color="bg-white" />
        <StatCard icon="👨‍🎓" label="طالب" value="٤٥٣" color="bg-white" />
        <StatCard icon="📢" label="إعلان نشط" value={announcements.length} color="bg-white" />
        <StatCard icon="⚡" label="نشاط هذا الأسبوع" value={activities.length} color="bg-white" />
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="text-center mb-6">
          <h3 className="text-xl font-black text-teal-900 mb-1">رؤيتنا ورسالتنا</h3>
          <div className="w-16 h-1 bg-teal-500 rounded-full mx-auto"></div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="bg-gradient-to-b from-teal-50 to-white rounded-2xl p-5 text-center border border-teal-100">
            <div className="text-3xl mb-3">🔭</div>
            <h4 className="font-black text-teal-800 mb-2">الرؤية</h4>
            <p className="text-sm text-gray-600 leading-relaxed">بيئة تعليمية محفّزة تصنع جيلاً واعياً ومبدعاً قادراً على بناء مستقبل وطنه.</p>
          </div>
          <div className="bg-gradient-to-b from-emerald-50 to-white rounded-2xl p-5 text-center border border-emerald-100">
            <div className="text-3xl mb-3">🎯</div>
            <h4 className="font-black text-emerald-800 mb-2">الرسالة</h4>
            <p className="text-sm text-gray-600 leading-relaxed">تقديم تعليم نوعي يُراعي الفروق الفردية في شراكة فاعلة بين المدرسة والأسرة.</p>
          </div>
          <div className="bg-gradient-to-b from-green-50 to-white rounded-2xl p-5 text-center border border-green-100">
            <div className="text-3xl mb-3">⭐</div>
            <h4 className="font-black text-green-800 mb-2">أهدافنا</h4>
            <p className="text-sm text-gray-600 leading-relaxed">تعزيز القيم الإسلامية ورفع التحصيل الدراسي وتطوير مهارات المعلمين.</p>
          </div>
        </div>
      </div>
      <h3 className="font-bold text-gray-700 mb-3">🌐 المنصات المدرسية</h3>
      <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-3">
        <a href="https://school-website1.vercel.app" target="_blank" rel="noopener noreferrer"
          className="bg-gradient-to-bl from-teal-500 to-emerald-700 rounded-2xl p-6 text-center shadow-md hover:shadow-xl transition-all group cursor-pointer text-white">
          <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">🏫</div>
          <div className="font-black text-lg mb-1">بوابة الإدارة</div>
          <div className="text-sm opacity-80">غياب · إعلانات · أنشطة</div>
          <div className="mt-3 text-xs bg-white bg-opacity-20 rounded-lg px-3 py-1 inline-block">فتح المنصة ←</div>
        </a>
        <a href="https://stupendous-youtiao-c6d666.netlify.app/" target="_blank" rel="noopener noreferrer"
          className="bg-gradient-to-bl from-blue-500 to-indigo-700 rounded-2xl p-6 text-center shadow-md hover:shadow-xl transition-all group cursor-pointer text-white">
          <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">📝</div>
          <div className="font-black text-lg mb-1">منصة الاختبارات</div>
          <div className="text-sm opacity-80">الاختبارات والتقييمات</div>
          <div className="mt-3 text-xs bg-white bg-opacity-20 rounded-lg px-3 py-1 inline-block">فتح المنصة ←</div>
        </a>
        <a href="https://fazeosama2020-crypto.github.io/school/" target="_blank" rel="noopener noreferrer"
          className="bg-gradient-to-bl from-purple-500 to-violet-700 rounded-2xl p-6 text-center shadow-md hover:shadow-xl transition-all group cursor-pointer text-white">
          <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">📊</div>
          <div className="font-black text-lg mb-1">ملف الأداء الوظيفي</div>
          <div className="text-sm opacity-80">تقييم المعلمين والشواهد</div>
          <div className="mt-3 text-xs bg-white bg-opacity-20 rounded-lg px-3 py-1 inline-block">فتح المنصة ←</div>
        </a>
      </div>
      <h3 className="font-bold text-gray-700 mb-3">الوصول السريع</h3>
      <div className="grid grid-cols-2 gap-3 mb-6 sm:grid-cols-4">
        {[
          { id: "attendance", label: "غياب المعلمين", icon: "📋" },
          { id: "students", label: "تقييم الطلاب", icon: "👨‍🎓" },
          { id: "announcements", label: "الإعلانات", icon: "📢" },
          { id: "activities", label: "الأنشطة", icon: "⚡" }
        ].map(p => (
          <button key={p.id} onClick={() => navigate(p.id)} className="bg-white rounded-2xl p-5 text-center shadow-sm hover:shadow-md transition-all border border-gray-100 hover:border-teal-200 group">
            <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">{p.icon}</div>
            <div className="font-bold text-gray-800 text-sm">{p.label}</div>
          </button>
        ))}
      </div>
      <h3 className="font-bold text-gray-700 mb-3">آخر الإعلانات</h3>
      <div className="space-y-3">
        {announcements.slice(0, 2).map(ann => (
          <div key={ann.id} className="bg-white rounded-xl p-4 shadow-sm border-r-4 border-teal-500 cursor-pointer hover:shadow-md" onClick={() => navigate("announcements")}>
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-bold text-sm text-gray-900">{ann.title}</h4>
              <Badge color={ann.priority === "عاجل" ? "red" : "teal"}>{ann.priority}</Badge>
            </div>
            <div className="text-xs text-gray-500" dangerouslySetInnerHTML={{ __html: typeof ann.content === "string" ? ann.content.substring(0,100) : "" }}></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AttendancePage({ teachers, week, attendance, setAttendance, saveAttendance }) {
  const [selectedDay, setSelectedDay] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSummary, setShowSummary] = useState(false);

  const updateField = (ti, di, field, value) => {
    setAttendance(prev => {
      const next = { ...prev, [ti]: { ...prev[ti], [di]: { ...(prev[ti]?.[di] || {}), [field]: value } } };
      if (field === "type" && value === "حاضر") next[ti][di].fares = "—";
      return next;
    });
  };

  useEffect(() => { const t = setTimeout(() => saveAttendance(attendance), 600); return () => clearTimeout(t); }, [attendance]);

  const cnt = (di, type) => teachers.filter((_, ti) => attendance[ti]?.[di]?.type === type).length;
  const totalAbs = (di) => teachers.filter((_, ti) => attendance[ti]?.[di]?.type && attendance[ti][di].type !== "حاضر").length;
  const filtered = teachers.map((t, i) => ({ name: t, idx: i })).filter(t => t.name.includes(searchQuery));

  const handlePrint = () => {
    const w = window.open("", "_blank");
    w.document.write(`<!DOCTYPE html><html dir="rtl"><head><meta charset="utf-8"><title>سجل غياب المعلمين</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Noto Sans Arabic',sans-serif;padding:20px;direction:rtl;font-size:12px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccc;padding:6px;text-align:center;font-size:11px}th{background:#0d9488;color:white}.absent{background:#fef2f2!important}</style></head><body>`);
    w.document.write(`<div style="text-align:center;margin-bottom:20px"><h1>مدرسة عبيدة بن الحارث المتوسطة</h1><p>${week.days[selectedDay].name} — ${week.days[selectedDay].dateH} هـ</p></div>`);
    w.document.write(`<table><thead><tr><th>م</th><th>اسم المعلم</th><th>نوع الغياب</th><th>فارس</th><th>ملاحظات</th></tr></thead><tbody>`);
    teachers.forEach((t, ti) => {
      const r = attendance[ti]?.[selectedDay] || {};
      const isAbs = r.type && r.type !== "حاضر";
      w.document.write(`<tr class="${isAbs?'absent':''}"><td>${ti+1}</td><td>${t}</td><td>${r.type||'حاضر'}</td><td>${isAbs?(r.fares||'—'):'—'}</td><td>${r.notes||'—'}</td></tr>`);
    });
    w.document.write(`</tbody></table></body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 300);
  };

  return (
    <div>
      <div className="text-center mb-5">
        <h2 className="text-2xl font-black text-teal-900 mb-1">سجل متابعة غياب المعلمين</h2>
        <div className="flex justify-center gap-2 mt-3">
          <button onClick={handlePrint} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl text-xs font-bold">🖨️ طباعة</button>
          <div className="bg-green-50 text-green-700 px-3 py-2 rounded-xl text-xs font-bold">💾 الحفظ تلقائي</div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-5 sm:grid-cols-4">
        <StatCard icon="👨‍🏫" label="إجمالي المعلمين" value={teachers.length} color="bg-white" />
        <StatCard icon="✅" label="حاضرون اليوم" value={teachers.length - totalAbs(selectedDay)} color="bg-emerald-50" />
        <StatCard icon="🏥" label="غياب مرضي" value={cnt(selectedDay, "مرضي")} color="bg-rose-50" />
        <StatCard icon="📋" label="غياب اضطراري" value={cnt(selectedDay, "اضطراري")} color="bg-amber-50" />
      </div>
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {week.days.map((day, i) => (
          <button key={i} onClick={() => { setSelectedDay(i); setShowSummary(false); }}
            className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${!showSummary && selectedDay === i ? "bg-teal-600 text-white" : "bg-white text-gray-600 border border-gray-200"}`}>
            <div>{day.name}</div><div className="text-xs opacity-80">{day.dateH}</div>
          </button>
        ))}
        <button onClick={() => setShowSummary(!showSummary)}
          className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-bold ${showSummary ? "bg-purple-600 text-white" : "bg-purple-50 text-purple-700 border border-purple-200"}`}>
          📊 ملخص
        </button>
      </div>
      <input type="text" placeholder="🔍 بحث عن معلم..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-teal-400 focus:outline-none text-sm bg-white mb-4" />
      {showSummary ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-purple-600 text-white px-4 py-3 font-bold text-center">ملخص غياب الأسبوع</div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-purple-50">
                <th className="p-3 text-right">م</th><th className="p-3 text-right">اسم المعلم</th>
                <th className="p-3 text-center">اضطراري</th><th className="p-3 text-center">مرضي</th>
                <th className="p-3 text-center">اعتيادي</th><th className="p-3 text-center">إجمالي</th>
              </tr></thead>
              <tbody>{teachers.map((teacher, ti) => {
                const em = week.days.filter((_,di) => attendance[ti]?.[di]?.type === "اضطراري").length;
                const sk = week.days.filter((_,di) => attendance[ti]?.[di]?.type === "مرضي").length;
                const rg = week.days.filter((_,di) => attendance[ti]?.[di]?.type === "اعتيادي").length;
                const tot = em+sk+rg;
                return (
                  <tr key={ti} className={`border-t border-gray-100 ${tot > 0 ? "bg-red-50" : ""}`}>
                    <td className="p-3 text-center text-gray-500">{ti+1}</td><td className="p-3">{teacher}</td>
                    <td className="p-3 text-center">{em||"—"}</td><td className="p-3 text-center">{sk||"—"}</td>
                    <td className="p-3 text-center">{rg||"—"}</td>
                    <td className="p-3 text-center font-bold text-red-600">{tot||"—"}</td>
                  </tr>);
              })}</tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-teal-600 text-white px-4 py-3 font-bold text-center">
            {week.days[selectedDay].name} | {week.days[selectedDay].dateH} هـ | {week.days[selectedDay].dateM} م
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-teal-50">
                <th className="p-3 text-right w-10">م</th><th className="p-3 text-right">اسم المعلم</th>
                <th className="p-3 text-center">نوع الغياب</th><th className="p-3 text-center">فارس</th>
                <th className="p-3 text-center">ملاحظات</th>
              </tr></thead>
              <tbody>{filtered.map(({ name, idx: ti }) => {
                const r = attendance[ti]?.[selectedDay] || {};
                const isAbs = r.type && r.type !== "حاضر";
                return (
                  <tr key={ti} className={`border-t border-gray-100 ${isAbs ? "bg-red-50" : "hover:bg-gray-50"}`}>
                    <td className="p-3 text-center text-gray-400">{ti+1}</td>
                    <td className="p-3 font-medium">
                      <span className={`inline-block w-2 h-2 rounded-full ml-2 ${isAbs ? "bg-red-400" : "bg-green-400"}`}></span>{name}
                    </td>
                    <td className="p-3 text-center">
                      <select value={r.type || "حاضر"} onChange={e => updateField(ti, selectedDay, "type", e.target.value)}
                        className={`px-3 py-2 rounded-lg border-2 text-sm font-bold focus:outline-none ${!r.type || r.type === "حاضر" ? "border-green-300 bg-green-50 text-green-700" : r.type === "مرضي" ? "border-red-300 bg-red-50 text-red-700" : r.type === "اضطراري" ? "border-amber-300 bg-amber-50 text-amber-700" : "border-blue-300 bg-blue-50 text-blue-700"}`}>
                        {ABSENCE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </td>
                    <td className="p-3 text-center">
                      <select value={r.fares || "—"} onChange={e => updateField(ti, selectedDay, "fares", e.target.value)}
                        disabled={!r.type || r.type === "حاضر"}
                        className={`px-3 py-2 rounded-lg border-2 text-sm font-bold focus:outline-none ${!r.type || r.type === "حاضر" ? "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed" : r.fares === "نعم ✓" ? "border-green-300 bg-green-50 text-green-700" : r.fares === "لا ✗" ? "border-red-300 bg-red-50 text-red-700" : "border-gray-300 bg-white"}`}>
                        {FARES_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </td>
                    <td className="p-3 text-center">
                      <input type="text" placeholder="—" value={r.notes || ""} onChange={e => updateField(ti, selectedDay, "notes", e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 text-sm focus:outline-none focus:border-teal-400 text-center" />
                    </td>
                  </tr>);
              })}</tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ===== صفحة تقييم الطلاب (متعددة الفصول) =====
const LEVELS = ["الصف الأول", "الصف الثاني", "الصف الثالث"];
const SECTIONS = ["أ", "ب", "ج", "د", "هـ", "و", "ز"];

function newClass(id) {
  return { id, name: "", level: "الصف الأول", section: "أ", teacher: "", semester: "الثالث", students: [] };
}
function newStudent(num) {
  return { id: Date.now() + Math.random() * 1000 | 0 + num, num, name: "", nationalId: "", grades: {} };
}

// ===== استيراد إكسل =====
function ExcelImportModal({ onImport, onClose }) {
  const [rows, setRows] = useState([]);
  const [nameCol, setNameCol] = useState("");
  const [idCol, setIdCol] = useState("");
  const [headers, setHeaders] = useState([]);
  const [fileName, setFileName] = useState("");
  const fileRef = useRef(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const XLSX = await import("https://cdn.sheetjs.com/xlsx-0.20.1/package/xlsx.mjs");
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
    if (data.length < 2) return;
    const hdrs = data[0].map(h => String(h || "").trim());
    setHeaders(hdrs);
    setRows(data.slice(1).filter(r => r.some(c => c)));
    // تخمين الأعمدة
    const nameGuess = hdrs.find(h => h.includes("اسم") || h.includes("الاسم") || h.toLowerCase().includes("name")) || hdrs[0];
    const idGuess = hdrs.find(h => h.includes("هوية") || h.includes("هويه") || h.includes("هوي") || h.includes("رقم") || h.toLowerCase().includes("id")) || "";
    setNameCol(nameGuess || "");
    setIdCol(idGuess || "");
  };

  const handleImport = () => {
    if (!nameCol) return;
    const ni = headers.indexOf(nameCol);
    const ii = idCol ? headers.indexOf(idCol) : -1;
    const students = rows.map((r, i) => ({
      ...newStudent(i + 1),
      num: i + 1,
      name: String(r[ni] || "").trim(),
      nationalId: ii >= 0 ? String(r[ii] || "").trim() : "",
    })).filter(s => s.name);
    onImport(students);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-black text-gray-800 text-lg">📊 استيراد من ملف إكسل</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>
        </div>
        <div className="p-5 space-y-4">
          {/* رفع الملف */}
          <div onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-blue-300 rounded-xl p-6 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all">
            <div className="text-4xl mb-2">📂</div>
            <div className="font-bold text-gray-700">{fileName || "اضغط لاختيار ملف إكسل"}</div>
            <div className="text-xs text-gray-400 mt-1">يدعم .xlsx و .xls</div>
            <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFile} />
          </div>

          {headers.length > 0 && (
            <>
              <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-700 font-bold">
                ✅ تم قراءة {rows.length} سطر من الملف
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-600 mb-1 block">عمود اسم الطالب *</label>
                  <select value={nameCol} onChange={e => setNameCol(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 text-sm focus:outline-none focus:border-blue-400">
                    <option value="">— اختر العمود —</option>
                    {headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 mb-1 block">عمود رقم الهوية (اختياري)</label>
                  <select value={idCol} onChange={e => setIdCol(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 text-sm focus:outline-none focus:border-blue-400">
                    <option value="">— لا يوجد —</option>
                    {headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              </div>
              {/* معاينة */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-3 py-2 text-xs font-bold text-gray-600">معاينة أول 5 طلاب:</div>
                <div className="divide-y divide-gray-100">
                  {rows.slice(0, 5).map((r, i) => {
                    const ni = headers.indexOf(nameCol);
                    const ii = idCol ? headers.indexOf(idCol) : -1;
                    return (
                      <div key={i} className="flex items-center justify-between px-3 py-2 text-xs">
                        <span className="font-medium text-gray-800">{ni >= 0 ? String(r[ni] || "—") : "—"}</span>
                        {ii >= 0 && <span className="text-gray-400">{String(r[ii] || "—")}</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
        <div className="flex gap-3 px-5 pb-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-sm font-bold hover:bg-gray-200">إلغاء</button>
          <button onClick={handleImport} disabled={!nameCol || rows.length === 0}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
            استيراد {rows.filter(r => r[headers.indexOf(nameCol)]).length} طالب
          </button>
        </div>
      </div>
    </div>
  );
}

// ===== بوابة ولي الأمر =====
function ParentPortal({ classList, siteFont, onBack }) {
  const [nationalId, setNationalId] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  const handleSearch = () => {
    if (!nationalId.trim()) { setError("أدخل رقم الهوية"); return; }
    setSearched(true);
    setError("");
    for (const cls of classList) {
      const student = cls.students?.find(s => s.nationalId && s.nationalId.trim() === nationalId.trim());
      if (student) {
        setResult({ student, cls });
        return;
      }
    }
    setResult(null);
    setError("لم يتم العثور على طالب بهذا الرقم. تأكد من صحة رقم الهوية.");
  };

  const GRADE_MAP = { weak: { label: "ضعيف", bg: "#FF6B6B", c: "#fff" }, accept: { label: "مقبول", bg: "#FFD93D", c: "#5a4200" }, good: { label: "جيد", bg: "#A8E6CF", c: "#1a4a30" }, vgood: { label: "جيد جداً", bg: "#4ECDC4", c: "#fff" }, excel: { label: "ممتاز", bg: "#2ECC71", c: "#fff" } };

  const gradeCount = result ? Object.values(result.student.grades || {}).reduce((acc, g) => { if (g) acc[g] = (acc[g] || 0) + 1; return acc; }, {}) : {};
  const totalGraded = Object.values(gradeCount).reduce((a, b) => a + b, 0);
  const excellentCount = (gradeCount.excel || 0) + (gradeCount.vgood || 0);
  const weakCount = (gradeCount.weak || 0);

  return (
    <div dir="rtl" className="min-h-screen flex flex-col" style={{ fontFamily: siteFont, background: "linear-gradient(135deg, #1B3A6B 0%, #2E6DA4 60%, #1a8fe3 100%)" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;800&display=swap');`}</style>
      {/* رأس الصفحة */}
      <div className="text-center text-white pt-10 pb-6 px-4">
        <div className="text-5xl mb-3">🏫</div>
        <h1 className="text-2xl font-black mb-1">مدرسة عبيدة بن الحارث المتوسطة</h1>
        <p className="opacity-80 text-sm">بوابة أولياء الأمور — متابعة مستوى الطالب</p>
      </div>

      <div className="max-w-lg mx-auto w-full px-4 pb-10 flex-1">
        {/* بطاقة البحث */}
        <div className="bg-white rounded-3xl shadow-2xl p-6 mb-4">
          <h2 className="font-black text-gray-800 text-center mb-4">🔍 أدخل رقم هوية الطالب</h2>
          <div className="flex gap-2">
            <input type="text" value={nationalId} onChange={e => { setNationalId(e.target.value); setError(""); setSearched(false); setResult(null); }}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              placeholder="رقم الهوية الوطنية للطالب"
              className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-400 focus:outline-none text-sm text-center tracking-widest font-bold" />
            <button onClick={handleSearch}
              className="bg-blue-600 text-white px-5 py-3 rounded-xl font-bold hover:bg-blue-700 text-sm">بحث</button>
          </div>
          {error && (
            <div className="mt-3 bg-red-50 text-red-600 text-xs font-bold p-3 rounded-xl text-center">{error}</div>
          )}
        </div>

        {/* نتيجة البحث */}
        {result && (
          <div className="space-y-4">
            {/* بيانات الطالب */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="p-5 text-white text-center" style={{ background: "linear-gradient(135deg, #1B3A6B, #2E6DA4)" }}>
                <div className="w-16 h-16 rounded-full bg-white bg-opacity-20 flex items-center justify-center text-3xl mx-auto mb-3">👨‍🎓</div>
                <h3 className="text-xl font-black">{result.student.name}</h3>
                <p className="opacity-80 text-sm mt-1">{result.cls.level} / شعبة {result.cls.section}</p>
              </div>
              <div className="grid grid-cols-2 gap-px bg-gray-100">
                <div className="bg-white p-3 text-center">
                  <div className="text-xs text-gray-400 font-bold">الفصل الدراسي</div>
                  <div className="font-black text-gray-800 text-sm mt-1">الفصل {result.cls.semester || "—"}</div>
                </div>
                <div className="bg-white p-3 text-center">
                  <div className="text-xs text-gray-400 font-bold">المعلم</div>
                  <div className="font-black text-gray-800 text-sm mt-1">{result.cls.teacher || "—"}</div>
                </div>
              </div>
            </div>

            {/* ملخص المستوى */}
            {totalGraded > 0 && (
              <div className="bg-white rounded-2xl shadow-xl p-4">
                <h4 className="font-black text-gray-800 mb-3 text-sm">📊 ملخص المستوى العام</h4>
                <div className="flex gap-2 flex-wrap">
                  {Object.entries(gradeCount).map(([g, cnt]) => {
                    const gd = GRADE_MAP[g];
                    if (!gd) return null;
                    return <span key={g} className="px-3 py-1.5 rounded-full text-xs font-bold" style={{ backgroundColor: gd.bg, color: gd.c }}>{gd.label}: {cnt} مادة</span>;
                  })}
                </div>
                {weakCount === 0 && excellentCount >= 3 && (
                  <div className="mt-3 bg-green-50 text-green-700 text-xs font-bold p-3 rounded-xl text-center">🌟 أداء ممتاز — استمر في التفوق!</div>
                )}
                {weakCount >= 2 && (
                  <div className="mt-3 bg-red-50 text-red-600 text-xs font-bold p-3 rounded-xl text-center">⚠️ يحتاج إلى اهتمام في بعض المواد</div>
                )}
              </div>
            )}

            {/* تقييم كل مادة */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="px-4 py-3 font-black text-white text-sm" style={{ background: "#1B3A6B" }}>📚 مستوى الطالب في المواد</div>
              <div className="divide-y divide-gray-100">
                {SUBJECTS.map(subj => {
                  const gradeVal = result.student.grades?.[subj.key] || "";
                  const gd = GRADE_MAP[gradeVal];
                  return (
                    <div key={subj.key} className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: subj.color }}></div>
                        <span className="font-bold text-gray-800 text-sm">{subj.label}</span>
                      </div>
                      {gd ? (
                        <span className="px-4 py-1.5 rounded-full text-xs font-black" style={{ backgroundColor: gd.bg, color: gd.c }}>{gd.label}</span>
                      ) : (
                        <span className="px-4 py-1.5 rounded-full text-xs font-bold bg-gray-100 text-gray-400">لم يُقيَّم</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* دليل التقييم */}
            <div className="bg-white rounded-2xl shadow-xl p-4">
              <div className="text-xs font-bold text-gray-600 mb-2">🎨 دليل التقييم:</div>
              <div className="flex gap-2 flex-wrap">
                {[{ bg: "#FF6B6B", c: "#fff", l: "ضعيف < 60%" }, { bg: "#FFD93D", c: "#5a4200", l: "مقبول 60-69%" }, { bg: "#A8E6CF", c: "#1a4a30", l: "جيد 70-79%" }, { bg: "#4ECDC4", c: "#fff", l: "جيد جداً 80-89%" }, { bg: "#2ECC71", c: "#fff", l: "ممتاز 90%+" }].map(x => (
                  <span key={x.l} className="px-2 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: x.bg, color: x.c }}>{x.l}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* زر العودة */}
        <div className="mt-6 text-center">
          <button onClick={onBack} className="text-white opacity-70 hover:opacity-100 text-sm font-bold underline">← العودة إلى صفحة الدخول</button>
        </div>
      </div>
    </div>
  );
}

function ClassTable({ cls, onUpdateClass, onSave }) {
  const [search, setSearch] = useState("");
  const [editInfo, setEditInfo] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [info, setInfo] = useState({ level: cls.level, section: cls.section, teacher: cls.teacher, semester: cls.semester });

  // حفظ تلقائي عند تغيير البيانات
  useEffect(() => {
    const t = setTimeout(() => onSave(cls), 800);
    return () => clearTimeout(t);
  }, [cls.students]);

  const updateGrade = (sid, subj, val) => {
    onUpdateClass({ ...cls, students: cls.students.map(s => s.id === sid ? { ...s, grades: { ...s.grades, [subj]: val } } : s) });
  };
  const updateName = (sid, name) => {
    onUpdateClass({ ...cls, students: cls.students.map(s => s.id === sid ? { ...s, name } : s) });
  };
  const updateNationalId = (sid, nationalId) => {
    onUpdateClass({ ...cls, students: cls.students.map(s => s.id === sid ? { ...s, nationalId } : s) });
  };
  const handleExcelImport = (importedStudents) => {
    const start = cls.students.length;
    const numbered = importedStudents.map((s, i) => ({ ...s, num: start + i + 1 }));
    onUpdateClass({ ...cls, students: [...cls.students, ...numbered] });
  };
  const addStudent = () => {
    const num = cls.students.length + 1;
    onUpdateClass({ ...cls, students: [...cls.students, newStudent(num)] });
  };
  const addMany = (count) => {
    const start = cls.students.length;
    const extra = Array.from({ length: count }, (_, i) => newStudent(start + i + 1));
    onUpdateClass({ ...cls, students: [...cls.students, ...extra] });
  };
  const removeStudent = (sid) => {
    const updated = cls.students.filter(s => s.id !== sid).map((s, i) => ({ ...s, num: i + 1 }));
    onUpdateClass({ ...cls, students: updated });
  };
  const saveInfo = () => {
    const updated = { ...cls, ...info, name: `${info.level} / ${info.section}` };
    onUpdateClass(updated);
    onSave(updated);
    setEditInfo(false);
  };
  const clearGrades = () => {
    if (!confirm("هل تريد مسح جميع التقييمات لهذا الفصل؟")) return;
    onUpdateClass({ ...cls, students: cls.students.map(s => ({ ...s, grades: {} })) });
  };

  const getGradeStyle = (value) => {
    const g = GRADE_OPTIONS.find(o => o.value === value) || GRADE_OPTIONS[0];
    return { backgroundColor: g.bg, color: g.color, borderColor: g.border };
  };

  const counts = { weak: 0, accept: 0, good: 0, vgood: 0, excel: 0 };
  cls.students.forEach(s => Object.values(s.grades || {}).forEach(g => { if (g && counts[g] !== undefined) counts[g]++; }));

  const filtered = search ? cls.students.filter(s => s.name.includes(search)) : cls.students;

  const handlePrint = () => {
    const w = window.open("", "_blank");
    w.document.write(`<!DOCTYPE html><html dir="rtl"><head><meta charset="utf-8">
    <title>سجل تقييم — ${cls.name}</title>
    <style>
      *{margin:0;padding:0;box-sizing:border-box}
      body{font-family:'Tajawal',Arial,sans-serif;padding:16px;direction:rtl;font-size:11px;background:#fff}
      h1{text-align:center;font-size:15px;color:#1B3A6B;margin-bottom:3px}
      .sub{text-align:center;color:#666;font-size:10px;margin-bottom:10px}
      .info-row{display:flex;gap:16px;margin-bottom:8px;font-size:10px;background:#D6E4F0;padding:6px 10px;border-radius:6px}
      table{width:100%;border-collapse:collapse}
      th,td{border:1px solid #ccc;padding:4px 5px;text-align:center;font-size:10px}
      th{color:#fff;font-weight:700}
      .h-name{background:#1B3A6B}.h-math{background:#C00000}.h-sci{background:#375623}
      .h-eng{background:#7030A0}.h-arab{background:#C55A11}.h-soc{background:#2E75B6}.h-isl{background:#833C00}
      tr:nth-child(odd) td{background:#f4f7fb} tr:nth-child(even) td{background:#fff}
      .g-weak{background:#FF6B6B;color:#fff}.g-accept{background:#FFD93D;color:#5a4200}
      .g-good{background:#A8E6CF;color:#1a4a30}.g-vgood{background:#4ECDC4;color:#fff}.g-excel{background:#2ECC71;color:#fff}
      .legend{margin-top:8px;display:flex;gap:6px;flex-wrap:wrap;font-size:9px}
      .lb{padding:2px 8px;border-radius:4px;font-weight:700}
      @page{margin:1cm;size:A3 landscape}
    </style></head><body>
    <h1>🏫 سجل تقييم الطلاب — ${cls.name || cls.level + " / " + cls.section}</h1>
    <div class="sub">مدرسة عبيدة بن الحارث المتوسطة — العام الدراسي ١٤٤٧هـ</div>
    <div class="info-row">
      <span>📅 الفصل الدراسي: <b>${cls.semester || "—"}</b></span>
      <span>🎓 المستوى: <b>${cls.level} / ${cls.section}</b></span>
      <span>👨‍🏫 المعلم: <b>${cls.teacher || "—"}</b></span>
      <span>👨‍🎓 عدد الطلاب: <b>${cls.students.filter(s=>s.name).length}</b></span>
    </div>
    <table><thead><tr>
      <th class="h-name" style="width:28px">م</th>
      <th class="h-name" style="text-align:right;padding-right:8px;min-width:140px">اسم الطالب</th>
      <th class="h-math">رياضيات</th><th class="h-sci">علوم</th><th class="h-eng">إنجليزي</th>
      <th class="h-arab">لغتي</th><th class="h-soc">اجتماعيات</th><th class="h-isl">تربية إسلامية</th>
    </tr></thead><tbody>`);
    cls.students.forEach((s, i) => {
      w.document.write(`<tr><td>${i+1}</td><td style="text-align:right;padding-right:8px">${s.name || "—"}</td>`);
      SUBJECTS.forEach(subj => {
        const g = GRADE_OPTIONS.find(o => o.value === (s.grades?.[subj.key] || "")) || GRADE_OPTIONS[0];
        w.document.write(`<td class="${g.value ? `g-${g.value}` : ''}">${g.label === "— اختر —" ? "—" : g.label}</td>`);
      });
      w.document.write("</tr>");
    });
    w.document.write(`</tbody></table>
    <div class="legend">🎨 دليل:
      <span class="lb" style="background:#FF6B6B;color:#fff">ضعيف</span>
      <span class="lb" style="background:#FFD93D;color:#5a4200">مقبول</span>
      <span class="lb" style="background:#A8E6CF;color:#1a4a30">جيد</span>
      <span class="lb" style="background:#4ECDC4;color:#fff">جيد جداً</span>
      <span class="lb" style="background:#2ECC71;color:#fff">ممتاز</span>
    </div>
    <div style="display:flex;gap:40px;margin-top:24px;font-size:10px">
      <div>توقيع المعلم: __________________</div>
      <div>توقيع مدير المدرسة: __________________</div>
      <div>التاريخ: __________________</div>
    </div></body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 300);
  };

  return (
    <div>
      {/* بيانات الفصل */}
      <div className="bg-white rounded-2xl shadow-sm border border-blue-100 mb-4 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3" style={{ background: "#1B3A6B" }}>
          <span className="font-bold text-white text-sm">📋 بيانات الفصل</span>
          <button onClick={() => setEditInfo(!editInfo)} className="text-xs bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-3 py-1 rounded-lg font-bold">
            {editInfo ? "✕ إلغاء" : "✏️ تعديل"}
          </button>
        </div>
        {editInfo ? (
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">المستوى</label>
                <select value={info.level} onChange={e => setInfo(p => ({ ...p, level: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 focus:border-blue-400 focus:outline-none text-sm">
                  {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">الشعبة</label>
                <select value={info.section} onChange={e => setInfo(p => ({ ...p, section: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 focus:border-blue-400 focus:outline-none text-sm">
                  {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">اسم المعلم</label>
                <input type="text" value={info.teacher} placeholder="اكتب الاسم"
                  onChange={e => setInfo(p => ({ ...p, teacher: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 focus:border-blue-400 focus:outline-none text-sm" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">الفصل الدراسي</label>
                <select value={info.semester} onChange={e => setInfo(p => ({ ...p, semester: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 focus:border-blue-400 focus:outline-none text-sm">
                  <option value="الأول">الأول</option><option value="الثاني">الثاني</option><option value="الثالث">الثالث</option>
                </select>
              </div>
            </div>
            <button onClick={saveInfo} className="bg-blue-600 text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-blue-700">💾 حفظ البيانات</button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-4 px-4 py-3 text-sm">
            <span className="text-gray-600">🎓 <b>{cls.level} / {cls.section}</b></span>
            <span className="text-gray-600">👨‍🏫 <b>{cls.teacher || "—"}</b></span>
            <span className="text-gray-600">📅 الفصل <b>{cls.semester || "—"}</b></span>
            <span className="text-gray-600">👨‍🎓 <b>{cls.students.filter(s => s.name).length}</b> طالب</span>
          </div>
        )}
      </div>

      {/* إحصائيات سريعة */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {[
          { key: "weak", label: "ضعيف", bg: "#FF6B6B", c: "#fff" },
          { key: "accept", label: "مقبول", bg: "#FFD93D", c: "#5a4200" },
          { key: "good", label: "جيد", bg: "#A8E6CF", c: "#1a4a30" },
          { key: "vgood", label: "جيد جداً", bg: "#4ECDC4", c: "#fff" },
          { key: "excel", label: "ممتاز", bg: "#2ECC71", c: "#fff" },
        ].map(s => (
          <span key={s.key} className="px-3 py-1.5 rounded-full text-xs font-bold"
            style={{ backgroundColor: s.bg, color: s.c }}>{s.label}: {counts[s.key]}</span>
        ))}
        <span className="bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-xs font-bold">💾 حفظ تلقائي</span>
      </div>

      {/* شريط الأدوات */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <input type="text" placeholder="🔍 بحث عن طالب..." value={search} onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-40 px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-blue-400 focus:outline-none text-sm bg-white" />
        <button onClick={addStudent} className="bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700">+ طالب</button>
        <button onClick={() => addMany(5)} className="bg-blue-100 text-blue-700 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-200">+ 5</button>
        <button onClick={() => addMany(43)} className="bg-indigo-100 text-indigo-700 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-200">+ فصل كامل</button>
        <button onClick={() => setShowImport(true)} className="bg-green-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-green-700">📊 استيراد إكسل</button>
        <button onClick={handlePrint} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-bold">🖨️ طباعة</button>
        <button onClick={clearGrades} className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2.5 rounded-xl text-sm font-bold">🗑️ مسح التقييمات</button>
      </div>
      {showImport && <ExcelImportModal onImport={handleExcelImport} onClose={() => setShowImport(false)} />}

      {/* جدول الطلاب */}
      {cls.students.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border-2 border-dashed border-blue-200">
          <div className="text-5xl mb-3">👨‍🎓</div>
          <div className="font-bold text-gray-500 mb-3">لا يوجد طلاب في هذا الفصل بعد</div>
          <div className="flex gap-2 justify-center flex-wrap">
            <button onClick={addStudent} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold">+ إضافة طالب</button>
            <button onClick={() => addMany(43)} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold">+ إضافة 43 طالباً</button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ minWidth: "800px" }}>
              <thead>
                <tr>
                  <th className="p-3 text-center text-white font-bold w-10" style={{ background: "#1B3A6B" }}>م</th>
                  <th className="p-3 text-right text-white font-bold" style={{ background: "#1B3A6B", minWidth: "160px" }}>اسم الطالب</th>
                  <th className="p-2 text-center text-white font-bold text-xs" style={{ background: "#374151", minWidth: "110px" }}>رقم الهوية</th>
                  {SUBJECTS.map(s => (
                    <th key={s.key} className="p-2 text-center text-white font-bold text-xs" style={{ background: s.color, minWidth: "95px" }}>{s.label}</th>
                  ))}
                  <th className="p-2 text-center text-white font-bold text-xs w-10" style={{ background: "#374151" }}>حذف</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((student, idx) => (
                  <tr key={student.id}
                    style={{ background: idx % 2 === 0 ? "#f4f7fb" : "#fff" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#eaf1fb"}
                    onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? "#f4f7fb" : "#fff"}>
                    <td className="p-2 text-center font-bold text-sm" style={{ color: "#1B3A6B", background: "#e8f0fb" }}>{student.num}</td>
                    <td className="p-2">
                      <input type="text" value={student.name} placeholder="اكتب اسم الطالب"
                        onChange={e => updateName(student.id, e.target.value)}
                        className="w-full border-none bg-transparent text-sm font-medium focus:outline-none"
                        style={{ color: "#1B3A6B", fontFamily: "inherit" }} />
                    </td>
                    <td className="p-1.5">
                      <input type="text" value={student.nationalId || ""} placeholder="رقم الهوية"
                        onChange={e => updateNationalId(student.id, e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-center focus:outline-none focus:border-blue-400"
                        style={{ fontFamily: "inherit" }} />
                    </td>
                    {SUBJECTS.map(subj => {
                      const val = student.grades?.[subj.key] || "";
                      const st = getGradeStyle(val);
                      return (
                        <td key={subj.key} className="p-1 text-center">
                          <select value={val} onChange={e => updateGrade(student.id, subj.key, e.target.value)}
                            className="w-full rounded-lg border-2 px-1 py-1.5 text-xs font-bold focus:outline-none cursor-pointer"
                            style={{ ...st, appearance: "none", textAlign: "center" }}>
                            {GRADE_OPTIONS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                          </select>
                        </td>
                      );
                    })}
                    <td className="p-1 text-center">
                      <button onClick={() => removeStudent(student.id)}
                        className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 text-xs font-bold flex items-center justify-center mx-auto">✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-3 border-t border-gray-100 bg-gray-50 flex gap-2">
            <button onClick={addStudent} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-700">+ إضافة طالب</button>
            <button onClick={() => addMany(5)} className="bg-blue-100 text-blue-700 px-4 py-2 rounded-xl text-xs font-bold">+ 5 طلاب</button>
          </div>
        </div>
      )}

      {/* دليل التقييم */}
      <div className="mt-4 bg-white rounded-xl p-3 shadow-sm border border-gray-100 flex gap-2 flex-wrap items-center">
        <span className="text-xs font-bold text-gray-600">🎨 دليل:</span>
        {[
          { bg: "#FF6B6B", c: "#fff", label: "ضعيف < 60%" },
          { bg: "#FFD93D", c: "#5a4200", label: "مقبول 60-69%" },
          { bg: "#A8E6CF", c: "#1a4a30", label: "جيد 70-79%" },
          { bg: "#4ECDC4", c: "#fff", label: "جيد جداً 80-89%" },
          { bg: "#2ECC71", c: "#fff", label: "ممتاز 90%+" },
        ].map(l => <span key={l.label} className="px-2 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: l.bg, color: l.c }}>{l.label}</span>)}
      </div>
    </div>
  );
}

function StudentsPage({ classList, setClassList, saveClass, deleteClass }) {
  const [activeId, setActiveId] = useState(null);
  const [showAddClass, setShowAddClass] = useState(false);
  const [newLevel, setNewLevel] = useState("الصف الأول");
  const [newSection, setNewSection] = useState("أ");
  const [searchQuery, setSearchQuery] = useState("");

  const activeClass = classList.find(c => c.id === activeId) || null;

  // تحميل الفصل الجاهز من ملف الإكسل
  const loadPreloadedClass = async () => {
    const already = classList.find(c => c.id === PRELOADED_CLASS.id);
    if (already) { setActiveId(PRELOADED_CLASS.id); return; }
    const updated = [...classList, PRELOADED_CLASS];
    setClassList(updated);
    await saveClass(PRELOADED_CLASS);
    await DB.set("school-class-list", updated.map(c => ({ id: c.id, name: c.name, level: c.level, section: c.section, teacher: c.teacher, semester: c.semester })));
    setActiveId(PRELOADED_CLASS.id);
  };

  const activeClass = classList.find(c => c.id === activeId) || null;

  const addNewClass = () => {
    const exists = classList.find(c => c.level === newLevel && c.section === newSection);
    if (exists) { alert("هذا الفصل موجود بالفعل!"); return; }
    const id = `cls-${Date.now()}`;
    const cls = { ...newClass(id), level: newLevel, section: newSection, name: `${newLevel} / ${newSection}` };
    const updated = [...classList, cls];
    setClassList(updated);
    saveClass(cls);
    DB.set("school-class-list", updated.map(c => ({ id: c.id, name: c.name, level: c.level, section: c.section, teacher: c.teacher, semester: c.semester })));
    setActiveId(id);
    setShowAddClass(false);
  };

  const handleUpdateClass = (updated) => {
    setClassList(prev => prev.map(c => c.id === updated.id ? updated : c));
  };

  const handleSaveClass = (cls) => {
    saveClass(cls);
    DB.set("school-class-list", classList.map(c =>
      c.id === cls.id
        ? { id: cls.id, name: cls.name, level: cls.level, section: cls.section, teacher: cls.teacher, semester: cls.semester }
        : { id: c.id, name: c.name, level: c.level, section: c.section, teacher: c.teacher, semester: c.semester }
    ));
  };

  const handleDeleteClass = (id) => {
    if (!confirm("هل تريد حذف هذا الفصل وجميع بياناته؟")) return;
    const updated = classList.filter(c => c.id !== id);
    setClassList(updated);
    deleteClass(id);
    DB.set("school-class-list", updated.map(c => ({ id: c.id, name: c.name, level: c.level, section: c.section, teacher: c.teacher, semester: c.semester })));
    if (activeId === id) setActiveId(updated[0]?.id || null);
  };

  // إحصائيات إجمالية
  const totalStudents = classList.reduce((acc, c) => acc + c.students.filter(s => s.name).length, 0);
  const levelGroups = LEVELS.map(l => ({
    label: l, count: classList.filter(c => c.level === l).reduce((a, c) => a + c.students.filter(s => s.name).length, 0)
  }));

  const filteredClasses = searchQuery ? classList.filter(c =>
    c.level.includes(searchQuery) || c.section.includes(searchQuery) || c.teacher?.includes(searchQuery)
  ) : classList;

  return (
    <div>
      {/* العنوان */}
      <div className="rounded-3xl p-6 mb-5 text-white text-center shadow-xl"
        style={{ background: "linear-gradient(135deg, #1B3A6B 0%, #2E6DA4 60%, #1a8fe3 100%)" }}>
        <div className="text-4xl mb-2">👨‍🎓</div>
        <h2 className="text-2xl font-black mb-1">سجل تقييم الطلاب</h2>
        <p className="opacity-80 text-sm">للعام الدراسي ١٤٤٧هـ — مدرسة عبيدة بن الحارث المتوسطة</p>
        <div className="flex justify-center gap-4 mt-3 text-sm opacity-90">
          <span>📚 {classList.length} فصل</span>
          <span>👨‍🎓 {totalStudents} طالب</span>
        </div>
      </div>

      {/* زر تحميل الفصل الجاهز */}
      {!classList.find(c => c.id === PRELOADED_CLASS.id) && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 mb-5 text-center">
          <div className="text-3xl mb-2">📥</div>
          <div className="font-black text-amber-800 text-lg mb-1">لديك فصل جاهز من ملف الإكسل!</div>
          <div className="text-amber-700 text-sm mb-4">الصف الأول / أ — 25 طالباً بأسمائهم وأرقام هوياتهم</div>
          <button onClick={loadPreloadedClass}
            className="bg-amber-500 hover:bg-amber-600 text-white px-8 py-3 rounded-xl font-black text-base shadow-md hover:shadow-lg transition-all">
            📥 تحميل الفصل الأول / أ (25 طالب)
          </button>
        </div>
      )}

      {/* إحصائيات المستويات */}
      {classList.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          {levelGroups.map((l, i) => (
            <div key={i} className="bg-white rounded-2xl p-3 text-center shadow-sm border border-blue-100">
              <div className="text-lg font-black text-blue-800">{l.count}</div>
              <div className="text-xs text-gray-500 font-bold">{l.label}</div>
              <div className="text-xs text-gray-400">{classList.filter(c => c.level === l.label).length} فصول</div>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-4">
        {/* القائمة الجانبية للفصول */}
        <div className="w-56 flex-shrink-0">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-20">
            <div className="px-3 py-3 font-bold text-white text-sm flex items-center justify-between" style={{ background: "#1B3A6B" }}>
              <span>📚 الفصول ({classList.length})</span>
            </div>
            {/* بحث */}
            <div className="p-2 border-b border-gray-100">
              <input type="text" placeholder="بحث..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:border-blue-400" />
            </div>
            <div className="max-h-96 overflow-y-auto">
              {filteredClasses.length === 0 && (
                <div className="text-center text-xs text-gray-400 py-6">لا توجد فصول</div>
              )}
              {LEVELS.map(level => {
                const levelCls = filteredClasses.filter(c => c.level === level);
                if (levelCls.length === 0) return null;
                return (
                  <div key={level}>
                    <div className="px-3 py-1.5 text-xs font-black text-blue-700 bg-blue-50 border-b border-blue-100">{level}</div>
                    {levelCls.map(cls => (
                      <div key={cls.id}
                        className={`flex items-center justify-between px-3 py-2.5 cursor-pointer border-b border-gray-50 group transition-colors ${activeId === cls.id ? "bg-blue-600 text-white" : "hover:bg-blue-50"}`}
                        onClick={() => setActiveId(cls.id)}>
                        <div>
                          <div className={`text-xs font-bold ${activeId === cls.id ? "text-white" : "text-gray-800"}`}>
                            شعبة {cls.section}
                          </div>
                          <div className={`text-xs ${activeId === cls.id ? "text-blue-200" : "text-gray-400"}`}>
                            {cls.students.filter(s => s.name).length} طالب
                          </div>
                        </div>
                        <button onClick={e => { e.stopPropagation(); handleDeleteClass(cls.id); }}
                          className={`text-xs w-6 h-6 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ${activeId === cls.id ? "bg-blue-500 text-white hover:bg-red-400" : "bg-red-50 text-red-400 hover:bg-red-100"}`}>
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
            {/* إضافة فصل */}
            <div className="p-2 border-t border-gray-100">
              {!showAddClass ? (
                <button onClick={() => setShowAddClass(true)}
                  className="w-full bg-blue-600 text-white py-2 rounded-xl text-xs font-bold hover:bg-blue-700">
                  + إضافة فصل
                </button>
              ) : (
                <div className="space-y-2">
                  <select value={newLevel} onChange={e => setNewLevel(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none">
                    {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                  <select value={newSection} onChange={e => setNewSection(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none">
                    {SECTIONS.map(s => <option key={s} value={s}>شعبة {s}</option>)}
                  </select>
                  <div className="flex gap-1">
                    <button onClick={addNewClass} className="flex-1 bg-blue-600 text-white py-1.5 rounded-lg text-xs font-bold">إضافة</button>
                    <button onClick={() => setShowAddClass(false)} className="flex-1 bg-gray-100 text-gray-600 py-1.5 rounded-lg text-xs font-bold">إلغاء</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* محتوى الفصل المختار */}
        <div className="flex-1 min-w-0">
          {!activeClass ? (
            <div className="bg-white rounded-2xl p-16 text-center border-2 border-dashed border-blue-200">
              <div className="text-6xl mb-4">📚</div>
              <div className="font-black text-gray-500 text-lg mb-2">اختر فصلاً أو أضف فصلاً جديداً</div>
              <p className="text-gray-400 text-sm mb-5">يمكنك إضافة فصول لكل مستوى بشكل منفصل وحفظ بيانات كل فصل مستقلاً</p>
              <button onClick={() => setShowAddClass(true)}
                className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700">
                + إضافة أول فصل
              </button>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="text-2xl font-black text-blue-900">{activeClass.level} / {activeClass.section}</div>
                {activeClass.teacher && <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">👨‍🏫 {activeClass.teacher}</span>}
                {activeClass.semester && <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold">📅 الفصل {activeClass.semester}</span>}
              </div>
              <ClassTable
                cls={activeClass}
                onUpdateClass={handleUpdateClass}
                onSave={handleSaveClass}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AnnouncementsPage({ announcements, setAnnouncements, saveAnnouncements }) {
  const [showForm, setShowForm] = useState(false);
  const [newAnn, setNewAnn] = useState({ title: "", content: "", category: "إعلانات", priority: "عادي", bgColor: "" });
  const [filter, setFilter] = useState("الكل");
  const categories = ["الكل", "تعاميم", "إعلانات", "تدريب", "اجتماعات"];
  const pColors = { "عاجل": "red", "مهم": "amber", "عادي": "teal" };
  const cIcons = { "تعاميم": "📜", "إعلانات": "📢", "تدريب": "🎓", "اجتماعات": "🤝" };
  const annBgColors = [
    { label: "بدون", value: "" }, { label: "أخضر", value: "#DCFCE7" },
    { label: "أزرق", value: "#DBEAFE" }, { label: "بنفسجي", value: "#F3E8FF" },
    { label: "وردي", value: "#FFE4E6" }, { label: "أصفر", value: "#FEF3C7" },
    { label: "تركوازي", value: "#CCFBF1" },
  ];
  const filtered = filter === "الكل" ? announcements : announcements.filter(a => a.category === filter);

  const add = () => {
    if (!newAnn.title || !newAnn.content) return;
    const u = [{ ...newAnn, id: Date.now(), date: new Date().toLocaleDateString("ar-SA-u-nu-arab", { year: "numeric", month: "2-digit", day: "2-digit" }), pinned: false }, ...announcements];
    setAnnouncements(u); saveAnnouncements(u);
    setNewAnn({ title: "", content: "", category: "إعلانات", priority: "عادي", bgColor: "" }); setShowForm(false);
  };
  const del = (id) => { const u = announcements.filter(a => a.id !== id); setAnnouncements(u); saveAnnouncements(u); };
  const pin = (id) => { const u = announcements.map(a => a.id === id ? { ...a, pinned: !a.pinned } : a); setAnnouncements(u); saveAnnouncements(u); };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h2 className="text-2xl font-black text-teal-900">الإعلانات والتعاميم</h2>
        <button onClick={() => setShowForm(!showForm)} className="bg-teal-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-teal-700">
          {showForm ? "✕ إلغاء" : "+ إعلان جديد"}
        </button>
      </div>
      {showForm && (
        <div className="bg-white rounded-2xl p-5 shadow-md border border-teal-200 mb-6">
          <h3 className="font-bold text-teal-800 mb-4">إضافة إعلان جديد</h3>
          <div className="space-y-3">
            <input type="text" placeholder="عنوان الإعلان" value={newAnn.title} onChange={e => setNewAnn(p => ({...p, title: e.target.value}))}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-teal-400 focus:outline-none text-sm" />
            <RichEditor value={newAnn.content} onChange={v => setNewAnn(p => ({...p, content: v}))} />
            <div className="flex gap-3 flex-wrap items-center">
              <select value={newAnn.category} onChange={e => setNewAnn(p => ({...p, category: e.target.value}))}
                className="px-4 py-2.5 rounded-xl border-2 border-gray-200 text-sm focus:outline-none">
                {categories.filter(c => c !== "الكل").map(c => <option key={c} value={c}>{c}</option>)}</select>
              <select value={newAnn.priority} onChange={e => setNewAnn(p => ({...p, priority: e.target.value}))}
                className="px-4 py-2.5 rounded-xl border-2 border-gray-200 text-sm focus:outline-none">
                <option value="عادي">عادي</option><option value="مهم">مهم</option><option value="عاجل">عاجل</option></select>
              <select value={newAnn.bgColor || ""} onChange={e => setNewAnn(p => ({...p, bgColor: e.target.value}))}
                className="px-4 py-2.5 rounded-xl border-2 border-gray-200 text-sm focus:outline-none">
                {annBgColors.map(c => <option key={c.value} value={c.value}>🎨 {c.label}</option>)}</select>
              <button onClick={add} className="bg-teal-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-teal-700">نشر الإعلان</button>
            </div>
          </div>
        </div>
      )}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-2">
        {categories.map(cat => (
          <button key={cat} onClick={() => setFilter(cat)}
            className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap ${filter === cat ? "bg-teal-600 text-white" : "bg-white text-gray-600 border border-gray-200"}`}>
            {cat === "الكل" ? "📋 الكل" : `${cIcons[cat]} ${cat}`}
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {filtered.sort((a,b) => (b.pinned?1:0)-(a.pinned?1:0)).map(ann => (
          <div key={ann.id} className={`rounded-2xl p-5 shadow-sm border-r-4 hover:shadow-md ${ann.priority === "عاجل" ? "border-red-500" : ann.priority === "مهم" ? "border-amber-500" : "border-teal-500"}`}
            style={{ backgroundColor: ann.bgColor || "#ffffff" }}>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xl">{cIcons[ann.category] || "📌"}</span>
                <h3 className="font-bold text-gray-900 text-lg">{ann.title}</h3>
                {ann.pinned && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-bold">📌 مثبّت</span>}
              </div>
              <div className="flex gap-1">
                <button onClick={() => pin(ann.id)} className="text-xs px-2 py-1 rounded-lg hover:bg-gray-100">{ann.pinned ? "إلغاء" : "📌"}</button>
                <button onClick={() => del(ann.id)} className="text-xs px-2 py-1 rounded-lg hover:bg-red-50 text-red-500">حذف</button>
              </div>
            </div>
            <div className="text-gray-700 text-sm leading-relaxed mb-3" dangerouslySetInnerHTML={{ __html: ann.content }}></div>
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>{ann.date}</span>
              <div className="flex gap-2"><Badge color="gray">{ann.category}</Badge><Badge color={pColors[ann.priority]}>{ann.priority}</Badge></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActivitiesPage({ activities }) {
  const [f, setF] = useState("الكل");
  const types = ["الكل", "ديني", "رياضي", "علمي", "ثقافي", "ترفيهي"];
  const tc = { "ديني": "green", "رياضي": "blue", "علمي": "purple", "ثقافي": "amber", "ترفيهي": "teal" };
  const sc = { "قادم": "bg-blue-100 text-blue-700", "جاري": "bg-green-100 text-green-700", "مكتمل": "bg-gray-100 text-gray-600" };
  const filtered = f === "الكل" ? activities : activities.filter(a => a.type === f);
  return (
    <div>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-black text-teal-900 mb-1">الأنشطة المدرسية</h2>
      </div>
      <div className="grid grid-cols-3 gap-3 mb-5">
        <StatCard icon="📅" label="قادمة" value={activities.filter(a => a.status === "قادم").length} color="bg-blue-50" />
        <StatCard icon="🔄" label="جارية" value={activities.filter(a => a.status === "جاري").length} color="bg-green-50" />
        <StatCard icon="✅" label="مكتملة" value={activities.filter(a => a.status === "مكتمل").length} color="bg-gray-50" />
      </div>
      <div className="flex gap-2 mb-5 overflow-x-auto pb-2">
        {types.map(type => (
          <button key={type} onClick={() => setF(type)}
            className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap ${f === type ? "bg-teal-600 text-white" : "bg-white text-gray-600 border border-gray-200"}`}>{type}</button>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {filtered.map(act => (
          <div key={act.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-all">
            <div className="bg-gradient-to-l from-teal-500 to-emerald-600 p-6 text-center"><span className="text-5xl">{act.image}</span></div>
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-gray-900">{act.title}</h3>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${sc[act.status]}`}>{act.status}</span>
              </div>
              <p className="text-gray-500 text-sm mb-3">{act.description}</p>
              <div className="flex items-center justify-between text-xs text-gray-400"><span>📅 {act.date}</span><span>👤 {act.responsible}</span></div>
              <div className="mt-2"><Badge color={tc[act.type]}>{act.type}</Badge></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SettingsPage({ teachers, setTeachers, saveTeachers, week, setWeek, saveWeek, users, siteFont, setSiteFont, saveSiteFont }) {
  const [newT, setNewT] = useState("");
  const [editWeek, setEditWeek] = useState(false);
  const [tmpWeek, setTmpWeek] = useState(week);
  const [editIdx, setEditIdx] = useState(-1);
  const [editName, setEditName] = useState("");

  const addT = () => { if (!newT.trim()) return; const u = [...teachers, newT.trim()]; setTeachers(u); saveTeachers(u); setNewT(""); };
  const rmT = (i) => { const u = teachers.filter((_,j) => j !== i); setTeachers(u); saveTeachers(u); };
  const saveE = () => { if (!editName.trim()) return; const u = [...teachers]; u[editIdx] = editName.trim(); setTeachers(u); saveTeachers(u); setEditIdx(-1); };
  const saveW = () => { setWeek(tmpWeek); saveWeek(tmpWeek); setEditWeek(false); };
  const updDay = (i, f, v) => setTmpWeek(p => ({...p, days: p.days.map((d,j) => j === i ? {...d, [f]: v} : d)}));

  return (
    <div>
      <h2 className="text-2xl font-black text-teal-900 mb-6">إعدادات النظام</h2>
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6">
        <h3 className="font-bold text-gray-800 mb-4">🔤 خط الموقع</h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {FONTS.map(f => (
            <button key={f.value} onClick={() => { setSiteFont(f.value); saveSiteFont(f.value); }}
              className={`p-3 rounded-xl border-2 text-sm transition-all text-right ${siteFont === f.value ? "border-teal-500 bg-teal-50 text-teal-800" : "border-gray-200 hover:border-teal-300"}`}
              style={{ fontFamily: f.value }}>
              <div className="font-bold">{f.label}</div>
              <div className="text-xs mt-1 opacity-60">مدرسة عبيدة بن الحارث</div>
            </button>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-800">📅 إعدادات الأسبوع</h3>
          {!editWeek ? (
            <button onClick={() => { setEditWeek(true); setTmpWeek(week); }} className="bg-teal-100 text-teal-700 px-4 py-2 rounded-xl text-xs font-bold">تعديل</button>
          ) : (
            <div className="flex gap-2">
              <button onClick={saveW} className="bg-teal-600 text-white px-4 py-2 rounded-xl text-xs font-bold">حفظ</button>
              <button onClick={() => setEditWeek(false)} className="bg-gray-100 text-gray-600 px-4 py-2 rounded-xl text-xs font-bold">إلغاء</button>
            </div>
          )}
        </div>
        {editWeek ? (
          <div className="space-y-3">{tmpWeek.days.map((day, i) => (
            <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
              <span className="font-bold text-gray-700 w-16 text-sm">{day.name}</span>
              <div className="flex-1"><label className="text-xs text-gray-400">هجري</label>
                <input type="text" value={day.dateH} onChange={e => updDay(i, "dateH", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none" /></div>
              <div className="flex-1"><label className="text-xs text-gray-400">ميلادي</label>
                <input type="text" value={day.dateM} onChange={e => updDay(i, "dateM", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none" /></div>
            </div>
          ))}</div>
        ) : (
          <table className="w-full text-sm"><thead><tr className="bg-gray-50"><th className="p-2 text-right">اليوم</th><th className="p-2 text-center">هجري</th><th className="p-2 text-center">ميلادي</th></tr></thead>
            <tbody>{week.days.map((d,i) => <tr key={i} className="border-t border-gray-100"><td className="p-2 font-bold">{d.name}</td><td className="p-2 text-center">{d.dateH} هـ</td><td className="p-2 text-center">{d.dateM} م</td></tr>)}</tbody></table>
        )}
      </div>
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6">
        <h3 className="font-bold text-gray-800 mb-4">👨‍🏫 إدارة أسماء المعلمين ({teachers.length})</h3>
        <div className="flex gap-2 mb-4">
          <input type="text" placeholder="أدخل اسم المعلم الجديد..." value={newT} onChange={e => setNewT(e.target.value)} onKeyDown={e => e.key === "Enter" && addT()}
            className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-teal-400 focus:outline-none text-sm" />
          <button onClick={addT} className="bg-teal-600 text-white px-5 py-3 rounded-xl text-sm font-bold hover:bg-teal-700">+ إضافة</button>
        </div>
        <div className="space-y-2 max-h-96 overflow-y-auto">{teachers.map((t, i) => (
          <div key={i} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 group">
            {editIdx === i ? (
              <div className="flex items-center gap-2 flex-1">
                <input type="text" value={editName} onChange={e => setEditName(e.target.value)} onKeyDown={e => e.key === "Enter" && saveE()}
                  className="flex-1 px-3 py-1.5 rounded-lg border border-teal-300 text-sm focus:outline-none" autoFocus />
                <button onClick={saveE} className="text-teal-600 text-xs font-bold px-2 py-1">حفظ</button>
                <button onClick={() => setEditIdx(-1)} className="text-gray-400 text-xs px-2 py-1">إلغاء</button>
              </div>
            ) : (
              <>
                <span className="text-sm font-medium"><span className="text-gray-400 ml-2">{i+1}.</span>{t}</span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setEditIdx(i); setEditName(t); }} className="text-xs px-2 py-1 rounded-lg hover:bg-teal-100 text-teal-600">✏️</button>
                  <button onClick={() => rmT(i)} className="text-xs px-2 py-1 rounded-lg hover:bg-red-100 text-red-500">🗑️</button>
                </div>
              </>
            )}
          </div>
        ))}</div>
      </div>
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-800 mb-4">🔐 حسابات المستخدمين</h3>
        <div className="space-y-2">{users.map((u, i) => (
          <div key={i} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
            <div><span className="font-bold text-sm">{u.name}</span><span className="text-xs text-gray-400 mr-2">({u.role})</span></div>
            <span className="text-xs text-gray-400">{u.username}</span>
          </div>
        ))}</div>
      </div>
    </div>
  );
}

export default function SchoolWebsite() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [parentPortal, setParentPortal] = useState(false);
  const [page, setPage] = useState("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [teachers, setTeachers] = useState(DEFAULT_TEACHERS);
  const [week, setWeek] = useState(DEFAULT_WEEK);
  const [attendance, setAttendance] = useState({});
  const [announcements, setAnnouncements] = useState(DEFAULT_ANNOUNCEMENTS);
  const [activities, setActivities] = useState(DEFAULT_ACTIVITIES);
  const [classList, setClassList] = useState([]);
  const [users] = useState(DEFAULT_USERS);
  const [siteFont, setSiteFont] = useState("'Noto Naskh Arabic', serif");

  useEffect(() => {
    const h = () => {
      const hash = window.location.hash.replace("#","") || "home";
      if (["home","attendance","announcements","activities","settings","students"].includes(hash)) setPage(hash);
    };
    window.addEventListener("hashchange", h); h();
    return () => window.removeEventListener("hashchange", h);
  }, []);

  const navigate = (p) => { setPage(p); window.location.hash = p; setMenuOpen(false); };

  useEffect(() => {
    (async () => {
      try {
        const [t, w, att, ann, act, font, clsListMeta] = await Promise.all([
          DB.get("school-teachers", DEFAULT_TEACHERS),
          DB.get("school-week", DEFAULT_WEEK),
          DB.get("school-attendance", {}),
          DB.get("school-announcements", DEFAULT_ANNOUNCEMENTS),
          DB.get("school-activities", DEFAULT_ACTIVITIES),
          DB.get("school-font", "'Noto Naskh Arabic', serif"),
          DB.get("school-class-list", []),
        ]);
        setTeachers(t); setWeek(w); setAttendance(att); setAnnouncements(ann);
        setActivities(act); setSiteFont(font);
        // تحميل بيانات كل فصل
        if (clsListMeta && clsListMeta.length > 0) {
          const classDataArr = await Promise.all(clsListMeta.map(m => DB.get(`school-cls-${m.id}`, { ...m, students: [] })));
          setClassList(classDataArr);
        } else {
          // أول تشغيل — حمّل الفصل المُدرج من ملف الإكسل تلقائياً
          const meta = [{ id: PRELOADED_CLASS.id, name: PRELOADED_CLASS.name, level: PRELOADED_CLASS.level, section: PRELOADED_CLASS.section, teacher: PRELOADED_CLASS.teacher, semester: PRELOADED_CLASS.semester }];
          await DB.set("school-class-list", meta);
          await DB.set(`school-cls-${PRELOADED_CLASS.id}`, PRELOADED_CLASS);
          setClassList([PRELOADED_CLASS]);
        }
      } catch (e) { console.error(e); }
      setLoading(false);
    })();
  }, []);

  const saveTeachers = (v) => DB.set("school-teachers", v);
  const saveWeek = (v) => DB.set("school-week", v);
  const saveAttendance = (v) => DB.set("school-attendance", v);
  const saveAnnouncements = (v) => DB.set("school-announcements", v);
  const saveActivities = (v) => DB.set("school-activities", v);
  const saveSiteFont = (v) => DB.set("school-font", v);
  const saveClass = (cls) => DB.set(`school-cls-${cls.id}`, cls);
  const deleteClass = (id) => DB.set(`school-cls-${id}`, null);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #f0fdfa 0%, #ecfdf5 50%, #f5f5f4 100%)" }}>
      <div className="text-center">
        <div className="text-6xl mb-4 animate-bounce">🏫</div>
        <h2 className="text-xl font-black text-teal-800 mb-2">مدرسة عبيدة بن الحارث المتوسطة</h2>
        <p className="text-gray-400 text-sm">جاري تحميل البيانات…</p>
      </div>
    </div>
  );

  if (!user && parentPortal) return <ParentPortal classList={classList} siteFont={siteFont} onBack={() => setParentPortal(false)} />;
  if (!user) return <LoginPage users={users} onLogin={setUser} siteFont={siteFont} onParentPortal={() => setParentPortal(true)} />;

  const pages = [
    { id: "home",          label: "الرئيسية",       icon: "🏠" },
    { id: "attendance",    label: "غياب المعلمين",  icon: "📋" },
    { id: "students",      label: "تقييم الطلاب",  icon: "👨‍🎓" },
    { id: "announcements", label: "الإعلانات",      icon: "📢" },
    { id: "activities",    label: "الأنشطة",        icon: "⚡" },
    { id: "settings",      label: "الإعدادات",      icon: "⚙️" },
  ];

  return (
    <div dir="rtl" className="min-h-screen" style={{ fontFamily: siteFont, background: "linear-gradient(135deg, #f0fdfa 0%, #ecfdf5 30%, #f5f5f4 100%)" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;600;700&family=Noto+Kufi+Arabic:wght@400;700&family=Cairo:wght@400;700;900&family=Tajawal:wght@400;700&family=Reem+Kufi:wght@400;700&family=Lateef&family=Amiri:wght@400;700&display=swap');`}</style>
      <nav className="bg-white shadow-md sticky top-0 z-50 border-b border-teal-100">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("home")}>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-bl from-teal-500 to-emerald-600 flex items-center justify-center text-white text-lg">🏫</div>
              <div className="hidden sm:block"><h1 className="font-black text-teal-900 text-sm">مدرسة عبيدة بن الحارث</h1><p className="text-xs text-gray-400">المتوسطة — ١٤٤٧ هـ</p></div>
            </div>
            <div className="hidden lg:flex items-center gap-1">
              {pages.map(p => (
                <button key={p.id} onClick={() => navigate(p.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${page === p.id ? "bg-teal-600 text-white" : "text-gray-600 hover:bg-teal-50"}`}>
                  <span className="ml-1">{p.icon}</span>{p.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                <div className="w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 text-xs font-bold">{user.name.charAt(0)}</div>
                <div className="text-xs"><div className="font-bold text-gray-700">{user.name}</div><div className="text-gray-400">{user.role}</div></div>
              </div>
              <button onClick={() => setUser(null)} className="text-xs text-red-500 font-bold px-2 py-1 rounded-lg hover:bg-red-50 hidden sm:block">خروج</button>
              <button onClick={() => setMenuOpen(!menuOpen)} className="lg:hidden p-2 rounded-xl hover:bg-gray-100 text-2xl">{menuOpen ? "✕" : "☰"}</button>
            </div>
          </div>
          {menuOpen && (
            <div className="lg:hidden pb-4 space-y-1">
              {pages.map(p => (
                <button key={p.id} onClick={() => navigate(p.id)}
                  className={`w-full text-right px-4 py-3 rounded-xl text-sm font-bold ${page === p.id ? "bg-teal-600 text-white" : "text-gray-600 hover:bg-teal-50"}`}>
                  <span className="ml-2">{p.icon}</span>{p.label}
                </button>
              ))}
              <div className="border-t border-gray-100 pt-2 flex items-center justify-between px-4">
                <span className="text-sm font-bold">{user.name} ({user.role})</span>
                <button onClick={() => setUser(null)} className="text-xs text-red-500 font-bold px-3 py-1.5 rounded-lg bg-red-50">خروج</button>
              </div>
            </div>
          )}
        </div>
      </nav>
      <main className="max-w-6xl mx-auto px-4 py-6">
        {page === "home"          && <HomePage teachers={teachers} announcements={announcements} activities={activities} navigate={navigate} />}
        {page === "attendance"    && <AttendancePage teachers={teachers} week={week} attendance={attendance} setAttendance={setAttendance} saveAttendance={saveAttendance} />}
        {page === "students"      && <StudentsPage classList={classList} setClassList={setClassList} saveClass={saveClass} deleteClass={deleteClass} />}
        {page === "announcements" && <AnnouncementsPage announcements={announcements} setAnnouncements={setAnnouncements} saveAnnouncements={saveAnnouncements} />}
        {page === "activities"    && <ActivitiesPage activities={activities} />}
        {page === "settings"      && <SettingsPage teachers={teachers} setTeachers={setTeachers} saveTeachers={saveTeachers} week={week} setWeek={setWeek} saveWeek={saveWeek} users={users} siteFont={siteFont} setSiteFont={setSiteFont} saveSiteFont={saveSiteFont} />}
      </main>
      <footer className="text-center py-6 text-xs text-gray-400 border-t border-gray-200 bg-white mt-8">
        <p>مدرسة عبيدة بن الحارث المتوسطة — بوابة الإدارة المدرسية الإلكترونية © ١٤٤٧ هـ</p>
      </footer>
    </div>
  );
}
