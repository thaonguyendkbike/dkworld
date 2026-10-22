const fs = require('fs');
const path = require('path');

const mainJsPath = path.join(__dirname, '../src/main.js');
let raw = fs.readFileSync(mainJsPath, 'utf8');
const isCrlf = raw.includes('\r\n');
let code = raw.replace(/\r\n/g, '\n');

// 1. Fix Waypoint 26: Move outside of Nha B to Z = -80.0 on sidewalk
const oldWP26 = `{ id: 26, x: 72.0, y: 0, z: -70.0, neighbors: [25] },         // Sân kiểm định sau Xưởng B (ngoài trời)`;
const newWP26 = `{ id: 26, x: 78.0, y: 0, z: -80.0, neighbors: [25] },         // Vỉa hè ngoài trời sau Xưởng B (Z = -80.0, ngoài xưởng)`;

if (code.includes(oldWP26)) {
  code = code.replace(oldWP26, newWP26);
  console.log('Fixed Waypoint 26 to stay outside Nha B at Z = -80.0');
} else {
  console.log('Waypoint 26 already updated or not found');
}

// 2. Fix stagingBikes label position from inside Nha B (Z = -42) to actual test yard (Z = -30)
const oldStagingLabel = `{ text: '🏍️ Khu tập kết xe sau chạy thử', pos: new THREE.Vector3(68, 2.5, -42), id: 'stagingBikes' },`;
const newStagingLabel = `{ text: '🏍️ Khu tập kết xe sau chạy thử', pos: new THREE.Vector3(67, 2.5, -30), id: 'stagingBikes' },`;

if (code.includes(oldStagingLabel)) {
  code = code.replace(oldStagingLabel, newStagingLabel);
  console.log('Fixed stagingBikes label position to outdoor test yard (Z = -30.0)');
} else {
  console.log('stagingBikes label already updated or not found');
}

// 3. Fix setupAnimatedVehicles:
const oldSetupVehicles = `  // 1. Xe máy điện DK Roma SX Đỏ chạy thử nghiệm trên Test Track (KCS Tester)
  animatedBike = createDKRomaSX(0xdc2626, 'DK Roma SX Chạy Thử KCS', {
    withRider: true,
    riderShirt: 0x0284c7,
    helmetColor: 0xfacc15,
  });
  animatedBike.position.set(65, 0.05, -31);
  animatedBike.rotation.y = 0;
  scene.add(animatedBike);

  // 2. Xe máy điện DK Gogo Xanh Dương chạy tuần tra đại lộ nội bộ DK1
  const cruiserBike = createDKGogo(0x0284c7, 'DK Gogo Tuần Tra', {
    withRider: true,
    riderShirt: 0xea580c,
    helmetColor: 0x0284c7,
  });
  cruiserBike.position.set(74, 0.05, -18);
  cruiserBike.rotation.y = Math.atan2(4, -19);
  scene.add(cruiserBike);

  // 3. Xe đạp điện thể thao DK E-Bike chạy dọc lối dạo ven sông & đường sắt
  const eBike = createDKElectricBicycle(0xf8fafc, 'DK E-Bike Sport Sinh Thái', { withRider: true });
  eBike.position.set(82, 0.05, -15);
  eBike.rotation.y = -Math.PI / 2;
  scene.add(eBike);

  // 4. Xe điện 3 bánh chở hàng luân chuyển phụ tùng giữa Nhà C và Xưởng B
  const cargoHauler = createDKThreeWheelerCargo(0x10b981, 'Xe 3 bánh Logistics DK1');
  cargoHauler.position.set(48, 0.05, -50);
  cargoHauler.rotation.y = 0;
  scene.add(cargoHauler);

  // Lưu vào danh sách quản lý hoạt cảnh phương tiện Khối 8
  animatedVehicles = [
    {
      type: 'testTrackBike',
      mesh: animatedBike,
      angle: 0,
      speed: 0.38,
      centerX: 65,
      centerZ: -55,
      radiusX: 13,
      radiusZ: 24.5,
    },
    {
      type: 'waypointCruiser',
      mesh: cruiserBike,
      progress: 0,
      speed: 8.5, // 8.5 m/s (~30 km/h)
      path: [
        { x: 74, z: -18 },
        { x: 55, z: -22 },
        { x: 38, z: -22 },
        { x: 26, z: -18 },
        { x: 26, z: -8 },
        { x: 37, z: -6.5 },
        { x: 55, z: -8 },
        { x: 72, z: -14 },
      ],
    },
    {
      type: 'eBikePerimeter',
      mesh: eBike,
      progress: 0,
      speed: 4.8,
      minZ: -62,
      maxZ: -5,
      dir: 1,
      x: 80,
    },
    {
      type: 'cargoHauler',
      mesh: cargoHauler,
      progress: 0,
      speed: 3.2,
      minX: 46,
      maxX: 59,
      dir: 1,
      z: -48,
    },`;

