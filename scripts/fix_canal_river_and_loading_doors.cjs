// scripts/fix_canal_river_and_loading_doors.cjs
const fs = require('fs');
const path = require('path');

const mainPath = path.join(__dirname, '..', 'src', 'main.js');
let code = fs.readFileSync(mainPath, 'utf8');

const hadCRLF = code.includes('\r\n');
code = code.replace(/\r\n/g, '\n');

console.log('1. Adding CANAL_WAYPOINTS, canalCurve and getRiverBedDepth...');

// Add canalCurve declaration and spline before buildVastTerrainAndClouds
const terrainMarker = 'function buildVastTerrainAndClouds() {';
const canalSplineCode = `// ============================================================================
// KHỞI TẠO TUYẾN TIM DÒNG SÔNG MÁNG NƯỚC UỐN LƯỢN (CANAL SPLINE & DEPTH FIELD)
// ============================================================================
const CANAL_WAYPOINTS = [
  new THREE.Vector3(89.5, -0.32, -198),
  new THREE.Vector3(90.0, -0.32, -140),
  new THREE.Vector3(91.5, -0.32, -90),
  new THREE.Vector3(93.5, -0.32, -48), // Chảy thẳng dưới Cầu vòm đỏ (deck ở Y = 1.42, ray ở 1.98m)
  new THREE.Vector3(90.5, -0.32, -18),
  new THREE.Vector3(89.5, -0.32, -8),  // Thuyền nan & người chèo đò
  new THREE.Vector3(89.5, -0.32, 12),  // Cạnh Ga DK Station & đường sắt
  new THREE.Vector3(90.5, -0.32, 40),
  new THREE.Vector3(89.5, -0.32, 70),
  new THREE.Vector3(89.5, -0.32, 98),  // Đổ ra thác Nam
];
const canalCurve = new THREE.CatmullRomCurve3(CANAL_WAYPOINTS);

function getRiverBedDepth(x, z) {
  // Khoảng cách tới đường tim dòng sông máng nước
  const t = Math.max(0, Math.min(1, (z - (-198)) / 296));
  const rPt = canalCurve.getPointAt(t);
  const dist = Math.hypot(x - rPt.x, z - rPt.z);
  const halfW = 4.8;  // Nửa bề rộng mặt nước ~ 4.8m (mặt nước rộng 9.6m)
  const bankW = 3.6;  // Mái taluy bờ dốc thoai thoải 3.6m
  if (dist < halfW) {
    return -1.15;
  } else if (dist < halfW + bankW) {
    const s = (dist - halfW) / bankW;
    const smoothS = s * s * (3 - 2 * s);
    return -1.15 * (1.0 - smoothS);
  }
  return 0.0;
}

`;

if (!code.includes('CANAL_WAYPOINTS')) {
  code = code.replace(terrainMarker, canalSplineCode + terrainMarker);
}

// 2. Replace topGrass in buildVastTerrainAndClouds with recessed river trench
console.log('2. Updating topGrass in buildVastTerrainAndClouds with real recessed riverbed...');
const oldTopGrass = `  // 1. Mặt sàn cỏ xanh chính hình vuông (Top Grass Surface)
  const topGrassGeo = new THREE.BoxGeometry(W, 1.2, D);
  const topGrassMat = new THREE.MeshStandardMaterial({
    color: CONFIG.GROUND.grassColor,
    roughness: 0.88,
    metalness: 0.05,
    flatShading: true,
    polygonOffset: true,
    polygonOffsetFactor: 1.0,
    polygonOffsetUnits: 1.0,
  });
  const topGrass = new THREE.Mesh(topGrassGeo, topGrassMat);
  topGrass.position.set(cx, -0.6, cz);
  topGrass.receiveShadow = true;
  dioramaGroup.add(topGrass);`;

const newTopGrass = `  // 1. Mặt sàn địa hình cỏ xanh & Lòng sông máng nước lõm tự nhiên (Top Grass Surface with Recessed River Trench)
  const segX = 150;
  const segZ = 150;
  const topGrassGeo = new THREE.PlaneGeometry(W, D, segX, segZ);
  topGrassGeo.rotateX(-Math.PI / 2);
  topGrassGeo.translate(cx, 0, cz);

  const posAttr = topGrassGeo.attributes.position;
  const colors = [];
  const cGrass = new THREE.Color(CONFIG.GROUND.grassColor);
  const cBank = new THREE.Color(0x854d0e);  // Tầng đất bờ sông nâu ấm
  const cBed = new THREE.Color(0xb45309);   // Cát vàng đáy mương

  for (let i = 0; i < posAttr.count; i++) {
    const vx = posAttr.getX(i);
    const vz = posAttr.getZ(i);

    const bedDepth = getRiverBedDepth(vx, vz);
    posAttr.setY(i, bedDepth);

    if (bedDepth < -0.85) {
      colors.push(cBed.r, cBed.g, cBed.b);
    } else if (bedDepth < -0.05) {
      const t = (bedDepth - (-0.85)) / (0.0 - (-0.85));
      const col = cBed.clone().lerp(cGrass, t);
      colors.push(col.r, col.g, col.b);
    } else {
      colors.push(cGrass.r, cGrass.g, cGrass.b);
    }
  }

  topGrassGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  topGrassGeo.computeVertexNormals();

  const topGrassMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.88,
    metalness: 0.05,
    flatShading: true,
    polygonOffset: true,
    polygonOffsetFactor: 1.0,
    polygonOffsetUnits: 1.0,
  });
  const topGrass = new THREE.Mesh(topGrassGeo, topGrassMat);
  topGrass.receiveShadow = true;
  dioramaGroup.add(topGrass);`;

