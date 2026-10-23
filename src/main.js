import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { CONFIG } from './config.js';
import { audioManager } from './audio.js';
import { youtubeAudioManager, extractYouTubeId, extractYouTubeIdAndStart, DEFAULT_YOUTUBE_PLAYLIST } from './youtube-audio.js';
import { DewSparkleSystem } from './dewSparkles.js';
import { batchStaticMeshes, LightPool, AdaptiveQuality, QUALITY_PRESETS, pruneSmallShadowCasters } from './sceneOptimizer.js';

// Base asset URL for relative deployment (GitHub Pages subpath /dkworld/ or local dev)
const BASE_ASSET_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL)
  ? (import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : import.meta.env.BASE_URL + '/')
  : './';

const getAssetUrl = (path) => {
  const clean = path.startsWith('/') ? path.slice(1) : path;
  return BASE_ASSET_URL + clean;
};

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
let rainStreakGeo = null;
let rainData = [];
let rainSplashMesh = null;
let rainSplashes = [];
let stormCloudsGroup = null;
let stormClouds = [];
let lightningFlashLight = null;
let activeLightningGroup = null;
let lightningCooldown = 3.5;
let lightningFlickerTimer = 0;
let dewSparkleSystem = null;
// Tối ưu hiệu năng (Static batching, Light pooling, Adaptive quality)
let lightPool = null;
let adaptiveQuality = null;
let shadowUpdateEvery = 4;

// Animated Vehicles & Logistics
let animatedBike, bikeRiderGroup, bikeTrackAngle = 0;
let animatedTruck, truckProgress = 0;
// Khối 9: Logistics, Forklifts & Truck Fleet
let activeLogisticsTruck = null;
let activeForklift = null;
let activeForkliftInitialPos = { x: 58.0, y: 0, z: -36.5, rotY: -Math.PI / 2 };
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
let roadsideSmokePuffs = [];
let waterSplashRipples = [];

// Animated Characters & People (Khối 7: Người)
let walkingWorkers = [];
let wanderingPedestrians = [];
let hillHikers = [];
let dk2Inspectors = [];
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
  { id: 3, x: 26, y: 0, z: -20, neighbors: [2, 4, 7, 24] },         // Trạm sạc EV & sảnh Nhà A
  { id: 4, x: 22, y: 0, z: -12, neighbors: [3, 5] },            // Hiên Nhà Ăn CBNV
  { id: 5, x: 37, y: 0, z: -6.5, neighbors: [2, 4, 6] },         // Lối đi trước đài phun nước DK & sân bóng chuyền
  { id: 6, x: 60, y: 0, z: -28, neighbors: [1, 5, 8] },         // Khu bốc dỡ Nhà B
  { id: 7, x: 28, y: 0, z: -4, neighbors: [3, 9] },            // Đầu vạch đi bộ qua đường DK1 (Zebra)
  { id: 8, x: 78, y: 0, z: -26, neighbors: [1, 6, 25] },         // Vỉa hè ngoài trời cạnh đường thử xe DK1

  // Tuyến băng qua ĐT234 sang DK2
  { id: 9, x: 28, y: 0, z: 4, neighbors: [7, 10] },            // Giữa đường ĐT234
  { id: 10, x: -18, y: 0, z: 4, neighbors: [9, 11] },          // Vỉa hè đối diện ĐT234

  // Phân khu DK2
  { id: 11, x: -18, y: 0, z: -18, neighbors: [10, 12, 21] },        // Cổng chính DK2
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

  // Tuyến đường & Cổng kết nối mới đối diện Cổng DK2 (Gate 1B <-> Nhà A)
  { id: 21, x: -10.0, y: 0, z: -25.5, neighbors: [11, 22] },    // Vạch đi bộ ĐT234 nối thẳng 2 cổng
  { id: 22, x: -6.0, y: 0, z: -25.5, neighbors: [21, 23] },     // Cổng kết nối 1B
  { id: 23, x: 4.0, y: 0, z: -25.5, neighbors: [22, 24] },      // Giữa đường kết nối mới
  { id: 24, x: 14.0, y: 0, z: -25.5, neighbors: [23, 3] },      // Đầu đường trước Nhà A (nối vào WP 3)

  // Tuyến vỉa hè ngoài trời đi vòng qua Xưởng B (không xuyên qua tường)
  { id: 25, x: 78.0, y: 0, z: -52.0, neighbors: [8, 26] },      // Vỉa hè cạnh Mái che xe điện
  { id: 26, x: 78.0, y: 0, z: -80.0, neighbors: [25] },         // Vỉa hè ngoài trời sau Xưởng B (Z = -80.0, ngoài xưởng)
];

// Volleyball match & court
let volleyballMesh;
let volleyballPlayers = [];
let volleyballRallyProgress = 0;
let volleyballCourtGroup;

// Đài phun nước trung tâm DK & Cây bóng mát cảnh quan (10m từ Nhà Ăn)
let fountainGroup, fountainWaterMesh, fountainJets = [], fountainDKLogo;
let fountainCascadeMesh, fountainCascadeMat, fountainRipples = [], fountainCenterJet, fountainArcJets = [], fountainCrownJets = [];
let landscapeFeatureTree;

// Khối 8: Đội xe máy điện & phương tiện đi lại DK Bike
let animatedVehicles = [];
let evChargingRings = [];
let vehicleHeadlights = [];

// Cute Speech Bubbles (Người, Gà, Cừu)
let activeSpeechBubbles = [];
let nextSpeechTimer = 25.0; // Hoãn tối thiểu 25s sau khi mở trang mới xuất hiện bubble ngẫu nhiên

// DK2 Hillside Eco-Pond, Chickens & Pigeons
let hillPondKoiFishes = [];
let hillPondWater;
let hillChickens = [];
let hillPigeons = [];
let flyingPigeonsGroup, flyingPigeonMeshes = [];

// Interactive Objects, Doors & Activities
let interactiveObjects = [];
let shutterDoors = [];
let areDoorsOpen = true; // Cửa xưởng auto mở sẵn liên tục
let doorProgress = 1; // 1 = fully open
let interiorFactoryLights = [];
let nhaBRoofGroupGlobal = null;
let insideHVLSFans = [];
let insideAssemblyBikes = [];
let insideConveyorSlats = [];
let insideAssemblyWorkers = [];
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
let nhaALogoLight;
let nhaDieuHanhDK2LogoLight;
let illuminatedLogoMats = [];
let labelElements = [];
let showLabels = true;

// Snowfall & Progressive Accumulation System (Request 3)
let isSnowing = false;
let snowParticleSystem = null;
let snowData = [];
let snowAccumulation = 0.0;
const snowUniforms = {
  uSnowAmount: { value: 0.0 }
};
let snowMaterials = [];

// 3D Arched Rainbow System (Request 2)
let activeRainbow = null;

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
async function init() {
  const container = document.getElementById('canvas-container');

  // Hàm cập nhật thanh tiến trình chạy & thông báo trạng thái
  const updateLoading = async (percent, message) => {
    const progressBar = document.getElementById('loading-progress-bar');
    const percentNumber = document.getElementById('loading-percent-number');
    const statusText = document.getElementById('loading-status-text');
    if (progressBar) progressBar.style.width = `${percent}%`;
    if (percentNumber) percentNumber.innerText = `${percent}%`;
    if (statusText) statusText.innerText = message;
    // Cho phép trình duyệt layout & vẽ khung hình tiến trình
    await new Promise((resolve) => setTimeout(resolve, 25));
  };

  await updateLoading(5, 'Khởi tạo không gian 3D & ánh sáng...');

  // Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(CONFIG.LIGHTING.day.skyColor);
  scene.fog = null; // Đã loại bỏ hoàn toàn lớp sương mù theo yêu cầu giúp khung cảnh trong suốt, sắc nét

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
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
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

  await updateLoading(22, 'Kiến tạo địa hình khuôn viên & đường ĐT234...');

  // Grounds & Roads
  buildGroundsAndRoadDT234();
  buildVastTerrainAndClouds();

  await updateLoading(42, 'Dựng phân khu nhà máy DK1 & xưởng B...');

  // DK1 Campus Core
  buildRetainingWall();
  buildCanalAndRailway();
  buildRoadsAndTestTrack();
  buildConnectingGateAndRoad();
  buildDK1Buildings();
  buildCanopyAndBikes();

  await updateLoading(62, 'Mở rộng phân khu sinh thái DK2 & đồi hoa...');

  // DK2 Campus Core
  buildDK2Buildings();
  buildDK2HillAndOrchidGarden();
  buildDK2Vehicles();
  buildRoadsideHouses();

  await updateLoading(78, 'Phủ thảm thực vật & kết tinh ánh sương mai...');

  // Landscaping & Greenery (InstancedMesh)
  buildLandscaping();
  buildCourtyardGreenery();
  buildBuildingContactShadows();

  // Khởi tạo hệ thống ánh sương lấp lánh (phân bố đều toàn map, tinh tế nhỏ xinh)
  dewSparkleSystem = new DewSparkleSystem(scene, getTerrainElevation);

  await updateLoading(90, 'Khởi động đoàn tàu, xe cộ & âm thanh khuôn viên...');

  // Logistics, Equipment & Infrastructure Details
  buildLogisticsAndEquipment();
  buildFlagsAndStreetlights();

  // People & Characters Activities
  buildPeopleAndCharacters();

  // Animated Vehicles & Rail Transit
  setupAnimatedVehicles();
  setupTrain();
  setupFlockOfBirds();

  // Weather & Precipitation
  setupRainEffect();
  setupSnowEffect();

  // 3D HTML Labels
  createBuildingLabels();

  // Event Listeners (Bao gồm Audio Panel, Âm thanh & Ánh sương)
  setupEventListeners();

  // Window resize handler
  window.addEventListener('resize', onWindowResize);

  await updateLoading(94, 'Tối ưu hóa đồ họa cho máy của bạn...');
  optimizeScenePerformance();

  await updateLoading(100, 'Hoàn tất! Đang vào khuôn viên DK Bike...');

  // Start Animation Loop
  animate(performance.now());

  // Render initial frame
  renderer.render(scene, camera);

  // Debug hook phục vụ đo hiệu năng (draw calls, triangles)
  window.__DK_DEBUG = { renderer, scene, camera };
  if (location.search.includes('perf')) {
    setTimeout(() => {
      const info = renderer.info;
      let meshes = 0, instanced = 0, instCount = 0, pointsObjs = 0, castShadow = 0, lights = 0, shadowLights = 0, transparentMeshes = 0;
      const mats = new Set(), geos = new Set();
      scene.traverse((o) => {
        if (o.isInstancedMesh) { instanced++; instCount += o.count; }
        else if (o.isMesh) meshes++;
        if (o.isPoints) pointsObjs++;
        if (o.isMesh && o.castShadow) castShadow++;
        if (o.isLight) { lights++; if (o.castShadow) shadowLights++; }
        if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => { mats.add(m.uuid); if (m.transparent && o.isMesh) transparentMeshes++; });
        if (o.geometry) geos.add(o.geometry.uuid);
      });
      const t0 = performance.now();
      for (let i = 0; i < 5; i++) renderer.render(scene, camera);
      const renderMs = (performance.now() - t0) / 5;
      const t1 = performance.now();
      for (let i = 0; i < 5; i++) { try { updateAnimatedObjects(0.016, performance.now()); } catch (e) {} }
      const animMs = (performance.now() - t1) / 5;
      const t2 = performance.now();
      for (let i = 0; i < 5; i++) updateLabels();
      const labelMs = (performance.now() - t2) / 5;
      const gl = renderer.getContext();
      const dbg = gl.getExtension('WEBGL_debug_renderer_info');
      console.log('DK_PERF ' + JSON.stringify({
        drawCalls: info.render.calls, triangles: info.render.triangles, programs: info.programs && info.programs.length,
        meshes, instanced, instCount, pointsObjs, castShadow, lights, shadowLights, transparentMeshes,
        uniqueMaterials: mats.size, uniqueGeometries: geos.size,
        renderMs: +renderMs.toFixed(2), animMs: +animMs.toFixed(2), labelMs: +labelMs.toFixed(2),
        pixelRatio: renderer.getPixelRatio(), size: [innerWidth, innerHeight],
        gpu: dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : 'n/a',
      }));
    }, 4000);
  }

  // Mờ dần và ẩn màn hình loading
  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen) {
    loadingScreen.classList.add('fade-out');
    setTimeout(() => {
      loadingScreen.style.display = 'none';
    }, 850);
  }
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
  dirLight.shadow.mapSize.width = 1536;
  dirLight.shadow.mapSize.height = 1536;
  dirLight.shadow.camera.near = 20;
  dirLight.shadow.camera.far = 380;

  const d = 160;
  dirLight.shadow.camera.left = -d;
  dirLight.shadow.camera.right = d;
  dirLight.shadow.camera.top = d;
  dirLight.shadow.camera.bottom = -d;
  dirLight.shadow.bias = -0.0005; // Bias âm triệt tiêu hoàn toàn hiện tượng shadow acne sọc vằn trên mặt phẳng
  dirLight.shadow.normalBias = 0.045;
  scene.add(dirLight);

  logoLight = new THREE.PointLight(0xe0f2fe, 0, 35);
  logoLight.position.set(CONFIG.BUILDINGS.nhaB.position.x, 14, CONFIG.BUILDINGS.nhaB.position.z + 18);
  scene.add(logoLight);

  nhaALogoLight = new THREE.PointLight(0x38bdf8, 0, 18);
  nhaALogoLight.position.set(CONFIG.BUILDINGS.nhaA.position.x, 11, CONFIG.BUILDINGS.nhaA.position.z + CONFIG.BUILDINGS.nhaA.depth / 2 + 1.2);
  scene.add(nhaALogoLight);

  nhaDieuHanhDK2LogoLight = new THREE.PointLight(0x38bdf8, 0, 18);
  nhaDieuHanhDK2LogoLight.position.set(CONFIG.BUILDINGS.nhaDieuHanhDK2.position.x, 11, CONFIG.BUILDINGS.nhaDieuHanhDK2.position.z + CONFIG.BUILDINGS.nhaDieuHanhDK2.depth / 2 + 1.2);
  scene.add(nhaDieuHanhDK2LogoLight);
}

// ============================================================================
// 3. Ground Platforms & Provincial Road ĐT234
// ============================================================================
function buildGroundsAndRoadDT234() {
  // Mặt nền cỏ xanh thống nhất toàn bộ khuôn viên DK1 & DK2 do khối đảo Diorama 300x300m (topGrass) đảm nhiệm
  // Loại bỏ hoàn toàn các mesh bệ trùng lặp và mái taluy cắt xiên ở cao độ y=0 gây nhấp nháy sọc vằn Z-fighting

  // Road DT234
  const roadCfg = CONFIG.ROAD_DT234;
  const dt234 = new THREE.Mesh(
    new THREE.BoxGeometry(roadCfg.width, 0.1, 296),
    new THREE.MeshStandardMaterial({ color: roadCfg.asphaltColor, roughness: 0.75 })
  );
  applySnowShader(dt234.material, 0.35, 0.92);
  dt234.position.set(roadCfg.positionX, 0.05, -50);
  dt234.receiveShadow = true;
  scene.add(dt234);

  // Road Line
  const line = new THREE.Mesh(
    new THREE.PlaneGeometry(0.25, 290),
    new THREE.MeshBasicMaterial({
      color: 0xffcc00,
      polygonOffset: true,
      polygonOffsetFactor: -2.0,
      polygonOffsetUnits: -2.0,
    })
  );
  line.rotation.x = -Math.PI / 2;
  line.position.set(roadCfg.positionX, 0.12, -50);
  scene.add(line);

  // Vạch người đi bộ qua đường (Zebra Crossing) kết nối Cổng DK1 và Cổng DK2
  const zebraMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    polygonOffset: true,
    polygonOffsetFactor: -2.0,
    polygonOffsetUnits: -2.0,
  });
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
  const parkLineMat = new THREE.MeshBasicMaterial({
    color: 0xe2e8f0,
    polygonOffset: true,
    polygonOffsetFactor: -2.0,
    polygonOffsetUnits: -2.0,
  });
  for (let p = 0; p < 4; p++) {
    const px = 14 + p * 3.2;
    // Đường vạch chia ô
    const bayDivider = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 5.0), parkLineMat);
    bayDivider.rotation.x = -Math.PI / 2;
    bayDivider.position.set(px, 0.08, -22);
    scene.add(bayDivider);
  }

  // Vạch an toàn bốc dỡ hàng hóa (Yellow/Black Hazard stripes) trước Xưởng B
  for (let h = 0; h < 6; h++) {
    const stripeMat = new THREE.MeshBasicMaterial({
      color: h % 2 === 0 ? 0xffcc00 : 0x1e293b,
      polygonOffset: true,
      polygonOffsetFactor: -2.0,
      polygonOffsetUnits: -2.0,
    });
    const stripe = new THREE.Mesh(
      new THREE.PlaneGeometry(1.2, 0.3),
      stripeMat
    );
    stripe.rotation.x = -Math.PI / 2;
    stripe.position.set(58 + h * 1.0, 0.08, -32.5);
    scene.add(stripe);
  }

  // Pylon Cổng DK1
  buildPylonSign(74, 0, -17, 'DK BIKE', 'NHÀ MÁY 1 (4.500 m²)', 0x184995, 'pylonDK1');

  // Pylon Cổng DK2 (Dịch chuyển 22m theo hướng mũi tên)
  buildPylonSign(-22, 0, 4, 'DK BIKE', 'TRỤ SỞ & KHO DK2', 0x184995, 'pylonDK2');

  // Hill DK1 (North) - Toàn bộ đồi núi được quản lý thống nhất bởi interiorHills trong dioramaGroup, tránh chèn lấn vào Nhà B
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

  // Tháp chính màu xanh nhận diện thương hiệu DK Bike
  const tower = new THREE.Mesh(
    new THREE.BoxGeometry(1.8, 5.2, 0.6),
    new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.25, metalness: 0.3 })
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

  // Mặt biển chữ nổi nền đen sang trọng
  const signPanelFront = new THREE.Mesh(
    new THREE.PlaneGeometry(1.6, 1.4),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2 })
  );
  signPanelFront.position.set(0, 4.4, 0.31);
  pylonGroup.add(signPanelFront);

  const signPanelBack = new THREE.Mesh(
    new THREE.PlaneGeometry(1.6, 1.4),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2 })
  );
  signPanelBack.rotation.y = Math.PI;
  signPanelBack.position.set(0, 4.4, -0.31);
  pylonGroup.add(signPanelBack);

  // Gắn Logo DK Bike trắng chính thức lên mặt Pylon
  const pylonLogoTex = new THREE.TextureLoader().load(getAssetUrl('LogoDKBike_white.png'));
  pylonLogoTex.colorSpace = THREE.SRGBColorSpace;
  const pylonLogoMat = new THREE.MeshBasicMaterial({
    map: pylonLogoTex,
    transparent: true,
    polygonOffset: true,
    polygonOffsetFactor: -1.0,
    polygonOffsetUnits: -1.0,
  });

  const logoFront = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.4 / 2.44), pylonLogoMat);
  logoFront.position.set(0, 4.4, 0.32);
  pylonGroup.add(logoFront);

  const logoBack = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.4 / 2.44), pylonLogoMat);
  logoBack.rotation.y = Math.PI;
  logoBack.position.set(0, 4.4, -0.32);
  pylonGroup.add(logoBack);

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

// ============================================================================
// KHỞI TẠO TUYẾN TIM DÒNG SÔNG MÁNG NƯỚC UỐN LƯỢN (CANAL SPLINE & DEPTH FIELD)
// ============================================================================
const CANAL_WAYPOINTS = [
  new THREE.Vector3(88.0, -0.32, -198),
  new THREE.Vector3(88.0, -0.32, -140),
  new THREE.Vector3(88.0, -0.32, -80),
  new THREE.Vector3(86.0, -0.32, -62),
  new THREE.Vector3(86.5, -0.32, -52),
  new THREE.Vector3(93.5, -0.32, -48), // Cắt ngang uốn lượn dưới Cầu đường sắt đỏ như ảnh mẫu
  new THREE.Vector3(101.5, -0.32, -45),
  new THREE.Vector3(105.0, -0.32, -35),
  new THREE.Vector3(98.0, -0.32, -22),
  new THREE.Vector3(88.5, -0.32, -8),  // Ga DK Station
  new THREE.Vector3(88.5, -0.32, 12),
  new THREE.Vector3(89.5, -0.32, 70),
  new THREE.Vector3(89.5, -0.32, 98),
];
const canalCurve = new THREE.CatmullRomCurve3(CANAL_WAYPOINTS);

function getDistanceToCanal(x, z) {
  // Khoảng cách tới đường tim dòng sông máng nước (tính chính xác theo spline uốn lượn)
  const tEst = Math.max(0, Math.min(1, (z - (-198)) / 296));
  let minDist = 9999;
  for (let dt = -0.05; dt <= 0.05; dt += 0.01) {
    const t = Math.max(0, Math.min(1, tEst + dt));
    const pt = canalCurve.getPointAt(t);
    const d = Math.hypot(x - pt.x, z - pt.z);
    if (d < minDist) minDist = d;
  }
  return minDist;
}

function getRiverBedDepth(x, z) {
  const minDist = getDistanceToCanal(x, z);
  const halfW = 4.8;  // Nửa bề rộng mặt nước ~ 4.8m (mặt nước rộng 9.6m)
  const bankW = 3.6;  // Mái taluy bờ dốc thoai thoải 3.6m
  if (minDist < halfW) {
    return -1.15;
  } else if (minDist < halfW + bankW) {
    const s = (minDist - halfW) / bankW;
    const smoothS = s * s * (3 - 2 * s);
    return -1.15 * (1.0 - smoothS);
  }
  return 0.0;
}

function buildVastTerrainAndClouds() {
  // ==========================================================================
  // KHỐI ĐẢO 3D HÌNH VUÔNG LÁT CẮT ĐỊA TẦNG (SQUARE FLOATING DIORAMA BASE)
  // Kích thước chuẩn vuông 300m × 300m bao trọn vẹn khuôn viên DK1 & DK2
  // Tọa độ biên: X từ -175 đến +125 | Z từ -200 đến +100 | Tâm: (-25, -50)
  // ==========================================================================
  const dioramaGroup = new THREE.Group();
  const W = 300;   // Chiều rộng hình vuông
  const D = 300;   // Chiều sâu hình vuông
  const cx = -25;  // Tâm X
  const cz = -50;  // Tâm Z
  const cliffDepth = 24.0; // Độ dày vách cắt địa chất

  // 1. Mặt sàn địa hình cỏ xanh & Lòng sông máng nước lõm tự nhiên (Top Grass Surface with Recessed River Trench)
  const segX = 150;
  const segZ = 150;
  const topGrassGeo = new THREE.PlaneGeometry(W, D, segX, segZ);
  topGrassGeo.rotateX(-Math.PI / 2);
  topGrassGeo.translate(cx, 0, cz);

  const posAttr = topGrassGeo.attributes.position;
  const colors = [];
  // Bảng màu hòa sắc mô phỏng đất và cỏ tự nhiên chân thật
  const cGrass = new THREE.Color(CONFIG.GROUND.grassColor);        // Xanh lá đậm ấm (0x16a34a)
  const cGrassVibrant = new THREE.Color(0x22c55e);                 // Xanh lá non tươi sáng
  const cGrassDeep = new THREE.Color(0x15803d);                    // Xanh ngọc sẫm
  const cGrassOlive = new THREE.Color(0x65a30d);                   // Xanh ô-liu rêu
  const cEarthWarm = new THREE.Color(0x78350f);                    // Đất nâu ấm
  const cEarthDark = new THREE.Color(0x542d13);                    // Đất mùn sẫm màu
  const cSandClay = new THREE.Color(0x9a5a22);                     // Đất sét cát nâu vàng
  const cBankMud = new THREE.Color(0x854d0e);                      // Tầng bùn đất bờ mương
  const cBed = new THREE.Color(0xb45309);                          // Cát vàng đáy mương

  const hillCenters = [
    { x: 58, z: -128, r: 44 },   // Đồi cối xay gió Bắc
    { x: 115, z: -80, r: 32 },   // Đồi Đông
    { x: 116, z: -25, r: 28 },   // Đồi Đông Nam
    { x: -145, z: -155, r: 56 }, // Đồi Tây Bắc
    { x: 75, z: -160, r: 54 },   // Đồi Đông Bắc
    { x: -60, z: -160, r: 60 },  // Đồi sườn Bắc
    { x: -138, z: 72, r: 40 },   // Đồi Tây Nam
    { x: -120, z: -78, r: 62 },  // Đồi chính DK2
    { x: -142, z: -38, r: 52 },  // Đồi mới DK2
  ];

  for (let i = 0; i < posAttr.count; i++) {
    const vx = posAttr.getX(i);
    const vz = posAttr.getZ(i);

    const bedDepth = getRiverBedDepth(vx, vz);
    posAttr.setY(i, bedDepth);

    if (bedDepth < -0.85) {
      // Đáy lòng sông máng nước
      colors.push(cBed.r, cBed.g, cBed.b);
    } else if (bedDepth < -0.05) {
      // Mái dốc bờ kênh taluy
      const t = (bedDepth - (-0.85)) / (0.0 - (-0.85));
      const col = cBed.clone().lerp(cBankMud, t);
      colors.push(col.r, col.g, col.b);
    } else {
      // Mặt đất tự nhiên: Loang màu nâu đất sinh động, chân thật theo yêu cầu
      const distCanal = getDistanceToCanal(vx, vz);

      // 1. Loang màu đất nâu ẩm ven mương nước (distCanal từ 4.8m đến 24m)
      let canalSoilFactor = 0;
      if (distCanal < 24.0) {
        const canalT = Math.max(0, 1.0 - (distCanal - 4.8) / 19.2); // 1.0 sát mép nước, 0.0 tại 24m
        const mudNoise = (Math.sin(vz * 0.16) * 0.45 + Math.cos(vx * 0.22 + vz * 0.08) * 0.35 + Math.sin(vz * 0.04) * 0.2 + 1.0) * 0.5;
        canalSoilFactor = Math.min(1.0, Math.pow(canalT, 1.1) * (0.45 + 0.55 * mudNoise));
      }

      // 2. Loang màu đất sỏi xói mòn quanh chân và sườn núi đồi
      let hillSoilFactor = 0;
      for (let h = 0; h < hillCenters.length; h++) {
        const hc = hillCenters[h];
        const distH = Math.hypot(vx - hc.x, vz - hc.z);
        if (distH < hc.r) {
          const ratio = 1.0 - distH / hc.r; // 0 ở mép ngoài, 1 ở tâm đồi
          const hNoise = (Math.sin(vx * 0.09 + vz * 0.07) * 0.45 + Math.cos(vx * 0.18 - vz * 0.14) * 0.35 + Math.sin(vz * 0.28) * 0.2 + 1.0) * 0.5;
          const factor = ratio * (0.35 + 0.65 * hNoise);
          if (factor > hillSoilFactor) hillSoilFactor = factor;
        }
      }

      // 3. Thi thoảng loang các vạt đất nâu tự nhiên ngẫu nhiên trên toàn cảnh đảo
      const patchNoise1 = Math.sin(vx * 0.038 + Math.cos(vz * 0.035) * 1.8);
      const patchNoise2 = Math.sin(vx * 0.082 - vz * 0.078);
      const patchNoise3 = Math.cos(vx * 0.165 + vz * 0.145);
      const generalNoise = (patchNoise1 * 0.48 + patchNoise2 * 0.32 + patchNoise3 * 0.20 + 1.0) * 0.5; // [0..1]

      let randomSoilFactor = 0;
      if (generalNoise > 0.63) {
        // Xuất hiện từng vạt loang màu đất nâu tự nhiên
        randomSoilFactor = Math.min(1.0, (generalNoise - 0.63) / 0.37 * 0.8);
      }

      // Tổng hợp độ loang đất nâu tại tọa độ này
      const totalSoil = Math.min(0.92, Math.max(canalSoilFactor * 0.95, hillSoilFactor * 0.88, randomSoilFactor));

      // Nền cỏ phong phú, giàu sắc thái sinh thái (không bị phẳng lì đơn điệu)
      const grassHueNoise = (Math.sin(vx * 0.05 + vz * 0.04) + 1.0) * 0.5;
      let col = cGrass.clone();
      if (grassHueNoise > 0.62) {
        col.lerp(cGrassVibrant, (grassHueNoise - 0.62) * 1.5);
      } else if (grassHueNoise < 0.36) {
        col.lerp(cGrassDeep, (0.36 - grassHueNoise) * 1.6);
      } else {
        col.lerp(cGrassOlive, 0.2);
      }

      // Hòa trộn loang màu đất nâu: Phù sa ven mương hoặc đất nâu đồi núi
      if (totalSoil > 0.02) {
        let soilCol;
        if (canalSoilFactor > hillSoilFactor && canalSoilFactor > randomSoilFactor) {
          // Gần mương nước: Đất sét ẩm & bùn phù sa pha cát
          soilCol = cBankMud.clone().lerp(cSandClay, generalNoise);
        } else if (hillSoilFactor > randomSoilFactor) {
          // Quanh chân đồi núi: Đất nâu ấm & mùn xám nâu sườn dốc
          soilCol = cEarthWarm.clone().lerp(cEarthDark, generalNoise * 0.65);
        } else {
          // Vạt đất ngẫu nhiên trên đồng cỏ: Đất nâu ấm tự nhiên
          soilCol = cEarthWarm.clone().lerp(cSandClay, 0.35);
        }
        col.lerp(soilCol, totalSoil);
      }

      colors.push(col.r, col.g, col.b);
    }
  }

  topGrassGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  topGrassGeo.computeVertexNormals();

  const topGrassMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.88,
    metalness: 0.05,
    flatShading: true,
    polygonOffset: true,
    polygonOffsetFactor: 1.0,
    polygonOffsetUnits: 1.0,
  });
  applySnowShader(topGrassMat, 0.12, 0.96);
  const topGrass = new THREE.Mesh(topGrassGeo, topGrassMat);
  topGrass.receiveShadow = true;
  dioramaGroup.add(topGrass);

  // 2. Vật liệu các tầng địa chất mặt cắt đứng (Geological Strata Materials)
  const grassRimMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.9, flatShading: true }); // Tầng cỏ mép
  const upperSoilMat = new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.95, flatShading: true }); // Tầng đất mùn nâu ấm
  const midClayMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.92, flatShading: true });  // Tầng sét nâu đỏ
  const deepRockMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.95, flatShading: true }); // Tầng đá bazan sẫm màu
  const underBaseMat = new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.98 }); // Đáy đảo

  // Hàm tạo 1 vách cắt địa tầng đa lớp chuẩn hình vuông
  const buildStrataWall = (length, posX, posZ, rotY) => {
    const wallGroup = new THREE.Group();
    wallGroup.position.set(posX, 0, posZ);
    wallGroup.rotation.y = rotY;

    // Lớp 1: Viền cỏ bề mặt (0.0 đến -1.2m)
    const layer1 = new THREE.Mesh(new THREE.BoxGeometry(length, 1.2, 0.4), grassRimMat);
    layer1.position.set(0, -0.6, 0);
    wallGroup.add(layer1);

    // Lớp 2: Tầng đất mùn nâu vàng (-1.2m đến -7.0m)
    const layer2 = new THREE.Mesh(new THREE.BoxGeometry(length, 5.8, 0.4), upperSoilMat);
    layer2.position.set(0, -4.1, 0);
    wallGroup.add(layer2);

    // Lớp 3: Tầng đất sét & sỏi cát xen kẽ (-7.0m đến -15.0m)
    const layer3 = new THREE.Mesh(new THREE.BoxGeometry(length, 8.0, 0.4), midClayMat);
    layer3.position.set(0, -11.0, 0);
    wallGroup.add(layer3);

    // Lớp 4: Tầng thềm đá bazan magma kiên cố (-15.0m đến -24.0m)
    const layer4 = new THREE.Mesh(new THREE.BoxGeometry(length, 9.0, 0.4), deepRockMat);
    layer4.position.set(0, -19.5, 0);
    wallGroup.add(layer4);

    // Các dải vân địa tầng sọc ngang mộc mạc nổi bật (như ảnh tham khảo)
    const stripeCount = 9;
    for (let s = 1; s <= stripeCount; s++) {
      const sy = -1.5 - s * 2.3;
      const stripeMat = s % 2 === 0 ? upperSoilMat : deepRockMat;
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(length, 0.25, 0.5), stripeMat);
      stripe.position.set(0, sy, 0);
      wallGroup.add(stripe);
    }

    return wallGroup;
  };

  // Dựng 4 mặt cắt vách hộp hình vuông (Bắc, Nam, Tây, Đông)
  dioramaGroup.add(buildStrataWall(W, cx, cz - D / 2, 0));            // Vách Bắc (Z = -200)
  dioramaGroup.add(buildStrataWall(W, cx, cz + D / 2, Math.PI));     // Vách Nam (Z = +100)
  dioramaGroup.add(buildStrataWall(D, cx - W / 2, cz, Math.PI / 2)); // Vách Tây (X = -175)
  dioramaGroup.add(buildStrataWall(D, cx + W / 2, cz, -Math.PI / 2));// Vách Đông (X = +125)

  // 3. Mặt đáy dưới cùng của khối hộp hình vuông (Bottom Slab)
  const bottomPlate = new THREE.Mesh(new THREE.BoxGeometry(W, 0.8, D), underBaseMat);
  bottomPlate.position.set(cx, -cliffDepth - 0.4, cz);
  dioramaGroup.add(bottomPlate);

  // 4. Thác nước tràn qua mép vách cắt đổ xuống không trung (như ảnh tham khảo)
  const waterCanalX = 89.5;
  const waterfallMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    roughness: 0.1,
    metalness: 0.15,
    transparent: true,
    opacity: 0.88,
  });
  const foamMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.92 });

  // Thác nước mép Nam (dòng sông đổ xuống vách Nam)
  const southFall = new THREE.Mesh(new THREE.BoxGeometry(9.5, cliffDepth, 0.3), waterfallMat);
  southFall.position.set(waterCanalX, -cliffDepth / 2, cz + D / 2 + 0.1);
  dioramaGroup.add(southFall);

  const southFoam = new THREE.Mesh(new THREE.BoxGeometry(11.0, 2.2, 1.2), foamMat);
  southFoam.position.set(waterCanalX, -cliffDepth, cz + D / 2 + 0.6);
  dioramaGroup.add(southFoam);

  // Thác nước mép Bắc (dòng sông đổ xuống vách Bắc)
  const northFall = new THREE.Mesh(new THREE.BoxGeometry(9.5, cliffDepth, 0.3), waterfallMat);
  northFall.position.set(waterCanalX, -cliffDepth / 2, cz - D / 2 - 0.1);
  dioramaGroup.add(northFall);

  const northFoam = new THREE.Mesh(new THREE.BoxGeometry(11.0, 2.2, 1.2), foamMat);
  northFoam.position.set(waterCanalX, -cliffDepth, cz - D / 2 - 0.6);
  dioramaGroup.add(northFoam);

  // Thác nước mép Tây (dòng suối từ hồ sinh thái đổ xuống vách Tây như ảnh mẫu)
  const westFallZ = -54;
  const westFall = new THREE.Mesh(new THREE.BoxGeometry(0.3, cliffDepth, 8.5), waterfallMat);
  westFall.position.set(cx - W / 2 - 0.1, -cliffDepth / 2, westFallZ);
  dioramaGroup.add(westFall);

  const westFoam = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.2, 9.8), foamMat);
  westFoam.position.set(cx - W / 2 - 0.6, -cliffDepth, westFallZ);
  dioramaGroup.add(westFoam);

  const westCanal = new THREE.Mesh(new THREE.BoxGeometry(45, 0.35, 5.5), waterfallMat);
  westCanal.position.set(-153.5, -0.05, westFallZ);
  dioramaGroup.add(westCanal);

  // 5. Các ngọn đồi uốn lượn NẰM TRỌN VẸN BÊN TRONG HÌNH VUÔNG (Interior Hills Only)
  // Bỏ toàn bộ các dãy núi chân trời xa ngoài hình vuông, chỉ giữ các ngọn đồi nội vi diorama
  const interiorHills = [
    { x: 58, y: 13, z: -128, radius: 36, height: 26, color: 0x22c55e, segs: 10 },  // Đồi cối xay gió lùi xa về phía Bắc (Z = -128, chân đồi kết thúc tại Z = -92, cách Nhà B > 24m)
    { x: 115, y: 11, z: -80, radius: 24, height: 22, color: 0x16a34a, segs: 9 },   // Đồi Đông xa (sau sông và đường ray, không lấn ray)
    { x: 116, y: 9, z: -25, radius: 20, height: 18, color: 0x15803d, segs: 9 },    // Đồi Đông Nam xa (không chèn ray hay Nhà B)
    { x: -145, y: 15, z: -155, radius: 48, height: 30, color: 0x15803d, segs: 10 }, // Đồi góc Tây Bắc bên trong hình vuông
    { x: 75, y: 15, z: -160, radius: 46, height: 30, color: 0x166534, segs: 10 },  // Đồi góc Đông Bắc bên trong hình vuông
    { x: -60, y: 16, z: -160, radius: 52, height: 32, color: 0x15803d, segs: 10 }, // Đồi sườn Bắc bên trong hình vuông
    { x: -138, y: 9, z: 72, radius: 32, height: 18, color: 0x166534, segs: 9 },    // Đồi góc Tây Nam (lùi sâu xuống góc, không chạm DK2)
  ];

  interiorHills.forEach((h) => {
    // Tăng mật độ phân đoạn (14 cạnh, 8 tầng) để hỗ trợ hòa sắc vertex colors loang màu đất nâu
    const hillGeo = new THREE.ConeGeometry(h.radius, h.height, h.segs ? Math.max(h.segs, 12) : 14, 8);
    const pos = hillGeo.attributes.position;
    const hillColors = [];
    const baseGreen = new THREE.Color(h.color);
    const deepGreen = baseGreen.clone().offsetHSL(-0.02, 0.05, -0.09);
    const vibrantGreen = baseGreen.clone().offsetHSL(0.03, 0.08, 0.06);
    const earthWarm = new THREE.Color(0x78350f);
    const earthDark = new THREE.Color(0x542d13);
    const sandLoam = new THREE.Color(0x92400e);

    for (let vi = 0; vi < pos.count; vi++) {
      const vx = pos.getX(vi);
      const vy = pos.getY(vi);
      const vz = pos.getZ(vi);
      const wx = h.x + vx;
      const wz = h.z + vz;

      // Chuẩn hóa cao độ từ đáy nón (-height/2) lên đỉnh (+height/2)
      const normY = (vy + h.height / 2) / h.height; // [0..1]

      // Nhiễu địa tầng & vỉa đất lộ thiên sườn đồi
      const strataNoise = Math.sin(wx * 0.14 + vy * 0.35) * 0.5 + Math.cos(wz * 0.16 + vy * 0.2) * 0.5;
      const patchNoise = Math.sin(wx * 0.08 - wz * 0.09) * 0.5 + Math.cos(wx * 0.22 + wz * 0.18) * 0.5;

      // Đáy đồi và sườn dốc thi thoảng loang vạt đất nâu tự nhiên
      let isEarth = false;
      let earthIntensity = 0;

      if (normY < 0.22) {
        // Chân đồi: chuyển tiếp từ đất ven chân đồi lên thảm cỏ
        if (strataNoise > 0.15 || patchNoise > 0.28) {
          isEarth = true;
          earthIntensity = Math.min(1.0, (0.22 - normY) / 0.22 * 0.75 + strataNoise * 0.35);
        }
      } else if (normY >= 0.22 && normY <= 0.82) {
        // Sườn đồi: các vệt loang đất nâu & đá lộ thiên theo vách dốc
        if (strataNoise > 0.18 && patchNoise > -0.15) {
          isEarth = true;
          earthIntensity = Math.min(1.0, (strataNoise - 0.18) * 1.7 + patchNoise * 0.35);
        }
      } else {
        // Đỉnh đồi: mảng đất mòn / phong hóa trên chỏm
        if (patchNoise > 0.42) {
          isEarth = true;
          earthIntensity = 0.55;
        }
      }

      let col = baseGreen.clone();
      if (normY > 0.5) col.lerp(vibrantGreen, (normY - 0.5) * 0.6);
      else col.lerp(deepGreen, (0.5 - normY) * 0.5);

      if (isEarth && earthIntensity > 0) {
        const targetSoil = (strataNoise > 0.38) ? earthDark : ((patchNoise > 0.2) ? earthWarm : sandLoam);
        col.lerp(targetSoil, Math.min(0.92, earthIntensity));
      }

      hillColors.push(col.r, col.g, col.b);
    }

    hillGeo.setAttribute('color', new THREE.Float32BufferAttribute(hillColors, 3));
    hillGeo.computeVertexNormals();

    const hillMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.92,
      flatShading: true
    });
    applySnowShader(hillMat, 0.22, 0.96);

    const hillMesh = new THREE.Mesh(hillGeo, hillMat);
    hillMesh.position.set(h.x, h.y, h.z);
    hillMesh.receiveShadow = true;
    dioramaGroup.add(hillMesh);
  });

  scene.add(dioramaGroup);

  // 6. Cối xay gió phong cách Hà Lan trên đỉnh đồi sinh thái Bắc (Giữ nguyên)
  const windmillGroup = new THREE.Group();
  windmillGroup.position.set(58, 24.5, -128);

  const millTower = new THREE.Mesh(
    new THREE.CylinderGeometry(2.2, 3.8, 9.5, 8),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.7, flatShading: true })
  );
  millTower.castShadow = true;
  windmillGroup.add(millTower);

  const millRoof = new THREE.Mesh(
    new THREE.ConeGeometry(2.8, 2.8, 8),
    new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.6, flatShading: true })
  );
  millRoof.position.y = 5.8;
  millRoof.castShadow = true;
  windmillGroup.add(millRoof);

  const doorMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 });
  const millDoor = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.6, 0.2), doorMat);
  millDoor.position.set(0, -3.2, 3.6);
  windmillGroup.add(millDoor);

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

  // 7. Các cụm mây trắng bồng bềnh lơ lửng quanh chân đảo (như ảnh tham khảo)
  skyClouds = [];
  const cloudMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4, flatShading: true });
  const baseCloudConfigs = [
    // Mây trôi lượn lờ quanh mép Nam và thác nước
    { x: -140, y: -18, z: 108, scale: 1.2, speed: 1.5 },
    { x: -80, y: -20, z: 105, scale: 1.5, speed: 1.8 },
    { x: 0, y: -16, z: 108, scale: 1.3, speed: 1.4 },
    { x: 75, y: -22, z: 105, scale: 1.6, speed: 2.0 }, // Chân thác Nam
    { x: 115, y: -19, z: 95, scale: 1.2, speed: 1.6 },
    // Mây quanh mép Tây
    { x: -182, y: -18, z: -140, scale: 1.4, speed: 1.7 },
    { x: -180, y: -21, z: -70, scale: 1.6, speed: 1.5 },
    { x: -182, y: -16, z: 10, scale: 1.3, speed: 1.8 },
    // Mây quanh mép Đông
    { x: 132, y: -18, z: -130, scale: 1.5, speed: 1.6 },
    { x: 130, y: -22, z: -50, scale: 1.4, speed: 1.7 },
    { x: 132, y: -16, z: 30, scale: 1.6, speed: 1.9 },
    // Mây quanh mép Bắc & Chân thác Bắc
    { x: -120, y: -20, z: -205, scale: 1.5, speed: 1.5 },
    { x: -30, y: -18, z: -208, scale: 1.3, speed: 1.8 },
    { x: 80, y: -22, z: -205, scale: 1.6, speed: 2.1 }, // Chân thác Bắc
    // Mây trên không trung
    { x: -110, y: 72, z: -80, scale: 1.4, speed: 2.2 },
    { x: 45, y: 76, z: -40, scale: 1.6, speed: 2.5 },
    { x: -20, y: 82, z: 40, scale: 1.3, speed: 2.0 },
  ];

  baseCloudConfigs.forEach((cc) => {
    const cGroup = new THREE.Group();
    cGroup.position.set(cc.x, cc.y, cc.z);
    cGroup.userData = { speed: cc.speed };

    const puffCount = 5;
    for (let p = 0; p < puffCount; p++) {
      const pr = (0.9 + Math.random() * 0.7) * cc.scale;
      const puff = new THREE.Mesh(new THREE.DodecahedronGeometry(pr, 1), cloudMat);
      puff.position.set(
        (p - 2) * 1.5 * cc.scale + (Math.random() - 0.5) * 0.8,
        (Math.random() - 0.5) * 0.6 * cc.scale,
        (Math.random() - 0.5) * 1.2 * cc.scale
      );
      cGroup.add(puff);
    }
    scene.add(cGroup);
    skyClouds.push(cGroup);
  });
}

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

// Hiệu ứng vòng sóng nước bắn tung tóe khi cá Koi nhảy búng nước
function createWaterSplash(x, y, z, parentGroup = null) {
  const ringGeo = new THREE.RingGeometry(0.12, 0.28, 24);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.85,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(x, y + 0.015, z);
  if (parentGroup) {
    parentGroup.add(ring);
  } else {
    scene.add(ring);
  }
  waterSplashRipples.push({
    mesh: ring,
    parent: parentGroup || scene,
    scale: 0.35,
    maxScale: 2.2,
    opacity: 0.85,
    life: 0,
    maxLife: 1.1,
  });
}

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

        // 1. Họa tiết sóng gợn đáy nước êm dịu, nhẹ nhàng (mặt nước tĩnh tại, êm đềm, triệt tiêu toàn bộ hạt kim cương li ti)
        float c1 = sin(vWorldPosition.x * 1.2 + uTime * 0.7) * cos(vWorldPosition.z * 1.2 - uTime * 0.6);
        float c2 = cos(vWorldPosition.x * 1.8 - uTime * 0.8) * sin(vWorldPosition.z * 1.8 + uTime * 0.7);
        float caustic = pow(clamp((c1 + c2) * 0.5 + 0.5, 0.0, 1.0), 2.2) * 0.08;
        waterCol += caustic * vec3(0.55, 0.85, 1.0);

        // 2. Dải viền bọt cát trắng mịn ôm bờ nhẹ nhàng
        float shoreEdge = (uIsCurvedCanal > 0.5) ? abs(vUv.x - 0.5) * 2.0 : length(vUv - vec2(0.5)) * 2.0;
        float foam = smoothstep(0.92, 0.99, shoreEdge) * 0.65;
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
        float spec = pow(max(dot(vNormal, halfDir), 0.0), 32.0);
        waterCol += spec * uSunColor * 0.55;

        // Nước trong xanh tươi tắn, có độ trong suốt nhìn thấu đáy cát và đàn cá bơi lội
        gl_FragColor = vec4(waterCol, 0.82);
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

// Cụm rừng cây búp mây bồng bềnh & thảm hoa dại bao bọc 2 đầu cầu đường sắt (Chuẩn 100% như ảnh mẫu bên trái)
function buildBridgeLushForest() {
  const groveGroup = new THREE.Group();
  groveGroup.name = 'bridgeLushForestGroup';

  const trunkGeo = new THREE.CylinderGeometry(0.24, 0.42, 2.4, 6);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c3d2e, roughness: 0.9, flatShading: true });

  const treePalettes = [
    { name: 'lime', color: 0x4ade80, rough: 0.75 },
    { name: 'vibrantGreen', color: 0x22c55e, rough: 0.72 },
    { name: 'emerald', color: 0x16a34a, rough: 0.74 },
    { name: 'deepForest', color: 0x15803d, rough: 0.76 },
    { name: 'olive', color: 0x65a30d, rough: 0.78 },
    { name: 'autumnGold', color: 0xf59e0b, rough: 0.70 },
    { name: 'autumnOrange', color: 0xd97706, rough: 0.72 },
  ];

  const treeMaterials = treePalettes.map(p =>
    new THREE.MeshStandardMaterial({ color: p.color, roughness: p.rough, flatShading: false })
  );

  // Danh sách vị trí cây rừng dày dặc bao bọc 2 bên bờ sông và 2 đầu cầu
  // (Đã loại bỏ 100% cây phía Tây xâm lấn vào Nhà B, Mái che xe và đường chạy thử)
  const bridgeTrees = [
    // Bờ Bắc (North Bank, Z = -58 đến -78)
    // Phía Tây đường sắt: Chỉ trồng sát mép mương nước X >= 86.0, cách xa Nhà B và Mái che xe
    { x: 86.5, z: -66.5, r: 1.65, matIdx: 0 },
    { x: 87.5, z: -74.0, r: 1.85, matIdx: 5 }, // Cây thu vàng
    { x: 87.0, z: -60.0, r: 1.60, matIdx: 1 },
    // Phía Đông đường sắt & chân đồi phía Đông
    { x: 104.0, z: -57.0, r: 2.05, matIdx: 2 },
    { x: 107.5, z: -62.0, r: 2.40, matIdx: 5 }, // Cây thu vàng cam
    { x: 102.5, z: -67.0, r: 1.85, matIdx: 0 },
    { x: 106.0, z: -72.0, r: 2.20, matIdx: 3 },
    { x: 110.5, z: -66.0, r: 2.00, matIdx: 6 }, // Cây thu cam
    { x: 112.0, z: -74.0, r: 2.50, matIdx: 2 },
    { x: 101.0, z: -75.0, r: 1.90, matIdx: 4 },
    { x: 108.0, z: -80.0, r: 2.30, matIdx: 1 },
    { x: 114.0, z: -68.0, r: 2.10, matIdx: 3 },

    // Bờ Nam (South Bank, Z = -36 đến -16)
    // Phía Tây đường sắt: Giữ khoảng cách an toàn với sân thử xe và Nhà B
    { x: 86.5, z: -35.0, r: 1.70, matIdx: 0 },
    { x: 86.8, z: -18.0, r: 1.75, matIdx: 3 },
    { x: 86.0, z: -23.0, r: 1.65, matIdx: 1 },
    // Phía Đông đường sắt
    { x: 102.0, z: -36.0, r: 2.15, matIdx: 1 },
    { x: 106.0, z: -31.0, r: 2.35, matIdx: 6 }, // Cây thu cam rực rỡ
    { x: 100.5, z: -26.0, r: 1.85, matIdx: 0 },
    { x: 105.0, z: -21.0, r: 2.20, matIdx: 2 },
    { x: 109.0, z: -25.0, r: 2.00, matIdx: 5 }, // Cây vàng
    { x: 108.5, z: -17.0, r: 2.40, matIdx: 3 },
    { x: 113.0, z: -22.0, r: 2.20, matIdx: 2 },
  ];

  bridgeTrees.forEach((bt) => {
    // Tuyệt đối loại bỏ bất kỳ cây nào vi phạm khoảng cách an toàn với Nhà B, Mái che xe và đường chạy thử
    if (bt.x <= 85.0 && bt.z >= -86 && bt.z <= -20) return;

    const treeGroup = new THREE.Group();
    const groundY = getTerrainElevation ? getTerrainElevation(bt.x, bt.z) : 0.2;
    treeGroup.position.set(bt.x, Math.max(0.1, groundY), bt.z);

    // Thân cây
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 1.2;
    trunk.scale.setScalar(bt.r / 1.8);
    trunk.castShadow = true;
    treeGroup.add(trunk);

    // Tán cây búp mây bồng bềnh
    const canopyGeo = createPuffyCloudCanopyGeometry(bt.r);
    const canopyMat = treeMaterials[bt.matIdx % treeMaterials.length];
    const canopy = new THREE.Mesh(canopyGeo, canopyMat);
    canopy.position.y = 2.4 * (bt.r / 1.8);
    canopy.rotation.y = Math.random() * Math.PI * 2;
    canopy.castShadow = true;
    canopy.receiveShadow = true;
    treeGroup.add(canopy);

    groveGroup.add(treeGroup);
  });

  // Thảm hoa dại li ti (Daisies & Pink Wildflowers) nở rộ trên thảm cỏ ven 2 đầu cầu
  const flowerGeo = new THREE.SphereGeometry(0.18, 6, 5);
  const flwWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const flwPinkMat = new THREE.MeshBasicMaterial({ color: 0xf472b6 });
  const flwYellowMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });

  for (let f = 0; f < 65; f++) {
    const fx = 80 + Math.random() * 32;
    const fz = -75 + Math.random() * 58;
    // Tránh giữa sông và đường ray
    if (Math.hypot(fx - 93.5, fz - (-48)) < 6.5) continue;
    if (Math.abs(fx - 92) < 2.5 && fz > -55 && fz < -40) continue;

    const fy = getTerrainElevation ? getTerrainElevation(fx, fz) : 0.2;
    const fMat = f % 3 === 0 ? flwWhiteMat : (f % 3 === 1 ? flwPinkMat : flwYellowMat);
    const flw = new THREE.Mesh(flowerGeo, fMat);
    flw.position.set(fx, Math.max(0.08, fy + 0.08), fz);
    flw.scale.set(1.0, 0.45, 1.0);
    groveGroup.add(flw);
  }

  scene.add(groveGroup);
}

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
  // A. Sông máng nước uốn lượn trong vắt, bãi cát ven bờ, thuyền nan & hoa súng
  // Tuyến sông uốn lượn song song với đường sắt, chảy dưới Cầu vòm đỏ và bên cạnh Ga DK Station
  // --------------------------------------------------------------------------
  const canalWidth = CONFIG.CANAL.width; // 9.5m
  const segments = 140;

  const waterPositions = [];
  const waterUvs = [];
  const waterIndices = [];

  const bedPositions = [];
  const bedUvs = [];
  const bedIndices = [];

  const sandLPositions = [];
  const sandLUvs = [];
  const sandLIndices = [];

  const sandRPositions = [];
  const sandRUvs = [];
  const sandRIndices = [];

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const pt = canalCurve.getPointAt(t);
    const tan = canalCurve.getTangentAt(t);
    const norm = new THREE.Vector3(-tan.z, 0, tan.x).normalize();

    const waterY = -0.32;
    const bedY = -1.15;
    const bankY = 0.02;

    const wHalf = canalWidth / 2 - 0.15; // 4.6m
    const wLeft = pt.clone().sub(norm.clone().multiplyScalar(wHalf));
    const wRight = pt.clone().add(norm.clone().multiplyScalar(wHalf));

    const sLeftOuter = pt.clone().sub(norm.clone().multiplyScalar(wHalf + 3.6));
    const sRightOuter = pt.clone().add(norm.clone().multiplyScalar(wHalf + 3.6));

    // 1. Mặt nước (Water ribbon)
    waterPositions.push(wLeft.x, waterY, wLeft.z);
    waterPositions.push(wRight.x, waterY, wRight.z);
    waterUvs.push(0, t * 8.0);
    waterUvs.push(1, t * 8.0);

    // 2. Đáy mương (Canal bed)
    bedPositions.push(wLeft.x, bedY, wLeft.z);
    bedPositions.push(wRight.x, bedY, wRight.z);
    bedUvs.push(0, t * 8.0);
    bedUvs.push(1, t * 8.0);

    // 3. Bờ cát trái (Bờ Tây)
    sandLPositions.push(sLeftOuter.x, bankY, sLeftOuter.z);
    sandLPositions.push(wLeft.x, waterY + 0.04, wLeft.z);
    sandLUvs.push(0, t * 8.0);
    sandLUvs.push(1, t * 8.0);

    // 4. Bờ cát phải (Bờ Đông)
    sandRPositions.push(wRight.x, waterY + 0.04, wRight.z);
    sandRPositions.push(sRightOuter.x, bankY, sRightOuter.z);
    sandRUvs.push(0, t * 8.0);
    sandRUvs.push(1, t * 8.0);

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

  // Thuyền nan & người chèo đò nổi bồng bềnh trên sông máng (Dời về Z = -82, X = 91.8, cách xa đường sắt > 15m)
  const boatGroup = new THREE.Group();
  boatGroup.position.set(91.8, -0.30, -82.0);
  boatGroup.rotation.y = 0.05;

  const boatHull = new THREE.Mesh(
    new THREE.BoxGeometry(1.6, 0.55, 4.2),
    new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.8 })
  );
  boatHull.position.y = 0.22;
  boatHull.castShadow = true;
  boatGroup.add(boatHull);

  const boatman = createCharacter({ shirtColor: 0xef4444, pantsColor: 0x1e293b, hatColor: 0xfef08a, isDriver: true });
  boatman.position.set(0, 0.48, 0.4);
  boatGroup.add(boatman);

  const oar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 2.8),
    new THREE.MeshStandardMaterial({ color: 0xd4a373, roughness: 0.7 })
  );
  oar.rotation.z = Math.PI / 4;
  oar.position.set(0.6, 0.95, 0.2);
  boatGroup.add(oar);

  boatGroup.userData = {
    id: 'rowingBoat',
    title: 'Thuyền nan du ngoạn sinh thái trên sông máng',
    type: 'boat',
    desc: 'Hoạt động chèo thuyền thư giãn trên dòng sông máng nước trong vắt, cách xa đường ray xe lửa.',
    zone: 'Sông Máng Nước',
    oar: oar,
  };
  boatHull.userData = boatGroup.userData;
  scene.add(boatGroup);
  interactiveObjects.push(boatHull);
  rowingBoat = boatGroup;

  // Lá sen tròn to (Lily Pads) & hoa súng nổi trên mặt sông máng
  const lilyMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.6, side: THREE.DoubleSide });
  const lilyFlowerMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.3 });
  lotusLeaves = [];

  const lilyOffsets = [
    { t: 0.36, offX: -1.6, offZ: -2.0 },
    { t: 0.40, offX: 1.4, offZ: 1.5 },
    { t: 0.48, offX: -1.8, offZ: -3.0 },
    { t: 0.52, offX: 1.6, offZ: 2.0 },
    { t: 0.60, offX: -1.2, offZ: 3.0 },
  ];
  lilyOffsets.forEach((lo, lIdx) => {
    const lPt = canalCurve.getPointAt(lo.t);
    const pad = new THREE.Mesh(new THREE.CircleGeometry(0.85, 12, 0.4, Math.PI * 1.85), lilyMat);
    pad.rotation.x = -Math.PI / 2;
    pad.position.set(lPt.x + lo.offX, -0.28, lPt.z + lo.offZ);
    scene.add(pad);
    lotusLeaves.push(pad);

    if (lIdx % 2 === 0) {
      const flower = new THREE.Mesh(new THREE.DodecahedronGeometry(0.24), lilyFlowerMat);
      flower.position.set(lPt.x + lo.offX + 0.1, -0.20, lPt.z + lo.offZ - 0.1);
      scene.add(flower);
    }
  });

  buildBridgeLushForest();

  // Đàn cá Koi & cá sông bơi lội, nhảy lên khỏi mặt nước dọc theo dòng sông cạnh đường tàu (Khối 4 & 5)
  buildRiverJumpingFish();

  // Bổ sung sỏi đá cuội ven bờ & Cụm hoa súng nở rộ rực rỡ quanh chân cầu đường sắt (chuẩn 100% như ảnh mẫu bên trái)
  const riverPebbleMat = new THREE.MeshStandardMaterial({
    color: 0x78716c,
    roughness: 0.85,
    flatShading: true,
  });
  const pebbleMatDark = new THREE.MeshStandardMaterial({
    color: 0x475569,
    roughness: 0.9,
    flatShading: true,
  });
  const pebbleMatWarm = new THREE.MeshStandardMaterial({
    color: 0x854d0e,
    roughness: 0.88,
    flatShading: true,
  });

  // Đá cuội rải rác tự nhiên 2 bên bờ mép cát
  const pebbleCoords = [
    // Bờ Tây (Mạn trái sông)
    { x: 88.5, z: -58, s: 0.42, mat: riverPebbleMat },
    { x: 88.2, z: -54, s: 0.65, mat: pebbleMatDark },
    { x: 88.8, z: -50, s: 0.35, mat: pebbleMatWarm },
    { x: 88.4, z: -45, s: 0.55, mat: riverPebbleMat },
    { x: 88.6, z: -40, s: 0.38, mat: pebbleMatDark },
    { x: 88.2, z: -35, s: 0.72, mat: pebbleMatWarm },
    { x: 87.8, z: -25, s: 0.48, mat: riverPebbleMat },
    { x: 87.5, z: -15, s: 0.58, mat: pebbleMatDark },
    { x: 87.8, z: -6, s: 0.38, mat: riverPebbleMat },
    { x: 88.0, z: 8, s: 0.52, mat: pebbleMatWarm },
    { x: 88.2, z: 22, s: 0.62, mat: riverPebbleMat },
    // Bờ Đông (Mạn phải sông)
    { x: 95.8, z: -60, s: 0.45, mat: pebbleMatDark },
    { x: 96.2, z: -55, s: 0.68, mat: riverPebbleMat },
    { x: 95.5, z: -48, s: 0.38, mat: pebbleMatWarm },
    { x: 95.8, z: -42, s: 0.58, mat: riverPebbleMat },
    { x: 94.5, z: -35, s: 0.48, mat: pebbleMatDark },
    { x: 93.8, z: -22, s: 0.62, mat: pebbleMatWarm },
    { x: 93.2, z: -10, s: 0.42, mat: riverPebbleMat },
    { x: 93.5, z: 5, s: 0.55, mat: pebbleMatDark },
    { x: 94.0, z: 18, s: 0.68, mat: pebbleMatWarm },
  ];

  pebbleCoords.forEach((pb) => {
    const pebble = new THREE.Mesh(new THREE.DodecahedronGeometry(pb.s, 0), pb.mat);
    pebble.scale.set(1.2, 0.65, 0.95);
    pebble.position.set(pb.x, -0.15, pb.z);
    pebble.rotation.set(Math.random() * 2, Math.random() * 2, Math.random() * 2);
    pebble.castShadow = true;
    pebble.receiveShadow = true;
    scene.add(pebble);
  });

  // Cụm lá sen & Hoa súng nở hồng phấn nhụy vàng rực rỡ dưới chân cầu (như ảnh mẫu)
  const padMatVibrant = new THREE.MeshStandardMaterial({
    color: 0x22c55e,
    roughness: 0.55,
    side: THREE.DoubleSide,
  });
  const lotusPinkMat = new THREE.MeshStandardMaterial({
    color: 0xf472b6,
    roughness: 0.3,
  });
  const lotusCenterMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    roughness: 0.2,
  });

  // Hàm tạo bông hoa súng 8 cánh nở rực rỡ
  const createWaterLilyFlower = () => {
    const flwGroup = new THREE.Group();
    // 8 cánh hoa hồng xòe
    for (let p = 0; p < 8; p++) {
      const ang = (p / 8) * Math.PI * 2;
      const petal = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.38, 4), lotusPinkMat);
      petal.rotation.x = Math.PI / 3.2;
      petal.rotation.z = Math.PI / 2;
      petal.position.set(Math.cos(ang) * 0.18, 0.08, Math.sin(ang) * 0.18);
      petal.rotation.y = -ang;
      flwGroup.add(petal);
    }
    // Nhụy vàng rực rỡ ở giữa
    const center = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), lotusCenterMat);
    center.position.y = 0.08;
    flwGroup.add(center);
    return flwGroup;
  };

  // Cụm lá sen mạn Tây cầu (Z = -44 đến -55)
  const lilyClusterWest = [
    { x: 91.2, z: -55, r: 0.95, rot: 0.2, hasFlower: true },
    { x: 90.4, z: -53, r: 0.75, rot: 1.4, hasFlower: false },
    { x: 91.8, z: -52, r: 0.85, rot: 2.1, hasFlower: false },
    { x: 90.8, z: -49, r: 1.15, rot: -0.6, hasFlower: true }, // Hoa súng lớn nở cạnh bóng cầu
    { x: 92.2, z: -46, r: 0.80, rot: 0.8, hasFlower: false },
    { x: 90.2, z: -44, r: 0.90, rot: 1.9, hasFlower: false },
    { x: 89.8, z: -40, r: 0.70, rot: -1.2, hasFlower: false },
  ];

  lilyClusterWest.forEach((lc) => {
    const lPad = new THREE.Mesh(new THREE.CircleGeometry(lc.r, 16, 0.35, Math.PI * 1.88), padMatVibrant);
    lPad.rotation.x = -Math.PI / 2;
    lPad.rotation.z = lc.rot;
    lPad.position.set(lc.x, -0.28, lc.z);
    lPad.receiveShadow = true;
    scene.add(lPad);

    if (lc.hasFlower) {
      const lilyFlw = createWaterLilyFlower();
      lilyFlw.position.set(lc.x + 0.1, -0.22, lc.z - 0.1);
      scene.add(lilyFlw);
    }
  });

  // Cụm lá sen mạn Đông cầu (Z = -50 đến -38)
  const lilyClusterEast = [
    { x: 95.2, z: -49, r: 0.85, rot: 0.4, hasFlower: false },
    { x: 94.6, z: -45, r: 1.05, rot: 1.8, hasFlower: true },
    { x: 95.8, z: -42, r: 0.75, rot: -0.5, hasFlower: false },
    { x: 94.8, z: -38, r: 0.90, rot: 2.4, hasFlower: false },
  ];

  lilyClusterEast.forEach((lc) => {
    const lPad = new THREE.Mesh(new THREE.CircleGeometry(lc.r, 16, 0.35, Math.PI * 1.88), padMatVibrant);
    lPad.rotation.x = -Math.PI / 2;
    lPad.rotation.z = lc.rot;
    lPad.position.set(lc.x, -0.28, lc.z);
    lPad.receiveShadow = true;
    scene.add(lPad);

    if (lc.hasFlower) {
      const lilyFlw = createWaterLilyFlower();
      lilyFlw.position.set(lc.x - 0.1, -0.22, lc.z + 0.1);
      scene.add(lilyFlw);
    }
  });

  // (Đã loại bỏ khối hộp cầu gỗ mộc thô kệch Z = 20 để dòng sông thông suốt, nguyên bản như ảnh mẫu)

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
  // C. Cây Cầu đường sắt màu đỏ uốn cong vượt sông (Curved Red Steel Railway Bridge - Chuẩn 100% Ảnh Mẫu)
  // Thiết kế dạng cầu dầm thép đỏ uốn cong theo đúng tim ray railwayCurve, không có khung vòm che tầm nhìn
  // Nhìn từ trên cao xuống thấy rõ ray thép, tà vẹt gỗ, thành cầu đỏ, bóng cầu in trên làn nước biếc và hoa sen
  // --------------------------------------------------------------------------
  const bridgeGroup = new THREE.Group();

  const redSteelMat = new THREE.MeshStandardMaterial({
    color: 0xdc2626, // Màu đỏ son rực rỡ tươi tắn như ảnh mẫu (Vermilion Red)
    roughness: 0.32,
    metalness: 0.52,
  });

  const redSteelDarkMat = new THREE.MeshStandardMaterial({
    color: 0xb91c1c, // Đỏ đậm tạo chiều sâu mặt dưới & dầm giằng
    roughness: 0.45,
    metalness: 0.45,
  });

  const pierMat = new THREE.MeshStandardMaterial({
    color: 0x64748b, // Mố cầu đá xám xanh tự nhiên
    roughness: 0.92,
    flatShading: true,
  });

  // Tham số khoảng lấy mẫu cầu trên tuyến đường sắt (Z từ ~ -61 đến ~ -33)
  const bridgeTStart = 0.315;
  const bridgeTEnd = 0.465;
  const bridgeSlices = 36;
  const bridgeWidth = 4.5; // Khổ rộng mặt cầu 4.5m (hành lang thông thoáng cho tàu 2.5m)
  const girderHeight = 0.95; // Chiều cao thành cầu dầm thép đỏ 0.95m (không che khuất top-down view)

  const deckPositions = [];
  const deckNormals = [];
  const deckIndices = [];

  const shadowPositions = [];
  const shadowIndices = [];

  for (let s = 0; s <= bridgeSlices; s++) {
    const t = bridgeTStart + (s / bridgeSlices) * (bridgeTEnd - bridgeTStart);
    const pt = railwayCurve.getPointAt(t);
    const tan = railwayCurve.getTangentAt(t);
    const norm = new THREE.Vector3(-tan.z, 0, tan.x).normalize();

    const halfW = bridgeWidth / 2;
    const pLeft = pt.clone().add(norm.clone().multiplyScalar(-halfW));
    const pRight = pt.clone().add(norm.clone().multiplyScalar(halfW));

    // Mặt sàn dầm cầu đặt ngay dưới tà vẹt (pt.y - 0.08)
    const deckY = pt.y - 0.08;
    pLeft.y = deckY;
    pRight.y = deckY;

    deckPositions.push(pLeft.x, deckY, pLeft.z);
    deckPositions.push(pRight.x, deckY, pRight.z);
    deckNormals.push(0, 1, 0);
    deckNormals.push(0, 1, 0);

    // Vệt bóng đổ uốn cong nhẹ nhàng trên mặt nước (-0.30m)
    const shadowW = halfW + 0.5;
    const sLeft = pt.clone().add(norm.clone().multiplyScalar(-shadowW));
    const sRight = pt.clone().add(norm.clone().multiplyScalar(shadowW));
    shadowPositions.push(sLeft.x, -0.30, sLeft.z);
    shadowPositions.push(sRight.x, -0.30, sRight.z);

    if (s < bridgeSlices) {
      const idx = s * 2;
      deckIndices.push(idx, idx + 1, idx + 2);
      deckIndices.push(idx + 1, idx + 3, idx + 2);

      shadowIndices.push(idx, idx + 1, idx + 2);
      shadowIndices.push(idx + 1, idx + 3, idx + 2);
    }
  }

  // 1. Bản mặt sàn dầm cầu đỏ uốn cong
  const curvedDeckGeo = new THREE.BufferGeometry();
  curvedDeckGeo.setAttribute('position', new THREE.Float32BufferAttribute(deckPositions, 3));
  curvedDeckGeo.setAttribute('normal', new THREE.Float32BufferAttribute(deckNormals, 3));
  curvedDeckGeo.setIndex(deckIndices);
  curvedDeckGeo.computeVertexNormals();

  const curvedDeckMesh = new THREE.Mesh(curvedDeckGeo, redSteelMat);
  curvedDeckMesh.castShadow = true;
  curvedDeckMesh.receiveShadow = true;
  bridgeGroup.add(curvedDeckMesh);

  // Mặt dưới dầm cầu dày 0.35m tạo khối hộp kiên cố
  const bottomDeckMesh = curvedDeckMesh.clone();
  bottomDeckMesh.position.y -= 0.35;
  bottomDeckMesh.material = redSteelDarkMat;
  bridgeGroup.add(bottomDeckMesh);

  // 2. Hai thành dầm thép đỏ uốn cong (Left & Right Girder Walls) + Lan can an toàn
  for (let s = 0; s < bridgeSlices; s++) {
    const tA = bridgeTStart + (s / bridgeSlices) * (bridgeTEnd - bridgeTStart);
    const tB = bridgeTStart + ((s + 1) / bridgeSlices) * (bridgeTEnd - bridgeTStart);
    const ptA = railwayCurve.getPointAt(tA);
    const ptB = railwayCurve.getPointAt(tB);
    const tanA = railwayCurve.getTangentAt(tA);
    const tanB = railwayCurve.getTangentAt(tB);
    const normA = new THREE.Vector3(-tanA.z, 0, tanA.x).normalize();
    const normB = new THREE.Vector3(-tanB.z, 0, tanB.x).normalize();

    const halfW = bridgeWidth / 2;

    [-1, 1].forEach((side) => {
      const p1 = ptA.clone().add(normA.clone().multiplyScalar(side * halfW));
      const p2 = ptB.clone().add(normB.clone().multiplyScalar(side * halfW));
      p1.y = ptA.y - 0.25;
      p2.y = ptB.y - 0.25;

      const midPt = p1.clone().add(p2).multiplyScalar(0.5);
      const segLen = p1.distanceTo(p2);
      const segAngY = Math.atan2(p2.x - p1.x, p2.z - p1.z);

      // Tấm thành dầm thép đỏ dọc
      const girderPlate = new THREE.Mesh(
        new THREE.BoxGeometry(0.24, girderHeight, segLen + 0.04),
        redSteelMat
      );
      girderPlate.position.set(midPt.x, midPt.y + girderHeight / 2, midPt.z);
      girderPlate.rotation.y = segAngY;
      girderPlate.castShadow = true;
      girderPlate.receiveShadow = true;
      bridgeGroup.add(girderPlate);

      // Tay vịn lan can bo tròn trên đỉnh dầm
      const handRail = new THREE.Mesh(
        new THREE.CylinderGeometry(0.065, 0.065, segLen + 0.04, 6),
        redSteelMat
      );
      handRail.position.set(midPt.x, midPt.y + girderHeight + 0.04, midPt.z);
      handRail.rotation.x = Math.PI / 2;
      handRail.rotation.y = segAngY;
      handRail.castShadow = true;
      bridgeGroup.add(handRail);

      // Trụ sườn tăng cứng dầm thép đứng (Stiffener Ribs)
      if (s % 2 === 0) {
        const stiffener = new THREE.Mesh(
          new THREE.BoxGeometry(0.36, girderHeight + 0.08, 0.16),
          redSteelMat
        );
        stiffener.position.set(p1.x, p1.y + girderHeight / 2, p1.z);
        stiffener.rotation.y = segAngY;
        stiffener.castShadow = true;
        bridgeGroup.add(stiffener);
      }
    });
  }

  // 3. Mố cầu đá kiên cố 2 đầu cầu cắm vào bờ sông
  [bridgeTStart, bridgeTEnd].forEach((endT) => {
    const endPt = railwayCurve.getPointAt(endT);
    const endTan = railwayCurve.getTangentAt(endT);
    const endAngY = Math.atan2(endTan.x, endTan.z);

    const abutment = new THREE.Mesh(
      new THREE.BoxGeometry(bridgeWidth + 1.2, 3.8, 3.2),
      pierMat
    );
    abutment.position.set(endPt.x, endPt.y - 1.8, endPt.z);
    abutment.rotation.y = endAngY;
    abutment.castShadow = true;
    abutment.receiveShadow = true;
    bridgeGroup.add(abutment);
  });

  // 4. Trụ cầu giữa lòng sông nâng đỡ nhịp cầu chính (Z = -48)
  const midBridgeT = 0.385;
  const midBridgePt = railwayCurve.getPointAt(midBridgeT);
  const midBridgeTan = railwayCurve.getTangentAt(midBridgeT);
  const midPier = new THREE.Mesh(
    new THREE.BoxGeometry(bridgeWidth + 0.6, 3.2, 2.2),
    pierMat
  );
  midPier.position.set(midBridgePt.x, -0.6, midBridgePt.z);
  midPier.rotation.y = Math.atan2(midBridgeTan.x, midBridgeTan.z);
  midPier.castShadow = true;
  midPier.receiveShadow = true;
  bridgeGroup.add(midPier);

  // 5. Mặt phẳng bóng mờ uốn cong in trên mặt nước (Translucent Bridge Shadow Decal)
  const shadowGeo = new THREE.BufferGeometry();
  shadowGeo.setAttribute('position', new THREE.Float32BufferAttribute(shadowPositions, 3));
  shadowGeo.setIndex(shadowIndices);
  shadowGeo.computeVertexNormals();
  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x032541,
    transparent: true,
    opacity: 0.36,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
  bridgeGroup.add(shadowMesh);

  bridgeGroup.userData = {
    id: 'redArchBridge',
    title: 'Cầu đường sắt đỏ vượt sông (Red Steel Curved Railway Bridge)',
    type: 'bridge',
    desc: 'Cầu đường sắt dầm thép đỏ uốn lượn mềm mại vượt qua dòng sông máng nước trong veo, in bóng mờ lãng mạn xuống thảm hoa súng và đàn cá bơi lội.',
    zone: 'Đường sắt Bắc - Nam',
  };
  curvedDeckMesh.userData = bridgeGroup.userData;
  scene.add(bridgeGroup);
  interactiveObjects.push(curvedDeckMesh);

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
  // F. Đàn cừu trắng muốt đầu đen trên bãi cỏ xanh & Bóng thoại (Đứng vững chãi trên mặt cỏ Y = 0.0, không lơ lửng)
  // --------------------------------------------------------------------------
  const sheepBaseX = 108;
  const sheepBaseZ = -45;
  const sheepBaseY = 0.02; // Chân cừu đặt chuẩn xác trên thảm cỏ xanh mướt
  const sheepGroup = new THREE.Group();
  sheepGroup.position.set(sheepBaseX, sheepBaseY, sheepBaseZ);

  // Thảm cỏ gặm cỏ riêng biệt cho đàn cừu có điểm xuyết hoa dại trắng & vàng
  const pasturePatch = new THREE.Mesh(
    new THREE.CylinderGeometry(8.2, 8.8, 0.08, 16),
    new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.9, flatShading: true })
  );
  pasturePatch.position.set(0, 0.04, 0);
  pasturePatch.receiveShadow = true;
  sheepGroup.add(pasturePatch);

  const flwWMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const flwYMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
  for (let fi = 0; fi < 14; fi++) {
    const ang = Math.random() * Math.PI * 2;
    const rad = 1.8 + Math.random() * 5.2;
    const flw = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.08, 0.18), fi % 2 === 0 ? flwWMat : flwYMat);
    flw.position.set(Math.cos(ang) * rad, 0.10, Math.sin(ang) * rad);
    sheepGroup.add(flw);
  }

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
    // Chân cừu chạm đất vững chãi tại Y = 0 (cylinder chân cao 0.55m, tâm ở Y = 0.28)
    oneSheep.position.set(sc.x, 0, sc.z);
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

    // 4 chân đen vững chãi tiếp đất
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

  // Bóng thoại hoạt hình đáng yêu đặt ở độ cao vừa tầm (Y = 2.4m trên đàn cừu)
  const speechBubble = new THREE.Mesh(
    new THREE.BoxGeometry(4.2, 1.4, 0.12),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 })
  );
  speechBubble.position.set(2.5, 2.5, 0.5);
  speechBubble.rotation.y = -Math.PI / 4;
  sheepGroup.add(speechBubble);

  const bubbleTail = new THREE.Mesh(
    new THREE.ConeGeometry(0.4, 0.7, 3),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 })
  );
  bubbleTail.rotation.z = Math.PI;
  bubbleTail.position.set(1.6, 1.6, 0.5);
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
  const roadMat = new THREE.MeshStandardMaterial({
    color: CONFIG.ROADS.roadColor,
    roughness: 0.8,
    polygonOffset: true,
    polygonOffsetFactor: -1.0,
    polygonOffsetUnits: -1.0,
  });
  applySnowShader(roadMat, 0.35, 0.92);

  // Đường trước Nhà A
  const road1 = new THREE.Mesh(new THREE.PlaneGeometry(55, 3.5), roadMat);
  road1.rotation.x = -Math.PI / 2;
  road1.position.set(40, 0.05, -26.5);
  road1.receiveShadow = true;
  scene.add(road1);

  // Test track phía Bắc Nhà B (dời theo xưởng dài thêm 10m về Z = -79.5)
  const trackNorth = new THREE.Mesh(new THREE.PlaneGeometry(35, 3.2), roadMat);
  trackNorth.rotation.x = -Math.PI / 2;
  trackNorth.position.set(65, 0.05, -79.5);
  trackNorth.receiveShadow = true;
  scene.add(trackNorth);

  // Test track phía Đông Nhà B (kéo dài theo chiều dài xưởng 55m)
  const trackEast = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 55), roadMat);
  trackEast.rotation.x = -Math.PI / 2;
  trackEast.position.set(79, 0.051, -54);
  trackEast.receiveShadow = true;
  scene.add(trackEast);

  // Sân tập kết xe sau chạy thử
  const testYard = new THREE.Mesh(
    new THREE.PlaneGeometry(28, 10),
    new THREE.MeshStandardMaterial({
      color: 0x4f5860,
      roughness: 0.75,
      polygonOffset: true,
      polygonOffsetFactor: -1.5,
      polygonOffsetUnits: -1.5,
    })
  );
  testYard.rotation.x = -Math.PI / 2;
  testYard.position.set(65, 0.052, -30);
  testYard.receiveShadow = true;
  scene.add(testYard);

  // Mũi tên sơn vàng chạy thử
  const arrowMat = new THREE.MeshBasicMaterial({
    color: 0xffcc00,
    polygonOffset: true,
    polygonOffsetFactor: -2.0,
    polygonOffsetUnits: -2.0,
  });
  for (let z = -65; z <= -35; z += 12) {
    const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.6, 1.2, 3), arrowMat);
    arrow.rotation.x = -Math.PI / 2;
    arrow.rotation.z = Math.PI;
    arrow.position.set(79, 0.08, z);
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
    polygonOffset: true,
    polygonOffsetFactor: -1.0,
    polygonOffsetUnits: -1.0,
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
      cell.position.y = 0.038;
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

  // Nhóm toàn bộ Mái và Mặt tiền trên Nhà B (sẽ tự động ẩn khi xem Bên trong Xưởng B)
  const nhaBRoofGroup = new THREE.Group();
  nhaBRoofGroup.name = 'nhaBRoofGroup';
  nhaBRoofGroup.userData = { noBatch: true, dynamic: true };
  nhaBRoofGroupGlobal = nhaBRoofGroup;

  const wallMat = new THREE.MeshStandardMaterial({ color: cfg.wallColor, roughness: 0.65, metalness: 0.2 });
  const baseMat = new THREE.MeshStandardMaterial({ color: cfg.baseWallColor, roughness: 0.7 });

  // 1. Tường Bắc (Phía sau), Tường Tây (Mạn Nhà C), Tường Đông (Mạn đường thử)
  // Tường Bắc (North Wall: z = -cfg.depth / 2)
  const baseNorth = new THREE.Mesh(new THREE.BoxGeometry(cfg.width, 1.5, 0.4), baseMat);
  baseNorth.position.set(0, 0.75, -cfg.depth / 2);
  baseNorth.castShadow = true;
  group.add(baseNorth);

  const wallNorth = new THREE.Mesh(new THREE.BoxGeometry(cfg.width, cfg.height - 1.5, 0.4), wallMat);
  wallNorth.position.set(0, 1.5 + (cfg.height - 1.5) / 2, -cfg.depth / 2);
  wallNorth.castShadow = true;
  wallNorth.receiveShadow = true;
  group.add(wallNorth);

  // Tường Tây (West Wall: x = -cfg.width / 2)
  const baseWest = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.5, cfg.depth), baseMat);
  baseWest.position.set(-cfg.width / 2, 0.75, 0);
  baseWest.castShadow = true;
  group.add(baseWest);

  const wallWest = new THREE.Mesh(new THREE.BoxGeometry(0.4, cfg.height - 1.5, cfg.depth), wallMat);
  wallWest.position.set(-cfg.width / 2, 1.5 + (cfg.height - 1.5) / 2, 0);
  wallWest.castShadow = true;
  wallWest.receiveShadow = true;
  group.add(wallWest);

  // Tường Đông (East Wall: x = cfg.width / 2)
  const baseEast = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.5, cfg.depth), baseMat);
  baseEast.position.set(cfg.width / 2, 0.75, 0);
  baseEast.castShadow = true;
  group.add(baseEast);

  const wallEast = new THREE.Mesh(new THREE.BoxGeometry(0.4, cfg.height - 1.5, cfg.depth), wallMat);
  wallEast.position.set(cfg.width / 2, 1.5 + (cfg.height - 1.5) / 2, 0);
  wallEast.castShadow = true;
  wallEast.receiveShadow = true;
  group.add(wallEast);

  // 2. MẶT NAM QUAY RA SÂN BỐC DỠ: CẮT MỞ 2 CỬA THÔNG THOÁNG (Door B1 & Door B2)
  // Door B1: x = -7.0, rộng 5.6m, cao 4.2m (Tâm world X = 58.0)
  // Door B2: x = +7.0, rộng 5.0m, cao 4.2m
  const frontZ = cfg.depth / 2;

  const upperFrontH = cfg.height - 4.2;
  const upperFront = new THREE.Mesh(new THREE.BoxGeometry(cfg.width, upperFrontH, 0.4), wallMat);
  upperFront.position.set(0, 4.2 + upperFrontH / 2, frontZ);
  upperFront.castShadow = true;
  upperFront.receiveShadow = true;
  nhaBRoofGroup.add(upperFront);

  const bFrontL = new THREE.Mesh(new THREE.BoxGeometry(1.45, 1.5, 0.4), baseMat);
  bFrontL.position.set(-10.525, 0.75, frontZ);
  bFrontL.castShadow = true;
  group.add(bFrontL);

  const wFrontL = new THREE.Mesh(new THREE.BoxGeometry(1.45, 2.7, 0.4), wallMat);
  wFrontL.position.set(-10.525, 1.5 + 1.35, frontZ);
  wFrontL.castShadow = true;
  group.add(wFrontL);

  const bFrontMid = new THREE.Mesh(new THREE.BoxGeometry(8.7, 1.5, 0.4), baseMat);
  bFrontMid.position.set(0.15, 0.75, frontZ);
  bFrontMid.castShadow = true;
  group.add(bFrontMid);

  const wFrontMid = new THREE.Mesh(new THREE.BoxGeometry(8.7, 2.7, 0.4), wallMat);
  wFrontMid.position.set(0.15, 1.5 + 1.35, frontZ);
  wFrontMid.castShadow = true;
  group.add(wFrontMid);

  const bFrontR = new THREE.Mesh(new THREE.BoxGeometry(1.75, 1.5, 0.4), baseMat);
  bFrontR.position.set(10.375, 0.75, frontZ);
  bFrontR.castShadow = true;
  group.add(bFrontR);

  const wFrontR = new THREE.Mesh(new THREE.BoxGeometry(1.75, 2.7, 0.4), wallMat);
  wFrontR.position.set(10.375, 1.5 + 1.35, frontZ);
  wFrontR.castShadow = true;
  group.add(wFrontR);

  // Sàn bê tông công nghiệp phẳng mịn đánh bóng bên trong xưởng
  const factoryFloor = new THREE.Mesh(
    new THREE.BoxGeometry(cfg.width - 0.2, 0.1, cfg.depth - 0.2),
    new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.35, metalness: 0.15 })
  );
  factoryFloor.position.set(0, 0.05, 0);
  factoryFloor.receiveShadow = true;
  group.add(factoryFloor);

  // Vạch kẻ sơn vàng an toàn dẫn lối xe nâng từ trong xưởng thẳng ra Cửa B1
  const laneMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
  const laneL = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 10.0), laneMat);
  laneL.rotation.x = -Math.PI / 2;
  laneL.position.set(-8.8, 0.11, 11.5);
  group.add(laneL);

  const laneR = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 10.0), laneMat);
  laneR.rotation.x = -Math.PI / 2;
  laneR.position.set(-5.2, 0.11, 11.5);
  group.add(laneR);

  // 3. TOÀN BỘ HỆ THỐNG MÁI NGOẠI THẤT (ĐƯỢC GOM VÀO nhaBRoofGroup)

  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(cfg.width + 0.6, 0.6, cfg.depth + 0.6),
    new THREE.MeshStandardMaterial({ color: cfg.roofColor, roughness: 0.5 })
  );
  roof.position.y = cfg.height + 0.3;
  roof.castShadow = true;
  nhaBRoofGroup.add(roof);
  applySnowShader(roof.material, 0.3, 0.95);

  const corniceMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4 });
  const cThick = 0.45;
  const cHeight = 0.35;
  const cY = cfg.height + 0.6 + cHeight / 2;
  const cNorth = new THREE.Mesh(new THREE.BoxGeometry(cfg.width + 0.8, cHeight, cThick), corniceMat);
  cNorth.position.set(0, cY, -(cfg.depth + 0.6) / 2 + cThick / 2);
  cNorth.castShadow = true;
  nhaBRoofGroup.add(cNorth);

  const cSouth = new THREE.Mesh(new THREE.BoxGeometry(cfg.width + 0.8, cHeight, cThick), corniceMat);
  cSouth.position.set(0, cY, (cfg.depth + 0.6) / 2 - cThick / 2);
  cSouth.castShadow = true;
  nhaBRoofGroup.add(cSouth);

  const cEast = new THREE.Mesh(new THREE.BoxGeometry(cThick, cHeight, cfg.depth + 0.6 - cThick * 2), corniceMat);
  cEast.position.set((cfg.width + 0.8) / 2 - cThick / 2, cY, 0);
  cEast.castShadow = true;
  nhaBRoofGroup.add(cEast);

  const cWest = new THREE.Mesh(new THREE.BoxGeometry(cThick, cHeight, cfg.depth + 0.6 - cThick * 2), corniceMat);
  cWest.position.set(-(cfg.width + 0.8) / 2 + cThick / 2, cY, 0);
  cWest.castShadow = true;
  nhaBRoofGroup.add(cWest);

  const monCfg = cfg.monitorRoof;
  const monitor = new THREE.Mesh(
    new THREE.BoxGeometry(monCfg.width, monCfg.height, monCfg.depth),
    new THREE.MeshStandardMaterial({ color: monCfg.color, roughness: 0.5 })
  );
  monitor.position.y = cfg.height + 0.6 + monCfg.height / 2;
  monitor.castShadow = true;
  nhaBRoofGroup.add(monitor);
  applySnowShader(monitor.material, 0.3, 0.95);

  for (let vz = -10; vz <= 10; vz += 5.0) {
    const vent = new THREE.Mesh(
      new THREE.CylinderGeometry(0.55, 0.65, 0.6, 8),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.35, metalness: 0.6 })
    );
    vent.position.set(0, cfg.height + 0.6 + monCfg.height + 0.3, vz);
    nhaBRoofGroup.add(vent);
    roofVentilators.push(vent);
  }

  const skylightMat = new THREE.MeshStandardMaterial({
    color: 0xdbeafe,
    roughness: 0.2,
    transparent: true,
    opacity: 0.72,
  });
  [-4.8, 4.8].forEach((sx) => {
    const skylight = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.12, monCfg.depth - 2), skylightMat);
    skylight.position.set(sx, cfg.height + 0.66, 0);
    nhaBRoofGroup.add(skylight);
  });

  createSolarPanelGrid(nhaBRoofGroup, -7.5, cfg.height + 0.62, 0, 5.5, 24, 0.15);
  createSolarPanelGrid(nhaBRoofGroup, 7.5, cfg.height + 0.62, 0, 5.5, 24, 0.15);

  const chillerMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.4 });
  const chiller = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.2, 1.8), chillerMat);
  chiller.position.set(-6.5, cfg.height + 1.4, -12);
  chiller.castShadow = true;
  nhaBRoofGroup.add(chiller);

  group.add(nhaBRoofGroup);

  // 4. Dãy cửa sổ công nghiệp (vẫn giữ nguyên trên tường biên)
  const windowMat = new THREE.MeshStandardMaterial({ color: 0x93c5fd, roughness: 0.1, metalness: 0.8 });
  windowLights.push(windowMat);

  for (let story = 1; story <= 3; story++) {
    const winHeight = 1.1;
    const winY = 1.6 + (story - 0.5) * 3.8;

    if (story > 1) {
      createWindowStripWithMullions(nhaBRoofGroup, 0, winY, cfg.depth / 2 + 0.05, cfg.width - 4, winHeight, 0, 2.2, windowMat);
    }
    createWindowStripWithMullions(group, cfg.width / 2 + 0.05, winY, 0, cfg.depth - 4, winHeight, Math.PI / 2, 2.4, windowMat);
    createWindowStripWithMullions(group, 0, winY, -cfg.depth / 2 - 0.05, cfg.width - 6, winHeight, Math.PI, 2.2, windowMat);
    createWindowStripWithMullions(group, -cfg.width / 2 - 0.05, winY, 0, cfg.depth - 6, winHeight, -Math.PI / 2, 2.4, windowMat);
  }

  // 5. Cửa cuốn công nghiệp (Door B1, B2)
  createShutterDoor(group, -7.0, 0, cfg.depth / 2 + 0.08, 5.6, 4.2, 'doorB1', 'Cửa cuốn chính Xưởng B');
  createShutterDoor(group, 7.0, 0, cfg.depth / 2 + 0.08, 5.0, 4.2, 'doorB2', 'Cửa xuất nhập hàng Xưởng B');

  // 6. Tiện ích ngoại thất
  createRainwaterDownspouts(group, cfg.width, cfg.height, cfg.depth, 0x64748b);
  createFireEscapeStairs(group, -cfg.width / 2 + 4.5, -cfg.depth / 2 - 1.0, cfg.height, 3, 0x334155);
  createBuildingLogo(group, cfg);

  // ========================================================================
  // 7. KIẾN TẠO TOÀN BỘ NỘI THẤT XƯỞNG B CHUẨN THỰC TẾ & BẢN VẼ PDF LAYOUT
  // Dây chuyền lắp ráp, giá kệ selective, xe thành phẩm, thang tời hàng
  // ========================================================================
  buildNhaBInterior(group, cfg);

  scene.add(group);
  buildingMeshes.push(upperFront);
}

// Hàm khởi tạo toàn bộ nội thất chi tiết Xưởng B: Dài hơn 10m, dây chuyền 30m, KHÔNG CỘT TRỤ RẦM (Không gian mở thông thoáng 100%)
function buildNhaBInterior(group, cfg) {
  const interiorGroup = new THREE.Group();
  interiorGroup.name = 'nhaBInterior';

  // Reset các mảng hoạt cảnh dây chuyền
  insideAssemblyBikes = [];
  insideConveyorSlats = [];
  insideAssemblyWorkers = [];

  const steelMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.45, metalness: 0.6 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 });
  const blueFrameMat = new THREE.MeshStandardMaterial({ color: 0x184995, roughness: 0.35, metalness: 0.25 }); // Xanh DK Bike
  const orangeRackMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.35 }); // Cam selective rack
  const blueRackMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.4 });   // Xanh chân kệ
  const yellowHazardMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.3 }); // Vàng an toàn thang tời
  const crateBlueMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4 });
  const crateRedMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.4 });
  const cartonMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.9 });
  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.1, metalness: 0.85 });

  // ==========================================================================
  // A. KHÔNG GIAN TRẦN & CHIẾU SÁNG CAO CẤP (ĐÃ BỎ HOÀN TOÀN CỘT TRỤ & DẦM NGANG/DỌC CHO ĐỠ VƯỚNG)
  // Không gian thông thủy 100% không vướng cột, nhìn xuyên suốt từ đầu xưởng đến cuối xưởng
  // ==========================================================================

  // Đường ống cứu hỏa PCCC sơn đỏ chạy sát mép trần trên cao
  const pipeMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.35, metalness: 0.3 });
  const firePipe = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, cfg.depth - 2, 8), pipeMat);
  firePipe.rotation.x = Math.PI / 2;
  firePipe.position.set(-cfg.width / 2 + 1.2, cfg.height - 0.4, 0);
  interiorGroup.add(firePipe);

  // Quạt trần công nghiệp HVLS cánh lớn sải rộng treo sát mái (không vướng tầm mắt dưới sàn)
  [-3.5, 3.5].forEach((fx, fIdx) => {
    const fz = fIdx === 0 ? -6.0 : 6.0;
    const fanGroup = new THREE.Group();
    fanGroup.position.set(fx, cfg.height - 1.2, fz);

    const fMotor = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 0.4, 12), darkMat);
    fanGroup.add(fMotor);

    const fRotor = new THREE.Group();
    for (let b = 0; b < 6; b++) {
      const blade = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.035, 0.2), blueFrameMat);
      blade.position.x = 1.4;
      const bWrapper = new THREE.Group();
      bWrapper.rotation.y = (b / 6) * Math.PI * 2;
      bWrapper.add(blade);
      fRotor.add(bWrapper);
    }
    fanGroup.add(fRotor);
    insideHVLSFans.push(fRotor);
    interiorGroup.add(fanGroup);
  });

  // Hệ thống đèn LED High-Bay UFO treo trần bố trí dọc theo xưởng dài 44m
  const lampZs = [-16, -9, -2, 5, 12];
  [-3.2, 3.2].forEach((lx) => {
    lampZs.forEach((lz) => {
      // Dây cáp treo thanh mảnh
      const dropWire = new THREE.Mesh(
        new THREE.CylinderGeometry(0.01, 0.01, 1.2, 6),
        steelMat
      );
      dropWire.position.set(lx, cfg.height - 0.6, lz);
      interiorGroup.add(dropWire);

      const lamp = new THREE.Mesh(
        new THREE.CylinderGeometry(0.28, 0.4, 0.14, 12),
        new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, roughness: 0.2 })
      );
      lamp.position.set(lx, cfg.height - 1.25, lz);
      interiorGroup.add(lamp);

      const bulb = new THREE.Mesh(
        new THREE.CylinderGeometry(0.34, 0.34, 0.03, 12),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
      );
      bulb.position.set(lx, cfg.height - 1.32, lz);
      interiorGroup.add(bulb);

      const pLight = new THREE.PointLight(0xfffbeb, 0.82, 16);
      pLight.position.set(lx, cfg.height - 1.45, lz);
      interiorGroup.add(pLight);
      interiorFactoryLights.push(pLight);
    });
  });

  // ==========================================================================
  // B. THANG TỜI HÀNG CÔNG NGHIỆP 2.5 TẤN (Góc Tây Nam: ô vuông 4555mm)
  // ==========================================================================
  const liftGroup = new THREE.Group();
  liftGroup.position.set(-8.8, 0, cfg.depth / 2 - 2.8);

  const lW = 3.4, lD = 2.8, lH = 8.5;
  [[-lW / 2, -lD / 2], [lW / 2, -lD / 2], [-lW / 2, lD / 2], [lW / 2, lD / 2]].forEach(([px, pz]) => {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.16, lH, 0.16), yellowHazardMat);
    post.position.set(px, lH / 2, pz);
    post.castShadow = true;
    liftGroup.add(post);
  });

  for (let ty = 2.0; ty <= lH; ty += 1.8) {
    const ring = new THREE.Mesh(new THREE.BoxGeometry(lW + 0.08, 0.08, lD + 0.08), darkMat);
    ring.position.y = ty;
    liftGroup.add(ring);
  }

  const meshMat = new THREE.MeshStandardMaterial({ color: 0x64748b, wireframe: true, roughness: 0.5 });
  const backMesh = new THREE.Mesh(new THREE.PlaneGeometry(lW, lH), meshMat);
  backMesh.position.set(0, lH / 2, -lD / 2);
  liftGroup.add(backMesh);

  const leftMesh = new THREE.Mesh(new THREE.PlaneGeometry(lD, lH), meshMat);
  leftMesh.rotation.y = Math.PI / 2;
  leftMesh.position.set(-lW / 2, lH / 2, 0);
  liftGroup.add(leftMesh);

  const gate = new THREE.Mesh(new THREE.BoxGeometry(lW - 0.3, 2.2, 0.06), yellowHazardMat);
  gate.position.set(0, 1.1, lD / 2);
  liftGroup.add(gate);

  for (let hz = 0; hz < 6; hz++) {
    const hStripe = new THREE.Mesh(
      new THREE.PlaneGeometry(0.42, 0.14),
      new THREE.MeshBasicMaterial({ color: hz % 2 === 0 ? 0xfacc15 : 0x0f172a })
    );
    hStripe.rotation.x = -Math.PI / 2;
    hStripe.position.set(-1.05 + hz * 0.42, 0.08, lD / 2 + 0.45);
    liftGroup.add(hStripe);
  }

  const winchMotor = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 1.1, 12), steelMat);
  winchMotor.rotation.z = Math.PI / 2;
  winchMotor.position.set(0, lH + 0.3, 0);
  liftGroup.add(winchMotor);

  const liftPlatform = new THREE.Mesh(new THREE.BoxGeometry(lW - 0.4, 0.15, lD - 0.4), steelMat);
  liftPlatform.position.set(0, 0.55, 0);
  liftGroup.add(liftPlatform);

  const ctrlBox = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.4, 0.1), yellowHazardMat);
  ctrlBox.position.set(lW / 2 + 0.12, 1.35, lD / 2);
  liftGroup.add(ctrlBox);

  const liftData = {
    id: 'insideFreightLift',
    title: 'Thang tời hàng công nghiệp 2.5 Tấn (Vị trí góc Tây Nam Xưởng B)',
    type: 'lift',
    desc: 'Hệ thống thang tời hàng thủy lực/cáp kéo tải trọng 2.500 kg, phục vụ chuyển linh kiện động cơ, ắc quy và khung xe giữa các tầng của Xưởng B.',
    zone: 'DK1',
  };
  liftGroup.userData = liftData;
  gate.userData = liftData;
  interactiveObjects.push(gate);
  interiorGroup.add(liftGroup);

  // ==========================================================================
  // C. DÂY CHUYỀN LẮP RÁP XE MÁY ĐIỆN DK BIKE KÉO DÀI 30 MÉT (Không vướng cột, hoạt cảnh chạy chậm)
  // ==========================================================================
  const lineGroup = new THREE.Group();
  const lineX = -1.2;
  lineGroup.position.set(lineX, 0, 0);

  const lineLen = 27.0; // Băng chuyền chính dài 27 mét
  const lineW = 1.05;
  const lineH = 0.62;

  // Băng chuyền chính sơn xanh DK Bike
  const lineBed = new THREE.Mesh(
    new THREE.BoxGeometry(lineW, lineH, lineLen),
    blueFrameMat
  );
  lineBed.position.set(0, lineH / 2, -2.5);
  lineBed.castShadow = true;
  lineGroup.add(lineBed);

  const slatBelt = new THREE.Mesh(
    new THREE.BoxGeometry(lineW - 0.16, 0.04, lineLen - 0.3),
    steelMat
  );
  slatBelt.position.set(0, lineH + 0.02, -2.5);
  lineGroup.add(slatBelt);

  // 36 Tấm nan kim loại của băng chuyền trượt tịnh tiến liên tục
  for (let sIdx = 0; sIdx < 36; sIdx++) {
    const slatZ = -15.5 + sIdx * 0.72;
    const slat = new THREE.Mesh(
      new THREE.BoxGeometry(lineW - 0.22, 0.015, 0.18),
      new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.3, metalness: 0.7 })
    );
    slat.position.set(0, lineH + 0.045, slatZ);
    lineGroup.add(slat);
    insideConveyorSlats.push(slat);
  }

  // Chân đế chữ U đỡ băng tải
  for (let bz = -15.0; bz <= 9.0; bz += 3.0) {
    const legL = new THREE.Mesh(new THREE.BoxGeometry(0.08, lineH, 0.08), steelMat);
    legL.position.set(-lineW / 2 + 0.05, lineH / 2, bz);
    lineGroup.add(legL);
    const legR = legL.clone();
    legR.position.x = lineW / 2 - 0.05;
    lineGroup.add(legR);
  }

  // CẦU TRƯỢT DỐC XUỐNG XE THÀNH PHẨM (Dài 3.5m)
  const rampLen = 3.5;
  const rampGeo = new THREE.BoxGeometry(lineW + 0.1, 0.06, rampLen);
  const ramp = new THREE.Mesh(rampGeo, blueFrameMat);
  ramp.position.set(0, lineH / 2 + 0.02, 11.5);
  ramp.rotation.x = Math.atan2(lineH, rampLen);
  ramp.castShadow = true;
  lineGroup.add(ramp);

  // Vạch kẻ an toàn quanh chân cầu trượt
  const rampSafetyMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
  const rampLine1 = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 4.2), rampSafetyMat);
  rampLine1.rotation.x = -Math.PI / 2;
  rampLine1.position.set(-lineW / 2 - 0.35, 0.08, 11.8);
  lineGroup.add(rampLine1);

  const rampLine2 = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 4.2), rampSafetyMat);
  rampLine2.rotation.x = -Math.PI / 2;
  rampLine2.position.set(lineW / 2 + 0.35, 0.08, 11.8);
  lineGroup.add(rampLine2);

  // TỦ ĐIỆN ĐIỀU KHIỂN HMI & ĐÈN BÁO
  const ctrlCabinet = new THREE.Group();
  ctrlCabinet.position.set(-lineW / 2 - 0.75, 0, 9.5);

  const cabBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.65, 1.45, 0.48),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.35 })
  );
  cabBody.position.y = 1.45 / 2;
  cabBody.castShadow = true;
  ctrlCabinet.add(cabBody);

  const screenHMI = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.22), new THREE.MeshBasicMaterial({ color: 0x0284c7 }));
  screenHMI.position.set(0, 1.05, 0.25);
  ctrlCabinet.add(screenHMI);

  const stackPole = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.35, 8), steelMat);
  stackPole.position.set(0.2, 1.45 + 0.17, 0);
  ctrlCabinet.add(stackPole);

  const greenBeacon = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.08, 8), new THREE.MeshBasicMaterial({ color: 0x22c55e }));
  greenBeacon.position.set(0.2, 1.45 + 0.38, 0);
  ctrlCabinet.add(greenBeacon);

  lineGroup.add(ctrlCabinet);

  // KHUNG GIÀN TREO DÂY CHUYỀN SPAN 30 MÉT & ĐÈN SOI
  const gantryMat = new THREE.MeshStandardMaterial({ color: 0x184995, roughness: 0.4 });
  const gantryZs = [-15.0, -9.0, -3.0, 3.0, 9.0];

  gantryZs.forEach((gz) => {
    const gPostL = new THREE.Mesh(new THREE.BoxGeometry(0.07, 2.4, 0.07), gantryMat);
    gPostL.position.set(-lineW / 2 - 0.08, 1.2, gz);
    lineGroup.add(gPostL);

    const gPostR = new THREE.Mesh(new THREE.BoxGeometry(0.07, 2.4, 0.07), gantryMat);
    gPostR.position.set(lineW / 2 + 0.08, 1.2, gz);
    lineGroup.add(gPostR);

    const gBeam = new THREE.Mesh(new THREE.BoxGeometry(lineW + 0.25, 0.07, 0.07), gantryMat);
    gBeam.position.set(0, 2.38, gz);
    lineGroup.add(gBeam);
  });

  const signBanner = new THREE.Mesh(new THREE.BoxGeometry(lineW + 0.35, 0.32, 0.05), blueFrameMat);
  signBanner.position.set(0, 2.48, 9.0);
  lineGroup.add(signBanner);

  const taskLight = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 0.04, lineLen - 1),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  taskLight.position.set(0, 2.32, -2.5);
  lineGroup.add(taskLight);

  // 8 CÔNG ĐOẠN XE TRÊN DÂY CHUYỀN (Xe hướng thẳng theo chiều chuyền: rotation.y = -Math.PI / 2)
  const bikeScale = 0.78;

  // Stage 0: Khung sườn kim loại trần trên đồ gá jig
  const stage0 = new THREE.Group();
  const jig0 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.12, 0.5), steelMat);
  jig0.position.y = 0.06;
  stage0.add(jig0);
  const rawFrameMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.28, 0.65, 1.2),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5, metalness: 0.6 })
  );
  rawFrameMesh.position.y = 0.45;
  stage0.add(rawFrameMesh);
  stage0.position.set(0, lineH + 0.02, -15.0);
  lineGroup.add(stage0);
  insideAssemblyBikes.push({ mesh: stage0, startZ: -15.0, baseY: lineH + 0.02 });

  // Stage 1: Lắp càng sau & giảm xóc đôi
  const stage1 = createDetailedDKBike(0x0284c7, 'Xe lắp càng & giảm xóc');
  stage1.scale.set(bikeScale, bikeScale, bikeScale);
  stage1.rotation.y = -Math.PI / 2;
  stage1.position.set(0, lineH + 0.05, -11.5);
  lineGroup.add(stage1);
  insideAssemblyBikes.push({ mesh: stage1, startZ: -11.5, baseY: lineH + 0.05 });

  // Stage 2: Lắp động cơ điện BLDC & vành đúc
  const stage2 = createDetailedDKBike(0x0284c7, 'Xe lắp động cơ BLDC');
  stage2.scale.set(bikeScale, bikeScale, bikeScale);
  stage2.rotation.y = -Math.PI / 2;
  stage2.position.set(0, lineH + 0.05, -8.0);
  lineGroup.add(stage2);
  insideAssemblyBikes.push({ mesh: stage2, startZ: -8.0, baseY: lineH + 0.05 });

  // Stage 3: Lắp hộc ắc quy & bó dây điện sườn
  const stage3 = createDetailedDKBike(0xdc2626, 'Xe lắp ắc quy & hệ điện');
  stage3.scale.set(bikeScale, bikeScale, bikeScale);
  stage3.rotation.y = -Math.PI / 2;
  stage3.position.set(0, lineH + 0.05, -4.5);
  lineGroup.add(stage3);
  insideAssemblyBikes.push({ mesh: stage3, startZ: -4.5, baseY: lineH + 0.05 });

  // Stage 4: Lắp giảm xóc trước telescopic & ghi đông phanh đĩa
  const stage4 = createDetailedDKBike(0xdc2626, 'Xe lắp ghi đông & phanh ABS');
  stage4.scale.set(bikeScale, bikeScale, bikeScale);
  stage4.rotation.y = -Math.PI / 2;
  stage4.position.set(0, lineH + 0.05, -1.0);
  lineGroup.add(stage4);
  insideAssemblyBikes.push({ mesh: stage4, startZ: -1.0, baseY: lineH + 0.05 });

  // Stage 5: Lắp đồng hồ LED kỹ thuật số & tay ga
  const stage5 = createDetailedDKBike(0x64748b, 'Xe kết nối đồng hồ LED');
  stage5.scale.set(bikeScale, bikeScale, bikeScale);
  stage5.rotation.y = -Math.PI / 2;
  stage5.position.set(0, lineH + 0.05, 2.5);
  lineGroup.add(stage5);
  insideAssemblyBikes.push({ mesh: stage5, startZ: 2.5, baseY: lineH + 0.05 });

  // Stage 6: Lắp dàn áo yếm nhựa & yên da caramel
  const stage6 = createDetailedDKBike(0x64748b, 'DK Roma SX Gần Hoàn Thiện');
  stage6.scale.set(bikeScale, bikeScale, bikeScale);
  stage6.rotation.y = -Math.PI / 2;
  stage6.position.set(0, lineH + 0.05, 6.0);
  lineGroup.add(stage6);
  insideAssemblyBikes.push({ mesh: stage6, startZ: 6.0, baseY: lineH + 0.05 });

  // Stage 7: Xe hoàn chỉnh lăn bánh xuống dốc
  const stage7 = createDetailedDKBike(0xf8fafc, 'DK Roma SX Trắng Ngọc Trai');
  stage7.scale.set(bikeScale, bikeScale, bikeScale);
  stage7.rotation.y = -Math.PI / 2;
  stage7.position.set(0, lineH + 0.05, 9.5);
  lineGroup.add(stage7);
  insideAssemblyBikes.push({ mesh: stage7, startZ: 9.5, baseY: lineH + 0.05 });

  // Công nhân thao tác dọc dây chuyền
  const workerConfigs = [
    { z: -13.0, side: -1, phase: 0 },
    { z: -9.5,  side: 1,  phase: 1.2 },
    { z: -6.0,  side: -1, phase: 2.4 },
    { z: -2.5,  side: 1,  phase: 3.6 },
    { z: 1.0,   side: -1, phase: 4.8 },
    { z: 4.5,   side: 1,  phase: 6.0 },
  ];

  workerConfigs.forEach((wc) => {
    const w = createCharacter({ shirtColor: 0x0284c7, pantsColor: 0x1e293b, hatColor: 0x0284c7, role: 'worker', heightScale: 0.95 });
    w.scale.set(0.95, 0.95, 0.95);
    w.position.set(wc.side * (lineW / 2 + 0.42), 0, wc.z);
    w.rotation.y = wc.side < 0 ? Math.PI / 2 : -Math.PI / 2;
    lineGroup.add(w);
    insideAssemblyWorkers.push({ mesh: w, phase: wc.phase });
  });

  const lineData = {
    id: 'insideAssemblyLine',
    title: 'Dây chuyền lắp ráp xe máy điện tự động DK Bike (Dài 30m)',
    type: 'assemblyLine',
    desc: 'Dây chuyền lắp ráp kéo dài 30 mét với 8 trạm công đoạn đồng bộ, vận hành êm đềm liên tục, xuất xe thành phẩm qua cầu dốc xanh.',
    zone: 'DK1',
  };
  lineGroup.userData = lineData;
  lineBed.userData = lineData;
  ramp.userData = lineData;
  interactiveObjects.push(lineBed);
  interactiveObjects.push(ramp);
  interiorGroup.add(lineGroup);

  // ==========================================================================
  // D. KHU TẬP KẾT XE THÀNH PHẨM (Mở rộng theo chiều dài xưởng: 33 xe thành phẩm, 3 hàng thẳng tắp)
  // ==========================================================================
  const stagingGroup = new THREE.Group();
  stagingGroup.position.set(-6.8, 0, -3.5);

  const lotW = 4.2, lotD = 23.5;
  const lotMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
  const lotBorder = new THREE.Mesh(new THREE.PlaneGeometry(lotW, lotD), lotMat);
  lotBorder.rotation.x = -Math.PI / 2;
  lotBorder.position.set(0, 0.07, 0);
  stagingGroup.add(lotBorder);

  const lotInner = new THREE.Mesh(
    new THREE.PlaneGeometry(lotW - 0.15, lotD - 0.15),
    new THREE.MeshStandardMaterial({ color: 0x3b4a5d, roughness: 0.35, metalness: 0.15 })
  );
  lotInner.rotation.x = -Math.PI / 2;
  lotInner.position.set(0, 0.075, 0);
  stagingGroup.add(lotInner);

  // Vạch kẻ chia từng ô đỗ xe ngay ngắn
  const stallLineMat = new THREE.MeshBasicMaterial({ color: 0xfde047 });
  for (let sz = -10.5; sz <= 10.5; sz += 2.0) {
    const sLine = new THREE.Mesh(new THREE.PlaneGeometry(lotW - 0.25, 0.05), stallLineMat);
    sLine.rotation.x = -Math.PI / 2;
    sLine.position.set(0, 0.08, sz);
    stagingGroup.add(sLine);
  }

  // 33 Xe máy điện DK Roma SX xếp thành 3 hàng x 11 xe thẳng tắp, tất cả quay mũi ra cửa Nam
  const bikeColors = [
    0x64748b, // Xám xi măng đặc trưng
    0x64748b,
    0xf8fafc, // Trắng ngọc trai
    0x64748b,
    0xdc2626, // Đỏ đô
    0x0f172a, // Đen bóng
    0x0284c7, // Xanh cyan
    0x64748b,
  ];

  const colOffsets = [-1.3, 0.0, 1.3];
  colOffsets.forEach((colX, cIdx) => {
    for (let row = 0; row < 11; row++) {
      const rowZ = -10.0 + row * 2.0;
      const colHex = bikeColors[(cIdx * 11 + row) % bikeColors.length];
      const bike = createDetailedDKBike(colHex, `DK Roma SX Lô #${cIdx + 1}-${row + 1}`);
      bike.scale.set(bikeScale, bikeScale, bikeScale);
      bike.rotation.y = -Math.PI / 2; // Hướng thẳng ra cửa xuất hàng Nam!
      bike.position.set(colX, 0, rowZ);
      stagingGroup.add(bike);
    }
  });

  const stagingData = {
    id: 'insideStagingArea',
    title: 'Khu tập kết 33 xe máy điện thành phẩm sau kiểm định KCS (Xưởng B)',
    type: 'staging',
    desc: 'Khu vực tập kết 33 xe máy điện DK Roma SX hoàn thiện (xám xi măng, trắng ngọc trai, đỏ đô, đen bóng) xếp hàng ngay ngắn trên sàn bê tông phẳng mịn.',
    zone: 'DK1',
  };
  stagingGroup.userData = stagingData;
  lotInner.userData = stagingData;
  interactiveObjects.push(lotInner);
  interiorGroup.add(stagingGroup);

  // ==========================================================================
  // E. HỆ THỐNG GIÁ KỆ KHO LINH KIỆN & PALLET ĐỘNG CƠ (6 Dãy Selective Racking 4 tầng phía Đông)
  // ==========================================================================
  const rackBlocks = [
    { z: -15.5, name: 'Kệ selective K01: Pallet động cơ điện BLDC & IC điều tốc' },
    { z: -10.0, name: 'Kệ selective K02: Thùng phụ tùng nhựa dàn áo & yếm xe' },
    { z: -4.5,  name: 'Kệ selective K03: Cụm giảm xóc thủy lực, vành đúc & lốp không săm' },
    { z: 1.0,   name: 'Kệ selective K04: Phụ kiện ốc vít, chốt định vị & bó dây điện' },
    { z: 6.5,   name: 'Kệ selective K05: Khay linh kiện lắp ráp nhanh & phụ kiện đèn còi' },
    { z: 12.0,  name: 'Kệ selective K06: Bộ sạc thông minh & bình ắc quy dự trữ' },
  ];

  rackBlocks.forEach((rb, rbIdx) => {
    const rackGroup = new THREE.Group();
    rackGroup.position.set(6.4, 0, rb.z);

    const rW = 4.2;
    const rD = 1.1;
    const rH = 4.4;

    [[-rW / 2, -rD / 2], [rW / 2, -rD / 2], [-rW / 2, rD / 2], [rW / 2, rD / 2], [0, -rD / 2], [0, rD / 2]].forEach(([px, pz]) => {
      const col = new THREE.Mesh(new THREE.BoxGeometry(0.09, rH, 0.09), blueRackMat);
      col.position.set(px, rH / 2, pz);
      col.castShadow = true;
      rackGroup.add(col);
    });

    for (let tier = 1; tier <= 4; tier++) {
      const beamY = tier * 1.0;

      [-rD / 2, rD / 2].forEach((bz) => {
        const beam = new THREE.Mesh(new THREE.BoxGeometry(rW, 0.07, 0.05), orangeRackMat);
        beam.position.set(0, beamY, bz);
        rackGroup.add(beam);
      });

      const shelfDeck = new THREE.Mesh(new THREE.BoxGeometry(rW - 0.1, 0.025, rD - 0.1), steelMat);
      shelfDeck.position.set(0, beamY + 0.02, 0);
      rackGroup.add(shelfDeck);

      [-rW / 4, rW / 4].forEach((px, pIdx) => {
        if ((tier + rbIdx + pIdx) % 2 === 0) {
          const pallet = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.09, 0.9), cartonMat);
          pallet.position.set(px, beamY + 0.07, 0);
          rackGroup.add(pallet);

          const cBox = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.52, 0.82), cartonMat);
          cBox.position.set(px, beamY + 0.38, 0);
          cBox.castShadow = true;
          rackGroup.add(cBox);
        } else {
          for (let kx = -0.32; kx <= 0.32; kx += 0.42) {
            const cMat = (kx > 0) ? crateRedMat : crateBlueMat;
            const crate = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.25, 0.6), cMat);
            crate.position.set(px + kx, beamY + 0.15, 0);
            rackGroup.add(crate);
          }
        }
      });
    }

    const rackData = {
      id: 'insidePartsRacks',
      title: rb.name,
      type: 'rack',
      desc: 'Hệ thống giá kệ Selective Racking chịu tải 1.000 kg/tầng, lưu trữ linh kiện động cơ điện BLDC, ắc quy khô, bộ điều khiển IC và phụ tùng cơ khí chính hãng DK Bike.',
      zone: 'DK1',
    };
    rackGroup.userData = rackData;
    interiorGroup.add(rackGroup);
  });

  // Xe đẩy khay nhựa cơ động
  [-4.0, 3.5].forEach((tz) => {
    const cartGroup = new THREE.Group();
    cartGroup.position.set(2.4, 0, tz);

    const cartFrame = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.3, 1.0), blueRackMat);
    cartFrame.position.y = 0.68;
    cartGroup.add(cartFrame);

    for (let cy = 0.28; cy <= 1.1; cy += 0.32) {
      const bCrate = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.18, 0.92), crateBlueMat);
      bCrate.position.y = cy;
      cartGroup.add(bCrate);
    }
    interiorGroup.add(cartGroup);
  });

  // Xe nâng tay màu vàng (Manual Pallet Jack theo ghi chú trên bản vẽ PDF: "Dùng xe nâng tay")
  const palletJack = new THREE.Group();
  palletJack.position.set(2.4, 0, 8.5);

  const forkL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, 1.1), yellowHazardMat);
  forkL.position.set(-0.2, 0.05, 0);
  palletJack.add(forkL);
  const forkR = forkL.clone();
  forkR.position.x = 0.2;
  palletJack.add(forkR);

  const jackHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.85, 8), darkMat);
  jackHandle.rotation.x = -0.3;
  jackHandle.position.set(0, 0.45, 0.65);
  palletJack.add(jackHandle);

  const jackPallet = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.08, 0.8), cartonMat);
  jackPallet.position.set(0, 0.12, 0);
  palletJack.add(jackPallet);

  const jackBox = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.45, 0.7), cartonMat);
  jackBox.position.set(0, 0.38, 0);
  palletJack.add(jackBox);

  interiorGroup.add(palletJack);

  // Pallet động cơ dự phòng sát vách Bắc (45 pallet theo PDF layout)
  for (let mx = -4.5; mx <= 4.5; mx += 1.8) {
    const mPallet = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.09, 0.95), cartonMat);
    mPallet.position.set(mx, 0.05, -cfg.depth / 2 + 1.2);
    interiorGroup.add(mPallet);

    const mStack = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.58, 0.85), cartonMat);
    mStack.position.set(mx, 0.38, -cfg.depth / 2 + 1.2);
    interiorGroup.add(mStack);
  }

  // ==========================================================================
  // F. SÀN BÊ TÔNG ĐÁNH BÓNG & HÀNH LANG RỘNG MÊNH MÔNG (3.5M - 6.0M THÔNG THOÁNG)
  // ==========================================================================
  const safetyLineMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
  const cLineL = new THREE.Mesh(new THREE.PlaneGeometry(0.08, cfg.depth - 4), safetyLineMat);
  cLineL.rotation.x = -Math.PI / 2;
  cLineL.position.set(-2.2, 0.065, 0);
  interiorGroup.add(cLineL);

  const cLineR = new THREE.Mesh(new THREE.PlaneGeometry(0.08, cfg.depth - 4), safetyLineMat);
  cLineR.rotation.x = -Math.PI / 2;
  cLineR.position.set(3.8, 0.065, 0);
  interiorGroup.add(cLineR);

  group.add(interiorGroup);
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

  // Tấm nan cửa cuốn (Curtain slats) - Auto mở sẵn co rút lên nóc cửa
  const curtainMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    roughness: 0.35,
    metalness: 0.7,
  });
  const curtain = new THREE.Mesh(
    new THREE.BoxGeometry(width - 0.05, height, 0.08),
    curtainMat
  );
  curtain.scale.y = 0.12;
  curtain.position.set(0, (height / 2) + ((height / 2) * 0.88), 0);
  doorGroup.add(curtain);

  // Đèn bên trong xưởng (sáng ra ngoài khi mở cửa)
  const interiorLight = new THREE.PointLight(0xfef08a, 0.8, 16);
  interiorLight.position.set(0, height - 0.5, -2.5);
  doorGroup.add(interiorLight);
  interiorFactoryLights.push(interiorLight);

  // Băng chuyền và khung xe máy điện bên trong xưởng (Chỉ đặt ở cửa phụ, không đặt ở Cửa B1 để xe nâng di chuyển tự do)
  if (id !== 'doorB1') {
    const conveyor = new THREE.Mesh(
      new THREE.BoxGeometry(width * 0.8, 0.6, 3.8),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 })
    );
    conveyor.position.set(0, 0.3, -2.5);
    doorGroup.add(conveyor);

    const chassis = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 0.7, 0.5),
      new THREE.MeshStandardMaterial({ color: 0x184995, roughness: 0.3 })
    );
    chassis.position.set(0, 0.95, -2.5);
    doorGroup.add(chassis);
  } else {
    // Giá kệ phụ tùng đặt sát 2 bên mép cửa xưởng B, giữ thông thoáng 100% làn đường xe nâng
    const rackMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.5 });
    [-width / 2 + 0.3, width / 2 - 0.3].forEach((rx) => {
      const rack = new THREE.Mesh(new THREE.BoxGeometry(0.5, 2.4, 2.5), rackMat);
      rack.position.set(rx, 1.2, -2.2);
      doorGroup.add(rack);
    });
  }

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
    isOpen: true,
    currentProgress: 1.0,
    targetProgress: 1.0,
    interiorLight,
    id,
  });
  interactiveObjects.push(curtain);

  return doorGroup;
}


function createBuildingLogo(group, cfg) {
  const texLoader = new THREE.TextureLoader();
  const logoTexture = texLoader.load(getAssetUrl('LogoDKBike.png'));
  logoTexture.colorSpace = THREE.SRGBColorSpace;
  const logoWhiteTex = texLoader.load(getAssetUrl('LogoDKBike_white.png'));
  logoWhiteTex.colorSpace = THREE.SRGBColorSpace;

  const signW = 6.4;
  const signH = 2.4;
  const plateDepth = 0.08;

  // Đế biển hiệu kiến trúc màu xám đen sang trọng giống Nhà A DK1
  const signBackMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.35,
    metalness: 0.5,
  });
  const bezelMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.2, metalness: 0.85 });

  // 1. Mặt Nam (Quay ra sân chính & bốc dỡ)
  const signSouth = new THREE.Group();
  signSouth.position.set(0, cfg.height - 1.6, cfg.depth / 2 + 0.08);

  const backSouth = new THREE.Mesh(new THREE.BoxGeometry(signW, signH, plateDepth), signBackMat);
  backSouth.castShadow = true;
  signSouth.add(backSouth);

  const bezelTopS = new THREE.Mesh(new THREE.BoxGeometry(signW + 0.1, 0.06, plateDepth + 0.02), bezelMat);
  bezelTopS.position.set(0, signH / 2, plateDepth / 2);
  signSouth.add(bezelTopS);

  const bezelBotS = new THREE.Mesh(new THREE.BoxGeometry(signW + 0.1, 0.06, plateDepth + 0.02), bezelMat);
  bezelBotS.position.set(0, -signH / 2, plateDepth / 2);
  signSouth.add(bezelBotS);

  const logoMatSouth = new THREE.MeshStandardMaterial({
    map: logoTexture,
    emissiveMap: logoWhiteTex,
    emissive: new THREE.Color(0x67e8f9),
    emissiveIntensity: 0.0,
    transparent: true,
    roughness: 0.2,
    metalness: 0.1,
    polygonOffset: true,
    polygonOffsetFactor: -1.0,
    polygonOffsetUnits: -1.0,
  });
  logoMatSouth.userData = { nightColor: 0x67e8f9, sunsetColor: 0x0284c7 };
  illuminatedLogoMats.push(logoMatSouth);

  const faceSouthW = 5.2;
  const faceSouth = new THREE.Mesh(new THREE.PlaneGeometry(faceSouthW, faceSouthW / 2.44), logoMatSouth);
  faceSouth.position.z = plateDepth + 0.02;
  signSouth.add(faceSouth);

  if (nhaBRoofGroupGlobal) {
    nhaBRoofGroupGlobal.add(signSouth);
  } else {
    group.add(signSouth);
  }

  // 2. Mặt Đông (Quay ra đường chạy thử & đường sắt)
  const signEast = new THREE.Group();
  signEast.position.set(cfg.width / 2 + 0.08, cfg.height - 1.6, 5.0);
  signEast.rotation.y = Math.PI / 2;

  const backEast = new THREE.Mesh(new THREE.BoxGeometry(signW, signH, plateDepth), signBackMat);
  backEast.castShadow = true;
  signEast.add(backEast);

  const bezelTopE = new THREE.Mesh(new THREE.BoxGeometry(signW + 0.1, 0.06, plateDepth + 0.02), bezelMat);
  bezelTopE.position.set(0, signH / 2, plateDepth / 2);
  signEast.add(bezelTopE);

  const bezelBotE = new THREE.Mesh(new THREE.BoxGeometry(signW + 0.1, 0.06, plateDepth + 0.02), bezelMat);
  bezelBotE.position.set(0, -signH / 2, plateDepth / 2);
  signEast.add(bezelBotE);

  const logoMatEast = new THREE.MeshStandardMaterial({
    map: logoTexture,
    emissiveMap: logoWhiteTex,
    emissive: new THREE.Color(0x67e8f9),
    emissiveIntensity: 0.0,
    transparent: true,
    roughness: 0.2,
    metalness: 0.1,
    polygonOffset: true,
    polygonOffsetFactor: -1.0,
    polygonOffsetUnits: -1.0,
  });
  logoMatEast.userData = { nightColor: 0x67e8f9, sunsetColor: 0x0284c7 };
  illuminatedLogoMats.push(logoMatEast);

  const faceEast = new THREE.Mesh(new THREE.PlaneGeometry(faceSouthW, faceSouthW / 2.44), logoMatEast);
  faceEast.position.z = plateDepth + 0.02;
  signEast.add(faceEast);

  group.add(signEast);
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

  // 3. Mái bằng phẳng (Roof Deck)
  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(cfg.width + 0.4, 0.5, cfg.depth + 0.4),
    new THREE.MeshStandardMaterial({ color: cfg.roofColor, roughness: 0.4 })
  );
  roof.position.y = cfg.height + 0.25; // Mặt trên sàn mái tại cfg.height + 0.5
  roof.castShadow = true;
  group.add(roof);
  applySnowShader(roof.material, 0.3, 0.95);

  // Gờ tường chắn nước quanh 4 mép mái (Parapet Rim - 4 thanh bao quanh, không phủ mặt sàn)
  const parapetMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.3 });
  const pThick = 0.35;
  const pHeight = 0.35;
  const pY = cfg.height + 0.5 + pHeight / 2;
  const pNorth = new THREE.Mesh(new THREE.BoxGeometry(cfg.width + 0.4, pHeight, pThick), parapetMat);
  pNorth.position.set(0, pY, -(cfg.depth + 0.4) / 2 + pThick / 2);
  group.add(pNorth);
  const pSouth = new THREE.Mesh(new THREE.BoxGeometry(cfg.width + 0.4, pHeight, pThick), parapetMat);
  pSouth.position.set(0, pY, (cfg.depth + 0.4) / 2 - pThick / 2);
  group.add(pSouth);
  const pEast = new THREE.Mesh(new THREE.BoxGeometry(pThick, pHeight, cfg.depth + 0.4 - pThick * 2), parapetMat);
  pEast.position.set((cfg.width + 0.4) / 2 - pThick / 2, pY, 0);
  group.add(pEast);
  const pWest = new THREE.Mesh(new THREE.BoxGeometry(pThick, pHeight, cfg.depth + 0.4 - pThick * 2), parapetMat);
  pWest.position.set(-(cfg.width + 0.4) / 2 + pThick / 2, pY, 0);
  group.add(pWest);

  // 4. Pin mặt trời trên mái Nhà A (Photovoltaic Solar Arrays) - đặt ngay ngắn trên mặt sàn mái
  createSolarPanelGrid(group, 0, cfg.height + 0.52, 0, cfg.width - 6, cfg.depth - 4, 0.15);

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

  // 10. Biển hiệu Logo DKBike phát sáng trên mặt tiền Nhà điều hành DK1 (Không đè lên cửa kính)
  createNhaADKBikeLogo(group, cfg);

  scene.add(group);
  buildingMeshes.push(body);
}

function createNhaADKBikeLogo(group, cfg) {
  const texLoader = new THREE.TextureLoader();
  const logoTex = texLoader.load(getAssetUrl('LogoDKBike.png'));
  logoTex.colorSpace = THREE.SRGBColorSpace;
  const logoWhiteTex = texLoader.load(getAssetUrl('LogoDKBike_white.png'));
  logoWhiteTex.colorSpace = THREE.SRGBColorSpace;

  const logoGroup = new THREE.Group();
  // Vị trí: Mặt Nam (Mặt sảnh chính quay ra cổng & sân DK1)
  // Cao độ: y = 10.55m (dải tường phẳng tầng 3 trên cùng, đỉnh cửa sổ kính tầng 3 là y = 9.49m)
  const logoY = 10.55;
  const logoZ = cfg.depth / 2 + 0.08;
  logoGroup.position.set(0, logoY, logoZ);

  // 1. Đế bảng hiệu kiến trúc hiện đại (Architectural Backing Plate)
  const plateW = 4.8;
  const plateH = 1.62;
  const plateDepth = 0.08;
  const plateMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.35,
    metalness: 0.5,
  });
  const backPlate = new THREE.Mesh(new THREE.BoxGeometry(plateW, plateH, plateDepth), plateMat);
  backPlate.position.set(0, 0, plateDepth / 2);
  backPlate.castShadow = true;
  logoGroup.add(backPlate);

  // Viền nẹp hợp kim bạc cao cấp bao quanh biển hiệu
  const bezelMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.2, metalness: 0.85 });
  const bezelTop = new THREE.Mesh(new THREE.BoxGeometry(plateW + 0.1, 0.05, plateDepth + 0.02), bezelMat);
  bezelTop.position.set(0, plateH / 2, plateDepth / 2);
  logoGroup.add(bezelTop);

  const bezelBottom = new THREE.Mesh(new THREE.BoxGeometry(plateW + 0.1, 0.05, plateDepth + 0.02), bezelMat);
  bezelBottom.position.set(0, -plateH / 2, plateDepth / 2);
  logoGroup.add(bezelBottom);

  // 2. Mặt chữ & biểu tượng Logo DKBike phát sáng (Illuminated Logo Face)
  // Tỷ lệ ảnh 2.44 : 1 -> chiều rộng 3.6m, chiều cao 1.475m (nằm trọn trên tường, mép dưới logo cách đỉnh kính tầng 3 hơn 32cm, hoàn toàn không đè lên kính)
  const faceW = 3.6;
  const faceH = faceW / 2.44;
  const logoMat = new THREE.MeshStandardMaterial({
    map: logoTex,
    emissiveMap: logoWhiteTex,
    emissive: new THREE.Color(0x67e8f9),
    emissiveIntensity: 0.0,
    transparent: true,
    roughness: 0.2,
    metalness: 0.1,
    polygonOffset: true,
    polygonOffsetFactor: -1.0,
    polygonOffsetUnits: -1.0,
  });
  logoMat.userData = {
    nightColor: 0x67e8f9,
    sunsetColor: 0x0284c7,
  };
  illuminatedLogoMats.push(logoMat);

  const faceMesh = new THREE.Mesh(new THREE.PlaneGeometry(faceW, faceH), logoMat);
  faceMesh.position.set(0, 0, plateDepth + 0.02);
  logoGroup.add(faceMesh);

  group.add(logoGroup);
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
  applySnowShader(roof.material, 0.3, 0.95);

  // Gờ nóc mái tôn (Roof Ridge Cap)
  const ridge = new THREE.Mesh(
    new THREE.BoxGeometry(cfg.width + 0.9, 0.24, 0.4),
    new THREE.MeshStandardMaterial({ color: 0x0369a1, roughness: 0.4 })
  );
  ridge.position.y = cfg.height + 0.72;
  group.add(ridge);

  // 3. Tấm tôn lấy sáng trắng ngà trên mái (Skylight Strip)
  const skylight = new THREE.Mesh(
    new THREE.BoxGeometry(cfg.width - 2.0, 0.1, 1.8),
    new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.2, transparent: true, opacity: 0.75 })
  );
  skylight.position.set(0, cfg.height + 0.66, 2.0);
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
  applySnowShader(roof.material, 0.2, 0.95);

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
  applySnowShader(porchRoof.material, 0.25, 0.95);

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
  applySnowShader(roof.material, 0.3, 0.95);

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
  applySnowShader(canopyMat, 0.3, 0.85);

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
  buildDKCoffeeBar();
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
  solarGroup.position.set(0, cfg.height + 0.65, 0);
  const panelMat = new THREE.MeshStandardMaterial({
    color: 0x0b1329,
    roughness: 0.1,
    metalness: 0.9,
    polygonOffset: true,
    polygonOffsetFactor: -1.0,
    polygonOffsetUnits: -1.0,
  });
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

  // 4. Biển hiệu Logo DKBike phát sáng trên Nhà điều hành DK2 (Mặt Nam & Mặt Đông) giống Nhà A DK1
  createNhaDieuHanhDK2Logo(group, cfg);

  // Mái phủ tuyết khi tuyết rơi
  applySnowShader(roof.material, 0.3, 0.95);

  // Hồ cá Koi phong cách Nhật Bản bên cạnh Nhà điều hành DK2 (Gần đường ĐT234)
  buildDK2HeadquartersKoiPond(group, cfg);

  scene.add(group);
  buildingMeshes.push(body);
}

function createNhaDieuHanhDK2Logo(group, cfg) {
  const texLoader = new THREE.TextureLoader();
  const logoTexture = texLoader.load(getAssetUrl('LogoDKBike.png'));
  logoTexture.colorSpace = THREE.SRGBColorSpace;
  const logoWhiteTex = texLoader.load(getAssetUrl('LogoDKBike_white.png'));
  logoWhiteTex.colorSpace = THREE.SRGBColorSpace;

  const plateW = 4.8;
  const plateH = 1.45;
  const plateDepth = 0.08;

  const signBackMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.35,
    metalness: 0.5,
  });
  const bezelMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.2, metalness: 0.85 });

  // 1. Mặt Nam (Mặt đón tiếp khách quay ra sân nội bộ & DK Coffee)
  // Cao độ: y = 10.8m (trên dải tường tầng 3, đỉnh cửa sổ là y = 10.05m -> hoàn toàn không đè lên kính)
  const signSouth = new THREE.Group();
  signSouth.position.set(0, 10.8, cfg.depth / 2 + 0.08);

  const backSouth = new THREE.Mesh(new THREE.BoxGeometry(plateW, plateH, plateDepth), signBackMat);
  backSouth.castShadow = true;
  signSouth.add(backSouth);

  const bezelTopS = new THREE.Mesh(new THREE.BoxGeometry(plateW + 0.1, 0.05, plateDepth + 0.02), bezelMat);
  bezelTopS.position.set(0, plateH / 2, plateDepth / 2);
  signSouth.add(bezelTopS);

  const bezelBotS = new THREE.Mesh(new THREE.BoxGeometry(plateW + 0.1, 0.05, plateDepth + 0.02), bezelMat);
  bezelBotS.position.set(0, -plateH / 2, plateDepth / 2);
  signSouth.add(bezelBotS);

  const logoMatSouth = new THREE.MeshStandardMaterial({
    map: logoTexture,
    emissiveMap: logoWhiteTex,
    emissive: new THREE.Color(0x67e8f9),
    emissiveIntensity: 0.0,
    transparent: true,
    roughness: 0.2,
    metalness: 0.1,
    polygonOffset: true,
    polygonOffsetFactor: -1.0,
    polygonOffsetUnits: -1.0,
  });
  logoMatSouth.userData = { nightColor: 0x67e8f9, sunsetColor: 0x0284c7 };
  illuminatedLogoMats.push(logoMatSouth);

  const faceW = 3.4;
  const faceSouth = new THREE.Mesh(new THREE.PlaneGeometry(faceW, faceW / 2.44), logoMatSouth);
  faceSouth.position.z = plateDepth + 0.02;
  signSouth.add(faceSouth);

  group.add(signSouth);

  // 2. Mặt Đông (Quay ra đường ĐT234 & Cổng DK2)
  const signEast = new THREE.Group();
  signEast.position.set(cfg.width / 2 + 0.08, 10.8, 0);
  signEast.rotation.y = Math.PI / 2;

  const backEast = new THREE.Mesh(new THREE.BoxGeometry(plateW, plateH, plateDepth), signBackMat);
  backEast.castShadow = true;
  signEast.add(backEast);

  const bezelTopE = new THREE.Mesh(new THREE.BoxGeometry(plateW + 0.1, 0.05, plateDepth + 0.02), bezelMat);
  bezelTopE.position.set(0, plateH / 2, plateDepth / 2);
  signEast.add(bezelTopE);

  const bezelBotE = new THREE.Mesh(new THREE.BoxGeometry(plateW + 0.1, 0.05, plateDepth + 0.02), bezelMat);
  bezelBotE.position.set(0, -plateH / 2, plateDepth / 2);
  signEast.add(bezelBotE);

  const logoMatEast = new THREE.MeshStandardMaterial({
    map: logoTexture,
    emissiveMap: logoWhiteTex,
    emissive: new THREE.Color(0x67e8f9),
    emissiveIntensity: 0.0,
    transparent: true,
    roughness: 0.2,
    metalness: 0.1,
    polygonOffset: true,
    polygonOffsetFactor: -1.0,
    polygonOffsetUnits: -1.0,
  });
  logoMatEast.userData = { nightColor: 0x67e8f9, sunsetColor: 0x0284c7 };
  illuminatedLogoMats.push(logoMatEast);

  const faceEast = new THREE.Mesh(new THREE.PlaneGeometry(faceW, faceW / 2.44), logoMatEast);
  faceEast.position.z = plateDepth + 0.02;
  signEast.add(faceEast);

  group.add(signEast);
}


// ============================================================================
// HÀM TẠO MÔ HÌNH CON CÁ THẬT THÂN SUÔN (REALISTIC STREAMLINED FISH)
// Thân suôn mượt khí động học, mõm nhọn, cuống đuôi thon, vây lưng, vây ngực, vây đuôi én
// ============================================================================
function buildRealisticStreamlinedFish(scale = 1.0, themeIdx = 0) {
  const group = new THREE.Group();

  // 4 gam màu cá nước ngọt tự nhiên bình thường (cá chép, cá trắm, cá vàng, cá diếc)
  const fishThemes = [
    { name: 'Cá chép sông bạc', back: 0x334155, flank: 0xcfd8dc, belly: 0xf8fafc, fin: 0x94a3b8, eye: 0x0f172a },
    { name: 'Cá chép vàng tự nhiên', back: 0x92400e, flank: 0xf59e0b, belly: 0xfef3c7, fin: 0xf59e0b, eye: 0x18181b },
    { name: 'Cá trắm đen ánh rêu', back: 0x1e293b, flank: 0x64748b, belly: 0xf1f5f9, fin: 0x475569, eye: 0x020617 },
    { name: 'Cá điêu hồng tự nhiên', back: 0xb91c1c, flank: 0xf87171, belly: 0xffedd5, fin: 0xfca5a5, eye: 0x18181b },
  ];
  const th = fishThemes[themeIdx % fishThemes.length];

  const len = 1.15 * scale;
  const hgt = 0.36 * scale;
  const wid = 0.16 * scale;

  // 1. THÂN CÁ SUÔN KHÍ ĐỘNG HỌC (Hydrodynamic Spindle Body)
  // Mõm vuốt nhọn -> Ức nở tròn -> Thân thuôn suôn dài -> Cuống đuôi thon mảnh
  const bodyGeo = new THREE.SphereGeometry(0.5, 20, 14);
  const pos = bodyGeo.attributes.position;
  const v = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    // Chuẩn hóa z từ [-0.5, 0.5] thành t trong [0, 1] (1: đỉnh mõm phía trước, 0: cuống đuôi phía sau)
    const t = (v.z + 0.5) / 1.0;
    let girth = 1.0;
    if (t > 0.65) {
      // Mõm cá vuốt nhọn mượt mà
      girth = Math.sin(Math.PI * 0.5 * (1.0 - (t - 0.65) / 0.35));
    } else {
      // Thân vuốt thon đều về cuống đuôi nhỏ
      girth = 0.22 + 0.78 * Math.sin(Math.PI * 0.5 * (t / 0.65));
    }
    v.x *= wid * girth * 2.0; // Dẹt hai bên mạn cá (lateral compression)
    v.y *= hgt * girth * 2.0; // Lưng cao và bụng thon
    v.z *= len;
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  bodyGeo.computeVertexNormals();

  const bodyMat = new THREE.MeshStandardMaterial({
    color: th.belly,
    roughness: 0.32,
    metalness: 0.28,
  });
  const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
  group.add(bodyMesh);

  // 2. LƯNG CÁ SẪM MÀU TỰ NHIÊN (Natural Dorsal Countershading)
  const backGeo = new THREE.SphereGeometry(0.48, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.45);
  const backPos = backGeo.attributes.position;
  for (let i = 0; i < backPos.count; i++) {
    v.fromBufferAttribute(backPos, i);
    const t = (v.z + 0.48) / 0.96;
    let girth = 1.0;
    if (t > 0.65) {
      girth = Math.sin(Math.PI * 0.5 * (1.0 - (t - 0.65) / 0.35));
    } else {
      girth = 0.22 + 0.78 * Math.sin(Math.PI * 0.5 * (t / 0.65));
    }
    v.x *= wid * 1.95 * girth;
    v.y = Math.max(0, v.y * hgt * 2.05 * girth);
    v.z *= len * 0.98;
    backPos.setXYZ(i, v.x, v.y, v.z);
  }
  backGeo.computeVertexNormals();

  const backMat = new THREE.MeshStandardMaterial({
    color: th.back,
    roughness: 0.35,
    metalness: 0.25,
  });
  const backMesh = new THREE.Mesh(backGeo, backMat);
  group.add(backMesh);

  // 3. ĐÔI MẮT CÁ TRÒN TINH ANH (Fish Eyes)
  const eyeMat = new THREE.MeshBasicMaterial({ color: th.eye });
  const whiteEyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  [-1, 1].forEach((side) => {
    const eyeWhite = new THREE.Mesh(new THREE.SphereGeometry(0.035 * scale, 6, 6), whiteEyeMat);
    eyeWhite.position.set(side * (wid * 0.35), hgt * 0.1, len * 0.36);
    group.add(eyeWhite);

    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.02 * scale, 6, 6), eyeMat);
    pupil.position.set(side * (wid * 0.37), hgt * 0.1, len * 0.37);
    group.add(pupil);
  });

  // 4. VÂY LƯNG CONG VUỐT RA SAU (Dorsal Fin)
  const finMat = new THREE.MeshStandardMaterial({
    color: th.fin,
    roughness: 0.4,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.88,
  });

  const dorsalShape = new THREE.Shape();
  dorsalShape.moveTo(0, 0);
  dorsalShape.quadraticCurveTo(-0.12 * scale, 0.24 * scale, -0.28 * scale, 0.20 * scale);
  dorsalShape.quadraticCurveTo(-0.35 * scale, 0.08 * scale, -0.42 * scale, 0);
  dorsalShape.closePath();
  const dorsalFin = new THREE.Mesh(new THREE.ShapeGeometry(dorsalShape), finMat);
  dorsalFin.position.set(0, hgt * 0.3, len * 0.1);
  group.add(dorsalFin);

  // 5. CẶP VÂY NGỰC XÒE HAI BÊN MANG CÁ (Pectoral Fins)
  const pecShape = new THREE.Shape();
  pecShape.moveTo(0, 0);
  pecShape.quadraticCurveTo(0.18 * scale, 0.06 * scale, 0.26 * scale, -0.06 * scale);
  pecShape.quadraticCurveTo(0.14 * scale, -0.16 * scale, 0, -0.06 * scale);
  pecShape.closePath();
  const pecGeo = new THREE.ShapeGeometry(pecShape);

  [-1, 1].forEach((side) => {
    const pec = new THREE.Mesh(pecGeo, finMat);
    pec.position.set(side * (wid * 0.35), -hgt * 0.12, len * 0.15);
    pec.rotation.y = side * 0.42;
    pec.rotation.z = -side * 0.3;
    group.add(pec);
  });

  // 6. VÂY ĐUÔI ÉN XẺ THÙY (Forked Caudal Fin) ĐẶT TRONG TAILGROUP ĐỂ QUẪY SÓNG
  const tailGroup = new THREE.Group();
  tailGroup.position.set(0, 0, -len * 0.52);

  const tailShape = new THREE.Shape();
  tailShape.moveTo(0, 0.05 * scale);
  tailShape.lineTo(-0.42 * scale, 0.36 * scale); // Thùy đuôi trên
  tailShape.quadraticCurveTo(-0.25 * scale, 0, -0.16 * scale, 0); // Vết xẻ đuôi én sâu tự nhiên
  tailShape.quadraticCurveTo(-0.25 * scale, 0, -0.42 * scale, -0.36 * scale); // Thùy đuôi dưới
  tailShape.lineTo(0, -0.05 * scale);
  tailShape.closePath();

  const tailMesh = new THREE.Mesh(new THREE.ShapeGeometry(tailShape), finMat);
  tailMesh.rotation.y = Math.PI / 2;
  tailGroup.add(tailMesh);
  group.add(tailGroup);

  return { group, tailGroup };
}

// ============================================================================
// BỂ CÁ CẢNH QUAN HÌNH CHỮ NHẬT & VƯỜN HOA CẠNH NHÀ ĐIỀU HÀNH DK2 (YÊU CẦU 2)
// ============================================================================
function buildDK2HeadquartersKoiPond(parentGroup, cfg) {
  const pondCenterX = cfg.width / 2 + 5.2; // Thế đất ven đường ĐT234 (x ≈ -19.8)
  const pondCenterZ = 0.5;
  const pondY = 0.12;

  const pondGroup = new THREE.Group();
  pondGroup.position.set(pondCenterX, pondY, pondCenterZ);
  pondGroup.userData = {
    id: 'hoCaKoiDK2',
    title: 'Bể cá cảnh quan hình chữ nhật & Vườn hoa DK2',
    desc: 'Bể cá hình chữ nhật kiến trúc hiện đại cạnh Nhà điều hành DK2 và đường ĐT234. Bao quanh bởi luống hoa rực rỡ ngát hương cùng đàn cá thân suôn tự nhiên bơi lội thanh bình.',
    type: 'landscape',
    zone: 'DK2',
  };

  const poolWidth = 7.6; // Dài 7.6m (trục X)
  const poolDepth = 5.2; // Rộng 5.2m (trục Z)
  const wallH = 0.45;
  const wallThick = 0.35;

  // 1. THÀNH BỂ ĐÁ GRANITE HÌNH CHỮ NHẬT VUÔNG VỨC HIỆN ĐẠI
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6, metalness: 0.2 });
  const copingMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.3 }); // Mũ thành bể đá đen bóng

  // Đáy bể lát gạch mosaic xanh ngọc
  const bottomMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.7 });
  const poolBottom = new THREE.Mesh(new THREE.BoxGeometry(poolWidth, 0.1, poolDepth), bottomMat);
  poolBottom.position.y = 0.05;
  poolBottom.receiveShadow = true;
  pondGroup.add(poolBottom);

  // 4 cạnh thành bể chữ nhật vuông vức
  // Cạnh Bắc & Nam (song song trục X)
  [-poolDepth / 2 - wallThick / 2, poolDepth / 2 + wallThick / 2].forEach((wz) => {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(poolWidth + wallThick * 2, wallH, wallThick), wallMat);
    wall.position.set(0, wallH / 2, wz);
    wall.castShadow = true;
    wall.receiveShadow = true;
    pondGroup.add(wall);

    // Mũ đá ốp gờ thành bể
    const coping = new THREE.Mesh(new THREE.BoxGeometry(poolWidth + wallThick * 2 + 0.1, 0.08, wallThick + 0.1), copingMat);
    coping.position.set(0, wallH + 0.04, wz);
    coping.receiveShadow = true;
    pondGroup.add(coping);
  });

  // Cạnh Đông & Tây (song song trục Z)
  [-poolWidth / 2 - wallThick / 2, poolWidth / 2 + wallThick / 2].forEach((wx) => {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(wallThick, wallH, poolDepth), wallMat);
    wall.position.set(wx, wallH / 2, 0);
    wall.castShadow = true;
    wall.receiveShadow = true;
    pondGroup.add(wall);

    const coping = new THREE.Mesh(new THREE.BoxGeometry(wallThick + 0.1, 0.08, poolDepth), copingMat);
    coping.position.set(wx, wallH + 0.04, 0);
    coping.receiveShadow = true;
    pondGroup.add(coping);
  });

  // 2. MẶT NƯỚC HỒ HÌNH CHỮ NHẬT TRONG VẮT (Rectangular Clear Water)
  waterKoiMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(poolWidth, poolDepth),
    createStylizedWaterMaterial(false)
  );
  waterKoiMesh.rotation.x = -Math.PI / 2;
  waterKoiMesh.position.set(0, wallH * 0.82, 0);
  pondGroup.add(waterKoiMesh);

  // 3. VƯỜN HOA RỰC RỠ CẠNH HỒ (LUSH FLOWER BEDS AROUND POND)
  // Luống hoa viền quanh phía Bắc, phía Nam và phía Đông (giáp ĐT234)
  const soilMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.95 }); // Đất mùn đen màu mỡ
  const flowerBedConfigs = [
    { x: 0, z: poolDepth / 2 + 1.1, w: poolWidth + 1.2, d: 1.1 }, // Luống hoa phía Nam
    { x: 0, z: -poolDepth / 2 - 1.1, w: poolWidth + 1.2, d: 1.1 }, // Luống hoa phía Bắc
    { x: poolWidth / 2 + 1.1, z: 0, w: 1.1, d: poolDepth + 1.2 }, // Luống hoa phía Đông (hướng đường ĐT234)
  ];

  const flowerColors = [
    { color: 0xfacc15, name: 'Cúc vàng' },
    { color: 0xef4444, name: 'Hồng đỏ' },
    { color: 0xf472b6, name: 'Dạ yến thảo hồng' },
    { color: 0xffffff, name: 'Bạch huệ' },
    { color: 0xa855f7, name: 'Lavender tím' },
    { color: 0xf97316, name: 'Vạn thọ cam' },
  ];

  flowerBedConfigs.forEach((fb) => {
    // Đất trồng hoa
    const soil = new THREE.Mesh(new THREE.BoxGeometry(fb.w, 0.16, fb.d), soilMat);
    soil.position.set(fb.x, 0.08, fb.z);
    soil.receiveShadow = true;
    pondGroup.add(soil);

    // Bó vỉa gạch bao quanh luống hoa
    const borderMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.8 });
    const border = new THREE.Mesh(new THREE.BoxGeometry(fb.w + 0.12, 0.22, fb.d + 0.12), borderMat);
    border.position.set(fb.x, 0.06, fb.z);
    pondGroup.add(border);

    // Trồng các khóm hoa dày dặn rực rỡ
    const flowerCount = Math.floor((fb.w * fb.d) * 4);
    for (let f = 0; f < flowerCount; f++) {
      const flGroup = new THREE.Group();
      const fx = fb.x + (Math.random() - 0.5) * (fb.w - 0.3);
      const fz = fb.z + (Math.random() - 0.5) * (fb.d - 0.3);
      flGroup.position.set(fx, 0.16, fz);

      // Thân cành lá xanh
      const stem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015, 0.02, 0.22, 5),
        new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.7 })
      );
      stem.position.y = 0.11;
      flGroup.add(stem);

      // Bông hoa nở xòe nhiều cánh
      const cInfo = flowerColors[Math.floor(Math.random() * flowerColors.length)];
      const petalMat = new THREE.MeshStandardMaterial({ color: cInfo.color, roughness: 0.5 });
      const bloom = new THREE.Mesh(new THREE.DodecahedronGeometry(0.08 + Math.random() * 0.04), petalMat);
      bloom.position.y = 0.22;
      bloom.scale.set(1.2, 0.65, 1.2);
      flGroup.add(bloom);

      // Nhụy hoa vàng
      const core = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 6), new THREE.MeshBasicMaterial({ color: 0xfef08a }));
      core.position.y = 0.25;
      flGroup.add(core);

      pondGroup.add(flGroup);
    }
  });

  // 4. LÁ SÚNG & HOA SEN NỞ TRONG BỂ
  const padMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.7, flatShading: true });
  const lotusMat = new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.5 });
  [-1.6, 1.8].forEach((lx) => {
    [ -1.0, 1.0 ].forEach((lz) => {
      const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.015, 7), padMat);
      pad.position.set(lx, wallH * 0.83, lz);
      pondGroup.add(pad);

      const lotus = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 4), lotusMat);
      lotus.position.set(lx, wallH * 0.86, lz);
      lotus.scale.set(1.2, 0.7, 1.2);
      pondGroup.add(lotus);
    });
  });

  // 5. ĐÀN CÁ BÌNH THƯỜNG THÂN SUÔN BƠI LỘI TỰ NHIÊN TRONG BỂ CHỮ NHẬT (WANDERING & NATURAL PATHS)
  koiFishes = [];
  const fishCount = 8;
  for (let i = 0; i < fishCount; i++) {
    // Kích thước cá thân suôn tự nhiên (scale 0.68 - 0.84m)
    const scale = 0.68 + (i % 3) * 0.08;
    const fishObj = buildRealisticStreamlinedFish(scale, i);

    // Tọa độ ngẫu nhiên ban đầu phân bố khắp lòng bể chữ nhật
    const startX = (Math.random() - 0.5) * (poolWidth - 2.4);
    const startZ = (Math.random() - 0.5) * (poolDepth - 2.0);
    const startY = wallH * 0.72 + (i % 3) * 0.025; // Chiều sâu bơi lội tự nhiên dưới mặt nước
    const heading = Math.random() * Math.PI * 2;
    const speed = 0.32 + Math.random() * 0.22;

    fishObj.group.position.set(startX, startY, startZ);
    fishObj.group.rotation.y = heading;
    pondGroup.add(fishObj.group);

    koiFishes.push({
      mesh: fishObj.group,
      tail: fishObj.tailGroup,
      x: startX,
      y: startY,
      z: startZ,
      baseY: startY,
      heading: heading,
      targetHeading: heading,
      speed: speed,
      targetSpeed: speed,
      wanderTimer: 1.0 + Math.random() * 3.0,
      burstTimer: 3.5 + Math.random() * 5.0,
      turnSpeed: 1.3,
      phase: i * 1.25,
      boundary: {
        minX: -poolWidth / 2 + 0.85,
        maxX: poolWidth / 2 - 0.85,
        minZ: -poolDepth / 2 + 0.8,
        maxZ: poolDepth / 2 - 0.8,
      },
    });
  }

  parentGroup.add(pondGroup);
  interactiveObjects.push(pondGroup);
}

// ============================================================================
// KHO LINH KIỆN & PHỤ TÙNG DK2 (D2.1)
// ============================================================================
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
  applySnowShader(roof.material, 0.3, 0.95);

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

// ============================================================================
// SÂN KIỂM ĐỊNH & XE THÀNH PHẨM DK2 (CHUYỂN ĐỔI TỪ NHÀ XƯỞNG CŨ)
// ============================================================================
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
  const yardMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    roughness: 0.85,
    polygonOffset: true,
    polygonOffsetFactor: -1.0,
    polygonOffsetUnits: -1.0,
  });
  applySnowShader(yardMat, 0.35, 0.92);
  const yard = new THREE.Mesh(yardGeo, yardMat);
  yard.rotation.x = -Math.PI / 2;
  yard.position.y = 0.05;
  yard.receiveShadow = true;
  group.add(yard);

  // Concrete grid expansion joints
  const lineMat = new THREE.MeshBasicMaterial({
    color: 0x64748b,
    polygonOffset: true,
    polygonOffsetFactor: -2.0,
    polygonOffsetUnits: -2.0,
  });
  for (let lx = -cfg.width / 2 + 8; lx < cfg.width / 2; lx += 11) {
    const joint = new THREE.Mesh(new THREE.PlaneGeometry(0.08, cfg.depth), lineMat);
    joint.rotation.x = -Math.PI / 2;
    joint.position.set(lx, 0.075, 0);
    group.add(joint);
  }

  // 2. Painted logistics markings: yellow borders, diagonal test tracks, parking bays
  const yellowPaintMat = new THREE.MeshBasicMaterial({
    color: 0xfacc15,
    polygonOffset: true,
    polygonOffsetFactor: -2.0,
    polygonOffsetUnits: -2.0,
  });
  const whitePaintMat = new THREE.MeshBasicMaterial({
    color: 0xf8fafc,
    polygonOffset: true,
    polygonOffsetFactor: -2.0,
    polygonOffsetUnits: -2.0,
  });

  // Border lines
  const borderTop = new THREE.Mesh(new THREE.PlaneGeometry(cfg.width - 2, 0.2), yellowPaintMat);
  borderTop.rotation.x = -Math.PI / 2;
  borderTop.position.set(0, 0.08, -cfg.depth / 2 + 1);
  group.add(borderTop);

  const borderBot = new THREE.Mesh(new THREE.PlaneGeometry(cfg.width - 2, 0.2), yellowPaintMat);
  borderBot.rotation.x = -Math.PI / 2;
  borderBot.position.set(0, 0.08, cfg.depth / 2 - 1);
  group.add(borderBot);

  // Speed / brake testing lane (Làn kiểm định tốc độ & phanh)
  const testTrackGreen = new THREE.Mesh(
    new THREE.PlaneGeometry(cfg.width - 4, 3.2),
    new THREE.MeshStandardMaterial({
      color: 0x15803d,
      roughness: 0.7,
      polygonOffset: true,
      polygonOffsetFactor: -2.0,
      polygonOffsetUnits: -2.0,
    })
  );
  testTrackGreen.rotation.x = -Math.PI / 2;
  testTrackGreen.position.set(0, 0.075, -6.5);
  group.add(testTrackGreen);

  // Center dashed line for test lane
  for (let dx = -cfg.width / 2 + 4; dx < cfg.width / 2 - 4; dx += 4) {
    const dash = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 0.15), whitePaintMat);
    dash.rotation.x = -Math.PI / 2;
    dash.position.set(dx, 0.09, -6.5);
    group.add(dash);
  }

  // Finished vehicle diagonal parking bays & parked DK Bikes
  const bikeColors = [0x184995, 0xef4444, 0x06b6d4, 0x10b981, 0x6366f1, 0xf1f5f9, 0x1e293b, 0x2563eb];
  for (let slot = 0; slot < 26; slot++) {
    const sx = -cfg.width / 2 + 6 + slot * 3.0;
    const sz = 2.0;

    // White parking divider line
    const slotLine = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 4.0), whitePaintMat);
    slotLine.rotation.x = -Math.PI / 2;
    slotLine.position.set(sx - 1.3, 0.08, sz);
    group.add(slotLine);

    // Park a DK Bike in each bay
    const bColor = bikeColors[slot % bikeColors.length];
    const parkedBike = createDetailedDKBike(bColor, `DK Bike Thành Phẩm Lô #${slot + 1}`);
    parkedBike.position.set(sx, 0.08, sz);
    parkedBike.rotation.y = Math.PI / 2;
    group.add(parkedBike);
  }

  // Second row of parked bikes (DK Gogo & DK Nova)
  for (let slot = 0; slot < 18; slot++) {
    const sx = -cfg.width / 2 + 10 + slot * 4.0;
    const sz = 7.5;
    const bColor = bikeColors[(slot + 3) % bikeColors.length];
    const isNova = slot % 2 === 1;
    const modelTitle = isNova ? `DK Nova Xuất Xưởng #${slot + 1}` : `DK Gogo Xuất Xưởng #${slot + 1}`;
    const parkedBike = createDKGogo(bColor, modelTitle);
    parkedBike.position.set(sx, 0.08, sz);
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

// ============================================================================
// SÂN BÃI THÀNH PHẨM & THỂ THAO ĐA NĂNG DK2
// ============================================================================
function buildSanThanhPhamDK2() {
  const cfg = CONFIG.BUILDINGS.sanThanhPhamDK2;
  const yardMat = new THREE.MeshStandardMaterial({
    color: cfg.yardColor,
    roughness: 0.8,
    polygonOffset: true,
    polygonOffsetFactor: -1.0,
    polygonOffsetUnits: -1.0,
  });
  const yard = new THREE.Mesh(
    new THREE.PlaneGeometry(cfg.width, cfg.depth),
    yardMat
  );
  yard.rotation.x = -Math.PI / 2;
  yard.position.set(cfg.position.x, 0.05, cfg.position.z);
  yard.receiveShadow = true;
  scene.add(yard);

  // Green court areas
  const courtMat = new THREE.MeshStandardMaterial({
    color: cfg.courtColor,
    roughness: 0.7,
    polygonOffset: true,
    polygonOffsetFactor: -2.0,
    polygonOffsetUnits: -2.0,
  });
  const court1 = new THREE.Mesh(new THREE.PlaneGeometry(24, 16), courtMat);
  court1.rotation.x = -Math.PI / 2;
  court1.position.set(cfg.position.x - 18, 0.08, cfg.position.z - 8);
  court1.receiveShadow = true;
  scene.add(court1);

  const court2 = new THREE.Mesh(new THREE.PlaneGeometry(30, 10), courtMat);
  court2.rotation.x = -Math.PI / 2;
  court2.position.set(cfg.position.x + 12, 0.08, cfg.position.z - 12);
  court2.receiveShadow = true;
  scene.add(court2);
}

// ============================================================================
// QUÁN CÀ PHÊ & LOUNGE DK COFFEE & BAR (ĐỐI DIỆN NHÀ ĐIỀU HÀNH DK2)
// ============================================================================
function buildDKCoffeeBar() {
  const cafeGroup = new THREE.Group();
  cafeGroup.position.set(-24.0, 0, 8.5); // Nằm ngay đối diện Nhà điều hành DK2 qua trục đường nội bộ
  cafeGroup.userData = {
    id: 'dkCoffeeBar',
    title: 'DK Coffee & Bar (Khuôn viên DK2)',
    desc: 'Không gian cà phê & lounge thư giãn phong cách mở hiện đại đối diện Nhà điều hành DK2. Nơi phục vụ thức uống mát lành, cà phê pha máy cho cán bộ công nhân viên DK Bike cùng đối tác ghé thăm.',
    type: 'building',
    zone: 'DK2',
  };

  // 1. Sàn gỗ Terrace ngoài trời (Raised Timber Deck 9.6m x 7.8m)
  const deckMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 });
  applySnowShader(deckMat, 0.35, 0.9);
  const deck = new THREE.Mesh(new THREE.BoxGeometry(9.6, 0.22, 7.8), deckMat);
  deck.position.set(0, 0.11, 0);
  deck.receiveShadow = true;
  cafeGroup.add(deck);

  // 2. Kiosk quầy Bar pha chế hiện đại (Modern Wood & Black Steel Pavilion)
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.7 });
  const kiosk = new THREE.Mesh(new THREE.BoxGeometry(4.2, 3.0, 2.8), wallMat);
  kiosk.position.set(-2.2, 1.6, -1.8);
  kiosk.castShadow = true;
  cafeGroup.add(kiosk);

  // Mái che phẳng viền thép đen
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.3 });
  applySnowShader(roofMat, 0.3, 0.95);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(5.0, 0.25, 3.6), roofMat);
  roof.position.set(-2.2, 3.2, -1.8);
  roof.castShadow = true;
  cafeGroup.add(roof);

  // Quầy Bar phục vụ (Service Counter)
  const counterMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });
  const counter = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.05, 0.65), counterMat);
  counter.position.set(-2.2, 0.65, -0.3);
  counter.castShadow = true;
  cafeGroup.add(counter);

  // Mặt đá quầy Bar
  const counterTop = new THREE.Mesh(
    new THREE.BoxGeometry(3.8, 0.08, 0.75),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2 })
  );
  counterTop.position.set(-2.2, 1.2, -0.3);
  cafeGroup.add(counterTop);

  // Máy pha cà phê Espresso chuyên nghiệp (Đỏ & Inox)
  const espressoGroup = new THREE.Group();
  espressoGroup.position.set(-2.8, 1.25, -0.3);
  const espressoBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.65, 0.45, 0.4),
    new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.3, metalness: 0.4 })
  );
  espressoBody.position.y = 0.225;
  espressoGroup.add(espressoBody);
  const chromeTop = new THREE.Mesh(
    new THREE.BoxGeometry(0.62, 0.06, 0.38),
    new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.1, metalness: 0.9 })
  );
  chromeTop.position.y = 0.48;
  espressoGroup.add(chromeTop);
  [-0.15, 0.15].forEach((cx) => {
    const port = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.14),
      new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.8 })
    );
    port.position.set(cx, 0.16, 0.18);
    espressoGroup.add(port);
  });
  cafeGroup.add(espressoGroup);

  // Máy xay cà phê (Coffee Grinder)
  const grinder = new THREE.Group();
  grinder.position.set(-2.2, 1.25, -0.3);
  const grinderBody = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.42, 8), new THREE.MeshStandardMaterial({ color: 0x1e293b }));
  grinderBody.position.y = 0.21;
  grinder.add(grinderBody);
  const hopper = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.2, 8), new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.3 }));
  hopper.rotation.x = Math.PI;
  hopper.position.y = 0.45;
  grinder.add(hopper);
  cafeGroup.add(grinder);

  // Tủ kính trưng bày bánh ngọt (Pastry Display Case)
  const pastryCase = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.4, 0.45),
    new THREE.MeshStandardMaterial({ color: 0xbae6fd, transparent: true, opacity: 0.6, roughness: 0.1 })
  );
  pastryCase.position.set(-1.3, 1.45, -0.3);
  cafeGroup.add(pastryCase);

  // Bảng Menu phấn đen (Menu Chalkboard)
  const menuBoard = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 1.5, 0.04),
    new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 })
  );
  menuBoard.position.set(-0.2, 2.0, -1.8);
  cafeGroup.add(menuBoard);

  // 3. Biển hiệu chữ nổi 3D "☕ DK COFFEE & BAR" phát sáng ấm áp
  const signBacking = new THREE.Mesh(
    new THREE.BoxGeometry(3.6, 0.65, 0.12),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4 })
  );
  signBacking.position.set(-2.2, 3.65, -0.1);
  cafeGroup.add(signBacking);

  const signTrim = new THREE.Mesh(
    new THREE.BoxGeometry(3.68, 0.72, 0.08),
    new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.2, metalness: 0.8 })
  );
  signTrim.position.set(-2.2, 3.65, -0.12);
  cafeGroup.add(signTrim);

  const signTextPlate = new THREE.Mesh(
    new THREE.PlaneGeometry(3.4, 0.52),
    new THREE.MeshBasicMaterial({ color: 0xfef08a })
  );
  signTextPlate.position.set(-2.2, 3.65, -0.03);
  cafeGroup.add(signTextPlate);

  // Đèn rọi neon ấm rọi xuống quầy bar
  const warmLight = new THREE.PointLight(0xfef08a, 1.2, 8.0);
  warmLight.position.set(-2.2, 3.0, 0.2);
  cafeGroup.add(warmLight);

  // 4. Bàn ghế ngoài trời & Dù che nắng thương hiệu DK Bike
  const tablePositions = [
    { x: 1.8, z: -1.2, umbrella: true, color: 0x0284c7 },
    { x: 2.2, z: 1.8, umbrella: true, color: 0xdc2626 },
    { x: -0.6, z: 1.8, umbrella: false, color: 0x0284c7 },
  ];

  tablePositions.forEach((tp) => {
    const tableGroup = new THREE.Group();
    tableGroup.position.set(tp.x, 0.22, tp.z);

    const leg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.18, 0.75, 8),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7 })
    );
    leg.position.y = 0.375;
    tableGroup.add(leg);

    const tableTop = new THREE.Mesh(
      new THREE.CylinderGeometry(0.65, 0.65, 0.05, 16),
      new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.7 })
    );
    tableTop.position.y = 0.77;
    tableTop.receiveShadow = true;
    tableGroup.add(tableTop);

    const saucer = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.08, 0.02, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    saucer.position.set(0.15, 0.805, 0.1);
    tableGroup.add(saucer);
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.09, 8), new THREE.MeshBasicMaterial({ color: 0x0284c7 }));
    cup.position.set(0.15, 0.85, 0.1);
    tableGroup.add(cup);

    [0, Math.PI * 0.8, Math.PI * 1.4].forEach((rot) => {
      const chair = new THREE.Group();
      chair.rotation.y = rot;
      const seat = new THREE.Mesh(
        new THREE.CylinderGeometry(0.24, 0.24, 0.04, 8),
        new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 })
      );
      seat.position.set(0, 0.44, 0.65);
      chair.add(seat);
      const chairLeg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.02, 0.02, 0.44, 6),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8 })
      );
      chairLeg.position.set(0, 0.22, 0.65);
      chair.add(chairLeg);
      tableGroup.add(chair);
    });

    if (tp.umbrella) {
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, 2.7, 8),
        new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.8 })
      );
      pole.position.set(0, 1.35, 0);
      tableGroup.add(pole);

      const canopy = new THREE.Mesh(
        new THREE.ConeGeometry(1.4, 0.45, 8),
        new THREE.MeshStandardMaterial({ color: tp.color, roughness: 0.6, side: THREE.DoubleSide })
      );
      canopy.position.set(0, 2.65, 0);
      canopy.castShadow = true;
      tableGroup.add(canopy);
    }

    cafeGroup.add(tableGroup);
  });

  // 5. Nhân vật Barista & Khách uống cà phê
  const barista = createCharacter({
    shirtColor: 0x18181b,
    pantsColor: 0x334155,
    hatType: 'none',
    role: 'barista',
  });
  barista.position.set(-2.0, 0.22, -0.9);
  barista.rotation.y = 0;
  cafeGroup.add(barista);

  const customer1 = createCharacter({
    shirtColor: 0x0284c7,
    pantsColor: 0x475569,
    hatType: 'cap',
    role: 'customer',
  });
  customer1.position.set(1.8, 0.22, -0.6);
  customer1.rotation.y = -Math.PI / 2;
  cafeGroup.add(customer1);

  const customer2 = createCharacter({
    shirtColor: 0xf43f5e,
    pantsColor: 0x1e293b,
    hatType: 'none',
    role: 'customer',
  });
  customer2.position.set(2.2, 0.22, 2.4);
  customer2.rotation.y = 0;
  cafeGroup.add(customer2);

  // 6. Bồn hoa lavender & Cây cảnh viền quanh deck
  [-4.2, 4.2].forEach((px) => {
    const planter = new THREE.Mesh(
      new THREE.BoxGeometry(0.65, 0.6, 2.4),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 })
    );
    planter.position.set(px, 0.52, 0);
    cafeGroup.add(planter);

    const shrub = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.45, 2.3),
      new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.8, flatShading: true })
    );
    shrub.position.set(px, 0.95, 0);
    cafeGroup.add(shrub);
  });

  scene.add(cafeGroup);
  interactiveObjects.push(cafeGroup);
  buildingMeshes.push(kiosk);
}

function buildRoadsideHouses() {
  const roadsideHousesData = [
    // Xóm Nam ven ĐT234 (phía Đông đường)
    { x: 6.8, y: 0.1, z: 22.0, rotY: -Math.PI / 2, roofColor: 0xdc2626, wallColor: 0xfef08a, name: 'Nhà dân #01 (Mái ngói đỏ cam)' },
    { x: 7.2, y: 0.1, z: 38.0, rotY: -Math.PI / 2, roofColor: 0x0284c7, wallColor: 0xf8fafc, name: 'Nhà dân #02 (Mái ngói xanh lam)' },
    { x: 6.2, y: 0.1, z: 54.0, rotY: -Math.PI / 2, roofColor: 0xd97706, wallColor: 0xfef3c7, name: 'Nhà dân #03 (Mái ngói đất nung)' },
    // Xóm Nam ven ĐT234 (phía Tây đường)
    { x: -21.0, y: 0.1, z: 34.0, rotY: Math.PI / 2, roofColor: 0xb91c1c, wallColor: 0xfef9c3, name: 'Nhà dân #04 (Nhà vườn xóm Tây)' },
    { x: -22.5, y: 0.1, z: 52.0, rotY: Math.PI / 2, roofColor: 0x059669, wallColor: 0xf8fafc, name: 'Nhà dân #05 (Mái ngói rêu xanh)' },
    // Xóm Bắc ven ĐT234
    { x: 5.5, y: 0.1, z: -115.0, rotY: -Math.PI / 2, roofColor: 0xdc2626, wallColor: 0xfef08a, name: 'Nhà dân #06 (Chân đồi Bắc)' },
    { x: -20.5, y: 0.1, z: -128.0, rotY: Math.PI / 2, roofColor: 0x9333ea, wallColor: 0xf8fafc, name: 'Nhà dân #07 (Xóm núi Tây Bắc)' },
  ];

  const baseMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.9, flatShading: true });
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.85 });
  const doorMat = new THREE.MeshStandardMaterial({ color: 0x5c3d2e, roughness: 0.9 });
  const winMat = new THREE.MeshStandardMaterial({ color: 0xbae6fd, roughness: 0.2, metalness: 0.5 });
  const chimneyMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.95 });
  const fenceMat = new THREE.MeshStandardMaterial({ color: 0xd6d3d1, roughness: 0.8 });
  const lanternMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });

  roadsideHousesData.forEach((hData, idx) => {
    const houseGroup = new THREE.Group();
    houseGroup.position.set(hData.x, hData.y, hData.z);
    houseGroup.rotation.y = hData.rotY;
    houseGroup.userData = {
      id: `roadsideHouse_${idx}`,
      title: hData.name,
      desc: 'Ngôi nhà nhỏ xinh xắn của người dân sinh sống ven trục đường tỉnh ĐT234, mang nét đẹp thanh bình mộc mạc đặc trưng của nông thôn Bắc Bộ với mái ngói dốc, hiên gỗ, giàn hoa và hàng rào trắng.',
      type: 'building',
      zone: 'DT234',
    };

    const w = 4.6;
    const d = 5.6;
    const h = 2.6;

    // 1. Nền móng nhà
    const foundation = new THREE.Mesh(new THREE.BoxGeometry(w + 0.6, 0.35, d + 1.2), baseMat);
    foundation.position.set(0, 0.175, 0.4);
    foundation.receiveShadow = true;
    houseGroup.add(foundation);

    // 2. Thân tường nhà
    const wallMat = new THREE.MeshStandardMaterial({ color: hData.wallColor, roughness: 0.75 });
    const wall = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
    wall.position.set(0, 0.35 + h / 2, 0);
    wall.castShadow = true;
    wall.receiveShadow = true;
    houseGroup.add(wall);

    // 3. Mái ngói dốc kiểu truyền thống (Pitched Roof)
    const roofMat = new THREE.MeshStandardMaterial({ color: hData.roofColor, roughness: 0.6, flatShading: true });
    applySnowShader(roofMat, 0.2, 0.95);
    const roofGeo = new THREE.ConeGeometry(w * 0.76, 1.8, 4);
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.rotation.y = Math.PI / 4;
    roof.scale.set(1.15, 1.0, (d / w) * 1.12);
    roof.position.set(0, 0.35 + h + 0.9, 0);
    roof.castShadow = true;
    houseGroup.add(roof);

    // 4. Ống khói nhỏ trên mái
    const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.2, 0.5), chimneyMat);
    chimney.position.set(w * 0.28, 0.35 + h + 1.2, -d * 0.2);
    chimney.castShadow = true;
    houseGroup.add(chimney);

    // Khói lam chiều bốc nhẹ từ ống khói nhà dân ven đường ĐT234 (Sinh động, thơ mộng)
    const smokePuffCount = 5;
    const houseSmokeMat = new THREE.MeshBasicMaterial({
      color: 0xf1f5f9,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    });
    for (let sp = 0; sp < smokePuffCount; sp++) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(0.24, 6, 6), houseSmokeMat.clone());
      puff.position.set(w * 0.28, 0.35 + h + 1.8, -d * 0.2);
      houseGroup.add(puff);
      roadsideSmokePuffs.push({
        mesh: puff,
        baseX: w * 0.28,
        baseY: 0.35 + h + 1.8,
        baseZ: -d * 0.2,
        progress: sp / smokePuffCount,
        speed: 0.24 + Math.random() * 0.06,
        swayPhase: Math.random() * Math.PI * 2,
        maxScale: 0.85 + Math.random() * 0.3,
        maxHeight: 3.8 + Math.random() * 1.2,
      });
    }

    // 5. Hiên nhà phía trước (Front Porch)
    const porchRoof = new THREE.Mesh(new THREE.BoxGeometry(w * 0.75, 0.12, 1.2), roofMat);
    porchRoof.position.set(0, 0.35 + h * 0.85, d / 2 + 0.6);
    porchRoof.rotation.x = 0.15;
    porchRoof.castShadow = true;
    houseGroup.add(porchRoof);

    // Hai cột gỗ hiên
    [-w * 0.32, w * 0.32].forEach((px) => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, h * 0.85, 6), woodMat);
      post.position.set(px, 0.35 + (h * 0.85) / 2, d / 2 + 1.1);
      post.castShadow = true;
      houseGroup.add(post);
    });

    // Đèn lồng hiên nhà
    const lantern = new THREE.Mesh(new THREE.DodecahedronGeometry(0.16), lanternMat);
    lantern.position.set(0, 0.35 + h * 0.82, d / 2 + 0.8);
    houseGroup.add(lantern);

    // 6. Cửa chính ra vào
    const door = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.9), doorMat);
    door.position.set(0, 0.35 + 0.95, d / 2 + 0.02);
    houseGroup.add(door);

    // 7. Cửa sổ kính sáng
    [-w * 0.32, w * 0.32].forEach((wx) => {
      const win = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 0.95), winMat);
      win.position.set(wx, 0.35 + 1.35, d / 2 + 0.02);
      houseGroup.add(win);
    });

    // 8. Hàng rào gỗ nhỏ bao quanh sân
    for (let fz = -d / 2; fz <= d / 2 + 1.6; fz += 0.75) {
      [-w / 2 - 0.5, w / 2 + 0.5].forEach((fx) => {
        const picket = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.65, 0.06), fenceMat);
        picket.position.set(fx, 0.35, fz);
        houseGroup.add(picket);
      });
    }

    // 9. Cây ăn quả nhỏ bên hông nhà
    const treeTrunk = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.15, 1.4, 5), woodMat);
    treeTrunk.position.set(w / 2 + 1.4, 0.7, -d * 0.2);
    houseGroup.add(treeTrunk);

    const treeFoliage = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.95, 1),
      new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.8, flatShading: true })
    );
    treeFoliage.position.set(w / 2 + 1.4, 1.8, -d * 0.2);
    treeFoliage.castShadow = true;
    houseGroup.add(treeFoliage);

    scene.add(houseGroup);
    interactiveObjects.push(houseGroup);
    buildingMeshes.push(wall);
  });
}

// ============================================================================
// 8. DK2: Hillside, Winding Road, Eco-Pond & Orchid Garden
// ============================================================================
function buildDK2HillAndOrchidGarden() {
  // 1. Đồi chính DK2 (Đỉnh cao phía Bắc) - Hòa sắc vertex colors đất nâu & thảm cỏ sinh thái
  const hillCfg = CONFIG.HILLS.dk2;
  const hillGeo = new THREE.ConeGeometry(hillCfg.radius, hillCfg.height, 14, 8);
  const hillPos = hillGeo.attributes.position;
  const hillColors = [];
  const baseDk2Green = new THREE.Color(hillCfg.color);
  const vibrantDk2Green = baseDk2Green.clone().offsetHSL(0.03, 0.08, 0.06);
  const deepDk2Green = baseDk2Green.clone().offsetHSL(-0.02, 0.05, -0.09);
  const earthWarm = new THREE.Color(0x78350f);
  const earthDark = new THREE.Color(0x542d13);
  const sandLoam = new THREE.Color(0x92400e);

  for (let vi = 0; vi < hillPos.count; vi++) {
    const vx = hillPos.getX(vi);
    const vy = hillPos.getY(vi);
    const vz = hillPos.getZ(vi);
    const wx = hillCfg.position.x + vx;
    const wz = hillCfg.position.z + vz;
    const normY = (vy + hillCfg.height / 2) / hillCfg.height;

    const strataNoise = Math.sin(wx * 0.12 + vy * 0.3) * 0.5 + Math.cos(wz * 0.15 + vy * 0.22) * 0.5;
    const patchNoise = Math.sin(wx * 0.07 - wz * 0.08) * 0.5 + Math.cos(wx * 0.2 + wz * 0.16) * 0.5;

    let isEarth = false;
    let earthIntensity = 0;

    if (normY < 0.22) {
      if (strataNoise > 0.12 || patchNoise > 0.25) {
        isEarth = true;
        earthIntensity = Math.min(1.0, (0.22 - normY) / 0.22 * 0.75 + strataNoise * 0.35);
      }
    } else if (normY >= 0.22 && normY <= 0.82) {
      if (strataNoise > 0.16 && patchNoise > -0.18) {
        isEarth = true;
        earthIntensity = Math.min(1.0, (strataNoise - 0.16) * 1.6 + patchNoise * 0.35);
      }
    } else {
      if (patchNoise > 0.4) {
        isEarth = true;
        earthIntensity = 0.55;
      }
    }

    let col = baseDk2Green.clone();
    if (normY > 0.5) col.lerp(vibrantDk2Green, (normY - 0.5) * 0.6);
    else col.lerp(deepDk2Green, (0.5 - normY) * 0.5);

    if (isEarth && earthIntensity > 0) {
      const targetSoil = (strataNoise > 0.35) ? earthDark : ((patchNoise > 0.15) ? earthWarm : sandLoam);
      col.lerp(targetSoil, Math.min(0.92, earthIntensity));
    }
    hillColors.push(col.r, col.g, col.b);
  }
  hillGeo.setAttribute('color', new THREE.Float32BufferAttribute(hillColors, 3));
  hillGeo.computeVertexNormals();

  const hill = new THREE.Mesh(
    hillGeo,
    new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, flatShading: true })
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

    const newHillGeo = new THREE.CylinderGeometry(flatR, baseR, h, 24, 8);
    const nhPos = newHillGeo.attributes.position;
    const nhColors = [];
    const baseNhGreen = new THREE.Color(nhCfg.color);
    const vibrantNhGreen = baseNhGreen.clone().offsetHSL(0.03, 0.08, 0.05);
    const deepNhGreen = baseNhGreen.clone().offsetHSL(-0.02, 0.05, -0.08);

    for (let vi = 0; vi < nhPos.count; vi++) {
      const vx = nhPos.getX(vi);
      const vy = nhPos.getY(vi);
      const vz = nhPos.getZ(vi);
      const wx = nhCfg.position.x + vx;
      const wz = nhCfg.position.z + vz;
      const normY = (vy + h / 2) / h; // 0 ở chân đồi, 1 ở đỉnh đồi phẳng

      const strataNoise = Math.sin(wx * 0.11 + vy * 0.32) * 0.5 + Math.cos(wz * 0.13 + vy * 0.25) * 0.5;
      const patchNoise = Math.sin(wx * 0.06 - wz * 0.08) * 0.5 + Math.cos(wx * 0.18 + wz * 0.15) * 0.5;

      let isEarth = false;
      let earthIntensity = 0;

      if (normY < 0.2) {
        // Chân đồi loang đất nâu tiếp giáp mặt bằng
        if (strataNoise > 0.12 || patchNoise > 0.22) {
          isEarth = true;
          earthIntensity = Math.min(0.9, (0.2 - normY) / 0.2 * 0.7 + strataNoise * 0.35);
        }
      } else if (normY >= 0.2 && normY <= 0.88) {
        // Sườn taluy đồi: vạt đất nâu tự nhiên bám dốc
        if (strataNoise > 0.18) {
          isEarth = true;
          earthIntensity = Math.min(0.88, (strataNoise - 0.18) * 1.5 + patchNoise * 0.3);
        }
      } else {
        // Đỉnh đồi bằng phẳng: điểm xuyết vạt đất mùn bồn hoa
        if (patchNoise > 0.45) {
          isEarth = true;
          earthIntensity = 0.5;
        }
      }

      let col = baseNhGreen.clone();
      if (normY > 0.7) col.lerp(vibrantNhGreen, (normY - 0.7) * 1.2);
      else col.lerp(deepNhGreen, (0.7 - normY) * 0.45);

      if (isEarth && earthIntensity > 0) {
        const targetSoil = (strataNoise > 0.35) ? earthDark : ((patchNoise > 0.15) ? earthWarm : sandLoam);
        col.lerp(targetSoil, Math.min(0.92, earthIntensity));
      }
      nhColors.push(col.r, col.g, col.b);
    }
    newHillGeo.setAttribute('color', new THREE.Float32BufferAttribute(nhColors, 3));
    newHillGeo.computeVertexNormals();

    const newHill = new THREE.Mesh(
      newHillGeo,
      new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, flatShading: true })
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
    terrace.position.set(-105, tier * 2.8, -43);
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
// Tuyến đường đi bộ sinh thái DK2: Sân xe -> Vườn Lan -> Ao Cá -> Vườn Hoa Đồi Mới
// (Thiết kế bám sát tuyến vẽ thực địa: Bậc thang gỗ leo dốc, Lan can dây thừng, Đèn solar)
// ============================================================================
function buildDK2EcoTrail() {
  const trailGroup = new THREE.Group();
  trailGroup.userData = {
    id: 'ecoTrailDK2',
    title: 'Tuyến đường đi bộ sinh thái DK2',
    type: 'landscape',
    desc: 'Tuyến đường đi bộ uốn lượn ven sườn đồi kết nối liên hoàn: Từ bãi xe thành phẩm DK2 leo dốc qua rặng thông lên sảnh Vườn Lan, men theo chân kè Ao Cá đồi sinh thái, sang cung đường hoa đôi bậc thang và chuồng bồ câu Đồi mới. Tuyến đường được lát đá sa thạch sáng màu, có bậc thang gỗ chống trượt trên sườn dốc, lan can cọc gỗ xỏ dây thừng và chuỗi đèn solar ấm áp lung linh về đêm.',
    zone: 'DK2',
  };

  // Vật liệu chuyên dụng chất lượng cao
  const pathMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0, // Đá phiến xám sáng tự nhiên, nổi bật sắc nét trên thảm cỏ xanh
    roughness: 0.88,
    metalness: 0.05,
    flatShading: true,
  });

  const pathBorderMat = new THREE.MeshStandardMaterial({
    color: 0x64748b, // Viền gờ đá bảo vệ taluy
    roughness: 0.95,
    flatShading: true,
  });

  const timberStepMat = new THREE.MeshStandardMaterial({
    color: 0x5c3d2e, // Gỗ gụ chống trượt sẫm màu
    roughness: 0.9,
    flatShading: true,
  });

  const postMat = new THREE.MeshStandardMaterial({
    color: 0x78350f, // Cọc gỗ tròn tự nhiên
    roughness: 0.85,
  });

  const ropeMat = new THREE.MeshStandardMaterial({
    color: 0xd4a373, // Dây thừng gai vàng cát
    roughness: 0.95,
  });

  const solarLampMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.6,
  });

  const solarGlowMat = new THREE.MeshBasicMaterial({
    color: 0xfef08a, // Ánh sáng LED vàng ấm
  });

  // Helper: Tạo ribbon mặt đường uốn lượn theo địa hình 3D
  function createTrailStrip(points, width, isFlowerZone = false) {
    const curve = new THREE.CatmullRomCurve3(points);
    const length = curve.getLength();
    const divisions = Math.max(30, Math.floor(length * 1.6));
    const samplePts = curve.getPoints(divisions);

    const vertices = [];
    const uvs = [];
    const indices = [];

    for (let i = 0; i <= divisions; i++) {
      const pt = samplePts[i];
      let tan;
      if (i < divisions) {
        tan = samplePts[i + 1].clone().sub(pt).normalize();
      } else {
        tan = pt.clone().sub(samplePts[i - 1]).normalize();
      }
      const norm = new THREE.Vector3(-tan.z, 0, tan.x).normalize();

      const halfW = width / 2;
      const lx = pt.x + norm.x * halfW;
      const lz = pt.z + norm.z * halfW;
      const ly = getDK2HillSurfaceY(lx, lz) + 0.12;

      const rx = pt.x - norm.x * halfW;
      const rz = pt.z - norm.z * halfW;
      const ry = getDK2HillSurfaceY(rx, rz) + 0.12;

      // Đỉnh giữa tạo vồng nhẹ thoát nước
      const cx = pt.x;
      const cz = pt.z;
      const cy = getDK2HillSurfaceY(cx, cz) + 0.14;

      const baseIdx = i * 3;
      vertices.push(lx, ly, lz);
      vertices.push(cx, cy, cz);
      vertices.push(rx, ry, rz);

      const u = i / divisions;
      uvs.push(0, u, 0.5, u, 1, u);

      if (i < divisions) {
        const nextIdx = (i + 1) * 3;
        indices.push(baseIdx, baseIdx + 1, nextIdx);
        indices.push(baseIdx + 1, nextIdx + 1, nextIdx);
        indices.push(baseIdx + 1, baseIdx + 2, nextIdx + 1);
        indices.push(baseIdx + 2, nextIdx + 2, nextIdx + 1);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();

    const mesh = new THREE.Mesh(geo, pathMat);
    mesh.receiveShadow = true;
    mesh.userData = trailGroup.userData;
    trailGroup.add(mesh);
    interactiveObjects.push(mesh);

    // Gờ đá viền 2 bên
    const leftKerbPts = [];
    const rightKerbPts = [];
    for (let i = 0; i <= divisions; i += 2) {
      const pt = samplePts[i];
      let tan = (i < divisions ? samplePts[i + 1] : pt).clone().sub(i > 0 ? samplePts[i - 1] : pt).normalize();
      const norm = new THREE.Vector3(-tan.z, 0, tan.x).normalize();
      const halfW = width / 2;

      const lx = pt.x + norm.x * (halfW + 0.08);
      const lz = pt.z + norm.z * (halfW + 0.08);
      const ly = getDK2HillSurfaceY(lx, lz) + 0.14;
      leftKerbPts.push(new THREE.Vector3(lx, ly, lz));

      const rx = pt.x - norm.x * (halfW + 0.08);
      const rz = pt.z - norm.z * (halfW + 0.08);
      const ry = getDK2HillSurfaceY(rx, rz) + 0.14;
      rightKerbPts.push(new THREE.Vector3(rx, ry, rz));
    }

    if (leftKerbPts.length > 2) {
      const leftKerb = new THREE.Mesh(
        new THREE.TubeGeometry(new THREE.CatmullRomCurve3(leftKerbPts), Math.floor(divisions / 2), 0.08, 4, false),
        pathBorderMat
      );
      leftKerb.scale.set(1.0, 0.7, 1.0);
      trailGroup.add(leftKerb);
    }
    if (rightKerbPts.length > 2) {
      const rightKerb = new THREE.Mesh(
        new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rightKerbPts), Math.floor(divisions / 2), 0.08, 4, false),
        pathBorderMat
      );
      rightKerb.scale.set(1.0, 0.7, 1.0);
      trailGroup.add(rightKerb);
    }

    return { curve, samplePts, length };
  }

  // 1. Tuyến chính leo dốc từ bãi đỗ xe/chân kè đá lên Vườn Lan (Segment 1 - Mũi tên đỏ 1)
  const climbPoints = [
    new THREE.Vector3(-72.0, 0.05, 0.0),
    new THREE.Vector3(-77.0, 0.05, -8.0),
    new THREE.Vector3(-83.0, 0.10, -18.0),
    new THREE.Vector3(-89.0, 3.66, -28.0),
    new THREE.Vector3(-95.0, 8.74, -38.0),
    new THREE.Vector3(-100.0, 13.03, -48.0),
    new THREE.Vector3(-105.0, 16.06, -56.0),
    new THREE.Vector3(-108.0, 16.79, -62.0),
  ];
  const climbTrail = createTrailStrip(climbPoints, 2.0, false);

  // 2. Tuyến sườn đồi từ Vườn Lan qua chân kè Ao Cá sang Đồi Hoa (Segment 2 - Mũi tên đỏ 2)
  const traversePoints = [
    new THREE.Vector3(-108.0, 16.79, -62.0),
    new THREE.Vector3(-114.0, 19.89, -53.0),
    new THREE.Vector3(-122.0, 17.82, -45.0),
    new THREE.Vector3(-130.0, 13.47, -38.0),
    new THREE.Vector3(-136.0, 15.35, -30.0),
    new THREE.Vector3(-141.0, 15.50, -22.0),
  ];
  const traverseTrail = createTrailStrip(traversePoints, 2.0, false);

  // 3. Tuyến hoa bậc trên qua các luống hoa & chòi ngắm cảnh (Segment 3 Upper - Nét đỏ trên Đồi Hoa)
  const flowerUpperPoints = [
    new THREE.Vector3(-136.0, 15.50, -22.0),
    new THREE.Vector3(-142.0, 15.50, -18.0),
    new THREE.Vector3(-148.0, 15.50, -15.0),
    new THREE.Vector3(-154.0, 15.50, -12.0),
    new THREE.Vector3(-160.0, 12.53, -8.0),
  ];
  const flowerUpperTrail = createTrailStrip(flowerUpperPoints, 1.8, true);

  // 4. Tuyến hoa bậc dưới ven triền đồi (Segment 3 Lower - Nét đỏ dưới Đồi Hoa)
  const flowerLowerPoints = [
    new THREE.Vector3(-133.0, 15.50, -14.0),
    new THREE.Vector3(-139.0, 15.50, -10.0),
    new THREE.Vector3(-146.0, 15.50, -6.0),
    new THREE.Vector3(-152.0, 14.60, -3.0),
    new THREE.Vector3(-158.0, 11.16, -1.0),
  ];
  const flowerLowerTrail = createTrailStrip(flowerLowerPoints, 1.8, true);

  // 5. Hai đoạn bậc thang nối vòng khép kín ở 2 đầu Đông & Tây Đồi Hoa
  const eastConnectorPoints = [
    new THREE.Vector3(-136.0, 15.50, -22.0),
    new THREE.Vector3(-134.5, 15.50, -18.0),
    new THREE.Vector3(-133.0, 15.50, -14.0),
  ];
  createTrailStrip(eastConnectorPoints, 1.8, true);

  const westConnectorPoints = [
    new THREE.Vector3(-160.0, 12.53, -8.0),
    new THREE.Vector3(-159.5, 11.85, -4.5),
    new THREE.Vector3(-158.0, 11.16, -1.0),
  ];
  createTrailStrip(westConnectorPoints, 1.8, true);

  // Bậc thang gỗ Rustic trên đoạn leo dốc (z từ -45 đến -82)
  const stepCount = 28;
  const stepGeo = new THREE.BoxGeometry(2.05, 0.16, 0.35);
  for (let s = 1; s <= stepCount; s++) {
    const t = 0.28 + (s / stepCount) * 0.68;
    const pt = climbTrail.curve.getPointAt(t);
    const tan = climbTrail.curve.getTangentAt(t);
    const elev = getDK2HillSurfaceY(pt.x, pt.z) + 0.15;

    const step = new THREE.Mesh(stepGeo, timberStepMat);
    step.position.set(pt.x, elev, pt.z);
    step.rotation.y = Math.atan2(tan.x, tan.z);
    step.castShadow = true;
    step.receiveShadow = true;
    trailGroup.add(step);
  }

  // Bậc thang gỗ trên đoạn sườn đồi Ao Cá
  const traverseStepCount = 14;
  for (let s = 1; s <= traverseStepCount; s++) {
    const t = (s / traverseStepCount);
    const pt = traverseTrail.curve.getPointAt(t);
    const tan = traverseTrail.curve.getTangentAt(t);
    const elev = getDK2HillSurfaceY(pt.x, pt.z) + 0.15;

    const step = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.15, 0.32), timberStepMat);
    step.position.set(pt.x, elev, pt.z);
    step.rotation.y = Math.atan2(tan.x, tan.z);
    step.castShadow = true;
    trailGroup.add(step);
  }

  // Hàng lan can gỗ xỏ dây thừng dọc theo sườn dốc bảo vệ khách bộ hành
  const railPosts = [];
  const postGeo = new THREE.CylinderGeometry(0.06, 0.07, 0.95, 6);
  // Đoạn leo dốc: đặt lan can bên mép Đông (nhìn xuống bãi đỗ xe và nhà xưởng)
  for (let t = 0.25; t <= 0.98; t += 0.045) {
    const pt = climbTrail.curve.getPointAt(t);
    const tan = climbTrail.curve.getTangentAt(t);
    const norm = new THREE.Vector3(-tan.z, 0, tan.x).normalize();
    const postPos = pt.clone().add(norm.clone().multiplyScalar(1.1));
    const elev = getDK2HillSurfaceY(postPos.x, postPos.z);

    const post = new THREE.Mesh(postGeo, postMat);
    post.position.set(postPos.x, elev + 0.47, postPos.z);
    post.castShadow = true;
    trailGroup.add(post);
    railPosts.push(new THREE.Vector3(postPos.x, elev + 0.82, postPos.z));
  }

  // Đoạn sườn đồi Ao Cá: đặt lan can bên mép nhìn xuống thung lũng
  for (let t = 0.05; t <= 0.95; t += 0.08) {
    const pt = traverseTrail.curve.getPointAt(t);
    const tan = traverseTrail.curve.getTangentAt(t);
    const norm = new THREE.Vector3(-tan.z, 0, tan.x).normalize();
    const postPos = pt.clone().add(norm.clone().multiplyScalar(-1.05));
    const elev = getDK2HillSurfaceY(postPos.x, postPos.z);

    const post = new THREE.Mesh(postGeo, postMat);
    post.position.set(postPos.x, elev + 0.47, postPos.z);
    post.castShadow = true;
    trailGroup.add(post);
    railPosts.push(new THREE.Vector3(postPos.x, elev + 0.82, postPos.z));
  }

  // Nối dây thừng giữa các cọc liền kề
  for (let i = 0; i < railPosts.length - 1; i++) {
    const p1 = railPosts[i];
    const p2 = railPosts[i + 1];
    const dist = p1.distanceTo(p2);
    if (dist < 4.2) {
      const mid = p1.clone().add(p2).multiplyScalar(0.5);
      const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, dist, 4), ropeMat);
      rope.position.copy(mid);
      rope.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), p2.clone().sub(p1).normalize());
      trailGroup.add(rope);

      const ropeLow = rope.clone();
      ropeLow.position.y -= 0.35;
      trailGroup.add(ropeLow);
    }
  }

  // Cọc đèn Solar phát sáng ban đêm dọc theo các tuyến
  const allTrails = [climbTrail, traverseTrail, flowerUpperTrail, flowerLowerTrail];
  const bollardPostGeo = new THREE.CylinderGeometry(0.045, 0.05, 0.65, 6);
  const bollardCapGeo = new THREE.CylinderGeometry(0.08, 0.06, 0.12, 6);
  const bollardGlowGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.18, 6);

  allTrails.forEach((tr) => {
    const count = Math.floor(tr.length / 5.2);
    for (let k = 1; k <= count; k++) {
      const t = k / (count + 1);
      const pt = tr.curve.getPointAt(t);
      const tan = tr.curve.getTangentAt(t);
      const norm = new THREE.Vector3(-tan.z, 0, tan.x).normalize();
      const side = (k % 2 === 0 ? 1 : -1) * 1.2;
      const pos = pt.clone().add(norm.clone().multiplyScalar(side));
      const elev = getDK2HillSurfaceY(pos.x, pos.z);

      const lampPost = new THREE.Mesh(bollardPostGeo, solarLampMat);
      lampPost.position.set(pos.x, elev + 0.32, pos.z);
      lampPost.castShadow = true;
      trailGroup.add(lampPost);

      const lampGlow = new THREE.Mesh(bollardGlowGeo, solarGlowMat);
      lampGlow.position.set(pos.x, elev + 0.62, pos.z);
      trailGroup.add(lampGlow);

      const lampCap = new THREE.Mesh(bollardCapGeo, solarLampMat);
      lampCap.position.set(pos.x, elev + 0.72, pos.z);
      trailGroup.add(lampCap);
    }
  });

  // 3 Biển chỉ dẫn sinh thái bằng gỗ mộc
  const signCfg = [
    { pt: new THREE.Vector3(-73.5, 0.05, -24.0), rotY: Math.PI / 6 },
    { pt: new THREE.Vector3(-109.5, 16.8, -82.0), rotY: -Math.PI / 4 },
    { pt: new THREE.Vector3(-138.5, 15.5, -44.0), rotY: Math.PI / 4 },
  ];

  signCfg.forEach((sc) => {
    const elev = getDK2HillSurfaceY(sc.pt.x, sc.pt.z);
    const post = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.08, 1.5, 6),
      new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.85 })
    );
    post.position.set(sc.pt.x, elev + 0.75, sc.pt.z);
    post.castShadow = true;
    trailGroup.add(post);

    const board = new THREE.Mesh(
      new THREE.BoxGeometry(1.7, 0.45, 0.08),
      new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.8 })
    );
    board.position.set(sc.pt.x, elev + 1.35, sc.pt.z);
    board.rotation.y = sc.rotY;
    board.castShadow = true;
    trailGroup.add(board);

    // Mũi tên gỗ chỉ hướng
    const arrow = new THREE.Mesh(
      new THREE.ConeGeometry(0.18, 0.32, 3),
      new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.5 })
    );
    arrow.position.set(sc.pt.x, elev + 1.35, sc.pt.z + 0.06);
    arrow.rotation.z = -Math.PI / 2;
    arrow.rotation.y = sc.rotY;
    trailGroup.add(arrow);
  });

  // 3 Ghế băng gỗ nghỉ chân tại các điểm view đẹp
  const benchLocations = [
    { x: -98.0, z: -68.0, rotY: -Math.PI / 3 },
    { x: -128.0, z: -62.0, rotY: Math.PI / 4 },
    { x: -148.0, z: -35.0, rotY: 0 },
  ];

  benchLocations.forEach((bc) => {
    const elev = getDK2HillSurfaceY(bc.x, bc.z);
    const benchGroup = new THREE.Group();
    benchGroup.position.set(bc.x, elev, bc.z);
    benchGroup.rotation.y = bc.rotY;

    const seat = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.08, 0.5), timberStepMat);
    seat.position.y = 0.42;
    seat.castShadow = true;
    benchGroup.add(seat);

    const back = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.4, 0.06), timberStepMat);
    back.position.set(0, 0.75, -0.22);
    back.castShadow = true;
    benchGroup.add(back);

    [-0.7, 0.7].forEach((lx) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.42, 6), solarLampMat);
      leg.position.set(lx, 0.21, 0);
      leg.castShadow = true;
      benchGroup.add(leg);
    });

    trailGroup.add(benchGroup);
  });

  // Nhân viên / Khách tham quan tản bộ trên đường mòn
  const hiker1 = createCharacter({ shirtColor: 0x0284c7, pantsColor: 0x334155, hatType: 'cap', role: 'worker' });
  hiker1.position.set(-94.0, getDK2HillSurfaceY(-94.0, -58.0) + 0.12, -58.0);
  hiker1.rotation.y = -Math.PI / 4;
  hiker1.scale.set(0.9, 0.9, 0.9);
  trailGroup.add(hiker1);

  const hiker2 = createCharacter({ shirtColor: 0xf43f5e, pantsColor: 0xf8fafc, hatType: 'none', role: 'engineer' });
  hiker2.position.set(-145.0, getDK2HillSurfaceY(-145.0, -36.0) + 0.12, -36.0);
  hiker2.rotation.y = Math.PI / 3;
  hiker2.scale.set(0.9, 0.9, 0.9);
  trailGroup.add(hiker2);

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

  // Dãy xe máy điện DK Roma SX, DK Gogo & DK Nova thành phẩm chi tiết trên sân xuất xưởng (Khối 8)
  const bikePalette = [0x184995, 0xdc2626, 0x0284c7, 0xf8fafc, 0x10b981, 0x1e293b];
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 6; col++) {
      const color = bikePalette[(row * 2 + col) % bikePalette.length];
      const modelIdx = (row * 6 + col) % 3;
      let bike;
      if (modelIdx === 0) {
        bike = createDKRomaSX(color, `DK Roma SX Lô #${row + 1}-${col + 1}`);
      } else if (modelIdx === 1) {
        bike = createDKGogo(color, `DK Gogo Lô #${row + 1}-${col + 1}`);
      } else {
        bike = createDKNova(color, `DK Nova Lô #${row + 1}-${col + 1}`);
      }
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

// Tạo tán cây tròn bồng bềnh nhiều múi búp mây (Stylized Puffy Cloud-Canopy như ảnh mẫu bên trái)
function createPuffyCloudCanopyGeometry(baseRadius = 1.6) {
  const geos = [];

  // Múi trung tâm tròn lớn
  const centerSphere = new THREE.DodecahedronGeometry(baseRadius, 1);
  geos.push(centerSphere);

  // 4 múi búp mây vệ tinh nở tròn xung quanh tạo tán cây bồng bềnh hữu cơ
  const lobes = [
    { x: 0.85 * baseRadius, y: -0.15 * baseRadius, z: 0.35 * baseRadius, r: 0.72 * baseRadius },
    { x: -0.75 * baseRadius, y: 0.12 * baseRadius, z: -0.45 * baseRadius, r: 0.75 * baseRadius },
    { x: -0.35 * baseRadius, y: -0.22 * baseRadius, z: 0.75 * baseRadius, r: 0.68 * baseRadius },
    { x: 0.45 * baseRadius, y: 0.28 * baseRadius, z: -0.65 * baseRadius, r: 0.65 * baseRadius },
  ];

  lobes.forEach((l) => {
    const lobeGeo = new THREE.DodecahedronGeometry(l.r, 1);
    lobeGeo.translate(l.x, l.y, l.z);
    geos.push(lobeGeo);
  });

  const merged = BufferGeometryUtils.mergeGeometries(geos, false);
  merged.computeVertexNormals();
  return merged;
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

  // 2. Các ngọn đồi nội vi diorama (khớp chính xác 100% với interiorHills)
  const hillsData = [
    { x: 58, z: -128, radius: 36, apex: 26 },  // Đồi Cối xay gió (lùi xa z = -128, chân đồi kết thúc tại z = -92)
    { x: 115, z: -80, radius: 24, apex: 22 },  // Đồi Đông xa
    { x: 116, z: -25, radius: 20, apex: 18 },  // Đồi Đông Nam xa
    { x: -145, z: -155, radius: 48, apex: 30 }, // Đồi góc Tây Bắc
    { x: 75, z: -160, radius: 46, apex: 30 },   // Đồi góc Đông Bắc
    { x: -60, z: -160, radius: 52, apex: 32 },  // Đồi sườn Bắc
    { x: -138, z: 72, radius: 32, apex: 18 },   // Đồi góc Tây Nam
  ];

  for (let i = 0; i < hillsData.length; i++) {
    const h = hillsData[i];
    const dist = Math.hypot(x - h.x, z - h.z);
    if (dist < h.radius) {
      const hillY = h.apex * (1 - dist / h.radius);
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
  // 1. Tuyệt đối loại bỏ cây cối xâm lấn Nhà B, Mái che xe 3 bánh, đường chạy thử bao quanh và sân thử xe
  if (x >= 47 && x <= 85.5 && z >= -86 && z <= -20) return true;
  // 2. Khuôn viên nhà máy DK1 (Xưởng B, Văn phòng A, Nhà C, Nhà ăn, Đài phun nước DK, Sân bóng chuyền, Bãi đỗ)
  if (x > 10 && x < 85.5 && z > -86 && z < 4) return true;
  // Khuôn viên nhà máy DK2 & Lối vào cổng chính DK2 kết nối ĐT234 (Dịch chuyển 22m theo mũi tên)
  if (x > -96 && x < -12 && z > -58 && z < 24) return true;
  // Vườn Lan & Sinh thái trên đồi DK2 (-108, -66)
  if (Math.hypot(x - (-108), z - (-66)) < 16.0) return true;
  // Ao cá đồi sinh thái DK2 cạnh Vườn Lan (-132, -54)
  if (Math.hypot(x - (-132), z - (-54)) < 21.5) return true;
  // Đỉnh đồi phẳng rộng lớn Đồi Gà & Bồ Câu DK2 (-142, -16)
  if (Math.hypot(x - (-148), z - (-16)) < 26.0) return true;
  // Tuyến đường mòn sinh thái DK2 (Dịch chuyển 22m theo hướng mũi tên)
  const trailWaypoints = [
    [-72, 0], [-75, -4], [-78, -9], [-82, -15], [-86, -22], [-90, -29],
    [-95, -37], [-98, -44], [-102, -52], [-106, -59], [-108, -62],
    [-112, -56], [-116, -51], [-121, -46], [-126, -41], [-131, -36], [-135, -30], [-140, -23],
    [-136, -22], [-142, -18], [-148, -15], [-154, -12], [-160, -8],
    [-133, -14], [-139, -10], [-146, -6], [-152, -3], [-158, -1]
  ];
  for (let i = 0; i < trailWaypoints.length; i++) {
    if (Math.hypot(x - trailWaypoints[i][0], z - trailWaypoints[i][1]) < 3.8) return true;
  }
  // Hành lang sườn đồi trước Ao Cá nối sang Đồi Hoa
  if (x >= -138 && x <= -108 && z >= -50 && z <= -30) return true;
  // Sườn đồi hoa phía trước Đồi mới
  if (x >= -162 && x <= -132 && z >= -24 && z <= 2) return true;
  // Tuyến đường & Cổng mới kết nối ĐT234 sang Nhà A (Cổng 1B đối diện Cổng DK2)
  if (x >= -8.0 && x <= 14.5 && z >= -10.0 && z <= 4.0) return true;

  // Lòng đường ĐT234 xuyên suốt đảo (chỉ trồng cây cảnh 2 bên vỉa hè)
  if (x > -14.5 && x < -5.5 && z > -198 && z < 99) return true;
  // Mương suối thác nước ra vách Tây (nối từ ao cá Z = -54)
  if (x >= -176 && x <= -130 && z >= -57.5 && z <= -50.5) return true;
  // Lòng sông sâu
  if (x > 86 && x < 94 && z > -105 && z < 65) return true;
  // Đồng cỏ chăn thả đàn cừu sinh thái
  if (Math.hypot(x - 108, z - (-45)) < 15.5) return true;
  // Hành lang an toàn đường ray tàu hỏa
  if (isNearRailwayTrack(x, z, 3.2)) return true;
  // Các cụm nhà dân ven đường ĐT234
  if (x >= 2 && x <= 14 && z >= 16 && z <= 62) return true;
  if (x >= -28 && x <= -16 && z >= 28 && z <= 58) return true;
  if (x >= 1 && x <= 12 && z >= -122 && z <= -108) return true;
  if (x >= -28 && x <= -15 && z >= -134 && z <= -120) return true;

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
  roundTrunkInst.castShadow = false; // Thân cây nằm dưới tán lá nên không cần render đổ bóng riêng

  const roundFoliageGeo = createPuffyCloudCanopyGeometry(1.55);
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
  autumnTrunkInst.castShadow = false;

  const autumnFoliageGeo = createPuffyCloudCanopyGeometry(1.45);
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
  bushInst.castShadow = false; // Bụi cây nhỏ không cần render shadow pass

  // --------------------------------------------------------------------------
  // 5. Tảng đá cuội & Bãi sỏi ven bờ (River Rocks & Hillside Boulders)
  // --------------------------------------------------------------------------
  const rockCount = fCfg.rockCount || 220;
  const rockGeo = new THREE.DodecahedronGeometry(0.75, 0);
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.9, flatShading: true });
  const rockInst = new THREE.InstancedMesh(rockGeo, rockMat, rockCount);
  rockInst.castShadow = false;

  // Áp dụng shader phủ tuyết tự nhiên lên ngọn và tán cây khi tuyết rơi
  applySnowShader(roundFoliageMat, 0.18, 0.96);
  applySnowShader(pineMat, 0.18, 0.96);
  applySnowShader(autumnFoliageMat, 0.18, 0.96);
  applySnowShader(bushMat, 0.18, 0.96);
  applySnowShader(rockMat, 0.25, 0.95);
  applySnowShader(roundTrunkMat, 0.45, 0.75);

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
  const earthPatchCount = 450;
  const earthGeo = new THREE.CylinderGeometry(1.6, 2.3, 0.25, 7);
  const earthMat = new THREE.MeshStandardMaterial({
    color: 0xffffff, // Hỗ trợ instance colors phong phú
    roughness: 0.95,
    flatShading: true,
  });
  const earthInst = new THREE.InstancedMesh(earthGeo, earthMat, earthPatchCount);
  earthInst.receiveShadow = true;
  let eaIdx = 0;
  const earthColors = [0x78350f, 0x854d0e, 0x6c3a16, 0x5c3d2e, 0x92400e, 0x9a5a22, 0x6b3f19];

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
      // Bỏ cây ở lối vào Cổng kết nối mới bên lề Đông ĐT234
      if (rx === -6.2 && z >= -31 && z <= -20) return;
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
    // Bỏ qua tuyệt đối toàn bộ đoạn cạnh Nhà B, Mái che xe và đường chạy thử (Z từ -78 đến -25)
    if (z >= -78 && z <= -25) continue;
    const x = 84.5 + (Math.random() - 0.5) * 0.4;
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
  // Phủ cây xanh sinh thái thoáng đãng (Giảm 30% cây ngoài khuôn viên DK1 & DK2 theo yêu cầu)
  const minX = -172, maxX = 122, stepX = 3.25;
  const minZ = -196, maxZ = 96, stepZ = 3.25;

  for (let gz = minZ; gz <= maxZ; gz += stepZ) {
    for (let gx = minX; gx <= maxX; gx += stepX) {
      // Dịch tọa độ ngẫu nhiên tự nhiên
      const x = gx + (Math.random() - 0.5) * 3.6;
      const z = gz + (Math.random() - 0.5) * 3.6;

      if (isForestExcludedZone(x, z)) continue;

      const elevation = getTerrainElevation(x, z);
      const nVal = forestNoise2D(x, z);

      // Lọc mật độ theo nhiễu:
      // Ở sườn đồi cao (elevation > 8), rừng phủ xanh tự nhiên
      // Ở đồng bằng thấp, tạo khoảng hở bãi cỏ đón nắng thoáng đãng
      if (elevation < 3.8 && nVal < 0.22) {
        // Có thể mọc bụi thấp hoặc hoa dại
        if (nVal > 0.08 && flIdx < flowerCount && Math.random() < 0.4) {
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
      if (isHighRidge || (nVal > 0.62 && !isNearRiver)) {
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
        } else if (rIdx < roundCount) {
          // Dự phòng cây tán tròn nếu thông/thu hết lượt
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
        } else if (pIdx < pineCount) {
          // Dự phòng cây thông phủ xanh nếu cây tròn hết lượt
          dummy.position.set(x, elevation, z);
          dummy.scale.set(scaleRand, scaleRand * (0.9 + Math.random() * 0.3), scaleRand);
          dummy.rotation.set(0, rotY, 0);
          dummy.updateMatrix();
          pineInst.setMatrixAt(pIdx, dummy.matrix);

          colObj.setHex(pineColors[pIdx % pineColors.length]);
          colObj.offsetHSL((Math.random() - 0.5) * 0.05, (Math.random() - 0.5) * 0.08, (Math.random() - 0.5) * 0.08);
          pineInst.setColorAt(pIdx, colObj);
          pIdx++;
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

      // Điểm xuyết mảng đất nâu ấm trên sườn đồi núi hoặc ven bờ mương nước
      if (eaIdx < earthPatchCount) {
        const isNearCanalPatch = Math.abs(x - 90) < 18;
        const isHillPatch = elevation > 2.8;
        const isRandomMeadow = nVal > 0.68 && !isForestExcludedZone(x, z);

        if ((isNearCanalPatch || isHillPatch || isRandomMeadow) && Math.random() < 0.28) {
          dummy.position.set(x, elevation + 0.08, z);
          dummy.scale.set(0.9 + Math.random() * 0.8, 0.4 + Math.random() * 0.35, 0.9 + Math.random() * 0.8);
          dummy.rotation.set((Math.random() - 0.5) * 0.25, Math.random() * Math.PI, (Math.random() - 0.5) * 0.25);
          dummy.updateMatrix();
          earthInst.setMatrixAt(eaIdx, dummy.matrix);

          colObj.setHex(earthColors[eaIdx % earthColors.length]);
          colObj.offsetHSL((Math.random() - 0.5) * 0.04, (Math.random() - 0.5) * 0.1, (Math.random() - 0.5) * 0.08);
          earthInst.setColorAt(eaIdx, colObj);
          eaIdx++;
        }
      }
    }
  }

  // Bổ sung các mảng đất nâu ẩm & thảm bùn phù sa tự nhiên dọc 2 bên mương nước (Canal Banks)
  for (let cz = -190; cz <= 90; cz += 4.5) {
    if (eaIdx >= earthPatchCount) break;
    [-1, 1].forEach((side) => {
      if (eaIdx >= earthPatchCount) return;
      const t = Math.max(0, Math.min(1, (cz - (-198)) / 296));
      const pt = canalCurve.getPointAt(t);
      const dist = 5.2 + Math.random() * 5.8; // Gần mép mương 5.2m - 11m
      const ex = pt.x + side * dist;
      const ez = cz + (Math.random() - 0.5) * 2.5;
      if (isForestExcludedZone(ex, ez)) return;
      const ey = getTerrainElevation(ex, ez);

      dummy.position.set(ex, Math.max(0.04, ey + 0.06), ez);
      dummy.scale.set(1.1 + Math.random() * 0.9, 0.4 + Math.random() * 0.3, 1.1 + Math.random() * 0.9);
      dummy.rotation.set((Math.random() - 0.5) * 0.12, Math.random() * Math.PI, (Math.random() - 0.5) * 0.12);
      dummy.updateMatrix();
      earthInst.setMatrixAt(eaIdx, dummy.matrix);

      // Tông màu bùn đất phù sa & đất sét nâu vàng ven sông mương
      colObj.setHex(earthColors[eaIdx % earthColors.length]);
      colObj.offsetHSL((Math.random() - 0.5) * 0.03, (Math.random() - 0.5) * 0.08, (Math.random() - 0.5) * 0.08);
      earthInst.setColorAt(eaIdx, colObj);
      eaIdx++;
    });
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
  if (earthInst.instanceColor) earthInst.instanceColor.needsUpdate = true;
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
    opacity: 0.24,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1.0,
    polygonOffsetUnits: -1.0,
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
    { x: -36.0, z: -10.0, w: 26.8, d: 20.8 },
    // Kho D2.1 (Đã dịch chuyển theo mũi tên)
    { x: -50.0, z: -46.0, w: 64.0, d: 15.0 },
  ];

  buildings.forEach((b) => {
    const geo = new THREE.PlaneGeometry(b.w, b.d);
    const m = new THREE.Mesh(geo, shadowMat);
    m.rotation.x = -Math.PI / 2;
    m.position.set(b.x, 0.03, b.z);
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
  createDetailedForklift(58.0, 0, -36.5, -Math.PI / 2, 'forklift1', 'Xe nâng điện Komatsu FB25 #01 (Xưởng B)', { isActiveCycle: true });

  // Xe nâng 2 túc trực bốc dỡ tại Cửa Kho Linh Kiện D2.1
  createDetailedForklift(-48.0, 0, -60.0, Math.PI / 2, 'forklift2', 'Xe nâng điện Komatsu FB25 #02 (Kho D2.1)', { isActiveCycle: false });

  // 2. Xe đầu kéo container 40ft DK Logistics đỗ tại bãi chờ logistics Cổng 1 (Vị trí bãi đỗ chuyên dụng an toàn)
  create40ftContainerTruck(71.0, 0, -4.0, -Math.PI / 2, 'containerHauler1', 'Xe đầu kéo container 40ft DK Logistics');

  // 3. Xe tải giao hàng nhanh 1.5 tấn DK Express tại sân DK2
  create1Point5TonDeliveryTruck(-32.0, 0, -40.0, Math.PI / 2, 'deliveryTruck1', 'Xe tải giao hàng nhanh 1.5T DK Express');

  // 4. Xe đẩy pallet thủy lực thủ công & nhân viên bốc hàng
  createHandPalletJack(63.2, 0, -30.0, -Math.PI / 3, 'palletJack1', 'Xe đẩy pallet thủy lực & Nhân viên kho');

  // 5. Đoàn xe kéo nhỏ chở linh kiện nội bộ phân khu DK2
  createTuggerCartTrain(-42.0, 0, -56.0, 0, 'tuggerTrain1', 'Đoàn xe kéo nhỏ nội bộ DK2');

  // 6. Kệ cantilever chữ A lưu trữ khung xe máy điện hàn sẵn (CKD/SKD)
  createUnassembledFrameRack(64.0, 0, -35.0, Math.PI / 2, 'frameRack1', 'Khu vực khung xe máy điện chờ lắp ráp (CKD/SKD)');
  createUnassembledFrameRack(-52.0, 0, -62.0, 0, 'frameRack2', 'Kệ khung xe đạp điện chưa lắp ráp Kho D2.1');

  // 7. Các chồng pallet gỗ & thùng carton phụ tùng xuất xưởng
  createPalletStack(64.5, 0, -31);
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

// 1. Xe máy điện DK Roma SX (Phong cách Ý thời thượng, thân bo tròn mềm mại khí động học)
function createDKRomaSX(colorHex = 0xdc2626, name = 'DK Roma SX', options = {}) {
  const bikeGroup = new THREE.Group();

  // Premium Automotive Materials
  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    metalness: 0.96,
    roughness: 0.08,
  });
  const paintMat = new THREE.MeshStandardMaterial({
    color: colorHex,
    roughness: 0.22,
    metalness: 0.25,
  });
  const darkTrimMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.65,
    metalness: 0.15,
  });
  const seatLeatherMat = new THREE.MeshStandardMaterial({
    color: 0x78350f, // Da bò caramel cao cấp
    roughness: 0.6,
  });
  const seatAccentMat = new THREE.MeshStandardMaterial({
    color: 0x451a03, // Da sẫm viền trang trí
    roughness: 0.7,
  });
  const rubberMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.92,
  });
  const goldLogoMat = new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    metalness: 0.9,
    roughness: 0.15,
  });
  const brakeRedMat = new THREE.MeshStandardMaterial({
    color: 0xdc2626,
    roughness: 0.3,
    metalness: 0.4,
  });
  const headlampGlassMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
  });
  const haloDrlMat = new THREE.MeshBasicMaterial({
    color: 0x7dd3fc, // LED viền Angel Eyes xanh băng siêu sáng
  });
  const tailLightMat = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    emissive: 0xef4444,
    emissiveIntensity: 0.85,
  });

  // 1. THÂN XE BO TRÒN KHÍ ĐỘNG HỌC (Aerodynamic Italian Monocoque Body)
  // Thân xe giữa thon thả dạng trụ elip nằm ngang (thay thế khối hộp chữ nhật thô)
  const spineGeo = new THREE.CylinderGeometry(0.24, 0.28, 0.72, 16);
  const mainSpine = new THREE.Mesh(spineGeo, paintMat);
  mainSpine.rotation.z = Math.PI / 2;
  mainSpine.position.set(-0.15, 0.48, 0);
  mainSpine.scale.set(1.0, 1.0, 0.78);
  mainSpine.castShadow = true;
  bikeGroup.add(mainSpine);

  // 2 Bụng xe bo tròn hình giọt nước đặc trưng Vespa / Roma SX (Signature Teardrop Cowls)
  [-0.14, 0.14].forEach((sideZ) => {
    const cowlGeo = new THREE.SphereGeometry(0.26, 16, 12);
    const sideCowl = new THREE.Mesh(cowlGeo, paintMat);
    sideCowl.position.set(-0.25, 0.46, sideZ);
    sideCowl.scale.set(1.45, 0.82, 0.52);
    sideCowl.castShadow = true;
    bikeGroup.add(sideCowl);

    // Nẹp hông mạ crom uốn lượn sắc sảo (Chrome Side Trim Spear)
    const spearGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.54, 8);
    const spear = new THREE.Mesh(spearGeo, chromeMat);
    spear.rotation.z = Math.PI / 2.05;
    spear.position.set(-0.24, 0.46, sideZ * 1.35);
    bikeGroup.add(spear);

    // Khe gió làm mát động cơ mạ crom bên hông
    for (let sl = -0.06; sl <= 0.06; sl += 0.04) {
      const vent = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.012, 0.02), darkTrimMat);
      vent.rotation.z = -Math.PI / 8;
      vent.position.set(-0.16 + sl * 0.4, 0.42 + sl, sideZ * 1.36);
      bikeGroup.add(vent);
    }
  });

  // Đuôi xe vuốt nhọn khí động học (Smooth Tapered Tail)
  const tailGeo = new THREE.ConeGeometry(0.22, 0.45, 16);
  const tail = new THREE.Mesh(tailGeo, paintMat);
  tail.rotation.z = Math.PI / 2;
  tail.position.set(-0.72, 0.48, 0);
  tail.scale.set(1.0, 1.0, 0.72);
  tail.castShadow = true;
  bikeGroup.add(tail);

  // Đèn hậu LED 3D phong cách kim cương & dải viền mạ crom
  const tailLight = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.06, 0.08, 12), tailLightMat);
  tailLight.rotation.z = Math.PI / 2;
  tailLight.position.set(-0.92, 0.52, 0);
  bikeGroup.add(tailLight);

  const tailChromeBezel = new THREE.Mesh(new THREE.TorusGeometry(0.082, 0.012, 6, 16), chromeMat);
  tailChromeBezel.rotation.y = Math.PI / 2;
  tailChromeBezel.position.set(-0.91, 0.52, 0);
  bikeGroup.add(tailChromeBezel);

  // Tay nắm dắt sau dạng ống mạ crom uốn cong thể thao (Passenger Grab Rail)
  const grabRail = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.016, 8, 20, Math.PI), chromeMat);
  grabRail.rotation.y = Math.PI / 2;
  grabRail.rotation.x = -Math.PI / 16;
  grabRail.position.set(-0.62, 0.75, 0);
  bikeGroup.add(grabRail);

  // Giá đỡ biển số & tấm chắn bùn sau (Rear Plate Bracket & Fender Extender)
  const plateBracket = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.16, 0.22), darkTrimMat);
  plateBracket.position.set(-0.88, 0.36, 0);
  plateBracket.rotation.z = Math.PI / 12;
  bikeGroup.add(plateBracket);

  const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.12), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  plate.rotation.y = -Math.PI / 2;
  plate.position.set(-0.902, 0.36, 0);
  bikeGroup.add(plate);

  // 2. YÊN XE ĐÔI MAY CHỈ CÔNG THÁI HỌC (Sculpted Ergonomic Leather Saddle)
  const saddleGroup = new THREE.Group();
  saddleGroup.position.set(-0.20, 0.68, 0);

  // Đệm yên chính vuốt thon về trước cho người lái, nâng cao tựa lưng cho người ngồi sau
  const seatFront = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.18, 0.38, 12), seatLeatherMat);
  seatFront.rotation.z = Math.PI / 2;
  seatFront.position.set(0.12, 0.05, 0);
  seatFront.scale.set(0.7, 1.0, 0.85);
  saddleGroup.add(seatFront);

  const seatRear = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.19, 0.38, 12), seatLeatherMat);
  seatRear.rotation.z = Math.PI / 2;
  seatRear.position.set(-0.18, 0.08, 0);
  seatRear.scale.set(0.85, 1.0, 0.95);
  saddleGroup.add(seatRear);

  // Đai trang trí bọc da chia đôi yên (Middle Trim Strap)
  const seatStrap = new THREE.Mesh(new THREE.CylinderGeometry(0.185, 0.185, 0.04, 12), seatAccentMat);
  seatStrap.rotation.z = Math.PI / 2;
  seatStrap.position.set(-0.02, 0.07, 0);
  seatStrap.scale.set(0.8, 1.0, 0.92);
  saddleGroup.add(seatStrap);

  saddleGroup.castShadow = true;
  bikeGroup.add(saddleGroup);

  // 3. SÀN ĐỂ CHÂN THOẢI MÁI VỚI GỜ CAO SU CHỐNG TRƯỢT (Footboard & Battery Floor)
  const footboard = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.26, 0.56, 12), darkTrimMat);
  footboard.rotation.z = Math.PI / 2;
  footboard.position.set(0.16, 0.28, 0);
  footboard.scale.set(0.45, 1.0, 0.88);
  footboard.receiveShadow = true;
  bikeGroup.add(footboard);

  // Gờ cao su chống trượt trên mặt sàn 2 bên
  [-0.14, -0.07, 0.07, 0.14].forEach((rz) => {
    const rubberStrip = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.015, 0.022), rubberMat);
    rubberStrip.position.set(0.16, 0.335, rz);
    bikeGroup.add(rubberStrip);
  });

  // 4. YẾM TRƯỚC VUỐT CONG KHÍ ĐỘNG HỌC & CÀ VẠT MẠ CROM (Sculpted Front Apron & Chrome Necktie)
  const apronGroup = new THREE.Group();
  apronGroup.position.set(0.48, 0.58, 0);

  // Yếm trước uốn cong khí động học ôm gió (Curved Apron Shield)
  const apronGeo = new THREE.CylinderGeometry(0.32, 0.36, 0.62, 16, 1, false, -Math.PI / 2.5, Math.PI / 1.25);
  const apronMesh = new THREE.Mesh(apronGeo, paintMat);
  apronMesh.rotation.y = Math.PI / 2;
  apronMesh.rotation.z = -Math.PI / 16;
  apronMesh.castShadow = true;
  apronGroup.add(apronMesh);

  // Viền mạ crom bao quanh mép yếm xe (Chrome Beading Trim)
  const apronTrim = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.01, 8, 20, Math.PI / 1.3), chromeMat);
  apronTrim.rotation.y = Math.PI / 2;
  apronTrim.rotation.z = -Math.PI / 14;
  apronTrim.position.set(0.04, 0.02, 0);
  apronGroup.add(apronTrim);

  // Cà vạt trước mạ crom phong cách Ý (Vespa-style Chrome Center Necktie)
  const necktie = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.34, 0.09), chromeMat);
  necktie.rotation.z = -Math.PI / 16;
  necktie.position.set(0.14, 0.04, 0);
  apronGroup.add(necktie);

  // Khe tản nhiệt 3 nan trên cà vạt
  for (let k = -0.06; k <= 0.06; k += 0.05) {
    const slat = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.01, 0.06), darkTrimMat);
    slat.rotation.z = -Math.PI / 16;
    slat.position.set(0.142, 0.01 + k, 0);
    apronGroup.add(slat);
  }

  // Huy hiệu logo mạ vàng DK Bike 3D ở đỉnh cà vạt
  const logoBadge = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, 0.07), goldLogoMat);
  logoBadge.rotation.z = -Math.PI / 16;
  logoBadge.position.set(0.142, 0.14, 0);
  apronGroup.add(logoBadge);

  // Dải LED định vị ban ngày DRL hai bên yếm (Daytime Running Lights)
  [-0.18, 0.18].forEach((dz) => {
    const drl = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.16, 0.02), haloDrlMat);
    drl.rotation.z = -Math.PI / 14;
    drl.position.set(0.08, 0.04, dz);
    apronGroup.add(drl);
  });

  bikeGroup.add(apronGroup);

  // 5. CHẮN BÙN TRƯỚC ÔM CUA THEO BÁNH XE (Curved Front Mudguard with Chrome Crest)
  const fenderGroup = new THREE.Group();
  fenderGroup.position.set(0.64, 0.34, 0);

  const fenderGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.16, 16, 1, false, -Math.PI * 0.4, Math.PI * 0.85);
  const fender = new THREE.Mesh(fenderGeo, paintMat);
  fender.rotation.x = Math.PI / 2;
  fender.rotation.y = -Math.PI / 14;
  fender.castShadow = true;
  fenderGroup.add(fender);

  // Mào chắn bùn mạ crom vuốt nhọn phía trên (Chrome Fender Fin Crest)
  const crest = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.12, 6), chromeMat);
  crest.rotation.z = Math.PI / 2;
  crest.position.set(0.02, 0.22, 0);
  fenderGroup.add(crest);

  bikeGroup.add(fenderGroup);

  // 6. CỤM TAY LÁI, ĐẦU ĐÈN KIM CƯƠNG & ĐỒNG HỒ ĐIỆN TỬ (Cockpit & Diamond Headlight)
  const forkGroup = new THREE.Group();
  forkGroup.position.set(0.48, 0.86, 0);

  // Ốp đầu đèn xe tròn mềm mại cùng màu thân xe (Handlebar Nacelle / Fairing)
  const cowlGeo = new THREE.CylinderGeometry(0.14, 0.16, 0.44, 14);
  const handleCowl = new THREE.Mesh(cowlGeo, paintMat);
  handleCowl.rotation.x = Math.PI / 2;
  handleCowl.position.set(0.02, 0.12, 0);
  forkGroup.add(handleCowl);

  // Viền mạ crom bao quanh đèn pha (Chrome Headlight Bezel)
  const lampRim = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.016, 8, 20), chromeMat);
  lampRim.rotation.y = Math.PI / 2;
  lampRim.position.set(0.12, 0.12, 0);
  forkGroup.add(lampRim);

  // Vòng tròn LED Angel Eyes (Daytime Running Light Ring)
  const angelEye = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.008, 6, 20), haloDrlMat);
  angelEye.rotation.y = Math.PI / 2;
  angelEye.position.set(0.125, 0.12, 0);
  forkGroup.add(angelEye);

  // Bi-LED Projector Lens kim cương
  const projectorLens = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 12), headlampGlassMat);
  projectorLens.position.set(0.11, 0.12, 0);
  projectorLens.scale.set(0.5, 1.0, 1.0);
  forkGroup.add(projectorLens);

  // Màn hình đồng hồ LCD kỹ thuật số đối diện người lái (Digital Instrument Display)
  const dashScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 0.08), new THREE.MeshBasicMaterial({ color: 0x0284c7 }));
  dashScreen.rotation.y = -Math.PI / 2;
  dashScreen.rotation.x = -Math.PI / 4;
  dashScreen.position.set(-0.08, 0.16, 0);
  forkGroup.add(dashScreen);

  // Ghi-đông ngang mạ crom & tay nắm cao su (Handlebars & Grips)
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.62, 8), chromeMat);
  bar.rotation.x = Math.PI / 2;
  bar.position.set(-0.02, 0.13, 0);
  forkGroup.add(bar);

  // Tay nắm cao su và đầu gù chống rung 2 bên (Grips & Bar-ends)
  [-0.26, 0.26].forEach((gz) => {
    const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.11, 8), rubberMat);
    grip.rotation.x = Math.PI / 2;
    grip.position.set(-0.02, 0.13, gz);
    forkGroup.add(grip);

    const barend = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.025, 8), chromeMat);
    barend.rotation.x = Math.PI / 2;
    barend.position.set(-0.02, 0.13, gz + (gz > 0 ? 0.065 : -0.065));
    forkGroup.add(barend);

    // Tay phanh nhôm đúc sáng bóng (Aluminum Brake Levers)
    const lever = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.012, 0.08), chromeMat);
    lever.position.set(0.03, 0.12, gz * 0.85);
    forkGroup.add(lever);

    // Gương chiếu hậu hình tròn mạ crom thanh lịch (Chrome Oval Mirrors)
    const stemM = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.18, 6), chromeMat);
    stemM.rotation.z = Math.PI / 10;
    stemM.position.set(-0.02, 0.22, gz);
    forkGroup.add(stemM);

    const mirrorHousing = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.018, 12), chromeMat);
    mirrorHousing.rotation.z = Math.PI / 3;
    mirrorHousing.position.set(-0.05, 0.31, gz);
    forkGroup.add(mirrorHousing);

    const mirrorGlass = new THREE.Mesh(new THREE.CircleGeometry(0.054, 12), new THREE.MeshBasicMaterial({ color: 0x93c5fd }));
    mirrorGlass.rotation.y = (gz > 0 ? -1 : 1) * Math.PI / 12 - Math.PI / 2;
    mirrorGlass.rotation.z = Math.PI / 3;
    mirrorGlass.position.set(-0.058, 0.31, gz);
    forkGroup.add(mirrorGlass);
  });

  bikeGroup.add(forkGroup);

  // 7. HỆ THỐNG PHUỘC TRƯỚC, PHANH ĐĨA & GIẢM XÓC (Suspension & Disc Brakes)
  // Phuộc nhún trước thuỷ lực đôi mạ crom (Telescopic Hydraulic Front Forks)
  [-0.07, 0.07].forEach((fz) => {
    const forkTube = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.42, 8), chromeMat);
    forkTube.rotation.z = Math.PI / 16;
    forkTube.position.set(0.58, 0.46, fz);
    bikeGroup.add(forkTube);

    // Ốp cao su chống bụi chân phuộc (Rubber Fork Boots)
    const forkBoot = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.14, 8), darkTrimMat);
    forkBoot.rotation.z = Math.PI / 16;
    forkBoot.position.set(0.61, 0.34, fz);
    bikeGroup.add(forkBoot);
  });

  // Đĩa phanh trước thép không gỉ đục lỗ tản nhiệt (Drilled Disc Brake Rotor)
  const brakeDisc = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.012, 16), chromeMat);
  brakeDisc.rotation.x = Math.PI / 2;
  brakeDisc.position.set(0.65, 0.26, 0.06);
  bikeGroup.add(brakeDisc);

  // Cùm phanh đĩa màu đỏ thể thao nổi bật (Sport Red Caliper)
  const brakeCaliper = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.04), brakeRedMat);
  brakeCaliper.position.set(0.60, 0.31, 0.07);
  bikeGroup.add(brakeCaliper);

  // Giảm xóc lò xo đôi màu đỏ thể thao phía sau (Dual Rear Shock Absorbers)
  [-0.13, 0.13].forEach((rz) => {
    const shockBody = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.32, 6), chromeMat);
    shockBody.rotation.z = -Math.PI / 12;
    shockBody.position.set(-0.48, 0.36, rz);
    bikeGroup.add(shockBody);

    const shockSpring = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.22, 8), brakeRedMat);
    shockSpring.rotation.z = -Math.PI / 12;
    shockSpring.position.set(-0.48, 0.36, rz);
    bikeGroup.add(shockSpring);
  });

  // Vệt sáng đèn pha ban đêm (Soft spotlight projected ahead on ground)
  const headlightSpot = new THREE.SpotLight(0xfffbeb, 0.0, 16, Math.PI / 5, 0.4);
  headlightSpot.position.set(0.7, 0.9, 0);
  headlightSpot.target.position.set(7.0, 0, 0);
  bikeGroup.add(headlightSpot);
  bikeGroup.add(headlightSpot.target);
  vehicleHeadlights.push(headlightSpot);

  // 8. BÁNH XE THỂ THAO VÀNH ĐÚC PHAY XƯỚC 5 CHẤU KÉP (Diamond-Cut Alloy Wheels)
  const makeWheel = (wx, isFront = false) => {
    const wGroup = new THREE.Group();
    wGroup.position.set(wx, 0.26, 0);

    // Lốp không săm cao cấp tiết diện cong tròn mượt mà (Tubeless Tire)
    const tire = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.068, 12, 24), rubberMat);
    tire.castShadow = true;
    wGroup.add(tire);

    // Vành đúc mạ crom phay bóng (Alloy Rim)
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.185, 0.185, 0.082, 16), chromeMat);
    rim.rotation.x = Math.PI / 2;
    wGroup.add(rim);

    // Moay-ơ trục giữa & ốp động cơ điện
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.11, 12), darkTrimMat);
    hub.rotation.x = Math.PI / 2;
    wGroup.add(hub);

    // 5 Chấu kép vành đúc phay xước thể thao (Sport Diamond-Cut 5-Double Spokes)
    for (let i = 0; i < 5; i++) {
      const spokeAngle = (i * Math.PI * 2) / 5;
      [-0.015, 0.015].forEach((offset) => {
        const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.016, 0.018), chromeMat);
        spoke.position.set(Math.cos(spokeAngle + offset) * 0.11, Math.sin(spokeAngle + offset) * 0.11, 0);
        spoke.rotation.z = spokeAngle + offset;
        wGroup.add(spoke);
      });
    }

    return wGroup;
  };

  const frontWheel = makeWheel(0.65, true);
  bikeGroup.add(frontWheel);

  const rearWheel = makeWheel(-0.62, false);
  bikeGroup.add(rearWheel);

  // Chân chống nghiêng (Kickstand)
  if (!options.withRider) {
    const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.32, 6), chromeMat);
    stand.rotation.x = Math.PI / 6;
    stand.rotation.z = -Math.PI / 12;
    stand.position.set(-0.2, 0.12, 0.16);
    bikeGroup.add(stand);
  }

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

// 2. Xe máy điện DK Gogo & DK Nova (Phong cách thời thượng, bo tròn tinh tế)
function createDKGogo(colorHex = 0x0284c7, name = 'DK Gogo', options = {}) {
  const bikeGroup = new THREE.Group();
  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.95, roughness: 0.1 });
  const paintMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.24, metalness: 0.2 });
  const creamMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.35 }); // Kem vani cổ điển
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.75 });
  const seatMat = new THREE.MeshStandardMaterial({ color: 0x3f3f46, roughness: 0.8 }); // Da đen khâu vân ngang retro
  const rubberMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.92 });
  const amberMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xf59e0b, emissiveIntensity: 0.7 });

  // 1. Thân xe cổ điển bo tròn mềm mại (Vintage Rounded Body)
  const spineGeo = new THREE.CylinderGeometry(0.24, 0.26, 0.74, 16);
  const mainSpine = new THREE.Mesh(spineGeo, paintMat);
  mainSpine.rotation.z = Math.PI / 2;
  mainSpine.position.set(-0.16, 0.48, 0);
  mainSpine.scale.set(0.95, 1.0, 0.76);
  mainSpine.castShadow = true;
  bikeGroup.add(mainSpine);

  // 2 Bụng hông phối màu kem cổ điển bo tròn (Vintage Two-tone Rounded Cowls)
  [-0.14, 0.14].forEach((sz) => {
    const cowl = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 12), creamMat);
    cowl.position.set(-0.24, 0.46, sz);
    cowl.scale.set(1.4, 0.82, 0.52);
    cowl.castShadow = true;
    bikeGroup.add(cowl);

    // Nẹp chỉ hông mạ crom cổ điển
    const trim = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.52, 8), chromeMat);
    trim.rotation.z = Math.PI / 2;
    trim.position.set(-0.24, 0.46, sz * 1.34);
    bikeGroup.add(trim);
  });

  // Đuôi xe vuốt tròn
  const tail = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 12), paintMat);
  tail.position.set(-0.62, 0.48, 0);
  tail.scale.set(1.2, 0.9, 0.72);
  tail.castShadow = true;
  bikeGroup.add(tail);

  // Đèn hậu tròn cổ điển viền crom
  const tailLamp = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.07, 0.06, 12),
    new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 0.85 })
  );
  tailLamp.rotation.z = Math.PI / 2;
  tailLamp.position.set(-0.84, 0.50, 0);
  bikeGroup.add(tailLamp);

  const tailBezel = new THREE.Mesh(new THREE.TorusGeometry(0.072, 0.01, 6, 16), chromeMat);
  tailBezel.rotation.y = Math.PI / 2;
  tailBezel.position.set(-0.83, 0.50, 0);
  bikeGroup.add(tailBezel);

  // 2. Yên xe liền khối phong cách hoài cổ (Vintage Tuck-and-Roll Ribbed Saddle)
  const saddle = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.18, 0.68, 14), seatMat);
  saddle.rotation.z = Math.PI / 2;
  saddle.position.set(-0.18, 0.72, 0);
  saddle.scale.set(0.65, 1.0, 0.9);
  saddle.castShadow = true;
  bikeGroup.add(saddle);

  // Vân khâu ngang trên yên xe (Ribbed stitching)
  for (let rib = -0.22; rib <= 0.22; rib += 0.07) {
    const ribLine = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.02, 0.32), darkMat);
    ribLine.position.set(-0.18 + rib, 0.77, 0);
    bikeGroup.add(ribLine);
  }

  // Giá chở hàng sau bằng ống inox mạ crom (Vintage Tubular Chrome Luggage Rack)
  const rack = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.024, 0.28), chromeMat);
  rack.position.set(-0.65, 0.76, 0);
  bikeGroup.add(rack);

  const rackRail = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.012, 6, 16, Math.PI), chromeMat);
  rackRail.rotation.y = Math.PI / 2;
  rackRail.position.set(-0.68, 0.80, 0);
  bikeGroup.add(rackRail);

  // 3. Sàn để chân phẳng cổ điển
  const footboard = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.26, 0.54, 12), darkMat);
  footboard.rotation.z = Math.PI / 2;
  footboard.position.set(0.16, 0.28, 0);
  footboard.scale.set(0.45, 1.0, 0.88);
  bikeGroup.add(footboard);

  // 4. Yếm trước bo cong cổ điển & Lưới tản nhiệt crom (Curved Vintage Apron)
  const apronGeo = new THREE.CylinderGeometry(0.32, 0.35, 0.64, 16, 1, false, -Math.PI / 2.5, Math.PI / 1.25);
  const apron = new THREE.Mesh(apronGeo, paintMat);
  apron.rotation.y = Math.PI / 2;
  apron.rotation.z = -Math.PI / 16;
  apron.position.set(0.48, 0.58, 0);
  apron.castShadow = true;
  bikeGroup.add(apron);

  // Lưới tản nhiệt crom cổ điển ở mặt nạ trước (Vintage Chrome Grille)
  const grille = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.22, 0.16), chromeMat);
  grille.position.set(0.62, 0.62, 0);
  bikeGroup.add(grille);

  // 2 Đèn xi-nhan tròn màu hổ phách phía trước (Amber Turn Indicators)
  [-0.18, 0.18].forEach((az) => {
    const ind = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.04, 10), amberMat);
    ind.rotation.z = Math.PI / 2;
    ind.position.set(0.56, 0.60, az);
    bikeGroup.add(ind);
  });

  // Chắn bùn trước ôm bánh xe
  const fender = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.28, 0.16, 16, 1, false, -Math.PI * 0.4, Math.PI * 0.85),
    paintMat
  );
  fender.rotation.x = Math.PI / 2;
  fender.rotation.y = -Math.PI / 14;
  fender.position.set(0.64, 0.34, 0);
  fender.castShadow = true;
  bikeGroup.add(fender);

  // 5. Cụm đầu đèn vuông cổ điển có mí đèn crom (Retro Square Headlamp with Visor)
  const forkGroup = new THREE.Group();
  forkGroup.position.set(0.48, 0.86, 0);

  const headlampHousing = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.17, 0.20), paintMat);
  headlampHousing.position.set(0.04, 0.14, 0);
  forkGroup.add(headlampHousing);

  const headlampGlass = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 0.13), new THREE.MeshBasicMaterial({ color: 0xfffbeb }));
  headlampGlass.rotation.y = Math.PI / 2;
  headlampGlass.position.set(0.122, 0.14, 0);
  forkGroup.add(headlampGlass);

  // Mí đèn crom che nắng cổ điển (Chrome Peak Visor)
  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.015, 0.21), chromeMat);
  visor.position.set(0.10, 0.21, 0);
  forkGroup.add(visor);

  // Ghi-đông ngang mạ crom
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.64, 8), chromeMat);
  bar.rotation.x = Math.PI / 2;
  bar.position.set(0.0, 0.14, 0);
  forkGroup.add(bar);

  // Gương chiếu hậu tròn crom
  [-0.26, 0.26].forEach((mz) => {
    const stemM = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.18, 6), chromeMat);
    stemM.rotation.z = Math.PI / 10;
    stemM.position.set(-0.02, 0.22, mz);
    forkGroup.add(stemM);

    const mirror = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.018, 12), chromeMat);
    mirror.rotation.z = Math.PI / 3;
    mirror.position.set(-0.05, 0.31, mz);
    forkGroup.add(mirror);
  });

  bikeGroup.add(forkGroup);

  // Đèn pha ban đêm
  const headlightSpot = new THREE.SpotLight(0xfffbeb, 0.0, 16, Math.PI / 5, 0.4);
  headlightSpot.position.set(0.7, 0.9, 0);
  headlightSpot.target.position.set(7.0, 0, 0);
  bikeGroup.add(headlightSpot);
  bikeGroup.add(headlightSpot.target);
  vehicleHeadlights.push(headlightSpot);

  // 6. Bánh xe cổ điển mạ crom (Vintage Alloy Wheels)
  const makeGogoWheel = (wx) => {
    const wGroup = new THREE.Group();
    wGroup.position.set(wx, 0.26, 0);

    const tire = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.065, 12, 24), rubberMat);
    tire.castShadow = true;
    wGroup.add(tire);

    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.075, 16), chromeMat);
    rim.rotation.x = Math.PI / 2;
    wGroup.add(rim);

    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.11, 10), darkMat);
    hub.rotation.x = Math.PI / 2;
    wGroup.add(hub);

    for (let i = 0; i < 6; i++) {
      const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.33, 0.016, 0.016), chromeMat);
      spoke.rotation.z = (i * Math.PI) / 6;
      wGroup.add(spoke);
    }

    return wGroup;
  };

  const wFront = makeGogoWheel(0.65);
  bikeGroup.add(wFront);

  const wRear = makeGogoWheel(-0.62);
  bikeGroup.add(wRear);

  // Chân chống nghiêng khi đỗ
  if (!options.withRider) {
    const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.32, 6), chromeMat);
    stand.rotation.x = Math.PI / 6;
    stand.rotation.z = -Math.PI / 12;
    stand.position.set(-0.2, 0.12, 0.16);
    bikeGroup.add(stand);
  }

  // Người lái tùy chọn
  let riderGroup = null;
  if (options.withRider) {
    riderGroup = createCharacter({
      shirtColor: options.riderShirt || 0xea580c,
      pantsColor: options.riderPants || 0x1e293b,
      hatType: 'helmet',
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
    desc: 'Mẫu xe máy điện DK Gogo / DK Nova thời trang hiện đại của DK Bike, trang bị động cơ chống nước IP67, màn hình LED sắc nét, khóa Smartkey thông minh và vận hành êm ái.',
    frontWheel: wFront,
    rearWheel: wRear,
    forkGroup,
    riderGroup,
    headlightSpot,
  };

  return bikeGroup;
}

// Alias hỗ trợ cả DK Nova và tương thích ngược createDKCreerE
function createDKNova(colorHex = 0x0284c7, name = 'DK Nova', options = {}) {
  return createDKGogo(colorHex, name, options);
}
const createDKCreerE = createDKGogo;

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
  const bicycleWheels = [];
  [-0.55, 0.55].forEach((wx) => {
    const wGroup = new THREE.Group();
    wGroup.position.set(wx, 0.34, 0);

    const tire = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.035, 6, 20), darkMat);
    tire.castShadow = true;
    wGroup.add(tire);

    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.29, 0.015, 6, 20), frameMat);
    wGroup.add(rim);

    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.08, 8), darkMat);
    hub.rotation.x = Math.PI / 2;
    wGroup.add(hub);

    for (let s = 0; s < 4; s++) {
      const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.008, 0.008), frameMat);
      spoke.rotation.z = (s * Math.PI) / 4;
      wGroup.add(spoke);
    }

    bike.add(wGroup);
    bicycleWheels.push(wGroup);
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
    wheels: bicycleWheels,
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

// ============================================================================
// CỔNG & ĐƯỜNG KẾT NỐI MỚI (CONNECTING GATE 1B & ROAD ĐT234 <-> NHÀ A)
// Vị trí: Đối diện Cổng DK2 qua vạch người đi bộ ĐT234
// ============================================================================
function buildConnectingGateAndRoad() {
  const group = new THREE.Group();

  const roadMat = new THREE.MeshStandardMaterial({
    color: CONFIG.ROADS ? CONFIG.ROADS.roadColor : 0x334155,
    roughness: 0.78,
    polygonOffset: true,
    polygonOffsetFactor: -1.0,
    polygonOffsetUnits: -1.0,
  });
  const curbMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.85 });
  const sidewalkMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.9 });
  const pylonMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.3 });
  const archMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.35, metalness: 0.2 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.2, metalness: 0.85 });
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 });
  const yellowPaintMat = new THREE.MeshBasicMaterial({
    color: 0xffcc00,
    polygonOffset: true,
    polygonOffsetFactor: -2.0,
    polygonOffsetUnits: -2.0,
  });
  const whitePaintMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    polygonOffset: true,
    polygonOffsetFactor: -2.0,
    polygonOffsetUnits: -2.0,
  });

  // --------------------------------------------------------------------------
  // 1. TUYẾN ĐƯỜNG NHỰA KẾT NỐI (Connecting Asphalt Road: x = -6.5 -> 13.0, z = -25.5)
  // --------------------------------------------------------------------------
  const roadWidth = 6.8;
  const roadLength = 19.5;
  const roadCenterX = 3.25;
  const roadCenterZ = -25.5;

  const roadMesh = new THREE.Mesh(new THREE.PlaneGeometry(roadLength, roadWidth), roadMat);
  roadMesh.rotation.x = -Math.PI / 2;
  roadMesh.position.set(roadCenterX, 0.05, roadCenterZ);
  roadMesh.receiveShadow = true;
  group.add(roadMesh);

  // Vạch tim đường màu vàng đứt đoạn (Yellow Centerline)
  for (let sx = -7.5; sx <= 7.5; sx += 3.2) {
    const dash = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.22), yellowPaintMat);
    dash.rotation.x = -Math.PI / 2;
    dash.position.set(roadCenterX + sx, 0.08, roadCenterZ);
    group.add(dash);
  }

  // Vạch sơn trắng liền mép đường 2 bên (White Edge Lines)
  [-roadWidth / 2 + 0.3, roadWidth / 2 - 0.3].forEach((oz) => {
    const edgeLine = new THREE.Mesh(new THREE.PlaneGeometry(roadLength, 0.18), whitePaintMat);
    edgeLine.rotation.x = -Math.PI / 2;
    edgeLine.position.set(roadCenterX, 0.08, roadCenterZ + oz);
    group.add(edgeLine);
  });

  // Vạch dừng xe (Stop Line) trước ngã ba nhập vào ĐT234
  const stopLine = new THREE.Mesh(new THREE.PlaneGeometry(0.45, roadWidth - 1.2), whitePaintMat);
  stopLine.rotation.x = -Math.PI / 2;
  stopLine.position.set(-5.5, 0.08, roadCenterZ);
  group.add(stopLine);

  // Vỉa hè đi bộ có bó vỉa bê tông 2 bên đường (North & South Sidewalks)
  [-1, 1].forEach((dir) => {
    const sz = roadCenterZ + dir * (roadWidth / 2 + 1.1);

    // Mặt vỉa hè lát gạch
    const walk = new THREE.Mesh(new THREE.BoxGeometry(roadLength, 0.15, 2.0), sidewalkMat);
    walk.position.set(roadCenterX, 0.075, sz);
    walk.receiveShadow = true;
    group.add(walk);

    // Bó vỉa bê tông
    const curb = new THREE.Mesh(new THREE.BoxGeometry(roadLength, 0.22, 0.22), curbMat);
    curb.position.set(roadCenterX, 0.11, roadCenterZ + dir * (roadWidth / 2 + 0.11));
    group.add(curb);

    // Bồn cỏ & hoa thấp viền vỉa hè
    const lawn = new THREE.Mesh(
      new THREE.PlaneGeometry(roadLength - 2.0, 1.2),
      new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.9 })
    );
    lawn.rotation.x = -Math.PI / 2;
    lawn.position.set(roadCenterX, 0.16, sz + dir * 0.4);
    group.add(lawn);

    // Khóm hoa cảnh dọc vỉa hè
    const flowerColors = [0xfacc15, 0xef4444, 0xf472b6, 0xffffff];
    for (let fx = -6.0; fx <= 6.0; fx += 2.2) {
      const flower = new THREE.Mesh(
        new THREE.SphereGeometry(0.14, 5, 4),
        new THREE.MeshStandardMaterial({ color: flowerColors[Math.floor(Math.random() * flowerColors.length)], roughness: 0.7 })
      );
      flower.position.set(roadCenterX + fx, 0.26, sz + dir * 0.4);
      group.add(flower);
    }
  });

  // Bó vỉa cong lượn góc ngã ba vuốt vào ĐT234 (Corner Curb Radii)
  [-1, 1].forEach((dir) => {
    const cornerCurb = new THREE.Mesh(
      new THREE.CylinderGeometry(2.4, 2.4, 0.22, 8, 1, false, 0, Math.PI / 2),
      curbMat
    );
    cornerCurb.position.set(-6.2, 0.11, roadCenterZ + dir * (roadWidth / 2 + 2.4));
    cornerCurb.rotation.y = dir === 1 ? 0 : -Math.PI / 2;
    group.add(cornerCurb);
  });

  // --------------------------------------------------------------------------
  // 2. CỔNG KẾT NỐI CHÍNH (ARCH & PYLONS GATE 1B AT x = -6.0)
  // --------------------------------------------------------------------------
  const gateGroup = new THREE.Group();
  gateGroup.position.set(-6.0, 0, roadCenterZ);

  // 2 Trụ cổng granite vững chãi hai bên (North & South Gate Pillars)
  const pillarGeo = new THREE.BoxGeometry(1.2, 4.4, 1.2);
  const pillarCapGeo = new THREE.ConeGeometry(0.9, 0.45, 4);

  [-1, 1].forEach((dir) => {
    const pz = dir * (roadWidth / 2 + 0.65);

    // Thân trụ ốp đá granite xám đen cao cấp
    const pillar = new THREE.Mesh(pillarGeo, pylonMat);
    pillar.position.set(0, 2.2, pz);
    pillar.castShadow = true;
    gateGroup.add(pillar);

    // Chóp kim tự tháp inox
    const cap = new THREE.Mesh(pillarCapGeo, whiteMat);
    cap.rotation.y = Math.PI / 4;
    cap.position.set(0, 4.62, pz);
    gateGroup.add(cap);

    // Chỉ phào mạ vàng quanh đầu trụ
    const goldTrim = new THREE.Mesh(new THREE.BoxGeometry(1.28, 0.14, 1.28), goldMat);
    goldTrim.position.set(0, 4.3, pz);
    gateGroup.add(goldTrim);

    // Biển hiệu đồng dán trên trụ
    const brassPlate = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 1.6), goldMat);
    brassPlate.rotation.y = -Math.PI / 2;
    brassPlate.position.set(-0.61, 2.3, pz);
    gateGroup.add(brassPlate);
  });

  // Cổng vòm thép hiện đại vươn ngang qua đường (Overhead Connecting Arch Beam)
  const archBeam = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.75, roadWidth + 2.5), archMat);
  archBeam.position.set(0, 4.3, 0);
  archBeam.castShadow = true;
  gateGroup.add(archBeam);

  // Viền vàng trên thanh vòm
  const archTrim = new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.08, roadWidth + 2.5), goldMat);
  archTrim.position.set(0, 4.7, 0);
  gateGroup.add(archTrim);

  // Bảng chữ nổi & Logo thương hiệu trên cổng vòm (Mặt Tây hướng ra ĐT234 & Cổng DK2)
  const westLogoTex = new THREE.TextureLoader().load(getAssetUrl('LogoDKBike_white.png'));
  westLogoTex.colorSpace = THREE.SRGBColorSpace;
  const westLogoMat = new THREE.MeshBasicMaterial({
    map: westLogoTex,
    transparent: true,
    polygonOffset: true,
    polygonOffsetFactor: -1.0,
    polygonOffsetUnits: -1.0,
  });

  const signPlankWest = new THREE.Mesh(
    new THREE.PlaneGeometry(roadWidth + 1.2, 0.45),
    new THREE.MeshStandardMaterial({ color: 0x184995, roughness: 0.3 })
  );
  signPlankWest.rotation.y = -Math.PI / 2;
  signPlankWest.position.set(-0.49, 4.3, 0);
  gateGroup.add(signPlankWest);

  const signTextWest = new THREE.Mesh(
    new THREE.PlaneGeometry(1.6, 1.6 / 2.44),
    westLogoMat
  );
  signTextWest.rotation.y = -Math.PI / 2;
  signTextWest.position.set(-0.50, 4.3, 0);
  gateGroup.add(signTextWest);

  // Đèn chiếu rọi ban đêm dưới cổng vòm (LED Downlights)
  [-2.2, 0, 2.2].forEach((lz) => {
    const downlight = new THREE.PointLight(0xfff7ed, 0.6, 9);
    downlight.position.set(0, 3.8, lz);
    gateGroup.add(downlight);
  });

  // --------------------------------------------------------------------------
  // 3. BARIE TỰ ĐỘNG CỔNG KẾT NỐI (Boom Barrier Gate 1B)
  // --------------------------------------------------------------------------
  createGateBarrier(-5.6, 0, roadCenterZ - roadWidth / 2 - 0.2, Math.PI / 2, 'barrierDK1_West', 'Barie Cổng kết nối DK1 - DK2 (Cổng 1B)');

  // --------------------------------------------------------------------------
  // 4. BỐT BẢO VỆ CỔNG KẾT NỐI (Security Guard Booth & Guard)
  // --------------------------------------------------------------------------
  const boothGroup = new THREE.Group();
  boothGroup.position.set(-4.0, 0, roadCenterZ - roadWidth / 2 - 2.8);

  // Thân bốt bảo vệ hợp kim nhôm kính
  const boothBody = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.8, 2.2), whiteMat);
  boothBody.position.y = 1.4;
  boothBody.castShadow = true;
  boothGroup.add(boothBody);

  // Mái bốt che nắng màu xanh dương DK
  const boothRoof = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.2, 2.6), archMat);
  boothRoof.position.y = 2.9;
  boothRoof.castShadow = true;
  boothGroup.add(boothRoof);

  // Dải cửa sổ kính 3 mặt
  const boothGlassMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1, metalness: 0.9 });
  const frontGlass = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.1), boothGlassMat);
  frontGlass.rotation.y = -Math.PI / 2;
  frontGlass.position.set(-1.21, 1.6, 0);
  boothGroup.add(frontGlass);

  const sideGlass = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.1), boothGlassMat);
  sideGlass.position.set(0, 1.6, 1.11);
  boothGroup.add(sideGlass);

  // Cục nóng điều hòa trên nóc bốt
  const acUnit = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 0.45, 0.3),
    new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.5 })
  );
  acUnit.position.set(-0.5, 3.25, 0);
  boothGroup.add(acUnit);

  // Nhân viên bảo vệ đứng chốt cạnh cổng
  const gateGuard = createCharacter({
    shirtColor: 0x1e293b,
    pantsColor: 0x0f172a,
    hatColor: 0x1e293b,
  });
  gateGuard.position.set(-1.5, 0, 1.8);
  gateGuard.rotation.y = -Math.PI / 2;
  boothGroup.add(gateGuard);

  gateGroup.add(boothGroup);

  // --------------------------------------------------------------------------
  // 5. CỘT ĐÈN CHIẾU SÁNG CAO ÁP TRÊN ĐƯỜNG KẾT NỐI (Streetlights)
  // --------------------------------------------------------------------------
  [1.0, 9.0].forEach((lx) => {
    createStreetlight(lx, 0, roadCenterZ - roadWidth / 2 - 1.2);
  });

  group.add(gateGroup);

  // Metadata tương tác
  const gateData = {
    id: 'gateDK1_West',
    title: 'Cổng & Tuyến đường kết nối liên phân khu DK1 - DK2 (Cổng 1B)',
    type: 'gate',
    desc: 'Cổng kiểm soát an ninh và trục đường kết nối xuyên suốt giữa Phân khu Nhà máy DK1 và Trụ sở điều hành DK2 qua đường ĐT234.',
    zone: 'DK1',
  };
  group.userData = gateData;
  archBeam.userData = gateData;
  interactiveObjects.push(archBeam);

  scene.add(group);
}

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
  createFlagpole(23.2, 0, -23.0, 0x184995, 8.0); // Cờ thương hiệu DK Bike xanh Royal
  createFlagpole(25.0, 0, -23.0, 0xdc2626, 9.2); // Cờ đỏ sao vàng Việt Nam (ở giữa, cao nhất)
  createFlagpole(26.8, 0, -23.0, 0x0284c7, 8.0); // Cờ xanh dương ISO / Môi trường

  // Cụm 2 Cột cờ trước Nhà điều hành DK2
  createFlagpole(-41.0, 0, -22.0, 0xdc2626, 8.5); // Cờ Việt Nam
  createFlagpole(-43.0, 0, -22.0, 0x184995, 8.0); // Cờ DK Bike xanh Royal

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
  // Hàng rào mạn DK1: Mở khoảng trống 9m (Z: -21 đến -30) cho Cổng kết nối mới đối diện Cổng DK2
  buildFenceSegment(-6.0, -30.0, -85.0);
  buildFenceSegment(-6.0, -2.0, -21.0);

  // Hàng rào mạn DK2 (Bên trái ĐT234): Chừa lối cổng chính DK2 mới
  buildFenceSegment(-14.0, -5.0, -63.0);
  buildFenceSegment(-14.0, 20.0, 10.0);
}

// Vỉa hè, Bó vỉa bê tông & Vạch người đi bộ qua đường (Zebra Crossings)
function buildSidewalksAndCrosswalks() {
  const whitePaintMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    polygonOffset: true,
    polygonOffsetFactor: -2.0,
    polygonOffsetUnits: -2.0,
  });
  const curbMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.85 });

  // 1. Vạch đi bộ qua đường (Zebra Crosswalk) nối Nhà A sang Bãi đỗ xe
  for (let z = -2; z <= 2; z++) {
    const stripe = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 0.45), whitePaintMat);
    stripe.rotation.x = -Math.PI / 2;
    stripe.position.set(35.0, 0.08, -26.5 + z * 0.85);
    scene.add(stripe);
  }

  // 2. Vạch đi bộ qua đường nối Nhà A sang Xưởng B
  for (let x = -2; x <= 2; x++) {
    const stripe = new THREE.Mesh(new THREE.PlaneGeometry(0.45, 3.2), whitePaintMat);
    stripe.rotation.x = -Math.PI / 2;
    stripe.position.set(51.0 + x * 0.85, 0.08, -26.5);
    scene.add(stripe);
  }

  // 3. Vạch đi bộ qua đường trước Nhà Ăn CBNV
  for (let z = -2; z <= 2; z++) {
    const stripe = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 0.45), whitePaintMat);
    stripe.rotation.x = -Math.PI / 2;
    stripe.position.set(34.0, 0.08, -15.0 + z * 0.85);
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

  // Ngôi sao vàng nếu là cờ đỏ Việt Nam, hoặc Logo DK Bike nếu là cờ thương hiệu
  if (flagColor === 0xdc2626) {
    const starMat = new THREE.MeshBasicMaterial({ color: 0xfacc15, side: THREE.DoubleSide });
    const star = new THREE.Mesh(new THREE.CircleGeometry(0.35, 5), starMat);
    star.position.set(0, 0, 0.02);
    flag.add(star);
    const starBack = new THREE.Mesh(new THREE.CircleGeometry(0.35, 5), starMat);
    starBack.rotation.y = Math.PI;
    starBack.position.set(0, 0, -0.02);
    flag.add(starBack);
  } else if (flagColor === 0x184995) {
    const flagLogoTex = new THREE.TextureLoader().load(getAssetUrl('LogoDKBike_white.png'));
    flagLogoTex.colorSpace = THREE.SRGBColorSpace;
    const flagLogoMat = new THREE.MeshBasicMaterial({
      map: flagLogoTex,
      transparent: true,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: -1.0,
      polygonOffsetUnits: -1.0,
    });
    const logoFront = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.4 / 2.44), flagLogoMat);
    logoFront.position.set(0, 0, 0.02);
    flag.add(logoFront);

    const logoBack = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.4 / 2.44), flagLogoMat);
    logoBack.rotation.y = Math.PI;
    logoBack.position.set(0, 0, -0.02);
    flag.add(logoBack);
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
  kcs.position.set(66.5, 0, -27.5); // Khu vực kiểm định KCS ngoài luồng xe lùi
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
  const testBike = createDetailedDKBike(0x184995, 'DK Roma SX Đang Kiểm Định');
  testBike.position.set(68.0, 0, -27.0);
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
    desc: 'Nghỉ giải lao ngắm đàn cá Koi và trao đổi kế hoạch phân phối dòng xe DK Gogo và DK Nova.',
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
  loader1.position.set(54.2, 0, -30.5); // Đứng ngoài hành lang an toàn, không chắn lối đi xe nâng
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

  // 12b. Người đi bộ lên xuống Vườn Lan trên đồi sinh thái DK2
  const hikerCurvePoints = [
    new THREE.Vector3(-72.0, 0.05, 0.0),
    new THREE.Vector3(-77.0, 0.05, -8.0),
    new THREE.Vector3(-83.0, 0.10, -18.0),
    new THREE.Vector3(-89.0, 3.66, -28.0),
    new THREE.Vector3(-95.0, 8.74, -38.0),
    new THREE.Vector3(-100.0, 13.03, -48.0),
    new THREE.Vector3(-105.0, 16.06, -56.0),
    new THREE.Vector3(-108.0, 16.79, -62.0),
  ];
  const hikerCurve = new THREE.CatmullRomCurve3(hikerCurvePoints);

  const orchidHiker = createCharacter({
    shirtColor: 0x059669, // Áo xanh ngọc sinh thái
    pantsColor: 0x334155, // Quần xám dã ngoại
    hatType: 'cap',
    hatColor: 0xf59e0b,
    role: 'visitor',
    hasBackpack: true,
  });
  orchidHiker.userData = {
    id: 'orchidHiker',
    title: 'Người đi bộ ngắm cảnh Vườn Lan',
    type: 'character',
    desc: 'Đi dạo theo tuyến đường sinh thái sa thạch leo dốc từ sân DK2 lên Vườn Lan và quay trở lại ngắm toàn cảnh khuôn viên DKBike.',
    zone: 'DK2',
  };
  const initHikerPt = hikerCurve.getPointAt(0.18);
  orchidHiker.position.set(initHikerPt.x, getDK2HillSurfaceY(initHikerPt.x, initHikerPt.z) + 0.05, initHikerPt.z);
  scene.add(orchidHiker);
  interactiveObjects.push(orchidHiker);

  hillHikers.push({
    mesh: orchidHiker,
    curve: hikerCurve,
    progress: 0.18,
    dir: 1,
    speed: 0.016,
    pauseTimer: 0,
    stepAngle: 0,
  });

  // 12c. Kỹ sư KCS kiểm tra xe tại khu xếp xe thành phẩm DK2
  const dk2KcsInspector = createCharacter({
    shirtColor: 0xea580c, // Áo cam KCS tiêu chuẩn
    pantsColor: 0x1e293b,
    hatType: 'helmet',
    hatColor: 0xffffff,
    holdingTablet: true,
    hasVest: true,
    role: 'kcs',
  });
  dk2KcsInspector.userData = {
    id: 'dk2KcsInspector',
    title: 'Kỹ sư KCS Kiểm định xe thành phẩm DK2',
    type: 'character',
    desc: 'Tuần tra dọc hàng xe thành phẩm DK Bike tại bãi tập kết DK2, kiểm tra chi tiết ngoại quan, thông số phanh và quét mã vạch xuất xưởng bằng máy tính bảng.',
    zone: 'DK2',
  };
  dk2KcsInspector.position.set(-72, 0.05, 5.8);
  scene.add(dk2KcsInspector);
  interactiveObjects.push(dk2KcsInspector);

  dk2Inspectors.push({
    mesh: dk2KcsInspector,
    currentX: -72,
    minX: -108,
    maxX: -42,
    z: 5.8,
    speed: 1.5,
    dir: 1,
    stepAngle: 0,
    checkTimer: 0,
    nextCheckIn: 3.2,
  });

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
  const padMat = new THREE.MeshStandardMaterial({
    color: 0x1e3a8a,
    roughness: 0.8,
    polygonOffset: true,
    polygonOffsetFactor: -1.0,
    polygonOffsetUnits: -1.0,
  }); // Royal Ocean Blue run-off
  const pad = new THREE.Mesh(padGeo, padMat);
  pad.rotation.x = -Math.PI / 2;
  pad.position.y = 0.055;
  pad.receiveShadow = true;
  volleyballCourtGroup.add(pad);

  // Inner court (18m along X, 9m along Z) in vibrant Olympic terracotta orange
  const courtGeo = new THREE.PlaneGeometry(18, 9);
  const courtMat = new THREE.MeshStandardMaterial({
    color: 0xea580c,
    roughness: 0.75,
    polygonOffset: true,
    polygonOffsetFactor: -2.0,
    polygonOffsetUnits: -2.0,
  });
  const court = new THREE.Mesh(courtGeo, courtMat);
  court.rotation.x = -Math.PI / 2;
  court.position.y = 0.075;
  court.receiveShadow = true;
  volleyballCourtGroup.add(court);

  // White boundary lines (0.12m width)
  const lineMat = new THREE.MeshBasicMaterial({
    color: 0xf8fafc,
    polygonOffset: true,
    polygonOffsetFactor: -3.0,
    polygonOffsetUnits: -3.0,
  });
  
  // End lines (x = -9 and x = 9)
  [-9, 9].forEach((lx) => {
    const endLine = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 9), lineMat);
    endLine.rotation.x = -Math.PI / 2;
    endLine.position.set(lx, 0.095, 0);
    volleyballCourtGroup.add(endLine);
  });

  // Side lines (z = -4.5 and z = 4.5)
  [-4.5, 4.5].forEach((lz) => {
    const sideLine = new THREE.Mesh(new THREE.PlaneGeometry(18, 0.12), lineMat);
    sideLine.rotation.x = -Math.PI / 2;
    sideLine.position.set(0, 0.095, lz);
    volleyballCourtGroup.add(sideLine);
  });

  // Center line under net (x = 0)
  const centerLine = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 9), lineMat);
  centerLine.rotation.x = -Math.PI / 2;
  centerLine.position.set(0, 0.095, 0);
  volleyballCourtGroup.add(centerLine);

  // 3-meter attack lines (x = -3 and x = 3)
  [-3, 3].forEach((ax) => {
    const attackLine = new THREE.Mesh(new THREE.PlaneGeometry(0.10, 9), lineMat);
    attackLine.rotation.x = -Math.PI / 2;
    attackLine.position.set(ax, 0.095, 0);
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
// ĐÀI PHUN NƯỚC NGHỆ THUẬT TRUNG TÂM DK BIKE (ĐƯỜNG KÍNH 5M - NƯỚC ĐA TẦNG & LOGO DK)
// ============================================================================
function buildDKFountain() {
  fountainGroup = new THREE.Group();
  fountainGroup.position.set(36.6, 0, -12);
  fountainGroup.userData = {
    id: 'fountainDK',
    title: 'Đài phun nước trung tâm DK Bike (Đường kính 5m)',
    type: 'landscape',
    desc: 'Đài phun nước nghệ thuật đường kính 5 mét với biểu tượng hai chữ D - K mạ vàng rực rỡ, hồ nước xanh ngọc đa tầng cùng hệ thống thác tràn viền, 12 vòm tia phun cong, cột nước geyser trung tâm và đèn LED âm nước đổi màu. Tọa lạc hài hòa giữa Nhà Ăn CBNV và Sân bóng chuyền DK1.',
    zone: 'DK1',
  };

  fountainJets = [];
  fountainRipples = [];
  fountainArcJets = [];
  fountainCrownJets = [];

  // 1. Đế đá hoa cương tròn & Thành bể đài phun (Outer diameter 5.0m, height 0.48m)
  const stoneMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0, // Đá granite trắng xám sang trọng
    roughness: 0.32,
    metalness: 0.15,
  });
  const rimMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.22,
    metalness: 0.20,
  });

  // Đĩa chân móng ngầm
  const foundation = new THREE.Mesh(new THREE.CylinderGeometry(2.68, 2.68, 0.08, 32), stoneMat);
  foundation.position.y = 0.04;
  foundation.receiveShadow = true;
  fountainGroup.add(foundation);

  // Thành bể ngoài (Radius 2.5m, Height 0.48m)
  const basinWall = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.56, 0.48, 32), stoneMat);
  basinWall.position.y = 0.24;
  basinWall.castShadow = true;
  basinWall.receiveShadow = true;
  fountainGroup.add(basinWall);

  // Gờ miệng bể bo tròn mềm mại (Bullnose rim)
  const basinRim = new THREE.Mesh(new THREE.TorusGeometry(2.38, 0.14, 12, 32), rimMat);
  basinRim.rotation.x = Math.PI / 2;
  basinRim.position.y = 0.48;
  fountainGroup.add(basinRim);

  // Lòng hồ lát gạch mosaic xanh ngọc bích
  const poolFloor = new THREE.Mesh(
    new THREE.CylinderGeometry(2.32, 2.32, 0.06, 32),
    new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4 })
  );
  poolFloor.position.y = 0.12;
  poolFloor.receiveShadow = true;
  fountainGroup.add(poolFloor);

  // 2. Lượng nước dồi dào trong hồ chính (Đầy sát miệng thành bể ở y = 0.44m)
  fountainWaterMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(2.32, 2.32, 0.06, 32),
    createStylizedWaterMaterial(false)
  );
  fountainWaterMesh.position.y = 0.44;
  fountainGroup.add(fountainWaterMesh);

  // Lớp nước trong suốt phản chiếu ánh sáng mặt trời & đáy hồ
  const crystalWaterMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.82,
    roughness: 0.08,
    metalness: 0.15,
  });
  const waterDepthVolume = new THREE.Mesh(new THREE.CylinderGeometry(2.31, 2.31, 0.30, 32), crystalWaterMat);
  waterDepthVolume.position.y = 0.28;
  fountainGroup.add(waterDepthVolume);

  // 3. Đèn LED âm nước đổi màu huyền ảo (Aquamarine, Cyan & Deep Blue)
  const ledColors = [0x06b6d4, 0x38bdf8, 0x0284c7, 0x38bdf8];
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2;
    const light = new THREE.PointLight(ledColors[i], 0.85, 7.5);
    light.position.set(Math.cos(angle) * 1.5, 0.42, Math.sin(angle) * 1.5);
    fountainGroup.add(light);
  }

  // 4. Trụ đài phun nước trung tâm 2 tầng nghệ thuật
  // Tầng 1: Chân đế trụ cổ điển
  const pedestalBase = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.96, 0.55, 24), stoneMat);
  pedestalBase.position.y = 0.275;
  pedestalBase.castShadow = true;
  fountainGroup.add(pedestalBase);

  // Bát tràn nước tầng 1 (Upper Overflow Bowl - Đường kính 2.1m)
  const tierBowl = new THREE.Mesh(new THREE.CylinderGeometry(1.08, 0.50, 0.28, 24), stoneMat);
  tierBowl.position.y = 0.92;
  tierBowl.castShadow = true;
  fountainGroup.add(tierBowl);

  const tierRim = new THREE.Mesh(new THREE.TorusGeometry(1.04, 0.08, 12, 24), rimMat);
  tierRim.rotation.x = Math.PI / 2;
  tierRim.position.y = 1.05;
  fountainGroup.add(tierRim);

  // Nước đầy ắp trong bát tầng trên
  const tierWater = new THREE.Mesh(new THREE.CylinderGeometry(1.02, 1.02, 0.04, 24), createStylizedWaterMaterial(false));
  tierWater.position.y = 1.04;
  fountainGroup.add(tierWater);

  // MÀN NƯỚC THÁC TRÀN VIỀN (Overflow Waterfall Cascade: Đổ từ tầng 1 xuống hồ chính)
  fountainCascadeMat = new THREE.MeshStandardMaterial({
    color: 0xe0f2fe,
    roughness: 0.08,
    metalness: 0.1,
    transparent: true,
    opacity: 0.72,
    side: THREE.DoubleSide,
  });
  fountainCascadeMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(1.05, 1.28, 0.60, 24, 1, true),
    fountainCascadeMat
  );
  fountainCascadeMesh.position.y = 0.74;
  fountainGroup.add(fountainCascadeMesh);

  // Vòng bọt nước trắng xóa chân thác nước tràn (Foam landing ring)
  const foamMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.4,
    transparent: true,
    opacity: 0.85,
  });
  const foamLandingRing = new THREE.Mesh(new THREE.TorusGeometry(1.28, 0.065, 8, 24), foamMat);
  foamLandingRing.rotation.x = Math.PI / 2;
  foamLandingRing.position.y = 0.445;
  fountainGroup.add(foamLandingRing);

  // 8 Máng nước viền bát tầng 1 phun tia nước tràn thành rãnh
  for (let s = 0; s < 8; s++) {
    const sAngle = (s * Math.PI * 2) / 8;
    const sx = Math.cos(sAngle) * 1.04;
    const sz = Math.sin(sAngle) * 1.04;
    const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.08, 8), stoneMat);
    spout.position.set(sx, 1.03, sz);
    spout.lookAt(sx * 1.5, 0.6, sz * 1.5);
    fountainGroup.add(spout);
  }

  // Tầng 2: Cột trụ đỡ điêu khắc chữ DK
  const upperPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.52, 0.75, 16), stoneMat);
  upperPillar.position.y = 1.42;
  upperPillar.castShadow = true;
  fountainGroup.add(upperPillar);

  // Bệ đỡ chữ DK
  const emblemPlinth = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.12, 0.48), stoneMat);
  emblemPlinth.position.y = 1.82;
  emblemPlinth.castShadow = true;
  fountainGroup.add(emblemPlinth);

  // 5. TÁC PHẨM ĐIÊU KHẮC BIỂU TƯỢNG HAI CHỮ "DK" MẠ VÀNG (Full Monogram D & K)
  fountainDKLogo = new THREE.Group();
  fountainDKLogo.position.set(0, 1.88, 0);

  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xfbbf24, // Vàng kim loại óng ánh
    metalness: 0.92,
    roughness: 0.18,
    emissive: 0x78350f,
    emissiveIntensity: 0.12,
  });

  // Nẹp viền mạ vàng chân bệ chữ
  const plinthTrim = new THREE.Mesh(new THREE.BoxGeometry(1.70, 0.028, 0.50), goldMat);
  plinthTrim.position.set(0, 0, 0);
  fountainDKLogo.add(plinthTrim);

  // --- Chữ D (Rộng 0.65m, Cao 0.9m, Dày 0.16m) ---
  const dGroup = new THREE.Group();
  dGroup.position.set(-0.35, 0, 0);

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

  // --- Chữ K (Rộng 0.65m, Cao 0.9m, Dày 0.16m - Đã sửa & bổ sung trọn vẹn) ---
  const kGroup = new THREE.Group();
  kGroup.position.set(0.35, 0, 0);

  // Cột đứng chữ K
  const kSpine = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.88, 0.16), goldMat);
  kSpine.position.set(-0.16, 0.44, 0);
  kSpine.castShadow = true;
  kGroup.add(kSpine);

  // Khối nối giữa thân và hai tay chéo chữ K
  const kJoint = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.22, 0.16), goldMat);
  kJoint.position.set(-0.04, 0.44, 0);
  kGroup.add(kJoint);

  // Nhánh chéo trên chữ K
  const kUpperArm = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.60, 0.16), goldMat);
  kUpperArm.rotation.z = -Math.PI / 3.8;
  kUpperArm.position.set(0.10, 0.64, 0);
  kUpperArm.castShadow = true;
  kGroup.add(kUpperArm);

  // Nhánh chéo dưới chữ K
  const kLowerArm = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.60, 0.16), goldMat);
  kLowerArm.rotation.z = Math.PI / 3.8;
  kLowerArm.position.set(0.10, 0.24, 0);
  kLowerArm.castShadow = true;
  kGroup.add(kLowerArm);

  // GẮN CHỮ K VÀO LOGO DK
  fountainDKLogo.add(kGroup);

  // Ngôi sao vàng nhỏ đính giữa chữ D và K
  const starGeo = new THREE.DodecahedronGeometry(0.13, 0);
  const starMesh = new THREE.Mesh(starGeo, goldMat);
  starMesh.position.set(0, 0.44, 0.09);
  fountainDKLogo.add(starMesh);

  fountainGroup.add(fountainDKLogo);

  // 6. HỆ THỐNG PHUN NƯỚC ĐA TẦNG DỒI DÀO (ABUNDANT MULTI-TIER WATER JETS)
  const sprayMat = new THREE.MeshStandardMaterial({
    color: 0xbae6fd,
    roughness: 0.05,
    metalness: 0.1,
    transparent: true,
    opacity: 0.82,
  });

  // A. Cột nước Geyser trung tâm phun vọt cao 2.6m sau biểu tượng DK
  fountainCenterJet = new THREE.Group();
  fountainCenterJet.position.set(0, 1.95, 0);

  const geyserCore = new THREE.Mesh(new THREE.ConeGeometry(0.24, 2.4, 16, 1, true), sprayMat);
  geyserCore.position.y = 1.2;
  geyserCore.rotation.x = Math.PI;
  fountainCenterJet.add(geyserCore);

  const geyserFoam = new THREE.Mesh(new THREE.ConeGeometry(0.38, 2.1, 12, 1, true), foamMat);
  geyserFoam.position.y = 1.05;
  geyserFoam.rotation.x = Math.PI;
  fountainCenterJet.add(geyserFoam);

  const geyserTopSpray = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 8), sprayMat);
  geyserTopSpray.position.y = 2.4;
  fountainCenterJet.add(geyserTopSpray);

  fountainGroup.add(fountainCenterJet);
  fountainJets.push({ mesh: fountainCenterJet, type: 'center' });

  // B. 12 Tia nước hình vòng cung uốn lượn mượt mà từ mép bể vào bát tầng 1 (Parabolic Arc Jets)
  const arcJetCount = 12;
  for (let j = 0; j < arcJetCount; j++) {
    const angle = (j * Math.PI * 2) / arcJetCount;
    const r = 2.12;
    const jx = Math.cos(angle) * r;
    const jz = Math.sin(angle) * r;

    // Vòi phun kim loại sáng bóng trên gờ bể
    const nozzle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.055, 0.14, 8),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.2 })
    );
    nozzle.position.set(jx, 0.49, jz);
    nozzle.lookAt(0, 1.8, 0);
    fountainGroup.add(nozzle);

    // Đường cong tia nước hình parabol từ vành bể vào bát tầng 1
    const pStart = new THREE.Vector3(jx, 0.49, jz);
    const pApex = new THREE.Vector3(jx * 0.45, 2.05, jz * 0.45);
    const pEnd = new THREE.Vector3(jx * 0.14, 1.06, jz * 0.14);
    const curve = new THREE.QuadraticBezierCurve3(pStart, pApex, pEnd);

    const arcGeo = new THREE.TubeGeometry(curve, 18, 0.034, 8, false);
    const arcMesh = new THREE.Mesh(arcGeo, sprayMat);
    fountainGroup.add(arcMesh);
    fountainArcJets.push(arcMesh);
    fountainJets.push({ mesh: arcMesh, type: 'arc', index: j });
  }

  // C. Chùm 6 tia nước vút cao xung quanh bệ chữ DK (Crown Jets)
  for (let c = 0; c < 6; c++) {
    const cAngle = (c * Math.PI * 2) / 6;
    const cx = Math.cos(cAngle) * 0.72;
    const cz = Math.sin(cAngle) * 0.72;

    const crownJet = new THREE.Mesh(new THREE.ConeGeometry(0.075, 1.45, 8, 1, true), sprayMat);
    crownJet.position.set(cx, 1.05 + 0.725, cz);
    crownJet.rotation.x = Math.PI;
    crownJet.rotation.z = Math.cos(cAngle) * 0.12;
    fountainGroup.add(crownJet);
    fountainCrownJets.push(crownJet);
    fountainJets.push({ mesh: crownJet, type: 'crown' });
  }

  // D. 4 Vòng sóng nước lan tỏa liên tục trên mặt hồ (Dynamic Concentric Ripples)
  for (let r = 0; r < 4; r++) {
    const rippleGeo = new THREE.RingGeometry(0.35, 0.46, 32);
    const rippleMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
    });
    const rippleMesh = new THREE.Mesh(rippleGeo, rippleMat);
    rippleMesh.rotation.x = -Math.PI / 2;
    rippleMesh.position.set(0, 0.445, 0);
    fountainGroup.add(rippleMesh);
    fountainRipples.push({
      mesh: rippleMesh,
      progress: r / 4,
    });
  }

  scene.add(fountainGroup);
  interactiveObjects.push(basinWall);
  interactiveObjects.push(dSpine);
  interactiveObjects.push(kSpine);
}

// ============================================================================
// CẬP NHẬT HOẠT CẢNH ĐÀI PHUN NƯỚC DK (HOẠT ĐỘNG LIÊN TỤC TRONG RENDER LOOP)
// ============================================================================
function updateDKFountain(delta, currentTime) {
  if (!fountainGroup) return;

  const timeSec = currentTime * 0.001;

  // 1. Cột nước Geyser trung tâm nhấp nhô nhịp nhàng tự nhiên
  if (fountainCenterJet) {
    const pulseY = 1.0 + Math.sin(timeSec * 3.6) * 0.14;
    const pulseXZ = 1.0 + Math.cos(timeSec * 3.6) * 0.08;
    fountainCenterJet.scale.set(pulseXZ, pulseY, pulseXZ);
  }

  // 2. Màn nước thác tràn viền dao động bọt nước
  if (fountainCascadeMat) {
    fountainCascadeMat.opacity = 0.68 + Math.sin(timeSec * 5.5) * 0.08;
  }

  // 3. 12 Tia nước vòng cung lấp lánh phản chiếu
  fountainArcJets.forEach((arc, i) => {
    if (arc.material) {
      arc.material.opacity = 0.78 + Math.sin(timeSec * 4.2 + i * 0.5) * 0.08;
    }
  });

  // 4. Chùm 6 vòi nước vương miện xung quanh chữ DK
  fountainCrownJets.forEach((cJet, i) => {
    const cScaleY = 1.0 + Math.sin(timeSec * 4.0 + i * 1.0) * 0.16;
    cJet.scale.set(1.0, cScaleY, 1.0);
  });

  // 5. 4 Vòng sóng nước lan tỏa dần từ tâm ra mép hồ
  fountainRipples.forEach((rip) => {
    rip.progress = (rip.progress + delta * 0.38) % 1.0;
    const s = 0.35 + rip.progress * 4.9;
    rip.mesh.scale.set(s, s, 1);
    rip.mesh.material.opacity = Math.max(0.0, (1.0 - rip.progress) * 0.65);
  });
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
    title: 'Ao cá đồi sinh thái DK2 (Cầu gỗ ngắm cá & cá bơi nhảy)',
    type: 'landscape',
    desc: 'Hồ cá sinh thái tự nhiên trên sườn đồi cao cạnh Vườn Lan. Cầu gỗ cong bán nguyệt vươn ra mặt nước trong xanh cho du khách dạo bước ngắm đàn cá Koi to lớn tung tăng bơi lội và nhảy búng nước bọt tung trắng xóa.',
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

  // 3. Mặt nước hồ cách điệu (Stylized Shader Nước trong vắt với Caustics)
  const waterGeo = new THREE.CircleGeometry(radiusX - 0.2, 48);
  const waterMat = createStylizedWaterMaterial(false);
  hillPondWater = new THREE.Mesh(waterGeo, waterMat);
  hillPondWater.rotation.x = -Math.PI / 2;
  hillPondWater.scale.set(1.0, radiusZ / radiusX, 1.0);
  hillPondWater.position.y = 0.08;
  pondGroup.add(hillPondWater);

  // 4. 24 Floating Lotus Pads & Pink Blossoms
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

  // 5. CẦU GỖ CONG NGẮM CÁ & CHO CÁ ĂN (Arched Wooden Viewing & Feeding Footbridge)
  const timberMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.85 });
  const bridgePlankMat = new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.8 });
  const railMat = new THREE.MeshStandardMaterial({ color: 0x5c3d2e, roughness: 0.85 });
  const pileMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.9 });
  const glowMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });

  const bridgeGroup = new THREE.Group();
  bridgeGroup.position.set(-radiusX * 0.22, 0.12, radiusZ * 0.45);
  bridgeGroup.rotation.y = -Math.PI / 4.2;

  const brLen = 10.5;
  const brWidth = 2.4;
  const plankSteps = 26;

  for (let p = 0; p < plankSteps; p++) {
    const t = p / (plankSteps - 1);
    const px = (t - 0.5) * brLen;
    const py = Math.sin(t * Math.PI) * 0.95; // Cầu cong cao 0.95m ngắm trọn cá bơi & nhảy bên dưới
    const plank = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.08, brWidth), bridgePlankMat);
    plank.position.set(px, py, 0);
    plank.rotation.z = -Math.cos(t * Math.PI) * 0.20;
    plank.receiveShadow = true;
    bridgeGroup.add(plank);

    // Cột lan can gỗ hai bên
    if (p % 3 === 0) {
      [-brWidth / 2 + 0.08, brWidth / 2 - 0.08].forEach((rz) => {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.88, 6), railMat);
        post.position.set(px, py + 0.44, rz);
        bridgeGroup.add(post);
      });
    }
  }

  // Tay vịn cong uốn lượn hai bên thành cầu
  [-brWidth / 2 + 0.08, brWidth / 2 - 0.08].forEach((rz) => {
    for (let p = 0; p < plankSteps - 1; p++) {
      const t1 = p / (plankSteps - 1);
      const t2 = (p + 1) / (plankSteps - 1);
      const x1 = (t1 - 0.5) * brLen;
      const y1 = Math.sin(t1 * Math.PI) * 0.95 + 0.84;
      const x2 = (t2 - 0.5) * brLen;
      const y2 = Math.sin(t2 * Math.PI) * 0.95 + 0.84;

      const segLen = Math.hypot(x2 - x1, y2 - y1);
      const railSeg = new THREE.Mesh(new THREE.BoxGeometry(segLen, 0.07, 0.08), railMat);
      railSeg.position.set((x1 + x2) / 2, (y1 + y2) / 2, rz);
      railSeg.rotation.z = Math.atan2(y2 - y1, x2 - x1);
      bridgeGroup.add(railSeg);
    }
  });

  // Trụ cọc cắm lòng hồ
  [-2.8, 0, 2.8].forEach((hx) => {
    [-brWidth / 2 + 0.2, brWidth / 2 - 0.2].forEach((hz) => {
      const pile = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 2.4, 6), pileMat);
      pile.position.set(hx, -0.65, hz);
      bridgeGroup.add(pile);
    });
  });

  // Đèn lồng gỗ 2 đầu cầu
  [-brLen / 2 + 0.3, brLen / 2 - 0.3].forEach((lx) => {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.4, 6), timberMat);
    post.position.set(lx, 0.7, brWidth / 2 + 0.12);
    bridgeGroup.add(post);

    const lamp = new THREE.Mesh(new THREE.DodecahedronGeometry(0.2), glowMat);
    lamp.position.set(lx, 1.4, brWidth / 2 + 0.12);
    bridgeGroup.add(lamp);
  });

  // Người đứng trên cầu ngắm cảnh & Người rắc mồi cho cá ăn
  const feederOnBridge = createCharacter({
    shirtColor: 0xef4444, // Áo đỏ nổi bật
    pantsColor: 0x1e293b,
    hatType: 'cap',
    role: 'tourist',
  });
  feederOnBridge.position.set(0.4, 0.95, -0.75);
  feederOnBridge.rotation.y = -Math.PI / 2;
  bridgeGroup.add(feederOnBridge);

  const companionOnBridge = createCharacter({
    shirtColor: 0xfacc15, // Áo vàng năng động
    pantsColor: 0x334155,
    hatType: 'none',
    role: 'tourist',
  });
  companionOnBridge.position.set(-0.9, 0.92, 0.75);
  companionOnBridge.rotation.y = Math.PI / 2;
  bridgeGroup.add(companionOnBridge);

  pondGroup.add(bridgeGroup);

  // Sàn gỗ ngắm cảnh phía Đông hồ (Viewing Deck)
  const deckGroup = new THREE.Group();
  deckGroup.position.set(radiusX * 0.62, 0.15, -radiusZ * 0.15);
  const deckFloor = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.10, 5.0), timberMat);
  deckFloor.receiveShadow = true;
  deckGroup.add(deckFloor);

  [
    { x: -2.3, z: -2.2 },
    { x: 2.3, z: -2.2 },
    { x: -2.3, z: 2.2 },
    { x: 2.3, z: 2.2 },
  ].forEach((pp) => {
    const pile = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.8, 6), pileMat);
    pile.position.set(pp.x, -0.85, pp.z);
    deckGroup.add(pile);
  });

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

  // 6. ĐÀN CÁ THÂN SUÔN 18 CON BƠI LỘI TỰ DO & NHẢY BÚNG NƯỚC TRÊN AO ĐỒI (ORGANIC AUTONOMOUS SWIMMING)
  hillPondKoiFishes = [];

  const maxSwimRadiusX = radiusX - 2.8; // ~13.7m (bán trục an toàn bên trong mép bờ hồ)
  const maxSwimRadiusZ = radiusZ - 2.4; // ~9.6m

  for (let k = 0; k < 18; k++) {
    // Kích cỡ cá sinh thái tự nhiên phong phú từ 0.9m đến 1.25m
    const scale = 0.92 + (k % 4) * 0.11;
    const fishObj = buildRealisticStreamlinedFish(scale, k);

    // Phân bố đều tự nhiên trong lòng hồ
    const spawnAngle = (k / 18) * Math.PI * 2 + (Math.random() - 0.5) * 0.35;
    const spawnDist = 0.2 + Math.random() * 0.65;
    const startX = Math.cos(spawnAngle) * (maxSwimRadiusX * spawnDist);
    const startZ = Math.sin(spawnAngle) * (maxSwimRadiusZ * spawnDist);
    const startY = 0.045 + (k % 3) * 0.015;
    const heading = Math.random() * Math.PI * 2;
    const speed = 0.35 + Math.random() * 0.25;

    // 5 con cá thỉnh thoảng nhảy búng nước nhào lộn
    const isJumper = k % 3 === 0;

    fishObj.group.position.set(startX, startY, startZ);
    fishObj.group.rotation.y = heading;
    pondGroup.add(fishObj.group);

    hillPondKoiFishes.push({
      mesh: fishObj.group,
      tail: fishObj.tailGroup,
      x: startX,
      y: startY,
      z: startZ,
      baseY: startY,
      heading: heading,
      targetHeading: heading,
      speed: speed,
      targetSpeed: speed,
      wanderTimer: 1.5 + Math.random() * 3.5,
      burstTimer: 4.0 + Math.random() * 5.0,
      turnSpeed: 1.1,
      phase: k * 1.35,
      isJumper: isJumper,
      isJumping: false,
      jumpProgress: 0,
      jumpDuration: 1.15 + (k % 3) * 0.2,
      jumpTimer: 2.5 + k * 1.6,
      parentGroup: pondGroup,
      boundary: {
        rx: maxSwimRadiusX,
        rz: maxSwimRadiusZ,
      },
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
  const flockBaseZ = -16; // Dịch chuyển 22m theo hướng mũi tên
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
  // Shared flower materials pool (tái sử dụng tránh tạo hàng trăm material riêng lẻ)
  const sharedFlowerMatPool = {};
  const getSharedFlowerMat = (hex) => {
    if (!sharedFlowerMatPool[hex]) {
      sharedFlowerMatPool[hex] = new THREE.MeshStandardMaterial({ color: hex, roughness: 0.65, flatShading: true });
    }
    return sharedFlowerMatPool[hex];
  };

  const createFlowerBed = (bx, bz, radius, flowerTypes) => {
    const bed = new THREE.Group();
    bed.position.set(bx, 0, bz);

    const soil = new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius + 0.2, 0.22, 12),
      new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.95 })
    );
    soil.position.y = 0.11;
    soil.receiveShadow = true;
    bed.add(soil);

    // Gộp viền đá cuội vào 1 InstancedMesh nhỏ gọn
    const borderStonesCount = Math.floor(radius * 8);
    const borderStoneGeo = new THREE.DodecahedronGeometry(0.18, 0);
    const borderStoneInst = new THREE.InstancedMesh(borderStoneGeo, darkStoneMat, borderStonesCount);
    borderStoneInst.castShadow = true;
    const dummyStone = new THREE.Object3D();
    for (let bs = 0; bs < borderStonesCount; bs++) {
      const angle = (bs / borderStonesCount) * Math.PI * 2;
      dummyStone.position.set(Math.cos(angle) * (radius + 0.15), 0.12, Math.sin(angle) * (radius + 0.15));
      dummyStone.scale.set(1.0, 0.8, 1.0);
      dummyStone.updateMatrix();
      borderStoneInst.setMatrixAt(bs, dummyStone.matrix);
    }
    bed.add(borderStoneInst);

    // Khóm hoa dùng InstancedMesh tối ưu
    const flowerGeo = new THREE.SphereGeometry(0.14, 4, 3);
    const numFlowers = Math.floor(radius * radius * 8);
    const flowerInst = new THREE.InstancedMesh(flowerGeo, getSharedFlowerMat(flowerTypes[0].color), numFlowers);
    flowerInst.castShadow = false; // Tắt đổ bóng cho hoa nhỏ để tiết kiệm GPU & RAM
    const dummyFl = new THREE.Object3D();
    const colObjFl = new THREE.Color();

    for (let f = 0; f < numFlowers; f++) {
      const r = Math.sqrt(Math.random()) * (radius * 0.88);
      const theta = Math.random() * Math.PI * 2;
      const fx = Math.cos(theta) * r;
      const fz = Math.sin(theta) * r;
      const fType = flowerTypes[f % flowerTypes.length];

      dummyFl.position.set(fx, 0.32, fz);
      dummyFl.scale.set(fType.scale, fType.scale * 0.9, fType.scale);
      dummyFl.updateMatrix();
      flowerInst.setMatrixAt(f, dummyFl.matrix);
      colObjFl.setHex(fType.color);
      flowerInst.setColorAt(f, colObjFl);
    }
    bed.add(flowerInst);
    return bed;
  };

  // 6 BỒN HOA RỰC RỠ TRÊN ĐỈNH ĐỒI (SUMMIT FLOWER GARDENS)
  flowerBedGroup.add(createFlowerBed(2.5, 4.2, 2.4, [{ color: 0xfacc15, scale: 1.3 }, { color: 0xf59e0b, scale: 1.4 }, { color: 0xf97316, scale: 1.2 }]));
  flowerBedGroup.add(createFlowerBed(-2.6, 4.8, 2.3, [{ color: 0xa855f7, scale: 1.4 }, { color: 0x8b5cf6, scale: 1.3 }, { color: 0xc084fc, scale: 1.2 }]));
  flowerBedGroup.add(createFlowerBed(5.2, 2.5, 2.2, [{ color: 0xbe123c, scale: 1.3 }, { color: 0xf43f5e, scale: 1.2 }, { color: 0xffffff, scale: 1.1 }]));
  flowerBedGroup.add(createFlowerBed(-4.2, -4.2, 2.1, [{ color: 0xec4899, scale: 1.2 }, { color: 0xfbbf24, scale: 1.1 }, { color: 0x38bdf8, scale: 1.1 }]));
  flowerBedGroup.add(createFlowerBed(3.8, -4.0, 2.1, [{ color: 0xf472b6, scale: 1.3 }, { color: 0xfb7185, scale: 1.2 }, { color: 0xffe4e6, scale: 1.1 }]));
  flowerBedGroup.add(createFlowerBed(-0.5, 6.2, 2.2, [{ color: 0xf97316, scale: 1.35 }, { color: 0xeab308, scale: 1.25 }, { color: 0xef4444, scale: 1.15 }]));

  // DẢI HOA VIỀN MÉP ĐỒI & SƯỜN DỐC: DÙNG DUY NHẤT 1 INSTANCEDMESH (Tiết kiệm 1000+ Meshes!)
  const rimFlowerGeo = new THREE.SphereGeometry(0.16, 4, 3);
  const rimColors = [0xfacc15, 0xf43f5e, 0x8b5cf6, 0xffffff, 0xf97316, 0x38bdf8, 0xec4899];
  const totalHillFlowers = 420;
  const hillFlowerInst = new THREE.InstancedMesh(rimFlowerGeo, getSharedFlowerMat(0xffffff), totalHillFlowers);
  hillFlowerInst.castShadow = false;
  const dummyHillFl = new THREE.Object3D();
  const hillCol = new THREE.Color();

  for (let idx = 0; idx < totalHillFlowers; idx++) {
    const isRim = idx < 180;
    let fx, fz, fy;
    if (isRim) {
      const angle = (idx / 180) * Math.PI * 2;
      const rad = 13.0 + Math.random() * 2.5;
      fx = Math.cos(angle) * rad;
      fz = Math.sin(angle) * rad;
      fy = 0.2 + Math.random() * 0.15;
    } else {
      const sAngle = Math.random() * Math.PI * 2;
      const sRad = 15.5 + Math.random() * 20.0;
      fx = Math.cos(sAngle) * sRad;
      fz = Math.sin(sAngle) * sRad;
      const slopeT = (sRad - 15.0) / (46.0 - 15.0);
      fy = -0.5 + 16.0 * Math.pow(Math.max(0, 1.0 - slopeT), 1.25) - 15.5 + 0.25;
    }

    dummyHillFl.position.set(fx, fy, fz);
    dummyHillFl.scale.setScalar(0.9 + Math.random() * 0.6);
    dummyHillFl.updateMatrix();
    hillFlowerInst.setMatrixAt(idx, dummyHillFl.matrix);
    hillCol.setHex(rimColors[idx % rimColors.length]);
    hillFlowerInst.setColorAt(idx, hillCol);
  }
  flowerBedGroup.add(hillFlowerInst);
  flockGroup.add(flowerBedGroup);

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
// HỆ THỐNG ĐÀN CÁ BƠI & NHẢY TRÊN SÔNG MÁNG GẦN ĐƯỜNG TÀU (JUMPING FISH & RIPPLES)
// ============================================================================
let activeRiverFish = [];
let riverWaterRipples = [];

function buildRiverJumpingFish() {
  const fishGroup = new THREE.Group();
  fishGroup.name = 'riverJumpingFishGroup';

  const fishConfigs = [
    { x: 93.2, z: -42, color: 0xf97316, name: 'Cá Koi Kohaku Cam' },     // Cạnh Cầu vòm đỏ & đường tàu
    { x: 93.6, z: -54, color: 0xfbbf24, name: 'Cá Chép Vàng Ogon' },      // Dưới chân Cầu vòm đỏ
    { x: 90.6, z: -22, color: 0xdc2626, name: 'Cá Koi Sanke Đỏ' },       // Bờ sông cạnh tuyến ray
    { x: 89.8, z: -2.0, color: 0xf8fafc, name: 'Cá Bạc Platinum' },      // Cạnh Ga xe lửa DK Station
    { x: 91.5, z: -74, color: 0xf97316, name: 'Cá Koi Vàng Cam' },       // Khúc sông gần thuyền nan
    { x: 92.2, z: -88, color: 0x0284c7, name: 'Cá Lam Sinh Thái' },      // Khúc sông sau thuyền nan
    { x: 91.0, z: -105, color: 0xfbbf24, name: 'Cá Chép Hoàng Kim' },     // Thượng nguồn sông máng
  ];

  fishConfigs.forEach((cfg, idx) => {
    const oneFish = new THREE.Group();
    oneFish.position.set(cfg.x, -0.42, cfg.z);

    const fishMat = new THREE.MeshStandardMaterial({
      color: cfg.color,
      roughness: 0.25,
      metalness: 0.15,
    });
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });

    // Thân cá thon nhọn khí động học
    const body = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.72, 7), fishMat);
    body.rotation.x = Math.PI / 2;
    body.scale.set(0.75, 1.0, 1.25);
    oneFish.add(body);

    // Mũi đầu cá
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), fishMat);
    head.position.set(0, 0, 0.38);
    head.scale.set(0.72, 0.9, 1.2);
    oneFish.add(head);

    // Mắt cá tròn
    [-0.11, 0.11].forEach((ex) => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 6), new THREE.MeshBasicMaterial({ color: 0x0f172a }));
      eye.position.set(ex, 0.06, 0.46);
      oneFish.add(eye);
    });

    // Vây lưng
    const dorsalFin = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.16, 0.24), whiteMat);
    dorsalFin.position.set(0, 0.16, -0.05);
    dorsalFin.rotation.x = -Math.PI / 6;
    oneFish.add(dorsalFin);

    // 2 Vây bơi 2 bên
    [-0.14, 0.14].forEach((fx) => {
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.02, 0.14), whiteMat);
      fin.position.set(fx, -0.05, 0.15);
      fin.rotation.z = fx > 0 ? -Math.PI / 5 : Math.PI / 5;
      oneFish.add(fin);
    });

    // Đuôi cá có khớp quẫy sóng
    const tailPivot = new THREE.Group();
    tailPivot.position.set(0, 0, -0.38);

    const tailFin = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.28, 0.28), whiteMat);
    tailFin.position.set(0, 0, -0.14);
    tailFin.rotation.x = Math.PI / 4;
    tailPivot.add(tailFin);
    oneFish.add(tailPivot);

    scene.add(oneFish);

    activeRiverFish.push({
      mesh: oneFish,
      tailPivot: tailPivot,
      baseX: cfg.x,
      baseZ: cfg.z,
      baseY: -0.42,
      id: idx,
      isJumping: false,
      jumpProgress: 0,
      jumpDuration: 1.15,
      jumpCooldown: 2.5 + Math.random() * 5.0, // Nhảy ngẫu nhiên cách nhau vài giây
      jumpHeight: 0.65 + Math.random() * 0.45,  // Độ cao nhảy vút lên khỏi mặt nước
    });
  });
}

function spawnWaterRipple(x, z, maxScale = 2.0) {
  const rippleGeo = new THREE.RingGeometry(0.1, 0.18, 16);
  const rippleMat = new THREE.MeshBasicMaterial({
    color: 0xbae6fd,
    transparent: true,
    opacity: 0.85,
    side: THREE.DoubleSide,
  });
  const ripple = new THREE.Mesh(rippleGeo, rippleMat);
  ripple.rotation.x = -Math.PI / 2;
  ripple.position.set(x, -0.31, z);
  scene.add(ripple);

  riverWaterRipples.push({
    mesh: ripple,
    scale: 0.3,
    maxScale: maxScale,
    opacity: 0.85,
    life: 1.2,
  });
}

function updateRiverFish(delta, time) {
  // Cập nhật gợn sóng nước
  for (let i = riverWaterRipples.length - 1; i >= 0; i--) {
    const r = riverWaterRipples[i];
    r.life -= delta;
    r.scale += delta * 1.5;
    r.opacity = (r.life / 1.2) * 0.85;
    r.mesh.scale.set(r.scale, r.scale, 1);
    r.mesh.material.opacity = Math.max(0, r.opacity);
    if (r.life <= 0) {
      scene.remove(r.mesh);
      r.mesh.geometry.dispose();
      r.mesh.material.dispose();
      riverWaterRipples.splice(i, 1);
    }
  }

  // Cập nhật cá bơi và nhảy
  activeRiverFish.forEach((fish) => {
    if (fish.isJumping) {
      // Đang trong quỹ đạo nhảy parabol lên khỏi mặt nước
      fish.jumpProgress += delta / fish.jumpDuration;
      const t = fish.jumpProgress;

      if (t >= 1.0) {
        // Rơi trở lại xuống sông: tạo gợn sóng tõm
        fish.isJumping = false;
        fish.mesh.position.y = fish.baseY;
        fish.mesh.rotation.x = 0;
        spawnWaterRipple(fish.mesh.position.x, fish.mesh.position.z, 2.2);
        fish.jumpCooldown = 4.0 + Math.random() * 6.0;
      } else {
        // Quỹ đạo nhảy hình vòng cung parabol
        const arcY = 4 * fish.jumpHeight * t * (1 - t);
        fish.mesh.position.y = fish.baseY + arcY;
        // Chúc đầu lên khi bay lên, chúc đầu xuống khi rơi lặn
        const pitch = t < 0.5 ? -0.85 * (1 - t * 2) : 0.85 * ((t - 0.5) * 2);
        fish.mesh.rotation.x = pitch;
        // Đuôi quẫy nhanh trong không trung
        fish.tailPivot.rotation.y = Math.sin(time * 0.025 + fish.id) * 0.65;
      }
    } else {
      // Bơi lội thư thái dưới nước
      fish.mesh.rotation.x = 0;
      fish.mesh.position.y = fish.baseY + Math.sin(time * 0.003 + fish.id) * 0.04;
      fish.mesh.position.x = fish.baseX + Math.sin(time * 0.0012 + fish.id) * 0.65;
      fish.mesh.position.z = fish.baseZ + Math.cos(time * 0.0012 + fish.id) * 0.55;

      // Hướng mặt theo chuyển động
      const dirX = Math.cos(time * 0.0012 + fish.id);
      const dirZ = -Math.sin(time * 0.0012 + fish.id);
      fish.mesh.rotation.y = Math.atan2(dirX, dirZ);

      // Đuôi cá quẫy sóng nước nhịp nhàng
      fish.tailPivot.rotation.y = Math.sin(time * 0.015 + fish.id) * 0.45;

      // Đếm ngược nhảy lên khỏi mặt nước
      fish.jumpCooldown -= delta;
      if (fish.jumpCooldown <= 0) {
        fish.isJumping = true;
        fish.jumpProgress = 0;
        // Tạo gợn sóng nước lúc vọt lên
        spawnWaterRipple(fish.mesh.position.x, fish.mesh.position.z, 1.8);
      }
    }
  });
}

// ============================================================================
// HỆ THỐNG PHẢN ỨNG THỜI TIẾT (MƯA / TẠNH) & NGÀY ĐÊM CỦA NGƯỜI (HUMAN BEHAVIOR)
// ============================================================================
const CAMPUS_SHELTERS = [
  { id: 'canteen_porch', x: 22.0, y: 0, z: -12.0, name: 'Hiên Nhà Ăn CBNV' },
  { id: 'nhaA_canopy', x: 26.0, y: 0, z: -20.0, name: 'Sảnh mái hiên Nhà A' },
  { id: 'nhaA_main', x: 35.0, y: 0, z: -28.0, name: 'Hiên sảnh chính Nhà A' },
  { id: 'nhaB_dock', x: 58.0, y: 0, z: -32.5, name: 'Cửa cuốn Xưởng B' },
  { id: 'nhaB_east', x: 74.0, y: 0, z: -30.0, name: 'Mái che lối vào Xưởng B' },
  { id: 'ev_station', x: 26.0, y: 0, z: -24.0, name: 'Mái che Trạm sạc EV' },
  { id: 'bike_shelter', x: 79.5, y: 0, z: -46.0, name: 'Mái che xe điện Đông' },
  { id: 'guard_dk1', x: 74.0, y: 0, z: -18.0, name: 'Bốt bảo vệ Cổng 1' },
  { id: 'dk2_hq', x: -36.0, y: 0, z: -24.0, name: 'Sảnh đón Nhà điều hành DK2' },
  { id: 'dk2_warehouse', x: -72.0, y: 0, z: -55.0, name: 'Mái hiên Kho D2.1' },
  { id: 'dk2_gazebo', x: -108.0, y: 15.8, z: -82.0, name: 'Nhà chòi Vườn Lan' },
];

let campusToastTimeout = null;
function showCampusToast(message, type = 'info') {
  let toast = document.getElementById('campus-event-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'campus-event-toast';
    toast.className = 'campus-event-toast';
    document.body.appendChild(toast);
  }
  toast.innerHTML = message;
  toast.classList.add('show');

  if (campusToastTimeout) clearTimeout(campusToastTimeout);
  campusToastTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 4200);
}

function triggerEventSpeechBubbles(eventType) {
  const quotesMap = {
    rain: [
      "Mưa rồi mưa rồi vào nhà thôi! 🌧️🏃‍♂️",
      "Tuyệt vời, mưa cho cây lá xanh tốt! 🌱🌧️",
      "Mau chạy vào hiên trú mưa thôi anh em ơi! ☔💨",
      "Mát mẻ sảng khoái quá, cơn mưa rào tưới mát cả nhà máy! 🌦️✨",
      "Cất đồ vào xưởng nhanh lên nào! 📦🏃",
    ],
    sun: [
      "Tạnh mưa rồi, trời trong lành quá! ☀️✨",
      "Cầu vồng rực rỡ kìa mọi người ơi! 🌈😍",
      "Lại ra dạo mát và làm việc thôi nào! 🚶‍♂️💼",
      "Không khí sau mưa thơm mùi đất cỏ thật dễ chịu! 🍃🌿",
      "Trời hửng nắng rồi, tiếp tục một ngày năng suất nhé! 🛵💪",
    ],
    night: [
      "Tối rồi, đi ăn rồi tăng ca tiếp thôi! 🍜",
      "Đến giờ cơm tối rồi anh em ơi! 🍚🍗",
      "Đói bụng quá, cơm nhà ăn hôm nay có món gì nhỉ? 🍲😋",
      "Ăn no lấy sức lát chiến tiếp ca đêm nhé! 💪🌙",
      "Mùi sườn xào chua ngọt từ nhà ăn thơm nức mũi! 🤤✨",
    ],
    day: [
      "Bắt đầu ngày mới tràn đầy năng lượng nào! ☀️🛵",
      "Ăn cơm xong rồi, quay lại ca làm việc thôi! 💼🛠️",
      "Chiều mát mẻ, làm việc hiệu quả và an toàn nhé cả nhà! 🌇✨",
    ],
    snow: [
      "Oa, tuyết đầu mùa rơi rồi! Khuôn viên DK Bike đẹp ngỡ ngàng như tranh vẽ cổ tích! ❄️✨",
      "Tuyết phủ trắng các mái xưởng và ngọn đồi rồi kìa! Nhớ giữ ấm nhé mọi người! 🧣☃️",
      "Khung cảnh lãng mạn quá, tí hết ca làm ra sân bóng đắp người tuyết thôi! 📸❄️",
      "Tuyết rơi êm đềm quá, nhìn nhà máy phủ tuyết trắng tinh khôi thật bình yên! 🌨️✨",
    ],
  };

  const quotes = quotesMap[eventType] || quotesMap.day;
  const typeClass = eventType === 'rain' ? 'type-weather-rain' : (eventType === 'sun' ? 'type-weather-sun' : (eventType === 'snow' ? 'type-weather-snow' : 'type-night'));
  const icon = eventType === 'rain' ? '🌧️' : (eventType === 'sun' ? '☀️' : (eventType === 'snow' ? '❄️' : (eventType === 'night' ? '🌙' : '✨')));

  // Chọn 1 - 2 người để hiện popup thoại theo yêu cầu
  const candidates = [];
  wanderingPedestrians.forEach(p => { if (p.mesh) candidates.push(p.mesh); });
  if (candidates.length === 0) return;

  // Xáo trộn ngẫu nhiên
  const shuffled = candidates.slice().sort(() => 0.5 - Math.random());
  const selectedCount = eventType === 'snow' ? 2 : 1; // 1-2 câu nói popup khi tuyết bắt đầu rơi theo yêu cầu

  for (let i = 0; i < selectedCount; i++) {
    const mesh = shuffled[i];
    const quote = quotes[(i + Math.floor(Math.random() * quotes.length)) % quotes.length];
    setTimeout(() => {
      const el = document.createElement('div');
      el.className = `cute-speech-bubble ${typeClass}`;
      el.innerHTML = `
        <span class="speech-text">${quote}</span>
        <div class="speech-tail"></div>
      `;
      document.body.appendChild(el);

      activeSpeechBubbles.push({
        el: el,
        speakerMesh: mesh,
        heightOffset: 2.1,
        ttl: 4.5,
        leaving: false,
      });
    }, i * 350);
  }
}

// ============================================================================
// 14. Animated Vehicles & Rail Transit
// ============================================================================
function setupAnimatedVehicles() {
  // 1. Xe máy điện DK Roma SX Đỏ chạy thử nghiệm trên Test Track (KCS Tester chạy dọc đường thử riêng phía Đông & Bắc)
  animatedBike = createDKRomaSX(0xdc2626, 'DK Roma SX Chạy Thử KCS', {
    withRider: true,
    riderShirt: 0x0284c7,
    helmetColor: 0xfacc15,
  });
  animatedBike.position.set(79.5, 0.05, -28.0);
  animatedBike.rotation.y = Math.PI / 2;
  scene.add(animatedBike);

  // 2. Xe máy điện DK Gogo Xanh Dương chạy tuần tra đại lộ nội bộ DK1
  const cruiserBike = createDKGogo(0x0284c7, 'DK Gogo Tuần Tra', {
    withRider: true,
    riderShirt: 0xea580c,
    helmetColor: 0x0284c7,
  });
  cruiserBike.position.set(74, 0.05, -18);
  cruiserBike.rotation.y = Math.atan2(4, -19);
  scene.add(cruiserBike);

  // 3. Xe đạp điện thể thao DK E-Bike chạy dọc lối dạo ven sông & đường sắt
  const eBike = createDKElectricBicycle(0xf8fafc, 'DK E-Bike Sport Sinh Thái', { withRider: true });
  eBike.position.set(82, 0.05, -15);
  eBike.rotation.y = -Math.PI / 2;
  scene.add(eBike);

  // 4. Xe điện 3 bánh chở hàng luân chuyển phụ tùng (chạy trên đường nhựa nội bộ Z = -26.5 phía trước Nhà A & Xưởng B)
  const cargoHauler = createDKThreeWheelerCargo(0x10b981, 'Xe 3 bánh Logistics DK1');
  cargoHauler.position.set(35.0, 0.05, -26.5);
  cargoHauler.rotation.y = 0;
  scene.add(cargoHauler);

  // Tuyến đường chạy thử khép kín dọc theo Test Track phía Đông & quay đầu ở sân Bắc / sân Nam (100% ngoài trời, cách tường xưởng B > 1.95m)
  const testTrackPts = [
    new THREE.Vector3(79.5, 0.05, -28.0),
    new THREE.Vector3(79.5, 0.05, -45.0),
    new THREE.Vector3(79.5, 0.05, -62.0),
    new THREE.Vector3(79.5, 0.05, -75.0),
    new THREE.Vector3(79.2, 0.05, -78.5),
    new THREE.Vector3(78.5, 0.05, -80.0),
    new THREE.Vector3(77.0, 0.05, -80.5),
    new THREE.Vector3(74.0, 0.05, -80.5),
    new THREE.Vector3(71.0, 0.05, -80.2),
    new THREE.Vector3(69.0, 0.05, -79.5),
    new THREE.Vector3(71.0, 0.05, -78.8),
    new THREE.Vector3(74.0, 0.05, -78.8),
    new THREE.Vector3(77.0, 0.05, -79.2),
    new THREE.Vector3(78.2, 0.05, -78.2),
    new THREE.Vector3(78.2, 0.05, -74.0),
    new THREE.Vector3(78.2, 0.05, -62.0),
    new THREE.Vector3(78.2, 0.05, -45.0),
    new THREE.Vector3(78.2, 0.05, -30.0),
    new THREE.Vector3(77.5, 0.05, -27.5),
    new THREE.Vector3(76.5, 0.05, -26.0),
    new THREE.Vector3(78.0, 0.05, -25.5),
    new THREE.Vector3(79.5, 0.05, -26.5),
  ];
  const testTrackCurve = new THREE.CatmullRomCurve3(testTrackPts, true, 'centripetal', 0.2);

  // Lưu vào danh sách quản lý hoạt cảnh phương tiện Khối 8
  animatedVehicles = [
    {
      type: 'testTrackBike',
      mesh: animatedBike,
      curve: testTrackCurve,
      progress: 0,
      speed: 12.0, // 12 m/s (~43 km/h tốc độ thử nghiệm KCS)
      curveLen: testTrackCurve.getLength(),
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
      speed: 3.5,
      minX: 28.0, // Trước sảnh & trạm sạc Nhà A
      maxX: 53.0, // Đầu làn bốc hàng trước Xưởng B (không đâm vào tường Nhà B X=53.75 hay đuôi xe tải X=58)
      dir: 1,
      z: -26.5,  // Chạy trên mặt đường nhựa nội bộ rộng rãi, cách xa tường xưởng B > 6.7 mét
    },
    {
      type: 'dk2BrakeTestBike',
      mesh: null, // Sẽ gán sau khi khởi tạo dk2TestBike1 bên dưới
      currentX: -75,
      minX: -110,
      maxX: -40,
      speed: 12.5,
      dir: 1,
      phase: 'run',
      pauseTimer: 0,
      z: 1.0,
    },
    {
      type: 'dk2OvalTestBike',
      mesh: null, // Sẽ gán sau khi khởi tạo dk2TestBike2 bên dưới
      angle: 0,
      speed: 0.38,
      centerX: -78,
      centerZ: -14,
      radiusX: 28,
      radiusZ: 12,
    },
  ];

  // 5. Xe máy điện DK Roma SX Đỏ thử phanh & tốc độ tại làn Test Track xanh DK2 (KCS Tester 1)
  const dk2TestBike1 = createDKRomaSX(0xdc2626, 'DK Roma SX Thử Nghiệm DK2', {
    withRider: true,
    riderShirt: 0x0284c7,
    helmetColor: 0xfacc15,
  });
  dk2TestBike1.position.set(-75, 0.05, 1.0);
  scene.add(dk2TestBike1);
  interactiveObjects.push(dk2TestBike1);
  animatedVehicles[4].mesh = dk2TestBike1;

  // 6. Xe máy điện DK Nova Xanh chạy thử vòng quanh sân xe DK2 (KCS Tester 2)
  const dk2TestBike2 = createDKNova(0x0284c7, 'DK Nova Thử Vòng Sân DK2', {
    withRider: true,
    riderShirt: 0x16a34a,
    helmetColor: 0xffffff,
  });
  dk2TestBike2.position.set(-78, 0.05, -14);
  scene.add(dk2TestBike2);
  interactiveObjects.push(dk2TestBike2);
  animatedVehicles[5].mesh = dk2TestBike2;

  // 7. Xe tải thùng 5 tấn DK Logistics (Khối 9: Cửa mở được, phục vụ chu kỳ bốc xếp khép kín)
  activeLogisticsTruck = create5TonLogisticsTruck(0x0284c7, 'Xe tải logistics 5 tấn DK Bike (5T)');
  animatedTruck = activeLogisticsTruck.truckGroup;
  scene.add(animatedTruck);

  // Pallet hàng nhập ban đầu trên sàn xe
  ensureTruckInboundPalletLoaded();
}

// Đoàn tàu hơi nước cổ điển đỏ rực rỡ, các toa xe màu sắc & Dải khói mây trắng khổng lồ (như ảnh 1)

// ============================================================================
// CHU TRÌNH LOGISTICS LIÊN TỤC KHÉP KÍN (CONTINUOUS LOGISTICS STATE MACHINE)
// Chu trình: Xe tải từ đường ĐT234 -> Cổng DK1 -> Lùi vào bến bốc hàng Xưởng B ->
// Xe nâng xúc pallet xe máy điện từ Xưởng B xếp lên xe tải ->
// Đóng cửa thùng, cửa xưởng -> Xe tải xuất bến qua Cổng DK1 ra đường ĐT234 -> Lặp lại
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
  const barrier1 = animatedBarriers.find((b) => b.id === 'barrierDK1');

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

  // Vị trí đỗ của xe tải & xe nâng:
  // Xe tải đỗ tại (58.0, 0, -24.5), rotation.y = 0. Đuôi xe quay về Z âm (-28.53).
  // Cửa cuốn xưởng B (doorB1) tại Z = -33.17.
  // Khoảng cách từ đuôi xe tải tới cửa xưởng B là 4.64 mét (khoảng bốc dỡ cực kỳ rộng rãi, tuyệt đối không va chạm).
  // Xe nâng chờ sẵn bên trong Xưởng B tại (58.0, 0, -35.6, rotY = -Math.PI / 2).

  // =========================================================================
  // GIAI ĐOẠN 1: XE TẢI TIẾN TỪ ĐƯỜNG ĐT234 VÀO CỔNG 1 (0.0s - 7.5s)
  // =========================================================================
  if (ct < 7.5) {
    const t = smooth(ct / 7.5);
    // Từ đường ĐT234 (82, 0, 10) rẽ vào Cổng 1 (77.5, 0, -18) -> đường nội bộ (66, 0, -20)
    if (t < 0.5) {
      const subT = t / 0.5;
      truck.position.x = lerp(82.0, 77.5, subT);
      truck.position.z = lerp(10.0, -18.0, subT);
      truck.rotation.y = lerp(-Math.PI, -Math.PI * 0.75, subT);
    } else {
      const subT = (t - 0.5) / 0.5;
      truck.position.x = lerp(77.5, 66.0, subT);
      truck.position.z = lerp(-18.0, -20.0, subT);
      truck.rotation.y = lerp(-Math.PI * 0.75, -Math.PI / 2, subT);
    }

    // Barie Cổng 1 tự động nâng lên chào đón xe tải từ đường vào
    if (barrier1) {
      barrier1.targetAngle = (ct >= 1.2 && ct <= 5.8) ? Math.PI / 2.3 : 0.0;
    }
    const guardTarget = (ct >= 1.2 && ct <= 5.8) ? 1.0 : 0.0;
    guardSaluteAngle += (guardTarget - guardSaluteAngle) * delta * 4;

    // Đóng cửa thùng xe tải (Cửa cuốn xưởng B auto mở liên tục)
    doorL.rotation.y = 0;
    doorR.rotation.y = 0;
    if (doorB1) doorB1.targetProgress = 1.0;

    // Xe nâng chờ sẵn bên trong Xưởng B, mang sẵn pallet xe máy điện thành phẩm
    fl.position.set(58.0, 0, -36.5);
    fl.rotation.y = -Math.PI / 2;
    flLift.position.y = activeForklift.initialY;
    ensureForkliftOutboundPalletLoaded();
  }
  // =========================================================================
  // GIAI ĐOẠN 2: CHẠY TRÊN ĐƯỜNG NỘI BỘ & CUA VÀO SÂN BỐC DỠ XƯỞNG B (7.5s - 14.5s)
  // =========================================================================
  else if (ct < 14.5) {
    const t = smooth((ct - 7.5) / 7.0);

    if (t < 0.45) {
      const subT = t / 0.45;
      // Chạy dọc đường nội bộ từ (66, -20) -> (58, -20)
      truck.position.x = lerp(66.0, 58.0, subT);
      truck.position.z = -20.0;
      truck.rotation.y = -Math.PI / 2;
    } else if (t < 0.7) {
      const subT = (t - 0.45) / 0.25;
      // Bắt đầu cua mũi xe chuẩn bị lùi vào bến: (58, -20) -> (58, -21.5)
      truck.position.x = 58.0;
      truck.position.z = lerp(-20.0, -21.5, subT);
      truck.rotation.y = lerp(-Math.PI / 2, 0, subT);
    } else {
      const subT = (t - 0.7) / 0.3;
      // Lùi thẳng đuôi vào bến bốc hàng Xưởng B: (58, -21.5) -> (58, -24.5)
      truck.position.x = 58.0;
      truck.position.z = lerp(-21.5, -24.5, subT);
      truck.rotation.y = 0;
    }

    // Barie hạ xuống & bảo vệ hạ tay
    if (barrier1) barrier1.targetAngle = 0;
    guardSaluteAngle += (0.0 - guardSaluteAngle) * delta * 3;

    doorL.rotation.y = 0;
    doorR.rotation.y = 0;
    if (doorB1) doorB1.targetProgress = 1.0;

    fl.position.set(58.0, 0, -36.5);
    fl.rotation.y = -Math.PI / 2;
    flLift.position.y = activeForklift.initialY;
    ensureForkliftOutboundPalletLoaded();
  }
  // =========================================================================
  // GIAI ĐOẠN 3: LÙI ĐỖ CHUẨN, MỞ CỬA CUỐN XƯỞNG B & MỞ CỬA THÙNG XE (14.5s - 18.0s)
  // =========================================================================
  else if (ct < 18.0) {
    const t = smooth((ct - 14.5) / 3.5);
    truck.position.set(58.0, 0, -24.5);
    truck.rotation.y = 0;

    // Cửa cuốn Xưởng B giữ mở liên tục
    if (doorB1) doorB1.targetProgress = 1.0;

    // Cửa thùng xe tải mở 2 cánh ra 110 độ
    const doorAngle = smooth(Math.max(0, (t - 0.2) / 0.8)) * 1.92;
    doorL.rotation.y = -doorAngle;
    doorR.rotation.y = doorAngle;

    // Càng nâng bắt đầu nâng pallet xe điện lên độ cao sàn thùng xe (1.22m)
    fl.position.set(58.0, 0, -36.5);
    fl.rotation.y = -Math.PI / 2;
    flLift.position.y = lerp(activeForklift.initialY, 1.22, t);
    ensureForkliftOutboundPalletLoaded();
  }
  // =========================================================================
  // GIAI ĐOẠN 4: XE NÂNG TIẾN RA BỐC PALLET XE MÁY ĐIỆN LÊN XE TẢI (18.0s - 29.0s)
  // =========================================================================
  else if (ct < 29.0) {
    const t = (ct - 18.0) / 11.0;
    truck.position.set(58.0, 0, -24.5);
    truck.rotation.y = 0;
    doorL.rotation.y = -1.92;
    doorR.rotation.y = 1.92;
    if (doorB1) doorB1.targetProgress = 1.0;

    // t: 0.0 -> 0.35: Xe nâng tiến thẳng từ trong xưởng (z = -35.6) tới sát thùng xe tải (z = -29.6)
    // Pallet xe điện luồn vào đúng vị trí sàn thùng xe tải
    if (t < 0.35) {
      const subT = smooth(t / 0.35);
      fl.position.set(58.0, 0, lerp(-36.5, -29.6, subT));
      fl.rotation.y = -Math.PI / 2;
      flLift.position.y = 1.22;
      ensureForkliftOutboundPalletLoaded();
    }
    // t: 0.35 -> 0.55: Hạ càng nâng xuống sàn xe để đặt pallet xe điện lên thùng xe tải
    else if (t < 0.55) {
      const subT = smooth((t - 0.35) / 0.20);
      fl.position.set(58.0, 0, -29.6);
      fl.rotation.y = -Math.PI / 2;
      flLift.position.y = lerp(1.22, 1.08, subT);

      // Chuyển giao pallet xe máy điện sang thùng xe tải
      if (subT > 0.6) {
        attachOutboundPalletToTruck();
      }
    }
    // t: 0.55 -> 0.95: Xe nâng lùi thẳng trở lại bên trong Xưởng B (z = -35.6)
    else if (t < 0.95) {
      const subT = smooth((t - 0.55) / 0.40);
      fl.position.set(58.0, 0, lerp(-29.6, -36.5, subT));
      fl.rotation.y = -Math.PI / 2;
      flLift.position.y = lerp(1.08, activeForklift.initialY, subT);
    }
    // t: 0.95 -> 1.0: Đã lùi an toàn bên trong xưởng, sẵn sàng ca tiếp
    else {
      fl.position.set(58.0, 0, -36.5);
      fl.rotation.y = -Math.PI / 2;
      flLift.position.y = activeForklift.initialY;
    }
  }
  // =========================================================================
  // GIAI ĐOẠN 5: ĐÓNG CỬA THÙNG XE & HẠ CỬA CUỐN XƯỞNG B (29.0s - 33.0s)
  // =========================================================================
  else if (ct < 33.0) {
    const t = smooth((ct - 29.0) / 4.0);
    truck.position.set(58.0, 0, -24.5);
    truck.rotation.y = 0;

    // 2 Cánh cửa thùng xe tải khép chặt
    doorL.rotation.y = -1.92 * (1 - t);
    doorR.rotation.y = 1.92 * (1 - t);

    // Cửa cuốn Xưởng B giữ mở liên tục
    if (doorB1) doorB1.targetProgress = 1.0;

    fl.position.set(58.0, 0, -36.5);
    fl.rotation.y = -Math.PI / 2;
    flLift.position.y = activeForklift.initialY;
  }
  // =========================================================================
  // GIAI ĐOẠN 6: XE TẢI CHỞ HÀNG RỜI BẾN, RA ĐƯỜNG NỘI BỘ (33.0s - 40.0s)
  // =========================================================================
  else if (ct < 40.0) {
    const t = smooth((ct - 33.0) / 7.0);
    doorL.rotation.y = 0;
    doorR.rotation.y = 0;
    if (doorB1) doorB1.targetProgress = 1.0;

    fl.position.set(58.0, 0, -36.5);
    fl.rotation.y = -Math.PI / 2;
    flLift.position.y = activeForklift.initialY;

    if (t < 0.4) {
      const subT = t / 0.4;
      // Xe tải tiến thẳng ra khỏi bến: (58, -24.5) -> (58, -20.0)
      truck.position.x = 58.0;
      truck.position.z = lerp(-24.5, -20.0, subT);
      truck.rotation.y = lerp(0, Math.PI / 2, subT);
    } else {
      const subT = (t - 0.4) / 0.6;
      // Chạy dọc đường nội bộ hướng về Cổng 1: (58, -20) -> (72, -20)
      truck.position.x = lerp(58.0, 72.0, subT);
      truck.position.z = -20.0;
      truck.rotation.y = Math.PI / 2;
    }

    // Barie Cổng 1 bắt đầu mở lên khi xe tải tiến đến gần
    if (barrier1) {
      barrier1.targetAngle = (ct >= 36.5) ? Math.PI / 2.3 : 0;
    }
    const guardTarget = (ct >= 36.5) ? 1.0 : 0.0;
    guardSaluteAngle += (guardTarget - guardSaluteAngle) * delta * 4;
  }
  // =========================================================================
  // GIAI ĐOẠN 7: XUẤT QUA CỔNG 1, RẼ RA ĐƯỜNG ĐT234 (40.0s - 48.0s)
  // =========================================================================
  else {
    const t = smooth((ct - 40.0) / 8.0);
    doorL.rotation.y = 0;
    doorR.rotation.y = 0;
    if (doorB1) doorB1.targetProgress = 1.0;

    fl.position.set(58.0, 0, -36.5);
    fl.rotation.y = -Math.PI / 2;
    flLift.position.y = activeForklift.initialY;

    if (t < 0.45) {
      const subT = t / 0.45;
      // Tiến qua Cổng DK1: (72, -20) -> (77.5, -20) -> (79, -15)
      truck.position.x = lerp(72.0, 79.0, subT);
      truck.position.z = lerp(-20.0, -15.0, subT);
      truck.rotation.y = lerp(Math.PI / 2, Math.PI * 0.75, subT);
    } else {
      const subT = (t - 0.45) / 0.55;
      // Rẽ ra đường ĐT234 đi về phía Nam: (79, -15) -> (82, 10)
      truck.position.x = lerp(79.0, 82.0, subT);
      truck.position.z = lerp(-15.0, 10.0, subT);
      truck.rotation.y = lerp(Math.PI * 0.75, Math.PI, subT);
    }

    // Barie đóng lại sau khi xe qua cổng
    if (barrier1) {
      barrier1.targetAngle = (t < 0.5) ? Math.PI / 2.3 : 0.0;
    }
    const guardTarget = (t < 0.5) ? 1.0 : 0.0;
    guardSaluteAngle += (guardTarget - guardSaluteAngle) * delta * 4;

    // Khi sắp hết chu kỳ, chuẩn bị sẵn pallet xe điện cho xe nâng ở chu kỳ tiếp theo
    if (t > 0.85) {
      ensureForkliftOutboundPalletLoaded();
    }
  }

  // Cập nhật tư thế chào của Bảo vệ Cổng DK1
  if (guardGate1 && guardGate1.userData.rightArm) {
    guardGate1.userData.rightArm.rotation.x = -guardSaluteAngle * (Math.PI / 1.7);
    guardGate1.userData.rightArm.rotation.z = -guardSaluteAngle * (Math.PI / 4);
  }
}

// Helpers chuyển giao Pallet xe máy điện giữa Xe nâng và Xe tải
function ensureForkliftOutboundPalletLoaded() {
  if (!truckOutboundPallet) {
    truckOutboundPallet = createForkliftPalletCargo('ebikes');
  }
  if (activeForklift && activeForklift.liftGroup) {
    if (truckOutboundPallet.parent !== activeForklift.liftGroup) {
      activeForklift.liftGroup.add(truckOutboundPallet);
    }
    truckOutboundPallet.position.set(1.2, 0.08, 0);
    truckOutboundPallet.rotation.set(0, 0, 0);
  }
}

function attachOutboundPalletToTruck() {
  if (truckOutboundPallet && activeLogisticsTruck && activeLogisticsTruck.truckPalletSlot) {
    if (truckOutboundPallet.parent !== activeLogisticsTruck.truckPalletSlot) {
      activeLogisticsTruck.truckPalletSlot.add(truckOutboundPallet);
    }
    truckOutboundPallet.position.set(0, 0, 0);
    truckOutboundPallet.rotation.set(0, 0, 0);
  }
}

function ensureTruckInboundPalletLoaded() {
  // Tương thích ngược nếu còn lời gọi
  ensureForkliftOutboundPalletLoaded();
}

function attachInboundPalletToForklift() {
  ensureForkliftOutboundPalletLoaded();
}

function detachInboundPalletToWarehouse() {
  // Không cần thiết trong luồng xuất xưởng xe điện
}

function attachOutboundPalletToForklift() {
  ensureForkliftOutboundPalletLoaded();
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

// ============================================================================
// HỆ THỐNG CÁ BƠI LỘI TỰ NHIÊN HỮU CƠ (ORGANIC AUTONOMOUS FISH SWIMMING)
// Cá bơi thẳng, uốn lượn thong thả đổi hướng, tránh bờ êm dịu, không xoay vòng vòng
// ============================================================================
function updateRealisticSwimmingFish(fish, delta, time, isBox) {
  // 1. Hoạt cảnh cá nhảy búng nước nhào lộn trên không (dành riêng cho cá ao đồi)
  if (fish.isJumper) {
    if (fish.isJumping) {
      fish.jumpProgress += delta / fish.jumpDuration;
      if (fish.jumpProgress >= 1.0) {
        fish.isJumping = false;
        fish.jumpTimer = 4.0 + Math.random() * 6.5; // Nghỉ 4 - 10s trước khi nhảy tiếp
        createWaterSplash(fish.x, 0.08, fish.z, fish.parentGroup);
      } else {
        const p = fish.jumpProgress;
        const jumpCurve = Math.sin(p * Math.PI);
        const jHeight = jumpCurve * 1.35; // Vọt lên khỏi mặt nước 1.35m

        // Tiếp tục lướt tới phía trước theo quán tính
        const airSpeed = fish.speed * 1.3;
        fish.x += Math.sin(fish.heading) * airSpeed * delta;
        fish.z += Math.cos(fish.heading) * airSpeed * delta;

        fish.mesh.position.set(fish.x, fish.baseY + jHeight, fish.z);
        fish.mesh.rotation.y = fish.heading;
        // Chúc đầu xuống khi rơi (pitch)
        fish.mesh.rotation.x = -Math.cos(p * Math.PI) * 0.8;
        fish.mesh.rotation.z = Math.sin(p * Math.PI) * 0.18;

        if (fish.tail) {
          fish.tail.rotation.y = Math.sin(time * 0.035) * 0.75;
        }
        return;
      }
    } else {
      fish.jumpTimer -= delta;
      if (fish.jumpTimer <= 0) {
        fish.isJumping = true;
        fish.jumpProgress = 0;
        fish.jumpDuration = 1.1 + Math.random() * 0.35;
        createWaterSplash(fish.x, 0.08, fish.z, fish.parentGroup);
      }
    }
  }

  // 2. Chuyển động bơi tự nhiên (Wandering & Natural Cruising)
  // Đổi hướng ngẫu nhiên thong thả sau mỗi vài giây
  fish.wanderTimer -= delta;
  if (fish.wanderTimer <= 0) {
    // Góc uốn lượn mềm mại +/- 40 độ
    const jitter = (Math.random() - 0.5) * 1.4;
    fish.targetHeading = fish.heading + jitter;
    // Tốc độ bơi thong dong
    fish.targetSpeed = 0.26 + Math.random() * 0.28;
    fish.wanderTimer = 2.5 + Math.random() * 4.0;
  }

  // Cú quẫy nước bứt tốc ngẫu nhiên rồi lướt êm dịu (Burst & Glide)
  fish.burstTimer -= delta;
  if (fish.burstTimer <= 0) {
    fish.targetSpeed = 0.65 + Math.random() * 0.22;
    fish.burstTimer = 5.0 + Math.random() * 6.5;
  }

  // 3. Tránh mép bờ hồ êm ái, mượt mà (Soft boundary avoidance)
  if (isBox) {
    const b = fish.boundary;
    const margin = 0.75;
    let steerX = 0, steerZ = 0;

    if (fish.x > b.maxX - margin && Math.sin(fish.heading) > 0) steerX = -1;
    else if (fish.x < b.minX + margin && Math.sin(fish.heading) < 0) steerX = 1;

    if (fish.z > b.maxZ - margin && Math.cos(fish.heading) > 0) steerZ = -1;
    else if (fish.z < b.minZ + margin && Math.cos(fish.heading) < 0) steerZ = 1;

    if (steerX !== 0 || steerZ !== 0) {
      // Hướng lái nhẹ nhàng về phía lòng hồ
      fish.targetHeading = Math.atan2(steerX, steerZ) + (Math.random() - 0.5) * 0.35;
      fish.turnSpeed = 2.2;
    } else {
      fish.turnSpeed = 1.2;
    }

    // Giới hạn an toàn tuyệt đối
    fish.x = Math.max(b.minX, Math.min(b.maxX, fish.x));
    fish.z = Math.max(b.minZ, Math.min(b.maxZ, fish.z));
  } else {
    // Hồ elip ao đồi
    const b = fish.boundary;
    const normDist = (fish.x * fish.x) / (b.rx * b.rx) + (fish.z * fish.z) / (b.rz * b.rz);
    const outwardDot = fish.x * Math.sin(fish.heading) + fish.z * Math.cos(fish.heading);

    if (normDist > 0.78 && outwardDot > 0) {
      // Bơi lượn hướng về phía tâm hồ
      const angleToCenter = Math.atan2(-fish.x, -fish.z);
      fish.targetHeading = angleToCenter + (Math.random() - 0.5) * 0.55;
      fish.turnSpeed = 2.0;
    } else {
      fish.turnSpeed = 1.1;
    }

    if (normDist > 1.0) {
      const scale = 0.95 / Math.sqrt(normDist);
      fish.x *= scale;
      fish.z *= scale;
    }
  }

  // 4. Bẻ lái mượt mà theo góc quay ngắn nhất (Shortest arc steering)
  let diff = fish.targetHeading - fish.heading;
  diff = Math.atan2(Math.sin(diff), Math.cos(diff));
  const maxTurn = fish.turnSpeed * delta;
  if (Math.abs(diff) <= maxTurn) {
    fish.heading = fish.targetHeading;
  } else {
    fish.heading += Math.sign(diff) * maxTurn;
  }

  // 5. Nội suy tốc độ & cập nhật tọa độ
  fish.speed = THREE.MathUtils.lerp(fish.speed, fish.targetSpeed, delta * 2.2);
  fish.x += Math.sin(fish.heading) * fish.speed * delta;
  fish.z += Math.cos(fish.heading) * fish.speed * delta;

  // Nhấp nhô bơi lặn nhẹ nhàng theo phương Y
  const verticalBob = Math.sin(time * 0.0025 + fish.phase) * 0.015;
  fish.y = fish.baseY + verticalBob;

  fish.mesh.position.set(fish.x, fish.y, fish.z);

  // 6. Uốn lượn thân cá hình chữ S theo nhịp bơi
  const waggleFreq = 7.0 + fish.speed * 8.5;
  const wiggle = Math.sin(time * 0.001 * waggleFreq + fish.phase);
  fish.mesh.rotation.y = fish.heading + wiggle * 0.07;
  fish.mesh.rotation.x = 0;
  // Nghiêng thân nhẹ khi chuyển hướng (banking)
  fish.mesh.rotation.z = -diff * 0.22;

  // 7. Quẫy vây đuôi nhịp nhàng ăn khớp với tốc độ bơi
  if (fish.tail) {
    fish.tail.rotation.y = Math.sin(time * 0.001 * waggleFreq + fish.phase - 0.6) * (0.38 + fish.speed * 0.32);
  }
}

function updateAnimatedObjects(delta, time) {
  // 1. Đội xe máy điện & phương tiện lưu thông khuôn viên DK Bike (Khối 8)
  animatedVehicles.forEach((veh) => {
    if (veh.type === 'testTrackBike') {
      // Chạy dọc theo đường thử xe testTrackCurve bên ngoài Xưởng B (hoàn toàn ngoài trời, không đâm xuyên tường)
      const dist = (veh.speed || 12.0) * delta;
      veh.progress = (veh.progress + dist / (veh.curveLen || 129.5)) % 1.0;

      const pt = veh.curve.getPointAt(veh.progress);
      veh.mesh.position.set(pt.x, 0.05, pt.z);

      const tangent = veh.curve.getTangentAt(veh.progress);
      // Đầu xe (+X) quay theo tiếp tuyến vector chuyển động
      const heading = Math.atan2(-tangent.z, tangent.x);
      veh.mesh.rotation.y = heading;

      // Nghiêng xe tự nhiên khi vào các góc cua (Roll quanh trục X tiến của xe)
      const nextTangent = veh.curve.getTangentAt((veh.progress + 0.01) % 1.0);
      const lateralCurv = (tangent.x * nextTangent.z - tangent.z * nextTangent.x);
      const targetRoll = THREE.MathUtils.clamp(-lateralCurv * 45, -0.22, 0.22);
      veh.mesh.rotation.x = targetRoll;
      veh.mesh.rotation.z = 0;

      // Quay bánh xe theo tốc độ di chuyển
      if (veh.mesh.userData.frontWheel) veh.mesh.userData.frontWheel.rotation.z -= delta * 18;
      if (veh.mesh.userData.rearWheel) veh.mesh.userData.rearWheel.rotation.z -= delta * 18;
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

      // Đầu xe (+X) hướng theo hướng di chuyển p1 -> p2
      const targetAngle = Math.atan2(-(p2.z - p1.z), p2.x - p1.x);
      veh.mesh.rotation.y = targetAngle;
      veh.mesh.rotation.x = 0;
      veh.mesh.rotation.z = 0;

      if (veh.mesh.userData.frontWheel) veh.mesh.userData.frontWheel.rotation.z -= delta * 10;
      if (veh.mesh.userData.rearWheel) veh.mesh.userData.rearWheel.rotation.z -= delta * 10;
    } else if (veh.type === 'eBikePerimeter') {
      // Xe đạp điện đi thong thả
      veh.mesh.position.z += veh.dir * veh.speed * delta;
      if (veh.mesh.position.z > veh.maxZ) {
        veh.dir = -1;
        veh.mesh.rotation.y = Math.PI / 2;
      } else if (veh.mesh.position.z < veh.minZ) {
        veh.dir = 1;
        veh.mesh.rotation.y = -Math.PI / 2;
      }
      if (veh.mesh.userData.crank) {
        veh.mesh.userData.crank.rotation.z -= delta * 6;
      }
      if (veh.mesh.userData.wheels) {
        veh.mesh.userData.wheels.forEach((w) => {
          w.rotation.z -= veh.dir * delta * 10;
        });
      }
    } else if (veh.type === 'cargoHauler') {
      // Xe 3 bánh vận chuyển phụ tùng chạy trên đường nhựa nội bộ phía trước (Z = -26.5), không đâm vào tường xưởng B
      veh.mesh.position.x += veh.dir * veh.speed * delta;
      veh.mesh.position.z = veh.z || -26.5;
      if (veh.mesh.position.x > veh.maxX) {
        veh.mesh.position.x = veh.maxX;
        veh.dir = -1;
        veh.mesh.rotation.y = Math.PI;
      } else if (veh.mesh.position.x < veh.minX) {
        veh.mesh.position.x = veh.minX;
        veh.dir = 1;
        veh.mesh.rotation.y = 0;
      }
    } else if (veh.type === 'dk2BrakeTestBike') {
      if (!veh.mesh) return;
      if (veh.phase === 'pause') {
        veh.pauseTimer -= delta;
        if (veh.pauseTimer <= 0) {
          veh.phase = 'run';
          veh.dir *= -1;
        }
      } else {
        const distToEnd = veh.dir === 1 ? (veh.maxX - veh.currentX) : (veh.currentX - veh.minX);
        const distFromStart = veh.dir === 1 ? (veh.currentX - veh.minX) : (veh.maxX - veh.currentX);
        let curV = veh.speed;
        if (distToEnd < 14) {
          curV = Math.max(1.8, (distToEnd / 14) * veh.speed);
        } else if (distFromStart < 10) {
          curV = Math.max(2.5, (distFromStart / 10) * veh.speed);
        }

        veh.currentX += veh.dir * curV * delta;

        if (veh.dir === 1 && veh.currentX >= veh.maxX) {
          veh.currentX = veh.maxX;
          veh.phase = 'pause';
          veh.pauseTimer = 1.4;
        } else if (veh.dir === -1 && veh.currentX <= veh.minX) {
          veh.currentX = veh.minX;
          veh.phase = 'pause';
          veh.pauseTimer = 1.4;
        }

        if (veh.mesh.userData.frontWheel) veh.mesh.userData.frontWheel.rotation.z -= delta * (curV * 2.2);
        if (veh.mesh.userData.rearWheel) veh.mesh.userData.rearWheel.rotation.z -= delta * (curV * 2.2);
      }

      veh.mesh.position.set(veh.currentX, 0.05, veh.z);
      veh.mesh.rotation.y = veh.dir === 1 ? 0 : Math.PI;
      veh.mesh.rotation.x = 0;
      veh.mesh.rotation.z = 0;
    } else if (veh.type === 'dk2OvalTestBike') {
      if (!veh.mesh) return;
      veh.angle += delta * veh.speed;
      const t = veh.angle;
      const x = veh.centerX + Math.sin(t) * veh.radiusX;
      const z = veh.centerZ + Math.cos(t) * veh.radiusZ;
      veh.mesh.position.set(x, 0.05, z);

      const nextX = veh.centerX + Math.sin(t + 0.06) * veh.radiusX;
      const nextZ = veh.centerZ + Math.cos(t + 0.06) * veh.radiusZ;
      const heading = Math.atan2(-(nextZ - z), nextX - x);
      veh.mesh.rotation.y = heading;
      veh.mesh.rotation.x = -0.12 - 0.04 * Math.sin(t) * Math.sin(t);
      veh.mesh.rotation.z = 0;

      if (veh.mesh.userData.frontWheel) veh.mesh.userData.frontWheel.rotation.z -= delta * 12;
      if (veh.mesh.userData.rearWheel) veh.mesh.userData.rearWheel.rotation.z -= delta * 12;
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

  // 6. Thuyền nan du ngoạn bồng bềnh và bơi xuôi ngược trên dòng sông máng (Z = -82, cách xa đường tàu > 15m)
  if (rowingBoat) {
    const boatPhase = (time * 0.0006) % (Math.PI * 2);
    const zOffset = Math.sin(boatPhase) * 6.5; // Bơi qua lại giữa Z = -75.5 và -88.5
    rowingBoat.position.z = -82.0 + zOffset;
    rowingBoat.position.x = 91.8 + Math.sin(boatPhase * 0.5) * 0.35;
    rowingBoat.position.y = -0.30 + Math.sin(time * 0.003) * 0.025;
    rowingBoat.rotation.z = Math.sin(time * 0.002) * 0.025;
    const forwardDir = Math.cos(boatPhase) > 0 ? 0.05 : Math.PI - 0.05;
    rowingBoat.rotation.y = forwardDir + Math.sin(time * 0.002) * 0.03;

    // Bác lái đò khua mái chèo nhịp nhàng
    if (rowingBoat.userData && rowingBoat.userData.oar) {
      rowingBoat.userData.oar.rotation.x = Math.sin(time * 0.004) * 0.35;
    }
  }

  // 7. Đàn cá Koi & cá sông bơi lội và nhảy vút lên khỏi mặt nước sông máng cạnh đường tàu
  updateRiverFish(delta, time);

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

  // Khói lam chiều bốc nhẹ từ các nhà dân ven đường ĐT234 (Yêu cầu 3)
  roadsideSmokePuffs.forEach((puff) => {
    puff.progress = (puff.progress + delta * puff.speed) % 1.0;
    const prg = puff.progress;
    puff.mesh.position.y = puff.baseY + prg * puff.maxHeight;
    const sway = Math.sin(prg * Math.PI * 2 + puff.swayPhase);
    puff.mesh.position.x = puff.baseX + sway * 0.35 + prg * 0.45;
    puff.mesh.position.z = puff.baseZ + Math.cos(prg * Math.PI * 2 + puff.swayPhase) * 0.25;
    const currentScale = 0.3 + Math.sin(prg * Math.PI) * puff.maxScale;
    puff.mesh.scale.setScalar(currentScale);
    puff.mesh.material.opacity = Math.sin(prg * Math.PI) * 0.55;
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

  // B1. Người đi bộ lên xuống Vườn Lan trên đồi sinh thái DK2
  hillHikers.forEach((h) => {
    if (h.pauseTimer > 0) {
      h.pauseTimer -= delta;
      if (h.mesh.userData.leftLeg) h.mesh.userData.leftLeg.rotation.x *= 0.85;
      if (h.mesh.userData.rightLeg) h.mesh.userData.rightLeg.rotation.x *= 0.85;
      if (h.mesh.userData.leftArm) h.mesh.userData.leftArm.rotation.x *= 0.85;
      if (h.mesh.userData.rightArm) h.mesh.userData.rightArm.rotation.x *= 0.85;
      if (h.mesh.userData.headGroup) {
        h.mesh.userData.headGroup.rotation.y = Math.sin(time * 0.002) * 0.45;
      }
      return;
    }

    if (h.mesh.userData.headGroup) {
      h.mesh.userData.headGroup.rotation.y = 0;
    }

    h.progress += h.dir * h.speed * delta;
    if (h.progress >= 1.0) {
      h.progress = 1.0;
      h.dir = -1;
      h.pauseTimer = 4.5; // Dừng lại ở sảnh Vườn Lan ngắm cảnh 4.5 giây
    } else if (h.progress <= 0.0) {
      h.progress = 0.0;
      h.dir = 1;
      h.pauseTimer = 3.0; // Dừng nghỉ ngơi ở chân dốc 3 giây
    }

    const pos = h.curve.getPointAt(h.progress);
    const groundY = typeof getDK2HillSurfaceY === 'function' ? getDK2HillSurfaceY(pos.x, pos.z) : pos.y;
    h.mesh.position.set(pos.x, groundY + 0.05, pos.z);

    const tangent = h.curve.getTangentAt(h.progress);
    if (tangent) {
      const targetAngle = Math.atan2(tangent.x * h.dir, tangent.z * h.dir);
      let diff = targetAngle - h.mesh.rotation.y;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      h.mesh.rotation.y += diff * Math.min(delta * 6.0, 1.0);
    }

    h.stepAngle += delta * 5.2;
    const swing = Math.sin(h.stepAngle) * 0.42;
    if (h.mesh.userData.leftLeg) h.mesh.userData.leftLeg.rotation.x = swing;
    if (h.mesh.userData.rightLeg) h.mesh.userData.rightLeg.rotation.x = -swing;
    if (h.mesh.userData.leftArm) h.mesh.userData.leftArm.rotation.x = -swing;
    if (h.mesh.userData.rightArm) h.mesh.userData.rightArm.rotation.x = swing;
  });

  // B2. Kỹ sư KCS kiểm tra xe tại khu xếp xe thành phẩm DK2
  dk2Inspectors.forEach((insp) => {
    if (insp.checkTimer > 0) {
      insp.checkTimer -= delta;
      // Quay mặt đối diện trực tiếp hàng xe thành phẩm (hướng +Z: rotation.y = 0)
      let turnDiff = 0 - insp.mesh.rotation.y;
      while (turnDiff > Math.PI) turnDiff -= Math.PI * 2;
      while (turnDiff < -Math.PI) turnDiff += Math.PI * 2;
      insp.mesh.rotation.y += turnDiff * Math.min(delta * 8.0, 1.0);

      if (insp.mesh.userData.leftLeg) insp.mesh.userData.leftLeg.rotation.x *= 0.85;
      if (insp.mesh.userData.rightLeg) insp.mesh.userData.rightLeg.rotation.x *= 0.85;
      if (insp.mesh.userData.leftArm) insp.mesh.userData.leftArm.rotation.x *= 0.85;
      if (insp.mesh.userData.rightArm) insp.mesh.userData.rightArm.rotation.x *= 0.85;
      if (insp.mesh.userData.headGroup) {
        insp.mesh.userData.headGroup.rotation.x = 0.28 + Math.sin(time * 0.003) * 0.06;
      }
      return;
    }

    if (insp.mesh.userData.headGroup) {
      insp.mesh.userData.headGroup.rotation.x = 0;
    }

    insp.nextCheckIn -= delta;
    if (insp.nextCheckIn <= 0) {
      insp.checkTimer = 2.8;
      insp.nextCheckIn = 4.0 + Math.random() * 3.0;
      return;
    }

    insp.currentX += insp.dir * insp.speed * delta;
    if (insp.currentX >= insp.maxX) {
      insp.currentX = insp.maxX;
      insp.dir = -1;
    } else if (insp.currentX <= insp.minX) {
      insp.currentX = insp.minX;
      insp.dir = 1;
    }

    insp.mesh.position.set(insp.currentX, 0.05, insp.z);
    const walkTargetAngle = insp.dir === 1 ? Math.PI / 2 : -Math.PI / 2;
    let turnDiff = walkTargetAngle - insp.mesh.rotation.y;
    while (turnDiff > Math.PI) turnDiff -= Math.PI * 2;
    while (turnDiff < -Math.PI) turnDiff += Math.PI * 2;
    insp.mesh.rotation.y += turnDiff * Math.min(delta * 8.0, 1.0);

    insp.stepAngle += delta * 4.8;
    const swing = Math.sin(insp.stepAngle) * 0.38;
    if (insp.mesh.userData.leftLeg) insp.mesh.userData.leftLeg.rotation.x = swing;
    if (insp.mesh.userData.rightLeg) insp.mesh.userData.rightLeg.rotation.x = -swing;
    if (insp.mesh.userData.leftArm) insp.mesh.userData.leftArm.rotation.x = -swing;
    if (insp.mesh.userData.rightArm) insp.mesh.userData.rightArm.rotation.x = swing;
  });

  // B3. Người đi bộ năng động theo mạng lưới Waypoint Graph khắp khuôn viên (Khối 7)
  const truckZPos = animatedTruck ? animatedTruck.position.z : -100;
  const isTruckNearCrossing = Math.abs(truckZPos - 0) < 18;

  wanderingPedestrians.forEach((p) => {
    // 1. CHẾ ĐỘ TRÚ MƯA: Trời mưa -> chạy vào hiên trú mưa gần nhất
    if (isRaining) {
      if (!p.shelterTarget) {
        // Tìm địa điểm trú mưa có mái che gần nhất
        let bestDist = 99999;
        let bestShelter = CAMPUS_SHELTERS[0];
        const cx = p.mesh.position.x;
        const cz = p.mesh.position.z;
        for (let s of CAMPUS_SHELTERS) {
          const d = Math.hypot(cx - s.x, cz - s.z);
          if (d < bestDist) {
            bestDist = d;
            bestShelter = s;
          }
        }
        // Thêm độ lệch nhẹ để không đứng đè lên nhau
        const jitterX = ((p.id % 5) - 2) * 0.55;
        const jitterZ = ((p.id % 3) - 1) * 0.55;
        p.shelterTarget = { x: bestShelter.x + jitterX, y: bestShelter.y || 0, z: bestShelter.z + jitterZ };
        p.shelterState = 'running_to_shelter';
      }

      const tx = p.shelterTarget.x;
      const tz = p.shelterTarget.z;
      const dx = tx - p.mesh.position.x;
      const dz = tz - p.mesh.position.z;
      const dist = Math.hypot(dx, dz);

      if (dist < 0.6) {
        // Đã đến hiên trú mưa an toàn: Đứng ngắm mưa, nghỉ chân
        p.shelterState = 'sheltered';
        if (p.mesh.userData.leftLeg) p.mesh.userData.leftLeg.rotation.x *= 0.85;
        if (p.mesh.userData.rightLeg) p.mesh.userData.rightLeg.rotation.x *= 0.85;
        if (p.mesh.userData.headGroup) {
          p.mesh.userData.headGroup.rotation.y = Math.sin(time * 0.002 + p.id) * 0.35;
        }
        return;
      } else {
        // Chạy nhanh vào nhà trú mưa (tốc độ chạy 3.4 m/s)
        const runSpeed = 3.4;
        const moveDist = Math.min(runSpeed * delta, dist);
        p.mesh.position.x += (dx / dist) * moveDist;
        p.mesh.position.z += (dz / dist) * moveDist;
        p.mesh.position.y += ((p.shelterTarget.y || 0) - p.mesh.position.y) * delta * 5.0;

        const targetAngle = Math.atan2(dx, dz);
        p.mesh.rotation.y = targetAngle;

        p.stepAngle += delta * 12.0; // Bước chân chạy nhanh gấp rút
        const swing = Math.sin(p.stepAngle) * 0.72;
        if (p.mesh.userData.leftLeg) p.mesh.userData.leftLeg.rotation.x = swing;
        if (p.mesh.userData.rightLeg) p.mesh.userData.rightLeg.rotation.x = -swing;
        if (p.mesh.userData.leftArm) p.mesh.userData.leftArm.rotation.x = -swing * 0.9;
        if (p.mesh.userData.rightArm) p.mesh.userData.rightArm.rotation.x = swing * 0.9;
        return;
      }
    } else {
      p.shelterTarget = null;
      p.shelterState = null;
    }

    // 2. CHẾ ĐỘ TRỜI TỐI (NIGHT): Đi bộ / chạy đến Nhà Ăn CBNV (hoặc sảnh HQ DK2) để dùng bữa tối
    if (currentEnv === 'night') {
      if (!p.dinnerTarget) {
        if (p.mesh.position.x > -15) {
          // Phân khu DK1: Đến Nhà Ăn CBNV (Z = -12, X = 22)
          const jx = ((p.id % 5) - 2) * 0.7;
          const jz = ((p.id % 4) - 1.5) * 0.7;
          p.dinnerTarget = { x: 22.0 + jx, y: 0, z: -12.0 + jz };
        } else {
          // Phân khu DK2: Đến Sảnh đón & Nhà ăn HQ DK2 (X = -36, Z = -24)
          const jx = ((p.id % 4) - 1.5) * 0.6;
          const jz = ((p.id % 3) - 1) * 0.6;
          p.dinnerTarget = { x: -36.0 + jx, y: 0, z: -24.0 + jz };
        }
      }

      const tx = p.dinnerTarget.x;
      const tz = p.dinnerTarget.z;
      const dx = tx - p.mesh.position.x;
      const dz = tz - p.mesh.position.z;
      const dist = Math.hypot(dx, dz);

      if (dist < 0.75) {
        // Đã đến nhà ăn: đứng/ngồi ăn tối, trò chuyện vui vẻ
        if (p.mesh.userData.leftLeg) p.mesh.userData.leftLeg.rotation.x *= 0.85;
        if (p.mesh.userData.rightLeg) p.mesh.userData.rightLeg.rotation.x *= 0.85;
        if (p.mesh.userData.headGroup) {
          p.mesh.userData.headGroup.rotation.y = Math.sin(time * 0.0025 + p.id) * 0.4;
        }
        if (p.mesh.userData.rightArm) {
          p.mesh.userData.rightArm.rotation.x = -0.6 + Math.sin(time * 0.006 + p.id) * 0.25; // Động tác gắp thức ăn / cầm đũa
        }
        return;
      } else {
        // Đi bộ nhanh tới nhà ăn
        const dinnerWalkSpeed = 2.4;
        const moveDist = Math.min(dinnerWalkSpeed * delta, dist);
        p.mesh.position.x += (dx / dist) * moveDist;
        p.mesh.position.z += (dz / dist) * moveDist;
        p.mesh.position.y += ((p.dinnerTarget.y || 0) - p.mesh.position.y) * delta * 5.0;

        const targetAngle = Math.atan2(dx, dz);
        p.mesh.rotation.y = targetAngle;

        p.stepAngle += delta * 8.5;
        const swing = Math.sin(p.stepAngle) * 0.55;
        if (p.mesh.userData.leftLeg) p.mesh.userData.leftLeg.rotation.x = swing;
        if (p.mesh.userData.rightLeg) p.mesh.userData.rightLeg.rotation.x = -swing;
        if (p.mesh.userData.leftArm) p.mesh.userData.leftArm.rotation.x = -swing * 0.8;
        if (p.mesh.userData.rightArm) p.mesh.userData.rightArm.rotation.x = swing * 0.8;
        return;
      }
    } else {
      p.dinnerTarget = null;
    }

    // 3. CHẾ ĐỘ BAN NGÀY BÌNH THƯỜNG: Đi dạo theo Waypoint Graph
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
      const moveDist = Math.min((p.speed || 1.6) * delta, dist);
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
      p.stepAngle += delta * ((p.speed || 1.6) * 3.5);
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

  // Quạt trần công nghiệp HVLS cánh lớn sải rộng bên trong xưởng B
  insideHVLSFans.forEach((fan) => {
    fan.rotation.y += delta * 1.8;
  });

  // DÂY CHUYỀN LẮP RÁP XƯỞNG B VẬN HÀNH CHẬM RÃI (Dài 30m, vận tốc 0.35 m/s)
  const lineSpeed = 0.35;
  insideAssemblyBikes.forEach((item) => {
    item.mesh.position.z += lineSpeed * delta;
    if (item.mesh.position.z >= 9.6 && item.mesh.position.z <= 13.2) {
      // Đang trượt dốc xuống cầu trượt dài 3.5m: nghiêng nhẹ theo dốc
      const rampProgress = (item.mesh.position.z - 9.6) / (13.2 - 9.6);
      item.mesh.position.y = item.baseY - rampProgress * 0.55;
      item.mesh.rotation.x = 0.18;
    } else if (item.mesh.position.z > 13.2) {
      // Chạm chân dốc -> tuần hoàn mượt mà lại điểm bắt đầu của dây chuyền phía Bắc
      item.mesh.position.z = item.startZ;
      item.mesh.position.y = item.baseY;
      item.mesh.rotation.x = 0;
    } else {
      item.mesh.position.y = item.baseY;
      item.mesh.rotation.x = 0;
    }
  });

  // 36 Tấm nan kim loại của băng chuyền trượt tịnh tiến chậm rãi
  insideConveyorSlats.forEach((slat) => {
    slat.position.z += lineSpeed * delta;
    if (slat.position.z > 9.8) {
      slat.position.z -= 25.2;
    }
  });

  // Công nhân lắp ráp cử động nhịp nhàng theo thao tác
  insideAssemblyWorkers.forEach((w) => {
    w.mesh.position.y = Math.sin(time * 0.0025 + w.phase) * 0.012;
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

  // 18. Đàn cá thân suôn bơi lội tự nhiên trong bể hình chữ nhật Nhà điều hành DK2
  koiFishes.forEach((fish) => {
    updateRealisticSwimmingFish(fish, delta, time, true);
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

  // 20. Đàn cá Koi bơi lội tự do & nhảy búng nước trong ao cá đồi DK2
  hillPondKoiFishes.forEach((fish) => {
    updateRealisticSwimmingFish(fish, delta, time, false);
  });

  // Cập nhật vòng sóng nước bắn tung tóe (Water Splash Ripples)
  for (let i = waterSplashRipples.length - 1; i >= 0; i--) {
    const rip = waterSplashRipples[i];
    rip.life += delta;
    const t = rip.life / rip.maxLife;
    if (t >= 1.0) {
      rip.parent.remove(rip.mesh);
      rip.mesh.geometry.dispose();
      rip.mesh.material.dispose();
      waterSplashRipples.splice(i, 1);
      continue;
    }
    const s = rip.scale + t * (rip.maxScale - rip.scale);
    rip.mesh.scale.set(s, s, s);
    rip.mesh.material.opacity = (1.0 - t) * rip.opacity;
  }

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
// 15. Weather Effects (Rain, Drifting Storm Clouds & Lightning Strikes)
// ============================================================================
function setupRainEffect() {
  // 1. Hệ thống 7.000 tia mưa xé gió dạng vệt nghiêng thực tế (Realistic Rain Streaks LineSegments)
  const rainCount = 7000;
  const positions = new Float32Array(rainCount * 2 * 3);
  rainData = [];

  for (let i = 0; i < rainCount; i++) {
    const x = (Math.random() - 0.5) * 280 - 15;
    const y = Math.random() * 45 + 1;
    const z = (Math.random() - 0.5) * 220 - 40;
    const speed = 90 + Math.random() * 50;
    const length = 1.35 + Math.random() * 0.95;
    rainData.push({ x, y, z, speed, length });

    const idx = i * 6;
    positions[idx] = x;
    positions[idx + 1] = y;
    positions[idx + 2] = z;
    positions[idx + 3] = x - 0.38;
    positions[idx + 4] = y - length;
    positions[idx + 5] = z + 0.12;
  }

  rainStreakGeo = new THREE.BufferGeometry();
  rainStreakGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const rainMat = new THREE.LineBasicMaterial({
    color: 0xcfd8dc, // Ánh bạc trong suốt của tia nước mưa rớt xé gió
    transparent: true,
    opacity: 0.68,
    blending: THREE.NormalBlending,
  });
  rainParticles = new THREE.LineSegments(rainStreakGeo, rainMat);
  rainParticles.visible = false;
  scene.add(rainParticles);

  // 2. Hiệu ứng bọt nước và gợn sóng bắn tung tóe mặt sân bê tông & nóc nhà xưởng (Ground Splashes)
  const splashCount = 240;
  const splashGeo = new THREE.RingGeometry(0.09, 0.3, 10);
  splashGeo.rotateX(-Math.PI / 2);
  const splashMat = new THREE.MeshBasicMaterial({
    color: 0xe2e8f0,
    transparent: true,
    opacity: 0.72,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  rainSplashMesh = new THREE.InstancedMesh(splashGeo, splashMat, splashCount);
  rainSplashMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  rainSplashMesh.visible = false;
  scene.add(rainSplashMesh);

  rainSplashes = [];
  const dummy = new THREE.Object3D();
  for (let s = 0; s < splashCount; s++) {
    const sp = {
      x: (Math.random() - 0.5) * 250 - 10,
      y: 0.05,
      z: (Math.random() - 0.5) * 190 - 35,
      age: Math.random() * 0.22,
      maxLife: 0.16 + Math.random() * 0.16,
    };
    if (Math.random() < 0.28) {
      if (sp.x > 45 && sp.x < 78 && sp.z > -40 && sp.z < -16) sp.y = 13.55;
      else if (sp.x > 26 && sp.x < 58 && sp.z > -28 && sp.z < -16) sp.y = 11.05;
      else if (sp.x > 12 && sp.x < 32 && sp.z > -18 && sp.z < -6) sp.y = 10.55;
    }
    rainSplashes.push(sp);
    dummy.position.set(sp.x, sp.y, sp.z);
    dummy.scale.set(0.01, 0.01, 0.01);
    dummy.updateMatrix();
    rainSplashMesh.setMatrixAt(s, dummy.matrix);
  }
  rainSplashMesh.instanceMatrix.needsUpdate = true;

  // Khởi tạo các cụm mây bão trắng bông bềnh trôi thấp ngay trên nóc nhà xưởng và đồi (White Low Storm Clouds)
  stormCloudsGroup = new THREE.Group();
  stormClouds = [];
  const stormCloudMat = new THREE.MeshStandardMaterial({
    color: 0xffffff, // Màu trắng bông bồng bềnh
    roughness: 0.32,
    metalness: 0.02,
    emissive: 0x333b4d, // Ánh sáng nền nhẹ giúp mây luôn giữ màu trắng sáng tinh khiết
    emissiveIntensity: 0.35,
    flatShading: true,
  });

  // Mây mưa hạ thấp xuống độ cao y = 26m - 35m (ngay trên nóc nhà xưởng 11m-13.5m và đồi núi)
  const stormConfigs = [
    { x: -160, y: 28, z: -110, scale: 4.2, speed: 4.8 },
    { x: -110, y: 31, z: -40, scale: 4.6, speed: 5.2 },
    { x: -60, y: 26, z: 20, scale: 4.3, speed: 4.5 },
    { x: -10, y: 33, z: -90, scale: 4.8, speed: 5.5 },
    { x: 40, y: 29, z: -30, scale: 4.5, speed: 4.9 },
    { x: 90, y: 32, z: 30, scale: 4.2, speed: 5.1 },
    { x: 130, y: 27, z: -80, scale: 4.6, speed: 4.7 },
    { x: -80, y: 34, z: -140, scale: 4.8, speed: 5.4 },
    { x: 20, y: 30, z: -130, scale: 4.4, speed: 5.0 },
    { x: 80, y: 35, z: -60, scale: 5.0, speed: 5.6 },
    { x: -140, y: 26, z: 40, scale: 4.2, speed: 4.6 },
    { x: 0, y: 28, z: 50, scale: 4.5, speed: 5.3 },
    // Cụm mây bổ sung ngay tiền cảnh khuôn viên DK1 & DK2
    { x: 25, y: 29, z: -15, scale: 4.3, speed: 4.7 },
    { x: -45, y: 28, z: -25, scale: 4.1, speed: 4.9 },
  ];

  stormConfigs.forEach((sc) => {
    const cGroup = new THREE.Group();
    cGroup.position.set(sc.x, sc.y, sc.z);
    cGroup.userData = { speed: sc.speed, baseY: sc.y };

    const puffs = 8;
    for (let p = 0; p < puffs; p++) {
      const pr = (1.3 + Math.random() * 0.9) * sc.scale;
      const puff = new THREE.Mesh(new THREE.DodecahedronGeometry(pr, 1), stormCloudMat);
      puff.position.set(
        (p - 3.5) * 1.6 * sc.scale + (Math.random() - 0.5) * 2.0,
        (Math.random() - 0.5) * 0.7 * sc.scale,
        (Math.random() - 0.5) * 2.5 * sc.scale
      );
      puff.castShadow = true;
      cGroup.add(puff);
    }
    stormCloudsGroup.add(cGroup);
    stormClouds.push(cGroup);
  });

  stormCloudsGroup.visible = false;
  stormCloudsGroup.scale.set(0.001, 0.001, 0.001);
  scene.add(stormCloudsGroup);

  // Đèn chớp sáng bầu trời khi sét đánh
  lightningFlashLight = new THREE.PointLight(0xdbeafe, 0, 480, 1.2);
  scene.add(lightningFlashLight);
}

// Danh sách các tọa độ điểm đánh sét nổi bật rõ nét: Cây đại thụ cảnh quan, sân trước, đồi sinh thái và rừng
const lightningTargets = [
  { x: 26, y: 1.0, z: -18, name: 'Cây bóng mát cảnh quan sân DK1' },
  { x: 42, y: 1.0, z: -8, name: 'Sân bóng chuyền DK1' },
  { x: 65, y: 1.0, z: -38, name: 'Sân kiểm định bãi sau Xưởng B' },
  { x: -28, y: 1.0, z: -22, name: 'Sân trước Nhà Điều Hành DK2' },
  { x: -68, y: 1.0, z: -38, name: 'Sân xe thành phẩm DK2' },
  { x: -108, y: 16.5, z: -80, name: 'Đỉnh đồi Vườn Lan DK2' },
  { x: -138, y: 15.5, z: -35, name: 'Đỉnh Đồi Gà DK2' },
  { x: 108, y: 18.0, z: -40, name: 'Đỉnh đồi Cối xay gió' },
  { x: 75, y: 2.0, z: -68, name: 'Rừng cây ven sông máng' },
  { x: 42, y: 7.5, z: -78, name: 'Rừng cây sau Nhà C' },
];

function triggerLightningStrike() {
  if (activeLightningGroup) {
    scene.remove(activeLightningGroup);
    activeLightningGroup = null;
  }

  const target = lightningTargets[Math.floor(Math.random() * lightningTargets.length)];
  const boltGroup = new THREE.Group();

  // Điểm phát tia sét bắt nguồn trực tiếp từ đáy mây bão thấp (y ~ 30m - 36m)
  const cloudOrigin = new THREE.Vector3(
    target.x + (Math.random() - 0.5) * 14,
    31.0 + Math.random() * 5.0,
    target.z + (Math.random() - 0.5) * 14
  );
  const strikeGround = new THREE.Vector3(target.x, target.y, target.z);

  // Tạo đường gấp khúc zigzag của tia sét chính (12 đốt gãy khúc sống động)
  const segments = 12;
  const boltPoints = [cloudOrigin.clone()];

  for (let i = 1; i < segments; i++) {
    const t = i / segments;
    const interPt = cloudOrigin.clone().lerp(strikeGround, t);
    // Độ lệch zigzag phóng điện mạnh mẽ
    const roughness = (1.0 - t * 0.25) * 3.8;
    interPt.x += (Math.random() - 0.5) * roughness;
    interPt.z += (Math.random() - 0.5) * roughness;
    boltPoints.push(interPt);
  }
  boltPoints.push(strikeGround.clone());

  const mainCurve = new THREE.CatmullRomCurve3(boltPoints);

  // 1. Lõi tia sét dày trắng rực (White Plasma Core Tube - r = 0.45m)
  const coreGeo = new THREE.TubeGeometry(mainCurve, 36, 0.45, 8, false);
  const coreMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const coreMesh = new THREE.Mesh(coreGeo, coreMat);
  boltGroup.add(coreMesh);

  // 2. Vỏ phát quang neon xanh điện cực mạnh (Electric Cyan Glow Tube - r = 1.25m)
  const glowGeo = new THREE.TubeGeometry(mainCurve, 36, 1.25, 8, false);
  const glowMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.88, side: THREE.DoubleSide });
  const glowMesh = new THREE.Mesh(glowGeo, glowMat);
  boltGroup.add(glowMesh);

  // 3. Vầng hào quang bao bọc xung quanh (Outer Aura Sheath - r = 2.4m)
  const auraGeo = new THREE.TubeGeometry(mainCurve, 24, 2.4, 6, false);
  const auraMat = new THREE.MeshBasicMaterial({ color: 0x60a5fa, transparent: true, opacity: 0.42, side: THREE.DoubleSide });
  const auraMesh = new THREE.Mesh(auraGeo, auraMat);
  boltGroup.add(auraMesh);

  // 4. Nhiều nhánh sét phụ (3 Branch Forks) tách ra giữa không trung ở các độ cao khác nhau
  const branchIndices = [3, 6, 9];
  branchIndices.forEach((idx, bIdx) => {
    if (idx < boltPoints.length - 1) {
      const forkStart = boltPoints[idx].clone();
      const side = bIdx % 2 === 0 ? 1 : -1;
      const forkEnd = forkStart.clone().add(new THREE.Vector3(
        side * (9 + Math.random() * 8),
        - (6 + Math.random() * 6),
        (Math.random() - 0.5) * 14
      ));

      const forkPts = [forkStart];
      for (let f = 1; f < 5; f++) {
        const fPt = forkStart.clone().lerp(forkEnd, f / 5);
        fPt.x += (Math.random() - 0.5) * 2.5;
        fPt.z += (Math.random() - 0.5) * 2.5;
        forkPts.push(fPt);
      }
      forkPts.push(forkEnd);

      const forkCurve = new THREE.CatmullRomCurve3(forkPts);
      const fCore = new THREE.Mesh(
        new THREE.TubeGeometry(forkCurve, 16, 0.22, 6, false),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
      );
      boltGroup.add(fCore);

      const fGlow = new THREE.Mesh(
        new THREE.TubeGeometry(forkCurve, 16, 0.65, 6, false),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.8, side: THREE.DoubleSide })
      );
      boltGroup.add(fGlow);
    }
  });

  // 5. Quả cầu nổ bùng phát sáng tại điểm tiếp đất (r = 2.8m & 4.8m)
  const impactSpark = new THREE.Mesh(
    new THREE.SphereGeometry(2.8, 16, 12),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  impactSpark.position.copy(strikeGround);
  boltGroup.add(impactSpark);

  const impactGlow = new THREE.Mesh(
    new THREE.SphereGeometry(4.8, 16, 12),
    new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.65 })
  );
  impactGlow.position.copy(strikeGround);
  boltGroup.add(impactGlow);

  // 6. Vòng sóng xung kích điện trường lan tỏa mặt đất (Electric Shockwave Ring)
  const shockwaveGeo = new THREE.RingGeometry(1.0, 6.5, 32);
  const shockwaveMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.85, side: THREE.DoubleSide });
  const shockwave = new THREE.Mesh(shockwaveGeo, shockwaveMat);
  shockwave.rotation.x = -Math.PI / 2;
  shockwave.position.set(strikeGround.x, strikeGround.y + 0.12, strikeGround.z);
  boltGroup.add(shockwave);

  // 7. Chớp sáng đầu nguồn mây bão (Cloud Origin Flare)
  const cloudFlare = new THREE.Mesh(
    new THREE.SphereGeometry(4.2, 16, 12),
    new THREE.MeshBasicMaterial({ color: 0xdbeafe, transparent: true, opacity: 0.8 })
  );
  cloudFlare.position.copy(cloudOrigin);
  boltGroup.add(cloudFlare);

  boltGroup.userData = { shockwave, impactSpark, impactGlow };
  scene.add(boltGroup);
  activeLightningGroup = boltGroup;
  lightningFlickerTimer = 0.65; // Chớp sét rõ ràng, kéo dài 650ms với hiệu ứng đa xung Strobe nhấp nháy

  // Đèn sáng rực bầu trời
  if (lightningFlashLight) {
    lightningFlashLight.position.set(target.x, target.y + 14, target.z);
    lightningFlashLight.intensity = 60.0;
  }

  // Phát âm thanh sấm rền chân thực
  audioManager.playThunder();
}

function updateRain(delta) {
  // 1. Quản lý mây bão trắng trôi vào thấp khi bật mưa
  if (stormCloudsGroup) {
    if (isRaining) {
      stormCloudsGroup.visible = true;
      // Mở rộng mây bão phủ kín bầu trời
      stormCloudsGroup.scale.lerp(new THREE.Vector3(1, 1, 1), delta * 2.5);
      // Các khối mây bão liên tục trôi dạt theo hướng gió
      stormClouds.forEach((cloud) => {
        cloud.position.x += delta * cloud.userData.speed;
        if (cloud.position.x > 220) {
          cloud.position.x = -220;
        }
      });
    } else {
      stormCloudsGroup.scale.lerp(new THREE.Vector3(0.001, 0.001, 0.001), delta * 3.0);
      if (stormCloudsGroup.scale.x < 0.02) {
        stormCloudsGroup.visible = false;
      }
    }
  }

  // 2. Cập nhật tia mưa rơi xé gió nghiêng theo luồng khí quyển (Realistic Slanted Rain Streaks)
  if (isRaining && rainParticles && rainStreakGeo) {
    const pos = rainStreakGeo.attributes.position.array;
    // Gió giật tự nhiên làm dải mưa nghiêng lả lướt
    const windSlantX = -0.38 + Math.sin(performance.now() * 0.0018) * 0.09;
    const windSlantZ = 0.12 + Math.cos(performance.now() * 0.0015) * 0.05;

    for (let i = 0; i < rainData.length; i++) {
      const d = rainData[i];
      d.y -= d.speed * delta;
      d.x += windSlantX * d.speed * delta * 0.28;
      d.z += windSlantZ * d.speed * delta * 0.28;

      if (d.y < 0.2) {
        d.y = 35 + Math.random() * 15;
        d.x = (Math.random() - 0.5) * 280 - 15;
        d.z = (Math.random() - 0.5) * 220 - 40;
      }

      const idx = i * 6;
      pos[idx] = d.x;
      pos[idx + 1] = d.y;
      pos[idx + 2] = d.z;

      pos[idx + 3] = d.x + windSlantX;
      pos[idx + 4] = d.y - d.length;
      pos[idx + 5] = d.z + windSlantZ;
    }
    rainStreakGeo.attributes.position.needsUpdate = true;
  }

  // 3. Cập nhật bọt nước gợn sóng bắn tung tóe mặt sân khi mưa tiếp đất (Ground Splashes)
  if (isRaining && rainSplashMesh) {
    rainSplashMesh.visible = true;
    const dummy = new THREE.Object3D();
    for (let s = 0; s < rainSplashes.length; s++) {
      const sp = rainSplashes[s];
      sp.age += delta;
      if (sp.age >= sp.maxLife) {
        sp.age = 0;
        sp.maxLife = 0.16 + Math.random() * 0.16;
        sp.x = (Math.random() - 0.5) * 250 - 10;
        sp.z = (Math.random() - 0.5) * 190 - 35;
        sp.y = 0.05;
        if (Math.random() < 0.28) {
          if (sp.x > 45 && sp.x < 78 && sp.z > -40 && sp.z < -16) sp.y = 13.55;
          else if (sp.x > 26 && sp.x < 58 && sp.z > -28 && sp.z < -16) sp.y = 11.05;
          else if (sp.x > 12 && sp.x < 32 && sp.z > -18 && sp.z < -6) sp.y = 10.55;
        }
      }
      const progress = sp.age / sp.maxLife; // 0 -> 1
      const sc = (0.2 + progress * 1.5) * (1.0 - progress * 0.35);
      dummy.position.set(sp.x, sp.y, sp.z);
      dummy.scale.set(sc, sc, sc);
      dummy.updateMatrix();
      rainSplashMesh.setMatrixAt(s, dummy.matrix);
    }
    rainSplashMesh.instanceMatrix.needsUpdate = true;
  } else if (rainSplashMesh) {
    rainSplashMesh.visible = false;
  }

  // 3. Quản lý tia sét đánh & Chớp giật (Lightning Strike System)
  if (isRaining) {
    lightningCooldown -= delta;
    if (lightningCooldown <= 0) {
      triggerLightningStrike();
      lightningCooldown = 3.5 + Math.random() * 3.5; // Đánh ngẫu nhiên mỗi 3.5s - 7.0s rõ ràng, sống động
    }

    // Hiệu ứng chớp giật nhấp nháy đa xung thực tế của tia sét (Multi-pulse Strobe Lighting)
    if (lightningFlickerTimer > 0) {
      lightningFlickerTimer -= delta;
      const phase = Math.max(0, lightningFlickerTimer / 0.65); // từ 1.0 giảm dần về 0
      const strobeWave = Math.sin(lightningFlickerTimer * 42);
      const isBright = strobeWave > -0.3 || lightningFlickerTimer > 0.45;

      // Lan tỏa vòng sóng xung kích trên mặt đất
      if (activeLightningGroup && activeLightningGroup.userData.shockwave) {
        activeLightningGroup.userData.shockwave.scale.addScalar(delta * 12.0);
      }

      if (activeLightningGroup) {
        activeLightningGroup.visible = isBright;
      }

      // Đánh sáng toàn cảnh khuôn viên (Ambient & Sunlight Flash)
      const baseAmbient = CONFIG.LIGHTING[currentEnv] ? CONFIG.LIGHTING[currentEnv].ambientIntensity : 0.8;
      const baseSun = CONFIG.LIGHTING[currentEnv] ? CONFIG.LIGHTING[currentEnv].sunIntensity : 1.2;

      if (isBright) {
        const flashFactor = Math.max(0.3, phase);
        if (lightningFlashLight) lightningFlashLight.intensity = 60.0 * flashFactor;
        if (ambientLight) ambientLight.intensity = baseAmbient + 2.2 * flashFactor;
        if (dirLight) dirLight.intensity = baseSun + 1.4 * flashFactor;
      } else {
        if (lightningFlashLight) lightningFlashLight.intensity = 15.0 * phase;
        if (ambientLight) ambientLight.intensity = baseAmbient + 0.6 * phase;
        if (dirLight) dirLight.intensity = baseSun + 0.4 * phase;
      }

      if (lightningFlickerTimer <= 0) {
        if (activeLightningGroup) {
          scene.remove(activeLightningGroup);
          activeLightningGroup = null;
        }
        if (lightningFlashLight) {
          lightningFlashLight.intensity = 0;
        }
        // Khôi phục ánh sáng chuẩn môi trường
        if (ambientLight && CONFIG.LIGHTING[currentEnv]) {
          ambientLight.intensity = CONFIG.LIGHTING[currentEnv].ambientIntensity;
        }
        if (dirLight && CONFIG.LIGHTING[currentEnv]) {
          dirLight.intensity = CONFIG.LIGHTING[currentEnv].sunIntensity;
        }
      }
    }
  } else {
    // Dập tắt sét ngay khi tắt mưa và trả lại ánh sáng bình thường
    if (activeLightningGroup) {
      scene.remove(activeLightningGroup);
      activeLightningGroup = null;
    }
    if (lightningFlashLight) {
      lightningFlashLight.intensity = 0;
    }
    if (ambientLight && CONFIG.LIGHTING[currentEnv]) {
      ambientLight.intensity = CONFIG.LIGHTING[currentEnv].ambientIntensity;
    }
    if (dirLight && CONFIG.LIGHTING[currentEnv]) {
      dirLight.intensity = CONFIG.LIGHTING[currentEnv].sunIntensity;
    }
    lightningCooldown = 0.8;
  }
}

// ============================================================================
// HỆ THỐNG PHỦ TUYẾT, TUYẾT RƠI & CẦU VỒNG 3D NỐI 2 NÚI (Request 2 & 3)
// ============================================================================

// Hàm gắn shader phủ tuyết lên bất kỳ vật liệu MeshStandardMaterial nào
function applySnowShader(material, minNormalY = 0.2, coverage = 0.95) {
  if (!material) return;
  if (material.userData && material.userData.snowShader) return; // Đã gắn shader tuyết rồi
  if (!snowMaterials.includes(material)) {
    snowMaterials.push(material);
  }

  const prevOnBeforeCompile = material.onBeforeCompile;
  const isDefaultPrev = prevOnBeforeCompile === THREE.Material.prototype.onBeforeCompile;
  const prevCacheKey = material.customProgramCacheKey.bind(material);
  const snowKey = `snow_${minNormalY.toFixed(2)}_${coverage.toFixed(2)}`;
  // Đánh dấu vật liệu chỉ có shader tuyết (không phụ thuộc vị trí object) để static batching vẫn gộp được
  material.userData.snowShader = { key: snowKey, snowOnly: isDefaultPrev };
  material.customProgramCacheKey = () => (isDefaultPrev ? snowKey : `${prevCacheKey()}|${snowKey}`);
  material.onBeforeCompile = (shader, renderer) => {
    if (prevOnBeforeCompile) prevOnBeforeCompile(shader, renderer);

    shader.uniforms.uSnowAmount = snowUniforms.uSnowAmount;

    // Tiêm biến vSnowUpNormal vào Vertex Shader
    if (!shader.vertexShader.includes('vSnowUpNormal')) {
      shader.vertexShader = `
        varying float vSnowUpNormal;
        ${shader.vertexShader}
      `;
      shader.vertexShader = shader.vertexShader.replace(
        '#include <beginnormal_vertex>',
        `
        #include <beginnormal_vertex>
        #ifdef USE_INSTANCING
          mat3 snowWorldMat = mat3(modelMatrix) * mat3(instanceMatrix);
        #else
          mat3 snowWorldMat = mat3(modelMatrix);
        #endif
        vSnowUpNormal = normalize(snowWorldMat * objectNormal).y;
        `
      );
    }

    // Tiêm logic phủ tuyết vào Fragment Shader (Chỉ phủ các mặt hướng lên trời)
    if (!shader.fragmentShader.includes('uSnowAmount')) {
      shader.fragmentShader = `
        uniform float uSnowAmount;
        varying float vSnowUpNormal;
        ${shader.fragmentShader}
      `;
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <dithering_fragment>',
        `
        #include <dithering_fragment>
        if (uSnowAmount > 0.001) {
          float snowCoverage = smoothstep(${minNormalY.toFixed(2)}, ${(minNormalY + 0.42).toFixed(2)}, vSnowUpNormal) * uSnowAmount;
          vec3 snowColor = vec3(0.95, 0.97, 1.0);
          gl_FragColor.rgb = mix(gl_FragColor.rgb, snowColor, snowCoverage * ${coverage.toFixed(2)});
        }
        `
      );
    }
  };
  material.needsUpdate = true;
}

// Khởi tạo hệ thống hạt tuyết rơi bồng bềnh
function setupSnowEffect() {
  const flakeCount = 1800;
  const positions = new Float32Array(flakeCount * 3);
  snowData = [];

  for (let i = 0; i < flakeCount; i++) {
    const x = -160 + Math.random() * 300;
    const y = Math.random() * 55;
    const z = -185 + Math.random() * 285;

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    snowData.push({
      fallSpeed: 1.8 + Math.random() * 2.2, // Rơi từ từ, mềm mại
      swaySpeed: 1.2 + Math.random() * 2.0, // Tốc độ chao liệng
      swayRadius: 0.8 + Math.random() * 1.5, // Biên độ đu đưa trong gió
      swayPhase: Math.random() * Math.PI * 2,
    });
  }

  const snowGeo = new THREE.BufferGeometry();
  snowGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  // Tạo texture bông tuyết tròn mềm mại bằng Canvas
  const snowCanvas = document.createElement('canvas');
  snowCanvas.width = 32;
  snowCanvas.height = 32;
  const ctx = snowCanvas.getContext('2d');
  const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  grad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
  grad.addColorStop(0.45, 'rgba(240, 248, 255, 0.9)');
  grad.addColorStop(0.85, 'rgba(230, 245, 255, 0.35)');
  grad.addColorStop(1, 'rgba(255, 255, 255, 0.0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(16, 16, 16, 0, Math.PI * 2);
  ctx.fill();

  const snowTex = new THREE.CanvasTexture(snowCanvas);
  snowTex.needsUpdate = true;

  const snowMat = new THREE.PointsMaterial({
    map: snowTex,
    color: 0xffffff,
    size: 1.35,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.92,
    depthWrite: false,
    blending: THREE.NormalBlending,
  });

  snowParticleSystem = new THREE.Points(snowGeo, snowMat);
  snowParticleSystem.visible = false;
  scene.add(snowParticleSystem);

  // Quét toàn bộ scene để tự động phủ tuyết lên các mái phụ, hiên nhà dân, kiosk, bãi xe ngoài trời
  scene.traverse((obj) => {
    if (obj.isMesh && obj.material && obj.material.isMeshStandardMaterial) {
      const mat = obj.material;
      if (mat.transparent && mat.opacity < 0.8) return;
      if (illuminatedLogoMats.includes(mat)) return;
      if (windowLights.includes(mat)) return;
      if (snowMaterials.includes(mat)) return;

      const isPitchedRoof = obj.geometry instanceof THREE.ConeGeometry;
      const isHighRoof = obj.position.y > 2.2 && obj.geometry && obj.geometry.type === 'BoxGeometry';

      if (isPitchedRoof || isHighRoof) {
        applySnowShader(mat, 0.25, 0.95);
      }
    }
  });
}

// Bật / Tắt trạng thái tuyết rơi
function updateSnowState(enabled) {
  isSnowing = enabled;
  const snowBtn = document.getElementById('btn-toggle-snow');
  if (snowBtn) snowBtn.classList.toggle('active', enabled);

  if (snowParticleSystem) {
    snowParticleSystem.visible = enabled;
  }

  if (enabled) {
    // Nếu đang mưa thì tắt mưa để tuyết rơi
    if (isRaining) {
      const rainBtn = document.getElementById('btn-toggle-rain');
      if (rainBtn && rainBtn.classList.contains('active')) {
        rainBtn.click();
      }
    }
    showCampusToast('❄️ Tuyết bắt đầu rơi: Cây cối, mái nhà và các ngọn đồi đang dần được phủ tuyết trắng xóa!', 'snow');
    triggerEventSpeechBubbles('snow');
  } else {
    showCampusToast('☀️ Ngừng tuyết rơi: Không khí trong lành, tuyết đang tan dần trên khắp khuôn viên.', 'sun');
  }
}

// Danh sách các ngọn đồi nội vi diorama
const RAINBOW_HILLS = [
  { name: 'Đồi Cối xay gió', x: 58, y: 16, z: -128 },
  { name: 'Đồi Đông xa', x: 115, y: 14, z: -80 },
  { name: 'Đồi Đông Nam', x: 116, y: 11, z: -25 },
  { name: 'Đồi Tây Bắc', x: -145, y: 18, z: -155 },
  { name: 'Đồi Đông Bắc', x: 75, y: 18, z: -160 },
  { name: 'Đồi sườn Bắc', x: -60, y: 19, z: -160 },
  { name: 'Đồi Tây Nam', x: -138, y: 11, z: 72 },
  { name: 'Đồi chính DK2', x: -120, y: 16, z: -78 },
  { name: 'Đồi mới DK2', x: -142, y: 14, z: -38 },
];

function pickTwoRandomHills() {
  const h1 = RAINBOW_HILLS[Math.floor(Math.random() * RAINBOW_HILLS.length)];
  const candidates = RAINBOW_HILLS.filter(h => {
    const d = Math.hypot(h.x - h1.x, h.z - h1.z);
    return d >= 75 && d <= 210;
  });
  const h2 = candidates.length > 0
    ? candidates[Math.floor(Math.random() * candidates.length)]
    : RAINBOW_HILLS[(RAINBOW_HILLS.indexOf(h1) + 3) % RAINBOW_HILLS.length];
  return [h1, h2];
}

// ============================================================================
// HỆ THỐNG CẦU VỒNG 3D ĐA CHIỀU (VOLUMETRIC & CAMERA-FACING MULTI-LAYER RAINBOW)
// ============================================================================

// Các vector tái sử dụng để tránh tạo rác bộ nhớ (Zero-allocation scratch vectors)
const _rbPt = new THREE.Vector3();
const _rbTan = new THREE.Vector3();
const _rbV = new THREE.Vector3();
const _rbExp = new THREE.Vector3();
const _rbWorldUp = new THREE.Vector3(0, 1, 0);
const _rbArchBinormal = new THREE.Vector3();
const _rbArchUpNormal = new THREE.Vector3();

// Bảng màu 7 sắc cầu vồng quang phổ tự nhiên kèm dải gradient hòa tan vào bầu trời
const RAINBOW_SPECTRUM_STOPS = [
  { frac: -0.50, color: new THREE.Color(0x38bdf8), alpha: 0.15 }, // Inner sky blue fade
  { frac: -0.42, color: new THREE.Color(0x7c3aed), alpha: 0.85 }, // Violet (Tím)
  { frac: -0.28, color: new THREE.Color(0x2563eb), alpha: 0.90 }, // Indigo (Chàm)
  { frac: -0.14, color: new THREE.Color(0x06b6d4), alpha: 0.95 }, // Cyan (Lam)
  { frac:  0.00, color: new THREE.Color(0x10b981), alpha: 1.00 }, // Green (Lục)
  { frac:  0.14, color: new THREE.Color(0xfacc15), alpha: 1.00 }, // Yellow (Vàng)
  { frac:  0.28, color: new THREE.Color(0xf97316), alpha: 0.95 }, // Orange (Cam)
  { frac:  0.42, color: new THREE.Color(0xef4444), alpha: 0.90 }, // Red (Đỏ)
  { frac:  0.50, color: new THREE.Color(0xf87171), alpha: 0.20 }, // Outer red ambient glow
];

function disposeActiveRainbow() {
  if (!activeRainbow) return;
  if (activeRainbow.group) {
    scene.remove(activeRainbow.group);
  }
  if (activeRainbow.viewRibbonGeo) activeRainbow.viewRibbonGeo.dispose();
  if (activeRainbow.viewRibbonMat) activeRainbow.viewRibbonMat.dispose();
  if (activeRainbow.inPlaneRibbonGeo) activeRainbow.inPlaneRibbonGeo.dispose();
  if (activeRainbow.inPlaneRibbonMat) activeRainbow.inPlaneRibbonMat.dispose();
  if (activeRainbow.tubeGeo) activeRainbow.tubeGeo.dispose();
  if (activeRainbow.tubeMat) activeRainbow.tubeMat.dispose();
  if (activeRainbow.innerGlowGeo) activeRainbow.innerGlowGeo.dispose();
  if (activeRainbow.innerGlowMat) activeRainbow.innerGlowMat.dispose();
  activeRainbow = null;
}

// Sinh cầu vồng 3D đa chiều ngẫu nhiên nối giữa 2 ngọn núi bất kỳ khi tắt mưa
function spawnRandomRainbow() {
  disposeActiveRainbow();

  const [h1, h2] = pickTwoRandomHills();
  const P1 = new THREE.Vector3(h1.x, h1.y, h1.z);
  const P2 = new THREE.Vector3(h2.x, h2.y, h2.z);
  const dist = P1.distanceTo(P2);

  // Đỉnh vòm cao vút và hùng vĩ
  const apexH = Math.max(42, dist * 0.44);
  const Pmid = new THREE.Vector3(
    (P1.x + P2.x) / 2,
    Math.max(P1.y, P2.y) + apexH,
    (P1.z + P2.z) / 2
  );

  const curve = new THREE.QuadraticBezierCurve3(P1, Pmid, P2);
  const segs = 64;
  // Bề rộng dải màu dày dặn và nổi bật (22m - 28m)
  const ribbonW = Math.max(22.0, dist * 0.13);
  const widthSteps = RAINBOW_SPECTRUM_STOPS.length;

  const rainbowGroup = new THREE.Group();

  // Dây cung nối 2 chân núi và pháp tuyến mặt phẳng vòm
  const chord = new THREE.Vector3().subVectors(P2, P1);
  const archBinormal = new THREE.Vector3().crossVectors(chord, _rbWorldUp).normalize();
  if (archBinormal.lengthSq() < 0.0001) {
    archBinormal.set(1, 0, 0);
  }

  // --------------------------------------------------------------------------
  // LỚP 1: DẢI MÀU QUANH MẶT PHẲNG VÒM (In-Plane Radial Arch)
  // Luôn giữ bề dày 22m theo phương bán kính vòm, giúp khi nhìn ngang từ sườn đồi
  // cầu vồng vẫn là một khối cầu vồng dày dặn, không bao giờ bị mỏng dẹt thành 1 vạch.
  // --------------------------------------------------------------------------
  const inPlanePositions = [];
  const inPlaneColors = [];
  const ribbonIndices = [];

  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const pt = curve.getPoint(t);
    const tangent = curve.getTangent(t);

    // Vector hướng lên theo phương bán kính vòm
    const upNormal = new THREE.Vector3().crossVectors(archBinormal, tangent).normalize();
    if (upNormal.y < 0) upNormal.negate();

    const endFade = Math.pow(Math.sin(t * Math.PI), 0.65);

    for (let j = 0; j < widthSteps; j++) {
      const stop = RAINBOW_SPECTRUM_STOPS[j];
      const offset = stop.frac * ribbonW;
      inPlanePositions.push(
        pt.x + upNormal.x * offset,
        pt.y + upNormal.y * offset,
        pt.z + upNormal.z * offset
      );

      const col = stop.color.clone();
      col.multiplyScalar(stop.alpha * endFade);
      inPlaneColors.push(col.r, col.g, col.b);
    }
  }

  for (let i = 0; i < segs; i++) {
    for (let j = 0; j < widthSteps - 1; j++) {
      const a = i * widthSteps + j;
      const b = (i + 1) * widthSteps + j;
      const c = (i + 1) * widthSteps + (j + 1);
      const d = i * widthSteps + (j + 1);
      ribbonIndices.push(a, b, d);
      ribbonIndices.push(b, c, d);
    }
  }

  const inPlaneRibbonGeo = new THREE.BufferGeometry();
  inPlaneRibbonGeo.setAttribute('position', new THREE.Float32BufferAttribute(inPlanePositions, 3));
  inPlaneRibbonGeo.setAttribute('color', new THREE.Float32BufferAttribute(inPlaneColors, 3));
  inPlaneRibbonGeo.setIndex(ribbonIndices);
  inPlaneRibbonGeo.computeVertexNormals();

  const inPlaneRibbonMat = new THREE.MeshBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.0,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  });
  const inPlaneMesh = new THREE.Mesh(inPlaneRibbonGeo, inPlaneRibbonMat);
  rainbowGroup.add(inPlaneMesh);

  // --------------------------------------------------------------------------
  // LỚP 2: DẢI MÀU QUAY MẶT THEO CAMERA (View-Aligned Dynamic Ribbon)
  // Liên tục nở rộng vuông góc với tia nhìn của người quan sát, đảm bảo từ bất kỳ
  // góc nhìn nào (nhìn nghiêng, nhìn từ trên xuống, nhìn trực diện), toàn bộ 7 sắc
  // cầu vồng luôn hướng thẳng vào mắt người xem với độ dày tối đa.
  // --------------------------------------------------------------------------
  const viewRibbonGeo = new THREE.BufferGeometry();
  viewRibbonGeo.setAttribute('position', new THREE.Float32BufferAttribute([...inPlanePositions], 3));
  viewRibbonGeo.setAttribute('color', new THREE.Float32BufferAttribute([...inPlaneColors], 3));
  viewRibbonGeo.setIndex([...ribbonIndices]);
  viewRibbonGeo.computeVertexNormals();

  const viewRibbonMat = new THREE.MeshBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.0,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  });
  const viewFacingMesh = new THREE.Mesh(viewRibbonGeo, viewRibbonMat);
  rainbowGroup.add(viewFacingMesh);

  // --------------------------------------------------------------------------
  // LỚP 3: HÀO QUANG 3D DẠNG ỐNG KHÔNG GIAN (Volumetric 3D Cylinder Aura)
  // Một ống tròn 3D bao bọc dọc theo toàn bộ vòm cầu vồng với đường kính ~14m.
  // Tạo thể tích ánh sáng chân thực 360 độ trong không gian, làm cầu vồng có chiều sâu
  // và độ phát quang thể tích chuẩn AAA.
  // --------------------------------------------------------------------------
  const tubeRadius = Math.max(6.5, ribbonW * 0.28);
  const tubeGeo = new THREE.TubeGeometry(curve, 64, tubeRadius, 12, false);
  const tubeColors = [];
  const tubePos = tubeGeo.attributes.position;
  for (let i = 0; i < tubePos.count; i++) {
    const py = tubePos.getY(i);
    const tVal = Math.min(1.0, Math.max(0.0, (py - Math.min(P1.y, P2.y)) / apexH));
    const tubeFade = Math.pow(Math.sin(tVal * Math.PI), 0.7);
    const auraCol = new THREE.Color().lerpColors(
      new THREE.Color(0x38bdf8),
      new THREE.Color(0xfef08a),
      tVal
    );
    auraCol.multiplyScalar(0.42 * tubeFade);
    tubeColors.push(auraCol.r, auraCol.g, auraCol.b);
  }
  tubeGeo.setAttribute('color', new THREE.Float32BufferAttribute(tubeColors, 3));

  const tubeMat = new THREE.MeshBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.0,
    depthWrite: false,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
  });
  const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
  rainbowGroup.add(tubeMesh);

  // --------------------------------------------------------------------------
  // LỚP 4: ÁNH SÁNG TÁN XẠ NỘI VÒM (Inner Arch Sky Diffusion)
  // Trong quang học khí quyển, vùng trời phía dưới vòm cầu vồng luôn sáng hơn bầu trời
  // bên ngoài do các tia khúc xạ hội tụ. Tạo một màng hào quang nhẹ phía dưới lòng vòm.
  // --------------------------------------------------------------------------
  const innerGlowPositions = [];
  const innerGlowColors = [];
  const innerGlowIndices = [];
  const pMidChord = new THREE.Vector3().addVectors(P1, P2).multiplyScalar(0.5);

  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const pt = curve.getPoint(t);
    const tangent = curve.getTangent(t);
    const upNormal = new THREE.Vector3().crossVectors(archBinormal, tangent).normalize();
    if (upNormal.y < 0) upNormal.negate();

    const endFade = Math.pow(Math.sin(t * Math.PI), 0.65);

    // Điểm mép trong của vòm
    const innerPt = new THREE.Vector3().copy(pt).addScaledVector(upNormal, -0.42 * ribbonW);
    innerGlowPositions.push(innerPt.x, innerPt.y, innerPt.z);
    innerGlowColors.push(0.35 * endFade, 0.65 * endFade, 0.95 * endFade);

    // Điểm kéo xuống thấp vào lòng vòm
    const basePt = new THREE.Vector3().lerpVectors(pMidChord, innerPt, 0.35);
    innerGlowPositions.push(basePt.x, basePt.y, basePt.z);
    innerGlowColors.push(0.0, 0.0, 0.0);
  }

  for (let i = 0; i < segs; i++) {
    const a = i * 2;
    const b = a + 1;
    const c = (i + 1) * 2;
    const d = c + 1;
    innerGlowIndices.push(a, b, d);
    innerGlowIndices.push(a, d, c);
  }

  const innerGlowGeo = new THREE.BufferGeometry();
  innerGlowGeo.setAttribute('position', new THREE.Float32BufferAttribute(innerGlowPositions, 3));
  innerGlowGeo.setAttribute('color', new THREE.Float32BufferAttribute(innerGlowColors, 3));
  innerGlowGeo.setIndex(innerGlowIndices);

  const innerGlowMat = new THREE.MeshBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.0,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  });
  const innerGlowMesh = new THREE.Mesh(innerGlowGeo, innerGlowMat);
  rainbowGroup.add(innerGlowMesh);

  scene.add(rainbowGroup);

  // Hàm cập nhật góc quay của dải viewFacingMesh theo camera
  const viewPosAttr = viewRibbonGeo.attributes.position;
  const updateCameraFacing = (camPos) => {
    let pIdx = 0;
    for (let i = 0; i <= segs; i++) {
      const t = i / segs;
      curve.getPoint(t, _rbPt);
      curve.getTangent(t, _rbTan);

      _rbArchUpNormal.crossVectors(archBinormal, _rbTan).normalize();
      if (_rbArchUpNormal.y < 0) _rbArchUpNormal.negate();

      _rbV.subVectors(camPos, _rbPt);
      _rbExp.crossVectors(_rbTan, _rbV).normalize();
      if (_rbExp.lengthSq() < 0.0001) {
        _rbExp.copy(_rbArchUpNormal);
      }
      if (_rbExp.dot(_rbArchUpNormal) < 0) {
        _rbExp.negate();
      }

      for (let j = 0; j < widthSteps; j++) {
        const offset = RAINBOW_SPECTRUM_STOPS[j].frac * ribbonW;
        viewPosAttr.setXYZ(
          pIdx,
          _rbPt.x + _rbExp.x * offset,
          _rbPt.y + _rbExp.y * offset,
          _rbPt.z + _rbExp.z * offset
        );
        pIdx++;
      }
    }
    viewPosAttr.needsUpdate = true;
  };

  activeRainbow = {
    group: rainbowGroup,
    inPlaneRibbonGeo,
    inPlaneRibbonMat,
    viewRibbonGeo,
    viewRibbonMat,
    tubeGeo,
    tubeMat,
    innerGlowGeo,
    innerGlowMat,
    updateCameraFacing,
    applyOpacity: (op) => {
      inPlaneRibbonMat.opacity = op * 0.70;
      viewRibbonMat.opacity = op * 0.88;
      tubeMat.opacity = op * 0.35;
      innerGlowMat.opacity = op * 0.20;
    },
    opacity: 0.0,
    maxOpacity: 0.88,
    state: 'fade_in',
    lifeTimer: 35.0,
  };
}

// Cập nhật hoạt cảnh tuyết rơi và mức độ tích lũy tuyết (Tối ưu hóa hiệu năng cao)
function updateSnow(delta, currentTime) {
  // Cập nhật mức độ phủ tuyết dần dần (Cây, nhà, sân, đường, núi...)
  if (isSnowing && snowAccumulation < 1.0) {
    snowAccumulation = Math.min(1.0, snowAccumulation + delta / 16.0); // Tăng dần trong ~16s
    snowUniforms.uSnowAmount.value = snowAccumulation;
  } else if (!isSnowing && snowAccumulation > 0.0) {
    snowAccumulation = Math.max(0.0, snowAccumulation - delta / 12.0); // Tan dần trong ~12s
    snowUniforms.uSnowAmount.value = snowAccumulation;
  }

  // Cập nhật hạt tuyết rơi bồng bềnh, chao liệng trong gió (Truy cập mảng Float32Array trực tiếp không qua accessor)
  if (isSnowing && snowParticleSystem) {
    const posAttr = snowParticleSystem.geometry.attributes.position;
    const posArr = posAttr.array;
    const timeSec = currentTime * 0.001;

    for (let i = 0; i < snowData.length; i++) {
      const flake = snowData[i];
      const i3 = i * 3;
      let x = posArr[i3];
      let y = posArr[i3 + 1];
      let z = posArr[i3 + 2];

      y -= flake.fallSpeed * delta;
      x += Math.sin(timeSec * flake.swaySpeed + flake.swayPhase) * flake.swayRadius * delta + 0.35 * delta;
      z += Math.cos(timeSec * flake.swaySpeed + flake.swayPhase) * (flake.swayRadius * 0.5) * delta;

      // Tối ưu hóa: Chỉ kiểm tra địa hình khi hạt tuyết đã rơi xuống gần mặt đất (< 24m)
      if (y < 24.0) {
        let groundY = 0.1;
        // Nếu ở ngoài rìa khuôn viên mới cần tính toán sườn núi đồi
        if (x < -105 || x > 105 || z < -85 || z > 75) {
          groundY = getTerrainElevation(x, z);
        }
        if (y < groundY + 0.1 || y < 0) {
          y = 52.0 + Math.random() * 8.0;
          x = -160 + Math.random() * 300;
          z = -185 + Math.random() * 285;
        }
      }

      posArr[i3] = x;
      posArr[i3 + 1] = y;
      posArr[i3 + 2] = z;
    }
    posAttr.needsUpdate = true;
  }
}

// Cập nhật hoạt cảnh cầu vồng đa chiều 3D
function updateRainbow(delta) {
  if (!activeRainbow) return;

  // Luôn cập nhật góc nhìn bám sát camera để cầu vồng luôn dày dặn, không bị mỏng dẹt từ mọi góc nhìn
  if (camera && activeRainbow.updateCameraFacing) {
    activeRainbow.updateCameraFacing(camera.position);
  }

  if (activeRainbow.state === 'fade_in') {
    activeRainbow.opacity = Math.min(activeRainbow.maxOpacity, activeRainbow.opacity + delta * 0.35);
    activeRainbow.applyOpacity(activeRainbow.opacity);
    if (activeRainbow.opacity >= activeRainbow.maxOpacity) {
      activeRainbow.state = 'sustain';
    }
  } else if (activeRainbow.state === 'sustain') {
    activeRainbow.lifeTimer -= delta;
    if (activeRainbow.lifeTimer <= 0) {
      activeRainbow.state = 'fade_out';
    }
  } else if (activeRainbow.state === 'fade_out') {
    activeRainbow.opacity = Math.max(0, activeRainbow.opacity - delta * 0.25);
    activeRainbow.applyOpacity(activeRainbow.opacity);
    if (activeRainbow.opacity <= 0) {
      disposeActiveRainbow();
    }
  }
}

// ============================================================================
// 16. Environment Toggle (Day / Sunset / Night)
// ============================================================================
function setEnvironment(time, isUserAction = false) {
  renderer.shadowMap.needsUpdate = true;
  currentEnv = time;
  const cfg = CONFIG.LIGHTING[time];

  scene.background.set(cfg.skyColor);
  if (scene.fog) {
    if (time === 'day') scene.fog.color.set(CONFIG.WORLD.fogColorDay);
    if (time === 'sunset') scene.fog.color.set(CONFIG.WORLD.fogColorSunset);
    if (time === 'night') scene.fog.color.set(CONFIG.WORLD.fogColorNight);
  }

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
    light.intensity = isNight ? 1.8 : (isSunset ? 0.75 : 0);
  });

  // Phản ứng sinh hoạt của CBNV khi chuyển đổi Ngày / Đêm (CHỈ KÍCH HOẠT KHI NGƯỜI DÙNG BẤM NÚT, KHÔNG HIỆN KHI MỞ TRANG)
  if (isUserAction) {
    if (isNight) {
      showCampusToast('🌙 Trời tối - Đèn đường bật sáng: Mọi người đi bộ & chạy vào Nhà Ăn CBNV dùng bữa tối!', 'night');
      triggerEventSpeechBubbles('night');
    } else if (time === 'day' || time === 'sunset') {
      showCampusToast(time === 'day' ? '☀️ Bắt đầu ngày mới: Mọi người trở lại vị trí làm việc và tiếp tục các hoạt động!' : '🌇 Chiều hoàng hôn: Không khí mát mẻ, làm việc hăng say!', 'day');
      triggerEventSpeechBubbles('day');
    }
  }

  logoLight.intensity = isNight ? 1.8 : (isSunset ? 0.8 : 0);
  if (nhaALogoLight) nhaALogoLight.intensity = isNight ? 2.0 : (isSunset ? 0.8 : 0);
  if (nhaDieuHanhDK2LogoLight) nhaDieuHanhDK2LogoLight.intensity = isNight ? 2.0 : (isSunset ? 0.8 : 0);

  // Đèn chữ nổi phát sáng trên các tòa nhà ban đêm (Nhà điều hành DK1, Xưởng Nhà B, Nhà điều hành DK2)
  illuminatedLogoMats.forEach((mat) => {
    if (isNight) {
      mat.emissive.set(mat.userData.nightColor || 0x67e8f9);
      mat.emissiveIntensity = 2.4;
    } else if (isSunset) {
      mat.emissive.set(mat.userData.sunsetColor || 0x0284c7);
      mat.emissiveIntensity = 0.8;
    } else {
      mat.emissive.set(0x000000);
      mat.emissiveIntensity = 0;
    }
  });

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

  if (dewSparkleSystem) {
    dewSparkleSystem.setEnvironment(time);
  }
}

// ============================================================================
// 17. 3D HTML Labels & Interaction (DK1 & DK2)
// ============================================================================
function createBuildingLabels() {
  const container = document.body;
  const labelsData = [
    // DK1
    { text: 'Nhà B (Xưởng 3 tầng - Dài 44m)', pos: new THREE.Vector3(65, 14.5, -55), id: 'nhaB' },
    { text: 'Nhà A (Văn phòng)', pos: new THREE.Vector3(35, 12.0, -35), id: 'nhaA' },
    { text: 'Nhà C (Mái tôn xanh)', pos: new THREE.Vector3(45, 7.5, -58.5), id: 'nhaC' },
    { text: 'Nhà ăn CBNV', pos: new THREE.Vector3(23, 11.5, -12), id: 'nhaAn' },
    { text: 'Mái che xe 3 bánh', pos: new THREE.Vector3(79.5, 5.0, -46), id: 'maiCheXe' },
    { text: '⚡ Trạm sạc nhanh EV', pos: new THREE.Vector3(26, 3.2, -24), id: 'chargerDK1' },
    { text: '🚪 Cửa xưởng & Bốc dỡ', pos: new THREE.Vector3(58, 5.2, -32), id: 'doorB1' },
    { text: '🏐 Sân bóng chuyền DK1', pos: new THREE.Vector3(51, 3.8, -12), id: 'volleyballCourt' },
    { text: '⛲ Đài phun nước DK (5m)', pos: new THREE.Vector3(36.6, 4.2, -12), id: 'fountainDK' },
    { text: '🌳 Cây bóng mát (Cách Nhà Ăn 10m)', pos: new THREE.Vector3(23, 4.6, 4), id: 'landscapeTree' },
    { text: '🏍️ Khu tập kết xe sau chạy thử', pos: new THREE.Vector3(67, 2.5, -30), id: 'stagingBikes' },
    // Nội thất Xưởng B
    { text: '🔧 Dây chuyền lắp ráp DK Bike', pos: new THREE.Vector3(63.2, 3.2, -45), id: 'insideAssemblyLine' },
    { text: '🛗 Thang tời hàng 2.5T', pos: new THREE.Vector3(56.2, 4.2, -36.5), id: 'insideFreightLift' },
    { text: '📦 Giá kệ kho linh kiện', pos: new THREE.Vector3(70.5, 3.8, -48), id: 'insidePartsRacks' },
    { text: '🛵 Khu tập kết xe thành phẩm', pos: new THREE.Vector3(57.8, 2.2, -50), id: 'insideStagingArea' },

    // Tuyến đường sắt, Cầu vòm đỏ & Cảnh quan sinh thái mới (Theo ảnh mẫu)
    { text: '🚂 Tàu hơi nước & Đường sắt', pos: new THREE.Vector3(92, 5.5, -20), id: 'steamLoco' },
    { text: '🌉 Cầu vòm đỏ (Red Arch)', pos: new THREE.Vector3(95, 5.5, -49), id: 'redArchBridge' },
    { text: '🚉 Ga xe lửa DK Station', pos: new THREE.Vector3(88, 5.0, -2), id: 'dkStation' },
    { text: '⛵ Thuyền chèo đò trên sông', pos: new THREE.Vector3(91.8, 1.8, -82), id: 'rowingBoat' },
    { text: '🐑 Đàn cừu trên bãi cỏ', pos: new THREE.Vector3(108, 2.6, -45), id: 'sheepFlock' },
    { text: '🌾 Cối xay gió sinh thái', pos: new THREE.Vector3(58, 33.0, -128), id: 'windmill' },

    // DK2
    { text: 'Nhà điều hành DK2 (HQ)', pos: new THREE.Vector3(-36, 13.0, -10), id: 'nhaDieuHanhDK2' },
    { text: 'Kho Linh kiện D2.1', pos: new THREE.Vector3(-50, 8.0, -46), id: 'khoLinhKienDK2' },
    { text: '🏍️ Sân kiểm định xe DK2', pos: new THREE.Vector3(-75, 2.5, 7), id: 'xuongDK2' },
    { text: 'Sân xe thành phẩm DK2', pos: new THREE.Vector3(-78, 2.0, -23), id: 'sanThanhPhamDK2' },
    { text: 'Vườn Lan trên đồi', pos: new THREE.Vector3(-108, 21.0, -66), id: 'vuonLanDK2' },
    { text: '🐟 Ao cá đồi sinh thái', pos: new THREE.Vector3(-132, 22.0, -54), id: 'aoCaDK2' },
    { text: '🕊️ Đồi hoa & chim gà', pos: new THREE.Vector3(-148, 25.5, -16), id: 'doiGaDK2' },
    { text: '🌿 Đường mòn sinh thái DK2', pos: new THREE.Vector3(-96, 5.5, -38), id: 'ecoTrailDK2' },
    // Nhà dân ven đường ĐT234
    { text: '🏡 Xóm nhà dân ven ĐT234', pos: new THREE.Vector3(7, 4.5, 38), id: 'roadsideHouse_1' },
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
      insideAssemblyLine: { type: 'factory', title: 'Dây chuyền lắp ráp xe máy điện DK Bike' },
      insideFreightLift: { type: 'lift', title: 'Thang tời hàng công nghiệp 2.5 Tấn' },
      insidePartsRacks: { type: 'warehouse', title: 'Giá kệ kho linh kiện & Pallet động cơ' },
      insideStagingArea: { type: 'staging', title: 'Khu tập kết xe máy điện thành phẩm' },
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
  // Nếu điểm cần focus nằm trong khuôn viên Xưởng B, tự động mở mái để quan sát
  const isInsideNhaB = (targetPoint.x >= 53.0 && targetPoint.x <= 77.0 && targetPoint.z >= -78.0 && targetPoint.z <= -33.0 && targetPoint.y <= 14.0);
  if (nhaBRoofGroupGlobal) {
    nhaBRoofGroupGlobal.visible = !isInsideNhaB;
  }

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

const _tempLabelV = new THREE.Vector3();
let _lastLabelCamPos = new THREE.Vector3();
let _lastLabelCamTarget = new THREE.Vector3();

function updateLabels() {
  if (!showLabels) {
    labelElements.forEach((l) => {
      if (l.visible) {
        l.el.style.display = 'none';
        l.visible = false;
      }
    });
    return;
  }

  // Bỏ qua cập nhật DOM nếu camera đứng yên không xoay chuyển (giảm 100% DOM reflow khi đứng yên)
  const camMoved = _lastLabelCamPos.distanceToSquared(camera.position) > 0.0001 ||
                   _lastLabelCamTarget.distanceToSquared(controls.target) > 0.0001;
  if (!camMoved) return;

  _lastLabelCamPos.copy(camera.position);
  _lastLabelCamTarget.copy(controls.target);

  const camPos = camera.position;

  labelElements.forEach((l) => {
    _tempLabelV.copy(l.worldPos);
    _tempLabelV.project(camera);

    if (_tempLabelV.z > 1) {
      if (l.visible) {
        l.el.style.display = 'none';
        l.visible = false;
      }
      return;
    }

    if (!l.visible) {
      l.el.style.display = 'flex';
      l.visible = true;
    }

    const x = Math.round((_tempLabelV.x * 0.5 + 0.5) * window.innerWidth);
    const y = Math.round((-(_tempLabelV.y * 0.5) + 0.5) * window.innerHeight);

    // Khoảng cách camera tới nhãn: Chỉ thay đổi class khi trạng thái thay đổi
    const dist = camPos.distanceTo(l.worldPos);
    const isNear = dist < 68;
    if (l.isNear !== isNear) {
      l.isNear = isNear;
      l.el.classList.toggle('is-near', isNear);
    }

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
      "Ghé vườn hoa cạnh chuồng chụp ảnh sống ảo hông? 🌸",
      "Cục ta cục tác! DK Bike xe xịn cho cả nhà cùng vui! 🐣🛵",
      "Chip chip~ Đứng trên cầu gỗ nhìn cá bơi dưới hồ đồi vui ghê! 🐥🐟"
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
      "Chúc các cô chú công nhân DK Bike một ngày tràn năng lượng! 🌿",
      "Beee~ Cả gia đình cùng vi vu xe điện DK Bike êm ru nha! 🐑❤️",
      "Beee beee~ Mùi cà phê DK Coffee thơm lừng cả góc phân khu! ☕🍀"
    ]
  },
  human: {
    icon: '👷',
    typeClass: 'type-human',
    heightOffset: 1.95,
    quotes: [
      "DK Bike - Xe cho cả gia đình ❤️🛵",
      "DK Bike - Tự hào thương hiệu xe điện quốc dân cho cả nhà! 🇻🇳🏡",
      "Mẻ xe Roma SX hôm nay nước sơn bóng loáng xuất sắc! ✨",
      "Động cơ IP67 test ngập nước 10/10 êm ru! 🛵💦",
      "Sắp tới giờ ăn trưa rồi, cơm Nhà Ăn ngon lắm nha! 🍱",
      "Vừa KCS xong lô xe DK Gogo & DK Nova xuất xưởng phục vụ khách hàng! 🛠️",
      "Pin Lithium thế hệ mới nạp siêu nhanh vượt mong đợi! ⚡",
      "Ghé quán DK Coffee đối diện làm ly bạc xỉu ngắm hồ cá nào! ☕🐟",
      "Hồ cá koi bên cạnh Nhà điều hành DK2 nước trong veo thích quá! ✨🐠",
      "Lên cầu gỗ ao đồi ngắm đàn cá nhảy tung tăng thích mắt thật! 🪵🐟",
      "Chiều buông khói lam bên mấy nếp nhà ven đường yên ả quá~ 🏡🍃",
      "Làm cốc cà phê ngắm đài phun nước DK chill thật ☕⛲",
      "Khuôn viên nhà máy xanh mát như resort sinh thái vậy 🌿",
      "Pha đập bóng chuyền uy lực chuẩn chỉ quá anh em ơi! 🏐🔥",
      "Cứu bóng đỉnh chóp! Hiệp này xưởng mình quyết thắng! 👏🏆",
      "Cổng an ninh số 1 thông thoáng, chào mừng quý đối tác! 🫡",
      "Tu tu xình xịch~ Tàu vừa cập bến ga DK Station! 🚂💨",
      "Vườn Lan trên đồi hôm nay hoa nở rực rỡ ngát hương 🌺",
      "Trạm sạc nhanh 45 phút là đầy ắp năng lượng vi vu rồi 🔋⚡",
      "DK Bike tự hào xe điện thương hiệu Việt chất lượng cao! 🇻🇳🛵",
      "Leo dốc sa thạch lên Vườn Lan ngắm cảnh thoáng đãng tuyệt vời! 🥾🌸",
      "Kiểm tra từng chi tiết phanh, đèn, tem xuất xưởng bãi xe DK2! 📋🔍"
    ]
  }
};

function triggerRandomSpeechBubble() {
  if (activeSpeechBubbles.length >= 1) return; // Tối đa 1 bubble duy nhất trên toàn màn hình

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
      hillHikers.forEach(h => people.push({ mesh: h.mesh, type: 'human', icon: '🥾' }));
      dk2Inspectors.forEach(insp => people.push({ mesh: insp.mesh, type: 'human', icon: '📋' }));
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

const _tempSpeechWorldPos = new THREE.Vector3();
const _tempSpeechV = new THREE.Vector3();

function updateCuteSpeechBubbles(delta) {
  // Đếm ngược xuất hiện bubble tiếp theo
  nextSpeechTimer -= delta;
  if (nextSpeechTimer <= 0) {
    triggerRandomSpeechBubble();
    // Thời gian giãn cách ngẫu nhiên từ 4.5s đến 7.5s
    nextSpeechTimer = 20.0 + Math.random() * 12.0; // Giãn cách 20-32s xuất hiện thưa thớt nhẹ nhàng
  }

  if (activeSpeechBubbles.length === 0) return;

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

    // Tính toán vị trí 3D -> 2D màn hình (Tái sử dụng vector tĩnh)
    b.speakerMesh.getWorldPosition(_tempSpeechWorldPos);
    _tempSpeechWorldPos.y += b.heightOffset;

    _tempSpeechV.copy(_tempSpeechWorldPos);
    _tempSpeechV.project(camera);

    // Nếu nằm sau camera thì ẩn tạm
    if (_tempSpeechV.z > 1.0) {
      b.el.style.display = 'none';
      continue;
    }

    const sx = (_tempSpeechV.x * 0.5 + 0.5) * window.innerWidth;
    const sy = (-(_tempSpeechV.y * 0.5) + 0.5) * window.innerHeight;

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

  // Tự động mở mái và mặt tiền xưởng B khi xem góc nhìn nội thất bên trong, khôi phục khi xem toàn cảnh
  const isInside = (key === 'insideNhaB' || key.startsWith('inside'));
  if (nhaBRoofGroupGlobal) {
    nhaBRoofGroupGlobal.visible = !isInside;
  }

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

  const labelEl = document.getElementById('current-preset-label');
  if (labelEl && preset) {
    labelEl.innerText = 'Góc nhìn: ' + (preset.name ? preset.name.split('(')[0].trim() : key);
  }
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
  // Preset buttons: Chọn góc nhìn và tự động đóng dropdown (Auto Ẩn)
  document.querySelectorAll('.preset-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      setCameraPreset(btn.dataset.view);
      const presetsWrapper = document.getElementById('view-presets-wrapper');
      if (presetsWrapper) presetsWrapper.classList.add('is-collapsed');
    });
  });

  // Time toggle buttons
  document.querySelectorAll('.toggle-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      setEnvironment(btn.dataset.time, true);
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

  // Rain toggle & synchronization
  const rainBtn = document.getElementById('btn-toggle-rain');
  const updateRainState = (enabled) => {
    isRaining = enabled;
    if (rainBtn) rainBtn.classList.toggle('active', enabled);
    if (rainParticles) rainParticles.visible = enabled;
    if (rainSplashMesh) rainSplashMesh.visible = enabled;
    stylizedWaterMaterials.forEach((m) => {
      if (m.uniforms && m.uniforms.uIsRaining) {
        m.uniforms.uIsRaining.value = enabled ? 1.0 : 0.0;
      }
    });
    const rainSwitch = document.getElementById('switch-sfx-rain');
    if (rainSwitch && rainSwitch.checked !== enabled) {
      rainSwitch.checked = enabled;
    }
    audioManager.toggleRain(enabled);

    if (enabled) {
      if (isSnowing) {
        updateSnowState(false);
      }
      if (activeRainbow) {
        activeRainbow.state = 'fade_out';
      }
      lightningCooldown = 0.8; // Ngay khi bật Mưa, xuất hiện tia sét sau 0.8 giây!
      // Hiện toast và câu nói trú mưa sinh động
      showCampusToast('🌧️ Trời đổ mưa rào: Mọi người nhanh chân chạy vào các hiên nhà để trú mưa!', 'rain');
      triggerEventSpeechBubbles('rain');
    } else {
      if (activeLightningGroup) {
        scene.remove(activeLightningGroup);
        activeLightningGroup = null;
      }
      if (lightningFlashLight) lightningFlashLight.intensity = 0;
      if (ambientLight && CONFIG.LIGHTING[currentEnv]) {
        ambientLight.intensity = CONFIG.LIGHTING[currentEnv].ambientIntensity;
      }
      if (dirLight && CONFIG.LIGHTING[currentEnv]) {
        dirLight.intensity = CONFIG.LIGHTING[currentEnv].sunIntensity;
      }
      lightningCooldown = 0.8;
      // Hiện toast và câu nói tạnh mưa đáng yêu
      showCampusToast('☀️ Tạnh mưa rồi: Cầu vồng rực rỡ xuất hiện nối 2 ngọn núi!', 'sun');
      triggerEventSpeechBubbles('sun');
      spawnRandomRainbow();
    }
  };

  if (rainBtn) {
    rainBtn.addEventListener('click', () => {
      updateRainState(!isRaining);
    });
  }

  // Snow toggle (Request 3)
  const snowBtn = document.getElementById('btn-toggle-snow');
  if (snowBtn) {
    snowBtn.addEventListener('click', () => {
      updateSnowState(!isSnowing);
    });
  }

  // ==========================================================================
  // Ánh sương lung linh trên cây (Request 1)
  // ==========================================================================
  const dewBtn = document.getElementById('btn-toggle-dew');
  const dewSwitch = document.getElementById('switch-dew-toggle');
  const dewSlider = document.getElementById('slider-dew-intensity');

  const updateDewState = (enabled) => {
    if (dewSparkleSystem) dewSparkleSystem.setEnabled(enabled);
    if (dewBtn) dewBtn.classList.toggle('active', enabled);
    if (dewSwitch) dewSwitch.checked = enabled;
  };

  if (dewBtn) {
    dewBtn.addEventListener('click', () => {
      const newState = dewSparkleSystem ? !dewSparkleSystem.enabled : true;
      updateDewState(newState);
    });
  }

  if (dewSwitch) {
    dewSwitch.addEventListener('change', (e) => {
      updateDewState(e.target.checked);
    });
  }

  if (dewSlider) {
    dewSlider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value) / 100;
      if (dewSparkleSystem) dewSparkleSystem.setIntensity(val);
    });
  }

  // ==========================================================================
  // Bảng điều khiển Âm thanh & Nhạc (8 Thể Loại & Tinh Chỉnh)
  // ==========================================================================
  const audioPanel = document.getElementById('audio-panel');
  const audioPanelBtn = document.getElementById('btn-toggle-audio-panel');
  const audioCloseBtn = document.getElementById('btn-close-audio-panel');
  const muteAllBtn = document.getElementById('btn-audio-mute-all');

  if (audioPanelBtn && audioPanel) {
    audioPanelBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      audioPanel.classList.toggle('hidden');
      audioPanelBtn.classList.toggle('active', !audioPanel.classList.contains('hidden'));
    });
  }

  if (audioCloseBtn && audioPanel) {
    audioCloseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      audioPanel.classList.add('hidden');
      if (audioPanelBtn) audioPanelBtn.classList.remove('active');
    });
  }

  // Đóng panel khi bấm phím Escape
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && audioPanel && !audioPanel.classList.contains('hidden')) {
      audioPanel.classList.add('hidden');
      if (audioPanelBtn) audioPanelBtn.classList.remove('active');
    }
  });

  // Đóng panel khi click bên ngoài
  document.addEventListener('click', (e) => {
    if (
      audioPanel &&
      !audioPanel.classList.contains('hidden') &&
      !audioPanel.contains(e.target) &&
      audioPanelBtn &&
      !audioPanelBtn.contains(e.target)
    ) {
      audioPanel.classList.add('hidden');
      audioPanelBtn.classList.remove('active');
    }
  });

  // Dừng toàn bộ âm thanh (Mute All)
  if (muteAllBtn) {
    muteAllBtn.addEventListener('click', () => {
      audioManager.stopAll();
      youtubeAudioManager.stop();
      updateRainState(false);
      const birdsSwitch = document.getElementById('switch-sfx-birds');
      if (birdsSwitch) birdsSwitch.checked = false;
      const trainSwitch = document.getElementById('switch-sfx-train');
      if (trainSwitch) trainSwitch.checked = false;
      if (typeof updateYouTubeUI === 'function') updateYouTubeUI(false);
    });
  }

  // Sóng nhạc ở thanh menu Header
  const audioWaveAnim = document.getElementById('audio-wave-anim');

  // ==========================================================================
  // Khởi tạo YouTube Audio Engine & Sự Kiện (6 Bản Nhạc Tuyển Chọn & Tự Động Phát)
  // ==========================================================================
  youtubeAudioManager.init('yt-player-target', true);

  const ytUrlInput = document.getElementById('yt-url-input');
  const ytBtnPaste = document.getElementById('btn-yt-paste');
  const ytBtnLoad = document.getElementById('btn-yt-load');
  const ytStatusPill = document.getElementById('yt-status-pill');
  const ytTrackTitle = document.getElementById('yt-track-title');
  const ytErrorMsg = document.getElementById('yt-error-msg');
  const btnYtPrev = document.getElementById('btn-yt-prev');
  const btnYtPlayToggle = document.getElementById('btn-yt-play-toggle');
  const btnYtNext = document.getElementById('btn-yt-next');
  const btnYtStop = document.getElementById('btn-yt-stop');
  const sliderYtVolume = document.getElementById('slider-yt-volume');
  const ytChips = document.querySelectorAll('.yt-chip');

  const updateYouTubeUI = (isPlaying, title, trackIdx) => {
    if (ytStatusPill) {
      ytStatusPill.innerText = isPlaying ? 'Đang phát 🔴' : 'Tạm dừng';
      ytStatusPill.classList.toggle('active', isPlaying);
    }
    if (btnYtPlayToggle) {
      btnYtPlayToggle.innerText = isPlaying ? '⏸' : '▶';
    }
    const idx = typeof trackIdx === 'number' ? trackIdx : youtubeAudioManager.currentTrackIndex;
    const currentTrack = DEFAULT_YOUTUBE_PLAYLIST[idx];

    if (ytTrackTitle) {
      ytTrackTitle.innerText = title || (currentTrack ? currentTrack.name : 'YouTube Music');
    }
    if (ytUrlInput && currentTrack) {
      ytUrlInput.value = currentTrack.url;
    }

    // Đồng bộ trạng thái active của chip đang phát trong 6 bản
    ytChips.forEach((chip) => {
      const chipIndex = parseInt(chip.dataset.index, 10);
      chip.classList.toggle('active', chipIndex === idx);
    });

    if (audioWaveAnim) {
      audioWaveAnim.classList.toggle('is-playing', isPlaying);
    }
  };

  youtubeAudioManager.onStateChange = (isPlaying, title, trackIdx) => {
    updateYouTubeUI(isPlaying, title, trackIdx);
  };

  youtubeAudioManager.onTrackChange = (trackIdx) => {
    updateYouTubeUI(youtubeAudioManager.isPlaying, youtubeAudioManager.getVideoTitle(), trackIdx);
  };

  youtubeAudioManager.onError = (errMsg) => {
    if (ytErrorMsg) {
      ytErrorMsg.innerText = errMsg;
      ytErrorMsg.classList.remove('hidden');
    }
    if (ytStatusPill) {
      ytStatusPill.innerText = 'Lỗi';
      ytStatusPill.classList.remove('active');
    }
  };

  // Nút Dán link từ clipboard
  if (ytBtnPaste && ytUrlInput) {
    ytBtnPaste.addEventListener('click', async () => {
      try {
        const text = await navigator.clipboard.readText();
        if (text) {
          ytUrlInput.value = text;
          ytUrlInput.focus();
        }
      } catch (err) {
        ytUrlInput.focus();
      }
    });
  }

  // Nút Phát link tự nhập
  if (ytBtnLoad && ytUrlInput) {
    ytBtnLoad.addEventListener('click', () => {
      const url = ytUrlInput.value.trim();
      const { id, startSeconds } = extractYouTubeIdAndStart(url);
      if (id) {
        if (ytErrorMsg) ytErrorMsg.classList.add('hidden');
        youtubeAudioManager.playTrack(id, startSeconds);
        if (ytTrackTitle) ytTrackTitle.innerText = 'Đang kết nối YouTube...';
        updateYouTubeUI(true, 'Đang tải...');
        ytChips.forEach((c) => c.classList.remove('active'));
      } else {
        if (ytErrorMsg) {
          ytErrorMsg.innerText = 'Link YouTube chưa hợp lệ. Vui lòng kiểm tra lại link!';
          ytErrorMsg.classList.remove('hidden');
        }
      }
    });

    ytUrlInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        ytBtnLoad.click();
      }
    });
  }

  // Chọn bài trong danh sách 6 bài tuyển chọn
  ytChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const index = parseInt(chip.dataset.index, 10);
      youtubeAudioManager.playTrackByIndex(index);
    });
  });

  // Nút Lùi bài YouTube (Prev)
  if (btnYtPrev) {
    btnYtPrev.addEventListener('click', () => {
      youtubeAudioManager.prevTrack();
    });
  }

  // Nút Tiến bài YouTube (Next)
  if (btnYtNext) {
    btnYtNext.addEventListener('click', () => {
      youtubeAudioManager.nextTrack();
    });
  }

  // Nút Tạm dừng / Tiếp tục YouTube
  if (btnYtPlayToggle) {
    btnYtPlayToggle.addEventListener('click', () => {
      youtubeAudioManager.togglePlay();
    });
  }

  // Nút Dừng hẳn YouTube
  if (btnYtStop) {
    btnYtStop.addEventListener('click', () => {
      youtubeAudioManager.stop();
      updateYouTubeUI(false);
      if (ytStatusPill) {
        ytStatusPill.innerText = 'Đã dừng';
        ytStatusPill.classList.remove('active');
      }
    });
  }

  // Âm lượng YouTube
  if (sliderYtVolume) {
    sliderYtVolume.addEventListener('input', (e) => {
      youtubeAudioManager.setVolume(parseFloat(e.target.value));
    });
  }

  // SFX 1: Tiếng chim hót
  const birdsSwitch = document.getElementById('switch-sfx-birds');
  if (birdsSwitch) {
    birdsSwitch.addEventListener('change', (e) => {
      audioManager.toggleBirds(e.target.checked);
    });
  }

  // SFX 2: Tiếng tàu điện
  const trainSwitch = document.getElementById('switch-sfx-train');
  if (trainSwitch) {
    trainSwitch.addEventListener('change', (e) => {
      audioManager.toggleTrain(e.target.checked);
    });
  }

  // SFX 3: Tiếng mưa rơi (đồng bộ hoàn hảo với 3D & nút Header)
  const rainSwitch = document.getElementById('switch-sfx-rain');
  if (rainSwitch) {
    rainSwitch.addEventListener('change', (e) => {
      updateRainState(e.target.checked);
    });
  }

  // Âm lượng hiệu ứng môi trường
  const sfxVolSlider = document.getElementById('slider-sfx-volume');
  if (sfxVolSlider) {
    sfxVolSlider.addEventListener('input', (e) => {
      audioManager.setSfxVolume(parseFloat(e.target.value) / 100);
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
    else if (tag.includes('factory') || tag.includes('lift') || tag.includes('warehouse') || tag.includes('staging') || title.includes('dây chuyền') || title.includes('thang tời') || title.includes('linh kiện') || title.includes('tập kết') || title.includes('bên trong')) setCameraPreset('insideNhaB');
    else if (title.includes('nhà a') || title.includes('văn phòng') || title.includes('điều hành dk1')) setCameraPreset('nhaA');
    else if (tag.includes('dk1') || tag === 'nhab') setCameraPreset('nhaB');
    else if (tag.includes('dk2') || title.includes('điều hành dk2') || title.includes('hq')) setCameraPreset('nhaDieuHanh');
    else if (tag.includes('lan')) setCameraPreset('vuonLan');
    else if (tag.includes('bốc') || tag.includes('xưởng')) setCameraPreset('logistics');
    else if (tag.includes('sạc')) setCameraPreset('chargingHub');
  });

  // Toggle collapsible Presets dropdown (Auto Ẩn khi chọn hoặc click ra ngoài) (Khối 6)
  const togglePresetsBtn = document.getElementById('btn-toggle-presets');
  const presetsWrapper = document.getElementById('view-presets-wrapper');
  if (togglePresetsBtn && presetsWrapper) {
    togglePresetsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      presetsWrapper.classList.toggle('is-collapsed');
    });

    // Tự động ẩn dropdown khi click ra ngoài
    document.addEventListener('pointerdown', (e) => {
      if (!presetsWrapper.classList.contains('is-collapsed') && !presetsWrapper.contains(e.target)) {
        presetsWrapper.classList.add('is-collapsed');
      }
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
      if (presetsWrapper && !presetsWrapper.classList.contains('is-collapsed')) {
        presetsWrapper.classList.add('is-collapsed');
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
        // Nếu click vào cửa cuốn -> Hiển thị thông tin cửa (cửa luôn mở sẵn tự động)
        if (hitObj.userData.type === 'shutterDoor') {
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
  renderer.setPixelRatio(adaptiveQuality ? adaptiveQuality.pixelRatio : Math.min(window.devicePixelRatio, 1.25));
}

// ============================================================================
// Tối ưu hiệu năng: gộp mesh tĩnh, gom đèn, chất lượng thích ứng
// ============================================================================
function optimizeScenePerformance() {
  // 1. Gộp mesh tĩnh: mô phỏng animation để phát hiện vật thể chuyển động / đổi màu
  try {
    batchStaticMeshes(scene, {
      clickables: [...buildingMeshes, ...interactiveObjects],
      simulate: (checkpoint) => {
        const envBefore = currentEnv;
        const doorsBefore = areDoorsOpen;
        let t = performance.now();
        const run = (steps) => {
          for (let i = 0; i < steps; i++) {
            t += 50;
            try { updateAnimatedObjects(0.05, t); } catch (e) {}
            if (i % 25 === 0) checkpoint();
          }
        };
        run(300);
        setEnvironment('night'); run(120);
        setEnvironment('sunset'); run(60);
        toggleShutterDoors(); run(200);
        toggleShutterDoors(); run(200);
        if (areDoorsOpen !== doorsBefore) toggleShutterDoors();
        if (nhaBRoofGroupGlobal) {
          nhaBRoofGroupGlobal.visible = false;
          checkpoint();
          nhaBRoofGroupGlobal.visible = true;
          checkpoint();
        }
        setEnvironment(envBefore);
      },
    });
  } catch (err) {
    console.warn('[Optimizer] Static batching failed, continuing unbatched:', err);
  }

  // 2. Tối ưu bóng đổ: Loại bỏ castShadow trên các chi tiết nhỏ li ti (cốc chén, chân ghế, chấn song...)
  pruneSmallShadowCasters(scene);

  // 3. Gom ~95 đèn điểm thành pool nhỏ
  lightPool = new LightPool(scene, 4);

  // 4. Chất lượng thích ứng theo FPS thực tế
  adaptiveQuality = new AdaptiveQuality(renderer, {
    onChange: (q) => {
      const p = q.preset;
      shadowUpdateEvery = p.shadowEvery;
      renderer.shadowMap.enabled = p.shadows;
      renderer.shadowMap.needsUpdate = p.shadows;
      if (lightPool) lightPool.setSize(p.lights);
      if (dewSparkleSystem) dewSparkleSystem.setIntensity(p.dewDensity);
      updateQualityButton();
    },
  });

  const qualityBtn = document.getElementById('btn-toggle-quality');
  if (qualityBtn) {
    qualityBtn.addEventListener('click', () => {
      const order = ['auto', 'high', 'medium', 'low'];
      const next = order[(order.indexOf(adaptiveQuality.mode) + 1) % order.length];
      adaptiveQuality.setMode(next);
      updateQualityButton();
    });
  }
  updateQualityButton();
}

function updateQualityButton() {
  const label = document.getElementById('quality-btn-label');
  if (!label || !adaptiveQuality) return;
  const tierLabel = QUALITY_PRESETS[adaptiveQuality.tier].label;
  label.innerText = adaptiveQuality.mode === 'auto' ? `Tự động (${tierLabel})` : tierLabel;
}

// ============================================================================
// 21. Animation Loop
// ============================================================================
let lastTime = performance.now();

function animate(time) {
  requestAnimationFrame(animate);

  const currentTime = typeof time === 'number' ? time : performance.now();
  const rawDelta = (currentTime - lastTime) / 1000;
  const delta = (!isNaN(rawDelta) && rawDelta > 0) ? Math.min(rawDelta, 0.05) : 0.016;
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

  // Update snowfall & progressive snow accumulation (Request 3)
  updateSnow(delta, currentTime);

  // Update 3D arched rainbow between 2 mountains (Request 2)
  updateRainbow(delta);

  // Update glistening dew sparkles on trees & foliage (Request 1)
  if (dewSparkleSystem) {
    dewSparkleSystem.update(delta, currentTime);
  }

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
  if (fountainWaterMesh) {
    updateDKFountain(delta, currentTime);
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
  // Bóng đổ: tần suất cập nhật theo cấp chất lượng (0 = bóng tĩnh, không cập nhật lại)
  if (shadowUpdateEvery > 0 && frameCount % shadowUpdateEvery === 0) {
    renderer.shadowMap.needsUpdate = true;
  }
  if (lightPool) lightPool.update(controls.target);
  if (adaptiveQuality) adaptiveQuality.tick(currentTime);
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
