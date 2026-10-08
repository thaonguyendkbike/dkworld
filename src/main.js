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
let animatedTruck, truckProgress = 0;
let waterCanalMesh, waterRoundPondMesh, waterKoiMesh;
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

  // Build Grounds & Road DT234
  buildGroundsAndRoadDT234();

  // Build DK1 Campus Elements
  buildRetainingWall();
  buildCanalAndRailway();
  buildRoadsAndTestTrack();
  buildDK1Buildings();
  buildCanopyAndBikes();

  // Build DK2 Campus Elements
  buildDK2Buildings();
  buildDK2HillAndOrchidGarden();
  buildDK2Vehicles();

  // Landscaping & Vegetation (Instanced for 60 fps)
  buildLandscaping();

  // Setup Animated Vehicles
  setupAnimatedVehicles();

  // Weather & Rain
  setupRainEffect();

  // 3D HTML Labels
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

  // Hemisphere Light
  hemiLight = new THREE.HemisphereLight(
    CONFIG.LIGHTING.day.skyColor,
    CONFIG.LIGHTING.day.groundColor,
    0.45
  );
  scene.add(hemiLight);

  // Directional Sun Light with Shadows covering both DK1 & DK2
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

  // Frustum covering both campuses
  const d = 140;
  dirLight.shadow.camera.left = -d;
  dirLight.shadow.camera.right = d;
  dirLight.shadow.camera.top = d;
  dirLight.shadow.camera.bottom = -d;
  dirLight.shadow.bias = -0.0005;
  scene.add(dirLight);

  // Point light for nighttime DK Bike logo glow
  logoLight = new THREE.PointLight(0xffb703, 0, 35);
  logoLight.position.set(CONFIG.BUILDINGS.nhaB.position.x, 14, CONFIG.BUILDINGS.nhaB.position.z + 18);
  scene.add(logoLight);
}

// ============================================================================
// 3. Ground Platforms & Provincial Road ĐT234
// ============================================================================
function buildGroundsAndRoadDT234() {
  // 1. DK1 Concrete Yard Platform
  const dk1Cfg = CONFIG.GROUND.dk1;
  const dk1Geo = new THREE.BoxGeometry(dk1Cfg.width, 2.0, dk1Cfg.depth);
  const dk1Mat = new THREE.MeshStandardMaterial({
    color: dk1Cfg.color,
    roughness: 0.85,
    metalness: 0.1,
  });
  const dk1Ground = new THREE.Mesh(dk1Geo, dk1Mat);
  dk1Ground.position.set(dk1Cfg.center.x, -1.0, dk1Cfg.center.z);
  dk1Ground.receiveShadow = true;
  scene.add(dk1Ground);

  // 2. DK2 Concrete Yard Platform
  const dk2Cfg = CONFIG.GROUND.dk2;
  const dk2Geo = new THREE.BoxGeometry(dk2Cfg.width, 2.0, dk2Cfg.depth);
  const dk2Mat = new THREE.MeshStandardMaterial({
    color: dk2Cfg.color,
    roughness: 0.85,
    metalness: 0.1,
  });
  const dk2Ground = new THREE.Mesh(dk2Geo, dk2Mat);
  dk2Ground.position.set(dk2Cfg.center.x, -1.0, dk2Cfg.center.z);
  dk2Ground.receiveShadow = true;
  scene.add(dk2Ground);

  // 3. Road DT234 connecting DK1 and DK2
  const roadCfg = CONFIG.ROAD_DT234;
  const dt234Geo = new THREE.BoxGeometry(roadCfg.width, 0.1, roadCfg.length);
  const dt234Mat = new THREE.MeshStandardMaterial({
    color: roadCfg.asphaltColor,
    roughness: 0.75,
  });
  const dt234 = new THREE.Mesh(dt234Geo, dt234Mat);
  dt234.position.set(roadCfg.positionX, 0.05, -45);
  dt234.receiveShadow = true;
  scene.add(dt234);

  // Double Yellow Centerline on DT234
  const lineMat = new THREE.MeshBasicMaterial({ color: 0xffcc00 });
  const lineGeo = new THREE.PlaneGeometry(0.25, roadCfg.length - 10);
  const line = new THREE.Mesh(lineGeo, lineMat);
  line.rotation.x = -Math.PI / 2;
  line.position.set(roadCfg.positionX, 0.12, -45);
  scene.add(line);

  // 4. DK1 Sườn đồi phía Bắc
  const hill1Cfg = CONFIG.HILLS.dk1;
  const hill1Geo = new THREE.ConeGeometry(hill1Cfg.radius, hill1Cfg.height, 9);
  const hill1Mat = new THREE.MeshStandardMaterial({
    color: hill1Cfg.color,
    roughness: 0.9,
    flatShading: true,
  });
  const hill1 = new THREE.Mesh(hill1Geo, hill1Mat);
  hill1.position.set(hill1Cfg.position.x, hill1Cfg.height / 2 - 2, hill1Cfg.position.z);
  hill1.receiveShadow = true;
  scene.add(hill1);
}

