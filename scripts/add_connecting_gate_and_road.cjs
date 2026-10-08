// scripts/add_connecting_gate_and_road.cjs
const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '..', 'src', 'config.js');
const mainPath = path.join(__dirname, '..', 'src', 'main.js');

let configCode = fs.readFileSync(configPath, 'utf8');
let mainCode = fs.readFileSync(mainPath, 'utf8');

// 1. Add camera preset in src/config.js
if (!configCode.includes('gateConnect: {')) {
  const insertTarget = 'cameraPresets: {';
  const newPreset = `cameraPresets: {
    gateConnect: {
      pos: { x: -28, y: 22, z: -8 },
      target: { x: 2, y: 2, z: -25.5 },
      name: 'Cổng & Đường kết nối DK1 - DK2',
    },`;
  configCode = configCode.replace(insertTarget, newPreset);
  fs.writeFileSync(configPath, configCode, 'utf8');
  console.log('1. Added gateConnect camera preset to src/config.js.');
}

// 2. Clear trees on the new connecting road path in isForestExcludedZone
const excludeOld = `  // Lòng đường ĐT234 (chỉ trồng cây cảnh 2 bên vỉa hè)
  if (x > -14.5 && x < -5.5 && z > -96 && z < 25) return true;`;

const excludeNew = `  // Tuyến đường & Cổng mới kết nối ĐT234 sang Nhà A (Cổng 1B đối diện Cổng DK2)
  if (x >= -8.0 && x <= 14.5 && z >= -31.0 && z <= -20.0) return true;

  // Lòng đường ĐT234 (chỉ trồng cây cảnh 2 bên vỉa hè)
  if (x > -14.5 && x < -5.5 && z > -96 && z < 25) return true;`;

if (mainCode.includes(excludeOld) && !mainCode.includes('Cổng 1B đối diện Cổng DK2')) {
  mainCode = mainCode.replace(excludeOld, excludeNew);
  console.log('2. Added exclusion zone for new road and gate.');
}

// 3. Clear ĐT234 sidewalk trees in front of the new gate
const treeSidewalkOld = `      // Bỏ cây ở lối vào cổng xưởng DK2 (khu vực gần trạm sạc EV)
      if (rx === -13.8 && z >= -34 && z <= -6) return;`;

const treeSidewalkNew = `      // Bỏ cây ở lối vào cổng xưởng DK2 (khu vực gần trạm sạc EV)
      if (rx === -13.8 && z >= -34 && z <= -6) return;
      // Bỏ cây ở lối vào Cổng kết nối mới bên lề Đông ĐT234
      if (rx === -6.2 && z >= -30 && z <= -21) return;`;

if (mainCode.includes(treeSidewalkOld) && !mainCode.includes('Cổng kết nối mới bên lề Đông')) {
  mainCode = mainCode.replace(treeSidewalkOld, treeSidewalkNew);
  console.log('3. Cleared sidewalk trees in front of new gate.');
}

// 4. Update perimeter security fence to open the gate gap (Z: -21 to -30)
const fenceOld = `  // Hàng rào mạn DK1 (Bên phải ĐT234): Chừa lối cổng chính DK1 (Z: -12 đến -23)
  buildFenceSegment(-6.0, -25.0, -85.0);
  buildFenceSegment(-6.0, -2.0, -10.0);`;

const fenceNew = `  // Hàng rào mạn DK1 (Bên phải ĐT234): Chừa lối Cổng kết nối DK1-DK2 (Z: -21 đến -30)
  buildFenceSegment(-6.0, -30.0, -85.0);
  buildFenceSegment(-6.0, -2.0, -21.0);`;

if (mainCode.includes(fenceOld)) {
  mainCode = mainCode.replace(fenceOld, fenceNew);
  console.log('4. Updated perimeter fence opening for new gate.');
}

fs.writeFileSync(mainPath, mainCode, 'utf8');
console.log('Base changes written to main.js.');
