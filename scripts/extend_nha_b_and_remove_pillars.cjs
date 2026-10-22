const fs = require('fs');
const path = require('path');

// 1. Update config.js
const configPath = path.join(__dirname, '../src/config.js');
let configCode = fs.readFileSync(configPath, 'utf8');

// Update Nha B dimensions: depth 43.5 (10m longer), position.z = -55.0 (front stays at Z = -33.25)
configCode = configCode.replace(
  /nhaB:\s*\{\s*name:\s*'Nhà B - Xưởng sản xuất chính',\s*zone:\s*'DK1',\s*width:\s*[\d.]+,\s*height:\s*[\d.]+,\s*depth:\s*[\d.]+,\s*position:\s*\{\s*x:\s*[\d.]+,\s*y:\s*[\d.\s/]+,\s*z:\s*[-\d.]+\s*\},/g,
  `nhaB: {\n      name: 'Nhà B - Xưởng sản xuất chính (Dài 44m)',\n      zone: 'DK1',\n      width: 22.5,\n      height: 13.5,\n      depth: 43.5,\n      position: { x: 65.0, y: 13.5 / 2, z: -55.0 },`
);

// Update monitorRoof depth
configCode = configCode.replace(
  /monitorRoof:\s*\{\s*width:\s*[\d.]+,\s*height:\s*[\d.]+,\s*depth:\s*[\d.]+,\s*color:\s*0x[0-9a-fA-F]+\s*\},/g,
  `monitorRoof: { width: 7.0, height: 2.2, depth: 38.0, color: 0x0f172a },`
);

// Update camera presets for extended Nha B
configCode = configCode.replace(
  /nhaB:\s*\{\s*pos:\s*\{\s*x:\s*[\d.]+,\s*y:\s*[\d.]+,\s*z:\s*[-\d.]+\s*\},\s*target:\s*\{\s*x:\s*[\d.]+,\s*y:\s*[\d.]+,\s*z:\s*[-\d.]+\s*\},\s*name:\s*'[^\']+'\s*\},/g,
  `nhaB: {\n      pos: { x: 98, y: 38, z: -25 },\n      target: { x: 65, y: 8, z: -55 },\n      name: 'Xưởng chính Nhà B (DK1)',\n    },`
);

configCode = configCode.replace(
  /insideNhaB:\s*\{\s*pos:\s*\{\s*x:\s*[\d.]+,\s*y:\s*[\d.]+,\s*z:\s*[-\d.]+\s*\},\s*target:\s*\{\s*x:\s*[\d.]+,\s*y:\s*[\d.]+,\s*z:\s*[-\d.]+\s*\},\s*name:\s*'[^\']+'\s*\},/g,
  `insideNhaB: {\n      pos: { x: 58.5, y: 6.5, z: -35.0 },\n      target: { x: 64.0, y: 1.8, z: -56.0 },\n      name: 'Bên trong Xưởng B (Dây chuyền 30m & Kho)',\n    },`
);

configCode = configCode.replace(
  /insideAssemblyLine:\s*\{\s*pos:\s*\{\s*x:\s*[\d.]+,\s*y:\s*[\d.]+,\s*z:\s*[-\d.]+\s*\},\s*target:\s*\{\s*x:\s*[\d.]+,\s*y:\s*[\d.]+,\s*z:\s*[-\d.]+\s*\},\s*name:\s*'[^\']+'\s*\},/g,
  `insideAssemblyLine: {\n      pos: { x: 61.2, y: 3.2, z: -43.0 },\n      target: { x: 63.8, y: 1.8, z: -55.0 },\n      name: 'Dây chuyền lắp ráp DK Bike (Dài 30m)',\n    },`
);

configCode = configCode.replace(
  /insidePartsRacks:\s*\{\s*pos:\s*\{\s*x:\s*[\d.]+,\s*y:\s*[\d.]+,\s*z:\s*[-\d.]+\s*\},\s*target:\s*\{\s*x:\s*[\d.]+,\s*y:\s*[\d.]+,\s*z:\s*[-\d.]+\s*\},\s*name:\s*'[^\']+'\s*\},/g,
  `insidePartsRacks: {\n      pos: { x: 66.5, y: 3.8, z: -50.0 },\n      target: { x: 71.4, y: 2.5, z: -56.0 },\n      name: 'Giá kệ kho linh kiện 4 tầng',\n    },`
);

configCode = configCode.replace(
  /insideStagingArea:\s*\{\s*pos:\s*\{\s*x:\s*[\d.]+,\s*y:\s*[\d.]+,\s*z:\s*[-\d.]+\s*\},\s*target:\s*\{\s*x:\s*[\d.]+,\s*y:\s*[\d.]+,\s*z:\s*[-\d.]+\s*\},\s*name:\s*'[^\']+'\s*\},/g,
  `insideStagingArea: {\n      pos: { x: 62.5, y: 3.2, z: -45.0 },\n      target: { x: 58.0, y: 1.5, z: -56.0 },\n      name: 'Khu tập kết 33 xe thành phẩm',\n    },`
);

fs.writeFileSync(configPath, configCode, 'utf8');
console.log('Successfully updated config.js for 10m longer Nha B');

// 2. Update main.js
const mainJsPath = path.join(__dirname, '../src/main.js');
let raw = fs.readFileSync(mainJsPath, 'utf8');
const isCrlf = raw.includes('\r\n');
let code = raw.replace(/\r\n/g, '\n');

// A. Update Test track around longer Nha B
const oldTrackNorth = `  // Test track phía Bắc Nhà B
  const trackNorth = new THREE.Mesh(new THREE.PlaneGeometry(35, 3.2), roadMat);
  trackNorth.rotation.x = -Math.PI / 2;
  trackNorth.position.set(65, 0.05, -69.5);
  trackNorth.receiveShadow = true;
  scene.add(trackNorth);

  // Test track phía Đông Nhà B
  const trackEast = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 45), roadMat);
  trackEast.rotation.x = -Math.PI / 2;
  trackEast.position.set(79, 0.051, -49);
  trackEast.receiveShadow = true;
  scene.add(trackEast);`;

const newTrackNorth = `  // Test track phía Bắc Nhà B (dời theo xưởng dài thêm 10m về Z = -79.5)
  const trackNorth = new THREE.Mesh(new THREE.PlaneGeometry(35, 3.2), roadMat);
  trackNorth.rotation.x = -Math.PI / 2;
  trackNorth.position.set(65, 0.05, -79.5);
  trackNorth.receiveShadow = true;
  scene.add(trackNorth);

  // Test track phía Đông Nhà B (kéo dài theo chiều dài xưởng 55m)
  const trackEast = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 55), roadMat);
  trackEast.rotation.x = -Math.PI / 2;
  trackEast.position.set(79, 0.051, -54);
  trackEast.receiveShadow = true;
  scene.add(trackEast);`;

if (code.includes(oldTrackNorth)) {
  code = code.replace(oldTrackNorth, newTrackNorth);
  console.log('Updated test track road geometry for longer Nha B');
}

// B. Update testTrackBike radius and center in animatedVehicles
const oldTrackBike = `    {
      type: 'testTrackBike',
      mesh: animatedBike,
      angle: 0,
      speed: 0.42,
      centerX: 65,
      centerZ: -50,
      radiusX: 13,
      radiusZ: 19,
    },`;

const newTrackBike = `    {
      type: 'testTrackBike',
      mesh: animatedBike,
      angle: 0,
      speed: 0.38,
      centerX: 65,
      centerZ: -55,
      radiusX: 13,
      radiusZ: 24.5,
    },`;

if (code.includes(oldTrackBike)) {
  code = code.replace(oldTrackBike, newTrackBike);
  console.log('Updated testTrackBike orbit center and radius');
}

// C. Update 3D label for Nha B
code = code.replace(
  `{ text: 'Nhà B (Xưởng 3 tầng)', pos: new THREE.Vector3(65, 14.5, -50), id: 'nhaB' },`,
  `{ text: 'Nhà B (Xưởng 3 tầng - Dài 44m)', pos: new THREE.Vector3(65, 14.5, -55), id: 'nhaB' },`
);

// D. Update roof check bounds in smoothFocusOnPoint
code = code.replace(
  `const isInsideNhaB = (targetPoint.x >= 53.0 && targetPoint.x <= 77.0 && targetPoint.z >= -67.0 && targetPoint.z <= -33.0 && targetPoint.y <= 14.0);`,
  `const isInsideNhaB = (targetPoint.x >= 53.0 && targetPoint.x <= 77.0 && targetPoint.z >= -78.0 && targetPoint.z <= -33.0 && targetPoint.y <= 14.0);`
);

// E. Completely Overhaul buildNhaBInterior:
// - Remove ALL interior columns and transverse/longitudinal I-beams ("Bỏ các cột trụ rầm cho đỡ vướng")
// - Extend assembly line to ~30 meters with 8 progressive assembly stages
// - Extend scooter staging area to 33 bikes in 3 columns
// - Extend warehouse racks to 6 bays
// - Keep wide clear polished concrete aisles
const oldInteriorStart = `// Hàm khởi tạo toàn bộ nội thất chi tiết Xưởng B chuẩn tỉ lệ kiến trúc, xưởng rộng rãi, dây chuyền chuyển động chậm
function buildNhaBInterior(group, cfg) {`;
const oldInteriorEnd = `  group.add(interiorGroup);
}

// Hàm khởi tạo Cửa cuốn công nghiệp có thể mở/đóng và lộ dây chuyền bên trong`;

const interiorStartIdx = code.indexOf(oldInteriorStart);
const interiorEndIdx = code.indexOf(oldInteriorEnd);

if (interiorStartIdx === -1 || interiorEndIdx === -1) {
  console.error('Could not find buildNhaBInterior bounds');
  process.exit(1);
}

const newBuildNhaBInterior = `// Hàm khởi tạo toàn bộ nội thất chi tiết Xưởng B: Dài hơn 10m, dây chuyền 30m, KHÔNG CỘT TRỤ RẦM (Không gian mở thông thoáng 100%)
function buildNhaBInterior(group, cfg) {
  const interiorGroup = new THREE.Group();
  interiorGroup.name = 'nhaBInterior';

  // Reset các mảng hoạt cảnh dây chuyền
  insideAssemblyBikes = [];
  insideConveyorSlats = [];
  insideAssemblyWorkers = [];

  const steelMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.45, metalness: 0.6 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 });
  const blueFrameMat = new THREE.MeshStandardMaterial({ color: 0x184995, roughness: 0.35, metalness: 0.25 }); // Xanh DK Bike
  const orangeRackMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.35 }); // Cam selective rack
  const blueRackMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.4 });   // Xanh chân kệ
  const yellowHazardMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.3 }); // Vàng an toàn thang tời
  const crateBlueMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4 });
  const crateRedMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.4 });
  const cartonMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.9 });
  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.1, metalness: 0.85 });

  // ==========================================================================
  // A. KHÔNG GIAN TRẦN & CHIẾU SÁNG CAO CẤP (ĐÃ BỎ HOÀN TOÀN CỘT TRỤ & DẦM NGANG/DỌC CHO ĐỠ VƯỚNG)
  // Không gian thông thủy 100% không vướng cột, nhìn xuyên suốt từ đầu xưởng đến cuối xưởng
  // ==========================================================================

  // Đường ống cứu hỏa PCCC sơn đỏ chạy sát mép trần trên cao
  const pipeMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.35, metalness: 0.3 });
  const firePipe = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, cfg.depth - 2, 8), pipeMat);
  firePipe.rotation.x = Math.PI / 2;
  firePipe.position.set(-cfg.width / 2 + 1.2, cfg.height - 0.4, 0);
  interiorGroup.add(firePipe);

  // Quạt trần công nghiệp HVLS cánh lớn sải rộng treo sát mái (không vướng tầm mắt dưới sàn)
  [-3.5, 3.5].forEach((fx, fIdx) => {
    const fz = fIdx === 0 ? -6.0 : 6.0;
    const fanGroup = new THREE.Group();
    fanGroup.position.set(fx, cfg.height - 1.2, fz);

    const fMotor = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 0.4, 12), darkMat);
    fanGroup.add(fMotor);

    const fRotor = new THREE.Group();
    for (let b = 0; b < 6; b++) {
      const blade = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.035, 0.2), blueFrameMat);
      blade.position.x = 1.4;
      const bWrapper = new THREE.Group();
      bWrapper.rotation.y = (b / 6) * Math.PI * 2;
      bWrapper.add(blade);
      fRotor.add(bWrapper);
    }
    fanGroup.add(fRotor);
    insideHVLSFans.push(fRotor);
    interiorGroup.add(fanGroup);
  });

  // Hệ thống đèn LED High-Bay UFO treo trần bố trí dọc theo xưởng dài 44m
  const lampZs = [-16, -9, -2, 5, 12];
  [-3.2, 3.2].forEach((lx) => {
    lampZs.forEach((lz) => {
      // Dây cáp treo thanh mảnh
      const dropWire = new THREE.Mesh(
        new THREE.CylinderGeometry(0.01, 0.01, 1.2, 6),
        steelMat
      );
      dropWire.position.set(lx, cfg.height - 0.6, lz);
      interiorGroup.add(dropWire);

      const lamp = new THREE.Mesh(
        new THREE.CylinderGeometry(0.28, 0.4, 0.14, 12),
        new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, roughness: 0.2 })
      );
      lamp.position.set(lx, cfg.height - 1.25, lz);
      interiorGroup.add(lamp);

      const bulb = new THREE.Mesh(
        new THREE.CylinderGeometry(0.34, 0.34, 0.03, 12),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
      );
      bulb.position.set(lx, cfg.height - 1.32, lz);
      interiorGroup.add(bulb);

      const pLight = new THREE.PointLight(0xfffbeb, 0.82, 16);
      pLight.position.set(lx, cfg.height - 1.45, lz);
      interiorGroup.add(pLight);
      interiorFactoryLights.push(pLight);
    });
  });

  // ==========================================================================
  // B. THANG TỜI HÀNG CÔNG NGHIỆP 2.5 TẤN (Góc Tây Nam: ô vuông 4555mm)
  // ==========================================================================
  const liftGroup = new THREE.Group();
  liftGroup.position.set(-8.8, 0, cfg.depth / 2 - 2.8);

  const lW = 3.4, lD = 2.8, lH = 8.5;
  [[-lW / 2, -lD / 2], [lW / 2, -lD / 2], [-lW / 2, lD / 2], [lW / 2, lD / 2]].forEach(([px, pz]) => {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.16, lH, 0.16), yellowHazardMat);
    post.position.set(px, lH / 2, pz);
    post.castShadow = true;
    liftGroup.add(post);
  });

  for (let ty = 2.0; ty <= lH; ty += 1.8) {
    const ring = new THREE.Mesh(new THREE.BoxGeometry(lW + 0.08, 0.08, lD + 0.08), darkMat);
    ring.position.y = ty;
    liftGroup.add(ring);
  }

  const meshMat = new THREE.MeshStandardMaterial({ color: 0x64748b, wireframe: true, roughness: 0.5 });
  const backMesh = new THREE.Mesh(new THREE.PlaneGeometry(lW, lH), meshMat);
  backMesh.position.set(0, lH / 2, -lD / 2);
  liftGroup.add(backMesh);

  const leftMesh = new THREE.Mesh(new THREE.PlaneGeometry(lD, lH), meshMat);
  leftMesh.rotation.y = Math.PI / 2;
  leftMesh.position.set(-lW / 2, lH / 2, 0);
  liftGroup.add(leftMesh);

  const gate = new THREE.Mesh(new THREE.BoxGeometry(lW - 0.3, 2.2, 0.06), yellowHazardMat);
  gate.position.set(0, 1.1, lD / 2);
  liftGroup.add(gate);

  for (let hz = 0; hz < 6; hz++) {
    const hStripe = new THREE.Mesh(
      new THREE.PlaneGeometry(0.42, 0.14),
      new THREE.MeshBasicMaterial({ color: hz % 2 === 0 ? 0xfacc15 : 0x0f172a })
    );
    hStripe.rotation.x = -Math.PI / 2;
    hStripe.position.set(-1.05 + hz * 0.42, 0.08, lD / 2 + 0.45);
    liftGroup.add(hStripe);
  }

  const winchMotor = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 1.1, 12), steelMat);
  winchMotor.rotation.z = Math.PI / 2;
  winchMotor.position.set(0, lH + 0.3, 0);
  liftGroup.add(winchMotor);

  const liftPlatform = new THREE.Mesh(new THREE.BoxGeometry(lW - 0.4, 0.15, lD - 0.4), steelMat);
  liftPlatform.position.set(0, 0.55, 0);
  liftGroup.add(liftPlatform);

  const ctrlBox = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.4, 0.1), yellowHazardMat);
  ctrlBox.position.set(lW / 2 + 0.12, 1.35, lD / 2);
  liftGroup.add(ctrlBox);

  const liftData = {
    id: 'insideFreightLift',
    title: 'Thang tời hàng công nghiệp 2.5 Tấn (Vị trí góc Tây Nam Xưởng B)',
    type: 'lift',
    desc: 'Hệ thống thang tời hàng thủy lực/cáp kéo tải trọng 2.500 kg, phục vụ chuyển linh kiện động cơ, ắc quy và khung xe giữa các tầng của Xưởng B.',
    zone: 'DK1',
  };
  liftGroup.userData = liftData;
  gate.userData = liftData;
  interactiveObjects.push(gate);
  interiorGroup.add(liftGroup);

  // ==========================================================================
  // C. DÂY CHUYỀN LẮP RÁP XE MÁY ĐIỆN DK BIKE KÉO DÀI 30 MÉT (Không vướng cột, hoạt cảnh chạy chậm)
  // ==========================================================================
  const lineGroup = new THREE.Group();
  const lineX = -1.2;
  lineGroup.position.set(lineX, 0, 0);

  const lineLen = 27.0; // Băng chuyền chính dài 27 mét
  const lineW = 1.05;
  const lineH = 0.62;

  // Băng chuyền chính sơn xanh DK Bike
  const lineBed = new THREE.Mesh(
    new THREE.BoxGeometry(lineW, lineH, lineLen),
    blueFrameMat
  );
  lineBed.position.set(0, lineH / 2, -2.5);
  lineBed.castShadow = true;
  lineGroup.add(lineBed);

  const slatBelt = new THREE.Mesh(
    new THREE.BoxGeometry(lineW - 0.16, 0.04, lineLen - 0.3),
    steelMat
  );
  slatBelt.position.set(0, lineH + 0.02, -2.5);
  lineGroup.add(slatBelt);

  // 36 Tấm nan kim loại của băng chuyền trượt tịnh tiến liên tục
  for (let sIdx = 0; sIdx < 36; sIdx++) {
    const slatZ = -15.5 + sIdx * 0.72;
    const slat = new THREE.Mesh(
      new THREE.BoxGeometry(lineW - 0.22, 0.015, 0.18),
      new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.3, metalness: 0.7 })
    );
    slat.position.set(0, lineH + 0.045, slatZ);
    lineGroup.add(slat);
    insideConveyorSlats.push(slat);
  }

  // Chân đế chữ U đỡ băng tải
  for (let bz = -15.0; bz <= 9.0; bz += 3.0) {
    const legL = new THREE.Mesh(new THREE.BoxGeometry(0.08, lineH, 0.08), steelMat);
    legL.position.set(-lineW / 2 + 0.05, lineH / 2, bz);
    lineGroup.add(legL);
    const legR = legL.clone();
    legR.position.x = lineW / 2 - 0.05;
    lineGroup.add(legR);
  }

  // CẦU TRƯỢT DỐC XUỐNG XE THÀNH PHẨM (Dài 3.5m)
  const rampLen = 3.5;
  const rampGeo = new THREE.BoxGeometry(lineW + 0.1, 0.06, rampLen);
  const ramp = new THREE.Mesh(rampGeo, blueFrameMat);
  ramp.position.set(0, lineH / 2 + 0.02, 11.5);
  ramp.rotation.x = Math.atan2(lineH, rampLen);
  ramp.castShadow = true;
  lineGroup.add(ramp);

  // Vạch kẻ an toàn quanh chân cầu trượt
  const rampSafetyMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
  const rampLine1 = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 4.2), rampSafetyMat);
  rampLine1.rotation.x = -Math.PI / 2;
  rampLine1.position.set(-lineW / 2 - 0.35, 0.08, 11.8);
  lineGroup.add(rampLine1);

  const rampLine2 = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 4.2), rampSafetyMat);
  rampLine2.rotation.x = -Math.PI / 2;
  rampLine2.position.set(lineW / 2 + 0.35, 0.08, 11.8);
  lineGroup.add(rampLine2);

  // TỦ ĐIỆN ĐIỀU KHIỂN HMI & ĐÈN BÁO
  const ctrlCabinet = new THREE.Group();
  ctrlCabinet.position.set(-lineW / 2 - 0.75, 0, 9.5);

  const cabBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.65, 1.45, 0.48),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.35 })
  );
  cabBody.position.y = 1.45 / 2;
  cabBody.castShadow = true;
  ctrlCabinet.add(cabBody);

  const screenHMI = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.22), new THREE.MeshBasicMaterial({ color: 0x0284c7 }));
  screenHMI.position.set(0, 1.05, 0.25);
  ctrlCabinet.add(screenHMI);

  const stackPole = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.35, 8), steelMat);
  stackPole.position.set(0.2, 1.45 + 0.17, 0);
  ctrlCabinet.add(stackPole);

  const greenBeacon = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.08, 8), new THREE.MeshBasicMaterial({ color: 0x22c55e }));
  greenBeacon.position.set(0.2, 1.45 + 0.38, 0);
  ctrlCabinet.add(greenBeacon);

  lineGroup.add(ctrlCabinet);

  // KHUNG GIÀN TREO DÂY CHUYỀN SPAN 30 MÉT & ĐÈN SOI
  const gantryMat = new THREE.MeshStandardMaterial({ color: 0x184995, roughness: 0.4 });
  const gantryZs = [-15.0, -9.0, -3.0, 3.0, 9.0];

  gantryZs.forEach((gz) => {
    const gPostL = new THREE.Mesh(new THREE.BoxGeometry(0.07, 2.4, 0.07), gantryMat);
    gPostL.position.set(-lineW / 2 - 0.08, 1.2, gz);
    lineGroup.add(gPostL);

    const gPostR = new THREE.Mesh(new THREE.BoxGeometry(0.07, 2.4, 0.07), gantryMat);
    gPostR.position.set(lineW / 2 + 0.08, 1.2, gz);
    lineGroup.add(gPostR);

    const gBeam = new THREE.Mesh(new THREE.BoxGeometry(lineW + 0.25, 0.07, 0.07), gantryMat);
    gBeam.position.set(0, 2.38, gz);
    lineGroup.add(gBeam);
  });

  const signBanner = new THREE.Mesh(new THREE.BoxGeometry(lineW + 0.35, 0.32, 0.05), blueFrameMat);
  signBanner.position.set(0, 2.48, 9.0);
  lineGroup.add(signBanner);

  const taskLight = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 0.04, lineLen - 1),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  taskLight.position.set(0, 2.32, -2.5);
  lineGroup.add(taskLight);

  // 8 CÔNG ĐOẠN XE TRÊN DÂY CHUYỀN (Xe hướng thẳng theo chiều chuyền: rotation.y = -Math.PI / 2)
  const bikeScale = 0.78;

  // Stage 0: Khung sườn kim loại trần trên đồ gá jig
  const stage0 = new THREE.Group();
  const jig0 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.12, 0.5), steelMat);
  jig0.position.y = 0.06;
  stage0.add(jig0);
  const rawFrameMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.28, 0.65, 1.2),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5, metalness: 0.6 })
  );
  rawFrameMesh.position.y = 0.45;
  stage0.add(rawFrameMesh);
  stage0.position.set(0, lineH + 0.02, -15.0);
  lineGroup.add(stage0);
  insideAssemblyBikes.push({ mesh: stage0, startZ: -15.0, baseY: lineH + 0.02 });

  // Stage 1: Lắp càng sau & giảm xóc đôi
  const stage1 = createDetailedDKBike(0x0284c7, 'Xe lắp càng & giảm xóc');
  stage1.scale.set(bikeScale, bikeScale, bikeScale);
  stage1.rotation.y = -Math.PI / 2;
  stage1.position.set(0, lineH + 0.05, -11.5);
  lineGroup.add(stage1);
  insideAssemblyBikes.push({ mesh: stage1, startZ: -11.5, baseY: lineH + 0.05 });

  // Stage 2: Lắp động cơ điện BLDC & vành đúc
  const stage2 = createDetailedDKBike(0x0284c7, 'Xe lắp động cơ BLDC');
  stage2.scale.set(bikeScale, bikeScale, bikeScale);
  stage2.rotation.y = -Math.PI / 2;
  stage2.position.set(0, lineH + 0.05, -8.0);
  lineGroup.add(stage2);
  insideAssemblyBikes.push({ mesh: stage2, startZ: -8.0, baseY: lineH + 0.05 });

  // Stage 3: Lắp hộc ắc quy & bó dây điện sườn
  const stage3 = createDetailedDKBike(0xdc2626, 'Xe lắp ắc quy & hệ điện');
  stage3.scale.set(bikeScale, bikeScale, bikeScale);
  stage3.rotation.y = -Math.PI / 2;
  stage3.position.set(0, lineH + 0.05, -4.5);
  lineGroup.add(stage3);
  insideAssemblyBikes.push({ mesh: stage3, startZ: -4.5, baseY: lineH + 0.05 });

  // Stage 4: Lắp giảm xóc trước telescopic & ghi đông phanh đĩa
  const stage4 = createDetailedDKBike(0xdc2626, 'Xe lắp ghi đông & phanh ABS');
  stage4.scale.set(bikeScale, bikeScale, bikeScale);
  stage4.rotation.y = -Math.PI / 2;
  stage4.position.set(0, lineH + 0.05, -1.0);
  lineGroup.add(stage4);
  insideAssemblyBikes.push({ mesh: stage4, startZ: -1.0, baseY: lineH + 0.05 });

  // Stage 5: Lắp đồng hồ LED kỹ thuật số & tay ga
  const stage5 = createDetailedDKBike(0x64748b, 'Xe kết nối đồng hồ LED');
  stage5.scale.set(bikeScale, bikeScale, bikeScale);
  stage5.rotation.y = -Math.PI / 2;
  stage5.position.set(0, lineH + 0.05, 2.5);
  lineGroup.add(stage5);
  insideAssemblyBikes.push({ mesh: stage5, startZ: 2.5, baseY: lineH + 0.05 });

  // Stage 6: Lắp dàn áo yếm nhựa & yên da caramel
  const stage6 = createDetailedDKBike(0x64748b, 'DK Roma SX Gần Hoàn Thiện');
  stage6.scale.set(bikeScale, bikeScale, bikeScale);
  stage6.rotation.y = -Math.PI / 2;
  stage6.position.set(0, lineH + 0.05, 6.0);
  lineGroup.add(stage6);
  insideAssemblyBikes.push({ mesh: stage6, startZ: 6.0, baseY: lineH + 0.05 });

  // Stage 7: Xe hoàn chỉnh lăn bánh xuống dốc
  const stage7 = createDetailedDKBike(0xf8fafc, 'DK Roma SX Trắng Ngọc Trai');
  stage7.scale.set(bikeScale, bikeScale, bikeScale);
  stage7.rotation.y = -Math.PI / 2;
  stage7.position.set(0, lineH + 0.05, 9.5);
  lineGroup.add(stage7);
  insideAssemblyBikes.push({ mesh: stage7, startZ: 9.5, baseY: lineH + 0.05 });

  // Công nhân thao tác dọc dây chuyền
  const workerConfigs = [
    { z: -13.0, side: -1, phase: 0 },
    { z: -9.5,  side: 1,  phase: 1.2 },
    { z: -6.0,  side: -1, phase: 2.4 },
    { z: -2.5,  side: 1,  phase: 3.6 },
    { z: 1.0,   side: -1, phase: 4.8 },
    { z: 4.5,   side: 1,  phase: 6.0 },
  ];

  workerConfigs.forEach((wc) => {
    const w = createCharacter({ shirtColor: 0x0284c7, pantsColor: 0x1e293b, hatColor: 0x0284c7, role: 'worker', heightScale: 0.95 });
    w.scale.set(0.95, 0.95, 0.95);
    w.position.set(wc.side * (lineW / 2 + 0.42), 0, wc.z);
    w.rotation.y = wc.side < 0 ? Math.PI / 2 : -Math.PI / 2;
    lineGroup.add(w);
    insideAssemblyWorkers.push({ mesh: w, phase: wc.phase });
  });

  const lineData = {
    id: 'insideAssemblyLine',
    title: 'Dây chuyền lắp ráp xe máy điện tự động DK Bike (Dài 30m)',
    type: 'assemblyLine',
    desc: 'Dây chuyền lắp ráp kéo dài 30 mét với 8 trạm công đoạn đồng bộ, vận hành êm đềm liên tục, xuất xe thành phẩm qua cầu dốc xanh.',
    zone: 'DK1',
  };
  lineGroup.userData = lineData;
  lineBed.userData = lineData;
  ramp.userData = lineData;
  interactiveObjects.push(lineBed);
  interactiveObjects.push(ramp);
  interiorGroup.add(lineGroup);

  // ==========================================================================
  // D. KHU TẬP KẾT XE THÀNH PHẨM (Mở rộng theo chiều dài xưởng: 33 xe thành phẩm, 3 hàng thẳng tắp)
  // ==========================================================================
  const stagingGroup = new THREE.Group();
  stagingGroup.position.set(-6.8, 0, -3.5);

  const lotW = 4.2, lotD = 23.5;
  const lotMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
  const lotBorder = new THREE.Mesh(new THREE.PlaneGeometry(lotW, lotD), lotMat);
  lotBorder.rotation.x = -Math.PI / 2;
  lotBorder.position.set(0, 0.07, 0);
  stagingGroup.add(lotBorder);

  const lotInner = new THREE.Mesh(
    new THREE.PlaneGeometry(lotW - 0.15, lotD - 0.15),
    new THREE.MeshStandardMaterial({ color: 0x3b4a5d, roughness: 0.35, metalness: 0.15 })
  );
  lotInner.rotation.x = -Math.PI / 2;
  lotInner.position.set(0, 0.075, 0);
  stagingGroup.add(lotInner);

  // Vạch kẻ chia từng ô đỗ xe ngay ngắn
  const stallLineMat = new THREE.MeshBasicMaterial({ color: 0xfde047 });
  for (let sz = -10.5; sz <= 10.5; sz += 2.0) {
    const sLine = new THREE.Mesh(new THREE.PlaneGeometry(lotW - 0.25, 0.05), stallLineMat);
    sLine.rotation.x = -Math.PI / 2;
    sLine.position.set(0, 0.08, sz);
    stagingGroup.add(sLine);
  }

  // 33 Xe máy điện DK Roma SX xếp thành 3 hàng x 11 xe thẳng tắp, tất cả quay mũi ra cửa Nam
  const bikeColors = [
    0x64748b, // Xám xi măng đặc trưng
    0x64748b,
    0xf8fafc, // Trắng ngọc trai
    0x64748b,
    0xdc2626, // Đỏ đô
    0x0f172a, // Đen bóng
    0x0284c7, // Xanh cyan
    0x64748b,
  ];

  const colOffsets = [-1.3, 0.0, 1.3];
  colOffsets.forEach((colX, cIdx) => {
    for (let row = 0; row < 11; row++) {
      const rowZ = -10.0 + row * 2.0;
      const colHex = bikeColors[(cIdx * 11 + row) % bikeColors.length];
      const bike = createDetailedDKBike(colHex, \`DK Roma SX Lô #\${cIdx + 1}-\${row + 1}\`);
      bike.scale.set(bikeScale, bikeScale, bikeScale);
      bike.rotation.y = -Math.PI / 2; // Hướng thẳng ra cửa xuất hàng Nam!
      bike.position.set(colX, 0, rowZ);
      stagingGroup.add(bike);
    }
  });

  const stagingData = {
    id: 'insideStagingArea',
    title: 'Khu tập kết 33 xe máy điện thành phẩm sau kiểm định KCS (Xưởng B)',
    type: 'staging',
    desc: 'Khu vực tập kết 33 xe máy điện DK Roma SX hoàn thiện (xám xi măng, trắng ngọc trai, đỏ đô, đen bóng) xếp hàng ngay ngắn trên sàn bê tông phẳng mịn.',
    zone: 'DK1',
  };
  stagingGroup.userData = stagingData;
  lotInner.userData = stagingData;
  interactiveObjects.push(lotInner);
  interiorGroup.add(stagingGroup);

  // ==========================================================================
  // E. HỆ THỐNG GIÁ KỆ KHO LINH KIỆN & PALLET ĐỘNG CƠ (6 Dãy Selective Racking 4 tầng phía Đông)
  // ==========================================================================
  const rackBlocks = [
    { z: -15.5, name: 'Kệ selective K01: Pallet động cơ điện BLDC & IC điều tốc' },
    { z: -10.0, name: 'Kệ selective K02: Thùng phụ tùng nhựa dàn áo & yếm xe' },
    { z: -4.5,  name: 'Kệ selective K03: Cụm giảm xóc thủy lực, vành đúc & lốp không săm' },
    { z: 1.0,   name: 'Kệ selective K04: Phụ kiện ốc vít, chốt định vị & bó dây điện' },
    { z: 6.5,   name: 'Kệ selective K05: Khay linh kiện lắp ráp nhanh & phụ kiện đèn còi' },
    { z: 12.0,  name: 'Kệ selective K06: Bộ sạc thông minh & bình ắc quy dự trữ' },
  ];

  rackBlocks.forEach((rb, rbIdx) => {
    const rackGroup = new THREE.Group();
    rackGroup.position.set(6.4, 0, rb.z);

    const rW = 4.2;
    const rD = 1.1;
    const rH = 4.4;

    [[-rW / 2, -rD / 2], [rW / 2, -rD / 2], [-rW / 2, rD / 2], [rW / 2, rD / 2], [0, -rD / 2], [0, rD / 2]].forEach(([px, pz]) => {
      const col = new THREE.Mesh(new THREE.BoxGeometry(0.09, rH, 0.09), blueRackMat);
      col.position.set(px, rH / 2, pz);
      col.castShadow = true;
      rackGroup.add(col);
    });

    for (let tier = 1; tier <= 4; tier++) {
      const beamY = tier * 1.0;

      [-rD / 2, rD / 2].forEach((bz) => {
        const beam = new THREE.Mesh(new THREE.BoxGeometry(rW, 0.07, 0.05), orangeRackMat);
        beam.position.set(0, beamY, bz);
        rackGroup.add(beam);
      });

      const shelfDeck = new THREE.Mesh(new THREE.BoxGeometry(rW - 0.1, 0.025, rD - 0.1), steelMat);
      shelfDeck.position.set(0, beamY + 0.02, 0);
      rackGroup.add(shelfDeck);

      [-rW / 4, rW / 4].forEach((px, pIdx) => {
        if ((tier + rbIdx + pIdx) % 2 === 0) {
          const pallet = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.09, 0.9), cartonMat);
          pallet.position.set(px, beamY + 0.07, 0);
          rackGroup.add(pallet);

          const cBox = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.52, 0.82), cartonMat);
          cBox.position.set(px, beamY + 0.38, 0);
          cBox.castShadow = true;
          rackGroup.add(cBox);
        } else {
          for (let kx = -0.32; kx <= 0.32; kx += 0.42) {
            const cMat = (kx > 0) ? crateRedMat : crateBlueMat;
            const crate = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.25, 0.6), cMat);
            crate.position.set(px + kx, beamY + 0.15, 0);
            rackGroup.add(crate);
          }
        }
      });
    }

    const rackData = {
      id: 'insidePartsRacks',
      title: rb.name,
      type: 'rack',
      desc: 'Hệ thống giá kệ Selective Racking chịu tải 1.000 kg/tầng, lưu trữ linh kiện động cơ điện BLDC, ắc quy khô, bộ điều khiển IC và phụ tùng cơ khí chính hãng DK Bike.',
      zone: 'DK1',
    };
    rackGroup.userData = rackData;
    interiorGroup.add(rackGroup);
  });

  // Xe đẩy khay nhựa cơ động
  [-4.0, 3.5].forEach((tz) => {
    const cartGroup = new THREE.Group();
    cartGroup.position.set(2.4, 0, tz);

    const cartFrame = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.3, 1.0), blueRackMat);
    cartFrame.position.y = 0.68;
    cartGroup.add(cartFrame);

    for (let cy = 0.28; cy <= 1.1; cy += 0.32) {
      const bCrate = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.18, 0.92), crateBlueMat);
      bCrate.position.y = cy;
      cartGroup.add(bCrate);
    }
    interiorGroup.add(cartGroup);
  });

  // Xe nâng tay màu vàng (Manual Pallet Jack theo ghi chú trên bản vẽ PDF: "Dùng xe nâng tay")
  const palletJack = new THREE.Group();
  palletJack.position.set(2.4, 0, 8.5);

  const forkL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, 1.1), yellowHazardMat);
  forkL.position.set(-0.2, 0.05, 0);
  palletJack.add(forkL);
  const forkR = forkL.clone();
  forkR.position.x = 0.2;
  palletJack.add(forkR);

  const jackHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.85, 8), darkMat);
  jackHandle.rotation.x = -0.3;
  jackHandle.position.set(0, 0.45, 0.65);
  palletJack.add(jackHandle);

  const jackPallet = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.08, 0.8), cartonMat);
  jackPallet.position.set(0, 0.12, 0);
  palletJack.add(jackPallet);

  const jackBox = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.45, 0.7), cartonMat);
  jackBox.position.set(0, 0.38, 0);
  palletJack.add(jackBox);

  interiorGroup.add(palletJack);

  // Pallet động cơ dự phòng sát vách Bắc (45 pallet theo PDF layout)
  for (let mx = -4.5; mx <= 4.5; mx += 1.8) {
    const mPallet = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.09, 0.95), cartonMat);
    mPallet.position.set(mx, 0.05, -cfg.depth / 2 + 1.2);
    interiorGroup.add(mPallet);

    const mStack = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.58, 0.85), cartonMat);
    mStack.position.set(mx, 0.38, -cfg.depth / 2 + 1.2);
    interiorGroup.add(mStack);
  }

  // ==========================================================================
  // F. SÀN BÊ TÔNG ĐÁNH BÓNG & HÀNH LANG RỘNG MÊNH MÔNG (3.5M - 6.0M THÔNG THOÁNG)
  // ==========================================================================
  const safetyLineMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
  const cLineL = new THREE.Mesh(new THREE.PlaneGeometry(0.08, cfg.depth - 4), safetyLineMat);
  cLineL.rotation.x = -Math.PI / 2;
  cLineL.position.set(-2.2, 0.065, 0);
  interiorGroup.add(cLineL);

  const cLineR = new THREE.Mesh(new THREE.PlaneGeometry(0.08, cfg.depth - 4), safetyLineMat);
  cLineR.rotation.x = -Math.PI / 2;
  cLineR.position.set(3.8, 0.065, 0);
  interiorGroup.add(cLineR);

  group.add(interiorGroup);
}

// Hàm khởi tạo Cửa cuốn công nghiệp có thể mở/đóng và lộ dây chuyền bên trong`;

code = code.substring(0, interiorStartIdx) + newBuildNhaBInterior + code.substring(interiorEndIdx + oldInteriorEnd.length);
console.log('Successfully replaced buildNhaBInterior with clear-span 30m assembly line');

// F. Update animation in updateAnimatedObjects for longer 30m line
const oldAnim = `  // DÂY CHUYỀN LẮP RÁP XƯỞNG B VẬN HÀNH CHẬM RÃI (Slow Moving Assembly Line ~0.35 m/s)
  const lineSpeed = 0.35;
  insideAssemblyBikes.forEach((item) => {
    item.mesh.position.z += lineSpeed * delta;
    if (item.mesh.position.z >= 6.8 && item.mesh.position.z <= 9.6) {
      // Đang trượt dốc xuống cầu trượt: nghiêng nhẹ theo dốc
      const rampProgress = (item.mesh.position.z - 6.8) / (9.6 - 6.8);
      item.mesh.position.y = item.baseY - rampProgress * 0.55;
      item.mesh.rotation.x = 0.2;
    } else if (item.mesh.position.z > 9.6) {
      // Chạm chân dốc -> vòng lại điểm bắt đầu của dây chuyền phía Bắc
      item.mesh.position.z = item.startZ;
      item.mesh.position.y = item.baseY;
      item.mesh.rotation.x = 0;
    } else {
      item.mesh.position.y = item.baseY;
      item.mesh.rotation.x = 0;
    }
  });

  // Tấm nan kim loại của băng chuyền trượt tịnh tiến chậm rãi
  insideConveyorSlats.forEach((slat) => {
    slat.position.z += lineSpeed * delta;
    if (slat.position.z > 7.0) {
      slat.position.z -= 18.0;
    }
  });`;

const newAnim = `  // DÂY CHUYỀN LẮP RÁP XƯỞNG B VẬN HÀNH CHẬM RÃI (Dài 30m, vận tốc 0.35 m/s)
  const lineSpeed = 0.35;
  insideAssemblyBikes.forEach((item) => {
    item.mesh.position.z += lineSpeed * delta;
    if (item.mesh.position.z >= 9.6 && item.mesh.position.z <= 13.2) {
      // Đang trượt dốc xuống cầu trượt dài 3.5m: nghiêng nhẹ theo dốc
      const rampProgress = (item.mesh.position.z - 9.6) / (13.2 - 9.6);
      item.mesh.position.y = item.baseY - rampProgress * 0.55;
      item.mesh.rotation.x = 0.18;
    } else if (item.mesh.position.z > 13.2) {
      // Chạm chân dốc -> tuần hoàn mượt mà lại điểm bắt đầu của dây chuyền phía Bắc
      item.mesh.position.z = item.startZ;
      item.mesh.position.y = item.baseY;
      item.mesh.rotation.x = 0;
    } else {
      item.mesh.position.y = item.baseY;
      item.mesh.rotation.x = 0;
    }
  });

  // 36 Tấm nan kim loại của băng chuyền trượt tịnh tiến chậm rãi
  insideConveyorSlats.forEach((slat) => {
    slat.position.z += lineSpeed * delta;
    if (slat.position.z > 9.8) {
      slat.position.z -= 25.2;
    }
  });`;

if (code.includes(oldAnim)) {
  code = code.replace(oldAnim, newAnim);
  console.log('Updated assembly line animation loop for 30m length');
}

if (isCrlf) {
  code = code.replace(/\n/g, '\r\n');
}

fs.writeFileSync(mainJsPath, code, 'utf8');
console.log('Successfully updated main.js');
