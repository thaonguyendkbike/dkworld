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
let animatedBike, bikeTrackAngle = 0;
let waterMesh;
let buildingMeshes = [];
let windowLights = [];
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
let hoveredMesh = null;

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
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
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

  // Build 3D Diorama Elements
  buildGround();
  buildRetainingWall();
  buildCanalAndRailway();
  buildRoadsAndTestTrack();
  buildBuildings();
  buildCanopyAndBikes();
  buildLandscaping();
  setupAnimatedBike();
  setupRainEffect();

  // Create 3D HTML Labels
  createBuildingLabels();

  // Event Listeners
  setupEventListeners();

  // Window resize handler
  window.addEventListener('resize', onWindowResize);

  // Start Animation Loop
  animate();
}

// ============================================================================
// 2. Lighting System
// ============================================================================
function setupLights() {
  // Ambient Light
  ambientLight = new THREE.AmbientLight(
    CONFIG.LIGHTING.day.ambientColor,
    CONFIG.LIGHTING.day.ambientIntensity
  );
  scene.add(ambientLight);

  // Hemisphere Light for soft natural sky/ground reflection
  hemiLight = new THREE.HemisphereLight(
    CONFIG.LIGHTING.day.skyColor,
    CONFIG.LIGHTING.day.groundColor,
    0.45
  );
  scene.add(hemiLight);

  // Directional Sun Light with shadows
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
  dirLight.shadow.camera.far = 300;

  // Fit shadow frustum around DK1 campus
  const d = 90;
  dirLight.shadow.camera.left = -d;
  dirLight.shadow.camera.right = d;
  dirLight.shadow.camera.top = d;
  dirLight.shadow.camera.bottom = -d;
  dirLight.shadow.bias = -0.0005;
  scene.add(dirLight);

  // Point light for nighttime DK Bike logo glow
  logoLight = new THREE.PointLight(0xffb703, 0, 30);
  logoLight.position.set(CONFIG.BUILDINGS.nhaB.position.x, 14, CONFIG.BUILDINGS.nhaB.position.z + 18);
  scene.add(logoLight);
}

