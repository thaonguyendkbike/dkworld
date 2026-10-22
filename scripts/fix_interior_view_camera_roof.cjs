const fs = require('fs');
const path = require('path');

const mainJsPath = path.join(__dirname, '../src/main.js');
let raw = fs.readFileSync(mainJsPath, 'utf8');
const isCrlf = raw.includes('\r\n');
let code = raw.replace(/\r\n/g, '\n');

console.log('Original code length:', code.length, 'isCrlf:', isCrlf);

// 1. Update buildNhaB: initialize nhaBRoofGroup early and add upperFront, front windows, signSouth to it
const targetBuildNhaBStart = `function buildNhaB() {
  const cfg = CONFIG.BUILDINGS.nhaB;
  const group = new THREE.Group();
  group.position.set(cfg.position.x, 0, cfg.position.z);
  group.userData = { id: 'nhaB', config: cfg };

  const wallMat = new THREE.MeshStandardMaterial({ color: cfg.wallColor, roughness: 0.65, metalness: 0.2 });
  const baseMat = new THREE.MeshStandardMaterial({ color: cfg.baseWallColor, roughness: 0.7 });`;

const replacementBuildNhaBStart = `function buildNhaB() {
  const cfg = CONFIG.BUILDINGS.nhaB;
  const group = new THREE.Group();
  group.position.set(cfg.position.x, 0, cfg.position.z);
  group.userData = { id: 'nhaB', config: cfg };

  // Nhóm toàn bộ Mái và Mặt tiền trên Nhà B (sẽ tự động ẩn khi xem Bên trong Xưởng B)
  const nhaBRoofGroup = new THREE.Group();
  nhaBRoofGroup.name = 'nhaBRoofGroup';
  nhaBRoofGroup.userData = { noBatch: true, dynamic: true };
  nhaBRoofGroupGlobal = nhaBRoofGroup;

  const wallMat = new THREE.MeshStandardMaterial({ color: cfg.wallColor, roughness: 0.65, metalness: 0.2 });
  const baseMat = new THREE.MeshStandardMaterial({ color: cfg.baseWallColor, roughness: 0.7 });`;

if (!code.includes(targetBuildNhaBStart)) {
  console.error('Failed to find targetBuildNhaBStart');
  process.exit(1);
}
code = code.replace(targetBuildNhaBStart, replacementBuildNhaBStart);

// 2. Add upperFront to nhaBRoofGroup instead of group
const targetUpperFront = `  const upperFrontH = cfg.height - 4.2;
  const upperFront = new THREE.Mesh(new THREE.BoxGeometry(cfg.width, upperFrontH, 0.4), wallMat);
  upperFront.position.set(0, 4.2 + upperFrontH / 2, frontZ);
  upperFront.castShadow = true;
  upperFront.receiveShadow = true;
  group.add(upperFront);`;

const replacementUpperFront = `  const upperFrontH = cfg.height - 4.2;
  const upperFront = new THREE.Mesh(new THREE.BoxGeometry(cfg.width, upperFrontH, 0.4), wallMat);
  upperFront.position.set(0, 4.2 + upperFrontH / 2, frontZ);
  upperFront.castShadow = true;
  upperFront.receiveShadow = true;
  nhaBRoofGroup.add(upperFront);`;

if (!code.includes(targetUpperFront)) {
  console.error('Failed to find targetUpperFront');
  process.exit(1);
}
code = code.replace(targetUpperFront, replacementUpperFront);

// 3. Remove duplicate nhaBRoofGroup creation in section 3
const targetRoofGroupInit = `  // 3. TOÀN BỘ HỆ THỐNG MÁI NGOẠI THẤT (ĐƯỢC GOM NHÓM ĐỂ CÓ THỂ ẨN KHI XEM NỘI THẤT)
  const nhaBRoofGroup = new THREE.Group();
  nhaBRoofGroup.name = 'nhaBRoofGroup';
  nhaBRoofGroupGlobal = nhaBRoofGroup;`;

const replacementRoofGroupInit = `  // 3. TOÀN BỘ HỆ THỐNG MÁI NGOẠI THẤT (ĐƯỢC GOM VÀO nhaBRoofGroup)`;

if (!code.includes(targetRoofGroupInit)) {
  console.error('Failed to find targetRoofGroupInit');
  process.exit(1);
}
code = code.replace(targetRoofGroupInit, replacementRoofGroupInit);

// 4. Attach upper front windows of story > 1 to nhaBRoofGroup
const targetWinStrip = `    if (story > 1) {
      createWindowStripWithMullions(group, 0, winY, cfg.depth / 2 + 0.05, cfg.width - 4, winHeight, 0, 2.2, windowMat);
    }`;

const replacementWinStrip = `    if (story > 1) {
      createWindowStripWithMullions(nhaBRoofGroup, 0, winY, cfg.depth / 2 + 0.05, cfg.width - 4, winHeight, 0, 2.2, windowMat);
    }`;

if (!code.includes(targetWinStrip)) {
  console.error('Failed to find targetWinStrip');
  process.exit(1);
}
code = code.replace(targetWinStrip, replacementWinStrip);

// 5. Attach signSouth to nhaBRoofGroupGlobal in createBuildingLogo
const targetSignSouth = `  signSouth.add(faceSouth);

  group.add(signSouth);`;

