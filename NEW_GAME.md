# New Game Setup

Use this template when asking Claude to add a new game. Fill in what you know — the more you provide, the faster it goes.

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

## Tips for faster research

- Rulebook PDFs (search: `"<game name>" rulebook filetype:pdf` or `cdn.1j1ju.com`) are the best source — they list all characters with roles.
- Check `@BLOCKED_SITES.md` before fetching any URL — BGG and Gamefound always 403.
- If a 403 is hit on a new domain, add it to `@BLOCKED_SITES.md`.
