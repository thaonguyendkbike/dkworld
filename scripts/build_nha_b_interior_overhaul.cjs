// scripts/build_nha_b_interior_overhaul.cjs
const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '..', 'src', 'config.js');
const indexPath = path.join(__dirname, '..', 'index.html');
const mainPath = path.join(__dirname, '..', 'src', 'main.js');

let configCode = fs.readFileSync(configPath, 'utf8');
let indexCode = fs.readFileSync(indexPath, 'utf8');
let mainCode = fs.readFileSync(mainPath, 'utf8');

const hadCRLF = mainCode.includes('\r\n');
configCode = configCode.replace(/\r\n/g, '\n');
indexCode = indexCode.replace(/\r\n/g, '\n');
mainCode = mainCode.replace(/\r\n/g, '\n');

console.log('1. Adding insideNhaB preset to src/config.js...');
if (!configCode.includes('insideNhaB:')) {
  const targetPreset = 'nhaB: {';
  const newPresetCode = `insideNhaB: {
      pos: { x: 61.5, y: 3.8, z: -37.5 },
      target: { x: 63.8, y: 2.2, z: -52.0 },
      name: 'Bên trong Xưởng B: Dây chuyền & Kho',
    },
    nhaB: {`;
  configCode = configCode.replace(targetPreset, newPresetCode);
  fs.writeFileSync(configPath, configCode.replace(/\n/g, hadCRLF ? '\r\n' : '\n'), 'utf8');
  console.log('Added insideNhaB to src/config.js successfully!');
} else {
  console.log('insideNhaB already exists in src/config.js.');
}

console.log('2. Adding preset button to index.html...');
if (!indexCode.includes('id="btn-view-interior-nhab"')) {
  const targetButton = `<button class="preset-btn" id="btn-view-nhab" data-view="nhaB" title="Xưởng chính Nhà B (DK1)">
              <span class="p-icon">🏢</span>
              <span class="p-name">Xưởng Nhà B</span>
            </button>`;
  const newButton = targetButton + `
            <button class="preset-btn" id="btn-view-interior-nhab" data-view="insideNhaB" title="Bên trong Xưởng B: Dây chuyền & Kho linh kiện">
              <span class="p-icon">🔧</span>
              <span class="p-name">Bên trong Xưởng B</span>
            </button>`;
  indexCode = indexCode.replace(targetButton, newButton);
  fs.writeFileSync(indexPath, indexCode.replace(/\n/g, hadCRLF ? '\r\n' : '\n'), 'utf8');
  console.log('Added preset button to index.html successfully!');
} else {
  console.log('Preset button already exists in index.html.');
}

console.log('3. Updating src/main.js with complete interior factory architecture...');

// Ensure top-level variables exist
if (!mainCode.includes('let nhaBRoofGroupGlobal = null;')) {
  mainCode = mainCode.replace(
    'let interiorFactoryLights = [];',
    'let interiorFactoryLights = [];\nlet nhaBRoofGroupGlobal = null;\nlet insideHVLSFans = [];'
  );
}

