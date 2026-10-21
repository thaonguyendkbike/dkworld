// scripts/apply_campus_amenities_overhaul.cjs
const fs = require('fs');
const path = require('path');

const mainPath = path.join(__dirname, '..', 'src', 'main.js');
let code = fs.readFileSync(mainPath, 'utf8');
const hadCRLF = code.includes('\r\n');
code = code.replace(/\r\n/g, '\n');

console.log('Original main.js lines:', code.split('\n').length);

// 1. ADD GLOBAL DECLARATIONS
const declTarget = 'let chimneySmokePuffs = [];';
const declReplacement = `let chimneySmokePuffs = [];
let roadsideSmokePuffs = [];
let waterSplashRipples = [];`;

if (code.includes(declTarget) && !code.includes('let roadsideSmokePuffs = [];')) {
  code = code.replace(declTarget, declReplacement);
  console.log('1. Added global declarations for roadsideSmokePuffs & waterSplashRipples');
}

// 2. ENHANCE WATER SHADER CRYSTAL CLARITY
const waterShaderTarget = 'gl_FragColor = vec4(waterCol, 0.90);';
const waterShaderReplacement = 'gl_FragColor = vec4(waterCol, 0.74);';
if (code.includes(waterShaderTarget)) {
  code = code.replace(waterShaderTarget, waterShaderReplacement);
  console.log('2. Enhanced water shader crystal clarity (0.90 -> 0.74)');
}

// 3. ADD HELPER createWaterSplash
if (!code.includes('function createWaterSplash(')) {
  const splashFunc = `
// Hiệu ứng vòng sóng nước bắn tung tóe khi cá Koi nhảy búng nước
function createWaterSplash(x, y, z, parentGroup = null) {
  const ringGeo = new THREE.RingGeometry(0.12, 0.28, 24);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.85,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(x, y + 0.015, z);
  if (parentGroup) {
    parentGroup.add(ring);
  } else {
    scene.add(ring);
  }
  waterSplashRipples.push({
    mesh: ring,
    parent: parentGroup || scene,
    scale: 0.35,
    maxScale: 2.2,
    opacity: 0.85,
    life: 0,
    maxLife: 1.1,
  });
}
`;
  // Insert before buildVastTerrainAndClouds or near water materials
  const insertMarker = 'function createStylizedWaterMaterial(';
  code = code.replace(insertMarker, splashFunc + '\n' + insertMarker);
  console.log('3. Added createWaterSplash helper function');
}

// 4. HOOK buildDKCoffeeBar INTO buildDK2Buildings
const dk2BuildTarget = `function buildDK2Buildings() {
  buildNhaDieuHanhDK2();
  buildKhoLinhKienDK2();
  buildXuongDK2();
  buildSanThanhPhamDK2();
}`;
const dk2BuildReplacement = `function buildDK2Buildings() {
  buildNhaDieuHanhDK2();
  buildKhoLinhKienDK2();
  buildXuongDK2();
  buildSanThanhPhamDK2();
  buildDKCoffeeBar();
}`;
if (code.includes(dk2BuildTarget)) {
  code = code.replace(dk2BuildTarget, dk2BuildReplacement);
  console.log('4. Hooked buildDKCoffeeBar into buildDK2Buildings');
}

// 5. OVERHAUL KOI POND NEXT TO NHA DIEU HANH DK2 (Zen Japanese Koi Garden)
const oldPondStart = `  // Koi Pond (Hồ cá Koi cảnh quan - Bố trí khoảng cách chuẩn không lấn đường nhựa và không lấn nhà)`;
const oldPondEnd = `function buildKhoLinhKienDK2() {`;

const oldPondIdx = code.indexOf(oldPondStart);
const oldPondEndIdx = code.indexOf(oldPondEnd);

