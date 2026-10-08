// scripts/apply_block9_logistics.cjs
const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '..', 'src', 'config.js');
const mainPath = path.join(__dirname, '..', 'src', 'main.js');

let configContent = fs.readFileSync(configPath, 'utf8');
let mainContent = fs.readFileSync(mainPath, 'utf8');

// 1. Update src/config.js to add LOGISTICS config
if (!configContent.includes('LOGISTICS: {')) {
  const insertPos = configContent.lastIndexOf('PEOPLE: {');
  if (insertPos !== -1) {
    const logisticsConfig = `  // Cấu hình hoạt cảnh Logistics, Xe nâng & Đội xe tải (Khối 9)
  LOGISTICS: {
    cycleDuration: 48.0, // Tổng thời gian 1 chu kỳ giao nhận & bốc xếp khép kín (giây)
    truckSpeed: 5.8,     // Tốc độ xe tải 5T di chuyển (m/s)
    forkliftSpeed: 2.8,  // Tốc độ di chuyển xe nâng Komatsu (m/s)
    enablePedestrianSafety: true, // Tự động giảm tốc / dừng khi người đi bộ cắt ngang
    dayFrequency: 1.0,   // Tần suất hoạt động ban ngày
    nightFrequency: 0.65,// Giảm nhịp độ ca đêm, giữ xe đỗ bật đèn cảnh báo
    activeTrucks: 1,
    containerPosition: { x: 68, y: 0, z: -15, rotY: 0 },
    smallTruckPosition: { x: -32, y: 0, z: -40, rotY: Math.PI / 2 },
  },

  `;
    configContent = configContent.slice(0, insertPos) + logisticsConfig + configContent.slice(insertPos);
    fs.writeFileSync(configPath, configContent, 'utf8');
    console.log('src/config.js updated successfully with LOGISTICS config.');
  } else {
    console.error('Could not find insertPos in config.js');
  }
} else {
  console.log('LOGISTICS config already present in src/config.js');
}
