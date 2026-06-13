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
        <Route path="/users/login" element={<LoginPage />} />
        <Route path="/users/join" element={<JoinPage />} />
      </Routes>
      <Footer />
    </>
  );
}

export default App;
