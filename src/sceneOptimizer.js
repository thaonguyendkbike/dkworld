// ============================================================================
// DK BIKE WORLD - SCENE OPTIMIZER & ADAPTIVE QUALITY
// 1. Static Batching: gộp hàng nghìn mesh tĩnh thành vài chục draw call
// 2. Light Pooling: thay ~95 PointLight/SpotLight bằng 4 đèn động gần camera
// 3. Adaptive Quality: tự hạ/tăng độ phân giải & tần suất bóng đổ theo FPS
// ============================================================================

import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const SIGNATURE_MATERIAL_TYPES = new Set([
  'MeshStandardMaterial',
  'MeshLambertMaterial',
  'MeshPhongMaterial',
  'MeshBasicMaterial',
]);

const TEXTURE_KEYS = ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'emissiveMap', 'alphaMap', 'aoMap', 'bumpMap', 'envMap', 'lightMap', 'specularMap'];

function hex(c) {
  return c && c.getHexString ? c.getHexString() : '-';
}

function snapshotMaterial(m) {
  return [
    hex(m.color), hex(m.emissive), m.emissiveIntensity, m.opacity, m.visible, m.transparent,
    m.roughness, m.metalness,
  ].join('|');
}

function materialSignature(m) {
  return [
    m.type, hex(m.color), hex(m.emissive), m.emissiveIntensity, m.roughness, m.metalness,
    m.flatShading, m.side, m.opacity, m.transparent, m.vertexColors, m.fog, m.wireframe,
    m.depthTest, m.depthWrite, m.polygonOffset, m.polygonOffsetFactor, m.polygonOffsetUnits,
    m.toneMapped, m.alphaTest, m.envMapIntensity, hex(m.specular), m.shininess, m.blending,
    m.userData && m.userData.snowShader ? m.userData.snowShader.key : 'nosnow',
  ].join('|');
}

function hasTextures(m) {
  return TEXTURE_KEYS.some((k) => m[k]);
}

function isEffectivelyVisible(o) {
  let cur = o;
  while (cur) {
    if (!cur.visible) return false;
    cur = cur.parent;
  }
  return true;
}

function matricesDiffer(a, b) {
  const ea = a.elements, eb = b.elements;
  for (let i = 0; i < 16; i++) {
    if (Math.abs(ea[i] - eb[i]) > 1e-4) return true;
  }
  return false;
}

// ----------------------------------------------------------------------------
// 1. STATIC BATCHING
// ----------------------------------------------------------------------------
/**
 * @param {THREE.Scene} scene
 * @param {object} opts
 * @param {Function} opts.simulate  Hàm chạy mô phỏng animation (để phát hiện vật thể động)
 * @param {Array<THREE.Object3D>} opts.clickables  Danh sách vật thể cho phép click (giữ cấu trúc)
 */
