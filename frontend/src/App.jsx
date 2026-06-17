import { Route, Routes } from "react-router-dom";
import "./App.css";

import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Header from "./components/Header";
import Footer from "./components/Footer";
import MainPage from "./pages/MainPage";
import LoginPage from "./pages/LoginPage";
import JoinPage from "./pages/JoinPage";
import FindIdPage from "./pages/FindIdPage";
import FindPwPage from "./pages/FindPwPage";
import ScrollToTop from "./components/ScrollToTop";

function AppContent() {
  const { isLoggedIn, user, logout, remainingSeconds } = useAuth();

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
        <Route path="/mealplan" element={<MainPage />} />
        <Route path="/users/login" element={<LoginPage />} />
        <Route path="/users/join" element={<JoinPage />} />
        <Route path="/users/find-id" element={<FindIdPage />} />
        <Route path="/users/find-pw" element={<FindPwPage />} />
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