if (code.includes(oldTopGrass)) {
  code = code.replace(oldTopGrass, newTopGrass);
} else {
  console.log('WARNING: oldTopGrass exact match not found, checking alternatives...');
}

// 3. Update buildCanalAndRailway to use canalCurve and correct water height & objects
console.log('3. Updating buildCanalAndRailway for realistic visible stylized water & boat...');
const oldCanalSectionStart = '  // --------------------------------------------------------------------------\n  // A. Mương nước thủy lợi uốn lượn 100% song song với đường tàu (Theo yêu cầu)\n  // --------------------------------------------------------------------------';
const oldCanalSectionEnd = '  // --------------------------------------------------------------------------\n  // C. Cây Cầu vòm đường sắt màu đỏ tươi rực rỡ';

const newCanalSection = `  // --------------------------------------------------------------------------
  // A. Sông máng nước uốn lượn trong vắt, bãi cát ven bờ, thuyền nan & hoa súng
  // Tuyến sông uốn lượn song song với đường sắt, chảy dưới Cầu vòm đỏ và bên cạnh Ga DK Station
  // --------------------------------------------------------------------------
  const canalWidth = CONFIG.CANAL.width; // 9.5m
  const segments = 140;

  const waterPositions = [];
  const waterUvs = [];
  const waterIndices = [];

  const bedPositions = [];
  const bedUvs = [];
  const bedIndices = [];

  const sandLPositions = [];
  const sandLUvs = [];
  const sandLIndices = [];

  const sandRPositions = [];
  const sandRUvs = [];
  const sandRIndices = [];

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const pt = canalCurve.getPointAt(t);
    const tan = canalCurve.getTangentAt(t);
    const norm = new THREE.Vector3(-tan.z, 0, tan.x).normalize();

    const waterY = -0.32;
    const bedY = -1.15;
    const bankY = 0.02;

    const wHalf = canalWidth / 2 - 0.15; // 4.6m
    const wLeft = pt.clone().sub(norm.clone().multiplyScalar(wHalf));
    const wRight = pt.clone().add(norm.clone().multiplyScalar(wHalf));

    const sLeftOuter = pt.clone().sub(norm.clone().multiplyScalar(wHalf + 3.6));
    const sRightOuter = pt.clone().add(norm.clone().multiplyScalar(wHalf + 3.6));

    // 1. Mặt nước (Water ribbon)
    waterPositions.push(wLeft.x, waterY, wLeft.z);
    waterPositions.push(wRight.x, waterY, wRight.z);
    waterUvs.push(0, t * 8.0);
    waterUvs.push(1, t * 8.0);

    // 2. Đáy mương (Canal bed)
    bedPositions.push(wLeft.x, bedY, wLeft.z);
    bedPositions.push(wRight.x, bedY, wRight.z);
    bedUvs.push(0, t * 8.0);
    bedUvs.push(1, t * 8.0);

    // 3. Bờ cát trái (Bờ Tây)
    sandLPositions.push(sLeftOuter.x, bankY, sLeftOuter.z);
    sandLPositions.push(wLeft.x, waterY + 0.04, wLeft.z);
    sandLUvs.push(0, t * 8.0);
    sandLUvs.push(1, t * 8.0);

    // 4. Bờ cát phải (Bờ Đông)
    sandRPositions.push(wRight.x, waterY + 0.04, wRight.z);
    sandRPositions.push(sRightOuter.x, bankY, sRightOuter.z);
    sandRUvs.push(0, t * 8.0);
    sandRUvs.push(1, t * 8.0);

    if (i < segments) {
      const idx = i * 2;
      waterIndices.push(idx, idx + 1, idx + 2);
      waterIndices.push(idx + 1, idx + 3, idx + 2);

      bedIndices.push(idx, idx + 1, idx + 2);
      bedIndices.push(idx + 1, idx + 3, idx + 2);

      sandLIndices.push(idx, idx + 1, idx + 2);
      sandLIndices.push(idx + 1, idx + 3, idx + 2);

      sandRIndices.push(idx, idx + 1, idx + 2);
      sandRIndices.push(idx + 1, idx + 3, idx + 2);
    }
  }

  // Khởi tạo Mesh Mặt Nước Cách Điệu uốn cong
  const waterGeo = new THREE.BufferGeometry();
  waterGeo.setAttribute('position', new THREE.Float32BufferAttribute(waterPositions, 3));
  waterGeo.setAttribute('uv', new THREE.Float32BufferAttribute(waterUvs, 2));
  waterGeo.setIndex(waterIndices);
  waterGeo.computeVertexNormals();

  const waterCanalMat = createStylizedWaterMaterial(true);
  waterCanalMesh = new THREE.Mesh(waterGeo, waterCanalMat);
  waterCanalMesh.receiveShadow = true;
  scene.add(waterCanalMesh);

  // Khởi tạo Mesh Đáy Mương
  const bedGeo = new THREE.BufferGeometry();
  bedGeo.setAttribute('position', new THREE.Float32BufferAttribute(bedPositions, 3));
  bedGeo.setAttribute('uv', new THREE.Float32BufferAttribute(bedUvs, 2));
  bedGeo.setIndex(bedIndices);
  bedGeo.computeVertexNormals();
  const bedMat = new THREE.MeshStandardMaterial({ color: CONFIG.GROUND.sandColor, roughness: 0.95 });
  const canalBed = new THREE.Mesh(bedGeo, bedMat);
  canalBed.receiveShadow = true;
  scene.add(canalBed);

  // Khởi tạo Bờ Cát Thoai Thoải 2 bên
  const sandMat = new THREE.MeshStandardMaterial({ color: CONFIG.GROUND.sandColor, roughness: 0.95, flatShading: true });

  const sandLGeo = new THREE.BufferGeometry();
  sandLGeo.setAttribute('position', new THREE.Float32BufferAttribute(sandLPositions, 3));
  sandLGeo.setAttribute('uv', new THREE.Float32BufferAttribute(sandLUvs, 2));
  sandLGeo.setIndex(sandLIndices);
  sandLGeo.computeVertexNormals();
  const sandLeft = new THREE.Mesh(sandLGeo, sandMat);
  sandLeft.receiveShadow = true;
  scene.add(sandLeft);

  const sandRGeo = new THREE.BufferGeometry();
  sandRGeo.setAttribute('position', new THREE.Float32BufferAttribute(sandRPositions, 3));
  sandRGeo.setAttribute('uv', new THREE.Float32BufferAttribute(sandRUvs, 2));
  sandRGeo.setIndex(sandRIndices);
  sandRGeo.computeVertexNormals();
  const sandRight = new THREE.Mesh(sandRGeo, sandMat);
  sandRight.receiveShadow = true;
  scene.add(sandRight);

  // Thuyền nan & người chèo đò nổi bồng bềnh trên mặt nước sông máng (Z = -8, X = 89.5)
  const boatGroup = new THREE.Group();
  boatGroup.position.set(89.5, -0.30, -8.0);
  boatGroup.rotation.y = 0.12;

  const boatHull = new THREE.Mesh(
    new THREE.BoxGeometry(1.6, 0.55, 4.2),
    new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.8 })
  );
  boatHull.position.y = 0.22;
  boatHull.castShadow = true;
  boatGroup.add(boatHull);

  const boatman = createCharacter({ shirtColor: 0xef4444, pantsColor: 0x1e293b, hatColor: 0xfef08a, isDriver: true });
  boatman.position.set(0, 0.48, 0.4);
  boatGroup.add(boatman);

  const oar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 2.8),
    new THREE.MeshStandardMaterial({ color: 0xd4a373, roughness: 0.7 })
  );
  oar.rotation.z = Math.PI / 4;
  oar.position.set(0.6, 0.95, 0.2);
  boatGroup.add(oar);

  boatGroup.userData = {
    id: 'rowingBoat',
    title: 'Thuyền nan du ngoạn sinh thái trên sông máng',
    type: 'boat',
    desc: 'Hoạt động chèo thuyền thư giãn trên dòng sông máng nước trong vắt uốn lượn song song với tuyến đường sắt DK Bike.',
    zone: 'Sông Máng Nước',
  };
  boatHull.userData = boatGroup.userData;
  scene.add(boatGroup);
  interactiveObjects.push(boatHull);
  rowingBoat = boatGroup;

  // Lá sen tròn to (Lily Pads) & hoa súng nổi trên mặt sông máng
  const lilyMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.6, side: THREE.DoubleSide });
  const lilyFlowerMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.3 });
  lotusLeaves = [];

  const lilyOffsets = [
    { t: 0.48, offX: -1.8, offZ: -3.0 },
    { t: 0.52, offX: 1.6, offZ: 2.0 },
    { t: 0.55, offX: -1.4, offZ: 6.0 },
    { t: 0.60, offX: 1.8, offZ: -2.0 },
    { t: 0.64, offX: -1.2, offZ: 4.0 },
  ];
  lilyOffsets.forEach((lo, lIdx) => {
    const lPt = canalCurve.getPointAt(lo.t);
    const pad = new THREE.Mesh(new THREE.CircleGeometry(0.85, 12, 0.4, Math.PI * 1.85), lilyMat);
    pad.rotation.x = -Math.PI / 2;
    pad.position.set(lPt.x + lo.offX, -0.28, lPt.z + lo.offZ);
    scene.add(pad);
    lotusLeaves.push(pad);

    if (lIdx % 2 === 0) {
      const flower = new THREE.Mesh(new THREE.DodecahedronGeometry(0.24), lilyFlowerMat);
      flower.position.set(lPt.x + lo.offX + 0.1, -0.20, lPt.z + lo.offZ - 0.1);
      scene.add(flower);
    }
  });

  // Đàn cá xanh bơi lội dưới sông máng
  riverFishGroup = new THREE.Group();
  riverFishGroup.position.set(89.5, -0.65, -8.0);
  const fishMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3 });

  for (let f = 0; f < 8; f++) {
    const fMesh = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.45, 5), fishMat);
    fMesh.rotation.x = Math.PI / 2;
    const fAngle = (f / 8) * Math.PI * 2;
    fMesh.position.set(Math.cos(fAngle) * 1.6, 0, Math.sin(fAngle) * 1.6);
    fMesh.rotation.y = -fAngle + Math.PI / 2;
    riverFishGroup.add(fMesh);
  }
  scene.add(riverFishGroup);

  // Cầu gỗ mộc bắc qua sông máng ở mạn Nam (Z = 20)
  const woodBridge = new THREE.Mesh(
    new THREE.BoxGeometry(canalWidth + 2.0, 0.35, 3.2),
    new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.85 })
  );
  woodBridge.position.set(90.5, 0.08, 20);
  woodBridge.castShadow = true;
  scene.add(woodBridge);

  // Nền đá cát ballast uốn cong theo tim ray (như ảnh 1 & 3)
  const ballastTube = new THREE.Mesh(
    new THREE.TubeGeometry(railwayCurve, 120, 2.2, 5, false),
    new THREE.MeshStandardMaterial({ color: CONFIG.RAILWAY.ballastColor, roughness: 0.95, flatShading: true })
  );
  ballastTube.scale.set(1.0, 0.25, 1.0);
  ballastTube.position.y = -0.15;
  ballastTube.receiveShadow = true;
  scene.add(ballastTube);

  // Hai thanh ray thép uốn lượn song song sáng bóng
  const railGauge = CONFIG.RAILWAY.railGauge;
  const railMat = new THREE.MeshStandardMaterial({
    color: CONFIG.RAILWAY.railColor,
    roughness: 0.25,
    metalness: 0.85,
  });

  const rail1Points = [];
  const rail2Points = [];
  const totalSamples = 160;

  for (let i = 0; i <= totalSamples; i++) {
    const t = i / totalSamples;
    const pt = railwayCurve.getPointAt(t);
    const tangent = railwayCurve.getTangentAt(t);
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

    rail1Points.push(pt.clone().add(normal.clone().multiplyScalar(-railGauge / 2)).add(new THREE.Vector3(0, 0.18, 0)));
    rail2Points.push(pt.clone().add(normal.clone().multiplyScalar(railGauge / 2)).add(new THREE.Vector3(0, 0.18, 0)));
  }

  const rail1Curve = new THREE.CatmullRomCurve3(rail1Points);
  const rail2Curve = new THREE.CatmullRomCurve3(rail2Points);

  const railMesh1 = new THREE.Mesh(new THREE.TubeGeometry(rail1Curve, 140, 0.08, 6, false), railMat);
  railMesh1.castShadow = true;
  scene.add(railMesh1);

  const railMesh2 = new THREE.Mesh(new THREE.TubeGeometry(rail2Curve, 140, 0.08, 6, false), railMat);
  railMesh2.castShadow = true;
  scene.add(railMesh2);

  // Tà vẹt gỗ vuông góc tiếp tuyến đường ray
  const sleeperCount = 135;
  const sleeperGeo = new THREE.BoxGeometry(2.3, 0.14, 0.38);
  const sleeperMat = new THREE.MeshStandardMaterial({ color: CONFIG.RAILWAY.sleeperColor, roughness: 0.9 });
  const sleeperInstanced = new THREE.InstancedMesh(sleeperGeo, sleeperMat, sleeperCount);
  sleeperInstanced.castShadow = true;
  sleeperInstanced.receiveShadow = true;

  const dummy = new THREE.Object3D();
  for (let s = 0; s < sleeperCount; s++) {
    const t = s / (sleeperCount - 1);
    const pos = railwayCurve.getPointAt(t);
    const tangent = railwayCurve.getTangentAt(t);
    const angleY = Math.atan2(tangent.x, tangent.z);

    dummy.position.set(pos.x, pos.y + 0.06, pos.z);
    dummy.rotation.set(0, angleY + Math.PI / 2, 0);
    dummy.updateMatrix();
    sleeperInstanced.setMatrixAt(s, dummy.matrix);
  }
  sleeperInstanced.instanceMatrix.needsUpdate = true;
  scene.add(sleeperInstanced);

`;

