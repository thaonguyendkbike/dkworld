import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CONFIG } from './config.js';

// ============================================================================
// State & Variables
// ============================================================================
let scene, camera, renderer, controls;
let dirLight, hemiLight, ambientLight;
let currentEnv = 'day';
let isRaining = false;
let rainParticles;

// Animated Vehicles & Logistics
let animatedBike, bikeRiderGroup, bikeTrackAngle = 0;
let animatedTruck, truckProgress = 0;
let animatedTrain, trainProgress = 0;

// Curved Railway, Steam Train & Puffy Smoke (Inspired by vibrant low-poly references)
let railwayCurve;
let trainCars = [];
let trainSmokeTrail = [];
let windmillBlades;
let railwayGateArms = [];
let skyClouds = [];
let fluffySheeps = [];
let rowingBoat;
let lotusLeaves = [];
let riverFishGroup;
let chimneySmokePuffs = [];

// Animated Characters & People
let walkingWorkers = [];
let flagMeshes = [];
let roofVentilators = [];
let birdFlockGroup, birdMeshes = [];

// Interactive Objects, Doors & Activities
let interactiveObjects = [];
let shutterDoors = [];
let areDoorsOpen = false;
let doorProgress = 0; // 0 = closed, 1 = fully open
let interiorFactoryLights = [];
let animatedForklifts = [];
let animatedBarriers = [];
let chargingStationsList = [];
let koiFishes = [];
let trainSteamPuffs = [];

// Lighting & Environment
let waterCanalMesh, waterRoundPondMesh, waterKoiMesh;
let buildingMeshes = [];
let windowLights = [];
let streetLightLamps = [];
let streetLightSpotLights = [];
let logoLight;
let labelElements = [];
let showLabels = true;

// Performance monitoring
let frameCount = 0;
let lastFpsTime = performance.now();
const fpsElement = document.getElementById('stat-fps');
const compassNeedle = document.getElementById('compass-needle');

// Raycasting for interaction
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// ============================================================================
// 1. Scene & Renderer Initialization
// ============================================================================
function init() {
  const container = document.getElementById('canvas-container');

  // Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(CONFIG.LIGHTING.day.skyColor);
  scene.fog = new THREE.Fog(
    CONFIG.WORLD.fogColorDay,
    CONFIG.WORLD.fogNear,
    CONFIG.WORLD.fogFar
  );

  // Camera
  camera = new THREE.PerspectiveCamera(
    CONFIG.CAMERA.fov,
    window.innerWidth / window.innerHeight,
    CONFIG.CAMERA.near,
    CONFIG.CAMERA.far
  );
  camera.position.set(
    CONFIG.CAMERA.initialPosition.x,
    CONFIG.CAMERA.initialPosition.y,
    CONFIG.CAMERA.initialPosition.z
  );

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  container.appendChild(renderer.domElement);

  // OrbitControls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(
    CONFIG.CAMERA.initialTarget.x,
    CONFIG.CAMERA.initialTarget.y,
    CONFIG.CAMERA.initialTarget.z
  );
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.minDistance = CONFIG.CAMERA.minDistance;
  controls.maxDistance = CONFIG.CAMERA.maxDistance;
  controls.maxPolarAngle = CONFIG.CAMERA.maxPolarAngle;
  controls.update();

  // Setup Lights & Environment
  setupLights();

  // Grounds & Roads
  buildGroundsAndRoadDT234();
  buildVastTerrainAndClouds();

  // DK1 Campus Core
  buildRetainingWall();
  buildCanalAndRailway();
  buildRoadsAndTestTrack();
  buildDK1Buildings();
  buildCanopyAndBikes();

  // DK2 Campus Core
  buildDK2Buildings();
  buildDK2HillAndOrchidGarden();
  buildDK2Vehicles();

  // Landscaping & Greenery (InstancedMesh)
  buildLandscaping();

  // Logistics, Equipment & Infrastructure Details
  buildLogisticsAndEquipment();
  buildFlagsAndStreetlights();

  // People & Characters Activities
  buildPeopleAndCharacters();

  // Animated Vehicles & Rail Transit
  setupAnimatedVehicles();
  setupTrain();
  setupFlockOfBirds();

  // Weather & Rain
  setupRainEffect();

  // 3D HTML Labels
  createBuildingLabels();

  // Event Listeners
  setupEventListeners();

  // Window resize handler
  window.addEventListener('resize', onWindowResize);

  // Start Animation Loop
  animate(performance.now());
}

// ============================================================================
// 2. Lighting System
// ============================================================================
function setupLights() {
  ambientLight = new THREE.AmbientLight(
    CONFIG.LIGHTING.day.ambientColor,
    CONFIG.LIGHTING.day.ambientIntensity
  );
  scene.add(ambientLight);

  hemiLight = new THREE.HemisphereLight(
    CONFIG.LIGHTING.day.skyColor,
    CONFIG.LIGHTING.day.groundColor,
    0.45
  );
  scene.add(hemiLight);

  dirLight = new THREE.DirectionalLight(
    CONFIG.LIGHTING.day.sunColor,
    CONFIG.LIGHTING.day.sunIntensity
  );
  dirLight.position.set(
    CONFIG.LIGHTING.day.sunPosition.x,
    CONFIG.LIGHTING.day.sunPosition.y,
    CONFIG.LIGHTING.day.sunPosition.z
  );
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  dirLight.shadow.camera.near = 10;
  dirLight.shadow.camera.far = 400;

  const d = 140;
  dirLight.shadow.camera.left = -d;
  dirLight.shadow.camera.right = d;
  dirLight.shadow.camera.top = d;
  dirLight.shadow.camera.bottom = -d;
  dirLight.shadow.bias = -0.0005;
  scene.add(dirLight);

  logoLight = new THREE.PointLight(0xffb703, 0, 35);
  logoLight.position.set(CONFIG.BUILDINGS.nhaB.position.x, 14, CONFIG.BUILDINGS.nhaB.position.z + 18);
  scene.add(logoLight);
}

// ============================================================================
// 3. Ground Platforms & Provincial Road ĐT234
// ============================================================================
function buildGroundsAndRoadDT234() {
  // DK1 Yard Platform
  const dk1Cfg = CONFIG.GROUND.dk1;
  const dk1Ground = new THREE.Mesh(
    new THREE.BoxGeometry(dk1Cfg.width, 2.0, dk1Cfg.depth),
    new THREE.MeshStandardMaterial({ color: dk1Cfg.color, roughness: 0.85, metalness: 0.1 })
  );
  dk1Ground.position.set(dk1Cfg.center.x, -1.0, dk1Cfg.center.z);
  dk1Ground.receiveShadow = true;
  scene.add(dk1Ground);

  // DK2 Yard Platform
  const dk2Cfg = CONFIG.GROUND.dk2;
  const dk2Ground = new THREE.Mesh(
    new THREE.BoxGeometry(dk2Cfg.width, 2.0, dk2Cfg.depth),
    new THREE.MeshStandardMaterial({ color: dk2Cfg.color, roughness: 0.85, metalness: 0.1 })
  );
  dk2Ground.position.set(dk2Cfg.center.x, -1.0, dk2Cfg.center.z);
  dk2Ground.receiveShadow = true;
  scene.add(dk2Ground);

  // Road DT234
  const roadCfg = CONFIG.ROAD_DT234;
  const dt234 = new THREE.Mesh(
    new THREE.BoxGeometry(roadCfg.width, 0.1, roadCfg.length),
    new THREE.MeshStandardMaterial({ color: roadCfg.asphaltColor, roughness: 0.75 })
  );
  dt234.position.set(roadCfg.positionX, 0.05, -45);
  dt234.receiveShadow = true;
  scene.add(dt234);

  // Road Line
  const line = new THREE.Mesh(
    new THREE.PlaneGeometry(0.25, roadCfg.length - 10),
    new THREE.MeshBasicMaterial({ color: 0xffcc00 })
  );
  line.rotation.x = -Math.PI / 2;
  line.position.set(roadCfg.positionX, 0.12, -45);
  scene.add(line);

  // Vạch người đi bộ qua đường (Zebra Crossing) kết nối Cổng DK1 và Cổng DK2
  const zebraMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  for (let zi = -3; zi <= 3; zi++) {
    const zebraStripe = new THREE.Mesh(new THREE.PlaneGeometry(roadCfg.width - 1.2, 0.45), zebraMat);
    zebraStripe.rotation.x = -Math.PI / 2;
    zebraStripe.position.set(roadCfg.positionX, 0.13, -24 + zi * 0.85);
    scene.add(zebraStripe);
  }

  // Vạch dừng xe (Stop Lines) trước 2 cổng
  const stopLine1 = new THREE.Mesh(new THREE.PlaneGeometry(roadCfg.width - 1.0, 0.35), zebraMat);
  stopLine1.rotation.x = -Math.PI / 2;
  stopLine1.position.set(roadCfg.positionX, 0.13, -19);
  scene.add(stopLine1);

  const stopLine2 = new THREE.Mesh(new THREE.PlaneGeometry(roadCfg.width - 1.0, 0.35), zebraMat);
  stopLine2.rotation.x = -Math.PI / 2;
  stopLine2.position.set(roadCfg.positionX, 0.13, -29);
  scene.add(stopLine2);

  // Vạch kẻ ô đỗ xe ô tô cán bộ trước Nhà A (DK1)
  const parkLineMat = new THREE.MeshBasicMaterial({ color: 0xe2e8f0 });
  for (let p = 0; p < 4; p++) {
    const px = 14 + p * 3.2;
    // Đường vạch chia ô
    const bayDivider = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 5.0), parkLineMat);
    bayDivider.rotation.x = -Math.PI / 2;
    bayDivider.position.set(px, 0.03, -22);
    scene.add(bayDivider);
  }

  // Vạch an toàn bốc dỡ hàng hóa (Yellow/Black Hazard stripes) trước Xưởng B
  for (let h = 0; h < 6; h++) {
    const stripe = new THREE.Mesh(
      new THREE.PlaneGeometry(1.2, 0.3),
      new THREE.MeshBasicMaterial({ color: h % 2 === 0 ? 0xffcc00 : 0x1e293b })
    );
    stripe.rotation.x = -Math.PI / 2;
    stripe.position.set(58 + h * 1.0, 0.03, -32.5);
    scene.add(stripe);
  }

  // Pylon Cổng DK1
  buildPylonSign(74, 0, -17, 'DK BIKE', 'NHÀ MÁY 1 (4.500 m²)', 0xffb703, 'pylonDK1');

  // Pylon Cổng DK2
  buildPylonSign(-22, 0, -20, 'DK BIKE', 'TRỤ SỞ & KHO DK2', 0x0284c7, 'pylonDK2');

  // Hill DK1 (North)
  const hill1Cfg = CONFIG.HILLS.dk1;
  const hill1 = new THREE.Mesh(
    new THREE.ConeGeometry(hill1Cfg.radius, hill1Cfg.height, 9),
    new THREE.MeshStandardMaterial({ color: hill1Cfg.color, roughness: 0.9, flatShading: true })
  );
  hill1.position.set(hill1Cfg.position.x, hill1Cfg.height / 2 - 2, hill1Cfg.position.z);
  hill1.receiveShadow = true;
  scene.add(hill1);
}

// Xây dựng Cột tháp Pylon thương hiệu tại Cổng nhà máy
function buildPylonSign(x, y, z, brand, sub, colorHex, id) {
  const pylonGroup = new THREE.Group();
  pylonGroup.position.set(x, y, z);
  pylonGroup.userData = {
    id: id,
    title: brand + ' — ' + sub,
    desc: 'Cột tháp nhận diện thương hiệu tại cổng chính nhà máy, mặt tiền trục đường tỉnh ĐT234.',
    type: 'pylon',
    zone: id.includes('DK1') ? 'DK1' : 'DK2',
  };

  // Base bệ đá
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(2.4, 0.8, 1.4),
    new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 })
  );
  base.position.y = 0.4;
  base.castShadow = true;
  pylonGroup.add(base);

  // Tháp chính
  const tower = new THREE.Mesh(
    new THREE.BoxGeometry(1.8, 5.2, 0.6),
    new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.3, metalness: 0.4 })
  );
  tower.position.y = 3.2;
  tower.castShadow = true;
  pylonGroup.add(tower);

  // Đỉnh tháp đèn LED viền
  const cap = new THREE.Mesh(
    new THREE.BoxGeometry(2.0, 0.3, 0.8),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 })
  );
  cap.position.y = 5.9;
  pylonGroup.add(cap);

  // Mặt biển chữ nổi
  const signPanel = new THREE.Mesh(
    new THREE.PlaneGeometry(1.6, 1.4),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2 })
  );
  signPanel.position.set(0, 4.4, 0.32);
  pylonGroup.add(signPanel);

  scene.add(pylonGroup);
  interactiveObjects.push(tower);
}

// ============================================================================
// 3b. Đại cảnh Thảo nguyên xanh, Đồi nhấp nhô, Cối xay gió & Mây trời (Vibrant Low-Poly)
// ============================================================================
function buildVastTerrainAndClouds() {
  // 1. Thảm cỏ xanh mướt mát đại cảnh bao la
  const meadowGeo = new THREE.BoxGeometry(540, 2.0, 480);
  const meadowMat = new THREE.MeshStandardMaterial({
    color: CONFIG.GROUND.grassColor,
    roughness: 0.88,
    metalness: 0.05,
    flatShading: true,
  });
  const meadow = new THREE.Mesh(meadowGeo, meadowMat);
  meadow.position.set(-15, -2.0, -40);
  meadow.receiveShadow = true;
  scene.add(meadow);

  // 2. Dãy đồi xanh nhấp nhô phía sau (Mạn Đông & Đông-Bắc tạo thung lũng như ảnh 1 & 2)
  const hillsData = [
    { x: 125, y: 11, z: -80, radius: 52, height: 26, color: 0x22c55e },
    { x: 142, y: 9, z: -25, radius: 48, height: 22, color: 0x16a34a },
    { x: 132, y: 8, z: 38, radius: 45, height: 20, color: 0x4ade80 },
    { x: 55, y: 12, z: -108, radius: 54, height: 28, color: 0x22c55e }, // Đồi Bắc đặt cối xay gió
  ];

  hillsData.forEach((h) => {
    const hillMesh = new THREE.Mesh(
      new THREE.ConeGeometry(h.radius, h.height, 9),
      new THREE.MeshStandardMaterial({ color: h.color, roughness: 0.9, flatShading: true })
    );
    hillMesh.position.set(h.x, h.y, h.z);
    hillMesh.receiveShadow = true;
    scene.add(hillMesh);
  });

  // 3. Cối xay gió phong cách Hà Lan trên đỉnh đồi (Dutch Windmill - như ảnh 1)
  const windmillGroup = new THREE.Group();
  windmillGroup.position.set(55, 25.5, -108);

  // Tháp thân nón cụt trắng
  const millTower = new THREE.Mesh(
    new THREE.CylinderGeometry(2.2, 3.8, 9.5, 8),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.7, flatShading: true })
  );
  millTower.castShadow = true;
  windmillGroup.add(millTower);

  // Mái nón chóp đỏ rực rỡ
  const millRoof = new THREE.Mesh(
    new THREE.ConeGeometry(2.8, 2.8, 8),
    new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.6, flatShading: true })
  );
  millRoof.position.y = 5.8;
  millRoof.castShadow = true;
  windmillGroup.add(millRoof);

  // Cửa sổ & Cửa ra vào cối xay gió
  const doorMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 });
  const millDoor = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.6, 0.2), doorMat);
  millDoor.position.set(0, -3.2, 3.6);
  windmillGroup.add(millDoor);

  // Trục cánh quạt và 4 cánh quạt gỗ chữ thập
  const bladePivot = new THREE.Group();
  bladePivot.position.set(0, 5.0, 2.5);

  const hub = new THREE.Mesh(
    new THREE.CylinderGeometry(0.35, 0.35, 0.6, 8),
    new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6 })
  );
  hub.rotation.x = Math.PI / 2;
  bladePivot.add(hub);

  windmillBlades = new THREE.Group();
  const bladeMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.5 });
  const frameWoodMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.8 });

  for (let b = 0; b < 4; b++) {
    const bArm = new THREE.Group();
    bArm.rotation.z = (b * Math.PI) / 2;

    const spar = new THREE.Mesh(new THREE.BoxGeometry(0.18, 5.8, 0.1), frameWoodMat);
    spar.position.y = 2.9;
    bArm.add(spar);

    const cloth = new THREE.Mesh(new THREE.BoxGeometry(0.85, 4.2, 0.05), bladeMat);
    cloth.position.set(0.45, 3.4, 0.02);
    cloth.castShadow = true;
    bArm.add(cloth);

    windmillBlades.add(bArm);
  }
  bladePivot.add(windmillBlades);
  windmillGroup.add(bladePivot);

  windmillGroup.userData = {
    id: 'windmill',
    title: 'Cối xay gió cảnh quan sinh thái',
    type: 'landmark',
    desc: 'Điểm nhấn cảnh quan trên đỉnh đồi sinh thái xanh phía Bắc, biểu tượng năng lượng gió thân thiện môi trường của DK Bike.',
    zone: 'Đồi Sinh Thái Bắc',
  };
  millTower.userData = windmillGroup.userData;
  scene.add(windmillGroup);
  interactiveObjects.push(millTower);

  // 4. Mây trời low-poly bồng bềnh lơ lửng trên không (Sky Clouds)
  skyClouds = [];
  const cloudMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.4,
    flatShading: true,
  });

  const cloudConfigs = [
    { x: -140, y: 88, z: -100, scale: 1.4, speed: 2.5 },
    { x: -70, y: 95, z: -60, scale: 1.8, speed: 3.2 },
    { x: 10, y: 82, z: -120, scale: 1.2, speed: 2.2 },
    { x: 80, y: 100, z: -50, scale: 1.6, speed: 2.8 },
    { x: 130, y: 90, z: -80, scale: 1.5, speed: 3.0 },
    { x: -110, y: 78, z: 20, scale: 1.3, speed: 2.0 },
    { x: 30, y: 92, z: 40, scale: 1.7, speed: 3.4 },
    { x: 120, y: 85, z: 15, scale: 1.4, speed: 2.6 },
  ];

  cloudConfigs.forEach((c) => {
    const cGroup = new THREE.Group();
    cGroup.position.set(c.x, c.y, c.z);

    // Ghép 4-5 khối tròn đa diện tạo cụm mây xốp
    const puffs = [
      { x: 0, y: 0, z: 0, r: 4.0 },
      { x: 3.2, y: -0.5, z: 0.4, r: 3.2 },
      { x: -3.0, y: -0.4, z: -0.3, r: 3.0 },
      { x: 1.2, y: 1.5, z: 0, r: 3.4 },
      { x: -1.4, y: 1.2, z: 0.2, r: 2.8 },
    ];

    puffs.forEach((p) => {
      const puffMesh = new THREE.Mesh(new THREE.DodecahedronGeometry(p.r, 1), cloudMat);
      puffMesh.position.set(p.x, p.y, p.z);
      cGroup.add(puffMesh);
    });

    cGroup.scale.setScalar(c.scale);
    cGroup.userData = { speed: c.speed, initialX: c.x };
    scene.add(cGroup);
    skyClouds.push(cGroup);
  });
}

// ============================================================================
// 4. DK1: Retaining Wall, Canal & Railway
// ============================================================================
function buildRetainingWall() {
  const wallConfig = CONFIG.RETAINING_WALL;
  const wall = new THREE.Mesh(
    new THREE.BoxGeometry(wallConfig.width, wallConfig.height, 125),
    new THREE.MeshStandardMaterial({ color: wallConfig.color, roughness: 0.9, flatShading: true })
  );
  wall.position.set(wallConfig.positionX, -wallConfig.height / 2 + 0.2, -42);
  wall.castShadow = true;
  wall.receiveShadow = true;
  scene.add(wall);

  // Stone steps
  for (let i = 0; i < 6; i++) {
    const step = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 0.4, 3.0),
      new THREE.MeshStandardMaterial({ color: 0x7a8490, roughness: 0.9 })
    );
    step.position.set(wallConfig.positionX - 0.2 + i * 0.25, -0.2 - i * 0.4, -30);
    scene.add(step);
  }
}

