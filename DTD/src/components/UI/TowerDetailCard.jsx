export default function TowerDetailCard({
  tower,
  showButtons, // 설치된 타워일 때만 true
  evolveState = { canEvolve: false, reason: null, cost: null, nextTier: null },
  onEvolve,
  onSell,
}) {
  if (!tower) return null;

  const { canEvolve, reason, cost } = evolveState;

  // ✅ 설치 전 / 설치 후 스탯 통합 처리
  const towerName = tower.towerName ?? tower.name ?? "-";

  const damage = tower.currentDamage ?? tower.damage ?? "-";

  const range = tower.baseRange ?? tower.range ?? "-";

  const cooldown = tower.baseCooldown ?? tower.cooldown ?? "-";

  const getMessage = () => {
    if (canEvolve) return null;

    switch (reason) {
      case "LOCK_CONDITION":
        if (tower.tier === 1) return "10웨이브 보스를 처치하세요";
        if (tower.tier === 2) return "미션을 클리어 하세요";
        if (tower.tier === 3) return "상위 미션을 클리어 하세요";
        return "조건을 만족하지 않았습니다";

      case "LOCK_BIT":
        return "BIT가 부족합니다";

      case "LOCK_MAX":
        return "최종 진화 단계입니다";

      default:
        return null;
    }
  };

  return (
    <div className="tower-detail-card">
      {/* 이미지 */}
      <div style={{ textAlign: "center", marginBottom: 6 }}>
        <img
          src={`/Towerimages/tier${tower.tier}/${tower.towerIdx}.png`}
          alt={towerName}
          style={{ width: 80, height: 80, imageRendering: "pixelated" }}
        />
      </div>

      {/* 이름 */}
      <div style={{ fontWeight: "bold", marginBottom: 4 }}>{towerName}</div>

      {/* 스탯 */}
      <div>공격력: {damage}</div>
      <div>사거리: {range}</div>
      <div>쿨타임: {cooldown}s</div>

      {/* 버튼 영역 (설치된 타워만) */}
      {showButtons && (
        <div className="card-buttons vertical">
          <button
            className={`evolve ${canEvolve ? "active" : "disabled"}`}
            disabled={!canEvolve}
            onClick={onEvolve}
          >
            진화 {cost && <span>({cost} BIT)</span>}
          </button>

          {!canEvolve && (
            <div
              className={`evolve-condition ${
                reason === "LOCK_BIT" ? "danger" : ""
              }`}
            >
              {getMessage()}
            </div>
          )}

          <button className="danger" onClick={onSell}>
            철거 ({Math.floor(tower.baseBuildCost * 0.5)} BIT)
          </button>
        </div>
      )}
    </div>
  );
}
