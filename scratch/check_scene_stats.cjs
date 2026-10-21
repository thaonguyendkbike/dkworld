// scratch/check_scene_stats.cjs
// Let's run headless or check main.js for how many meshes / materials are instantiated
const fs = require('fs');
const path = require('path');

const mainCode = fs.readFileSync(path.join(__dirname, '..', 'src', 'main.js'), 'utf8');

const newMeshMatches = mainCode.match(/new THREE\.Mesh\(/g) || [];
const newMatMatches = mainCode.match(/new THREE\.Mesh[A-Za-z]+Material\(/g) || [];
const newGeoMatches = mainCode.match(/new THREE\.[A-Za-z]+Geometry\(/g) || [];
const instancedMatches = mainCode.match(/new THREE\.InstancedMesh\(/g) || [];

console.log('Total "new THREE.Mesh" calls in code:', newMeshMatches.length);
console.log('Total "new Material" calls in code:', newMatMatches.length);
console.log('Total "new Geometry" calls in code:', newGeoMatches.length);
console.log('Total "new InstancedMesh" calls in code:', instancedMatches.length);

// Check loops that instantiate new objects
const lines = mainCode.split('\n');
let insideLoop = false;
let loopNewMeshes = 0;
let loopNewMaterials = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (/for\s*\(|while\s*\(|\.forEach\(/.test(line)) {
    insideLoop = true;
  }
  if (insideLoop) {
    if (/new THREE\.Mesh\(/.test(line)) loopNewMeshes++;
    if (/new THREE\.Mesh[A-Za-z]+Material\(/.test(line)) loopNewMaterials++;
  }
  if (line.includes('}')) {
    // rough heuristic
  }
}

console.log('Loop new meshes estimate:', loopNewMeshes);
console.log('Loop new materials estimate:', loopNewMaterials);
