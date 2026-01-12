const PREVIEW_FRAMES = [0, 1];
const FRAME_DURATION = 200;

export function createInputSystem({
  canvasRef,
  buildZonesRef,
  buildTowerRef,
  towerImageMapRef,
  pathRef,
  towerSystem,
}) {
  const mouse = { x: 0, y: 0 };
  let time = 0;

  function onMouseMove(e) {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) * canvas.width) / rect.width;
    mouse.y = ((e.clientY - rect.top) * canvas.height) / rect.height;
  }

  function attach() {
    canvasRef.current?.addEventListener("mousemove", onMouseMove);
  }

  function detach() {
    canvasRef.current?.removeEventListener("mousemove", onMouseMove);
  }

  // ⭐ 현재 마우스가 올라간 빌드존 찾기
  function getSnapZone() {
    return buildZonesRef.current.find(
      (z) =>
        mouse.x >= z.x &&
        mouse.x <= z.x + z.w &&
        mouse.y >= z.y &&
        mouse.y <= z.y + z.h
    );
  }

  function update(delta) {
    time += delta;
  }

  function render(ctx) {
    const buildTower = buildTowerRef.current;
    if (!buildTower) return;

    const img = towerImageMapRef.current[buildTower.towerIdx];
    if (!img || !img.loaded) return;

    const zone = getSnapZone();

    let canBuild = false;
    let x = mouse.x;
    let y = mouse.y;
    let size = 48; // 기본값 (존 없을 때)

    if (zone) {
      // ⭐ 존 중심
      x = zone.x + zone.w / 2;
      y = zone.y + zone.h / 2;

      // ⭐ 미리보기 크기 = 빌드존 크기
      size = Math.min(zone.w, zone.h);

      // ⭐ 이미 타워 있는지 (존 중심 기준)
      const occupied = towerSystem.isOccupied(x, y);
      canBuild = !occupied;
    }

    const floatY = Math.sin(time * 0.005) * 4;

    ctx.save();
    ctx.translate(x, y + floatY);
    ctx.globalAlpha = 0.7;

    // ======================
    // 🎞 2×2 프리뷰 프레임
    // ======================
    const cols = 2;
    const rows = 2;

    const frameW = img.width / cols;
    const frameH = img.height / rows;

    const frameIndex =
      PREVIEW_FRAMES[Math.floor(time / FRAME_DURATION) % PREVIEW_FRAMES.length];

    const col = frameIndex % cols;
    const row = Math.floor(frameIndex / cols);

    ctx.drawImage(
      img,
      col * frameW,
      row * frameH,
      frameW,
      frameH,
      -size / 2,
      -size / 2,
      size,
      size
    );

    // 색상 오버레이
    ctx.globalCompositeOperation = "source-atop";
    ctx.fillStyle = canBuild ? "rgba(0,255,0,0.35)" : "rgba(255,0,0,0.35)";
    ctx.fillRect(-size / 2, -size / 2, size, size);

    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;

    // 테두리
    ctx.strokeStyle = canBuild ? "#00ff88" : "#ff4444";
    ctx.lineWidth = 2;
    ctx.strokeRect(-size / 2, -size / 2, size, size);

    ctx.restore();
  }

  return {
    attach,
    detach,
    update,
    render,
  };
}
