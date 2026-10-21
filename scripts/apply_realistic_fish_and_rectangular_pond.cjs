// scripts/apply_realistic_fish_and_rectangular_pond.cjs
const fs = require('fs');
const path = require('path');

const mainPath = path.join(__dirname, '..', 'src', 'main.js');
let code = fs.readFileSync(mainPath, 'utf8');
const hadCRLF = code.includes('\r\n');
code = code.replace(/\r\n/g, '\n');

console.log('Original main.js lines:', code.split('\n').length);

// 1. ADD buildRealisticStreamlinedFish HELPER FUNCTION
const fishFuncCode = `
// ============================================================================
// HÀM TẠO MÔ HÌNH CON CÁ THẬT THÂN SUÔN (REALISTIC STREAMLINED FISH)
// Thân suôn mượt khí động học, mõm nhọn, cuống đuôi thon, vây lưng, vây ngực, vây đuôi én
// ============================================================================
function buildRealisticStreamlinedFish(scale = 1.0, themeIdx = 0) {
  const group = new THREE.Group();

  // 4 gam màu cá nước ngọt tự nhiên bình thường (cá chép, cá trắm, cá vàng, cá diếc)
  const fishThemes = [
    { name: 'Cá chép sông bạc', back: 0x334155, flank: 0xcfd8dc, belly: 0xf8fafc, fin: 0x94a3b8, eye: 0x0f172a },
    { name: 'Cá chép vàng tự nhiên', back: 0x92400e, flank: 0xf59e0b, belly: 0xfef3c7, fin: 0xf59e0b, eye: 0x18181b },
    { name: 'Cá trắm đen ánh rêu', back: 0x1e293b, flank: 0x64748b, belly: 0xf1f5f9, fin: 0x475569, eye: 0x020617 },
    { name: 'Cá điêu hồng tự nhiên', back: 0xb91c1c, flank: 0xf87171, belly: 0xffedd5, fin: 0xfca5a5, eye: 0x18181b },
  ];
  const th = fishThemes[themeIdx % fishThemes.length];

  const len = 1.15 * scale;
  const hgt = 0.36 * scale;
  const wid = 0.16 * scale;

  // 1. THÂN CÁ SUÔN KHÍ ĐỘNG HỌC (Hydrodynamic Spindle Body)
  // Mõm vuốt nhọn -> Ức nở tròn -> Thân thuôn suôn dài -> Cuống đuôi thon mảnh
  const bodyGeo = new THREE.SphereGeometry(0.5, 20, 14);
  const pos = bodyGeo.attributes.position;
  const v = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    // Chuẩn hóa z từ [-0.5, 0.5] thành t trong [0, 1] (1: đỉnh mõm phía trước, 0: cuống đuôi phía sau)
    const t = (v.z + 0.5) / 1.0;
    let girth = 1.0;
    if (t > 0.65) {
      // Mõm cá vuốt nhọn mượt mà
      girth = Math.sin(Math.PI * 0.5 * (1.0 - (t - 0.65) / 0.35));
    } else {
      // Thân vuốt thon đều về cuống đuôi nhỏ
      girth = 0.22 + 0.78 * Math.sin(Math.PI * 0.5 * (t / 0.65));
    }
    v.x *= wid * girth * 2.0; // Dẹt hai bên mạn cá (lateral compression)
    v.y *= hgt * girth * 2.0; // Lưng cao và bụng thon
    v.z *= len;
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  bodyGeo.computeVertexNormals();

  const bodyMat = new THREE.MeshStandardMaterial({
    color: th.belly,
    roughness: 0.32,
    metalness: 0.28,
  });
  const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
  group.add(bodyMesh);

  // 2. LƯNG CÁ SẪM MÀU TỰ NHIÊN (Natural Dorsal Countershading)
  const backGeo = new THREE.SphereGeometry(0.48, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.45);
  const backPos = backGeo.attributes.position;
  for (let i = 0; i < backPos.count; i++) {
    v.fromBufferAttribute(backPos, i);
    const t = (v.z + 0.48) / 0.96;
    let girth = 1.0;
    if (t > 0.65) {
      girth = Math.sin(Math.PI * 0.5 * (1.0 - (t - 0.65) / 0.35));
    } else {
      girth = 0.22 + 0.78 * Math.sin(Math.PI * 0.5 * (t / 0.65));
    }
    v.x *= wid * 1.95 * girth;
    v.y = Math.max(0, v.y * hgt * 2.05 * girth);
    v.z *= len * 0.98;
    backPos.setXYZ(i, v.x, v.y, v.z);
  }
  backGeo.computeVertexNormals();

  const backMat = new THREE.MeshStandardMaterial({
    color: th.back,
    roughness: 0.35,
    metalness: 0.25,
  });
  const backMesh = new THREE.Mesh(backGeo, backMat);
  group.add(backMesh);

  // 3. ĐÔI MẮT CÁ TRÒN TINH ANH (Fish Eyes)
  const eyeMat = new THREE.MeshBasicMaterial({ color: th.eye });
  const whiteEyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  [-1, 1].forEach((side) => {
    const eyeWhite = new THREE.Mesh(new THREE.SphereGeometry(0.035 * scale, 6, 6), whiteEyeMat);
    eyeWhite.position.set(side * (wid * 0.35), hgt * 0.1, len * 0.36);
    group.add(eyeWhite);

    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.02 * scale, 6, 6), eyeMat);
    pupil.position.set(side * (wid * 0.37), hgt * 0.1, len * 0.37);
    group.add(pupil);
  });

  // 4. VÂY LƯNG CONG VUỐT RA SAU (Dorsal Fin)
  const finMat = new THREE.MeshStandardMaterial({
    color: th.fin,
    roughness: 0.4,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.88,
  });

  const dorsalShape = new THREE.Shape();
  dorsalShape.moveTo(0, 0);
  dorsalShape.quadraticCurveTo(-0.12 * scale, 0.24 * scale, -0.28 * scale, 0.20 * scale);
  dorsalShape.quadraticCurveTo(-0.35 * scale, 0.08 * scale, -0.42 * scale, 0);
  dorsalShape.closePath();
  const dorsalFin = new THREE.Mesh(new THREE.ShapeGeometry(dorsalShape), finMat);
  dorsalFin.position.set(0, hgt * 0.3, len * 0.1);
  group.add(dorsalFin);

  // 5. CẶP VÂY NGỰC XÒE HAI BÊN MANG CÁ (Pectoral Fins)
  const pecShape = new THREE.Shape();
  pecShape.moveTo(0, 0);
  pecShape.quadraticCurveTo(0.18 * scale, 0.06 * scale, 0.26 * scale, -0.06 * scale);
  pecShape.quadraticCurveTo(0.14 * scale, -0.16 * scale, 0, -0.06 * scale);
  pecShape.closePath();
  const pecGeo = new THREE.ShapeGeometry(pecShape);

  [-1, 1].forEach((side) => {
    const pec = new THREE.Mesh(pecGeo, finMat);
    pec.position.set(side * (wid * 0.35), -hgt * 0.12, len * 0.15);
    pec.rotation.y = side * 0.42;
    pec.rotation.z = -side * 0.3;
    group.add(pec);
  });

  // 6. VÂY ĐUÔI ÉN XẺ THÙY (Forked Caudal Fin) ĐẶT TRONG TAILGROUP ĐỂ QUẪY SÓNG
  const tailGroup = new THREE.Group();
  tailGroup.position.set(0, 0, -len * 0.52);

  const tailShape = new THREE.Shape();
  tailShape.moveTo(0, 0.05 * scale);
  tailShape.lineTo(-0.42 * scale, 0.36 * scale); // Thùy đuôi trên
  tailShape.quadraticCurveTo(-0.25 * scale, 0, -0.16 * scale, 0); // Vết xẻ đuôi én sâu tự nhiên
  tailShape.quadraticCurveTo(-0.25 * scale, 0, -0.42 * scale, -0.36 * scale); // Thùy đuôi dưới
  tailShape.lineTo(0, -0.05 * scale);
  tailShape.closePath();

  const tailMesh = new THREE.Mesh(new THREE.ShapeGeometry(tailShape), finMat);
  tailMesh.rotation.y = Math.PI / 2;
  tailGroup.add(tailMesh);
  group.add(tailGroup);

  return { group, tailGroup };
}
`;

