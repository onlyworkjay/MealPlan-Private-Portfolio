import { useState } from "react";
import styles from "./FindPwPage.module.css";
import EmailAuth from "../emailauth/EmailAuth";
import Swal from "sweetalert2";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.svg";

const FindPwPage = () => {
  const navigate = useNavigate();

  // 아이디
  const [loginId, setLoginId] = useState("");

  // 이메일
  const [email, setEmail] = useState("");

  // 이메일 인증 여부 확인
  const [emailVerified, setEmailVerified] = useState(false);

  // 아이디와 이메일이 입력되었는지 확인 후 비밀번호 찾기 요청
  const verifyInput = () => {
    const trimmedLoginId = loginId.trim();
    const trimmedEmail = email.trim();

    if (!trimmedLoginId || !trimmedEmail) {
      Swal.fire({
        title: "아이디와 이메일을 입력해주세요",
        icon: "warning",
      });
      return;
    }

    if (!emailVerified) {
      Swal.fire({
        title: "이메일 인증이 필요합니다",
        text: "이메일 인증을 완료해 주세요",
        icon: "warning",
      });
      return;
    }

    axios
      .post(`${import.meta.env.VITE_BACKSERVER}/users/find-pw`, {
        loginId: trimmedLoginId,
        email: trimmedEmail,
      })
      .then((res) => {
        console.log(res.data);

        Swal.fire({
          title: "임시 비밀번호를 보냈습니다.",
          text: "이메일을 확인해 주세요",
          icon: "success",
        }).then(() => {
          navigate("/");
        });
      })
      .catch((err) => {
        console.log(err);

        Swal.fire({
          title: "비밀번호 찾기 실패",
          text: "아이디 또는 이메일을 다시 확인해 주세요",
          icon: "error",
        });
      });
  };

  return (
    <div className={styles.find_pw_page_wrap}>
      <div className={styles.find_pw_container}>
        <div className={styles.find_pw_header}>
          <div className={styles.logo_icon}>
            <img src={logo} alt="MealPlan 로고" />
          </div>

          <h1 className={styles.page_title}>비밀번호를 잊으셨나요?</h1>
          <p className={styles.page_subtitle}>
            아이디와 이메일 인증 후 임시 비밀번호를 받을 수 있어요
          </p>
        </div>

        <div className={styles.find_pw_card}>
          <div className={styles.notice_box}>
            <strong>아이디와 이메일 인증이 필요합니다</strong>
            <p>
              가입한 아이디와 등록된 이메일이 일치해야 비밀번호 찾기를 진행할 수
              있습니다.
            </p>
          </div>

          <div className={styles.input_wrap}>
            <label htmlFor="loginId" className={styles.input_label}>
              아이디
            </label>

            <input
              className={styles.input_id}
              type="text"
              value={loginId}
              id="loginId"
              onChange={(e) => setLoginId(e.target.value)}
              placeholder="가입한 아이디를 입력하세요."
              autoComplete="username"
            />
          </div>

          <div className={styles.email_area}>
            <EmailAuth
              email={email}
              setEmail={setEmail}
              onVerified={setEmailVerified}
            />
          </div>

          <button
            type="button"
            className={`${styles.find_pw_btn} ${
              !emailVerified ? styles.disabled_btn : ""
            }`}
            onClick={verifyInput}
            disabled={!emailVerified}
          >
            비밀번호 찾기
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

export default FindPwPage;
