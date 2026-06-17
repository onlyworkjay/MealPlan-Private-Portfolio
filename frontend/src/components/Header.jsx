import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import styles from "./Header.module.css";

import logo from "../assets/logo.svg";
import defaultProfile from "../assets/default-profile.svg";

const NAV_LINKS = [
  { label: "피드", href: "/mealplan" },
  { label: "날짜별 조회", href: "/mealplan/calendar" },
  { label: "통계", href: "/mealplan/stats" },
];

const PUBLIC_NAV_LINKS = NAV_LINKS.filter((link) => link.label !== "통계");

const formatRemaining = (sec) => {
  if (sec === null || sec === undefined) return "";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

const Header = ({ isLoggedIn, user, onLogout, remainingSeconds }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = isLoggedIn ? NAV_LINKS : PUBLIC_NAV_LINKS;
  const timerWarning =
    remainingSeconds !== null &&
    remainingSeconds !== undefined &&
    remainingSeconds <= 300;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const goTo = (path) => {
    setMenuOpen(false);
    navigate(path);
  };

  const handleCloseMenu = () => {
    setMenuOpen(false);
  };

  return (
    <>
      <nav
        className={[styles.navbar, scrolled ? styles.navbar_scrolled : ""]
          .filter(Boolean)
          .join(" ")}
      >
        <div className={styles.nav_inner}>
          <button className={styles.nav_logo} onClick={() => goTo("/mealplan")}>
            <img
              src={logo}
              alt="MealPlan 로고"
              width="36"
              height="36"
              style={{ borderRadius: "10px" }}
            />
            <div className={styles.nav_logo_text}>
              <span className={styles.meal}>Meal</span>
              <span className={styles.plan}>Plan</span>
            </div>
          </button>

          <div className={styles.nav_center}>
            {navLinks.map(({ label, href }) => (
              <Link
                key={href}
                to={href}
                className={[
                  styles.nav_center_link,
                  location.pathname === href
                    ? styles.nav_center_link_active
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={handleCloseMenu}
              >
                {label}
              </Link>
            ))}
          </div>

          <div className={styles.nav_auth}>
            {isLoggedIn ? (
              <>
                <div
                  className={[
                    styles.session_timer,
                    timerWarning ? styles.session_timer_warning : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  ⏱️ {formatRemaining(remainingSeconds)}
                </div>
                <div className={styles.nav_profile}>
                  <img
                    src={user?.profileImg || defaultProfile}
                    alt="프로필"
                    className={styles.nav_profile_img}
                  />
                  <span className={styles.nav_profile_name}>
                    {user?.nickname ?? "사용자"}
                  </span>
                </div>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => goTo("/mealplan/mypage")}
                >
                  마이페이지
                </button>
                <button className="btn btn-ghost btn-sm" onClick={onLogout}>
                  로그아웃
                </button>
              </>
            ) : (
              <>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => goTo("/users/login")}
                >
                  로그인
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => goTo("/users/join")}
                >
                  회원가입
                </button>
              </>
            )}
            <button
              className={[
                styles.hamburger,
                menuOpen ? styles.hamburger_open : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="메뉴"
            >
              <span className={styles.hamburger_line} />
              <span className={styles.hamburger_line} />
              <span className={styles.hamburger_line} />
            </button>
          </div>
        </div>
      </nav>

      <div
        className={`${styles.mobile_menu} ${
          menuOpen ? styles.mobile_menu_open : ""
        }`}
      >
        {isLoggedIn ? (
          <>
            {navLinks.map(({ label, href }) => (
              <Link
                key={href}
                to={href}
                className={styles.mobile_menu_link}
                onClick={handleCloseMenu}
              >
                {label}
              </Link>
            ))}
            <div className={styles.mobile_menu_divider} />
            <div
              className={[
                styles.session_timer,
                timerWarning ? styles.session_timer_warning : "",
              ]
                .filter(Boolean)
                .join(" ")}
              style={{ marginBottom: "8px" }}
            >
              ⏱️ 남은 시간 {formatRemaining(remainingSeconds)}
            </div>
            <div className={styles.mobile_auth}>
              <button
                className="btn btn-ghost"
                onClick={() => goTo("/mealplan/write")}
              >
                ✏️ 기록하기
              </button>
              <button
                className="btn btn-primary"
                onClick={() => goTo("/mealplan/mypage")}
              >
                👤 마이페이지
              </button>
              <button
                className={styles.mobile_logout_btn}
                onClick={() => {
                  setMenuOpen(false);
                  onLogout();
                }}
              >
                로그아웃
              </button>
            </div>
          </>
        ) : (
          <>
            {navLinks.map(({ label, href }) => (
              <Link
                key={href}
                to={href}
                className={styles.mobile_menu_link}
                onClick={handleCloseMenu}
              >
                {label}
              </Link>
            ))}
            <div className={styles.mobile_menu_divider} />
            <div className={styles.mobile_auth}>
              <button
                className="btn btn-ghost"
                onClick={() => goTo("/users/login")}
              >
                로그인
              </button>
              <button
                className="btn btn-primary"
                onClick={() => goTo("/users/join")}
              >
                회원가입
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default Header;
