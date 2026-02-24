import "../../css/TowerDisplay.css";

export default function TowerDisplay({ tower }) {
  if (!tower) {
    return (
      <div className="tower-display empty">
        <p>대표 디지몬이 없습니다</p>
      </div>
    );
  }

  // ⭐ 대표 디지몬 이미지 동적 경로 생성
  const imgSrc = new URL(
    `../../assets/images/Towerimages/tier${tower.tower.tier}/${tower.tower.idx}.png`,
    import.meta.url
  ).href;

  return (
    <div className="tower-display">
      <img src={imgSrc} alt="대표 디지몬" className="tower-display-img" />
      <p className="tower-name">{tower.tower.towerName}</p>
    </div>
  );
}