const newSetupVehicles = `  // 1. Xe máy điện DK Roma SX Đỏ chạy thử nghiệm trên Test Track (KCS Tester chạy dọc đường thử riêng phía Đông & Bắc)
  animatedBike = createDKRomaSX(0xdc2626, 'DK Roma SX Chạy Thử KCS', {
    withRider: true,
    riderShirt: 0x0284c7,
    helmetColor: 0xfacc15,
  });
  animatedBike.position.set(79.5, 0.05, -28.0);
  animatedBike.rotation.y = Math.PI / 2;
  scene.add(animatedBike);

  // 2. Xe máy điện DK Gogo Xanh Dương chạy tuần tra đại lộ nội bộ DK1
  const cruiserBike = createDKGogo(0x0284c7, 'DK Gogo Tuần Tra', {
    withRider: true,
    riderShirt: 0xea580c,
    helmetColor: 0x0284c7,
  });
  cruiserBike.position.set(74, 0.05, -18);
  cruiserBike.rotation.y = Math.atan2(4, -19);
  scene.add(cruiserBike);

  // 3. Xe đạp điện thể thao DK E-Bike chạy dọc lối dạo ven sông & đường sắt
  const eBike = createDKElectricBicycle(0xf8fafc, 'DK E-Bike Sport Sinh Thái', { withRider: true });
  eBike.position.set(82, 0.05, -15);
  eBike.rotation.y = -Math.PI / 2;
  scene.add(eBike);

  // 4. Xe điện 3 bánh chở hàng luân chuyển phụ tùng (chạy trên đường nhựa nội bộ Z = -26.5 phía trước Nhà A & Xưởng B)
  const cargoHauler = createDKThreeWheelerCargo(0x10b981, 'Xe 3 bánh Logistics DK1');
  cargoHauler.position.set(35.0, 0.05, -26.5);
  cargoHauler.rotation.y = 0;
  scene.add(cargoHauler);

  // Tuyến đường chạy thử khép kín dọc theo Test Track phía Đông & quay đầu ở sân Bắc / sân Nam (100% ngoài trời, cách tường xưởng B > 1.95m)
  const testTrackPts = [
    new THREE.Vector3(79.5, 0.05, -28.0),
    new THREE.Vector3(79.5, 0.05, -45.0),
    new THREE.Vector3(79.5, 0.05, -62.0),
    new THREE.Vector3(79.5, 0.05, -75.0),
    new THREE.Vector3(79.2, 0.05, -78.5),
    new THREE.Vector3(78.5, 0.05, -80.0),
    new THREE.Vector3(77.0, 0.05, -80.5),
    new THREE.Vector3(74.0, 0.05, -80.5),
    new THREE.Vector3(71.0, 0.05, -80.2),
    new THREE.Vector3(69.0, 0.05, -79.5),
    new THREE.Vector3(71.0, 0.05, -78.8),
    new THREE.Vector3(74.0, 0.05, -78.8),
    new THREE.Vector3(77.0, 0.05, -79.2),
    new THREE.Vector3(78.2, 0.05, -78.2),
    new THREE.Vector3(78.2, 0.05, -74.0),
    new THREE.Vector3(78.2, 0.05, -62.0),
    new THREE.Vector3(78.2, 0.05, -45.0),
    new THREE.Vector3(78.2, 0.05, -30.0),
    new THREE.Vector3(77.5, 0.05, -27.5),
    new THREE.Vector3(76.5, 0.05, -26.0),
    new THREE.Vector3(78.0, 0.05, -25.5),
    new THREE.Vector3(79.5, 0.05, -26.5),
  ];
  const testTrackCurve = new THREE.CatmullRomCurve3(testTrackPts, true, 'centripetal', 0.2);

  // Lưu vào danh sách quản lý hoạt cảnh phương tiện Khối 8
  animatedVehicles = [
    {
      type: 'testTrackBike',
      mesh: animatedBike,
      curve: testTrackCurve,
      progress: 0,
      speed: 12.0, // 12 m/s (~43 km/h tốc độ thử nghiệm KCS)
      curveLen: testTrackCurve.getLength(),
    },
    {
      type: 'waypointCruiser',
      mesh: cruiserBike,
      progress: 0,
      speed: 8.5, // 8.5 m/s (~30 km/h)
      path: [
        { x: 74, z: -18 },
        { x: 55, z: -22 },
        { x: 38, z: -22 },
        { x: 26, z: -18 },
        { x: 26, z: -8 },
        { x: 37, z: -6.5 },
        { x: 55, z: -8 },
        { x: 72, z: -14 },
      ],
    },
    {
      type: 'eBikePerimeter',
      mesh: eBike,
      progress: 0,
      speed: 4.8,
      minZ: -62,
      maxZ: -5,
      dir: 1,
      x: 80,
    },
    {
      type: 'cargoHauler',
      mesh: cargoHauler,
      progress: 0,
      speed: 3.5,
      minX: 28.0, // Trước sảnh & trạm sạc Nhà A
      maxX: 53.0, // Đầu làn bốc hàng trước Xưởng B (không đâm vào tường Nhà B X=53.75 hay đuôi xe tải X=58)
      dir: 1,
      z: -26.5,  // Chạy trên mặt đường nhựa nội bộ rộng rãi, cách xa tường xưởng B > 6.7 mét
    },`;

