import { Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

import HomePage from "../pages/HomePage";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import MainPage from "../pages/MainPage"; // Trang chính sau khi đăng nhập (có Sidebar)

export const AppRoutes = () => {
  const { user } = useSelector((state) => state.auth);

  return (
    <Routes>
      {/* Trang Landing Page: Chưa đăng nhập thì xem, có user rồi thì vào /learn */}
      <Route
        path="/"
        element={!user ? <HomePage /> : <Navigate to="/learn" />}
      />

      <Route
        path="/login"
        element={!user ? <LoginPage /> : <Navigate to="/learn" />}
      />
      <Route
        path="/register"
        element={!user ? <RegisterPage /> : <Navigate to="/learn" />}
      />

      {/* Trang chính chứa MainLayout (Sidebar): Bắt buộc phải có user */}
      <Route
        path="/learn"
        element={user ? <MainPage /> : <Navigate to="/login" />}
      />

      {/* Route không khớp -> về trang chủ */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};