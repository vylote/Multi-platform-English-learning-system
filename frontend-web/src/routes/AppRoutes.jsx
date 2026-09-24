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
import OnboardingPage from "../pages/OnboardingPage";
import PlacementTestPage from "../pages/PlacementTestPage";

// 1. Đưa ProtectedRoute ra ngoài AppRoutes
const ProtectedRoute = ({ children }) => {
  const { user } = useSelector((state) => state.auth);
  const needsOnboarding = user && !user.tier;

  if (!user) return <Navigate to="/login" replace />;
  if (needsOnboarding) return <Navigate to="/onboarding" replace />;

  return children;
};

export const AppRoutes = () => {
  const { user } = useSelector((state) => state.auth);
  const needsOnboarding = user && !user.tier;

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
        path="/onboarding"
        element={
          !user ? (
            <Navigate to="/login" replace />
          ) : !needsOnboarding ? (
            <Navigate to="/learn" replace />
          ) : (
            <OnboardingPage />
          )
        }
      />
      <Route
        path="/placement-test"
        element={
          !user ? (
            <Navigate to="/login" replace />
          ) : !needsOnboarding ? (
            <Navigate to="/learn" replace />
          ) : (
            <PlacementTestPage />
          )
        }
      />

      {/* --- CÁC ROUTE ĐƯỢC BẢO VỆ BỞI PROTECTED ROUTE --- */}
      <Route
        path="/learn"
        element={
          <ProtectedRoute>
            <ExamTopicsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/learn/topics/:topicId"
        element={
          <ProtectedRoute>
            <ExamListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/learn/exams/:id"
        element={
          <ProtectedRoute>
            <ExamDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/learn/exams/:id/take"
        element={
          <ProtectedRoute>
            <ExamTakingPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dictionary"
        element={
          <ProtectedRoute>
            <DictionaryPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/practice-hub"
        element={
          <ProtectedRoute>
            <PracticeHubPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />

      {/* Route không khớp -> về trang chủ */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};
