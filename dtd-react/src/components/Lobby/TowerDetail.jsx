import { useState, useEffect } from "react";
import axios from "axios";
import { useUser } from "../../context/UserContext";

export default function TowerDetail({
  tower,
  fragmentCount,
  refreshTowers,
  refreshInventory,
}) {
  const { user, setUser } = useUser();
  const gold = user?.gold ?? 0;

  const [shake, setShake] = useState(false);

  const [animStats, setAnimStats] = useState({
    level: tower.currentLevel,
    damage: tower.currentDamage,
    nextCost: tower.nextLevelCost,
    nextDataCost: tower.nextLevelDataCost,
  });

  useEffect(() => {
    setAnimStats({
      level: tower.currentLevel,
      damage: tower.currentDamage,
      nextCost: tower.nextLevelCost,
      nextDataCost: tower.nextLevelDataCost,
    });
  }, [tower]);

  useEffect(() => {
    animateValue("level", animStats.level, tower.currentLevel, 300);
    animateValue("damage", animStats.damage, tower.currentDamage, 300);
    animateValue("nextCost", animStats.nextCost, tower.nextLevelCost, 300);
    animateValue(
      "nextDataCost",
      animStats.nextDataCost,
      tower.nextLevelDataCost,
      300
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    tower.currentLevel,
    tower.currentDamage,
    tower.nextLevelCost,
    tower.nextLevelDataCost,
  ]);

  const animateValue = (key, start, end, duration) => {
    const diff = end - start;
    if (diff === 0) return;

    let startTime = performance.now();
    const step = (now) => {
      let progress = Math.min((now - startTime) / duration, 1);
      let value = Math.floor(start + diff * progress);

      setAnimStats((prev) => ({ ...prev, [key]: value }));
      if (progress < 1) requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  };

  const canEnhance =
    gold >= tower.nextLevelCost && fragmentCount >= tower.nextLevelDataCost;

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const setRepresentative = async () => {
    try {
      await axios.post(
        "/api/users/me/main-tower",
        { userTowerIdx: tower.towerIdx },
        { withCredentials: true }
      );

      const me = await axios.get("/api/users/me", {
        withCredentials: true,
      });
      setUser(me.data);
    } catch (err) {
      console.error(err);
      alert("대표 설정 실패!");
    }
  };

  const enhanceTower = async () => {
    try {
      await axios.post(
        "/api/users/me/enhance-tower",
        { towerIdx: tower.towerIdx },
        { withCredentials: true }
      );

      const me = await axios.get("/api/users/me", {
        withCredentials: true,
      });
      setUser(me.data);

      await refreshTowers();
      await refreshInventory(); // ⭐ 파편 즉시 반영
    } catch (err) {
      console.error(err);
      triggerShake();
    }
  };

  // ✅ 수정된 최대 강화
  const enhanceMax = async () => {
    try {
      while (true) {
        const latestUserRes = await axios.get("/api/users/me", {
          withCredentials: true,
        });
        const latestGold = latestUserRes.data?.gold ?? 0;

        const invRes = await axios.get("/api/users/me/inventory", {
          withCredentials: true,
        });
        const items = invRes.data ?? [];

        let latestFragment = 0;
        items.forEach((item) => {
          if (item.effectType === "DATA" && item.itemIdx === tower.towerIdx) {
            latestFragment = item.quantity;
          }
        });

        if (
          latestGold < tower.nextLevelCost ||
          latestFragment < tower.nextLevelDataCost
        ) {
          break;
        }

        try {
          await axios.post(
            "/api/users/me/enhance-tower",
            { towerIdx: tower.towerIdx },
            { withCredentials: true }
          );
        } catch (err) {
          // ⭐ 서버에서 400 오면 즉시 중단
          if (err.response?.status === 400) {
            break;
          }
          throw err;
        }
      }

      const me = await axios.get("/api/users/me", {
        withCredentials: true,
      });
      setUser(me.data);

      await refreshTowers();
      await refreshInventory();
    } catch (err) {
      console.error(err);
      triggerShake();
    }
  };

  const imgSrc = new URL(
    `../../assets/images/Towerimages/tier${tower.tier}/${tower.towerIdx}.png`,
    import.meta.url
  ).href;

  return (
    <div className={`detail-panel vertical ${shake ? "shake-error" : ""}`}>
      <h2 className="tower-name">{tower.towerName}</h2>
      <p className="tower-desc">{tower.description}</p>

      <div className="detail-image-wrapper">
        <img src={imgSrc} className="detail-img" alt={tower.towerName} />
      </div>

      <div className="stats-grid">
        <p>
          <strong>티어:</strong> {tower.tier}
        </p>
        <p>
          <strong>레벨:</strong> {animStats.level}
        </p>
        <p>
          <strong>공격력:</strong> {animStats.damage}
        </p>
        <p>
          <strong>속성:</strong> {tower.baseType}
        </p>
        <p>
          <strong>사거리:</strong> {tower.baseRange}
        </p>
        <p>
          <strong>공격 타입:</strong> {tower.baseAttackType}
        </p>
        <p>
          <strong>쿨타임:</strong> {tower.baseCooldown}s
        </p>
        <p>
          <strong>설치 비용:</strong> {tower.baseBuildCost} Gold
        </p>

        <p style={{ gridColumn: "1 / span 2" }}>
          <strong>다음 강화 비용</strong>
        </p>

        <p style={{ color: gold < tower.nextLevelCost ? "#ff6b6b" : "#fff" }}>
          💰 {animStats.nextCost} Gold
        </p>

        {/* ✅ 여기서 data 제거 완료 */}
        <p
          style={{
            color: fragmentCount < tower.nextLevelDataCost ? "#ff6b6b" : "#fff",
          }}
        >
          🧩 {animStats.nextDataCost} / {fragmentCount}
        </p>
      </div>

      <div className="detail-btn">
        <button className="rep-btn" onClick={setRepresentative}>
          대표 디지몬 설정
        </button>

        <button
          className={`enhance-btn ${!canEnhance ? "disabled" : ""}`}
          disabled={!canEnhance}
          onClick={enhanceTower}
        >
          강화하기
        </button>

        <button
          className={`enhance-btn max ${!canEnhance ? "disabled" : ""}`}
          disabled={!canEnhance}
          onClick={enhanceMax}
        >
          최대 강화
        </button>
      </div>
    </div>
  );
}
