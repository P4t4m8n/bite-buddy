import { mkdirSync } from "node:fs";
import { join } from "node:path";

import sharp from "sharp";

// Generates the PWA icons in public/icons from one SVG design.
// Usage: npm run icons

const OUT_DIR = join(process.cwd(), "public", "icons");
const BRAND = "#15803d";

/** A bowl with a leaf. `padding` shrinks the artwork for maskable icons (safe zone). */
const svg = (size: number, { padding = 0.18, rounded = true } = {}) => {
  const inner = size * (1 - padding * 2);
  const offset = size * padding;
  const s = inner / 100;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${rounded ? size * 0.22 : 0}" fill="${BRAND}"/>
  <g transform="translate(${offset} ${offset}) scale(${s})" fill="none" stroke="#ffffff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round">
    <path d="M10 52h80a40 40 0 0 1-80 0z" fill="#ffffff" fill-opacity="0.15"/>
    <path d="M30 92h40"/>
    <path d="M50 52c0-18 8-30 26-36-2 18-10 30-26 36z" fill="#ffffff" fill-opacity="0.9" stroke-width="5"/>
    <path d="M42 52c-4-10-12-16-24-18 2 10 10 16 24 18z" fill="#ffffff" fill-opacity="0.6" stroke-width="5"/>
  </g>
</svg>`;
};

const ICONS = [
  { file: "icon-192.png", size: 192 },
  { file: "icon-512.png", size: 512 },
  { file: "apple-touch-icon.png", size: 180, options: { rounded: false } },
  { file: "maskable-512.png", size: 512, options: { padding: 0.26, rounded: false } },
];

mkdirSync(OUT_DIR, { recursive: true });
for (const { file, size, options } of ICONS) {
  await sharp(Buffer.from(svg(size, options)))
    .png()
    .toFile(join(OUT_DIR, file));
  console.log(`wrote public/icons/${file}`);
}
