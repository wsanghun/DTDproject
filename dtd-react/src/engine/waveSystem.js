/**
 * Wave System (Backend-driven)
 * - 백에서 받은 waves 그대로 사용
 * - 프론트는 시간 비교 + spawn만 담당
 */
export function createWaveSystem({
  wavesRef, // mapConfigJson.waves
  monsterSystem,
  gameSpeedRef,
  onWaveChange,
  getActiveMission,
  onBossGraceEnd,
}) {
  const stateRef = {
    waveIndex: 0,
    spawnedCount: 0,

    elapsedInWait: 0,
    elapsedInWave: 0,
    spawnTimer: 0,

    phase: "WAIT", // "WAIT" | "SPAWN"
    running: false,

    missionSpawned: false,
  };

  /* ======================
     시작
  ====================== */

  function start() {
    stateRef.waveIndex = 0;
    stateRef.spawnedCount = 0;

    stateRef.elapsedInWait = 0;
    stateRef.elapsedInWave = 0;
    stateRef.spawnTimer = 0;

    stateRef.phase = "WAIT";
    stateRef.running = true;

    onWaveChange?.({
      wave: 1,
      phase: "WAIT",
    });
  }

  /* ======================
     업데이트
  ====================== */

  function update(delta) {
    if (!stateRef.running) return;

    const wave = wavesRef.current[stateRef.waveIndex];
    if (!wave) {
      stateRef.running = false;
      return;
    }

    const d = delta;

    const startDelay = Number(wave.startDelay ?? 0);
    const interval = Number(wave.interval);
    const totalCount = Number(wave.count);

    /* ===== WAIT ===== */
    if (stateRef.phase === "WAIT") {
      stateRef.elapsedInWait += d;

      if (stateRef.elapsedInWait >= startDelay) {
        stateRef.phase = "SPAWN";
        stateRef.elapsedInWave = 0;
        stateRef.spawnTimer = 0;

        // ⭐ START DELAY 종료 알림
        onWaveChange?.({
          wave: Number(wave.waveNumber),
          phase: "WAVE",
        });
      }

      return;
    }

    /* ===== SPAWN ===== */
    if (stateRef.phase === "SPAWN") {
      stateRef.spawnTimer += d;

      const waveNumber = Number(wave.waveNumber);

      const isBossWave = waveNumber % 10 === 0;

      // ⭐ 모든 보스 웨이브 중 마지막
      const lastBossWaveNumber = Math.max(
        ...wavesRef.current
          .map((w) => Number(w.waveNumber))
          .filter((n) => n % 10 === 0)
      );

      const isFinalBoss = isBossWave && waveNumber === lastBossWaveNumber;

      while (
        stateRef.spawnedCount < totalCount &&
        stateRef.spawnTimer >= interval
      ) {
        monsterSystem.spawn(Number(wave.enemyId), {
          isBoss: isBossWave,
          isLastWaveBoss: isFinalBoss, // 👑 최종 보스는 여기서 확정
          wave: waveNumber,
        });

        // ✅ ✅ ✅ 여기
        if (isFinalBoss) {
          console.log("👑 FINAL BOSS SPAWN", {
            waveNumber,
            enemyId: wave.enemyId,
          });
        }

        stateRef.spawnedCount++;
        stateRef.spawnTimer -= interval;
      }

      // =========================
      // ⭐ 미션 보스 스폰 (단 한 번)
      // =========================
      const missionId = getActiveMission?.();
      if (missionId && !stateRef.missionSpawned) {
        spawnMissionBoss(missionId);
        stateRef.missionSpawned = true;
      }

      // =========================
      // 웨이브 종료
      // =========================
      if (stateRef.spawnedCount >= totalCount) {
        const isLastWave = stateRef.waveIndex === wavesRef.current.length - 1;

        onWaveChange?.({
          wave: waveNumber,
          phase: "END",
        });

        if (isLastWave) {
          // ⭐ 마지막 웨이브면 여기서 완전히 종료
          stateRef.running = false;
          return;
        }
        stateRef.waveIndex++;
        stateRef.spawnedCount = 0;
        stateRef.elapsedInWait = 0;
        stateRef.spawnTimer = 0;
        stateRef.phase = "WAIT";
        stateRef.missionSpawned = false;
      }
    }
  }

  /* ======================
     UI용 정보
  ====================== */

  function getWaveInfo() {
    const wave =
      wavesRef.current[stateRef.waveIndex] ??
      wavesRef.current[wavesRef.current.length - 1];

    if (!wave) return null;

    const startDelay = Number(wave.startDelay ?? 0);

    if (stateRef.phase === "WAIT") {
      const remain = Math.max(0, startDelay - stateRef.elapsedInWait);

      return {
        wave: Number(wave.waveNumber),
        phase: "WAIT",
        timeLeft: Math.max(0, Math.ceil(remain / 1000)), // ✅ 딜레이 표시
      };
    }

    if (stateRef.phase === "SPAWN") {
      const remaining =
        (Number(wave.count) - stateRef.spawnedCount) * Number(wave.interval);

      return {
        wave: Number(wave.waveNumber),
        phase: "WAVE",
        timeLeft: Math.max(0, Math.ceil(remaining / 1000)),
      };
    }
  }

  function spawnMissionBoss(missionId) {
    monsterSystem.spawn(missionId, {
      isMissionBoss: true,
      missionId,
      isBoss: true,
      hpMultiplier: 5,
      rewardBit: 0,
    });
  }

  function isRunning() {
    return stateRef.running;
  }

  function isFinished() {
    return !stateRef.running && stateRef.waveIndex >= wavesRef.current.length;
  }

  return {
    start,
    update,
    getWaveInfo,
    isRunning,
    isFinished,
  };
}
