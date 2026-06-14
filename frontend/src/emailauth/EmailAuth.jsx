import axios from "axios";
import styles from "./EmailAuth.module.css";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";

const EmailAuth = ({
  //1. 이메일과 관련된 변수들을 지정
  email,
  setEmail,
  onVerified,
  readOnlyEmail,
  //기존변수들에서 추가된 변수 --> placeholder
  //-> 이렇게 하는 이유는 이메일과 관련된 역할이 다른 컴포넌트에서 고정된 멘트값을 넣으면
  //-> 이상하기 때문에 placeholder값을 props로 받아서 상황에 맞는 멘트를 띄우게 하기 위해서
  //-> 즉 placeholder라는 껍데기만 제공하고 각 컴포넌트에서 상황에 맞는 멘트를 넣어서 사용할 수 있게 하기 위해서
  placeholder,
}) => {
  //2. 이메일 상태 구현, 인증 코드
  const [mailAuth, setMailAuth] = useState(0);
  const [mailAuthCode, setMailAuthCode] = useState("null");
  const [inputAuthCode, setInputAuthCode] = useState("");

  //9. 시간, 타이머 설정
  const [time, setTime] = useState(180);
  const [timeExpired, setTimeExpired] = useState(false);

  //13. 이메일 정규식 패턴 정의
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

  //7. 이메일 입력값 저장
  const inputEmail = (e) => {
    setEmail(e.target.value);
  };

  //4. 이메일 전송 함수 구현
  const sendMail = (e) => {
    e.preventDefault();

    if (mailAuth === 1) {
      Swal.fire({
        title: "이미 인증메일을 보냈습니다.",
        text: "3분 이내에 인증 번호를 확인해 주세요",
        icon: "info",
      });
      return;
    }

    //5. 빈값 체크
    if (!email) {
      Swal.fire({
        title: "이메일을 입력해주세요",
        text: "인증번호를 받으실 이메일을 입력해주세요",
        icon: "warning",
      });
      return;
    }
    //14. 이메일 정규식 패턴 검사
    if (!emailRegex.test(email)) {
      Swal.fire({
        title: "올바르지 않은 이메일 형식",
        text: "이메일 주소를 다시 확인해 주세요",
        icon: "error",
      });
      return;
    }

    //15 이메일 주소를 보내 인증하기 전에 서버에 이 이메일 주소를 잘 넘기고 있나?"를 브라우저 개발자 도구(F12) 콘솔 창에서 확인하기 위한 용도
    const payLoad = { email };
    console.log("이메일 인증요청", payLoad);
    console.log("서버 주소", import.meta.env.VITE_BACKSERVER);

    //6. 인증 메일 전송
    axios
      .post(`${import.meta.env.VITE_BACKSERVER}/users/email-verification`, {
        email,
      })
      .then((res) => {
        console.log(res.data);

        setMailAuth(1);
        //기존 setMailAuthCode(res.data)에서 아래 형식으로 변환
        //-> 공백처리 문제등을 해결하기 위함
        setMailAuthCode(String(res.data).trim());

        // 인증 메일을 새로 보낼 때 타이머 초기화
        setTime(180);
        setTimeExpired(false);
        Swal.fire({
          title: "이메일 인증 메일을 보남니다.",
          text: "3분 이내에 인증메일을 확인해주세요",
          icon: "success",
        });
      })
      .catch((err) => {
        console.log("이메일 인증 요청 실패", err);
      });
  };

  //10. 타이머 설정
  useEffect(() => {
    // 인증 메일을 보낸 상태가 아니면 타이머 실행 X
    if (mailAuth !== 1) return;

    // 시간이 만료된 상태면 타이머 실행 X
    if (timeExpired) return;

    const timer = setInterval(() => {
      setTime((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setMailAuth(0);
          setTimeExpired(true);
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [mailAuth, timeExpired]);

  //11. 자세한 시간 설정
  const showTime = () => {
    const min = Math.floor(time / 60);
    const sec = String(time % 60).padStart(2, "0");
    return `${min}:${sec}`;
  };

  //8. 비교 인증
  const verifyAuthCode = (e) => {
    e.preventDefault();

    if (mailAuth === 3) return;
    //기존 이메일 인증 로직과 달라지는 점 --> servercode, inputcode추가
    //--> 공백 처리와 관련하여 기능 수행하는 로직
    const serverCode = String(mailAuthCode).trim();
    const inputCode = String(inputAuthCode).trim();

    console.log("서버 인증번호:", serverCode, typeof serverCode);
    console.log("입력 인증번호:", inputCode, typeof inputCode);

    if (inputAuthCode === serverCode) {
      setMailAuth(3);
      onVerified(true);

      Swal.fire({
        title: "이메일 인증이 완료되었습니다.",
        icon: "success",
      });
    } else {
      setMailAuth(1);
      onVerified(false);

      Swal.fire({
        title: "인증 번호가 일치하지 않습니다.",
        icon: "warning",
      });
    }
  };

  return (
    <>
      <div className={styles.email_input_wrap}>
        <label htmlFor="email">이메일</label>
        <div className={styles.input_item}>
          <input
            className={styles.email_input}
            type="email"
            id="email"
            value={email}
            onChange={inputEmail}
            readOnly={readOnlyEmail || mailAuth === 1 || mailAuth === 3}
            placeholder={placeholder}
          />
          <button
            type="button"
            className={styles.email_btn}
            onClick={sendMail}
            disabled={mailAuth === 1 || mailAuth === 3}
          >
            {mailAuth === 1
              ? "전송됨 "
              : mailAuth === 3
                ? "인증 완료"
                : "인증 번호 전송"}
          </button>
        </div>

        <div className={styles.input_wrap}>
          <label htmlFor="inputAuthCode">이메일 확인</label>
          <div className={styles.input_item}>
            <input
              className={styles.email_input}
              type="text"
              value={inputAuthCode}
              id="inputAuthCode"
              onChange={(e) => setInputAuthCode(e.target.value)}
              placeholder="인증번호 6자리를 입력하세요."
            />
            <button
              type="button"
              className={styles.email_btn}
              onClick={verifyAuthCode}
              disabled={mailAuth !== 1}
            >
              메일 인증하기
            </button>
          </div>
        </div>
      </div>
      {/*(12) 시간에 따른 상태 메세지 출력  */}
      {mailAuth === 1 && !timeExpired && (
        <p className={styles.timer_msg}>남은시간: {showTime()} </p>
      )}
      {mailAuth === 3 && <p className={styles.check_msg}>인증 완료!</p>}
      {timeExpired && (
        <p className={`${styles.check_msg} ${styles.invalid}`}>
          인증시간이 만료되었습니다.
        </p>
      )}
    </>
  );
};

export default EmailAuth;