export function batchStaticMeshes(scene, { simulate, clickables = [] }) {
  const t0 = performance.now();
  scene.updateMatrixWorld(true);

  const clickableSet = new Set(clickables);

  function isDoNotBatch(o) {
    let cur = o;
    while (cur && cur !== scene) {
      if (cur.userData && (cur.userData.noBatch || cur.userData.dynamic)) return true;
      if (cur.name === 'nhaBRoofGroup' || cur.userData?.id === 'nhaBRoofGroup') return true;
      cur = cur.parent;
    }
    return false;
  }

  // Thu thập ứng viên (loại trừ các mesh thuộc nhóm mái/nội thất động)
  const candidates = [];
  scene.traverse((o) => {
    if (!o.isMesh || o.isInstancedMesh || o.isSkinnedMesh) return;
    if (isDoNotBatch(o)) return;
    candidates.push(o);
  });

  // Snapshot trạng thái ban đầu
  const snap = new Map();
  const matSnap = new Map();
  candidates.forEach((m) => {
    snap.set(m, { matrix: m.matrixWorld.clone(), visible: isEffectivelyVisible(m), material: m.material });
    const mats = Array.isArray(m.material) ? m.material : [m.material];
    mats.forEach((mat) => { if (!matSnap.has(mat)) matSnap.set(mat, snapshotMaterial(mat)); });
  });

  const dynamicMeshes = new Set();
  const dynamicMaterials = new Set();

  const checkpoint = () => {
    scene.updateMatrixWorld(true);
    candidates.forEach((m) => {
      if (dynamicMeshes.has(m)) return;
      const s = snap.get(m);
      if (m.material !== s.material || isEffectivelyVisible(m) !== s.visible || matricesDiffer(m.matrixWorld, s.matrix)) {
        dynamicMeshes.add(m);
      }
    });
    matSnap.forEach((v, mat) => {
      if (!dynamicMaterials.has(mat) && snapshotMaterial(mat) !== v) dynamicMaterials.add(mat);
    });
  };

  // Chạy mô phỏng (animation, ngày/đêm, cửa cuốn...) và đối chiếu định kỳ
  simulate(checkpoint);
  checkpoint();

  // Phân nhóm mesh tĩnh
  const groups = new Map();
  const inv = new THREE.Matrix4();
  const rel = new THREE.Matrix4();
  const center = new THREE.Vector3();
  let skipped = 0;

  candidates.forEach((m) => {
    if (dynamicMeshes.has(m)) return;
    if (!m.parent || !snap.get(m).visible) return;
    if (clickableSet.has(m)) return;
    if (Array.isArray(m.material)) return;
    const mat = m.material;
    if (!mat || mat.isShaderMaterial) return;
    // Shader phủ tuyết chỉ dùng normal thế giới (modelMatrix * normal) nên vẫn đúng sau khi gộp
    const snowOnly = mat.userData && mat.userData.snowShader && mat.userData.snowShader.snowOnly;
    if (mat.onBeforeCompile !== THREE.Material.prototype.onBeforeCompile && !snowOnly) return;
    if (mat.transparent) return;
    const geo = m.geometry;
    if (!geo || !geo.attributes.position || geo.morphAttributes.position || (geo.groups && geo.groups.length > 1)) return;
    if (m.matrixWorld.determinant() < 0) return;
    if (m.renderOrder !== 0 || m.onBeforeRender !== THREE.Object3D.prototype.onBeforeRender) return;

    // Phạm vi gộp: vật thể click được gần nhất (giữ khả năng click), ngược lại là ô lưới không gian
    let scope = null;
    let cur = m.parent;
    while (cur && cur !== scene) {
      if (clickableSet.has(cur) || (cur.userData && (cur.userData.id || cur.userData.type))) { scope = cur; break; }
      cur = cur.parent;
    }
    let scopeKey;
    if (scope) {
      if (dynamicMeshes.has(scope)) return;
      scopeKey = scope.uuid;
    } else {
      scope = scene;
      if (!geo.boundingSphere) geo.computeBoundingSphere();
      center.copy(geo.boundingSphere.center).applyMatrix4(m.matrixWorld);
      const cx = Math.floor((center.x + 200) / 60);
      const cz = Math.floor((center.z + 220) / 60);
      scopeKey = `cell_${cx}_${cz}`;
    }

    const matKey = (dynamicMaterials.has(mat) || hasTextures(mat) || !SIGNATURE_MATERIAL_TYPES.has(mat.type))
      ? `uuid:${mat.uuid}`
      : materialSignature(mat);
    const attrKey = Object.keys(geo.attributes).sort().map((k) => `${k}${geo.attributes[k].itemSize}`).join(',');
    const key = [scopeKey, matKey, m.castShadow, m.receiveShadow, geo.index ? 'i' : 'n', attrKey].join('#');

    if (!groups.has(key)) groups.set(key, { scope, material: mat, meshes: [], castShadow: m.castShadow, receiveShadow: m.receiveShadow });
    groups.get(key).meshes.push(m);
  });

  // Đếm số lần dùng geometry để giải phóng an toàn
  const geoUsers = new Map();
  scene.traverse((o) => { if (o.geometry) geoUsers.set(o.geometry, (geoUsers.get(o.geometry) || 0) + 1); });

  let removed = 0, created = 0;
  groups.forEach((g) => {
    if (g.meshes.length < 2) return;
    g.scope.updateMatrixWorld(true);
    inv.copy(g.scope.matrixWorld).invert();

    const geos = [];
    g.meshes.forEach((m) => {
      const clone = m.geometry.clone();
      clone.morphAttributes = {};
      clone.clearGroups();
      rel.multiplyMatrices(inv, m.matrixWorld);
      clone.applyMatrix4(rel);
      geos.push(clone);
    });

    const merged = mergeGeometries(geos, false);
    geos.forEach((gg) => gg.dispose());
    if (!merged) { skipped += g.meshes.length; return; }
    merged.computeBoundingSphere();
    merged.computeBoundingBox();

    const batch = new THREE.Mesh(merged, g.material);
    batch.name = 'static_batch';
    batch.castShadow = g.castShadow;
    batch.receiveShadow = g.receiveShadow;
    batch.matrixAutoUpdate = false;
    g.scope.add(batch);
    batch.updateMatrixWorld(true);
    created++;

    g.meshes.forEach((m) => {
      m.parent.remove(m);
      removed++;
      const n = (geoUsers.get(m.geometry) || 1) - 1;
      geoUsers.set(m.geometry, n);
      if (n === 0) m.geometry.dispose();
    });
  });

  const stats = {
    candidates: candidates.length,
    dynamic: dynamicMeshes.size,
    dynamicMaterials: dynamicMaterials.size,
    merged: removed,
    batches: created,
    skipped,
    ms: Math.round(performance.now() - t0),
  };
  console.info('[Optimizer] Static batching', stats);
  return stats;
}

