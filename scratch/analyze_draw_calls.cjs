const fs = require('fs');
const path = require('path');

const mainCode = fs.readFileSync(path.join(__dirname, '..', 'src', 'main.js'), 'utf8');

// Find all function declarations and count new THREE.Mesh inside each function
const funcRegex = /function\s+([A-Za-z0-9_]+)\s*\(/g;
let match;
const functions = [];
while ((match = funcRegex.exec(mainCode)) !== null) {
  functions.push({ name: match.name || match[1], index: match.index });
}

const results = [];
for (let i = 0; i < functions.length; i++) {
  const start = functions[i].index;
  const end = i < functions.length - 1 ? functions[i + 1].index : mainCode.length;
  const body = mainCode.slice(start, end);
  const meshCount = (body.match(/new THREE\.Mesh\(/g) || []).length;
  const loopCount = (body.match(/for\s*\(|while\s*\(/g) || []).length;
  if (meshCount > 0) {
    results.push({ name: functions[i].name, meshCount, loopCount, length: body.length });
  }
}

results.sort((a, b) => b.meshCount - a.meshCount);
console.log('Top functions by new THREE.Mesh count:');
console.table(results.slice(0, 25));
