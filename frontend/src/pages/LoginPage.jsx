import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import styles from "./LoginPage.module.css";
import logo from "../assets/logo.svg";
import { useAuth } from "../contexts/AuthContext";
import { showSwal } from "../utils/SwalAlert";

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ id: "", password: "" });
  // 비밀번호 표시/숨김 토글 (기본값: 숨김)
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (form.id.trim() === "" || form.password.trim() === "") {
      showSwal({
        type: "warning",
        title: "아이디와 비밀번호를 입력해주세요",
      });
      return;
    }

    axios
      .post(`${import.meta.env.VITE_BACKSERVER}/users/login`, {
        loginId: form.id,
        password: form.password,
      })
      .then((res) => {
        const { token, ...user } = res.data;
        login(token, user);
        navigate("/");
      })
      .catch((err) => {
        showSwal({
          type: "error",
          title: "로그인에 실패했습니다",
          text: err.response?.data || "아이디 또는 비밀번호를 확인해주세요.",
        });
      });
  };

  return (
    <div className={styles.login_page_wrap}>
      <div className={styles["login-card"]}>
        <div className={styles["login-logo"]}>
          <div className={styles["login-logo-icon"]}>
            <img src={logo} alt="MealPlan 로고" />
          </div>
          <span className={styles["login-logo-name"]}>
            Meal<span>Plan</span>
          </span>
        </div>
        <h2 className={styles["login-heading"]}>환영합니다!</h2>
        <p className={styles["login-sub"]}>
          아이디와 비밀번호를 입력해 로그인하세요
        </p>
        <form onSubmit={handleSubmit}>
          <div className={styles["form-group"]}>
            <label className={styles["form-label"]}>아이디</label>
            <input
              className={styles["form-input"]}
              placeholder="아이디 입력"
              value={form.id}
              onChange={(e) => setForm((f) => ({ ...f, id: e.target.value }))}
            />
          </div>
          <div className={styles["form-group"]}>
            <label className={styles["form-label"]}>비밀번호</label>
            <div className={styles.password_input_wrap}>
              <input
                type={showPassword ? "text" : "password"}
                className={styles["form-input"]}
                placeholder="비밀번호 입력"
                value={form.password}
                onChange={(e) =>
                  setForm((f) => ({ ...f, password: e.target.value }))
                }
              />
              <button
                type="button"
                className={styles.password_toggle_btn}
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                tabIndex={-1}
              >
                {showPassword ? (
                  // 눈 (보이는 상태) 아이콘
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                ) : (
                  // 눈 (가려진 상태) 아이콘
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a18.6 18.6 0 0 1 5.06-5.94M9.9 4.24A10.94 10.94 0 0 1 12 5c7 0 11 7 11 7a18.6 18.6 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          <button
            type="submit"
            className={`btn btn-primary ${styles["login-submit"]}`}
          >
            로그인
          </button>
        </form>
        <p className={styles["login-footer"]}>
          아직 계정이 없으신가요?{" "}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              navigate("/users/join");
            }}
          >
            회원가입
          </a>
        </p>
        <div className={styles.find_account_area}>
          <Link to="/users/find-id" className={styles.find_account_link}>
            아이디 찾기
          </Link>
          <span className={styles.find_account_divider}>|</span>
          <Link to="/users/find-pw" className={styles.find_account_link}>
            비밀번호 찾기
          </Link>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
