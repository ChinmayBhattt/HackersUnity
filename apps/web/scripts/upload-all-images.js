const fs = require('fs');
const path = require('path');
const { v2: cloudinary } = require('cloudinary');

// 1. Load env variables manually from apps/web/.env.local
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      process.env[match[1]] = value;
    }
  });
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

console.log('Using Cloudinary Cloud:', cloudinary.config().cloud_name);

const publicDir = path.resolve(__dirname, '../public');
const mappingFile = path.resolve(__dirname, '../lib/cloudinary-mapping.json');

let mapping = {};
if (fs.existsSync(mappingFile)) {
  try {
    mapping = JSON.parse(fs.readFileSync(mappingFile, 'utf8'));
  } catch {}
}

const queue = [];

// Branding
const rootFiles = ['logo-main.png', 'logo-black.png', 'logo.png', 'logo-transparent.png'];
for (const f of rootFiles) {
  const fullPath = path.join(publicDir, f);
  if (fs.existsSync(fullPath)) {
    queue.push({
      key: `/${f}`,
      fullPath,
      folder: 'hackers-unity/branding',
      publicId: path.parse(f).name,
    });
  }
}

// Subdirectories
const subdirs = ['blogs', 'podcasts', 'team', 'gallery', 'testimonials', 'clubs', 'mentors'];
for (const sub of subdirs) {
  const dirPath = path.join(publicDir, sub);
  if (!fs.existsSync(dirPath)) continue;
  const files = fs.readdirSync(dirPath);
  for (const f of files) {
    if (f.startsWith('.') || f.endsWith('.html') || f.endsWith('.svg') || f.endsWith('.ico')) continue;
    const fullPath = path.join(dirPath, f);
    if (!fs.statSync(fullPath).isFile()) continue;

    const baseName = path.parse(f).name.replace(/[^a-zA-Z0-9_-]/g, '_');
    queue.push({
      key: `/${sub}/${f}`,
      fullPath,
      folder: `hackers-unity/${sub}`,
      publicId: baseName,
    });
  }
}

console.log(`Total images to process: ${queue.length}`);

async function uploadItem(item) {
  if (mapping[item.key]) {
    console.log(`[SKIP] Already uploaded: ${item.key}`);
    return;
  }

  const start = Date.now();
  console.log(`[UPLOAD] Starting ${item.key}...`);
  try {
    const res = await cloudinary.uploader.upload(item.fullPath, {
      folder: item.folder,
      public_id: item.publicId,
      overwrite: true,
      resource_type: 'image',
    });

    const cdnUrl = res.secure_url;
    mapping[item.key] = cdnUrl;
    fs.writeFileSync(mappingFile, JSON.stringify(mapping, null, 2), 'utf8');
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`[DONE] ${item.key} -> ${cdnUrl} (${elapsed}s)`);
  } catch (err) {
    console.error(`[FAIL] ${item.key}:`, err.message);
  }
}

async function run() {
  const CONCURRENCY = 4;
  let index = 0;

  async function worker(workerId) {
    while (index < queue.length) {
      const current = queue[index++];
      await uploadItem(current);
    }
  }

  const workers = Array.from({ length: CONCURRENCY }, (_, i) => worker(i + 1));
  await Promise.all(workers);

  console.log('\n=======================================');
  console.log(`All uploads finished!`);
  console.log(`Total mapped: ${Object.keys(mapping).length} / ${queue.length}`);
  console.log(`Saved mapping to: ${mappingFile}`);
  console.log('=======================================');
}

run();