if (oldPondIdx !== -1 && oldPondEndIdx !== -1) {
  const newZenPondCode = `  // Hồ cá Koi phong cách Nhật Bản bên cạnh Nhà điều hành DK2 (Gần đường ĐT234)
  buildDK2HeadquartersKoiPond(group, cfg);

  scene.add(group);
  buildingMeshes.push(body);
}

// ============================================================================
// HỒ CÁ KOI TIỂU CẢNH NHẬT BẢN CẠNH NHÀ ĐIỀU HÀNH DK2 (VEN ĐƯỜNG ĐT234)
// ============================================================================
function buildDK2HeadquartersKoiPond(parentGroup, cfg) {
  const pondCenterX = cfg.width / 2 + 5.2; // Thế đất phong thủy giữa Nhà điều hành & ĐT234 (x ≈ -19.8)
  const pondCenterZ = 0.5;
  const pondY = 0.12;

  const pondGroup = new THREE.Group();
  pondGroup.position.set(pondCenterX, pondY, pondCenterZ);
  pondGroup.userData = {
    id: 'hoCaKoiDK2',
    title: 'Hồ cá Koi cảnh quan DK2 (Ven đường ĐT234)',
    desc: 'Hồ cá Koi tiểu cảnh Nhật Bản sinh động ngay bên hông Nhà điều hành DK2 và trục đường ĐT234. Nước trong vắt soi bóng cầu gỗ đỏ, đèn đá cổ truyền cùng đàn cá Koi rực rỡ bơi lội thanh bình.',
    type: 'landscape',
    zone: 'DK2',
  };

  const radX = 4.2;
  const radZ = 3.4;

  // 1. Kè đá tự nhiên viền hồ (Granite & Mossy River Boulders)
  const rockGeo = new THREE.DodecahedronGeometry(0.55, 1);
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.9, flatShading: true });
  const mossMat = new THREE.MeshStandardMaterial({ color: 0x365314, roughness: 0.85, flatShading: true });

  const rockCount = 32;
  for (let r = 0; r < rockCount; r++) {
    const angle = (r / rockCount) * Math.PI * 2;
    const rx = Math.cos(angle) * (radX + Math.sin(angle * 3) * 0.4);
    const rz = Math.sin(angle) * (radZ + Math.cos(angle * 2) * 0.35);
    const s = 0.7 + Math.random() * 0.5;

    const boulder = new THREE.Mesh(rockGeo, r % 3 === 0 ? mossMat : rockMat);
    boulder.position.set(rx, 0.18 + (Math.random() - 0.5) * 0.08, rz);
    boulder.scale.set(s, s * 0.75, s);
    boulder.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    boulder.castShadow = true;
    boulder.receiveShadow = true;
    pondGroup.add(boulder);
  }

  // 2. Lòng hồ cát mịn & Mặt nước hồ trong vắt (Crystal-Clear Stylized Water)
  const sandBed = new THREE.Mesh(
    new THREE.CircleGeometry(radX - 0.15, 32),
    new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.95 })
  );
  sandBed.rotation.x = -Math.PI / 2;
  sandBed.scale.set(1.0, radZ / radX, 1.0);
  sandBed.position.y = 0.02;
  pondGroup.add(sandBed);

  waterKoiMesh = new THREE.Mesh(
    new THREE.CircleGeometry(radX - 0.2, 32),
    createStylizedWaterMaterial(false)
  );
  waterKoiMesh.rotation.x = -Math.PI / 2;
  waterKoiMesh.scale.set(1.0, radZ / radX, 1.0);
  waterKoiMesh.position.y = 0.32;
  pondGroup.add(waterKoiMesh);

  // 3. Cầu gỗ cong bán nguyệt sơn đỏ (Taiko-bashi Japanese Red Arched Bridge)
  const bridgeGroup = new THREE.Group();
  bridgeGroup.position.set(-0.6, 0.32, 0.4);
  bridgeGroup.rotation.y = 0.45;

  const brLen = 4.4;
  const brWidth = 1.35;
  const redMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.5 });
  const darkWoodMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.8 });

  const plankNum = 18;
  for (let p = 0; p < plankNum; p++) {
    const t = p / (plankNum - 1);
    const px = (t - 0.5) * brLen;
    const py = Math.sin(t * Math.PI) * 0.55;
    const plank = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.05, brWidth), darkWoodMat);
    plank.position.set(px, py, 0);
    plank.rotation.z = -Math.cos(t * Math.PI) * 0.24;
    plank.receiveShadow = true;
    bridgeGroup.add(plank);

    if (p % 3 === 0) {
      [-brWidth / 2 + 0.04, brWidth / 2 - 0.04].forEach((bz) => {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.65, 6), redMat);
        post.position.set(px, py + 0.32, bz);
        bridgeGroup.add(post);
      });
    }
  }

  // Tay vịn cong đỏ hai bên cầu
  [-brWidth / 2 + 0.04, brWidth / 2 - 0.04].forEach((bz) => {
    for (let p = 0; p < plankNum - 1; p++) {
      const t1 = p / (plankNum - 1);
      const t2 = (p + 1) / (plankNum - 1);
      const x1 = (t1 - 0.5) * brLen;
      const y1 = Math.sin(t1 * Math.PI) * 0.55 + 0.62;
      const x2 = (t2 - 0.5) * brLen;
      const y2 = Math.sin(t2 * Math.PI) * 0.55 + 0.62;

      const segLen = Math.hypot(x2 - x1, y2 - y1);
      const railSeg = new THREE.Mesh(new THREE.BoxGeometry(segLen, 0.05, 0.06), redMat);
      railSeg.position.set((x1 + x2) / 2, (y1 + y2) / 2, bz);
      railSeg.rotation.z = Math.atan2(y2 - y1, x2 - x1);
      bridgeGroup.add(railSeg);
    }
  });

  pondGroup.add(bridgeGroup);

  // 4. Đèn đá Nhật Bản cổ truyền (Yukimi-doro Stone Lantern)
  const lanternMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.9, flatShading: true });
  const lanternGlowMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
  const stoneLantern = new THREE.Group();
  stoneLantern.position.set(radX * 0.72, 0.15, -radZ * 0.7);

  const basePillar = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.28, 0.45, 6), lanternMat);
  basePillar.position.y = 0.225;
  stoneLantern.add(basePillar);

  const fireBox = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.28, 0.32), lanternGlowMat);
  fireBox.position.y = 0.58;
  stoneLantern.add(fireBox);

  const stoneRoof = new THREE.Mesh(new THREE.ConeGeometry(0.55, 0.25, 4), lanternMat);
  stoneRoof.rotation.y = Math.PI / 4;
  stoneRoof.position.y = 0.82;
  stoneLantern.add(stoneRoof);

  const stoneFinial = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), lanternMat);
  stoneFinial.position.y = 0.98;
  stoneLantern.add(stoneFinial);

  pondGroup.add(stoneLantern);

  // 5. Ống tre róc rách (Bamboo Shishi-odoshi Water Spout)
  const bambooMat = new THREE.MeshStandardMaterial({ color: 0x65a30d, roughness: 0.6 });
  const bambooStand1 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.75, 6), bambooMat);
  bambooStand1.position.set(-radX * 0.75, 0.35, -radZ * 0.5);
  pondGroup.add(bambooStand1);

  const bambooSpout = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.65, 6), bambooMat);
  bambooSpout.rotation.z = -Math.PI / 3;
  bambooSpout.position.set(-radX * 0.75 + 0.22, 0.55, -radZ * 0.5);
  pondGroup.add(bambooSpout);

  // 6. Quần thể lá súng & Hoa sen nở trên mặt hồ
  const padMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.7, flatShading: true });
  const flowerMat = new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.5 });
  const centerMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });

  for (let l = 0; l < 8; l++) {
    const lang = (l / 8) * Math.PI * 2 + Math.random() * 0.4;
    const lrad = 1.0 + Math.random() * 1.8;
    const lx = Math.cos(lang) * (lrad * (radX / radZ) * 0.7);
    const lz = Math.sin(lang) * (lrad * 0.7);

    const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.015, 7), padMat);
    pad.position.set(lx, 0.33, lz);
    pad.rotation.y = Math.random() * Math.PI;
    pondGroup.add(pad);

    if (l % 2 === 0) {
      const fl = new THREE.Mesh(new THREE.SphereGeometry(0.09, 5, 4), flowerMat);
      fl.position.set(lx, 0.36, lz);
      pondGroup.add(fl);
    }
  }

  // 7. Lối đi lát phiến đá dạo bước (Stepping Stones)
  const stepMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.9, flatShading: true });
  const stepPositions = [
    { x: -radX - 1.2, z: 0.8 },
    { x: -radX - 0.5, z: 1.6 },
    { x: 0.2, z: radZ + 0.6 },
    { x: 1.4, z: radZ + 0.7 },
    { x: 2.6, z: radZ + 0.3 },
  ];
  stepPositions.forEach((sp) => {
    const step = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.45, 0.08, 7), stepMat);
    step.position.set(sp.x, 0.04, sp.z);
    step.rotation.y = Math.random() * Math.PI;
    step.receiveShadow = true;
    pondGroup.add(step);
  });

  // 8. Đàn cá Koi 7 con bơi lội sinh động (Nổi bật, rõ nét)
  buildHeadquartersKoiFishes(pondGroup);

  parentGroup.add(pondGroup);
  interactiveObjects.push(pondGroup);
}

// Khởi tạo đàn cá Koi bơi lội trong hồ nước Nhà điều hành DK2
function buildHeadquartersKoiFishes(parentPondGroup) {
  const breeds = [
    { name: 'Kohaku', body: 0xffffff, spot: 0xef4444 }, // Trắng đỏ rực rỡ
    { name: 'Sanke', body: 0xffffff, spot: 0x0f172a }, // Trắng chấm đen
    { name: 'Yamabuki', body: 0xfacc15, spot: 0xf59e0b }, // Vàng kim óng ánh
    { name: 'Benigoi', body: 0xf97316, spot: 0xdc2626 }, // Đỏ cam toàn thân
    { name: 'Tancho', body: 0xffffff, spot: 0xdc2626 }, // Trắng đốm đỏ đỉnh đầu
    { name: 'Showa', body: 0x18181b, spot: 0xef4444 }, // Đen vệt đỏ
    { name: 'Shiro', body: 0xffffff, spot: 0x475569 }, // Trắng xám
  ];

  breeds.forEach((bInfo, i) => {
    const fGroup = new THREE.Group();
    const bMat = new THREE.MeshStandardMaterial({ color: bInfo.body, roughness: 0.35 });
    const sMat = new THREE.MeshStandardMaterial({ color: bInfo.spot, roughness: 0.35 });

    // Thân cá Koi thon thả (Dài 0.72m, nhìn rõ mồn một từ camera)
    const fBody = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.72, 6), bMat);
    fBody.rotation.x = Math.PI / 2;
    fGroup.add(fBody);

    // Đốm màu đặc trưng trên lưng
    const bSpot = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.08, 0.32), sMat);
    bSpot.position.set(0, 0.07, 0.06);
    fGroup.add(bSpot);

    // Vây lưng nhô lên
    const dorsalFin = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.12, 0.28), sMat);
    dorsalFin.position.set(0, 0.12, -0.05);
    fGroup.add(dorsalFin);

    // Đuôi cá quạt nước
    const tailMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(0.24, 0.3),
      new THREE.MeshBasicMaterial({ color: bInfo.spot, side: THREE.DoubleSide })
    );
    tailMesh.position.set(0, 0, -0.42);
    fGroup.add(tailMesh);

    const radX = 1.6 + (i % 3) * 0.7;
    const radZ = 1.2 + (i % 3) * 0.55;
    const speed = 0.55 + (i % 4) * 0.12;
    const angle = (i / breeds.length) * Math.PI * 2;

    fGroup.position.set(Math.cos(angle) * radX, 0.28, Math.sin(angle) * radZ);
    parentPondGroup.add(fGroup);

    koiFishes.push({
      mesh: fGroup,
      tail: tailMesh,
      baseX: 0,
      baseZ: 0,
      radiusX: radX,
      radiusZ: radZ,
      angle: angle,
      speed: speed,
    });
  });
}

${oldPondEnd}`;

  code = code.substring(0, oldPondIdx) + newZenPondCode + code.substring(oldPondEndIdx + oldPondEnd.length);
  console.log('5. Overhauled DK2 Headquarters Zen Japanese Koi Garden');
} else {
  console.warn('5. Warning: Could not find old pond code block in buildNhaDieuHanhDK2');
}

