import "../../css/StageCard.css";

export default function StageCard({ label, size, isLocked, stars, onClick }) {
  return (
    <div
      className={`stage-card ${size} ${isLocked ? "locked" : ""}`}
      onClick={onClick} // ⭐ 클릭 이벤트 추가
    >
      {/* 잠금 아이콘 */}
      {isLocked && <div className="lock-icon">🔒</div>}

      {/* 번호 */}
      <div className="stage-label">{label}</div>

      {/* 별점 */}
      <div className="star-row">
        {Array.from({ length: 3 }, (_, i) => (
          <span key={i} className={`star ${i < stars ? "filled" : ""}`}>
            ★
          </span>
        ))}
      </div>
    </div>
  );
}
