#!/usr/bin/env node
"use strict";

/**
 * build-load.js
 * Custom extraction script for Sword & Sorcery: Immortal Souls.
 * Reads tts-config.json, crops hero card images from spritesheets,
 * and writes load.json.
 *
 * Usage: node backend/games/sword-and-sorcery/build-load.js
 */

const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");

const CONFIG_PATH = path.join(__dirname, "tts-config.json");
const OUT_DIR = __dirname;

function downloadBuffer(url) {
  return new Promise((resolve, reject) => {
    const get = url.startsWith("https") ? https.get : http.get;
    get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadBuffer(res.headers.location).then(resolve).catch(reject);
      }
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => resolve(Buffer.concat(chunks)));
      res.on("error", reject);
    }).on("error", reject);
  });
}

async function cropCard(sheetUrl, cardId, numWidth, numHeight, outPath) {
  let sharp;
  try { sharp = require("sharp"); } catch {
    throw new Error("sharp not installed. Run: npm install sharp");
  }

  const pos = cardId % 100;
  const row = Math.floor(pos / numWidth);
  const col = pos % numWidth;

  console.log(`  Downloading sheet... (row ${row}, col ${col})`);
  const buf = await downloadBuffer(sheetUrl);
  const meta = await sharp(buf).metadata();

  const cardW = Math.floor(meta.width / numWidth);
  const cardH = Math.floor(meta.height / numHeight);

  await sharp(buf)
    .extract({ left: col * cardW, top: row * cardH, width: cardW, height: cardH })
    .jpeg({ quality: 90 })
    .toFile(outPath);
}

async function main() {
  const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
  const { gameId } = config;

  const heroesDir = path.join(OUT_DIR, "heroes");
  fs.mkdirSync(heroesDir, { recursive: true });

  // Cache downloaded spritesheets by URL to avoid re-downloading
  const sheetCache = new Map();

  const characters = [];

  for (const hero of config.heroes) {
    const filename = hero.name.toLowerCase().replace(/\s+/g, "-") + ".jpg";
    const outPath = path.join(heroesDir, filename);
    const localPath = `${gameId}/heroes/${filename}`;

    console.log(`Processing: ${hero.name} [${hero.expansion}]`);

    try {
      await cropCard(hero.sheetUrl, hero.cardId, hero.numWidth, hero.numHeight, outPath);
      console.log(`  Saved: ${localPath}`);
    } catch (err) {
      console.error(`  ERROR: ${err.message}`);
    }

    characters.push(`${hero.name}|${hero.expansion}|Hero|${localPath}`);
  }

  const loadJson = {
    tabs: [{ title: "Heroes", characters }],
    settings: config.settings,
    background: config.background,
    id: gameId,
  };

  const outPath = path.join(OUT_DIR, "load.json");
  fs.writeFileSync(outPath, JSON.stringify(loadJson, null, 2), "utf8");

  console.log(`\nWritten: ${outPath}`);
  console.log(`Total heroes: ${characters.length}`);
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