// ============================================================================
// 3. Ground & Terrain Building
// ============================================================================
function buildGround() {
  // Main concrete yard platform
  const groundGeo = new THREE.BoxGeometry(CONFIG.GROUND.width, 2.0, CONFIG.GROUND.depth);
  const groundMat = new THREE.MeshStandardMaterial({
    color: CONFIG.GROUND.color,
    roughness: 0.85,
    metalness: 0.1,
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.position.set(CONFIG.GROUND.center.x, -1.0, CONFIG.GROUND.center.z);
  ground.receiveShadow = true;
  scene.add(ground);

  // Grass / Hillside surrounding terrain (North / West)
  const hillGeo = new THREE.ConeGeometry(CONFIG.HILLS.radius, CONFIG.HILLS.height, 9);
  const hillMat = new THREE.MeshStandardMaterial({
    color: CONFIG.HILLS.color,
    roughness: 0.9,
    flatShading: true,
  });
  const hill = new THREE.Mesh(hillGeo, hillMat);
  hill.position.set(CONFIG.HILLS.position.x, CONFIG.HILLS.height / 2 - 2, CONFIG.HILLS.position.z);
  hill.receiveShadow = true;
  scene.add(hill);

  // Secondary smaller hill mound
  const subHillGeo = new THREE.ConeGeometry(25, 12, 7);
  const subHill = new THREE.Mesh(subHillGeo, hillMat);
  subHill.position.set(CONFIG.HILLS.position.x + 35, 4, CONFIG.HILLS.position.z + 10);
  subHill.receiveShadow = true;
  scene.add(subHill);
}

// ============================================================================
// 4. Retaining Wall, Canal & Railway
// ============================================================================
function buildRetainingWall() {
  const wallConfig = CONFIG.RETAINING_WALL;
  const wallGeo = new THREE.BoxGeometry(wallConfig.width, wallConfig.height, 125);
  const wallMat = new THREE.MeshStandardMaterial({
    color: wallConfig.color,
    roughness: 0.9,
    metalness: 0.05,
    flatShading: true,
  });
  const wall = new THREE.Mesh(wallGeo, wallMat);
  wall.position.set(wallConfig.positionX, -wallConfig.height / 2 + 0.2, CONFIG.GROUND.center.z);
  wall.castShadow = true;
  wall.receiveShadow = true;
  scene.add(wall);

  // Stone steps on retaining wall
  for (let i = 0; i < 6; i++) {
    const stepGeo = new THREE.BoxGeometry(1.5, 0.4, 3.0);
    const stepMat = new THREE.MeshStandardMaterial({ color: 0x7a8490, roughness: 0.9 });
    const step = new THREE.Mesh(stepGeo, stepMat);
    step.position.set(wallConfig.positionX - 0.2 + i * 0.25, -0.2 - i * 0.4, -30);
    scene.add(step);
  }
}

function buildCanalAndRailway() {
  // 1. Water Canal
  const canalConfig = CONFIG.CANAL;
  const canalBedGeo = new THREE.BoxGeometry(canalConfig.width + 1.0, 2.0, canalConfig.length);
  const canalBedMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.9 });
  const canalBed = new THREE.Mesh(canalBedGeo, canalBedMat);
  canalBed.position.set(canalConfig.positionX, -2.5, CONFIG.GROUND.center.z);
  scene.add(canalBed);

  const waterGeo = new THREE.PlaneGeometry(canalConfig.width, canalConfig.length);
  const waterMat = new THREE.MeshStandardMaterial({
    color: canalConfig.waterColor,
    roughness: 0.15,
    metalness: 0.6,
    transparent: true,
    opacity: 0.85,
  });
  waterMesh = new THREE.Mesh(waterGeo, waterMat);
  waterMesh.rotation.x = -Math.PI / 2;
  waterMesh.position.set(canalConfig.positionX, -1.6, CONFIG.GROUND.center.z);
  waterMesh.receiveShadow = true;
  scene.add(waterMesh);

  // Canal bridge
  const bridgeGeo = new THREE.BoxGeometry(canalConfig.width + 2, 0.3, 3.5);
  const bridgeMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.8 });
  const bridge = new THREE.Mesh(bridgeGeo, bridgeMat);
  bridge.position.set(canalConfig.positionX, -1.3, -30);
  bridge.castShadow = true;
  scene.add(bridge);

  // 2. Railway Track (Bắc - Nam)
  const railConfig = CONFIG.RAILWAY;
  // Ballast bed (đá dăm)
  const ballastGeo = new THREE.BoxGeometry(4.0, 0.4, railConfig.length);
  const ballastMat = new THREE.MeshStandardMaterial({ color: railConfig.ballastColor, roughness: 0.95 });
  const ballast = new THREE.Mesh(ballastGeo, ballastMat);
  ballast.position.set(railConfig.positionX, -0.6, CONFIG.GROUND.center.z);
  ballast.receiveShadow = true;
  scene.add(ballast);

  // Steel Rails (2 thanh ray)
  const railGeo = new THREE.BoxGeometry(0.12, 0.2, railConfig.length);
  const railMat = new THREE.MeshStandardMaterial({
    color: railConfig.railColor,
    roughness: 0.3,
    metalness: 0.8,
  });
  const rail1 = new THREE.Mesh(railGeo, railMat);
  rail1.position.set(railConfig.positionX - railConfig.railGauge / 2, -0.3, CONFIG.GROUND.center.z);
  rail1.castShadow = true;
  scene.add(rail1);

  const rail2 = new THREE.Mesh(railGeo, railMat);
  rail2.position.set(railConfig.positionX + railConfig.railGauge / 2, -0.3, CONFIG.GROUND.center.z);
  rail2.castShadow = true;
  scene.add(rail2);

  // Sleepers (tà vẹt gỗ/bê tông) - Instanced for 60 fps
  const sleeperCount = 65;
  const sleeperGeo = new THREE.BoxGeometry(2.4, 0.15, 0.4);
  const sleeperMat = new THREE.MeshStandardMaterial({ color: 0x3f3731, roughness: 0.9 });
  const sleeperInstanced = new THREE.InstancedMesh(sleeperGeo, sleeperMat, sleeperCount);
  sleeperInstanced.castShadow = true;
  sleeperInstanced.receiveShadow = true;

  const dummy = new THREE.Object3D();
  const startZ = CONFIG.GROUND.center.z - railConfig.length / 2;
  const stepZ = railConfig.length / sleeperCount;
  for (let i = 0; i < sleeperCount; i++) {
    dummy.position.set(railConfig.positionX, -0.4, startZ + i * stepZ);
    dummy.updateMatrix();
    sleeperInstanced.setMatrixAt(i, dummy.matrix);
  }
  sleeperInstanced.instanceMatrix.needsUpdate = true;
  scene.add(sleeperInstanced);
}