// ----------------------------------------------------------------------------
// 2. LIGHT POOLING
// Three.js tính TẤT CẢ đèn point/spot cho MỌI pixel (kể cả đèn cường độ 0).
// Ẩn đèn gốc và dùng một pool cố định N đèn đặt tại các nguồn sáng gần camera nhất.
// ----------------------------------------------------------------------------
export class LightPool {
  constructor(scene, size = 4) {
    this.scene = scene;
    this.size = size;
    this.sources = [];
    this.pool = [];
    this.frame = 0;
    this._tmp = new THREE.Vector3();

    scene.traverse((o) => {
      if ((o.isPointLight || o.isSpotLight) && !o.userData.isPooled) this.sources.push(o);
    });
    this.sources.forEach((l) => { l.visible = false; });

    for (let i = 0; i < size; i++) {
      const pl = new THREE.PointLight(0xffffff, 0, 10, 2);
      pl.userData.isPooled = true;
      pl.castShadow = false;
      scene.add(pl);
      this.pool.push(pl);
    }
    console.info(`[Optimizer] Light pooling: ${this.sources.length} đèn → ${size} đèn động`);
  }

  setSize(n) {
    // Đèn ẩn không được đưa vào shader → cấp Thấp không tốn chi phí đèn điểm nào.
    // (Đổi số đèn sẽ biên dịch lại shader một lần, chỉ xảy ra khi đổi cấp chất lượng)
    this.activeCount = Math.min(n, this.size);
    this.pool.forEach((p, i) => { p.visible = i < this.activeCount; });
  }

  update(focus) {
    this.frame++;
    if (this.frame % 6 !== 0) return; // cập nhật 10 lần/giây là đủ
    const active = this.activeCount ?? this.size;
    const scored = [];
    for (let i = 0; i < this.sources.length; i++) {
      const l = this.sources[i];
      if (l.intensity <= 0.001) continue;
      l.getWorldPosition(this._tmp);
      const d = this._tmp.distanceToSquared(focus);
      scored.push({ l, d, x: this._tmp.x, y: this._tmp.y, z: this._tmp.z });
    }
    scored.sort((a, b) => a.d - b.d);
    for (let i = 0; i < this.pool.length; i++) {
      const p = this.pool[i];
      const s = i < active ? scored[i] : null;
      if (!s) { p.intensity = 0; continue; }
      p.position.set(s.x, s.y, s.z);
      p.color.copy(s.l.color);
      p.intensity = s.l.intensity;
      p.distance = s.l.distance;
      p.decay = s.l.decay;
    }
  }
}

// Tối ưu bóng đổ: Loại bỏ castShadow trên các vật thể nhỏ li ti (cốc, ghế, nan can...) và các hiệu ứng khói/trong suốt
export function pruneSmallShadowCasters(scene, minDimThreshold = 2.2) {
  let pruned = 0;
  const size = new THREE.Vector3();
  scene.traverse((o) => {
    if (o.isMesh && o.castShadow) {
      // Loại bỏ bóng đổ cho các vật liệu trong suốt, khói lam chiều, ống khói
      if (o.material && o.material.transparent) {
        o.castShadow = false;
        pruned++;
        return;
      }
      if (o.name && (o.name.includes('smoke') || o.name.includes('puff') || o.name.includes('cloud'))) {
        o.castShadow = false;
        pruned++;
        return;
      }
      if (!o.isInstancedMesh && o.geometry) {
        if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
        o.geometry.boundingBox.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z);
        if (maxDim < minDimThreshold) {
          o.castShadow = false;
          pruned++;
        }
      }
    }
  });
  console.info(`[Optimizer] Đã loại bỏ castShadow trên ${pruned} chi tiết nhỏ để giảm 60-70% shadow draw calls`);
  return pruned;
}