// 6. ADD buildDKCoffeeBar FUNCTION
if (!code.includes('function buildDKCoffeeBar() {')) {
  const cafeFunction = `
// ============================================================================
// QUÁN CÀ PHÊ & LOUNGE DK COFFEE & BAR (ĐỐI DIỆN NHÀ ĐIỀU HÀNH DK2)
// ============================================================================
function buildDKCoffeeBar() {
  const cafeGroup = new THREE.Group();
  cafeGroup.position.set(-24.0, 0, 8.5); // Nằm ngay đối diện Nhà điều hành DK2 qua trục đường nội bộ
  cafeGroup.userData = {
    id: 'dkCoffeeBar',
    title: 'DK Coffee & Bar (Khuôn viên DK2)',
    desc: 'Không gian cà phê & lounge thư giãn phong cách mở hiện đại đối diện Nhà điều hành DK2. Nơi phục vụ thức uống mát lành, cà phê pha máy cho cán bộ công nhân viên DK Bike cùng đối tác ghé thăm.',
    type: 'building',
    zone: 'DK2',
  };

  // 1. Sàn gỗ Terrace ngoài trời (Raised Timber Deck 9.6m x 7.8m)
  const deckMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 });
  const deck = new THREE.Mesh(new THREE.BoxGeometry(9.6, 0.22, 7.8), deckMat);
  deck.position.set(0, 0.11, 0);
  deck.receiveShadow = true;
  cafeGroup.add(deck);

  // 2. Kiosk quầy Bar pha chế hiện đại (Modern Wood & Black Steel Pavilion)
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.7 });
  const kiosk = new THREE.Mesh(new THREE.BoxGeometry(4.2, 3.0, 2.8), wallMat);
  kiosk.position.set(-2.2, 1.6, -1.8);
  kiosk.castShadow = true;
  cafeGroup.add(kiosk);

  // Mái che phẳng viền thép đen
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.3 });
  const roof = new THREE.Mesh(new THREE.BoxGeometry(5.0, 0.25, 3.6), roofMat);
  roof.position.set(-2.2, 3.2, -1.8);
  roof.castShadow = true;
  cafeGroup.add(roof);

  // Quầy Bar phục vụ (Service Counter)
  const counterMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });
  const counter = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.05, 0.65), counterMat);
  counter.position.set(-2.2, 0.65, -0.3);
  counter.castShadow = true;
  cafeGroup.add(counter);

  // Mặt đá quầy Bar
  const counterTop = new THREE.Mesh(
    new THREE.BoxGeometry(3.8, 0.08, 0.75),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2 })
  );
  counterTop.position.set(-2.2, 1.2, -0.3);
  cafeGroup.add(counterTop);

  // Máy pha cà phê Espresso chuyên nghiệp (Đỏ & Inox)
  const espressoGroup = new THREE.Group();
  espressoGroup.position.set(-2.8, 1.25, -0.3);
  const espressoBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.65, 0.45, 0.4),
    new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.3, metalness: 0.4 })
  );
  espressoBody.position.y = 0.225;
  espressoGroup.add(espressoBody);
  const chromeTop = new THREE.Mesh(
    new THREE.BoxGeometry(0.62, 0.06, 0.38),
    new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.1, metalness: 0.9 })
  );
  chromeTop.position.y = 0.48;
  espressoGroup.add(chromeTop);
  [-0.15, 0.15].forEach((cx) => {
    const port = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.14),
      new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.8 })
    );
    port.position.set(cx, 0.16, 0.18);
    espressoGroup.add(port);
  });
  cafeGroup.add(espressoGroup);

  // Máy xay cà phê (Coffee Grinder)
  const grinder = new THREE.Group();
  grinder.position.set(-2.2, 1.25, -0.3);
  const grinderBody = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.42, 8), new THREE.MeshStandardMaterial({ color: 0x1e293b }));
  grinderBody.position.y = 0.21;
  grinder.add(grinderBody);
  const hopper = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.2, 8), new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.3 }));
  hopper.rotation.x = Math.PI;
  hopper.position.y = 0.45;
  grinder.add(hopper);
  cafeGroup.add(grinder);

  // Tủ kính trưng bày bánh ngọt (Pastry Display Case)
  const pastryCase = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.4, 0.45),
    new THREE.MeshStandardMaterial({ color: 0xbae6fd, transparent: true, opacity: 0.6, roughness: 0.1 })
  );
  pastryCase.position.set(-1.3, 1.45, -0.3);
  cafeGroup.add(pastryCase);

  // Bảng Menu phấn đen (Menu Chalkboard)
  const menuBoard = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 1.5, 0.04),
    new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 })
  );
  menuBoard.position.set(-0.2, 2.0, -1.8);
  cafeGroup.add(menuBoard);

  // 3. Biển hiệu chữ nổi 3D "☕ DK COFFEE & BAR" phát sáng ấm áp
  const signBacking = new THREE.Mesh(
    new THREE.BoxGeometry(3.6, 0.65, 0.12),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4 })
  );
  signBacking.position.set(-2.2, 3.65, -0.1);
  cafeGroup.add(signBacking);

  const signTrim = new THREE.Mesh(
    new THREE.BoxGeometry(3.68, 0.72, 0.08),
    new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.2, metalness: 0.8 })
  );
  signTrim.position.set(-2.2, 3.65, -0.12);
  cafeGroup.add(signTrim);

  const signTextPlate = new THREE.Mesh(
    new THREE.PlaneGeometry(3.4, 0.52),
    new THREE.MeshBasicMaterial({ color: 0xfef08a })
  );
  signTextPlate.position.set(-2.2, 3.65, -0.03);
  cafeGroup.add(signTextPlate);

  // Đèn rọi neon ấm rọi xuống quầy bar
  const warmLight = new THREE.PointLight(0xfef08a, 1.2, 8.0);
  warmLight.position.set(-2.2, 3.0, 0.2);
  cafeGroup.add(warmLight);

  // 4. Bàn ghế ngoài trời & Dù che nắng thương hiệu DK Bike
  const tablePositions = [
    { x: 1.8, z: -1.2, umbrella: true, color: 0x0284c7 },
    { x: 2.2, z: 1.8, umbrella: true, color: 0xdc2626 },
    { x: -0.6, z: 1.8, umbrella: false, color: 0x0284c7 },
  ];

  tablePositions.forEach((tp) => {
    const tableGroup = new THREE.Group();
    tableGroup.position.set(tp.x, 0.22, tp.z);

    const leg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.18, 0.75, 8),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7 })
    );
    leg.position.y = 0.375;
    tableGroup.add(leg);

    const tableTop = new THREE.Mesh(
      new THREE.CylinderGeometry(0.65, 0.65, 0.05, 16),
      new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.7 })
    );
    tableTop.position.y = 0.77;
    tableTop.receiveShadow = true;
    tableGroup.add(tableTop);

    const saucer = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.08, 0.02, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    saucer.position.set(0.15, 0.805, 0.1);
    tableGroup.add(saucer);
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.09, 8), new THREE.MeshBasicMaterial({ color: 0x0284c7 }));
    cup.position.set(0.15, 0.85, 0.1);
    tableGroup.add(cup);

    [0, Math.PI * 0.8, Math.PI * 1.4].forEach((rot) => {
      const chair = new THREE.Group();
      chair.rotation.y = rot;
      const seat = new THREE.Mesh(
        new THREE.CylinderGeometry(0.24, 0.24, 0.04, 8),
        new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 })
      );
      seat.position.set(0, 0.44, 0.65);
      chair.add(seat);
      const chairLeg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.02, 0.02, 0.44, 6),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8 })
      );
      chairLeg.position.set(0, 0.22, 0.65);
      chair.add(chairLeg);
      tableGroup.add(chair);
    });

    if (tp.umbrella) {
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, 2.7, 8),
        new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.8 })
      );
      pole.position.set(0, 1.35, 0);
      tableGroup.add(pole);

      const canopy = new THREE.Mesh(
        new THREE.ConeGeometry(1.4, 0.45, 8),
        new THREE.MeshStandardMaterial({ color: tp.color, roughness: 0.6, side: THREE.DoubleSide })
      );
      canopy.position.set(0, 2.65, 0);
      canopy.castShadow = true;
      tableGroup.add(canopy);
    }

    cafeGroup.add(tableGroup);
  });

  // 5. Nhân vật Barista & Khách uống cà phê
  const barista = createCharacter({
    shirtColor: 0x18181b,
    pantsColor: 0x334155,
    hatType: 'none',
    role: 'barista',
  });
  barista.position.set(-2.0, 0.22, -0.9);
  barista.rotation.y = 0;
  cafeGroup.add(barista);

  const customer1 = createCharacter({
    shirtColor: 0x0284c7,
    pantsColor: 0x475569,
    hatType: 'cap',
    role: 'customer',
  });
  customer1.position.set(1.8, 0.22, -0.6);
  customer1.rotation.y = -Math.PI / 2;
  cafeGroup.add(customer1);

  const customer2 = createCharacter({
    shirtColor: 0xf43f5e,
    pantsColor: 0x1e293b,
    hatType: 'none',
    role: 'customer',
  });
  customer2.position.set(2.2, 0.22, 2.4);
  customer2.rotation.y = 0;
  cafeGroup.add(customer2);

  // 6. Bồn hoa lavender & Cây cảnh viền quanh deck
  [-4.2, 4.2].forEach((px) => {
    const planter = new THREE.Mesh(
      new THREE.BoxGeometry(0.65, 0.6, 2.4),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 })
    );
    planter.position.set(px, 0.52, 0);
    cafeGroup.add(planter);

    const shrub = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.45, 2.3),
      new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.8, flatShading: true })
    );
    shrub.position.set(px, 0.95, 0);
    cafeGroup.add(shrub);
  });

  scene.add(cafeGroup);
  interactiveObjects.push(cafeGroup);
  buildingMeshes.push(kiosk);
}
`;
  // Insert before buildRoadsideHouses
  const insertMarker = 'function buildRoadsideHouses() {';
  code = code.replace(insertMarker, cafeFunction + '\n' + insertMarker);
  console.log('6. Added buildDKCoffeeBar function');
}

