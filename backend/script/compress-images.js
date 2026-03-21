#!/usr/bin/env node
"use strict";

/**
 * compress-images.js <game-folder>
 *
 * Recursively finds all images in the given game folder and compresses
 * them to under 0.5MB. Quality is reduced iteratively until the target
 * is met. PNGs that can't be reduced enough are converted to WebP.
 *
 * When a file extension changes, load.json and swap.json in the game
 * folder are updated to reflect the new filename.
 *
 * Supports: jpg, jpeg, png, webp, gif, avif
 *
 * Usage:
 *   node script/compress-images.js games/cthulhu-death-may-die
 */

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const THRESHOLD_BYTES = 0.5 * 1024 * 1024; // 0.5 MB
const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"]);

function findImages(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findImages(fullPath));
    } else if (IMAGE_EXTS.has(path.extname(entry.name).toLowerCase())) {
      results.push(fullPath);
    }
  }
  return results;
}

function formatSize(bytes) {
  return (bytes / 1024 / 1024).toFixed(2) + " MB";
}

async function compressToTarget(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const img = sharp(filePath);

  // For quality-based formats: step quality down from 80 → 10 until under threshold
  if ([".jpg", ".jpeg", ".webp", ".avif"].includes(ext)) {
    for (let quality = 80; quality >= 10; quality -= 10) {
      let buffer;
      if (ext === ".webp") {
        buffer = await sharp(filePath)
          .webp({ quality })
          .toBuffer();
      } else if (ext === ".avif") {
        buffer = await sharp(filePath)
          .avif({ quality })
          .toBuffer();
      } else {
        buffer = await sharp(filePath)
          .jpeg({ quality, progressive: true })
          .toBuffer();
      }

      if (buffer.length <= THRESHOLD_BYTES) {
        return { buffer, note: `quality ${quality}` };
      }
    }
    // Still too large — convert to WebP at low quality as last resort
    const buffer = await sharp(filePath)
      .webp({ quality: 10 })
      .toBuffer();
    return { buffer, note: "quality 10 (WebP fallback)", newExt: ".webp" };
  }

  // PNG: try max compression, then convert to WebP if still over threshold
  if (ext === ".png") {
    const buffer = await sharp(filePath)
      .png({ compressionLevel: 9, effort: 10 })
      .toBuffer();
    if (buffer.length <= THRESHOLD_BYTES) {
      return { buffer, note: "PNG max compression" };
    }
    for (let quality = 80; quality >= 10; quality -= 10) {
      const webpBuffer = await sharp(filePath)
        .webp({ quality })
        .toBuffer();
      if (webpBuffer.length <= THRESHOLD_BYTES) {
        return {
          buffer: webpBuffer,
          note: `converted to WebP quality ${quality}`,
          newExt: ".webp"
        };
      }
    }
    const webpBuffer = await sharp(filePath)
      .webp({ quality: 10 })
      .toBuffer();
    return {
      buffer: webpBuffer,
      note: "converted to WebP quality 10",
      newExt: ".webp"
    };
  }

  // GIF: best effort, no quality knob
  if (ext === ".gif") {
    const buffer = await img.gif().toBuffer();
    return { buffer, note: "GIF (no quality control)" };
  }

  return null;
}

/**
 * Update renamed file references in load.json and swap.json.
 *
 * load.json:
 *   - characters: only updates the 4th pipe-field when it is NOT a http(s) URL
 *   - background.url: skipped (always a remote URL)
 *
 * swap.json:
 *   - updates `filename` and `relativePath` fields only — NOT `url`
 */
