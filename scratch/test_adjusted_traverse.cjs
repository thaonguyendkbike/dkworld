// scratch/test_adjusted_traverse.cjs
const CONFIG = {
  HILLS: {
    dk2: {
      position: { x: -120, y: 0, z: -78 },
      radius: 54,
      height: 23,
    },
    dk2NewHill: {
      position: { x: -142, y: 0, z: -38 },
      radius: 46,
      flatRadius: 15.0,
      height: 15.5,
    }
  }
};

function getDK2HillSurfaceY(x, z) {
  let maxY = 0.05;
  const hx1 = CONFIG.HILLS.dk2.position.x;
  const hz1 = CONFIG.HILLS.dk2.position.z;
  const r1 = CONFIG.HILLS.dk2.radius;
  const dist1 = Math.hypot(x - hx1, z - hz1);
  if (dist1 < r1) {
    const y1 = -2.0 + 25.0 * (1 - dist1 / r1);
    if (y1 > maxY) maxY = y1;
  }
  if (CONFIG.HILLS.dk2NewHill) {
    const hx2 = CONFIG.HILLS.dk2NewHill.position.x;
    const hz2 = CONFIG.HILLS.dk2NewHill.position.z;
    const r2 = CONFIG.HILLS.dk2NewHill.radius;
    const flatR = CONFIG.HILLS.dk2NewHill.flatRadius || 15.0;
    const apex2 = CONFIG.HILLS.dk2NewHill.height || 15.5;
    const dist2 = Math.hypot(x - hx2, z - hz2);
    if (dist2 < r2) {
      let y2;
      if (dist2 <= flatR) {
        y2 = apex2;
      } else {
        const slopeT = (dist2 - flatR) / (r2 - flatR);
        y2 = -0.5 + (apex2 + 0.5) * Math.pow(1.0 - slopeT, 1.25);
      }
      if (y2 > maxY) maxY = y2;
    }
  }
  return maxY;
}

// Adjusted traverse route passing below Ao Ca cylinder (Ao Ca is at -132, -76 with radius 16.5m)
// Front base of cylinder is around z = -60 to -65
const traverseAdjusted = [
  [-108.0, -84.0], // Foot of Vuon Lan
  [-114.0, -75.0], // Descending slightly to terrace path
  [-122.0, -67.0], // Passing right below Ao Ca's terrace cylinder
  [-130.0, -60.0], // Under southwest corner of Ao Ca
  [-136.0, -52.0], // Saddle between Ao Ca and Flower Hill
  [-141.0, -44.0], // Connecting into Flower Hill upper terrace
];

// Flower Hill dual terrace paths
const flowerUpper = [
  [-136.0, -44.0],
  [-142.0, -40.0],
  [-148.0, -37.0],
  [-154.0, -34.0],
  [-160.0, -30.0]
];

const flowerLower = [
  [-133.0, -36.0],
  [-139.0, -32.0],
  [-146.0, -28.0],
  [-152.0, -25.0],
  [-158.0, -23.0]
];

console.log('Traverse Adjusted:');
traverseAdjusted.forEach(([x, z]) => console.log(`(${x}, ${z}) => Y = ${getDK2HillSurfaceY(x, z).toFixed(2)}m`));

console.log('Flower Upper:');
flowerUpper.forEach(([x, z]) => console.log(`(${x}, ${z}) => Y = ${getDK2HillSurfaceY(x, z).toFixed(2)}m`));

console.log('Flower Lower:');
flowerLower.forEach(([x, z]) => console.log(`(${x}, ${z}) => Y = ${getDK2HillSurfaceY(x, z).toFixed(2)}m`));
