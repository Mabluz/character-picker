#!/usr/bin/env node
"use strict";

/**
 * download-images.js <path-to-load.json>
 *
 * Finds all http(s) URLs in tabs[].characters (4th pipe-field) and background.url,
 * downloads them into a _pending/<tab-slug>/ subfolder next to load.json,
 * and writes a swap.json describing what was downloaded.
 *
 * Character images go to _pending/<tab-slug>/<character-slug>.<ext>
 * Background image goes to _pending/background/bg.<ext>
 *
 * Inspect swap.json + _pending/ images, then run apply-swap.js to commit.
 */

const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");

const loadJsonPath = process.argv[2];

if (!loadJsonPath) {
  console.error("Usage: node download-images.js <path-to-load.json>");
  process.exit(1);
}

const absoluteLoadPath = path.resolve(loadJsonPath.replace(/^[/\\]*backend[/\\]/, ""));
if (!fs.existsSync(absoluteLoadPath)) {
  console.error(`File not found: ${absoluteLoadPath}`);
  process.exit(1);
}

const loadJson = JSON.parse(fs.readFileSync(absoluteLoadPath, "utf8"));
const gameDir = path.dirname(absoluteLoadPath);
const gameId = loadJson.id || path.basename(gameDir);
const pendingDir = path.join(gameDir, "_pending");
const swapJsonPath = path.join(gameDir, "swap.json");

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const CONTENT_TYPE_EXT = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/avif": ".avif",
  "image/bmp": ".bmp",
};

function extFromContentType(contentType) {
  if (!contentType) return null;
  const mime = contentType.split(";")[0].trim().toLowerCase();
  return CONTENT_TYPE_EXT[mime] || null;
}

// Collect character image URLs grouped by tab
const entries = [];
const seen = new Set();

if (loadJson.tabs) {
  for (let tabIndex = 0; tabIndex < loadJson.tabs.length; tabIndex++) {
    const tab = loadJson.tabs[tabIndex];
    const tabTitle = tab.title || `tab-${tabIndex + 1}`;
    const tabSlug = slugify(tabTitle);

    // Track used slugs within this tab to avoid collisions
    const usedSlugs = new Set();

    for (const char of tab.characters || []) {
      const parts = char.split("|");
      if (parts.length < 4) continue;
      const ref = parts[parts.length - 1].trim();
      if (!ref.startsWith("http://") && !ref.startsWith("https://")) continue;
      if (seen.has(ref)) continue;
      seen.add(ref);

      const charName = parts[0].replace(/^\|/, "").trim();
      const urlExt = path.extname(new URL(ref).pathname); // may be empty for Steam CDN etc.
      let baseSlug = slugify(charName) || "image";

      // Avoid slug collisions within the same tab
      let slug = baseSlug;
      let counter = 2;
      while (usedSlugs.has(slug)) {
        slug = `${baseSlug}-${counter++}`;
      }
      usedSlugs.add(slug);

      entries.push({ character: charName, url: ref, tabTitle, tabSlug, slug, urlExt });
    }
  }
}

// Background URL
let backgroundEntry = null;
const bgUrl = loadJson.background && loadJson.background.url;
if (bgUrl && (bgUrl.startsWith("http://") || bgUrl.startsWith("https://"))) {
  const urlExt = path.extname(new URL(bgUrl).pathname);
  backgroundEntry = { url: bgUrl, slug: "bg", urlExt };
}

const totalCount = entries.length + (backgroundEntry ? 1 : 0);
console.log(`Found ${entries.length} unique HTTP(S) character image URLs${backgroundEntry ? " + 1 background" : ""}.\n`);

if (totalCount === 0) {
  console.log("Nothing to download.");
  process.exit(0);
}

// Returns the content-type of the response (after redirects)
function downloadUrl(url, destPath, redirects = 0) {
  return new Promise((resolve, reject) => {
    if (redirects > 5) return reject(new Error("Too many redirects"));

    const dir = path.dirname(destPath);
    fs.mkdirSync(dir, { recursive: true });

    const file = fs.createWriteStream(destPath);
    const protocol = url.startsWith("https") ? https : http;

    const request = protocol.get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        file.close();
        if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
        return downloadUrl(res.headers.location, destPath, redirects + 1).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        file.close();
        if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      const contentType = res.headers["content-type"] || "";
      res.pipe(file);
      file.on("finish", () => file.close(() => resolve(contentType)));
      file.on("error", (err) => {
        if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
        reject(err);
      });
    });

    request.on("error", (err) => {
      if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
      reject(err);
    });

    request.setTimeout(15000, () => {
      request.destroy();
      reject(new Error("Timeout"));
    });
  });
}

