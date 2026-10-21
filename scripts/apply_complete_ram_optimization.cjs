// scripts/apply_complete_ram_optimization.cjs
const fs = require('fs');
const path = require('path');

const mainPath = path.join(__dirname, '..', 'src', 'main.js');
let mainCode = fs.readFileSync(mainPath, 'utf8');

// 1. Hoist Vector3 in updateLabels
const oldUpdateLabels = `function updateLabels() {
  if (!showLabels) {
    labelElements.forEach((l) => (l.el.style.display = 'none'));
    return;
  }

  const tempV = new THREE.Vector3();
  const camPos = camera.position;

  labelElements.forEach((l) => {
    tempV.copy(l.worldPos);
    tempV.project(camera);

    if (tempV.z > 1) {
      l.el.style.display = 'none';
      return;
    }

    const x = (tempV.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-(tempV.y * 0.5) + 0.5) * window.innerHeight;`;

const newUpdateLabels = `const _tempLabelV = new THREE.Vector3();

function updateLabels() {
  if (!showLabels) {
    labelElements.forEach((l) => (l.el.style.display = 'none'));
    return;
  }

  const camPos = camera.position;

  labelElements.forEach((l) => {
    _tempLabelV.copy(l.worldPos);
    _tempLabelV.project(camera);

    if (_tempLabelV.z > 1) {
      l.el.style.display = 'none';
      return;
    }

    const x = (_tempLabelV.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-(_tempLabelV.y * 0.5) + 0.5) * window.innerHeight;`;

if (mainCode.includes(oldUpdateLabels)) {
  mainCode = mainCode.replace(oldUpdateLabels, newUpdateLabels);
  console.log('1. Hoisted Vector3 in updateLabels successfully!');
}

// 2. Hoist Vector3 in updateCuteSpeechBubbles
const oldUpdateSpeech = `function updateCuteSpeechBubbles(delta) {
  // Đếm ngược xuất hiện bubble tiếp theo
  nextSpeechTimer -= delta;
  if (nextSpeechTimer <= 0) {
    triggerRandomSpeechBubble();
    // Thời gian giãn cách ngẫu nhiên từ 4.5s đến 7.5s
    nextSpeechTimer = 4.5 + Math.random() * 3.0;
  }

  if (activeSpeechBubbles.length === 0) return;

  const tempWorldPos = new THREE.Vector3();
  const tempV = new THREE.Vector3();

  for (let i = activeSpeechBubbles.length - 1; i >= 0; i--) {
    const b = activeSpeechBubbles[i];
    b.ttl -= delta;

    // Kích hoạt animation biến mất khi sắp hết hạn (còn 0.35s)
    if (b.ttl <= 0.35 && !b.leaving) {
      b.leaving = true;
      b.el.classList.add('is-leaving');
    }

    // Khi hết hạn hoàn toàn, xóa khỏi DOM
    if (b.ttl <= 0) {
      b.el.remove();
      activeSpeechBubbles.splice(i, 1);
      continue;
    }

    // Tính toán vị trí 3D -> 2D màn hình
    b.speakerMesh.getWorldPosition(tempWorldPos);
    tempWorldPos.y += b.heightOffset;

    tempV.copy(tempWorldPos);
    tempV.project(camera);

    // Nếu nằm sau camera thì ẩn tạm
    if (tempV.z > 1.0) {`;

const newUpdateSpeech = `const _tempSpeechWorldPos = new THREE.Vector3();
const _tempSpeechV = new THREE.Vector3();

function updateCuteSpeechBubbles(delta) {
  // Đếm ngược xuất hiện bubble tiếp theo
  nextSpeechTimer -= delta;
  if (nextSpeechTimer <= 0) {
    triggerRandomSpeechBubble();
    // Thời gian giãn cách ngẫu nhiên từ 4.5s đến 7.5s
    nextSpeechTimer = 4.5 + Math.random() * 3.0;
  }

  if (activeSpeechBubbles.length === 0) return;

  for (let i = activeSpeechBubbles.length - 1; i >= 0; i--) {
    const b = activeSpeechBubbles[i];
    b.ttl -= delta;

    // Kích hoạt animation biến mất khi sắp hết hạn (còn 0.35s)
    if (b.ttl <= 0.35 && !b.leaving) {
      b.leaving = true;
      b.el.classList.add('is-leaving');
    }

    // Khi hết hạn hoàn toàn, xóa khỏi DOM
    if (b.ttl <= 0) {
      b.el.remove();
      activeSpeechBubbles.splice(i, 1);
      continue;
    }

    // Tính toán vị trí 3D -> 2D màn hình (Tái sử dụng vector tĩnh)
    b.speakerMesh.getWorldPosition(_tempSpeechWorldPos);
    _tempSpeechWorldPos.y += b.heightOffset;

    _tempSpeechV.copy(_tempSpeechWorldPos);
    _tempSpeechV.project(camera);

    // Nếu nằm sau camera thì ẩn tạm
    if (_tempSpeechV.z > 1.0) {`;

