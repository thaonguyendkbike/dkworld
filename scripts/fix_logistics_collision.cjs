const fs = require('fs');
const path = require('path');

const mainJsPath = path.join(__dirname, '..', 'src', 'main.js');
let content = fs.readFileSync(mainJsPath, 'utf8');

// 1. Cập nhật activeForkliftInitialPos ở đầu file
content = content.replace(
  /let activeForkliftInitialPos = \{ x: 54\.0, y: 0, z: -32\.5, rotY: 0 \};/,
  'let activeForkliftInitialPos = { x: 58.0, y: 0, z: -35.6, rotY: -Math.PI / 2 };'
);

// 2. Cập nhật vị trí khởi tạo xe nâng ban đầu
content = content.replace(
  /createDetailedForklift\(54\.0, 0, -32\.5, 0, 'forklift1', 'Xe nâng điện Komatsu FB25 #01 \(Xưởng B\)', \{ isActiveCycle: true \}\);/,
  "createDetailedForklift(58.0, 0, -35.6, -Math.PI / 2, 'forklift1', 'Xe nâng điện Komatsu FB25 #01 (Xưởng B)', { isActiveCycle: true });"
);

// 3. Dịch chuyển pallet gỗ tĩnh ở cửa bốc dỡ sang bên hông để thông thoáng lối đi xe tải & xe nâng
content = content.replace(
  /createPalletStack\(58, 0, -31\);/,
  'createPalletStack(64.5, 0, -31);'
);

// 4. Dịch chuyển KCS và xe test để không bị cản trở hành lang xe tải
content = content.replace(
  /kcs\.position\.set\(60, 0, -28\);/,
  'kcs.position.set(63.5, 0, -28);'
);
content = content.replace(
  /testBike\.position\.set\(61\.8, 0, -27\.2\);/,
  'testBike.position.set(65.0, 0, -27.2);'
);

// 5. Thay thế toàn bộ khối updateLogisticsCycle và các helper pallet
const startMarker = '// CHU TRÌNH LOGISTICS LIÊN TỤC KHÉP KÍN (CONTINUOUS LOGISTICS STATE MACHINE)';
const endMarker = 'function setupTrain() {';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
  console.error('Could not locate start or end marker!', { startIndex, endIndex });
  process.exit(1);
}

