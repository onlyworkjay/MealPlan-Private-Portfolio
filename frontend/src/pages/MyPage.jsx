import { useEffect, useState } from "react";
import axios from "axios";
import styles from "./MyPage.module.css";
import EmailAuth from "../emailauth/EmailAuth";
import defaultProfile from "../assets/default-profile.svg";
import { useAuth } from "../contexts/AuthContext";
import { showSwal } from "../utils/SwalAlert";

const NICKNAME_PATTERN = /^[a-zA-Z0-9가-힣]{2,8}$/;
const PW_PATTERN = /^[a-zA-Z0-9!@#$%]{8,16}$/;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const POSTS_PER_PAGE = 10;

const MENU = [
  { key: "posts", label: "내 피드" },
  { key: "profile", label: "내 정보 관리" },
  { key: "password", label: "비밀번호 변경" },
  { key: "withdraw", label: "회원 탈퇴" },
];

// 날짜+시간을 "YYYY.MM.DD HH:MM" 형식으로 표시 (초는 표시 안 함)
const formatDateTime = (isoString) => {
  if (!isoString) return "";
  const d = new Date(isoString);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}.${mm}.${dd} ${hh}:${min}`;
};

export default function MyPage({ user, onLogout, onNavigate }) {
  const { token, updateUser } = useAuth();
  const [tab, setTab] = useState("posts");

  // 내 피드를 불러옴
  const [myPosts, setMyPosts] = useState([]);
  const [myPostsLoading, setMyPostsLoading] = useState(false);

  // 내 피드 검색 / 정렬 / 페이지네이션
  const [postSearch, setPostSearch] = useState("");
  const [postSortOrder, setPostSortOrder] = useState("latest"); // "latest" | "oldest"
  const [currentPage, setCurrentPage] = useState(1);

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

  // 내 피드 목록을 불러오는 함수 (탭 진입 시, 그리고 삭제 후 갱신할 때도 재사용)
  // 정렬에 필요한 원본 날짜(rawDate)도 함께 보관 (화면 표시용 date는 포맷된 문자열)
  const fetchMyPosts = () => {
    setMyPostsLoading(true);
    axios
      .get(`${import.meta.env.VITE_BACKSERVER}/writes/my`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setMyPosts(
          res.data.map((w) => ({
            id: w.writeId,
            title: w.title,
            date: formatDateTime(w.createdAt),
            rawDate: w.createdAt,
            calories: w.calories,
          })),
        );
      })
      .catch(() => {
        showSwal({
          type: "error",
          title: "게시물을 불러오지 못했습니다",
        });
      })
      .finally(() => setMyPostsLoading(false));
  };

  // 내 피드 탭으로 들어올 때마다 최신 목록을 다시 불러옴 (방금 등록한 글도 바로 보이도록)
  // token이 아직 로딩되지 않은 시점(null/undefined)에는 요청을 보내지 않음
  // (보내면 인증 없이 나가서 401이 뜨고, 곧이어 token이 채워지면 다시 정상 호출되는 식으로 두 번 실행됨)
  useEffect(() => {
    if (tab !== "posts" || !token) return;
    fetchMyPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, token]);

  // 검색 필터 (제목 기준)
  const filteredPosts = myPosts.filter(
    (p) => !postSearch || p.title.includes(postSearch),
  );

  // 정렬 (최신순 / 오래된순)
  const sortedPosts = [...filteredPosts].sort((a, b) => {
    const diff = new Date(a.rawDate) - new Date(b.rawDate);
    return postSortOrder === "latest" ? -diff : diff;
  });

  // 검색어/정렬/게시물 개수가 바뀌면 1페이지로 초기화
  useEffect(() => {
    setCurrentPage(1);
  }, [postSearch, postSortOrder, myPosts.length]);

  // 페이지네이션 계산 (검색/정렬이 적용된 결과 기준)
  const totalPages = Math.max(1, Math.ceil(sortedPosts.length / POSTS_PER_PAGE));
  const paginatedPosts = sortedPosts.slice(
    (currentPage - 1) * POSTS_PER_PAGE,
    currentPage * POSTS_PER_PAGE,
  );

  const goToPage = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  // 게시물 삭제 - 확인 팝업 후 실제 백엔드(/writes/{id}) 삭제 요청, 성공 시 목록에서 바로 제거
  const handleDeletePost = (id) => {
    showSwal({
      type: "warning",
      title: "정말 삭제하시겠습니까?",
      text: "삭제한 게시물은 복구할 수 없습니다.",
      confirmButtonText: "삭제",
      confirmButtonColor: "#ef4444",
      showCancelButton: true,
      cancelButtonText: "취소",
    }).then((result) => {
      if (!result.isConfirmed) return;

      axios
        .delete(`${import.meta.env.VITE_BACKSERVER}/writes/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then(() => {
          setMyPosts((prev) => prev.filter((p) => p.id !== id));
          showSwal({ type: "success", title: "삭제되었습니다" });
        })
        .catch((err) => {
          showSwal({
            type: "error",
            title: "삭제에 실패했습니다",
            text: err.response?.data || "잠시 후 다시 시도해주세요.",
          });
        });
    });
  };

  // 엔터 키 입력 시 지정한 동작 실행 (비밀번호 입력칸에서 버튼 안 눌러도 넘어가게)
  const handleEnterKey = (e, callback) => {
    if (e.key === "Enter") {
      e.preventDefault();
      callback();
    }
  };

  // 프로필 사진 변경 - JPG, JPEG, PNG, WEBP 형식만 허용
  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      showSwal({
        type: "warning",
        title: "지원하지 않는 파일 형식입니다",
        text: "JPG, JPEG, PNG, WEBP 형식의 이미지만 업로드할 수 있습니다.",
      });
      e.target.value = ""; // 같은 파일을 다시 선택해도 onChange가 발생하도록 input 값 초기화
      return;
    }

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
      showSwal({
        type: "warning",
        title: "닉네임 형식을 확인해주세요",
        text: "2~8자, 영문·숫자·한글만 가능합니다",
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
        showSwal({ type: "error", title: "중복 확인에 실패했습니다" });
      });
  };

  const handleSaveProfile = () => {
    if (nickname.trim() && !nicknameChecked) {
      showSwal({
        type: "warning",
        title: "닉네임 중복확인을 먼저 진행해주세요",
      });
      return;
    }

    if (nickname.trim() && nicknameChecked && !nicknameAvailable) {
      showSwal({ type: "warning", title: "사용할 수 없는 닉네임입니다" });
      return;
    }

    if (email.trim() && !emailVerified) {
      showSwal({
        type: "warning",
        title: "이메일 인증을 먼저 완료해주세요",
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
        showSwal({ type: "success", title: "저장되었습니다" });
      })
      .catch((err) => {
        showSwal({
          type: "error",
          title: "저장에 실패했습니다",
          text: err.response?.data || "잠시 후 다시 시도해주세요.",
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
      showSwal({
        type: "warning",
        title: "비밀번호 형식을 확인해주세요",
        text: "영문·숫자·특수문자(!@#$%) 조합 8~16자여야 합니다",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      showSwal({ type: "warning", title: "새 비밀번호가 일치하지 않습니다" });
      return;
    }

    axios
      .post(
        `${import.meta.env.VITE_BACKSERVER}/users/password`,
        { currentPassword, newPassword },
        { headers: { Authorization: `Bearer ${token}` } },
      )
      .then(() => {
        showSwal({
          type: "success",
          title: "비밀번호 변경이 성공되었습니다",
        });
        setPwStep(1);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setPasswordMatch(null);
      })
      .catch((err) => {
        showSwal({
          type: "error",
          title: "비밀번호 변경에 실패했습니다",
          text: err.response?.data || "잠시 후 다시 시도해주세요.",
        });
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

  const handleWithdraw = () => {
    axios
      .post(
        `${import.meta.env.VITE_BACKSERVER}/users/withdraw`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      )
      .then(() => {
        showSwal({
          type: "success",
          title: "회원 탈퇴가 정상적으로 처리되었습니다",
        }).then(() => {
          onLogout();
          onNavigate("feed");
        });
      })
      .catch((err) => {
        showSwal({
          type: "error",
          title: "회원 탈퇴에 실패했습니다",
          text: err.response?.data || "잠시 후 다시 시도해주세요.",
        });
      });
  };

  // 로그아웃 - 로그아웃 처리 후 "로그인이 필요한 기능입니다" 안내, 확인을 누르면 로그인 페이지로 이동
  const handleLogout = () => {
    onLogout();
    showSwal({
      type: "info",
      title: "로그인을 해야 사용할 수 있는 기능입니다",
    }).then(() => {
      onNavigate("users/login");
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
              <div className={styles.profile_meta}>
                아이디: {user?.loginId ?? "-"}
              </div>
              <div className={styles.profile_meta}>
                {user?.email
                  ? `이메일: ${user.email}`
                  : "등록된 이메일이 없습니다."}
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
                    if (tab !== m.key) {
                      // 다른 탭으로 이동하는 거라서 임시로 입력/진행 중이던 값들 전부 초기화
                      setPhotoPreview(null);
                      setPhotoFile(null);
                      setClearImage(false);
                      setNickname("");
                      setNicknameChecked(false);
                      setNicknameAvailable(null);
                      setEmail("");
                      setEmailVerified(false);

                      setPwStep(1);
                      setCurrentPassword("");
                      setCurrentPasswordError("");
                      setNewPassword("");
                      setConfirmPassword("");
                      setPasswordMatch(null);

                      setWithdrawStep(1);
                      setWithdrawPassword("");
                      setWithdrawPasswordError("");
                    }
                    setTab(m.key);
                  }}
                >
                  {m.label}
                </a>
              ))}
              <button
                className={styles.mypage_logout}
                onClick={handleLogout}
              >
                로그아웃
              </button>
            </nav>
          </div>

          <div>
            {tab === "posts" && (
              <>
                <div className="page-header">
                  <h1>내 피드</h1>
                  <p>내가 작성한 식단 기록 모아보기</p>
                </div>

                {!myPostsLoading && myPosts.length > 0 && (
                  <div className={styles.postsToolbar}>
                    <div className={styles.searchBox}>
                      <span className={styles.searchIcon}>🔍</span>
                      <input
                        placeholder="제목으로 검색"
                        value={postSearch}
                        onChange={(e) => setPostSearch(e.target.value)}
                      />
                      {postSearch && (
                        <button
                          className={styles.searchClear}
                          onClick={() => setPostSearch("")}
                        >
                          ×
                        </button>
                      )}
                    </div>
                    <select
                      className={styles.sortSelect}
                      value={postSortOrder}
                      onChange={(e) => setPostSortOrder(e.target.value)}
                    >
                      <option value="latest">최신순</option>
                      <option value="oldest">오래된순</option>
                    </select>
                  </div>
                )}

                {myPostsLoading ? (
                  <div className={styles.my_posts_list}>불러오는 중...</div>
                ) : myPosts.length === 0 ? (
                  <div className={styles.my_posts_list}>
                    아직 작성한 식단 기록이 없습니다.
                  </div>
                ) : sortedPosts.length === 0 ? (
                  <div className={styles.my_posts_list}>
                    검색 결과가 없어요.
                  </div>
                ) : (
                  <>
                    <div className={styles.my_posts_list}>
                      {paginatedPosts.map((p) => (
                        <div className={styles.my_post_item} key={p.id}>
                          <div>
                            <div className={styles.my_post_title}>
                              {p.title}
                            </div>
                            <div className={styles.my_post_date}>{p.date}</div>
                          </div>
                          <div className={styles.my_post_right}>
                            <span className={styles.my_post_cal}>
                              🔥 {p.calories} kcal
                            </span>
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() =>
                                onNavigate(`mealplan/write-view/${p.id}`)
                              }
                            >
                              상세보기
                            </button>
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() =>
                                onNavigate(`mealplan/write-modify/${p.id}`)
                              }
                            >
                              수정
                            </button>
                            <button
                              className={`btn btn-sm ${styles.btn_delete}`}
                              onClick={() => handleDeletePost(p.id)}
                            >
                              삭제
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* 페이지네이션 - 검색/정렬 결과가 한 페이지 분량(10개)을 초과할 때만 표시 */}
                    {sortedPosts.length > POSTS_PER_PAGE && (
                      <div className={styles.pagination}>
                        <button
                          className={styles.pageBtn}
                          onClick={() => goToPage(currentPage - 1)}
                          disabled={currentPage === 1}
                          aria-label="이전 페이지"
                        >
                          ‹
                        </button>
                        {Array.from(
                          { length: totalPages },
                          (_, i) => i + 1,
                        ).map((page) => (
                          <button
                            key={page}
                            className={[
                              styles.pageBtn,
                              page === currentPage
                                ? styles.pageBtnActive
                                : "",
                            ]
                              .filter(Boolean)
                              .join(" ")}
                            onClick={() => goToPage(page)}
                          >
                            {page}
                          </button>
                        ))}
                        <button
                          className={styles.pageBtn}
                          onClick={() => goToPage(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          aria-label="다음 페이지"
                        >
                          ›
                        </button>
                      </div>
                    )}
                  </>
                )}
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
                          onKeyDown={(e) =>
                            handleEnterKey(e, handleVerifyCurrentPassword)
                          }
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
                          onKeyDown={(e) =>
                            handleEnterKey(e, handleChangePassword)
                          }
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
                          onKeyDown={(e) =>
                            handleEnterKey(e, handleChangePassword)
                          }
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
                          onKeyDown={(e) =>
                            handleEnterKey(e, handleVerifyWithdrawPassword)
                          }
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
                      onClick={handleWithdraw}
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
