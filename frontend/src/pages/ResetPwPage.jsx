import { useEffect, useState } from "react";
import styles from "./ResetPwPage.module.css";
import Swal from "sweetalert2";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import logo from "../assets/logo.svg";

const PW_PATTERN = /^[a-zA-Z0-9!@#$%]{8,16}$/;

const ResetPwPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginId, email } = location.state || {};

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMatch, setPasswordMatch] = useState(null);

  // FindPwPage를 거치지 않고 주소로 직접 들어온 경우 (loginId/email 정보가 없음) 되돌려보냄
  useEffect(() => {
    if (!loginId || !email) {
      navigate("/users/find-pw", { replace: true });
    }
  }, [loginId, email, navigate]);

  if (!loginId || !email) {
    return null;
  }

  const handleEnterKey = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleResetPassword();
    }
  };

  const handleResetPassword = () => {
    if (!PW_PATTERN.test(newPassword)) {
      Swal.fire({
        title: "비밀번호 형식을 확인해주세요",
        text: "영문·숫자·특수문자(!@#$%) 조합 8~16자여야 합니다",
        icon: "warning",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      Swal.fire({
        title: "새 비밀번호가 일치하지 않습니다",
        icon: "warning",
      });
      return;
    }

    axios
      .post(`${import.meta.env.VITE_BACKSERVER}/users/reset-password`, {
        loginId,
        email,
        newPassword,
      })
      .then(() => {
        Swal.fire({
          title: "비밀번호가 변경되었습니다.",
          icon: "success",
        }).then(() => {
          navigate("/users/login");
        });
      })
      .catch((err) => {
        Swal.fire({
          title: "비밀번호 변경에 실패했습니다",
          text: err.response?.data || "잠시 후 다시 시도해주세요.",
          icon: "error",
        });
      });
  };

  return (
    <div className={styles.reset_pw_page_wrap}>
      <div className={styles.reset_pw_container}>
        <div className={styles.reset_pw_header}>
          <div className={styles.logo_icon}>
            <img src={logo} alt="MealPlan 로고" />
          </div>

          <h1 className={styles.page_title}>새 비밀번호 설정</h1>
          <p className={styles.page_subtitle}>
            {loginId} 계정의 새 비밀번호를 입력해주세요
          </p>
        </div>

        <div className={styles.reset_pw_card}>
          <div className={styles.input_wrap}>
            <label htmlFor="newPassword" className={styles.input_label}>
              새 비밀번호
            </label>
            <input
              className={styles.input_pw}
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                setPasswordMatch(
                  confirmPassword ? e.target.value === confirmPassword : null,
                );
              }}
              onKeyDown={handleEnterKey}
              placeholder="새 비밀번호를 입력하세요."
              autoComplete="new-password"
            />
          </div>

          <div className={styles.input_wrap}>
            <label htmlFor="confirmPassword" className={styles.input_label}>
              새 비밀번호 확인
            </label>
            <input
              className={styles.input_pw}
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => {
                const value = e.target.value;
                setConfirmPassword(value);
                setPasswordMatch(value ? newPassword === value : null);
              }}
              onKeyDown={handleEnterKey}
              placeholder="새 비밀번호를 다시 입력하세요."
              autoComplete="new-password"
            />
            {passwordMatch === true && (
              <div className={styles.match_ok}>비밀번호가 일치합니다</div>
            )}
            {passwordMatch === false && (
              <div className={styles.match_fail}>
                비밀번호가 일치하지 않습니다
              </div>
            )}
          </div>

          <div className={styles.pw_hint}>
            최소 8글자, 최대 16글자 (영문·숫자·특수문자 필수)
          </div>

          <button
            type="button"
            className={styles.reset_pw_btn}
            onClick={handleResetPassword}
          >
            비밀번호 변경하기
          </button>

          <div className={styles.bottom_link_area}>
            <button
              type="button"
              className={styles.back_login_btn}
              onClick={() => navigate("/users/login")}
            >
              로그인 페이지로 돌아가기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPwPage;
