// scripts/test_patch_points.cjs
const fs = require('fs');
const path = require('path');

const mainPath = path.join(__dirname, '..', 'src', 'main.js');
let content = fs.readFileSync(mainPath, 'utf8');

console.log('main.js length:', content.length);

const hasAnimatedTruckVar = content.includes('let animatedTruck, truckProgress = 0;');
console.log('hasAnimatedTruckVar:', hasAnimatedTruckVar);

const hasBuildLogistics = content.includes('function buildLogisticsAndEquipment() {');
console.log('hasBuildLogistics:', hasBuildLogistics);

const hasCreateGateBarrier = content.includes('function createGateBarrier(x, y, z, rotY, id, name) {');
console.log('hasCreateGateBarrier:', hasCreateGateBarrier);

const hasGuard1 = content.includes('const guard1 = createCharacter({');
console.log('hasGuard1:', hasGuard1);

const hasSetupVehiclesTruck = content.includes('// 5. Xe tải lớn di chuyển trên đường ĐT234');
console.log('hasSetupVehiclesTruck:', hasSetupVehiclesTruck);

const hasTruckAnimLoop = content.includes('// 2. Xe tải di chuyển trên ĐT234');
console.log('hasTruckAnimLoop:', hasTruckAnimLoop);

const hasForkliftAnimLoop = content.includes('// 15. Xe nâng hàng: Hoạt cảnh càng nâng nâng hạ pallet hàng (Animated Forklifts)');
console.log('hasForkliftAnimLoop:', hasForkliftAnimLoop);

const hasBarrierAnimLoop = content.includes('// 16. Barie cổng tự động: Cần chắn mở lên khi xe tải chạy qua (Animated Barriers)');
console.log('hasBarrierAnimLoop:', hasBarrierAnimLoop);
