import { Route, Routes, useNavigate } from "react-router-dom";
import "./App.css";

import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Header from "./components/Header";
import Footer from "./components/Footer";
import MainPage from "./pages/MainPage";
import LoginPage from "./pages/LoginPage";
import JoinPage from "./pages/JoinPage";
import FindIdPage from "./pages/FindIdPage";
import FindPwPage from "./pages/FindPwPage";
import MyPage from "./pages/MyPage";
import WritePage from "./pages/WritePage";
import ScrollToTop from "./components/ScrollToTop";
import ResetPwPage from "./pages/ResetPwPage";

function AppContent() {
  const { isLoggedIn, user, logout, remainingSeconds } = useAuth();
  const navigate = useNavigate();

  const handleNavigate = (view) => {
    navigate(view === "feed" ? "/" : `/${view}`);
  };

  return (
    <>
      <ScrollToTop />
      <Header
        isLoggedIn={isLoggedIn}
        user={user}
        onLogout={logout}
        remainingSeconds={remainingSeconds}
      />
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/users/login" element={<LoginPage />} />
        <Route path="/users/join" element={<JoinPage />} />
        <Route path="/users/find-id" element={<FindIdPage />} />
        <Route path="/users/find-pw" element={<FindPwPage />} />
        <Route path="/users/reset-password" element={<ResetPwPage />} />
        <Route
          path="/mealplan/write"
          element={<WritePage onNavigate={handleNavigate} />}
        />
        <Route
          path="/mypage"
          element={
            <MyPage user={user} onLogout={logout} onNavigate={handleNavigate} />
          }
        />
      </Routes>
      <Footer />
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
