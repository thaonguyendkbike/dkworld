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
    fogColorDay: 0xcfeafe, // Sương mù xanh nhạt hòa sắc chân trời
    fogColorSunset: 0xfdba74,
    fogColorNight: 0x0b1120,
    fogNear: 110,
    fogFar: 460,
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

  // Khối 3: Ánh sáng đậm ấm, tương phản cao, nắng góc thấp (Grand Valley Aesthetic)
  LIGHTING: {
    day: {
      ambientColor: 0xbae6fd,
      ambientIntensity: 0.58, // Hạ ambient để tăng độ tương phản sáng-tối sắc nét
      sunColor: 0xfff7ed, // Nắng vàng ấm rực rỡ
      sunIntensity: 2.85,
      sunPosition: { x: 125, y: 78, z: 90 }, // Nắng góc thấp đổ bóng dài có chiều sâu
      skyColor: 0x38bdf8,
      groundColor: 0x166534, // Phản xạ xanh lá đậm ấm từ thảm cỏ
      skyGradient: { top: 0x1d4ed8, bottom: 0xcfeafe },
    },
    sunset: {
      ambientColor: 0xfed7aa,
      ambientIntensity: 0.45,
      sunColor: 0xf97316,
      sunIntensity: 2.4,
      sunPosition: { x: 140, y: 32, z: 35 },
      skyColor: 0xea580c,
      groundColor: 0x431407,
      skyGradient: { top: 0x7c2d12, bottom: 0xfdba74 },
    },
    night: {
      ambientColor: 0x1e293b,
      ambientIntensity: 0.22,
      sunColor: 0x60a5fa,
      sunIntensity: 0.45,
      sunPosition: { x: 45, y: 80, z: -35 },
      skyColor: 0x030712,
      groundColor: 0x020617,
      skyGradient: { top: 0x030712, bottom: 0x0f172a },
    },
  },

  // Mặt bằng 2 phân khu & Thảo nguyên xanh đậm bão hòa
  GROUND: {
    grassColor: 0x16a34a, // Xanh lá bão hòa đậm ấm (bỏ tông bạc hà nhạt)
    grassAccentColor: 0x15803d, // Xanh ngọc sẫm
    earthColor: 0x78350f, // Màu đất nâu ấm điểm xuyến rìa đồi
    sandColor: 0xfde68a, // Màu cát vàng ven sông
    dk1: {
      width: 100,
      depth: 95,
      color: 0x15803d,
      yardColor: 0x94a3b8,
      center: { x: 45, y: -1.0, z: -40 },
    },
    dk2: {
      width: 110,
      depth: 90,
      color: 0x166534,
      yardColor: 0x94a3b8,
      center: { x: -75, y: -1.0, z: -45 },
    },
    borderStoneColor: 0x475569,
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
      position: { x: -36.0, y: 11.5 / 2, z: -32.0 }, // Dịch sang Tây để không lấn đường nhựa DT234 và ao cá Koi
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
      width: 62.0,
      height: 6.5,
      depth: 11.0,
      position: { x: -50.0, y: 6.5 / 2, z: -68.0 }, // Dịch sang phía Đông theo mũi tên, không lấn vào chân đồi
      wallColor: 0x64748b,
      roofColor: 0x0284c7, // Mái tôn màu xanh dương tươi
      stories: 1,
      area: '1.080 m²',
    },

    xuongDK2: {
      name: 'Sân kiểm định & Xe thành phẩm DK2',
      zone: 'DK2',
      width: 88.0,
      height: 0.1,
      depth: 22.0,
      position: { x: -75.0, y: 0.05, z: -15.0 },
      yardColor: 0x94a3b8,
      area: '1.936 m²',
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

    vuonLanDK2: {
      name: 'Vườn Lan & Sinh thái trên đồi',
      zone: 'DK2',
      width: 20.0,
      height: 5.5,
      depth: 20.0,
      position: { x: -108.0, y: 15.5, z: -88.0 }, // Dịch theo hướng mũi tên xuống triền sườn đồi
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

  // Sông / Máng nước uốn lượn song song với đường tàu (Khối 4)
  CANAL: {
    width: 9.5,
    depth: 1.8,
    waterColor: 0x38bdf8, // Nước xanh ngọc trong veo
    sandColor: 0xfde68a,
    offsetFromRail: 8.5, // Chạy song song cách tim đường sắt 8.5m
  },

  // Khối 4: Hệ thống Nước, Sông máng & Ao cá đồi sinh thái (Stylized Water System)
  WATER: {
    shallowColor: 0x38bdf8, // Xanh ngọc trong vắt sát bờ
    deepColor: 0x0369a1,    // Xanh đậm sẫm có chiều sâu giữa dòng
    foamColor: 0xffffff,    // Viền bọt trắng ở bờ
    waveSpeed: 0.85,        // Tốc độ sóng chuyển động chậm
    waveFrequency: 0.35,
    opacity: 0.90,
    hillPond: {
      position: { x: -132.0, z: -76.0 }, // Dịch chuyển lên đỉnh đồi cạnh Vườn Lan theo hướng mũi tên
      radiusX: 16.5,                     // Kích thước ao cá lớn
      radiusZ: 12.0,
      terraceRadius: 18.5,
      terraceHeight: 3.6,
    },
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
    // Đồi mới cho chuồng gà và đàn gà thả đồi (Theo khoanh tròn đỏ trên ảnh)
    dk2NewHill: {
      position: { x: -142, y: 0, z: -38 },
      radius: 34,
      height: 15,
      color: 0x22c55e,
    },
  },

  // Khối 2: Rừng & Cây cối sinh thái (Lush Forest & Flora - Theo phong cách Grand Valley)
  FOREST: {
    // Số lượng cây và thực vật InstancedMesh (đảm bảo 60 FPS)
    roundTreeCount: 1500,     // (a) Cây tán tròn low-poly ngẫu nhiên đỉnh
    pineTreeCount: 850,       // (b) Thông nhiều tầng hình nón
    autumnTreeCount: 260,     // (c) Cây tán vàng/cam điểm xuyến
    bushCount: 700,           // (d) Bụi thấp
    rockCount: 220,           // Đá cuội ven sông và sườn đồi
    flowerCount: 800,         // Hoa dại nhiều màu
    grassTuftCount: 600,      // Khóm cỏ tuft

    // Bảng màu rực rỡ phong phú
    colors: {
      roundFoliage: [0x4ade80, 0x22c55e, 0x16a34a, 0x15803d, 0x84cc16],
      pineFoliage: [0x0f5132, 0x14532d, 0x166534, 0x1e3a2b, 0x064e3b],
      autumnFoliage: [0xf59e0b, 0xeab308, 0xf97316, 0xd97706, 0xfbbf24],
      bushFoliage: [0x4ade80, 0x22c55e, 0x84cc16, 0xa3e635],
      wildflowers: [0xffffff, 0xfef08a, 0xf472b6, 0xc084fc, 0x38bdf8],
      rocks: [0x64748b, 0x94a3b8, 0x78350f, 0x854d0e, 0x5c3d2e, 0x92400e, 0x713f12, 0xa16207],
      trunks: [0x5c3d2e, 0x78350f, 0x451a03],
    },

    // Hiệu ứng gió đung đưa (Vertex Shader)
    wind: {
      speed: 1.8,
      strength: 0.16,
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
      pos: { x: -16, y: 35, z: -10 },
      target: { x: -36, y: 6, z: -32 },
      name: 'Nhà điều hành DK2 (HQ)',
    },
    vuonLan: {
      pos: { x: -85, y: 46, z: -55 },
      target: { x: -118, y: 16, z: -82 },
      name: 'Vườn Lan & Ao cá trên đồi (DK2)',
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
      pos: { x: 122, y: 12, z: -32 },
      target: { x: 108, y: 4.8, z: -45 },
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
    volleyball: {
      pos: { x: 56, y: 14, z: 4 },
      target: { x: 44, y: 1.5, z: -12 },
      name: 'Sân bóng chuyền DK1',
    },
    aoCaDK2: {
      pos: { x: -80, y: 16, z: -42 },
      target: { x: -98, y: 9.4, z: -56 },
      name: 'Ao cá đồi sinh thái DK2',
    },
    doiGaDK2: {
      pos: { x: -98, y: 9, z: -22 },
      target: { x: -112, y: 3.2, z: -36 },
      name: 'Đàn gà thả đồi DK2',
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

