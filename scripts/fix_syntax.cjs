const fs = require('fs');
const path = require('path');

const mainPath = path.join(__dirname, '..', 'src', 'main.js');
let code = fs.readFileSync(mainPath, 'utf8');

code = code.replace(
  'const hx2 = CONFIG.HILLS.dk2NewHill.position.x; // -142',
  '// 2. Đồi mới sinh thái\r\n  if (CONFIG.HILLS.dk2NewHill) {\r\n    const hx2 = CONFIG.HILLS.dk2NewHill.position.x; // -142'
);

fs.writeFileSync(mainPath, code, 'utf8');
console.log('Fixed syntax error in getDK2HillSurfaceY.');
