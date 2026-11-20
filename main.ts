// news-image-20261120 — "The World in One Day"
// Entry program: copies the pre-rendered poster (entry.png, next to this
// script) to the output directory. No network, no randomness — the output
// is byte-identical on every run.
//
// Run locally with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { copyFileSync, mkdirSync, readFileSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const source = join(here, "entry.png");
const outDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";
const target = join(outDir, "entry.png");

// Read the poster once so we can validate it before copying.
const bytes = readFileSync(source);

// A PNG starts with its 8-byte signature; entry.png must be a real PNG.
const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
if (!bytes.subarray(0, 8).equals(pngSignature)) {
  throw new Error("entry.png is not a PNG file");
}

// The competition gate allows at most 1 MiB and 1024 by 1024 pixels.
// The IHDR chunk carries the width and height as big-endian uint32
// values at byte offsets 16 and 20 of the file.
const width = bytes.readUInt32BE(16);
const height = bytes.readUInt32BE(20);
if (width !== 1024 || height !== 1024) {
  throw new Error(`entry.png is ${width}x${height}, expected 1024x1024`);
}
if (bytes.length > 1048576) {
  throw new Error(`entry.png is ${bytes.length} bytes, over the 1 MiB limit`);
}

mkdirSync(outDir, { recursive: true });
copyFileSync(source, target);

// Confirm the copy landed with the same size and the same bytes.
if (statSync(target).size !== bytes.length) {
  throw new Error("copied entry.png has the wrong size");
}
const written = readFileSync(target);
if (!written.equals(bytes)) {
  throw new Error("copied entry.png differs from the source");
}
const sha256 = createHash("sha256").update(written).digest("hex");
console.log(`wrote ${target} (${bytes.length} bytes, sha256 ${sha256})`);
