// scripts/build_connecting_gate_and_road.cjs
const fs = require('fs');
const path = require('path');

const mainPath = path.join(__dirname, '..', 'src', 'main.js');
let code = fs.readFileSync(mainPath, 'utf8');

// 1. Exclude trees in isForestExcludedZone
code = code.replace(
  /\/\/ Lòng đường ĐT234 \(chỉ trồng cây cảnh 2 bên vỉa hè\)/,
  `// Tuyến đường & Cổng mới kết nối ĐT234 sang Nhà A (Cổng 1B đối diện Cổng DK2)\r\n  if (x >= -8.0 && x <= 14.5 && z >= -31.5 && z <= -19.5) return true;\r\n\r\n  // Lòng đường ĐT234 (chỉ trồng cây cảnh 2 bên vỉa hè)`
);

// 2. Clear sidewalk trees along ĐT234 East edge at Z: -20 to -30
code = code.replace(
  /if \(rx === -13\.8 && z >= -34 && z <= -6\) return;/,
  `if (rx === -13.8 && z >= -34 && z <= -6) return;\r\n      // Bỏ cây ở lối vào Cổng kết nối mới bên lề Đông ĐT234\r\n      if (rx === -6.2 && z >= -31 && z <= -20) return;`
);

// 3. Update perimeter fence opening at Z: -21 to -30
code = code.replace(
  /buildFenceSegment\(-6\.0,\s*-25\.0,\s*-85\.0\);\r?\n\s*buildFenceSegment\(-6\.0,\s*-2\.0,\s*-10\.0\);/,
  `// Hàng rào mạn DK1: Mở khoảng trống 9m (Z: -21 đến -30) cho Cổng kết nối mới đối diện Cổng DK2\r\n  buildFenceSegment(-6.0, -30.0, -85.0);\r\n  buildFenceSegment(-6.0, -2.0, -21.0);`
);

