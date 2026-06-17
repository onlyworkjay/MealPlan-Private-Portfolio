import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import styles from "./LoginPage.module.css";
import logo from "../assets/logo.svg";
import { useAuth } from "../contexts/AuthContext";

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ id: "", password: "" });

  const handleSubmit = (e) => {
    e.preventDefault();

    if (form.id.trim() === "" || form.password.trim() === "") {
      Swal.fire({
        icon: "warning",
        title: "아이디와 비밀번호를 입력해주세요",
        confirmButtonColor: "#38BDF8",
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
        Swal.fire({
          icon: "error",
          title: "로그인에 실패했습니다",
          text: err.response?.data || "아이디 또는 비밀번호를 확인해주세요.",
          confirmButtonColor: "#38BDF8",
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
            <input
              type="password"
              className={styles["form-input"]}
              placeholder="비밀번호 입력"
              value={form.password}
              onChange={(e) =>
                setForm((f) => ({ ...f, password: e.target.value }))
              }
            />
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
