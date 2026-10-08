// scripts/patch_overhaul_full.cjs
const fs = require('fs');
const path = require('path');

const mainPath = path.join(__dirname, '..', 'src', 'main.js');
let code = fs.readFileSync(mainPath, 'utf8');

// ============================================================================
// 1. TERRAIN OVERHAUL: Replace hard box cuts with soft-sloped berm platforms
// ============================================================================
const oldPlatformsBlock = `  // DK1 Yard Platform
  const dk1Cfg = CONFIG.GROUND.dk1;
  const dk1Ground = new THREE.Mesh(
    new THREE.BoxGeometry(dk1Cfg.width, 2.0, dk1Cfg.depth),
    new THREE.MeshStandardMaterial({ color: dk1Cfg.color, roughness: 0.85, metalness: 0.1 })
  );
  dk1Ground.position.set(dk1Cfg.center.x, -1.0, dk1Cfg.center.z);
  dk1Ground.receiveShadow = true;
  scene.add(dk1Ground);

  // DK2 Yard Platform
  const dk2Cfg = CONFIG.GROUND.dk2;
  const dk2Ground = new THREE.Mesh(
    new THREE.BoxGeometry(dk2Cfg.width, 2.0, dk2Cfg.depth),
    new THREE.MeshStandardMaterial({ color: dk2Cfg.color, roughness: 0.85, metalness: 0.1 })
  );
  dk2Ground.position.set(dk2Cfg.center.x, -1.0, dk2Cfg.center.z);
  dk2Ground.receiveShadow = true;
  scene.add(dk2Ground);`;

const newPlatformsBlock = `  // Nâng cấp Địa hình & Mép bờ (Terrain Overhaul: Loại bỏ hoàn toàn mép cắt sắc nhọn)
  // Tạo hàm bệ đất có taluy dốc thoai thoải viền xung quanh (Soft Sloped Embankment Skirts)
  const createSlopedYardPlatform = (cfg, skirtWidth = 4.2) => {
    const group = new THREE.Group();
    const halfW = cfg.width / 2;
    const halfD = cfg.depth / 2;
    const topY = 0.0;
    const botY = -1.15;

    // Mặt bằng trung tâm phẳng
    const mainMat = new THREE.MeshStandardMaterial({
      color: cfg.color,
      roughness: 0.85,
      metalness: 0.08,
      flatShading: true,
    });
    const mainPlate = new THREE.Mesh(new THREE.BoxGeometry(cfg.width, 1.2, cfg.depth), mainMat);
    mainPlate.position.set(cfg.center.x, -0.6, cfg.center.z);
    mainPlate.receiveShadow = true;
    group.add(mainPlate);

    // Vật liệu taluy sườn dốc xanh cỏ mát dịu bắt sáng phong cách Toon
    const skirtMat = new THREE.MeshStandardMaterial({
      color: CONFIG.GROUND.grassAccentColor,
      roughness: 0.88,
      flatShading: true,
    });

    // 4 Mái vát dốc thoai thoải nối từ cao độ y=0 xuống y=-1.15 mặt đồng cỏ
    const addBerm = (bx, bz, bw, bd, rotY) => {
      const bermGeo = new THREE.BufferGeometry();
      const vertices = new Float32Array([
        // Tam giác lăng trụ dốc (vát nghiêng 30 độ)
        -bw / 2, topY, -bd / 2,
        bw / 2, topY, -bd / 2,
        -bw / 2, botY, bd / 2,

        bw / 2, topY, -bd / 2,
        bw / 2, botY, bd / 2,
        -bw / 2, botY, bd / 2,
      ]);
      bermGeo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
      bermGeo.computeVertexNormals();

      const bermMesh = new THREE.Mesh(bermGeo, skirtMat);
      bermMesh.position.set(bx, 0, bz);
      bermMesh.rotation.y = rotY;
      bermMesh.receiveShadow = true;
      group.add(bermMesh);
    };

    // Mái dốc Bắc, Nam, Đông, Tây
    addBerm(cfg.center.x, cfg.center.z - halfD - skirtWidth / 2, cfg.width, skirtWidth, 0);
    addBerm(cfg.center.x, cfg.center.z + halfD + skirtWidth / 2, cfg.width, skirtWidth, Math.PI);
    addBerm(cfg.center.x + halfW + skirtWidth / 2, cfg.center.z, cfg.depth, skirtWidth, -Math.PI / 2);
    addBerm(cfg.center.x - halfW - skirtWidth / 2, cfg.center.z, cfg.depth, skirtWidth, Math.PI / 2);

    // Dải chuyển tiếp đất sỏi nâu ấm quanh chân taluy (Gravel / Earth transition fringe)
    const fringeMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.95 });
    const fringe = new THREE.Mesh(
      new THREE.RingGeometry(Math.max(halfW, halfD) + skirtWidth * 0.9, Math.max(halfW, halfD) + skirtWidth * 1.3, 16),
      fringeMat
    );
    fringe.rotation.x = -Math.PI / 2;
    fringe.position.set(cfg.center.x, botY + 0.02, cfg.center.z);
    fringe.scale.set(cfg.width / Math.max(halfW, halfD) / 2, cfg.depth / Math.max(halfW, halfD) / 2, 1);
    group.add(fringe);

    return group;
  };

  // Nền phân khu DK1 & DK2 có taluy dốc thoai thoải hữu cơ
  const dk1Cfg = CONFIG.GROUND.dk1;
  const dk1Platform = createSlopedYardPlatform(dk1Cfg, 4.5);
  scene.add(dk1Platform);

  const dk2Cfg = CONFIG.GROUND.dk2;
  const dk2Platform = createSlopedYardPlatform(dk2Cfg, 4.5);
  scene.add(dk2Platform);`;