// ============================================================================
// 5. Roads & Test Track (3m width)
// ============================================================================
function buildRoadsAndTestTrack() {
  const roadMat = new THREE.MeshStandardMaterial({
    color: CONFIG.ROADS.roadColor,
    roughness: 0.8,
  });

  // Road 1: Đường nội bộ chạy ngang trước Nhà A (rộng 3.5m)
  const road1Geo = new THREE.PlaneGeometry(55, 3.5);
  const road1 = new THREE.Mesh(road1Geo, roadMat);
  road1.rotation.x = -Math.PI / 2;
  road1.position.set(40, 0.02, -26.5);
  road1.receiveShadow = true;
  scene.add(road1);

  // Road 2: Đường chạy thử xe (Test Track) bo quanh Nhà B (rộng 3.0m)
  // Đường phía Bắc Nhà B
  const trackNorthGeo = new THREE.PlaneGeometry(35, 3.2);
  const trackNorth = new THREE.Mesh(trackNorthGeo, roadMat);
  trackNorth.rotation.x = -Math.PI / 2;
  trackNorth.position.set(65, 0.02, -69.5);
  trackNorth.receiveShadow = true;
  scene.add(trackNorth);

  // Đường phía Đông Nhà B (giữa Nhà B và Mái che xe)
  const trackEastGeo = new THREE.PlaneGeometry(3.2, 45);
  const trackEast = new THREE.Mesh(trackEastGeo, roadMat);
  trackEast.rotation.x = -Math.PI / 2;
  trackEast.position.set(79, 0.02, -49);
  trackEast.receiveShadow = true;
  scene.add(trackEast);

  // Sân tập kết xe sau chạy thử (phía Nam Nhà B)
  const testYardGeo = new THREE.PlaneGeometry(28, 10);
  const testYardMat = new THREE.MeshStandardMaterial({ color: 0x4f5860, roughness: 0.75 });
  const testYard = new THREE.Mesh(testYardGeo, testYardMat);
  testYard.rotation.x = -Math.PI / 2;
  testYard.position.set(65, 0.02, -30);
  testYard.receiveShadow = true;
  scene.add(testYard);

  // Road markings / paint stripes
  createRoadMarkings();
}

function createRoadMarkings() {
  const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const arrowMat = new THREE.MeshBasicMaterial({ color: 0xffcc00 });

  // Test track directional arrows on pavement
  for (let z = -65; z <= -35; z += 12) {
    const arrowGeo = new THREE.ConeGeometry(0.6, 1.2, 3);
    const arrow = new THREE.Mesh(arrowGeo, arrowMat);
    arrow.rotation.x = -Math.PI / 2;
    arrow.rotation.z = Math.PI; // point South
    arrow.position.set(79, 0.03, z);
    scene.add(arrow);
  }
}

// ============================================================================
// 6. Buildings Architecture
// ============================================================================
function buildBuildings() {
  // 1. NHÀ B: XƯỞNG SẢN XUẤT CHÍNH (3 TẦNG)
  buildNhaB();

  // 2. NHÀ A: VĂN PHÒNG & KỸ THUẬT (3 TẦNG)
  buildNhaA();

  // 3. NHÀ C: KHO PHỤ TÙNG (MÁI TÔN XANH + PIN MẶT TRỜI)
  buildNhaC();

  // 4. NHÀ ĂN (3 TẦNG)
  buildNhaAn();

  // 5. NHÀ BẢO VỆ CỔNG
  buildNhaBaoVe();
}

