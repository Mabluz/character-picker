"use strict";
const fs = require("fs");
const path = require("path");

const gamesDir = path.join(__dirname, "..", "games");

const getType = title => {
  const t = (title || "").toLowerCase();
  if (t.includes("card") && t.includes("sleeve")) return "sleeves";
  if (t.includes("expansion") || t.includes("pack")) return "expansion";
  if (t.includes("organizer") || t.includes("coins")) return "other";
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
