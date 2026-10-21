// scripts/apply_dk2_walking_trail.cjs
const fs = require('fs');
const path = require('path');

const mainPath = path.join(__dirname, '..', 'src', 'main.js');
const configPath = path.join(__dirname, '..', 'src', 'config.js');
let mainCode = fs.readFileSync(mainPath, 'utf8');

// 1. Update isForestExcludedZone
const wpStart = mainCode.indexOf('// Tuyến đường mòn sinh thái DK2 (Hành lang đi bộ không bị cây chắn');
if (wpStart !== -1) {
  const wpEnd = mainCode.indexOf('// Tuyến đường & Cổng mới kết nối ĐT234 sang Nhà A', wpStart);
  if (wpEnd !== -1) {
    const newExcludedZone = `// Tuyến đường mòn sinh thái DK2 (Hành lang đi bộ thông thoáng không bị cây che chắn)
  const trailWaypoints = [
    [-72, -22], [-75, -26], [-78, -31], [-82, -37], [-86, -44], [-90, -51],
    [-95, -59], [-98, -66], [-102, -74], [-106, -81], [-108, -84],
    [-112, -78], [-116, -73], [-121, -68], [-126, -63], [-131, -58], [-135, -52], [-140, -45],
    [-136, -44], [-142, -40], [-148, -37], [-154, -34], [-160, -30],
    [-133, -36], [-139, -32], [-146, -28], [-152, -25], [-158, -23]
  ];
  for (let i = 0; i < trailWaypoints.length; i++) {
    if (Math.hypot(x - trailWaypoints[i][0], z - trailWaypoints[i][1]) < 3.8) return true;
  }
  // Hành lang sườn đồi trước Ao Cá nối sang Đồi Hoa (khoảng nhìn thoáng ngắm toàn cảnh)
  if (x >= -138 && x <= -108 && z >= -72 && z <= -52) return true;
  // Sườn đồi hoa phía trước Đồi mới
  if (x >= -162 && x <= -132 && z >= -46 && z <= -20) return true;
  `;
    mainCode = mainCode.slice(0, wpStart) + newExcludedZone + mainCode.slice(wpEnd);
    console.log('1. Updated isForestExcludedZone successfully!');
  }
}

// 2. Update buildDK2EcoTrail
const startIdx = mainCode.indexOf('function buildDK2EcoTrail() {');
const endMarker = 'function buildVuonLanDK2() {';
const endIdx = mainCode.indexOf(endMarker);