// 7. ADD ANIMATED SMOKE TO ROADSIDE HOUSES
const roadsideChimneyTarget = `    // 4. Ống khói nhỏ trên mái
    const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.2, 0.5), chimneyMat);
    chimney.position.set(w * 0.28, 0.35 + h + 1.2, -d * 0.2);
    chimney.castShadow = true;
    houseGroup.add(chimney);`;

const roadsideChimneyReplacement = `    // 4. Ống khói nhỏ trên mái
    const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.2, 0.5), chimneyMat);
    chimney.position.set(w * 0.28, 0.35 + h + 1.2, -d * 0.2);
    chimney.castShadow = true;
    houseGroup.add(chimney);

    // Khói lam chiều bốc nhẹ từ ống khói nhà dân ven đường ĐT234 (Sinh động, thơ mộng)
    const smokePuffCount = 5;
    const houseSmokeMat = new THREE.MeshBasicMaterial({
      color: 0xf1f5f9,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    });
    for (let sp = 0; sp < smokePuffCount; sp++) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(0.24, 6, 6), houseSmokeMat.clone());
      puff.position.set(w * 0.28, 0.35 + h + 1.8, -d * 0.2);
      houseGroup.add(puff);
      roadsideSmokePuffs.push({
        mesh: puff,
        baseX: w * 0.28,
        baseY: 0.35 + h + 1.8,
        baseZ: -d * 0.2,
        progress: sp / smokePuffCount,
        speed: 0.24 + Math.random() * 0.06,
        swayPhase: Math.random() * Math.PI * 2,
        maxScale: 0.85 + Math.random() * 0.3,
        maxHeight: 3.8 + Math.random() * 1.2,
      });
    }`;

