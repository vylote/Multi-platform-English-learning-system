export default function PolicyFooter({ mode = "login" }) {
  const verb = mode === "login" ? "đăng nhập" : "tạo tài khoản";

  return (
    <div className="mt-5 space-y-2 text-center">
      <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
        Khi bấm {verb} trên anhlingo, bạn đồng ý với{" "}
        <a href="/terms" className="text-[#1cb0f6] dark:text-[#38bdf8] font-bold hover:underline">
          Điều khoản sử dụng
        </a>{" "}
        và{" "}
        <a href="/privacy" className="text-[#1cb0f6] dark:text-[#38bdf8] font-bold hover:underline">
          Chính sách bảo mật
        </a>.
      </p>
      <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-relaxed">
        Hệ thống được bảo vệ bởi reCAPTCHA Enterprise theo chính sách của Google.
      </p>
    </div>
  );
}