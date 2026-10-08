// scripts/patch_block9_logistics_cycle.cjs
const fs = require('fs');
const path = require('path');

const mainPath = path.join(__dirname, '..', 'src', 'main.js');
let code = fs.readFileSync(mainPath, 'utf8');

// 1. Upgrade buildLogisticsAndEquipment()
const oldBuildLogistics = `function buildLogisticsAndEquipment() {
  // Forklift 1 tại Cửa bốc dỡ Nhà B
  createForklift(55, 0, -32, 0, 'forklift1', 'Xe nâng Komatsu #01 (Xưởng B)');

  // Forklift 2 tại Cửa Kho Linh Kiện D2.1 (Vị trí mới theo kho đã dịch chuyển)
  createForklift(-48, 0, -60, Math.PI / 2, 'forklift2', 'Xe nâng Komatsu #02 (Kho D2.1)');

  // Cargo Pallets & Component Crates
  createPalletStack(58, 0, -31);
  createPalletStack(61, 0, -31);
  createPalletStack(-58, 0, -58);
  createPalletStack(-54, 0, -58);

  // Automatic Boom Barriers at Gate 1 & Gate 2
  createGateBarrier(77.5, 0, -20, 0, 'barrierDK1', 'Barie kiểm soát Cổng 1');
  createGateBarrier(-20, 0, -28, Math.PI / 2, 'barrierDK2', 'Barie kiểm soát Cổng 2');

  // Trạm sạc xe máy điện thông minh (DK EV Fast Charging Hubs)
  buildChargingStations();

  // Bãi đỗ xe ô tô công vụ Ban giám đốc & Kỹ thuật
  buildExecutiveParkingCars();

  // Tiện ích công nghiệp (PCCC, Trạm biến áp 560kVA, Thùng rác phân loại)
  buildIndustrialUtilities();
}`;

const newBuildLogistics = `function buildLogisticsAndEquipment() {
  // 1. Xe nâng điện Komatsu hiện đại (Khối 9: Mast thủy lực, càng nâng, cabin & đèn xoay amber)
  // Xe nâng 1 tham gia chu kỳ bốc dỡ tại Xưởng B
  createDetailedForklift(54.0, 0, -32.5, 0, 'forklift1', 'Xe nâng điện Komatsu FB25 #01 (Xưởng B)', { isActiveCycle: true });

  // Xe nâng 2 túc trực bốc dỡ tại Cửa Kho Linh Kiện D2.1
  createDetailedForklift(-48.0, 0, -60.0, Math.PI / 2, 'forklift2', 'Xe nâng điện Komatsu FB25 #02 (Kho D2.1)', { isActiveCycle: false });

  // 2. Xe đầu kéo container 40ft DK Logistics đỗ tại bãi chờ logistics Cổng 1
  create40ftContainerTruck(68.0, 0, -15.0, 0, 'containerHauler1', 'Xe đầu kéo container 40ft DK Logistics');

  // 3. Xe tải giao hàng nhanh 1.5 tấn DK Express tại sân DK2
  create1Point5TonDeliveryTruck(-32.0, 0, -40.0, Math.PI / 2, 'deliveryTruck1', 'Xe tải giao hàng nhanh 1.5T DK Express');

  // 4. Xe đẩy pallet thủy lực thủ công & nhân viên bốc hàng
  createHandPalletJack(62.0, 0, -29.0, -Math.PI / 3, 'palletJack1', 'Xe đẩy pallet thủy lực & Nhân viên kho');

  // 5. Đoàn xe kéo nhỏ chở linh kiện nội bộ phân khu DK2
  createTuggerCartTrain(-42.0, 0, -56.0, 0, 'tuggerTrain1', 'Đoàn xe kéo nhỏ nội bộ DK2');

  // 6. Kệ cantilever chữ A lưu trữ khung xe máy điện hàn sẵn (CKD/SKD)
  createUnassembledFrameRack(64.0, 0, -35.0, Math.PI / 2, 'frameRack1', 'Khu vực khung xe máy điện chờ lắp ráp (CKD/SKD)');
  createUnassembledFrameRack(-52.0, 0, -62.0, 0, 'frameRack2', 'Kệ khung xe đạp điện chưa lắp ráp Kho D2.1');

  // 7. Các chồng pallet gỗ & thùng carton phụ tùng xuất xưởng
  createPalletStack(58, 0, -31);
  createPalletStack(61, 0, -31);
  createPalletStack(-58, 0, -58);
  createPalletStack(-54, 0, -58);

  // Khởi tạo pallet hàng thành phẩm xe điện sẵn trong xưởng B
  warehouseReadyPallet = createForkliftPalletCargo('ebikes');
  warehouseReadyPallet.position.set(53.0, 0.05, -31.5);
  scene.add(warehouseReadyPallet);

  // Automatic Boom Barriers at Gate 1 & Gate 2
  createGateBarrier(77.5, 0, -20, 0, 'barrierDK1', 'Barie kiểm soát Cổng 1');
  createGateBarrier(-20, 0, -28, Math.PI / 2, 'barrierDK2', 'Barie kiểm soát Cổng 2');

  // Trạm sạc xe máy điện thông minh (DK EV Fast Charging Hubs)
  buildChargingStations();

  // Bãi đỗ xe ô tô công vụ Ban giám đốc & Kỹ thuật
  buildExecutiveParkingCars();

  // Tiện ích công nghiệp (PCCC, Trạm biến áp 560kVA, Thùng rác phân loại)
  buildIndustrialUtilities();
}`;

