#!/usr/bin/env node
"use strict";

/**
 * tts-import.js <path-to-tts-config.json>
 *
 * Reads a tts-config.json for a game, extracts characters and images
 * from the Tabletop Simulator workshop file, and generates a load.json.
 *
 * Supported source types per tab:
 *   - "Custom_Tile"   : uses CustomImage.ImageURL directly (clean individual image, no crop needed)
 *   - "Custom_Model"  : uses CustomMesh.DiffuseURL as image URL (written to load.json as URL)
 *   - "Card"          : finds Card/CardCustom in the tray; use "cardId" in tray config to pin the
 *                       exact card, otherwise falls back to first card found. Crops individual card
 *                       from spritesheet using sharp; 1x1 cards are used as-is.
 *
 * Usage:
 *   node script/tts-import.js backend/games/too-many-bones/tts-config.json
 */

const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");

const TTS_WORKSHOP_DIR = path.join(
  process.env.HOME,
  "Library/Tabletop Simulator/Mods/Workshop"
);
const TTS_SAVES_DIR = path.join(
  process.env.HOME,
  "Library/Tabletop Simulator/Saves"
);

// ─── THIS-mark scanner ───────────────────────────────────────────────────────

/**
 * Finds the latest TTS save file and scans it for objects marked with "THIS"
 * in either their Nickname or Description field.
 *
 * Returns two lookup maps:
 *   byName[characterName]  -> marked object  (for tiles with a known Nickname)
 *   byTray[trayName]       -> marked object  (for cards traced back to a tray via GUID)
 */
function loadThisMarks(workshopData) {
  const saveFiles = ["TS_AutoSave.json", "TS_AutoSave_2.json", "TS_AutoSave_3.json",
                     "TS_Save_1.json", "TS_Save_2.json"]
    .map((f) => path.join(TTS_SAVES_DIR, f))
    .filter(fs.existsSync)
    .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);

  if (saveFiles.length === 0) {
    console.log("  No TTS save files found — skipping THIS-mark lookup.");
    return { byName: {}, byTray: {} };
  }

  const saveData = JSON.parse(fs.readFileSync(saveFiles[0], "utf8"));
  console.log(`  Using save: ${path.basename(saveFiles[0])}`);

  const marked = [];
  function scan(obj) {
    if (!obj || typeof obj !== "object") return;
    if (obj.Nickname === "THIS" || obj.Description === "THIS") marked.push(obj);
    (obj.ContainedObjects || obj.ObjectStates || []).forEach(scan);
  }
  saveData.ObjectStates.forEach(scan);

  // Build GUID -> tray name map from workshop
  const guidToTray = {};
  for (const tray of workshopData.ObjectStates) {
    if (!tray.ContainedObjects) continue;
    for (const child of tray.ContainedObjects) {
      guidToTray[child.GUID] = tray.Nickname;
    }
  }

  const byName = {};
  const byTray = {};

  for (const obj of marked) {
    // Description=THIS: name is in the Nickname field (e.g. Gearloc tiles)
    if (obj.Description === "THIS" && obj.Nickname && obj.Nickname !== "THIS") {
      byName[obj.Nickname.toLowerCase()] = obj;
    }
    // Nickname=THIS: trace back to tray via GUID (e.g. Tyrant cards)
    if (obj.Nickname === "THIS") {
      const trayName = guidToTray[obj.GUID];
      if (trayName) byTray[trayName] = obj;
    }
  }

  console.log(`  THIS marks: ${Object.keys(byName).length} by name, ${Object.keys(byTray).length} by tray\n`);
  return { byName, byTray };
}

// ─── helpers ────────────────────────────────────────────────────────────────

