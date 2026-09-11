import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";

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
        err.response?.data?.message || "Đăng nhập thất bại, vui lòng thử lại.";
      setErrorMsg(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout onClose={() => navigate("/")}>
      <h1 className="text-2xl font-bold text-center mb-4 text-gray-900 dark:text-white">
        Đăng nhập
      </h1>

      <form onSubmit={handleSubmit} noValidate>
        <input
          type="text"
          name="username"
          placeholder="Tên đăng nhập"
          value={form.username}
          onChange={handleChange}
          required
          className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-300 rounded-md mb-2.5 outline-none focus:border-[#58cc02] dark:focus:border-[#58cc02] focus:ring-2 focus:ring-[#58cc02]/20 transition-shadow"
        />

        <div className="relative mb-2.5">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Mật khẩu"
            value={form.password}
            onChange={handleChange}
            required
            className="w-full px-3 py-2.5 pr-10 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-300 rounded-md mb-2.5 outline-none focus:border-[#58cc02] dark:focus:border-[#58cc02] focus:ring-2 focus:ring-[#58cc02]/20 transition-shadow"
          />

          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors outline-none"
          >
            {showPassword ? (
              // Icon mắt mở
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            ) : (
              // Icon mắt nhắm (có đường gạch chéo)
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                />
              </svg>
            )}
          </button>
        </div>

        {errorMsg && (
          <p className="text-sm text-red-500 -mt-1 mb-2">{errorMsg}</p>
        )}

        <div className="text-right text-xs -mt-1 mb-1">
          <a
            href="/forgot-password"
            className="text-[#0073e6] dark:text-[#4da3ff] hover:underline"
          >
            Quên mật khẩu?
          </a>
        </div>

        <button
          type="submit"
          disabled={submitting || !form.username || !form.password}
          className="w-full py-2.5 mt-2 rounded-md text-white font-bold text-base bg-[#58cc02] hover:bg-[#4cb001] disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>

        <SocialButtons />
        <PolicyFooter mode="login" />
      </form>

      <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-4">
        Chưa có tài khoản?{" "}
        <a
          href="/register"
          className="text-[#58cc02] font-bold hover:underline"
        >
          Đăng ký
        </a>
      </p>
    </AuthLayout>
  );
}