function buildNhaB() {
  const cfg = CONFIG.BUILDINGS.nhaB;
  const group = new THREE.Group();
  group.position.set(cfg.position.x, 0, cfg.position.z);
  group.userData = { id: 'nhaB', config: cfg };

  // Main Building Block (Upper Panel Dark Gray)
  const bodyGeo = new THREE.BoxGeometry(cfg.width, cfg.height - 1.5, cfg.depth);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: cfg.wallColor,
    roughness: 0.6,
    metalness: 0.2,
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = (cfg.height + 1.5) / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // Base Wall (Chân tầng 1 ốp trắng sáng cao 1.5m)
  const baseGeo = new THREE.BoxGeometry(cfg.width + 0.1, 1.5, cfg.depth + 0.1);
  const baseMat = new THREE.MeshStandardMaterial({
    color: cfg.baseWallColor,
    roughness: 0.7,
  });
  const base = new THREE.Mesh(baseGeo, baseMat);
  base.position.y = 0.75;
  base.castShadow = true;
  group.add(base);

  // Roof (Mái dốc nhẹ màu xám than)
  const roofGeo = new THREE.BoxGeometry(cfg.width + 0.8, 0.8, cfg.depth + 0.8);
  const roofMat = new THREE.MeshStandardMaterial({
    color: cfg.roofColor,
    roughness: 0.5,
  });
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.position.y = cfg.height + 0.4;
  roof.castShadow = true;
  group.add(roof);

  // Monitor Roof (Sống mái thông gió dài ở giữa)
  const monCfg = cfg.monitorRoof;
  const monGeo = new THREE.BoxGeometry(monCfg.width, monCfg.height, monCfg.depth);
  const monMat = new THREE.MeshStandardMaterial({
    color: monCfg.color,
    roughness: 0.5,
  });
  const monitor = new THREE.Mesh(monGeo, monMat);
  monitor.position.y = cfg.height + 0.8 + monCfg.height / 2;
  monitor.castShadow = true;
  group.add(monitor);

  // Windows: 3 dải cửa sổ ngang hiện đại
  const windowMat = new THREE.MeshStandardMaterial({
    color: 0x93c5fd,
    roughness: 0.1,
    metalness: 0.8,
    emissive: 0x000000,
  });
  windowLights.push(windowMat);

  for (let story = 1; story <= 3; story++) {
    const winHeight = 1.0;
    const winY = 1.5 + (story - 0.5) * 3.8;
    // Window strip on South facade
    const winSouthGeo = new THREE.PlaneGeometry(cfg.width - 4, winHeight);
    const winSouth = new THREE.Mesh(winSouthGeo, windowMat);
    winSouth.position.set(0, winY, cfg.depth / 2 + 0.05);
    group.add(winSouth);

    // Window strip on East facade
    const winEastGeo = new THREE.PlaneGeometry(cfg.depth - 4, winHeight);
    const winEast = new THREE.Mesh(winEastGeo, windowMat);
    winEast.rotation.y = Math.PI / 2;
    winEast.position.set(cfg.width / 2 + 0.05, winY, 0);
    group.add(winEast);
  }

  // 3D Logo Badge "DK Bike" màu vàng kim loại
  createBuildingLogo(group, cfg);

  scene.add(group);
  buildingMeshes.push(body);
}

function createBuildingLogo(group, cfg) {
  // Create stylized "DK Bike" billboard badge on facade
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
  const logoMat = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
  });

  const logoGeo = new THREE.PlaneGeometry(8.0, 2.0);
  const logoSouth = new THREE.Mesh(logoGeo, logoMat);
  logoSouth.position.set(0, cfg.height - 2.2, cfg.depth / 2 + 0.08);
  group.add(logoSouth);

  const logoEast = new THREE.Mesh(logoGeo, logoMat);
  logoEast.rotation.y = Math.PI / 2;
  logoEast.position.set(cfg.width / 2 + 0.08, cfg.height - 2.2, 5.0);
  group.add(logoEast);
}

