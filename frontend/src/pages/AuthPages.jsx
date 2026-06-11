import { useState } from "react";
import "../styles/AuthPages.css";

export function LoginPage({ onNavigate, onLogin }) {
  const [form, setForm] = useState({ id: "", password: "" });
  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin({ nickname: form.id || "사용자" });
    onNavigate("feed");
  };

  return (
    <div className="page auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">🥗</div>
          <span className="auth-logo-name">
            Meal<span>Plan</span>
          </span>
        </div>
        <h2 className="auth-heading">환영합니다!</h2>
        <p className="auth-sub">아이디와 비밀번호를 입력해 로그인하세요</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">
              아이디 <span className="required">*</span>
            </label>
            <input
              className="form-input"
              placeholder="아이디 입력"
              value={form.id}
              onChange={(e) => setForm((f) => ({ ...f, id: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label className="form-label">
              비밀번호 <span className="required">*</span>
            </label>
            <input
              type="password"
              className="form-input"
              placeholder="비밀번호 입력"
              value={form.password}
              onChange={(e) =>
                setForm((f) => ({ ...f, password: e.target.value }))
              }
            />
          </div>
          <button type="submit" className="btn btn-primary auth-submit">
            로그인
          </button>
        </form>
        <p className="auth-footer">
          아직 계정이 없으신가요?{" "}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onNavigate("register");
            }}
          >
            회원가입
          </a>
        </p>
      </div>
    </div>
  );
}

export function RegisterPage({ onNavigate }) {
  const [form, setForm] = useState({
    email: "",
    id: "",
    nickname: "",
    password: "",
    passwordConfirm: "",
  });
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
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
    <div className="page auth-page auth-page--top">
      <div className="auth-card auth-card--wide">
        <div className="auth-logo">
          <div className="auth-logo-icon">🥗</div>
          <span className="auth-logo-name">
            Meal<span>Plan</span>
          </span>
        </div>
        <h2 className="auth-heading">회원가입</h2>
        <p className="auth-sub">식단 기록을 시작해 볼까요?</p>
        <form onSubmit={handleSubmit}>
          {FIELDS.map(({ key, label, type, required, placeholder, hint }) => (
            <div className="form-group" key={key}>
              <label className="form-label">
                {label} {required && <span className="required">*</span>}
              </label>
              <input
                type={type}
                className="form-input"
                placeholder={placeholder}
                value={form[key]}
                onChange={set(key)}
                required={required}
              />
              {hint && <div className="form-hint">{hint}</div>}
              {key === "id" && form.id && (
                <div className="form-hint form-hint--info">
                  ※ 이메일, 아이디, 닉네임은 중복 안 됩니다
                </div>
              )}
            </div>
          ))}
          <button type="submit" className="btn btn-primary auth-submit">
            가입하기
          </button>
        </form>
        <p className="auth-footer">
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