// Insert buildRealisticStreamlinedFish before buildDK2HeadquartersKoiPond
const pondHookMarker = '// ============================================================================\n// HỒ CÁ KOI TIỂU CẢNH NHẬT BẢN CẠNH NHÀ ĐIỀU HÀNH DK2';
if (code.includes(pondHookMarker)) {
  code = code.replace(pondHookMarker, fishFuncCode + '\n' + pondHookMarker);
  console.log('1. Added buildRealisticStreamlinedFish function');
}

// 2. REPLACE buildDK2HeadquartersKoiPond WITH RECTANGULAR POND & FLOWER BEDS
const oldPondFuncStart = `// HỒ CÁ KOI TIỂU CẢNH NHẬT BẢN CẠNH NHÀ ĐIỀU HÀNH DK2 (VEN ĐƯỜNG ĐT234)
// ============================================================================
function buildDK2HeadquartersKoiPond(parentGroup, cfg) {`;

const oldPondFuncEnd = `// ============================================================================
// QUÁN CÀ PHÊ & LOUNGE DK COFFEE & BAR`;

const pStart = code.indexOf(oldPondFuncStart);
const pEnd = code.indexOf(oldPondFuncEnd);

if (pStart !== -1 && pEnd !== -1) {
  const newRectPondCode = `// BỂ CÁ CẢNH QUAN HÌNH CHỮ NHẬT & VƯỜN HOA CẠNH NHÀ ĐIỀU HÀNH DK2 (YÊU CẦU 2)
// ============================================================================
function buildDK2HeadquartersKoiPond(parentGroup, cfg) {
  const pondCenterX = cfg.width / 2 + 5.2; // Thế đất ven đường ĐT234 (x ≈ -19.8)
  const pondCenterZ = 0.5;
  const pondY = 0.12;

  const pondGroup = new THREE.Group();
  pondGroup.position.set(pondCenterX, pondY, pondCenterZ);
  pondGroup.userData = {
    id: 'hoCaKoiDK2',
    title: 'Bể cá cảnh quan hình chữ nhật & Vườn hoa DK2',
    desc: 'Bể cá hình chữ nhật kiến trúc hiện đại cạnh Nhà điều hành DK2 và đường ĐT234. Bao quanh bởi luống hoa rực rỡ ngát hương cùng đàn cá thân suôn tự nhiên bơi lội thanh bình.',
    type: 'landscape',
    zone: 'DK2',
  };

  const poolWidth = 7.6; // Dài 7.6m (trục X)
  const poolDepth = 5.2; // Rộng 5.2m (trục Z)
  const wallH = 0.45;
  const wallThick = 0.35;

  // 1. THÀNH BỂ ĐÁ GRANITE HÌNH CHỮ NHẬT VUÔNG VỨC HIỆN ĐẠI
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6, metalness: 0.2 });
  const copingMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.3 }); // Mũ thành bể đá đen bóng

  // Đáy bể lát gạch mosaic xanh ngọc
  const bottomMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.7 });
  const poolBottom = new THREE.Mesh(new THREE.BoxGeometry(poolWidth, 0.1, poolDepth), bottomMat);
  poolBottom.position.y = 0.05;
  poolBottom.receiveShadow = true;
  pondGroup.add(poolBottom);

  // 4 cạnh thành bể chữ nhật vuông vức
  // Cạnh Bắc & Nam (song song trục X)
  [-poolDepth / 2 - wallThick / 2, poolDepth / 2 + wallThick / 2].forEach((wz) => {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(poolWidth + wallThick * 2, wallH, wallThick), wallMat);
    wall.position.set(0, wallH / 2, wz);
    wall.castShadow = true;
    wall.receiveShadow = true;
    pondGroup.add(wall);

    // Mũ đá ốp gờ thành bể
    const coping = new THREE.Mesh(new THREE.BoxGeometry(poolWidth + wallThick * 2 + 0.1, 0.08, wallThick + 0.1), copingMat);
    coping.position.set(0, wallH + 0.04, wz);
    coping.receiveShadow = true;
    pondGroup.add(coping);
  });

  // Cạnh Đông & Tây (song song trục Z)
  [-poolWidth / 2 - wallThick / 2, poolWidth / 2 + wallThick / 2].forEach((wx) => {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(wallThick, wallH, poolDepth), wallMat);
    wall.position.set(wx, wallH / 2, 0);
    wall.castShadow = true;
    wall.receiveShadow = true;
    pondGroup.add(wall);

    const coping = new THREE.Mesh(new THREE.BoxGeometry(wallThick + 0.1, 0.08, poolDepth), copingMat);
    coping.position.set(wx, wallH + 0.04, 0);
    coping.receiveShadow = true;
    pondGroup.add(coping);
  });

  // 2. MẶT NƯỚC HỒ HÌNH CHỮ NHẬT TRONG VẮT (Rectangular Clear Water)
  waterKoiMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(poolWidth, poolDepth),
    createStylizedWaterMaterial(false)
  );
  waterKoiMesh.rotation.x = -Math.PI / 2;
  waterKoiMesh.position.set(0, wallH * 0.82, 0);
  pondGroup.add(waterKoiMesh);

  // 3. VƯỜN HOA RỰC RỠ CẠNH HỒ (LUSH FLOWER BEDS AROUND POND)
  // Luống hoa viền quanh phía Bắc, phía Nam và phía Đông (giáp ĐT234)
  const soilMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.95 }); // Đất mùn đen màu mỡ
  const flowerBedConfigs = [
    { x: 0, z: poolDepth / 2 + 1.1, w: poolWidth + 1.2, d: 1.1 }, // Luống hoa phía Nam
    { x: 0, z: -poolDepth / 2 - 1.1, w: poolWidth + 1.2, d: 1.1 }, // Luống hoa phía Bắc
    { x: poolWidth / 2 + 1.1, z: 0, w: 1.1, d: poolDepth + 1.2 }, // Luống hoa phía Đông (hướng đường ĐT234)
  ];

  const flowerColors = [
    { color: 0xfacc15, name: 'Cúc vàng' },
    { color: 0xef4444, name: 'Hồng đỏ' },
    { color: 0xf472b6, name: 'Dạ yến thảo hồng' },
    { color: 0xffffff, name: 'Bạch huệ' },
    { color: 0xa855f7, name: 'Lavender tím' },
    { color: 0xf97316, name: 'Vạn thọ cam' },
  ];

  flowerBedConfigs.forEach((fb) => {
    // Đất trồng hoa
    const soil = new THREE.Mesh(new THREE.BoxGeometry(fb.w, 0.16, fb.d), soilMat);
    soil.position.set(fb.x, 0.08, fb.z);
    soil.receiveShadow = true;
    pondGroup.add(soil);

    // Bó vỉa gạch bao quanh luống hoa
    const borderMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.8 });
    const border = new THREE.Mesh(new THREE.BoxGeometry(fb.w + 0.12, 0.22, fb.d + 0.12), borderMat);
    border.position.set(fb.x, 0.06, fb.z);
    pondGroup.add(border);

    // Trồng các khóm hoa dày dặn rực rỡ
    const flowerCount = Math.floor((fb.w * fb.d) * 4);
    for (let f = 0; f < flowerCount; f++) {
      const flGroup = new THREE.Group();
      const fx = fb.x + (Math.random() - 0.5) * (fb.w - 0.3);
      const fz = fb.z + (Math.random() - 0.5) * (fb.d - 0.3);
      flGroup.position.set(fx, 0.16, fz);

      // Thân cành lá xanh
      const stem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015, 0.02, 0.22, 5),
        new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.7 })
      );
      stem.position.y = 0.11;
      flGroup.add(stem);

      // Bông hoa nở xòe nhiều cánh
      const cInfo = flowerColors[Math.floor(Math.random() * flowerColors.length)];
      const petalMat = new THREE.MeshStandardMaterial({ color: cInfo.color, roughness: 0.5 });
      const bloom = new THREE.Mesh(new THREE.DodecahedronGeometry(0.08 + Math.random() * 0.04), petalMat);
      bloom.position.y = 0.22;
      bloom.scale.set(1.2, 0.65, 1.2);
      flGroup.add(bloom);

      // Nhụy hoa vàng
      const core = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 6), new THREE.MeshBasicMaterial({ color: 0xfef08a }));
      core.position.y = 0.25;
      flGroup.add(core);

      pondGroup.add(flGroup);
    }
  });

  // 4. LÁ SÚNG & HOA SEN NỞ TRONG BỂ
  const padMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.7, flatShading: true });
  const lotusMat = new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.5 });
  [-1.6, 1.8].forEach((lx) => {
    [ -1.0, 1.0 ].forEach((lz) => {
      const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.015, 7), padMat);
      pad.position.set(lx, wallH * 0.83, lz);
      pondGroup.add(pad);

      const lotus = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 4), lotusMat);
      lotus.position.set(lx, wallH * 0.86, lz);
      lotus.scale.set(1.2, 0.7, 1.2);
      pondGroup.add(lotus);
    });
  });

  // 5. ĐÀN CÁ BÌNH THƯỜNG THÂN SUÔN 7 CON BƠI LỘI TRONG BỂ CHỮ NHẬT
  koiFishes = [];
  const fishCount = 7;
  for (let i = 0; i < fishCount; i++) {
    // Tạo con cá thật thân suôn mượt (scale 0.75m vừa vặn bể chữ nhật)
    const fishObj = buildRealisticStreamlinedFish(0.75, i);
    const radX = 2.2 + (i % 3) * 0.65;
    const radZ = 1.4 + (i % 2) * 0.45;
    const speed = 0.55 + (i % 4) * 0.12;
    const angle = (i / fishCount) * Math.PI * 2;

    fishObj.group.position.set(Math.cos(angle) * radX, wallH * 0.78, Math.sin(angle) * radZ);
    pondGroup.add(fishObj.group);

    koiFishes.push({
      mesh: fishObj.group,
      tail: fishObj.tailGroup,
      baseX: 0,
      baseZ: 0,
      radiusX: radX,
      radiusZ: radZ,
      angle: angle,
      speed: speed,
      phase: i * 1.2,
    });
  }

  parentGroup.add(pondGroup);
  interactiveObjects.push(pondGroup);
}
`;

  code = code.substring(0, pStart) + newRectPondCode + '\n' + code.substring(pEnd);
  console.log('2. Replaced buildDK2HeadquartersKoiPond with rectangular pool and vibrant flower beds');
} else {
  console.warn('2. Warning: Could not find buildDK2HeadquartersKoiPond code block');
}

