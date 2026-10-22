const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../src/config.js');
const mainPath = path.join(__dirname, '../src/main.js');

// 1. UPDATE src/config.js
let configRaw = fs.readFileSync(configPath, 'utf8');
const isConfigCrlf = configRaw.includes('\r\n');
let configCode = configRaw.replace(/\r\n/g, '\n');

// Update sheepFlock preset
const oldSheepFlockPreset = `    sheepFlock: {
      pos: { x: 122, y: 12, z: -32 },
      target: { x: 108, y: 4.8, z: -45 },
      name: 'Đàn cừu trên đồi cỏ',
    },`;

const newSheepFlockPreset = `    sheepFlock: {
      pos: { x: 120, y: 7.5, z: -32 },
      target: { x: 108, y: 1.2, z: -45 },
      name: 'Đàn cừu trên bãi cỏ',
    },`;

// Update river preset
const oldRiverPreset = `    river: {
      pos: { x: 105, y: 12, z: 8 },
      target: { x: 89.5, y: 0, z: -8 },
      name: 'Sông máng nước & Thuyền nan',
    },`;

const newRiverPreset = `    river: {
      pos: { x: 106, y: 8.5, z: -70 },
      target: { x: 91.8, y: -0.3, z: -82 },
      name: 'Sông máng nước & Thuyền nan',
    },`;

if (configCode.includes(oldSheepFlockPreset)) {
  configCode = configCode.replace(oldSheepFlockPreset, newSheepFlockPreset);
  console.log('Updated sheepFlock camera preset in config.js');
} else {
  console.log('sheepFlock camera preset already updated or not found in config.js');
}

if (configCode.includes(oldRiverPreset)) {
  configCode = configCode.replace(oldRiverPreset, newRiverPreset);
  console.log('Updated river camera preset in config.js');
} else {
  console.log('river camera preset already updated or not found in config.js');
}

if (isConfigCrlf) configCode = configCode.replace(/\n/g, '\r\n');
fs.writeFileSync(configPath, configCode, 'utf8');
console.log('Successfully saved src/config.js');

// 2. UPDATE src/main.js
let mainRaw = fs.readFileSync(mainPath, 'utf8');
const isMainCrlf = mainRaw.includes('\r\n');
let mainCode = mainRaw.replace(/\r\n/g, '\n');

// 2A. Update Fluffy Sheep creation in buildCanalAndRailway
const oldSheepBlock = `  // F. Đàn cừu trắng muốt đầu đen trên sườn đồi xanh & Bóng thoại (như ảnh 2)
  // --------------------------------------------------------------------------
  const sheepBaseX = 108;
  const sheepBaseZ = -45;
  const sheepBaseY = getEastHillSurfaceY(sheepBaseX, sheepBaseZ) + 0.1; // ~ 4.6m
  const sheepGroup = new THREE.Group();
  sheepGroup.position.set(sheepBaseX, sheepBaseY, sheepBaseZ);

  const woolMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, flatShading: true });
  const sheepBlackMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });

  const sheepCoords = [
    { x: 0, z: 0, rot: 0.3 },
    { x: 2.5, z: -1.4, rot: -0.5 },
    { x: -2.2, z: 1.8, rot: 0.8 },
    { x: 4.2, z: 1.6, rot: 2.1 },
    { x: 1.5, z: 3.5, rot: 1.2 },
    { x: -3.6, z: -1.8, rot: -1.8 },
    { x: 5.2, z: -0.8, rot: -0.2 },
  ];

  sheepCoords.forEach((sc, sIdx) => {
    const oneSheep = new THREE.Group();
    const wy = getEastHillSurfaceY(sc.x + sheepBaseX, sc.z + sheepBaseZ) - sheepBaseY;
    oneSheep.position.set(sc.x, wy, sc.z);
    oneSheep.rotation.y = sc.rot;

    // Thân lông xù trắng lớn, bồng bềnh
    const bodyWool = new THREE.Mesh(new THREE.DodecahedronGeometry(0.85, 1), woolMat);
    bodyWool.scale.set(1.05, 0.9, 1.4);
    bodyWool.position.y = 0.85;
    bodyWool.castShadow = true;
    oneSheep.add(bodyWool);

    // Đầu cừu đen
    const sheepHead = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.45, 0.55), sheepBlackMat);
    sheepHead.position.set(0, 1.05, 0.85);
    oneSheep.add(sheepHead);

    // Mắt trắng tròn
    [-0.15, 0.15].forEach((mx) => {
      const eye = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.02), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      eye.position.set(mx, 1.15, 1.13);
      oneSheep.add(eye);
    });

    // Tai vểnh hai bên
    [-0.28, 0.28].forEach((ex) => {
      const ear = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.1, 0.12), sheepBlackMat);
      ear.position.set(ex, 1.18, 0.78);
      oneSheep.add(ear);
    });

    // 4 chân đen vững chãi
    [-0.32, 0.32].forEach((lx) => {
      [-0.45, 0.45].forEach((lz) => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.55, 6), sheepBlackMat);
        leg.position.set(lx, 0.28, lz);
        leg.castShadow = true;
        oneSheep.add(leg);
      });
    });

    sheepGroup.add(oneSheep);
    fluffySheeps.push(oneSheep);
  });

  // Bóng thoại hoạt hình đáng yêu (như ảnh 2: "I could dance all afternoon!")
  const speechBubble = new THREE.Mesh(
    new THREE.BoxGeometry(4.2, 1.4, 0.12),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 })
  );
  speechBubble.position.set(2.5, 4.2, 0.5);
  speechBubble.rotation.y = -Math.PI / 4;
  sheepGroup.add(speechBubble);

  const bubbleTail = new THREE.Mesh(
    new THREE.ConeGeometry(0.4, 0.7, 3),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 })
  );
  bubbleTail.rotation.z = Math.PI;
  bubbleTail.position.set(1.6, 3.2, 0.5);
  sheepGroup.add(bubbleTail);`;

