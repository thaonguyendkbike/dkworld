// scripts/overhaul_river_bridge_visuals.cjs
const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../src/config.js');
const mainPath = path.join(__dirname, '../src/main.js');

// 1. UPDATE src/config.js
let configRaw = fs.readFileSync(configPath, 'utf8');
const isConfigCrlf = configRaw.includes('\r\n');
let configCode = configRaw.replace(/\r\n/g, '\n');

// Update WATER deepColor to clean cerulean
const oldWaterDeep = `    deepColor: 0x0369a1,    // Xanh đậm sẫm có chiều sâu giữa dòng`;
const newWaterDeep = `    deepColor: 0x0284c7,    // Xanh ngọc biếc trong trẻo có chiều sâu giữa dòng (chuẩn ảnh mẫu)`;
if (configCode.includes(oldWaterDeep)) {
  configCode = configCode.replace(oldWaterDeep, newWaterDeep);
  console.log('Updated WATER deepColor in config.js');
}

// Add/update bridgeView preset in PRESETS
const oldPresetsMarker = `    sheepFlock: {`;
const newPresetsWithBridge = `    bridgeView: {
      pos: { x: 99.0, y: 28.0, z: -48.0 },
      target: { x: 93.5, y: 1.0, z: -48.0 },
      name: 'Cầu đường sắt vượt sông (Ảnh mẫu)',
    },
    sheepFlock: {`;

if (!configCode.includes('bridgeView:') && configCode.includes(oldPresetsMarker)) {
  configCode = configCode.replace(oldPresetsMarker, newPresetsWithBridge);
  console.log('Added bridgeView preset to config.js');
}

if (isConfigCrlf) configCode = configCode.replace(/\n/g, '\r\n');
fs.writeFileSync(configPath, configCode, 'utf8');
console.log('Successfully saved src/config.js');

// 2. UPDATE src/main.js
let mainRaw = fs.readFileSync(mainPath, 'utf8');
const isMainCrlf = mainRaw.includes('\r\n');
let mainCode = mainRaw.replace(/\r\n/g, '\n');

// 2A. Update createStylizedWaterMaterial with high-frequency sun glitter, bright crystalline colors, and eliminate blurry blobs
const oldWaterMaterialBlock = `        // Họa tiết vệt sáng khúc xạ đáy nước chuyển động chậm (Animated Caustics)
        float c1 = sin(vWorldPosition.x * 0.55 + uTime * 0.85) * cos(vWorldPosition.z * 0.55 - uTime * 0.65);
        float c2 = cos(vWorldPosition.x * 0.9 - uTime * 0.5) * sin(vWorldPosition.z * 0.9 + uTime * 0.75);
        float caustic = pow(clamp(c1 + c2, 0.0, 1.0), 3.0) * 0.36;
        waterCol += caustic * vec3(1.0);

        // Viền bọt trắng uốn lượn sát mép bờ cát
        float shoreEdge = (uIsCurvedCanal > 0.5) ? abs(vUv.x - 0.5) * 2.0 : length(vUv - vec2(0.5)) * 2.0;
        float foamNoise = sin(vWorldPosition.z * 2.0 + uTime * 2.2) * 0.04;
        float foam = smoothstep(0.85 + foamNoise, 0.98, shoreEdge) * 0.88;
        waterCol = mix(waterCol, uFoamColor, foam);

        // Hiệu ứng hạt mưa tạo vòng sóng tròn lan tỏa khi trời mưa
        if (uIsRaining > 0.5) {
          float rip1 = sin(length(mod(vWorldPosition.xz, 5.0) - 2.5) * 9.0 - uTime * 8.0);
          float rip2 = sin(length(mod(vWorldPosition.xz + 2.0, 6.0) - 3.0) * 8.0 - uTime * 9.0);
          float rainRipples = max(0.0, rip1 * 0.5 + rip2 * 0.5);
          waterCol += rainRipples * 0.25 * vec3(1.0);
        }

        // Vệt phản chiếu ánh nắng lấp lánh (Specular Highlights)
        vec3 viewDir = normalize(cameraPosition - vWorldPosition);
        vec3 halfDir = normalize(uSunDir + viewDir);
        float spec = pow(max(dot(vNormal, halfDir), 0.0), 36.0);
        waterCol += spec * uSunColor * 0.45;

        gl_FragColor = vec4(waterCol, 0.74);`;