if (code.includes(oldPlatformsBlock)) {
  code = code.replace(oldPlatformsBlock, newPlatformsBlock);
  console.log('1. Replaced yard platforms with sloped berms.');
} else {
  console.log('Could not find exact oldPlatformsBlock, trying regex...');
  code = code.replace(/\/\/ DK1 Yard Platform[\s\S]*?scene\.add\(dk2Ground\);/, newPlatformsBlock);
  console.log('1. Replaced yard platforms via regex.');
}

// ============================================================================
// 2. HORIZON ROLLING MOUNTAINS: 24 Mountains enclosing West & North
// ============================================================================
const oldHillsBlock = `  // 2. Dãy đồi xanh nhấp nhô phía sau (Mạn Đông & Đông-Bắc tạo thung lũng như ảnh 1 & 2)
  const hillsData = [
    { x: 125, y: 11, z: -80, radius: 52, height: 26, color: 0x22c55e },
    { x: 142, y: 9, z: -25, radius: 48, height: 22, color: 0x16a34a },
    { x: 132, y: 8, z: 38, radius: 45, height: 20, color: 0x4ade80 },
    { x: 55, y: 12, z: -108, radius: 54, height: 28, color: 0x22c55e }, // Đồi Bắc đặt cối xay gió
  ];

  hillsData.forEach((h) => {
    const hillMesh = new THREE.Mesh(
      new THREE.ConeGeometry(h.radius, h.height, 9),
      new THREE.MeshStandardMaterial({ color: h.color, roughness: 0.9, flatShading: true })
    );
    hillMesh.position.set(h.x, h.y, h.z);
    hillMesh.receiveShadow = true;
    scene.add(hillMesh);
  });`;

