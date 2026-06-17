import { useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import styles from "./MyPage.module.css";
import EmailAuth from "../emailauth/EmailAuth";
import defaultProfile from "../assets/default-profile.svg";
import { useAuth } from "../contexts/AuthContext";

const NICKNAME_PATTERN = /^[a-zA-Z0-9가-힣]{2,8}$/;
const PW_PATTERN = /^[a-zA-Z0-9!@#$%]{8,16}$/;

const MENU = [
  { key: "posts", label: "내 게시물" },
  { key: "profile", label: "내 정보 관리" },
  { key: "password", label: "비밀번호 변경" },
  { key: "withdraw", label: "회원 탈퇴" },
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
  const { token, updateUser } = useAuth();
  const [tab, setTab] = useState("posts");

  // 프로필 사진
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [clearImage, setClearImage] = useState(false);

  // 닉네임 변경 + 중복확인
  const [nickname, setNickname] = useState("");
  const [nicknameChecked, setNicknameChecked] = useState(false);
  const [nicknameAvailable, setNicknameAvailable] = useState(null);

  // 이메일 변경 + 인증
  const [email, setEmail] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);

  // 비밀번호 변경
  const [pwStep, setPwStep] = useState(1);
  const [currentPassword, setCurrentPassword] = useState("");
  const [currentPasswordError, setCurrentPasswordError] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMatch, setPasswordMatch] = useState(null);

  // 회원 탈퇴
  const [withdrawStep, setWithdrawStep] = useState(1);
  const [withdrawPassword, setWithdrawPassword] = useState("");
  const [withdrawPasswordError, setWithdrawPasswordError] = useState("");

  // 프로필 사진 변경
  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setClearImage(false);
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result);
    reader.readAsDataURL(file);
  };

  // 기본 이미지로 변경
  const handleResetPhoto = () => {
    setPhotoFile(null);
    setClearImage(true);
    setPhotoPreview(defaultProfile);
  };

  const checkNickname = () => {
    const trimmed = nickname.trim();
    if (!NICKNAME_PATTERN.test(trimmed)) {
      Swal.fire({
        icon: "warning",
        title: "닉네임 형식을 확인해주세요",
        text: "2~8자, 영문·숫자·한글만 가능합니다",
        confirmButtonColor: "#38BDF8",
      });
      return;
    }

    axios
      .get(`${import.meta.env.VITE_BACKSERVER}/users/check-nickname`, {
        params: { nickname: trimmed },
      })
      .then((res) => {
        setNicknameChecked(true);
        setNicknameAvailable(!res.data);
      })
      .catch(() => {
        Swal.fire({
          icon: "error",
          title: "중복 확인에 실패했습니다",
          confirmButtonColor: "#38BDF8",
        });
      });
  };

  const handleSaveProfile = () => {
    if (nickname.trim() && !nicknameChecked) {
      Swal.fire({
        icon: "warning",
        title: "닉네임 중복확인을 먼저 진행해주세요",
        confirmButtonColor: "#38BDF8",
      });
      return;
    }

    if (nickname.trim() && nicknameChecked && !nicknameAvailable) {
      Swal.fire({
        icon: "warning",
        title: "사용할 수 없는 닉네임입니다",
        confirmButtonColor: "#38BDF8",
      });
      return;
    }

    if (email.trim() && !emailVerified) {
      Swal.fire({
        icon: "warning",
        title: "이메일 인증을 먼저 완료해주세요",
        confirmButtonColor: "#38BDF8",
      });
      return;
    }

    const formData = new FormData();
    if (nickname.trim()) formData.append("nickname", nickname.trim());
    if (email.trim()) formData.append("email", email.trim());
    formData.append("clearProfileImage", clearImage);
    if (photoFile) formData.append("profileImage", photoFile);

    axios
      .post(`${import.meta.env.VITE_BACKSERVER}/users/profile`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        updateUser(res.data);
        setNickname("");
        setNicknameChecked(false);
        setNicknameAvailable(null);
        setEmail("");
        setEmailVerified(false);
        setPhotoFile(null);
        setClearImage(false);
        setPhotoPreview(null);
        Swal.fire({
          icon: "success",
          title: "저장되었습니다",
          confirmButtonColor: "#38BDF8",
        });
      })
      .catch((err) => {
        Swal.fire({
          icon: "error",
          title: "저장에 실패했습니다",
          text: err.response?.data || "잠시 후 다시 시도해주세요.",
          confirmButtonColor: "#38BDF8",
        });
      });
  };

  const handleVerifyCurrentPassword = () => {
    if (!currentPassword.trim()) {
      setCurrentPasswordError("현재 비밀번호를 입력해주세요");
      return;
    }

    axios
      .post(`${import.meta.env.VITE_BACKSERVER}/users/login`, {
        loginId: user?.loginId,
        password: currentPassword,
      })
      .then(() => {
        setCurrentPasswordError("");
        setPwStep(2);
      })
      .catch(() => {
        setCurrentPasswordError("비밀번호가 일치하지 않습니다");
      });
  };

  const handleChangePassword = () => {
    if (!PW_PATTERN.test(newPassword)) {
      Swal.fire({
        icon: "warning",
        title: "비밀번호 형식을 확인해주세요",
        text: "영문·숫자·특수문자(!@#$%) 조합 8~16자여야 합니다",
        confirmButtonColor: "#38BDF8",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      Swal.fire({
        icon: "warning",
        title: "새 비밀번호가 일치하지 않습니다",
        confirmButtonColor: "#38BDF8",
      });
      return;
    }

    Swal.fire({
      icon: "success",
      title: "비밀번호 변경이 성공되었습니다",
      confirmButtonColor: "#38BDF8",
    });
  };

  const handleVerifyWithdrawPassword = () => {
    if (!withdrawPassword.trim()) {
      setWithdrawPasswordError("비밀번호를 입력해주세요");
      return;
    }

    axios
      .post(`${import.meta.env.VITE_BACKSERVER}/users/login`, {
        loginId: user?.loginId,
        password: withdrawPassword,
      })
      .then(() => {
        setWithdrawPasswordError("");
        setWithdrawStep(2);
      })
      .catch(() => {
        setWithdrawPasswordError("비밀번호가 일치하지 않습니다");
      });
  };

  return (
    <div className="page">
      <div className="wrap">
        <div className={styles.mypage_layout}>
          <div className={styles.mypage_sidebar}>
            <div className={styles.profile_card}>
              <div className={styles.profile_avatar}>
                <img src={user?.profileImg || defaultProfile} alt="프로필" />
              </div>
              <div className={styles.profile_name}>
                {user?.nickname ?? "사용자"}
              </div>
              <div className={styles.profile_email}>
                {user?.email ?? "이메일 미등록"}
              </div>
            </div>
            <nav className={styles.mypage_menu}>
              {MENU.map((m) => (
                <a
                  key={m.key}
                  href={`#${m.key}`}
                  className={tab === m.key ? styles.active : ""}
                  onClick={(e) => {
                    e.preventDefault();
                    if (tab === "profile" && m.key !== "profile") {
                      // 저장 안 하고 떠나는 거라서 임시로 골랐던 값들 전부 버리기
                      setPhotoPreview(null);
                      setPhotoFile(null);
                      setClearImage(false);
                      setNickname("");
                      setNicknameChecked(false);
                      setNicknameAvailable(null);
                      setEmail("");
                      setEmailVerified(false);
                    }
                    setTab(m.key);
                  }}
                >
                  {m.label}
                </a>
              ))}
              <button
                className={styles.mypage_logout}
                onClick={() => {
                  onLogout();
                  onNavigate("feed");
                }}
              >
                로그아웃
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
                <div className={styles.my_posts_list}>
                  {MOCK_MY_POSTS.map((p) => (
                    <div className={styles.my_post_item} key={p.id}>
                      <div>
                        <div className={styles.my_post_title}>{p.title}</div>
                        <div className={styles.my_post_date}>{p.date}</div>
                      </div>
                      <div className={styles.my_post_right}>
                        <span className={styles.my_post_cal}>
                          🔥 {p.calories} kcal
                        </span>
                        <button className="btn btn-ghost btn-sm">수정</button>
                        <button className={`btn btn-sm ${styles.btn_delete}`}>
                          삭제
                        </button>
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
                  <div className={styles.photo_upload_wrap}>
                    <div className={styles.photo_preview}>
                      <img
                        src={photoPreview || user?.profileImg || defaultProfile}
                        alt="프로필 사진"
                      />
                    </div>
                    <div className={styles.photo_upload_actions}>
                      <label className={styles.photo_upload_btn}>
                        프로필 사진 변경
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoChange}
                          hidden
                        />
                      </label>
                      <button
                        type="button"
                        className={styles.photo_reset_btn}
                        onClick={handleResetPhoto}
                      >
                        기본 이미지로 변경
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className={styles.field_label}>닉네임</label>
                    <div className={styles.input_check_row}>
                      <input
                        className="form-input"
                        placeholder="변경할 닉네임을 적어주세요."
                        value={nickname}
                        onChange={(e) => {
                          setNickname(e.target.value);
                          setNicknameChecked(false);
                          setNicknameAvailable(null);
                        }}
                      />
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={checkNickname}
                      >
                        중복 확인
                      </button>
                    </div>
                    <div className="form-hint">
                      변경 가능 범위: 2~8자 (영문·숫자·한글만 가능)
                    </div>
                    {nicknameChecked && (
                      <div
                        className={
                          nicknameAvailable
                            ? styles.check_ok
                            : styles.check_fail
                        }
                      >
                        {nicknameAvailable
                          ? "사용 가능한 닉네임입니다"
                          : "이미 사용중인 닉네임입니다"}
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <EmailAuth
                      email={email}
                      setEmail={setEmail}
                      onVerified={setEmailVerified}
                      disableSend={!user?.email}
                    />
                    {!user?.email && (
                      <div className={`form-hint ${styles.warning_hint}`}>
                        이메일 없이 가입하셨기 때문에 인증번호 발송이
                        비활성화되어 있습니다.
                      </div>
                    )}
                  </div>

                  <button
                    className="btn btn-primary"
                    onClick={handleSaveProfile}
                  >
                    저장하기
                  </button>
                </div>
              </>
            )}

            {tab === "password" && (
              <>
                <div className="page-header">
                  <h1>비밀번호 변경</h1>
                </div>
                <div className="write-card" style={{ maxWidth: "100%" }}>
                  {pwStep === 1 ? (
                    <>
                      <div className="form-group">
                        <label className="form-label">
                          현재 비밀번호 <span className="required">*</span>
                        </label>
                        <input
                          type="password"
                          className="form-input"
                          placeholder="현재 비밀번호"
                          value={currentPassword}
                          onChange={(e) => {
                            setCurrentPassword(e.target.value);
                            setCurrentPasswordError("");
                          }}
                        />
                        {currentPasswordError && (
                          <div className={styles.check_fail}>
                            {currentPasswordError}
                          </div>
                        )}
                      </div>
                      <button
                        className="btn btn-primary"
                        style={{ marginTop: 12 }}
                        onClick={handleVerifyCurrentPassword}
                      >
                        확인
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="form-group">
                        <label className="form-label">
                          새 비밀번호 <span className="required">*</span>
                        </label>
                        <input
                          type="password"
                          className="form-input"
                          placeholder="새 비밀번호"
                          value={newPassword}
                          onChange={(e) => {
                            setNewPassword(e.target.value);
                            setPasswordMatch(
                              confirmPassword
                                ? e.target.value === confirmPassword
                                : null,
                            );
                          }}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">
                          새 비밀번호 확인 <span className="required">*</span>
                        </label>
                        <input
                          type="password"
                          className="form-input"
                          placeholder="새 비밀번호 확인"
                          value={confirmPassword}
                          onChange={(e) => {
                            const value = e.target.value;
                            setConfirmPassword(value);
                            setPasswordMatch(
                              value ? newPassword === value : null,
                            );
                          }}
                        />
                        {passwordMatch === true && (
                          <div className={styles.match_ok}>
                            비밀번호가 일치합니다
                          </div>
                        )}
                        {passwordMatch === false && (
                          <div className={styles.check_fail}>
                            비밀번호가 일치하지 않습니다
                          </div>
                        )}
                      </div>
                      <div className="form-hint">
                        최소 8글자, 최대 16글자 (영문·숫자·특수문자 필수)
                      </div>
                      <button
                        className="btn btn-primary"
                        style={{ marginTop: 12 }}
                        onClick={handleChangePassword}
                      >
                        변경하기
                      </button>
                    </>
                  )}
                </div>
              </>
            )}

            {tab === "withdraw" && (
              <>
                {withdrawStep === 1 ? (
                  <>
                    <div className="page-header">
                      <h1>회원 탈퇴</h1>
                    </div>
                    <div className="write-card" style={{ maxWidth: "100%" }}>
                      <div className="form-group">
                        <label className="form-label">
                          현재 비밀번호 <span className="required">*</span>
                        </label>
                        <input
                          type="password"
                          className="form-input"
                          placeholder="현재 비밀번호"
                          value={withdrawPassword}
                          onChange={(e) => {
                            setWithdrawPassword(e.target.value);
                            setWithdrawPasswordError("");
                          }}
                        />
                        {withdrawPasswordError && (
                          <div className={styles.check_fail}>
                            {withdrawPasswordError}
                          </div>
                        )}
                      </div>
                      <button
                        className="btn btn-primary"
                        style={{ marginTop: 12 }}
                        onClick={handleVerifyWithdrawPassword}
                      >
                        확인
                      </button>
                    </div>
                  </>
                ) : (
                  <div className={styles.withdraw_section}>
                    <div className={styles.withdraw_icon}>😢</div>
                    <div className={styles.withdraw_title}>
                      정말 탈퇴하시겠어요?
                    </div>
                    <div className={styles.withdraw_desc}>
                      탈퇴 시 모든 게시물과 기록이 삭제되며 복구할 수 없습니다.
                    </div>
                    <button
                      className={`btn btn-sm ${styles.btn_delete}`}
                      onClick={() => {
                        onLogout();
                        onNavigate("feed");
                      }}
                    >
                      회원 탈퇴하기
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