const newSheepBlock = `  // F. Đàn cừu trắng muốt đầu đen trên bãi cỏ xanh & Bóng thoại (Đứng vững chãi trên mặt cỏ Y = 0.0, không lơ lửng)
  // --------------------------------------------------------------------------
  const sheepBaseX = 108;
  const sheepBaseZ = -45;
  const sheepBaseY = 0.02; // Chân cừu đặt chuẩn xác trên thảm cỏ xanh mướt
  const sheepGroup = new THREE.Group();
  sheepGroup.position.set(sheepBaseX, sheepBaseY, sheepBaseZ);

  // Thảm cỏ gặm cỏ riêng biệt cho đàn cừu có điểm xuyết hoa dại trắng & vàng
  const pasturePatch = new THREE.Mesh(
    new THREE.CylinderGeometry(8.2, 8.8, 0.08, 16),
    new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.9, flatShading: true })
  );
  pasturePatch.position.set(0, 0.04, 0);
  pasturePatch.receiveShadow = true;
  sheepGroup.add(pasturePatch);

  const flwWMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const flwYMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
  for (let fi = 0; fi < 14; fi++) {
    const ang = Math.random() * Math.PI * 2;
    const rad = 1.8 + Math.random() * 5.2;
    const flw = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.08, 0.18), fi % 2 === 0 ? flwWMat : flwYMat);
    flw.position.set(Math.cos(ang) * rad, 0.10, Math.sin(ang) * rad);
    sheepGroup.add(flw);
  }

  const woolMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, flatShading: true });
  const sheepBlackMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });

  const sheepCoords = [
    { x: 0, z: 0, rot: 0.3 },
    { x: 2.5, z: -1.4, rot: -0.5 },
    { x: -2.2, z: 1.8, rot: 0.8 },
    { x: 4.2, z: 1.6, rot: 2.1 },
    { x: 1.5, z: 3.5, rot: 1.2 },
    { x: -3.6, z: -1.8, rot: -1.8 },
    { x: 5.2, z: -0.8, rot: -0.2 },
  ];

  sheepCoords.forEach((sc, sIdx) => {
    const oneSheep = new THREE.Group();
    // Chân cừu chạm đất vững chãi tại Y = 0 (cylinder chân cao 0.55m, tâm ở Y = 0.28)
    oneSheep.position.set(sc.x, 0, sc.z);
    oneSheep.rotation.y = sc.rot;

    // Thân lông xù trắng lớn, bồng bềnh
    const bodyWool = new THREE.Mesh(new THREE.DodecahedronGeometry(0.85, 1), woolMat);
    bodyWool.scale.set(1.05, 0.9, 1.4);
    bodyWool.position.y = 0.85;
    bodyWool.castShadow = true;
    oneSheep.add(bodyWool);

    // Đầu cừu đen
    const sheepHead = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.45, 0.55), sheepBlackMat);
    sheepHead.position.set(0, 1.05, 0.85);
    oneSheep.add(sheepHead);

    // Mắt trắng tròn
    [-0.15, 0.15].forEach((mx) => {
      const eye = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.02), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      eye.position.set(mx, 1.15, 1.13);
      oneSheep.add(eye);
    });

    // Tai vểnh hai bên
    [-0.28, 0.28].forEach((ex) => {
      const ear = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.1, 0.12), sheepBlackMat);
      ear.position.set(ex, 1.18, 0.78);
      oneSheep.add(ear);
    });

    // 4 chân đen vững chãi tiếp đất
    [-0.32, 0.32].forEach((lx) => {
      [-0.45, 0.45].forEach((lz) => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.55, 6), sheepBlackMat);
        leg.position.set(lx, 0.28, lz);
        leg.castShadow = true;
        oneSheep.add(leg);
      });
    });

    sheepGroup.add(oneSheep);
    fluffySheeps.push(oneSheep);
  });

  // Bóng thoại hoạt hình đáng yêu đặt ở độ cao vừa tầm (Y = 2.4m trên đàn cừu)
  const speechBubble = new THREE.Mesh(
    new THREE.BoxGeometry(4.2, 1.4, 0.12),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 })
  );
  speechBubble.position.set(2.5, 2.5, 0.5);
  speechBubble.rotation.y = -Math.PI / 4;
  sheepGroup.add(speechBubble);

  const bubbleTail = new THREE.Mesh(
    new THREE.ConeGeometry(0.4, 0.7, 3),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 })
  );
  bubbleTail.rotation.z = Math.PI;
  bubbleTail.position.set(1.6, 1.6, 0.5);
  sheepGroup.add(bubbleTail);`;

if (mainCode.includes(oldSheepBlock)) {
  mainCode = mainCode.replace(oldSheepBlock, newSheepBlock);
  console.log('Fixed sheep flock floating issue in main.js');
} else {
  console.error('Could not find oldSheepBlock in main.js');
  process.exit(1);
}

// 2B. Update Rowing Boat position & add oar reference + new Jumping River Fish in buildCanalAndRailway
const oldBoatAndFishBlock = `  // Thuyền nan & người chèo đò nổi bồng bềnh trên mặt nước sông máng (Z = -8, X = 89.5)
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
  scene.add(riverFishGroup);`;

const newBoatAndFishBlock = `  // Thuyền nan & người chèo đò nổi bồng bềnh trên sông máng (Dời về Z = -82, X = 91.8, cách xa đường sắt > 15m)
  const boatGroup = new THREE.Group();
  boatGroup.position.set(91.8, -0.30, -82.0);
  boatGroup.rotation.y = 0.05;

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
    desc: 'Hoạt động chèo thuyền thư giãn trên dòng sông máng nước trong vắt, cách xa đường ray xe lửa.',
    zone: 'Sông Máng Nước',
    oar: oar,
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
    { t: 0.36, offX: -1.6, offZ: -2.0 },
    { t: 0.40, offX: 1.4, offZ: 1.5 },
    { t: 0.48, offX: -1.8, offZ: -3.0 },
    { t: 0.52, offX: 1.6, offZ: 2.0 },
    { t: 0.60, offX: -1.2, offZ: 3.0 },
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

  // Đàn cá Koi & cá sông bơi lội, nhảy lên khỏi mặt nước dọc theo dòng sông cạnh đường tàu (Khối 4 & 5)
  buildRiverJumpingFish();`;

if (mainCode.includes(oldBoatAndFishBlock)) {
  mainCode = mainCode.replace(oldBoatAndFishBlock, newBoatAndFishBlock);
  console.log('Updated boat position away from railway and prepared river jumping fish');
} else {
  console.error('Could not find oldBoatAndFishBlock in main.js');
  process.exit(1);
}

