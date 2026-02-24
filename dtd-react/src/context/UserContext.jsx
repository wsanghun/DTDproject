import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [gold, setGold] = useState(0);
  const [data, setData] = useState(0); // ⭐ 파편
  const [loading, setLoading] = useState(true);

  /* =========================
     유저 정보 로드
  ========================= */
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get("/api/users/me", {
          withCredentials: true,
          timeout: 3000,
        });

        const u = res.data;

        setUser(u);
        setGold(u.gold ?? 0);
        setData(u.data ?? 0);
      } catch (err) {
        console.warn("서버 응답 없음 → 비로그인 상태");
        setUser(null);
        setGold(0);
        setData(0);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  /* =========================
     ⭐ 로그아웃
  ========================= */
  const logout = async () => {
    try {
      // 🔹 서버에 로그아웃 API가 있다면 호출
      await axios.post("/api/users/logout", {}, { withCredentials: true });
    } catch (e) {
      // 서버 없어도 프론트 로그아웃은 진행
      console.warn("로그아웃 API 실패 (무시)");
    } finally {
      // 🔹 프론트 상태 초기화
      setUser(null);
      setGold(0);
      setData(0);
    }
  };

  return (
    <UserContext.Provider
      value={{
        user,
        setUser,
        gold,
        setGold,
        data,
        setData,
        loading,
        logout, // ⭐ 추가됨
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
