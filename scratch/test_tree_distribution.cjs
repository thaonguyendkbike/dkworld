const CONFIG_FOREST = {
  roundTreeCount: 3200,
  pineTreeCount: 2200,
  autumnTreeCount: 550,
  bushCount: 1400,
  rockCount: 350,
  flowerCount: 1600,
  grassTuftCount: 1200,
};

function forestNoise2D(x, z) {
  const s1 = Math.sin(x * 0.032 + Math.cos(z * 0.032) * 1.9);
  const s2 = Math.sin(x * 0.075 - z * 0.082);
  const s3 = Math.cos(x * 0.15 + z * 0.13);
  return (s1 * 0.5 + s2 * 0.3 + s3 * 0.2 + 1.0) * 0.5;
}

function isForestExcludedZone(x, z) {
  if (x > 10 && x < 84 && z > -70 && z < 2) return true;
  if (x > -96 && x < -12 && z > -80 && z < 2) return true;
  if (Math.hypot(x - (-108), z - (-88)) < 16.0) return true;
  if (Math.hypot(x - (-132), z - (-76)) < 21.5) return true;
  if (Math.hypot(x - (-148), z - (-38)) < 26.0) return true;
  if (x >= -138 && x <= -108 && z >= -72 && z <= -52) return true;
  if (x >= -162 && x <= -132 && z >= -46 && z <= -20) return true;
  if (x >= -8.0 && x <= 14.5 && z >= -31.5 && z <= -19.5) return true;
  if (x > -14.5 && x < -5.5 && z > -96 && z < 25) return true;
  if (x > 86 && x < 94 && z > -105 && z < 65) return true;
  if (Math.hypot(x - 108, z - (-45)) < 15.5) return true;
  return false;
}

function getTerrainElevation(x, z) {
  let maxY = 0.1;
  const hillsData = [
    { x: 55, z: -108, radius: 54, apex: 28, base: -2 },
    { x: 110, z: -75, radius: 42, apex: 24, base: -2 },
    { x: 115, z: -25, radius: 38, apex: 18, base: -2 },
    { x: 45, z: -85, radius: 40, apex: 20, base: -2 },
    { x: -145, z: -155, radius: 48, apex: 30, base: -2 },
    { x: 80, z: -160, radius: 48, apex: 30, base: -2 },
    { x: -60, z: -160, radius: 52, apex: 32, base: -2 },
  ];
  for (let i = 0; i < hillsData.length; i++) {
    const h = hillsData[i];
    const dist = Math.hypot(x - h.x, z - h.z);
    if (dist < h.radius) {
      const hillY = h.base + (h.apex - h.base) * (1 - dist / h.radius);
      if (hillY > maxY) maxY = hillY;
    }
  }
  return Math.max(0.1, maxY);
}

const minX = -172, maxX = 122, stepX = 2.7;
const minZ = -196, maxZ = 96, stepZ = 2.7;

let rIdx = 0, pIdx = 0, aIdx = 0;
let zExhausted = null;

for (let gz = minZ; gz <= maxZ; gz += stepZ) {
  for (let gx = minX; gx <= maxX; gx += stepX) {
    const x = gx;
    const z = gz;
    if (isForestExcludedZone(x, z)) continue;
    const elevation = getTerrainElevation(x, z);
    const nVal = forestNoise2D(x, z);
    if (elevation < 3.5 && nVal < 0.28) continue;
    const isHighRidge = elevation > 9.5;
    const isNearRiver = Math.abs(x - 90) < 17;

    if (isHighRidge || (nVal > 0.68 && !isNearRiver)) {
      if (pIdx < CONFIG_FOREST.pineTreeCount && Math.random() < 0.75) {
        pIdx++;
      } else if (aIdx < CONFIG_FOREST.autumnTreeCount && Math.random() < 0.5) {
        aIdx++;
      }
    } else {
      if (rIdx < CONFIG_FOREST.roundTreeCount) {
        rIdx++;
        if (rIdx === CONFIG_FOREST.roundTreeCount) {
          zExhausted = gz;
        }
      }
    }
  }
}

console.log({
  rIdx,
  maxRound: CONFIG_FOREST.roundTreeCount,
  pIdx,
  maxPine: CONFIG_FOREST.pineTreeCount,
  aIdx,
  zExhausted
});