// Tuyến đường sắt cong, Cầu vòm đỏ, Ga xe lửa DK Station, Sông máng & Đàn cừu (Toàn diện theo 3 ảnh mẫu)
function buildCanalAndRailway() {
  // --------------------------------------------------------------------------
  // A. Sông máng nước uốn lượn xanh ngọc trong vắt, bãi cát ven bờ (như ảnh 2)
  // --------------------------------------------------------------------------
  const canalConfig = CONFIG.CANAL;
  const canalLength = 175;

  // Lòng sông đáy cát vàng
  const canalBed = new THREE.Mesh(
    new THREE.BoxGeometry(canalConfig.width + 5.0, 1.8, canalLength),
    new THREE.MeshStandardMaterial({ color: CONFIG.GROUND.sandColor, roughness: 0.9 })
  );
  canalBed.position.set(89.0, -2.4, -35);
  scene.add(canalBed);

  // Mặt nước xanh ngọc trong veo
  waterCanalMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(canalConfig.width + 3.0, canalLength),
    new THREE.MeshStandardMaterial({
      color: canalConfig.waterColor,
      roughness: 0.12,
      metalness: 0.5,
      transparent: true,
      opacity: 0.88,
    })
  );
  waterCanalMesh.rotation.x = -Math.PI / 2;
  waterCanalMesh.position.set(89.0, -1.4, -35);
  waterCanalMesh.receiveShadow = true;
  scene.add(waterCanalMesh);

  // Dải bãi cát vàng thoai thoải viền 2 bên bờ sông (như ảnh 2)
  const sandMat = new THREE.MeshStandardMaterial({ color: CONFIG.GROUND.sandColor, roughness: 0.95, flatShading: true });
  const sandLeft = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.4, canalLength), sandMat);
  sandLeft.position.set(82.2, -1.2, -35);
  scene.add(sandLeft);

  const sandRight = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.4, canalLength), sandMat);
  sandRight.position.set(95.6, -1.2, -35);
  scene.add(sandRight);

  // Thuyền gỗ mộc mạc có người chèo đò đứng giữa dòng sông (như ảnh 2)
  const boatGroup = new THREE.Group();
  boatGroup.position.set(89.5, -1.3, -8);

  const boatHull = new THREE.Mesh(
    new THREE.BoxGeometry(1.6, 0.6, 4.2),
    new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.8 })
  );
  boatHull.castShadow = true;
  boatGroup.add(boatHull);

  // Người chèo đò
  const boatman = createCharacter({ shirtColor: 0xef4444, pantsColor: 0x1e293b, hatColor: 0xfef08a, isDriver: true });
  boatman.position.set(0, 0.25, 0.4);
  boatGroup.add(boatman);

  // Mái chèo gỗ
  const oar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 2.8),
    new THREE.MeshStandardMaterial({ color: 0xd4a373, roughness: 0.7 })
  );
  oar.rotation.z = Math.PI / 4;
  oar.position.set(0.6, 0.7, 0.2);
  boatGroup.add(oar);

  boatGroup.userData = {
    id: 'rowingBoat',
    title: 'Thuyền nan du ngoạn sinh thái trên sông',
    type: 'boat',
    desc: 'Hoạt động chèo thuyền thư giãn trên dòng sông máng nước trong vắt bao quanh khuôn viên DK Bike.',
    zone: 'Sông Máng Nước',
  };
  boatHull.userData = boatGroup.userData;
  scene.add(boatGroup);
  interactiveObjects.push(boatHull);
  rowingBoat = boatGroup;

  // Lá sen tròn to khuyết chữ V (Lily Pads) nổi bồng bềnh quanh thuyền (như ảnh 2)
  const lilyMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.6, side: THREE.DoubleSide });
  const lilyFlowerMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.3 });
  lotusLeaves = [];

  const lilyPositions = [
    { x: 88.0, z: -5.0, s: 1.1 },
    { x: 91.2, z: -6.5, s: 0.9 },
    { x: 87.5, z: -11.0, s: 1.3 },
    { x: 90.8, z: -12.5, s: 1.0 },
    { x: 89.2, z: -15.0, s: 1.4 },
    { x: 87.0, z: -2.0, s: 0.8 },
    { x: 91.5, z: -1.0, s: 1.2 },
  ];

  lilyPositions.forEach((lp, lIdx) => {
    const pad = new THREE.Mesh(new THREE.CircleGeometry(0.85 * lp.s, 12, 0.4, Math.PI * 1.85), lilyMat);
    pad.rotation.x = -Math.PI / 2;
    pad.position.set(lp.x, -1.35, lp.z);
    scene.add(pad);
    lotusLeaves.push(pad);

    if (lIdx % 2 === 0) {
      const flower = new THREE.Mesh(new THREE.DodecahedronGeometry(0.25 * lp.s), lilyFlowerMat);
      flower.position.set(lp.x + 0.1, -1.25, lp.z - 0.1);
      scene.add(flower);
    }
  });

  // Đàn cá xanh bơi lội dưới sông (như ảnh 2)
  riverFishGroup = new THREE.Group();
  riverFishGroup.position.set(89.0, -1.5, -9);
  const fishMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3 });

  for (let f = 0; f < 8; f++) {
    const fMesh = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.45, 5), fishMat);
    fMesh.rotation.x = Math.PI / 2;
    const fAngle = (f / 8) * Math.PI * 2;
    fMesh.position.set(Math.cos(fAngle) * 1.6, 0, Math.sin(fAngle) * 1.6);
    fMesh.rotation.y = -fAngle + Math.PI / 2;
    riverFishGroup.add(fMesh);
  }
  scene.add(riverFishGroup);

  // Cầu gỗ mộc bắc qua khúc sông ở mạn Nam
  const woodBridge = new THREE.Mesh(
    new THREE.BoxGeometry(canalConfig.width + 3.5, 0.35, 3.2),
    new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.85 })
  );
  woodBridge.position.set(89.0, -0.9, 18);
  woodBridge.castShadow = true;
  scene.add(woodBridge);

  // --------------------------------------------------------------------------
  // B. Tuyến đường sắt cong uốn lượn (Curved Railway) bằng CatmullRomCurve3
  // --------------------------------------------------------------------------
  const railCurvePoints = [
    new THREE.Vector3(122, 0.3, -118),
    new THREE.Vector3(108, 0.5, -88),
    new THREE.Vector3(97, 1.8, -62), // Bắt đầu lên Cầu vòm đỏ
    new THREE.Vector3(93.5, 1.8, -48), // Giữa Cầu vòm đỏ bắc qua sông máng
    new THREE.Vector3(90.5, 0.8, -32), // Xuống cầu
    new THREE.Vector3(90.0, 0.25, -12), // Đi ngang qua Ga xe lửa DK Station
    new THREE.Vector3(91.5, 0.25, 8),  // Qua ga và giao cắt đường bộ
    new THREE.Vector3(100.0, 0.35, 35), // Uốn cong về phía đông nam
    new THREE.Vector3(116.0, 0.4, 68),
  ];
  railwayCurve = new THREE.CatmullRomCurve3(railCurvePoints);

  // Nền đá cát ballast uốn cong theo tim ray (như ảnh 1 & 3)
  const ballastTube = new THREE.Mesh(
    new THREE.TubeGeometry(railwayCurve, 120, 2.2, 5, false),
    new THREE.MeshStandardMaterial({ color: CONFIG.RAILWAY.ballastColor, roughness: 0.95, flatShading: true })
  );
  ballastTube.scale.set(1.0, 0.25, 1.0);
  ballastTube.position.y = -0.15;
  ballastTube.receiveShadow = true;
  scene.add(ballastTube);

  // Hai thanh ray thép uốn lượn song song sáng bóng
  const railGauge = CONFIG.RAILWAY.railGauge;
  const railMat = new THREE.MeshStandardMaterial({
    color: CONFIG.RAILWAY.railColor,
    roughness: 0.25,
    metalness: 0.85,
  });

  const rail1Points = [];
  const rail2Points = [];
  const totalSamples = 160;

  for (let i = 0; i <= totalSamples; i++) {
    const t = i / totalSamples;
    const pt = railwayCurve.getPointAt(t);
    const tangent = railwayCurve.getTangentAt(t);
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

    rail1Points.push(pt.clone().add(normal.clone().multiplyScalar(-railGauge / 2)).add(new THREE.Vector3(0, 0.18, 0)));
    rail2Points.push(pt.clone().add(normal.clone().multiplyScalar(railGauge / 2)).add(new THREE.Vector3(0, 0.18, 0)));
  }

  const rail1Curve = new THREE.CatmullRomCurve3(rail1Points);
  const rail2Curve = new THREE.CatmullRomCurve3(rail2Points);

  const railMesh1 = new THREE.Mesh(new THREE.TubeGeometry(rail1Curve, 140, 0.08, 6, false), railMat);
  railMesh1.castShadow = true;
  scene.add(railMesh1);

  const railMesh2 = new THREE.Mesh(new THREE.TubeGeometry(rail2Curve, 140, 0.08, 6, false), railMat);
  railMesh2.castShadow = true;
  scene.add(railMesh2);

  // Tà vẹt gỗ vuông góc tiếp tuyến đường ray
  const sleeperCount = 135;
  const sleeperGeo = new THREE.BoxGeometry(2.3, 0.14, 0.38);
  const sleeperMat = new THREE.MeshStandardMaterial({ color: CONFIG.RAILWAY.sleeperColor, roughness: 0.9 });
  const sleeperInstanced = new THREE.InstancedMesh(sleeperGeo, sleeperMat, sleeperCount);
  sleeperInstanced.castShadow = true;
  sleeperInstanced.receiveShadow = true;

  const dummy = new THREE.Object3D();
  for (let s = 0; s < sleeperCount; s++) {
    const t = s / (sleeperCount - 1);
    const pos = railwayCurve.getPointAt(t);
    const tangent = railwayCurve.getTangentAt(t);
    const angleY = Math.atan2(tangent.x, tangent.z);

    dummy.position.set(pos.x, pos.y + 0.06, pos.z);
    dummy.rotation.set(0, angleY + Math.PI / 2, 0);
    dummy.updateMatrix();
    sleeperInstanced.setMatrixAt(s, dummy.matrix);
  }
  sleeperInstanced.instanceMatrix.needsUpdate = true;
  scene.add(sleeperInstanced);

  // --------------------------------------------------------------------------
  // C. Cây Cầu vòm đường sắt màu đỏ tươi rực rỡ (Red Arch Railway Bridge - như ảnh 1)
  // --------------------------------------------------------------------------
  const bridgeGroup = new THREE.Group();
  bridgeGroup.position.set(95.0, 0, -49);
  bridgeGroup.rotation.y = 0.38; // Khớp góc xiên đường sắt

  const redSteelMat = new THREE.MeshStandardMaterial({
    color: CONFIG.RAILWAY.bridgeArchColor,
    roughness: 0.35,
    metalness: 0.5,
  });

  // Bản mặt cầu dầm thép đỏ
  const deck = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.6, 26), redSteelMat);
  deck.position.y = 1.8;
  deck.castShadow = true;
  bridgeGroup.add(deck);

  // Hai vòm thép đỏ hình bán nguyệt hai bên
  [-2.2, 2.2].forEach((archX) => {
    // Vòm cong bằng CylinderGeometry cắt nửa
    const archSegment = new THREE.Mesh(
      new THREE.CylinderGeometry(11.5, 11.5, 0.45, 16, 1, true, 0, Math.PI),
      redSteelMat
    );
    archSegment.rotation.z = Math.PI / 2;
    archSegment.rotation.y = Math.PI / 2;
    archSegment.position.set(archX, 0.2, 0);
    archSegment.scale.set(0.45, 1.0, 1.0);
    archSegment.castShadow = true;
    bridgeGroup.add(archSegment);

    // Lan can đỏ trên mặt cầu
    const railTop = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 25), redSteelMat);
    railTop.position.set(archX, 2.9, 0);
    bridgeGroup.add(railTop);

    for (let rz = -12; rz <= 12; rz += 2.0) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.9, 0.08), redSteelMat);
      post.position.set(archX, 2.45, rz);
      bridgeGroup.add(post);
    }
  });

  // Mố cầu đá kiên cố cắm xuống đáy sông
  const pierMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.9 });
  [-11, 11].forEach((pz) => {
    const pier = new THREE.Mesh(new THREE.BoxGeometry(5.2, 4.0, 3.2), pierMat);
    pier.position.set(0, -0.4, pz);
    pier.castShadow = true;
    pier.receiveShadow = true;
    bridgeGroup.add(pier);
  });

  bridgeGroup.userData = {
    id: 'redArchBridge',
    title: 'Cầu vòm đường sắt màu đỏ (Red Arch Railway Bridge)',
    type: 'bridge',
    desc: 'Cầu vòm đường sắt kết cấu thép sơn đỏ rực rỡ bắc qua thung lũng sông máng nước, tạo điểm nhấn cảnh quan sinh thái hùng vĩ.',
    zone: 'Đường sắt Bắc - Nam',
  };
  deck.userData = bridgeGroup.userData;
  scene.add(bridgeGroup);
  interactiveObjects.push(deck);

  // --------------------------------------------------------------------------
  // D. Ga xe lửa DK Station (như ảnh 3: Mái ngói đỏ, ke ga trắng, barie, biển ga)
  // --------------------------------------------------------------------------
  const stationGroup = new THREE.Group();
  stationGroup.position.set(87.5, 0, -2.0);

  // Sân ke ga bê tông trắng
  const platform = new THREE.Mesh(
    new THREE.BoxGeometry(5.2, 0.55, 24),
    new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.7 })
  );
  platform.position.y = 0.28;
  platform.receiveShadow = true;
  stationGroup.add(platform);

  // Vạch an toàn màu vàng trên ke ga
  const safetyLine = new THREE.Mesh(
    new THREE.PlaneGeometry(0.18, 23.5),
    new THREE.MeshBasicMaterial({ color: 0xfacc15 })
  );
  safetyLine.rotation.x = -Math.PI / 2;
  safetyLine.position.set(2.2, 0.56, 0);
  stationGroup.add(safetyLine);

  // Tòa nhà ga nhỏ phong cách châu Âu
  const stationBuilding = new THREE.Group();
  stationBuilding.position.set(-0.8, 0.55, -2.0);

  // Thân nhà tường trắng kem
  const stWalls = new THREE.Mesh(
    new THREE.BoxGeometry(3.6, 3.2, 10.5),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.6 })
  );
  stWalls.position.y = 1.6;
  stWalls.castShadow = true;
  stationBuilding.add(stWalls);

  // Mái ngói đỏ dốc tươi tắn (như ảnh 3)
  const stRoof = new THREE.Mesh(
    new THREE.ConeGeometry(3.5, 2.2, 4),
    new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.5, flatShading: true })
  );
  stRoof.rotation.y = Math.PI / 4;
  stRoof.scale.set(1.2, 1.0, 2.8);
  stRoof.position.y = 3.9;
  stRoof.castShadow = true;
  stationBuilding.add(stRoof);

  // Hiên che sân ga cột xanh
  const porchRoof = new THREE.Mesh(
    new THREE.BoxGeometry(2.4, 0.15, 11),
    new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.6 })
  );
  porchRoof.position.set(2.4, 2.7, 0);
  stationBuilding.add(porchRoof);

  const columnMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.5 });
  for (let cz = -4.5; cz <= 4.5; cz += 3.0) {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.7), columnMat);
    col.position.set(3.4, 1.35, cz);
    stationBuilding.add(col);
  }

  // Biển hiệu tên ga "GA XE LỬA DK BIKE" (như biển Willowbend trong ảnh 3)
  const signBoard = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 0.8, 3.2),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3 })
  );
  signBoard.position.set(3.45, 3.2, 0);
  stationBuilding.add(signBoard);

  // Đồng hồ tròn treo tường chỉ giờ
  const clockMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.35, 0.35, 0.1, 16),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 })
  );
  clockMesh.rotation.z = Math.PI / 2;
  clockMesh.position.set(1.85, 2.2, 0);
  stationBuilding.add(clockMesh);

  // Ghế băng gỗ chờ tàu trên ke ga
  const benchMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.8 });
  const bench = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.45, 1.8), benchMat);
  bench.position.set(1.2, 0.25, 4.2);
  stationBuilding.add(bench);

  // Valy hành lý của khách
  const luggage = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, 0.3, 0.6),
    new THREE.MeshStandardMaterial({ color: 0x7c3aed, roughness: 0.5 })
  );
  luggage.position.set(1.2, 0.15, 5.5);
  stationBuilding.add(luggage);

  // Trưởng ga & Khách đợi tàu
  const stationMaster = createCharacter({ shirtColor: 0x1e3a8a, pantsColor: 0x1e293b, hatColor: 0xef4444 });
  stationMaster.position.set(1.6, 0, 1.5);
  stationBuilding.add(stationMaster);

  const passenger = createCharacter({ shirtColor: 0x059669, pantsColor: 0x334155, hatColor: 0xfef08a });
  passenger.position.set(1.5, 0, -3.2);
  stationBuilding.add(passenger);

  stationGroup.add(stationBuilding);

  // Cột barie chắn tàu đường sắt (như ảnh 3: sọc đỏ trắng)
  const gatePost = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.22, 1.4, 8),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 })
  );
  gatePost.position.set(3.2, 0.7, 7.5);
  stationGroup.add(gatePost);

  const gateArmPivot = new THREE.Group();
  gateArmPivot.position.set(3.2, 1.3, 7.5);

  const gateArm = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 0.14, 5.0),
    new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.5 })
  );
  gateArm.position.set(0, 0, 2.5);
  gateArmPivot.add(gateArm);
  stationGroup.add(gateArmPivot);
  railwayGateArms.push({ pivot: gateArmPivot, currentAngle: 0, targetAngle: 0 });

  stationGroup.userData = {
    id: 'dkStation',
    title: 'Ga xe lửa DK Station (Willowbend Style)',
    type: 'station',
    desc: 'Nhà ga đường sắt hành khách và hàng hóa kết nối khuôn viên DK Bike với mạng lưới đường sắt quốc gia.',
    zone: 'Ga DK Station',
  };
  stWalls.userData = stationGroup.userData;
  scene.add(stationGroup);
  interactiveObjects.push(stWalls);

  // --------------------------------------------------------------------------
  // E. Cụm làng quê / nhà dân chân đồi mái ngói màu sắc (như ảnh 3)
  // --------------------------------------------------------------------------
  const villageHouses = [
    { x: 108, z: -25, color: 0xef4444, rot: 0.1 },
    { x: 116, z: -30, color: 0x2563eb, rot: -0.2 },
    { x: 124, z: -22, color: 0xf97316, rot: 0.3 },
    { x: 112, z: -12, color: 0x059669, rot: 0.05 },
    { x: 120, z: -8, color: 0xeab308, rot: -0.15 },
    { x: 128, z: -14, color: 0xdc2626, rot: 0.2 },
    { x: 114, z: 5, color: 0x3b82f6, rot: -0.1 },
    { x: 122, z: 12, color: 0xf97316, rot: 0.25 },
  ];

  const wallMatWhite = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.7 });
  chimneySmokePuffs = [];

  villageHouses.forEach((vh, vIdx) => {
    const houseGroup = new THREE.Group();
    houseGroup.position.set(vh.x, 0.2, vh.z);
    houseGroup.rotation.y = vh.rot;

    // Tường nhà trắng
    const body = new THREE.Mesh(new THREE.BoxGeometry(3.6, 3.2, 3.8), wallMatWhite);
    body.position.y = 1.6;
    body.castShadow = true;
    houseGroup.add(body);

    // Mái dốc màu sắc
    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(3.4, 2.2, 4),
      new THREE.MeshStandardMaterial({ color: vh.color, roughness: 0.5, flatShading: true })
    );
    roof.rotation.y = Math.PI / 4;
    roof.position.y = 4.1;
    roof.castShadow = true;
    houseGroup.add(roof);

    // Ống khói
    const chimney = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 1.6, 0.5),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.8 })
    );
    chimney.position.set(1.0, 4.4, 0.8);
    houseGroup.add(chimney);

    // Khói trắng zíc zắc bốc lên từ ống khói (như ảnh 3)
    const puffMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc, transparent: true, opacity: 0.7 });
    for (let cp = 0; cp < 4; cp++) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(0.24 + cp * 0.1, 6, 6), puffMat);
      puff.position.set(1.0 + (cp % 2 === 0 ? 0.15 : -0.15), 5.4 + cp * 0.7, 0.8);
      houseGroup.add(puff);
      chimneySmokePuffs.push(puff);
    }

    scene.add(houseGroup);
  });

  // Đường mòn đất cát vàng dẫn từ làng ra ga xe lửa (như ảnh 3)
  const pathMat = new THREE.MeshStandardMaterial({ color: CONFIG.GROUND.sandColor, roughness: 0.95 });
  const villagePath = new THREE.Mesh(new THREE.PlaneGeometry(3.5, 35), pathMat);
  villagePath.rotation.x = -Math.PI / 2;
  villagePath.rotation.z = -0.3;
  villagePath.position.set(104, 0.08, -6);
  villagePath.receiveShadow = true;
  scene.add(villagePath);

  // --------------------------------------------------------------------------
  // F. Đàn cừu trắng muốt đầu đen trên sườn đồi xanh & Bóng thoại (như ảnh 2)
  // --------------------------------------------------------------------------
  const sheepGroup = new THREE.Group();
  sheepGroup.position.set(120, 3.5, -62);

  const woolMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, flatShading: true });
  const sheepBlackMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });

  const sheepCoords = [
    { x: 0, z: 0, rot: 0.3 },
    { x: 2.2, z: -1.2, rot: -0.5 },
    { x: -1.8, z: 1.5, rot: 0.8 },
    { x: 3.5, z: 1.8, rot: 2.1 },
    { x: 1.2, z: 3.2, rot: 1.2 },
    { x: -3.2, z: -1.5, rot: -1.8 },
    { x: 4.8, z: -0.5, rot: -0.2 },
  ];

  sheepCoords.forEach((sc, sIdx) => {
    const oneSheep = new THREE.Group();
    oneSheep.position.set(sc.x, 0, sc.z);
    oneSheep.rotation.y = sc.rot;

    // Thân lông xù trắng
    const bodyWool = new THREE.Mesh(new THREE.DodecahedronGeometry(0.65, 1), woolMat);
    bodyWool.scale.set(1.0, 0.85, 1.35);
    bodyWool.position.y = 0.65;
    bodyWool.castShadow = true;
    oneSheep.add(bodyWool);

    // Đầu đen
    const sheepHead = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.35, 0.42), sheepBlackMat);
    sheepHead.position.set(0, 0.82, 0.72);
    oneSheep.add(sheepHead);

    // Tai vểnh hai bên
    [-0.22, 0.22].forEach((ex) => {
      const ear = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.08, 0.1), sheepBlackMat);
      ear.position.set(ex, 0.92, 0.65);
      oneSheep.add(ear);
    });

    // 4 chân đen ngắn
    [-0.24, 0.24].forEach((lx) => {
      [-0.35, 0.35].forEach((lz) => {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.4, 0.12), sheepBlackMat);
        leg.position.set(lx, 0.2, lz);
        oneSheep.add(leg);
      });
    });

    sheepGroup.add(oneSheep);
    fluffySheeps.push(oneSheep);
  });

  // Bóng thoại hoạt hình đáng yêu (như ảnh 2: "I could dance all afternoon!")
  const speechBubble = new THREE.Mesh(
    new THREE.BoxGeometry(3.6, 1.2, 0.1),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 })
  );
  speechBubble.position.set(2.5, 3.2, 0.5);
  speechBubble.rotation.y = -Math.PI / 4;
  sheepGroup.add(speechBubble);

  const bubbleTail = new THREE.Mesh(
    new THREE.ConeGeometry(0.35, 0.6, 3),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 })
  );
  bubbleTail.rotation.z = Math.PI;
  bubbleTail.position.set(1.6, 2.3, 0.5);
  sheepGroup.add(bubbleTail);

  sheepGroup.userData = {
    id: 'sheepFlock',
    title: 'Đàn cừu sinh thái trên đồi cỏ (Eco Sheep Flock)',
    type: 'animals',
    desc: 'Đàn cừu trắng muốt gặm cỏ thong dong trên sườn đồi xanh ngắt, biểu tượng của môi trường sinh thái trong lành tại DK Bike Campus.',
    zone: 'Đồi Sinh Thái Đông',
  };
  speechBubble.userData = sheepGroup.userData;
  scene.add(sheepGroup);
  interactiveObjects.push(speechBubble);
}