const newWaterMaterialBlock = `        // 1. Họa tiết sóng gợn đáy nước tự nhiên (loại bỏ hoàn toàn đốm tròn mờ lớn)
        float c1 = sin(vWorldPosition.x * 2.8 + uTime * 1.4) * cos(vWorldPosition.z * 2.8 - uTime * 1.1);
        float c2 = cos(vWorldPosition.x * 4.4 - uTime * 1.6) * sin(vWorldPosition.z * 4.4 + uTime * 1.5);
        float caustic = pow(clamp((c1 + c2) * 0.5 + 0.5, 0.0, 1.0), 3.2) * 0.26;
        waterCol += caustic * vec3(0.85, 0.96, 1.0);

        // 2. Hiệu ứng hạt lấp lánh li ti phản chiếu ánh mặt trời (Sun Sparkle Glitter như ảnh mẫu bên trái)
        float spk1 = sin(vWorldPosition.x * 16.0 + uTime * 3.6) * sin(vWorldPosition.z * 16.0 - uTime * 3.0);
        float spk2 = cos(vWorldPosition.x * 24.0 - uTime * 2.8) * cos(vWorldPosition.z * 24.0 + uTime * 3.4);
        float glitter = pow(clamp(spk1 * spk2, 0.0, 1.0), 7.0) * 2.6;

        // Điểm phản chiếu kim cương li ti sắc nét
        float microGlint = sin(vWorldPosition.x * 38.0 + vWorldPosition.z * 28.0 + uTime * 4.5);
        if (microGlint > 0.90) {
          glitter += (microGlint - 0.90) * 8.5;
        }
        waterCol += glitter * vec3(1.0, 1.0, 0.94);

        // 3. Dải viền cát trắng mịn sát mép bờ (Crisp White Shoreline Rim)
        float shoreEdge = (uIsCurvedCanal > 0.5) ? abs(vUv.x - 0.5) * 2.0 : length(vUv - vec2(0.5)) * 2.0;
        float foamNoise = sin(vWorldPosition.z * 3.2 + uTime * 2.2) * 0.03;
        float foam = smoothstep(0.91 + foamNoise, 0.985, shoreEdge) * 0.95;
        waterCol = mix(waterCol, uFoamColor, foam);

        // Hiệu ứng hạt mưa tạo vòng sóng tròn lan tỏa khi trời mưa
        if (uIsRaining > 0.5) {
          float rip1 = sin(length(mod(vWorldPosition.xz, 5.0) - 2.5) * 9.0 - uTime * 8.0);
          float rip2 = sin(length(mod(vWorldPosition.xz + 2.0, 6.0) - 3.0) * 8.0 - uTime * 9.0);
          float rainRipples = max(0.0, rip1 * 0.5 + rip2 * 0.5);
          waterCol += rainRipples * 0.25 * vec3(1.0);
        }

        // Vệt phản chiếu ánh nắng lấp lánh (Specular Highlights)
        vec3 viewDir = normalize(cameraPosition - vWorldPosition);
        vec3 halfDir = normalize(uSunDir + viewDir);
        float spec = pow(max(dot(vNormal, halfDir), 0.0), 32.0);
        waterCol += spec * uSunColor * 0.55;

        // Nước trong xanh tươi tắn, có độ trong suốt nhìn thấu đáy cát và đàn cá bơi lội
        gl_FragColor = vec4(waterCol, 0.82);`;

if (mainCode.includes(oldWaterMaterialBlock)) {
  mainCode = mainCode.replace(oldWaterMaterialBlock, newWaterMaterialBlock);
  console.log('Successfully upgraded water shader with crystal cyan, sparkle glitter & crisp shoreline');
} else {
  console.error('Could not find oldWaterMaterialBlock in main.js');
  process.exit(1);
}

// 2B. Remove woodBridge at Z = 20
const oldWoodBridgeBlock = `  // Cầu gỗ mộc bắc qua sông máng ở mạn Nam (Z = 20)
  const woodBridge = new THREE.Mesh(
    new THREE.BoxGeometry(canalWidth + 2.0, 0.35, 3.2),
    new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.85 })
  );
  woodBridge.position.set(90.5, 0.08, 20);
  woodBridge.castShadow = true;
  scene.add(woodBridge);`;

