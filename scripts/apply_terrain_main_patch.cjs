// scripts/apply_terrain_main_patch.cjs
const fs = require('fs');
const path = require('path');

const mainPath = path.join(__dirname, '..', 'src', 'main.js');
let code = fs.readFileSync(mainPath, 'utf8');

console.log('Original src/main.js length:', code.length);

// 1. Update waypoints and coordinates for chicken hill (-142, 15.5, -38)
code = code.replace(
  /\{ id: 20, x: -142, y: 18\.2, z: -38, neighbors: \[18\] \}/,
  '{ id: 20, x: -142, y: 15.5, z: -38, neighbors: [18] }'
);

code = code.replace(
  /new THREE\.Vector3\(-148, 18\.5, -34\)/,
  'new THREE.Vector3(-142, 15.5, -34)'
);

code = code.replace(
  /\/\/ Đỉnh đồi phẳng rộng lớn Đồi Gà & Bồ Câu DK2 \(-148, -38\)/,
  '// Đỉnh đồi phẳng rộng lớn Đồi Gà & Bồ Câu DK2 (-142, -38)'
);

code = code.replace(
  /chickenKeeper\.position\.set\(-141, 18\.5, -39\);/,
  'chickenKeeper.position.set(-140, 15.5, -38);'
);

code = code.replace(
  /\{ text: '🌸 Đồi hoa & chim gà', pos: new THREE\.Vector3\(-148, 25\.5, -38\), id: 'doiGaDK2' \}/,
  "{ text: '🌸 Đồi hoa & chim gà', pos: new THREE.Vector3(-142, 19.5, -38), id: 'doiGaDK2' }"
);

// 2. Update getTerrainHeight for the resized chicken hill (radius 46, flat 15, apex 15.5)
const oldGetTerrainHill = `    const hx2 = CONFIG.HILLS.dk2NewHill.position.x; // -148
    const hz2 = CONFIG.HILLS.dk2NewHill.position.z; // -38
    const r2 = CONFIG.HILLS.dk2NewHill.radius;     // 66m (to hơn đồi chính 54m)
    const flatR = CONFIG.HILLS.dk2NewHill.flatRadius || 24; // 24m đỉnh phẳng
    const apex2 = CONFIG.HILLS.dk2NewHill.height || 18.5;   // 18.5m cao độ
    const dist2 = Math.hypot(x - hx2, z - hz2);
    if (dist2 < r2) {
      let y2;
      if (dist2 <= flatR) {
        y2 = apex2; // Đỉnh phẳng hoàn hảo để đi dạo, trồng hoa và nuôi chim gà
      } else {
        const slopeT = (dist2 - flatR) / (r2 - flatR);
        y2 = -0.5 + (apex2 + 0.5) * Math.pow(1.0 - slopeT, 1.15); // Sườn dốc thoai thoải
      }
      if (y2 > maxY) maxY = y2;
    }`;

const newGetTerrainHill = `    const hx2 = CONFIG.HILLS.dk2NewHill.position.x; // -142
    const hz2 = CONFIG.HILLS.dk2NewHill.position.z; // -38
    const r2 = CONFIG.HILLS.dk2NewHill.radius;     // 46m (giảm kích thước vừa vặn xinh xắn)
    const flatR = CONFIG.HILLS.dk2NewHill.flatRadius || 15.0; // 15m đỉnh phẳng
    const apex2 = CONFIG.HILLS.dk2NewHill.height || 15.5;   // 15.5m cao độ
    const dist2 = Math.hypot(x - hx2, z - hz2);
    if (dist2 < r2) {
      let y2;
      if (dist2 <= flatR) {
        y2 = apex2; // Đỉnh phẳng hoàn hảo để đi dạo, ngắm hoa và nuôi chim gà
      } else {
        const slopeT = (dist2 - flatR) / (r2 - flatR);
        y2 = -0.5 + (apex2 + 0.5) * Math.pow(1.0 - slopeT, 1.25); // Sườn dốc thoai thoải tự nhiên
      }
      if (y2 > maxY) maxY = y2;
    }`;

if (code.includes(oldGetTerrainHill)) {
  code = code.replace(oldGetTerrainHill, newGetTerrainHill);
  console.log('2. Updated getTerrainHeight for resized chicken hill.');
} else {
  console.log('Regex replacing getTerrainHeight...');
  code = code.replace(
    /\/\/ 2\. Đồi mới sinh thái[\s\S]*?if \(y2 > maxY\) maxY = y2;\r?\n    \}/,
    newGetTerrainHill
  );
}

// 3. Update setupLighting for Sun-Kissed Toon Look
const oldLightingBlock = `  ambientLight = new THREE.AmbientLight(
    CONFIG.LIGHTING.day.ambientColor,
    CONFIG.LIGHTING.day.ambientIntensity
  );
  scene.add(ambientLight);

  hemiLight = new THREE.HemisphereLight(
    CONFIG.LIGHTING.day.skyColor,
    CONFIG.LIGHTING.day.groundColor,
    0.55
  );
  scene.add(hemiLight);

  dirLight = new THREE.DirectionalLight(
    CONFIG.LIGHTING.day.sunColor,
    CONFIG.LIGHTING.day.sunIntensity
  );
  dirLight.position.set(
    CONFIG.LIGHTING.day.sunPosition.x,
    CONFIG.LIGHTING.day.sunPosition.y,
    CONFIG.LIGHTING.day.sunPosition.z
  );`;

const newLightingBlock = `  // Ánh sáng Nắng Vàng Mật Ong Toon-Shading (Sun-Kissed Golden Warm Look)
  ambientLight = new THREE.AmbientLight(
    CONFIG.LIGHTING.day.ambientColor,
    CONFIG.LIGHTING.day.ambientIntensity // 0.46: tăng độ sâu bóng râm và tương phản
  );
  scene.add(ambientLight);

  hemiLight = new THREE.HemisphereLight(
    CONFIG.LIGHTING.day.skyColor,
    CONFIG.LIGHTING.day.groundColor,
    0.52 // Bầu trời xanh lam mát dịu & cỏ xanh ấm
  );
  scene.add(hemiLight);

  dirLight = new THREE.DirectionalLight(
    CONFIG.LIGHTING.day.sunColor, // 0xffeed4: Nắng vàng mật ong ấm áp rực rỡ
    CONFIG.LIGHTING.day.sunIntensity // 3.35: Bắt sáng lấp lánh trên đa giác
  );
  dirLight.position.set(
    CONFIG.LIGHTING.day.sunPosition.x, // 130
    CONFIG.LIGHTING.day.sunPosition.y, // 72
    CONFIG.LIGHTING.day.sunPosition.z  // 85: Góc nắng thấp đổ bóng dài có chiều sâu
  );`;

if (code.includes(oldLightingBlock)) {
  code = code.replace(oldLightingBlock, newLightingBlock);
  console.log('3. Updated setupLighting in src/main.js.');
}

// 4. Update setEnvironment('day') to match Sun-Kissed values
const oldEnvDayBlock = `    ambientLight.color.set(cfg.ambientColor);
    ambientLight.intensity = cfg.ambientIntensity;
    dirLight.color.set(cfg.sunColor);
    dirLight.intensity = cfg.sunIntensity;
    dirLight.position.set(cfg.sunPosition.x, cfg.sunPosition.y, cfg.sunPosition.z);`;

// It already uses cfg.ambientColor, cfg.sunIntensity, etc., which now reads the updated config! That's perfect.

fs.writeFileSync(mainPath, code, 'utf8');
console.log('Base main.js updates applied.');
