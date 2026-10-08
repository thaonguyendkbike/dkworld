// scripts/patch_block9_logistics.cjs
const fs = require('fs');
const path = require('path');

const mainPath = path.join(__dirname, '..', 'src', 'main.js');
let content = fs.readFileSync(mainPath, 'utf8');

console.log('Original length of src/main.js:', content.length);

// 1. Add module-level variables for Khối 9
const varTarget = 'let animatedTruck, truckProgress = 0;';
const varReplacement = `let animatedTruck, truckProgress = 0;
// Khối 9: Logistics, Forklifts & Truck Fleet
let activeLogisticsTruck = null;
let activeForklift = null;
let activeForkliftInitialPos = { x: 54.0, y: 0, z: -32.5, rotY: 0 };
let logisticsCycleTime = 0;
let guardGate1 = null;
let guardSaluteAngle = 0;
let truckInboundPallet = null;
let truckOutboundPallet = null;
let warehouseStoredPallet = null;
let warehouseReadyPallet = null;
let rotatingBeacons = [];
let logisticsTruckLights = [];
let logisticsSafetySlowdown = 1.0;`;

if (!content.includes('let activeLogisticsTruck = null;')) {
  content = content.replace(varTarget, varReplacement);
  console.log('1. Added Khối 9 module variables.');
}

// 2. Save id in animatedBarriers.push
const barrierTarget = 'animatedBarriers.push({ armPivot, currentAngle: 0, targetAngle: 0, x, z });';
const barrierReplacement = 'animatedBarriers.push({ armPivot, currentAngle: 0, targetAngle: 0, x, z, id });';
if (content.includes(barrierTarget)) {
  content = content.replace(barrierTarget, barrierReplacement);
  console.log('2. Updated animatedBarriers.push to store id.');
}

// 3. Store guardGate1 reference
const guardTarget = `  const guard1 = createCharacter({ shirtColor: 0x1e293b, pantsColor: 0x0f172a, hatColor: 0x1e293b });
  guard1.position.set(74.5, 0, -21.5);
  guard1.rotation.y = -Math.PI / 2;
  guard1.userData = {`;
const guardReplacement = `  const guard1 = createCharacter({ shirtColor: 0x1e293b, pantsColor: 0x0f172a, hatColor: 0x1e293b });
  guardGate1 = guard1;
  guard1.position.set(74.5, 0, -21.5);
  guard1.rotation.y = -Math.PI / 2;
  guard1.userData = {`;

if (content.includes(guardTarget) && !content.includes('guardGate1 = guard1;')) {
  content = content.replace(guardTarget, guardReplacement);
  console.log('3. Stored guardGate1 reference.');
}

fs.writeFileSync(mainPath, content, 'utf8');
console.log('Step 1 applied successfully.');