const newWoodBridgeBlock = `  // (Đã loại bỏ khối hộp cầu gỗ mộc thô kệch Z = 20 để dòng sông thông suốt, nguyên bản như ảnh mẫu)`;

if (mainCode.includes(oldWoodBridgeBlock)) {
  mainCode = mainCode.replace(oldWoodBridgeBlock, newWoodBridgeBlock);
  console.log('Successfully removed raw brown woodBridge block at Z = 20');
} else {
  console.log('woodBridge block already removed or not found');
}

// 2C. Add Puffy Cloud-Canopy Tree geometry function and River Stones & Water Lily Detailing
const helperMarker = `// Tạo hình cây thông 3 tầng nón xếp chồng + thân gỗ gộp chung (Compound Tiered Pine)`;
const newPuffyCanopyCode = `// Tạo tán cây tròn bồng bềnh nhiều múi búp mây (Stylized Puffy Cloud-Canopy như ảnh mẫu bên trái)
function createPuffyCloudCanopyGeometry(baseRadius = 1.6) {
  const geos = [];

  // Múi trung tâm tròn lớn
  const centerSphere = new THREE.DodecahedronGeometry(baseRadius, 1);
  geos.push(centerSphere);

  // 4 múi búp mây vệ tinh nở tròn xung quanh tạo tán cây bồng bềnh hữu cơ
  const lobes = [
    { x: 0.85 * baseRadius, y: -0.15 * baseRadius, z: 0.35 * baseRadius, r: 0.72 * baseRadius },
    { x: -0.75 * baseRadius, y: 0.12 * baseRadius, z: -0.45 * baseRadius, r: 0.75 * baseRadius },
    { x: -0.35 * baseRadius, y: -0.22 * baseRadius, z: 0.75 * baseRadius, r: 0.68 * baseRadius },
    { x: 0.45 * baseRadius, y: 0.28 * baseRadius, z: -0.65 * baseRadius, r: 0.65 * baseRadius },
  ];

  lobes.forEach((l) => {
    const lobeGeo = new THREE.DodecahedronGeometry(l.r, 1);
    lobeGeo.translate(l.x, l.y, l.z);
    geos.push(lobeGeo);
  });

  const merged = BufferGeometryUtils.mergeGeometries(geos, false);
  merged.computeVertexNormals();
  return merged;
}

`;

if (!mainCode.includes('createPuffyCloudCanopyGeometry') && mainCode.includes(helperMarker)) {
  mainCode = mainCode.replace(helperMarker, newPuffyCanopyCode + helperMarker);
  console.log('Added createPuffyCloudCanopyGeometry function to main.js');
}

// 2D. Replace roundFoliageGeo & autumnFoliageGeo to use puffy cloud canopies
const oldRoundFoliageGeo = `const roundFoliageGeo = createJitteredIcosahedron(1.7, 1, 0.28);`;
const newRoundFoliageGeo = `const roundFoliageGeo = createPuffyCloudCanopyGeometry(1.55);`;

if (mainCode.includes(oldRoundFoliageGeo)) {
  mainCode = mainCode.replace(oldRoundFoliageGeo, newRoundFoliageGeo);
  console.log('Upgraded roundFoliageGeo to puffy cloud canopy');
}

const oldAutumnFoliageGeo = `const autumnFoliageGeo = createJitteredIcosahedron(1.55, 1, 0.3);`;
const newAutumnFoliageGeo = `const autumnFoliageGeo = createPuffyCloudCanopyGeometry(1.45);`;

if (mainCode.includes(oldAutumnFoliageGeo)) {
  mainCode = mainCode.replace(oldAutumnFoliageGeo, newAutumnFoliageGeo);
  console.log('Upgraded autumnFoliageGeo to puffy cloud canopy');
}

// 2E. Add River Stones, Pebbles & Beautiful Lily Pad Clusters with Blooming Pink Water Lilies in buildCanalAndRailway
const markerAfterLily = `  // Đàn cá Koi & cá sông bơi lội, nhảy lên khỏi mặt nước dọc theo dòng sông cạnh đường tàu (Khối 4 & 5)
  buildRiverJumpingFish();`;

