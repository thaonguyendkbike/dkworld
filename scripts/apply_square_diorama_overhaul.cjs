// scripts/apply_square_diorama_overhaul.cjs
const fs = require('fs');
const path = require('path');

const mainPath = path.join(__dirname, '..', 'src', 'main.js');
const configPath = path.join(__dirname, '..', 'src', 'config.js');

let mainCode = fs.readFileSync(mainPath, 'utf8');
let configCode = fs.readFileSync(configPath, 'utf8');

// Normalize to LF
const hadCRLF = mainCode.includes('\r\n');
mainCode = mainCode.replace(/\r\n/g, '\n');
configCode = configCode.replace(/\r\n/g, '\n');

// ============================================================================
// 1. UPDATE CONFIG.JS: INCREASE TREE COUNTS & UPDATE DIORAMA SETTINGS
// ============================================================================
configCode = configCode.replace(/roundTreeCount:\s*\d+,/, 'roundTreeCount: 2600,     // (a) Cây tán tròn phủ xanh dày đặc');
configCode = configCode.replace(/pineTreeCount:\s*\d+,/, 'pineTreeCount: 1600,       // (b) Rừng thông đại ngàn trên sườn đồi');
configCode = configCode.replace(/autumnTreeCount:\s*\d+,/, 'autumnTreeCount: 420,     // (c) Cây tán vàng/cam thu');
configCode = configCode.replace(/bushCount:\s*\d+,/, 'bushCount: 1100,          // (d) Bụi thấp rậm rạp');
configCode = configCode.replace(/rockCount:\s*\d+,/, 'rockCount: 300,           // Đá cuội');
configCode = configCode.replace(/flowerCount:\s*\d+,/, 'flowerCount: 1200,        // Hoa dại thung lũng');
configCode = configCode.replace(/grassTuftCount:\s*\d+,/, 'grassTuftCount: 900,     // Khóm cỏ tuft');

// Update Fog for crisp floating diorama look (như ảnh tham khảo)
configCode = configCode.replace(/fogNear:\s*\d+,/, 'fogNear: 220,');
configCode = configCode.replace(/fogFar:\s*\d+,/, 'fogFar: 850,');

fs.writeFileSync(configPath, hadCRLF ? configCode.replace(/\n/g, '\r\n') : configCode, 'utf8');
console.log('1. Increased tree counts in src/config.js successfully!');

// ============================================================================
// 2. REPLACE buildVastTerrainAndClouds WITH SQUARE CUTAWAY DIORAMA BASE
// ============================================================================
const startMarker = 'function buildVastTerrainAndClouds() {';
const endMarker = 'function buildRetainingWall() {';

const startIdx = mainCode.indexOf(startMarker);
const endIdx = mainCode.indexOf(endMarker);

