const fs = require('fs');
const path = require('path');

const filePath = path.resolve('src/main.js');
let rawCode = fs.readFileSync(filePath, 'utf8');
const hadCRLF = rawCode.includes('\r\n');
let code = rawCode.replace(/\r\n/g, '\n');

// 1. Update koiFishes initialization in buildDK2HeadquartersKoiPond
const target1 = `  // 5. ĐÀN CÁ BÌNH THƯỜNG THÂN SUÔN 7 CON BƠI LỘI TRONG BỂ CHỮ NHẬT
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
  }`.replace(/\r\n/g, '\n');

const replacement1 = `  // 5. ĐÀN CÁ BÌNH THƯỜNG THÂN SUÔN BƠI LỘI TỰ NHIÊN TRONG BỂ CHỮ NHẬT (WANDERING & NATURAL PATHS)
  koiFishes = [];
  const fishCount = 8;
  for (let i = 0; i < fishCount; i++) {
    // Kích thước cá thân suôn tự nhiên (scale 0.68 - 0.84m)
    const scale = 0.68 + (i % 3) * 0.08;
    const fishObj = buildRealisticStreamlinedFish(scale, i);

    // Tọa độ ngẫu nhiên ban đầu phân bố khắp lòng bể chữ nhật
    const startX = (Math.random() - 0.5) * (poolWidth - 2.4);
    const startZ = (Math.random() - 0.5) * (poolDepth - 2.0);
    const startY = wallH * 0.72 + (i % 3) * 0.025; // Chiều sâu bơi lội tự nhiên dưới mặt nước
    const heading = Math.random() * Math.PI * 2;
    const speed = 0.32 + Math.random() * 0.22;

    fishObj.group.position.set(startX, startY, startZ);
    fishObj.group.rotation.y = heading;
    pondGroup.add(fishObj.group);

    koiFishes.push({
      mesh: fishObj.group,
      tail: fishObj.tailGroup,
      x: startX,
      y: startY,
      z: startZ,
      baseY: startY,
      heading: heading,
      targetHeading: heading,
      speed: speed,
      targetSpeed: speed,
      wanderTimer: 1.0 + Math.random() * 3.0,
      burstTimer: 3.5 + Math.random() * 5.0,
      turnSpeed: 1.3,
      phase: i * 1.25,
      boundary: {
        minX: -poolWidth / 2 + 0.85,
        maxX: poolWidth / 2 - 0.85,
        minZ: -poolDepth / 2 + 0.8,
        maxZ: poolDepth / 2 - 0.8,
      },
    });
  }`.replace(/\r\n/g, '\n');

// 2. Update hillPondKoiFishes initialization in buildHillFishPond
const target2 = `  // 6. ĐÀN CÁ THÂN SUÔN 18 CON BƠI LỘI & NHẢY BÚNG NƯỚC (REALISTIC STREAMLINED FISH)
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
  }`.replace(/\r\n/g, '\n');

