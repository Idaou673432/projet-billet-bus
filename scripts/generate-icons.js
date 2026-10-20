import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. Create clean SVG icon for AFRIWAY
const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" rx="100" fill="#059669"/>
  <!-- Bus Body -->
  <rect x="96" y="110" width="320" height="260" rx="40" fill="#0f172a" stroke="#ffffff" stroke-width="12"/>
  <!-- Windshield -->
  <rect x="136" y="150" width="240" height="90" rx="16" fill="#38bdf8"/>
  <!-- Destination sign -->
  <rect x="176" y="125" width="160" height="18" rx="6" fill="#fbbf24"/>
  <!-- Headlights -->
  <circle cx="156" cy="310" r="20" fill="#fef08a"/>
  <circle cx="356" cy="310" r="20" fill="#fef08a"/>
  <!-- Grille / Bumper -->
  <rect x="216" y="300" width="80" height="22" rx="6" fill="#475569"/>
  <!-- QR Scan Beam Accent -->
  <line x1="120" y1="200" x2="392" y2="200" stroke="#10b981" stroke-width="6" stroke-dasharray="10 8"/>
  <!-- Wheels -->
  <rect x="126" y="370" width="60" height="32" rx="10" fill="#020617"/>
  <rect x="326" y="370" width="60" height="32" rx="10" fill="#020617"/>
  <!-- Afriway Text / Badge -->
  <text x="256" y="460" font-family="Arial, sans-serif" font-size="44" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="4">AFRIWAY</text>
</svg>`;

fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgIcon);
fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgIcon);

// 2. Helper to generate valid PNG buffer without external native deps
function createPng(width, height, r, g, b) {
  // Simple valid PNG generator with solid color and inner rounded rectangle
  const bytesPerPixel = 4;
  const scanlineLength = width * bytesPerPixel;
  const rawData = Buffer.alloc((scanlineLength + 1) * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * (scanlineLength + 1);
    rawData[rowOffset] = 0; // Filter type 0: None

    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * bytesPerPixel;
      
      // Determine color: border / background / accent
      const margin = Math.round(width * 0.1);
      const isCard = x >= margin && x <= width - margin && y >= margin && y <= height - margin;
      
      if (isCard) {
        // Emerald / Slate Bus logo styling
        rawData[pixelOffset] = 15;     // R
        rawData[pixelOffset + 1] = 23;  // G
        rawData[pixelOffset + 2] = 42;  // B
        rawData[pixelOffset + 3] = 255; // A
      } else {
        // Emerald Background
        rawData[pixelOffset] = r;
        rawData[pixelOffset + 1] = g;
        rawData[pixelOffset + 2] = b;
        rawData[pixelOffset + 3] = 255;
      }
    }
  }

  const deflated = zlib.deflateSync(rawData);

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR Chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth: 8
  ihdr[9] = 6; // Color type: 6 (RGBA)
  ihdr[10] = 0; // Compression: 0
  ihdr[11] = 0; // Filter: 0
  ihdr[12] = 0; // Interlace: 0

  function makeChunk(type, data) {
    const len = data.length;
    const buf = Buffer.alloc(4 + 4 + len + 4);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4, 4, 'ascii');
    data.copy(buf, 8);
    // CRC calculation
    const crc = crc32(buf.subarray(4, 8 + len));
    buf.writeUInt32BE(crc, 8 + len);
    return buf;
  }

  // Simple CRC32 implementation
  function crc32(buf) {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      c ^= buf[i];
      for (let j = 0; j < 8; j++) {
        c = (c >>> 1) ^ ((c & 1) ? 0xedb88320 : 0);
      }
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', deflated);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Generate required sizes: 192x192, 512x512, apple-touch-icon 180x180
const png192 = createPng(192, 192, 5, 150, 105);
const png512 = createPng(512, 512, 5, 150, 105);
const pngApple = createPng(180, 180, 5, 150, 105);

fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), png192);
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), png512);
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), png512);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), pngApple);
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), pngApple);

console.log('Successfully generated PWA icons in /public');
