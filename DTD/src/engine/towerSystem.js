import { MAX_TOWERS, TOWER_SIZE_BY_TIER } from "./config";

/**
 * 타워 시스템
 */
export function createTowerSystem({
  monsterSystem,
  effectSystem,
  towerImageMapRef,
  myTowersRef,
  onBitChange,
}) {
  const towersRef = { current: [] };
  const SELL_REFUND_RATE = 0.5;

  /* ======================
     타워 설치
  ====================== */

  function buildTower(zone, towerMeta, bit) {
    if (bit < towerMeta.baseBuildCost) return null;
    if (towersRef.current.length >= MAX_TOWERS) return null;

    const occupied = towersRef.current.some(
      (t) => t.zoneX === zone.x && t.zoneY === zone.y
    );
    if (occupied) return null;

    const x = zone.x + zone.w / 2;
    const y = zone.y + zone.h / 2;

    // ⭐ 핵심 수정: towerMeta 그대로 포함
    const tower = {
      ...towerMeta, // ← towerName, description, baseType 전부 포함됨

      id: Date.now() + Math.random(),

      x,
      y,
      zoneX: zone.x,
      zoneY: zone.y,
      zoneW: zone.w,
      zoneH: zone.h,

      img: towerImageMapRef.current[towerMeta.towerIdx],

      // ===== 전투용 실사용 스탯 =====
      damage: towerMeta.currentDamage,
      range: towerMeta.baseRange,

      baseCooldown: towerMeta.baseCooldown, // sec
      attackInterval: towerMeta.baseCooldown * 1000, // ms
      cooldownLeft: 0,

      /* ===== 타겟 ===== */
      currentTarget: null,

      /* ===== 애니메이션 ===== */
      idleFrames: [0, 0, 1, 1],
      attackFrames: [2, 2, 1, 1],

      idleFrameIndex: 0,
      attackFrameIndex: 0,

      animTimer: 0,
      frameDurationIdle: 220,
      frameDurationAttack: 90,

      isAttacking: false,
      attackAnimTime: 0,
      attackAnimDuration: 180,

      cols: 2,
      rows: 2,
    };

    towersRef.current.push(tower);
    onBitChange(-towerMeta.baseBuildCost);

    return tower;
  }

  /* ======================
     타워 철거
  ====================== */

  function sellTower(towerId) {
    const index = towersRef.current.findIndex((t) => t.id === towerId);
    if (index === -1) return false;

    const tower = towersRef.current[index];

    // ⭐ 진화 단계 패널티
    const tierPenalty = 1 - (tower.tier - 1) * 0.15;

    // ⭐ 최종 환불 금액
    const refund = Math.floor(
      tower.baseBuildCost * SELL_REFUND_RATE * tierPenalty
    );

    onBitChange(refund);

    // (선택) 철거 이펙트
    effectSystem.spawnTowerBreakEffect(tower.x, tower.y, tower.tier);

    // 🗑 타워 제거
    towersRef.current.splice(index, 1);

    return true;
  }

  /* ======================
     사거리 판정
  ====================== */

  function isInRange(tower, mon) {
    const dx = mon.x - tower.x;
    const dy = mon.y - tower.y;
    const dist = Math.hypot(dx, dy);
    const monsterRadius = mon.size ? mon.size / 2 : 16;
    return dist <= tower.range + monsterRadius;
  }

  /* ======================
   타워 진화
====================== */

  function evolveTower(towerId, targetTier) {
    const tower = towersRef.current.find((t) => t.id === towerId);
    if (!tower || tower.tier >= targetTier) return;

    const baseGroup = Math.floor(tower.towerIdx / 100);

    const nextMeta = myTowersRef.current.find(
      (t) => t.tier === targetTier && Math.floor(t.towerIdx / 100) === baseGroup
    );

    if (!nextMeta) return;

    const evolveCost = nextMeta.baseBuildCost;

    // 💰 비용 차감
    onBitChange(-evolveCost);

    const prevTier = tower.tier;

    // ======================
    // ⭐ 실제 진화 처리
    // ======================
    Object.assign(tower, {
      ...nextMeta,
      tier: targetTier,
      towerIdx: nextMeta.towerIdx,
      damage: nextMeta.currentDamage,
      range: nextMeta.baseRange,
      baseCooldown: nextMeta.baseCooldown,
      attackInterval: nextMeta.baseCooldown * 1000,
      img: towerImageMapRef.current[nextMeta.towerIdx],
    });

    // ======================
    // ✨ 진화 이펙트 생성
    // ======================
    effectSystem.spawnEvolveEffect(tower.x, tower.y, targetTier);

    console.log(
      `✨ 진화 완료: ${tower.towerName} (${prevTier} → ${targetTier})`
    );
  }

  /* ======================
     업데이트
  ====================== */

  function update(delta) {
    const monsters = monsterSystem.getMonsters();

    towersRef.current.forEach((tower) => {
      tower.cooldownLeft -= delta;
      if (tower.cooldownLeft > 0) return;

      const targets = monsters.filter((m) => m.hp > 0 && isInRange(tower, m));
      if (targets.length === 0) return;

      const target = targets[0];
      tower.cooldownLeft = tower.attackInterval;

      tower.isAttacking = true;
      tower.attackAnimTime = 0;
      tower.attackFrameIndex = 0;

      switch (tower.baseAttackType) {
        case "SINGLE":
          attackSingle(tower, target);
          break;
        case "MULTI":
          targets.slice(0, 3).forEach((t) => attackSingle(tower, t));
          break;
        case "SLOW":
          attackSlow(tower, target);
          break;
        case "STUN":
          attackStun(tower, target);
          break;
        case "DEFENSE_DOWN":
          attackDefenseDown(tower, target);
          break;
      }
    });
  }

  function attackSingle(tower, target) {
    applyDamage(target, tower);
    effectSystem.spawnAttackEffect(tower, target);
  }

  function attackSlow(tower, target) {
    applyDamage(target, tower);

    // ⭐ 상태 적용은 monsterSystem이 담당
    monsterSystem.applyStatus(target, "SLOW", 2000);

    // ⭐ 상태 이펙트 생성 (이게 빠져 있었음)
    effectSystem.spawnStatusEffect(target, "SLOW");

    effectSystem.spawnAttackEffect(tower, target);
  }

  function attackStun(tower, target) {
    applyDamage(target, tower);

    monsterSystem.applyStatus(target, "STUN", 800);
    effectSystem.spawnStatusEffect(target, "STUN");

    effectSystem.spawnAttackEffect(tower, target);
  }

  function attackDefenseDown(tower, target) {
    applyDamage(target, tower);

    monsterSystem.applyStatus(target, "ARMOR_BREAK", 3000);
    effectSystem.spawnStatusEffect(target, "ARMOR_BREAK");

    effectSystem.spawnAttackEffect(tower, target);
  }

  function applyDamage(mon, tower) {
    if (!mon || mon.hp <= 0) return;
    const dmg = Math.max(1, tower.damage - (mon.defense ?? 0));
    mon.hp -= dmg;
  }

  /* ======================
     렌더
  ====================== */

  function render(ctx, selectedTowerId, delta) {
    towersRef.current.forEach((tower) => {
      if (!tower.img || !tower.img.loaded) return;

      if (tower.isAttacking) {
        tower.attackAnimTime += delta;
        if (tower.attackAnimTime >= tower.attackAnimDuration) {
          tower.isAttacking = false;
          tower.attackAnimTime = 0;
          tower.attackFrameIndex = 0;
          tower.animTimer = 0;
        }
      }

      const frames = tower.isAttacking ? tower.attackFrames : tower.idleFrames;
      const frameDuration = tower.isAttacking
        ? tower.frameDurationAttack
        : tower.frameDurationIdle;

      tower.animTimer += delta;
      if (tower.animTimer >= frameDuration) {
        tower.animTimer -= frameDuration;
        tower.isAttacking
          ? (tower.attackFrameIndex =
              (tower.attackFrameIndex + 1) % frames.length)
          : (tower.idleFrameIndex = (tower.idleFrameIndex + 1) % frames.length);
      }

      const frame =
        frames[
          tower.isAttacking ? tower.attackFrameIndex : tower.idleFrameIndex
        ];

      const fw = tower.img.width / tower.cols;
      const fh = tower.img.height / tower.rows;
      const col = frame % tower.cols;
      const row = Math.floor(frame / tower.cols);

      const size = TOWER_SIZE_BY_TIER[tower.tier] ?? 56;

      ctx.drawImage(
        tower.img,
        col * fw,
        row * fh,
        fw,
        fh,
        tower.x - size / 2,
        tower.y - size / 2,
        size,
        size
      );
    });
  }

  function getTowerAt(x, y) {
    return towersRef.current.find((t) => {
      const dx = x - t.x;
      const dy = y - t.y;
      const r = (TOWER_SIZE_BY_TIER[t.tier] ?? 56) / 2;
      return dx * dx + dy * dy <= r * r;
    });
  }

  function isOccupied(x, y) {
    return towersRef.current.some((t) => {
      const zx = t.zoneX + (t.zoneW ?? 0) / 2;
      const zy = t.zoneY + (t.zoneH ?? 0) / 2;

      return Math.abs(zx - x) < 1 && Math.abs(zy - y) < 1;
    });
  }

  return {
    towersRef,
    buildTower,
    evolveTower,
    sellTower,
    update,
    render,
    getTowerAt,
    isOccupied,
  };
}
