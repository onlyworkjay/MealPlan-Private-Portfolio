import { useState } from "react";
import styles from "./FindIdPage.module.css";
import EmailAuth from "../emailauth/EmailAuth";
import logo from "../assets/logo.svg";
import axios from "axios";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

const FindIdPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState({
    nickname: "",
    email: "",
  });
  const [emailVerified, setEmailVerified] = useState(false);

  const handleFindId = async () => {
    try {
      const res = await axios.post("/api/users/find-id", {
        nickname: user.nickname,
        email: user.email,
      });

      Swal.fire({
        title: "아이디 찾기 결과",
        text: `회원님의 아이디는 ${res.data.userId} 입니다.`,
        icon: "success",
      });
    } catch (err) {
      Swal.fire({
        title: "조회 실패",
        text: "일치하는 정보가 없습니다.",
        icon: "error",
      });
    }
  };

  return (
    <div className={styles.find_id_page_wrap}>
      <div className={styles.find_id_container}>
        <div className={styles.find_id_header}>
          <div className={styles.logo_icon}>
            <img src={logo} alt="MealPlan 로고" />
          </div>

          <h1 className={styles.page_title}>아이디를 잊으셨나요?</h1>
          <p className={styles.page_subtitle}>
            가입하신 닉네임과 이메일 인증 후 아이디를 확인할 수 있어요.
          </p>
        </div>

        <div className={styles.find_id_card}>
          <div className={styles.notice_box}>
            <strong>이메일 인증이 필요합니다</strong>
            <p>
              회원가입 시 등록한 이메일로 인증을 완료하면, 아이디 찾기를 진행할
              수 있습니다.
            </p>
          </div>

          <div className={styles.nickname_wrap}>
            <label htmlFor="nickname">닉네임</label>
            <input
              type="text"
              id="nickname"
              name="nickname"
              value={user.nickname}
              onChange={(e) =>
                setUser((prev) => ({
                  ...prev,
                  nickname: e.target.value.replace(/\s/g, ""),
                }))
              }
              placeholder="가입한 닉네임을 입력해주세요. (2~8글자)"
            />
          </div>

          <div className={styles.email_wrap}>
            <EmailAuth
              email={user.email}
              setEmail={(email) => setUser({ ...user, email: email })}
              onVerified={setEmailVerified}
            />
          </div>

          <button
            type="button"
            className={`${styles.find_id_btn} ${
              !emailVerified ? styles.disabled_btn : ""
            }`}
            onClick={handleFindId}
            disabled={!emailVerified}
          >
            아이디 찾기
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

export default FindIdPage;