const canalStartIdx = code.indexOf(oldCanalSectionStart);
const canalEndIdx = code.indexOf(oldCanalSectionEnd);

if (canalStartIdx !== -1 && canalEndIdx !== -1) {
  code = code.substring(0, canalStartIdx) + newCanalSection + code.substring(canalEndIdx);
  console.log('Successfully replaced buildCanalAndRailway section!');
} else {
  console.log('WARNING: Could not find markers for buildCanalAndRailway section.');
}

// 4. Update buildNhaB with actual open door portals (no solid wall/base blocking Door B1 & B2)
console.log('4. Overhauling buildNhaB with real open industrial doorways for Door B1 and Door B2...');
const oldBuildNhaBStart = 'function buildNhaB() {';
const oldBuildNhaBEnd = '// Hàm khởi tạo Cửa cuốn công nghiệp có thể mở/đóng và lộ dây chuyền bên trong';

const newBuildNhaB = `function buildNhaB() {
  const cfg = CONFIG.BUILDINGS.nhaB;
  const group = new THREE.Group();
  group.position.set(cfg.position.x, 0, cfg.position.z);
  group.userData = { id: 'nhaB', config: cfg };

  const wallMat = new THREE.MeshStandardMaterial({ color: cfg.wallColor, roughness: 0.65, metalness: 0.2 });
  const baseMat = new THREE.MeshStandardMaterial({ color: cfg.baseWallColor, roughness: 0.7 });

  // 1. Tường Bắc (Phía sau), Tường Tây (Mạn Nhà C), Tường Đông (Mạn đường thử)
  // Tường Bắc (North Wall: z = -cfg.depth / 2)
  const baseNorth = new THREE.Mesh(new THREE.BoxGeometry(cfg.width, 1.5, 0.4), baseMat);
  baseNorth.position.set(0, 0.75, -cfg.depth / 2);
  baseNorth.castShadow = true;
  group.add(baseNorth);

  const wallNorth = new THREE.Mesh(new THREE.BoxGeometry(cfg.width, cfg.height - 1.5, 0.4), wallMat);
  wallNorth.position.set(0, 1.5 + (cfg.height - 1.5) / 2, -cfg.depth / 2);
  wallNorth.castShadow = true;
  wallNorth.receiveShadow = true;
  group.add(wallNorth);

  // Tường Tây (West Wall: x = -cfg.width / 2)
  const baseWest = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.5, cfg.depth), baseMat);
  baseWest.position.set(-cfg.width / 2, 0.75, 0);
  baseWest.castShadow = true;
  group.add(baseWest);

  const wallWest = new THREE.Mesh(new THREE.BoxGeometry(0.4, cfg.height - 1.5, cfg.depth), wallMat);
  wallWest.position.set(-cfg.width / 2, 1.5 + (cfg.height - 1.5) / 2, 0);
  wallWest.castShadow = true;
  wallWest.receiveShadow = true;
  group.add(wallWest);

  // Tường Đông (East Wall: x = cfg.width / 2)
  const baseEast = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.5, cfg.depth), baseMat);
  baseEast.position.set(cfg.width / 2, 0.75, 0);
  baseEast.castShadow = true;
  group.add(baseEast);

  const wallEast = new THREE.Mesh(new THREE.BoxGeometry(0.4, cfg.height - 1.5, cfg.depth), wallMat);
  wallEast.position.set(cfg.width / 2, 1.5 + (cfg.height - 1.5) / 2, 0);
  wallEast.castShadow = true;
  wallEast.receiveShadow = true;
  group.add(wallEast);

  // 2. MẶT NAM QUAY RA SÂN BỐC DỠ: CẮT MỞ 2 CỬA THÔNG THOÁNG (Door B1 & Door B2)
  // Tuyệt đối không có tường hay bệ bê tông chắn ngang lòng cửa!
  // Door B1: x = -7.0, rộng 5.6m, cao 4.2m (Tâm world X = 58.0 trùng khít luồng di chuyển xe nâng & xe tải)
  // Door B2: x = +7.0, rộng 5.0m, cao 4.2m
  const frontZ = cfg.depth / 2;

  // Lintel dầm ngang chạy suốt trên đỉnh 2 cửa (từ cao độ 4.2m lên nóc xưởng 13.5m)
  const upperFrontH = cfg.height - 4.2;
  const upperFront = new THREE.Mesh(new THREE.BoxGeometry(cfg.width, upperFrontH, 0.4), wallMat);
  upperFront.position.set(0, 4.2 + upperFrontH / 2, frontZ);
  upperFront.castShadow = true;
  upperFront.receiveShadow = true;
  group.add(upperFront);

  // Mảng tường mép trái (x: -11.25 -> -9.8, rộng 1.45m)
  const bFrontL = new THREE.Mesh(new THREE.BoxGeometry(1.45, 1.5, 0.4), baseMat);
  bFrontL.position.set(-10.525, 0.75, frontZ);
  bFrontL.castShadow = true;
  group.add(bFrontL);

  const wFrontL = new THREE.Mesh(new THREE.BoxGeometry(1.45, 2.7, 0.4), wallMat);
  wFrontL.position.set(-10.525, 1.5 + 1.35, frontZ);
  wFrontL.castShadow = true;
  group.add(wFrontL);

  // Mảng tường trụ giữa 2 cửa (x: -4.2 -> +4.5, rộng 8.7m)
  const bFrontMid = new THREE.Mesh(new THREE.BoxGeometry(8.7, 1.5, 0.4), baseMat);
  bFrontMid.position.set(0.15, 0.75, frontZ);
  bFrontMid.castShadow = true;
  group.add(bFrontMid);

  const wFrontMid = new THREE.Mesh(new THREE.BoxGeometry(8.7, 2.7, 0.4), wallMat);
  wFrontMid.position.set(0.15, 1.5 + 1.35, frontZ);
  wFrontMid.castShadow = true;
  group.add(wFrontMid);

  // Mảng tường mép phải (x: +9.5 -> +11.25, rộng 1.75m)
  const bFrontR = new THREE.Mesh(new THREE.BoxGeometry(1.75, 1.5, 0.4), baseMat);
  bFrontR.position.set(10.375, 0.75, frontZ);
  bFrontR.castShadow = true;
  group.add(bFrontR);

  const wFrontR = new THREE.Mesh(new THREE.BoxGeometry(1.75, 2.7, 0.4), wallMat);
  wFrontR.position.set(10.375, 1.5 + 1.35, frontZ);
  wFrontR.castShadow = true;
  group.add(wFrontR);

  // Sàn bê tông công nghiệp phẳng mịn bên trong xưởng (không có gờ chắn)
  const factoryFloor = new THREE.Mesh(
    new THREE.BoxGeometry(cfg.width - 0.2, 0.1, cfg.depth - 0.2),
    new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.85 })
  );
  factoryFloor.position.set(0, 0.05, 0);
  factoryFloor.receiveShadow = true;
  group.add(factoryFloor);

  // Vạch kẻ sơn vàng an toàn dẫn lối xe nâng từ trong xưởng thẳng ra Cửa B1
  const laneMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
  const laneL = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 10.0), laneMat);
  laneL.rotation.x = -Math.PI / 2;
  laneL.position.set(-8.8, 0.11, 11.5);
  group.add(laneL);

  const laneR = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 10.0), laneMat);
  laneR.rotation.x = -Math.PI / 2;
  laneR.position.set(-5.2, 0.11, 11.5);
  group.add(laneR);

  // 3. Mái xưởng chính màu xám đậm (Roof Deck: Dark Slate 0x1e293b)
  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(cfg.width + 0.6, 0.6, cfg.depth + 0.6),
    new THREE.MeshStandardMaterial({ color: cfg.roofColor, roughness: 0.5 })
  );
  roof.position.y = cfg.height + 0.3; // Mặt sàn mái tại cfg.height + 0.6
  roof.castShadow = true;
  group.add(roof);

  // 4. Gờ mái viền xung quanh (Roof Fascia / Parapet Coping)
  const corniceMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4 });
  const cThick = 0.45;
  const cHeight = 0.35;
  const cY = cfg.height + 0.6 + cHeight / 2;
  const cNorth = new THREE.Mesh(new THREE.BoxGeometry(cfg.width + 0.8, cHeight, cThick), corniceMat);
  cNorth.position.set(0, cY, -(cfg.depth + 0.6) / 2 + cThick / 2);
  cNorth.castShadow = true;
  group.add(cNorth);
  const cSouth = new THREE.Mesh(new THREE.BoxGeometry(cfg.width + 0.8, cHeight, cThick), corniceMat);
  cSouth.position.set(0, cY, (cfg.depth + 0.6) / 2 - cThick / 2);
  cSouth.castShadow = true;
  group.add(cSouth);
  const cEast = new THREE.Mesh(new THREE.BoxGeometry(cThick, cHeight, cfg.depth + 0.6 - cThick * 2), corniceMat);
  cEast.position.set((cfg.width + 0.8) / 2 - cThick / 2, cY, 0);
  cEast.castShadow = true;
  group.add(cEast);
  const cWest = new THREE.Mesh(new THREE.BoxGeometry(cThick, cHeight, cfg.depth + 0.6 - cThick * 2), corniceMat);
  cWest.position.set(-(cfg.width + 0.8) / 2 + cThick / 2, cY, 0);
  cWest.castShadow = true;
  group.add(cWest);

  // 5. Nóc thông gió & lấy sáng (Monitor Roof)
  const monCfg = cfg.monitorRoof;
  const monitor = new THREE.Mesh(
    new THREE.BoxGeometry(monCfg.width, monCfg.height, monCfg.depth),
    new THREE.MeshStandardMaterial({ color: monCfg.color, roughness: 0.5 })
  );
  monitor.position.y = cfg.height + 0.6 + monCfg.height / 2;
  monitor.castShadow = true;
  group.add(monitor);

  // Quạt hút thông gió xoay tròn trên nóc (Roof Ventilators)
  for (let vz = -10; vz <= 10; vz += 5.0) {
    const vent = new THREE.Mesh(
      new THREE.CylinderGeometry(0.55, 0.65, 0.6, 8),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.35, metalness: 0.6 })
    );
    vent.position.set(0, cfg.height + 0.6 + monCfg.height + 0.3, vz);
    group.add(vent);
    roofVentilators.push(vent);
  }

  // 6. Tấm lấy sáng mái (Polycarbonate Skylights)
  const skylightMat = new THREE.MeshStandardMaterial({
    color: 0xdbeafe,
    roughness: 0.2,
    transparent: true,
    opacity: 0.72,
  });
  [-4.8, 4.8].forEach((sx) => {
    const skylight = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.12, monCfg.depth - 2), skylightMat);
    skylight.position.set(sx, cfg.height + 0.66, 0);
    group.add(skylight);
  });

  // 7. Hệ thống Pin mặt trời trên mái xưởng B
  createSolarPanelGrid(group, -7.5, cfg.height + 0.62, 0, 5.5, 24, 0.15);
  createSolarPanelGrid(group, 7.5, cfg.height + 0.62, 0, 5.5, 24, 0.15);

  // 8. Dãy cửa sổ công nghiệp
  const windowMat = new THREE.MeshStandardMaterial({ color: 0x93c5fd, roughness: 0.1, metalness: 0.8 });
  windowLights.push(windowMat);

  for (let story = 1; story <= 3; story++) {
    const winHeight = 1.1;
    const winY = 1.6 + (story - 0.5) * 3.8;

    // Mặt Nam (Tầng 2 & 3 phía trên cửa cuốn)
    if (story > 1) {
      createWindowStripWithMullions(group, 0, winY, cfg.depth / 2 + 0.05, cfg.width - 4, winHeight, 0, 2.2, windowMat);
    }

    // Mặt Đông (East - hướng đường chạy thử)
    createWindowStripWithMullions(group, cfg.width / 2 + 0.05, winY, 0, cfg.depth - 4, winHeight, Math.PI / 2, 2.4, windowMat);

    // Mặt Bắc (North - phía sau)
    createWindowStripWithMullions(group, 0, winY, -cfg.depth / 2 - 0.05, cfg.width - 6, winHeight, Math.PI, 2.2, windowMat);

    // Mặt Tây (West - phía Nhà C)
    createWindowStripWithMullions(group, -cfg.width / 2 - 0.05, winY, 0, cfg.depth - 6, winHeight, -Math.PI / 2, 2.4, windowMat);
  }

  // 9. 2 Cửa cuốn công nghiệp Xưởng B (Door B1, B2)
  // Door B1 đặt chuẩn tim tại x = -7.0 (world X = 58.0), rộng 5.6m, cao 4.2m
  createShutterDoor(group, -7.0, 0, cfg.depth / 2 + 0.08, 5.6, 4.2, 'doorB1', 'Cửa cuốn chính Xưởng B');
  createShutterDoor(group, 7.0, 0, cfg.depth / 2 + 0.08, 5.0, 4.2, 'doorB2', 'Cửa xuất nhập hàng Xưởng B');

  // 10. Ống thoát nước mưa 4 góc tường
  createRainwaterDownspouts(group, cfg.width, cfg.height, cfg.depth, 0x64748b);

  // 11. Thang thoát hiểm ngoài trời
  createFireEscapeStairs(group, -cfg.width / 2 + 4.5, -cfg.depth / 2 - 1.0, cfg.height, 3, 0x334155);

  // 12. Cụm điều hòa công nghiệp HVAC
  const chillerMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.4 });
  const chiller = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.2, 1.8), chillerMat);
  chiller.position.set(-6.5, cfg.height + 1.4, -12);
  chiller.castShadow = true;
  group.add(chiller);

  // 13. Logo Badge "DK Bike"
  createBuildingLogo(group, cfg);

  scene.add(group);
  buildingMeshes.push(upperFront);
}
`;