// 2C. Add Jumping Fish System definition and Campus Shelter / Event handlers
const newHelperDefinitions = `
// ============================================================================
// HỆ THỐNG ĐÀN CÁ BƠI & NHẢY TRÊN SÔNG MÁNG GẦN ĐƯỜNG TÀU (JUMPING FISH & RIPPLES)
// ============================================================================
let activeRiverFish = [];
let riverWaterRipples = [];

function buildRiverJumpingFish() {
  const fishGroup = new THREE.Group();
  fishGroup.name = 'riverJumpingFishGroup';

  const fishConfigs = [
    { x: 93.2, z: -42, color: 0xf97316, name: 'Cá Koi Kohaku Cam' },     // Cạnh Cầu vòm đỏ & đường tàu
    { x: 93.6, z: -54, color: 0xfbbf24, name: 'Cá Chép Vàng Ogon' },      // Dưới chân Cầu vòm đỏ
    { x: 90.6, z: -22, color: 0xdc2626, name: 'Cá Koi Sanke Đỏ' },       // Bờ sông cạnh tuyến ray
    { x: 89.8, z: -2.0, color: 0xf8fafc, name: 'Cá Bạc Platinum' },      // Cạnh Ga xe lửa DK Station
    { x: 91.5, z: -74, color: 0xf97316, name: 'Cá Koi Vàng Cam' },       // Khúc sông gần thuyền nan
    { x: 92.2, z: -88, color: 0x0284c7, name: 'Cá Lam Sinh Thái' },      // Khúc sông sau thuyền nan
    { x: 91.0, z: -105, color: 0xfbbf24, name: 'Cá Chép Hoàng Kim' },     // Thượng nguồn sông máng
  ];

  fishConfigs.forEach((cfg, idx) => {
    const oneFish = new THREE.Group();
    oneFish.position.set(cfg.x, -0.42, cfg.z);

    const fishMat = new THREE.MeshStandardMaterial({
      color: cfg.color,
      roughness: 0.25,
      metalness: 0.15,
    });
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });

    // Thân cá thon nhọn khí động học
    const body = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.72, 7), fishMat);
    body.rotation.x = Math.PI / 2;
    body.scale.set(0.75, 1.0, 1.25);
    oneFish.add(body);

    // Mũi đầu cá
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), fishMat);
    head.position.set(0, 0, 0.38);
    head.scale.set(0.72, 0.9, 1.2);
    oneFish.add(head);

    // Mắt cá tròn
    [-0.11, 0.11].forEach((ex) => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 6), new THREE.MeshBasicMaterial({ color: 0x0f172a }));
      eye.position.set(ex, 0.06, 0.46);
      oneFish.add(eye);
    });

    // Vây lưng
    const dorsalFin = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.16, 0.24), whiteMat);
    dorsalFin.position.set(0, 0.16, -0.05);
    dorsalFin.rotation.x = -Math.PI / 6;
    oneFish.add(dorsalFin);

    // 2 Vây bơi 2 bên
    [-0.14, 0.14].forEach((fx) => {
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.02, 0.14), whiteMat);
      fin.position.set(fx, -0.05, 0.15);
      fin.rotation.z = fx > 0 ? -Math.PI / 5 : Math.PI / 5;
      oneFish.add(fin);
    });

    // Đuôi cá có khớp quẫy sóng
    const tailPivot = new THREE.Group();
    tailPivot.position.set(0, 0, -0.38);

    const tailFin = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.28, 0.28), whiteMat);
    tailFin.position.set(0, 0, -0.14);
    tailFin.rotation.x = Math.PI / 4;
    tailPivot.add(tailFin);
    oneFish.add(tailPivot);

    scene.add(oneFish);

    activeRiverFish.push({
      mesh: oneFish,
      tailPivot: tailPivot,
      baseX: cfg.x,
      baseZ: cfg.z,
      baseY: -0.42,
      id: idx,
      isJumping: false,
      jumpProgress: 0,
      jumpDuration: 1.15,
      jumpCooldown: 2.5 + Math.random() * 5.0, // Nhảy ngẫu nhiên cách nhau vài giây
      jumpHeight: 0.65 + Math.random() * 0.45,  // Độ cao nhảy vút lên khỏi mặt nước
    });
  });
}

function spawnWaterRipple(x, z, maxScale = 2.0) {
  const rippleGeo = new THREE.RingGeometry(0.1, 0.18, 16);
  const rippleMat = new THREE.MeshBasicMaterial({
    color: 0xbae6fd,
    transparent: true,
    opacity: 0.85,
    side: THREE.DoubleSide,
  });
  const ripple = new THREE.Mesh(rippleGeo, rippleMat);
  ripple.rotation.x = -Math.PI / 2;
  ripple.position.set(x, -0.31, z);
  scene.add(ripple);

  riverWaterRipples.push({
    mesh: ripple,
    scale: 0.3,
    maxScale: maxScale,
    opacity: 0.85,
    life: 1.2,
  });
}

function updateRiverFish(delta, time) {
  // Cập nhật gợn sóng nước
  for (let i = riverWaterRipples.length - 1; i >= 0; i--) {
    const r = riverWaterRipples[i];
    r.life -= delta;
    r.scale += delta * 1.5;
    r.opacity = (r.life / 1.2) * 0.85;
    r.mesh.scale.set(r.scale, r.scale, 1);
    r.mesh.material.opacity = Math.max(0, r.opacity);
    if (r.life <= 0) {
      scene.remove(r.mesh);
      r.mesh.geometry.dispose();
      r.mesh.material.dispose();
      riverWaterRipples.splice(i, 1);
    }
  }

  // Cập nhật cá bơi và nhảy
  activeRiverFish.forEach((fish) => {
    if (fish.isJumping) {
      // Đang trong quỹ đạo nhảy parabol lên khỏi mặt nước
      fish.jumpProgress += delta / fish.jumpDuration;
      const t = fish.jumpProgress;

      if (t >= 1.0) {
        // Rơi trở lại xuống sông: tạo gợn sóng tõm
        fish.isJumping = false;
        fish.mesh.position.y = fish.baseY;
        fish.mesh.rotation.x = 0;
        spawnWaterRipple(fish.mesh.position.x, fish.mesh.position.z, 2.2);
        fish.jumpCooldown = 4.0 + Math.random() * 6.0;
      } else {
        // Quỹ đạo nhảy hình vòng cung parabol
        const arcY = 4 * fish.jumpHeight * t * (1 - t);
        fish.mesh.position.y = fish.baseY + arcY;
        // Chúc đầu lên khi bay lên, chúc đầu xuống khi rơi lặn
        const pitch = t < 0.5 ? -0.85 * (1 - t * 2) : 0.85 * ((t - 0.5) * 2);
        fish.mesh.rotation.x = pitch;
        // Đuôi quẫy nhanh trong không trung
        fish.tailPivot.rotation.y = Math.sin(time * 0.025 + fish.id) * 0.65;
      }
    } else {
      // Bơi lội thư thái dưới nước
      fish.mesh.rotation.x = 0;
      fish.mesh.position.y = fish.baseY + Math.sin(time * 0.003 + fish.id) * 0.04;
      fish.mesh.position.x = fish.baseX + Math.sin(time * 0.0012 + fish.id) * 0.65;
      fish.mesh.position.z = fish.baseZ + Math.cos(time * 0.0012 + fish.id) * 0.55;

      // Hướng mặt theo chuyển động
      const dirX = Math.cos(time * 0.0012 + fish.id);
      const dirZ = -Math.sin(time * 0.0012 + fish.id);
      fish.mesh.rotation.y = Math.atan2(dirX, dirZ);

      // Đuôi cá quẫy sóng nước nhịp nhàng
      fish.tailPivot.rotation.y = Math.sin(time * 0.015 + fish.id) * 0.45;

      // Đếm ngược nhảy lên khỏi mặt nước
      fish.jumpCooldown -= delta;
      if (fish.jumpCooldown <= 0) {
        fish.isJumping = true;
        fish.jumpProgress = 0;
        // Tạo gợn sóng nước lúc vọt lên
        spawnWaterRipple(fish.mesh.position.x, fish.mesh.position.z, 1.8);
      }
    }
  });
}

// ============================================================================
// HỆ THỐNG PHẢN ỨNG THỜI TIẾT (MƯA / TẠNH) & NGÀY ĐÊM CỦA NGƯỜI (HUMAN BEHAVIOR)
// ============================================================================
const CAMPUS_SHELTERS = [
  { id: 'canteen_porch', x: 22.0, y: 0, z: -12.0, name: 'Hiên Nhà Ăn CBNV' },
  { id: 'nhaA_canopy', x: 26.0, y: 0, z: -20.0, name: 'Sảnh mái hiên Nhà A' },
  { id: 'nhaA_main', x: 35.0, y: 0, z: -28.0, name: 'Hiên sảnh chính Nhà A' },
  { id: 'nhaB_dock', x: 58.0, y: 0, z: -32.5, name: 'Cửa cuốn Xưởng B' },
  { id: 'nhaB_east', x: 74.0, y: 0, z: -30.0, name: 'Mái che lối vào Xưởng B' },
  { id: 'ev_station', x: 26.0, y: 0, z: -24.0, name: 'Mái che Trạm sạc EV' },
  { id: 'bike_shelter', x: 79.5, y: 0, z: -46.0, name: 'Mái che xe điện Đông' },
  { id: 'guard_dk1', x: 74.0, y: 0, z: -18.0, name: 'Bốt bảo vệ Cổng 1' },
  { id: 'dk2_hq', x: -36.0, y: 0, z: -24.0, name: 'Sảnh đón Nhà điều hành DK2' },
  { id: 'dk2_warehouse', x: -72.0, y: 0, z: -55.0, name: 'Mái hiên Kho D2.1' },
  { id: 'dk2_gazebo', x: -108.0, y: 15.8, z: -82.0, name: 'Nhà chòi Vườn Lan' },
];

let campusToastTimeout = null;
function showCampusToast(message, type = 'info') {
  let toast = document.getElementById('campus-event-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'campus-event-toast';
    toast.className = 'campus-event-toast';
    document.body.appendChild(toast);
  }
  toast.innerHTML = message;
  toast.classList.add('show');

  if (campusToastTimeout) clearTimeout(campusToastTimeout);
  campusToastTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 4200);
}

function triggerEventSpeechBubbles(eventType) {
  const quotesMap = {
    rain: [
      "Mưa rồi mưa rồi vào nhà thôi! 🌧️🏃‍♂️",
      "Tuyệt vời, mưa cho cây lá xanh tốt! 🌱🌧️",
      "Mau chạy vào hiên trú mưa thôi anh em ơi! ☔💨",
      "Mát mẻ sảng khoái quá, cơn mưa rào tưới mát cả nhà máy! 🌦️✨",
      "Cất đồ vào xưởng nhanh lên nào! 📦🏃",
    ],
    sun: [
      "Tạnh mưa rồi, trời trong lành quá! ☀️✨",
      "Cầu vồng rực rỡ kìa mọi người ơi! 🌈😍",
      "Lại ra dạo mát và làm việc thôi nào! 🚶‍♂️💼",
      "Không khí sau mưa thơm mùi đất cỏ thật dễ chịu! 🍃🌿",
      "Trời hửng nắng rồi, tiếp tục một ngày năng suất nhé! 🛵💪",
    ],
    night: [
      "Tối rồi, đi ăn rồi tăng ca tiếp thôi! 🍜",
      "Đến giờ cơm tối rồi anh em ơi! 🍚🍗",
      "Đói bụng quá, cơm nhà ăn hôm nay có món gì nhỉ? 🍲😋",
      "Ăn no lấy sức lát chiến tiếp ca đêm nhé! 💪🌙",
      "Mùi sườn xào chua ngọt từ nhà ăn thơm nức mũi! 🤤✨",
    ],
    day: [
      "Bắt đầu ngày mới tràn đầy năng lượng nào! ☀️🛵",
      "Ăn cơm xong rồi, quay lại ca làm việc thôi! 💼🛠️",
      "Chiều mát mẻ, làm việc hiệu quả và an toàn nhé cả nhà! 🌇✨",
    ],
  };

  const quotes = quotesMap[eventType] || quotesMap.day;
  const typeClass = eventType === 'rain' ? 'type-weather-rain' : (eventType === 'sun' ? 'type-weather-sun' : 'type-night');
  const icon = eventType === 'rain' ? '🌧️' : (eventType === 'sun' ? '☀️' : (eventType === 'night' ? '🌙' : '✨'));

  // Chọn 2 - 3 người để hiện popup thoại
  const candidates = [];
  wanderingPedestrians.forEach(p => { if (p.mesh) candidates.push(p.mesh); });
  if (candidates.length === 0) return;

  // Xáo trộn ngẫu nhiên
  const shuffled = candidates.slice().sort(() => 0.5 - Math.random());
  const selectedCount = Math.min(3, shuffled.length);

  for (let i = 0; i < selectedCount; i++) {
    const mesh = shuffled[i];
    const quote = quotes[(i + Math.floor(Math.random() * quotes.length)) % quotes.length];
    setTimeout(() => {
      const el = document.createElement('div');
      el.className = \`cute-speech-bubble \${typeClass}\`;
      el.innerHTML = \`
        <span class="speech-icon">\${icon}</span>
        <span class="speech-text">\${quote}</span>
        <div class="speech-tail"></div>
      \`;
      document.body.appendChild(el);

      activeSpeechBubbles.push({
        el: el,
        speakerMesh: mesh,
        heightOffset: 2.1,
        ttl: 4.5,
        leaving: false,
      });
    }, i * 350);
  }
}
`;