// Prepare the comprehensive buildNhaB & buildNhaBInterior code
const newBuildNhaBFull = `function buildNhaB() {
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
  // Door B1: x = -7.0, rộng 5.6m, cao 4.2m (Tâm world X = 58.0)
  // Door B2: x = +7.0, rộng 5.0m, cao 4.2m
  const frontZ = cfg.depth / 2;

  const upperFrontH = cfg.height - 4.2;
  const upperFront = new THREE.Mesh(new THREE.BoxGeometry(cfg.width, upperFrontH, 0.4), wallMat);
  upperFront.position.set(0, 4.2 + upperFrontH / 2, frontZ);
  upperFront.castShadow = true;
  upperFront.receiveShadow = true;
  group.add(upperFront);

  const bFrontL = new THREE.Mesh(new THREE.BoxGeometry(1.45, 1.5, 0.4), baseMat);
  bFrontL.position.set(-10.525, 0.75, frontZ);
  bFrontL.castShadow = true;
  group.add(bFrontL);

  const wFrontL = new THREE.Mesh(new THREE.BoxGeometry(1.45, 2.7, 0.4), wallMat);
  wFrontL.position.set(-10.525, 1.5 + 1.35, frontZ);
  wFrontL.castShadow = true;
  group.add(wFrontL);

  const bFrontMid = new THREE.Mesh(new THREE.BoxGeometry(8.7, 1.5, 0.4), baseMat);
  bFrontMid.position.set(0.15, 0.75, frontZ);
  bFrontMid.castShadow = true;
  group.add(bFrontMid);

  const wFrontMid = new THREE.Mesh(new THREE.BoxGeometry(8.7, 2.7, 0.4), wallMat);
  wFrontMid.position.set(0.15, 1.5 + 1.35, frontZ);
  wFrontMid.castShadow = true;
  group.add(wFrontMid);

  const bFrontR = new THREE.Mesh(new THREE.BoxGeometry(1.75, 1.5, 0.4), baseMat);
  bFrontR.position.set(10.375, 0.75, frontZ);
  bFrontR.castShadow = true;
  group.add(bFrontR);

  const wFrontR = new THREE.Mesh(new THREE.BoxGeometry(1.75, 2.7, 0.4), wallMat);
  wFrontR.position.set(10.375, 1.5 + 1.35, frontZ);
  wFrontR.castShadow = true;
  group.add(wFrontR);

  // Sàn bê tông công nghiệp phẳng mịn đánh bóng bên trong xưởng
  const factoryFloor = new THREE.Mesh(
    new THREE.BoxGeometry(cfg.width - 0.2, 0.1, cfg.depth - 0.2),
    new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.35, metalness: 0.15 })
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

  // 3. TOÀN BỘ HỆ THỐNG MÁI NGOẠI THẤT (ĐƯỢC GOM NHÓM ĐỂ CÓ THỂ ẨN KHI XEM NỘI THẤT)
  const nhaBRoofGroup = new THREE.Group();
  nhaBRoofGroup.name = 'nhaBRoofGroup';
  nhaBRoofGroupGlobal = nhaBRoofGroup;

  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(cfg.width + 0.6, 0.6, cfg.depth + 0.6),
    new THREE.MeshStandardMaterial({ color: cfg.roofColor, roughness: 0.5 })
  );
  roof.position.y = cfg.height + 0.3;
  roof.castShadow = true;
  nhaBRoofGroup.add(roof);

  const corniceMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4 });
  const cThick = 0.45;
  const cHeight = 0.35;
  const cY = cfg.height + 0.6 + cHeight / 2;
  const cNorth = new THREE.Mesh(new THREE.BoxGeometry(cfg.width + 0.8, cHeight, cThick), corniceMat);
  cNorth.position.set(0, cY, -(cfg.depth + 0.6) / 2 + cThick / 2);
  cNorth.castShadow = true;
  nhaBRoofGroup.add(cNorth);

  const cSouth = new THREE.Mesh(new THREE.BoxGeometry(cfg.width + 0.8, cHeight, cThick), corniceMat);
  cSouth.position.set(0, cY, (cfg.depth + 0.6) / 2 - cThick / 2);
  cSouth.castShadow = true;
  nhaBRoofGroup.add(cSouth);

  const cEast = new THREE.Mesh(new THREE.BoxGeometry(cThick, cHeight, cfg.depth + 0.6 - cThick * 2), corniceMat);
  cEast.position.set((cfg.width + 0.8) / 2 - cThick / 2, cY, 0);
  cEast.castShadow = true;
  nhaBRoofGroup.add(cEast);

  const cWest = new THREE.Mesh(new THREE.BoxGeometry(cThick, cHeight, cfg.depth + 0.6 - cThick * 2), corniceMat);
  cWest.position.set(-(cfg.width + 0.8) / 2 + cThick / 2, cY, 0);
  cWest.castShadow = true;
  nhaBRoofGroup.add(cWest);

  const monCfg = cfg.monitorRoof;
  const monitor = new THREE.Mesh(
    new THREE.BoxGeometry(monCfg.width, monCfg.height, monCfg.depth),
    new THREE.MeshStandardMaterial({ color: monCfg.color, roughness: 0.5 })
  );
  monitor.position.y = cfg.height + 0.6 + monCfg.height / 2;
  monitor.castShadow = true;
  nhaBRoofGroup.add(monitor);

  for (let vz = -10; vz <= 10; vz += 5.0) {
    const vent = new THREE.Mesh(
      new THREE.CylinderGeometry(0.55, 0.65, 0.6, 8),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.35, metalness: 0.6 })
    );
    vent.position.set(0, cfg.height + 0.6 + monCfg.height + 0.3, vz);
    nhaBRoofGroup.add(vent);
    roofVentilators.push(vent);
  }

  const skylightMat = new THREE.MeshStandardMaterial({
    color: 0xdbeafe,
    roughness: 0.2,
    transparent: true,
    opacity: 0.72,
  });
  [-4.8, 4.8].forEach((sx) => {
    const skylight = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.12, monCfg.depth - 2), skylightMat);
    skylight.position.set(sx, cfg.height + 0.66, 0);
    nhaBRoofGroup.add(skylight);
  });

  createSolarPanelGrid(nhaBRoofGroup, -7.5, cfg.height + 0.62, 0, 5.5, 24, 0.15);
  createSolarPanelGrid(nhaBRoofGroup, 7.5, cfg.height + 0.62, 0, 5.5, 24, 0.15);

  const chillerMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.4 });
  const chiller = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.2, 1.8), chillerMat);
  chiller.position.set(-6.5, cfg.height + 1.4, -12);
  chiller.castShadow = true;
  nhaBRoofGroup.add(chiller);

  group.add(nhaBRoofGroup);

  // 4. Dãy cửa sổ công nghiệp (vẫn giữ nguyên trên tường biên)
  const windowMat = new THREE.MeshStandardMaterial({ color: 0x93c5fd, roughness: 0.1, metalness: 0.8 });
  windowLights.push(windowMat);

  for (let story = 1; story <= 3; story++) {
    const winHeight = 1.1;
    const winY = 1.6 + (story - 0.5) * 3.8;

    if (story > 1) {
      createWindowStripWithMullions(group, 0, winY, cfg.depth / 2 + 0.05, cfg.width - 4, winHeight, 0, 2.2, windowMat);
    }
    createWindowStripWithMullions(group, cfg.width / 2 + 0.05, winY, 0, cfg.depth - 4, winHeight, Math.PI / 2, 2.4, windowMat);
    createWindowStripWithMullions(group, 0, winY, -cfg.depth / 2 - 0.05, cfg.width - 6, winHeight, Math.PI, 2.2, windowMat);
    createWindowStripWithMullions(group, -cfg.width / 2 - 0.05, winY, 0, cfg.depth - 6, winHeight, -Math.PI / 2, 2.4, windowMat);
  }

  // 5. Cửa cuốn công nghiệp (Door B1, B2)
  createShutterDoor(group, -7.0, 0, cfg.depth / 2 + 0.08, 5.6, 4.2, 'doorB1', 'Cửa cuốn chính Xưởng B');
  createShutterDoor(group, 7.0, 0, cfg.depth / 2 + 0.08, 5.0, 4.2, 'doorB2', 'Cửa xuất nhập hàng Xưởng B');

  // 6. Tiện ích ngoại thất
  createRainwaterDownspouts(group, cfg.width, cfg.height, cfg.depth, 0x64748b);
  createFireEscapeStairs(group, -cfg.width / 2 + 4.5, -cfg.depth / 2 - 1.0, cfg.height, 3, 0x334155);
  createBuildingLogo(group, cfg);

  // ========================================================================
  // 7. KIẾN TẠO TOÀN BỘ NỘI THẤT XƯỞNG B CHUẨN THỰC TẾ & BẢN VẼ PDF LAYOUT
  // Dây chuyền lắp ráp, giá kệ selective, xe thành phẩm, thang tời hàng
  // ========================================================================
  buildNhaBInterior(group, cfg);

  scene.add(group);
  buildingMeshes.push(upperFront);
}

// Hàm khởi tạo toàn bộ nội thất chi tiết Xưởng B theo đúng ảnh thực tế & bản vẽ layout
function buildNhaBInterior(group, cfg) {
  const interiorGroup = new THREE.Group();
  interiorGroup.name = 'nhaBInterior';

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
  // A. HỆ CỘT CHỊU LỰC VUÔNG BÊ TÔNG VÀNG KEM & DẦM THÉP I TRẦN (như ảnh 1 & 2)
  // --------------------------------------------------------------------------
  const columnXs = [-5.2, 5.2];
  const columnZs = [-11.0, -3.5, 4.0, 11.5];

  columnXs.forEach((cx) => {
    columnZs.forEach((cz) => {
      // Cột chính vuông
      const col = new THREE.Mesh(new THREE.BoxGeometry(0.72, cfg.height - 0.5, 0.72), columnMat);
      col.position.set(cx, (cfg.height - 0.5) / 2, cz);
      col.castShadow = true;
      interiorGroup.add(col);

      // Chân cột ốp thép chống va đập
      const kick = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.45, 0.82), darkMat);
      kick.position.set(cx, 0.23, cz);
      interiorGroup.add(kick);
    });
  });

  // Dầm thép chữ I ngang & dọc trần nhà xưởng (Slate Gray I-Beams)
  columnZs.forEach((cz) => {
    const beamTrans = new THREE.Mesh(new THREE.BoxGeometry(cfg.width - 0.8, 0.55, 0.28), steelMat);
    beamTrans.position.set(0, cfg.height - 1.2, cz);
    interiorGroup.add(beamTrans);
  });

  [-5.2, 5.2].forEach((cx) => {
    const beamLong = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.55, cfg.depth - 0.8), steelMat);
    beamLong.position.set(cx, cfg.height - 0.9, 0);
    interiorGroup.add(beamLong);
  });

  // Đường ống cứu hỏa PCCC sơn đỏ chạy dọc trần xưởng (Red Fire Sprinkler Line)
  const pipeMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.35, metalness: 0.3 });
  const firePipe = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, cfg.depth - 2, 8), pipeMat);
  firePipe.rotation.x = Math.PI / 2;
  firePipe.position.set(-2.5, cfg.height - 1.6, 0);
  interiorGroup.add(firePipe);

  // Khẩu hiệu sản xuất gắn trên dầm ngang (Slogan Banners như trong ảnh 1 & 2)
  const sloganMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.3 });
  const banner1 = new THREE.Mesh(new THREE.BoxGeometry(9.5, 0.75, 0.08), sloganMat);
  banner1.position.set(0, cfg.height - 1.2, -3.4);
  interiorGroup.add(banner1);

  // Quạt trần công nghiệp HVLS cánh lớn sải rộng (như ảnh 1 & 3)
  [-3.8, 3.8].forEach((fx, fIdx) => {
    const fz = fIdx === 0 ? 0.0 : -4.5;
    const fanGroup = new THREE.Group();
    fanGroup.position.set(fx, cfg.height - 1.8, fz);

    // Motor trung tâm
    const fMotor = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.45, 0.5, 12), darkMat);
    fanGroup.add(fMotor);

    // 6 Cánh quạt aerofoil màu xanh dương
    const fRotor = new THREE.Group();
    for (let b = 0; b < 6; b++) {
      const blade = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.04, 0.22), blueFrameMat);
      blade.position.x = 1.3;
      const bWrapper = new THREE.Group();
      bWrapper.rotation.y = (b / 6) * Math.PI * 2;
      bWrapper.add(blade);
      fRotor.add(bWrapper);
    }
    fanGroup.add(fRotor);
    insideHVLSFans.push(fRotor);
    interiorGroup.add(fanGroup);
  });

  // Hệ thống đèn LED High-Bay UFO treo trần chiếu sáng rực rỡ mặt sàn
  const lampPositions = [
    [-2.2, -8], [-2.2, 0], [-2.2, 7],
    [4.5, -8], [4.5, 0], [4.5, 7],
  ];
  lampPositions.forEach(([lx, lz]) => {
    const lamp = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.5, 0.18, 12),
      new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, roughness: 0.2 })
    );
    lamp.position.set(lx, cfg.height - 2.1, lz);
    interiorGroup.add(lamp);

    // Mặt đèn phát quang trắng sáng
    const bulb = new THREE.Mesh(
      new THREE.CylinderGeometry(0.42, 0.42, 0.04, 12),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    bulb.position.set(lx, cfg.height - 2.2, lz);
    interiorGroup.add(bulb);

    const pLight = new THREE.PointLight(0xfffbeb, 0.85, 14);
    pLight.position.set(lx, cfg.height - 2.4, lz);
    interiorGroup.add(pLight);
    interiorFactoryLights.push(pLight);
  });

  // --------------------------------------------------------------------------
  // B. THANG TỜI HÀNG CÔNG NGHIỆP 2.5 TẤN (Góc Tây Nam theo đúng bản vẽ PDF: 4555mm)
  // --------------------------------------------------------------------------
  const liftGroup = new THREE.Group();
  liftGroup.position.set(-8.6, 0, 13.2);

  // 4 Trụ thép hộp đứng màu vàng an toàn (cao 8.2m)
  const lW = 3.6, lD = 3.2, lH = 8.5;
  [[-lW / 2, -lD / 2], [lW / 2, -lD / 2], [-lW / 2, lD / 2], [lW / 2, lD / 2]].forEach(([px, pz]) => {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.18, lH, 0.18), yellowHazardMat);
    post.position.set(px, lH / 2, pz);
    post.castShadow = true;
    liftGroup.add(post);
  });

  // Khung giàn thép giằng ngang & chéo xung quanh buồng thang tời
  for (let ty = 2.2; ty <= lH; ty += 2.0) {
    const ring = new THREE.Mesh(new THREE.BoxGeometry(lW + 0.1, 0.1, lD + 0.1), darkMat);
    ring.position.y = ty;
    liftGroup.add(ring);
  }

  // Tấm lưới thép bảo vệ bao quanh 3 mặt
  const meshMat = new THREE.MeshStandardMaterial({
    color: 0x64748b,
    wireframe: true,
    roughness: 0.5,
  });
  const backMesh = new THREE.Mesh(new THREE.PlaneGeometry(lW, lH), meshMat);
  backMesh.position.set(0, lH / 2, -lD / 2);
  liftGroup.add(backMesh);

  const leftMesh = new THREE.Mesh(new THREE.PlaneGeometry(lD, lH), meshMat);
  leftMesh.rotation.y = Math.PI / 2;
  leftMesh.position.set(-lW / 2, lH / 2, 0);
  liftGroup.add(leftMesh);

  // Cửa xếp trượt thép an toàn có vạch sơn phản quang vàng đen
  const gate = new THREE.Mesh(new THREE.BoxGeometry(lW - 0.4, 2.3, 0.08), yellowHazardMat);
  gate.position.set(0, 1.15, lD / 2);
  liftGroup.add(gate);

  // Vạch sọc vàng đen phản quang cảnh báo trước cửa thang tời
  for (let hz = 0; hz < 6; hz++) {
    const hStripe = new THREE.Mesh(
      new THREE.PlaneGeometry(0.45, 0.15),
      new THREE.MeshBasicMaterial({ color: hz % 2 === 0 ? 0xfacc15 : 0x0f172a })
    );
    hStripe.rotation.x = -Math.PI / 2;
    hStripe.position.set(-1.1 + hz * 0.45, 0.08, lD / 2 + 0.5);
    liftGroup.add(hStripe);
  }

  // Cụm động cơ tời tời cáp & tang cuốn trên đỉnh
  const winchMotor = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 1.2, 12), steelMat);
  winchMotor.rotation.z = Math.PI / 2;
  winchMotor.position.set(0, lH + 0.35, 0);
  liftGroup.add(winchMotor);

  // Sàn nâng buồng thang tời bên trong (Carriage)
  const liftPlatform = new THREE.Mesh(new THREE.BoxGeometry(lW - 0.4, 0.18, lD - 0.4), steelMat);
  liftPlatform.position.set(0, 0.6, 0);
  liftGroup.add(liftPlatform);

  // Bảng nút bấm điều khiển gọi tầng thang tời
  const ctrlBox = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.45, 0.12), yellowHazardMat);
  ctrlBox.position.set(lW / 2 + 0.15, 1.4, lD / 2);
  liftGroup.add(ctrlBox);

  // Metadata tương tác
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
  // C. DÂY CHUYỀN LẮP RÁP XE MÁY ĐIỆN DK BIKE (Chạy dọc trục Bắc - Nam)
  // Khớp chính xác 100% ảnh thực tế 1 & 3: Cầu trượt dốc xanh, Tủ điện, Khung dàn treo
  // --------------------------------------------------------------------------
  const lineGroup = new THREE.Group();
  const lineX = -1.8; // Trục tim dây chuyền (world X = 63.2)
  lineGroup.position.set(lineX, 0, 0);

  const lineLen = 20.0;
  const lineW = 1.4;
  const lineH = 0.72;

  // 1. Băng chuyền lắp ráp chính (Conveyor bed sơn xanh dương DK Bike)
  const lineBed = new THREE.Mesh(
    new THREE.BoxGeometry(lineW, lineH, lineLen),
    blueFrameMat
  );
  lineBed.position.set(0, lineH / 2, -1.5);
  lineBed.castShadow = true;
  lineGroup.add(lineBed);

  // Mặt ray trượt / tấm xích tải kim loại ở giữa
  const slatBelt = new THREE.Mesh(
    new THREE.BoxGeometry(lineW - 0.25, 0.06, lineLen - 0.4),
    steelMat
  );
  slatBelt.position.set(0, lineH + 0.03, -1.5);
  lineGroup.add(slatBelt);

  // Các chân đế thép chữ U đỡ băng tải
  for (let bz = -10.5; bz <= 7.5; bz += 3.0) {
    const legL = new THREE.Mesh(new THREE.BoxGeometry(0.1, lineH, 0.1), steelMat);
    legL.position.set(-lineW / 2 + 0.05, lineH / 2, bz);
    lineGroup.add(legL);
    const legR = legL.clone();
    legR.position.x = lineW / 2 - 0.05;
    lineGroup.add(legR);
  }

  // 2. CẦU TRƯỢT DỐC XUỐNG XE THÀNH PHẨM (Unloading Ramp - Nổi bật trong ảnh 1!)
  // Đoạn dốc bằng thép gân màu xanh nối từ mặt băng tải xuống sát sàn xưởng
  const rampLen = 2.8;
  const rampGeo = new THREE.BoxGeometry(lineW + 0.15, 0.08, rampLen);
  const ramp = new THREE.Mesh(rampGeo, blueFrameMat);
  ramp.position.set(0, lineH / 2 + 0.02, 9.6);
  ramp.rotation.x = Math.atan2(lineH, rampLen);
  ramp.castShadow = true;
  lineGroup.add(ramp);

  // Vạch sơn đỏ/vàng trên sàn quanh vùng xuất xưởng chân cầu trượt
  const rampSafetyMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
  const rampLine1 = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 3.8), rampSafetyMat);
  rampLine1.rotation.x = -Math.PI / 2;
  rampLine1.position.set(-lineW / 2 - 0.35, 0.08, 9.8);
  lineGroup.add(rampLine1);

  const rampLine2 = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 3.8), rampSafetyMat);
  rampLine2.rotation.x = -Math.PI / 2;
  rampLine2.position.set(lineW / 2 + 0.35, 0.08, 9.8);
  lineGroup.add(rampLine2);

  // 3. TỦ ĐIỆN ĐIỀU KHIỂN TRUNG TÂM DÂY CHUYỀN (Control Cabinet - Ngay cạnh cầu trượt như ảnh 1!)
  const ctrlCabinet = new THREE.Group();
  ctrlCabinet.position.set(-lineW / 2 - 0.9, 0, 8.2);

  const cabBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.75, 1.55, 0.55),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.35 })
  );
  cabBody.position.y = 1.55 / 2;
  cabBody.castShadow = true;
  ctrlCabinet.add(cabBody);

  // Màn hình cảm ứng HMI & các nút bấm điều khiển
  const screenHMI = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 0.25), new THREE.MeshBasicMaterial({ color: 0x0284c7 }));
  screenHMI.position.set(0, 1.15, 0.28);
  ctrlCabinet.add(screenHMI);

  // Nút dừng khẩn cấp đỏ E-Stop & đèn báo pha
  const eStop = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.05), new THREE.MeshBasicMaterial({ color: 0xdc2626 }));
  eStop.rotation.x = Math.PI / 2;
  eStop.position.set(0.18, 0.85, 0.28);
  ctrlCabinet.add(eStop);

  lineGroup.add(ctrlCabinet);

  // 4. KHUNG GIÀN TREO DÂY CHUYỀN & ĐÈN LED SOI CHI TIẾT (như ảnh 1 & 3)
  const gantryMat = new THREE.MeshStandardMaterial({ color: 0x184995, roughness: 0.4 });
  const gantryZs = [-10.5, -4.5, 1.5, 7.5];

  gantryZs.forEach((gz) => {
    // 2 Cột đứng khung dàn
    const gPostL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.5, 0.08), gantryMat);
    gPostL.position.set(-lineW / 2 - 0.1, 1.25, gz);
    lineGroup.add(gPostL);

    const gPostR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.5, 0.08), gantryMat);
    gPostR.position.set(lineW / 2 + 0.1, 1.25, gz);
    lineGroup.add(gPostR);

    // Xà ngang nối trên nóc
    const gBeam = new THREE.Mesh(new THREE.BoxGeometry(lineW + 0.3, 0.08, 0.08), gantryMat);
    gBeam.position.set(0, 2.45, gz);
    lineGroup.add(gBeam);
  });

  // Biển hiệu gắn trên khung dàn: "DK Bike — DÂY CHUYỀN LẮP RÁP XE MÁY ĐIỆN"
  const signBanner = new THREE.Mesh(new THREE.BoxGeometry(lineW + 0.35, 0.35, 0.06), blueFrameMat);
  signBanner.position.set(0, 2.55, 7.5);
  lineGroup.add(signBanner);

  // Dải đèn tuýp LED sáng rực rỡ chạy dọc bên dưới khung treo
  const taskLight = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.05, lineLen - 2),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  taskLight.position.set(0, 2.38, -1.5);
  lineGroup.add(taskLight);

  // 5. CÁC XE MÁY ĐIỆN TRÊN DÂY CHUYỀN THEO TỪNG CÔNG ĐOẠN (Progressive Assembly Stages)
  // Công đoạn 1 (z = -9.0): Khung sườn kim loại trần đặt trên đồ gá jig
  const jig1 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.15, 0.6), steelMat);
  jig1.position.set(0, lineH + 0.1, -9.0);
  lineGroup.add(jig1);

  const rawFrame = new THREE.Mesh(
    new THREE.BoxGeometry(0.35, 0.75, 1.4),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5, metalness: 0.6 })
  );
  rawFrame.position.set(0, lineH + 0.5, -9.0);
  lineGroup.add(rawFrame);

  // Công đoạn 2 (z = -3.5): Đã lắp bánh sau, động cơ điện và cụm giảm xóc
  const halfBike = createDetailedDKBike(0x0284c7, 'Xe đang lắp động cơ');
  halfBike.position.set(0, lineH + 0.05, -3.5);
  lineGroup.add(halfBike);

  // Công đoạn 3 (z = 2.0): Đã lắp bình ắc quy/pin, ghi đông và bó dây điện
  const nearBike = createDetailedDKBike(0xdc2626, 'Xe đang hoàn thiện hệ điện');
  nearBike.position.set(0, lineH + 0.05, 2.0);
  lineGroup.add(nearBike);

  // Công đoạn 4 (z = 7.0): Xe hoàn thiện đang kiểm tra đèn còi trước khi trượt dốc
  const fullBike = createDetailedDKBike(0x475569, 'DK Roma SX Hoàn Thiện');
  fullBike.position.set(0, lineH + 0.05, 7.0);
  lineGroup.add(fullBike);

  // Công nhân thao tác tại dây chuyền (áo xanh đồng phục DK Bike)
  const worker1 = createCharacter({ shirtColor: 0x0284c7, pantsColor: 0x1e293b, hatColor: 0x0284c7, role: 'worker' });
  worker1.position.set(-lineW / 2 - 0.45, 0, -3.2);
  worker1.rotation.y = Math.PI / 2;
  lineGroup.add(worker1);

  const worker2 = createCharacter({ shirtColor: 0x0284c7, pantsColor: 0x1e293b, hatColor: 0x0284c7, role: 'worker' });
  worker2.position.set(lineW / 2 + 0.45, 0, 2.5);
  worker2.rotation.y = -Math.PI / 2;
  lineGroup.add(worker2);

  // Metadata tương tác
  const lineData = {
    id: 'insideAssemblyLine',
    title: 'Dây chuyền lắp ráp xe máy điện hiện đại DK Bike (Công suất 150.000 xe/năm)',
    type: 'assemblyLine',
    desc: 'Dây chuyền lắp ráp dạng băng chuyền xích tự động hóa với hệ thống cấp liệu đồng bộ, trang bị đồ gá định vị khí nén, súng siết lực điện tử tự ngắt và cầu trượt dốc xuất xe thành phẩm.',
    zone: 'DK1',
  };
  lineGroup.userData = lineData;
  lineBed.userData = lineData;
  ramp.userData = lineData;
  interactiveObjects.push(lineBed);
  interactiveObjects.push(ramp);
  interiorGroup.add(lineGroup);

  // --------------------------------------------------------------------------
  // D. KHU TẬP KẾT XE THÀNH PHẨM (Xếp hàng ngay ngắn như trong ảnh thực tế 2)
  // Đỗ thành các hàng thẳng tắp trước các cột xưởng và bên cạnh dây chuyền
  // --------------------------------------------------------------------------
  const stagingGroup = new THREE.Group();
  stagingGroup.position.set(-7.2, 0, -1.0);

  // Kẻ vạch vàng phân ô sàn đậu xe
  const lotMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
  const lotBorder = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 12.0), lotMat);
  lotBorder.rotation.x = -Math.PI / 2;
  lotBorder.position.set(0, 0.07, 0);
  stagingGroup.add(lotBorder);

  const lotInner = new THREE.Mesh(new THREE.PlaneGeometry(3.45, 11.85), new THREE.MeshStandardMaterial({ color: 0x475569 }));
  lotInner.rotation.x = -Math.PI / 2;
  lotInner.position.set(0, 0.075, 0);
  stagingGroup.add(lotInner);

  // Các hàng xe máy điện DK Roma SX thành phẩm (Màu xám xi măng, trắng, đỏ, đen)
  const bikeColors = [
    0x64748b, // Xám xi măng (màu hot như ảnh 2)
    0x64748b,
    0x64748b,
    0xf8fafc, // Trắng ngọc trai
    0xf8fafc,
    0xdc2626, // Đỏ đô
    0x0f172a, // Đen bóng
  ];

  for (let r = 0; r < 2; r++) {
    const rx = (r - 0.5) * 1.5;
    for (let c = 0; c < 6; c++) {
      const cz = -4.5 + c * 1.8;
      const bCol = bikeColors[(r * 6 + c) % bikeColors.length];
      const bike = createDetailedDKBike(bCol, \`DK Roma SX Lô #\${c + 1}\`);
      bike.position.set(rx, 0, cz);
      bike.rotation.y = 0; // Hướng mũi xe thẳng ra cửa xuất hàng
      stagingGroup.add(bike);
    }
  }

  const stagingData = {
    id: 'insideStagingArea',
    title: 'Khu tập kết xe máy điện thành phẩm sau kiểm định KCS (Xưởng B)',
    type: 'staging',
    desc: 'Khu vực tập kết các lô xe máy điện DK Roma SX đã qua kiểm tra chất lượng toàn diện (đèn còi, phanh ABS, độ chụm bánh lái), sẵn sàng vận chuyển ra cửa bốc dỡ lên xe tải.',
    zone: 'DK1',
  };
  stagingGroup.userData = stagingData;
  lotInner.userData = stagingData;
  interactiveObjects.push(lotInner);
  interiorGroup.add(stagingGroup);

  // --------------------------------------------------------------------------
  // E. HỆ THỐNG GIÁ KỆ KHO LINH KIỆN & PALLET ĐỘNG CƠ (Phía Đông xưởng theo bản vẽ PDF)
  // Khung thép Selective Racking Xanh - Cam chuẩn công nghiệp (như ảnh 2 & 3)
  // --------------------------------------------------------------------------
  const rackBlocks = [
    { z: -10.5, name: 'Kệ selective K01: Pallet động cơ điện & IC' },
    { z: -5.0,  name: 'Kệ selective K02: Thùng phụ tùng nhựa & yếm xe' },
    { z: 0.5,   name: 'Kệ selective K03: Giảm xóc, vành đúc & lốp' },
    { z: 6.0,   name: 'Kệ selective K04: Phụ kiện ốc vít & dây điện' },
    { z: 11.5,  name: 'Kệ selective K05: Khay linh kiện lắp ráp nhanh' },
  ];

  rackBlocks.forEach((rb, rbIdx) => {
    const rackGroup = new THREE.Group();
    rackGroup.position.set(5.8, 0, rb.z); // Phía Đông xưởng B (world X = 70.8)

    const rW = 4.2; // Dài 4.2m
    const rD = 1.2; // Rộng 1.2m
    const rH = 4.2; // Cao 4 tầng

    // 4 Cột giàn thép màu xanh dương (Blue Upright Frames)
    [[-rW / 2, -rD / 2], [rW / 2, -rD / 2], [-rW / 2, rD / 2], [rW / 2, rD / 2], [0, -rD / 2], [0, rD / 2]].forEach(([px, pz]) => {
      const col = new THREE.Mesh(new THREE.BoxGeometry(0.1, rH, 0.1), blueRackMat);
      col.position.set(px, rH / 2, pz);
      col.castShadow = true;
      rackGroup.add(col);
    });

    // Các thanh dầm ngang chịu lực màu cam rực rỡ (Orange Load Beams) 4 tầng
    for (let tier = 1; tier <= 4; tier++) {
      const beamY = tier * 0.95;

      // 2 Dầm dài phía trước & sau
      [-rD / 2, rD / 2].forEach((bz) => {
        const beam = new THREE.Mesh(new THREE.BoxGeometry(rW, 0.08, 0.06), orangeRackMat);
        beam.position.set(0, beamY, bz);
        rackGroup.add(beam);
      });

      // Mặt sàn đỡ pallet tôn gân
      const shelfDeck = new THREE.Mesh(new THREE.BoxGeometry(rW - 0.1, 0.03, rD - 0.1), steelMat);
      shelfDeck.position.set(0, beamY + 0.02, 0);
      rackGroup.add(shelfDeck);

      // Đặt các pallet hàng & thùng carton trên từng tầng kệ (như ảnh 2 & 3)
      [-rW / 4, rW / 4].forEach((px, pIdx) => {
        if ((tier + rbIdx + pIdx) % 2 === 0) {
          // Pallet gỗ đỡ thùng phụ tùng carton DK Bike
          const pallet = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.1, 0.95), cartonMat);
          pallet.position.set(px, beamY + 0.08, 0);
          rackGroup.add(pallet);

          const cBox = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.55, 0.85), cartonMat);
          cBox.position.set(px, beamY + 0.42, 0);
          cBox.castShadow = true;
          rackGroup.add(cBox);
        } else {
          // Các khay nhựa công nghiệp màu xanh & đỏ xếp chồng (như ảnh 3)
          for (let kx = -0.35; kx <= 0.35; kx += 0.45) {
            const cMat = (kx > 0) ? crateRedMat : crateBlueMat;
            const crate = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.28, 0.65), cMat);
            crate.position.set(px + kx, beamY + 0.16, 0);
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

  // Xe đẩy khay nhựa phân loại linh kiện cơ động (Mobile Parts Trolley như ảnh 3)
  [-1.5, 4.0].forEach((tz) => {
    const cartGroup = new THREE.Group();
    cartGroup.position.set(2.2, 0, tz); // Nằm ở lối đi giữa kệ và dây chuyền

    // Khung xe đẩy màu xanh có bánh xe
    const cartFrame = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.4, 1.2), blueRackMat);
    cartFrame.position.y = 0.75;
    cartGroup.add(cartFrame);

    // Các khay nhựa xanh xếp tầng chứa phụ tùng nhựa dàn áo
    for (let cy = 0.3; cy <= 1.2; cy += 0.35) {
      const bCrate = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.22, 1.1), crateBlueMat);
      bCrate.position.y = cy;
      cartGroup.add(bCrate);
    }
    interiorGroup.add(cartGroup);
  });

  // Khu vực dự phòng đặt Pallet động cơ (sát vách Bắc theo bản vẽ PDF: 45 pallet)
  for (let mx = -4.5; mx <= 4.5; mx += 1.8) {
    const mPallet = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.1, 1.0), cartonMat);
    mPallet.position.set(mx, 0.05, -cfg.depth / 2 + 1.2);
    interiorGroup.add(mPallet);

    const mStack = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.65, 0.9), cartonMat);
    mStack.position.set(mx, 0.42, -cfg.depth / 2 + 1.2);
    interiorGroup.add(mStack);
  }

  group.add(interiorGroup);
}
`;

