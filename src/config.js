/**
 * DK Bike World - Cấu hình 3D Diorama (src/config.js)
 * Bao gồm đầy đủ Phân khu DK1, Đường tỉnh ĐT234 và Phân khu DK2.
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
    fogNear: 70,
    fogFar: 360,
  },

  CAMERA: {
    fov: 42,
    near: 0.1,
    far: 1000,
    // Vị trí góc nhìn bao quát toàn bộ liên hoàn DK1 + DK2
    initialPosition: { x: 30, y: 135, z: 120 },
    initialTarget: { x: -15, y: 5, z: -45 },
    minDistance: 15,
    maxDistance: 350,
    maxPolarAngle: Math.PI / 2.05,
  },

  // Ánh sáng theo các thời điểm trong ngày
  LIGHTING: {
    day: {
      ambientColor: 0xffffff,
      ambientIntensity: 0.65,
      sunColor: 0xfffaed,
      sunIntensity: 1.8,
      sunPosition: { x: 80, y: 130, z: 60 },
      skyColor: 0xb5d8f7,
      groundColor: 0xe0ece4,
    },
    sunset: {
      ambientColor: 0xffcaa0,
      ambientIntensity: 0.5,
      sunColor: 0xff7e40,
      sunIntensity: 2.0,
      sunPosition: { x: 140, y: 40, z: 40 },
      skyColor: 0xff9966,
      groundColor: 0x4a3b32,
    },
    night: {
      ambientColor: 0x1f2a44,
      ambientIntensity: 0.25,
      sunColor: 0x5b7cb5,
      sunIntensity: 0.4,
      sunPosition: { x: 50, y: 90, z: -30 },
      skyColor: 0x070b14,
      groundColor: 0x04060a,
    },
  },

  // Mặt bằng 2 phân khu
  GROUND: {
    dk1: {
      width: 100,
      depth: 95,
      color: 0x828a86,
      center: { x: 45, y: -1.0, z: -40 },
    },
    dk2: {
      width: 110,
      depth: 90,
      color: 0x7c8480,
      center: { x: -75, y: -1.0, z: -45 },
    },
    borderStoneColor: 0x6e7571,
  },

  // Đường Tỉnh ĐT234 kết nối DK1 và DK2
  ROAD_DT234: {
    positionX: -10,
    width: 7.0,
    length: 160,
    asphaltColor: 0x2b3035,
    lineColor: 0xffcc00,
  },

  // Danh mục công trình phân khu DK1 & DK2
  BUILDINGS: {
    // === PHÂN KHU DK1 ===
    nhaB: {
      name: 'Nhà B - Xưởng sản xuất chính',
      zone: 'DK1',
      width: 22.5,
      height: 13.5,
      depth: 33.5,
      position: { x: 65.0, y: 13.5 / 2, z: -50.0 },
      wallColor: 0x47515a,
      baseWallColor: 0xced4da,
      roofColor: 0x2b333c,
      monitorRoof: { width: 7.0, height: 2.2, depth: 28.0, color: 0x242a32 },
      logo: { text: 'DK Bike', color: 0xffb703, size: 2.8 },
      stories: 3,
    },

    nhaA: {
      name: 'Nhà A - Văn phòng & Kỹ thuật',
      zone: 'DK1',
      width: 32.5,
      height: 11.0,
      depth: 12.2,
      position: { x: 35.0, y: 11.0 / 2, z: -35.0 },
      wallColor: 0x606a74,
      baseWallColor: 0xd8dde2,
      roofColor: 0x9ca9b5,
      stairColor: 0x1d63b8,
      stories: 3,
    },

    nhaC: {
      name: 'Nhà C - Kho & Xưởng phụ',
      zone: 'DK1',
      width: 14.1,
      height: 6.5,
      depth: 11.8,
      position: { x: 45.0, y: 6.5 / 2, z: -58.5 },
      wallColor: 0x5a636c,
      roofColor: 0x0056b3,
      solarPanels: true,
      stories: 1,
    },

    nhaAn: {
      name: 'Nhà ăn CBNV DK1',
      zone: 'DK1',
      width: 20.4,
      height: 10.5,
      depth: 11.6,
      position: { x: 23.0, y: 10.5 / 2, z: -12.0 },
      wallColor: 0x7c858d,
      baseWallColor: 0xe9ecef,
      roofColor: 0x8a3324,
      stories: 3,
    },

    maiCheXe: {
      name: 'Mái che xe điện 3 bánh',
      zone: 'DK1',
      width: 6.0,
      height: 4.2,
      depth: 28.0,
      position: { x: 79.5, y: 2.1, z: -46.0 },
      canopyColor: 0x00b4d8,
      opacity: 0.65,
      frameColor: 0x222930,
    },

    nhaBaoVeDK1: {
      name: 'Nhà bảo vệ cổng DK1',
      zone: 'DK1',
      width: 4.2,
      height: 3.2,
      depth: 3.2,
      position: { x: 77.0, y: 1.6, z: -23.0 },
      wallColor: 0xdde2e6,
      roofColor: 0x1d3557,
    },

    // === PHÂN KHU DK2 ===
    nhaDieuHanhDK2: {
      name: 'Nhà điều hành DK2 (Trụ sở chính)',
      zone: 'DK2',
      width: 22.0,
      height: 11.5,
      depth: 12.0,
      position: { x: -28.0, y: 11.5 / 2, z: -28.0 },
      wallColor: 0x52606d,
      baseWallColor: 0xe2e8f0,
      roofColor: 0x1e293b,
      solarArray: true, // Dàn pin năng lượng mặt trời phủ kín toàn bộ mái
      stories: 3,
      area: '253 m² sàn',
    },

    khoLinhKienDK2: {
      name: 'Kho Linh kiện D2.1',
      zone: 'DK2',
      width: 78.0,
      height: 6.5,
      depth: 11.0,
      position: { x: -78.0, y: 6.5 / 2, z: -68.0 },
      wallColor: 0x64748b,
      roofColor: 0x0284c7, // Mái tôn màu xanh dương tươi
      stories: 1,
      area: '1.080 m²',
    },

    xuongDK2: {
      name: 'Xưởng sản xuất phía Nam DK2',
      zone: 'DK2',
      width: 85.0,
      height: 8.0,
      depth: 16.0,
      position: { x: -75.0, y: 8.0 / 2, z: -15.0 },
      wallColor: 0x475569,
      roofColor: 0x334155,
      stories: 2,
      area: '2.170 m²',
    },

    sanThanhPhamDK2: {
      name: 'Sân xe thành phẩm DK2',
      zone: 'DK2',
      width: 75.0,
      depth: 40.0,
      position: { x: -78.0, y: 0.03, z: -45.0 },
      yardColor: 0x6d757d,
      courtColor: 0x2e7d32, // Các ô sơn xanh lá
    },

    hoTronDK2: {
      name: 'Hồ cảnh quan tròn DK2',
      zone: 'DK2',
      radius: 6.0,
      height: 1.6,
      position: { x: -108.0, y: -0.6, z: -65.0 },
      waterColor: 0x0284c7,
    },

    vuonLanDK2: {
      name: 'Vườn Lan & Sinh thái trên đồi',
      zone: 'DK2',
      width: 22.0,
      height: 5.5,
      depth: 22.0,
      position: { x: -130.0, y: 16.0, z: -82.0 },
      canopyColor: 0x38bdf8,
      opacity: 0.55,
      frameColor: 0x1e293b,
    },
  },

  // Tuyến đường nội bộ & test track (rộng 3.0m)
  ROADS: {
    roadColor: 0x3d444b,
    lineColor: 0xffffff,
    kerbColor: 0xa0aab2,
    trackArrowColor: 0xffcc00,
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

  // Sườn đồi cảnh quan DK1 & DK2
  HILLS: {
    dk1: {
      position: { x: 45, y: 0, z: -85 },
      radius: 40,
      height: 18,
      color: 0x3a5a40,
    },
    dk2: {
      position: { x: -120, y: 0, z: -78 },
      radius: 52,
      height: 24,
      color: 0x32533c,
    },
  },

  // Preset vị trí camera chuyển cảnh (Quick Focus)
  PRESETS: {
    overview: {
      pos: { x: 30, y: 135, z: 120 },
      target: { x: -15, y: 5, z: -45 },
      name: 'Toàn cảnh liên hoàn DK1 + DK2',
    },
    dk1: {
      pos: { x: 105, y: 70, z: 65 },
      target: { x: 50, y: 5, z: -40 },
      name: 'Khuôn viên nhà máy DK1',
    },
    dk2: {
      pos: { x: -35, y: 80, z: 50 },
      target: { x: -75, y: 5, z: -45 },
      name: 'Khu mở rộng DK2',
    },
    nhaB: {
      pos: { x: 95, y: 35, z: -25 },
      target: { x: 65, y: 8, z: -50 },
      name: 'Xưởng chính Nhà B (DK1)',
    },
    nhaDieuHanh: {
      pos: { x: -10, y: 35, z: -5 },
      target: { x: -28, y: 6, z: -28 },
      name: 'Nhà điều hành DK2 (HQ)',
    },
    vuonLan: {
      pos: { x: -95, y: 50, z: -45 },
      target: { x: -130, y: 16, z: -82 },
      name: 'Vườn Lan trên đồi (DK2)',
    },
    testTrack: {
      pos: { x: 80, y: 40, z: -75 },
      target: { x: 65, y: 2, z: -50 },
      name: 'Đường chạy thử xe (DK1)',
    },
    railway: {
      pos: { x: 110, y: 25, z: -40 },
      target: { x: 88, y: 2, z: -40 },
      name: 'Kênh & Đường ray',
    },
    logistics: {
      pos: { x: 45, y: 18, z: -20 },
      target: { x: 58, y: 3, z: -32 },
      name: 'Khu bốc dỡ & Cửa xưởng Nhà B',
    },
    chargingHub: {
      pos: { x: 20, y: 15, z: -15 },
      target: { x: 28, y: 2, z: -24 },
      name: 'Trạm sạc xe điện thông minh',
    },
  },

  // Hệ thống vật thể chi tiết, thiết bị & tiện ích
  OBJECTS: {
    // Biển chào & Pylon cổng chính
    pylons: [
      { id: 'pylonDK1', name: 'Cổng chính DK1', pos: { x: 74, y: 0, z: -15 }, text: 'DK BIKE FACTORY 1', color: 0xffb703 },
      { id: 'pylonDK2', name: 'Cổng chính DK2', pos: { x: -22, y: 0, z: -18 }, text: 'DK BIKE HQ & LOGISTICS', color: 0x0284c7 },
    ],

    // Cửa cuốn công nghiệp (Roller Shutter Doors) xưởng B
    shutterDoors: [
      { id: 'doorB1', name: 'Cửa cuốn chính Xưởng B', pos: { x: 58.0, y: 0, z: -33.2 }, width: 5.5, height: 4.2, isOpen: false },
      { id: 'doorB2', name: 'Cửa xuất nhập hàng Xưởng B', pos: { x: 72.0, y: 0, z: -33.2 }, width: 5.0, height: 4.2, isOpen: false },
      { id: 'doorD21', name: 'Cửa Kho Linh kiện D2.1', pos: { x: -70.0, y: 0, z: -62.4 }, width: 4.5, height: 3.8, isOpen: false },
    ],

    // Trạm sạc xe máy điện siêu tốc (DK Fast EV Charging)
    chargingStations: [
      { id: 'chargerDK1', name: 'Trạm sạc nhanh DK1 (Sân Nhà A)', pos: { x: 26.0, y: 0, z: -24.0 } },
      { id: 'chargerDK2', name: 'Trạm sạc trung tâm DK2 (Sân xe)', pos: { x: -50.0, y: 0, z: -32.0 } },
    ],

    // Bãi đỗ xe ô tô cán bộ / Ban giám đốc
    executiveCars: [
      { id: 'car1', model: 'SUV Ban Giám Đốc', color: 0x0f172a, pos: { x: 18.0, y: 0, z: -22.0 }, rotY: 0 },
      { id: 'car2', model: 'Sedan Kỹ thuật R&D', color: 0xffffff, pos: { x: 14.5, y: 0, z: -22.0 }, rotY: 0 },
      { id: 'carPickup', model: 'Xe bán tải Pickup Logistics', color: 0x3b82f6, pos: { x: -38.0, y: 0, z: -20.0 }, rotY: Math.PI / 2 },
    ],

    // Tiện ích hạ tầng (PCCC, Trạm biến áp, Thùng rác)
    utilities: {
      hydrants: [
        { x: 52, z: -24 },
        { x: 76, z: -33 },
        { x: -35, z: -22 },
        { x: -65, z: -62 },
      ],
      substation: { x: 42, y: 0, z: -66, name: 'Trạm biến áp 3 pha 560kVA' },
      recycleBins: [
        { x: 24, z: -20 },
        { x: -26, z: -22 },
        { x: 56, z: -30 },
      ],
    },
  },

  // Danh mục thông tin nhân sự và hoạt động
  CHARACTERS: {
    kcs: {
      name: 'Kỹ sư KCS: Lê Tuấn Anh',
      role: 'Kiểm soát chất lượng xuất xưởng',
      activity: 'Đang kiểm tra thông số phanh và pin dòng xe DK Roma SX trên tablet chuyên dụng.',
      zone: 'Sân KCS / Đường thử Nhà B',
    },
    forkliftDriver: {
      name: 'Tài xế xe nâng: Trần Văn Hùng',
      role: 'Vận hành logistics xuất nhập xưởng',
      activity: 'Đang vận chuyển pallet cụm động cơ điện và bộ điều khiển IC vào cửa xưởng B.',
      zone: 'Cửa bốc dỡ Xưởng B',
    },
    guardDK1: {
      name: 'Bảo vệ: Hoàng Văn Minh',
      role: 'Kiểm soát an ninh Cổng chính DK1',
      activity: 'Điều phối barrier tự động cho xe tải logistics và khách ra vào nhà máy.',
      zone: 'Bốt gác Cổng DK1',
    },
    guardDK2: {
      name: 'Bảo vệ: Triệu Quốc Bảo',
      role: 'Kiểm soát an ninh Cổng chính DK2',
      activity: 'Quản lý vé xe, kiểm tra thẻ từ nhân viên và đối tác vào khu nhà điều hành.',
      zone: 'Bốt gác Cổng DK2',
    },
    logisticsLead: {
      name: 'Quản lý kho: Đỗ Thanh Nga',
      role: 'Trưởng ban điều phối Logistics & Xuất khẩu',
      activity: 'Kiểm đếm lô hàng 60 xe máy điện DK Creer E chuẩn bị đóng container xuất đi các tỉnh.',
      zone: 'Sân thành phẩm DK2',
    },
    rndStaff: {
      name: 'Kỹ thuật viên R&D: Nguyễn Đức Thành',
      role: 'Nghiên cứu phát triển kiểu dáng & khí động học',
      activity: 'Di chuyển trên cầu vượt tầng 2 mang bản vẽ kỹ thuật từ Nhà A sang xưởng lắp ráp B.',
      zone: 'Cầu vượt nối Nhà A - B',
    },
    orchidGardener: {
      name: 'Nghệ nhân cây cảnh: Bác Bùi Văn Thắng',
      role: 'Chăm sóc cảnh quan sinh thái Vườn Lan',
      activity: 'Tưới và chăm sóc giàn phong lan rừng Lạng Sơn trên đỉnh đồi cao +16m.',
      zone: 'Vườn Lan Đỉnh Đồi DK2',
    },
  },
};