if (code.includes(roadsideChimneyTarget) && !code.includes('roadsideSmokePuffs.push({')) {
  code = code.replace(roadsideChimneyTarget, roadsideChimneyReplacement);
  console.log('7. Added animated chimney smoke puffs to buildRoadsideHouses');
}

// 8. UPGRADE HILL POND (buildDK2HillPond): ARCHED BRIDGE & JUMPING KOI
const hillPondStart = `function buildDK2HillPond() {`;
const hillPondNextFunc = `// ============================================================================
// Đồi Sinh Thái Mới DK2: Vườn Hoa Rực Rỡ, Đàn Gà & Đàn Chim Bồ Câu Châu Âu`;

const hpStartIdx = code.indexOf(hillPondStart);
const hpEndIdx = code.indexOf(hillPondNextFunc);

if (hpStartIdx !== -1 && hpEndIdx !== -1) {
  const newHillPondFunction = `function buildDK2HillPond() {
  const hpCfg = CONFIG.WATER.hillPond;
  const pondBaseX = hpCfg.position ? hpCfg.position.x : -132.0;
  const pondBaseZ = hpCfg.position ? hpCfg.position.z : -76.0;
  const pondBaseY = getDK2HillSurfaceY(pondBaseX, pondBaseZ) + 0.6; // ~ 17.4m trên đỉnh đồi cạnh Vườn Lan
  const pondGroup = new THREE.Group();
  pondGroup.position.set(pondBaseX, pondBaseY, pondBaseZ);
  pondGroup.userData = {
    id: 'aoCaDK2',
    title: 'Ao cá đồi sinh thái DK2 (Cầu gỗ ngắm cá & cá bơi nhảy)',
    type: 'landscape',
    desc: 'Hồ cá sinh thái tự nhiên trên sườn đồi cao cạnh Vườn Lan. Cầu gỗ cong bán nguyệt vươn ra mặt nước trong xanh cho du khách dạo bước ngắm đàn cá Koi to lớn tung tăng bơi lội và nhảy búng nước bọt tung trắng xóa.',
    zone: 'DK2',
  };

  const radiusX = hpCfg.radiusX; // 16.5m
  const radiusZ = hpCfg.radiusZ; // 12.0m

  // Bệ kè đá bậc thang đồi nâng đỡ lòng hồ kiên cố
  const terraceGeo = new THREE.CylinderGeometry(hpCfg.terraceRadius, hpCfg.terraceRadius + 2.5, hpCfg.terraceHeight, 36);
  const terraceMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.9, flatShading: true });
  const terraceBase = new THREE.Mesh(terraceGeo, terraceMat);
  terraceBase.position.y = -hpCfg.terraceHeight / 2;
  terraceBase.receiveShadow = true;
  pondGroup.add(terraceBase);

  // 1. Natural Granite & Mossy Boulder Retaining Rim (48 tảng đá viền hồ tự nhiên)
  const boulderMat = new THREE.MeshStandardMaterial({ color: 0x52525b, roughness: 0.9, flatShading: true });
  const mossMat = new THREE.MeshStandardMaterial({ color: 0x365314, roughness: 0.85, flatShading: true });
  const boulderGeo = new THREE.DodecahedronGeometry(1.0, 1);
  const boulderCount = 48;

  for (let i = 0; i < boulderCount; i++) {
    const angle = (i / boulderCount) * Math.PI * 2;
    const bx = Math.cos(angle) * (radiusX + Math.sin(angle * 4) * 0.75);
    const bz = Math.sin(angle) * (radiusZ + Math.cos(angle * 3) * 0.65);
    const s = 0.85 + Math.random() * 0.6;

    const boulder = new THREE.Mesh(boulderGeo, i % 3 === 0 ? mossMat : boulderMat);
    boulder.position.set(bx, (Math.random() - 0.5) * 0.25, bz);
    boulder.scale.set(s, s * 0.8, s);
    boulder.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    boulder.castShadow = true;
    boulder.receiveShadow = true;
    pondGroup.add(boulder);
  }

  // 2. Bờ cát thoai thoải viền trong bờ đá hồ cá
  const sandRimGeo = new THREE.RingGeometry(radiusX - 1.5, radiusX + 0.2, 48);
  const sandRimMat = new THREE.MeshStandardMaterial({
    color: CONFIG.GROUND.sandColor,
    roughness: 0.95,
    side: THREE.DoubleSide,
  });
  const sandRim = new THREE.Mesh(sandRimGeo, sandRimMat);
  sandRim.rotation.x = -Math.PI / 2;
  sandRim.scale.set(1.0, radiusZ / radiusX, 1.0);
  sandRim.position.y = 0.04;
  sandRim.receiveShadow = true;
  pondGroup.add(sandRim);

  // 3. Mặt nước hồ cách điệu (Stylized Shader Nước trong vắt với Caustics)
  const waterGeo = new THREE.CircleGeometry(radiusX - 0.2, 48);
  const waterMat = createStylizedWaterMaterial(false);
  hillPondWater = new THREE.Mesh(waterGeo, waterMat);
  hillPondWater.rotation.x = -Math.PI / 2;
  hillPondWater.scale.set(1.0, radiusZ / radiusX, 1.0);
  hillPondWater.position.y = 0.08;
  pondGroup.add(hillPondWater);

  // 4. 24 Floating Lotus Pads & Pink Blossoms
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.7, flatShading: true });
  const flowerMat = new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.5 });
  const centerMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });

  for (let l = 0; l < 24; l++) {
    const lang = (l / 24) * Math.PI * 2 + Math.random() * 0.3;
    const lradX = (radiusX * 0.25) + Math.random() * (radiusX * 0.55);
    const lradZ = (radiusZ * 0.25) + Math.random() * (radiusZ * 0.55);
    const lx = Math.cos(lang) * lradX;
    const lz = Math.sin(lang) * lradZ;

    const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.02, 7), leafMat);
    pad.position.set(lx, 0.10, lz);
    pad.rotation.y = Math.random() * Math.PI;
    pondGroup.add(pad);

    if (l % 2 === 0) {
      const fl = new THREE.Group();
      fl.position.set(lx, 0.12, lz);
      for (let p = 0; p < 6; p++) {
        const petal = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.2, 4), flowerMat);
        petal.rotation.z = Math.PI / 4;
        petal.rotation.y = (p / 6) * Math.PI * 2;
        fl.add(petal);
      }
      const stamen = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 6), centerMat);
      stamen.position.y = 0.07;
      fl.add(stamen);
      pondGroup.add(fl);
    }
  }

  // 5. CẦU GỖ CONG NGẮM CÁ & CHO CÁ ĂN (Arched Wooden Viewing & Feeding Footbridge)
  const timberMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.85 });
  const bridgePlankMat = new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.8 });
  const railMat = new THREE.MeshStandardMaterial({ color: 0x5c3d2e, roughness: 0.85 });
  const pileMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.9 });
  const glowMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });

  const bridgeGroup = new THREE.Group();
  bridgeGroup.position.set(-radiusX * 0.22, 0.12, radiusZ * 0.45);
  bridgeGroup.rotation.y = -Math.PI / 4.2;

  const brLen = 10.5;
  const brWidth = 2.4;
  const plankSteps = 26;

  for (let p = 0; p < plankSteps; p++) {
    const t = p / (plankSteps - 1);
    const px = (t - 0.5) * brLen;
    const py = Math.sin(t * Math.PI) * 0.95; // Cầu cong cao 0.95m ngắm trọn cá bơi & nhảy bên dưới
    const plank = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.08, brWidth), bridgePlankMat);
    plank.position.set(px, py, 0);
    plank.rotation.z = -Math.cos(t * Math.PI) * 0.20;
    plank.receiveShadow = true;
    bridgeGroup.add(plank);

    // Cột lan can gỗ hai bên
    if (p % 3 === 0) {
      [-brWidth / 2 + 0.08, brWidth / 2 - 0.08].forEach((rz) => {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.88, 6), railMat);
        post.position.set(px, py + 0.44, rz);
        bridgeGroup.add(post);
      });
    }
  }

  // Tay vịn cong uốn lượn hai bên thành cầu
  [-brWidth / 2 + 0.08, brWidth / 2 - 0.08].forEach((rz) => {
    for (let p = 0; p < plankSteps - 1; p++) {
      const t1 = p / (plankSteps - 1);
      const t2 = (p + 1) / (plankSteps - 1);
      const x1 = (t1 - 0.5) * brLen;
      const y1 = Math.sin(t1 * Math.PI) * 0.95 + 0.84;
      const x2 = (t2 - 0.5) * brLen;
      const y2 = Math.sin(t2 * Math.PI) * 0.95 + 0.84;

      const segLen = Math.hypot(x2 - x1, y2 - y1);
      const railSeg = new THREE.Mesh(new THREE.BoxGeometry(segLen, 0.07, 0.08), railMat);
      railSeg.position.set((x1 + x2) / 2, (y1 + y2) / 2, rz);
      railSeg.rotation.z = Math.atan2(y2 - y1, x2 - x1);
      bridgeGroup.add(railSeg);
    }
  });

  // Trụ cọc cắm lòng hồ
  [-2.8, 0, 2.8].forEach((hx) => {
    [-brWidth / 2 + 0.2, brWidth / 2 - 0.2].forEach((hz) => {
      const pile = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 2.4, 6), pileMat);
      pile.position.set(hx, -0.65, hz);
      bridgeGroup.add(pile);
    });
  });

  // Đèn lồng gỗ 2 đầu cầu
  [-brLen / 2 + 0.3, brLen / 2 - 0.3].forEach((lx) => {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.4, 6), timberMat);
    post.position.set(lx, 0.7, brWidth / 2 + 0.12);
    bridgeGroup.add(post);

    const lamp = new THREE.Mesh(new THREE.DodecahedronGeometry(0.2), glowMat);
    lamp.position.set(lx, 1.4, brWidth / 2 + 0.12);
    bridgeGroup.add(lamp);
  });

  // Người đứng trên cầu ngắm cảnh & Người rắc mồi cho cá ăn
  const feederOnBridge = createCharacter({
    shirtColor: 0xef4444, // Áo đỏ nổi bật
    pantsColor: 0x1e293b,
    hatType: 'cap',
    role: 'tourist',
  });
  feederOnBridge.position.set(0.4, 0.95, -0.75);
  feederOnBridge.rotation.y = -Math.PI / 2;
  bridgeGroup.add(feederOnBridge);

  const companionOnBridge = createCharacter({
    shirtColor: 0xfacc15, // Áo vàng năng động
    pantsColor: 0x334155,
    hatType: 'none',
    role: 'tourist',
  });
  companionOnBridge.position.set(-0.9, 0.92, 0.75);
  companionOnBridge.rotation.y = Math.PI / 2;
  bridgeGroup.add(companionOnBridge);

  pondGroup.add(bridgeGroup);

  // Sàn gỗ ngắm cảnh phía Đông hồ (Viewing Deck)
  const deckGroup = new THREE.Group();
  deckGroup.position.set(radiusX * 0.62, 0.15, -radiusZ * 0.15);
  const deckFloor = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.10, 5.0), timberMat);
  deckFloor.receiveShadow = true;
  deckGroup.add(deckFloor);

  [
    { x: -2.3, z: -2.2 },
    { x: 2.3, z: -2.2 },
    { x: -2.3, z: 2.2 },
    { x: 2.3, z: 2.2 },
  ].forEach((pp) => {
    const pile = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.8, 6), pileMat);
    pile.position.set(pp.x, -0.85, pp.z);
    deckGroup.add(pile);
  });

  const feeder = createCharacter({
    shirtColor: 0x16a34a,
    pantsColor: 0x334155,
    hatType: 'conical',
    role: 'farmer',
  });
  feeder.position.set(-1.8, 0.05, 0);
  feeder.rotation.y = -Math.PI / 2;
  deckGroup.add(feeder);

  pondGroup.add(deckGroup);

  // 6. ĐÀN CÁ KOI LỚN 18 CON BƠI LỘI & NHẢY BÚNG NƯỚC (Leaping & Swimming Koi Fish)
  hillPondKoiFishes = [];
  const koiBreeds = [
    { name: 'Kohaku', body: 0xffffff, spot: 0xef4444, scale: 1.35 }, // Trắng đỏ rực rỡ
    { name: 'Sanke', body: 0xffffff, spot: 0x0f172a, scale: 1.25 }, // Trắng đen đỏ
    { name: 'Yamabuki Ogon', body: 0xfacc15, spot: 0xf59e0b, scale: 1.4 }, // Vàng óng ả
    { name: 'Benigoi', body: 0xf97316, spot: 0xdc2626, scale: 1.3 }, // Cam đỏ rực
    { name: 'Tancho', body: 0xffffff, spot: 0xdc2626, scale: 1.3 }, // Trắng chấm đỏ đầu
    { name: 'Showa', body: 0x18181b, spot: 0xef4444, scale: 1.35 }, // Đen đỏ
  ];

  for (let k = 0; k < 18; k++) {
    const fGroup = new THREE.Group();
    const breed = koiBreeds[k % koiBreeds.length];
    const bodyMat = new THREE.MeshStandardMaterial({ color: breed.body, roughness: 0.35 });
    const spotMat = new THREE.MeshStandardMaterial({ color: breed.spot, roughness: 0.35 });

    // Thân cá Koi lớn (Dài 1.05m, nhìn rõ rệt từ mọi góc nhìn camera)
    const bodyLen = 1.05 * breed.scale;
    const bodyRad = 0.24 * breed.scale;
    const body = new THREE.Mesh(new THREE.ConeGeometry(bodyRad, bodyLen, 6), bodyMat);
    body.rotation.x = Math.PI / 2;
    fGroup.add(body);

    // Đốm hoa văn lưng cá
    const spot = new THREE.Mesh(new THREE.BoxGeometry(bodyRad * 1.3, bodyRad * 0.7, bodyLen * 0.45), spotMat);
    spot.position.set(0, bodyRad * 0.45, bodyLen * 0.12);
    fGroup.add(spot);

    // Vây lưng kiêu hãnh nhô khỏi mặt nước
    const dorsalFin = new THREE.Mesh(new THREE.BoxGeometry(0.04, bodyRad * 0.9, bodyLen * 0.35), spotMat);
    dorsalFin.position.set(0, bodyRad * 0.75, -bodyLen * 0.08);
    fGroup.add(dorsalFin);

    // Vây bơi 2 bên (Pectoral Fins)
    [-1, 1].forEach((dir) => {
      const pecFin = new THREE.Mesh(new THREE.BoxGeometry(bodyRad * 1.1, 0.03, bodyRad * 0.7), spotMat);
      pecFin.position.set(dir * (bodyRad * 0.85), -bodyRad * 0.2, bodyLen * 0.2);
      pecFin.rotation.y = dir * 0.35;
      pecFin.rotation.z = -dir * 0.2;
      fGroup.add(pecFin);
    });

    // Vây đuôi quạt nước chuyển động mềm mại
    const tail = new THREE.Mesh(new THREE.PlaneGeometry(bodyRad * 1.4, bodyRad * 1.8), spotMat);
    tail.position.set(0, 0, -bodyLen * 0.58);
    fGroup.add(tail);

    // Bán kính quỹ đạo bơi lội phủ đều khắp hồ lớn
    const orbitRadiusX = 4.2 + (k % 5) * 2.2 + (k > 8 ? 1.0 : 0);
    const orbitRadiusZ = 3.0 + (k % 5) * 1.6 + (k > 8 ? 0.7 : 0);
    const speed = 0.45 + (k % 4) * 0.12;
    const initialAngle = (k / 18) * Math.PI * 2;

    // 5 con cá được lập trình nhảy búng nước (Cá nhảy búng nước!)
    const isJumper = k % 3 === 0;

    fGroup.position.set(Math.cos(initialAngle) * orbitRadiusX, 0.06, Math.sin(initialAngle) * orbitRadiusZ);
    pondGroup.add(fGroup);

    hillPondKoiFishes.push({
      mesh: fGroup,
      tail: tail,
      centerX: 0,
      centerZ: 0,
      radiusX: orbitRadiusX,
      radiusZ: orbitRadiusZ,
      speed: speed,
      angle: initialAngle,
      baseY: 0.06, // Bơi sát mặt nước (0.08) để lưng và vây lưng nhấp nhô sống động
      phase: k * 1.4,
      isJumper: isJumper,
      isJumping: false,
      jumpProgress: 0,
      jumpDuration: 1.1 + (k % 3) * 0.2,
      jumpTimer: 2.0 + k * 1.5, // Giãn cách nhảy so le giữa các con
      parentGroup: pondGroup,
    });
  }

  scene.add(pondGroup);
  interactiveObjects.push(pondGroup);
}
`;

  code = code.substring(0, hpStartIdx) + newHillPondFunction + '\n' + code.substring(hpEndIdx);
  console.log('8. Upgraded buildDK2HillPond with arched footbridge & jumping fish');
} else {
  console.warn('8. Warning: Could not find buildDK2HillPond code block');
}

