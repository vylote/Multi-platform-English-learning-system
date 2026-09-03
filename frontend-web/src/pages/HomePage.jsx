import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";

import api from "../api/api";
import { logout } from "../store/slice/authSlice";

export default function HomePage() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.log("Lỗi ở file homepage.jsx: ",error)
    } finally {
      dispatch(logout());
      toast.success("Đã đăng xuất");
    }
  };

  return (
    <div className="min-h-screen bg-[#f9f9f9] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-[400px] rounded-lg shadow-lg px-6 py-5 sm:px-8 sm:py-6">
        {/* Avatar tròn với chữ cái đầu username, thay cho ảnh đại diện */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-[#58cc02] text-white flex items-center justify-center text-2xl font-bold">
            {user?.username?.[0]?.toUpperCase()}
          </div>
        </div>

        <h1 className="text-2xl font-bold text-center mb-1">
          {user?.username}
        </h1>
        <p className="text-center text-gray-500 text-sm mb-6">
          {user?.email}
        </p>

        <div className="space-y-2 mb-6">
          <div className="flex justify-between items-center border border-gray-200 rounded-md px-3 py-2.5 text-sm">
            <span className="text-gray-500">Vai trò</span>
            <span className="font-semibold">{user?.role}</span>
          </div>
          <div className="flex justify-between items-center border border-gray-200 rounded-md px-3 py-2.5 text-sm">
            <span className="text-gray-500">Ngày tham gia</span>
            <span className="font-semibold">
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
  );
}