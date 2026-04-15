#!/usr/bin/env node

/**
 * generate-icons.js
 *
 * Generates all required PNG icon sizes from the source SVG.
 * Run: node scripts/generate-icons.js
 *
 * Sharp is available via Next.js (node_modules/sharp).
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SVG_PATH = path.join(ROOT, 'public', 'icons', 'icon.svg');
const OUT_DIR = path.join(ROOT, 'public', 'icons');

async function generate() {
  if (!fs.existsSync(SVG_PATH)) {
    console.error('Source SVG not found:', SVG_PATH);
    process.exit(1);
  }

  const svg = fs.readFileSync(SVG_PATH);

  // Standard icons
  const standardSizes = [16, 32, 180, 192, 512];
  for (const size of standardSizes) {
    const name =
      size === 180
        ? 'apple-touch-icon-180.png'
        : `icon-${size}.png`;
    const outPath = path.join(OUT_DIR, name);
    await sharp(svg).resize(size, size).png().toFile(outPath);
    console.log(`  ✓ ${name}`);
  }

  // Maskable variants: tadpole within central 80% (10% padding on all sides)
  const maskableSizes = [192, 512];
  for (const size of maskableSizes) {
    const contentSize = Math.round(size * 0.8);
    const offset = Math.round(size * 0.1);
    const resizedBuf = await sharp(svg)
      .resize(contentSize, contentSize)
      .png()
      .toBuffer();

    const outPath = path.join(OUT_DIR, `icon-maskable-${size}.png`);
    await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: { r: 10, g: 10, b: 10, alpha: 1 },
      },
    })
      .composite([{ input: resizedBuf, left: offset, top: offset }])
      .png()
      .toFile(outPath);
    console.log(`  ✓ icon-maskable-${size}.png`);
  }

  // Apple touch icon (already covered above as 180, but let's also place at root)
  const appleRoot = path.join(ROOT, 'public', 'apple-touch-icon.png');
  await sharp(svg).resize(180, 180).png().toFile(appleRoot);
  console.log('  ✓ apple-touch-icon.png (root)');

  console.log('\nAll icons generated successfully!');
}

generate().catch((err) => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
