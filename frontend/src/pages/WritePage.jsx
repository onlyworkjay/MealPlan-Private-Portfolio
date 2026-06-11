import { useState } from "react";
import "../styles/WritePage.css";

export default function WritePage({ onNavigate }) {
  const [images, setImages]     = useState([null, null, null, null]);
  const [title, setTitle]       = useState("");
  const [content, setContent]   = useState("");
  const [calories, setCalories] = useState("");
  const hasImage = images.some(i => i !== null);

  const handleImgChange = (idx, e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImages(prev => { const n=[...prev]; n[idx]=url; return n; });
  };
  const removeImg = idx => setImages(prev => { const n=[...prev]; n[idx]=null; return n; });

  const handleSubmit = e => {
    e.preventDefault();
    if (!hasImage) { alert("사진을 1장 이상 첨부해주세요."); return; }
    if (!calories) { alert("칼로리를 입력해주세요."); return; }
    alert("게시물이 등록되었습니다!");
    onNavigate("feed");
  };

  return (
    <div className="page write-page">
      <div className="wrap">
        <div className="write-card">
          <div className="write-header">
            <button className="write-back-btn" onClick={() => onNavigate("feed")}>←</button>
            <h2 className="write-heading">식단 기록하기</h2>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">
                사진 <span className="required">*</span>
                <span className="char-count">최대 4장 / JPG·JPEG·PNG·WEBP / 장당 10MB</span>
              </label>
              <div className="img-upload-grid">
                {images.map((img, idx) => (
                  <div
                    key={idx}
                    className={["img-slot", idx===0 ? "required-slot" : "", img ? "filled" : ""].filter(Boolean).join(" ")}
                    onClick={() => !img && document.getElementById(`img-${idx}`).click()}
                  >
                    {img ? (
                      <>
                        <img src={img} alt="" />
                        <button type="button" className="img-remove" onClick={e => { e.stopPropagation(); removeImg(idx); }}>×</button>
                      </>
                    ) : (
                      <>
                        <span className="add-icon">+</span>
                        <span>{idx === 0 ? "필수" : "선택"}</span>
                      </>
                    )}
                    <input id={`img-${idx}`} type="file" accept="image/jpg,image/jpeg,image/png,image/webp" style={{ display:"none" }} onChange={e => handleImgChange(idx, e)} />
                  </div>
                ))}
              </div>
              {!hasImage && <div className="form-hint">※ 사진 없이는 등록할 수 없습니다 / 하루 최대 3번 업로드 가능</div>}
            </div>

            <div className="form-group">
              <label className="form-label">칼로리 <span className="required">*</span></label>
              <div className="calorie-wrap">
                <input type="number" className="form-input" placeholder="0" min="0" max="9999" value={calories} onChange={e => setCalories(e.target.value)} disabled={!hasImage} />
                <span className="calorie-unit">kcal</span>
              </div>
              {!hasImage && <div className="form-hint">사진을 먼저 첨부해야 칼로리를 입력할 수 있습니다</div>}
            </div>

            <div className="form-group">
              <label className="form-label">
                제목 <span className="required">*</span>
                <span className="char-count">{title.length}/50</span>
              </label>
              <input className="form-input" placeholder="오늘의 식단 제목을 입력하세요" maxLength={50} value={title} onChange={e => setTitle(e.target.value)} required />
            </div>

            <div className="form-group">
              <label className="form-label">내용 <span className="char-count">(선택)</span></label>
              <textarea className="form-input" placeholder="오늘 식단에 대한 메모를 남겨보세요" value={content} onChange={e => setContent(e.target.value)} />
            </div>

            <button type="submit" className="btn btn-primary write-submit">게시물 등록하기</button>
          </form>
        </div>
      </div>
    </div>
  );
}
