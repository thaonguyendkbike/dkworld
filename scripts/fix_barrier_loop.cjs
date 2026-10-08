// scripts/fix_barrier_loop.cjs
const fs = require('fs');
const path = require('path');

const mainPath = path.join(__dirname, '..', 'src', 'main.js');
let code = fs.readFileSync(mainPath, 'utf8');

const oldBarrierBlock = `  // 16. Barie cổng tự động: Cần chắn mở lên khi xe tải chạy qua (Animated Barriers)
  const truckZ = animatedTruck ? animatedTruck.position.z : -100;
  const isNearGate1 = Math.abs(truckZ - (-20)) < 16;
  const isNearGate2 = Math.abs(truckZ - (-28)) < 16;

  animatedBarriers.forEach((b) => {
    const shouldOpen = (b.id === 'barrierDK1' && isNearGate1) || (b.id === 'barrierDK2' && isNearGate2);
    b.targetAngle = shouldOpen ? Math.PI / 2.3 : 0;
    b.currentAngle += (b.targetAngle - b.currentAngle) * delta * 4;
    b.armPivot.rotation.z = b.currentAngle;
  });`;

const newBarrierBlock = `  // 16. Barie cổng tự động: Cần chắn xoay mượt mà theo targetAngle (Animated Barriers)
  animatedBarriers.forEach((b) => {
    // Nếu là Cổng 2, mở khi xe bán tải DK2 đến gần
    if (b.id === 'barrierDK2') {
      const isNearGate2 = animatedTruck && Math.abs(animatedTruck.position.x - (-20)) < 12;
      b.targetAngle = isNearGate2 ? Math.PI / 2.3 : 0;
    }
    // Cổng 1 (barrierDK1) được điều khiển chính xác theo chu trình Logistics trong updateLogisticsCycle()
    b.currentAngle += (b.targetAngle - b.currentAngle) * delta * 4;
    b.armPivot.rotation.z = b.currentAngle;
  });`;

if (code.includes(oldBarrierBlock)) {
  code = code.replace(oldBarrierBlock, newBarrierBlock);
  console.log('Replaced barrier block exact match.');
} else {
  code = code.replace(/\/\/ 16\. Barie cổng tự động[\s\S]*?b\.armPivot\.rotation\.z = b\.currentAngle;\r?\n  \}\);/, newBarrierBlock);
  console.log('Replaced barrier block via regex.');
}

fs.writeFileSync(mainPath, code, 'utf8');
