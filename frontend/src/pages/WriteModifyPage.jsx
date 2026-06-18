import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styles from "./WriteModifyPage.module.css";
import Swal from "sweetalert2";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";

const TITLE_MAX = 50;
const CONTENT_MAX = 1000;
const EMPTY_SLOT = { type: null, url: null, file: null };

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

export default function WriteModifyPage() {
  const { writeId } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();

  const [loading, setLoading] = useState(true);

  // slots[idx] = { type: "existing" | "new" | null, url, file }
  // type이 "existing"이면 기존에 등록돼 있던 사진, "new"면 이번에 새로 첨부한 사진
  const [slots, setSlots] = useState([
    EMPTY_SLOT,
    EMPTY_SLOT,
    EMPTY_SLOT,
    EMPTY_SLOT,
  ]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [calories, setCalories] = useState("");
  const hasImage = slots.some((s) => s.type !== null);

  // 게시물 정보를 불러와 폼에 미리 채워넣음 (본인 게시물이 아니면 접근 차단)
  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_BACKSERVER}/writes/${writeId}`)
      .then((res) => {
        const post = res.data;

        if (!user?.userId || user.userId !== post.userId) {
          Swal.fire({
            title: "수정 권한이 없습니다",
            text: "본인이 작성한 게시물만 수정할 수 있습니다.",
            icon: "warning",
          }).then(() => navigate(-1));
          return;
        }

        setTitle(post.title ?? "");
        setContent(post.content ?? "");
        setCalories(post.calories ?? "");

        const urls = post.imageUrls ?? [];
        setSlots(
          [0, 1, 2, 3].map((idx) =>
            urls[idx]
              ? { type: "existing", url: urls[idx], file: null }
              : EMPTY_SLOT,
          ),
        );
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [writeId]);

  const handleImgChange = (idx, e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      Swal.fire({
        title: "지원하지 않는 파일 형식입니다",
        text: "JPG·JPEG·PNG·WEBP 형식의 이미지만 첨부할 수 있습니다.",
        icon: "warning",
      });
      e.target.value = "";
      return;
    }

    const url = URL.createObjectURL(file);
    setSlots((prev) => {
      const n = [...prev];
      n[idx] = { type: "new", url, file };
      return n;
    });
  };

  const removeImg = (idx) => {
    setSlots((prev) => {
      const n = [...prev];
      n[idx] = EMPTY_SLOT;
      return n;
    });
  };

  const handleTitleChange = (e) => {
    const value = e.target.value;
    if (value.length > TITLE_MAX) {
      Swal.fire({
        title: "글자 수를 초과했습니다",
        text: `제목은 최대 ${TITLE_MAX}자까지 입력할 수 있습니다.`,
        icon: "warning",
      });
      setTitle(value.slice(0, TITLE_MAX));
      return;
    }
    setTitle(value);
  };

  const handleContentChange = (e) => {
    const value = e.target.value;
    if (value.length > CONTENT_MAX) {
      Swal.fire({
        title: "글자 수를 초과했습니다",
        text: `내용은 최대 ${CONTENT_MAX.toLocaleString("ko-KR")}자까지 입력할 수 있습니다.`,
        icon: "warning",
      });
      setContent(value.slice(0, CONTENT_MAX));
      return;
    }
    setContent(value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!hasImage) {
      Swal.fire({ title: "사진을 1장 이상 첨부해주세요.", icon: "warning" });
      return;
    }
    if (!title.trim()) {
      Swal.fire({ title: "제목을 입력해주세요.", icon: "warning" });
      return;
    }
    if (!calories) {
      Swal.fire({ title: "칼로리를 입력해주세요.", icon: "warning" });
      return;
    }

    const formData = new FormData();
    formData.append("title", title.trim());
    if (content.trim()) formData.append("content", content.trim());
    formData.append("calories", calories);
    slots.forEach((s) => {
      if (s.type === "existing") formData.append("existingImageUrls", s.url);
      if (s.type === "new") formData.append("images", s.file);
    });

    axios
      .post(`${import.meta.env.VITE_BACKSERVER}/writes/${writeId}`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(() => {
        Swal.fire({
          title: "게시물이 수정되었습니다!",
          icon: "success",
        }).then(() => {
          navigate(`/mealplan/write-view/${writeId}`);
        });
      })
      .catch((err) => {
        Swal.fire({
          title: "수정에 실패했습니다",
          text: err.response?.data || "잠시 후 다시 시도해주세요.",
          icon: "error",
        });
      });
  };

  if (loading) {
    return (
      <div className={`page ${styles.write_page}`}>
        <div className="wrap">불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className={`page ${styles.write_page}`}>
      <div className="wrap">
        <div className={styles.write_card}>
          <div className={styles.write_header}>
            <button
              className={styles.write_back_btn}
              onClick={() => navigate(-1)}
            >
              ←
            </button>
            <h2 className={styles.write_heading}>식단 기록 수정하기</h2>
            <span className={styles.required_notice}>
              <span className={styles.required_mark}>*</span>는 필수 항목입니다.
            </span>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">
                사진 <span className="required">*</span>
                <span className={styles.char_count}>
                  최대 4장 / JPG·JPEG·PNG·WEBP / 장당 10MB
                </span>
              </label>
              <div className={styles.img_upload_grid}>
                {slots.map((slot, idx) => (
                  <div
                    key={idx}
                    className={[
                      styles.img_slot,
                      idx === 0 ? styles.required_slot : "",
                      slot.url ? styles.filled : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() =>
                      !slot.url && document.getElementById(`img-${idx}`).click()
                    }
                  >
                    {slot.url ? (
                      <>
                        <img src={slot.url} alt="" />
                        <button
                          type="button"
                          className={styles.img_remove}
                          onClick={(e) => {
                            e.stopPropagation();
                            removeImg(idx);
                          }}
                        >
                          ×
                        </button>
                      </>
                    ) : (
                      <>
                        <span className={styles.add_icon}>+</span>
                        <span>{idx === 0 ? "필수" : "선택"}</span>
                      </>
                    )}
                    <input
                      id={`img-${idx}`}
                      type="file"
                      accept="image/jpg,image/jpeg,image/png,image/webp"
                      style={{ display: "none" }}
                      onChange={(e) => handleImgChange(idx, e)}
                    />
                  </div>
                ))}
              </div>
              {!hasImage && (
                <div className="form-hint">
                  ※ 사진 없이는 수정할 수 없습니다
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">
                칼로리 <span className="required">*</span>
              </label>
              <div className={styles.calorie_wrap}>
                <input
                  type="number"
                  className="form-input"
                  placeholder="0"
                  min="0"
                  max="9999"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                  disabled={!hasImage}
                />
                <span className={styles.calorie_unit}>kcal</span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                제목 <span className="required">*</span>
                <span
                  className={`${styles.char_count} ${
                    title.length >= TITLE_MAX ? styles.max_reached : ""
                  }`}
                >
                  {title.length}/{TITLE_MAX}
                </span>
              </label>
              <input
                className="form-input"
                placeholder="오늘의 식단 제목을 입력하세요"
                value={title}
                onChange={handleTitleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                내용 <span className={styles.char_count}>(선택)</span>
                <span
                  className={`${styles.char_count} ${
                    content.length >= CONTENT_MAX ? styles.max_reached : ""
                  }`}
                >
                  {content.length.toLocaleString("ko-KR")}/
                  {CONTENT_MAX.toLocaleString("ko-KR")}
                </span>
              </label>
              <textarea
                className="form-input"
                placeholder="오늘 식단에 대한 메모를 남겨보세요"
                value={content}
                onChange={handleContentChange}
              />
            </div>

            <button
              type="submit"
              className={`btn btn-primary ${styles.write_submit}`}
            >
              수정 완료
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