function buildNhaA() {
  const cfg = CONFIG.BUILDINGS.nhaA;
  const group = new THREE.Group();
  group.position.set(cfg.position.x, 0, cfg.position.z);
  group.userData = { id: 'nhaA', config: cfg };

  // Body
  const bodyGeo = new THREE.BoxGeometry(cfg.width, cfg.height, cfg.depth);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: cfg.wallColor,
    roughness: 0.65,
    metalness: 0.15,
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = cfg.height / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // Roof
  const roofGeo = new THREE.BoxGeometry(cfg.width + 0.6, 0.6, cfg.depth + 0.6);
  const roofMat = new THREE.MeshStandardMaterial({
    color: cfg.roofColor,
    roughness: 0.4,
  });
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.position.y = cfg.height + 0.3;
  roof.castShadow = true;
  group.add(roof);

  // Blue outdoor escape stairs on West side
  const stairGeo = new THREE.BoxGeometry(2.0, cfg.height - 1.5, 3.5);
  const stairMat = new THREE.MeshStandardMaterial({
    color: cfg.stairColor,
    roughness: 0.5,
    metalness: 0.5,
  });
  const stair = new THREE.Mesh(stairGeo, stairMat);
  stair.position.set(-cfg.width / 2 - 1.0, (cfg.height - 1.5) / 2, 0);
  stair.castShadow = true;
  group.add(stair);

  // Windows
  const winMat = new THREE.MeshStandardMaterial({
    color: 0xbae6fd,
    roughness: 0.1,
    metalness: 0.7,
  });
  windowLights.push(winMat);

  for (let story = 1; story <= 3; story++) {
    const winY = (story - 0.4) * 3.4;
    const winGeo = new THREE.PlaneGeometry(cfg.width - 4, 1.2);
    const winSouth = new THREE.Mesh(winGeo, winMat);
    winSouth.position.set(0, winY, cfg.depth / 2 + 0.05);
    group.add(winSouth);
  }

  // Covered Walkway Bridge connecting Nhà A to Nhà B
  const walkwayGeo = new THREE.BoxGeometry(8.0, 3.2, 3.2);
  const walkwayMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.5 });
  const walkway = new THREE.Mesh(walkwayGeo, walkwayMat);
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

  // Main body
  const bodyGeo = new THREE.BoxGeometry(cfg.width, cfg.height, cfg.depth);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: cfg.wallColor,
    roughness: 0.7,
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = cfg.height / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // Royal Blue Corrugated Roof (Mái tôn xanh dương)
  const roofGeo = new THREE.BoxGeometry(cfg.width + 0.6, 0.6, cfg.depth + 0.6);
  const roofMat = new THREE.MeshStandardMaterial({
    color: cfg.roofColor,
    roughness: 0.45,
    metalness: 0.3,
  });
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.position.y = cfg.height + 0.3;
  roof.castShadow = true;
  group.add(roof);

  // Solar Panels on roof
  const solarGeo = new THREE.PlaneGeometry(cfg.width - 2, cfg.depth - 3);
  const solarMat = new THREE.MeshStandardMaterial({
    color: 0x111c2e,
    roughness: 0.15,
    metalness: 0.85,
  });
  const solar = new THREE.Mesh(solarGeo, solarMat);
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

  const bodyGeo = new THREE.BoxGeometry(cfg.width, cfg.height, cfg.depth);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: cfg.wallColor,
    roughness: 0.7,
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = cfg.height / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // Roof (Ngói đỏ)
  const roofGeo = new THREE.ConeGeometry(cfg.width * 0.7, 3.5, 4);
  const roofMat = new THREE.MeshStandardMaterial({
    color: cfg.roofColor,
    roughness: 0.6,
  });
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.position.y = cfg.height + 1.75;
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;
  group.add(roof);

  scene.add(group);
  buildingMeshes.push(body);
}

function buildNhaBaoVe() {
  const cfg = CONFIG.BUILDINGS.nhaBaoVe;
  const group = new THREE.Group();
  group.position.set(cfg.position.x, 0, cfg.position.z);
  group.userData = { id: 'nhaBaoVe', config: cfg };

  const bodyGeo = new THREE.BoxGeometry(cfg.width, cfg.height, cfg.depth);
  const bodyMat = new THREE.MeshStandardMaterial({ color: cfg.wallColor, roughness: 0.6 });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = cfg.height / 2;
  body.castShadow = true;
  group.add(body);

  const roofGeo = new THREE.BoxGeometry(cfg.width + 0.4, 0.4, cfg.depth + 0.4);
  const roofMat = new THREE.MeshStandardMaterial({ color: cfg.roofColor, roughness: 0.4 });
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.position.y = cfg.height + 0.2;
  group.add(roof);

  scene.add(group);
  buildingMeshes.push(body);
}

