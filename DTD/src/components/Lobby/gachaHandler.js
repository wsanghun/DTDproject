import axios from "axios";

/**
 * @param {{ tier:number, count:number, payType:"CAPSULE"|"GOLD"|"DIAMOND" }} params
 * @returns {{
 *   rewards: Array<{ itemIdx: number, count: number }>,
 *   remainCapsule?: number,
 *   remainGold?: number,
 *   remainDiamond?: number
 * }}
 */
export async function requestGacha(params) {
  try {
    const res = await axios.post("/api/gacha/tower", params);
    return res.data;
  } catch (err) {
    console.error("Gacha error:", err);
    throw err;
  }
}
