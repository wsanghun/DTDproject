export default function TowerCardPanel({
  towers,
  buildTower,
  setBuildTower,
  setSelectedPlacedTower,
}) {
  return (
    <div className="tower-panel">
      {towers
        .filter((t) => t.tier === 1)
        .map((tower) => {
          const selected = buildTower?.towerIdx === tower.towerIdx;

          return (
            <div
              key={tower.towerIdx}
              className={`tower-card ${selected ? "selected" : ""}`}
              onClick={() => {
                if (selected) {
                  // 🔥 다시 클릭 → 전부 해제
                  setBuildTower(null);
                } else {
                  // 🔥 한번 클릭 → 설치모드 + 디테일 카드
                  setBuildTower(tower);
                  setSelectedPlacedTower(null);
                }
              }}
            >
              <img
                src={`/Towerimages/tier${tower.tier}/${tower.towerIdx}.png`}
                alt={tower.towerName}
              />

              <div className="tower-name">{tower.towerName}</div>
              <div className="tower-cost">{tower.baseBuildCost} BIT</div>
            </div>
          );
        })}
    </div>
  );
}