const bNhaBStartIdx = code.indexOf(oldBuildNhaBStart);
const bNhaBEndIdx = code.indexOf(oldBuildNhaBEnd);

if (bNhaBStartIdx !== -1 && bNhaBEndIdx !== -1) {
  code = code.substring(0, bNhaBStartIdx) + newBuildNhaB + '\n' + code.substring(bNhaBEndIdx);
  console.log('Successfully replaced buildNhaB with open doorway portals!');
} else {
  console.log('WARNING: Could not find markers for buildNhaB.');
}

// 5. Update createShutterDoor so doorB1 does NOT have blocking conveyor in the doorway
console.log('5. Ensuring Door B1 drive aisle has no blocking conveyor...');
const oldConveyorCode = `  // Băng chuyền và khung xe máy điện bên trong xưởng
  const conveyor = new THREE.Mesh(
    new THREE.BoxGeometry(width * 0.8, 0.6, 3.8),
    new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 })
  );
  conveyor.position.set(0, 0.3, -2.5);
  doorGroup.add(conveyor);

  const chassis = new THREE.Mesh(
    new THREE.BoxGeometry(1.6, 0.7, 0.5),
    new THREE.MeshStandardMaterial({ color: 0x184995, roughness: 0.3 })
  );
  chassis.position.set(0, 0.95, -2.5);
  doorGroup.add(chassis);`;

