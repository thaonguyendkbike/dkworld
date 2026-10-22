const fs = require('fs');
const path = require('path');

const mainJsPath = path.join(__dirname, '..', 'src', 'main.js');
let code = fs.readFileSync(mainJsPath, 'utf8');

const startMarker = '// 1. Họa tiết sóng gợn đáy nước tự nhiên';
const endMarker = 'waterCol = mix(waterCol, uFoamColor, foam);';

const sIdx = code.indexOf(startMarker);
const eIdx = code.indexOf(endMarker, sIdx);

console.log('sIdx:', sIdx, 'eIdx:', eIdx);
if (sIdx !== -1 && eIdx !== -1) {
  const replacement = `// 1. Họa tiết sóng gợn đáy nước êm dịu, nhẹ nhàng (mặt nước tĩnh tại, êm đềm, triệt tiêu toàn bộ hạt kim cương li ti)
        float c1 = sin(vWorldPosition.x * 1.2 + uTime * 0.7) * cos(vWorldPosition.z * 1.2 - uTime * 0.6);
        float c2 = cos(vWorldPosition.x * 1.8 - uTime * 0.8) * sin(vWorldPosition.z * 1.8 + uTime * 0.7);
        float caustic = pow(clamp((c1 + c2) * 0.5 + 0.5, 0.0, 1.0), 2.2) * 0.08;
        waterCol += caustic * vec3(0.55, 0.85, 1.0);

        // 2. Dải viền bọt cát trắng mịn ôm bờ nhẹ nhàng
        float shoreEdge = (uIsCurvedCanal > 0.5) ? abs(vUv.x - 0.5) * 2.0 : length(vUv - vec2(0.5)) * 2.0;
        float foam = smoothstep(0.92, 0.99, shoreEdge) * 0.65;
        waterCol = mix(waterCol, uFoamColor, foam);`;

  code = code.slice(0, sIdx) + replacement + code.slice(eIdx + endMarker.length);
  fs.writeFileSync(mainJsPath, code, 'utf8');
  console.log('Successfully replaced water shader to remove all glitter!');
} else {
  console.error('Could not find markers');
}