// Insert helper definitions right before setupAnimatedVehicles
const markerSetupVehicles = `// ============================================================================
// 14. Animated Vehicles & Rail Transit`;
if (mainCode.includes(markerSetupVehicles)) {
  mainCode = mainCode.replace(markerSetupVehicles, newHelperDefinitions + '\n' + markerSetupVehicles);
  console.log('Inserted Jumping Fish & Weather/Night Reaction systems');
} else {
  console.error('Could not find markerSetupVehicles in main.js');
  process.exit(1);
}

// 2D. Update wanderingPedestrians movement loop in updateAnimatedObjects
const oldPedMovementLoop = `  wanderingPedestrians.forEach((p) => {
    // Nếu đang tạm dừng (pause look-around)
    if (p.pauseTimer > 0) {
      p.pauseTimer -= delta;
      if (p.mesh.userData.leftLeg) p.mesh.userData.leftLeg.rotation.x *= 0.88;
      if (p.mesh.userData.rightLeg) p.mesh.userData.rightLeg.rotation.x *= 0.88;
      if (p.mesh.userData.headGroup) {
        p.mesh.userData.headGroup.rotation.y = Math.sin(time * 0.0025 + p.id) * 0.32;
      }
      return;
    }

    const currentWP = CAMPUS_WAYPOINTS[p.targetIndex];
    if (!currentWP) return;

    // Nhường xe tải khi qua vạch kẻ đường ĐT234 (Waypoints 9, 10)
    if ((currentWP.id === 9 || currentWP.id === 10) && isTruckNearCrossing) {
      if (p.mesh.userData.leftLeg) p.mesh.userData.leftLeg.rotation.x *= 0.88;
      if (p.mesh.userData.rightLeg) p.mesh.userData.rightLeg.rotation.x *= 0.88;
      return;
    }

    const currentPos = p.mesh.position;
    const targetX = currentWP.x + p.offsetX;
    const targetZ = currentWP.z + p.offsetZ;
    const dx = targetX - currentPos.x;
    const dz = targetZ - currentPos.z;
    const distSq = dx * dx + dz * dz;

    if (distSq < 0.6) {
      // Đã tới waypoint: chọn waypoint tiếp theo từ danh sách neighbors
      p.currentIndex = p.targetIndex;
      const neighbors = currentWP.neighbors;
      let nextIndex = neighbors[Math.floor(Math.random() * neighbors.length)];
      if (nextIndex === p.lastIndex && neighbors.length > 1) {
        const otherNeighbors = neighbors.filter((n) => n !== p.lastIndex);
        if (otherNeighbors.length > 0) {
          nextIndex = otherNeighbors[Math.floor(Math.random() * otherNeighbors.length)];
        }
      }
      p.lastIndex = p.currentIndex;
      p.targetIndex = nextIndex;

      // Xác suất 22% dừng lại nghỉ / xem cảnh 2 - 3.5 giây
      if (Math.random() < 0.22) {
        p.pauseTimer = 2.0 + Math.random() * 2.0;
      }
    } else {
      // Bước đi tiến tới mục tiêu
      const dist = Math.sqrt(distSq);
      const moveDist = Math.min(p.speed * delta, dist);
      currentPos.x += (dx / dist) * moveDist;
      currentPos.z += (dz / dist) * moveDist;

      // Cập nhật cao độ Y theo địa hình (đặc biệt khi leo đồi)
      const targetY = currentWP.y || 0;
      currentPos.y += (targetY - currentPos.y) * delta * 4.5;

      // Xoay hướng mặt theo vector chuyển động
      const targetAngle = Math.atan2(dx, dz);
      let angleDiff = targetAngle - p.mesh.rotation.y;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      p.mesh.rotation.y += angleDiff * Math.min(delta * 7.5, 1.0);

      // Cử động nhịp nhàng chân tay theo bước chạy
      p.stepAngle += delta * (p.speed * 3.5);
      const swing = Math.sin(p.stepAngle) * 0.46;
      if (p.mesh.userData.leftLeg) p.mesh.userData.leftLeg.rotation.x = swing;
      if (p.mesh.userData.rightLeg) p.mesh.userData.rightLeg.rotation.x = -swing;
      if (!p.holdingTablet) {
        if (p.mesh.userData.leftArm) p.mesh.userData.leftArm.rotation.x = -swing * 0.8;
        if (p.mesh.userData.rightArm) p.mesh.userData.rightArm.rotation.x = swing * 0.8;
      }
    }
  });`;

