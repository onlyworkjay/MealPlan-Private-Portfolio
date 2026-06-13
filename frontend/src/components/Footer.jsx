import styles from "./Footer.module.css";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className={styles.footer}>
      <div className="wrap">
        <div className={styles.footerGrid}>
          <div className={styles.footerBrand}>
            <div className={styles.footerLogo}>
              <div className={styles.footerLogoIcon}>🥗</div>
              <span className={styles.footerLogoText}>
                Meal<span>Plan</span>
              </span>
            </div>
            <p className={styles.footerDesc}>
              운동·식단 관리자를 위한 SNS형 식단 기록 서비스. 먹은 것을 사진으로
              남기고, 체중 변화를 직접 확인하세요.
            </p>
            <div className={styles.footerSocial}>
              <a
                className={styles.socialBtn}
                href="https://blog.naver.com"
                target="_blank"
                rel="noreferrer"
                title="네이버 블로그"
              >
                <svg width="16" height="16" viewBox="0 0 24 24">
                  <path
                    d="M16.273 12.845 7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727z"
                    fill="#03C75A"
                  />
                </svg>
              </a>
              <a
                className={styles.socialBtn}
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                title="유튜브"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#FF0000">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>
              <a
                className={styles.socialBtn}
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                title="GitHub"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                  <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                </svg>
              </a>
            </div>
          </div>

          <div className={styles.footerCol}>
            <div className={styles.footerColTitle}>서비스</div>
            <ul className={styles.footerColList}>
              <li className={styles.footerColItem}>
                <a className={styles.footerColLink}>피드 둘러보기</a>
              </li>
              <li className={styles.footerColItem}>
                <a className={styles.footerColLink}>식단 기록하기</a>
              </li>
              <li className={styles.footerColItem}>
                <a className={styles.footerColLink}>날짜별 조회</a>
              </li>
              <li className={styles.footerColItem}>
                <a className={styles.footerColLink}>체중 변화 통계</a>
              </li>
            </ul>
          </div>

          <div className={styles.footerCol}>
            <div className={styles.footerColTitle}>고객지원</div>
            <ul className={styles.footerColList}>
              <li className={styles.footerColItem}>
                <a className={styles.footerColLink}>공지사항</a>
              </li>
              <li className={styles.footerColItem}>
                <a className={styles.footerColLink}>자주 묻는 질문</a>
              </li>
              <li className={styles.footerColItem}>
                <a className={styles.footerColLink}>문의하기</a>
              </li>
              <li className={styles.footerColItem}>
                <a className={styles.footerColLink}>이용 가이드</a>
              </li>
            </ul>
          </div>

          <div className={styles.footerCol}>
            <div className={styles.footerColTitle}>회사 정보</div>
            <ul className={styles.footerColList}>
              <li className={styles.footerColItem}>
                <a className={styles.footerColLink}>서비스 소개</a>
              </li>
              <li className={styles.footerColItem}>
                <a className={styles.footerColLink}>이용약관</a>
              </li>
              <li className={styles.footerColItem}>
                <a
                  className={`${styles.footerColLink} ${styles.footerPrivacy}`}
                >
                  개인정보처리방침
                </a>
              </li>
              <li className={styles.footerColItem}>
                <a className={styles.footerColLink}>채용 안내</a>
              </li>
            </ul>
          </div>
        </div>

        <div className={styles.footerBottom}>
          <p className={styles.footerLegal}>
            상호: (주)밀플랜 &nbsp;|&nbsp; 대표: 장지혁 &nbsp;|&nbsp;
            사업자등록번호: 123-45-67890
            <br />
            주소: 서울특별시 영등포구 우리집로 123, 1층 &nbsp;|&nbsp; 고객센터:
            02-1234-5678 &nbsp;|&nbsp; 이메일: support@mealplan.kr
          </p>
          <div className={styles.footerBottomLinks}>
            <a className={styles.footerBottomLink}>이용약관</a>
            <a className={`${styles.footerBottomLink} ${styles.privacyLink}`}>
              개인정보처리방침
            </a>
            <a className={styles.footerBottomLink}>사업자정보확인</a>
          </div>
        </div>

        <p className={styles.footerCopyright}>
          © {year} MealPlan. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