// 9. UPDATE ANIMATED OBJECTS IN updateAnimatedObjects
// A. ROADSIDE SMOKE UPDATE
const smokeAnimTarget = `  // 9. Khói trắng zíc zắc từ ống khói các ngôi nhà (như ảnh 3)
  chimneySmokePuffs.forEach((puff, idx) => {
    puff.position.y += delta * 0.85;
    puff.scale.addScalar(delta * 0.1);
    if (puff.position.y > 7.8) {
      puff.position.y = 5.2;
      puff.scale.setScalar(0.7);
    }
  });`;

const smokeAnimReplacement = `  // 9. Khói trắng zíc zắc từ ống khói các ngôi nhà (như ảnh 3)
  chimneySmokePuffs.forEach((puff, idx) => {
    puff.position.y += delta * 0.85;
    puff.scale.addScalar(delta * 0.1);
    if (puff.position.y > 7.8) {
      puff.position.y = 5.2;
      puff.scale.setScalar(0.7);
    }
  });

  // Khói lam chiều bốc nhẹ từ các nhà dân ven đường ĐT234 (Yêu cầu 3)
  roadsideSmokePuffs.forEach((puff) => {
    puff.progress = (puff.progress + delta * puff.speed) % 1.0;
    const prg = puff.progress;
    puff.mesh.position.y = puff.baseY + prg * puff.maxHeight;
    const sway = Math.sin(prg * Math.PI * 2 + puff.swayPhase);
    puff.mesh.position.x = puff.baseX + sway * 0.35 + prg * 0.45;
    puff.mesh.position.z = puff.baseZ + Math.cos(prg * Math.PI * 2 + puff.swayPhase) * 0.25;
    const currentScale = 0.3 + Math.sin(prg * Math.PI) * puff.maxScale;
    puff.mesh.scale.setScalar(currentScale);
    puff.mesh.material.opacity = Math.sin(prg * Math.PI) * 0.55;
  });`;

