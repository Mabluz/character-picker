"use strict";
const app = require("express");
const router = app.Router();
const database = require("../service/database");

const BASE_URL = "https://randomboardgame.com";

router.get("/sitemap.xml", async (req, res) => {
  try {
    const result = await database.query(
      "SELECT id, updated_at FROM main_games ORDER BY id"
    );

    const staticUrls = [
      { loc: `${BASE_URL}/`, priority: "1.0" },
      { loc: `${BASE_URL}/donate`, priority: "0.3" }
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
