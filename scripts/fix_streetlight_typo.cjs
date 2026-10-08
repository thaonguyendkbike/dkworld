const fs = require('fs');
const path = require('path');

const mainPath = path.join(__dirname, '..', 'src', 'main.js');
let code = fs.readFileSync(mainPath, 'utf8');

code = code.replace(
  'const lamp = createStreetLight(lx, 0, roadCenterZ - roadWidth / 2 - 1.2, 0);\r\n    group.add(lamp);',
  'createStreetlight(lx, 0, roadCenterZ - roadWidth / 2 - 1.2);'
);

// Also in case LF without CR
code = code.replace(
  'const lamp = createStreetLight(lx, 0, roadCenterZ - roadWidth / 2 - 1.2, 0);\n    group.add(lamp);',
  'createStreetlight(lx, 0, roadCenterZ - roadWidth / 2 - 1.2);'
);

fs.writeFileSync(mainPath, code, 'utf8');
console.log('Fixed createStreetlight typo.');
