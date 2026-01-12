import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import { useUser } from "./UserContext";

const UserTowerContext = createContext();

export function UserTowerProvider({ children }) {
  const { user, loading: userLoading } = useUser();
  const [myTowers, setMyTowers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTowers = async () => {
    setLoading(true);

    try {
      // ✅ 로그인 된 경우 → 내 타워
      const res = await axios.get("/api/towers", {
        withCredentials: true,
      });
      setMyTowers(res.data);
    } catch (e) {
      console.error("보유 타워 조회 실패:", e);

      // ❗ 실패해도 앱 죽이지 않음
      setMyTowers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userLoading) {
      fetchTowers();
    }
  }, [userLoading, user]);

  return (
    <UserTowerContext.Provider
      value={{
        myTowers,
        loading,
        refreshTowers: fetchTowers,
      }}
    >
      {children}
    </UserTowerContext.Provider>
  );
}

export function useMyTowers() {
  return useContext(UserTowerContext);
}
