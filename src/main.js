import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { CONFIG } from './config.js';

// Wind shader uniform for swaying foliage (Khối 2)
const windUniforms = {
  uWindTime: { value: 0 },
};

// ============================================================================
// State & Variables
// ============================================================================
let scene, camera, renderer, controls;
let dirLight, hemiLight, ambientLight;
let skyDomeMaterial;
let stylizedWaterMaterials = [];
let currentEnv = 'day';
let isRaining = false;
let rainParticles;

// Animated Vehicles & Logistics
let animatedBike, bikeRiderGroup, bikeTrackAngle = 0;
let animatedTruck, truckProgress = 0;
// Khối 9: Logistics, Forklifts & Truck Fleet
let activeLogisticsTruck = null;
let activeForklift = null;
let activeForkliftInitialPos = { x: 54.0, y: 0, z: -32.5, rotY: 0 };
let logisticsCycleTime = 0;
let guardGate1 = null;
let guardSaluteAngle = 0;
let truckInboundPallet = null;
let truckOutboundPallet = null;
let warehouseStoredPallet = null;
let warehouseReadyPallet = null;
let rotatingBeacons = [];
let logisticsTruckLights = [];
let logisticsSafetySlowdown = 1.0;
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

// Animated Characters & People (Khối 7: Người)
let walkingWorkers = [];
let wanderingPedestrians = [];
let nightReflectiveMaterials = [];
let securityFlashlights = [];
let socialGroups = [];
let flagMeshes = [];
let roofVentilators = [];
let birdFlockGroup, birdMeshes = [];

// Waypoint Network Graph cho người đi bộ khắp khuôn viên DK1 & DK2 (Khối 7)
const CAMPUS_WAYPOINTS = [
  // Phân khu DK1
  { id: 0, x: 74, y: 0, z: -18, neighbors: [1] },             // Cổng chính DK1
  { id: 1, x: 62, y: 0, z: -22, neighbors: [0, 2, 6] },         // Sân trước Nhà B
  { id: 2, x: 42, y: 0, z: -22, neighbors: [1, 3, 5] },         // Sân trước Nhà A
  { id: 3, x: 26, y: 0, z: -20, neighbors: [2, 4, 7] },         // Trạm sạc EV & sảnh Nhà A
  { id: 4, x: 22, y: 0, z: -12, neighbors: [3, 5] },            // Hiên Nhà Ăn CBNV
  { id: 5, x: 37, y: 0, z: -6.5, neighbors: [2, 4, 6] },         // Lối đi trước đài phun nước DK & sân bóng chuyền
  { id: 6, x: 60, y: 0, z: -28, neighbors: [1, 5, 8] },         // Khu bốc dỡ Nhà B
  { id: 7, x: 28, y: 0, z: -4, neighbors: [3, 9] },            // Đầu vạch đi bộ qua đường DK1 (Zebra)
  { id: 8, x: 70, y: 0, z: -42, neighbors: [1, 6] },            // Sân kiểm định sau Xưởng B

  // Tuyến băng qua ĐT234 sang DK2
  { id: 9, x: 28, y: 0, z: 4, neighbors: [7, 10] },            // Giữa đường ĐT234
  { id: 10, x: -18, y: 0, z: 4, neighbors: [9, 11] },          // Vỉa hè đối diện ĐT234

  // Phân khu DK2
  { id: 11, x: -18, y: 0, z: -18, neighbors: [10, 12] },        // Cổng chính DK2
  { id: 12, x: -28, y: 0, z: -24, neighbors: [11, 13] },        // Sân trước Nhà Điều Hành HQ
  { id: 13, x: -38, y: 0, z: -28, neighbors: [12, 14, 15] },    // Cạnh hồ cá Koi & sảnh đón DK2
  { id: 14, x: -52, y: 0, z: -32, neighbors: [13, 16] },        // Trạm sạc trung tâm DK2
  { id: 15, x: -38, y: 0, z: -50, neighbors: [13, 17] },        // Lối vào dãy Kho D2.1
  { id: 16, x: -72, y: 0, z: -30, neighbors: [14, 17] },        // Sân xe thành phẩm DK2
  { id: 17, x: -72, y: 0, z: -55, neighbors: [15, 16, 18] },    // Cửa kho D2.1
  { id: 18, x: -92, y: 0.5, z: -58, neighbors: [17, 19, 20] },  // Chân dốc đường mòn sinh thái

  // Đồi sinh thái DK2
  { id: 19, x: -108, y: 15.8, z: -82, neighbors: [18] },        // Đỉnh đồi Vườn Lan & Ao cá
  { id: 20, x: -142, y: 15.5, z: -38, neighbors: [18] },        // Đỉnh Đồi Gà & Tháp bồ câu
];

// Volleyball match & court
let volleyballMesh;
let volleyballPlayers = [];
let volleyballRallyProgress = 0;
let volleyballCourtGroup;

// Đài phun nước trung tâm DK & Cây bóng mát cảnh quan (10m từ Nhà Ăn)
let fountainGroup, fountainWaterMesh, fountainJets = [], fountainDKLogo;
let landscapeFeatureTree;

// Khối 8: Đội xe máy điện & phương tiện đi lại DK Bike
let animatedVehicles = [];
let evChargingRings = [];
let vehicleHeadlights = [];

// Cute Speech Bubbles (Người, Gà, Cừu)
let activeSpeechBubbles = [];
let nextSpeechTimer = 2.2;

// DK2 Hillside Eco-Pond, Chickens & Pigeons
let hillPondKoiFishes = [];
let hillPondWater;
let hillChickens = [];
let hillPigeons = [];
let flyingPigeonsGroup, flyingPigeonMeshes = [];

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

  // Renderer (Khối 3: sRGB, ACESFilmic, PCFSoftShadowMap)
  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
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
  buildCourtyardGreenery();
  buildBuildingContactShadows();

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
// ============================================================================
// 2. Atmosphere & Lighting System (Khối 3: Bầu trời Gradient & Nắng góc thấp)
// ============================================================================
function createGradientSky() {
  const skyGeo = new THREE.SphereGeometry(620, 32, 16);
  skyDomeMaterial = new THREE.ShaderMaterial({
    uniforms: {
      topColor: { value: new THREE.Color(CONFIG.LIGHTING.day.skyGradient.top) },
      bottomColor: { value: new THREE.Color(CONFIG.LIGHTING.day.skyGradient.bottom) },
      offset: { value: 30.0 },
      exponent: { value: 0.65 },
    },
    vertexShader: `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 topColor;
      uniform vec3 bottomColor;
      uniform float offset;
      uniform float exponent;
      varying vec3 vWorldPosition;
      void main() {
        float h = normalize(vWorldPosition + offset).y;
        gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
      }
    `,
    side: THREE.BackSide,
    depthWrite: false,
  });
  const skyMesh = new THREE.Mesh(skyGeo, skyDomeMaterial);
  scene.add(skyMesh);
}

function setupLights() {
  createGradientSky();

  ambientLight = new THREE.AmbientLight(
    CONFIG.LIGHTING.day.ambientColor,
    CONFIG.LIGHTING.day.ambientIntensity
  );
  scene.add(ambientLight);

  hemiLight = new THREE.HemisphereLight(
    CONFIG.LIGHTING.day.skyColor,
    CONFIG.LIGHTING.day.groundColor,
    0.55
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
  dirLight.shadow.mapSize.width = 4096;
  dirLight.shadow.mapSize.height = 4096;
  dirLight.shadow.camera.near = 10;
  dirLight.shadow.camera.far = 420;

  const d = 160;
  dirLight.shadow.camera.left = -d;
  dirLight.shadow.camera.right = d;
  dirLight.shadow.camera.top = d;
  dirLight.shadow.camera.bottom = -d;
  dirLight.shadow.bias = -0.0003;
  dirLight.shadow.normalBias = 0.04;
  scene.add(dirLight);

  logoLight = new THREE.PointLight(0xffb703, 0, 35);
  logoLight.position.set(CONFIG.BUILDINGS.nhaB.position.x, 14, CONFIG.BUILDINGS.nhaB.position.z + 18);
  scene.add(logoLight);
}

// ============================================================================
// 3. Ground Platforms & Provincial Road ĐT234
// ============================================================================
function buildGroundsAndRoadDT234() {
    // Nâng cấp Địa hình & Mép bờ (Terrain Overhaul: Loại bỏ hoàn toàn mép cắt sắc nhọn)
  // Tạo hàm bệ đất có taluy dốc thoai thoải viền xung quanh (Soft Sloped Embankment Skirts)
  const createSlopedYardPlatform = (cfg, skirtWidth = 4.2) => {
    const group = new THREE.Group();
    const halfW = cfg.width / 2;
    const halfD = cfg.depth / 2;
    const topY = 0.0;
    const botY = -1.15;

    // Mặt bằng trung tâm phẳng
    const mainMat = new THREE.MeshStandardMaterial({
      color: cfg.color,
      roughness: 0.85,
      metalness: 0.08,
      flatShading: true,
    });
    const mainPlate = new THREE.Mesh(new THREE.BoxGeometry(cfg.width, 1.2, cfg.depth), mainMat);
    mainPlate.position.set(cfg.center.x, -0.6, cfg.center.z);
    mainPlate.receiveShadow = true;
    group.add(mainPlate);

    // Vật liệu taluy sườn dốc xanh cỏ mát dịu bắt sáng phong cách Toon
    const skirtMat = new THREE.MeshStandardMaterial({
      color: CONFIG.GROUND.grassAccentColor,
      roughness: 0.88,
      flatShading: true,
    });

    // 4 Mái vát dốc thoai thoải nối từ cao độ y=0 xuống y=-1.15 mặt đồng cỏ
    const addBerm = (bx, bz, bw, bd, rotY) => {
      const bermGeo = new THREE.BufferGeometry();
      const vertices = new Float32Array([
        // Tam giác lăng trụ dốc (vát nghiêng 30 độ)
        -bw / 2, topY, -bd / 2,
        bw / 2, topY, -bd / 2,
        -bw / 2, botY, bd / 2,

        bw / 2, topY, -bd / 2,
        bw / 2, botY, bd / 2,
        -bw / 2, botY, bd / 2,
      ]);
      bermGeo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
      bermGeo.computeVertexNormals();

      const bermMesh = new THREE.Mesh(bermGeo, skirtMat);
      bermMesh.position.set(bx, 0, bz);
      bermMesh.rotation.y = rotY;
      bermMesh.receiveShadow = true;
      group.add(bermMesh);
    };

    // Mái dốc Bắc, Nam, Đông, Tây
    addBerm(cfg.center.x, cfg.center.z - halfD - skirtWidth / 2, cfg.width, skirtWidth, 0);
    addBerm(cfg.center.x, cfg.center.z + halfD + skirtWidth / 2, cfg.width, skirtWidth, Math.PI);
    addBerm(cfg.center.x + halfW + skirtWidth / 2, cfg.center.z, cfg.depth, skirtWidth, -Math.PI / 2);
    addBerm(cfg.center.x - halfW - skirtWidth / 2, cfg.center.z, cfg.depth, skirtWidth, Math.PI / 2);

    // Dải chuyển tiếp đất sỏi nâu ấm quanh chân taluy (Gravel / Earth transition fringe)
    const fringeMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.95 });
    const fringe = new THREE.Mesh(
      new THREE.RingGeometry(Math.max(halfW, halfD) + skirtWidth * 0.9, Math.max(halfW, halfD) + skirtWidth * 1.3, 16),
      fringeMat
    );
    fringe.rotation.x = -Math.PI / 2;
    fringe.position.set(cfg.center.x, botY + 0.02, cfg.center.z);
    fringe.scale.set(cfg.width / Math.max(halfW, halfD) / 2, cfg.depth / Math.max(halfW, halfD) / 2, 1);
    group.add(fringe);

    return group;
  };

  // Nền phân khu DK1 & DK2 có taluy dốc thoai thoải hữu cơ
  const dk1Cfg = CONFIG.GROUND.dk1;
  const dk1Platform = createSlopedYardPlatform(dk1Cfg, 4.5);
  scene.add(dk1Platform);

  const dk2Cfg = CONFIG.GROUND.dk2;
  const dk2Platform = createSlopedYardPlatform(dk2Cfg, 4.5);
  scene.add(dk2Platform);

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
// Tính toán độ cao mặt đồi phía Đông (quanh đàn cừu và làng quê)
function getEastHillSurfaceY(x, z) {
  const hx = 125, hz = -80, radius = 52;
  const dist = Math.hypot(x - hx, z - hz);
  if (dist >= radius) return 0.2;
  return Math.max(0.2, -2.0 + 26.0 * (1 - dist / radius));
}

// Tính toán độ cao sườn đồi phân khu DK2 (bao gồm Đồi chính DK2 và Đồi mới chuồng gà)
function getDK2HillSurfaceY(x, z) {
  let maxY = 0.05;

  // 1. Đồi chính DK2 (Đỉnh +23m)
  const hx1 = CONFIG.HILLS.dk2.position.x; // -120
  const hz1 = CONFIG.HILLS.dk2.position.z; // -78
  const r1 = CONFIG.HILLS.dk2.radius;     // 54
  const dist1 = Math.hypot(x - hx1, z - hz1);
  if (dist1 < r1) {
    const y1 = -2.0 + 25.0 * (1 - dist1 / r1);
    if (y1 > maxY) maxY = y1;
  }

      // 2. Đồi mới sinh thái
  if (CONFIG.HILLS.dk2NewHill) {
    const hx2 = CONFIG.HILLS.dk2NewHill.position.x; // -142
    const hz2 = CONFIG.HILLS.dk2NewHill.position.z; // -38
    const r2 = CONFIG.HILLS.dk2NewHill.radius;     // 46m (giảm kích thước vừa vặn xinh xắn)
    const flatR = CONFIG.HILLS.dk2NewHill.flatRadius || 15.0; // 15m đỉnh phẳng
    const apex2 = CONFIG.HILLS.dk2NewHill.height || 15.5;   // 15.5m cao độ
    const dist2 = Math.hypot(x - hx2, z - hz2);
    if (dist2 < r2) {
      let y2;
      if (dist2 <= flatR) {
        y2 = apex2; // Đỉnh phẳng hoàn hảo để đi dạo, ngắm hoa và nuôi chim gà
      } else {
        const slopeT = (dist2 - flatR) / (r2 - flatR);
        y2 = -0.5 + (apex2 + 0.5) * Math.pow(1.0 - slopeT, 1.25); // Sườn dốc thoai thoải tự nhiên
      }
      if (y2 > maxY) maxY = y2;
    }
  }

  return maxY;
}

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

    // 2. Dãy núi chân trời bao bọc phía Bắc, Tây-Bắc & Tây (Horizon Mountain Amphitheater - Che kín mép bản đồ như ảnh 1)
  const hillsData = [
    // --- KHU VỰC ĐÔNG & ĐÔNG BẮC (Thung lũng đường sắt & cối xay gió) ---
    { x: 125, y: 11, z: -80, radius: 52, height: 26, color: 0x22c55e, segs: 9 },
    { x: 145, y: 9, z: -25, radius: 48, height: 22, color: 0x16a34a, segs: 9 },
    { x: 135, y: 8, z: 38, radius: 45, height: 20, color: 0x4ade80, segs: 8 },
    { x: 55, y: 12, z: -108, radius: 54, height: 28, color: 0x22c55e, segs: 10 }, // Đồi đặt cối xay gió
    { x: 105, y: 15, z: -125, radius: 60, height: 32, color: 0x15803d, segs: 10 },

    // --- LỚP 1: DÃY NÚI TRUNG CẢNH PHÍA BẮC (North Horizon Ridge, cao 32m - 46m) ---
    { x: 10, y: 16, z: -140, radius: 68, height: 36, color: 0x166534, segs: 10 },
    { x: -35, y: 18, z: -135, radius: 72, height: 40, color: 0x15803d, segs: 10 },
    { x: -80, y: 20, z: -145, radius: 75, height: 44, color: 0x166534, segs: 11 },
    { x: -125, y: 22, z: -135, radius: 78, height: 46, color: 0x15803d, segs: 11 },
    { x: -165, y: 20, z: -130, radius: 74, height: 42, color: 0x16a34a, segs: 10 },

    // --- LỚP 2: DÃY NÚI VIỀN PHÍA TÂY & TÂY BẮC (West Horizon Ridge sau lưng DK2, che kín mép bản đồ) ---
    { x: -195, y: 18, z: -90, radius: 72, height: 38, color: 0x166534, segs: 10 },
    { x: -210, y: 22, z: -40, radius: 82, height: 45, color: 0x15803d, segs: 11 },
    { x: -205, y: 20, z: 15, radius: 78, height: 42, color: 0x166534, segs: 10 },
    { x: -190, y: 16, z: 65, radius: 70, height: 36, color: 0x15803d, segs: 10 },
    { x: -175, y: 14, z: 110, radius: 65, height: 32, color: 0x22c55e, segs: 9 },

    // --- LỚP 3: DÃY NÚI ĐẠI NGÀN XA XĂM (Distant Alpine Horizon, cao 65m - 92m, xóa nhòa đường chân trời) ---
    { x: -70, y: 38, z: -210, radius: 140, height: 82, color: 0x0f5132, segs: 12 },
    { x: 30, y: 40, z: -215, radius: 145, height: 86, color: 0x14532d, segs: 12 },
    { x: 130, y: 42, z: -195, radius: 135, height: 80, color: 0x0f5132, segs: 11 },
    { x: -160, y: 40, z: -200, radius: 140, height: 85, color: 0x14532d, segs: 12 },
    { x: -245, y: 42, z: -165, radius: 135, height: 88, color: 0x0f5132, segs: 12 },
    { x: -275, y: 38, z: -90, radius: 130, height: 78, color: 0x14532d, segs: 11 },
    { x: -285, y: 35, z: -15, radius: 125, height: 75, color: 0x0f5132, segs: 11 },
    { x: -265, y: 32, z: 60, radius: 120, height: 70, color: 0x14532d, segs: 10 },
    { x: -240, y: 30, z: 120, radius: 115, height: 65, color: 0x166534, segs: 10 },
  ];

  hillsData.forEach((h) => {
    const hillMesh = new THREE.Mesh(
      new THREE.ConeGeometry(h.radius, h.height, h.segs || 9),
      new THREE.MeshStandardMaterial({
        color: h.color,
        roughness: 0.92,
        metalness: 0.05,
        flatShading: true, // Các mảng đa giác bắt sáng lấp lánh như tranh vẽ Anime
      })
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

// ============================================================================
// Shader Nước Cách Điệu: Màu theo độ sâu, viền bọt trắng & gợn sóng mưa (Khối 4)
// ============================================================================
function createStylizedWaterMaterial(isCurvedCanal = false) {
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: windUniforms.uWindTime,
      uShallowColor: { value: new THREE.Color(CONFIG.WATER.shallowColor) },
      uDeepColor: { value: new THREE.Color(CONFIG.WATER.deepColor) },
      uFoamColor: { value: new THREE.Color(CONFIG.WATER.foamColor) },
      uSunColor: { value: new THREE.Color(CONFIG.LIGHTING.day.sunColor) },
      uSunDir: { value: new THREE.Vector3(125, 78, 90).normalize() },
      uIsCurvedCanal: { value: isCurvedCanal ? 1.0 : 0.0 },
      uIsRaining: { value: isRaining ? 1.0 : 0.0 },
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vWorldPosition;
      varying vec3 vNormal;
      uniform float uTime;
      uniform float uIsRaining;

      void main() {
        vUv = uv;
        vec3 transformed = position;

        // Gợn sóng lăn tăn nhẹ nhàng
        float wave = sin(transformed.x * 0.4 + uTime * 1.3) * cos(transformed.z * 0.4 - uTime * 1.0) * 0.04;
        if (uIsRaining > 0.5) {
          wave += sin(length(transformed.xz) * 5.0 - uTime * 7.0) * 0.03;
        }
        transformed.y += wave;

        vec4 worldPosition = modelMatrix * vec4(transformed, 1.0);
        vWorldPosition = worldPosition.xyz;
        vNormal = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * worldPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 uShallowColor;
      uniform vec3 uDeepColor;
      uniform vec3 uFoamColor;
      uniform vec3 uSunColor;
      uniform vec3 uSunDir;
      uniform float uTime;
      uniform float uIsCurvedCanal;
      uniform float uIsRaining;

      varying vec2 vUv;
      varying vec3 vWorldPosition;
      varying vec3 vNormal;

      void main() {
        // Độ sâu nước: với mương cong dùng uv.x, với ao hồ tròn dùng khoảng cách tâm
        float depth;
        if (uIsCurvedCanal > 0.5) {
          depth = 1.0 - abs(vUv.x - 0.5) * 2.0; // 0 ở bờ, 1 ở giữa dòng
        } else {
          float dist = length(vUv - vec2(0.5)) * 2.0;
          depth = clamp(1.0 - dist, 0.0, 1.0);
        }

        // Chuyển sắc độ màu theo độ sâu nước (Xanh ngọc ở bờ -> Xanh đậm ở giữa)
        vec3 waterCol = mix(uShallowColor, uDeepColor, smoothstep(0.08, 0.72, depth));

        // Họa tiết vệt sáng khúc xạ đáy nước chuyển động chậm (Animated Caustics)
        float c1 = sin(vWorldPosition.x * 0.55 + uTime * 0.85) * cos(vWorldPosition.z * 0.55 - uTime * 0.65);
        float c2 = cos(vWorldPosition.x * 0.9 - uTime * 0.5) * sin(vWorldPosition.z * 0.9 + uTime * 0.75);
        float caustic = pow(clamp(c1 + c2, 0.0, 1.0), 3.0) * 0.36;
        waterCol += caustic * vec3(1.0);

        // Viền bọt trắng uốn lượn sát mép bờ cát
        float shoreEdge = (uIsCurvedCanal > 0.5) ? abs(vUv.x - 0.5) * 2.0 : length(vUv - vec2(0.5)) * 2.0;
        float foamNoise = sin(vWorldPosition.z * 2.0 + uTime * 2.2) * 0.04;
        float foam = smoothstep(0.85 + foamNoise, 0.98, shoreEdge) * 0.88;
        waterCol = mix(waterCol, uFoamColor, foam);

        // Hiệu ứng hạt mưa tạo vòng sóng tròn lan tỏa khi trời mưa
        if (uIsRaining > 0.5) {
          float rip1 = sin(length(mod(vWorldPosition.xz, 5.0) - 2.5) * 9.0 - uTime * 8.0);
          float rip2 = sin(length(mod(vWorldPosition.xz + 2.0, 6.0) - 3.0) * 8.0 - uTime * 9.0);
          float rainRipples = max(0.0, rip1 * 0.5 + rip2 * 0.5);
          waterCol += rainRipples * 0.25 * vec3(1.0);
        }

        // Vệt phản chiếu ánh nắng lấp lánh (Specular Highlights)
        vec3 viewDir = normalize(cameraPosition - vWorldPosition);
        vec3 halfDir = normalize(uSunDir + viewDir);
        float spec = pow(max(dot(vNormal, halfDir), 0.0), 36.0);
        waterCol += spec * uSunColor * 0.45;

        gl_FragColor = vec4(waterCol, 0.90);
      }
    `,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  stylizedWaterMaterials.push(mat);
  return mat;
}

// Tuyến đường sắt cong, Cầu vòm đỏ, Ga xe lửa DK Station & Mương nước uốn cong song song
function buildCanalAndRailway() {
  // --------------------------------------------------------------------------
  // B. Khởi tạo tuyến đường sắt cong uốn lượn (Curved Railway) trước tiên
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

  // --------------------------------------------------------------------------
  // A. Mương nước thủy lợi uốn lượn 100% song song với đường tàu (Theo yêu cầu)
  // --------------------------------------------------------------------------
  const canalWidth = CONFIG.CANAL.width; // 9.5m
  const canalOffset = CONFIG.CANAL.offsetFromRail; // 8.5m chạy song song
  const segments = 120;

  // Mảng dữ liệu hình học mặt nước mương cong
  const waterPositions = [];
  const waterUvs = [];
  const waterIndices = [];

  // Mảng dữ liệu đáy mương cát vàng
  const bedPositions = [];
  const bedUvs = [];
  const bedIndices = [];

  // Mảng dữ liệu bờ cát thoai thoải 2 bên (Bờ Tây và Bờ Đông)
  const sandLPositions = [];
  const sandLUvs = [];
  const sandLIndices = [];

  const sandRPositions = [];
  const sandRUvs = [];
  const sandRIndices = [];

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const pt = railwayCurve.getPointAt(t);
    const tan = railwayCurve.getTangentAt(t);
    const norm = new THREE.Vector3(-tan.z, 0, tan.x).normalize();

    // Tim mương nước uốn cong song song cách tim đường sắt 8.5m
    const cCenter = pt.clone().sub(norm.clone().multiplyScalar(canalOffset));

    const waterY = -1.35;
    const bedY = -2.35;
    const bankY = -1.15;

    const wHalf = canalWidth / 2;
    const wLeft = cCenter.clone().sub(norm.clone().multiplyScalar(wHalf));
    const wRight = cCenter.clone().add(norm.clone().multiplyScalar(wHalf));

    // Bờ cát mở rộng 2.6m mỗi bên
    const sLeftOuter = cCenter.clone().sub(norm.clone().multiplyScalar(wHalf + 2.6));
    const sRightOuter = cCenter.clone().add(norm.clone().multiplyScalar(wHalf + 2.6));

    // 1. Mặt nước (Water ribbon)
    waterPositions.push(wLeft.x, waterY, wLeft.z);
    waterPositions.push(wRight.x, waterY, wRight.z);
    waterUvs.push(0, t);
    waterUvs.push(1, t);

    // 2. Đáy mương (Canal bed)
    bedPositions.push(wLeft.x, bedY, wLeft.z);
    bedPositions.push(wRight.x, bedY, wRight.z);
    bedUvs.push(0, t);
    bedUvs.push(1, t);

    // 3. Bờ cát trái (Bờ Tây giáp nhà máy)
    sandLPositions.push(sLeftOuter.x, bankY, sLeftOuter.z);
    sandLPositions.push(wLeft.x, waterY + 0.05, wLeft.z);
    sandLUvs.push(0, t);
    sandLUvs.push(1, t);

    // 4. Bờ cát phải (Bờ Đông giáp đường ray)
    sandRPositions.push(wRight.x, waterY + 0.05, wRight.z);
    sandRPositions.push(sRightOuter.x, bankY, sRightOuter.z);
    sandRUvs.push(0, t);
    sandRUvs.push(1, t);

    if (i < segments) {
      const idx = i * 2;
      waterIndices.push(idx, idx + 1, idx + 2);
      waterIndices.push(idx + 1, idx + 3, idx + 2);

      bedIndices.push(idx, idx + 1, idx + 2);
      bedIndices.push(idx + 1, idx + 3, idx + 2);

      sandLIndices.push(idx, idx + 1, idx + 2);
      sandLIndices.push(idx + 1, idx + 3, idx + 2);

      sandRIndices.push(idx, idx + 1, idx + 2);
      sandRIndices.push(idx + 1, idx + 3, idx + 2);
    }
  }

  // Khởi tạo Mesh Mặt Nước Cách Điệu uốn cong
  const waterGeo = new THREE.BufferGeometry();
  waterGeo.setAttribute('position', new THREE.Float32BufferAttribute(waterPositions, 3));
  waterGeo.setAttribute('uv', new THREE.Float32BufferAttribute(waterUvs, 2));
  waterGeo.setIndex(waterIndices);
  waterGeo.computeVertexNormals();

  const waterCanalMat = createStylizedWaterMaterial(true);
  waterCanalMesh = new THREE.Mesh(waterGeo, waterCanalMat);
  waterCanalMesh.receiveShadow = true;
  scene.add(waterCanalMesh);

  // Khởi tạo Mesh Đáy Mương
  const bedGeo = new THREE.BufferGeometry();
  bedGeo.setAttribute('position', new THREE.Float32BufferAttribute(bedPositions, 3));
  bedGeo.setAttribute('uv', new THREE.Float32BufferAttribute(bedUvs, 2));
  bedGeo.setIndex(bedIndices);
  bedGeo.computeVertexNormals();
  const bedMat = new THREE.MeshStandardMaterial({ color: CONFIG.GROUND.sandColor, roughness: 0.95 });
  const canalBed = new THREE.Mesh(bedGeo, bedMat);
  canalBed.receiveShadow = true;
  scene.add(canalBed);

  // Khởi tạo Bờ Cát Thoai Thoải 2 bên
  const sandMat = new THREE.MeshStandardMaterial({ color: CONFIG.GROUND.sandColor, roughness: 0.95, flatShading: true });

  const sandLGeo = new THREE.BufferGeometry();
  sandLGeo.setAttribute('position', new THREE.Float32BufferAttribute(sandLPositions, 3));
  sandLGeo.setAttribute('uv', new THREE.Float32BufferAttribute(sandLUvs, 2));
  sandLGeo.setIndex(sandLIndices);
  sandLGeo.computeVertexNormals();
  const sandLeft = new THREE.Mesh(sandLGeo, sandMat);
  sandLeft.receiveShadow = true;
  scene.add(sandLeft);

  const sandRGeo = new THREE.BufferGeometry();
  sandRGeo.setAttribute('position', new THREE.Float32BufferAttribute(sandRPositions, 3));
  sandRGeo.setAttribute('uv', new THREE.Float32BufferAttribute(sandRUvs, 2));
  sandRGeo.setIndex(sandRIndices);
  sandRGeo.computeVertexNormals();
  const sandRight = new THREE.Mesh(sandRGeo, sandMat);
  sandRight.receiveShadow = true;
  scene.add(sandRight);

  // Thuyền nan & người chèo đò đứng giữa dòng mương cong (t = 0.52)
  const bPt = railwayCurve.getPointAt(0.52);
  const bTan = railwayCurve.getTangentAt(0.52);
  const bNorm = new THREE.Vector3(-bTan.z, 0, bTan.x).normalize();
  const boatPos = bPt.clone().sub(bNorm.clone().multiplyScalar(canalOffset));

  const boatGroup = new THREE.Group();
  boatGroup.position.set(boatPos.x, -1.32, boatPos.z);
  boatGroup.rotation.y = Math.atan2(bTan.x, bTan.z);

  const boatHull = new THREE.Mesh(
    new THREE.BoxGeometry(1.6, 0.6, 4.2),
    new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.8 })
  );
  boatHull.castShadow = true;
  boatGroup.add(boatHull);

  const boatman = createCharacter({ shirtColor: 0xef4444, pantsColor: 0x1e293b, hatColor: 0xfef08a, isDriver: true });
  boatman.position.set(0, 0.25, 0.4);
  boatGroup.add(boatman);

  const oar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 2.8),
    new THREE.MeshStandardMaterial({ color: 0xd4a373, roughness: 0.7 })
  );
  oar.rotation.z = Math.PI / 4;
  oar.position.set(0.6, 0.7, 0.2);
  boatGroup.add(oar);

  boatGroup.userData = {
    id: 'rowingBoat',
    title: 'Thuyền nan du ngoạn sinh thái trên sông máng',
    type: 'boat',
    desc: 'Hoạt động chèo thuyền thư giãn trên dòng sông máng nước trong vắt uốn lượn song song với tuyến đường sắt DK Bike.',
    zone: 'Sông Máng Nước',
  };
  boatHull.userData = boatGroup.userData;
  scene.add(boatGroup);
  interactiveObjects.push(boatHull);
  rowingBoat = boatGroup;

  // Lá sen tròn to khuyết chữ V (Lily Pads) & hoa súng nổi trên mương cong
  const lilyMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.6, side: THREE.DoubleSide });
  const lilyFlowerMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.3 });
  lotusLeaves = [];

  const lilyCurveT = [0.44, 0.47, 0.50, 0.55, 0.58, 0.62];
  lilyCurveT.forEach((lt, lIdx) => {
    const lPt = railwayCurve.getPointAt(lt);
    const lTan = railwayCurve.getTangentAt(lt);
    const lNorm = new THREE.Vector3(-lTan.z, 0, lTan.x).normalize();
    const lPos = lPt.clone().sub(lNorm.clone().multiplyScalar(canalOffset + (lIdx % 2 === 0 ? 1.5 : -1.5)));

    const pad = new THREE.Mesh(new THREE.CircleGeometry(0.85, 12, 0.4, Math.PI * 1.85), lilyMat);
    pad.rotation.x = -Math.PI / 2;
    pad.position.set(lPos.x, -1.33, lPos.z);
    scene.add(pad);
    lotusLeaves.push(pad);

    if (lIdx % 2 === 0) {
      const flower = new THREE.Mesh(new THREE.DodecahedronGeometry(0.25), lilyFlowerMat);
      flower.position.set(lPos.x + 0.1, -1.23, lPos.z - 0.1);
      scene.add(flower);
    }
  });

  // Đàn cá xanh bơi lội dưới sông máng
  riverFishGroup = new THREE.Group();
  riverFishGroup.position.set(boatPos.x, -1.45, boatPos.z);
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

  // Cầu gỗ mộc bắc qua khúc mương cong ở mạn Nam (t = 0.72)
  const brPt = railwayCurve.getPointAt(0.72);
  const brTan = railwayCurve.getTangentAt(0.72);
  const brNorm = new THREE.Vector3(-brTan.z, 0, brTan.x).normalize();
  const bridgePos = brPt.clone().sub(brNorm.clone().multiplyScalar(canalOffset));

  const woodBridge = new THREE.Mesh(
    new THREE.BoxGeometry(canalWidth + 3.0, 0.35, 3.2),
    new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.85 })
  );
  woodBridge.position.set(bridgePos.x, -0.9, bridgePos.z);
  woodBridge.rotation.y = Math.atan2(brTan.x, brTan.z) + Math.PI / 2;
  woodBridge.castShadow = true;
  scene.add(woodBridge);

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

  // Mái ngói đỏ dốc chữ A kiểu Âu (Gable Roof 2 mái chuẩn kiến trúc)
  const roofRedMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.5 });
  const ridgeMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.4 });

  // Mái dốc cánh trái
  const roofSlopeL = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.16, 11.2), roofRedMat);
  roofSlopeL.rotation.z = Math.PI / 6;
  roofSlopeL.position.set(-0.95, 3.82, 0);
  roofSlopeL.castShadow = true;
  stationBuilding.add(roofSlopeL);

  // Mái dốc cánh phải
  const roofSlopeR = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.16, 11.2), roofRedMat);
  roofSlopeR.rotation.z = -Math.PI / 6;
  roofSlopeR.position.set(0.95, 3.82, 0);
  roofSlopeR.castShadow = true;
  stationBuilding.add(roofSlopeR);

  // Sống mái / đòn nóc chạy dọc đỉnh mái
  const ridgeBeam = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.18, 11.3), ridgeMat);
  ridgeBeam.position.set(0, 4.45, 0);
  stationBuilding.add(ridgeBeam);

  // Tường hồi tam giác 2 đầu nhà (Gable End Walls)
  const triangleShape = new THREE.Shape();
  triangleShape.moveTo(-1.8, 3.2);
  triangleShape.lineTo(0, 4.35);
  triangleShape.lineTo(1.8, 3.2);
  triangleShape.closePath();
  const gableGeo = new THREE.ShapeGeometry(triangleShape);
  const wallMatWhite = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.6 });

  [-5.26, 5.26].forEach((gz) => {
    const gableWall = new THREE.Mesh(gableGeo, wallMatWhite);
    gableWall.position.set(0, 0, gz);
    if (gz > 0) gableWall.rotation.y = Math.PI;
    stationBuilding.add(gableWall);
  });

  // Hiên che sân ga cột xanh vươn ra đón khách
  const porchRoof = new THREE.Mesh(
    new THREE.BoxGeometry(2.2, 0.14, 11.2),
    new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.6 })
  );
  porchRoof.rotation.z = -0.15;
  porchRoof.position.set(2.5, 2.75, 0);
  porchRoof.castShadow = true;
  stationBuilding.add(porchRoof);

  const columnMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.5 });
  for (let cz = -4.5; cz <= 4.5; cz += 3.0) {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.7), columnMat);
    col.position.set(3.4, 1.35, cz);
    col.castShadow = true;
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

  const villageWallMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.7 });
  chimneySmokePuffs = [];

  villageHouses.forEach((vh, vIdx) => {
    const houseGroup = new THREE.Group();
    houseGroup.position.set(vh.x, 0.2, vh.z);
    houseGroup.rotation.y = vh.rot;

    // Tường nhà trắng
    const body = new THREE.Mesh(new THREE.BoxGeometry(3.6, 3.2, 3.8), villageWallMat);
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
  const sheepBaseX = 108;
  const sheepBaseZ = -45;
  const sheepBaseY = getEastHillSurfaceY(sheepBaseX, sheepBaseZ) + 0.1; // ~ 4.6m
  const sheepGroup = new THREE.Group();
  sheepGroup.position.set(sheepBaseX, sheepBaseY, sheepBaseZ);

  const woolMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, flatShading: true });
  const sheepBlackMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });

  const sheepCoords = [
    { x: 0, z: 0, rot: 0.3 },
    { x: 2.5, z: -1.4, rot: -0.5 },
    { x: -2.2, z: 1.8, rot: 0.8 },
    { x: 4.2, z: 1.6, rot: 2.1 },
    { x: 1.5, z: 3.5, rot: 1.2 },
    { x: -3.6, z: -1.8, rot: -1.8 },
    { x: 5.2, z: -0.8, rot: -0.2 },
  ];

  sheepCoords.forEach((sc, sIdx) => {
    const oneSheep = new THREE.Group();
    const wy = getEastHillSurfaceY(sc.x + sheepBaseX, sc.z + sheepBaseZ) - sheepBaseY;
    oneSheep.position.set(sc.x, wy, sc.z);
    oneSheep.rotation.y = sc.rot;

    // Thân lông xù trắng lớn, bồng bềnh
    const bodyWool = new THREE.Mesh(new THREE.DodecahedronGeometry(0.85, 1), woolMat);
    bodyWool.scale.set(1.05, 0.9, 1.4);
    bodyWool.position.y = 0.85;
    bodyWool.castShadow = true;
    oneSheep.add(bodyWool);

    // Đầu cừu đen
    const sheepHead = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.45, 0.55), sheepBlackMat);
    sheepHead.position.set(0, 1.05, 0.85);
    oneSheep.add(sheepHead);

    // Mắt trắng tròn
    [-0.15, 0.15].forEach((mx) => {
      const eye = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.02), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      eye.position.set(mx, 1.15, 1.13);
      oneSheep.add(eye);
    });

    // Tai vểnh hai bên
    [-0.28, 0.28].forEach((ex) => {
      const ear = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.1, 0.12), sheepBlackMat);
      ear.position.set(ex, 1.18, 0.78);
      oneSheep.add(ear);
    });

    // 4 chân đen vững chãi
    [-0.32, 0.32].forEach((lx) => {
      [-0.45, 0.45].forEach((lz) => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.55, 6), sheepBlackMat);
        leg.position.set(lx, 0.28, lz);
        leg.castShadow = true;
        oneSheep.add(leg);
      });
    });

    sheepGroup.add(oneSheep);
    fluffySheeps.push(oneSheep);
  });

  // Bóng thoại hoạt hình đáng yêu (như ảnh 2: "I could dance all afternoon!")
  const speechBubble = new THREE.Mesh(
    new THREE.BoxGeometry(4.2, 1.4, 0.12),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 })
  );
  speechBubble.position.set(2.5, 4.2, 0.5);
  speechBubble.rotation.y = -Math.PI / 4;
  sheepGroup.add(speechBubble);

  const bubbleTail = new THREE.Mesh(
    new THREE.ConeGeometry(0.4, 0.7, 3),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 })
  );
  bubbleTail.rotation.z = Math.PI;
  bubbleTail.position.set(1.6, 3.2, 0.5);
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
// Architectural Detail Helpers (Khối 5: Nâng chi tiết công trình chuẩn Drone)
// ============================================================================

// 1. Dải cửa sổ công nghiệp có đố kính (Mullioned Window Strips)
function createWindowStripWithMullions(parent, x, y, z, width, height, rotY, mullionSpacing, windowMat) {
  const winGroup = new THREE.Group();
  winGroup.position.set(x, y, z);
  winGroup.rotation.y = rotY;

  // Mặt kính phẳng
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(width, height), windowMat);
  winGroup.add(glass);

  // Khung viền kim loại xám đen
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 });
  const frameThick = 0.05;
  const frameDepth = 0.08;

  // Thanh trên & dưới
  [-height / 2, height / 2].forEach((fy) => {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(width, frameThick, frameDepth), frameMat);
    bar.position.set(0, fy, 0.02);
    winGroup.add(bar);
  });

  // Thanh 2 bên
  [-width / 2, width / 2].forEach((fx) => {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(frameThick, height, frameDepth), frameMat);
    bar.position.set(fx, 0, 0.02);
    winGroup.add(bar);
  });

  // Các đố kính dọc (Vertical Mullions)
  if (mullionSpacing > 0) {
    const count = Math.floor(width / mullionSpacing);
    for (let m = 1; m < count; m++) {
      const mx = -width / 2 + m * mullionSpacing;
      const mBar = new THREE.Mesh(new THREE.BoxGeometry(frameThick * 0.8, height - frameThick, frameDepth * 0.8), frameMat);
      mBar.position.set(mx, 0, 0.02);
      winGroup.add(mBar);
    }
  }

  parent.add(winGroup);
  return winGroup;
}

// 2. Dàn Pin năng lượng mặt trời áp mái (Rooftop Photovoltaic Solar Arrays)
function createSolarPanelGrid(parent, cx, cy, cz, width, depth, tiltAngleX = 0.18) {
  const solarGroup = new THREE.Group();
  solarGroup.position.set(cx, cy, cz);

  const panelMat = new THREE.MeshStandardMaterial({
    color: 0x172554, // Xanh navy đậm óng ánh tinh thể silic
    roughness: 0.15,
    metalness: 0.85,
  });
  const aluFrameMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.3, metalness: 0.6 });

  const panelW = 1.6;
  const panelD = 2.4;
  const numX = Math.max(1, Math.floor(width / (panelW + 0.3)));
  const numZ = Math.max(1, Math.floor(depth / (panelD + 0.4)));

  const startX = -((numX - 1) * (panelW + 0.3)) / 2;
  const startZ = -((numZ - 1) * (panelD + 0.4)) / 2;

  for (let ix = 0; ix < numX; ix++) {
    for (let iz = 0; iz < numZ; iz++) {
      const px = startX + ix * (panelW + 0.3);
      const pz = startZ + iz * (panelD + 0.4);

      const onePanel = new THREE.Group();
      onePanel.position.set(px, 0.25, pz);
      onePanel.rotation.x = tiltAngleX; // Nghiêng đón nắng hướng Nam

      // Khung nhôm
      const frame = new THREE.Mesh(new THREE.BoxGeometry(panelW, 0.06, panelD), aluFrameMat);
      frame.castShadow = true;
      onePanel.add(frame);

      // Mặt tế bào quang điện
      const cell = new THREE.Mesh(new THREE.PlaneGeometry(panelW - 0.1, panelD - 0.1), panelMat);
      cell.rotation.x = -Math.PI / 2;
      cell.position.y = 0.035;
      onePanel.add(cell);

      // Chân giá đỡ thép
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.35, 0.06), aluFrameMat);
      leg.position.set(0, -0.15, -panelD / 2 + 0.2);
      onePanel.add(leg);

      solarGroup.add(onePanel);
    }
  }

  parent.add(solarGroup);
  return solarGroup;
}

// 3. Ống thoát nước mưa công nghiệp (Rainwater Downspouts)
function createRainwaterDownspouts(parent, width, height, depth, color = 0x64748b) {
  const pipeMat = new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.4 });
  const hopperMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4 });

  const corners = [
    { x: width / 2 + 0.12, z: depth / 2 + 0.12 },
    { x: -width / 2 - 0.12, z: depth / 2 + 0.12 },
    { x: width / 2 + 0.12, z: -depth / 2 - 0.12 },
    { x: -width / 2 - 0.12, z: -depth / 2 - 0.12 },
  ];

  corners.forEach((c) => {
    // Phễu thu nước máng xối trên mái
    const hopper = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.45, 5), hopperMat);
    hopper.position.set(c.x, height - 0.2, c.z);
    parent.add(hopper);

    // Ống đứng xả nước
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, height - 0.6, 6), pipeMat);
    pipe.position.set(c.x, (height - 0.6) / 2, c.z);
    pipe.castShadow = true;
    parent.add(pipe);

    // Cút cong xả ra rãnh thoát nước ở chân tường
    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.3), pipeMat);
    boot.position.set(c.x, 0.1, c.z + (c.z > 0 ? 0.12 : -0.12));
    parent.add(boot);
  });
}

// 4. Thang thoát hiểm thép ngoài trời (External Steel Fire Escape Stairs)
function createFireEscapeStairs(parent, x, z, totalHeight, numStories, color = 0x334155) {
  const stairGroup = new THREE.Group();
  stairGroup.position.set(x, 0, z);

  const steelMat = new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.5 });
  const railMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.4 });

  const storyHeight = totalHeight / numStories;
  const platformW = 2.4;
  const platformD = 1.6;

  // 4 Cột giàn thép chính chạy từ đất lên nóc
  [[-platformW / 2 + 0.1, -platformD / 2 + 0.1],
   [platformW / 2 - 0.1, -platformD / 2 + 0.1],
   [-platformW / 2 + 0.1, platformD / 2 - 0.1],
   [platformW / 2 - 0.1, platformD / 2 - 0.1]].forEach(([cx, cz]) => {
    const col = new THREE.Mesh(new THREE.BoxGeometry(0.1, totalHeight, 0.1), steelMat);
    col.position.set(cx, totalHeight / 2, cz);
    col.castShadow = true;
    stairGroup.add(col);
  });

  // Các chiếu nghỉ & đợt thang zíc zắc
  for (let s = 1; s <= numStories; s++) {
    const py = s * storyHeight;

    // Chiếu nghỉ mỗi tầng
    const platform = new THREE.Mesh(new THREE.BoxGeometry(platformW, 0.12, platformD), steelMat);
    platform.position.set(0, py, 0);
    platform.castShadow = true;
    stairGroup.add(platform);

    // Lan can an toàn quanh chiếu nghỉ
    const rail = new THREE.Mesh(new THREE.BoxGeometry(platformW, 0.9, platformD), railMat);
    rail.position.set(0, py + 0.45, 0);
    stairGroup.add(rail);

    // Vế thang nghiêng nối từ tầng dưới lên
    if (s <= numStories) {
      const flight = new THREE.Mesh(
        new THREE.BoxGeometry(0.75, 0.1, Math.hypot(storyHeight, platformD * 0.9)),
        steelMat
      );
      flight.position.set(0, py - storyHeight / 2, 0);
      flight.rotation.x = Math.atan2(storyHeight, platformD * 0.9);
      flight.castShadow = true;
      stairGroup.add(flight);
    }
  }

  parent.add(stairGroup);
  return stairGroup;
}

// ============================================================================
// 6. DK1: Buildings (Nâng cấp Khối 5)
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

  // 1. Thân xưởng chính - Tường xám công nghiệp (Wall: Slate Gray 0x475569)
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(cfg.width, cfg.height - 1.5, cfg.depth),
    new THREE.MeshStandardMaterial({ color: cfg.wallColor, roughness: 0.65, metalness: 0.2 })
  );
  body.position.y = (cfg.height + 1.5) / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // 2. Chân tường bệ bê tông trắng kem chống bám bẩn (Base Wall: 0xf1f5f9)
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(cfg.width + 0.15, 1.5, cfg.depth + 0.15),
    new THREE.MeshStandardMaterial({ color: cfg.baseWallColor, roughness: 0.7 })
  );
  base.position.y = 0.75;
  base.castShadow = true;
  group.add(base);

  // 3. Mái xưởng chính màu xám đậm (Roof: Dark Slate 0x1e293b)
  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(cfg.width + 0.8, 0.8, cfg.depth + 0.8),
    new THREE.MeshStandardMaterial({ color: cfg.roofColor, roughness: 0.5 })
  );
  roof.position.y = cfg.height + 0.4;
  roof.castShadow = true;
  group.add(roof);

  // 4. Gờ mái nhô ra sắc nét (Roof Fascia / Parapet Coping)
  const cornice = new THREE.Mesh(
    new THREE.BoxGeometry(cfg.width + 1.2, 0.35, cfg.depth + 1.2),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4 })
  );
  cornice.position.y = cfg.height + 0.85;
  cornice.castShadow = true;
  group.add(cornice);

  // 5. Nóc thông gió & lấy sáng (Monitor Roof)
  const monCfg = cfg.monitorRoof;
  const monitor = new THREE.Mesh(
    new THREE.BoxGeometry(monCfg.width, monCfg.height, monCfg.depth),
    new THREE.MeshStandardMaterial({ color: monCfg.color, roughness: 0.5 })
  );
  monitor.position.y = cfg.height + 0.8 + monCfg.height / 2;
  monitor.castShadow = true;
  group.add(monitor);

  // Quạt hút thông gió xoay tròn trên nóc (Roof Ventilators)
  for (let vz = -10; vz <= 10; vz += 5.0) {
    const vent = new THREE.Mesh(
      new THREE.CylinderGeometry(0.55, 0.65, 0.6, 8),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.35, metalness: 0.6 })
    );
    vent.position.set(0, cfg.height + 0.8 + monCfg.height + 0.3, vz);
    group.add(vent);
    roofVentilators.push(vent);
  }

  // 6. Tấm lấy sáng mái (Polycarbonate Skylights)
  const skylightMat = new THREE.MeshStandardMaterial({
    color: 0xdbeafe,
    roughness: 0.2,
    transparent: true,
    opacity: 0.72,
  });
  [-4.8, 4.8].forEach((sx) => {
    const skylight = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.15, monCfg.depth - 2), skylightMat);
    skylight.position.set(sx, cfg.height + 0.88, 0);
    group.add(skylight);
  });

  // 7. Hệ thống Pin mặt trời trên mái xưởng B (Photovoltaic Solar Arrays)
  createSolarPanelGrid(group, -7.5, cfg.height + 0.9, 0, 5.5, 24, 0.15);
  createSolarPanelGrid(group, 7.5, cfg.height + 0.9, 0, 5.5, 24, 0.15);

  // 8. Nhiều dãy cửa sổ công nghiệp có đố kính (Multi-pane window strips with mullions)
  const windowMat = new THREE.MeshStandardMaterial({ color: 0x93c5fd, roughness: 0.1, metalness: 0.8 });
  windowLights.push(windowMat);

  for (let story = 1; story <= 3; story++) {
    const winHeight = 1.1;
    const winY = 1.6 + (story - 0.5) * 3.8;

    // Mặt Nam (Front quay ra sân giao nhận)
    createWindowStripWithMullions(group, 0, winY, cfg.depth / 2 + 0.05, cfg.width - 4, winHeight, 0, 2.2, windowMat);

    // Mặt Đông (East - hướng đường chạy thử)
    createWindowStripWithMullions(group, cfg.width / 2 + 0.05, winY, 0, cfg.depth - 4, winHeight, Math.PI / 2, 2.4, windowMat);

    // Mặt Bắc (North - phía sau)
    createWindowStripWithMullions(group, 0, winY, -cfg.depth / 2 - 0.05, cfg.width - 6, winHeight, Math.PI, 2.2, windowMat);

    // Mặt Tây (West - phía Nhà C)
    createWindowStripWithMullions(group, -cfg.width / 2 - 0.05, winY, 0, cfg.depth - 6, winHeight, -Math.PI / 2, 2.4, windowMat);
  }

  // 9. 2 Cửa cuốn công nghiệp Xưởng B (Door B1, B2)
  createShutterDoor(group, -5.5, 0, cfg.depth / 2 + 0.08, 5.4, 4.0, 'doorB1', 'Cửa cuốn chính Xưởng B');
  createShutterDoor(group, 5.5, 0, cfg.depth / 2 + 0.08, 5.0, 4.0, 'doorB2', 'Cửa xuất nhập hàng Xưởng B');

  // 10. Ống thoát nước mưa 4 góc tường (Rainwater Downspouts)
  createRainwaterDownspouts(group, cfg.width, cfg.height, cfg.depth, 0x64748b);

  // 11. Thang thoát hiểm ngoài trời bằng thép (External Steel Fire Escape) ở mặt Bắc
  createFireEscapeStairs(group, -cfg.width / 2 + 4.5, -cfg.depth / 2 - 1.0, cfg.height, 3, 0x334155);

  // 12. Cụm điều hòa công nghiệp HVAC / Chiller trên mái
  const chillerMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.4 });
  const chiller = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.2, 1.8), chillerMat);
  chiller.position.set(-6.5, cfg.height + 1.4, -12);
  chiller.castShadow = true;
  group.add(chiller);

  // 13. Logo Badge "DK Bike" vàng cam nổi bật
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

  // 1. Thân văn phòng Nhà A - Tường xám xanh thanh lịch (Wall: 0x64748b)
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(cfg.width, cfg.height, cfg.depth),
    new THREE.MeshStandardMaterial({ color: cfg.wallColor, roughness: 0.65, metalness: 0.15 })
  );
  body.position.y = cfg.height / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // 2. Chân tường trắng kem (Base Wall: 0xf1f5f9)
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(cfg.width + 0.1, 1.2, cfg.depth + 0.1),
    new THREE.MeshStandardMaterial({ color: cfg.baseWallColor, roughness: 0.7 })
  );
  base.position.y = 0.6;
  base.castShadow = true;
  group.add(base);

  // 3. Mái bằng có gờ tường chắn nước (Roof Parapet)
  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(cfg.width + 0.6, 0.8, cfg.depth + 0.6),
    new THREE.MeshStandardMaterial({ color: cfg.roofColor, roughness: 0.4 })
  );
  roof.position.y = cfg.height + 0.4;
  roof.castShadow = true;
  group.add(roof);

  const parapetCap = new THREE.Mesh(
    new THREE.BoxGeometry(cfg.width + 0.8, 0.25, cfg.depth + 0.8),
    new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.3 })
  );
  parapetCap.position.y = cfg.height + 0.9;
  group.add(parapetCap);

  // 4. Pin mặt trời trên mái Nhà A (Photovoltaic Solar Arrays)
  createSolarPanelGrid(group, 0, cfg.height + 0.95, 0, cfg.width - 6, cfg.depth - 4, 0.15);

  // 5. Nhiều dãy cửa sổ văn phòng hiện đại (Continuous ribbon windows with mullions)
  const winMat = new THREE.MeshStandardMaterial({ color: 0xbae6fd, roughness: 0.1, metalness: 0.7 });
  windowLights.push(winMat);

  for (let story = 1; story <= 3; story++) {
    const winY = (story - 0.4) * 3.4;
    // Mặt Nam (Mặt tiền sảnh chính)
    createWindowStripWithMullions(group, 0, winY, cfg.depth / 2 + 0.05, cfg.width - 4, 1.3, 0, 2.5, winMat);
    // Mặt Bắc (Mặt sau)
    createWindowStripWithMullions(group, 0, winY, -cfg.depth / 2 - 0.05, cfg.width - 4, 1.3, Math.PI, 2.5, winMat);
  }

  // 6. Sảnh đón chính tầng 1 (Main Entrance Lobby & Canopy)
  const canopyMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3, metalness: 0.5 });
  const entranceCanopy = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.22, 2.8), canopyMat);
  entranceCanopy.position.set(0, 3.6, cfg.depth / 2 + 1.4);
  entranceCanopy.castShadow = true;
  group.add(entranceCanopy);

  // Cửa kính thủy lực sảnh đón
  const glassDoorMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.1, metalness: 0.9, transparent: true, opacity: 0.8 });
  const entranceDoor = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 2.8), glassDoorMat);
  entranceDoor.position.set(0, 1.4, cfg.depth / 2 + 0.08);
  group.add(entranceDoor);

  // Bậc tam cấp sảnh vào
  const steps = new THREE.Mesh(
    new THREE.BoxGeometry(7.5, 0.35, 1.8),
    new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.8 })
  );
  steps.position.set(0, 0.17, cfg.depth / 2 + 0.9);
  group.add(steps);

  // 7. Thang thoát hiểm thép màu xanh dương (External Blue Fire Escape) ở đầu hồi phía Tây
  createFireEscapeStairs(group, -cfg.width / 2 - 1.2, 0, cfg.height, 3, cfg.stairColor);

  // 8. Ống thoát nước mưa (Rainwater downspouts)
  createRainwaterDownspouts(group, cfg.width, cfg.height, cfg.depth, 0x94a3b8);

  // 9. Cầu vượt nối Nhà A sang Nhà B (Skybridge kết nối tầng 2)
  const walkwayGroup = new THREE.Group();
  walkwayGroup.position.set(cfg.width / 2 + 4.0, 5.0, 0);

  const bridgeBody = new THREE.Mesh(
    new THREE.BoxGeometry(8.0, 3.2, 3.2),
    new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.5 })
  );
  bridgeBody.castShadow = true;
  walkwayGroup.add(bridgeBody);

  // Cửa kính lấy sáng 2 bên cầu vượt
  const bridgeGlass = new THREE.Mesh(new THREE.BoxGeometry(7.6, 1.6, 3.28), winMat);
  bridgeGlass.position.y = 0.2;
  walkwayGroup.add(bridgeGlass);

  group.add(walkwayGroup);

  scene.add(group);
  buildingMeshes.push(body);
}

function buildNhaC() {
  const cfg = CONFIG.BUILDINGS.nhaC;
  const group = new THREE.Group();
  group.position.set(cfg.position.x, 0, cfg.position.z);
  group.userData = { id: 'nhaC', config: cfg };

  // 1. Thân nhà kho & xưởng phụ C - Tường xám (Wall: 0x64748b)
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(cfg.width, cfg.height, cfg.depth),
    new THREE.MeshStandardMaterial({ color: cfg.wallColor, roughness: 0.7 })
  );
  body.position.y = cfg.height / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // 2. Mái tôn xanh dương công nghiệp chuẩn ảnh drone (Cobalt Industrial Blue 0x0284c7)
  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(cfg.width + 0.8, 0.6, cfg.depth + 0.8),
    new THREE.MeshStandardMaterial({ color: cfg.roofColor, roughness: 0.45, metalness: 0.3 })
  );
  roof.position.y = cfg.height + 0.3;
  roof.castShadow = true;
  group.add(roof);

  // Gờ nóc mái tôn (Roof Ridge Cap)
  const ridge = new THREE.Mesh(
    new THREE.BoxGeometry(cfg.width + 0.9, 0.25, 0.4),
    new THREE.MeshStandardMaterial({ color: 0x0369a1, roughness: 0.4 })
  );
  ridge.position.y = cfg.height + 0.65;
  group.add(ridge);

  // 3. Tấm tôn lấy sáng trắng ngà trên mái (Skylight Strip)
  const skylight = new THREE.Mesh(
    new THREE.BoxGeometry(cfg.width - 2.0, 0.1, 1.8),
    new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.2, transparent: true, opacity: 0.75 })
  );
  skylight.position.set(0, cfg.height + 0.62, 2.0);
  group.add(skylight);

  // 4. Pin mặt trời trên mái Nhà C (Photovoltaic Solar Arrays)
  createSolarPanelGrid(group, 0, cfg.height + 0.65, -2.0, cfg.width - 3, 4.5, 0.15);

  // 5. Cửa cuốn bốc dỡ hàng hóa tầng trệt (Roller Shutter Door)
  const doorFrameMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 });
  const doorShutterMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.4, metalness: 0.5 });

  const cDoor = new THREE.Mesh(new THREE.BoxGeometry(4.2, 3.6, 0.12), doorShutterMat);
  cDoor.position.set(0, 1.8, cfg.depth / 2 + 0.06);
  cDoor.castShadow = true;
  group.add(cDoor);

  const cDoorFrame = new THREE.Mesh(new THREE.BoxGeometry(4.6, 3.9, 0.18), doorFrameMat);
  cDoorFrame.position.set(0, 1.95, cfg.depth / 2 + 0.05);
  group.add(cDoorFrame);

  // 6. Dãy cửa sổ thông gió lấy sáng
  const winMat = new THREE.MeshStandardMaterial({ color: 0x93c5fd, roughness: 0.1, metalness: 0.8 });
  windowLights.push(winMat);
  createWindowStripWithMullions(group, 0, 4.8, cfg.depth / 2 + 0.05, cfg.width - 3, 0.8, 0, 1.8, winMat);
  createWindowStripWithMullions(group, 0, 4.8, -cfg.depth / 2 - 0.05, cfg.width - 3, 0.8, Math.PI, 1.8, winMat);

  // 7. Ống thoát nước mưa (Downspouts)
  createRainwaterDownspouts(group, cfg.width, cfg.height, cfg.depth, 0x0284c7);

  scene.add(group);
  buildingMeshes.push(body);
}

function buildNhaAn() {
  const cfg = CONFIG.BUILDINGS.nhaAn;
  const group = new THREE.Group();
  group.position.set(cfg.position.x, 0, cfg.position.z);
  group.userData = { id: 'nhaAn', config: cfg };

  // 1. Thân nhà ăn CBNV - Tường xám sáng / trắng kem
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(cfg.width, cfg.height, cfg.depth),
    new THREE.MeshStandardMaterial({ color: cfg.wallColor, roughness: 0.7 })
  );
  body.position.y = cfg.height / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // Chân tường sạch sẽ
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(cfg.width + 0.1, 1.2, cfg.depth + 0.1),
    new THREE.MeshStandardMaterial({ color: cfg.baseWallColor, roughness: 0.7 })
  );
  base.position.y = 0.6;
  group.add(base);

  // 2. Mái ngói dốc 4 mái màu đỏ tươi (Hip Roof Red 0xef4444)
  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(cfg.width * 0.72, 3.8, 4),
    new THREE.MeshStandardMaterial({ color: cfg.roofColor, roughness: 0.55, flatShading: true })
  );
  roof.position.y = cfg.height + 1.9;
  roof.rotation.y = Math.PI / 4;
  roof.scale.set(1.0, 1.0, (cfg.depth / cfg.width) * 1.5);
  roof.castShadow = true;
  group.add(roof);

  // Gờ máng xối chân mái ngói
  const gutterMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.6 });
  const gutter = new THREE.Mesh(new THREE.BoxGeometry(cfg.width + 0.8, 0.25, cfg.depth + 0.8), gutterMat);
  gutter.position.y = cfg.height + 0.15;
  group.add(gutter);

  // 3. Nhiều dãy cửa sổ kính đón nắng rộng thoáng
  const winMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.1, metalness: 0.3 }); // Ánh đèn nhà ăn ấm cúng
  windowLights.push(winMat);

  for (let story = 1; story <= 2; story++) {
    const winY = (story - 0.4) * 4.2;
    // Mặt Nam (Mặt tiền quay ra đường)
    createWindowStripWithMullions(group, 0, winY, cfg.depth / 2 + 0.05, cfg.width - 4, 1.6, 0, 2.2, winMat);
    // Mặt Tây
    createWindowStripWithMullions(group, -cfg.width / 2 - 0.05, winY, 0, cfg.depth - 3, 1.6, -Math.PI / 2, 2.2, winMat);
  }

  // 4. Sảnh đón có mái hiên che nắng mưa và bậc tam cấp
  const porchRoof = new THREE.Mesh(
    new THREE.BoxGeometry(4.8, 0.2, 2.2),
    new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.5 })
  );
  porchRoof.position.set(0, 3.2, cfg.depth / 2 + 1.1);
  porchRoof.castShadow = true;
  group.add(porchRoof);

  const steps = new THREE.Mesh(
    new THREE.BoxGeometry(5.2, 0.3, 1.4),
    new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.8 })
  );
  steps.position.set(0, 0.15, cfg.depth / 2 + 0.7);
  group.add(steps);

  // 5. Ống thoát nước mưa
  createRainwaterDownspouts(group, cfg.width, cfg.height, cfg.depth, 0xb91c1c);

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
    new THREE.BoxGeometry(cfg.width + 0.6, 0.4, cfg.depth + 0.6),
    new THREE.MeshStandardMaterial({ color: cfg.roofColor, roughness: 0.4 })
  );
  roof.position.y = cfg.height + 0.2;
  group.add(roof);

  // Cửa sổ kính quan sát an ninh 3 mặt
  const winMat = new THREE.MeshStandardMaterial({ color: 0x93c5fd, roughness: 0.1, metalness: 0.7 });
  [-cfg.depth / 2 - 0.02, cfg.depth / 2 + 0.02].forEach((wz) => {
    const w = new THREE.Mesh(new THREE.PlaneGeometry(cfg.width - 1.2, 1.2), winMat);
    w.position.set(0, 1.6, wz);
    if (wz < 0) w.rotation.y = Math.PI;
    group.add(w);
  });

  scene.add(group);
  buildingMeshes.push(body);
}

function buildCanopyAndBikes() {
  const cfg = CONFIG.BUILDINGS.maiCheXe;
  const group = new THREE.Group();
  group.position.set(cfg.position.x, 0, cfg.position.z);
  group.userData = { id: 'maiCheXe', config: cfg };

  // Khung thép hộp sơn tĩnh điện màu xám đen (Frame: 0x1e293b)
  const postGeo = new THREE.CylinderGeometry(0.1, 0.1, cfg.height, 8);
  const frameMat = new THREE.MeshStandardMaterial({ color: cfg.frameColor, roughness: 0.4, metalness: 0.6 });

  for (let z = -cfg.depth / 2 + 1.5; z <= cfg.depth / 2 - 1.5; z += 4.5) {
    [-cfg.width / 2 + 0.35, cfg.width / 2 - 0.35].forEach((px) => {
      const post = new THREE.Mesh(postGeo, frameMat);
      post.position.set(px, cfg.height / 2, z);
      post.castShadow = true;
      group.add(post);
    });

    // Thanh xà vòm ngang cong nối 2 cột
    const crossBeam = new THREE.Mesh(new THREE.BoxGeometry(cfg.width, 0.12, 0.15), frameMat);
    crossBeam.position.set(0, cfg.height + 0.1, z);
    crossBeam.castShadow = true;
    group.add(crossBeam);
  }

  // Mái che polycarbonate màu xanh trong suốt chuẩn ảnh drone (Canopy: Blue/Cyan Translucent)
  const canopyMat = new THREE.MeshStandardMaterial({
    color: cfg.canopyColor, // 0x06b6d4
    roughness: 0.15,
    metalness: 0.1,
    transparent: true,
    opacity: cfg.opacity, // 0.7
  });

  const canopyRoof = new THREE.Mesh(
    new THREE.BoxGeometry(cfg.width + 0.4, 0.15, cfg.depth),
    canopyMat
  );
  canopyRoof.position.y = cfg.height + 0.18;
  canopyRoof.castShadow = true;
  group.add(canopyRoof);

  // Xe điện 3 bánh chở hàng DK Bike chi tiết đỗ ngay ngắn dưới mái che (Khối 8)
  const cargoColors = [0x0284c7, 0xef4444, 0x10b981, 0xf59e0b, 0x6366f1, 0x0284c7, 0xdc2626];
  let cIdx = 0;
  for (let z = -cfg.depth / 2 + 2.5; z <= cfg.depth / 2 - 2.5; z += 3.6) {
    const bColor = cargoColors[cIdx % cargoColors.length];
    const cargo3w = createDKThreeWheelerCargo(bColor, `Xe 3 bánh DK #${cIdx + 1}`);
    cargo3w.position.set(0, 0, z);
    cargo3w.rotation.y = Math.PI / 2;
    cargo3w.scale.set(0.85, 0.85, 0.85);
    group.add(cargo3w);
    cIdx++;
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

  // Koi Pond (Hồ cá Koi cảnh quan - Bố trí khoảng cách chuẩn không lấn đường nhựa và không lấn nhà)
  const koiBed = new THREE.Mesh(
    new THREE.BoxGeometry(5.4, 0.6, 8.0),
    new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.8 })
  );
  koiBed.position.set(cfg.width / 2 + 3.8, 0.3, 0);
  group.add(koiBed);

  waterKoiMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(4.8, 7.4),
    createStylizedWaterMaterial(false)
  );
  waterKoiMesh.rotation.x = -Math.PI / 2;
  waterKoiMesh.position.set(cfg.width / 2 + 3.8, 0.55, 0);
  group.add(waterKoiMesh);

  // Đàn cá Koi bơi lội trong hồ nước
  buildKoiFish(group, cfg.width / 2 + 3.8, 0.45, 0);

  // Ghế đá công viên & Chậu cây cảnh bên hồ cá Koi
  buildPondAmenities(group, cfg.width / 2 + 3.8, 0);

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
  // Ghế đá công viên (Bố trí gọn gàng sát thành hồ cá)
  [-2.2, 2.2].forEach((gx) => {
    const bench = new THREE.Group();
    bench.position.set(pondX + gx, 0, pondZ - 2.8);
    bench.rotation.y = gx > 0 ? -Math.PI / 4 : Math.PI / 4;

    const seat = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 0.12, 0.45),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.8 })
    );
    seat.position.y = 0.45;
    bench.add(seat);

    const leg1 = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.45, 0.4), new THREE.MeshStandardMaterial({ color: 0x475569 }));
    leg1.position.set(-0.5, 0.22, 0);
    bench.add(leg1);

    const leg2 = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.45, 0.4), new THREE.MeshStandardMaterial({ color: 0x475569 }));
    leg2.position.set(0.5, 0.22, 0);
    bench.add(leg2);

    parentGroup.add(bench);
  });

  // Chậu cây cảnh Bon sai gọn gàng
  [pondZ + 3.2, pondZ - 3.2].forEach((pz) => {
    const pot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.45, 0.3, 0.55, 8),
      new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.7 })
    );
    pot.position.set(pondX + 2.4, 0.28, pz);
    parentGroup.add(pot);

    const bush = new THREE.Mesh(
      new THREE.SphereGeometry(0.55, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.8, flatShading: true })
    );
    bush.position.set(pondX + 2.4, 0.8, pz);
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
  group.userData = {
    id: 'xuongDK2',
    config: cfg,
    title: 'Sân kiểm định & Xe thành phẩm DK2',
    type: 'yard',
    desc: 'Sân bê tông rộng 88m × 22m mở rộng từ việc chuyển đổi nhà xưởng cũ, phục vụ bãi kiểm định chất lượng KCS, chạy thử xe và tập kết các lô xe máy điện DK Bike trước khi xuất kho.',
    zone: 'DK2',
  };

  // 1. Paved concrete surface slab with expansion joints
  const yardGeo = new THREE.PlaneGeometry(cfg.width, cfg.depth);
  const yardMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.85 });
  const yard = new THREE.Mesh(yardGeo, yardMat);
  yard.rotation.x = -Math.PI / 2;
  yard.position.y = 0.04;
  yard.receiveShadow = true;
  group.add(yard);

  // Concrete grid expansion joints
  const lineMat = new THREE.MeshBasicMaterial({ color: 0x64748b });
  for (let lx = -cfg.width / 2 + 8; lx < cfg.width / 2; lx += 11) {
    const joint = new THREE.Mesh(new THREE.PlaneGeometry(0.08, cfg.depth), lineMat);
    joint.rotation.x = -Math.PI / 2;
    joint.position.set(lx, 0.045, 0);
    group.add(joint);
  }

  // 2. Painted logistics markings: yellow borders, diagonal test tracks, parking bays
  const yellowPaintMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
  const whitePaintMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });

  // Border lines
  const borderTop = new THREE.Mesh(new THREE.PlaneGeometry(cfg.width - 2, 0.2), yellowPaintMat);
  borderTop.rotation.x = -Math.PI / 2;
  borderTop.position.set(0, 0.05, -cfg.depth / 2 + 1);
  group.add(borderTop);

  const borderBot = new THREE.Mesh(new THREE.PlaneGeometry(cfg.width - 2, 0.2), yellowPaintMat);
  borderBot.rotation.x = -Math.PI / 2;
  borderBot.position.set(0, 0.05, cfg.depth / 2 - 1);
  group.add(borderBot);

  // Speed / brake testing lane (Làn kiểm định tốc độ & phanh)
  const testTrackGreen = new THREE.Mesh(
    new THREE.PlaneGeometry(cfg.width - 4, 3.2),
    new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.7 })
  );
  testTrackGreen.rotation.x = -Math.PI / 2;
  testTrackGreen.position.set(0, 0.046, -6.5);
  group.add(testTrackGreen);

  // Center dashed line for test lane
  for (let dx = -cfg.width / 2 + 4; dx < cfg.width / 2 - 4; dx += 4) {
    const dash = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 0.15), whitePaintMat);
    dash.rotation.x = -Math.PI / 2;
    dash.position.set(dx, 0.052, -6.5);
    group.add(dash);
  }

  // Finished vehicle diagonal parking bays & parked DK Bikes
  const bikeColors = [0xffb703, 0xef4444, 0x06b6d4, 0x10b981, 0x6366f1, 0xf1f5f9, 0x1e293b, 0xf97316];
  for (let slot = 0; slot < 26; slot++) {
    const sx = -cfg.width / 2 + 6 + slot * 3.0;
    const sz = 2.0;

    // White parking divider line
    const slotLine = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 4.0), whitePaintMat);
    slotLine.rotation.x = -Math.PI / 2;
    slotLine.position.set(sx - 1.3, 0.05, sz);
    group.add(slotLine);

    // Park a DK Bike in each bay
    const bColor = bikeColors[slot % bikeColors.length];
    const parkedBike = createDetailedDKBike(bColor, `DK Bike Thành Phẩm Lô #${slot + 1}`);
    parkedBike.position.set(sx, 0.05, sz);
    parkedBike.rotation.y = Math.PI / 2;
    group.add(parkedBike);
  }

  // Second row of parked bikes (DK Creer E & DK Xman)
  for (let slot = 0; slot < 18; slot++) {
    const sx = -cfg.width / 2 + 10 + slot * 4.0;
    const sz = 7.5;
    const bColor = bikeColors[(slot + 3) % bikeColors.length];
    const parkedBike = createDetailedDKBike(bColor, `DK Creer E Xuất Xưởng #${slot + 1}`);
    parkedBike.position.set(sx, 0.05, sz);
    parkedBike.rotation.y = Math.PI / 2;
    group.add(parkedBike);
  }

  // 4 corner industrial LED floodlight poles
  [
    { x: -cfg.width / 2 + 2, z: -cfg.depth / 2 + 2 },
    { x: cfg.width / 2 - 2, z: -cfg.depth / 2 + 2 },
    { x: -cfg.width / 2 + 2, z: cfg.depth / 2 - 2 },
    { x: cfg.width / 2 - 2, z: cfg.depth / 2 - 2 },
  ].forEach((lp) => {
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.18, 6.0, 6),
      new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.6 })
    );
    pole.position.set(lp.x, 3.0, lp.z);
    pole.castShadow = true;
    group.add(pole);

    const headLight = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.35, 0.5),
      new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xfef08a, emissiveIntensity: 0.3 })
    );
    headLight.position.set(lp.x, 6.1, lp.z);
    headLight.rotation.x = Math.PI / 6;
    group.add(headLight);
  });

  scene.add(group);
  interactiveObjects.push(group);
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
  // 1. Đồi chính DK2 (Đỉnh cao phía Bắc)
  const hillCfg = CONFIG.HILLS.dk2;
  const hill = new THREE.Mesh(
    new THREE.ConeGeometry(hillCfg.radius, hillCfg.height, 11),
    new THREE.MeshStandardMaterial({ color: hillCfg.color, roughness: 0.9, flatShading: true })
  );
  hill.position.set(hillCfg.position.x, hillCfg.height / 2 - 2, hillCfg.position.z);
  hill.receiveShadow = true;
  scene.add(hill);

  // 2. Đồi mới sinh thái (To hơn đồi chính, đỉnh phẳng rộng lớn để đi dạo, trồng hoa và nuôi chim gà)
  if (CONFIG.HILLS.dk2NewHill) {
    const nhCfg = CONFIG.HILLS.dk2NewHill;
    const flatR = nhCfg.flatRadius || 24;
    const baseR = nhCfg.radius || 66;
    const h = nhCfg.height || 18.5;
    const newHill = new THREE.Mesh(
      new THREE.CylinderGeometry(flatR, baseR, h, 20),
      new THREE.MeshStandardMaterial({ color: nhCfg.color, roughness: 0.9, flatShading: true })
    );
    newHill.position.set(nhCfg.position.x, h / 2 - 0.2, nhCfg.position.z);
    newHill.receiveShadow = true;
    scene.add(newHill);
  }

  // Terraced stone walls bám quanh sườn đồi
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

  // Tuyến đường mòn sinh thái DK2: Cuối sân -> Vườn Lan -> Ao cá -> Đồi chuồng gà
  buildDK2EcoTrail();

  // Orchid Greenhouse (Đã dịch chuyển theo mũi tên)
  buildVuonLanDK2();

  // Hillside Eco-Fish Pond (Đã dịch chuyển lên cạnh Vườn Lan)
  buildDK2HillPond();

  // Free-Range Hillside Chickens (Đã dịch chuyển sang Đồi mới)
  buildFreeRangeChickens();
}

// ============================================================================
// Tuyến đường mòn sinh thái DK2: Cuối sân -> Vườn Lan -> Ao cá -> Đồi chuồng gà (Mục 6)
// ============================================================================
function buildDK2EcoTrail() {
  const trailGroup = new THREE.Group();

  // 12 điểm uốn lượn tự nhiên theo địa hình kết nối liên hoàn: Sân DK2 -> Vườn Lan -> Ao Cá -> Đỉnh đồi phẳng
  const trailPoints = [
    new THREE.Vector3(-92, 0.2, -48),    // 1. Chân đồi / Cuối sân xe thành phẩm DK2
    new THREE.Vector3(-96, 3.8, -58),    // 2. Leo dốc thoai thoải
    new THREE.Vector3(-101, 7.8, -68),   // 3. Sườn dốc xanh
    new THREE.Vector3(-105, 12.0, -78),  // 4. Lưng chừng đỉnh đồi
    new THREE.Vector3(-108, 15.6, -88),  // 5. Đến sảnh Vườn Lan trên đồi
    new THREE.Vector3(-118, 16.6, -84),  // 6. Lối dạo sỏi nối Vườn Lan qua Ao Cá
    new THREE.Vector3(-126, 17.2, -78),  // 7. Đến bờ Ao Cá đồi sinh thái & sàn gỗ
    new THREE.Vector3(-134, 17.6, -64),  // 8. Uốn qua yên ngựa sườn núi
    new THREE.Vector3(-140, 18.2, -50),  // 9. Lên đồi mới sinh thái
    new THREE.Vector3(-145, 18.5, -42),  // 10. Chạm đỉnh đồi phẳng rộng lớn (+18.5m)
    new THREE.Vector3(-142, 15.5, -34),  // 11. Đường dạo qua thảm hoa rực rỡ
    new THREE.Vector3(-153, 18.5, -28),  // 12. Vòng qua tháp bồ câu & chuồng gà đồi
  ];

  const trailCurve = new THREE.CatmullRomCurve3(trailPoints);

  // Thân đường mòn lát sỏi dăm & đá phiến tự nhiên (Rustic Stone/Gravel Path)
  const trailGeo = new THREE.TubeGeometry(trailCurve, 140, 1.25, 4, false);
  const trailMat = new THREE.MeshStandardMaterial({
    color: 0xd6d3d1, // Đá phiến xám sáng tự nhiên
    roughness: 0.92,
    flatShading: true,
  });
  const trailMesh = new THREE.Mesh(trailGeo, trailMat);
  trailMesh.scale.set(1.0, 0.16, 1.0); // Dẹt phẳng như mặt đường mòn thực tế
  trailMesh.receiveShadow = true;
  trailGroup.add(trailMesh);

  // Bờ viền cọc gỗ Rustic & Cọc đèn solar dẫn đường ban đêm
  const stakeMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.85 });
  const lanternMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
  const sampleCount = 42;

  for (let s = 0; s <= sampleCount; s++) {
    const t = s / sampleCount;
    const pt = trailCurve.getPointAt(t);
    const tan = trailCurve.getTangentAt(t);
    const norm = new THREE.Vector3(-tan.z, 0, tan.x).normalize();

    // Cọc đèn thấp năng lượng mặt trời dẫn đường ban đêm mỗi 3 nhịp
    if (s % 3 === 0) {
      const lampPos = pt.clone().add(norm.clone().multiplyScalar(1.5));
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.65, 5), stakeMat);
      post.position.set(lampPos.x, lampPos.y + 0.32, lampPos.z);
      trailGroup.add(post);

      const lampHead = new THREE.Mesh(new THREE.DodecahedronGeometry(0.12), lanternMat);
      lampHead.position.set(lampPos.x, lampPos.y + 0.65, lampPos.z);
      trailGroup.add(lampHead);
    }
  }

  // 4 Biển chỉ dẫn sinh thái bằng gỗ (Directional Trail Signposts)
  const signLocations = [
    { pt: new THREE.Vector3(-92, 0.2, -46), rotY: 0 },
    { pt: new THREE.Vector3(-110, 15.6, -85), rotY: Math.PI / 4 },
    { pt: new THREE.Vector3(-128, 17.2, -76), rotY: -Math.PI / 3 },
    { pt: new THREE.Vector3(-144, 18.5, -42), rotY: -Math.PI / 4 },
  ];

  signLocations.forEach((sg) => {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 1.4, 6), stakeMat);
    post.position.set(sg.pt.x, sg.pt.y + 0.7, sg.pt.z);
    post.castShadow = true;
    trailGroup.add(post);

    const board = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 0.45, 0.08),
      new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.8 })
    );
    board.position.set(sg.pt.x, sg.pt.y + 1.25, sg.pt.z);
    board.rotation.y = sg.rotY;
    board.castShadow = true;
    trailGroup.add(board);
  });

  scene.add(trailGroup);
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

  // Dãy xe máy điện DK Roma SX & Creer E thành phẩm chi tiết trên sân xuất xưởng (Khối 8)
  const bikePalette = [0xdc2626, 0x0284c7, 0xffb703, 0xf8fafc, 0x10b981, 0x1e293b];
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 6; col++) {
      const color = bikePalette[(row * 2 + col) % bikePalette.length];
      const isRoma = (row + col) % 2 === 0;
      const bike = isRoma
        ? createDKRomaSX(color, `DK Roma SX Lô #${row + 1}-${col + 1}`)
        : createDKCreerE(color, `DK Creer E Lô #${row + 1}-${col + 1}`);
      bike.position.set(yardCfg.position.x - 22 + col * 3.4, 0.05, yardCfg.position.z + 6 + row * 2.6);
      bike.rotation.y = Math.PI / 2;
      bike.scale.set(0.9, 0.9, 0.9);
      scene.add(bike);
    }
  }

  // Xe bán tải trắng DK Logistics đỗ tại sân kiểm định (như ảnh drone)
  const pickupDK2 = createDKPickupTruck(0xf8fafc, 'Xe bán tải DK Logistics #02');
  pickupDK2.position.set(yardCfg.position.x - 28, 0, yardCfg.position.z - 8);
  pickupDK2.rotation.y = 0;
  scene.add(pickupDK2);

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
// 10. Landscaping & Greenery: High-Density Forest, 4 Tree Types & Flora (Khối 2)
// ============================================================================

// Tạo vật liệu tán cây hỗ trợ hiệu ứng gió đung đưa qua Vertex Shader
function createWindFoliageMaterial(baseColorHex, roughness = 0.82) {
  const mat = new THREE.MeshStandardMaterial({
    color: baseColorHex,
    roughness: roughness,
    flatShading: true,
  });

  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uWindTime = windUniforms.uWindTime;
    shader.uniforms.uWindSpeed = { value: CONFIG.FOREST.wind.speed };
    shader.uniforms.uWindStrength = { value: CONFIG.FOREST.wind.strength };

    shader.vertexShader = `
      uniform float uWindTime;
      uniform float uWindSpeed;
      uniform float uWindStrength;
      ${shader.vertexShader}
    `;

    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
      #include <begin_vertex>
      // Chỉ ngọn và tán trên cao đung đưa theo gió, gốc cây bám chắc mặt đất
      float swayFactor = clamp(position.y / 2.6, 0.0, 1.0);
      float sway = sin(uWindTime * uWindSpeed + position.x * 0.16 + position.z * 0.16) * uWindStrength * swayFactor;
      transformed.x += sway;
      transformed.z += sway * 0.55;
      `
    );
  };

  return mat;
}

// Tạo hình cầu đa diện Icosahedron với đỉnh dịch chuyển ngẫu nhiên (Faceted Organic Low-Poly)
function createJitteredIcosahedron(radius, detail = 1, jitterAmount = 0.28) {
  const geo = new THREE.IcosahedronGeometry(radius, detail);
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();
  const normal = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    normal.copy(v).normalize();
    // Hash xác định theo tọa độ đỉnh
    const seed = Math.sin(v.x * 12.9898 + v.y * 78.233 + v.z * 37.719) * 43758.5453;
    const hash = seed - Math.floor(seed);
    v.addScaledVector(normal, (hash - 0.5) * jitterAmount * radius);
    pos.setXYZ(i, v.x, v.y, v.z);
  }

  geo.computeVertexNormals();
  return geo;
}

// Tạo hình cây thông 3 tầng nón xếp chồng + thân gỗ gộp chung (Compound Tiered Pine)
function createTieredPineGeometry() {
  const geos = [];

  // 3 tầng nón thuôn nhọn
  const tiers = [
    { radius: 1.65, height: 2.2, y: 1.8 },
    { radius: 1.25, height: 1.9, y: 3.0 },
    { radius: 0.85, height: 1.5, y: 4.0 },
  ];

  tiers.forEach((t) => {
    const cone = new THREE.ConeGeometry(t.radius, t.height, 5);
    cone.translate(0, t.y, 0);
    geos.push(cone);
  });

  // Thân cây thông
  const trunk = new THREE.CylinderGeometry(0.22, 0.35, 1.8, 5);
  trunk.translate(0, 0.9, 0);
  geos.push(trunk);

  const merged = BufferGeometryUtils.mergeGeometries(geos, false);
  merged.computeVertexNormals();
  return merged;
}

// Tính toán độ cao bề mặt địa hình tổng thể (Toàn bộ các đỉnh đồi, sườn dốc và thung lũng)
function getTerrainElevation(x, z) {
  let maxY = 0.1;

  // 1. Đồi DK2
  const dk2Y = getDK2HillSurfaceY(x, z);
  if (dk2Y > maxY) maxY = dk2Y;

  // 2. Các ngọn đồi phía Đông, Bắc và sau xưởng DK1
  const hillsData = [
    { x: 125, z: -80, radius: 52, apex: 24, base: -2 },
    { x: 142, z: -25, radius: 48, apex: 20, base: -2 },
    { x: 132, z: 38, radius: 45, apex: 18, base: -2 },
    { x: 55, z: -108, radius: 54, apex: 26, base: -2 }, // Đồi Cối xay gió
    { x: 45, z: -85, radius: 42, apex: 17, base: -2 },  // Đồi sau DK1
  ];

  for (let i = 0; i < hillsData.length; i++) {
    const h = hillsData[i];
    const dist = Math.hypot(x - h.x, z - h.z);
    if (dist < h.radius) {
      const hillY = h.base + (h.apex - h.base) * (1 - dist / h.radius);
      if (hillY > maxY) maxY = hillY;
    }
  }

  // 3. Khe suối / Lòng sông máng nước
  if (x > 84 && x < 97 && z > -110 && z < 70) {
    const distFromCenter = Math.abs(x - 90);
    if (distFromCenter < 5.5) return -1.35;
    return -0.4;
  }

  return Math.max(0.1, maxY);
}

// Kiểm tra khoảng cách an toàn với đường sắt
function isNearRailwayTrack(x, z, minDist = 3.2) {
  if (!railwayCurve) return false;
  if (x < 78 || x > 108 || z < -115 || z > 68) return false;
  for (let s = 0; s <= 36; s++) {
    const pt = railwayCurve.getPointAt(s / 36);
    if (Math.hypot(x - pt.x, z - pt.z) < minDist) return true;
  }
  return false;
}

// Vùng cấm mọc cây rừng tự nhiên (bảo vệ nhà xưởng, đường sá, đồng cỏ đàn cừu, ao cá, đàn gà, vườn lan, đài phun nước)
function isForestExcludedZone(x, z) {
  // Khuôn viên nhà máy DK1 (Xưởng B, Văn phòng A, Nhà C, Nhà ăn, Đài phun nước DK, Sân bóng chuyền, Bãi đỗ)
  if (x > 10 && x < 84 && z > -70 && z < 2) return true;
  // Khuôn viên nhà máy DK2 & Lối vào cổng chính DK2 kết nối ĐT234 (khu vực gần trạm sạc EV thông thoáng)
  if (x > -96 && x < -12 && z > -80 && z < 2) return true;
  // Vườn Lan & Sinh thái trên đồi DK2 vị trí mới (-108, -88)
  if (Math.hypot(x - (-108), z - (-88)) < 16.0) return true;
  // Ao cá đồi sinh thái DK2 vị trí mới cạnh Vườn Lan (-132, -76)
  if (Math.hypot(x - (-132), z - (-76)) < 21.5) return true;
  // Đỉnh đồi phẳng rộng lớn Đồi Gà & Bồ Câu DK2 (-142, -38)
  if (Math.hypot(x - (-148), z - (-38)) < 26.0) return true;
  // Tuyến đường mòn sinh thái DK2 (Hành lang đi bộ không bị cây chắn)
  const trailWaypoints = [
    [-92, -48], [-97, -58], [-102, -70], [-106, -80],
    [-118, -84], [-126, -78], [-133, -62], [-137, -48]
  ];
  for (let i = 0; i < trailWaypoints.length; i++) {
    if (Math.hypot(x - trailWaypoints[i][0], z - trailWaypoints[i][1]) < 2.5) return true;
  }
  // Lòng đường ĐT234 (chỉ trồng cây cảnh 2 bên vỉa hè)
  if (x > -14.5 && x < -5.5 && z > -96 && z < 25) return true;
  // Lòng sông sâu
  if (x > 86 && x < 94 && z > -105 && z < 65) return true;
  // Đồng cỏ chăn thả đàn cừu sinh thái
  if (Math.hypot(x - 108, z - (-45)) < 15.5) return true;
  // Hành lang an toàn đường ray tàu hỏa
  if (isNearRailwayTrack(x, z, 3.2)) return true;

  return false;
}

// Hàm nhiễu 2D đa tần số tạo cụm rừng tự nhiên không thẳng hàng
function forestNoise2D(x, z) {
  const s1 = Math.sin(x * 0.032 + Math.cos(z * 0.032) * 1.9);
  const s2 = Math.sin(x * 0.075 - z * 0.082);
  const s3 = Math.cos(x * 0.15 + z * 0.13);
  return (s1 * 0.5 + s2 * 0.3 + s3 * 0.2 + 1.0) * 0.5; // [0..1]
}

function buildLandscaping() {
  const dummy = new THREE.Object3D();
  const fCfg = CONFIG.FOREST;

  // --------------------------------------------------------------------------
  // 1. (a) Cây tán tròn Low-Poly (Icosahedron Faceted Foliage - Dịch đỉnh ngẫu nhiên)
  // --------------------------------------------------------------------------
  const roundCount = fCfg.roundTreeCount || 1500;
  const roundTrunkGeo = new THREE.CylinderGeometry(0.2, 0.36, 2.0, 5);
  const roundTrunkMat = new THREE.MeshStandardMaterial({ color: 0x5c3d2e, roughness: 0.9, flatShading: true });
  const roundTrunkInst = new THREE.InstancedMesh(roundTrunkGeo, roundTrunkMat, roundCount);
  roundTrunkInst.castShadow = true;

  const roundFoliageGeo = createJitteredIcosahedron(1.7, 1, 0.28);
  const roundFoliageMat = createWindFoliageMaterial(0x22c55e, 0.8);
  const roundFoliageInst = new THREE.InstancedMesh(roundFoliageGeo, roundFoliageMat, roundCount);
  roundFoliageInst.castShadow = true;

  // --------------------------------------------------------------------------
  // 2. (b) Cây thông nhiều tầng hình nón (Tiered Pine Cones)
  // --------------------------------------------------------------------------
  const pineCount = fCfg.pineTreeCount || 850;
  const pineGeo = createTieredPineGeometry();
  const pineMat = createWindFoliageMaterial(0x14532d, 0.85);
  const pineInst = new THREE.InstancedMesh(pineGeo, pineMat, pineCount);
  pineInst.castShadow = true;

  // --------------------------------------------------------------------------
  // 3. (c) Cây tán vàng/cam điểm xuyến (Autumn / Golden Foliage)
  // --------------------------------------------------------------------------
  const autumnCount = fCfg.autumnTreeCount || 260;
  const autumnTrunkInst = new THREE.InstancedMesh(roundTrunkGeo, roundTrunkMat, autumnCount);
  autumnTrunkInst.castShadow = true;

  const autumnFoliageGeo = createJitteredIcosahedron(1.55, 1, 0.3);
  const autumnFoliageMat = createWindFoliageMaterial(0xf59e0b, 0.78);
  const autumnFoliageInst = new THREE.InstancedMesh(autumnFoliageGeo, autumnFoliageMat, autumnCount);
  autumnFoliageInst.castShadow = true;

  // --------------------------------------------------------------------------
  // 4. (d) Bụi cây thấp (Low Bushes)
  // --------------------------------------------------------------------------
  const bushCount = fCfg.bushCount || 700;
  const bushGeo = new THREE.DodecahedronGeometry(0.85, 0);
  const bushMat = createWindFoliageMaterial(0x4ade80, 0.82);
  const bushInst = new THREE.InstancedMesh(bushGeo, bushMat, bushCount);
  bushInst.castShadow = true;

  // --------------------------------------------------------------------------
  // 5. Tảng đá cuội & Bãi sỏi ven bờ (River Rocks & Hillside Boulders)
  // --------------------------------------------------------------------------
  const rockCount = fCfg.rockCount || 220;
  const rockGeo = new THREE.DodecahedronGeometry(0.75, 0);
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.9, flatShading: true });
  const rockInst = new THREE.InstancedMesh(rockGeo, rockMat, rockCount);
  rockInst.castShadow = true;

  // --------------------------------------------------------------------------
  // 6. Thảm hoa dại rực rỡ (Wildflowers - Trắng, Vàng, Hồng phấn, Tím pastel)
  // --------------------------------------------------------------------------
  const flowerCount = fCfg.flowerCount || 800;
  const flowerGeo = new THREE.SphereGeometry(0.2, 5, 4);
  const flowerMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const flowerInst = new THREE.InstancedMesh(flowerGeo, flowerMat, flowerCount);

  // --------------------------------------------------------------------------
  // 7. Khóm cỏ tuft (Grass Tufts)
  // --------------------------------------------------------------------------
  const tuftCount = fCfg.grassTuftCount || 600;
  const tuftGeo = new THREE.ConeGeometry(0.25, 0.65, 3);
  const tuftMat = new THREE.MeshStandardMaterial({ color: 0x65a30d, roughness: 0.85, flatShading: true });
  const tuftInst = new THREE.InstancedMesh(tuftGeo, tuftMat, tuftCount);

  // --------------------------------------------------------------------------
  // 8. Các mảng đất nâu ấm & vỉa đá lộ thiên trên sườn đồi núi (Earthen Soil Patches)
  // --------------------------------------------------------------------------
  const earthPatchCount = 150;
  const earthGeo = new THREE.CylinderGeometry(1.6, 2.2, 0.28, 6);
  const earthMat = new THREE.MeshStandardMaterial({
    color: CONFIG.GROUND.earthColor, // 0x78350f đất nâu ấm
    roughness: 0.95,
    flatShading: true,
  });
  const earthInst = new THREE.InstancedMesh(earthGeo, earthMat, earthPatchCount);
  earthInst.receiveShadow = true;
  let eaIdx = 0;

  // Color helper objects
  const colObj = new THREE.Color();
  const roundColors = fCfg.colors.roundFoliage;
  const pineColors = fCfg.colors.pineFoliage;
  const autumnColors = fCfg.colors.autumnFoliage;
  const bushColors = fCfg.colors.bushFoliage;
  const flowerColors = fCfg.colors.wildflowers;
  const rockColors = fCfg.colors.rocks;

  // Bộ đếm instance đã đặt
  let rIdx = 0;
  let pIdx = 0;
  let aIdx = 0;
  let bIdx = 0;
  let roIdx = 0;
  let flIdx = 0;
  let tuIdx = 0;

  // ==========================================================================
  // PHẦN A: CÂY CẢNH ĐỀU ĐẶN DỌC ĐƯỜNG NỘI BỘ & ĐT234 (Theo đúng prompt)
  // ==========================================================================
  // Dọc 2 bên lề đường ĐT234
  for (let z = -94; z <= 24; z += 5.8) {
    [-13.8, -6.2].forEach((rx) => {
      if (rIdx >= roundCount) return;
      // Bỏ cây ở lối vào cổng xưởng DK2 (khu vực gần trạm sạc EV)
      if (rx === -13.8 && z >= -34 && z <= -6) return;
      const x = rx + (Math.random() - 0.5) * 0.4;
      const y = 0.2;
      const s = 0.82 + Math.random() * 0.25;

      dummy.position.set(x, y + 1.0 * s, z);
      dummy.scale.set(s, s, s);
      dummy.rotation.set(0, Math.random() * Math.PI, 0);
      dummy.updateMatrix();
      roundTrunkInst.setMatrixAt(rIdx, dummy.matrix);

      dummy.position.set(x, y + 2.8 * s, z);
      dummy.updateMatrix();
      roundFoliageInst.setMatrixAt(rIdx, dummy.matrix);

      colObj.setHex(roundColors[rIdx % roundColors.length]);
      colObj.offsetHSL((Math.random() - 0.5) * 0.04, (Math.random() - 0.5) * 0.1, (Math.random() - 0.5) * 0.08);
      roundFoliageInst.setColorAt(rIdx, colObj);
      rIdx++;
    });
  }

  // Dọc lối dạo bộ bờ kênh DK1
  for (let z = -65; z <= -12; z += 5.2) {
    if (rIdx >= roundCount) break;
    const x = 79.2 + (Math.random() - 0.5) * 0.6;
    const y = 0.5;
    const s = 0.85 + Math.random() * 0.3;

    dummy.position.set(x, y + 1.0 * s, z);
    dummy.scale.set(s, s, s);
    dummy.rotation.set(0, Math.random() * Math.PI, 0);
    dummy.updateMatrix();
    roundTrunkInst.setMatrixAt(rIdx, dummy.matrix);

    dummy.position.set(x, y + 2.8 * s, z);
    dummy.updateMatrix();
    roundFoliageInst.setMatrixAt(rIdx, dummy.matrix);

    colObj.setHex(roundColors[rIdx % roundColors.length]);
    colObj.offsetHSL((Math.random() - 0.5) * 0.04, (Math.random() - 0.5) * 0.1, (Math.random() - 0.5) * 0.08);
    roundFoliageInst.setColorAt(rIdx, colObj);
    rIdx++;
  }

  // ==========================================================================
  // PHẦN B: PHỦ KÍN ĐỒI NÚI & RÌA KHU ĐẤT BẰNG THUẬT TOÁN NHIỄU THEO CỤM
  // ==========================================================================
  // Quét lưới jitter toàn cảnh từ rìa Tây sang rìa Đông, từ sườn Bắc đến thung lũng Nam
  const minX = -182, maxX = 192, stepX = 3.8;
  const minZ = -158, maxZ = 85, stepZ = 3.8;

  for (let gz = minZ; gz <= maxZ; gz += stepZ) {
    for (let gx = minX; gx <= maxX; gx += stepX) {
      // Dịch tọa độ ngẫu nhiên tự nhiên
      const x = gx + (Math.random() - 0.5) * 3.3;
      const z = gz + (Math.random() - 0.5) * 3.3;

      if (isForestExcludedZone(x, z)) continue;

      const elevation = getTerrainElevation(x, z);
      const nVal = forestNoise2D(x, z);

      // Lọc mật độ theo nhiễu:
      // Ở sườn đồi cao (elevation > 8), rừng phủ dày đặc như ảnh mẫu Grand Valley
      // Ở đồng bằng thấp, tạo khoảng hở bãi cỏ đón nắng
      if (elevation < 3.5 && nVal < 0.28) {
        // Có thể mọc bụi thấp hoặc hoa dại
        if (nVal > 0.18 && flIdx < flowerCount && Math.random() < 0.4) {
          dummy.position.set(x, elevation + 0.12, z);
          dummy.scale.setScalar(0.7 + Math.random() * 0.6);
          dummy.updateMatrix();
          flowerInst.setMatrixAt(flIdx, dummy.matrix);
          colObj.setHex(flowerColors[flIdx % flowerColors.length]);
          flowerInst.setColorAt(flIdx, colObj);
          flIdx++;
        }
        continue;
      }

      const isHighRidge = elevation > 9.5;
      const isNearRiver = Math.abs(x - 90) < 17;
      const scaleRand = 0.78 + Math.random() * 0.55;
      const rotY = Math.random() * Math.PI * 2;

      // Phân bổ 4 loại cây theo cao độ và cụm sinh thái
      if (isHighRidge || (nVal > 0.68 && !isNearRiver)) {
        // (b) Thông nhiều tầng hình nón trên đỉnh đồi & triền núi cao
        if (pIdx < pineCount && Math.random() < 0.75) {
          dummy.position.set(x, elevation, z);
          dummy.scale.set(scaleRand, scaleRand * (0.9 + Math.random() * 0.3), scaleRand);
          dummy.rotation.set(0, rotY, 0);
          dummy.updateMatrix();
          pineInst.setMatrixAt(pIdx, dummy.matrix);

          colObj.setHex(pineColors[pIdx % pineColors.length]);
          colObj.offsetHSL((Math.random() - 0.5) * 0.05, (Math.random() - 0.5) * 0.08, (Math.random() - 0.5) * 0.08);
          pineInst.setColorAt(pIdx, colObj);
          pIdx++;

          // Bụi thấp dưới chân cây thông
          if (bIdx < bushCount && Math.random() < 0.35) {
            const bx = x + (Math.random() - 0.5) * 2.2;
            const bz = z + (Math.random() - 0.5) * 2.2;
            const by = getTerrainElevation(bx, bz);
            dummy.position.set(bx, by + 0.25, bz);
            dummy.scale.setScalar(0.55 + Math.random() * 0.45);
            dummy.rotation.set(Math.random(), Math.random(), Math.random());
            dummy.updateMatrix();
            bushInst.setMatrixAt(bIdx, dummy.matrix);

            colObj.setHex(bushColors[bIdx % bushColors.length]);
            bushInst.setColorAt(bIdx, colObj);
            bIdx++;
          }
        } else if (aIdx < autumnCount && Math.random() < 0.5) {
          // (c) Cây tán vàng/cam thu rực rỡ điểm xuyến trên đồi
          dummy.position.set(x, elevation + 1.0 * scaleRand, z);
          dummy.scale.set(scaleRand, scaleRand, scaleRand);
          dummy.rotation.set(0, rotY, 0);
          dummy.updateMatrix();
          autumnTrunkInst.setMatrixAt(aIdx, dummy.matrix);

          dummy.position.set(x, elevation + 2.7 * scaleRand, z);
          dummy.updateMatrix();
          autumnFoliageInst.setMatrixAt(aIdx, dummy.matrix);

          colObj.setHex(autumnColors[aIdx % autumnColors.length]);
          colObj.offsetHSL((Math.random() - 0.5) * 0.05, (Math.random() - 0.5) * 0.1, (Math.random() - 0.5) * 0.08);
          autumnFoliageInst.setColorAt(aIdx, colObj);
          aIdx++;
        }
      } else {
        // (a) Cây tán tròn Low-Poly ở sườn dốc trung bình và thung lũng
        if (rIdx < roundCount) {
          dummy.position.set(x, elevation + 1.0 * scaleRand, z);
          dummy.scale.set(scaleRand, scaleRand, scaleRand);
          dummy.rotation.set(0, rotY, 0);
          dummy.updateMatrix();
          roundTrunkInst.setMatrixAt(rIdx, dummy.matrix);

          dummy.position.set(x, elevation + 2.8 * scaleRand, z);
          dummy.updateMatrix();
          roundFoliageInst.setMatrixAt(rIdx, dummy.matrix);

          colObj.setHex(roundColors[rIdx % roundColors.length]);
          colObj.offsetHSL((Math.random() - 0.5) * 0.05, (Math.random() - 0.5) * 0.1, (Math.random() - 0.5) * 0.08);
          roundFoliageInst.setColorAt(rIdx, colObj);
          rIdx++;

          // Điểm xuyến cây tán vàng xen kẽ trong rừng xanh
          if (aIdx < autumnCount && Math.random() < 0.14) {
            const ax = x + (Math.random() - 0.5) * 3.5;
            const az = z + (Math.random() - 0.5) * 3.5;
            if (!isForestExcludedZone(ax, az)) {
              const ay = getTerrainElevation(ax, az);
              const as = 0.8 + Math.random() * 0.45;
              dummy.position.set(ax, ay + 1.0 * as, az);
              dummy.scale.set(as, as, as);
              dummy.rotation.set(0, Math.random() * Math.PI, 0);
              dummy.updateMatrix();
              autumnTrunkInst.setMatrixAt(aIdx, dummy.matrix);

              dummy.position.set(ax, ay + 2.7 * as, az);
              dummy.updateMatrix();
              autumnFoliageInst.setMatrixAt(aIdx, dummy.matrix);

              colObj.setHex(autumnColors[aIdx % autumnColors.length]);
              colObj.offsetHSL((Math.random() - 0.5) * 0.05, (Math.random() - 0.5) * 0.1, (Math.random() - 0.5) * 0.08);
              autumnFoliageInst.setColorAt(aIdx, colObj);
              aIdx++;
            }
          }
        }
      }

      // (d) Bụi rậm ngẫu nhiên dưới các tán cây
      if (bIdx < bushCount && Math.random() < 0.28) {
        const bx = x + (Math.random() - 0.5) * 2.8;
        const bz = z + (Math.random() - 0.5) * 2.8;
        if (!isForestExcludedZone(bx, bz)) {
          const by = getTerrainElevation(bx, bz);
          dummy.position.set(bx, by + 0.35, bz);
          dummy.scale.setScalar(0.65 + Math.random() * 0.5);
          dummy.rotation.set(Math.random(), Math.random(), Math.random());
          dummy.updateMatrix();
          bushInst.setMatrixAt(bIdx, dummy.matrix);

          colObj.setHex(bushColors[bIdx % bushColors.length]);
          bushInst.setColorAt(bIdx, colObj);
          bIdx++;
        }
      }

      // Rải đá cuội ven bờ sông và triền đồi
      if (roIdx < rockCount && (isNearRiver || Math.random() < 0.12)) {
        const rx = x + (Math.random() - 0.5) * 3.0;
        const rz = z + (Math.random() - 0.5) * 3.0;
        if (!isForestExcludedZone(rx, rz)) {
          const ry = getTerrainElevation(rx, rz);
          dummy.position.set(rx, ry + 0.2, rz);
          dummy.scale.set(
            0.7 + Math.random() * 0.7,
            0.4 + Math.random() * 0.4,
            0.7 + Math.random() * 0.7
          );
          dummy.rotation.set(Math.random(), Math.random(), Math.random());
          dummy.updateMatrix();
          rockInst.setMatrixAt(roIdx, dummy.matrix);

          colObj.setHex(rockColors[roIdx % rockColors.length]);
          rockInst.setColorAt(roIdx, colObj);
          roIdx++;
        }
      }

      // Khóm cỏ tuft
      if (tuIdx < tuftCount && Math.random() < 0.22) {
        dummy.position.set(x, elevation + 0.2, z);
        dummy.scale.setScalar(0.8 + Math.random() * 0.5);
        dummy.rotation.set(0, Math.random() * Math.PI, 0);
        dummy.updateMatrix();
        tuftInst.setMatrixAt(tuIdx++, dummy.matrix);
      }

      // Điểm xuyết mảng đất nâu ấm trên sườn đồi cao hoặc rìa núi xa (rìa đồi núi thi thoảng điểm xuyết thêm màu nâu đất)
      if (eaIdx < earthPatchCount && elevation > 5.0 && (Math.abs(x) > 85 || z < -65) && Math.random() < 0.14) {
        dummy.position.set(x, elevation + 0.08, z);
        dummy.scale.set(0.9 + Math.random() * 0.7, 0.5 + Math.random() * 0.4, 0.9 + Math.random() * 0.7);
        dummy.rotation.set((Math.random() - 0.5) * 0.25, Math.random() * Math.PI, (Math.random() - 0.5) * 0.25);
        dummy.updateMatrix();
        earthInst.setMatrixAt(eaIdx++, dummy.matrix);
      }
    }
  }

  // Cập nhật ma trận và bảng màu InstancedMesh
  roundTrunkInst.count = rIdx;
  roundTrunkInst.instanceMatrix.needsUpdate = true;
  scene.add(roundTrunkInst);

  roundFoliageInst.count = rIdx;
  roundFoliageInst.instanceMatrix.needsUpdate = true;
  if (roundFoliageInst.instanceColor) roundFoliageInst.instanceColor.needsUpdate = true;
  scene.add(roundFoliageInst);

  pineInst.count = pIdx;
  pineInst.instanceMatrix.needsUpdate = true;
  if (pineInst.instanceColor) pineInst.instanceColor.needsUpdate = true;
  scene.add(pineInst);

  autumnTrunkInst.count = aIdx;
  autumnTrunkInst.instanceMatrix.needsUpdate = true;
  scene.add(autumnTrunkInst);

  autumnFoliageInst.count = aIdx;
  autumnFoliageInst.instanceMatrix.needsUpdate = true;
  if (autumnFoliageInst.instanceColor) autumnFoliageInst.instanceColor.needsUpdate = true;
  scene.add(autumnFoliageInst);

  bushInst.count = bIdx;
  bushInst.instanceMatrix.needsUpdate = true;
  if (bushInst.instanceColor) bushInst.instanceColor.needsUpdate = true;
  scene.add(bushInst);

  rockInst.count = roIdx;
  rockInst.instanceMatrix.needsUpdate = true;
  if (rockInst.instanceColor) rockInst.instanceColor.needsUpdate = true;
  scene.add(rockInst);

  flowerInst.count = flIdx;
  flowerInst.instanceMatrix.needsUpdate = true;
  if (flowerInst.instanceColor) flowerInst.instanceColor.needsUpdate = true;
  scene.add(flowerInst);

  tuftInst.count = tuIdx;
  tuftInst.instanceMatrix.needsUpdate = true;
  scene.add(tuftInst);

  earthInst.count = eaIdx;
  earthInst.instanceMatrix.needsUpdate = true;
  scene.add(earthInst);
}

// ============================================================================
// Cây cảnh, bồn hoa & tiểu cảnh trong sân gần các tòa nhà (Courtyard Greenery)
// ============================================================================
function buildCourtyardGreenery() {
  const group = new THREE.Group();
  const potMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.8 }); // Bồn đá xám
  const soilMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.95 });
  const shrubMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.7, flatShading: true });
  const cypressMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.75, flatShading: true });

  const planterLocations = [
    // 1. Mặt tiền Nhà A (Văn phòng & Kỹ thuật) - Bồn cây cảnh đá lối vào
    { x: 26, y: 0, z: -27.5, type: 'topiary' },
    { x: 30, y: 0, z: -27.5, type: 'cypress' },
    { x: 36, y: 0, z: -27.5, type: 'cypress' },
    { x: 40, y: 0, z: -27.5, type: 'topiary' },
    { x: 46, y: 0, z: -27.5, type: 'shrub' },

    // 2. Trước sảnh Nhà B (Xưởng sản xuất)
    { x: 53, y: 0, z: -31.8, type: 'cypress' },
    { x: 63, y: 0, z: -31.8, type: 'topiary' },
    { x: 74, y: 0, z: -31.8, type: 'cypress' },

    // 3. Sân Nhà ăn CBNV & góc thư giãn
    { x: 18, y: 0, z: -7.5, type: 'shrub' },
    { x: 22, y: 0, z: -5.5, type: 'topiary' },
    { x: 28, y: 0, z: -5.5, type: 'cypress' },

    // 4. Trước sảnh Tòa nhà Điều hành DK2 (HQ)
    { x: -44, y: 0, z: -23.5, type: 'cypress' },
    { x: -39, y: 0, z: -23.5, type: 'topiary' },
    { x: -33, y: 0, z: -23.5, type: 'topiary' },
    { x: -28, y: 0, z: -23.5, type: 'cypress' },

    // 5. Góc sân kiểm định xe DK2
    { x: -62, y: 0, z: -19.5, type: 'shrub' },
    { x: -70, y: 0, z: -19.5, type: 'cypress' },
  ];

  planterLocations.forEach((loc) => {
    const pGroup = new THREE.Group();
    pGroup.position.set(loc.x, loc.y, loc.z);

    // Bồn cây bê tông đá
    const pot = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.5, 0.95), potMat);
    pot.position.y = 0.25;
    pot.castShadow = true;
    pot.receiveShadow = true;
    pGroup.add(pot);

    // Đất màu mỡ
    const soil = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.05, 0.82), soilMat);
    soil.position.y = 0.5;
    pGroup.add(soil);

    if (loc.type === 'cypress') {
      // Cây tùng tháp hình nón sang trọng
      const cy = new THREE.Mesh(new THREE.ConeGeometry(0.55, 2.1, 7), cypressMat);
      cy.position.y = 1.55;
      cy.castShadow = true;
      pGroup.add(cy);
    } else if (loc.type === 'topiary') {
      // Cây tỉa hình cầu tròn
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.6, 5), potMat);
      stem.position.y = 0.8;
      pGroup.add(stem);

      const ball = new THREE.Mesh(new THREE.DodecahedronGeometry(0.58, 1), shrubMat);
      ball.position.y = 1.38;
      ball.castShadow = true;
      pGroup.add(ball);
    } else {
      // Bụi hoa/cây tán thấp
      const bush = new THREE.Mesh(new THREE.DodecahedronGeometry(0.65, 0), shrubMat);
      bush.position.y = 0.8;
      bush.scale.set(1.1, 0.85, 1.1);
      bush.castShadow = true;
      pGroup.add(bush);
    }

    group.add(pGroup);
  });

  scene.add(group);
}

// ============================================================================
// Giả lập Ambient Occlusion (Bóng tiếp đất mềm chân các tòa nhà - Contact Shadows)
// ============================================================================
function buildBuildingContactShadows() {
  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x020617,
    transparent: true,
    opacity: 0.26,
    depthWrite: false,
  });

  const buildings = [
    // Nhà B (Xưởng 3 tầng)
    { x: 65.0, z: -50.0, w: 24.8, d: 35.8 },
    // Nhà A (Văn phòng)
    { x: 35.0, z: -35.0, w: 34.8, d: 14.5 },
    // Nhà C (Kho xưởng)
    { x: 45.0, z: -58.5, w: 16.2, d: 13.8 },
    // Nhà ăn CBNV
    { x: 23.0, z: -12.0, w: 14.2, d: 11.2 },
    // Nhà điều hành DK2 (HQ)
    { x: -36.0, z: -32.0, w: 26.8, d: 20.8 },
    // Kho D2.1 (Đã dịch chuyển theo mũi tên)
    { x: -50.0, z: -68.0, w: 64.0, d: 15.0 },
  ];

  buildings.forEach((b) => {
    const geo = new THREE.PlaneGeometry(b.w, b.d);
    const m = new THREE.Mesh(geo, shadowMat);
    m.rotation.x = -Math.PI / 2;
    m.position.set(b.x, 0.02, b.z);
    scene.add(m);
  });
}

// ============================================================================
// 11. Logistics Equipment, Pallets & Forklifts
// ============================================================================

// ============================================================================
// KHỐI 9: XE NÂNG, XE TẢI & HOẠT CẢNH LOGISTICS KHÉP KÍN (LOGISTICS MASTER)
// ============================================================================

// 1. Tạo mô hình xe nâng điện chi tiết chuẩn công nghiệp (Komatsu Electric Forklift)
function createDetailedForklift(x, y, z, rotY, id, name, options = {}) {
  const flGroup = new THREE.Group();
  flGroup.position.set(x, y, z);
  flGroup.rotation.y = rotY;

  // Materials
  const orangeMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.35, metalness: 0.15 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.65 });
  const steelMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4, metalness: 0.5 });
  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.2, metalness: 0.85 });
  const amberBeaconMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    emissive: 0xf59e0b,
    emissiveIntensity: 0.95,
    roughness: 0.2,
  });

  // A. Chassis Body (Thân xe nâng sơn cam công nghiệp)
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.95, 1.26), orangeMat);
  chassis.position.set(0, 0.65, 0);
  chassis.castShadow = true;
  flGroup.add(chassis);

  // Bậc lên xuống có vân chống trượt
  const stepL = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 0.18), darkMat);
  stepL.position.set(-0.1, 0.25, 0.68);
  flGroup.add(stepL);
  const stepR = stepL.clone();
  stepR.position.z = -0.68;
  flGroup.add(stepR);

  // B. Đối trọng đúc gang phía sau (Heavy Cast Iron Counterweight)
  const counterWeight = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.88, 1.24), darkMat);
  counterWeight.position.set(-0.88, 0.68, 0);
  counterWeight.castShadow = true;
  flGroup.add(counterWeight);

  // Logo DK Logistics sau xe
  const logoPlate = new THREE.Mesh(
    new THREE.BoxGeometry(0.04, 0.22, 0.65),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 })
  );
  logoPlate.position.set(-1.25, 0.72, 0);
  flGroup.add(logoPlate);

  const logoText = new THREE.Mesh(
    new THREE.BoxGeometry(0.05, 0.12, 0.5),
    new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3 })
  );
  logoText.position.set(-1.26, 0.72, 0);
  flGroup.add(logoText);

  // C. Khung bảo vệ người lái (Overhead Guard / Roll Cage)
  const cageGroup = new THREE.Group();
  cageGroup.position.set(-0.15, 1.35, 0);

  // 4 trụ thép chịu lực
  const postGeo = new THREE.CylinderGeometry(0.042, 0.042, 1.32, 8);
  const postPositions = [
    [-0.55, 0.66, 0.52],
    [-0.55, 0.66, -0.52],
    [0.55, 0.66, 0.52],
    [0.55, 0.66, -0.52],
  ];
  postPositions.forEach((pos) => {
    const post = new THREE.Mesh(postGeo, steelMat);
    post.position.set(...pos);
    post.castShadow = true;
    cageGroup.add(post);
  });

  // Mái che khung thép có lưới bảo vệ chống vật rơi
  const roof = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.06, 1.15), steelMat);
  roof.position.set(0, 1.34, 0);
  roof.castShadow = true;
  cageGroup.add(roof);

  // Các thanh song sắt an toàn trên nóc
  for (let sx = -0.45; sx <= 0.45; sx += 0.18) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.04, 1.05), darkMat);
    bar.position.set(sx, 1.37, 0);
    cageGroup.add(bar);
  }

  // Đèn xoay cảnh báo màu hổ phách trên nóc (Amber Rotating Strobe Beacon)
  const beaconBase = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.08, 8), darkMat);
  beaconBase.position.set(0, 1.41, 0);
  cageGroup.add(beaconBase);

  const beaconDome = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.15, 8), amberBeaconMat);
  beaconDome.position.set(0, 1.51, 0);
  cageGroup.add(beaconDome);

  const beaconLight = new THREE.PointLight(0xf59e0b, 0.75, 8);
  beaconLight.position.set(0, 1.55, 0);
  cageGroup.add(beaconLight);

  rotatingBeacons.push({ mesh: beaconDome, light: beaconLight });

  // 2 Đèn pha làm việc phía trước gắn trên khung bảo vệ
  [-0.48, 0.48].forEach((wz) => {
    const workLight = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.12, 0.1),
      new THREE.MeshStandardMaterial({ color: 0xffedd5, emissive: 0xfef08a, emissiveIntensity: 0.8 })
    );
    workLight.position.set(0.58, 1.15, wz);
    cageGroup.add(workLight);
  });

  flGroup.add(cageGroup);

  // D. Buồng lái, ghế ngồi & tài xế
  const seatBase = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.22, 0.52), darkMat);
  seatBase.position.set(-0.25, 0.72, 0);
  flGroup.add(seatBase);

  const seatBack = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.52, 0.48), darkMat);
  seatBack.position.set(-0.48, 1.05, 0);
  flGroup.add(seatBack);

  // Vô lăng nghiêng & cần gạt thủy lực
  const steeringCol = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.55, 6), steelMat);
  steeringCol.rotation.z = -Math.PI / 6;
  steeringCol.position.set(0.18, 0.95, 0);
  flGroup.add(steeringCol);

  const wheelRim = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.025, 6, 12), darkMat);
  wheelRim.rotation.y = Math.PI / 2;
  wheelRim.rotation.x = Math.PI / 6;
  wheelRim.position.set(0.3, 1.15, 0);
  flGroup.add(wheelRim);

  // Tài xế ngồi lái xe nâng
  const driver = createCharacter({
    shirtColor: 0xea580c,
    pantsColor: 0x1e293b,
    hatColor: 0xfacc15,
    isDriver: true,
  });
  driver.position.set(-0.24, 0.75, 0);
  flGroup.add(driver);

  // E. Khung nâng (Mast) 2 tầng chữ I & Ty thủy lực mạ chrome
  const mastGroup = new THREE.Group();
  mastGroup.position.set(1.05, 0, 0);

  // 2 Trụ ray chữ I đứng cố định
  [-0.45, 0.45].forEach((mz) => {
    const mastColumn = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.55, 0.14), steelMat);
    mastColumn.position.set(0, 1.45, mz);
    mastColumn.castShadow = true;
    mastGroup.add(mastColumn);
  });

  // Thanh giằng ngang liên kết khung mast
  [1.0, 1.8, 2.6].forEach((hy) => {
    const tieBar = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 0.85), steelMat);
    tieBar.position.set(0, hy, 0);
    mastGroup.add(tieBar);
  });

  // Ty đẩy thủy lực mạ chrome sáng bóng
  const ramCylinder = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 2.1, 8), chromeMat);
  ramCylinder.position.set(-0.02, 1.35, 0);
  mastGroup.add(ramCylinder);

  flGroup.add(mastGroup);

  // F. Cụm giá nâng di động (Sliding Carriage & Forged Forks)
  const liftGroup = new THREE.Group();
  liftGroup.position.set(1.15, 0.22, 0);

  const carriage = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.54, 0.98), darkMat);
  carriage.position.set(0, 0.28, 0);
  liftGroup.add(carriage);

  // Càng nâng thép tôi cứng hình chữ L
  [-0.26, 0.26].forEach((fz) => {
    // Đoạn đứng móc vào giá
    const forkUp = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.52, 0.14), darkMat);
    forkUp.position.set(0.04, 0.28, fz);
    liftGroup.add(forkUp);

    // Lưỡi càng ngang vát nhọn phía trước
    const forkBlade = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.065, 0.14), darkMat);
    forkBlade.position.set(0.68, 0.04, fz);
    liftGroup.add(forkBlade);
  });

  // Pallet hàng gắn trên càng nâng (nếu là xe tĩnh hoặc xe chu kỳ có tải)
  let cargoPalletOnFork = null;
  if (!options.isActiveCycle) {
    cargoPalletOnFork = createForkliftPalletCargo();
    liftGroup.add(cargoPalletOnFork);
  }

  flGroup.add(liftGroup);

  // G. Bánh xe công nghiệp đặc (Solid Industrial Rubber Tires)
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.95 });
  const hubMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.4 });

  // Bánh trước chịu tải lớn
  [-0.64, 0.64].forEach((wz) => {
    const fWheel = new THREE.Group();
    fWheel.position.set(0.65, 0.35, wz);
    const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.26, 12), tireMat);
    tire.rotation.x = Math.PI / 2;
    fWheel.add(tire);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.27, 8), hubMat);
    hub.rotation.x = Math.PI / 2;
    fWheel.add(hub);
    flGroup.add(fWheel);
  });

  // Bánh sau đánh lái
  [-0.58, 0.58].forEach((wz) => {
    const rWheel = new THREE.Group();
    rWheel.position.set(-0.68, 0.3, wz);
    const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.22, 12), tireMat);
    tire.rotation.x = Math.PI / 2;
    rWheel.add(tire);
    flGroup.add(rWheel);
  });

  // Metadata tương tác
  const flData = {
    id: id,
    title: name,
    type: 'forklift',
    desc: 'Xe nâng điện công nghiệp Komatsu 2.5 tấn tích hợp đèn xoay cảnh báo, phục vụ bốc xếp pallet linh kiện và xe thành phẩm.',
    zone: id.includes('2') ? 'DK2' : 'DK1',
  };
  flGroup.userData = flData;
  chassis.userData = flData;
  scene.add(flGroup);
  interactiveObjects.push(chassis);

  const forkliftObj = {
    group: flGroup,
    liftGroup,
    initialY: 0.22,
    id,
    isActiveCycle: !!options.isActiveCycle,
    initialPos: { x, y, z, rotY },
    beaconMesh: beaconDome,
    beaconLight,
    carriedPallet: cargoPalletOnFork,
  };

  if (options.isActiveCycle) {
    activeForklift = forkliftObj;
    activeForkliftInitialPos = { x, y, z, rotY };
  } else {
    animatedForklifts.push(forkliftObj);
  }

  return forkliftObj;
}

// Helper: Tạo pallet hàng gắn trên càng nâng
function createForkliftPalletCargo(labelType = 'components') {
  const pGroup = new THREE.Group();
  pGroup.position.set(0.68, 0.08, 0);

  const woodMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.85 });
  const boxMat = new THREE.MeshStandardMaterial({
    color: labelType === 'ebikes' ? 0x0284c7 : 0xd97706,
    roughness: 0.65,
  });

  // Pallet gỗ
  const pallet = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.12, 1.05), woodMat);
  pallet.position.y = 0.06;
  pallet.castShadow = true;
  pGroup.add(pallet);

  // Thùng kiện hàng
  const box = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.72, 0.95), boxMat);
  box.position.y = 0.48;
  box.castShadow = true;
  pGroup.add(box);

  // Tem nhãn DK BIKE
  const tagMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
  const tag1 = new THREE.Mesh(new THREE.PlaneGeometry(0.45, 0.22), tagMat);
  tag1.position.set(0, 0.52, 0.48);
  pGroup.add(tag1);

  return pGroup;
}

// 2. Tạo xe tải thùng 5 tấn DK Logistics hoàn chỉnh (5-Ton Box Truck with Opening Doors)
function create5TonLogisticsTruck(colorHex = 0x0284c7, name = 'Xe tải logistics 5 tấn DK Bike (5T)') {
  const truckGroup = new THREE.Group();

  // Materials
  const cabColorMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.35, metalness: 0.2 });
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 });
  const darkChassisMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 });
  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.15, metalness: 0.9 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1, metalness: 0.9 });
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.95 });
  const redBrakeMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, emissive: 0x991b1b, emissiveIntensity: 0.5 });
  const amberTurnMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xd97706, emissiveIntensity: 0.6 });

  // A. Chassis sắt xi dầm thép chữ U (Chassis Rails)
  const chassisFrame = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.28, 7.2), darkChassisMat);
  chassisFrame.position.set(0, 0.85, -0.6);
  chassisFrame.castShadow = true;
  truckGroup.add(chassisFrame);

  // Bình nhiên liệu và bình ắc quy bên hông
  const fuelTank = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 1.25, 12), chromeMat);
  fuelTank.rotation.z = Math.PI / 2;
  fuelTank.position.set(1.08, 0.72, -1.2);
  truckGroup.add(fuelTank);

  const batteryBox = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.45, 0.85), darkChassisMat);
  batteryBox.position.set(-1.08, 0.72, -1.2);
  truckGroup.add(batteryBox);

  // Thanh chắn chống va quẹt hông (Side Underrun Guards)
  [-1.15, 1.15].forEach((sx) => {
    const sideRail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 2.6), whiteMat);
    sideRail.position.set(sx, 0.55, -1.2);
    truckGroup.add(sideRail);
  });

  // B. Cabin xe tải hiện đại (Forward-Control Truck Cabin)
  const cabGroup = new THREE.Group();
  cabGroup.position.set(0, 1.9, 1.9);

  // Khối thân cabin
  const cabBody = new THREE.Mesh(new THREE.BoxGeometry(2.35, 1.95, 2.05), cabColorMat);
  cabBody.position.set(0, 0, 0);
  cabBody.castShadow = true;
  cabGroup.add(cabBody);

  // Kính chắn gió cong phía trước
  const windshield = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.95, 0.12), glassMat);
  windshield.position.set(0, 0.38, 1.02);
  cabGroup.add(windshield);

  // Kính cửa sổ hai bên
  [-1.18, 1.18].forEach((wx) => {
    const sideWin = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.72, 0.85), glassMat);
    sideWin.position.set(wx, 0.38, 0.1);
    cabGroup.add(sideWin);
  });

  // Cản trước và lưới tản nhiệt chrome
  const frontBumper = new THREE.Mesh(new THREE.BoxGeometry(2.45, 0.5, 0.35), darkChassisMat);
  frontBumper.position.set(0, -0.85, 1.12);
  frontBumper.castShadow = true;
  cabGroup.add(frontBumper);

  const grille = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.45, 0.08), chromeMat);
  grille.position.set(0, -0.32, 1.05);
  cabGroup.add(grille);

  // Biểu tượng mạ chrome DK ở mũi xe
  const dkEmblem = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.06, 12), chromeMat);
  dkEmblem.rotation.x = Math.PI / 2;
  dkEmblem.position.set(0, -0.22, 1.1);
  cabGroup.add(dkEmblem);

  // Cụm đèn pha LED halogen & Đèn gầm
  [-0.92, 0.92].forEach((hx) => {
    const headlight = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.22, 0.1),
      new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfef08a, emissiveIntensity: 0.9 })
    );
    headlight.position.set(hx, -0.75, 1.25);
    cabGroup.add(headlight);
  });

  // Gương chiếu hậu đôi hai bên
  [-1.35, 1.35].forEach((mx) => {
    const mirrorBracket = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.04, 0.04), darkChassisMat);
    mirrorBracket.position.set(mx > 0 ? 1.25 : -1.25, 0.45, 0.75);
    cabGroup.add(mirrorBracket);

    const mirror = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.45, 0.2), darkChassisMat);
    mirror.position.set(mx, 0.45, 0.75);
    cabGroup.add(mirror);
  });

  // Mui lướt gió khí động học trên nóc (Roof Air Deflector)
  const roofSpoiler = new THREE.Mesh(new THREE.BoxGeometry(2.32, 0.65, 1.55), whiteMat);
  roofSpoiler.position.set(0, 1.25, -0.15);
  roofSpoiler.rotation.x = -Math.PI / 10;
  roofSpoiler.castShadow = true;
  cabGroup.add(roofSpoiler);

  // Biển hiệu "DK BIKE LOGISTICS" trên mui gió
  const spoilerSign = new THREE.Mesh(
    new THREE.PlaneGeometry(1.8, 0.32),
    new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3 })
  );
  spoilerSign.rotation.x = -Math.PI / 10;
  spoilerSign.position.set(0, 1.28, 0.58);
  cabGroup.add(spoilerSign);

  truckGroup.add(cabGroup);

  // C. Thùng tải hàng cách nhiệt composite (Insulated Cargo Box)
  const cargoBoxGroup = new THREE.Group();
  cargoBoxGroup.position.set(0, 2.3, -1.55);

  const cargoBox = new THREE.Mesh(new THREE.BoxGeometry(2.42, 2.35, 4.95), whiteMat);
  cargoBox.position.set(0, 0, 0);
  cargoBox.castShadow = true;
  cargoBoxGroup.add(cargoBox);

  // Viền nhôm bo góc thùng
  const trimMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.3 });
  const topTrim = new THREE.Mesh(new THREE.BoxGeometry(2.46, 0.08, 5.0), trimMat);
  topTrim.position.set(0, 1.18, 0);
  cargoBoxGroup.add(topTrim);

  // Dải phản quang an toàn đỏ-trắng chân thùng
  [-1.22, 1.22].forEach((sx) => {
    const reflexStrip = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.12, 4.8),
      new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0x991b1b, emissiveIntensity: 0.4 })
    );
    reflexStrip.position.set(sx, -1.05, 0);
    cargoBoxGroup.add(reflexStrip);

    // Decal thương hiệu DK Bike bên hông thùng
    const decal = new THREE.Mesh(
      new THREE.PlaneGeometry(3.6, 1.1),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3 })
    );
    decal.rotation.y = sx > 0 ? Math.PI / 2 : -Math.PI / 2;
    decal.position.set(sx > 0 ? 1.225 : -1.225, 0.15, 0);
    cargoBoxGroup.add(decal);
  });

  // D. Cửa thùng phía sau mở được (Opening Rear Cargo Doors with Hinges)
  // Bản lề cửa trái (xoay quanh trục Y mép ngoài x = -1.18)
  const doorPivotLeft = new THREE.Group();
  doorPivotLeft.position.set(-1.18, 0, -2.48);

  const doorLeafL = new THREE.Mesh(new THREE.BoxGeometry(1.16, 2.26, 0.07), whiteMat);
  doorLeafL.position.set(0.58, 0, 0);
  doorLeafL.castShadow = true;
  doorPivotLeft.add(doorLeafL);

  // Thanh khóa cửa mạ kẽm (Cam lock rod)
  const lockRodL = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 2.2, 6), chromeMat);
  lockRodL.position.set(0.95, 0, 0.05);
  doorPivotLeft.add(lockRodL);

  cargoBoxGroup.add(doorPivotLeft);

  // Bản lề cửa phải (xoay quanh trục Y mép ngoài x = 1.18)
  const doorPivotRight = new THREE.Group();
  doorPivotRight.position.set(1.18, 0, -2.48);

  const doorLeafR = new THREE.Mesh(new THREE.BoxGeometry(1.16, 2.26, 0.07), whiteMat);
  doorLeafR.position.set(-0.58, 0, 0);
  doorLeafR.castShadow = true;
  doorPivotRight.add(doorLeafR);

  const lockRodR = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 2.2, 6), chromeMat);
  lockRodR.position.set(-0.95, 0, 0.05);
  doorPivotRight.add(lockRodR);

  cargoBoxGroup.add(doorPivotRight);

  // E. Pallet kiện hàng trên sàn thùng xe (Truck Bed Cargo Pallet)
  const truckPalletSlot = new THREE.Group();
  truckPalletSlot.position.set(0, -1.02, -1.2);
  cargoBoxGroup.add(truckPalletSlot);

  truckGroup.add(cargoBoxGroup);

  // F. Bánh xe: 1 trục trước dẫn hướng & 2 trục sau chịu tải kép (Dual-Tire Rear Axles)
  const frontWheels = [];

  // 2 bánh trước
  [-1.05, 1.05].forEach((wx) => {
    const fwGroup = new THREE.Group();
    fwGroup.position.set(wx, 0.48, 1.9);
    const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.32, 16), tireMat);
    tire.rotation.z = Math.PI / 2;
    tire.castShadow = true;
    fwGroup.add(tire);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.33, 8), darkChassisMat);
    hub.rotation.z = Math.PI / 2;
    fwGroup.add(hub);
    truckGroup.add(fwGroup);
    frontWheels.push(fwGroup);
  });

  // 4 cụm bánh kép phía sau (8 lốp)
  [-1.0, -2.3].forEach((axleZ) => {
    [-1.05, 1.05].forEach((wx) => {
      const dualWheel = new THREE.Group();
      dualWheel.position.set(wx, 0.48, axleZ);

      // 2 lốp áp sát nhau
      [-0.12, 0.12].forEach((offset) => {
        const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.22, 16), tireMat);
        tire.rotation.z = Math.PI / 2;
        tire.position.x = offset;
        tire.castShadow = true;
        dualWheel.add(tire);
      });

      truckGroup.add(dualWheel);
    });
  });

  // Chắn bùn sau có chữ DK BIKE
  [-1.15, 1.15].forEach((fx) => {
    const mudFlap = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.42, 0.38), darkChassisMat);
    mudFlap.position.set(fx, 0.45, -3.8);
    truckGroup.add(mudFlap);
  });

  // Đèn hậu & đèn lùi
  [-0.95, 0.95].forEach((rx) => {
    const tailLight = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.14, 0.08), redBrakeMat);
    tailLight.position.set(rx, 0.65, -4.18);
    truckGroup.add(tailLight);
  });

  // Headlight spot for night
  const headSpotL = new THREE.SpotLight(0xffedd5, 0, 35, Math.PI / 5, 0.3, 1.5);
  headSpotL.position.set(-0.8, 1.1, 3.2);
  headSpotL.target.position.set(-0.8, 0, 20);
  truckGroup.add(headSpotL);
  truckGroup.add(headSpotL.target);

  const headSpotR = headSpotL.clone();
  headSpotR.position.x = 0.8;
  headSpotR.target.position.x = 0.8;
  truckGroup.add(headSpotR);
  truckGroup.add(headSpotR.target);
  logisticsTruckLights.push(headSpotL, headSpotR);

  // Metadata tương tác
  const truckData = {
    id: 'logisticsTruck5T',
    title: name,
    type: 'truck',
    desc: 'Xe tải thùng 5 tấn DK Bike Logistics chuyên dụng chuyên chở phụ tùng động cơ, pin lithium và giao xe điện thành phẩm xuất xưởng.',
    zone: 'DK1',
  };
  truckGroup.userData = truckData;
  cabBody.userData = truckData;
  interactiveObjects.push(cabBody);

  return {
    truckGroup,
    doorPivotLeft,
    doorPivotRight,
    truckPalletSlot,
    frontWheels,
    headSpotL,
    headSpotR,
  };
}

// 3. Tạo xe đầu kéo container 40ft DK Logistics (40ft Heavy Tractor Container Truck)
function create40ftContainerTruck(x, y, z, rotY, id, name) {
  const cGroup = new THREE.Group();
  cGroup.position.set(x, y, z);
  cGroup.rotation.y = rotY;

  const cabMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.35, metalness: 0.2 }); // Đầu kéo đỏ mạnh mẽ
  const trailerMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 });
  const containerMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.5, metalness: 0.1 }); // Container xanh dương DK
  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.15, metalness: 0.9 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.95 });

  // A. Đầu kéo Heavy-Duty 6x4 Prime Mover Tractor
  const cabTractor = new THREE.Group();
  cabTractor.position.set(0, 0, 4.2);

  // Khung cabin đầu kéo cao
  const mainCab = new THREE.Mesh(new THREE.BoxGeometry(2.5, 2.7, 2.6), cabMat);
  mainCab.position.set(0, 2.3, 0);
  mainCab.castShadow = true;
  cabTractor.add(mainCab);

  // Kính chắn gió
  const windshield = new THREE.Mesh(
    new THREE.BoxGeometry(2.35, 1.05, 0.1),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1, metalness: 0.9 })
  );
  windshield.position.set(0, 2.65, 1.31);
  cabTractor.add(windshield);

  // Mũi xe tản nhiệt chrome cỡ lớn
  const frontGrille = new THREE.Mesh(new THREE.BoxGeometry(1.9, 1.25, 0.12), chromeMat);
  frontGrille.position.set(0, 1.5, 1.32);
  cabTractor.add(frontGrille);

  // Ống xả thẳng đứng mạ chrome kiểu Mỹ
  const exhaustPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 3.2, 8), chromeMat);
  exhaustPipe.position.set(1.22, 3.0, -1.1);
  cabTractor.add(exhaustPipe);

  // Bánh xe đầu kéo (2 trước + 4 bánh kép sau)
  [-1.1, 1.1].forEach((wx) => {
    const fw = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.35, 16), darkMat);
    fw.rotation.z = Math.PI / 2;
    fw.position.set(wx, 0.52, 1.0);
    cabTractor.add(fw);
  });

  [-0.6, -1.8].forEach((axZ) => {
    [-1.1, 1.1].forEach((wx) => {
      const rw = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.42, 16), darkMat);
      rw.rotation.z = Math.PI / 2;
      rw.position.set(wx, 0.52, axZ);
      cabTractor.add(rw);
    });
  });

  cGroup.add(cabTractor);

  // B. Rơ-moóc xương 40ft (40ft Skeletal Semi-Trailer)
  const trailerGroup = new THREE.Group();
  trailerGroup.position.set(0, 1.2, -2.6);

  const chassisBeam = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.28, 12.4), trailerMat);
  chassisBeam.position.set(0, 0, 0);
  chassisBeam.castShadow = true;
  trailerGroup.add(chassisBeam);

  // Chân chống rơ-moóc (Landing Gear Legs)
  [-0.95, 0.95].forEach((lx) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.1, 0.12), trailerMat);
    leg.position.set(lx, -0.65, 3.2);
    trailerGroup.add(leg);
  });

  // 3 trục bánh rơ-moóc (Triple Trailer Axles)
  [-3.8, -4.9, -6.0].forEach((tz) => {
    [-1.1, 1.1].forEach((tx) => {
      const tw = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.4, 16), darkMat);
      tw.rotation.z = Math.PI / 2;
      tw.position.set(tx, -0.68, tz);
      tw.castShadow = true;
      trailerGroup.add(tw);
    });
  });

  // C. Vỏ Container 40ft High Cube (40-Foot ISO Shipping Container)
  const container = new THREE.Mesh(new THREE.BoxGeometry(2.44, 2.65, 12.2), containerMat);
  container.position.set(0, 1.48, 0);
  container.castShadow = true;
  trailerGroup.add(container);

  // Gân sóng tôn dập nổi hai bên hông container
  for (let rz = -5.8; rz <= 5.8; rz += 0.42) {
    [-1.24, 1.24].forEach((rx) => {
      const rib = new THREE.Mesh(new THREE.BoxGeometry(0.04, 2.5, 0.14), containerMat);
      rib.position.set(rx, 1.48, rz);
      trailerGroup.add(rib);
    });
  }

  // Dải chữ thương hiệu DK BIKE GLOBAL LOGISTICS trên container
  const bannerMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
  [-1.25, 1.25].forEach((bx) => {
    const banner = new THREE.Mesh(new THREE.PlaneGeometry(8.5, 0.85), bannerMat);
    banner.rotation.y = bx > 0 ? Math.PI / 2 : -Math.PI / 2;
    banner.position.set(bx, 1.9, 0);
    trailerGroup.add(banner);

    const bannerText = new THREE.Mesh(
      new THREE.PlaneGeometry(7.8, 0.55),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3 })
    );
    bannerText.rotation.y = bx > 0 ? Math.PI / 2 : -Math.PI / 2;
    bannerText.position.set(bx > 0 ? bx + 0.01 : bx - 0.01, 1.9, 0);
    trailerGroup.add(bannerText);
  });

  // Cửa đôi sau container có 4 thanh khóa
  [-0.6, -0.2, 0.2, 0.6].forEach((kx) => {
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 2.5, 6), chromeMat);
    rod.position.set(kx, 1.48, -6.13);
    trailerGroup.add(rod);
  });

  cGroup.add(trailerGroup);

  // Metadata
  const contData = {
    id,
    title: name,
    type: 'containerTruck',
    desc: 'Xe đầu kéo container 40 feet chuyên phục vụ vận chuyển linh kiện nhập khẩu CKD/SKD và xuất khẩu nguyên container thành phẩm DK Bike ra cảng Hải Phòng.',
    zone: 'DK1',
  };
  cGroup.userData = contData;
  mainCab.userData = contData;
  scene.add(cGroup);
  interactiveObjects.push(mainCab);

  return cGroup;
}

// 4. Tạo xe tải nhỏ 1.5 tấn giao hàng nhanh (1.5-Ton Light Delivery Truck)
function create1Point5TonDeliveryTruck(x, y, z, rotY, id, name) {
  const dGroup = new THREE.Group();
  dGroup.position.set(x, y, z);
  dGroup.rotation.y = rotY;

  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.35 });
  const blueMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });

  // Cabin nhỏ kiểu Kia Bongo / Hyundai Porter
  const cab = new THREE.Mesh(new THREE.BoxGeometry(1.85, 1.65, 1.55), whiteMat);
  cab.position.set(0, 1.35, 1.25);
  cab.castShadow = true;
  dGroup.add(cab);

  // Kính lái
  const windshield = new THREE.Mesh(
    new THREE.BoxGeometry(1.7, 0.75, 0.08),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1 })
  );
  windshield.position.set(0, 1.55, 2.03);
  dGroup.add(windshield);

  // Thùng hàng phía sau
  const box = new THREE.Mesh(new THREE.BoxGeometry(1.9, 1.85, 3.2), blueMat);
  box.position.set(0, 1.6, -1.05);
  box.castShadow = true;
  dGroup.add(box);

  // Logo DK Express trên thùng
  [-0.96, 0.96].forEach((bx) => {
    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(2.4, 0.65),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 })
    );
    sign.rotation.y = bx > 0 ? Math.PI / 2 : -Math.PI / 2;
    sign.position.set(bx, 1.65, -1.05);
    dGroup.add(sign);
  });

  // Bánh xe (4 bánh đơn)
  const wheelGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.24, 12);
  const wPositions = [
    [-0.85, 0.38, 1.25],
    [0.85, 0.38, 1.25],
    [-0.85, 0.38, -1.6],
    [0.85, 0.38, -1.6],
  ];
  wPositions.forEach((pos) => {
    const w = new THREE.Mesh(wheelGeo, darkMat);
    w.rotation.z = Math.PI / 2;
    w.position.set(...pos);
    w.castShadow = true;
    dGroup.add(w);
  });

  const truckData = {
    id,
    title: name,
    type: 'lightTruck',
    desc: 'Xe tải giao hàng nhanh 1.5 tấn phục vụ chuyển phát phụ tùng khẩn cấp và giao xe cho các đại lý khu vực lân cận.',
    zone: 'DK2',
  };
  dGroup.userData = truckData;
  cab.userData = truckData;
  scene.add(dGroup);
  interactiveObjects.push(cab);

  return dGroup;
}

// 5. Tạo xe đẩy pallet thủ công có người kéo (Hand Pallet Jack & Operator)
function createHandPalletJack(x, y, z, rotY, id, name) {
  const pjGroup = new THREE.Group();
  pjGroup.position.set(x, y, z);
  pjGroup.rotation.y = rotY;

  const redMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.35, metalness: 0.2 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 });

  // Thân máy bơm thủy lực
  const pump = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.42, 8), darkMat);
  pump.position.set(0, 0.32, 0);
  pjGroup.add(pump);

  // Cần đẩy chữ T nghiêng
  const tiller = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.95, 6), redMat);
  tiller.rotation.x = -Math.PI / 5;
  tiller.position.set(0, 0.75, 0.32);
  pjGroup.add(tiller);

  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.38, 6), darkMat);
  handle.rotation.z = Math.PI / 2;
  handle.position.set(0, 1.15, 0.58);
  pjGroup.add(handle);

  // Càng nâng thép đỏ
  [-0.22, 0.22].forEach((fx) => {
    const fork = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.06, 1.25), redMat);
    fork.position.set(fx, 0.12, -0.68);
    pjGroup.add(fork);
  });

  // Pallet hàng và thùng phụ tùng trên xe đẩy
  const pallet = new THREE.Mesh(
    new THREE.BoxGeometry(0.95, 0.1, 1.1),
    new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.85 })
  );
  pallet.position.set(0, 0.2, -0.68);
  pjGroup.add(pallet);

  const crate = new THREE.Mesh(
    new THREE.BoxGeometry(0.85, 0.55, 0.9),
    new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.65 })
  );
  crate.position.set(0, 0.52, -0.68);
  crate.castShadow = true;
  pjGroup.add(crate);

  // Nhân viên kho cầm tay lái xe kéo
  const worker = createCharacter({
    shirtColor: 0xea580c,
    pantsColor: 0x1e293b,
    hatColor: 0xfacc15,
  });
  worker.position.set(0, 0, 0.95);
  worker.rotation.y = Math.PI;
  pjGroup.add(worker);

  const pjData = {
    id,
    title: name,
    type: 'palletJack',
    desc: 'Xe nâng tay thủy lực 2.5 tấn phục vụ di chuyển linh kiện nội bộ giữa dây chuyền lắp ráp và cửa xuất hàng.',
    zone: 'DK1',
  };
  pjGroup.userData = pjData;
  crate.userData = pjData;
  scene.add(pjGroup);
  interactiveObjects.push(crate);

  return pjGroup;
}

// 6. Tạo đoàn xe kéo nhỏ chở hàng nội bộ (Electric Tugger Cart Train)
function createTuggerCartTrain(x, y, z, rotY, id, name) {
  const trainGroup = new THREE.Group();
  trainGroup.position.set(x, y, z);
  trainGroup.rotation.y = rotY;

  const yellowMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.35 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });

  // Xe đầu kéo điện 3 bánh
  const tugger = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.65, 1.8), yellowMat);
  body.position.set(0, 0.45, 0);
  tugger.add(body);

  const driver = createCharacter({ shirtColor: 0x0284c7, pantsColor: 0x1e293b, hatColor: 0x0284c7, isDriver: true });
  driver.position.set(0, 0.45, -0.2);
  tugger.add(driver);
  trainGroup.add(tugger);

  // 2 Rơ-moóc sàn phẳng chở thùng pin
  [-2.4, -4.6].forEach((cz) => {
    const cart = new THREE.Group();
    cart.position.set(0, 0, cz);

    const platform = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.12, 1.8), darkMat);
    platform.position.y = 0.28;
    cart.add(platform);

    // Thùng pin lithium và động cơ
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 0.5, 1.5),
      new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.6 })
    );
    box.position.set(0, 0.6, 0);
    cart.add(box);

    trainGroup.add(cart);
  });

  const trainData = {
    id,
    title: name,
    type: 'tuggerTrain',
    desc: 'Xe đầu kéo điện nội bộ vận chuyển các khay pin Lithium-ion và động cơ điện BLDC giữa kho tổng và xưởng sản xuất.',
    zone: 'DK2',
  };
  trainGroup.userData = trainData;
  body.userData = trainData;
  scene.add(trainGroup);
  interactiveObjects.push(body);

  return trainGroup;
}

// 7. Tạo giá đỡ khung xe máy điện chưa lắp ráp (CKD/SKD Bike Frames Cantilever Rack)
function createUnassembledFrameRack(x, y, z, rotY, id, name) {
  const rackGroup = new THREE.Group();
  rackGroup.position.set(x, y, z);
  rackGroup.rotation.y = rotY;

  const orangeMat = new THREE.MeshStandardMaterial({ color: 0xea580c, roughness: 0.4 }); // Cột kệ cam công nghiệp
  const blueMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.5 }); // Tay đỡ kệ xanh
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.45, metalness: 0.6 }); // Khung xe sơn tĩnh điện đen mờ

  // 3 Cột thép chịu lực
  [-1.4, 0, 1.4].forEach((cx) => {
    const col = new THREE.Mesh(new THREE.BoxGeometry(0.14, 2.6, 0.14), orangeMat);
    col.position.set(cx, 1.3, 0);
    rackGroup.add(col);

    // Chân đế chữ I
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.15, 1.4), orangeMat);
    base.position.set(cx, 0.08, 0);
    rackGroup.add(base);

    // 3 Tầng tay đỡ tay vươn (Cantilever Arms)
    [0.75, 1.45, 2.15].forEach((ay) => {
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 1.2), blueMat);
      arm.position.set(cx, ay, 0);
      rackGroup.add(arm);
    });
  });

  // Các khung xe máy điện hàn thô (CKD Chassis Tubes) xếp ngay ngắn trên các tầng
  [0.85, 1.55, 2.25].forEach((fy) => {
    [-0.9, 0.5].forEach((fx) => {
      const bikeFrame = new THREE.Group();
      bikeFrame.position.set(fx, fy, 0);

      // Cổ phốt & Dóng nghiêng chính
      const spine = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.95, 8), frameMat);
      spine.rotation.x = Math.PI / 4;
      bikeFrame.add(spine);

      // Khung đuôi gắp xe
      const rearSubframe = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.05, 0.65), frameMat);
      rearSubframe.position.set(0, -0.15, -0.32);
      bikeFrame.add(rearSubframe);

      rackGroup.add(bikeFrame);
    });
  });

  const rackData = {
    id,
    title: name,
    type: 'frameRack',
    desc: 'Kệ lưu trữ khung xe máy điện hàn sẵn (CKD/SKD) tiêu chuẩn chất lượng cao trước khi chuyển vào dây chuyền sơn tĩnh điện và lắp ráp.',
    zone: x > 0 ? 'DK1' : 'DK2',
  };
  rackGroup.userData = rackData;
  scene.add(rackGroup);

  return rackGroup;
}

function buildLogisticsAndEquipment() {
  // 1. Xe nâng điện Komatsu hiện đại (Khối 9: Mast thủy lực, càng nâng, cabin & đèn xoay amber)
  // Xe nâng 1 tham gia chu kỳ bốc dỡ tại Xưởng B
  createDetailedForklift(54.0, 0, -32.5, 0, 'forklift1', 'Xe nâng điện Komatsu FB25 #01 (Xưởng B)', { isActiveCycle: true });

  // Xe nâng 2 túc trực bốc dỡ tại Cửa Kho Linh Kiện D2.1
  createDetailedForklift(-48.0, 0, -60.0, Math.PI / 2, 'forklift2', 'Xe nâng điện Komatsu FB25 #02 (Kho D2.1)', { isActiveCycle: false });

  // 2. Xe đầu kéo container 40ft DK Logistics đỗ tại bãi chờ logistics Cổng 1
  create40ftContainerTruck(68.0, 0, -15.0, 0, 'containerHauler1', 'Xe đầu kéo container 40ft DK Logistics');

  // 3. Xe tải giao hàng nhanh 1.5 tấn DK Express tại sân DK2
  create1Point5TonDeliveryTruck(-32.0, 0, -40.0, Math.PI / 2, 'deliveryTruck1', 'Xe tải giao hàng nhanh 1.5T DK Express');

  // 4. Xe đẩy pallet thủy lực thủ công & nhân viên bốc hàng
  createHandPalletJack(62.0, 0, -29.0, -Math.PI / 3, 'palletJack1', 'Xe đẩy pallet thủy lực & Nhân viên kho');

  // 5. Đoàn xe kéo nhỏ chở linh kiện nội bộ phân khu DK2
  createTuggerCartTrain(-42.0, 0, -56.0, 0, 'tuggerTrain1', 'Đoàn xe kéo nhỏ nội bộ DK2');

  // 6. Kệ cantilever chữ A lưu trữ khung xe máy điện hàn sẵn (CKD/SKD)
  createUnassembledFrameRack(64.0, 0, -35.0, Math.PI / 2, 'frameRack1', 'Khu vực khung xe máy điện chờ lắp ráp (CKD/SKD)');
  createUnassembledFrameRack(-52.0, 0, -62.0, 0, 'frameRack2', 'Kệ khung xe đạp điện chưa lắp ráp Kho D2.1');

  // 7. Các chồng pallet gỗ & thùng carton phụ tùng xuất xưởng
  createPalletStack(58, 0, -31);
  createPalletStack(61, 0, -31);
  createPalletStack(-58, 0, -58);
  createPalletStack(-54, 0, -58);

  // Khởi tạo pallet hàng thành phẩm xe điện sẵn trong xưởng B
  warehouseReadyPallet = createForkliftPalletCargo('ebikes');
  warehouseReadyPallet.position.set(53.0, 0.05, -31.5);
  scene.add(warehouseReadyPallet);

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
  animatedBarriers.push({ armPivot, currentAngle: 0, targetAngle: 0, x, z, id });
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

// ============================================================================
// KHỐI 8: MÔ HÌNH XE MÁY ĐIỆN, XE ĐẠP ĐIỆN & PHƯƠNG TIỆN DK BIKE CAO CẤP
// ============================================================================

// 1. Xe máy điện DK Roma SX (Phong cách Retro thời thượng, bo tròn khí động học)
function createDKRomaSX(colorHex = 0xdc2626, name = 'DK Roma SX', options = {}) {
  const bikeGroup = new THREE.Group();
  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.9, roughness: 0.2 });
  const paintMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.28, metalness: 0.15 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.85 });
  const seatLeatherMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.75 });
  const rubberMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.95 });
  const goldLogoMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.8, roughness: 0.2 });

  // Khung thân chính bo tròn mềm mại
  const mainBody = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.52, 0.44), paintMat);
  mainBody.position.set(-0.05, 0.46, 0);
  mainBody.castShadow = true;
  bikeGroup.add(mainBody);

  // Đuôi xe vuốt cong giọt nước
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.48, 6), paintMat);
  tail.rotation.z = Math.PI / 2;
  tail.position.set(-0.75, 0.52, 0);
  tail.castShadow = true;
  bikeGroup.add(tail);

  // Yếm trước phong cách Ý (Front Shield with DK Badge)
  const shield = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.62, 0.46), paintMat);
  shield.rotation.z = -Math.PI / 16;
  shield.position.set(0.55, 0.62, 0);
  shield.castShadow = true;
  bikeGroup.add(shield);

  // Logo mạ vàng DK Bike trên mặt yếm
  const logoDecal = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.1, 0.18), goldLogoMat);
  logoDecal.position.set(0.66, 0.72, 0);
  bikeGroup.add(logoDecal);

  // Sàn để chân phẳng rộng rãi (Footboard)
  const footboard = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.08, 0.46), darkMat);
  footboard.position.set(0.18, 0.28, 0);
  footboard.receiveShadow = true;
  bikeGroup.add(footboard);

  // Yên xe đôi bọc da khâu chỉ nổi sang trọng
  const saddle = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.12, 0.36), seatLeatherMat);
  saddle.position.set(-0.18, 0.76, 0);
  saddle.castShadow = true;
  bikeGroup.add(saddle);

  // Tay dắt sau mạ crom
  const grabBar = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.02, 6, 12, Math.PI), chromeMat);
  grabBar.rotation.y = Math.PI / 2;
  grabBar.position.set(-0.62, 0.82, 0);
  bikeGroup.add(grabBar);

  // Đèn hậu LED đỏ
  const tailLight = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.08, 0.16),
    new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 0.6 })
  );
  tailLight.position.set(-0.95, 0.55, 0);
  bikeGroup.add(tailLight);

  // Cụm đầu xe & ghi-đông lái (Handlebar Assembly)
  const forkGroup = new THREE.Group();
  forkGroup.position.set(0.52, 0.85, 0);

  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.3, 8), chromeMat);
  stem.position.y = 0.15;
  forkGroup.add(stem);

  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.62, 8), chromeMat);
  bar.rotation.x = Math.PI / 2;
  bar.position.y = 0.28;
  forkGroup.add(bar);

  // 2 Gương chiếu hậu tròn mạ crom
  [-0.28, 0.28].forEach((mz) => {
    const stemM = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.18, 6), chromeMat);
    stemM.position.set(0, 0.38, mz);
    forkGroup.add(stemM);

    const mirror = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.02, 8), chromeMat);
    mirror.rotation.z = Math.PI / 3;
    mirror.position.set(-0.02, 0.48, mz);
    forkGroup.add(mirror);
  });

  // Đèn pha tròn mạ crom LED bi-xenon
  const headlamp = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.1, 12), chromeMat);
  headlamp.rotation.z = Math.PI / 2;
  headlamp.position.set(0.12, 0.24, 0);
  forkGroup.add(headlamp);

  const headlampGlass = new THREE.Mesh(
    new THREE.CircleGeometry(0.09, 12),
    new THREE.MeshBasicMaterial({ color: 0xfffbeb })
  );
  headlampGlass.rotation.y = Math.PI / 2;
  headlampGlass.position.set(0.18, 0.24, 0);
  forkGroup.add(headlampGlass);

  bikeGroup.add(forkGroup);

  // Vệt sáng đèn pha ban đêm (Soft spotlight projected ahead on ground)
  const headlightSpot = new THREE.SpotLight(0xfffbeb, 0.0, 16, Math.PI / 5, 0.4);
  headlightSpot.position.set(0.7, 0.9, 0);
  headlightSpot.target.position.set(7.0, 0, 0);
  bikeGroup.add(headlightSpot);
  bikeGroup.add(headlightSpot.target);
  vehicleHeadlights.push(headlightSpot);

  // Bánh xe & Vành đúc thể thao (Wheels with rotating rims)
  const makeWheel = (wx, isFront = false) => {
    const wGroup = new THREE.Group();
    wGroup.position.set(wx, 0.26, 0);

    const tire = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.065, 8, 16), rubberMat);
    tire.rotation.y = Math.PI / 2;
    tire.castShadow = true;
    wGroup.add(tire);

    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.08, 10), chromeMat);
    rim.rotation.z = Math.PI / 2;
    wGroup.add(rim);

    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.12, 8), darkMat);
    hub.rotation.z = Math.PI / 2;
    wGroup.add(hub);

    return wGroup;
  };

  const frontWheel = makeWheel(0.65, true);
  bikeGroup.add(frontWheel);

  const rearWheel = makeWheel(-0.62, false);
  bikeGroup.add(rearWheel);

  // Chân chống nghiêng (Kickstand)
  const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.32, 6), chromeMat);
  stand.rotation.z = Math.PI / 5;
  stand.position.set(-0.2, 0.14, 0.22);
  bikeGroup.add(stand);

  // Người lái tùy chọn (Optional seated rider)
  let riderGroup = null;
  if (options.withRider) {
    riderGroup = createCharacter({
      shirtColor: options.riderShirt || 0x0284c7,
      pantsColor: options.riderPants || 0x1e293b,
      hatType: 'helmet',
      hatColor: options.helmetColor || 0xfacc15,
      isDriver: true,
    });
    riderGroup.position.set(-0.12, 0.44, 0);
    riderGroup.rotation.y = Math.PI / 2;
    bikeGroup.add(riderGroup);
  }

  bikeGroup.userData = {
    id: 'bike_' + name,
    title: name,
    type: 'electricBike',
    desc: 'Mẫu xe máy điện Roma SX phong cách Ý thanh lịch của DK Bike, trang bị động cơ chống nước IP67 công suất 1200W, phanh đĩa an toàn, quãng đường di chuyển 80km/lần sạc.',
    frontWheel,
    rearWheel,
    forkGroup,
    riderGroup,
    headlightSpot,
  };

  return bikeGroup;
}

// 2. Xe máy điện DK Creer E (Neo-Retro Cổ Điển, Đèn Vuông, Ba-ga Inox)
function createDKCreerE(colorHex = 0x0284c7, name = 'DK Creer E', options = {}) {
  const bikeGroup = new THREE.Group();
  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.92, roughness: 0.18 });
  const paintMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.3, metalness: 0.1 });
  const creamMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.4 }); // Phối màu kem cổ điển
  const rubberMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.95 });

  // Thân xe hộp cổ điển
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.54, 0.42), paintMat);
  body.position.set(-0.06, 0.46, 0);
  body.castShadow = true;
  bikeGroup.add(body);

  // Ốp hông hai màu kem cổ điển (Two-tone side covers)
  [-0.22, 0.22].forEach((sz) => {
    const sidePanel = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.28, 0.04), creamMat);
    sidePanel.position.set(-0.15, 0.45, sz);
    bikeGroup.add(sidePanel);
  });

  // Mặt nạ trước với khe tản nhiệt mạ crom (Vintage front grille)
  const shield = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.64, 0.44), paintMat);
  shield.position.set(0.55, 0.62, 0);
  bikeGroup.add(shield);

  const grille = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.24, 0.18), chromeMat);
  grille.position.set(0.64, 0.62, 0);
  bikeGroup.add(grille);

  // Yên liền khối
  const saddle = new THREE.Mesh(
    new THREE.BoxGeometry(0.76, 0.11, 0.34),
    new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.85 })
  );
  saddle.position.set(-0.14, 0.77, 0);
  bikeGroup.add(saddle);

  // Giá chở hàng sau inox (Chrome Luggage Rack)
  const rack = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.04, 0.32), chromeMat);
  rack.position.set(-0.68, 0.82, 0);
  bikeGroup.add(rack);

  // Cụm đầu đèn vuông cổ điển
  const forkGroup = new THREE.Group();
  forkGroup.position.set(0.52, 0.86, 0);

  const headlamp = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.16, 0.18), chromeMat);
  headlamp.position.set(0.06, 0.22, 0);
  forkGroup.add(headlamp);

  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.64, 8), chromeMat);
  bar.rotation.x = Math.PI / 2;
  bar.position.y = 0.28;
  forkGroup.add(bar);

  bikeGroup.add(forkGroup);

  // Bánh xe
  const wFront = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.06, 8, 16), rubberMat);
  wFront.rotation.y = Math.PI / 2;
  wFront.position.set(0.62, 0.26, 0);
  bikeGroup.add(wFront);

  const wRear = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.06, 8, 16), rubberMat);
  wRear.rotation.y = Math.PI / 2;
  wRear.position.set(-0.62, 0.26, 0);
  bikeGroup.add(wRear);

  // Người lái tùy chọn
  let riderGroup = null;
  if (options.withRider) {
    riderGroup = createCharacter({
      shirtColor: options.riderShirt || 0xea580c,
      pantsColor: options.riderPants || 0x1e293b,
      hatType: 'cap',
      hatColor: options.helmetColor || 0x0284c7,
      isDriver: true,
    });
    riderGroup.position.set(-0.12, 0.44, 0);
    riderGroup.rotation.y = Math.PI / 2;
    bikeGroup.add(riderGroup);
  }

  bikeGroup.userData = {
    id: 'bike_' + name,
    title: name,
    type: 'electricBike',
    desc: 'Mẫu xe máy điện DK Creer E cổ điển kết hợp công nghệ hiện đại, đèn vuông độc đáo, ắc quy dung lượng lớn và hệ thống khóa chống trộm thông minh.',
    frontWheel: wFront,
    rearWheel: wRear,
    forkGroup,
    riderGroup,
  };

  return bikeGroup;
}

// 3. Xe đạp điện / Xe đạp thể thao DK Bike (Khung nan, pin lithium tháo rời)
function createDKElectricBicycle(colorHex = 0xf8fafc, name = 'DK E-Bike Sport', options = {}) {
  const bike = new THREE.Group();
  const frameMat = new THREE.MeshStandardMaterial({ color: colorHex, metalness: 0.6, roughness: 0.3 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 });

  // Khung gióng tam giác (Diamond Frame)
  const tube1 = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.85, 6), frameMat);
  tube1.rotation.z = Math.PI / 3.2;
  tube1.position.set(0.1, 0.58, 0);
  bike.add(tube1);

  const tube2 = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.72, 6), frameMat);
  tube2.rotation.z = -Math.PI / 3.4;
  tube2.position.set(-0.18, 0.62, 0);
  bike.add(tube2);

  const topTube = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.68, 6), frameMat);
  topTube.rotation.z = Math.PI / 2;
  topTube.position.set(0.02, 0.88, 0);
  bike.add(topTube);

  // Khối pin Lithium tích hợp gióng nghiêng (Integrated Battery Pack)
  const battery = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 0.09, 0.08),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4 })
  );
  battery.rotation.z = Math.PI / 3.2;
  battery.position.set(0.12, 0.56, 0);
  bike.add(battery);

  // Yên xe thể thao
  const saddle = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.05, 0.16), darkMat);
  saddle.position.set(-0.35, 0.94, 0);
  bike.add(saddle);

  // Ghi đông & Đèn LED
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.58, 6), frameMat);
  bar.rotation.x = Math.PI / 2;
  bar.position.set(0.42, 1.02, 0);
  bike.add(bar);

  const miniLamp = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.06, 0.08),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  miniLamp.position.set(0.48, 0.98, 0);
  bike.add(miniLamp);

  // Bánh xe nan hoa lớn 26 inch
  [-0.55, 0.55].forEach((wx) => {
    const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.035, 6, 20), darkMat);
    wheel.rotation.y = Math.PI / 2;
    wheel.position.set(wx, 0.34, 0);
    bike.add(wheel);
  });

  // Bàn đạp (Pedals & Crank)
  const crank = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.28, 6), darkMat);
  crank.rotation.x = Math.PI / 2;
  crank.position.set(-0.05, 0.32, 0);
  bike.add(crank);

  let riderGroup = null;
  if (options.withRider) {
    riderGroup = createCharacter({
      shirtColor: 0x16a34a,
      pantsColor: 0x1e293b,
      hatType: 'cap',
      hatColor: 0xffffff,
      isDriver: true,
    });
    riderGroup.position.set(-0.25, 0.52, 0);
    riderGroup.rotation.y = Math.PI / 2;
    bike.add(riderGroup);
  }

  bike.userData = {
    id: 'bike_' + name,
    title: name,
    type: 'electricBicycle',
    desc: 'Xe đạp trợ lực điện thông minh DK Bike, khung hợp kim nhôm siêu nhẹ, pin lithium 36V hỗ trợ đạp trợ lực lên đến 100km.',
    crank,
    riderGroup,
  };

  return bike;
}

// 4. Xe điện 3 bánh chở hàng DK Bike (Như ảnh drone dưới mái che xanh)
function createDKThreeWheelerCargo(colorHex = 0x0284c7, name = 'Xe điện 3 bánh DK', options = {}) {
  const group = new THREE.Group();
  const paintMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.35 });
  const steelMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7, roughness: 0.4 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.95 });

  // Đầu xe máy điện có kính chắn gió & đèn pha lớn
  const frontCab = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.7, 0.6), paintMat);
  frontCab.position.set(0.9, 0.65, 0);
  frontCab.castShadow = true;
  group.add(frontCab);

  const windshield = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.55, 0.55),
    new THREE.MeshStandardMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.6, roughness: 0.1 })
  );
  windshield.position.set(1.22, 1.15, 0);
  group.add(windshield);

  const headlamp = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.14, 0.1, 10),
    new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.8, roughness: 0.2 })
  );
  headlamp.rotation.z = Math.PI / 2;
  headlamp.position.set(1.38, 0.72, 0);
  group.add(headlamp);

  // Yên lái đơn
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.12, 0.48), darkMat);
  seat.position.set(0.45, 0.82, 0);
  group.add(seat);

  // Thùng xe chở hàng dài bằng thép gân có bửng nâng hạ (Cargo Tray)
  const bedFloor = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.12, 1.3), steelMat);
  bedFloor.position.set(-0.55, 0.55, 0);
  bedFloor.castShadow = true;
  bedFloor.receiveShadow = true;
  group.add(bedFloor);

  // Bửng thành thùng xung quanh
  [-0.64, 0.64].forEach((sz) => {
    const sideWall = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.45, 0.06), paintMat);
    sideWall.position.set(-0.55, 0.82, sz);
    sideWall.castShadow = true;
    group.add(sideWall);
  });

  const rearGate = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.45, 1.3), paintMat);
  rearGate.position.set(-1.48, 0.82, 0);
  rearGate.castShadow = true;
  group.add(rearGate);

  const frontBulkhead = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.65, 1.3), steelMat);
  frontBulkhead.position.set(0.38, 0.92, 0);
  group.add(frontBulkhead);

  // Hàng hóa mẫu trên thùng (Thùng carton linh kiện DK)
  const crateMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.8 });
  const crate1 = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.45, 0.55), crateMat);
  crate1.position.set(-0.35, 0.82, -0.25);
  group.add(crate1);

  const crate2 = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.38, 0.5), crateMat);
  crate2.position.set(-0.85, 0.78, 0.22);
  group.add(crate2);

  // 3 Bánh xe chịu tải
  const wFront = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.16, 10), darkMat);
  wFront.rotation.x = Math.PI / 2;
  wFront.position.set(1.15, 0.28, 0);
  group.add(wFront);

  [-0.66, 0.66].forEach((wz) => {
    const wRear = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.18, 10), darkMat);
    wRear.rotation.x = Math.PI / 2;
    wRear.position.set(-0.75, 0.28, wz);
    group.add(wRear);
  });

  group.userData = {
    id: 'bike3w_' + name,
    title: name,
    type: 'cargoBike',
    desc: 'Xe điện 3 bánh chở hàng chuyên dụng DK Bike, tải trọng 500kg, phục vụ luân chuyển linh kiện giữa các xưởng và kho thành phẩm.',
  };

  return group;
}

// 5. Xe bán tải trắng DK Logistics (White Pickup Truck - như ảnh drone)
function createDKPickupTruck(colorHex = 0xf8fafc, name = 'Xe bán tải DK Logistics') {
  const truck = new THREE.Group();
  const paintMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.25, metalness: 0.2 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.1, metalness: 0.8 });
  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.85, roughness: 0.2 });

  // Cabin đôi (Double Cab)
  const cab = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.25, 1.8), paintMat);
  cab.position.set(0.65, 0.95, 0);
  cab.castShadow = true;
  truck.add(cab);

  // Mui cabin
  const roof = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.1, 1.7), paintMat);
  roof.position.set(0.45, 1.62, 0);
  truck.add(roof);

  // Kính chắn gió trước & sau nghiêng
  const windshieldF = new THREE.Mesh(new THREE.PlaneGeometry(1.65, 0.65), glassMat);
  windshieldF.rotation.y = Math.PI / 2;
  windshieldF.rotation.z = -Math.PI / 6;
  windshieldF.position.set(1.65, 1.28, 0);
  truck.add(windshieldF);

  // Thùng chở hàng sau có thanh ray thể thao (Cargo Bed & Roll Bar)
  const bed = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.85, 1.8), paintMat);
  bed.position.set(-1.45, 0.78, 0);
  bed.castShadow = true;
  truck.add(bed);

  const rollBar = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.05, 6, 12, Math.PI), chromeMat);
  rollBar.rotation.y = Math.PI / 2;
  rollBar.position.set(-0.55, 1.45, 0);
  truck.add(rollBar);

  // Mặt ca-lăng & Đèn pha LED
  const grille = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.45, 1.4), darkMat);
  grille.position.set(1.88, 0.85, 0);
  truck.add(grille);

  [-0.65, 0.65].forEach((lz) => {
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.18, 0.32), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    lamp.position.set(1.88, 0.95, lz);
    truck.add(lamp);
  });

  // 4 Bánh xe bán tải lớn
  [[-0.9, -0.95], [-0.9, 0.95], [1.2, -0.95], [1.2, 0.95]].forEach(([wx, wz]) => {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.28, 12), darkMat);
    wheel.rotation.x = Math.PI / 2;
    wheel.position.set(wx, 0.42, wz);
    wheel.castShadow = true;
    truck.add(wheel);
  });

  truck.userData = {
    id: 'pickup_' + name,
    title: name,
    type: 'logisticsCar',
    desc: 'Xe bán tải công vụ phụ trách kỹ thuật, kiểm định đường trường và logistics lưu động của nhà máy DK Bike.',
  };

  return truck;
}

// Alias cho các hàm cũ gọi createDetailedDKBike
function createDetailedDKBike(colorHex, name) {
  return createDKRomaSX(colorHex, name);
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
// ============================================================================
// 12. Infrastructure: Flagpoles, Security Fence, Crosswalks & Streetlights
// ============================================================================
function buildFlagsAndStreetlights() {
  // Cụm 3 Cột cờ trước sảnh Nhà A (DK1): Cờ Tổ quốc ở giữa, Cờ DK Bike, Cờ Xanh Môi trường
  createFlagpole(23.2, 0, -23.0, 0xffb703, 8.0); // Cờ vàng cam DK Bike
  createFlagpole(25.0, 0, -23.0, 0xdc2626, 9.2); // Cờ đỏ sao vàng Việt Nam (ở giữa, cao nhất)
  createFlagpole(26.8, 0, -23.0, 0x0284c7, 8.0); // Cờ xanh dương ISO / Môi trường

  // Cụm 2 Cột cờ trước Nhà điều hành DK2
  createFlagpole(-41.0, 0, -22.0, 0xdc2626, 8.5); // Cờ Việt Nam
  createFlagpole(-43.0, 0, -22.0, 0xffb703, 8.0); // Cờ DK Bike

  // Hàng rào bảo vệ an ninh song sắt dọc mặt tiền đường ĐT234 (Perimeter Security Fence)
  buildPerimeterSecurityFences();

  // Vỉa hè, Bó vỉa bê tông & Vạch người đi bộ qua đường (Zebra Crossings)
  buildSidewalksAndCrosswalks();

  // Đèn đường chiếu sáng đô thị LED dọc trục đường ĐT234 & các tuyến nội bộ (sáng ban đêm)
  const lightPositions = [
    { x: -10, z: -90 },
    { x: -10, z: -68 },
    { x: -10, z: -45 },
    { x: -10, z: -22 },
    { x: -10, z: 2 },
    { x: -10, z: 25 },
    { x: 35, z: -24 },
    { x: 55, z: -24 },
    { x: 75, z: -24 },
    { x: 80, z: -48 },
    { x: 80, z: -70 },
    { x: -35, z: -22 },
    { x: -55, z: -24 },
    { x: -75, z: -24 },
    { x: -95, z: -40 },
  ];

  lightPositions.forEach((pos) => {
    createStreetlight(pos.x, 0, pos.z);
  });
}

// Hàng rào bảo vệ an ninh song sắt kiên cố mặt tiền ĐT234
function buildPerimeterSecurityFences() {
  const fenceMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5, metalness: 0.6 });
  const postMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.8 });
  const curbMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.85 });

  const buildFenceSegment = (startX, startZ, endZ) => {
    const group = new THREE.Group();
    const len = Math.abs(endZ - startZ);
    const midZ = (startZ + endZ) / 2;

    // Bệ bê tông bó chân hàng rào
    const curb = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, len), curbMat);
    curb.position.set(startX, 0.175, midZ);
    curb.receiveShadow = true;
    group.add(curb);

    // Trụ bê tông chịu lực mỗi 4m
    const numPosts = Math.floor(len / 4.0);
    for (let p = 0; p <= numPosts; p++) {
      const pz = startZ - p * 4.0;
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.42, 2.3, 0.42), postMat);
      post.position.set(startX, 1.15, pz);
      post.castShadow = true;
      group.add(post);

      // Chóp kim tự tháp trên đỉnh trụ
      const postCap = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.25, 4), postMat);
      postCap.position.set(startX, 2.42, pz);
      postCap.rotation.y = Math.PI / 4;
      group.add(postCap);
    }

    // Các gióng ngang & nan song sắt mạ kẽm
    [0.7, 1.4, 2.05].forEach((ry) => {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, len), fenceMat);
      rail.position.set(startX, ry, midZ);
      group.add(rail);
    });

    // Song sắt đứng
    const picketGeo = new THREE.CylinderGeometry(0.02, 0.02, 1.9, 4);
    const numPickets = Math.floor(len / 0.3);
    for (let pi = 0; pi < numPickets; pi++) {
      const pz = startZ - pi * 0.3;
      const picket = new THREE.Mesh(picketGeo, fenceMat);
      picket.position.set(startX, 1.25, pz);
      group.add(picket);
    }

    scene.add(group);
  };

  // Hàng rào mạn DK1 (Bên phải ĐT234): Chừa lối cổng chính DK1 (Z: -12 đến -23)
  buildFenceSegment(-6.0, -25.0, -85.0);
  buildFenceSegment(-6.0, -2.0, -10.0);

  // Hàng rào mạn DK2 (Bên trái ĐT234): Chừa lối cổng chính DK2 (Z: -14 đến -26)
  buildFenceSegment(-14.0, -27.0, -85.0);
  buildFenceSegment(-14.0, -2.0, -12.0);
}

// Vỉa hè, Bó vỉa bê tông & Vạch người đi bộ qua đường (Zebra Crossings)
function buildSidewalksAndCrosswalks() {
  const whitePaintMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const curbMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.85 });

  // 1. Vạch đi bộ qua đường (Zebra Crosswalk) nối Nhà A sang Bãi đỗ xe
  for (let z = -2; z <= 2; z++) {
    const stripe = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 0.45), whitePaintMat);
    stripe.rotation.x = -Math.PI / 2;
    stripe.position.set(35.0, 0.03, -26.5 + z * 0.85);
    scene.add(stripe);
  }

  // 2. Vạch đi bộ qua đường nối Nhà A sang Xưởng B
  for (let x = -2; x <= 2; x++) {
    const stripe = new THREE.Mesh(new THREE.PlaneGeometry(0.45, 3.2), whitePaintMat);
    stripe.rotation.x = -Math.PI / 2;
    stripe.position.set(51.0 + x * 0.85, 0.03, -26.5);
    scene.add(stripe);
  }

  // 3. Vạch đi bộ qua đường trước Nhà Ăn CBNV
  for (let z = -2; z <= 2; z++) {
    const stripe = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 0.45), whitePaintMat);
    stripe.rotation.x = -Math.PI / 2;
    stripe.position.set(34.0, 0.03, -15.0 + z * 0.85);
    scene.add(stripe);
  }

  // 4. Bó vỉa hè bê tông (Curb Stones) dọc mép đường trước Nhà A
  const curbNorth = new THREE.Mesh(new THREE.BoxGeometry(55.0, 0.18, 0.25), curbMat);
  curbNorth.position.set(40.0, 0.09, -28.35);
  curbNorth.receiveShadow = true;
  scene.add(curbNorth);

  const curbSouth = new THREE.Mesh(new THREE.BoxGeometry(55.0, 0.18, 0.25), curbMat);
  curbSouth.position.set(40.0, 0.09, -24.65);
  curbSouth.receiveShadow = true;
  scene.add(curbSouth);
}

function createFlagpole(x, y, z, flagColor, height = 8.0) {
  const group = new THREE.Group();
  group.position.set(x, y, z);

  // Cột cờ inox bóng mạ crom (Stainless steel pole)
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.12, height, 10),
    new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.15, metalness: 0.9 })
  );
  pole.position.y = height / 2;
  pole.castShadow = true;
  group.add(pole);

  // Bệ móng đá tròn
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.55, 0.65, 0.4, 8),
    new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.85 })
  );
  base.position.y = 0.2;
  group.add(base);

  // Quả cầu vàng trên đỉnh cột cờ
  const ball = new THREE.Mesh(
    new THREE.SphereGeometry(0.16, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.2, metalness: 0.8 })
  );
  ball.position.y = height + 0.1;
  group.add(ball);

  // Lá cờ vải uốn lượn trong gió
  const flagW = 2.4;
  const flagH = 1.5;
  const flagGeo = new THREE.PlaneGeometry(flagW, flagH, 10, 4);
  const flagMat = new THREE.MeshStandardMaterial({
    color: flagColor,
    roughness: 0.45,
    side: THREE.DoubleSide,
  });
  const flag = new THREE.Mesh(flagGeo, flagMat);
  flag.position.set(flagW / 2 + 0.05, height - flagH / 2 - 0.2, 0);
  flag.castShadow = true;
  group.add(flag);
  flagMeshes.push(flag);

  // Ngôi sao vàng nếu là cờ đỏ Việt Nam
  if (flagColor === 0xdc2626) {
    const starMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    const star = new THREE.Mesh(new THREE.CircleGeometry(0.35, 5), starMat);
    star.position.set(flagW / 2 + 0.05, height - flagH / 2 - 0.2, 0.02);
    group.add(star);
  }

  scene.add(group);
}

function createStreetlight(x, y, z) {
  const slGroup = new THREE.Group();
  slGroup.position.set(x, y, z);

  // Cột thép mạ kẽm cao 6.5m
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4, metalness: 0.7 });
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.14, 6.5, 8), poleMat);
  pole.position.y = 3.25;
  pole.castShadow = true;
  slGroup.add(pole);

  // Cần vươn đèn đường cong
  const arm = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 0.15), poleMat);
  arm.position.set(0.7, 6.4, 0);
  slGroup.add(arm);

  // Đèn LED chiếu sáng đô thị
  const lampGeo = new THREE.BoxGeometry(0.65, 0.14, 0.35);
  const lampMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0x000000,
    roughness: 0.2,
  });
  const lamp = new THREE.Mesh(lampGeo, lampMat);
  lamp.position.set(1.3, 6.32, 0);
  slGroup.add(lamp);
  streetLightLamps.push(lampMat);

  // Nguồn sáng tỏa xuống mặt đường ban đêm (PointLight)
  const light = new THREE.PointLight(0xfef08a, 0, 22);
  light.position.set(1.3, 6.0, 0);
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
  guardGate1 = guard1;
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
  caretaker.position.set(-106, 15.5, -86);
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

  // 8. Hai Cán bộ văn phòng thư giãn bên hồ cá Koi trước Nhà điều hành (Vị trí mới)
  const staff1 = createCharacter({ shirtColor: 0xffffff, pantsColor: 0x1e293b, hatColor: 0xffffff });
  staff1.position.set(-22.5, 0, -34.0);
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
  staff2.position.set(-21.5, 0, -35.2);
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

  // 9. Khu vực hiên Nhà Ăn CBNV: Cụm bàn ghế ăn trưa ngoài trời & Thưởng trà (Khối 7)
  const diningPatio = new THREE.Group();
  diningPatio.position.set(21, 0, -8.5);

  const tableWoodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.75 });
  const benchWoodMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.7 });
  const tableMetalMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7 });

  // Bàn ăn gỗ ngoài trời
  const tableTop = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.08, 1.2), tableWoodMat);
  tableTop.position.set(0, 0.76, 0);
  tableTop.castShadow = true;
  diningPatio.add(tableTop);

  // Chân bàn thép đen
  [-1.0, 1.0].forEach((tx) => {
    const tLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.76, 6), tableMetalMat);
    tLeg.position.set(tx, 0.38, 0);
    diningPatio.add(tLeg);
  });

  // 2 Băng ghế dài hai bên bàn
  [-0.9, 0.9].forEach((bz) => {
    const bench = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.06, 0.42), benchWoodMat);
    bench.position.set(0, 0.44, bz);
    bench.castShadow = true;
    diningPatio.add(bench);

    [-0.9, 0.9].forEach((bx) => {
      const bLeg = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.44, 0.38), tableMetalMat);
      bLeg.position.set(bx, 0.22, bz);
      diningPatio.add(bLeg);
    });
  });

  // Đĩa thức ăn, khay cơm và tách trà trên bàn
  const trayMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.3, metalness: 0.6 });
  const cupMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.2 });
  [-0.6, 0.2, 0.7].forEach((px) => {
    const foodTray = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.03, 0.28), trayMat);
    foodTray.position.set(px, 0.81, -0.2);
    diningPatio.add(foodTray);

    const teaCup = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.03, 0.08, 8), cupMat);
    teaCup.position.set(px + 0.14, 0.84, 0.2);
    diningPatio.add(teaCup);
  });

  // 3 Nhân sự ngồi ăn trưa & trò chuyện thư giãn
  const eater1 = createCharacter({
    shirtColor: 0x0284c7, // Công nhân DK Bike
    pantsColor: 0x1e293b,
    hatType: 'helmet',
    hatColor: 0xfacc15,
    role: 'worker',
    pose: 'sitting',
  });
  eater1.position.set(-0.6, 0, -0.9);
  eater1.rotation.y = 0;
  diningPatio.add(eater1);

  const eater2 = createCharacter({
    shirtColor: 0xf8fafc, // Nhân viên văn phòng
    pantsColor: 0x334155,
    hatType: 'hair',
    role: 'office',
    pose: 'sitting',
  });
  eater2.position.set(0.4, 0, -0.9);
  eater2.rotation.y = Math.PI / 12;
  diningPatio.add(eater2);

  const eater3 = createCharacter({
    shirtColor: 0xea580c, // Kỹ thuật viên bảo trì
    pantsColor: 0x1e293b,
    hatType: 'cap',
    hatColor: 0x0f172a,
    role: 'technician',
    pose: 'sitting',
  });
  eater3.position.set(-0.1, 0, 0.9);
  eater3.rotation.y = Math.PI;
  diningPatio.add(eater3);

  scene.add(diningPatio);
  socialGroups.push({ type: 'lunch', members: [eater1, eater2, eater3] });

  // 10. Nhóm 3 Cán bộ thảo luận công việc tại sân trước Nhà A (Khối 7)
  const convGroup = new THREE.Group();
  convGroup.position.set(34, 0, -25);

  const talker1 = createCharacter({
    shirtColor: 0xf8fafc,
    pantsColor: 0x1e293b,
    role: 'office',
    holdingTablet: true,
  });
  talker1.position.set(-0.6, 0, 0);
  talker1.rotation.y = Math.PI / 3;
  convGroup.add(talker1);

  const talker2 = createCharacter({
    shirtColor: 0x0284c7,
    pantsColor: 0x1e293b,
    role: 'worker',
    hatType: 'helmet',
    hatColor: 0xfacc15,
  });
  talker2.position.set(0.6, 0, -0.4);
  talker2.rotation.y = -Math.PI / 1.5;
  convGroup.add(talker2);

  const talker3 = createCharacter({
    shirtColor: 0x10b981,
    pantsColor: 0x334155,
    role: 'visitor',
    hasBackpack: true,
  });
  talker3.position.set(0, 0, 0.6);
  talker3.rotation.y = Math.PI;
  convGroup.add(talker3);

  scene.add(convGroup);
  socialGroups.push({ type: 'conversation', members: [talker1, talker2, talker3] });

  // 11. Đội ngũ công nhân bốc xếp tại cửa Xưởng B & Nhà C (Khối 7)
  const loader1 = createCharacter({
    shirtColor: 0xea580c,
    pantsColor: 0x1e293b,
    role: 'worker',
    hasVest: true,
  });
  loader1.position.set(56, 0, -31);
  loader1.rotation.y = -Math.PI / 4;
  scene.add(loader1);

  const loader2 = createCharacter({
    shirtColor: 0x0284c7,
    pantsColor: 0x1e293b,
    role: 'worker',
    hasVest: true,
    holdingTablet: true,
  });
  loader2.position.set(70, 0, -31.5);
  loader2.rotation.y = Math.PI * 0.6;
  scene.add(loader2);

  // 12. Nghệ nhân & Khách tham quan trên đồi sinh thái DK2 (Khối 7)
  // Người cho cá Koi ăn trên sàn gỗ ao cá đồi
  const koiFeeder = createCharacter({
    shirtColor: 0x0284c7,
    pantsColor: 0x475569,
    role: 'worker',
    hatType: 'cap',
    hatColor: 0x0284c7,
  });
  koiFeeder.position.set(-129, 16.5, -78);
  koiFeeder.rotation.y = Math.PI * 0.75;
  scene.add(koiFeeder);

  // Người chăm sóc đàn gà & chim bồ câu trên đồi gà
  const chickenKeeper = createCharacter({
    shirtColor: 0x16a34a,
    pantsColor: 0x78350f,
    hatType: 'conical', // Nón lá mộc mạc
    role: 'farmer',
  });
  chickenKeeper.position.set(-140, 15.5, -38);
  chickenKeeper.rotation.y = Math.PI * 0.4;
  scene.add(chickenKeeper);

  // 13. Khởi tạo 16 Người đi bộ năng động theo mạng lưới Waypoint Graph khắp khuôn viên
  const wanderingCount = CONFIG.PEOPLE ? CONFIG.PEOPLE.wanderingCount : 16;
  for (let i = 0; i < wanderingCount; i++) {
    createRandomCampusPedestrian(i);
  }

  // 14. Sân bóng chuyền ngoài trời & Các cầu thủ (theo khoanh đỏ ảnh 1)
  buildVolleyballCourt();

  // 15. Đài phun nước trung tâm (có chữ DK) đường kính 5 mét giữa Nhà Ăn và Sân bóng chuyền
  buildDKFountain();

  // 16. Cây xanh chuyển từ trong sân bóng chuyền sang vị trí cách Nhà Ăn 10 mét
  buildLandscapeTree10m();
}

// Khởi tạo người đi bộ ngẫu nhiên trên mạng lưới Waypoint Graph (Khối 7)
function createRandomCampusPedestrian(pedId) {
  const rand = Math.random();
  let role = 'worker';
  let shirtColor = 0x0284c7;
  let pantsColor = 0x1e293b;
  let hatType = 'helmet';
  let hatColor = 0xfacc15;
  let holdingTablet = false;
  let hasBackpack = false;
  let backpackColor = null;

  if (rand < 0.38) {
    role = 'worker';
    shirtColor = Math.random() < 0.5 ? 0x0284c7 : 0xea580c;
    pantsColor = 0x1e293b;
    hatType = 'helmet';
    hatColor = Math.random() < 0.7 ? 0xfacc15 : 0xffffff;
  } else if (rand < 0.65) {
    role = 'office';
    shirtColor = Math.random() < 0.5 ? 0xf8fafc : 0xbae6fd;
    pantsColor = Math.random() < 0.5 ? 0x1e293b : 0x334155;
    hatType = 'hair';
    hatColor = null;
  } else if (rand < 0.80) {
    role = 'technician';
    shirtColor = 0xf97316;
    pantsColor = 0x1e293b;
    hatType = 'cap';
    hatColor = 0x0f172a;
    holdingTablet = Math.random() < 0.45;
  } else if (rand < 0.90) {
    role = 'security';
    shirtColor = 0x1e3a8a;
    pantsColor = 0x0f172a;
    hatType = 'security';
    hatColor = 0x1e3a8a;
  } else {
    role = 'visitor';
    const visitorColors = [0xef4444, 0x10b981, 0xf59e0b, 0x8b5cf6, 0x06b6d4];
    shirtColor = visitorColors[Math.floor(Math.random() * visitorColors.length)];
    pantsColor = Math.random() < 0.5 ? 0x1e293b : 0x3b82f6;
    hatType = Math.random() < 0.5 ? 'cap' : 'hair';
    hatColor = shirtColor;
    hasBackpack = Math.random() < 0.6;
    backpackColor = 0xd97706;
  }

  const skinColors = [0xfbd38d, 0xf6ad55, 0xed8936, 0xffedd5];
  const skinColor = skinColors[Math.floor(Math.random() * skinColors.length)];
  const hairColors = [0x171717, 0x271c19, 0x451a03];
  const hairColor = hairColors[Math.floor(Math.random() * hairColors.length)];
  const heightScale = 0.93 + Math.random() * 0.14;

  const charMesh = createCharacter({
    role,
    shirtColor,
    pantsColor,
    hatType,
    hatColor,
    skinColor,
    hairColor,
    holdingTablet,
    hasBackpack,
    backpackColor,
    heightScale,
  });

  // Chọn waypoint xuất phát ngẫu nhiên
  const startWPIndex = Math.floor(Math.random() * CAMPUS_WAYPOINTS.length);
  const startWP = CAMPUS_WAYPOINTS[startWPIndex];
  const neighbors = startWP.neighbors;
  const targetWPIndex = neighbors[Math.floor(Math.random() * neighbors.length)];

  // Độ lệch nhẹ hai bên lề đường
  const offsetX = (Math.random() - 0.5) * 1.2;
  const offsetZ = (Math.random() - 0.5) * 1.2;

  charMesh.position.set(startWP.x + offsetX, startWP.y || 0, startWP.z + offsetZ);
  scene.add(charMesh);

  wanderingPedestrians.push({
    id: pedId,
    mesh: charMesh,
    role,
    currentIndex: startWPIndex,
    targetIndex: targetWPIndex,
    lastIndex: startWPIndex,
    offsetX,
    offsetZ,
    speed: 1.4 + Math.random() * 0.7,
    stepAngle: Math.random() * Math.PI * 2,
    pauseTimer: Math.random() < 0.25 ? 1.5 + Math.random() * 2.5 : 0,
    holdingTablet,
  });
}

// Hàm khởi tạo mô hình nhân vật Low-Poly dễ thương tỉ lệ chuẩn diorama (Khối 7)
function createCharacter({
  shirtColor = 0x0284c7,
  pantsColor = 0x1e293b,
  hatColor = 0xfacc15,
  hatType = 'auto',
  skinColor = 0xfbd38d,
  hairColor = 0x271c19,
  holdingTablet = false,
  isDriver = false,
  role = 'worker',
  pose = 'idle',
  jerseyNumber = null,
  hasVest = false,
  shoeColor = null,
  hasBackpack = false,
  backpackColor = null,
  heightScale = 1.0,
}) {
  const charGroup = new THREE.Group();

  // Materials
  const skinMat = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.65 });
  const shirtMat = new THREE.MeshStandardMaterial({ color: shirtColor, roughness: 0.7 });
  const pantsMat = new THREE.MeshStandardMaterial({ color: pantsColor, roughness: 0.8 });
  const hatMat = new THREE.MeshStandardMaterial({ color: hatColor || 0xfacc15, roughness: 0.4 });
  const hairMat = new THREE.MeshStandardMaterial({ color: hairColor, roughness: 0.85 });
  const darkDetailMat = new THREE.MeshBasicMaterial({ color: 0x1e293b });
  const whiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const silverMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.2, metalness: 0.8 });
  const shoeMat = new THREE.MeshStandardMaterial({ color: shoeColor || (role === 'athlete' ? 0xffffff : 0x0f172a), roughness: 0.85 });

  // Đăng ký vật liệu phản quang áo bảo hộ / mũ
  if (role === 'worker' || role === 'kcs' || hasVest) {
    nightReflectiveMaterials.push(silverMat);
  }

  // 0. BLOB SHADOW DƯỚI CHÂN (Khối 7: Bóng đổ phẳng low-poly dễ thương)
  const shadowGeo = new THREE.CircleGeometry(0.32, 10);
  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x0f172a,
    transparent: true,
    opacity: 0.28,
    depthWrite: false,
  });
  const blobShadow = new THREE.Mesh(shadowGeo, shadowMat);
  blobShadow.rotation.x = -Math.PI / 2;
  blobShadow.position.y = 0.015;
  charGroup.add(blobShadow);

  // 1. HEAD & FACE
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.48, 0);

  // Faceted stylized head
  const headGeo = new THREE.BoxGeometry(0.24, 0.25, 0.24);
  const head = new THREE.Mesh(headGeo, skinMat);
  head.castShadow = true;
  headGroup.add(head);

  // Expressive dark eyes
  const eyeGeo = new THREE.BoxGeometry(0.04, 0.045, 0.02);
  const leftEye = new THREE.Mesh(eyeGeo, darkDetailMat);
  leftEye.position.set(-0.065, 0.025, 0.125);
  headGroup.add(leftEye);

  const rightEye = new THREE.Mesh(eyeGeo, darkDetailMat);
  rightEye.position.set(0.065, 0.025, 0.125);
  headGroup.add(rightEye);

  // Eye highlights
  const hlGeo = new THREE.BoxGeometry(0.015, 0.015, 0.02);
  const hlLeft = new THREE.Mesh(hlGeo, whiteMat);
  hlLeft.position.set(-0.075, 0.035, 0.128);
  headGroup.add(hlLeft);
  const hlRight = new THREE.Mesh(hlGeo, whiteMat);
  hlRight.position.set(0.055, 0.035, 0.128);
  headGroup.add(hlRight);

  // Stylized nose
  const nose = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.05, 0.04), skinMat);
  nose.position.set(0, -0.01, 0.135);
  headGroup.add(nose);

  // Smile / mouth line
  const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.015, 0.02), darkDetailMat);
  mouth.position.set(0, -0.065, 0.125);
  headGroup.add(mouth);

  // Ears
  const earGeo = new THREE.BoxGeometry(0.03, 0.06, 0.04);
  const leftEar = new THREE.Mesh(earGeo, skinMat);
  leftEar.position.set(-0.13, 0.01, 0);
  headGroup.add(leftEar);
  const rightEar = new THREE.Mesh(earGeo, skinMat);
  rightEar.position.set(0.13, 0.01, 0);
  headGroup.add(rightEar);

  // Hair (base sculpted hair)
  const hair = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.11, 0.26), hairMat);
  hair.position.set(0, 0.10, -0.01);
  headGroup.add(hair);

  // Sideburns
  const sbGeo = new THREE.BoxGeometry(0.02, 0.08, 0.04);
  const sbLeft = new THREE.Mesh(sbGeo, hairMat);
  sbLeft.position.set(-0.125, 0.04, 0.04);
  headGroup.add(sbLeft);
  const sbRight = new THREE.Mesh(sbGeo, hairMat);
  sbRight.position.set(0.125, 0.04, 0.04);
  headGroup.add(sbRight);

  // Headwear logic
  let resolvedHat = hatType;
  if (resolvedHat === 'auto') {
    if (role === 'athlete') resolvedHat = 'headband';
    else if (role === 'farmer') resolvedHat = 'conical';
    else if (role === 'security') resolvedHat = 'security';
    else if (hatColor) resolvedHat = 'helmet';
    else resolvedHat = 'hair';
  }

  if (resolvedHat === 'helmet') {
    // Industrial safety helmet with brim and reflective strip
    const helmetCrown = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.165, 0.12, 8), hatMat);
    helmetCrown.position.set(0, 0.16, 0);
    helmetCrown.castShadow = true;
    headGroup.add(helmetCrown);

    const helmetBrim = new THREE.Mesh(
      new THREE.CylinderGeometry(0.19, 0.19, 0.025, 8, 1, false, 0, Math.PI * 1.1),
      hatMat
    );
    helmetBrim.position.set(0, 0.11, 0.02);
    headGroup.add(helmetBrim);

    // Reflective strip around helmet
    const strip = new THREE.Mesh(new THREE.CylinderGeometry(0.155, 0.155, 0.02, 8), silverMat);
    strip.position.set(0, 0.145, 0);
    headGroup.add(strip);
  } else if (resolvedHat === 'security') {
    // Mũ Kepi bảo vệ màu xanh đen viền bạc
    const capCrown = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.16, 0.09, 8), hatMat);
    capCrown.position.set(0, 0.14, 0);
    headGroup.add(capCrown);

    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.02, 0.12), darkDetailMat);
    visor.position.set(0, 0.10, 0.14);
    visor.rotation.x = Math.PI / 10;
    headGroup.add(visor);

    const badge = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.05, 0.02), silverMat);
    badge.position.set(0, 0.14, 0.165);
    headGroup.add(badge);
  } else if (resolvedHat === 'cap') {
    // Baseball cap with visor
    const capCrown = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.10, 8), hatMat);
    capCrown.position.set(0, 0.14, 0);
    headGroup.add(capCrown);

    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.02, 0.12), hatMat);
    visor.position.set(0, 0.10, 0.14);
    visor.rotation.x = Math.PI / 12;
    headGroup.add(visor);
  } else if (resolvedHat === 'conical') {
    // Nón lá Việt Nam
    const coneHat = new THREE.Mesh(
      new THREE.ConeGeometry(0.38, 0.17, 12),
      new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.9 })
    );
    coneHat.position.set(0, 0.20, 0);
    coneHat.castShadow = true;
    headGroup.add(coneHat);
  } else if (resolvedHat === 'headband') {
    // Athletic sweatband
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.155, 0.155, 0.035, 8), whiteMat);
    band.position.set(0, 0.07, 0);
    headGroup.add(band);
  }

  charGroup.add(headGroup);
  charGroup.userData.headGroup = headGroup;

  // 2. NECK & COLLAR
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.10, 6), skinMat);
  neck.position.set(0, 1.33, 0);
  charGroup.add(neck);

  // 3. TORSO
  const torsoGroup = new THREE.Group();
  torsoGroup.position.set(0, 1.05, 0);

  // Tapered upper chest
  const chest = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.32, 0.24), shirtMat);
  chest.position.set(0, 0.12, 0);
  chest.castShadow = true;
  torsoGroup.add(chest);

  // Tapered abdomen / waist
  const waist = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.24, 0.22), shirtMat);
  waist.position.set(0, -0.12, 0);
  waist.castShadow = true;
  torsoGroup.add(waist);

  // Safety reflective vest (for workers or high-vis personnel)
  if (hasVest || role === 'worker' || role === 'kcs') {
    const vestMat = new THREE.MeshStandardMaterial({ color: 0x84cc16, roughness: 0.6 }); // Fluorescent lime
    nightReflectiveMaterials.push(vestMat);

    const vestChest = new THREE.Mesh(new THREE.BoxGeometry(0.446, 0.30, 0.246), vestMat);
    vestChest.position.set(0, 0.12, 0);
    torsoGroup.add(vestChest);

    // Silver reflective strips on vest
    const refBand1 = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.03, 0.25), silverMat);
    refBand1.position.set(0, 0.16, 0);
    torsoGroup.add(refBand1);

    const refBand2 = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.03, 0.25), silverMat);
    refBand2.position.set(0, 0.06, 0);
    torsoGroup.add(refBand2);
  }

  // Office tie / lanyard
  if (role === 'office') {
    const tieMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4 });
    const tie = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.26, 0.02), tieMat);
    tie.position.set(0, 0.08, 0.125);
    torsoGroup.add(tie);
  }

  // Security badge on chest
  if (role === 'security') {
    const sBadge = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.07, 0.02), silverMat);
    sBadge.position.set(-0.11, 0.18, 0.125);
    torsoGroup.add(sBadge);
  }

  // Visitor backpack
  if (hasBackpack) {
    const packMat = new THREE.MeshStandardMaterial({ color: backpackColor || 0xd97706, roughness: 0.7 });
    const pack = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.32, 0.12), packMat);
    pack.position.set(0, 0.08, -0.16);
    pack.castShadow = true;
    torsoGroup.add(pack);
  }

  // Athlete Jersey number badge
  if (role === 'athlete' && jerseyNumber) {
    const numBadge = new THREE.Mesh(
      new THREE.PlaneGeometry(0.16, 0.14),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    numBadge.position.set(0, 0.14, 0.123);
    torsoGroup.add(numBadge);

    const numBack = new THREE.Mesh(
      new THREE.PlaneGeometry(0.20, 0.16),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    numBack.rotation.y = Math.PI;
    numBack.position.set(0, 0.14, -0.123);
    torsoGroup.add(numBack);
  }

  // Belt with metallic buckle
  const belt = new THREE.Mesh(
    new THREE.BoxGeometry(0.39, 0.06, 0.23),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 })
  );
  belt.position.set(0, -0.22, 0);
  torsoGroup.add(belt);

  const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.065, 0.02), silverMat);
  buckle.position.set(0, -0.22, 0.12);
  torsoGroup.add(buckle);

  charGroup.add(torsoGroup);

  // 4. LEGS & SHOES (Pivoted at hips y = 0.82)
  const createLeg = (offsetX) => {
    const legGroup = new THREE.Group();
    legGroup.position.set(offsetX, 0.82, 0);

    const isAthlete = role === 'athlete';

    // Thigh
    const thigh = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.40, 0.18), pantsMat);
    thigh.position.set(0, -0.20, 0);
    thigh.castShadow = true;
    legGroup.add(thigh);

    // Shin / Lower leg
    if (isAthlete) {
      const shin = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.24, 0.15), skinMat);
      shin.position.set(0, -0.46, 0);
      legGroup.add(shin);

      const sock = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.16), whiteMat);
      sock.position.set(0, -0.62, 0);
      legGroup.add(sock);
    } else {
      const shin = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.36, 0.17), pantsMat);
      shin.position.set(0, -0.50, 0);
      shin.castShadow = true;
      legGroup.add(shin);
    }

    // Shoe
    const shoeSole = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.07, 0.27), whiteMat);
    shoeSole.position.set(0, -0.78, 0.04);
    legGroup.add(shoeSole);

    const shoeUpper = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.10, 0.24), shoeMat);
    shoeUpper.position.set(0, -0.71, 0.03);
    shoeUpper.castShadow = true;
    legGroup.add(shoeUpper);

    return legGroup;
  };

  const leftLeg = createLeg(-0.11);
  const rightLeg = createLeg(0.11);
  charGroup.add(leftLeg);
  charGroup.add(rightLeg);
  charGroup.userData.leftLeg = leftLeg;
  charGroup.userData.rightLeg = rightLeg;

  // 5. ARMS & HANDS (Pivoted at shoulders y = 1.32)
  const createArm = (offsetX, isLeft) => {
    const armGroup = new THREE.Group();
    armGroup.position.set(offsetX, 1.32, 0);

    const isAthlete = role === 'athlete';

    // Shoulder joint
    const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 6), isAthlete ? skinMat : shirtMat);
    shoulder.position.set(0, 0, 0);
    armGroup.add(shoulder);

    // Upper arm
    const upperArm = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.24, 0.12),
      isAthlete ? skinMat : shirtMat
    );
    upperArm.position.set(0, -0.12, 0);
    upperArm.castShadow = true;
    armGroup.add(upperArm);

    // Forearm
    const forearm = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.24, 0.10), skinMat);
    forearm.position.set(0, -0.32, 0);
    forearm.castShadow = true;
    armGroup.add(forearm);

    // Hand with palm and thumb
    const hand = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.10, 0.08), skinMat);
    hand.position.set(0, -0.47, 0);
    armGroup.add(hand);

    const thumb = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.05, 0.04), skinMat);
    thumb.position.set(isLeft ? 0.05 : -0.05, -0.45, 0.02);
    armGroup.add(thumb);

    return armGroup;
  };

  const leftArm = createArm(-0.25, true);
  const rightArm = createArm(0.25, false);
  charGroup.add(leftArm);
  charGroup.add(rightArm);
  charGroup.userData.leftArm = leftArm;
  charGroup.userData.rightArm = rightArm;

  // 6. POSES, ACCESSORIES & FLASHLIGHT
  if (role === 'security') {
    // Đèn pin cầm tay phát sáng ban đêm
    const flGroup = new THREE.Group();
    const flBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.03, 0.22, 6),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3, metalness: 0.7 })
    );
    flBody.rotation.x = Math.PI / 2;
    flGroup.add(flBody);

    const flLens = new THREE.Mesh(new THREE.CircleGeometry(0.03, 6), new THREE.MeshBasicMaterial({ color: 0xfef08a }));
    flLens.position.z = 0.115;
    flGroup.add(flLens);

    const flLight = new THREE.PointLight(0xfef08a, 0, 14, 1.8);
    flLight.position.set(0, 0, 0.22);
    flGroup.add(flLight);
    securityFlashlights.push(flLight);

    flGroup.position.set(0, -0.42, 0.1);
    rightArm.add(flGroup);
    rightArm.rotation.x = -Math.PI / 6;
  }

  if (holdingTablet) {
    const tab = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.03, 0.36),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2 })
    );
    tab.position.set(0, 1.05, 0.25);
    charGroup.add(tab);

    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(0.24, 0.32),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    screen.rotation.x = -Math.PI / 2;
    screen.position.set(0, 1.07, 0.25);
    charGroup.add(screen);

    rightArm.rotation.x = -Math.PI / 3.5;
    rightArm.rotation.y = -Math.PI / 8;
    leftArm.rotation.x = -Math.PI / 3.5;
    leftArm.rotation.y = Math.PI / 8;
  }

  if (isDriver) {
    leftLeg.rotation.x = -Math.PI / 2.6;
    rightLeg.rotation.x = -Math.PI / 2.6;
    leftArm.rotation.x = -Math.PI / 3.2;
    rightArm.rotation.x = -Math.PI / 3.2;
  }

  if (pose === 'spike') {
    rightArm.rotation.x = -2.6;
    rightArm.rotation.z = -0.3;
    leftArm.rotation.x = -1.2;
    leftArm.rotation.z = 0.2;
    leftLeg.rotation.x = 0.3;
    rightLeg.rotation.x = 0.2;
  } else if (pose === 'set') {
    rightArm.rotation.x = -2.2;
    rightArm.rotation.z = -0.3;
    leftArm.rotation.x = -2.2;
    leftArm.rotation.z = 0.3;
    charGroup.position.y = 0.1;
  } else if (pose === 'bump') {
    leftLeg.rotation.x = -0.45;
    rightLeg.rotation.x = -0.45;
    leftArm.rotation.x = -0.95;
    leftArm.rotation.z = 0.15;
    rightArm.rotation.x = -0.95;
    rightArm.rotation.z = -0.15;
    charGroup.position.y = -0.15;
  } else if (pose === 'block') {
    rightArm.rotation.x = -2.9;
    rightArm.rotation.z = -0.15;
    leftArm.rotation.x = -2.9;
    leftArm.rotation.z = 0.15;
  } else if (pose === 'sitting') {
    leftLeg.rotation.x = -Math.PI / 2;
    rightLeg.rotation.x = -Math.PI / 2;
    leftArm.rotation.x = -Math.PI / 4;
    rightArm.rotation.x = -Math.PI / 4;
  }

  if (heightScale && heightScale !== 1.0) {
    charGroup.scale.set(heightScale, heightScale, heightScale);
  }

  return charGroup;
}

// ============================================================================
// Sân bóng chuyền ngoài trời & Các cầu thủ thi đấu (Ảnh 1)
// ============================================================================
function buildVolleyballCourt() {
  volleyballCourtGroup = new THREE.Group();
  volleyballCourtGroup.position.set(51, 0, -12);
  volleyballCourtGroup.userData = {
    id: 'volleyballCourt',
    title: 'Sân bóng chuyền phong trào DK Bike',
    type: 'sports',
    desc: 'Sân bóng chuyền tiêu chuẩn mặt đệm acrylic ngoài trời phục vụ rèn luyện thể chất sau giờ làm việc cho CBNV nhà máy DK Bike. Đang diễn ra trận đấu giao hữu sôi nổi giữa Xưởng Lắp Ráp DK1 và Khối Kỹ Thuật R&D.',
    zone: 'DK1',
  };

  // 1. Acrylic Court Base & Markings (Standard 18m x 9m court + 22m x 13m perimeter pad)
  const padGeo = new THREE.PlaneGeometry(22, 13);
  const padMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.8 }); // Royal Ocean Blue run-off
  const pad = new THREE.Mesh(padGeo, padMat);
  pad.rotation.x = -Math.PI / 2;
  pad.position.y = 0.035;
  pad.receiveShadow = true;
  volleyballCourtGroup.add(pad);

  // Inner court (18m along X, 9m along Z) in vibrant Olympic terracotta orange
  const courtGeo = new THREE.PlaneGeometry(18, 9);
  const courtMat = new THREE.MeshStandardMaterial({ color: 0xea580c, roughness: 0.75 });
  const court = new THREE.Mesh(courtGeo, courtMat);
  court.rotation.x = -Math.PI / 2;
  court.position.y = 0.04;
  court.receiveShadow = true;
  volleyballCourtGroup.add(court);

  // White boundary lines (0.12m width)
  const lineMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });
  
  // End lines (x = -9 and x = 9)
  [-9, 9].forEach((lx) => {
    const endLine = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 9), lineMat);
    endLine.rotation.x = -Math.PI / 2;
    endLine.position.set(lx, 0.045, 0);
    volleyballCourtGroup.add(endLine);
  });

  // Side lines (z = -4.5 and z = 4.5)
  [-4.5, 4.5].forEach((lz) => {
    const sideLine = new THREE.Mesh(new THREE.PlaneGeometry(18, 0.12), lineMat);
    sideLine.rotation.x = -Math.PI / 2;
    sideLine.position.set(0, 0.045, lz);
    volleyballCourtGroup.add(sideLine);
  });

  // Center line under net (x = 0)
  const centerLine = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 9), lineMat);
  centerLine.rotation.x = -Math.PI / 2;
  centerLine.position.set(0, 0.045, 0);
  volleyballCourtGroup.add(centerLine);

  // 3-meter attack lines (x = -3 and x = 3)
  [-3, 3].forEach((ax) => {
    const attackLine = new THREE.Mesh(new THREE.PlaneGeometry(0.10, 9), lineMat);
    attackLine.rotation.x = -Math.PI / 2;
    attackLine.position.set(ax, 0.045, 0);
    volleyballCourtGroup.add(attackLine);
  });

  // 2. Net & Steel Posts
  const postMat = new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.6, roughness: 0.3 });
  const postGeo = new THREE.CylinderGeometry(0.08, 0.08, 2.7, 8);
  [-5.2, 5.2].forEach((pz) => {
    const post = new THREE.Mesh(postGeo, postMat);
    post.position.set(0, 1.35, pz);
    post.castShadow = true;
    volleyballCourtGroup.add(post);

    // Post padding protector
    const pPad = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 1.2, 8), postMat);
    pPad.position.set(0, 0.6, pz);
    volleyballCourtGroup.add(pPad);
  });

  // Net Mesh (height 1.0m, spans from z = -4.7 to 4.7, top at y = 2.43m)
  const netMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.65,
    roughness: 0.9,
    side: THREE.DoubleSide,
    wireframe: true,
  });
  const netMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.01, 1.0), netMat);
  netMesh.scale.set(1, 1, 9.4);
  netMesh.rotation.y = Math.PI / 2;
  netMesh.position.set(0, 1.93, 0);
  volleyballCourtGroup.add(netMesh);

  // White top tape (băng viền mép trên 7cm)
  const tapeMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
  const topTape = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.08, 9.4), tapeMat);
  topTape.position.set(0, 2.43, 0);
  volleyballCourtGroup.add(topTape);

  const botTape = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.05, 9.4), tapeMat);
  botTape.position.set(0, 1.43, 0);
  volleyballCourtGroup.add(botTape);

  // Red/white striped antenna rods on top of net
  [-4.5, 4.5].forEach((az) => {
    const antenna = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.015, 0.8, 6),
      new THREE.MeshBasicMaterial({ color: 0xef4444 })
    );
    antenna.position.set(0, 2.83, az);
    volleyballCourtGroup.add(antenna);
  });

  // 3. Referee High Chair (Ghế trọng tài đứng)
  const refGroup = new THREE.Group();
  refGroup.position.set(0, 0, 5.8);
  const ladderMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, metalness: 0.5 });
  const standBase = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.1, 1.0), ladderMat);
  standBase.position.y = 0.05;
  refGroup.add(standBase);
  const standPlatform = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.08, 0.8), ladderMat);
  standPlatform.position.y = 1.9;
  refGroup.add(standPlatform);
  for (let c = 0; c < 4; c++) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.9, 6), ladderMat);
    leg.position.set((c % 2 === 0 ? 0.35 : -0.35), 0.95, (c < 2 ? 0.3 : -0.3));
    refGroup.add(leg);
  }
  // Referee standing on chair
  const refPerson = createCharacter({
    shirtColor: 0xffffff,
    pantsColor: 0x1e293b,
    hatType: 'cap',
    hatColor: 0xef4444,
    role: 'athlete',
  });
  refPerson.position.set(0, 1.94, 0);
  refPerson.rotation.y = -Math.PI / 2;
  refGroup.add(refPerson);
  volleyballCourtGroup.add(refGroup);

  // 4. Scoreboard & Sideline Player Bench
  const benchGroup = new THREE.Group();
  benchGroup.position.set(0, 0, -6.5);
  const benchWood = new THREE.Mesh(
    new THREE.BoxGeometry(4.0, 0.1, 0.5),
    new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.8 })
  );
  benchWood.position.y = 0.45;
  benchGroup.add(benchWood);
  [-1.6, 1.6].forEach((bx) => {
    const bLeg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.45, 0.45), ladderMat);
    bLeg.position.set(bx, 0.225, 0);
    benchGroup.add(bLeg);
  });
  // Cheering teammates on bench
  const sub1 = createCharacter({
    shirtColor: 0xdc2626,
    pantsColor: 0x1e293b,
    hatType: 'headband',
    role: 'athlete',
    pose: 'sitting',
  });
  sub1.position.set(-1.0, 0.45, 0);
  sub1.rotation.y = Math.PI / 2;
  benchGroup.add(sub1);

  const sub2 = createCharacter({
    shirtColor: 0x06b6d4,
    pantsColor: 0xffffff,
    hatType: 'cap',
    hatColor: 0x06b6d4,
    role: 'athlete',
    pose: 'sitting',
  });
  sub2.position.set(1.0, 0.45, 0);
  sub2.rotation.y = Math.PI / 2;
  benchGroup.add(sub2);

  // Scoreboard: DK BIKE CUP 2026
  const sbPole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.2, 6), ladderMat);
  sbPole.position.set(3.2, 1.1, 0);
  benchGroup.add(sbPole);
  const sbBoard = new THREE.Mesh(
    new THREE.BoxGeometry(1.6, 0.8, 0.08),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4 })
  );
  sbBoard.position.set(3.2, 1.8, 0);
  benchGroup.add(sbBoard);
  volleyballCourtGroup.add(benchGroup);

  // 5. 6 ACTIVE PLAYERS IN THE MATCH
  // Team A (DK1 Assembly Team - Red jerseys #7, #10, #3)
  const pA1 = createCharacter({
    shirtColor: 0xdc2626,
    pantsColor: 0x1e293b,
    hatType: 'headband',
    role: 'athlete',
    pose: 'spike',
    jerseyNumber: '7',
  });
  pA1.position.set(-1.8, 0, -1.0); // Spiker near net
  pA1.rotation.y = Math.PI / 2;
  volleyballCourtGroup.add(pA1);
  volleyballPlayers.push({ group: pA1, role: 'spikerA', rightArm: pA1.userData.rightArm });

  const pA2 = createCharacter({
    shirtColor: 0xdc2626,
    pantsColor: 0x1e293b,
    hatType: 'hair',
    role: 'athlete',
    pose: 'set',
    jerseyNumber: '10',
  });
  pA2.position.set(-2.0, 0, 2.5); // Setter
  pA2.rotation.y = Math.PI / 2.5;
  volleyballCourtGroup.add(pA2);
  volleyballPlayers.push({ group: pA2, role: 'setterA' });

  const pA3 = createCharacter({
    shirtColor: 0xdc2626,
    pantsColor: 0x1e293b,
    hatType: 'cap',
    hatColor: 0xdc2626,
    role: 'athlete',
    pose: 'bump',
    jerseyNumber: '3',
  });
  pA3.position.set(-6.5, 0, 0); // Libero / Defender
  pA3.rotation.y = Math.PI / 2;
  volleyballCourtGroup.add(pA3);
  volleyballPlayers.push({ group: pA3, role: 'liberoA' });

  // Team B (R&D Technical Team - Cyan jerseys #8, #5, #1)
  const pB1 = createCharacter({
    shirtColor: 0x06b6d4,
    pantsColor: 0xffffff,
    hatType: 'headband',
    role: 'athlete',
    pose: 'block',
    jerseyNumber: '8',
  });
  pB1.position.set(1.8, 0, -1.0); // Blocker at net
  pB1.rotation.y = -Math.PI / 2;
  volleyballCourtGroup.add(pB1);
  volleyballPlayers.push({ group: pB1, role: 'blockerB' });

  const pB2 = createCharacter({
    shirtColor: 0x06b6d4,
    pantsColor: 0xffffff,
    hatType: 'hair',
    role: 'athlete',
    pose: 'set',
    jerseyNumber: '5',
  });
  pB2.position.set(2.5, 0, 2.5); // Setter / Spiker B
  pB2.rotation.y = -Math.PI / 2.5;
  volleyballCourtGroup.add(pB2);
  volleyballPlayers.push({ group: pB2, role: 'spikerB' });

  const pB3 = createCharacter({
    shirtColor: 0x06b6d4,
    pantsColor: 0xffffff,
    hatType: 'cap',
    hatColor: 0x06b6d4,
    role: 'athlete',
    pose: 'bump',
    jerseyNumber: '1',
  });
  pB3.position.set(6.5, 0, 0); // Receiver / Defender
  pB3.rotation.y = -Math.PI / 2;
  volleyballCourtGroup.add(pB3);
  volleyballPlayers.push({ group: pB3, role: 'defenderB' });

  // 6. Tricolor Animated Volleyball
  const ballGeo = new THREE.DodecahedronGeometry(0.18, 2);
  const ballMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    roughness: 0.35,
    metalness: 0.1,
  });
  volleyballMesh = new THREE.Mesh(ballGeo, ballMat);
  volleyballMesh.position.set(51, 2.4, -12);
  volleyballMesh.castShadow = true;
  scene.add(volleyballMesh);

  scene.add(volleyballCourtGroup);
  interactiveObjects.push(volleyballCourtGroup);
}

// ============================================================================
// Đài phun nước trung tâm (có chữ DK) đường kính khoảng 5 mét giữa Nhà Ăn và Sân bóng chuyền
// ============================================================================
function buildDKFountain() {
  fountainGroup = new THREE.Group();
  fountainGroup.position.set(36.6, 0, -12);
  fountainGroup.userData = {
    id: 'fountainDK',
    title: 'Đài phun nước trung tâm DK Bike (Đường kính 5m)',
    type: 'landscape',
    desc: 'Đài phun nước nghệ thuật đường kính 5 mét với biểu tượng chữ DK mạ vàng rực rỡ, hồ nước xanh ngọc đa tầng cùng hệ thống tia phun nước và đèn LED đổi màu ban đêm. Tọa lạc hài hòa giữa Nhà Ăn CBNV và Sân bóng chuyền DK1.',
    zone: 'DK1',
  };

  // 1. Đế đá hoa cương tròn & Thành bể đài phun (Outer diameter 5.0m, height 0.48m)
  const stoneMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0, // Đá granite trắng xám sáng bóng
    roughness: 0.35,
    metalness: 0.15,
  });

  // Đĩa chân móng ngầm
  const foundation = new THREE.Mesh(new THREE.CylinderGeometry(2.65, 2.65, 0.08, 32), stoneMat);
  foundation.position.y = 0.04;
  foundation.receiveShadow = true;
  fountainGroup.add(foundation);

  // Thành bể ngoài (Radius 2.5m, Height 0.48m)
  const basinWall = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.55, 0.48, 32), stoneMat);
  basinWall.position.y = 0.24;
  basinWall.castShadow = true;
  basinWall.receiveShadow = true;
  fountainGroup.add(basinWall);

  // Gờ vòm bo tròn mềm mại miệng bể (Bullnose rim)
  const rimMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.25, metalness: 0.2 });
  const basinRim = new THREE.Mesh(new THREE.TorusGeometry(2.38, 0.14, 12, 32), rimMat);
  basinRim.rotation.x = Math.PI / 2;
  basinRim.position.y = 0.48;
  fountainGroup.add(basinRim);

  // Lòng hồ lát gạch mosaic xanh ngọc
  const poolFloor = new THREE.Mesh(
    new THREE.CylinderGeometry(2.26, 2.26, 0.05, 32),
    new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4 })
  );
  poolFloor.position.y = 0.12;
  poolFloor.receiveShadow = true;
  fountainGroup.add(poolFloor);

  // 2. Mặt nước ngọc bích cách điệu lung linh
  fountainWaterMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(2.26, 2.26, 0.04, 32),
    createStylizedWaterMaterial(false)
  );
  fountainWaterMesh.position.y = 0.40;
  fountainGroup.add(fountainWaterMesh);

  // 3. Đèn LED âm nước đổi màu huyền ảo (Aquamarine & Cyan)
  const ledColors = [0x06b6d4, 0x38bdf8, 0x06b6d4, 0x38bdf8];
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2;
    const light = new THREE.PointLight(ledColors[i], 0.75, 7.0);
    light.position.set(Math.cos(angle) * 1.5, 0.45, Math.sin(angle) * 1.5);
    fountainGroup.add(light);
  }

  // 4. Trụ đài phun nước trung tâm 2 tầng nghệ thuật
  // Tầng 1: Chân đế cổ điển
  const pedestalBase = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.95, 0.55, 16), stoneMat);
  pedestalBase.position.y = 0.275;
  pedestalBase.castShadow = true;
  fountainGroup.add(pedestalBase);

  // Bát tràn nước tầng 1 (Lower Overflow Tier Bowl - Đường kính 2.1m)
  const tierBowl = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 0.48, 0.26, 24), stoneMat);
  tierBowl.position.y = 0.92;
  tierBowl.castShadow = true;
  fountainGroup.add(tierBowl);

  const tierRim = new THREE.Mesh(new THREE.TorusGeometry(1.02, 0.08, 10, 24), rimMat);
  tierRim.rotation.x = Math.PI / 2;
  tierRim.position.y = 1.05;
  fountainGroup.add(tierRim);

  const tierWater = new THREE.Mesh(new THREE.CylinderGeometry(0.98, 0.98, 0.04, 24), createStylizedWaterMaterial(false));
  tierWater.position.y = 1.02;
  fountainGroup.add(tierWater);

  // Tầng 2: Cột trụ đỡ điêu khắc chữ DK
  const upperPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.52, 0.75, 16), stoneMat);
  upperPillar.position.y = 1.42;
  upperPillar.castShadow = true;
  fountainGroup.add(upperPillar);

  // Bệ đỡ chữ DK
  const emblemPlinth = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.12, 0.45), stoneMat);
  emblemPlinth.position.y = 1.82;
  emblemPlinth.castShadow = true;
  fountainGroup.add(emblemPlinth);

  // 5. TÁC PHẨM ĐIÊU KHẮC BIỂU TƯỢNG CHỮ "DK" MẠ VÀNG (Golden 3D Monogram)
  fountainDKLogo = new THREE.Group();
  fountainDKLogo.position.set(0, 1.88, 0);

  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15, // Vàng kim loại rực rỡ
    metalness: 0.88,
    roughness: 0.22,
    envMapIntensity: 1.5,
  });

  // --- Chữ D (Rộng 0.65m, Cao 0.9m, Dày 0.16m) ---
  const dGroup = new THREE.Group();
  dGroup.position.set(-0.38, 0, 0);

  // Cột đứng chữ D
  const dSpine = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.88, 0.16), goldMat);
  dSpine.position.set(-0.24, 0.44, 0);
  dSpine.castShadow = true;
  dGroup.add(dSpine);

  // Thanh ngang trên
  const dTop = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.14, 0.16), goldMat);
  dTop.position.set(-0.06, 0.81, 0);
  dTop.castShadow = true;
  dGroup.add(dTop);

  // Thanh ngang dưới
  const dBot = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.14, 0.16), goldMat);
  dBot.position.set(-0.06, 0.07, 0);
  dBot.castShadow = true;
  dGroup.add(dBot);

  // Cột cong bên phải chữ D
  const dRight = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.64, 0.16), goldMat);
  dRight.position.set(0.14, 0.44, 0);
  dRight.castShadow = true;
  dGroup.add(dRight);

  // Góc vát chéo nối cong trên và dưới của chữ D
  const dCornerTop = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.14, 0.16), goldMat);
  dCornerTop.rotation.z = -Math.PI / 4;
  dCornerTop.position.set(0.08, 0.74, 0);
  dGroup.add(dCornerTop);

  const dCornerBot = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.14, 0.16), goldMat);
  dCornerBot.rotation.z = Math.PI / 4;
  dCornerBot.position.set(0.08, 0.14, 0);
  dGroup.add(dCornerBot);

  fountainDKLogo.add(dGroup);

  // --- Chữ K (Rộng 0.65m, Cao 0.9m, Dày 0.16m) ---
  const kGroup = new THREE.Group();
  kGroup.position.set(0.38, 0, 0);

  // Cột đứng chữ K
  const kSpine = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.88, 0.16), goldMat);
  kSpine.position.set(-0.16, 0.44, 0);
  kSpine.castShadow = true;
  kGroup.add(kSpine);

  // Nhánh chéo trên chữ K
  const kUpperArm = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.58, 0.16), goldMat);
  kUpperArm.rotation.z = -Math.PI / 3.8;
  kUpperArm.position.set(0.10, 0.62, 0);
  kUpperArm.castShadow = true;
  kGroup.add(kUpperArm);

  // Nhánh chéo dưới chữ K
  const kLowerArm = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.58, 0.16), goldMat);
  kLowerArm.rotation.z = Math.PI / 3.8;
  kLowerArm.position.set(0.10, 0.25, 0);
  kLowerArm.castShadow = true;
  kGroup.add(kLowerArm);

  // Ngôi sao vàng nhỏ đính giữa chữ D và K
  const starGeo = new THREE.DodecahedronGeometry(0.12, 0);
  const starMesh = new THREE.Mesh(starGeo, goldMat);
  starMesh.position.set(0, 0.44, 0.08);
  fountainDKLogo.add(starMesh);

  fountainGroup.add(fountainDKLogo);

  // 6. Hệ thống tia phun nước động (Dynamic Water Jets)
  const sprayMat = new THREE.MeshStandardMaterial({
    color: 0xe0f2fe,
    roughness: 0.1,
    transparent: true,
    opacity: 0.75,
  });

  // Cột nước phun vọt cao chính giữa (Center Geyser Jet)
  const centerJetGeo = new THREE.ConeGeometry(0.22, 1.6, 12, 1, true);
  const centerJet = new THREE.Mesh(centerJetGeo, sprayMat);
  centerJet.position.set(0, 3.2, 0);
  centerJet.rotation.x = Math.PI; // Loa dần lên trên
  fountainGroup.add(centerJet);
  fountainJets.push({ mesh: centerJet, type: 'center', baseScaleY: 1.0, baseY: 3.2 });

  // 8 Tia nước hình vòng cung phun từ mép bể vào tâm (8 Perimeter Arc Jets)
  const jetCount = 8;
  for (let j = 0; j < jetCount; j++) {
    const angle = (j * Math.PI * 2) / jetCount;
    const r = 2.05;
    const jx = Math.cos(angle) * r;
    const jz = Math.sin(angle) * r;

    const nozzle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.05, 0.12, 8),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8 })
    );
    nozzle.position.set(jx, 0.48, jz);
    nozzle.lookAt(0, 1.4, 0);
    fountainGroup.add(nozzle);

    // Dòng nước cong phun vào
    const jetArcGeo = new THREE.CylinderGeometry(0.02, 0.055, 1.4, 8);
    const jetArc = new THREE.Mesh(jetArcGeo, sprayMat);
    jetArc.position.set(jx * 0.65, 0.85, jz * 0.65);
    jetArc.lookAt(0, 1.6, 0);
    jetArc.rotation.x += Math.PI / 2;
    fountainGroup.add(jetArc);
    fountainJets.push({ mesh: jetArc, type: 'arc', index: j });
  }

  // 7. Vòng sóng lan tỏa trên mặt nước (Ripples)
  const rippleGeo = new THREE.RingGeometry(0.4, 0.48, 32);
  const rippleMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6, side: THREE.DoubleSide });
  const ripple = new THREE.Mesh(rippleGeo, rippleMat);
  ripple.rotation.x = -Math.PI / 2;
  ripple.position.set(0, 0.405, 0);
  fountainGroup.add(ripple);
  fountainJets.push({ mesh: ripple, type: 'ripple' });

  scene.add(fountainGroup);
  interactiveObjects.push(basinWall);
  interactiveObjects.push(dSpine);
}

// ============================================================================
// Cây xanh cảnh quan chuyển từ trong sân bóng chuyền sang cách Nhà Ăn 10 mét
// ============================================================================
function buildLandscapeTree10m() {
  landscapeFeatureTree = new THREE.Group();
  // Nhà Ăn có tâm z = -12, mép nam là z = -6.2. 10m về phía Nam là z = 4.0, x = 23.0
  landscapeFeatureTree.position.set(23.0, 0, 4.0);
  landscapeFeatureTree.userData = {
    id: 'landscapeTree',
    title: 'Cây bóng mát cảnh quan khuôn viên (Cách Nhà Ăn 10m)',
    type: 'landscape',
    desc: 'Cây bóng mát tán rộng nhiều tầng được quy hoạch trồng trong bồn đá tròn sang trọng, cách cửa Nhà Ăn CBNV đúng 10 mét, tạo bóng râm xanh mát cho lối dạo bộ và cảnh quan xanh thân thiện môi trường của nhà máy.',
    zone: 'DK1',
  };

  // 1. Bồn cây tròn ốp đá granite xám tự nhiên (Raised circular planter)
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.75 });
  const planterWall = new THREE.Mesh(new THREE.CylinderGeometry(1.65, 1.75, 0.42, 20), stoneMat);
  planterWall.position.y = 0.21;
  planterWall.castShadow = true;
  planterWall.receiveShadow = true;
  landscapeFeatureTree.add(planterWall);

  // Viền đá bo tròn miệng bồn cây
  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(1.65, 0.09, 10, 24),
    new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.4 })
  );
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.42;
  landscapeFeatureTree.add(rim);

  // Lớp đất nâu dinh dưỡng & thảm cỏ xanh
  const soil = new THREE.Mesh(
    new THREE.CylinderGeometry(1.55, 1.55, 0.08, 20),
    new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.95 })
  );
  soil.position.y = 0.35;
  landscapeFeatureTree.add(soil);

  const lawn = new THREE.Mesh(
    new THREE.CylinderGeometry(1.5, 1.5, 0.02, 20),
    new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.85 })
  );
  lawn.position.y = 0.39;
  landscapeFeatureTree.add(lawn);

  // 2. Thân cây cổ thụ vững chãi, phân nhánh tự nhiên (Shade Tree Trunk)
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c3d2e, roughness: 0.9, flatShading: true });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.44, 2.8, 8), trunkMat);
  trunk.position.y = 1.75;
  trunk.castShadow = true;
  landscapeFeatureTree.add(trunk);

  // Cành nhánh xòe
  [-0.35, 0.35].forEach((bx, idx) => {
    const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.22, 1.2, 6), trunkMat);
    branch.rotation.z = idx === 0 ? Math.PI / 5 : -Math.PI / 5;
    branch.rotation.y = (idx * Math.PI) / 2;
    branch.position.set(bx, 2.7, 0);
    branch.castShadow = true;
    landscapeFeatureTree.add(branch);
  });

  // 3. Tán lá xum xuê 4 tầng bóng mát (Tiered Emerald & Lime Green Canopy)
  const foliageMat1 = createWindFoliageMaterial(0x16a34a, 0.8);
  const foliageMat2 = createWindFoliageMaterial(0x22c55e, 0.82);
  const foliageMat3 = createWindFoliageMaterial(0x4ade80, 0.78);

  const tiers = [
    { y: 2.6, r: 2.1, h: 0.75, mat: foliageMat1 },
    { y: 3.3, r: 1.75, h: 0.70, mat: foliageMat2 },
    { y: 3.9, r: 1.35, h: 0.65, mat: foliageMat3 },
    { y: 4.5, r: 0.9, h: 0.55, mat: foliageMat2 },
  ];

  tiers.forEach((t) => {
    const tierMesh = new THREE.Mesh(new THREE.DodecahedronGeometry(t.r, 1), t.mat);
    tierMesh.scale.set(1.0, t.h / t.r, 1.0);
    tierMesh.position.y = t.y;
    tierMesh.castShadow = true;
    landscapeFeatureTree.add(tierMesh);
  });

  // 4. Đèn hắt cây nghệ thuật ban đêm (Night Uplights)
  [-1.1, 1.1].forEach((lx) => {
    const uplight = new THREE.PointLight(0xfef08a, 0.6, 6.0);
    uplight.position.set(lx, 0.46, 0);
    landscapeFeatureTree.add(uplight);
  });

  scene.add(landscapeFeatureTree);
  interactiveObjects.push(planterWall);
  interactiveObjects.push(trunk);
}

// ============================================================================
// Ao cá đồi sinh thái DK2 (Theo mũi tên ảnh 2 - Tăng kích thước lớn & Nước cách điệu)
// ============================================================================
function buildDK2HillPond() {
  const hpCfg = CONFIG.WATER.hillPond;
  const pondBaseX = hpCfg.position ? hpCfg.position.x : -132.0;
  const pondBaseZ = hpCfg.position ? hpCfg.position.z : -76.0;
  const pondBaseY = getDK2HillSurfaceY(pondBaseX, pondBaseZ) + 0.6; // ~ 17.4m trên đỉnh đồi cạnh Vườn Lan
  const pondGroup = new THREE.Group();
  pondGroup.position.set(pondBaseX, pondBaseY, pondBaseZ);
  pondGroup.userData = {
    id: 'aoCaDK2',
    title: 'Ao cá đồi sinh thái DK2 (Cạnh Vườn Lan)',
    type: 'landscape',
    desc: 'Hồ cá sinh thái tự nhiên được dịch chuyển lên sườn đồi cao cạnh Vườn Lan theo hướng mũi tên, nguồn nước trong xanh mát lành nuôi thả các loài cá Koi và cá chép Nhật. Điểm dừng chân thư giãn có sàn gỗ ngắm toàn cảnh nhà máy từ trên cao.',
    zone: 'DK2',
  };

  const radiusX = hpCfg.radiusX; // 16.5m
  const radiusZ = hpCfg.radiusZ; // 12.0m

  // Bệ kè đá bậc thang đồi nâng đỡ lòng hồ kiên cố
  const terraceGeo = new THREE.CylinderGeometry(hpCfg.terraceRadius, hpCfg.terraceRadius + 2.5, hpCfg.terraceHeight, 36);
  const terraceMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.9, flatShading: true });
  const terraceBase = new THREE.Mesh(terraceGeo, terraceMat);
  terraceBase.position.y = -hpCfg.terraceHeight / 2;
  terraceBase.receiveShadow = true;
  pondGroup.add(terraceBase);

  // 1. Natural Granite & Mossy Boulder Retaining Rim (48 tảng đá viền hồ tự nhiên)
  const boulderMat = new THREE.MeshStandardMaterial({ color: 0x52525b, roughness: 0.9, flatShading: true });
  const mossMat = new THREE.MeshStandardMaterial({ color: 0x365314, roughness: 0.85, flatShading: true });
  const boulderGeo = new THREE.DodecahedronGeometry(1.0, 1);
  const boulderCount = 48;

  for (let i = 0; i < boulderCount; i++) {
    const angle = (i / boulderCount) * Math.PI * 2;
    const bx = Math.cos(angle) * (radiusX + Math.sin(angle * 4) * 0.75);
    const bz = Math.sin(angle) * (radiusZ + Math.cos(angle * 3) * 0.65);
    const s = 0.85 + Math.random() * 0.6;

    const boulder = new THREE.Mesh(boulderGeo, i % 3 === 0 ? mossMat : boulderMat);
    boulder.position.set(bx, (Math.random() - 0.5) * 0.25, bz);
    boulder.scale.set(s, s * 0.8, s);
    boulder.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    boulder.castShadow = true;
    boulder.receiveShadow = true;
    pondGroup.add(boulder);
  }

  // 2. Bờ cát thoai thoải viền trong bờ đá hồ cá
  const sandRimGeo = new THREE.RingGeometry(radiusX - 1.5, radiusX + 0.2, 48);
  const sandRimMat = new THREE.MeshStandardMaterial({
    color: CONFIG.GROUND.sandColor,
    roughness: 0.95,
    side: THREE.DoubleSide,
  });
  const sandRim = new THREE.Mesh(sandRimGeo, sandRimMat);
  sandRim.rotation.x = -Math.PI / 2;
  sandRim.scale.set(1.0, radiusZ / radiusX, 1.0);
  sandRim.position.y = 0.04;
  sandRim.receiveShadow = true;
  pondGroup.add(sandRim);

  // 3. Mặt nước hồ cách điệu (Stylized Shader Nước với Gradient độ sâu & Vệt Caustics)
  const waterGeo = new THREE.CircleGeometry(radiusX - 0.2, 48);
  const waterMat = createStylizedWaterMaterial(false);
  hillPondWater = new THREE.Mesh(waterGeo, waterMat);
  hillPondWater.rotation.x = -Math.PI / 2;
  hillPondWater.scale.set(1.0, radiusZ / radiusX, 1.0);
  hillPondWater.position.y = 0.08;
  pondGroup.add(hillPondWater);

  // 4. 24 Floating Lotus Pads & 10 Pink Blossoms (Quần thể hoa sen & lá súng mặt nước)
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.7, flatShading: true });
  const flowerMat = new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.5 });
  const centerMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });

  for (let l = 0; l < 24; l++) {
    const lang = (l / 24) * Math.PI * 2 + Math.random() * 0.3;
    const lradX = (radiusX * 0.25) + Math.random() * (radiusX * 0.55);
    const lradZ = (radiusZ * 0.25) + Math.random() * (radiusZ * 0.55);
    const lx = Math.cos(lang) * lradX;
    const lz = Math.sin(lang) * lradZ;

    const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.02, 7), leafMat);
    pad.position.set(lx, 0.10, lz);
    pad.rotation.y = Math.random() * Math.PI;
    pondGroup.add(pad);

    if (l % 2 === 0) {
      const fl = new THREE.Group();
      fl.position.set(lx, 0.12, lz);
      for (let p = 0; p < 6; p++) {
        const petal = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.2, 4), flowerMat);
        petal.rotation.z = Math.PI / 4;
        petal.rotation.y = (p / 6) * Math.PI * 2;
        fl.add(petal);
      }
      const stamen = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 6), centerMat);
      stamen.position.y = 0.07;
      fl.add(stamen);
      pondGroup.add(fl);
    }
  }

  // 5. Sàn gỗ ngắm cảnh & Cầu tàu câu cá nhô ra mặt hồ (Wooden Viewing Deck)
  const timberMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.85 });
  const deckGroup = new THREE.Group();
  deckGroup.position.set(radiusX * 0.62, 0.15, -radiusZ * 0.15);

  // Deck floor (6.0m x 4.8m)
  const deckFloor = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.10, 5.0), timberMat);
  deckFloor.receiveShadow = true;
  deckGroup.add(deckFloor);

  // Deck pilings
  const pileMat = new THREE.MeshStandardMaterial({ color: 0x5c3d2e, roughness: 0.9 });
  [
    { x: -2.3, z: -2.2 },
    { x: 2.3, z: -2.2 },
    { x: -2.3, z: 2.2 },
    { x: 2.3, z: 2.2 },
    { x: 0, z: -2.2 },
    { x: 0, z: 2.2 },
  ].forEach((pp) => {
    const pile = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.8, 6), pileMat);
    pile.position.set(pp.x, -0.85, pp.z);
    deckGroup.add(pile);
  });

  // Deck railings
  const railPostGeo = new THREE.BoxGeometry(0.08, 0.95, 0.08);
  const railBarGeo = new THREE.BoxGeometry(0.05, 0.08, 5.0);
  const railPost1 = new THREE.Mesh(railPostGeo, timberMat);
  railPost1.position.set(-2.5, 0.48, -2.4);
  deckGroup.add(railPost1);
  const railPost2 = new THREE.Mesh(railPostGeo, timberMat);
  railPost2.position.set(-2.5, 0.48, 2.4);
  deckGroup.add(railPost2);
  const handrail = new THREE.Mesh(railBarGeo, timberMat);
  handrail.position.set(-2.5, 0.9, 0);
  deckGroup.add(handrail);

  // Đèn lồng gỗ trên góc sàn ngắm cảnh
  const lanternMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 });
  const glowMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
  const lanternPost = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.4, 6), lanternMat);
  lanternPost.position.set(-2.4, 0.7, 2.3);
  deckGroup.add(lanternPost);
  const lanternGlow = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.28, 0.24), glowMat);
  lanternGlow.position.set(-2.4, 1.4, 2.3);
  deckGroup.add(lanternGlow);

  // Người nông dân đội nón lá đang rắc thức ăn cho cá
  const feeder = createCharacter({
    shirtColor: 0x16a34a,
    pantsColor: 0x334155,
    hatType: 'conical',
    role: 'farmer',
  });
  feeder.position.set(-1.8, 0.05, 0);
  feeder.rotation.y = -Math.PI / 2;
  deckGroup.add(feeder);

  pondGroup.add(deckGroup);

  // 6. 16 Animated Low-Poly Koi Fish (Đàn cá Koi 16 con tung tăng bơi lội vòng quanh hồ)
  const koiColors = [
    { name: 'Kohaku', body: 0xffffff, spot: 0xef4444 }, // White & Red
    { name: 'Sanke', body: 0xffffff, spot: 0x0f172a }, // White & Black
    { name: 'Ogon', body: 0xf59e0b, spot: 0xfbbf24 }, // Golden
    { name: 'Hi Utsuri', body: 0xdc2626, spot: 0x18181b }, // Red & Black
    { name: 'Showa', body: 0x18181b, spot: 0xef4444 }, // Black & Red
    { name: 'Shiro', body: 0xffffff, spot: 0x334155 }, // White & Gray
  ];

  for (let k = 0; k < 16; k++) {
    const fGroup = new THREE.Group();
    const colorInfo = koiColors[k % koiColors.length];
    const bodyMat = new THREE.MeshStandardMaterial({ color: colorInfo.body, roughness: 0.35 });
    const spotMat = new THREE.MeshStandardMaterial({ color: colorInfo.spot, roughness: 0.35 });

    // Sleek koi body
    const body = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.6, 6), bodyMat);
    body.rotation.x = Math.PI / 2;
    fGroup.add(body);

    // Color spot on back
    const spot = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.09, 0.26), spotMat);
    spot.position.set(0, 0.06, 0.06);
    fGroup.add(spot);

    // Fin & Tail
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.18, 0.22), spotMat);
    tail.position.set(0, 0, -0.36);
    fGroup.add(tail);

    // Phân bổ bán kính bơi lội phủ đều hồ lớn 16.5m x 12.0m
    const orbitRadiusX = 4.2 + (k % 5) * 2.2 + (k > 8 ? 1.0 : 0);
    const orbitRadiusZ = 3.0 + (k % 5) * 1.6 + (k > 8 ? 0.7 : 0);
    const speed = 0.45 + (k % 4) * 0.12;
    const initialAngle = (k / 16) * Math.PI * 2;

    pondGroup.add(fGroup);
    hillPondKoiFishes.push({
      mesh: fGroup,
      tail: tail,
      centerX: 0,
      centerZ: 0,
      radiusX: orbitRadiusX,
      radiusZ: orbitRadiusZ,
      speed: speed,
      angle: initialAngle,
      baseY: -0.05 - (k % 4) * 0.04,
      phase: k * 1.4,
    });
  }

  scene.add(pondGroup);
  interactiveObjects.push(pondGroup);
}

// ============================================================================
// Đồi Sinh Thái Mới DK2: Vườn Hoa Rực Rỡ, Đàn Gà & Đàn Chim Bồ Câu Châu Âu
// ============================================================================
function buildFreeRangeChickens() {
  const flockBaseX = -142;
  const flockBaseZ = -38;
  const flockBaseY = 15.5; // Cao độ đồi mới 15.5m thoai thoải vừa vặn
  const flockGroup = new THREE.Group();
  flockGroup.position.set(flockBaseX, flockBaseY, flockBaseZ);
  flockGroup.userData = {
    id: 'doiGaDK2',
    title: 'Đồi sinh thái DK2: Vườn hoa, Đàn gà & Chim bồ câu',
    desc: 'Đồi sinh thái cảnh quan kiểu mẫu: Vườn hoa rực rỡ muôn sắc, tháp chuồng chim bồ câu châu Âu và khu chăn thả đàn gà tự nhiên trên thảm cỏ xanh.',
    zone: 'DK2',
  };

  // Shared Materials
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.85 });
  const darkWoodMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.9 });
  const roofRedMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.75, flatShading: true });
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0xa8a29e, roughness: 0.9, flatShading: true });
  const darkStoneMat = new THREE.MeshStandardMaterial({ color: 0x57534e, roughness: 0.9 });
  const grassMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.85 });
  const cornMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
  const waterMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.2, metalness: 0.1 });

  // --------------------------------------------------------------------------
  // 1. Thảm cỏ xanh mượt đỉnh đồi & Lối đi dạo đá phiến (Flat Plateau Walkways)
  // --------------------------------------------------------------------------
  const plateauLawn = new THREE.Mesh(
    new THREE.CircleGeometry(15.0, 32),
    new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.9 })
  );
  plateauLawn.rotation.x = -Math.PI / 2;
  plateauLawn.position.y = 0.02;
  plateauLawn.receiveShadow = true;
  flockGroup.add(plateauLawn);

  // Stepping stone pathways connecting garden zones
  const stonePavingPositions = [
    // Lối vào từ đường mòn
    { x: 3.5, z: -4.0, s: 1.4 }, { x: 2.2, z: -3.0, s: 1.3 }, { x: 1.0, z: -2.0, s: 1.5 },
    // Quảng trường trung tâm
    { x: 0, z: 0, s: 2.2 }, { x: -1.2, z: 0.8, s: 1.8 }, { x: 1.2, z: 0.5, s: 1.7 },
    // Rẽ sang tháp bồ câu
    { x: 2.8, z: -0.8, s: 1.3 }, { x: 4.5, z: -1.5, s: 1.4 }, { x: 6.0, z: -2.0, s: 1.6 },
    // Rẽ sang khu vườn hoa
    { x: -0.5, z: 2.6, s: 1.3 }, { x: -0.8, z: 4.5, s: 1.4 }, { x: 1.2, z: 3.8, s: 1.3 },
    { x: 2.5, z: 5.5, s: 1.5 }, { x: -2.5, z: 5.2, s: 1.4 },
    // Rẽ sang khu chuồng gà
    { x: -2.8, z: -1.0, s: 1.3 }, { x: -4.8, z: -1.8, s: 1.4 }, { x: -6.8, z: -2.5, s: 1.5 },
    // Rẽ sang chòi nghỉ ngắm cảnh
    { x: -3.5, z: 2.0, s: 1.2 }, { x: -6.0, z: 3.8, s: 1.4 }, { x: -8.5, z: 5.2, s: 1.6 },
  ];

  const stoneGeo = new THREE.CylinderGeometry(0.65, 0.72, 0.08, 7);
  stonePavingPositions.forEach((sp) => {
    const slab = new THREE.Mesh(stoneGeo, stoneMat);
    slab.position.set(sp.x, 0.05, sp.z);
    slab.scale.set(sp.s, 1.0, sp.s);
    slab.rotation.y = Math.random() * Math.PI;
    slab.receiveShadow = true;
    flockGroup.add(slab);
  });

  // Chòi nghỉ chân & Ghế gỗ ngắm cảnh đỉnh đồi (Pergola & Bench)
  const pergola = new THREE.Group();
  pergola.position.set(-6.8, 0, 4.2);
  pergola.rotation.y = Math.PI / 4;

  // 4 cột gỗ
  const colGeo = new THREE.CylinderGeometry(0.08, 0.09, 2.6, 6);
  [[-1.4, -0.9], [1.4, -0.9], [-1.4, 0.9], [1.4, 0.9]].forEach(([cx, cz]) => {
    const col = new THREE.Mesh(colGeo, darkWoodMat);
    col.position.set(cx, 1.3, cz);
    col.castShadow = true;
    pergola.add(col);
  });
  // Xà ngang pergola
  const beamMat = new THREE.MeshStandardMaterial({ color: 0x5c2b0e, roughness: 0.8 });
  for (let b = -1.5; b <= 1.5; b += 0.6) {
    const beam = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.14, 2.2), beamMat);
    beam.position.set(b, 2.65, 0);
    beam.castShadow = true;
    pergola.add(beam);
  }
  // Ghế băng gỗ
  const benchSeat = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.12, 0.6), woodMat);
  benchSeat.position.set(0, 0.45, -0.4);
  benchSeat.castShadow = true;
  pergola.add(benchSeat);
  const benchBack = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.45, 0.08), woodMat);
  benchBack.position.set(0, 0.85, -0.68);
  benchBack.castShadow = true;
  pergola.add(benchBack);
  flockGroup.add(pergola);

  // --------------------------------------------------------------------------
  // 2. Vườn hoa rực rỡ đỉnh đồi (Flower Gardens: Marigolds, Lavender, Roses, Daisies)
  // --------------------------------------------------------------------------
  const flowerBedGroup = new THREE.Group();

  // Helper: Tạo luống hoa với viền đá cuội
  const createFlowerBed = (bx, bz, radius, flowerTypes) => {
    const bed = new THREE.Group();
    bed.position.set(bx, 0, bz);

    // Đất nâu phì nhiêu
    const soil = new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius + 0.2, 0.22, 16),
      new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.95 })
    );
    soil.position.y = 0.11;
    soil.receiveShadow = true;
    bed.add(soil);

    // Viền đá cuội mộc mạc quanh bồn hoa
    const borderStonesCount = Math.floor(radius * 10);
    const borderStoneGeo = new THREE.DodecahedronGeometry(0.18, 0);
    for (let bs = 0; bs < borderStonesCount; bs++) {
      const angle = (bs / borderStonesCount) * Math.PI * 2;
      const bStone = new THREE.Mesh(borderStoneGeo, darkStoneMat);
      bStone.position.set(Math.cos(angle) * (radius + 0.15), 0.12, Math.sin(angle) * (radius + 0.15));
      bStone.scale.set(1.0 + Math.random() * 0.4, 0.8, 1.0 + Math.random() * 0.4);
      bStone.castShadow = true;
      bed.add(bStone);
    }

    // Các khóm hoa rực rỡ
    const flowerGeo = new THREE.SphereGeometry(0.14, 6, 5);
    const leafGeo = new THREE.ConeGeometry(0.18, 0.35, 4);
    const stemMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.8 });

    const numFlowers = Math.floor(radius * radius * 14);
    for (let f = 0; f < numFlowers; f++) {
      const r = Math.sqrt(Math.random()) * (radius * 0.88);
      const theta = Math.random() * Math.PI * 2;
      const fx = Math.cos(theta) * r;
      const fz = Math.sin(theta) * r;
      const fType = flowerTypes[f % flowerTypes.length];

      // Cuống lá
      const leaves = new THREE.Mesh(leafGeo, stemMat);
      leaves.position.set(fx, 0.22 + Math.random() * 0.08, fz);
      leaves.rotation.y = Math.random() * Math.PI;
      bed.add(leaves);

      // Bông hoa màu sắc
      const bloomMat = new THREE.MeshStandardMaterial({
        color: fType.color,
        roughness: 0.6,
        flatShading: true,
      });
      const bloom = new THREE.Mesh(flowerGeo, bloomMat);
      bloom.position.set(fx, leaves.position.y + 0.15, fz);
      bloom.scale.set(fType.scale, fType.scale * 0.9, fType.scale);
      bloom.castShadow = true;
      bed.add(bloom);
    }
    return bed;
  };

    // 6 BỒN HOA RỰC RỠ TRÊN ĐỈNH ĐỒI (SUMMIT FLOWER GARDENS)
  // Bồn 1: Cúc Vạn Thọ vàng óng & Hướng Dương mini (Zone A)
  flowerBedGroup.add(createFlowerBed(2.5, 4.2, 2.4, [
    { color: 0xfacc15, scale: 1.3 },
    { color: 0xf59e0b, scale: 1.4 },
    { color: 0xf97316, scale: 1.2 },
  ]));

  // Bồn 2: Cẩm Tú Cầu Tím & Oải Hương Lavender (Zone B)
  flowerBedGroup.add(createFlowerBed(-2.6, 4.8, 2.3, [
    { color: 0xa855f7, scale: 1.4 },
    { color: 0x8b5cf6, scale: 1.3 },
    { color: 0xc084fc, scale: 1.2 },
  ]));

  // Bồn 3: Hoa Hồng Nhung Đỏ & Cúc Họa Mi Trắng (Zone C)
  flowerBedGroup.add(createFlowerBed(5.2, 2.5, 2.2, [
    { color: 0xbe123c, scale: 1.3 },
    { color: 0xf43f5e, scale: 1.2 },
    { color: 0xffffff, scale: 1.1 },
    { color: 0xfde047, scale: 0.9 },
  ]));

  // Bồn 4: Cúc Ngũ Sắc & Hoa Thược Dược (Zone D)
  flowerBedGroup.add(createFlowerBed(-4.2, -4.2, 2.1, [
    { color: 0xec4899, scale: 1.2 },
    { color: 0xfbbf24, scale: 1.1 },
    { color: 0x38bdf8, scale: 1.1 },
    { color: 0xffffff, scale: 1.2 },
  ]));

  // Bồn 5: Cúc Bướm Cosmos Hồng Phấn & Mẫu Đơn (Zone E)
  flowerBedGroup.add(createFlowerBed(3.8, -4.0, 2.1, [
    { color: 0xf472b6, scale: 1.3 },
    { color: 0xfb7185, scale: 1.2 },
    { color: 0xffe4e6, scale: 1.1 },
  ]));

  // Bồn 6: Hoa Cam Tươi Lantana Đón Khách (Zone F)
  flowerBedGroup.add(createFlowerBed(-0.5, 6.2, 2.2, [
    { color: 0xf97316, scale: 1.35 },
    { color: 0xeab308, scale: 1.25 },
    { color: 0xef4444, scale: 1.15 },
  ]));

  // --------------------------------------------------------------------------
  // B. DẢI HOA VIỀN MÉP ĐỒI (FLORAL RIM RING: 380 KHÓM HOA RỰC RỠ)
  // --------------------------------------------------------------------------
  const rimFlowerGeo = new THREE.SphereGeometry(0.16, 5, 4);
  const rimColors = [0xfacc15, 0xf43f5e, 0x8b5cf6, 0xffffff, 0xf97316, 0x38bdf8, 0xec4899];
  const rimCount = 380;
  for (let rIdx = 0; rIdx < rimCount; rIdx++) {
    const angle = (rIdx / rimCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.08;
    const rad = 13.0 + Math.random() * 2.5; // Viền mép đồi r = 13.0..15.5m
    const fx = Math.cos(angle) * rad;
    const fz = Math.sin(angle) * rad;

    const bMat = new THREE.MeshStandardMaterial({
      color: rimColors[rIdx % rimColors.length],
      roughness: 0.65,
      flatShading: true,
    });
    const bloom = new THREE.Mesh(rimFlowerGeo, bMat);
    bloom.position.set(fx, 0.2 + Math.random() * 0.15, fz);
    bloom.scale.setScalar(0.9 + Math.random() * 0.6);
    bloom.castShadow = true;
    flowerBedGroup.add(bloom);

    // Đá cuội rải rác đan xen khóm hoa mép đồi
    if (rIdx % 12 === 0) {
      const rock = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.24, 0),
        new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 })
      );
      rock.position.set(fx + 0.2, 0.15, fz + 0.2);
      flowerBedGroup.add(rock);
    }
  }

  // --------------------------------------------------------------------------
  // C. THẢM HOA DỐC ĐỔ XUỐNG SƯỜN ĐỒI (CASCADING SLOPES WILDFLOWERS: 650 KHÓM)
  // --------------------------------------------------------------------------
  const slopeCount = 650;
  for (let sIdx = 0; sIdx < slopeCount; sIdx++) {
    const sAngle = Math.random() * Math.PI * 2;
    const sRad = 15.5 + Math.random() * 22.0; // r = 15.5m..37.5m trên sườn dốc đồi
    const sx = Math.cos(sAngle) * sRad;
    const sz = Math.sin(sAngle) * sRad;

    // Tính độ cao y chuẩn theo hàm sườn dốc đồi
    const slopeT = (sRad - 15.0) / (46.0 - 15.0);
    const sy = -0.5 + 16.0 * Math.pow(Math.max(0, 1.0 - slopeT), 1.25) - 15.5; // Offset so với flockBaseY

    const sMat = new THREE.MeshStandardMaterial({
      color: rimColors[sIdx % rimColors.length],
      roughness: 0.7,
      flatShading: true,
    });
    const sBloom = new THREE.Mesh(rimFlowerGeo, sMat);
    sBloom.position.set(sx, sy + 0.25, sz);
    sBloom.scale.setScalar(1.0 + Math.random() * 0.7);
    flowerBedGroup.add(sBloom);
  }

  flockGroup.add(flowerBedGroup);

  // --------------------------------------------------------------------------
  // 3. Khu Chăn Thả Đàn Gà Đồi (Chicken Farm, Rustic Wooden Coop, Fence & Flock)
  // --------------------------------------------------------------------------
  const chickenYard = new THREE.Group();
  chickenYard.position.set(-5.8, 0, -2.5);

  // Chuồng gà gỗ lớn mái ngói đỏ (Rustic Chicken Coop)
  const coopWall = new THREE.Mesh(new THREE.BoxGeometry(4.2, 2.2, 3.0), woodMat);
  coopWall.position.set(0, 1.3, 0);
  coopWall.castShadow = true;
  chickenYard.add(coopWall);

  // Mái ngói đôi dốc cao
  const coopRoof = new THREE.Mesh(new THREE.ConeGeometry(3.2, 1.4, 4), roofRedMat);
  coopRoof.rotation.y = Math.PI / 4;
  coopRoof.position.set(0, 2.8, 0);
  coopRoof.scale.set(1.15, 1.0, 1.35);
  coopRoof.castShadow = true;
  chickenYard.add(coopRoof);

  // Cửa chuồng gà & Cầu thang gỗ cho gà leo vào tổ
  const coopDoor = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 0.9, 0.08),
    new THREE.MeshStandardMaterial({ color: 0x1f2937 })
  );
  coopDoor.position.set(1.0, 0.65, 1.54);
  chickenYard.add(coopDoor);

  const ramp = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.06, 1.4), darkWoodMat);
  ramp.position.set(1.0, 0.28, 2.15);
  ramp.rotation.x = Math.PI / 8;
  ramp.castShadow = true;
  chickenYard.add(ramp);

  // Hàng rào gỗ mộc chăn thả (Split-rail wooden fence)
  const fenceMat = new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.9 });
  const fencePostGeo = new THREE.CylinderGeometry(0.06, 0.07, 1.1, 5);
  const fenceRailGeo = new THREE.BoxGeometry(2.4, 0.08, 0.05);

  const fencePoints = [
    [-3.2, 2.8], [-0.8, 3.2], [1.6, 3.2], [4.0, 2.8],
    [4.8, 0.8], [4.8, -1.6], [4.0, -3.2],
  ];
  fencePoints.forEach(([fx, fz], idx) => {
    const post = new THREE.Mesh(fencePostGeo, fenceMat);
    post.position.set(fx, 0.55, fz);
    post.castShadow = true;
    chickenYard.add(post);

    if (idx < fencePoints.length - 1) {
      const next = fencePoints[idx + 1];
      const mx = (fx + next[0]) / 2;
      const mz = (fz + next[1]) / 2;
      const angle = Math.atan2(next[1] - fz, next[0] - fx);
      const len = Math.hypot(next[0] - fx, next[1] - fz);

      [0.4, 0.8].forEach((ry) => {
        const rail = new THREE.Mesh(fenceRailGeo, fenceMat);
        rail.position.set(mx, ry, mz);
        rail.rotation.y = -angle;
        rail.scale.set(len / 2.4, 1.0, 1.0);
        rail.castShadow = true;
        chickenYard.add(rail);
      });
    }
  });

  // Máng ăn thóc dài & Máng nước
  const trough = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.28, 0.5), woodMat);
  trough.position.set(1.8, 0.14, 0.5);
  chickenYard.add(trough);

  const corn = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.12, 0.4), cornMat);
  corn.position.set(1.8, 0.26, 0.5);
  chickenYard.add(corn);

  const waterBasin = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.38, 0.22, 10), stoneMat);
  waterBasin.position.set(0.6, 0.11, -1.6);
  chickenYard.add(waterBasin);

  const basinWater = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.05, 10), waterMat);
  basinWater.position.set(0.6, 0.2, -1.6);
  chickenYard.add(basinWater);

  flockGroup.add(chickenYard);

  // 12 Con gà (2 Gà trống, 6 Gà mái, 4 Gà con)
  const createChicken = (isRooster, isChick, colorHex) => {
    const chk = new THREE.Group();
    const scale = isChick ? 0.55 : (isRooster ? 1.65 : 1.3);

    const bodyMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.75, flatShading: true });
    const redMat = new THREE.MeshBasicMaterial({ color: 0xdc2626 });
    const yellowMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });

    // Torso
    const body = new THREE.Mesh(new THREE.DodecahedronGeometry(0.26, 1), bodyMat);
    body.scale.set(1.0, 0.85, 1.3);
    body.position.y = 0.35;
    body.castShadow = true;
    chk.add(body);

    // Head & Neck
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.48, 0.26);

    const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.16, 0.16), bodyMat);
    headGroup.add(headMesh);

    // Beak
    const beak = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.14, 4), yellowMat);
    beak.rotation.x = Math.PI / 2;
    beak.position.set(0, -0.02, 0.13);
    headGroup.add(beak);

    // Comb
    const comb = new THREE.Mesh(
      new THREE.BoxGeometry(0.035, isRooster ? 0.18 : 0.08, isRooster ? 0.2 : 0.1),
      redMat
    );
    comb.position.set(0, isRooster ? 0.15 : 0.09, 0.02);
    headGroup.add(comb);

    if (isRooster) {
      const wattle = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.1, 0.06), redMat);
      wattle.position.set(0, -0.11, 0.09);
      headGroup.add(wattle);

      // Magnificent arched sickle feathers
      const tailFeatherMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4 });
      for (let tf = 0; tf < 3; tf++) {
        const feather = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.45, 0.15), tailFeatherMat);
        feather.rotation.x = -Math.PI / 3 - tf * 0.15;
        feather.rotation.y = (tf - 1) * 0.15;
        feather.position.set((tf - 1) * 0.04, 0.46, -0.35);
        chk.add(feather);
      }
    } else if (!isChick) {
      const henTail = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.18, 0.12), bodyMat);
      henTail.rotation.x = -Math.PI / 4;
      henTail.position.set(0, 0.42, -0.3);
      chk.add(henTail);
    }

    // Legs
    const legGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.25, 4);
    [-0.09, 0.09].forEach((lx) => {
      const leg = new THREE.Mesh(legGeo, yellowMat);
      leg.position.set(lx, 0.12, 0);
      chk.add(leg);
    });

    chk.scale.set(scale, scale, scale);
    return { mesh: chk, head: headGroup };
  };

  const chickenConfigs = [
    // 2 Gà trống oai vệ
    { isRooster: true, isChick: false, color: 0xd97706, x: -6.5, z: -2.8, rot: 0.5 },
    { isRooster: true, isChick: false, color: 0x9a3412, x: -10.2, z: -1.5, rot: -1.2 },
    // 6 Gà mái béo tốt
    { isRooster: false, isChick: false, color: 0xd97706, x: -7.5, z: -3.8, rot: 1.8 },
    { isRooster: false, isChick: false, color: 0x78350f, x: -5.8, z: -4.5, rot: -0.4 },
    { isRooster: false, isChick: false, color: 0xf8fafc, x: -8.0, z: -1.2, rot: 2.4 },
    { isRooster: false, isChick: false, color: 0xb45309, x: -5.0, z: -2.0, rot: -2.1 },
    { isRooster: false, isChick: false, color: 0xd97706, x: -9.5, z: -4.2, rot: 0.8 },
    { isRooster: false, isChick: false, color: 0xf8fafc, x: -4.2, z: -3.5, rot: -1.5 },
    // 4 Gà con lon ton quanh mẹ
    { isRooster: false, isChick: true, color: 0xfde047, x: -7.2, z: -4.1, rot: 1.2 },
    { isRooster: false, isChick: true, color: 0xfde047, x: -7.7, z: -4.3, rot: 0.4 },
    { isRooster: false, isChick: true, color: 0xfde047, x: -7.0, z: -3.5, rot: -0.8 },
    { isRooster: false, isChick: true, color: 0xfde047, x: -7.3, z: -3.3, rot: 2.0 },
  ];

  chickenConfigs.forEach((cfg, idx) => {
    const chkObj = createChicken(cfg.isRooster, cfg.isChick, cfg.color);
    chkObj.mesh.position.set(cfg.x, 0, cfg.z);
    chkObj.mesh.rotation.y = cfg.rot;
    flockGroup.add(chkObj.mesh);

    hillChickens.push({
      id: idx,
      mesh: chkObj.mesh,
      head: chkObj.head,
      peckTimer: Math.random() * 10,
      peckSpeed: 2.5 + Math.random() * 2.0,
    });
  });

  // --------------------------------------------------------------------------
  // 4. Tháp Chuồng Chim Bồ Câu Châu Âu & Đàn Chim Bồ Câu (Dovecote & Pigeons)
  // --------------------------------------------------------------------------
  const dovecoteGroup = new THREE.Group();
  dovecoteGroup.position.set(7.5, 0, -2.5);

  // Bệ đá móng tháp
  const dovecoteBase = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.8, 0.4, 8), stoneMat);
  dovecoteBase.position.y = 0.2;
  dovecoteBase.castShadow = true;
  dovecoteGroup.add(dovecoteBase);

  // Trụ gỗ lớn chịu lực
  const mainPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.3, 2.6, 8), darkWoodMat);
  mainPillar.position.y = 1.5;
  mainPillar.castShadow = true;
  dovecoteGroup.add(mainPillar);

  // Tầng 1 chuồng chim bát giác
  const dovecoteTier1 = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 1.3, 6), woodMat);
  dovecoteTier1.position.y = 3.25;
  dovecoteTier1.castShadow = true;
  dovecoteGroup.add(dovecoteTier1);

  // Lan can / Sàn đậu vòng quanh tầng 1
  const balconyDeck = new THREE.Mesh(new THREE.CylinderGeometry(1.65, 1.65, 0.1, 6), darkWoodMat);
  balconyDeck.position.y = 2.65;
  balconyDeck.castShadow = true;
  dovecoteGroup.add(balconyDeck);

  // Tầng 2 chuồng chim
  const dovecoteTier2 = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.1, 1.0, 6), woodMat);
  dovecoteTier2.position.y = 4.3;
  dovecoteTier2.castShadow = true;
  dovecoteGroup.add(dovecoteTier2);

  // Mái nón dốc cao màu ngói đỏ mộc
  const dovecoteRoof = new THREE.Mesh(new THREE.ConeGeometry(1.5, 1.6, 6), roofRedMat);
  dovecoteRoof.position.y = 5.5;
  dovecoteRoof.castShadow = true;
  dovecoteGroup.add(dovecoteRoof);

  // Chóp kim loại đỉnh mái
  const spire = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.08, 0.7, 5),
    new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.6, roughness: 0.3 })
  );
  spire.position.y = 6.45;
  dovecoteGroup.add(spire);

  // Các ô cửa vòm nhỏ xinh (Nesting holes) quanh tháp
  const holeMat = new THREE.MeshBasicMaterial({ color: 0x1c1917 });
  const holeGeo = new THREE.BoxGeometry(0.24, 0.32, 0.1);
  for (let h = 0; h < 6; h++) {
    const ang = (h / 6) * Math.PI * 2;
    // Tầng 1
    const h1 = new THREE.Mesh(holeGeo, holeMat);
    h1.position.set(Math.cos(ang) * 1.36, 3.25, Math.sin(ang) * 1.36);
    h1.rotation.y = -ang + Math.PI / 2;
    dovecoteGroup.add(h1);
    // Tầng 2
    const h2 = new THREE.Mesh(holeGeo, holeMat);
    h2.position.set(Math.cos(ang) * 1.02, 4.3, Math.sin(ang) * 1.02);
    h2.rotation.y = -ang + Math.PI / 2;
    dovecoteGroup.add(h2);
  }

  // Khay thóc/hạt kê cho bồ câu ăn
  const pigeonFeeder = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.45, 0.15, 8), stoneMat);
  pigeonFeeder.position.set(1.6, 0.5, 1.2);
  dovecoteGroup.add(pigeonFeeder);

  const pigeonGrains = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 0.5, 0.06, 8),
    new THREE.MeshBasicMaterial({ color: 0xfde047 })
  );
  pigeonGrains.position.set(1.6, 0.58, 1.2);
  dovecoteGroup.add(pigeonGrains);

  flockGroup.add(dovecoteGroup);

  // Helper: Tạo mô hình chim bồ câu
  const createPigeon = (colorHex, isFlying = false) => {
    const pig = new THREE.Group();
    const pMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.7, flatShading: true });
    const beakMat = new THREE.MeshBasicMaterial({ color: 0xfde68a });
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x1e293b });
    const pinkLegMat = new THREE.MeshBasicMaterial({ color: 0xf472b6 });

    // Thân bồ câu (Torso)
    const pBody = new THREE.Mesh(new THREE.DodecahedronGeometry(0.18, 1), pMat);
    pBody.scale.set(0.9, 0.95, 1.4);
    pBody.position.y = 0.22;
    pBody.castShadow = true;
    pig.add(pBody);

    // Đầu & Cổ
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.32, 0.18);

    const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.11, 7, 6), pMat);
    headGroup.add(headMesh);

    // Mỏ chim
    const beak = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.11, 4), beakMat);
    beak.rotation.x = Math.PI / 2;
    beak.position.set(0, -0.02, 0.1);
    headGroup.add(beak);

    // Mắt nhỏ
    [-0.07, 0.07].forEach((ex) => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.02, 4, 4), eyeMat);
      eye.position.set(ex, 0.02, 0.06);
      headGroup.add(eye);
    });

    pig.add(headGroup);

    // Đuôi xòe quạt ngắn
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.03, 0.22), pMat);
    tail.rotation.x = -Math.PI / 8;
    tail.position.set(0, 0.25, -0.25);
    pig.add(tail);

    let leftWing = null, rightWing = null;
    if (isFlying) {
      // 2 Cánh dang rộng để đập cánh bay lượn
      const wingGeo = new THREE.BoxGeometry(0.52, 0.03, 0.24);
      leftWing = new THREE.Mesh(wingGeo, pMat);
      leftWing.position.set(-0.32, 0.28, 0);
      pig.add(leftWing);

      rightWing = new THREE.Mesh(wingGeo, pMat);
      rightWing.position.set(0.32, 0.28, 0);
      pig.add(rightWing);
    } else {
      // Chân bồ câu nhỏ
      [-0.06, 0.06].forEach((lx) => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.15, 4), pinkLegMat);
        leg.position.set(lx, 0.08, 0);
        pig.add(leg);
      });
    }

    return { mesh: pig, head: headGroup, leftWing, rightWing };
  };

  // Chim bồ câu đậu trên tháp chuồng chim (3 con)
  const perchedConfigs = [
    { x: 7.5, y: 6.35, z: -2.5, rot: 0.8 },      // Đậu trên đỉnh chóp mái
    { x: 6.2, y: 2.72, z: -2.0, rot: -0.6 },     // Đậu trên sàn ban công tầng 1
    { x: 8.6, y: 2.72, z: -2.8, rot: 2.2 },      // Đậu trên sàn ban công
  ];
  perchedConfigs.forEach((cfg) => {
    const pig = createPigeon(0xf8fafc, false);
    pig.mesh.position.set(cfg.x, cfg.y, cfg.z);
    pig.mesh.rotation.y = cfg.rot;
    flockGroup.add(pig.mesh);
    hillPigeons.push({
      mesh: pig.mesh,
      head: pig.head,
      isPecking: false,
    });
  });

  // Chim bồ câu dạo chơi, mổ hạt trên bãi cỏ & lối đi (5 con)
  const groundPigeonConfigs = [
    { x: 5.8, z: -0.5, color: 0xf8fafc, rot: 1.2 },
    { x: 8.8, z: -1.2, color: 0x94a3b8, rot: -0.8 }, // Xám bạc
    { x: 6.5, z: 1.8, color: 0xf8fafc, rot: 2.5 },
    { x: 1.5, z: 1.2, color: 0xe2e8f0, rot: -1.5 },
    { x: 4.0, z: 3.5, color: 0xf8fafc, rot: 0.4 },  // Bên luống hoa
  ];
  groundPigeonConfigs.forEach((cfg) => {
    const pig = createPigeon(cfg.color, false);
    pig.mesh.position.set(cfg.x, 0, cfg.z);
    pig.mesh.rotation.y = cfg.rot;
    flockGroup.add(pig.mesh);
    hillPigeons.push({
      mesh: pig.mesh,
      head: pig.head,
      isPecking: true,
      peckTimer: Math.random() * 8,
      peckSpeed: 3.0 + Math.random() * 2.0,
    });
  });

  // --------------------------------------------------------------------------
  // 5. Đàn Chim Bồ Câu Bay Lượn Chao Cánh Trên Đỉnh Đồi (Flying Pigeons)
  // --------------------------------------------------------------------------
  flyingPigeonsGroup = new THREE.Group();
  flyingPigeonsGroup.position.set(flockBaseX, flockBaseY + 11.5, flockBaseZ);
  flyingPigeonMeshes = [];

  const flyingPigeonConfigs = [
    { radius: 10.5, angle: 0, baseY: 0, phase: 0 },
    { radius: 13.0, angle: (Math.PI * 2) / 3, baseY: 1.2, phase: 1.8 },
    { radius: 11.8, angle: (Math.PI * 4) / 3, baseY: -0.8, phase: 3.5 },
  ];

  flyingPigeonConfigs.forEach((fc) => {
    const fp = createPigeon(0xffffff, true);
    const fx = Math.cos(fc.angle) * fc.radius;
    const fz = Math.sin(fc.angle) * fc.radius;
    fp.mesh.position.set(fx, fc.baseY, fz);
    // Quay đầu theo hướng bay tiếp tuyến vòng tròn
    fp.mesh.rotation.y = -fc.angle + Math.PI / 2;
    fp.mesh.rotation.z = -0.15; // Nghiêng cánh khi liệng cua
    flyingPigeonsGroup.add(fp.mesh);

    flyingPigeonMeshes.push({
      mesh: fp.mesh,
      leftWing: fp.leftWing,
      rightWing: fp.rightWing,
      baseY: fc.baseY,
      phase: fc.phase,
    });
  });

  scene.add(flyingPigeonsGroup);

  scene.add(flockGroup);
  interactiveObjects.push(flockGroup);
}

// ============================================================================
// 14. Animated Vehicles & Rail Transit
// ============================================================================
function setupAnimatedVehicles() {
  // 1. Xe máy điện DK Roma SX Đỏ chạy thử nghiệm trên Test Track (KCS Tester)
  animatedBike = createDKRomaSX(0xdc2626, 'DK Roma SX Chạy Thử KCS', {
    withRider: true,
    riderShirt: 0x0284c7,
    helmetColor: 0xfacc15,
  });
  scene.add(animatedBike);

  // 2. Xe máy điện DK Creer E Xanh Dương chạy tuần tra đại lộ nội bộ DK1
  const cruiserBike = createDKCreerE(0x0284c7, 'DK Creer E Tuần Tra', {
    withRider: true,
    riderShirt: 0xea580c,
    helmetColor: 0x0284c7,
  });
  cruiserBike.position.set(72, 0.05, -20);
  scene.add(cruiserBike);

  // 3. Xe đạp điện thể thao DK E-Bike chạy dọc lối dạo ven sông & đường sắt
  const eBike = createDKElectricBicycle(0xf8fafc, 'DK E-Bike Sport Sinh Thái', { withRider: true });
  eBike.position.set(82, 0.05, -15);
  scene.add(eBike);

  // 4. Xe điện 3 bánh chở hàng luân chuyển phụ tùng giữa Nhà C và Xưởng B
  const cargoHauler = createDKThreeWheelerCargo(0x10b981, 'Xe 3 bánh Logistics DK1');
  cargoHauler.position.set(48, 0.05, -50);
  scene.add(cargoHauler);

  // Lưu vào danh sách quản lý hoạt cảnh phương tiện Khối 8
  animatedVehicles = [
    {
      type: 'testTrackBike',
      mesh: animatedBike,
      angle: 0,
      speed: 0.42,
      centerX: 65,
      centerZ: -50,
      radiusX: 13,
      radiusZ: 19,
    },
    {
      type: 'waypointCruiser',
      mesh: cruiserBike,
      progress: 0,
      speed: 8.5, // 8.5 m/s (~30 km/h)
      path: [
        { x: 74, z: -18 },
        { x: 55, z: -22 },
        { x: 38, z: -22 },
        { x: 26, z: -18 },
        { x: 26, z: -8 },
        { x: 37, z: -6.5 },
        { x: 55, z: -8 },
        { x: 72, z: -14 },
      ],
    },
    {
      type: 'eBikePerimeter',
      mesh: eBike,
      progress: 0,
      speed: 4.8,
      minZ: -62,
      maxZ: -5,
      dir: 1,
      x: 80,
    },
    {
      type: 'cargoHauler',
      mesh: cargoHauler,
      progress: 0,
      speed: 3.2,
      minX: 46,
      maxX: 59,
      dir: 1,
      z: -48,
    },
  ];

    // 5. Xe tải thùng 5 tấn DK Logistics (Khối 9: Cửa mở được, phục vụ chu kỳ bốc xếp khép kín)
  activeLogisticsTruck = create5TonLogisticsTruck(0x0284c7, 'Xe tải logistics 5 tấn DK Bike (5T)');
  animatedTruck = activeLogisticsTruck.truckGroup;
  scene.add(animatedTruck);

  // Pallet hàng nhập ban đầu trên sàn xe
  ensureTruckInboundPalletLoaded();
}

// Đoàn tàu hơi nước cổ điển đỏ rực rỡ, các toa xe màu sắc & Dải khói mây trắng khổng lồ (như ảnh 1)

// ============================================================================
// CHU TRÌNH LOGISTICS LIÊN TỤC KHÉP KÍN (CONTINUOUS LOGISTICS STATE MACHINE)
// ============================================================================
function updateLogisticsCycle(delta, time, isNight) {
  if (!activeLogisticsTruck || !activeForklift) return;

  const cycleDuration = (CONFIG.LOGISTICS && CONFIG.LOGISTICS.cycleDuration) ? CONFIG.LOGISTICS.cycleDuration : 48.0;
  const dayFreq = (CONFIG.LOGISTICS && CONFIG.LOGISTICS.dayFrequency) ? CONFIG.LOGISTICS.dayFrequency : 1.0;
  const nightFreq = (CONFIG.LOGISTICS && CONFIG.LOGISTICS.nightFrequency) ? CONFIG.LOGISTICS.nightFrequency : 0.65;
  const freq = isNight ? nightFreq : dayFreq;

  // 1. Kiểm tra an toàn người đi bộ cắt ngang đường xe tải / xe nâng
  let pedestrianBlocked = false;
  if (CONFIG.LOGISTICS && CONFIG.LOGISTICS.enablePedestrianSafety && wanderingPedestrians.length > 0) {
    const truckPos = activeLogisticsTruck.truckGroup.position;
    for (let i = 0; i < wanderingPedestrians.length; i++) {
      const p = wanderingPedestrians[i];
      if (p.mesh) {
        const dx = p.mesh.position.x - truckPos.x;
        const dz = p.mesh.position.z - truckPos.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < 4.2) {
          pedestrianBlocked = true;
          break;
        }
      }
    }
  }

  // Giảm tốc mượt mà khi có người đi bộ
  const targetSlowdown = pedestrianBlocked ? 0.05 : 1.0;
  logisticsSafetySlowdown += (targetSlowdown - logisticsSafetySlowdown) * delta * 3.5;

  // Tăng thời gian chu kỳ
  logisticsCycleTime += delta * freq * logisticsSafetySlowdown;
  const ct = logisticsCycleTime % cycleDuration; // 0.0 -> 48.0s

  const truck = activeLogisticsTruck.truckGroup;
  const doorL = activeLogisticsTruck.doorPivotLeft;
  const doorR = activeLogisticsTruck.doorPivotRight;
  const fl = activeForklift.group;
  const flLift = activeForklift.liftGroup;
  const doorB1 = shutterDoors.find((d) => d.id === 'doorB1');

  // Xoay đèn cảnh báo amber trên nóc xe nâng và xe tải
  rotatingBeacons.forEach((b) => {
    if (b.mesh) b.mesh.rotation.y += delta * 14;
    if (b.light) b.light.intensity = (isNight ? 1.1 : 0.75) * (0.8 + Math.sin(time * 0.015) * 0.2);
  });

  // Đèn pha xe tải ban đêm
  if (activeLogisticsTruck.headSpotL && activeLogisticsTruck.headSpotR) {
    const headIntensity = isNight ? 1.6 : 0.0;
    activeLogisticsTruck.headSpotL.intensity = headIntensity;
    activeLogisticsTruck.headSpotR.intensity = headIntensity;
  }

  // Helper hàm nội suy mượt mà
  const lerp = THREE.MathUtils.lerp;
  const smooth = (t) => THREE.MathUtils.smoothstep(t, 0, 1);

  // =========================================================================
  // GIAI ĐOẠN 1: XE TẢI TIẾN VÀO CỔNG 1 (0.0s - 7.0s)
  // =========================================================================
  if (ct < 7.0) {
    const t = smooth(ct / 7.0);
    // Từ đường ĐT234 (80, 0, 12) rẽ vào Cổng 1 (77.5, 0, -14) -> (74, 0, -20)
    if (t < 0.5) {
      const subT = t / 0.5;
      truck.position.x = lerp(80.0, 77.5, subT);
      truck.position.z = lerp(12.0, -14.0, subT);
      truck.rotation.y = lerp(-Math.PI, -Math.PI * 0.8, subT);
    } else {
      const subT = (t - 0.5) / 0.5;
      truck.position.x = lerp(77.5, 74.0, subT);
      truck.position.z = lerp(-14.0, -20.0, subT);
      truck.rotation.y = lerp(-Math.PI * 0.8, -Math.PI / 2, subT);
    }

    // Barie Cổng 1 tự động nâng lên chào đón xe tải
    const barrier1 = animatedBarriers.find((b) => b.id === 'barrierDK1');
    if (barrier1) barrier1.targetAngle = Math.PI / 2.3;

    // Bảo vệ Cổng 1 giơ tay chào điều lệnh nghiêm trang
    guardSaluteAngle += (1.0 - guardSaluteAngle) * delta * 4;

    // Đóng cửa thùng xe tải & đóng cửa cuốn xưởng B
    doorL.rotation.y = 0;
    doorR.rotation.y = 0;
    if (doorB1) doorB1.targetProgress = 0.0;

    // Xe nâng ở vị trí chờ bên trong Xưởng B
    fl.position.set(54.0, 0, -32.5);
    fl.rotation.y = 0;
    flLift.position.y = activeForklift.initialY;

    // Pallet hàng nhập nằm sẵn trên thùng xe tải
    ensureTruckInboundPalletLoaded();
  }
  // =========================================================================
  // GIAI ĐOẠN 2: CHẠY TỚI SÂN BỐC DỠ XƯỞNG B (7.0s - 13.0s)
  // =========================================================================
  else if (ct < 13.0) {
    const t = smooth((ct - 7.0) / 6.0);
    // Qua cổng vào đường nội bộ: (74, -20) -> (62, -20) -> cua vào trước cửa xưởng (58, -23)
    if (t < 0.6) {
      const subT = t / 0.6;
      truck.position.x = lerp(74.0, 62.0, subT);
      truck.position.z = -20.0;
      truck.rotation.y = -Math.PI / 2;
    } else {
      const subT = (t - 0.6) / 0.4;
      truck.position.x = lerp(62.0, 58.0, subT);
      truck.position.z = lerp(-20.0, -23.0, subT);
      truck.rotation.y = lerp(-Math.PI / 2, -Math.PI, subT);
    }

    // Barie hạ xuống & bảo vệ hạ tay sau khi xe qua
    const barrier1 = animatedBarriers.find((b) => b.id === 'barrierDK1');
    if (barrier1) barrier1.targetAngle = 0;
    guardSaluteAngle += (0.0 - guardSaluteAngle) * delta * 3;

    doorL.rotation.y = 0;
    doorR.rotation.y = 0;
    if (doorB1) doorB1.targetProgress = 0.0;
  }
  // =========================================================================
  // GIAI ĐOẠN 3: LÙI SÁT CỬA BỐC DỠ, MỞ CỬA THÙNG & CUỐN CỬA XƯỞNG (13.0s - 18.0s)
  // =========================================================================
  else if (ct < 18.0) {
    const t = smooth((ct - 13.0) / 5.0);
    // Xe tải lùi từ (58, -23) đuôi hướng về phía Bắc sát Cửa B1 (58, -30.5)
    truck.position.x = 58.0;
    truck.position.z = lerp(-23.0, -30.5, t);
    truck.rotation.y = 0; // Đuôi xe quay về phía Z âm (sát cửa cuốn)

    // Cửa cuốn Xưởng B cuộn mở lên
    if (doorB1) doorB1.targetProgress = Math.min(1.0, t * 1.3);

    // Cửa thùng xe tải mở 2 cánh ra 110 độ
    const doorAngle = smooth(Math.max(0, (t - 0.3) / 0.7)) * 1.95;
    doorL.rotation.y = -doorAngle;
    doorR.rotation.y = doorAngle;

    fl.position.set(54.0, 0, -32.5);
    flLift.position.y = activeForklift.initialY;
  }
  // =========================================================================
  // GIAI ĐOẠN 4: XE NÂNG RA BỐC DỠ PALLET HÀNG NHẬP VÀO KHO (18.0s - 28.0s)
  // =========================================================================
  else if (ct < 28.0) {
    const t = (ct - 18.0) / 10.0;
    truck.position.set(58.0, 0, -30.5);
    truck.rotation.y = 0;
    doorL.rotation.y = -1.95;
    doorR.rotation.y = 1.95;
    if (doorB1) doorB1.targetProgress = 1.0;

    // t: 0.0 -> 0.3: Xe nâng từ (54, -32.5) tiến ra sau thùng xe (58, -31.8)
    if (t < 0.3) {
      const subT = smooth(t / 0.3);
      fl.position.x = lerp(54.0, 58.0, subT);
      fl.position.z = lerp(-32.5, -31.8, subT);
      fl.rotation.y = lerp(0, -Math.PI / 2, subT);
      flLift.position.y = activeForklift.initialY + 0.3; // Nâng càng ngang sàn xe tải
    }
    // t: 0.3 -> 0.5: Luồn càng vào pallet và nâng bổng pallet lên
    else if (t < 0.5) {
      const subT = smooth((t - 0.3) / 0.2);
      fl.position.set(58.0, 0, -31.8);
      fl.rotation.y = -Math.PI / 2;
      flLift.position.y = activeForklift.initialY + 0.3 + subT * 0.35; // Nâng lên khỏi sàn xe

      // Gắn pallet hàng vào càng nâng
      attachInboundPalletToForklift();
    }
    // t: 0.5 -> 0.8: Xe nâng lùi vào trong Xưởng B (53.5, -34.0)
    else if (t < 0.8) {
      const subT = smooth((t - 0.5) / 0.3);
      fl.position.x = lerp(58.0, 53.5, subT);
      fl.position.z = lerp(-31.8, -34.0, subT);
      fl.rotation.y = lerp(-Math.PI / 2, 0, subT);
      flLift.position.y = activeForklift.initialY + 0.65;
    }
    // t: 0.8 -> 1.0: Hạ pallet đặt lên sàn kho Xưởng B
    else {
      const subT = smooth((t - 0.8) / 0.2);
      fl.position.set(53.5, 0, -34.0);
      fl.rotation.y = 0;
      flLift.position.y = activeForklift.initialY + (1 - subT) * 0.65;

      // Đặt pallet vào kho
      if (subT > 0.8) detachInboundPalletToWarehouse();
    }
  }
  // =========================================================================
  // GIAI ĐOẠN 5: XE NÂNG CHUYỂN HÀNG THÀNH PHẨM XUẤT XƯỞNG LÊN XE TẢI (28.0s - 38.0s)
  // =========================================================================
  else if (ct < 38.0) {
    const t = (ct - 28.0) / 10.0;
    truck.position.set(58.0, 0, -30.5);
    truck.rotation.y = 0;
    doorL.rotation.y = -1.95;
    doorR.rotation.y = 1.95;
    if (doorB1) doorB1.targetProgress = 1.0;

    // t: 0.0 -> 0.3: Xe nâng xoay qua kệ hàng thành phẩm (53.0, -31.5) & xúc pallet xe điện
    if (t < 0.3) {
      const subT = smooth(t / 0.3);
      fl.position.x = lerp(53.5, 53.0, subT);
      fl.position.z = lerp(-34.0, -31.5, subT);
      fl.rotation.y = lerp(0, Math.PI / 2, subT);
      flLift.position.y = activeForklift.initialY + subT * 0.45;
      attachOutboundPalletToForklift();
    }
    // t: 0.3 -> 0.6: Chở pallet thành phẩm tiến ra đuôi xe tải (58, -31.8)
    else if (t < 0.6) {
      const subT = smooth((t - 0.3) / 0.3);
      fl.position.x = lerp(53.0, 58.0, subT);
      fl.position.z = lerp(-31.5, -31.8, subT);
      fl.rotation.y = lerp(Math.PI / 2, -Math.PI / 2, subT);
      flLift.position.y = activeForklift.initialY + 0.6;
    }
    // t: 0.6 -> 0.8: Đặt pallet thành phẩm vào thùng xe tải
    else if (t < 0.8) {
      const subT = smooth((t - 0.6) / 0.2);
      fl.position.set(58.0, 0, -31.8);
      fl.rotation.y = -Math.PI / 2;
      flLift.position.y = activeForklift.initialY + 0.6 - subT * 0.3; // Đặt chạm sàn xe

      if (subT > 0.8) attachOutboundPalletToTruck();
    }
    // t: 0.8 -> 1.0: Xe nâng lùi về vị trí nghỉ bên trong Xưởng B
    else {
      const subT = smooth((t - 0.8) / 0.2);
      fl.position.x = lerp(58.0, 54.0, subT);
      fl.position.z = lerp(-31.8, -32.5, subT);
      fl.rotation.y = lerp(-Math.PI / 2, 0, subT);
      flLift.position.y = activeForklift.initialY;
    }
  }
  // =========================================================================
  // GIAI ĐOẠN 6: ĐÓNG CỬA THÙNG & HẠ CỬA CUỐN XƯỞNG B (38.0s - 42.0s)
  // =========================================================================
  else if (ct < 42.0) {
    const t = smooth((ct - 38.0) / 4.0);
    truck.position.set(58.0, 0, -30.5);
    truck.rotation.y = 0;

    // 2 Cánh cửa thùng xe tải khép chặt
    doorL.rotation.y = -1.95 * (1 - t);
    doorR.rotation.y = 1.95 * (1 - t);

    // Cửa cuốn Xưởng B cuộn hạ xuống
    if (doorB1) doorB1.targetProgress = 1.0 - t;

    fl.position.set(54.0, 0, -32.5);
    fl.rotation.y = 0;
    flLift.position.y = activeForklift.initialY;
  }
  // =========================================================================
  // GIAI ĐOẠN 7: XE TẢI RỜI BÃI BỐC DỠ, XUẤT CỔNG 1 RA ĐT234 (42.0s - 48.0s)
  // =========================================================================
  else {
    const t = smooth((ct - 42.0) / 6.0);
    doorL.rotation.y = 0;
    doorR.rotation.y = 0;
    if (doorB1) doorB1.targetProgress = 0.0;

    // Xe tải tiến ra khỏi xưởng: (58, -30.5) -> (58, -23) -> cua ra đường nội bộ (68, -20) -> Cổng 1 (74, -20) -> ĐT234 (80, 5)
    if (t < 0.3) {
      const subT = t / 0.3;
      truck.position.x = 58.0;
      truck.position.z = lerp(-30.5, -23.0, subT);
      truck.rotation.y = 0;
    } else if (t < 0.6) {
      const subT = (t - 0.3) / 0.3;
      truck.position.x = lerp(58.0, 68.0, subT);
      truck.position.z = lerp(-23.0, -20.0, subT);
      truck.rotation.y = lerp(0, Math.PI / 2, subT);
    } else {
      const subT = (t - 0.6) / 0.4;
      truck.position.x = lerp(68.0, 80.0, subT);
      truck.position.z = lerp(-20.0, 5.0, subT);
      truck.rotation.y = lerp(Math.PI / 2, Math.PI, subT);
    }

    // Barie Cổng 1 mở lên & bảo vệ chào khi xe tải xuất xưởng
    const barrier1 = animatedBarriers.find((b) => b.id === 'barrierDK1');
    if (barrier1) barrier1.targetAngle = t < 0.85 ? Math.PI / 2.3 : 0;
    guardSaluteAngle += ((t < 0.85 ? 1.0 : 0.0) - guardSaluteAngle) * delta * 4;
  }

  // Cập nhật tư thế chào của Bảo vệ Cổng DK1
  if (guardGate1 && guardGate1.userData.rightArm) {
    guardGate1.userData.rightArm.rotation.x = -guardSaluteAngle * (Math.PI / 1.7);
    guardGate1.userData.rightArm.rotation.z = -guardSaluteAngle * (Math.PI / 4);
  }
}

// Helpers chuyển giao Pallet giữa Xe tải, Xe nâng và Kho xưởng
function ensureTruckInboundPalletLoaded() {
  if (!truckInboundPallet) {
    truckInboundPallet = createForkliftPalletCargo('components');
  }
  if (activeLogisticsTruck && activeLogisticsTruck.truckPalletSlot) {
    if (truckInboundPallet.parent !== activeLogisticsTruck.truckPalletSlot) {
      activeLogisticsTruck.truckPalletSlot.add(truckInboundPallet);
      truckInboundPallet.position.set(0, 0, 0);
      truckInboundPallet.rotation.set(0, 0, 0);
    }
  }
}

function attachInboundPalletToForklift() {
  if (truckInboundPallet && activeForklift && activeForklift.liftGroup) {
    if (truckInboundPallet.parent !== activeForklift.liftGroup) {
      activeForklift.liftGroup.add(truckInboundPallet);
      truckInboundPallet.position.set(0.68, 0.08, 0);
      truckInboundPallet.rotation.set(0, 0, 0);
    }
  }
}

function detachInboundPalletToWarehouse() {
  if (truckInboundPallet) {
    if (!warehouseStoredPallet) {
      warehouseStoredPallet = truckInboundPallet;
    }
    if (warehouseStoredPallet.parent !== scene) {
      scene.add(warehouseStoredPallet);
      warehouseStoredPallet.position.set(53.5, 0.05, -34.0);
      warehouseStoredPallet.rotation.set(0, 0, 0);
    }
  }
}

function attachOutboundPalletToForklift() {
  if (!truckOutboundPallet) {
    truckOutboundPallet = createForkliftPalletCargo('ebikes');
  }
  if (activeForklift && activeForklift.liftGroup) {
    if (truckOutboundPallet.parent !== activeForklift.liftGroup) {
      activeForklift.liftGroup.add(truckOutboundPallet);
      truckOutboundPallet.position.set(0.68, 0.08, 0);
      truckOutboundPallet.rotation.set(0, 0, 0);
    }
  }
}

function attachOutboundPalletToTruck() {
  if (truckOutboundPallet && activeLogisticsTruck && activeLogisticsTruck.truckPalletSlot) {
    if (truckOutboundPallet.parent !== activeLogisticsTruck.truckPalletSlot) {
      activeLogisticsTruck.truckPalletSlot.add(truckOutboundPallet);
      truckOutboundPallet.position.set(0, 0, 0);
      truckOutboundPallet.rotation.set(0, 0, 0);
    }
  }
}

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
  // 1. Đội xe máy điện & phương tiện lưu thông khuôn viên DK Bike (Khối 8)
  animatedVehicles.forEach((veh) => {
    if (veh.type === 'testTrackBike') {
      veh.angle += delta * veh.speed;
      const t = veh.angle;
      const x = veh.centerX + Math.sin(t) * veh.radiusX;
      const z = veh.centerZ + Math.cos(t) * veh.radiusZ;
      veh.mesh.position.set(x, 0.05, z);

      const nextX = veh.centerX + Math.sin(t + 0.06) * veh.radiusX;
      const nextZ = veh.centerZ + Math.cos(t + 0.06) * veh.radiusZ;
      const heading = Math.atan2(nextX - x, nextZ - z);
      veh.mesh.rotation.y = heading;

      // Nghiêng xe tự nhiên khi vào cua (Body Banking / Leaning into corners)
      veh.mesh.rotation.z = -Math.sin(t) * 0.22;

      // Quay bánh xe theo tốc độ di chuyển
      if (veh.mesh.userData.frontWheel) veh.mesh.userData.frontWheel.rotation.x += delta * 14;
      if (veh.mesh.userData.rearWheel) veh.mesh.userData.rearWheel.rotation.x += delta * 14;
    } else if (veh.type === 'waypointCruiser') {
      // Chạy dọc tuyến đại lộ nội bộ qua các điểm
      const pLen = veh.path.length;
      const currIdx = Math.floor(veh.progress);
      const nextIdx = (currIdx + 1) % pLen;
      const p1 = veh.path[currIdx];
      const p2 = veh.path[nextIdx];
      const segDist = Math.hypot(p2.x - p1.x, p2.z - p1.z);

      // Giảm tốc khi đến gần vạch đi bộ trước Nhà Ăn / Sân bóng
      const isNearZebra = Math.abs(veh.mesh.position.z - (-8)) < 4.0;
      const currentSpeed = isNearZebra ? veh.speed * 0.45 : veh.speed;

      veh.progress = (veh.progress + (delta * currentSpeed) / segDist) % pLen;
      const segT = veh.progress - Math.floor(veh.progress);

      const curX = THREE.MathUtils.lerp(p1.x, p2.x, segT);
      const curZ = THREE.MathUtils.lerp(p1.z, p2.z, segT);
      veh.mesh.position.set(curX, 0.05, curZ);

      const targetAngle = Math.atan2(p2.x - p1.x, p2.z - p1.z);
      veh.mesh.rotation.y = targetAngle;
      veh.mesh.rotation.z = Math.sin(time * 0.003) * 0.04;

      if (veh.mesh.userData.frontWheel) veh.mesh.userData.frontWheel.rotation.x += delta * 10;
      if (veh.mesh.userData.rearWheel) veh.mesh.userData.rearWheel.rotation.x += delta * 10;
    } else if (veh.type === 'eBikePerimeter') {
      // Xe đạp điện đi thong thả
      veh.mesh.position.z += veh.dir * veh.speed * delta;
      if (veh.mesh.position.z > veh.maxZ) {
        veh.dir = -1;
        veh.mesh.rotation.y = Math.PI;
      } else if (veh.mesh.position.z < veh.minZ) {
        veh.dir = 1;
        veh.mesh.rotation.y = 0;
      }
      if (veh.mesh.userData.crank) {
        veh.mesh.userData.crank.rotation.x += delta * 6;
      }
    } else if (veh.type === 'cargoHauler') {
      // Xe 3 bánh vận chuyển phụ tùng
      veh.mesh.position.x += veh.dir * veh.speed * delta;
      if (veh.mesh.position.x > veh.maxX) {
        veh.dir = -1;
        veh.mesh.rotation.y = -Math.PI / 2;
      } else if (veh.mesh.position.x < veh.minX) {
        veh.dir = 1;
        veh.mesh.rotation.y = Math.PI / 2;
      }
    }
  });

  // Bật/tắt đèn pha rọi sáng mặt đường ban đêm cho xe di chuyển
  const isNight = currentEnv === "night";
  vehicleHeadlights.forEach((hl) => {
    hl.intensity = isNight ? 1.4 : 0.0;
  });

    // 2. Hoạt cảnh Logistics khép kín: Xe tải 5T, Xe nâng Komatsu, Cửa cuốn & Barie tự động (Khối 9)
  updateLogisticsCycle(delta, time, isNight);

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

  // 10. Hoạt cảnh người đi bộ, công nhân tuần tra & nhóm sinh hoạt (Khối 7: Người)
  // A. Công nhân tuần tra cố định (Nhà A & Cầu vượt)
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

  // B. Người đi bộ năng động theo mạng lưới Waypoint Graph khắp khuôn viên (Khối 7)
  const truckZPos = animatedTruck ? animatedTruck.position.z : -100;
  const isTruckNearCrossing = Math.abs(truckZPos - 0) < 18;

  wanderingPedestrians.forEach((p) => {
    // Nếu đang tạm dừng (pause look-around)
    if (p.pauseTimer > 0) {
      p.pauseTimer -= delta;
      if (p.mesh.userData.leftLeg) p.mesh.userData.leftLeg.rotation.x *= 0.88;
      if (p.mesh.userData.rightLeg) p.mesh.userData.rightLeg.rotation.x *= 0.88;
      if (p.mesh.userData.headGroup) {
        p.mesh.userData.headGroup.rotation.y = Math.sin(time * 0.0025 + p.id) * 0.32;
      }
      return;
    }

    const currentWP = CAMPUS_WAYPOINTS[p.targetIndex];
    if (!currentWP) return;

    // Nhường xe tải khi qua vạch kẻ đường ĐT234 (Waypoints 9, 10)
    if ((currentWP.id === 9 || currentWP.id === 10) && isTruckNearCrossing) {
      if (p.mesh.userData.leftLeg) p.mesh.userData.leftLeg.rotation.x *= 0.88;
      if (p.mesh.userData.rightLeg) p.mesh.userData.rightLeg.rotation.x *= 0.88;
      return;
    }

    const currentPos = p.mesh.position;
    const targetX = currentWP.x + p.offsetX;
    const targetZ = currentWP.z + p.offsetZ;
    const dx = targetX - currentPos.x;
    const dz = targetZ - currentPos.z;
    const distSq = dx * dx + dz * dz;

    if (distSq < 0.6) {
      // Đã tới waypoint: chọn waypoint tiếp theo từ danh sách neighbors
      p.currentIndex = p.targetIndex;
      const neighbors = currentWP.neighbors;
      let nextIndex = neighbors[Math.floor(Math.random() * neighbors.length)];
      if (nextIndex === p.lastIndex && neighbors.length > 1) {
        const otherNeighbors = neighbors.filter((n) => n !== p.lastIndex);
        if (otherNeighbors.length > 0) {
          nextIndex = otherNeighbors[Math.floor(Math.random() * otherNeighbors.length)];
        }
      }
      p.lastIndex = p.currentIndex;
      p.targetIndex = nextIndex;

      // Xác suất 22% dừng lại nghỉ / xem cảnh 2 - 3.5 giây
      if (Math.random() < 0.22) {
        p.pauseTimer = 2.0 + Math.random() * 2.0;
      }
    } else {
      // Bước đi tiến tới mục tiêu
      const dist = Math.sqrt(distSq);
      const moveDist = Math.min(p.speed * delta, dist);
      currentPos.x += (dx / dist) * moveDist;
      currentPos.z += (dz / dist) * moveDist;

      // Cập nhật cao độ Y theo địa hình (đặc biệt khi leo đồi)
      const targetY = currentWP.y || 0;
      currentPos.y += (targetY - currentPos.y) * delta * 4.5;

      // Xoay hướng mặt theo vector chuyển động
      const targetAngle = Math.atan2(dx, dz);
      let angleDiff = targetAngle - p.mesh.rotation.y;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      p.mesh.rotation.y += angleDiff * Math.min(delta * 7.5, 1.0);

      // Cử động nhịp nhàng chân tay theo bước chạy
      p.stepAngle += delta * (p.speed * 3.5);
      const swing = Math.sin(p.stepAngle) * 0.46;
      if (p.mesh.userData.leftLeg) p.mesh.userData.leftLeg.rotation.x = swing;
      if (p.mesh.userData.rightLeg) p.mesh.userData.rightLeg.rotation.x = -swing;
      if (!p.holdingTablet) {
        if (p.mesh.userData.leftArm) p.mesh.userData.leftArm.rotation.x = -swing * 0.8;
        if (p.mesh.userData.rightArm) p.mesh.userData.rightArm.rotation.x = swing * 0.8;
      }
    }
  });

  // C. Hoạt cảnh nhóm nói chuyện / ăn uống
  socialGroups.forEach((sg) => {
    if (sg.type === 'conversation') {
      const talker = sg.members[Math.floor((time * 0.0006) % sg.members.length)];
      if (talker && talker.userData && talker.userData.rightArm) {
        talker.userData.rightArm.rotation.x = -0.6 + Math.sin(time * 0.005) * 0.22;
      }
    }
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

    // 16. Barie cổng tự động: Cần chắn xoay mượt mà theo targetAngle (Animated Barriers)
  animatedBarriers.forEach((b) => {
    // Nếu là Cổng 2, mở khi xe bán tải DK2 đến gần
    if (b.id === 'barrierDK2') {
      const isNearGate2 = animatedTruck && Math.abs(animatedTruck.position.x - (-20)) < 12;
      b.targetAngle = isNearGate2 ? Math.PI / 2.3 : 0;
    }
    // Cổng 1 (barrierDK1) được điều khiển chính xác theo chu trình Logistics trong updateLogisticsCycle()
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

  // 19. Trận đấu bóng chuyền phong trào DK1 (Ảnh 1)
  if (volleyballMesh) {
    volleyballRallyProgress = (volleyballRallyProgress + delta * 0.95) % 6.0;
    const vp = volleyballRallyProgress;
    let bx = 51, by = 2.4, bz = -12;

    // 6-phase dynamic rally:
    // 0.0 - 1.2: Dig/pass from Team A backcourt (37.5, -12) to Setter A2 (42.0, -9.5)
    if (vp < 1.2) {
      const t = vp / 1.2;
      bx = THREE.MathUtils.lerp(44.5, 49.0, t);
      bz = THREE.MathUtils.lerp(-12.0, -9.5, t);
      by = 1.0 + Math.sin(t * Math.PI) * 2.2;
    }
    // 1.2 - 2.2: Setter A2 tosses high set to Spiker A1 (42.2, -13)
    else if (vp < 2.2) {
      const t = (vp - 1.2) / 1.0;
      bx = THREE.MathUtils.lerp(49.0, 49.2, t);
      bz = THREE.MathUtils.lerp(-9.5, -13.0, t);
      by = 1.6 + Math.sin(t * Math.PI) * 2.6;
    }
    // 2.2 - 3.4: Spiker A1 smashes ball over net towards Team B backcourt (50.5, -12)
    else if (vp < 3.4) {
      const t = (vp - 2.2) / 1.2;
      bx = THREE.MathUtils.lerp(49.2, 57.5, t);
      bz = THREE.MathUtils.lerp(-13.0, -12.0, t);
      by = 3.2 - t * 2.2 + Math.sin(t * Math.PI) * 0.8;
      by = Math.max(0.6, by);
    }
    // 3.4 - 4.6: Team B Defender B3 digs ball up towards Setter B2 (46.5, -9.5)
    else if (vp < 4.6) {
      const t = (vp - 3.4) / 1.2;
      bx = THREE.MathUtils.lerp(57.5, 53.5, t);
      bz = THREE.MathUtils.lerp(-12.0, -9.5, t);
      by = 0.8 + Math.sin(t * Math.PI) * 2.3;
    }
    // 4.6 - 6.0: Setter B2 attacks ball back to Team A court (37.5, -12)
    else {
      const t = (vp - 4.6) / 1.4;
      bx = THREE.MathUtils.lerp(53.5, 44.5, t);
      bz = THREE.MathUtils.lerp(-9.5, -12.0, t);
      by = 2.8 - t * 1.8 + Math.sin(t * Math.PI) * 0.9;
      by = Math.max(0.6, by);
    }

    volleyballMesh.position.set(bx, by, bz);
    volleyballMesh.rotation.x += delta * 12;
    volleyballMesh.rotation.y += delta * 15;

    // Animate jumping players
    volleyballPlayers.forEach((p) => {
      if (p.role === 'spikerA') {
        const jumpPhase = Math.sin(Math.max(0, Math.min(Math.PI, (vp - 1.9) * 5.0)));
        p.group.position.y = jumpPhase * 0.85;
        if (p.rightArm) p.rightArm.rotation.x = -2.6 + jumpPhase * 1.2;
      } else if (p.role === 'blockerB') {
        const jumpPhase = Math.sin(Math.max(0, Math.min(Math.PI, (vp - 2.1) * 4.5)));
        p.group.position.y = jumpPhase * 0.8;
      } else if (p.role === 'spikerB') {
        const jumpPhase = Math.sin(Math.max(0, Math.min(Math.PI, (vp - 4.4) * 5.0)));
        p.group.position.y = jumpPhase * 0.8;
      }
    });
  }

  // 20. Đàn cá Koi bơi lội trong ao cá đồi DK2 (Ảnh 2)
  hillPondKoiFishes.forEach((fish) => {
    fish.angle += delta * fish.speed;
    const fx = fish.centerX + Math.cos(fish.angle) * fish.radiusX;
    const fz = fish.centerZ + Math.sin(fish.angle) * fish.radiusZ;
    fish.mesh.position.set(fx, fish.baseY, fz);
    fish.mesh.rotation.y = -fish.angle + Math.PI / 2;
    if (fish.tail) {
      fish.tail.rotation.y = Math.sin(time * 0.012 + fish.phase) * 0.45;
    }
  });

  // 21. Đàn gà đi bộ và mổ thóc trên đồi DK2 (Ảnh 2)
  hillChickens.forEach((chk) => {
    chk.peckTimer += delta * chk.peckSpeed;
    const isPecking = Math.sin(chk.peckTimer) > 0.2;
    if (chk.head) {
      chk.head.rotation.x = isPecking ? 0.65 + Math.sin(chk.peckTimer * 4) * 0.25 : 0;
    }
    chk.mesh.rotation.y += Math.sin(time * 0.001 + chk.id) * 0.005;
  });

  // 22. Đàn chim bồ câu mổ hạt và gật đầu trên bãi cỏ đồi DK2
  hillPigeons.forEach((pig) => {
    if (pig.isPecking) {
      pig.peckTimer += delta * pig.peckSpeed;
      const isPeck = Math.sin(pig.peckTimer) > 0.3;
      if (pig.head) {
        pig.head.rotation.x = isPeck ? 0.45 + Math.sin(pig.peckTimer * 5) * 0.2 : 0;
      }
    }
  });

  // 23. Đàn chim bồ câu trắng bay lượn chao cánh trên bầu trời đỉnh đồi
  if (flyingPigeonsGroup) {
    flyingPigeonsGroup.rotation.y += delta * 0.38;
    flyingPigeonMeshes.forEach((fp) => {
      const flap = Math.sin(time * 0.012 + fp.phase) * 0.45;
      if (fp.leftWing) fp.leftWing.rotation.z = flap;
      if (fp.rightWing) fp.rightWing.rotation.z = -flap;
      fp.mesh.position.y = fp.baseY + Math.sin(time * 0.003 + fp.phase) * 0.35;
    });
  }
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

  // Cập nhật vòm trời Gradient (Khối 3)
  if (skyDomeMaterial && cfg.skyGradient) {
    skyDomeMaterial.uniforms.topColor.value.setHex(cfg.skyGradient.top);
    skyDomeMaterial.uniforms.bottomColor.value.setHex(cfg.skyGradient.bottom);
  }

  ambientLight.color.set(cfg.ambientColor);
  ambientLight.intensity = cfg.ambientIntensity;
  hemiLight.color.set(cfg.skyColor);
  hemiLight.groundColor.set(cfg.groundColor);

  dirLight.color.set(cfg.sunColor);
  dirLight.intensity = cfg.sunIntensity;
  dirLight.position.set(cfg.sunPosition.x, cfg.sunPosition.y, cfg.sunPosition.z);

  const isNight = time === 'night';
  const isSunset = time === 'sunset';

  // Bật đèn cửa sổ nội thất ấm cúng ban đêm / hoàng hôn
  windowLights.forEach((mat) => {
    if (isNight) {
      mat.emissive.set(0xfbbf24);
      mat.emissiveIntensity = 0.85;
    } else if (isSunset) {
      mat.emissive.set(0xf59e0b);
      mat.emissiveIntensity = 0.45;
    } else {
      mat.emissive.set(0x000000);
      mat.emissiveIntensity = 0;
    }
  });

  // Bật đèn đường cao áp
  streetLightLamps.forEach((mat) => {
    if (isNight || isSunset) {
      mat.emissive.set(0xfef08a);
      mat.emissiveIntensity = isNight ? 1.2 : 0.6;
    } else {
      mat.emissive.set(0x000000);
      mat.emissiveIntensity = 0;
    }
  });
  streetLightSpotLights.forEach((light) => {
    light.intensity = isNight ? 1.5 : (isSunset ? 0.6 : 0);
  });

  logoLight.intensity = isNight ? 1.8 : (isSunset ? 0.8 : 0);

  // Khối 7: Áo bảo hộ phản quang & Đèn pin bảo vệ ban đêm
  nightReflectiveMaterials.forEach((mat) => {
    if (isNight) {
      mat.emissive.set(0x84cc16);
      mat.emissiveIntensity = 0.85;
    } else {
      mat.emissive.set(0x000000);
      mat.emissiveIntensity = 0;
    }
  });

  securityFlashlights.forEach((light) => {
    light.intensity = isNight ? 1.8 : 0;
  });

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
    { text: '🏐 Sân bóng chuyền DK1', pos: new THREE.Vector3(51, 3.8, -12), id: 'volleyballCourt' },
    { text: '⛲ Đài phun nước DK (5m)', pos: new THREE.Vector3(36.6, 4.2, -12), id: 'fountainDK' },
    { text: '🌳 Cây bóng mát (Cách Nhà Ăn 10m)', pos: new THREE.Vector3(23, 4.6, 4), id: 'landscapeTree' },
    { text: '🏍️ Khu tập kết xe sau chạy thử', pos: new THREE.Vector3(68, 2.5, -42), id: 'stagingBikes' },

    // Tuyến đường sắt, Cầu vòm đỏ & Cảnh quan sinh thái mới (Theo ảnh mẫu)
    { text: '🚂 Tàu hơi nước & Đường sắt', pos: new THREE.Vector3(92, 5.5, -20), id: 'steamLoco' },
    { text: '🌉 Cầu vòm đỏ (Red Arch)', pos: new THREE.Vector3(95, 5.5, -49), id: 'redArchBridge' },
    { text: '🚉 Ga xe lửa DK Station', pos: new THREE.Vector3(88, 5.0, -2), id: 'dkStation' },
    { text: '⛵ Thuyền chèo đò trên sông', pos: new THREE.Vector3(89.5, 1.8, -8), id: 'rowingBoat' },
    { text: '🐑 Đàn cừu trên đồi cỏ', pos: new THREE.Vector3(108, 6.8, -45), id: 'sheepFlock' },
    { text: '🌾 Cối xay gió sinh thái', pos: new THREE.Vector3(55, 34.0, -108), id: 'windmill' },

    // DK2
    { text: 'Nhà điều hành DK2 (HQ)', pos: new THREE.Vector3(-36, 13.0, -32), id: 'nhaDieuHanhDK2' },
    { text: 'Kho Linh kiện D2.1', pos: new THREE.Vector3(-50, 8.0, -68), id: 'khoLinhKienDK2' },
    { text: '🏍️ Sân kiểm định xe DK2', pos: new THREE.Vector3(-75, 2.5, -15), id: 'xuongDK2' },
    { text: 'Sân xe thành phẩm DK2', pos: new THREE.Vector3(-78, 2.0, -45), id: 'sanThanhPhamDK2' },
    { text: 'Vườn Lan trên đồi', pos: new THREE.Vector3(-108, 21.0, -88), id: 'vuonLanDK2' },
    { text: '🐟 Ao cá đồi sinh thái', pos: new THREE.Vector3(-132, 22.0, -76), id: 'aoCaDK2' },
    { text: '🕊️ Đồi hoa & chim gà', pos: new THREE.Vector3(-148, 25.5, -38), id: 'doiGaDK2' },
    { text: '🌿 Đường mòn sinh thái DK2', pos: new THREE.Vector3(-96, 5.5, -60), id: 'ecoTrailDK2' },
  ];

  labelsData.forEach((item) => {
    const el = document.createElement('div');
    el.className = 'building-label-3d';
    el.dataset.id = item.id;
    el.title = item.text;

    // Small glowing indicator dot with pulsing aura
    const dot = document.createElement('div');
    dot.className = 'label-dot';

    // Expandable badge pill containing label name
    const pill = document.createElement('div');
    pill.className = 'label-pill';
    pill.innerText = item.text;

    el.appendChild(dot);
    el.appendChild(pill);
    container.appendChild(el);

    // Click on label dot or pill -> Open card modal & focus camera smoothly
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      handleLabelClick(item);
    });

    labelElements.push({ el, worldPos: item.pos, item });
  });
}

function handleLabelClick(item) {
  if (CONFIG.BUILDINGS[item.id]) {
    showBuildingModal(item.id);
  } else {
    const bMatch = {
      steamLoco: { type: 'train', title: 'Tàu hơi nước & Tuyến đường sắt' },
      redArchBridge: { type: 'bridge', title: 'Cầu vòm thép sơn đỏ vượt sông' },
      dkStation: { type: 'station', title: 'Ga xe lửa DK Station' },
      rowingBoat: { type: 'boat', title: 'Thuyền nan chèo đò trên sông máng' },
      sheepFlock: { type: 'animals', title: 'Đàn cừu sinh thái trên đồi cỏ' },
      windmill: { type: 'landmark', title: 'Cối xay gió sinh thái trên đỉnh đồi' },
      volleyballCourt: { type: 'sports', title: 'Sân bóng chuyền ngoài trời DK1' },
      fountainDK: { type: 'landscape', title: 'Đài phun nước biểu tượng DK (5m)' },
      landscapeTree: { type: 'landscape', title: 'Cây bóng mát cảnh quan (Cách Nhà Ăn 10m)' },
      stagingBikes: { type: 'vehicleYard', title: 'Khu vực tập kết xe sau chạy thử' },
      chargerDK1: { type: 'chargingStation', title: 'Trạm sạc xe máy điện thông minh' },
      doorB1: { type: 'shutterDoor', title: 'Cửa cuốn công nghiệp Xưởng B' },
      aoCaDK2: { type: 'landscape', title: 'Ao cá đồi sinh thái DK2' },
      doiGaDK2: { type: 'livestock', title: 'Đồi sinh thái: Đàn gà & Tháp chim bồ câu DK2' },
      ecoTrailDK2: { type: 'landscape', title: 'Đường mòn sinh thái DK2' },
    }[item.id];
    if (bMatch) {
      showInteractiveModal(bMatch);
    }
  }

  // Smooth camera zoom
  if (CONFIG.PRESETS[item.id]) {
    setCameraPreset(item.id);
  } else {
    smoothFocusOnPoint(item.pos);
  }
}

function smoothFocusOnPoint(targetPoint, offset = new THREE.Vector3(26, 22, 26)) {
  const startPos = camera.position.clone();
  const startTarget = controls.target.clone();
  const endTarget = targetPoint.clone();
  const endPos = targetPoint.clone().add(offset);

  const duration = 1100;
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
}

function updateLabels() {
  if (!showLabels) {
    labelElements.forEach((l) => (l.el.style.display = 'none'));
    return;
  }

  const tempV = new THREE.Vector3();
  const camPos = camera.position;

  labelElements.forEach((l) => {
    tempV.copy(l.worldPos);
    tempV.project(camera);

    if (tempV.z > 1) {
      l.el.style.display = 'none';
      return;
    }

    const x = (tempV.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-(tempV.y * 0.5) + 0.5) * window.innerHeight;

    // Khoảng cách camera tới nhãn: Nếu gần (< 68m) thì tự động bung mở tên nhãn
    const dist = camPos.distanceTo(l.worldPos);
    if (dist < 68) {
      l.el.classList.add('is-near');
    } else {
      l.el.classList.remove('is-near');
    }

    l.el.style.display = 'flex';
    l.el.style.left = `${x}px`;
    l.el.style.top = `${y}px`;
  });
}

// ============================================================================
// CUTE SPEECH BUBBLES: Người, Gà, Cừu phát ngôn đáng yêu ngẫu nhiên
// ============================================================================
const CUTE_SPEECHES = {
  chicken: {
    icon: '🐥',
    typeClass: 'type-chicken',
    heightOffset: 0.55,
    quotes: [
      "Cục ta cục tác! Thóc trên đồi ngon quá~ 🌾",
      "Ò ó o o! DK Bike chào buổi sáng tươi đẹp! ☀️",
      "Hôm nay đồi DK2 lộng gió mát rượi nè! 🍃",
      "Chạy bộ thể dục xíu cho khoẻ đôi chân 🐣",
      "Chip chip~ Đợi mẹ gà với các con ơi! 🐥✨",
      "Ngắm các bạn xe điện chạy bên dưới vui mắt ghê! 🛵",
      "Mổ trúng hạt bắp vàng ngọt lịm căng diều rùi~ 🌽",
      "Đỉnh đồi nhìn bao quát cả 2 nhà máy đẹp mê hồn! 📸",
      "Cục cục tác! Bộ lông vàng hôm nay mượt chưa nè? 💛",
      "Ghé vườn hoa cạnh chuồng chụp ảnh sống ảo hông? 🌸"
    ]
  },
  sheep: {
    icon: '🐑',
    typeClass: 'type-sheep',
    heightOffset: 0.75,
    quotes: [
      "Beee~ Cỏ sườn đồi xanh ngọt lịm à nha 🍀",
      "Gió mát quá chừng, buồn ngủ rùi nè... ☁️💤",
      "Cục bông gòn di động xin chào mọi người! 🐑✨",
      "Hít một hơi thật sâu đầy hương hoa cỏ thơm ngát 🌸",
      "Beee beee~ Tàu hỏa hơi nước đỏ chạy qua kìa! 🚂💨",
      "Lông mình hôm nay bồng bềnh như mây trên trời chưa? 🧶",
      "Bên bờ sông máng nước có khóm hoa dại xinh ghê! 🌼",
      "Chúc các cô chú công nhân DK Bike một ngày tràn năng lượng! 🌿"
    ]
  },
  human: {
    icon: '👷',
    typeClass: 'type-human',
    heightOffset: 1.95,
    quotes: [
      "Mẻ xe Roma SX hôm nay nước sơn bóng loáng xuất sắc! ✨",
      "Động cơ IP67 test ngập nước 10/10 êm ru! 🛵💦",
      "Sắp tới giờ ăn trưa rồi, cơm Nhà Ăn ngon lắm nha! 🍱",
      "Vừa KCS xong lô xe Creer E xuất xưởng phục vụ khách hàng! 🛠️",
      "Pin Lithium thế hệ mới nạp siêu nhanh vượt mong đợi! ⚡",
      "Làm cốc cà phê ngắm đài phun nước DK chill thật ☕⛲",
      "Khuôn viên nhà máy xanh mát như resort sinh thái vậy 🌿",
      "Pha đập bóng chuyền uy lực chuẩn chỉ quá anh em ơi! 🏐🔥",
      "Cứu bóng đỉnh chóp! Hiệp này xưởng mình quyết thắng! 👏🏆",
      "Cổng an ninh số 1 thông thoáng, chào mừng quý đối tác! 🫡",
      "Tu tu xình xịch~ Tàu vừa cập bến ga DK Station! 🚂💨",
      "Vườn Lan trên đồi hôm nay hoa nở rực rỡ ngát hương 🌺",
      "Trạm sạc nhanh 45 phút là đầy ắp năng lượng vi vu rồi 🔋⚡",
      "DK Bike tự hào xe điện thương hiệu Việt chất lượng cao! 🇻🇳🛵"
    ]
  }
};

function triggerRandomSpeechBubble() {
  if (activeSpeechBubbles.length >= 2) return;

  const tempV = new THREE.Vector3();
  const tempWorldPos = new THREE.Vector3();

  // 1. Phân loại đối tượng: Gà (35%), Cừu (25%), Người (40%)
  const r = Math.random();
  let category = r < 0.35 ? 'chicken' : (r < 0.60 ? 'sheep' : 'human');

  // Thu thập danh sách đối tượng khả dụng
  const getCandidates = (cat) => {
    if (cat === 'chicken') {
      return hillChickens.map(c => ({ mesh: c.mesh, type: 'chicken' }));
    } else if (cat === 'sheep') {
      return fluffySheeps.map(s => ({ mesh: s, type: 'sheep' }));
    } else {
      const people = [];
      wanderingPedestrians.forEach(p => people.push({ mesh: p.mesh, type: 'human', icon: '👷' }));
      walkingWorkers.forEach(w => people.push({ mesh: w.mesh, type: 'human', icon: '🛠️' }));
      volleyballPlayers.forEach(vp => people.push({ mesh: vp.group, type: 'human', icon: '🏐' }));
      if (bikeRiderGroup) people.push({ mesh: bikeRiderGroup, type: 'human', icon: '🛵' });
      return people;
    }
  };

  let pool = getCandidates(category);

  // Lọc đối tượng đang nằm trong khung hình camera (Screen Frustum Visibility)
  const isVisibleOnScreen = (item) => {
    if (!item.mesh) return false;
    item.mesh.getWorldPosition(tempWorldPos);
    tempV.copy(tempWorldPos);
    tempV.project(camera);
    // Nằm trong góc nhìn phía trước camera và không tràn lề mép
    return tempV.z < 1.0 && tempV.x > -0.85 && tempV.x < 0.85 && tempV.y > -0.85 && tempV.y < 0.85;
  };

  let visibleCandidates = pool.filter(isVisibleOnScreen);

  // Nếu category được chọn không nằm trong góc nhìn camera, thử các category khác để người dùng luôn thấy bubble
  if (visibleCandidates.length === 0) {
    const allCats = ['human', 'chicken', 'sheep'];
    for (const c of allCats) {
      const altPool = getCandidates(c);
      visibleCandidates = altPool.filter(isVisibleOnScreen);
      if (visibleCandidates.length > 0) {
        category = c;
        break;
      }
    }
  }

  // Nếu vẫn không tìm thấy ai trong khung hình, lấy ngẫu nhiên 1 con bất kỳ
  const speaker = visibleCandidates.length > 0
    ? visibleCandidates[Math.floor(Math.random() * visibleCandidates.length)]
    : pool[Math.floor(Math.random() * pool.length)];

  if (!speaker || !speaker.mesh) return;

  const config = CUTE_SPEECHES[category];
  const quote = config.quotes[Math.floor(Math.random() * config.quotes.length)];
  const icon = speaker.icon || config.icon;

  // Tạo HTML bubble element
  const el = document.createElement('div');
  el.className = `cute-speech-bubble ${config.typeClass}`;
  el.innerHTML = `
    <span class="speech-icon">${icon}</span>
    <span class="speech-text">${quote}</span>
    <div class="speech-tail"></div>
  `;

  // Hiệu ứng tương tác: Bấm vào bong bóng phát ra trái tim/ngôi sao bay lên
  el.addEventListener('click', (e) => {
    e.stopPropagation();
    const heart = document.createElement('div');
    heart.className = 'speech-heart-float';
    heart.innerText = Math.random() < 0.5 ? '❤️' : '✨';
    heart.style.left = `${e.clientX}px`;
    heart.style.top = `${e.clientY - 10}px`;
    document.body.appendChild(heart);
    setTimeout(() => heart.remove(), 800);
  });

  document.body.appendChild(el);

  activeSpeechBubbles.push({
    el,
    speakerMesh: speaker.mesh,
    heightOffset: config.heightOffset,
    ttl: 3.8, // Hiển thị trong 3.8 giây
    leaving: false
  });
}

function updateCuteSpeechBubbles(delta) {
  // Đếm ngược xuất hiện bubble tiếp theo
  nextSpeechTimer -= delta;
  if (nextSpeechTimer <= 0) {
    triggerRandomSpeechBubble();
    // Thời gian giãn cách ngẫu nhiên từ 4.5s đến 7.5s
    nextSpeechTimer = 4.5 + Math.random() * 3.0;
  }

  if (activeSpeechBubbles.length === 0) return;

  const tempWorldPos = new THREE.Vector3();
  const tempV = new THREE.Vector3();

  for (let i = activeSpeechBubbles.length - 1; i >= 0; i--) {
    const b = activeSpeechBubbles[i];
    b.ttl -= delta;

    // Kích hoạt animation biến mất khi sắp hết hạn (còn 0.35s)
    if (b.ttl <= 0.35 && !b.leaving) {
      b.leaving = true;
      b.el.classList.add('is-leaving');
    }

    // Khi hết hạn hoàn toàn, xóa khỏi DOM
    if (b.ttl <= 0) {
      b.el.remove();
      activeSpeechBubbles.splice(i, 1);
      continue;
    }

    // Tính toán vị trí 3D -> 2D màn hình
    b.speakerMesh.getWorldPosition(tempWorldPos);
    tempWorldPos.y += b.heightOffset;

    tempV.copy(tempWorldPos);
    tempV.project(camera);

    // Nếu nằm sau camera thì ẩn tạm
    if (tempV.z > 1.0) {
      b.el.style.display = 'none';
      continue;
    }

    const sx = (tempV.x * 0.5 + 0.5) * window.innerWidth;
    const sy = (-(tempV.y * 0.5) + 0.5) * window.innerHeight;

    b.el.style.display = 'flex';
    b.el.style.left = `${sx}px`;
    b.el.style.top = `${sy}px`;
  }
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
    desc.innerText = 'Dãy kho linh kiện D2.1 dài 62m chạy dọc phía Bắc sân, mái tôn xanh dương đặc trưng và các cửa cuốn phân loại kho (Kho HC, Kho AQ).';
    dim.innerText = '62.0m × 11.0m';
    height.innerText = '6.5m (1 tầng)';
    area.innerText = '~682 m²';
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
  } else if (data.type === 'sports') {
    dim.innerText = 'Kích thước: 18.0m × 9.0m';
    height.innerText = 'Lưới thi đấu cao: 2.43m';
    area.innerText = 'Mặt sân đệm Acrylic thể thao';
    roof.innerText = '6 cầu thủ đang thi đấu giao hữu sôi nổi';
  } else if (data.type === 'landscape') {
    dim.innerText = 'Ao cá đồi: 17.0m × 12.4m';
    height.innerText = 'Cốt đồi cao: +5.2m';
    area.innerText = 'Mặt nước xanh ngọc nuôi cá Koi & Sen';
    roof.innerText = 'Có cầu sàn gỗ và nghệ nhân cho cá ăn';
  } else if (data.type === 'livestock') {
    dim.innerText = 'Đàn 12 chú gà thả tự nhiên';
    height.innerText = '2 gà trống, 6 gà mái, 4 gà con';
    area.innerText = 'Sườn đồi cỏ xanh ngát phân khu DK2';
    roof.innerText = 'Có chuồng gỗ mái rơm và máng ngô ăn';
  } else if (data.type === 'yard') {
    dim.innerText = '88.0m × 22.0m';
    height.innerText = 'Cốt mặt sân 0.00';
    area.innerText = '1.936 m² bê tông phẳng';
    roof.innerText = 'Làn kiểm định phanh & 44 ô đỗ xe thành phẩm';
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
      stylizedWaterMaterials.forEach((m) => {
        if (m.uniforms && m.uniforms.uIsRaining) {
          m.uniforms.uIsRaining.value = isRaining ? 1.0 : 0.0;
        }
      });
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

  // Toggle collapsible Presets drawer (Khối 6)
  const togglePresetsBtn = document.getElementById('btn-toggle-presets');
  const presetsWrapper = document.getElementById('view-presets-wrapper');
  if (togglePresetsBtn && presetsWrapper) {
    togglePresetsBtn.addEventListener('click', () => {
      presetsWrapper.classList.toggle('is-collapsed');
    });
  }

  // Zen Mode (Toàn màn hình / Ẩn hiện thanh công cụ) (Khối 6)
  const zenToggleBtn = document.getElementById('btn-toggle-ui');
  const zenExitBtn = document.getElementById('btn-zen-exit');
  if (zenToggleBtn) {
    zenToggleBtn.addEventListener('click', () => {
      document.body.classList.add('zen-mode');
      if (zenExitBtn) zenExitBtn.classList.remove('hidden');
    });
  }
  if (zenExitBtn) {
    zenExitBtn.addEventListener('click', () => {
      document.body.classList.remove('zen-mode');
      zenExitBtn.classList.add('hidden');
    });
  }

  // Keyboard shortcut: Escape to close card and exit Zen mode
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const card = document.getElementById('building-card');
      if (card && !card.classList.contains('hidden')) {
        card.classList.add('hidden');
      }
      if (document.body.classList.contains('zen-mode')) {
        document.body.classList.remove('zen-mode');
        if (zenExitBtn) zenExitBtn.classList.add('hidden');
      }
    }
  });

  // Raycaster click on 3D canvas (Tương tác toàn diện với Công trình, Cửa xưởng, Xe cộ, Nhân sự)
  window.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.top-nav') || e.target.closest('.building-card') || e.target.closest('.bottom-hud') || e.target.closest('.building-label-3d') || e.target.closest('.floating-zen-exit')) {
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

  // Cập nhật thời gian gió đung đưa cây rừng (Khối 2)
  windUniforms.uWindTime.value = currentTime * 0.001;

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

  // Update cute speech bubbles (Người, Gà, Cừu)
  updateCuteSpeechBubbles(delta);

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
