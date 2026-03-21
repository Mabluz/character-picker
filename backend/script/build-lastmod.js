#!/usr/bin/env node
"use strict";

/**
 * build-lastmod.js
 * Generates backend/games/lastmod.json mapping each game folder to the
 * last git commit date of its load.json file.
 *
 * Usage: node backend/script/build-lastmod.js
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const gamesDir = path.join(__dirname, "..", "games");
const outPath = path.join(__dirname, "..", "lastmod.json");

const folders = fs.readdirSync(gamesDir).filter(f => {
  const folderPath = path.join(gamesDir, f);
  return (
    fs.statSync(folderPath).isDirectory() &&
    fs.existsSync(path.join(folderPath, "load.json"))
  );
});

const lastmod = {};

for (const folder of folders) {
  try {
    const date = execSync(`git log -1 --format=%aI -- "${folder}/load.json"`, {
      cwd: gamesDir,
      encoding: "utf-8"
    }).trim();
    lastmod[folder] = date || null;
  } catch {
    lastmod[folder] = null;
  }
}

fs.writeFileSync(outPath, JSON.stringify(lastmod, null, 2), "utf-8");
console.log(`Written ${outPath} with ${Object.keys(lastmod).length} entries`);