const newPedMovementLoop = `  wanderingPedestrians.forEach((p) => {
    // 1. CHẾ ĐỘ TRÚ MƯA: Trời mưa -> chạy vào hiên trú mưa gần nhất
    if (isRaining) {
      if (!p.shelterTarget) {
        // Tìm địa điểm trú mưa có mái che gần nhất
        let bestDist = 99999;
        let bestShelter = CAMPUS_SHELTERS[0];
        const cx = p.mesh.position.x;
        const cz = p.mesh.position.z;
        for (let s of CAMPUS_SHELTERS) {
          const d = Math.hypot(cx - s.x, cz - s.z);
          if (d < bestDist) {
            bestDist = d;
            bestShelter = s;
          }
        }
        // Thêm độ lệch nhẹ để không đứng đè lên nhau
        const jitterX = ((p.id % 5) - 2) * 0.55;
        const jitterZ = ((p.id % 3) - 1) * 0.55;
        p.shelterTarget = { x: bestShelter.x + jitterX, y: bestShelter.y || 0, z: bestShelter.z + jitterZ };
        p.shelterState = 'running_to_shelter';
      }

      const tx = p.shelterTarget.x;
      const tz = p.shelterTarget.z;
      const dx = tx - p.mesh.position.x;
      const dz = tz - p.mesh.position.z;
      const dist = Math.hypot(dx, dz);

      if (dist < 0.6) {
        // Đã đến hiên trú mưa an toàn: Đứng ngắm mưa, nghỉ chân
        p.shelterState = 'sheltered';
        if (p.mesh.userData.leftLeg) p.mesh.userData.leftLeg.rotation.x *= 0.85;
        if (p.mesh.userData.rightLeg) p.mesh.userData.rightLeg.rotation.x *= 0.85;
        if (p.mesh.userData.headGroup) {
          p.mesh.userData.headGroup.rotation.y = Math.sin(time * 0.002 + p.id) * 0.35;
        }
        return;
      } else {
        // Chạy nhanh vào nhà trú mưa (tốc độ chạy 3.4 m/s)
        const runSpeed = 3.4;
        const moveDist = Math.min(runSpeed * delta, dist);
        p.mesh.position.x += (dx / dist) * moveDist;
        p.mesh.position.z += (dz / dist) * moveDist;
        p.mesh.position.y += ((p.shelterTarget.y || 0) - p.mesh.position.y) * delta * 5.0;

        const targetAngle = Math.atan2(dx, dz);
        p.mesh.rotation.y = targetAngle;

        p.stepAngle += delta * 12.0; // Bước chân chạy nhanh gấp rút
        const swing = Math.sin(p.stepAngle) * 0.72;
        if (p.mesh.userData.leftLeg) p.mesh.userData.leftLeg.rotation.x = swing;
        if (p.mesh.userData.rightLeg) p.mesh.userData.rightLeg.rotation.x = -swing;
        if (p.mesh.userData.leftArm) p.mesh.userData.leftArm.rotation.x = -swing * 0.9;
        if (p.mesh.userData.rightArm) p.mesh.userData.rightArm.rotation.x = swing * 0.9;
        return;
      }
    } else {
      p.shelterTarget = null;
      p.shelterState = null;
    }

    // 2. CHẾ ĐỘ TRỜI TỐI (NIGHT): Đi bộ / chạy đến Nhà Ăn CBNV (hoặc sảnh HQ DK2) để dùng bữa tối
    if (currentEnv === 'night') {
      if (!p.dinnerTarget) {
        if (p.mesh.position.x > -15) {
          // Phân khu DK1: Đến Nhà Ăn CBNV (Z = -12, X = 22)
          const jx = ((p.id % 5) - 2) * 0.7;
          const jz = ((p.id % 4) - 1.5) * 0.7;
          p.dinnerTarget = { x: 22.0 + jx, y: 0, z: -12.0 + jz };
        } else {
          // Phân khu DK2: Đến Sảnh đón & Nhà ăn HQ DK2 (X = -36, Z = -24)
          const jx = ((p.id % 4) - 1.5) * 0.6;
          const jz = ((p.id % 3) - 1) * 0.6;
          p.dinnerTarget = { x: -36.0 + jx, y: 0, z: -24.0 + jz };
        }
      }

      const tx = p.dinnerTarget.x;
      const tz = p.dinnerTarget.z;
      const dx = tx - p.mesh.position.x;
      const dz = tz - p.mesh.position.z;
      const dist = Math.hypot(dx, dz);

      if (dist < 0.75) {
        // Đã đến nhà ăn: đứng/ngồi ăn tối, trò chuyện vui vẻ
        if (p.mesh.userData.leftLeg) p.mesh.userData.leftLeg.rotation.x *= 0.85;
        if (p.mesh.userData.rightLeg) p.mesh.userData.rightLeg.rotation.x *= 0.85;
        if (p.mesh.userData.headGroup) {
          p.mesh.userData.headGroup.rotation.y = Math.sin(time * 0.0025 + p.id) * 0.4;
        }
        if (p.mesh.userData.rightArm) {
          p.mesh.userData.rightArm.rotation.x = -0.6 + Math.sin(time * 0.006 + p.id) * 0.25; // Động tác gắp thức ăn / cầm đũa
        }
        return;
      } else {
        // Đi bộ nhanh tới nhà ăn
        const dinnerWalkSpeed = 2.4;
        const moveDist = Math.min(dinnerWalkSpeed * delta, dist);
        p.mesh.position.x += (dx / dist) * moveDist;
        p.mesh.position.z += (dz / dist) * moveDist;
        p.mesh.position.y += ((p.dinnerTarget.y || 0) - p.mesh.position.y) * delta * 5.0;

        const targetAngle = Math.atan2(dx, dz);
        p.mesh.rotation.y = targetAngle;

        p.stepAngle += delta * 8.5;
        const swing = Math.sin(p.stepAngle) * 0.55;
        if (p.mesh.userData.leftLeg) p.mesh.userData.leftLeg.rotation.x = swing;
        if (p.mesh.userData.rightLeg) p.mesh.userData.rightLeg.rotation.x = -swing;
        if (p.mesh.userData.leftArm) p.mesh.userData.leftArm.rotation.x = -swing * 0.8;
        if (p.mesh.userData.rightArm) p.mesh.userData.rightArm.rotation.x = swing * 0.8;
        return;
      }
    } else {
      p.dinnerTarget = null;
    }

    // 3. CHẾ ĐỘ BAN NGÀY BÌNH THƯỜNG: Đi dạo theo Waypoint Graph
    // Nếu đang tạm dừng (pause look-around)
    if (p.pauseTimer > 0) {
      p.pauseTimer -= delta;
      if (p.mesh.userData.leftLeg) p.mesh.userData.leftLeg.rotation.x *= 0.88;
      if (p.mesh.userData.rightLeg) p.mesh.userData.rightLeg.rotation.x *= 0.88;
      if (p.mesh.userData.headGroup) {
        p.mesh.userData.headGroup.rotation.y = Math.sin(time * 0.0025 + p.id) * 0.32;
      }
      return;
    }

    const currentWP = CAMPUS_WAYPOINTS[p.targetIndex];
    if (!currentWP) return;

    // Nhường xe tải khi qua vạch kẻ đường ĐT234 (Waypoints 9, 10)
    if ((currentWP.id === 9 || currentWP.id === 10) && isTruckNearCrossing) {
      if (p.mesh.userData.leftLeg) p.mesh.userData.leftLeg.rotation.x *= 0.88;
      if (p.mesh.userData.rightLeg) p.mesh.userData.rightLeg.rotation.x *= 0.88;
      return;
    }

    const currentPos = p.mesh.position;
    const targetX = currentWP.x + p.offsetX;
    const targetZ = currentWP.z + p.offsetZ;
    const dx = targetX - currentPos.x;
    const dz = targetZ - currentPos.z;
    const distSq = dx * dx + dz * dz;

    if (distSq < 0.6) {
      // Đã tới waypoint: chọn waypoint tiếp theo từ danh sách neighbors
      p.currentIndex = p.targetIndex;
      const neighbors = currentWP.neighbors;
      let nextIndex = neighbors[Math.floor(Math.random() * neighbors.length)];
      if (nextIndex === p.lastIndex && neighbors.length > 1) {
        const otherNeighbors = neighbors.filter((n) => n !== p.lastIndex);
        if (otherNeighbors.length > 0) {
          nextIndex = otherNeighbors[Math.floor(Math.random() * otherNeighbors.length)];
        }
      }
      p.lastIndex = p.currentIndex;
      p.targetIndex = nextIndex;

      // Xác suất 22% dừng lại nghỉ / xem cảnh 2 - 3.5 giây
      if (Math.random() < 0.22) {
        p.pauseTimer = 2.0 + Math.random() * 2.0;
      }
    } else {
      // Bước đi tiến tới mục tiêu
      const dist = Math.sqrt(distSq);
      const moveDist = Math.min((p.speed || 1.6) * delta, dist);
      currentPos.x += (dx / dist) * moveDist;
      currentPos.z += (dz / dist) * moveDist;

      // Cập nhật cao độ Y theo địa hình (đặc biệt khi leo đồi)
      const targetY = currentWP.y || 0;
      currentPos.y += (targetY - currentPos.y) * delta * 4.5;

      // Xoay hướng mặt theo vector chuyển động
      const targetAngle = Math.atan2(dx, dz);
      let angleDiff = targetAngle - p.mesh.rotation.y;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      p.mesh.rotation.y += angleDiff * Math.min(delta * 7.5, 1.0);

      // Cử động nhịp nhàng chân tay theo bước chạy
      p.stepAngle += delta * ((p.speed || 1.6) * 3.5);
      const swing = Math.sin(p.stepAngle) * 0.46;
      if (p.mesh.userData.leftLeg) p.mesh.userData.leftLeg.rotation.x = swing;
      if (p.mesh.userData.rightLeg) p.mesh.userData.rightLeg.rotation.x = -swing;
      if (!p.holdingTablet) {
        if (p.mesh.userData.leftArm) p.mesh.userData.leftArm.rotation.x = -swing * 0.8;
        if (p.mesh.userData.rightArm) p.mesh.userData.rightArm.rotation.x = swing * 0.8;
      }
    }
  });`;

