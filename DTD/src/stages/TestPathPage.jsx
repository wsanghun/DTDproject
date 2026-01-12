import { useEffect, useRef } from "react";
import stage1Img from "../assets/Maps/Stage1/1-1.png";
import { extractPathFromImage } from "../utils/PathExtractor";

export default function TestPathPage() {
  const canvasRef = useRef(null);
  const pathRef = useRef([]);
  const zonesRef = useRef([]);
  const previewZoneRef = useRef(null);

  const ZONE_SIZE = 100;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    canvas.width = 1536;
    canvas.height = 900;

    const img = new Image();
    img.src = stage1Img;

    img.onload = async () => {
      const path = await extractPathFromImage(stage1Img);
      pathRef.current = path;

      redraw();
      console.log("📌 PATH JSON ↓↓↓\n", JSON.stringify(path, null, 2));
    };

    /* ======================
       사각형 겹침 판정
    ====================== */
    function isZoneOverlapping(newZone, zones) {
      return zones.some((z) => {
        return !(
          newZone.x + newZone.w <= z.x ||
          newZone.x >= z.x + z.w ||
          newZone.y + newZone.h <= z.y ||
          newZone.y >= z.y + z.h
        );
      });
    }

    /* ======================
       좌표가 슬롯 안에 있는지
    ====================== */
    function isPointInZone(x, y, z) {
      return x >= z.x && x <= z.x + z.w && y >= z.y && y <= z.y + z.h;
    }

    /* ======================
       마우스 이동 → 미리보기
    ====================== */
    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = ((e.clientX - rect.left) * canvas.width) / rect.width;
      const y = ((e.clientY - rect.top) * canvas.height) / rect.height;

      previewZoneRef.current = {
        x: Math.round(x - ZONE_SIZE / 2),
        y: Math.round(y - ZONE_SIZE / 2),
        w: ZONE_SIZE,
        h: ZONE_SIZE,
      };

      redraw();
    };

    /* ======================
       좌클릭 → 슬롯 추가
    ====================== */
    const handleClick = () => {
      if (!previewZoneRef.current) return;

      if (isZoneOverlapping(previewZoneRef.current, zonesRef.current)) {
        console.warn("❌ 다른 슬롯과 겹쳐서 추가 안 됨");
        return;
      }

      zonesRef.current.push({ ...previewZoneRef.current });
      redraw();

      console.log(
        "🟩 buildZones JSON ↓↓↓\n",
        JSON.stringify(zonesRef.current, null, 2)
      );
    };

    /* ======================
       🖱 우클릭 → 슬롯 삭제
    ====================== */
    const handleRightClick = (e) => {
      e.preventDefault(); // 브라우저 메뉴 막기

      const rect = canvas.getBoundingClientRect();
      const x = ((e.clientX - rect.left) * canvas.width) / rect.width;
      const y = ((e.clientY - rect.top) * canvas.height) / rect.height;

      // 뒤에서부터 찾기 (가장 최근 슬롯 우선 삭제)
      for (let i = zonesRef.current.length - 1; i >= 0; i--) {
        if (isPointInZone(x, y, zonesRef.current[i])) {
          zonesRef.current.splice(i, 1);
          redraw();

          console.log(
            "🗑 buildZones JSON ↓↓↓\n",
            JSON.stringify(zonesRef.current, null, 2)
          );
          return;
        }
      }
    };

    /* ======================
       다시 그리기
    ====================== */
    function redraw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // 🔹 path 표시
      ctx.fillStyle = "red";
      pathRef.current.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
      });

      // 🔹 확정 슬롯
      zonesRef.current.forEach((z) => {
        ctx.strokeStyle = "rgba(0,255,0,0.7)";
        ctx.lineWidth = 2;
        ctx.strokeRect(z.x, z.y, z.w, z.h);
      });

      // 🔹 미리보기 슬롯
      if (previewZoneRef.current) {
        const overlap = isZoneOverlapping(
          previewZoneRef.current,
          zonesRef.current
        );

        ctx.save();
        ctx.strokeStyle = overlap ? "red" : "cyan";
        ctx.setLineDash([6, 4]);
        ctx.lineWidth = 2;

        const z = previewZoneRef.current;
        ctx.strokeRect(z.x, z.y, z.w, z.h);

        ctx.restore();
        ctx.setLineDash([]);
      }
    }

    /* ======================
       이벤트 등록
    ====================== */
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("click", handleClick);
    canvas.addEventListener("contextmenu", handleRightClick);

    return () => {
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("click", handleClick);
      canvas.removeEventListener("contextmenu", handleRightClick);
    };
  }, []);

  return (
    <div style={{ textAlign: "center" }}>
      <h2>🧪 Stage1 Path & BuildZone Test</h2>
      <p>좌클릭: 슬롯 추가 / 우클릭: 슬롯 삭제 (겹치면 불가)</p>
      <canvas
        ref={canvasRef}
        style={{ border: "1px solid #555", cursor: "crosshair" }}
      />
    </div>
  );
}