// ============================================================================
// 5. DK1: Roads & Test Track
// ============================================================================
function buildRoadsAndTestTrack() {
  const roadMat = new THREE.MeshStandardMaterial({ color: CONFIG.ROADS.roadColor, roughness: 0.8 });

  // Đường trước Nhà A
  const road1 = new THREE.Mesh(new THREE.PlaneGeometry(55, 3.5), roadMat);
  road1.rotation.x = -Math.PI / 2;
  road1.position.set(40, 0.02, -26.5);
  road1.receiveShadow = true;
  scene.add(road1);

  // Test track phía Bắc Nhà B
  const trackNorth = new THREE.Mesh(new THREE.PlaneGeometry(35, 3.2), roadMat);
  trackNorth.rotation.x = -Math.PI / 2;
  trackNorth.position.set(65, 0.02, -69.5);
  trackNorth.receiveShadow = true;
  scene.add(trackNorth);

  // Test track phía Đông Nhà B
  const trackEast = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 45), roadMat);
  trackEast.rotation.x = -Math.PI / 2;
  trackEast.position.set(79, 0.02, -49);
  trackEast.receiveShadow = true;
  scene.add(trackEast);

  // Sân tập kết xe sau chạy thử
  const testYard = new THREE.Mesh(
    new THREE.PlaneGeometry(28, 10),
    new THREE.MeshStandardMaterial({ color: 0x4f5860, roughness: 0.75 })
  );
  testYard.rotation.x = -Math.PI / 2;
  testYard.position.set(65, 0.02, -30);
  testYard.receiveShadow = true;
  scene.add(testYard);

  // Mũi tên sơn vàng chạy thử
  const arrowMat = new THREE.MeshBasicMaterial({ color: 0xffcc00 });
  for (let z = -65; z <= -35; z += 12) {
    const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.6, 1.2, 3), arrowMat);
    arrow.rotation.x = -Math.PI / 2;
    arrow.rotation.z = Math.PI;
    arrow.position.set(79, 0.03, z);
    scene.add(arrow);
  }
}

// ============================================================================
// 6. DK1: Buildings
// ============================================================================
function buildDK1Buildings() {
  buildNhaB();
  buildNhaA();
  buildNhaC();
  buildNhaAn();
  buildNhaBaoVeDK1();
}

function buildNhaB() {
  const cfg = CONFIG.BUILDINGS.nhaB;
  const group = new THREE.Group();
  group.position.set(cfg.position.x, 0, cfg.position.z);
  group.userData = { id: 'nhaB', config: cfg };

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(cfg.width, cfg.height - 1.5, cfg.depth),
    new THREE.MeshStandardMaterial({ color: cfg.wallColor, roughness: 0.6, metalness: 0.2 })
  );
  body.position.y = (cfg.height + 1.5) / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const base = new THREE.Mesh(
    new THREE.BoxGeometry(cfg.width + 0.1, 1.5, cfg.depth + 0.1),
    new THREE.MeshStandardMaterial({ color: cfg.baseWallColor, roughness: 0.7 })
  );
  base.position.y = 0.75;
  base.castShadow = true;
  group.add(base);

  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(cfg.width + 0.8, 0.8, cfg.depth + 0.8),
    new THREE.MeshStandardMaterial({ color: cfg.roofColor, roughness: 0.5 })
  );
  roof.position.y = cfg.height + 0.4;
  roof.castShadow = true;
  group.add(roof);

  const monCfg = cfg.monitorRoof;
  const monitor = new THREE.Mesh(
    new THREE.BoxGeometry(monCfg.width, monCfg.height, monCfg.depth),
    new THREE.MeshStandardMaterial({ color: monCfg.color, roughness: 0.5 })
  );
  monitor.position.y = cfg.height + 0.8 + monCfg.height / 2;
  monitor.castShadow = true;
  group.add(monitor);

  // Roof ventilator fans
  for (let vz = -8; vz <= 8; vz += 8) {
    const vent = new THREE.Mesh(
      new THREE.CylinderGeometry(0.6, 0.6, 0.5, 8),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.4 })
    );
    vent.position.set(0, cfg.height + 0.8 + monCfg.height + 0.25, vz);
    group.add(vent);
    roofVentilators.push(vent);
  }

  // Windows
  const windowMat = new THREE.MeshStandardMaterial({ color: 0x93c5fd, roughness: 0.1, metalness: 0.8 });
  windowLights.push(windowMat);
  for (let story = 1; story <= 3; story++) {
    const winHeight = 1.0;
    const winY = 1.5 + (story - 0.5) * 3.8;
    const winSouth = new THREE.Mesh(new THREE.PlaneGeometry(cfg.width - 4, winHeight), windowMat);
    winSouth.position.set(0, winY, cfg.depth / 2 + 0.05);
    group.add(winSouth);

    const winEast = new THREE.Mesh(new THREE.PlaneGeometry(cfg.depth - 4, winHeight), windowMat);
    winEast.rotation.y = Math.PI / 2;
    winEast.position.set(cfg.width / 2 + 0.05, winY, 0);
    group.add(winEast);
  }

  // 2 Cửa cuốn công nghiệp Xưởng B (Mặt tiền quay về sân giao nhận phía Nam)
  createShutterDoor(group, -5.5, 0, cfg.depth / 2 + 0.08, 5.4, 4.0, 'doorB1', 'Cửa cuốn chính Xưởng B');
  createShutterDoor(group, 5.5, 0, cfg.depth / 2 + 0.08, 5.0, 4.0, 'doorB2', 'Cửa xuất nhập hàng Xưởng B');

  // Logo Badge "DK Bike"
  createBuildingLogo(group, cfg);

  scene.add(group);
  buildingMeshes.push(body);
}

// Hàm khởi tạo Cửa cuốn công nghiệp có thể mở/đóng và lộ dây chuyền bên trong
function createShutterDoor(parentGroup, x, y, z, width, height, id, name) {
  const doorGroup = new THREE.Group();
  doorGroup.position.set(x, y, z);

  // Door Frame
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 });
  const fTop = new THREE.Mesh(new THREE.BoxGeometry(width + 0.4, 0.25, 0.2), frameMat);
  fTop.position.set(0, height + 0.12, 0);
  doorGroup.add(fTop);

  const fLeft = new THREE.Mesh(new THREE.BoxGeometry(0.2, height, 0.2), frameMat);
  fLeft.position.set(-width / 2 - 0.05, height / 2, 0);
  doorGroup.add(fLeft);

  const fRight = new THREE.Mesh(new THREE.BoxGeometry(0.2, height, 0.2), frameMat);
  fRight.position.set(width / 2 + 0.05, height / 2, 0);
  doorGroup.add(fRight);

  // Hộp cuốn trục trên đỉnh
  const drum = new THREE.Mesh(
    new THREE.CylinderGeometry(0.35, 0.35, width + 0.2, 12),
    new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4, metalness: 0.5 })
  );
  drum.rotation.z = Math.PI / 2;
  drum.position.set(0, height + 0.4, 0.12);
  doorGroup.add(drum);

  // Tấm nan cửa cuốn (Curtain slats)
  const curtainMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    roughness: 0.35,
    metalness: 0.7,
  });
  const curtain = new THREE.Mesh(
    new THREE.BoxGeometry(width - 0.05, height, 0.08),
    curtainMat
  );
  curtain.position.set(0, height / 2, 0);
  doorGroup.add(curtain);

  // Đèn bên trong xưởng (sáng ra ngoài khi mở cửa)
  const interiorLight = new THREE.PointLight(0xfef08a, 0.3, 16);
  interiorLight.position.set(0, height - 0.5, -2.5);
  doorGroup.add(interiorLight);
  interiorFactoryLights.push(interiorLight);

  // Băng chuyền và khung xe máy điện bên trong xưởng
  const conveyor = new THREE.Mesh(
    new THREE.BoxGeometry(width * 0.8, 0.6, 3.8),
    new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 })
  );
  conveyor.position.set(0, 0.3, -2.5);
  doorGroup.add(conveyor);

  const chassis = new THREE.Mesh(
    new THREE.BoxGeometry(1.6, 0.7, 0.5),
    new THREE.MeshStandardMaterial({ color: 0xffb703, roughness: 0.3 })
  );
  chassis.position.set(0, 0.95, -2.5);
  doorGroup.add(chassis);

  // Metadata tương tác
  const doorData = {
    id: id,
    title: name,
    type: 'shutterDoor',
    desc: 'Cửa cuốn công nghiệp chống cháy tự động. Cho phép xe nâng bốc dỡ linh kiện vào dây chuyền. Nhấp chuột vào cửa để Mở / Đóng.',
    zone: id.includes('DK2') ? 'DK2' : 'DK1',
  };
  doorGroup.userData = doorData;
  curtain.userData = doorData;

  parentGroup.add(doorGroup);
  shutterDoors.push({
    doorGroup,
    curtain,
    initialHeight: height,
    isOpen: false,
    currentProgress: 0,
    targetProgress: 0,
    interiorLight,
    id,
  });
  interactiveObjects.push(curtain);

  return doorGroup;
}


function createBuildingLogo(group, cfg) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffb703';
  ctx.font = 'bold 74px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('DK Bike', 256, 64);

  const texture = new THREE.CanvasTexture(canvas);
  const logoMat = new THREE.MeshBasicMaterial({ map: texture, transparent: true });

  const logoSouth = new THREE.Mesh(new THREE.PlaneGeometry(8.0, 2.0), logoMat);
  logoSouth.position.set(0, cfg.height - 2.2, cfg.depth / 2 + 0.08);
  group.add(logoSouth);

  const logoEast = new THREE.Mesh(new THREE.PlaneGeometry(8.0, 2.0), logoMat);
  logoEast.rotation.y = Math.PI / 2;
  logoEast.position.set(cfg.width / 2 + 0.08, cfg.height - 2.2, 5.0);
  group.add(logoEast);
}

function buildNhaA() {
  const cfg = CONFIG.BUILDINGS.nhaA;
  const group = new THREE.Group();
  group.position.set(cfg.position.x, 0, cfg.position.z);
  group.userData = { id: 'nhaA', config: cfg };

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(cfg.width, cfg.height, cfg.depth),
    new THREE.MeshStandardMaterial({ color: cfg.wallColor, roughness: 0.65, metalness: 0.15 })
  );
  body.position.y = cfg.height / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(cfg.width + 0.6, 0.6, cfg.depth + 0.6),
    new THREE.MeshStandardMaterial({ color: cfg.roofColor, roughness: 0.4 })
  );
  roof.position.y = cfg.height + 0.3;
  roof.castShadow = true;
  group.add(roof);

  // Blue outdoor escape stairs
  const stair = new THREE.Mesh(
    new THREE.BoxGeometry(2.0, cfg.height - 1.5, 3.5),
    new THREE.MeshStandardMaterial({ color: cfg.stairColor, roughness: 0.5, metalness: 0.5 })
  );
  stair.position.set(-cfg.width / 2 - 1.0, (cfg.height - 1.5) / 2, 0);
  stair.castShadow = true;
  group.add(stair);

  // Windows
  const winMat = new THREE.MeshStandardMaterial({ color: 0xbae6fd, roughness: 0.1, metalness: 0.7 });
  windowLights.push(winMat);
  for (let story = 1; story <= 3; story++) {
    const winY = (story - 0.4) * 3.4;
    const winSouth = new THREE.Mesh(new THREE.PlaneGeometry(cfg.width - 4, 1.2), winMat);
    winSouth.position.set(0, winY, cfg.depth / 2 + 0.05);
    group.add(winSouth);
  }

  // Walkway connector
  const walkway = new THREE.Mesh(
    new THREE.BoxGeometry(8.0, 3.2, 3.2),
    new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.5 })
  );
  walkway.position.set(cfg.width / 2 + 4.0, 5.0, 0);
  walkway.castShadow = true;
  group.add(walkway);

  scene.add(group);
  buildingMeshes.push(body);
}

function buildNhaC() {
  const cfg = CONFIG.BUILDINGS.nhaC;
  const group = new THREE.Group();
  group.position.set(cfg.position.x, 0, cfg.position.z);
  group.userData = { id: 'nhaC', config: cfg };

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(cfg.width, cfg.height, cfg.depth),
    new THREE.MeshStandardMaterial({ color: cfg.wallColor, roughness: 0.7 })
  );
  body.position.y = cfg.height / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(cfg.width + 0.6, 0.6, cfg.depth + 0.6),
    new THREE.MeshStandardMaterial({ color: cfg.roofColor, roughness: 0.45, metalness: 0.3 })
  );
  roof.position.y = cfg.height + 0.3;
  roof.castShadow = true;
  group.add(roof);

  const solar = new THREE.Mesh(
    new THREE.PlaneGeometry(cfg.width - 2, cfg.depth - 3),
    new THREE.MeshStandardMaterial({ color: 0x111c2e, roughness: 0.15, metalness: 0.85 })
  );
  solar.rotation.x = -Math.PI / 2;
  solar.position.set(0, cfg.height + 0.62, 0);
  group.add(solar);

  scene.add(group);
  buildingMeshes.push(body);
}

function buildNhaAn() {
  const cfg = CONFIG.BUILDINGS.nhaAn;
  const group = new THREE.Group();
  group.position.set(cfg.position.x, 0, cfg.position.z);
  group.userData = { id: 'nhaAn', config: cfg };

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(cfg.width, cfg.height, cfg.depth),
    new THREE.MeshStandardMaterial({ color: cfg.wallColor, roughness: 0.7 })
  );
  body.position.y = cfg.height / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(cfg.width * 0.7, 3.5, 4),
    new THREE.MeshStandardMaterial({ color: cfg.roofColor, roughness: 0.6 })
  );
  roof.position.y = cfg.height + 1.75;
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;
  group.add(roof);

  scene.add(group);
  buildingMeshes.push(body);
}

function buildNhaBaoVeDK1() {
  const cfg = CONFIG.BUILDINGS.nhaBaoVeDK1;
  const group = new THREE.Group();
  group.position.set(cfg.position.x, 0, cfg.position.z);
  group.userData = { id: 'nhaBaoVeDK1', config: cfg };

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(cfg.width, cfg.height, cfg.depth),
    new THREE.MeshStandardMaterial({ color: cfg.wallColor, roughness: 0.6 })
  );
  body.position.y = cfg.height / 2;
  body.castShadow = true;
  group.add(body);

  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(cfg.width + 0.4, 0.4, cfg.depth + 0.4),
    new THREE.MeshStandardMaterial({ color: cfg.roofColor, roughness: 0.4 })
  );
  roof.position.y = cfg.height + 0.2;
  group.add(roof);

  scene.add(group);
  buildingMeshes.push(body);
}

function buildCanopyAndBikes() {
  const cfg = CONFIG.BUILDINGS.maiCheXe;
  const group = new THREE.Group();
  group.position.set(cfg.position.x, 0, cfg.position.z);
  group.userData = { id: 'maiCheXe', config: cfg };

  const postGeo = new THREE.CylinderGeometry(0.12, 0.12, cfg.height);
  const postMat = new THREE.MeshStandardMaterial({ color: cfg.frameColor, roughness: 0.5 });
  for (let z = -cfg.depth / 2 + 1; z <= cfg.depth / 2; z += 5) {
    const post1 = new THREE.Mesh(postGeo, postMat);
    post1.position.set(-cfg.width / 2 + 0.4, cfg.height / 2, z);
    post1.castShadow = true;
    group.add(post1);

    const post2 = new THREE.Mesh(postGeo, postMat);
    post2.position.set(cfg.width / 2 - 0.4, cfg.height / 2, z);
    post2.castShadow = true;
    group.add(post2);
  }

  const canopyRoof = new THREE.Mesh(
    new THREE.BoxGeometry(cfg.width, 0.25, cfg.depth),
    new THREE.MeshStandardMaterial({
      color: cfg.canopyColor,
      roughness: 0.2,
      metalness: 0.1,
      transparent: true,
      opacity: cfg.opacity,
    })
  );
  canopyRoof.position.y = cfg.height;
  canopyRoof.castShadow = true;
  group.add(canopyRoof);

  // 3-wheel electric bikes
  const bikeMatRed = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.4 });
  const bikeMatCyan = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4 });
  const bikeMatBlack = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.8 });

  for (let z = -cfg.depth / 2 + 2.5; z <= cfg.depth / 2 - 2; z += 3.2) {
    const bikeGroup = new THREE.Group();
    bikeGroup.position.set(0, 0, z);

    const bMesh = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.6, 1.0), Math.random() > 0.5 ? bikeMatRed : bikeMatCyan);
    bMesh.position.y = 0.55;
    bMesh.castShadow = true;
    bikeGroup.add(bMesh);

    const wheelGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.15, 8);
    const w1 = new THREE.Mesh(wheelGeo, bikeMatBlack);
    w1.rotation.z = Math.PI / 2;
    w1.position.set(-0.6, 0.25, 0.4);
    bikeGroup.add(w1);

    const w2 = new THREE.Mesh(wheelGeo, bikeMatBlack);
    w2.rotation.z = Math.PI / 2;
    w2.position.set(-0.6, 0.25, -0.4);
    bikeGroup.add(w2);

    const w3 = new THREE.Mesh(wheelGeo, bikeMatBlack);
    w3.rotation.z = Math.PI / 2;
    w3.position.set(0.6, 0.25, 0);
    bikeGroup.add(w3);

    group.add(bikeGroup);
  }

  scene.add(group);
  buildingMeshes.push(canopyRoof);
}

// ============================================================================
// 7. DK2: Buildings & Facilities
// ============================================================================
function buildDK2Buildings() {
  buildNhaDieuHanhDK2();
  buildKhoLinhKienDK2();
  buildXuongDK2();
  buildSanThanhPhamDK2();
}

function buildNhaDieuHanhDK2() {
  const cfg = CONFIG.BUILDINGS.nhaDieuHanhDK2;
  const group = new THREE.Group();
  group.position.set(cfg.position.x, 0, cfg.position.z);
  group.userData = { id: 'nhaDieuHanhDK2', config: cfg };

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(cfg.width, cfg.height - 1.2, cfg.depth),
    new THREE.MeshStandardMaterial({ color: cfg.wallColor, roughness: 0.6, metalness: 0.2 })
  );
  body.position.y = (cfg.height + 1.2) / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const base = new THREE.Mesh(
    new THREE.BoxGeometry(cfg.width + 0.1, 1.2, cfg.depth + 0.1),
    new THREE.MeshStandardMaterial({ color: cfg.baseWallColor, roughness: 0.7 })
  );
  base.position.y = 0.6;
  base.castShadow = true;
  group.add(base);

  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(cfg.width + 0.4, 0.6, cfg.depth + 0.4),
    new THREE.MeshStandardMaterial({ color: cfg.roofColor, roughness: 0.4 })
  );
  roof.position.y = cfg.height + 0.3;
  roof.castShadow = true;
  group.add(roof);

  // Solar array
  const solarGroup = new THREE.Group();
  solarGroup.position.set(0, cfg.height + 0.62, 0);
  const panelMat = new THREE.MeshStandardMaterial({ color: 0x0b1329, roughness: 0.1, metalness: 0.9 });
  const cols = 8;
  const rows = 4;
  const panelW = (cfg.width - 2.5) / cols;
  const panelD = (cfg.depth - 2.0) / rows;

  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      const p = new THREE.Mesh(new THREE.BoxGeometry(panelW - 0.2, 0.08, panelD - 0.2), panelMat);
      p.position.set(-cfg.width / 2 + 1.5 + c * panelW, 0, -cfg.depth / 2 + 1.2 + r * panelD);
      solarGroup.add(p);
    }
  }
  group.add(solarGroup);

  // Windows
  const winMat = new THREE.MeshStandardMaterial({ color: 0xbae6fd, roughness: 0.1, metalness: 0.8 });
  windowLights.push(winMat);
  for (let s = 1; s <= 3; s++) {
    const wy = 1.2 + (s - 0.5) * 3.3;
    const wEast = new THREE.Mesh(new THREE.PlaneGeometry(cfg.depth - 2, 1.2), winMat);
    wEast.rotation.y = Math.PI / 2;
    wEast.position.set(cfg.width / 2 + 0.06, wy, 0);
    group.add(wEast);

    const wSouth = new THREE.Mesh(new THREE.PlaneGeometry(cfg.width - 3, 1.2), winMat);
    wSouth.position.set(0, wy, cfg.depth / 2 + 0.06);
    group.add(wSouth);
  }

  // Koi Pond
  const koiBed = new THREE.Mesh(
    new THREE.BoxGeometry(7.0, 0.6, 9.0),
    new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.8 })
  );
  koiBed.position.set(cfg.width / 2 + 4.5, 0.3, 0);
  group.add(koiBed);

  waterKoiMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(6.4, 8.4),
    new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.1, metalness: 0.7, transparent: true, opacity: 0.85 })
  );
  waterKoiMesh.rotation.x = -Math.PI / 2;
  waterKoiMesh.position.set(cfg.width / 2 + 4.5, 0.55, 0);
  group.add(waterKoiMesh);

  // Đàn cá Koi bơi lội trong hồ nước
  buildKoiFish(group, cfg.width / 2 + 4.5, 0.45, 0);

  // Ghế đá công viên & Chậu cây cảnh bên hồ cá Koi
  buildPondAmenities(group, cfg.width / 2 + 4.5, 0);

  scene.add(group);
  buildingMeshes.push(body);
}

