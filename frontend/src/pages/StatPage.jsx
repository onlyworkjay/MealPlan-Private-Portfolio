import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import styles from "./StatPage.module.css";
import { useAuth } from "../contexts/AuthContext";

const toDateKey = (isoString) => {
  if (!isoString) return null;
  const d = new Date(isoString);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const todayKey = () => toDateKey(new Date().toISOString());

const MIN_WEIGHT = 1;
const MAX_WEIGHT = 300;

// ────────────────────────────────────────────────
// 커스텀 달력 컴포넌트
// ────────────────────────────────────────────────
const CustomCalendar = ({ value, onChange, feedDates }) => {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth()); // 0-indexed

  const feedDateSet = useMemo(() => new Set(feedDates), [feedDates]);

  const selectedKey = value; // "YYYY-MM-DD"

  const firstDay = new Date(viewYear, viewMonth, 1).getDay(); // 0=일
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const toPrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else setViewMonth((m) => m - 1);
  };
  const toNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else setViewMonth((m) => m + 1);
  };

  const handleDayClick = (day) => {
    const mm = String(viewMonth + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    const key = `${viewYear}-${mm}-${dd}`;
    // 미래 날짜 선택 불가
    if (key > todayKey()) return;
    onChange(key);
  };

  const weeks = [];
  let cells = Array(firstDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const monthNames = [
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

  return (
    <div className={styles.calendar}>
      {/* 헤더 */}
      <div className={styles.calHeader}>
        <button
          type="button"
          className={styles.calNavBtn}
          onClick={toPrevMonth}
        >
          ‹
        </button>
        <span className={styles.calTitle}>
          {viewYear}년 {monthNames[viewMonth]}
        </span>
        <button
          type="button"
          className={styles.calNavBtn}
          onClick={toNextMonth}
        >
          ›
        </button>
      </div>

      {/* 요일 */}
      <div className={styles.calWeekRow}>
        {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
          <div key={d} className={styles.calWeekCell}>
            {d}
          </div>
        ))}
      </div>

      {/* 날짜 */}
      {weeks.map((week, wi) => (
        <div key={wi} className={styles.calWeekRow}>
          {week.map((day, di) => {
            if (!day) return <div key={di} className={styles.calCell} />;
            const mm = String(viewMonth + 1).padStart(2, "0");
            const dd = String(day).padStart(2, "0");
            const key = `${viewYear}-${mm}-${dd}`;
            const isFuture = key > todayKey();
            const isSelected = key === selectedKey;
            const hasFeed = feedDateSet.has(key);
            const isToday = key === todayKey();

            return (
              <div
                key={di}
                className={[
                  styles.calCell,
                  hasFeed ? styles.calCellFeed : "",
                  isSelected ? styles.calCellSelected : "",
                  isToday && !isSelected ? styles.calCellToday : "",
                  isFuture ? styles.calCellFuture : "",
                ].join(" ")}
                onClick={() => !isFuture && handleDayClick(day)}
              >
                {day}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

// ────────────────────────────────────────────────
// 메인 페이지
// ────────────────────────────────────────────────
const StatPage = () => {
  const { isLoggedIn, token } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState([]);
  const [statsLoading, setStatsLoading] = useState(true);

  const [inputDate, setInputDate] = useState(todayKey());
  const [inputWeight, setInputWeight] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  const [photoEntries, setPhotoEntries] = useState([]);
  const [slideIndex, setSlideIndex] = useState(0);
  const [writesLoading, setWritesLoading] = useState(true);

  const [modalImage, setModalImage] = useState(null);

  // 피드가 있는 날짜 목록 (달력 강조용)
  const feedDates = useMemo(
    () => [...new Set(photoEntries.map((e) => e.dateKey).filter(Boolean))],
    [photoEntries],
  );

  const fetchStats = () => {
    if (!token) return;
    setStatsLoading(true);
    axios
      .get(`${import.meta.env.VITE_BACKSERVER}/stats/my`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setStats(res.data))
      .catch(() => setStats([]))
      .finally(() => setStatsLoading(false));
  };

  useEffect(() => {
    if (!isLoggedIn || !token) return;
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, token]);

  useEffect(() => {
    if (!isLoggedIn || !token) return;
    setWritesLoading(true);
    axios
      .get(`${import.meta.env.VITE_BACKSERVER}/writes/my`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const withPhotos = res.data
          .filter((w) => (w.imageUrls?.length ?? 0) > 0)
          .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
          .map((w) => ({
            id: w.writeId,
            dateKey: toDateKey(w.createdAt),
            title: w.title,
            images: w.imageUrls,
          }));
        setPhotoEntries(withPhotos);
        setSlideIndex(withPhotos.length > 0 ? withPhotos.length - 1 : 0);
      })
      .catch(() => setPhotoEntries([]))
      .finally(() => setWritesLoading(false));
  }, [isLoggedIn, token]);

  const chartData = useMemo(() => {
    const lastWeightByDate = new Map();
    stats.forEach((s) => lastWeightByDate.set(s.date, s.weight));
    return Array.from(lastWeightByDate.entries())
      .sort(([a], [b]) => new Date(a) - new Date(b))
      .map(([date, weight]) => {
        const [, m, d] = date.split("-");
        return { date: `${Number(m)}.${Number(d)}`, weight };
      });
  }, [stats]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const weightNum = Number(inputWeight);
    if (!inputWeight || Number.isNaN(weightNum) || weightNum <= 0) {
      setSaveMsg("체중을 올바르게 입력해주세요.");
      return;
    }
    if (weightNum < MIN_WEIGHT || weightNum > MAX_WEIGHT) {
      setSaveMsg(
        `체중은 ${MIN_WEIGHT}kg ~ ${MAX_WEIGHT}kg 사이로 입력해주세요.`,
      );
      return;
    }
    const decimalPart = inputWeight.split(".")[1];
    if (decimalPart && decimalPart.length > 2) {
      setSaveMsg("소수점 둘째 자리까지 입력 가능합니다.");
      return;
    }
    setSaving(true);
    setSaveMsg("");
    axios
      .post(
        `${import.meta.env.VITE_BACKSERVER}/stats`,
        { date: inputDate, weight: weightNum },
        { headers: { Authorization: `Bearer ${token}` } },
      )
      .then(() => {
        setSaveMsg("체중이 저장되었습니다.");
        setInputWeight("");
        fetchStats();
      })
      .catch(() => setSaveMsg("저장에 실패했습니다. 다시 시도해주세요."))
      .finally(() => setSaving(false));
  };

  const goPrevSlide = () => setSlideIndex((i) => Math.max(0, i - 1));
  const goNextSlide = () =>
    setSlideIndex((i) => Math.min(photoEntries.length - 1, i + 1));
  const currentSlide = photoEntries[slideIndex];

  if (!isLoggedIn) {
    return (
      <div className={styles.page}>
        <div className={`wrap ${styles.loginGate}`}>
          <div className={styles.pageHeader}>
            <h1>통계</h1>
            <p>체중 변화와 식단 기록을 한눈에 확인해 보세요</p>
          </div>
          <div className={styles.lockEmpty}>
            <div className={styles.lockEmptyIcon}>🔒</div>
            <div className={styles.lockEmptyTitle}>로그인이 필요해요</div>
            <div className={styles.lockEmptySub}>
              로그인 후 체중 변화 그래프와 식단 기록을 확인할 수 있어요
            </div>
            <button
              className="btn btn-primary btn-sm"
              style={{ marginTop: 16 }}
              onClick={() => navigate("/users/login")}
            >
              로그인 하러 가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className="wrap">
        <div className={styles.pageHeader}>
          <h1>통계</h1>
          <p>체중 변화와 식단 기록을 한눈에 확인해 보세요</p>
        </div>

        <div className={styles.grid}>
          {/* 체중 변화 그래프 */}
          <section className={styles.card}>
            <div className={styles.cardTitle}>📈 체중 변화 그래프</div>
            {statsLoading ? (
              <div className={styles.empty}>불러오는 중...</div>
            ) : stats.length === 0 ? (
              <div className={styles.empty}>
                아직 체중 기록이 없어요! 옆에서 입력할 수 있어요.
              </div>
            ) : (
              <div className={styles.chartWrap}>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart
                    data={chartData}
                    margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--border)"
                    />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      stroke="var(--text-light)"
                      tickMargin={8}
                    />
                    <YAxis
                      domain={["dataMin - 1", "dataMax + 1"]}
                      tick={{ fontSize: 12 }}
                      stroke="var(--text-light)"
                      unit="kg"
                    />
                    <Tooltip
                      formatter={(value) => [`${value.toFixed(2)} kg`, "체중"]}
                    />
                    <Line
                      type="monotone"
                      dataKey="weight"
                      stroke="var(--primary)"
                      strokeWidth={2.5}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>

          {/* 체중 입력 */}
          <section className={styles.card}>
            <div className={styles.cardTitle}>⚖️ 체중 입력</div>
            <form
              className={styles.weightForm}
              onSubmit={handleSubmit}
              noValidate
            >
              {/* 커스텀 달력 */}
              <CustomCalendar
                value={inputDate}
                onChange={(key) => {
                  setInputDate(key);
                  // 해당 날짜의 첫 번째 피드로 슬라이드 이동하기
                  const idx = photoEntries.findIndex((e) => e.dateKey === key);
                  if (idx !== -1) setSlideIndex(idx);
                }}
                feedDates={feedDates}
              />

              {/* 선택된 날짜 표시 */}
              <div className={styles.selectedDate}>
                선택된 날짜: <strong>{inputDate}</strong>
              </div>

              <div className={styles.formRow}>
                <label htmlFor="stat-weight">체중 (kg)</label>
                <input
                  id="stat-weight"
                  type="number"
                  step="0.01"
                  min={MIN_WEIGHT}
                  max={MAX_WEIGHT}
                  placeholder="예: 65.50"
                  value={inputWeight}
                  onChange={(e) => setInputWeight(e.target.value)}
                />
              </div>
              <div className={styles.weightHint}>
                체중은 {MIN_WEIGHT}kg ~ {MAX_WEIGHT}kg 사이로, 소수점 둘째
                자리까지 입력할 수 있어요.
              </div>
              <button
                type="submit"
                className="btn btn-primary btn-sm"
                disabled={saving}
              >
                {saving ? "저장 중..." : "저장하기"}
              </button>
              {saveMsg && (
                <div
                  className={`${styles.saveMsg} ${saveMsg.includes("저장되었습니다") ? "" : styles.saveMsgError}`}
                >
                  {saveMsg}
                </div>
              )}
            </form>
          </section>

          {/* 사진 슬라이드 뷰어 */}
          <section className={`${styles.card} ${styles.cardWide}`}>
            <div className={styles.cardTitle}>🖼️ 사진 슬라이드 뷰어</div>
            {writesLoading ? (
              <div className={styles.empty}>불러오는 중...</div>
            ) : photoEntries.length === 0 ? (
              <div className={styles.empty}>
                사진이 포함된 식단 기록이 아직 없어요.
              </div>
            ) : (
              <div className={styles.slideViewer}>
                <button
                  className={styles.slideNav}
                  onClick={goPrevSlide}
                  disabled={slideIndex === 0}
                  aria-label="이전 사진"
                >
                  ‹
                </button>
                <div className={styles.slideMain}>
                  <div
                    className={styles.slideImagesGrid}
                    style={{
                      gridTemplateColumns: `repeat(${Math.min(currentSlide.images.length, 4)}, 1fr)`,
                    }}
                  >
                    {currentSlide.images.slice(0, 4).map((url, idx) => (
                      <img
                        key={idx}
                        src={url}
                        alt={`${currentSlide.title} ${idx + 1}`}
                        className={styles.slideImgItem}
                        onClick={() => setModalImage(url)}
                      />
                    ))}
                  </div>
                  <div className={styles.slideInfo}>
                    <div className={styles.slideDate}>
                      {currentSlide.dateKey}
                    </div>
                    <div className={styles.slideTitle}>
                      {currentSlide.title}
                    </div>
                    <div className={styles.slideCounter}>
                      {slideIndex + 1} / {photoEntries.length}
                    </div>
                  </div>
                </div>
                <button
                  className={styles.slideNav}
                  onClick={goNextSlide}
                  disabled={slideIndex === photoEntries.length - 1}
                  aria-label="다음 사진"
                >
                  ›
                </button>
              </div>
            )}
          </section>
        </div>
      </div>

      {modalImage && (
        <div
          className={styles.modalOverlay}
          onClick={() => setModalImage(null)}
        >
          <button
            className={styles.modalClose}
            onClick={() => setModalImage(null)}
            aria-label="닫기"
          >
            ×
          </button>
          <img
            src={modalImage}
            alt="원본 사진"
            className={styles.modalImg}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default StatPage;
