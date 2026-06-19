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

function MiniCalendar({ onDateSelect, recordDates = new Set() }) {
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

          return (
            <div
              key={i}
              className={[
                styles.miniCalDay,
                d === null ? styles.otherMonth : "",
                d === today.getDate() &&
                month === today.getMonth() &&
                year === today.getFullYear()
                  ? styles.today
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
                  : undefined
              }
              onClick={() => dateKey && !isFuture && onDateSelect(dateKey)}
            >
              {d ?? ""}
            </div>
          );
        })}
      </div>
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

  const totalPosts = posts.length;

  const avgCalories =
    totalPosts === 0
      ? "0.0"
      : (posts.reduce((sum, p) => sum + p.calories, 0) / totalPosts).toFixed(
          1,
        );

  const today = new Date();
  const todayStr = `${today.getFullYear()}.${String(
    today.getMonth() + 1,
  ).padStart(2, "0")}.${String(today.getDate()).padStart(2, "0")}`;

  const todayCount = posts.filter((p) => p.dateOnly === todayStr).length;

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
              <select
                className={styles.sortSelect}
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              >
                <option value="latest">최신순</option>
                <option value="oldest">오래된순</option>
              </select>
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
              <div className={styles.sidebarTitle}>📅 날짜별 보기</div>
              <MiniCalendar
                onDateSelect={setSelectedDate}
                recordDates={myDates}
              />
            </div>
            <div className={styles.sidebarCard}>
              <div className={styles.sidebarTitle}>📊 오늘의 통계</div>
              {[
                { label: "총 게시물", val: `${totalPosts}개` },
                { label: "평균 칼로리", val: `${avgCalories} kcal` },
                { label: "오늘 기록", val: `${todayCount}개` },
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

export default FeedPage;