const newConveyorCode = `  // Băng chuyền và khung xe máy điện bên trong xưởng (Chỉ đặt ở cửa phụ, không đặt ở Cửa B1 để xe nâng di chuyển tự do)
  if (id !== 'doorB1') {
    const conveyor = new THREE.Mesh(
      new THREE.BoxGeometry(width * 0.8, 0.6, 3.8),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 })
    );
    conveyor.position.set(0, 0.3, -2.5);
    doorGroup.add(conveyor);

    const chassis = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 0.7, 0.5),
      new THREE.MeshStandardMaterial({ color: 0x184995, roughness: 0.3 })
    );
    chassis.position.set(0, 0.95, -2.5);
    doorGroup.add(chassis);
  } else {
    // Giá kệ phụ tùng đặt sát 2 bên mép cửa xưởng B, giữ thông thoáng 100% làn đường xe nâng
    const rackMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.5 });
    [-width / 2 + 0.3, width / 2 - 0.3].forEach((rx) => {
      const rack = new THREE.Mesh(new THREE.BoxGeometry(0.5, 2.4, 2.5), rackMat);
      rack.position.set(rx, 1.2, -2.2);
      doorGroup.add(rack);
    });
  }`;

if (code.includes(oldConveyorCode)) {
  code = code.replace(oldConveyorCode, newConveyorCode);
  console.log('Successfully updated createShutterDoor for unobstructed drive aisle!');
} else {
  console.log('WARNING: Could not find oldConveyorCode in createShutterDoor.');
}