// 3. UPGRADE HILL POND FISH TO REALISTIC STREAMLINED FISH (Ao cá đồi thân suôn tự nhiên)
const hillKoiSectionStart = `  // 6. ĐÀN CÁ KOI LỚN 18 CON BƠI LỘI & NHẢY BÚNG NƯỚC (Leaping & Swimming Koi Fish)
  hillPondKoiFishes = [];`;
const hillKoiSectionEnd = `  scene.add(pondGroup);
  interactiveObjects.push(pondGroup);
}`;

const hkStart = code.indexOf(hillKoiSectionStart);
const hkEnd = code.indexOf(hillKoiSectionEnd);

if (hkStart !== -1 && hkEnd !== -1) {
  const newHillFishCode = `  // 6. ĐÀN CÁ THÂN SUÔN 18 CON BƠI LỘI & NHẢY BÚNG NƯỚC (REALISTIC STREAMLINED FISH)
  hillPondKoiFishes = [];

  for (let k = 0; k < 18; k++) {
    // Tạo hình con cá thật thân suôn, tỷ lệ lớn 1.15m nhìn rõ mồn một từ mọi góc camera
    const fishObj = buildRealisticStreamlinedFish(1.15, k);

    // Bán kính quỹ đạo bơi lội phủ đều khắp lòng hồ lớn 16.5m x 12.0m
    const orbitRadiusX = 4.2 + (k % 5) * 2.2 + (k > 8 ? 1.0 : 0);
    const orbitRadiusZ = 3.0 + (k % 5) * 1.6 + (k > 8 ? 0.7 : 0);
    const speed = 0.45 + (k % 4) * 0.12;
    const initialAngle = (k / 18) * Math.PI * 2;

    // 5 con cá được lập trình nhảy búng nước nhào lộn trên không
    const isJumper = k % 3 === 0;

    fishObj.group.position.set(Math.cos(initialAngle) * orbitRadiusX, 0.06, Math.sin(initialAngle) * orbitRadiusZ);
    pondGroup.add(fishObj.group);

    hillPondKoiFishes.push({
      mesh: fishObj.group,
      tail: fishObj.tailGroup,
      centerX: 0,
      centerZ: 0,
      radiusX: orbitRadiusX,
      radiusZ: orbitRadiusZ,
      speed: speed,
      angle: initialAngle,
      baseY: 0.06, // Bơi sát mặt nước (0.08) để lưng và vây lưng nhấp nhô chân thực
      phase: k * 1.4,
      isJumper: isJumper,
      isJumping: false,
      jumpProgress: 0,
      jumpDuration: 1.1 + (k % 3) * 0.2,
      jumpTimer: 2.0 + k * 1.5,
      parentGroup: pondGroup,
    });
  }
`;

  code = code.substring(0, hkStart) + newHillFishCode + '\n' + code.substring(hkEnd);
  console.log('3. Upgraded Hill Pond fish to buildRealisticStreamlinedFish');
} else {
  console.warn('3. Warning: Could not find hill pond fish section');
}

