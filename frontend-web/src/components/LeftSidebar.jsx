import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Compass,
  Trophy,
  Layers,
  BookOpen,
  User,
  MoreHorizontal,
  Sun,
  Moon,
  LogOut,
  Mic,
  Sparkles,
  ChevronRight,
  LayoutDashboard,
} from "lucide-react";
import { logout } from "../store/slice/authSlice";
import { useTheme } from "../context/ThemeContext";
import toast from "react-hot-toast";
import api from "../api/api";

export default function LeftSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { isDark, toggleTheme } = useTheme();

  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const moreMenuRef = useRef(null);

  // Close more menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target)) {
        setShowMoreMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setShowMoreMenu(false);
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.log("Lỗi đăng xuất: ", error);
    } finally {
      dispatch(logout());
      toast.success("Đã đăng xuất thành công");
      navigate("/login");
    }
  };

  const navItems = [
    {
      name: "Học",
      path: "/learn",
      color: "#58cc02",
      activeBg: "bg-[#58cc02]/20 dark:bg-[#58cc02]/20",
      activeBorder: "border-[#58cc02]",
      activeText: "text-[#1c7400] dark:text-[#58cc02]",
      icon: (isActive) => (
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
            isActive
              ? "bg-[#58cc02] text-white shadow-sm shadow-[#58cc02]/40"
              : "text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 group-hover:scale-110"
          }`}
        >
          <Compass className="w-5 h-5 stroke-[2.5]" />
        </div>
      ),
    },
    {
      name: "Luyện đề",
      path: "/exams",
      color: "#1cb0f6",
      activeBg: "bg-[#1cb0f6]/20 dark:bg-[#1cb0f6]/20",
      activeBorder: "border-[#1cb0f6]",
      activeText: "text-[#026aa2] dark:text-[#1cb0f6]",
      icon: (isActive) => (
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
            isActive
              ? "bg-[#1cb0f6] text-white shadow-sm shadow-[#1cb0f6]/40"
              : "text-sky-600 dark:text-sky-400 bg-sky-500/15 group-hover:scale-110"
          }`}
        >
          <Trophy className="w-5 h-5 stroke-[2.5]" />
        </div>
      ),
    },
    {
      name: "Ôn tập",
      path: "/review",
      color: "#ff9600",
      activeBg: "bg-[#ff9600]/20 dark:bg-[#ff9600]/20",
      activeBorder: "border-[#ff9600]",
      activeText: "text-[#b45309] dark:text-[#ff9600]",
      icon: (isActive) => (
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
            isActive
              ? "bg-[#ff9600] text-white shadow-sm shadow-[#ff9600]/40"
              : "text-amber-600 dark:text-amber-400 bg-amber-500/15 group-hover:scale-110"
          }`}
        >
          <Layers className="w-5 h-5 stroke-[2.5]" />
        </div>
      ),
    },
    {
      name: "Tra cứu",
      path: "/dictionary",
      color: "#ce82ff",
      activeBg: "bg-[#ce82ff]/20 dark:bg-[#ce82ff]/20",
      activeBorder: "border-[#ce82ff]",
      activeText: "text-[#7e22ce] dark:text-[#ce82ff]",
      icon: (isActive) => (
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
            isActive
              ? "bg-[#ce82ff] text-white shadow-sm shadow-[#ce82ff]/40"
              : "text-purple-600 dark:text-purple-400 bg-purple-500/15 group-hover:scale-110"
          }`}
        >
          <BookOpen className="w-5 h-5 stroke-[2.5]" />
        </div>
      ),
    },
    {
      name: "Hồ sơ",
      path: "/profile",
      color: "#00cd9c",
      activeBg: "bg-[#00cd9c]/20 dark:bg-[#00cd9c]/20",
      activeBorder: "border-[#00cd9c]",
      activeText: "text-[#0f766e] dark:text-[#00cd9c]",
      icon: (isActive) => (
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
            isActive
              ? "bg-[#00cd9c] text-white shadow-sm shadow-[#00cd9c]/40"
              : "text-teal-600 dark:text-teal-400 bg-teal-500/15 group-hover:scale-110"
          }`}
        >
          <User className="w-5 h-5 stroke-[2.5]" />
        </div>
      ),
    },
    ...(user?.role === "ADMIN"
      ? [
          {
            name: "Quản trị",
            path: "/admin/users",
            color: "#9333ea",
            activeBg: "bg-purple-500/20 dark:bg-purple-500/20",
            activeBorder: "border-purple-500",
            activeText: "text-purple-700 dark:text-purple-400",
            icon: (isActive) => (
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                  isActive
                    ? "bg-purple-600 text-white shadow-sm shadow-purple-500/40"
                    : "text-purple-600 dark:text-purple-400 bg-purple-500/15 group-hover:scale-110"
                }`}
              >
                <LayoutDashboard className="w-5 h-5 stroke-[2.5]" />
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <aside className="shrink-0 h-screen sticky top-0 hidden md:flex flex-col justify-between p-3 sm:p-4 md:w-[76px] lg:w-[240px] xl:w-[280px] 2xl:w-[300px] border-r-2 border-[#d5cdbd] dark:border-gray-800 bg-[#f4efe4] dark:bg-gray-900 transition-all duration-200 select-none z-30">
      {/* TOP: BRAND LOGO + NAVIGATION */}
      <div className="flex flex-col">
        {/* BRAND LOGO: ANHLINGO */}
        <Link
          to="/learn"
          className="group flex items-center justify-center lg:justify-start gap-3 px-2 py-3 mb-4 rounded-2xl hover:bg-[#e4ded0] dark:hover:bg-gray-800/80 transition-all cursor-pointer"
        >
          {/* Mascot Icon: 3D Cute Owl */}
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-b from-[#58cc02] to-[#46a302] p-1.5 flex items-center justify-center shadow-md shadow-[#58cc02]/25 border-b-3 border-[#3b8702] group-hover:scale-105 transition-transform shrink-0">
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

          {/* Brand Name (Hidden on iPad md, visible on lg & xl) */}
          <div className="hidden lg:flex items-baseline tracking-tight">
            <span className="text-[24px] xl:text-[26px] font-black text-[#58cc02] lowercase leading-none">
              anh
            </span>
            <span className="text-[24px] xl:text-[26px] font-black text-gray-900 dark:text-white lowercase leading-none">
              lingo
            </span>
            <span className="w-2 h-2 rounded-full bg-[#58cc02] ml-0.5 inline-block" />
          </div>
        </Link>

        {/* NAVIGATION LIST */}
        <nav className="flex flex-col gap-2">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                title={item.name}
                className={`group relative flex items-center justify-center lg:justify-start gap-3.5 px-3 py-2.5 rounded-2xl font-black text-[14px] uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                  isActive
                    ? `${item.activeBg} ${item.activeText} border-2 ${item.activeBorder} border-b-4 shadow-xs`
                    : "text-gray-800 dark:text-gray-300 hover:text-black dark:hover:text-white hover:bg-[#e4ded0] dark:hover:bg-gray-800 border-2 border-transparent hover:border-[#c8c0ad] dark:hover:border-gray-700"
                }`}
              >
                {item.icon(isActive)}
                <span className="hidden lg:inline">{item.name}</span>

                {isActive && (
                  <span className="hidden lg:inline ml-auto w-2 h-2 rounded-full bg-[#58cc02] shadow-sm animate-pulse" />
                )}
              </Link>
            );
          })}

          {/* MORE MENU (XEM THÊM) */}
          <div className="relative" ref={moreMenuRef}>
            <button
              type="button"
              onClick={() => setShowMoreMenu((prev) => !prev)}
              title="Xem thêm"
              className={`w-full group flex items-center justify-center lg:justify-start gap-3.5 px-3 py-2.5 rounded-2xl font-black text-[14px] uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                showMoreMenu
                  ? "bg-[#e4ded0] dark:bg-gray-800 text-black dark:text-white border-2 border-[#bfb5a0] dark:border-gray-600"
                  : "text-gray-800 dark:text-gray-300 hover:text-black dark:hover:text-white hover:bg-[#e4ded0] dark:hover:bg-gray-800 border-2 border-transparent hover:border-[#c8c0ad] dark:hover:border-gray-700"
              }`}
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-700 dark:text-slate-300 bg-slate-500/15 group-hover:scale-110 transition-transform">
                <MoreHorizontal className="w-5 h-5 stroke-[2.5]" />
              </div>
              <span className="hidden lg:inline">Xem thêm</span>
            </button>

            {/* POPOVER CARD */}
            {showMoreMenu && (
              <div className="absolute left-0 lg:left-0 bottom-full mb-2 w-[230px] rounded-2xl border-2 border-[#d5cdbd] dark:border-gray-700 bg-[#f4efe4] dark:bg-gray-800 shadow-xl p-2 z-50 animate-in fade-in duration-150">
                <div className="px-3 py-2 text-[11px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 border-b border-[#d5cdbd]/60 dark:border-gray-700/60 mb-1">
                  Tiện ích & Cài đặt
                </div>

                {/* Dark mode toggle */}
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-gray-900 dark:text-gray-100 hover:bg-[#e4ded0] dark:hover:bg-gray-700/70 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    {isDark ? (
                      <Sun className="w-4 h-4 text-amber-500" />
                    ) : (
                      <Moon className="w-4 h-4 text-indigo-600" />
                    )}
                    <span>{isDark ? "Giao diện Sáng" : "Giao diện Tối"}</span>
                  </div>
                  <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-md bg-[#dcd5c5] dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                    {isDark ? "Tối" : "Sáng"}
                  </span>
                </button>

                {/* Luyện phát âm AI */}
                <Link
                  to="/learn"
                  onClick={() => setShowMoreMenu(false)}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-gray-900 dark:text-gray-100 hover:bg-[#e4ded0] dark:hover:bg-gray-700/70 transition-colors"
                >
                  <Mic className="w-4 h-4 text-rose-500" />
                  <span>Luyện phát âm AI</span>
                </Link>

                {/* Cổng Quản Trị cho Admin */}
                {user?.role === "ADMIN" && (
                  <Link
                    to="/admin/users"
                    onClick={() => setShowMoreMenu(false)}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-purple-700 dark:text-purple-300 hover:bg-purple-500/10 transition-colors"
                  >
                    <LayoutDashboard className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span>Cổng Quản Trị</span>
                  </Link>
                )}

                <div className="my-1 border-t border-[#d5cdbd]/60 dark:border-gray-700/60" />

                {/* Đăng xuất */}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer text-left"
                >
                  <LogOut className="w-4 h-4 text-red-600 dark:text-red-400" />
                  <span>Đăng xuất</span>
                </button>
              </div>
            )}
          </div>
        </nav>
      </div>

      {/* BOTTOM: THEME TOGGLE + USER MINI PROFILE */}
      <div className="pt-3 border-t-2 border-[#d5cdbd] dark:border-gray-800 flex flex-col gap-2">
        {/* Quick Theme Mode Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          title={isDark ? "Chuyển sang Giao diện Sáng" : "Chuyển sang Giao diện Tối"}
          className="w-full flex items-center justify-center lg:justify-between px-3 py-2.5 rounded-2xl border-2 border-[#d5cdbd] dark:border-gray-800 hover:border-[#bfb5a0] dark:hover:border-gray-700 bg-[#e4ded0]/80 dark:bg-gray-800/60 hover:bg-[#dbd3c2] dark:hover:bg-gray-800 transition-all text-xs font-black uppercase tracking-wider text-gray-900 dark:text-gray-100 cursor-pointer group active:scale-98"
        >
          <div className="flex items-center gap-2.5">
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-500 group-hover:rotate-45 transition-transform" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600 group-hover:-rotate-12 transition-transform" />
            )}
            <span className="hidden lg:inline">{isDark ? "Giao diện Tối" : "Giao diện Sáng"}</span>
          </div>

          <div className="hidden lg:flex items-center w-8 h-4 rounded-full bg-[#c8c0ad] dark:bg-[#58cc02] p-0.5 transition-colors">
            <div className={`w-3 h-3 rounded-full bg-white shadow-xs transition-transform ${isDark ? "translate-x-4" : "translate-x-0"}`} />
          </div>
        </button>

        <Link
          to="/profile"
          title={user?.username || "Hồ sơ"}
          className="group flex items-center justify-center lg:justify-start gap-3 p-2 rounded-2xl hover:bg-[#e4ded0] dark:hover:bg-gray-800/80 transition-all border-2 border-transparent hover:border-[#c8c0ad] dark:hover:border-gray-700"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#58cc02] to-[#46a302] text-white flex items-center justify-center text-sm font-black uppercase shadow-xs shrink-0">
            {user?.username?.[0] || "U"}
          </div>

          <div className="hidden lg:block flex-1 min-w-0 text-left">
            <div className="text-xs font-black text-gray-900 dark:text-white truncate">
              {user?.username || "Học viên"}
            </div>
            <div className="text-[11px] font-bold text-[#1c7400] dark:text-[#58cc02] truncate flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>{user?.role === "ADMIN" ? "Quản trị viên" : "Super Anhlingo"}</span>
            </div>
          </div>

          <ChevronRight className="hidden lg:block w-4 h-4 text-gray-500 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </aside>
  );
}