// Khởi tạo đàn cá Koi bơi lội trong hồ nước Nhà điều hành
function buildKoiFish(parentGroup, pondCenterX, pondY, pondCenterZ) {
  const koiColors = [0xf97316, 0xef4444, 0xf8fafc, 0xf59e0b, 0xdc2626]; // Cam, Đỏ, Trắng, Vàng cam, Đỏ mận
  for (let i = 0; i < 5; i++) {
    const fishGroup = new THREE.Group();

    // Thân cá Koi hình thoi
    const fishBody = new THREE.Mesh(
      new THREE.ConeGeometry(0.12, 0.5, 6),
      new THREE.MeshStandardMaterial({ color: koiColors[i], roughness: 0.4 })
    );
    fishBody.rotation.x = Math.PI / 2;
    fishGroup.add(fishBody);

    // Đuôi cá quẫy sóng
    const tail = new THREE.Mesh(
      new THREE.BufferGeometry(),
      new THREE.MeshStandardMaterial({ color: koiColors[i], roughness: 0.3, side: THREE.DoubleSide })
    );
    const tailMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.2), new THREE.MeshBasicMaterial({ color: koiColors[i], side: THREE.DoubleSide }));
    tailMesh.position.set(0, 0, -0.32);
    fishGroup.add(tailMesh);

    const radiusX = 1.2 + Math.random() * 1.4;
    const radiusZ = 1.5 + Math.random() * 1.8;
    const speed = 0.6 + Math.random() * 0.5;
    const angle = i * ((Math.PI * 2) / 5);

    fishGroup.position.set(pondCenterX + Math.cos(angle) * radiusX, pondY, pondCenterZ + Math.sin(angle) * radiusZ);
    parentGroup.add(fishGroup);

    koiFishes.push({
      mesh: fishGroup,
      tail: tailMesh,
      baseX: pondCenterX,
      baseZ: pondCenterZ,
      radiusX,
      radiusZ,
      angle,
      speed,
    });
  }
}

// Tiện ích ghế đá và chậu cây bon sai quanh hồ nước
function buildPondAmenities(parentGroup, pondX, pondZ) {
  // Ghế đá công viên
  [-3.8, 3.8].forEach((gx) => {
    const bench = new THREE.Group();
    bench.position.set(pondX + gx, 0, pondZ - 2.8);
    bench.rotation.y = gx > 0 ? -Math.PI / 4 : Math.PI / 4;

    const seat = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 0.12, 0.5),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.8 })
    );
    seat.position.y = 0.45;
    bench.add(seat);

    const leg1 = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.45, 0.4), new THREE.MeshStandardMaterial({ color: 0x475569 }));
    leg1.position.set(-0.6, 0.22, 0);
    bench.add(leg1);

    const leg2 = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.45, 0.4), new THREE.MeshStandardMaterial({ color: 0x475569 }));
    leg2.position.set(0.6, 0.22, 0);
    bench.add(leg2);

    parentGroup.add(bench);
  });

  // Chậu cây cảnh Bon sai
  [pondZ + 3.5, pondZ - 3.5].forEach((pz) => {
    const pot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.35, 0.6, 8),
      new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.7 })
    );
    pot.position.set(pondX + 3.8, 0.3, pz);
    parentGroup.add(pot);

    const bush = new THREE.Mesh(
      new THREE.SphereGeometry(0.65, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.8, flatShading: true })
    );
    bush.position.set(pondX + 3.8, 0.9, pz);
    parentGroup.add(bush);
  });
}


function buildKhoLinhKienDK2() {
  const cfg = CONFIG.BUILDINGS.khoLinhKienDK2;
  const group = new THREE.Group();
  group.position.set(cfg.position.x, 0, cfg.position.z);
  group.userData = { id: 'khoLinhKienDK2', config: cfg };

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(cfg.width, cfg.height, cfg.depth),
    new THREE.MeshStandardMaterial({ color: cfg.wallColor, roughness: 0.7 })
  );
  body.position.y = cfg.height / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(cfg.width + 1.0, 0.6, cfg.depth + 1.0),
    new THREE.MeshStandardMaterial({ color: cfg.roofColor, roughness: 0.45, metalness: 0.3 })
  );
  roof.position.y = cfg.height + 0.3;
  roof.castShadow = true;
  group.add(roof);

  // Cửa cuốn tự động chính Kho Linh Kiện D2.1 (kết nối bãi bốc xếp phía Nam)
  createShutterDoor(group, 0, 0, cfg.depth / 2 + 0.08, 4.8, 3.8, 'doorD21', 'Cửa Kho Linh kiện D2.1');

  // Các cửa cuốn phân loại kho (Kho Hóa chất HC, Kho Ắc quy AQ)
  const doorMat = new THREE.MeshStandardMaterial({ color: 0xdde2e6, roughness: 0.4, metalness: 0.3 });
  for (let x = -cfg.width / 2 + 6; x <= cfg.width / 2 - 6; x += 7.0) {
    if (Math.abs(x) < 3.5) continue; // Chừa chỗ cho cửa cuốn chính ở giữa
    const door = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 3.8), doorMat);
    door.position.set(x, 1.9, cfg.depth / 2 + 0.05);
    group.add(door);

    // Khung cửa viền
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(4.4, 0.15, 0.1),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6 })
    );
    frame.position.set(x, 3.85, cfg.depth / 2 + 0.08);
    group.add(frame);
  }

  scene.add(group);
  buildingMeshes.push(body);
}

function buildXuongDK2() {
  const cfg = CONFIG.BUILDINGS.xuongDK2;
  const group = new THREE.Group();
  group.position.set(cfg.position.x, 0, cfg.position.z);
  group.userData = { id: 'xuongDK2', config: cfg };

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(cfg.width, cfg.height, cfg.depth),
    new THREE.MeshStandardMaterial({ color: cfg.wallColor, roughness: 0.65 })
  );
  body.position.y = cfg.height / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(cfg.width + 0.8, 0.8, cfg.depth + 0.8),
    new THREE.MeshStandardMaterial({ color: cfg.roofColor, roughness: 0.5 })
  );
  roof.position.y = cfg.height + 0.4;
  roof.castShadow = true;
  group.add(roof);

  scene.add(group);
  buildingMeshes.push(body);
}

function buildSanThanhPhamDK2() {
  const cfg = CONFIG.BUILDINGS.sanThanhPhamDK2;
  const yard = new THREE.Mesh(
    new THREE.PlaneGeometry(cfg.width, cfg.depth),
    new THREE.MeshStandardMaterial({ color: cfg.yardColor, roughness: 0.8 })
  );
  yard.rotation.x = -Math.PI / 2;
  yard.position.set(cfg.position.x, cfg.position.y, cfg.position.z);
  yard.receiveShadow = true;
  scene.add(yard);

  // Green court areas
  const courtMat = new THREE.MeshStandardMaterial({ color: cfg.courtColor, roughness: 0.7 });
  const court1 = new THREE.Mesh(new THREE.PlaneGeometry(24, 16), courtMat);
  court1.rotation.x = -Math.PI / 2;
  court1.position.set(cfg.position.x - 18, cfg.position.y + 0.01, cfg.position.z - 8);
  scene.add(court1);

  const court2 = new THREE.Mesh(new THREE.PlaneGeometry(30, 10), courtMat);
  court2.rotation.x = -Math.PI / 2;
  court2.position.set(cfg.position.x + 12, cfg.position.y + 0.01, cfg.position.z - 12);
  scene.add(court2);
}

// ============================================================================
// 8. DK2: Hillside, Winding Road, Eco-Pond & Orchid Garden
// ============================================================================
function buildDK2HillAndOrchidGarden() {
  const hillCfg = CONFIG.HILLS.dk2;
  const hill = new THREE.Mesh(
    new THREE.ConeGeometry(hillCfg.radius, hillCfg.height, 11),
    new THREE.MeshStandardMaterial({ color: hillCfg.color, roughness: 0.9, flatShading: true })
  );
  hill.position.set(hillCfg.position.x, hillCfg.height / 2 - 2, hillCfg.position.z);
  hill.receiveShadow = true;
  scene.add(hill);

  // Terraced stone walls
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x5a6572, roughness: 0.9, flatShading: true });
  for (let tier = 1; tier <= 3; tier++) {
    const terrace = new THREE.Mesh(
      new THREE.TorusGeometry(32 + tier * 5, 1.2, 5, 12, Math.PI / 1.5),
      stoneMat
    );
    terrace.rotation.x = Math.PI / 2;
    terrace.rotation.z = Math.PI / 3;
    terrace.position.set(-105, tier * 2.8, -65);
    terrace.castShadow = true;
    scene.add(terrace);
  }

  // Circular Pond
  const pondCfg = CONFIG.BUILDINGS.hoTronDK2;
  const pondRim = new THREE.Mesh(
    new THREE.CylinderGeometry(pondCfg.radius + 0.8, pondCfg.radius + 0.8, pondCfg.height, 24),
    new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.9 })
  );
  pondRim.position.set(pondCfg.position.x, pondCfg.position.y, pondCfg.position.z);
  pondRim.castShadow = true;
  scene.add(pondRim);

  waterRoundPondMesh = new THREE.Mesh(
    new THREE.CircleGeometry(pondCfg.radius, 24),
    new THREE.MeshStandardMaterial({ color: pondCfg.waterColor, roughness: 0.1, metalness: 0.7, transparent: true, opacity: 0.85 })
  );
  waterRoundPondMesh.rotation.x = -Math.PI / 2;
  waterRoundPondMesh.position.set(pondCfg.position.x, pondCfg.position.y + pondCfg.height / 2 + 0.05, pondCfg.position.z);
  scene.add(waterRoundPondMesh);

  // Winding Road
  buildWindingHillRoad();

  // Orchid Greenhouse
  buildVuonLanDK2();
}

function buildWindingHillRoad() {
  const curvePoints = [
    new THREE.Vector3(-100, 0.1, -45),
    new THREE.Vector3(-108, 2.5, -52),
    new THREE.Vector3(-104, 5.5, -60),
    new THREE.Vector3(-112, 8.5, -68),
    new THREE.Vector3(-120, 11.5, -74),
    new THREE.Vector3(-128, 14.8, -80),
  ];
  const curve = new THREE.CatmullRomCurve3(curvePoints);
  const hillRoad = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 32, 1.8, 4, false),
    new THREE.MeshStandardMaterial({ color: 0xd1d5db, roughness: 0.85 })
  );
  hillRoad.receiveShadow = true;
  scene.add(hillRoad);
}

function buildVuonLanDK2() {
  const cfg = CONFIG.BUILDINGS.vuonLanDK2;
  const group = new THREE.Group();
  group.position.set(cfg.position.x, cfg.position.y, cfg.position.z);
  group.userData = { id: 'vuonLanDK2', config: cfg };

  const base = new THREE.Mesh(
    new THREE.BoxGeometry(cfg.width + 4, 1.0, cfg.depth + 4),
    new THREE.MeshStandardMaterial({ color: 0x9ca3af, roughness: 0.8 })
  );
  base.position.y = -0.5;
  base.receiveShadow = true;
  group.add(base);

  const frameMat = new THREE.MeshStandardMaterial({ color: cfg.frameColor, roughness: 0.5 });
  const postGeo = new THREE.CylinderGeometry(0.15, 0.15, cfg.height);
  for (let x = -cfg.width / 2; x <= cfg.width / 2; x += cfg.width / 2) {
    for (let z = -cfg.depth / 2; z <= cfg.depth / 2; z += cfg.depth / 2) {
      const p = new THREE.Mesh(postGeo, frameMat);
      p.position.set(x, cfg.height / 2, z);
      p.castShadow = true;
      group.add(p);
    }
  }

  const panelMat = new THREE.MeshStandardMaterial({
    color: cfg.canopyColor,
    roughness: 0.15,
    metalness: 0.2,
    transparent: true,
    opacity: cfg.opacity,
  });
  const panelGeo = new THREE.BoxGeometry(cfg.width / 2 - 0.4, 0.15, cfg.depth / 2 - 0.4);
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 2; j++) {
      const p = new THREE.Mesh(panelGeo, panelMat);
      p.position.set(-cfg.width / 4 + i * (cfg.width / 2), cfg.height, -cfg.depth / 4 + j * (cfg.depth / 2));
      p.castShadow = true;
      group.add(p);
    }
  }

  // Giàn phong lan rừng Lạng Sơn khoe sắc
  const orchidColors = [0xd946ef, 0xfacc15, 0xf43f5e, 0xffffff, 0xa855f7]; // Tím sen, Vàng, Đỏ hồng, Trắng, Tím violet
  for (let ox = -cfg.width / 2 + 3; ox <= cfg.width / 2 - 3; ox += 4.5) {
    for (let oz = -cfg.depth / 2 + 3; oz <= cfg.depth / 2 - 3; oz += 4.5) {
      // Giỏ lan treo
      const basket = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.2, 0.35, 6),
        new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 })
      );
      basket.position.set(ox, 2.8, oz);
      basket.castShadow = true;
      group.add(basket);

      // Chùm hoa lan nở rộ
      const flowerCluster = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.35),
        new THREE.MeshStandardMaterial({
          color: orchidColors[Math.floor(Math.random() * orchidColors.length)],
          roughness: 0.4,
          flatShading: true,
        })
      );
      flowerCluster.position.set(ox, 3.25, oz);
      group.add(flowerCluster);

      // Dây treo giỏ
      const wire = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015, 0.015, 2.2),
        new THREE.MeshBasicMaterial({ color: 0x475569 })
      );
      wire.position.set(ox, 4.3, oz);
      group.add(wire);
    }
  }

  // Lan can đài quan sát inox ở sườn phía Đông nhìn xuống toàn cảnh thung lũng
  const railMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.2, metalness: 0.8 });
  const railH = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, cfg.depth), railMat);
  railH.position.set(cfg.width / 2 + 1.2, 1.1, 0);
  group.add(railH);

  for (let rz = -cfg.depth / 2; rz <= cfg.depth / 2; rz += 2.5) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.1), railMat);
    post.position.set(cfg.width / 2 + 1.2, 0.55, rz);
    group.add(post);
  }

  // Bàn trà gỗ & Ghế ngồi ngắm cảnh trên đỉnh đồi
  const teaTable = new THREE.Mesh(
    new THREE.CylinderGeometry(0.8, 0.8, 0.6, 12),
    new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.7 })
  );
  teaTable.position.set(0, 0.3, 0);
  teaTable.castShadow = true;
  group.add(teaTable);

  scene.add(group);
  buildingMeshes.push(base);
}

// ============================================================================
// 9. DK2: Vehicles & Logistics
// ============================================================================
function buildDK2Vehicles() {
  const yardCfg = CONFIG.BUILDINGS.sanThanhPhamDK2;

  // Dãy xe máy điện DK Bike thành phẩm đỗ ngay ngắn trên sân
  const bikeMatYellow = new THREE.MeshStandardMaterial({ color: 0xffb703, roughness: 0.3 });
  const bikeMatBlue = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3 });
  const bikeMatRed = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.3 });
  const bikeMatWhite = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });
  const bikeColors = [bikeMatYellow, bikeMatBlue, bikeMatRed, bikeMatWhite];

  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 8; col++) {
      const bike = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.6, 0.45), bikeColors[(row + col) % 4]);
      bike.position.set(yardCfg.position.x - 20 + col * 2.2, 0.35, yardCfg.position.z + 8 + row * 1.8);
      bike.castShadow = true;
      scene.add(bike);
    }
  }

  // Delivery truck loading at yard
  const truckGroup = new THREE.Group();
  truckGroup.position.set(yardCfg.position.x + 18, 0, yardCfg.position.z + 5);

  const cab = new THREE.Mesh(
    new THREE.BoxGeometry(2.8, 2.4, 2.2),
    new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.4 })
  );
  cab.position.set(2.4, 1.2, 0);
  cab.castShadow = true;
  truckGroup.add(cab);

  const cargo = new THREE.Mesh(
    new THREE.BoxGeometry(5.2, 2.8, 2.3),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 })
  );
  cargo.position.set(-1.8, 1.5, 0);
  cargo.castShadow = true;
  truckGroup.add(cargo);

  scene.add(truckGroup);
}

// ============================================================================
// 10. Landscaping, Greenery, River Rocks & Wildflowers (Vibrant Faceted Low-Poly)
// ============================================================================
function buildLandscaping() {
  const dummy = new THREE.Object3D();

  // 1. Thân cây gỗ (Trunks) cho cây tán tròn
  const roundTreeCount = 260;
  const trunkGeo = new THREE.CylinderGeometry(0.22, 0.36, 2.2, 5);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c3d2e, roughness: 0.9, flatShading: true });
  const trunkInstanced = new THREE.InstancedMesh(trunkGeo, trunkMat, roundTreeCount);
  trunkInstanced.castShadow = true;

  // 2. Tán cây tròn đa giác (Icosahedron Faceted Foliage - 4 bảng màu xanh rực rỡ & 1 vàng thu như ảnh mẫu)
  const foliageGeo = new THREE.IcosahedronGeometry(1.85, 1);
  const foliageColors = [
    0x4ade80, // Xanh lá mạ rực rỡ
    0x22c55e, // Xanh tươi sáng
    0x84cc16, // Xanh nõn chuối
    0x15803d, // Xanh lá đậm ngọc
    0xeab308, // Lá vàng thu nổi bật
  ];

  const foliageMeshes = foliageColors.map((colorHex) => {
    const mat = new THREE.MeshStandardMaterial({
      color: colorHex,
      roughness: 0.75,
      flatShading: true,
    });
    const im = new THREE.InstancedMesh(foliageGeo, mat, Math.ceil(roundTreeCount / foliageColors.length) + 15);
    im.castShadow = true;
    return { mesh: im, idx: 0 };
  });

  // Tọa độ đặt 260 cây tán tròn khắp dự án:
  let tIdx = 0;

  // A. Vành đai cây xanh mướt quanh bờ sông & Tuyến đường sắt (như ảnh 1 & 2)
  for (let z = -110; z <= 65; z += 4.5) {
    if (tIdx >= roundTreeCount) break;
    // Bờ Tây sông & Ven kè DK1
    const x1 = 80.5 + (Math.sin(z * 0.1) * 2.2);
    const y1 = 0.5;
    const s1 = 0.85 + Math.random() * 0.45;

    dummy.position.set(x1, y1 + 1.1 * s1, z);
    dummy.scale.set(s1, s1, s1);
    dummy.rotation.set(0, Math.random() * Math.PI, 0);
    dummy.updateMatrix();
    trunkInstanced.setMatrixAt(tIdx, dummy.matrix);

    dummy.position.set(x1, y1 + 3.0 * s1, z);
    dummy.updateMatrix();
    const cIdx = tIdx % foliageColors.length;
    foliageMeshes[cIdx].mesh.setMatrixAt(foliageMeshes[cIdx].idx++, dummy.matrix);
    tIdx++;

    // Bờ Đông sông & Chân đồi làng quê
    if (tIdx < roundTreeCount) {
      const x2 = 101.5 + (Math.cos(z * 0.12) * 3.5);
      const y2 = 0.8 + (x2 > 105 ? 1.5 : 0);
      const s2 = 0.9 + Math.random() * 0.5;

      dummy.position.set(x2, y2 + 1.1 * s2, z);
      dummy.scale.set(s2, s2, s2);
      dummy.rotation.set(0, Math.random() * Math.PI, 0);
      dummy.updateMatrix();
      trunkInstanced.setMatrixAt(tIdx, dummy.matrix);

      dummy.position.set(x2, y2 + 3.0 * s2, z);
      dummy.updateMatrix();
      const cIdx2 = tIdx % foliageColors.length;
      foliageMeshes[cIdx2].mesh.setMatrixAt(foliageMeshes[cIdx2].idx++, dummy.matrix);
      tIdx++;
    }
  }

  // B. Rừng cây trên sườn đồi phía Đông (quanh đàn cừu và làng quê)
  for (let i = 0; i < 75; i++) {
    if (tIdx >= roundTreeCount) break;
    const ang = Math.random() * Math.PI * 2;
    const rad = 6 + Math.random() * 38;
    const x = 126 + Math.cos(ang) * rad;
    const z = -45 + Math.sin(ang) * (rad * 1.5);
    const y = 1.0 + Math.random() * 10.0;
    const s = 0.85 + Math.random() * 0.55;

    dummy.position.set(x, y + 1.1 * s, z);
    dummy.scale.set(s, s, s);
    dummy.rotation.set(0, Math.random() * Math.PI, 0);
    dummy.updateMatrix();
    trunkInstanced.setMatrixAt(tIdx, dummy.matrix);

    dummy.position.set(x, y + 3.0 * s, z);
    dummy.updateMatrix();
    const cIdx = tIdx % foliageColors.length;
    foliageMeshes[cIdx].mesh.setMatrixAt(foliageMeshes[cIdx].idx++, dummy.matrix);
    tIdx++;
  }

  // C. Cây xanh dọc trục đường ĐT234 & Cổng nhà máy
  for (let z = -98; z <= 25; z += 6.5) {
    if (tIdx >= roundTreeCount) break;
    [-14.5, -5.5].forEach((rx) => {
      if (tIdx >= roundTreeCount) return;
      const x = rx + (Math.random() - 0.5) * 1.0;
      const y = 0.2;
      const s = 0.8 + Math.random() * 0.35;

      dummy.position.set(x, y + 1.1 * s, z);
      dummy.scale.set(s, s, s);
      dummy.rotation.set(0, Math.random() * Math.PI, 0);
      dummy.updateMatrix();
      trunkInstanced.setMatrixAt(tIdx, dummy.matrix);

      dummy.position.set(x, y + 3.0 * s, z);
      dummy.updateMatrix();
      const cIdx = tIdx % foliageColors.length;
      foliageMeshes[cIdx].mesh.setMatrixAt(foliageMeshes[cIdx].idx++, dummy.matrix);
      tIdx++;
    });
  }

  // D. Rừng cây trên đồi DK2 Vườn Lan
  for (let i = 0; i < 50; i++) {
    if (tIdx >= roundTreeCount) break;
    const ang = Math.random() * Math.PI * 2;
    const rad = 8 + Math.random() * 34;
    const x = CONFIG.HILLS.dk2.position.x + Math.cos(ang) * rad;
    const z = CONFIG.HILLS.dk2.position.z + Math.sin(ang) * rad;
    const y = 2.0 + Math.random() * 12.0;
    const s = 0.9 + Math.random() * 0.5;

    dummy.position.set(x, y + 1.1 * s, z);
    dummy.scale.set(s, s, s);
    dummy.rotation.set(0, Math.random() * Math.PI, 0);
    dummy.updateMatrix();
    trunkInstanced.setMatrixAt(tIdx, dummy.matrix);

    dummy.position.set(x, y + 3.0 * s, z);
    dummy.updateMatrix();
    const cIdx = tIdx % foliageColors.length;
    foliageMeshes[cIdx].mesh.setMatrixAt(foliageMeshes[cIdx].idx++, dummy.matrix);
    tIdx++;
  }

  trunkInstanced.instanceMatrix.needsUpdate = true;
  scene.add(trunkInstanced);

  foliageMeshes.forEach((fm) => {
    fm.mesh.instanceMatrix.needsUpdate = true;
    scene.add(fm.mesh);
  });

  // 3. Cây thông đa tầng (Tiered Pine Cones - 3 nón xếp tầng như ảnh 1 & 3)
  const pineCount = 90;
  const pineGeo = new THREE.ConeGeometry(1.6, 2.4, 5);
  const pineMat = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.8, flatShading: true });
  const pineInstanced = new THREE.InstancedMesh(pineGeo, pineMat, pineCount * 3);
  pineInstanced.castShadow = true;

  let pIdx = 0;
  for (let p = 0; p < pineCount; p++) {
    const px = (p % 2 === 0 ? 55 : 135) + (Math.random() - 0.5) * 45;
    const pz = -110 + (p / pineCount) * 160 + (Math.random() - 0.5) * 15;
    const py = 0.5 + Math.random() * 6;
    const ps = 0.75 + Math.random() * 0.45;

    // 3 tầng nón xếp chồng
    for (let tier = 0; tier < 3; tier++) {
      const tierScale = ps * (1 - tier * 0.22);
      dummy.position.set(px, py + tier * 1.5 * ps, pz);
      dummy.scale.set(tierScale, tierScale, tierScale);
      dummy.rotation.set(0, Math.random() * Math.PI, 0);
      dummy.updateMatrix();
      pineInstanced.setMatrixAt(pIdx++, dummy.matrix);
    }
  }
  pineInstanced.instanceMatrix.needsUpdate = true;
  scene.add(pineInstanced);

  // 4. Bụi cây tròn (Round Bushes) ven bờ sông và bờ rào
  const bushCount = 70;
  const bushGeo = new THREE.DodecahedronGeometry(0.85, 1);
  const bushMat = new THREE.MeshStandardMaterial({ color: 0x4ade80, roughness: 0.8, flatShading: true });
  const bushInstanced = new THREE.InstancedMesh(bushGeo, bushMat, bushCount);
  bushInstanced.castShadow = true;

  for (let b = 0; b < bushCount; b++) {
    const bx = 83.0 + (Math.random() - 0.5) * 8.0;
    const bz = -90 + (b / bushCount) * 140;
    const by = -0.5 + Math.random() * 0.4;
    dummy.position.set(bx, by, bz);
    dummy.scale.setScalar(0.7 + Math.random() * 0.5);
    dummy.rotation.set(Math.random(), Math.random(), Math.random());
    dummy.updateMatrix();
    bushInstanced.setMatrixAt(b, dummy.matrix);
  }
  bushInstanced.instanceMatrix.needsUpdate = true;
  scene.add(bushInstanced);

  // 5. Tảng đá cuội xám ven bờ sông và bãi cát (River Pebbles - như ảnh 2)
  const rockCount = 45;
  const rockGeo = new THREE.DodecahedronGeometry(0.65, 0);
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.9, flatShading: true });
  const rockInstanced = new THREE.InstancedMesh(rockGeo, rockMat, rockCount);
  rockInstanced.castShadow = true;

  for (let r = 0; r < rockCount; r++) {
    const rx = (r % 2 === 0 ? 84.0 : 94.5) + (Math.random() - 0.5) * 2.0;
    const rz = -95 + (r / rockCount) * 150;
    const ry = -1.1 + Math.random() * 0.3;
    dummy.position.set(rx, ry, rz);
    dummy.scale.set(1.0 + Math.random() * 0.6, 0.6 + Math.random() * 0.3, 1.0 + Math.random() * 0.6);
    dummy.rotation.set(Math.random(), Math.random(), Math.random());
    dummy.updateMatrix();
    rockInstanced.setMatrixAt(r, dummy.matrix);
  }
  rockInstanced.instanceMatrix.needsUpdate = true;
  scene.add(rockInstanced);

  // 6. Khóm hoa dại rực rỡ (Wildflowers - Trắng, Vàng, Hồng phấn như ảnh 3)
  const flowerCount = 90;
  const flowerGeo = new THREE.SphereGeometry(0.18, 5, 5);
  const flowerColors = [0xffffff, 0xfacc15, 0xf472b6];
  flowerColors.forEach((flColor) => {
    const flMat = new THREE.MeshBasicMaterial({ color: flColor });
    const flInstanced = new THREE.InstancedMesh(flowerGeo, flMat, flowerCount / 3);

    for (let f = 0; f < flowerCount / 3; f++) {
      const fx = (f % 2 === 0 ? 112 : 28) + (Math.random() - 0.5) * 25;
      const fz = -70 + (f / (flowerCount / 3)) * 90 + (Math.random() - 0.5) * 15;
      dummy.position.set(fx, 0.15, fz);
      dummy.scale.setScalar(0.8 + Math.random() * 0.5);
      dummy.updateMatrix();
      flInstanced.setMatrixAt(f, dummy.matrix);
    }
    flInstanced.instanceMatrix.needsUpdate = true;
    scene.add(flInstanced);
  });
}

