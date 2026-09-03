import { createSlice } from '@reduxjs/toolkit';

const savedUser = localStorage.getItem('user') 

const authSlice = createSlice({
  name: 'auth',
  // phần initialState sẽ ngay lập tức được chạy khi store khởi tạo
  initialState: {
    user: savedUser ? JSON.parse(savedUser) : null,
    isInitialized: false,
  },
  reducers: {
    loginSuccess: (state, action) => {
      state.user = action.payload.user;
      state.isInitialized = true; // Đã xác thực xong
      localStorage.setItem('user', JSON.stringify(action.payload.user));
    },
    logout: (state) => {
      state.user = null;
      state.isInitialized = true; 
      localStorage.removeItem('user');
    },
    // Bổ sung action này để dùng khi không có user hoặc check xong mà fail
    setInitialized: (state) => {
      state.isInitialized = true;
    }
  }
});

export const { loginSuccess, logout, setInitialized } = authSlice.actions;
export default authSlice.reducer;