if (code.includes(oldBuildLogistics)) {
  code = code.replace(oldBuildLogistics, newBuildLogistics);
  console.log('Replaced buildLogisticsAndEquipment.');
} else {
  console.log('Could not find oldBuildLogistics exact match, trying regex...');
  code = code.replace(/function buildLogisticsAndEquipment\(\) \{[\s\S]*?buildIndustrialUtilities\(\);\r?\n\}/, newBuildLogistics);
  console.log('Replaced buildLogisticsAndEquipment via regex.');
}

// 2. Upgrade setupVehicles() to create activeLogisticsTruck 5T
const oldSetupVehiclesTruck = `  // 5. Xe tải lớn di chuyển trên đường ĐT234
  animatedTruck = new THREE.Group();
  const truckCab = new THREE.Mesh(
    new THREE.BoxGeometry(2.4, 2.0, 1.8),
    new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.4 })
  );
  truckCab.position.set(0, 1.1, 0);
  truckCab.castShadow = true;
  animatedTruck.add(truckCab);

  const truckCargo = new THREE.Mesh(
    new THREE.BoxGeometry(4.0, 2.4, 2.0),
    new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6 })
  );
  truckCargo.position.set(0, 1.4, -3.2);
  truckCargo.castShadow = true;
  animatedTruck.add(truckCargo);

  animatedTruck.position.set(CONFIG.ROAD_DT234.positionX - 1.5, 0.1, -110);
  scene.add(animatedTruck);`;

const newSetupVehiclesTruck = `  // 5. Xe tải thùng 5 tấn DK Logistics (Khối 9: Cửa mở được, phục vụ chu kỳ bốc xếp khép kín)
  activeLogisticsTruck = create5TonLogisticsTruck(0x0284c7, 'Xe tải logistics 5 tấn DK Bike (5T)');
  animatedTruck = activeLogisticsTruck.truckGroup;
  scene.add(animatedTruck);

  // Pallet hàng nhập ban đầu trên sàn xe
  ensureTruckInboundPalletLoaded();`;

if (code.includes(oldSetupVehiclesTruck)) {
  code = code.replace(oldSetupVehiclesTruck, newSetupVehiclesTruck);
  console.log('Replaced setupVehicles truck creation.');
} else {
  console.log('Could not find oldSetupVehiclesTruck exact match, trying regex...');
  code = code.replace(/\/\/ 5\. Xe tải lớn di chuyển trên đường ĐT234[\s\S]*?scene\.add\(animatedTruck\);/, newSetupVehiclesTruck);
  console.log('Replaced setupVehicles truck creation via regex.');
}