if (code.includes(oldSetupVehicles)) {
  code = code.replace(oldSetupVehicles, newSetupVehicles);
  console.log('Successfully updated setupAnimatedVehicles with testTrackCurve and outdoor cargoHauler');
} else {
  console.error('Could not find oldSetupVehicles');
  process.exit(1);
}

// 4. Update updateAnimatedObjects logic for testTrackBike and cargoHauler
const oldUpdateBike = `    if (veh.type === 'testTrackBike') {
      veh.angle += delta * veh.speed;
      const t = veh.angle;
      const x = veh.centerX + Math.sin(t) * veh.radiusX;
      const z = veh.centerZ + Math.cos(t) * veh.radiusZ;
      veh.mesh.position.set(x, 0.05, z);

      const nextX = veh.centerX + Math.sin(t + 0.06) * veh.radiusX;
      const nextZ = veh.centerZ + Math.cos(t + 0.06) * veh.radiusZ;
      // Xe có trục tiến dọc theo +X trong toạ độ cục bộ, căn chỉnh đầu xe chuẩn theo vector vận tốc
      const heading = Math.atan2(-(nextZ - z), nextX - x);
      veh.mesh.rotation.y = heading;

      // Nghiêng xe tự nhiên vào cua theo trục tiến của xe (Roll axis is local X)
      veh.mesh.rotation.x = -0.14 - 0.04 * Math.sin(t) * Math.sin(t);
      veh.mesh.rotation.z = 0;

      // Quay bánh xe theo tốc độ di chuyển quanh trục Z của bánh xe
      if (veh.mesh.userData.frontWheel) veh.mesh.userData.frontWheel.rotation.z -= delta * 14;
      if (veh.mesh.userData.rearWheel) veh.mesh.userData.rearWheel.rotation.z -= delta * 14;`;