// ============================================================================
// 7. Canopy & Stylized Electric Bikes
// ============================================================================
function buildCanopyAndBikes() {
  const cfg = CONFIG.BUILDINGS.maiCheXe;
  const group = new THREE.Group();
  group.position.set(cfg.position.x, 0, cfg.position.z);
  group.userData = { id: 'maiCheXe', config: cfg };

  // Steel Frame Posts
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

  // Cyan Translucent Polycarbonate Canopy Roof
  const canopyGeo = new THREE.BoxGeometry(cfg.width, 0.25, cfg.depth);
  const canopyMat = new THREE.MeshStandardMaterial({
    color: cfg.canopyColor,
    roughness: 0.2,
    metalness: 0.1,
    transparent: true,
    opacity: cfg.opacity,
  });
  const canopyRoof = new THREE.Mesh(canopyGeo, canopyMat);
  canopyRoof.position.y = cfg.height;
  canopyRoof.castShadow = true;
  group.add(canopyRoof);

  // Stylized 3-wheel electric bikes parked underneath
  const bikeMatRed = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.4 });
  const bikeMatCyan = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4 });
  const bikeMatBlack = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.8 });

  for (let z = -cfg.depth / 2 + 2.5; z <= cfg.depth / 2 - 2; z += 3.2) {
    const bikeGroup = new THREE.Group();
    bikeGroup.position.set(0, 0, z);

    // Chassis / body
    const bodyGeo = new THREE.BoxGeometry(1.6, 0.6, 1.0);
    const body = new THREE.Mesh(bodyGeo, Math.random() > 0.5 ? bikeMatRed : bikeMatCyan);
    body.position.y = 0.55;
    body.castShadow = true;
    bikeGroup.add(body);

    // Wheels
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
// 8. Landscaping & Trees (InstancedMesh for 60 fps)
// ============================================================================
function buildLandscaping() {
  const treeCount = 48;
  const trunkGeo = new THREE.CylinderGeometry(0.2, 0.3, 2.0, 5);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a3728, roughness: 0.9 });
  const foliageGeo = new THREE.ConeGeometry(1.5, 3.5, 5);
  const foliageMat = new THREE.MeshStandardMaterial({
    color: 0x2d6a4f,
    roughness: 0.8,
    flatShading: true,
  });

  const trunkInstanced = new THREE.InstancedMesh(trunkGeo, trunkMat, treeCount);
  const foliageInstanced = new THREE.InstancedMesh(foliageGeo, foliageMat, treeCount);
  trunkInstanced.castShadow = true;
  foliageInstanced.castShadow = true;

  const dummy = new THREE.Object3D();
  let idx = 0;

  // Row of trees along retaining wall / railway boundary
  for (let z = -90; z <= 0; z += 5) {
    if (idx >= treeCount) break;
    const x = 81.5 + (Math.random() - 0.5) * 0.8;
    dummy.position.set(x, 1.0, z);
    dummy.scale.setScalar(0.9 + Math.random() * 0.3);
    dummy.updateMatrix();
    trunkInstanced.setMatrixAt(idx, dummy.matrix);

    dummy.position.set(x, 3.2, z);
    dummy.updateMatrix();
    foliageInstanced.setMatrixAt(idx, dummy.matrix);
    idx++;
  }

  // Cluster of trees on hillside
  for (let i = 0; i < 18; i++) {
    if (idx >= treeCount) break;
    const ang = Math.random() * Math.PI * 2;
    const rad = 15 + Math.random() * 20;
    const x = CONFIG.HILLS.position.x + Math.cos(ang) * rad;
    const z = CONFIG.HILLS.position.z + Math.sin(ang) * rad;
    dummy.position.set(x, 2.0, z);
    dummy.scale.setScalar(1.0 + Math.random() * 0.5);
    dummy.updateMatrix();
    trunkInstanced.setMatrixAt(idx, dummy.matrix);

    dummy.position.set(x, 4.5, z);
    dummy.updateMatrix();
    foliageInstanced.setMatrixAt(idx, dummy.matrix);
    idx++;
  }

  trunkInstanced.instanceMatrix.needsUpdate = true;
  foliageInstanced.instanceMatrix.needsUpdate = true;
  scene.add(trunkInstanced);
  scene.add(foliageInstanced);
}

// ============================================================================
// 9. Animated Test Bike
// ============================================================================
function setupAnimatedBike() {
  animatedBike = new THREE.Group();

  const bodyGeo = new THREE.BoxGeometry(1.4, 0.7, 0.5);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xffb703, // DK Bike yellow
    roughness: 0.3,
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 0.5;
  body.castShadow = true;
  animatedBike.add(body);

  // Bike Headlight
  const lightGeo = new THREE.SphereGeometry(0.12, 6, 6);
  const lightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const light = new THREE.Mesh(lightGeo, lightMat);
  light.position.set(0.72, 0.55, 0);
  animatedBike.add(light);

  scene.add(animatedBike);
}