// Replace buildNhaB in mainCode
const oldNhaBStart = 'function buildNhaB() {';
const oldNhaBEnd = '// Hàm khởi tạo Cửa cuốn công nghiệp có thể mở/đóng và lộ dây chuyền bên trong';

const idxNhaBStart = mainCode.indexOf(oldNhaBStart);
const idxNhaBEnd = mainCode.indexOf(oldNhaBEnd);

if (idxNhaBStart !== -1 && idxNhaBEnd !== -1) {
  mainCode = mainCode.substring(0, idxNhaBStart) + newBuildNhaBFull + '\n' + mainCode.substring(idxNhaBEnd);
  console.log('Replaced buildNhaB and added buildNhaBInterior successfully!');
} else {
  console.log('WARNING: Could not find buildNhaB start/end markers in src/main.js.');
}

// 4. Update setCameraPreset to toggle roof visibility for insideNhaB
console.log('4. Updating setCameraPreset for automatic roof toggle...');
const oldPresetLogic = `  const endPos = new THREE.Vector3(preset.pos.x, preset.pos.y, preset.pos.z);
  const endTarget = new THREE.Vector3(preset.target.x, preset.target.y, preset.target.z);`;

const newPresetLogic = `  const endPos = new THREE.Vector3(preset.pos.x, preset.pos.y, preset.pos.z);
  const endTarget = new THREE.Vector3(preset.target.x, preset.target.y, preset.target.z);

  // Tự động mở mái xưởng B khi xem góc nhìn nội thất bên trong, khôi phục mái khi xem toàn cảnh
  if (nhaBRoofGroupGlobal) {
    nhaBRoofGroupGlobal.visible = (key !== 'insideNhaB');
  }`;

