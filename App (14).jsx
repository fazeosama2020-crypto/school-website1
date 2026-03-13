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

const ATTENDANCE_STATUS = ["حاضر", "متأخر", "غائب"];
const PERIODS = ["الأولى","الثانية","الثالثة","الرابعة","الخامسة","السادسة","السابعة"];
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

function Badge({ children, color = "teal" }) {
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

function LoginPage({ users, onLogin, siteFont, onParentPortal, onTeacherPortal }) {
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
            <button onClick={onTeacherPortal}
              className="w-full py-3 rounded-xl font-bold hover:shadow-lg transition-all text-sm text-white mb-2"
              style={{ background: "linear-gradient(135deg, #1e3a5f, #2563eb)" }}>
              👨‍🏫 بوابة المعلم — إدخال مستويات الطلاب
            </button>
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

function AttendancePage({ teachers, setTeachers, saveTeachers, week, attendance, setAttendance, saveAttendance }) {
  const [selectedDay, setSelectedDay] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSummary, setShowSummary] = useState(false);
  const [showExcelImport, setShowExcelImport] = useState(false);

  // تحديث حقل في سجل الحضور
  const updateField = (ti, di, field, value) => {
    setAttendance(prev => {
      const next = { ...prev, [ti]: { ...prev[ti], [di]: { ...(prev[ti]?.[di] || {}), [field]: value } } };
      // إذا تغير الحالة لـ"حاضر" امسح البيانات الأخرى
      if (field === "status" && value === "حاضر") {
        next[ti][di] = { status: "حاضر" };
      }
      // إذا تغير لـ"غائب" امسح بيانات التأخر
      if (field === "status" && value === "غائب") {
        next[ti][di] = { status: "غائب", absType: next[ti][di]?.absType || "اضطراري", notes: next[ti][di]?.notes || "" };
      }
      return next;
    });
  };

  useEffect(() => { const t = setTimeout(() => saveAttendance(attendance), 700); return () => clearTimeout(t); }, [attendance]);

  // إحصائيات
  const countStatus = (di, st) => teachers.filter((_, ti) => (attendance[ti]?.[di]?.status || "حاضر") === st).length;
  const countLate = (di) => countStatus(di, "متأخر");
  const countAbsent = (di) => countStatus(di, "غائب");
  const countPresent = (di) => teachers.length - countLate(di) - countAbsent(di);
  // تأخر صباحي = متأخر بدون حصص محددة أو lateType = "صباحي"
  const countMorningLate = (di) => teachers.filter((_, ti) => {
    const r = attendance[ti]?.[di] || {};
    return r.status === "متأخر" && (r.lateType === "صباحي" || !r.lateType);
  }).length;
  // تأخر عن حصص = متأخر وlateType = "حصص"
  const countPeriodLate = (di) => teachers.filter((_, ti) => {
    const r = attendance[ti]?.[di] || {};
    return r.status === "متأخر" && r.lateType === "حصص";
  }).length;
  // إجمالي دقائق التأخر الصباحي
  const totalMorningMins = (di) => teachers.reduce((sum, _, ti) => {
    const r = attendance[ti]?.[di] || {};
    if (r.status === "متأخر" && (r.lateType === "صباحي" || !r.lateType)) return sum + (parseInt(r.lateMinutes) || 0);
    return sum;
  }, 0);
  // إجمالي دقائق التأخر عن الحصص
  const totalPeriodMins = (di) => teachers.reduce((sum, _, ti) => {
    const r = attendance[ti]?.[di] || {};
    if (r.status === "متأخر" && r.lateType === "حصص") return sum + (parseInt(r.lateMinutes) || 0);
    return sum;
  }, 0);
  const filtered = teachers.map((t, i) => ({ name: t, idx: i })).filter(t => t.name.includes(searchQuery));

  // استيراد المعلمين من إكسل
  const handleTeacherImport = async (file) => {
    if (!window.XLSX) {
      await new Promise((res, rej) => {
        const s = document.createElement("script");
        s.src = "https://unpkg.com/xlsx/dist/xlsx.full.min.js";
        s.onload = res; s.onerror = rej;
        document.head.appendChild(s);
      });
    }
    const buf = await file.arrayBuffer();
    const wb = window.XLSX.read(buf);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const data = window.XLSX.utils.sheet_to_json(ws, { header: 1 });
    const names = data.flat().map(c => String(c||"").trim()).filter(c => c.length > 3 && isNaN(c));
    if (names.length > 0) {
      const merged = [...new Set([...teachers, ...names])];
      setTeachers(merged);
      saveTeachers(merged);
      alert(`✅ تم إضافة ${names.length} اسم. الإجمالي الآن: ${merged.length}`);
    }
    setShowExcelImport(false);
  };

  // طباعة اليومي
  const handlePrint = () => {
    const day = week.days[selectedDay];
    const w = window.open("", "_blank");
    const rows = teachers.map((t, ti) => {
      const r = attendance[ti]?.[selectedDay] || {};
      const st = r.status || "حاضر";
      let details = "—";
      if (st === "متأخر") {
        const periods = (r.latePeriods || []).join("، ");
        details = `تأخر ${r.lateMinutes || "—"} دقيقة — من الحصة: ${periods || "—"}`;
      } else if (st === "غائب") {
        details = `${r.absType || "اضطراري"} — ${r.notes || ""}`;
      }
      const color = st === "حاضر" ? "#f0fdf4" : st === "متأخر" ? "#fffbeb" : "#fef2f2";
      return `<tr style="background:${color}"><td>${ti+1}</td><td style="text-align:right;padding:6px 10px">${t}</td><td>${st === "حاضر" ? "✅ حاضر" : st === "متأخر" ? "🕐 متأخر" : "❌ غائب"}</td><td>${details}</td></tr>`;
    }).join("");

    w.document.write(`<!DOCTYPE html><html dir="rtl"><head><meta charset="utf-8">
    <title>سجل الحضور — ${day.name}</title>
    <style>
      *{margin:0;padding:0;box-sizing:border-box}
      body{font-family:'Noto Sans Arabic',Arial,sans-serif;padding:24px;direction:rtl;background:#fff;color:#111}
      .header{text-align:center;margin-bottom:20px;padding-bottom:12px;border-bottom:3px solid #0d9488}
      .header h1{font-size:20px;color:#0d9488;font-weight:900}
      .header p{font-size:13px;color:#555;margin-top:4px}
      .stats{display:flex;gap:12px;margin-bottom:16px;justify-content:center}
      .stat{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:8px 20px;text-align:center}
      .stat.late{background:#fffbeb;border-color:#fde68a}
      .stat.abs{background:#fef2f2;border-color:#fecaca}
      .stat span{display:block;font-size:22px;font-weight:900}
      .stat small{font-size:11px;color:#555}
      table{width:100%;border-collapse:collapse;font-size:12px}
      th{background:#0d9488;color:#fff;padding:8px;text-align:center}
      td{border:1px solid #e5e7eb;padding:6px;text-align:center}
      .footer{text-align:center;margin-top:20px;font-size:11px;color:#999}
      @media print{@page{size:A4;margin:1.5cm}}
    </style></head><body>
    <div class="header">
      <h1>مدرسة عبيدة بن الحارث المتوسطة</h1>
      <p>سجل الحضور والغياب — ${day.name} | ${day.dateH} هـ | ${day.dateM} م</p>
    </div>
    <div class="stats">
      <div class="stat"><span>${countPresent(selectedDay)}</span><small>✅ حاضر</small></div>
      <div class="stat late"><span>${countLate(selectedDay)}</span><small>🕐 متأخر</small></div>
      <div class="stat abs"><span>${countAbsent(selectedDay)}</span><small>❌ غائب</small></div>
    </div>
    <table>
      <thead><tr><th>م</th><th>اسم المعلم / الإداري</th><th>الحالة</th><th>التفاصيل</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="footer">تم الإصدار بتاريخ ${new Date().toLocaleDateString('ar-SA')} — بوابة مدرسة عبيدة بن الحارث الإلكترونية</div>
    </body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 400);
  };

  // طباعة ملخص الأسبوع
  const handlePrintSummary = () => {
    const w = window.open("", "_blank");
    const rows = teachers.map((t, ti) => {
      const morningLate = week.days.filter((_,di)=>{ const r=attendance[ti]?.[di]||{}; return r.status==="متأخر"&&(r.lateType==="صباحي"||!r.lateType); }).length;
      const periodLate  = week.days.filter((_,di)=>{ const r=attendance[ti]?.[di]||{}; return r.status==="متأخر"&&r.lateType==="حصص"; }).length;
      const absCount    = week.days.filter((_,di)=>(attendance[ti]?.[di]?.status||"حاضر")==="غائب").length;
      const morningMins = week.days.reduce((s,_,di)=>{ const r=attendance[ti]?.[di]||{}; return r.status==="متأخر"&&(r.lateType==="صباحي"||!r.lateType)?s+(parseInt(r.lateMinutes)||0):s; },0);
      const periodMins  = week.days.reduce((s,_,di)=>{ const r=attendance[ti]?.[di]||{}; return r.status==="متأخر"&&r.lateType==="حصص"?s+(parseInt(r.lateMinutes)||0):s; },0);
      const color = absCount>0?"#fef2f2":morningLate+periodLate>0?"#fffbeb":"#fff";
      return `<tr style="background:${color}"><td>${ti+1}</td><td style="text-align:right;padding:6px 10px">${t}</td>
        ${week.days.map((_,di)=>{ const r=attendance[ti]?.[di]||{}; const st=r.status||"حاضر"; const lt=r.lateType||"صباحي"; const min=r.lateMinutes||""; return `<td>${st==="حاضر"?"✅":st==="متأخر"?(lt==="حصص"?`📚${min?min+"د":""}`:`🌅${min?min+"د":""}`):"❌"}</td>`; }).join("")}
        <td style="color:#ea580c;font-weight:bold">${morningLate||"—"}</td>
        <td style="color:#ea580c">${morningMins>0?morningMins+"د":"—"}</td>
        <td style="color:#d97706;font-weight:bold">${periodLate||"—"}</td>
        <td style="color:#d97706">${periodMins>0?periodMins+"د":"—"}</td>
        <td style="color:#dc2626;font-weight:bold">${absCount||"—"}</td></tr>`;
    }).join("");

    w.document.write(`<!DOCTYPE html><html dir="rtl"><head><meta charset="utf-8"><title>ملخص الأسبوع</title>
    <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Noto Sans Arabic',Arial,sans-serif;padding:24px;direction:rtl}
    .header{text-align:center;margin-bottom:16px;padding-bottom:10px;border-bottom:3px solid #7c3aed}
    .header h1{font-size:18px;color:#7c3aed;font-weight:900}.header p{font-size:12px;color:#555;margin-top:3px}
    table{width:100%;border-collapse:collapse;font-size:11px}
    th{background:#7c3aed;color:#fff;padding:7px;text-align:center}
    td{border:1px solid #e5e7eb;padding:5px;text-align:center}
    @media print{@page{size:A4 landscape;margin:1cm}}</style></head><body>
    <div class="header"><h1>مدرسة عبيدة بن الحارث المتوسطة</h1>
    <p>ملخص الحضور والغياب الأسبوعي — ${week.days[0]?.dateH} إلى ${week.days[week.days.length-1]?.dateH} هـ</p></div>
    <table><thead><tr><th>م</th><th>اسم المعلم</th>
    ${week.days.map(d=>`<th>${d.name}</th>`).join("")}
    <th>🌅 تأخر صباحي</th><th>دقائق صباحي</th><th>📚 تأخر حصص</th><th>دقائق حصص</th><th>❌ غياب</th></tr></thead>
    <tbody>${rows}</tbody></table>
    <div style="text-align:center;margin-top:16px;font-size:10px;color:#999">تم الإصدار بتاريخ ${new Date().toLocaleDateString('ar-SA')}</div>
    </body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 400);
  };

  return (
    <div dir="rtl">
      {/* العنوان */}
      <div className="rounded-3xl p-6 mb-5 text-white shadow-xl"
        style={{ background: "linear-gradient(135deg, #0d9488 0%, #065f46 100%)" }}>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-right">
            <div className="text-4xl mb-1">📋</div>
            <h2 className="text-2xl font-black">سجل الحضور والغياب</h2>
            <p className="opacity-80 text-sm mt-1">مدرسة عبيدة بن الحارث المتوسطة — ١٤٤٧هـ</p>
          </div>
          <div className="flex gap-2 flex-wrap justify-center">
            <button onClick={handlePrint}
              className="bg-white text-teal-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-teal-50 flex items-center gap-1 shadow">
              🖨️ طباعة اليوم
            </button>
            <button onClick={() => { setShowSummary(true); }}
              className="bg-white text-purple-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-purple-50 flex items-center gap-1 shadow">
              📊 ملخص الأسبوع
            </button>
            <button onClick={() => setShowExcelImport(true)}
              className="bg-white text-green-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-green-50 flex items-center gap-1 shadow">
              📥 إضافة من إكسل
            </button>
            <div className="bg-white bg-opacity-20 px-3 py-2 rounded-xl text-xs font-bold">💾 حفظ تلقائي</div>
          </div>
        </div>
      </div>

      {/* إحصائيات اليوم */}
      {!showSummary && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-5">
          <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-3 text-center">
            <div className="text-3xl font-black text-emerald-700">{countPresent(selectedDay)}</div>
            <div className="text-xs font-bold text-emerald-600 mt-1">✅ حاضر</div>
          </div>
          <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-3 text-center">
            <div className="text-3xl font-black text-orange-700">{countMorningLate(selectedDay)}</div>
            <div className="text-xs font-bold text-orange-600 mt-1">🌅 تأخر صباحي</div>
            {totalMorningMins(selectedDay) > 0 && <div className="text-xs text-orange-400 mt-0.5">{totalMorningMins(selectedDay)} دقيقة</div>}
          </div>
          <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-3 text-center">
            <div className="text-3xl font-black text-amber-700">{countPeriodLate(selectedDay)}</div>
            <div className="text-xs font-bold text-amber-600 mt-1">📚 تأخر عن حصة</div>
            {totalPeriodMins(selectedDay) > 0 && <div className="text-xs text-amber-400 mt-0.5">{totalPeriodMins(selectedDay)} دقيقة</div>}
          </div>
          <div className="bg-amber-50 border-2 border-amber-100 rounded-2xl p-3 text-center">
            <div className="text-3xl font-black text-amber-600">{countLate(selectedDay)}</div>
            <div className="text-xs font-bold text-amber-500 mt-1">🕐 إجمالي التأخر</div>
          </div>
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-3 text-center">
            <div className="text-3xl font-black text-red-700">{countAbsent(selectedDay)}</div>
            <div className="text-xs font-bold text-red-600 mt-1">❌ غائب</div>
          </div>
        </div>
      )}

      {/* أيام الأسبوع */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {week.days.map((day, i) => (
          <button key={i} onClick={() => { setSelectedDay(i); setShowSummary(false); }}
            className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${!showSummary && selectedDay === i ? "bg-teal-600 text-white shadow-md" : "bg-white text-gray-600 border-2 border-gray-100 hover:border-teal-200"}`}>
            <div className="font-black">{day.name}</div>
            <div className="text-xs opacity-70">{day.dateH}</div>
            {!showSummary && selectedDay !== i && (countAbsent(i) > 0 || countLate(i) > 0) && (
              <div className="text-xs mt-0.5">
                {countAbsent(i) > 0 && <span className="text-red-500 font-bold">{countAbsent(i)}غ </span>}
                {countLate(i) > 0 && <span className="text-amber-500 font-bold">{countLate(i)}ت</span>}
              </div>
            )}
          </button>
        ))}
      </div>

      {/* بحث */}
      <input type="text" placeholder="🔍 بحث عن معلم أو إداري..." value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-teal-400 focus:outline-none text-sm bg-white mb-4" />

      {/* ملخص الأسبوع */}
      {showSummary ? (
        <div className="bg-white rounded-2xl shadow-sm border border-purple-100 overflow-hidden">
          <div className="flex items-center justify-between bg-purple-600 text-white px-4 py-3">
            <div className="font-black text-lg">📊 ملخص غياب وتأخر الأسبوع</div>
            <div className="flex gap-2">
              <button onClick={handlePrintSummary} className="bg-white text-purple-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-purple-50">🖨️ طباعة</button>
              <button onClick={() => setShowSummary(false)} className="bg-white bg-opacity-20 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-opacity-30">✕ إغلاق</button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-purple-50">
                  <th className="p-2 text-right font-bold text-gray-600 w-8">م</th>
                  <th className="p-2 text-right font-bold text-gray-600">اسم المعلم / الإداري</th>
                  {week.days.map((d, i) => <th key={i} className="p-2 text-center font-bold text-gray-600">{d.name}</th>)}
                  <th className="p-2 text-center font-bold text-orange-600">🌅 صباحي</th>
                  <th className="p-2 text-center font-bold text-orange-500">دقائق صباحي</th>
                  <th className="p-2 text-center font-bold text-amber-600">📚 حصص</th>
                  <th className="p-2 text-center font-bold text-amber-500">دقائق حصص</th>
                  <th className="p-2 text-center font-bold text-red-700">❌ غياب</th>
                </tr>
              </thead>
              <tbody>
                {teachers.filter(t => t.includes(searchQuery)).map((teacher, ti) => {
                  const morningLate = week.days.filter((_, di) => { const r = attendance[ti]?.[di]||{}; return r.status==="متأخر" && (r.lateType==="صباحي"||!r.lateType); }).length;
                  const periodLate = week.days.filter((_, di) => { const r = attendance[ti]?.[di]||{}; return r.status==="متأخر" && r.lateType==="حصص"; }).length;
                  const absCount = week.days.filter((_, di) => (attendance[ti]?.[di]?.status||"حاضر")==="غائب").length;
                  const morningMins = week.days.reduce((s,_,di)=>{ const r=attendance[ti]?.[di]||{}; return r.status==="متأخر"&&(r.lateType==="صباحي"||!r.lateType)?s+(parseInt(r.lateMinutes)||0):s; },0);
                  const periodMins = week.days.reduce((s,_,di)=>{ const r=attendance[ti]?.[di]||{}; return r.status==="متأخر"&&r.lateType==="حصص"?s+(parseInt(r.lateMinutes)||0):s; },0);
                  const anyLate = morningLate + periodLate;
                  return (
                    <tr key={ti} className={`border-t border-gray-100 ${absCount>0?"bg-red-50":anyLate>0?"bg-amber-50":"hover:bg-gray-50"}`}>
                      <td className="p-2 text-center text-gray-400 font-bold">{ti+1}</td>
                      <td className="p-2 font-medium text-gray-800">{teacher}</td>
                      {week.days.map((_, di) => {
                        const r = attendance[ti]?.[di] || {};
                        const st = r.status || "حاضر";
                        const lt = r.lateType || "صباحي";
                        const min = r.lateMinutes || "";
                        return (
                          <td key={di} className="p-2 text-center">
                            {st==="حاضر" ? <span className="text-green-500">✅</span>
                              : st==="متأخر" ? <span className={lt==="حصص"?"text-amber-600":"text-orange-600"} title={lt}>
                                  {lt==="حصص"?"📚":"🌅"}{min&&<span className="text-xs"> {min}د</span>}
                                </span>
                              : <span className="text-red-500">❌</span>}
                          </td>
                        );
                      })}
                      <td className="p-2 text-center font-black text-orange-600">{morningLate||"—"}</td>
                      <td className="p-2 text-center font-black text-orange-500">{morningMins>0?`${morningMins}د`:"—"}</td>
                      <td className="p-2 text-center font-black text-amber-600">{periodLate||"—"}</td>
                      <td className="p-2 text-center font-black text-amber-500">{periodMins>0?`${periodMins}د`:"—"}</td>
                      <td className="p-2 text-center font-black text-red-700">{absCount||"—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* جدول الحضور اليومي */
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-teal-600 text-white px-4 py-3 text-center">
            <span className="font-black">{week.days[selectedDay].name}</span>
            <span className="mx-2 opacity-60">|</span>
            <span className="text-sm opacity-90">{week.days[selectedDay].dateH} هـ</span>
            <span className="mx-2 opacity-60">|</span>
            <span className="text-sm opacity-90">{week.days[selectedDay].dateM} م</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "#f0fdfa" }}>
                  <th className="p-3 text-right text-xs font-bold text-gray-500 w-8">م</th>
                  <th className="p-3 text-right text-xs font-bold text-gray-500">اسم المعلم / الإداري</th>
                  <th className="p-3 text-center text-xs font-bold text-gray-500 w-28">الحالة</th>
                  <th className="p-3 text-center text-xs font-bold text-amber-700">الحصة</th>
                  <th className="p-3 text-center text-xs font-bold text-amber-700">مدة التأخر</th>
                  <th className="p-3 text-center text-xs font-bold text-red-600">نوع الغياب</th>
                  <th className="p-3 text-center text-xs font-bold text-gray-500">ملاحظات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(({ name, idx: ti }) => {
                  const r = attendance[ti]?.[selectedDay] || {};
                  const status = r.status || "حاضر";
                  const isLate = status === "متأخر";
                  const isAbsent = status === "غائب";
                  const rowBg = isAbsent ? "#fef2f2" : isLate ? "#fffbeb" : "#fff";

                  return (
                    <tr key={ti} style={{ background: rowBg }} className="border-t border-gray-100">
                      <td className="p-2 text-center text-xs text-gray-400 font-bold">{ti + 1}</td>
                      <td className="p-2.5">
                        <div className="flex items-center gap-2">
                          <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${isAbsent ? "bg-red-400" : isLate ? "bg-amber-400" : "bg-green-400"}`}></div>
                          <span className="font-medium text-gray-800 text-sm">{name}</span>
                        </div>
                      </td>

                      {/* الحالة */}
                      <td className="p-1.5 text-center">
                        <div className="flex gap-1 justify-center">
                          {ATTENDANCE_STATUS.map(st => (
                            <button key={st} onClick={() => updateField(ti, selectedDay, "status", st)}
                              className="px-2 py-1.5 rounded-lg text-xs font-bold transition-all border-2"
                              style={{
                                background: status === st ? (st === "حاضر" ? "#dcfce7" : st === "متأخر" ? "#fef3c7" : "#fee2e2") : "#f9fafb",
                                borderColor: status === st ? (st === "حاضر" ? "#16a34a" : st === "متأخر" ? "#d97706" : "#dc2626") : "#e5e7eb",
                                color: status === st ? (st === "حاضر" ? "#15803d" : st === "متأخر" ? "#92400e" : "#991b1b") : "#9ca3af",
                              }}>
                              {st === "حاضر" ? "✅" : st === "متأخر" ? "🕐" : "❌"} {st}
                            </button>
                          ))}
                        </div>
                      </td>

                      {/* الحصة المتأخر عنها */}
                      <td className="p-1.5 text-center">
                        {isLate ? (
                          <div className="space-y-1.5">
                            {/* نوع التأخر */}
                            <div className="flex gap-1 justify-center">
                              {["صباحي","حصص"].map(lt => (
                                <button key={lt} onClick={() => updateField(ti, selectedDay, "lateType", lt)}
                                  className="px-2.5 py-1 rounded-lg text-xs font-black border-2 transition-all"
                                  style={{
                                    background: (r.lateType||"صباحي") === lt ? (lt==="صباحي"?"#fff7ed":"#fefce8") : "#f9fafb",
                                    borderColor: (r.lateType||"صباحي") === lt ? (lt==="صباحي"?"#ea580c":"#ca8a04") : "#e5e7eb",
                                    color: (r.lateType||"صباحي") === lt ? (lt==="صباحي"?"#9a3412":"#713f12") : "#9ca3af",
                                  }}>
                                  {lt === "صباحي" ? "🌅" : "📚"} {lt}
                                </button>
                              ))}
                            </div>
                            {/* أرقام الحصص — تظهر فقط عند تأخر عن حصص */}
                            {(r.lateType === "حصص") && (
                              <div className="flex flex-wrap gap-1 justify-center">
                                {PERIODS.map((p, pi) => {
                                  const sel = (r.latePeriods || []).includes(p);
                                  return (
                                    <button key={pi} onClick={() => {
                                      const cur = r.latePeriods || [];
                                      updateField(ti, selectedDay, "latePeriods", sel ? cur.filter(x => x !== p) : [...cur, p]);
                                    }}
                                      className="px-1.5 py-1 rounded-lg text-xs font-bold border-2 transition-all"
                                      style={{ background: sel?"#fef3c7":"#f9fafb", borderColor: sel?"#f59e0b":"#e5e7eb", color: sel?"#92400e":"#9ca3af" }}>
                                      {pi+1}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        ) : <span className="text-gray-200 text-lg">—</span>}
                      </td>

                      {/* مدة التأخر */}
                      <td className="p-1.5 text-center">
                        {isLate ? (
                          <div className="flex items-center gap-1 justify-center">
                            <input type="number" min="1" max="120" placeholder="دقيقة"
                              value={r.lateMinutes || ""}
                              onChange={e => updateField(ti, selectedDay, "lateMinutes", e.target.value)}
                              className="w-16 px-2 py-1.5 rounded-lg border-2 border-amber-200 text-center text-xs font-bold focus:outline-none focus:border-amber-400 bg-amber-50"
                              style={{ fontFamily: "inherit" }} />
                            <span className="text-xs text-amber-600 font-bold">د</span>
                          </div>
                        ) : <span className="text-gray-200 text-lg">—</span>}
                      </td>

                      {/* نوع الغياب */}
                      <td className="p-1.5 text-center">
                        {isAbsent ? (
                          <select value={r.absType || "اضطراري"}
                            onChange={e => updateField(ti, selectedDay, "absType", e.target.value)}
                            className="px-2 py-1.5 rounded-lg border-2 border-red-200 text-xs font-bold focus:outline-none bg-red-50 text-red-700">
                            <option>اضطراري</option>
                            <option>مرضي</option>
                            <option>اعتيادي</option>
                            <option>إذن خروج</option>
                          </select>
                        ) : <span className="text-gray-200 text-lg">—</span>}
                      </td>

                      {/* ملاحظات */}
                      <td className="p-1.5">
                        <input type="text" placeholder="ملاحظة..."
                          value={r.notes || ""}
                          onChange={e => updateField(ti, selectedDay, "notes", e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg border-2 border-gray-200 text-xs focus:outline-none focus:border-teal-400 text-center"
                          style={{ fontFamily: "inherit", minWidth: "90px" }} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* نافذة استيراد إكسل للمعلمين */}
      {showExcelImport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-gray-800 text-lg">📥 إضافة معلمين من إكسل</h3>
              <button onClick={() => setShowExcelImport(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>
            </div>
            <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-700 mb-4 font-medium">
              الملف يجب أن يحتوي على عمود بأسماء المعلمين والإداريين. سيتم إضافة الأسماء الجديدة تلقائياً.
            </div>
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-blue-300 rounded-xl p-8 cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all">
              <div className="text-4xl mb-2">📂</div>
              <div className="font-bold text-gray-700">اضغط لاختيار ملف إكسل</div>
              <div className="text-xs text-gray-400 mt-1">يدعم .xlsx و .xls</div>
              <input type="file" accept=".xlsx,.xls" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleTeacherImport(f); }} />
            </label>
            <button onClick={() => setShowExcelImport(false)} className="w-full mt-4 py-2.5 rounded-xl bg-gray-100 text-gray-600 font-bold hover:bg-gray-200">إلغاء</button>
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

    // تحميل مكتبة SheetJS ديناميكياً
    if (!window.XLSX) {
      await new Promise((resolve, reject) => {
        const s = document.createElement("script");
        s.src = "https://unpkg.com/xlsx/dist/xlsx.full.min.js";
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
      });
    }
    const XLSX = window.XLSX;
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
function ParentPortal({ classList, messages, setMessages, saveMessages, surveys, setSurveys, saveSurveys, siteFont, onBack }) {
  const [nationalId, setNationalId] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const [tab, setTab] = useState("grades"); // grades | messages | surveys

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

            {/* تبويبات ولي الأمر */}
            <div className="flex gap-1 bg-white rounded-2xl p-1.5 shadow-sm">
              {[
                { id: "grades",   label: "التقييمات",  icon: "📊" },
                { id: "messages", label: "رسالة",      icon: "✉️" },
                { id: "surveys",  label: "استبيانات",  icon: "📋" },
              ].map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ${tab === t.id ? "bg-blue-600 text-white shadow" : "text-gray-500 hover:bg-gray-50"}`}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>

            {/* التقييمات الأسبوعية */}
            {tab === "grades" && (() => {
              const evals = result.student.evals || [];
              const LMAP = { weak: { label: "ضعيف", bg: "#FF6B6B", c: "#fff" }, accept: { label: "مقبول", bg: "#FFD93D", c: "#5a4200" }, good: { label: "جيد", bg: "#A8E6CF", c: "#1a4a30" }, vgood: { label: "جيد جداً", bg: "#4ECDC4", c: "#fff" }, excel: { label: "ممتاز", bg: "#2ECC71", c: "#fff" } };
              const CATS = [{ key:"behavior", label:"السلوك", icon:"🌿" }, { key:"homework", label:"الواجبات", icon:"📝" }, { key:"participation", label:"المشاركة", icon:"🙋" }, { key:"discipline", label:"الانضباط", icon:"⚖️" }];

              if (evals.length === 0) return (
                <div className="bg-white rounded-2xl shadow-xl p-5 text-center">
                  <div className="text-3xl mb-2">📋</div>
                  <div className="text-sm text-gray-400 font-bold">لا توجد تقييمات أسبوعية بعد</div>
                </div>
              );

              const lastEval = evals[evals.length - 1];
              const lastLv = LMAP[lastEval?.level];

              return (
                <>
                  {lastLv && (
                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                      <div className="px-4 py-3 font-black text-white text-sm" style={{ background: "#1B3A6B" }}>⭐ آخر تقييم أسبوعي</div>
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-xs text-gray-400">{lastEval.day} {lastEval.dateH}</div>
                          <span className="px-4 py-2 rounded-full font-black text-sm" style={{ background: lastLv.bg, color: lastLv.c }}>{lastLv.label}</span>
                        </div>
                        {CATS.map(cat => {
                          const d = lastEval.categories?.[cat.key];
                          if (!d?.text && !d?.face) return null;
                          return (
                            <div key={cat.key} className="flex items-start gap-2 rounded-xl px-3 py-2 mb-2"
                              style={{ background: d.color || "#f9fafb", border: "1px solid #e5e7eb" }}>
                              <span className="text-lg flex-shrink-0">{cat.icon}</span>
                              <div className="flex-1">
                                <div className="text-xs font-black text-gray-600">{cat.label}</div>
                                <div className="text-sm text-gray-700 mt-0.5">{d.text}</div>
                              </div>
                              {d.face && <span className="text-xl">{d.face}</span>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {evals.length > 1 && (
                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                      <div className="px-4 py-3 font-black text-white text-sm" style={{ background: "#1B3A6B" }}>📅 سجل التقييمات ({evals.length})</div>
                      <div className="divide-y divide-gray-100">
                        {[...evals].reverse().map(ev => {
                          const lv = LMAP[ev.level];
                          return (
                            <div key={ev.id} className="flex items-center justify-between px-4 py-3">
                              <div>
                                <div className="text-xs font-black text-gray-600">{ev.day} {ev.dateH}</div>
                                <div className="text-xs text-gray-400 mt-0.5">
                                  {CATS.filter(c => ev.categories?.[c.key]?.text).map(c => c.icon + " " + c.label).join(" · ")}
                                </div>
                              </div>
                              {lv ? <span className="px-3 py-1 rounded-full text-xs font-black" style={{ background: lv.bg, color: lv.c }}>{lv.label}</span>
                                : <span className="text-xs text-gray-300">—</span>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              );
            })()}

            {/* تبويب الرسائل */}
            {tab === "messages" && (
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                <MessagesPage
                  messages={messages}
                  setMessages={setMessages}
                  saveMessages={saveMessages}
                  isParent={true}
                  parentName={result.student.name}
                />
              </div>
            )}

            {/* تبويب الاستبيانات */}
            {tab === "surveys" && (
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                <SurveysPage
                  surveys={surveys}
                  setSurveys={setSurveys}
                  saveSurveys={saveSurveys}
                  isParent={true}
                />
              </div>
            )}
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

// ===== بوابة المعلم =====
function TeacherPortal({ classList, setClassList, saveClass, siteFont, onBack }) {
  const [step, setStep] = useState("login"); // login | dashboard
  const [teacherId, setTeacherId] = useState("");
  const [teacherAccounts, setTeacherAccounts] = useState([]);
  const [currentTeacher, setCurrentTeacher] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    DB.get("school-teacher-accounts", []).then(data => {
      setTeacherAccounts(Array.isArray(data) ? data : []);
      setLoading(false);
    });
  }, []);

  const handleLogin = () => {
    if (!teacherId.trim()) { setError("أدخل رقم الهوية"); return; }
    const found = teacherAccounts.find(t => t.id === teacherId.trim());
    if (found) {
      setCurrentTeacher(found);
      setStep("dashboard");
      setError("");
    } else {
      setError("رقم الهوية غير مسجل. تواصل مع الإدارة.");
    }
  };

  // فصول المعلم فقط (إذا مرتبطة باسمه)
  const myClasses = classList.filter(c =>
    !currentTeacher || !c.teacher || c.teacher === "" ||
    c.teacher === currentTeacher.name
  );

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ fontFamily: siteFont, background: "linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)" }}>
      <div className="text-white text-center"><div className="text-5xl mb-4 animate-bounce">👨‍🏫</div><p>جاري التحميل…</p></div>
    </div>
  );

  if (step === "login") return (
    <div dir="rtl" className="min-h-screen flex items-center justify-center p-4"
      style={{ fontFamily: siteFont, background: "linear-gradient(135deg, #1e3a5f 0%, #1d4ed8 60%, #1e40af 100%)" }}>
      <div className="w-full max-w-sm">
        <div className="text-center text-white mb-8">
          <div className="text-6xl mb-4">👨‍🏫</div>
          <h1 className="text-2xl font-black mb-1">مدرسة عبيدة بن الحارث المتوسطة</h1>
          <p className="opacity-70 text-sm">بوابة المعلم — إدخال مستويات الطلاب</p>
        </div>
        <div className="bg-white rounded-3xl p-6 shadow-2xl">
          <h2 className="text-center font-black text-gray-800 mb-5 text-lg">دخول المعلم</h2>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1.5 block">رقم الهوية الوطنية</label>
              <input type="text" value={teacherId}
                onChange={e => { setTeacherId(e.target.value); setError(""); }}
                onKeyDown={e => e.key === "Enter" && handleLogin()}
                placeholder="أدخل رقم هويتك"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-400 focus:outline-none text-sm text-center tracking-widest font-bold" />
            </div>
            {error && <div className="bg-red-50 text-red-600 text-xs font-bold p-3 rounded-xl text-center">{error}</div>}
            <button onClick={handleLogin}
              className="w-full py-3 rounded-xl font-black text-white hover:shadow-lg transition-all"
              style={{ background: "linear-gradient(135deg, #1e3a5f, #2563eb)" }}>
              دخول 👨‍🏫
            </button>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400 mb-2">كلمة المرور هي رقم هويتك الوطنية</p>
            <button onClick={onBack} className="text-xs text-blue-500 font-bold hover:underline">← العودة للصفحة الرئيسية</button>
          </div>
        </div>
      </div>
    </div>
  );

  // واجهة المعلم بعد الدخول
  return (
    <div dir="rtl" className="min-h-screen" style={{ fontFamily: siteFont, background: "linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;800&display=swap');`}</style>
      {/* شريط التنقل */}
      <nav className="bg-white shadow-md sticky top-0 z-50 border-b border-blue-100">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-base" style={{ background: "linear-gradient(135deg, #1e3a5f, #2563eb)" }}>🏫</div>
              <div>
                <div className="font-black text-blue-900 text-sm">مدرسة عبيدة بن الحارث</div>
                <div className="text-xs text-gray-400">بوابة المعلم</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 bg-blue-50 rounded-xl px-3 py-1.5">
                <div className="w-7 h-7 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 text-xs font-black">
                  {currentTeacher.name.charAt(0)}
                </div>
                <div className="text-xs">
                  <div className="font-black text-blue-900">{currentTeacher.name}</div>
                  <div className="text-gray-400">معلم</div>
                </div>
              </div>
              <button onClick={() => { setStep("login"); setCurrentTeacher(null); setTeacherId(""); }}
                className="text-xs text-red-500 font-bold px-3 py-1.5 rounded-lg hover:bg-red-50">خروج</button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* ترحيب */}
        <div className="rounded-3xl p-6 mb-6 text-white shadow-xl" style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #2563eb 60%, #3b82f6 100%)" }}>
          <div className="text-4xl mb-2">👨‍🏫</div>
          <h2 className="text-2xl font-black">أهلاً، {currentTeacher.name}</h2>
          <p className="opacity-80 text-sm mt-1">يمكنك إدخال وتعديل مستويات طلابك في الفصول أدناه</p>
        </div>

        {/* فصول المعلم */}
        <StudentsPage
          classList={myClasses}
          setClassList={setClassList}
          saveClass={saveClass}
          deleteClass={() => {}}
          teacherMode={true}
          teacherName={currentTeacher.name}
        />
      </main>

      <footer className="text-center py-4 text-xs text-gray-400 border-t border-gray-200 bg-white mt-8">
        مدرسة عبيدة بن الحارث المتوسطة — بوابة المعلم © ١٤٤٧ هـ
      </footer>
    </div>
  );
}
// ===== ثوابت التقييم الأسبوعي =====
const EVAL_LEVELS = [
  { value: "", label: "— المستوى —", bg: "#f5f5f5", color: "#aaa" },
  { value: "weak",  label: "ضعيف",    bg: "#FF6B6B", color: "#fff" },
  { value: "accept",label: "مقبول",   bg: "#FFD93D", color: "#5a4200" },
  { value: "good",  label: "جيد",     bg: "#A8E6CF", color: "#1a4a30" },
  { value: "vgood", label: "جيد جداً",bg: "#4ECDC4", color: "#fff" },
  { value: "excel", label: "ممتاز",   bg: "#2ECC71", color: "#fff" },
];
const EVAL_FACES = ["","😊","😁","😐","😟","😞","⭐","👍","👎","💪","📚","⚠️","🌟","🔥","💯"];
const EVAL_COLORS = [
  { label: "بدون", value: "" },
  { label: "أخضر", value: "#d1fae5" },
  { label: "أصفر", value: "#fef9c3" },
  { label: "أحمر", value: "#fee2e2" },
  { label: "أزرق", value: "#dbeafe" },
  { label: "بنفسجي", value: "#ede9fe" },
  { label: "برتقالي", value: "#ffedd5" },
];
const EVAL_CATEGORIES = [
  { key: "behavior",      label: "السلوك",      icon: "🌿" },
  { key: "homework",      label: "الواجبات",    icon: "📝" },
  { key: "participation", label: "المشاركة",    icon: "🙋" },
  { key: "discipline",    label: "الانضباط",    icon: "⚖️" },
];
const HIJRI_DAYS = ["الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس"];

// نموذج تقييم أسبوعي جديد
function newEval() {
  return {
    id: Date.now() + Math.random() * 1000 | 0,
    dateH: "",
    day: "الأحد",
    level: "",
    categories: {},
  };
}

// مكوّن التقييم الأسبوعي للطالب
function StudentEvalCard({ student, onUpdate, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const [addingEval, setAddingEval] = useState(false);
  const [draft, setDraft] = useState(newEval());
  const [openCats, setOpenCats] = useState({});

  const evals = student.evals || [];
  const lastEval = evals[evals.length - 1];
  const lastLevel = lastEval ? EVAL_LEVELS.find(l => l.value === lastEval.level) : null;

  const toggleCat = (key) => setOpenCats(p => ({ ...p, [key]: !p[key] }));

  const updateDraftCat = (key, field, val) => {
    setDraft(p => ({ ...p, categories: { ...p.categories, [key]: { ...(p.categories[key] || {}), [field]: val } } }));
  };

  const saveEval = () => {
    if (!draft.level) { alert("اختر المستوى أولاً"); return; }
    const updated = { ...student, evals: [...evals, { ...draft, id: Date.now() }] };
    onUpdate(updated);
    setAddingEval(false);
    setDraft(newEval());
    setOpenCats({});
  };

  const deleteEval = (eid) => {
    if (!confirm("حذف هذا التقييم؟")) return;
    onUpdate({ ...student, evals: evals.filter(e => e.id !== eid) });
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-3">
      {/* رأس الطالب */}
      <div className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 transition-all"
        style={{ borderRight: `4px solid ${lastLevel ? lastLevel.bg : "#e5e7eb"}` }}
        onClick={() => setExpanded(p => !p)}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center font-black text-sm"
            style={{ background: "#1B3A6B", color: "#fff" }}>{student.num}</div>
          <div>
            <div className="font-black text-gray-800">{student.name || <span className="text-gray-300 font-normal">اسم الطالب</span>}</div>
            {student.nationalId && <div className="text-xs text-gray-400">{student.nationalId}</div>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {lastLevel && lastLevel.value && (
            <span className="px-3 py-1 rounded-full text-xs font-black" style={{ background: lastLevel.bg, color: lastLevel.color }}>
              {lastLevel.label}
            </span>
          )}
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full font-bold">{evals.length} تقييم</span>
          <button onClick={e => { e.stopPropagation(); onDelete(student.id); }}
            className="text-red-300 hover:text-red-500 text-sm px-1 font-bold">✕</button>
          <span className="text-gray-400 text-lg">{expanded ? "▲" : "▼"}</span>
        </div>
      </div>

      {/* تفاصيل الطالب */}
      {expanded && (
        <div className="border-t border-gray-100">
          {/* تعديل الاسم والهوية */}
          <div className="flex gap-2 px-4 pt-3">
            <input type="text" value={student.name} placeholder="اسم الطالب"
              onChange={e => onUpdate({ ...student, name: e.target.value })}
              className="flex-1 px-3 py-2 rounded-xl border-2 border-gray-200 text-sm font-medium focus:border-blue-400 focus:outline-none"
              style={{ fontFamily: "inherit", color: "#1B3A6B" }} />
            <input type="text" value={student.nationalId || ""} placeholder="رقم الهوية"
              onChange={e => onUpdate({ ...student, nationalId: e.target.value })}
              className="w-36 px-3 py-2 rounded-xl border-2 border-gray-200 text-sm text-center focus:border-blue-400 focus:outline-none"
              style={{ fontFamily: "inherit" }} />
          </div>
          {/* قائمة التقييمات السابقة */}
          {evals.length > 0 && (
            <div className="px-4 pt-3 space-y-3">
              {evals.map(ev => {
                const lv = EVAL_LEVELS.find(l => l.value === ev.level) || EVAL_LEVELS[0];
                return (
                  <div key={ev.id} className="rounded-xl border border-gray-100 overflow-hidden">
                    {/* رأس التقييم */}
                    <div className="flex items-center justify-between px-3 py-2" style={{ background: lv.bg || "#f5f5f5" }}>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm" style={{ color: lv.color }}>{lv.label}</span>
                        {ev.dateH && <span className="text-xs opacity-70" style={{ color: lv.color }}>📅 {ev.day} {ev.dateH}</span>}
                      </div>
                      <button onClick={() => deleteEval(ev.id)} className="text-xs opacity-50 hover:opacity-100 px-2 py-0.5 rounded-lg hover:bg-red-100 hover:text-red-600 transition-all">🗑️</button>
                    </div>
                    {/* ملاحظات الفئات */}
                    {EVAL_CATEGORIES.map(cat => {
                      const catData = ev.categories?.[cat.key];
                      if (!catData?.text && !catData?.face) return null;
                      return (
                        <div key={cat.key} className="flex items-start gap-2 px-3 py-2 border-t border-gray-50"
                          style={{ background: catData.color || "#fff" }}>
                          <span className="text-base flex-shrink-0">{cat.icon}</span>
                          <div className="flex-1">
                            <span className="text-xs font-black text-gray-600">{cat.label}:</span>
                            <span className="text-xs text-gray-700 mr-1">{catData.text}</span>
                          </div>
                          {catData.face && <span className="text-base">{catData.face}</span>}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}

          {/* نموذج تقييم جديد */}
          {addingEval ? (
            <div className="m-4 bg-blue-50 rounded-2xl p-4 border-2 border-blue-200">
              <div className="font-black text-blue-800 mb-3 text-sm">➕ تقييم أسبوعي جديد</div>

              {/* التاريخ واليوم والمستوى */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1 block">اليوم</label>
                  <select value={draft.day} onChange={e => setDraft(p => ({ ...p, day: e.target.value }))}
                    className="w-full px-2 py-2 rounded-xl border-2 border-gray-200 text-sm focus:outline-none focus:border-blue-400">
                    {HIJRI_DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1 block">التاريخ الهجري</label>
                  <input type="text" placeholder="مثال: 15/09/1447" value={draft.dateH}
                    onChange={e => setDraft(p => ({ ...p, dateH: e.target.value }))}
                    className="w-full px-2 py-2 rounded-xl border-2 border-gray-200 text-sm text-center focus:outline-none focus:border-blue-400" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1 block">المستوى *</label>
                  <select value={draft.level} onChange={e => setDraft(p => ({ ...p, level: e.target.value }))}
                    className="w-full px-2 py-2 rounded-xl border-2 border-gray-200 text-sm font-bold focus:outline-none focus:border-blue-400"
                    style={draft.level ? { background: EVAL_LEVELS.find(l=>l.value===draft.level)?.bg, color: EVAL_LEVELS.find(l=>l.value===draft.level)?.color } : {}}>
                    {EVAL_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                  </select>
                </div>
              </div>

              {/* فئات الملاحظات */}
              <div className="space-y-2 mb-3">
                {EVAL_CATEGORIES.map(cat => {
                  const catData = draft.categories[cat.key] || {};
                  const isOpen = openCats[cat.key];
                  return (
                    <div key={cat.key} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                      <button className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-gray-50 transition-all"
                        onClick={() => toggleCat(cat.key)}>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{cat.icon}</span>
                          <span className="font-black text-gray-700 text-sm">{cat.label}</span>
                          {catData.face && <span className="text-base">{catData.face}</span>}
                          {catData.text && <span className="text-xs text-gray-400 truncate max-w-32">{catData.text}</span>}
                        </div>
                        <span className="text-gray-400 text-xs">{isOpen ? "▲" : "▼"}</span>
                      </button>
                      {isOpen && (
                        <div className="px-3 pb-3 space-y-2 border-t border-gray-100"
                          style={{ background: catData.color || "#fff" }}>
                          {/* الوجه التعبيري */}
                          <div className="pt-2">
                            <div className="text-xs font-bold text-gray-500 mb-1.5">الوجه التعبيري:</div>
                            <div className="flex gap-1.5 flex-wrap">
                              {EVAL_FACES.map(f => (
                                <button key={f} onClick={() => updateDraftCat(cat.key, "face", f === catData.face ? "" : f)}
                                  className="w-8 h-8 rounded-lg text-base flex items-center justify-center transition-all"
                                  style={{ background: catData.face === f ? "#dbeafe" : "#f3f4f6", border: catData.face === f ? "2px solid #3b82f6" : "2px solid transparent" }}>
                                  {f || "✕"}
                                </button>
                              ))}
                            </div>
                          </div>
                          {/* لون الخلفية */}
                          <div>
                            <div className="text-xs font-bold text-gray-500 mb-1.5">لون الخلفية:</div>
                            <div className="flex gap-1.5 flex-wrap">
                              {EVAL_COLORS.map(c => (
                                <button key={c.value} onClick={() => updateDraftCat(cat.key, "color", c.value)}
                                  className="px-2.5 py-1 rounded-lg text-xs font-bold border-2 transition-all"
                                  style={{ background: c.value || "#f3f4f6", borderColor: catData.color === c.value ? "#3b82f6" : "transparent" }}>
                                  {c.label}
                                </button>
                              ))}
                            </div>
                          </div>
                          {/* الملاحظة */}
                          <div>
                            <div className="text-xs font-bold text-gray-500 mb-1.5">الملاحظة:</div>
                            <textarea value={catData.text || ""} rows={2}
                              onChange={e => updateDraftCat(cat.key, "text", e.target.value)}
                              placeholder={`اكتب ملاحظة عن ${cat.label}...`}
                              className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 text-sm focus:outline-none focus:border-blue-400 resize-none"
                              style={{ fontFamily: "inherit" }} />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-2">
                <button onClick={saveEval} className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-black hover:bg-blue-700">💾 حفظ التقييم</button>
                <button onClick={() => { setAddingEval(false); setDraft(newEval()); setOpenCats({}); }}
                  className="px-4 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-sm font-bold hover:bg-gray-200">إلغاء</button>
              </div>
            </div>
          ) : (
            <div className="px-4 py-3">
              <button onClick={() => setAddingEval(true)}
                className="w-full py-2.5 rounded-xl border-2 border-dashed border-blue-300 text-blue-600 text-sm font-black hover:border-blue-500 hover:bg-blue-50 transition-all">
                ➕ إضافة تقييم أسبوعي
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ClassTable({ cls, onUpdateClass, onSave }) {
  const [search, setSearch] = useState("");
  const [editInfo, setEditInfo] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [info, setInfo] = useState({ level: cls.level, section: cls.section, teacher: cls.teacher, semester: cls.semester });

  useEffect(() => {
    const t = setTimeout(() => onSave(cls), 800);
    return () => clearTimeout(t);
  }, [cls.students]);

  const updateName = (sid, name) => onUpdateClass({ ...cls, students: cls.students.map(s => s.id === sid ? { ...s, name } : s) });
  const updateNationalId = (sid, nationalId) => onUpdateClass({ ...cls, students: cls.students.map(s => s.id === sid ? { ...s, nationalId } : s) });
  const updateStudent = (updated) => onUpdateClass({ ...cls, students: cls.students.map(s => s.id === updated.id ? updated : s) });
  const removeStudent = (sid) => {
    if (!confirm("حذف الطالب وجميع تقييماته؟")) return;
    onUpdateClass({ ...cls, students: cls.students.filter(s => s.id !== sid).map((s, i) => ({ ...s, num: i + 1 })) });
  };
  const handleExcelImport = (importedStudents) => {
    const start = cls.students.length;
    onUpdateClass({ ...cls, students: [...cls.students, ...importedStudents.map((s, i) => ({ ...s, num: start + i + 1 }))] });
  };
  const addStudent = () => onUpdateClass({ ...cls, students: [...cls.students, newStudent(cls.students.length + 1)] });
  const addMany = (count) => {
    const start = cls.students.length;
    onUpdateClass({ ...cls, students: [...cls.students, ...Array.from({ length: count }, (_, i) => newStudent(start + i + 1))] });
  };
  const saveInfo = () => {
    const updated = { ...cls, ...info, name: `${info.level} / ${info.section}` };
    onUpdateClass(updated); onSave(updated); setEditInfo(false);
  };

  const filtered = search ? cls.students.filter(s => s.name.includes(search)) : cls.students;

  const handlePrint = () => {
    const w = window.open("", "_blank");
    const rows = cls.students.map(s => {
      const evals = s.evals || [];
      const last = evals[evals.length - 1];
      const lv = EVAL_LEVELS.find(l => l.value === last?.level) || EVAL_LEVELS[0];
      const cats = EVAL_CATEGORIES.map(cat => {
        const d = last?.categories?.[cat.key];
        return d?.text ? `${cat.icon} ${cat.label}: ${d.text}` : null;
      }).filter(Boolean).join(" | ");
      return `<tr>
        <td>${s.num}</td>
        <td style="text-align:right;padding-right:8px">${s.name||"—"}</td>
        <td style="background:${lv.bg||'#fff'};color:${lv.color||'#333'};font-weight:700">${lv.label==="— المستوى —"?"—":lv.label}</td>
        <td style="font-size:10px;text-align:right;padding:4px 8px">${last?.dateH||""} ${last?.day||""}</td>
        <td style="font-size:9px;text-align:right;padding:4px 8px">${cats}</td>
      </tr>`;
    }).join("");
    w.document.write(`<!DOCTYPE html><html dir="rtl"><head><meta charset="utf-8">
    <title>سجل التقييم الأسبوعي — ${cls.name}</title>
    <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Tajawal',Arial,sans-serif;padding:20px;direction:rtl;font-size:12px}
    h1{text-align:center;color:#1B3A6B;font-size:16px;margin-bottom:4px}.sub{text-align:center;color:#666;font-size:10px;margin-bottom:12px}
    table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:6px;text-align:center}
    th{background:#1B3A6B;color:#fff}tr:nth-child(odd){background:#f4f7fb}
    .footer{text-align:center;margin-top:20px;font-size:9px;color:#999}
    @page{size:A4;margin:1.5cm}</style></head><body>
    <h1>🏫 سجل التقييم الأسبوعي — ${cls.name||cls.level+" / "+cls.section}</h1>
    <div class="sub">مدرسة عبيدة بن الحارث المتوسطة — الفصل ${cls.semester||"—"} — ${cls.teacher||""}</div>
    <table><thead><tr><th>م</th><th>اسم الطالب</th><th>آخر مستوى</th><th>التاريخ</th><th>الملاحظات</th></tr></thead>
    <tbody>${rows}</tbody></table>
    <div style="display:flex;gap:40px;margin-top:20px;font-size:10px">
      <div>توقيع المعلم: __________________</div>
      <div>توقيع مدير المدرسة: __________________</div>
      <div>التاريخ: __________________</div>
    </div>
    <div class="footer">بوابة مدرسة عبيدة بن الحارث الإلكترونية © ١٤٤٧هـ</div>
    </body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 300);
  };

  return (
    <div>
      {/* بيانات الفصل */}
      <div className="bg-white rounded-2xl shadow-sm border border-blue-100 mb-4 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3" style={{ background: "#1B3A6B" }}>
          <span className="font-bold text-white text-sm">📋 بيانات الفصل والمعلم</span>
          <button onClick={() => setEditInfo(!editInfo)} className="text-xs bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-3 py-1 rounded-lg font-bold">
            {editInfo ? "✕ إلغاء" : "✏️ تعديل"}
          </button>
        </div>
        {editInfo ? (
          <div className="p-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div><label className="text-xs font-bold text-gray-500 mb-1 block">المستوى</label>
              <select value={info.level} onChange={e => setInfo(p => ({ ...p, level: e.target.value }))} className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 text-sm focus:outline-none focus:border-blue-400">
                {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select></div>
            <div><label className="text-xs font-bold text-gray-500 mb-1 block">الشعبة</label>
              <select value={info.section} onChange={e => setInfo(p => ({ ...p, section: e.target.value }))} className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 text-sm focus:outline-none focus:border-blue-400">
                {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select></div>
            <div><label className="text-xs font-bold text-gray-500 mb-1 block">اسم المعلم</label>
              <input type="text" value={info.teacher} placeholder="اكتب الاسم" onChange={e => setInfo(p => ({ ...p, teacher: e.target.value }))} className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 text-sm focus:outline-none focus:border-blue-400" /></div>
            <div><label className="text-xs font-bold text-gray-500 mb-1 block">الفصل الدراسي</label>
              <select value={info.semester} onChange={e => setInfo(p => ({ ...p, semester: e.target.value }))} className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 text-sm focus:outline-none focus:border-blue-400">
                <option>الأول</option><option>الثاني</option><option>الثالث</option>
              </select></div>
            <div className="col-span-2 sm:col-span-4">
              <button onClick={saveInfo} className="bg-blue-600 text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-blue-700">💾 حفظ</button>
            </div>
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

      {/* أدوات */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <input type="text" placeholder="🔍 بحث عن طالب..." value={search} onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-40 px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-blue-400 focus:outline-none text-sm bg-white" />
        <button onClick={addStudent} className="bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700">+ طالب</button>
        <button onClick={() => addMany(5)} className="bg-blue-100 text-blue-700 px-4 py-2.5 rounded-xl text-sm font-bold">+ 5</button>
        <button onClick={() => addMany(43)} className="bg-indigo-100 text-indigo-700 px-4 py-2.5 rounded-xl text-sm font-bold">+ كامل</button>
        <button onClick={() => setShowImport(true)} className="bg-green-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-green-700">📊 إكسل</button>
        <button onClick={handlePrint} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-bold">🖨️ طباعة</button>
      </div>
      {showImport && <ExcelImportModal onImport={handleExcelImport} onClose={() => setShowImport(false)} />}

      {/* قائمة الطلاب */}
      {cls.students.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border-2 border-dashed border-blue-200">
          <div className="text-5xl mb-3">👨‍🎓</div>
          <div className="font-bold text-gray-500 mb-3">لا يوجد طلاب في هذا الفصل بعد</div>
          <div className="flex gap-2 justify-center flex-wrap">
            <button onClick={addStudent} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold">+ إضافة طالب</button>
            <button onClick={() => addMany(43)} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold">+ إضافة فصل كامل</button>
          </div>
        </div>
      ) : (
        <div>
          {/* بطاقات التقييم الأسبوعي */}
          <div className="mb-2 flex items-center justify-between">
            <div className="font-black text-gray-700 text-sm">📊 التقييمات الأسبوعية ({filtered.length} طالب)</div>
            <div className="flex gap-1.5 flex-wrap">
              {EVAL_LEVELS.slice(1).map(l => (
                <span key={l.value} className="px-2.5 py-1 rounded-full text-xs font-bold" style={{ background: l.bg, color: l.color }}>{l.label}</span>
              ))}
            </div>
          </div>
          {filtered.map(s => (
            <StudentEvalCard key={s.id} student={s} onUpdate={updateStudent} onDelete={removeStudent} />
          ))}
        </div>
      )}
    </div>
  );
}


function StudentsPage({ classList, setClassList, saveClass, deleteClass, teacherMode, teacherName }) {
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

// ===== صفحة رسائل وآراء أولياء الأمور =====
const MSG_RECIPIENTS = ["مدير المدرسة", "المعلم المسؤول", "الموجه الطلابي", "الجميع"];
const MSG_TYPES = [
  { value: "suggestion", label: "اقتراح", icon: "💡", color: "#dbeafe" },
  { value: "complaint",  label: "شكوى",  icon: "📣", color: "#fee2e2" },
  { value: "inquiry",    label: "استفسار",icon: "❓", color: "#fef9c3" },
  { value: "praise",     label: "إشادة", icon: "🌟", color: "#d1fae5" },
  { value: "message",    label: "رسالة",  icon: "✉️", color: "#ede9fe" },
];

function MessagesPage({ messages, setMessages, saveMessages, isParent, parentName }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ recipient: "مدير المدرسة", type: "suggestion", name: parentName || "", phone: "", text: "" });
  const [saved, setSaved] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const [filterRecipient, setFilterRecipient] = useState("all");
  const [searchQ, setSearchQ] = useState("");
  const [replyId, setReplyId] = useState(null);
  const [replyText, setReplyText] = useState("");

  const sendMsg = () => {
    if (!form.text.trim()) { alert("الرجاء كتابة نص الرسالة"); return; }
    const msg = { id: Date.now(), ...form, date: new Date().toLocaleDateString("ar-SA"), time: new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }), read: false, reply: "" };
    const updated = [msg, ...messages];
    setMessages(updated);
    saveMessages(updated);
    setForm({ recipient: "مدير المدرسة", type: "suggestion", name: parentName || "", phone: "", text: "" });
    setShowForm(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const markRead = (id) => {
    const updated = messages.map(m => m.id === id ? { ...m, read: true } : m);
    setMessages(updated); saveMessages(updated);
  };

  const sendReply = (id) => {
    if (!replyText.trim()) return;
    const updated = messages.map(m => m.id === id ? { ...m, reply: replyText, repliedAt: new Date().toLocaleDateString("ar-SA"), read: true } : m);
    setMessages(updated); saveMessages(updated);
    setReplyId(null); setReplyText("");
  };

  const deleteMsg = (id) => {
    if (!confirm("حذف هذه الرسالة؟")) return;
    const updated = messages.filter(m => m.id !== id);
    setMessages(updated); saveMessages(updated);
  };

  const filtered = messages.filter(m => {
    if (filterType !== "all" && m.type !== filterType) return false;
    if (filterRecipient !== "all" && m.recipient !== filterRecipient) return false;
    if (searchQ && !m.text.includes(searchQ) && !m.name.includes(searchQ)) return false;
    return true;
  });

  const unread = messages.filter(m => !m.read).length;

  return (
    <div dir="rtl">
      {/* بانر الشراكة */}
      <div className="rounded-3xl overflow-hidden mb-6 shadow-xl" style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #2563eb 60%, #0ea5e9 100%)" }}>
        <div className="p-8 text-white">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="text-7xl flex-shrink-0">🤝</div>
            <div className="text-center md:text-right flex-1">
              <h2 className="text-2xl font-black mb-2">شراكة الأسرة والمدرسة</h2>
              <p className="text-blue-100 leading-relaxed text-sm">
                تؤمن مدرسة عبيدة بن الحارث المتوسطة بأن نجاح الطالب يبدأ من شراكة حقيقية بين الأسرة والمدرسة.
                هذه المنصة جسر تواصل مفتوح بين أولياء الأمور والمدرسة — شاركونا آراءكم ومقترحاتكم واستفساراتكم،
                فأنتم شركاؤنا في بناء جيل واعٍ ومتميز.
              </p>
              <div className="flex flex-wrap gap-3 mt-4 justify-center md:justify-start">
                {["🎯 نستمع لكم", "💬 نردّ على رسائلكم", "🌱 نبني معاً", "🏆 أبناؤكم أولويتنا"].map(t => (
                  <span key={t} className="bg-white bg-opacity-20 px-3 py-1.5 rounded-full text-xs font-bold">{t}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white bg-opacity-10 px-6 py-3 flex flex-wrap gap-4 justify-between items-center">
          <div className="flex gap-2 flex-wrap">
            {/* زر دعوة أولياء الأمور */}
            {!isParent && (
              <button onClick={() => {
                const link = "https://school-website1.vercel.app";
                const msg = encodeURIComponent(
                  `🏫 *مدرسة عبيدة بن الحارث المتوسطة*\n\n` +
                  `✉️ *بوابة التواصل مع الأسرة*\n\n` +
                  `أعزاءنا أولياء الأمور،\n` +
                  `يسعدنا إطلاق بوابة التواصل المدرسي حيث يمكنكم إرسال آرائكم ومقترحاتكم واستفساراتكم مباشرةً لإدارة المدرسة.\n\n` +
                  `👈 اضغط الرابط وأدخل رقم هوية الطالب:\n${link}\n\n` +
                  `_ثم اختر تبويب "رسالة" ✉️_`
                );
                window.open(`https://wa.me/?text=${msg}`, "_blank");
              }}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl font-black text-xs flex items-center gap-1.5 shadow">
                <span className="text-base">📲</span> دعوة أولياء الأمور عبر واتساب
              </button>
            )}
            {saved && <span className="bg-green-400 text-white px-4 py-1.5 rounded-full text-sm font-black">✅ تم إرسال رسالتك بنجاح!</span>}
          </div>
        </div>
      </div>

      {/* زر إرسال رسالة */}
      {!showForm && (
        <button onClick={() => setShowForm(true)}
          className="w-full mb-5 py-4 rounded-2xl text-white font-black text-base shadow-lg hover:shadow-xl transition-all"
          style={{ background: "linear-gradient(135deg, #2563eb, #0ea5e9)" }}>
          ✉️ إرسال رسالة / رأي / مقترح جديد
        </button>
      )}

      {/* نموذج الإرسال */}
      {showForm && (
        <div className="bg-white rounded-3xl shadow-xl border border-blue-100 p-6 mb-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-black text-gray-800 text-lg">✉️ رسالة جديدة</h3>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>
          </div>
          <div className="space-y-4">
            {/* نوع الرسالة */}
            <div>
              <label className="text-xs font-black text-gray-600 mb-2 block">نوع الرسالة</label>
              <div className="flex gap-2 flex-wrap">
                {MSG_TYPES.map(t => (
                  <button key={t.value} onClick={() => setForm(p => ({ ...p, type: t.value }))}
                    className="px-3 py-2 rounded-xl text-sm font-bold border-2 transition-all"
                    style={{ background: form.type === t.value ? t.color : "#f9fafb", borderColor: form.type === t.value ? "#2563eb" : "#e5e7eb", color: form.type === t.value ? "#1e3a5f" : "#9ca3af" }}>
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>
            </div>
            {/* الجهة المرسل إليها */}
            <div>
              <label className="text-xs font-black text-gray-600 mb-2 block">الرسالة موجهة إلى</label>
              <select value={form.recipient} onChange={e => setForm(p => ({ ...p, recipient: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-sm focus:border-blue-400 focus:outline-none font-bold"
                style={{ fontFamily: "inherit" }}>
                {MSG_RECIPIENTS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            {/* الاسم والجوال */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-black text-gray-600 mb-1 block">الاسم (اختياري)</label>
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="اسم ولي الأمر"
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 text-sm focus:border-blue-400 focus:outline-none"
                  style={{ fontFamily: "inherit" }} />
              </div>
              <div>
                <label className="text-xs font-black text-gray-600 mb-1 block">رقم التواصل (اختياري)</label>
                <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                  placeholder="05xxxxxxxx" dir="ltr"
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 text-sm focus:border-blue-400 focus:outline-none text-right"
                  style={{ fontFamily: "inherit" }} />
              </div>
            </div>
            {/* نص الرسالة */}
            <div>
              <label className="text-xs font-black text-gray-600 mb-1 block">نص الرسالة / الرأي / الاقتراح *</label>
              <textarea value={form.text} onChange={e => setForm(p => ({ ...p, text: e.target.value }))}
                rows={5} placeholder="اكتب رسالتك هنا..."
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-sm focus:border-blue-400 focus:outline-none resize-none"
                style={{ fontFamily: "inherit" }} />
            </div>
            <div className="flex gap-3">
              <button onClick={sendMsg}
                className="flex-1 py-3 rounded-xl text-white font-black hover:shadow-lg transition-all"
                style={{ background: "linear-gradient(135deg, #2563eb, #0ea5e9)" }}>
                📤 إرسال الرسالة
              </button>
              <button onClick={() => setShowForm(false)} className="px-6 py-3 rounded-xl bg-gray-100 text-gray-600 font-bold hover:bg-gray-200">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* فلاتر وبحث — للإدارة فقط */}
      {!isParent && messages.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4 shadow-sm">
          <div className="flex flex-wrap gap-3 items-center">
            <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="🔍 بحث..."
              className="flex-1 min-w-32 px-3 py-2 rounded-xl border-2 border-gray-200 text-sm focus:outline-none focus:border-blue-400" />
            <select value={filterType} onChange={e => setFilterType(e.target.value)}
              className="px-3 py-2 rounded-xl border-2 border-gray-200 text-sm focus:outline-none" style={{ fontFamily: "inherit" }}>
              <option value="all">جميع الأنواع</option>
              {MSG_TYPES.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
            </select>
            <select value={filterRecipient} onChange={e => setFilterRecipient(e.target.value)}
              className="px-3 py-2 rounded-xl border-2 border-gray-200 text-sm focus:outline-none" style={{ fontFamily: "inherit" }}>
              <option value="all">جميع الجهات</option>
              {MSG_RECIPIENTS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>
      )}

      {/* قائمة الرسائل */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center border-2 border-dashed border-blue-100">
          <div className="text-5xl mb-3">📬</div>
          <div className="font-bold text-gray-400">لا توجد رسائل بعد — كن أول من يشارك!</div>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(msg => {
            const t = MSG_TYPES.find(x => x.value === msg.type) || MSG_TYPES[4];
            return (
              <div key={msg.id} className="bg-white rounded-2xl border shadow-sm overflow-hidden transition-all"
                style={{ borderColor: msg.read ? "#e5e7eb" : "#bfdbfe", borderWidth: msg.read ? 1 : 2 }}>
                {/* رأس الرسالة */}
                <div className="flex items-center justify-between px-4 py-3" style={{ background: t.color }}>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{t.icon}</span>
                    <span className="font-black text-gray-800 text-sm">{t.label}</span>
                    <span className="text-xs text-gray-500 bg-white bg-opacity-60 px-2 py-0.5 rounded-full">→ {msg.recipient}</span>
                    {!msg.read && <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full font-bold">جديد</span>}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{msg.time} | {msg.date}</span>
                    {!isParent && (
                      <>
                        {!msg.read && <button onClick={() => markRead(msg.id)} className="text-blue-600 hover:text-blue-800 font-bold px-2 py-0.5 rounded-lg hover:bg-blue-50">✓ قراءة</button>}
                        <button onClick={() => deleteMsg(msg.id)} className="text-red-400 hover:text-red-600 px-1">🗑️</button>
                      </>
                    )}
                  </div>
                </div>
                {/* محتوى الرسالة */}
                <div className="px-4 py-3">
                  {msg.name && <div className="text-xs font-bold text-gray-500 mb-1">👤 {msg.name}{msg.phone && ` | 📞 ${msg.phone}`}</div>}
                  <p className="text-sm text-gray-800 leading-relaxed">{msg.text}</p>
                  {/* الرد */}
                  {msg.reply && (
                    <div className="mt-3 bg-teal-50 border border-teal-200 rounded-xl p-3">
                      <div className="text-xs font-black text-teal-700 mb-1">↩️ رد الإدارة — {msg.repliedAt}</div>
                      <p className="text-sm text-teal-800">{msg.reply}</p>
                    </div>
                  )}
                  {/* نموذج الرد للإدارة */}
                  {!isParent && !msg.reply && replyId === msg.id && (
                    <div className="mt-3 flex gap-2">
                      <input value={replyText} onChange={e => setReplyText(e.target.value)}
                        placeholder="اكتب الرد هنا..."
                        className="flex-1 px-3 py-2 rounded-xl border-2 border-teal-300 text-sm focus:outline-none focus:border-teal-500"
                        style={{ fontFamily: "inherit" }} />
                      <button onClick={() => sendReply(msg.id)} className="bg-teal-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-teal-700">إرسال</button>
                      <button onClick={() => setReplyId(null)} className="bg-gray-100 text-gray-500 px-3 py-2 rounded-xl text-sm font-bold">✕</button>
                    </div>
                  )}
                  {!isParent && !msg.reply && replyId !== msg.id && (
                    <button onClick={() => { setReplyId(msg.id); setReplyText(""); }}
                      className="mt-2 text-xs text-teal-600 font-bold hover:underline">↩️ ردّ على هذه الرسالة</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ===== صفحة الاستبيانات =====
const SURVEY_FIELD_TYPES = [
  { value: "text",     label: "نص حر",       icon: "✍️" },
  { value: "radio",    label: "اختيار واحد", icon: "🔘" },
  { value: "checkbox", label: "اختيار متعدد",icon: "☑️" },
  { value: "scale",    label: "تقييم 1-5",   icon: "⭐" },
  { value: "yesno",    label: "نعم / لا",    icon: "✅" },
];
const SURVEY_THEMES = [
  { name: "أزرق",     header: "#1e3a5f", accent: "#2563eb", bg: "#eff6ff" },
  { name: "أخضر",    header: "#064e3b", accent: "#059669", bg: "#ecfdf5" },
  { name: "بنفسجي",  header: "#4c1d95", accent: "#7c3aed", bg: "#f5f3ff" },
  { name: "برتقالي", header: "#7c2d12", accent: "#ea580c", bg: "#fff7ed" },
  { name: "وردي",    header: "#831843", accent: "#db2777", bg: "#fdf2f8" },
  { name: "رمادي",   header: "#1f2937", accent: "#374151", bg: "#f9fafb" },
];
const SURVEY_FONTS = ["Tajawal","Cairo","Noto Naskh Arabic","Noto Kufi Arabic","Amiri","Reem Kufi"];
const SURVEY_TARGETS = ["أولياء الأمور","المعلمون","الطلاب","الجميع"];
const SURVEY_FACES = ["","😊","😁","🙂","😐","😕","😞","⭐","👍","👎","💪","🔥","💯","🌟"];

function newField() {
  return { id: Date.now() + Math.random() * 1000 | 0, type: "radio", label: "", options: ["خيار 1","خيار 2"], required: true, emoji: "", fontSize: "text-sm" };
}
function newSurvey() {
  return { id: Date.now(), title: "", description: "", target: "أولياء الأمور", theme: 0, font: "Tajawal", fields: [], active: true, responses: [], createdAt: new Date().toLocaleDateString("ar-SA") };
}

function SurveyBuilder({ survey, onSave, onCancel }) {
  const [s, setS] = useState({ ...survey });
  const [editingField, setEditingField] = useState(null);

  const theme = SURVEY_THEMES[s.theme];

  const addField = () => {
    const f = newField();
    setS(p => ({ ...p, fields: [...p.fields, f] }));
    setEditingField(f.id);
  };

  const updateField = (id, changes) => setS(p => ({ ...p, fields: p.fields.map(f => f.id === id ? { ...f, ...changes } : f) }));
  const removeField = (id) => setS(p => ({ ...p, fields: p.fields.filter(f => f.id !== id) }));
  const moveField = (id, dir) => {
    const idx = s.fields.findIndex(f => f.id === id);
    if (idx + dir < 0 || idx + dir >= s.fields.length) return;
    const arr = [...s.fields];
    [arr[idx], arr[idx + dir]] = [arr[idx + dir], arr[idx]];
    setS(p => ({ ...p, fields: arr }));
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
      {/* رأس البناء */}
      <div className="px-6 py-4 flex items-center justify-between" style={{ background: theme.header }}>
        <span className="font-black text-white text-lg">🛠️ {survey.id ? "تعديل الاستبيان" : "استبيان جديد"}</span>
        <div className="flex gap-2">
          <button onClick={() => onSave(s)} className="bg-green-400 text-white px-4 py-2 rounded-xl text-sm font-black hover:bg-green-500">💾 حفظ</button>
          <button onClick={onCancel} className="bg-white bg-opacity-20 text-white px-3 py-2 rounded-xl text-sm font-bold hover:bg-opacity-30">✕ إلغاء</button>
        </div>
      </div>

      <div className="p-5 space-y-5" style={{ background: theme.bg, fontFamily: s.font }}>
        {/* معلومات الاستبيان */}
        <div className="bg-white rounded-2xl p-4 space-y-3 shadow-sm">
          <h4 className="font-black text-gray-700 text-sm mb-3">📋 معلومات الاستبيان</h4>
          <input value={s.title} onChange={e => setS(p => ({ ...p, title: e.target.value }))}
            placeholder="عنوان الاستبيان *" style={{ fontFamily: s.font }}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-base font-black focus:outline-none focus:border-blue-400" />
          <textarea value={s.description} onChange={e => setS(p => ({ ...p, description: e.target.value }))}
            rows={2} placeholder="وصف أو مقدمة الاستبيان (اختياري)" style={{ fontFamily: s.font }}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-sm focus:outline-none focus:border-blue-400 resize-none" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1 block">الفئة المستهدفة</label>
              <select value={s.target} onChange={e => setS(p => ({ ...p, target: e.target.value }))} style={{ fontFamily: s.font }}
                className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 text-sm focus:outline-none focus:border-blue-400">
                {SURVEY_TARGETS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1 block">الخط</label>
              <select value={s.font} onChange={e => setS(p => ({ ...p, font: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 text-sm focus:outline-none">
                {SURVEY_FONTS.map(f => <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-xs font-bold text-gray-500 mb-1 block">لون الاستبيان</label>
              <div className="flex gap-1.5">
                {SURVEY_THEMES.map((t, i) => (
                  <button key={i} onClick={() => setS(p => ({ ...p, theme: i }))}
                    className="w-8 h-8 rounded-full border-4 transition-all"
                    title={t.name}
                    style={{ background: t.accent, borderColor: s.theme === i ? "#fff" : "transparent", outline: s.theme === i ? `2px solid ${t.accent}` : "none" }} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* الحقول */}
        <div className="space-y-3">
          {s.fields.map((field, fi) => (
            <div key={field.id} className="bg-white rounded-2xl border-2 shadow-sm overflow-hidden"
              style={{ borderColor: editingField === field.id ? theme.accent : "#e5e7eb" }}>
              {/* رأس الحقل */}
              <div className="flex items-center justify-between px-4 py-2.5" style={{ background: editingField === field.id ? theme.accent : "#f9fafb" }}>
                <div className="flex items-center gap-2">
                  <span className="text-base">{SURVEY_FIELD_TYPES.find(t => t.value === field.type)?.icon}</span>
                  <span className={`font-bold text-sm ${editingField === field.id ? "text-white" : "text-gray-700"}`}>
                    {field.label || `سؤال ${fi + 1}`}
                  </span>
                  {field.emoji && <span className="text-base">{field.emoji}</span>}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => moveField(field.id, -1)} className="text-gray-400 hover:text-gray-600 px-1 text-sm">↑</button>
                  <button onClick={() => moveField(field.id,  1)} className="text-gray-400 hover:text-gray-600 px-1 text-sm">↓</button>
                  <button onClick={() => setEditingField(editingField === field.id ? null : field.id)}
                    className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all ${editingField === field.id ? "bg-white text-gray-700" : "bg-gray-200 text-gray-600 hover:bg-gray-300"}`}>
                    {editingField === field.id ? "✕ إغلاق" : "✏️ تعديل"}
                  </button>
                  <button onClick={() => removeField(field.id)} className="text-red-400 hover:text-red-600 px-1 text-sm">🗑️</button>
                </div>
              </div>

              {/* تعديل الحقل */}
              {editingField === field.id && (
                <div className="p-4 space-y-3 border-t border-gray-100">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <div>
                      <label className="text-xs font-bold text-gray-500 mb-1 block">نص السؤال</label>
                      <input value={field.label} onChange={e => updateField(field.id, { label: e.target.value })}
                        placeholder="اكتب السؤال..." style={{ fontFamily: s.font }}
                        className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 text-sm focus:outline-none focus:border-blue-400" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 mb-1 block">نوع الإجابة</label>
                      <select value={field.type} onChange={e => updateField(field.id, { type: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 text-sm focus:outline-none">
                        {SURVEY_FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 mb-1 block">حجم الخط</label>
                      <select value={field.fontSize || "text-sm"} onChange={e => updateField(field.id, { fontSize: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 text-sm focus:outline-none">
                        <option value="text-xs">صغير</option>
                        <option value="text-sm">متوسط</option>
                        <option value="text-base">كبير</option>
                        <option value="text-lg">كبير جداً</option>
                      </select>
                    </div>
                  </div>
                  {/* إيموجي */}
                  <div>
                    <label className="text-xs font-bold text-gray-500 mb-1.5 block">رمز تعبيري</label>
                    <div className="flex gap-1.5 flex-wrap">
                      {SURVEY_FACES.map(f => (
                        <button key={f} onClick={() => updateField(field.id, { emoji: f === field.emoji ? "" : f })}
                          className="w-8 h-8 rounded-lg text-base flex items-center justify-center border-2 transition-all"
                          style={{ background: field.emoji === f ? "#dbeafe" : "#f3f4f6", borderColor: field.emoji === f ? "#3b82f6" : "transparent" }}>
                          {f || "✕"}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* خيارات radio/checkbox */}
                  {(field.type === "radio" || field.type === "checkbox") && (
                    <div>
                      <label className="text-xs font-bold text-gray-500 mb-2 block">الخيارات</label>
                      <div className="space-y-2">
                        {(field.options || []).map((opt, oi) => (
                          <div key={oi} className="flex gap-2 items-center">
                            <span className="text-gray-400 text-xs w-4">{oi + 1}</span>
                            <input value={opt} onChange={e => { const opts = [...field.options]; opts[oi] = e.target.value; updateField(field.id, { options: opts }); }}
                              style={{ fontFamily: s.font }}
                              className="flex-1 px-3 py-1.5 rounded-lg border-2 border-gray-200 text-sm focus:outline-none focus:border-blue-400" />
                            <button onClick={() => updateField(field.id, { options: field.options.filter((_, i) => i !== oi) })}
                              className="text-red-400 hover:text-red-600 text-sm px-1">✕</button>
                          </div>
                        ))}
                        <button onClick={() => updateField(field.id, { options: [...(field.options || []), `خيار ${(field.options?.length || 0) + 1}`] })}
                          className="text-blue-600 text-xs font-bold hover:underline">+ إضافة خيار</button>
                      </div>
                    </div>
                  )}
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={field.required} onChange={e => updateField(field.id, { required: e.target.checked })} />
                    <span className="font-bold text-gray-600">إجباري</span>
                  </label>
                </div>
              )}

              {/* معاينة الحقل */}
              {editingField !== field.id && field.label && (
                <div className="px-4 py-3">
                  <div className={`font-bold text-gray-700 mb-2 flex items-center gap-2 ${field.fontSize || "text-sm"}`} style={{ fontFamily: s.font }}>
                    {field.emoji && <span>{field.emoji}</span>}
                    {field.label}
                    {field.required && <span className="text-red-500 text-xs">*</span>}
                  </div>
                  {field.type === "text" && <div className="h-9 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50" />}
                  {(field.type === "radio" || field.type === "checkbox") && (
                    <div className="flex flex-wrap gap-2">
                      {(field.options || []).map((o, i) => (
                        <span key={i} className="px-3 py-1.5 rounded-full text-xs border-2 border-gray-200 text-gray-500" style={{ fontFamily: s.font }}>{o}</span>
                      ))}
                    </div>
                  )}
                  {field.type === "scale" && (
                    <div className="flex gap-1">
                      {[1,2,3,4,5].map(n => <span key={n} className="w-9 h-9 rounded-xl border-2 border-gray-200 text-gray-400 text-sm flex items-center justify-center font-bold">{"⭐".repeat(n).slice(-1)}{n}</span>)}
                    </div>
                  )}
                  {field.type === "yesno" && (
                    <div className="flex gap-2">
                      <span className="px-5 py-2 rounded-xl border-2 border-green-200 text-green-600 text-sm font-bold">✅ نعم</span>
                      <span className="px-5 py-2 rounded-xl border-2 border-red-200 text-red-500 text-sm font-bold">❌ لا</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* زر إضافة سؤال */}
        <button onClick={addField}
          className="w-full py-3 rounded-2xl border-2 border-dashed font-black text-sm hover:opacity-90 transition-all"
          style={{ borderColor: theme.accent, color: theme.accent, background: theme.bg }}>
          ➕ إضافة سؤال جديد
        </button>
      </div>
    </div>
  );
}

function SurveyRespond({ survey, onClose }) {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const theme = SURVEY_THEMES[survey.theme ?? 0];

  const setAns = (fid, val) => setAnswers(p => ({ ...p, [fid]: val }));
  const toggleCheck = (fid, opt) => {
    const cur = answers[fid] || [];
    setAns(fid, cur.includes(opt) ? cur.filter(x => x !== opt) : [...cur, opt]);
  };

  const submit = () => {
    const missing = survey.fields.filter(f => f.required && !answers[f.id]);
    if (missing.length > 0) { alert(`يرجى الإجابة على: ${missing.map(f => f.label).join("، ")}`); return; }
    setSubmitted(true);
  };

  if (submitted) return (
    <div className="bg-white rounded-3xl p-10 text-center shadow-xl border border-gray-100">
      <div className="text-6xl mb-4">🎉</div>
      <h3 className="font-black text-gray-800 text-xl mb-2">شكراً لمشاركتك!</h3>
      <p className="text-gray-500 text-sm mb-5">تم استلام إجابتك بنجاح وسيتم مراجعتها من قِبل الإدارة</p>
      <button onClick={onClose} className="px-6 py-2.5 rounded-xl text-white font-bold" style={{ background: theme.accent }}>العودة</button>
    </div>
  );

  return (
    <div className="rounded-3xl overflow-hidden shadow-xl border border-gray-100" style={{ background: theme.bg, fontFamily: survey.font || "Tajawal" }}>
      <div className="px-6 py-5 text-white" style={{ background: `linear-gradient(135deg, ${theme.header}, ${theme.accent})` }}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-black text-xl mb-1">{survey.title}</h3>
            {survey.description && <p className="opacity-80 text-sm">{survey.description}</p>}
          </div>
          <button onClick={onClose} className="text-white opacity-60 hover:opacity-100 text-xl font-bold flex-shrink-0">✕</button>
        </div>
        <div className="mt-3 flex gap-3 text-xs opacity-80">
          <span>👥 {survey.target}</span>
          <span>📅 {survey.createdAt}</span>
          <span>❓ {survey.fields.length} سؤال</span>
        </div>
      </div>
      <div className="p-5 space-y-4">
        {survey.fields.map((field, fi) => (
          <div key={field.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className={`font-bold text-gray-800 mb-3 flex items-center gap-2 ${field.fontSize || "text-sm"}`}>
              {field.emoji && <span className="text-lg">{field.emoji}</span>}
              <span>{fi + 1}. {field.label}</span>
              {field.required && <span className="text-red-500 text-xs mr-1">*</span>}
            </div>
            {field.type === "text" && (
              <textarea rows={3} value={answers[field.id] || ""} onChange={e => setAns(field.id, e.target.value)}
                placeholder="اكتب إجابتك هنا..."
                className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 text-sm focus:outline-none resize-none"
                style={{ borderColor: answers[field.id] ? theme.accent : undefined, fontFamily: survey.font }} />
            )}
            {(field.type === "radio") && (
              <div className="space-y-2">
                {(field.options || []).map(opt => (
                  <label key={opt} className="flex items-center gap-3 cursor-pointer p-2.5 rounded-xl border-2 transition-all hover:border-blue-200"
                    style={{ borderColor: answers[field.id] === opt ? theme.accent : "#e5e7eb", background: answers[field.id] === opt ? theme.bg : "white" }}>
                    <input type="radio" name={`f${field.id}`} value={opt} checked={answers[field.id] === opt} onChange={() => setAns(field.id, opt)} className="sr-only" />
                    <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                      style={{ borderColor: answers[field.id] === opt ? theme.accent : "#d1d5db", background: answers[field.id] === opt ? theme.accent : "white" }}>
                      {answers[field.id] === opt && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <span className="text-sm font-medium text-gray-700" style={{ fontFamily: survey.font }}>{opt}</span>
                  </label>
                ))}
              </div>
            )}
            {(field.type === "checkbox") && (
              <div className="space-y-2">
                {(field.options || []).map(opt => {
                  const checked = (answers[field.id] || []).includes(opt);
                  return (
                    <label key={opt} className="flex items-center gap-3 cursor-pointer p-2.5 rounded-xl border-2 transition-all hover:border-blue-200"
                      style={{ borderColor: checked ? theme.accent : "#e5e7eb", background: checked ? theme.bg : "white" }}>
                      <input type="checkbox" checked={checked} onChange={() => toggleCheck(field.id, opt)} className="sr-only" />
                      <div className="w-5 h-5 rounded-lg border-2 flex items-center justify-center flex-shrink-0"
                        style={{ borderColor: checked ? theme.accent : "#d1d5db", background: checked ? theme.accent : "white" }}>
                        {checked && <span className="text-white text-xs font-black">✓</span>}
                      </div>
                      <span className="text-sm font-medium text-gray-700" style={{ fontFamily: survey.font }}>{opt}</span>
                    </label>
                  );
                })}
              </div>
            )}
            {field.type === "scale" && (
              <div className="flex gap-2">
                {[1,2,3,4,5].map(n => (
                  <button key={n} onClick={() => setAns(field.id, n)}
                    className="flex-1 py-3 rounded-xl border-2 font-black text-sm transition-all"
                    style={{ borderColor: answers[field.id] === n ? theme.accent : "#e5e7eb", background: answers[field.id] === n ? theme.accent : "white", color: answers[field.id] === n ? "white" : "#374151" }}>
                    {"⭐".repeat(n)}
                  </button>
                ))}
              </div>
            )}
            {field.type === "yesno" && (
              <div className="flex gap-3">
                {[["نعم","✅","#dcfce7","#16a34a"], ["لا","❌","#fee2e2","#dc2626"]].map(([opt, icon, bg, col]) => (
                  <button key={opt} onClick={() => setAns(field.id, opt)}
                    className="flex-1 py-3 rounded-xl border-2 font-black text-sm transition-all"
                    style={{ borderColor: answers[field.id] === opt ? col : "#e5e7eb", background: answers[field.id] === opt ? bg : "white", color: answers[field.id] === opt ? col : "#9ca3af" }}>
                    {icon} {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        <button onClick={submit}
          className="w-full py-4 rounded-2xl text-white font-black text-base shadow-lg hover:shadow-xl transition-all"
          style={{ background: `linear-gradient(135deg, ${theme.header}, ${theme.accent})` }}>
          📤 إرسال الإجابات
        </button>
      </div>
    </div>
  );
}

function SurveysPage({ surveys, setSurveys, saveSurveys, isParent }) {
  const [mode, setMode] = useState("list");
  const [editing, setEditing] = useState(null);
  const [responding, setResponding] = useState(null);
  const [filterTarget, setFilterTarget] = useState("all");
  const [copiedId, setCopiedId] = useState(null);
  const [shareMsg, setShareMsg] = useState("");

  const BASE_URL = "https://school-website1.vercel.app";

  const getSurveyLink = (s) => `${BASE_URL}/?survey=${s.id}`;

  const copyLink = (s) => {
    const link = getSurveyLink(s);
    navigator.clipboard.writeText(link).then(() => {
      setCopiedId(s.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const shareWhatsApp = (s) => {
    const link = getSurveyLink(s);
    const msg = encodeURIComponent(
      `🏫 *مدرسة عبيدة بن الحارث المتوسطة*\n\n` +
      `📊 *${s.title}*\n` +
      (s.description ? `${s.description}\n\n` : `\n`) +
      `👥 موجّه إلى: ${s.target}\n\n` +
      `📝 للمشاركة في الاستبيان اضغط الرابط:\n${link}\n\n` +
      `_أدخل رقم هوية الطالب للوصول_`
    );
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  };

  const shareMsgPage = () => {
    const link = BASE_URL;
    const msg = encodeURIComponent(
      `🏫 *مدرسة عبيدة بن الحارث المتوسطة*\n\n` +
      `✉️ *بوابة التواصل مع المدرسة*\n\n` +
      `يمكنكم الآن إرسال آرائكم ومقترحاتكم واستفساراتكم مباشرةً إلى إدارة المدرسة\n\n` +
      `👈 اضغط الرابط وأدخل رقم هوية الطالب:\n${link}\n\n` +
      `_ثم اختر تبويب "رسالة" 📩_`
    );
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  };

  const saveSurvey = (s) => {
    const exists = surveys.find(x => x.id === s.id);
    const updated = exists ? surveys.map(x => x.id === s.id ? s : x) : [s, ...surveys];
    setSurveys(updated); saveSurveys(updated); setMode("list"); setEditing(null);
  };
  const deleteSurvey = (id) => {
    if (!confirm("حذف هذا الاستبيان نهائياً؟")) return;
    const updated = surveys.filter(s => s.id !== id);
    setSurveys(updated); saveSurveys(updated);
  };
  const toggleActive = (id) => {
    const updated = surveys.map(s => s.id === id ? { ...s, active: !s.active } : s);
    setSurveys(updated); saveSurveys(updated);
  };

  const filtered = surveys.filter(s => {
    if (isParent && !s.active) return false;
    if (filterTarget !== "all" && s.target !== filterTarget && s.target !== "الجميع") return false;
    return true;
  });

  const newSurveyCount = surveys.filter(s => s.active).length;

  if (mode === "build") return (
    <SurveyBuilder survey={editing || newSurvey()} onSave={saveSurvey} onCancel={() => { setMode("list"); setEditing(null); }} />
  );
  if (mode === "respond" && responding) return (
    <SurveyRespond survey={responding} onClose={() => { setMode("list"); setResponding(null); }} />
  );

  return (
    <div dir="rtl">
      {/* رأس الصفحة */}
      <div className="rounded-3xl overflow-hidden mb-6 shadow-xl" style={{ background: "linear-gradient(135deg, #4c1d95 0%, #7c3aed 60%, #a78bfa 100%)" }}>
        <div className="p-8 text-white">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="text-7xl flex-shrink-0">📊</div>
            <div className="text-center md:text-right flex-1">
              <h2 className="text-2xl font-black mb-2">الاستبيانات والاستطلاعات</h2>
              <p className="text-purple-100 text-sm leading-relaxed">
                منصة متكاملة لإنشاء استبيانات احترافية وجمع آراء أولياء الأمور والمعلمين والطلاب
                — شاركونا في تطوير بيئتنا التعليمية
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white bg-opacity-10 px-6 py-3 flex flex-wrap gap-3 justify-between items-center">
          <div className="flex gap-4 text-white text-sm">
            <span>📋 إجمالي الاستبيانات: <b>{surveys.length}</b></span>
            <span>✅ نشط: <b>{surveys.filter(s => s.active).length}</b></span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {/* زر مشاركة بوابة الرسائل عبر واتساب */}
            {!isParent && (
              <button onClick={shareMsgPage}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl font-black text-xs flex items-center gap-1.5 shadow">
                <span className="text-base">📲</span> دعوة أولياء الأمور للتواصل
              </button>
            )}
            {!isParent && (
              <button onClick={() => { setEditing(null); setMode("build"); }}
                className="bg-white text-purple-700 px-5 py-2 rounded-xl font-black text-sm hover:bg-purple-50 shadow">
                ➕ استبيان جديد
              </button>
            )}
          </div>
        </div>
      </div>

      {/* إشعار لولي الأمر عند وجود استبيانات نشطة */}
      {isParent && newSurveyCount > 0 && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 mb-4 flex items-start gap-3 shadow-sm">
          <span className="text-2xl flex-shrink-0">🔔</span>
          <div>
            <div className="font-black text-amber-800 text-sm">يوجد {newSurveyCount} استبيان بانتظار مشاركتك!</div>
            <div className="text-amber-600 text-xs mt-0.5">رأيك يهمنا — شاركنا في تطوير بيئة أبنائنا التعليمية</div>
          </div>
        </div>
      )}

      {/* فلتر */}
      {!isParent && (
        <div className="flex gap-2 mb-4 flex-wrap">
          {["all", ...SURVEY_TARGETS].map(t => (
            <button key={t} onClick={() => setFilterTarget(t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all ${filterTarget === t ? "bg-purple-600 text-white border-purple-600" : "bg-white text-gray-500 border-gray-200"}`}>
              {t === "all" ? "الكل" : t}
            </button>
          ))}
        </div>
      )}

      {/* قائمة الاستبيانات */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border-2 border-dashed border-purple-100">
          <div className="text-5xl mb-3">📋</div>
          <div className="font-bold text-gray-400 mb-3">لا توجد استبيانات {isParent ? "متاحة" : "بعد"}</div>
          {!isParent && (
            <button onClick={() => setMode("build")} className="bg-purple-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-purple-700">
              ➕ إنشاء أول استبيان
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map(s => {
            const theme = SURVEY_THEMES[s.theme ?? 0];
            const link = getSurveyLink(s);
            return (
              <div key={s.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all">
                <div className="px-5 py-4 text-white" style={{ background: `linear-gradient(135deg, ${theme.header}, ${theme.accent})` }}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h3 className="font-black text-base leading-tight">{s.title || "استبيان بدون عنوان"}</h3>
                      {s.description && <p className="opacity-80 text-xs mt-1 line-clamp-2">{s.description}</p>}
                    </div>
                    {!s.active && <span className="bg-white bg-opacity-20 text-white text-xs px-2 py-0.5 rounded-full font-bold flex-shrink-0">متوقف</span>}
                  </div>
                  <div className="flex gap-3 mt-3 text-xs opacity-80">
                    <span>👥 {s.target}</span>
                    <span>❓ {s.fields.length} سؤال</span>
                    <span>📅 {s.createdAt}</span>
                  </div>
                </div>

                {/* رابط الاستبيان — للإدارة فقط */}
                {!isParent && (
                  <div className="px-4 pt-3 pb-1">
                    <div className="flex items-center gap-1.5 bg-gray-50 rounded-xl px-3 py-2 border border-gray-200">
                      <span className="text-xs text-gray-400 flex-1 truncate" dir="ltr">{link}</span>
                      <button onClick={() => copyLink(s)}
                        className={`flex-shrink-0 px-2.5 py-1 rounded-lg text-xs font-black transition-all ${copiedId === s.id ? "bg-green-500 text-white" : "bg-gray-200 text-gray-600 hover:bg-gray-300"}`}>
                        {copiedId === s.id ? "✓ تم" : "📋 نسخ"}
                      </button>
                    </div>
                  </div>
                )}

                <div className="px-4 py-3 flex gap-2 flex-wrap">
                  <button onClick={() => { setResponding(s); setMode("respond"); }}
                    className="flex-1 py-2 rounded-xl text-white text-xs font-black hover:opacity-90 transition-all"
                    style={{ background: theme.accent }}>
                    📝 {isParent ? "ملء الاستبيان" : "معاينة"}
                  </button>
                  {!isParent && (
                    <>
                      {/* زر مشاركة واتساب */}
                      <button onClick={() => shareWhatsApp(s)}
                        className="px-3 py-2 rounded-xl bg-green-50 text-green-700 text-xs font-black hover:bg-green-100 flex items-center gap-1">
                        <span>📲</span> واتساب
                      </button>
                      <button onClick={() => { setEditing(s); setMode("build"); }}
                        className="px-3 py-2 rounded-xl bg-gray-100 text-gray-600 text-xs font-bold hover:bg-gray-200">✏️ تعديل</button>
                      <button onClick={() => toggleActive(s.id)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold ${s.active ? "bg-amber-50 text-amber-700 hover:bg-amber-100" : "bg-green-50 text-green-700 hover:bg-green-100"}`}>
                        {s.active ? "⏸ إيقاف" : "▶ تفعيل"}
                      </button>
                      <button onClick={() => deleteSurvey(s.id)} className="px-3 py-2 rounded-xl bg-red-50 text-red-500 text-xs font-bold hover:bg-red-100">🗑️</button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
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

// ==================== SMS PAGE ====================
function SMSPage({ teachers, attendance, week }) {
  const [tab, setTab] = useState("manual");
  const [username, setUsername] = useState("966548454776");
  const [password, setPassword] = useState("");
  const [sender, setSender] = useState("School1");
  const [showConfig, setShowConfig] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  // Tab 1: Manual
  const [manualNums, setManualNums] = useState("");
  const [manualMsg, setManualMsg] = useState("");

  // Tab 2: Attendance notify
  const [selectedDay, setSelectedDay] = useState(0);
  const [supervisorNum, setSupervisorNum] = useState("");
  const [absentMsg, setAbsentMsg] = useState("");

  // Tab 3: Bulk class
  const [bulkNums, setBulkNums] = useState("");
  const [bulkMsg, setBulkMsg] = useState("");

  // Build attendance message for tab2
  useEffect(() => {
    const di = selectedDay;
    const dayLabel = week?.[di]?.day || `اليوم ${di + 1}`;
    const dateLabel = week?.[di]?.dateH || "";
    const absents = teachers.filter((t, ti) => (attendance?.[ti]?.[di]?.status || "حاضر") === "غائب")
      .map((t, i) => `${i + 1}. ${t}`);
    const lates = teachers.filter((t, ti) => (attendance?.[ti]?.[di]?.status || "حاضر") === "متأخر")
      .map((t, i) => {
        const r = attendance?.[teachers.indexOf(t)]?.[di] || {};
        return `${i + 1}. ${t} (${r.lateType || "صباحي"} - ${r.lateMinutes || 0} دقيقة)`;
      });
    let msg = `📋 تقرير حضور ${dayLabel} ${dateLabel}\n`;
    msg += `مدرسة عبيدة بن الحارث المتوسطة\n\n`;
    if (absents.length) msg += `❌ الغائبون (${absents.length}):\n${absents.join("\n")}\n\n`;
    if (lates.length) msg += `🕐 المتأخرون (${lates.length}):\n${lates.join("\n")}\n`;
    if (!absents.length && !lates.length) msg += `✅ جميع المعلمين حاضرون`;
    setAbsentMsg(msg);
  }, [selectedDay, teachers, attendance, week]);

  const sendSMS = async (numbers, message) => {
    if (!password) { setResult({ ok: false, msg: "أدخل كلمة المرور أولاً في الإعدادات ↑" }); return; }
    if (!numbers.trim()) { setResult({ ok: false, msg: "أدخل رقماً واحداً على الأقل" }); return; }
    if (!message.trim()) { setResult({ ok: false, msg: "اكتب نص الرسالة" }); return; }

    setSending(true);
    setResult(null);
    try {
      const resp = await fetch("/api/sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, numbers: numbers.replace(/\s/g, ""), message, sender })
      });
      const data = await resp.json();
      if (data.success || data.code === "0" || data.status === "success" || resp.ok) {
        setResult({ ok: true, msg: `✅ تم الإرسال بنجاح! (${numbers.split(",").filter(Boolean).length} رسالة)` });
      } else {
        setResult({ ok: false, msg: `❌ فشل: ${data.message || data.error || JSON.stringify(data)}` });
      }
    } catch (e) {
      setResult({ ok: false, msg: `❌ خطأ في الاتصال: ${e.message}` });
    }
    setSending(false);
  };

  const TABS = [
    { id: "manual", label: "رسالة يدوية", icon: "✍️" },
    { id: "attendance", label: "إشعار الغياب", icon: "📋" },
    { id: "bulk", label: "رسالة للأهالي", icon: "👨‍👦" },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-gradient-to-l from-green-600 to-teal-700 rounded-2xl p-5 text-white flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-black">📱 مركز الرسائل النصية SMS</h2>
          <p className="text-sm opacity-75 mt-1">إرسال مباشر عبر المدار التقني — mobile.net.sa</p>
        </div>
        <button onClick={() => setShowConfig(!showConfig)}
          className="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-xl text-sm font-bold border border-white border-opacity-30">
          ⚙️ إعدادات الحساب
        </button>
      </div>

      {/* Config panel */}
      {showConfig && (
        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
          <h3 className="font-black text-gray-800 mb-4">⚙️ إعدادات حساب المدار التقني</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1 block">اسم المستخدم</label>
              <input value={username} onChange={e => setUsername(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" placeholder="966XXXXXXXXX" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1 block">كلمة المرور</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" placeholder="••••••••" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1 block">اسم المرسل (Sender)</label>
              <input value={sender} onChange={e => setSender(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" placeholder="School1" />
            </div>
          </div>
          <p className="text-xs text-amber-600 mt-3 bg-amber-50 rounded-xl px-3 py-2">
            ⚠️ كلمة المرور تُحفظ مؤقتاً في الجلسة فقط ولا تُرسَل إلا عند إرسال رسالة
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 bg-gray-100 p-1 rounded-2xl">
        {TABS.map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setResult(null); }}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${tab === t.id ? "bg-white shadow text-teal-700" : "text-gray-500 hover:text-gray-700"}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Result banner */}
      {result && (
        <div className={`rounded-2xl px-5 py-3 text-sm font-bold ${result.ok ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {result.msg}
        </div>
      )}

      {/* ===== TAB 1: MANUAL ===== */}
      {tab === "manual" && (
        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm space-y-4">
          <h3 className="font-black text-gray-800">✍️ رسالة يدوية</h3>
          <div>
            <label className="text-xs font-bold text-gray-500 mb-1 block">أرقام الهاتف (افصل بفاصلة — مثال: 0512345678,0598765432)</label>
            <textarea value={manualNums} onChange={e => setManualNums(e.target.value)}
              rows={2} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none"
              placeholder="0512345678,0598765432,0566778899" dir="ltr" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 mb-1 block">
              نص الرسالة
              <span className="mr-2 text-gray-400">({manualMsg.length} حرف)</span>
            </label>
            <textarea value={manualMsg} onChange={e => setManualMsg(e.target.value)}
              rows={4} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none"
              placeholder="اكتب نص رسالتك هنا..." />
          </div>
          <div className="flex gap-3">
            <button onClick={() => sendSMS(manualNums, manualMsg)} disabled={sending}
              className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl text-sm flex items-center gap-2">
              {sending ? "⏳ جاري الإرسال..." : "📤 إرسال الآن"}
            </button>
            <button onClick={() => { setManualNums(""); setManualMsg(""); }}
              className="border border-gray-200 text-gray-500 font-bold px-4 py-2.5 rounded-xl text-sm">
              مسح
            </button>
          </div>
        </div>
      )}

      {/* ===== TAB 2: ATTENDANCE NOTIFY ===== */}
      {tab === "attendance" && (
        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm space-y-4">
          <h3 className="font-black text-gray-800">📋 إشعار غياب المعلمين</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1 block">اختر اليوم</label>
              <select value={selectedDay} onChange={e => setSelectedDay(Number(e.target.value))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white">
                {(week || []).map((d, i) => (
                  <option key={i} value={i}>{d.day} — {d.dateH}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1 block">رقم المشرف / الموجه (للإشعار)</label>
              <input value={supervisorNum} onChange={e => setSupervisorNum(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" placeholder="05XXXXXXXX" dir="ltr" />
            </div>
          </div>

          {/* Stats for selected day */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "حاضر", count: teachers.filter((_, ti) => (attendance?.[ti]?.[selectedDay]?.status || "حاضر") === "حاضر").length, color: "green" },
              { label: "متأخر", count: teachers.filter((_, ti) => (attendance?.[ti]?.[selectedDay]?.status || "حاضر") === "متأخر").length, color: "amber" },
              { label: "غائب", count: teachers.filter((_, ti) => (attendance?.[ti]?.[selectedDay]?.status || "حاضر") === "غائب").length, color: "red" },
            ].map(s => (
              <div key={s.label} className={`bg-${s.color}-50 border border-${s.color}-200 rounded-xl p-3 text-center`}>
                <div className={`text-2xl font-black text-${s.color}-600`}>{s.count}</div>
                <div className={`text-xs font-bold text-${s.color}-500`}>{s.label}</div>
              </div>
            ))}
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 mb-1 block">نص الرسالة (مُولَّد تلقائياً — يمكنك التعديل)</label>
            <textarea value={absentMsg} onChange={e => setAbsentMsg(e.target.value)}
              rows={8} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-mono resize-none" />
          </div>
          <button onClick={() => sendSMS(supervisorNum, absentMsg)} disabled={sending}
            className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl text-sm flex items-center gap-2">
            {sending ? "⏳ جاري الإرسال..." : "📤 أرسل للمشرف"}
          </button>
        </div>
      )}

      {/* ===== TAB 3: BULK CLASS ===== */}
      {tab === "bulk" && (
        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm space-y-4">
          <h3 className="font-black text-gray-800">👨‍👦 رسالة جماعية لأولياء الأمور</h3>
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-700">
            💡 أدخل أرقام أولياء الأمور مفصولة بفاصلة. يمكنك تجميعهم حسب الفصل يدوياً.
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 mb-1 block">
              أرقام أولياء الأمور
              <span className="mr-2 text-gray-400 font-normal">({bulkNums.split(",").filter(n => n.trim().length > 5).length} رقم)</span>
            </label>
            <textarea value={bulkNums} onChange={e => setBulkNums(e.target.value)}
              rows={3} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none"
              placeholder="0512345678,0598765432,0566778899,0544332211" dir="ltr" />
          </div>

          {/* Quick message templates */}
          <div>
            <label className="text-xs font-bold text-gray-500 mb-2 block">قوالب جاهزة</label>
            <div className="flex gap-2 flex-wrap">
              {[
                { label: "دعوة اجتماع", msg: "أولياء الأمور الكرام\nيُعقد اجتماعاً بالمدرسة يوم ............\nالرجاء الحضور في الموعد المحدد\nمدرسة عبيدة بن الحارث المتوسطة" },
                { label: "موعد الاختبارات", msg: "أولياء الأمور الكرام\nتبدأ الاختبارات يوم ............\nنتمنى لأبنائكم التوفيق\nمدرسة عبيدة بن الحارث المتوسطة" },
                { label: "إجازة عارضة", msg: "أولياء الأمور الكرام\nتُعلم المدرسة بعدم الدراسة يوم ............\nمع التقدير\nمدرسة عبيدة بن الحارث المتوسطة" },
                { label: "نشاط مدرسي", msg: "أولياء الأمور الكرام\nتقيم المدرسة نشاطاً بتاريخ ............\nنتشرف بحضوركم\nمدرسة عبيدة بن الحارث المتوسطة" },
              ].map(t => (
                <button key={t.label} onClick={() => setBulkMsg(t.msg)}
                  className="bg-gray-100 hover:bg-teal-50 hover:text-teal-700 text-gray-600 text-xs font-bold px-3 py-1.5 rounded-lg border border-gray-200 transition-all">
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 mb-1 block">
              نص الرسالة
              <span className="mr-2 text-gray-400 font-normal">({bulkMsg.length} حرف)</span>
            </label>
            <textarea value={bulkMsg} onChange={e => setBulkMsg(e.target.value)}
              rows={5} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none"
              placeholder="اكتب رسالتك لأولياء الأمور..." />
          </div>
          <div className="flex gap-3 items-center">
            <button onClick={() => sendSMS(bulkNums, bulkMsg)} disabled={sending}
              className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl text-sm flex items-center gap-2">
              {sending ? "⏳ جاري الإرسال..." : `📤 إرسال لـ ${bulkNums.split(",").filter(n => n.trim().length > 5).length} رقم`}
            </button>
            <button onClick={() => { setBulkNums(""); setBulkMsg(""); }}
              className="border border-gray-200 text-gray-500 font-bold px-4 py-2.5 rounded-xl text-sm">
              مسح
            </button>
          </div>
        </div>
      )}

      {/* Footer note */}
      <div className="bg-gray-50 rounded-2xl px-5 py-4 border border-gray-200">
        <p className="text-xs text-gray-500 font-bold mb-1">📌 ملاحظات مهمة:</p>
        <ul className="text-xs text-gray-400 space-y-1 list-disc list-inside">
          <li>الأرقام يجب أن تكون سعودية: 05XXXXXXXX أو 9665XXXXXXXX</li>
          <li>كل رسالة SMS تستهلك رصيداً من حسابك في المدار التقني</li>
          <li>الرسائل العربية: 70 حرف = رسالة واحدة — ما فوق ذلك = رسالتان</li>
          <li>يمكن إرسال لأكثر من 500 رقم في طلب واحد (مفصولة بفاصلة)</li>
        </ul>
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
      <TeacherAccountsSection />
    </div>
  );
}

// ===== إدارة حسابات المعلمين =====
function TeacherAccountsSection() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newId, setNewId] = useState("");
  const [saved, setSaved] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    DB.get("school-teacher-accounts", []).then(data => {
      setAccounts(Array.isArray(data) ? data : []);
      setLoading(false);
    });
  }, []);

  const save = async (list) => {
    setAccounts(list);
    await DB.set("school-teacher-accounts", list);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const addOne = () => {
    if (!newName.trim() || !newId.trim()) return;
    if (accounts.find(a => a.id === newId.trim())) { alert("هذه الهوية موجودة بالفعل"); return; }
    save([...accounts, { name: newName.trim(), id: newId.trim() }]);
    setNewName(""); setNewId("");
  };

  const removeOne = (id) => {
    if (!confirm("حذف هذا المعلم من بوابة المعلمين؟")) return;
    save(accounts.filter(a => a.id !== id));
  };

  const handleExcel = async (file) => {
    if (!window.XLSX) {
      await new Promise((res, rej) => {
        const s = document.createElement("script");
        s.src = "https://unpkg.com/xlsx/dist/xlsx.full.min.js";
        s.onload = res; s.onerror = rej;
        document.head.appendChild(s);
      });
    }
    const buf = await file.arrayBuffer();
    const wb = window.XLSX.read(buf);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const data = window.XLSX.utils.sheet_to_json(ws, { header: 1 });
    const hdrs = data[0]?.map(h => String(h || "").trim()) || [];
    const nameIdx = hdrs.findIndex(h => h.includes("اسم") || h.toLowerCase().includes("name"));
    const idIdx = hdrs.findIndex(h => h.includes("هوية") || h.includes("هوي") || h.includes("رقم") || h.toLowerCase().includes("id"));
    if (nameIdx < 0 || idIdx < 0) { alert("لم يتم العثور على أعمدة الاسم والهوية. تأكد أن الملف يحتوي على عمودي: الاسم ورقم الهوية"); return; }
    const imported = data.slice(1)
      .filter(r => r[nameIdx] && r[idIdx])
      .map(r => ({ name: String(r[nameIdx]).trim(), id: String(r[idIdx]).trim() }));
    const merged = [...accounts];
    let added = 0;
    imported.forEach(t => {
      if (!merged.find(a => a.id === t.id)) { merged.push(t); added++; }
    });
    save(merged);
    alert(`✅ تم إضافة ${added} معلم جديد. الإجمالي: ${merged.length}`);
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-blue-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-800">👨‍🏫 حسابات المعلمين — بوابة المعلم</h3>
        {saved && <span className="text-xs text-green-600 font-bold bg-green-50 px-3 py-1 rounded-full">✅ تم الحفظ</span>}
      </div>
      <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-700 font-medium mb-4">
        💡 كل معلم يدخل بوابة المعلم برقم هويته كـ"كلمة مرور" — يمكنه فقط إدخال مستويات الطلاب
      </div>

      {/* إضافة يدوية */}
      <div className="flex gap-2 mb-3">
        <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="اسم المعلم"
          className="flex-1 px-3 py-2 rounded-xl border-2 border-gray-200 text-sm focus:border-blue-400 focus:outline-none" />
        <input value={newId} onChange={e => setNewId(e.target.value)} placeholder="رقم الهوية"
          className="w-32 px-3 py-2 rounded-xl border-2 border-gray-200 text-sm text-center focus:border-blue-400 focus:outline-none" />
        <button onClick={addOne} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-700">إضافة</button>
      </div>

      {/* استيراد إكسل */}
      <div className="mb-4">
        <button onClick={() => fileRef.current?.click()}
          className="w-full py-2.5 rounded-xl border-2 border-dashed border-green-300 text-green-700 text-sm font-bold hover:border-green-500 hover:bg-green-50 transition-all">
          📊 استيراد من إكسل (اسم + هوية)
        </button>
        <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleExcel(f); e.target.value = ""; }} />
      </div>

      {/* قائمة المعلمين */}
      {loading ? <div className="text-center text-gray-400 py-4">جاري التحميل…</div> : (
        accounts.length === 0 ? (
          <div className="text-center text-gray-400 py-6 text-sm">لا يوجد معلمون مسجلون بعد</div>
        ) : (
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {accounts.map((a, i) => (
              <div key={i} className="flex items-center justify-between bg-gray-50 hover:bg-blue-50 rounded-xl px-3 py-2.5 transition-all">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-black flex items-center justify-center">{i + 1}</div>
                  <span className="font-medium text-sm text-gray-800">{a.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-lg font-mono">{a.id}</span>
                  <button onClick={() => removeOne(a.id)} className="text-red-400 hover:text-red-600 text-sm px-1">🗑️</button>
                </div>
              </div>
            ))}
          </div>
        )
      )}
      <div className="mt-3 text-xs text-gray-400 text-center">{accounts.length} معلم مسجل</div>
    </div>
  );
}

export default function SchoolWebsite() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [parentPortal, setParentPortal] = useState(false);
  const [teacherPortal, setTeacherPortal] = useState(false);
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
  const [messages, setMessages] = useState([]);
  const [surveys, setSurveys] = useState([]);

  useEffect(() => {
    const h = () => {
      const hash = window.location.hash.replace("#","") || "home";
      if (["home","attendance","announcements","activities","settings","students","messages","surveys","sms"].includes(hash)) setPage(hash);
    };
    window.addEventListener("hashchange", h); h();
    return () => window.removeEventListener("hashchange", h);
  }, []);

  const navigate = (p) => { setPage(p); window.location.hash = p; setMenuOpen(false); };

  useEffect(() => {
    (async () => {
      try {
        const [t, w, att, ann, act, font, clsListMeta, msgs, survs] = await Promise.all([
          DB.get("school-teachers", DEFAULT_TEACHERS),
          DB.get("school-week", DEFAULT_WEEK),
          DB.get("school-attendance", {}),
          DB.get("school-announcements", DEFAULT_ANNOUNCEMENTS),
          DB.get("school-activities", DEFAULT_ACTIVITIES),
          DB.get("school-font", "'Noto Naskh Arabic', serif"),
          DB.get("school-class-list", []),
          DB.get("school-messages", []),
          DB.get("school-surveys", []),
        ]);
        setTeachers(t); setWeek(w); setAttendance(att); setAnnouncements(ann);
        setActivities(act); setSiteFont(font);
        setMessages(Array.isArray(msgs) ? msgs : []);
        setSurveys(Array.isArray(survs) ? survs : []);
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
  const saveMessages = (v) => DB.set("school-messages", v);
  const saveSurveys = (v) => DB.set("school-surveys", v);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #f0fdfa 0%, #ecfdf5 50%, #f5f5f4 100%)" }}>
      <div className="text-center">
        <div className="text-6xl mb-4 animate-bounce">🏫</div>
        <h2 className="text-xl font-black text-teal-800 mb-2">مدرسة عبيدة بن الحارث المتوسطة</h2>
        <p className="text-gray-400 text-sm">جاري تحميل البيانات…</p>
      </div>
    </div>
  );

  if (!user && teacherPortal) return <TeacherPortal classList={classList} setClassList={setClassList} saveClass={saveClass} siteFont={siteFont} onBack={() => setTeacherPortal(false)} />;
  if (!user && parentPortal) return <ParentPortal classList={classList} messages={messages} setMessages={setMessages} saveMessages={saveMessages} surveys={surveys} setSurveys={setSurveys} saveSurveys={saveSurveys} siteFont={siteFont} onBack={() => setParentPortal(false)} />;
  if (!user) return <LoginPage users={users} onLogin={setUser} siteFont={siteFont} onParentPortal={() => setParentPortal(true)} onTeacherPortal={() => setTeacherPortal(true)} />;

  const pages = [
    { id: "home",          label: "الرئيسية",        icon: "🏠" },
    { id: "attendance",    label: "غياب المعلمين",   icon: "📋" },
    { id: "students",      label: "تقييم الطلاب",   icon: "👨‍🎓" },
    { id: "announcements", label: "الإعلانات",       icon: "📢" },
    { id: "activities",    label: "الأنشطة",         icon: "⚡" },
    { id: "messages",      label: "رسائل الأهالي",  icon: "✉️" },
    { id: "surveys",       label: "الاستبيانات",     icon: "📊" },
    { id: "sms",           label: "رسائل SMS",       icon: "📱" },
    { id: "settings",      label: "الإعدادات",       icon: "⚙️" },
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
        {page === "attendance"    && <AttendancePage teachers={teachers} setTeachers={setTeachers} saveTeachers={saveTeachers} week={week} attendance={attendance} setAttendance={setAttendance} saveAttendance={saveAttendance} />}
        {page === "students"      && <StudentsPage classList={classList} setClassList={setClassList} saveClass={saveClass} deleteClass={deleteClass} />}
        {page === "announcements" && <AnnouncementsPage announcements={announcements} setAnnouncements={setAnnouncements} saveAnnouncements={saveAnnouncements} />}
        {page === "activities"    && <ActivitiesPage activities={activities} />}
        {page === "messages"      && <MessagesPage messages={messages} setMessages={setMessages} saveMessages={saveMessages} isParent={false} />}
        {page === "surveys"       && <SurveysPage surveys={surveys} setSurveys={setSurveys} saveSurveys={saveSurveys} isParent={false} />}
        {page === "sms"          && <SMSPage teachers={teachers} attendance={attendance} week={week} />}
        {page === "settings"      && <SettingsPage teachers={teachers} setTeachers={setTeachers} saveTeachers={saveTeachers} week={week} setWeek={setWeek} saveWeek={saveWeek} users={users} siteFont={siteFont} setSiteFont={setSiteFont} saveSiteFont={saveSiteFont} />}
      </main>
      <footer className="text-center py-6 text-xs text-gray-400 border-t border-gray-200 bg-white mt-8">
        <p>مدرسة عبيدة بن الحارث المتوسطة — بوابة الإدارة المدرسية الإلكترونية © ١٤٤٧ هـ</p>
      </footer>
    </div>
  );
}
