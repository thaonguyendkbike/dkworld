// scripts/generate_favicon.cjs
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="100%" height="100%">
  <defs>
    <!-- Background Gradient: Deep Royal Navy to Vibrant DK Blue -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0a1f44"/>
      <stop offset="60%" stop-color="#184995"/>
      <stop offset="100%" stop-color="#0284c7"/>
    </linearGradient>

    <!-- Leaf Gradient: Fresh Spring Emerald -->
    <linearGradient id="leafGrad" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#15803d"/>
      <stop offset="60%" stop-color="#22c55e"/>
      <stop offset="100%" stop-color="#4ade80"/>
    </linearGradient>

    <!-- Second Leaf Gradient -->
    <linearGradient id="leafGrad2" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#166534"/>
      <stop offset="100%" stop-color="#84cc16"/>
    </linearGradient>

    <!-- Flower Gradient: Delicate Lotus Pink -->
    <linearGradient id="flowerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f472b6"/>
      <stop offset="50%" stop-color="#ec4899"/>
      <stop offset="100%" stop-color="#be185d"/>
    </linearGradient>

    <!-- Soft Drop Shadow -->
    <filter id="dropShadow" x="-15%" y="-15%" width="130%" height="130%">
      <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#000000" flood-opacity="0.32"/>
    </filter>
  </defs>

  <!-- Squircle Base with Metallic Rim -->
  <rect x="4" y="4" width="120" height="120" rx="30" ry="30" fill="url(#bgGrad)" stroke="rgba(255,255,255,0.28)" stroke-width="2" filter="url(#dropShadow)"/>

  <!-- Inner Soft Accent Ring -->
  <rect x="7" y="7" width="114" height="114" rx="27" ry="27" fill="none" stroke="rgba(56,189,248,0.22)" stroke-width="1.5"/>

  <!-- Slanted DK Typography Group (Signature Italic Style matching LogoDKBike.png) -->
  <g transform="translate(18, 38) skewX(-14)" filter="url(#dropShadow)">
    <!-- Letter 'D' -->
    <path d="M 0 52 L 20 0 L 46 0 C 62 0, 71 8, 66 26 C 62 42, 49 52, 33 52 Z M 21 38 L 29 14 L 39 14 C 47 14, 51 18, 49 26 C 47 34, 42 38, 34 38 Z" fill="#ffffff"/>

    <!-- Letter 'K' -->
    <path d="M 58 52 L 72 0 L 87 0 L 73 52 Z M 75 28 L 92 0 L 109 0 L 86 32 Z M 80 26 L 98 52 L 80 52 L 70 36 Z" fill="#ffffff"/>
  </g>

  <!-- Eco Leaf & Flower Accents (Sprouting artistically from the 'DK' letters) -->
  <g transform="translate(74, 18)" filter="url(#dropShadow)">
    <!-- Main Fresh Green Leaf -->
    <path d="M 0 20 C 4 8, 16 0, 32 -2 C 34 14, 26 26, 12 28 C 6 29, 2 26, 0 20 Z" fill="url(#leafGrad)"/>
    <!-- Leaf Center Vein -->
    <path d="M 0 20 Q 14 12 32 -2" fill="none" stroke="#bbf7d0" stroke-width="1.2" stroke-linecap="round"/>

    <!-- Secondary Small Leaf -->
    <path d="M -4 16 C -12 8, -6 -2, 4 0 C 8 8, 4 14, -4 16 Z" fill="url(#leafGrad2)"/>

    <!-- Blossoming 5-Petal Flower -->
    <g transform="translate(4, 2) scale(0.95)">
      <!-- Petals -->
      <circle cx="0" cy="-6" r="4.2" fill="url(#flowerGrad)"/>
      <circle cx="5.7" cy="-1.8" r="4.2" fill="url(#flowerGrad)"/>
      <circle cx="3.5" cy="4.8" r="4.2" fill="url(#flowerGrad)"/>
      <circle cx="-3.5" cy="4.8" r="4.2" fill="url(#flowerGrad)"/>
      <circle cx="-5.7" cy="-1.8" r="4.2" fill="url(#flowerGrad)"/>
      <!-- Flower Center (Golden Stamen) -->
      <circle cx="0" cy="0" r="3.2" fill="#facc15" stroke="#fef08a" stroke-width="0.8"/>
    </g>
  </g>
