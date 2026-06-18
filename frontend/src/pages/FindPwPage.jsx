import { useState } from "react";
import styles from "./FindPwPage.module.css";
import EmailAuth from "../emailauth/EmailAuth";
import Swal from "sweetalert2";
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

  // ⬇️ 수정된 부분: 임시 비밀번호를 이메일로 보내는 방식 대신,
  // 인증 완료 후 새 비밀번호를 직접 설정하는 페이지로 이동
  const handleNext = () => {
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

    navigate("/users/reset-password", {
      state: { loginId: trimmedLoginId, email: trimmedEmail },
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
            아이디와 이메일 인증 후 새 비밀번호를 설정할 수 있어요
          </p>
        </div>

        <div className={styles.find_pw_card}>
          <div className={styles.notice_box}>
            <strong>아이디와 이메일 인증이 필요합니다</strong>
            <p>
              가입한 아이디와 등록된 이메일이 일치해야 비밀번호 재설정을 진행할
              수 있습니다.
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
            {/* ⬇️ 수정된 부분: "이메일 변경"이 아니라 가입된 이메일로 본인 확인하는
                용도라서 라벨/안내문구/인증 성공 문구를 이 맥락에 맞게 따로 지정 */}
            <EmailAuth
              email={email}
              setEmail={setEmail}
              onVerified={setEmailVerified}
              label="이메일 인증"
              placeholder="가입하신 이메일을 입력해주세요."
              successMessage="이메일 인증이 완료되었습니다."
            />
          </div>

          <button
            type="button"
            className={`${styles.find_pw_btn} ${
              !emailVerified ? styles.disabled_btn : ""
            }`}
            onClick={handleNext}
            disabled={!emailVerified}
          >
            새 비밀번호 설정하기
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
