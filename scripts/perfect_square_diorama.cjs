// scripts/perfect_square_diorama.cjs
const fs = require('fs');
const path = require('path');

const mainPath = path.join(__dirname, '..', 'src', 'main.js');
const configPath = path.join(__dirname, '..', 'src', 'config.js');

let mainCode = fs.readFileSync(mainPath, 'utf8');
let configCode = fs.readFileSync(configPath, 'utf8');

const hadCRLF = mainCode.includes('\r\n');
mainCode = mainCode.replace(/\r\n/g, '\n');
configCode = configCode.replace(/\r\n/g, '\n');

// 1. TĂNG MẠNH SỐ LƯỢNG CÂY THEO ĐÚNG YÊU CẦU CỦA USER
configCode = configCode.replace(/roundTreeCount:\s*\d+,/, 'roundTreeCount: 3200,');
configCode = configCode.replace(/pineTreeCount:\s*\d+,/, 'pineTreeCount: 2200,');
configCode = configCode.replace(/autumnTreeCount:\s*\d+,/, 'autumnTreeCount: 550,');
configCode = configCode.replace(/bushCount:\s*\d+,/, 'bushCount: 1400,');
configCode = configCode.replace(/rockCount:\s*\d+,/, 'rockCount: 350,');
configCode = configCode.replace(/flowerCount:\s*\d+,/, 'flowerCount: 1600,');
configCode = configCode.replace(/grassTuftCount:\s*\d+,/, 'grassTuftCount: 1200,');

fs.writeFileSync(configPath, hadCRLF ? configCode.replace(/\n/g, '\r\n') : configCode, 'utf8');
console.log('1. Updated tree counts in config.js (3200 round trees, 2200 pine trees)!');

// 2. Chỉnh các ngọn đồi phía Đông để nằm hoàn toàn bên trong mép hình vuông (X <= 125)
const oldHillsBlock = `  const interiorHills = [
    { x: 55, y: 14, z: -108, radius: 54, height: 28, color: 0x22c55e, segs: 10 },  // Đồi cối xay gió
    { x: 110, y: 12, z: -75, radius: 42, height: 24, color: 0x16a34a, segs: 9 },   // Đồi Đông thung lũng tàu hỏa
    { x: 115, y: 9, z: -25, radius: 38, height: 18, color: 0x15803d, segs: 9 },    // Đồi Đông Nam
    { x: 45, y: 10, z: -85, radius: 40, height: 20, color: 0x22c55e, segs: 9 },    // Đồi sau Nhà B
    { x: -145, y: 15, z: -155, radius: 48, height: 30, color: 0x15803d, segs: 10 }, // Đồi góc Tây Bắc bên trong hình vuông
    { x: 80, y: 15, z: -160, radius: 48, height: 30, color: 0x166534, segs: 10 },  // Đồi góc Đông Bắc bên trong hình vuông
    { x: -60, y: 16, z: -160, radius: 52, height: 32, color: 0x15803d, segs: 10 }, // Đồi sườn Bắc bên trong hình vuông
  ];`;

const newHillsBlock = `  const interiorHills = [
    { x: 55, y: 14, z: -108, radius: 54, height: 28, color: 0x22c55e, segs: 10 },  // Đồi cối xay gió
    { x: 92, y: 12, z: -75, radius: 32, height: 24, color: 0x16a34a, segs: 9 },    // Đồi Đông thung lũng tàu hỏa (nằm gọn trong X=125)
    { x: 88, y: 9, z: -25, radius: 34, height: 18, color: 0x15803d, segs: 9 },     // Đồi Đông Nam (nằm gọn trong X=125)
    { x: 45, y: 10, z: -85, radius: 40, height: 20, color: 0x22c55e, segs: 9 },     // Đồi sau Nhà B
    { x: -145, y: 15, z: -155, radius: 48, height: 30, color: 0x15803d, segs: 10 }, // Đồi góc Tây Bắc bên trong hình vuông
    { x: 75, y: 15, z: -160, radius: 46, height: 30, color: 0x166534, segs: 10 },  // Đồi góc Đông Bắc bên trong hình vuông
    { x: -60, y: 16, z: -160, radius: 52, height: 32, color: 0x15803d, segs: 10 }, // Đồi sườn Bắc bên trong hình vuông
  ];`;

if (mainCode.includes(oldHillsBlock)) {
  mainCode = mainCode.replace(oldHillsBlock, newHillsBlock);
  console.log('2. Contained all hills strictly inside square bounds!');
}

// 3. Kéo dài đường ĐT234 cắt phẳng ra 2 mép vách Bắc & Nam (Z từ -195 đến +98)
mainCode = mainCode.replace(
  /const dt234 = new THREE\.Mesh\(\s*new THREE\.BoxGeometry\(roadCfg\.width,\s*0\.1,\s*roadCfg\.length\),/,
  'const dt234 = new THREE.Mesh(\n    new THREE.BoxGeometry(roadCfg.width, 0.1, 296),'
);
mainCode = mainCode.replace(
  /dt234\.position\.set\(roadCfg\.positionX,\s*0\.05,\s*-45\);/,
  'dt234.position.set(roadCfg.positionX, 0.05, -50);'
);
mainCode = mainCode.replace(
  /const line = new THREE\.Mesh\(\s*new THREE\.PlaneGeometry\(0\.25,\s*roadCfg\.length\s*-\s*10\),/,
  'const line = new THREE.Mesh(\n    new THREE.PlaneGeometry(0.25, 290),'
);
mainCode = mainCode.replace(
  /line\.position\.set\(roadCfg\.positionX,\s*0\.12,\s*-45\);/,
  'line.position.set(roadCfg.positionX, 0.12, -50);'
);

fs.writeFileSync(mainPath, hadCRLF ? mainCode.replace(/\n/g, '\r\n') : mainCode, 'utf8');
console.log('Finished applying perfect square diorama updates!');
