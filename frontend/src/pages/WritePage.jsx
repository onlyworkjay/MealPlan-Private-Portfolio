import { useState } from "react";
import styles from "./WritePage.module.css";
import Swal from "sweetalert2";

// 제목/내용 최대 길이 50자/1,000자
const TITLE_MAX = 50;
const CONTENT_MAX = 1000;

export default function WritePage({ onNavigate }) {
  const [images, setImages] = useState([null, null, null, null]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [calories, setCalories] = useState("");
  const hasImage = images.some((i) => i !== null);

  // 허용된 이미지 형식이 아니면 SWAL 출력 및 미첨부
  const ALLOWED_IMAGE_TYPES = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ];

  const handleImgChange = (idx, e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      Swal.fire({
        title: "지원하지 않는 파일 형식입니다",
        text: "JPG·JPEG·PNG·WEBP 형식의 이미지만 첨부할 수 있습니다.",
        icon: "warning",
      });
      e.target.value = ""; // 같은 파일을 다시 선택해도 onChange가 동작하도록 초기화
      return;
    }

    const url = URL.createObjectURL(file);
    setImages((prev) => {
      const n = [...prev];
      n[idx] = url;
      return n;
    });
  };
  const removeImg = (idx) =>
    setImages((prev) => {
      const n = [...prev];
      n[idx] = null;
      return n;
    });

  // 제목 글자 수 제한 - 초과 시 Swal 경고 후 최대 길이로 잘라냄
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

  // 내용 글자 수 제한 - 초과 시 Swal 경고 후 최대 길이로 잘라냄
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
      alert("사진을 1장 이상 첨부해주세요.");
      return;
    }
    if (!calories) {
      alert("칼로리를 입력해주세요.");
      return;
    }
    alert("게시물이 등록되었습니다!");
    onNavigate("feed");
  };

  return (
    <div className={`page ${styles.write_page}`}>
      <div className="wrap">
        <div className={styles.write_card}>
          <div className={styles.write_header}>
            <button
              className={styles.write_back_btn}
              onClick={() => onNavigate("feed")}
            >
              ←
            </button>
            <h2 className={styles.write_heading}>식단 기록하기</h2>
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
                {images.map((img, idx) => (
                  <div
                    key={idx}
                    className={[
                      styles.img_slot,
                      idx === 0 ? styles.required_slot : "",
                      img ? styles.filled : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() =>
                      !img && document.getElementById(`img-${idx}`).click()
                    }
                  >
                    {img ? (
                      <>
                        <img src={img} alt="" />
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
                  ※ 사진 없이는 등록할 수 없습니다 / 하루 최대 3번 업로드 가능
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
              {!hasImage && (
                <div className="form-hint">
                  사진을 먼저 첨부해야 칼로리를 입력할 수 있습니다
                </div>
              )}
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
              게시물 등록하기
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
