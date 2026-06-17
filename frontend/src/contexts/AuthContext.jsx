import { createContext, useContext, useState, useEffect, useRef } from "react";
import axios from "axios";
import Swal from "sweetalert2";

const AuthContext = createContext(null);

// JWT 페이로드에서 만료 시각(ms)을 꺼내는 헬퍼
function getTokenExpiry(token) {
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(
      atob(payload.replace(/-/g, "+").replace(/_/g, "/")),
    );
    return decoded.exp ? decoded.exp * 1000 : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [remainingSeconds, setRemainingSeconds] = useState(null);
  const warnedRef = useRef(false);

  // 새로고침해도 로그인 상태 유지
  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    if (savedToken && savedUser) {
      const exp = getTokenExpiry(savedToken);
      if (exp && exp > Date.now()) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } else {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
  }, []);

  const login = (newToken, newUser) => {
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(newUser));
    warnedRef.current = false;
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    warnedRef.current = false;
    setToken(null);
    setUser(null);
    setRemainingSeconds(null);
  };

  const extendSession = async () => {
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKSERVER}/users/refresh`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const newToken = res.data.token;
      localStorage.setItem("token", newToken);
      setToken(newToken);
      warnedRef.current = false;
      Swal.fire({
        icon: "success",
        title: "세션이 연장되었습니다",
        confirmButtonColor: "#38BDF8",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "세션 연장에 실패했습니다",
        text: "다시 로그인해주세요.",
        confirmButtonColor: "#38BDF8",
      });
    }
  };

  // 1초마다 남은 시간 갱신 + 5분 남았을 때 연장 안내
  useEffect(() => {
    if (!token) {
      setRemainingSeconds(null);
      return;
    }

    const tick = () => {
      const exp = getTokenExpiry(token);
      if (!exp) return;

      const remaining = Math.max(0, Math.round((exp - Date.now()) / 1000));
      setRemainingSeconds(remaining);

      if (remaining <= 0) {
        logout();
        Swal.fire({
          icon: "info",
          title: "세션이 만료되었습니다",
          text: "다시 로그인해주세요.",
          confirmButtonColor: "#38BDF8",
        });
        return;
      }

      if (remaining <= 300 && !warnedRef.current) {
        warnedRef.current = true;
        Swal.fire({
          icon: "warning",
          title: "세션이 곧 종료됩니다",
          text: "5분 후 자동 로그아웃됩니다. 연장하시겠습니까?",
          showCancelButton: true,
          confirmButtonText: "연장하기",
          cancelButtonText: "아니요",
          confirmButtonColor: "#38BDF8",
          cancelButtonColor: "#94A3B8",
        }).then((result) => {
          if (result.isConfirmed) {
            extendSession();
          }
        });
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn: !!token,
        user,
        token,
        remainingSeconds,
        login,
        logout,
        extendSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