function slug(name) {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

function getNestedField(obj, fieldPath) {
  return fieldPath.split(".").reduce((o, k) => o && o[k], obj);
}

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

/**
 * TTS CardID formula:
 *   deckId  = Math.floor(cardId / 100)
 *   cardPos = cardId % 100   (0-indexed position in the spritesheet)
 *   row     = Math.floor(cardPos / numWidth)
 *   col     = cardPos % numWidth
 */
async function cropSpritesheetCard(sheetUrl, cardId, numWidth, numHeight, outPath) {
  let sharp;
  try { sharp = require("sharp"); } catch {
    throw new Error("sharp is not installed. Run: npm install sharp");
  }

  const pos = cardId % 100;
  const row = Math.floor(pos / numWidth);
  const col = pos % numWidth;

  console.log(`    Downloading spritesheet for crop (row ${row}, col ${col})...`);
  const sheetBuf = await downloadBuffer(sheetUrl);
  const meta = await sharp(sheetBuf).metadata();

  const cardW = Math.floor(meta.width / numWidth);
  const cardH = Math.floor(meta.height / numHeight);

  await sharp(sheetBuf)
    .extract({ left: col * cardW, top: row * cardH, width: cardW, height: cardH })
    .jpeg({ quality: 90 })
    .toFile(outPath);
}

// ─── tray finders ────────────────────────────────────────────────────────────

function findTray(objectStates, trayName, pickMode) {
  const matches = objectStates.filter(
    (o) => o.Name === "Custom_Model_Bag" && o.Nickname === trayName
  );
  if (matches.length === 0) return null;
  if (matches.length === 1) return matches[0];

  // Multiple trays with the same name — disambiguate
  if (pickMode === "hasGearloc") {
    return matches.find((t) =>
      t.ContainedObjects.some((o) => o.Name === "Custom_Tile" && o.Nickname)
    ) || matches[0];
  }
  if (pickMode === "noGearloc") {
    return matches.find((t) =>
      !t.ContainedObjects.some((o) => o.Name === "Custom_Tile" && o.Nickname)
    ) || matches[0];
  }
  return matches[0];
}

function getCharacterName(tray, nameFrom) {
  if (nameFrom === "Custom_Tile") {
    const tile = tray.ContainedObjects.find(
      (o) => o.Name === "Custom_Tile" && o.Nickname
    );
    if (tile) return tile.Nickname;
  }
  // Default: derive from tray name
  return tray.Nickname.replace(/ tray$/i, "");
}

// ─── extractors ─────────────────────────────────────────────────────────────

async function extractCustomTile(tray, trayConfig, tab, gameId, thisMarks) {
  const tile = tray.ContainedObjects.find(
    (o) => o.Name === "Custom_Tile" && o.Nickname
  );
  const name = (tile && tile.Nickname) || tray.Nickname.replace(/ tray$/i, "");

  // THIS-mark by name takes priority
  const marked = thisMarks.byName[name.toLowerCase()];
  if (marked) {
    const imageUrl = getNestedField(marked, tab.source.imageField);
    if (imageUrl) return { name, expansion: trayConfig.expansion, tag: tab.tag, imagePath: imageUrl };
  }

  if (!tile) {
    console.warn(`  WARN  No named Custom_Tile in "${tray.Nickname}"`);
    return { name, expansion: trayConfig.expansion, tag: tab.tag, imagePath: `${gameId}/${slug(name)}.jpg` };
  }
  const imageUrl = getNestedField(tile, tab.source.imageField);
  if (!imageUrl) console.warn(`  WARN  No image at ${tab.source.imageField} on tile in "${tray.Nickname}"`);
  return { name, expansion: trayConfig.expansion, tag: tab.tag, imagePath: imageUrl || `${gameId}/${slug(name)}.jpg` };
}

async function extractCustomModel(tray, trayConfig, tab, gameId, gameFolder) {
  const name = getCharacterName(tray, tab.source.nameFrom);
  const model = tray.ContainedObjects.find(
    (o) => o.Name === "Custom_Model" && getNestedField(o, tab.source.imageField)
  );
  if (!model) {
    console.warn(`  WARN  No Custom_Model with ${tab.source.imageField} in "${tray.Nickname}"`);
    return { name, expansion: trayConfig.expansion, tag: tab.tag, imagePath: `${gameId}/${slug(name)}.jpg` };
  }
  const imageUrl = getNestedField(model, tab.source.imageField);
  return { name, expansion: trayConfig.expansion, tag: tab.tag, imagePath: imageUrl };
}

async function extractCard(tray, trayConfig, tab, gameId, gameFolder, thisMarks) {
  const name = getCharacterName(tray, tab.source.nameFrom);

  // THIS-mark by tray takes priority over config cardId and first-card fallback
  const markedObj = thisMarks.byTray[tray.Nickname];
  const pinnedCardId = markedObj ? markedObj.CardID : trayConfig.cardId;

  const card = pinnedCardId != null
    ? tray.ContainedObjects.find(
        (o) => (o.Name === "Card" || o.Name === "CardCustom") && o.CardID === pinnedCardId
      ) || tray.ContainedObjects.find((o) => (o.Name === "Card" || o.Name === "CardCustom") && o.CustomDeck)
    : tray.ContainedObjects.find(
        (o) => (o.Name === "Card" || o.Name === "CardCustom") && o.CustomDeck
      );
  if (!card) {
    console.warn(`  WARN  No Card in "${tray.Nickname}"`);
    return { name, expansion: trayConfig.expansion, tag: tab.tag, imagePath: `${gameId}/${slug(name)}.jpg` };
  }

  const deck = Object.values(card.CustomDeck)[0];

  // 1×1 means it's an individual image — use directly
  if (deck.NumWidth === 1 && deck.NumHeight === 1) {
    return { name, expansion: trayConfig.expansion, tag: tab.tag, imagePath: deck.FaceURL };
  }

  // Spritesheet — crop and save locally
  const subDir = path.join(gameFolder, tab.title.toLowerCase());
  fs.mkdirSync(subDir, { recursive: true });
  const filename = `${slug(name)}.jpg`;
  const outPath = path.join(subDir, filename);
  const localPath = `${gameId}/${tab.title.toLowerCase()}/${filename}`;

  try {
    await cropSpritesheetCard(deck.FaceURL, card.CardID, deck.NumWidth, deck.NumHeight, outPath);
    console.log(`    Saved: ${localPath}`);
  } catch (err) {
    console.error(`    ERROR cropping "${name}": ${err.message}`);
    return { name, expansion: trayConfig.expansion, tag: tab.tag, imagePath: `${gameId}/${slug(name)}.jpg` };
  }

  return { name, expansion: trayConfig.expansion, tag: tab.tag, imagePath: localPath };
}

// ─── main ────────────────────────────────────────────────────────────────────

async function main() {
  const [, , configPath] = process.argv;

  if (!configPath) {
    console.error("Usage: node tts-import.js <path-to-tts-config.json>");
    process.exit(1);
  }

  const resolvedConfig = path.resolve(configPath);
  if (!fs.existsSync(resolvedConfig)) {
    console.error(`Config not found: ${resolvedConfig}`);
    process.exit(1);
  }

  const config = JSON.parse(fs.readFileSync(resolvedConfig, "utf8"));
  const gameFolder = path.dirname(resolvedConfig);
  const { gameId, gameName, workshopId } = config;

  // Load TTS workshop file
  const workshopPath = path.join(TTS_WORKSHOP_DIR, `${workshopId}.json`);
  if (!fs.existsSync(workshopPath)) {
    console.error(`TTS workshop file not found: ${workshopPath}`);
    console.error(`Make sure you have downloaded the mod in Tabletop Simulator.`);
    process.exit(1);
  }

  console.log(`Loading TTS mod: ${workshopPath}`);
  const ttsData = JSON.parse(fs.readFileSync(workshopPath, "utf8"));
  const objectStates = ttsData.ObjectStates;

  console.log(`Processing game: ${gameName} (${gameId})\n`);

  const thisMarks = loadThisMarks(ttsData);

  const tabs = [];

  for (const tabConfig of config.tabs) {
    console.log(`--- Tab: ${tabConfig.title} (${tabConfig.source.type}) ---`);
    const characters = [];

    for (const trayConfig of tabConfig.trays) {
      const tray = findTray(objectStates, trayConfig.name, trayConfig.pickTray);
      if (!tray) {
        console.warn(`  WARN  Tray not found: "${trayConfig.name}"`);
        continue;
      }

      let entry;
      if (tabConfig.source.type === "Custom_Tile") {
        entry = await extractCustomTile(tray, trayConfig, tabConfig, gameId, thisMarks);
      } else if (tabConfig.source.type === "Custom_Model") {
        entry = await extractCustomModel(tray, trayConfig, tabConfig, gameId, gameFolder);
      } else if (tabConfig.source.type === "Card") {
        entry = await extractCard(tray, trayConfig, tabConfig, gameId, gameFolder, thisMarks);
      } else {
        console.warn(`  WARN  Unknown source type: ${tabConfig.source.type}`);
        continue;
      }

      const characterString = `${entry.name}|${entry.expansion}|${entry.tag}|${entry.imagePath}`;
      characters.push(characterString);
      console.log(`  OK    ${entry.name} [${entry.expansion}]`);
    }

    tabs.push({ title: tabConfig.title, characters });
  }

  // Build load.json
  const loadJson = {
    tabs,
    settings: config.settings || {},
    background: config.background || {},
    id: gameId,
  };

  const loadJsonPath = path.join(gameFolder, "load.json");
  fs.writeFileSync(loadJsonPath, JSON.stringify(loadJson, null, 2), "utf8");

  console.log(`\nWritten: ${loadJsonPath}`);
  console.log(`Total characters: ${tabs.reduce((s, t) => s + t.characters.length, 0)}`);
  console.log(`\nNext steps:`);
  console.log(`  - Review load.json and verify expansion names`);
  console.log(`  - For URL-based images, run: npm run download-images -- ${path.relative(process.cwd(), loadJsonPath)}`);
  console.log(`  - Then: npm run apply-swap -- ${path.relative(process.cwd(), loadJsonPath)}`);
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
