import { useEffect, useRef } from "react";
import seedmonSprite from "../../assets/Monsters/seedmon.png"; // 스프라이트 시트 경로

export default function GameCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const sprite = new Image();
    sprite.src = seedmonSprite;

    // ================================
    // 🟩 스프라이트 설정
    // ================================
    const FRAME_WIDTH = 36; // 프레임 너비 (시트 프레임 크기)
    const FRAME_HEIGHT = 36; // 프레임 높이
    const FRAME_COUNT = 2; // 프레임 개수 (2개)
    let currentFrame = 0; // 현재 프레임 위치
    let frameTimer = 0;
    const FRAME_SPEED = 160; // 프레임 전환 속도(ms)

    // ================================
    // 🟦 몬스터 이동 설정
    // ================================
    let x = 50;
    let y = 100;

    function update(delta) {
      // 이동
      x += 0.05 * delta;
      if (x > canvas.width) x = -40;

      // 프레임 업데이트
      frameTimer += delta;
      if (frameTimer > FRAME_SPEED) {
        currentFrame = (currentFrame + 1) % FRAME_COUNT;
        frameTimer = 0;
      }
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.drawImage(
        sprite,
        currentFrame * FRAME_WIDTH, // 스프라이트 시트 X 좌표
        0, // Y 좌표 (1줄)
        FRAME_WIDTH,
        FRAME_HEIGHT,
        x,
        y,
        40, // canvas에 그릴 크기 (확대 가능)
        40
      );
    }

    // ================================
    // 🟨 게임 루프
    // ================================
    let last = 0;
    function loop(time) {
      const delta = time - last;
      last = time;

      update(delta);
      draw();

      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={900}
      height={600}
      style={{
        background: "#e5e5e5",
        border: "2px solid #333",
        display: "block",
        margin: "0 auto",
      }}
    />
  );
}
