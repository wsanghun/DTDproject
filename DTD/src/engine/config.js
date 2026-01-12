// ===== 게임 제한 =====
export const MAX_MONSTERS = 80;
export const MAX_TOWERS = 20;

// ===== 타워 크기 =====
export const TOWER_SIZE_BY_TIER = {
  1: 40,
  2: 51,
  3: 62,
  4: 75,
};

// ===== 이펙트 크기 =====
export const IMPACT_SIZE_BY_TIER = {
  1: 32,
  2: 40,
  3: 52,
  4: 68,
};

// ===== 이펙트 프레임 =====
export const EFFECT_FRAME_DURATION = 40;

export const EFFECT_FRAME_CONFIG = {
  H_1: new Set([101, 201, 301, 401, 501, 601, 701, 801, 302, 303, 702, 804]),
  V_2: new Set([402, 503, 604, 703, 802]),
  V_3: new Set([102, 103, 104, 202, 204, 502, 602, 603, 803]),
  V_4: new Set([304]),
  H_2: new Set([704]),
  H_6: new Set([504]),
};

export const EFFECT_SHEET_LAYOUT = {
  504: { cols: 3, rows: 2 },
};

// ===== 미션 =====
export const TIER3_MISSION_MAP = {
  101: 901,
  201: 902,
  301: 903,
  401: 904,
  501: 905,
  601: 906,
  701: 907,
  801: 908,
};

export const TIER4_MISSION_MAP = {
  101: 911,
  201: 912,
  301: 913,
  401: 914,
  501: 915,
  601: 916,
  701: 917,
  801: 918,
};

export function getEffectFrameInfo(towerIdx) {
  if (EFFECT_FRAME_CONFIG.V_4.has(towerIdx)) {
    return { direction: "vertical", frames: 4 };
  }
  if (EFFECT_FRAME_CONFIG.V_3.has(towerIdx)) {
    return { direction: "vertical", frames: 3 };
  }
  if (EFFECT_FRAME_CONFIG.V_2.has(towerIdx)) {
    return { direction: "vertical", frames: 2 };
  }
  if (EFFECT_FRAME_CONFIG.H_6.has(towerIdx)) {
    return { direction: "horizontal", frames: 6 };
  }
  if (EFFECT_FRAME_CONFIG.H_2.has(towerIdx)) {
    return { direction: "horizontal", frames: 2 };
  }

  return { direction: "horizontal", frames: 1 };
}

export const TIER_COLOR = {
  2: "rgba(150,220,255,0.9)",
  3: "rgba(200,150,255,0.9)",
  4: "rgba(255,215,100,0.95)",
};