const newRiverShoreAndLilyDetail = `  // Đàn cá Koi & cá sông bơi lội, nhảy lên khỏi mặt nước dọc theo dòng sông cạnh đường tàu (Khối 4 & 5)
  buildRiverJumpingFish();

  // Bổ sung sỏi đá cuội ven bờ & Cụm hoa súng nở rộ rực rỡ quanh chân cầu đường sắt (chuẩn 100% như ảnh mẫu bên trái)
  const riverPebbleMat = new THREE.MeshStandardMaterial({
    color: 0x78716c,
    roughness: 0.85,
    flatShading: true,
  });
  const pebbleMatDark = new THREE.MeshStandardMaterial({
    color: 0x475569,
    roughness: 0.9,
    flatShading: true,
  });
  const pebbleMatWarm = new THREE.MeshStandardMaterial({
    color: 0x854d0e,
    roughness: 0.88,
    flatShading: true,
  });

  // Đá cuội rải rác tự nhiên 2 bên bờ mép cát
  const pebbleCoords = [
    // Bờ Tây (Mạn trái sông)
    { x: 88.5, z: -58, s: 0.42, mat: riverPebbleMat },
    { x: 88.2, z: -54, s: 0.65, mat: pebbleMatDark },
    { x: 88.8, z: -50, s: 0.35, mat: pebbleMatWarm },
    { x: 88.4, z: -45, s: 0.55, mat: riverPebbleMat },
    { x: 88.6, z: -40, s: 0.38, mat: pebbleMatDark },
    { x: 88.2, z: -35, s: 0.72, mat: pebbleMatWarm },
    { x: 87.8, z: -25, s: 0.48, mat: riverPebbleMat },
    { x: 87.5, z: -15, s: 0.58, mat: pebbleMatDark },
    { x: 87.8, z: -6, s: 0.38, mat: riverPebbleMat },
    { x: 88.0, z: 8, s: 0.52, mat: pebbleMatWarm },
    { x: 88.2, z: 22, s: 0.62, mat: riverPebbleMat },
    // Bờ Đông (Mạn phải sông)
    { x: 95.8, z: -60, s: 0.45, mat: pebbleMatDark },
    { x: 96.2, z: -55, s: 0.68, mat: riverPebbleMat },
    { x: 95.5, z: -48, s: 0.38, mat: pebbleMatWarm },
    { x: 95.8, z: -42, s: 0.58, mat: riverPebbleMat },
    { x: 94.5, z: -35, s: 0.48, mat: pebbleMatDark },
    { x: 93.8, z: -22, s: 0.62, mat: pebbleMatWarm },
    { x: 93.2, z: -10, s: 0.42, mat: riverPebbleMat },
    { x: 93.5, z: 5, s: 0.55, mat: pebbleMatDark },
    { x: 94.0, z: 18, s: 0.68, mat: pebbleMatWarm },
  ];

  pebbleCoords.forEach((pb) => {
    const pebble = new THREE.Mesh(new THREE.DodecahedronGeometry(pb.s, 0), pb.mat);
    pebble.scale.set(1.2, 0.65, 0.95);
    pebble.position.set(pb.x, -0.15, pb.z);
    pebble.rotation.set(Math.random() * 2, Math.random() * 2, Math.random() * 2);
    pebble.castShadow = true;
    pebble.receiveShadow = true;
    scene.add(pebble);
  });

  // Cụm lá sen & Hoa súng nở hồng phấn nhụy vàng rực rỡ dưới chân cầu (như ảnh mẫu)
  const padMatVibrant = new THREE.MeshStandardMaterial({
    color: 0x22c55e,
    roughness: 0.55,
    side: THREE.DoubleSide,
  });
  const lotusPinkMat = new THREE.MeshStandardMaterial({
    color: 0xf472b6,
    roughness: 0.3,
  });
  const lotusCenterMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    roughness: 0.2,
  });

  // Hàm tạo bông hoa súng 8 cánh nở rực rỡ
  const createWaterLilyFlower = () => {
    const flwGroup = new THREE.Group();
    // 8 cánh hoa hồng xòe
    for (let p = 0; p < 8; p++) {
      const ang = (p / 8) * Math.PI * 2;
      const petal = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.38, 4), lotusPinkMat);
      petal.rotation.x = Math.PI / 3.2;
      petal.rotation.z = Math.PI / 2;
      petal.position.set(Math.cos(ang) * 0.18, 0.08, Math.sin(ang) * 0.18);
      petal.rotation.y = -ang;
      flwGroup.add(petal);
    }
    // Nhụy vàng rực rỡ ở giữa
    const center = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), lotusCenterMat);
    center.position.y = 0.08;
    flwGroup.add(center);
    return flwGroup;
  };

  // Cụm lá sen mạn Tây cầu (Z = -44 đến -55)
  const lilyClusterWest = [
    { x: 91.2, z: -55, r: 0.95, rot: 0.2, hasFlower: true },
    { x: 90.4, z: -53, r: 0.75, rot: 1.4, hasFlower: false },
    { x: 91.8, z: -52, r: 0.85, rot: 2.1, hasFlower: false },
    { x: 90.8, z: -49, r: 1.15, rot: -0.6, hasFlower: true }, // Hoa súng lớn nở cạnh bóng cầu
    { x: 92.2, z: -46, r: 0.80, rot: 0.8, hasFlower: false },
    { x: 90.2, z: -44, r: 0.90, rot: 1.9, hasFlower: false },
    { x: 89.8, z: -40, r: 0.70, rot: -1.2, hasFlower: false },
  ];

  lilyClusterWest.forEach((lc) => {
    const lPad = new THREE.Mesh(new THREE.CircleGeometry(lc.r, 16, 0.35, Math.PI * 1.88), padMatVibrant);
    lPad.rotation.x = -Math.PI / 2;
    lPad.rotation.z = lc.rot;
    lPad.position.set(lc.x, -0.28, lc.z);
    lPad.receiveShadow = true;
    scene.add(lPad);

    if (lc.hasFlower) {
      const lilyFlw = createWaterLilyFlower();
      lilyFlw.position.set(lc.x + 0.1, -0.22, lc.z - 0.1);
      scene.add(lilyFlw);
    }
  });

  // Cụm lá sen mạn Đông cầu (Z = -50 đến -38)
  const lilyClusterEast = [
    { x: 95.2, z: -49, r: 0.85, rot: 0.4, hasFlower: false },
    { x: 94.6, z: -45, r: 1.05, rot: 1.8, hasFlower: true },
    { x: 95.8, z: -42, r: 0.75, rot: -0.5, hasFlower: false },
    { x: 94.8, z: -38, r: 0.90, rot: 2.4, hasFlower: false },
  ];

  lilyClusterEast.forEach((lc) => {
    const lPad = new THREE.Mesh(new THREE.CircleGeometry(lc.r, 16, 0.35, Math.PI * 1.88), padMatVibrant);
    lPad.rotation.x = -Math.PI / 2;
    lPad.rotation.z = lc.rot;
    lPad.position.set(lc.x, -0.28, lc.z);
    lPad.receiveShadow = true;
    scene.add(lPad);

    if (lc.hasFlower) {
      const lilyFlw = createWaterLilyFlower();
      lilyFlw.position.set(lc.x - 0.1, -0.22, lc.z + 0.1);
      scene.add(lilyFlw);
    }
  });`;