// ============================================================================
// 4. DK1: Retaining Wall, Canal & Railway
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
  wall.position.set(wallConfig.positionX, -wallConfig.height / 2 + 0.2, -42);
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
  canalBed.position.set(canalConfig.positionX, -2.5, -42);
  scene.add(canalBed);

  const waterGeo = new THREE.PlaneGeometry(canalConfig.width, canalConfig.length);
  const waterMat = new THREE.MeshStandardMaterial({
    color: canalConfig.waterColor,
    roughness: 0.15,
    metalness: 0.6,
    transparent: true,
    opacity: 0.85,
  });
  waterCanalMesh = new THREE.Mesh(waterGeo, waterMat);
  waterCanalMesh.rotation.x = -Math.PI / 2;
  waterCanalMesh.position.set(canalConfig.positionX, -1.6, -42);
  waterCanalMesh.receiveShadow = true;
  scene.add(waterCanalMesh);

  // Canal bridge
  const bridgeGeo = new THREE.BoxGeometry(canalConfig.width + 2, 0.3, 3.5);
  const bridgeMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.8 });
  const bridge = new THREE.Mesh(bridgeGeo, bridgeMat);
  bridge.position.set(canalConfig.positionX, -1.3, -30);
  bridge.castShadow = true;
  scene.add(bridge);

  // 2. Railway Track
  const railConfig = CONFIG.RAILWAY;
  const ballastGeo = new THREE.BoxGeometry(4.0, 0.4, railConfig.length);
  const ballastMat = new THREE.MeshStandardMaterial({ color: railConfig.ballastColor, roughness: 0.95 });
  const ballast = new THREE.Mesh(ballastGeo, ballastMat);
  ballast.position.set(railConfig.positionX, -0.6, -42);
  ballast.receiveShadow = true;
  scene.add(ballast);

  // Steel Rails
  const railGeo = new THREE.BoxGeometry(0.12, 0.2, railConfig.length);
  const railMat = new THREE.MeshStandardMaterial({
    color: railConfig.railColor,
    roughness: 0.3,
    metalness: 0.8,
  });
  const rail1 = new THREE.Mesh(railGeo, railMat);
  rail1.position.set(railConfig.positionX - railConfig.railGauge / 2, -0.3, -42);
  rail1.castShadow = true;
  scene.add(rail1);

  const rail2 = new THREE.Mesh(railGeo, railMat);
  rail2.position.set(railConfig.positionX + railConfig.railGauge / 2, -0.3, -42);
  rail2.castShadow = true;
  scene.add(rail2);

  // Sleepers (tà vẹt)
  const sleeperCount = 65;
  const sleeperGeo = new THREE.BoxGeometry(2.4, 0.15, 0.4);
  const sleeperMat = new THREE.MeshStandardMaterial({ color: 0x3f3731, roughness: 0.9 });
  const sleeperInstanced = new THREE.InstancedMesh(sleeperGeo, sleeperMat, sleeperCount);
  sleeperInstanced.castShadow = true;
  sleeperInstanced.receiveShadow = true;

  const dummy = new THREE.Object3D();
  const startZ = -42 - railConfig.length / 2;
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
// 5. DK1: Roads & Test Track (3m width)
// ============================================================================
function buildRoadsAndTestTrack() {
  const roadMat = new THREE.MeshStandardMaterial({
    color: CONFIG.ROADS.roadColor,
    roughness: 0.8,
  });

  // Road 1: Trước Nhà A
  const road1Geo = new THREE.PlaneGeometry(55, 3.5);
  const road1 = new THREE.Mesh(road1Geo, roadMat);
  road1.rotation.x = -Math.PI / 2;
  road1.position.set(40, 0.02, -26.5);
  road1.receiveShadow = true;
  scene.add(road1);

  // Road 2: Phía Bắc Nhà B
  const trackNorthGeo = new THREE.PlaneGeometry(35, 3.2);
  const trackNorth = new THREE.Mesh(trackNorthGeo, roadMat);
  trackNorth.rotation.x = -Math.PI / 2;
  trackNorth.position.set(65, 0.02, -69.5);
  trackNorth.receiveShadow = true;
  scene.add(trackNorth);

  // Road 3: Phía Đông Nhà B
  const trackEastGeo = new THREE.PlaneGeometry(3.2, 45);
  const trackEast = new THREE.Mesh(trackEastGeo, roadMat);
  trackEast.rotation.x = -Math.PI / 2;
  trackEast.position.set(79, 0.02, -49);
  trackEast.receiveShadow = true;
  scene.add(trackEast);

  // Sân tập kết xe sau chạy thử
  const testYardGeo = new THREE.PlaneGeometry(28, 10);
  const testYardMat = new THREE.MeshStandardMaterial({ color: 0x4f5860, roughness: 0.75 });
  const testYard = new THREE.Mesh(testYardGeo, testYardMat);
  testYard.rotation.x = -Math.PI / 2;
  testYard.position.set(65, 0.02, -30);
  testYard.receiveShadow = true;
  scene.add(testYard);

  // Test track directional arrows
  const arrowMat = new THREE.MeshBasicMaterial({ color: 0xffcc00 });
  for (let z = -65; z <= -35; z += 12) {
    const arrowGeo = new THREE.ConeGeometry(0.6, 1.2, 3);
    const arrow = new THREE.Mesh(arrowGeo, arrowMat);
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
  // Nhà B
  buildNhaB();
  // Nhà A
  buildNhaA();
  // Nhà C
  buildNhaC();
  // Nhà ăn
  buildNhaAn();
  // Bảo vệ DK1
  buildNhaBaoVeDK1();
}

function buildNhaB() {
  const cfg = CONFIG.BUILDINGS.nhaB;
  const group = new THREE.Group();
  group.position.set(cfg.position.x, 0, cfg.position.z);
  group.userData = { id: 'nhaB', config: cfg };

  const bodyGeo = new THREE.BoxGeometry(cfg.width, cfg.height - 1.5, cfg.depth);
  const bodyMat = new THREE.MeshStandardMaterial({ color: cfg.wallColor, roughness: 0.6, metalness: 0.2 });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = (cfg.height + 1.5) / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const baseGeo = new THREE.BoxGeometry(cfg.width + 0.1, 1.5, cfg.depth + 0.1);
  const baseMat = new THREE.MeshStandardMaterial({ color: cfg.baseWallColor, roughness: 0.7 });
  const base = new THREE.Mesh(baseGeo, baseMat);
  base.position.y = 0.75;
  base.castShadow = true;
  group.add(base);

  const roofGeo = new THREE.BoxGeometry(cfg.width + 0.8, 0.8, cfg.depth + 0.8);
  const roofMat = new THREE.MeshStandardMaterial({ color: cfg.roofColor, roughness: 0.5 });
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.position.y = cfg.height + 0.4;
  roof.castShadow = true;
  group.add(roof);

  const monCfg = cfg.monitorRoof;
  const monGeo = new THREE.BoxGeometry(monCfg.width, monCfg.height, monCfg.depth);
  const monMat = new THREE.MeshStandardMaterial({ color: monCfg.color, roughness: 0.5 });
  const monitor = new THREE.Mesh(monGeo, monMat);
  monitor.position.y = cfg.height + 0.8 + monCfg.height / 2;
  monitor.castShadow = true;
  group.add(monitor);

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

  // Logo Badge "DK Bike"
  createBuildingLogo(group, cfg);

  scene.add(group);
  buildingMeshes.push(body);
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

  const bodyGeo = new THREE.BoxGeometry(cfg.width, cfg.height, cfg.depth);
  const bodyMat = new THREE.MeshStandardMaterial({ color: cfg.wallColor, roughness: 0.65, metalness: 0.15 });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = cfg.height / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const roofGeo = new THREE.BoxGeometry(cfg.width + 0.6, 0.6, cfg.depth + 0.6);
  const roofMat = new THREE.MeshStandardMaterial({ color: cfg.roofColor, roughness: 0.4 });
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.position.y = cfg.height + 0.3;
  roof.castShadow = true;
  group.add(roof);

  // Blue outdoor escape stairs
  const stairGeo = new THREE.BoxGeometry(2.0, cfg.height - 1.5, 3.5);
  const stairMat = new THREE.MeshStandardMaterial({ color: cfg.stairColor, roughness: 0.5, metalness: 0.5 });
  const stair = new THREE.Mesh(stairGeo, stairMat);
  stair.position.set(-cfg.width / 2 - 1.0, (cfg.height - 1.5) / 2, 0);
  stair.castShadow = true;
  group.add(stair);

  // Windows
  const winMat = new THREE.MeshStandardMaterial({ color: 0xbae6fd, roughness: 0.1, metalness: 0.7 });
  windowLights.push(winMat);
  for (let story = 1; story <= 3; story++) {
    const winY = (story - 0.4) * 3.4;
    const winGeo = new THREE.PlaneGeometry(cfg.width - 4, 1.2);
    const winSouth = new THREE.Mesh(winGeo, winMat);
    winSouth.position.set(0, winY, cfg.depth / 2 + 0.05);
    group.add(winSouth);
  }

  // Walkway connector
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

  const bodyGeo = new THREE.BoxGeometry(cfg.width, cfg.height, cfg.depth);
  const bodyMat = new THREE.MeshStandardMaterial({ color: cfg.wallColor, roughness: 0.7 });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = cfg.height / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const roofGeo = new THREE.BoxGeometry(cfg.width + 0.6, 0.6, cfg.depth + 0.6);
  const roofMat = new THREE.MeshStandardMaterial({ color: cfg.roofColor, roughness: 0.45, metalness: 0.3 });
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.position.y = cfg.height + 0.3;
  roof.castShadow = true;
  group.add(roof);

  // Solar panels on roof
  const solarGeo = new THREE.PlaneGeometry(cfg.width - 2, cfg.depth - 3);
  const solarMat = new THREE.MeshStandardMaterial({ color: 0x111c2e, roughness: 0.15, metalness: 0.85 });
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
  const bodyMat = new THREE.MeshStandardMaterial({ color: cfg.wallColor, roughness: 0.7 });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = cfg.height / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const roofGeo = new THREE.ConeGeometry(cfg.width * 0.7, 3.5, 4);
  const roofMat = new THREE.MeshStandardMaterial({ color: cfg.roofColor, roughness: 0.6 });
  const roof = new THREE.Mesh(roofGeo, roofMat);
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

  // Posts
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

  // Cyan translucent canopy roof
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

  // 3-wheel electric bikes parked underneath
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
  // 1. Nhà điều hành DK2 (HQ) với mái phủ kín pin mặt trời
  buildNhaDieuHanhDK2();

  // 2. Kho Linh kiện D2.1 (Nhà mái tôn dài phía Bắc)
  buildKhoLinhKienDK2();

  // 3. Xưởng sản xuất phía Nam DK2
  buildXuongDK2();

  // 4. Sân xe thành phẩm lớn & các ô kẻ thể thao/tập kết
  buildSanThanhPhamDK2();
}

function buildNhaDieuHanhDK2() {
  const cfg = CONFIG.BUILDINGS.nhaDieuHanhDK2;
  const group = new THREE.Group();
  group.position.set(cfg.position.x, 0, cfg.position.z);
  group.userData = { id: 'nhaDieuHanhDK2', config: cfg };

  // Thân nhà 3 tầng hiện đại
  const bodyGeo = new THREE.BoxGeometry(cfg.width, cfg.height - 1.2, cfg.depth);
  const bodyMat = new THREE.MeshStandardMaterial({ color: cfg.wallColor, roughness: 0.6, metalness: 0.2 });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = (cfg.height + 1.2) / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // Chân tường sáng
  const baseGeo = new THREE.BoxGeometry(cfg.width + 0.1, 1.2, cfg.depth + 0.1);
  const baseMat = new THREE.MeshStandardMaterial({ color: cfg.baseWallColor, roughness: 0.7 });
  const base = new THREE.Mesh(baseGeo, baseMat);
  base.position.y = 0.6;
  base.castShadow = true;
  group.add(base);

  // Mái bằng viền hiện đại
  const roofGeo = new THREE.BoxGeometry(cfg.width + 0.4, 0.6, cfg.depth + 0.4);
  const roofMat = new THREE.MeshStandardMaterial({ color: cfg.roofColor, roughness: 0.4 });
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.position.y = cfg.height + 0.3;
  roof.castShadow = true;
  group.add(roof);

  // Dàn pin năng lượng mặt trời phủ kín toàn bộ mái (High density solar array)
  const solarGroup = new THREE.Group();
  solarGroup.position.set(0, cfg.height + 0.62, 0);

  const panelMat = new THREE.MeshStandardMaterial({
    color: 0x0b1329,
    roughness: 0.1,
    metalness: 0.9,
  });

  const cols = 8;
  const rows = 4;
  const panelW = (cfg.width - 2.5) / cols;
  const panelD = (cfg.depth - 2.0) / rows;

  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      const pGeo = new THREE.BoxGeometry(panelW - 0.2, 0.08, panelD - 0.2);
      const panel = new THREE.Mesh(pGeo, panelMat);
      panel.position.set(
        -cfg.width / 2 + 1.5 + c * panelW,
        0,
        -cfg.depth / 2 + 1.2 + r * panelD
      );
      solarGroup.add(panel);
    }
  }
  group.add(solarGroup);

  // Cửa sổ kính băng dài 3 tầng
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

  // Bể cá Koi nhân tạo cạnh lối vào Nhà điều hành
  const koiBedGeo = new THREE.BoxGeometry(7.0, 0.6, 9.0);
  const koiBedMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.8 });
  const koiBed = new THREE.Mesh(koiBedGeo, koiBedMat);
  koiBed.position.set(cfg.width / 2 + 4.5, 0.3, 0);
  group.add(koiBed);

  const koiWaterGeo = new THREE.PlaneGeometry(6.4, 8.4);
  const koiWaterMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    roughness: 0.1,
    metalness: 0.7,
    transparent: true,
    opacity: 0.85,
  });
  waterKoiMesh = new THREE.Mesh(koiWaterGeo, koiWaterMat);
  waterKoiMesh.rotation.x = -Math.PI / 2;
  waterKoiMesh.position.set(cfg.width / 2 + 4.5, 0.55, 0);
  group.add(waterKoiMesh);

  scene.add(group);
  buildingMeshes.push(body);
}