const replacementSignSouth = `  signSouth.add(faceSouth);

  if (nhaBRoofGroupGlobal) {
    nhaBRoofGroupGlobal.add(signSouth);
  } else {
    group.add(signSouth);
  }`;

if (!code.includes(targetSignSouth)) {
  console.error('Failed to find targetSignSouth');
  process.exit(1);
}
code = code.replace(targetSignSouth, replacementSignSouth);

// 6. In setCameraPreset: update isInside check
const targetPresetCheck = `  // Tự động mở mái xưởng B khi xem góc nhìn nội thất bên trong, khôi phục mái khi xem toàn cảnh
  if (nhaBRoofGroupGlobal) {
    nhaBRoofGroupGlobal.visible = (key !== 'insideNhaB');
  }`;

const replacementPresetCheck = `  // Tự động mở mái và mặt tiền xưởng B khi xem góc nhìn nội thất bên trong, khôi phục khi xem toàn cảnh
  const isInside = (key === 'insideNhaB' || key.startsWith('inside'));
  if (nhaBRoofGroupGlobal) {
    nhaBRoofGroupGlobal.visible = !isInside;
  }`;

if (!code.includes(targetPresetCheck)) {
  console.error('Failed to find targetPresetCheck');
  process.exit(1);
}
code = code.replace(targetPresetCheck, replacementPresetCheck);

// 7. In smoothFocusOnPoint: update roof visibility if focusing inside Nha B
const targetSmoothFocus = `function smoothFocusOnPoint(targetPoint, offset = new THREE.Vector3(26, 22, 26)) {
  const startPos = camera.position.clone();
  const startTarget = controls.target.clone();
  const endTarget = targetPoint.clone();
  const endPos = targetPoint.clone().add(offset);`;

const replacementSmoothFocus = `function smoothFocusOnPoint(targetPoint, offset = new THREE.Vector3(26, 22, 26)) {
  // Nếu điểm cần focus nằm trong khuôn viên Xưởng B, tự động mở mái để quan sát
  const isInsideNhaB = (targetPoint.x >= 53.0 && targetPoint.x <= 77.0 && targetPoint.z >= -67.0 && targetPoint.z <= -33.0 && targetPoint.y <= 14.0);
  if (nhaBRoofGroupGlobal) {
    nhaBRoofGroupGlobal.visible = !isInsideNhaB;
  }

  const startPos = camera.position.clone();
  const startTarget = controls.target.clone();
  const endTarget = targetPoint.clone();
  const endPos = targetPoint.clone().add(offset);`;

if (!code.includes(targetSmoothFocus)) {
  console.error('Failed to find targetSmoothFocus');
  process.exit(1);
}
code = code.replace(targetSmoothFocus, replacementSmoothFocus);

// 8. In btn-focus-card: add interior tags support
const targetFocusCard = `    if (tag.includes('train') || title.includes('tàu') || title.includes('cầu')) setCameraPreset('railway');
    else if (tag.includes('station') || title.includes('ga')) setCameraPreset('dkStation');
    else if (tag.includes('animal') || title.includes('cừu')) setCameraPreset('sheepFlock');
    else if (tag.includes('boat') || title.includes('thuyền') || title.includes('sông')) setCameraPreset('river');
    else if (tag.includes('landmark') || title.includes('cối xay')) setCameraPreset('windmill');
    else if (tag.includes('dk1') || tag === 'nhab') setCameraPreset('nhaB');`;

const replacementFocusCard = `    if (tag.includes('train') || title.includes('tàu') || title.includes('cầu')) setCameraPreset('railway');
    else if (tag.includes('station') || title.includes('ga')) setCameraPreset('dkStation');
    else if (tag.includes('animal') || title.includes('cừu')) setCameraPreset('sheepFlock');
    else if (tag.includes('boat') || title.includes('thuyền') || title.includes('sông')) setCameraPreset('river');
    else if (tag.includes('landmark') || title.includes('cối xay')) setCameraPreset('windmill');
    else if (tag.includes('factory') || tag.includes('lift') || tag.includes('warehouse') || tag.includes('staging') || title.includes('dây chuyền') || title.includes('thang tời') || title.includes('linh kiện') || title.includes('tập kết') || title.includes('bên trong')) setCameraPreset('insideNhaB');
    else if (tag.includes('dk1') || tag === 'nhab') setCameraPreset('nhaB');`;

if (!code.includes(targetFocusCard)) {
  console.error('Failed to find targetFocusCard');
  process.exit(1);
}
code = code.replace(targetFocusCard, replacementFocusCard);

// 9. In optimizeScenePerformance simulate: simulate roof toggle
const targetSimulate = `        if (areDoorsOpen !== doorsBefore) toggleShutterDoors();
        setEnvironment(envBefore);`;

const replacementSimulate = `        if (areDoorsOpen !== doorsBefore) toggleShutterDoors();
        if (nhaBRoofGroupGlobal) {
          nhaBRoofGroupGlobal.visible = false;
          checkpoint();
          nhaBRoofGroupGlobal.visible = true;
          checkpoint();
        }
        setEnvironment(envBefore);`;

if (!code.includes(targetSimulate)) {
  console.error('Failed to find targetSimulate');
  process.exit(1);
}
code = code.replace(targetSimulate, replacementSimulate);

if (isCrlf) {
  code = code.replace(/\n/g, '\r\n');
}

fs.writeFileSync(mainJsPath, code, 'utf8');
console.log('Successfully updated main.js! New length:', code.length);
