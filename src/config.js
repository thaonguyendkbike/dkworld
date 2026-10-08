/**
 * DK Bike World - Cấu hình 3D Diorama (src/config.js)
 * Bao gồm đầy đủ Phân khu DK1, Đường tỉnh ĐT234 và Phân khu DK2.
 * Đơn vị: 1 unit = 1 mét.
 * Gốc tọa độ (0, 0, 0): Góc Tây-Nam của phân khu DK1.
 */

export const CONFIG = {
  // Cài đặt chung & Camera
  // Cài đặt chung & Camera
  WORLD: {
    unit: 1.0, // 1 đơn vị = 1 mét
    fogColorDay: 0xc8f0f8, // Sương mù xanh ngọc nhạt thanh khiết
    fogColorSunset: 0xffd1a9,
    fogColorNight: 0x090d16,
    fogNear: 80,
    fogFar: 420,
  },

  CAMERA: {
    fov: 42,
    near: 0.1,
    far: 1200,
    // Vị trí góc nhìn bao quát toàn bộ liên hoàn DK1 + DK2
    initialPosition: { x: 30, y: 135, z: 120 },
    initialTarget: { x: -15, y: 5, z: -45 },
    minDistance: 15,
    maxDistance: 380,
    maxPolarAngle: Math.PI / 2.05,
  },

  // Ánh sáng tươi sáng rực rỡ (Toon Vibrant Low-Poly Aesthetic)
  LIGHTING: {
    day: {
      ambientColor: 0xffffff,
      ambientIntensity: 0.88, // Nâng sáng toàn bộ các góc khuất
      sunColor: 0xfffbeb,
      sunIntensity: 2.2,
      sunPosition: { x: 90, y: 140, z: 70 },
      skyColor: 0x58a5f8, // Trời xanh biếc rực rỡ như ảnh mẫu
      groundColor: 0x86efac, // Cỏ xanh tươi phản chiếu
    },
    sunset: {
      ambientColor: 0xffcaa0,
      ambientIntensity: 0.55,
      sunColor: 0xff7e40,
      sunIntensity: 2.0,
      sunPosition: { x: 140, y: 40, z: 40 },
      skyColor: 0xff9966,
      groundColor: 0x4a3b32,
    },
    night: {
      ambientColor: 0x1f2a44,
      ambientIntensity: 0.28,
      sunColor: 0x5b7cb5,
      sunIntensity: 0.45,
      sunPosition: { x: 50, y: 90, z: -30 },
      skyColor: 0x070b14,
      groundColor: 0x04060a,
    },
  },

  // Mặt bằng 2 phân khu & Thảo nguyên xanh mướt
  GROUND: {
    grassColor: 0x4ade80, // Màu cỏ xanh tươi sáng chủ đạo
    grassAccentColor: 0x22c55e, // Cỏ xanh mướt
    sandColor: 0xfde68a, // Màu cát vàng ven sông và đường mòn
    dk1: {
      width: 100,
      depth: 95,
      color: 0x52b788,
      yardColor: 0x94a3b8,
      center: { x: 45, y: -1.0, z: -40 },
    },
    dk2: {
      width: 110,
      depth: 90,
      color: 0x40916c,
      yardColor: 0x94a3b8,
      center: { x: -75, y: -1.0, z: -45 },
    },
    borderStoneColor: 0x64748b,
  },

  // Đường Tỉnh ĐT234 kết nối DK1 và DK2
  ROAD_DT234: {
    positionX: -10,
    width: 7.0,
    length: 170,
    asphaltColor: 0x334155, // Nhựa đường xám sáng sạch sẽ
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
      wallColor: 0x475569,
      baseWallColor: 0xe2e8f0,
      roofColor: 0x1e293b,
      monitorRoof: { width: 7.0, height: 2.2, depth: 28.0, color: 0x0f172a },
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
      wallColor: 0x64748b,
      baseWallColor: 0xf1f5f9,
      roofColor: 0xcfd8dc,
      stairColor: 0x0284c7,
      stories: 3,
    },

    nhaC: {
      name: 'Nhà C - Kho & Xưởng phụ',
      zone: 'DK1',
      width: 14.1,
      height: 6.5,
      depth: 11.8,
      position: { x: 45.0, y: 6.5 / 2, z: -58.5 },
      wallColor: 0x64748b,
      roofColor: 0x0284c7, // Mái xanh dương tươi tắn
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
      wallColor: 0x94a3b8,
      baseWallColor: 0xf8fafc,
      roofColor: 0xef4444, // Mái ngói đỏ tươi
      stories: 3,
    },

    maiCheXe: {
      name: 'Mái che xe điện 3 bánh',
      zone: 'DK1',
      width: 6.0,
      height: 4.2,
      depth: 28.0,
      position: { x: 79.5, y: 2.1, z: -46.0 },
      canopyColor: 0x06b6d4,
      opacity: 0.7,
      frameColor: 0x1e293b,
    },

    nhaBaoVeDK1: {
      name: 'Nhà bảo vệ cổng DK1',
      zone: 'DK1',
      width: 4.2,
      height: 3.2,
      depth: 3.2,
      position: { x: 77.0, y: 1.6, z: -23.0 },
      wallColor: 0xf8fafc,
      roofColor: 0x0284c7,
    },

    // === PHÂN KHU DK2 ===
    nhaDieuHanhDK2: {
      name: 'Nhà điều hành DK2 (Trụ sở chính)',
      zone: 'DK2',
      width: 22.0,
      height: 11.5,
      depth: 12.0,
      position: { x: -28.0, y: 11.5 / 2, z: -28.0 },
      wallColor: 0x475569,
      baseWallColor: 0xf8fafc,
      roofColor: 0x1e293b,
      solarArray: true,
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
      yardColor: 0x64748b,
      courtColor: 0x22c55e, // Ô sân xanh lá tươi
    },

    hoTronDK2: {
      name: 'Hồ cảnh quan tròn DK2',
      zone: 'DK2',
      radius: 6.0,
      height: 1.6,
      position: { x: -108.0, y: -0.6, z: -65.0 },
      waterColor: 0x38bdf8,
    },

    vuonLanDK2: {
      name: 'Vườn Lan & Sinh thái trên đồi',
      zone: 'DK2',
      width: 22.0,
      height: 5.5,
      depth: 22.0,
      position: { x: -130.0, y: 16.0, z: -82.0 },
      canopyColor: 0x38bdf8,
      opacity: 0.65,
      frameColor: 0x1e293b,
    },
  },

  // Tuyến đường nội bộ & test track (rộng 3.0m)
  ROADS: {
    roadColor: 0x475569,
    lineColor: 0xffffff,
    kerbColor: 0xcfd8dc,
    trackArrowColor: 0xffcc00,
    width: 3.0,
  },

  // Tuyến đường sắt uốn lượn, Cầu vòm đỏ & Nhà ga DK Station
  RAILWAY: {
    positionX: 92.0,
    length: 180,
    railGauge: 1.4,
    railColor: 0x94a3b8,
    ballastColor: 0xd4a373, // Đá cát vàng nâu như ảnh 1 & 3
    sleeperColor: 0x5c3d2e,
    bridgeArchColor: 0xdc2626, // Cầu vòm đỏ rực rỡ như ảnh 1
  },

  // Sông / Máng nước xanh ngọc trong vắt (như ảnh 2)
  CANAL: {
    positionX: 86.0,
    length: 180,
    width: 9.0,
    waterColor: 0x38bdf8, // Nước xanh ngọc trong veo
    sandColor: 0xfde68a,
    depth: 1.8,
  },

  // Bờ kè đá chống sạt lở (Retaining Wall)
  RETAINING_WALL: {
    height: 4.5,
    width: 1.8,
    positionX: 83.2,
    color: 0x64748b,
  },

  // Sườn đồi cảnh quan phủ xanh
  HILLS: {
    dk1: {
      position: { x: 45, y: 0, z: -85 },
      radius: 42,
      height: 19,
      color: 0x22c55e,
    },
    dk2: {
      position: { x: -120, y: 0, z: -78 },
      radius: 54,
      height: 25,
      color: 0x16a34a,
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
      pos: { x: 125, y: 22, z: -35 },
      target: { x: 95, y: 4, z: -49 },
      name: 'Tàu hơi nước & Cầu vòm đỏ',
    },
    dkStation: {
      pos: { x: 110, y: 16, z: 12 },
      target: { x: 88, y: 3, z: -2 },
      name: 'Ga xe lửa DK Station',
    },
    sheepFlock: {
      pos: { x: 135, y: 18, z: -48 },
      target: { x: 120, y: 5, z: -62 },
      name: 'Đàn cừu trên đồi cỏ',
    },
    river: {
      pos: { x: 105, y: 12, z: 8 },
      target: { x: 89.5, y: 0, z: -8 },
      name: 'Sông máng nước & Thuyền nan',
    },
    windmill: {
      pos: { x: 75, y: 36, z: -85 },
      target: { x: 55, y: 26, z: -108 },
      name: 'Cối xay gió sinh thái',
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

