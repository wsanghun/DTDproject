import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const TowerContext = createContext();

export function TowerProvider({ children }) {
  const [towers, setTowers] = useState([]);
  const [loading, setLoading] = useState(true);

  // ⭐ 공통적으로 타워를 다시 불러오는 함수
  const refreshTowers = async () => {
    try {
      const res = await axios.get("/api/towers", { withCredentials: true });
      setTowers(res.data);
      return res.data; // TowerDetail에서 업데이트 타워 찾을 때 필요
    } catch (err) {
      console.error("❌ 타워 갱신 실패:", err);
      throw err; // TowerDetail에서 catch로 전달됨
    }
  };

  // 최초 로딩
  useEffect(() => {
    refreshTowers().finally(() => setLoading(false));
  }, []);

  return (
    <TowerContext.Provider value={{ towers, loading, refreshTowers }}>
      {children}
    </TowerContext.Provider>
  );
}

export function useTowers() {
  return useContext(TowerContext);
}
