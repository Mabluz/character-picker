"use strict";
const app = require("express");
const router = app.Router();
const fs = require("fs");
const path = require("path");
const database = require("../service/database");

const BASE_URL = "https://randomboardgame.com";

const lastmodPath = path.join(__dirname, "..", "lastmod.json");
const lastmodDates = fs.existsSync(lastmodPath)
  ? JSON.parse(fs.readFileSync(lastmodPath, "utf-8"))
  : {};

const toDateString = iso =>
  iso ? new Date(iso).toISOString().split("T")[0] : undefined;

router.get("/sitemap.xml", async (req, res) => {
  try {
    const result = await database.query(
      "SELECT id, updated_at FROM main_games ORDER BY id"
    );

    const staticUrls = [
      {
        loc: `${BASE_URL}/`,
        lastmod: toDateString(lastmodDates["_homepage"]),
        priority: "1.0"
      }
    ];

    const gameUrls = result.rows.map(row => ({
      loc: `${BASE_URL}/game/${row.id}`,
      lastmod: row.updated_at
        ? new Date(row.updated_at).toISOString().split("T")[0]
        : undefined,
      priority: "0.8"
    }));

    const allUrls = [...staticUrls, ...gameUrls];

    const urlEntries = allUrls
      .map(url => {
        const lastmod = url.lastmod
          ? `\n    <lastmod>${url.lastmod}</lastmod>`
          : "";
        return `  <url>
    <loc>${url.loc}</loc>${lastmod}
    <priority>${url.priority}</priority>
  </url>`;
      })
      .join("\n");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;

    res.header("Content-Type", "application/xml");
    res.send(xml);
  } catch (error) {
    console.error("Failed to generate sitemap:", error);
    res.status(500).send("Failed to generate sitemap");
  }
});

module.exports = router;
