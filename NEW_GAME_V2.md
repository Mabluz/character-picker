# Adding a New Game (V2 Process)

This document describes the full process for adding a new game using Tabletop Simulator as the image and character source. **This file is instructions for Claude** — follow each stage in order, pause at every `⏸ STOP` to wait for user input before continuing.

---

## Stage 1 — Identify the game

If the user hasn't already named the game, ask:
> "Which game would you like to add?"

---

## Stage 2 — BGG research (does the game fit?)

Use the BGG proxy to look up the game. BGG blocks direct requests — always use the proxy:

```bash
curl -s "http://localhost:1337/bgg/search?query=<game+name>"
# → get the BGG ID, then:
curl -s "http://localhost:1337/bgg/game/<bgg-id>"
```

Check the description, mechanics, and categories. The game fits if players **choose or are randomly assigned** characters, roles, monsters, or enemies before/during setup. Look for: asymmetric roles, variable player powers, hidden roles, character selection, semi-cooperative.

Write a short report (3–5 bullet points max):
- Game name, publisher, year
- Why it fits or doesn't fit the randomizer
- What would be randomized (e.g. "Survivors + Monsters", "Gearlocs + Tyrants")
- Known expansions from BGG

**⏸ STOP — show the report and wait for the user to confirm the game is a good fit before continuing.**

---

## Stage 3 — Download the TTS mod

Tell the user:

> "Please:
> 1. Subscribe to **[game name]** on the Steam Workshop (search for it in TTS or the Steam Workshop website)
> 2. Open Tabletop Simulator and load the mod to force all assets to download
> 3. Type **Continue** when ready"

**⏸ STOP — wait for "Continue".**

---

## Stage 4 — Analyse the TTS file

Find the downloaded workshop file:

```bash
node -e "
const d = require(process.env.HOME + '/Library/Tabletop Simulator/Mods/Workshop/WorkshopFileInfos.json');
d.forEach(f => console.log(f.Name, '->', f.Directory));
"
```

Match the game name to its workshop ID, then explore the file structure:

```bash
node -e "
const d = require(process.env.HOME + '/Library/Tabletop Simulator/Mods/Workshop/<id>.json');
d.ObjectStates.slice(0, 60).forEach(o =>
  console.log(o.Name.padEnd(25), JSON.stringify(o.Nickname||'').padEnd(35),
    'children:', o.ContainedObjects ? o.ContainedObjects.length : 0)
);
"
```

Identify:
- Which containers (usually `Custom_Model_Bag` named `"X tray"`) hold each character type
- What object type inside each tray holds the character name and image:
  - `Custom_Tile` → `CustomImage.ImageURL` (best: clean individual image, use directly)
  - `Card` / `CardCustom` → spritesheet (auto-cropped using CardID formula) or 1×1 direct
  - `Custom_Model` → **avoid** — `DiffuseURL` is a shared texture atlas, not croppable
- Whether character names come from `Custom_Tile.Nickname` or from the tray name itself

Write a short proposal:
> "I found X tabs:
> - **Tab 1 name** — `Custom_Tile` inside `"X tray"` bags, name from tile Nickname
> - **Tab 2 name** — `Card` inside `"X tray"` bags, name from tray name
> Does this look right, or do you want to change anything?"

**⏸ STOP — wait for the user to confirm or correct the tab structure.**

---

## Stage 5 — Write the tts-config.json

Create `backend/games/<game-id>/tts-config.json` following the format in `backend/script/tts-config-EXAMPLE.json`.

Fill in:
- `gameId`, `gameName`, `workshopId`
- `settings`: publisher name and link (from BGG research)
- `background`: placeholder path (`<game-id>/background/bg.jpg`)
- `tabs`: one entry per character type, with:
  - `title` and `tag` (e.g. `"Survivors"`, `"Survivor"`)
  - `source.type`: `"Custom_Tile"`, `"Card"`, or `"Custom_Model"`
  - `source.imageField`: `"CustomImage.ImageURL"` for tiles, `"spritesheet"` for cards
  - `source.nameFrom`: `"Custom_Tile"` (reads Nickname from tile) or `"tray"` (strips " tray" from bag name)
  - `trays`: list of all tray names with their expansion names
  - `pickTray`: add `"hasGearloc"` or `"noGearloc"` only when two trays share the same name

