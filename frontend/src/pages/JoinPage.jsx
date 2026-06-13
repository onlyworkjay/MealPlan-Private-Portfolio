import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./JoinPage.module.css";
import Swal from "sweetalert2";

function JoinPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    id: "",
    nickname: "",
    password: "",
    passwordConfirm: "",
  });
  const [pwMatch, setPwMatch] = useState(true);

  const set = (key) => (e) => {
    let value = e.target.value;

    {
      /* 닉네임 작성 시 한글, 영문, 숫자가 아니면 SWAL 출력 */
    }
    if (key === "nickname") {
      const cleaned = value.replace(/[^가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z0-9]/g, "");
      if (cleaned !== value) {
        Swal.fire({
          icon: "warning",
          title: "닉네임 입력 오류",
          text: "닉네임에는 한글, 영문, 숫자만 입력 가능합니다.",
          confirmButtonColor: "#38BDF8",
        });
      }
      value = cleaned;
    }

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
    navigate("/users/login");
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
      placeholder: "영문 + 숫자 6~16자",
      hint: "최소 6글자, 최대 16글자 (영문·숫자 혼합 필수)",
    },
    {
      key: "nickname",
      label: "닉네임",
      type: "text",
      required: true,
      placeholder: "2~8자 (영문·숫자·한글)",
      hint: "최소 2글자, 최대 8글자 (영문, 숫자, 한글만 허용)",
    },
    {
      key: "password",
      label: "비밀번호",
      type: "password",
      required: true,
      placeholder: "영문 + 숫자 + 특수문자 8~16자",
      hint: "최소 8글자, 최대 16글자 (영문·숫자·특수문자 혼합 필수)",
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
    <div className={`${styles.join_page} ${styles.join_page_top}`}>
      <div className={`${styles.join_card} ${styles.join_card_wide}`}>
        <div className={styles.join_logo}>
          <div className={styles.join_logo_icon}>🥗</div>
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
        <form onSubmit={handleSubmit}>
          {FIELDS.map(({ key, label, type, required, placeholder, hint }) => (
            <div className={styles.form_group} key={key}>
              <label className={styles.form_label}>
                {label} {required && <span className={styles.required}>*</span>}
              </label>
              <input
                type={type}
                className={styles.form_input}
                placeholder={placeholder}
                value={form[key]}
                onChange={set(key)}
                required={required}
              />
              {hint && <div className={styles.form_hint}>{hint}</div>}
              {key === "id" && form.id && (
                <div className={`${styles.form_hint} ${styles.form_hint_info}`}>
                  ※ 이메일, 아이디, 닉네임은 중복 안 됩니다
                </div>
              )}
              {key === "passwordConfirm" && form.passwordConfirm && (
                <div
                  className={pwMatch ? styles.form_success : styles.form_error}
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
            className={`btn btn-primary ${styles.join_submit}`}
          >
            가입하기
          </button>
        </form>
        <p className={styles.join_footer}>
          이미 계정이 있으신가요?{" "}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              navigate("/users/login");
            }}
          >
            로그인
          </a>
        </p>
      </div>
    </div>
  );
}

export default JoinPage;
