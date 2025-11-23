// frontend/scripts/generate-all.mjs
// Generate thumbnails + medium-size images AND list.json with stable IDs and categories.
// Usage:
//   node scripts/generate-all.mjs        -> run once
//   node scripts/generate-all.mjs --watch -> watch photos folder and regenerate on changes
//
// Requirements: node 18+ and `sharp` installed in frontend (npm install --save-dev sharp)

import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import os from 'os';
import sharp from 'sharp';

const ROOT = process.cwd();
const PHOTOS_ROOT = path.join(ROOT, 'public', 'photos');
const OUT_JSON = path.join(PHOTOS_ROOT, 'list.json');
const WATCH = process.argv.includes('--watch');

// Output sizes (you can tune)
const THUMB_W = 600;   // for gallery thumb
const MED_W = 1400;    // for medium/full preview (still optimized)

// Image extensions we accept
const IMAGE_EXT = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.tiff', '.avif'];

// Ensure directory exists
async function ensure(dir) {
  try { await fsp.mkdir(dir, { recursive: true }); } catch (e) {}
}

// Utility: list files and categories
async function scanPhotos() {
  await ensure(PHOTOS_ROOT);
  const entries = await fsp.readdir(PHOTOS_ROOT, { withFileTypes: true });

  // detect category folders (directories), otherwise treat root files as 'UNCATEGORIZED'
  const categories = entries.filter(e => e.isDirectory()).map(d => d.name);
  const items = [];

  if (categories.length) {
    for (const cat of categories) {
      const dir = path.join(PHOTOS_ROOT, cat);
      const files = await fsp.readdir(dir, { withFileTypes: true });
      for (const f of files) {
        if (!f.isFile()) continue;
        const ext = path.extname(f.name).toLowerCase();
        if (!IMAGE_EXT.includes(ext)) continue;
        items.push({
          filename: f.name,
          category: cat,
          absPath: path.join(dir, f.name),
          relDir: `/photos/${cat}`
        });
      }
    }
  } else {
    // no subfolders -> scan root
    for (const e of entries) {
      if (!e.isFile()) continue;
      const ext = path.extname(e.name).toLowerCase();
      if (!IMAGE_EXT.includes(ext)) continue;
      items.push({
        filename: e.name,
        category: 'UNCATEGORIZED',
        absPath: path.join(PHOTOS_ROOT, e.name),
        relDir: `/photos`
      });
    }
  }

  // deterministic sort: category then filename (numeric-aware)
  items.sort((a, b) => {
    if (a.category === b.category) return a.filename.localeCompare(b.filename, undefined, { numeric: true });
    return a.category.localeCompare(b.category);
  });

  return items;
}

// Generate outputs for one image
async function processImage(item, idx) {
  const { filename, category, absPath, relDir } = item;
  const ext = path.extname(filename);
  const base = filename.replace(/\.[^.]+$/, '');
  const thumbName = `${base}-thumb.webp`;
  const medName = `${base}-med.webp`;

  const thumbOut = path.join(path.dirname(absPath), thumbName);
  const medOut = path.join(path.dirname(absPath), medName);

  // Generate thumb if not exists or source newer
  try {
    const srcStat = await fsp.stat(absPath);
    let doThumb = true;
    try {
      const thumbStat = await fsp.stat(thumbOut);
      if (thumbStat.mtimeMs >= srcStat.mtimeMs) doThumb = false;
    } catch {}
    if (doThumb) {
      await sharp(absPath)
        .rotate()
        .resize({ width: THUMB_W, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(thumbOut);
      console.log(`thumb -> ${path.relative(ROOT, thumbOut)}`);
    }
  } catch (e) {
    console.error('thumb error', filename, e.message || e);
  }

  // Generate medium
  try {
    const srcStat = await fsp.stat(absPath);
    let doMed = true;
    try {
      const medStat = await fsp.stat(medOut);
      if (medStat.mtimeMs >= srcStat.mtimeMs) doMed = false;
    } catch {}
    if (doMed) {
      await sharp(absPath)
        .rotate()
        .resize({ width: MED_W, withoutEnlargement: true })
        .webp({ quality: 88 })
        .toFile(medOut);
      console.log(`medium -> ${path.relative(ROOT, medOut)}`);
    }
  } catch (e) {
    console.error('med error', filename, e.message || e);
  }

  return {
    filename,
    category,
    url: `${relDir}/${filename}`,
    thumb: `${relDir}/${thumbName}`,
    medium: `${relDir}/${medName}`
  };
}

async function generateOnce() {
  console.log('Scanning photos folder...', PHOTOS_ROOT);
  const items = await scanPhotos();

  const out = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    try {
      const meta = await processImage(item, i);
      out.push({
        id: String(i + 1),
        filename: meta.filename,
        category: meta.category,
        url: meta.url,
        thumb: meta.thumb,
        medium: meta.medium
      });
    } catch (e) {
      console.warn('failed processing', item.filename, e.message || e);
    }
  }

  // write list.json
  await ensure(PHOTOS_ROOT);
  await fsp.writeFile(OUT_JSON, JSON.stringify(out, null, 2), 'utf8');
  console.log(`Wrote ${OUT_JSON} (${out.length} items)`);
  return out;
}

let pending = false;
let lastTimeout = null;
async function runAndDebounce() {
  if (pending) return;
  pending = true;
  if (lastTimeout) clearTimeout(lastTimeout);
  lastTimeout = setTimeout(async () => {
    try {
      await generateOnce();
    } catch (e) {
      console.error('generate error', e);
    } finally {
      pending = false;
    }
  }, 250);
}

async function main() {
  await ensure(PHOTOS_ROOT);
  await generateOnce();

  if (WATCH) {
    console.log('Watching', PHOTOS_ROOT, 'for changes (recursive)...');
    fs.watch(PHOTOS_ROOT, { recursive: true }, (ev, fn) => {
      if (!fn) return;
      console.log('change detected', ev, fn);
      runAndDebounce();
    });
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