const newHillsBlock = `  // 2. Dãy núi chân trời bao bọc phía Bắc, Tây-Bắc & Tây (Horizon Mountain Amphitheater - Che kín mép bản đồ như ảnh 1)
  const hillsData = [
    // --- KHU VỰC ĐÔNG & ĐÔNG BẮC (Thung lũng đường sắt & cối xay gió) ---
    { x: 125, y: 11, z: -80, radius: 52, height: 26, color: 0x22c55e, segs: 9 },
    { x: 145, y: 9, z: -25, radius: 48, height: 22, color: 0x16a34a, segs: 9 },
    { x: 135, y: 8, z: 38, radius: 45, height: 20, color: 0x4ade80, segs: 8 },
    { x: 55, y: 12, z: -108, radius: 54, height: 28, color: 0x22c55e, segs: 10 }, // Đồi đặt cối xay gió
    { x: 105, y: 15, z: -125, radius: 60, height: 32, color: 0x15803d, segs: 10 },

    // --- LỚP 1: DÃY NÚI TRUNG CẢNH PHÍA BẮC (North Horizon Ridge, cao 32m - 46m) ---
    { x: 10, y: 16, z: -140, radius: 68, height: 36, color: 0x166534, segs: 10 },
    { x: -35, y: 18, z: -135, radius: 72, height: 40, color: 0x15803d, segs: 10 },
    { x: -80, y: 20, z: -145, radius: 75, height: 44, color: 0x166534, segs: 11 },
    { x: -125, y: 22, z: -135, radius: 78, height: 46, color: 0x15803d, segs: 11 },
    { x: -165, y: 20, z: -130, radius: 74, height: 42, color: 0x16a34a, segs: 10 },

    // --- LỚP 2: DÃY NÚI VIỀN PHÍA TÂY & TÂY BẮC (West Horizon Ridge sau lưng DK2, che kín mép bản đồ) ---
    { x: -195, y: 18, z: -90, radius: 72, height: 38, color: 0x166534, segs: 10 },
    { x: -210, y: 22, z: -40, radius: 82, height: 45, color: 0x15803d, segs: 11 },
    { x: -205, y: 20, z: 15, radius: 78, height: 42, color: 0x166534, segs: 10 },
    { x: -190, y: 16, z: 65, radius: 70, height: 36, color: 0x15803d, segs: 10 },
    { x: -175, y: 14, z: 110, radius: 65, height: 32, color: 0x22c55e, segs: 9 },

    // --- LỚP 3: DÃY NÚI ĐẠI NGÀN XA XĂM (Distant Alpine Horizon, cao 65m - 92m, xóa nhòa đường chân trời) ---
    { x: -70, y: 38, z: -210, radius: 140, height: 82, color: 0x0f5132, segs: 12 },
    { x: 30, y: 40, z: -215, radius: 145, height: 86, color: 0x14532d, segs: 12 },
    { x: 130, y: 42, z: -195, radius: 135, height: 80, color: 0x0f5132, segs: 11 },
    { x: -160, y: 40, z: -200, radius: 140, height: 85, color: 0x14532d, segs: 12 },
    { x: -245, y: 42, z: -165, radius: 135, height: 88, color: 0x0f5132, segs: 12 },
    { x: -275, y: 38, z: -90, radius: 130, height: 78, color: 0x14532d, segs: 11 },
    { x: -285, y: 35, z: -15, radius: 125, height: 75, color: 0x0f5132, segs: 11 },
    { x: -265, y: 32, z: 60, radius: 120, height: 70, color: 0x14532d, segs: 10 },
    { x: -240, y: 30, z: 120, radius: 115, height: 65, color: 0x166534, segs: 10 },
  ];

  hillsData.forEach((h) => {
    const hillMesh = new THREE.Mesh(
      new THREE.ConeGeometry(h.radius, h.height, h.segs || 9),
      new THREE.MeshStandardMaterial({
        color: h.color,
        roughness: 0.92,
        metalness: 0.05,
        flatShading: true, // Các mảng đa giác bắt sáng lấp lánh như tranh vẽ Anime
      })
    );
    hillMesh.position.set(h.x, h.y, h.z);
    hillMesh.receiveShadow = true;
    scene.add(hillMesh);
  });`;

if (code.includes(oldHillsBlock)) {
  code = code.replace(oldHillsBlock, newHillsBlock);
  console.log('2. Replaced hillsData with 24 horizon mountains.');
} else {
  console.log('Could not find exact oldHillsBlock, trying regex...');
  code = code.replace(/\/\/ 2\. Dãy đồi xanh nhấp nhô phía sau[\s\S]*?scene\.add\(hillMesh\);\r?\n  \}\);/, newHillsBlock);
  console.log('2. Replaced hillsData via regex.');
}

