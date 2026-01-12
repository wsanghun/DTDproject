export default function GachaCurrencyPanel({ gold, diamond, capsule }) {
  return (
    <div className="gacha-currency-panel">
      <div>🪙 골드 {gold.toLocaleString()}</div>
      <div>💎 다이아 {diamond}</div>
      <div>🎁 캡슐 {capsule}</div>
    </div>
  );
}
