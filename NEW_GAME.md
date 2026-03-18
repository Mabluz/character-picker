# New Game Setup

## Does the game fit this website?

**Before doing anything else**, verify the game is a good fit. This site is a randomizer for games where players pick or are assigned characters, roles, or monsters at the start of a session. A game fits if it has:

- **Player characters / investigators / survivors / (and so on)** that players choose or are randomly assigned
- **Monsters / villains / enemies / intruders / (and so on)** that are drawn randomly or set up from a pool each game
- **Asymmetric roles** where each player has a unique character with different abilities

A game does **not** fit if:
- All players use identical pieces or there is nothing to randomize
- Characters are fixed and always the same every game
- It's a pure abstract or card game with no character/role selection

**Use the BGG proxy to check:** fetch `http://localhost:1337/bgg/game/<id>` and read the description and mechanics. Look for keywords like "hidden roles", "asymmetric", "variable player powers", "semi-cooperative", "deck building with unique characters". If the game clearly doesn't support randomized character/monster selection, stop and inform the user rather than proceeding.

---

What we need to know the game is found in the template below.
- **Use the BGG proxy endpoint** to look up game info — BGG blocks direct bot requests but the proxy has an approved API key:
    - Search by title: curl -s "http://localhost:1337/bgg/search?query=<game+name>"
    - Full game details (expansions, description, categories): curl -s `http://localhost:1337/bgg/game/<bgg-id>`
    - Workflow: search first to get the BGG ID, then fetch full details for the game and each expansion

---

## Template

```
Create a new game under /backend/games/ with the following details:

**Game name:** <e.g. Deep Madness>
**Game ID (folder name):** <e.g. deep-madness>
**Publisher:** <e.g. Diemension Games>
**Publisher website:** <e.g. https://www.diemension.com/>
**Amazon affiliate link:** <paste link or leave blank>
**Amazon affiliate image:** <paste link or leave blank>
**Amazon affiliate title:** <paste link or leave blank>

**Expansions (if known):**
- Core Game
- <Expansion 1>
- <Expansion 2>

**Useful URLs for character research (optional):**
- <rulebook PDF, wiki, review site, etc.>

**Character tab names:** Investigators / Creatures  (or: Heroes / Monsters, Survivors / Enemies, etc.)

**Notes:** <anything else — e.g. "game has 2 separate monster decks per expansion", "characters have class tags like Combat/Support">
```

---

## load.json character format

Each character is a string with 4 pipe-separated fields:

```
"Name|Expansion|Tags|image-path"
```

- **Name** — character/monster name as printed on the card
- **Expansion** — expansion it belongs to (e.g. `Core Game`, `Innsmouth Conspiracy`)
- **Tags** — one or more `/`-separated tags used for filtering (e.g. `Hero/Support`, `Monster/Elite`, `Quarry/NQ2`). Use consistent tag names across the game.
- **image-path** — relative path from the backend `monsters/` or `background/` root (e.g. `deep-madness/detective.jpg`), **or a full `https://` URL** if the image hasn't been downloaded yet (see below)

Example with relative paths (images already local):
```json
"Sister Agnes|Core Game|Investigator/Support|deep-madness/sister-agnes.jpg",
"Shoggoth|Core Game|Monster/Elite|deep-madness/shoggoth.jpg"
```

Example with URLs (images to be downloaded later):
```json
"Sister Agnes|Core Game|Investigator/Support|https://example.com/agnes.jpg",
"Shoggoth|Core Game|Monster/Elite|https://example.com/shoggoth.jpg"
```

**REQUIRED: if you find a direct HTTPS image URL for a character when doing your research write it to the load.json.** Use the URL as the image-path value so images can be downloaded later. If you do not find a image during your research then write a placeholder local paths like `game-id/hero.jpg` — or use a local paths when the image file already exists on disk.

Workflow:
1. Identify the best image source for this game (see "Image sources" below).
2. For each character, find a direct `https://` URL pointing to a card-art image (JPG or PNG). Prefer cropped card faces over full-card scans with borders.
3. Put the URL in the `image-path` field of the character string.
4. Once all URLs are in the load.json, the user can run:
```bash
npm run download-images -- backend/games/<game-id>/load.json
# inspect _pending/ and swap.json, then:
npm run apply-swap -- backend/games/<game-id>/load.json
```

Disabled/unreleased entries are prefixed with a leading `|`:
```json
"|Future Character|Upcoming Expansion|Hero|deep-madness/future-hero.jpg"
```

---

## Image sources

When researching characters, note down where good images can be found. Record them here or in a comment in the load.json if found during research:

- **Official publisher website / shop** — product pages often have high-res card art
- **Kickstarter/BackerKit campaign pages** — update posts frequently show card art
- **Publisher press kits or BGG files section** — often has print-and-play or preview images
- **Fan wikis** (Fandom, dedicated wikis) — usually have cropped card art per character
- **`cdn.1j1ju.com`** — hosts rulebook PDFs that sometimes include character art
- **Game-specific card databases** (e.g. marvelcdb.com for Marvel Champions, arkhamdb.com for Arkham Horror) — structured card data with direct image URLs, often via a public JSON API
- If good image URLs are found during research, record them in a `## Image sources` section in the research output so they don't need to be re-found later

---

## Tips for faster research

- Rulebook PDFs (search: `"<game name>" rulebook filetype:pdf` or `cdn.1j1ju.com`) are the best source — they list all characters with roles.
- **Use the BGG proxy endpoint** to look up game info — BGG blocks direct bot requests but the proxy has an approved API key:
  - Search by title: curl -s `http://localhost:1337/bgg/search?query=<game+name>`
  - Full game details (expansions, description, categories): curl -s `http://localhost:1337/bgg/game/<bgg-id>`
  - Workflow: search first to get the BGG ID, then fetch full details for the game and each expansion
- Check `@BLOCKED_SITES.md` before fetching any URL — BGG and Gamefound always 403 when accessed directly.
- If a 403 is hit on a new domain, add it to `@BLOCKED_SITES.md`.
- When a good image source is found during research, document it immediately — it's easy to lose track of URLs mid-task.