function buildKhoLinhKienDK2() {
  const cfg = CONFIG.BUILDINGS.khoLinhKienDK2;
  const group = new THREE.Group();
  group.position.set(cfg.position.x, 0, cfg.position.z);
  group.userData = { id: 'khoLinhKienDK2', config: cfg };

  // Dãy nhà kho dài
  const bodyGeo = new THREE.BoxGeometry(cfg.width, cfg.height, cfg.depth);
  const bodyMat = new THREE.MeshStandardMaterial({ color: cfg.wallColor, roughness: 0.7 });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = cfg.height / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // Mái tôn dốc màu xanh dương tươi (royal blue)
  const roofGeo = new THREE.BoxGeometry(cfg.width + 1.0, 0.6, cfg.depth + 1.0);
  const roofMat = new THREE.MeshStandardMaterial({
    color: cfg.roofColor,
    roughness: 0.45,
    metalness: 0.3,
  });
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.position.y = cfg.height + 0.3;
  roof.castShadow = true;
  group.add(roof);

  // Cửa cuốn kho (Roll-up garage doors) chia ngăn
  const doorMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.4 });
  for (let x = -cfg.width / 2 + 5; x <= cfg.width / 2 - 5; x += 6.5) {
    const doorGeo = new THREE.PlaneGeometry(4.2, 4.0);
    const door = new THREE.Mesh(doorGeo, doorMat);
    door.position.set(x, 2.0, cfg.depth / 2 + 0.05);
    group.add(door);
  }

  scene.add(group);
  buildingMeshes.push(body);
}