// ============================================================================
// 3. ORGANIC RIVERBANK TRANSITION (Bờ cát & sỏi cuội thoai thoải mở rộng)
// ============================================================================
const oldRiverbankCode = `    // Bờ cát mở rộng 2.6m mỗi bên
    const sLeftOuter = cCenter.clone().sub(norm.clone().multiplyScalar(wHalf + 2.6));
    const sRightOuter = cCenter.clone().add(norm.clone().multiplyScalar(wHalf + 2.6));`;

const newRiverbankCode = `    // Bờ cát mở rộng thoai thoải hữu cơ 5.2m mỗi bên (Organic Meandering Riverbank)
    const sandWidthL = 4.8 + Math.sin(t * 14.0) * 1.4;
    const sandWidthR = 4.5 + Math.cos(t * 16.0) * 1.3;
    const sLeftOuter = cCenter.clone().sub(norm.clone().multiplyScalar(wHalf + sandWidthL));
    const sRightOuter = cCenter.clone().add(norm.clone().multiplyScalar(wHalf + sandWidthR));`;

if (code.includes(oldRiverbankCode)) {
  code = code.replace(oldRiverbankCode, newRiverbankCode);
  console.log('3. Replaced riverbank sand width with organic soft shoreline.');
}

// ============================================================================
// 4. CHICKEN HILL OVERHAUL & FLOWER EXPLOSION (Giảm kích thước & Ngập tràn hoa)
// ============================================================================
const oldFreeRangeHeader = `function buildFreeRangeChickens() {
  const flockBaseX = -148;
  const flockBaseZ = -38;
  const flockBaseY = 18.5; // Đỉnh đồi phẳng rộng lớn (+18.5m)
  const flockGroup = new THREE.Group();
  flockGroup.position.set(flockBaseX, flockBaseY, flockBaseZ);
  flockGroup.userData = {
    id: 'doiGaDK2',
    title: 'Đồi sinh thái DK2: Vườn hoa, Đàn gà & Chim bồ câu',
    desc: 'Đỉnh đồi phẳng rộng lớn kiểu mẫu: Vườn hoa khoe sắc, tháp chuồng chim bồ câu châu Âu 2 tầng và khu chăn thả đàn gà tự nhiên trên thảm cỏ xanh.',
    zone: 'DK2',
  };`;

const newFreeRangeHeader = `function buildFreeRangeChickens() {
  const flockBaseX = -142;
  const flockBaseZ = -38;
  const flockBaseY = 15.5; // Cao độ đồi mới 15.5m thoai thoải vừa vặn
  const flockGroup = new THREE.Group();
  flockGroup.position.set(flockBaseX, flockBaseY, flockBaseZ);
  flockGroup.userData = {
    id: 'doiGaDK2',
    title: 'Đồi sinh thái DK2: Vườn hoa, Đàn gà & Chim bồ câu',
    desc: 'Đồi sinh thái cảnh quan kiểu mẫu: Vườn hoa rực rỡ muôn sắc, tháp chuồng chim bồ câu châu Âu và khu chăn thả đàn gà tự nhiên trên thảm cỏ xanh.',
    zone: 'DK2',
  };`;

if (code.includes(oldFreeRangeHeader)) {
  code = code.replace(oldFreeRangeHeader, newFreeRangeHeader);
  console.log('4A. Replaced buildFreeRangeChickens base coordinates.');
} else {
  code = code.replace(/function buildFreeRangeChickens\(\) \{[\s\S]*?zone: 'DK2',\r?\n  \};/, newFreeRangeHeader);
  console.log('4A. Replaced buildFreeRangeChickens base coordinates via regex.');
}

// Update plateau lawn circle size to 15.0m
code = code.replace(
  /new THREE\.CircleGeometry\(23\.5, 32\)/,
  'new THREE.CircleGeometry(15.0, 32)'
);

// Adjust pergola and chicken yard positions to fit 15m plateau
code = code.replace(/pergola\.position\.set\(-9\.5, 0, 5\.8\);/, 'pergola.position.set(-6.8, 0, 4.2);');
code = code.replace(/chickenYard\.position\.set\(-8\.5, 0, -3\.5\);/, 'chickenYard.position.set(-5.8, 0, -2.5);');