if (mainCode.includes(oldPresetLogic)) {
  mainCode = mainCode.replace(oldPresetLogic, newPresetLogic);
  console.log('Updated setCameraPreset with roof toggle successfully!');
} else {
  console.log('WARNING: Could not find oldPresetLogic in setCameraPreset.');
}

// 5. Update animate loop to rotate inside HVLS ceiling fans
console.log('5. Animating HVLS ceiling fans in animate()...');
const oldRoofVentAnimate = `  // 12. Quạt thông gió trên nóc xưởng B xoay tròn liên tục
  roofVentilators.forEach((v) => {
    v.rotation.y += delta * 3.5;
  });`;

const newRoofVentAnimate = `  // 12. Quạt thông gió trên nóc xưởng B xoay tròn liên tục
  roofVentilators.forEach((v) => {
    v.rotation.y += delta * 3.5;
  });

  // Quạt trần công nghiệp HVLS cánh lớn sải rộng bên trong xưởng B
  insideHVLSFans.forEach((fan) => {
    fan.rotation.y += delta * 1.8;
  });`;

if (mainCode.includes(oldRoofVentAnimate)) {
  mainCode = mainCode.replace(oldRoofVentAnimate, newRoofVentAnimate);
  console.log('Updated animate() with HVLS ceiling fan rotation successfully!');
} else {
  console.log('WARNING: Could not find oldRoofVentAnimate in src/main.js.');
}