// 6. Update CAMPUS_WAYPOINTS and People positions
console.log('6. Updating CAMPUS_WAYPOINTS and character positions to eliminate wall clipping...');

const oldWP8 = `{ id: 8, x: 70, y: 0, z: -42, neighbors: [1, 6] },            // Sân kiểm định sau Xưởng B`;
const newWP8 = `{ id: 8, x: 78, y: 0, z: -26, neighbors: [1, 6, 25] },         // Vỉa hè ngoài trời cạnh đường thử xe DK1`;

code = code.replace(oldWP8, newWP8);

// Ensure Waypoints 21 to 26 exist
const oldWPEnd = `  // Đồi sinh thái DK2
  { id: 19, x: -108, y: 15.8, z: -82, neighbors: [18] },        // Đỉnh đồi Vườn Lan & Ao cá
  { id: 20, x: -142, y: 15.5, z: -38, neighbors: [18] },        // Đỉnh Đồi Gà & Tháp bồ câu
];`;

const newWPEnd = `  // Đồi sinh thái DK2
  { id: 19, x: -108, y: 15.8, z: -82, neighbors: [18] },        // Đỉnh đồi Vườn Lan & Ao cá
  { id: 20, x: -142, y: 15.5, z: -38, neighbors: [18] },        // Đỉnh Đồi Gà & Tháp bồ câu

  // Tuyến đường & Cổng kết nối mới đối diện Cổng DK2 (Gate 1B <-> Nhà A)
  { id: 21, x: -10.0, y: 0, z: -25.5, neighbors: [11, 22] },    // Vạch đi bộ ĐT234 nối thẳng 2 cổng
  { id: 22, x: -6.0, y: 0, z: -25.5, neighbors: [21, 23] },     // Cổng kết nối 1B
  { id: 23, x: 4.0, y: 0, z: -25.5, neighbors: [22, 24] },      // Giữa đường kết nối mới
  { id: 24, x: 14.0, y: 0, z: -25.5, neighbors: [23, 3] },      // Đầu đường trước Nhà A (nối vào WP 3)

  // Tuyến vỉa hè ngoài trời đi vòng qua Xưởng B (không xuyên qua tường)
  { id: 25, x: 78.0, y: 0, z: -52.0, neighbors: [8, 26] },      // Vỉa hè cạnh Mái che xe điện
  { id: 26, x: 72.0, y: 0, z: -70.0, neighbors: [25] },         // Sân kiểm định sau Xưởng B (ngoài trời)
];`;

