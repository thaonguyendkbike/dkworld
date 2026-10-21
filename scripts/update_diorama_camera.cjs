// scripts/update_diorama_camera.cjs
const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '..', 'src', 'config.js');
let configCode = fs.readFileSync(configPath, 'utf8');

// Update overview camera preset to view the whole floating square diorama from isometric high-angle
configCode = configCode.replace(
  /overview:\s*\{\s*pos:\s*\{\s*x:\s*[\d\.\-]+,\s*y:\s*[\d\.\-]+,\s*z:\s*[\d\.\-]+\s*\},\s*target:\s*\{\s*x:\s*[\d\.\-]+,\s*y:\s*[\d\.\-]+,\s*z:\s*[\d\.\-]+\s*\},/,
  `overview: {
      pos: { x: 80, y: 185, z: 220 },
      target: { x: -25, y: -2, z: -50 },`
);

// Also update initialPosition & initialTarget in CAMERA
configCode = configCode.replace(
  /initialPosition:\s*\{\s*x:\s*[\d\.\-]+,\s*y:\s*[\d\.\-]+,\s*z:\s*[\d\.\-]+\s*\},/,
  'initialPosition: { x: 80, y: 185, z: 220 },'
);
configCode = configCode.replace(
  /initialTarget:\s*\{\s*x:\s*[\d\.\-]+,\s*y:\s*[\d\.\-]+,\s*z:\s*[\d\.\-]+\s*\},/,
  'initialTarget: { x: -25, y: -2, z: -50 },'
);

fs.writeFileSync(configPath, configCode, 'utf8');
console.log('Updated overview camera to isometric high-angle!');
