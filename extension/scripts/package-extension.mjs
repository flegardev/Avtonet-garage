#!/usr/bin/env node
// Cross-platform packager for AvtoNetGaraža. Zips the webpack `dist/` output
// into a Chrome Web Store ZIP using only Node built-ins (zlib). Forward-slash
// entry names (Chrome requirement) — unlike PowerShell Compress-Archive, which
// emits backslash entries on Windows. Replaces package-extension.ps1.
//
// Usage: npm run build && node scripts/package-extension.mjs

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { deflateRawSync } from 'node:zlib';
import { dirname, join, resolve, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');

if (!existsSync(DIST)) {
  console.error(`Build output not found at '${DIST}'. Run "npm run build" first.`);
  process.exit(1);
}

const { version } = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
const out = join(DIST, `avtonet-garaza-${version}.zip`);

function walk(dir) {
  const files = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) files.push(...walk(full));
    else files.push(full);
  }
  return files;
}

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function buildZip(entries) {
  const locals = [];
  const central = [];
  let offset = 0;
  for (const { name, data } of entries) {
    const nameBuf = Buffer.from(name, 'utf8');
    const crc = crc32(data);
    const deflated = deflateRawSync(data, { level: 9 });
    const store = deflated.length >= data.length;
    const method = store ? 0 : 8;
    const body = store ? data : deflated;

    const lf = Buffer.alloc(30);
    lf.writeUInt32LE(0x04034b50, 0);
    lf.writeUInt16LE(20, 4);
    lf.writeUInt16LE(0, 6);
    lf.writeUInt16LE(method, 8);
    lf.writeUInt16LE(0, 10);
    lf.writeUInt16LE(0x21, 12);
    lf.writeUInt32LE(crc, 14);
    lf.writeUInt32LE(body.length, 18);
    lf.writeUInt32LE(data.length, 22);
    lf.writeUInt16LE(nameBuf.length, 26);
    lf.writeUInt16LE(0, 28);
    locals.push(lf, nameBuf, body);

    const cd = Buffer.alloc(46);
    cd.writeUInt32LE(0x02014b50, 0);
    cd.writeUInt16LE(20, 4);
    cd.writeUInt16LE(20, 6);
    cd.writeUInt16LE(0, 8);
    cd.writeUInt16LE(method, 10);
    cd.writeUInt16LE(0, 12);
    cd.writeUInt16LE(0x21, 14);
    cd.writeUInt32LE(crc, 16);
    cd.writeUInt32LE(body.length, 20);
    cd.writeUInt32LE(data.length, 24);
    cd.writeUInt16LE(nameBuf.length, 28);
    cd.writeUInt16LE(0, 30);
    cd.writeUInt16LE(0, 32);
    cd.writeUInt16LE(0, 34);
    cd.writeUInt16LE(0, 36);
    cd.writeUInt32LE(0, 38);
    cd.writeUInt32LE(offset, 42);
    central.push(cd, nameBuf);
    offset += lf.length + nameBuf.length + body.length;
  }
  const centralBuf = Buffer.concat(central);
  const localBuf = Buffer.concat(locals);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(centralBuf.length, 12);
  eocd.writeUInt32LE(localBuf.length, 16);
  return Buffer.concat([localBuf, centralBuf, eocd]);
}

const entries = walk(DIST).filter(full => !full.endsWith('.zip'))
  .map((full) => ({
    name: relative(DIST, full).split(sep).join('/'),
    data: readFileSync(full),
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

const zip = buildZip(entries);
writeFileSync(out, zip);
const sha = createHash('sha256').update(zip).digest('hex');
console.log(`Packaged extension: ${out} (${zip.length} bytes, ${entries.length} files)`);
console.log(`SHA256 ${sha}`);