if (startIdx !== -1 && endIdx !== -1) {
  const newTerrainCode = `function buildVastTerrainAndClouds() {
  // ==========================================================================
  // KHỐI ĐẢO 3D HÌNH VUÔNG LÁT CẮT ĐỊA TẦNG (SQUARE FLOATING DIORAMA BASE)
  // Kích thước chuẩn vuông 300m × 300m bao trọn vẹn khuôn viên DK1 & DK2
  // Tọa độ biên: X từ -175 đến +125 | Z từ -200 đến +100 | Tâm: (-25, -50)
  // ==========================================================================
  const dioramaGroup = new THREE.Group();
  const W = 300;   // Chiều rộng hình vuông
  const D = 300;   // Chiều sâu hình vuông
  const cx = -25;  // Tâm X
  const cz = -50;  // Tâm Z
  const cliffDepth = 24.0; // Độ dày vách cắt địa chất

  // 1. Mặt sàn cỏ xanh chính hình vuông (Top Grass Surface)
  const topGrassGeo = new THREE.BoxGeometry(W, 1.2, D);
  const topGrassMat = new THREE.MeshStandardMaterial({
    color: CONFIG.GROUND.grassColor,
    roughness: 0.88,
    metalness: 0.05,
    flatShading: true,
  });
  const topGrass = new THREE.Mesh(topGrassGeo, topGrassMat);
  topGrass.position.set(cx, -0.6, cz);
  topGrass.receiveShadow = true;
  dioramaGroup.add(topGrass);

  // 2. Vật liệu các tầng địa chất mặt cắt đứng (Geological Strata Materials)
  const grassRimMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.9, flatShading: true }); // Tầng cỏ mép
  const upperSoilMat = new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.95, flatShading: true }); // Tầng đất mùn nâu ấm
  const midClayMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.92, flatShading: true });  // Tầng sét nâu đỏ
  const deepRockMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.95, flatShading: true }); // Tầng đá bazan sẫm màu
  const underBaseMat = new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.98 }); // Đáy đảo

  // Hàm tạo 1 vách cắt địa tầng đa lớp chuẩn hình vuông
  const buildStrataWall = (length, posX, posZ, rotY) => {
    const wallGroup = new THREE.Group();
    wallGroup.position.set(posX, 0, posZ);
    wallGroup.rotation.y = rotY;

    // Lớp 1: Viền cỏ bề mặt (0.0 đến -1.2m)
    const layer1 = new THREE.Mesh(new THREE.BoxGeometry(length, 1.2, 0.4), grassRimMat);
    layer1.position.set(0, -0.6, 0);
    wallGroup.add(layer1);

    // Lớp 2: Tầng đất mùn nâu vàng (-1.2m đến -7.0m)
    const layer2 = new THREE.Mesh(new THREE.BoxGeometry(length, 5.8, 0.4), upperSoilMat);
    layer2.position.set(0, -4.1, 0);
    wallGroup.add(layer2);

    // Lớp 3: Tầng đất sét & sỏi cát xen kẽ (-7.0m đến -15.0m)
    const layer3 = new THREE.Mesh(new THREE.BoxGeometry(length, 8.0, 0.4), midClayMat);
    layer3.position.set(0, -11.0, 0);
    wallGroup.add(layer3);

    // Lớp 4: Tầng thềm đá bazan magma kiên cố (-15.0m đến -24.0m)
    const layer4 = new THREE.Mesh(new THREE.BoxGeometry(length, 9.0, 0.4), deepRockMat);
    layer4.position.set(0, -19.5, 0);
    wallGroup.add(layer4);

    // Các dải vân địa tầng sọc ngang mộc mạc nổi bật (như ảnh tham khảo)
    const stripeCount = 9;
    for (let s = 1; s <= stripeCount; s++) {
      const sy = -1.5 - s * 2.3;
      const stripeMat = s % 2 === 0 ? upperSoilMat : deepRockMat;
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(length, 0.25, 0.5), stripeMat);
      stripe.position.set(0, sy, 0);
      wallGroup.add(stripe);
    }

    return wallGroup;
  };

  // Dựng 4 mặt cắt vách hộp hình vuông (Bắc, Nam, Tây, Đông)
  dioramaGroup.add(buildStrataWall(W, cx, cz - D / 2, 0));            // Vách Bắc (Z = -200)
  dioramaGroup.add(buildStrataWall(W, cx, cz + D / 2, Math.PI));     // Vách Nam (Z = +100)
  dioramaGroup.add(buildStrataWall(D, cx - W / 2, cz, Math.PI / 2)); // Vách Tây (X = -175)
  dioramaGroup.add(buildStrataWall(D, cx + W / 2, cz, -Math.PI / 2));// Vách Đông (X = +125)

  // 3. Mặt đáy dưới cùng của khối hộp hình vuông (Bottom Slab)
  const bottomPlate = new THREE.Mesh(new THREE.BoxGeometry(W, 0.8, D), underBaseMat);
  bottomPlate.position.set(cx, -cliffDepth - 0.4, cz);
  dioramaGroup.add(bottomPlate);

  // 4. Thác nước tràn qua mép vách cắt đổ xuống không trung (như ảnh tham khảo)
  const waterCanalX = 89.5;
  const waterfallMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    roughness: 0.1,
    metalness: 0.15,
    transparent: true,
    opacity: 0.88,
  });
  const foamMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.92 });

  // Thác nước mép Nam (dòng sông đổ xuống vách Nam)
  const southFall = new THREE.Mesh(new THREE.BoxGeometry(9.5, cliffDepth, 0.3), waterfallMat);
  southFall.position.set(waterCanalX, -cliffDepth / 2, cz + D / 2 + 0.1);
  dioramaGroup.add(southFall);

  const southFoam = new THREE.Mesh(new THREE.BoxGeometry(11.0, 2.2, 1.2), foamMat);
  southFoam.position.set(waterCanalX, -cliffDepth, cz + D / 2 + 0.6);
  dioramaGroup.add(southFoam);

  // Thác nước mép Bắc (dòng sông đổ xuống vách Bắc)
  const northFall = new THREE.Mesh(new THREE.BoxGeometry(9.5, cliffDepth, 0.3), waterfallMat);
  northFall.position.set(waterCanalX, -cliffDepth / 2, cz - D / 2 - 0.1);
  dioramaGroup.add(northFall);

  const northFoam = new THREE.Mesh(new THREE.BoxGeometry(11.0, 2.2, 1.2), foamMat);
  northFoam.position.set(waterCanalX, -cliffDepth, cz - D / 2 - 0.6);
  dioramaGroup.add(northFoam);

  // 5. Các ngọn đồi uốn lượn NẰM TRỌN VẸN BÊN TRONG HÌNH VUÔNG (Interior Hills Only)
  // Bỏ toàn bộ các dãy núi chân trời xa ngoài hình vuông, chỉ giữ các ngọn đồi nội vi diorama
  const interiorHills = [
    { x: 55, y: 14, z: -108, radius: 54, height: 28, color: 0x22c55e, segs: 10 },  // Đồi cối xay gió
    { x: 110, y: 12, z: -75, radius: 42, height: 24, color: 0x16a34a, segs: 9 },   // Đồi Đông thung lũng tàu hỏa
    { x: 115, y: 9, z: -25, radius: 38, height: 18, color: 0x15803d, segs: 9 },    // Đồi Đông Nam
    { x: 45, y: 10, z: -85, radius: 40, height: 20, color: 0x22c55e, segs: 9 },    // Đồi sau Nhà B
    { x: -145, y: 15, z: -155, radius: 48, height: 30, color: 0x15803d, segs: 10 }, // Đồi góc Tây Bắc bên trong hình vuông
    { x: 80, y: 15, z: -160, radius: 48, height: 30, color: 0x166534, segs: 10 },  // Đồi góc Đông Bắc bên trong hình vuông
    { x: -60, y: 16, z: -160, radius: 52, height: 32, color: 0x15803d, segs: 10 }, // Đồi sườn Bắc bên trong hình vuông
  ];

  interiorHills.forEach((h) => {
    const hillMesh = new THREE.Mesh(
      new THREE.ConeGeometry(h.radius, h.height, h.segs || 9),
      new THREE.MeshStandardMaterial({ color: h.color, roughness: 0.92, flatShading: true })
    );
    hillMesh.position.set(h.x, h.y, h.z);
    hillMesh.receiveShadow = true;
    dioramaGroup.add(hillMesh);
  });

  scene.add(dioramaGroup);

  // 6. Cối xay gió phong cách Hà Lan trên đỉnh đồi sinh thái Bắc (Giữ nguyên)
  const windmillGroup = new THREE.Group();
  windmillGroup.position.set(55, 25.5, -108);

  const millTower = new THREE.Mesh(
    new THREE.CylinderGeometry(2.2, 3.8, 9.5, 8),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.7, flatShading: true })
  );
  millTower.castShadow = true;
  windmillGroup.add(millTower);

  const millRoof = new THREE.Mesh(
    new THREE.ConeGeometry(2.8, 2.8, 8),
    new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.6, flatShading: true })
  );
  millRoof.position.y = 5.8;
  millRoof.castShadow = true;
  windmillGroup.add(millRoof);

  const doorMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 });
  const millDoor = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.6, 0.2), doorMat);
  millDoor.position.set(0, -3.2, 3.6);
  windmillGroup.add(millDoor);

  const bladePivot = new THREE.Group();
  bladePivot.position.set(0, 5.0, 2.5);

  const hub = new THREE.Mesh(
    new THREE.CylinderGeometry(0.35, 0.35, 0.6, 8),
    new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6 })
  );
  hub.rotation.x = Math.PI / 2;
  bladePivot.add(hub);

  windmillBlades = new THREE.Group();
  const bladeMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.5 });
  const frameWoodMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.8 });

  for (let b = 0; b < 4; b++) {
    const bArm = new THREE.Group();
    bArm.rotation.z = (b * Math.PI) / 2;

    const spar = new THREE.Mesh(new THREE.BoxGeometry(0.18, 5.8, 0.1), frameWoodMat);
    spar.position.y = 2.9;
    bArm.add(spar);

    const cloth = new THREE.Mesh(new THREE.BoxGeometry(0.85, 4.2, 0.05), bladeMat);
    cloth.position.set(0.45, 3.4, 0.02);
    cloth.castShadow = true;
    bArm.add(cloth);

    windmillBlades.add(bArm);
  }
  bladePivot.add(windmillBlades);
  windmillGroup.add(bladePivot);

  windmillGroup.userData = {
    id: 'windmill',
    title: 'Cối xay gió cảnh quan sinh thái',
    type: 'landmark',
    desc: 'Điểm nhấn cảnh quan trên đỉnh đồi sinh thái xanh phía Bắc, biểu tượng năng lượng gió thân thiện môi trường của DK Bike.',
    zone: 'Đồi Sinh Thái Bắc',
  };
  millTower.userData = windmillGroup.userData;
  scene.add(windmillGroup);
  interactiveObjects.push(millTower);

  // 7. Các cụm mây trắng bồng bềnh lơ lửng quanh chân đảo (như ảnh tham khảo)
  skyClouds = [];
  const cloudMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4, flatShading: true });
  const baseCloudConfigs = [
    // Mây trôi lượn lờ quanh mép Nam và thác nước
    { x: -140, y: -18, z: 108, scale: 1.2, speed: 1.5 },
    { x: -80, y: -20, z: 105, scale: 1.5, speed: 1.8 },
    { x: 0, y: -16, z: 108, scale: 1.3, speed: 1.4 },
    { x: 75, y: -22, z: 105, scale: 1.6, speed: 2.0 }, // Chân thác Nam
    { x: 115, y: -19, z: 95, scale: 1.2, speed: 1.6 },
    // Mây quanh mép Tây
    { x: -182, y: -18, z: -140, scale: 1.4, speed: 1.7 },
    { x: -180, y: -21, z: -70, scale: 1.6, speed: 1.5 },
    { x: -182, y: -16, z: 10, scale: 1.3, speed: 1.8 },
    // Mây quanh mép Đông
    { x: 132, y: -18, z: -130, scale: 1.5, speed: 1.6 },
    { x: 130, y: -22, z: -50, scale: 1.4, speed: 1.7 },
    { x: 132, y: -16, z: 30, scale: 1.6, speed: 1.9 },
    // Mây quanh mép Bắc & Chân thác Bắc
    { x: -120, y: -20, z: -205, scale: 1.5, speed: 1.5 },
    { x: -30, y: -18, z: -208, scale: 1.3, speed: 1.8 },
    { x: 80, y: -22, z: -205, scale: 1.6, speed: 2.1 }, // Chân thác Bắc
    // Mây trên không trung
    { x: -110, y: 72, z: -80, scale: 1.4, speed: 2.2 },
    { x: 45, y: 76, z: -40, scale: 1.6, speed: 2.5 },
    { x: -20, y: 82, z: 40, scale: 1.3, speed: 2.0 },
  ];

  baseCloudConfigs.forEach((cc) => {
    const cGroup = new THREE.Group();
    cGroup.position.set(cc.x, cc.y, cc.z);
    cGroup.userData = { speed: cc.speed };

    const puffCount = 5;
    for (let p = 0; p < puffCount; p++) {
      const pr = (0.9 + Math.random() * 0.7) * cc.scale;
      const puff = new THREE.Mesh(new THREE.DodecahedronGeometry(pr, 1), cloudMat);
      puff.position.set(
        (p - 2) * 1.5 * cc.scale + (Math.random() - 0.5) * 0.8,
        (Math.random() - 0.5) * 0.6 * cc.scale,
        (Math.random() - 0.5) * 1.2 * cc.scale
      );
      cGroup.add(puff);
    }
    scene.add(cGroup);
    skyClouds.push(cGroup);
  });
}
`;

  mainCode = mainCode.slice(0, startIdx) + newTerrainCode + '\n' + mainCode.slice(endIdx);
  console.log('2. Replaced buildVastTerrainAndClouds with Square Cutaway Diorama Base!');
} else {
  console.log('2. Error: startIdx or endIdx not found');
}

