export default function UserInfoPanel({ user }) {
  return (
    <div className="user-info-bar">
      <span className="user-name">{user.username}</span>
      <span className="user-gold">💰 {user.gold} G</span>
      <span className="user-diamond">💎 {user.diamond} D</span>
    </div>
  );
}