if (mainCode.includes(oldPedMovementLoop)) {
  mainCode = mainCode.replace(oldPedMovementLoop, newPedMovementLoop);
  console.log('Updated wanderingPedestrians movement loop with shelter & night canteen states');
} else {
  console.error('Could not find oldPedMovementLoop in main.js');
  process.exit(1);
}

// 2E. Update updateAnimatedObjects for rowing boat, oar, and call updateRiverFish
const oldBoatAnimation = `  // 6. Thuyền gỗ nhấp nhô nhẹ trên dòng sông máng nước xanh ngọc (như ảnh 2)
  if (rowingBoat) {
    rowingBoat.position.y = -0.30 + Math.sin(time * 0.0025) * 0.03;
    rowingBoat.rotation.z = Math.sin(time * 0.002) * 0.03;
  }

  // 7. Đàn cá bơi lội dưới sông máng (Bơi lượn dọc theo lòng kênh nước)
  if (riverFishGroup) {
    riverFishGroup.children.forEach((fMesh, idx) => {
      fMesh.position.z += Math.sin(time * 0.0015 + idx * 1.2) * delta * 0.6;
      const dir = Math.cos(time * 0.0015 + idx * 1.2);
      fMesh.rotation.y = (dir > 0 ? 0 : Math.PI) + Math.sin(time * 0.015 + idx) * 0.12;
    });
  }`;