// ============================================================================
// 3. UPDATE TREE DISTRIBUTION GRID TO STRICTLY FILL SQUARE DIORAMA [ -172..122, -196..96 ]
// ============================================================================
const oldGridRegex = /const minX\s*=\s*-?\d+,\s*maxX\s*=\s*\d+,\s*stepX\s*=\s*[\d\.]+;\s*\n\s*const minZ\s*=\s*-?\d+,\s*maxZ\s*=\s*\d+,\s*stepZ\s*=\s*[\d\.]+;/;

const newGridCode = `// Phủ cây xanh DÀY ĐẶC & RẬM RẠP NẰM GỌN TRONG HÌNH VUÔNG 300m × 300m
  const minX = -172, maxX = 122, stepX = 2.7;
  const minZ = -196, maxZ = 96, stepZ = 2.7;`;

if (oldGridRegex.test(mainCode)) {
  mainCode = mainCode.replace(oldGridRegex, newGridCode);
  console.log('3. Updated tree grid to fill the entire square diorama densely!');
} else {
  console.log('3. Warning: oldGridRegex not matched');
}

// In getTerrainElevation, update hills data to match the new interior hills
const oldElevationHillsRegex = /const hillsData = \[\s*\{ x: 125, z: -80, radius: 52[\s\S]*?\];/;
const newElevationHills = `const hillsData = [
    { x: 55, z: -108, radius: 54, apex: 28, base: -2 },  // Đồi Cối xay gió
    { x: 110, z: -75, radius: 42, apex: 24, base: -2 },  // Đồi Đông
    { x: 115, z: -25, radius: 38, apex: 18, base: -2 },  // Đồi Đông Nam
    { x: 45, z: -85, radius: 40, apex: 20, base: -2 },   // Đồi sau DK1
    { x: -145, z: -155, radius: 48, apex: 30, base: -2 }, // Đồi góc Tây Bắc
    { x: 80, z: -160, radius: 48, apex: 30, base: -2 },  // Đồi góc Đông Bắc
    { x: -60, z: -160, radius: 52, apex: 32, base: -2 }, // Đồi sườn Bắc
  ];`;

if (oldElevationHillsRegex.test(mainCode)) {
  mainCode = mainCode.replace(oldElevationHillsRegex, newElevationHills);
  console.log('4. Updated interior hills in getTerrainElevation!');
} else {
  console.log('4. Warning: oldElevationHillsRegex not matched');
}

fs.writeFileSync(mainPath, hadCRLF ? mainCode.replace(/\n/g, '\r\n') : mainCode, 'utf8');
console.log('Finished applying Square Diorama overhaul!');
