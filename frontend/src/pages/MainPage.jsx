import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import styles from "./MainPage.module.css";
import logo from "../assets/logo.svg";
import defaultProfile from "../assets/default-profile.svg";
import { useAuth } from "../contexts/AuthContext";
import { showSwal } from "../utils/SwalAlert";

// 날짜를 "YYYY.MM.DD" 형식으로 표시 (오늘 날짜 비교용)
const formatDate = (isoString) => {
  if (!isoString) return "";
  const d = new Date(isoString);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}.${mm}.${dd}`;
};

// 날짜, 시간을 "YYYY.MM.DD HH:MM" 형식으로 표시 (카드에 보여줄 때 사용, 초는 표시 X)
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

// 날짜를 "YYYY-MM-DD" 형식으로 변환 (캘린더 셀 키와 맞추기 위한 용도)
const toDateKey = (isoString) => {
  if (!isoString) return null;
  const d = new Date(isoString);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

// 기본 썸네일 (사진이 없는 경우를 위한 안전장치)
const FALLBACK_THUMB =
  "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80";

// 하루 최대 작성 가능 게시물 수
const DAILY_WRITE_LIMIT = 3;

// readOnly가 true면 관상용 캘린더 - 모든 날짜 클릭/이동 비활성화 (메인페이지 전용)
function MiniCalendar({
  onDateSelect,
  recordDates = new Set(),
  selectedDate = null,
  readOnly = false,
}) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

  // 오늘 자정 기준 - 이 시점 이후 날짜는 미래로 판단
  const todayMidnight = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  const prevMonth = () =>
    month === 0
      ? (setYear((y) => y - 1), setMonth(11))
      : setMonth((m) => m - 1);
  const nextMonth = () =>
    month === 11
      ? (setYear((y) => y + 1), setMonth(0))
      : setMonth((m) => m + 1);

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div>
      <div className={styles.miniCalHeader}>
        <button className={styles.miniCalNav} onClick={prevMonth}>
          ‹
        </button>
        <span>
          {year}년 {month + 1}월
        </span>
        <button className={styles.miniCalNav} onClick={nextMonth}>
          ›
        </button>
      </div>
      <div className={styles.miniCalGrid}>
        {DAY_LABELS.map((d) => (
          <div className={styles.miniCalDayLabel} key={d}>
            {d}
          </div>
        ))}
        {cells.map((d, i) => {
          const dateKey = d
            ? `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`
            : null;

          // 오늘보다 미래 날짜인지 체크
          const isFuture = d !== null && new Date(year, month, d) > todayMidnight;

          // 실제 "오늘" 날짜인지
          const isToday =
            d === today.getDate() &&
            month === today.getMonth() &&
            year === today.getFullYear();

          // 사용자가 필터로 선택한 날짜인지 (오늘과 별개로 구분)
          const isSelected = dateKey !== null && dateKey === selectedDate;

          // 클릭이 막혀야 하는 경우: 관상용(readOnly)이거나, 미래거나, 이미 선택된 날짜
          const isDisabled = readOnly || isFuture || isSelected;

          return (
            <div
              key={i}
              className={[
                styles.miniCalDay,
                d === null ? styles.otherMonth : "",
                // 선택된 날짜가 있으면 그 날짜만 진하게 파란색, 없으면 기존처럼 오늘이 파란색
                isSelected ? styles.selectedDay : isToday ? styles.today : "",
                // 선택된 날짜가 오늘이 아니면, 오늘 자리에 얇은 테두리로 구분 표시
                isToday && selectedDate && !isSelected
                  ? styles.todayOutline
                  : "",
                dateKey && recordDates.has(dateKey) ? styles.hasRecord : "",
              ]
                .filter(Boolean)
                .join(" ")}
              style={
                readOnly
                  ? { cursor: "default", pointerEvents: "none" } // 관상용 - 미래 날짜도 회색 처리하지 않고 그대로 표시
                  : isFuture
                    ? {
                        color: "#cbd5e1",
                        cursor: "not-allowed",
                        pointerEvents: "none",
                      }
                    : isSelected
                      ? { cursor: "default", pointerEvents: "none" } // 이미 선택된 날짜는 다시 눌러도 동작 안 함
                      : undefined
              }
              onClick={() =>
                dateKey && !isDisabled && onDateSelect && onDateSelect(dateKey)
              }
            >
              {d ?? ""}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const MainPage = () => {
  const { isLoggedIn, token } = useAuth();
  const navigate = useNavigate();

  // 검색 / 정렬 - 오늘의 피드 범위 내에서만 적용
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState("latest"); // "latest" | "oldest"

  // 페이지네이션 - 오늘의 피드용
  const [currentPage, setCurrentPage] = useState(1);
  const POSTS_PER_PAGE = 10;

  // 백엔드(/writes)에서 전체 피드 불러옴 (오늘 글만 골라쓰기 위해 일단 전체 로드)
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // 캘린더 점 표시 + 일일 작성 횟수 체크용 - 로그인한 내가 작성한 게시물 원본 데이터 보관
  const [myPosts, setMyPosts] = useState([]);

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_BACKSERVER}/writes`)
      .then((res) => {
        const mapped = res.data.map((w) => ({
          id: w.writeId,
          user: w.nickname ?? "알 수 없음",
          profileImg: w.profileImg || null,
          createdAt: w.createdAt,
          dateOnly: formatDate(w.createdAt),
          dateTime: formatDateTime(w.createdAt),
          title: w.title,
          content: w.content ?? "",
          calories: w.calories,
          images: w.imageUrls?.length ?? 0,
          thumb: w.imageUrls?.[0] ?? FALLBACK_THUMB,
        }));
        setPosts(mapped);
      })
      .catch(() => {
        setPosts([]);
      })
      .finally(() => setLoading(false));
  }, []);

  // 캘린더 점 + 일일 작성 횟수는 "내가 올린 기록"만 반영 - /writes/my를 그대로 재사용
  useEffect(() => {
    if (!isLoggedIn || !token) {
      setMyPosts([]);
      return;
    }

    axios
      .get(`${import.meta.env.VITE_BACKSERVER}/writes/my`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setMyPosts(res.data);
      })
      .catch(() => {
        setMyPosts([]);
      });
  }, [isLoggedIn, token]);

  // 캘린더에 점 찍을 날짜 Set은 myPosts로부터 파생
  const myDates = new Set(myPosts.map((w) => toDateKey(w.createdAt)));

  // 기록하기 버튼 클릭 시 - 오늘 작성한 게시물 수가 제한(3개)을 넘으면 작성 페이지 진입 차단
  const handleWriteClick = () => {
    const todayKey = toDateKey(new Date().toISOString());
    const todayMyPostCount = myPosts.filter(
      (w) => toDateKey(w.createdAt) === todayKey,
    ).length;

    if (todayMyPostCount >= DAILY_WRITE_LIMIT) {
      showSwal({
        type: "warning",
        title: "작성 횟수를 모두 사용했어요",
        text: `하루에 최대 ${DAILY_WRITE_LIMIT}개까지만 기록할 수 있어요.<br/>자정이 지나면 다시 작성할 수 있어요!`,
        confirmButtonText: "확인",
      });
      return;
    }

    navigate("/mealplan/write");
  };

  // 오늘 날짜 문자열 ("YYYY.MM.DD")
  const today = new Date();
  const todayStr = `${today.getFullYear()}.${String(
    today.getMonth() + 1,
  ).padStart(2, "0")}.${String(today.getDate()).padStart(2, "0")}`;

  // 오늘의 피드 - 오늘 작성된 게시물만 우선 추출
  const todaysPosts = posts.filter((p) => p.dateOnly === todayStr);

  // 검색 필터 (제목, 내용) - 오늘의 피드 범위 안에서만 적용
  const filtered = todaysPosts.filter(
    (p) =>
      !search ||
      p.title.includes(search) ||
      (p.content || "").includes(search),
  );

  // 정렬 (최신순 / 오래된순)
  const sorted = [...filtered].sort((a, b) => {
    const diff = new Date(a.createdAt) - new Date(b.createdAt);
    return sortOrder === "latest" ? -diff : diff;
  });

  // 페이지네이션 계산
  const totalPages = Math.max(1, Math.ceil(sorted.length / POSTS_PER_PAGE));
  const paginatedPosts = sorted.slice(
    (currentPage - 1) * POSTS_PER_PAGE,
    currentPage * POSTS_PER_PAGE,
  );

  // 검색어/정렬이 바뀌거나, 오늘 게시물 자체가 바뀌면 1페이지로 초기화
  useEffect(() => {
    setCurrentPage(1);
  }, [search, sortOrder, todaysPosts.length]);

  const goToPage = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // 사이드바 통계 (전체 게시물 기준)
  const totalPosts = posts.length;
  const avgCalories =
    totalPosts === 0
      ? "0.0"
      : (posts.reduce((sum, p) => sum + p.calories, 0) / totalPosts).toFixed(
          1,
        );

    // "오늘 기록"은 전체 사용자가 아니라 "내가" 오늘 작성한 글 수 (myPosts 기준)
  const myTodayCount = myPosts.filter(
    (w) => toDateKey(w.createdAt) === toDateKey(new Date().toISOString()),
  ).length;

  // 나의 총 칼로리 - myPosts(내가 작성한 전체 게시물) 칼로리 합산
  const myTotalCalories = myPosts.reduce((sum, w) => sum + w.calories, 0);

  return (
    <div className={styles.page}>
      {/* 로그인 여부와 상관없이 항상 노출. 단, 회원가입/로그인 버튼은 비로그인 상태일 때만 표시 */}
      <section className={styles.hero}>
        <div className={`wrap ${styles.heroInner}`}>
          <div className={styles.heroBadge}>
            <span className={styles.heroBadgeDot} />
            식단 기록 SNS 서비스 MealPlan
          </div>
          <h1 className={styles.heroTitle}>
            먹고 기록하고
            <br />
            <em>변화를 확인하세요</em>
          </h1>
          <p className={styles.heroDesc}>
            음식 사진과 칼로리를 기록하고,
            <br />
            날짜별 식단 변화와 체중 그래프로 내 몸의 변화를 한눈에 확인하세요.
          </p>
          {!isLoggedIn && (
            <div className={styles.heroBtns}>
              <button
                className="btn btn-primary btn-lg"
                onClick={() => navigate("/users/join")}
              >
                회원가입 하러 가기
              </button>
              <button
                className="btn btn-ghost btn-lg"
                onClick={() => navigate("/users/login")}
              >
                로그인
              </button>
            </div>
          )}
          <div className={styles.heroCards}>
            {[
              {
                icon: "📸",
                title: "사진으로 기록",
                desc: "최대 4장까지 업로드. JPG·PNG·WEBP 지원",
              },
              {
                icon: "🔥",
                title: "칼로리 추적",
                desc: "매 끼니 칼로리를 직접 입력해 관리",
              },
              {
                icon: "📊",
                title: "변화 시각화",
                desc: "체중 그래프 + 사진 슬라이드로 확인",
              },
            ].map((c) => (
              <div className={styles.heroCard} key={c.title}>
                <div className={styles.heroCardIcon}>{c.icon}</div>
                <div className={styles.heroCardTitle}>{c.title}</div>
                <div className={styles.heroCardDesc}>{c.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="wrap">
        <div className={styles.feedLayout}>
          <div>
            <div className={styles.pageHeader}>
              <h1>오늘의 피드</h1>
              <p>오늘 등록된 식단 기록을 확인해 보세요</p>
            </div>

            <div className={styles.feedToolbar}>
              <div className={styles.searchBox}>
                <span className={styles.searchIcon}>🔍</span>
                <input
                  placeholder="제목, 내용으로 검색"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <button
                    className={styles.searchClear}
                    onClick={() => setSearch("")}
                  >
                    ×
                  </button>
                )}
              </div>
              <select
                className={styles.sortSelect}
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              >
                <option value="latest">최신순</option>
                <option value="oldest">오래된순</option>
              </select>
              {isLoggedIn && (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleWriteClick}
                >
                  ✏️ 기록하기
                </button>
              )}
            </div>

            {loading ? (
              <div className={styles.postsEmpty}>
                <div className={styles.postsEmptyTitle}>불러오는 중...</div>
              </div>
            ) : sorted.length === 0 ? (
              <div className={styles.postsEmpty}>
                <div className={styles.postsEmptyIcon}>
                  {todaysPosts.length === 0 ? "🍽️" : "🔍"}
                </div>
                <div className={styles.postsEmptyTitle}>
                  {todaysPosts.length === 0
                    ? "오늘의 피드가 없습니다"
                    : "검색 결과가 없어요"}
                </div>
                <div className={styles.postsEmptySub}>
                  {todaysPosts.length === 0
                    ? "오늘 등록된 식단 기록이 아직 없어요"
                    : "다른 키워드로 검색해 보세요"}
                </div>
              </div>
            ) : (
              <div className={styles.postsGrid}>
                {paginatedPosts.map((post) => (
                  <div
                    className={styles.postCard}
                    key={post.id}
                    onClick={() => navigate(`/mealplan/write-view/${post.id}`)}
                  >
                    <div className={styles.postImgWrap}>
                      <img src={post.thumb} alt={post.title} loading="lazy" />
                      {post.images > 1 && (
                        <span className={styles.postImgCount}>
                          📷 {post.images}
                        </span>
                      )}
                      <span className={styles.postCalBadge}>
                        🔥 {post.calories} kcal
                      </span>
                    </div>
                    <div className={styles.postBody}>
                      <div className={styles.postUser}>
                        <img
                          className={styles.postAvatarImg}
                          src={post.profileImg || defaultProfile}
                          alt={post.user}
                        />
                        <span className={styles.postUsername}>{post.user}</span>
                        <span className={styles.postDate}>{post.dateTime}</span>
                      </div>
                      <div className={styles.postTitle}>{post.title}</div>
                      <div className={styles.postContent}>{post.content}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 페이지네이션 - 검색/정렬 결과가 한 페이지 분량(10개)을 초과할 때만 표시 */}
            {!loading && sorted.length > POSTS_PER_PAGE && (
              <div className={styles.pagination}>
                <button
                  className={styles.pageBtn}
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  aria-label="이전 페이지"
                >
                  ‹
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      className={[
                        styles.pageBtn,
                        page === currentPage ? styles.pageBtnActive : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      onClick={() => goToPage(page)}
                    >
                      {page}
                    </button>
                  ),
                )}
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
          </div>

          <aside className={styles.sidebar}>
            <div className={styles.sidebarCard}>
              <div className={styles.sidebarTitle}>📅 달력 </div>
              {/* 메인페이지 캘린더는 관상용 - 클릭/페이지 이동 전부 비활성화 */}
              <MiniCalendar recordDates={myDates} readOnly />
            </div>
            <div className={styles.sidebarCard}>
              <div className={styles.sidebarTitle}>📊 오늘의 통계</div>
              {[
                { label: "총 피드", val: `${totalPosts}개` },
                { label: "모든 유저 평균 칼로리", val: `${avgCalories} kcal` },
                { label: "오늘 내가 올린 피드", val: `${myTodayCount}개` },
                { label: "나의 총 칼로리", val: `${myTotalCalories} kcal` },
              ].map((s) => (
                <div className={styles.statRow} key={s.label}>
                  <span className={styles.statLabel}>{s.label}</span>
                  <span className={styles.statVal}>{s.val}</span>
                </div>
              ))}
            </div>
            {!isLoggedIn && (
              <div className={`${styles.sidebarCard} ${styles.sidebarCta}`}>
                <div className={styles.sidebarCtaIcon}>
                  <img src={logo} alt="MealPlan 로고" />
                </div>
                <div className={styles.sidebarCtaTitle}>지금 시작하세요!</div>
                <div className={styles.sidebarCtaDesc}>
                  회원가입 후 나만의 식단을 기록해보세요
                </div>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => navigate("/users/join")}
                >
                  회원 가입하기
                </button>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
};

export default MainPage;