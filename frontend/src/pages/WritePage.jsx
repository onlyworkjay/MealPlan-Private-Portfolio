import { useState } from "react";
import styles from "./WritePage.module.css";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import { showSwal } from "../utils/SwalAlert";

const TITLE_MAX = 50;
const CONTENT_MAX = 1000;

export default function WritePage({ onNavigate }) {
  const { token } = useAuth();

  // images: 미리보기용 URL, imageFiles: 실제 업로드할 File 객체 (같은 인덱스로 매칭)
  const [images, setImages] = useState([null, null, null, null]);
  const [imageFiles, setImageFiles] = useState([null, null, null, null]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [calories, setCalories] = useState("");
  const hasImage = images.some((i) => i !== null);

  // 허용된 이미지 형식이 아니면 경고를 띄우고 첨부하지 않음
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
      showSwal({
        type: "warning",
        title: "지원하지 않는 파일 형식입니다",
        text: "JPG·JPEG·PNG·WEBP 형식의 이미지만 첨부할 수 있습니다.",
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
    setImageFiles((prev) => {
      const n = [...prev];
      n[idx] = file;
      return n;
    });
  };
  const removeImg = (idx) => {
    setImages((prev) => {
      const n = [...prev];
      n[idx] = null;
      return n;
    });
    setImageFiles((prev) => {
      const n = [...prev];
      n[idx] = null;
      return n;
    });
  };

  // 제목 글자 수 제한 - 초과 시 경고 후 최대 길이로 잘라냄
  const handleTitleChange = (e) => {
    const value = e.target.value;
    if (value.length > TITLE_MAX) {
      showSwal({
        type: "warning",
        title: "글자 수를 초과했습니다",
        text: `제목은 최대 ${TITLE_MAX}자까지 입력할 수 있습니다.`,
      });
      setTitle(value.slice(0, TITLE_MAX));
      return;
    }
    setTitle(value);
  };

  // 내용 글자 수 제한 - 초과 시 경고 후 최대 길이로 잘라냄
  const handleContentChange = (e) => {
    const value = e.target.value;
    if (value.length > CONTENT_MAX) {
      showSwal({
        type: "warning",
        title: "글자 수를 초과했습니다",
        text: `내용은 최대 ${CONTENT_MAX.toLocaleString("ko-KR")}자까지 입력할 수 있습니다.`,
      });
      setContent(value.slice(0, CONTENT_MAX));
      return;
    }
    setContent(value);
  };

  // ⬇️ 수정된 부분: 등록 성공 시 피드 목록이 아니라, 방금 작성한 게시물의 상세보기 페이지로 이동
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!hasImage) {
      showSwal({ type: "warning", title: "사진을 1장 이상 첨부해주세요." });
      return;
    }
    if (!title.trim()) {
      showSwal({ type: "warning", title: "제목을 입력해주세요." });
      return;
    }
    if (!calories) {
      showSwal({ type: "warning", title: "칼로리를 입력해주세요." });
      return;
    }

    const formData = new FormData();
    formData.append("title", title.trim());
    if (content.trim()) formData.append("content", content.trim());
    formData.append("calories", calories);
    imageFiles.forEach((file) => {
      if (file) formData.append("images", file);
    });

    axios
      .post(`${import.meta.env.VITE_BACKSERVER}/writes`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        showSwal({
          type: "success",
          title: "피드가 등록되었습니다!",
        }).then(() => {
          onNavigate(`mealplan/write-view/${res.data.writeId}`);
        });
      })
      .catch((err) => {
        showSwal({
          type: "error",
          title: "등록에 실패했습니다",
          text: err.response?.data || "잠시 후 다시 시도해주세요.",
        });
      });
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
                  최대 4장 / JPG·JPEG·PNG·WEBP 형식만 가능 / 장당 최대 10MB까지
                  가능
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
            피드 등록하기
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
