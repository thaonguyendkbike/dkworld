// scripts/apply_shadow_perf.cjs
const fs = require('fs');
const path = require('path');

const mainPath = path.join(__dirname, '..', 'src', 'main.js');
let content = fs.readFileSync(mainPath, 'utf8');

// 1. Change PCFSoftShadowMap to PCFShadowMap and enable autoUpdate throttling
content = content.replace(
  /renderer\.shadowMap\.type\s*=\s*THREE\.PCFSoftShadowMap;/,
  'renderer.shadowMap.type = THREE.PCFShadowMap;\n  renderer.shadowMap.autoUpdate = false;\n  renderer.shadowMap.needsUpdate = true;'
);

// 2. Throttle shadow map update in animate()
const animNeedUpdate = `  // Render scene
  if (frameCount % 4 === 0) {
    renderer.shadowMap.needsUpdate = true;
  }
  renderer.render(scene, camera);`;

content = content.replace('  // Render scene\n  renderer.render(scene, camera);', animNeedUpdate);
content = content.replace('  // Render scene\r\n  renderer.render(scene, camera);', animNeedUpdate);

// 3. In setEnvironment, ensure shadow updates
content = content.replace(
  'function setEnvironment(time) {',
  'function setEnvironment(time) {\n  renderer.shadowMap.needsUpdate = true;'
);

fs.writeFileSync(mainPath, content, 'utf8');
console.log('Shadow performance optimizations applied!');