const newUpdateBike = `    if (veh.type === 'testTrackBike') {
      // Chạy dọc theo đường thử xe testTrackCurve bên ngoài Xưởng B (hoàn toàn ngoài trời, không đâm xuyên tường)
      const dist = (veh.speed || 12.0) * delta;
      veh.progress = (veh.progress + dist / (veh.curveLen || 129.5)) % 1.0;

      const pt = veh.curve.getPointAt(veh.progress);
      veh.mesh.position.set(pt.x, 0.05, pt.z);

      const tangent = veh.curve.getTangentAt(veh.progress);
      // Đầu xe (+X) quay theo tiếp tuyến vector chuyển động
      const heading = Math.atan2(-tangent.z, tangent.x);
      veh.mesh.rotation.y = heading;

      // Nghiêng xe tự nhiên khi vào các góc cua (Roll quanh trục X tiến của xe)
      const nextTangent = veh.curve.getTangentAt((veh.progress + 0.01) % 1.0);
      const lateralCurv = (tangent.x * nextTangent.z - tangent.z * nextTangent.x);
      const targetRoll = THREE.MathUtils.clamp(-lateralCurv * 45, -0.22, 0.22);
      veh.mesh.rotation.x = targetRoll;
      veh.mesh.rotation.z = 0;

      // Quay bánh xe theo tốc độ di chuyển
      if (veh.mesh.userData.frontWheel) veh.mesh.userData.frontWheel.rotation.z -= delta * 18;
      if (veh.mesh.userData.rearWheel) veh.mesh.userData.rearWheel.rotation.z -= delta * 18;`;

if (code.includes(oldUpdateBike)) {
  code = code.replace(oldUpdateBike, newUpdateBike);
  console.log('Successfully updated testTrackBike movement logic to follow curve');
} else {
  console.error('Could not find oldUpdateBike');
  process.exit(1);
}

// 5. Update cargoHauler update in updateAnimatedObjects
const oldCargoUpdate = `    } else if (veh.type === 'cargoHauler') {
      // Xe 3 bánh vận chuyển phụ tùng
      veh.mesh.position.x += veh.dir * veh.speed * delta;
      if (veh.mesh.position.x > veh.maxX) {
        veh.dir = -1;
        veh.mesh.rotation.y = Math.PI;
      } else if (veh.mesh.position.x < veh.minX) {
        veh.dir = 1;
        veh.mesh.rotation.y = 0;
      }
    }`;

const newCargoUpdate = `    } else if (veh.type === 'cargoHauler') {
      // Xe 3 bánh vận chuyển phụ tùng chạy trên đường nhựa nội bộ phía trước (Z = -26.5), không đâm vào tường xưởng B
      veh.mesh.position.x += veh.dir * veh.speed * delta;
      veh.mesh.position.z = veh.z || -26.5;
      if (veh.mesh.position.x > veh.maxX) {
        veh.mesh.position.x = veh.maxX;
        veh.dir = -1;
        veh.mesh.rotation.y = Math.PI;
      } else if (veh.mesh.position.x < veh.minX) {
        veh.mesh.position.x = veh.minX;
        veh.dir = 1;
        veh.mesh.rotation.y = 0;
      }
    }`;

if (code.includes(oldCargoUpdate)) {
  code = code.replace(oldCargoUpdate, newCargoUpdate);
  console.log('Successfully updated cargoHauler movement logic on front road');
} else {
  console.error('Could not find oldCargoUpdate');
  process.exit(1);
}

if (isCrlf) {
  code = code.replace(/\n/g, '\r\n');
}

fs.writeFileSync(mainJsPath, code, 'utf8');
console.log('Successfully wrote main.js with all fixes!');
