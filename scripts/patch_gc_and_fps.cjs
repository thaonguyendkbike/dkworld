// scripts/patch_gc_and_fps.cjs
const fs = require('fs');
const path = require('path');

const mainPath = path.join(__dirname, '..', 'src', 'main.js');
let content = fs.readFileSync(mainPath, 'utf8');

// Normalize to LF for easy editing, then restore CRLF if needed
const hadCRLF = content.includes('\r\n');
content = content.replace(/\r\n/g, '\n');

// 1. Hoist in updateLabels
const oldLabelsBlock = `function updateLabels() {
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

const newLabelsBlock = `const _tempLabelV = new THREE.Vector3();

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

if (content.includes(oldLabelsBlock)) {
  content = content.replace(oldLabelsBlock, newLabelsBlock);
  console.log('1. Hoisted tempV in updateLabels!');
} else {
  console.log('1. Warning: oldLabelsBlock not found');
}

// 2. Hoist in updateCuteSpeechBubbles
const oldSpeechBlock = `  if (activeSpeechBubbles.length === 0) return;

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
    if (tempV.z > 1.0) {
      b.el.style.display = 'none';
      continue;
    }

    const sx = (tempV.x * 0.5 + 0.5) * window.innerWidth;
    const sy = (-(tempV.y * 0.5) + 0.5) * window.innerHeight;`;

const newSpeechBlock = `  if (activeSpeechBubbles.length === 0) return;

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
    if (_tempSpeechV.z > 1.0) {
      b.el.style.display = 'none';
      continue;
    }

    const sx = (_tempSpeechV.x * 0.5 + 0.5) * window.innerWidth;
    const sy = (-(_tempSpeechV.y * 0.5) + 0.5) * window.innerHeight;`;

const speechFuncMarker = 'function updateCuteSpeechBubbles(delta) {';
if (content.includes(speechFuncMarker)) {
  content = content.replace(
    speechFuncMarker,
    'const _tempSpeechWorldPos = new THREE.Vector3();\nconst _tempSpeechV = new THREE.Vector3();\n\n' + speechFuncMarker
  );
  if (content.includes(oldSpeechBlock)) {
    content = content.replace(oldSpeechBlock, newSpeechBlock);
    console.log('2. Hoisted Vector3 in updateCuteSpeechBubbles!');
  }
}

// 3. Add 60 FPS frame throttle to animate()
const oldAnimateBlock = `let lastTime = performance.now();

function animate(time) {
  requestAnimationFrame(animate);

  const currentTime = typeof time === 'number' ? time : performance.now();
  const rawDelta = (currentTime - lastTime) / 1000;
  const delta = (!isNaN(rawDelta) && rawDelta > 0) ? Math.min(rawDelta, 0.1) : 0.016;
  lastTime = currentTime;`;

const newAnimateBlock = `let lastTime = performance.now();
let lastFrameTime = 0;
const frameInterval = 1000 / 60; // Giới hạn max 60 FPS tránh ngốn tài nguyên trên màn 144Hz/240Hz

function animate(time) {
  requestAnimationFrame(animate);

  const currentTime = typeof time === 'number' ? time : performance.now();
  if (currentTime - lastFrameTime < frameInterval - 1) return; // Bỏ qua render thừa nếu chưa đủ thời gian 1 frame
  lastFrameTime = currentTime;

  const rawDelta = (currentTime - lastTime) / 1000;
  const delta = (!isNaN(rawDelta) && rawDelta > 0) ? Math.min(rawDelta, 0.1) : 0.016;
  lastTime = currentTime;`;

if (content.includes(oldAnimateBlock)) {
  content = content.replace(oldAnimateBlock, newAnimateBlock);
  console.log('3. Added 60 FPS throttle in animate()!');
}

if (hadCRLF) {
  content = content.replace(/\n/g, '\r\n');
}

fs.writeFileSync(mainPath, content, 'utf8');
console.log('Patched main.js successfully.');
