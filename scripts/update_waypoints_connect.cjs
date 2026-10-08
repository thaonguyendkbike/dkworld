// scripts/update_waypoints_connect.cjs
const fs = require('fs');
const path = require('path');

const mainPath = path.join(__dirname, '..', 'src', 'main.js');
let code = fs.readFileSync(mainPath, 'utf8');

const oldWaypointsEnd = `  // Đồi sinh thái DK2
  { id: 19, x: -108, y: 15.8, z: -82, neighbors: [18] },        // Đỉnh đồi Vườn Lan & Ao cá
  { id: 20, x: -142, y: 15.5, z: -38, neighbors: [18] },        // Đỉnh Đồi Gà & Tháp bồ câu
];`;

const newWaypointsEnd = `  // Đồi sinh thái DK2
  { id: 19, x: -108, y: 15.8, z: -82, neighbors: [18] },        // Đỉnh đồi Vườn Lan & Ao cá
  { id: 20, x: -142, y: 15.5, z: -38, neighbors: [18] },        // Đỉnh Đồi Gà & Tháp bồ câu

  // Tuyến đường & Cổng kết nối mới đối diện Cổng DK2 (Gate 1B <-> Nhà A)
  { id: 21, x: -10.0, y: 0, z: -25.5, neighbors: [11, 22] },    // Vạch đi bộ ĐT234 nối thẳng 2 cổng
  { id: 22, x: -6.0, y: 0, z: -25.5, neighbors: [21, 23] },     // Cổng kết nối 1B
  { id: 23, x: 4.0, y: 0, z: -25.5, neighbors: [22, 24] },      // Giữa đường kết nối mới
  { id: 24, x: 14.0, y: 0, z: -25.5, neighbors: [23, 3] },      // Đầu đường trước Nhà A (nối vào WP 3)
];`;

code = code.replace(oldWaypointsEnd, newWaypointsEnd);

// Connect waypoint 3 with 24, and waypoint 11 with 21
code = code.replace(
  /\{ id: 3, x: 26, y: 0, z: -20, neighbors: \[2, 4, 7\] \},/,
  '{ id: 3, x: 26, y: 0, z: -20, neighbors: [2, 4, 7, 24] },'
);
code = code.replace(
  /\{ id: 11, x: -18, y: 0, z: -18, neighbors: \[10, 12\] \},/,
  '{ id: 11, x: -18, y: 0, z: -18, neighbors: [10, 12, 21] },'
);

fs.writeFileSync(mainPath, code, 'utf8');
console.log('Waypoints updated with connecting road network.');