// 4. Function buildConnectingGateAndRoad
const gateAndRoadFunction = `
// ============================================================================
// CỔNG & ĐƯỜNG KẾT NỐI MỚI (CONNECTING GATE 1B & ROAD ĐT234 <-> NHÀ A)
// Vị trí: Đối diện Cổng DK2 qua vạch người đi bộ ĐT234
// ============================================================================
function buildConnectingGateAndRoad() {
  const group = new THREE.Group();

  const roadMat = new THREE.MeshStandardMaterial({
    color: CONFIG.ROADS ? CONFIG.ROADS.roadColor : 0x334155,
    roughness: 0.78,
  });
  const curbMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.85 });
  const sidewalkMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.9 });
  const pylonMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.3 });
  const archMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.35, metalness: 0.2 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.2, metalness: 0.85 });
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 });
  const yellowPaintMat = new THREE.MeshBasicMaterial({ color: 0xffcc00 });
  const whitePaintMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

  // --------------------------------------------------------------------------
  // 1. TUYẾN ĐƯỜNG NHỰA KẾT NỐI (Connecting Asphalt Road: x = -6.5 -> 13.0, z = -25.5)
  // --------------------------------------------------------------------------
  const roadWidth = 6.8;
  const roadLength = 19.5;
  const roadCenterX = 3.25;
  const roadCenterZ = -25.5;

  const roadMesh = new THREE.Mesh(new THREE.PlaneGeometry(roadLength, roadWidth), roadMat);
  roadMesh.rotation.x = -Math.PI / 2;
  roadMesh.position.set(roadCenterX, 0.03, roadCenterZ);
  roadMesh.receiveShadow = true;
  group.add(roadMesh);

  // Vạch tim đường màu vàng đứt đoạn (Yellow Centerline)
  for (let sx = -7.5; sx <= 7.5; sx += 3.2) {
    const dash = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.22), yellowPaintMat);
    dash.rotation.x = -Math.PI / 2;
    dash.position.set(roadCenterX + sx, 0.04, roadCenterZ);
    group.add(dash);
  }

  // Vạch sơn trắng liền mép đường 2 bên (White Edge Lines)
  [-roadWidth / 2 + 0.3, roadWidth / 2 - 0.3].forEach((oz) => {
    const edgeLine = new THREE.Mesh(new THREE.PlaneGeometry(roadLength, 0.18), whitePaintMat);
    edgeLine.rotation.x = -Math.PI / 2;
    edgeLine.position.set(roadCenterX, 0.04, roadCenterZ + oz);
    group.add(edgeLine);
  });

  // Vạch dừng xe (Stop Line) trước ngã ba nhập vào ĐT234
  const stopLine = new THREE.Mesh(new THREE.PlaneGeometry(0.45, roadWidth - 1.2), whitePaintMat);
  stopLine.rotation.x = -Math.PI / 2;
  stopLine.position.set(-5.5, 0.04, roadCenterZ);
  group.add(stopLine);

  // Vỉa hè đi bộ có bó vỉa bê tông 2 bên đường (North & South Sidewalks)
  [-1, 1].forEach((dir) => {
    const sz = roadCenterZ + dir * (roadWidth / 2 + 1.1);

    // Mặt vỉa hè lát gạch
    const walk = new THREE.Mesh(new THREE.BoxGeometry(roadLength, 0.15, 2.0), sidewalkMat);
    walk.position.set(roadCenterX, 0.075, sz);
    walk.receiveShadow = true;
    group.add(walk);

    // Bó vỉa bê tông
    const curb = new THREE.Mesh(new THREE.BoxGeometry(roadLength, 0.22, 0.22), curbMat);
    curb.position.set(roadCenterX, 0.11, roadCenterZ + dir * (roadWidth / 2 + 0.11));
    group.add(curb);

    // Bồn cỏ & hoa thấp viền vỉa hè
    const lawn = new THREE.Mesh(
      new THREE.PlaneGeometry(roadLength - 2.0, 1.2),
      new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.9 })
    );
    lawn.rotation.x = -Math.PI / 2;
    lawn.position.set(roadCenterX, 0.16, sz + dir * 0.4);
    group.add(lawn);

    // Khóm hoa cảnh dọc vỉa hè
    const flowerColors = [0xfacc15, 0xef4444, 0xf472b6, 0xffffff];
    for (let fx = -6.0; fx <= 6.0; fx += 2.2) {
      const flower = new THREE.Mesh(
        new THREE.SphereGeometry(0.14, 5, 4),
        new THREE.MeshStandardMaterial({ color: flowerColors[Math.floor(Math.random() * flowerColors.length)], roughness: 0.7 })
      );
      flower.position.set(roadCenterX + fx, 0.26, sz + dir * 0.4);
      group.add(flower);
    }
  });

  // Bó vỉa cong lượn góc ngã ba vuốt vào ĐT234 (Corner Curb Radii)
  [-1, 1].forEach((dir) => {
    const cornerCurb = new THREE.Mesh(
      new THREE.CylinderGeometry(2.4, 2.4, 0.22, 8, 1, false, 0, Math.PI / 2),
      curbMat
    );
    cornerCurb.position.set(-6.2, 0.11, roadCenterZ + dir * (roadWidth / 2 + 2.4));
    cornerCurb.rotation.y = dir === 1 ? 0 : -Math.PI / 2;
    group.add(cornerCurb);
  });

  // --------------------------------------------------------------------------
  // 2. CỔNG KẾT NỐI CHÍNH (ARCH & PYLONS GATE 1B AT x = -6.0)
  // --------------------------------------------------------------------------
  const gateGroup = new THREE.Group();
  gateGroup.position.set(-6.0, 0, roadCenterZ);

  // 2 Trụ cổng granite vững chãi hai bên (North & South Gate Pillars)
  const pillarGeo = new THREE.BoxGeometry(1.2, 4.4, 1.2);
  const pillarCapGeo = new THREE.ConeGeometry(0.9, 0.45, 4);

  [-1, 1].forEach((dir) => {
    const pz = dir * (roadWidth / 2 + 0.65);

    // Thân trụ ốp đá granite xám đen cao cấp
    const pillar = new THREE.Mesh(pillarGeo, pylonMat);
    pillar.position.set(0, 2.2, pz);
    pillar.castShadow = true;
    gateGroup.add(pillar);

    // Chóp kim tự tháp inox
    const cap = new THREE.Mesh(pillarCapGeo, whiteMat);
    cap.rotation.y = Math.PI / 4;
    cap.position.set(0, 4.62, pz);
    gateGroup.add(cap);

    // Chỉ phào mạ vàng quanh đầu trụ
    const goldTrim = new THREE.Mesh(new THREE.BoxGeometry(1.28, 0.14, 1.28), goldMat);
    goldTrim.position.set(0, 4.3, pz);
    gateGroup.add(goldTrim);

    // Biển hiệu đồng dán trên trụ
    const brassPlate = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 1.6), goldMat);
    brassPlate.rotation.y = -Math.PI / 2;
    brassPlate.position.set(-0.61, 2.3, pz);
    gateGroup.add(brassPlate);
  });

  // Cổng vòm thép hiện đại vươn ngang qua đường (Overhead Connecting Arch Beam)
  const archBeam = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.75, roadWidth + 2.5), archMat);
  archBeam.position.set(0, 4.3, 0);
  archBeam.castShadow = true;
  gateGroup.add(archBeam);

  // Viền vàng trên thanh vòm
  const archTrim = new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.08, roadWidth + 2.5), goldMat);
  archTrim.position.set(0, 4.7, 0);
  gateGroup.add(archTrim);

  // Bảng chữ nổi thương hiệu trên cổng vòm (Mặt Tây hướng ra ĐT234 & Cổng DK2)
  const signPlankWest = new THREE.Mesh(
    new THREE.PlaneGeometry(roadWidth + 1.2, 0.45),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3 })
  );
  signPlankWest.rotation.y = -Math.PI / 2;
  signPlankWest.position.set(-0.49, 4.3, 0);
  gateGroup.add(signPlankWest);

  const signTextWest = new THREE.Mesh(
    new THREE.PlaneGeometry(roadWidth + 0.8, 0.32),
    new THREE.MeshStandardMaterial({ color: 0xffb703, roughness: 0.2, metalness: 0.8 })
  );
  signTextWest.rotation.y = -Math.PI / 2;
  signTextWest.position.set(-0.50, 4.3, 0);
  gateGroup.add(signTextWest);

  // Đèn chiếu rọi ban đêm dưới cổng vòm (LED Downlights)
  [-2.2, 0, 2.2].forEach((lz) => {
    const downlight = new THREE.PointLight(0xfff7ed, 0.6, 9);
    downlight.position.set(0, 3.8, lz);
    gateGroup.add(downlight);
  });

  // --------------------------------------------------------------------------
  // 3. BARIE TỰ ĐỘNG CỔNG KẾT NỐI (Boom Barrier Gate 1B)
  // --------------------------------------------------------------------------
  createGateBarrier(-5.6, 0, roadCenterZ - roadWidth / 2 - 0.2, Math.PI / 2, 'barrierDK1_West', 'Barie Cổng kết nối DK1 - DK2 (Cổng 1B)');

  // --------------------------------------------------------------------------
  // 4. BỐT BẢO VỆ CỔNG KẾT NỐI (Security Guard Booth & Guard)
  // --------------------------------------------------------------------------
  const boothGroup = new THREE.Group();
  boothGroup.position.set(-4.0, 0, roadCenterZ - roadWidth / 2 - 2.8);

  // Thân bốt bảo vệ hợp kim nhôm kính
  const boothBody = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.8, 2.2), whiteMat);
  boothBody.position.y = 1.4;
  boothBody.castShadow = true;
  boothGroup.add(boothBody);

  // Mái bốt che nắng màu xanh dương DK
  const boothRoof = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.2, 2.6), archMat);
  boothRoof.position.y = 2.9;
  boothRoof.castShadow = true;
  boothGroup.add(boothRoof);

  // Dải cửa sổ kính 3 mặt
  const boothGlassMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1, metalness: 0.9 });
  const frontGlass = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.1), boothGlassMat);
  frontGlass.rotation.y = -Math.PI / 2;
  frontGlass.position.set(-1.21, 1.6, 0);
  boothGroup.add(frontGlass);

  const sideGlass = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.1), boothGlassMat);
  sideGlass.position.set(0, 1.6, 1.11);
  boothGroup.add(sideGlass);

  // Cục nóng điều hòa trên nóc bốt
  const acUnit = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 0.45, 0.3),
    new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.5 })
  );
  acUnit.position.set(-0.5, 3.25, 0);
  boothGroup.add(acUnit);

  // Nhân viên bảo vệ đứng chốt cạnh cổng
  const gateGuard = createCharacter({
    shirtColor: 0x1e293b,
    pantsColor: 0x0f172a,
    hatColor: 0x1e293b,
  });
  gateGuard.position.set(-1.5, 0, 1.8);
  gateGuard.rotation.y = -Math.PI / 2;
  boothGroup.add(gateGuard);

  gateGroup.add(boothGroup);

  // --------------------------------------------------------------------------
  // 5. CỘT ĐÈN CHIẾU SÁNG CAO ÁP TRÊN ĐƯỜNG KẾT NỐI (Streetlights)
  // --------------------------------------------------------------------------
  [1.0, 9.0].forEach((lx) => {
    const lamp = createStreetLight(lx, 0, roadCenterZ - roadWidth / 2 - 1.2, 0);
    group.add(lamp);
  });

  group.add(gateGroup);

  // Metadata tương tác
  const gateData = {
    id: 'gateDK1_West',
    title: 'Cổng & Tuyến đường kết nối liên phân khu DK1 - DK2 (Cổng 1B)',
    type: 'gate',
    desc: 'Cổng kiểm soát an ninh và trục đường kết nối xuyên suốt giữa Phân khu Nhà máy DK1 và Trụ sở điều hành DK2 qua đường ĐT234.',
    zone: 'DK1',
  };
  group.userData = gateData;
  archBeam.userData = gateData;
  interactiveObjects.push(archBeam);

  scene.add(group);
}
`;

