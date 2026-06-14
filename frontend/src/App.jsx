import { Route, Routes } from "react-router-dom";
import "./App.css";

import Header from "./components/Header";
import Footer from "./components/Footer";
import MainPage from "./pages/MainPage";
import LoginPage from "./pages/LoginPage";
import JoinPage from "./pages/JoinPage";
import FindIdPage from "./pages/FindIdPage";
import FindPwPage from "./pages/FindPwPage";
import ScrollToTop from "./components/ScrollToTop";

function App() {
  return (
    <>
      <ScrollToTop />
      <Header />
      <Routes>
        <Route path="/mealplan" element={<MainPage />} />
        {/* ⬆️ 메인페이지 */}
        <Route path="/users/login" element={<LoginPage />} />
        {/* ⬆️ 로그인 페이지 */}
        <Route path="/users/join" element={<JoinPage />} />
        {/* ⬆️ 회원가입 */}
        <Route path="/users/find-id" element={<FindIdPage />} />
        {/* ⬆️ 아이디 찾기 */}
        <Route path="/users/find-pw" element={<FindPwPage />} />
      </Routes>
      <Footer />
    </>
  );
}

export default App;
