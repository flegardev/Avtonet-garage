/**
 * Node.js icon generator — no browser / canvas required.
 * Run: node generate-icons-node.js
 * Outputs PNG icons to src/icons/ and dist/icons/
 */

'use strict';
const fs   = require('fs');
const path = require('path');
const zlib = require('zlib');

// ── CRC32 ──────────────────────────────────────────────────────────────────
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const t = Buffer.from(type, 'ascii');
  const d = Buffer.isBuffer(data) ? data : Buffer.from(data);
  const len = Buffer.allocUnsafe(4); len.writeUInt32BE(d.length);
  const crcBuf = Buffer.allocUnsafe(4); crcBuf.writeUInt32BE(crc32(Buffer.concat([t, d])));
  return Buffer.concat([len, t, d, crcBuf]);
}

// ── Drawing helpers ────────────────────────────────────────────────────────
function setPixel(buf, W, x, y, r, g, b, a = 255) {
  x = Math.round(x); y = Math.round(y);
  if (x < 0 || x >= W || y < 0 || y >= W) return;
  const i = (y * W + x) * 4;
  buf[i] = r; buf[i+1] = g; buf[i+2] = b; buf[i+3] = a;
}

function fillRect(buf, W, x0, y0, w, h, r, g, b, a = 255) {
  for (let y = y0; y < y0 + h; y++)
    for (let x = x0; x < x0 + w; x++)
      setPixel(buf, W, x, y, r, g, b, a);
}

function fillCircle(buf, W, cx, cy, radius, r, g, b, a = 255) {
  const r2 = radius * radius;
  for (let y = Math.floor(cy - radius); y <= Math.ceil(cy + radius); y++)
    for (let x = Math.floor(cx - radius); x <= Math.ceil(cx + radius); x++) {
      const dx = x - cx, dy = y - cy;
      if (dx*dx + dy*dy <= r2) setPixel(buf, W, x, y, r, g, b, a);
    }
}

// ── Build icon pixels ──────────────────────────────────────────────────────
function buildPixels(S) {
  const buf = Buffer.alloc(S * S * 4, 0);

  // 1. Rounded-rect background  (#6366f1 → #8b5cf6 diagonal gradient)
  const r1 = S * 0.18; // corner radius
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const i = (y * S + x) * 4;
      const t = (x + y) / (S * 2);
      const R = Math.round(0x63 + t * (0x8b - 0x63));
      const G = Math.round(0x66 + t * (0x5c - 0x66));
      const B = Math.round(0xf1 + t * (0xf6 - 0xf1));

      // Rounded corner clipping
      const cx = x < r1 ? r1 : x > S - 1 - r1 ? S - 1 - r1 : x;
      const cy = y < r1 ? r1 : y > S - 1 - r1 ? S - 1 - r1 : y;
      const dx = x - cx, dy = y - cy;
      if (dx*dx + dy*dy > r1*r1) continue; // outside rounded corner

      buf[i] = R; buf[i+1] = G; buf[i+2] = B; buf[i+3] = 255;
    }
  }

  // 2. White car silhouette (proportional to S)
  const m  = S * 0.10;  // margin
  const bx = m;
  const bw = S - m * 2;
  const bh = S * 0.25;
  const by = S * 0.46;
  const wr = S * 0.10;   // wheel radius
  const wy = by + bh - wr * 0.4; // wheel Y

  // Car body rectangle
  fillRect(buf, S, Math.round(bx), Math.round(by), Math.round(bw), Math.round(bh), 255, 255, 255);

  // Car cabin / roof (trapezoid → two filled triangles + a rect)
  const cabinLeft  = S * 0.27;
  const cabinRight = S * 0.73;
  const cabinTop   = S * 0.27;
  for (let py = Math.round(cabinTop); py < Math.round(by); py++) {
    const progress = (py - cabinTop) / (by - cabinTop); // 0 at top, 1 at bottom
    const xl = Math.round(cabinLeft  + (bx             - cabinLeft)  * (1 - progress));
    const xr = Math.round(cabinRight + (bx + bw - 1    - cabinRight) * (1 - progress));
    for (let px = xl; px <= xr; px++) setPixel(buf, S, px, py, 255, 255, 255);
  }

  // Windshield gap (dark)
  const wgL = Math.round(S * 0.31), wgR = Math.round(S * 0.49);
  const wgT = Math.round(S * 0.30), wgB = Math.round(by - 1);
  for (let py = wgT; py <= wgB; py++) {
    const prog = (py - wgT) / Math.max(1, wgB - wgT);
    const xl = Math.round(wgL + (S * 0.285 - wgL) * (1 - prog));
    const xr = Math.round(wgR + (S * 0.47  - wgR) * (1 - prog));
    for (let px = xl; px <= xr; px++) setPixel(buf, S, px, py, 0x63, 0x66, 0xf1);
  }

  // Rear window gap (dark)
  const rwL = Math.round(S * 0.52), rwR = Math.round(S * 0.70);
  const rwT = Math.round(S * 0.30), rwB = Math.round(by - 1);
  for (let py = rwT; py <= rwB; py++) {
    const prog = (py - rwT) / Math.max(1, rwB - rwT);
    const xl = Math.round(rwL + (S * 0.535 - rwL) * (1 - prog));
    const xr = Math.round(rwR + (S * 0.715 - rwR) * (1 - prog));
    for (let px = xl; px <= xr; px++) setPixel(buf, S, px, py, 0x63, 0x66, 0xf1);
  }

  // Wheels (purple circles inside white)
  const wxL = bx + bw * 0.22;
  const wxR = bx + bw * 0.78;
  fillCircle(buf, S, wxL, wy, wr, 255, 255, 255);
  fillCircle(buf, S, wxR, wy, wr, 255, 255, 255);
  fillCircle(buf, S, wxL, wy, wr * 0.5, 0x63, 0x66, 0xf1);
  fillCircle(buf, S, wxR, wy, wr * 0.5, 0x63, 0x66, 0xf1);

  return buf;
}

// ── Encode PNG ─────────────────────────────────────────────────────────────
function encodePNG(S, pixels) {
  const rows = [];
  for (let y = 0; y < S; y++) {
    rows.push(0); // filter: None
    for (let x = 0; x < S; x++) {
      const i = (y * S + x) * 4;
      rows.push(pixels[i], pixels[i+1], pixels[i+2], pixels[i+3]);
    }
  }
  const compressed = zlib.deflateSync(Buffer.from(rows));

  const ihdr = Buffer.allocUnsafe(13);
  ihdr.writeUInt32BE(S, 0); ihdr.writeUInt32BE(S, 4);
  ihdr[8] = 8; ihdr[9] = 6; // RGBA
  ihdr[10] = ihdr[11] = ihdr[12] = 0;

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ── Main ───────────────────────────────────────────────────────────────────
const SIZES   = [16, 32, 48, 128];
const OUT_DIRS = [
  path.join(__dirname, 'src', 'icons'),
  path.join(__dirname, 'dist', 'icons'),
];

OUT_DIRS.forEach((d) => fs.mkdirSync(d, { recursive: true }));

SIZES.forEach((S) => {
  const png = encodePNG(S, buildPixels(S));
  OUT_DIRS.forEach((d) => {
    const dest = path.join(d, `icon${S}.png`);
    fs.writeFileSync(dest, png);
    console.log('Written:', dest);
  });
});

console.log('Done! Icons generated in src/icons/ and dist/icons/');
