// src/tools/PathEditor.jsx
import { useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { STAGE_MAPS } from "../assets/Maps";

// ⭐ 좌표 기준 해상도 (전 스테이지 공통)
const CANVAS_WIDTH = 1536;
const CANVAS_HEIGHT = 900;

export default function PathEditor() {
  // URL에서 stageId 가져오기
  const { stageId } = useParams();
  const mapImage = STAGE_MAPS[Number(stageId)];

  if (!mapImage) {
    return <div>❌ 없는 스테이지입니다</div>;
  }

  const canvasRef = useRef(null);
  const pathRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // ⭐ 캔버스 크기 고정
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    const img = new Image();
    img.src = mapImage;

    img.onload = () => {
      // ⭐ 이미지 → 캔버스 크기에 맞춰 스케일
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.drawImage(img, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    };

    const handleClick = (e) => {
      const rect = canvas.getBoundingClientRect();

      // ⭐ 클릭 좌표를 1536×900 기준으로 변환
      const x = Math.round(
        ((e.clientX - rect.left) / rect.width) * CANVAS_WIDTH
      );
      const y = Math.round(
        ((e.clientY - rect.top) / rect.height) * CANVAS_HEIGHT
      );

      pathRef.current.push({ x, y });

      redraw(ctx, img, pathRef.current);

      console.clear();
      console.log(`📌 PATH (Stage ${stageId})`);
      console.log(JSON.stringify(pathRef.current, null, 2));
    };

    canvas.addEventListener("click", handleClick);
    return () => canvas.removeEventListener("click", handleClick);
  }, [mapImage, stageId]);

  return (
    <div style={{ textAlign: "center" }}>
      <h2>🧭 Path Editor (Stage {stageId})</h2>
      <p>캔버스 클릭 → 몹 이동 경로 좌표 생성</p>

      <canvas
        ref={canvasRef}
        style={{
          border: "2px solid #333",
          cursor: "crosshair",
          maxWidth: "100%",
        }}
      />

      <p style={{ marginTop: 8, color: "#aaa" }}>
        기준 해상도: {CANVAS_WIDTH} × {CANVAS_HEIGHT}
      </p>
    </div>
  );
}

// ======================
// 🔧 내부 함수
// ======================
function redraw(ctx, img, path) {
  // ⭐ 항상 동일 기준으로 다시 그림
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.drawImage(img, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  if (path.length < 1) return;

  ctx.save();

  // 경로 선
  ctx.strokeStyle = "rgba(0, 255, 255, 0.9)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(path[0].x, path[0].y);
  path.forEach((p) => ctx.lineTo(p.x, p.y));
  ctx.stroke();

  // 경로 점
  path.forEach((p) => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = "red";
    ctx.fill();
  });

  ctx.restore();
}
