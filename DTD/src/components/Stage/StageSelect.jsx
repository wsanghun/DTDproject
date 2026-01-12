import { useEffect, useState } from "react";
import axios from "axios";
import StageNode from "./StageNode";
import "../../css/StageSelect.css";
import allmap from "../../assets/images/allmaps.png";

// 맵 좌표는 프론트 고정
const STAGE_POSITION = {
  1: { x: 40, y: 68 },
  2: { x: 65, y: 60 },
  3: { x: 73, y: 35 },
  4: { x: 55, y: 22 },
  5: { x: 32, y: 36 },
};

export default function StageSelect({ onBack, onStageSelect }) {
  const [stages, setStages] = useState([]);
  const [lastClearedStage, setLastClearedStage] = useState(0);

  useEffect(() => {
    async function load() {
      // 1️⃣ 스테이지 목록
      const stageRes = await axios.get("/api/stages");
      const defenseStages = stageRes.data
        .filter((s) => s.stageType === "DEFENSE")
        .sort((a, b) => a.idx - b.idx);

      setStages(defenseStages);

      // 2️⃣ 유저 진행 정보
      const userRes = await axios.get("/api/users/me");
      const clearedStages = userRes.data.clearedStages ?? [];

      const cleared = clearedStages
        .filter((s) => s.cleared)
        .map((s) => s.stageIdx);

      const last = cleared.length > 0 ? Math.max(...cleared) : 0;

      setLastClearedStage(last);
    }

    load();
  }, []);

  return (
    <div className="stage-overlay">
      <div className="stage-map" style={{ backgroundImage: `url(${allmap})` }}>
        {stages.map((stage) => {
          const pos = STAGE_POSITION[stage.idx];
          if (!pos) return null;

          // ⭐ 잠금 규칙
          const isLocked = stage.idx > lastClearedStage + 1;

          return (
            <StageNode
              key={stage.idx}
              label={stage.idx}
              title={stage.stageName}
              x={pos.x}
              y={pos.y}
              isLocked={isLocked}
              onClick={() => {
                if (!isLocked) {
                  onStageSelect(stage.idx);
                }
              }}
            />
          );
        })}
      </div>

      <button className="back-btn" onClick={onBack}>
        돌아가기
      </button>
    </div>
  );
}
