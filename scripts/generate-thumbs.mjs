// frontend/scripts/generate-thumbs.mjs
import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

const PHOTOS_DIR = path.join(process.cwd(), 'public', 'photos');

const SIZES = [
  { name: 'thumb', width: 400 },
  { name: 'medium', width: 800 },
  // optionally add more sizes
];

async function ensureDir(dir) {
  try { await fs.mkdir(dir, { recursive: true }); } catch {}
}

async function processImage(file) {
  const ext = path.extname(file).toLowerCase();
  const basename = path.basename(file, ext);
  const srcPath = path.join(PHOTOS_DIR, file);

  for (const s of SIZES) {
    const outName = `${basename}-${s.name}.webp`;
    const outPath = path.join(PHOTOS_DIR, outName);
    // generate webp resized version
    await sharp(srcPath)
      .resize({ width: s.width })
      .webp({ quality: 80 })
      .toFile(outPath);
  }
}

async function main() {
  await ensureDir(PHOTOS_DIR);
  const files = await fs.readdir(PHOTOS_DIR);
  const images = files.filter(f => /\.(jpe?g|png|webp|gif)$/i.test(f) && !/-thumb|-medium/.test(f));
  for (const img of images) {
    try { await processImage(img); console.log('Processed', img); }
    catch (e) { console.error('Error processing', img, e); }
  }

  // regenerate list.json (only original filenames)
  const outputList = images;
  await fs.writeFile(path.join(PHOTOS_DIR, 'list.json'), JSON.stringify(outputList, null, 2), 'utf8');
  console.log('Wrote list.json');
}

main().catch(e => { console.error(e); process.exit(1); });
