import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";

import "../../css/stage.css";
import { STAGES } from "../../stages/Stage";
import stagePaths from "../../data/stagePaths.json";
import buildZonePaths from "../../data/buildZonePaths.json";
import ResultOverlay from "../UI/ResultOverlay";
import TowerDetailCard from "../UI/TowerDetailCard";

import { useGameLoop } from "../../engine/useGameLoop";
import { createMonsterSystem } from "../../engine/monsterSystem";
import { createTowerSystem } from "../../engine/towerSystem";
import { createEffectSystem } from "../../engine/effectSystem";

import { MAX_MONSTERS } from "../../engine/config";

import { createWaveSystem } from "../../engine/waveSystem";
import { createInputSystem } from "../../engine/inputSystem";

import TowerCardPanel from "../UI/TowerCardPanel";

export default function StageCanvas() {
  const { stageId } = useParams();
  /* ======================
     Refs
  ====================== */
  const canvasRef = useRef(null);
  const gameSpeedRef = useRef(1);
  const effectImageMapRef = useRef({});

  const pathRef = useRef([]);
  const buildZonesRef = useRef([]);

  const monsterMapRef = useRef({});
  const monsterImageMapRef = useRef({});
  const towerImageMapRef = useRef({});
  const myTowersRef = useRef([]);
  const wavesRef = useRef([]);
  const [myTowers, setMyTowers] = useState([]);

  const stageRef = useRef(null);

  const scoreRef = useRef(0);

  const [unlockedTier2, setUnlockedTier2] = useState(false);

  // 10웨이브 보스
  const clearedMissionsRef = useRef(new Set()); // 901~918
  const [activeMission, setActiveMission] = useState(null);

  /* ======================
     UI State
  ====================== */
  const [bit, setBit] = useState(0);
  const [bitPopups, setBitPopups] = useState([]);
  const [buildTower, setBuildTower] = useState(null);
  const [selectedPlacedTower, setSelectedPlacedTower] = useState(null);
  const mapImgRef = useRef(null);
  const [waveInfo, setWaveInfo] = useState(null);
  const [gameResult, setGameResult] = useState(null);
  const navigate = useNavigate();
  const [score, setScore] = useState(0);
  const [reward, setReward] = useState(null);
  const [missionOpen, setMissionOpen] = useState(false);
  const [missionPage, setMissionPage] = useState(1); // 1 | 2
  const [missionMap, setMissionMap] = useState({});

  const missionRemainMsRef = useRef(null);
  const [missionTimer, setMissionTimer] = useState(null);

  const [, forceUpdate] = useState(0);

  const pausedRef = useRef(false);
  const [paused, setPaused] = useState(false);

  async function clearStageReward(isWin) {
    if (reward) return; // 중복 호출 방지

    try {
      const payload = {
        stageIdx: Number(stageId),
        score: scoreRef.current,
        isWin,
      };

      const res = await axios.post("/api/stages/clear", payload);

      setReward(res.data);
    } catch (e) {
      console.error("[CLEAR STAGE ERROR]", e);
    }
  }

  function setPauseSafe(value, from) {
    pausedRef.current = value;
    setPaused(value);
  }

  function togglePause() {
    const next = !pausedRef.current;
    setPauseSafe(next, "TOGGLE");
  }

  function exitGame() {
    setGameResult("DEFEAT");
    setPauseSafe(true, "EXIT");

    clearStageReward(false);
  }

  function resetProgress() {
    // ======================
    // ⭐ 진행도 핵심 초기화
    // ======================

    // 미션 클리어 기록
    clearedMissionsRef.current.clear();

    // 2티어 해금
    setUnlockedTier2(false);

    // 미션 상태
    setActiveMission(null);
    missionRemainMsRef.current = null;
    setMissionTimer(null);

    // ======================
    // ⭐ 시스템 내부 상태
    // ======================
    monsterSystem.monstersRef.current = [];
    towerSystem.towersRef.current = [];
    effectSystem.effectsRef.current.length = 0;

    // ======================
    // ⭐ UI 상태
    // ======================
    setSelectedPlacedTower(null);
    setBuildTower(null);
    setMissionOpen(false);
    setMissionPage(1);

    // ======================
    // ⭐ 점수 / 비트
    // ======================
    setScore(0);
    scoreRef.current = 0;

    const mapConfig =
      typeof stageRef.current.mapConfigJson === "string"
        ? JSON.parse(stageRef.current.mapConfigJson)
        : stageRef.current.mapConfigJson;

    setBit(mapConfig.startBit ?? 0);
  }

  function restartStage() {
    console.log("[RESTART] stage restart");

    // 결과 / 일시정지 해제
    setGameResult(null);
    setPauseSafe(false, "RESTART");

    // ⭐ 핵심: 진행도 완전 초기화
    resetProgress();

    // 웨이브 처음부터
    waveSystem.start();

    console.log("[RESTART] wave restarted");
  }

  useEffect(() => {
    const stage = STAGES[stageId];
    if (!stage) return;

    const img = new Image();
    img.src = stage.map;
    img.onload = () => {
      mapImgRef.current = img;
    };
  }, [stageId]);

  /* ======================
     엔진 생성
  ====================== */
  const effectSystem = useRef(
    createEffectSystem({
      effectImageMapRef,
      gameSpeedRef,
    })
  ).current;

  const monsterSystem = useRef(
    createMonsterSystem({
      pathRef,
      monsterMapRef,
      monsterImageMapRef,
      stageRef,
      onMonsterDead: (mon) => {
        // ======================
        // 💰 보상 (항상 먼저!)
        // ======================
        setBit((prev) => prev + (mon.rewardBit ?? 0));

        const isBoss = mon.isBoss === true;
        const addScore = isBoss ? 200 : 2;

        scoreRef.current += addScore;
        setScore(scoreRef.current);

        // ======================
        // ⭐ 미션 보스 처리
        // ======================
        if (mon.isMissionBoss) {
          clearedMissionsRef.current.add(mon.missionId);
          missionRemainMsRef.current = null;
          setMissionTimer(null);
          setActiveMission(null);
          forceUpdate((v) => v + 1);
          return;
        }

        // ======================
        // ⭐ ⭐ ⭐ 최종 보스 승리 판정 (엔진 플래그 기준)
        // ======================
        if (mon.isLastWaveBoss === true) {
          console.log("🏆 FINAL BOSS DEAD → VICTORY", mon);

          setGameResult("VICTORY");
          setPauseSafe(true, "STAGE_CLEAR");

          requestAnimationFrame(() => clearStageReward(true));
        }
      },
    })
  ).current;

  const towerSystem = useRef(
    createTowerSystem({
      monsterSystem,
      effectSystem,
      towerImageMapRef,
      myTowersRef,
      clearedMissionsRef,
      onBitChange: (delta) => setBit((prev) => prev + delta),
    })
  ).current;

  /* ======================
     Stage / 데이터 로딩
  ====================== */
  useEffect(() => {
    async function loadStage() {
      const stageKey = String(stageId);

      // ⭐ 몹 이동 경로 (JSON)
      pathRef.current = stagePaths[stageKey] ?? [];

      // ⭐ 타워 설치 가능 영역 (JSON)
      const zoneData = buildZonePaths[stageKey];
      if (!zoneData) {
        buildZonesRef.current = [];
      } else {
        const grid = zoneData.grid;

        buildZonesRef.current = zoneData.zones.map((p) => ({
          x: p.x - grid / 2,
          y: p.y - grid / 2,
          w: grid,
          h: grid,
        }));
      }

      // ⭐ 스테이지 메타
      stageRef.current = STAGES[stageKey];

      // ⭐ 전체 스테이지 로드
      const stagesRes = await axios.get("/api/stages");

      // ⭐ stageId가 없으면 첫 번째 스테이지
      const currentStage = stageId
        ? stagesRes.data.find((s) => Number(s.idx) === Number(stageId))
        : stagesRes.data[0];

      if (!currentStage) {
        console.error("❌ Stage not found:", stageId);
        return;
      }

      stageRef.current = currentStage;

      // ⭐ 미션 데이터 (여기서 드디어 생김!)
      const mapConfig =
        typeof currentStage.mapConfigJson === "string"
          ? JSON.parse(currentStage.mapConfigJson)
          : currentStage.mapConfigJson;

      const missionMapObj = {};
      (mapConfig.missions ?? []).forEach((m) => {
        missionMapObj[m.mission_id] = m;
      });

      setMissionMap(missionMapObj);

      setBit(mapConfig.startBit ?? 0);
      wavesRef.current = mapConfig.waves ?? [];

      // ⭐ 웨이브 시작
      if (wavesRef.current.length > 0) {
        waveSystem.start();
      }

      // 몬스터
      const monsterRes = await axios.get("/api/monsters");

      monsterRes.data.forEach((m) => {
        // 몬스터 스탯 정보
        monsterMapRef.current[m.idx] = m;

        /* ======================
     일반 몬스터 이미지
  ====================== */
        const normalImg = new Image();
        normalImg.onload = () => (normalImg.loaded = true);
        normalImg.src = `/Monsters/stage${stageId}/${m.imageFile}.PNG`;
        monsterImageMapRef.current[m.idx] = normalImg;

        /* ======================
     보스 몬스터 이미지
  ====================== */
        const bossImg = new Image();
        bossImg.onload = () => (bossImg.loaded = true);
        bossImg.src = `/Monsters/boss/stage${stageId}/${m.imageFile}.PNG`;
        monsterImageMapRef.current[`boss_${m.idx}`] = bossImg;

        /* ======================
     ⭐ 미션 보스 이미지
  ====================== */
        const missionImg = new Image();
        missionImg.onload = () => (missionImg.loaded = true);
        missionImg.src = `/Monsters/mission/${m.imageFile}.PNG`;
        monsterImageMapRef.current[`mission_${m.idx}`] = missionImg;
      });

      // 타워
      const towerRes = await axios.get("/api/towers");
      myTowersRef.current = towerRes.data;
      setMyTowers(towerRes.data);

      towerRes.data.forEach((t) => {
        const img = new Image();
        img.onload = () => (img.loaded = true);
        img.src = `/Towers/tier${t.tier}/${t.towerIdx}.PNG`;
        towerImageMapRef.current[t.towerIdx] = img;

        const effectImg = new Image();
        effectImg.onload = () => (effectImg.loaded = true);
        effectImg.src = `/Towers/effects/${t.towerIdx}.png`;
        effectImageMapRef.current[t.towerIdx] = effectImg;
      });
    }

    pausedRef.current = false;
    setPaused(false);
    setGameResult(null);

    loadStage();
  }, [stageId]);

  /* ======================
     입력 처리
  ====================== */
  /*---------------esc----------------*/
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        setBuildTower(null);
        setSelectedPlacedTower(null);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const getMousePos = (e) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: ((e.clientX - rect.left) * canvas.width) / rect.width,
        y: ((e.clientY - rect.top) * canvas.height) / rect.height,
      };
    };

    const onClick = (e) => {
      const { x, y } = getMousePos(e);

      // 설치된 타워 선택
      const tower = towerSystem.getTowerAt(x, y);
      if (tower) {
        setBuildTower(null);
        setSelectedPlacedTower(tower);
        return;
      }

      // 설치
      if (!buildTower) return;

      const zone = buildZonesRef.current.find(
        (z) => x >= z.x && x <= z.x + z.w && y >= z.y && y <= z.y + z.h
      );
      if (!zone) return;

      const newTower = towerSystem.buildTower(zone, buildTower, bit);
      if (newTower) {
        setSelectedPlacedTower(null);
      }
    };

    canvas.addEventListener("click", onClick);
    return () => canvas.removeEventListener("click", onClick);
  }, [buildTower, bit, towerSystem]);

  const buildTowerRef = useRef(null);

  useEffect(() => {
    buildTowerRef.current = buildTower;
  }, [buildTower]);

  const inputSystem = useRef(
    createInputSystem({
      canvasRef,
      buildZonesRef,
      buildTowerRef,
      towerImageMapRef,
      pathRef,
      towerSystem,
    })
  ).current;

  //마운트 / 언마운트
  useEffect(() => {
    inputSystem.attach();
    return () => inputSystem.detach();
  }, [inputSystem]);

  const waveSystem = useRef(
    createWaveSystem({
      wavesRef,
      monsterSystem,
      gameSpeedRef,
      onWaveChange: ({ wave, phase }) => {
        // =========================
        // ❌ 이전 보스 미처치 → 패배
        // =========================
        if (wave % 10 === 1 && phase === "WAVE") {
          const hasPrevWaveBossAlive = monsterSystem.getMonsters().some(
            (m) =>
              m.isBoss &&
              !m.isMissionBoss && // ⭐ 미션 보스 제외
              m.hp > 0
          );

          if (hasPrevWaveBossAlive) {
            console.log("❌ 이전 웨이브 보스 미처치 → 패배");
            setGameResult("DEFEAT");
            setPauseSafe(true, "BOSS_TIMEOUT");
            clearStageReward(false);
            return;
          }
        }
      },
    })
  ).current;

  useEffect(() => {
    let rafId;

    const loop = () => {
      const now = performance.now();
      setWaveInfo(waveSystem.getWaveInfo(now));
      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [waveSystem]);

  /* ======================
   진화 조건 판단
====================== */

  function canEvolveToTier(tower, targetTier) {
    if (!tower) return false;

    const towerGroup = Math.floor(tower.towerIdx / 100);

    // 2티어 → 스테이지 10웨이브 보스
    if (targetTier === 2) {
      return unlockedTier2;
    }

    // 3티어 → 901~908
    if (targetTier === 3) {
      return clearedMissionsRef.current.has(900 + towerGroup);
    }

    // 4티어 → 911~918
    if (targetTier === 4) {
      return clearedMissionsRef.current.has(910 + towerGroup);
    }

    return false;
  }

  /* ======================
     게임 루프
  ====================== */
  useGameLoop({
    canvasRef,
    gameSpeedRef,
    pausedRef,
    systems: {
      map: {
        render(ctx) {
          const img = mapImgRef.current;
          if (!img || !img.complete) return;
          ctx.drawImage(img, 0, 0, 1536, 900);
        },
      },
      wave: waveSystem,
      effect: effectSystem,
      monster: monsterSystem,
      tower: towerSystem,
      input: inputSystem,
      ui: {
        selectedTowerId: selectedPlacedTower?.id,

        onTick: (delta) => {
          const monsters = monsterSystem.getMonsters();
          // ======================
          // ⭐ 마지막 웨이브 종료 후: 보스 죽으면 보여주기 기다리지 말고 즉시 끝내기
          // ======================
          /* if (!gameResult && waveInfo && waveInfo.wave === 51) {
            const hasBossAlive = monsterSystem
              .getMonsters()
              .some((m) => m.isBoss && !m.isMissionBoss && m.hp > 0);

            // ⭐ 51웨이브인데 더 이상 보스가 없으면 즉시 승리
            if (!hasBossAlive) {
              setGameResult("VICTORY");
              setPauseSafe(true, "STAGE_CLEAR");

              // ⭐ 점수 setState 반영 타이밍 안전하게 다음 프레임에 보냄
              requestAnimationFrame(() => clearStageReward(true));
              return;
            }
          }*/
          // ======================
          // ⭐ 미션 타이머
          // ======================
          if (missionRemainMsRef.current != null) {
            const missionBossAlive = monsterSystem
              .getMonsters()
              .some((m) => m.isMissionBoss && m.hp > 0);

            if (!missionBossAlive) {
              missionRemainMsRef.current = null;
              setMissionTimer(null);
              setActiveMission(null);
            } else {
              missionRemainMsRef.current -= delta;
              setMissionTimer(Math.ceil(missionRemainMsRef.current / 1000));

              if (missionRemainMsRef.current <= 0) {
                setGameResult("DEFEAT");
                setPauseSafe(true, "MISSION_FAIL");
                clearStageReward(false);
                return;
              }
            }
          }
        },
      },
    },
  });

  useEffect(() => {
    if (gameResult) return;
    if (!waveSystem.isRunning()) return;

    if (monsterSystem.monstersRef.current.length >= MAX_MONSTERS) {
      console.log("[GAME] DEFEAT condition met");
      setGameResult("DEFEAT");
      setPauseSafe(true, "DEFEAT");

      clearStageReward(false);
    }
  }, [waveInfo, gameResult]);

  useEffect(() => {
    if (!waveInfo) return;

    // ✅ 11웨이브 딜레이 끝 → 실제 시작 시점
    if (waveInfo.wave === 11 && waveInfo.phase === "WAVE" && !unlockedTier2) {
      console.log("✅ 11웨이브 시작 → 2티어 진화 해금");
      setUnlockedTier2(true);
    }
  }, [waveInfo, unlockedTier2]);

  function getMissionIds(page) {
    if (page === 1) {
      return Array.from({ length: 8 }, (_, i) => 901 + i);
    }
    return Array.from({ length: 8 }, (_, i) => 911 + i);
  }

  /* ======================
     UI
  ====================== */
  // ⭐ 디테일 카드에 표시할 타워 (단 하나)
  const detailTower = selectedPlacedTower ?? buildTower;

  // ⭐ 버튼 표시 여부 (설치된 타워일 때만)
  const showButtons = !!selectedPlacedTower;

  function canStartMission(missionId) {
    // 901~908 → 2티어 해금 이후
    if (missionId >= 901 && missionId <= 908) {
      return unlockedTier2;
    }

    // 911~918 → 대응되는 901~908 클리어
    if (missionId >= 911 && missionId <= 918) {
      const prereq = missionId - 10;
      return clearedMissionsRef.current.has(prereq);
    }

    return false;
  }

  function handleSell() {
    if (!selectedTower) return;

    const ok = window.confirm("정말로 이 타워를 철거하시겠습니까?");
    if (!ok) return;

    towerSystem.sellTower(selectedTower.id);
    setSelectedTower(null);
  }

  // ⭐ BIT UI 플로팅 이펙트 생성
  function spawnBitPopup(value) {
    const id = Date.now() + Math.random();

    setBitPopups((prev) => [...prev, { id, value }]);

    // 애니메이션 끝나면 제거
    setTimeout(() => {
      setBitPopups((prev) => prev.filter((p) => p.id !== id));
    }, 900);
  }

  // ======================
  // ⭐ 진화 UI 상태 계산 (단일 진입점)
  // ======================
  const evolveState = (() => {
    if (!detailTower) {
      return { canEvolve: false, reason: null, cost: null, nextTier: null };
    }

    const currentTier = detailTower.tier;
    const nextTier = currentTier + 1;

    const nextMeta = myTowers.find(
      (t) =>
        t.tier === nextTier &&
        Math.floor(t.towerIdx / 100) === Math.floor(detailTower.towerIdx / 100)
    );

    if (!nextMeta) {
      return {
        canEvolve: false,
        reason: "LOCK_MAX",
        cost: null,
        nextTier: null,
      };
    }

    // 🔐 조건 체크
    let conditionOK = true;
    const towerGroup = Math.floor(detailTower.towerIdx / 100);

    if (nextTier === 2) conditionOK = unlockedTier2;
    if (nextTier === 3)
      conditionOK = clearedMissionsRef.current.has(900 + towerGroup);

    if (nextTier === 4)
      conditionOK = clearedMissionsRef.current.has(910 + towerGroup);

    if (!conditionOK) {
      return {
        canEvolve: false,
        reason: "LOCK_CONDITION",
        cost: nextMeta.baseBuildCost,
        nextTier,
      };
    }

    if (bit < nextMeta.baseBuildCost) {
      return {
        canEvolve: false,
        reason: "LOCK_BIT",
        cost: nextMeta.baseBuildCost,
        nextTier,
      };
    }

    return {
      canEvolve: true,
      reason: null,
      cost: nextMeta.baseBuildCost,
      nextTier,
    };
  })();

  function startMission(missionId) {
    if (activeMission !== null) return;

    if (!canStartMission(missionId)) return;

    const mission = missionMap[missionId];
    if (!mission) return;

    // ⭐ 100초 → ms
    missionRemainMsRef.current = 100_000;
    setMissionTimer(100);

    // ⭐ 미션 보스 스폰 (웨이브와 독립)
    monsterSystem.spawn(mission.spawn_monster.idx, {
      isMissionBoss: true, // ⭐ 미션 전용 보스

      missionId,
    });

    setActiveMission(missionId);
  }

  return (
    <div className="game-container">
      <canvas ref={canvasRef} width={1536} height={900} />

      {/* 🔥 UI 전용 레이어 */}
      <div className="ui-layer">
        {missionTimer !== null && (
          <div className="mission-timer mission">
            ⏱ 미션 제한 시간 : {missionTimer}s
          </div>
        )}
        {/* 좌측 상단 컨트롤 */}
        <div className="hud-left">
          <button onClick={togglePause}>
            {paused ? "▶ 재생" : "⏸ 일시정지"}
          </button>

          <button onClick={exitGame}>⏹ 종료</button>
        </div>

        {/* 우측 상단 HUD */}
        <div className="hud">
          <div className="hud-section">
            <div className="bit-ui">
              <span className="bit-value">BIT: {bit}</span>

              {/* ⭐ BIT 플로팅 이펙트 */}
              <div className="bit-popup-layer">
                {bitPopups.map((p, idx) => (
                  <div
                    key={p.id}
                    className="bit-popup"
                    style={{ top: `${idx * 18}px` }}
                  >
                    <span className="bit-arrow">▲</span>+{p.value}
                  </div>
                ))}
              </div>
            </div>

            <div>SCORE: {score}</div>
            <div>
              몬스터 {monsterSystem.monstersRef.current.length} / {MAX_MONSTERS}
            </div>
          </div>

          {waveInfo && (
            <div className="hud-section wave-info">
              <div className="wave-title">🌊 WAVE {waveInfo.wave}</div>
              <div className="wave-timer">
                {waveInfo.phase === "WAIT"
                  ? `대기 ${waveInfo.timeLeft}s`
                  : `남은 시간 ${waveInfo.timeLeft}s`}
              </div>
            </div>
          )}

          <div className="hud-section speed-control">
            {[1, 5, 20].map((s) => (
              <button
                key={s}
                onClick={() => (gameSpeedRef.current = s)}
                className={gameSpeedRef.current === s ? "active" : ""}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
        {/* ⭐ 우측 하단 미션 버튼 */}
        <div className="mission-button-wrapper">
          <button
            className="mission-button"
            onClick={() => setMissionOpen((prev) => !prev)}
          >
            📜 미션
          </button>
        </div>
        {missionOpen && (
          <div className="mission-panel">
            <div className="mission-header">
              <span>미션 목록</span>
              <button onClick={() => setMissionOpen(false)}>✖</button>
            </div>

            <div className="mission-list">
              {getMissionIds(missionPage).map((missionId) => {
                const cleared = clearedMissionsRef.current.has(missionId);
                const canStart =
                  canStartMission(missionId) &&
                  !cleared &&
                  activeMission === null;

                return (
                  <button
                    key={missionId}
                    className={`mission-item
              ${cleared ? "cleared" : ""}
              ${!canStart ? "locked" : ""}
            `}
                    disabled={!canStart}
                    onClick={() => startMission(missionId)}
                  >
                    <span className="mission-name">
                      {missionMap[missionId]?.mission_name ??
                        `미션 ${missionId}`}
                    </span>
                    {cleared && <span className="tag clear">CLEAR</span>}
                    {!canStart && !cleared && (
                      <span className="tag lock">LOCK</span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mission-footer">
              <button
                onClick={() => setMissionPage(1)}
                className={missionPage === 1 ? "active" : ""}
              >
                1
              </button>
              <button
                onClick={() => setMissionPage(2)}
                className={missionPage === 2 ? "active" : ""}
              >
                2
              </button>
            </div>
          </div>
        )}
        {/* 🔽 설치된 타워 디테일 카드 (버튼 있음) */}
        {detailTower && (
          <TowerDetailCard
            tower={detailTower}
            showButtons={!!selectedPlacedTower}
            evolveState={evolveState}
            onEvolve={() => {
              if (!evolveState.canEvolve) return;
              towerSystem.evolveTower(
                selectedPlacedTower.id,
                evolveState.nextTier
              );
            }}
            onSell={() => {
              if (!selectedPlacedTower) return;

              const ok = window.confirm("정말로 이 타워를 철거하시겠습니까?");
              if (!ok) return;

              // ⭐ 환불값 받기
              const refund = towerSystem.sellTower(selectedPlacedTower.id);

              // ⭐ BIT 팝업 생성
              if (refund && refund > 0) {
                spawnBitPopup(refund);
              }

              setSelectedPlacedTower(null);
            }}
          />
        )}

        {/* 🔽 하단 패널용 타워 디테일 카드 */}
        {buildTower && <TowerDetailCard tower={buildTower} mode="preview" />}

        <TowerCardPanel
          towers={myTowers}
          buildTower={buildTower}
          setBuildTower={setBuildTower}
          setSelectedPlacedTower={setSelectedPlacedTower}
        />
      </div>
      <ResultOverlay
        result={gameResult}
        onRetry={restartStage}
        //onNext={goNextStage}
        score={score}
        reward={reward}
        onExit={() => navigate("/lobby")}
      />
    </div>
  );
}