function updateJsonRefs(gameFolder, oldName, newName) {
  const loadJsonPath = path.join(gameFolder, "load.json");
  const swapJsonPath = path.join(gameFolder, "swap.json");

  if (fs.existsSync(loadJsonPath)) {
    const loadJson = JSON.parse(fs.readFileSync(loadJsonPath, "utf8"));
    let changed = false;

    for (const tab of loadJson.tabs || []) {
      tab.characters = (tab.characters || []).map(entry => {
        const parts = entry.split("|");
        const imgField = parts[3];
        // Only update local paths (not http/https URLs)
        if (
          imgField &&
          !imgField.startsWith("http://") &&
          !imgField.startsWith("https://")
        ) {
          const updated = imgField.split(oldName).join(newName);
          if (updated !== imgField) {
            parts[3] = updated;
            changed = true;
          }
        }
        return parts.join("|");
      });
    }

    if (changed) {
      fs.writeFileSync(loadJsonPath, JSON.stringify(loadJson, null, 2), "utf8");
      console.log(`         → updated load.json (${oldName} → ${newName})`);
    }
  }

  if (fs.existsSync(swapJsonPath)) {
    const swapJson = JSON.parse(fs.readFileSync(swapJsonPath, "utf8"));
    let changed = false;

    for (const entry of swapJson) {
      // url is intentionally skipped
      if (entry.filename && entry.filename.includes(oldName)) {
        entry.filename = entry.filename.split(oldName).join(newName);
        changed = true;
      }
      if (entry.relativePath && entry.relativePath.includes(oldName)) {
        entry.relativePath = entry.relativePath.split(oldName).join(newName);
        changed = true;
      }
    }

    if (changed) {
      fs.writeFileSync(swapJsonPath, JSON.stringify(swapJson, null, 2), "utf8");
      console.log(`         → updated swap.json (${oldName} → ${newName})`);
    }
  }
}

async function main() {
  const [, , gameFolder] = process.argv;

  if (!gameFolder) {
    console.error("Usage: node compress-images.js <game-folder>");
    process.exit(1);
  }

  const resolvedFolder = path.resolve(
    gameFolder.replace(/^[/\\]*backend[/\\]/, "")
  );
  if (!fs.existsSync(resolvedFolder)) {
    console.error(`Folder not found: ${resolvedFolder}`);
    process.exit(1);
  }

  const images = findImages(resolvedFolder);
  console.log(`Found ${images.length} image(s) in ${resolvedFolder}\n`);

  let compressed = 0;
  let alreadySmall = 0;
  let failed = 0;
  let totalSaved = 0;

  for (const filePath of images) {
    const originalSize = fs.statSync(filePath).size;
    const rel = path.relative(resolvedFolder, filePath);

    if (originalSize <= THRESHOLD_BYTES) {
      console.log(
        `  SKIP  ${rel} (${formatSize(originalSize)} — already under 0.5 MB)`
      );
      alreadySmall++;
      continue;
    }

    try {
      const result = await compressToTarget(filePath);

      if (!result) {
        console.log(`  SKIP  ${rel} — unsupported format`);
        failed++;
        continue;
      }

      const { buffer, note, newExt } = result;
      const saved = originalSize - buffer.length;
      const underTarget = buffer.length <= THRESHOLD_BYTES;

      let outPath = filePath;
      if (newExt) {
        outPath = filePath.replace(/\.[^.]+$/, newExt);
        fs.unlinkSync(filePath);

        // Update load.json and swap.json with the renamed filename
        const oldName = path.basename(filePath);
        const newName = path.basename(outPath);
        updateJsonRefs(resolvedFolder, oldName, newName);
      }

      fs.writeFileSync(outPath, buffer);
      totalSaved += saved;
      compressed++;

      const sizeLabel = `${formatSize(originalSize)} → ${formatSize(
        buffer.length
      )}`;
      const targetLabel = underTarget ? "" : " [WARNING: still over 0.5 MB]";
      console.log(`  OK    ${rel} — ${sizeLabel} (${note})${targetLabel}`);
    } catch (err) {
      console.error(`  ERROR ${rel} — ${err.message}`);
      failed++;
    }
  }

  console.log(
    `\nDone. Compressed: ${compressed}, Already small: ${alreadySmall}, Failed: ${failed}, Total saved: ${formatSize(
      totalSaved
    )}`
  );
}

main().catch(err => {
  console.error("Error:", err.message);
  process.exit(1);
});