// Expand flower beds and add cascading flowers & edge flowers
const oldFlowerBedCreation = `  // Vườn 1: Cúc Vạn Thọ vàng óng & hoa cam rực rỡ (Zone A)
  flowerBedGroup.add(createFlowerBed(2.8, 6.5, 3.2, [
    { color: 0xfacc15, scale: 1.25 }, // Cúc vàng chanh
    { color: 0xf59e0b, scale: 1.35 }, // Vàng nghệ
    { color: 0xf97316, scale: 1.15 }, // Cam tươi
  ]));

  // Vườn 2: Cẩm Tú Cầu Tím & Oải Hương Lavender (Zone B)
  flowerBedGroup.add(createFlowerBed(-2.5, 7.5, 2.8, [
    { color: 0xa855f7, scale: 1.4 },  // Tím hoa cà
    { color: 0x8b5cf6, scale: 1.3 },  // Tím oải hương
    { color: 0xc084fc, scale: 1.2 },  // Tím phấn
  ]));

  // Vườn 3: Hoa Hồng Nhung Đỏ & Cúc Họa Mi Trắng (Zone C)
  flowerBedGroup.add(createFlowerBed(7.5, 4.2, 2.5, [
    { color: 0xbe123c, scale: 1.3 },  // Hồng nhung đỏ
    { color: 0xf43f5e, scale: 1.2 },  // Hồng thắm
    { color: 0xffffff, scale: 1.1 },  // Cúc họa mi trắng
    { color: 0xfde047, scale: 0.9 },  // Nhụy vàng
  ]));

  // Vườn 4: Luống hoa dại ngũ sắc đón khách dọc lối vào (Zone D)
  flowerBedGroup.add(createFlowerBed(-5.8, -6.5, 2.6, [
    { color: 0xec4899, scale: 1.2 },
    { color: 0xfbbf24, scale: 1.1 },
    { color: 0x38bdf8, scale: 1.1 },
    { color: 0xffffff, scale: 1.2 },
  ]));

  flockGroup.add(flowerBedGroup);`;

