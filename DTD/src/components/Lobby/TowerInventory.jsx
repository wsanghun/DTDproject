import { useState, useEffect, useCallback } from "react";
import { useMyTowers } from "../../context/UserTowerContext";
import { useTowers } from "../../context/TowerContext";
import { useUser } from "../../context/UserContext";
import TowerDetail from "./TowerDetail";
import "../../css/TowerInventory.css";

export default function TowerInventory({ onBack }) {
  // =========================
  // Context
  // =========================
  const { towers, loading, refreshTowers } = useTowers();
  const { myTowers } = useMyTowers();
  const { user } = useUser();

  // =========================
  // State
  // =========================
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [fragments, setFragments] = useState({});

  // =========================
  // Inventory (Fragments)
  // =========================
  const fetchInventory = useCallback(async () => {
    try {
      const res = await fetch("/api/users/me/inventory", {
        credentials: "include",
      });
      const items = await res.json();

      const fragmentMap = {};
      items.forEach((item) => {
        if (item.effectType === "DATA") {
          fragmentMap[item.itemIdx] = item.quantity;
        }
      });

      setFragments(fragmentMap);
    } catch (err) {
      console.error("inventory fetch error", err);
    }
  }, []);

  // 최초 1회 로딩
  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  // =========================
  // ESC 닫기
  // =========================
  useEffect(() => {
    const handleESC = (e) => {
      if (e.key === "Escape") onBack();
    };
    window.addEventListener("keydown", handleESC);
    return () => window.removeEventListener("keydown", handleESC);
  }, [onBack]);

  // =========================
  // Loading
  // =========================
  if (loading) {
    return (
      <div className="inventory-container">
        <h2>Loading...</h2>
      </div>
    );
  }

  // =========================
  // 현재 선택된 타워
  // =========================
  const current =
    towers.find((t) => t.towerIdx === selectedIdx) ?? towers[0] ?? null;

  // =========================
  // 유저 타워 레벨
  // =========================
  const getUserTier = (towerIdx) => {
    const info = myTowers.find((t) => t.towerIdx === towerIdx);
    return info?.currentLevel ?? 0;
  };

  // =========================
  // 표시용 티어 (색상 기준)
  // =========================
  const getDisplayTier = (level) => {
    if (level >= 20) return 4; // 노란색
    if (level >= 15) return 3; // 보라색
    if (level >= 10) return 2; // 파란색
    if (level >= 5) return 1; // 흰색
    return 0; // 기본
  };

  // =========================
  // 파편 개수
  // =========================
  const getFragmentCount = (towerIdx) => {
    return fragments[towerIdx] ?? 0;
  };

  // =========================
  // Render
  // =========================
  return (
    <div className="inventory-container">
      {/* 좌측 디테일 */}
      <div className="left-panel">
        {current && (
          <TowerDetail
            tower={current}
            userTier={getUserTier(current.towerIdx)}
            fragmentCount={getFragmentCount(current.towerIdx)}
            refreshTowers={refreshTowers}
            refreshInventory={fetchInventory} // ⭐ 추가됨
          />
        )}
      </div>

      {/* 우측 인벤토리 */}
      <div className="right-panel">
        <div className="inventory-grid">
          {towers.map((tower) => {
            const isSelected =
              (selectedIdx ?? current?.towerIdx) === tower.towerIdx;

            const level = getUserTier(tower.towerIdx);
            const displayTier = getDisplayTier(level);

            const canEnhance =
              user?.gold >= tower.nextLevelCost &&
              getFragmentCount(tower.towerIdx) >= tower.nextLevelDataCost;

            return (
              <div
                key={tower.towerIdx}
                className={`
        inventory-card
        tier-${displayTier}
        ${isSelected ? "selected" : ""}
        ${canEnhance ? "can-enhance" : ""}
      `}
                onClick={() => setSelectedIdx(tower.towerIdx)}
              >
                {/* 대표 타워 */}
                {user?.mainTower?.tower?.idx === tower.towerIdx && (
                  <div className="main-star">★</div>
                )}

                <img
                  src={
                    new URL(
                      `../../assets/images/Towerimages/tier${tower.tier}/${tower.towerIdx}.png`,
                      import.meta.url
                    ).href
                  }
                  className="tower-img"
                  alt=""
                />

                {/* 파편 표시 */}
                <div className="fragment-count">
                  🧩 {getFragmentCount(tower.towerIdx)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 하단 버튼 */}
      <button className="back-btn-bottom" onClick={onBack}>
        ← 돌아가기 (ESC)
      </button>
    </div>
  );
}
