const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const ROOT = path.resolve(__dirname, '../..');
const INPUT = path.join(ROOT, 'ks-scrape.json');
const OUT_DIR = path.join(ROOT, 'ks-images');

const downloadFile = (url, dest) => new Promise((resolve, reject) => {
  if (fs.existsSync(dest)) { resolve(false); return; }
  const file = fs.createWriteStream(dest);
  const client = url.startsWith('https') ? https : http;
  client.get(url, (res) => {
    if (res.statusCode === 301 || res.statusCode === 302) {
      file.close();
      fs.unlinkSync(dest);
      downloadFile(res.headers.location, dest).then(resolve).catch(reject);
      return;
    }
    res.pipe(file);
    file.on('finish', () => file.close(() => resolve(true)));
  }).on('error', (err) => {
    fs.unlink(dest, () => {});
    reject(err);
  });
});

const extFromUrl = (url) => {
  const clean = url.split('?')[0];
  const ext = path.extname(clean).toLowerCase();
  return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext) ? ext : '.jpg';
};

const extractImgUrls = (html) =>
  [...html.matchAll(/<img[^>]+src="([^"]+)"/g)].map(m => m[1]).filter(Boolean);

(async () => {
  const posts = JSON.parse(fs.readFileSync(INPUT, 'utf8'));
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const startFrom = process.argv[2] ? parseInt(process.argv[2], 10) : null;
  const ordered = [...posts]
    .sort((a, b) => a.number - b.number)
    .filter(p => startFrom === null || p.number >= startFrom);

  let totalSaved = 0;

  for (const post of ordered) {
    if (!post.body) {
      console.log(`[${post.number}] ${post.title} — no body (re-run scrape:ks to fetch)`);
      continue;
    }

    const imgUrls = extractImgUrls(post.body);
    console.log(`[${post.number}] ${post.title} — ${imgUrls.length} image(s)`);
    if (imgUrls.length === 0) continue;

    const postDir = path.join(OUT_DIR, String(post.number).padStart(3, '0'));
    fs.mkdirSync(postDir, { recursive: true });

    for (let i = 0; i < imgUrls.length; i++) {
      const url = imgUrls[i];
      const ext = extFromUrl(url);
      const filename = `${String(i + 1).padStart(2, '0')}${ext}`;
      const dest = path.join(postDir, filename);
      try {
        const saved = await downloadFile(url, dest);
        console.log(`  ${saved ? 'Saved' : 'Skipped'}: ${filename}`);
        if (saved) totalSaved++;
      } catch (e) {
        console.error(`  Error: ${e.message}`);
      }
    }
  }

  console.log(`\nDone. ${totalSaved} images saved to ${OUT_DIR}`);
})().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
