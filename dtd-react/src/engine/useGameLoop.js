import { useEffect, useRef } from "react";

export function useGameLoop({
  canvasRef,
  systems,
  gameSpeedRef,
  onGameOver,
  pausedRef,
}) {
  const rafIdRef = useRef(null);
  const lastTimeRef = useRef(performance.now());
  const gameTimeRef = useRef(0); // UI용 누적 시간

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    let running = true;
    lastTimeRef.current = performance.now();
    gameTimeRef.current = 0;

    function loop(now) {
      if (!running) return;

      const rawDelta = now - lastTimeRef.current;
      lastTimeRef.current = now;

      const speed = gameSpeedRef?.current ?? 1;

      if (rawDelta < 0) return;

      // ⭐ 배속은 여기서만 적용
      const delta = rawDelta * speed;

      // UI용 게임 시간 (논리에는 사용 ❌)
      gameTimeRef.current += rawDelta;

      /* ======================
         UPDATE (전부 delta 기반)
      ====================== */
      if (!pausedRef?.current) {
        systems.wave?.update?.(delta);
        systems.monster?.update?.(delta);
        systems.tower?.update?.(delta);
        systems.effect?.update?.(delta);
        systems.ui?.onTick?.(delta);
      }

      systems.input?.update?.(delta);

      /* ======================
         RENDER
      ====================== */
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      systems.map?.render?.(ctx);
      systems.monster?.render?.(ctx);
      systems.tower?.render?.(ctx, systems.ui?.selectedTowerId, delta);
      systems.effect?.render?.(ctx);
      systems.input?.render?.(ctx);

      if (onGameOver?.()) {
        running = false;
        cancelAnimationFrame(rafIdRef.current);

        return;
      }

      rafIdRef.current = requestAnimationFrame(loop);
    }

    rafIdRef.current = requestAnimationFrame(loop);

    return () => {
      running = false;
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, [canvasRef, systems, gameSpeedRef, onGameOver]);

  return {
    // UI에서만 쓰기
    getGameTime: () => gameTimeRef.current,
  };
}