// 4. UPDATE SWIMMING ANIMATION IN updateAnimatedObjects
// In koiFishes (court pond): Update S-curve swimming motion
const koiLoopOld = `  // 18. Đàn cá Koi bơi lội và quẫy đuôi trong hồ nước Nhà điều hành
  koiFishes.forEach((fish) => {
    fish.angle += delta * fish.speed;
    fish.mesh.position.x = fish.baseX + Math.cos(fish.angle) * fish.radiusX;
    fish.mesh.position.z = fish.baseZ + Math.sin(fish.angle) * fish.radiusZ;
    fish.mesh.rotation.y = -fish.angle + Math.PI / 2;
    if (fish.tail) {
      fish.tail.rotation.y = Math.sin(time * 0.015) * 0.45;
    }
  });`;

const koiLoopNew = `  // 18. Đàn cá thân suôn bơi lội và quẫy đuôi trong bể hình chữ nhật Nhà điều hành (Yêu cầu 1 & 2)
  koiFishes.forEach((fish) => {
    fish.angle += delta * fish.speed;
    fish.mesh.position.x = fish.baseX + Math.cos(fish.angle) * fish.radiusX;
    fish.mesh.position.z = fish.baseZ + Math.sin(fish.angle) * fish.radiusZ;
    // Chuyển động bơi uốn lượn hình chữ S tự nhiên (S-curve swimming wave)
    const wiggle = Math.sin(time * 0.016 + fish.phase);
    fish.mesh.rotation.y = -fish.angle + Math.PI / 2 + wiggle * 0.08;
    if (fish.tail) {
      fish.tail.rotation.y = Math.sin(time * 0.018 + fish.phase - 0.6) * 0.48;
    }
  });`;

if (code.includes(koiLoopOld)) {
  code = code.replace(koiLoopOld, koiLoopNew);
  console.log('4. Updated koiFishes swimming loop with S-curve undulation');
}

fs.writeFileSync(mainPath, hadCRLF ? code.replace(/\n/g, '\r\n') : code, 'utf8');
console.log('Successfully written updated src/main.js!');
console.log('New lines count:', code.split('\n').length);
