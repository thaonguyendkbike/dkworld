const fs = require('fs');
const path = require('path');

// 1. Update config.js: Hills and Windmill preset
const configPath = path.join(__dirname, '../src/config.js');
let configCode = fs.readFileSync(configPath, 'utf8');

// Update dk1 hill in config
configCode = configCode.replace(
  /dk1:\s*\{\s*position:\s*\{\s*x:\s*\d+,\s*y:\s*\d+,\s*z:\s*-\d+\s*\},\s*radius:\s*\d+,\s*height:\s*\d+,/g,
  `dk1: {\n      position: { x: 50, y: 0, z: -135 },\n      radius: 28,\n      height: 20,`
);

// Update windmill preset in config
configCode = configCode.replace(
  /windmill:\s*\{\s*pos:\s*\{\s*x:\s*\d+,\s*y:\s*\d+,\s*z:\s*-\d+\s*\},\s*target:\s*\{\s*x:\s*\d+,\s*y:\s*\d+,\s*z:\s*-\d+\s*\},/g,
  `windmill: {\n      pos: { x: 78, y: 36, z: -100 },\n      target: { x: 58, y: 22, z: -128 },`
);

fs.writeFileSync(configPath, configCode, 'utf8');
console.log('Successfully updated config.js');

// 2. Update main.js
const mainJsPath = path.join(__dirname, '../src/main.js');
let raw = fs.readFileSync(mainJsPath, 'utf8');
const isCrlf = raw.includes('\r\n');
let code = raw.replace(/\r\n/g, '\n');

// A. Global variables for moving assembly line
if (!code.includes('let insideAssemblyBikes = [];')) {
  code = code.replace(
    'let insideHVLSFans = [];',
    'let insideHVLSFans = [];\nlet insideAssemblyBikes = [];\nlet insideConveyorSlats = [];\nlet insideAssemblyWorkers = [];'
  );
}

// B. Remove duplicate hill1 in buildDK1PylonsAndLandscape
const oldHill1 = `  // Hill DK1 (North)
  const hill1Cfg = CONFIG.HILLS.dk1;
  const hill1 = new THREE.Mesh(
    new THREE.ConeGeometry(hill1Cfg.radius, hill1Cfg.height, 9),
    new THREE.MeshStandardMaterial({ color: hill1Cfg.color, roughness: 0.9, flatShading: true })
  );
  hill1.position.set(hill1Cfg.position.x, hill1Cfg.height / 2 - 2, hill1Cfg.position.z);
  hill1.receiveShadow = true;
  scene.add(hill1);`;

const newHill1 = `  // Hill DK1 (North) - Toàn bộ đồi núi được quản lý thống nhất bởi interiorHills trong dioramaGroup, tránh chèn lấn vào Nhà B`;

if (code.includes(oldHill1)) {
  code = code.replace(oldHill1, newHill1);
  console.log('Removed duplicate hill1 from buildDK1PylonsAndLandscape');
}

// C. Fix interiorHills to pull the windmill hill back to Z = -128 (base ends at Z = -92, away from Nha B)
const oldInteriorHills = `  const interiorHills = [
    { x: 55, y: 14, z: -108, radius: 54, height: 28, color: 0x22c55e, segs: 10 },  // Đồi cối xay gió
    { x: 115, y: 11, z: -75, radius: 25, height: 22, color: 0x16a34a, segs: 9 },   // Đồi Đông xa (sau sông và đường ray, không lấn ray)
    { x: 116, y: 9, z: -20, radius: 22, height: 18, color: 0x15803d, segs: 9 },    // Đồi Đông Nam xa (không chèn ray hay Nhà B)
    { x: 50, y: 11, z: -108, radius: 32, height: 22, color: 0x22c55e, segs: 9 },   // Đồi sau Nhà B (lùi hẳn về Bắc)
    { x: -145, y: 15, z: -155, radius: 48, height: 30, color: 0x15803d, segs: 10 }, // Đồi góc Tây Bắc bên trong hình vuông
    { x: 75, y: 15, z: -160, radius: 46, height: 30, color: 0x166534, segs: 10 },  // Đồi góc Đông Bắc bên trong hình vuông
    { x: -60, y: 16, z: -160, radius: 52, height: 32, color: 0x15803d, segs: 10 }, // Đồi sườn Bắc bên trong hình vuông
    { x: -138, y: 9, z: 72, radius: 32, height: 18, color: 0x166534, segs: 9 },    // Đồi góc Tây Nam (lùi sâu xuống góc, không chạm DK2)
  ];`;

const newInteriorHills = `  const interiorHills = [
    { x: 58, y: 13, z: -128, radius: 36, height: 26, color: 0x22c55e, segs: 10 },  // Đồi cối xay gió lùi xa về phía Bắc (Z = -128, chân đồi kết thúc tại Z = -92, cách Nhà B > 24m)
    { x: 115, y: 11, z: -80, radius: 24, height: 22, color: 0x16a34a, segs: 9 },   // Đồi Đông xa (sau sông và đường ray, không lấn ray)
    { x: 116, y: 9, z: -25, radius: 20, height: 18, color: 0x15803d, segs: 9 },    // Đồi Đông Nam xa (không chèn ray hay Nhà B)
    { x: -145, y: 15, z: -155, radius: 48, height: 30, color: 0x15803d, segs: 10 }, // Đồi góc Tây Bắc bên trong hình vuông
    { x: 75, y: 15, z: -160, radius: 46, height: 30, color: 0x166534, segs: 10 },  // Đồi góc Đông Bắc bên trong hình vuông
    { x: -60, y: 16, z: -160, radius: 52, height: 32, color: 0x15803d, segs: 10 }, // Đồi sườn Bắc bên trong hình vuông
    { x: -138, y: 9, z: 72, radius: 32, height: 18, color: 0x166534, segs: 9 },    // Đồi góc Tây Nam (lùi sâu xuống góc, không chạm DK2)
  ];`;

if (code.includes(oldInteriorHills)) {
  code = code.replace(oldInteriorHills, newInteriorHills);
  console.log('Fixed interiorHills positions to keep >24m clearance behind Nha B');
}

// D. Windmill position update
code = code.replace(
  'windmillGroup.position.set(55, 25.5, -108);',
  'windmillGroup.position.set(58, 24.5, -128);'
);
code = code.replace(
  `{ text: '🌾 Cối xay gió sinh thái', pos: new THREE.Vector3(55, 34.0, -108), id: 'windmill' },`,
  `{ text: '🌾 Cối xay gió sinh thái', pos: new THREE.Vector3(58, 33.0, -128), id: 'windmill' },`
);

// E. Overhaul buildNhaBInterior
const oldInteriorStart = `// Hàm khởi tạo toàn bộ nội thất chi tiết Xưởng B theo đúng ảnh thực tế & bản vẽ layout
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

const newBuildNhaBInterior = `// Hàm khởi tạo toàn bộ nội thất chi tiết Xưởng B chuẩn tỉ lệ kiến trúc, xưởng rộng rãi, dây chuyền chuyển động chậm
function buildNhaBInterior(group, cfg) {
  const interiorGroup = new THREE.Group();
  interiorGroup.name = 'nhaBInterior';

  // Reset các mảng hoạt cảnh dây chuyền
  insideAssemblyBikes = [];
  insideConveyorSlats = [];
  insideAssemblyWorkers = [];

  const steelMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.45, metalness: 0.6 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 });
  const columnMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.8 }); // Cột bê tông vàng kem như ảnh 1 & 2
  const blueFrameMat = new THREE.MeshStandardMaterial({ color: 0x184995, roughness: 0.35, metalness: 0.25 }); // Xanh DK Bike
  const orangeRackMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.35 }); // Cam selective rack
  const blueRackMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.4 });   // Xanh chân kệ
  const yellowHazardMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.3 }); // Vàng an toàn thang tời
  const crateBlueMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4 });
  const crateRedMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.4 });
  const cartonMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.9 });
  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.1, metalness: 0.85 });

  // --------------------------------------------------------------------------
  // A. HỆ CỘT CHỊU LỰC VUÔNG BÊ TÔNG VÀNG KEM & DẦM THÉP I TRẦN (Khoảng vượt nhịp rộng 11m)
  // --------------------------------------------------------------------------
  const columnXs = [-5.5, 5.5];
  const columnZs = [-12.0, -4.0, 4.0, 12.0];

  columnXs.forEach((cx) => {
    columnZs.forEach((cz) => {
      // Cột bê tông vuông thanh thoát chuẩn tỉ lệ (0.62m x 0.62m)
      const col = new THREE.Mesh(new THREE.BoxGeometry(0.62, cfg.height - 0.5, 0.62), columnMat);
      col.position.set(cx, (cfg.height - 0.5) / 2, cz);
      col.castShadow = true;
      interiorGroup.add(col);

      // Chân cột ốp thép chống va đập
      const kick = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.4, 0.72), darkMat);
      kick.position.set(cx, 0.2, cz);
      interiorGroup.add(kick);
    });
  });

  // Dầm thép chữ I ngang & dọc trần nhà xưởng (Slate Gray I-Beams)
  columnZs.forEach((cz) => {
    const beamTrans = new THREE.Mesh(new THREE.BoxGeometry(cfg.width - 0.8, 0.5, 0.25), steelMat);
    beamTrans.position.set(0, cfg.height - 1.2, cz);
    interiorGroup.add(beamTrans);
  });

  columnXs.forEach((cx) => {
    const beamLong = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.5, cfg.depth - 0.8), steelMat);
    beamLong.position.set(cx, cfg.height - 0.95, 0);
    interiorGroup.add(beamLong);
  });

  // Đường ống cứu hỏa PCCC sơn đỏ chạy dọc trần xưởng
  const pipeMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.35, metalness: 0.3 });
  const firePipe = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, cfg.depth - 2, 8), pipeMat);
  firePipe.rotation.x = Math.PI / 2;
  firePipe.position.set(-2.5, cfg.height - 1.6, 0);
  interiorGroup.add(firePipe);

  // Khẩu hiệu sản xuất trên dầm ngang (như trong ảnh 1 & 2)
  const sloganMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.3 });
  const banner1 = new THREE.Mesh(new THREE.BoxGeometry(10.5, 0.75, 0.06), sloganMat);
  banner1.position.set(0, cfg.height - 1.2, -4.0);
  interiorGroup.add(banner1);

  // Quạt trần công nghiệp HVLS cánh lớn sải rộng (như ảnh 1 & 3)
  [-3.5, 3.5].forEach((fx, fIdx) => {
    const fz = fIdx === 0 ? 0.0 : -4.0;
    const fanGroup = new THREE.Group();
    fanGroup.position.set(fx, cfg.height - 1.8, fz);

    const fMotor = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 0.45, 12), darkMat);
    fanGroup.add(fMotor);

    const fRotor = new THREE.Group();
    for (let b = 0; b < 6; b++) {
      const blade = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.04, 0.2), blueFrameMat);
      blade.position.x = 1.35;
      const bWrapper = new THREE.Group();
      bWrapper.rotation.y = (b / 6) * Math.PI * 2;
      bWrapper.add(blade);
      fRotor.add(bWrapper);
    }
    fanGroup.add(fRotor);
    insideHVLSFans.push(fRotor);
    interiorGroup.add(fanGroup);
  });

  // Hệ thống đèn LED High-Bay UFO treo trần
  const lampPositions = [
    [-2.5, -9], [-2.5, -1], [-2.5, 7],
    [3.5, -9], [3.5, -1], [3.5, 7],
  ];
  lampPositions.forEach(([lx, lz]) => {
    const lamp = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.42, 0.15, 12),
      new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, roughness: 0.2 })
    );
    lamp.position.set(lx, cfg.height - 2.1, lz);
    interiorGroup.add(lamp);

    const bulb = new THREE.Mesh(
      new THREE.CylinderGeometry(0.36, 0.36, 0.03, 12),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    bulb.position.set(lx, cfg.height - 2.18, lz);
    interiorGroup.add(bulb);

    const pLight = new THREE.PointLight(0xfffbeb, 0.85, 15);
    pLight.position.set(lx, cfg.height - 2.35, lz);
    interiorGroup.add(pLight);
    interiorFactoryLights.push(pLight);
  });

  // --------------------------------------------------------------------------
  // B. THANG TỜI HÀNG CÔNG NGHIỆP 2.5 TẤN (Góc Tây Nam theo bản vẽ PDF: ô vuông 4555mm)
  // --------------------------------------------------------------------------
  const liftGroup = new THREE.Group();
  liftGroup.position.set(-8.8, 0, 13.0);

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

  // Cửa xếp trượt thép an toàn có vạch sơn phản quang vàng đen
  const gate = new THREE.Mesh(new THREE.BoxGeometry(lW - 0.3, 2.2, 0.06), yellowHazardMat);
  gate.position.set(0, 1.1, lD / 2);
  liftGroup.add(gate);

  // Vạch sọc vàng đen phản quang cảnh báo trước cửa thang tời
  for (let hz = 0; hz < 6; hz++) {
    const hStripe = new THREE.Mesh(
      new THREE.PlaneGeometry(0.42, 0.14),
      new THREE.MeshBasicMaterial({ color: hz % 2 === 0 ? 0xfacc15 : 0x0f172a })
    );
    hStripe.rotation.x = -Math.PI / 2;
    hStripe.position.set(-1.05 + hz * 0.42, 0.08, lD / 2 + 0.45);
    liftGroup.add(hStripe);
  }

  // Motor tời cáp & tang cuốn trên đỉnh
  const winchMotor = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 1.1, 12), steelMat);
  winchMotor.rotation.z = Math.PI / 2;
  winchMotor.position.set(0, lH + 0.3, 0);
  liftGroup.add(winchMotor);

  // Sàn nâng buồng thang tời bên trong
  const liftPlatform = new THREE.Mesh(new THREE.BoxGeometry(lW - 0.4, 0.15, lD - 0.4), steelMat);
  liftPlatform.position.set(0, 0.55, 0);
  liftGroup.add(liftPlatform);

  // Bảng nút bấm điều khiển gọi tầng thang tời
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

  // --------------------------------------------------------------------------
  // C. DÂY CHUYỀN LẮP RÁP XE MÁY ĐIỆN DK BIKE (Chạy dọc trục Bắc - Nam, xe quay đúng hướng & di chuyển chậm)
  // --------------------------------------------------------------------------
  const lineGroup = new THREE.Group();
  const lineX = -1.2; // Trục tim dây chuyền (world X = 63.8)
  lineGroup.position.set(lineX, 0, 0);

  const lineLen = 21.0;
  const lineW = 1.05; // Khổ rộng băng chuyền vừa vặn thanh thoát
  const lineH = 0.65; // Cao độ sàn thao tác công thái học

  // 1. Thân băng chuyền lắp ráp chính (Conveyor Bed sơn xanh dương DK Bike)
  const lineBed = new THREE.Mesh(
    new THREE.BoxGeometry(lineW, lineH, lineLen),
    blueFrameMat
  );
  lineBed.position.set(0, lineH / 2, -1.8);
  lineBed.castShadow = true;
  lineGroup.add(lineBed);

  // Mặt ray trượt kim loại ở giữa
  const slatBelt = new THREE.Mesh(
    new THREE.BoxGeometry(lineW - 0.18, 0.04, lineLen - 0.4),
    steelMat
  );
  slatBelt.position.set(0, lineH + 0.02, -1.8);
  lineGroup.add(slatBelt);

  // Các tấm nan kim loại (Conveyor Slats) chuyển động tịnh tiến chậm rãi
  for (let sIdx = 0; sIdx < 28; sIdx++) {
    const slatZ = -11.0 + sIdx * 0.72;
    const slat = new THREE.Mesh(
      new THREE.BoxGeometry(lineW - 0.22, 0.015, 0.18),
      new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.3, metalness: 0.7 })
    );
    slat.position.set(0, lineH + 0.045, slatZ);
    lineGroup.add(slat);
    insideConveyorSlats.push(slat);
  }

  // Chân đế chữ U đỡ băng tải
  for (let bz = -11.0; bz <= 7.0; bz += 2.8) {
    const legL = new THREE.Mesh(new THREE.BoxGeometry(0.08, lineH, 0.08), steelMat);
    legL.position.set(-lineW / 2 + 0.05, lineH / 2, bz);
    lineGroup.add(legL);
    const legR = legL.clone();
    legR.position.x = lineW / 2 - 0.05;
    lineGroup.add(legR);
  }

  // 2. CẦU TRƯỢT DỐC XUỐNG XE THÀNH PHẨM (Unloading Ramp - Nổi bật trong ảnh 1!)
  const rampLen = 3.2;
  const rampGeo = new THREE.BoxGeometry(lineW + 0.1, 0.06, rampLen);
  const ramp = new THREE.Mesh(rampGeo, blueFrameMat);
  ramp.position.set(0, lineH / 2 + 0.02, 9.2);
  ramp.rotation.x = Math.atan2(lineH, rampLen);
  ramp.castShadow = true;
  lineGroup.add(ramp);

  // Vạch kẻ an toàn quanh chân cầu trượt
  const rampSafetyMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
  const rampLine1 = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 4.0), rampSafetyMat);
  rampLine1.rotation.x = -Math.PI / 2;
  rampLine1.position.set(-lineW / 2 - 0.35, 0.08, 9.4);
  lineGroup.add(rampLine1);

  const rampLine2 = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 4.0), rampSafetyMat);
  rampLine2.rotation.x = -Math.PI / 2;
  rampLine2.position.set(lineW / 2 + 0.35, 0.08, 9.4);
  lineGroup.add(rampLine2);

  // 3. TỦ ĐIỆN ĐIỀU KHIỂN HMI (Ngay cạnh cầu trượt như ảnh 1!)
  const ctrlCabinet = new THREE.Group();
  ctrlCabinet.position.set(-lineW / 2 - 0.75, 0, 7.8);

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

  // Đèn tháp tín hiệu 3 tầng (Đang sáng đèn xanh = Dây chuyền đang chạy êm đềm)
  const stackPole = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.35, 8), steelMat);
  stackPole.position.set(0.2, 1.45 + 0.17, 0);
  ctrlCabinet.add(stackPole);

  const greenBeacon = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.08, 8), new THREE.MeshBasicMaterial({ color: 0x22c55e }));
  greenBeacon.position.set(0.2, 1.45 + 0.38, 0);
  ctrlCabinet.add(greenBeacon);

  lineGroup.add(ctrlCabinet);

  // 4. KHUNG GIÀN TREO DÂY CHUYỀN & ĐÈN LED (như ảnh 1 & 3)
  const gantryMat = new THREE.MeshStandardMaterial({ color: 0x184995, roughness: 0.4 });
  const gantryZs = [-10.5, -5.0, 0.5, 6.0];

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

  // Biển hiệu gắn trên khung: "DK Bike — DÂY CHUYỀN LẮP RÁP XE MÁY ĐIỆN"
  const signBanner = new THREE.Mesh(new THREE.BoxGeometry(lineW + 0.3, 0.32, 0.05), blueFrameMat);
  signBanner.position.set(0, 2.48, 6.0);
  lineGroup.add(signBanner);

  // Dải đèn tuýp LED sáng rực rỡ bên dưới khung treo
  const taskLight = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 0.04, lineLen - 2),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  taskLight.position.set(0, 2.32, -1.8);
  lineGroup.add(taskLight);

  // 5. CÁC XE TRÊN DÂY CHUYỀN: QUAY MŨI TIẾN THẲNG VỀ PHÍA NAM (rotation.y = -Math.PI/2) & CÓ HOẠT CẢNH CHẠY CHẬM
  // Tỉ lệ scale = 0.78 chuẩn xác với người và nhà xưởng
  const bikeScale = 0.78;

  // Công đoạn 1: Khung sườn kim loại trần trên đồ gá jig
  const stage0Group = new THREE.Group();
  const jig0 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.12, 0.5), steelMat);
  jig0.position.y = 0.06;
  stage0Group.add(jig0);

  const rawFrameMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.28, 0.65, 1.2),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5, metalness: 0.6 })
  );
  rawFrameMesh.position.y = 0.45;
  stage0Group.add(rawFrameMesh);
  stage0Group.position.set(0, lineH + 0.02, -10.5);
  lineGroup.add(stage0Group);
  insideAssemblyBikes.push({ mesh: stage0Group, startZ: -10.5, baseY: lineH + 0.02 });

  // Công đoạn 2: Lắp động cơ điện & bánh sau
  const stage1Bike = createDetailedDKBike(0x0284c7, 'Xe đang lắp động cơ');
  stage1Bike.scale.set(bikeScale, bikeScale, bikeScale);
  stage1Bike.rotation.y = -Math.PI / 2; // Hướng thẳng về phía trước theo chiều chuyền!
  stage1Bike.position.set(0, lineH + 0.05, -6.5);
  lineGroup.add(stage1Bike);
  insideAssemblyBikes.push({ mesh: stage1Bike, startZ: -6.5, baseY: lineH + 0.05 });

  // Công đoạn 3: Lắp bình ắc quy, ghi đông và hệ điện
  const stage2Bike = createDetailedDKBike(0xdc2626, 'Xe đang hoàn thiện hệ điện');
  stage2Bike.scale.set(bikeScale, bikeScale, bikeScale);
  stage2Bike.rotation.y = -Math.PI / 2; // Hướng thẳng về phía trước!
  stage2Bike.position.set(0, lineH + 0.05, -2.5);
  lineGroup.add(stage2Bike);
  insideAssemblyBikes.push({ mesh: stage2Bike, startZ: -2.5, baseY: lineH + 0.05 });

  // Công đoạn 4: Lắp dàn áo yếm nhựa & yên xe
  const stage3Bike = createDetailedDKBike(0x64748b, 'DK Roma SX Gần Hoàn Thiện');
  stage3Bike.scale.set(bikeScale, bikeScale, bikeScale);
  stage3Bike.rotation.y = -Math.PI / 2; // Hướng thẳng về phía trước!
  stage3Bike.position.set(0, lineH + 0.05, 1.5);
  lineGroup.add(stage3Bike);
  insideAssemblyBikes.push({ mesh: stage3Bike, startZ: 1.5, baseY: lineH + 0.05 });

  // Công đoạn 5: Xe thành phẩm hoàn chỉnh chuẩn bị trượt xuống dốc
  const stage4Bike = createDetailedDKBike(0xf8fafc, 'DK Roma SX Trắng Ngọc Trai');
  stage4Bike.scale.set(bikeScale, bikeScale, bikeScale);
  stage4Bike.rotation.y = -Math.PI / 2; // Hướng thẳng về phía trước!
  stage4Bike.position.set(0, lineH + 0.05, 5.5);
  lineGroup.add(stage4Bike);
  insideAssemblyBikes.push({ mesh: stage4Bike, startZ: 5.5, baseY: lineH + 0.05 });

  // Công nhân thao tác tại các trạm lắp ráp (tỉ lệ 0.95 thanh mảnh)
  const workerConfigs = [
    { z: -8.5, side: -1, phase: 0 },
    { z: -4.5, side: 1, phase: 1.5 },
    { z: -0.5, side: -1, phase: 3.0 },
    { z: 3.5, side: 1, phase: 4.5 },
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
    title: 'Dây chuyền lắp ráp xe máy điện tự động DK Bike (Công suất 150.000 xe/năm)',
    type: 'assemblyLine',
    desc: 'Băng chuyền xích tự động hóa chuyển động êm đềm với các trạm lắp ráp khung sườn, động cơ điện BLDC, ắc quy, dàn áo yếm nhựa và cầu trượt xuất xe thành phẩm.',
    zone: 'DK1',
  };
  lineGroup.userData = lineData;
  lineBed.userData = lineData;
  ramp.userData = lineData;
  interactiveObjects.push(lineBed);
  interactiveObjects.push(ramp);
  interiorGroup.add(lineGroup);

  // --------------------------------------------------------------------------
  // D. KHU TẬP KẾT XE THÀNH PHẨM (Xếp thành 3 hàng thẳng tắp, quay mũi về cửa Nam như ảnh thực tế 2)
  // --------------------------------------------------------------------------
  const stagingGroup = new THREE.Group();
  stagingGroup.position.set(-6.8, 0, -0.5);

  const lotW = 4.2, lotD = 16.5;
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
  for (let sz = -7.0; sz <= 7.0; sz += 1.8) {
    const sLine = new THREE.Mesh(new THREE.PlaneGeometry(lotW - 0.25, 0.05), stallLineMat);
    sLine.rotation.x = -Math.PI / 2;
    sLine.position.set(0, 0.08, sz);
    stagingGroup.add(sLine);
  }

  // 24 Xe máy điện DK Roma SX thành phẩm xếp thành 3 hàng dọc (Cols) ngay ngắn
  // Hướng mũi xe thẳng ra cửa xưởng phía Nam (rotation.y = -Math.PI / 2)
  const bikeColors = [
    0x64748b, // Xám xi măng đặc trưng (màu chủ đạo trong ảnh 2)
    0x64748b,
    0xf8fafc, // Trắng ngọc trai
    0x64748b,
    0xdc2626, // Đỏ đô sang trọng
    0x0f172a, // Đen bóng quý phái
    0x0284c7, // Xanh cyan hiện đại
    0x64748b,
  ];

  const colOffsets = [-1.3, 0.0, 1.3];
  colOffsets.forEach((colX, cIdx) => {
    for (let row = 0; row < 8; row++) {
      const rowZ = -6.1 + row * 1.8;
      const colHex = bikeColors[(cIdx * 8 + row) % bikeColors.length];
      const bike = createDetailedDKBike(colHex, \`DK Roma SX Lô #\${cIdx + 1}-\${row + 1}\`);
      bike.scale.set(bikeScale, bikeScale, bikeScale);
      bike.rotation.y = -Math.PI / 2; // Hướng thẳng ra cửa xuất hàng Nam!
      bike.position.set(colX, 0, rowZ);
      stagingGroup.add(bike);
    }
  });

  const stagingData = {
    id: 'insideStagingArea',
    title: 'Khu tập kết xe máy điện thành phẩm sau kiểm định KCS (Xưởng B)',
    type: 'staging',
    desc: 'Khu vực tập kết các lô xe máy điện DK Roma SX hoàn thiện (màu xám xi măng, trắng, đỏ, đen) đã qua kiểm tra chất lượng toàn diện, sẵn sàng bốc dỡ ra xe tải.',
    zone: 'DK1',
  };
  stagingGroup.userData = stagingData;
  lotInner.userData = stagingData;
  interactiveObjects.push(lotInner);
  interiorGroup.add(stagingGroup);

  // --------------------------------------------------------------------------
  // E. HỆ THỐNG GIÁ KỆ KHO LINH KIỆN & PALLET ĐỘNG CƠ (Phía Đông xưởng theo bản vẽ PDF)
  // Khung thép Selective Racking Xanh - Cam 4 tầng chuẩn công nghiệp (như ảnh 2 & 3)
  // --------------------------------------------------------------------------
  const rackBlocks = [
    { z: -11.5, name: 'Kệ selective K01: Pallet động cơ điện BLDC & IC điều tốc' },
    { z: -6.0,  name: 'Kệ selective K02: Thùng phụ tùng nhựa dàn áo & yếm xe' },
    { z: -0.5,  name: 'Kệ selective K03: Cụm giảm xóc thủy lực, vành đúc & lốp không săm' },
    { z: 5.0,   name: 'Kệ selective K04: Phụ kiện ốc vít, chốt định vị & bó dây điện' },
    { z: 10.5,  name: 'Kệ selective K05: Khay linh kiện lắp ráp nhanh & phụ kiện đèn còi' },
  ];

  rackBlocks.forEach((rb, rbIdx) => {
    const rackGroup = new THREE.Group();
    rackGroup.position.set(6.4, 0, rb.z); // Phía Đông xưởng B (world X = 71.4)

    const rW = 4.2; // Dài 4.2m
    const rD = 1.1; // Rộng 1.1m
    const rH = 4.4; // Cao 4 tầng

    // Cột giàn thép màu xanh dương
    [[-rW / 2, -rD / 2], [rW / 2, -rD / 2], [-rW / 2, rD / 2], [rW / 2, rD / 2], [0, -rD / 2], [0, rD / 2]].forEach(([px, pz]) => {
      const col = new THREE.Mesh(new THREE.BoxGeometry(0.09, rH, 0.09), blueRackMat);
      col.position.set(px, rH / 2, pz);
      col.castShadow = true;
      rackGroup.add(col);
    });

    // Các thanh dầm ngang màu cam rực rỡ (Orange Load Beams) 4 tầng
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

      // Đặt các pallet hàng & thùng carton trên từng tầng kệ (như ảnh 2 & 3)
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

  // Xe đẩy khay nhựa phân loại linh kiện cơ động (như ảnh 3)
  [-2.0, 3.5].forEach((tz) => {
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

  // Xe nâng tay màu vàng (Manual Pallet Jack như ghi chú trên bản vẽ PDF layout: "Dùng xe nâng tay")
  const palletJack = new THREE.Group();
  palletJack.position.set(2.4, 0, 7.5);

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

  // Khu vực dự phòng đặt Pallet động cơ sát vách Bắc (theo bản vẽ PDF: 45 pallet)
  for (let mx = -4.5; mx <= 4.5; mx += 1.8) {
    const mPallet = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.09, 0.95), cartonMat);
    mPallet.position.set(mx, 0.05, -cfg.depth / 2 + 1.2);
    interiorGroup.add(mPallet);

    const mStack = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.58, 0.85), cartonMat);
    mStack.position.set(mx, 0.38, -cfg.depth / 2 + 1.2);
    interiorGroup.add(mStack);
  }

  // Vạch kẻ sơn phân làn an toàn trên sàn bê tông bóng loáng
  const safetyLineMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
  // Hành lang trung tâm nối thẳng từ Cửa B1 đến phía sau
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
console.log('Successfully replaced buildNhaBInterior');

// F. In updateAnimatedObjects: Add assembly line movement
const targetFanAnim = `  // Quạt trần công nghiệp HVLS cánh lớn sải rộng bên trong xưởng B
  insideHVLSFans.forEach((fan) => {
    fan.rotation.y += delta * 1.8;
  });`;

const replacementFanAnim = `  // Quạt trần công nghiệp HVLS cánh lớn sải rộng bên trong xưởng B
  insideHVLSFans.forEach((fan) => {
    fan.rotation.y += delta * 1.8;
  });

  // DÂY CHUYỀN LẮP RÁP XƯỞNG B VẬN HÀNH CHẬM RÃI (Slow Moving Assembly Line ~0.35 m/s)
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
  });

  // Công nhân lắp ráp cử động nhịp nhàng theo thao tác
  insideAssemblyWorkers.forEach((w) => {
    w.mesh.position.y = Math.sin(time * 0.0025 + w.phase) * 0.012;
  });`;

if (code.includes(targetFanAnim)) {
  code = code.replace(targetFanAnim, replacementFanAnim);
  console.log('Added slow moving assembly line animation to updateAnimatedObjects');
} else {
  console.warn('Could not find targetFanAnim in updateAnimatedObjects');
}

if (isCrlf) {
  code = code.replace(/\n/g, '\r\n');
}

fs.writeFileSync(mainJsPath, code, 'utf8');
console.log('Successfully updated main.js');
