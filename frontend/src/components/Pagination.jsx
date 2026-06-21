import styles from "../styles/Pagination.module.css";

/**
 * Pagination 컴포넌트
 *
 * Props:
 *   currentPage  : number  - 현재 페이지 (1-based)
 *   totalPages   : number  - 전체 페이지 수
 *   onPageChange : (page: number) => void
 *
 * 사용 예시:
 *   <Pagination currentPage={page} totalPages={10} onPageChange={setPage} />
 */
export default function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const getPages = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }
    pages.push(1);
    if (currentPage > 4) pages.push("...");
    const start = Math.max(2, currentPage - 1);
    const end   = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (currentPage < totalPages - 3) pages.push("...");
    pages.push(totalPages);
    return pages;
  };

  return (
    <nav className={styles.pagination} aria-label="페이지 이동">
      <button
        className={styles["pagination-btn"]}
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="이전 페이지"
      >
        ‹
      </button>

      {getPages().map((p, idx) =>
        p === "..." ? (
          <span className={styles["pagination-ellipsis"]} key={`ellipsis-${idx}`}>…</span>
        ) : (
          <button
            key={p}
            className={`${styles["pagination-btn"]}${currentPage === p ? ` ${styles.active}` : ""}`}
            onClick={() => onPageChange(p)}
            aria-current={currentPage === p ? "page" : undefined}
          >
            {p}
          </button>
        )
      )}

      <button
        className={styles["pagination-btn"]}
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="다음 페이지"
      >
        ›
      </button>
    </nav>
  );
}