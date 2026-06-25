import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import styles from "./FeedPage.module.css";
import logo from "../assets/logo.svg";
import defaultProfile from "../assets/default-profile.svg";
import { useAuth } from "../contexts/AuthContext";
import { showSwal } from "../utils/SwalAlert";

const formatDate = (isoString) => {
  if (!isoString) return "";
  const d = new Date(isoString);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}.${mm}.${dd}`;
};

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

const toDateKey = (isoString) => {
  if (!isoString) return null;
  const d = new Date(isoString);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const FALLBACK_THUMB =
  "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80";

const DAILY_WRITE_LIMIT = 3;

const MONTH_LABELS = [
  "1월",
  "2월",
  "3월",
  "4월",
  "5월",
  "6월",
  "7월",
  "8월",
  "9월",
  "10월",
  "11월",
  "12월",
];

// 제목(연/월) 클릭 시 연도 선택 → 월 선택 화면으로 빠르게 이동 가능. 미래 연/월/날짜는 비활성화
function MiniCalendar({
  onDateSelect,
  recordDates = new Set(),
  selectedDate = null,
}) {
  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth();

  const [year, setYear] = useState(todayYear);
  const [month, setMonth] = useState(todayMonth);
  // "days" | "years" | "months" - 제목 클릭으로 연/월 선택 화면으로 전환
  const [viewMode, setViewMode] = useState("days");
  const [yearRangeStart, setYearRangeStart] = useState(todayYear - 5);

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

  // 오늘 자정 기준 - 이 시점 이후 날짜는 미래로 판단
  const todayMidnight = new Date(todayYear, todayMonth, today.getDate());

  const prevMonth = () =>
    month === 0
      ? (setYear((y) => y - 1), setMonth(11))
      : setMonth((m) => m - 1);
  const nextMonth = () =>
    month === 11
      ? (setYear((y) => y + 1), setMonth(0))
      : setMonth((m) => m + 1);

  // 제목 클릭 - 현재 보고 있는 연도를 중심으로 연도 선택 화면 오픈
  const openYearPicker = () => {
    setYearRangeStart(Math.min(year, todayYear) - 5);
    setViewMode("years");
  };

  const years = Array.from({ length: 12 }, (_, i) => yearRangeStart + i);
  // 다음 구간 전체가 미래(올해 초과)면 더 넘어갈 수 없음
  const canGoNextDecade = yearRangeStart + 12 <= todayYear;

  const prevDecade = () => setYearRangeStart((s) => s - 12);
  const nextDecade = () => {
    if (canGoNextDecade) setYearRangeStart((s) => s + 12);
  };

  const selectYear = (y) => {
    if (y > todayYear) return; // 미래 연도는 선택 불가
    setYear(y);
    setViewMode("months");
  };

  const canGoNextYear = year + 1 <= todayYear;
  const prevYearNav = () => setYear((y) => y - 1);
  const nextYearNav = () => {
    if (canGoNextYear) setYear((y) => y + 1);
  };

  const selectMonth = (m) => {
    if (year === todayYear && m > todayMonth) return; // 올해의 미래 월은 선택 불가
    setMonth(m);
    setViewMode("days");
  };

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div>
      <div className={styles.miniCalHeader}>
        {viewMode === "days" && (
          <>
            <button className={styles.miniCalNav} onClick={prevMonth}>
              ‹
            </button>
            <span
              className={styles.miniCalTitle}
              onClick={openYearPicker}
              title="연도/월 바로 가기"
            >
              {year}년 {month + 1}월
            </span>
            <button className={styles.miniCalNav} onClick={nextMonth}>
              ›
            </button>
          </>
        )}
        {viewMode === "years" && (
          <>
            <button className={styles.miniCalNav} onClick={prevDecade}>
              ‹
            </button>
            <span>
              {years[0]}년 - {years[years.length - 1]}년
            </span>
            <button
              className={styles.miniCalNav}
              onClick={nextDecade}
              disabled={!canGoNextDecade}
              style={
                !canGoNextDecade
                  ? { opacity: 0.3, cursor: "not-allowed" }
                  : undefined
              }
            >
              ›
            </button>
          </>
        )}
        {viewMode === "months" && (
          <>
            <button className={styles.miniCalNav} onClick={prevYearNav}>
              ‹
            </button>
            <span>{year}년</span>
            <button
              className={styles.miniCalNav}
              onClick={nextYearNav}
              disabled={!canGoNextYear}
              style={
                !canGoNextYear
                  ? { opacity: 0.3, cursor: "not-allowed" }
                  : undefined
              }
            >
              ›
            </button>
          </>
        )}
      </div>

      {viewMode === "years" && (
        <div className={styles.miniCalPickerGrid}>
          {years.map((y) => {
            const isFutureYear = y > todayYear;
            return (
              <div
                key={y}
                className={[
                  styles.miniCalPickerCell,
                  y === todayYear ? styles.miniCalPickerCurrent : "",
                  y === year ? styles.miniCalPickerSelected : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                style={
                  isFutureYear
                    ? {
                        color: "#cbd5e1",
                        cursor: "not-allowed",
                        pointerEvents: "none",
                      }
                    : undefined
                }
                onClick={() => selectYear(y)}
              >
                {y}
              </div>
            );
          })}
        </div>
      )}

      {viewMode === "months" && (
        <div className={styles.miniCalPickerGrid}>
          {MONTH_LABELS.map((label, i) => {
            const isFutureMonth = year === todayYear && i > todayMonth;
            return (
              <div
                key={label}
                className={[
                  styles.miniCalPickerCell,
                  year === todayYear && i === todayMonth
                    ? styles.miniCalPickerCurrent
                    : "",
                  i === month ? styles.miniCalPickerSelected : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                style={
                  isFutureMonth
                    ? {
                        color: "#cbd5e1",
                        cursor: "not-allowed",
                        pointerEvents: "none",
                      }
                    : undefined
                }
                onClick={() => selectMonth(i)}
              >
                {label}
              </div>
            );
          })}
        </div>
      )}

      {viewMode === "days" && (
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
            const isFuture =
              d !== null && new Date(year, month, d) > todayMidnight;

            // 실제 "오늘" 날짜인지
            const isToday =
              d === today.getDate() &&
              month === todayMonth &&
              year === todayYear;

            // 사용자가 필터로 선택한 날짜인지 (오늘과 별개로 구분)
            const isSelected = dateKey !== null && dateKey === selectedDate;

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
                  isFuture
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
                  dateKey && !isFuture && !isSelected && onDateSelect(dateKey)
                }
              >
                {d ?? ""}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const FeedPage = () => {
  const { isLoggedIn, token } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [search, setSearch] = useState("");
  // 메인페이지(오늘의 피드) 캘린더에서 날짜를 선택해 들어온 경우, URL의 ?date= 값으로 초기 필터링
  const [selectedDate, setSelectedDate] = useState(searchParams.get("date"));
  const [sortOrder, setSortOrder] = useState("latest");
  const [currentPage, setCurrentPage] = useState(1);
  const POSTS_PER_PAGE = 10;
  // 초기화 버튼 클릭 시 값을 바꿔서 MiniCalendar를 강제로 리마운트 -> 오늘 연/월, 날짜 화면으로 리셋
  const [calendarKey, setCalendarKey] = useState(0);

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

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

  // 내가 올린 게시물만 달력에 점이 찍힘
  const myDates = new Set(myPosts.map((w) => toDateKey(w.createdAt)));

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

  const filtered = posts.filter(
    (p) =>
      (!search ||
        p.title.includes(search) ||
        (p.content || "").includes(search)) &&
      (!selectedDate || p.dateOnly === selectedDate.replace(/-/g, ".")),
  );

  const sorted = [...filtered].sort((a, b) => {
    const diff = new Date(a.createdAt) - new Date(b.createdAt);
    return sortOrder === "latest" ? -diff : diff;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [search, sortOrder, selectedDate]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / POSTS_PER_PAGE));
  const paginatedPosts = sorted.slice(
    (currentPage - 1) * POSTS_PER_PAGE,
    currentPage * POSTS_PER_PAGE,
  );

  const goToPage = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // 초기화 버튼 - 날짜 필터를 완전히 해제하고, 캘린더는 오늘이 보이는 화면으로 리셋
  const handleResetCalendar = () => {
    setSelectedDate(null);
    setCalendarKey((k) => k + 1);
  };

  return (
    <div className={styles.page}>
      <div className="wrap">
        <div className={styles.feedLayout}>
          <div>
            <div className={styles.pageHeader}>
              <h1>전체 피드</h1>
              <p>모든 사용자의 식단 기록을 확인해 보세요</p>
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
              <div className={styles.sortSelectWrap}>
                <select
                  className={styles.sortSelect}
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                >
                  <option value="latest">최신순</option>
                  <option value="oldest">오래된순</option>
                </select>
                <span className={styles.sortArrow}>∨</span>
              </div>
              {selectedDate && (
                <button
                  className={styles.filterDate}
                  onClick={() => setSelectedDate(null)}
                >
                  📅 {selectedDate} ×
                </button>
              )}
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
                <div className={styles.postsEmptyIcon}>🔍</div>
                <div className={styles.postsEmptyTitle}>
                  {posts.length === 0
                    ? "아직 등록된 식단 기록이 없어요"
                    : "검색 결과가 없어요"}
                </div>
                <div className={styles.postsEmptySub}>
                  {posts.length === 0
                    ? "가장 먼저 식단을 기록해보세요"
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
              <div className={styles.calendarTitleRow}>
                <div className={styles.calendarTitleText}>📅 날짜별 보기</div>
                <button
                  type="button"
                  className={styles.resetBtn}
                  onClick={handleResetCalendar}
                >
                  ⟳ 초기화
                </button>
              </div>
              <MiniCalendar
                key={calendarKey}
                onDateSelect={setSelectedDate}
                recordDates={myDates}
                selectedDate={selectedDate}
              />
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

export default FeedPage;