// 6. Add 3D HTML labels for interior features
console.log('6. Adding 3D labels for interior factory features in createBuildingLabels()...');
const oldLabelAnchor = `{ text: '🏍️ Khu tập kết xe sau chạy thử', pos: new THREE.Vector3(68, 2.5, -42), id: 'stagingBikes' },`;
const newLabelsAnchor = `{ text: '🏍️ Khu tập kết xe sau chạy thử', pos: new THREE.Vector3(68, 2.5, -42), id: 'stagingBikes' },
    // Nội thất Xưởng B
    { text: '🔧 Dây chuyền lắp ráp DK Bike', pos: new THREE.Vector3(63.2, 3.2, -45), id: 'insideAssemblyLine' },
    { text: '🛗 Thang tời hàng 2.5T', pos: new THREE.Vector3(56.2, 4.2, -36.5), id: 'insideFreightLift' },
    { text: '📦 Giá kệ kho linh kiện', pos: new THREE.Vector3(70.5, 3.8, -48), id: 'insidePartsRacks' },
    { text: '🛵 Khu tập kết xe thành phẩm', pos: new THREE.Vector3(57.8, 2.2, -50), id: 'insideStagingArea' },`;

if (mainCode.includes(oldLabelAnchor)) {
  mainCode = mainCode.replace(oldLabelAnchor, newLabelsAnchor);
  console.log('Added interior 3D labels successfully!');
} else {
  console.log('WARNING: Could not find oldLabelAnchor in createBuildingLabels().');
}