if (code.includes(smokeAnimTarget) && !code.includes('roadsideSmokePuffs.forEach(')) {
  code = code.replace(smokeAnimTarget, smokeAnimReplacement);
  console.log('9A. Added roadside smoke animation to updateAnimatedObjects');
}

// B. HILL POND KOI SWIMMING & LEAPING / JUMPING ANIMATION
const hillKoiTarget = `  // 20. Đàn cá Koi bơi lội trong ao cá đồi DK2 (Ảnh 2)
  hillPondKoiFishes.forEach((fish) => {
    fish.angle += delta * fish.speed;
    const fx = fish.centerX + Math.cos(fish.angle) * fish.radiusX;
    const fz = fish.centerZ + Math.sin(fish.angle) * fish.radiusZ;
    fish.mesh.position.set(fx, fish.baseY, fz);
    fish.mesh.rotation.y = -fish.angle + Math.PI / 2;
    if (fish.tail) {
      fish.tail.rotation.y = Math.sin(time * 0.012 + fish.phase) * 0.45;
    }
  });`;

const hillKoiReplacement = `  // 20. Đàn cá Koi bơi lội & nhảy búng nước trong ao cá đồi DK2 (Yêu cầu 1)
  hillPondKoiFishes.forEach((fish) => {
    fish.angle += delta * fish.speed;
    const fx = fish.centerX + Math.cos(fish.angle) * fish.radiusX;
    const fz = fish.centerZ + Math.sin(fish.angle) * fish.radiusZ;

    // Hoạt cảnh cá nhảy búng nước (Leaping out of water)
    if (fish.isJumper) {
      if (fish.isJumping) {
        fish.jumpProgress += delta / fish.jumpDuration;
        if (fish.jumpProgress >= 1.0) {
          fish.isJumping = false;
          fish.jumpTimer = 3.5 + Math.random() * 5.0; // Nghỉ 3.5 - 8.5s trước khi nhảy tiếp
          createWaterSplash(fx, 0.08, fz, fish.parentGroup);
        } else {
          const jumpCurve = Math.sin(fish.jumpProgress * Math.PI);
          const jHeight = jumpCurve * 1.35; // Nhảy vọt lên khỏi mặt nước 1.35m
          fish.mesh.position.set(fx, fish.baseY + jHeight, fz);
          // Uốn thân và cắm đầu xuống khi rơi
          fish.mesh.rotation.y = -fish.angle + Math.PI / 2;
          fish.mesh.rotation.x = Math.sin((fish.jumpProgress - 0.5) * Math.PI) * 0.85;
          if (fish.tail) {
            fish.tail.rotation.y = Math.sin(time * 0.035) * 0.75;
          }
          return;
        }
      } else {
        fish.jumpTimer -= delta;
        if (fish.jumpTimer <= 0) {
          fish.isJumping = true;
          fish.jumpProgress = 0;
          fish.jumpDuration = 1.1 + Math.random() * 0.35;
          createWaterSplash(fx, 0.08, fz, fish.parentGroup);
        }
      }
    }

    // Bơi bình thường sát mặt hồ
    fish.mesh.position.set(fx, fish.baseY + Math.sin(time * 0.003 + fish.phase) * 0.02, fz);
    fish.mesh.rotation.y = -fish.angle + Math.PI / 2;
    fish.mesh.rotation.x = 0;
    if (fish.tail) {
      fish.tail.rotation.y = Math.sin(time * 0.015 + fish.phase) * 0.55;
    }
  });

  // Cập nhật vòng sóng nước bắn tung tóe (Water Splash Ripples)
  for (let i = waterSplashRipples.length - 1; i >= 0; i--) {
    const rip = waterSplashRipples[i];
    rip.life += delta;
    const t = rip.life / rip.maxLife;
    if (t >= 1.0) {
      rip.parent.remove(rip.mesh);
      rip.mesh.geometry.dispose();
      rip.mesh.material.dispose();
      waterSplashRipples.splice(i, 1);
      continue;
    }
    const s = rip.scale + t * (rip.maxScale - rip.scale);
    rip.mesh.scale.set(s, s, s);
    rip.mesh.material.opacity = (1.0 - t) * rip.opacity;
  }`;

if (code.includes(hillKoiTarget) && !code.includes('createWaterSplash(fx,')) {
  code = code.replace(hillKoiTarget, hillKoiReplacement);
  console.log('9B. Added leaping koi and water splash ripple updates to updateAnimatedObjects');
}

fs.writeFileSync(mainPath, hadCRLF ? code.replace(/\n/g, '\r\n') : code, 'utf8');
console.log('Successfully written updated src/main.js!');
console.log('New lines count:', code.split('\n').length);