function updateAnimatedBike(delta) {
  if (!animatedBike) return;
  // Move bike in continuous loop along test track around Nhà B
  bikeTrackAngle += delta * 0.35;
  const t = bikeTrackAngle;

  // Path coordinates loop around Nhà B
  const centerX = 65;
  const centerZ = -50;
  const radiusX = 14;
  const radiusZ = 20;

  const x = centerX + Math.sin(t) * radiusX;
  const z = centerZ + Math.cos(t) * radiusZ;
  animatedBike.position.set(x, 0.05, z);

  // Rotate bike along path tangent
  const nextX = centerX + Math.sin(t + 0.05) * radiusX;
  const nextZ = centerZ + Math.cos(t + 0.05) * radiusZ;
  animatedBike.rotation.y = Math.atan2(nextX - x, nextZ - z);
}

// ============================================================================
// 10. Weather Effects (Rain)
// ============================================================================
function setupRainEffect() {
  const rainCount = 1800;
  const rainGeo = new THREE.BufferGeometry();
  const positions = new Float32Array(rainCount * 3);

  for (let i = 0; i < rainCount * 3; i += 3) {
    positions[i] = (Math.random() - 0.5) * 160 + 50;
    positions[i + 1] = Math.random() * 80;
    positions[i + 2] = (Math.random() - 0.5) * 160 - 40;
  }

  rainGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const rainMat = new THREE.PointsMaterial({
    color: 0xa5b4fc,
    size: 0.35,
    transparent: true,
    opacity: 0.65,
  });

  rainParticles = new THREE.Points(rainGeo, rainMat);
  rainParticles.visible = false;
  scene.add(rainParticles);
}

function updateRain(delta) {
  if (!isRaining || !rainParticles) return;
  const pos = rainParticles.geometry.attributes.position.array;
  for (let i = 1; i < pos.length; i += 3) {
    pos[i] -= delta * 70;
    if (pos[i] < 0) {
      pos[i] = 75;
    }
  }
  rainParticles.geometry.attributes.position.needsUpdate = true;
}

// ============================================================================
// 11. Environment Toggle (Day / Sunset / Night)
// ============================================================================
function setEnvironment(time) {
  currentEnv = time;
  const cfg = CONFIG.LIGHTING[time];

  // Update sky and fog
  scene.background.set(cfg.skyColor);
  if (time === 'day') scene.fog.color.set(CONFIG.WORLD.fogColorDay);
  if (time === 'sunset') scene.fog.color.set(CONFIG.WORLD.fogColorSunset);
  if (time === 'night') scene.fog.color.set(CONFIG.WORLD.fogColorNight);

  // Update ambient & hemi lights
  ambientLight.color.set(cfg.ambientColor);
  ambientLight.intensity = cfg.ambientIntensity;
  hemiLight.color.set(cfg.skyColor);
  hemiLight.groundColor.set(cfg.groundColor);

  // Update sun direction & color
  dirLight.color.set(cfg.sunColor);
  dirLight.intensity = cfg.sunIntensity;
  dirLight.position.set(cfg.sunPosition.x, cfg.sunPosition.y, cfg.sunPosition.z);

  // Toggle window night illumination
  const isNight = time === 'night';
  windowLights.forEach((mat) => {
    if (isNight) {
      mat.emissive.set(0xfbbf24);
      mat.emissiveIntensity = 0.8;
    } else {
      mat.emissive.set(0x000000);
      mat.emissiveIntensity = 0;
    }
  });

  // Toggle DK Bike logo light at night
  logoLight.intensity = isNight ? 1.5 : 0;

  // Update UI button active states
  document.querySelectorAll('.toggle-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.time === time);
  });
}