// ============================================================================
// 11. Logistics Equipment, Pallets & Forklifts
// ============================================================================
function buildLogisticsAndEquipment() {
  // Forklift 1 tại Cửa bốc dỡ Nhà B
  createForklift(55, 0, -32, 0, 'forklift1', 'Xe nâng Komatsu #01 (Xưởng B)');

  // Forklift 2 tại Kho Linh Kiện D2.1
  createForklift(-72, 0, -60, Math.PI / 2, 'forklift2', 'Xe nâng Komatsu #02 (Kho D2.1)');

  // Cargo Pallets & Component Crates
  createPalletStack(58, 0, -31);
  createPalletStack(61, 0, -31);
  createPalletStack(-86, 0, -58);
  createPalletStack(-82, 0, -58);

  // Automatic Boom Barriers at Gate 1 & Gate 2
  createGateBarrier(77.5, 0, -20, 0, 'barrierDK1', 'Barie kiểm soát Cổng 1');
  createGateBarrier(-20, 0, -28, Math.PI / 2, 'barrierDK2', 'Barie kiểm soát Cổng 2');

  // Trạm sạc xe máy điện thông minh (DK EV Fast Charging Hubs)
  buildChargingStations();

  // Bãi đỗ xe ô tô công vụ Ban giám đốc & Kỹ thuật
  buildExecutiveParkingCars();

  // Tiện ích công nghiệp (PCCC, Trạm biến áp 560kVA, Thùng rác phân loại)
  buildIndustrialUtilities();
}

function createForklift(x, y, z, rotY, id, name) {
  const flGroup = new THREE.Group();
  flGroup.position.set(x, y, z);
  flGroup.rotation.y = rotY;

  // Body
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(2.0, 1.2, 1.3),
    new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.35 }) // DK Logistics Orange
  );
  body.position.set(0, 0.7, 0);
  body.castShadow = true;
  flGroup.add(body);

  // Đối trọng phía sau màu xám chì
  const counterWeight = new THREE.Mesh(
    new THREE.BoxGeometry(0.6, 1.0, 1.26),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 })
  );
  counterWeight.position.set(-0.85, 0.7, 0);
  flGroup.add(counterWeight);

  // Cabin Cage
  const cage = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 1.4, 1.1),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 })
  );
  cage.position.set(-0.2, 1.8, 0);
  cage.castShadow = true;
  flGroup.add(cage);

  // Tài xế ngồi lái xe nâng
  const driver = createCharacter({ shirtColor: 0xea580c, pantsColor: 0x1e293b, hatColor: 0xfacc15, isDriver: true });
  driver.position.set(-0.2, 0.75, 0);
  flGroup.add(driver);

  // Mast trụ trượt cố định
  const mast = new THREE.Mesh(
    new THREE.BoxGeometry(0.15, 2.5, 1.0),
    new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4 })
  );
  mast.position.set(1.1, 1.35, 0);
  mast.castShadow = true;
  flGroup.add(mast);

  // Cụm càng nâng di động (Lifting assembly)
  const liftGroup = new THREE.Group();
  liftGroup.position.set(1.15, 0.25, 0);

  const forkCarriage = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.5, 0.9),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3 })
  );
  forkCarriage.position.y = 0.25;
  liftGroup.add(forkCarriage);

  const fork1 = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 0.08, 0.16),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2 })
  );
  fork1.position.set(0.6, 0.05, 0.25);
  liftGroup.add(fork1);

  const fork2 = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 0.08, 0.16),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2 })
  );
  fork2.position.set(0.6, 0.05, -0.25);
  liftGroup.add(fork2);

  // Pallet hàng đặt trên càng nâng
  const palletOnFork = new THREE.Mesh(
    new THREE.BoxGeometry(1.1, 0.12, 0.9),
    new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.8 })
  );
  palletOnFork.position.set(0.6, 0.15, 0);
  palletOnFork.castShadow = true;
  liftGroup.add(palletOnFork);

  // Thùng phụ tùng động cơ trên pallet
  const cargoBox = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.6, 0.8),
    new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.6 })
  );
  cargoBox.position.set(0.6, 0.51, 0);
  cargoBox.castShadow = true;
  liftGroup.add(cargoBox);

  flGroup.add(liftGroup);

  // Bánh xe
  const wMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 });
  const wGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.24, 8);
  [-0.6, 0.6].forEach((wx) => {
    [-0.65, 0.65].forEach((wz) => {
      const w = new THREE.Mesh(wGeo, wMat);
      w.rotation.x = Math.PI / 2;
      w.position.set(wx, 0.32, wz);
      flGroup.add(w);
    });
  });

  // Metadata tương tác
  const flData = {
    id: id,
    title: name,
    type: 'forklift',
    desc: 'Xe nâng điện công nghiệp 2.5 tấn phục vụ chuyển pallet linh kiện, động cơ và IC vào cửa xưởng sản xuất.',
    zone: id.includes('2') ? 'DK2' : 'DK1',
  };
  flGroup.userData = flData;
  body.userData = flData;

  scene.add(flGroup);
  interactiveObjects.push(body);
  animatedForklifts.push({ liftGroup, initialY: 0.25 });
}

function createPalletStack(x, y, z) {
  const pGroup = new THREE.Group();
  pGroup.position.set(x, y, z);

  const woodMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.85 });
  const boxMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.7 });

  // Wooden pallet
  const pallet = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.15, 1.4), woodMat);
  pallet.position.y = 0.08;
  pallet.castShadow = true;
  pGroup.add(pallet);

  // Cardboard component boxes
  for (let bx = -0.35; bx <= 0.35; bx += 0.7) {
    for (let bz = -0.35; bz <= 0.35; bz += 0.7) {
      const box = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.6, 0.65), boxMat);
      box.position.set(bx, 0.45, bz);
      box.castShadow = true;
      pGroup.add(box);
    }
  }

  pGroup.userData = {
    id: 'pallet_' + Math.round(x) + '_' + Math.round(z),
    title: 'Pallet linh kiện & phụ tùng xe điện',
    type: 'pallet',
    desc: 'Kiện hàng carton tiêu chuẩn xuất xưởng chứa động cơ điện BLDC và pin Lithium-ion.',
    zone: x > 0 ? 'DK1' : 'DK2',
  };
  pallet.userData = pGroup.userData;
  interactiveObjects.push(pallet);

  scene.add(pGroup);
}

function createGateBarrier(x, y, z, rotY, id, name) {
  const gGroup = new THREE.Group();
  gGroup.position.set(x, y, z);
  gGroup.rotation.y = rotY;

  // Post
  const post = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 1.1, 0.5),
    new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.4 })
  );
  post.position.y = 0.55;
  gGroup.add(post);

  // Pivot xoay cần gạt barie
  const armPivot = new THREE.Group();
  armPivot.position.set(0, 0.95, 0);

  // Boom arm (sọc đỏ trắng)
  const arm = new THREE.Mesh(
    new THREE.BoxGeometry(4.2, 0.12, 0.12),
    new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3 })
  );
  arm.position.set(2.1, 0, 0);
  armPivot.add(arm);
  gGroup.add(armPivot);

  // Metadata tương tác
  const bData = {
    id: id,
    title: name,
    type: 'barrier',
    desc: 'Hệ thống kiểm soát phương tiện tự động với cần chắn barie nâng hạ thông minh.',
    zone: id.includes('DK2') ? 'DK2' : 'DK1',
  };
  gGroup.userData = bData;
  post.userData = bData;

  scene.add(gGroup);
  interactiveObjects.push(post);
  animatedBarriers.push({ armPivot, currentAngle: 0, targetAngle: 0, x, z });
}

// Trạm sạc xe máy điện thông minh (DK EV Charging Hubs)
function buildChargingStations() {
  CONFIG.OBJECTS.chargingStations.forEach((cs) => {
    const hubGroup = new THREE.Group();
    hubGroup.position.set(cs.pos.x, 0, cs.pos.z);

    // Bệ bê tông trạm sạc
    const pad = new THREE.Mesh(
      new THREE.BoxGeometry(4.5, 0.12, 3.2),
      new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.8 })
    );
    pad.position.y = 0.06;
    pad.receiveShadow = true;
    hubGroup.add(pad);

    // Cột sạc trụ đứng đôi (Trắng & Viền xanh ngọc DK EV)
    const chargerTower = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 1.8, 0.45),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.25, metalness: 0.3 })
    );
    chargerTower.position.set(0, 0.96, 0);
    chargerTower.castShadow = true;
    hubGroup.add(chargerTower);

    // Dải viền LED màu cyan phát sáng
    const ledGlow = new THREE.Mesh(
      new THREE.BoxGeometry(0.72, 0.1, 0.47),
      new THREE.MeshBasicMaterial({ color: 0x06b6d4 })
    );
    ledGlow.position.set(0, 1.45, 0);
    hubGroup.add(ledGlow);

    // Màn hình LCD xanh lá
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(0.4, 0.3),
      new THREE.MeshBasicMaterial({ color: 0x10b981 })
    );
    screen.position.set(0, 1.15, 0.23);
    hubGroup.add(screen);

    // Đèn PointLight phát sáng xung quanh trạm sạc
    const chargeLight = new THREE.PointLight(0x06b6d4, 0.8, 8);
    chargeLight.position.set(0, 1.2, 0);
    hubGroup.add(chargeLight);

    // 2 Xe máy điện DK Roma SX đỗ 2 bên đang cắm dây sạc
    const bike1 = createDetailedDKBike(0xdc2626, 'DK Roma SX (Đỏ)');
    bike1.position.set(-1.4, 0, 0);
    bike1.rotation.y = Math.PI / 2;
    hubGroup.add(bike1);

    const bike2 = createDetailedDKBike(0x0284c7, 'DK Roma SX (Xanh)');
    bike2.position.set(1.4, 0, 0);
    bike2.rotation.y = Math.PI / 2;
    hubGroup.add(bike2);

    // Cáp sạc nối từ trụ vào xe
    const cableMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.9 });
    const c1 = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.2), cableMat);
    c1.rotation.z = Math.PI / 3;
    c1.position.set(-0.7, 0.65, 0);
    hubGroup.add(c1);

    const c2 = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.2), cableMat);
    c2.rotation.z = -Math.PI / 3;
    c2.position.set(0.7, 0.65, 0);
    hubGroup.add(c2);

    const csData = {
      id: cs.id,
      title: cs.name,
      type: 'chargingStation',
      desc: 'Trạm sạc nhanh điện xoay chiều AC 3.3kW cho toàn bộ các dòng xe điện DK Bike. Hiệu suất nạp 80% chỉ trong 45 phút.',
      zone: cs.id.includes('DK1') ? 'DK1' : 'DK2',
    };
    hubGroup.userData = csData;
    chargerTower.userData = csData;

    scene.add(hubGroup);
    interactiveObjects.push(chargerTower);
    chargingStationsList.push({ ledGlow, chargeLight });
  });
}

// Tạo hình xe máy điện DK Roma SX chi tiết
function createDetailedDKBike(colorHex, name) {
  const bikeGroup = new THREE.Group();

  // Thân xe bo tròn phong cách scooter Vespa
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(1.4, 0.65, 0.45),
    new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.35 })
  );
  body.position.set(0, 0.45, 0);
  body.castShadow = true;
  bikeGroup.add(body);

  // Yếm trước bo cong
  const shield = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 0.6, 0.42),
    new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.35 })
  );
  shield.position.set(0.65, 0.6, 0);
  bikeGroup.add(shield);

  // Yên xe bọc da nâu
  const seat = new THREE.Mesh(
    new THREE.BoxGeometry(0.75, 0.12, 0.35),
    new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 })
  );
  seat.position.set(-0.15, 0.82, 0);
  bikeGroup.add(seat);

  // Đèn pha tròn mạ crom
  const headlight = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.1, 0.1, 8),
    new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.8, roughness: 0.2 })
  );
  headlight.rotation.z = Math.PI / 2;
  headlight.position.set(0.76, 0.88, 0);
  bikeGroup.add(headlight);

  // Bánh xe và mâm
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 });
  const wheelGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.12, 8);
  const wFront = new THREE.Mesh(wheelGeo, wheelMat);
  wFront.rotation.x = Math.PI / 2;
  wFront.position.set(0.55, 0.25, 0);
  bikeGroup.add(wFront);

  const wRear = new THREE.Mesh(wheelGeo, wheelMat);
  wRear.rotation.x = Math.PI / 2;
  wRear.position.set(-0.55, 0.25, 0);
  bikeGroup.add(wRear);

  bikeGroup.userData = {
    id: 'bike_' + name,
    title: name,
    type: 'electricBike',
    desc: 'Dòng xe máy điện bán chạy hàng đầu DK Bike với động cơ chống nước IP67 và ắc quy dung lượng cao.',
  };

  return bikeGroup;
}

// Bãi đỗ xe ô tô công vụ & Ban giám đốc
function buildExecutiveParkingCars() {
  CONFIG.OBJECTS.executiveCars.forEach((c) => {
    const carGroup = new THREE.Group();
    carGroup.position.set(c.pos.x, 0, c.pos.z);
    carGroup.rotation.y = c.rotY;

    // Chassis xe
    const chassis = new THREE.Mesh(
      new THREE.BoxGeometry(4.2, 0.7, 1.9),
      new THREE.MeshStandardMaterial({ color: c.color, roughness: 0.3, metalness: 0.5 })
    );
    chassis.position.y = 0.55;
    chassis.castShadow = true;
    carGroup.add(chassis);

    // Cabin kính xe
    const cabin = new THREE.Mesh(
      new THREE.BoxGeometry(2.3, 0.7, 1.7),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.15, metalness: 0.8 })
    );
    cabin.position.set(-0.2, 1.25, 0);
    cabin.castShadow = true;
    carGroup.add(cabin);

    // Đèn pha trước
    const headL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.15, 0.3), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    headL.position.set(2.11, 0.65, 0.65);
    carGroup.add(headL);

    const headR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.15, 0.3), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    headR.position.set(2.11, 0.65, -0.65);
    carGroup.add(headR);

    // Đèn hậu sau
    const tailL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.15, 0.3), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
    tailL.position.set(-2.11, 0.65, 0.65);
    carGroup.add(tailL);

    const tailR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.15, 0.3), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
    tailR.position.set(-2.11, 0.65, -0.65);
    carGroup.add(tailR);

    // 4 Bánh xe ô tô
    const wGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.25, 8);
    const wMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 });
    [1.3, -1.3].forEach((wx) => {
      [0.95, -0.95].forEach((wz) => {
        const w = new THREE.Mesh(wGeo, wMat);
        w.rotation.x = Math.PI / 2;
        w.position.set(wx, 0.36, wz);
        carGroup.add(w);
      });
    });

    carGroup.userData = {
      id: c.id,
      title: c.model,
      type: 'executiveCar',
      desc: 'Phương tiện công vụ phục vụ di chuyển điều hành của Ban lãnh đạo và đội ngũ kỹ thuật nhà máy.',
      zone: c.pos.x > 0 ? 'DK1' : 'DK2',
    };
    chassis.userData = carGroup.userData;

    scene.add(carGroup);
    interactiveObjects.push(chassis);
  });
}