const replacement2 = `  // 6. ĐÀN CÁ THÂN SUÔN 18 CON BƠI LỘI TỰ DO & NHẢY BÚNG NƯỚC TRÊN AO ĐỒI (ORGANIC AUTONOMOUS SWIMMING)
  hillPondKoiFishes = [];

  const maxSwimRadiusX = radiusX - 2.8; // ~13.7m (bán trục an toàn bên trong mép bờ hồ)
  const maxSwimRadiusZ = radiusZ - 2.4; // ~9.6m

  for (let k = 0; k < 18; k++) {
    // Kích cỡ cá sinh thái tự nhiên phong phú từ 0.9m đến 1.25m
    const scale = 0.92 + (k % 4) * 0.11;
    const fishObj = buildRealisticStreamlinedFish(scale, k);

    // Phân bố đều tự nhiên trong lòng hồ
    const spawnAngle = (k / 18) * Math.PI * 2 + (Math.random() - 0.5) * 0.35;
    const spawnDist = 0.2 + Math.random() * 0.65;
    const startX = Math.cos(spawnAngle) * (maxSwimRadiusX * spawnDist);
    const startZ = Math.sin(spawnAngle) * (maxSwimRadiusZ * spawnDist);
    const startY = 0.045 + (k % 3) * 0.015;
    const heading = Math.random() * Math.PI * 2;
    const speed = 0.35 + Math.random() * 0.25;

    // 5 con cá thỉnh thoảng nhảy búng nước nhào lộn
    const isJumper = k % 3 === 0;

    fishObj.group.position.set(startX, startY, startZ);
    fishObj.group.rotation.y = heading;
    pondGroup.add(fishObj.group);

    hillPondKoiFishes.push({
      mesh: fishObj.group,
      tail: fishObj.tailGroup,
      x: startX,
      y: startY,
      z: startZ,
      baseY: startY,
      heading: heading,
      targetHeading: heading,
      speed: speed,
      targetSpeed: speed,
      wanderTimer: 1.5 + Math.random() * 3.5,
      burstTimer: 4.0 + Math.random() * 5.0,
      turnSpeed: 1.1,
      phase: k * 1.35,
      isJumper: isJumper,
      isJumping: false,
      jumpProgress: 0,
      jumpDuration: 1.15 + (k % 3) * 0.2,
      jumpTimer: 2.5 + k * 1.6,
      parentGroup: pondGroup,
      boundary: {
        rx: maxSwimRadiusX,
        rz: maxSwimRadiusZ,
      },
    });
  }`.replace(/\r\n/g, '\n');

// 3. Add updateRealisticSwimmingFish function before updateAnimatedObjects
const target3 = `function updateAnimatedObjects(delta, time) {`.replace(/\r\n/g, '\n');

