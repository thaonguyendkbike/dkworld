// scripts/optimize_performance_and_ram.cjs
const fs = require('fs');
const path = require('path');

const mainPath = path.join(__dirname, '..', 'src', 'main.js');
const configPath = path.join(__dirname, '..', 'src', 'config.js');

let mainCode = fs.readFileSync(mainPath, 'utf8');
let configCode = fs.readFileSync(configPath, 'utf8');

// ============================================================================
// 1. OPTIMIZE CONFIG.FOREST COUNTS IN SRC/CONFIG.JS
// ============================================================================
configCode = configCode.replace(/roundTreeCount:\s*\d+,/, 'roundTreeCount: 950,');
configCode = configCode.replace(/pineTreeCount:\s*\d+,/, 'pineTreeCount: 560,');
configCode = configCode.replace(/autumnTreeCount:\s*\d+,/, 'autumnTreeCount: 180,');
configCode = configCode.replace(/bushCount:\s*\d+,/, 'bushCount: 420,');
configCode = configCode.replace(/rockCount:\s*\d+,/, 'rockCount: 160,');
configCode = configCode.replace(/flowerCount:\s*\d+,/, 'flowerCount: 450,');
configCode = configCode.replace(/grassTuftCount:\s*\d+,/, 'grassTuftCount: 380,');

fs.writeFileSync(configPath, configCode, 'utf8');
console.log('1. Optimized FOREST instance counts in src/config.js');

// ============================================================================
// 2. OPTIMIZE SHADOW MAP SIZE & PIXEL RATIO IN SRC/MAIN.JS
// ============================================================================
// Replace 4096 shadow map with 2048 (saves 75% depth texture memory)
mainCode = mainCode.replace(/dirLight\.shadow\.mapSize\.width\s*=\s*4096;/, 'dirLight.shadow.mapSize.width = 2048;');
mainCode = mainCode.replace(/dirLight\.shadow\.mapSize\.height\s*=\s*4096;/, 'dirLight.shadow.mapSize.height = 2048;');

// Replace pixelRatio capped at 2.0 with capped at 1.25 (dramatically lowers framebuffer RAM)
mainCode = mainCode.replace(
  /renderer\.setPixelRatio\(Math\.min\(window\.devicePixelRatio,\s*2\)\);/g,
  'renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));'
);

// Turn off castShadow on low-impact instances
mainCode = mainCode.replace(/flowerInst\.castShadow\s*=\s*true;/, 'flowerInst.castShadow = false;');
mainCode = mainCode.replace(/tuftInst\.castShadow\s*=\s*true;/, 'tuftInst.castShadow = false;');

// ============================================================================
// 3. HOIST VECTOR3 OBJECTS IN UPDATE LOOPS (ELIMINATE GC CHURN)
// ============================================================================
// In updateLabels
const oldUpdateLabels = `function updateLabels() {
  if (!showLabels) {
    labelElements.forEach((l) => (l.el.style.display = 'none'));
    return;
  }

  const tempV = new THREE.Vector3();
  const camPos = camera.position;

  labelElements.forEach((l) => {
    tempV.copy(l.worldPos);
    tempV.project(camera);`;

const newUpdateLabels = `const _tempLabelV = new THREE.Vector3();

function updateLabels() {
  if (!showLabels) {
    labelElements.forEach((l) => (l.el.style.display = 'none'));
    return;
  }

  const camPos = camera.position;

  labelElements.forEach((l) => {
    _tempLabelV.copy(l.worldPos);
    _tempLabelV.project(camera);`;

if (mainCode.includes(oldUpdateLabels)) {
  mainCode = mainCode.replace(oldUpdateLabels, newUpdateLabels);
  // Also replace usage of tempV with _tempLabelV in updateLabels
  const labelFuncStart = mainCode.indexOf('function updateLabels()');
  const labelFuncEnd = mainCode.indexOf('function createSpeechBubble', labelFuncStart);
  if (labelFuncStart !== -1 && labelFuncEnd !== -1) {
    let funcBody = mainCode.slice(labelFuncStart, labelFuncEnd);
    funcBody = funcBody.replace(/tempV\./g, '_tempLabelV.');
    mainCode = mainCode.slice(0, labelFuncStart) + funcBody + mainCode.slice(labelFuncEnd);
  }
  console.log('3. Hoisted Vector3 in updateLabels');
}

// In updateCuteSpeechBubbles
const oldUpdateSpeech = `  const tempWorldPos = new THREE.Vector3();
  const tempV = new THREE.Vector3();

  for (let i = activeSpeechBubbles.length - 1; i >= 0; i--) {`;