// 3. Add updateLogisticsCycle and pallet helpers
const logisticsCycleCode = `
// ============================================================================
// CHU TRÌNH LOGISTICS LIÊN TỤC KHÉP KÍN (CONTINUOUS LOGISTICS STATE MACHINE)
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

  // =========================================================================
  // GIAI ĐOẠN 1: XE TẢI TIẾN VÀO CỔNG 1 (0.0s - 7.0s)
  // =========================================================================
  if (ct < 7.0) {
    const t = smooth(ct / 7.0);
    // Từ đường ĐT234 (80, 0, 12) rẽ vào Cổng 1 (77.5, 0, -14) -> (74, 0, -20)
    if (t < 0.5) {
      const subT = t / 0.5;
      truck.position.x = lerp(80.0, 77.5, subT);
      truck.position.z = lerp(12.0, -14.0, subT);
      truck.rotation.y = lerp(-Math.PI, -Math.PI * 0.8, subT);
    } else {
      const subT = (t - 0.5) / 0.5;
      truck.position.x = lerp(77.5, 74.0, subT);
      truck.position.z = lerp(-14.0, -20.0, subT);
      truck.rotation.y = lerp(-Math.PI * 0.8, -Math.PI / 2, subT);
    }

    // Barie Cổng 1 tự động nâng lên chào đón xe tải
    const barrier1 = animatedBarriers.find((b) => b.id === 'barrierDK1');
    if (barrier1) barrier1.targetAngle = Math.PI / 2.3;

    // Bảo vệ Cổng 1 giơ tay chào điều lệnh nghiêm trang
    guardSaluteAngle += (1.0 - guardSaluteAngle) * delta * 4;

    // Đóng cửa thùng xe tải & đóng cửa cuốn xưởng B
    doorL.rotation.y = 0;
    doorR.rotation.y = 0;
    if (doorB1) doorB1.targetProgress = 0.0;

    // Xe nâng ở vị trí chờ bên trong Xưởng B
    fl.position.set(54.0, 0, -32.5);
    fl.rotation.y = 0;
    flLift.position.y = activeForklift.initialY;

    // Pallet hàng nhập nằm sẵn trên thùng xe tải
    ensureTruckInboundPalletLoaded();
  }
  // =========================================================================
  // GIAI ĐOẠN 2: CHẠY TỚI SÂN BỐC DỠ XƯỞNG B (7.0s - 13.0s)
  // =========================================================================
  else if (ct < 13.0) {
    const t = smooth((ct - 7.0) / 6.0);
    // Qua cổng vào đường nội bộ: (74, -20) -> (62, -20) -> cua vào trước cửa xưởng (58, -23)
    if (t < 0.6) {
      const subT = t / 0.6;
      truck.position.x = lerp(74.0, 62.0, subT);
      truck.position.z = -20.0;
      truck.rotation.y = -Math.PI / 2;
    } else {
      const subT = (t - 0.6) / 0.4;
      truck.position.x = lerp(62.0, 58.0, subT);
      truck.position.z = lerp(-20.0, -23.0, subT);
      truck.rotation.y = lerp(-Math.PI / 2, -Math.PI, subT);
    }

    // Barie hạ xuống & bảo vệ hạ tay sau khi xe qua
    const barrier1 = animatedBarriers.find((b) => b.id === 'barrierDK1');
    if (barrier1) barrier1.targetAngle = 0;
    guardSaluteAngle += (0.0 - guardSaluteAngle) * delta * 3;

    doorL.rotation.y = 0;
    doorR.rotation.y = 0;
    if (doorB1) doorB1.targetProgress = 0.0;
  }
  // =========================================================================
  // GIAI ĐOẠN 3: LÙI SÁT CỬA BỐC DỠ, MỞ CỬA THÙNG & CUỐN CỬA XƯỞNG (13.0s - 18.0s)
  // =========================================================================
  else if (ct < 18.0) {
    const t = smooth((ct - 13.0) / 5.0);
    // Xe tải lùi từ (58, -23) đuôi hướng về phía Bắc sát Cửa B1 (58, -30.5)
    truck.position.x = 58.0;
    truck.position.z = lerp(-23.0, -30.5, t);
    truck.rotation.y = 0; // Đuôi xe quay về phía Z âm (sát cửa cuốn)

    // Cửa cuốn Xưởng B cuộn mở lên
    if (doorB1) doorB1.targetProgress = Math.min(1.0, t * 1.3);

    // Cửa thùng xe tải mở 2 cánh ra 110 độ
    const doorAngle = smooth(Math.max(0, (t - 0.3) / 0.7)) * 1.95;
    doorL.rotation.y = -doorAngle;
    doorR.rotation.y = doorAngle;

    fl.position.set(54.0, 0, -32.5);
    flLift.position.y = activeForklift.initialY;
  }
  // =========================================================================
  // GIAI ĐOẠN 4: XE NÂNG RA BỐC DỠ PALLET HÀNG NHẬP VÀO KHO (18.0s - 28.0s)
  // =========================================================================
  else if (ct < 28.0) {
    const t = (ct - 18.0) / 10.0;
    truck.position.set(58.0, 0, -30.5);
    truck.rotation.y = 0;
    doorL.rotation.y = -1.95;
    doorR.rotation.y = 1.95;
    if (doorB1) doorB1.targetProgress = 1.0;

    // t: 0.0 -> 0.3: Xe nâng từ (54, -32.5) tiến ra sau thùng xe (58, -31.8)
    if (t < 0.3) {
      const subT = smooth(t / 0.3);
      fl.position.x = lerp(54.0, 58.0, subT);
      fl.position.z = lerp(-32.5, -31.8, subT);
      fl.rotation.y = lerp(0, -Math.PI / 2, subT);
      flLift.position.y = activeForklift.initialY + 0.3; // Nâng càng ngang sàn xe tải
    }
    // t: 0.3 -> 0.5: Luồn càng vào pallet và nâng bổng pallet lên
    else if (t < 0.5) {
      const subT = smooth((t - 0.3) / 0.2);
      fl.position.set(58.0, 0, -31.8);
      fl.rotation.y = -Math.PI / 2;
      flLift.position.y = activeForklift.initialY + 0.3 + subT * 0.35; // Nâng lên khỏi sàn xe

      // Gắn pallet hàng vào càng nâng
      attachInboundPalletToForklift();
    }
    // t: 0.5 -> 0.8: Xe nâng lùi vào trong Xưởng B (53.5, -34.0)
    else if (t < 0.8) {
      const subT = smooth((t - 0.5) / 0.3);
      fl.position.x = lerp(58.0, 53.5, subT);
      fl.position.z = lerp(-31.8, -34.0, subT);
      fl.rotation.y = lerp(-Math.PI / 2, 0, subT);
      flLift.position.y = activeForklift.initialY + 0.65;
    }
    // t: 0.8 -> 1.0: Hạ pallet đặt lên sàn kho Xưởng B
    else {
      const subT = smooth((t - 0.8) / 0.2);
      fl.position.set(53.5, 0, -34.0);
      fl.rotation.y = 0;
      flLift.position.y = activeForklift.initialY + (1 - subT) * 0.65;

      // Đặt pallet vào kho
      if (subT > 0.8) detachInboundPalletToWarehouse();
    }
  }
  // =========================================================================
  // GIAI ĐOẠN 5: XE NÂNG CHUYỂN HÀNG THÀNH PHẨM XUẤT XƯỞNG LÊN XE TẢI (28.0s - 38.0s)
  // =========================================================================
  else if (ct < 38.0) {
    const t = (ct - 28.0) / 10.0;
    truck.position.set(58.0, 0, -30.5);
    truck.rotation.y = 0;
    doorL.rotation.y = -1.95;
    doorR.rotation.y = 1.95;
    if (doorB1) doorB1.targetProgress = 1.0;

    // t: 0.0 -> 0.3: Xe nâng xoay qua kệ hàng thành phẩm (53.0, -31.5) & xúc pallet xe điện
    if (t < 0.3) {
      const subT = smooth(t / 0.3);
      fl.position.x = lerp(53.5, 53.0, subT);
      fl.position.z = lerp(-34.0, -31.5, subT);
      fl.rotation.y = lerp(0, Math.PI / 2, subT);
      flLift.position.y = activeForklift.initialY + subT * 0.45;
      attachOutboundPalletToForklift();
    }
    // t: 0.3 -> 0.6: Chở pallet thành phẩm tiến ra đuôi xe tải (58, -31.8)
    else if (t < 0.6) {
      const subT = smooth((t - 0.3) / 0.3);
      fl.position.x = lerp(53.0, 58.0, subT);
      fl.position.z = lerp(-31.5, -31.8, subT);
      fl.rotation.y = lerp(Math.PI / 2, -Math.PI / 2, subT);
      flLift.position.y = activeForklift.initialY + 0.6;
    }
    // t: 0.6 -> 0.8: Đặt pallet thành phẩm vào thùng xe tải
    else if (t < 0.8) {
      const subT = smooth((t - 0.6) / 0.2);
      fl.position.set(58.0, 0, -31.8);
      fl.rotation.y = -Math.PI / 2;
      flLift.position.y = activeForklift.initialY + 0.6 - subT * 0.3; // Đặt chạm sàn xe

      if (subT > 0.8) attachOutboundPalletToTruck();
    }
    // t: 0.8 -> 1.0: Xe nâng lùi về vị trí nghỉ bên trong Xưởng B
    else {
      const subT = smooth((t - 0.8) / 0.2);
      fl.position.x = lerp(58.0, 54.0, subT);
      fl.position.z = lerp(-31.8, -32.5, subT);
      fl.rotation.y = lerp(-Math.PI / 2, 0, subT);
      flLift.position.y = activeForklift.initialY;
    }
  }
  // =========================================================================
  // GIAI ĐOẠN 6: ĐÓNG CỬA THÙNG & HẠ CỬA CUỐN XƯỞNG B (38.0s - 42.0s)
  // =========================================================================
  else if (ct < 42.0) {
    const t = smooth((ct - 38.0) / 4.0);
    truck.position.set(58.0, 0, -30.5);
    truck.rotation.y = 0;

    // 2 Cánh cửa thùng xe tải khép chặt
    doorL.rotation.y = -1.95 * (1 - t);
    doorR.rotation.y = 1.95 * (1 - t);

    // Cửa cuốn Xưởng B cuộn hạ xuống
    if (doorB1) doorB1.targetProgress = 1.0 - t;

    fl.position.set(54.0, 0, -32.5);
    fl.rotation.y = 0;
    flLift.position.y = activeForklift.initialY;
  }
  // =========================================================================
  // GIAI ĐOẠN 7: XE TẢI RỜI BÃI BỐC DỠ, XUẤT CỔNG 1 RA ĐT234 (42.0s - 48.0s)
  // =========================================================================
  else {
    const t = smooth((ct - 42.0) / 6.0);
    doorL.rotation.y = 0;
    doorR.rotation.y = 0;
    if (doorB1) doorB1.targetProgress = 0.0;

    // Xe tải tiến ra khỏi xưởng: (58, -30.5) -> (58, -23) -> cua ra đường nội bộ (68, -20) -> Cổng 1 (74, -20) -> ĐT234 (80, 5)
    if (t < 0.3) {
      const subT = t / 0.3;
      truck.position.x = 58.0;
      truck.position.z = lerp(-30.5, -23.0, subT);
      truck.rotation.y = 0;
    } else if (t < 0.6) {
      const subT = (t - 0.3) / 0.3;
      truck.position.x = lerp(58.0, 68.0, subT);
      truck.position.z = lerp(-23.0, -20.0, subT);
      truck.rotation.y = lerp(0, Math.PI / 2, subT);
    } else {
      const subT = (t - 0.6) / 0.4;
      truck.position.x = lerp(68.0, 80.0, subT);
      truck.position.z = lerp(-20.0, 5.0, subT);
      truck.rotation.y = lerp(Math.PI / 2, Math.PI, subT);
    }

    // Barie Cổng 1 mở lên & bảo vệ chào khi xe tải xuất xưởng
    const barrier1 = animatedBarriers.find((b) => b.id === 'barrierDK1');
    if (barrier1) barrier1.targetAngle = t < 0.85 ? Math.PI / 2.3 : 0;
    guardSaluteAngle += ((t < 0.85 ? 1.0 : 0.0) - guardSaluteAngle) * delta * 4;
  }

  // Cập nhật tư thế chào của Bảo vệ Cổng DK1
  if (guardGate1 && guardGate1.userData.rightArm) {
    guardGate1.userData.rightArm.rotation.x = -guardSaluteAngle * (Math.PI / 1.7);
    guardGate1.userData.rightArm.rotation.z = -guardSaluteAngle * (Math.PI / 4);
  }
}

// Helpers chuyển giao Pallet giữa Xe tải, Xe nâng và Kho xưởng
function ensureTruckInboundPalletLoaded() {
  if (!truckInboundPallet) {
    truckInboundPallet = createForkliftPalletCargo('components');
  }
  if (activeLogisticsTruck && activeLogisticsTruck.truckPalletSlot) {
    if (truckInboundPallet.parent !== activeLogisticsTruck.truckPalletSlot) {
      activeLogisticsTruck.truckPalletSlot.add(truckInboundPallet);
      truckInboundPallet.position.set(0, 0, 0);
      truckInboundPallet.rotation.set(0, 0, 0);
    }
  }
}

function attachInboundPalletToForklift() {
  if (truckInboundPallet && activeForklift && activeForklift.liftGroup) {
    if (truckInboundPallet.parent !== activeForklift.liftGroup) {
      activeForklift.liftGroup.add(truckInboundPallet);
      truckInboundPallet.position.set(0.68, 0.08, 0);
      truckInboundPallet.rotation.set(0, 0, 0);
    }
  }
}

function detachInboundPalletToWarehouse() {
  if (truckInboundPallet) {
    if (!warehouseStoredPallet) {
      warehouseStoredPallet = truckInboundPallet;
    }
    if (warehouseStoredPallet.parent !== scene) {
      scene.add(warehouseStoredPallet);
      warehouseStoredPallet.position.set(53.5, 0.05, -34.0);
      warehouseStoredPallet.rotation.set(0, 0, 0);
    }
  }
}

function attachOutboundPalletToForklift() {
  if (!truckOutboundPallet) {
    truckOutboundPallet = createForkliftPalletCargo('ebikes');
  }
  if (activeForklift && activeForklift.liftGroup) {
    if (truckOutboundPallet.parent !== activeForklift.liftGroup) {
      activeForklift.liftGroup.add(truckOutboundPallet);
      truckOutboundPallet.position.set(0.68, 0.08, 0);
      truckOutboundPallet.rotation.set(0, 0, 0);
    }
  }
}

function attachOutboundPalletToTruck() {
  if (truckOutboundPallet && activeLogisticsTruck && activeLogisticsTruck.truckPalletSlot) {
    if (truckOutboundPallet.parent !== activeLogisticsTruck.truckPalletSlot) {
      activeLogisticsTruck.truckPalletSlot.add(truckOutboundPallet);
      truckOutboundPallet.position.set(0, 0, 0);
      truckOutboundPallet.rotation.set(0, 0, 0);
    }
  }
}
`;

