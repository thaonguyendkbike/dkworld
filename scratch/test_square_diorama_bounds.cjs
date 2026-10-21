// scratch/test_square_diorama_bounds.cjs
const BOUNDS = {
  minX: -175,
  maxX: 125,
  minZ: -200,
  maxZ: 100,
  centerX: -25,
  centerZ: -50,
  sizeX: 300,
  sizeZ: 300,
  bottomY: -26,
  topY: 0,
};

console.log('Square Diorama Specifications:');
console.log(`Size: ${BOUNDS.sizeX}m x ${BOUNDS.sizeZ}m`);
console.log(`X range: [${BOUNDS.minX}, ${BOUNDS.maxX}]`);
console.log(`Z range: [${BOUNDS.minZ}, ${BOUNDS.maxZ}]`);
console.log(`Aspect Ratio: ${BOUNDS.sizeX / BOUNDS.sizeZ} (1.0 = PERFECT SQUARE)`);

// Verify critical campus landmark positions are safely inside:
const landmarks = [
  { name: 'Đồi Gà & Vườn hoa DK2', x: -142, z: -38 },
  { name: 'Đồi Vườn Lan DK2', x: -108, z: -88 },
  { name: 'Ao Cá Đồi Sinh Thái', x: -132, z: -76 },
  { name: 'Nhà Điều Hành DK2', x: -36, z: -32 },
  { name: 'Kho D2.1', x: -50, z: -68 },
  { name: 'Sân xe thành phẩm DK2', x: -78, z: -45 },
  { name: 'Đường ĐT234 Cổng chính', x: -10, z: -25 },
  { name: 'Nhà Văn Phòng A (DK1)', x: 35, z: -22 },
  { name: 'Nhà Xưởng B (DK1)', x: 62, z: -46 },
  { name: 'Đài phun nước DK1', x: 36.6, z: -12 },
  { name: 'Sân bóng chuyền DK1', x: 51, z: -12 },
  { name: 'Đường chạy thử test track', x: 65, z: -50 },
  { name: 'Ga xe lửa DK Station', x: 88, z: -2 },
  { name: 'Cầu vòm đỏ & Đường ray', x: 95, z: -49 },
  { name: 'Sông máng nước DK1', x: 89.5, z: -8 },
  { name: 'Cối xay gió đồi Bắc', x: 55, z: -108 },
  { name: 'Đường đi bộ leo đồi', x: -72, z: -22 },
];

let allInside = true;
landmarks.forEach(lm => {
  const inX = lm.x >= BOUNDS.minX && lm.x <= BOUNDS.maxX;
  const inZ = lm.z >= BOUNDS.minZ && lm.z <= BOUNDS.maxZ;
  if (!inX || !inZ) {
    console.error(`OUT OF BOUNDS: ${lm.name} at (${lm.x}, ${lm.z})`);
    allInside = false;
  } else {
    console.log(`OK: ${lm.name} at (${lm.x}, ${lm.z})`);
  }
});

console.log('All landmarks inside square:', allInside);
