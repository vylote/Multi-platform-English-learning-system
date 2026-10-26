import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Users,
  LogOut,
  ExternalLink,
  Sun,
  Moon,
  ShieldCheck,
  Sparkles,
  BookOpen,
  KeyRound,
} from "lucide-react";
import toast from "react-hot-toast";

import api from "../api/api";
import { logout } from "../store/slice/authSlice";
import { useTheme } from "../context/ThemeContext";

export default function AdminLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { isDark, toggleTheme } = useTheme();

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (_) {
    } finally {
      dispatch(logout());
      toast.success("Đã đăng xuất khỏi Cổng Quản trị.");
      navigate("/admin/login");
    }
  };

  const navItems = [
    {
      name: "Người dùng",
      path: "/admin/users",
      icon: <Users className="w-5 h-5 stroke-[2.3]" />,
      checkActive: (p) => p.startsWith("/admin/users"),
    },
    {
      name: "Phân quyền",
      path: "/admin/permissions",
      icon: <KeyRound className="w-5 h-5 stroke-[2.3]" />,
      checkActive: (p) => p.startsWith("/admin/permissions"),
    },
    {
      name: "Danh sách đề",
      path: "/admin/exams",
      icon: <BookOpen className="w-5 h-5 stroke-[2.3]" />,
      checkActive: (p) => p === "/admin/exams",
    },
    {
      name: "Sinh đề mới",
      path: "/admin/exams/generate",
      icon: <Sparkles className="w-5 h-5 stroke-[2.3]" />,
      checkActive: (p) => p.startsWith("/admin/exams/generate"),
    },
  ];

  return (
    <div className="h-screen w-full flex bg-[#ede8dc] dark:bg-[#121318] text-gray-900 dark:text-gray-100 transition-colors duration-200 select-none overflow-hidden">
      {/* 1. ADMIN SIDEBAR: Luôn cố định 100% chiều cao màn hình, không bao giờ bị cuộn mất */}
      <aside className="shrink-0 h-full flex flex-col justify-between p-3 sm:p-4 w-[68px] sm:w-[76px] lg:w-[250px] xl:w-[270px] border-r-2 border-[#d5cdbd] dark:border-gray-800 bg-[#f4efe4] dark:bg-gray-900 transition-all duration-200 z-30 overflow-y-auto">
        {/* PHẦN TRÊN: LOGO + DANH SÁCH MENU DỌC */}
        <div className="flex flex-col">
          {/* BRAND LOGO: ANHLINGO ADMIN */}
          <Link
            to="/admin/users"
            className="group flex items-center justify-center lg:justify-start gap-3 px-1.5 py-3 mb-5 rounded-2xl hover:bg-[#e4ded0] dark:hover:bg-gray-800/80 transition-all cursor-pointer"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-b from-purple-600 to-purple-800 p-1 flex items-center justify-center shadow-md shadow-purple-600/25 border-b-3 border-purple-900 group-hover:scale-105 transition-transform shrink-0">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>

            <div className="hidden lg:flex flex-col text-left">
              <div className="flex items-baseline tracking-tight">
                <span className="text-[22px] font-black text-purple-700 dark:text-purple-400 lowercase leading-none">
                  anh
                </span>
                <span className="text-[22px] font-black text-gray-900 dark:text-white lowercase leading-none">
                  lingo
                </span>
              </div>
              <span className="text-[10px] uppercase font-black tracking-wider text-purple-600 dark:text-purple-400 mt-0.5">
                Admin Portal
              </span>
            </div>
          </Link>

          {/* VERTICAL NAVIGATION MENU */}
          <nav className="flex flex-col gap-2">
            {navItems.map((item) => {
              const isActive = item.checkActive
                ? item.checkActive(location.pathname)
                : location.pathname.startsWith(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  title={item.name}
                  className={`group relative flex items-center justify-center lg:justify-start gap-3.5 px-3 py-2.5 rounded-2xl font-black text-[13px] uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                    isActive
                      ? "bg-purple-500/20 text-purple-800 dark:text-purple-300 border-2 border-purple-500 border-b-4 shadow-xs"
                      : "text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white hover:bg-[#e4ded0] dark:hover:bg-gray-800 border-2 border-transparent hover:border-[#c8c0ad] dark:hover:border-gray-700"
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                      isActive
                        ? "bg-purple-600 text-white shadow-sm shadow-purple-600/40"
                        : "text-purple-600 dark:text-purple-400 bg-purple-500/15 group-hover:scale-110"
                    }`}
                  >
                    {item.icon}
                  </div>

                  <span className="hidden lg:inline">{item.name}</span>

                  {isActive && (
                    <span className="hidden lg:inline ml-auto w-2 h-2 rounded-full bg-purple-600 shadow-sm animate-pulse" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* PHẦN DƯỚI: VỀ GIAO DIỆN HỌC + ĐỔI THEME + PROFILE ADMIN */}
        <div className="pt-3 border-t-2 border-[#d5cdbd] dark:border-gray-800 flex flex-col gap-2">
          {/* Lối tắt về App Học viên */}
          <Link
            to="/learn"
            title="Về giao diện học viên"
            className="group flex items-center justify-center lg:justify-start gap-3 px-3 py-2.5 rounded-2xl border-2 border-emerald-500/30 bg-[#58cc02]/10 hover:bg-[#58cc02]/20 text-emerald-800 dark:text-emerald-300 transition-all cursor-pointer font-black text-xs uppercase tracking-wider"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <ExternalLink className="w-4 h-4" />
            </div>
            <span className="hidden lg:inline">Giao diện học</span>
          </Link>

          {/* Nút chuyển đổi Dark / Light mode */}
          <button
            type="button"
            onClick={toggleTheme}
            title={isDark ? "Chuyển sang Giao diện Sáng" : "Chuyển sang Giao diện Tối"}
            className="w-full flex items-center justify-center lg:justify-between px-3 py-2 rounded-2xl border-2 border-[#d5cdbd] dark:border-gray-800 hover:border-[#bfb5a0] dark:hover:border-gray-700 bg-[#e4ded0]/80 dark:bg-gray-800/60 hover:bg-[#dbd3c2] dark:hover:bg-gray-800 transition-all text-xs font-black uppercase tracking-wider text-gray-900 dark:text-gray-100 cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-500" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-600" />
              )}
              <span className="hidden lg:inline">{isDark ? "Giao diện Tối" : "Giao diện Sáng"}</span>
            </div>
            <div className="hidden lg:flex items-center w-7 h-3.5 rounded-full bg-[#c8c0ad] dark:bg-purple-600 p-0.5">
              <div
                className={`w-2.5 h-2.5 rounded-full bg-white shadow-xs transition-transform ${
                  isDark ? "translate-x-3.5" : "translate-x-0"
                }`}
              />
            </div>
          </button>

          {/* Admin User Mini Card + Đăng xuất */}
          <div className="flex items-center justify-between p-2 rounded-2xl bg-[#e4ded0]/60 dark:bg-gray-800/50 border border-[#d5cdbd] dark:border-gray-800">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-purple-600 text-white font-black text-xs flex items-center justify-center shadow-xs shrink-0">
                {user?.username?.[0] || "A"}
              </div>
              <div className="hidden lg:flex flex-col text-left min-w-0">
                <span className="text-xs font-black text-gray-950 dark:text-white truncate">
                  {user?.username || "Admin"}
                </span>
                <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400">
                  Quản trị viên
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              title="Đăng xuất"
              className="p-1.5 rounded-xl text-gray-500 hover:text-rose-600 dark:text-gray-400 dark:hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* 2. MAIN CONTENT AREA: Vùng nội dung cuộn độc lập */}
      <div className="flex-1 min-w-0 h-full overflow-y-auto flex flex-col">
        <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
        <footer className="w-full border-t border-[#d5cdbd] dark:border-gray-800 py-3 text-center text-[11px] font-bold text-gray-500 dark:text-gray-500">
          anhlingo Administration Platform • Quản lý người dùng & Sinh đề thi thông minh
        </footer>
      </div>
    </div>
  );
}
