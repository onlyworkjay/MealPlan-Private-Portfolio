import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import styles from "./JoinPage.module.css";
import logo from "../assets/logo.svg";

function JoinPage() {
  const navigate = useNavigate();

  const [user, setUser] = useState({
    loginId: "",
    password: "",
    passwordConfirm: "",
    nickname: "",
    email: "",
  });

  const [checkId, setCheckId] = useState(0); // 0: 미확인/실패, 1: 사용가능
  const [checkMsg, setCheckMsg] = useState("");
  const [checkPwMsg, setCheckPwMsg] = useState("");

  // 닉네임 관련 상태
  const [checkNickname, setCheckNickname] = useState(0); // 0: 미확인/실패, 1: 사용가능
  const [checkNicknameMsg, setCheckNicknameMsg] = useState("");

  const [pwMatch, setPwMatch] = useState(true);

  // 이메일 인증 관련 state
  const [emailCode, setEmailCode] = useState("");
  const [emailVerify, setEmailVerify] = useState({
    sent: false, // 인증번호 발송 여부 (타이머 진행중)
    verified: false, // 인증 완료 여부
    timer: 0, // 남은 시간(초)
  });
  const timerRef = useRef(null);

  // 아이디 정규식 검사 (6~16자, 영문+숫자 혼합 필수)
  const validateId = (id) => {
    if (id.length === 0) return "";
    if (id.length < 6) return "6자 이상 입력해야 합니다.";
    if (id.length > 16) return "아이디의 길이는 16자 이하만 가능합니다.";
    if (!/^[a-zA-Z0-9]*$/.test(id)) {
      return "아이디는 영문과 숫자만 사용가능해요.";
    }

    const hasEnglish = /[a-zA-Z]/.test(id);
    const hasNumber = /[0-9]/.test(id);

    if (!hasEnglish || !hasNumber) {
      return "아이디는 영문과 숫자를 모두 포함해야 합니다.";
    }

    return "";
  };

  // 비밀번호 정규식 검사 (8~16자, 영문+숫자+특수문자(!@#$%) 혼합 필수)
  const validatePw = (pw) => {
    if (pw.length === 0) return "";
    if (pw.length < 8) return "비밀번호는 8자 이상 입력해야 합니다.";
    if (pw.length > 16) return "비밀번호는 16자 이하만 가능합니다.";

    if (!/^[a-zA-Z0-9!@#$%]*$/.test(pw)) {
      return "비밀번호는 영문, 숫자, 특수문자(!@#$%)만 사용가능합니다.";
    }

    const hasEnglish = /[a-zA-Z]/.test(pw);
    const hasNumber = /[0-9]/.test(pw);
    const hasSpecial = /[!@#$%]/.test(pw);

    if (!hasEnglish || !hasNumber || !hasSpecial) {
      return "비밀번호는 영문, 숫자, 특수문자(!@#$%)를 모두 포함해야 합니다.";
    }

    return "안전한 비밀번호입니다.";
  };

  // 닉네임 길이 검사 (2~8자)
  const validateNickname = (nickname) => {
    if (nickname.length === 0) return "";
    if (nickname.length < 2) return "닉네임은 2자 이상이어야 합니다.";
    if (nickname.length > 8) return "닉네임은 8자 이하만 가능합니다.";
    return "";
  };

  const inputUser = (e) => {
    const { name, value } = e.target;

    // 아이디 실시간 입력 제한 및 검증
    if (name === "loginId") {
      const hasHangul = /[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(value);
      const cleaned = value.replace(/[ㄱ-ㅎㅏ-ㅣ가-힣]/g, "");
      setCheckId(0);

      // 한글 입력 시 빨간 에러 메시지 표시
      if (hasHangul) {
        setCheckMsg("아이디는 영문과 숫자만 사용가능합니다.");
        setUser((prev) => ({ ...prev, loginId: cleaned }));
        return;
      }

      if (cleaned.length === 0) {
        setCheckMsg("");
        setUser((prev) => ({ ...prev, loginId: "" }));
        return;
      }

      if (!/^[a-zA-Z0-9]*$/.test(cleaned)) {
        setCheckMsg("아이디는 영문과 숫자만 사용가능합니다.");
        return;
      }

      if (cleaned.length > 16) {
        setCheckMsg("아이디의 길이는 16자 이하만 가능합니다.");
        return;
      }

      setCheckMsg(validateId(cleaned));
      setUser((prev) => ({ ...prev, loginId: cleaned }));
      return;
    }

    // 비밀번호 실시간 검증 (영문, 숫자, 그리고 특수문자 중에 (!, @, #, $, %) 5개만 허용)
    if (name === "password") {
      const cleaned = value.replace(/[ㄱ-ㅎㅏ-ㅣ가-힣]/g, "");

      if (!/^[a-zA-Z0-9!@#$%]*$/.test(cleaned)) {
        setCheckPwMsg(
          "비밀번호는 영문, 숫자, 특수문자(!@#$%)만 사용가능합니다.",
        );
        return;
      }

      setCheckPwMsg(validatePw(cleaned));

      setUser((prev) => {
        const next = { ...prev, password: cleaned };
        setPwMatch(
          next.passwordConfirm === "" || next.passwordConfirm === cleaned,
        );
        return next;
      });
      return;
    }

    // 비밀번호 확인 일치 검사
    if (name === "passwordConfirm") {
      setUser((prev) => {
        const next = { ...prev, passwordConfirm: value };
        setPwMatch(next.password === value);
        return next;
      });
      return;
    }

    // 닉네임: 한글/영문/숫자만 허용 + 길이 검증
    if (name === "nickname") {
      const cleaned = value.replace(/[^가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z0-9]/g, "");
      if (cleaned !== value) {
        Swal.fire({
          icon: "warning",
          title: "닉네임 입력 오류",
          text: "닉네임에는 한글, 영문, 숫자만 입력 가능합니다.",
          confirmButtonColor: "#38BDF8",
        });
      }
      setCheckNickname(0); // 닉네임 변경 시 중복확인 상태 초기화
      setCheckNicknameMsg(validateNickname(cleaned));
      setUser((prev) => ({ ...prev, nickname: cleaned }));
      return;
    }

    // 이메일 입력 시: 값이 바뀌면 기존 인증 상태 초기화
    if (name === "email") {
      setEmailVerify({ sent: false, verified: false, timer: 0 });
      setEmailCode("");
      clearInterval(timerRef.current);
      setUser((prev) => ({ ...prev, email: value }));
      return;
    }

    // 기타 일반 입력
    setUser((prev) => ({ ...prev, [name]: value }));
  };

  // 아이디 중복체크 (버튼 클릭)
  const ipDupCheck = () => {
    const loginId = user.loginId.trim();

    if (loginId === "") {
      setCheckId(0);
      setCheckMsg("아이디를 입력하세요");
      return;
    }

    const errorMessage = validateId(loginId);
    if (errorMessage !== "") {
      setCheckId(0);
      setCheckMsg(errorMessage);
      return;
    }

    axios
      .get(`${import.meta.env.VITE_BACKSERVER}/users/check-id`, {
        params: { loginId },
      })
      .then((res) => {
        if (res.data === false) {
          setCheckId(1);
          setCheckMsg("사용가능한 아이디입니다");
        } else {
          setCheckId(0);
          setCheckMsg("이미 사용중인 아이디입니다");
        }
      })
      .catch((err) => {
        console.log(err);
        setCheckId(0);
        setCheckMsg("아이디 중복 체크에 실패했습니다.");
      });
  };

  // 닉네임 중복체크 (버튼 클릭)
  const nicknameDupCheck = () => {
    const nickname = user.nickname.trim();

    if (nickname === "") {
      setCheckNickname(0);
      setCheckNicknameMsg("닉네임을 입력하세요");
      return;
    }

    const errorMessage = validateNickname(nickname);
    if (errorMessage !== "") {
      setCheckNickname(0);
      setCheckNicknameMsg(errorMessage);
      return;
    }

    axios
      .get(`${import.meta.env.VITE_BACKSERVER}/users/check-nickname`, {
        params: { nickname },
      })
      .then((res) => {
        if (res.data === false) {
          setCheckNickname(1);
          setCheckNicknameMsg("사용가능한 닉네임입니다");
        } else {
          setCheckNickname(0);
          setCheckNicknameMsg("이미 사용중인 닉네임입니다");
        }
      })
      .catch((err) => {
        console.log(err);
        setCheckNickname(0);
        setCheckNicknameMsg("닉네임 중복 체크에 실패했습니다.");
      });
  };

  // 이메일 인증 관련

  // 타이머 포맷 (mm:ss)
  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // 3분 타이머 시작
  const startEmailTimer = () => {
    clearInterval(timerRef.current);
    setEmailVerify((prev) => ({
      ...prev,
      sent: true,
      verified: false,
      timer: 180,
    }));

    timerRef.current = setInterval(() => {
      setEmailVerify((prev) => {
        if (prev.timer <= 1) {
          clearInterval(timerRef.current);
          return { ...prev, timer: 0, sent: false };
        }
        return { ...prev, timer: prev.timer - 1 };
      });
    }, 1000);
  };

  // 컴포넌트 unmount 시 타이머 정리
  useEffect(() => {
    return () => clearInterval(timerRef.current);
  }, []);

  // 인증번호 전송
  const sendEmailCode = () => {
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

    if (user.email.trim() === "") {
      Swal.fire({
        icon: "warning",
        title: "이메일을 입력해주세요",
        confirmButtonColor: "#38BDF8",
      });
      return;
    }

    if (!emailRegex.test(user.email)) {
      Swal.fire({
        icon: "warning",
        title: "올바르지 않은 이메일 형식입니다",
        text: "이메일 주소를 다시 확인해 주세요.",
        confirmButtonColor: "#38BDF8",
      });
      return;
    }

    axios
      .post(`${import.meta.env.VITE_BACKSERVER}/users/email-verification`, {
        email: user.email.trim(),
      })
      .then(() => {
        Swal.fire({
          icon: "success",
          title: "인증번호가 전송되었습니다",
          text: "이메일을 확인해주세요.",
          confirmButtonColor: "#38BDF8",
        });
        setEmailCode("");
        startEmailTimer();
      })
      .catch((err) => {
        console.log(err);
        Swal.fire({
          icon: "error",
          title: "인증번호 전송에 실패했습니다",
          text: err.response?.data || "잠시 후 다시 시도해주세요.",
          confirmButtonColor: "#38BDF8",
        });
      });
  };

  // 인증번호 확인
  const verifyEmailCode = () => {
    if (emailCode.trim() === "") {
      Swal.fire({
        icon: "warning",
        title: "인증번호를 입력해주세요",
        confirmButtonColor: "#38BDF8",
      });
      return;
    }

    axios
      .post(
        `${import.meta.env.VITE_BACKSERVER}/users/email-verification/confirm`,
        {
          email: user.email.trim(),
          code: emailCode.trim(),
        },
      )
      .then(() => {
        clearInterval(timerRef.current);
        setEmailVerify((prev) => ({
          ...prev,
          sent: false,
          verified: true,
          timer: 0,
        }));
        Swal.fire({
          icon: "success",
          title: "이메일 인증이 완료되었습니다",
          confirmButtonColor: "#38BDF8",
        });
      })
      .catch((err) => {
        console.log(err);
        Swal.fire({
          icon: "error",
          title: "인증번호가 일치하지 않습니다",
          text: err.response?.data || "다시 시도해주세요.",
          confirmButtonColor: "#38BDF8",
        });
      });
  };

  // 이메일을 제외한 필수 항목 전체 검사 → 문제 목록 반환
  const getRequiredFieldErrors = () => {
    const errors = [];

    // 아이디
    if (user.loginId.trim() === "") {
      errors.push("아이디를 입력해주세요.");
    } else {
      const idError = validateId(user.loginId);
      if (idError !== "") {
        errors.push(`아이디: ${idError}`);
      } else if (checkId !== 1) {
        errors.push("아이디 중복 확인을 완료해주세요.");
      }
    }

    // 비밀번호
    if (user.password.trim() === "") {
      errors.push("비밀번호를 입력해주세요.");
    } else {
      const pwError = validatePw(user.password);
      if (pwError !== "안전한 비밀번호입니다.") {
        errors.push(`비밀번호: ${pwError}`);
      }
    }

    // 비밀번호 확인
    if (user.passwordConfirm.trim() === "") {
      errors.push("비밀번호 확인을 입력해주세요.");
    } else if (!pwMatch) {
      errors.push("비밀번호와 비밀번호 확인이 일치하지 않습니다.");
    }

    // 닉네임
    if (user.nickname.trim() === "") {
      errors.push("닉네임을 입력해주세요.");
    } else {
      const nicknameError = validateNickname(user.nickname);
      if (nicknameError !== "") {
        errors.push(`닉네임: ${nicknameError}`);
      } else if (checkNickname !== 1) {
        errors.push("닉네임 중복 확인을 완료해주세요.");
      }
    }

    return errors;
  };

  // 회원가입 제출
  const joinUser = async (e) => {
    e.preventDefault();

    // 이메일을 제외한 필수 항목 전체 검사
    const errors = getRequiredFieldErrors();
    if (errors.length > 0) {
      Swal.fire({
        title: "입력 내용을 확인해주세요",
        html: errors.map((msg) => `• ${msg}`).join("<br/>"),
        icon: "warning",
      });
      return;
    }

    // 이메일 형식 검사 (입력한 경우에만)
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (user.email.trim() !== "" && !emailRegex.test(user.email)) {
      Swal.fire({
        title: "올바르지 않은 이메일 형식입니다",
        text: "이메일 주소를 다시 확인해 주시기 바랍니다",
        icon: "error",
      });
      return;
    }

    // 이메일을 입력했지만 인증을 완료하지 않은 경우
    if (user.email.trim() !== "" && !emailVerify.verified) {
      Swal.fire({
        title: "이메일 인증을 완료해주세요",
        text: "인증번호 전송 후 인증을 완료해야 합니다.",
        icon: "warning",
      });
      return;
    }

    // 이메일을 입력하지 않은 경우 경고 후 선택 유도
    if (user.email.trim() === "") {
      const result = await Swal.fire({
        title: "이메일을 입력하지 않으셨습니다",
        text: "나중에 아이디와 비밀번호를 찾으실 수 없습니다. 그래도 진행하시겠습니까?",
        icon: "warning",
        confirmButtonText: "회원가입 중단",
        confirmButtonColor: "green",
        showDenyButton: true,
        denyButtonText: "아니오, 그냥 가입할게요",
        denyButtonColor: "gray",
      });

      if (result.isConfirmed || !result.isDenied) {
        return;
      }
    }

    const payload = {
      loginId: user.loginId,
      password: user.password,
      nickname: user.nickname,
      email: user.email.trim() === "" ? null : user.email.trim(),
    };

    axios
      .post(`${import.meta.env.VITE_BACKSERVER}/users/join`, payload)
      .then((res) => {
        console.log(res.data);
        Swal.fire({
          title: "회원가입 완료",
          text: "로그인 페이지로 이동합니다.",
          icon: "success",
          confirmButtonText: "로그인 페이지로 이동",
          confirmButtonColor: "green",
        }).then(() => {
          navigate("/users/login");
        });
      })
      .catch((err) => {
        console.log(err);
        const errorMessage =
          err.response?.data || "회원가입 중 오류가 발생했습니다.";
        Swal.fire({
          title: "회원가입에 실패하셨습니다",
          text: errorMessage,
          icon: "warning",
        });
      });
  };

  return (
    <div className={`${styles.join_page} ${styles.join_page_top}`}>
      <div className={`${styles.join_card} ${styles.join_card_wide}`}>
        <div className={styles.join_logo}>
          <div className={styles.join_logo_icon}>
            <img src={logo} alt="MealPlan 로고" />
          </div>
          <span className={styles.join_logo_name}>
            Meal<span>Plan</span>
          </span>
        </div>

        <h2 className={styles.join_heading}>회원가입</h2>
        <p className={styles.join_sub}>식단 기록을 시작해 볼까요?</p>
        <p className={styles.join_required_notice}>
          <span className={styles.required}>*</span>
          <span className={styles.join_required_text}>
            {" "}
            표시는 필수 항목입니다.
          </span>
        </p>

        <form onSubmit={joinUser}>
          {/* 아이디 */}
          <div className={styles.form_group}>
            <label className={styles.form_label}>
              아이디 <span className={styles.required}>*</span>
            </label>
            <div className={styles.email_row}>
              <input
                type="text"
                name="loginId"
                className={`${styles.form_input} ${styles.email_input}`}
                placeholder="영문 + 숫자 혼합, 6~16자"
                value={user.loginId}
                onChange={inputUser}
                autoComplete="username"
              />
              <button
                type="button"
                className={styles.email_send_btn}
                onClick={ipDupCheck}
              >
                중복 확인
              </button>
            </div>
            {checkMsg && (
              <div
                className={
                  checkId === 1 ? styles.form_success : styles.form_error
                }
              >
                {checkMsg}
              </div>
            )}
          </div>

          {/* 닉네임 */}
          <div className={styles.form_group}>
            <label className={styles.form_label}>
              닉네임 <span className={styles.required}>*</span>
            </label>
            <div className={styles.email_row}>
              <input
                type="text"
                name="nickname"
                className={`${styles.form_input} ${styles.email_input}`}
                placeholder="2~8자 (영문·숫자·한글)"
                value={user.nickname}
                onChange={inputUser}
                autoComplete="nickname"
              />
              <button
                type="button"
                className={styles.email_send_btn}
                onClick={nicknameDupCheck}
              >
                중복 확인
              </button>
            </div>
            {checkNicknameMsg && (
              <div
                className={
                  checkNickname === 1 ? styles.form_success : styles.form_error
                }
              >
                {checkNicknameMsg}
              </div>
            )}
          </div>

          {/* 비밀번호 */}
          <div className={styles.form_group}>
            <label className={styles.form_label}>
              비밀번호 <span className={styles.required}>*</span>
            </label>
            <input
              type="password"
              name="password"
              className={styles.form_input}
              placeholder="영문 + 숫자 + 특수문자(!@#$%) 조합, 8~16자"
              value={user.password}
              onChange={inputUser}
              autoComplete="new-password"
            />
            {checkPwMsg && (
              <div
                className={
                  checkPwMsg.includes("안전")
                    ? styles.form_success
                    : styles.form_error
                }
              >
                {checkPwMsg}
              </div>
            )}
          </div>

          {/* 비밀번호 확인 */}
          <div className={styles.form_group}>
            <label className={styles.form_label}>
              비밀번호 확인 <span className={styles.required}>*</span>
            </label>
            <input
              type="password"
              name="passwordConfirm"
              className={styles.form_input}
              placeholder="비밀번호 재입력"
              value={user.passwordConfirm}
              onChange={inputUser}
              autoComplete="new-password"
            />
            {user.passwordConfirm && (
              <div
                className={pwMatch ? styles.form_success : styles.form_error}
              >
                {pwMatch
                  ? "비밀번호가 일치합니다!"
                  : "비밀번호가 일치하지 않습니다."}
              </div>
            )}
          </div>

          {/* 이메일 */}
          <div className={styles.form_group}>
            <label className={styles.form_label}>이메일</label>

            <div className={styles.email_row}>
              <input
                type="email"
                name="email"
                className={`${styles.form_input} ${styles.email_input}`}
                placeholder="이메일 (선택)"
                value={user.email}
                onChange={inputUser}
                autoComplete="email"
                disabled={emailVerify.verified}
              />
              <button
                type="button"
                className={styles.email_send_btn}
                onClick={sendEmailCode}
                disabled={emailVerify.sent || emailVerify.verified}
              >
                {emailVerify.verified
                  ? "인증완료"
                  : emailVerify.sent
                    ? "재전송"
                    : "인증번호 전송"}
              </button>
            </div>

            {/* 인증번호 입력 + 타이머 */}
            {emailVerify.sent && !emailVerify.verified && (
              <div className={styles.email_row} style={{ marginTop: "8px" }}>
                <input
                  type="text"
                  className={`${styles.form_input} ${styles.email_input}`}
                  placeholder="인증번호 입력"
                  value={emailCode}
                  onChange={(e) => setEmailCode(e.target.value)}
                  maxLength={6}
                />
                <span className={styles.email_timer}>
                  {formatTime(emailVerify.timer)}
                </span>
                <button
                  type="button"
                  className={styles.email_send_btn}
                  onClick={verifyEmailCode}
                >
                  확인
                </button>
              </div>
            )}

            {emailVerify.verified && (
              <div className={styles.form_success}>
                이메일 인증이 완료되었습니다.
              </div>
            )}

            <div className={styles.form_hint}>
              이메일은 필수가 아닌 선택 사항입니다. (아이디·비밀번호 찾기에
              사용됩니다)
            </div>
          </div>

          <button className={styles.join_submit} type="submit">
            회원가입
          </button>
        </form>

        <div className={styles.join_footer}>
          <span>이미 계정이 있으신가요? </span>
          <button
            type="button"
            className={styles.login_link_btn}
            onClick={() => navigate("/users/login")}
          >
            로그인
          </button>
        </div>
      </div>
    </div>
  );
}

export default JoinPage;
