// ============================================================================
// DK BIKE WORLD - DEW SPARKLE & SHIMMER SYSTEM (Ánh Sương Lung Linh)
// Phân bố đều khắp toàn bộ bản đồ Diorama (300m × 300m) với kích thước nhỏ xinh, tinh tế
// ============================================================================

import * as THREE from 'three';

export class DewSparkleSystem {
  constructor(scene, getElevationFn = null) {
    this.scene = scene;
    this.getElevationFn = getElevationFn;
    this.sparklePoints = null;
    this.motePoints = null;
    this.group = new THREE.Group();
    this.group.name = 'dew_sparkle_system';

    this.enabled = true;
    this.intensity = 1.0;
    this.timeOfDay = 'day';

    this.dewUniforms = {
      uTime: { value: 0 },
      uIntensity: { value: 1.0 },
      uEnvFactor: { value: 1.0 },
    };

    this.moteUniforms = {
      uTime: { value: 0 },
      uIntensity: { value: 1.0 },
    };

    this.init();
  }

  init() {
    this.createDewPoints();
    this.createFloatingSunMotes();
    this.scene.add(this.group);
  }

  // Hàm tính cao độ địa hình fallback nếu không truyền từ main.js
  getElevation(x, z) {
    if (typeof this.getElevationFn === 'function') {
      try {
        return this.getElevationFn(x, z);
      } catch (e) {}
    }

    let maxY = 0.15;

    // 1. Đồi chính DK2 (Đỉnh +23m)
    const distDk2 = Math.hypot(x - (-120), z - (-78));
    if (distDk2 < 54) {
      const y = -2.0 + 25.0 * (1 - distDk2 / 54);
      if (y > maxY) maxY = y;
    }

    // 2. Đồi hoa sinh thái DK2
    const distDk2New = Math.hypot(x - (-142), z - (-38));
    if (distDk2New < 46) {
      const y = 15.5 * Math.max(0, 1 - distDk2New / 46);
      if (y > maxY) maxY = y;
    }

    // 3. Đồi Cối xay gió
    const distWindmill = Math.hypot(x - 55, z - (-108));
    if (distWindmill < 54) {
      const y = -2.0 + 30.0 * (1 - distWindmill / 54);
      if (y > maxY) maxY = y;
    }

    // 4. Các triền đồi bao quanh viền
    const distNW = Math.hypot(x - (-145), z - (-155));
    if (distNW < 48) maxY = Math.max(maxY, 28 * (1 - distNW / 48));

    const distNE = Math.hypot(x - 80, z - (-160));
    if (distNE < 48) maxY = Math.max(maxY, 28 * (1 - distNE / 48));

    const distEast = Math.hypot(x - 115, z - (-75));
    if (distEast < 25) maxY = Math.max(maxY, 20 * (1 - distEast / 25));

    // Lòng sông máng
    if (x > 84 && x < 97 && z > -110 && z < 70) {
      return -0.8;
    }

    return Math.max(0.15, maxY);
  }

  // Tạo texture kim cương 4 cánh tia kim siêu mảnh, sắc sảo và tinh tế
  createStarGlintTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    const cx = 64, cy = 64;

