const fs = require('fs');
const path = require('path');

const mainJsPath = path.join(__dirname, '..', 'src', 'main.js');
const indexHtmlPath = path.join(__dirname, '..', 'index.html');
const configJsPath = path.join(__dirname, '..', 'src', 'config.js');

let mainCode = fs.readFileSync(mainJsPath, 'utf8');
let htmlCode = fs.readFileSync(indexHtmlPath, 'utf8');
let configCode = fs.readFileSync(configJsPath, 'utf8');

console.log('--- Step 1: Update CANAL_WAYPOINTS & getRiverBedDepth in main.js ---');

const canalStart = mainCode.indexOf('const CANAL_WAYPOINTS = [');
const canalEnd = mainCode.indexOf('const canalCurve = new THREE.CatmullRomCurve3(CANAL_WAYPOINTS);');

if (canalStart !== -1 && canalEnd !== -1) {
  const newCanalWaypoints = `const CANAL_WAYPOINTS = [
  new THREE.Vector3(88.0, -0.32, -198),
  new THREE.Vector3(88.0, -0.32, -140),
  new THREE.Vector3(88.0, -0.32, -80),
  new THREE.Vector3(86.0, -0.32, -62),
  new THREE.Vector3(86.5, -0.32, -52),
  new THREE.Vector3(93.5, -0.32, -48), // Cắt ngang uốn lượn dưới Cầu đường sắt đỏ như ảnh mẫu
  new THREE.Vector3(101.5, -0.32, -45),
  new THREE.Vector3(105.0, -0.32, -35),
  new THREE.Vector3(98.0, -0.32, -22),
  new THREE.Vector3(88.5, -0.32, -8),  // Ga DK Station
  new THREE.Vector3(88.5, -0.32, 12),
  new THREE.Vector3(89.5, -0.32, 70),
  new THREE.Vector3(89.5, -0.32, 98),
];
`;
  mainCode = mainCode.slice(0, canalStart) + newCanalWaypoints + mainCode.slice(canalEnd);
  console.log('Replaced CANAL_WAYPOINTS via index slice successfully');
} else {
  console.error('Could not find CANAL_WAYPOINTS boundaries');
}

// Update getRiverBedDepth
const depthStart = mainCode.indexOf('function getRiverBedDepth(x, z) {');
const depthEnd = mainCode.indexOf('function buildVastTerrainAndClouds() {');

if (depthStart !== -1 && depthEnd !== -1) {
  const newRiverDepth = `function getRiverBedDepth(x, z) {
  // Khoảng cách tới đường tim dòng sông máng nước (tính chính xác theo spline uốn lượn)
  const tEst = Math.max(0, Math.min(1, (z - (-198)) / 296));
  let minDist = 9999;
  for (let dt = -0.05; dt <= 0.05; dt += 0.01) {
    const t = Math.max(0, Math.min(1, tEst + dt));
    const pt = canalCurve.getPointAt(t);
    const d = Math.hypot(x - pt.x, z - pt.z);
    if (d < minDist) minDist = d;
  }
  const halfW = 4.8;  // Nửa bề rộng mặt nước ~ 4.8m (mặt nước rộng 9.6m)
  const bankW = 3.6;  // Mái taluy bờ dốc thoai thoải 3.6m
  if (minDist < halfW) {
    return -1.15;
  } else if (minDist < halfW + bankW) {
    const s = (minDist - halfW) / bankW;
    const smoothS = s * s * (3 - 2 * s);
    return -1.15 * (1.0 - smoothS);
  }
  return 0.0;
}

`;
  mainCode = mainCode.slice(0, depthStart) + newRiverDepth + mainCode.slice(depthEnd);
  console.log('Replaced getRiverBedDepth via index slice successfully');
}

console.log('--- Step 2: Overhaul Red Railway Bridge to Curved Steel Girder Bridge ---');

const bridgeStart = mainCode.indexOf('C. Cây Cầu vòm đường sắt màu đỏ');
const bridgeEndMarker = 'interactiveObjects.push(deck);';
const bridgeEnd = mainCode.indexOf(bridgeEndMarker, bridgeStart);