</svg>
`;

// Save public/favicon.svg
const publicDir = path.join(__dirname, '../public');
fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgContent, 'utf8');
console.log('Successfully generated public/favicon.svg');

// Generate 64x64 PNG Favicon directly using raw RGBA buffer & PNG encoder
const W = 64;
const H = 64;
const rgba = Buffer.alloc(W * H * 4);

// Function to blend pixel
function setPixel(x, y, r, g, b, a) {
  if (x < 0 || x >= W || y < 0 || y >= H) return;
  const idx = (y * W + x) * 4;
  const srcA = a / 255;
  const dstA = rgba[idx + 3] / 255;
  const outA = srcA + dstA * (1 - srcA);
  if (outA > 0) {
    rgba[idx] = Math.round((r * srcA + rgba[idx] * dstA * (1 - srcA)) / outA);
    rgba[idx + 1] = Math.round((g * srcA + rgba[idx + 1] * dstA * (1 - srcA)) / outA);
    rgba[idx + 2] = Math.round((b * srcA + rgba[idx + 2] * dstA * (1 - srcA)) / outA);
    rgba[idx + 3] = Math.round(outA * 255);
  }
}

// 1. Draw rounded squircle background
const cornerR = 14;
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    // Distance from rounded box
    const dx = Math.max(0, Math.abs(x - 31.5) - (31.5 - cornerR));
    const dy = Math.max(0, Math.abs(y - 31.5) - (31.5 - cornerR));
    const dist = Math.hypot(dx, dy);
    if (dist <= cornerR) {
      const edge = Math.min(1.0, Math.max(0.0, cornerR + 0.5 - dist));
      // Gradient blue
      const t = (x + y) / (W + H);
      const r = Math.round(10 * (1 - t) + 2 * t);
      const g = Math.round(31 * (1 - t) + 132 * t);
      const b = Math.round(68 * (1 - t) + 199 * t);
      setPixel(x, y, r, g, b, Math.round(255 * edge));
    }
  }
}

// 2. Sample DK letters from LogoDKBike.png into the 64x64 buffer
const logoBuf = fs.readFileSync(path.join(publicDir, 'LogoDKBike.png'));
let pos = 8, logoW = 0, logoH = 0;
const idatChunks = [];
while (pos < logoBuf.length) {
  const len = logoBuf.readUInt32BE(pos);
  const type = logoBuf.slice(pos + 4, pos + 8).toString('ascii');
  if (type === 'IHDR') {
    logoW = logoBuf.readUInt32BE(pos + 8);
    logoH = logoBuf.readUInt32BE(pos + 12);
  } else if (type === 'IDAT') {
    idatChunks.push(logoBuf.slice(pos + 8, pos + 8 + len));
  }
  pos += 12 + len;
}
const logoRaw = zlib.inflateSync(Buffer.concat(idatChunks));
const stride = 1 + logoW * 4;
const logoRgba = Buffer.alloc(logoW * logoH * 4);
for (let y = 0; y < logoH; y++) {
  const filter = logoRaw[y * stride];
  const srcRow = y * stride + 1;
  const dstRow = y * logoW * 4;
  for (let x = 0; x < logoW * 4; x++) {
    let val = logoRaw[srcRow + x];
    const a = x >= 4 ? logoRgba[dstRow + x - 4] : 0;
    const b = y > 0 ? logoRgba[(y - 1) * logoW * 4 + x] : 0;
    const c = (x >= 4 && y > 0) ? logoRgba[(y - 1) * logoW * 4 + x - 4] : 0;
    if (filter === 1) val = (val + a) & 0xff;
    else if (filter === 2) val = (val + b) & 0xff;
    else if (filter === 3) val = (val + Math.floor((a + b) / 2)) & 0xff;
    else if (filter === 4) {
      const p = a + b - c;
      const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
      let pr = (pa <= pb && pa <= pc) ? a : ((pb <= pc) ? b : c);
      val = (val + pr) & 0xff;
    }
    logoRgba[dstRow + x] = val;
  }
}

// Bbox of DK: x from 88 to 531, y from 138 to 316
const dkW = 531 - 88;
const dkH = 316 - 138;
// Target in 64x64: fit into width 46, height 26, centered at x = 9, y = 24
const targetW = 46;
const targetH = Math.round(targetW * (dkH / dkW));
const offsetX = 9;
const offsetY = 25;

for (let dy = 0; dy < targetH; dy++) {
  for (let dx = 0; dx < targetW; dx++) {
    const srcX = Math.round(88 + (dx / targetW) * dkW);
    const srcY = Math.round(138 + (dy / targetH) * dkH);
    const sIdx = (srcY * logoW + srcX) * 4;
    const alpha = logoRgba[sIdx + 3];
    if (alpha > 40) {
      // Draw white DK letter
      const brightness = (logoRgba[sIdx] + logoRgba[sIdx + 1] + logoRgba[sIdx + 2]) / 3;
      // In logo, text is dark blue. Invert to brilliant crisp white
      setPixel(offsetX + dx, offsetY + dy, 255, 255, 255, alpha);
    }
  }
}

// 3. Draw green leaf & blooming pink flower in top-right corner
// Green leaf: ellipse centered at (45, 15)
for (let y = 6; y < 24; y++) {
  for (let x = 36; x < 58; x++) {
    const lx = (x - 46) * 0.85 + (y - 14) * 0.52;
    const ly = -(x - 46) * 0.52 + (y - 14) * 0.85;
    if ((lx * lx) / 50 + (ly * ly) / 12 <= 1.0) {
      setPixel(x, y, 34, 197, 94, 255); // Emerald Green
    }
  }
}
// Flower at (39, 13): 5 pink petals
const petals = [
  [0, -4], [3.8, -1.2], [2.4, 3.2], [-2.4, 3.2], [-3.8, -1.2]
];
petals.forEach(([px, py]) => {
  for (let y = 7; y < 20; y++) {
    for (let x = 33; x < 46; x++) {
      if (Math.hypot(x - (39 + px), y - (13 + py)) <= 2.6) {
        setPixel(x, y, 244, 114, 182, 255); // Pink
      }
    }
  }
});
// Flower golden center
for (let y = 11; y <= 15; y++) {
  for (let x = 37; x <= 41; x++) {
    if (Math.hypot(x - 39, y - 13) <= 2.1) {
      setPixel(x, y, 250, 204, 21, 255); // Gold
    }
  }
}

// PNG ENCODER
function writePNG(rgbaBuf, width, height) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  
  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8-bit
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; // Deflate
  ihdr[11] = 0; // Filter 0
  ihdr[12] = 0; // No interlace
  
  // IDAT raw scanlines with filter 0 (None)
  const rawData = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    rawData[y * (1 + width * 4)] = 0; // Filter 0
    rgbaBuf.copy(rawData, y * (1 + width * 4) + 1, y * width * 4, (y + 1) * width * 4);
  }
  const compressed = zlib.deflateSync(rawData);
  
  function makeChunk(type, data) {
    const chunk = Buffer.alloc(12 + data.length);
    chunk.writeUInt32BE(data.length, 0);
    chunk.write(type, 4);
    data.copy(chunk, 8);
    const crc = crc32(chunk.slice(4, 8 + data.length));
    chunk.writeUInt32BE(crc, 8 + data.length);
    return chunk;
  }
  
  function crc32(buf) {
    let c = ~0;
    for (let i = 0; i < buf.length; i++) {
      c ^= buf[i];
      for (let k = 0; k < 8; k++) {
        c = (c >>> 1) ^ (-(c & 1) & 0xedb88320);
      }
    }
    return ~c >>> 0;
  }
  
  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));
  
  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const pngBuf = writePNG(rgba, W, H);
fs.writeFileSync(path.join(publicDir, 'favicon.png'), pngBuf);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), pngBuf);
console.log('Successfully generated public/favicon.png and apple-touch-icon.png');

// Update index.html to include favicon links
const indexPath = path.join(__dirname, '../index.html');
let indexHtml = fs.readFileSync(indexPath, 'utf8');
if (!indexHtml.includes('rel="icon"')) {
  indexHtml = indexHtml.replace(
    '<head>',
    '<head>\\n    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />\\n    <link rel="alternate icon" type="image/png" href="/favicon.png" />\\n    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />'
  );
  fs.writeFileSync(indexPath, indexHtml, 'utf8');
  console.log('Updated index.html with favicon links');
} else {
  console.log('index.html already contains favicon links');
}