if (mainCode.includes(oldUpdateSpeech)) {
  mainCode = mainCode.replace(oldUpdateSpeech, newUpdateSpeech);
  // Also replace any remaining tempV inside updateCuteSpeechBubbles
  const bubbleStart = mainCode.indexOf('function updateCuteSpeechBubbles');
  const bubbleEnd = mainCode.indexOf('// ============================================================================', bubbleStart);
  if (bubbleStart !== -1 && bubbleEnd !== -1) {
    let bubbleBody = mainCode.slice(bubbleStart, bubbleEnd);
    bubbleBody = bubbleBody.replace(/\btempV\b/g, '_tempSpeechV');
    bubbleBody = bubbleBody.replace(/\btempWorldPos\b/g, '_tempSpeechWorldPos');
    mainCode = mainCode.slice(0, bubbleStart) + bubbleBody + mainCode.slice(bubbleEnd);
  }
  console.log('2. Hoisted Vector3 in updateCuteSpeechBubbles successfully!');
}

// 3. Optimize animate() loop to cap at 60 FPS (prevents high refresh rate screens from running 144Hz-240Hz and eating GPU/RAM)
const oldAnimate = `function animate(time) {
  requestAnimationFrame(animate);

  const currentTime = typeof time === 'number' ? time : performance.now();
  const rawDelta = (currentTime - lastTime) / 1000;
  const delta = (!isNaN(rawDelta) && rawDelta > 0) ? Math.min(rawDelta, 0.1) : 0.016;
  lastTime = currentTime;`;

const newAnimate = `let lastFrameTimestamp = 0;
const targetFrameInterval = 1000 / 60; // Tối ưu giới hạn max 60 FPS tránh ngốn RAM/GPU trên màn 144Hz/240Hz

function animate(time) {
  requestAnimationFrame(animate);

  const currentTime = typeof time === 'number' ? time : performance.now();
  const elapsedSinceLast = currentTime - lastFrameTimestamp;
  if (elapsedSinceLast < targetFrameInterval - 1) return; // Skip frame nếu vượt quá 60 FPS
  lastFrameTimestamp = currentTime;

  const rawDelta = (currentTime - lastTime) / 1000;
  const delta = (!isNaN(rawDelta) && rawDelta > 0) ? Math.min(rawDelta, 0.1) : 0.016;
  lastTime = currentTime;`;

if (mainCode.includes(oldAnimate)) {
  mainCode = mainCode.replace(oldAnimate, newAnimate);
  console.log('3. Added 60 FPS framerate throttle to animate() successfully!');
}

// 4. Ensure pixel ratio is capped at 1.25 for crisp rendering with 50% less RAM
mainCode = mainCode.replace(
  /renderer\.setPixelRatio\(Math\.min\(window\.devicePixelRatio,\s*2\)\);/g,
  'renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));'
);

// 5. Ensure shadow map size is 2048x2048
mainCode = mainCode.replace(/dirLight\.shadow\.mapSize\.width\s*=\s*4096;/, 'dirLight.shadow.mapSize.width = 2048;');
mainCode = mainCode.replace(/dirLight\.shadow\.mapSize\.height\s*=\s*4096;/, 'dirLight.shadow.mapSize.height = 2048;');

fs.writeFileSync(mainPath, mainCode, 'utf8');
console.log('Finished writing optimizations to src/main.js');