// For URLs with no extension, find an already-downloaded file matching <slug>.* in dir
function findExistingFile(dir, slug) {
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir);
  const match = files.find((f) => path.basename(f, path.extname(f)) === slug && path.extname(f) !== ".tmp");
  return match ? path.join(dir, match) : null;
}

async function downloadEntry(url, tabSubdir, slug, urlExt) {
  const tabPendingDir = path.join(pendingDir, tabSubdir);

  if (urlExt) {
    // Known extension — straightforward
    const filename = `${slug}${urlExt}`;
    const destPath = path.join(tabPendingDir, filename);
    if (fs.existsSync(destPath)) return { filename: `${tabSubdir}/${filename}`, skipped: true };
    const contentType = await downloadUrl(url, destPath);
    return { filename: `${tabSubdir}/${filename}`, contentType };
  } else {
    // No extension in URL (e.g. Steam CDN) — detect from Content-Type
    const existing = findExistingFile(tabPendingDir, slug);
    if (existing) {
      const filename = `${tabSubdir}/${path.basename(existing)}`;
      return { filename, skipped: true };
    }
    const tmpPath = path.join(tabPendingDir, `${slug}.tmp`);
    const contentType = await downloadUrl(url, tmpPath);
    const ext = extFromContentType(contentType) || ".jpg";
    const finalPath = path.join(tabPendingDir, `${slug}${ext}`);
    fs.renameSync(tmpPath, finalPath);
    return { filename: `${tabSubdir}/${slug}${ext}`, contentType };
  }
}

function checkAlreadyPending(tabSubdir, slug, urlExt) {
  const dir = path.join(pendingDir, tabSubdir);
  if (urlExt) {
    const p = path.join(dir, `${slug}${urlExt}`);
    return fs.existsSync(p) ? `${tabSubdir}/${slug}${urlExt}` : null;
  }
  const existing = findExistingFile(dir, slug);
  return existing ? `${tabSubdir}/${path.basename(existing)}` : null;
}

async function run() {
  const swap = [];
  let downloaded = 0, skipped = 0, failed = 0;

  for (const { character, url, tabTitle, tabSlug, slug, urlExt } of entries) {
    const alreadyPending = checkAlreadyPending(tabSlug, slug, urlExt);

    if (alreadyPending) {
      console.log(`[SKIP]     _pending/${alreadyPending}  (already in _pending/)`);
      skipped++;
      swap.push({ character, url, filename: alreadyPending, relativePath: `${gameId}/${alreadyPending}` });
      continue;
    }

    process.stdout.write(`[DOWNLOAD] [${tabTitle}] ${character}: ${url}\n           -> _pending/${tabSlug}/${slug}${urlExt || ".<ext>"} ... `);
    let result;
    try {
      result = await downloadEntry(url, tabSlug, slug, urlExt);
      const extNote = !urlExt ? ` (detected ${result.contentType.split(";")[0].trim()})` : "";
      console.log(`OK${extNote}`);
      downloaded++;
    } catch (err) {
      console.log(`FAILED (${err.message})`);
      failed++;
      continue;
    }

    const { filename } = result;
    swap.push({ character, url, filename, relativePath: `${gameId}/${filename}` });
  }

  // Background
  if (backgroundEntry) {
    const { url, slug, urlExt } = backgroundEntry;
    const alreadyPending = checkAlreadyPending("background", slug, urlExt);

    if (alreadyPending) {
      console.log(`[SKIP]     _pending/${alreadyPending}  (already in _pending/)`);
      skipped++;
      swap.push({ character: "background", url, filename: alreadyPending, relativePath: `${gameId}/${alreadyPending}` });
    } else {
      process.stdout.write(`[DOWNLOAD] background: ${url}\n           -> _pending/background/${slug}${urlExt || ".<ext>"} ... `);
      try {
        const result = await downloadEntry(url, "background", slug, urlExt);
        const extNote = !urlExt ? ` (detected ${result.contentType.split(";")[0].trim()})` : "";
        console.log(`OK${extNote}`);
        downloaded++;
        swap.push({ character: "background", url, filename: result.filename, relativePath: `${gameId}/${result.filename}` });
      } catch (err) {
        console.log(`FAILED (${err.message})`);
        failed++;
      }
    }
  }

  fs.writeFileSync(swapJsonPath, JSON.stringify(swap, null, 2));
  console.log(`\nswap.json written with ${swap.length} entries -> ${swapJsonPath}`);
  console.log(`Done. Downloaded: ${downloaded}, Skipped: ${skipped}, Failed: ${failed}`);
  console.log("\nInspect _pending/ images, then run: node apply-swap.js <path-to-load.json>");
}

run().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
