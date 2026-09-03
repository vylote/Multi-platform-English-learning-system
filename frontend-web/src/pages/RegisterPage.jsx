import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import AuthLayout from "../components/AuthLayout";
import SocialButtons from "../components/SocialButtons";
import PolicyFooter from "../components/PolicyFooter";
import api from "../api/api";

export default function RegisterPage() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [age, setAge] = useState("");
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [errorMsg, setErrorMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isAgeValid = age !== "" && Number(age) > 0 && Number(age) < 120;

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { username, email, password } = form;
    if (!username || !email || !password) return;

    setErrorMsg("");
    setSubmitting(true);
    try {
      await api.post("/auth/register", { username, email, password });
      toast.success("Tạo tài khoản thành công! Vui lòng đăng nhập.");
      navigate("/login");
    } catch (err) {
      const message =
        err.response?.data?.message || "Đăng ký thất bại, vui lòng thử lại.";
      setErrorMsg(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (step === 1) {
    return (
      <AuthLayout onClose={() => navigate("/")}>
        <h1 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
          Bạn bao nhiêu tuổi?
        </h1>

        <input
          type="number"
          placeholder="Tuổi"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          min={1}
          max={119}
          className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-300 rounded-md mb-2.5 outline-none focus:border-[#58cc02] dark:focus:border-[#58cc02] focus:ring-2 focus:ring-[#58cc02]/20 transition-shadow"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
          Hãy cho chúng tôi biết tuổi của bạn để có trải nghiệm học tập phù hợp
          nhất. Vui lòng truy cập trang{" "}
          <a href="/privacy" className="text-[#0073e6] dark:text-[#4da3ff] hover:underline">
            Chính sách quyền riêng tư
          </a>{" "}
          để biết thêm chi tiết.
        </p>

        <button
          type="button"
          disabled={!isAgeValid}
          onClick={() => setStep(2)}
          className="w-full py-2.5 mt-3 rounded-md text-white font-bold text-base bg-[#58cc02] hover:bg-[#4cb001] disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
        >
          Tiếp theo
        </button>

        <SocialButtons />
        <PolicyFooter mode="register" />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout onBack={() => setStep(1)}>
      <h1 className="text-2xl font-bold text-center mb-4 text-gray-900 dark:text-white">
        Tạo hồ sơ
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
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
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
          minLength={6}
          className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-300 rounded-md mb-2.5 outline-none focus:border-[#58cc02] dark:focus:border-[#58cc02] focus:ring-2 focus:ring-[#58cc02]/20 transition-shadow"
        />

        {errorMsg && (
          <p className="text-sm text-red-500 -mt-1 mb-2">{errorMsg}</p>
        )}

        <button
          type="submit"
          disabled={submitting || !form.username || !form.email || !form.password}
          className="w-full py-2.5 mt-2 rounded-md text-white font-bold text-base bg-[#58cc02] hover:bg-[#4cb001] disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
        </button>

        <SocialButtons />
        <PolicyFooter mode="register" />
      </form>
    </AuthLayout>
  );
}