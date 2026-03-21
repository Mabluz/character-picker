#!/usr/bin/env node
"use strict";

/**
 * apply-swap.js <path-to-load.json>
 *
 * Reads swap.json next to load.json, then for each entry:
 *   1. Copies the image from _pending/<filename> to the games folder at relativePath
 *   2. Rewrites load.json replacing the original URL with the relative path
 *      (covers characters, background.url, and backgroundUrl fields)
 *
 * Cleans up _pending/ and swap.json when done.
 */

const fs = require("fs");
const path = require("path");

const loadJsonPath = process.argv[2];

if (!loadJsonPath) {
  console.error("Usage: node apply-swap.js <path-to-load.json>");
  process.exit(1);
}

const absoluteLoadPath = path.resolve(
  loadJsonPath.replace(/^[/\\]*backend[/\\]/, "")
);
if (!fs.existsSync(absoluteLoadPath)) {
  console.error(`File not found: ${absoluteLoadPath}`);
  process.exit(1);
}

const gameDir = path.dirname(absoluteLoadPath);
const pendingDir = path.join(gameDir, "_pending");
const swapJsonPath = path.join(gameDir, "swap.json");
const gamesDir = path.resolve(path.join(__dirname, "..", "games"));

if (!fs.existsSync(swapJsonPath)) {
  console.error(`swap.json not found at ${swapJsonPath}`);
  console.error("Run download-images.js first.");
  process.exit(1);
}

const swap = JSON.parse(fs.readFileSync(swapJsonPath, "utf8"));
console.log(`Loaded swap.json with ${swap.length} entries.\n`);

let loadJsonText = fs.readFileSync(absoluteLoadPath, "utf8");
let applied = 0,
  missing = 0;

for (const { character, url, filename, relativePath } of swap) {
  const srcPath = path.join(pendingDir, filename);
  const destPath = path.join(gamesDir, relativePath);

  if (!fs.existsSync(srcPath)) {
    console.log(
      `[MISSING]  ${character}: _pending/${filename} not found, skipping`
    );
    missing++;
    continue;
  }

  // Copy image to games folder
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.copyFileSync(srcPath, destPath);
  console.log(`[COPY]     _pending/${filename} -> games/${relativePath}`);

  // Replace URL with relative path in load.json text
  loadJsonText = loadJsonText.split(url).join(relativePath);
  applied++;
}

// Write updated load.json
fs.writeFileSync(absoluteLoadPath, loadJsonText);
console.log(`\nload.json updated (${applied} URLs replaced).`);

// Cleanup _pending/ and swap.json
if (missing === 0) {
  fs.rmSync(pendingDir, { recursive: true, force: true });
  fs.unlinkSync(swapJsonPath);
  console.log("Cleaned up _pending/ and swap.json.");
} else {
  console.log(
    `\nWarning: ${missing} entries were missing. _pending/ and swap.json kept for retry.`
  );
}