const newUpdateSpeech = `  for (let i = activeSpeechBubbles.length - 1; i >= 0; i--) {`;

if (mainCode.includes(oldUpdateSpeech)) {
  mainCode = mainCode.replace(
    'function updateCuteSpeechBubbles(delta) {',
    'const _tempSpeechWorldPos = new THREE.Vector3();\nconst _tempSpeechV = new THREE.Vector3();\n\nfunction updateCuteSpeechBubbles(delta) {'
  );
  mainCode = mainCode.replace(oldUpdateSpeech, newUpdateSpeech);
  // Replace tempWorldPos and tempV with hoisted versions
  const spStart = mainCode.indexOf('function updateCuteSpeechBubbles(');
  const spEnd = mainCode.indexOf('function showInteractiveModal', spStart);
  if (spStart !== -1 && spEnd !== -1) {
    let spBody = mainCode.slice(spStart, spEnd);
    spBody = spBody.replace(/\btempWorldPos\b/g, '_tempSpeechWorldPos');
    spBody = spBody.replace(/\btempV\b/g, '_tempSpeechV');
    mainCode = mainCode.slice(0, spStart) + spBody + mainCode.slice(spEnd);
  }
  console.log('4. Hoisted Vector3 in updateCuteSpeechBubbles');
}

// ============================================================================
// 4. OPTIMIZE FLOWER BEDS AND SLOPE FLOWERS ON DOI GA (REDUCE 1500+ MESHES)
// ============================================================================
// Find createFlowerBed and rim flowers in buildFreeRangeChickens
const flowerBedIdx = mainCode.indexOf('const createFlowerBed = (bx, bz, radius, flowerTypes) => {');
const chickenYardIdx = mainCode.indexOf('// 3. Khu Chăn Thả Đàn Gà Đồi', flowerBedIdx);