const replacement3 = `// ============================================================================
// HỆ THỐNG CÁ BƠI LỘI TỰ NHIÊN HỮU CƠ (ORGANIC AUTONOMOUS FISH SWIMMING)
// Cá bơi thẳng, uốn lượn thong thả đổi hướng, tránh bờ êm dịu, không xoay vòng vòng
// ============================================================================
function updateRealisticSwimmingFish(fish, delta, time, isBox) {
  // 1. Hoạt cảnh cá nhảy búng nước nhào lộn trên không (dành riêng cho cá ao đồi)
  if (fish.isJumper) {
    if (fish.isJumping) {
      fish.jumpProgress += delta / fish.jumpDuration;
      if (fish.jumpProgress >= 1.0) {
        fish.isJumping = false;
        fish.jumpTimer = 4.0 + Math.random() * 6.5; // Nghỉ 4 - 10s trước khi nhảy tiếp
        createWaterSplash(fish.x, 0.08, fish.z, fish.parentGroup);
      } else {
        const p = fish.jumpProgress;
        const jumpCurve = Math.sin(p * Math.PI);
        const jHeight = jumpCurve * 1.35; // Vọt lên khỏi mặt nước 1.35m

        // Tiếp tục lướt tới phía trước theo quán tính
        const airSpeed = fish.speed * 1.3;
        fish.x += Math.sin(fish.heading) * airSpeed * delta;
        fish.z += Math.cos(fish.heading) * airSpeed * delta;

        fish.mesh.position.set(fish.x, fish.baseY + jHeight, fish.z);
        fish.mesh.rotation.y = fish.heading;
        // Chúc đầu xuống khi rơi (pitch)
        fish.mesh.rotation.x = -Math.cos(p * Math.PI) * 0.8;
        fish.mesh.rotation.z = Math.sin(p * Math.PI) * 0.18;

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
        createWaterSplash(fish.x, 0.08, fish.z, fish.parentGroup);
      }
    }
  }

  // 2. Chuyển động bơi tự nhiên (Wandering & Natural Cruising)
  // Đổi hướng ngẫu nhiên thong thả sau mỗi vài giây
  fish.wanderTimer -= delta;
  if (fish.wanderTimer <= 0) {
    // Góc uốn lượn mềm mại +/- 40 độ
    const jitter = (Math.random() - 0.5) * 1.4;
    fish.targetHeading = fish.heading + jitter;
    // Tốc độ bơi thong dong
    fish.targetSpeed = 0.26 + Math.random() * 0.28;
    fish.wanderTimer = 2.5 + Math.random() * 4.0;
  }

  // Cú quẫy nước bứt tốc ngẫu nhiên rồi lướt êm dịu (Burst & Glide)
  fish.burstTimer -= delta;
  if (fish.burstTimer <= 0) {
    fish.targetSpeed = 0.65 + Math.random() * 0.22;
    fish.burstTimer = 5.0 + Math.random() * 6.5;
  }

  // 3. Tránh mép bờ hồ êm ái, mượt mà (Soft boundary avoidance)
  if (isBox) {
    const b = fish.boundary;
    const margin = 0.75;
    let steerX = 0, steerZ = 0;

    if (fish.x > b.maxX - margin && Math.sin(fish.heading) > 0) steerX = -1;
    else if (fish.x < b.minX + margin && Math.sin(fish.heading) < 0) steerX = 1;

    if (fish.z > b.maxZ - margin && Math.cos(fish.heading) > 0) steerZ = -1;
    else if (fish.z < b.minZ + margin && Math.cos(fish.heading) < 0) steerZ = 1;

    if (steerX !== 0 || steerZ !== 0) {
      // Hướng lái nhẹ nhàng về phía lòng hồ
      fish.targetHeading = Math.atan2(steerX, steerZ) + (Math.random() - 0.5) * 0.35;
      fish.turnSpeed = 2.2;
    } else {
      fish.turnSpeed = 1.2;
    }

    // Giới hạn an toàn tuyệt đối
    fish.x = Math.max(b.minX, Math.min(b.maxX, fish.x));
    fish.z = Math.max(b.minZ, Math.min(b.maxZ, fish.z));
  } else {
    // Hồ elip ao đồi
    const b = fish.boundary;
    const normDist = (fish.x * fish.x) / (b.rx * b.rx) + (fish.z * fish.z) / (b.rz * b.rz);
    const outwardDot = fish.x * Math.sin(fish.heading) + fish.z * Math.cos(fish.heading);

    if (normDist > 0.78 && outwardDot > 0) {
      // Bơi lượn hướng về phía tâm hồ
      const angleToCenter = Math.atan2(-fish.x, -fish.z);
      fish.targetHeading = angleToCenter + (Math.random() - 0.5) * 0.55;
      fish.turnSpeed = 2.0;
    } else {
      fish.turnSpeed = 1.1;
    }

    if (normDist > 1.0) {
      const scale = 0.95 / Math.sqrt(normDist);
      fish.x *= scale;
      fish.z *= scale;
    }
  }

  // 4. Bẻ lái mượt mà theo góc quay ngắn nhất (Shortest arc steering)
  let diff = fish.targetHeading - fish.heading;
  diff = Math.atan2(Math.sin(diff), Math.cos(diff));
  const maxTurn = fish.turnSpeed * delta;
  if (Math.abs(diff) <= maxTurn) {
    fish.heading = fish.targetHeading;
  } else {
    fish.heading += Math.sign(diff) * maxTurn;
  }

  // 5. Nội suy tốc độ & cập nhật tọa độ
  fish.speed = THREE.MathUtils.lerp(fish.speed, fish.targetSpeed, delta * 2.2);
  fish.x += Math.sin(fish.heading) * fish.speed * delta;
  fish.z += Math.cos(fish.heading) * fish.speed * delta;

  // Nhấp nhô bơi lặn nhẹ nhàng theo phương Y
  const verticalBob = Math.sin(time * 0.0025 + fish.phase) * 0.015;
  fish.y = fish.baseY + verticalBob;

  fish.mesh.position.set(fish.x, fish.y, fish.z);

  // 6. Uốn lượn thân cá hình chữ S theo nhịp bơi
  const waggleFreq = 7.0 + fish.speed * 8.5;
  const wiggle = Math.sin(time * 0.001 * waggleFreq + fish.phase);
  fish.mesh.rotation.y = fish.heading + wiggle * 0.07;
  fish.mesh.rotation.x = 0;
  // Nghiêng thân nhẹ khi chuyển hướng (banking)
  fish.mesh.rotation.z = -diff * 0.22;

  // 7. Quẫy vây đuôi nhịp nhàng ăn khớp với tốc độ bơi
  if (fish.tail) {
    fish.tail.rotation.y = Math.sin(time * 0.001 * waggleFreq + fish.phase - 0.6) * (0.38 + fish.speed * 0.32);
  }
}

function updateAnimatedObjects(delta, time) {`.replace(/\r\n/g, '\n');