**Do not add `cardId` values yet** — those come from the "THIS" marks in Stage 6.

Then tell the user:

> "I've written the config with **X Gearlocs** and **Y Tyrants** (or equivalent).
>
> Now I need you to mark one card from each character in Tabletop Simulator:
>
> **For `Custom_Tile` items** (e.g. Gearlocs):
> The character name is already in the Name field, so put **THIS** in the **Description** field instead.
>
> **For `Card` items** (e.g. Tyrants):
> Put **THIS** in the **Name** field of the face card for each character.
>
> Open each tray, find the main character card/tile, mark it, then **save the game in TTS (Ctrl+S)**.
> Type **Continue** when done."

**⏸ STOP — wait for "Continue".**

---

## Stage 6 — Read the marks and complete the config

Scan the latest TTS save file for all "THIS" marks:

```bash
node -e "
const fs = require('fs');
const path = require('path');
const savesDir = path.join(process.env.HOME, 'Library/Tabletop Simulator/Saves');
const saves = fs.readdirSync(savesDir)
  .filter(f => f.endsWith('.json') && f !== 'SaveFileInfos.json')
  .map(f => ({ f, t: fs.statSync(path.join(savesDir, f)).mtimeMs }))
  .sort((a, b) => b.t - a.t);
const data = JSON.parse(fs.readFileSync(path.join(savesDir, saves[0].f), 'utf8'));
const workshop = JSON.parse(fs.readFileSync(path.join(process.env.HOME,
  'Library/Tabletop Simulator/Mods/Workshop/<id>.json'), 'utf8'));

const guidToTray = {};
workshop.ObjectStates.forEach(t => (t.ContainedObjects||[]).forEach(c => guidToTray[c.GUID] = t.Nickname));

const found = [];
function scan(o) {
  if (!o || typeof o !== 'object') return;
  if (o.Nickname === 'THIS' || o.Description === 'THIS') found.push(o);
  (o.ContainedObjects || o.ObjectStates || []).forEach(scan);
}
data.ObjectStates.forEach(scan);
found.forEach(o => {
  const tray = guidToTray[o.GUID] || '?';
  const img = (o.CustomImage && o.CustomImage.ImageURL) ||
              (o.CustomDeck && Object.values(o.CustomDeck)[0] && Object.values(o.CustomDeck)[0].FaceURL) || '-';
  console.log(o.Name.padEnd(14), 'Nickname:', (o.Nickname||'').padEnd(15),
    'CardID:', String(o.CardID||'-').padEnd(6), 'Tray:', tray.padEnd(25), img.slice(0,55));
});
"
```

From the results:
- For `Card` marks (Nickname=THIS): add `"cardId": <CardID>` to the matching tray entry in the config
- The `tts-import.js` script will automatically use Description=THIS marks for `Custom_Tile` items — no config update needed for those

---

## Stage 7 — Run the import

```bash
node script/tts-import.js games/<game-id>/tts-config.json
```

The script will:
- Use THIS-marked objects as the primary image source (Nickname or Description field)
- For `Custom_Tile`: use `CustomImage.ImageURL` directly (no download needed at this step)
- For `Card` 1×1: use `FaceURL` directly
- For `Card` spritesheet: download the sheet and crop the exact card using `sharp`
- Write `games/<game-id>/load.json`

Show the output and ask the user to verify the results.

**⏸ STOP — wait for the user to confirm the data looks correct.**

---

## Stage 8 — Give the user next steps

Once the user confirms, provide these commands (do **not** run them — let the user run them):

```bash
# 1. Download all URL-based images into _pending/
npm run download-images -- backend/games/<game-id>/load.json

# 2. Review the images in games/<game-id>/_pending/, then apply:
npm run apply-swap -- backend/games/<game-id>/load.json

# 3. Compress any images over 0.5 MB:
npm run compress-images -- backend/games/<game-id>

# 4. Add Amazon affiliate ads (optional):
npm run fetch-affiliate -- "https://amzn.to/XXXXX" backend/games/<game-id>/load.json --limit 6
```

---

## Stage 9 — Enrich character types via BGG research

The `tts-import.js` script writes the tab's `tag` value (e.g. `"Gearloc"`, `"Tyrant"`) as the type field for every character. This is a placeholder — replace it with meaningful, filterable data.

For each tab, decide what the type field should encode. Good candidates:

| Tab type | What to put in type | Example |
|---|---|---|
| Heroes / player characters | Playstyle keywords | `Ranged/Explosives/Area-Damage` |
| Enemies / bosses | Difficulty + mechanics | `PP:6/DAYS:8/Beginner` |
| Roles / classes | Role name + style | `Tank/Defensive/Shield` |

### How to research

Use the BGG proxy to look up each character or the expansion:

```bash
curl -s "http://localhost:1337/bgg/search?query=<game+name>+<character+name>"
curl -s "http://localhost:1337/bgg/game/<bgg-id>"
```

Read the description for keywords about mechanics, playstyle, and difficulty. Use 2–3 slash-separated keywords per character, consistent across the tab so they work as filters.

### Rules

- Keep keywords **short and consistent** — they appear as filter chips in the UI
- Use the **same vocabulary** across all characters in a tab (e.g. don't mix "Ranged" and "Range")
- If a game has numeric difficulty data (like PP/DAYS in Too Many Bones), include it **plus** a human-readable label: `PP:6/DAYS:8/Beginner`
- If no structured data exists, use 3 playstyle/role keywords derived from BGG descriptions

Update `load.json` directly — the type field is the 3rd pipe-separated value in each character string.

**⏸ STOP — show the enriched types and wait for user to confirm before finishing.**

---

## Key rules and lessons learned

### Marking objects with "THIS"

The script reads the latest TTS auto-save and looks for objects marked with "THIS":

| Object type | Which field to use | Why |
|---|---|---|
| `Custom_Tile` | **Description** | Nickname is already the character's name |
| `Card` / `CardCustom` | **Nickname** | No existing name — safe to overwrite |
| `Custom_Model` | — | Avoid: texture is a shared atlas, not croppable |

The script checks both fields automatically — you never need to specify which one was used.

### Object types and image sources

| TTS type | Image location | Quality | Notes |
|---|---|---|---|
| `Custom_Tile` | `CustomImage.ImageURL` | ✅ Best | Single clean portrait, use directly |
| `CardCustom` (1×1) | `CustomDeck[key].FaceURL` | ✅ Good | Single card image, use directly |
| `Card` (spritesheet) | `CustomDeck[key].FaceURL` + crop | ✅ Good | Script crops using CardID formula |
| `Custom_Model` | `CustomMesh.DiffuseURL` | ❌ Avoid | Shared texture atlas for all chips, position unknown without UV data |

### Spritesheet cropping formula

TTS `CardID = deckId * 100 + position`:
- `pos = CardID % 100`
- `row = Math.floor(pos / numWidth)`
- `col = pos % numWidth`
- Crop: `x = col * (sheetWidth / numWidth)`, `y = row * (sheetHeight / numHeight)`

### Disambiguating duplicate tray names

When two trays share a name (e.g. both a Gearloc and a Tyrant named "Duster"):
- Add `"pickTray": "hasGearloc"` to the entry that should use the tray **with** a named `Custom_Tile`
- Add `"pickTray": "noGearloc"` to the entry that should use the tray **without** one

### Config fields reference

```jsonc
{
  "gameId": "my-game",           // folder name under backend/games/
  "gameName": "My Game",
  "workshopId": "1234567890",    // Steam Workshop mod ID
  "settings": {
    "zoomHeight": "600",
    "contentOwnerName": "Publisher",
    "contentOwnerLink": "https://publisher.com"
  },
  "background": {
    "title": "My Game",
    "url": "my-game/background/bg.jpg",
    "transparent": 0.5
  },
  "tabs": [{
    "title": "Heroes",           // display name for the tab
    "tag": "Hero",               // tag written into each character string
    "source": {
      "type": "Custom_Tile",     // Custom_Tile | Card | Custom_Model
      "imageField": "CustomImage.ImageURL",  // or "spritesheet" for Card type
      "nameFrom": "Custom_Tile"  // "Custom_Tile" (reads Nickname) or "tray" (strips " tray")
    },
    "trays": [
      {
        "name": "Alice tray",    // exact Nickname of the bag in TTS
        "expansion": "Core Game",
        "cardId": 2008,          // (Card type only) pinned by THIS mark — filled in Stage 6
        "pickTray": "hasGearloc" // only needed when two trays share a name
      }
    ]
  }]
}
```
