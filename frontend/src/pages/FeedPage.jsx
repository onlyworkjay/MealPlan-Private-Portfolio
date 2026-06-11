import { useState } from "react";
import "../styles/FeedPage.css";

const MOCK_POSTS = [
  { id:1, user:"김건강", avatar:"김", date:"2025.06.11", title:"오늘 점심 닭가슴살 샐러드", content:"다이어트 4주차. 칼로리 줄이면서도 든든하게 먹는 게 목표!", calories:420, images:2, thumb:"https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80" },
  { id:2, user:"박헬스", avatar:"박", date:"2025.06.11", title:"벌크업 식단 Day 21", content:"고단백 저지방으로 구성. 오늘은 현미밥 + 소고기 + 계란 3개", calories:850, images:4, thumb:"https://images.unsplash.com/photo-1547592180-85f173990554?w=400&q=80" },
  { id:3, user:"이다이어트", avatar:"이", date:"2025.06.10", title:"저녁은 가볍게 그릭 요거트", content:"야식 참기 성공! 그릭 요거트 + 블루베리로 깔끔하게 마무리", calories:180, images:1, thumb:"https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&q=80" },
  { id:4, user:"최운동", avatar:"최", date:"2025.06.10", title:"운동 전 탄수화물 보충", content:"바나나 + 오트밀로 에너지 충전. 오늘 데드리프트 PR 갱신!", calories:320, images:3, thumb:"https://images.unsplash.com/photo-1571748982800-fa51082c2224?w=400&q=80" },
  { id:5, user:"정뉴트리", avatar:"정", date:"2025.06.09", title:"비빔밥 한 그릇으로 영양 채우기", content:"채소 듬뿍 비빔밥. 나물 종류만 7가지 넣었더니 색깔이 예쁘다", calories:510, images:2, thumb:"https://images.unsplash.com/photo-1534482421-64566f976cfa?w=400&q=80" },
  { id:6, user:"강피트니스", avatar:"강", date:"2025.06.09", title:"단백질 스무디 아침 루틴", content:"프로틴 + 바나나 + 아몬드밀크. 운동 후 30분 안에 마시기!", calories:290, images:1, thumb:"https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=400&q=80" },
];

