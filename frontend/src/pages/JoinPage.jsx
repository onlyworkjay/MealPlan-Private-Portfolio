import { useState } from "react";
import styles from "./JoinPage.module.css";

export default function JoinPage({ onNavigate }) {
  const [form, setForm] = useState({
    email: "",
    id: "",
    nickname: "",
    password: "",
    passwordConfirm: "",
  });
  const [pwMatch, setPwMatch] = useState(true);

  const set = (key) => (e) => {
    const value = e.target.value;
    setForm((f) => {
      const updated = { ...f, [key]: value };
      if (key === "passwordConfirm") {
        setPwMatch(updated.password === value);
      }
      if (key === "password") {
        setPwMatch(
          updated.passwordConfirm === "" || updated.passwordConfirm === value,
        );
      }
      return updated;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onNavigate("login");
  };

  const FIELDS = [
    {
      key: "email",
      label: "이메일",
      type: "email",
      required: false,
      placeholder: "이메일 (선택)",
      hint: "입력하지 않아도 가입 가능합니다",
    },
    {
      key: "id",
      label: "아이디",
      type: "text",
      required: true,
      placeholder: "영문+숫자 6~16자",
      hint: "최소 6글자, 최대 16글자 (영문·숫자 필수)",
    },
    {
      key: "nickname",
      label: "닉네임",
      type: "text",
      required: true,
      placeholder: "2~8자 (영문·숫자·한글)",
      hint: "최소 2글자, 최대 8글자 (영문, 숫자, 한글만)",
    },
    {
      key: "password",
      label: "비밀번호",
      type: "password",
      required: true,
      placeholder: "영문+숫자+특수문자 8~16자",
      hint: "최소 8글자, 최대 16글자 (영문·숫자·특수문자 필수)",
    },
    {
      key: "passwordConfirm",
      label: "비밀번호 확인",
      type: "password",
      required: true,
      placeholder: "비밀번호 재입력",
      hint: "",
    },
  ];

  return (
    <div className={`${styles["join-page"]} ${styles["join-page--top"]}`}>
      <div className={`${styles["join-card"]} ${styles["join-card--wide"]}`}>
        <div className={styles["join-logo"]}>
          <div className={styles["join-logo-icon"]}>🥗</div>
          <span className={styles["join-logo-name"]}>
            Meal<span>Plan</span>
          </span>
        </div>
        <h2 className={styles["join-heading"]}>회원가입</h2>
        <p className={styles["join-sub"]}>식단 기록을 시작해 볼까요?</p>
        <p className={styles["join-required-notice"]}>
          <span className={styles["required"]}>*</span>
          <span className={styles["join-required-text"]}>
            {" "}
            표시는 필수 항목입니다.
          </span>
        </p>
        <form onSubmit={handleSubmit}>
          {FIELDS.map(({ key, label, type, required, placeholder, hint }) => (
            <div className={styles["form-group"]} key={key}>
              <label className={styles["form-label"]}>
                {label}{" "}
                {required && <span className={styles["required"]}>*</span>}
              </label>
              <input
                type={type}
                className={styles["form-input"]}
                placeholder={placeholder}
                value={form[key]}
                onChange={set(key)}
                required={required}
              />
              {hint && <div className={styles["form-hint"]}>{hint}</div>}
              {key === "id" && form.id && (
                <div
                  className={`${styles["form-hint"]} ${styles["form-hint--info"]}`}
                >
                  ※ 이메일, 아이디, 닉네임은 중복 안 됩니다
                </div>
              )}
              {key === "passwordConfirm" && form.passwordConfirm && (
                <div
                  className={
                    pwMatch ? styles["form-success"] : styles["form-error"]
                  }
                >
                  {pwMatch
                    ? "비밀번호가 일치합니다!"
                    : "비밀번호가 일치하지 않습니다."}
                </div>
              )}
            </div>
          ))}
          <button
            type="submit"
            className={`btn btn-primary ${styles["join-submit"]}`}
          >
            가입하기
          </button>
        </form>
        <p className={styles["join-footer"]}>
          이미 계정이 있으신가요?{" "}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onNavigate("login");
            }}
          >
            로그인
          </a>
        </p>
      </div>
    </div>
  );
}