function buildXuongDK2() {
  const cfg = CONFIG.BUILDINGS.xuongDK2;
  const group = new THREE.Group();
  group.position.set(cfg.position.x, 0, cfg.position.z);
  group.userData = { id: 'xuongDK2', config: cfg };

  const bodyGeo = new THREE.BoxGeometry(cfg.width, cfg.height, cfg.depth);
  const bodyMat = new THREE.MeshStandardMaterial({ color: cfg.wallColor, roughness: 0.65 });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = cfg.height / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const roofGeo = new THREE.BoxGeometry(cfg.width + 0.8, 0.8, cfg.depth + 0.8);
  const roofMat = new THREE.MeshStandardMaterial({ color: cfg.roofColor, roughness: 0.5 });
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.position.y = cfg.height + 0.4;
  roof.castShadow = true;
  group.add(roof);

  scene.add(group);
  buildingMeshes.push(body);
}

function buildSanThanhPhamDK2() {
  const cfg = CONFIG.BUILDINGS.sanThanhPhamDK2;

  // Sân bê tông phẳng tập kết xe
  const yardGeo = new THREE.PlaneGeometry(cfg.width, cfg.depth);
  const yardMat = new THREE.MeshStandardMaterial({ color: cfg.yardColor, roughness: 0.8 });
  const yard = new THREE.Mesh(yardGeo, yardMat);
  yard.rotation.x = -Math.PI / 2;
  yard.position.set(cfg.position.x, cfg.position.y, cfg.position.z);
  yard.receiveShadow = true;
  scene.add(yard);

  // 2 ô sân kẻ sơn màu xanh lá (Green sport / storage courts)
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

  // Sườn đồi lớn phía Tây
  const hillGeo = new THREE.ConeGeometry(hillCfg.radius, hillCfg.height, 11);
  const hillMat = new THREE.MeshStandardMaterial({
    color: hillCfg.color,
    roughness: 0.9,
    flatShading: true,
  });
  const hill = new THREE.Mesh(hillGeo, hillMat);
  hill.position.set(hillCfg.position.x, hillCfg.height / 2 - 2, hillCfg.position.z);
  hill.receiveShadow = true;
  scene.add(hill);

  // Taluy kè đá giật cấp men theo đồi (Terraced retaining walls)
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x5a6572, roughness: 0.9, flatShading: true });
  for (let tier = 1; tier <= 3; tier++) {
    const wallGeo = new THREE.TorusGeometry(32 + tier * 5, 1.2, 5, 12, Math.PI / 1.5);
    const terrace = new THREE.Mesh(wallGeo, stoneMat);
    terrace.rotation.x = Math.PI / 2;
    terrace.rotation.z = Math.PI / 3;
    terrace.position.set(-105, tier * 2.8, -65);
    terrace.castShadow = true;
    scene.add(terrace);
  }

  // Hồ cảnh quan tròn (Circular Eco-Pond)
  const pondCfg = CONFIG.BUILDINGS.hoTronDK2;
  const pondRimGeo = new THREE.CylinderGeometry(pondCfg.radius + 0.8, pondCfg.radius + 0.8, pondCfg.height, 24);
  const pondRimMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.9 });
  const pondRim = new THREE.Mesh(pondRimGeo, pondRimMat);
  pondRim.position.set(pondCfg.position.x, pondCfg.position.y, pondCfg.position.z);
  pondRim.castShadow = true;
  scene.add(pondRim);

  const waterCircleGeo = new THREE.CircleGeometry(pondCfg.radius, 24);
  const waterCircleMat = new THREE.MeshStandardMaterial({
    color: pondCfg.waterColor,
    roughness: 0.1,
    metalness: 0.7,
    transparent: true,
    opacity: 0.85,
  });
  waterRoundPondMesh = new THREE.Mesh(waterCircleGeo, waterCircleMat);
  waterRoundPondMesh.rotation.x = -Math.PI / 2;
  waterRoundPondMesh.position.set(pondCfg.position.x, pondCfg.position.y + pondCfg.height / 2 + 0.05, pondCfg.position.z);
  scene.add(waterRoundPondMesh);

  // Tuyến đường bê tông dốc uốn lượn hình chữ S (Đường lên vườn lan)
  buildWindingHillRoad();

  // Vườn Lan & Chuồng chim trên đỉnh đồi (Orchid Greenhouse)
  buildVuonLanDK2();
}