function MiniCalendar({ onDateSelect }) {
  const today = new Date();
  const [year, setYear]   = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const DAY_LABELS  = ["일","월","화","수","목","금","토"];
  const HAS_RECORD  = [3,5,7,10,11,14,17,18,21];

  const prevMonth = () => month === 0 ? (setYear(y=>y-1), setMonth(11)) : setMonth(m=>m-1);
  const nextMonth = () => month === 11 ? (setYear(y=>y+1), setMonth(0)) : setMonth(m=>m+1);

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div>
      <div className="mini-cal-header">
        <button className="mini-cal-nav" onClick={prevMonth}>‹</button>
        <span>{year}년 {month+1}월</span>
        <button className="mini-cal-nav" onClick={nextMonth}>›</button>
      </div>
      <div className="mini-cal-grid">
        {DAY_LABELS.map(d => <div className="mini-cal-day-label" key={d}>{d}</div>)}
        {cells.map((d, i) => (
          <div
            key={i}
            className={[
              "mini-cal-day",
              d === null ? "other-month" : "",
              d === today.getDate() && month === today.getMonth() && year === today.getFullYear() ? "today" : "",
              d && HAS_RECORD.includes(d) ? "has-record" : "",
            ].filter(Boolean).join(" ")}
            onClick={() => d && onDateSelect(`${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`)}
          >
            {d ?? ""}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function FeedPage({ isLoggedIn, onNavigate }) {
  const [search, setSearch]             = useState("");
  const [selectedDate, setSelectedDate] = useState(null);

  const filtered = MOCK_POSTS.filter(p =>
    (!search || p.title.includes(search) || p.content.includes(search)) &&
    (!selectedDate || p.date === selectedDate.replace(/-/g, "."))
  );

  return (
    <div className="page">
      {!isLoggedIn && (
        <section className="hero">
          <div className="wrap hero-inner">
            <div className="hero-badge">
              <span className="hero-badge-dot" />
              식단 기록 SNS 서비스
            </div>
            <h1 className="hero-title">
              먹고 기록하고<br />
              <em>변화를 확인하세요</em>
            </h1>
            <p className="hero-desc">
              음식 사진과 칼로리를 기록하고,<br />
              날짜별 식단 변화와 체중 그래프로 내 몸의 변화를 한눈에 확인하세요.
            </p>
            <div className="hero-btns">
              <button className="btn btn-primary btn-lg" onClick={() => onNavigate("register")}>무료로 시작하기 →</button>
              <button className="btn btn-ghost btn-lg" onClick={() => onNavigate("login")}>로그인</button>
            </div>
            <div className="hero-cards">
              {[
                { icon:"📸", title:"사진으로 기록", desc:"최대 4장까지 업로드. JPG·PNG·WEBP 지원" },
                { icon:"🔥", title:"칼로리 추적",   desc:"매 끼니 칼로리를 직접 입력해 관리" },
                { icon:"📊", title:"변화 시각화",   desc:"체중 그래프 + 사진 슬라이드로 확인" },
              ].map(c => (
                <div className="hero-card" key={c.title}>
                  <div className="hero-card-icon">{c.icon}</div>
                  <div className="hero-card-title">{c.title}</div>
                  <div className="hero-card-desc">{c.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <div className="wrap">
        <div className="feed-layout">
          <div>
            <div className="page-header">
              <h1>전체 피드</h1>
              <p>모든 사용자의 식단 기록을 확인해 보세요</p>
            </div>

            <div className="feed-toolbar">
              <div className="search-box">
                <span className="search-icon">🔍</span>
                <input
                  placeholder="제목, 내용으로 검색"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                {search && <button className="search-clear" onClick={() => setSearch("")}>×</button>}
              </div>
              {selectedDate && (
                <button className="filter-date" onClick={() => setSelectedDate(null)}>
                  📅 {selectedDate} ×
                </button>
              )}
              {isLoggedIn && (
                <button className="btn btn-primary btn-sm" onClick={() => onNavigate("write")}>✏️ 기록하기</button>
              )}
            </div>

            {filtered.length === 0 ? (
              <div className="posts-empty">
                <div className="posts-empty-icon">🔍</div>
                <div className="posts-empty-title">검색 결과가 없어요</div>
                <div className="posts-empty-sub">다른 키워드로 검색해 보세요</div>
              </div>
            ) : (
              <div className="posts-grid">
                {filtered.map(post => (
                  <div className="post-card" key={post.id} onClick={() => onNavigate("post-detail")}>
                    <div className="post-img-wrap">
                      <img src={post.thumb} alt={post.title} loading="lazy" />
                      {post.images > 1 && <span className="post-img-count">📷 {post.images}</span>}
                      <span className="post-cal-badge">🔥 {post.calories} kcal</span>
                    </div>
                    <div className="post-body">
                      <div className="post-user">
                        <div className="post-avatar">{post.avatar}</div>
                        <span className="post-username">{post.user}</span>
                        <span className="post-date">{post.date}</span>
                      </div>
                      <div className="post-title">{post.title}</div>
                      <div className="post-content">{post.content}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <aside className="sidebar">
            <div className="sidebar-card">
              <div className="sidebar-title">📅 날짜별 보기</div>
              <MiniCalendar onDateSelect={setSelectedDate} />
            </div>
            <div className="sidebar-card">
              <div className="sidebar-title">📊 오늘의 통계</div>
              {[
                { label:"총 게시물",   val:"6개" },
                { label:"평균 칼로리", val:"428 kcal" },
                { label:"오늘 기록",   val:"2개" },
              ].map(s => (
                <div className="stat-row" key={s.label}>
                  <span className="stat-label">{s.label}</span>
                  <span className="stat-val">{s.val}</span>
                </div>
              ))}
            </div>
            {!isLoggedIn && (
              <div className="sidebar-card sidebar-cta">
                <div className="sidebar-cta-icon">🥗</div>
                <div className="sidebar-cta-title">지금 시작하세요!</div>
                <div className="sidebar-cta-desc">회원가입 후 나만의 식단을 기록해보세요</div>
                <button className="btn btn-primary btn-sm" onClick={() => onNavigate("register")}>무료 가입하기</button>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