if (!code.includes('function updateLogisticsCycle(')) {
  code = code.replace('function setupTrain() {', logisticsCycleCode + '\nfunction setupTrain() {');
  console.log('Inserted updateLogisticsCycle and pallet helpers.');
}

// 4. Update the render loop to call updateLogisticsCycle
const oldTruckLoop = `  // 2. Xe tải di chuyển trên ĐT234
  if (animatedTruck) {
    truckProgress += delta * 14;
    if (truckProgress > 150) truckProgress = 0;
    animatedTruck.position.z = -120 + truckProgress;
  }`;

const newTruckLoop = `  // 2. Hoạt cảnh Logistics khép kín: Xe tải 5T, Xe nâng Komatsu, Cửa cuốn & Barie tự động (Khối 9)
  updateLogisticsCycle(delta, time, isNight);`;

if (code.includes(oldTruckLoop)) {
  code = code.replace(oldTruckLoop, newTruckLoop);
  console.log('Hooked updateLogisticsCycle into render loop.');
} else {
  console.log('Could not find oldTruckLoop exact match, trying regex...');
  code = code.replace(/\/\/ 2\. Xe tải di chuyển trên ĐT234[\s\S]*?animatedTruck\.position\.z = -120 \+ truckProgress;\r?\n  \}/, newTruckLoop);
  console.log('Hooked updateLogisticsCycle via regex.');
}

fs.writeFileSync(mainPath, code, 'utf8');
console.log('Step 3 finished successfully.');