function buildWindingHillRoad() {
  const roadMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, roughness: 0.85 });

  // S-curved path segments climbing the hill slope
  const curvePoints = [
    new THREE.Vector3(-100, 0.1, -45),
    new THREE.Vector3(-108, 2.5, -52),
    new THREE.Vector3(-104, 5.5, -60),
    new THREE.Vector3(-112, 8.5, -68),
    new THREE.Vector3(-120, 11.5, -74),
    new THREE.Vector3(-128, 14.8, -80),
  ];

  const curve = new THREE.CatmullRomCurve3(curvePoints);
  const tubeGeo = new THREE.TubeGeometry(curve, 32, 1.8, 4, false);
  const hillRoad = new THREE.Mesh(tubeGeo, roadMat);
  hillRoad.receiveShadow = true;
  scene.add(hillRoad);
}

function buildVuonLanDK2() {
  const cfg = CONFIG.BUILDINGS.vuonLanDK2;
  const group = new THREE.Group();
  group.position.set(cfg.position.x, cfg.position.y, cfg.position.z);
  group.userData = { id: 'vuonLanDK2', config: cfg };

  // Nền đài bê tông phẳng trên đỉnh đồi
  const baseGeo = new THREE.BoxGeometry(cfg.width + 4, 1.0, cfg.depth + 4);
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x9ca3af, roughness: 0.8 });
  const base = new THREE.Mesh(baseGeo, baseMat);
  base.position.y = -0.5;
  base.receiveShadow = true;
  group.add(base);

  // Khung nhà lưới thép
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

  // Mái 4 ô vuông màu xanh lơ trong suốt (Cyan translucent grid panels)
  const panelGeo = new THREE.BoxGeometry(cfg.width / 2 - 0.4, 0.15, cfg.depth / 2 - 0.4);
  const panelMat = new THREE.MeshStandardMaterial({
    color: cfg.canopyColor,
    roughness: 0.15,
    metalness: 0.2,
    transparent: true,
    opacity: cfg.opacity,
  });

  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 2; j++) {
      const p = new THREE.Mesh(panelGeo, panelMat);
      p.position.set(
        -cfg.width / 4 + i * (cfg.width / 2),
        cfg.height,
        -cfg.depth / 4 + j * (cfg.depth / 2)
      );
      p.castShadow = true;
      group.add(p);
    }
  }

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
  const bikeColors = [bikeMatYellow, bikeMatBlue, bikeMatRed];

  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 8; col++) {
      const bikeGeo = new THREE.BoxGeometry(1.2, 0.6, 0.45);
      const bike = new THREE.Mesh(bikeGeo, bikeColors[(row + col) % 3]);
      bike.position.set(
        yardCfg.position.x - 20 + col * 2.2,
        0.35,
        yardCfg.position.z + 8 + row * 1.8
      );
      bike.castShadow = true;
      scene.add(bike);
    }
  }

  // Xe tải giao hàng đỗ nhận hàng
  const truckGroup = new THREE.Group();
  truckGroup.position.set(yardCfg.position.x + 18, 0, yardCfg.position.z + 5);

  const cabGeo = new THREE.BoxGeometry(2.8, 2.4, 2.2);
  const cabMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.4 });
  const cab = new THREE.Mesh(cabGeo, cabMat);
  cab.position.set(2.4, 1.2, 0);
  cab.castShadow = true;
  truckGroup.add(cab);

  const cargoGeo = new THREE.BoxGeometry(5.2, 2.8, 2.3);
  const cargoMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 });
  const cargo = new THREE.Mesh(cargoGeo, cargoMat);
  cargo.position.set(-1.8, 1.5, 0);
  cargo.castShadow = true;
  truckGroup.add(cargo);

  scene.add(truckGroup);
}