if (flowerBedIdx !== -1 && chickenYardIdx !== -1) {
  const oldFlowerSection = mainCode.slice(flowerBedIdx, chickenYardIdx);
  
  // Create shared materials and shared meshes
  const newFlowerSection = `// Shared flower materials pool (tái sử dụng tránh tạo hàng trăm material riêng lẻ)
  const sharedFlowerMatPool = {};
  const getSharedFlowerMat = (hex) => {
    if (!sharedFlowerMatPool[hex]) {
      sharedFlowerMatPool[hex] = new THREE.MeshStandardMaterial({ color: hex, roughness: 0.65, flatShading: true });
    }
    return sharedFlowerMatPool[hex];
  };

  const createFlowerBed = (bx, bz, radius, flowerTypes) => {
    const bed = new THREE.Group();
    bed.position.set(bx, 0, bz);

    const soil = new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius + 0.2, 0.22, 12),
      new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.95 })
    );
    soil.position.y = 0.11;
    soil.receiveShadow = true;
    bed.add(soil);

    // Gộp viền đá cuội vào 1 InstancedMesh nhỏ gọn
    const borderStonesCount = Math.floor(radius * 8);
    const borderStoneGeo = new THREE.DodecahedronGeometry(0.18, 0);
    const borderStoneInst = new THREE.InstancedMesh(borderStoneGeo, darkStoneMat, borderStonesCount);
    borderStoneInst.castShadow = true;
    const dummyStone = new THREE.Object3D();
    for (let bs = 0; bs < borderStonesCount; bs++) {
      const angle = (bs / borderStonesCount) * Math.PI * 2;
      dummyStone.position.set(Math.cos(angle) * (radius + 0.15), 0.12, Math.sin(angle) * (radius + 0.15));
      dummyStone.scale.set(1.0, 0.8, 1.0);
      dummyStone.updateMatrix();
      borderStoneInst.setMatrixAt(bs, dummyStone.matrix);
    }
    bed.add(borderStoneInst);

    // Khóm hoa dùng InstancedMesh tối ưu
    const flowerGeo = new THREE.SphereGeometry(0.14, 4, 3);
    const numFlowers = Math.floor(radius * radius * 8);
    const flowerInst = new THREE.InstancedMesh(flowerGeo, getSharedFlowerMat(flowerTypes[0].color), numFlowers);
    flowerInst.castShadow = false; // Tắt đổ bóng cho hoa nhỏ để tiết kiệm GPU & RAM
    const dummyFl = new THREE.Object3D();
    const colObjFl = new THREE.Color();

    for (let f = 0; f < numFlowers; f++) {
      const r = Math.sqrt(Math.random()) * (radius * 0.88);
      const theta = Math.random() * Math.PI * 2;
      const fx = Math.cos(theta) * r;
      const fz = Math.sin(theta) * r;
      const fType = flowerTypes[f % flowerTypes.length];

      dummyFl.position.set(fx, 0.32, fz);
      dummyFl.scale.set(fType.scale, fType.scale * 0.9, fType.scale);
      dummyFl.updateMatrix();
      flowerInst.setMatrixAt(f, dummyFl.matrix);
      colObjFl.setHex(fType.color);
      flowerInst.setColorAt(f, colObjFl);
    }
    bed.add(flowerInst);
    return bed;
  };

  // 6 BỒN HOA RỰC RỠ TRÊN ĐỈNH ĐỒI (SUMMIT FLOWER GARDENS)
  flowerBedGroup.add(createFlowerBed(2.5, 4.2, 2.4, [{ color: 0xfacc15, scale: 1.3 }, { color: 0xf59e0b, scale: 1.4 }, { color: 0xf97316, scale: 1.2 }]));
  flowerBedGroup.add(createFlowerBed(-2.6, 4.8, 2.3, [{ color: 0xa855f7, scale: 1.4 }, { color: 0x8b5cf6, scale: 1.3 }, { color: 0xc084fc, scale: 1.2 }]));
  flowerBedGroup.add(createFlowerBed(5.2, 2.5, 2.2, [{ color: 0xbe123c, scale: 1.3 }, { color: 0xf43f5e, scale: 1.2 }, { color: 0xffffff, scale: 1.1 }]));
  flowerBedGroup.add(createFlowerBed(-4.2, -4.2, 2.1, [{ color: 0xec4899, scale: 1.2 }, { color: 0xfbbf24, scale: 1.1 }, { color: 0x38bdf8, scale: 1.1 }]));
  flowerBedGroup.add(createFlowerBed(3.8, -4.0, 2.1, [{ color: 0xf472b6, scale: 1.3 }, { color: 0xfb7185, scale: 1.2 }, { color: 0xffe4e6, scale: 1.1 }]));
  flowerBedGroup.add(createFlowerBed(-0.5, 6.2, 2.2, [{ color: 0xf97316, scale: 1.35 }, { color: 0xeab308, scale: 1.25 }, { color: 0xef4444, scale: 1.15 }]));

  // DẢI HOA VIỀN MÉP ĐỒI & SƯỜN DỐC: DÙNG DUY NHẤT 1 INSTANCEDMESH (Tiết kiệm 1000+ Meshes!)
  const rimFlowerGeo = new THREE.SphereGeometry(0.16, 4, 3);
  const rimColors = [0xfacc15, 0xf43f5e, 0x8b5cf6, 0xffffff, 0xf97316, 0x38bdf8, 0xec4899];
  const totalHillFlowers = 420;
  const hillFlowerInst = new THREE.InstancedMesh(rimFlowerGeo, getSharedFlowerMat(0xffffff), totalHillFlowers);
  hillFlowerInst.castShadow = false;
  const dummyHillFl = new THREE.Object3D();
  const hillCol = new THREE.Color();

  for (let idx = 0; idx < totalHillFlowers; idx++) {
    const isRim = idx < 180;
    let fx, fz, fy;
    if (isRim) {
      const angle = (idx / 180) * Math.PI * 2;
      const rad = 13.0 + Math.random() * 2.5;
      fx = Math.cos(angle) * rad;
      fz = Math.sin(angle) * rad;
      fy = 0.2 + Math.random() * 0.15;
    } else {
      const sAngle = Math.random() * Math.PI * 2;
      const sRad = 15.5 + Math.random() * 20.0;
      fx = Math.cos(sAngle) * sRad;
      fz = Math.sin(sAngle) * sRad;
      const slopeT = (sRad - 15.0) / (46.0 - 15.0);
      fy = -0.5 + 16.0 * Math.pow(Math.max(0, 1.0 - slopeT), 1.25) - 15.5 + 0.25;
    }

    dummyHillFl.position.set(fx, fy, fz);
    dummyHillFl.scale.setScalar(0.9 + Math.random() * 0.6);
    dummyHillFl.updateMatrix();
    hillFlowerInst.setMatrixAt(idx, dummyHillFl.matrix);
    hillCol.setHex(rimColors[idx % rimColors.length]);
    hillFlowerInst.setColorAt(idx, hillCol);
  }
  flowerBedGroup.add(hillFlowerInst);
  flockGroup.add(flowerBedGroup);

  `;

  mainCode = mainCode.slice(0, flowerBedIdx) + newFlowerSection + mainCode.slice(chickenYardIdx);
  console.log('5. Converted 1,030 individual flower meshes on Doi Ga into ultra-lightweight InstancedMesh!');
}

fs.writeFileSync(mainPath, mainCode, 'utf8');
console.log('Finished optimizing performance and RAM in src/main.js');
