import { useState, useEffect } from "react";
import "../styles/Header.css";

const NAV_LINKS = [
  { label: "피드",       href: "feed" },
  { label: "날짜별 조회", href: "calendar" },
  { label: "통계",       href: "stats" },
];

export default function Header({ isLoggedIn, user, onLogout, onNavigate, currentPage }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const goTo = (page) => { setMenuOpen(false); onNavigate(page); };

  return (
    <>
      <nav className={`navbar${scrolled ? " scrolled" : ""}`}>
        <div className="nav-inner">

          <button className="nav-logo" onClick={() => goTo("feed")}>
            <div className="nav-logo-icon">🥗</div>
            <div className="nav-logo-text">
              <span className="meal">Meal</span>
              <span className="plan">Plan</span>
            </div>
          </button>

          {isLoggedIn && (
            <div className="nav-center">
              {NAV_LINKS.map(({ label, href }) => (
                <a
                  key={href}
                  href={`#${href}`}
                  className={currentPage === href ? "active" : ""}
                  onClick={e => { e.preventDefault(); goTo(href); }}
                >
                  {label}
                </a>
              ))}
            </div>
          )}

          <div className="nav-auth">
            {isLoggedIn ? (
              <>
                <button className="btn btn-ghost btn-sm" onClick={() => goTo("write")}>
                  ✏️ 기록하기
                </button>
                <button className="btn btn-primary btn-sm" onClick={() => goTo("mypage")}>
                  👤 {user?.nickname ?? "내 정보"}
                </button>
              </>
            ) : (
              <>
                <button className="btn btn-ghost btn-sm" onClick={() => goTo("login")}>
                  로그인
                </button>
                <button className="btn btn-primary btn-sm" onClick={() => goTo("register")}>
                  회원가입
                </button>
              </>
            )}
            <button
              className={`hamburger${menuOpen ? " open" : ""}`}
              onClick={() => setMenuOpen(v => !v)}
              aria-label="메뉴"
            >
              <span /><span /><span />
            </button>
          </div>
        </div>
      </nav>

      <div className={`mobile-menu${menuOpen ? " open" : ""}`}>
        {isLoggedIn ? (
          <>
            {NAV_LINKS.map(({ label, href }) => (
              <a key={href} href={`#${href}`} onClick={e => { e.preventDefault(); goTo(href); }}>
                {label}
              </a>
            ))}
            <div className="mobile-menu-divider" />
            <div className="mobile-auth">
              <button className="btn btn-ghost" onClick={() => goTo("write")}>✏️ 기록하기</button>
              <button className="btn btn-primary" onClick={() => goTo("mypage")}>👤 마이페이지</button>
              <button className="mobile-logout-btn" onClick={() => { setMenuOpen(false); onLogout(); }}>
                로그아웃
              </button>
            </div>
          </>
        ) : (
          <>
            <a href="#feed" onClick={e => { e.preventDefault(); goTo("feed"); }}>🍽️ 피드 둘러보기</a>
            <div className="mobile-menu-divider" />
            <div className="mobile-auth">
              <button className="btn btn-ghost" onClick={() => goTo("login")}>로그인</button>
              <button className="btn btn-primary" onClick={() => goTo("register")}>회원가입</button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