if (bridgeStart !== -1 && bridgeEnd !== -1) {
  const actualStart = mainCode.lastIndexOf('// -----------', bridgeStart);
  const actualEnd = bridgeEnd + bridgeEndMarker.length;

  const newCurvedBridgeCode = `// --------------------------------------------------------------------------
  // C. Cây Cầu đường sắt màu đỏ uốn cong vượt sông (Curved Red Steel Railway Bridge - Chuẩn 100% Ảnh Mẫu)
  // Thiết kế dạng cầu dầm thép đỏ uốn cong theo đúng tim ray railwayCurve, không có khung vòm che tầm nhìn
  // Nhìn từ trên cao xuống thấy rõ ray thép, tà vẹt gỗ, thành cầu đỏ, bóng cầu in trên làn nước biếc và hoa sen
  // --------------------------------------------------------------------------
  const bridgeGroup = new THREE.Group();

  const redSteelMat = new THREE.MeshStandardMaterial({
    color: 0xdc2626, // Màu đỏ son rực rỡ tươi tắn như ảnh mẫu (Vermilion Red)
    roughness: 0.32,
    metalness: 0.52,
  });

  const redSteelDarkMat = new THREE.MeshStandardMaterial({
    color: 0xb91c1c, // Đỏ đậm tạo chiều sâu mặt dưới & dầm giằng
    roughness: 0.45,
    metalness: 0.45,
  });

  const pierMat = new THREE.MeshStandardMaterial({
    color: 0x64748b, // Mố cầu đá xám xanh tự nhiên
    roughness: 0.92,
    flatShading: true,
  });

  // Tham số khoảng lấy mẫu cầu trên tuyến đường sắt (Z từ ~ -61 đến ~ -33)
  const bridgeTStart = 0.315;
  const bridgeTEnd = 0.465;
  const bridgeSlices = 36;
  const bridgeWidth = 4.5; // Khổ rộng mặt cầu 4.5m (hành lang thông thoáng cho tàu 2.5m)
  const girderHeight = 0.95; // Chiều cao thành cầu dầm thép đỏ 0.95m (không che khuất top-down view)

  const deckPositions = [];
  const deckNormals = [];
  const deckIndices = [];

  const shadowPositions = [];
  const shadowIndices = [];

  for (let s = 0; s <= bridgeSlices; s++) {
    const t = bridgeTStart + (s / bridgeSlices) * (bridgeTEnd - bridgeTStart);
    const pt = railwayCurve.getPointAt(t);
    const tan = railwayCurve.getTangentAt(t);
    const norm = new THREE.Vector3(-tan.z, 0, tan.x).normalize();

    const halfW = bridgeWidth / 2;
    const pLeft = pt.clone().add(norm.clone().multiplyScalar(-halfW));
    const pRight = pt.clone().add(norm.clone().multiplyScalar(halfW));

    // Mặt sàn dầm cầu đặt ngay dưới tà vẹt (pt.y - 0.08)
    const deckY = pt.y - 0.08;
    pLeft.y = deckY;
    pRight.y = deckY;

    deckPositions.push(pLeft.x, deckY, pLeft.z);
    deckPositions.push(pRight.x, deckY, pRight.z);
    deckNormals.push(0, 1, 0);
    deckNormals.push(0, 1, 0);

    // Vệt bóng đổ uốn cong nhẹ nhàng trên mặt nước (-0.30m)
    const shadowW = halfW + 0.5;
    const sLeft = pt.clone().add(norm.clone().multiplyScalar(-shadowW));
    const sRight = pt.clone().add(norm.clone().multiplyScalar(shadowW));
    shadowPositions.push(sLeft.x, -0.30, sLeft.z);
    shadowPositions.push(sRight.x, -0.30, sRight.z);

    if (s < bridgeSlices) {
      const idx = s * 2;
      deckIndices.push(idx, idx + 1, idx + 2);
      deckIndices.push(idx + 1, idx + 3, idx + 2);

      shadowIndices.push(idx, idx + 1, idx + 2);
      shadowIndices.push(idx + 1, idx + 3, idx + 2);
    }
  }

  // 1. Bản mặt sàn dầm cầu đỏ uốn cong
  const curvedDeckGeo = new THREE.BufferGeometry();
  curvedDeckGeo.setAttribute('position', new THREE.Float32BufferAttribute(deckPositions, 3));
  curvedDeckGeo.setAttribute('normal', new THREE.Float32BufferAttribute(deckNormals, 3));
  curvedDeckGeo.setIndex(deckIndices);
  curvedDeckGeo.computeVertexNormals();

  const curvedDeckMesh = new THREE.Mesh(curvedDeckGeo, redSteelMat);
  curvedDeckMesh.castShadow = true;
  curvedDeckMesh.receiveShadow = true;
  bridgeGroup.add(curvedDeckMesh);

  // Mặt dưới dầm cầu dày 0.35m tạo khối hộp kiên cố
  const bottomDeckMesh = curvedDeckMesh.clone();
  bottomDeckMesh.position.y -= 0.35;
  bottomDeckMesh.material = redSteelDarkMat;
  bridgeGroup.add(bottomDeckMesh);

  // 2. Hai thành dầm thép đỏ uốn cong (Left & Right Girder Walls) + Lan can an toàn
  for (let s = 0; s < bridgeSlices; s++) {
    const tA = bridgeTStart + (s / bridgeSlices) * (bridgeTEnd - bridgeTStart);
    const tB = bridgeTStart + ((s + 1) / bridgeSlices) * (bridgeTEnd - bridgeTStart);
    const ptA = railwayCurve.getPointAt(tA);
    const ptB = railwayCurve.getPointAt(tB);
    const tanA = railwayCurve.getTangentAt(tA);
    const tanB = railwayCurve.getTangentAt(tB);
    const normA = new THREE.Vector3(-tanA.z, 0, tanA.x).normalize();
    const normB = new THREE.Vector3(-tanB.z, 0, tanB.x).normalize();

    const halfW = bridgeWidth / 2;

    [-1, 1].forEach((side) => {
      const p1 = ptA.clone().add(normA.clone().multiplyScalar(side * halfW));
      const p2 = ptB.clone().add(normB.clone().multiplyScalar(side * halfW));
      p1.y = ptA.y - 0.25;
      p2.y = ptB.y - 0.25;

      const midPt = p1.clone().add(p2).multiplyScalar(0.5);
      const segLen = p1.distanceTo(p2);
      const segAngY = Math.atan2(p2.x - p1.x, p2.z - p1.z);

      // Tấm thành dầm thép đỏ dọc
      const girderPlate = new THREE.Mesh(
        new THREE.BoxGeometry(0.24, girderHeight, segLen + 0.04),
        redSteelMat
      );
      girderPlate.position.set(midPt.x, midPt.y + girderHeight / 2, midPt.z);
      girderPlate.rotation.y = segAngY;
      girderPlate.castShadow = true;
      girderPlate.receiveShadow = true;
      bridgeGroup.add(girderPlate);

      // Tay vịn lan can bo tròn trên đỉnh dầm
      const handRail = new THREE.Mesh(
        new THREE.CylinderGeometry(0.065, 0.065, segLen + 0.04, 6),
        redSteelMat
      );
      handRail.position.set(midPt.x, midPt.y + girderHeight + 0.04, midPt.z);
      handRail.rotation.x = Math.PI / 2;
      handRail.rotation.y = segAngY;
      handRail.castShadow = true;
      bridgeGroup.add(handRail);

      // Trụ sườn tăng cứng dầm thép đứng (Stiffener Ribs)
      if (s % 2 === 0) {
        const stiffener = new THREE.Mesh(
          new THREE.BoxGeometry(0.36, girderHeight + 0.08, 0.16),
          redSteelMat
        );
        stiffener.position.set(p1.x, p1.y + girderHeight / 2, p1.z);
        stiffener.rotation.y = segAngY;
        stiffener.castShadow = true;
        bridgeGroup.add(stiffener);
      }
    });
  }

  // 3. Mố cầu đá kiên cố 2 đầu cầu cắm vào bờ sông
  [bridgeTStart, bridgeTEnd].forEach((endT) => {
    const endPt = railwayCurve.getPointAt(endT);
    const endTan = railwayCurve.getTangentAt(endT);
    const endAngY = Math.atan2(endTan.x, endTan.z);

    const abutment = new THREE.Mesh(
      new THREE.BoxGeometry(bridgeWidth + 1.2, 3.8, 3.2),
      pierMat
    );
    abutment.position.set(endPt.x, endPt.y - 1.8, endPt.z);
    abutment.rotation.y = endAngY;
    abutment.castShadow = true;
    abutment.receiveShadow = true;
    bridgeGroup.add(abutment);
  });

  // 4. Trụ cầu giữa lòng sông nâng đỡ nhịp cầu chính (Z = -48)
  const midBridgeT = 0.385;
  const midBridgePt = railwayCurve.getPointAt(midBridgeT);
  const midBridgeTan = railwayCurve.getTangentAt(midBridgeT);
  const midPier = new THREE.Mesh(
    new THREE.BoxGeometry(bridgeWidth + 0.6, 3.2, 2.2),
    pierMat
  );
  midPier.position.set(midBridgePt.x, -0.6, midBridgePt.z);
  midPier.rotation.y = Math.atan2(midBridgeTan.x, midBridgeTan.z);
  midPier.castShadow = true;
  midPier.receiveShadow = true;
  bridgeGroup.add(midPier);

  // 5. Mặt phẳng bóng mờ uốn cong in trên mặt nước (Translucent Bridge Shadow Decal)
  const shadowGeo = new THREE.BufferGeometry();
  shadowGeo.setAttribute('position', new THREE.Float32BufferAttribute(shadowPositions, 3));
  shadowGeo.setIndex(shadowIndices);
  shadowGeo.computeVertexNormals();
  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x032541,
    transparent: true,
    opacity: 0.36,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
  bridgeGroup.add(shadowMesh);

  bridgeGroup.userData = {
    id: 'redArchBridge',
    title: 'Cầu đường sắt đỏ vượt sông (Red Steel Curved Railway Bridge)',
    type: 'bridge',
    desc: 'Cầu đường sắt dầm thép đỏ uốn lượn mềm mại vượt qua dòng sông máng nước trong veo, in bóng mờ lãng mạn xuống thảm hoa súng và đàn cá bơi lội.',
    zone: 'Đường sắt Bắc - Nam',
  };
  curvedDeckMesh.userData = bridgeGroup.userData;
  scene.add(bridgeGroup);
  interactiveObjects.push(curvedDeckMesh);`;

  mainCode = mainCode.slice(0, actualStart) + newCurvedBridgeCode + mainCode.slice(actualEnd);
  console.log('Replaced Bridge section with curved steel bridge successfully');
} else {
  console.error('Could not find bridge start or end:', bridgeStart, bridgeEnd);
}

// Write back main.js
fs.writeFileSync(mainJsPath, mainCode, 'utf8');
console.log('Saved main.js successfully');
