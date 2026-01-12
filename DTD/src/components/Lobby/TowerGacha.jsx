import { useEffect, useState } from "react";
import axios from "axios";
import GachaCurrencyPanel from "./GachaCurrencyPanel";
import { useUser } from "../../context/UserContext";
import "../../css/TowerGacha.css";

/* =========================
   결과 병합 유틸
========================= */
function mergeGachaResults(results) {
  const map = {};

  results.forEach((r) => {
    if (!map[r.itemIdx]) {
      map[r.itemIdx] = {
        itemIdx: r.itemIdx,
        itemName: r.itemName,
        quantity: 0,
        targetTowerTier: r.targetTowerTier,
      };
    }
    map[r.itemIdx].quantity += r.quantity;
  });

  return Object.values(map);
}

export default function TowerGacha({ onBack }) {
  const { user, setUser } = useUser(); // ⭐ refreshUser 사용 안 함

  /* =========================
     상수
  ========================= */
  const CAPSULE_BY_TIER = {
    1: 901,
    2: 902,
    3: 903,
    4: 904,
  };

  /* =========================
     state
  ========================= */
  const [selectedTier, setSelectedTier] = useState(1);
  const [payType, setPayType] = useState("GOLD");

  const [capsuleMap, setCapsuleMap] = useState({});
  const [capsuleItemMap, setCapsuleItemMap] = useState({});
  const [itemMap, setItemMap] = useState({});

  const [rolling, setRolling] = useState(false);
  const [result, setResult] = useState(null);

  /* =========================
     파생 값
  ========================= */
  const currentCapsuleCount = capsuleMap[selectedTier] ?? 0;
  const currentCapsuleItem = capsuleItemMap[selectedTier];

  /* =========================
     ESC → 뒤로가기
  ========================= */
  useEffect(() => {
    const onKeyDown = (e) => e.key === "Escape" && onBack();
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onBack]);

  /* =========================
     인벤토리 (캡슐)
  ========================= */
  const fetchInventory = async () => {
    const res = await axios.get("/api/users/me/inventory");
    const map = {};

    res.data.forEach((item) => {
      if (item.effectType === "TICKET") {
        map[item.effectValue] = item.quantity;
      }
    });

    setCapsuleMap(map);
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  /* =========================
     아이템 메타
  ========================= */
  useEffect(() => {
    axios.get("/api/items").then((res) => {
      const tierMap = {};
      const allMap = {};

      res.data.forEach((item) => {
        allMap[item.idx] = item;
        if (item.effectType === "TICKET") {
          tierMap[item.effectValue] = item;
        }
      });

      setCapsuleItemMap(tierMap);
      setItemMap(allMap);
    });
  }, []);

  /* =========================
     가차 실행
  ========================= */
  const handleGacha = async (count) => {
    if (rolling) return;

    const capsuleItemId = CAPSULE_BY_TIER[selectedTier];
    const capsuleCount = capsuleMap[selectedTier] ?? 0;
    const paymentType = capsuleCount >= count ? "ITEM" : payType;

    if (paymentType === "ITEM" && capsuleCount < count) {
      alert("캡슐이 부족합니다.");
      return;
    }

    setRolling(true);
    setResult(null);

    const rewards = [];

    /* ========= 1️⃣ 가차 자체 ========= */
    try {
      for (let i = 0; i < count; i++) {
        const res = await axios.post("/api/users/me/shop/gacha", {
          capsuleItemId,
          paymentType,
        });

        const resultList = res.data?.results ?? [];
        Array.isArray(resultList)
          ? rewards.push(...resultList)
          : rewards.push(resultList);
      }
    } catch (e) {
      console.error("[Gacha FAIL]", e);
      alert("뽑기 실패");
      setRolling(false);
      return;
    }

    /* ========= 2️⃣ 결과 처리 ========= */
    try {
      const merged = mergeGachaResults(rewards).sort(
        (a, b) => b.quantity - a.quantity
      );
      setResult(merged);

      // 캡슐 차감 (프론트)
      if (paymentType === "ITEM") {
        setCapsuleMap((prev) => ({
          ...prev,
          [selectedTier]: (prev[selectedTier] ?? 0) - count,
        }));
      }

      // ⭐ 골드/다이아 즉시 반영
      const userRes = await axios.get("/api/users/me");
      setUser(userRes.data);

      await fetchInventory();
    } catch (e) {
      console.warn("[Gacha POST PROCESS FAIL]", e);
    } finally {
      setRolling(false);
    }
  };

  /* =========================
     렌더
  ========================= */
  return (
    <div className="subscreen gacha-screen">
      <button className="gacha-back-btn" onClick={onBack}>
        ← 돌아가기(esc)
      </button>

      <div className="gacha-header">
        <h2>타워 뽑기</h2>
      </div>

      <GachaCurrencyPanel
        gold={user?.gold ?? 0}
        diamond={user?.diamond ?? 0}
        capsule={currentCapsuleCount}
      />

      {/* =========================
   뽑기 비용 표시 (복구)
========================= */}
      {currentCapsuleItem && (
        <div className="gacha-cost-info">
          <div className="cost-block">
            <strong>1회 뽑기</strong>
            <div>🎁 캡슐 1</div>
            <div>🪙 골드 {currentCapsuleItem.priceGold.toLocaleString()}</div>
            <div>💎 다이아 {currentCapsuleItem.priceDiamond}</div>
          </div>

          <div className="cost-block">
            <strong>10회 뽑기</strong>
            <div>🎁 캡슐 10</div>
            <div>
              🪙 골드 {(currentCapsuleItem.priceGold * 10).toLocaleString()}
            </div>
            <div>💎 다이아 {currentCapsuleItem.priceDiamond * 10}</div>
          </div>
        </div>
      )}

      {/* =========================
         중앙 패널
      ========================= */}
      <div className="gacha-body">
        <div className="gacha-layout">
          {/* 왼쪽 티어 */}
          <div className="gacha-left">
            <div className="gacha-tierlist">
              {[1, 2, 3, 4].map((t) => (
                <button
                  key={t}
                  className={`tier-tab ${selectedTier === t ? "active" : ""}`}
                  onClick={() => {
                    setSelectedTier(t);
                    setResult(null);
                  }}
                >
                  {t}TIER
                </button>
              ))}
            </div>
          </div>

          {/* 오른쪽 결과 */}
          <div className="gacha-right">
            {rolling && <p>뽑는 중...</p>}

            {!rolling && result && (
              <div className="gacha-result">
                {result.map((r, idx) => (
                  <div key={idx} className="gacha-result-item">
                    <div className="result-left">
                      <img
                        src={`/Towerimages/tier${selectedTier}/${r.itemIdx}.png`}
                        alt={r.itemName}
                        className="result-icon"
                        onError={(e) =>
                          (e.currentTarget.style.display = "none")
                        }
                      />
                      <span className="result-name">{r.itemName}</span>
                    </div>
                    <span
                      className={`result-qty ${
                        r.quantity >= 80
                          ? "ultra-reward"
                          : r.quantity >= 15
                          ? "big-reward"
                          : ""
                      }`}
                    >
                      x{r.quantity}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {!rolling && !result && (
              <div className="gacha-empty">
                왼쪽에서 티어를 선택하고 뽑기를 눌러줘
              </div>
            )}
          </div>
        </div>

        {/* 결제 수단 */}
        {currentCapsuleCount <= 0 && (
          <div className="gacha-paytype-inline">
            <div className="paytype-buttons">
              <button
                className={payType === "GOLD" ? "active" : ""}
                onClick={() => setPayType("GOLD")}
              >
                🪙 골드
              </button>
              <button
                className={payType === "DIAMOND" ? "active" : ""}
                onClick={() => setPayType("DIAMOND")}
              >
                💎 다이아
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 하단 버튼 */}
      <div className="gacha-footer">
        <button disabled={rolling} onClick={() => handleGacha(1)}>
          1회 뽑기
        </button>
        <button disabled={rolling} onClick={() => handleGacha(10)}>
          10회 뽑기
        </button>
      </div>
    </div>
  );
}
