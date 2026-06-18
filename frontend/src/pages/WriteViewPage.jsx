import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import styles from "./WriteViewPage.module.css";
import defaultProfile from "../assets/default-profile.svg";
import { useAuth } from "../contexts/AuthContext";

// 날짜+시간을 "YYYY.MM.DD HH:MM" 형식으로 표시 (초는 표시하지 않음)
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

const WriteViewPage = () => {
  const { writeId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);

  useEffect(() => {
    setLoading(true);
    axios
      .get(`${import.meta.env.VITE_BACKSERVER}/writes/${writeId}`)
      .then((res) => {
        setPost(res.data);
        setActiveImg(0);
      })
      .catch((err) => {
        Swal.fire({
          title: "게시물을 불러오지 못했습니다",
          text:
            err.response?.data || "삭제되었거나 존재하지 않는 게시물입니다.",
          icon: "error",
        }).then(() => navigate(-1));
      })
      .finally(() => setLoading(false));
  }, [writeId, navigate]);

  if (loading) {
    return (
      <div className={`page ${styles.view_page}`}>
        <div className="wrap">불러오는 중...</div>
      </div>
    );
  }

  if (!post) return null;

  const images = post.imageUrls ?? [];
  // 비회원이거나 작성자가 아니면 false (user가 없으면 user?.userId는 undefined이므로 자연히 걸러짐)
  const isAuthor = user?.userId != null && user.userId === post.userId;

  const goPrev = () => setActiveImg((i) => Math.max(0, i - 1));
  const goNext = () => setActiveImg((i) => Math.min(images.length - 1, i + 1));

  return (
    <div className={`page ${styles.view_page}`}>
      <div className="wrap">
        <div className={styles.view_card}>
          <div className={styles.header_row}>
            <button
              type="button"
              className={styles.back_btn}
              onClick={() => navigate(-1)}
            >
              ← 목록으로
            </button>
            {isAuthor && (
              <div className={styles.owner_actions}>
                <button type="button" className="btn btn-ghost btn-sm">
                  수정
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${styles.btn_delete}`}
                >
                  삭제
                </button>
              </div>
            )}
          </div>

          {images.length > 0 && (
            <div className={styles.gallery}>
              <div className={styles.main_img_wrap}>
                <img src={images[activeImg]} alt={post.title} />
                {activeImg > 0 && (
                  <button
                    type="button"
                    className={`${styles.slide_arrow} ${styles.slide_arrow_left}`}
                    onClick={goPrev}
                    aria-label="이전 사진"
                  >
                    ‹
                  </button>
                )}
                {activeImg < images.length - 1 && (
                  <button
                    type="button"
                    className={`${styles.slide_arrow} ${styles.slide_arrow_right}`}
                    onClick={goNext}
                    aria-label="다음 사진"
                  >
                    ›
                  </button>
                )}
              </div>
              {images.length > 1 && (
                <div className={styles.thumb_row}>
                  {images.map((url, idx) => (
                    <button
                      key={url}
                      type="button"
                      className={[
                        styles.thumb_btn,
                        idx === activeImg ? styles.thumb_active : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      onClick={() => setActiveImg(idx)}
                    >
                      <img src={url} alt="" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className={styles.meta_row}>
            <img
              className={styles.author_avatar}
              src={post.profileImg || defaultProfile}
              alt={post.nickname}
            />
            <div className={styles.author_info}>
              <div className={styles.author_name}>
                {post.nickname ?? "알 수 없음"}
              </div>
              <div className={styles.post_date}>
                {formatDateTime(post.createdAt)}
              </div>
            </div>
            <span className={styles.cal_badge}>🔥 {post.calories} kcal</span>
          </div>

          <h1 className={styles.title}>{post.title}</h1>
          {post.content && <p className={styles.content}>{post.content}</p>}
        </div>
      </div>
    </div>
  );
};

export default WriteViewPage;
