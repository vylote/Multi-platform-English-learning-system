import { X, ArrowLeft } from "lucide-react";

/**
 * Layout dùng chung cho các màn Auth (Login/Register step 1/step 2)
 * - onClose: hiện icon X ở góc trên trái, dùng cho màn Login & bước chọn tuổi
 * - onBack: hiện icon mũi tên quay lại, dùng cho màn điền form hồ sơ
 */
export default function AuthLayout({ onClose, onBack, children }) {
  return (
    <div className="min-h-screen bg-[#f9f9f9] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-[400px] rounded-lg shadow-lg px-6 py-5 sm:px-8 sm:py-6">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        )}
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label="Quay lại"
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
        )}
        {children}
      </div>
    </div>
  );
}