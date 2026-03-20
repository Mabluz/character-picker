"use strict";
const fs = require("fs");
const path = require("path");

const gamesDir = path.join(__dirname, "..", "games");

const getType = title => {
  const words = (title || "").toLowerCase().split(/\W+/);
  for (const word of words) {
    if (word === "sleeve" || word === "sleeves") return "sleeves";
    if (word === "expansion" || word === "expansions") return "expansion";
    if (word === "pack" || word === "packs") return "expansion";
    if (word === "organizer" || word === "organizers") return "other";
    if (word === "dice") return "other";
    if (word === "coin" || word === "coins") return "other";
  }
  return "game";
};

const folders = fs.readdirSync(gamesDir).filter(f =>
  fs.statSync(path.join(gamesDir, f)).isDirectory()
);

let totalUpdated = 0;

for (const folder of folders) {
  const loadPath = path.join(gamesDir, folder, "load.json");
  if (!fs.existsSync(loadPath)) continue;

  const data = JSON.parse(fs.readFileSync(loadPath, "utf-8"));
  if (!data.affiliate || !data.affiliate.ads) continue;

  let changed = false;
  for (const ad of data.affiliate.ads) {
    const type = getType(ad.title);
    if (ad.type !== type) {
      ad.type = type;
      changed = true;
      totalUpdated++;
    }
  }

  if (changed) {
    fs.writeFileSync(loadPath, JSON.stringify(data, null, 2) + "\n");
    console.log(`Updated: ${folder}`);
  }
}

console.log(`\nDone. ${totalUpdated} ads updated across ${folders.length} games.`);
