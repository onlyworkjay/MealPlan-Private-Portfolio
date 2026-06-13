import { useEffect } from "react";
import { useLocation } from "react-router-dom";

{
  /* 페이지 이동할 때마다 스크롤이 항상 맨 위로 가게 해줌 */
}
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

export default ScrollToTop;
