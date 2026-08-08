#!/usr/bin/env node
/**
 * Regenerates the favicon set and the compressed logo from the source artwork.
 *
 * The outputs are committed, so this only needs running when the artwork
 * changes. sharp is not a project dependency — it is a native module that
 * would be installed on every CI run and every clone for something used about
 * once a year. Install it on demand:
 *
 *     npm install --no-save sharp
 *     node scripts/make-icons.mjs
 *
 * Source: the bot repo's assets/logo/logo.png (724x724).
 */
import sharp from "sharp";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { statSync } from "node:fs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = join(root, "web", "public");
const source = join(publicDir, "syntaxx-logo.png");

// 16/32 for browser tabs, 180 for iOS home screens, 192/512 for Android and
// the PWA manifest — the set the original export's markup asked for.
const icons = [
  ["favicon-16x16.png", 16],
  ["favicon-32x32.png", 32],
  ["apple-touch-icon.png", 180],
  ["android-chrome-192x192.png", 192],
  ["android-chrome-512x512.png", 512],
];

const kb = (p) => `${(statSync(p).size / 1024).toFixed(1)} KB`;

for (const [name, size] of icons) {
  const out = join(publicDir, name);
  await sharp(source).resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9, palette: true })
    .toFile(out);
  console.log(`${name.padEnd(30)} ${size}x${size}  ${kb(out)}`);
}

// The logo itself is displayed at well under 512px anywhere on the site, and
// shipped at 724x724 uncompressed on every page.
const logoOut = join(publicDir, "syntaxx-logo.png");
const before = statSync(logoOut).size;
const buffer = await sharp(source).resize(512, 512, { fit: "inside" })
  .png({ compressionLevel: 9, quality: 90 })
  .toBuffer();
await sharp(buffer).toFile(logoOut);
console.log(
  `\nsyntaxx-logo.png  ${(before / 1024).toFixed(1)} KB -> ${kb(logoOut)} (724x724 -> 512x512)`,
);