// Tiện ích công nghiệp (PCCC, Trạm biến áp 560kVA, Thùng rác phân loại)
function buildIndustrialUtilities() {
  // 1. Trụ cứu hỏa PCCC màu đỏ
  CONFIG.OBJECTS.utilities.hydrants.forEach((h, idx) => {
    const hydGroup = new THREE.Group();
    hydGroup.position.set(h.x, 0, h.z);

    const hydMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.3, metalness: 0.3 });
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.8, 8), hydMat);
    col.position.y = 0.4;
    col.castShadow = true;
    hydGroup.add(col);

    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), hydMat);
    cap.position.y = 0.8;
    hydGroup.add(cap);

    const hydData = {
      id: 'hydrant_' + idx,
      title: 'Trụ cứu hỏa PCCC áp lực cao',
      type: 'hydrant',
      desc: 'Điểm cấp nước chữa cháy công nghiệp kết nối hệ thống téc nước dự trữ 150m³ của nhà máy.',
      zone: h.x > 0 ? 'DK1' : 'DK2',
    };
    hydGroup.userData = hydData;
    col.userData = hydData;

    scene.add(hydGroup);
    interactiveObjects.push(col);
  });

  // 2. Trạm biến áp 3 pha hạ thế 560kVA
  const subCfg = CONFIG.OBJECTS.utilities.substation;
  const subGroup = new THREE.Group();
  subGroup.position.set(subCfg.x, subCfg.y, subCfg.z);

  const subPad = new THREE.Mesh(
    new THREE.BoxGeometry(4.0, 0.3, 3.2),
    new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.9 })
  );
  subPad.position.y = 0.15;
  subGroup.add(subPad);

  const subBody = new THREE.Mesh(
    new THREE.BoxGeometry(2.4, 1.8, 1.8),
    new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.5, metalness: 0.4 })
  );
  subBody.position.y = 1.2;
  subBody.castShadow = true;
  subGroup.add(subBody);

  // Sứ cách điện
  for (let i = -1; i <= 1; i++) {
    const insulator = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.14, 0.5, 6),
      new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.4 })
    );
    insulator.position.set(i * 0.6, 2.35, 0);
    subGroup.add(insulator);
  }

  // Hàng rào cảnh báo an toàn điện vàng đen
  const fenceMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.4 });
  const fence = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.2, 2.8), new THREE.MeshBasicMaterial({ wireframe: true, color: 0xfacc15 }));
  fence.position.y = 0.75;
  subGroup.add(fence);

  const subData = {
    id: 'substation',
    title: subCfg.name,
    type: 'substation',
    desc: 'Trạm hạ thế 22kV / 0.4kV công suất 560kVA, cấp điện liên tục cho dây chuyền lắp ráp và xưởng sản xuất.',
    zone: 'DK1',
  };
  subGroup.userData = subData;
  subBody.userData = subData;

  scene.add(subGroup);
  interactiveObjects.push(subBody);

  // 3. Thùng rác phân loại 3 màu (Xanh lá - Vàng - Đỏ)
  CONFIG.OBJECTS.utilities.recycleBins.forEach((b, bIdx) => {
    const binGroup = new THREE.Group();
    binGroup.position.set(b.x, 0, b.z);

    const binColors = [0x16a34a, 0xf59e0b, 0xdc2626]; // Hữu cơ, Tái chế, Nguy hại
    const binLabels = ['Hữu cơ', 'Tái chế', 'Nguy hại'];

    binColors.forEach((color, i) => {
      const bin = new THREE.Mesh(
        new THREE.BoxGeometry(0.35, 0.7, 0.35),
        new THREE.MeshStandardMaterial({ color: color, roughness: 0.6 })
      );
      bin.position.set((i - 1) * 0.45, 0.35, 0);
      bin.castShadow = true;
      binGroup.add(bin);
    });

    binGroup.userData = {
      id: 'recycle_' + bIdx,
      title: 'Cụm thùng rác phân loại 3 ngăn',
      type: 'bins',
      desc: 'Hệ thống quản lý rác thải công nghiệp đạt chuẩn ISO 14001: Rác sinh hoạt, Nhựa tái chế và Linh kiện điện tử.',
      zone: b.x > 0 ? 'DK1' : 'DK2',
    };

    scene.add(binGroup);
  });
}


// ============================================================================
// 12. Flagpoles & Streetlights
// ============================================================================
function buildFlagsAndStreetlights() {
  // Flagpole 1: Trước sảnh Nhà A (DK1)
  createFlagpole(25, 0, -23, 0xef4444);

  // Flagpole 2: Trước Nhà điều hành DK2
  createFlagpole(-34, 0, -20, 0xffb703);

  // Streetlights along DT234 & Campuses
  const lightPositions = [
    { x: -10, z: -90 },
    { x: -10, z: -55 },
    { x: -10, z: -20 },
    { x: -10, z: 15 },
    { x: 35, z: -23 },
    { x: 65, z: -22 },
    { x: 80, z: -25 },
    { x: 80, z: -68 },
    { x: -70, z: -26 },
    { x: -95, z: -43 },
  ];

  lightPositions.forEach((pos) => {
    createStreetlight(pos.x, 0, pos.z);
  });
}

function createFlagpole(x, y, z, flagColor) {
  const group = new THREE.Group();
  group.position.set(x, y, z);

  // Steel pole
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.12, 8.0, 8),
    new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.2, metalness: 0.8 })
  );
  pole.position.y = 4.0;
  pole.castShadow = true;
  group.add(pole);

  // Flag
  const flagGeo = new THREE.PlaneGeometry(2.4, 1.5, 8, 4);
  const flagMat = new THREE.MeshStandardMaterial({
    color: flagColor,
    roughness: 0.5,
    side: THREE.DoubleSide,
  });
  const flag = new THREE.Mesh(flagGeo, flagMat);
  flag.position.set(1.2, 7.2, 0);
  group.add(flag);
  flagMeshes.push(flag);

  scene.add(group);
}

function createStreetlight(x, y, z) {
  const slGroup = new THREE.Group();
  slGroup.position.set(x, y, z);

  // Pole
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.4, metalness: 0.7 });
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 6.0, 6), poleMat);
  pole.position.y = 3.0;
  slGroup.add(pole);

  // Arm & Lamp Head
  const arm = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.1, 0.2), poleMat);
  arm.position.set(0.6, 5.9, 0);
  slGroup.add(arm);

  const lampGeo = new THREE.BoxGeometry(0.6, 0.15, 0.35);
  const lampMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0x000000,
    roughness: 0.2,
  });
  const lamp = new THREE.Mesh(lampGeo, lampMat);
  lamp.position.set(1.1, 5.8, 0);
  slGroup.add(lamp);
  streetLightLamps.push(lampMat);

  // Spot light for ground illumination at night
  const light = new THREE.PointLight(0xfef08a, 0, 18);
  light.position.set(1.1, 5.5, 0);
  slGroup.add(light);
  streetLightSpotLights.push(light);

  scene.add(slGroup);
}

// ============================================================================
// 13. Stylized Characters & People Activities
// ============================================================================
function buildPeopleAndCharacters() {
  // 1. Worker 1: Tuần tra dọc tuyến đường nội bộ trước Nhà A
  const w1 = createCharacter({ shirtColor: 0x0284c7, pantsColor: 0x1e293b, hatColor: 0xfacc15 });
  w1.position.set(20, 0, -26.5);
  w1.userData = {
    id: 'workerPatrol',
    title: 'Công nhân tuần tra: Hoàng Văn Tuấn',
    type: 'character',
    desc: 'Tuần tra an toàn lao động và vệ sinh 5S dọc tuyến đường nội bộ phân khu DK1.',
    zone: 'DK1',
  };
  scene.add(w1);
  interactiveObjects.push(w1);
  walkingWorkers.push({
    mesh: w1,
    minX: 15,
    maxX: 50,
    speed: 2.2,
    dir: 1,
    axis: 'x',
    z: -26.5,
    stepAngle: 0,
  });

  // 2. Kỹ thuật viên R&D (Nguyễn Đức Thành): Đi lại trên cầu vượt tầng 2 nối Nhà A - Nhà B
  const w2 = createCharacter({ shirtColor: 0xffffff, pantsColor: 0x334155, hatColor: 0x0284c7 });
  w2.position.set(51, 5.0, -35);
  w2.userData = {
    id: 'rndStaff',
    title: CONFIG.CHARACTERS.rndStaff.name,
    type: 'character',
    desc: CONFIG.CHARACTERS.rndStaff.activity,
    zone: CONFIG.CHARACTERS.rndStaff.zone,
  };
  scene.add(w2);
  interactiveObjects.push(w2);
  walkingWorkers.push({
    mesh: w2,
    minX: 49,
    maxX: 57,
    speed: 1.6,
    dir: 1,
    axis: 'x',
    z: -35,
    stepAngle: 0,
  });

  // 3. Kỹ sư KCS (Lê Tuấn Anh): Đứng tại sân thử xe DK1 cầm tablet kiểm tra
  const kcs = createCharacter({ shirtColor: 0xea580c, pantsColor: 0x1e293b, hatColor: 0xffffff, holdingTablet: true });
  kcs.position.set(60, 0, -28);
  kcs.rotation.y = Math.PI / 4;
  kcs.userData = {
    id: 'kcsInspector',
    title: CONFIG.CHARACTERS.kcs.name,
    type: 'character',
    desc: CONFIG.CHARACTERS.kcs.activity,
    zone: CONFIG.CHARACTERS.kcs.zone,
  };
  scene.add(kcs);
  interactiveObjects.push(kcs);

  // Xe máy điện DK Roma SX đặt trên bệ kiểm định cạnh KCS
  const testBike = createDetailedDKBike(0xffb703, 'DK Roma SX Đang Kiểm Định');
  testBike.position.set(61.8, 0, -27.2);
  testBike.rotation.y = -Math.PI / 4;
  scene.add(testBike);

  // 4. Bảo vệ Cổng DK1 (Hoàng Văn Minh)
  const guard1 = createCharacter({ shirtColor: 0x1e293b, pantsColor: 0x0f172a, hatColor: 0x1e293b });
  guard1.position.set(74.5, 0, -21.5);
  guard1.rotation.y = -Math.PI / 2;
  guard1.userData = {
    id: 'guardDK1',
    title: CONFIG.CHARACTERS.guardDK1.name,
    type: 'character',
    desc: CONFIG.CHARACTERS.guardDK1.activity,
    zone: CONFIG.CHARACTERS.guardDK1.zone,
  };
  scene.add(guard1);
  interactiveObjects.push(guard1);

  // 5. Bảo vệ Cổng DK2 (Triệu Quốc Bảo)
  const guard2 = createCharacter({ shirtColor: 0x1e293b, pantsColor: 0x0f172a, hatColor: 0x1e293b });
  guard2.position.set(-18.5, 0, -26.5);
  guard2.rotation.y = Math.PI / 2;
  guard2.userData = {
    id: 'guardDK2',
    title: CONFIG.CHARACTERS.guardDK2.name,
    type: 'character',
    desc: CONFIG.CHARACTERS.guardDK2.activity,
    zone: CONFIG.CHARACTERS.guardDK2.zone,
  };
  scene.add(guard2);
  interactiveObjects.push(guard2);

  // 6. Quản lý Logistics DK2 (Đỗ Thanh Nga) & Tài xế xe tải
  const logMgr = createCharacter({ shirtColor: 0x0284c7, pantsColor: 0x334155, hatColor: 0xfacc15, holdingTablet: true });
  logMgr.position.set(-62, 0, -38);
  logMgr.rotation.y = -Math.PI / 3;
  logMgr.userData = {
    id: 'logisticsLead',
    title: CONFIG.CHARACTERS.logisticsLead.name,
    type: 'character',
    desc: CONFIG.CHARACTERS.logisticsLead.activity,
    zone: CONFIG.CHARACTERS.logisticsLead.zone,
  };
  scene.add(logMgr);
  interactiveObjects.push(logMgr);

  const truckDriver = createCharacter({ shirtColor: 0x475569, pantsColor: 0x1e293b, hatColor: 0xef4444 });
  truckDriver.position.set(-60.8, 0, -38.6);
  truckDriver.rotation.y = Math.PI * 0.7;
  truckDriver.userData = {
    id: 'truckDriver',
    title: 'Tài xế xe tải vận chuyển: Vũ Đức Mạnh',
    type: 'character',
    desc: 'Ký nhận phiếu xuất kho vận chuyển 60 xe điện DK Bike đi đại lý cấp 1 miền Bắc.',
    zone: 'DK2',
  };
  scene.add(truckDriver);
  interactiveObjects.push(truckDriver);

  // 7. Nghệ nhân cây cảnh Vườn Lan (Bác Bùi Văn Thắng)
  const caretaker = createCharacter({ shirtColor: 0x16a34a, pantsColor: 0x475569, hatColor: 0xfef08a });
  caretaker.position.set(-126, 16.0, -80);
  caretaker.rotation.y = Math.PI * 0.8;
  caretaker.userData = {
    id: 'orchidGardener',
    title: CONFIG.CHARACTERS.orchidGardener.name,
    type: 'character',
    desc: CONFIG.CHARACTERS.orchidGardener.activity,
    zone: CONFIG.CHARACTERS.orchidGardener.zone,
  };
  scene.add(caretaker);
  interactiveObjects.push(caretaker);

  // 8. Hai Cán bộ văn phòng thư giãn bên hồ cá Koi trước Nhà điều hành
  const staff1 = createCharacter({ shirtColor: 0xffffff, pantsColor: 0x1e293b, hatColor: 0xffffff });
  staff1.position.set(-20.5, 0, -29);
  staff1.rotation.y = -Math.PI / 4;
  staff1.userData = {
    id: 'officeStaff1',
    title: 'Chuyên viên Kinh doanh: Phạm Thị Mai',
    type: 'character',
    desc: 'Nghỉ giải lao ngắm đàn cá Koi và trao đổi kế hoạch phân phối dòng xe DK Creer E.',
    zone: 'DK2',
  };
  scene.add(staff1);
  interactiveObjects.push(staff1);

  const staff2 = createCharacter({ shirtColor: 0x3b82f6, pantsColor: 0x1e293b, hatColor: 0x3b82f6 });
  staff2.position.set(-19.5, 0, -30.2);
  staff2.rotation.y = Math.PI * 0.75;
  staff2.userData = {
    id: 'officeStaff2',
    title: 'Chuyên viên Marketing: Trần Quốc Anh',
    type: 'character',
    desc: 'Chụp ảnh tư liệu khuôn viên xanh phục vụ chiến dịch truyền thông DK Bike Hành Trình Xanh.',
    zone: 'DK2',
  };
  scene.add(staff2);
  interactiveObjects.push(staff2);
}

function createCharacter({ shirtColor, pantsColor, hatColor, holdingTablet = false, isDriver = false }) {
  const charGroup = new THREE.Group();

  const skinMat = new THREE.MeshStandardMaterial({ color: 0xfcd34d, roughness: 0.6 });
  const shirtMat = new THREE.MeshStandardMaterial({ color: shirtColor, roughness: 0.7 });
  const pantsMat = new THREE.MeshStandardMaterial({ color: pantsColor, roughness: 0.8 });
  const hatMat = new THREE.MeshStandardMaterial({ color: hatColor, roughness: 0.4 });

  // Head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), skinMat);
  head.position.y = 1.5;
  head.castShadow = true;
  charGroup.add(head);

  // Safety Helmet / Cap
  const helmet = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.24, 0.14, 8), hatMat);
  helmet.position.y = 1.62;
  charGroup.add(helmet);

  // Torso
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.55, 0.25), shirtMat);
  torso.position.y = 1.1;
  torso.castShadow = true;
  charGroup.add(torso);

  // Legs
  const legGeo = new THREE.BoxGeometry(0.16, 0.65, 0.18);
  const leftLeg = new THREE.Mesh(legGeo, pantsMat);
  leftLeg.position.set(-0.11, 0.45, 0);
  leftLeg.castShadow = true;
  charGroup.add(leftLeg);
  charGroup.userData.leftLeg = leftLeg;

  const rightLeg = new THREE.Mesh(legGeo, pantsMat);
  rightLeg.position.set(0.11, 0.45, 0);
  rightLeg.castShadow = true;
  charGroup.add(rightLeg);
  charGroup.userData.rightLeg = rightLeg;

  // Arms
  const armGeo = new THREE.BoxGeometry(0.12, 0.5, 0.12);
  const leftArm = new THREE.Mesh(armGeo, shirtMat);
  leftArm.position.set(-0.28, 1.05, 0);
  charGroup.add(leftArm);
  charGroup.userData.leftArm = leftArm;

  const rightArm = new THREE.Mesh(armGeo, shirtMat);
  rightArm.position.set(0.28, 1.05, 0);
  charGroup.add(rightArm);
  charGroup.userData.rightArm = rightArm;

  // Tablet in hand
  if (holdingTablet) {
    const tab = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.04, 0.32),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2 })
    );
    tab.position.set(0, 1.05, 0.25);
    charGroup.add(tab);
    rightArm.rotation.x = -Math.PI / 4;
    leftArm.rotation.x = -Math.PI / 4;
  }

  if (isDriver) {
    leftLeg.position.set(-0.11, 0.4, 0.15);
    rightLeg.position.set(0.11, 0.4, 0.15);
    leftArm.rotation.x = -Math.PI / 3;
    rightArm.rotation.x = -Math.PI / 3;
  }

  return charGroup;
}

// ============================================================================
// 14. Animated Vehicles & Rail Transit
// ============================================================================
function setupAnimatedVehicles() {
  // 1. Xe máy điện DK Bike chạy tuần tra test track kèm người lái
  animatedBike = new THREE.Group();

  const bodyMat = new THREE.MeshStandardMaterial({ color: 0xffb703, roughness: 0.3 }); // DK Bike yellow
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.7, 0.5), bodyMat);
  body.position.y = 0.5;
  body.castShadow = true;
  animatedBike.add(body);

  // Bike Headlight
  const light = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  light.position.set(0.72, 0.55, 0);
  animatedBike.add(light);

  // Wheels
  const wMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 });
  const wGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.15, 8);
  const frontW = new THREE.Mesh(wGeo, wMat);
  frontW.rotation.z = Math.PI / 2;
  frontW.position.set(0.5, 0.28, 0);
  animatedBike.add(frontW);

  const rearW = new THREE.Mesh(wGeo, wMat);
  rearW.rotation.z = Math.PI / 2;
  rearW.position.set(-0.5, 0.28, 0);
  animatedBike.add(rearW);

  // Rider sitting on bike
  bikeRiderGroup = createCharacter({ shirtColor: 0x0284c7, pantsColor: 0x1e293b, hatColor: 0xfacc15, isDriver: true });
  bikeRiderGroup.position.set(-0.1, 0.45, 0);
  bikeRiderGroup.rotation.y = Math.PI / 2;
  animatedBike.add(bikeRiderGroup);

  scene.add(animatedBike);

  // 2. Xe tải di chuyển trên đường ĐT234
  animatedTruck = new THREE.Group();
  const truckCab = new THREE.Mesh(
    new THREE.BoxGeometry(2.4, 2.0, 1.8),
    new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.4 })
  );
  truckCab.position.set(0, 1.1, 0);
  truckCab.castShadow = true;
  animatedTruck.add(truckCab);

  const truckCargo = new THREE.Mesh(
    new THREE.BoxGeometry(4.0, 2.4, 2.0),
    new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6 })
  );
  truckCargo.position.set(0, 1.4, -3.2);
  truckCargo.castShadow = true;
  animatedTruck.add(truckCargo);

  animatedTruck.position.set(CONFIG.ROAD_DT234.positionX - 1.5, 0.1, -110);
  scene.add(animatedTruck);
}

