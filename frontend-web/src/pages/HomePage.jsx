import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronLeft, ChevronRight, Sun, Moon, Check } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export default function HomePage() {
  const { isDark, toggleTheme } = useTheme();
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState("vi");
  const tickerRef = useRef(null);

  const languages = [
    { code: "vi", label: "Tiếng Việt", flag: "/assets/flags/vn.svg" },
    { code: "en", label: "English", flag: "/assets/flags/uk.svg" },
  ];

  const features = [
    { icon: "/assets/flags/us.svg", label: "Tiếng Anh Giao Tiếp" },
    { icon: "/assets/icons/check.svg", label: "Luyện Thi THPT & TOEIC" },
    { icon: "/assets/topics/technology-it.svg", label: "AI Chấm Điểm Phát Âm" },
    { icon: "/assets/topics/food-drink.svg", label: "36 Chủ Đề Flashcard" },
    { icon: "/assets/topics/education-science.svg", label: "Tra Từ Điển Anh - Việt" },
    { icon: "/assets/icons/trophy.svg", label: "Đua Top Bảng Vàng" },
    { icon: "/assets/icons/mascot.svg", label: "Lộ Trình Từng Bước" },
    { icon: "/assets/icons/streak-fire.svg", label: "Duy Trì Chuỗi Streak" },
  ];

  const scrollTicker = (direction) => {
    if (tickerRef.current) {
      const scrollAmount = direction === "left" ? -280 : 280;
      tickerRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-[#ede8dc] dark:bg-[#16171d] text-gray-900 dark:text-gray-100 flex flex-col justify-between transition-colors duration-200 select-none overflow-x-hidden">
      {/* 1. TOP HEADER */}
      <header className="w-full border-b-2 border-[#d5cdbd] dark:border-gray-800 bg-[#f4efe4]/80 dark:bg-[#16171d]/80 backdrop-blur-md sticky top-0 z-40 transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo Brand: anhlingo */}
          <Link to="/" className="flex items-center gap-2.5 group cursor-pointer">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-b from-[#58cc02] to-[#46a302] p-1 flex items-center justify-center shadow-md shadow-[#58cc02]/25 border-b-3 border-[#3b8702] group-hover:scale-105 transition-transform shrink-0">
              <svg viewBox="0 0 36 36" fill="none" className="w-full h-full drop-shadow-xs">
                <rect x="3" y="4" width="30" height="28" rx="14" fill="#58cc02" />
                <ellipse cx="18" cy="24" rx="9" ry="7" fill="#6fe318" />
                <circle cx="12" cy="14" r="5.5" fill="white" />
                <circle cx="24" cy="14" r="5.5" fill="white" />
                <circle cx="13" cy="14" r="3" fill="#0f172a" />
                <circle cx="25" cy="14" r="3" fill="#0f172a" />
                <circle cx="14" cy="13" r="1.2" fill="white" />
                <circle cx="26" cy="13" r="1.2" fill="white" />
                <polygon points="18,17 15,22 21,22" fill="#ff9600" />
              </svg>
            </div>
            <div className="flex items-baseline tracking-tight">
              <span className="text-[24px] font-black text-[#58cc02] lowercase leading-none">anh</span>
              <span className="text-[24px] font-black text-gray-900 dark:text-white lowercase leading-none">lingo</span>
              <span className="w-2 h-2 rounded-full bg-[#58cc02] ml-0.5 inline-block" />
            </div>
          </Link>

          {/* Right Controls: Language Selector + Theme Toggle */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Language Selector Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-[13px] uppercase tracking-wider text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-[#e4ded0] dark:hover:bg-gray-800 transition-all cursor-pointer"
              >
                <span className="hidden sm:inline text-gray-500 dark:text-gray-400 font-semibold">
                  Ngôn ngữ hiển thị:
                </span>
                <span className="font-extrabold text-[#58cc02]">
                  {selectedLang === "vi" ? "Tiếng Việt" : "English"}
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${langDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {langDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setLangDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-[#f4efe4] dark:bg-gray-800 border-2 border-[#d5cdbd] dark:border-gray-700 shadow-xl py-2 z-20 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Chọn ngôn ngữ
                    </div>
                    {languages.map((l) => (
                      <button
                        key={l.code}
                        type="button"
                        onClick={() => {
                          setSelectedLang(l.code);
                          setLangDropdownOpen(false);
                        }}
                        className="w-full flex items-center justify-between px-3.5 py-2 text-sm font-bold text-gray-800 dark:text-gray-200 hover:bg-[#e4ded0] dark:hover:bg-gray-700/70 transition-colors cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <img src={l.flag} alt={l.label} className="w-5 h-3.5 object-cover rounded shadow-2xs" />
                          <span>{l.label}</span>
                        </span>
                        {selectedLang === l.code && (
                          <Check className="w-4 h-4 text-[#58cc02] stroke-[3]" />
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              title={isDark ? "Chuyển sang chế độ Sáng" : "Chuyển sang chế độ Tối"}
              className="w-9 h-9 rounded-xl flex items-center justify-center border-2 border-[#d5cdbd] dark:border-gray-700 hover:border-[#b8af9c] dark:hover:border-gray-600 bg-[#f4efe4] dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white transition-all cursor-pointer shadow-xs"
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400 hover:rotate-45 transition-transform" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-600 hover:-rotate-12 transition-transform" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* 2. MAIN HERO SECTION */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 md:py-16 flex flex-col lg:flex-row items-center justify-center gap-10 lg:gap-16">
        {/* Left: Duolingo-style Rich 3D Mascot Illustration */}
        <div className="w-full max-w-[420px] lg:max-w-[460px] flex items-center justify-center relative">
          {/* Ambient Glow */}
          <div className="absolute inset-0 bg-gradient-to-tr from-[#58cc02]/20 via-[#1cb0f6]/15 to-[#ff9600]/15 rounded-full blur-3xl -z-10" />

          <svg
            viewBox="0 0 500 480"
            className="w-full h-auto drop-shadow-xl select-none"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Owl Gradients */}
              <linearGradient id="owlBody" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6ee800" />
                <stop offset="100%" stopColor="#48a902" />
              </linearGradient>
              <linearGradient id="bellyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8efc24" />
                <stop offset="100%" stopColor="#5ed402" />
              </linearGradient>
              <linearGradient id="phoneGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#1e293b" />
                <stop offset="100%" stopColor="#0f172a" />
              </linearGradient>
              <linearGradient id="goldCoin" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#ffd900" />
                <stop offset="100%" stopColor="#ff9600" />
              </linearGradient>
              <linearGradient id="blueCard" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#0284c7" />
              </linearGradient>
              <filter id="softShadow" x="-10%" y="-10%" width="120%" height="120%">
                <feDropShadow dx="0" dy="8" stdDeviation="10" floodOpacity="0.18" />
              </filter>
            </defs>

            {/* Floating Orbit: Background Rings */}
            <circle cx="250" cy="240" r="200" stroke="#58cc02" strokeWidth="2" strokeDasharray="6 8" opacity="0.25" />
            <circle cx="250" cy="240" r="160" stroke="#1cb0f6" strokeWidth="2" strokeDasharray="4 6" opacity="0.2" />

            {/* Floating Item 1: Flashcard (Top Left) */}
            <g transform="translate(60, 90) rotate(-14)" className="animate-bounce" style={{ animationDuration: '4s' }}>
              <rect width="75" height="95" rx="14" fill="url(#blueCard)" filter="url(#softShadow)" />
              <rect x="4" y="4" width="67" height="87" rx="11" fill="white" fillOpacity="0.15" />
              <text x="37" y="45" fill="white" fontSize="24" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">A+</text>
              <text x="37" y="68" fill="white" fontSize="11" fontWeight="800" textAnchor="middle" opacity="0.9">VOCAB</text>
            </g>

            {/* Floating Item 2: Speech Bubble "Hello!" (Top Right) */}
            <g transform="translate(340, 70) rotate(8)" className="animate-bounce" style={{ animationDuration: '3.6s', animationDelay: '0.4s' }}>
              <rect width="95" height="52" rx="18" fill="#ff9600" filter="url(#softShadow)" />
              <polygon points="25,52 35,52 20,62" fill="#ff9600" />
              <text x="47" y="32" fill="white" fontSize="16" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">Hello! 👋</text>
            </g>

            {/* Floating Item 3: Streak Flame (Bottom Left) */}
            <g transform="translate(50, 310) rotate(10)" className="animate-pulse" style={{ animationDuration: '2.5s' }}>
              <circle cx="35" cy="35" r="32" fill="#ff4b4b" fillOpacity="0.15" />
              <circle cx="35" cy="35" r="26" fill="#ff9600" filter="url(#softShadow)" />
              {/* Flame path */}
              <path d="M35 18 C37 24 43 28 43 36 C43 42 39 46 34 46 C28 46 25 41 25 36 C25 30 30 25 35 18 Z" fill="#ffd900" />
              <path d="M34 28 C36 32 39 34 39 39 C39 42 37 44 34 44 C31 44 29 41 29 39 C29 35 32 32 34 28 Z" fill="#ffffff" />
            </g>

            {/* Floating Item 4: Lingot / Gold Gem (Bottom Right) */}
            <g transform="translate(365, 300) rotate(-12)" className="animate-bounce" style={{ animationDuration: '3.8s', animationDelay: '0.8s' }}>
              <rect width="64" height="64" rx="20" fill="url(#goldCoin)" filter="url(#softShadow)" />
              <polygon points="32,15 48,27 48,45 32,53 16,45 16,27" fill="#ffffff" fillOpacity="0.3" />
              <polygon points="32,20 44,29 44,43 32,49 20,43 20,29" fill="#ffea79" />
              <polygon points="32,24 40,31 32,45 24,31" fill="#ffffff" />
            </g>

            {/* Floating Item 5: AI Mic Badge (Top Center) */}
            <g transform="translate(215, 30)">
              <rect width="70" height="34" rx="17" fill="#8b5cf6" filter="url(#softShadow)" />
              <text x="35" y="22" fill="white" fontSize="13" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">🎙️ AI 100%</text>
            </g>

            {/* BASE PLATFORM / SHADOW */}
            <ellipse cx="250" cy="425" rx="140" ry="24" fill="#000000" fillOpacity="0.12" />

            {/* CENTER MASCOT: THE 3D ANHLINGO OWL */}
            <g id="anhlingo-owl" transform="translate(145, 140)">
              {/* Owl Feet */}
              <ellipse cx="65" cy="245" rx="18" ry="10" fill="#e07700" />
              <ellipse cx="65" cy="242" rx="16" ry="8" fill="#ff9600" />
              <ellipse cx="145" cy="245" rx="18" ry="10" fill="#e07700" />
              <ellipse cx="145" cy="242" rx="16" ry="8" fill="#ff9600" />

              {/* Owl Main Body */}
              <rect x="20" y="20" width="170" height="210" rx="85" fill="url(#owlBody)" filter="url(#softShadow)" />
              {/* Body 3D bottom shade */}
              <path d="M 20 140 C 20 200, 70 230, 105 230 C 140 230, 190 200, 190 140 C 190 206, 140 234, 105 234 C 70 234, 20 206, 20 140 Z" fill="#3b8702" opacity="0.6" />

              {/* Owl Belly */}
              <ellipse cx="105" cy="155" rx="60" ry="56" fill="url(#bellyGrad)" />
              {/* Belly Feather Marks */}
              <path d="M 90 140 Q 105 148 120 140" stroke="#48a902" strokeWidth="4" strokeLinecap="round" fill="none" />
              <path d="M 80 162 Q 105 172 130 162" stroke="#48a902" strokeWidth="4" strokeLinecap="round" fill="none" />
              <path d="M 92 184 Q 105 192 118 184" stroke="#48a902" strokeWidth="4" strokeLinecap="round" fill="none" />

              {/* Owl Wings */}
              {/* Left Wing waving hello */}
              <g transform="translate(-15, 75) rotate(-22)">
                <ellipse cx="15" cy="40" rx="20" ry="46" fill="#4fae02" />
                <ellipse cx="13" cy="38" rx="16" ry="42" fill="#58cc02" />
              </g>
              {/* Right Wing resting */}
              <g transform="translate(180, 85) rotate(16)">
                <ellipse cx="15" cy="40" rx="18" ry="44" fill="#4fae02" />
                <ellipse cx="14" cy="38" rx="15" ry="40" fill="#58cc02" />
              </g>

              {/* Big Duolingo-style Eyes */}
              {/* Left Eye */}
              <circle cx="70" cy="90" r="34" fill="#ffffff" filter="url(#softShadow)" />
              <circle cx="75" cy="90" r="18" fill="#1e293b" />
              <circle cx="81" cy="85" r="7" fill="#ffffff" />
              <circle cx="73" cy="95" r="3" fill="#ffffff" />

              {/* Right Eye */}
              <circle cx="140" cy="90" r="34" fill="#ffffff" filter="url(#softShadow)" />
              <circle cx="135" cy="90" r="18" fill="#1e293b" />
              <circle cx="141" cy="85" r="7" fill="#ffffff" />
              <circle cx="133" cy="95" r="3" fill="#ffffff" />

              {/* Cute Orange Beak */}
              <polygon points="105,102 91,126 119,126" fill="#e07700" />
              <polygon points="105,104 93,124 117,124" fill="#ff9600" />
              <polygon points="105,106 97,118 113,118" fill="#ffb444" />

              {/* Graduation Cap / Headphone / Crown (Graduation Cap) */}
              <g transform="translate(68, -10) rotate(-6)">
                <polygon points="36,6 74,18 36,30 -2,18" fill="#1e293b" />
                <polygon points="36,2 78,16 36,28 -6,16" fill="#0f172a" />
                <rect x="20" y="24" width="32" height="10" rx="4" fill="#1e293b" />
                {/* Gold Tassel */}
                <circle cx="36" cy="15" r="3.5" fill="#ffd900" />
                <path d="M 36 15 Q 16 22 14 36" stroke="#ffd900" strokeWidth="2.5" fill="none" />
                <rect x="11" y="36" width="6" height="12" rx="2" fill="#ff9600" />
              </g>
            </g>
          </svg>
        </div>

        {/* Right: Headline + 3D CTA Buttons */}
        <div className="flex flex-col items-center lg:items-start text-center lg:text-left max-w-lg">
          {/* Main Headline */}
          <h1 className="text-3xl sm:text-4xl lg:text-[40px] font-black text-gray-900 dark:text-white leading-[1.18] tracking-tight mb-8">
            Học tiếng Anh, luyện thi và mở rộng vốn từ theo cách vui nhất!
          </h1>

          {/* Action Buttons: 3D Duolingo Style */}
          <div className="flex flex-col gap-3.5 w-full max-w-[340px]">
            {/* Primary CTA: BẮT ĐẦU */}
            <Link
              to="/register"
              className="w-full py-3.5 px-6 rounded-2xl bg-[#58cc02] hover:bg-[#4fb802] text-white font-black text-base uppercase tracking-wider text-center border-b-4 border-[#3b8702] active:translate-y-1 active:border-b-0 transition-all cursor-pointer shadow-sm hover:brightness-105"
            >
              Bắt đầu
            </Link>

            {/* Secondary CTA: TÔI ĐÃ CÓ TÀI KHOẢN */}
            <Link
              to="/login"
              className="w-full py-3.5 px-6 rounded-2xl bg-[#ede8dc] dark:bg-[#16171d] hover:bg-[#e4ded0] dark:hover:bg-gray-800 text-[#1cb0f6] dark:text-[#38bdf8] font-black text-base uppercase tracking-wider text-center border-2 border-[#d5cdbd] dark:border-gray-700 border-b-4 hover:border-[#c8c0ad] active:translate-y-1 active:border-b-2 transition-all cursor-pointer shadow-xs"
            >
              Tôi đã có tài khoản
            </Link>
          </div>
        </div>
      </main>

      {/* 3. BOTTOM TICKER / CAROUSEL */}
      <footer className="w-full border-t-2 border-[#d5cdbd] dark:border-gray-800 bg-[#f4efe4]/90 dark:bg-[#111827]/90 backdrop-blur-md py-3.5 px-3 transition-colors">
        <div className="max-w-6xl mx-auto flex items-center gap-2">
          {/* Left Arrow */}
          <button
            type="button"
            onClick={() => scrollTicker("left")}
            aria-label="Cuộn sang trái"
            className="p-1.5 rounded-xl text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-[#e4ded0] dark:hover:bg-gray-800 transition-colors cursor-pointer shrink-0"
          >
            <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
          </button>

          {/* Carousel Track */}
          <div
            ref={tickerRef}
            className="flex-1 flex items-center gap-6 sm:gap-8 overflow-x-auto no-scrollbar scroll-smooth py-1 px-2"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {features.map((item, idx) => (
              <div
                key={idx}
                className="group flex items-center gap-2.5 shrink-0 cursor-pointer text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors"
              >
                <img
                  src={item.icon}
                  alt={item.label}
                  className="w-5 h-5 object-contain group-hover:scale-125 transition-transform"
                />
                <span className="font-extrabold text-[13px] uppercase tracking-wider whitespace-nowrap">
                  {item.label}
                </span>
              </div>
            ))}
          </div>

          {/* Right Arrow */}
          <button
            type="button"
            onClick={() => scrollTicker("right")}
            aria-label="Cuộn sang phải"
            className="p-1.5 rounded-xl text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-[#e4ded0] dark:hover:bg-gray-800 transition-colors cursor-pointer shrink-0"
          >
            <ChevronRight className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>
      </footer>
    </div>
  );
}