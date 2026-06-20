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

// 날짜를 "YYYY-MM-DD" 형식으로 변환 (input[type=date] 기본값, 슬라이드 그룹핑 키로 사용)
const toDateKey = (isoString) => {
  if (!isoString) return null;
  const d = new Date(isoString);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const todayKey = () => toDateKey(new Date().toISOString());

const StatPage = () => {
  const { isLoggedIn, token } = useAuth();
  const navigate = useNavigate();

  // 체중 변화 그래프 데이터
  const [stats, setStats] = useState([]);
  const [statsLoading, setStatsLoading] = useState(true);

  // 체중 입력 폼
  const [inputDate, setInputDate] = useState(todayKey());
  const [inputWeight, setInputWeight] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  // 사진 슬라이드 뷰어 - 내가 작성한 기록(/writes/my)에서 사진이 있는 것만 모음
  const [photoEntries, setPhotoEntries] = useState([]);
  const [slideIndex, setSlideIndex] = useState(0);
  const [writesLoading, setWritesLoading] = useState(true);

  // 원본 사진 모달 - 클릭한 이미지 URL을 담아두면 모달이 열림
  const [modalImage, setModalImage] = useState(null);

  const fetchStats = () => {
    if (!token) return;
    setStatsLoading(true);
    axios
      .get(`${import.meta.env.VITE_BACKSERVER}/stats/my`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setStats(res.data);
      })
      .catch(() => {
        setStats([]);
      })
      .finally(() => setStatsLoading(false));
  };

  useEffect(() => {
    if (!isLoggedIn || !token) return;
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, token]);

  // 사진 슬라이드용 - 내 게시물 중 사진이 1장 이상 있는 것만, 날짜 오래된순으로 정렬
  // imageUrls 전체를 보관해서, 한 게시물에 여러 장이 있으면 가로로 다 보여줄 수 있도록 함
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
      .catch(() => {
        setPhotoEntries([]);
      })
      .finally(() => setWritesLoading(false));
  }, [isLoggedIn, token]);

  // 그래프에 넘길 데이터 - 날짜를 "M.D" 형식으로 짧게 표시
  // 같은 날짜에 여러 건을 입력했다면 "마지막 값 기준"으로 한 점만 사용
  const chartData = useMemo(() => {
    const lastWeightByDate = new Map();
    // stats가 입력된 순서(오래된 → 최근) 그대로라고 가정 - Map.set은 같은 키를 다시 쓰면
    // 값을 덮어쓰므로, 같은 날짜를 여러 번 거치면 자연히 "마지막 입력값"이 남게 됨
    stats.forEach((s) => {
      lastWeightByDate.set(s.date, s.weight);
    });

    return Array.from(lastWeightByDate.entries())
      .sort(([dateA], [dateB]) => new Date(dateA) - new Date(dateB))
      .map(([date, weight]) => {
        const [, m, d] = date.split("-");
        return {
          date: `${Number(m)}.${Number(d)}`,
          weight,
        };
      });
  }, [stats]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputWeight || Number(inputWeight) <= 0) {
      setSaveMsg("체중을 올바르게 입력해주세요.");
      return;
    }

    setSaving(true);
    setSaveMsg("");
    axios
      .post(
        `${import.meta.env.VITE_BACKSERVER}/stats`,
        { date: inputDate, weight: Number(inputWeight) },
        { headers: { Authorization: `Bearer ${token}` } },
      )
      .then(() => {
        setSaveMsg("체중이 저장되었습니다.");
        setInputWeight("");
        fetchStats();
      })
      .catch(() => {
        setSaveMsg("저장에 실패했습니다. 다시 시도해주세요.");
      })
      .finally(() => setSaving(false));
  };

  const goPrevSlide = () => setSlideIndex((i) => Math.max(0, i - 1));
  const goNextSlide = () =>
    setSlideIndex((i) => Math.min(photoEntries.length - 1, i + 1));

  const currentSlide = photoEntries[slideIndex];

  // 비로그인 상태 - 통계 페이지는 내 기록 기반이므로 로그인 안내 화면만 표시 (다른 페이지로 강제 이동시키지 않음)
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
                    margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      stroke="var(--text-light)"
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
            <form className={styles.weightForm} onSubmit={handleSubmit}>
              <div className={styles.formRow}>
                <label htmlFor="stat-date">날짜</label>
                <input
                  id="stat-date"
                  type="date"
                  value={inputDate}
                  max={todayKey()}
                  onChange={(e) => setInputDate(e.target.value)}
                />
              </div>
              <div className={styles.formRow}>
                <label htmlFor="stat-weight">체중 (kg)</label>
                <input
                  id="stat-weight"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="예: 65.50"
                  value={inputWeight}
                  onChange={(e) => setInputWeight(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary btn-sm"
                disabled={saving}
              >
                {saving ? "저장 중..." : "저장하기"}
              </button>
              {saveMsg && <div className={styles.saveMsg}>{saveMsg}</div>}
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
                  {/* 사진 1장이면 기존처럼 크게, 2장 이상이면 가로로 나열 (최대 4장) */}
                  <div
                    className={styles.slideImagesGrid}
                    style={{
                      gridTemplateColumns: `repeat(${Math.min(
                        currentSlide.images.length,
                        4,
                      )}, 1fr)`,
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

      {/* 원본 사진 모달 - 어떤 사진을 클릭하든 원본 크기로 보여줌 */}
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