const newBoatAnimation = `  // 6. Thuyền nan du ngoạn bồng bềnh và bơi xuôi ngược trên dòng sông máng (Z = -82, cách xa đường tàu > 15m)
  if (rowingBoat) {
    const boatPhase = (time * 0.0006) % (Math.PI * 2);
    const zOffset = Math.sin(boatPhase) * 6.5; // Bơi qua lại giữa Z = -75.5 và -88.5
    rowingBoat.position.z = -82.0 + zOffset;
    rowingBoat.position.x = 91.8 + Math.sin(boatPhase * 0.5) * 0.35;
    rowingBoat.position.y = -0.30 + Math.sin(time * 0.003) * 0.025;
    rowingBoat.rotation.z = Math.sin(time * 0.002) * 0.025;
    const forwardDir = Math.cos(boatPhase) > 0 ? 0.05 : Math.PI - 0.05;
    rowingBoat.rotation.y = forwardDir + Math.sin(time * 0.002) * 0.03;

    // Bác lái đò khua mái chèo nhịp nhàng
    if (rowingBoat.userData && rowingBoat.userData.oar) {
      rowingBoat.userData.oar.rotation.x = Math.sin(time * 0.004) * 0.35;
    }
  }

  // 7. Đàn cá Koi & cá sông bơi lội và nhảy vút lên khỏi mặt nước sông máng cạnh đường tàu
  updateRiverFish(delta, time);`;

