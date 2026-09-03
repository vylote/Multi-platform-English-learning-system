import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";

import api from "../api/api";
import { logout } from "../store/slice/authSlice";
import MainLayout from "../components/MainLayout"; 

export default function MainPage() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.log("Lỗi đăng xuất: ", error);
    } finally {
      dispatch(logout());
      toast.success("Đã đăng xuất");
    }
  };

  return (
    <MainLayout>
      <div className="flex flex-col items-center justify-center min-h-[80vh]">
        
        <div className="bg-white dark:bg-gray-800 w-full max-w-[400px] rounded-lg shadow-lg px-6 py-5 sm:px-8 sm:py-6 border border-gray-200 dark:border-gray-700 transition-colors duration-300">
          
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-[#58cc02] text-white flex items-center justify-center text-2xl font-bold uppercase">
              {user?.username?.[0] || "?"}
            </div>
          </div>

          <h1 className="text-2xl font-bold text-center mb-1 text-gray-900 dark:text-white">
            {user?.username}
          </h1>
          <p className="text-center text-gray-500 dark:text-gray-400 text-sm mb-6">
            {user?.email}
          </p>

          <div className="space-y-2 mb-6">
            <div className="flex justify-between items-center border border-gray-200 dark:border-gray-600 rounded-md px-3 py-2.5 text-sm">
              <span className="text-gray-500 dark:text-gray-400">Vai trò</span>
              <span className="font-semibold text-gray-900 dark:text-gray-200">{user?.role}</span>
            </div>
            <div className="flex justify-between items-center border border-gray-200 dark:border-gray-600 rounded-md px-3 py-2.5 text-sm">
              <span className="text-gray-500 dark:text-gray-400">Ngày tham gia</span>
              <span className="font-semibold text-gray-900 dark:text-gray-200">
                {user?.created_at
                  ? new Date(user.created_at).toLocaleDateString("vi-VN")
                  : "--"}
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full py-2.5 rounded-md text-white font-bold text-base bg-[#58cc02] hover:bg-[#4cb001] transition-colors"
          >
            Đăng xuất
          </button>
        </div>

      </div>
    </MainLayout>
  );
}