import { useState } from "react";
import { useUser } from "../context/UserContext";
import TowerDisplay from "../components/Lobby/TowerDisplay";
import MenuButton from "../components/Lobby/MenuButton";
import UserInfoPanel from "../components/Lobby/UserInfoPanel";
import TowerGacha from "../components/Lobby/TowerGacha";
import TowerInventory from "../components/Lobby/TowerInventory"; // ⭐ 보유 디지몬 목록
import StageSelect from "../components/Stage/StageSelect";
import { useNavigate } from "react-router-dom";
import digiviceImg from "../assets/images/digivice.png";
import laptopImg from "../assets/images/laptop.png";
import "../css/LobbyPage.css";

export default function LobbyPage() {
  const { user, logout } = useUser();
  const [view, setView] = useState("main");
  const navigate = useNavigate();

  return (
    <div className="lobby-container">
      {/* 배경 영상 */}
      <video autoPlay loop muted playsInline className="background-video">
        <source src="/lobby.mp4" type="video/mp4" />
      </video>

      {/* 상단 스테이지 선택 */}
      <div className="stage-banner" onClick={() => setView("stage")}>
        STAGE
      </div>

      {/* 중앙 대표 타워 표시 ⭐ */}
      {view === "main" && <TowerDisplay tower={user?.mainTower ?? null} />}

      {/* 좌측 : 도감 */}
      <MenuButton
        label="GACHA"
        image={laptopImg}
        position="left"
        onClick={() => setView("dex")}
      />

      {/* 우측 : 강화 버튼 → ⭐ 보유 디지몬으로 라벨 변경 */}
      <MenuButton
        label="DIGIMON"
        image={digiviceImg}
        position="right"
        onClick={() => setView("inventory")}
      />

      {/* ⭐ 하단 중앙 버튼 삭제됨 */}

      <UserInfoPanel
        user={user ?? { username: "Guest", gold: 0, diamond: 0 }}
      />

      <button
        className="logout-btn"
        onClick={async () => {
          await logout();
          navigate("/"); // 또는 "/"
        }}
      >
        로그아웃
      </button>

      {/* ⭐ navigate 전달! */}
      {view === "stage" && (
        <StageSelect
          onBack={() => setView("main")}
          onStageSelect={(stageId) => navigate(`/stage/${stageId}`)}
        />
      )}

      {view === "dex" && <TowerGacha onBack={() => setView("main")} />}
      {view === "inventory" && (
        <TowerInventory onBack={() => setView("main")} />
      )}
    </div>
  );
}