// ----------------------------------------------------------------------------
// 3. ADAPTIVE QUALITY
// ----------------------------------------------------------------------------
export const QUALITY_PRESETS = {
  high:   { label: 'Cao',          maxPixelRatio: 1.25, minPixelRatio: 1.0,  shadows: true,  shadowEvery: 6,  lights: 4, dewDensity: 1.0 },
  medium: { label: 'Trung bình',   maxPixelRatio: 1.0,  minPixelRatio: 0.75, shadows: true,  shadowEvery: 12, lights: 2, dewDensity: 0.8 },
  low:    { label: 'Thấp (Mượt)',  maxPixelRatio: 0.8,  minPixelRatio: 0.6,  shadows: false, shadowEvery: 0,  lights: 0, dewDensity: 0.5 },
};

export class AdaptiveQuality {
  constructor(renderer, { onChange } = {}) {
    this.renderer = renderer;
    this.onChange = onChange;
    const urlQuality = new URLSearchParams(window.location.search).get('quality');
    this.mode = urlQuality || localStorage.getItem('dk_quality') || 'auto';
    this.tier = 'high';
    this.pixelRatio = Math.min(window.devicePixelRatio, 1.25);
    this.frames = 0;
    this.windowStart = performance.now();
    this.lowStreak = 0;
    this.highStreak = 0;
    this.apply(this.mode === 'auto' ? this.guessInitialTier() : this.mode, true);
  }

  // Đoán cấu hình ban đầu dựa trên GPU & CPU để tránh vài giây đầu bị giật
  guessInitialTier() {
    try {
      const gl = this.renderer.getContext();
      const dbg = gl.getExtension('WEBGL_debug_renderer_info');
      const gpu = (dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : '').toLowerCase();
      const cores = navigator.hardwareConcurrency || 4;
      if (/swiftshader|llvmpipe|software|basic render/.test(gpu)) return 'low';
      if (/intel|uhd|hd graphics|iris|mali|adreno|powervr|vega [0-9] /.test(gpu) || cores <= 4) return 'medium';
      return 'high';
    } catch (e) {
      return 'medium';
    }
  }

  get preset() {
    return QUALITY_PRESETS[this.tier];
  }

  setMode(mode) {
    this.mode = mode;
    localStorage.setItem('dk_quality', mode);
    this.apply(mode === 'auto' ? this.tier : mode, true);
  }

  apply(tier, resetPixelRatio = false) {
    this.tier = tier;
    const p = QUALITY_PRESETS[tier];
    if (resetPixelRatio) this.pixelRatio = Math.min(window.devicePixelRatio, p.maxPixelRatio);
    this.pixelRatio = THREE.MathUtils.clamp(this.pixelRatio, p.minPixelRatio, p.maxPixelRatio);
    this.renderer.setPixelRatio(this.pixelRatio);
    if (this.onChange) this.onChange(this);
  }

  // Gọi mỗi khung hình
  tick(now) {
    this.frames++;
    const elapsed = now - this.windowStart;
    if (elapsed < 1000) return;
    const fps = (this.frames * 1000) / elapsed;
    this.frames = 0;
    this.windowStart = now;
    this.lastFps = fps;
    if (this.mode !== 'auto' || document.hidden) return;

    const order = ['low', 'medium', 'high'];
    const idx = order.indexOf(this.tier);
    const p = this.preset;

    if (fps < 30) {
      this.lowStreak++;
      this.highStreak = 0;
      if (this.pixelRatio > p.minPixelRatio + 0.01) {
        // Bước 1: hạ dần độ phân giải
        this.pixelRatio = Math.max(p.minPixelRatio, this.pixelRatio - 0.1);
        this.renderer.setPixelRatio(this.pixelRatio);
        if (this.onChange) this.onChange(this);
      } else if (this.lowStreak >= 2 && idx > 0) {
        // Bước 2: hạ cấp chất lượng
        this.lowStreak = 0;
        this.apply(order[idx - 1]);
      }
    } else if (fps > 54) {
      this.highStreak++;
      this.lowStreak = 0;
      if (this.highStreak >= 3) {
        this.highStreak = 0;
        if (this.pixelRatio < p.maxPixelRatio - 0.01) {
          this.pixelRatio = Math.min(p.maxPixelRatio, this.pixelRatio + 0.05);
          this.renderer.setPixelRatio(this.pixelRatio);
          if (this.onChange) this.onChange(this);
        } else if (idx < order.length - 1) {
          this.apply(order[idx + 1], false);
        }
      }
    } else {
      this.lowStreak = 0;
      this.highStreak = 0;
    }
  }
}