if (mainCode.includes(oldBoatAnimation)) {
  mainCode = mainCode.replace(oldBoatAnimation, newBoatAnimation);
  console.log('Updated boat animation and river jumping fish update loop');
} else {
  console.error('Could not find oldBoatAnimation in main.js');
  process.exit(1);
}

// 2F. Update updateRainState to trigger event speech bubbles and toast
const oldUpdateRainState = `    if (enabled) {
      lightningCooldown = 0.8; // Ngay khi bật Mưa, xuất hiện tia sét sau 0.8 giây!
    } else {
      if (activeLightningGroup) {
        scene.remove(activeLightningGroup);
        activeLightningGroup = null;
      }
      if (lightningFlashLight) lightningFlashLight.intensity = 0;
      if (ambientLight && CONFIG.LIGHTING[currentEnv]) {
        ambientLight.intensity = CONFIG.LIGHTING[currentEnv].ambientIntensity;
      }
      if (dirLight && CONFIG.LIGHTING[currentEnv]) {
        dirLight.intensity = CONFIG.LIGHTING[currentEnv].sunIntensity;
      }
      lightningCooldown = 0.8;
    }`;

const newUpdateRainState = `    if (enabled) {
      lightningCooldown = 0.8; // Ngay khi bật Mưa, xuất hiện tia sét sau 0.8 giây!
      // Hiện toast và câu nói trú mưa sinh động
      showCampusToast('🌧️ Trời đổ mưa rào: Mọi người nhanh chân chạy vào các hiên nhà để trú mưa!', 'rain');
      triggerEventSpeechBubbles('rain');
    } else {
      if (activeLightningGroup) {
        scene.remove(activeLightningGroup);
        activeLightningGroup = null;
      }
      if (lightningFlashLight) lightningFlashLight.intensity = 0;
      if (ambientLight && CONFIG.LIGHTING[currentEnv]) {
        ambientLight.intensity = CONFIG.LIGHTING[currentEnv].ambientIntensity;
      }
      if (dirLight && CONFIG.LIGHTING[currentEnv]) {
        dirLight.intensity = CONFIG.LIGHTING[currentEnv].sunIntensity;
      }
      lightningCooldown = 0.8;
      // Hiện toast và câu nói tạnh mưa đáng yêu
      showCampusToast('☀️ Tạnh mưa rồi: Cầu vồng rực rỡ, mọi người lại ra ngoài tiếp tục hoạt động!', 'sun');
      triggerEventSpeechBubbles('sun');
    }`;

if (mainCode.includes(oldUpdateRainState)) {
  mainCode = mainCode.replace(oldUpdateRainState, newUpdateRainState);
  console.log('Updated updateRainState with toast & speech bubbles');
} else {
  console.error('Could not find oldUpdateRainState in main.js');
  process.exit(1);
}

// 2G. Update setEnvironment to trigger night canteen & day speech bubbles and toast
const oldSetEnvironmentTail = `  streetLightSpotLights.forEach((light) => {
    light.intensity = isNight ? 1.5 : (isSunset ? 0.6 : 0);
  });`;

const newSetEnvironmentTail = `  streetLightSpotLights.forEach((light) => {
    light.intensity = isNight ? 1.8 : (isSunset ? 0.75 : 0);
  });

  // Phản ứng sinh hoạt của CBNV khi chuyển đổi Ngày / Đêm
  if (isNight) {
    showCampusToast('🌙 Trời tối - Đèn đường bật sáng: Mọi người đi bộ & chạy vào Nhà Ăn CBNV dùng bữa tối!', 'night');
    triggerEventSpeechBubbles('night');
  } else if (time === 'day' || time === 'sunset') {
    showCampusToast(time === 'day' ? '☀️ Bắt đầu ngày mới: Mọi người trở lại vị trí làm việc và tiếp tục các hoạt động!' : '🌇 Chiều hoàng hôn: Không khí mát mẻ, làm việc hăng say!', 'day');
    triggerEventSpeechBubbles('day');
  }`;

if (mainCode.includes(oldSetEnvironmentTail)) {
  mainCode = mainCode.replace(oldSetEnvironmentTail, newSetEnvironmentTail);
  console.log('Updated setEnvironment with night/day reactions & speech bubbles');
} else {
  console.error('Could not find oldSetEnvironmentTail in main.js');
  process.exit(1);
}

// 2H. Update labels in createBuildingLabels
const oldSheepLabel = `{ text: '🐑 Đàn cừu trên đồi cỏ', pos: new THREE.Vector3(108, 6.8, -45), id: 'sheepFlock' },`;
const newSheepLabel = `{ text: '🐑 Đàn cừu trên bãi cỏ', pos: new THREE.Vector3(108, 2.6, -45), id: 'sheepFlock' },`;

const oldBoatLabel = `{ text: '⛵ Thuyền chèo đò trên sông', pos: new THREE.Vector3(89.5, 1.8, -8), id: 'rowingBoat' },`;
const newBoatLabel = `{ text: '⛵ Thuyền chèo đò trên sông', pos: new THREE.Vector3(91.8, 1.8, -82), id: 'rowingBoat' },`;

if (mainCode.includes(oldSheepLabel)) {
  mainCode = mainCode.replace(oldSheepLabel, newSheepLabel);
  console.log('Updated sheepFlock label position in main.js');
}

if (mainCode.includes(oldBoatLabel)) {
  mainCode = mainCode.replace(oldBoatLabel, newBoatLabel);
  console.log('Updated rowingBoat label position in main.js');
}

if (isMainCrlf) mainCode = mainCode.replace(/\n/g, '\r\n');
fs.writeFileSync(mainPath, mainCode, 'utf8');
console.log('Successfully saved src/main.js with all features!');
