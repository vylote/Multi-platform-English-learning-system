import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";
import { Eye, EyeOff, Lock, User, ArrowLeft, Sun, Moon } from "lucide-react";

import api from "../api/api";
import { loginSuccess, logout } from "../store/slice/authSlice";
import { useTheme } from "../context/ThemeContext";

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isDark, toggleTheme } = useTheme();

  const [form, setForm] = useState({ username: "", password: "" });
  const [errorMsg, setErrorMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.password) {
      setErrorMsg("Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.");
      return;
    }

    setErrorMsg("");
    setSubmitting(true);

    try {
      // 1. Gửi request đăng nhập
      const res = await api.post("/auth/login", form);
      const loggedUser = res.data?.result?.user;

      // 2. Kiểm tra vai trò: Chỉ cho phép ADMIN
      if (!loggedUser || loggedUser.role !== "ADMIN") {
        // Tự động thu hồi phiên làm việc vì không phải ADMIN
        try {
          await api.post("/auth/logout");
        } catch (_) {}
        dispatch(logout());

        setErrorMsg("Truy cập bị từ chối: Tài khoản của bạn không có quyền Quản trị viên (ADMIN).");
        return;
      }

      // 3. Nếu là ADMIN -> Cho phép vào hệ thống quản trị
      dispatch(loginSuccess({ user: loggedUser }));
      toast.success(`Xin chào Quản trị viên ${loggedUser.username}!`);
      navigate("/admin/users");
    } catch (err) {
      const message =
        err.response?.data?.message || "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.";
      setErrorMsg(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-[#ede8dc] dark:bg-[#121318] text-gray-900 dark:text-gray-100 transition-colors duration-200 select-none px-4 py-6">
      {/* TOP HEADER */}
      <div className="max-w-md w-full mx-auto flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Về trang chủ</span>
        </Link>

        <button
          type="button"
          onClick={toggleTheme}
          title={isDark ? "Giao diện Sáng" : "Giao diện Tối"}
          className="w-9 h-9 rounded-xl flex items-center justify-center border-2 border-[#d5cdbd] dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-[#58cc02] transition-all cursor-pointer shadow-2xs"
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-600" />
          )}
        </button>
      </div>

      {/* LOGIN CARD */}
      <div className="max-w-[420px] w-full mx-auto my-auto">
        <div className="rounded-3xl border-2 border-[#d5cdbd] dark:border-gray-700 bg-white dark:bg-[#18232c] p-6 sm:p-8 shadow-xl text-left transition-colors">
          {/* BADGE ADMIN ICON */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-b from-[#7e22ce] to-[#581c87] p-2 flex items-center justify-center shadow-lg shadow-purple-500/25 border-b-4 border-purple-900 mb-3">
              <svg viewBox="0 0 36 36" fill="none" className="w-full h-full drop-shadow-sm">
                <rect x="3" y="4" width="30" height="28" rx="14" fill="#9333ea" />
                <ellipse cx="18" cy="24" rx="9" ry="7" fill="#c084fc" />
                <circle cx="12" cy="14" r="5.5" fill="white" />
                <circle cx="24" cy="14" r="5.5" fill="white" />
                <circle cx="13" cy="14" r="3" fill="#0f172a" />
                <circle cx="25" cy="14" r="3" fill="#0f172a" />
                <circle cx="14" cy="13" r="1.2" fill="white" />
                <circle cx="26" cy="13" r="1.2" fill="white" />
                <polygon points="18,17 15,22 21,22" fill="#ff9600" />
              </svg>
            </div>

            <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-purple-500/15 text-purple-700 dark:text-purple-400 border border-purple-500/30 mb-1.5">
              Admin Portal
            </span>
            <h1 className="text-2xl font-black text-gray-950 dark:text-white tracking-tight">
              Đăng nhập Quản trị
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Dành riêng cho Quản trị viên hệ thống anhlingo
            </p>
          </div>

          {/* FORM */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Username Input */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1.5">
                Tên đăng nhập / Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  name="username"
                  placeholder="admin hoặc email quản trị"
                  value={form.username}
                  onChange={handleChange}
                  autoComplete="username"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border-2 border-[#d5cdbd] dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 text-gray-900 dark:text-white placeholder-gray-400 font-bold text-sm outline-none focus:border-purple-600 dark:focus:border-purple-500 focus:bg-white dark:focus:bg-gray-800 transition-all shadow-2xs"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1.5">
                Mật khẩu
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Nhập mật khẩu quản trị"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  required
                  className="w-full pl-10 pr-12 py-3 rounded-2xl border-2 border-[#d5cdbd] dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 text-gray-900 dark:text-white placeholder-gray-400 font-bold text-sm outline-none focus:border-purple-600 dark:focus:border-purple-500 focus:bg-white dark:focus:bg-gray-800 transition-all shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 stroke-[2]" />
                  ) : (
                    <Eye className="w-4 h-4 stroke-[2]" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3 rounded-2xl bg-rose-500/10 border-2 border-rose-500/25 text-rose-600 dark:text-rose-400 text-xs font-bold animate-in fade-in leading-relaxed">
                {errorMsg}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 py-3.5 px-4 rounded-2xl bg-gradient-to-b from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-black text-sm uppercase tracking-wider shadow-md shadow-purple-600/30 border-b-4 border-purple-900 active:translate-y-0.5 active:border-b-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {submitting ? "Đang xác thực quyền..." : "Đăng nhập Quản trị viên"}
            </button>
          </form>
        </div>
      </div>

      {/* FOOTER */}
      <div className="text-center text-[11px] font-bold text-gray-500 dark:text-gray-500">
        anhlingo • Hệ thống quản lý người dùng và phân quyền vai trò
      </div>
    </div>
  );
}
