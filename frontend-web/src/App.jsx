import { useEffect, useState } from "react";
import { BrowserRouter } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Toaster } from "react-hot-toast";

import { AppRoutes } from "./routes/AppRoutes";
import { loginSuccess, logout, setInitialized } from "./store/slice/authSlice";
import api from "./api/api";

function App() {
  const dispatch = useDispatch();
  const { isInitialized } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Cookie access_token (nếu còn hạn + còn trong Redis) sẽ tự được BE xác thực
        const res = await api.get("/auth/me");
        dispatch(loginSuccess({ user: res.data.result }));
      } catch (error) {
        console.log("Lỗi đăng nhập/session timeout: ", error)
        // 401 = chưa đăng nhập / session hết hạn -> coi như logout, không cần báo lỗi
        dispatch(logout());
      } finally {
        setLoading(false);
        dispatch(setInitialized());
      }
    };

    initAuth();
  }, [dispatch]);

  if (loading || !isInitialized) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[#f9f9f9]">
        <div className="w-10 h-10 border-4 border-[#58cc02] border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-gray-500 font-medium">
          Đang xác thực phiên làm việc...
        </p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;