/**
 * DK Bike World - Cấu hình 3D Diorama (src/config.js)
 * Mọi hằng số kích thước, vị trí, màu sắc, chiều cao đặt tại đây.
 * Đơn vị: 1 unit = 1 mét.
 * Gốc tọa độ (0, 0, 0): Góc Tây-Nam của phân khu DK1.
 */

export const CONFIG = {
  // Cài đặt chung & Camera
  WORLD: {
    unit: 1.0, // 1 đơn vị = 1 mét
    fogColorDay: 0xd9e8f5,
    fogColorSunset: 0xffd1a9,
    fogColorNight: 0x090d16,
    fogNear: 60,
    fogFar: 280,
  },

  CAMERA: {
    fov: 45,
    near: 0.1,
    far: 1000,
    // Vị trí góc nhìn diorama isometric
    initialPosition: { x: 120, y: 90, z: 80 },
    initialTarget: { x: 50, y: 5, z: -40 },
    minDistance: 15,
    maxDistance: 240,
    maxPolarAngle: Math.PI / 2.05, // không nhìn dưới mặt đất
  },

  // Ánh sáng theo các thời điểm trong ngày
  LIGHTING: {
    day: {
      ambientColor: 0xffffff,
      ambientIntensity: 0.65,
      sunColor: 0xfffaed,
      sunIntensity: 1.8,
      sunPosition: { x: 80, y: 110, z: 60 },
      skyColor: 0xb5d8f7,
      groundColor: 0xe0ece4,
    },
    sunset: {
      ambientColor: 0xffcaa0,
      ambientIntensity: 0.5,
      sunColor: 0xff7e40,
      sunIntensity: 2.0,
      sunPosition: { x: 140, y: 35, z: 40 },
      skyColor: 0xff9966,
      groundColor: 0x4a3b32,
    },
    night: {
      ambientColor: 0x1f2a44,
      ambientIntensity: 0.25,
      sunColor: 0x5b7cb5,
      sunIntensity: 0.4,
      sunPosition: { x: 50, y: 80, z: -30 },
      skyColor: 0x070b14,
      groundColor: 0x04060a,
    },
  },

  // Mặt bằng khuôn viên DK1
  GROUND: {
    width: 140,
    depth: 130,
    color: 0x828a86, // Bê tông sân xưởng thực tế
    borderStoneColor: 0x6e7571,
    center: { x: 50, y: 0, z: -42 },
  },

  // Các công trình kiến trúc (Kích thước & Tọa độ tâm theo mét)
  BUILDINGS: {
    // 1. Nhà B: Xưởng sản xuất chính 3 tầng (lớn nhất, sát trục Đông)
    nhaB: {
      name: 'Nhà B - Xưởng sản xuất chính',
      width: 22.5,   // Trục X (ngang)
      height: 13.5,  // Trục Y (cao 3 tầng)
      depth: 33.5,   // Trục Z (dọc)
      position: { x: 65.0, y: 13.5 / 2, z: -50.0 },
      wallColor: 0x47515a,      // Tấm panel xám ghi đậm
      baseWallColor: 0xced4da,  // Chân tầng 1 ốp sáng màu cao 1.5m
      roofColor: 0x2b333c,      // Mái xám than chì
      monitorRoof: {
        width: 7.0,
        height: 2.2,
        depth: 28.0,
        color: 0x242a32,
      },
      logo: {
        text: 'DK Bike',
        color: 0xffb703, // Màu vàng thương hiệu DK Bike
        size: 2.8,
      },
      stories: 3,
    },

    // 2. Nhà A: Văn phòng + Kho/kỹ thuật 3 tầng (dài theo trục ngang)
    nhaA: {
      name: 'Nhà A - Văn phòng & Kỹ thuật',
      width: 32.5,
      height: 11.0,
      depth: 12.2,
      position: { x: 35.0, y: 11.0 / 2, z: -35.0 },
      wallColor: 0x606a74,     // Panel xám nhạt
      baseWallColor: 0xd8dde2, // Chân tường sáng
      roofColor: 0x9ca9b5,     // Mái tôn phẳng màu xám bạc
      stairColor: 0x1d63b8,    // Cầu thang thoát hiểm màu xanh dương
      stories: 3,
    },

    // 3. Nhà C: Kho phụ kiện (mái tôn xanh dương)
    nhaC: {
      name: 'Nhà C - Kho & Xưởng phụ',
      width: 14.1,
      height: 6.5,
      depth: 11.8,
      position: { x: 45.0, y: 6.5 / 2, z: -58.5 },
      wallColor: 0x5a636c,
      roofColor: 0x0056b3,     // Tôn màu xanh dương tươi
      solarPanels: true,
      stories: 1,
    },

    // 4. Nhà ăn CBNV (3 tầng, phía Nam, tách riêng)
    nhaAn: {
      name: 'Nhà ăn CBNV',
      width: 20.4,
      height: 10.5,
      depth: 11.6,
      position: { x: 23.0, y: 10.5 / 2, z: -12.0 },
      wallColor: 0x7c858d,
      baseWallColor: 0xe9ecef,
      roofColor: 0x8a3324,     // Mái ngói đỏ nâu
      stories: 3,
    },

    // 5. Mái che xe điện 3 bánh (Canopy trong suốt)
    maiCheXe: {
      name: 'Mái che xe điện 3 bánh',
      width: 6.0,
      height: 4.2,
      depth: 28.0,
      position: { x: 79.5, y: 2.1, z: -46.0 },
      canopyColor: 0x00b4d8,   // Xanh lơ trong suốt (cyan)
      opacity: 0.65,
      frameColor: 0x222930,
    },

    // 6. Nhà bảo vệ & cổng chính
    nhaBaoVe: {
      name: 'Nhà bảo vệ cổng chính',
      width: 4.2,
      height: 3.2,
      depth: 3.2,
      position: { x: 77.0, y: 1.6, z: -23.0 },
      wallColor: 0xdde2e6,
      roofColor: 0x1d3557,
    },
  },

  // Tuyến đường nội bộ & test track (rộng 3.0m)
  ROADS: {
    roadColor: 0x3d444b,       // Mặt đường nhựa xám đậm
    lineColor: 0xffffff,       // Vạch kẻ trắng
    kerbColor: 0xa0aab2,       // Vỉa hè bê tông
    trackArrowColor: 0xffcc00, // Mũi tên sơn vàng chạy thử
    width: 3.0,
  },

  // Tuyến đường sắt Bắc - Nam & Kênh nước
  RAILWAY: {
    positionX: 87.5,
    length: 130,
    railGauge: 1.4,
    railColor: 0x8d99ae,
    ballastColor: 0x495057,
  },

  CANAL: {
    positionX: 92.5,
    width: 4.5,
    depth: 1.6,
    length: 130,
    waterColor: 0x2a6f97,
  },

  // Bờ kè đá chống sạt lở (Retaining Wall)
  RETAINING_WALL: {
    height: 4.5,
    width: 1.8,
    positionX: 83.2,
    color: 0x5c6773,
  },

  // Sườn đồi phía Bắc
  HILLS: {
    position: { x: 45, y: 0, z: -85 },
    radius: 40,
    height: 18,
    color: 0x3a5a40,
  },

  // Preset vị trí camera chuyển cảnh (Quick Focus)
  PRESETS: {
    overview: {
      pos: { x: 120, y: 90, z: 80 },
      target: { x: 50, y: 5, z: -40 },
      name: 'Toàn cảnh khuôn viên',
    },
    nhaB: {
      pos: { x: 95, y: 35, z: -25 },
      target: { x: 65, y: 8, z: -50 },
      name: 'Xưởng chính Nhà B',
    },
    nhaA: {
      pos: { x: 25, y: 30, z: -5 },
      target: { x: 35, y: 6, z: -35 },
      name: 'Văn phòng Nhà A',
    },
    testTrack: {
      pos: { x: 80, y: 40, z: -75 },
      target: { x: 65, y: 2, z: -50 },
      name: 'Đường chạy thử xe',
    },
    railway: {
      pos: { x: 110, y: 25, z: -40 },
      target: { x: 88, y: 2, z: -40 },
      name: 'Kênh & Đường ray',
    },
  },
};
