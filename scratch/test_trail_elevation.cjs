// scratch/test_trail_elevation.cjs
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

  // 1. Đồi chính DK2
  const hx1 = CONFIG.HILLS.dk2.position.x;
  const hz1 = CONFIG.HILLS.dk2.position.z;
  const r1 = CONFIG.HILLS.dk2.radius;
  const dist1 = Math.hypot(x - hx1, z - hz1);
  if (dist1 < r1) {
    const y1 = -2.0 + 25.0 * (1 - dist1 / r1);
    if (y1 > maxY) maxY = y1;
  }

  // 2. Đồi mới sinh thái
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

// Sample test points from parking lot to Vuon Lan
const pts = [
  [-72, -22],
  [-78, -32],
  [-84, -42],
  [-90, -52],
  [-96, -62],
  [-102, -72],
  [-108, -82], // Vuon Lan
  [-118, -78],
  [-126, -72], // Under Ao Ca
  [-132, -64],
  [-136, -54],
  [-140, -46],
  [-142, -40], // Flower hill top
  [-150, -38],
  [-156, -34],
  [-142, -30], // Lower flower trail
  [-152, -26]
];

console.log('Point Elevations:');
pts.forEach(([x, z]) => {
  console.log(`(${x}, ${z}) => Y = ${getDK2HillSurfaceY(x, z).toFixed(2)}m`);
});
