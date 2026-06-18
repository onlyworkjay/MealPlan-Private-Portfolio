import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import styles from "./MainPage.module.css";
import logo from "../assets/logo.svg";
import defaultProfile from "../assets/default-profile.svg";
import { useAuth } from "../contexts/AuthContext";

// 날짜를 "YYYY.MM.DD" 형식으로 표시 (검색/통계용 - 날짜만 비교)
const formatDate = (isoString) => {
  if (!isoString) return "";
  const d = new Date(isoString);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}.${mm}.${dd}`;
};

// 날짜+시간을 "YYYY.MM.DD HH:MM" 형식으로 표시 (카드에 보여줄 때 사용, 초는 표시 안 함)
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

// 기본 썸네일 (사진이 없는 경우를 위한 안전장치 - 등록 시 사진 1장 이상 필수라 실제로는 거의 발생하지 않음)
const FALLBACK_THUMB =
  "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80";

function MiniCalendar({ onDateSelect, recordDates = new Set() }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

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
              onClick={() => dateKey && onDateSelect(dateKey)}
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
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const [sortOrder, setSortOrder] = useState("latest"); // "latest" | "oldest", 기본값 최신순

  // 백엔드(/writes)에서 전체 피드 불러옴
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // 캘린더 점 표시용 - 다른 사람 글이 아닌, 로그인한 내가 작성한 게시물의 날짜만 모음
  const [myDates, setMyDates] = useState(new Set());

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

  // 캘린더에 표시할 점은 "내가 올린 기록"만 반영 - /writes/my를 그대로 재사용
  // 로그아웃 상태이거나 token이 아직 준비되지 않았으면 그냥 빈 상태로 둠
  useEffect(() => {
    if (!isLoggedIn || !token) {
      setMyDates(new Set());
      return;
    }

    axios
      .get(`${import.meta.env.VITE_BACKSERVER}/writes/my`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setMyDates(new Set(res.data.map((w) => toDateKey(w.createdAt))));
      })
      .catch(() => {
        setMyDates(new Set());
      });
  }, [isLoggedIn, token]);

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

  // 오늘의 통계 계산
  const totalPosts = posts.length;

  const avgCalories =
    totalPosts === 0
      ? 0
      : Math.round(posts.reduce((sum, p) => sum + p.calories, 0) / totalPosts);

  const today = new Date();
  const todayStr = `${today.getFullYear()}.${String(
    today.getMonth() + 1,
  ).padStart(2, "0")}.${String(today.getDate()).padStart(2, "0")}`;

  const todayCount = posts.filter((p) => p.dateOnly === todayStr).length;

  return (
    <div className={styles.page}>
      {!isLoggedIn && (
        <section className={styles.hero}>
          <div className={`wrap ${styles.heroInner}`}>
            <div className={styles.heroBadge}>
              <span className={styles.heroBadgeDot} />
              식단 기록 SNS 서비스
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
      )}

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
                  onClick={() => navigate("/mealplan/write")}
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
                {sorted.map((post) => (
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

export default MainPage;
