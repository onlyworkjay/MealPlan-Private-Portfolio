import { useState } from "react";
import "./MyPage.css";

const MENU = [
  { key: "posts", icon: "📋", label: "내 게시물" },
  { key: "profile", icon: "👤", label: "내 정보 관리" },
  { key: "password", icon: "🔐", label: "비밀번호 변경" },
  { key: "withdraw", icon: "🚪", label: "회원 탈퇴" },
];
const MOCK_MY_POSTS = [
  {
    id: 1,
    title: "오늘 점심 닭가슴살 샐러드",
    date: "2025.06.11",
    calories: 420,
  },
  {
    id: 2,
    title: "단백질 스무디 아침 루틴",
    date: "2025.06.10",
    calories: 290,
  },
  {
    id: 3,
    title: "저녁은 가볍게 그릭 요거트",
    date: "2025.06.09",
    calories: 180,
  },
];

export default function MyPage({ user, onLogout, onNavigate }) {
  const [tab, setTab] = useState("posts");

  return (
    <div className="page">
      <div className="wrap">
        <div className="mypage-layout">
          <div className="mypage-sidebar">
            <div className="profile-card">
              <div className="profile-avatar">{user?.nickname?.[0] ?? "U"}</div>
              <div className="profile-name">{user?.nickname ?? "사용자"}</div>
              <div className="profile-email">
                {user?.email ?? "이메일 미등록"}
              </div>
            </div>
            <nav className="mypage-menu">
              {MENU.map((m) => (
                <a
                  key={m.key}
                  href={`#${m.key}`}
                  className={tab === m.key ? "active" : ""}
                  onClick={(e) => {
                    e.preventDefault();
                    setTab(m.key);
                  }}
                >
                  {m.icon} {m.label}
                </a>
              ))}
              <button
                className="mypage-logout"
                onClick={() => {
                  onLogout();
                  onNavigate("feed");
                }}
              >
                🚪 로그아웃
              </button>
            </nav>
          </div>

          <div>
            {tab === "posts" && (
              <>
                <div className="page-header">
                  <h1>내 게시물</h1>
                  <p>내가 작성한 식단 기록 모아보기</p>
                </div>
                <div className="my-posts-list">
                  {MOCK_MY_POSTS.map((p) => (
                    <div className="my-post-item" key={p.id}>
                      <div>
                        <div className="my-post-title">{p.title}</div>
                        <div className="my-post-date">{p.date}</div>
                      </div>
                      <div className="my-post-right">
                        <span className="my-post-cal">
                          🔥 {p.calories} kcal
                        </span>
                        <button className="btn btn-ghost btn-sm">수정</button>
                        <button className="btn btn-sm btn-delete">삭제</button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {tab === "profile" && (
              <>
                <div className="page-header">
                  <h1>내 정보 관리</h1>
                </div>
                <div className="write-card" style={{ maxWidth: "100%" }}>
                  {[
                    {
                      label: "닉네임",
                      placeholder: "변경할 닉네임",
                      hint: "2~8자 (영문·숫자·한글)",
                    },
                    { label: "이메일", placeholder: "이메일 주소", hint: "" },
                  ].map((f) => (
                    <div className="form-group" key={f.label}>
                      <label className="form-label">{f.label}</label>
                      <input
                        className="form-input"
                        placeholder={f.placeholder}
                      />
                      {f.hint && <div className="form-hint">{f.hint}</div>}
                    </div>
                  ))}
                  <button className="btn btn-primary">저장하기</button>
                </div>
              </>
            )}

            {tab === "password" && (
              <>
                <div className="page-header">
                  <h1>비밀번호 변경</h1>
                </div>
                <div className="write-card" style={{ maxWidth: "100%" }}>
                  {["현재 비밀번호", "새 비밀번호", "새 비밀번호 확인"].map(
                    (l) => (
                      <div className="form-group" key={l}>
                        <label className="form-label">
                          {l} <span className="required">*</span>
                        </label>
                        <input
                          type="password"
                          className="form-input"
                          placeholder={l}
                        />
                      </div>
                    ),
                  )}
                  <div className="form-hint">
                    최소 8글자, 최대 16글자 (영문·숫자·특수문자 필수)
                  </div>
                  <button className="btn btn-primary" style={{ marginTop: 12 }}>
                    변경하기
                  </button>
                </div>
              </>
            )}

            {tab === "withdraw" && (
              <div className="withdraw-section">
                <div className="withdraw-icon">😢</div>
                <div className="withdraw-title">정말 탈퇴하시겠어요?</div>
                <div className="withdraw-desc">
                  탈퇴 시 모든 게시물과 기록이 삭제되며 복구할 수 없습니다.
                </div>
                <button
                  className="btn btn-sm btn-delete"
                  onClick={() => {
                    onLogout();
                    onNavigate("feed");
                  }}
                >
                  회원 탈퇴하기
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