const newCycleCode = `// CHU TRÌNH LOGISTICS LIÊN TỤC KHÉP KÍN (CONTINUOUS LOGISTICS STATE MACHINE)
// Chu trình: Xe tải từ đường ĐT234 -> Cổng DK1 -> Lùi vào bến bốc hàng Xưởng B ->
// Xe nâng xúc pallet xe máy điện từ Xưởng B xếp lên xe tải ->
// Đóng cửa thùng, cửa xưởng -> Xe tải xuất bến qua Cổng DK1 ra đường ĐT234 -> Lặp lại
// ============================================================================
function updateLogisticsCycle(delta, time, isNight) {
  if (!activeLogisticsTruck || !activeForklift) return;

  const cycleDuration = (CONFIG.LOGISTICS && CONFIG.LOGISTICS.cycleDuration) ? CONFIG.LOGISTICS.cycleDuration : 48.0;
  const dayFreq = (CONFIG.LOGISTICS && CONFIG.LOGISTICS.dayFrequency) ? CONFIG.LOGISTICS.dayFrequency : 1.0;
  const nightFreq = (CONFIG.LOGISTICS && CONFIG.LOGISTICS.nightFrequency) ? CONFIG.LOGISTICS.nightFrequency : 0.65;
  const freq = isNight ? nightFreq : dayFreq;

  // 1. Kiểm tra an toàn người đi bộ cắt ngang đường xe tải / xe nâng
  let pedestrianBlocked = false;
  if (CONFIG.LOGISTICS && CONFIG.LOGISTICS.enablePedestrianSafety && wanderingPedestrians.length > 0) {
    const truckPos = activeLogisticsTruck.truckGroup.position;
    for (let i = 0; i < wanderingPedestrians.length; i++) {
      const p = wanderingPedestrians[i];
      if (p.mesh) {
        const dx = p.mesh.position.x - truckPos.x;
        const dz = p.mesh.position.z - truckPos.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < 4.2) {
          pedestrianBlocked = true;
          break;
        }
      }
    }
  }

  // Giảm tốc mượt mà khi có người đi bộ
  const targetSlowdown = pedestrianBlocked ? 0.05 : 1.0;
  logisticsSafetySlowdown += (targetSlowdown - logisticsSafetySlowdown) * delta * 3.5;

  // Tăng thời gian chu kỳ
  logisticsCycleTime += delta * freq * logisticsSafetySlowdown;
  const ct = logisticsCycleTime % cycleDuration; // 0.0 -> 48.0s

  const truck = activeLogisticsTruck.truckGroup;
  const doorL = activeLogisticsTruck.doorPivotLeft;
  const doorR = activeLogisticsTruck.doorPivotRight;
  const fl = activeForklift.group;
  const flLift = activeForklift.liftGroup;
  const doorB1 = shutterDoors.find((d) => d.id === 'doorB1');
  const barrier1 = animatedBarriers.find((b) => b.id === 'barrierDK1');

  // Xoay đèn cảnh báo amber trên nóc xe nâng và xe tải
  rotatingBeacons.forEach((b) => {
    if (b.mesh) b.mesh.rotation.y += delta * 14;
    if (b.light) b.light.intensity = (isNight ? 1.1 : 0.75) * (0.8 + Math.sin(time * 0.015) * 0.2);
  });

  // Đèn pha xe tải ban đêm
  if (activeLogisticsTruck.headSpotL && activeLogisticsTruck.headSpotR) {
    const headIntensity = isNight ? 1.6 : 0.0;
    activeLogisticsTruck.headSpotL.intensity = headIntensity;
    activeLogisticsTruck.headSpotR.intensity = headIntensity;
  }

  // Helper hàm nội suy mượt mà
  const lerp = THREE.MathUtils.lerp;
  const smooth = (t) => THREE.MathUtils.smoothstep(t, 0, 1);

  // Vị trí đỗ của xe tải & xe nâng:
  // Xe tải đỗ tại (58.0, 0, -24.5), rotation.y = 0. Đuôi xe quay về Z âm (-28.53).
  // Cửa cuốn xưởng B (doorB1) tại Z = -33.17.
  // Khoảng cách từ đuôi xe tải tới cửa xưởng B là 4.64 mét (khoảng bốc dỡ cực kỳ rộng rãi, tuyệt đối không va chạm).
  // Xe nâng chờ sẵn bên trong Xưởng B tại (58.0, 0, -35.6, rotY = -Math.PI / 2).

  // =========================================================================
  // GIAI ĐOẠN 1: XE TẢI TIẾN TỪ ĐƯỜNG ĐT234 VÀO CỔNG 1 (0.0s - 7.5s)
  // =========================================================================
  if (ct < 7.5) {
    const t = smooth(ct / 7.5);
    // Từ đường ĐT234 (82, 0, 10) rẽ vào Cổng 1 (77.5, 0, -18) -> đường nội bộ (66, 0, -20)
    if (t < 0.5) {
      const subT = t / 0.5;
      truck.position.x = lerp(82.0, 77.5, subT);
      truck.position.z = lerp(10.0, -18.0, subT);
      truck.rotation.y = lerp(-Math.PI, -Math.PI * 0.75, subT);
    } else {
      const subT = (t - 0.5) / 0.5;
      truck.position.x = lerp(77.5, 66.0, subT);
      truck.position.z = lerp(-18.0, -20.0, subT);
      truck.rotation.y = lerp(-Math.PI * 0.75, -Math.PI / 2, subT);
    }

    // Barie Cổng 1 tự động nâng lên chào đón xe tải từ đường vào
    if (barrier1) {
      barrier1.targetAngle = (ct >= 1.2 && ct <= 5.8) ? Math.PI / 2.3 : 0.0;
    }
    const guardTarget = (ct >= 1.2 && ct <= 5.8) ? 1.0 : 0.0;
    guardSaluteAngle += (guardTarget - guardSaluteAngle) * delta * 4;

    // Đóng cửa thùng xe tải & đóng cửa cuốn xưởng B
    doorL.rotation.y = 0;
    doorR.rotation.y = 0;
    if (doorB1) doorB1.targetProgress = 0.0;

    // Xe nâng chờ sẵn bên trong Xưởng B, mang sẵn pallet xe máy điện thành phẩm
    fl.position.set(58.0, 0, -35.6);
    fl.rotation.y = -Math.PI / 2;
    flLift.position.y = activeForklift.initialY;
    ensureForkliftOutboundPalletLoaded();
  }
  // =========================================================================
  // GIAI ĐOẠN 2: CHẠY TRÊN ĐƯỜNG NỘI BỘ & CUA VÀO SÂN BỐC DỠ XƯỞNG B (7.5s - 14.5s)
  // =========================================================================
  else if (ct < 14.5) {
    const t = smooth((ct - 7.5) / 7.0);

    if (t < 0.45) {
      const subT = t / 0.45;
      // Chạy dọc đường nội bộ từ (66, -20) -> (58, -20)
      truck.position.x = lerp(66.0, 58.0, subT);
      truck.position.z = -20.0;
      truck.rotation.y = -Math.PI / 2;
    } else if (t < 0.7) {
      const subT = (t - 0.45) / 0.25;
      // Bắt đầu cua mũi xe chuẩn bị lùi vào bến: (58, -20) -> (58, -21.5)
      truck.position.x = 58.0;
      truck.position.z = lerp(-20.0, -21.5, subT);
      truck.rotation.y = lerp(-Math.PI / 2, 0, subT);
    } else {
      const subT = (t - 0.7) / 0.3;
      // Lùi thẳng đuôi vào bến bốc hàng Xưởng B: (58, -21.5) -> (58, -24.5)
      truck.position.x = 58.0;
      truck.position.z = lerp(-21.5, -24.5, subT);
      truck.rotation.y = 0;
    }

    // Barie hạ xuống & bảo vệ hạ tay
    if (barrier1) barrier1.targetAngle = 0;
    guardSaluteAngle += (0.0 - guardSaluteAngle) * delta * 3;

    doorL.rotation.y = 0;
    doorR.rotation.y = 0;
    if (doorB1) doorB1.targetProgress = 0.0;

    fl.position.set(58.0, 0, -35.6);
    fl.rotation.y = -Math.PI / 2;
    flLift.position.y = activeForklift.initialY;
    ensureForkliftOutboundPalletLoaded();
  }
  // =========================================================================
  // GIAI ĐOẠN 3: LÙI ĐỖ CHUẨN, MỞ CỬA CUỐN XƯỞNG B & MỞ CỬA THÙNG XE (14.5s - 18.0s)
  // =========================================================================
  else if (ct < 18.0) {
    const t = smooth((ct - 14.5) / 3.5);
    truck.position.set(58.0, 0, -24.5);
    truck.rotation.y = 0;

    // Cửa cuốn Xưởng B cuộn mở lên đón xe nâng
    if (doorB1) doorB1.targetProgress = t;

    // Cửa thùng xe tải mở 2 cánh ra 110 độ
    const doorAngle = smooth(Math.max(0, (t - 0.2) / 0.8)) * 1.92;
    doorL.rotation.y = -doorAngle;
    doorR.rotation.y = doorAngle;

    // Càng nâng bắt đầu nâng pallet xe điện lên độ cao sàn thùng xe (1.22m)
    fl.position.set(58.0, 0, -35.6);
    fl.rotation.y = -Math.PI / 2;
    flLift.position.y = lerp(activeForklift.initialY, 1.22, t);
    ensureForkliftOutboundPalletLoaded();
  }
  // =========================================================================
  // GIAI ĐOẠN 4: XE NÂNG TIẾN RA BỐC PALLET XE MÁY ĐIỆN LÊN XE TẢI (18.0s - 29.0s)
  // =========================================================================
  else if (ct < 29.0) {
    const t = (ct - 18.0) / 11.0;
    truck.position.set(58.0, 0, -24.5);
    truck.rotation.y = 0;
    doorL.rotation.y = -1.92;
    doorR.rotation.y = 1.92;
    if (doorB1) doorB1.targetProgress = 1.0;

    // t: 0.0 -> 0.35: Xe nâng tiến thẳng từ trong xưởng (z = -35.6) tới sát thùng xe tải (z = -29.6)
    // Pallet xe điện luồn vào đúng vị trí sàn thùng xe tải
    if (t < 0.35) {
      const subT = smooth(t / 0.35);
      fl.position.set(58.0, 0, lerp(-35.6, -29.6, subT));
      fl.rotation.y = -Math.PI / 2;
      flLift.position.y = 1.22;
      ensureForkliftOutboundPalletLoaded();
    }
    // t: 0.35 -> 0.55: Hạ càng nâng xuống sàn xe để đặt pallet xe điện lên thùng xe tải
    else if (t < 0.55) {
      const subT = smooth((t - 0.35) / 0.20);
      fl.position.set(58.0, 0, -29.6);
      fl.rotation.y = -Math.PI / 2;
      flLift.position.y = lerp(1.22, 1.08, subT);

      // Chuyển giao pallet xe máy điện sang thùng xe tải
      if (subT > 0.6) {
        attachOutboundPalletToTruck();
      }
    }
    // t: 0.55 -> 0.95: Xe nâng lùi thẳng trở lại bên trong Xưởng B (z = -35.6)
    else if (t < 0.95) {
      const subT = smooth((t - 0.55) / 0.40);
      fl.position.set(58.0, 0, lerp(-29.6, -35.6, subT));
      fl.rotation.y = -Math.PI / 2;
      flLift.position.y = lerp(1.08, activeForklift.initialY, subT);
    }
    // t: 0.95 -> 1.0: Đã lùi an toàn bên trong xưởng, sẵn sàng ca tiếp
    else {
      fl.position.set(58.0, 0, -35.6);
      fl.rotation.y = -Math.PI / 2;
      flLift.position.y = activeForklift.initialY;
    }
  }
  // =========================================================================
  // GIAI ĐOẠN 5: ĐÓNG CỬA THÙNG XE & HẠ CỬA CUỐN XƯỞNG B (29.0s - 33.0s)
  // =========================================================================
  else if (ct < 33.0) {
    const t = smooth((ct - 29.0) / 4.0);
    truck.position.set(58.0, 0, -24.5);
    truck.rotation.y = 0;

    // 2 Cánh cửa thùng xe tải khép chặt
    doorL.rotation.y = -1.92 * (1 - t);
    doorR.rotation.y = 1.92 * (1 - t);

    // Cửa cuốn Xưởng B cuộn hạ xuống
    if (doorB1) doorB1.targetProgress = 1.0 - t;

    fl.position.set(58.0, 0, -35.6);
    fl.rotation.y = -Math.PI / 2;
    flLift.position.y = activeForklift.initialY;
  }
  // =========================================================================
  // GIAI ĐOẠN 6: XE TẢI CHỞ HÀNG RỜI BẾN, RA ĐƯỜNG NỘI BỘ (33.0s - 40.0s)
  // =========================================================================
  else if (ct < 40.0) {
    const t = smooth((ct - 33.0) / 7.0);
    doorL.rotation.y = 0;
    doorR.rotation.y = 0;
    if (doorB1) doorB1.targetProgress = 0.0;

    fl.position.set(58.0, 0, -35.6);
    fl.rotation.y = -Math.PI / 2;
    flLift.position.y = activeForklift.initialY;

    if (t < 0.4) {
      const subT = t / 0.4;
      // Xe tải tiến thẳng ra khỏi bến: (58, -24.5) -> (58, -20.0)
      truck.position.x = 58.0;
      truck.position.z = lerp(-24.5, -20.0, subT);
      truck.rotation.y = lerp(0, Math.PI / 2, subT);
    } else {
      const subT = (t - 0.4) / 0.6;
      // Chạy dọc đường nội bộ hướng về Cổng 1: (58, -20) -> (72, -20)
      truck.position.x = lerp(58.0, 72.0, subT);
      truck.position.z = -20.0;
      truck.rotation.y = Math.PI / 2;
    }

    // Barie Cổng 1 bắt đầu mở lên khi xe tải tiến đến gần
    if (barrier1) {
      barrier1.targetAngle = (ct >= 36.5) ? Math.PI / 2.3 : 0;
    }
    const guardTarget = (ct >= 36.5) ? 1.0 : 0.0;
    guardSaluteAngle += (guardTarget - guardSaluteAngle) * delta * 4;
  }
  // =========================================================================
  // GIAI ĐOẠN 7: XUẤT QUA CỔNG 1, RẼ RA ĐƯỜNG ĐT234 (40.0s - 48.0s)
  // =========================================================================
  else {
    const t = smooth((ct - 40.0) / 8.0);
    doorL.rotation.y = 0;
    doorR.rotation.y = 0;
    if (doorB1) doorB1.targetProgress = 0.0;

    fl.position.set(58.0, 0, -35.6);
    fl.rotation.y = -Math.PI / 2;
    flLift.position.y = activeForklift.initialY;

    if (t < 0.45) {
      const subT = t / 0.45;
      // Tiến qua Cổng DK1: (72, -20) -> (77.5, -20) -> (79, -15)
      truck.position.x = lerp(72.0, 79.0, subT);
      truck.position.z = lerp(-20.0, -15.0, subT);
      truck.rotation.y = lerp(Math.PI / 2, Math.PI * 0.75, subT);
    } else {
      const subT = (t - 0.45) / 0.55;
      // Rẽ ra đường ĐT234 đi về phía Nam: (79, -15) -> (82, 10)
      truck.position.x = lerp(79.0, 82.0, subT);
      truck.position.z = lerp(-15.0, 10.0, subT);
      truck.rotation.y = lerp(Math.PI * 0.75, Math.PI, subT);
    }

    // Barie đóng lại sau khi xe qua cổng
    if (barrier1) {
      barrier1.targetAngle = (t < 0.5) ? Math.PI / 2.3 : 0.0;
    }
    const guardTarget = (t < 0.5) ? 1.0 : 0.0;
    guardSaluteAngle += (guardTarget - guardSaluteAngle) * delta * 4;

    // Khi sắp hết chu kỳ, chuẩn bị sẵn pallet xe điện cho xe nâng ở chu kỳ tiếp theo
    if (t > 0.85) {
      ensureForkliftOutboundPalletLoaded();
    }
  }

  // Cập nhật tư thế chào của Bảo vệ Cổng DK1
  if (guardGate1 && guardGate1.userData.rightArm) {
    guardGate1.userData.rightArm.rotation.x = -guardSaluteAngle * (Math.PI / 1.7);
    guardGate1.userData.rightArm.rotation.z = -guardSaluteAngle * (Math.PI / 4);
  }
}

// Helpers chuyển giao Pallet xe máy điện giữa Xe nâng và Xe tải
function ensureForkliftOutboundPalletLoaded() {
  if (!truckOutboundPallet) {
    truckOutboundPallet = createForkliftPalletCargo('ebikes');
  }
  if (activeForklift && activeForklift.liftGroup) {
    if (truckOutboundPallet.parent !== activeForklift.liftGroup) {
      activeForklift.liftGroup.add(truckOutboundPallet);
    }
    truckOutboundPallet.position.set(1.2, 0.08, 0);
    truckOutboundPallet.rotation.set(0, 0, 0);
  }
}

function attachOutboundPalletToTruck() {
  if (truckOutboundPallet && activeLogisticsTruck && activeLogisticsTruck.truckPalletSlot) {
    if (truckOutboundPallet.parent !== activeLogisticsTruck.truckPalletSlot) {
      activeLogisticsTruck.truckPalletSlot.add(truckOutboundPallet);
    }
    truckOutboundPallet.position.set(0, 0, 0);
    truckOutboundPallet.rotation.set(0, 0, 0);
  }
}

function ensureTruckInboundPalletLoaded() {
  // Tương thích ngược nếu còn lời gọi
  ensureForkliftOutboundPalletLoaded();
}

function attachInboundPalletToForklift() {
  ensureForkliftOutboundPalletLoaded();
}

function detachInboundPalletToWarehouse() {
  // Không cần thiết trong luồng xuất xưởng xe điện
}

function attachOutboundPalletToForklift() {
  ensureForkliftOutboundPalletLoaded();
}

`;

content = content.slice(0, startIndex) + newCycleCode + content.slice(endIndex);

fs.writeFileSync(mainJsPath, content, 'utf8');
console.log('Successfully patched src/main.js with collision-free logistics cycle!');