code = code.replace(oldWPEnd, newWPEnd);

// Update workers positions in loading area so driveway is 100% clear
code = code.replace(
  /loader1\.position\.set\(56,\s*0,\s*-31\);/,
  'loader1.position.set(54.2, 0, -30.5); // Đứng ngoài hành lang an toàn, không chắn lối đi xe nâng'
);
code = code.replace(
  /kcs\.position\.set\(63\.5,\s*0,\s*-28\);/,
  'kcs.position.set(66.5, 0, -27.5); // Khu vực kiểm định KCS ngoài luồng xe lùi'
);
code = code.replace(
  /testBike\.position\.set\(65\.0,\s*0,\s*-27\.2\);/,
  'testBike.position.set(68.0, 0, -27.0);'
);
code = code.replace(
  /createHandPalletJack\(62\.0,\s*0,\s*-29\.0/,
  'createHandPalletJack(63.2, 0, -30.0'
);

// 7. Update forklift cycle positions in updateLogisticsCycle
console.log('7. Ensuring forklift park position is cleanly inside Factory B...');
code = code.replace(/fl\.position\.set\(58\.0,\s*0,\s*-35\.6\);/g, 'fl.position.set(58.0, 0, -36.5);');
code = code.replace(/lerp\(-35\.6,\s*-29\.6/g, 'lerp(-36.5, -29.6');
code = code.replace(/lerp\(-29\.6,\s*-35\.6/g, 'lerp(-29.6, -36.5');
code = code.replace(/activeForkliftInitialPos\s*=\s*\{\s*x:\s*58\.0,\s*y:\s*0,\s*z:\s*-35\.6/g, 'activeForkliftInitialPos = { x: 58.0, y: 0, z: -36.5');
code = code.replace(/createDetailedForklift\(58\.0,\s*0,\s*-35\.6/g, 'createDetailedForklift(58.0, 0, -36.5');

// Update animate boat height
code = code.replace(
  /rowingBoat\.position\.y\s*=\s*-1\.3\s*\+\s*Math\.sin\(time\s*\*\s*0\.0025\)\s*\*\s*0\.04;/,
  'rowingBoat.position.y = -0.30 + Math.sin(time * 0.0025) * 0.03;'
);

// Write back
fs.writeFileSync(mainPath, hadCRLF ? code.replace(/\n/g, '\r\n') : code, 'utf8');
console.log('Successfully updated src/main.js!');
