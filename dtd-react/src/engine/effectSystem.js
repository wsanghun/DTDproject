import {
  EFFECT_SHEET_LAYOUT,
  EFFECT_FRAME_DURATION,
  IMPACT_SIZE_BY_TIER,
  TOWER_SIZE_BY_TIER,
  getEffectFrameInfo,
} from "./config";

export function createEffectSystem({ effectImageMapRef, gameSpeedRef }) {
  const effectsRef = { current: [] };

  /* ======================
     이펙트 생성
  ====================== */

  function spawnAttackEffect(tower, target) {
    if (!target) return;

    const img = effectImageMapRef.current[tower.towerIdx];
    if (!img || !img.loaded) return;

    // 🔥 레이저
    if (tower.towerIdx === 203) {
      effectsRef.current.push({
        id: Date.now() + Math.random(),
        type: "LASER",

        startX: tower.x,
        startY: tower.y,
        target,

        elapsed: 0,
        lifeTime: 0.3, // sec

        tier: tower.tier,
        towerIdx: tower.towerIdx,
      });
      return;
    }

    // 🔹 투사체
    const dx = target.x - tower.x;
    const dy = target.y - tower.y;
    const angle = Math.atan2(dy, dx);
    const muzzle = (TOWER_SIZE_BY_TIER[tower.tier] ?? 40) / 2;

    const { frames } = getEffectFrameInfo(tower.towerIdx);

    effectsRef.current.push({
      id: Date.now() + Math.random(),

      type: "PROJECTILE",

      x: tower.x + Math.cos(angle) * muzzle,
      y: tower.y + Math.sin(angle) * muzzle,

      target,

      speed: 480, // ⭐ px / sec (기존 6px/frame ≈ 360~480px/sec)

      img,
      frame: 0,
      timer: 0,
      frameDuration: EFFECT_FRAME_DURATION / 1000, // sec
      totalFrames: frames,

      tier: tower.tier,
      towerIdx: tower.towerIdx,
    });
  }

  function spawnEvolveEffect(x, y, tier) {
    effectsRef.current.push({
      id: Date.now() + Math.random(),
      type: "EVOLVE",

      x,
      y,
      tier,

      elapsed: 0,
      lifeTime: 0.7, // sec
    });
  }

  function spawnStatusEffect(target, status) {
    const exists = effectsRef.current.find(
      (fx) =>
        fx.type === "STATUS" && fx.target === target && fx.status === status
    );
    if (exists) return;

    effectsRef.current.push({
      id: Date.now() + Math.random(),
      type: "STATUS",
      target,
      status,
    });
  }

  function spawnTowerBreakEffect(x, y, tier) {
    const count = 8 + tier * 2; // 티어 높을수록 파편 많음

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 120 + Math.random() * 180;

      effectsRef.current.push({
        id: Date.now() + Math.random(),
        type: "TOWER_BREAK",

        x,
        y,

        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 80, // 위로 튀는 느낌
        gravity: 420,

        size: 4 + Math.random() * 4,
        rotation: Math.random() * Math.PI,
        rotationSpeed: (Math.random() - 0.5) * 6,

        color: "#999",

        elapsed: 0,
        lifeTime: 0.6,
      });
    }
  }

  /* ======================
     업데이트
  ====================== */

  function update(delta) {
    const speedMul = gameSpeedRef?.current ?? 1;
    const dt = (delta * speedMul) / 1000;

    effectsRef.current.forEach((fx) => {
      // ======================
      // STATUS
      // ======================
      if (fx.type === "STATUS") {
        const mon = fx.target;
        const s = mon?.status;
        const now = performance.now();

        let active = false;

        if (fx.status === "SLOW") active = s.slowUntil > now;
        if (fx.status === "STUN") active = s.stunUntil > now;
        if (fx.status === "ARMOR_BREAK") active = s.defenseDownUntil > now;

        if (!mon || mon.hp <= 0 || !active) {
          fx.done = true;
        }
        return;
      }

      // ======================
      // TOWER BREAK (⭐ 최우선)
      // ======================
      if (fx.type === "TOWER_BREAK") {
        fx.elapsed += dt;

        fx.vy += fx.gravity * dt;
        fx.x += fx.vx * dt;
        fx.y += fx.vy * dt;
        fx.rotation += fx.rotationSpeed * dt;

        if (fx.elapsed >= fx.lifeTime) {
          fx.done = true;
        }
        return;
      }

      // 공통 elapsed
      fx.elapsed = (fx.elapsed ?? 0) + dt;

      // ======================
      // LASER / EVOLVE
      // ======================
      if (fx.type === "LASER" || fx.type === "EVOLVE") {
        if (fx.elapsed >= fx.lifeTime) fx.done = true;
        return;
      }

      // ======================
      // PROJECTILE
      // ======================
      if (!fx.target) {
        fx.done = true;
        return;
      }

      const dx = fx.target.x - fx.x;
      const dy = fx.target.y - fx.y;
      const dist = Math.hypot(dx, dy);

      const move = fx.speed * dt;

      if (dist <= move) {
        fx.x = fx.target.x;
        fx.y = fx.target.y;
        fx.done = true;
        return;
      }

      fx.x += (dx / dist) * move;
      fx.y += (dy / dist) * move;

      fx.timer += dt;
      if (fx.timer >= fx.frameDuration) {
        fx.frame = (fx.frame + 1) % fx.totalFrames;
        fx.timer = 0;
      }
    });

    effectsRef.current = effectsRef.current.filter((fx) => !fx.done);
  }

  /* ======================
     렌더
  ====================== */

  function render(ctx) {
    effectsRef.current.forEach((fx) => {
      if (fx.type === "LASER") {
        const t = performance.now();
        const pulse = 1 + Math.sin(t / 40) * 0.15;

        ctx.save();
        ctx.strokeStyle = "rgba(80,180,255,0.4)";
        ctx.lineWidth = 20 * pulse;
        ctx.beginPath();
        ctx.moveTo(fx.startX, fx.startY);
        ctx.lineTo(fx.target.x, fx.target.y);
        ctx.stroke();
        ctx.restore();
        return;
      }

      if (fx.type === "STATUS") {
        const { x, y } = fx.target;
        const t = performance.now() / 400;

        ctx.save();
        ctx.translate(x, y - 52);

        // 🟣 SLOW – 보라색 물결
        if (fx.status === "SLOW") {
          ctx.strokeStyle = "rgba(180,120,255,0.8)";
          ctx.lineWidth = 2;

          for (let i = 0; i < 2; i++) {
            const r = 10 + ((t * 20 + i * 10) % 20);
            ctx.beginPath();
            ctx.arc(0, 0, r, 0, Math.PI * 2);
            ctx.stroke();
          }
        }

        // 🟡 STUN – 노란 원 3개 회전
        if (fx.status === "STUN") {
          ctx.fillStyle = "rgba(255,230,120,0.95)";
          for (let i = 0; i < 3; i++) {
            const a = t * 2 + (Math.PI * 2 * i) / 3;
            ctx.beginPath();
            ctx.arc(Math.cos(a) * 12, Math.sin(a) * 12, 4, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // 🔻 ARMOR_BREAK – 빨간 아래 화살표
        if (fx.status === "ARMOR_BREAK") {
          ctx.fillStyle = "rgba(255,80,80,0.9)";
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(-6, -10);
          ctx.lineTo(6, -10);
          ctx.closePath();
          ctx.fill();

          ctx.fillRect(-2, -18, 4, 8);
        }

        ctx.restore();
        return;
      }

      if (fx.type === "EVOLVE") {
        const p = fx.elapsed / fx.lifeTime;
        const r = 20 + p * 35;

        ctx.save();
        ctx.globalAlpha = 1 - p;
        ctx.translate(fx.x, fx.y);
        ctx.strokeStyle =
          fx.tier === 4 ? "#ffd700" : fx.tier === 3 ? "#c6f" : "#6cf";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        return;
      }

      if (fx.type === "TOWER_BREAK") {
        const p = fx.elapsed / fx.lifeTime;

        ctx.save();
        ctx.globalAlpha = 1 - p;
        ctx.translate(fx.x, fx.y);
        ctx.rotate(fx.rotation);
        ctx.fillStyle = fx.color;
        ctx.fillRect(-fx.size / 2, -fx.size / 2, fx.size, fx.size);
        ctx.restore();
        return;
      }

      // PROJECTILE
      if (!fx.img) return;

      const dx = fx.target.x - fx.x;
      const dy = fx.target.y - fx.y;
      const angle = Math.atan2(dy, dx);

      const { direction, frames } = getEffectFrameInfo(fx.towerIdx);
      const layout = EFFECT_SHEET_LAYOUT[fx.towerIdx];

      let fw, fh, sx, sy;
      if (layout) {
        fw = fx.img.width / layout.cols;
        fh = fx.img.height / layout.rows;
        const col = fx.frame % layout.cols;
        const row = Math.floor(fx.frame / layout.cols);
        sx = col * fw;
        sy = row * fh;
      } else {
        fw = direction === "horizontal" ? fx.img.width / frames : fx.img.width;
        fh = direction === "vertical" ? fx.img.height / frames : fx.img.height;
        sx = direction === "horizontal" ? fx.frame * fw : 0;
        sy = direction === "vertical" ? fx.frame * fh : 0;
      }

      const base = IMPACT_SIZE_BY_TIER[fx.tier] ?? 40;
      const scale = base / Math.max(fw, fh);

      ctx.save();
      ctx.translate(fx.x, fx.y);
      ctx.rotate(angle);
      ctx.drawImage(
        fx.img,
        sx,
        sy,
        fw,
        fh,
        (-fw * scale) / 2,
        (-fh * scale) / 2,
        fw * scale,
        fh * scale
      );
      ctx.restore();
    });
  }

  return {
    effectsRef,
    spawnAttackEffect,
    spawnEvolveEffect,
    spawnStatusEffect,
    spawnTowerBreakEffect,
    update,
    render,
  };
}
