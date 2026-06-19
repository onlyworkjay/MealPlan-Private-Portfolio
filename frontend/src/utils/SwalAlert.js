import Swal from "sweetalert2";

import successIcon from "../assets/swal/success.svg";
import warningIcon from "../assets/swal/warning.svg";
import questionIcon from "../assets/swal/question.svg";
import infoIcon from "../assets/swal/info.svg";
import errorIcon from "../assets/swal/error.svg";

const COLORS = {
  primaryDeeper: "#0369a1",
  primarySoft: "#e0f4fd",
  primaryMid: "#bae6fd",
  text: "#0f172a",
  textSub: "#475569",
  danger: "#ef4444",
};

const ICONS = {
  success: successIcon,
  warning: warningIcon,
  question: questionIcon,
  info: infoIcon,
  error: errorIcon,
};

const TYPE_ACCENT = {
  success: "#0284c7",
  warning: "#ef4444",
  question: "#9333ea",
  info: "#65a30d",
  error: "#f0a500",
};

export const showSwal = ({
  type = "info",
  title,
  text,
  confirmButtonText = "확인",
  confirmButtonColor, // 지정 안 하면 기본 파란색(primaryDeeper) 사용
  showCancelButton = false,
  cancelButtonText = "취소",
}) => {
  const accent = TYPE_ACCENT[type] ?? TYPE_ACCENT.info;
  const confirmColor = confirmButtonColor ?? COLORS.primaryDeeper;

  return Swal.fire({
    html: `
      <img src="${ICONS[type]}" alt="${type}" style="width:120px;height:120px;margin:0 auto 18px;display:block;" />
      <div style="font-size:19px;font-weight:700;color:${COLORS.text};margin-bottom:6px;">
        ${title}
      </div>
      ${
        text
          ? `<div style="font-size:14px;color:${COLORS.textSub};line-height:1.5;">${text}</div>`
          : ""
      }
    `,
    background: COLORS.primarySoft,
    showConfirmButton: true,
    confirmButtonText,
    showCancelButton,
    cancelButtonText,
    buttonsStyling: false,
    didOpen: (popup) => {
      popup.style.borderRadius = "20px";
      popup.style.padding = "32px 24px";
      popup.style.boxShadow = `0 10px 40px ${accent}33`;

      // 버튼 그룹 자체에 간격(gap) 부여 - 두 버튼이 붙지 않도록
      const actions = popup.querySelector(".swal2-actions");
      if (actions) {
        actions.style.gap = "12px";
      }

      const confirmBtn = popup.querySelector(".swal2-confirm");
      if (confirmBtn) {
        confirmBtn.style.background = confirmColor;
        confirmBtn.style.color = "#ffffff";
        confirmBtn.style.border = "none";
        confirmBtn.style.borderRadius = "12px";
        confirmBtn.style.padding = "10px 28px";
        confirmBtn.style.fontSize = "14px";
        confirmBtn.style.fontWeight = "600";
        confirmBtn.style.boxShadow = `0 4px 12px ${confirmColor}55`;
        confirmBtn.style.cursor = "pointer";
        confirmBtn.style.marginRight = "0"; // gap이 처리하므로 margin 중복 제거
      }

      const cancelBtn = popup.querySelector(".swal2-cancel");
      if (cancelBtn) {
        cancelBtn.style.background = "#ffffff";
        cancelBtn.style.color = COLORS.textSub;
        cancelBtn.style.border = `1px solid ${COLORS.primaryMid}`;
        cancelBtn.style.borderRadius = "12px";
        cancelBtn.style.padding = "10px 28px";
        cancelBtn.style.fontSize = "14px";
        cancelBtn.style.fontWeight = "600";
        cancelBtn.style.marginLeft = "0"; // gap이 처리하므로 margin 중복 제거
        cancelBtn.style.cursor = "pointer";
      }
    },
  });
};