import axios from "axios";
import { store } from "../store/index";
import { logout } from "../store/slice/authSlice";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  // Bắt buộc để trình duyệt tự gửi kèm cookie chứa Access Token lên BE
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || "";

    // Không tự logout nếu chính request đó LÀ login/register
    // (401 ở đây nghĩa là "sai username/password", không phải "token hết hạn")
    const isAuthEndpoint =
      url.includes("/auth/login") || url.includes("/auth/register");

    // Access Token hết hạn hoặc bị revoke (BE check qua Redis cache) -> 401
    // Vì hệ thống chỉ dùng duy nhất Access Token (không có Refresh Token),
    // không cần thử refresh lại -> logout ngay lập tức.
    if (status === 401 && !isAuthEndpoint) {
      store.dispatch(logout());
    }

    return Promise.reject(error);
  }
);

export default api;