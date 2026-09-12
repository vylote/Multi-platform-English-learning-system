import { Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

import HomePage from "../pages/HomePage";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import PracticeHubPage from "../pages/PracticeHubPage";
import ProfilePage from "../pages/ProfilePage";
import ExamTopicsPage from "../pages/ExamTopicsPage";
import ExamDetailPage from "../pages/ExamDetailPage";
import ExamTakingPage from "../pages/ExamTakingPage";
import DictionaryPage from "../pages/DictionaryPage";
import ExamListPage from "../pages/ExamListPage";

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

      <Route
        path="/learn"
        element={user ? <ExamTopicsPage /> : <Navigate to="/login" />}
      />
      <Route path="/learn/topics/:topicId" element={user ? <ExamListPage /> : <Navigate to="/login" />} />
      <Route
        path="/learn/exams/:id"
        element={user ? <ExamDetailPage /> : <Navigate to="/login" />}
      />
      <Route
        path="/learn/exams/:id/take"
        element={user ? <ExamTakingPage /> : <Navigate to="/login" />}
      />
      <Route
        path="/dictionary"
        element={user ? <DictionaryPage /> : <Navigate to="/login" />}
      />

      <Route
        path="/practice-hub"
        element={user ? <PracticeHubPage /> : <Navigate to="/login" />}
      />

      <Route
        path="/profile"
        element={user ? <ProfilePage /> : <Navigate to="/login" />}
      />

      {/* Route không khớp -> về trang chủ */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};
