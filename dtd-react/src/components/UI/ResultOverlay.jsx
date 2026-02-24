export default function ResultOverlay({
  result,
  score,
  reward,
  onRetry,
  onNext,
  onExit,
}) {
  if (!result) return null;

  return (
    <div className="result-overlay">
      <div className="result-panel">
        {/* 승리 / 패배 이미지 */}
        <img
          src={
            result === "VICTORY" ? "/images/victory.png" : "/images/lose.png"
          }
          alt={result}
          className="result-title"
        />

        {/* 점수 */}
        <div className="result-score">SCORE {score.toLocaleString()}</div>

        {/* ⭐ 보상 영역 */}
        {reward && (
          <div className="result-rewards">
            <div className="reward-line">
              💰 골드 <span>{reward.earnedGold}</span>
            </div>

            <div className="reward-line">
              ✨ 경험치 <span>{reward.earnedExp}</span>
            </div>

            {reward.earnedItems?.length > 0 && (
              <div className="reward-items">
                <div className="reward-items-title">획득 아이템</div>

                {reward.earnedItems.map((item) => (
                  <div key={item.itemId} className="reward-item">
                    🧩 아이템 {item.itemId} × {item.count}
                  </div>
                ))}
              </div>
            )}

            {reward.firstClear && (
              <div className="reward-first">🎉 최초 클리어 보너스!</div>
            )}
          </div>
        )}

        {/* 버튼 */}
        <div className="result-buttons">
          {onRetry && <button onClick={onRetry}>재도전</button>}
          <button onClick={onExit}>나가기</button>
        </div>
      </div>
    </div>
  );
}
