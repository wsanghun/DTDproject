// src/tools/BuildZoneEditor.jsx
import { useRef, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { STAGE_MAPS } from "../assets/Maps";

const CANVAS_WIDTH = 1536;
const CANVAS_HEIGHT = 900;
const GRID = 72.7;

export default function BuildZoneEditor() {
  const { stageId } = useParams();
  const mapImage = STAGE_MAPS[Number(stageId)];

  const canvasRef = useRef(null);
  const zonesRef = useRef([]);

  const [preview, setPreview] = useState(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    const img = new Image();
    img.src = mapImage;

    img.onload = () => redraw(ctx, img, zonesRef.current, preview);

    const getPos = (e) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x:
          Math.floor(
            (((e.clientX - rect.left) / rect.width) * CANVAS_WIDTH) / GRID
          ) * GRID,
        y:
          Math.floor(
            (((e.clientY - rect.top) / rect.height) * CANVAS_HEIGHT) / GRID
          ) * GRID,
      };
    };

    const move = (e) => {
      const pos = getPos(e);
      setPreview({ x: pos.x, y: pos.y, w: GRID, h: GRID });
    };

    const click = (e) => {
      const pos = getPos(e);

      zonesRef.current.push({ x: pos.x, y: pos.y, w: GRID, h: GRID });
      redraw(ctx, img, zonesRef.current, null);

      console.clear();
      console.log(`🧱 BUILD ZONES (Stage ${stageId})`);
      console.log(JSON.stringify(zonesRef.current, null, 2));
    };

    canvas.addEventListener("mousemove", move);
    canvas.addEventListener("click", click);

    return () => {
      canvas.removeEventListener("mousemove", move);
      canvas.removeEventListener("click", click);
    };
  }, [mapImage, stageId, preview]);

  return (
    <div style={{ textAlign: "center" }}>
      <h2>🧱 Build Zone Editor (Stage {stageId})</h2>
      <p>마우스 위치에 미리보기 → 클릭하면 설치 (65×65)</p>
      <canvas
        ref={canvasRef}
        style={{ border: "2px solid #333", cursor: "crosshair" }}
      />
    </div>
  );
}

// ======================
// 🔧 Draw
// ======================
function redraw(ctx, img, zones, preview) {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.drawImage(img, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // 확정된 빌드존
  zones.forEach((z) => {
    ctx.strokeStyle = "rgba(0,255,0,0.9)";
    ctx.lineWidth = 2;
    ctx.strokeRect(z.x, z.y, z.w, z.h);
    ctx.fillStyle = "rgba(0,255,0,0.2)";
    ctx.fillRect(z.x, z.y, z.w, z.h);
  });

  // ⭐ 미리보기 빌드존
  if (preview) {
    ctx.strokeStyle = "rgba(255,255,0,0.9)";
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(preview.x, preview.y, preview.w, preview.h);

    ctx.fillStyle = "rgba(255,255,0,0.15)";
    ctx.fillRect(preview.x, preview.y, preview.w, preview.h);

    ctx.setLineDash([]);
  }
}
