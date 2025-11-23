// frontend/scripts/generate-list.js
// ESM (package.json should have "type":"module")
// Usage:
//   node scripts/generate-list.js        -> generate once
//   node scripts/generate-list.js --watch -> watch and regenerate

import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';

const ROOT = process.cwd();
const PHOTOS_ROOT = path.join(ROOT, 'public', 'photos');
const OUT = path.join(PHOTOS_ROOT, 'list.json');
const WATCH = process.argv.includes('--watch');
const IMAGE_EXT = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'];

async function scanOnce() {
  // ensure folder exists
  await fsp.mkdir(PHOTOS_ROOT, { recursive: true });

  const categories = [];
  const items = [];

  const entries = await fsp.readdir(PHOTOS_ROOT, { withFileTypes: true });
  // detect subfolders as categories
  for (const e of entries) {
    if (e.isDirectory()) categories.push(e.name);
  }

  if (categories.length > 0) {
    // scan per-category
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
          url: `/photos/${cat}/${f.name}`
        });
      }
    }
  } else {
    // no subfolders — scan root photos folder
    for (const f of entries) {
      if (!f.isFile()) continue;
      const ext = path.extname(f.name).toLowerCase();
      if (!IMAGE_EXT.includes(ext)) continue;
      items.push({
        filename: f.name,
        category: 'uncategorized',
        url: `/photos/${f.name}`
      });
    }
  }

  // sort deterministically (so ids stable) — by category then filename
  items.sort((a,b) => {
    if (a.category === b.category) return a.filename.localeCompare(b.filename, undefined, { numeric: true });
    return a.category.localeCompare(b.category);
  });

  // assign stable id (1-based) and write
  const out = items.map((it, i) => ({ id: String(i+1), ...it }));
  await fsp.writeFile(OUT, JSON.stringify(out, null, 2), 'utf8');
  console.log(`Wrote ${OUT} (${out.length} items)`);
}

async function main(){
  await scanOnce();
  if (WATCH) {
    console.log('Watching photos folder for changes...');
    fs.watch(PHOTOS_ROOT, { recursive: true }, () => {
      // debounce
      setTimeout(() => scanOnce().catch(err => console.error(err)), 300);
    });
  }
}

main().catch(err => { console.error(err); process.exit(1); });
