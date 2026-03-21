"use strict";
const app = require("express");
const router = app.Router();
const cors = require("cors");
const axios = require("axios");
const xml2js = require("xml2js");

const BGG_API = "https://boardgamegeek.com/xmlapi2";
const BGG_API_KEY = process.env.BGG_API_KEY;

const BGG_HEADERS = {
  "User-Agent": "Mozilla/5.0 (compatible; randomboardgame.zellflagstad.com)",
  Accept: "text/xml,application/xml,*/*",
  "Accept-Language": "en-US,en;q=0.9",
  ...(BGG_API_KEY ? { Authorization: `Bearer ${BGG_API_KEY}` } : {})
};

async function fetchXml(url) {
  const response = await axios.get(url, {
    headers: BGG_HEADERS,
    responseType: "text"
  });
  // BGG returns 202 while processing - retry once after a short wait
  if (response.status === 202) {
    await new Promise(r => setTimeout(r, 3000));
    const retry = await axios.get(url, {
      headers: BGG_HEADERS,
      responseType: "text"
    });
    return retry.data;
  }
  return response.data;
}

async function parseXml(xml) {
  return xml2js.parseStringPromise(xml, {
    explicitArray: false,
    mergeAttrs: true
  });
}

// GET /bgg/search?query=Nemesis
router.get("/bgg/search", cors(), async (req, res) => {
  const query = req.query.query;
  if (!query) return res.status(400).json({ error: "Missing query parameter" });

  try {
    const xml = await fetchXml(
      `${BGG_API}/search?query=${encodeURIComponent(
        query
      )}&type=boardgame,boardgameexpansion`
    );
    const parsed = await parseXml(xml);
    const items = parsed.items && parsed.items.item;
    if (!items) return res.json({ results: [] });

    const list = Array.isArray(items) ? items : [items];
    const results = list.map(item => ({
      id: item.id,
      type: item.type,
      name: item.name
        ? Array.isArray(item.name)
          ? item.name.find(n => n.type === "primary") || item.name[0]
          : item.name
        : null,
      yearpublished: item.yearpublished ? item.yearpublished.value : null
    }));

    res.json({ results });
  } catch (err) {
    console.error("BGG search error:", err.message);
    res
      .status(502)
      .json({ error: "Failed to fetch from BGG", detail: err.message });
  }
});

// GET /bgg/game/:id  — full details for a specific BGG game/expansion
router.get("/bgg/game/:id", cors(), async (req, res) => {
  const id = req.params.id;
  if (!/^\d+(,\d+)*$/.test(id))
    return res.status(400).json({ error: "Invalid id" });

  try {
    const xml = await fetchXml(`${BGG_API}/thing?id=${id}&stats=1`);
    const parsed = await parseXml(xml);
    const raw = parsed.items && parsed.items.item;
    if (!raw) return res.status(404).json({ error: "Not found" });

    const items = Array.isArray(raw) ? raw : [raw];
    const results = items.map(item => {
      const names = item.name
        ? Array.isArray(item.name)
          ? item.name
          : [item.name]
        : [];
      const primaryName = names.find(n => n.type === "primary") || names[0];

      const links = item.link
        ? Array.isArray(item.link)
          ? item.link
          : [item.link]
        : [];
      const groupLinks = type =>
        links
          .filter(l => l.type === type)
          .map(l => ({ id: l.id, name: l.value }));

      return {
        id: item.id,
        type: item.type,
        name: primaryName ? primaryName.value : null,
        alternateNames: names
          .filter(n => n.type !== "primary")
          .map(n => n.value),
        yearpublished: item.yearpublished ? item.yearpublished.value : null,
        description: item.description || null,
        minplayers: item.minplayers ? item.minplayers.value : null,
        maxplayers: item.maxplayers ? item.maxplayers.value : null,
        image: item.image || null,
        thumbnail: item.thumbnail || null,
        categories: groupLinks("boardgamecategory"),
        mechanics: groupLinks("boardgamemechanic"),
        designers: groupLinks("boardgamedesigner"),
        publishers: groupLinks("boardgamepublisher"),
        expansions: groupLinks("boardgameexpansion"),
        implementations: groupLinks("boardgameimplementation"),
        rating:
          item.statistics && item.statistics.ratings
            ? {
                average: item.statistics.ratings.average
                  ? item.statistics.ratings.average.value
                  : null,
                usersrated: item.statistics.ratings.usersrated
                  ? item.statistics.ratings.usersrated.value
                  : null,
                bggrank:
                  item.statistics.ratings.ranks &&
                  item.statistics.ratings.ranks.rank
                    ? Array.isArray(item.statistics.ratings.ranks.rank)
                      ? item.statistics.ratings.ranks.rank.find(
                          r => r.name === "boardgame"
                        )
                      : item.statistics.ratings.ranks.rank
                    : null
              }
            : null
      };
    });

    res.json({ results });
  } catch (err) {
    console.error("BGG game error:", err.message);
    res
      .status(502)
      .json({ error: "Failed to fetch from BGG", detail: err.message });
  }
});

module.exports = router;
