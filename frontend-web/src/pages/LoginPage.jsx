import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";

import AuthLayout from "../components/AuthLayout";
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
        <input
          type="password"
          name="password"
          placeholder="Mật khẩu"
          value={form.password}
          onChange={handleChange}
          required
          className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-300 rounded-md mb-2.5 outline-none focus:border-[#58cc02] dark:focus:border-[#58cc02] focus:ring-2 focus:ring-[#58cc02]/20 transition-shadow"
        />

        {errorMsg && (
          <p className="text-sm text-red-500 -mt-1 mb-2">{errorMsg}</p>
        )}

        <div className="text-right text-xs -mt-1 mb-1">
          <a href="/forgot-password" className="text-[#0073e6] dark:text-[#4da3ff] hover:underline">
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
        <a href="/register" className="text-[#58cc02] font-bold hover:underline">
          Đăng ký
        </a>
      </p>
    </AuthLayout>
  );
}