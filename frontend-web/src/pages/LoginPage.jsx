import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";
import { Eye, EyeOff, AlertCircle } from "lucide-react";

import AuthLayout from "../layouts/AuthLayout";
import SocialButtons from "../components/SocialButtons";
import PolicyFooter from "../components/PolicyFooter";
import api from "../api/api";
import { loginSuccess } from "../store/slice/authSlice";

export default function LoginPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [form, setForm] = useState({ username: "", password: "" });
  const [errorMsg, setErrorMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.password) return;

    setErrorMsg("");
    setSubmitting(true);
    try {
      const res = await api.post("/auth/login", form);
      dispatch(loginSuccess({ user: res.data.result.user }));
      toast.success("Đăng nhập thành công!");
      navigate("/");
    } catch (err) {
      const message =
        err.response?.data?.message || "Đăng nhập thất bại, vui lòng kiểm tra lại tài khoản.";
      setErrorMsg(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout onClose={() => navigate("/")} mode="login">
      <h1 className="text-2xl sm:text-3xl font-black text-center mb-6 text-gray-900 dark:text-white tracking-tight">
        Đăng nhập
      </h1>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
        {/* Username Input */}
        <div>
          <input
            type="text"
            name="username"
            placeholder="Tên đăng nhập hoặc Email"
            value={form.username}
            onChange={handleChange}
            autoComplete="username"
            required
            className="w-full px-4 py-3 rounded-2xl border-2 border-[#d5cdbd] dark:border-gray-700 bg-[#ede8dc]/30 dark:bg-gray-800/80 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 font-bold text-sm sm:text-base outline-none focus:border-[#58cc02] dark:focus:border-[#58cc02] focus:bg-white dark:focus:bg-gray-800 transition-all shadow-2xs"
          />
        </div>

        {/* Password Input */}
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Mật khẩu"
            value={form.password}
            onChange={handleChange}
            autoComplete="current-password"
            required
            className="w-full px-4 py-3 pr-12 rounded-2xl border-2 border-[#d5cdbd] dark:border-gray-700 bg-[#ede8dc]/30 dark:bg-gray-800/80 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 font-bold text-sm sm:text-base outline-none focus:border-[#58cc02] dark:focus:border-[#58cc02] focus:bg-white dark:focus:bg-gray-800 transition-all shadow-2xs"
          />

          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
            aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors cursor-pointer"
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5 stroke-[2]" />
            ) : (
              <Eye className="w-5 h-5 stroke-[2]" />
            )}
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Forgot password */}
        <div className="text-right -mt-1">
          <a
            href="/forgot-password"
            className="text-xs font-black text-[#1cb0f6] dark:text-[#38bdf8] hover:underline"
          >
            QUÊN MẬT KHẨU?
          </a>
        </div>

        {/* 3D Submit Button */}
        <button
          type="submit"
          disabled={submitting || !form.username || !form.password}
          className="w-full py-3.5 mt-1 rounded-2xl text-white font-black text-[15px] uppercase tracking-wider bg-[#58cc02] hover:bg-[#4fb802] border-b-4 border-[#3b8702] active:translate-y-1 active:border-b-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:translate-y-0 disabled:border-b-4 transition-all shadow-sm cursor-pointer"
        >
          {submitting ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>

        <SocialButtons />
        <PolicyFooter mode="login" />
      </form>

      {/* Switch to Register */}
      <div className="text-center text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400 mt-5 pt-4 border-t-2 border-[#d5cdbd]/60 dark:border-gray-700/60">
        Chưa có tài khoản?{" "}
        <Link
          to="/register"
          className="text-[#58cc02] font-black uppercase tracking-wider hover:underline ml-1"
        >
          Đăng ký ngay
        </Link>
      </div>
    </AuthLayout>
  );
}