// ============================================================================
// 10. Landscaping & Trees (InstancedMesh across DK1 & DK2)
// ============================================================================
function buildLandscaping() {
  const treeCount = 95;
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

  // 1. Row of trees along DK1 railway boundary
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

  // 2. Trees along road DT234
  for (let z = -95; z <= 10; z += 8) {
    if (idx >= treeCount) break;
    const x = -15 + (Math.random() - 0.5) * 1.0;
    dummy.position.set(x, 1.0, z);
    dummy.scale.setScalar(0.85 + Math.random() * 0.3);
    dummy.updateMatrix();
    trunkInstanced.setMatrixAt(idx, dummy.matrix);

    dummy.position.set(x, 3.0, z);
    dummy.updateMatrix();
    foliageInstanced.setMatrixAt(idx, dummy.matrix);
    idx++;
  }

  // 3. Dense trees on DK2 Hill slope
  for (let i = 0; i < 40; i++) {
    if (idx >= treeCount) break;
    const ang = Math.random() * Math.PI * 2;
    const rad = 10 + Math.random() * 32;
    const x = CONFIG.HILLS.dk2.position.x + Math.cos(ang) * rad;
    const z = CONFIG.HILLS.dk2.position.z + Math.sin(ang) * rad;
    const y = 2.0 + Math.random() * 12.0;

    dummy.position.set(x, y, z);
    dummy.scale.setScalar(1.0 + Math.random() * 0.6);
    dummy.updateMatrix();
    trunkInstanced.setMatrixAt(idx, dummy.matrix);

    dummy.position.set(x, y + 2.5, z);
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
// 11. Animated Vehicles
// ============================================================================
function setupAnimatedVehicles() {
  // 1. Xe máy điện DK Bike chạy tuần tra test track DK1
  animatedBike = new THREE.Group();
  const bodyGeo = new THREE.BoxGeometry(1.4, 0.7, 0.5);
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0xffb703, roughness: 0.3 });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 0.5;
  body.castShadow = true;
  animatedBike.add(body);

  const lightGeo = new THREE.SphereGeometry(0.12, 6, 6);
  const lightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const light = new THREE.Mesh(lightGeo, lightMat);
  light.position.set(0.72, 0.55, 0);
  animatedBike.add(light);
  scene.add(animatedBike);

  // 2. Xe tải di chuyển trên đường ĐT234 nối giữa DK1 & DK2
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

function updateAnimatedVehicles(delta) {
  // Bike looping around Nhà B in DK1
  if (animatedBike) {
    bikeTrackAngle += delta * 0.35;
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
  }

  // Truck travelling on DT234
  if (animatedTruck) {
    truckProgress += delta * 12;
    if (truckProgress > 150) truckProgress = 0;
    animatedTruck.position.z = -120 + truckProgress;
  }
}

// ============================================================================
// 12. Weather Effects (Rain)
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
    pos[i] -= delta * 75;
    if (pos[i] < 0) {
      pos[i] = 85;
    }
  }
  rainParticles.geometry.attributes.position.needsUpdate = true;
}