if (mainCode.includes(markerAfterLily)) {
  mainCode = mainCode.replace(markerAfterLily, newRiverShoreAndLilyDetail);
  console.log('Successfully added river stones, pebbles, and water lily flower clusters');
} else {
  console.error('Could not find markerAfterLily in main.js');
  process.exit(1);
}

// 2F. Update Red Arch Bridge: ensure rich vermilion red color and curved railings
const oldBridgeArchMat = `  const redSteelMat = new THREE.MeshStandardMaterial({
    color: CONFIG.RAILWAY.bridgeArchColor,
    roughness: 0.35,
    metalness: 0.5,
  });`;

const newBridgeArchMat = `  const redSteelMat = new THREE.MeshStandardMaterial({
    color: 0xdc2626, // Màu đỏ son rực rỡ tươi tắn như ảnh mẫu (Vermilion Red)
    roughness: 0.30,
    metalness: 0.55,
  });`;

if (mainCode.includes(oldBridgeArchMat)) {
  mainCode = mainCode.replace(oldBridgeArchMat, newBridgeArchMat);
  console.log('Updated redSteelMat to vermilion red 0xdc2626 matching reference image');
}

if (isMainCrlf) mainCode = mainCode.replace(/\n/g, '\r\n');
fs.writeFileSync(mainPath, mainCode, 'utf8');
console.log('Successfully saved src/main.js with all river, bridge and forest enhancements!');