// Insert buildConnectingGateAndRoad before buildExecutiveParkingCars or buildRoadsAndTestTrack
if (!code.includes('function buildConnectingGateAndRoad() {')) {
  code = code.replace(
    'function buildExecutiveParkingCars() {',
    gateAndRoadFunction + '\r\nfunction buildExecutiveParkingCars() {'
  );
  console.log('4. Inserted buildConnectingGateAndRoad function.');
}

// Call buildConnectingGateAndRoad in buildLogisticsAndEquipment or buildRoadsAndTestTrack
if (!code.includes('buildConnectingGateAndRoad();')) {
  code = code.replace(
    'buildRoadsAndTestTrack();',
    'buildRoadsAndTestTrack();\r\n  buildConnectingGateAndRoad();'
  );
  console.log('5. Added buildConnectingGateAndRoad() call.');
}

// Add 3D label for the new gate
if (!code.includes("id: 'gateDK1_West'")) {
  code = code.replace(
    /\{ text: '🚪 Cửa xưởng & Bốc dỡ', pos: new THREE\.Vector3\(58, 5\.2, -32\), id: 'doorB1' \},/,
    `{ text: '🚪 Cửa xưởng & Bốc dỡ', pos: new THREE.Vector3(58, 5.2, -32), id: 'doorB1' },\r\n    { text: '🏛️ Cổng kết nối DK1 - DK2', pos: new THREE.Vector3(-6.0, 5.2, -25.5), id: 'gateDK1_West' },`
  );
  console.log('6. Added 3D label for gateDK1_West.');
}

fs.writeFileSync(mainPath, code, 'utf8');
console.log('Finished applying connecting gate and road.');
