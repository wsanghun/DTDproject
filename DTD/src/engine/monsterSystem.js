import { MAX_MONSTERS } from "./config";

/**
 * 몬스터 시스템
 * - 몬스터 생성
 * - 이동
 * - 상태이상
 * - 사망 처리
 * - 렌더
 */
export function createMonsterSystem({
  pathRef,
  monsterMapRef,
  monsterImageMapRef,
  stageRef,
  onMonsterDead,
}) {
  const monstersRef = { current: [] };

  /* ======================
     몬스터 생성
  ====================== */

  function spawn(
    enemyId,
    {
      isBoss = false,
      isMissionBoss = false,
      missionId = null,
      isLastWaveBoss = false,
      wave = undefined,
      hpMultiplier = 1,
    } = {}
  ) {
    const base = monsterMapRef.current[enemyId];
    if (!base) return;

    const img = isMissionBoss
      ? monsterImageMapRef.current[`mission_${enemyId}`]
      : isBoss
      ? monsterImageMapRef.current[`boss_${enemyId}`]
      : monsterImageMapRef.current[enemyId];

    if (!img || !pathRef.current?.length) return;

    if (
      !isMissionBoss &&
      stageRef.current &&
      monstersRef.current.length >= stageRef.current.mapConfigJson.limitCount
    ) {
      return;
    }

    const rewardBit = isBoss
      ? Math.floor((base.rewardBit ?? 0) * 1.5)
      : base.rewardBit ?? 0;

    const hp = base.hp * hpMultiplier;
    const speed = isBoss ? base.speed * 0.6 : base.speed;

    const BASE_SIZE = 48;
    const size = isBoss ? BASE_SIZE * 1.5 : BASE_SIZE;

    monstersRef.current.push({
      id: Date.now() + Math.random(),

      // 위치
      x: pathRef.current[0].x,
      y: pathRef.current[0].y,
      pathIndex: 0,
      loopStartIndex: 2,

      missionId,

      isBoss,
      isMissionBoss,
      isLastWaveBoss,
      wave,

      hp,
      maxHp: hp,
      defense: base.defense,
      baseDefense: base.defense,
      baseSpeed: speed,

      rewardBit,

      status: {
        slowUntil: 0,
        stunUntil: 0,
        defenseDownUntil: 0,
      },

      img,
      frame: 0,
      timer: 0,
      frameDuration: isBoss ? 200 : 120,
      cols: 2,
      rows: 2,
      totalFrames: 2,

      size,

      // ⭐ 방향 관련 (중요)
      facing: 1, // 1 = 기본(왼쪽), -1 = 반전(오른쪽)
    });
  }

  /* ======================
     상태이상
  ====================== */

  function applyStatus(mon, type, durationMs) {
    const now = performance.now();

    if (type === "SLOW")
      mon.status.slowUntil = Math.max(mon.status.slowUntil, now + durationMs);
    if (type === "STUN")
      mon.status.stunUntil = Math.max(mon.status.stunUntil, now + durationMs);
    if (type === "ARMOR_BREAK")
      mon.status.defenseDownUntil = Math.max(
        mon.status.defenseDownUntil,
        now + durationMs
      );
  }

  /* ======================
     이동
  ====================== */

  function move(mon, delta) {
    const now = performance.now();
    if (mon.status.stunUntil > now) return;

    let speed = mon.baseSpeed;
    if (mon.status.slowUntil > now) speed *= 0.5;

    const path = pathRef.current;
    let nextIndex = mon.pathIndex + 1;

    if (!path[nextIndex]) {
      nextIndex = mon.loopStartIndex ?? 0;
    }

    const target = path[nextIndex];
    const dx = target.x - mon.x;
    const dy = target.y - mon.y;

    const dist = Math.hypot(dx, dy);
    const moveDist = speed * (delta / 16.67);

    const beforeX = mon.x;

    if (moveDist >= dist) {
      mon.x = target.x;
      mon.y = target.y;
      mon.pathIndex = nextIndex;
    } else {
      mon.x += (dx / dist) * moveDist;
      mon.y += (dy / dist) * moveDist;
    }

    // ⭐ 핵심: 실제 x 이동량 기준 좌우 반전
    const movedX = mon.x - beforeX;

    // 기본 이미지가 "왼쪽"을 보고 있음
    if (movedX > 0.01) {
      mon.facing = -1; // 오른쪽 이동 → 반전
    } else if (movedX < -0.01) {
      mon.facing = 1; // 왼쪽 이동 → 원본
    }
  }

  /* ======================
     업데이트
  ====================== */

  function update(delta) {
    monstersRef.current.forEach((mon) => {
      mon.timer += delta;
      if (mon.timer >= mon.frameDuration) {
        mon.frame = (mon.frame + 1) % mon.totalFrames;
        mon.timer = 0;
      }

      move(mon, delta);

      if (mon.status.defenseDownUntil <= performance.now()) {
        mon.defense = mon.baseDefense;
      }
    });

    monstersRef.current = monstersRef.current.filter((mon) => {
      if (mon.hp <= 0) {
        onMonsterDead?.(mon);
        return false;
      }
      return true;
    });
  }

  /* ======================
     렌더
  ====================== */

  function render(ctx) {
    let boss = null;

    monstersRef.current.forEach((mon) => {
      if (mon.isMissionBoss) boss = mon;
      else if (!boss && mon.isBoss) boss = mon;

      if (!mon.img || !mon.img.loaded) return;

      const fw = mon.img.width / mon.cols;
      const fh = mon.img.height / mon.rows;
      const col = mon.frame % mon.cols;
      const row = Math.floor(mon.frame / mon.cols);

      const scale = mon.size / Math.max(fw, fh);
      const drawW = fw * scale;
      const drawH = fh * scale;

      // ⭐ 체력바 (회전/반전 X)
      if (!mon.isBoss && !mon.isMissionBoss) {
        const hpRatio = Math.max(0, mon.hp / mon.maxHp);
        const barW = drawW * 0.8;

        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(mon.x - barW / 2, mon.y - drawH / 2 - 10, barW, 5);
        ctx.fillStyle = "lime";
        ctx.fillRect(
          mon.x - barW / 2,
          mon.y - drawH / 2 - 10,
          barW * hpRatio,
          5
        );
      }

      ctx.save();
      ctx.translate(mon.x, mon.y);

      // ⭐ 오른쪽 이동 시만 좌우 반전
      if (mon.facing === -1) {
        ctx.scale(-1, 1);
      }

      ctx.drawImage(
        mon.img,
        col * fw,
        row * fh,
        fw,
        fh,
        -drawW / 2,
        -drawH / 2,
        drawW,
        drawH
      );

      ctx.restore();
    });

    // ⭐ 보스 체력바
    if (boss) {
      const barW = 520;
      const barH = 18;
      const x = (ctx.canvas.width - barW) / 2;
      const y = 24;

      const ratio = Math.max(0, boss.hp / boss.maxHp);

      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.fillRect(x, y, barW, barH);
      ctx.fillStyle = "#ff4040";
      ctx.fillRect(x, y, barW * ratio, barH);
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, barW, barH);
    }
  }

  return {
    monstersRef,
    spawn,
    update,
    render,
    getMonsters: () => monstersRef.current,
    applyStatus,
  };
}