if (startIdx !== -1 && endIdx !== -1) {
  const commentMarker = '// Tuyến đường đi bộ sinh thái DK2';
  const commentIdx = mainCode.lastIndexOf(commentMarker, startIdx);
  const replaceStart = commentIdx !== -1 ? mainCode.lastIndexOf('// =', commentIdx) : startIdx;

  const newFunctionCode = `// ============================================================================
// Tuyến đường đi bộ sinh thái DK2: Sân xe -> Vườn Lan -> Ao Cá -> Vườn Hoa Đồi Mới
// (Thiết kế bám sát tuyến vẽ thực địa: Bậc thang gỗ leo dốc, Lan can dây thừng, Đèn solar)
// ============================================================================
function buildDK2EcoTrail() {
  const trailGroup = new THREE.Group();
  trailGroup.userData = {
    id: 'ecoTrailDK2',
    title: 'Tuyến đường đi bộ sinh thái DK2',
    type: 'landscape',
    desc: 'Tuyến đường đi bộ uốn lượn ven sườn đồi kết nối liên hoàn: Từ bãi xe thành phẩm DK2 leo dốc qua rặng thông lên sảnh Vườn Lan, men theo chân kè Ao Cá đồi sinh thái, sang cung đường hoa đôi bậc thang và chuồng bồ câu Đồi mới. Tuyến đường được lát đá sa thạch sáng màu, có bậc thang gỗ chống trượt trên sườn dốc, lan can cọc gỗ xỏ dây thừng và chuỗi đèn solar ấm áp lung linh về đêm.',
    zone: 'DK2',
  };

  // Vật liệu chuyên dụng chất lượng cao
  const pathMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0, // Đá phiến xám sáng tự nhiên, nổi bật sắc nét trên thảm cỏ xanh
    roughness: 0.88,
    metalness: 0.05,
    flatShading: true,
  });

  const pathBorderMat = new THREE.MeshStandardMaterial({
    color: 0x64748b, // Viền gờ đá bảo vệ taluy
    roughness: 0.95,
    flatShading: true,
  });

  const timberStepMat = new THREE.MeshStandardMaterial({
    color: 0x5c3d2e, // Gỗ gụ chống trượt sẫm màu
    roughness: 0.9,
    flatShading: true,
  });

  const postMat = new THREE.MeshStandardMaterial({
    color: 0x78350f, // Cọc gỗ tròn tự nhiên
    roughness: 0.85,
  });

  const ropeMat = new THREE.MeshStandardMaterial({
    color: 0xd4a373, // Dây thừng gai vàng cát
    roughness: 0.95,
  });

  const solarLampMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.6,
  });

  const solarGlowMat = new THREE.MeshBasicMaterial({
    color: 0xfef08a, // Ánh sáng LED vàng ấm
  });

  // Helper: Tạo ribbon mặt đường uốn lượn theo địa hình 3D
  function createTrailStrip(points, width, isFlowerZone = false) {
    const curve = new THREE.CatmullRomCurve3(points);
    const length = curve.getLength();
    const divisions = Math.max(30, Math.floor(length * 1.6));
    const samplePts = curve.getPoints(divisions);

    const vertices = [];
    const uvs = [];
    const indices = [];

    for (let i = 0; i <= divisions; i++) {
      const pt = samplePts[i];
      let tan;
      if (i < divisions) {
        tan = samplePts[i + 1].clone().sub(pt).normalize();
      } else {
        tan = pt.clone().sub(samplePts[i - 1]).normalize();
      }
      const norm = new THREE.Vector3(-tan.z, 0, tan.x).normalize();

      const halfW = width / 2;
      const lx = pt.x + norm.x * halfW;
      const lz = pt.z + norm.z * halfW;
      const ly = getDK2HillSurfaceY(lx, lz) + 0.12;

      const rx = pt.x - norm.x * halfW;
      const rz = pt.z - norm.z * halfW;
      const ry = getDK2HillSurfaceY(rx, rz) + 0.12;

      // Đỉnh giữa tạo vồng nhẹ thoát nước
      const cx = pt.x;
      const cz = pt.z;
      const cy = getDK2HillSurfaceY(cx, cz) + 0.14;

      const baseIdx = i * 3;
      vertices.push(lx, ly, lz);
      vertices.push(cx, cy, cz);
      vertices.push(rx, ry, rz);

      const u = i / divisions;
      uvs.push(0, u, 0.5, u, 1, u);

      if (i < divisions) {
        const nextIdx = (i + 1) * 3;
        indices.push(baseIdx, baseIdx + 1, nextIdx);
        indices.push(baseIdx + 1, nextIdx + 1, nextIdx);
        indices.push(baseIdx + 1, baseIdx + 2, nextIdx + 1);
        indices.push(baseIdx + 2, nextIdx + 2, nextIdx + 1);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();

    const mesh = new THREE.Mesh(geo, pathMat);
    mesh.receiveShadow = true;
    mesh.userData = trailGroup.userData;
    trailGroup.add(mesh);
    interactiveObjects.push(mesh);

    // Gờ đá viền 2 bên
    const leftKerbPts = [];
    const rightKerbPts = [];
    for (let i = 0; i <= divisions; i += 2) {
      const pt = samplePts[i];
      let tan = (i < divisions ? samplePts[i + 1] : pt).clone().sub(i > 0 ? samplePts[i - 1] : pt).normalize();
      const norm = new THREE.Vector3(-tan.z, 0, tan.x).normalize();
      const halfW = width / 2;

      const lx = pt.x + norm.x * (halfW + 0.08);
      const lz = pt.z + norm.z * (halfW + 0.08);
      const ly = getDK2HillSurfaceY(lx, lz) + 0.14;
      leftKerbPts.push(new THREE.Vector3(lx, ly, lz));

      const rx = pt.x - norm.x * (halfW + 0.08);
      const rz = pt.z - norm.z * (halfW + 0.08);
      const ry = getDK2HillSurfaceY(rx, rz) + 0.14;
      rightKerbPts.push(new THREE.Vector3(rx, ry, rz));
    }

    if (leftKerbPts.length > 2) {
      const leftKerb = new THREE.Mesh(
        new THREE.TubeGeometry(new THREE.CatmullRomCurve3(leftKerbPts), Math.floor(divisions / 2), 0.08, 4, false),
        pathBorderMat
      );
      leftKerb.scale.set(1.0, 0.7, 1.0);
      trailGroup.add(leftKerb);
    }
    if (rightKerbPts.length > 2) {
      const rightKerb = new THREE.Mesh(
        new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rightKerbPts), Math.floor(divisions / 2), 0.08, 4, false),
        pathBorderMat
      );
      rightKerb.scale.set(1.0, 0.7, 1.0);
      trailGroup.add(rightKerb);
    }

    return { curve, samplePts, length };
  }

  // 1. Tuyến chính leo dốc từ bãi đỗ xe/chân kè đá lên Vườn Lan (Segment 1 - Mũi tên đỏ 1)
  const climbPoints = [
    new THREE.Vector3(-72.0, 0.05, -22.0),
    new THREE.Vector3(-77.0, 0.05, -30.0),
    new THREE.Vector3(-83.0, 0.10, -40.0),
    new THREE.Vector3(-89.0, 3.66, -50.0),
    new THREE.Vector3(-95.0, 8.74, -60.0),
    new THREE.Vector3(-100.0, 13.03, -70.0),
    new THREE.Vector3(-105.0, 16.06, -78.0),
    new THREE.Vector3(-108.0, 16.79, -84.0),
  ];
  const climbTrail = createTrailStrip(climbPoints, 2.0, false);

  // 2. Tuyến sườn đồi từ Vườn Lan qua chân kè Ao Cá sang Đồi Hoa (Segment 2 - Mũi tên đỏ 2)
  const traversePoints = [
    new THREE.Vector3(-108.0, 16.79, -84.0),
    new THREE.Vector3(-114.0, 19.89, -75.0),
    new THREE.Vector3(-122.0, 17.82, -67.0),
    new THREE.Vector3(-130.0, 13.47, -60.0),
    new THREE.Vector3(-136.0, 15.35, -52.0),
    new THREE.Vector3(-141.0, 15.50, -44.0),
  ];
  const traverseTrail = createTrailStrip(traversePoints, 2.0, false);

  // 3. Tuyến hoa bậc trên qua các luống hoa & chòi ngắm cảnh (Segment 3 Upper - Nét đỏ trên Đồi Hoa)
  const flowerUpperPoints = [
    new THREE.Vector3(-136.0, 15.50, -44.0),
    new THREE.Vector3(-142.0, 15.50, -40.0),
    new THREE.Vector3(-148.0, 15.50, -37.0),
    new THREE.Vector3(-154.0, 15.50, -34.0),
    new THREE.Vector3(-160.0, 12.53, -30.0),
  ];
  const flowerUpperTrail = createTrailStrip(flowerUpperPoints, 1.8, true);

  // 4. Tuyến hoa bậc dưới ven triền đồi (Segment 3 Lower - Nét đỏ dưới Đồi Hoa)
  const flowerLowerPoints = [
    new THREE.Vector3(-133.0, 15.50, -36.0),
    new THREE.Vector3(-139.0, 15.50, -32.0),
    new THREE.Vector3(-146.0, 15.50, -28.0),
    new THREE.Vector3(-152.0, 14.60, -25.0),
    new THREE.Vector3(-158.0, 11.16, -23.0),
  ];
  const flowerLowerTrail = createTrailStrip(flowerLowerPoints, 1.8, true);

  // 5. Hai đoạn bậc thang nối vòng khép kín ở 2 đầu Đông & Tây Đồi Hoa
  const eastConnectorPoints = [
    new THREE.Vector3(-136.0, 15.50, -44.0),
    new THREE.Vector3(-134.5, 15.50, -40.0),
    new THREE.Vector3(-133.0, 15.50, -36.0),
  ];
  createTrailStrip(eastConnectorPoints, 1.8, true);

  const westConnectorPoints = [
    new THREE.Vector3(-160.0, 12.53, -30.0),
    new THREE.Vector3(-159.5, 11.85, -26.5),
    new THREE.Vector3(-158.0, 11.16, -23.0),
  ];
  createTrailStrip(westConnectorPoints, 1.8, true);

  // Bậc thang gỗ Rustic trên đoạn leo dốc (z từ -45 đến -82)
  const stepCount = 28;
  const stepGeo = new THREE.BoxGeometry(2.05, 0.16, 0.35);
  for (let s = 1; s <= stepCount; s++) {
    const t = 0.28 + (s / stepCount) * 0.68;
    const pt = climbTrail.curve.getPointAt(t);
    const tan = climbTrail.curve.getTangentAt(t);
    const elev = getDK2HillSurfaceY(pt.x, pt.z) + 0.15;

    const step = new THREE.Mesh(stepGeo, timberStepMat);
    step.position.set(pt.x, elev, pt.z);
    step.rotation.y = Math.atan2(tan.x, tan.z);
    step.castShadow = true;
    step.receiveShadow = true;
    trailGroup.add(step);
  }

  // Bậc thang gỗ trên đoạn sườn đồi Ao Cá
  const traverseStepCount = 14;
  for (let s = 1; s <= traverseStepCount; s++) {
    const t = (s / traverseStepCount);
    const pt = traverseTrail.curve.getPointAt(t);
    const tan = traverseTrail.curve.getTangentAt(t);
    const elev = getDK2HillSurfaceY(pt.x, pt.z) + 0.15;

    const step = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.15, 0.32), timberStepMat);
    step.position.set(pt.x, elev, pt.z);
    step.rotation.y = Math.atan2(tan.x, tan.z);
    step.castShadow = true;
    trailGroup.add(step);
  }

  // Hàng lan can gỗ xỏ dây thừng dọc theo sườn dốc bảo vệ khách bộ hành
  const railPosts = [];
  const postGeo = new THREE.CylinderGeometry(0.06, 0.07, 0.95, 6);
  // Đoạn leo dốc: đặt lan can bên mép Đông (nhìn xuống bãi đỗ xe và nhà xưởng)
  for (let t = 0.25; t <= 0.98; t += 0.045) {
    const pt = climbTrail.curve.getPointAt(t);
    const tan = climbTrail.curve.getTangentAt(t);
    const norm = new THREE.Vector3(-tan.z, 0, tan.x).normalize();
    const postPos = pt.clone().add(norm.clone().multiplyScalar(1.1));
    const elev = getDK2HillSurfaceY(postPos.x, postPos.z);

    const post = new THREE.Mesh(postGeo, postMat);
    post.position.set(postPos.x, elev + 0.47, postPos.z);
    post.castShadow = true;
    trailGroup.add(post);
    railPosts.push(new THREE.Vector3(postPos.x, elev + 0.82, postPos.z));
  }

  // Đoạn sườn đồi Ao Cá: đặt lan can bên mép nhìn xuống thung lũng
  for (let t = 0.05; t <= 0.95; t += 0.08) {
    const pt = traverseTrail.curve.getPointAt(t);
    const tan = traverseTrail.curve.getTangentAt(t);
    const norm = new THREE.Vector3(-tan.z, 0, tan.x).normalize();
    const postPos = pt.clone().add(norm.clone().multiplyScalar(-1.05));
    const elev = getDK2HillSurfaceY(postPos.x, postPos.z);

    const post = new THREE.Mesh(postGeo, postMat);
    post.position.set(postPos.x, elev + 0.47, postPos.z);
    post.castShadow = true;
    trailGroup.add(post);
    railPosts.push(new THREE.Vector3(postPos.x, elev + 0.82, postPos.z));
  }

  // Nối dây thừng giữa các cọc liền kề
  for (let i = 0; i < railPosts.length - 1; i++) {
    const p1 = railPosts[i];
    const p2 = railPosts[i + 1];
    const dist = p1.distanceTo(p2);
    if (dist < 4.2) {
      const mid = p1.clone().add(p2).multiplyScalar(0.5);
      const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, dist, 4), ropeMat);
      rope.position.copy(mid);
      rope.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), p2.clone().sub(p1).normalize());
      trailGroup.add(rope);

      const ropeLow = rope.clone();
      ropeLow.position.y -= 0.35;
      trailGroup.add(ropeLow);
    }
  }

  // Cọc đèn Solar phát sáng ban đêm dọc theo các tuyến
  const allTrails = [climbTrail, traverseTrail, flowerUpperTrail, flowerLowerTrail];
  const bollardPostGeo = new THREE.CylinderGeometry(0.045, 0.05, 0.65, 6);
  const bollardCapGeo = new THREE.CylinderGeometry(0.08, 0.06, 0.12, 6);
  const bollardGlowGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.18, 6);

  allTrails.forEach((tr) => {
    const count = Math.floor(tr.length / 5.2);
    for (let k = 1; k <= count; k++) {
      const t = k / (count + 1);
      const pt = tr.curve.getPointAt(t);
      const tan = tr.curve.getTangentAt(t);
      const norm = new THREE.Vector3(-tan.z, 0, tan.x).normalize();
      const side = (k % 2 === 0 ? 1 : -1) * 1.2;
      const pos = pt.clone().add(norm.clone().multiplyScalar(side));
      const elev = getDK2HillSurfaceY(pos.x, pos.z);

      const lampPost = new THREE.Mesh(bollardPostGeo, solarLampMat);
      lampPost.position.set(pos.x, elev + 0.32, pos.z);
      lampPost.castShadow = true;
      trailGroup.add(lampPost);

      const lampGlow = new THREE.Mesh(bollardGlowGeo, solarGlowMat);
      lampGlow.position.set(pos.x, elev + 0.62, pos.z);
      trailGroup.add(lampGlow);

      const lampCap = new THREE.Mesh(bollardCapGeo, solarLampMat);
      lampCap.position.set(pos.x, elev + 0.72, pos.z);
      trailGroup.add(lampCap);
    }
  });

  // 3 Biển chỉ dẫn sinh thái bằng gỗ mộc
  const signCfg = [
    { pt: new THREE.Vector3(-73.5, 0.05, -24.0), rotY: Math.PI / 6 },
    { pt: new THREE.Vector3(-109.5, 16.8, -82.0), rotY: -Math.PI / 4 },
    { pt: new THREE.Vector3(-138.5, 15.5, -44.0), rotY: Math.PI / 4 },
  ];

  signCfg.forEach((sc) => {
    const elev = getDK2HillSurfaceY(sc.pt.x, sc.pt.z);
    const post = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.08, 1.5, 6),
      new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.85 })
    );
    post.position.set(sc.pt.x, elev + 0.75, sc.pt.z);
    post.castShadow = true;
    trailGroup.add(post);

    const board = new THREE.Mesh(
      new THREE.BoxGeometry(1.7, 0.45, 0.08),
      new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.8 })
    );
    board.position.set(sc.pt.x, elev + 1.35, sc.pt.z);
    board.rotation.y = sc.rotY;
    board.castShadow = true;
    trailGroup.add(board);

    // Mũi tên gỗ chỉ hướng
    const arrow = new THREE.Mesh(
      new THREE.ConeGeometry(0.18, 0.32, 3),
      new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.5 })
    );
    arrow.position.set(sc.pt.x, elev + 1.35, sc.pt.z + 0.06);
    arrow.rotation.z = -Math.PI / 2;
    arrow.rotation.y = sc.rotY;
    trailGroup.add(arrow);
  });

  // 3 Ghế băng gỗ nghỉ chân tại các điểm view đẹp
  const benchLocations = [
    { x: -98.0, z: -68.0, rotY: -Math.PI / 3 },
    { x: -128.0, z: -62.0, rotY: Math.PI / 4 },
    { x: -148.0, z: -35.0, rotY: 0 },
  ];

  benchLocations.forEach((bc) => {
    const elev = getDK2HillSurfaceY(bc.x, bc.z);
    const benchGroup = new THREE.Group();
    benchGroup.position.set(bc.x, elev, bc.z);
    benchGroup.rotation.y = bc.rotY;

    const seat = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.08, 0.5), timberStepMat);
    seat.position.y = 0.42;
    seat.castShadow = true;
    benchGroup.add(seat);

    const back = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.4, 0.06), timberStepMat);
    back.position.set(0, 0.75, -0.22);
    back.castShadow = true;
    benchGroup.add(back);

    [-0.7, 0.7].forEach((lx) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.42, 6), solarLampMat);
      leg.position.set(lx, 0.21, 0);
      leg.castShadow = true;
      benchGroup.add(leg);
    });

    trailGroup.add(benchGroup);
  });

  // Nhân viên / Khách tham quan tản bộ trên đường mòn
  const hiker1 = createCharacter({ shirtColor: 0x0284c7, pantsColor: 0x334155, hatType: 'cap', role: 'worker' });
  hiker1.position.set(-94.0, getDK2HillSurfaceY(-94.0, -58.0) + 0.12, -58.0);
  hiker1.rotation.y = -Math.PI / 4;
  hiker1.scale.set(0.9, 0.9, 0.9);
  trailGroup.add(hiker1);

  const hiker2 = createCharacter({ shirtColor: 0xf43f5e, pantsColor: 0xf8fafc, hatType: 'none', role: 'engineer' });
  hiker2.position.set(-145.0, getDK2HillSurfaceY(-145.0, -36.0) + 0.12, -36.0);
  hiker2.rotation.y = Math.PI / 3;
  hiker2.scale.set(0.9, 0.9, 0.9);
  trailGroup.add(hiker2);

  scene.add(trailGroup);
}

`;

  mainCode = mainCode.slice(0, replaceStart) + newFunctionCode + mainCode.slice(endIdx);
  console.log('2. Replaced buildDK2EcoTrail successfully!');
}

fs.writeFileSync(mainPath, mainCode, 'utf8');
console.log('Finished updating src/main.js.');
