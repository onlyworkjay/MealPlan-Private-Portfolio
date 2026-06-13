import { Route, Routes } from "react-router-dom";
import "./App.css";

import Header from "./components/Header";
import Footer from "./components/Footer";
import MainPage from "./pages/MainPage";
import LoginPage from "./pages/LoginPage";
import JoinPage from "./pages/JoinPage";

function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/mealplan" element={<MainPage />} />
        {/* ⬆️ 메인페이지 */}
        <Route path="/users/login" element={<LoginPage />} />
        {/* ⬆️ 로그인 페이지 */}
        <Route path="/users/join" element={<JoinPage />} />
        {/* ⬆️ 회원가입 */}
      </Routes>
      <Footer />
    </>
  );
}

export default App;
