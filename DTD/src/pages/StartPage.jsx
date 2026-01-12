import { useEffect, useState } from "react";
import logo from "../assets/images/logo.png";
import startImage from "../assets/images/start.png";
import { useMyTowers } from "../context/UserTowerContext";
import LoginBox from "../components/UI/LoginBox";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useUser } from "../context/UserContext";
import "../css/StartPage.css";
import axios from "axios";

export default function StartPage() {
  const { user, setUser, loading: userLoading } = useUser(); // ⭐ user context
  const { myTowers, loading: towerLoading, refreshTowers } = useMyTowers(); // ⭐ tower context

  const [showLogin, setShowLogin] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // 회원가입 후 돌아왔을 때 로그인 박스 자동 오픈
  useEffect(() => {
    if (location.state?.openLogin) {
      setShowLogin(true);
    }
  }, [location]);

  // user / towers 로딩 중일 때 화면 표시 X
  if (userLoading) return null;

  // ⭐ 게임 시작 버튼 기능
  const handleGameStart = async () => {
    if (!user) {
      setShowLogin(true);
      return;
    }

    if (towerLoading) return;

    // 보유 타워 체크 삭제
    navigate("/lobby");
  };

  // ⭐ 로그아웃
  const handleLogout = async () => {
    try {
      await axios.post("/api/auth/logout", {}, { withCredentials: true });
      setUser(null);
      refreshTowers(); // 타워 정보 초기화
      setShowLogin(false);
    } catch (e) {
      console.error("로그아웃 오류", e);
    }
  };

  return (
    <div
      className="start-container"
      style={{ backgroundImage: `url(${startImage})` }}
    >
      <img src={logo} alt="logo" className="start-logo" />

      {/* 비로그인 상태 */}
      {!user ? (
        !showLogin ? (
          <div className="button-box">
            <button className="start-btn" onClick={() => setShowLogin(true)}>
              로그인
            </button>

            <Link to="/register">
              <button className="start-btn">회원가입</button>
            </Link>
          </div>
        ) : (
          <LoginBox
            onCancel={() => setShowLogin(false)}
            onLoginSuccess={() => setShowLogin(false)}
          />
        )
      ) : (
        // ⭐ 로그인 된 상태
        <div className="button-box">
          <button
            className="start-btn game-start-btn"
            onClick={handleGameStart}
          >
            게임 시작
          </button>

          <button className="start-btn logout-btn" onClick={handleLogout}>
            로그아웃
          </button>
        </div>
      )}
    </div>
  );
}
