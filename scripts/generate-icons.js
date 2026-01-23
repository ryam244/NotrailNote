#!/usr/bin/env node
/**
 * Generate app icons from SVG files
 * Run with: node scripts/generate-icons.js
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, '..', 'assets');

// Icon configurations
const icons = [
  {
    name: 'icon.png',
    svgPath: path.join(assetsDir, 'icon.svg'),
    width: 1024,
    height: 1024,
    background: null, // SVG has its own background
  },
  {
    name: 'adaptive-icon.png',
    svgPath: path.join(assetsDir, 'adaptive-icon.svg'),
    width: 1024,
    height: 1024,
    background: null, // Background color is set in app.json
  },
  {
    name: 'splash-icon.png',
    svgPath: path.join(assetsDir, 'splash-icon.svg'),
    width: 200,
    height: 200,
    background: null, // Transparent, background color is in app.json
  },
  {
    name: 'favicon.png',
    svgPath: path.join(assetsDir, 'favicon.svg'),
    width: 48,
    height: 48,
    background: null,
  },
];

async function generateIcons() {
  console.log('Generating app icons...\n');

  for (const icon of icons) {
    try {
      const svgContent = fs.readFileSync(icon.svgPath, 'utf8');
      const outputPath = path.join(assetsDir, icon.name);

      await sharp(Buffer.from(svgContent))
        .resize(icon.width, icon.height)
        .png()
        .toFile(outputPath);

      console.log(`✓ Generated ${icon.name} (${icon.width}x${icon.height})`);
    } catch (error) {
      console.error(`✗ Failed to generate ${icon.name}:`, error.message);
    }
  }

  console.log('\nDone! Icons saved to assets/ directory.');
}

generateIcons();
