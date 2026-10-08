// scripts/patch_block9_full.cjs
const fs = require('fs');
const path = require('path');

const mainPath = path.join(__dirname, '..', 'src', 'main.js');
let code = fs.readFileSync(mainPath, 'utf8');

// Ensure guardGate1 is captured
if (!code.includes('guardGate1 = guard1;')) {
  code = code.replace(
    /const guard1 = createCharacter\(\{ shirtColor: 0x1e293b, pantsColor: 0x0f172a, hatColor: 0x1e293b \}\);(\r?\n)/,
    'const guard1 = createCharacter({ shirtColor: 0x1e293b, pantsColor: 0x0f172a, hatColor: 0x1e293b });$1  guardGate1 = guard1;$1'
  );
  console.log('Hooked guardGate1.');
}

// Prepare block 9 helper functions
const block9Helpers = `
// ============================================================================
// KHỐI 9: XE NÂNG, XE TẢI & HOẠT CẢNH LOGISTICS KHÉP KÍN (LOGISTICS MASTER)
// ============================================================================

// 1. Tạo mô hình xe nâng điện chi tiết chuẩn công nghiệp (Komatsu Electric Forklift)
function createDetailedForklift(x, y, z, rotY, id, name, options = {}) {
  const flGroup = new THREE.Group();
  flGroup.position.set(x, y, z);
  flGroup.rotation.y = rotY;

  // Materials
  const orangeMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.35, metalness: 0.15 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.65 });
  const steelMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4, metalness: 0.5 });
  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.2, metalness: 0.85 });
  const amberBeaconMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    emissive: 0xf59e0b,
    emissiveIntensity: 0.95,
    roughness: 0.2,
  });

  // A. Chassis Body (Thân xe nâng sơn cam công nghiệp)
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.95, 1.26), orangeMat);
  chassis.position.set(0, 0.65, 0);
  chassis.castShadow = true;
  flGroup.add(chassis);

  // Bậc lên xuống có vân chống trượt
  const stepL = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 0.18), darkMat);
  stepL.position.set(-0.1, 0.25, 0.68);
  flGroup.add(stepL);
  const stepR = stepL.clone();
  stepR.position.z = -0.68;
  flGroup.add(stepR);

  // B. Đối trọng đúc gang phía sau (Heavy Cast Iron Counterweight)
  const counterWeight = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.88, 1.24), darkMat);
  counterWeight.position.set(-0.88, 0.68, 0);
  counterWeight.castShadow = true;
  flGroup.add(counterWeight);

  // Logo DK Logistics sau xe
  const logoPlate = new THREE.Mesh(
    new THREE.BoxGeometry(0.04, 0.22, 0.65),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 })
  );
  logoPlate.position.set(-1.25, 0.72, 0);
  flGroup.add(logoPlate);

  const logoText = new THREE.Mesh(
    new THREE.BoxGeometry(0.05, 0.12, 0.5),
    new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3 })
  );
  logoText.position.set(-1.26, 0.72, 0);
  flGroup.add(logoText);

  // C. Khung bảo vệ người lái (Overhead Guard / Roll Cage)
  const cageGroup = new THREE.Group();
  cageGroup.position.set(-0.15, 1.35, 0);

  // 4 trụ thép chịu lực
  const postGeo = new THREE.CylinderGeometry(0.042, 0.042, 1.32, 8);
  const postPositions = [
    [-0.55, 0.66, 0.52],
    [-0.55, 0.66, -0.52],
    [0.55, 0.66, 0.52],
    [0.55, 0.66, -0.52],
  ];
  postPositions.forEach((pos) => {
    const post = new THREE.Mesh(postGeo, steelMat);
    post.position.set(...pos);
    post.castShadow = true;
    cageGroup.add(post);
  });

  // Mái che khung thép có lưới bảo vệ chống vật rơi
  const roof = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.06, 1.15), steelMat);
  roof.position.set(0, 1.34, 0);
  roof.castShadow = true;
  cageGroup.add(roof);

  // Các thanh song sắt an toàn trên nóc
  for (let sx = -0.45; sx <= 0.45; sx += 0.18) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.04, 1.05), darkMat);
    bar.position.set(sx, 1.37, 0);
    cageGroup.add(bar);
  }

  // Đèn xoay cảnh báo màu hổ phách trên nóc (Amber Rotating Strobe Beacon)
  const beaconBase = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.08, 8), darkMat);
  beaconBase.position.set(0, 1.41, 0);
  cageGroup.add(beaconBase);

  const beaconDome = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.15, 8), amberBeaconMat);
  beaconDome.position.set(0, 1.51, 0);
  cageGroup.add(beaconDome);

  const beaconLight = new THREE.PointLight(0xf59e0b, 0.75, 8);
  beaconLight.position.set(0, 1.55, 0);
  cageGroup.add(beaconLight);

  rotatingBeacons.push({ mesh: beaconDome, light: beaconLight });

  // 2 Đèn pha làm việc phía trước gắn trên khung bảo vệ
  [-0.48, 0.48].forEach((wz) => {
    const workLight = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.12, 0.1),
      new THREE.MeshStandardMaterial({ color: 0xffedd5, emissive: 0xfef08a, emissiveIntensity: 0.8 })
    );
    workLight.position.set(0.58, 1.15, wz);
    cageGroup.add(workLight);
  });

  flGroup.add(cageGroup);

  // D. Buồng lái, ghế ngồi & tài xế
  const seatBase = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.22, 0.52), darkMat);
  seatBase.position.set(-0.25, 0.72, 0);
  flGroup.add(seatBase);

  const seatBack = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.52, 0.48), darkMat);
  seatBack.position.set(-0.48, 1.05, 0);
  flGroup.add(seatBack);

  // Vô lăng nghiêng & cần gạt thủy lực
  const steeringCol = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.55, 6), steelMat);
  steeringCol.rotation.z = -Math.PI / 6;
  steeringCol.position.set(0.18, 0.95, 0);
  flGroup.add(steeringCol);

  const wheelRim = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.025, 6, 12), darkMat);
  wheelRim.rotation.y = Math.PI / 2;
  wheelRim.rotation.x = Math.PI / 6;
  wheelRim.position.set(0.3, 1.15, 0);
  flGroup.add(wheelRim);

  // Tài xế ngồi lái xe nâng
  const driver = createCharacter({
    shirtColor: 0xea580c,
    pantsColor: 0x1e293b,
    hatColor: 0xfacc15,
    isDriver: true,
  });
  driver.position.set(-0.24, 0.75, 0);
  flGroup.add(driver);

  // E. Khung nâng (Mast) 2 tầng chữ I & Ty thủy lực mạ chrome
  const mastGroup = new THREE.Group();
  mastGroup.position.set(1.05, 0, 0);

  // 2 Trụ ray chữ I đứng cố định
  [-0.45, 0.45].forEach((mz) => {
    const mastColumn = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.55, 0.14), steelMat);
    mastColumn.position.set(0, 1.45, mz);
    mastColumn.castShadow = true;
    mastGroup.add(mastColumn);
  });

  // Thanh giằng ngang liên kết khung mast
  [1.0, 1.8, 2.6].forEach((hy) => {
    const tieBar = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 0.85), steelMat);
    tieBar.position.set(0, hy, 0);
    mastGroup.add(tieBar);
  });

  // Ty đẩy thủy lực mạ chrome sáng bóng
  const ramCylinder = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 2.1, 8), chromeMat);
  ramCylinder.position.set(-0.02, 1.35, 0);
  mastGroup.add(ramCylinder);

  flGroup.add(mastGroup);

  // F. Cụm giá nâng di động (Sliding Carriage & Forged Forks)
  const liftGroup = new THREE.Group();
  liftGroup.position.set(1.15, 0.22, 0);

  const carriage = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.54, 0.98), darkMat);
  carriage.position.set(0, 0.28, 0);
  liftGroup.add(carriage);

  // Càng nâng thép tôi cứng hình chữ L
  [-0.26, 0.26].forEach((fz) => {
    // Đoạn đứng móc vào giá
    const forkUp = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.52, 0.14), darkMat);
    forkUp.position.set(0.04, 0.28, fz);
    liftGroup.add(forkUp);

    // Lưỡi càng ngang vát nhọn phía trước
    const forkBlade = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.065, 0.14), darkMat);
    forkBlade.position.set(0.68, 0.04, fz);
    liftGroup.add(forkBlade);
  });

  // Pallet hàng gắn trên càng nâng (nếu là xe tĩnh hoặc xe chu kỳ có tải)
  let cargoPalletOnFork = null;
  if (!options.isActiveCycle) {
    cargoPalletOnFork = createForkliftPalletCargo();
    liftGroup.add(cargoPalletOnFork);
  }

  flGroup.add(liftGroup);

  // G. Bánh xe công nghiệp đặc (Solid Industrial Rubber Tires)
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.95 });
  const hubMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.4 });

  // Bánh trước chịu tải lớn
  [-0.64, 0.64].forEach((wz) => {
    const fWheel = new THREE.Group();
    fWheel.position.set(0.65, 0.35, wz);
    const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.26, 12), tireMat);
    tire.rotation.x = Math.PI / 2;
    fWheel.add(tire);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.27, 8), hubMat);
    hub.rotation.x = Math.PI / 2;
    fWheel.add(hub);
    flGroup.add(fWheel);
  });

  // Bánh sau đánh lái
  [-0.58, 0.58].forEach((wz) => {
    const rWheel = new THREE.Group();
    rWheel.position.set(-0.68, 0.3, wz);
    const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.22, 12), tireMat);
    tire.rotation.x = Math.PI / 2;
    rWheel.add(tire);
    flGroup.add(rWheel);
  });

  // Metadata tương tác
  const flData = {
    id: id,
    title: name,
    type: 'forklift',
    desc: 'Xe nâng điện công nghiệp Komatsu 2.5 tấn tích hợp đèn xoay cảnh báo, phục vụ bốc xếp pallet linh kiện và xe thành phẩm.',
    zone: id.includes('2') ? 'DK2' : 'DK1',
  };
  flGroup.userData = flData;
  chassis.userData = flData;
  scene.add(flGroup);
  interactiveObjects.push(chassis);

  const forkliftObj = {
    group: flGroup,
    liftGroup,
    initialY: 0.22,
    id,
    isActiveCycle: !!options.isActiveCycle,
    initialPos: { x, y, z, rotY },
    beaconMesh: beaconDome,
    beaconLight,
    carriedPallet: cargoPalletOnFork,
  };

  if (options.isActiveCycle) {
    activeForklift = forkliftObj;
    activeForkliftInitialPos = { x, y, z, rotY };
  } else {
    animatedForklifts.push(forkliftObj);
  }

  return forkliftObj;
}

// Helper: Tạo pallet hàng gắn trên càng nâng
function createForkliftPalletCargo(labelType = 'components') {
  const pGroup = new THREE.Group();
  pGroup.position.set(0.68, 0.08, 0);

  const woodMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.85 });
  const boxMat = new THREE.MeshStandardMaterial({
    color: labelType === 'ebikes' ? 0x0284c7 : 0xd97706,
    roughness: 0.65,
  });

  // Pallet gỗ
  const pallet = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.12, 1.05), woodMat);
  pallet.position.y = 0.06;
  pallet.castShadow = true;
  pGroup.add(pallet);

  // Thùng kiện hàng
  const box = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.72, 0.95), boxMat);
  box.position.y = 0.48;
  box.castShadow = true;
  pGroup.add(box);

  // Tem nhãn DK BIKE
  const tagMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
  const tag1 = new THREE.Mesh(new THREE.PlaneGeometry(0.45, 0.22), tagMat);
  tag1.position.set(0, 0.52, 0.48);
  pGroup.add(tag1);

  return pGroup;
}

// 2. Tạo xe tải thùng 5 tấn DK Logistics hoàn chỉnh (5-Ton Box Truck with Opening Doors)
function create5TonLogisticsTruck(colorHex = 0x0284c7, name = 'Xe tải logistics 5 tấn DK Bike (5T)') {
  const truckGroup = new THREE.Group();

  // Materials
  const cabColorMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.35, metalness: 0.2 });
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 });
  const darkChassisMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 });
  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.15, metalness: 0.9 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1, metalness: 0.9 });
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.95 });
  const redBrakeMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, emissive: 0x991b1b, emissiveIntensity: 0.5 });
  const amberTurnMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xd97706, emissiveIntensity: 0.6 });

  // A. Chassis sắt xi dầm thép chữ U (Chassis Rails)
  const chassisFrame = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.28, 7.2), darkChassisMat);
  chassisFrame.position.set(0, 0.85, -0.6);
  chassisFrame.castShadow = true;
  truckGroup.add(chassisFrame);

  // Bình nhiên liệu và bình ắc quy bên hông
  const fuelTank = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 1.25, 12), chromeMat);
  fuelTank.rotation.z = Math.PI / 2;
  fuelTank.position.set(1.08, 0.72, -1.2);
  truckGroup.add(fuelTank);

  const batteryBox = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.45, 0.85), darkChassisMat);
  batteryBox.position.set(-1.08, 0.72, -1.2);
  truckGroup.add(batteryBox);

  // Thanh chắn chống va quẹt hông (Side Underrun Guards)
  [-1.15, 1.15].forEach((sx) => {
    const sideRail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 2.6), whiteMat);
    sideRail.position.set(sx, 0.55, -1.2);
    truckGroup.add(sideRail);
  });

  // B. Cabin xe tải hiện đại (Forward-Control Truck Cabin)
  const cabGroup = new THREE.Group();
  cabGroup.position.set(0, 1.9, 1.9);

  // Khối thân cabin
  const cabBody = new THREE.Mesh(new THREE.BoxGeometry(2.35, 1.95, 2.05), cabColorMat);
  cabBody.position.set(0, 0, 0);
  cabBody.castShadow = true;
  cabGroup.add(cabBody);

  // Kính chắn gió cong phía trước
  const windshield = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.95, 0.12), glassMat);
  windshield.position.set(0, 0.38, 1.02);
  cabGroup.add(windshield);

  // Kính cửa sổ hai bên
  [-1.18, 1.18].forEach((wx) => {
    const sideWin = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.72, 0.85), glassMat);
    sideWin.position.set(wx, 0.38, 0.1);
    cabGroup.add(sideWin);
  });

  // Cản trước và lưới tản nhiệt chrome
  const frontBumper = new THREE.Mesh(new THREE.BoxGeometry(2.45, 0.5, 0.35), darkChassisMat);
  frontBumper.position.set(0, -0.85, 1.12);
  frontBumper.castShadow = true;
  cabGroup.add(frontBumper);

  const grille = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.45, 0.08), chromeMat);
  grille.position.set(0, -0.32, 1.05);
  cabGroup.add(grille);

  // Biểu tượng mạ chrome DK ở mũi xe
  const dkEmblem = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.06, 12), chromeMat);
  dkEmblem.rotation.x = Math.PI / 2;
  dkEmblem.position.set(0, -0.22, 1.1);
  cabGroup.add(dkEmblem);

  // Cụm đèn pha LED halogen & Đèn gầm
  [-0.92, 0.92].forEach((hx) => {
    const headlight = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.22, 0.1),
      new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfef08a, emissiveIntensity: 0.9 })
    );
    headlight.position.set(hx, -0.75, 1.25);
    cabGroup.add(headlight);
  });

  // Gương chiếu hậu đôi hai bên
  [-1.35, 1.35].forEach((mx) => {
    const mirrorBracket = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.04, 0.04), darkChassisMat);
    mirrorBracket.position.set(mx > 0 ? 1.25 : -1.25, 0.45, 0.75);
    cabGroup.add(mirrorBracket);

    const mirror = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.45, 0.2), darkChassisMat);
    mirror.position.set(mx, 0.45, 0.75);
    cabGroup.add(mirror);
  });

  // Mui lướt gió khí động học trên nóc (Roof Air Deflector)
  const roofSpoiler = new THREE.Mesh(new THREE.BoxGeometry(2.32, 0.65, 1.55), whiteMat);
  roofSpoiler.position.set(0, 1.25, -0.15);
  roofSpoiler.rotation.x = -Math.PI / 10;
  roofSpoiler.castShadow = true;
  cabGroup.add(roofSpoiler);

  // Biển hiệu "DK BIKE LOGISTICS" trên mui gió
  const spoilerSign = new THREE.Mesh(
    new THREE.PlaneGeometry(1.8, 0.32),
    new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3 })
  );
  spoilerSign.rotation.x = -Math.PI / 10;
  spoilerSign.position.set(0, 1.28, 0.58);
  cabGroup.add(spoilerSign);

  truckGroup.add(cabGroup);

  // C. Thùng tải hàng cách nhiệt composite (Insulated Cargo Box)
  const cargoBoxGroup = new THREE.Group();
  cargoBoxGroup.position.set(0, 2.3, -1.55);

  const cargoBox = new THREE.Mesh(new THREE.BoxGeometry(2.42, 2.35, 4.95), whiteMat);
  cargoBox.position.set(0, 0, 0);
  cargoBox.castShadow = true;
  cargoBoxGroup.add(cargoBox);

  // Viền nhôm bo góc thùng
  const trimMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.3 });
  const topTrim = new THREE.Mesh(new THREE.BoxGeometry(2.46, 0.08, 5.0), trimMat);
  topTrim.position.set(0, 1.18, 0);
  cargoBoxGroup.add(topTrim);

  // Dải phản quang an toàn đỏ-trắng chân thùng
  [-1.22, 1.22].forEach((sx) => {
    const reflexStrip = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.12, 4.8),
      new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0x991b1b, emissiveIntensity: 0.4 })
    );
    reflexStrip.position.set(sx, -1.05, 0);
    cargoBoxGroup.add(reflexStrip);

    // Decal thương hiệu DK Bike bên hông thùng
    const decal = new THREE.Mesh(
      new THREE.PlaneGeometry(3.6, 1.1),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3 })
    );
    decal.rotation.y = sx > 0 ? Math.PI / 2 : -Math.PI / 2;
    decal.position.set(sx > 0 ? 1.225 : -1.225, 0.15, 0);
    cargoBoxGroup.add(decal);
  });

  // D. Cửa thùng phía sau mở được (Opening Rear Cargo Doors with Hinges)
  // Bản lề cửa trái (xoay quanh trục Y mép ngoài x = -1.18)
  const doorPivotLeft = new THREE.Group();
  doorPivotLeft.position.set(-1.18, 0, -2.48);

  const doorLeafL = new THREE.Mesh(new THREE.BoxGeometry(1.16, 2.26, 0.07), whiteMat);
  doorLeafL.position.set(0.58, 0, 0);
  doorLeafL.castShadow = true;
  doorPivotLeft.add(doorLeafL);

  // Thanh khóa cửa mạ kẽm (Cam lock rod)
  const lockRodL = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 2.2, 6), chromeMat);
  lockRodL.position.set(0.95, 0, 0.05);
  doorPivotLeft.add(lockRodL);

  cargoBoxGroup.add(doorPivotLeft);

  // Bản lề cửa phải (xoay quanh trục Y mép ngoài x = 1.18)
  const doorPivotRight = new THREE.Group();
  doorPivotRight.position.set(1.18, 0, -2.48);

  const doorLeafR = new THREE.Mesh(new THREE.BoxGeometry(1.16, 2.26, 0.07), whiteMat);
  doorLeafR.position.set(-0.58, 0, 0);
  doorLeafR.castShadow = true;
  doorPivotRight.add(doorLeafR);

  const lockRodR = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 2.2, 6), chromeMat);
  lockRodR.position.set(-0.95, 0, 0.05);
  doorPivotRight.add(lockRodR);

  cargoBoxGroup.add(doorPivotRight);

  // E. Pallet kiện hàng trên sàn thùng xe (Truck Bed Cargo Pallet)
  const truckPalletSlot = new THREE.Group();
  truckPalletSlot.position.set(0, -1.02, -1.2);
  cargoBoxGroup.add(truckPalletSlot);

  truckGroup.add(cargoBoxGroup);

  // F. Bánh xe: 1 trục trước dẫn hướng & 2 trục sau chịu tải kép (Dual-Tire Rear Axles)
  const frontWheels = [];

  // 2 bánh trước
  [-1.05, 1.05].forEach((wx) => {
    const fwGroup = new THREE.Group();
    fwGroup.position.set(wx, 0.48, 1.9);
    const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.32, 16), tireMat);
    tire.rotation.z = Math.PI / 2;
    tire.castShadow = true;
    fwGroup.add(tire);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.33, 8), darkChassisMat);
    hub.rotation.z = Math.PI / 2;
    fwGroup.add(hub);
    truckGroup.add(fwGroup);
    frontWheels.push(fwGroup);
  });

  // 4 cụm bánh kép phía sau (8 lốp)
  [-1.0, -2.3].forEach((axleZ) => {
    [-1.05, 1.05].forEach((wx) => {
      const dualWheel = new THREE.Group();
      dualWheel.position.set(wx, 0.48, axleZ);

      // 2 lốp áp sát nhau
      [-0.12, 0.12].forEach((offset) => {
        const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.22, 16), tireMat);
        tire.rotation.z = Math.PI / 2;
        tire.position.x = offset;
        tire.castShadow = true;
        dualWheel.add(tire);
      });

      truckGroup.add(dualWheel);
    });
  });

  // Chắn bùn sau có chữ DK BIKE
  [-1.15, 1.15].forEach((fx) => {
    const mudFlap = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.42, 0.38), darkChassisMat);
    mudFlap.position.set(fx, 0.45, -3.8);
    truckGroup.add(mudFlap);
  });

  // Đèn hậu & đèn lùi
  [-0.95, 0.95].forEach((rx) => {
    const tailLight = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.14, 0.08), redBrakeMat);
    tailLight.position.set(rx, 0.65, -4.18);
    truckGroup.add(tailLight);
  });

  // Headlight spot for night
  const headSpotL = new THREE.SpotLight(0xffedd5, 0, 35, Math.PI / 5, 0.3, 1.5);
  headSpotL.position.set(-0.8, 1.1, 3.2);
  headSpotL.target.position.set(-0.8, 0, 20);
  truckGroup.add(headSpotL);
  truckGroup.add(headSpotL.target);

  const headSpotR = headSpotL.clone();
  headSpotR.position.x = 0.8;
  headSpotR.target.position.x = 0.8;
  truckGroup.add(headSpotR);
  truckGroup.add(headSpotR.target);
  logisticsTruckLights.push(headSpotL, headSpotR);

  // Metadata tương tác
  const truckData = {
    id: 'logisticsTruck5T',
    title: name,
    type: 'truck',
    desc: 'Xe tải thùng 5 tấn DK Bike Logistics chuyên dụng chuyên chở phụ tùng động cơ, pin lithium và giao xe điện thành phẩm xuất xưởng.',
    zone: 'DK1',
  };
  truckGroup.userData = truckData;
  cabBody.userData = truckData;
  interactiveObjects.push(cabBody);

  return {
    truckGroup,
    doorPivotLeft,
    doorPivotRight,
    truckPalletSlot,
    frontWheels,
    headSpotL,
    headSpotR,
  };
}

// 3. Tạo xe đầu kéo container 40ft DK Logistics (40ft Heavy Tractor Container Truck)
function create40ftContainerTruck(x, y, z, rotY, id, name) {
  const cGroup = new THREE.Group();
  cGroup.position.set(x, y, z);
  cGroup.rotation.y = rotY;

  const cabMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.35, metalness: 0.2 }); // Đầu kéo đỏ mạnh mẽ
  const trailerMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 });
  const containerMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.5, metalness: 0.1 }); // Container xanh dương DK
  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.15, metalness: 0.9 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.95 });

  // A. Đầu kéo Heavy-Duty 6x4 Prime Mover Tractor
  const cabTractor = new THREE.Group();
  cabTractor.position.set(0, 0, 4.2);

  // Khung cabin đầu kéo cao
  const mainCab = new THREE.Mesh(new THREE.BoxGeometry(2.5, 2.7, 2.6), cabMat);
  mainCab.position.set(0, 2.3, 0);
  mainCab.castShadow = true;
  cabTractor.add(mainCab);

  // Kính chắn gió
  const windshield = new THREE.Mesh(
    new THREE.BoxGeometry(2.35, 1.05, 0.1),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1, metalness: 0.9 })
  );
  windshield.position.set(0, 2.65, 1.31);
  cabTractor.add(windshield);

  // Mũi xe tản nhiệt chrome cỡ lớn
  const frontGrille = new THREE.Mesh(new THREE.BoxGeometry(1.9, 1.25, 0.12), chromeMat);
  frontGrille.position.set(0, 1.5, 1.32);
  cabTractor.add(frontGrille);

  // Ống xả thẳng đứng mạ chrome kiểu Mỹ
  const exhaustPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 3.2, 8), chromeMat);
  exhaustPipe.position.set(1.22, 3.0, -1.1);
  cabTractor.add(exhaustPipe);

  // Bánh xe đầu kéo (2 trước + 4 bánh kép sau)
  [-1.1, 1.1].forEach((wx) => {
    const fw = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.35, 16), darkMat);
    fw.rotation.z = Math.PI / 2;
    fw.position.set(wx, 0.52, 1.0);
    cabTractor.add(fw);
  });

  [-0.6, -1.8].forEach((axZ) => {
    [-1.1, 1.1].forEach((wx) => {
      const rw = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.42, 16), darkMat);
      rw.rotation.z = Math.PI / 2;
      rw.position.set(wx, 0.52, axZ);
      cabTractor.add(rw);
    });
  });

  cGroup.add(cabTractor);

  // B. Rơ-moóc xương 40ft (40ft Skeletal Semi-Trailer)
  const trailerGroup = new THREE.Group();
  trailerGroup.position.set(0, 1.2, -2.6);

  const chassisBeam = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.28, 12.4), trailerMat);
  chassisBeam.position.set(0, 0, 0);
  chassisBeam.castShadow = true;
  trailerGroup.add(chassisBeam);

  // Chân chống rơ-moóc (Landing Gear Legs)
  [-0.95, 0.95].forEach((lx) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.1, 0.12), trailerMat);
    leg.position.set(lx, -0.65, 3.2);
    trailerGroup.add(leg);
  });

  // 3 trục bánh rơ-moóc (Triple Trailer Axles)
  [-3.8, -4.9, -6.0].forEach((tz) => {
    [-1.1, 1.1].forEach((tx) => {
      const tw = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.4, 16), darkMat);
      tw.rotation.z = Math.PI / 2;
      tw.position.set(tx, -0.68, tz);
      tw.castShadow = true;
      trailerGroup.add(tw);
    });
  });

  // C. Vỏ Container 40ft High Cube (40-Foot ISO Shipping Container)
  const container = new THREE.Mesh(new THREE.BoxGeometry(2.44, 2.65, 12.2), containerMat);
  container.position.set(0, 1.48, 0);
  container.castShadow = true;
  trailerGroup.add(container);

  // Gân sóng tôn dập nổi hai bên hông container
  for (let rz = -5.8; rz <= 5.8; rz += 0.42) {
    [-1.24, 1.24].forEach((rx) => {
      const rib = new THREE.Mesh(new THREE.BoxGeometry(0.04, 2.5, 0.14), containerMat);
      rib.position.set(rx, 1.48, rz);
      trailerGroup.add(rib);
    });
  }

  // Dải chữ thương hiệu DK BIKE GLOBAL LOGISTICS trên container
  const bannerMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
  [-1.25, 1.25].forEach((bx) => {
    const banner = new THREE.Mesh(new THREE.PlaneGeometry(8.5, 0.85), bannerMat);
    banner.rotation.y = bx > 0 ? Math.PI / 2 : -Math.PI / 2;
    banner.position.set(bx, 1.9, 0);
    trailerGroup.add(banner);

    const bannerText = new THREE.Mesh(
      new THREE.PlaneGeometry(7.8, 0.55),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3 })
    );
    bannerText.rotation.y = bx > 0 ? Math.PI / 2 : -Math.PI / 2;
    bannerText.position.set(bx > 0 ? bx + 0.01 : bx - 0.01, 1.9, 0);
    trailerGroup.add(bannerText);
  });

  // Cửa đôi sau container có 4 thanh khóa
  [-0.6, -0.2, 0.2, 0.6].forEach((kx) => {
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 2.5, 6), chromeMat);
    rod.position.set(kx, 1.48, -6.13);
    trailerGroup.add(rod);
  });

  cGroup.add(trailerGroup);

  // Metadata
  const contData = {
    id,
    title: name,
    type: 'containerTruck',
    desc: 'Xe đầu kéo container 40 feet chuyên phục vụ vận chuyển linh kiện nhập khẩu CKD/SKD và xuất khẩu nguyên container thành phẩm DK Bike ra cảng Hải Phòng.',
    zone: 'DK1',
  };
  cGroup.userData = contData;
  mainCab.userData = contData;
  scene.add(cGroup);
  interactiveObjects.push(mainCab);

  return cGroup;
}

// 4. Tạo xe tải nhỏ 1.5 tấn giao hàng nhanh (1.5-Ton Light Delivery Truck)
function create1Point5TonDeliveryTruck(x, y, z, rotY, id, name) {
  const dGroup = new THREE.Group();
  dGroup.position.set(x, y, z);
  dGroup.rotation.y = rotY;

  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.35 });
  const blueMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });

  // Cabin nhỏ kiểu Kia Bongo / Hyundai Porter
  const cab = new THREE.Mesh(new THREE.BoxGeometry(1.85, 1.65, 1.55), whiteMat);
  cab.position.set(0, 1.35, 1.25);
  cab.castShadow = true;
  dGroup.add(cab);

  // Kính lái
  const windshield = new THREE.Mesh(
    new THREE.BoxGeometry(1.7, 0.75, 0.08),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1 })
  );
  windshield.position.set(0, 1.55, 2.03);
  dGroup.add(windshield);

  // Thùng hàng phía sau
  const box = new THREE.Mesh(new THREE.BoxGeometry(1.9, 1.85, 3.2), blueMat);
  box.position.set(0, 1.6, -1.05);
  box.castShadow = true;
  dGroup.add(box);

  // Logo DK Express trên thùng
  [-0.96, 0.96].forEach((bx) => {
    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(2.4, 0.65),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 })
    );
    sign.rotation.y = bx > 0 ? Math.PI / 2 : -Math.PI / 2;
    sign.position.set(bx, 1.65, -1.05);
    dGroup.add(sign);
  });

  // Bánh xe (4 bánh đơn)
  const wheelGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.24, 12);
  const wPositions = [
    [-0.85, 0.38, 1.25],
    [0.85, 0.38, 1.25],
    [-0.85, 0.38, -1.6],
    [0.85, 0.38, -1.6],
  ];
  wPositions.forEach((pos) => {
    const w = new THREE.Mesh(wheelGeo, darkMat);
    w.rotation.z = Math.PI / 2;
    w.position.set(...pos);
    w.castShadow = true;
    dGroup.add(w);
  });

  const truckData = {
    id,
    title: name,
    type: 'lightTruck',
    desc: 'Xe tải giao hàng nhanh 1.5 tấn phục vụ chuyển phát phụ tùng khẩn cấp và giao xe cho các đại lý khu vực lân cận.',
    zone: 'DK2',
  };
  dGroup.userData = truckData;
  cab.userData = truckData;
  scene.add(dGroup);
  interactiveObjects.push(cab);

  return dGroup;
}

// 5. Tạo xe đẩy pallet thủ công có người kéo (Hand Pallet Jack & Operator)
function createHandPalletJack(x, y, z, rotY, id, name) {
  const pjGroup = new THREE.Group();
  pjGroup.position.set(x, y, z);
  pjGroup.rotation.y = rotY;

  const redMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.35, metalness: 0.2 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 });

  // Thân máy bơm thủy lực
  const pump = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.42, 8), darkMat);
  pump.position.set(0, 0.32, 0);
  pjGroup.add(pump);

  // Cần đẩy chữ T nghiêng
  const tiller = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.95, 6), redMat);
  tiller.rotation.x = -Math.PI / 5;
  tiller.position.set(0, 0.75, 0.32);
  pjGroup.add(tiller);

  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.38, 6), darkMat);
  handle.rotation.z = Math.PI / 2;
  handle.position.set(0, 1.15, 0.58);
  pjGroup.add(handle);

  // Càng nâng thép đỏ
  [-0.22, 0.22].forEach((fx) => {
    const fork = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.06, 1.25), redMat);
    fork.position.set(fx, 0.12, -0.68);
    pjGroup.add(fork);
  });

  // Pallet hàng và thùng phụ tùng trên xe đẩy
  const pallet = new THREE.Mesh(
    new THREE.BoxGeometry(0.95, 0.1, 1.1),
    new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.85 })
  );
  pallet.position.set(0, 0.2, -0.68);
  pjGroup.add(pallet);

  const crate = new THREE.Mesh(
    new THREE.BoxGeometry(0.85, 0.55, 0.9),
    new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.65 })
  );
  crate.position.set(0, 0.52, -0.68);
  crate.castShadow = true;
  pjGroup.add(crate);

  // Nhân viên kho cầm tay lái xe kéo
  const worker = createCharacter({
    shirtColor: 0xea580c,
    pantsColor: 0x1e293b,
    hatColor: 0xfacc15,
  });
  worker.position.set(0, 0, 0.95);
  worker.rotation.y = Math.PI;
  pjGroup.add(worker);

  const pjData = {
    id,
    title: name,
    type: 'palletJack',
    desc: 'Xe nâng tay thủy lực 2.5 tấn phục vụ di chuyển linh kiện nội bộ giữa dây chuyền lắp ráp và cửa xuất hàng.',
    zone: 'DK1',
  };
  pjGroup.userData = pjData;
  crate.userData = pjData;
  scene.add(pjGroup);
  interactiveObjects.push(crate);

  return pjGroup;
}

// 6. Tạo đoàn xe kéo nhỏ chở hàng nội bộ (Electric Tugger Cart Train)
function createTuggerCartTrain(x, y, z, rotY, id, name) {
  const trainGroup = new THREE.Group();
  trainGroup.position.set(x, y, z);
  trainGroup.rotation.y = rotY;

  const yellowMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.35 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });

  // Xe đầu kéo điện 3 bánh
  const tugger = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.65, 1.8), yellowMat);
  body.position.set(0, 0.45, 0);
  tugger.add(body);

  const driver = createCharacter({ shirtColor: 0x0284c7, pantsColor: 0x1e293b, hatColor: 0x0284c7, isDriver: true });
  driver.position.set(0, 0.45, -0.2);
  tugger.add(driver);
  trainGroup.add(tugger);

  // 2 Rơ-moóc sàn phẳng chở thùng pin
  [-2.4, -4.6].forEach((cz) => {
    const cart = new THREE.Group();
    cart.position.set(0, 0, cz);

    const platform = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.12, 1.8), darkMat);
    platform.position.y = 0.28;
    cart.add(platform);

    // Thùng pin lithium và động cơ
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 0.5, 1.5),
      new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.6 })
    );
    box.position.set(0, 0.6, 0);
    cart.add(box);

    trainGroup.add(cart);
  });

  const trainData = {
    id,
    title: name,
    type: 'tuggerTrain',
    desc: 'Xe đầu kéo điện nội bộ vận chuyển các khay pin Lithium-ion và động cơ điện BLDC giữa kho tổng và xưởng sản xuất.',
    zone: 'DK2',
  };
  trainGroup.userData = trainData;
  body.userData = trainData;
  scene.add(trainGroup);
  interactiveObjects.push(body);

  return trainGroup;
}

// 7. Tạo giá đỡ khung xe máy điện chưa lắp ráp (CKD/SKD Bike Frames Cantilever Rack)
function createUnassembledFrameRack(x, y, z, rotY, id, name) {
  const rackGroup = new THREE.Group();
  rackGroup.position.set(x, y, z);
  rackGroup.rotation.y = rotY;

  const orangeMat = new THREE.MeshStandardMaterial({ color: 0xea580c, roughness: 0.4 }); // Cột kệ cam công nghiệp
  const blueMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.5 }); // Tay đỡ kệ xanh
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.45, metalness: 0.6 }); // Khung xe sơn tĩnh điện đen mờ

  // 3 Cột thép chịu lực
  [-1.4, 0, 1.4].forEach((cx) => {
    const col = new THREE.Mesh(new THREE.BoxGeometry(0.14, 2.6, 0.14), orangeMat);
    col.position.set(cx, 1.3, 0);
    rackGroup.add(col);

    // Chân đế chữ I
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.15, 1.4), orangeMat);
    base.position.set(cx, 0.08, 0);
    rackGroup.add(base);

    // 3 Tầng tay đỡ tay vươn (Cantilever Arms)
    [0.75, 1.45, 2.15].forEach((ay) => {
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 1.2), blueMat);
      arm.position.set(cx, ay, 0);
      rackGroup.add(arm);
    });
  });

  // Các khung xe máy điện hàn thô (CKD Chassis Tubes) xếp ngay ngắn trên các tầng
  [0.85, 1.55, 2.25].forEach((fy) => {
    [-0.9, 0.5].forEach((fx) => {
      const bikeFrame = new THREE.Group();
      bikeFrame.position.set(fx, fy, 0);

      // Cổ phốt & Dóng nghiêng chính
      const spine = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.95, 8), frameMat);
      spine.rotation.x = Math.PI / 4;
      bikeFrame.add(spine);

      // Khung đuôi gắp xe
      const rearSubframe = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.05, 0.65), frameMat);
      rearSubframe.position.set(0, -0.15, -0.32);
      bikeFrame.add(rearSubframe);

      rackGroup.add(bikeFrame);
    });
  });

  const rackData = {
    id,
    title: name,
    type: 'frameRack',
    desc: 'Kệ lưu trữ khung xe máy điện hàn sẵn (CKD/SKD) tiêu chuẩn chất lượng cao trước khi chuyển vào dây chuyền sơn tĩnh điện và lắp ráp.',
    zone: x > 0 ? 'DK1' : 'DK2',
  };
  rackGroup.userData = rackData;
  scene.add(rackGroup);

  return rackGroup;
}
`;

// Insert block9Helpers before buildLogisticsAndEquipment
if (!code.includes('createDetailedForklift')) {
  code = code.replace('function buildLogisticsAndEquipment() {', block9Helpers + '\nfunction buildLogisticsAndEquipment() {');
  console.log('Inserted Khối 9 3D helper functions.');
}

fs.writeFileSync(mainPath, code, 'utf8');
console.log('Step 2 (helpers) saved successfully.');
