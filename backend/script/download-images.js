#!/usr/bin/env node
"use strict";

/**
 * download-images.js <path-to-load.json>
 *
 * Finds all http(s) URLs in tabs[].characters (4th pipe-field) and background.url,
 * downloads them into a _pending/ subfolder next to load.json,
 * and writes a swap.json describing what was downloaded.
 *
 * Character images go to _pending/<filename>
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

const absoluteLoadPath = path.resolve(loadJsonPath);
if (!fs.existsSync(absoluteLoadPath)) {
  console.error(`File not found: ${absoluteLoadPath}`);
  process.exit(1);
}

const loadJson = JSON.parse(fs.readFileSync(absoluteLoadPath, "utf8"));
const gameDir = path.dirname(absoluteLoadPath);
const gameId = loadJson.id || path.basename(gameDir);
const pendingDir = path.join(gameDir, "_pending");
const swapJsonPath = path.join(gameDir, "swap.json");

// Collect character image URLs only
const entries = [];
const seen = new Set();

if (loadJson.tabs) {
  for (const tab of loadJson.tabs) {
    for (const char of tab.characters || []) {
      const parts = char.split("|");
      if (parts.length < 4) continue;
      const ref = parts[3].trim();
      if (!ref.startsWith("http://") && !ref.startsWith("https://")) continue;
      if (seen.has(ref)) continue;
      seen.add(ref);
      entries.push({ character: parts[0].trim(), url: ref });
    }
  }
}

// Background URL
let backgroundEntry = null;
const bgUrl = loadJson.background && loadJson.background.url;
if (bgUrl && (bgUrl.startsWith("http://") || bgUrl.startsWith("https://"))) {
  const ext = path.extname(new URL(bgUrl).pathname) || ".jpg";
  backgroundEntry = { url: bgUrl, filename: `bg${ext}`, relativePath: `${gameId}/background/bg${ext}` };
}

const totalCount = entries.length + (backgroundEntry ? 1 : 0);
console.log(`Found ${entries.length} unique HTTP(S) character image URLs${backgroundEntry ? " + 1 background" : ""}.\n`);

if (totalCount === 0) {
  console.log("Nothing to download.");
  process.exit(0);
}

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
      res.pipe(file);
      file.on("finish", () => file.close(() => resolve()));
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

async function run() {
  const swap = [];
  let downloaded = 0, skipped = 0, failed = 0;

  for (const { character, url } of entries) {
    const urlObj = new URL(url);
    const filename = path.basename(urlObj.pathname) || "image";
    const destPath = path.join(pendingDir, filename);
    // relativePath is what will replace the URL in load.json
    const relativePath = `${gameId}/${filename}`;

    if (fs.existsSync(destPath)) {
      console.log(`[SKIP]     ${filename}  (already in _pending/)`);
      skipped++;
    } else {
      process.stdout.write(`[DOWNLOAD] ${character}: ${url}\n           -> _pending/${filename} ... `);
      try {
        await downloadUrl(url, destPath);
        console.log("OK");
        downloaded++;
      } catch (err) {
        console.log(`FAILED (${err.message})`);
        failed++;
        continue; // don't add failed entries to swap.json
      }
    }

    swap.push({ character, url, filename, relativePath });
  }

  // Background
  if (backgroundEntry) {
    const { url, filename, relativePath } = backgroundEntry;
    const destPath = path.join(pendingDir, "background", filename);

    if (fs.existsSync(destPath)) {
      console.log(`[SKIP]     background/${filename}  (already in _pending/background/)`);
      skipped++;
      swap.push({ character: "background", url, filename: `background/${filename}`, relativePath });
    } else {
      process.stdout.write(`[DOWNLOAD] background: ${url}\n           -> _pending/background/${filename} ... `);
      try {
        await downloadUrl(url, destPath);
        console.log("OK");
        downloaded++;
        swap.push({ character: "background", url, filename: `background/${filename}`, relativePath });
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
