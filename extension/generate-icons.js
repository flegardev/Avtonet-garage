/**
 * Run with: node generate-icons.js
 * Generates PNG icons using the Canvas API (requires node-canvas or a browser).
 *
 * This is a fallback SVG-based icon generator. Copy the SVG content
 * and convert to PNG using an online tool, or use the base64 PNGs below.
 *
 * Alternatively, run this script in a browser console to download PNGs.
 */

const sizes = [16, 48, 128];

function drawIcon(size) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  const s = size;

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, s, s);
  grad.addColorStop(0, '#6366f1');
  grad.addColorStop(1, '#8b5cf6');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.roundRect(0, 0, s, s, s * 0.18);
  ctx.fill();

  // Car body silhouette
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  const m = s * 0.1;
  const bw = s - m * 2;
  const bh = s * 0.28;
  const by = s * 0.42;

  // Car base
  ctx.beginPath();
  ctx.roundRect(m, by, bw, bh, s * 0.05);
  ctx.fill();

  // Car roof
  ctx.beginPath();
  ctx.moveTo(s * 0.28, by);
  ctx.lineTo(s * 0.38, s * 0.28);
  ctx.lineTo(s * 0.62, s * 0.28);
  ctx.lineTo(s * 0.72, by);
  ctx.closePath();
  ctx.fill();

  // Wheels
  ctx.fillStyle = '#6366f1';
  const wr = s * 0.09;
  ctx.beginPath();
  ctx.arc(s * 0.28, by + bh, wr, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(s * 0.72, by + bh, wr, 0, Math.PI * 2);
  ctx.fill();

  return canvas.toDataURL('image/png');
}

// In browser: auto-download
if (typeof document !== 'undefined') {
  sizes.forEach((size) => {
    const dataUrl = drawIcon(size);
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `icon${size}.png`;
    a.click();
  });
  console.log('Icons downloaded!');
}
