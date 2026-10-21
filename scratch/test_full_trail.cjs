// scratch/test_full_trail.cjs
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

const seg1 = [
  [-72.0, -22.0],
  [-77.0, -30.0],
  [-83.0, -40.0],
  [-89.0, -50.0],
  [-95.0, -60.0],
  [-100.0, -70.0],
  [-105.0, -78.0],
  [-108.0, -84.0]
];

const seg2 = [
  [-108.0, -84.0],
  [-116.0, -80.0],
  [-124.0, -74.0],
  [-130.0, -66.0],
  [-135.0, -56.0],
  [-139.0, -46.0]
];

const seg3Upper = [
  [-139.0, -46.0],
  [-144.0, -42.0],
  [-150.0, -38.0],
  [-156.0, -32.0],
  [-158.0, -25.0]
];

const seg3Lower = [
  [-135.0, -40.0],
  [-141.0, -34.0],
  [-148.0, -30.0],
  [-155.0, -24.0],
  [-158.0, -22.0]
];

console.log('--- SEG 1 (Leo dốc lên Vườn Lan) ---');
seg1.forEach(([x, z]) => console.log(`(${x}, ${z}) => Y = ${getDK2HillSurfaceY(x, z).toFixed(2)}m`));

console.log('--- SEG 2 (Vườn Lan -> Ao Cá -> Đồi Hoa) ---');
seg2.forEach(([x, z]) => console.log(`(${x}, ${z}) => Y = ${getDK2HillSurfaceY(x, z).toFixed(2)}m`));

console.log('--- SEG 3 UPPER (Tuyến hoa trên) ---');
seg3Upper.forEach(([x, z]) => console.log(`(${x}, ${z}) => Y = ${getDK2HillSurfaceY(x, z).toFixed(2)}m`));

console.log('--- SEG 3 LOWER (Tuyến hoa dưới) ---');
seg3Lower.forEach(([x, z]) => console.log(`(${x}, ${z}) => Y = ${getDK2HillSurfaceY(x, z).toFixed(2)}m`));
