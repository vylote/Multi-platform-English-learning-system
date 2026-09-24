import { createSlice } from "@reduxjs/toolkit";

const savedUser = localStorage.getItem("user");
let initialUser = null;

// Thêm try...catch để an toàn tuyệt đối khi parse JSON
try {
  // Kiểm tra khác null và khác chuỗi "undefined"
  if (savedUser && savedUser !== "undefined") {
    initialUser = JSON.parse(savedUser);
  }
} catch (error) {
  console.warn("Dữ liệu user trong localStorage bị lỗi, đang reset...", error);
  localStorage.removeItem("user"); // Xóa dữ liệu lỗi đi
}

const authSlice = createSlice({
  name: "auth",
  // phần initialState sẽ ngay lập tức được chạy khi store khởi tạo
  initialState: {
    user: initialUser,
    isInitialized: false,
  },
  reducers: {
    loginSuccess: (state, action) => {
      state.user = action.payload.user;
      state.isInitialized = true; // Đã xác thực xong
      localStorage.setItem("user", JSON.stringify(action.payload.user));
    },
    logout: (state) => {
      state.user = null;
      state.isInitialized = true;
      localStorage.removeItem("user");
    },
    // Bổ sung action này để dùng khi không có user hoặc check xong mà fail
    setInitialized: (state) => {
      state.isInitialized = true;
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
      localStorage.setItem("user", JSON.stringify(state.user));
    },
  },
});

export const { loginSuccess, logout, setInitialized, updateUser } =
  authSlice.actions;
export default authSlice.reducer;