    // 1. Quầng sáng tỏa vi tế ở tâm (Subtle soft glow)
    const radial = ctx.createRadialGradient(cx, cy, 0, cx, cy, 26);
    radial.addColorStop(0, 'rgba(255, 255, 255, 1)');
    radial.addColorStop(0.25, 'rgba(224, 242, 254, 0.75)');
    radial.addColorStop(0.65, 'rgba(186, 230, 253, 0.2)');
    radial.addColorStop(1, 'rgba(186, 230, 253, 0)');
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, 128, 128);

    // 2. Tia sáng dọc hình kim siêu mảnh (Ultra-thin vertical needle ray)
    const vGrad = ctx.createLinearGradient(cx, 0, cx, 128);
    vGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
    vGrad.addColorStop(0.45, 'rgba(255, 255, 255, 0.6)');
    vGrad.addColorStop(0.5, 'rgba(255, 255, 255, 1)');
    vGrad.addColorStop(0.55, 'rgba(255, 255, 255, 0.6)');
    vGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = vGrad;
    ctx.beginPath();
    ctx.moveTo(cx - 1.5, cy);
    ctx.lineTo(cx, 8);
    ctx.lineTo(cx + 1.5, cy);
    ctx.lineTo(cx, 120);
    ctx.closePath();
    ctx.fill();

    // 3. Tia sáng ngang hình kim siêu mảnh (Ultra-thin horizontal needle ray)
    const hGrad = ctx.createLinearGradient(0, cy, 128, cy);
    hGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
    hGrad.addColorStop(0.45, 'rgba(255, 255, 255, 0.6)');
    hGrad.addColorStop(0.5, 'rgba(255, 255, 255, 1)');
    hGrad.addColorStop(0.55, 'rgba(255, 255, 255, 0.6)');
    hGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = hGrad;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 1.5);
    ctx.lineTo(120, cy);
    ctx.lineTo(cx, cy + 1.5);
    ctx.lineTo(8, cy);
    ctx.closePath();
    ctx.fill();

    // 4. Tia chéo 45 độ cực nhỏ (Micro diagonal glints)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(cx - 16, cy - 16);
    ctx.lineTo(cx + 16, cy + 16);
    ctx.moveTo(cx - 16, cy + 16);
    ctx.lineTo(cx + 16, cy - 16);
    ctx.stroke();

    // 5. Điểm sáng pha lê nhỏ li ti ở chính tâm
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx, cy, 2.8, 0, Math.PI * 2);
    ctx.fill();

    const texture = new THREE.CanvasTexture(canvas);
    texture.generateMipmaps = false;
    texture.minFilter = THREE.LinearFilter;
    return texture;
  }

  // 1. HỆ THỐNG GIỌT SƯƠNG ĐẶT ĐỀU KHẮP TOÀN BỘ BẢN ĐỒ (Uniformly Distributed Sparkles)
  createDewPoints() {
    const dewCount = 1100; // Giữ nguyên cùng số lượng 1.100 điểm lấp lánh lung linh
    const positions = new Float32Array(dewCount * 3);
    const colors = new Float32Array(dewCount * 3);
    const phases = new Float32Array(dewCount);
    const frequencies = new Float32Array(dewCount);
    const sizes = new Float32Array(dewCount);

    // Bảng màu lăng kính phản quang trong trẻo của giọt sương mai
    const colorPalette = [
      new THREE.Color(0xffffff), // Kim cương trắng sáng
      new THREE.Color(0xf0f9ff), // Xanh băng pha lê
      new THREE.Color(0xdcfce7), // Lục bảo sương lá
      new THREE.Color(0xfef9c3), // Vàng nắng mai
      new THREE.Color(0xfae8ff), // Ánh tím hồng bình minh
    ];

    // ========================================================================
    // PHÂN BỐ ĐỀU TOÀN DIỆN TRÊN BẢN ĐỒ VUÔNG 300m × 300m
    // Phạm vi X: từ -168 đến +118 (rộng 286m)
    // Phạm vi Z: từ -192 đến +92 (dài 284m)
    // Dùng thuật toán Lưới Phân Tầng Jitter (Stratified Jittered Grid)
    // ========================================================================
    const gridCols = 33;
    const gridRows = 33;
    const minX = -168, spanX = 286;
    const minZ = -192, spanZ = 284;
    const stepX = spanX / gridCols;
    const stepZ = spanZ / gridRows;

    for (let i = 0; i < dewCount; i++) {
      let x, z;

      if (i < gridCols * gridRows) {
        // Mỗi ô lưới phụ trách 1 điểm, có độ dịch chuyển ngẫu nhiên tự nhiên
        const col = i % gridCols;
        const row = Math.floor(i / gridCols);
        x = minX + (col + 0.5) * stepX + (Math.random() - 0.5) * stepX * 0.92;
        z = minZ + (row + 0.5) * stepZ + (Math.random() - 0.5) * stepZ * 0.92;
      } else {
        // Các điểm còn lại rải ngẫu nhiên đều khắp bản đồ
        x = minX + Math.random() * spanX;
        z = minZ + Math.random() * spanZ;
      }

      // Lấy cao độ mặt đất thực tế tại tọa độ (x, z)
      const groundY = this.getElevation(x, z);

      // Điểm xuyết trên ngọn cỏ, bụi cây, tán cây xanh, bờ rào hoặc mái hiên (+0.8m đến +3.8m trên mặt đất)
      const foliageOffset = 0.8 + Math.random() * 2.8;
      const y = groundY + foliageOffset;

      positions[i * 3 + 0] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      const col = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      colors[i * 3 + 0] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;

      phases[i] = Math.random() * Math.PI * 2.0;

      // Nhịp lấp lánh (0.6 - 2.0 Hz) ngắt quãng thi thoảng điểm xuyết
      frequencies[i] = 0.6 + Math.random() * 1.4;

      // ======================================================================
      // YÊU CẦU: LÀM LẤP LÁNH NHỎ HƠN
      // Giảm kích thước xuống 6.5px - 11.5px (trước đây là 20px - 38px)
      // ======================================================================
      sizes[i] = 7.0 + Math.random() * 4.5;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
    geometry.setAttribute('aFreq', new THREE.BufferAttribute(frequencies, 1));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));

    const starTexture = this.createStarGlintTexture();

    const dewMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: this.dewUniforms.uTime,
        uIntensity: this.dewUniforms.uIntensity,
        uEnvFactor: this.dewUniforms.uEnvFactor,
        uTexture: { value: starTexture },
      },
      vertexShader: `
        uniform float uTime;
        uniform float uIntensity;
        uniform float uEnvFactor;

        attribute vec3 aColor;
        attribute float aPhase;
        attribute float aFreq;
        attribute float aSize;

        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          vColor = aColor;

          // Lũy thừa bậc 9 tạo khoảnh khắc chớp sáng kim cương ngắn ngủi, sắc sảo (0.25s)
          float sineWave = max(0.0, sin(uTime * aFreq + aPhase));
          float glint = pow(sineWave, 9.0);

          // Ánh sáng lấp lánh nền rất nhẹ
          float subtleShimmer = sin(uTime * aFreq * 1.6 + aPhase) * 0.08 + 0.08;

          vAlpha = (glint * 0.95 + subtleShimmer * 0.15) * uIntensity * uEnvFactor;

          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

          // Kích thước điểm tinh tế, nhỏ xinh, thu nhỏ chuẩn theo phối cảnh camera
          float currentSize = aSize * (0.35 + 0.65 * glint);
          gl_PointSize = currentSize * (95.0 / -mvPosition.z);
          // Giới hạn max chỉ 13px (thay vì 64px trước đây) để luôn nhỏ nhắn, lung linh
          gl_PointSize = clamp(gl_PointSize, 1.2, 13.0);

          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform sampler2D uTexture;
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          if (vAlpha < 0.012) discard;
          vec4 texColor = texture2D(uTexture, gl_PointCoord);
          gl_FragColor = vec4(vColor * texColor.rgb * (1.0 + vAlpha * 0.5), texColor.a * vAlpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.sparklePoints = new THREE.Points(geometry, dewMaterial);
    this.sparklePoints.frustumCulled = false;
    this.group.add(this.sparklePoints);
  }

  // 2. CÁC ĐỐM SÁNG BỤI NẮNG NHỎ LI TI TRẢI ĐỀU KHẮP BẢN ĐỒ (Delicate Sun Motes)
  createFloatingSunMotes() {
    const moteCount = 350;
    const positions = new Float32Array(moteCount * 3);
    const seedX = new Float32Array(moteCount);
    const seedY = new Float32Array(moteCount);
    const seedZ = new Float32Array(moteCount);

    const minX = -168, spanX = 286;
    const minZ = -192, spanZ = 284;

    for (let i = 0; i < moteCount; i++) {
      // Phân bố đều khắp không gian 3D bản đồ
      const x = minX + Math.random() * spanX;
      const z = minZ + Math.random() * spanZ;
      const groundY = this.getElevation(x, z);
      const y = groundY + 1.2 + Math.random() * 6.5;

      positions[i * 3 + 0] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      seedX[i] = Math.random() * 100.0;
      seedY[i] = Math.random() * 100.0;
      seedZ[i] = Math.random() * 100.0;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aSeedX', new THREE.BufferAttribute(seedX, 1));
    geometry.setAttribute('aSeedY', new THREE.BufferAttribute(seedY, 1));
    geometry.setAttribute('aSeedZ', new THREE.BufferAttribute(seedZ, 1));

    // Texture tròn mờ mềm cho bụi sáng
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const rad = ctx.createRadialGradient(32, 32, 0, 32, 32, 28);
    rad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    rad.addColorStop(0.35, 'rgba(254, 240, 138, 0.65)');
    rad.addColorStop(1, 'rgba(254, 240, 138, 0)');
    ctx.fillStyle = rad;
    ctx.fillRect(0, 0, 64, 64);
    const moteTex = new THREE.CanvasTexture(canvas);

    const moteMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: this.moteUniforms.uTime,
        uIntensity: this.moteUniforms.uIntensity,
        uTexture: { value: moteTex },
      },
      vertexShader: `
        uniform float uTime;
        uniform float uIntensity;

        attribute float aSeedX;
        attribute float aSeedY;
        attribute float aSeedZ;

        varying float vAlpha;

        void main() {
          // Bụi nắng bay dập dềnh nhẹ nhàng trong gió
          vec3 pos = position;
          pos.x += sin(uTime * 0.45 + aSeedX) * 1.2;
          pos.y += cos(uTime * 0.35 + aSeedY) * 0.6;
          pos.z += sin(uTime * 0.4 + aSeedZ) * 1.2;

          float pulse = 0.5 + 0.5 * sin(uTime * 1.2 + aSeedX);
          vAlpha = pulse * 0.4 * uIntensity;

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          // Hạt bụi nắng nhỏ li ti (max 7.5px thay vì 28px)
          gl_PointSize = (3.5 + 2.5 * pulse) * (80.0 / -mvPosition.z);
          gl_PointSize = clamp(gl_PointSize, 1.0, 7.5);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform sampler2D uTexture;
        varying float vAlpha;

        void main() {
          if (vAlpha < 0.015) discard;
          vec4 texColor = texture2D(uTexture, gl_PointCoord);
          gl_FragColor = vec4(1.0, 0.95, 0.78, 1.0) * texColor * vAlpha;
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.motePoints = new THREE.Points(geometry, moteMaterial);
    this.motePoints.frustumCulled = false;
    this.group.add(this.motePoints);
  }

  // --------------------------------------------------------------------------
  // RUNTIME UPDATES
  // --------------------------------------------------------------------------
  update(delta, currentTime) {
    if (!this.enabled) return;
    const timeSec = currentTime * 0.001;
    this.dewUniforms.uTime.value = timeSec;
    this.moteUniforms.uTime.value = timeSec;
  }

  setEnvironment(envMode) {
    this.timeOfDay = envMode;
    if (envMode === 'day') {
      this.dewUniforms.uEnvFactor.value = 1.0;
      this.moteUniforms.uIntensity.value = 1.0;
    } else if (envMode === 'sunset') {
      this.dewUniforms.uEnvFactor.value = 1.25; // Hoàng hôn phản chiếu óng ánh
      this.moteUniforms.uIntensity.value = 1.15;
    } else if (envMode === 'night') {
      this.dewUniforms.uEnvFactor.value = 0.65; // Đêm tỏa sáng như đom đóm sương mai
      this.moteUniforms.uIntensity.value = 0.35;
    }
  }

  setEnabled(enabled) {
    this.enabled = !!enabled;
    this.group.visible = this.enabled;
  }

  setIntensity(val) {
    this.intensity = Math.max(0, Math.min(2.0, val));
    this.dewUniforms.uIntensity.value = this.intensity;
    this.moteUniforms.uIntensity.value = this.intensity;
  }
}