// Đoàn tàu hơi nước cổ điển đỏ rực rỡ, các toa xe màu sắc & Dải khói mây trắng khổng lồ (như ảnh 1)
function setupTrain() {
  animatedTrain = new THREE.Group();
  trainCars = [];
  trainSmokeTrail = [];

  // 1. Đầu máy hơi nước cổ điển màu đỏ (Red Steam Locomotive)
  const locoGroup = new THREE.Group();

  // Nồi hơi nằm ngang hình trụ tròn đỏ tươi
  const boilerGeo = new THREE.CylinderGeometry(1.05, 1.05, 5.4, 12);
  const redBoilerMat = new THREE.MeshStandardMaterial({
    color: 0xdc2626, // Đỏ tươi rực rỡ như ảnh 1
    roughness: 0.35,
    metalness: 0.3,
  });
  const boiler = new THREE.Mesh(boilerGeo, redBoilerMat);
  boiler.rotation.x = Math.PI / 2;
  boiler.position.set(0, 1.7, 0.6);
  boiler.castShadow = true;
  locoGroup.add(boiler);

  // Mũi chóp cầu nồi hơi phía trước màu than đen
  const frontCap = new THREE.Mesh(
    new THREE.SphereGeometry(1.05, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 })
  );
  frontCap.rotation.x = -Math.PI / 2;
  frontCap.position.set(0, 1.7, 3.3);
  locoGroup.add(frontCap);

  // Các vòng đai kim loại mạ vàng bo quanh nồi hơi
  const ringMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.2, metalness: 0.8 });
  [-1.2, 0.4, 1.8].forEach((rz) => {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.08, 0.05, 8, 16), ringMat);
    ring.position.set(0, 1.7, rz);
    locoGroup.add(ring);
  });

  // Cabin người lái phía sau (Cabin Box)
  const cabGeo = new THREE.BoxGeometry(2.35, 2.5, 2.6);
  const cab = new THREE.Mesh(cabGeo, redBoilerMat);
  cab.position.set(0, 1.85, -2.5);
  cab.castShadow = true;
  locoGroup.add(cab);

  // Mui cabin vòm cong màu đen than
  const cabRoof = new THREE.Mesh(
    new THREE.BoxGeometry(2.55, 0.25, 2.9),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.6 })
  );
  cabRoof.position.set(0, 3.15, -2.5);
  locoGroup.add(cabRoof);

  // Cửa sổ kính cabin xanh biếc hai bên
  const winMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.1, metalness: 0.8 });
  [-1.2, 1.2].forEach((wx) => {
    const win = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.8), winMat);
    win.rotation.y = wx > 0 ? Math.PI / 2 : -Math.PI / 2;
    win.position.set(wx, 2.1, -2.5);
    locoGroup.add(win);
  });

  // Ống khói đen loe miệng ở đầu nồi hơi (như ảnh 1)
  const stackGeo = new THREE.CylinderGeometry(0.38, 0.3, 1.4, 8);
  const stackMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 });
  const stack = new THREE.Mesh(stackGeo, stackMat);
  stack.position.set(0, 3.0, 2.5);
  stack.castShadow = true;
  locoGroup.add(stack);

  // Vành loe mạ vàng ở miệng ống khói
  const stackRim = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.06, 8, 16), ringMat);
  stackRim.rotation.x = Math.PI / 2;
  stackRim.position.set(0, 3.7, 2.5);
  locoGroup.add(stackRim);

  // Đèn pha tàu hỏa tròn phía trước phát sáng
  const headlight = new THREE.Mesh(
    new THREE.SphereGeometry(0.28, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xfef08a })
  );
  headlight.position.set(0, 1.8, 3.8);
  locoGroup.add(headlight);

  // 6 Bánh xe lớn màu đỏ chói viền vàng (như ảnh 1)
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.4 });
  const wheelGeo = new THREE.CylinderGeometry(0.68, 0.68, 0.24, 12);
  [-1.25, 1.25].forEach((wx) => {
    [-1.6, 0.2, 2.0].forEach((wz) => {
      const w = new THREE.Mesh(wheelGeo, wheelMat);
      w.rotation.z = Math.PI / 2;
      w.position.set(wx, 0.68, wz);
      w.castShadow = true;
      locoGroup.add(w);

      // Trục tâm vàng
      const hubPin = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.28, 8), ringMat);
      hubPin.rotation.z = Math.PI / 2;
      hubPin.position.set(wx, 0.68, wz);
      locoGroup.add(hubPin);
    });

    // Thanh truyền cơ khí nối các bánh xe (Connecting Rod)
    const rod = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.16, 3.7),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.3, metalness: 0.8 })
    );
    rod.position.set(wx > 0 ? 1.4 : -1.4, 0.68, 0.2);
    locoGroup.add(rod);
  });

  // Tài xế lái tàu thò đầu ra ngoài cửa sổ
  const trainDriver = createCharacter({ shirtColor: 0x0284c7, pantsColor: 0x1e293b, hatColor: 0xef4444, isDriver: true });
  trainDriver.position.set(1.1, 1.35, -2.5);
  trainDriver.rotation.y = Math.PI / 2;
  locoGroup.add(trainDriver);

  locoGroup.userData = {
    id: 'steamLoco',
    title: 'Đoàn tàu hơi nước cổ điển DK Heritage',
    type: 'train',
    desc: 'Đầu máy xe lửa hơi nước màu đỏ rực rỡ kéo đoàn toa chở hàng và hành khách trên tuyến đường sắt sinh thái bao quanh khuôn viên.',
    zone: 'Đường sắt Bắc - Nam',
  };
  boiler.userData = locoGroup.userData;
  scene.add(locoGroup);
  interactiveObjects.push(boiler);
  trainCars.push({ group: locoGroup, offsetT: 0 });

  // 2. Toa hàng số 1: Toa trần thùng gỗ xanh lá chở kiện hàng (như ảnh 1)
  const wagon1 = new THREE.Group();
  const flatbedMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
  const w1Base = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.35, 5.6), flatbedMat);
  w1Base.position.y = 0.55;
  wagon1.add(w1Base);

  // Thùng gỗ màu xanh lá tươi
  const woodGreenMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.65 });
  const w1Box = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.2, 5.4), woodGreenMat);
  w1Box.position.y = 1.3;
  w1Box.castShadow = true;
  wagon1.add(w1Box);

  // Các thùng kiện hàng gỗ & carton bên trong
  const crateMat1 = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.7 });
  const crateMat2 = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.8 });
  for (let c = 0; c < 5; c++) {
    const crate = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.9), c % 2 === 0 ? crateMat1 : crateMat2);
    crate.position.set((c % 2 === 0 ? -0.4 : 0.4), 1.9, -1.8 + c * 0.9);
    crate.castShadow = true;
    wagon1.add(crate);
  }

  // Bánh xe toa hàng
  [-1.2, 1.2].forEach((wx) => {
    [-1.8, 1.8].forEach((wz) => {
      const w = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.22, 10), wheelMat);
      w.rotation.z = Math.PI / 2;
      w.position.set(wx, 0.48, wz);
      wagon1.add(w);
    });
  });

  scene.add(wagon1);
  trainCars.push({ group: wagon1, offsetT: 0.056 });

  // 3. Toa khách số 2: Toa hành khách màu tím-xanh viền vàng (như ảnh 1)
  const wagon2 = new THREE.Group();
  const coachPurpleMat = new THREE.MeshStandardMaterial({ color: 0x312e81, roughness: 0.4 }); // Xanh tím sang trọng
  const coach2Body = new THREE.Mesh(new THREE.BoxGeometry(2.3, 2.2, 7.2), coachPurpleMat);
  coach2Body.position.y = 1.65;
  coach2Body.castShadow = true;
  wagon2.add(coach2Body);

  const coachRoofMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 });
  const coach2Roof = new THREE.Mesh(new THREE.BoxGeometry(2.45, 0.35, 7.5), coachRoofMat);
  coach2Roof.position.y = 2.85;
  wagon2.add(coach2Roof);

  // Dãy cửa sổ kính dài hai bên
  [-1.17, 1.17].forEach((cx) => {
    for (let winZ = -2.6; winZ <= 2.6; winZ += 1.3) {
      const wGlass = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 0.75), winMat);
      wGlass.rotation.y = cx > 0 ? Math.PI / 2 : -Math.PI / 2;
      wGlass.position.set(cx, 1.95, winZ);
      wagon2.add(wGlass);
    }
  });

  [-1.2, 1.2].forEach((wx) => {
    [-2.4, 2.4].forEach((wz) => {
      const w = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.22, 10), wheelMat);
      w.rotation.z = Math.PI / 2;
      w.position.set(wx, 0.48, wz);
      wagon2.add(w);
    });
  });

  scene.add(wagon2);
  trainCars.push({ group: wagon2, offsetT: 0.122 });

  // 4. Toa khách số 3: Toa hành khách màu vàng đất / mù tạt (như ảnh 1)
  const wagon3 = new THREE.Group();
  const coachYellowMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.45 }); // Vàng mù tạt
  const coach3Body = new THREE.Mesh(new THREE.BoxGeometry(2.3, 2.2, 7.2), coachYellowMat);
  coach3Body.position.y = 1.65;
  coach3Body.castShadow = true;
  wagon3.add(coach3Body);

  const coach3Roof = new THREE.Mesh(new THREE.BoxGeometry(2.45, 0.35, 7.5), coachRoofMat);
  coach3Roof.position.y = 2.85;
  wagon3.add(coach3Roof);

  [-1.17, 1.17].forEach((cx) => {
    for (let winZ = -2.6; winZ <= 2.6; winZ += 1.3) {
      const wGlass = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 0.75), winMat);
      wGlass.rotation.y = cx > 0 ? Math.PI / 2 : -Math.PI / 2;
      wGlass.position.set(cx, 1.95, winZ);
      wagon3.add(wGlass);
    }
  });

  [-1.2, 1.2].forEach((wx) => {
    [-2.4, 2.4].forEach((wz) => {
      const w = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.22, 10), wheelMat);
      w.rotation.z = Math.PI / 2;
      w.position.set(wx, 0.48, wz);
      wagon3.add(w);
    });
  });

  scene.add(wagon3);
  trainCars.push({ group: wagon3, offsetT: 0.188 });

  // --------------------------------------------------------------------------
  // 5. DẢI KHÓI MÂY TRẮNG BỒNG BỀNH KHỔNG LỒ (Giant Puffy Cloud Smoke Trail - như ảnh 1)
  // --------------------------------------------------------------------------
  const puffCount = 18;
  const smokeCloudMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.4,
    flatShading: true,
  });

  for (let i = 0; i < puffCount; i++) {
    const puffGroup = new THREE.Group();
    // Kích thước khối mây trắng nở to dần từ 0.9m lên tới 4.0m
    const baseR = 0.9 + (i / puffCount) * 3.1;

    // Cụm 3 quả cầu tròn bông gòn ghép lại
    const p1 = new THREE.Mesh(new THREE.DodecahedronGeometry(baseR, 1), smokeCloudMat);
    puffGroup.add(p1);

    const p2 = new THREE.Mesh(new THREE.DodecahedronGeometry(baseR * 0.8, 1), smokeCloudMat);
    p2.position.set(baseR * 0.4, baseR * 0.25, 0);
    puffGroup.add(p2);

    const p3 = new THREE.Mesh(new THREE.DodecahedronGeometry(baseR * 0.75, 1), smokeCloudMat);
    p3.position.set(-baseR * 0.35, -baseR * 0.2, baseR * 0.25);
    puffGroup.add(p3);

    puffGroup.position.set(90, 10, -50);
    puffGroup.castShadow = true;
    scene.add(puffGroup);

    trainSmokeTrail.push({
      group: puffGroup,
      baseScale: 1.0,
      index: i,
    });
  }
}

// Đàn chim bay lượn trên đồi
function setupFlockOfBirds() {
  birdFlockGroup = new THREE.Group();
  birdFlockGroup.position.set(CONFIG.HILLS.dk2.position.x, 32, CONFIG.HILLS.dk2.position.z);

  const birdGeo = new THREE.ConeGeometry(0.35, 1.1, 3);
  const birdMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5, flatShading: true });

  for (let i = 0; i < 6; i++) {
    const bGroup = new THREE.Group();
    const body = new THREE.Mesh(birdGeo, birdMat);
    body.rotation.x = Math.PI / 2;
    bGroup.add(body);

    // Wings
    const wingGeo = new THREE.BoxGeometry(1.2, 0.05, 0.35);
    const wing = new THREE.Mesh(wingGeo, birdMat);
    wing.position.set(0, 0.05, 0);
    bGroup.add(wing);
    bGroup.userData.wing = wing;

    bGroup.position.set((i - 2.5) * 4.5, (Math.random() - 0.5) * 3, (Math.random() - 0.5) * 4);
    birdFlockGroup.add(bGroup);
    birdMeshes.push(bGroup);
  }

  scene.add(birdFlockGroup);
}

function updateAnimatedObjects(delta, time) {
  // 1. Xe máy điện DK Bike ôm cua test track
  if (animatedBike) {
    bikeTrackAngle += delta * 0.38;
    const t = bikeTrackAngle;
    const centerX = 65;
    const centerZ = -50;
    const radiusX = 14;
    const radiusZ = 20;

    const x = centerX + Math.sin(t) * radiusX;
    const z = centerZ + Math.cos(t) * radiusZ;
    animatedBike.position.set(x, 0.05, z);

    const nextX = centerX + Math.sin(t + 0.05) * radiusX;
    const nextZ = centerZ + Math.cos(t + 0.05) * radiusZ;
    animatedBike.rotation.y = Math.atan2(nextX - x, nextZ - z);
    animatedBike.rotation.z = -Math.sin(t) * 0.14;
  }

  // 2. Xe tải di chuyển trên ĐT234
  if (animatedTruck) {
    truckProgress += delta * 14;
    if (truckProgress > 150) truckProgress = 0;
    animatedTruck.position.z = -120 + truckProgress;
  }

  // 3. Đoàn tàu hơi nước uốn lượn cong trên đường ray & Dải khói mây trắng khổng lồ (như ảnh 1)
  if (railwayCurve && trainCars.length > 0) {
    trainProgress = (trainProgress + delta * 0.034) % 1.0;
    if (trainProgress < 0) trainProgress += 1.0;

    const getCurveT = (val) => {
      if (typeof val !== 'number' || isNaN(val)) return 0.001;
      let t = val % 1.0;
      if (t < 0) t += 1.0;
      return Math.min(Math.max(t, 0.0001), 0.9999);
    };

    // Cập nhật vị trí và góc quay chuẩn tiếp tuyến cho từng toa xe
    trainCars.forEach((car) => {
      const tCar = getCurveT(trainProgress - car.offsetT);
      const pos = railwayCurve.getPointAt(tCar);
      const tangent = railwayCurve.getTangentAt(tCar);

      car.group.position.copy(pos);
      car.group.rotation.y = Math.atan2(tangent.x, tangent.z);
    });

    // Cập nhật Dải khói mây trắng khổng lồ (Giant Puffy Cloud Trail) uốn khúc theo đoàn tàu (như ảnh 1)
    const tLoco = getCurveT(trainProgress);
    trainSmokeTrail.forEach((smokeItem, sIdx) => {
      const tSmoke = getCurveT(tLoco - 0.012 - sIdx * 0.014);
      const smokePos = railwayCurve.getPointAt(tSmoke);

      // Khói bốc cao dần lên và bồng bềnh nhịp nhàng
      smokePos.y += 3.2 + sIdx * 0.22 + Math.sin(time * 0.003 + sIdx * 0.5) * 0.25;
      // Gió nhẹ thổi dạt sang Đông
      smokePos.x += sIdx * 0.35;

      smokeItem.group.position.copy(smokePos);

      // Hiệu ứng phập phồng (Breathing pulse)
      const pulse = 1.0 + Math.sin(time * 0.004 + sIdx * 0.7) * 0.08;
      smokeItem.group.scale.setScalar(smokeItem.baseScale * pulse);
    });

    // Barie chắn tàu tại Ga DK Station: tự động hạ cần xuống khi tàu đến gần ga
    const isNearStation = tLoco > 0.38 && tLoco < 0.62;
    railwayGateArms.forEach((b) => {
      b.targetAngle = isNearStation ? 0 : Math.PI / 2.2;
      b.currentAngle += (b.targetAngle - b.currentAngle) * delta * 3.5;
      b.pivot.rotation.x = b.currentAngle;
    });
  }

  // 4. Cánh quạt cối xay gió trên đỉnh đồi quay đều (như ảnh 1)
  if (windmillBlades) {
    windmillBlades.rotation.z += delta * 1.2;
  }

  // 5. Mây trời low-poly trôi nhẹ nhàng trên không
  skyClouds.forEach((cloud) => {
    cloud.position.x += delta * cloud.userData.speed;
    if (cloud.position.x > 220) {
      cloud.position.x = -220;
    }
  });

  // 6. Thuyền gỗ nhấp nhô nhẹ trên dòng sông máng nước xanh ngọc (như ảnh 2)
  if (rowingBoat) {
    rowingBoat.position.y = -1.3 + Math.sin(time * 0.0025) * 0.04;
    rowingBoat.rotation.z = Math.sin(time * 0.002) * 0.03;
  }

  // 7. Đàn cá bơi lội dưới sông
  if (riverFishGroup) {
    riverFishGroup.rotation.y += delta * 0.7;
  }

  // 8. Đàn cừu trên đồi cỏ lắc đầu thong thả (như ảnh 2)
  fluffySheeps.forEach((sheep, shIdx) => {
    sheep.rotation.y += Math.sin(time * 0.002 + shIdx) * 0.004;
  });

  // 9. Khói trắng zíc zắc từ ống khói các ngôi nhà (như ảnh 3)
  chimneySmokePuffs.forEach((puff, idx) => {
    puff.position.y += delta * 0.85;
    puff.scale.addScalar(delta * 0.1);
    if (puff.position.y > 7.8) {
      puff.position.y = 5.2;
      puff.scale.setScalar(0.7);
    }
  });

  // 10. Công nhân đi bộ tuần tra & cử động chân tay
  walkingWorkers.forEach((w) => {
    w.mesh.position[w.axis] += w.dir * w.speed * delta;
    if (w.mesh.position[w.axis] >= w.maxX) {
      w.dir = -1;
      w.mesh.rotation.y = Math.PI;
    } else if (w.mesh.position[w.axis] <= w.minX) {
      w.dir = 1;
      w.mesh.rotation.y = 0;
    }

    w.stepAngle += delta * 6;
    const swing = Math.sin(w.stepAngle) * 0.45;
    if (w.mesh.userData.leftLeg) w.mesh.userData.leftLeg.rotation.x = swing;
    if (w.mesh.userData.rightLeg) w.mesh.userData.rightLeg.rotation.x = -swing;
    if (w.mesh.userData.leftArm) w.mesh.userData.leftArm.rotation.x = -swing;
    if (w.mesh.userData.rightArm) w.mesh.userData.rightArm.rotation.x = swing;
  });

  // 11. Cờ bay trong gió
  flagMeshes.forEach((flag, idx) => {
    flag.rotation.y = Math.sin(time * 0.003 + idx) * 0.15;
  });

  // 12. Quạt thông gió trên nóc xưởng B
  roofVentilators.forEach((vent) => {
    vent.rotation.y += delta * 2.5;
  });

  // 13. Đàn chim chao lượn quanh đỉnh đồi Vườn Lan
  if (birdFlockGroup) {
    birdFlockGroup.rotation.y += delta * 0.25;
    birdMeshes.forEach((b) => {
      if (b.userData.wing) {
        b.userData.wing.rotation.z = Math.sin(time * 0.008) * 0.35;
      }
    });
  }

  // 14. Hoạt cảnh cuộn Cửa cuốn xưởng B & Kho D2.1 (Animated Roller Shutter Doors)
  shutterDoors.forEach((d) => {
    if (Math.abs(d.targetProgress - d.currentProgress) > 0.005) {
      d.currentProgress += Math.sign(d.targetProgress - d.currentProgress) * delta * 1.5;
      d.currentProgress = Math.max(0, Math.min(1, d.currentProgress));

      // Co rút nan cửa cuốn lên đỉnh
      d.curtain.scale.y = 1 - d.currentProgress * 0.88;
      d.curtain.position.y = (d.initialHeight / 2) + (d.currentProgress * (d.initialHeight / 2) * 0.88);

      // Tăng sáng đèn bên trong xưởng khi cửa mở
      if (d.interiorLight) {
        d.interiorLight.intensity = (currentEnv === 'night' ? 1.0 : 0.4) * (0.3 + d.currentProgress * 0.8);
      }
    }
  });

  // 15. Xe nâng hàng: Hoạt cảnh càng nâng nâng hạ pallet hàng (Animated Forklifts)
  animatedForklifts.forEach((fl, idx) => {
    if (fl.liftGroup) {
      const lift = Math.sin(time * 0.0022 + idx * 1.5) * 0.55 + 0.6;
      fl.liftGroup.position.y = fl.initialY + lift;
    }
  });

  // 16. Barie cổng tự động: Cần chắn mở lên khi xe tải chạy qua (Animated Barriers)
  const truckZ = animatedTruck ? animatedTruck.position.z : -100;
  const isNearGate1 = Math.abs(truckZ - (-20)) < 16;
  const isNearGate2 = Math.abs(truckZ - (-28)) < 16;

  animatedBarriers.forEach((b) => {
    const shouldOpen = (b.id === 'barrierDK1' && isNearGate1) || (b.id === 'barrierDK2' && isNearGate2);
    b.targetAngle = shouldOpen ? Math.PI / 2.3 : 0;
    b.currentAngle += (b.targetAngle - b.currentAngle) * delta * 4;
    b.armPivot.rotation.z = b.currentAngle;
  });

  // 17. Trạm sạc xe điện: Đèn LED breathing pulse xung nhịp nạp pin
  chargingStationsList.forEach((cs) => {
    const pulse = 0.5 + Math.sin(time * 0.005) * 0.4;
    if (cs.ledGlow && cs.ledGlow.material) {
      cs.ledGlow.material.opacity = pulse;
    }
    if (cs.chargeLight) {
      cs.chargeLight.intensity = 0.4 + pulse * 0.7;
    }
  });

  // 18. Đàn cá Koi bơi lội và quẫy đuôi trong hồ nước Nhà điều hành
  koiFishes.forEach((fish) => {
    fish.angle += delta * fish.speed;
    fish.mesh.position.x = fish.baseX + Math.cos(fish.angle) * fish.radiusX;
    fish.mesh.position.z = fish.baseZ + Math.sin(fish.angle) * fish.radiusZ;
    fish.mesh.rotation.y = -fish.angle + Math.PI / 2;
    if (fish.tail) {
      fish.tail.rotation.y = Math.sin(time * 0.015) * 0.45;
    }
  });
}


// ============================================================================
// 15. Weather Effects (Rain)
// ============================================================================
function setupRainEffect() {
  const rainCount = 2400;
  const rainGeo = new THREE.BufferGeometry();
  const positions = new Float32Array(rainCount * 3);

  for (let i = 0; i < rainCount * 3; i += 3) {
    positions[i] = (Math.random() - 0.5) * 260 - 20;
    positions[i + 1] = Math.random() * 90;
    positions[i + 2] = (Math.random() - 0.5) * 200 - 40;
  }

  rainGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  rainParticles = new THREE.Points(
    rainGeo,
    new THREE.PointsMaterial({ color: 0xa5b4fc, size: 0.35, transparent: true, opacity: 0.65 })
  );
  rainParticles.visible = false;
  scene.add(rainParticles);
}

function updateRain(delta) {
  if (!isRaining || !rainParticles) return;
  const pos = rainParticles.geometry.attributes.position.array;
  for (let i = 1; i < pos.length; i += 3) {
    pos[i] -= delta * 75;
    if (pos[i] < 0) {
      pos[i] = 85;
    }
  }
  rainParticles.geometry.attributes.position.needsUpdate = true;
}

// ============================================================================
// 16. Environment Toggle (Day / Sunset / Night)
// ============================================================================
function setEnvironment(time) {
  currentEnv = time;
  const cfg = CONFIG.LIGHTING[time];

  scene.background.set(cfg.skyColor);
  if (time === 'day') scene.fog.color.set(CONFIG.WORLD.fogColorDay);
  if (time === 'sunset') scene.fog.color.set(CONFIG.WORLD.fogColorSunset);
  if (time === 'night') scene.fog.color.set(CONFIG.WORLD.fogColorNight);

  ambientLight.color.set(cfg.ambientColor);
  ambientLight.intensity = cfg.ambientIntensity;
  hemiLight.color.set(cfg.skyColor);
  hemiLight.groundColor.set(cfg.groundColor);

  dirLight.color.set(cfg.sunColor);
  dirLight.intensity = cfg.sunIntensity;
  dirLight.position.set(cfg.sunPosition.x, cfg.sunPosition.y, cfg.sunPosition.z);

  const isNight = time === 'night';

  // Toggle window interior lights
  windowLights.forEach((mat) => {
    if (isNight) {
      mat.emissive.set(0xfbbf24);
      mat.emissiveIntensity = 0.8;
    } else {
      mat.emissive.set(0x000000);
      mat.emissiveIntensity = 0;
    }
  });

  // Toggle streetlights
  streetLightLamps.forEach((mat) => {
    if (isNight) {
      mat.emissive.set(0xfef08a);
      mat.emissiveIntensity = 1.0;
    } else {
      mat.emissive.set(0x000000);
      mat.emissiveIntensity = 0;
    }
  });
  streetLightSpotLights.forEach((light) => {
    light.intensity = isNight ? 1.4 : 0;
  });

  logoLight.intensity = isNight ? 1.5 : 0;

  document.querySelectorAll('.toggle-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.time === time);
  });
}