// ============================================================================
// 13. Environment Toggle (Day / Sunset / Night)
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
  windowLights.forEach((mat) => {
    if (isNight) {
      mat.emissive.set(0xfbbf24);
      mat.emissiveIntensity = 0.8;
    } else {
      mat.emissive.set(0x000000);
      mat.emissiveIntensity = 0;
    }
  });

  logoLight.intensity = isNight ? 1.5 : 0;

  document.querySelectorAll('.toggle-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.time === time);
  });
}

// ============================================================================
// 14. 3D HTML Labels & Interaction (DK1 & DK2)
// ============================================================================
function createBuildingLabels() {
  const container = document.body;
  const labelsData = [
    // DK1 Labels
    { text: 'Nhà B (Xưởng 3 tầng)', pos: new THREE.Vector3(65, 14.5, -50), id: 'nhaB' },
    { text: 'Nhà A (Văn phòng)', pos: new THREE.Vector3(35, 12.0, -35), id: 'nhaA' },
    { text: 'Nhà C (Mái tôn xanh)', pos: new THREE.Vector3(45, 7.5, -58.5), id: 'nhaC' },
    { text: 'Nhà ăn CBNV', pos: new THREE.Vector3(23, 11.5, -12), id: 'nhaAn' },
    { text: 'Mái che xe 3 bánh', pos: new THREE.Vector3(79.5, 5.0, -46), id: 'maiCheXe' },

    // DK2 Labels
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
// 15. Camera Preset Smooth Transitions
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
// 16. Building Detail Modal (DK1 & DK2 Support)
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

// ============================================================================
// 17. UI Event Listeners & Raycasting
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

  // Focus card button
  document.getElementById('btn-focus-card').addEventListener('click', () => {
    const tag = document.getElementById('card-tag').innerText.toLowerCase();
    if (tag.includes('dk1') || tag === 'nhab') setCameraPreset('nhaB');
    else if (tag.includes('dk2') || tag.includes('nha')) setCameraPreset('nhaDieuHanh');
    else if (tag.includes('lan')) setCameraPreset('vuonLan');
  });

  // Raycaster click on 3D canvas
  window.addEventListener('pointerdown', (e) => {
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
// 18. Animation Loop
// ============================================================================
let lastTime = performance.now();

function animate(time) {
  requestAnimationFrame(animate);

  const delta = Math.min((time - lastTime) / 1000, 0.1);
  lastTime = time;

  if (cameraTween) {
    cameraTween(time);
  } else {
    controls.update();
  }

  // Update animated vehicles
  updateAnimatedVehicles(delta);

  // Update rain effect
  updateRain(delta);

  // Subtle water ripples
  if (waterCanalMesh) {
    waterCanalMesh.material.opacity = 0.8 + Math.sin(time * 0.002) * 0.05;
  }
  if (waterRoundPondMesh) {
    waterRoundPondMesh.material.opacity = 0.8 + Math.cos(time * 0.002) * 0.05;
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