const newFlowerBedCreation = `  // 6 BỒN HOA RỰC RỠ TRÊN ĐỈNH ĐỒI (SUMMIT FLOWER GARDENS)
  // Bồn 1: Cúc Vạn Thọ vàng óng & Hướng Dương mini (Zone A)
  flowerBedGroup.add(createFlowerBed(2.5, 4.2, 2.4, [
    { color: 0xfacc15, scale: 1.3 },
    { color: 0xf59e0b, scale: 1.4 },
    { color: 0xf97316, scale: 1.2 },
  ]));

  // Bồn 2: Cẩm Tú Cầu Tím & Oải Hương Lavender (Zone B)
  flowerBedGroup.add(createFlowerBed(-2.6, 4.8, 2.3, [
    { color: 0xa855f7, scale: 1.4 },
    { color: 0x8b5cf6, scale: 1.3 },
    { color: 0xc084fc, scale: 1.2 },
  ]));

  // Bồn 3: Hoa Hồng Nhung Đỏ & Cúc Họa Mi Trắng (Zone C)
  flowerBedGroup.add(createFlowerBed(5.2, 2.5, 2.2, [
    { color: 0xbe123c, scale: 1.3 },
    { color: 0xf43f5e, scale: 1.2 },
    { color: 0xffffff, scale: 1.1 },
    { color: 0xfde047, scale: 0.9 },
  ]));

  // Bồn 4: Cúc Ngũ Sắc & Hoa Thược Dược (Zone D)
  flowerBedGroup.add(createFlowerBed(-4.2, -4.2, 2.1, [
    { color: 0xec4899, scale: 1.2 },
    { color: 0xfbbf24, scale: 1.1 },
    { color: 0x38bdf8, scale: 1.1 },
    { color: 0xffffff, scale: 1.2 },
  ]));

  // Bồn 5: Cúc Bướm Cosmos Hồng Phấn & Mẫu Đơn (Zone E)
  flowerBedGroup.add(createFlowerBed(3.8, -4.0, 2.1, [
    { color: 0xf472b6, scale: 1.3 },
    { color: 0xfb7185, scale: 1.2 },
    { color: 0xffe4e6, scale: 1.1 },
  ]));

  // Bồn 6: Hoa Cam Tươi Lantana Đón Khách (Zone F)
  flowerBedGroup.add(createFlowerBed(-0.5, 6.2, 2.2, [
    { color: 0xf97316, scale: 1.35 },
    { color: 0xeab308, scale: 1.25 },
    { color: 0xef4444, scale: 1.15 },
  ]));

  // --------------------------------------------------------------------------
  // B. DẢI HOA VIỀN MÉP ĐỒI (FLORAL RIM RING: 380 KHÓM HOA RỰC RỠ)
  // --------------------------------------------------------------------------
  const rimFlowerGeo = new THREE.SphereGeometry(0.16, 5, 4);
  const rimColors = [0xfacc15, 0xf43f5e, 0x8b5cf6, 0xffffff, 0xf97316, 0x38bdf8, 0xec4899];
  const rimCount = 380;
  for (let rIdx = 0; rIdx < rimCount; rIdx++) {
    const angle = (rIdx / rimCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.08;
    const rad = 13.0 + Math.random() * 2.5; // Viền mép đồi r = 13.0..15.5m
    const fx = Math.cos(angle) * rad;
    const fz = Math.sin(angle) * rad;

    const bMat = new THREE.MeshStandardMaterial({
      color: rimColors[rIdx % rimColors.length],
      roughness: 0.65,
      flatShading: true,
    });
    const bloom = new THREE.Mesh(rimFlowerGeo, bMat);
    bloom.position.set(fx, 0.2 + Math.random() * 0.15, fz);
    bloom.scale.setScalar(0.9 + Math.random() * 0.6);
    bloom.castShadow = true;
    flowerBedGroup.add(bloom);

    // Đá cuội rải rác đan xen khóm hoa mép đồi
    if (rIdx % 12 === 0) {
      const rock = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.24, 0),
        new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 })
      );
      rock.position.set(fx + 0.2, 0.15, fz + 0.2);
      flowerBedGroup.add(rock);
    }
  }

  // --------------------------------------------------------------------------
  // C. THẢM HOA DỐC ĐỔ XUỐNG SƯỜN ĐỒI (CASCADING SLOPES WILDFLOWERS: 650 KHÓM)
  // --------------------------------------------------------------------------
  const slopeCount = 650;
  for (let sIdx = 0; sIdx < slopeCount; sIdx++) {
    const sAngle = Math.random() * Math.PI * 2;
    const sRad = 15.5 + Math.random() * 22.0; // r = 15.5m..37.5m trên sườn dốc đồi
    const sx = Math.cos(sAngle) * sRad;
    const sz = Math.sin(sAngle) * sRad;

    // Tính độ cao y chuẩn theo hàm sườn dốc đồi
    const slopeT = (sRad - 15.0) / (46.0 - 15.0);
    const sy = -0.5 + 16.0 * Math.pow(Math.max(0, 1.0 - slopeT), 1.25) - 15.5; // Offset so với flockBaseY

    const sMat = new THREE.MeshStandardMaterial({
      color: rimColors[sIdx % rimColors.length],
      roughness: 0.7,
      flatShading: true,
    });
    const sBloom = new THREE.Mesh(rimFlowerGeo, sMat);
    sBloom.position.set(sx, sy + 0.25, sz);
    sBloom.scale.setScalar(1.0 + Math.random() * 0.7);
    flowerBedGroup.add(sBloom);
  }

  flockGroup.add(flowerBedGroup);`;

if (code.includes(oldFlowerBedCreation)) {
  code = code.replace(oldFlowerBedCreation, newFlowerBedCreation);
  console.log('4B. Replaced flower bed with 6 summit gardens + rim flowers + slope cascades.');
} else {
  console.log('Could not find exact oldFlowerBedCreation, trying regex...');
  code = code.replace(/\/\/ Vườn 1: Cúc Vạn Thọ[\s\S]*?flockGroup\.add\(flowerBedGroup\);/, newFlowerBedCreation);
  console.log('4B. Replaced flower beds via regex.');
}

fs.writeFileSync(mainPath, code, 'utf8');
console.log('Saved src/main.js successfully with all 4 overhaul parts.');