// 7. Add modal support for interior features in handleLabelClick
console.log('7. Adding modal details for interior features in handleLabelClick()...');
const oldBMatchTarget = `      volleyballCourt: { type: 'sports', title: 'Sân bóng chuyền ngoài trời DK1' },`;
const newBMatchTarget = `      volleyballCourt: { type: 'sports', title: 'Sân bóng chuyền ngoài trời DK1' },
      insideAssemblyLine: { type: 'factory', title: 'Dây chuyền lắp ráp xe máy điện DK Bike' },
      insideFreightLift: { type: 'lift', title: 'Thang tời hàng công nghiệp 2.5 Tấn' },
      insidePartsRacks: { type: 'warehouse', title: 'Giá kệ kho linh kiện & Pallet động cơ' },
      insideStagingArea: { type: 'staging', title: 'Khu tập kết xe máy điện thành phẩm' },`;

if (mainCode.includes(oldBMatchTarget)) {
  mainCode = mainCode.replace(oldBMatchTarget, newBMatchTarget);
  console.log('Added modal support for interior features successfully!');
} else {
  console.log('WARNING: Could not find oldBMatchTarget in handleLabelClick.');
}

// Save mainCode
fs.writeFileSync(mainPath, mainCode.replace(/\n/g, hadCRLF ? '\r\n' : '\n'), 'utf8');
console.log('All updates applied successfully to src/main.js!');
