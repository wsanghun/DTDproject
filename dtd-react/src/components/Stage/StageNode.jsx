// src/components/Stage/StageNode.jsx
import "../../css/StageNode.css";

export default function StageNode({
  label,
  title,
  x,
  y,
  isLocked,
  isCleared,
  onClick,
}) {
  return (
    <div
      className={`stage-node 
        ${isLocked ? "locked" : ""}
        ${isCleared ? "cleared" : ""}
      `}
      style={{ left: `${x}%`, top: `${y}%` }}
      onClick={!isLocked ? onClick : undefined}
    >
      <div className="node-box">
        <div className="node-label">{label}</div>
        <div className="node-title">{title}</div>
      </div>

      {/* 🔒 잠김 */}
      {isLocked && <div className="node-icon lock">🔒</div>}

      {/* ✅ 클리어 */}
      {!isLocked && isCleared && <div className="node-icon cleared">✔</div>}
    </div>
  );
}
