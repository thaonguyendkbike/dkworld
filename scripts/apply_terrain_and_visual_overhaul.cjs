// scripts/apply_terrain_and_visual_overhaul.cjs
const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '..', 'src', 'config.js');
const mainPath = path.join(__dirname, '..', 'src', 'main.js');

let configCode = fs.readFileSync(configPath, 'utf8');
let mainCode = fs.readFileSync(mainPath, 'utf8');

// ============================================================================
// 1. UPDATE SRC/CONFIG.JS
// ============================================================================

// A. Update LIGHTING for Sun-Kissed Toon Look
const oldLightingDay = `    day: {
      ambientColor: 0xbae6fd,
      ambientIntensity: 0.58, // Hạ ambient để tăng độ tương phản sáng-tối sắc nét
      sunColor: 0xfff7ed, // Nắng vàng ấm rực rỡ
      sunIntensity: 2.85,
      sunPosition: { x: 125, y: 78, z: 90 }, // Nắng góc thấp đổ bóng dài có chiều sâu
      skyColor: 0x38bdf8,
      groundColor: 0x166534, // Phản xạ xanh lá đậm ấm từ thảm cỏ
      skyGradient: { top: 0x1d4ed8, bottom: 0xcfeafe },
    },`;

const newLightingDay = `    day: {
      ambientColor: 0x93c5fd, // Bầu trời xanh lam mát dịu cho mảng tối, tương phản cao
      ambientIntensity: 0.46, // Hạ ambient để mảng tối sâu và mảng sáng nổi khối sắc nét
      sunColor: 0xffeed4,     // Nắng vàng mật ong ấm áp rực rỡ (Sun-Kissed Golden Warm)
      sunIntensity: 3.35,     // Nắng rực rỡ bắt sáng lấp lánh trên đa giác flat-shading
      sunPosition: { x: 130, y: 72, z: 85 }, // Nắng góc thấp đổ bóng dài có chiều sâu đậm chất Anime
      skyColor: 0x38bdf8,
      groundColor: 0x15803d, // Phản xạ xanh lá đậm ấm từ thảm cỏ
      skyGradient: { top: 0x1d4ed8, bottom: 0xcfeafe },
    },`;

if (configCode.includes(oldLightingDay)) {
  configCode = configCode.replace(oldLightingDay, newLightingDay);
  console.log('1. Updated LIGHTING.day in src/config.js');
}

// B. Update dk2NewHill size in src/config.js
const oldHillConfig = `    // Đồi mới sinh thái (Đồi gà & bồ câu rộng lớn hơn đồi vườn lan, đỉnh phẳng trồng hoa)
    dk2NewHill: {
      position: { x: -148, y: 0, z: -38 },
      radius: 66,     // To hơn đồi vườn lan (radius 54)
      flatRadius: 24, // Đỉnh đồi phẳng rộng lớn để đi dạo, trồng hoa, nuôi gà và bồ câu
      height: 18.5,
      color: 0x22c55e,
    },`;

const newHillConfig = `    // Đồi mới sinh thái (Giảm kích thước vừa vặn xinh xắn, đỉnh phẳng & ngập tràn hoa)
    dk2NewHill: {
      position: { x: -142, y: 0, z: -38 },
      radius: 46,     // Giảm từ 66 xuống 46 để hài hòa với khuôn viên
      flatRadius: 15.0,// Đỉnh đồi phẳng vừa vặn 15m
      height: 15.5,   // Cao độ 15.5m thoai thoải
      color: 0x22c55e,
    },`;

if (configCode.includes(oldHillConfig)) {
  configCode = configCode.replace(oldHillConfig, newHillConfig);
  console.log('2. Updated dk2NewHill in src/config.js');
}

// C. Update camera preset for doiGa
configCode = configCode.replace(
  /doiGa:\s*\{\s*pos:\s*\{\s*x:\s*-120,\s*y:\s*28,\s*z:\s*-18\s*\},\s*target:\s*\{\s*x:\s*-148,\s*y:\s*18\.5,\s*z:\s*-38\s*\}/,
  `doiGa: {\n      pos: { x: -118, y: 24, z: -18 },\n      target: { x: -142, y: 15.5, z: -38 }`
);

fs.writeFileSync(configPath, configCode, 'utf8');
console.log('Saved src/config.js successfully.');