// ============================================================================
// 17. 3D HTML Labels & Interaction (DK1 & DK2)
// ============================================================================
function createBuildingLabels() {
  const container = document.body;
  const labelsData = [
    // DK1
    { text: 'Nhà B (Xưởng 3 tầng)', pos: new THREE.Vector3(65, 14.5, -50), id: 'nhaB' },
    { text: 'Nhà A (Văn phòng)', pos: new THREE.Vector3(35, 12.0, -35), id: 'nhaA' },
    { text: 'Nhà C (Mái tôn xanh)', pos: new THREE.Vector3(45, 7.5, -58.5), id: 'nhaC' },
    { text: 'Nhà ăn CBNV', pos: new THREE.Vector3(23, 11.5, -12), id: 'nhaAn' },
    { text: 'Mái che xe 3 bánh', pos: new THREE.Vector3(79.5, 5.0, -46), id: 'maiCheXe' },
    { text: '⚡ Trạm sạc nhanh EV', pos: new THREE.Vector3(26, 3.2, -24), id: 'chargerDK1' },
    { text: '🚪 Cửa xưởng & Bốc dỡ', pos: new THREE.Vector3(58, 5.2, -32), id: 'doorB1' },

    // Tuyến đường sắt, Cầu vòm đỏ & Cảnh quan sinh thái mới (Theo ảnh mẫu)
    { text: '🚂 Tàu hơi nước & Đường sắt', pos: new THREE.Vector3(92, 5.5, -20), id: 'steamLoco' },
    { text: '🌉 Cầu vòm đỏ (Red Arch)', pos: new THREE.Vector3(95, 5.5, -49), id: 'redArchBridge' },
    { text: '🚉 Ga xe lửa DK Station', pos: new THREE.Vector3(88, 5.0, -2), id: 'dkStation' },
    { text: '⛵ Thuyền chèo đò trên sông', pos: new THREE.Vector3(89.5, 1.8, -8), id: 'rowingBoat' },
    { text: '🐑 Đàn cừu trên đồi cỏ', pos: new THREE.Vector3(120, 6.0, -62), id: 'sheepFlock' },
    { text: '🌾 Cối xay gió sinh thái', pos: new THREE.Vector3(55, 34.0, -108), id: 'windmill' },

    // DK2
    { text: 'Nhà điều hành DK2 (HQ)', pos: new THREE.Vector3(-28, 13.0, -28), id: 'nhaDieuHanhDK2' },
    { text: 'Kho Linh kiện D2.1', pos: new THREE.Vector3(-78, 8.0, -68), id: 'khoLinhKienDK2' },
    { text: 'Sân xe thành phẩm DK2', pos: new THREE.Vector3(-78, 2.0, -45), id: 'sanThanhPhamDK2' },
    { text: 'Vườn Lan trên đồi', pos: new THREE.Vector3(-130, 22.0, -82), id: 'vuonLanDK2' },
    { text: 'Hồ sinh thái tròn', pos: new THREE.Vector3(-108, 3.0, -65), id: 'hoTronDK2' },
  ];

  labelsData.forEach((item) => {
    const el = document.createElement('div');
    el.className = 'building-label-3d';
    el.innerText = item.text;
    container.appendChild(el);
    labelElements.push({ el, worldPos: item.pos });
  });
}

function updateLabels() {
  if (!showLabels) {
    labelElements.forEach((l) => (l.el.style.display = 'none'));
    return;
  }

  const tempV = new THREE.Vector3();
  labelElements.forEach((l) => {
    tempV.copy(l.worldPos);
    tempV.project(camera);

    if (tempV.z > 1) {
      l.el.style.display = 'none';
      return;
    }

    const x = (tempV.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-(tempV.y * 0.5) + 0.5) * window.innerHeight;

    l.el.style.display = 'block';
    l.el.style.left = `${x}px`;
    l.el.style.top = `${y}px`;
  });
}

// ============================================================================
// 18. Camera Presets Smooth Transitions
// ============================================================================
let cameraTween = null;

function setCameraPreset(key) {
  const preset = CONFIG.PRESETS[key];
  if (!preset) return;

  const startPos = camera.position.clone();
  const startTarget = controls.target.clone();
  const endPos = new THREE.Vector3(preset.pos.x, preset.pos.y, preset.pos.z);
  const endTarget = new THREE.Vector3(preset.target.x, preset.target.y, preset.target.z);

  const duration = 1200;
  const startTime = performance.now();

  cameraTween = (time) => {
    const elapsed = time - startTime;
    const progress = Math.min(elapsed / duration, 1.0);
    const ease = progress < 0.5
      ? 4 * progress * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 3) / 2;

    camera.position.lerpVectors(startPos, endPos, ease);
    controls.target.lerpVectors(startTarget, endTarget, ease);
    controls.update();

    if (progress >= 1.0) {
      cameraTween = null;
    }
  };

  document.querySelectorAll('.preset-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.view === key);
  });
}

// ============================================================================
// 19. Building Detail Modal (DK1 & DK2 Support)
// ============================================================================
function showBuildingModal(buildingKey) {
  const card = document.getElementById('building-card');
  const tag = document.getElementById('card-tag');
  const title = document.getElementById('card-title');
  const desc = document.getElementById('card-desc');
  const zone = document.getElementById('card-zone');
  const dim = document.getElementById('card-dim');
  const height = document.getElementById('card-height');
  const area = document.getElementById('card-area');
  const roof = document.getElementById('card-roof');

  const b = CONFIG.BUILDINGS[buildingKey];
  if (!b) return;

  card.classList.remove('hidden');
  tag.innerText = (b.zone || 'DK').toUpperCase();
  title.innerText = b.name;
  if (zone) zone.innerText = b.zone === 'DK1' ? 'Phân khu DK1 (4.500 m²)' : 'Phân khu DK2 (5.898 m²)';

  if (buildingKey === 'nhaB') {
    desc.innerText = 'Xưởng sản xuất 3 tầng kiên cố, trung tâm lắp ráp xe máy điện và kiểm tra chất lượng sản phẩm xuất xưởng.';
    dim.innerText = '33.5m × 22.5m';
    height.innerText = '13.5m (3 tầng)';
    area.innerText = '~2.260 m²';
    roof.innerText = 'Mái panel xám than + Sống mái thông gió';
  } else if (buildingKey === 'nhaA') {
    desc.innerText = 'Tòa nhà văn phòng điều hành và phòng kỹ thuật R&D, có cầu thang thoát hiểm ngoài trời và cầu vượt nối xưởng B.';
    dim.innerText = '32.5m × 12.2m';
    height.innerText = '11.0m (3 tầng)';
    area.innerText = '~1.188 m²';
    roof.innerText = 'Mái tôn xám bạc phẳng';
  } else if (buildingKey === 'nhaC') {
    desc.innerText = 'Nhà kho phụ tùng và xưởng phụ trợ, mặt bằng vát góc ôm sát ranh đất phía Bắc, mái gắn pin mặt trời.';
    dim.innerText = '14.1m × 11.8m';
    height.innerText = '6.5m (1-2 tầng)';
    area.innerText = '~140 m²';
    roof.innerText = 'Mái tôn xanh dương + Pin mặt trời';
  } else if (buildingKey === 'nhaAn') {
    desc.innerText = 'Nhà ăn 3 tầng phục vụ cán bộ công nhân viên DK1, nằm độc lập tại góc Tây Nam.';
    dim.innerText = '20.4m × 11.6m';
    height.innerText = '10.5m (3 tầng)';
    area.innerText = '~253 m²';
    roof.innerText = 'Mái ngói dốc truyền thống';
  } else if (buildingKey === 'maiCheXe') {
    desc.innerText = 'Bãi đỗ có mái che sóng màu xanh lơ trong suốt, chuyên dụng cho tập kết xe điện 3 bánh DK Bike.';
    dim.innerText = '28.0m × 6.0m';
    height.innerText = '4.2m';
    area.innerText = '~168 m²';
    roof.innerText = 'Mái sóng Polycarbonate cyan';
  } else if (buildingKey === 'nhaDieuHanhDK2') {
    desc.innerText = 'Trụ sở chính điều hành phân khu DK2 mặt tiền ĐT234, toàn bộ mái phủ kín hệ thống pin năng lượng mặt trời công suất cao, kề cận hồ cá Koi.';
    dim.innerText = '22.0m × 12.0m';
    height.innerText = '11.5m (3 tầng)';
    area.innerText = '253 m² sàn';
    roof.innerText = 'Mái phủ kín dàn pin mặt trời Solar';
  } else if (buildingKey === 'khoLinhKienDK2') {
    desc.innerText = 'Dãy kho linh kiện D2.1 dài 78m chạy dọc phía Bắc sân, mái tôn xanh dương đặc trưng và các cửa cuốn phân loại kho (Kho HC, Kho AQ).';
    dim.innerText = '78.0m × 11.0m';
    height.innerText = '6.5m (1 tầng)';
    area.innerText = '1.080 m²';
    roof.innerText = 'Mái tôn màu xanh dương tươi';
  } else if (buildingKey === 'xuongDK2') {
    desc.innerText = 'Xưởng sản xuất và kho liên kết phía Nam phân khu DK2, phục vụ đóng gói và logistics.';
    dim.innerText = '85.0m × 16.0m';
    height.innerText = '8.0m (2 tầng)';
    area.innerText = '2.170 m²';
    roof.innerText = 'Mái panel tôn cách nhiệt';
  } else if (buildingKey === 'sanThanhPhamDK2') {
    desc.innerText = 'Sân bê tông phẳng rộng lớn phục vụ tập kết xe điện sau sản xuất, có 2 ô sân thể thao/tập kết kẻ sơn xanh lá và bãi xe tải xuất xưởng.';
    dim.innerText = '75.0m × 40.0m';
    height.innerText = 'Cốt mặt sân 0.00';
    area.innerText = '~3.000 m²';
    roof.innerText = 'Mặt sân bê tông & vạch sơn xanh';
  } else if (buildingKey === 'vuonLanDK2') {
    desc.innerText = 'Vườn lan và nhà lưới sinh thái trên đỉnh đồi cao +16m, khung thép với mái che dạng lưới/kính 4 ô vuông xanh lơ nhìn bao quát cả hai khu DK1 & DK2.';
    dim.innerText = '22.0m × 22.0m';
    height.innerText = '5.5m (độ cao đồi +16m)';
    area.innerText = '~480 m²';
    roof.innerText = 'Mái lưới/kính xanh lơ 4 ô vuông';
  } else if (buildingKey === 'hoTronDK2') {
    desc.innerText = 'Hồ cảnh quan tròn lát đá nhân tạo tại chân dốc đường lên vườn lan, tạo vi khí hậu mát mẻ cho toàn khu DK2.';
    dim.innerText = 'Đường kính 12.0m';
    height.innerText = 'Sâu 1.8m';
    area.innerText = '~113 m² mặt nước';
    roof.innerText = 'Bể tròn nhân tạo lát đá';
  }
}

// Bảng thông tin tương tác đa năng cho Vật thể & Con người
function showInteractiveModal(data) {
  const card = document.getElementById('building-card');
  const tag = document.getElementById('card-tag');
  const title = document.getElementById('card-title');
  const desc = document.getElementById('card-desc');
  const zone = document.getElementById('card-zone');
  const dim = document.getElementById('card-dim');
  const height = document.getElementById('card-height');
  const area = document.getElementById('card-area');
  const roof = document.getElementById('card-roof');

  card.classList.remove('hidden');
  tag.innerText = (data.type || 'CHI TIẾT').toUpperCase();
  title.innerText = data.title || 'Chi tiết đối tượng';
  desc.innerText = data.desc || '';
  if (zone) zone.innerText = data.zone ? `Khuôn viên ${data.zone}` : 'Toàn khuôn viên';

  if (data.type === 'shutterDoor') {
    dim.innerText = '5.4m × 4.0m';
    height.innerText = 'Tự động cuộn điện';
    area.innerText = 'Nan nhôm hợp kim chống cháy';
    roof.innerText = areDoorsOpen ? 'Trạng thái: Đang Mở (Nhấp để Đóng)' : 'Trạng thái: Đang Đóng (Nhấp để Mở)';
  } else if (data.type === 'forklift') {
    dim.innerText = 'Tải trọng: 2.500 kg';
    height.innerText = 'Nâng cao: 3.5m';
    area.innerText = 'Động cơ điện AC 48V';
    roof.innerText = 'Đang nâng hạ pallet linh kiện';
  } else if (data.type === 'chargingStation') {
    dim.innerText = 'Công suất: 3.3 kW × 2 cổng';
    height.innerText = 'Điện áp: 220V AC';
    area.innerText = 'Cổng sạc chống nước IP65';
    roof.innerText = 'Đang sạc 2 xe DK Roma SX';
  } else if (data.type === 'character') {
    dim.innerText = 'Nhân sự DK Bike';
    height.innerText = 'Trang phục chuẩn nhận diện';
    area.innerText = 'Chứng chỉ an toàn lao động';
    roof.innerText = data.desc;
  } else if (data.type === 'executiveCar') {
    dim.innerText = '4.2m × 1.9m';
    height.innerText = 'Xe công vụ Ban Điều Hành';
    area.innerText = 'Bãi đỗ sân trước Nhà A';
    roof.innerText = 'Đỗ đúng ô kẻ vạch tiêu chuẩn';
  } else if (data.type === 'train') {
    dim.innerText = 'Đầu máy hơi nước đỏ + 3 toa';
    height.innerText = 'Tải trọng: 850 tấn';
    area.innerText = 'Tuyến ĐS Bắc - Nam';
    roof.innerText = 'Kéo dải khói mây trắng bồng bềnh khổng lồ';
  } else if (data.type === 'bridge') {
    dim.innerText = 'Chiều dài: 26.0m';
    height.innerText = 'Vòm thép cao 5.5m';
    area.innerText = 'Kết cấu thép chịu lực sơn đỏ';
    roof.innerText = 'Bắc qua thung lũng sông máng nước';
  } else if (data.type === 'station') {
    dim.innerText = 'Ke ga 24m × 5.2m';
    height.innerText = 'Mái ngói dốc 2 tầng 4.2m';
    area.innerText = 'Nhà ga phong cách đồng quê Willowbend';
    roof.innerText = 'Có barie đường sắt tự động đóng mở';
  } else if (data.type === 'boat') {
    dim.innerText = '4.2m × 1.6m';
    height.innerText = 'Mộc mạc truyền thống';
    area.innerText = 'Thuyền nan gỗ tự nhiên';
    roof.innerText = 'Chèo thuyền ngắm cảnh lá sen & đàn cá';
  } else if (data.type === 'animals') {
    dim.innerText = 'Đàn 7 chú cừu xù';
    height.innerText = 'Thân lông trắng, đầu đen nhánh';
    area.innerText = 'Đồi cỏ sinh thái xanh ngắt';
    roof.innerText = 'Thong dong gặm cỏ trong ánh nắng vàng';
  } else if (data.type === 'landmark') {
    dim.innerText = 'Tháp nón 9.5m, 4 cánh quạt 11m';
    height.innerText = 'Đỉnh đồi cao +25m';
    area.innerText = 'Cối xay gió phong cách Hà Lan';
    roof.innerText = 'Cánh quạt quay êm đềm trong gió';
  } else {
    dim.innerText = '--';
    height.innerText = '--';
    area.innerText = '--';
    roof.innerText = '--';
  }
}

// Chức năng Mở / Đóng cửa cuốn công nghiệp Xưởng B & Kho D2.1
function toggleShutterDoors(doorId = null) {
  if (doorId) {
    const door = shutterDoors.find((d) => d.id === doorId);
    if (door) {
      door.isOpen = !door.isOpen;
      door.targetProgress = door.isOpen ? 1 : 0;
    }
  } else {
    areDoorsOpen = !areDoorsOpen;
    shutterDoors.forEach((d) => {
      d.isOpen = areDoorsOpen;
      d.targetProgress = areDoorsOpen ? 1 : 0;
    });
  }

  // Cập nhật nhãn nút bấm trên giao diện
  const doorText = document.getElementById('btn-door-text');
  const doorBtn = document.getElementById('btn-toggle-doors');
  if (doorText) {
    doorText.innerText = areDoorsOpen ? 'Cửa xưởng: Đang mở' : 'Cửa xưởng: Đóng';
  }
  if (doorBtn) {
    doorBtn.classList.toggle('active', areDoorsOpen);
  }
}

// ============================================================================
// 20. UI Event Listeners & Raycasting
// ============================================================================
function setupEventListeners() {
  // Preset buttons
  document.querySelectorAll('.preset-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      setCameraPreset(btn.dataset.view);
    });
  });

  // Time toggle buttons
  document.querySelectorAll('.toggle-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      setEnvironment(btn.dataset.time);
    });
  });

  // Label toggle
  const labelBtn = document.getElementById('btn-toggle-labels');
  if (labelBtn) {
    labelBtn.addEventListener('click', () => {
      showLabels = !showLabels;
      labelBtn.classList.toggle('active', showLabels);
      updateLabels();
    });
  }

  // Rain toggle
  const rainBtn = document.getElementById('btn-toggle-rain');
  if (rainBtn) {
    rainBtn.addEventListener('click', () => {
      isRaining = !isRaining;
      rainBtn.classList.toggle('active', isRaining);
      if (rainParticles) rainParticles.visible = isRaining;
    });
  }

  // Nút Mở / Đóng cửa cuốn xưởng B
  const doorBtn = document.getElementById('btn-toggle-doors');
  if (doorBtn) {
    doorBtn.addEventListener('click', () => {
      toggleShutterDoors();
    });
  }

  // Close card button
  document.getElementById('card-close-btn').addEventListener('click', () => {
    document.getElementById('building-card').classList.add('hidden');
  });

  // Focus card button
  document.getElementById('btn-focus-card').addEventListener('click', () => {
    const tag = document.getElementById('card-tag').innerText.toLowerCase();
    const title = document.getElementById('card-title').innerText.toLowerCase();
    if (tag.includes('train') || title.includes('tàu') || title.includes('cầu')) setCameraPreset('railway');
    else if (tag.includes('station') || title.includes('ga')) setCameraPreset('dkStation');
    else if (tag.includes('animal') || title.includes('cừu')) setCameraPreset('sheepFlock');
    else if (tag.includes('boat') || title.includes('thuyền') || title.includes('sông')) setCameraPreset('river');
    else if (tag.includes('landmark') || title.includes('cối xay')) setCameraPreset('windmill');
    else if (tag.includes('dk1') || tag === 'nhab') setCameraPreset('nhaB');
    else if (tag.includes('dk2') || tag.includes('nha')) setCameraPreset('nhaDieuHanh');
    else if (tag.includes('lan')) setCameraPreset('vuonLan');
    else if (tag.includes('bốc') || tag.includes('xưởng')) setCameraPreset('logistics');
    else if (tag.includes('sạc')) setCameraPreset('chargingHub');
  });

  // Raycaster click on 3D canvas (Tương tác toàn diện với Công trình, Cửa xưởng, Xe cộ, Nhân sự)
  window.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.top-nav') || e.target.closest('.building-card') || e.target.closest('.bottom-hud')) {
      return;
    }

    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const allClickable = [...buildingMeshes, ...interactiveObjects];
    const intersects = raycaster.intersectObjects(allClickable, true);

    if (intersects.length > 0) {
      let hitObj = intersects[0].object;
      while (hitObj.parent && !hitObj.userData.id && !hitObj.userData.type) {
        hitObj = hitObj.parent;
      }

      if (hitObj.userData) {
        // Nếu click vào cửa cuốn -> Tự động toggle mở/đóng cửa và hiển thị card
        if (hitObj.userData.type === 'shutterDoor') {
          toggleShutterDoors(hitObj.userData.id);
          showInteractiveModal(hitObj.userData);
        } else if (hitObj.userData.type) {
          showInteractiveModal(hitObj.userData);
        } else if (hitObj.userData.id) {
          showBuildingModal(hitObj.userData.id);
        }
      }
    }
  });
}


function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}

// ============================================================================
// 21. Animation Loop
// ============================================================================
let lastTime = performance.now();

function animate(time) {
  requestAnimationFrame(animate);

  const currentTime = typeof time === 'number' ? time : performance.now();
  const rawDelta = (currentTime - lastTime) / 1000;
  const delta = (!isNaN(rawDelta) && rawDelta > 0) ? Math.min(rawDelta, 0.1) : 0.016;
  lastTime = currentTime;

  if (cameraTween) {
    cameraTween(currentTime);
  } else {
    controls.update();
  }

  // Update animated objects (Vehicles, train, people, flags, birds)
  try {
    updateAnimatedObjects(delta, currentTime);
  } catch (err) {
    console.warn('Animation update error:', err);
  }

  // Update rain effect
  updateRain(delta);

  // Subtle water ripples
  if (waterCanalMesh) {
    waterCanalMesh.material.opacity = 0.8 + Math.sin(currentTime * 0.002) * 0.05;
  }
  if (waterRoundPondMesh) {
    waterRoundPondMesh.material.opacity = 0.8 + Math.cos(currentTime * 0.002) * 0.05;
  }
  if (waterKoiMesh) {
    waterKoiMesh.material.opacity = 0.8 + Math.sin(currentTime * 0.003) * 0.04;
  }

  // Update compass needle rotation
  if (compassNeedle) {
    const angle = controls.getAzimuthalAngle();
    compassNeedle.style.transform = `rotate(${-angle * (180 / Math.PI)}deg)`;
  }

  // Update 3D labels
  updateLabels();

  // Render scene
  renderer.render(scene, camera);

  // FPS Counter
  frameCount++;
  const now = performance.now();
  if (now - lastFpsTime >= 500) {
    const fps = Math.round((frameCount * 1000) / (now - lastFpsTime));
    if (fpsElement) fpsElement.innerText = `${fps} FPS`;
    frameCount = 0;
    lastFpsTime = now;
  }
}

// Start application
window.addEventListener('DOMContentLoaded', init);
