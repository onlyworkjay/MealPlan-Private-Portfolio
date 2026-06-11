import { useState } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

import Header      from "./components/Header.jsx";
import Footer      from "./components/Footer.jsx";
import FeedPage    from "./pages/FeedPage.jsx";
import { LoginPage, RegisterPage } from "./pages/AuthPages.jsx";
import WritePage   from "./pages/WritePage.jsx";
import MyPage      from "./pages/MyPage.jsx";

function App() {
  const [page,       setPage]       = useState("feed");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user,       setUser]       = useState(null);

  const handleLogin  = u  => { setIsLoggedIn(true); setUser(u); };
  const handleLogout = () => { setIsLoggedIn(false); setUser(null); setPage("feed"); };

  const navigate = p => {
    if (!isLoggedIn && ["write","mypage","stats"].includes(p)) { setPage("login"); return; }
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <Header isLoggedIn={isLoggedIn} user={user} onLogout={handleLogout} onNavigate={navigate} currentPage={page} />

      {page === "feed"     && <FeedPage    isLoggedIn={isLoggedIn} onNavigate={navigate} />}
      {page === "login"    && <LoginPage   onNavigate={navigate} onLogin={handleLogin} />}
      {page === "register" && <RegisterPage onNavigate={navigate} />}
      {page === "write"    && <WritePage   onNavigate={navigate} />}
      {page === "mypage"   && <MyPage      user={user} onLogout={handleLogout} onNavigate={navigate} />}

      <Footer />
    </>
  );
}

createRoot(document.getElementById("root")).render(<App />);
