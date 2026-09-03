export default function PolicyFooter({ mode = "login" }) {
  const verb = mode === "login" ? "đăng nhập" : "đăng ký";

  return (
    <>
      <p className="text-xs text-gray-500 mt-4 leading-relaxed">
        Khi {verb} trên hệ thống, bạn đã đồng ý với{" "}
        <a href="/terms" className="text-[#0073e6] font-bold hover:underline">
          Các chính sách
        </a>{" "}
        và{" "}
        <a href="/privacy" className="text-[#0073e6] font-bold hover:underline">
          Chính sách bảo mật
        </a>{" "}
        của chúng tôi.
      </p>
      <p className="text-xs text-gray-500 mt-3 leading-relaxed">
        Trang này được reCAPTCHA Enterprise bảo hộ và theo{" "}
        <a href="https://policies.google.com/privacy" className="text-[#0073e6] hover:underline">
          Chính sách bảo mật
        </a>{" "}
        và{" "}
        <a href="https://policies.google.com/terms" className="text-[#0073e6] hover:underline">
          Điều khoản dịch vụ
        </a>{" "}
        của Google.
      </p>
    </>
  );
}