// 4. Update riverFishGroup inside updateAnimatedObjects
const target4 = `  // 7. Đàn cá bơi lội dưới sông
  if (riverFishGroup) {
    riverFishGroup.rotation.y += delta * 0.7;
  }`.replace(/\r\n/g, '\n');

const replacement4 = `  // 7. Đàn cá bơi lội dưới sông máng (Bơi lượn dọc theo lòng kênh nước)
  if (riverFishGroup) {
    riverFishGroup.children.forEach((fMesh, idx) => {
      fMesh.position.z += Math.sin(time * 0.0015 + idx * 1.2) * delta * 0.6;
      const dir = Math.cos(time * 0.0015 + idx * 1.2);
      fMesh.rotation.y = (dir > 0 ? 0 : Math.PI) + Math.sin(time * 0.015 + idx) * 0.12;
    });
  }`.replace(/\r\n/g, '\n');

// 5. Update koiFishes update inside updateAnimatedObjects
const target5 = `  // 18. Đàn cá thân suôn bơi lội và quẫy đuôi trong bể hình chữ nhật Nhà điều hành (Yêu cầu 1 & 2)
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
  });`.replace(/\r\n/g, '\n');

const replacement5 = `  // 18. Đàn cá thân suôn bơi lội tự nhiên trong bể hình chữ nhật Nhà điều hành DK2
  koiFishes.forEach((fish) => {
    updateRealisticSwimmingFish(fish, delta, time, true);
  });`.replace(/\r\n/g, '\n');

// 6. Update hillPondKoiFishes update inside updateAnimatedObjects
const target6 = `  // 20. Đàn cá Koi bơi lội & nhảy búng nước trong ao cá đồi DK2 (Yêu cầu 1)
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
  });`.replace(/\r\n/g, '\n');

const replacement6 = `  // 20. Đàn cá Koi bơi lội tự do & nhảy búng nước trong ao cá đồi DK2
  hillPondKoiFishes.forEach((fish) => {
    updateRealisticSwimmingFish(fish, delta, time, false);
  });`.replace(/\r\n/g, '\n');

// Check targets
console.log('Target 1 found:', code.includes(target1));
console.log('Target 2 found:', code.includes(target2));
console.log('Target 3 found:', code.includes(target3));
console.log('Target 4 found:', code.includes(target4));
console.log('Target 5 found:', code.includes(target5));
console.log('Target 6 found:', code.includes(target6));

if (!code.includes(target1) || !code.includes(target2) || !code.includes(target3) || !code.includes(target4) || !code.includes(target5) || !code.includes(target6)) {
  console.error('Abort: Not all targets matched!');
  process.exit(1);
}

code = code.replace(target1, replacement1);
code = code.replace(target2, replacement2);
code = code.replace(target3, replacement3);
code = code.replace(target4, replacement4);
code = code.replace(target5, replacement5);
code = code.replace(target6, replacement6);

if (hadCRLF) {
  code = code.replace(/\n/g, '\r\n');
}

fs.writeFileSync(filePath, code, 'utf8');
console.log('Successfully updated natural fish swimming in src/main.js!');
