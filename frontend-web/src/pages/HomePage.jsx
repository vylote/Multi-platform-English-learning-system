import { Link } from "react-router-dom";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col items-center justify-center p-4 transition-colors duration-300">
      <div className="max-w-3xl w-full text-center flex flex-col items-center">
        
        {/* Tiêu đề trang chủ */}
        <h1 className="text-3xl md:text-5xl font-bold text-gray-800 dark:text-white mb-8 leading-tight">
          Cách miễn phí, vui nhộn và hiệu quả để học ngôn ngữ!
        </h1>
        
        <p className="text-gray-500 dark:text-gray-400 mb-8 text-lg">
          Vui lòng đăng nhập hoặc tạo tài khoản để trải nghiệm.
        </p>
        
        {/* Hai nút Đăng ký / Đăng nhập */}
        <div className="flex flex-col gap-4 w-full max-w-sm">
          <Link 
            to="/register"
            className="w-full py-3 bg-[#58cc02] hover:bg-[#4cb001] text-white font-bold text-lg rounded-xl transition-colors uppercase tracking-wide text-center"
          >
            Bắt đầu ngay
          </Link>
          
          <Link 
            to="/login"
            className="w-full py-3 bg-white dark:bg-gray-800 text-[#1cb0f6] dark:text-[#3b82f6] font-bold text-lg rounded-xl transition-colors uppercase tracking-wide text-center border-2 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Tôi đã có tài khoản
          </Link>
        </div>

      </div>
    </div>
  );
}