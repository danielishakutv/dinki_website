import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const INPUT_DIR  = './images';
const OUTPUT_DIR = './public/images';

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const files = fs.readdirSync(INPUT_DIR);

// Categorize and set optimal sizes
const config = {
  // Hero slider images — large, landscape, used as background
  hero: { width: 1600, height: 900, quality: 80 },
  // Style/product images — medium squares for cards
  style: { width: 600, height: 600, quality: 80 },
  // Tailor portraits — smaller, used in avatars/cards
  tailor: { width: 400, height: 500, quality: 80 },
  // Shoes/accessories — medium squares
  accessory: { width: 500, height: 500, quality: 80 },
  // Auth overlay — tall portrait for side panel
  auth: { width: 800, height: 1000, quality: 80 },
};

function getCategory(filename) {
  if (filename.startsWith('hero-')) return 'hero';
  if (filename.startsWith('agbada-') || filename.startsWith('suit-')) return 'style';
  if (filename.startsWith('tailor-')) return 'tailor';
  if (filename.startsWith('sho') || filename.startsWith('shoe-')) return 'accessory';
  // Hash-named files — sewing machine detail photos, use as style/general
  return 'style';
}

async function optimizeImage(filename) {
  const inputPath  = path.join(INPUT_DIR, filename);
  const category   = getCategory(filename);
  const cfg        = config[category];
  const ext        = path.extname(filename).toLowerCase();
  const baseName   = path.basename(filename, ext);
  const outputName = `${baseName}.webp`;
  const outputPath = path.join(OUTPUT_DIR, outputName);

  try {
    const info = await sharp(inputPath)
      .resize(cfg.width, cfg.height, { fit: 'cover', position: 'centre' })
      .webp({ quality: cfg.quality })
      .toFile(outputPath);

    const origSize = fs.statSync(inputPath).size;
    const savedPct = ((1 - info.size / origSize) * 100).toFixed(1);
    console.log(`✓ ${filename} → ${outputName}  (${(origSize/1024).toFixed(0)}KB → ${(info.size/1024).toFixed(0)}KB, ${savedPct}% smaller)`);
  } catch (err) {
    console.error(`✗ ${filename}: ${err.message}`);
  }
}

console.log(`Optimizing ${files.length} images...\n`);

for (const file of files) {
  await optimizeImage(file);
}

console.log('\nDone! Optimized images saved to public/images/');
