import { useState } from "react";
import styles from "./FindIdPage.module.css";
import EmailAuth from "../emailauth/EmailAuth";
import logo from "../assets/logo.svg";
import axios from "axios";
import { showSwal } from "../utils/SwalAlert";
import { useNavigate } from "react-router-dom";

const FindIdPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState({
    nickname: "",
    email: "",
  });
  const [emailVerified, setEmailVerified] = useState(false);

  // 가입일을 "YYYY.MM.DD" 형식으로 표시 (앱 내 다른 날짜 표시 형식과 통일)
  const formatDate = (isoString) => {
    if (!isoString) return "";
    const d = new Date(isoString);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}.${mm}.${dd}`;
  };

  // ⬇️ 수정된 부분: 응답에 같이 내려오는 createdAt(가입일)도 함께 표시
  const handleFindId = async () => {
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKSERVER}/users/find-id`,
        {
          nickname: user.nickname,
          email: user.email,
        },
      );

      showSwal({
        type: "success",
        title: "아이디 찾기 결과",
        text: `회원님의 아이디는 <b>${res.data.loginId}</b> 입니다.<br/>가입일: ${formatDate(res.data.createdAt)}`,
      });
    } catch (err) {
      showSwal({
        type: "error",
        title: "조회 실패",
        text: err.response?.data || "일치하는 정보가 없습니다.",
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
              label="이메일 인증"
              placeholder="가입하신 이메일을 입력해주세요."
              successMessage="이메일 인증이 완료되었습니다."
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