// ============================================================================
// 12. 3D HTML Labels & Interaction
// ============================================================================
function createBuildingLabels() {
  const container = document.body;
  const labelsData = [
    { text: 'Nhà B (Xưởng 3 tầng)', pos: new THREE.Vector3(65, 14.5, -50), id: 'nhaB' },
    { text: 'Nhà A (Văn phòng)', pos: new THREE.Vector3(35, 12.0, -35), id: 'nhaA' },
    { text: 'Nhà C (Mái tôn xanh)', pos: new THREE.Vector3(45, 7.5, -58.5), id: 'nhaC' },
    { text: 'Nhà ăn CBNV', pos: new THREE.Vector3(23, 11.5, -12), id: 'nhaAn' },
    { text: 'Mái che xe 3 bánh', pos: new THREE.Vector3(79.5, 5.0, -46), id: 'maiCheXe' },
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

    // Check if behind camera
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
// 13. Camera Preset Smooth Transitions
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
    // Smooth easeInOutCubic
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

  // Update button active state
  document.querySelectorAll('.preset-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.view === key);
  });
}

// ============================================================================
// 14. Building Detail Modal
// ============================================================================
function showBuildingModal(buildingKey) {
  const card = document.getElementById('building-card');
  const tag = document.getElementById('card-tag');
  const title = document.getElementById('card-title');
  const desc = document.getElementById('card-desc');
  const dim = document.getElementById('card-dim');
  const height = document.getElementById('card-height');
  const area = document.getElementById('card-area');
  const roof = document.getElementById('card-roof');

  const b = CONFIG.BUILDINGS[buildingKey];
  if (!b) return;

  card.classList.remove('hidden');
  tag.innerText = buildingKey.toUpperCase();
  title.innerText = b.name;

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
    desc.innerText = 'Nhà ăn 3 tầng phục vụ toàn thể cán bộ công nhân viên, nằm độc lập tại góc Tây Nam khuôn viên.';
    dim.innerText = '20.4m × 11.6m';
    height.innerText = '10.5m (3 tầng)';
    area.innerText = '~253 m²';
    roof.innerText = 'Mái ngói dốc truyền thống';
  } else if (buildingKey === 'maiCheXe') {
    desc.innerText = 'Bãi đỗ có mái che sóng màu xanh lơ trong suốt, chuyên dụng cho tập kết xe điện 3 bánh DK Bike.';
    dim.innerText = '28.0m × 6.0m';
    height.innerText = '4.2m';
    area.innerText = '~168 m²';
    roof.innerText = 'Mái sóng Polycarbonate xanh lơ';
  }
}

// ============================================================================
// 15. UI Event Listeners & Raycasting
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
  labelBtn.addEventListener('click', () => {
    showLabels = !showLabels;
    labelBtn.classList.toggle('active', showLabels);
    updateLabels();
  });

  // Rain toggle
  const rainBtn = document.getElementById('btn-toggle-rain');
  rainBtn.addEventListener('click', () => {
    isRaining = !isRaining;
    rainBtn.classList.toggle('active', isRaining);
    if (rainParticles) rainParticles.visible = isRaining;
  });

  // Close card button
  document.getElementById('card-close-btn').addEventListener('click', () => {
    document.getElementById('building-card').classList.add('hidden');
  });

  // Raycaster click on 3D canvas
  window.addEventListener('pointerdown', (e) => {
    // Only process if clicked inside canvas
    if (e.target.closest('.top-nav') || e.target.closest('.building-card') || e.target.closest('.bottom-hud')) {
      return;
    }

    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(buildingMeshes);

    if (intersects.length > 0) {
      let hitObj = intersects[0].object;
      while (hitObj.parent && !hitObj.userData.id) {
        hitObj = hitObj.parent;
      }
      if (hitObj.userData && hitObj.userData.id) {
        showBuildingModal(hitObj.userData.id);
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
// 16. Animation Loop
// ============================================================================
let clock = new THREE.Clock();

function animate(time) {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();

  // Tween camera transitions
  if (cameraTween) {
    cameraTween(time);
  } else {
    controls.update();
  }

  // Update animated test bike
  updateAnimatedBike(delta);

  // Update rain effect
  updateRain(delta);

  // Subtle water surface wave reflection
  if (waterMesh) {
    waterMesh.material.opacity = 0.8 + Math.sin(time * 0.002) * 0.05;
  }

  // Update compass needle rotation based on camera azimuthal angle
  if (compassNeedle) {
    const angle = controls.getAzimuthalAngle();
    compassNeedle.style.transform = `rotate(${-angle * (180 / Math.PI)}deg)`;
  }

  // Update 3D labels overlay
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
